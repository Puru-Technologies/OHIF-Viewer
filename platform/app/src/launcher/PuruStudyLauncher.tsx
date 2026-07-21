/**
 * PuruStudyLauncher
 *
 * Lets external systems (HIS / billing portals) deep-link into OHIF without
 * knowing the DICOM-generated StudyInstanceUID. They pass identifiers they
 * actually have on hand. The externally-published URL contract is:
 *
 *   /viewer?StudyInstanceUIDs=<uid>
 *   /viewer?accessionNumber=O:64612
 *   /viewer?uhid=MRN-191004948
 *
 * These URLs already sit in third-party HIS deployments; the /viewer routeName
 * is claimed by @ohif/mode-puru-report (Mode 2 with the Reports panel), so
 * every one of them lands on the report-viewing layout automatically.
 *
 * "uhid" = external HIS Universal Health ID (e.g. MRN-191004948,
 * NWHB25-26-900065) — the same value the HL7 PID-3 carries and that lands on
 * Patient.patientID during HL7 ingestion. Pascal-case (`?AccessionNumber=`)
 * and the vendor-specific alias `?MRN=` are accepted for compatibility but
 * the camelCase forms above are the canonical URLs.
 *
 * The launcher hook queries puru-pacs's resolver
 * ({@code /api/viewer-resolve/by-accession} / {@code /by-uhid}) and:
 *
 *   - 1 study  → fetches the Weasis manifest via
 *                {@code /generatemanifestjson/<id>} and redirects to
 *                {@code /viewer/dicomjson?url=<manifest-url>}
 *   - N studies → renders a picker; user clicks one to open it (same manifest hop)
 *   - 0 studies → renders a friendly "not found" panel
 *
 * The hook short-circuits when none of the launcher params are present, so
 * the existing /viewer?StudyInstanceUIDs=... URL is unaffected.
 *
 * ## Why the manifest hop instead of just /viewer?StudyInstanceUIDs=<uid>?
 *
 * On-prem installs configure a single {@code dicomjson} data source (no
 * DICOMweb server exists inside a hospital LAN — DICOMweb only exists in the
 * cloud, at GCP Healthcare API). {@code dicomjson} needs an explicit
 * {@code ?url=<manifest>} to know what to fetch; a bare
 * {@code ?StudyInstanceUIDs=<uid>} would leave OHIF with nothing to look up
 * and it would render its "One or more of the requested studies are not
 * available at this time." error. The manifest URL is the same one hydrogen
 * builds ({@code dicom-viewer-splash.component.ts}) and matches how puru-pacs
 * serves DICOM to Weasis and to the launcher-agnostic hydrogen flow.
 */
import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

type StudyRow = {
  /**
   * puru-pacs internal Study primary key (Long). Required to fetch the
   * Weasis manifest via /generatemanifestjson/{id}. Older backends that
   * predate this contract may omit it — the launcher falls back to an error
   * panel in that case rather than opening an unresolvable UID URL.
   */
  id?: number;
  studyInstanceUID: string;
  accessionNumber: string | null;
  modality: string | null;
  /** Jackson serializes {@code java.util.Date} as epoch millis by default; ISO strings are accepted too. */
  studyDateTime: number | string | null;
  description: string | null;
  totalImages?: number;
  patientName?: string | null;
  patientID?: string | null;
};

type LauncherKey = 'accessionNumber' | 'uhid';

type LauncherState =
  | { status: 'idle' }
  | { status: 'resolving'; key: LauncherKey; value: string }
  | { status: 'redirecting'; uid: string }
  | { status: 'picker'; key: LauncherKey; value: string; studies: StudyRow[] }
  | { status: 'not-found'; key: LauncherKey; value: string }
  | { status: 'error'; key: LauncherKey; value: string; message: string };

// Canonical camelCase form is listed first; Pascal-case (vendor PDF spec) and
// the vendor-specific alias "MRN" are accepted for compatibility.
const ACC_KEYS = ['accessionNumber', 'AccessionNumber', 'accessionnumber'];
const UHID_KEYS = ['uhid', 'UHID', 'MRN', 'mrn'];

