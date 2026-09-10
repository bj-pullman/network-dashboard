# Network Dashboard Template

Network Dashboard is a reusable Google Sheets + Google Apps Script application for managing network, infrastructure, physical-system and operational reference data. It uses a Google Sheet as the persistent data store and a bound Apps Script web app as the user interface.

This repository is the canonical distributable template. It should not contain organization-specific names, logos, domains, administrators or credentials.

## Architecture

Network Dashboard is separated into four layers:

- Core application: authentication, RBAC, navigation, dashboard, tables, structured pages, Department Workflow, Settings, setup and validation.
- Instance configuration: organization identity, branding, regional settings, user-domain policy, users, permissions and non-secret integration configuration.
- Integrations: Aruba Central, ThreatDown, UptimeRobot and future provider modules.
- Secrets: Apps Script Script Properties only.

The web app uses one lightweight shell. Page data is fetched on demand and cached in the browser so navigation can render cached pages immediately while fresh data refreshes in the background.

Page renderers are included in the shell and routed by page key. Startup does not prefetch operational datasets. Compatible background refreshes replace table rows in place. See [PERFORMANCE.md](PERFORMANCE.md) for architecture, measurements, instrumentation and local regression checks.

Dashboard metrics and summary tables are formula-driven in the `Dashboard` sheet, while setup owns the formulas that reference operational sheets. Outage and monitor widgets also use the local Outages, Internet WAN and UptimeRobot datasets.

The core application should not require source edits for a new organization.

## Installation model

The public Git repository is the canonical application source. Each organization owns a separate Google Sheet, bound Apps Script project, Script Properties, API credentials, operational data and web app deployment:

```text
Public Git repository
  -> local clone on the organization's computer
  -> clasp
  -> organization-owned Apps Script project
  -> organization-owned Google Sheet and data
```

Do not create customer-specific source copies such as `sheridan_production`, `user1_production` or `user2_production`. Installation-specific information belongs in the organization's Google resources, Script Properties, settings and ignored local `.clasp.json`, not in the canonical repository.

### Prerequisites

The installing administrator needs:

- Git.
- Node.js and npm.
- The Apps Script CLI, `clasp`.
- A Google account allowed to create/edit the Sheet, Apps Script project and web app deployment for the organization.

Install clasp globally if it is not already installed, then authenticate with the installation owner's Google account:

```powershell
npm install -g @google/clasp
clasp login
```

The application uses the Apps Script V8 runtime and requests authorization for services such as Spreadsheet, UrlFetch, Cache and Properties when needed. Optional integration credentials are stored only in Apps Script Script Properties.

### Initial installation

1. Create or choose a local installation directory. For example, in Windows PowerShell:

   ```powershell
   mkdir C:\automation\projects\network_dashboard
   cd C:\automation\projects\network_dashboard
   ```

2. Clone the public repository into that directory. Cloning is preferred to manually creating a new Git repository:

   ```powershell
   git clone <PUBLIC_REPOSITORY_URL> .
   ```

3. Create a new blank Google Sheet. It may be completely empty.

4. In the Sheet, select **Extensions -> Apps Script**. This creates the Sheet-bound Apps Script project.

5. Rename the Apps Script project to an organization-specific name, such as `Example District Network Dashboard`.

6. In Apps Script, select **Project Settings** and copy the **Script ID**. Use this field; do not try to parse an ID from the browser URL.

7. In the root of the local clone, create `.clasp.json` with the organization's Script ID:

   ```json
   {
     "scriptId": "PASTE_THE_ORGANIZATIONS_SCRIPT_ID_HERE",
     "rootDir": ".",
     "filePushOrder": [
       "Config.js",
       "App.js",
       "Integrations.js",
       "Setup.js",
       "ArubaCentral.js",
       "ThreatDown.js",
       "Code.js"
     ]
   }
   ```

   This is safer than running `clasp clone` in the populated repository, because cloning the new blank Apps Script project could replace local application files. `.clasp.json` is installation-specific and is excluded by `.gitignore`; never commit it. Run `clasp status` and verify the target before the first push.

8. Push only the Network Dashboard application source to the organization-owned Apps Script project:

   ```powershell
   clasp push
   ```

