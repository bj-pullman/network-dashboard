# Network Dashboard

Network Dashboard is a self-hosted Google Sheets + Google Apps Script application for managing network infrastructure, physical systems, integrations, operational reference data and technology department workflows.

It combines the simplicity and ownership of Google Sheets with a purpose-built web interface for viewing and managing infrastructure information.

Each organization operates its own Network Dashboard installation and retains ownership of its Google Sheet, Apps Script project, operational data, credentials, users and web app deployment.

The public Git repository contains the application source. It does not contain organization-specific data or credentials.

---

## Features

Network Dashboard provides a centralized interface for documenting and managing technology infrastructure, including:

* Network switches
* Wireless access points
* Servers
* VLANs and routing
* Internet/WAN circuits
* WAN outage history
* Security camera systems
* Intercom and bell systems
* Bus camera systems
* Backup schedules
* Technology department workflows
* Application users and permissions
* Organization branding and configuration
* External monitoring and infrastructure integrations

The application includes:

* Role-based access control
* Per-page View/Edit/None permissions
* Server-side authorization
* Configurable organization branding
* Optional modules
* Integration management
* Dashboard widgets and KPIs
* Managed Google Sheet schema
* Protected application structure
* Versioned schema migrations
* Installation validation
* Production-safe Update / Repair
* Local browser caching and background refreshes
* Organization-owned deployment and data

---

## Documentation

Detailed documentation is maintained separately from this README.

### [Setup Guide](SETUP.md)

Complete start-to-finish installation instructions, including:

* prerequisites
* Git installation workflow
* Google Sheet creation
* Apps Script project creation
* clasp configuration
* initial deployment
* Setup / Initialize
* web app deployment
* production validation
* permission testing
* protection testing
* integration configuration
* updates
* moving an installation to another computer

### [Frequently Asked Questions](FAQ.md)

Administrative and troubleshooting documentation covering:

* installation questions
* Git and clasp
* Setup vs. Update / Repair
* data preservation
* Google Sheet protections
* spreadsheet owner behavior
* users and permissions
* deployment
* integrations
* security
* troubleshooting
* backups and recovery

### [Performance Architecture](PERFORMANCE.md)

Technical information covering application rendering, caching, page loading, instrumentation and performance regression testing.

---

## Architecture

Network Dashboard is separated into four primary layers.

### Core Application

The core application provides:

* authentication
* role-based access control
* navigation
* dashboards
* tables
* structured pages
* settings
* user management
* Department Workflow
* setup
* updates
* validation

Core application behavior is maintained in the public Git repository.

### Instance Configuration

Organization-specific configuration is stored within the organization's installation.

Examples include:

* organization name
* application name
* branding
* regional settings
* user-domain policy
* users
* permissions
* enabled modules
* non-secret integration configuration

The core application should not require source-code changes to deploy Network Dashboard for another organization.

### Integrations

Network Dashboard uses a common integration model for external providers.

Current integration work includes:

* Aruba Central
* ThreatDown
* UptimeRobot

Additional integrations can be added without changing the fundamental deployment model.

### Secrets

Secrets are stored only in Google Apps Script Script Properties.

Examples include:

* API client IDs
* API client secrets
* refresh tokens
* API keys

Secrets must never be committed to Git or stored in public application source.

---

## Installation Model

The GitHub repository is the canonical Network Dashboard application source.

Each organization owns a separate installation:

```text
Network Dashboard Git Repository
          |
          v
Local installation folder
          |
          v
        clasp
          |
          v
Organization-owned Apps Script project
          |
          v
Organization-owned Google Sheet
          |
          v
Network Dashboard Web App
```

Each installation has its own:

* Google Sheet
* bound Apps Script project
* Script ID
* `.clasp.json`
* Script Properties
* API credentials
* App Settings
* App Users
* operational data
* web app deployment

Organization-specific source forks such as `organization_production` are not required.

The same canonical application source is deployed into separate organization-owned Apps Script projects.

---

## Quick Start

For complete instructions, use the **[Network Dashboard Setup Guide](SETUP.md)**.

The high-level installation process is:

### 1. Clone Network Dashboard

```powershell
mkdir C:\automation\projects\network_dashboard
cd C:\automation\projects\network_dashboard

git clone https://github.com/bj-pullman/network-dashboard.git .
```

