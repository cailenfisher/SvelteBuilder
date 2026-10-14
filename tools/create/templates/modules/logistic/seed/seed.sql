-- Seed data for @sveltebuilder/logistic
-- Depends on: locale table seeded (hermes/base seed), local_text_link, local_text

-- ──────────────────────────────────────────────────────────────────────────────
-- Storage locations (self-referential tree: warehouse → zone → aisle → bin)
-- Inserted level by level so parent slugs are resolvable at each step.
-- ──────────────────────────────────────────────────────────────────────────────

insert into storage_location (slug, location_type, parent_storage_location_id, active, position) values
  ('warehouse-main', 'warehouse', null, true, 10)
on conflict (slug) do nothing;

insert into storage_location (slug, location_type, parent_storage_location_id, active, position)
select v.slug, v.location_type::storage_location_type,
       (select id from storage_location where slug = 'warehouse-main'),
       v.active, v.position
from (values
  ('zone-a',         'zone', true, 10),
  ('zone-b',         'zone', true, 20),
  ('receiving-dock', 'zone', true, 100),
  ('returns-area',   'zone', true, 110)
) as v(slug, location_type, active, position)
on conflict (slug) do nothing;

insert into storage_location (slug, location_type, parent_storage_location_id, active, position)
select v.slug, 'aisle'::storage_location_type,
       (select id from storage_location where slug = v.parent_slug),
       v.active, v.position
from (values
  ('aisle-a1', 'zone-a', true, 10),
  ('aisle-a2', 'zone-a', true, 20),
  ('aisle-b1', 'zone-b', true, 10)
) as v(slug, parent_slug, active, position)
on conflict (slug) do nothing;

insert into storage_location (slug, location_type, parent_storage_location_id, active, position)
select v.slug, 'bin'::storage_location_type,
       (select id from storage_location where slug = v.parent_slug),
       v.active, v.position
from (values
  ('bin-a1-01', 'aisle-a1', true, 10),
  ('bin-a1-02', 'aisle-a1', true, 20),
  ('bin-a1-03', 'aisle-a1', true, 30),
  ('bin-a2-01', 'aisle-a2', true, 10),
  ('bin-a2-02', 'aisle-a2', true, 20),
  ('bin-b1-01', 'aisle-b1', true, 10),
  ('bin-b1-02', 'aisle-b1', true, 20)
) as v(slug, parent_slug, active, position)
on conflict (slug) do nothing;

-- ──────────────────────────────────────────────────────────────────────────────
-- Suppliers
-- ──────────────────────────────────────────────────────────────────────────────

insert into supplier (slug, lead_time_day, active) values
  ('acme-supply',   7,  true),
  ('global-parts', 14,  true),
  ('local-goods',   3,  true)
on conflict (slug) do nothing;

insert into supplier_contact (supplier_id, role, name, email, phone)
select s.id, v.role, v.name, v.email, v.phone
from (values
  ('acme-supply',  'primary', 'Jordan Lee',   'jordan.lee@acme-supply.example',   '+1-555-0101'),
  ('acme-supply',  'billing', 'Casey Morgan', 'billing@acme-supply.example',      null),
  ('global-parts', 'primary', 'Alex Rivera',  'alex.rivera@global-parts.example', '+1-555-0201'),
  ('local-goods',  'primary', 'Sam Kim',      'sam@local-goods.example',          '+1-555-0301')
) as v(supplier_slug, role, name, email, phone)
join supplier s on s.slug = v.supplier_slug
where not exists (
  select 1 from supplier_contact sc
  where sc.supplier_id = s.id and sc.role = v.role
);

-- ──────────────────────────────────────────────────────────────────────────────
-- Sample stock levels
-- ──────────────────────────────────────────────────────────────────────────────

-- SKU-DELTA-004 seeds below its reorder point so the low-stock dashboard has data.
insert into stock_level (storage_location_id, sku, on_hand, reserved, reorder_point)
select sl.id, v.sku, v.on_hand, v.reserved, v.reorder_point
from (values
  ('bin-a1-01', 'SKU-ALPHA-001', 120, 0, 25),
  ('bin-a1-01', 'SKU-BETA-002',   50, 0, 20),
  ('bin-a1-02', 'SKU-ALPHA-001',  30, 0, 25),
  ('bin-a1-03', 'SKU-GAMMA-003',  75, 0, null),
  ('bin-a2-01', 'SKU-DELTA-004',  10, 0, 15),
  ('bin-b1-01', 'SKU-BETA-002',   45, 0, 20)
) as v(location_slug, sku, on_hand, reserved, reorder_point)
join storage_location sl on sl.slug = v.location_slug
on conflict (storage_location_id, sku) do nothing;

-- ──────────────────────────────────────────────────────────────────────────────
-- local_text_link — entity-bound (storage_location names, supplier names)
-- ──────────────────────────────────────────────────────────────────────────────

insert into local_text_link (slug, scope, entity_id)
select 'name', 'storage_location', sl.id
from storage_location sl
where sl.slug in (
  'warehouse-main', 'zone-a', 'zone-b', 'aisle-a1', 'aisle-a2', 'aisle-b1',
  'bin-a1-01', 'bin-a1-02', 'bin-a1-03', 'bin-a2-01', 'bin-a2-02',
  'bin-b1-01', 'bin-b1-02', 'receiving-dock', 'returns-area'
)
on conflict do nothing;

insert into local_text_link (slug, scope, entity_id)
select 'name', 'supplier', s.id
from supplier s
where s.slug in ('acme-supply', 'global-parts', 'local-goods')
on conflict do nothing;

-- ──────────────────────────────────────────────────────────────────────────────
-- local_text_link — application-level UI copy (scope = 'logistic', entity_id null)
-- ──────────────────────────────────────────────────────────────────────────────

insert into local_text_link (slug, scope, entity_id) values
  -- Admin dashboard
  ('logistic.dashboard.title',                    'logistic', null),
  -- Location type labels
  ('logistic.storage_location_type.warehouse',                  'logistic', null),
  ('logistic.storage_location_type.zone',                       'logistic', null),
  ('logistic.storage_location_type.aisle',                      'logistic', null),
  ('logistic.storage_location_type.bin',                        'logistic', null),
  -- Inbound receipt status
  ('logistic.inbound_receipt.status.pending',           'logistic', null),
  ('logistic.inbound_receipt.status.partial',           'logistic', null),
  ('logistic.inbound_receipt.status.completed',          'logistic', null),
  ('logistic.inbound_receipt.status.cancelled',         'logistic', null),
  ('logistic.inbound_receipt.blind',                    'logistic', null),
  -- Pick task status
  ('logistic.pick_task.status.open',                    'logistic', null),
  ('logistic.pick_task.status.in_progress',             'logistic', null),
  ('logistic.pick_task.status.completed',               'logistic', null),
  ('logistic.pick_task.status.cancelled',               'logistic', null),
  -- Shipment status
  ('logistic.shipment.status.created',                  'logistic', null),
  ('logistic.shipment.status.packed',                   'logistic', null),
  ('logistic.shipment.status.dispatched',               'logistic', null),
  ('logistic.shipment.status.in_transit',               'logistic', null),
  ('logistic.shipment.status.delivered',                'logistic', null),
  ('logistic.shipment.status.exception',                'logistic', null),
  -- Return condition
  ('logistic.return_authorization.condition.salable',                 'logistic', null),
  ('logistic.return_authorization.condition.damaged',                 'logistic', null),
  ('logistic.return_authorization.condition.defective',               'logistic', null),
  ('logistic.return_authorization.condition.wrong_item',              'logistic', null),
  -- Return disposition
  ('logistic.return_authorization.disposition.restock',               'logistic', null),
  ('logistic.return_authorization.disposition.quarantine',            'logistic', null),
  ('logistic.return_authorization.disposition.scrap',                 'logistic', null),
  ('logistic.return_authorization.disposition.refurbish',             'logistic', null),
  -- Return authorization status
  ('logistic.return_authorization.status.pending',      'logistic', null),
  ('logistic.return_authorization.status.received',     'logistic', null),
  ('logistic.return_authorization.status.processed',    'logistic', null),
  ('logistic.return_authorization.status.cancelled',    'logistic', null),
  -- Cycle count status
  ('logistic.cycle_count.status.open',                  'logistic', null),
  ('logistic.cycle_count.status.in_progress',           'logistic', null),
  ('logistic.cycle_count.status.completed',              'logistic', null),
  ('logistic.cycle_count.status.cancelled',             'logistic', null),
  -- Adjustment reason
  ('logistic.stock_adjustment_reason.damage',                 'logistic', null),
  ('logistic.stock_adjustment_reason.theft',                  'logistic', null),
  ('logistic.stock_adjustment_reason.receiving_error',        'logistic', null),
  ('logistic.stock_adjustment_reason.cycle_count_variance',   'logistic', null),
  ('logistic.stock_adjustment_reason.system_correction',      'logistic', null),
  ('logistic.stock_adjustment_reason.other',                  'logistic', null),
  ('logistic.stock_adjustment_reason.inbound_receipt',        'logistic', null),
  ('logistic.stock_adjustment_reason.pick',                   'logistic', null),
  ('logistic.stock_adjustment_reason.return_restock',         'logistic', null),
  -- Admin navigation
  ('logistic.admin.navigation.storage_location',               'logistic', null),
  ('logistic.admin.navigation.supplier',                       'logistic', null),
  ('logistic.admin.navigation.stock_level',                    'logistic', null),
  ('logistic.admin.navigation.inbound_receipt',                'logistic', null),
  ('logistic.admin.navigation.pick_task',                      'logistic', null),
  ('logistic.admin.navigation.shipment',                       'logistic', null),
  ('logistic.admin.navigation.return_authorization',           'logistic', null),
  ('logistic.admin.navigation.cycle_count',                    'logistic', null),
  -- Field labels
  ('logistic.field.sku',                                'logistic', null),
  ('logistic.field.on_hand',                            'logistic', null),
  ('logistic.field.reserved',                           'logistic', null),
  ('logistic.field.available',                          'logistic', null),
  ('logistic.field.lead_time_day',                      'logistic', null),
  ('logistic.field.storage_location_type',                      'logistic', null),
  ('logistic.field.carrier',                            'logistic', null),
  ('logistic.field.tracking_number',                    'logistic', null),
  ('logistic.field.reorder_point',                      'logistic', null)