9. Return to Apps Script and verify that the Network Dashboard source files are present.

10. Return to the Google Sheet and reload it so the **Network Dashboard** menu appears. Authorize the script when prompted.

11. Select **Network Dashboard -> Setup / Initialize**. Setup creates the required sheets, schema, defaults, protections and maintenance trigger without resetting existing organization data.

12. Complete configuration: organization and branding settings, users and permissions, and any integration credentials in **Apps Script -> Project Settings -> Script Properties**.

Do not run `clasp push` until the target Script ID has been verified. In particular, do not reuse another organization's `.clasp.json`.

### Deploy as a web app

Deployment is a required installation step after initialization:

1. In Apps Script, select **Deploy -> New deployment**.
2. Select **Web app** as the deployment type.
3. For **Execute as**, choose **Me** (the owner of this Network Dashboard installation).
4. For **Who has access**, choose the appropriate organization/domain access option available in that Google Workspace environment.
5. Deploy, complete authorization if prompted, and copy the deployed URL ending in `/exec`.
6. Save that URL in Network Dashboard Settings as `app.web_app_url`.
7. Return to the Sheet and verify **Network Dashboard -> Open Dashboard** opens the deployment.

Executing as the owner lets the backend access its Sheet and configured integrations without requiring every dashboard user to have direct access to the underlying Sheet. Dashboard authorization rules still apply. Never hardcode an organization's deployment URL in source code.

### Updating an existing installation

The organization controls when it adopts a stable Network Dashboard release. In PowerShell, open its existing installation directory and run:

```powershell
git pull
clasp status
clasp push
```

`git pull` and `clasp push` replace application source only. They do not replace Sheet data, Script Properties, API credentials or setting values. After every source update, run **Network Dashboard -> Update / Repair**. It detects the installed versions, runs only required versioned migrations, reconciles missing/application-controlled structure, restores protections, clears caches and validates the installation. No other post-update action is required unless release notes explicitly say otherwise.

A future `update-network-dashboard.ps1` may combine target checks, `git pull`, tests/status checks and `clasp push`, allowing an administrator to run:

```powershell
cd C:\automation\projects\network_dashboard
.\update-network-dashboard.ps1
```

That helper is intentionally not part of this pass. It must remain a thin, fail-safe wrapper around the same single-repository, separate-organization-deployment model.

## Setup

`setupNetworkDashboard()` is the official installer. It is idempotent and safe to run again.

Setup creates missing sheets for enabled modules, creates canonical headers, applies controlled dropdown validations, configures the Dashboard formula layer, freezes header rows, applies standard header formatting, protects managed header ranges and App Settings system fields, seeds `App Settings`, seeds `App Integrations`, seeds the first admin user when possible, records application/schema version metadata and reports integration Script Property status.

Setup does not store secrets in Sheets, erase operational data, duplicate settings, duplicate integration definitions or duplicate managed header protections.

## Update / Repair

`updateNetworkDashboard()` is the normal post-`clasp push` action and is available as **Network Dashboard -> Update / Repair**. Setup and Update/Repair share the same additive reconciliation engine, but the separate production action makes operator intent and reporting clear.

Update/Repair reads the installed application/schema versions before changing metadata. Schema migrations run as an explicit sequential chain (for example, `2 -> 3`, then `3 -> 4`) and are not rerun once the installed schema is current. Missing sheets, headers, settings and integration definitions are added without replacing existing rows or organization-owned values. App Settings metadata may be refreshed from source definitions while each existing `Value` is preserved. Application/schema version settings are written only after reconciliation and protection restoration succeed.

The Dashboard formula sheet is application-controlled and may be regenerated. Populated operational sheets are not cleared or rebuilt. A migration that genuinely restructures populated data must first create and verify a timestamped sheet named like `Network Dashboard Backup - <Sheet> - <timestamp>`; backup sheets are not deleted automatically.

## Production menu

The spreadsheet menu contains Setup/Initialize, Update/Repair, Validate Installation, Open Dashboard, Protection controls and About. Development seed/reset helpers are never included in the production menu, even if a developer has locally pushed `DevSeed.js` to an isolated test project.

