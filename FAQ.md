# Network Dashboard FAQ

This document answers common questions about installing, managing, securing and updating Network Dashboard.

For complete installation instructions, see `SETUP.md`.

---

# General

## What is Network Dashboard?

Network Dashboard is a Google Sheets + Google Apps Script application for documenting and managing network infrastructure, operational systems, integrations and related technology information.

The Google Sheet acts as the installation's persistent data store.

The Apps Script web application provides the primary user interface.

---

## Where is my data stored?

Operational data is stored in the Google Sheet owned by your organization.

Secrets such as API client secrets and refresh tokens are stored in Apps Script Script Properties.

Network Dashboard's public Git repository contains application source code and should not contain organization-specific secrets.

---

## Does the Network Dashboard developer have access to my data?

Not through the standard installation model.

Each organization owns its own:

```text
Google Sheet
Apps Script project
Script Properties
credentials
users
deployment
```

The public repository distributes application source code.

Your organization controls its own installation and updates.

---

## Is Network Dashboard SaaS?

No.

The standard deployment model is organization-owned rather than centrally hosted.

Each organization operates its own Apps Script project and Google Sheet.

---

# Installation

## Do I need to know Git?

Only basic commands are required for normal installation and updates.

Initial installation uses:

```powershell
git clone
```

Updates normally use:

```powershell
git pull
clasp push
```

Then run:

```text
Network Dashboard
→ Update / Repair
```

---

## Why does Network Dashboard use clasp?

`clasp` is Google's command-line tool for Apps Script projects.

It allows the Network Dashboard source maintained in Git to be pushed into an organization's Apps Script project.

This provides a repeatable update model without requiring users to manually copy dozens of Apps Script files.

---

## Should I use `clasp pull`?

Normally, no.

Network Dashboard treats the Git repository as the canonical application source.

Running `clasp pull` into the production source directory can overwrite newer Git-managed source with whatever currently exists in Apps Script.

Use:

```powershell
git pull
clasp push
```

for standard application updates.

---

## What does `.clasp.json` contain?

It identifies the Apps Script project belonging to that installation.

Example:

```json
{
  "scriptId": "YOUR_SCRIPT_ID",
  "rootDir": "."
}
```

Because every organization has a different Script ID, `.clasp.json` is installation-specific and should not be committed to the public repository.

---

# Setup and Updates

## What is the difference between Setup / Initialize and Update / Repair?

**Setup / Initialize** is primarily the installer.

It creates missing application structure including sheets, headers, settings, protections and triggers.

**Update / Repair** is the normal post-update operation.

After:

```powershell
git pull
clasp push
```

run:

```text
Network Dashboard
→ Update / Repair
```

It reconciles the existing installation with the new application version.

---

## Will Setup / Initialize erase my data?

It is designed not to.

Setup uses additive/idempotent reconciliation for existing installations.

Existing operational data, settings, users and Script Properties should remain intact.

Certain historical schema migrations may transform application-managed structures. When a populated structure must be rebuilt, the migration should first create a verified backup.

---

## Will Update / Repair erase my data?

It should not.

The update architecture specifically separates application source from organization-owned data.

Update / Repair may:

```text
add missing headers
add settings
update application metadata
run required schema migrations
repair protections
repair triggers
refresh formulas
clear caches
```

but existing organization-owned values should remain intact unless a specific versioned migration requires transformation.

---

## Do I have to run Update / Repair after every `clasp push`?

For production releases, yes.

The expected update workflow is:

```powershell
git pull
clasp status
clasp push
```

then:

```text
Network Dashboard
→ Update / Repair
```

This ensures the Sheet schema and runtime configuration match the newly deployed source.

---

## Can Network Dashboard update itself automatically?

Not currently.

Organizations deliberately control when application releases are deployed.

A future updater may simplify:

```powershell
git pull
clasp push
```

into a helper script.

---

# Google Sheet Protection

## Why are Network Dashboard headers protected?

