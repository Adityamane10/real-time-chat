import { useMemo, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useSocket } from '../hooks/useSocket';
import { useMessages } from '../hooks/useMessages';
import { useAutoScroll } from '../hooks/useAutoScroll';
import ChatHeader from './ChatHeader';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import GroupMembersPanel from './GroupMembersPanel';

export default function ChatArea({ conversation, onStartPrivateChat }) {
  const { username } = useAuth();
  const { markSeen } = useSocket();
  const isGroup = conversation?.isGroup;
  const groupId = conversation?.groupId;
  const recipient = isGroup ? undefined : conversation?.otherUser;

  const {
    messages,
    loading,
    error,
    hasMore,
    sendMessage,
    retryMessage,
    loadMore,
  } = useMessages(username, conversation);

  const lastMessageId = useMemo(() => {
    if (messages.length === 0) return null;
    return messages[messages.length - 1]._id;
  }, [messages]);

  const {
    containerRef,
    newMessageIndicator,
    scrollToBottom,
    handleScroll,
  } = useAutoScroll(lastMessageId);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && conversation?.conversationId) {
        markSeen(conversation.conversationId, groupId, recipient);
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [conversation?.conversationId, groupId, recipient, markSeen]);

  if (!conversation) {
    return (
      <div className="flex flex-1 items-center justify-center text-sm text-gray-400">
        Select a conversation to start chatting
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col">
      <ChatHeader conversation={conversation} />
      {isGroup && (
        <GroupMembersPanel
          members={conversation.members}
          creator={conversation.creator}
        />
      )}
      <MessageList
        messages={messages}
        loading={loading}
        error={error}
        hasMore={hasMore}
        onLoadMore={loadMore}
        containerRef={containerRef}
        onScroll={handleScroll}
        newMessageIndicator={newMessageIndicator}
        onScrollToBottom={scrollToBottom}
        onRetry={retryMessage}
        recipient={recipient}
        groupId={groupId}
      />
      <MessageInput
        onSend={sendMessage}
        disabled={loading}
        recipient={recipient}
        groupId={groupId}
        groupName={isGroup ? conversation?.displayName : undefined}
      />
    </div>
  );
}
