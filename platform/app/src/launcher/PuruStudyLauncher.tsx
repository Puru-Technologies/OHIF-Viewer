/**
 * PuruStudyLauncher
 *
 * Lets external systems (HIS / billing portals) deep-link into OHIF without
 * knowing the DICOM-generated StudyInstanceUID. They pass identifiers they
 * actually have on hand:
 *
 *   /viewer?accessionNumber=O:64612
 *   /viewer?uhid=MRN-191004948
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
 *   - 1 study  → replaces the URL with /viewer?StudyInstanceUIDs=<uid> (browser navigates)
 *   - N studies → renders a picker; user clicks one to open it
 *   - 0 studies → renders a friendly "not found" panel
 *
 * The hook short-circuits when none of the launcher params are present, so
 * the existing /viewer?StudyInstanceUIDs=... URL is unaffected.
 */
import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

type StudyRow = {
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
      .then(data => {
        if (cancelled) return;
        const studies: StudyRow[] = data?.studies ?? [];
        if (studies.length === 0) {
          setState({ status: 'not-found', key: launcherParam.key, value: launcherParam.value });
          return;
        }
        if (studies.length === 1) {
          const uid = studies[0].studyInstanceUID;
          setState({ status: 'redirecting', uid });
          // Replace the URL — browser doesn't push a back-stack entry for the launcher hop.
          navigate(`/viewer?StudyInstanceUIDs=${encodeURIComponent(uid)}`, { replace: true });
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
 * Inline picker UI shown when the resolver returns more than one study.
 * Compact 4-column table per the agreed spec: date, modality, description, accession.
 */
export function PuruStudyPicker({
  state,
}: {
  state: Extract<LauncherState, { status: 'picker' }>;
}) {
  const navigate = useNavigate();

  return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        <div style={headerStyle}>
          <div style={{ fontSize: 18, fontWeight: 600 }}>Multiple studies found</div>
          <div style={{ fontSize: 13, color: '#94a3b8', marginTop: 4 }}>
            {state.key} <code style={codeStyle}>{state.value}</code> matched {state.studies.length} studies. Click one to open.
          </div>
        </div>
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
                onClick={() =>
                  navigate(`/viewer?StudyInstanceUIDs=${encodeURIComponent(s.studyInstanceUID)}`, { replace: true })
                }
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
const spinnerStyle: React.CSSProperties = {
  width: 28,
  height: 28,
  margin: '0 auto',
  border: '3px solid #1f2937',
  borderTopColor: '#f59e0b',
  borderRadius: '50%',
  animation: 'puru-spin 0.9s linear infinite',
};
