import { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '../services/api';
import { getSocket } from '../services/socket';
import { useSocket } from './useSocket';
import { SOCKET_EVENTS, MESSAGE_STATUS } from '../constants';

const STATUS_ORDER = ['pending', 'sent', 'delivered', 'seen'];

function mergeStatus(current, incoming) {
  const currentIdx = STATUS_ORDER.indexOf(current);
  const incomingIdx = STATUS_ORDER.indexOf(incoming);
  return incomingIdx > currentIdx ? incoming : current;
}

export function useMessages(username, activeConversation) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const processedIds = useRef(new Set());
  const processedClientIds = useRef(new Set());
  const socketRef = useRef(null);
  const seenEmittedFor = useRef(new Set());
  const { emitMessage, markSeen } = useSocket();

  const isGroup = activeConversation?.isGroup;
  const groupId = activeConversation?.groupId;
  const recipient = isGroup ? undefined : activeConversation?.otherUser;

  const signalDeliveredAndSeen = useCallback(
    (message) => {
      if (message.username === username) return;

      const socket = getSocket();
      if (!socket) return;

      if (message.status === 'sent' || message.status === 'delivered') {
        socket.emit(SOCKET_EVENTS.MESSAGES_DELIVERED, { messageId: message._id, clientId: message.clientId });
      }

      if (!seenEmittedFor.current.has(message._id)) {
        seenEmittedFor.current.add(message._id);
        if (message.groupId) {
          markSeen(`group:${message.groupId}`, message.groupId, null);
        } else {
          const convId = `private:${[username, message.username].sort().join(':')}`;
          markSeen(convId, null, message.username);
        }
      }
    },
    [username, markSeen]
  );

  const fetchMessages = useCallback(
    async (pageNum = 1) => {
      try {
        setError(null);
        if (pageNum === 1) setLoading(true);

        const params = { page: pageNum, username };
        if (groupId) params.groupId = groupId;
        if (recipient) params.recipient = recipient;

        const result = await api.getMessages(params);
        const newMessages = result.data;

        newMessages.forEach((m) => {
          processedIds.current.add(m._id);
          if (m.clientId) processedClientIds.current.add(m.clientId);
        });

        if (pageNum === 1) {
          newMessages.forEach(signalDeliveredAndSeen);
          setMessages(newMessages);
        } else {
          setMessages((prev) => [...newMessages, ...prev]);
        }

        setPage(pageNum);
        setHasMore(result.pagination.page < result.pagination.totalPages);
      } catch (err) {
        setError(err.message || 'Failed to load messages');
      } finally {
        setLoading(false);
      }
    },
    [groupId, recipient, username, signalDeliveredAndSeen]
  );

  useEffect(() => {
    processedIds.current = new Set();
    processedClientIds.current = new Set();
    seenEmittedFor.current = new Set();
    setMessages([]);
    setPage(1);
    setHasMore(true);
    setLoading(true);
    fetchMessages(1);
  }, [fetchMessages]);

  useEffect(() => {
    const socket = getSocket();
    socketRef.current = socket;

    const onNewMessage = (message) => {
      const isPrivateRecipient = message.recipient === username && !message.groupId;
      const isGroupRecipient = !!message.groupId && message.username !== username;
      const isForCurrentConv = message.groupId
        ? message.groupId === groupId
        : recipient
          ? (message.username === username && message.recipient === recipient) ||
            (message.username === recipient && message.recipient === username)
          : false;

      if (isPrivateRecipient || isGroupRecipient) {
        socket.emit(SOCKET_EVENTS.MESSAGES_DELIVERED, { messageId: message._id, clientId: message.clientId });
      }

      if ((isPrivateRecipient || isGroupRecipient) && isForCurrentConv) {
        if (!seenEmittedFor.current.has(message._id)) {
          seenEmittedFor.current.add(message._id);
          if (message.groupId) {
            markSeen(`group:${message.groupId}`, message.groupId, null);
          } else {
            const convId = `private:${[username, message.username].sort().join(':')}`;
            markSeen(convId, null, message.username);
          }
        }
      }

      if (processedIds.current.has(message._id)) return;
      if (message.clientId && processedClientIds.current.has(message.clientId)) return;

      if (!isForCurrentConv) return;

      processedIds.current.add(message._id);
      if (message.clientId) processedClientIds.current.add(message.clientId);

      setMessages((prev) => {
        const idx = prev.findIndex((m) => m.clientId === message.clientId);
        if (idx !== -1) {
          const next = [...prev];
          next[idx] = { ...message, status: mergeStatus(next[idx].status, message.status) };
          return next;
        }
        return [...prev, message];
      });
    };

    socket.on(SOCKET_EVENTS.MESSAGE_NEW, onNewMessage);

    return () => {
      socket.off(SOCKET_EVENTS.MESSAGE_NEW, onNewMessage);
    };
  }, [username, recipient, groupId, markSeen]);

  useEffect(() => {
    const socket = getSocket();

    const onMessageStatus = (updatedMessage) => {
      setMessages((prev) =>
        prev.map((m) => {
          if (m._id === updatedMessage._id || (m.clientId && m.clientId === updatedMessage.clientId)) {
            return { ...m, status: mergeStatus(m.status, updatedMessage.status), deliveredAt: updatedMessage.deliveredAt, seenAt: updatedMessage.seenAt };
          }
          return m;
        })
      );
    };

    socket.on(SOCKET_EVENTS.MESSAGE_STATUS, onMessageStatus);

    return () => {
      socket.off(SOCKET_EVENTS.MESSAGE_STATUS, onMessageStatus);
    };
  }, []);

  const sendMessage = useCallback(
    async (content) => {
      const clientId = crypto.randomUUID();
      const tempMessage = {
        _id: clientId,
        username,
        content,
        clientId,
        status: MESSAGE_STATUS.PENDING,
        createdAt: new Date().toISOString(),
      };
      if (groupId) {
        tempMessage.groupId = groupId;
      } else {
        tempMessage.recipient = recipient;
      }

      setMessages((prev) => [...prev, tempMessage]);
      processedClientIds.current.add(clientId);

      try {
        const response = await emitMessage(content, recipient, groupId, clientId);
        if (response?.message) {
          processedIds.current.add(response.message._id);
          setMessages((prev) =>
            prev.map((m) =>
              m.clientId === clientId
                ? { ...response.message, status: mergeStatus(m.status, 'sent') }
                : m
            )
          );
        } else if (response?.error) {
          setMessages((prev) =>
            prev.map((m) =>
              m.clientId === clientId
                ? { ...m, status: MESSAGE_STATUS.FAILED }
                : m
            )
          );
        }
      } catch {
        setMessages((prev) =>
          prev.map((m) =>
            m.clientId === clientId
              ? { ...m, status: MESSAGE_STATUS.FAILED }
              : m
          )
        );
      }
    },
    [username, recipient, groupId, emitMessage]
  );

  const retryMessage = useCallback(
    (failedMessage) => {
      const clientId = crypto.randomUUID();
      setMessages((prev) =>
        prev.map((m) =>
          m.clientId === failedMessage.clientId
            ? { ...m, clientId, status: MESSAGE_STATUS.PENDING }
            : m
        )
      );
      emitMessage(failedMessage.content, recipient, groupId, clientId).then((response) => {
        if (response?.message) {
          processedIds.current.add(response.message._id);
          setMessages((prev) =>
            prev.map((m) =>
              m.clientId === clientId
                ? { ...response.message, status: mergeStatus(m.status, 'sent') }
                : m
            )
          );
        }
      });
    },
    [recipient, groupId, emitMessage]
  );

  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      fetchMessages(page + 1);
    }
  }, [loading, hasMore, page, fetchMessages]);

  return {
    messages,
    loading,
    error,
    hasMore,
    sendMessage,
    retryMessage,
    loadMore,
  };
}