Headers define application schema.

Changing a header may prevent Network Dashboard from correctly locating data.

Protections reduce accidental structural changes such as:

```text
typing over a header
clearing a header
deleting a schema column
changing App Settings metadata
```

---

## Can I still edit normal data?

Yes.

Network Dashboard-managed protections are intended to protect application structure, not normal operational data entry.

---

## Why can the owner still edit protected cells?

Google Sheets always gives the file owner ultimate administrative authority.

The Sheet owner can therefore modify or remove protected ranges even when Network Dashboard protections are enabled.

This is a Google Sheets platform rule, not a Network Dashboard permission.

Other Sheet editors remain subject to Network Dashboard-managed protections.

---

## Does Setup give the installer permission to bypass protections?

No.

Network Dashboard does not intentionally whitelist the person who runs Setup.

If that person is the Google Sheet owner, Google's ownership model gives them ultimate edit authority regardless of Network Dashboard protection settings.

---

## How do I intentionally edit protected structure?

Use:

```text
Network Dashboard
→ Protection
→ Disable Protection (15 Minutes)
```

Protections are temporarily removed.

They will automatically be restored after approximately 15 minutes.

You can restore them immediately using:

```text
Protection
→ Enable Protection
```

---

# Users and Permissions

## Does someone need access to the Google Sheet to use Network Dashboard?

Not necessarily.

When the web app is deployed using:

```text
Execute as: Me
```

the backend accesses the Sheet using the deployment owner's authorization.

Network Dashboard users therefore do not necessarily need direct Editor access to the underlying Sheet.

---

## Does giving someone access to the Sheet give them Network Dashboard access?

No.

Google Sheet permissions and Network Dashboard application permissions are separate.

Network Dashboard evaluates users through `App Users` and server-side RBAC.

---

## What roles are supported?

Currently:

```text
Admin
User
```

Users may also receive:

```text
View
Edit
None
```

as default or per-page permissions.

---

## What happens if someone is not in App Users?

They receive the Network Dashboard Access Denied page.

Google may still show its own Apps Script/Workspace authorization flow before Network Dashboard code can perform the application authorization check.

That platform-level authorization occurs outside Network Dashboard.

---

## What is a break-glass administrator?

A break-glass administrator is an emergency administrative identity configured through the Script Property:

```text
NETWORK_DASHBOARD_BREAK_GLASS_ADMINS
```

Break-glass users receive administrative access even if normal App Users configuration becomes unavailable or misconfigured.

Use this feature sparingly.

---

# Deployment

## How should the web app be deployed?

Recommended:

```text
Execute as:
Me
```

Use the organization/domain access option appropriate for the Google Workspace environment.

Network Dashboard then applies its own RBAC after Google authenticates the user.

---

## Where do I save the deployed web app URL?

Save the `/exec` deployment URL as:

```text
app.web_app_url
```

Then:

```text
Network Dashboard
→ Open Dashboard
```

should open it.

---

## Why does Open Dashboard say the URL isn't configured?

Confirm that `app.web_app_url` contains the Apps Script production `/exec` URL.

Do not use an Apps Script editor URL or development URL.

If the setting was recently changed, current Network Dashboard versions force a fresh configuration read for the Open Dashboard action.

---

# Integrations

## Where are integration credentials stored?

Secrets belong in:

```text
Apps Script
→ Project Settings
→ Script Properties
```

They should never be stored in Git or normal Sheet cells.

---

## Which integrations are currently supported?

Current integration work includes:

```text
Aruba Central
ThreatDown
UptimeRobot
```

Integration maturity varies by provider.

See the README for current implementation status.

---

## Why does Aruba Central require a refresh token?

Aruba Central uses OAuth.

Network Dashboard exchanges the stored refresh token for access tokens used to call Aruba APIs.

When Aruba returns a replacement refresh token, Network Dashboard stores the new token back into Script Properties.

A scheduled maintenance trigger periodically refreshes OAuth so the refresh token does not become stale during normal operation.

