# Upstream sync playbook

This fork tracks tagged OHIF releases. We do NOT track upstream `master` — WIP commits multiply merge conflicts and can ship instability to hospitals.

## Cadence

Automated: `.github/workflows/detect-upstream-tag.yml` runs every Monday, opens a draft `sync/vX.Y.Z` PR when a new upstream tag lands.

Manual: `scripts/sync-upstream.sh vX.Y.Z` does the same locally.

## Puru-owned paths (must never be touched by upstream merges)

If any of these show up in `git status` during a sync, prefer the Puru side (`git checkout --ours <path>`):

- `extensions/puru-reports/`
- `extensions/puru-branding/`
- `modes/puru-quick/`
- `modes/puru-report/`
- `platform/app/src/launcher/`
- `platform/app/src/routes/PuruLanding/`
- `platform/app/public/config/default.js`
- `platform/app/public/app-config.js`
- `platform/app/public/puru-logo.svg`
- `platform/app/public/manifest.json`
- `platform/app/public/html-templates/*.html` (title / meta tags)
- `platform/i18n/src/locales/en-US/AboutModal.json` (Puru branding string)
- `SYNC.md` (this file)
- `scripts/sync-upstream.sh`
- `.github/workflows/detect-upstream-tag.yml`
- `cloudbuild.yaml`

## Upstream files we've touched (expect real conflicts here)

Keep these diffs minimal — the smaller the diff, the cleaner the sync.

- `extensions/default/src/index.ts` — added exports for `WrappedPanelStudyBrowser` and `ViewerHeader` so `puru-*` extensions can consume them without deep imports.
- `platform/app/src/pluginImports.js` — appended `push()` and `import()` blocks for our extensions/modes, AND deliberately removed `modes.push("@ohif/mode-longitudinal")` so `mode-puru-report` claims routeName `/viewer` for the external HIS URL contract. Do not re-add the longitudinal push during syncs.
- `platform/app/src/routes/Mode/Mode.tsx` — wrapped in the `PuruStudyLauncher` gate.
- `platform/ui-next/src/components/Errorboundary/ErrorBoundary.tsx` — swapped hardcoded OHIF GitHub URL for a config-driven support URL.
- `platform/app/package.json` — description field.
- `platform/ui-next/src/tailwind.css` — Puru theme (:root + .dark CSS variables). See `docs/puru/BRANDING.md` for palette rationale.
- `platform/ui-next/tailwind.config.js` — `actions` and `bkg` blocks re-tinted to Puru cyan.
- `platform/ui/tailwind.config.js` — `primary`, `secondary`, `inputfield`, `bkg`, `actions` blocks re-tinted to Puru cyan.

## Sync workflow (manual)

```bash
# Prerequisites: on puru/vX.Y.Z branch, working tree clean.
scripts/sync-upstream.sh v3.13.0
# On conflicts, resolve — Puru-owned files always win.
yarn install && yarn dev  # smoke: confirm /puru-report and /puru-quick boot.
# Open PR sync/v3.13.0 → puru/v3.13.0
# After merge:
git checkout puru/v3.13.0
git tag puru-v3.13.0-p1
git push origin puru-v3.13.0-p1
# Cloud Build publishes dviewer:puru-v3.13.0-p1 for pinned on-prem rollout.
```

## Sync workflow (automated PR)

1. The scheduled workflow opens `sync/vX.Y.Z` PR (draft).
2. Reviewer checks out branch locally, resolves any conflicts, runs `yarn dev`, tests /puru-report and /puru-quick with a known study.
3. Push fixes to the sync branch.
4. Mark PR ready, merge into `puru/vX.Y.Z`.
5. Tag `puru-vX.Y.Z-p1` — Cloud Build publishes the image.
6. Update on-prem nucleus deployments to pull the new tag when ready.

## Image versioning

Cloud Build (`cloudbuild.yaml`) publishes:
- `dviewer:latest` — always the newest build.
- `dviewer:${TAG_NAME}` — only when built from an annotated tag (`puru-vX.Y.Z-pN`).

Hospitals pin their nucleus config to a specific `puru-vX.Y.Z-pN` tag; they never pull `latest` in production.

## When something upstream needs a real patch

If a Puru feature can't be built without editing an upstream file:

1. Prefer `customizationService.setCustomization('key', value)` in a Puru extension.
2. If no customization key exists, request one upstream (OHIF is receptive to that).
3. Only patch upstream code as a last resort — document the patch in this file so the next sync knows to preserve it.
