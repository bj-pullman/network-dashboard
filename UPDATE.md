# Network Dashboard Update & Maintenance Guide

This guide explains how to safely update an existing Network Dashboard installation to a newer application version.

This guide assumes Network Dashboard has already been installed and deployed using the process documented in `SETUP.md`.

Network Dashboard separates application source code from organization-owned data:

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
Existing organization-owned Apps Script project
          |
          v
Existing organization-owned Google Sheet
          |
          v
Network Dashboard Web App
```

Updating Network Dashboard should **not** require creating a new Google Sheet, Apps Script project, or web app installation.

Organization data remains in the existing Google Sheet and Apps Script Script Properties.

---

# 1. Update Architecture

A normal Network Dashboard update consists of three distinct operations:

```text
git pull
    |
    v
Updates the local Network Dashboard source
    |
    v
clasp push
    |
    v
Updates the existing Apps Script source
    |
    v
Update / Repair
    |
    v
Reconciles the existing Google Sheet with the new application version
```

These operations serve different purposes.

### Git

Git manages the Network Dashboard application source.

```powershell
git pull
```

retrieves the latest source from the Network Dashboard Git repository.

### clasp

clasp connects the local Network Dashboard source to the organization's existing Apps Script project.

```powershell
clasp push
```

deploys the updated source into that Apps Script project.

### Update / Repair

The Network Dashboard **Update / Repair** process reconciles the organization's existing installation with the newly deployed application version.

Depending on the release, this may include:

* adding new application-managed structure,
* adding new settings,
* adding new headers,
* updating formulas,
* updating data validations,
* updating managed protections,
* updating maintenance triggers,
* performing required schema migrations,
* refreshing application metadata,
* updating application and schema versions.

---

# 2. Before Updating

Before beginning a production update, confirm that you are working with the correct Network Dashboard installation.

Open PowerShell or Terminal and navigate to the organization's local Network Dashboard directory.

Example:

```powershell
cd C:\automation\projects\network_dashboard
```

Do not perform a production update from an unknown or temporary copy of the repository.

---

## 2.1 Check Git Status

Run:

```powershell
git status
```

The normal production installation should report a clean working tree.

For example:

```text
On branch main
Your branch is up to date with 'origin/main'.

