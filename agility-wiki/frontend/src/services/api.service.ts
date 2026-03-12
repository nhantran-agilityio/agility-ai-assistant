import { API_BASE_URL, API_ENDPOINTS } from '@constants/api';

export async function apiFetch(url: string, options: RequestInit = {}) {
  let accessToken = localStorage.getItem('accessToken');

  let response = await fetch(`${API_BASE_URL}${url}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
      ...(options.headers || {}),
    },
  });

  // access token expired
  if (response.status === 401) {
    const refreshToken = localStorage.getItem('refreshToken');

    const refreshRes = await fetch(`${API_BASE_URL}${API_ENDPOINTS.refresh}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken }),
    });

    if (!refreshRes.ok) {
      window.location.href = '/login';
      throw new Error('Session expired');
    }

    const refreshData = await refreshRes.json();

    localStorage.setItem('accessToken', refreshData.accessToken);

    accessToken = refreshData.accessToken;

    response = await fetch(`${API_BASE_URL}${url}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
        ...(options.headers || {}),
      },
    });
  }

  return response;
}
