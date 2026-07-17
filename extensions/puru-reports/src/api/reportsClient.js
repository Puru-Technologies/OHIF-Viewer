export function resolvePacsBaseUrl(appConfig) {
  if (appConfig?.puruPacsBaseUrl) {
    return String(appConfig.puruPacsBaseUrl).replace(/\/$/, '');
  }
  if (typeof window === 'undefined') return 'http://localhost:8083';
  return `${window.location.protocol}//${window.location.hostname}:8083`;
}

export async function fetchReportsByStudyUID(baseUrl, studyInstanceUID, signal) {
  const url = `${baseUrl}/report/by-study-uid/${encodeURIComponent(studyInstanceUID)}`;
  const res = await fetch(url, { signal });
  if (res.status === 404) return [];
  if (!res.ok) throw new Error(`Reports fetch failed: ${res.status}`);
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}
