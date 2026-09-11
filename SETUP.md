# Network Dashboard Setup & Deployment Guide

This guide walks through a complete Network Dashboard installation, from installing the required local tools to deploying and validating a production web application.

Network Dashboard uses:

* **Google Sheets** for persistent organization data and configuration
* **Google Apps Script** for the application backend and web interface
* **Git** for source distribution and version control
* **Node.js / npm** for installing development dependencies
* **clasp** for deploying Network Dashboard source code into Google Apps Script

Each organization owns its own:

* Google Sheet
* Apps Script project
* operational data
* App Settings
* App Users
* Script Properties
* API credentials
* web app deployment

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

Application source updates come from Git.

Organization data remains in the organization's Google Sheet and Apps Script Script Properties.

Updating Network Dashboard should never require replacing the organization's Google Sheet.

---

# 2. Prerequisites & Dependency Installation

The computer used to install and maintain Network Dashboard needs:

* Git
* Node.js
* npm
* Google Apps Script CLI (`clasp`)
* a supported web browser
* a Google account with permission to create and manage the Google Sheet and Apps Script project

For Google Workspace organizations, the account performing the installation should normally be an administrator or another organizational account that will remain responsible for the Network Dashboard installation.

## 2.1 Verify Existing Tools

Open PowerShell on Windows or Terminal on macOS/Linux.

Run:

```powershell
git --version
node --version
npm --version
clasp --version
```

If all four commands return version information, continue to **Section 3**.

If a command is not recognized, install the corresponding dependency below.

---

## 2.2 Install Git

Git is used to download Network Dashboard and retrieve future application updates.

### Windows — winget

Open PowerShell and run:

```powershell
winget install --id Git.Git -e --source winget
```

After installation, close and reopen PowerShell.

Verify:

```powershell
git --version
```

### Windows — Manual Installation

If `winget` is unavailable, download Git for Windows from:

https://git-scm.com/download/win

Run the installer.

The default installation options are appropriate for most Network Dashboard installations.

After installation, close and reopen PowerShell.

Verify:

```powershell
git --version
```

### macOS

Git may already be available.

Check:

```bash
git --version
```

If macOS prompts to install Command Line Developer Tools, follow the prompt.

You can also install the required command-line tools manually:

```bash
xcode-select --install
```

If Homebrew is already installed, Git can alternatively be installed using:

```bash
brew install git
```

---

## 2.3 Install Node.js and npm

Node.js provides the environment used by npm and clasp.

npm is included with the normal Node.js installation.

### Windows — winget

Run:

```powershell
winget install --id OpenJS.NodeJS.LTS -e --source winget
```

After installation, close and reopen PowerShell.

Verify:

```powershell
node --version
npm --version
```

### Windows or macOS — Manual Installation

Download the current **LTS (Long Term Support)** version of Node.js from:

https://nodejs.org/

Run the installer and use the normal/default installation options.

Make sure Node.js is added to the system PATH.

After installation, open a new PowerShell or Terminal window.

Verify:

```powershell
node --version
npm --version
```

---

## 2.4 Install clasp

`clasp` is Google's command-line tool for working with Apps Script projects.

Install clasp globally using npm:

```powershell
npm install -g @google/clasp
```

Verify:

```powershell
clasp --version
```

---

## 2.5 Authenticate clasp

Run:

```powershell
clasp login
```

A browser window should open and ask you to authenticate with Google.

Sign in using the Google account that will own or administer the Network Dashboard Apps Script project.

Complete the requested Google authorization.

Once authentication succeeds, return to PowerShell.

---

## 2.6 Final Dependency Check

Before continuing, verify all required tools:

```powershell
git --version
node --version
npm --version
clasp --version
```

All four commands should return version information.

---

# 3. Create the Local Network Dashboard Folder

Choose a permanent directory for this Network Dashboard installation.

Example:

```powershell
mkdir C:\automation\projects\network_dashboard
cd C:\automation\projects\network_dashboard
```

This directory will contain the Git-managed application source used to maintain this installation.

Do not use the same local directory for multiple production organizations.

