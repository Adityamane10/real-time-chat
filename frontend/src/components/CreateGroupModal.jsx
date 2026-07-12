import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { USERNAME_MAX_LENGTH } from '../constants';

export default function CreateGroupModal({ username, onlineUsers, onClose, onCreated }) {
  const [groupName, setGroupName] = useState('');
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [allUsers, setAllUsers] = useState([]);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await api.searchUsers('');
        setAllUsers((data.data || []).filter((u) => u !== username));
      } catch {
        setAllUsers([]);
      } finally {
        setFetching(false);
      }
    })();
  }, [username]);

  const filtered = search.trim()
    ? allUsers.filter((u) => u.toLowerCase().includes(search.trim().toLowerCase()))
    : allUsers;

  const isOnline = (user) => onlineUsers.includes(user);

  const toggleMember = (user) => {
    setSelectedMembers((prev) =>
      prev.includes(user) ? prev.filter((u) => u !== user) : [...prev, user]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const trimmedName = groupName.trim();
    if (!trimmedName) {
      setError('Group name is required');
      return;
    }

    if (selectedMembers.length === 0) {
      setError('Add at least one member');
      return;
    }

    setLoading(true);
    try {
      const result = await api.createGroup({
        name: trimmedName,
        creator: username,
        members: selectedMembers,
      });
      onCreated(result.data);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to create group');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="mx-4 flex h-[80vh] w-full max-w-md flex-col rounded-2xl bg-white shadow-xl">
        <div className="shrink-0 p-6 pb-0">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Create Group</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="group-name" className="block text-sm font-medium text-gray-700 mb-1">
                Group Name
              </label>
              <input
                id="group-name"
                type="text"
                value={groupName}
                onChange={(e) => { setGroupName(e.target.value); setError(''); }}
                placeholder="Enter group name"
                maxLength={100}
                autoFocus
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
              />
            </div>

            <div>
              <p className="block text-sm font-medium text-gray-700 mb-1">
                Members ({selectedMembers.length} selected)
              </p>

              {selectedMembers.length > 0 && (
                <div className="mb-2 flex flex-wrap gap-1.5">
                  {selectedMembers.map((user) => (
                    <span
                      key={user}
                      className="inline-flex items-center gap-1 rounded-full bg-indigo-100 px-2.5 py-1 text-xs font-medium text-indigo-700"
                    >
                      {user}
                      <button
                        type="button"
                        onClick={() => toggleMember(user)}
                        className="ml-0.5 text-indigo-400 hover:text-indigo-600"
                      >
                        &times;
                      </button>
                    </span>
                  ))}
                </div>
              )}

              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search users..."
                maxLength={50}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
              />
            </div>

            {error && <p className="text-sm text-red-500" role="alert">{error}</p>}
          </form>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-6 pt-2">
          {fetching ? (
            <p className="py-4 text-center text-sm text-gray-400">Loading users...</p>
          ) : filtered.length === 0 ? (
            <p className="py-4 text-center text-sm text-gray-400">
              {search.trim() ? 'No users found' : 'No registered users'}
            </p>
          ) : (
            <div className="space-y-0.5">
              {filtered.map((user) => (
                <button
                  key={user}
                  type="button"
                  onClick={() => toggleMember(user)}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                    selectedMembers.includes(user)
                      ? 'bg-indigo-50'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-medium ${
                      isOnline(user)
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    {user.charAt(0).toUpperCase()}
                  </span>
                  <div className="flex-1 text-left">
                    <p className="font-medium text-gray-900">{user}</p>
                    <p className="text-xs text-gray-400">
                      {isOnline(user) ? 'Online' : 'Offline'}
                    </p>
                  </div>
                  {isOnline(user) && (
                    <span className="h-2 w-2 rounded-full bg-green-500" />
                  )}
                  {selectedMembers.includes(user) && (
                    <span className="text-indigo-500">
                      <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="shrink-0 border-t border-gray-100 p-4">
          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading || !groupName.trim() || selectedMembers.length === 0}
              className="rounded-lg bg-indigo-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Group'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
