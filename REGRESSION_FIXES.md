# Network Dashboard Regression and Schema Cleanup

Date: 2026-09-04. Schema version: 2.

## 1. Settings Save Root Cause

Settings' successful RPC callback scheduled a timer that called the removed `scheduleOperationalPrefetch_()` before resetting `settingsSaveInProgress` and closing the working modal. That exception occurred outside the promise's catch handler. Integration toggles also retained this obsolete call. The old failure handler deliberately left its overlay open.

Settings and integration toggles now use an awaited lifecycle with `finally` cleanup. Settings closes its overlay on success, RPC failure, form collection failure, and rendering failure. There is no artificial completion delay or prefetch call. Success/error toasts remain.

## 2. Save Progress

Shared buttons show `Saving...` for saves, creates, and updates, with a small CSS-animated indeterminate bar. Other commands retain labels such as Syncing or Deleting and use the same bar. Settings' working window uses the same animation. Success/failure immediately restores the original button, disabled state, width, and accessibility attributes. No percentages are fabricated; no save depends on icon-font spin classes.

Failed record forms remain open for correction, without a working indicator or disabled Save button. Successful saves close their form. Full-page loading animation is unchanged.

## 3. Files Changed

Application files changed in this pass: `Settings.html`, `Scripts.html`, `Styles.html`, `TablePage.html`, `StructuredPage.html`, `Switches.html`, `AccessPoints.html`, `Routes.html`, `SecurityCameras.html`, `BusCameras.html`, `Intercom.html`, `InternetWan.html`, `App.js`, `Setup.js`, `Config.js`, `Integrations.js`, `Options.js`, `ArubaCentral.js`, and local git-ignored `DevSeed.js`.

Verification/documentation: `package.json`, `tests/server-harness.cjs`, `tests/client.test.cjs`, `tests/refinement.test.cjs`, `tests/browser.cjs`, `tests/preview.cjs`, `README.md`, and this report. Earlier performance-refactor changes remain intact. `OutagesPage.html` and `Outages.js` retain their distinct filenames.

## 4. Managed Schema

| Page | Changes |
| --- | --- |
| Access Points | Remove Type, Uptime, Port Capacity/Port Capacity (Active), Stack Info, Location, Role. Add Virtual Controller; retain Campus. |
| Servers / Offline Servers | Remove Reason from managed views. Retain integration columns in storage but condition client exposure on enablement. |
| VLANs & Routing | Campus / Location, VLAN ID, VLAN Name, Network / CIDR, Gateway, DHCP Scope / Pool, Purpose / Notes. |
| Security Cameras | Remove Type and Category; keep IP Address available in forms and the selector. |
| Bus Cameras | Add DVR Type to row-7 inventory without moving metadata or existing data. |
| Intercom & Bell | Add Subnet, Gateway, Subnet Mask, Port, Usable IP Range; retain VLAN Name and VLAN ID as optional columns. |

The internal `routes` key and `IP Route Tables` sheet name are unchanged. The module/page/navigation label is VLANs & Routing. Destination maps to Network / CIDR, VLAN to VLAN ID, Notes to Purpose / Notes. Old Type, SubType, Metric, Dist, and Distance are retired. DHCP pools, VLAN names, and campuses are not inferred from routes. DHCP Scope / Pool stays blank unless authoritative information is supplied. No L3 route ingestion was added; a future secondary routing view can remain separate from this VLAN inventory.

## 5. Default Visible Columns

| Page | Defaults, in order |
| --- | --- |
| Switches | Status, Device Label, Model, Type, IP Address, Campus |
| Access Points | Status, Device Label, IP Address, Model, MAC Address |
| Servers | Server Name, Status, IP Address, Type, Location (unchanged) |
| VLANs & Routing | Campus / Location, VLAN ID, VLAN Name, Network / CIDR, Gateway |
| Security Cameras | Location, Asset / System, Username, Password, Server Location |
| Bus Cameras | Bus Name/Number, DVR Type, DVR IP, Bridge IP, Bus Type |
| Intercom & Bell | Location, IP Address, Username, Password, Subnet, Port |

Actions remains available after these columns. Existing explicit visibility/width/order choices remain; unavailable fields are pruned. Defaults are not persisted as a stale complete layout. Standard and structured selectors include a Reset columns to defaults icon, which uses a local render with no RPC. Passwords remain masked and still require authorized reveal.

## 6. Aruba Switch Normalization

- Commander, Conductor, Master, Primary, Active, and legacy Commander / Stack normalize to Commander.
- Member, Standby, Secondary, Backup, and Slave normalize to Member.
- Unrecognized/standalone roles are blank, not invented stack roles.
- Explicit commander/conductor role takes precedence over simply having an IP when choosing the representative switch.
- Stack size uses the largest available grouped-device count, stack member count/list length, or device-reported count. Stack IDs can match differently named stack responses.
- Counts above one display `Yes: N`; standalone/count-one displays `No`. Recognized old `Yes (N Members)` strings normalize on display.
- Synced Up/Down statuses use existing validated Online/Offline values.

## 7. AP Group to Campus

