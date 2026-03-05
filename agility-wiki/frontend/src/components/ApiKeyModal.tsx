"use client";
import { useState } from "react";
import { Button } from "./Button";
import { Input } from "./Input";
import { useOpenAIKey } from "../app/providers/provider";

export function ApiKeyModal() {
    const { apiKey, setApiKey, loading, error, clearError } = useOpenAIKey();
    const [input, setInput] = useState("");
    const [localError, setLocalError] = useState<string | null>(null);

    // If have key then hide modal
    if (apiKey) return null;


    const handleSave = async () => {
        if (!input.trim()) {
            setLocalError("API key is required");
            return;
        }

        const success = await setApiKey(input);

        if (!success) {
            setLocalError(error ?? "Invalid API key");
        }
    };

    const handleOnChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setInput(e.target.value);

        // Clear error when user input again
        clearError();
    };

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black/70">
            <div className="bg-zinc-900 p-6 rounded-xl w-[420px] space-y-4 flex flex-col items-center">
                <h2 className="text-lg font-semibold text-white">
                    Enter OpenAI API Key
                </h2>

                <Input
                    type="password"
                    className="w-full p-2 rounded bg-zinc-800 text-white"
                    placeholder="sk-..."
                    value={input}
                    onChange={handleOnChange}
                />

                {/* Error message */}
                {(localError || error) && (
                    <p className="text-red-500 text-sm text-center">
                        {localError || error}
                    </p>
                )}

                <Button
                    className="w-1/2 bg-blue-600 py-2 rounded disabled:opacity-50"
                    onClick={handleSave}
                    disabled={loading}
                >
                    {loading ? "Validating..." : "Save"}
                </Button>
            </div>
        </div>
    );
}
