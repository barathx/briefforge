import axios from 'axios';

// ─── Base instance ──────────────────────────────────────────────
const api = axios.create({
  baseURL: (import.meta as any).env?.VITE_API_BASE_URL ?? 'http://localhost:3000',
  headers: { 'Content-Type': 'application/json' },
  timeout: 30_000,
});

// ─── Request interceptor: attach token ──────────────────────────
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('bf_token');
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
});

// ─── Response interceptor: handle 401 ───────────────────────────
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('bf_token');
      localStorage.removeItem('bf_user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// ─── TypeScript Interfaces ───────────────────────────────────────

export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: string;
}

export interface Client {
  id: string;
  name: string;
  industry?: string;
  website?: string;
  notes?: string;
  createdAt: string;
}

export interface Brief {
  id: string;
  title: string;
  product: string;
  audience: string;
  goal: string;
  deadline?: string;
  key_message?: string;
  brand_guidelines?: string;
  raw_brief: string;
  tone: string;
  platforms: string[];
  status: 'draft' | 'processing' | 'complete' | 'error';
  clientId: string;
  client?: Client;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Generation {
  id: string;
  briefId: string;
  type: 'caption' | 'ad_copy' | 'hook' | 'cta' | 'concept';
  platform?: string;
  content: string[];
  createdAt: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface SignupData {
  name: string;
  email: string;
  password: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface CreateClientData {
  name: string;
  industry?: string;
  website?: string;
  notes?: string;
}

export interface CreateBriefData {
  clientId: string;
  title: string;
  product: string;
  audience: string;
  goal: string;
  deadline?: string;
  key_message?: string;
  brand_guidelines?: string;
  raw_brief: string;
  tone: string;
  platforms: string[];
}

export interface BriefFilters {
  tone?: string;
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
  dateFrom?: string;
  dateTo?: string;
}

export interface BriefListResponse {
  briefs: Brief[];
  total: number;
  page: number;
  limit: number;
}

export interface DashboardStats {
  totalBriefs: number;
  totalClients: number;
  generationsToday: number;
}

// ─── Normalisation Helpers ────────────────────────────────────────

function normaliseBrief(raw: any): Brief {
  return {
    id: raw.id,
    title: raw.title,
    product: raw.product,
    audience: raw.audience,
    goal: raw.goal,
    deadline: raw.deadline || undefined,
    key_message: raw.key_message || undefined,
    brand_guidelines: raw.brand_guidelines || undefined,
    raw_brief: raw.raw_brief,
    tone: raw.tone,
    platforms: raw.platforms || [],
    status: raw.status,
    clientId: raw.client_id || '',
    client: raw.clients ? {
      id: raw.client_id,
      name: raw.clients.name,
      createdAt: raw.clients.created_at || '',
    } : (raw.client_name ? {
      id: raw.client_id,
      name: raw.client_name,
      createdAt: '',
    } : undefined),
    userId: raw.user_id,
    createdAt: raw.created_at,
    updatedAt: raw.created_at,
  };
}

function normaliseGeneration(raw: any): Generation {
  return {
    id: raw.id,
    briefId: raw.brief_id,
    type: raw.type,
    platform: raw.platform || undefined,
    content: raw.content || [],
    createdAt: raw.created_at,
  };
}

// ─── Auth ────────────────────────────────────────────────────────

export const signup = (data: SignupData): Promise<AuthResponse> =>
  api.post<AuthResponse>('/api/auth/signup', data).then((r) => r.data);

export const login = (data: LoginData): Promise<AuthResponse> =>
  api.post<AuthResponse>('/api/auth/login', data).then((r) => r.data);

// ─── Clients ─────────────────────────────────────────────────────

export const getClients = (): Promise<Client[]> =>
  api.get<Client[]>('/api/clients').then((r) => r.data);

export const createClient = (data: CreateClientData): Promise<Client> =>
  api.post<Client>('/api/clients', data).then((r) => r.data);

// ─── Briefs ──────────────────────────────────────────────────────

export const createBrief = (data: CreateBriefData): Promise<Brief> => {
  const body = {
    title: data.title,
    raw_brief: data.raw_brief,
    product: data.product,
    audience: data.audience,
    goal: data.goal,
    key_message: data.key_message || '',
    tone: data.tone,
    platforms: data.platforms,
    client_id: data.clientId || null,
    deadline: data.deadline || null,
    brand_guidelines: data.brand_guidelines || null,
  };
  return api.post<{ brief: any }>('/api/briefs', body).then((r) => normaliseBrief(r.data.brief));
};

export const getBriefs = (filters?: BriefFilters): Promise<BriefListResponse> => {
  const params: any = {};
  if (filters) {
    if (filters.tone) params.tone = filters.tone;
    if (filters.status) params.status = filters.status;
    if (filters.search) params.search = filters.search;
    if (filters.page) params.page = filters.page;
    if (filters.limit) params.limit = filters.limit;
    if (filters.dateFrom) params.date_from = filters.dateFrom;
    if (filters.dateTo) params.date_to = filters.dateTo;
  }

  return api.get<any>('/api/briefs', { params }).then((r) => ({
    briefs: (r.data.briefs || []).map(normaliseBrief),
    total: r.data.total ?? 0,
    page: r.data.page ?? 1,
    limit: r.data.limit ?? 10,
  }));
};

export const getBrief = (id: string): Promise<{ brief: Brief; generations: Generation[] }> =>
  api.get<{ brief: any; generations: any[] }>(`/api/briefs/${id}`).then((r) => ({
    brief: normaliseBrief(r.data.brief),
    generations: (r.data.generations || []).map(normaliseGeneration),
  }));

export const deleteBrief = (id: string): Promise<void> =>
  api.delete(`/api/briefs/${id}`).then(() => undefined);

// ─── Dashboard ───────────────────────────────────────────────────

export const getDashboardStats = (): Promise<DashboardStats> =>
  api.get<DashboardStats>('/api/dashboard/stats').then((r) => r.data);

// ─── Generate ────────────────────────────────────────────────────

export const generateContent = (briefId: string): Promise<Generation[]> =>
  api.post<{ generations: any[] }>(`/api/generate/${briefId}`).then((r) =>
    (r.data.generations || []).map(normaliseGeneration)
  );

export const regenerateContent = (
  briefId: string,
  type: Generation['type'],
  platform?: string
): Promise<Generation> =>
  api
    .post<{ generation: any }>(`/api/generate/${briefId}/regenerate`, null, {
      params: { type, platform },
    })
    .then((r) => normaliseGeneration(r.data.generation));

export default api;
