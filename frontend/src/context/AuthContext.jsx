import { createContext, useState, useCallback, useEffect } from 'react';
import { USERNAME_MAX_LENGTH } from '../constants';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [username, setUsername] = useState(() => {
    return localStorage.getItem('chat_username') || '';
  });
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    return !!localStorage.getItem('chat_username');
  });

  useEffect(() => {
    if (username) {
      localStorage.setItem('chat_username', username);
    } else {
      localStorage.removeItem('chat_username');
    }
  }, [username]);

  const login = useCallback((name) => {
    const trimmed = name.trim().slice(0, USERNAME_MAX_LENGTH);
    if (!trimmed) return false;
    setUsername(trimmed);
    setIsLoggedIn(true);
    return true;
  }, []);

  const logout = useCallback(() => {
    setUsername('');
    setIsLoggedIn(false);
    localStorage.removeItem('chat_username');
  }, []);

  return (
    <AuthContext.Provider value={{ username, isLoggedIn, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
