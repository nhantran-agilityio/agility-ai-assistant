"use client";

import { Fragment, useEffect, useState } from "react";


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
import Suggestions from "./Suggestions";
import { chatService } from "../services/chat.service";
import { useOpenAIKey } from "../app/providers/provider";

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
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [controller, setController] = useState<AbortController | null>(null);
    const [needHuman, setNeedHuman] = useState(false);
    const { apiKey = '' } = useOpenAIKey();

    useEffect(() => {
        if (!open) return;

        chatService.getSuggestions().then((data) => {
            setSuggestions(data.suggestions || []);
        });
    }, [open]);

    useEffect(() => {
        const el = document.querySelector("#chat-end");
        el?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const sendMessage = async (text: string) => {
        const abort = new AbortController();
        setController(abort);

        const userMessage: ChatMessage = {
            id: crypto.randomUUID(),
            role: "user",
            text,
        };

        setMessages((prev) => [...prev, userMessage]);
        setLoading(true);
        setError(null);

        try {
            if (!apiKey) {
                setError("OpenAI API key is required");
                return;
            }

            const data = await chatService.ask(text, abort.signal, apiKey);

            const aiMessage: ChatMessage = {
                id: crypto.randomUUID(),
                role: "assistant",
                text: data.text || "",
            };

            setMessages((prev) => [...prev, aiMessage]);

            // Detect AI fail
            if (
                data.text?.toLowerCase().includes("don't know") ||
                data.text?.toLowerCase().includes("not found")
            ) {
                setNeedHuman(true);
            }

        } catch (err: any) {

            if (err.name === "AbortError") {
                console.log("Request cancelled");
                return;
            }

            setError(err.message);
            setNeedHuman(true);

        } finally {
            setLoading(false);
            setController(null);
        }
    };

    const handleSend = async (e: { preventDefault: () => void; }) => {
        e.preventDefault();
        if (!input.trim()) return;

        const text = input;
        setInput("");

        sendMessage(text);
    };

    const handleSuggestionClick = async (text: string) => {
        await sendMessage(text);
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
                                {messages.length === 0 && suggestions.length > 0 && (
                                    <Suggestions
                                        suggestions={suggestions}
                                        onSelect={handleSuggestionClick}
                                    />
                                )}
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
                                type={loading ? "button" : "submit"}
                                onClick={() => {
                                    if (loading && controller) {
                                        controller.abort();
                                        setLoading(false);
                                    }
                                }}
                                disabled={!input.trim() && !loading}
                            >
                                {loading ? "Stop" : "Send"}
                            </Button>
                        </div>
                    </form>
                </div>
            )}
        </>
    );
}