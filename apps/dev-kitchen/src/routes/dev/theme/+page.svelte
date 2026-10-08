<!-- One gallery, three times: forced light, forced dark, and right-to-left. The panels set
     data-color-scheme and dir on their own element, which is how the coreui token rules
     are written, so all three render side by side whatever the system preference.
     The keyboard walk and the axe run in tests/ start here. -->
<script lang="ts">
  import {
    Accordion,
    AccordionItem,
    Alert,
    Avatar,
    Badge,
    Button,
    Card,
    Checkbox,
    Field,
    InlineNotification,
    Input,
    MetricCard,
    Pagination,
    ProgressBar,
    RadioGroup,
    RadioItem,
    Select,
    SelectItem,
    Spinner,
    StatusBadge,
    Switch,
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
    Tag,
    Textarea,
    Timeline,
    TimelineItem,
  } from '@sveltebuilder/coreui';

  const panels = [
    { id: 'light', title: 'Light', scheme: 'light', dir: 'ltr' },
    { id: 'dark', title: 'Dark', scheme: 'dark', dir: 'ltr' },
    { id: 'rtl', title: 'Right to left', scheme: undefined, dir: 'rtl' },
  ] as const;
</script>

<svelte:head>
  <title>Theme, direction and focus · dev-kitchen</title>
</svelte:head>

<h1>Theme, direction and focus</h1>
<p>
  The same components under a forced light scheme, a forced dark scheme, and right-to-left. Walk the
  page with Tab: every stop needs a visible focus indicator.
</p>

{#snippet gallery(prefix: string)}
  <div class="theme__row">
    <Button>Primary</Button>
    <Button variant="secondary">Secondary</Button>
    <Button variant="ghost">Ghost</Button>
    <Button variant="danger">Danger</Button>
    <Button variant="link" href="#{prefix}-top">Link</Button>
    <Button disabled>Disabled</Button>
  </div>
  <div class="theme__row">
    <Badge>Default</Badge>
    <Badge variant="brand">Brand</Badge>
    <Badge variant="success">Success</Badge>
    <Badge variant="warning">Warning</Badge>
    <Badge variant="danger">Danger</Badge>
    <Badge variant="info">Info</Badge>
    <Tag onremove={() => {}} removeLabel="Remove tag">Tag</Tag>
    <StatusBadge label="Published" variant="success" />
  </div>
  <Alert variant="warning" title="Low stock">Twelve units left at A-04-2.</Alert>
  <InlineNotification
    severity="error"
    summary="The carrier rejected the address."
    dismissible
    onDismiss={() => {}}
  />
  <Field id="{prefix}-name" label="Supplier name" hint="As it appears on invoices.">
    <Input value="Acme Freight" />
  </Field>
  <Field id="{prefix}-reference" label="Reference" error="At least 4 characters.">
    <Input value="AB" />
  </Field>
  <Field id="{prefix}-notes" label="Notes">
    <Textarea value="Keep upright." rows={2} />
  </Field>
  <Field id="{prefix}-carrier" label="Carrier">
    <Select value="express">
      <SelectItem value="ground" label="Ground" />
      <SelectItem value="express" label="Express" />
    </Select>
  </Field>
  <div class="theme__row">
    <Checkbox checked label="Partial shipments" />
    <Switch checked label="Notify" />
  </div>
  <RadioGroup value="list" orientation="horizontal" name="{prefix}-layout">
    <RadioItem value="list" label="List" />
    <RadioItem value="grid" label="Grid" />
  </RadioGroup>
  <Tabs value="details">
    <TabsList>
      <TabsTrigger value="details">Details</TabsTrigger>
      <TabsTrigger value="lines">Lines</TabsTrigger>
    </TabsList>
    <TabsContent value="details">Carrier and addresses.</TabsContent>
    <TabsContent value="lines">Three lines.</TabsContent>
  </Tabs>
  <Accordion type="single" value="receiving">
    <AccordionItem value="receiving" title="Receiving">Checked against the order.</AccordionItem>
    <AccordionItem value="putaway" title="Put-away">Moved to storage.</AccordionItem>
  </Accordion>
  <ProgressBar value={60} label="Picking" />
  <div class="theme__row">
    <Spinner size="sm" label="Loading" />
    <Avatar fallback="AL" alt="Ada Lovelace" size="sm" />
  </div>
  <MetricCard value="97.2%" label="Pick accuracy" trend={1.4} trendLabel="vs last week" />
  <Card>
    {#snippet header()}<strong>Shipment 4182</strong>{/snippet}
    <Timeline>
      <TimelineItem label="Picked">All lines picked.</TimelineItem>
      <TimelineItem label="Packed" current>Two cartons.</TimelineItem>
    </Timeline>
  </Card>
  <Pagination count={60} perPage={10} page={2} label="{prefix} pages" />
{/snippet}

<div class="theme">
  {#each panels as panel (panel.id)}
    <section
      class="theme__panel"
      id="{panel.id}-top"
      data-color-scheme={panel.scheme}
      dir={panel.dir}
      lang={panel.dir === 'rtl' ? 'ar' : undefined}
      aria-labelledby="{panel.id}-title"
    >
      <h2 id="{panel.id}-title" class="theme__title">{panel.title}</h2>
      {@render gallery(panel.id)}
    </section>
  {/each}
</div>

<style>
  .theme {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(20rem, 1fr));
    gap: var(--space-4);
    margin-block-start: var(--space-4);
  }

  .theme__panel {
    display: grid;
    gap: var(--space-3);
    align-content: start;
    padding: var(--space-4);
    border: var(--border);
    border-radius: var(--radius);
    /* The tokens change on this element; the panel has to paint with them itself,
       since the page behind it is still in the outer scheme. */
    background: var(--surface);
    color: var(--text);
  }

  .theme__title {
    margin: 0;
    font-size: var(--text-lg);
  }

  .theme__row {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2);
    align-items: center;
  }
</style>