---

## Why does Central show one of my switches as Offline?

Network Dashboard normalizes Central's reported monitoring state.

Older Aruba switch families or Monitor Mode devices may expose status differently than newer Central-managed devices.

Network Dashboard does not intentionally assume that a switch is online merely based on model.

If a known-working device appears Offline, compare the actual Central status payload with the normalized Network Dashboard result.

---

## How is Campus populated for Aruba devices?

Network Dashboard uses Aruba Central's **Site** assignment as the preferred Campus source for synchronized switches and access points.

Central Group is considered separate management metadata and is not automatically treated as Campus.

---

# Security

## Where should passwords and secrets be stored?

API credentials and tokens should be stored in Script Properties.

Do not place:

```text
API client secrets
refresh tokens
access tokens
shared passwords
private keys
```

in Git, documentation or public Sheet cells.

---

## Are device passwords displayed automatically?

No.

Sensitive credential fields are designed to remain hidden by default.

Where supported, revealing a password requires appropriate server-side permission.

Exports and normal page payloads should not automatically include sensitive password values.

---

# Troubleshooting

## The Network Dashboard menu does not appear.

Reload the Google Sheet.

Confirm that the Apps Script project is bound to that Sheet and that `Code.js` was successfully pushed with clasp.

---

## `clasp status` says "Project settings not found."

The local directory does not contain a valid `.clasp.json`.

Create one using the Apps Script project's Script ID.

---

## `git clone` says the destination directory is not empty.

Git will not clone into a populated folder.

For a clean installation, use an empty directory.

If the folder contains an older installation, preserve or rename it before cloning unless you intentionally know how to migrate its Git history.

---

## Git says "refusing to merge unrelated histories."

The local folder and current GitHub repository have unrelated Git histories.

Do not normally use `--allow-unrelated-histories` for a Network Dashboard production installation.

Preserve the old directory and create a clean clone of the canonical repository instead.

---

## `clasp status` shows README and Git files as untracked.

That is expected.

`.claspignore` prevents development/documentation files from being pushed into Apps Script.

Only Network Dashboard runtime source should be listed as tracked.

---

## I changed an App Setting but the dashboard still shows the previous value.

Refresh the dashboard.

Current Network Dashboard versions invalidate configuration/data caches when managed settings change.

If the problem remains, run:

```text
Network Dashboard
→ Update / Repair
```

and then Validate Installation.

---

## Validation reports missing protections.

Run:

```text
Network Dashboard
→ Protection
→ Enable Protection
```

or:

```text
Network Dashboard
→ Update / Repair
```

Then validate again.

---

## Aruba Central sync reports an expired refresh token.

If the refresh token has already expired, generate a new refresh token in Aruba Central and replace:

```text
ARUBA_REFRESH_TOKEN
```

in Script Properties.

Once a valid token is restored, Network Dashboard's scheduled token maintenance should normally keep it rotating automatically.

---

## Can I edit the application directly in Apps Script?

Technically yes, but it is not recommended for production.

Git is the canonical source.

Changes made only in the Apps Script editor may later be replaced by:

```powershell
clasp push
```

Make application source changes in the Git-managed local repository instead.

---

# Backups and Recovery

## Does Network Dashboard automatically back up the entire Sheet?

No.

The application may create migration-specific backups when a versioned migration needs to restructure populated application data.

Organizations should still use their own Google Workspace retention, backup or archival practices.

---

## What happens if an update fails?

Do not repeatedly rerun commands blindly.

Check:

```text
Apps Script execution logs
Validate Installation
Git status
current application version
current schema version
```

If a migration-specific backup was created, preserve it until the problem is resolved.

---

# Support Information

When asking for assistance, include:

```text
Network Dashboard application version
Schema version
Apps Script error
Browser console error
Validation result
Relevant page/module
Integration involved
```

Do not post secrets, passwords, refresh tokens or API credentials in public support requests.