nothing to commit, working tree clean
```

If Git reports modified or untracked application source files, stop before pulling the update and determine why those files are present.

Do not discard production changes until you understand what they are.

Installation-specific files such as `.clasp.json` are intentionally excluded from Git and should not cause the normal Git working tree to appear modified.

---

## 2.2 Confirm the Git Repository

Run:

```powershell
git remote -v
```

The `origin` repository should point to:

```text
https://github.com/bj-pullman/network-dashboard.git
```

This confirms that application updates will be retrieved from the canonical Network Dashboard repository.

---

## 2.3 Verify clasp

Confirm clasp is available:

```powershell
clasp --version
```

If the command returns a version, continue.

If clasp is not installed, install it with:

```powershell
npm install -g @google/clasp
```

If clasp requires Google authentication, run:

```powershell
clasp login
```

Authenticate using an account authorized to manage the organization's existing Apps Script project.

---

# 3. Confirm the Existing Apps Script Target

Before deploying any update, verify that clasp points to the correct production Apps Script project.

Run:

```powershell
clasp status
```

Review the tracked files and confirm that this is the expected Network Dashboard installation.

The local `.clasp.json` contains the Apps Script Script ID used by clasp.

If necessary, review it:

```json
{
  "scriptId": "YOUR_EXISTING_SCRIPT_ID",
  "rootDir": "."
}
```

The Script ID should match the organization's existing production Network Dashboard Apps Script project.

> **Production Safety:** Never run `clasp push` until you are confident `.clasp.json` points to the correct Apps Script project.

Do not replace the Script ID with a new Apps Script project during a normal update.

---

# 4. Check the Current Network Dashboard Installation

Before retrieving the update, open the existing Network Dashboard Google Sheet.

Run:

```text
Network Dashboard
→ Validate Installation
```

This provides a useful pre-update health check.

If the current installation has significant validation errors, investigate those errors before introducing a new application version.

A healthy pre-update validation helps distinguish existing installation problems from issues introduced during an update.

It is also useful to note the current:

* application version,
* schema version,
* integration status,
* web app configuration.

---

# 5. Review the Available Update

Before updating a production installation, review the documentation for the version being installed.

Check the Network Dashboard GitHub repository for applicable:

* release notes,
* documentation changes,
* migration notes,
* known issues,
* new configuration requirements.

Pay particular attention to any release that mentions:

* schema migrations,
* new integrations,
* authentication changes,
* new Script Properties,
* new App Settings,
* changes to Google Sheet structure,
* changes to web app deployment requirements.

For routine releases, the standard update process below should be sufficient.

---

# 6. Pull the Latest Source

Return to the local Network Dashboard directory.

Run:

```powershell
git pull
```

Git will retrieve the latest Network Dashboard source and update the local `main` branch.

A normal successful update may resemble:

```text
Updating abc1234..def5678
Fast-forward
...
```

If Git reports:

```text
Already up to date.
```

the local repository already contains the latest source available from the configured branch.

---

## 6.1 Verify Git After the Pull

Run:

```powershell
git status
```

The working tree should normally remain clean.

You can also review the latest commit:

```powershell
git log -1 --oneline
```

This provides a quick reference for the source version currently present in the local installation.

---

# 7. Verify clasp Again

Before deploying the newly retrieved source, run:

```powershell
clasp status
```

This serves two purposes:

1. confirms the Apps Script target is still configured,
2. confirms which files clasp will deploy.

Application files should appear as tracked by clasp.

Local administrative and documentation files should not be deployed into Apps Script.

Examples of files that should normally remain local include:

```text
.git
.gitignore
.clasp.json
.claspignore
README.md
SETUP.md
UPDATE.md
FAQ.md
PERFORMANCE.md
package.json
package-lock.json
```

---

# 8. Push the Updated Source

Once the Git repository and Apps Script target have been verified, deploy the updated source:

```powershell
clasp push
```

Wait for the push to complete successfully.

At this point:

* the local Git repository contains the new Network Dashboard source,
* the existing Apps Script project contains the new Network Dashboard source,
* the Google Sheet may still require reconciliation.

Do not consider the update complete yet.

---

# 9. Run Update / Repair

Return to the existing Network Dashboard Google Sheet.

Reload the Sheet if necessary so the latest Apps Script menu code is loaded.

Then select:

```text
Network Dashboard
→ Update / Repair
```

Update / Repair reconciles the existing installation with the application version that was just deployed.

Depending on the release, Update / Repair may:

* create newly required application-managed Sheets,
* add newly required columns,
* add new App Settings,
* refresh App Settings metadata,
* update formulas,
* update validations,
* update managed protections,
* update maintenance triggers,
* perform required schema migrations,
* refresh cached application metadata,
* update application version information,
* update schema version information.

Existing organization-specific configuration and operational data should be preserved.

---

# 10. Data Preservation

Network Dashboard is designed so application updates do not replace the organization's data layer.

The update process should preserve existing organization-owned information such as:

* switches,
* access points,
* servers,
* routes,
* security camera information,
* intercom information,
* Internet/WAN information,
* department workflow data,
* App Users,
* App Settings values,
* App Integrations,
* organization branding,
* campus information,
* notes,
* web app configuration,
* Script Properties,
* API credentials.

The Git repository contains application source.

It does not become the authoritative source for organization-specific operational data.

---

# 11. Schema Migrations

Some Network Dashboard releases may require a schema migration.

Migrations are version-controlled and should run only when the existing installation requires them.

Network Dashboard prefers:

1. additive changes,
2. in-place changes,
3. destructive transformations only when necessary.

A migration may be required when an older data structure cannot support a newer application feature.

When a populated structure requires a destructive transformation, Network Dashboard should create and verify a timestamped backup before performing that transformation.

Do not manually recreate application-managed Sheets merely because a new schema version exists.

Allow Update / Repair to reconcile the installation.

---

# 12. Validate the Updated Installation

After Update / Repair completes, run:

```text
Network Dashboard
→ Validate Installation
```

This is the primary post-update health check.

Confirm that validation does not report unresolved problems with items such as:

* required Sheets,
* required headers,
* schema structure,
* application version,
* schema version,
* App Settings,
* managed protections,
* formulas,
* required triggers,
* web app configuration.

If validation reports a problem, investigate it before considering the update complete.

---

# 13. Open the Dashboard

After validation passes, select:

```text
Network Dashboard
→ Open Dashboard
```

Confirm that the production web application opens normally.

At minimum, verify:

* the Dashboard loads,
* navigation works,
* expected pages are available,
* organization branding remains intact,
* Settings loads for an administrator,
* User Management loads for an administrator.

For releases that modify a specific module, verify that module directly.

---

# 14. Verify Updated Functionality

The depth of post-update testing should match the scope of the release.

For a small maintenance release, opening the dashboard and testing the affected feature may be sufficient.

For larger releases, verify applicable functionality such as:

* Dashboard KPIs,
* table loading,
* editing,
* User Management,
* page permissions,
* Settings,
* Internet/WAN,
* Outages,
* Department Workflow,
* integrations,
* managed protections.

If the release changes authorization or permissions, test using a non-administrator account.

If the release changes Google Sheet protections, test using a non-owner Google Sheet Editor.

---

# 15. Verify Integrations

Application updates should not require re-entering existing integration credentials unless specifically documented in the release notes.

Credentials stored in Apps Script Script Properties remain associated with the existing Apps Script project.

If the update affects an integration, verify that integration after the update.

Current Network Dashboard integrations include:

* Aruba Central
* ThreatDown
* UptimeRobot

For Aruba Central, confirm synchronization if the release affected:

* authentication,
* token maintenance,
* switch synchronization,
* access point synchronization,
* status normalization,
* campus mapping.

For UptimeRobot, verify applicable Internet/WAN or outage health information.

For ThreatDown, verify the functionality applicable to the installed Network Dashboard release.

---

# 16. Verify Managed Protections

Update / Repair finishes by restoring Network Dashboard-managed protections.

If the release modified application-managed Sheet structure, verify protections after the update.

For a proper test, use a non-owner Google Sheet Editor.

Confirm that the account cannot modify protected application structure such as:

* canonical headers,
* App Settings keys,
* protected App Settings metadata,
* other Network Dashboard-managed protected ranges.

The Google Sheet owner retains ultimate authority over the Sheet and may still edit protected ranges.

This is expected Google platform behavior.

---

# 17. Normal Update Workflow

For routine Network Dashboard updates, the complete workflow is:

```powershell
cd C:\automation\projects\network_dashboard

