'use client';

import { useEffect, useRef, useState } from 'react';

import Suggestions from './Suggestions';
import { Input } from './Input';
import { Button } from './Button';
import { TypingIndicator } from './TypingIndicator';

import { useOpenAIKey } from '@/providers/openai-provider';
import { useChat } from '@/hooks/useChat';
import { chatService } from '@/services/chat.service';

export default function Chat() {
	const [input, setInput] = useState('');
	const [suggestions, setSuggestions] = useState<string[]>([]);

	const { apiKey } = useOpenAIKey() || {};
	const { messages, loading, error, sendMessage, cancel, resetChat, isStreaming } =
		useChat(apiKey || undefined);

	const endRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		chatService.getSuggestions().then((data) => {
			setSuggestions(data.suggestions || []);
		});
	}, []);

	useEffect(() => {
		endRef.current?.scrollIntoView({ behavior: 'smooth' });
	}, [messages]);

	const handleSend = (e: any) => {
		e.preventDefault();
		if (!input.trim()) return;

		sendMessage(input);
		setInput('');
	};

	return (
		<section className="w-full flex justify-center px-3 md:px-6">
			{/* Chat container */}
			<div className="w-full max-w-3xl h-[80vh] bg-white rounded-xl shadow flex flex-col">

				{/* Messages */}
				<div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 md:space-y-6">

					{/* Suggestions */}
					{messages.length === 0 && suggestions.length > 0 && (
						<Suggestions
							suggestions={suggestions}
							onSelect={sendMessage}
						/>
					)}

					{messages.map((msg) => (
						<div
							key={msg.id}
							className={`flex ${msg.role === 'user'
								? 'justify-end'
								: 'justify-start'
								}`}
						>
							<div
								className={`max-w-[85%] md:max-w-[70%] px-4 py-3 rounded-lg text-sm leading-relaxed ${msg.role === 'user'
									? 'bg-slate-900 text-white'
									: 'bg-gray-200 text-gray-800'
									}`}
							>
								{msg.text}
							</div>
						</div>
					))}

					{/* typing */}
					{loading && !isStreaming &&(
						<div className="flex justify-start">
							<div className="px-4 py-3 rounded-lg">
								<TypingIndicator />
							</div>
						</div>
					)}

					{/* error */}
					{error && (
						<div className="text-red-500 text-sm">
							{error}
						</div>
					)}

					<div ref={endRef} />
				</div>

				{/* Input */}
				<form
					onSubmit={handleSend}
					className="border-t p-3 md:p-4 flex flex-col sm:flex-row gap-3"
				>
					<Input
						value={input}
						onChange={(e) => setInput(e.target.value)}
						placeholder="Ask a question..."
						className="flex-1 border rounded-lg px-4 py-3 text-black outline-none focus:ring-2 focus:ring-blue-500"
					/>

					<Button
						type={loading ? 'button' : 'submit'}
						onClick={() => loading && cancel()}
						disabled={!input.trim() && !loading}
						className="bg-blue-500 text-white px-5 py-2 rounded-lg hover:bg-blue-600 disabled:bg-gray-400"
					>
						{loading ? 'Stop' : 'Send'}
					</Button>

					<Button
						className="bg-blue-500 text-white px-5 py-2 rounded-lg hover:bg-blue-600 disabled:bg-gray-400"
						onClick={resetChat} disabled={messages.length === 0}>
						Clear chat history
					</Button>
				</form>
			</div>
		</section>
	);
}