Each organization has its own Apps Script project and therefore its own `.clasp.json` and Script ID.

---

# 4. Clone Network Dashboard

From the empty Network Dashboard directory, run:

```powershell
git clone https://github.com/bj-pullman/network-dashboard.git .
```

The final period is intentional. It tells Git to clone the repository into the current directory.

Verify the repository:

```powershell
git status
git remote -v
```

You should see the repository on the `main` branch with `origin` pointing to:

```text
https://github.com/bj-pullman/network-dashboard.git
```

> **Important:** If Git reports that the destination directory is not empty, do not force the clone over an existing installation. Use an empty directory or preserve/rename the existing directory first.

---

# 5. Create the Google Sheet

Create a new blank Google Sheet using the Google account that will own or administer the Network Dashboard installation.

The Sheet does not need any manually created tabs, headers, formulas or data.

Network Dashboard will create its required structure during Setup / Initialize.

Give the Sheet an organization-specific name.

Example:

```text
Example School District Network Dashboard
```

---

# 6. Create the Apps Script Project

From the new Google Sheet, select:

```text
Extensions
→ Apps Script
```

Google will create an Apps Script project bound to the Sheet.

Rename the Apps Script project to something meaningful.

Example:

```text
Example School District Network Dashboard
```

The Apps Script project and Google Sheet belong to this specific Network Dashboard installation.

---

# 7. Get the Apps Script Script ID

In the Apps Script editor, open:

```text
Project Settings
→ IDs
→ Script ID
```

Copy the **Script ID**.

Do not use:

* the Deployment ID
* the Google Sheet ID
* an ID copied from the browser URL

The Script ID identifies the Apps Script project that clasp will update.

---

# 8. Connect clasp to the Apps Script Project

Return to the local Network Dashboard directory:

```powershell
cd C:\automation\projects\network_dashboard
```

Create a file named:

```text
.clasp.json
```

with the following contents:

```json
{
  "scriptId": "PASTE_YOUR_SCRIPT_ID_HERE",
  "rootDir": "."
}
```

Replace:

```text
PASTE_YOUR_SCRIPT_ID_HERE
```

with the Script ID copied from Apps Script.

Save the file.

`.clasp.json` is specific to this installation and must not be committed to the public Git repository.

---

## 8.1 Verify the clasp Target

Run:

```powershell
clasp status
```

Network Dashboard application files should appear under:

```text
Tracked files:
```

Files such as the following should remain local and should not be pushed into Apps Script:

```text
.git
.gitignore
.clasp.json
.claspignore
README.md
SETUP.md
FAQ.md
PERFORMANCE.md
package.json
package-lock.json
tests
```

> **Production Safety:** Always verify the Script ID and `clasp status` before pushing application source to a production Apps Script project.

---

# 9. Push Network Dashboard to Apps Script

Once the clasp target has been verified, run:

```powershell
clasp push
```

If clasp asks whether existing remote files should be overwritten, confirm only after verifying that `.clasp.json` points to the correct Apps Script project.

When the push completes, return to the Apps Script editor.

Network Dashboard application files should now be present.

Examples include:

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

The exact application file list may change between Network Dashboard releases.

---

# 10. Reload the Google Sheet

Return to the Google Sheet.

Reload the browser page.

After Apps Script initializes, a new menu should appear:

```text
Network Dashboard
```

The production menu includes:

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

If the Network Dashboard menu does not appear, reload the Sheet again and confirm that the clasp push completed successfully.

---

# 11. Run Setup / Initialize

From the Google Sheet, select:

```text
Network Dashboard
→ Setup / Initialize
```

Google may request authorization the first time Network Dashboard runs.

Complete the requested authorization using the installation owner/administrator account.

Setup / Initialize reconciles the required Network Dashboard structure.

This includes items such as:

* application-managed Sheets
* canonical headers
* App Settings
* App Integrations
* App Users
* Dashboard formulas
* data validations
* managed protections
* maintenance triggers
* initial administrator configuration
* application version metadata
* schema version metadata

Setup is designed to be idempotent.

Running Setup again should repair or reconcile missing application structure rather than erase existing organization data.

