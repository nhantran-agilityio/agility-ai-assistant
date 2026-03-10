'use client';

import { useRef, useState } from 'react';
import { chatService } from '../services/chat.service';

export type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  text: string;
};

export function useChat(apiKey?: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needHuman, setNeedHuman] = useState(false);

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

      // handle backend status
      if (data.status === 'no_data') {
        setNeedHuman(true);
      }

      if (data.status === 'ai_error') {
        setError('AI service is currently unavailable.');
      }

      if (data.status === 'rate_limit') {
        setError('Too many requests. Please try again later.');
      }

      if (data.status === 'db_error') {
        setError('Database error occurred while retrieving information.');
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
    needHuman,
    sendMessage,
    cancel,
  };
}
