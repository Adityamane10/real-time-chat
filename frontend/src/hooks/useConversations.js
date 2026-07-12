import { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '../services/api';
import { getSocket } from '../services/socket';
import { SOCKET_EVENTS } from '../constants';

export function useConversations(username) {
  const [conversations, setConversations] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const debounceRef = useRef(null);

  const fetchAll = useCallback(async () => {
    if (!username) return;
    try {
      setLoading(true);
      setError(null);
      const [convResult, groupsResult] = await Promise.all([
        api.getConversations(username),
        api.getGroups(username),
      ]);
      setConversations(convResult.data || []);
      setGroups(groupsResult.data || []);
    } catch (err) {
      setError(err.message || 'Failed to load conversations');
    } finally {
      setLoading(false);
    }
  }, [username]);

  const debouncedFetch = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(fetchAll, 500);
  }, [fetchAll]);

  useEffect(() => {
    fetchAll();
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [fetchAll]);

  useEffect(() => {
    const socket = getSocket();
    socket.on(SOCKET_EVENTS.MESSAGE_NEW, debouncedFetch);
    socket.on(SOCKET_EVENTS.UNREAD_UPDATED, debouncedFetch);
    socket.on(SOCKET_EVENTS.GROUP_CREATED, debouncedFetch);
    socket.on(SOCKET_EVENTS.GROUP_MEMBER_ADDED, debouncedFetch);

    return () => {
      socket.off(SOCKET_EVENTS.MESSAGE_NEW, debouncedFetch);
      socket.off(SOCKET_EVENTS.UNREAD_UPDATED, debouncedFetch);
      socket.off(SOCKET_EVENTS.GROUP_CREATED, debouncedFetch);
      socket.off(SOCKET_EVENTS.GROUP_MEMBER_ADDED, debouncedFetch);
    };
  }, [debouncedFetch]);

  return { conversations, groups, loading, error, refresh: fetchAll };
}
