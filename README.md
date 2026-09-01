# Network Dashboard Template

Network Dashboard is a reusable Google Sheets + Google Apps Script application for managing network, infrastructure, physical-system and operational reference data. It uses a Google Sheet as the persistent data store and a bound Apps Script web app as the user interface.

This repository is the canonical distributable template. It should not contain organization-specific names, logos, domains, administrators or credentials.

## Architecture

Network Dashboard is separated into four layers:

- Core application: authentication, RBAC, navigation, dashboard, tables, structured pages, Department Workflow, Settings, setup and validation.
- Instance configuration: organization identity, branding, regional settings, user-domain policy, users, permissions and non-secret integration configuration.
- Integrations: Aruba Central, ThreatDown and future provider modules.
- Secrets: Apps Script Script Properties only.

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

Setup creates missing sheets, creates canonical headers, freezes header rows, applies standard header formatting, protects managed header ranges, seeds `App Settings`, seeds `App Integrations`, seeds the first admin user when possible, records application/schema version metadata and reports integration Script Property status.

Setup does not store secrets in Sheets, erase operational data, duplicate settings, duplicate integration definitions or duplicate managed header protections.

## Validation

Run `validateNetworkDashboard()` from Apps Script or use Network Dashboard -> Validate Installation in the spreadsheet menu.

Validation checks required sheets, headers, header order, frozen rows, managed header protections, settings rows, integration definitions, enabled integration property completeness, application version, schema version and break-glass configuration. It returns structured results suitable for future UI display and never includes secret values.

## Header Protection

Every application-managed sheet has a managed header protection range such as:

`Network Dashboard - Managed Headers - Switches - headers`

Operational data rows remain editable. Google Sheets owners can intentionally remove protections; the goal is strong prevention of accidental header edits, deletion, renaming and schema corruption.

## Canonical Sheets

`Dashboard`

- `Section`
- `Metric`
- `Value`
- `Updated At`
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

`Security Cameras`

- Primary Sites row 1: `Site`, `IP`, `User`, `Password`, `Server Location`, `Notes`
- Secondary Sites row 13: `Site`, `IP`, `User`, `Password`, `Server Location`, `Notes`
- Legacy Systems row 19: `Site`, `IP`, `Type`, `User`, `Server Location`, `Notes`

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

`Replacement Switches`

- `Status`
- `Device Label`
- `Model`
- `Type`
- `IP Address`
- `Serial Number`
- `MAC Address`
- `Role`
- `Replacement Priority`
- `Target Replacement`
- `Campus`
- `Location`
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
- `Config JSON`
- `Notes`

## App Settings Keys

- `app.name`
- `app.version`
- `app.web_app_url`
- `schema.version`
- `organization.name`
- `organization.short_name`
- `branding.logo_url`
- `branding.primary_color`
- `branding.secondary_color`
- `branding.accent_color`
- `regional.timezone`
- `regional.date_format`
- `regional.time_format`
- `users.domain_restriction_enabled`
- `users.allowed_domain`

`app.version` and `schema.version` are system metadata. Editable settings are managed through the Settings GUI.

## Branding

Branding is configured through Settings. Supported fields are logo URL, primary color, secondary color, accent color, application name, organization name and organization short name.

The default visual design is the Network Dashboard theme. Organization identity belongs in `App Settings`, not source code.

## User Management and RBAC

Users are stored in `App Users`.

Supported behavior:

- Active/inactive users.
- `admin` and `user` roles.
- Default page permission: `view`, `edit` or `none`.
- Per-page overrides stored as JSON in `Page Permissions`.
- Server-side enforcement for viewing, editing, credentials and administrative writes.

Admins receive full administrative access. Non-admin users can only see pages for which they have `view` or `edit`.

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

Integration definitions live in the registry in `Integrations.js`. Non-secret enabled/status/configuration state lives in `App Integrations`.

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

## Troubleshooting

- Missing menu: reload the spreadsheet and verify the script is bound to the sheet.
- Access denied: add yourself to `App Users` as `admin` or configure `NETWORK_DASHBOARD_BREAK_GLASS_ADMINS`.
- Settings save fails: check the specific validation message for invalid URL, color, timezone or domain values.
- Integration cannot be enabled: add the required Script Properties first.
- Aruba sync fails: verify `ARUBA_CLIENT_ID`, `ARUBA_CLIENT_SECRET` and `ARUBA_REFRESH_TOKEN`.
- ThreatDown sync returns disabled or not configured: enable it in Settings and verify all ThreatDown Script Properties.
- Header edits fail: this is expected for managed header ranges. Edit data rows, not protected headers.
- Validation reports missing protections: run `setupNetworkDashboard()` to repair safe managed protections.

## Versioning

Application version: `1.0.0`

Schema version: `1`

These are stored in App Settings and returned by setup, validation and About.