## Validation

Run `validateNetworkDashboard()` from Apps Script or use Network Dashboard -> Validate Installation in the spreadsheet menu.

Validation reports required sheets/schema, header protections, App Settings protections, required triggers, application/schema versions, protection state and web app deployment separately. It verifies managed protections are enforced, are not warning-only and do not allow domain editing. An active 15-minute maintenance window is reported as `Temporarily Disabled` with its restoration time instead of as schema corruption. If the window has expired, validation attempts immediate restoration and reports a failure as unhealthy. It also checks Dashboard formula rows, Dashboard summary formulas, Internet/WAN row shape, frozen rows, settings rows, integration definitions, enabled integration property completeness and break-glass configuration. A missing or malformed `app.web_app_url` is reported as `Not configured` or `Invalid URL` with deployment guidance, but does not make the underlying data/schema installation unhealthy. Validation performs structural URL checking only; it does not make a network request or expose secret values.

## Modules

Core modules are always enabled: Dashboard, Switches, Access Points, Servers, VLANs & Routing, Internet / WAN and Security Cameras. System administration pages remain enabled for Department Workflow, User Management and Settings.

Optional modules are disabled by default and can be enabled in Settings: Bus Cameras, Intercom Bell System and Backup Schedule. Enabling a module provisions its canonical sheet and protections. Disabling a module hides navigation, blocks server-side page access, removes dashboard calculations where applicable and preserves existing sheet data.

## Header Protection

Every application-managed sheet has a managed header protection range such as:

`Network Dashboard - Managed Headers - Switches - headers`

Operational data rows remain editable. Managed header protections block ordinary editors from changing/clearing headers or deleting rows/columns that intersect protected structure. Setup does not whitelist the user who ran it. Google Sheets itself always retains platform-level control for the file owner, so an owner can still alter or remove protections through Google Sheets administration; the application does not attempt to bypass that ownership rule.

On `App Settings`, the `Key`, `Type`, `Category`, `Label`, `Description`, `Updated At` and `Updated By` columns are protected below the header. `Value` remains directly editable only for definitions marked `editable: true`; system values such as `app.version`, `schema.version` and `dashboard.widgets` receive their own managed protections. Setup recognizes its protections by descriptions beginning with `Network Dashboard -`, repairs stale/missing managed ranges idempotently and leaves unrelated organization-created protections alone. The web app executes as the owner and can continue to update managed cells programmatically without granting human editors access to protected ranges.

### Temporary protection maintenance

Use **Network Dashboard -> Protection -> Disable Protection (15 Minutes)** only for intentional structural maintenance. A confirmation dialog explains the risk before any change. Confirming removes only protections whose descriptions identify them as Network Dashboard-managed, records the expiration in Script Properties and installs one one-time restoration trigger. Disabling again replaces the existing trigger and extends the window rather than accumulating triggers.

Use **Protection -> Enable Protection** to relock immediately. Setup/Initialize and Update/Repair also cancel any temporary window and finish with protections enabled. Automatic/manual restoration reconciles current schema protections idempotently and does not modify organization-created protections.

## Canonical Sheets

`Dashboard`

- `Metric Key`
- `Label`
- `Value`
- `Section`
- `Sort Order`
- `Notes`

`Switches`

- `Status`
- `Device Label`
- `Model`
- `Type`
- `IP Address`
- `Serial Number`
- `MAC Address`
- `Role`
- `Management Mode`
- `Stack Info`
- `Port Capacity (Active)`
- `Campus`
- `Location`
- `Notes`
- `Last Sync`

`Access Points`

- `Status`
- `Device Label`
- `Model`
- `IP Address`
- `Serial Number`
- `MAC Address`
- `Management Mode`
- `Active Clients`
- `Campus`
- `Virtual Controller`
- `Notes`
- `Last Sync`

`Servers`

- `Server Name`
- `IP Address`
- `Type`
- `Status`
- `Location`
- `Operating System`
- `ThreatDown Installed`
- `Wazuh Installed`
- `Notes`

`Offline Servers`

- `Server Name`
- `IP Address`
- `Type`
- `Status`
- `Location`
- `Offline Since`
- `Notes`

