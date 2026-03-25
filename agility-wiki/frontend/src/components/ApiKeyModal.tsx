'use client';

import { useState } from 'react';

import { Button } from './Button';
import { Input } from './Input';

import { useOpenAIKey } from '@/providers/openai-provider';

export function ApiKeyModal() {
  const { apiKey, setApiKey, loading, error, clearError } = useOpenAIKey();

  const [input, setInput] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  if (apiKey) return null;

  const handleSave = async () => {
    if (!input.trim()) {
      setLocalError('API key is required');
      return;
    }

    const success = await setApiKey(input);

    if (!success) {
      setLocalError(error ?? 'Invalid API key');
    }
  };

  const handleOnChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
    clearError();
    setLocalError(null);
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm">

      <div className="w-[520px] bg-white rounded-xl shadow-xl p-8 flex flex-col gap-5">

        <h2 className="text-xl font-semibold text-center text-black">
          Enter OpenAI API Key
        </h2>

        <p className="text-sm text-gray-800 text-center">
          Your API key is required to use the AI assistant.
        </p>

        <Input
          type="password"
          placeholder="sk-..."
          value={input}
          onChange={handleOnChange}
          className="border rounded-lg px-4 py-3 outline-none focus:ring-1 focus:ring-blue-500 text-black"
        />

        {(localError || error) && (
          <p className="text-red-500 text-sm text-center">
            {localError || error}
          </p>
        )}

        <Button
          onClick={handleSave}
          disabled={loading}
          className="bg-blue-500 text-white py-3 rounded-lg hover:bg-blue-600 disabled:bg-gray-400 transition"
        >
          {loading ? 'Validating...' : 'Verify   API Key'}
        </Button>

      </div>

    </div>
  );
}