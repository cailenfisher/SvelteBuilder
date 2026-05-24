<script lang="ts">
  import { ConfirmDialog, messageBus } from '@sveltebuilder/coreui';

  let deleteOpen = $state(false);
  let deleteLoading = $state(false);
  let archiveOpen = $state(false);
  let bulkOpen = $state(false);
  let selectedCount = $state(12);

  function handleDelete() {
    deleteLoading = true;
    setTimeout(() => {
      deleteLoading = false;
      deleteOpen = false;
      messageBus.sendToast({
        severity: 'success',
        summary: 'Record permanently deleted.',
      });
    }, 1200);
  }

  function handleArchive() {
    archiveOpen = false;
    messageBus.sendToast({
      severity: 'success',
      summary: 'Product archived.',
      undoAction: () => {
        messageBus.sendToast({ severity: 'success', summary: 'Product restored.' });
      },
    });
  }

  function handleBulkDelete() {
    bulkOpen = false;
    messageBus.sendToast({
      severity: 'success',
      summary: `${selectedCount} records deleted.`,
    });
  }
</script>

<svelte:head>
  <title>ConfirmDialog — CoreUI Dev Kitchen</title>
</svelte:head>

<div class="dev-page">
  <h1>ConfirmDialog</h1>

  <p class="page-description">
    Reserved for <strong>critical</strong> severity — irreversible destructive actions
    with no soft-delete path. For most deletes, prefer the undo-toast pattern (see Toast demo).
  </p>

  <section class="dev-section">
    <h2>Hard delete (no undo path)</h2>
    <div class="dev-stage">
      <button type="button" class="demo-btn demo-btn--danger" onclick={() => (deleteOpen = true)}>
        Permanently delete record
      </button>

      <ConfirmDialog
        bind:open={deleteOpen}
        title="Permanently delete record?"
        description="This record will be removed from the database with no undo path. All associated files will also be deleted."
        confirmLabel="Delete permanently"
        loading={deleteLoading}
        onConfirm={handleDelete}
        onCancel={() => (deleteOpen = false)}
      >
        <p class="dialog-body-note">
          This action cannot be undone. Consider archiving instead if you may need this record again.
        </p>
      </ConfirmDialog>

      <p class="demo-note">
        Loading state is shown while the async delete runs. Cancel is disabled during load.
      </p>
    </div>
  </section>

  <section class="dev-section">
    <h2>Archive (prefer undo toast — shown for contrast)</h2>
    <div class="dev-stage">
      <button type="button" class="demo-btn" onclick={() => (archiveOpen = true)}>
        Archive product
      </button>

      <ConfirmDialog
        bind:open={archiveOpen}
        title="Archive this product?"
        description="Archived products are hidden from listings but can be restored at any time."
        confirmLabel="Archive"
        onConfirm={handleArchive}
      />

      <p class="demo-note">
        For reversible actions like archive, the undo-toast is less friction.
        This dialog is shown here only to contrast the two patterns.
      </p>
    </div>
  </section>

  <section class="dev-section">
    <h2>Bulk delete above threshold</h2>
    <div class="dev-stage">
      <div style="display: flex; gap: 0.5rem; align-items: center;">
        <label for="count" style="font-size: 0.875rem; font-weight: 500;">Selected:</label>
        <input
          id="count"
          type="number"
          min={1}
          max={500}
          bind:value={selectedCount}
          style="width: 5rem; padding: 0.375rem 0.5rem; border: 1px solid #d1d5db; border-radius: 0.375rem; font-size: 0.875rem;"
        />
        <button type="button" class="demo-btn demo-btn--danger" onclick={() => (bulkOpen = true)}>
          Delete {selectedCount} records
        </button>
      </div>

      <ConfirmDialog
        bind:open={bulkOpen}
        title="Delete {selectedCount} records?"
        description="This will permanently remove {selectedCount} records. This action cannot be undone."
        confirmLabel="Delete {selectedCount} records"
        onConfirm={handleBulkDelete}
      />
    </div>
  </section>
</div>

<style>
  .dev-page { max-width: 40rem; }
  h1 { margin-block-end: 0.5rem; }
  .page-description { font-size: 0.875rem; color: #374151; margin-block-end: 2rem; line-height: 1.5; }
  .dev-section { margin-block-end: 2.5rem; }
  h2 { margin-block-end: 0.75rem; font-size: 0.875rem; font-weight: 600; }
  .dev-stage { display: flex; flex-direction: column; gap: 0.75rem; padding: 1.5rem; border: 1px solid #ccc; border-radius: 0.375rem; }

  .demo-btn {
    padding: 0.5rem 0.875rem;
    border: 1px solid currentColor;
    border-radius: 0.375rem;
    background: none;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: background-color 0.1s;
    align-self: flex-start;
  }

  .demo-btn:hover { background-color: rgba(0,0,0,0.05); }
  .demo-btn--danger { color: #dc2626; }

  .dialog-body-note {
    font-size: 0.875rem;
    color: #374151;
    margin: 0;
    line-height: 1.5;
  }

  .demo-note {
    font-size: 0.8125rem;
    color: #6b7280;
    margin: 0;
    line-height: 1.5;
  }
</style>
