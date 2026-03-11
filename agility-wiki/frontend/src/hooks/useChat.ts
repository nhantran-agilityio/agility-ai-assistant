'use client';

import { useRef, useState } from 'react';
import { chatService } from '../services/chat';

export type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  text: string;
};

export function useChat(apiKey?: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const controllerRef = useRef<AbortController | null>(null);

  const sendMessage = async (text: string) => {
    if (!text.trim()) return;

    const controller = new AbortController();
    controllerRef.current = controller;

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      text,
    };

    setMessages((prev) => [...prev, userMessage]);
    setLoading(true);
    setError(null);

    try {
      const data = await chatService.ask(text, controller.signal, apiKey);

      const aiMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        text: data.text || '',
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (err: any) {
      if (err.name === 'AbortError') return;

      setError(err?.message || 'Unexpected error');
    } finally {
      setLoading(false);
      controllerRef.current = null;
    }
  };

  const cancel = () => {
    controllerRef.current?.abort();
    setLoading(false);
  };

  return {
    messages,
    loading,
    error,
    sendMessage,
    cancel,
  };
}