on conflict do nothing;

-- ──────────────────────────────────────────────────────────────────────────────
-- English copy
-- ──────────────────────────────────────────────────────────────────────────────

-- Storage location names
insert into local_text (link, locale, content)
select l.id,
       (select id from locale where code = 'en'),
       v.display
from (values
  ('warehouse-main', 'Main Warehouse'),
  ('zone-a',         'Zone A'),
  ('zone-b',         'Zone B'),
  ('aisle-a1',       'Aisle A1'),
  ('aisle-a2',       'Aisle A2'),
  ('aisle-b1',       'Aisle B1'),
  ('bin-a1-01',      'Bin A1-01'),
  ('bin-a1-02',      'Bin A1-02'),
  ('bin-a1-03',      'Bin A1-03'),
  ('bin-a2-01',      'Bin A2-01'),
  ('bin-a2-02',      'Bin A2-02'),
  ('bin-b1-01',      'Bin B1-01'),
  ('bin-b1-02',      'Bin B1-02'),
  ('receiving-dock', 'Receiving Dock'),
  ('returns-area',   'Returns Area')
) as v(entity_slug, display)
join storage_location sl on sl.slug = v.entity_slug
join local_text_link l
  on l.slug = 'name' and l.scope = 'storage_location' and l.entity_id = sl.id
on conflict (link, locale) do nothing;

-- Supplier names
insert into local_text (link, locale, content)
select l.id,
       (select id from locale where code = 'en'),
       v.display
from (values
  ('acme-supply',  'Acme Supply Co.'),
  ('global-parts', 'Global Parts Ltd.'),
  ('local-goods',  'Local Goods Inc.')
) as v(entity_slug, display)
join supplier s on s.slug = v.entity_slug
join local_text_link l
  on l.slug = 'name' and l.scope = 'supplier' and l.entity_id = s.id
on conflict (link, locale) do nothing;

-- UI copy
insert into local_text (link, locale, content)
select l.id,
       (select id from locale where code = 'en'),
       v.content
from (values
  ('logistic.dashboard.title',                    'logistic', 'Logistics'),
  ('logistic.storage_location_type.warehouse',                  'logistic', 'Warehouse'),
  ('logistic.storage_location_type.zone',                       'logistic', 'Zone'),
  ('logistic.storage_location_type.aisle',                      'logistic', 'Aisle'),
  ('logistic.storage_location_type.bin',                        'logistic', 'Bin'),
  ('logistic.inbound_receipt.status.pending',           'logistic', 'Pending'),
  ('logistic.inbound_receipt.status.partial',           'logistic', 'Partial'),
  ('logistic.inbound_receipt.status.completed',          'logistic', 'Completed'),
  ('logistic.inbound_receipt.status.cancelled',         'logistic', 'Cancelled'),
  ('logistic.inbound_receipt.blind',                    'logistic', 'Blind receipt'),
  ('logistic.pick_task.status.open',                    'logistic', 'Open'),
  ('logistic.pick_task.status.in_progress',             'logistic', 'In progress'),
  ('logistic.pick_task.status.completed',               'logistic', 'Completed'),
  ('logistic.pick_task.status.cancelled',               'logistic', 'Cancelled'),
  ('logistic.shipment.status.created',                  'logistic', 'Created'),
  ('logistic.shipment.status.packed',                   'logistic', 'Packed'),
  ('logistic.shipment.status.dispatched',               'logistic', 'Dispatched'),
  ('logistic.shipment.status.in_transit',               'logistic', 'In transit'),
  ('logistic.shipment.status.delivered',                'logistic', 'Delivered'),
  ('logistic.shipment.status.exception',                'logistic', 'Exception'),
  ('logistic.return_authorization.condition.salable',                 'logistic', 'Salable'),
  ('logistic.return_authorization.condition.damaged',                 'logistic', 'Damaged'),
  ('logistic.return_authorization.condition.defective',               'logistic', 'Defective'),
  ('logistic.return_authorization.condition.wrong_item',              'logistic', 'Wrong item'),
  ('logistic.return_authorization.disposition.restock',               'logistic', 'Restock'),
  ('logistic.return_authorization.disposition.quarantine',            'logistic', 'Quarantine'),
  ('logistic.return_authorization.disposition.scrap',                 'logistic', 'Scrap'),
  ('logistic.return_authorization.disposition.refurbish',             'logistic', 'Refurbish'),
  ('logistic.return_authorization.status.pending',      'logistic', 'Pending'),
  ('logistic.return_authorization.status.received',     'logistic', 'Received'),
  ('logistic.return_authorization.status.processed',    'logistic', 'Processed'),
  ('logistic.return_authorization.status.cancelled',    'logistic', 'Cancelled'),
  ('logistic.cycle_count.status.open',                  'logistic', 'Open'),
  ('logistic.cycle_count.status.in_progress',           'logistic', 'In progress'),
  ('logistic.cycle_count.status.completed',              'logistic', 'Completed'),
  ('logistic.cycle_count.status.cancelled',             'logistic', 'Cancelled'),
  ('logistic.stock_adjustment_reason.damage',                 'logistic', 'Damage'),
  ('logistic.stock_adjustment_reason.theft',                  'logistic', 'Theft'),
  ('logistic.stock_adjustment_reason.receiving_error',        'logistic', 'Receiving error'),
  ('logistic.stock_adjustment_reason.cycle_count_variance',   'logistic', 'Cycle count variance'),
  ('logistic.stock_adjustment_reason.system_correction',      'logistic', 'System correction'),
  ('logistic.stock_adjustment_reason.other',                  'logistic', 'Other'),
  ('logistic.stock_adjustment_reason.inbound_receipt',        'logistic', 'Inbound receipt'),
  ('logistic.stock_adjustment_reason.pick',                   'logistic', 'Pick'),
  ('logistic.stock_adjustment_reason.return_restock',         'logistic', 'Return restock'),
  ('logistic.admin.navigation.storage_location',               'logistic', 'Storage locations'),
  ('logistic.admin.navigation.supplier',                       'logistic', 'Suppliers'),
  ('logistic.admin.navigation.stock_level',                    'logistic', 'Stock levels'),
  ('logistic.admin.navigation.inbound_receipt',                'logistic', 'Inbound receipts'),
  ('logistic.admin.navigation.pick_task',                      'logistic', 'Pick tasks'),
  ('logistic.admin.navigation.shipment',                       'logistic', 'Shipments'),
  ('logistic.admin.navigation.return_authorization',           'logistic', 'Return authorizations'),
  ('logistic.admin.navigation.cycle_count',                    'logistic', 'Cycle counts'),
  ('logistic.field.sku',                                'logistic', 'SKU'),
  ('logistic.field.on_hand',                            'logistic', 'On hand'),
  ('logistic.field.reserved',                           'logistic', 'Reserved'),
  ('logistic.field.available',                          'logistic', 'Available'),
  ('logistic.field.lead_time_day',                      'logistic', 'Lead time (days)'),
  ('logistic.field.storage_location_type',                      'logistic', 'Location type'),
  ('logistic.field.carrier',                            'logistic', 'Carrier'),
  ('logistic.field.tracking_number',                    'logistic', 'Tracking number'),
  ('logistic.field.reorder_point',                      'logistic', 'Reorder point')
) as v(slug, scope, content)
join local_text_link l on l.slug = v.slug and l.scope = v.scope and l.entity_id is null
on conflict (link, locale) do nothing;

