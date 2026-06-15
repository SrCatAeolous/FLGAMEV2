const API_URL = import.meta.env.VITE_API_URL || '';

let token: string | null = localStorage.getItem('fut_token');

export interface UserData {
  id: string;
  username: string;
  coins: number;
  level: number;
  xp: number;
  cards: { legendId: string; obtainedAt: string }[];
  stats: {
    wins: number;
    losses: number;
    draws: number;
    goalsScored: number;
    goalsConceded: number;
    matchesPlayed: number;
  };
}

export interface AuthResponse {
  token: string;
  user: UserData;
}

export interface PackResult {
  cards: { legendId: string; tier: string }[];
  remainingCoins: number;
}

export interface MatchResult {
  coinsEarned: number;
  xpEarned: number;
  totalCoins: number;
  level: number;
  xp: number;
  stats: UserData['stats'];
}

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(body.error || `HTTP ${res.status}`);
  }

  return res.json();
}

export function setToken(newToken: string): void {
  token = newToken;
  localStorage.setItem('fut_token', newToken);
}

export function clearToken(): void {
  token = null;
  localStorage.removeItem('fut_token');
}

export function getToken(): string | null {
  return token;
}

export function isLoggedIn(): boolean {
  return !!token;
}

export async function login(username: string, password: string): Promise<AuthResponse> {
  const data = await apiFetch<AuthResponse>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });
  setToken(data.token);
  return data;
}

export async function register(username: string, password: string): Promise<AuthResponse> {
  const data = await apiFetch<AuthResponse>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });
  setToken(data.token);
  return data;
}

export async function getProfile(): Promise<UserData> {
  return apiFetch<UserData>('/api/user/profile');
}

export async function openPack(packId: string): Promise<PackResult> {
  return apiFetch<PackResult>('/api/packs/open', {
    method: 'POST',
    body: JSON.stringify({ packId }),
  });
}

export async function submitMatchResult(homeScore: number, awayScore: number): Promise<MatchResult> {
  return apiFetch<MatchResult>('/api/user/match-result', {
    method: 'POST',
    body: JSON.stringify({ homeScore, awayScore }),
  });
}