git status
git remote -v

clasp status

git pull

git status
git log -1 --oneline

clasp status
clasp push
```

Then, in the Google Sheet:

```text
Network Dashboard
→ Update / Repair

Network Dashboard
→ Validate Installation

Network Dashboard
→ Open Dashboard
```

Finally:

```text
Verify affected functionality
        ↓
Verify affected integrations
        ↓
Confirm production operation
```

---

# 18. Quick Update Procedure

Experienced administrators can use the following condensed procedure for routine releases.

```powershell
cd C:\automation\projects\network_dashboard
git status
git pull
clasp status
clasp push
```

Then:

```text
Network Dashboard
→ Update / Repair
→ Validate Installation
→ Open Dashboard
```

Do not skip validation simply because `git pull` and `clasp push` completed successfully.

Those commands verify source deployment, not the health of the organization-owned data/schema layer.

---

# 19. Do Not Use `clasp pull` for Normal Updates

The Network Dashboard Git repository is the canonical source for application code.

The normal update process is:

```text
GitHub
   ↓
git pull
   ↓
Local Repository
   ↓
clasp push
   ↓
Apps Script
```

Do not normally run:

```powershell
clasp pull
```

inside the production Network Dashboard source directory.

`clasp pull` retrieves source from the Apps Script project and writes it into the local directory.

If the Apps Script project contains older or manually modified source, this can overwrite or conflict with the Git-managed application source.

Production application source should be updated from Git rather than pulled backward from Apps Script.

---

# 20. Do Not Create a New Sheet During an Update

A normal Network Dashboard update uses the existing:

* Google Sheet,
* Apps Script project,
* Script ID,
* web app deployment,
* organization data,
* Script Properties.

Do not create a new Google Sheet or Apps Script project simply to install an application update.

Doing so creates a separate Network Dashboard installation rather than updating the existing one.

---

# 21. Do Not Replace `.clasp.json`

`.clasp.json` connects the local repository to the organization's existing Apps Script project.

A normal:

```powershell
git pull
```

should not replace this file because it is installation-specific and excluded from the Git repository.

Do not copy another organization's `.clasp.json` into the production directory.

Always verify:

```powershell
clasp status
```

before pushing.

---

# 22. Web App Deployment Considerations

Most Network Dashboard source updates are deployed into the existing Apps Script project using:

```powershell
clasp push
```

The existing production `/exec` URL remains the organization's configured dashboard URL.

If a future Network Dashboard release requires changes to the Apps Script web app deployment itself, those requirements should be documented in the release notes.

Do not unnecessarily replace `app.web_app_url` during a routine application update.

---

# 23. If Update / Repair Reports an Error

If Update / Repair fails:

1. record the error message,
2. do not repeatedly rerun destructive operations,
3. check Apps Script execution logs,
4. determine whether the failure occurred before or during a schema migration,
5. check for a migration backup if applicable,
6. review the release documentation.

After correcting a non-destructive configuration issue, Update / Repair can normally be run again because the reconciliation process is designed to be idempotent.

If a destructive migration failed after modifying data, inspect the migration-specific backup and recovery instructions before making additional changes.

---

# 24. If Validate Installation Fails

If validation fails after an update, review the reported component.

Common categories may include:

```text
Missing or incorrect header
Missing application-managed Sheet
Missing setting
Incorrect schema version
Missing protection
Missing trigger
Invalid web app configuration
```

Depending on the reported problem, rerunning:

```text
Network Dashboard
→ Update / Repair
```

may reconcile the missing application structure.

Then run:

```text
Network Dashboard
→ Validate Installation
```

again.

Do not manually modify protected application structure unless the problem has been identified and manual repair is specifically required.

---

# 25. If the Dashboard Does Not Load After an Update

First confirm that:

```text
Network Dashboard
→ Validate Installation
```

passes.

Then confirm:

```text
app.web_app_url
```

still contains the organization's production `/exec` URL.

Check Apps Script execution logs for server-side errors.

Also check the browser developer console for client-side errors.

Useful troubleshooting information includes:

* application version,
* schema version,
* latest Git commit,
* validation results,
* Apps Script error,
* browser console error,
* affected page,
* affected integration.

---

# 26. Local Repository Problems

If the local production repository becomes damaged or unusable, do not create a new Google Sheet or Apps Script project.

The organization-owned installation already exists in Google.

A clean local repository can be created and reconnected to the existing Apps Script project.

Preserve the existing local directory first.

Then create a clean clone:

```powershell
git clone https://github.com/bj-pullman/network-dashboard.git .
```

Recreate `.clasp.json` using the **existing production Apps Script Script ID**:

```json
{
  "scriptId": "EXISTING_PRODUCTION_SCRIPT_ID",
  "rootDir": "."
}
```

Then verify:

```powershell
clasp status
```

before pushing anything.

---

# 27. Security During Updates

Never place organization credentials into:

* Git commits,
* source files,
* HTML files,
* Markdown documentation,
* public issue reports.

Integration secrets should remain in:

```text
Apps Script
→ Project Settings
→ Script Properties
```

Examples include:

```text
ARUBA_CLIENT_ID
ARUBA_CLIENT_SECRET
ARUBA_REFRESH_TOKEN