function readLauncherParam(search: URLSearchParams): { key: LauncherKey; value: string } | null {
  for (const k of ACC_KEYS) {
    const v = search.get(k);
    if (v) return { key: 'accessionNumber', value: v };
  }
  for (const k of UHID_KEYS) {
    const v = search.get(k);
    if (v) return { key: 'uhid', value: v };
  }
  return null;
}

/**
 * Resolve the puru-pacs base URL.
 *   1. {@code appConfig.puruPacsBaseUrl} if set in OHIF config
 *   2. Same hostname as the OHIF page, port 8083 (puru-pacs default)
 */
function resolvePacsBaseUrl(appConfig: any): string {
  if (appConfig?.puruPacsBaseUrl) return String(appConfig.puruPacsBaseUrl).replace(/\/$/, '');
  if (typeof window === 'undefined') return 'http://localhost:8083';
  return `${window.location.protocol}//${window.location.hostname}:8083`;
}

/**
 * Resolve the manifest file-server port. Hydrogen's dicom-viewer-splash uses
 * the environment's {@code serverPortFileExplorer} (port 81 in every hospital
 * we've deployed to). We follow the same convention here so the manifest URLs
 * this launcher generates are byte-for-byte identical to hydrogen's.
 */
function resolveFileServerPort(appConfig: any): number {
  if (typeof appConfig?.puruFileServerPort === 'number') return appConfig.puruFileServerPort;
  const parsed = Number(appConfig?.puruFileServerPort);
  if (!Number.isNaN(parsed) && parsed > 0) return parsed;
  return 81;
}

/**
 * Fetch the manifest filename from puru-pacs and assemble the file-server URL
 * OHIF's dicomjson data source will load. Mirrors
 * {@code dicom-viewer-splash.component.ts:fetchManifest} on the hydrogen side.
 */
async function fetchManifestUrl(
  pacsBaseUrl: string,
  studyDbId: number,
  fileServerPort: number
): Promise<string> {
  const resp = await fetch(`${pacsBaseUrl}/generatemanifestjson/${studyDbId}`, {
    credentials: 'omit',
    headers: { Accept: 'application/json' },
  });
  if (!resp.ok) throw new Error(`generatemanifestjson returned HTTP ${resp.status}`);
  const body = await resp.json();
  if (!body?.b || !body?.s) throw new Error('Manifest generation failed');

  // Same-hostname; only the port differs (viewer :3000 → file server :81).
  const host = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
  const protocol = typeof window !== 'undefined' ? window.location.protocol : 'http:';
  return `${protocol}//${host}:${fileServerPort}/manifest/${body.s}`;
}

function buildViewerUrl(manifestUrl: string): string {
  return `/viewer/dicomjson?url=${encodeURIComponent(manifestUrl)}`;
}

