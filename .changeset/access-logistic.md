---
'@sveltebuilder/logistic': major
'@sveltebuilder/coreui': minor
'create-sveltebuilder': minor
---

Logistic adopts roles and permissions (docs/ACCESS-CONTROL.md §7).

**Breaking (logistic):** a signed-in user with no logistic role now reads nothing and does no floor work; before, any signed-in user could read every logistic table and pick, receive and count. Give existing staff the new Warehouse operator role as soon as you upgrade (`docs/MIGRATION-ACCESS-CONTROL.md`). The logistic RPCs no longer take the acting user account: `logistic_receive_receipt_line`, `_record_picked_quantity`, `_complete_pick_task`, `_grade_return_line`, `_approve_cycle_count`, `_create_shipment`, `_create_return_authorization` and `_create_cycle_count` read it from the session, and the old signatures are dropped. The stock primitives (`logistic_adjust_stock` and the rest) can no longer be called through the API; adjust stock with `logistic_adjust_stock_level`, which checks `stock_level.adjust`. Workers no longer update lines directly, so a pick line's requested quantity cannot be rewritten.

Logistic's manifest declares its permission catalog, with the verbs `adjust`, `receive`, `pick`, `grade`, `count` and `approve`, and its seed adds the Logistics manager and Warehouse operator roles and their menu entries. Every policy grants by permission, and children follow their parent. The admin views gain optional `actions`, and coreui exports the `ScreenAction` type they share.

Scaffolds: the logistic admin screens require their scope and show only the controls the reader may use; the warehouse admits anyone holding a picking, receiving or counting permission. `require-administrator.ts` is now `require-access.ts`, with `requireScope` beside `requireAdministrator`, and `current_user_actions(scope)` joins the core access SQL.