THREATDOWN_ACCOUNT_ID
THREATDOWN_CLIENT_ID
THREATDOWN_CLIENT_SECRET

UPTIMEROBOT_API_KEY

NETWORK_DASHBOARD_BREAK_GLASS_ADMINS
```

A normal Network Dashboard update should not remove these Script Properties because the existing Apps Script project is retained.

---

# 28. Post-Update Checklist

Before considering the update complete, verify:

```text
[ ] Correct production repository was used
[ ] Git working tree was reviewed before updating
[ ] Git origin points to the canonical Network Dashboard repository
[ ] Existing Apps Script target was verified with clasp status
[ ] Pre-update Validate Installation was reviewed

[ ] git pull completed successfully
[ ] Latest Git commit was reviewed
[ ] clasp status was reviewed again
[ ] clasp push completed successfully

[ ] Update / Repair completed successfully
[ ] Post-update Validate Installation passes
[ ] Application version is correct
[ ] Schema version is correct

[ ] Open Dashboard works
[ ] Dashboard loads successfully
[ ] Navigation works
[ ] Organization configuration remains intact
[ ] User configuration remains intact

[ ] Updated functionality was tested
[ ] Affected integrations were tested
[ ] Affected permissions were tested if applicable
[ ] Managed protections were verified if applicable

[ ] Production operation confirmed
```

---

# Update Workflow Summary

For most Network Dashboard releases:

```text
Review Release
      ↓
Validate Existing Installation
      ↓
git status
      ↓
Verify Repository / clasp Target
      ↓
git pull
      ↓
Verify Updated Source
      ↓
clasp status
      ↓
clasp push
      ↓
Update / Repair
      ↓
Validate Installation
      ↓
Open Dashboard
      ↓
Test Updated Functionality
      ↓
Production Confirmed
```

The key principle is:

```text
Git updates the application source.

clasp deploys the application source.

Update / Repair reconciles the organization-owned installation.

Validate Installation proves the resulting installation is healthy.
```

Network Dashboard updates are designed to improve the application while preserving each organization's ownership of its data, configuration, credentials, users, and deployment.
