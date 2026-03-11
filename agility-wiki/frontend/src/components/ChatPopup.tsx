'use client';

import { useEffect, useRef, useState } from 'react';

// Components
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from './Conversation';
import { Message, MessageContent } from './Message';
import { ResponseMessages } from './Response';
import { TypingIndicator } from './TypingIndicator';
import { Textarea } from './TextArea';
import { Button } from './Button';
import Suggestions from './Suggestions';
import { useOpenAIKey } from '../app/providers/provider';
import { chatService } from '../services/chat';

// Icons
import ChatIcon from './icons/chat-icon';

// Hooks
import { useChat } from '../hooks/useChat';

// Utils
import { cn } from '../lib/utils';

export default function ChatbotPopup() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);

  const { apiKey } = useOpenAIKey() || '';

  const { messages, loading, error, sendMessage, cancel } = useChat(
    apiKey ?? undefined,
  );

  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    chatService.getSuggestions().then((data) => {
      setSuggestions(data.suggestions || []);
    });
  }, [open]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e: { preventDefault: () => void }) => {
    e.preventDefault();

    if (!input.trim()) return;

    const text = input;
    setInput('');

    sendMessage(text);
  };

  return (
    <>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-50 rounded-full bg-black text-white shadow-xl hover:scale-110 transition p-4"
        >
          <ChatIcon />
        </button>
      )}

      {open && (
        <div className="fixed bottom-6 right-6 z-50 w-[420px] h-[650px] bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 bg-zinc-900">
            <span className="text-sm font-semibold text-white">
              AI Assistant
            </span>
            <button
              onClick={() => setOpen(false)}
              className="text-zinc-400 hover:text-white"
            >
              ✕
            </button>
          </div>

          <div className="flex-1 overflow-hidden">
            <Conversation className="h-full">
              <ConversationContent>
                {messages.length === 0 && suggestions.length > 0 && (
                  <Suggestions
                    suggestions={suggestions}
                    onSelect={sendMessage}
                  />
                )}

                {messages.map((message) => (
                  <Message key={message.id} from={message.role}>
                    <MessageContent from={message.role}>
                      <ResponseMessages>{message.text}</ResponseMessages>
                    </MessageContent>
                  </Message>
                ))}

                {loading && <TypingIndicator />}
                {error && (
                  <div className="text-red-500 text-sm p-2">{error}</div>
                )}

                <div ref={endRef} />
              </ConversationContent>

              <ConversationScrollButton />
            </Conversation>
          </div>

          <form
            onSubmit={handleSend}
            className="border-t border-zinc-800 bg-zinc-900 p-4"
          >
            <div className="flex items-end gap-3 rounded-2xl border border-zinc-800 px-4 py-3">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Send a message..."
                disabled={loading}
                className={cn(
                  'w-full resize-none border-none bg-transparent',
                  'max-h-48 min-h-16 outline-none',
                )}
              />

              <Button
                type={loading ? 'button' : 'submit'}
                onClick={() => loading && cancel()}
                disabled={!input.trim() && !loading}
              >
                {loading ? 'Stop' : 'Send'}
              </Button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
