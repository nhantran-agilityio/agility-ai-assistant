"use client";

import { Fragment, useState } from "react";

import ChatIcon from "./icons/chat-icon";
import {
    Conversation,
    ConversationContent,
    ConversationScrollButton,
} from "./Conversation";
import { Message, MessageContent } from "./Message";
import { ResponseMessages } from "./Response";
import { TypingIndicator } from "./TypingIndicator";
import { Textarea } from "./TextArea";
import { cn } from "../lib/utils";
import { Button } from "./Button";

type ChatMessage = {
    id: string;
    role: "user" | "assistant";
    text: string;
};

export default function ChatbotPopup() {
    const [open, setOpen] = useState(false);
    const [input, setInput] = useState("");
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim()) return;

        const userMessage: ChatMessage = {
            id: crypto.randomUUID(),
            role: "user",
            text: input,
        };

        setMessages((prev) => [...prev, userMessage]);
        setInput("");
        setLoading(true);
        setError(null);

        try {
            const res = await fetch("http://localhost:3000/chat", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    message: userMessage.text,
                }),
            });

            const data = await res.json();

            const aiMessage: ChatMessage = {
                id: crypto.randomUUID(),
                role: "assistant",
                text: data.text,
            };

            setMessages((prev) => [...prev, aiMessage]);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
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

                    <div className="flex-1 relative overflow-hidden">
                        <Conversation className="h-full">
                            <ConversationContent>

                                {messages.map((message) => (
                                    <Fragment key={message.id}>
                                        <Message from={message.role}>
                                            <MessageContent from={message.role}>
                                                <ResponseMessages>
                                                    {message.text}
                                                </ResponseMessages>
                                            </MessageContent>
                                        </Message>
                                    </Fragment>
                                ))}

                                {loading && <TypingIndicator />}

                                {error && (
                                    <div className="text-red-500 text-sm p-2">
                                        {error}
                                    </div>
                                )}
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
                                    "w-full resize-none border-none bg-transparent",
                                    "max-h-48 min-h-16 outline-none"
                                )}
                            />

                            <Button
                                type="submit"
                                disabled={!input.trim() || loading}
                            >
                                {loading ? "..." : "Send"}
                            </Button>
                        </div>
                    </form>
                </div>
            )}
        </>
    );
}