-- ──────────────────────────────────────────────────────────────────────────────
-- French copy
-- ──────────────────────────────────────────────────────────────────────────────

-- Storage location names
insert into local_text (link, locale, content)
select l.id,
       (select id from locale where code = 'fr'),
       v.display
from (values
  ('warehouse-main', 'Entrepôt principal'),
  ('zone-a',         'Zone A'),
  ('zone-b',         'Zone B'),
  ('aisle-a1',       'Allée A1'),
  ('aisle-a2',       'Allée A2'),
  ('aisle-b1',       'Allée B1'),
  ('bin-a1-01',      'Casier A1-01'),
  ('bin-a1-02',      'Casier A1-02'),
  ('bin-a1-03',      'Casier A1-03'),
  ('bin-a2-01',      'Casier A2-01'),
  ('bin-a2-02',      'Casier A2-02'),
  ('bin-b1-01',      'Casier B1-01'),
  ('bin-b1-02',      'Casier B1-02'),
  ('receiving-dock', 'Quai de réception'),
  ('returns-area',   'Zone de retours')
) as v(entity_slug, display)
join storage_location sl on sl.slug = v.entity_slug
join local_text_link l
  on l.slug = 'name' and l.scope = 'storage_location' and l.entity_id = sl.id
on conflict (link, locale) do nothing;

-- Supplier names
insert into local_text (link, locale, content)
select l.id,
       (select id from locale where code = 'fr'),
       v.display
from (values
  ('acme-supply',  'Acme Supply Co.'),
  ('global-parts', 'Global Parts Ltée'),
  ('local-goods',  'Local Goods Inc.')
) as v(entity_slug, display)
join supplier s on s.slug = v.entity_slug
join local_text_link l
  on l.slug = 'name' and l.scope = 'supplier' and l.entity_id = s.id
on conflict (link, locale) do nothing;

-- UI copy
insert into local_text (link, locale, content)
select l.id,
       (select id from locale where code = 'fr'),
       v.content
from (values
  ('logistic.dashboard.title',                    'logistic', 'Logistique'),
  ('logistic.storage_location_type.warehouse',                  'logistic', 'Entrepôt'),
  ('logistic.storage_location_type.zone',                       'logistic', 'Zone'),
  ('logistic.storage_location_type.aisle',                      'logistic', 'Allée'),
  ('logistic.storage_location_type.bin',                        'logistic', 'Casier'),
  ('logistic.inbound_receipt.status.pending',           'logistic', 'En attente'),
  ('logistic.inbound_receipt.status.partial',           'logistic', 'Partiel'),
  ('logistic.inbound_receipt.status.completed',          'logistic', 'Terminé'),
  ('logistic.inbound_receipt.status.cancelled',         'logistic', 'Annulé'),
  ('logistic.inbound_receipt.blind',                    'logistic', 'Réception à l''aveugle'),
  ('logistic.pick_task.status.open',                    'logistic', 'Ouvert'),
  ('logistic.pick_task.status.in_progress',             'logistic', 'En cours'),
  ('logistic.pick_task.status.completed',               'logistic', 'Terminé'),
  ('logistic.pick_task.status.cancelled',               'logistic', 'Annulé'),
  ('logistic.shipment.status.created',                  'logistic', 'Créée'),
  ('logistic.shipment.status.packed',                   'logistic', 'Emballée'),
  ('logistic.shipment.status.dispatched',               'logistic', 'Expédiée'),
  ('logistic.shipment.status.in_transit',               'logistic', 'En transit'),
  ('logistic.shipment.status.delivered',                'logistic', 'Livrée'),
  ('logistic.shipment.status.exception',                'logistic', 'Exception'),
  ('logistic.return_authorization.condition.salable',                 'logistic', 'Vendable'),
  ('logistic.return_authorization.condition.damaged',                 'logistic', 'Endommagé'),
  ('logistic.return_authorization.condition.defective',               'logistic', 'Défectueux'),
  ('logistic.return_authorization.condition.wrong_item',              'logistic', 'Article incorrect'),
  ('logistic.return_authorization.disposition.restock',               'logistic', 'Remise en stock'),
  ('logistic.return_authorization.disposition.quarantine',            'logistic', 'Quarantaine'),
  ('logistic.return_authorization.disposition.scrap',                 'logistic', 'Rebut'),
  ('logistic.return_authorization.disposition.refurbish',             'logistic', 'Remise en état'),
  ('logistic.return_authorization.status.pending',      'logistic', 'En attente'),
  ('logistic.return_authorization.status.received',     'logistic', 'Reçu'),
  ('logistic.return_authorization.status.processed',    'logistic', 'Traité'),
  ('logistic.return_authorization.status.cancelled',    'logistic', 'Annulé'),
  ('logistic.cycle_count.status.open',                  'logistic', 'Ouvert'),
  ('logistic.cycle_count.status.in_progress',           'logistic', 'En cours'),
  ('logistic.cycle_count.status.completed',              'logistic', 'Terminé'),
  ('logistic.cycle_count.status.cancelled',             'logistic', 'Annulé'),
  ('logistic.stock_adjustment_reason.damage',                 'logistic', 'Dommage'),
  ('logistic.stock_adjustment_reason.theft',                  'logistic', 'Vol'),
  ('logistic.stock_adjustment_reason.receiving_error',        'logistic', 'Erreur de réception'),
  ('logistic.stock_adjustment_reason.cycle_count_variance',   'logistic', 'Écart d''inventaire tournant'),
  ('logistic.stock_adjustment_reason.system_correction',      'logistic', 'Correction système'),
  ('logistic.stock_adjustment_reason.other',                  'logistic', 'Autre'),
  ('logistic.stock_adjustment_reason.inbound_receipt',        'logistic', 'Réception entrante'),
  ('logistic.stock_adjustment_reason.pick',                   'logistic', 'Prélèvement'),
  ('logistic.stock_adjustment_reason.return_restock',         'logistic', 'Remise en stock (retour)'),
  ('logistic.admin.navigation.storage_location',               'logistic', 'Emplacements de stockage'),
  ('logistic.admin.navigation.supplier',                       'logistic', 'Fournisseurs'),
  ('logistic.admin.navigation.stock_level',                    'logistic', 'Niveaux de stock'),
  ('logistic.admin.navigation.inbound_receipt',                'logistic', 'Réceptions'),
  ('logistic.admin.navigation.pick_task',                      'logistic', 'Tâches de prélèvement'),
  ('logistic.admin.navigation.shipment',                       'logistic', 'Expéditions'),
  ('logistic.admin.navigation.return_authorization',           'logistic', 'Autorisations de retour'),
  ('logistic.admin.navigation.cycle_count',                    'logistic', 'Inventaires tournants'),
  ('logistic.field.sku',                                'logistic', 'SKU'),
  ('logistic.field.on_hand',                            'logistic', 'En stock'),
  ('logistic.field.reserved',                           'logistic', 'Réservé'),
  ('logistic.field.available',                          'logistic', 'Disponible'),
  ('logistic.field.lead_time_day',                      'logistic', 'Délai de livraison (jours)'),
  ('logistic.field.storage_location_type',                      'logistic', 'Type d''emplacement'),
  ('logistic.field.carrier',                            'logistic', 'Transporteur'),
  ('logistic.field.tracking_number',                    'logistic', 'Numéro de suivi'),
  ('logistic.field.reorder_point',                      'logistic', 'Seuil de réapprovisionnement')
) as v(slug, scope, content)
join local_text_link l on l.slug = v.slug and l.scope = v.scope and l.entity_id is null
on conflict (link, locale) do nothing;

