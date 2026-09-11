# Network Dashboard Update & Maintenance Guide

This guide describes the normal production update process for an existing Network Dashboard installation. GitHub remains the canonical application source, while each organization retains its existing Google Sheet, Apps Script project, web app deployment, settings, users, data, and Script Properties.

The standard workflow advances the existing installation. It does not create a new Sheet, Apps Script project, or independent web app deployment.

---

# 1. How Network Dashboard Updates Work

A production update has four separate layers:

```text
LAYER 1 - SOURCE
git pull
Updates the local source from GitHub.

LAYER 2 - APPS SCRIPT PROJECT
clasp push
Updates files in the organization's existing Apps Script project.

LAYER 3 - PRODUCTION WEB APP
Existing deployment -> Edit -> New version -> Deploy
Updates what the existing production /exec URL serves.

LAYER 4 - ORGANIZATION DATA / CONFIGURATION
Update / Repair
Reconciles Sheets, App Settings, protections, triggers, migrations,
and installed-version metadata.
```

These operations are not interchangeable. In particular:

```text
clasp push does not update the version served by an existing /exec deployment.

Update / Repair does not deploy a new production web app version.
```

Because most Network Dashboard releases affect web application source, advancing the existing web app deployment is a standard update step.

---

# 2. Normal Production Update

## Step 1 - Open the installation directory

```powershell
cd C:\automation\projects\network_dashboard
```

Use the organization's established production installation directory.

## Step 2 - Confirm clean local source

```powershell
git status
```

Expected:

```text
nothing to commit, working tree clean
```

This confirms there are no unexpected local source modifications. If application source is modified, stop and investigate before pulling. Do not discard changes until their purpose is understood.

## Step 3 - Retrieve the latest release

```powershell
git pull
```

This retrieves the current canonical release from GitHub.

## Step 4 - Confirm the retrieved release

```powershell
git log -1 --oneline
```

Example only:

```text
c018c60 Add documentation links and fix outage tracking accuracy
```

## Step 5 - Push source to the existing Apps Script project

```powershell
clasp push
```

Wait for the command to finish successfully. This updates Apps Script project source, but it does not advance the deployed web app version.

## Step 6 - Update the existing production web app deployment

In Apps Script:

```text
Deploy
-> Manage deployments
-> Select the existing Network Dashboard Web App deployment
-> Edit
-> Version: New version
-> Deploy
```

Confirm that the existing production `/exec` URL remains unchanged. Do not create a second independent deployment and do not replace `app.web_app_url` during a routine update.

## Step 7 - Reconcile the installation

Reload the existing Google Sheet, then run:

```text
Network Dashboard
-> Update / Repair
```

Allow reconciliation to finish before users resume normal dashboard activity.

## Step 8 - Validate

```text
Network Dashboard
-> Validate Installation
```

Review Application Health separately from Action Required and Advisory configuration findings.

## Step 9 - Open production

```text
Network Dashboard
-> Open Dashboard
```

## Step 10 - Verify the release

Open **Help -> About Network Dashboard** in the production web app and confirm:

```text
Application Version: 1.0.1
Schema Version: 4
```

Then test the functionality affected by the release.

---

# 3. Update the Existing Web App Deployment

Apps Script source and Apps Script deployments are separate. `clasp push` changes the project files visible in the Apps Script editor. A versioned web app deployment continues serving its previously selected version until the existing deployment is edited and advanced.

Always update the existing production deployment:

```text
Apps Script
-> Deploy
-> Manage deployments
-> Existing Network Dashboard Web App
-> Edit
-> New version
-> Deploy
```

Do not use **New deployment** for a routine update. Advancing the existing deployment preserves its deployment identity and stable `/exec` URL.

A new web app deployment version should be assumed necessary for every normal Network Dashboard release. This avoids requiring administrators to determine whether changes to `Code.js`, `App.js`, `Config.js`, HTML, styles, client scripts, or another `doGet` dependency affect production execution.

Network Dashboard cannot reliably query Apps Script for the source version actually selected by an external production deployment. The reliable verification is to open the production `/exec` application after deployment and inspect its runtime version in **About Network Dashboard**.

---

