---
'@sveltebuilder/coreui': patch
---

`Select`: the closed trigger shows the selected item's label, not its value. Bits UI resolves the
trigger text from items that are mounted, and the list is portaled and unmounted until it opens, so
a Select with a preselected value showed `all_rights_reserved` instead of "All rights reserved"
until the user opened it. Select now renders its children once in a silent registration pass in
which each `SelectItem` reports its label, and passes the result to Bits UI as `items`. No change
to the `Select` / `SelectItem` API.
