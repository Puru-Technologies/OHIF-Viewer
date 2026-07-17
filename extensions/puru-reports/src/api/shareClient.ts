/**
 * Thin fetch wrapper around puru-pacs's /share-radio-study/* endpoints.
 * Mirrors the calls hydrogen's radiology-v2 share tab makes.
 */

export type ShareLink = {
  id: number;
  shareUrl: string;
  expiresAt: string;
  active: boolean;
  viewCount: number;
  maxViews: number;
};

export type StudyMeta = {
  id: number;
  studyInstanceUID: string;
  accessionNumber: string | null;
  modality: string | null;
  description: string | null;
  uploadComplete: boolean;
  patient: {
    id?: number;
    patientID?: string;
    name?: string;
    phone?: string;
    email?: string;
  };
};

async function jsonOrThrow(res: Response) {
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`HTTP ${res.status}: ${body || res.statusText}`);
  }
  return res.json();
}

export async function fetchStudyByUID(baseUrl: string, uid: string): Promise<StudyMeta | null> {
  const res = await fetch(`${baseUrl}/study/by-uid/${encodeURIComponent(uid)}`);
  if (res.status === 404) return null;
  return jsonOrThrow(res);
}

export async function fetchShareLinks(baseUrl: string, studyId: number): Promise<ShareLink[]> {
  const res = await fetch(`${baseUrl}/share-radio-study/study/${studyId}`);
  if (!res.ok) return [];
  return res.json();
}

export async function createShareLink(
  baseUrl: string,
  studyId: number,
  expiryHours: number,
  maxViews: number,
  patientPhone: string | null
) {
  const res = await fetch(`${baseUrl}/share-radio-study`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ studyId, expiryHours, maxViews, patientPhone }),
  });
  return jsonOrThrow(res);
}

export async function sendShareWhatsApp(baseUrl: string, shareId: number, phone: string) {
  const res = await fetch(`${baseUrl}/share-radio-study/send-whatsapp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ shareId, phone }),
  });
  return jsonOrThrow(res);
}

export async function sendShareEmail(baseUrl: string, shareId: number, email: string) {
  const res = await fetch(`${baseUrl}/share-radio-study/send-email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ shareId, email }),
  });
  return jsonOrThrow(res);
}

export async function holdShareLink(baseUrl: string, id: number) {
  return jsonOrThrow(await fetch(`${baseUrl}/share-radio-study/hold/${id}`));
}

export async function resumeShareLink(baseUrl: string, id: number) {
  return jsonOrThrow(await fetch(`${baseUrl}/share-radio-study/resume/${id}`));
}

export async function deleteShareLink(baseUrl: string, id: number) {
  return jsonOrThrow(await fetch(`${baseUrl}/share-radio-study/delete/${id}`));
}

export async function updatePatientPhone(baseUrl: string, studyId: number, phone: string) {
  const res = await fetch(`${baseUrl}/share-radio-study/update-phone`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ studyId, phone }),
  });
  return jsonOrThrow(res);
}
