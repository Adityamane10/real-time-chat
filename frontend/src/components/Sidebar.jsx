import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useSocket } from '../hooks/useSocket';
import { useConversations } from '../hooks/useConversations';
import { api } from '../services/api';
import ConversationItem from './ConversationItem';
import LoadingSpinner from './LoadingSpinner';
import CreateGroupModal from './CreateGroupModal';

export default function Sidebar({ activeConversation, onSelectConversation, onStartPrivateChat, onOpenGroup }) {
  const { username, logout } = useAuth();
  const { isConnected, onlineUsers } = useSocket();
  const { conversations, groups, loading } = useConversations(username);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef(null);
  const debounceRef = useRef(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const q = search.trim();
    if (!q) { setSearchResults([]); setShowResults(false); return; }
    setSearching(true);
    setShowResults(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const data = await api.searchUsers(q);
        setSearchResults((data.data || []).filter((u) => u !== username));
      } catch {
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [search, username]);

  const allItems = [
    ...groups.map((g) => ({
      id: `group:${g._id}`,
      type: 'group',
      displayName: g.name,
      lastMessage: g.lastMessage,
      data: g,
    })),
    ...conversations.map((c) => ({
      id: c.conversationId,
      type: 'private',
      displayName: c.displayName,
      lastMessage: c.lastMessage,
      data: c,
    })),
  ].sort((a, b) => {
    const aTime = a.lastMessage?.createdAt ? new Date(a.lastMessage.createdAt).getTime() : 0;
    const bTime = b.lastMessage?.createdAt ? new Date(b.lastMessage.createdAt).getTime() : 0;
    return bTime - aTime;
  });

  const otherUsers = onlineUsers.filter((u) => u !== username);

  return (
    <div className="flex h-full w-80 flex-col border-r border-gray-200 bg-white">
      <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-sm font-medium text-indigo-600">
            {username?.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">{username}</p>
            <div className="flex items-center gap-1">
              <span className={`inline-block h-1.5 w-1.5 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-[10px] text-gray-400">{isConnected ? 'Online' : 'Offline'}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowCreateGroup(true)}
            className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-indigo-600 transition-colors hover:bg-indigo-50"
            title="Create Group"
          >
            + New Group
          </button>
          <button onClick={logout} className="rounded px-2 py-1 text-xs text-gray-400 hover:text-gray-600">
            Logout
          </button>
        </div>
      </div>

      {otherUsers.length > 0 && (
        <div className="border-b border-gray-100 px-4 py-2.5">
          <h3 className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
            Online — {otherUsers.length}
          </h3>
          <div className="flex flex-wrap gap-1.5">
            {otherUsers.map((user) => (
              <button
                key={user}
                onClick={() => onStartPrivateChat?.(user)}
                className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700 transition-colors hover:bg-green-100"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                {user}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="relative border-b border-gray-100 px-4 py-2">
        <div className="relative">
          <input
            ref={searchRef}
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onFocus={() => { if (searchResults.length > 0 || search.trim()) setShowResults(true); }}
            onBlur={() => setTimeout(() => setShowResults(false), 200)}
            placeholder="Search users to chat with..."
            maxLength={50}
            className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 pl-9 text-sm text-gray-900 placeholder-gray-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
          />
          <svg className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z" />
          </svg>
        </div>
        {showResults && (
          <div className="absolute left-2 right-2 top-full z-20 mt-1 max-h-60 overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg">
            {searching ? (
              <p className="p-3 text-center text-sm text-gray-400">Searching...</p>
            ) : searchResults.length === 0 ? (
              <p className="p-3 text-center text-sm text-gray-400">No users found</p>
            ) : (
              searchResults.map((user) => (
                <button
                  key={user}
                  type="button"
                  onMouseDown={(e) => { e.preventDefault(); onStartPrivateChat?.(user); setSearch(''); setSearchResults([]); setShowResults(false); }}
                  className="flex w-full items-center gap-3 px-3 py-2.5 text-sm text-gray-900 transition-colors hover:bg-indigo-50"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-sm font-medium text-indigo-600">
                    {user.charAt(0).toUpperCase()}
                  </span>
                  <span className="flex-1 text-left font-medium">{user}</span>
                  <span className={`h-2 w-2 rounded-full ${onlineUsers.includes(user) ? 'bg-green-500' : 'bg-gray-300'}`} />
                </button>
              ))
            )}
          </div>
        )}
      </div>

      <div className="scrollbar-thin flex-1 overflow-y-auto">
        {loading ? (
          <LoadingSpinner size="sm" message="" />
        ) : allItems.length === 0 ? (
          <p className="px-4 py-6 text-center text-xs text-gray-400">
            No conversations yet. Start a private chat or create a group.
          </p>
        ) : (
          allItems.map((item) => {
            const conversation = item.type === 'group'
              ? {
                  conversationId: item.id,
                  displayName: item.displayName,
                  isGroup: true,
                  groupId: item.data._id,
                  members: item.data.members,
                  creator: item.data.creator,
                  lastMessage: item.lastMessage,
                }
              : {
                  conversationId: item.id,
                  displayName: item.displayName,
                  isGroup: false,
                  isPrivate: true,
                  otherUser: item.data.otherUser,
                  lastMessage: item.lastMessage,
                };
            return (
              <ConversationItem
                key={item.id}
                conversation={conversation}
                isActive={activeConversation?.conversationId === item.id}
                onClick={() => {
                  if (item.type === 'group') {
                    onOpenGroup?.(item.data);
                  } else {
                    onSelectConversation(conversation);
                  }
                }}
              />
            );
          })
        )}
      </div>

      {showCreateGroup && (
        <CreateGroupModal
          username={username}
          onlineUsers={onlineUsers}
          onClose={() => setShowCreateGroup(false)}
          onCreated={(group) => {
            onOpenGroup?.(group);
          }}
        />
      )}
    </div>
  );
}
