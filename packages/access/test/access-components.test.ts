/**
 * The access components render server-side with their dictionary passed as a prop, the way a
 * screen passes it, and ask for no copy the fixture lacks. That second half is the gate that
 * catches a component asking for a slug the seed does not write, which renders `[missing: …]`
 * and still ships: `onMissing` records every key not found.
 */
import { describe, expect, it } from 'vitest';
import { createRawSnippet, type Component } from 'svelte';
import { render } from 'svelte/server';
import { createDictionary, type DictionaryPayload } from 'diglossia';

import RoleAssignmentPanel from '../src/lib/Role/RoleAssignment/RoleAssignmentPanel.svelte';
import RoleAssignmentTable from '../src/lib/Role/RoleAssignment/RoleAssignmentTable.svelte';
import RolePermissionMatrix from '../src/lib/Role/RolePermission/RolePermissionMatrix.svelte';
import UserGroupMemberTable from '../src/lib/UserGroup/UserGroupMember/UserGroupMemberTable.svelte';
import type { Permission, Role } from '../src/lib/schema/index.js';
import type { RoleAssignmentRow, UserGroupMemberRow } from '../src/lib/views.js';

/** [slug, scope, entityId, content] */
type CopySpec = [string, string | null, number | null, string];

const access = (slug: string, content: string): CopySpec => [slug, 'access', null, content];