### 2. Create a blank Google Sheet

Create a new Google Sheet for the organization.

From the Sheet:

```text
Extensions
→ Apps Script
```

This creates the Sheet-bound Apps Script project.

### 3. Get the Script ID

In Apps Script:

```text
Project Settings
→ IDs
→ Script ID
```

### 4. Create `.clasp.json`

In the local Network Dashboard directory:

```json
{
  "scriptId": "YOUR_SCRIPT_ID",
  "rootDir": "."
}
```

`.clasp.json` is installation-specific and must not be committed to Git.

### 5. Verify and push

```powershell
clasp status
clasp push
```

Always verify the target Apps Script project before pushing.

### 6. Initialize Network Dashboard

Reload the Google Sheet and select:

```text
Network Dashboard
→ Setup / Initialize
```

### 7. Deploy the web app

In Apps Script:

```text
Deploy
→ New deployment
→ Web app
```

Recommended deployment configuration:

```text
Execute as:
Me
```

Choose the appropriate organization/domain access option for the Google Workspace environment.

Save the resulting `/exec` URL as:

```text
app.web_app_url
```

Then use:

```text
Network Dashboard
→ Open Dashboard
```

For permission testing, production validation and integration configuration, continue with **[SETUP.md](SETUP.md)**.

---

## Data Ownership

Network Dashboard is designed around organization-owned infrastructure.

The organization retains control of its:

* operational data
* Google Sheet
* Apps Script project
* users
* permissions
* credentials
* integrations
* deployment

Network Dashboard is not dependent on a centrally hosted Network Dashboard database.

Operational data remains in the organization's Google environment.

The public Git repository distributes application source code and does not provide the project maintainer access to an organization's Network Dashboard data through the standard installation model.

---

## Google Sheets as the Data Layer

The Google Sheet is the persistent data store for a Network Dashboard installation.

Application-managed sheets contain operational datasets such as:

* switches
* access points
* servers
* routing information
* WAN circuits
* outages
* cameras
* workflows
* users
* settings
* integrations

The web application provides the primary management interface while the underlying Sheet remains available for administration, auditing and appropriate direct data management.

Application-controlled structure is protected to reduce accidental schema changes.

---

## Web Application Architecture

Network Dashboard uses a lightweight application shell.

Page renderers are included in the shell and routed by page key.

Operational datasets are not all loaded during application startup.

Instead:

1. the application shell loads,
2. the requested page loads its required data,
3. compatible data is cached in the browser,
4. cached pages can render immediately during subsequent navigation,
5. fresh data can refresh in the background.

Compatible background refreshes replace table data in place rather than unnecessarily rebuilding the entire application.

See [PERFORMANCE.md](PERFORMANCE.md) for implementation details, measurements and regression testing.

---

## Dashboard Architecture

Dashboard metrics and summary tables use the `Dashboard` Sheet as an aggregation boundary.

Application setup manages formulas that summarize operational sheets.

The Dashboard web interface reads the resulting values rather than repeatedly scanning every operational dataset during page rendering.

Dashboard information includes infrastructure and operational metrics such as:

* switch counts and status
* access point counts and status
* campus/device distribution
* Internet/WAN status
* outage information
* integration-driven health data
* workflow metrics

Integration-driven widgets use locally synchronized data rather than making external provider API requests during normal Dashboard rendering.

Dashboard widget visibility and ordering are stored as application configuration rather than using the Dashboard Sheet as a layout database.

---

## Modules

### Core Modules

Core infrastructure functionality includes:

* Dashboard
* Switches
* Access Points
* Servers
* VLANs & Routing
* Internet / WAN
* Outages
* Security Cameras

System administration functionality includes:

* Department Workflow
* User Management
* Settings

### Optional Modules

Optional modules can be enabled or disabled through Settings.

Current optional modules include:

* Bus Cameras
* Intercom Bell System
* Backup Schedule

Enabling a module provisions its required application structure.

Disabling a module:

* removes it from application navigation,
* blocks normal server-side page access,
* removes applicable Dashboard calculations,
* preserves existing organization data.

Disabling a module does not delete its existing Sheet data.

---

