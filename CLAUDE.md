# CLAUDE.md — OHIF-Viewer (Puru fork)

Fork of [OHIF Viewer v3.12](https://github.com/OHIF/Viewers) carrying
Puru-specific customizations. The upstream code is mostly untouched —
keep custom code in clearly-namespaced directories (`launcher/`,
`routes/PuruLanding/`) so future upstream merges stay manageable.

- **Working branch:** `puru/v3.12.0` (track this, not `master`)
- **Stack:** React, TypeScript, React Router 6, monorepo (yarn workspaces)
- **Dev server:** `yarn dev` (port 3000)

## Build / run

```bash
yarn install
yarn dev                        # dev server with HMR (localhost:3000)
yarn build                      # production build → platform/app/dist
```

## Where Puru code lives

| Path | What it is |
|------|------------|
| `platform/app/src/launcher/PuruStudyLauncher.tsx` | External-HIS deep-link translator: resolves `?accessionNumber=` / `?uhid=` via puru-pacs and either redirects to `?StudyInstanceUIDs=` or shows a study picker |
| `platform/app/src/routes/Mode/Mode.tsx` | Wrapped in an outer launcher gate; original Mode body extracted into `ModeRouteContent` so the launcher can short-circuit before data-source init |
| `platform/app/src/routes/PuruLanding/` | Custom landing page (renders instead of OHIF's default WorkList when `showStudyList=false`) |
| `platform/app/public/config/default.js` | Puru-tuned dataSources, hangingProtocols, modes |
| `platform/app/public/app-config.js` | Runtime config injected at index.html load time |
| `platform/app/public/puru-logo.svg` | Branding |

Anything outside these paths should still match upstream — if you find
yourself editing core OHIF code, prefer a `customizationService` config
or a new extension over a patch.

## PuruStudyLauncher — external HIS deep-link flow

```
External HIS                  OHIF                            puru-pacs
─────────────                 ────                            ─────────
/viewer?                                                      
  accessionNumber=O:64612 ──▶ usePuruLauncher() hook ─fetch─▶ GET /api/viewer-resolve/by-accession
  uhid=MRN-191004948                                          GET /api/viewer-resolve/by-uhid
  AccessionNumber=…  (alias)                                  (CORS allow-all)
  MRN=…              (alias)
                              ◀── { studies: [...] }
                              │
                              │  count = 0  → PuruLauncherNotFound (friendly 404 panel)
                              │  count = 1  → navigate('/viewer?StudyInstanceUIDs=<uid>', replace)
                              │  count > 1  → PuruStudyPicker (table: Date|Modality|Description|Accession)
                              │
                              ▼
                              Normal Mode renders the picked study
```

The launcher hook **only activates** when one of `accessionNumber|uhid|
AccessionNumber|MRN` is in the query string. For the existing
`/viewer?StudyInstanceUIDs=<uid>` URL it stays `idle` and the inner
`ModeRouteContent` renders unchanged.

### URL params

| Canonical | Accepted aliases |
|-----------|-------------------|
| `accessionNumber` | `AccessionNumber`, `accessionnumber` |
| `uhid` | `UHID`, `MRN`, `mrn` |

(MedNet's PDF spec uses `AccessionNumber` and `MRN`; both are silently
translated to the canonical Java-style forms before the backend call.)

### Backend resolution

The launcher hits puru-pacs at:
- Default: same hostname as the OHIF page on **port 8083**
  (e.g. `http://192.168.0.111:8083`)
- Override via `appConfig.puruPacsBaseUrl` in `public/config/default.js`

If both deployments sit behind one reverse proxy in prod, set
`puruPacsBaseUrl: ''` so requests stay same-origin.

## Rules-of-hooks gotcha

`Mode.tsx` originally had `useAppConfig` + ~10 other hooks before any
early return. The launcher refactor wraps it in an outer `ModeRoute` that
calls only `useAppConfig` + `usePuruLauncher`, then `switch`es on launcher
state to either return a status panel or render `ModeRouteContent`. **Do
not add hooks between `usePuruLauncher` and the `switch`** — keep the gate
shallow so React's hook-order rule is preserved across renders.

## Recent work in this session

- New `platform/app/src/launcher/PuruStudyLauncher.tsx` with hook +
  picker + status panels + spinner
- `Mode.tsx` restructured into `ModeRoute` (launcher gate) +
  `ModeRouteContent` (original Mode body)
- Backend resolver added in puru-pacs at `/api/viewer-resolve/{by-accession,by-uhid}`

## Open ends

- Smoke-tested via backend curl only; haven't actually clicked through
  the picker UI in a browser (would need `yarn dev` + a study in
  puru-pacs to deep-link).
- No tests added.
- The `puru/v3.12.0` branch carries other in-progress Puru changes
  (`cloudbuild.yaml`, `app-config.js`, `default.js`, `puru-logo.svg`,
  `routes/index.tsx`, `routes/PuruLanding/`) — they belong to separate
  workstreams and were intentionally not committed in this session.

## When upstream-merging

OHIF v3.x → v4.x or future minor bumps:
1. Merge upstream into a fresh branch off `puru/v3.12.0`
2. Verify the `useAppConfig` import in `Mode.tsx` still resolves (path
   may shift between upstream versions)
3. Verify `useLocation` / `useNavigate` from `react-router-dom` still
   work the same way (React Router has had v6 → v7 churn)
4. Re-run the launcher hook against the test data — if OHIF changed how
   `/viewer` mounts, the gate may need a different attach point