# 4. Run Update / Repair

Update / Repair reconciles the existing organization-owned installation. Depending on the release, it may:

* add required Sheets, headers, or settings;
* reconcile App Settings metadata without overwriting organization values;
* update formulas and validations;
* reconcile managed protections;
* create required integration maintenance triggers;
* run versioned schema migrations;
* update installed application/schema metadata;
* invalidate applicable caches.

The installed `app.version` is written only at the successful end of reconciliation. If the update fails after that final write begins, Network Dashboard attempts to restore the previously installed application version rather than falsely reporting the release as installed.

Update / Repair does not update the web app deployment and does not claim that deployment occurred.

---

# 5. Validate Installation

Validation reports expected and installed versions separately:

```text
APPLICATION VERSION
Installed: 1.0.1
Expected: 1.0.1
Status: Current

SCHEMA VERSION
Installed: 4
Expected: 4
Status: Current
```

It also separates:

* **Critical** - application structure may be incompatible or unable to function correctly;
* **Action Required** - the application can operate, but an installation component needs correction;
* **Advisory** - optional configuration, hardening, cleanup, or information.

Counters show passed versus expected checks, for example:

```text
Required Sheets: 17 / 17
Header Protections: 21 / 21
App Settings Protections: 10 / 10
Required Triggers: 1 / 1
```

An integration-specific trigger that is not needed is shown as **Not applicable** and is excluded from the required-trigger denominator.

Routine discrepancies should normally be repaired with:

```text
Network Dashboard -> Update / Repair
```

Setup / Initialize remains the initial-installation and recovery entry point.

---

# 6. Verify the Production Dashboard

After validation, open the configured production dashboard from the Google Sheet menu. Verify:

* the Dashboard and navigation load;
* organization branding and settings remain intact;
* **About Network Dashboard** reports application version `1.0.1` and schema `4`;
* the features changed by the release work as expected;
* affected integrations work where applicable;
* affected RBAC behavior works with an appropriate non-admin account;
* affected protections work with a non-owner Google Sheet Editor.

If About still reports the earlier application version, the existing production web app deployment was not advanced to **New version**, or the browser is not using the expected production `/exec` URL.

---

# 7. First-Time / Target Verification

These checks are useful when configuring a workstation for the first time or troubleshooting a deployment target. They do not need to clutter every healthy routine update.

## Verify the canonical Git remote

```powershell
git remote -v
```

Expected repository:

```text
https://github.com/bj-pullman/network-dashboard.git
```

## Verify clasp installation

```powershell
clasp --version
```

Install or authenticate clasp if needed:

```powershell
npm install -g @google/clasp
clasp login
```

## Verify the Apps Script target

The installation-specific `.clasp.json` must contain the existing production Apps Script Script ID:

```json
{
  "scriptId": "EXISTING_PRODUCTION_SCRIPT_ID",
  "rootDir": "."
}
```

Use this troubleshooting command to inspect what clasp will deploy:

```powershell
clasp status
```

Never copy another organization's `.clasp.json` into production and never point a routine update at a new Apps Script project.

### About clasp "Untracked files"

In `clasp status`, **Untracked files** means files not included in the Apps Script deployment. It does not mean they are a Git problem and does not mean they should be deleted.

Expected local-only examples include:

```text
.clasp.json
.claspignore
.git
.gitignore
README.md
SETUP.md
UPDATE.md
FAQ.md
PERFORMANCE.md
package.json
package-lock.json
local tests and development files
```

Do not deploy Markdown documentation or local tooling into Apps Script merely to make this list empty.

---

# 8. Data Preservation

A routine update preserves the existing organization-owned:

* Google Sheet and operational rows;
* Apps Script project and Script ID;
* production web app deployment and `/exec` URL;
* App Users, RBAC, and organization configuration;
* editable App Settings values and branding;
* App Integrations and Script Properties;
* integration credentials and tokens;
* historical outage records and other retained data.

Git supplies application source. It is not the source of organization-specific production data.

Do not use `clasp pull` as the normal update mechanism. Do not replace organization data from Git. Do not create a new Sheet, project, or deployment during a routine update.

---

# 9. Application and Schema Versions

