# Puru fork of OHIF-Viewer

This repository is Puru Labs' fork of [OHIF/Viewers](https://github.com/OHIF/Viewers). It runs **on-premises** at each hospital as the DICOM viewer for radiology workflows, packaged as `dviewer` Docker image on port 3000.

> **Not** to be confused with `dviewer.puru.co.in` — that's Puru's own cloud teleradiology viewer, not this fork.

## Where things live

| Doc | What |
|---|---|
| [`SYNC.md`](./SYNC.md) | Upstream-sync playbook + Puru-owned paths list |
| [`docs/puru/DEVELOPMENT.md`](./docs/puru/DEVELOPMENT.md) | Day-to-day work: adding features, code layout, conventions |
| [`docs/puru/RELEASE.md`](./docs/puru/RELEASE.md) | Release ritual: tag → Cloud Build → on-prem deploy |
| [`docs/puru/BRANDING.md`](./docs/puru/BRANDING.md) | Branding overrides + strategy |
| [`CLAUDE.md`](./CLAUDE.md) | Guide for Claude Code sessions |

## The 30-second orientation

**Working branch:** `puru/v3.12.0` (never `master`). Upstream lives at `OHIF/Viewers`, tracked as the `upstream` remote (added by `scripts/sync-upstream.sh` on first run).

**What Puru added on top of OHIF v3.12:**

- Two custom viewing modes selected by URL context:
  - `/viewer/dicomjson?url=...` or `/viewer?StudyInstanceUIDs=...` — full-window Mode 2 (`puru-report`) with an inline reports side panel. Claims OHIF's canonical `/viewer` route because external HIS deployments already use these URLs in the wild — do not rename.
  - `/puru-quick/dicomjson?url=...` — compact horizontal filmstrip, no side panel (hydrogen slide-in study-detail iframe)
- Report tiles fetched from puru-pacs by StudyInstanceUID. Approved reports open inline in the panel; non-approved show status chips ("Send to radiologist", "In progress", etc).
- External HIS deep-link launcher — `?accessionNumber=` or `?uhid=` → resolves via puru-pacs, then renders normally.
- Branding overrides — About modal, product name, error boundary support link, HTML meta.

**Where custom code lives (namespaced to survive upstream syncs):**

```
extensions/puru-reports/       ← reports panel + compact series list + PuruQuickLayout
extensions/puru-branding/      ← About modal override, product name
modes/puru-quick/              ← Mode 1 (compact filmstrip)
modes/puru-report/             ← Mode 2 (with reports panel)
platform/app/src/launcher/     ← PuruStudyLauncher (deep-link resolver)
platform/app/src/routes/PuruLanding/  ← Custom landing page
platform/app/public/config/default.js ← Runtime config + branding
platform/app/public/manifest.json     ← PWA metadata
platform/app/public/puru-logo.svg     ← Header logo
scripts/sync-upstream.sh       ← Manual sync tool
.github/workflows/detect-upstream-tag.yml  ← Weekly auto-PR
SYNC.md, PURU.md, docs/puru/   ← These docs
```

**Upstream files we've patched** (small, tracked in `SYNC.md`):
- `extensions/default/src/index.ts` (exports we consume)
- `platform/app/src/pluginImports.js` (registration)
- `platform/app/src/routes/Mode/Mode.tsx` (launcher gate)
- `platform/ui-next/src/components/Errorboundary/ErrorBoundary.tsx` (support link)
- `platform/app/package.json` (description)
- `platform/i18n/src/locales/en-US/AboutModal.json` (title string)
- `platform/app/public/html-templates/rollbar.html` (demo template branding)

## Recurring work — the calendar

| When | What | Where |
|---|---|---|
| **Weekly (auto Monday)** | Check the draft `sync/vX.Y.Z` PR opened by the workflow. Merge or resolve conflicts, tag `puru-vX.Y.Z-p1`. | [`docs/puru/RELEASE.md`](./docs/puru/RELEASE.md) |
| **Per feature** | Follow the "Puru-owned paths only" rule. If you can't, patch a namespaced upstream file and add it to `SYNC.md`'s watch list. | [`docs/puru/DEVELOPMENT.md`](./docs/puru/DEVELOPMENT.md) |
| **Per hospital rollout** | Update `puru-nucleus` config to pin `dviewer:puru-vX.Y.Z-pN`. | [`docs/puru/RELEASE.md`](./docs/puru/RELEASE.md) |
| **On upstream OHIF v4** (some day) | Merge minor bumps first, then major. Rehearse launcher gate + custom modes still resolve. Update PuruStudyLauncher for any React Router / hooks changes. | [`SYNC.md`](./SYNC.md) |

## Fast setup

```bash
git remote add upstream https://github.com/OHIF/Viewers.git  # once
yarn install
yarn dev                                                     # http://localhost:3000
```

New workspace package added to `extensions/*` or `modes/*`? Re-run `yarn install` so yarn workspaces links it into `node_modules/@ohif/`.
