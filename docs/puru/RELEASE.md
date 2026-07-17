# Puru fork — Release runbook

The complete cycle: upstream sync → release tag → Cloud Build image → on-prem deployment. Follow in order.

## Cadence

| Trigger | Result |
|---|---|
| Monday 08:00 IST (weekly) | GitHub Action opens draft `sync/vX.Y.Z` PR if a new upstream OHIF `v3.*` tag exists |
| Any commit to `puru/*` branches | Cloud Build → `dviewer:latest` + `dviewer:<sha>` |
| Push annotated tag `puru-vX.Y.Z-pN` | Cloud Build → `dviewer:puru-vX.Y.Z-pN` (immutable, hospital-pinnable) |

## Stage 1 — Sync (weekly, on the Monday PR)

**Automated path:**

1. GitHub → Actions → check the "Detect upstream OHIF release" workflow. If it opened `sync/vX.Y.Z` PR, proceed.
2. Locally: `git fetch && git checkout sync/vX.Y.Z`.
3. `yarn install && yarn dev` — smoke test:
   - Open `/viewer/dicomjson?url=<test-manifest>` — Mode 2 (puru-report) loads with Reports panel, APPROVED tile opens in-panel, back button returns.
   - Open `/viewer?StudyInstanceUIDs=<uid>` — same Mode 2, external HIS URL contract preserved.
   - Open `/puru-quick/dicomjson?url=<test-manifest>` — horizontal filmstrip shows above the viewer.
   - Open About modal — shows "Puru DICOM Viewer" (not "OHIF Viewer").
4. If broken: patch on the sync branch, `git push`.
5. If green: mark PR ready → merge into `puru/vX.Y.Z`.

**Manual path (workflow didn't fire or you need an ad-hoc sync):**

```bash
git checkout puru/vX.Y.Z
scripts/sync-upstream.sh v3.13.0     # target upstream tag
# resolves conflicts printed by the script → prefers Puru side
yarn install && yarn dev             # smoke
# push, open PR, merge as above
```

If conflicts appear in Puru-owned paths, always prefer our side:

```bash
git checkout --ours extensions/puru-reports extensions/puru-branding modes/puru-quick modes/puru-report
git checkout --ours platform/app/src/launcher platform/app/src/routes/PuruLanding
git checkout --ours platform/app/public/config/default.js platform/app/public/manifest.json platform/app/public/puru-logo.svg
git checkout --ours SYNC.md PURU.md docs/puru scripts cloudbuild.yaml
git add <same>
```

For the [tracked upstream-patched files](../../SYNC.md#upstream-files-weve-touched-expect-real-conflicts-here), inspect the diff — take the upstream changes AND re-apply our small delta.

## Stage 2 — Tag the Puru release

After the sync PR merges into `puru/vX.Y.Z`:

```bash
git checkout puru/vX.Y.Z
git pull
git tag puru-vX.Y.Z-p1                    # -p1 = first Puru patch for that upstream
git push origin puru-vX.Y.Z-p1
```

Patch numbering:
- `puru-v3.13.0-p1` — first release after syncing upstream v3.13.0
- `puru-v3.13.0-p2` — Puru-only fix on top (no upstream change)
- `puru-v3.13.1-p1` — after syncing upstream v3.13.1

Never re-use a tag. Never delete a tag from remote. If you need to yank a release, cut a new patch that reverts.

## Stage 3 — Cloud Build

The tag push automatically triggers Cloud Build (trigger regex `^puru/.*$` covers both branches and tags on `puru-*`).

**Verify:**

1. GCP Console → Cloud Build → History → most recent build should show the tag name.
2. Confirm three tags published:
   - `dviewer:latest` (mutable, auto-updated)
   - `dviewer:<sha>` (immutable, per-commit)
   - `dviewer:puru-vX.Y.Z-pN` (immutable, per-release)

Command-line verify:
```bash
gcloud artifacts docker images list \
  asia-south2-docker.pkg.dev/puru-255206/puru1/dviewer \
  --filter="tags~puru-vX.Y.Z-pN" --format="get(tags)"
```

If Cloud Build failed:
- Docker build error → check `cloudbuild.yaml` for syntax; the build shell script uses `$${VAR}` (double-dollar) escaping for Cloud Build.
- Yarn install error → usually a transitive lockfile mismatch after the sync; re-run `yarn install` locally, commit the updated `yarn.lock`, retag `-p2`.

## Stage 4 — On-prem deploy

Each hospital's `puru-nucleus` config pins the dviewer image tag. **Never pull `:latest` in production** — pin to a specific `puru-vX.Y.Z-pN`.

**Deploy checklist per hospital:**

1. Update the hospital's nucleus config to reference `dviewer:puru-vX.Y.Z-pN`.
2. Nucleus triggers a `docker pull` + container restart at the next apply.
3. Radiologist smoke test:
   - Open radiologist worklist → click a patient name → Mode 2 opens in new tab, Reports panel loads.
   - Open the same study via the study-detail slide-in → viewer tab (iframe) → Mode 1 loads with filmstrip.
   - About modal → shows "Puru DICOM Viewer" branding.

**If a rollback is needed:**
1. Point nucleus back to the previous `puru-vX.Y.Z-pN` tag.
2. `docker pull` + restart.
3. File a Puru-side hotfix on `puru/vX.Y.Z`, cut `-p(N+1)`.

## Emergency: skip a broken upstream release

If upstream ships a bad release (build breaks, data-loss regression), the sync PR from the Monday workflow just sits as a draft. Don't merge — skip that upstream tag and wait for the next.

Document the skip: add a note to `SYNC.md` under a "skipped upstream releases" section so the pattern doesn't get retried.

## Emergency: upstream v3 → v4 major bump

Not covered by the weekly sync (the workflow filters `v3.*`). When it happens:

1. Read the OHIF v4 changelog.
2. Cut a branch `sync/v4-preview` off `puru/v3.13.0` (or wherever we are).
3. Merge `v4.0.0` upstream — expect large conflicts especially in `pluginImports.js`, `Mode.tsx`, and `platform/ui-next`.
4. Verify:
   - `PuruStudyLauncher` still hooks into whatever the new mode-routing entry point is.
   - `WrappedPanelStudyBrowser` / `ViewerHeader` exports still exist (rename?).
   - `customizationService.setCustomization` API compatibility for `ohif.aboutModal`.
5. Rehearse all Puru features on the branch before cutting `puru/v4.0.0`.

## Release audit trail

Each release should leave behind:
- Git tag `puru-vX.Y.Z-pN` (immutable).
- Cloud Build history entry (retained per GCP retention policy).
- Merged PR with the sync commit + any smoke-test notes.
- Optional: entry in a `RELEASES.md` (not yet created — start one when the first sync happens).