`IP Route Tables`

- `Campus / Location`
- `VLAN ID`
- `VLAN Name`
- `Network / CIDR`
- `Gateway`
- `DHCP Scope / Pool`
- `Purpose / Notes`

`Internet WAN`

- `Circuit ID`
- `Circuit Name`
- `Site / Location`
- `Role`
- `Provider`
- `Service Type`
- `APSCN Device Name`
- `Bandwidth`
- `Public Network / CIDR`
- `Gateway`
- `Public IPs`
- `Circuit / Account ID`
- `UptimeRobot Monitor ID`
- `Status`
- `Notes`

`UptimeRobot` (created when the UptimeRobot integration is enabled)

- `Monitor ID`
- `Monitor Name`
- `Monitor Type`
- `Target`
- `Health`
- `Provider Status`
- `Last Checked`
- `Created At`
- `Last Incident ID`
- `Current State Duration`
- `Tags`
- `Last Sync`

`Outages`

- `Outage ID`
- `Circuit ID`
- `Circuit Name`
- `Site / Location`
- `Provider`
- `UptimeRobot Monitor ID`
- `Started`
- `Restored`
- `Duration Minutes`
- `Duration`
- `Source`
- `Cause / Reason`
- `Notes`
- `Status`
- `Entered By`
- `Created At`
- `Updated At`
- `External Event ID`

`Security Cameras`

- `Location`
- `Asset / System`
- `IP Address`
- `Username`
- `Password`
- `Server Location`
- `Notes`

`Intercom Bell System`

- `Location`
- `IP Address`
- `VLAN Name`
- `VLAN ID`
- `Username`
- `Password`
- `Subnet`
- `Gateway`
- `Subnet Mask`
- `Port`
- `Usable IP Range`
- `Notes`

`Bus Cameras`

- Metadata labels rows 1-5: `System`, `Vendor`, `Portal URL`, `Support Contact`, `Notes`
- Bus Inventory row 7: `Bus Name/Number`, `DVR IP`, `Bridge IP`, `Bridge Mac`, `Bus Type`, `Notes`, `DVR Type`

`Backup Schedule`

- `Server Name`
- `Size`
- `Backup Time`
- `Backup Job Name`
- `Target Location`
- `Wasabi Job`
- `Wasabi Schedule`
- `Notes`

`Department Workflow`

- Groups row 1: `Group`, `Members`, `Purpose`
- Tiers row 7: `Tier`, `Definition`
- Ticket Steps row 14: `Ticket Step`, `Stage`, `Responsible`, `Criteria`
- Priorities row 22: `Priority Level`, `Response SLA`, `Resolution SLA`, `Definition`, `Escalation`
- Workflows row 30: `Category`, `Workflow`, `Tier`, `Primary Owner`, `Backup`, `Support`, `Notes`

`App Users`

- `Email`
- `Name`
- `Active`
- `Role`
- `Default Permission`
- `Page Permissions`
- `Notes`

`App Settings`

- `Key`
- `Value`
- `Type`
- `Category`
- `Label`
- `Description`
- `Updated At`
- `Updated By`

`App Integrations`

- `Integration ID`
- `Display Name`
- `Enabled`
- `Implementation Status`
- `Last Sync`
- `Last Status`
- `Connection Status`
- `Data Status`
- `Last Attempt`
- `Last Successful Sync`
- `Record Count`
- `Record Counts JSON`
- `Latest Error`
- `Config JSON`
- `Notes`

## Dashboard Formula Layer

The `Dashboard` sheet is the aggregation boundary for dashboard metrics. `setupNetworkDashboard()` writes metric rows and compact two-column summary formulas into that sheet, then the Dashboard web page reads the displayed values from `Dashboard` only.

Metric rows use `Section = metric` and keys such as `switches.total`, `access_points.total`, `internet_wan.total` and `workflow.groups`. Summary sections currently include switch status, access point status, switch campus distribution and Internet/WAN status.

When an optional module is enabled or disabled, setup refreshes the Dashboard formula layer so optional metrics such as Backup Schedule appear only when that module is active.

