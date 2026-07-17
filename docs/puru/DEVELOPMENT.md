# Puru fork — Development guide

Everything you need for day-to-day work: adding features, following conventions that keep upstream syncs cheap, common pitfalls.

## Rule #1 — Stay in Puru-owned paths

Every Puru feature should live under one of:

- `extensions/puru-*/` — for reusable OHIF pieces (panels, layouts, customizations)
- `modes/puru-*/` — for a new viewer mode / routeName
- `platform/app/src/launcher/` — external HIS deep-link resolvers
- `platform/app/src/routes/PuruLanding/` — landing pages
- `platform/app/public/config/default.js` — runtime config, hanging protocols, feature flags
- `platform/app/public/manifest.json`, `puru-logo.svg`, `app-config.js` — branding + PWA

**If your feature can't be built within those paths**, that's a signal:
1. First try `customizationService.setCustomization('key', value)` in a Puru extension. OHIF exposes ~30 customization keys — see `extensions/default/src/customizations/`.
2. If no customization key exists, upstream a request or PR — OHIF's team is receptive.
3. Only patch upstream files as a last resort. Add the file to the "Upstream files we've patched" section in [`SYNC.md`](../../SYNC.md) so the next sync knows to preserve it.

## Setup

```bash
git clone <fork-url>
cd OHIF-Viewer
git checkout puru/v3.12.0
git remote add upstream https://github.com/OHIF/Viewers.git   # once
yarn install
yarn dev                                                       # http://localhost:3000
```

When you add a new workspace package under `extensions/*` or `modes/*`, re-run `yarn install` — yarn workspaces only rescans on install, and webpack will fail with `Can't resolve '@ohif/mode-xxx'` until then.

## Anatomy of the two Puru modes

Both modes were built to a single principle: **the calling app picks the mode by URL, not the user**.

Three entry points route into Mode 2 (`puru-report`, claims routeName `/viewer`) today:

1. **Hydrogen worklist name-click** → `window.open('/viewer/dicomjson?url=<manifest>')` (see `open-study.service.ts`)
2. **External HIS deep-link** → `/viewer?accessionNumber=X` or `?uhid=X` or `?StudyInstanceUIDs=X` → PuruStudyLauncher resolves via puru-pacs → normalizes to `/viewer?StudyInstanceUIDs=<uid>`
3. **Any bookmark** — `/viewer?StudyInstanceUIDs=<uid>` (direct UID URL) gets Mode 2 with the Reports panel

**Why `/viewer` and not `/puru-report`**: external HIS deployments already have `/viewer?...` baked into their URL generators. Changing that URL is a breaking change for third parties. Instead, we claim OHIF's `/viewer` routeName for puru-report and skip registering upstream mode-longitudinal. See `platform/app/src/pluginImports.js`.

And one into Mode 1 (`puru-quick`):

1. **Hydrogen study-detail slide-in iframe** → `/puru-quick/dicomjson?url=<manifest>` (see `study-detail-panel.component.ts`)

### `puru-report` mode (full window)

```
puru-hydrogen worklist name click
    ↓ (open-study.service.ts:166)
window.open('http://<ip>:3000/puru-report/dicomjson?url=<manifest>', '_blank')
    ↓
OHIF loads mode-puru-report
    ↓
Default layout + right ReportsPanel
    ↓
ReportsPanel reads StudyInstanceUID from DisplaySetService
    ↓
GET http://<pacs>:8083/report/by-study-uid/<uid>
    ↓
Tiles with status chip. Click APPROVED → HTML renders in-panel
```

**Files:**
- `modes/puru-report/src/index.tsx` — mode definition (uses default layout, right panel = reportsPanel)
- `extensions/puru-reports/src/panels/ReportsPanel.tsx` — the panel itself
- `extensions/puru-reports/src/api/reportsClient.js` — HTTP wrapper
- `puru-pacs`: `StudyReportController.getReportsByStudyInstanceUID` at `/report/by-study-uid/{studyInstanceUID}`

### `puru-quick` mode (compact / slide-in)

```
puru-hydrogen study-detail slide-in panel → viewer tab
    ↓ (study-detail-panel.component.ts:~1263)
<iframe src="http://<ip>:3000/puru-quick/dicomjson?url=<manifest>">
    ↓
OHIF loads mode-puru-quick
    ↓
Custom PuruQuickLayout (horizontal filmstrip on top, no side rails)
    ↓
CompactSeriesList (wraps default WrappedPanelStudyBrowser)
```

**Files:**
- `modes/puru-quick/src/index.tsx` — mode definition (custom layout, left panel = compactSeriesList)
- `extensions/puru-reports/src/layouts/PuruQuickLayout.tsx` — the horizontal-strip layout
- `extensions/puru-reports/src/panels/CompactSeriesList.tsx` — wraps default StudyBrowser
- `extensions/puru-reports/src/getLayoutTemplateModule.tsx` — registers the layout

Both modes reuse `@ohif/mode-basic`'s toolbar, sopClassHandlers, and lifecycle hooks — imported as named exports at the top of each mode's `index.tsx`. Never fork the toolbar unless you have to.

## Adding a new mode (recipe)

1. Copy `modes/puru-quick/` to `modes/puru-yourthing/`.
2. Update `package.json` name → `@ohif/mode-puru-yourthing`.
3. Update `src/id.js` (imports package.json for the id constant).
4. Update `src/index.tsx`:
   - Change `routeName` and `path`.
   - Swap the layout `id` if you want a different one, or add `leftPanels` / `rightPanels` references.
