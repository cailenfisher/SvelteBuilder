/**
 * A checkbox matrix is a real table: each box is named by its row and column headers, an
 * inherited box says where it comes from in visible text, and only boxes the reader can change
 * are submitted.
 */
import { describe, expect, it } from 'vitest';
import { render } from 'svelte/server';
import CheckboxMatrix from '../src/lib/Checkbox/CheckboxMatrix.svelte';

const rows = [
  { key: 'article', label: 'Articles' },
  { key: 'section', label: 'Sections' },
];
const columns = [
  { key: 'read', label: 'Read' },
  { key: 'update', label: 'Update' },
  { key: 'publish', label: 'Publish' },
];
const cells = [
  { rowKey: 'article', columnKey: 'read', value: '1', checked: true },
  { rowKey: 'article', columnKey: 'update', value: '2', checked: false },
  { rowKey: 'article', columnKey: 'publish', value: '3', checked: false, inheritedFrom: 'From Editors, everywhere' },
  { rowKey: 'section', columnKey: 'read', value: '4', checked: false },
];

function renderMatrix(extra: Record<string, unknown> = {}): string {
  return render(CheckboxMatrix, {
    props: { id: 'role-permission', caption: 'Permissions', rows, columns, cells, name: 'permission_id', ...extra },
  }).body;
}

/** The opening tag of the checkbox named by the given row and column. */
function box(html: string, row: string, column: string): string {
  const match = html.match(
    new RegExp(`<button[^>]*aria-labelledby="role-permission-row-${row} role-permission-column-${column}"[^>]*>`)
  );
  if (!match) throw new Error(`no checkbox for ${row} × ${column}`);
  return match[0];
}

describe('CheckboxMatrix', () => {
  const html = renderMatrix();

  it('is a table with a caption, column headers and row headers', () => {
    expect(html).toMatch(/<table[^>]*>[\s\S]*<caption[^>]*>Permissions<\/caption>/);
    expect(html.match(/<th[^>]*scope="col"/g)).toHaveLength(3);
    expect(html.match(/<th[^>]*scope="row"/g)).toHaveLength(2);
  });

  it('names each box by its row and column headers, which exist', () => {
    expect(html).toContain('id="role-permission-row-article"');
    expect(html).toContain('id="role-permission-column-update"');
    expect(box(html, 'article', 'update')).toMatch(/role="checkbox"/);
  });

  it('renders a box only where a cell exists', () => {
    expect(html.match(/role="checkbox"/g)).toHaveLength(4);
    expect(() => box(html, 'section', 'publish')).toThrow();
  });

  it('shows each box’s state, and leaves a box the reader can change writable', () => {
    expect(box(html, 'article', 'read')).toMatch(/aria-checked="true"/);
    expect(box(html, 'article', 'update')).toMatch(/aria-checked="false"/);
    expect(box(html, 'article', 'update')).toMatch(/aria-readonly="false"/);
  });

  it('shows an inherited box checked and read-only, described by visible text', () => {
    const inherited = box(html, 'article', 'publish');
    expect(inherited).toMatch(/aria-checked="true"/);
    expect(inherited).toMatch(/aria-readonly="true"/);
    expect(inherited).toMatch(/aria-describedby="role-permission-source-article-publish"/);
    expect(html).toMatch(/<span[^>]*id="role-permission-source-article-publish"[^>]*>From Editors, everywhere<\/span>/);
  });

  it('submits only the boxes the reader can change', () => {
    const submitted = [...html.matchAll(/<input[^>]*name="permission_id"[^>]*>/g)].map((m) => m[0]);
    const values = submitted.map((input) => input.match(/value="([^"]*)"/)?.[1]);
    expect(values.sort()).toEqual(['1', '2', '4']);
  });

  it('makes every box read-only, and submits none, when the matrix is read-only', () => {
    const readonly = renderMatrix({ readonly: true });
    for (const [row, column] of [['article', 'read'], ['article', 'update'], ['section', 'read']]) {
      expect(box(readonly, row, column)).toMatch(/aria-readonly="true"/);
    }
    expect(readonly).not.toMatch(/name="permission_id"/);
  });
});
