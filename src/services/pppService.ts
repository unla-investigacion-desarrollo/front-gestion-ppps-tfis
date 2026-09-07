const API_URL = (import.meta.env.VITE_API_URL || '/api/sg-ppp-tfi/v1').replace(/\/$/, '');

export interface PPPProposal {
  id: string | number;
  title: string;
  description: string;
  driveFolderUrl?: string | null;
  internalNotes?: string | null;
  isOpen: boolean;
  createdAt?: string;
  updatedAt?: string;
  applications?: PPPApplication[];
}

export interface PPPApplication {
  id?: string | number;
  studentId?: string | number;
  student?: Record<string, unknown> | null;
  status?: string;
  previousKnowledge?: string;
}

export interface CreatePPPProposalDTO {
  title: string;
  description: string;
  driveFolderUrl?: string;
  internalNotes?: string;
}

export interface ApplyPPPProposalDTO {
  previousKnowledge: string;
}

export interface PPPCase {
  id: string | number;
  status: string;
  type?: string;
  isSiuLoaded?: boolean;
  proposal?: PPPProposal | null;
  student?: Record<string, unknown> | null;
  observations?: string | null;
  [key: string]: unknown;
}

async function request<T>(path: string, token: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
  });

  const text = await response.text();
  let body: any = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }

  if (!response.ok) {
    const message = typeof body === 'object' && body?.message ? body.message : body;
    throw new Error(message || `Error ${response.status}`);
  }

  return body as T;
}

function unwrapProposals(payload: unknown): PPPProposal[] {
  if (Array.isArray(payload)) return payload;
  if (payload && typeof payload === 'object') {
    const data = payload as { proposals?: unknown; data?: unknown };
    if (Array.isArray(data.proposals)) return data.proposals as PPPProposal[];
    if (Array.isArray(data.data)) return data.data as PPPProposal[];
  }
  return [];
}

function unwrapCases(payload: unknown): PPPCase[] {
  if (Array.isArray(payload)) return payload as PPPCase[];
  if (payload && typeof payload === 'object') {
    const data = payload as { cases?: unknown; applications?: unknown; data?: unknown };
    if (Array.isArray(data.cases)) return data.cases as PPPCase[];
    if (Array.isArray(data.applications)) return data.applications as PPPCase[];
    if (Array.isArray(data.data)) return data.data as PPPCase[];
  }
  return [];
}

export const pppService = {
  async getProposals(token: string): Promise<PPPProposal[]> {
    const payload = await request<unknown>('/ppp/proposals', token);
    return unwrapProposals(payload);
  },

  async getCases(token: string): Promise<PPPCase[]> {
    const payload = await request<unknown>('/ppp', token);
    return unwrapCases(payload);
  },

  createProposal(payload: CreatePPPProposalDTO, token: string) {
    return request<PPPProposal>('/ppp/proposals', token, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  updateProposalStatus(id: string | number, isOpen: boolean, token: string) {
    return request<PPPProposal>(`/ppp/proposals/${id}/status`, token, {
      method: 'PATCH',
      body: JSON.stringify({ isOpen }),
    });
  },

  acceptApplication(proposalId: string | number, studentId: string | number, token: string) {
    return request<unknown>(`/ppp/proposals/${proposalId}/students/${studentId}/accept`, token, {
      method: 'PATCH',
      body: '{}',
    });
  },

  rejectApplication(proposalId: string | number, studentId: string | number, token: string) {
    return request<unknown>(`/ppp/proposals/${proposalId}/students/${studentId}/reject`, token, {
      method: 'PATCH',
      body: '{}',
    });
  },

  applyToProposal(id: string | number, payload: ApplyPPPProposalDTO, token: string) {
    return request<unknown>(`/ppp/proposals/${id}/apply`, token, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  getCase(id: string | number, token: string) {
    return request<PPPCase>(`/ppp/${id}`, token);
  },

  observeCase(id: string | number, token: string) {
    return request<PPPCase>(`/ppp/${id}/observe`, token, { method: 'PATCH', body: '{}' });
  },

  approveCase(id: string | number, token: string) {
    return request<PPPCase>(`/ppp/${id}/approve`, token, { method: 'PATCH', body: '{}' });
  },

  disapproveCase(id: string | number, token: string) {
    return request<PPPCase>(`/ppp/${id}/disapprove`, token, { method: 'PATCH', body: '{}' });
  },

  loadCaseInSiu(id: string | number, token: string) {
    return request<PPPCase>(`/ppp/${id}/siu-load`, token, { method: 'PATCH', body: '{}' });
  },

  notifyDocumentationSent(id: string | number, token: string) {
    return request<PPPCase>(`/ppp/${id}/notify-sent`, token, { method: 'PATCH', body: '{}' });
  },

  abandonCase(id: string | number, token: string) {
    return request<PPPCase>(`/ppp/${id}/abandon`, token, { method: 'PATCH', body: '{}' });
  },

  getGeneralDrive(token: string) {
    return request<{ generalDriveUrl: string }>('/ppp/general-drive', token);
  },

  updateGeneralDrive(generalDriveUrl: string, token: string) {
    return request<{ generalDriveUrl: string }>('/ppp/general-drive', token, {
      method: 'PATCH',
      body: JSON.stringify({ generalDriveUrl }),
    });
  },

  startExternalCase(token: string) {
    return request<PPPCase>('/ppp/external', token, {
      method: 'POST',
      body: '{}',
    });
  },
};