export function usePuruLauncher(appConfig: any): LauncherState {
  const location = useLocation();
  const navigate = useNavigate();
  const [state, setState] = useState<LauncherState>({ status: 'idle' });

  const launcherParam = useMemo(
    () => readLauncherParam(new URLSearchParams(location.search)),
    [location.search]
  );

  useEffect(() => {
    if (!launcherParam) {
      if (state.status !== 'idle') setState({ status: 'idle' });
      return;
    }

    const baseUrl = resolvePacsBaseUrl(appConfig);
    const fileServerPort = resolveFileServerPort(appConfig);
    const url =
      launcherParam.key === 'accessionNumber'
        ? `${baseUrl}/api/viewer-resolve/by-accession?accessionNumber=${encodeURIComponent(launcherParam.value)}`
        : `${baseUrl}/api/viewer-resolve/by-uhid?uhid=${encodeURIComponent(launcherParam.value)}`;

    let cancelled = false;
    setState({ status: 'resolving', key: launcherParam.key, value: launcherParam.value });

    fetch(url, { credentials: 'omit', headers: { Accept: 'application/json' } })
      .then(async r => {
        if (!r.ok) throw new Error(`puru-pacs returned HTTP ${r.status}`);
        return r.json();
      })
      .then(async data => {
        if (cancelled) return;
        const studies: StudyRow[] = data?.studies ?? [];
        if (studies.length === 0) {
          setState({ status: 'not-found', key: launcherParam.key, value: launcherParam.value });
          return;
        }
        if (studies.length === 1) {
          const s = studies[0];
          if (typeof s.id !== 'number') {
            throw new Error(
              'puru-pacs resolver did not return a numeric study id; upgrade puru-pacs to enable the OHIF launcher.'
            );
          }
          setState({ status: 'redirecting', uid: s.studyInstanceUID });
          const manifestUrl = await fetchManifestUrl(baseUrl, s.id, fileServerPort);
          if (cancelled) return;
          // Replace the URL — browser doesn't push a back-stack entry for the launcher hop.
          // /viewer routeName is claimed by mode-puru-report, so this lands in Mode 2
          // with the Reports panel already visible next to the study.
          navigate(buildViewerUrl(manifestUrl), { replace: true });
          return;
        }
        setState({
          status: 'picker',
          key: launcherParam.key,
          value: launcherParam.value,
          studies,
        });
      })
      .catch(err => {
        if (cancelled) return;
        setState({
          status: 'error',
          key: launcherParam.key,
          value: launcherParam.value,
          message: err?.message ?? 'Unknown error',
        });
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [launcherParam?.key, launcherParam?.value]);

  return state;
}

/**
 * Shared click-handler for the picker — resolves the manifest URL for the
 * clicked study and navigates. Exposed as a hook-free helper so the picker
 * component can call it directly from an onClick.
 */
async function openStudyViaManifest(
  study: StudyRow,
  appConfig: any,
  navigate: ReturnType<typeof useNavigate>,
  onError: (msg: string) => void
) {
  try {
    if (typeof study.id !== 'number') {
      throw new Error('Study row missing numeric id — cannot fetch manifest.');
    }
    const baseUrl = resolvePacsBaseUrl(appConfig);
    const fileServerPort = resolveFileServerPort(appConfig);
    const manifestUrl = await fetchManifestUrl(baseUrl, study.id, fileServerPort);
    navigate(buildViewerUrl(manifestUrl), { replace: true });
  } catch (err: any) {
    onError(err?.message ?? 'Failed to open study');
  }
}

/**
 * Inline picker UI shown when the resolver returns more than one study.
 * Compact 4-column table per the agreed spec: date, modality, description, accession.
 */
export function PuruStudyPicker({
  state,
  appConfig,
}: {
  state: Extract<LauncherState, { status: 'picker' }>;
  appConfig: any;
}) {
  const navigate = useNavigate();
  const [openError, setOpenError] = useState<string | null>(null);

  return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        <div style={headerStyle}>
          <div style={{ fontSize: 18, fontWeight: 600 }}>Multiple studies found</div>
          <div style={{ fontSize: 13, color: '#94a3b8', marginTop: 4 }}>
            {state.key} <code style={codeStyle}>{state.value}</code> matched {state.studies.length} studies. Click one to open.
          </div>
        </div>
        {openError && (
          <div style={pickerErrorStyle}>{openError}</div>
        )}
        <table style={tableStyle}>
          <thead>
            <tr style={theadRowStyle}>
              <th style={thStyle}>Date</th>
              <th style={thStyle}>Modality</th>
              <th style={thStyle}>Description</th>
              <th style={thStyle}>Accession</th>
            </tr>
          </thead>
          <tbody>
            {state.studies.map(s => (
              <tr
                key={s.studyInstanceUID}
                style={trStyle}
                onClick={() => openStudyViaManifest(s, appConfig, navigate, setOpenError)}
                onMouseEnter={e => (e.currentTarget.style.background = '#1f2937')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <td style={tdStyle}>{formatDateTime(s.studyDateTime)}</td>
                <td style={tdStyle}>
                  <span style={modalityChipStyle}>{s.modality ?? '—'}</span>
                </td>
                <td style={tdStyle}>{s.description ?? '—'}</td>
                <td style={tdStyle}>
                  <code style={codeStyle}>{s.accessionNumber ?? '—'}</code>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function PuruLauncherNotFound({
  state,
}: {
  state: Extract<LauncherState, { status: 'not-found' }>;
}) {
  return (
    <div style={containerStyle}>
      <div style={{ ...cardStyle, textAlign: 'center', maxWidth: 480 }}>
        <div style={{ fontSize: 18, fontWeight: 600 }}>Study not found</div>
        <div style={{ fontSize: 13, color: '#94a3b8', marginTop: 8 }}>
          No study matched <strong>{state.key}</strong> <code style={codeStyle}>{state.value}</code>.
        </div>
      </div>
    </div>
  );
}

export function PuruLauncherError({
  state,
}: {
  state: Extract<LauncherState, { status: 'error' }>;
}) {
  return (
    <div style={containerStyle}>
      <div style={{ ...cardStyle, textAlign: 'center', maxWidth: 520 }}>
        <div style={{ fontSize: 18, fontWeight: 600, color: '#fca5a5' }}>Could not reach PACS</div>
        <div style={{ fontSize: 13, color: '#94a3b8', marginTop: 8 }}>
          Failed to resolve <strong>{state.key}</strong> <code style={codeStyle}>{state.value}</code>.
        </div>
        <div style={{ fontSize: 12, color: '#64748b', marginTop: 8 }}>{state.message}</div>
      </div>
    </div>
  );
}

export function PuruLauncherSpinner() {
  return (
    <div style={containerStyle}>
      <style>{`@keyframes puru-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      <div style={{ ...cardStyle, textAlign: 'center', maxWidth: 320 }}>
        <div style={spinnerStyle} />
        <div style={{ fontSize: 13, color: '#94a3b8', marginTop: 12 }}>Looking up study…</div>
      </div>
    </div>
  );
}

function formatDateTime(s: number | string | null): string {
  if (s === null || s === undefined || s === '') return '—';
  const d = new Date(s as any);
  if (isNaN(d.getTime())) return String(s);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

const containerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: '100vh',
  background: '#0b1220',
  color: '#e2e8f0',
  fontFamily: 'system-ui, -apple-system, "Segoe UI", sans-serif',
  padding: 24,
};
const cardStyle: React.CSSProperties = {
  background: '#111827',
  border: '1px solid #1f2937',
  borderRadius: 8,
  padding: 24,
  width: '100%',
  maxWidth: 880,
};
const headerStyle: React.CSSProperties = {
  paddingBottom: 16,
  borderBottom: '1px solid #1f2937',
  marginBottom: 12,
};
const tableStyle: React.CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
  fontSize: 13,
};
const theadRowStyle: React.CSSProperties = {
  borderBottom: '1px solid #1f2937',
  textAlign: 'left',
};
const thStyle: React.CSSProperties = {
  padding: '10px 12px',
  fontSize: 11,
  fontWeight: 600,
  color: '#94a3b8',
  letterSpacing: 0.6,
  textTransform: 'uppercase',
};
const trStyle: React.CSSProperties = {
  borderBottom: '1px solid #1f2937',
  cursor: 'pointer',
  transition: 'background 0.12s',
};
const tdStyle: React.CSSProperties = {
  padding: '12px',
  color: '#e2e8f0',
};
const modalityChipStyle: React.CSSProperties = {
  display: 'inline-block',
  padding: '2px 8px',
  borderRadius: 4,
  background: '#1f2937',
  color: '#f59e0b',
  fontWeight: 600,
  fontSize: 11,
};
const codeStyle: React.CSSProperties = {
  fontFamily: '"JetBrains Mono", "Fira Code", monospace',
  background: '#0f172a',
  padding: '2px 6px',
  borderRadius: 3,
  color: '#cbd5e1',
  fontSize: 12,
};
const pickerErrorStyle: React.CSSProperties = {
  margin: '4px 0 12px',
  padding: '10px 12px',
  background: '#3f1d1d',
  border: '1px solid #7f1d1d',
  borderRadius: 6,
  color: '#fca5a5',
  fontSize: 12,
};
const spinnerStyle: React.CSSProperties = {
  width: 28,
  height: 28,
  margin: '0 auto',
  border: '3px solid #1f2937',
  borderTopColor: '#f59e0b',
  borderRadius: '50%',
  animation: 'puru-spin 0.9s linear infinite',
};