Network Dashboard uses semantic application versions:

* **Patch** (`1.0.0` -> `1.0.1`) for backward-compatible fixes, documentation, and reliability improvements;
* **Minor** (`1.0.1` -> `1.1.0`) for meaningful backward-compatible functionality;
* **Major** (`1.x.x` -> `2.0.0`) for breaking or major architectural changes.

The two installed version fields have different meanings:

```text
Application Version
Network Dashboard software release.

Schema Version
Organization-owned data structure revision.
```

Therefore this is valid:

```text
Application 1.0.1
Schema 4
```

A patch release does not automatically require Schema 5. The schema version changes only when the data structure requires a new migration boundary.

## Schema migrations

Update / Repair runs only migrations needed by the installed schema version. Additive and in-place reconciliation is preferred. A destructive migration requires a verified backup before transforming populated organization data.

---

# 10. Integrations and Protections

Existing integration credentials remain in the organization's Script Properties. Test an integration when the release affects it.

Aruba Central OAuth maintenance is required only when Aruba Central is enabled and fully configured. Setup / Initialize and Update / Repair reconcile the daily trigger in that state. When Aruba Central is disabled, validation reports the maintenance trigger as **Not applicable**.

Update / Repair reconciles Network Dashboard-managed protections. Validation identifies the Sheet/tab and range for missing protection findings, for example:

```text
App Settings -> Key [A2:A1000] - Protection missing.
App Settings -> app.version [B3] - Protection missing.
```

Missing protection is an installation configuration issue rather than proof that the application is unable to run. Validate protection behavior using a non-owner Google Sheet Editor because the Sheet owner retains ultimate control.

---

# 11. Troubleshooting

## Update / Repair fails

Record the error and review Apps Script execution logs. Correct the cause before retrying. Reconciliation is designed to be additive and idempotent. If a destructive migration was involved, inspect its verified backup and migration-specific recovery guidance first.

## Version reports Update required

Confirm `clasp push` completed, advance the existing web app deployment, reload the Sheet, and run **Update / Repair**. Do not run Setup / Initialize merely for a routine release mismatch.

## About shows the old application version

Open Apps Script **Deploy -> Manage deployments**, edit the existing Network Dashboard Web App, select **New version**, and deploy. Confirm you are opening the existing configured `/exec` URL.

## Production dashboard does not load

Review Validate Installation, confirm `app.web_app_url`, inspect Apps Script execution logs, and check the browser console. Useful diagnostics include the runtime application version, installed schema version, latest Git commit, affected page, and affected integration.

## Local repository is damaged

Preserve the current directory, create a clean clone, and reconnect it using the existing production Script ID. Do not create a new Google Sheet or Apps Script project.

## Security

Never place API keys, secrets, refresh tokens, private keys, or organization credentials in Git, Markdown, source files, or public issue reports.

---

# 12. Network Dashboard Update Checklist

## Before Update

```text
[ ] Correct production installation directory
[ ] git status is clean
[ ] Existing installation reviewed if necessary
```

## Source Update

```text
[ ] git pull completed
[ ] Latest commit confirmed with git log -1 --oneline
[ ] clasp push completed
```

## Web App

```text
[ ] Existing production deployment edited and advanced to New version
[ ] No second independent deployment created
[ ] Existing /exec URL preserved
[ ] app.web_app_url preserved
```

## Installation

```text
[ ] Update / Repair completed successfully
[ ] Installed application version matches expected release
[ ] Installed schema version matches expected schema
[ ] Validate Installation reviewed
```

## Production Verification

```text
[ ] Open Dashboard loads the production GUI
[ ] About reports Application Version 1.0.1
[ ] About reports Schema Version 4
[ ] Affected functionality tested
[ ] Affected integrations tested where applicable
[ ] Managed protections verified where applicable
[ ] Organization data, settings, users, and credentials remain intact
```

The normal production sequence is:

```text
git status
-> git pull
-> git log -1 --oneline
-> clasp push
-> update existing Web App deployment to New version
-> reload Google Sheet
-> Update / Repair
-> Validate Installation
-> Open Dashboard
-> verify About and affected functionality
```