Setup / Initialize also finishes by restoring Network Dashboard-managed protections.

---

# 12. Validate the Initial Installation

Immediately after Setup / Initialize completes, run:

```text
Network Dashboard
→ Validate Installation
```

This is the first installation checkpoint.

Validation checks application-managed infrastructure such as:

* required Sheets
* required headers
* schema structure
* managed protections
* App Settings structure
* required triggers
* application version
* schema version
* Dashboard formulas
* integration definitions
* protection state
* web app deployment configuration

At this stage, the web app URL has not yet been configured.

Validation may therefore report the web app deployment or `app.web_app_url` as not configured.

That is expected.

The underlying installation should otherwise validate successfully before continuing.

> **Do not continue to production deployment if validation reports structural errors involving required Sheets, schema, headers, protections or required application components. Resolve those issues first.**

---

# 13. Configure Initial Organization Settings

Network Dashboard stores non-secret organization configuration in `App Settings`.

Initial configuration should include applicable values such as:

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

Do not store API passwords, client secrets, refresh tokens or other credentials in normal App Settings values unless Network Dashboard specifically identifies the field as appropriate for that purpose.

Secrets belong in Apps Script Script Properties.

---

# 14. Verify the Initial Administrator

Setup / Initialize attempts to create the initial administrator using the Google account performing the installation.

Network Dashboard currently supports application roles including:

```text
Admin
User
```

Non-admin users can receive page permissions such as:

```text
View
Edit
None
```

Google Sheet permissions and Network Dashboard application permissions are separate systems.

Giving someone access to the underlying Google Sheet does not automatically give that person Network Dashboard application access.

Likewise, a Network Dashboard user does not necessarily need direct Editor access to the underlying Google Sheet.

---

# 15. Deploy Network Dashboard as a Web App

In Apps Script, select:

```text
Deploy
→ New deployment
```

Choose:

```text
Web app
```

Configure the deployment.

## Execute as

Select:

```text
Me
```

This allows Network Dashboard backend operations to execute using the deployment owner's authorization.

Application users therefore do not need direct Google Sheet access merely for Network Dashboard to read and write its data.

## Who has access

Choose the Google Workspace/domain access policy appropriate for the organization.

For a Google Workspace school district or similar organization, this will commonly be the option restricting the application to users within that organization.

Network Dashboard's own application RBAC still determines whether an authenticated Google user is authorized to use the dashboard.

Click:

```text
Deploy
```

Complete any Google authorization requested during deployment.

---

# 16. Save the Web App URL

After deployment, Google provides the production web app URL.

Copy the URL ending in:

```text
/exec
```

The URL will resemble:

```text
https://script.google.com/.../s/DEPLOYMENT_ID/exec
```

Do not use an Apps Script editor URL or development/test URL.

Save the production `/exec` URL in Network Dashboard using:

```text
app.web_app_url
```

---

# 17. Validate the Production Installation

After saving `app.web_app_url`, return to the Google Sheet and run:

```text
Network Dashboard
→ Validate Installation
```

This is the second installation checkpoint.

The installation should now validate with the production web app URL configured.

Confirm that validation does not report unresolved problems with:

* required Sheets
* schema
* headers
* protections
* required triggers
* application version
* schema version
* Dashboard formulas
* App Settings
* web app configuration

This validation establishes that both the application structure and production deployment configuration are in place.

---

# 18. Open the Dashboard

From the Google Sheet, select:

```text
Network Dashboard
→ Open Dashboard
```

The production Network Dashboard web application should open using the configured `/exec` URL.

Verify:

* the application loads successfully,
* organization branding appears correctly,
* the Dashboard loads,
* navigation works,
* Settings can be opened by the administrator,
* User Management can be opened by the administrator.

---

# 19. Test Network Dashboard Access Control

Before entering significant production data, test the permission model using at least one additional Google account.

Do not rely only on the installation owner account for permission testing.

Recommended tests include:

```text
Unauthorized User
→ Access Denied

Authorized View User
→ Allowed pages visible
→ Editing unavailable

Authorized Edit User
→ Allowed pages visible
→ Editing available only where granted

Admin
→ Full Network Dashboard administrative access
```