-- ──────────────────────────────────────────────────────────────────────────────
-- Screen copy — supplier bundle
--
-- Added with the supplier screen bundle. Seeds stay module-granular (an unselected
-- screen's copy is harmless, a missing row is not), so this lives here rather than
-- beside the screen. Global labels the screen also uses — action.save, action.cancel,
-- action.back, action.remove — come from the base seed under scope null.
-- ──────────────────────────────────────────────────────────────────────────────

insert into local_text_link (slug, scope, entity_id)
values
  ('logistic.supplier.title',        'logistic', null),
  ('logistic.supplier.add',          'logistic', null),
  ('logistic.supplier.empty',        'logistic', null),
  ('logistic.supplier.contacts',     'logistic', null),
  ('logistic.supplier.contact_add',  'logistic', null),
  ('logistic.supplier.contact_none', 'logistic', null),
  ('logistic.field.slug',            'logistic', null),
  ('logistic.field.active',          'logistic', null),
  ('logistic.field.role',            'logistic', null),
  ('logistic.field.name',            'logistic', null),
  ('logistic.field.email',           'logistic', null),
  ('logistic.field.phone',           'logistic', null)
on conflict do nothing;

insert into local_text (link, locale, content)
select l.id, (select id from locale where code = 'en'), v.content
from (values
  ('logistic.supplier.title',        'Suppliers'),
  ('logistic.supplier.add',          'Add supplier'),
  ('logistic.supplier.empty',        'No suppliers yet. Add one to start recording inbound receipts.'),
  ('logistic.supplier.contacts',     'Contacts'),
  ('logistic.supplier.contact_add',  'Add contact'),
  ('logistic.supplier.contact_none', 'No contacts recorded for this supplier.'),
  ('logistic.field.slug',            'Slug'),
  ('logistic.field.active',          'Active'),
  ('logistic.field.role',            'Role'),
  ('logistic.field.name',            'Name'),
  ('logistic.field.email',           'Email'),
  ('logistic.field.phone',           'Phone')
) as v(slug, content)
join local_text_link l on l.slug = v.slug and l.scope = 'logistic' and l.entity_id is null
on conflict (link, locale) do nothing;

insert into local_text (link, locale, content)
select l.id, (select id from locale where code = 'fr'), v.content
from (values
  ('logistic.supplier.title',        'Fournisseurs'),
  ('logistic.supplier.add',          'Ajouter un fournisseur'),
  ('logistic.supplier.empty',        'Aucun fournisseur. Ajoutez-en un pour enregistrer des réceptions.'),
  ('logistic.supplier.contacts',     'Contacts'),
  ('logistic.supplier.contact_add',  'Ajouter un contact'),
  ('logistic.supplier.contact_none', 'Aucun contact enregistré pour ce fournisseur.'),
  ('logistic.field.slug',            'Identifiant'),
  ('logistic.field.active',          'Actif'),
  ('logistic.field.role',            'Rôle'),
  ('logistic.field.name',            'Nom'),
  ('logistic.field.email',           'Courriel'),
  ('logistic.field.phone',           'Téléphone')
) as v(slug, content)
join local_text_link l on l.slug = v.slug and l.scope = 'logistic' and l.entity_id is null
on conflict (link, locale) do nothing;

-- ──────────────────────────────────────────────────────────────────────────────
-- Screen copy — stock bundle
--
-- The field and adjustment_reason slugs this screen also renders are seeded above with
-- the module's base copy; only what is new to the bundle is added here. Global labels
-- (action.save, action.cancel, action.close) come from the base seed under scope null.
-- ──────────────────────────────────────────────────────────────────────────────

insert into local_text_link (slug, scope, entity_id)
values
  ('logistic.stock_level.title',                'logistic', null),
  ('logistic.stock_level.filters',              'logistic', null),
  ('logistic.stock_level.filter_all',           'logistic', null),
  ('logistic.stock_level.filter_low',           'logistic', null),
  ('logistic.stock_level.empty',                'logistic', null),
  ('logistic.stock_level.empty_low',            'logistic', null),
  ('logistic.stock_level.history',              'logistic', null),
  ('logistic.stock_level.history_empty',        'logistic', null),
  ('logistic.stock_level.adjust',               'logistic', null),
  ('logistic.stock_level.adjust_title',         'logistic', null),
  ('logistic.stock_level.adjust_delta',         'logistic', null),
  ('logistic.stock_level.adjust_apply',         'logistic', null),
  ('logistic.stock_level.reorder_point_hint',   'logistic', null),
  ('logistic.field.storage_location',             'logistic', null),
  ('logistic.field.reason',               'logistic', null),
  ('logistic.field.note',                 'logistic', null),
  ('logistic.stock_level.history_after',        'logistic', null)
on conflict do nothing;

insert into local_text (link, locale, content)
select l.id, (select id from locale where code = 'en'), v.content
from (values
  ('logistic.stock_level.title',                'Stock levels'),
  ('logistic.stock_level.filters',              'Stock filters'),
  ('logistic.stock_level.filter_all',           'All'),
  ('logistic.stock_level.filter_low',           'Low stock'),
  ('logistic.stock_level.empty',                'No stock levels yet.'),
  ('logistic.stock_level.empty_low',            'No items below their reorder point.'),
  ('logistic.stock_level.history',              'History'),
  ('logistic.stock_level.history_empty',        'No adjustments recorded for this stock level.'),
  ('logistic.stock_level.adjust',               'Adjust'),
  ('logistic.stock_level.adjust_title',         'Adjust stock'),
  ('logistic.stock_level.adjust_delta',         'Change (negative to remove)'),
  ('logistic.stock_level.adjust_apply',         'Apply adjustment'),
  ('logistic.stock_level.reorder_point_hint',   'Reorder point (blank to disable alerts)'),
  ('logistic.field.storage_location',             'Location'),
  ('logistic.field.reason',               'Reason'),
  ('logistic.field.note',                 'Note'),
  ('logistic.stock_level.history_after',        '→ {$count} on hand')
) as v(slug, content)
join local_text_link l on l.slug = v.slug and l.scope = 'logistic' and l.entity_id is null
on conflict (link, locale) do nothing;

insert into local_text (link, locale, content)
select l.id, (select id from locale where code = 'fr'), v.content
from (values
  ('logistic.stock_level.title',                'Niveaux de stock'),
  ('logistic.stock_level.filters',              'Filtres de stock'),
  ('logistic.stock_level.filter_all',           'Tout'),
  ('logistic.stock_level.filter_low',           'Stock faible'),
  ('logistic.stock_level.empty',                'Aucun niveau de stock.'),
  ('logistic.stock_level.empty_low',            'Aucun article sous son point de commande.'),
  ('logistic.stock_level.history',              'Historique'),
  ('logistic.stock_level.history_empty',        'Aucun ajustement enregistré pour ce niveau de stock.'),
  ('logistic.stock_level.adjust',               'Ajuster'),
  ('logistic.stock_level.adjust_title',         'Ajuster le stock'),
  ('logistic.stock_level.adjust_delta',         'Variation (négative pour retirer)'),
  ('logistic.stock_level.adjust_apply',         'Appliquer l''ajustement'),
  ('logistic.stock_level.reorder_point_hint',   'Point de commande (vide pour désactiver les alertes)'),
  ('logistic.field.storage_location',             'Emplacement'),
  ('logistic.field.reason',               'Motif'),
  ('logistic.field.note',                 'Note'),
  ('logistic.stock_level.history_after',        '→ {$count} en stock')
) as v(slug, content)
join local_text_link l on l.slug = v.slug and l.scope = 'logistic' and l.entity_id is null
on conflict (link, locale) do nothing;

-- ──────────────────────────────────────────────────────────────────────────────
-- Screen copy — receipt bundle
--
-- The status labels and logistic.inbound_receipt.blind this screen renders are seeded
-- above with the module's base copy; only what is new to the bundle is added here.
-- ──────────────────────────────────────────────────────────────────────────────

insert into local_text_link (slug, scope, entity_id)
values
  ('logistic.inbound_receipt.title',                'logistic', null),
  ('logistic.inbound_receipt.one',                  'logistic', null),
  ('logistic.inbound_receipt.new',                  'logistic', null),
  ('logistic.inbound_receipt.create',               'logistic', null),
  ('logistic.inbound_receipt.empty',                'logistic', null),
  ('logistic.inbound_receipt.filter_all',           'logistic', null),
  ('logistic.inbound_receipt.filter_status',        'logistic', null),
  ('logistic.inbound_receipt.pagination',           'logistic', null),
  ('logistic.inbound_receipt.supplier',             'logistic', null),
  ('logistic.inbound_receipt.expected_at',          'logistic', null),
  ('logistic.inbound_receipt.received_at',          'logistic', null),
  ('logistic.inbound_receipt.lines',                'logistic', null),
  ('logistic.inbound_receipt.lines_empty',          'logistic', null),
  ('logistic.inbound_receipt.line_add',             'logistic', null),
  ('logistic.inbound_receipt.expected_quantity',    'logistic', null),
  ('logistic.inbound_receipt.received_quantity',    'logistic', null),
  ('logistic.inbound_receipt.discrepancy',          'logistic', null),
  ('logistic.inbound_receipt.receive',              'logistic', null)
on conflict do nothing;

insert into local_text (link, locale, content)
select l.id, (select id from locale where code = 'en'), v.content
from (values
  ('logistic.inbound_receipt.title',                'Inbound receipts'),
  ('logistic.inbound_receipt.one',                  'Inbound receipt'),
  ('logistic.inbound_receipt.new',                  'New receipt'),
  ('logistic.inbound_receipt.create',               'Create receipt'),
  ('logistic.inbound_receipt.empty',                'No receipts found.'),
  ('logistic.inbound_receipt.filter_all',           'All'),
  ('logistic.inbound_receipt.filter_status',        'Filter receipts by status'),
  ('logistic.inbound_receipt.pagination',           'Receipt pages'),
  ('logistic.inbound_receipt.supplier',             'Supplier'),
  ('logistic.inbound_receipt.expected_at',          'Expected'),
  ('logistic.inbound_receipt.received_at',          'Received'),
  ('logistic.inbound_receipt.lines',                'Lines'),
  ('logistic.inbound_receipt.lines_empty',          'No lines yet. Add lines to begin receiving.'),
  ('logistic.inbound_receipt.line_add',             'Add line'),
  ('logistic.inbound_receipt.expected_quantity',    'Expected quantity'),
  ('logistic.inbound_receipt.received_quantity',    'Received quantity'),
  ('logistic.inbound_receipt.discrepancy',          'Discrepancy'),
  ('logistic.inbound_receipt.receive',              'Receive')
) as v(slug, content)
join local_text_link l on l.slug = v.slug and l.scope = 'logistic' and l.entity_id is null
on conflict (link, locale) do nothing;

insert into local_text (link, locale, content)
select l.id, (select id from locale where code = 'fr'), v.content
from (values
  ('logistic.inbound_receipt.title',                'Réceptions'),
  ('logistic.inbound_receipt.one',                  'Réception'),
  ('logistic.inbound_receipt.new',                  'Nouvelle réception'),
  ('logistic.inbound_receipt.create',               'Créer la réception'),
  ('logistic.inbound_receipt.empty',                'Aucune réception trouvée.'),
  ('logistic.inbound_receipt.filter_all',           'Toutes'),
  ('logistic.inbound_receipt.filter_status',        'Filtrer les réceptions par statut'),
  ('logistic.inbound_receipt.pagination',           'Pages de réceptions'),
  ('logistic.inbound_receipt.supplier',             'Fournisseur'),
  ('logistic.inbound_receipt.expected_at',          'Prévue'),
  ('logistic.inbound_receipt.received_at',          'Reçue'),
  ('logistic.inbound_receipt.lines',                'Lignes'),
  ('logistic.inbound_receipt.lines_empty',          'Aucune ligne. Ajoutez des lignes pour commencer la réception.'),
  ('logistic.inbound_receipt.line_add',             'Ajouter une ligne'),
  ('logistic.inbound_receipt.expected_quantity',    'Quantité prévue'),
  ('logistic.inbound_receipt.received_quantity',    'Quantité reçue'),
  ('logistic.inbound_receipt.discrepancy',          'Écart'),
  ('logistic.inbound_receipt.receive',              'Réceptionner')
) as v(slug, content)
join local_text_link l on l.slug = v.slug and l.scope = 'logistic' and l.entity_id is null
on conflict (link, locale) do nothing;

-- ──────────────────────────────────────────────────────────────────────────────
-- Screen copy — shipment bundle
--
-- The six logistic.shipment.status.* labels this screen renders are seeded above with the
-- module's base copy; only what is new to the bundle is added here.
-- ──────────────────────────────────────────────────────────────────────────────

insert into local_text_link (slug, scope, entity_id)
values
  ('logistic.shipment.title',                 'logistic', null),
  ('logistic.shipment.one',                   'logistic', null),
  ('logistic.shipment.new',                   'logistic', null),
  ('logistic.shipment.create',                'logistic', null),
  ('logistic.shipment.empty',                 'logistic', null),
  ('logistic.shipment.filter_all',            'logistic', null),
  ('logistic.shipment.filter_status',         'logistic', null),
  ('logistic.shipment.lines',                 'logistic', null),
  ('logistic.shipment.lines_empty',           'logistic', null),
  ('logistic.shipment.quantity',              'logistic', null),
  ('logistic.shipment.service_level',         'logistic', null),
  ('logistic.shipment.created_at',            'logistic', null),
  ('logistic.shipment.status_label',          'logistic', null),
  ('logistic.shipment.status_update',         'logistic', null),
  ('logistic.shipment.carrier_tracking',      'logistic', null),
  ('logistic.shipment.tracking_events',       'logistic', null),
  ('logistic.shipment.event',                 'logistic', null),
  ('logistic.shipment.event_add',             'logistic', null),
  ('logistic.shipment.event_description',     'logistic', null)
on conflict do nothing;

insert into local_text (link, locale, content)
select l.id, (select id from locale where code = 'en'), v.content
from (values
  ('logistic.shipment.title',                 'Shipments'),
  ('logistic.shipment.one',                   'Shipment'),
  ('logistic.shipment.new',                   'New shipment'),
  ('logistic.shipment.create',                'Create shipment'),
  ('logistic.shipment.empty',                 'No shipments found.'),
  ('logistic.shipment.filter_all',            'All'),
  ('logistic.shipment.filter_status',         'Filter shipments by status'),
  ('logistic.shipment.lines',                 'Lines'),
  ('logistic.shipment.lines_empty',           'No lines on this shipment.'),
  ('logistic.shipment.quantity',              'Quantity'),
  ('logistic.shipment.service_level',         'Service level'),
  ('logistic.shipment.created_at',            'Created'),
  ('logistic.shipment.status_label',          'Status'),
  ('logistic.shipment.status_update',         'Update status'),
  ('logistic.shipment.carrier_tracking',      'Carrier and tracking'),
  ('logistic.shipment.tracking_events',       'Tracking events'),
  ('logistic.shipment.event',                 'Event'),
  ('logistic.shipment.event_add',             'Add tracking event'),
  ('logistic.shipment.event_description',     'Description')
) as v(slug, content)
join local_text_link l on l.slug = v.slug and l.scope = 'logistic' and l.entity_id is null
on conflict (link, locale) do nothing;

insert into local_text (link, locale, content)
select l.id, (select id from locale where code = 'fr'), v.content
from (values
  ('logistic.shipment.title',                 'Expéditions'),
  ('logistic.shipment.one',                   'Expédition'),
  ('logistic.shipment.new',                   'Nouvelle expédition'),
  ('logistic.shipment.create',                'Créer l''expédition'),
  ('logistic.shipment.empty',                 'Aucune expédition trouvée.'),
  ('logistic.shipment.filter_all',            'Toutes'),
  ('logistic.shipment.filter_status',         'Filtrer les expéditions par statut'),
  ('logistic.shipment.lines',                 'Lignes'),
  ('logistic.shipment.lines_empty',           'Aucune ligne sur cette expédition.'),
  ('logistic.shipment.quantity',              'Quantité'),
  ('logistic.shipment.service_level',         'Niveau de service'),
  ('logistic.shipment.created_at',            'Créée'),
  ('logistic.shipment.status_label',          'Statut'),
  ('logistic.shipment.status_update',         'Mettre à jour le statut'),
  ('logistic.shipment.carrier_tracking',      'Transporteur et suivi'),
  ('logistic.shipment.tracking_events',       'Événements de suivi'),
  ('logistic.shipment.event',                 'Événement'),
  ('logistic.shipment.event_add',             'Ajouter un événement'),
  ('logistic.shipment.event_description',     'Description')
) as v(slug, content)
join local_text_link l on l.slug = v.slug and l.scope = 'logistic' and l.entity_id is null
on conflict (link, locale) do nothing;

-- ──────────────────────────────────────────────────────────────────────────────
-- Screen copy — return bundle
--
-- The condition, disposition and return_authorization.status labels this screen renders
-- are seeded above with the module's base copy; only what is new is added here.
-- ──────────────────────────────────────────────────────────────────────────────

insert into local_text_link (slug, scope, entity_id)
values
  ('logistic.return_authorization.title',                   'logistic', null),
  ('logistic.return_authorization.one',                     'logistic', null),
  ('logistic.return_authorization.new',                     'logistic', null),
  ('logistic.return_authorization.create',                  'logistic', null),
  ('logistic.return_authorization.empty',                   'logistic', null),
  ('logistic.return_authorization.filter_all',              'logistic', null),
  ('logistic.return_authorization.filter_status',           'logistic', null),
  ('logistic.return_authorization.status_label',            'logistic', null),
  ('logistic.return_authorization.reason',                  'logistic', null),
  ('logistic.return_authorization.lines',                   'logistic', null),
  ('logistic.return_authorization.lines_empty',             'logistic', null),
  ('logistic.return_authorization.created_at',              'logistic', null),
  ('logistic.return_authorization.expected_quantity',       'logistic', null),
  ('logistic.return_authorization.received_quantity',       'logistic', null),
  ('logistic.return_authorization.grade',                   'logistic', null),
  ('logistic.return_authorization.no_location',             'logistic', null),
  ('logistic.return_authorization.process',                 'logistic', null),
  ('logistic.return_authorization.process_confirm',         'logistic', null),
  ('logistic.return_authorization.condition',               'logistic', null),
  ('logistic.return_authorization.disposition',             'logistic', null)
on conflict do nothing;

insert into local_text (link, locale, content)
select l.id, (select id from locale where code = 'en'), v.content
from (values
  ('logistic.return_authorization.title',                   'Return authorizations'),
  ('logistic.return_authorization.one',                     'Return authorization'),
  ('logistic.return_authorization.new',                     'New return'),
  ('logistic.return_authorization.create',                  'Create return'),
  ('logistic.return_authorization.empty',                   'No returns found.'),
  ('logistic.return_authorization.filter_all',              'All'),
  ('logistic.return_authorization.filter_status',           'Filter returns by status'),
  ('logistic.return_authorization.status_label',            'Status'),
  ('logistic.return_authorization.reason',                  'Reason'),
  ('logistic.return_authorization.lines',                   'Lines'),
  ('logistic.return_authorization.lines_empty',             'No lines on this return.'),
  ('logistic.return_authorization.created_at',              'Created'),
  ('logistic.return_authorization.expected_quantity',       'Expected'),
  ('logistic.return_authorization.received_quantity',       'Received'),
  ('logistic.return_authorization.grade',                   'Grade'),
  ('logistic.return_authorization.no_location',             'No location'),
  ('logistic.return_authorization.process',                 'Mark processed'),
  ('logistic.return_authorization.process_confirm',         'Every line has been graded. Marking this return processed cannot be undone.'),
  ('logistic.return_authorization.condition',               'Condition'),
  ('logistic.return_authorization.disposition',             'Disposition')
) as v(slug, content)
join local_text_link l on l.slug = v.slug and l.scope = 'logistic' and l.entity_id is null
on conflict (link, locale) do nothing;

insert into local_text (link, locale, content)
select l.id, (select id from locale where code = 'fr'), v.content
from (values
  ('logistic.return_authorization.title',                   'Autorisations de retour'),
  ('logistic.return_authorization.one',                     'Autorisation de retour'),
  ('logistic.return_authorization.new',                     'Nouveau retour'),
  ('logistic.return_authorization.create',                  'Créer le retour'),
  ('logistic.return_authorization.empty',                   'Aucun retour trouvé.'),
  ('logistic.return_authorization.filter_all',              'Tous'),
  ('logistic.return_authorization.filter_status',           'Filtrer les retours par statut'),
  ('logistic.return_authorization.status_label',            'Statut'),
  ('logistic.return_authorization.reason',                  'Motif'),
  ('logistic.return_authorization.lines',                   'Lignes'),
  ('logistic.return_authorization.lines_empty',             'Aucune ligne sur ce retour.'),
  ('logistic.return_authorization.created_at',              'Créé'),
  ('logistic.return_authorization.expected_quantity',       'Attendue'),
  ('logistic.return_authorization.received_quantity',       'Reçue'),
  ('logistic.return_authorization.grade',                   'Évaluer'),
  ('logistic.return_authorization.no_location',             'Aucun emplacement'),
  ('logistic.return_authorization.process',                 'Marquer traité'),
  ('logistic.return_authorization.process_confirm',         'Toutes les lignes sont évaluées. Marquer ce retour comme traité est irréversible.'),
  ('logistic.return_authorization.condition',               'État'),
  ('logistic.return_authorization.disposition',             'Traitement')
) as v(slug, content)
join local_text_link l on l.slug = v.slug and l.scope = 'logistic' and l.entity_id is null
on conflict (link, locale) do nothing;

-- ──────────────────────────────────────────────────────────────────────────────
-- Screen copy — cycle-count bundle
--
-- The four logistic.cycle_count.status.* labels are seeded above with the module's base
-- copy; only what is new to the bundle is added here. progress_value and variance_count are
-- MF2 patterns so a locale can place their numbers where its grammar needs them.
-- ──────────────────────────────────────────────────────────────────────────────

insert into local_text_link (slug, scope, entity_id)
values
  ('logistic.cycle_count.title',                'logistic', null),
  ('logistic.cycle_count.one',                  'logistic', null),
  ('logistic.cycle_count.new',                  'logistic', null),
  ('logistic.cycle_count.create',               'logistic', null),
  ('logistic.cycle_count.empty',                'logistic', null),
  ('logistic.cycle_count.filter_all',           'logistic', null),
  ('logistic.cycle_count.filter_status',        'logistic', null),
  ('logistic.cycle_count.status_label',         'logistic', null),
  ('logistic.cycle_count.created_at',           'logistic', null),
  ('logistic.cycle_count.progress',             'logistic', null),
  ('logistic.cycle_count.progress_value',       'logistic', null),
  ('logistic.cycle_count.choose_locations',     'logistic', null),
  ('logistic.cycle_count.expected',             'logistic', null),
  ('logistic.cycle_count.counted',              'logistic', null),
  ('logistic.cycle_count.variance',             'logistic', null),
  ('logistic.cycle_count.variance_count',       'logistic', null),
  ('logistic.cycle_count.matched',              'logistic', null),
  ('logistic.cycle_count.approve',              'logistic', null),
  ('logistic.cycle_count.approve_confirm',      'logistic', null)
on conflict do nothing;

insert into local_text (link, locale, content)
select l.id, (select id from locale where code = 'en'), v.content
from (values
  ('logistic.cycle_count.title',                'Cycle counts'),
  ('logistic.cycle_count.one',                  'Cycle count'),
  ('logistic.cycle_count.new',                  'New cycle count'),
  ('logistic.cycle_count.create',               'Open count'),
  ('logistic.cycle_count.empty',                'No cycle counts found.'),
  ('logistic.cycle_count.filter_all',           'All'),
  ('logistic.cycle_count.filter_status',        'Filter counts by status'),
  ('logistic.cycle_count.status_label',         'Status'),
  ('logistic.cycle_count.created_at',           'Opened'),
  ('logistic.cycle_count.progress',             'Counted'),
  ('logistic.cycle_count.progress_value',       '{$counted} of {$total} counted'),
  ('logistic.cycle_count.choose_locations',     'Locations to count'),
  ('logistic.cycle_count.expected',             'Expected'),
  ('logistic.cycle_count.counted',              'Counted'),
  ('logistic.cycle_count.variance',             'Variance'),
  ('logistic.cycle_count.variance_count',       '{$count} with variance'),
  ('logistic.cycle_count.matched',              'Matched'),
  ('logistic.cycle_count.approve',              'Approve count'),
  ('logistic.cycle_count.approve_confirm',      'Approving writes a stock adjustment for every counted line with a variance. This cannot be undone.')
) as v(slug, content)
join local_text_link l on l.slug = v.slug and l.scope = 'logistic' and l.entity_id is null
on conflict (link, locale) do nothing;

insert into local_text (link, locale, content)
select l.id, (select id from locale where code = 'fr'), v.content
from (values
  ('logistic.cycle_count.title',                'Inventaires tournants'),
  ('logistic.cycle_count.one',                  'Inventaire tournant'),
  ('logistic.cycle_count.new',                  'Nouvel inventaire'),
  ('logistic.cycle_count.create',               'Ouvrir l''inventaire'),
  ('logistic.cycle_count.empty',                'Aucun inventaire trouvé.'),
  ('logistic.cycle_count.filter_all',           'Tous'),
  ('logistic.cycle_count.filter_status',        'Filtrer les inventaires par statut'),
  ('logistic.cycle_count.status_label',         'Statut'),
  ('logistic.cycle_count.created_at',           'Ouvert'),
  ('logistic.cycle_count.progress',             'Comptées'),
  ('logistic.cycle_count.progress_value',       '{$counted} sur {$total} comptées'),
  ('logistic.cycle_count.choose_locations',     'Emplacements à compter'),
  ('logistic.cycle_count.expected',             'Attendu'),
  ('logistic.cycle_count.counted',              'Compté'),
  ('logistic.cycle_count.variance',             'Écart'),
  ('logistic.cycle_count.variance_count',       '{$count} avec écart'),
  ('logistic.cycle_count.matched',              'Conforme'),
  ('logistic.cycle_count.approve',              'Approuver'),
  ('logistic.cycle_count.approve_confirm',      'Approuver enregistre un ajustement de stock pour chaque ligne comptée présentant un écart. Cette action est irréversible.')
) as v(slug, content)
join local_text_link l on l.slug = v.slug and l.scope = 'logistic' and l.entity_id is null
on conflict (link, locale) do nothing;

-- ──────────────────────────────────────────────────────────────────────────────
-- Screen copy — warehouse bundle
--
-- The shell's own labels are module copy under scope 'logistic' rather than global copy in
-- the base seed: a scaffold without this module has no warehouse to navigate, so its navigation
-- strings are not application chrome every project carries.
--
-- The status labels these screens render are seeded above with the module's base copy.
-- Several of these are MF2 patterns, so a locale can place their numbers where its grammar
-- needs them rather than the screen concatenating around a fixed word order.
-- ──────────────────────────────────────────────────────────────────────────────

insert into local_text_link (slug, scope, entity_id)
values
  ('logistic.warehouse.title',                  'logistic', null),
  ('logistic.warehouse.navigation',                    'logistic', null),
  ('logistic.warehouse.pick_task.title',                   'logistic', null),
  ('logistic.warehouse.pick_task.hint',              'logistic', null),
  ('logistic.warehouse.inbound_receipt.title',                'logistic', null),
  ('logistic.warehouse.inbound_receipt.hint',           'logistic', null),
  ('logistic.warehouse.cycle_count.title',                  'logistic', null),
  ('logistic.warehouse.cycle_count.hint',             'logistic', null),
  ('logistic.pick_task.one',                        'logistic', null),
  ('logistic.warehouse.pick_task.mine',                        'logistic', null),
  ('logistic.warehouse.pick_task.open',                        'logistic', null),
  ('logistic.warehouse.pick_task.empty',                       'logistic', null),
  ('logistic.warehouse.pick_task.take',                        'logistic', null),
  ('logistic.warehouse.pick_task.showing',                     'logistic', null),
  ('logistic.warehouse.pick_task.remaining',                   'logistic', null),
  ('logistic.warehouse.pick_task.picked_of',                   'logistic', null),
  ('logistic.warehouse.pick_task.quantity',                    'logistic', null),
  ('logistic.warehouse.pick_task.record',                      'logistic', null),
  ('logistic.warehouse.pick_task.complete',                    'logistic', null),
  ('logistic.warehouse.pick_task.complete_confirm',            'logistic', null),
  ('logistic.warehouse.pick_task.complete_short',              'logistic', null),
  ('logistic.warehouse.inbound_receipt.active',                   'logistic', null),
  ('logistic.warehouse.inbound_receipt.recent',                   'logistic', null),
  ('logistic.warehouse.inbound_receipt.empty',                    'logistic', null),
  ('logistic.warehouse.inbound_receipt.outstanding',              'logistic', null),
  ('logistic.warehouse.inbound_receipt.received_of',              'logistic', null),
  ('logistic.warehouse.inbound_receipt.discrepancy_note',         'logistic', null),
  ('logistic.warehouse.cycle_count.mine',                       'logistic', null),
  ('logistic.warehouse.cycle_count.open',                       'logistic', null),
  ('logistic.warehouse.cycle_count.empty',                      'logistic', null),
  ('logistic.warehouse.cycle_count.take',                       'logistic', null),
  ('logistic.warehouse.cycle_count.lines',                      'logistic', null),
  ('logistic.warehouse.cycle_count.record',                     'logistic', null),
  ('logistic.warehouse.cycle_count.counted_quantity',           'logistic', null),
  ('logistic.warehouse.cycle_count.approval_note',              'logistic', null)
on conflict do nothing;

insert into local_text (link, locale, content)
select l.id, (select id from locale where code = 'en'), v.content
from (values
  ('logistic.warehouse.title',                  'Warehouse'),
  ('logistic.warehouse.navigation',                    'Warehouse navigation'),
  ('logistic.warehouse.pick_task.title',                   'Pick queue'),
  ('logistic.warehouse.pick_task.hint',              'View and work open pick tasks'),
  ('logistic.warehouse.inbound_receipt.title',                'Receiving'),
  ('logistic.warehouse.inbound_receipt.hint',           'Process inbound receipts'),
  ('logistic.warehouse.cycle_count.title',                  'Counting'),
  ('logistic.warehouse.cycle_count.hint',             'Work assigned cycle counts'),
  ('logistic.pick_task.one',                        'Pick task'),
  ('logistic.warehouse.pick_task.mine',                        'Your tasks'),
  ('logistic.warehouse.pick_task.open',                        'Open queue'),
  ('logistic.warehouse.pick_task.empty',                       'Nothing waiting to be picked.'),
  ('logistic.warehouse.pick_task.take',                        'Take'),
  ('logistic.warehouse.pick_task.showing',                     'showing {$showing} of {$total}'),
  ('logistic.warehouse.pick_task.remaining',                   '{$remaining} of {$total} lines still to pick'),
  ('logistic.warehouse.pick_task.picked_of',                   '{$picked} of {$requested} picked'),
  ('logistic.warehouse.pick_task.quantity',                    'Picked quantity'),
  ('logistic.warehouse.pick_task.record',                      'Record'),
  ('logistic.warehouse.pick_task.complete',                    'Complete task'),
  ('logistic.warehouse.pick_task.complete_confirm',            'Everything has been picked. Completing the task closes it.'),
  ('logistic.warehouse.pick_task.complete_short',              'Some lines are short. Completing the task releases the stock still reserved for them.'),
  ('logistic.warehouse.inbound_receipt.active',                   'To receive'),
  ('logistic.warehouse.inbound_receipt.recent',                   'Recently completed'),
  ('logistic.warehouse.inbound_receipt.empty',                    'Nothing waiting to be received.'),
  ('logistic.warehouse.inbound_receipt.outstanding',              '{$outstanding} of {$total} lines outstanding'),
  ('logistic.warehouse.inbound_receipt.received_of',              '{$received} of {$expected} received'),
  ('logistic.warehouse.inbound_receipt.discrepancy_note',         'Discrepancy of {$discrepancy} against what was expected'),
  ('logistic.warehouse.cycle_count.mine',                       'Your counts'),
  ('logistic.warehouse.cycle_count.open',                       'Open counts'),
  ('logistic.warehouse.cycle_count.empty',                      'Nothing waiting to be counted.'),
  ('logistic.warehouse.cycle_count.take',                       'Take'),
  ('logistic.warehouse.cycle_count.lines',                      '{$total} lines'),
  ('logistic.warehouse.cycle_count.record',                     'Record'),
  ('logistic.warehouse.cycle_count.counted_quantity',           'Counted quantity'),
  ('logistic.warehouse.cycle_count.approval_note',              'What you record here corrects nothing on its own. An administrator reviews the variances and approves the count.')
) as v(slug, content)
join local_text_link l on l.slug = v.slug and l.scope = 'logistic' and l.entity_id is null
on conflict (link, locale) do nothing;

insert into local_text (link, locale, content)
select l.id, (select id from locale where code = 'fr'), v.content
from (values
  ('logistic.warehouse.title',                  'Entrepôt'),
  ('logistic.warehouse.navigation',                    'Navigation entrepôt'),
  ('logistic.warehouse.pick_task.title',                   'File de prélèvement'),
  ('logistic.warehouse.pick_task.hint',              'Consulter et traiter les tâches de prélèvement'),
  ('logistic.warehouse.inbound_receipt.title',                'Réception'),
  ('logistic.warehouse.inbound_receipt.hint',           'Traiter les réceptions entrantes'),
  ('logistic.warehouse.cycle_count.title',                  'Comptage'),
  ('logistic.warehouse.cycle_count.hint',             'Traiter les inventaires assignés'),
  ('logistic.pick_task.one',                        'Tâche de prélèvement'),
  ('logistic.warehouse.pick_task.mine',                        'Vos tâches'),
  ('logistic.warehouse.pick_task.open',                        'File ouverte'),
  ('logistic.warehouse.pick_task.empty',                       'Rien à prélever.'),
  ('logistic.warehouse.pick_task.take',                        'Prendre'),
  ('logistic.warehouse.pick_task.showing',                     '{$showing} sur {$total} affichées'),
  ('logistic.warehouse.pick_task.remaining',                   '{$remaining} lignes sur {$total} à prélever'),
  ('logistic.warehouse.pick_task.picked_of',                   '{$picked} sur {$requested} prélevés'),
  ('logistic.warehouse.pick_task.quantity',                    'Quantité prélevée'),
  ('logistic.warehouse.pick_task.record',                      'Enregistrer'),
  ('logistic.warehouse.pick_task.complete',                    'Terminer la tâche'),
  ('logistic.warehouse.pick_task.complete_confirm',            'Tout a été prélevé. Terminer la tâche la clôture.'),
  ('logistic.warehouse.pick_task.complete_short',              'Certaines lignes sont incomplètes. Terminer la tâche libère le stock encore réservé.'),
  ('logistic.warehouse.inbound_receipt.active',                   'À réceptionner'),
  ('logistic.warehouse.inbound_receipt.recent',                   'Récemment terminées'),
  ('logistic.warehouse.inbound_receipt.empty',                    'Rien à réceptionner.'),
  ('logistic.warehouse.inbound_receipt.outstanding',              '{$outstanding} lignes sur {$total} en attente'),
  ('logistic.warehouse.inbound_receipt.received_of',              '{$received} sur {$expected} reçus'),
  ('logistic.warehouse.inbound_receipt.discrepancy_note',         'Écart de {$discrepancy} par rapport au prévu'),
  ('logistic.warehouse.cycle_count.mine',                       'Vos inventaires'),
  ('logistic.warehouse.cycle_count.open',                       'Inventaires ouverts'),
  ('logistic.warehouse.cycle_count.empty',                      'Rien à compter.'),
  ('logistic.warehouse.cycle_count.take',                       'Prendre'),
  ('logistic.warehouse.cycle_count.lines',                      '{$total} lignes'),
  ('logistic.warehouse.cycle_count.record',                     'Enregistrer'),
  ('logistic.warehouse.cycle_count.counted_quantity',           'Quantité comptée'),
  ('logistic.warehouse.cycle_count.approval_note',              'Ce que vous enregistrez ici ne corrige rien en soi. Un administrateur examine les écarts et approuve l''inventaire.')
) as v(slug, content)
join local_text_link l on l.slug = v.slug and l.scope = 'logistic' and l.entity_id is null
on conflict (link, locale) do nothing;

-- ──────────────────────────────────────────────────────────────────────────────
-- Screen copy — dashboard bundle
--
-- The navigation labels and dashboard title are seeded above with the module's base copy; only the
-- dashboard's own section headings and metric descriptions are new.
-- ──────────────────────────────────────────────────────────────────────────────

insert into local_text_link (slug, scope, entity_id)
values
  ('logistic.dashboard.open',                 'logistic', null),
  ('logistic.dashboard.pending',              'logistic', null),
  ('logistic.dashboard.low_stock',            'logistic', null),
  ('logistic.dashboard.below_reorder',        'logistic', null),
  ('logistic.dashboard.pending_inbound_receipt',     'logistic', null),
  ('logistic.dashboard.open_pick_task',           'logistic', null),
  ('logistic.dashboard.open_return_authorization',         'logistic', null),
  ('logistic.dashboard.sections',             'logistic', null)
on conflict do nothing;

insert into local_text (link, locale, content)
select l.id, (select id from locale where code = 'en'), v.content
from (values
  ('logistic.dashboard.open',                 'Open'),
  ('logistic.dashboard.pending',              'Pending'),
  ('logistic.dashboard.low_stock',            'Low stock'),
  ('logistic.dashboard.below_reorder',        'Below reorder point'),
  ('logistic.dashboard.pending_inbound_receipt',     'Pending inbound receipts'),
  ('logistic.dashboard.open_pick_task',           'Open pick tasks'),
  ('logistic.dashboard.open_return_authorization',         'Open return authorizations'),
  ('logistic.dashboard.sections',             'Logistics sections')
) as v(slug, content)
join local_text_link l on l.slug = v.slug and l.scope = 'logistic' and l.entity_id is null
on conflict (link, locale) do nothing;

insert into local_text (link, locale, content)
select l.id, (select id from locale where code = 'fr'), v.content
from (values
  ('logistic.dashboard.open',                 'Ouverts'),
  ('logistic.dashboard.pending',              'En attente'),
  ('logistic.dashboard.low_stock',            'Stock faible'),
  ('logistic.dashboard.below_reorder',        'Sous le point de commande'),
  ('logistic.dashboard.pending_inbound_receipt',     'Réceptions en attente'),
  ('logistic.dashboard.open_pick_task',           'Tâches de prélèvement ouvertes'),
  ('logistic.dashboard.open_return_authorization',         'Autorisations de retour ouvertes'),
  ('logistic.dashboard.sections',             'Sections logistique')
) as v(slug, content)
join local_text_link l on l.slug = v.slug and l.scope = 'logistic' and l.entity_id is null
on conflict (link, locale) do nothing;
