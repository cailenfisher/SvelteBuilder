-- Seed data for @sveltebuilder/logistic
-- Depends on: locale table seeded (hermes/base seed), local_text_link, local_text

-- ──────────────────────────────────────────────────────────────────────────────
-- Storage locations (self-referential tree: warehouse → zone → aisle → bin)
-- Inserted level by level so parent slugs are resolvable at each step.
-- ──────────────────────────────────────────────────────────────────────────────

insert into storage_location (slug, location_type, parent_storage_location_id, active, sort_order) values
  ('warehouse-main', 'warehouse', null, true, 10)
on conflict (slug) do nothing;

insert into storage_location (slug, location_type, parent_storage_location_id, active, sort_order)
select v.slug, v.location_type::storage_location_type,
       (select id from storage_location where slug = 'warehouse-main'),
       v.active, v.sort_order
from (values
  ('zone-a',         'zone', true, 10),
  ('zone-b',         'zone', true, 20),
  ('receiving-dock', 'zone', true, 100),
  ('returns-area',   'zone', true, 110)
) as v(slug, location_type, active, sort_order)
on conflict (slug) do nothing;

insert into storage_location (slug, location_type, parent_storage_location_id, active, sort_order)
select v.slug, 'aisle'::storage_location_type,
       (select id from storage_location where slug = v.parent_slug),
       v.active, v.sort_order
from (values
  ('aisle-a1', 'zone-a', true, 10),
  ('aisle-a2', 'zone-a', true, 20),
  ('aisle-b1', 'zone-b', true, 10)
) as v(slug, parent_slug, active, sort_order)
on conflict (slug) do nothing;

insert into storage_location (slug, location_type, parent_storage_location_id, active, sort_order)
select v.slug, 'bin'::storage_location_type,
       (select id from storage_location where slug = v.parent_slug),
       v.active, v.sort_order
from (values
  ('bin-a1-01', 'aisle-a1', true, 10),
  ('bin-a1-02', 'aisle-a1', true, 20),
  ('bin-a1-03', 'aisle-a1', true, 30),
  ('bin-a2-01', 'aisle-a2', true, 10),
  ('bin-a2-02', 'aisle-a2', true, 20),
  ('bin-b1-01', 'aisle-b1', true, 10),
  ('bin-b1-02', 'aisle-b1', true, 20)
) as v(slug, parent_slug, active, sort_order)
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

