import { API_ENDPOINTS } from "../constants/api";
import { apiFetch } from "./api";

export const chatService = {
  async ask(message: string, signal?: AbortSignal, apiKey?: string) {
    const res = await apiFetch(API_ENDPOINTS.chat, {
      method: "POST",
      body: JSON.stringify({ message, apiKey }),
      signal,
    });

    if (!res.ok) {
      const error = await res.json().catch(() => null);
      throw new Error(error?.message || "Chat request failed");
    }

    return res.json();
  },

  async getSuggestions() {
    const res = await apiFetch(API_ENDPOINTS.suggestions);

    if (!res.ok) {
      const error = await res.json().catch(() => null);
      throw new Error(error?.message || "Suggestion request failed");
    }

    return res.json();
  },
};