import { useAuth } from '../hooks/useAuth';
import MessageStatus from './MessageStatus';

function formatTime(dateString) {
  try {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}

export default function MessageBubble({ message, showSender }) {
  const { username } = useAuth();
  const isOwn = message.username === username;
  const isFailed = message.status === 'failed';

  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-2`}>
      <div
        className={`max-w-[75%] rounded-2xl px-4 py-2 break-words ${
          isOwn
            ? 'rounded-br-md bg-indigo-500 text-white'
            : 'rounded-bl-md bg-gray-200 text-gray-900'
        } ${isFailed ? 'opacity-60' : ''}`}
      >
        {showSender && !isOwn && (
          <p className="mb-0.5 text-xs font-medium text-indigo-600">
            {message.username}
          </p>
        )}
        <p className="whitespace-pre-wrap text-sm leading-relaxed">{message.content}</p>
        <div className={`mt-1 flex items-center gap-1 ${isOwn ? 'justify-end' : ''}`}>
          <span
            className={`text-[10px] ${
              isOwn ? 'text-indigo-200' : 'text-gray-400'
            }`}
          >
            {message.createdAt ? formatTime(message.createdAt) : ''}
          </span>
          {isOwn && <MessageStatus status={message.status} />}
        </div>
      </div>
    </div>
  );
}
