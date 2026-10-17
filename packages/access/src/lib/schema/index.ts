// =============================================================================
// @sveltebuilder/access — Drizzle schema
//
// The static access tables. Each access-controlled entity's assignment table
// (`<entity>_role_assignment`) is not here: `sveltebuilder sync:supabase`
// generates it as SQL from the module's registry manifest. See
// docs/ACCESS-CONTROL.md §2.
//
// None of these tables carries copy. Role, permission and group labels resolve
// through diglossia under the `role`, `permission` and `user_group` scopes.
// =============================================================================

export * from './permission-action.js';
export * from './permission.js';
export * from './role-assignment.js';
export * from './role-permission.js';
export * from './role.js';
export * from './user-group-member.js';
export * from './user-group.js';
