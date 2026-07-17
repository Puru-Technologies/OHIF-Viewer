import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useAppConfig } from '@state';
import { resolvePacsBaseUrl } from '../api/reportsClient';
import {
  createShareLink,
  deleteShareLink,
  fetchShareLinks,
  fetchStudyByUID,
  holdShareLink,
  resumeShareLink,
  sendShareEmail,
  sendShareWhatsApp,
  ShareLink,
  StudyMeta,
  updatePatientPhone,
} from '../api/shareClient';

type Props = {
  servicesManager: any;
};

/**
 * Right-rail Share panel — replicates the hydrogen radiology-v2 share tab
 * against the same puru-pacs /share-radio-study/* endpoints. Flow:
 *
 *   1. Resolve loaded StudyInstanceUID → Study.id + patient meta via
 *      /study/by-uid/{uid}.
 *   2. Load active share links via /share-radio-study/study/{studyId}.
 *   3. If none: show Generate form (expiry dropdown + button, optional phone).
 *      If present: show cards with URL/copy/views/expiry/hold-resume-delete.
 *   4. Patient row: phone input + Send-to-Patient via WhatsApp.
 *   5. Email row: address input + Send-to-Email.
 *   6. On top: three direct in-LAN viewer URLs (StudyInstanceUIDs / accession
 *      / uhid) — the same URLs shipped in the hydrogen share tab's direct
 *      URLs block.
 *
 * NOT replicated (yet):
 *   - Send-to-consultants (needs employee picker; not obvious from OHIF)
 *   - Communication timeline / delivery ticks (needs polling + comm-log fetch)
 *   - X-ray image WhatsApp (edge case, X-ray-only)
 */