The existing integration calls `/monitoring/v1/aps`, with `/monitoring/v2/aps` as its 404 fallback. Aruba documents `group_name` in AP responses. Campus now uses `group_name`, falling back to a supplied `ap_group`; absent values remain blank. It does not substitute site or derive campus from an AP name. [Aruba AP response example](https://developer.arubanetworks.com/central/docs/monitoring-customers), [AP v2 reference](https://developer.arubanetworks.com/central/reference/apiexternal_controllerget_aps_v2).

AP identity is matched by serial/MAC before a name-only legacy fallback. Different APs sharing a name are not merged. Existing operator notes survive.

## 8. Virtual Controller

AP responses can supply `swarm_name` or `controller_name`; an AP's own IP is not assumed to be its controller IP. An optional bulk `/monitoring/v1/swarms?limit=1000&offset=...&fields=ip_address` request joins `swarm_id` to the swarm's `name` and `ip_address`. The list endpoint documents pagination and IP fields; the details response example explicitly shows name/IP. [Aruba swarm list](https://developer.arubanetworks.com/central/reference/apiexternal_controllerget_swarms), [HPE Aruba swarm response example](https://www.postman.com/hpe-aruba-networking/hpe-aruba-networking-central/request/h95ccvg/swarm-details).

Formatting is `Name: <name> | IP: <address>`, or only the available part. Explicit controller IP fields can also be used when supplied. Unspecified/loopback addresses are omitted. Optional swarm errors do not stop AP inventory sync. There are no per-AP lookups or provider calls on page reads. Authentication, token rotation, and AP v1/v2 fallback remain intact.

These findings come from source inspection and official examples, not a live capture of this installation's tenant payload.

## 9. ThreatDown and Wazuh

Servers reads only local integration enablement state. Disabled integration headers and row values are removed from responses, including cached inventory. No provider count/status scan or remote request is added. Toggle writes invalidate relevant server caches; Settings clears client page caches so the next Servers visit reflects the change.

Wazuh is an enable/disable visibility placeholder with no credential requirements, connection test, sync implementation, or scheduled work.

## 10. WAN Maintenance and Details

Maintenance was a manual WAN status, not a UptimeRobot maintenance-window integration. It was removed from WAN choices, summary cards, filters, and managed dashboard metric definitions. Monitor health, Paused state, incidents, and outages are unchanged. Infrastructure/server Maintenance status is intentionally unchanged.

Existing WAN Maintenance values are retained in the spreadsheet but displayed as unspecified. Editing requires choosing a supported status instead of silently assigning Active. View Circuit now uses Circuit, Addressing, Provider, Monitoring, and Notes sections with label/value rows; all useful fields remain.

## 11. Migration and Seeds

Run `setupNetworkDashboard()` after deploying the updated sources. Setup, not page reads, performs migration and invalidates page caches.

Retired columns are renamed in place to `Legacy: <header>` and hidden from managed views. Data cells, formulas, extra columns, and credentials are not deleted or moved. Aliases rename only when their canonical target is absent; otherwise the old column remains as Legacy. Existing Port is reused, including case normalization. Bus inventory can grow beyond its former six-column boundary without affecting metadata.

Historical multi-section camera conversion requires a fresh sheet backup, not an earlier possibly outdated backup. Backup failure stops conversion before edits. Credentials remain aligned; blank section rows are not materialized as inventory.

Setup priorities now use P1/P2/P3/P4. Development values P5 Planned, Event Support, and Monitoring were replaced with supported codes. Known descriptive P1-P4 setup labels normalize to their codes. Old priority-validation overflow is cleared before applying section-bounded rules. This prevents the reported A27 failure without broadening the enum.

DevSeed includes revised AP/VLAN/camera fields, normalized switch displays, DVR Type, and separate fictional Intercom network, dotted mask, gateway, port, and usable range values. Production addressing is not inferred from existing values. DevSeed remains a local development helper.

## 12. Verification

- `npm test`: 33 passing tests.
- `npm run test:browser`: all 15 enabled pages; CRUD; requested defaults/order/selector agreement; animated save progress; Settings success/failure/retry; modal failure/retry; Wazuh toggle; local column reset; in-place filter/sort/width/mobile-scroll preservation.
- Chrome desktop/mobile camera and WAN-detail screenshots reviewed.
- Zero unexpected browser errors and zero warnings. Two deliberate RPC failures exercised error cleanup and toasts.
- Mocked full Aruba sync covers token rotation, AP v2 fallback, and swarm join. UptimeRobot retrieval and ongoing/restored outage normalization are covered.
- Tests cover denied permissions, restricted reveal, blank-password edit preservation, new structured fields, safe migrations, and seed enums.
- All JavaScript and inline script blocks parse. `git diff --check` passes.
- `clasp status` confirms OutagesPage naming and excludes tests, dependencies, packages, and documentation from application sources.
- Benchmark retains the refactor's camera boundary counts: cold 7 Spreadsheet calls / 2 reads; warm access 4 calls / 1 read; cached data 0 calls / 0 reads. No formatting writes on reads.
- Latest fixture Chrome camera timings: 66 ms initial and 37 ms cached. These are local measurements, not Apps Script latency.

## 13. Deployment and Remaining Concerns

No clasp push, live provider request, production sheet edit, or deployment was performed. Apply setup after your normal deployment and run validation. Existing clients can use the page Refresh control after setup. Review installation-specific formulas or external consumers that refer to renamed header text.

Tenant permissions and firmware determine actual controller-field availability. Live Aruba/UptimeRobot checks remain deployment smoke tests. Missing optional data, unrecognized roles, and uncounted legacy stack strings are not guessed. Old WAN Maintenance records need an explicit supported status on edit.

The preview at http://127.0.0.1:49278 uses fictional local data. Screenshots and machine-readable results are under `test-results/`.