Network Dashboard authorization is enforced server-side for protected application operations.

---

# 20. Test Google Sheet Protections

Network Dashboard protects application-managed structure such as headers and system metadata.

For a proper test, use a **second Google account** with Editor access to the underlying Google Sheet.

Verify that the second account cannot modify protected application structure such as:

```text
canonical column headers
App Settings keys
App Settings metadata
non-editable system values
other Network Dashboard-managed protected ranges
```

Normal operational data should remain editable where appropriate.

## Google Sheet Owner Exception

Google Sheets always gives the owner of a spreadsheet ultimate administrative control over the file.

The spreadsheet owner may therefore still edit or remove protected ranges.

This behavior is controlled by Google and cannot be overridden by Network Dashboard.

The owner's ability to edit a protected range does **not** indicate that Network Dashboard protection failed.

Protection should be tested using a non-owner Google Sheet Editor.

---

# 21. Temporarily Disable Protections

If intentional structural maintenance is required, use:

```text
Network Dashboard
→ Protection
→ Disable Protection (15 Minutes)
```

Network Dashboard temporarily removes only Network Dashboard-managed protections.

Unrelated Google Sheet protections are not intentionally removed.

The managed protections are automatically restored after approximately 15 minutes.

To restore them immediately:

```text
Network Dashboard
→ Protection
→ Enable Protection
```

Running either:

```text
Setup / Initialize
```

or:

```text
Update / Repair
```

also finishes with Network Dashboard-managed protections restored.

---

# 22. Configure Integrations

Network Dashboard currently includes integration work for:

```text
Aruba Central
ThreatDown
UptimeRobot
```

Integration availability and maturity may vary by provider.

Non-secret integration configuration is managed through Network Dashboard.

Secrets must be stored in:

```text
Apps Script
→ Project Settings
→ Script Properties
```

Do not place credentials in:

* Git
* source files
* HTML files
* public documentation
* normal Google Sheet cells

---

## 22.1 Aruba Central

Current Aruba Central integration uses Script Properties including:

```text
ARUBA_CLIENT_ID
ARUBA_CLIENT_SECRET
ARUBA_REFRESH_TOKEN
```

After entering the required credentials, enable/configure Aruba Central through Network Dashboard and test synchronization.

Network Dashboard can maintain a rotating Aruba Central OAuth refresh token after a valid initial refresh token has been configured.

---

## 22.2 ThreatDown

ThreatDown configuration uses Script Properties including:

```text
THREATDOWN_ACCOUNT_ID
THREATDOWN_CLIENT_ID
THREATDOWN_CLIENT_SECRET
```

Configure the integration through Network Dashboard after adding the required credentials.

ThreatDown integration functionality may be more limited than Aruba Central depending on the current Network Dashboard release.

---

## 22.3 UptimeRobot

UptimeRobot uses:

```text
UPTIMEROBOT_API_KEY
```

Network Dashboard uses synchronized UptimeRobot data for applicable infrastructure health and Internet/WAN monitoring.

Configure the integration through Network Dashboard after adding the API key.

---

# 23. Optional Break-Glass Administration

Network Dashboard supports emergency administrative access through the Script Property:

```text
NETWORK_DASHBOARD_BREAK_GLASS_ADMINS
```

The value is a comma-separated list of authorized administrator email addresses.

Example format:

```text
admin1@example.org,admin2@example.org
```

Break-glass administrators receive Network Dashboard administrative access even if the normal `App Users` configuration becomes unavailable or incorrectly configured.

This feature should be used sparingly and only for trusted administrative accounts.

Do not configure fictional or placeholder break-glass users in production.

---

# 24. Production Readiness Checklist

Before considering Network Dashboard production-ready, verify:

