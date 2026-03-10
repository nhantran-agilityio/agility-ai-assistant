import { API_ENDPOINTS } from '../constants/api';

export const getSuggestions = async () => {
  const res = await fetch(API_ENDPOINTS.suggestions);
  return res.json();
};

export const askChatbot = async (message: string) => {
  const res = await fetch(API_ENDPOINTS.chat, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ message }),
  });

  return res.json();
};
