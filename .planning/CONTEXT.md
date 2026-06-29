# Costas — Domain Glossary

<!-- Domain glossary. Loaded by every road agent. Update via /qualia-scope. Keep entries terse (1 sentence + Avoid line). -->

## Language

### Service entry
A single record in a vehicle's history: what work was done, on what date, and where (place). Owned by the car owner's vehicle.
**Avoid:** log row, ticket, appointment.

### Job log
A work record created by a mechanic/workshop against a vehicle **plate**; it becomes a service entry in that vehicle's history.
**Avoid:** order, work order (unless the product later needs invoicing).

### Vehicle
A car identified by its **plate** (Cyprus format, e.g. `ΚΧΡ 412`) and model. Holds many service entries.
**Avoid:** car (in code/identifiers — use `vehicle`; "car" is fine in UI copy).

### Plate
The vehicle registration number — the key a mechanic uses to attach a job to a vehicle. Stored uppercased, Greek-letter plates expected.
**Avoid:** licence, registration (in code identifiers).

### Workshop
A certified garage that registers to log jobs. Has a name, city, certificate serial, and an uploaded certificate document.
**Avoid:** shop, garage, mechanic (the *workshop* is the org; the *mechanic* is the person/role).

### Owner
The car owner role — logs and views their own vehicle's service history.
**Avoid:** customer, user (disambiguate via role — see Flagged ambiguities).

### Mechanic
The workshop-side role — records jobs against plates. Authorized via `app_metadata.role`, never `user_metadata`.
**Avoid:** admin, staff.

### Service option
One of the curated job types (Full service, Service & oil, Brake replacement, Tyre change, Wheel alignment, Diagnostic check, MOT/ΜΟΤ, Body & paint, Clutch replacement, Other). Lives in the i18n dictionary, localized EL/EN.
**Avoid:** category, tag.

### Certificate
The document a workshop uploads at registration to prove certification; stored in Supabase Storage.
**Avoid:** licence, document (use `certificate`).

### Phase
A unit of work inside the milestone. 2–5 tasks. Ends in a verification gate.
**Avoid:** epic, story, ticket, sprint.

### Task
A framework-internal execution unit: one commit-sized work item with one verification contract.
**Avoid:** using "task" as a product-domain label.

## Relationships
- Project holds one Milestone (this is a demo)
- Milestone holds many Phases → Tasks → one Verification Contract each
- Owner (AuthUser) owns one Vehicle; Vehicle holds many Service entries
- Workshop (AuthUser, role=mechanic) creates Job logs against a Plate → which resolve to Service entries on that Vehicle
- Workshop holds one Certificate (in Storage)

## Flagged ambiguities

### "User" → Owner vs Mechanic
- **AuthUser** = the row in `auth.users` (Supabase).
- **Owner** = AuthUser with `app_metadata.role = "owner"` — sees only their own vehicle's history.
- **Mechanic** = AuthUser with `app_metadata.role = "mechanic"`, belongs to a Workshop — logs jobs against any plate.
- Role lives in `app_metadata` (server-controlled), never `user_metadata`.

### "Service" → Service entry vs Service option
- **Service entry** = a persisted history record (a thing that happened).
- **Service option** = a menu choice (a type of work) from the i18n dictionary.
