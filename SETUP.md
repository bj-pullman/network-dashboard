# Network Dashboard Setup Guide

This guide walks through a complete Network Dashboard installation, from a blank Google Sheet to a working production web application.

Network Dashboard uses:

* Google Sheets for persistent installation data
* Google Apps Script for the application backend and web interface
* Git for source distribution and version control
* `clasp` for deploying Network Dashboard source code into an organization's Apps Script project

Each organization owns its own Google Sheet, Apps Script project, data, credentials, users and web app deployment.

The public Network Dashboard Git repository contains the application source only.

---

# 1. Installation Architecture

A Network Dashboard installation follows this model:

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

Application updates come from Git.

Organization data stays in the organization's Google Sheet and Script Properties.

Updating Network Dashboard should never require replacing the organization's Sheet.

---

# 2. Prerequisites

Before beginning, install:

* Git
* Node.js and npm
* Google Apps Script CLI (`clasp`)
* A supported web browser
* A Google account with permission to create a Google Sheet and Apps Script project

For Google Workspace organizations, the account performing installation should normally be an administrator or other organizational account that will remain responsible for the Network Dashboard installation.

## Install clasp

Open PowerShell:

```powershell
npm install -g @google/clasp
```

Confirm the installation:

```powershell
clasp --version
```

Then authenticate:

```powershell
clasp login
```

A browser window will open and ask you to authorize clasp.

Sign in with the Google account that will own or manage the Network Dashboard Apps Script project.

---

# 3. Create the Local Network Dashboard Folder

Choose a permanent local directory for this installation.

Example:

```powershell
mkdir C:\automation\projects\network_dashboard
cd C:\automation\projects\network_dashboard
```

This folder will become the local deployment copy of Network Dashboard for this organization.

Do not use the same local folder for multiple production organizations because each installation has its own Apps Script Script ID.

---

# 4. Clone Network Dashboard

Clone the public Network Dashboard repository into the folder:

```powershell
git clone https://github.com/bj-pullman/network-dashboard.git .
```

Confirm Git is connected correctly:

```powershell
git status
git remote -v
```

You should see the repository on the `main` branch and an `origin` pointing to:

```text
https://github.com/bj-pullman/network-dashboard.git
```

---

# 5. Create the Google Sheet

Create a new blank Google Sheet.

The Sheet does not need any tabs, headers or data.

Network Dashboard will create its required structure during initialization.

Rename the Sheet to something meaningful, for example:

```text
Example School District Network Dashboard
```

---

# 6. Create the Apps Script Project

From the Google Sheet:

```text
Extensions
→ Apps Script
```

Google will create a bound Apps Script project for the Sheet.

Rename the project to something organization-specific.

Example:

```text
Example School District Network Dashboard
```

---

# 7. Get the Apps Script Script ID

In Apps Script:

```text
Project Settings
→ IDs
→ Script ID
```

Copy the **Script ID**.

Do not use the Deployment ID and do not attempt to extract an ID from the browser URL.

The Script ID identifies the Apps Script project that clasp will update.

---

# 8. Connect clasp to the Apps Script Project

Return to the local Network Dashboard folder:

```powershell
cd C:\automation\projects\network_dashboard
```

Create:

```text
.clasp.json
```

with:

```json
{
  "scriptId": "PASTE_YOUR_SCRIPT_ID_HERE",
  "rootDir": "."
}
```

The repository's `.claspignore` controls which files are sent to Apps Script.

`.clasp.json` is installation-specific and must not be committed to the public Git repository.

Confirm the clasp target:

```powershell
clasp status
```

You should see Network Dashboard source files listed under:

```text
Tracked files:
```

Files such as the following should not be sent to Apps Script:

```text
.git
.gitignore
.clasp.json
README.md
SETUP.md
FAQ.md
package.json
package-lock.json
tests
```

Always verify the Script ID before pushing to a production Apps Script project.

---

# 9. Push Network Dashboard to Apps Script

Run:

```powershell
clasp push
```

