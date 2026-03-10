import { ApiKeyModal } from '@/src/components/ApiKeyModal';
import { OpenAIKeyProvider } from '../providers/provider';
import ChatbotPopup from '@/src/components/ChatPopup';

export default function Dashboard() {
  return (
    <OpenAIKeyProvider>
      <div className="flex justify-center pt-10">
        <h1 className="size">Agility Wiki Assistant</h1>
        <ApiKeyModal />
        <ChatbotPopup />
      </div>
    </OpenAIKeyProvider>
  );
}