const COPY: CopySpec[] = [
  access('access.permission_action.read', 'Read'),
  access('access.permission_action.update', 'Edit'),
  access('access.permission_action.share', 'Share'),
  access('access.permission_action.publish', 'Publish'),
  access('access.permission_scope.article', 'Articles'),
  access('access.permission_scope.section', 'Sections'),
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
  access('access.role_assignment_panel.inherited_hint', 'Change broader access on the user’s or group’s page.'),
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

function renderWithCopy(component: Component<never>, props: Record<string, unknown>): { html: string; missing: string[] } {
  const missing: string[] = [];
  const payload: DictionaryPayload = COPY.map(([slug, scope, entityId, content], index) => ({
    link: { id: index + 1, slug, scope, entityId },
    content,
    localeCode: 'en',
  }));
  const dictionary = createDictionary(payload, {
    onMissing: ({ key }) => {
      missing.push(key);
      return undefined;
    },
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = render(component as any, { props: { ...props, dictionary } });
  return { html: result.body, missing };
}

const permission = (id: number, scope: string, action: string): Permission => ({ id, scope, action });

const PERMISSIONS: Permission[] = [
  permission(1, 'article', 'publish'),
  permission(2, 'article', 'read'),
  permission(3, 'article', 'update'),
  permission(4, 'article', 'share'),
  permission(5, 'section', 'read'),
];

const role = (id: number, slug: string | null): Role => ({
  id,
  slug,
  createdAt: '2026-10-01T00:00:00.000Z',
  updatedAt: null,
});

const user = (id: number) => ({ id, emailAddress: `user-${id}@example.test` });

const assignment = (overrides: Partial<RoleAssignmentRow>): RoleAssignmentRow => ({
  id: 1,
  roleId: 1,
  userAccount: user(1),
  userGroup: null,
  scope: 'article',
  entityId: 42,
  grantedBy: user(9),
  grantedAt: '2026-10-01T00:00:00.000Z',
  expiresAt: null,
  ...overrides,
});

const ASSIGNMENTS: RoleAssignmentRow[] = [
  assignment({ id: 1 }),
  assignment({ id: 2, userAccount: null, userGroup: { id: 8, external: true }, expiresAt: '2000-01-01T00:00:00.000Z' }),
  assignment({ id: 3, roleId: 2, userAccount: user(2), entityId: null, scope: 'article' }),
  assignment({ id: 4, roleId: 2, userAccount: null, userGroup: { id: 7, external: false }, entityId: null, scope: null }),
];

const removeAction = createRawSnippet((roleAssignment: () => RoleAssignmentRow) => ({
  render: () => `<button type="submit" class="remove">Remove ${roleAssignment().id}</button>`,
}));

describe('RolePermissionMatrix', () => {
  const { html, missing } = renderWithCopy(RolePermissionMatrix as Component<never>, {
    role: role(1, null),
    permissions: PERMISSIONS,
    rolePermissionIds: [2, 3],
    name: 'permission_id',
  });

  it('asks for no copy the seed lacks', () => {
    expect(missing).toEqual([]);
  });

  it('is captioned by the role’s name', () => {
    expect(html).toContain('Permissions of Copy desk');
  });

  it('puts standard actions first, in their order, then module verbs', () => {
    const headers = [...html.matchAll(/id="role-permission-1-column-([a-z_]+)"/g)].map((m) => m[1]);
    expect(headers).toEqual(['read', 'update', 'share', 'publish']);
  });

  it('lists each scope once, by its label', () => {
    expect(html.match(/>Articles</g)).toHaveLength(1);
    expect(html).toContain('>Sections<');
  });

  it('checks what the role holds and submits each permission by id', () => {
    expect(html).toMatch(/aria-labelledby="role-permission-1-row-article role-permission-1-column-read"[^>]*aria-checked="true"/);
    expect(html).toMatch(/aria-labelledby="role-permission-1-row-article role-permission-1-column-publish"[^>]*aria-checked="false"/);
    expect([...html.matchAll(/name="permission_id"[^>]*value="(\d+)"|value="(\d+)"[^>]*name="permission_id"/g)]).toHaveLength(5);
  });

  it('is read-only for a module-managed role, and submits nothing', () => {
    const managed = renderWithCopy(RolePermissionMatrix as Component<never>, {
      role: role(2, 'content_editor'),
      permissions: PERMISSIONS,
      rolePermissionIds: [2],
      name: 'permission_id',
    });
    expect(managed.missing).toEqual([]);
    expect(managed.html).not.toMatch(/name="permission_id"/);
    expect(managed.html.match(/aria-readonly="true"/g)).toHaveLength(5);
  });
});

describe('RoleAssignmentTable', () => {
  const { html, missing } = renderWithCopy(RoleAssignmentTable as Component<never>, {
    caption: 'Assignments',
    roleAssignments: ASSIGNMENTS,
    locale: 'en',
    rowAction: removeAction,
  });

  it('asks for no copy the seed lacks', () => {
    expect(missing).toEqual([]);
  });

  it('names a user by email, and a group by name, marking an external one in words', () => {
    expect(html).toContain('user-1@example.test');
    expect(html).toContain('Puddleby Wire');
    expect(html).toMatch(/Puddleby Wire[\s\S]*?External/);
  });

  it('says where each assignment applies', () => {
    expect(html).toContain('This item only');
    expect(html).toContain('Articles (all)');
    expect(html).toContain('Everywhere');
  });

  it('shows an end date, marks one past, and says when there is none', () => {
    expect(html).toMatch(/<time datetime="2000-01-01T00:00:00.000Z">/);
    expect(html).toContain('Expired');
    expect(html).toContain('No end date');
  });

  it('renders the host’s action for every row', () => {
    expect(html.match(/class="remove"/g)).toHaveLength(4);
  });

  it('says so when there are no assignments', () => {
    const empty = renderWithCopy(RoleAssignmentTable as Component<never>, {
      caption: 'Assignments',
      roleAssignments: [],
      locale: 'en',
    });
    expect(empty.html).toContain('No one has access this way.');
  });
});

describe('RoleAssignmentPanel', () => {
  const { html, missing } = renderWithCopy(RoleAssignmentPanel as Component<never>, {
    roleAssignments: ASSIGNMENTS,
    locale: 'en',
    removeAction,
  });

  it('asks for no copy the seed lacks', () => {
    expect(missing).toEqual([]);
  });

  it('is a section named by its heading', () => {
    const labelledBy = html.match(/<section[^>]*aria-labelledby="([^"]+)"/)?.[1];
    expect(labelledBy).toBeDefined();
    expect(html).toMatch(new RegExp(`<h2[^>]*id="${labelledBy}"[^>]*>\\s*Who has access`));
  });

  it('offers removal on direct access only', () => {
    const [direct, inherited] = html.split('From broader roles');
    expect(direct).toContain('Given on this item');
    expect(direct?.match(/class="remove"/g)).toHaveLength(2);
    expect(inherited).not.toContain('class="remove"');
  });

  it('says where inherited access comes from, and where to change it', () => {
    const inherited = html.split('From broader roles')[1] ?? '';
    expect(inherited).toContain('Articles (all)');
    expect(inherited).toContain('Everywhere');
    expect(inherited).toContain('Sports desk');
    expect(html).toContain('Change broader access on the user’s or group’s page.');
  });
});

describe('UserGroupMemberTable', () => {
  const members: UserGroupMemberRow[] = [
    { userGroupId: 7, userAccount: user(3), createdAt: '2026-10-02T00:00:00.000Z' },
  ];

  it('lists members by email with the date they joined, and asks for no missing copy', () => {
    const { html, missing } = renderWithCopy(UserGroupMemberTable as Component<never>, {
      caption: 'Members of Sports desk',
      userGroupMembers: members,
      locale: 'en',
    });
    expect(missing).toEqual([]);
    expect(html).toContain('user-3@example.test');
    expect(html).toMatch(/<time datetime="2026-10-02T00:00:00.000Z">/);
  });

  it('says so when there are no members', () => {
    const { html } = renderWithCopy(UserGroupMemberTable as Component<never>, {
      caption: 'Members',
      userGroupMembers: [],
      locale: 'en',
    });
    expect(html).toContain('No members yet.');
  });
});
