import { API_ENDPOINTS } from "../constants/api";

export const chatService = {
  async ask(message: string, signal?: AbortSignal, apiKey?: string) {
    const res = await fetch(API_ENDPOINTS.chat, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message, apiKey }),
      signal,
    });

    if (!res.ok) throw new Error("Chat request failed");

    return res.json();
  },

  async getSuggestions() {
    const res = await fetch(API_ENDPOINTS.suggestions);

    if (!res.ok) throw new Error("Suggestion request failed");

    return res.json();
  },
};