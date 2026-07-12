import { useRef, useEffect, useCallback, useState } from 'react';

export function useAutoScroll(dependency) {
  const containerRef = useRef(null);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [newMessageIndicator, setNewMessageIndicator] = useState(false);

  const scrollToBottom = useCallback((smooth = true) => {
    const container = containerRef.current;
    if (container) {
      container.scrollTo({
        top: container.scrollHeight,
        behavior: smooth ? 'smooth' : 'auto',
      });
      setIsAtBottom(true);
      setNewMessageIndicator(false);
    }
  }, []);

  useEffect(() => {
    if (isAtBottom) {
      scrollToBottom();
    } else if (dependency) {
      setNewMessageIndicator(true);
    }
  }, [dependency, isAtBottom, scrollToBottom]);

  const handleScroll = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    const threshold = 100;
    const atBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight < threshold;

    setIsAtBottom(atBottom);
    if (atBottom) {
      setNewMessageIndicator(false);
    }
  }, []);

  return {
    containerRef,
    isAtBottom,
    newMessageIndicator,
    scrollToBottom,
    handleScroll,
    setNewMessageIndicator,
  };
}
