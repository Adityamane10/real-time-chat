import { useMemo } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useSocket } from '../hooks/useSocket';
import MessageBubble from './MessageBubble';
import EmptyState from './EmptyState';
import LoadingSpinner from './LoadingSpinner';
import ErrorMessage from './ErrorMessage';

export default function MessageList({
  messages,
  loading,
  error,
  hasMore,
  onLoadMore,
  containerRef,
  onScroll,
  newMessageIndicator,
  onScrollToBottom,
  onRetry,
  recipient,
  groupId,
}) {
  const { typingUsers } = useSocket();
  const { username } = useAuth();

  const uniqueMessages = useMemo(() => {
    const seen = new Set();
    return messages.filter((m) => {
      if (seen.has(m._id)) return false;
      seen.add(m._id);
      return true;
    });
  }, [messages]);

  const failedMessages = useMemo(
    () => uniqueMessages.filter((m) => m.status === 'failed'),
    [uniqueMessages]
  );

  const showSender = !!groupId;

  const relevantTypingUsers = useMemo(() => {
    if (groupId) {
      return typingUsers.filter((t) => {
        const data = typeof t === 'string' ? null : t;
        return data?.groupId === groupId && data?.username !== username;
      });
    }
    if (recipient) {
      return typingUsers.filter((t) => {
        if (typeof t === 'string') return t === recipient && t !== username;
        return t.username === recipient && t.username !== username;
      });
    }
    return [];
  }, [typingUsers, recipient, groupId, username]);

  const typingText = useMemo(() => {
    if (relevantTypingUsers.length === 0) return null;
    const names = relevantTypingUsers.map((t) =>
      typeof t === 'string' ? t : t.username
    );
    if (names.length === 1) return `${names[0]} is typing...`;
    return `${names.join(', ')} are typing...`;
  }, [relevantTypingUsers]);

  if (loading && messages.length === 0) {
    return <LoadingSpinner message="Loading messages..." />;
  }

  if (error && messages.length === 0) {
    return <ErrorMessage message={error} onRetry={onLoadMore} />;
  }

  return (
    <div className="relative flex flex-1 flex-col overflow-hidden">
      <div
        ref={containerRef}
        onScroll={onScroll}
        className="scrollbar-thin flex-1 overflow-y-auto px-4 py-4"
      >
        {hasMore && (
          <div className="mb-4 text-center">
            <button
              onClick={onLoadMore}
              disabled={loading}
              className="rounded-lg bg-gray-100 px-3 py-1 text-xs text-gray-500 transition-colors hover:bg-gray-200 disabled:opacity-50"
            >
              {loading ? 'Loading...' : 'Load older messages'}
            </button>
          </div>
        )}

        {uniqueMessages.length === 0 ? (
          <EmptyState />
        ) : (
          uniqueMessages.map((message) => (
            <MessageBubble key={message._id} message={message} showSender={showSender} />
          ))
        )}

        {typingText && (
          <div className="mb-2 text-left">
            <div className="inline-block max-w-[75%] rounded-2xl rounded-bl-md bg-gray-200 px-4 py-2 text-sm text-gray-500">
              {typingText}
            </div>
          </div>
        )}
      </div>

      {newMessageIndicator && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2">
          <button
            onClick={onScrollToBottom}
            className="animate-bounce rounded-full bg-indigo-500 px-4 py-1 text-xs font-medium text-white shadow-lg transition-colors hover:bg-indigo-600"
          >
            New messages
          </button>
        </div>
      )}

      {failedMessages.length > 0 && (
        <div className="border-t border-red-100 bg-red-50 px-4 py-2">
          <p className="text-xs text-red-600">
            {failedMessages.length} message(s) failed to send.{' '}
            <button
              onClick={() => failedMessages.forEach(onRetry)}
              className="font-medium underline hover:text-red-700"
            >
              Retry all
            </button>
          </p>
        </div>
      )}
    </div>
  );
}