## User Management and RBAC

Network Dashboard includes its own application authorization layer.

Users are maintained in `App Users`.

Supported roles currently include:

```text
admin
user
```

Non-admin users can receive a default permission of:

```text
view
edit
none
```

Per-page permission overrides can further control access.

Authorization is enforced server-side for protected application operations.

Administrators receive full Network Dashboard administrative access.

Non-admin users only see pages they are authorized to access.

---

## Network Dashboard Permissions vs. Google Permissions

Google Workspace permissions and Network Dashboard application permissions are separate security layers.

Giving someone access to the underlying Google Sheet does not automatically authorize that person to use Network Dashboard.

Likewise, a Network Dashboard user does not necessarily require direct Editor access to the underlying Sheet.

When the web application is deployed using:

```text
Execute as: Me
```

backend operations use the deployment owner's authorization while Network Dashboard independently evaluates the authenticated user's application permissions.

This allows organizations to expose the application to authorized users without exposing the underlying Sheet to every dashboard user.

---

## Google Sheet Protection

Network Dashboard protects application-managed structure such as:

* canonical headers
* App Settings metadata
* system-controlled settings
* other managed structural ranges

Protections are automatically reconciled during:

```text
Setup / Initialize
Update / Repair
Protection → Enable Protection
```

Normal operational data remains editable where appropriate.

### Spreadsheet Owner Exception

Google Sheets always grants the spreadsheet owner ultimate administrative authority over the file.

As a result, the Sheet owner can edit or remove protected ranges even while Network Dashboard protections are enabled.

This behavior is controlled by Google Sheets and cannot be overridden by Network Dashboard.

For normal Sheet editors, Network Dashboard-managed protections are enforced.

Network Dashboard does not intentionally whitelist the administrator who runs Setup.

If the installer is also the Sheet owner, that user's ability to modify protected ranges comes from Google's ownership model.

### Structural Maintenance

For intentional maintenance, use:

```text
Network Dashboard
→ Protection
→ Disable Protection (15 Minutes)
```

Network Dashboard temporarily removes only its own managed protections.

Protections are automatically restored after the maintenance window or can be restored immediately using:

```text
Network Dashboard
→ Protection
→ Enable Protection
```

For additional information, see [FAQ.md](FAQ.md).

---

## Setup / Initialize

`setupNetworkDashboard()` is the official application installer.

Setup is designed to be idempotent and safe to run again.

It reconciles application-managed structure including:

* required Sheets
* canonical headers
* dropdown validations
* Dashboard formulas
* frozen header rows
* header formatting
* managed protections
* App Settings
* App Integrations
* initial administrator
* required maintenance triggers
* application version
* schema version

Setup does not intentionally:

* erase operational data,
* store secrets in Sheets,
* duplicate settings,
* duplicate integration definitions,
* duplicate managed protections.

See [SETUP.md](SETUP.md) for the complete installation workflow.

---

## Update / Repair

Network Dashboard separates application source updates from organization data.

The standard update process is:

```powershell
cd C:\automation\projects\network_dashboard

git pull
clasp status
clasp push
```

Then, from the Google Sheet:

```text
Network Dashboard
→ Update / Repair
```

Update / Repair:

* detects installed application and schema versions,
* runs only required versioned migrations,
* creates missing application-managed structure,
* reconciles application metadata,
* preserves organization-owned setting values,
* repairs validations,
* repairs required triggers,
* restores managed protections,
* refreshes application-controlled formulas,
* clears relevant caches,
* updates version metadata after successful reconciliation,
* validates the installation.

`git pull` and `clasp push` update application source.

They do not replace the organization's Google Sheet, Script Properties, API credentials or operational data.

For the complete update procedure and safety model, see [SETUP.md](SETUP.md).

---

## Schema Migrations and Backups

Network Dashboard uses explicit schema versions.

A migration chain may look like:

```text
2 → 3
3 → 4
```

Migrations run only when the installed schema requires them.

Additive and in-place migrations are preferred.

If an existing populated application structure genuinely needs to be rebuilt, the migration must create and verify a timestamped backup before performing the destructive transformation.

Migration backup sheets use names similar to:

```text
Network Dashboard Backup - <Sheet> - <timestamp>
```

