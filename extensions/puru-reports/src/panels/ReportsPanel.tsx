import React, { useEffect, useMemo, useState } from 'react';
import { useAppConfig } from '@state';
import { REPORT_STATUS, statusLabel, statusTone } from '../constants/reportStatus';
import { fetchReportsByStudyUID, resolvePacsBaseUrl } from '../api/reportsClient';

type Report = {
  id: number;
  name?: string;
  status?: string;
  text?: string;
  mode?: string;
  reportTime?: number | string;
};

type Props = {
  servicesManager: any;
};

function ReportsPanel({ servicesManager }: Props) {
  const [appConfig] = useAppConfig();
  const { displaySetService } = servicesManager.services;

  const [studyInstanceUID, setStudyInstanceUID] = useState<string | null>(null);
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  useEffect(() => {
    const readActiveUID = () => {
      const sets = displaySetService.getActiveDisplaySets?.() ?? [];
      const first = sets.find(s => s?.StudyInstanceUID);
      if (first?.StudyInstanceUID) setStudyInstanceUID(first.StudyInstanceUID);
    };

    readActiveUID();
    const { unsubscribe } = displaySetService.subscribe(
      displaySetService.EVENTS.DISPLAY_SETS_ADDED,
      readActiveUID
    );
    return () => unsubscribe();
  }, [displaySetService]);

  useEffect(() => {
    if (!studyInstanceUID) return;
    const controller = new AbortController();
    const baseUrl = resolvePacsBaseUrl(appConfig);
    setLoading(true);
    setError(null);
    fetchReportsByStudyUID(baseUrl, studyInstanceUID, controller.signal)
      .then(list => setReports(list))
      .catch(err => {
        if (err.name !== 'AbortError') setError(err.message || 'Failed to load reports');
      })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [studyInstanceUID, appConfig]);

  const selected = useMemo(
    () => reports.find(r => r.id === selectedId) || null,
    [reports, selectedId]
  );

  if (selected) {
    return (
      <div className="puru-reports flex h-full flex-col bg-black text-white">
        <div className="flex items-center gap-2 border-b border-neutral-800 px-3 py-2">
          <button
            className="rounded bg-neutral-800 px-2 py-1 text-xs hover:bg-neutral-700"
            onClick={() => setSelectedId(null)}
            type="button"
          >
            ← Back
          </button>
          <div className="truncate text-sm font-medium">{selected.name || 'Report'}</div>
        </div>
        <div
          className="flex-1 overflow-auto bg-white px-4 py-3 text-black"
          // Report HTML comes from puru-pacs write-document flow; sanitized on the write side.
          dangerouslySetInnerHTML={{ __html: selected.text || '<p>Report body is empty.</p>' }}
        />
      </div>
    );
  }

  return (
    <div className="puru-reports flex h-full flex-col bg-black text-white">
      <div className="border-b border-neutral-800 px-3 py-2 text-sm font-medium">Reports</div>
      <div className="flex-1 overflow-auto p-2">
        {loading && <div className="p-3 text-xs text-neutral-400">Loading reports…</div>}
        {error && <div className="p-3 text-xs text-red-400">{error}</div>}
        {!loading && !error && reports.length === 0 && (
          <div className="p-3 text-xs text-neutral-400">No reports for this study.</div>
        )}
        <ul className="space-y-1">
          {reports.map(report => {
            const status = report.status || 'UNKNOWN';
            const isApproved = status === REPORT_STATUS.APPROVED;
            const tone = statusTone(status);
            return (
              <li key={report.id}>
                <button
                  type="button"
                  disabled={!isApproved}
                  onClick={() => isApproved && setSelectedId(report.id)}
                  className={
                    'flex w-full flex-col items-start gap-1 rounded border px-3 py-2 text-left transition ' +
                    (isApproved
                      ? 'cursor-pointer border-neutral-700 bg-neutral-900 hover:border-primary hover:bg-neutral-800'
                      : 'cursor-not-allowed border-neutral-800 bg-neutral-900/60 opacity-70')
                  }
                >
                  <span className="truncate text-sm font-medium text-white">
                    {report.name || `Report ${report.id}`}
                  </span>
                  <span
                    className={
                      'rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ' +
                      toneClass(tone)
                    }
                  >
                    {statusLabel(status)}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

function toneClass(tone: string) {
  switch (tone) {
    case 'approved':
      return 'bg-emerald-700 text-white';
    case 'pending':
      return 'bg-amber-700 text-white';
    case 'arrived':
      return 'bg-sky-700 text-white';
    case 'rejected':
      return 'bg-red-700 text-white';
    default:
      return 'bg-neutral-700 text-neutral-200';
  }
}

export default ReportsPanel;
