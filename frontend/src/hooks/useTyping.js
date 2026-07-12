import { useRef, useCallback } from 'react';
import { useSocket } from './useSocket';

export function useTyping(payload) {
  const { emitTyping } = useSocket();
  const typingTimeout = useRef(null);
  const isTyping = useRef(false);

  const handleTyping = useCallback(() => {
    if (!isTyping.current) {
      isTyping.current = true;
      emitTyping(true, payload);
    }

    if (typingTimeout.current) {
      clearTimeout(typingTimeout.current);
    }

    typingTimeout.current = setTimeout(() => {
      isTyping.current = false;
      emitTyping(false, payload);
    }, 2000);
  }, [emitTyping, payload]);

  const stopTyping = useCallback(() => {
    if (typingTimeout.current) {
      clearTimeout(typingTimeout.current);
    }
    if (isTyping.current) {
      isTyping.current = false;
      emitTyping(false, payload);
    }
  }, [emitTyping, payload]);

  return { handleTyping, stopTyping };
}
