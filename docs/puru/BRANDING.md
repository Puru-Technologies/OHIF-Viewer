# Puru fork — Branding

**Rule**: prefer `customizationService` overrides over patching upstream strings. Overrides survive syncs; patches conflict every time.

## Color palette

Puru anchors are **deep steel-blue, near-monochrome** — chroma kept deliberately low so DICOM images own the eye:

| Token | Hex | HSL | Where |
|---|---|---|---|
| `primary` (steel) | `#475569` | `215 19% 35%` | Filled buttons, primary chrome |
| `highlight` / `ring` (sky) | `#7DD3FC` | `199 95% 74%` | Focus rings, hover accents, LABS dot |
| `primary.main` (slate) | `#334155` | `215 25% 27%` | Header band, deeper primary |
| `bkg.low` (near-black slate) | `#0c111b` | `219 39% 8%` | App background |
| `bkg.med` | `#111826` | `220 39% 11%` | Card / panel backgrounds |
| `accent` (slate) | `#1E293B` | `217 33% 17%` | Selected state, active borders |
| `actions.hover` | `rgba(125,211,252,.15)` | — | Subtle sky glow on hover |
| PWA `theme_color` | `#334155` | — | OS titlebar / mobile browser bar |

Reference values live in **two patched files** (see [`SYNC.md`](../../SYNC.md) watch list):
- `platform/ui-next/src/tailwind.css` — CSS variables (`:root` + `.dark`) — consumed by shadcn-style components.
- `platform/ui/tailwind.config.js` — static Tailwind palette — consumed by legacy `bg-primary-main` / `text-actions-primary` class names.
- `platform/ui-next/tailwind.config.js` — `actions` + `bkg` blocks mirror the ui config.

The manifest.json `theme_color` is `#334155` — the OS-level PWA install color renders deep slate.

### Post-sync theme verification

Open the viewer and check:
- [ ] Header bottom border — muted slate, not saturated blue/cyan/emerald.
- [ ] Focus ring on inputs / buttons — sky `#7DD3FC` (this is the single accent).
- [ ] Primary buttons — filled slate `#475569`, muted.
- [ ] Sliders / toggles — slate track, sky handle when focused.
- [ ] Selected series thumbnail border — sky accent.
- [ ] Logo — grey ring, sky dot, white PURU, slate LABS. Near-monochrome.

If an upstream sync introduces a new hardcoded saturated color (`#348CFD`, `#0944b3`, `#20a5d6`, `#10B981`), grep for the hex and either patch to `primary`/`actions.primary` or replace the hardcoded value with a class reference.


## Surface map (13 places OHIF branding shows through)

| # | Surface | Puru approach | Location |
|---|---|---|---|
| 1 | `<title>` on main HTML | Direct edit | `platform/app/public/html-templates/index.html` |
| 2 | `<title>` on demo HTML | Direct edit | `platform/app/public/html-templates/rollbar.html` |
| 3 | PWA manifest name / description | Direct edit | `platform/app/public/manifest.json` |
| 4 | Meta tags (application-name, apple-mobile-web-app-title) | Direct edit | Same two HTML templates |
| 5 | Header logo | Config override | `platform/app/public/config/default.js` → `whiteLabeling.createLogoComponentFn` returns `<img src="/puru-logo.svg">` |
| 6 | About modal body | **Customization override** | `extensions/puru-branding/src/PuruAboutModal.tsx` — replaces `ohif.aboutModal` customization key |
| 7 | About modal title (i18n) | i18n edit | `platform/i18n/src/locales/en-US/AboutModal.json` — "About OHIF Viewer" → "About Puru DICOM Viewer" |
| 8 | Investigational Use dialog text | Config disable | `platform/app/public/config/default.js` → `investigationalUseDialog: { option: 'never' }` — dialog never renders, so its hardcoded OHIF text never shows |
| 9 | Error boundary "Report Issue" link | **Config-driven URL** | `platform/ui-next/src/components/Errorboundary/ErrorBoundary.tsx` reads `window.config.reportIssueUrl`, falls back to `mailto:support@purulabs.com` |
| 10 | Package description (OS titlebar / PWA install) | Direct edit | `platform/app/package.json` `"description"` |
| 11 | Favicon + PWA icons | ⚠️ Not yet swapped | `platform/app/public/assets/*.png`, `*.ico` — need Puru-branded PNG/ICO set at every size (36–512px) |
| 12 | Onboarding tours | Config override | `platform/app/public/config/default.js` → `customizationService.getCustomization('ohif.tours')` — currently upstream default |
| 13 | Non-en locales | Left as-is | Puru only loads en-US, so other locales' OHIF text never renders |

## The `ohif.aboutModal` override

Upstream registers this customization at `extensions/default/src/customizations/aboutModalCustomization.tsx`. It exports:

```js
{ 'ohif.aboutModal': AboutModalDefault }
```

We register a later customization module (`extensions/puru-branding/src/getCustomizationModule.tsx`) that spreads onto the same `default` bundle:

```js
{ name: 'default', value: { 'ohif.aboutModal': PuruAboutModal } }
```

Because `pluginImports.js` pushes `@ohif/extension-puru-branding` **after** `@ohif/extension-default`, our value wins. If a future sync flips the load order, the About modal will regress to OHIF's — verify by opening the About modal after every sync.

## Adding a new branding override

1. Find the customization key in `extensions/default/src/customizations/`. Each file registers `{ 'ohif.xxx': DefaultComponent }`.
2. Add a Puru version to `extensions/puru-branding/src/`.
3. Register it in that extension's `getCustomizationModule.tsx` under the `default` bundle.
4. Verify at runtime (customizationService merges asynchronously; if your override doesn't apply, check load order in `pluginImports.js`).

## Icons / PWA assets — outstanding

The PNG icon set in `platform/app/public/assets/` is still OHIF-designed (blue circle + magnifying glass motif). Filenames are referenced by `manifest.json` and every `<link rel="icon">` in the HTML templates, so **do not rename**. Replace the pixel content with Puru-branded variants at the same sizes (36, 48, 72, 96, 144, 192, 256, 384, 512 for android-chrome; 57, 60, 72, 76, 114, 120, 144, 152, 180 for apple-touch; 70, 144, 150, 310 for mstile; plus `favicon.ico`).

Once new assets exist, drop them into `platform/app/public/assets/` with identical names. No code changes required.

## Verification checklist after a sync

After every upstream merge, open a study and check:

- [ ] Browser tab title — "Puru DICOM Viewer"
- [ ] Header logo — puru-logo.svg (not OHIF logo)
- [ ] About modal — "Puru DICOM Viewer" as product name, no `github.com/OHIF/Viewers` link
- [ ] Error boundary → click "Report Issue" — opens `mailto:support@purulabs.com` (or configured URL), not the OHIF GitHub form
- [ ] No new hardcoded "OHIF" text visible anywhere

If any of these regressed, the upstream sync introduced a new branding surface. Add it to this doc and either override via customization or patch (and add to `SYNC.md`'s watch list).
