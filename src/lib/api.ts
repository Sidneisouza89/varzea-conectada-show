// Configuração centralizada da API
export const API_BASE_URL = 'http://api.varzeando.local:5000';

export const API_ENDPOINTS = {
  auth: {
    login: `${API_BASE_URL}/api/auth/login`,
    register: `${API_BASE_URL}/api/auth/register`,
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
