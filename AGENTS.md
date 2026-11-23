# Network HQ — instructions for Dots and Codex

**Repository:** `bj-pullman/network-dashboard`
**Development/integration branch:** `dot-dev`
**Protected production branch by policy:** `main`

## Non-negotiable Git rules

1. Start from the latest `origin/dot-dev`. Commit approved changes to `dot-dev`. If Codex needs a separate working branch, create it **from `dot-dev`** and set any PR base to `dot-dev`.
2. Never commit, merge, rebase, force-push, reset, or open an auto-merge PR into `main`. Never change the repository default branch. Only the owner can authorize a production merge.
3. Never change production code or deploy to production from a GitHub branch without the owner's explicit consent.
4. Make changes in small, reviewable increments. Do not start with a wholesale rewrite.

## Deployment isolation — critical

The current Network HQ project is an Apps Script + Google Sheets application. A separate Git branch **does not isolate an Apps Script deployment**. Running `clasp push` against a production Script ID could affect production even while on `dot-dev`.

- Do **not** run `clasp push`, modify any live Apps Script deployment, change production Script Properties, or write to any production Google Sheet without specific, explicit authorization for that target.
- Use repository tests and mocks first. For end-to-end tests, require a separate, explicitly identified **development Apps Script project and test Google Sheet** with independent credentials.
- Never include real credentials or private school/district records in code, test fixtures, logs, or GitHub.

## Architecture and existing features

- Start by auditing the real repository, tests, documentation, and feature state. Do not claim an item is missing or complete without evidence.
- Network HQ currently uses Google Apps Script and organization-owned Google Sheets. The owner has separately explored moving it to a hosted web application, PostgreSQL, Docker and Coolify on an OVH VPS. **Neither force a migration nor permanently rule it out.** Document options, migration risks, existing data/API compatibility, and request approval of an architecture decision before implementing a platform change.
- Preserve all existing functional behavior during roadmap development: Aruba Central sync and refresh tokens, integrations, SSIDs, Network Closets, migrations, RBAC and restricted fields, Setup/Update/Repair, and current single-page navigation.
- Do not reintroduce custom URL routing. Preserve existing data and use non-destructive, repeatable schema updates.
- Maintain the ability of other districts to deploy independent, organization-owned instances; avoid paid mandatory dependencies and district-specific hardcoding.
- Keep `README.md`, `SETUP.md`, `UPDATE.md`, `FAQ.md`, and `PERFORMANCE.md` accurate.

## Security

- Server-side authorization controls all protected operations, not only visible UI.
- Passwords, API keys, refresh tokens and sensitive network details must not be committed or logged.
- The Print Playbook has two deliberately distinct modes:
  - **Standard:** passwords and other credentials redacted; safe-for-reference output.
  - **Confidential:** option to include authorized password fields, **only** with a reviewed, secure workflow (privileged authorization, fresh verification where technically feasible, clear confidentiality markings, minimal exposure, audit of exports, secure generation, and no unprotected temporary files or logs). Reject unsafe or unsupported implementations and ask the owner to approve the security design. Do not silently include plaintext secrets in a normal PDF/export flow.
- Keep IP address visibility conditional on edit-level access where the roadmap requires it; password access remains stricter.

## Development loop

1. Read `docs/NETWORK_HQ_DOT_ROADMAP.md`, inspect current source and test coverage, and classify each item as done/partial/not started.
2. Build a dependency-ordered backlog; record acceptance criteria, security impacts, and test coverage.
3. Select a small safe work item. Implement it from `dot-dev`, write tests, and run `npm test`; run relevant browser tests or provide precise limitations.
4. Document changes, verify no production deployment, update roadmap status, and commit to `dot-dev`.
5. Provide a concise review summary: what changed, commit/PR URL, tests run and results, risks, blocked items, and what is next.
6. Continue through approved tasks, but pause for human decisions on architecture changes, sensitive export design, new third-party services, migration, potential data loss, production access, billing, or live release.

The Dot coordinates roadmap delivery. Codex should execute bounded technical tasks with testable acceptance criteria.

## Project boundary

The 14-feature Network HQ roadmap is in `docs/NETWORK_HQ_DOT_ROADMAP.md`. It is separate from Arca, Launchpad Finance, Folio One, the personal Command Center, and the standalone Network HQ subscriber/update-form application. Do not edit those other repositories without explicit instruction.