```text
[ ] Git is installed and working
[ ] Node.js is installed and working
[ ] npm is installed and working
[ ] clasp is installed and authenticated

[ ] Correct Git repository is cloned
[ ] Correct Apps Script Script ID is configured
[ ] clasp status points to the correct installation
[ ] clasp push completed successfully

[ ] Setup / Initialize completed successfully
[ ] Initial Validate Installation completed successfully
[ ] Required Sheets and schema were created
[ ] Managed protections were created

[ ] Organization settings are configured
[ ] Initial administrator is configured

[ ] Web app is deployed
[ ] Web app executes as the installation owner
[ ] Appropriate organization/domain access policy is configured
[ ] app.web_app_url contains the production /exec URL
[ ] Final Validate Installation completed successfully

[ ] Open Dashboard works
[ ] Dashboard loads correctly
[ ] Navigation works
[ ] Administrator access works

[ ] Unauthorized-user behavior has been tested
[ ] View permissions have been tested
[ ] Edit permissions have been tested
[ ] Admin permissions have been tested

[ ] Google Sheet protections were tested using a non-owner Editor

[ ] Required integration credentials are stored in Script Properties
[ ] Required integrations have been enabled
[ ] Required integrations have been tested successfully
```

Once these checks pass, the Network Dashboard installation is ready for normal production use.

---

# 25. Updating Network Dashboard

Network Dashboard does not automatically replace an organization's production source.

The organization controls when it adopts a new Network Dashboard release.

Open PowerShell and return to the installation directory:

```powershell
cd C:\automation\projects\network_dashboard
```

Check the current Git state:

```powershell
git status
```

The working tree should normally be clean before performing an update.

Retrieve the latest Network Dashboard source:

```powershell
git pull
```

Verify the Apps Script target:

```powershell
clasp status
```

Then deploy the updated source:

```powershell
clasp push
```

Return to the Google Sheet and run:

```text
Network Dashboard
→ Update / Repair
```

Update / Repair reconciles the existing installation with the newly deployed application version.

Depending on the release, this may include:

* new application-managed Sheets
* new headers
* new settings
* metadata changes
* schema migrations
* validation changes
* formulas
* protections
* triggers
* cache invalidation
* application version updates
* schema version updates

Existing organization data and configuration should be preserved.

---

# 26. Validate After an Update

After every production Update / Repair, run:

```text
Network Dashboard
→ Validate Installation
```

Confirm that the installation remains healthy.

Then open the dashboard and verify the affected functionality.

A normal production update workflow is therefore:

```text
git pull
    ↓
clasp status
    ↓
clasp push
    ↓
Update / Repair
    ↓
Validate Installation
    ↓
Open Dashboard / Verify
```

---

# 27. Update Safety Model

Network Dashboard intentionally separates:

```text
Application Source
        from
Organization Data
```

The responsibilities of each update step are:

```text
git pull
→ updates the local Network Dashboard application source

clasp push
→ updates the Apps Script application source

Update / Repair
→ reconciles the existing organization-owned Sheet with the current application schema
```

Updating Network Dashboard does not require replacing the organization's Google Sheet.

Update / Repair is designed to preserve:

* operational data
* App Users
* App Settings values
* App Integrations
* Script Properties
* API credentials
* organization branding
* notes
* locations
* campus information
* web app URL
* organization-specific configuration

Versioned schema migrations run only when required.

Additive and in-place migrations are preferred.

When an existing populated structure must be destructively transformed, Network Dashboard should create and verify a timestamped migration backup before performing that transformation.

---

# 28. Moving an Existing Installation to Another Computer

A Network Dashboard installation can be administered from another computer without creating a new Google Sheet or Apps Script project.

On the new computer:

1. Install Git.
2. Install Node.js/npm.
3. Install clasp.
4. Authenticate clasp.
5. Clone the Network Dashboard repository.
6. Recreate `.clasp.json` using the **existing installation's Script ID**.
7. Verify the clasp target.
8. Continue normal administration.

Example:

```powershell
mkdir C:\automation\projects\network_dashboard
cd C:\automation\projects\network_dashboard

git clone https://github.com/bj-pullman/network-dashboard.git .
```

Install clasp if necessary:

```powershell
npm install -g @google/clasp
```

Authenticate:

```powershell
clasp login
```

Create `.clasp.json` using the existing Apps Script Script ID:

