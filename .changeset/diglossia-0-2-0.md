---
'@sveltebuilder/coreui': patch
'@sveltebuilder/content': patch
'@sveltebuilder/logistic': patch
---

Bump diglossia to ^0.2.0. The `diglossia` peer range on content and logistic moves from `^0.1.0` to `^0.2.0`. 0.2.0 only adds to the API (`subscribe()`/`getVersion()` on `DictionaryInstance`, reactive `merge()` on the instance passed to `setDictionary()`, and a `formatText` that no longer throws on malformed MF2), so no consumer code changes.
