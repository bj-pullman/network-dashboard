# Performance Refactor

This pass keeps the existing design and API integrations. It changes navigation, table ownership, read paths and diagnostics. No Drive or JSON snapshot layer was added.

## Architecture

- Navigation resolves the actual page key to a renderer already included in `Index.html`. There is no `appGetPageClientTemplate` endpoint, template installation fallback, or page-type renderer router.
- Created `Switches.html`, `AccessPoints.html`, `Servers.html`, `Routes.html`, `SecurityCameras.html`, `BusCameras.html`, `Intercom.html` and `Backups.html`. These own page definitions, default columns, column presentation, headers and specialized behavior. Servers owns its Active/Offline/All controls; Switches and Access Points retain their orange Central actions.
- Updated the existing `InternetWan.html`, `OutagesPage.html` and `DepartmentWorkflow.html` renderers for measured table creation and compatible refreshes. Dashboard, Settings and User Management keep their existing dedicated files and participate in key-based routing. UptimeRobot remains an integration/data provider for Internet/WAN and Outages rather than a dedicated application page.
- `TablePage.html` retains common table layout, column preferences, formatting, record actions, search and exports. `StructuredPage.html` retains section/table construction and credential controls. `Scripts.html` retains navigation, RPC wrappers, cache, modal/CRUD infrastructure and table lifecycle. Page files share these helpers rather than copying Tabulator implementations.
- Removed `PREFETCH_CONCURRENCY`, `PREFETCH_PAGE_PRIORITY`, prefetch state and all schedule/start/queue/priority/drain functions. Dashboard startup sends no unrelated page-data requests.

## Read Paths And Cache

Normal inventory navigation authorizes once, checks page enablement, obtains the requested sheet, reads its data range once and transforms display values in memory. Actual headers and extra installation-specific columns remain supported. Formula display text, dates, leading zeros and physical source-row identities are preserved.

Access cache misses read App Users without calling `ensureAppUsersSheet_()`. Missing access sheets fail closed; setup and user-write workflows retain provisioning/repair. Current caller permissions are applied after shared page-cache retrieval, including structured and monitoring pages. User writes invalidate that user's access cache. Core enablement does not read settings. Optional module states and settings keep their existing 300-second metadata caches and explicit invalidation.

Within each Apps Script execution, resolved access, settings, module state and integration state are reused. A page-read context also reuses spreadsheet handles and repeated reads of the same sheet. None of that request-local row data survives into another execution. Integration status lookups restrict processing to the requested provider and use recorded sync counts; Settings still obtains current inventory counts through batched reads.

The browser retains its 60-second fresh / five-minute usable page cache and deduplicates in-flight requests. Navigation generations protect the active page; request versions protect cache writes. Mutations invalidate dependent Dashboard cache requests too. Compatible stale refreshes use `replaceData()` and preserve the Tabulator instance, sorting, filters, pagination, widths, ordering, visibility and scroll. Structure/permission changes rebuild the page. Structured searches and column menus are bound after table initialization.

Inventory row caches retain their existing lifetime and mutation/sync invalidation. WAN, outage and UptimeRobot health caches expire after 60 seconds, separately from stable metadata. Startup health sync is dispatched only after Dashboard is usable and navigation is idle; navigation cancels a scheduled request. An already-dispatched Apps Script RPC cannot be canceled, but foreground navigation never awaits it. Provider API/sync implementations are unchanged.

## Measurements

The reported deployed baseline was approximately 9 seconds for 18 camera records. No deployed post-refactor timing was available in this environment. The measurements below are local observations, not a claim that deployed latency now meets the 1-1.5 second target.

Source comparison against commit `ae2208d5af22fbc87c61f376f787e0d35a436a43`, using an in-memory Spreadsheet test double and the 18-camera seed fixture:

| Operation | Before | After |
| --- | ---: | ---: |
| Cold camera read: Spreadsheet boundary calls | 36 | 7 |
| Cold camera read: batched value reads | 6 | 2 |
| Cold camera read: formatting writes | 5 | 0 |
| Warm access, forced camera read: boundary calls | 6 | 4 |
| Warm access, forced camera read: value reads | 1 | 1 |
| Camera server-cache hit: Spreadsheet calls | 0 | 0 |
| Single-provider status: boundary calls | 49 | 4 |
| Single-provider status: value reads | 10 | 1 |
| Expanded shell source, including styles | 397,751 bytes | 402,646 bytes |
| Estimated gzip size of that source | 71,025 bytes | 72,899 bytes |

