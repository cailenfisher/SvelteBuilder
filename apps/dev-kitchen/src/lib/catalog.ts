import type { Component } from 'svelte';

/**
 * Every showcase page, and the package components each one renders.
 *
 * This list is also the coverage gate. `ComponentName` reads a package's component
 * exports from its type, and each package's `*_COVERAGE` constant only type-checks when
 * every one of them is listed on some page. A component exported without a showcase is a
 * `pnpm check` failure that names it — the same way the harness this replaced found 33
 * coreui components no screen and no test had ever rendered.
 */

/**
 * A module's Svelte component exports. A component is a function type, and so is
 * `getMessageBus`, so the PascalCase test is what separates the two; constants such as
 * `AUTO_DISMISS_MS` are not functions and fall out on the second test.
 */
export type ComponentName<Module> = {
  [Key in keyof Module & string]: Key extends Capitalize<Key>
    ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
      Module[Key] extends Component<any, any, any>
      ? Key
      : never
    : never;
}[keyof Module & string];

export type ShowcasePage<Name extends string> = {
  /** Route segment under /dev/<package>/. */
  slug: string;
  title: string;
  components: readonly Name[];
};

/** `true` when every component of `Module` is on some page; otherwise the ones that are not. */
export type Coverage<Module, Pages extends readonly ShowcasePage<string>[]> = [
  Exclude<ComponentName<Module>, Pages[number]['components'][number]>,
] extends [never]
  ? true
  : { uncovered: Exclude<ComponentName<Module>, Pages[number]['components'][number]> };

// ── @sveltebuilder/coreui ────────────────────────────────────────────────────

type CoreUi = typeof import('@sveltebuilder/coreui');

export const COREUI_PAGES = [
  { slug: 'button', title: 'Button', components: ['Button'] },
  { slug: 'badge', title: 'Badge, Tag, StatusBadge', components: ['Badge', 'Tag', 'StatusBadge'] },
  { slug: 'card', title: 'Card, Divider, MetricCard', components: ['Card', 'Divider', 'MetricCard'] },
  { slug: 'avatar', title: 'Avatar', components: ['Avatar'] },
  {
    slug: 'progress',
    title: 'ProgressBar, Spinner, Skeleton',
    components: ['ProgressBar', 'Spinner', 'Skeleton'],
  },
  {
    slug: 'alert',
    title: 'Alert, InlineNotification, Banner',
    components: ['Alert', 'InlineNotification', 'Banner'],
  },
  {
    slug: 'toast',
    title: 'Toast and the message bus',
    components: ['Toast', 'ToastRegion', 'MessageAriaLive'],
  },
  { slug: 'confirm-dialog', title: 'ConfirmDialog', components: ['ConfirmDialog'] },
  {
    slug: 'field',
    title: 'Field, Label, Input, Textarea',
    components: ['Field', 'Label', 'Input', 'Textarea'],
  },
  {
    slug: 'choice',
    title: 'Checkbox, RadioGroup, Switch',
    components: ['Checkbox', 'RadioGroup', 'RadioItem', 'Switch'],
  },
  { slug: 'select', title: 'Select', components: ['Select', 'SelectItem'] },
  { slug: 'barcode-input', title: 'BarcodeInput', components: ['BarcodeInput'] },
  { slug: 'date-time-picker', title: 'DateTimePicker', components: ['DateTimePicker'] },
  { slug: 'accordion', title: 'Accordion', components: ['Accordion', 'AccordionItem'] },
  {
    slug: 'tabs',
    title: 'Tabs',
    components: ['Tabs', 'TabsList', 'TabsTrigger', 'TabsContent'],
  },
  { slug: 'dialog', title: 'Dialog, Drawer', components: ['Dialog', 'Drawer'] },
  { slug: 'popover', title: 'Popover, Tooltip', components: ['Popover', 'Tooltip'] },
  {
    slug: 'menu',
    title: 'Menu',
    components: [
      'Menu',
      'MenuItem',
      'MenuSeparator',
      'MenuLabel',
      'MenuGroup',
      'MenuCheckboxItem',
      'MenuRadioGroup',
      'MenuRadioItem',
      'MenuSub',
    ],
  },
  {
    slug: 'table',
    title: 'Table',
    components: [
      'Table',
      'TableHead',
      'TableBody',
      'TableFoot',
      'TableRow',
      'TableHeader',
      'TableCell',
    ],
  },
  { slug: 'data-table', title: 'DataTable, Pagination', components: ['DataTable', 'Pagination'] },
  { slug: 'timeline', title: 'Timeline', components: ['Timeline', 'TimelineItem'] },
  { slug: 'block-editor', title: 'BlockEditor', components: ['BlockEditor'] },
  {
    slug: 'locale',
    title: 'Localization admin',
    components: ['LocaleSwitcher', 'LocaleEdit', 'LocalTextLinkEdit', 'LocalTextEdit'],
  },
] as const satisfies readonly ShowcasePage<ComponentName<CoreUi>>[];

