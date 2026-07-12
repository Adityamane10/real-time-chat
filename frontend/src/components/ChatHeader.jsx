import { useSocket } from '../hooks/useSocket';
import ConnectionStatus from './ConnectionStatus';

export default function ChatHeader({ conversation }) {
  const { onlineUsers, isConnected } = useSocket();
  const otherUser = conversation?.otherUser;
  const isOnline = otherUser && onlineUsers.includes(otherUser);
  const isGroup = conversation?.isGroup;
  const memberCount = conversation?.members?.length || 0;

  return (
    <header className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-100 text-sm font-semibold text-indigo-600">
          {isGroup ? '#' : conversation?.displayName?.charAt(0).toUpperCase()}
        </div>
        <div>
          <h1 className="text-sm font-semibold text-gray-900">
            {conversation?.displayName || 'Chat'}
          </h1>
          <p className="text-[10px] text-gray-400">
            {isGroup
              ? `${memberCount} members, ${onlineUsers.filter((u) => conversation?.members?.includes(u)).length} online`
              : isOnline
              ? 'Online'
              : 'Offline'}
          </p>
        </div>
      </div>

      <ConnectionStatus isConnected={isConnected} />
    </header>
  );
}
