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

Dashboard metrics and summary tables are formula-driven in the `Dashboard` sheet. The Dashboard web page reads only that sheet, while setup owns the formulas that reference operational sheets.

The core application should not require source edits for a new organization.

## Requirements

- A Google Sheet with this bound Apps Script project.
- Apps Script V8 runtime.
- Authorization for Spreadsheet, UrlFetch, Cache and Properties services when prompted.
- Optional provider credentials stored in Apps Script Script Properties.

## Installation

1. Copy or create the template Google Sheet and bound Apps Script project.
2. Open the spreadsheet.
3. Authorize the script when prompted.
4. Run `setupNetworkDashboard()` from Apps Script or use the custom spreadsheet menu: Network Dashboard -> Setup / Initialize.
5. Configure the installation in the web app Settings page.
6. Add users and permissions in User Management.
7. Add integration credentials in Apps Script -> Project Settings -> Script Properties.
8. Deploy the Apps Script web app.
9. Save the deployed URL in Settings as `app.web_app_url`.

Do not run `clasp push` to a production script until you have reviewed the changes and target script ID.

## Setup

`setupNetworkDashboard()` is the official installer. It is idempotent and safe to run again.

Setup creates missing sheets for enabled modules, creates canonical headers, applies controlled dropdown validations, configures the Dashboard formula layer, freezes header rows, applies standard header formatting, protects managed header ranges, seeds `App Settings`, seeds `App Integrations`, seeds the first admin user when possible, records application/schema version metadata and reports integration Script Property status.

Setup does not store secrets in Sheets, erase operational data, duplicate settings, duplicate integration definitions or duplicate managed header protections.

## Validation

Run `validateNetworkDashboard()` from Apps Script or use Network Dashboard -> Validate Installation in the spreadsheet menu.

Validation checks enabled-module sheets, headers, header order, Dashboard formula rows, Dashboard summary formulas, Internet/WAN row shape, frozen rows, managed header protections, settings rows, integration definitions, enabled integration property completeness, application version, schema version and break-glass configuration. Disabled optional module sheets and obsolete legacy sheets are reported as unmanaged warnings without making the installation unhealthy. It returns structured results suitable for future UI display and never includes secret values.

## Modules

Core modules are always enabled: Dashboard, Switches, Access Points, Servers, IP Route Tables, Internet / WAN and Security Cameras. System administration pages remain enabled for Department Workflow, User Management and Settings.

Optional modules are disabled by default and can be enabled in Settings: Bus Cameras, Intercom Bell System and Backup Schedule. Enabling a module provisions its canonical sheet and protections. Disabling a module hides navigation, blocks server-side page access, removes dashboard calculations where applicable and preserves existing sheet data.

## Header Protection

Every application-managed sheet has a managed header protection range such as:

`Network Dashboard - Managed Headers - Switches - headers`

Operational data rows remain editable. Google Sheets owners can intentionally remove protections; the goal is strong prevention of accidental header edits, deletion, renaming and schema corruption.

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
- `Type`
- `IP Address`
- `Serial Number`
- `MAC Address`
- `Role`
- `Management Mode`
- `Stack Info`
- `Port Capacity (Active)`
- `Uptime`
- `Active Clients`
- `Campus`
- `Location`
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
- `Reason`
- `Notes`

`IP Route Tables`

- `Destination`
- `Gateway`
- `VLAN`
- `Type`
- `SubType`
- `Metric`
- `Dist`
- `Notes`

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
- `Category`
- `Type`
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
- `Notes`

`Bus Cameras`

- Metadata labels rows 1-5: `System`, `Vendor`, `Portal URL`, `Support Contact`, `Notes`
- Bus Inventory row 7: `Bus Name/Number`, `DVR IP`, `Bridge IP`, `Bridge Mac`, `Bus Type`, `Notes`

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

Deploy from Apps Script:

1. Open Apps Script.
2. Deploy -> New deployment.
3. Select Web app.
4. Choose execution/access settings appropriate for the organization.
5. Deploy and authorize.
6. Copy the deployment URL.
7. Save it in Settings as `app.web_app_url`.

The spreadsheet menu item Network Dashboard -> Open Dashboard uses `app.web_app_url`. It does not hard-code a deployment URL.

## Development with clasp

This repository is configured for clasp. Review `.clasp.json` before pushing to confirm the script ID and target project.

Useful commands:

```bash
clasp status
clasp pull
clasp push
```

Do not commit secrets. Do not push to production from this template-development repository unless that is explicitly intended.

## Local DevSeed

`DevSeed.js` is a local-only development helper for filling a test spreadsheet with fictional rows. It is intentionally listed in `.gitignore`, but it remains a normal Apps Script source file locally so it can be included in local `clasp` QA when that is intentional.

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
- Validation reports missing protections: run `setupNetworkDashboard()` to repair safe managed protections.

## Versioning

Application version: `1.0.0`

Schema version: `1`

These are stored in App Settings and returned by setup, validation and About.