Migration backups are not automatically deleted.

Network Dashboard migration backups are not a replacement for an organization's normal Google Workspace backup and retention strategy.

---

## Validation

Use:

```text
Network Dashboard
→ Validate Installation
```

or run:

```javascript
validateNetworkDashboard()
```

Validation checks the health of application-managed infrastructure, including:

* required sheets
* schema
* headers
* managed protections
* App Settings protections
* required triggers
* application version
* schema version
* Dashboard formulas
* integration definitions
* enabled integration configuration
* protection maintenance state
* break-glass configuration
* web app URL configuration

A missing web app deployment URL can be reported separately from underlying schema health.

Validation does not expose secret Script Property values.

---

## Application Settings

Non-secret instance configuration is stored in `App Settings`.

Settings include areas such as:

* application identity
* organization identity
* branding
* regional formatting
* web app deployment
* user-domain restrictions
* Dashboard configuration

System-controlled settings include application and schema version metadata.

Editable settings should normally be managed through the Network Dashboard Settings interface.

Application definitions may update setting metadata during Update / Repair while preserving existing organization-owned values.

---

## Branding

Network Dashboard supports organization-specific branding without source-code changes.

Configurable branding includes:

* application name
* organization name
* organization short name
* logo URL
* favicon URL
* primary color
* secondary color
* accent color
* header font color

Branding belongs in application configuration rather than the canonical Git source.

---

## Integrations

Network Dashboard separates integration configuration, secrets, synchronization and local operational datasets.

Integration definitions are registered in the application source.

Non-secret configuration and runtime status are managed through Network Dashboard.

Secrets are stored in Apps Script Script Properties.

### Aruba Central

Current Aruba Central functionality includes:

* OAuth refresh-token authentication
* refresh-token rotation
* scheduled token maintenance
* switch inventory synchronization
* stack support
* network device inventory fallback
* access point synchronization
* API endpoint fallback where required
* running configuration lookup
* Central Site mapping
* switch status normalization

Required Script Properties:

```text
ARUBA_CLIENT_ID
ARUBA_CLIENT_SECRET
ARUBA_REFRESH_TOKEN
```

Aruba Central must also be enabled through Network Dashboard's integration settings.

### ThreatDown

ThreatDown is currently a partial integration.

Implemented functionality includes:

* token exchange
* endpoint inventory retrieval
* matching endpoints against Server records
* updating ThreatDown installation state

Required Script Properties:

```text
THREATDOWN_ACCOUNT_ID
THREATDOWN_CLIENT_ID
THREATDOWN_CLIENT_SECRET
```

Full ThreatDown asset management, alerting, reporting and policy administration are not currently implemented.

### UptimeRobot

UptimeRobot provides external health information for monitored infrastructure, particularly Internet/WAN circuits.

Network Dashboard:

* reads provider monitor information,
* stores synchronized monitor information locally,
* associates monitors with WAN circuits,
* synchronizes applicable incidents into Outages,
* exposes monitor health in operational pages and Dashboard widgets.

Required Script Property:

```text
UPTIMEROBOT_API_KEY
```

Network Dashboard does not create, edit or delete UptimeRobot monitors.

Provider data is synchronized into the organization-owned Sheet so normal page rendering does not depend on live external API calls.

For integration configuration and troubleshooting, see [FAQ.md](FAQ.md).

---

## Internet / WAN and Outages

Internet / WAN documents organization Internet circuits and related public network information.

Circuit information can include:

* site
* provider
* circuit role
* service type
* bandwidth
* public network
* gateway
* public IPs
* circuit/account reference
* external monitor mapping
* administrative status
* notes

Administrative circuit status and runtime health are intentionally separate.

Runtime health can be enriched through UptimeRobot when configured.

Outages provides WAN outage history.

Outages may be:

* manually entered,
* manually closed,
* synchronized from mapped UptimeRobot incidents.

External incidents are deduplicated so the same provider incident updates an existing outage record rather than creating unnecessary duplicates.

---

## Department Workflow

Department Workflow provides a generic structure for documenting technology support operations.

It can represent:

* support groups
* support tiers
* ticket stages
* priorities
* response SLAs
* resolution SLAs
* escalation expectations
* workflow ownership
* backup responsibility
* support responsibility

