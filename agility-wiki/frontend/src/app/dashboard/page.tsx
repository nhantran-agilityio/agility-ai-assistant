import { ApiKeyModal } from '@/src/components/ApiKeyModal';
import { OpenAIKeyProvider } from '../providers/provider';
import Chat from '@/src/components/Chat';

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