If prompted to overwrite remote files, confirm only after verifying that you are targeting the correct Apps Script project.

Return to Apps Script.

You should now see Network Dashboard application files such as:

```text
Code.js
Setup.js
Config.js
App.js
Integrations.js
ArubaCentral.js
ThreatDown.js
UptimeRobot.js
Index.html
Dashboard.html
Settings.html
Styles.html
```

The exact file list may change as Network Dashboard evolves.

---

# 10. Reload the Google Sheet

Return to the Google Sheet and reload the browser page.

A new menu should appear:

```text
Network Dashboard
```

The production menu includes:

```text
Setup / Initialize
Update / Repair
Validate Installation
Open Dashboard

Protection
    Disable Protection (15 Minutes)
    Enable Protection

About
```

---

# 11. Run Setup / Initialize

Select:

```text
Network Dashboard
→ Setup / Initialize
```

Authorize the Apps Script project when Google prompts you.

Setup initializes the installation and creates required application structures.

It may create:

* application-managed Sheets
* canonical headers
* App Settings
* App Integrations
* App Users
* formulas
* validations
* managed protections
* required maintenance triggers
* application and schema version metadata

Setup is designed to be safe and idempotent.

Running Setup again should reconcile missing application structure rather than erase existing organization data.

---

# 12. Verify the Installation

Run:

```text
Network Dashboard
→ Validate Installation
```

Validation checks items such as:

* required sheets
* required headers
* schema structure
* managed protections
* App Settings structure
* required triggers
* application version
* schema version
* integration configuration status
* web app deployment configuration

At this stage, the web app URL may still report as not configured.

That is expected until the application has been deployed.

---

# 13. Configure Organization Settings

Network Dashboard uses `App Settings` for non-secret application configuration.

Typical settings include:

```text
Application Name
Organization Name
Organization Short Name
Logo URL
Favicon URL
Primary Color
Secondary Color
Accent Color
Timezone
Date Format
Time Format
Allowed User Domain
```

Most settings should be managed through the Network Dashboard Settings interface once the web app is available.

---

# 14. Configure the Initial Administrator

Setup attempts to create the initial administrator from the Google account performing installation.

Administrators can later manage users through:

```text
Network Dashboard
→ User Management
```

Network Dashboard supports:

```text
Admin
User
```

and page-level permissions such as:

```text
View
Edit
None
```

Google Sheet permissions and Network Dashboard application permissions are separate systems.

Someone does not automatically receive Network Dashboard access merely because they can access the underlying Sheet.

---

# 15. Deploy Network Dashboard as a Web App

In Apps Script:

```text
Deploy
→ New deployment
```

Select:

```text
Web app
```

Configure the deployment.

## Execute as

Select:

```text
Me
```

This means backend operations run using the installation owner's authorization.

Individual Network Dashboard users do not need direct access to the underlying Sheet merely for the web application to access its data.

## Who has access

Choose the Google Workspace/domain access level appropriate for the organization.

For a school district Workspace deployment, this will commonly be the option restricting access to users within the organization.

Network Dashboard's own RBAC will still determine whether an authenticated user is actually allowed to access application pages.

Click:

```text
Deploy
```

Complete authorization if Google requests it.

---

# 16. Save the Web App URL

Copy the deployed URL ending with:

```text
/exec
```

Example format:

```text
https://script.google.com/.../s/DEPLOYMENT_ID/exec
```

Save the URL in Network Dashboard using the setting:

```text
app.web_app_url
```

Then return to the Google Sheet and select:

```text
Network Dashboard
→ Open Dashboard
```

The Network Dashboard web interface should open.

---

# 17. Test Access Control

Before entering production data, test the permission model with at least one additional Google account.

Recommended tests:

```text
Unauthorized user
→ should receive Access Denied

Authorized Viewer
→ should see allowed pages but not edit them

Authorized Editor
→ should edit only pages where Edit permission is granted

Admin
→ should have full Network Dashboard administrative access
```

