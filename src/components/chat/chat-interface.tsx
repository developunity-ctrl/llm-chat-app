import { ChatProvider } from '@/components/providers/chat-provider';
import { ChatContainer } from './chat-container';

export function ChatInterface() {
  return (
    <ChatProvider>
      <div className="min-h-screen bg-background">
        <ChatContainer />
      </div>
    </ChatProvider>
  );
}
