// Configuração centralizada da API
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://projetovarzeandobackend-production.up.railway.app';
export const API_ENDPOINTS = {
  auth: {
    login: `${API_BASE_URL}/api/auth/login`,
    register: `${API_BASE_URL}/api/auth/register`,
    refresh: `${API_BASE_URL}/api/auth/refresh`,
    logout: `${API_BASE_URL}/api/auth/logout`,
  },
  matches: `${API_BASE_URL}/api/matches`,
  teams: `${API_BASE_URL}/api/teams`,
  championships: `${API_BASE_URL}/api/championships`,
  stadiums: `${API_BASE_URL}/api/stadiums`,
  monitoring: 'http://grafana.varzeando.local:3000',
};

// Fetch wrapper com configuração padrão
export async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem('varzeando_token');

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };
  const response = await fetch(endpoint, {
    ...options,
    headers,
  });
  if (!response.ok) {
    throw new Error(`API Error: ${response.status}`);
  }
  return response.json();
}

// Tenta renovar o access token usando o refresh token salvo.
// Retorna o novo access token, ou null se não foi possível renovar.
async function renovarAccessToken(): Promise<string | null> {
  const refreshToken = localStorage.getItem('varzeando_refresh_token');
  if (!refreshToken) return null;

  try {
    const res = await fetch(API_ENDPOINTS.auth.refresh, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${refreshToken}`,
      },
    });
    if (!res.ok) return null;

    const data = await res.json();
    localStorage.setItem('varzeando_token', data.access_token);
    return data.access_token;
  } catch {
    return null;
  }
}

// Fetch autenticado com renovação automática de sessão.
// Se a chamada voltar 401 (token expirado), tenta renovar o access token
// automaticamente e repete a chamada original uma única vez.
// Retorna a Response crua (sem parsear json), pra manter compatibilidade
// com quem já faz res.ok / res.json() manualmente.
export async function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const montarHeaders = (token: string | null): HeadersInit => ({
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  });

  const tokenAtual = localStorage.getItem('varzeando_token');
  let response = await fetch(url, { ...options, headers: montarHeaders(tokenAtual) });

  if (response.status === 401) {
    const novoToken = await renovarAccessToken();
    if (novoToken) {
      response = await fetch(url, { ...options, headers: montarHeaders(novoToken) });
    }
  }

  return response;
}
