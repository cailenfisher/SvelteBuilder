/**
 * The actions every access-controlled scope can offer. A module adds its own verbs beside
 * them (`publish`, `receive`), which is why `permission.action` is `text` rather than an enum:
 * no single declaration could list every module's verbs (A4 in
 * docs/ACCESS-CONTROL-DECISIONS.md).
 *
 * `share` is the right to grant access to one row to someone else. `create` is meaningful only
 * at a global or scope target, since there is no row to target before it exists.
 */
export const STANDARD_PERMISSION_ACTIONS = ['read', 'create', 'update', 'delete', 'share'] as const;

export type StandardPermissionAction = (typeof STANDARD_PERMISSION_ACTIONS)[number];

/**
 * An action named by a permission: a standard one, or a module's own verb. The `string & {}`
 * arm keeps editor completion for the standard actions while admitting any module verb.
 */
export type PermissionAction = StandardPermissionAction | (string & {});