Organizations can adapt these definitions to their own technology department processes.

---

## Sensitive Data

Network Dashboard may contain infrastructure information that should be treated as sensitive operational data.

API secrets, refresh tokens and similar credentials must be stored in Script Properties rather than normal Sheet cells.

Credential fields that are intentionally supported by operational modules are handled separately from normal page data where possible.

For example, sensitive password columns can remain hidden from normal tables and require appropriate server-side permissions for reveal operations.

Administrators should apply their organization's normal access-control, retention and security policies to the Network Dashboard Google Sheet and Apps Script project.

---

## Break-Glass Administration

Emergency administrators can be configured using the Script Property:

```text
NETWORK_DASHBOARD_BREAK_GLASS_ADMINS
```

The value is a comma-separated list of administrator email addresses.

Break-glass administrators receive administrative access even if the normal `App Users` configuration is unavailable or incorrectly configured.

Break-glass access should be limited to appropriate trusted administrators.

The property name is public application documentation.

The configured email addresses are installation-specific security configuration.

---

## Development with clasp

Git is the canonical source for Network Dashboard application code.

Useful commands include:

```powershell
git status
git pull
clasp status
clasp push
```

Do not use `clasp pull` as the normal installation or update workflow.

Changes made directly in the Apps Script editor can be overwritten by a future:

```powershell
clasp push
```

Application development should therefore occur in the Git-managed source.

Each installation supplies its own ignored `.clasp.json`.

Always verify the target Script ID before pushing.

Never commit:

* `.clasp.json`
* credentials
* API secrets
* refresh tokens
* organization-specific sensitive data

---

## Development Seed Data

Development/test seed tooling is intentionally separated from production application behavior.

Development seed/reset actions are not included in the production Network Dashboard menu.

Production deployments should never require fictional seed data or development reset functions.

Any local development helpers should remain excluded from normal public/production clasp deployment unless intentionally used in an isolated development Apps Script project.

---

## Production Menu

The Google Sheet production menu provides:

```text
Network Dashboard
├── Setup / Initialize
├── Update / Repair
├── Validate Installation
├── Open Dashboard
├── Protection
│   ├── Disable Protection (15 Minutes)
│   └── Enable Protection
└── About
```

Development seed/reset operations are not part of the production menu.

---

## Troubleshooting

Common installation and administration issues are documented in **[FAQ.md](FAQ.md)**.

Examples include:

* missing Network Dashboard menu
* missing `.clasp.json`
* incorrect clasp target
* non-empty Git clone directory
* unrelated Git histories
* stale application settings
* missing protections
* access denied
* web app deployment issues
* Aruba Central OAuth problems
* integration configuration
* update failures

When requesting assistance, useful diagnostic information includes:

```text
Application version
Schema version
Validate Installation result
Apps Script execution error
Browser console error
Affected page/module
Integration involved
```

Never include passwords, client secrets, API keys, refresh tokens or other credentials in public support requests.

---

## Versioning

Network Dashboard tracks application and schema versions independently.

Current application version:

```text
1.0.0
```

Current schema version:

```text
4
```

These values are stored in App Settings and reported through Setup, Update / Repair, Validation and About.

Schema versions control data-structure migrations.

Application versions identify the installed Network Dashboard software release.

---

## Repository Structure

Important project documentation includes:

```text
README.md
    Project overview and architecture

SETUP.md
    Complete installation and update guide

FAQ.md
    Administration, security and troubleshooting

PERFORMANCE.md
    Rendering, caching and performance architecture
```

The Git repository is the canonical source for Network Dashboard application code.

Organization-specific configuration belongs in the organization's Network Dashboard installation rather than the public repository.

---

## Recommended Next Steps

### Installing Network Dashboard

Start with:

**[Network Dashboard Setup Guide →](SETUP.md)**

### Already Running Network Dashboard

For administration, security, updates or troubleshooting:

**[Network Dashboard FAQ →](FAQ.md)**

### Developing Network Dashboard

Review:

**[Performance Architecture →](PERFORMANCE.md)**

and the application source before making architectural changes.

---

Network Dashboard is designed around a simple principle:

**The application can evolve while each organization retains ownership of its data, configuration, credentials and deployment.**
