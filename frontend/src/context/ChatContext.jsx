import { createContext, useState, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';

export const ChatContext = createContext(null);

export function ChatProvider({ children }) {
  const { username } = useAuth();
  const [activeConversation, setActiveConversation] = useState(null);

  const selectConversation = useCallback((conversation) => {
    setActiveConversation(conversation);
  }, []);

  const startPrivateChat = useCallback((otherUser) => {
    const convId = `private:${[username, otherUser].sort().join(':')}`;
    setActiveConversation({
      conversationId: convId,
      displayName: otherUser,
      isGroup: false,
      isPrivate: true,
      otherUser,
    });
  }, [username]);

  const openGroup = useCallback((group) => {
    setActiveConversation({
      conversationId: `group:${group._id}`,
      displayName: group.name,
      isGroup: true,
      groupId: group._id,
      members: group.members || [],
      creator: group.creator,
    });
  }, []);

  return (
    <ChatContext.Provider value={{ activeConversation, selectConversation, startPrivateChat, openGroup }}>
      {children}
    </ChatContext.Provider>
  );
}