The Dashboard web page also has a widget registry in source code. Instance-wide admin customization stores compact widget visibility/order preferences in `App Settings` key `dashboard.widgets`; it does not use the Dashboard sheet as a layout database. Integration-driven widgets, such as UptimeRobot monitor KPIs and WAN monitor health, render from local managed sheets and do not call external APIs during Dashboard render.

## App Settings Keys

- `app.name`
- `app.version`
- `app.web_app_url`
- `schema.version`
- `dashboard.widgets`
- `organization.name`
- `organization.short_name`
- `branding.logo_url`
- `branding.primary_color`
- `branding.secondary_color`
- `branding.accent_color`
- `branding.header_font_color`
- `regional.timezone`
- `regional.date_format`
- `regional.time_format`
- `users.domain_restriction_enabled`
- `users.allowed_domain`

`app.version` and `schema.version` are system metadata. Editable settings are managed through the Settings GUI.

## Branding

Branding is configured through Settings. Supported fields are logo URL, primary color, secondary color, accent color, header font color, application name, organization name and organization short name. Primary controls the sidebar top section and primary actions, Secondary controls the lower sidebar/navigation surface, Accent controls active/accent marks, and Header Font Color controls the main page title/breadcrumb text.

The default visual design is the Network Dashboard theme. Organization identity belongs in `App Settings`, not source code.

## Internet / WAN

Internet / WAN is a core module for documenting site circuits and public Internet configuration. It uses the `Internet WAN` sheet and the `Internet / WAN` web page.

The page supports viewing, filtering, adding, editing and deleting circuits subject to RBAC. Server-side save validation requires circuit name, site, role, provider, service type, bandwidth and status, plus valid CIDR notation for public networks, valid gateway IPs and valid individual public IP entries when those optional fields are present.

Legacy sheets with `Download Bandwidth` and `Upload Bandwidth` are migrated by setup into one `Bandwidth` column. Matching symmetric values become a single value such as `1 Gbps`; materially asymmetric values are preserved as `1 Gbps / 100 Mbps`.

WAN `Status` is administrative/configured state and must be one of `Active`, `Standby`, `Maintenance` or `Disabled`. Runtime health is separate and, when UptimeRobot is enabled, appears as `Online`, `Down`, `Paused`, `Unknown` or `Not Monitored`. Health refreshes do not write to the `Status` column.

`APSCN Device Name` is an optional local device/reference name. `UptimeRobot Monitor ID` is optional and should contain the numeric monitor ID from the synchronized local `UptimeRobot` sheet when a circuit is monitored externally.

Circuit rows include a View Outages action when the Outages module is available. It opens the Outages page filtered to the selected circuit.

Do not store circuit portal passwords, ISP credentials or shared secrets in Internet/WAN rows. Public IP ranges, public gateways, provider names, non-secret circuit/account references and operational notes are acceptable.

## Outages

Outages is a core module for WAN outage history. Manual entries are created and closed from the Outages page. UptimeRobot records are synchronized from provider incidents for WAN circuits that have a mapped `UptimeRobot Monitor ID`.

Automated records are deduplicated by `External Event ID`, so the same provider incident updates the existing outage row. When UptimeRobot reports a restored incident, sync closes the matching outage record instead of creating a duplicate. Dashboard outage widgets read the same Outages records for active outage count, last-30-day outage count and last-30-day duration.

## User Management and RBAC

Users are stored in `App Users`.

Supported behavior:

- Active/inactive users.
- `admin` and `user` roles.
- Default page permission: `view`, `edit` or `none`.
- Per-page overrides stored as JSON in `Page Permissions`.
- Server-side enforcement for viewing, editing, credentials and administrative writes.

Admins receive full administrative access. Non-admin users can only see pages for which they have `view` or `edit`.

Sensitive password columns are virtualized in the web app. Security Cameras includes a Password column in the column selector, hidden by default; normal page payloads and exports do not include password values, and password reveal calls require server-side `edit` permission.

## User Domain Policy

Settings control user-domain restrictions:

- `users.domain_restriction_enabled`
- `users.allowed_domain`

When restriction is disabled, any valid email address can be added. When enabled, new users must belong to the configured domain.

