export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

export const API_ENDPOINTS = {
  login: `${API_BASE_URL}/auth/login`,
  chat: `${API_BASE_URL}/chat`,
  suggestions: `${API_BASE_URL}/chat/suggestions`,
};
