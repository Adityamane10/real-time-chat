import { createContext, useState, useEffect, useCallback, useRef } from 'react';
import { connectSocket, getSocket, disconnectSocket } from '../services/socket';
import { api } from '../services/api';
import { SOCKET_EVENTS } from '../constants';

export const SocketContext = createContext(null);

export function SocketProvider({ children, username }) {
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [typingUsers, setTypingUsers] = useState([]);
  const [unreadCounts, setUnreadCounts] = useState({});
  const typingTimeouts = useRef({});

  useEffect(() => {
    if (!username) return;

    const socket = connectSocket(username);

    const onConnect = () => {
      setIsConnected(true);
      api.registerUser(username).catch(() => {});
    };

    const onDisconnect = () => {
      setIsConnected(false);
    };

    const onOnlineUsers = (users) => {
      setOnlineUsers(users);
    };

    const onTypingStart = (data) => {
      const typingKey = typeof data === 'string' ? data : data.username;
      if (typingKey === username) return;

      setTypingUsers((prev) => {
        if (prev.some((t) => (typeof t === 'string' ? t : t.username) === typingKey)) return prev;
        return [...prev, data];
      });

      if (typingTimeouts.current[typingKey]) {
        clearTimeout(typingTimeouts.current[typingKey]);
      }

      typingTimeouts.current[typingKey] = setTimeout(() => {
        setTypingUsers((prev) => prev.filter((t) => (typeof t === 'string' ? t : t.username) !== typingKey));
      }, 3000);
    };

    const onTypingStop = (data) => {
      const typingKey = typeof data === 'string' ? data : data.username;
      if (typingTimeouts.current[typingKey]) {
        clearTimeout(typingTimeouts.current[typingKey]);
      }
      setTypingUsers((prev) => prev.filter((t) => (typeof t === 'string' ? t : t.username) !== typingKey));
    };

    const onUnreadCounts = (counts) => {
      setUnreadCounts(counts);
    };

    const onUnreadUpdated = (counts) => {
      setUnreadCounts(counts);
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on(SOCKET_EVENTS.ONLINE_USERS, onOnlineUsers);
    socket.on(SOCKET_EVENTS.TYPING_START, onTypingStart);
    socket.on(SOCKET_EVENTS.TYPING_STOP, onTypingStop);
    socket.on(SOCKET_EVENTS.UNREAD_COUNTS, onUnreadCounts);
    socket.on(SOCKET_EVENTS.UNREAD_UPDATED, onUnreadUpdated);

    if (socket.connected) {
      onConnect();
    }

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off(SOCKET_EVENTS.ONLINE_USERS, onOnlineUsers);
      socket.off(SOCKET_EVENTS.TYPING_START, onTypingStart);
      socket.off(SOCKET_EVENTS.TYPING_STOP, onTypingStop);
      socket.off(SOCKET_EVENTS.UNREAD_COUNTS, onUnreadCounts);
      socket.off(SOCKET_EVENTS.UNREAD_UPDATED, onUnreadUpdated);

      Object.values(typingTimeouts.current).forEach(clearTimeout);
      typingTimeouts.current = {};
      disconnectSocket();
    };
  }, [username]);

  const emitTyping = useCallback(
    (isTyping, payload) => {
      const socket = getSocket();
      if (!socket || !isConnected) return;
      if (isTyping) {
        socket.emit(SOCKET_EVENTS.TYPING_START, payload);
      } else {
        socket.emit(SOCKET_EVENTS.TYPING_STOP, payload);
      }
    },
    [isConnected]
  );

  const emitMessage = useCallback(
    (content, recipient, groupId, clientId) => {
      const socket = getSocket();
      if (!socket || !isConnected) return null;
      return new Promise((resolve) => {
        socket.emit(
          SOCKET_EVENTS.MESSAGE_SEND,
          { content, recipient, groupId, clientId },
          (response) => {
            resolve(response);
          }
        );
      });
    },
    [isConnected]
  );

  const markSeen = useCallback(
    (conversationId, groupId, recipient) => {
      const socket = getSocket();
      if (!socket || !isConnected) return;
      socket.emit(SOCKET_EVENTS.MESSAGES_SEEN, { conversationId, groupId, recipient });
    },
    [isConnected]
  );

  return (
    <SocketContext.Provider
      value={{
        isConnected,
        onlineUsers,
        typingUsers,
        unreadCounts,
        emitTyping,
        emitMessage,
        markSeen,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
}
