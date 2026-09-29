# @sveltebuilder/coreui

## 0.1.0

### Minor Changes

- Republish to bring npm in sync with the source: the diglossia extraction (dropped the stale
  `@sveltebuilder/hermes` peer dependency) and the messaging system rewrite (`createMessageBus` /
  `setMessageBus` / `getMessageBus`, replacing the old module-level `messageBus` singleton) landed
  in the repo without a version bump. The last published `0.0.15` still ships the pre-rewrite code,
  which breaks the base scaffold template's root layout (`setMessageBus(createMessageBus())` —
  `createMessageBus` doesn't exist in that build) on first render of every freshly scaffolded
  project.