export const COREUI_COVERAGE: Coverage<CoreUi, typeof COREUI_PAGES> = true;

// ── @sveltebuilder/content ───────────────────────────────────────────────────

type Content = typeof import('@sveltebuilder/content');

export const CONTENT_PAGES = [
  { slug: 'article-card', title: 'ArticleCard', components: ['ArticleCard'] },
  { slug: 'article-view', title: 'ArticleView', components: ['ArticleView'] },
  {
    slug: 'article-block',
    title: 'ArticleBlockRenderer, MediaFigure',
    components: ['ArticleBlockRenderer', 'MediaFigure'],
  },
  {
    slug: 'taxonomy',
    title: 'BylineList, SectionLabel, TopicTag',
    components: ['BylineList', 'SectionLabel', 'TopicTag'],
  },
  { slug: 'live-coverage', title: 'Live coverage', components: ['LiveCoverageView', 'LiveUpdateItem'] },
  { slug: 'section-front', title: 'SectionFront', components: ['SectionFront'] },
  { slug: 'author-profile', title: 'AuthorProfileView', components: ['AuthorProfileView'] },
  {
    slug: 'newsletter',
    title: 'NewsletterSignup, SubscriberList',
    components: ['NewsletterSignup', 'SubscriberList'],
  },
  { slug: 'article-list', title: 'ArticleList, AssignmentQueue', components: ['ArticleList', 'AssignmentQueue'] },
  {
    slug: 'workflow',
    title: 'ArticleWorkflowPanel, BlockEditorHost',
    components: ['ArticleWorkflowPanel', 'BlockEditorHost'],
  },
  { slug: 'front-curation', title: 'FrontCurationBoard', components: ['FrontCurationBoard'] },
] as const satisfies readonly ShowcasePage<ComponentName<Content>>[];

export const CONTENT_COVERAGE: Coverage<Content, typeof CONTENT_PAGES> = true;

// ── @sveltebuilder/logistic ──────────────────────────────────────────────────

type Logistic = typeof import('@sveltebuilder/logistic');

export const LOGISTIC_PAGES = [
  { slug: 'supplier', title: 'SupplierCard', components: ['SupplierCard'] },
  { slug: 'storage-location', title: 'StorageLocationPath', components: ['StorageLocationPath'] },
  { slug: 'pick-task', title: 'PickTaskCard, PickTaskStatusBadge', components: ['PickTaskCard', 'PickTaskStatusBadge'] },
  { slug: 'receipt', title: 'ReceiptCard', components: ['ReceiptCard'] },
  {
    slug: 'status-badge',
    title: 'ShipmentStatusBadge, ReturnConditionBadge',
    components: ['ShipmentStatusBadge', 'ReturnConditionBadge'],
  },
  { slug: 'stock-level', title: 'StockLevelBar', components: ['StockLevelBar'] },
  { slug: 'tracking', title: 'TrackingEventList', components: ['TrackingEventList'] },
] as const satisfies readonly ShowcasePage<ComponentName<Logistic>>[];

export const LOGISTIC_COVERAGE: Coverage<Logistic, typeof LOGISTIC_PAGES> = true;

// ── Every package ────────────────────────────────────────────────────────────

export type ShowcaseSection = {
  slug: string;
  title: string;
  pages: readonly ShowcasePage<string>[];
};

export const SHOWCASE: readonly ShowcaseSection[] = [
  { slug: 'coreui', title: '@sveltebuilder/coreui', pages: COREUI_PAGES },
  { slug: 'content', title: '@sveltebuilder/content', pages: CONTENT_PAGES },
  { slug: 'logistic', title: '@sveltebuilder/logistic', pages: LOGISTIC_PAGES },
];

/** The section and page a /dev/<section>/<page> path renders, if it is one. */
export function findPage(pathname: string) {
  const [, root, sectionSlug, pageSlug] = pathname.split('/');
  if (root !== 'dev') return undefined;
  const section = SHOWCASE.find((candidate) => candidate.slug === sectionSlug);
  const page = section?.pages.find((candidate) => candidate.slug === pageSlug);
  return section && page ? { section, page } : undefined;
}
