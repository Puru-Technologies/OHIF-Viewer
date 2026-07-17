import React, { useEffect, useState } from 'react';
import { useAppConfig } from '@state';
import { REPORT_STATUS, statusLabel, statusTone } from '../constants/reportStatus';
import { fetchReportsByStudyUID, resolvePacsBaseUrl } from '../api/reportsClient';
import ReportViewerOverlay from './ReportViewerOverlay';

type Report = {
  id: number;
  name?: string;
  status?: string;
  text?: string;
};

type Props = {
  servicesManager: any;
};

function CompactReportsList({ servicesManager }: Props) {
  const [appConfig] = useAppConfig();
  const { displaySetService } = servicesManager.services;

  const [studyInstanceUID, setStudyInstanceUID] = useState<string | null>(null);
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [openReport, setOpenReport] = useState<Report | null>(null);

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

  return (
    <div className="puru-compact-reports flex h-full flex-col bg-black text-white">
      <div className="flex items-center justify-between border-b border-neutral-800 px-3 py-2">
        <div className="text-xs font-semibold uppercase tracking-wide text-neutral-400">Reports</div>
        {reports.length > 0 && (
          <div className="text-[10px] text-neutral-500">{reports.length}</div>
        )}
      </div>
      <div className="flex-1 overflow-auto p-2">
        {loading && <div className="p-2 text-xs text-neutral-400">Loading…</div>}
        {error && <div className="p-2 text-xs text-red-400">{error}</div>}
        {!loading && !error && reports.length === 0 && (
          <div className="p-2 text-xs text-neutral-500">No reports yet.</div>
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
                  onClick={() => isApproved && setOpenReport(report)}
                  className={
                    'flex w-full items-center gap-2 rounded border px-2 py-1.5 text-left transition ' +
                    (isApproved
                      ? 'cursor-pointer border-neutral-700 bg-neutral-900 hover:border-primary hover:bg-neutral-800'
                      : 'cursor-not-allowed border-neutral-800 bg-neutral-900/60 opacity-70')
                  }
                >
                  <span className="min-w-0 flex-1 truncate text-xs font-medium text-white">
                    {report.name || `Report ${report.id}`}
                  </span>
                  <span
                    className={
                      'shrink-0 rounded px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide ' +
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
      {openReport && (
        <ReportViewerOverlay report={openReport} onClose={() => setOpenReport(null)} />
      )}
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

export default CompactReportsList;
