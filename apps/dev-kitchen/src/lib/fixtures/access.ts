/**
 * Fixtures for the @sveltebuilder/access showcase, declared against the package's exported
 * types so a prop the components stop accepting is a `pnpm check` failure here.
 *
 * Copy is not on the records: the components resolve it through a dictionary, which
 * `accessDictionary()` builds from `COPY`, the way a screen builds one from its loader's
 * payload. The `access` UI strings match the scaffold's seed (supabase/seeds/01-access.sql);
 * the scope and verb labels are the ones a module would seed for itself.
 */
import { createDictionary, type DictionaryInstance, type DictionaryPayload } from 'diglossia';
import type { Permission, Role } from '@sveltebuilder/access/schema';
import type { RoleAssignmentRow, UserAccountOption, UserGroupMemberRow } from '@sveltebuilder/access/views';

const AT = '2026-10-01T09:00:00.000Z';

export const PERMISSIONS = [
  { id: 1, scope: 'article', action: 'read' },
  { id: 2, scope: 'article', action: 'create' },
  { id: 3, scope: 'article', action: 'update' },
  { id: 4, scope: 'article', action: 'delete' },
  { id: 5, scope: 'article', action: 'share' },
  { id: 6, scope: 'article', action: 'publish' },
  { id: 7, scope: 'section', action: 'read' },
  { id: 8, scope: 'section', action: 'update' },
  { id: 9, scope: 'media_asset', action: 'read' },
  { id: 10, scope: 'media_asset', action: 'update' },
] satisfies Permission[];

export const COPY_DESK: Role = { id: 1, slug: null, createdAt: AT, updatedAt: null };
export const CONTENT_EDITOR: Role = { id: 2, slug: 'content_editor', createdAt: AT, updatedAt: null };

/** The permissions each role holds. */
export const COPY_DESK_PERMISSION_IDS = [1, 3, 7, 9];
export const CONTENT_EDITOR_PERMISSION_IDS = [1, 2, 3, 5, 6, 7, 8, 9, 10];

const user = (id: number, emailAddress: string): UserAccountOption => ({ id, emailAddress });

export const GABBY = user(1, 'gabby.pennywhistle@puddleby.test');
export const DAVID = user(2, 'david.okafor@puddleby.test');
export const AGATHA = user(3, 'agatha.brisk@puddleby.test');

const SPORTS_DESK = { id: 7, external: false };
const PUDDLEBY_WIRE = { id: 8, external: true };

/** One article's access, as list_article_access returns it: direct rows first. */
export const ARTICLE_ACCESS: RoleAssignmentRow[] = [
  {
    id: 11, roleId: 1, userAccount: GABBY, userGroup: null, scope: 'article', entityId: 42,
    grantedBy: DAVID, grantedAt: AT, expiresAt: null,
  },
  {
    id: 12, roleId: 1, userAccount: null, userGroup: PUDDLEBY_WIRE, scope: 'article', entityId: 42,
    grantedBy: DAVID, grantedAt: AT, expiresAt: '2026-12-31T23:59:00.000Z',
  },
  {
    id: 3, roleId: 2, userAccount: DAVID, userGroup: null, scope: null, entityId: null,
    grantedBy: AGATHA, grantedAt: AT, expiresAt: null,
  },
  {
    id: 4, roleId: 1, userAccount: null, userGroup: SPORTS_DESK, scope: 'article', entityId: null,
    grantedBy: AGATHA, grantedAt: AT, expiresAt: null,
  },
];

export const SPORTS_DESK_MEMBERS: UserGroupMemberRow[] = [
  { userGroupId: 7, userAccount: GABBY, createdAt: '2026-09-14T10:00:00.000Z' },
  { userGroupId: 7, userAccount: AGATHA, createdAt: '2026-09-20T15:30:00.000Z' },
];

/** [slug, scope, entityId, content] */
type CopyRow = [string, string | null, number | null, string];

const access = (slug: string, content: string): CopyRow => [slug, 'access', null, content];

const COPY: CopyRow[] = [
  access('access.permission_action.read', 'Read'),
  access('access.permission_action.create', 'Create'),
  access('access.permission_action.update', 'Edit'),
  access('access.permission_action.delete', 'Delete'),
  access('access.permission_action.share', 'Share'),
  access('access.permission_action.publish', 'Publish'),
  access('access.permission_scope.article', 'Articles'),
  access('access.permission_scope.section', 'Sections'),
  access('access.permission_scope.media_asset', 'Media'),
  access('access.role_permission.caption', 'Permissions of {$role}'),
  access('access.role_assignment.principal', 'Who'),
  access('access.role_assignment.role', 'Role'),
  access('access.role_assignment.target', 'Applies to'),
  access('access.role_assignment.expires_at', 'Ends'),
  access('access.role_assignment.action', 'Actions'),
  access('access.role_assignment.target_global', 'Everywhere'),
  access('access.role_assignment.target_scope', '{$scope} (all)'),
  access('access.role_assignment.target_entity', 'This item only'),
  access('access.role_assignment.no_expiry', 'No end date'),
  access('access.role_assignment.expired', 'Expired'),
  access('access.role_assignment.empty', 'No one has access this way.'),
  access('access.role_assignment_panel.title', 'Who has access'),
  access('access.role_assignment_panel.direct', 'Given on this item'),
  access('access.role_assignment_panel.inherited', 'From broader roles'),
  access(
    'access.role_assignment_panel.inherited_hint',
    'Access from a broader role is changed on that user’s or group’s page, not here.'
  ),
  access('access.user_group.external', 'External'),
  access('access.user_group_member.email_address', 'Email address'),
  access('access.user_group_member.created_at', 'Added'),
  access('access.user_group_member.action', 'Actions'),
  access('access.user_group_member.empty', 'No members yet.'),
  ['name', 'role', 1, 'Copy desk'],
  ['name', 'role', 2, 'Content editor'],
  ['name', 'user_group', 7, 'Sports desk'],
  ['name', 'user_group', 8, 'Puddleby Wire'],
];

const COPY_PAYLOAD: DictionaryPayload = COPY.map(([slug, scope, entityId, content], index) => ({
  link: { id: index + 1, slug, scope, entityId },
  content,
  localeCode: 'en',
}));

export function accessDictionary(): DictionaryInstance {
  return createDictionary(COPY_PAYLOAD);
}
