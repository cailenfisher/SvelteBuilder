// ============================================================
// Layout & display
// ============================================================
export { default as Card } from './Card.svelte';
export { default as Divider } from './Divider.svelte';

// ============================================================
// Typography & decoration
// ============================================================
export { default as Badge } from './Badge.svelte';
export { default as Tag } from './Tag.svelte';
export { default as Avatar } from './Avatar.svelte';

// ============================================================
// Feedback & status
// ============================================================
export { default as Alert } from './Alert.svelte';
export { default as ProgressBar } from './ProgressBar.svelte';
export { default as Skeleton } from './Skeleton.svelte';
export { default as Spinner } from './Spinner.svelte';

// ============================================================
// Messaging system
// ============================================================
export { messageBus, AUTO_DISMISS_MS } from './message-bus.svelte.js';
export type { SBMessage, SBMessageSeverity, SBMessageAction } from './message-bus.svelte.js';
export { default as Toast } from './Toast.svelte';
export { default as ToastRegion } from './ToastRegion.svelte';
export { default as InlineNotification } from './InlineNotification.svelte';
export { default as Banner } from './Banner.svelte';
export { default as ConfirmDialog } from './ConfirmDialog.svelte';
export { default as MessageAriaLive } from './MessageAriaLive.svelte';

// ============================================================
// Scan input
// ============================================================
export { default as BarcodeInput } from './BarcodeInput.svelte';

// ============================================================
// Form primitives
// ============================================================
export { default as Field } from './Field.svelte';
export { default as Label } from './Label.svelte';
export { default as Input } from './Input.svelte';
export { default as Textarea } from './Textarea.svelte';
export { default as Checkbox } from './Checkbox.svelte';
export { default as RadioGroup } from './RadioGroup.svelte';
export { default as RadioItem } from './RadioItem.svelte';
export { default as Switch } from './Switch.svelte';
export { default as Select } from './Select.svelte';
export { default as SelectItem } from './SelectItem.svelte';

// ============================================================
// Action
// ============================================================
export { default as Button } from './Button.svelte';

// ============================================================
// Accordion
// ============================================================
export { default as Accordion } from './Accordion.svelte';
export { default as AccordionItem } from './AccordionItem.svelte';

// ============================================================
// Tabs
// ============================================================
export { default as Tabs } from './Tabs.svelte';
export { default as TabsList } from './TabsList.svelte';
export { default as TabsTrigger } from './TabsTrigger.svelte';
export { default as TabsContent } from './TabsContent.svelte';

// ============================================================
// Overlays
// ============================================================
export { default as Dialog } from './Dialog.svelte';
export { default as Popover } from './Popover.svelte';
export { default as Tooltip } from './Tooltip.svelte';

// ============================================================
// Menu / Dropdown
// ============================================================
export { default as Menu } from './Menu.svelte';
export { default as MenuItem } from './MenuItem.svelte';
export { default as MenuSeparator } from './MenuSeparator.svelte';
export { default as MenuLabel } from './MenuLabel.svelte';
export { default as MenuGroup } from './MenuGroup.svelte';
export { default as MenuCheckboxItem } from './MenuCheckboxItem.svelte';
export { default as MenuRadioGroup } from './MenuRadioGroup.svelte';
export { default as MenuRadioItem } from './MenuRadioItem.svelte';
export { default as MenuSub } from './MenuSub.svelte';

// ============================================================
// Navigation
// ============================================================
export { default as LocaleSwitcher } from './LocaleSwitcher.svelte';
export { default as Pagination } from './Pagination.svelte';

// ============================================================
// Data display
// ============================================================
export { default as MetricCard } from './MetricCard.svelte';
export { default as Timeline } from './Timeline.svelte';
export { default as TimelineItem } from './TimelineItem.svelte';
export { default as StatusBadge } from './StatusBadge.svelte';
export { default as Table } from './Table.svelte';
export { default as TableHead } from './TableHead.svelte';
export { default as TableBody } from './TableBody.svelte';
export { default as TableFoot } from './TableFoot.svelte';
export { default as TableRow } from './TableRow.svelte';
export { default as TableHeader } from './TableHeader.svelte';
export { default as TableCell } from './TableCell.svelte';
export { default as DataTable } from './DataTable.svelte';
export type { DataTableColumn } from './DataTable.svelte';

// ============================================================
// LocalText admin components
// ============================================================
export { default as LocaleEdit } from './LocaleEdit.svelte';
export { default as LocalTextLinkEdit } from './LocalTextLinkEdit.svelte';
export { default as LocalTextEdit } from './LocalTextEdit.svelte';

// ============================================================
// Editing
// ============================================================
export { default as BlockEditor } from './BlockEditor.svelte';
export type { EditorBlock } from './BlockEditor.svelte';

// ============================================================
// Overlay / panel
// ============================================================
export { default as Drawer } from './Drawer.svelte';

// ============================================================
// Date / time input
// ============================================================
export { default as DateTimePicker } from './DateTimePicker.svelte';

// ============================================================
// Utilities — for consumers building custom form controls
// ============================================================
export { useField } from './use-field.js';
