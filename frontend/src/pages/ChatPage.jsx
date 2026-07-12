import { useAuth } from '../hooks/useAuth';
import { useChat } from '../hooks/useChat';
import { SocketProvider } from '../context/SocketContext';
import { ChatProvider } from '../context/ChatContext';
import Sidebar from '../components/Sidebar';
import ChatArea from '../components/ChatArea';

function ChatLayout() {
  const { username } = useAuth();
  const { activeConversation, selectConversation, startPrivateChat, openGroup } = useChat();

  return (
    <SocketProvider username={username}>
      <div className="flex h-screen bg-gray-100">
        <Sidebar
          activeConversation={activeConversation}
          onSelectConversation={selectConversation}
          onStartPrivateChat={startPrivateChat}
          onOpenGroup={openGroup}
        />
        <ChatArea
          conversation={activeConversation}
          onStartPrivateChat={startPrivateChat}
        />
      </div>
    </SocketProvider>
  );
}

export default function ChatPage() {
  return (
    <ChatProvider>
      <ChatLayout />
    </ChatProvider>
  );
}
