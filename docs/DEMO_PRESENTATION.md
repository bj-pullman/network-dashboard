# Network HQ demo: Settings and Users & Permissions

Use these settings only in the **separate Apps Script project and spreadsheet containing fictional demo data**. Do not point this checkout at the regular Dot Dev test sheet or a live district installation unless that is the expressly intended demo target. This feature does not seed, rename, or modify spreadsheet rows.

## Enable on the existing demo URL

1. Pull `dot-dev`. Verify `.clasp.json` points to your **demo** Apps Script project, not the normal Dot Dev or production project. If necessary, use a separate checkout for the demo.
2. In that Apps Script project's **Project Settings → Script Properties**, add `NETWORK_HQ_DEMO_SPREADSHEET_ID` with the ID of its own fictional spreadsheet (the portion between `/d/` and `/edit` in the Sheet URL). A missing or non-matching ID leaves the feature off.
3. As project owner, push the code to the verified demo project. In Apps Script **Deploy → Manage deployments**, edit the existing **demo** deployment and select a new version; keep the existing audience and execution settings. Do not change production deployments.
4. Open the same demo link using an already-authorized demo viewer account. Verify the sidebar shows **Demo School District** and **Settings** and **Users & Permissions** appear under Administration. Expand the technician's example to show Dashboard View, Switches Edit, and default None. Visit **Outages** and **Change Log** for the new descriptions.

The two administration previews use fictional examples, with no Settings, Users, or provider requests. They do not authorize new viewers or grant anyone admin privileges. The real admin routes still require existing administrator authorization and are not linked from the demo sidebar. Removing the Script Property restores ordinary navigation and branding. The mode does not change the permissions on existing inventory and log pages; use your existing read-only viewer for the recording.

## What to say in the walkthrough

- **Outages** is a downtime log. When a full installation is linked to UptimeRobot and active monitors are mapped to its supported WAN circuits, Network HQ can sync the incident history available from those monitors. A provider event is not automatically a confirmed outage.
- **Change Log** is a manually maintained record of what changed, when, who made it, and its status. It is not automatic monitoring.
- **Settings** distinguishes enabled, configured, connected, and synced. The demo states shown are fictional; no connection is tested and no key is required.
- **Users & Permissions** shows demo roles, default permissions and per-page overrides; it does not add or edit accounts.

Fixture verification: `npm test` and `node tests/demo-presentation-browser.cjs` (pass `CHROMIUM_PATH` if needed).
