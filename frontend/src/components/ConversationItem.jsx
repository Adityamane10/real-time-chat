import { useAuth } from '../hooks/useAuth';
import { useSocket } from '../hooks/useSocket';

function formatTime(dateString) {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const oneDay = 24 * 60 * 60 * 1000;

    if (diff < oneDay && date.getDate() === now.getDate()) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  } catch {
    return '';
  }
}

export default function ConversationItem({ conversation, isActive, onClick }) {
  const { onlineUsers, unreadCounts } = useSocket();
  const { username } = useAuth();

  const isOnline =
    !conversation.isGroup && conversation.otherUser && onlineUsers.includes(conversation.otherUser);
  const unread = unreadCounts[conversation.conversationId] || 0;
  const lastMsg = conversation.lastMessage;
  const isOwn = lastMsg?.username === username;

  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-gray-100 focus:outline-none focus:bg-gray-100 ${
        isActive ? 'bg-indigo-50' : ''
      }`}
    >
      <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-sm font-semibold text-indigo-600">
        {conversation.isGroup ? '#' : conversation.displayName?.charAt(0).toUpperCase()}
        {!conversation.isGroup && isOnline && (
          <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-green-500" />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between">
          <h3 className="truncate text-sm font-medium text-gray-900">
            {conversation.displayName}
          </h3>
          {lastMsg?.createdAt && (
            <span className="ml-2 shrink-0 text-[10px] text-gray-400">
              {formatTime(lastMsg.createdAt)}
            </span>
          )}
        </div>
        <div className="flex items-center justify-between">
          <p className="truncate text-xs text-gray-500">
            {conversation.isGroup && lastMsg && (
              <span className="mr-1 font-medium">{lastMsg.username}:</span>
            )}
            {!conversation.isGroup && isOwn && <span className="mr-1">You:</span>}
            {lastMsg?.content || 'No messages yet'}
          </p>
          {!isActive && unread > 0 && (
            <span className="ml-2 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-indigo-500 px-1.5 text-[10px] font-bold text-white">
              {unread > 99 ? '99+' : unread}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}
