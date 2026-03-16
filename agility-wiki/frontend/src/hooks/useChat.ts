'use client';

import { useEffect, useRef, useState } from 'react';

import { chatService } from '@/services/chat.service';
import { ChatMessage } from '@/types/chat';
import { STORAGE_KEY } from '@/constants/chat';

export function useChat(apiKey?: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const controllerRef = useRef<AbortController | null>(null);

  // load history
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      setMessages(JSON.parse(saved));
    }
  }, []);

  // save history
  useEffect(() => {
    if (messages.length === 0) return;

    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
  }, [messages]);

  const resetChat = () => {
    setMessages([]);
    localStorage.removeItem(STORAGE_KEY);
  };

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
      const res = await chatService.ask(text, controller.signal, apiKey);

      if (!res.body) {
        throw new Error('No response body');
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      let aiText = '';
      const aiId = crypto.randomUUID();

      setMessages((prev) => [
        ...prev,
        { id: aiId, role: 'assistant', text: '' },
      ]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        aiText += chunk;

        setMessages((prev) =>
          prev.map((m) => (m.id === aiId ? { ...m, text: aiText } : m)),
        );
      }
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
    resetChat,
  };
}
