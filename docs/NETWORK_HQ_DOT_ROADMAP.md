# Network HQ — Dot development roadmap

**Status:** Owner-requested roadmap; **implementation statuses must be verified by repository audit**. Numbers preserve the roadmap discussion order. Do not interpret being listed here as evidence the feature is absent.

## 14 requested items

1. **Manage Deployments:** administrator-friendly view or workflow for deployment management. Inventory how the existing Apps Script deployment model works first; no production deployment without approval.
2. **Remove Wazuh:** remove retired Wazuh integration references and associated dead UI/configuration safely, without affecting active integrations.
3. **IANA timezone setting:** configurable organization timezone (e.g., `America/Chicago`); consistent correct date/time normalization across Settings, forms, tables, Dashboard, and exports. Prevent the prior Mexico City/date-shift issue.
4. **Sensitive IP/password visibility:** IP addresses visible only at the requested Edit permission level; credentials always require restricted authorization; enforce on the server and omit protected values from ordinary payloads and exports.
5. **Configurable dropdowns:** administrator-configurable options across appropriate forms, preserving existing/custom values and supporting a compact, consistent UI.
6. **Change Log status colors:** clear, readable states and consistently rendered statuses, without changing stored values.
7. **Documentation templates:** ability to download or create standardized documentation templates, including Google Docs workflows where appropriate, and attach/import documentation to Change Log records with duplicate safeguards.
8. **Premium Outages workflow:** manual incident records as the source of truth; optional UptimeRobot updates; editable review queue; accurate downtime/times; filters, clear summaries, and printable/exportable history. Do not conflate monitored events with human-confirmed incident records.
9. **App-wide status color standardization:** shared accessible tokens (green healthy/resolved/implemented, red down/failed/critical, orange degraded/rolled back/warning, blue monitoring/in progress, gray retired/disabled/unknown), respecting status semantics.
10. **Dashboard quick action:** prominent **Add Change Log** action from the Dashboard, following user permissions and the existing entry workflow.
11. **Global page-heading design:** bold, blocky sans-serif `/ Page /` headings across all pages with coherent spacing and responsive treatment.
12. **VM Host:** allow virtual servers to associate to a host without duplicate inventory records; show useful host/guest relationships and keep existing server data intact.
13. **Contacts directory:** maintain vendor and operational contact information useful to the district, including names, organizations, roles, emails, phones, categories, notes, and search. Do not label every vendor an 'Emergency Contact'.
14. **Print Playbook:** binder-ready, generated **Network HQ Playbook** PDF containing actual data organized by existing Network HQ page names with section covers and print-friendly pagination. Default exclude Overview/Settings or any other unsuitable pages unless chosen. Offer **Standard** (passwords blanked/redacted) and **Confidential** (can include passwords only through an explicit, secure, authorized, audited design) versions. Treat IP addresses and other sensitive network data according to permissions. Include generated timestamp, clear classification, and sensible page/section controls. Review confidentiality threat model and safe file handling before implementing the password-inclusive mode.

## Existing functionality to audit, not reimplement blindly

- **Network Closets**: campus, type (MDF/IDF/server room/demarc/telecom/other), room/location/power, repeatable UPS data, existing switch/server associations, permissions and non-destructive migrations.
- **SSIDs**: manually managed security level and key management including WPA/PSK, restricted passwords, correct Add/Edit schema.
- **Aruba Central**: existing API/sync/token logic must remain intact.
- **Change Log**: existing Google Docs import, configurable categories and system areas, duplicate checks.
- **UptimeRobot**: optional integrations; keep manual outage workflows usable without it.
- **Existing UI/settings and documentation**: inspect before changing.

## Recommended sequencing (subject to audit)

**Phase 0: Baseline and architecture.** Audit `dot-dev`, dependency/test suite, actual feature coverage, current deployment safety; propose and confirm whether to stay on Apps Script for roadmap completion or undertake a separately scoped platform migration. Preserve production.

**Phase 1: Core safety and consistency.** Items 2, 3, 4, 5, 6, 9, and 11, as appropriate after audit.

**Phase 2: Operational workflows.** Items 1, 7, 8, 10, 12, and 13, adjusting to dependencies.

**Phase 3: Printable playbook.** Item 14, with standard export first, then confidential mode only after security approval.

**Phase 4: Verification/release.** Regression/security coverage; README/setup/update guide; test dev Apps Script project (if architecture unchanged); document human-controlled release steps.

## Acceptance criteria for every item

- Works in the actual application and respects role-based permissions.
- Preserves existing data and installation/update behavior.
- Automated tests updated or added and results reported.
- Responsive design, consistent labels and UI.
- All relevant documentation updated.
- No deployment to a live production Apps Script/Google Sheet or merge into `main`.
- Commit or PR in `dot-dev` with clear evidence; mark status only after testing.

## Progress tracking

Dot should maintain a simple status table in this file or dedicated GitHub issues: `Not started / Auditing / In progress / In review / Done / Blocked`, with commit links and evidence. The initial status of **all 14 items is Unverified** until the baseline audit.

**Separate projects are excluded:** Arca, Folio One, Launchpad Finance, personal Command Center, and standalone subscriber/update-form service.