```json
{
  "scriptId": "EXISTING_INSTALLATION_SCRIPT_ID",
  "rootDir": "."
}
```

Then run:

```powershell
clasp status
```

Verify the target before performing:

```powershell
clasp push
```

> **Important:** Do not create a new Google Sheet or Apps Script project when reconnecting to an existing installation.

---

# 29. Important Git and clasp Practices

Network Dashboard treats Git as the canonical application source.

For normal production administration, use:

```powershell
git pull
clasp status
clasp push
```

Do not normally use:

```powershell
clasp pull
```

inside the canonical production source directory.

`clasp pull` retrieves the source currently stored in Apps Script and can overwrite or conflict with newer Git-managed application source.

Application source changes should be made through the Git-managed development workflow rather than directly in the production Apps Script editor.

Also never commit:

```text
.clasp.json
API credentials
refresh tokens
passwords
private keys
organization-specific secrets
```

to the public Git repository.

---

# 30. Troubleshooting

## Network Dashboard Menu Does Not Appear

Reload the Google Sheet.

If the menu still does not appear:

1. confirm `clasp push` completed successfully,
2. confirm the Apps Script project is bound to the correct Sheet,
3. confirm Network Dashboard source files exist in Apps Script.

---

## `clasp status` Reports "Project settings not found"

The local installation does not have a valid `.clasp.json`.

Create `.clasp.json` using the correct Apps Script Script ID.

---

## Git Reports the Destination Directory Is Not Empty

Do not force a new clone over an existing installation.

Use an empty directory or preserve/rename the existing directory before cloning.

---

## Git Reports "Refusing to Merge Unrelated Histories"

The local repository and current Network Dashboard repository do not share the same Git history.

Do not normally solve this with:

```powershell
--allow-unrelated-histories
```

For a production installation, preserve the existing directory as a backup/reference and create a clean clone of the canonical Network Dashboard repository.

---

## Validate Installation Reports Missing Protections

Run:

```text
Network Dashboard
→ Protection
→ Enable Protection
```

Then run:

```text
Network Dashboard
→ Validate Installation
```

If the issue remains, run:

```text
Network Dashboard
→ Update / Repair
```

and validate again.

---

## Open Dashboard Reports That the URL Is Not Configured

Confirm that:

```text
app.web_app_url
```

contains the production Apps Script URL ending in:

```text
/exec
```

Then run Validate Installation again.

---

# 31. Getting Help

Additional documentation is available in the Network Dashboard repository:

* `README.md` — project overview, architecture and features
* `FAQ.md` — common questions, administration and troubleshooting
* `PERFORMANCE.md` — rendering, caching and performance architecture
* GitHub Releases — version-specific release and upgrade information

When troubleshooting, useful diagnostic information includes:

```text
Network Dashboard application version
Schema version
Validate Installation result
Apps Script execution error
Browser console error
Affected page/module
Integration involved
```

Never include the following in public support requests:

```text
passwords
API keys
client secrets
refresh tokens
private keys
other credentials
```

---

# Installation Workflow Summary

For a new installation:

```text
Install Git / Node.js / npm / clasp
              ↓
Authenticate clasp
              ↓
Clone Network Dashboard
              ↓
Create blank Google Sheet
              ↓
Create bound Apps Script project
              ↓
Get Script ID
              ↓
Create .clasp.json
              ↓
clasp status
              ↓
clasp push
              ↓
Reload Google Sheet
              ↓
Setup / Initialize
              ↓
Validate Installation
              ↓
Configure Organization / Administrator
              ↓
Deploy Web App
              ↓
Save app.web_app_url
              ↓
Validate Installation
              ↓
Open Dashboard
              ↓
Test RBAC
              ↓
Test Sheet Protections
              ↓
Configure / Test Integrations
              ↓
Production Ready
```

For future updates:

```text
git pull
    ↓
clasp status
    ↓
clasp push
    ↓
Update / Repair
    ↓
Validate Installation
    ↓
Open Dashboard / Verify
```

Network Dashboard is designed so that the application can evolve while each organization retains ownership of its data, configuration, credentials and deployment.
