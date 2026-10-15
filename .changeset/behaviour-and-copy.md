---
'@sveltebuilder/coreui': patch
'@sveltebuilder/content': major
'@sveltebuilder/logistic': major
'create-sveltebuilder': minor
---

Behaviour tests in three browsers, and the last hard-coded English in the module components.

coreui fixes found by the new browser tests: `DateTimePicker` reads a typed time in its own
`timezone` rather than the browser's, updates a bound `value` even when `onValueChange` is also
given, and passes `min` and `max` to the input in the form it accepts; a disabled `SelectItem`
carries `aria-disabled`; `Tooltip` content has `role="tooltip"`; a checked `Switch` thumb stays in
its track in right-to-left; `MessageLiveRegion` drops two fixed ids nothing referenced.

content and logistic components take their remaining copy from the dictionary, in English and
French: the live coverage and live update labels, bylines (now joined with `Intl.ListFormat`), the
article timestamps, the front layout names, the inbound receipt and pick task cards, the stock level
bar, the supplier card and the tracking event list. `FrontCurationBoard`, `StockLevelBar` and
`TrackingEventList` gain the optional `dictionary` prop; `FrontCurationBoard` no longer takes
`locale`, and `PickTaskCard` and `TrackingEventList` require it. `StorageLocationPath` is a labelled
list rather than a navigation landmark, and several `aria-label`s on plain elements, which ARIA
does not allow, are gone.

Scaffolded screens name their copy lookup `localText` instead of `t`.
