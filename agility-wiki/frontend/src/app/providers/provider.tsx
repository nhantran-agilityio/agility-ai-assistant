"use client";

import { createContext, useContext, useEffect, useState } from "react";

type OpenAIKeyContextType = {
    apiKey: string | null;
    setApiKey: (key: string) => Promise<boolean>;
    loading: boolean;
    error: string | null;
    clearError: () => void;
};

const OpenAIKeyContext = createContext<OpenAIKeyContextType>({
    apiKey: null,
    setApiKey: async () => false,
    loading: false,
    error: null,
    clearError: () => { },
});

export function OpenAIKeyProvider({
    children,
}: {
    children: React.ReactNode;
}) {
    const [apiKey, setApiKeyState] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const clearError = () => setError(null);

    useEffect(() => {
        const saved = localStorage.getItem("OPENAI_API_KEY");
        if (saved) setApiKeyState(saved);
    }, []);

    const isValidFormat = (key: string) => {
        return /^sk-[A-Za-z0-9-_]{20,}$/.test(key);
    };

    const validateApiKey = async (key: string) => {
        try {
            const res = await fetch("https://api.openai.com/v1/models", {
                headers: {
                    Authorization: `Bearer ${key}`,
                },
            });

            return res.ok;
        } catch {
            return false;
        }
    };

    const setApiKey = async (key: string) => {
        clearError();

        if (!isValidFormat(key)) {
            setError("Invalid API key format");
            return false;
        }

        setLoading(true);

        try {
            const isValid = await validateApiKey(key);

            if (!isValid) {
                setError("Invalid or expired API key");
                return false;
            }

            localStorage.setItem("OPENAI_API_KEY", key);
            setApiKeyState(key);
            return true;
        } finally {
            setLoading(false);
        }
    };

    return (
        <OpenAIKeyContext.Provider
            value={{ apiKey, setApiKey, loading, error, clearError }}
        >
            {children}
        </OpenAIKeyContext.Provider>
    );
}

export const useOpenAIKey = () => useContext(OpenAIKeyContext);