## Break-Glass Administrators

Break-glass administrators are configured with this Script Property:

`NETWORK_DASHBOARD_BREAK_GLASS_ADMINS`

Use a comma-separated list of administrator email addresses. Break-glass administrators receive full administrative access even if App Users is misconfigured. The property name is public documentation; the configured values are installation-specific security data.

## Script Properties and Secrets

Create Script Properties in:

Apps Script -> Project Settings -> Script Properties

Property names are case-sensitive.

Never store API secrets, client secrets, refresh tokens, passwords or access tokens in Sheets, HTML, source files, README files or Git. Network Dashboard only reports whether a required Script Property is configured.

## Integrations

Integration definitions live in the registry in `Integrations.js`. Non-secret enabled/status/configuration/runtime state lives in `App Integrations`.

The integration model separates:

- Save integration configuration.
- Test connection.
- Manual sync.
- Scheduled sync support.
- Local dataset availability.
- Operational page availability.
- Dashboard widget availability.
- Module enrichment.

Adding a future integration should generally involve:

1. Registering it in `getIntegrationRegistry_()`.
2. Defining required and optional Script Properties.
3. Implementing provider-specific service functions.
4. Adding non-secret settings if needed.
5. Returning status without secret values.

## Aruba Central

Aruba Central is available and preserves the existing functional API behavior:

- Refresh-token OAuth flow.
- Switch inventory sync.
- Stack inventory support.
- Network device inventory fallback.
- Access point inventory sync with v1/v2 endpoint fallback.
- Running configuration lookup by serial number.
- Refresh token rotation back into Script Properties when Aruba returns a new refresh token.
- Daily token-only OAuth maintenance installed idempotently by `setupNetworkDashboard()`.
- Central Site mapping to the existing Campus field for switches and access points.
- Case-insensitive switch status normalization with diagnostics for unknown reported states.

Required Aruba Script Properties:

- `ARUBA_CLIENT_ID`
- `ARUBA_CLIENT_SECRET`
- `ARUBA_REFRESH_TOKEN`

Aruba Central must be configured in Script Properties and enabled in Settings -> Integrations before sync runs.

## ThreatDown

ThreatDown is registered as a partial integration. Current implemented behavior performs a token exchange, reads endpoint inventory and updates the `ThreatDown Installed` field on matching `Servers` records by hostname or IP address.

It does not yet implement full ThreatDown asset management, alerting, reporting or policy administration.

Required ThreatDown Script Properties:

- `THREATDOWN_ACCOUNT_ID`
- `THREATDOWN_CLIENT_ID`
- `THREATDOWN_CLIENT_SECRET`

ThreatDown must be configured in Script Properties and enabled in Settings -> Integrations before sync runs.

## UptimeRobot

UptimeRobot is an optional read-only integration for Internet/WAN health display. It uses the current v3 API documented by UptimeRobot at <https://uptimerobot.com/api/v3/> and the official OpenAPI specification published in <https://github.com/uptimerobot/uptimerobot-cli>.

UptimeRobot requirements:

- Create monitors in UptimeRobot first.
- For WAN circuits, a Ping monitor should target the circuit IP address or hostname that represents the observable WAN endpoint.
- Store a read-only UptimeRobot API key in Apps Script Script Properties as `UPTIMEROBOT_API_KEY`.
- Enable UptimeRobot in Settings -> Integrations.
- Use Test in Settings to verify the key. Test performs a minimal provider metadata read and does not write sheet data.
- Use Sync Now to fetch the paginated monitor collection and write the local managed `UptimeRobot` sheet.
- Map monitor IDs on `Internet WAN` rows in the `UptimeRobot Monitor ID` column. The WAN selector reads synchronized local monitor rows and stores only the monitor ID.
- Use Sync Health on the Internet / WAN page, or Sync Now on the UptimeRobot page, to refresh the local monitor dataset and synchronize mapped WAN incidents into `Outages`.

The dashboard and operational pages do not create, edit or delete UptimeRobot monitors. Dashboard, UptimeRobot, Outages and Internet/WAN renders read local sheet data only. UptimeRobot's v3 documentation lists Free-plan rate limiting at 10 requests per minute, so sync fetches provider data in paginated requests, respects rate-limit responses and does not retry tightly. Sync failures update runtime metadata but do not clear existing local monitor or outage rows.

