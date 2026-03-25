import { OpenAIKeyProvider } from '../../providers/openai-provider';

import Chat from '@/components/Chat';
import { ApiKeyModal } from '@/components/ApiKeyModal';

export default function Dashboard() {
  return (
    <OpenAIKeyProvider>
      <div className="flex justify-center pt-10 h-screen bg-gray-400 flex flex-col items-center pt-8">
        <ApiKeyModal />
        <Chat />
      </div>
    </OpenAIKeyProvider>
  );
}