5. Register in `platform/app/src/pluginImports.js`:
   ```js
   modes.push("@ohif/mode-puru-yourthing");
   // ...
   if (module === "@ohif/mode-puru-yourthing") {
     const imported = await import("@ohif/mode-puru-yourthing");
     return imported.default;
   }
   ```
6. `yarn install` (yarn workspaces will link it).
7. Visit `http://localhost:3000/puru-yourthing/dicomjson?url=...`.

## Adding a new panel or layout

1. Add the component under `extensions/puru-reports/src/panels/` or `.../layouts/`.
2. Export it from `getPanelModule.tsx` or `getLayoutTemplateModule.tsx`:
   ```js
   {
     name: 'yourPanel',
     iconName: 'tab-studies',
     iconLabel: 'Your',
     label: 'Your Panel',
     component: props => <YourPanel {...props} servicesManager={servicesManager} />,
   }
   ```
3. Reference it from a mode's `basicLayout.props.leftPanels`/`rightPanels`:
   ```js
   rightPanels: ['@ohif/extension-puru-reports.panelModule.yourPanel'],
   ```
4. If your panel needs data from puru-pacs, add a client to `extensions/puru-reports/src/api/` following the `reportsClient.js` pattern (fetch + AbortController + resolvePacsBaseUrl).
5. If your panel needs to react to the loaded study, subscribe to `displaySetService.EVENTS.DISPLAY_SETS_ADDED` (see `ReportsPanel.tsx`).

## Adding a branding tweak

Prefer overrides over patches.

- **About modal, product name, links** → `extensions/puru-branding/` — extend `PuruAboutModal.tsx` or add new customization keys.
- **Header text, tooltips, translations** → `platform/i18n/src/locales/en-US/*.json` (only en-US is loaded).
- **PWA / titlebar** → `platform/app/public/manifest.json` + `html-templates/index.html`.
- **Anything else that requires patching upstream** → add it to [`SYNC.md`](../../SYNC.md)'s watch list.

See [`BRANDING.md`](./BRANDING.md) for the full surface list.

## Consuming default extension internals

The Puru extensions consume two symbols from `@ohif/extension-default` that upstream doesn't export publicly:

- `WrappedPanelStudyBrowser` — used by `CompactSeriesList`
- `ViewerHeader` — used by `PuruQuickLayout`

We patched `extensions/default/src/index.ts` to add them to the exports. This is a tracked upstream-patched file (see [`SYNC.md`](../../SYNC.md)). During syncs, if the file conflicts, re-apply the two-line export addition.

Alternative if we ever lose that patch: deep-import the source path (`import from '@ohif/extension-default/src/Panels/WrappedPanelStudyBrowser'`). Works in yarn workspaces but breaks if OHIF ever adds an `exports` field to their package.json.

## PR checklist

Before merging a feature PR into `puru/vX.Y.Z`:

- [ ] All new files under a Puru-owned path?
- [ ] If not, upstream files patched are listed in [`SYNC.md`](../../SYNC.md)?
- [ ] `yarn install && yarn dev` boots without errors?
- [ ] Both modes (`/puru-quick`, `/puru-report`) still load with a sample study?
- [ ] Custom hydrogen URL patterns still work (test with a real puru-pacs manifest)?
- [ ] No new hardcoded OHIF branding introduced?
- [ ] If a new upstream file was patched, added to [`SYNC.md`](../../SYNC.md)?

## Common pitfalls

**"Can't resolve `@ohif/mode-xxx`"** — yarn workspaces hasn't rescanned. Run `yarn install`.

**"Hook order changed"** — the `PuruStudyLauncher` gate in `Mode.tsx` is very sensitive; adding hooks between `useAppConfig()` and the `switch` breaks React's hook-order rule. See `CLAUDE.md`'s "Rules-of-hooks gotcha" section.

**Panel doesn't mount** — check the mode's `basicLayout.props.leftPanels`/`rightPanels` references the panel's full namespace (`@ohif/extension-puru-reports.panelModule.foo`, not just `foo`).

**Panel mounts but no data** — the extension needs to be in the mode's `extensionDependencies`. Both puru modes already list `'@ohif/extension-puru-reports': '^0.0.1'`.

**Customization override doesn't apply** — the puru extension needs to load *after* the default extension. Verify order in `pluginImports.js` (`extensions.push` order).

**Report HTML doesn't render** — hitting puru-pacs? `curl http://<pacs>:8083/report/by-study-uid/<uid>` should return a list. If the `text` field is empty, the report may be a `docx_file`/`doc_file` mode — currently we only render `html_file`. To support Word/PDF, extend `ReportsPanel` to show a download link for those modes.

**Report shows "Send to radiologist" for a report that's approved** — check the raw JSON status value. Enum names match `PuruPacsConstant.DICOMReportStatus` exactly — `APPROVED`, `WAITING`, `IN_PROGRESS`, `ARRIVED`, `PARTIALLY_ARRIVED`, `REJECTED`, `NOT_APPLICABLE`, `NOT_REQUIRED`. Case-sensitive.

## Related repos in the feature loop

- **puru-pacs** — `StudyReportController` owns `/report/by-study-uid/{uid}`. Study/Report entities. Report body storage.
- **puru-hydrogen** — `open-study.service.ts` (Mode 2 window.open) and `study-detail-panel.component.ts` (Mode 1 iframe URL). If either URL scheme changes, both modes must be updated in lockstep.
- **puru-nucleus** — orchestrates the dviewer Docker container per hospital. Pin the image tag here (see [`RELEASE.md`](./RELEASE.md)).