## Department Workflow

Department Workflow is a generic product feature for documenting support groups, tiers, ticket stages, priority/SLA definitions and workflow ownership. Setup seeds generic starter rows that each organization should edit in the sheet or a future workflow editor.

## Deployment

Follow [Deploy as a web app](#deploy-as-a-web-app) during initial installation and whenever a new deployment is required. The spreadsheet menu item **Network Dashboard -> Open Dashboard** performs a fresh settings read and uses `app.web_app_url`; it does not hardcode a deployment URL. Both standard Apps Script `/exec` URLs and Workspace domain-scoped `/exec` URLs are accepted.

## Development with clasp

This repository is configured for clasp. Each installation supplies its own ignored `.clasp.json`. Review it before pushing to confirm the Script ID and target project.

Useful commands:

```bash
clasp status
clasp push
```

Do not use `clasp pull` as the installation binding step: a blank remote project can overwrite the populated clone. Do not commit secrets or `.clasp.json`. Do not push until the organization-specific target is confirmed.

## Local DevSeed

`DevSeed.js` is a local-only development helper for filling a test spreadsheet with fictional rows. It is intentionally listed in both `.gitignore` and `.claspignore`, keeping developer seed/reset code out of the public source and organization deployments. A developer who intentionally needs it in an isolated QA script can use a separate local clasp ignore configuration.

Use `seedNetworkDashboardTestData()` to seed fictional data, `clearNetworkDashboardTestData()` to remove seed-owned rows, and `resetNetworkDashboardDevEnvironment("RESET")` to reset a local development spreadsheet. DevSeed includes fictional Internet/WAN circuits using documentation-safe public IP ranges, placeholder APSCN device names, blank UptimeRobot monitor IDs and never seeds real credentials.

## Troubleshooting

- Missing menu: reload the spreadsheet and verify the script is bound to the sheet.
- Access denied: add yourself to `App Users` as `admin` or configure `NETWORK_DASHBOARD_BREAK_GLASS_ADMINS`.
- Settings save fails: check the specific validation message for invalid URL, color, timezone or domain values.
- Integration cannot be enabled: add the required Script Properties first.
- Aruba sync fails: verify `ARUBA_CLIENT_ID`, `ARUBA_CLIENT_SECRET` and `ARUBA_REFRESH_TOKEN`.
- ThreatDown sync returns disabled or not configured: enable it in Settings and verify all ThreatDown Script Properties.
- UptimeRobot health does not refresh: verify `UPTIMEROBOT_API_KEY`, enable the integration, test the connection and confirm mapped monitor IDs exist in UptimeRobot.
- Header edits fail: this is expected for managed header ranges. Edit data rows, not protected headers.
- Validation reports missing protections: use **Protection -> Enable Protection** or **Update / Repair**.

## Versioning

Application version: `1.0.0`

Schema version: `4`

These are stored in App Settings and returned by setup, validation and About.

## Schema migration history

See [REGRESSION_FIXES.md](REGRESSION_FIXES.md) for the save lifecycle fix, revised defaults, Aruba field mapping, tests, and migration details.

Schema `2 -> 3` performs the earlier additive header refinements and converts legacy Internet/WAN download/upload bandwidth fields in place, creating a verified backup before changing a populated legacy sheet. Schema `3 -> 4` converts the old multi-section Security Cameras layout only when detected, again requiring a verified timestamped backup before rebuilding that specific sheet. Once `schema.version` is `4`, those historical migrations are not rerun.

Retired columns are retained in place under `Legacy: ...` headers and hidden from managed views. VLANs & Routing still uses the `IP Route Tables` sheet. Server ThreatDown and Wazuh fields are visible only when their integration is enabled. Wazuh is a visibility-only placeholder with no API configuration.

WAN status choices are Active, Standby, and Disabled. Existing manual Maintenance values are retained in the sheet but displayed as unspecified; choose a supported status when editing those circuits. Normal UptimeRobot health and outage processing are unchanged.