The two cold camera reads are App Users and Security Cameras. A warm camera read touches only Security Cameras. Spreadsheet method-call counts are not necessarily individual network requests: Apps Script can internally batch work. The counts still expose unnecessary service calls and writes.

Chrome with the real Tabulator 6.3.1 and Bootstrap 5.3.3, served by the local fixture, measured roughly 98-159 ms for first camera navigation and 49-85 ms for cached revisits across runs. A representative run measured 115 ms total, 11 ms RPC round trip and 15 ms table rendering; its cached revisit took 49 ms with no RPC. Local mock server execution was around 1-3 ms, which does not measure SpreadsheetApp latency. Gzip figures are estimates, not measurements of Apps Script's delivered response.

Including dedicated renderers adds about 4.9 KB raw / 1.9 KB estimated compressed to the existing shell. This is a small increase that removes the need for a separate renderer-loading architecture.

## Instrumentation

Server responses contain `performance`, and Apps Script execution logs emit `[Performance][pageKey]` with numeric durations. Inventory timings include `permission`, `enablement`, `spreadsheet`, `sheetLookup`, `dataRange`, `sheetRead`, `schema`, `transform`, `sensitive`, `cacheSerialize`, `cacheWrite`, `pageData` and `serverTotal`. Cache hits omit work that did not execute. Reports also identify access/data cache state and the number of batched reads.

Client logs include navigation start, renderer availability, RPC round trip, data received, shell rendering, Tabulator construction, table-built time, data rendering, click-to-usable time and cache state. The last 60 reports are available as `window.networkDashboardPerformance`. Server timings are included only for a real response, so cached revisits do not misleadingly reuse old server timings. Reports contain no row values or credentials.

`pageData` and `serverTotal` contain nested steps; do not add all timers together. Likewise, `tableBuilt` is elapsed time since construction started, while `tableRender` measures a render event. The difference between round trip and server execution includes platform scheduling, transport and serialization, not just network time.

## Validation

Run `npm test`, `npm run test:browser` and `npm run benchmark`. The benchmark accepts a different baseline revision as `npm run benchmark -- <revision>`. The browser test uses installed Chrome and local copies of the production frontend libraries. `npm run preview` starts a fixture server on an available loopback port. It uses fictional in-memory data and does not connect to live Sheets or provider APIs. When available, it uses the existing DevSeed row generators; otherwise it supplies an 18-row camera fixture.

Validation covers all 15 enabled page loaders, read-only access, denied/inactive users, module restrictions, shared-cache permissions, credential-reveal authorization, access-cache invalidation, camera CRUD, navigation races, no broad startup requests and all renderer includes. Browser coverage opens all 15 pages without reloading, verifies 18 camera records, exercises add/edit/delete forms, preserves table state during refresh, checks structured filtering and mobile horizontal scroll, and checks Central button styling. The final browser run had no console errors or warnings. Syntax and clasp file-list checks also pass; local test files/dependencies are excluded by `.claspignore`.

Generated reports and desktop/mobile screenshots are in `test-results/`. They are ignored by Git and clasp. Live Aruba/UptimeRobot API calls and live deployment behavior were not exercised.

## Remaining Work

The largest removed costs were permission-path formatting, speculative page requests and all-provider inventory counts during a single-provider lookup. Remaining deployed latency may come from Apps Script startup/scheduling, SpreadsheetApp, large used ranges created by Sheet defaults, or transport/serialization. Dashboard legitimately reads additional local sources for monitoring widgets; Servers reads two inventory sheets.

Next, collect deployed camera reports for a cold request, a forced read with warm access metadata, a server-cache hit, and a browser-cache revisit. Compare round trip with `serverTotal` and `sheetRead`. Optimize whichever dominates before deciding whether a read-replica layer is justified. No JSON/Drive layer should be added based only on the local mock timings.
