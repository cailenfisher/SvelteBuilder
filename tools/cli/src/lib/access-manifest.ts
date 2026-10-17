import type { DiscoveredSchemaManifest } from './discover.ts';

/**
 * What a module's registry manifest declares under `access` (docs/ACCESS-CONTROL.md §4).
 *
 * `permission` is the catalog: each scope (an entity's table name) with the actions it offers.
 * `entity` lists the scopes whose single rows can be granted, each of which gets a generated
 * `<scope>_role_assignment` table and its functions.
 */
export type AccessDeclaration = {
  permission: Record<string, string[]>;
  entity: string[];
};

/** Every module's declaration, merged, with the manifest each scope came from. */
export type AccessCatalog = {
  permission: Map<string, string[]>;
  entity: string[];
  /** Scope → the manifest file that declared it. */
  source: Map<string, string>;
};

/**
 * A scope or action becomes part of SQL identifiers (`current_user_<scope>_ids`) and literals,
 * so it is held to Postgres's unquoted identifier shape. Nothing from a manifest reaches SQL
 * without passing this.
 */
const IDENTIFIER = /^[a-z][a-z0-9_]*$/;

/** Postgres truncates an identifier longer than this, which could make two of them collide. */
export const POSTGRES_IDENTIFIER_LIMIT = 63;

const ACCESS_KEYS = new Set(['permission', 'entity']);

export class AccessManifestError extends Error {
  constructor(file: string, problem: string) {
    super(`${file}: access: ${problem}`);
    this.name = 'AccessManifestError';
  }
}

/** Validates one manifest's `access` key, or returns null when it has none. */
export function parseAccessDeclaration(manifest: DiscoveredSchemaManifest): AccessDeclaration | null {
  const { access, file } = manifest;
  if (access === undefined) return null;

  if (typeof access !== 'object' || access === null || Array.isArray(access)) {
    throw new AccessManifestError(file, 'must be an object with `permission` and optionally `entity`');
  }

  for (const key of Object.keys(access)) {
    if (!ACCESS_KEYS.has(key)) {
      throw new AccessManifestError(file, `unknown key \`${key}\` (expected \`permission\`, \`entity\`)`);
    }
  }

  const { permission: rawPermission, entity: rawEntity } = access as Record<string, unknown>;

  if (typeof rawPermission !== 'object' || rawPermission === null || Array.isArray(rawPermission)) {
    throw new AccessManifestError(file, '`permission` must map each scope to its list of actions');
  }

  const permission: Record<string, string[]> = {};
  for (const [scope, actions] of Object.entries(rawPermission)) {
    if (!IDENTIFIER.test(scope)) {
      throw new AccessManifestError(file, `scope \`${scope}\` must be a lower-case table name`);
    }
    if (!Array.isArray(actions) || actions.length === 0) {
      throw new AccessManifestError(file, `\`permission.${scope}\` must be a non-empty list of actions`);
    }
    const seen = new Set<string>();
    for (const action of actions) {
      if (typeof action !== 'string' || !IDENTIFIER.test(action)) {
        throw new AccessManifestError(file, `\`permission.${scope}\` has an invalid action ${JSON.stringify(action)}`);
      }
      if (seen.has(action)) {
        throw new AccessManifestError(file, `\`permission.${scope}\` lists \`${action}\` twice`);
      }
      seen.add(action);
    }
    permission[scope] = actions as string[];
  }

  let entity: string[] = [];
  if (rawEntity !== undefined) {
    if (!Array.isArray(rawEntity) || rawEntity.some((scope) => typeof scope !== 'string')) {
      throw new AccessManifestError(file, '`entity` must be a list of scopes');
    }
    entity = rawEntity as string[];
    for (const scope of entity) {
      const actions = permission[scope];
      if (actions === undefined) {
        throw new AccessManifestError(file, `\`entity\` lists \`${scope}\`, which \`permission\` does not declare`);
      }
      // Sharing is how a single row's access is granted at all (A12); a scope with entity-level
      // assignments and no `share` would have a table nobody could write to.
      if (!actions.includes('share')) {
        throw new AccessManifestError(file, `\`entity\` lists \`${scope}\`, whose permissions do not include \`share\``);
      }
    }
    if (new Set(entity).size !== entity.length) {
      throw new AccessManifestError(file, '`entity` lists a scope twice');
    }
  }

  return { permission, entity };
}

/**
 * Merges every manifest's declaration. A scope belongs to one module: two manifests declaring
 * the same scope would each believe they own its catalog, so that is an error, not a merge.
 */
export function collectAccessCatalog(manifests: readonly DiscoveredSchemaManifest[]): AccessCatalog {
  const catalog: AccessCatalog = { permission: new Map(), entity: [], source: new Map() };

  for (const manifest of manifests) {
    const declaration = parseAccessDeclaration(manifest);
    if (declaration === null) continue;

    for (const [scope, actions] of Object.entries(declaration.permission)) {
      const owner = catalog.source.get(scope);
      if (owner !== undefined) {
        throw new AccessManifestError(manifest.file, `scope \`${scope}\` is already declared by ${owner}`);
      }
      catalog.permission.set(scope, actions);
      catalog.source.set(scope, manifest.file);
    }
    catalog.entity.push(...declaration.entity);
  }

  catalog.entity.sort();
  return catalog;
}