function SharePanel({ servicesManager }: Props) {
  const [appConfig] = useAppConfig();
  const { displaySetService } = servicesManager.services;

  const baseUrl = useMemo(() => resolvePacsBaseUrl(appConfig), [appConfig]);

  // ---- Load current study meta from DisplaySetService, then resolve to Study.id ----
  const [studyInstanceUID, setStudyInstanceUID] = useState<string | null>(null);
  const [study, setStudy] = useState<StudyMeta | null>(null);
  const [resolveError, setResolveError] = useState<string | null>(null);

  useEffect(() => {
    const read = () => {
      const sets = displaySetService.getActiveDisplaySets?.() ?? [];
      const first = sets.find(s => s?.StudyInstanceUID);
      if (first?.StudyInstanceUID) setStudyInstanceUID(first.StudyInstanceUID);
    };
    read();
    const { unsubscribe } = displaySetService.subscribe(
      displaySetService.EVENTS.DISPLAY_SETS_ADDED,
      read
    );
    return () => unsubscribe();
  }, [displaySetService]);

  useEffect(() => {
    if (!studyInstanceUID) return;
    let cancelled = false;
    setResolveError(null);
    fetchStudyByUID(baseUrl, studyInstanceUID)
      .then(meta => {
        if (cancelled) return;
        if (!meta) setResolveError('Study not found in PACS');
        else setStudy(meta);
      })
      .catch(err => {
        if (!cancelled) setResolveError(err.message || 'Failed to resolve study');
      });
    return () => {
      cancelled = true;
    };
  }, [baseUrl, studyInstanceUID]);

  // ---- Share links ----
  const [links, setLinks] = useState<ShareLink[]>([]);
  const [loadingLinks, setLoadingLinks] = useState(false);

  const loadLinks = useCallback(async () => {
    if (!study?.id) return;
    setLoadingLinks(true);
    try {
      setLinks(await fetchShareLinks(baseUrl, study.id));
    } catch {
      setLinks([]);
    } finally {
      setLoadingLinks(false);
    }
  }, [baseUrl, study?.id]);

  useEffect(() => {
    loadLinks();
  }, [loadLinks]);

  // ---- Form state ----
  const [expiryHours, setExpiryHours] = useState<number>(72);
  const [maxViews] = useState<number>(10);
  const [patientPhone, setPatientPhone] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSavingPhone, setIsSavingPhone] = useState(false);
  const [status, setStatus] = useState<{ tone: 'ok' | 'err'; text: string } | null>(null);

  useEffect(() => {
    if (study?.patient?.phone) setPatientPhone(study.patient.phone);
    if (study?.patient?.email) setEmailInput(study.patient.email);
  }, [study?.patient?.phone, study?.patient?.email]);

  const flash = (tone: 'ok' | 'err', text: string) => {
    setStatus({ tone, text });
    setTimeout(() => setStatus(s => (s?.text === text ? null : s)), 2500);
  };

  const activeLink = useMemo(() => links.find(l => l.active) || links[0], [links]);

  // ---- Actions ----
  const onGenerate = async () => {
    if (!study?.id) return;
    setIsGenerating(true);
    try {
      await createShareLink(baseUrl, study.id, expiryHours, maxViews, patientPhone || null);
      await loadLinks();
      flash('ok', 'Share link generated');
    } catch (e: any) {
      flash('err', e.message || 'Failed to generate link');
    } finally {
      setIsGenerating(false);
    }
  };

  const onCopy = (url: string) => {
    if (!url) return;
    navigator.clipboard.writeText(url).then(
      () => flash('ok', 'Copied to clipboard'),
      () => flash('err', 'Copy failed')
    );
  };

  const onSavePhone = async () => {
    if (!study?.id || !patientPhone || patientPhone === study.patient?.phone) return;
    setIsSavingPhone(true);
    try {
      await updatePatientPhone(baseUrl, study.id, patientPhone);
      setStudy(prev => (prev ? { ...prev, patient: { ...prev.patient, phone: patientPhone } } : prev));
      flash('ok', 'Phone updated');
    } catch (e: any) {
      flash('err', e.message || 'Failed to update phone');
    } finally {
      setIsSavingPhone(false);
    }
  };

  const onSendPatient = async () => {
    if (!activeLink) return flash('err', 'Generate a share link first');
    if (!patientPhone || patientPhone.length < 10) return flash('err', 'Enter a phone number');
    try {
      await sendShareWhatsApp(baseUrl, activeLink.id, patientPhone);
      flash('ok', `WhatsApp queued for ${patientPhone}`);
    } catch (e: any) {
      flash('err', e.message || 'Failed to send WhatsApp');
    }
  };

  const onSendEmail = async () => {
    if (!activeLink) return flash('err', 'Generate a share link first');
    if (!emailInput) return flash('err', 'Enter an email address');
    try {
      await sendShareEmail(baseUrl, activeLink.id, emailInput);
      flash('ok', `Email sent to ${emailInput}`);
    } catch (e: any) {
      flash('err', e.message || 'Failed to send email');
    }
  };

  const onHold = async (id: number) => {
    try {
      await holdShareLink(baseUrl, id);
      loadLinks();
    } catch (e: any) {
      flash('err', e.message);
    }
  };

  const onResume = async (id: number) => {
    try {
      await resumeShareLink(baseUrl, id);
      loadLinks();
    } catch (e: any) {
      flash('err', e.message);
    }
  };

  const onDelete = async (id: number) => {
    if (!window.confirm('Delete this share link permanently?')) return;
    try {
      await deleteShareLink(baseUrl, id);
      loadLinks();
    } catch (e: any) {
      flash('err', e.message);
    }
  };

  // ---- Direct in-LAN URLs (Study UID / Accession / UHID) ----
  const directUrls = useMemo(() => {
    if (!study || typeof window === 'undefined') return [];
    const base = `${window.location.origin}/viewer`;
    const rows = [
      study.studyInstanceUID && {
        tag: 'Study UID',
        url: `${base}?StudyInstanceUIDs=${encodeURIComponent(study.studyInstanceUID)}`,
      },
      study.accessionNumber && {
        tag: 'Accession',
        url: `${base}?accessionNumber=${encodeURIComponent(study.accessionNumber)}`,
      },
      study.patient?.patientID && {
        tag: 'UHID',
        url: `${base}?uhid=${encodeURIComponent(study.patient.patientID)}`,
      },
    ];
    return rows.filter(Boolean) as { tag: string; url: string }[];
  }, [study]);

  // ---- Render ----
  return (
    <div className="puru-share-panel flex h-full flex-col bg-black text-white">
      <div className="border-b border-neutral-800 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-neutral-400">
        Share
      </div>

      <div className="flex-1 space-y-4 overflow-auto p-3">
        {resolveError && (
          <div className="rounded border border-red-800 bg-red-950/50 px-2 py-1.5 text-xs text-red-300">
            {resolveError}
          </div>
        )}

        {study && !study.uploadComplete && (
          <div className="flex items-start gap-2 rounded border border-amber-800 bg-amber-950/40 px-2 py-1.5 text-[11px] text-amber-200">
            <span>⚠</span>
            <span>Study not yet in cloud. Generating a link will trigger upload.</span>
          </div>
        )}

        {/* Direct in-LAN URLs */}
        <section>
          <div className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-neutral-500">
            Direct URLs (LAN)
          </div>
          {directUrls.length === 0 && (
            <div className="text-xs text-neutral-500">No study loaded.</div>
          )}
          <ul className="space-y-1">
            {directUrls.map(({ tag, url }) => (
              <li
                key={tag}
                className="flex items-center gap-2 rounded border border-neutral-800 bg-neutral-900/40 px-2 py-1.5"
              >
                <span className="shrink-0 rounded bg-neutral-800 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-neutral-300">
                  {tag}
                </span>
                <span
                  className="min-w-0 flex-1 truncate font-mono text-[10px] text-neutral-400"
                  title={url}
                >
                  {url}
                </span>
                <button
                  type="button"
                  onClick={() => onCopy(url)}
                  className="shrink-0 rounded bg-neutral-800 px-1.5 py-0.5 text-[10px] text-neutral-200 hover:bg-neutral-700"
                >
                  Copy
                </button>
              </li>
            ))}
          </ul>
        </section>

        {/* Cloud share link — generator OR active-link cards */}
        <section>
          <div className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-neutral-500">
            Cloud share link
          </div>

          {loadingLinks && <div className="text-xs text-neutral-500">Loading…</div>}

          {!loadingLinks && links.length === 0 && (
            <div className="space-y-2 rounded border border-neutral-800 bg-neutral-900/40 p-2">
              <div className="text-[11px] text-neutral-400">
                Generate a link the patient / consultant can open outside the hospital network.
                Billable per share.
              </div>
              <div className="flex items-center gap-1">
                <select
                  value={expiryHours}
                  onChange={e => setExpiryHours(Number(e.target.value))}
                  className="rounded border border-neutral-800 bg-neutral-900 px-2 py-1 text-xs text-white focus:border-primary focus:outline-none"
                  title="Link expiry"
                >
                  <option value={24}>1 day</option>
                  <option value={72}>3 days</option>
                  <option value={168}>7 days</option>
                </select>
                <button
                  type="button"
                  onClick={onGenerate}
                  disabled={!study?.id || isGenerating}
                  className="ml-auto rounded bg-primary px-2 py-1 text-xs font-medium text-white hover:bg-primary/80 disabled:opacity-40"
                >
                  {isGenerating ? 'Generating…' : 'Generate Link'}
                </button>
              </div>
            </div>
          )}

          {!loadingLinks && links.length > 0 && (
            <ul className="space-y-2">
              {links.map(link => (
                <li
                  key={link.id}
                  className="space-y-1.5 rounded border border-neutral-800 bg-neutral-900/40 p-2"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="min-w-0 flex-1 truncate font-mono text-[10px] text-neutral-300"
                      title={link.shareUrl}
                    >
                      {link.shareUrl}
                    </span>
                    <button
                      type="button"
                      onClick={() => onCopy(link.shareUrl)}
                      className="shrink-0 rounded bg-neutral-800 px-1.5 py-0.5 text-[10px] text-neutral-200 hover:bg-neutral-700"
                    >
                      Copy
                    </button>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-neutral-500">
                    <span>
                      👁 {link.viewCount || 0}/{link.maxViews}
                    </span>
                    <span>⏱ {new Date(link.expiresAt).toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {link.active ? (
                      <button
                        type="button"
                        onClick={() => onHold(link.id)}
                        className="rounded border border-neutral-700 px-1.5 py-0.5 text-[10px] text-neutral-300 hover:bg-neutral-800"
                      >
                        Hold
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onResume(link.id)}
                        className="rounded border border-neutral-700 px-1.5 py-0.5 text-[10px] text-neutral-300 hover:bg-neutral-800"
                      >
                        Resume
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => onDelete(link.id)}
                      className="ml-auto rounded border border-red-800 px-1.5 py-0.5 text-[10px] text-red-400 hover:bg-red-950/40"
                    >
                      Delete
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Patient WhatsApp */}
        <section>
          <div className="mb-1 flex items-center justify-between">
            <div className="text-[10px] font-semibold uppercase tracking-wide text-neutral-500">
              Patient — WhatsApp
            </div>
            {study?.patient?.name && (
              <div className="truncate text-[10px] text-neutral-500" title={study.patient.name}>
                {study.patient.name}
              </div>
            )}
          </div>
          <div className="flex gap-1">
            <input
              type="tel"
              value={patientPhone}
              onChange={e => setPatientPhone(e.target.value)}
              placeholder="10-digit phone"
              maxLength={15}
              className="min-w-0 flex-1 rounded border border-neutral-800 bg-neutral-900 px-2 py-1 text-xs text-white placeholder:text-neutral-500 focus:border-primary focus:outline-none"
            />
            <button
              type="button"
              onClick={onSavePhone}
              disabled={isSavingPhone || !patientPhone || patientPhone === (study?.patient?.phone || '')}
              title="Save phone on patient record"
              className="shrink-0 rounded border border-neutral-700 px-1.5 py-1 text-[10px] text-neutral-300 hover:bg-neutral-800 disabled:opacity-40"
            >
              Save
            </button>
            <button
              type="button"
              onClick={onSendPatient}
              disabled={!patientPhone || patientPhone.length < 10 || !activeLink}
              className="shrink-0 rounded bg-primary px-2 py-1 text-xs font-medium text-white hover:bg-primary/80 disabled:opacity-40"
            >
              Send
            </button>
          </div>
        </section>

        {/* Email */}
        <section>
          <div className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-neutral-500">
            Send via email
          </div>
          <div className="flex gap-1">
            <input
              type="email"
              value={emailInput}
              onChange={e => setEmailInput(e.target.value)}
              placeholder="recipient@hospital.org"
              className="min-w-0 flex-1 rounded border border-neutral-800 bg-neutral-900 px-2 py-1 text-xs text-white placeholder:text-neutral-500 focus:border-primary focus:outline-none"
            />
            <button
              type="button"
              onClick={onSendEmail}
              disabled={!emailInput || !activeLink}
              className="shrink-0 rounded bg-primary px-2 py-1 text-xs font-medium text-white hover:bg-primary/80 disabled:opacity-40"
            >
              Send
            </button>
          </div>
          {!activeLink && (
            <div className="mt-1 text-[10px] text-neutral-500">
              Generate a share link first to enable send.
            </div>
          )}
        </section>

        {/* Status flash */}
        {status && (
          <div
            className={
              'rounded px-2 py-1.5 text-[11px] ' +
              (status.tone === 'ok'
                ? 'border border-emerald-800 bg-emerald-950/40 text-emerald-300'
                : 'border border-red-800 bg-red-950/40 text-red-300')
            }
          >
            {status.text}
          </div>
        )}
      </div>
    </div>
  );
}

export default SharePanel;