insert into stock_level (storage_location_id, sku, on_hand, reserved)
select sl.id, v.sku, v.on_hand, v.reserved
from (values
  ('bin-a1-01', 'SKU-ALPHA-001', 120, 0),
  ('bin-a1-01', 'SKU-BETA-002',   50, 0),
  ('bin-a1-02', 'SKU-ALPHA-001',  30, 0),
  ('bin-a1-03', 'SKU-GAMMA-003',  75, 0),
  ('bin-a2-01', 'SKU-DELTA-004',  10, 0),
  ('bin-b1-01', 'SKU-BETA-002',   45, 0)
) as v(location_slug, sku, on_hand, reserved)
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
  -- Location type labels
  ('logistic.location_type.warehouse',                  'logistic', null),
  ('logistic.location_type.zone',                       'logistic', null),
  ('logistic.location_type.aisle',                      'logistic', null),
  ('logistic.location_type.bin',                        'logistic', null),
  -- Inbound receipt status
  ('logistic.inbound_receipt.status.pending',           'logistic', null),
  ('logistic.inbound_receipt.status.partial',           'logistic', null),
  ('logistic.inbound_receipt.status.complete',          'logistic', null),
  ('logistic.inbound_receipt.status.cancelled',         'logistic', null),
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
  ('logistic.return.condition.salable',                 'logistic', null),
  ('logistic.return.condition.damaged',                 'logistic', null),
  ('logistic.return.condition.defective',               'logistic', null),
  ('logistic.return.condition.wrong_item',              'logistic', null),
  -- Return disposition
  ('logistic.return.disposition.restock',               'logistic', null),
  ('logistic.return.disposition.quarantine',            'logistic', null),
  ('logistic.return.disposition.scrap',                 'logistic', null),
  ('logistic.return.disposition.refurbish',             'logistic', null),
  -- Return authorization status
  ('logistic.return_authorization.status.pending',      'logistic', null),
  ('logistic.return_authorization.status.received',     'logistic', null),
  ('logistic.return_authorization.status.processed',    'logistic', null),
  ('logistic.return_authorization.status.cancelled',    'logistic', null),
  -- Cycle count status
  ('logistic.cycle_count.status.open',                  'logistic', null),
  ('logistic.cycle_count.status.in_progress',           'logistic', null),
  ('logistic.cycle_count.status.complete',              'logistic', null),
  ('logistic.cycle_count.status.cancelled',             'logistic', null),
  -- Adjustment reason
  ('logistic.adjustment_reason.damage',                 'logistic', null),
  ('logistic.adjustment_reason.theft',                  'logistic', null),
  ('logistic.adjustment_reason.receiving_error',        'logistic', null),
  ('logistic.adjustment_reason.cycle_count_variance',   'logistic', null),
  ('logistic.adjustment_reason.system_correction',      'logistic', null),
  ('logistic.adjustment_reason.other',                  'logistic', null),
  -- Admin navigation
  ('logistic.admin.nav.storage_location',               'logistic', null),
  ('logistic.admin.nav.supplier',                       'logistic', null),
  ('logistic.admin.nav.stock_level',                    'logistic', null),
  ('logistic.admin.nav.inbound_receipt',                'logistic', null),
  ('logistic.admin.nav.pick_task',                      'logistic', null),
  ('logistic.admin.nav.shipment',                       'logistic', null),
  ('logistic.admin.nav.return_authorization',           'logistic', null),
  ('logistic.admin.nav.cycle_count',                    'logistic', null),
  -- Field labels
  ('logistic.field.sku',                                'logistic', null),
  ('logistic.field.on_hand',                            'logistic', null),
  ('logistic.field.reserved',                           'logistic', null),
  ('logistic.field.available',                          'logistic', null),
  ('logistic.field.lead_time_day',                      'logistic', null),
  ('logistic.field.location_type',                      'logistic', null),
  ('logistic.field.carrier',                            'logistic', null),
  ('logistic.field.tracking_number',                    'logistic', null)
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
  ('logistic.location_type.warehouse',                  'logistic', 'Warehouse'),
  ('logistic.location_type.zone',                       'logistic', 'Zone'),
  ('logistic.location_type.aisle',                      'logistic', 'Aisle'),
  ('logistic.location_type.bin',                        'logistic', 'Bin'),
  ('logistic.inbound_receipt.status.pending',           'logistic', 'Pending'),
  ('logistic.inbound_receipt.status.partial',           'logistic', 'Partial'),
  ('logistic.inbound_receipt.status.complete',          'logistic', 'Complete'),
  ('logistic.inbound_receipt.status.cancelled',         'logistic', 'Cancelled'),
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
  ('logistic.return.condition.salable',                 'logistic', 'Salable'),
  ('logistic.return.condition.damaged',                 'logistic', 'Damaged'),
  ('logistic.return.condition.defective',               'logistic', 'Defective'),
  ('logistic.return.condition.wrong_item',              'logistic', 'Wrong item'),
  ('logistic.return.disposition.restock',               'logistic', 'Restock'),
  ('logistic.return.disposition.quarantine',            'logistic', 'Quarantine'),
  ('logistic.return.disposition.scrap',                 'logistic', 'Scrap'),
  ('logistic.return.disposition.refurbish',             'logistic', 'Refurbish'),
  ('logistic.return_authorization.status.pending',      'logistic', 'Pending'),
  ('logistic.return_authorization.status.received',     'logistic', 'Received'),
  ('logistic.return_authorization.status.processed',    'logistic', 'Processed'),
  ('logistic.return_authorization.status.cancelled',    'logistic', 'Cancelled'),
  ('logistic.cycle_count.status.open',                  'logistic', 'Open'),
  ('logistic.cycle_count.status.in_progress',           'logistic', 'In progress'),
  ('logistic.cycle_count.status.complete',              'logistic', 'Complete'),
  ('logistic.cycle_count.status.cancelled',             'logistic', 'Cancelled'),
  ('logistic.adjustment_reason.damage',                 'logistic', 'Damage'),
  ('logistic.adjustment_reason.theft',                  'logistic', 'Theft'),
  ('logistic.adjustment_reason.receiving_error',        'logistic', 'Receiving error'),
  ('logistic.adjustment_reason.cycle_count_variance',   'logistic', 'Cycle count variance'),
  ('logistic.adjustment_reason.system_correction',      'logistic', 'System correction'),
  ('logistic.adjustment_reason.other',                  'logistic', 'Other'),
  ('logistic.admin.nav.storage_location',               'logistic', 'Locations'),
  ('logistic.admin.nav.supplier',                       'logistic', 'Suppliers'),
  ('logistic.admin.nav.stock_level',                    'logistic', 'Stock'),
  ('logistic.admin.nav.inbound_receipt',                'logistic', 'Receiving'),
  ('logistic.admin.nav.pick_task',                      'logistic', 'Pick tasks'),
  ('logistic.admin.nav.shipment',                       'logistic', 'Shipments'),
  ('logistic.admin.nav.return_authorization',           'logistic', 'Returns'),
  ('logistic.admin.nav.cycle_count',                    'logistic', 'Cycle counts'),
  ('logistic.field.sku',                                'logistic', 'SKU'),
  ('logistic.field.on_hand',                            'logistic', 'On hand'),
  ('logistic.field.reserved',                           'logistic', 'Reserved'),
  ('logistic.field.available',                          'logistic', 'Available'),
  ('logistic.field.lead_time_day',                      'logistic', 'Lead time (days)'),
  ('logistic.field.location_type',                      'logistic', 'Location type'),
  ('logistic.field.carrier',                            'logistic', 'Carrier'),
  ('logistic.field.tracking_number',                    'logistic', 'Tracking number')
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
  ('logistic.location_type.warehouse',                  'logistic', 'Entrepôt'),
  ('logistic.location_type.zone',                       'logistic', 'Zone'),
  ('logistic.location_type.aisle',                      'logistic', 'Allée'),
  ('logistic.location_type.bin',                        'logistic', 'Casier'),
  ('logistic.inbound_receipt.status.pending',           'logistic', 'En attente'),
  ('logistic.inbound_receipt.status.partial',           'logistic', 'Partiel'),
  ('logistic.inbound_receipt.status.complete',          'logistic', 'Complet'),
  ('logistic.inbound_receipt.status.cancelled',         'logistic', 'Annulé'),
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
  ('logistic.return.condition.salable',                 'logistic', 'Vendable'),
  ('logistic.return.condition.damaged',                 'logistic', 'Endommagé'),
  ('logistic.return.condition.defective',               'logistic', 'Défectueux'),
  ('logistic.return.condition.wrong_item',              'logistic', 'Article incorrect'),
  ('logistic.return.disposition.restock',               'logistic', 'Remise en stock'),
  ('logistic.return.disposition.quarantine',            'logistic', 'Quarantaine'),
  ('logistic.return.disposition.scrap',                 'logistic', 'Rebut'),
  ('logistic.return.disposition.refurbish',             'logistic', 'Remise en état'),
  ('logistic.return_authorization.status.pending',      'logistic', 'En attente'),
  ('logistic.return_authorization.status.received',     'logistic', 'Reçu'),
  ('logistic.return_authorization.status.processed',    'logistic', 'Traité'),
  ('logistic.return_authorization.status.cancelled',    'logistic', 'Annulé'),
  ('logistic.cycle_count.status.open',                  'logistic', 'Ouvert'),
  ('logistic.cycle_count.status.in_progress',           'logistic', 'En cours'),
  ('logistic.cycle_count.status.complete',              'logistic', 'Complet'),
  ('logistic.cycle_count.status.cancelled',             'logistic', 'Annulé'),
  ('logistic.adjustment_reason.damage',                 'logistic', 'Dommage'),
  ('logistic.adjustment_reason.theft',                  'logistic', 'Vol'),
  ('logistic.adjustment_reason.receiving_error',        'logistic', 'Erreur de réception'),
  ('logistic.adjustment_reason.cycle_count_variance',   'logistic', 'Écart d''inventaire tournant'),
  ('logistic.adjustment_reason.system_correction',      'logistic', 'Correction système'),
  ('logistic.adjustment_reason.other',                  'logistic', 'Autre'),
  ('logistic.admin.nav.storage_location',               'logistic', 'Emplacements'),
  ('logistic.admin.nav.supplier',                       'logistic', 'Fournisseurs'),
  ('logistic.admin.nav.stock_level',                    'logistic', 'Stock'),
  ('logistic.admin.nav.inbound_receipt',                'logistic', 'Réceptions'),
  ('logistic.admin.nav.pick_task',                      'logistic', 'Tâches de prélèvement'),
  ('logistic.admin.nav.shipment',                       'logistic', 'Expéditions'),
  ('logistic.admin.nav.return_authorization',           'logistic', 'Retours'),
  ('logistic.admin.nav.cycle_count',                    'logistic', 'Inventaires tournants'),
  ('logistic.field.sku',                                'logistic', 'SKU'),
  ('logistic.field.on_hand',                            'logistic', 'En stock'),
  ('logistic.field.reserved',                           'logistic', 'Réservé'),
  ('logistic.field.available',                          'logistic', 'Disponible'),
  ('logistic.field.lead_time_day',                      'logistic', 'Délai de livraison (jours)'),
  ('logistic.field.location_type',                      'logistic', 'Type d''emplacement'),
  ('logistic.field.carrier',                            'logistic', 'Transporteur'),
  ('logistic.field.tracking_number',                    'logistic', 'Numéro de suivi')
) as v(slug, scope, content)
join local_text_link l on l.slug = v.slug and l.scope = v.scope and l.entity_id is null
on conflict (link, locale) do nothing;