These permissions are enforced server-side.

---

# 18. Test Google Sheet Protections

Network Dashboard protects application-managed headers and system fields.

Test using a second Google account with Editor access to the Sheet.

The second account should not be able to alter protected Network Dashboard structure such as:

```text
column headers
App Settings keys
setting metadata
non-editable system values
```

Normal operational data fields should remain editable.

## Important Google Sheets owner behavior

Google always allows the owner of a Google Sheet to retain ultimate administrative control over that file.

The spreadsheet owner may therefore still edit or remove protected ranges.

This is a Google platform behavior and cannot be overridden by Network Dashboard.

For other editors, Network Dashboard-managed protections are enforced normally.

---

# 19. Temporarily Disable Protections

If intentional structural maintenance is required:

```text
Network Dashboard
→ Protection
→ Disable Protection (15 Minutes)
```

Network Dashboard temporarily removes only its own managed protections.

Protections are automatically restored approximately 15 minutes later.

To restore them sooner:

```text
Network Dashboard
→ Protection
→ Enable Protection
```

Setup / Initialize and Update / Repair also finish with Network Dashboard protections enabled.

---

# 20. Configure Integrations

Integration credentials are stored in:

```text
Apps Script
→ Project Settings
→ Script Properties
```

Secrets should never be stored directly in the Sheet, HTML source or Git repository.

Available integrations currently include:

```text
Aruba Central
ThreatDown
UptimeRobot
```

Each integration must be configured separately.

See `FAQ.md` and the README for integration-specific requirements.

---

# 21. Production Readiness Check

Before considering the installation production-ready, confirm:

```text
Validate Installation reports healthy
Open Dashboard works
Admin access works
Unauthorized access is denied
Viewer permissions work
Editor permissions work
Sheet protections work for non-owner editors
App Settings are configured
Web app URL is saved
Required integrations have been tested
```

---

# 22. Updating Network Dashboard

Network Dashboard does not automatically replace an organization's production code.

The organization controls when it adopts a new release.

Open PowerShell:

```powershell
cd C:\automation\projects\network_dashboard
```

Check the current status:

```powershell
git status
```

Update the local application source:

```powershell
git pull
```

Verify the clasp target:

```powershell
clasp status
```

Then push the updated application source:

```powershell
clasp push
```

Return to the Google Sheet and run:

```text
Network Dashboard
→ Update / Repair
```

Update / Repair performs the application-side reconciliation required for the new source version.

This may include:

```text
new headers
new settings
schema migrations
new validations
new formulas
new protections
new triggers
cache refreshes
version updates
```

Existing organization data and settings should be preserved.

---

# 23. Update Safety

The Network Dashboard update model intentionally separates:

```text
Source Code
from
Organization Data
```

`git pull` updates the local application source.

`clasp push` updates Apps Script source code.

`Update / Repair` reconciles the existing Google Sheet with the current application schema.

It does not replace the organization's Sheet.

Versioned migrations run only when required.

When an existing populated structure must be transformed, Network Dashboard should create and verify a timestamped backup before performing the migration.

---

# 24. Moving to Another Computer

A Network Dashboard installation can be administered from another computer.

Install Git, Node.js and clasp on the new computer.

Authenticate:

```powershell
clasp login
```

Clone Network Dashboard:

```powershell
git clone https://github.com/bj-pullman/network-dashboard.git .
```

Then recreate `.clasp.json` using the existing installation's Apps Script Script ID.

Do not create a new Sheet or Apps Script project when reconnecting to an existing installation.

Run:

```powershell
clasp status
```

before pushing anything.

---

# 25. Getting Help

See:

* `FAQ.md` for common questions and troubleshooting
* `README.md` for architecture and feature documentation
* `PERFORMANCE.md` for performance architecture and testing
* GitHub Releases for version-specific upgrade information

When troubleshooting an installation, useful information includes:

```text
Network Dashboard application version
Schema version
Validate Installation output
Apps Script execution error
Browser console error
Integration status
```
