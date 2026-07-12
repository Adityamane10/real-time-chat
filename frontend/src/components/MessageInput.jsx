import { useState, useCallback } from 'react';
import { MESSAGE_MAX_LENGTH } from '../constants';
import { useTyping } from '../hooks/useTyping';

export default function MessageInput({ onSend, disabled, recipient, groupId, groupName }) {
  const [text, setText] = useState('');
  const typingPayload = groupId ? { groupId } : recipient;
  const { handleTyping, stopTyping } = useTyping(typingPayload);

  const trimmed = text.trim();

  const submit = useCallback(() => {
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setText('');
    stopTyping();
  }, [trimmed, disabled, onSend, stopTyping]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  const handleChange = (e) => {
    const value = e.target.value;
    if (value.length <= MESSAGE_MAX_LENGTH) {
      setText(value);
    }
    if (value.trim()) {
      handleTyping();
    }
  };

  return (
    <div className="border-t border-gray-200 bg-white px-4 py-3">
      <div className="flex items-end gap-2">
        <div className="flex-1">
          <label htmlFor="message-input" className="sr-only">
            Type a message
          </label>
          <textarea
            id="message-input"
            value={text}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder={groupId ? `Message ${groupName || 'group'}` : recipient ? `Message ${recipient}` : 'Type a message'}
            rows={1}
            maxLength={MESSAGE_MAX_LENGTH}
            disabled={disabled}
            className="scrollbar-thin w-full resize-none rounded-xl border border-gray-300 px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 transition-colors focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 disabled:cursor-not-allowed disabled:bg-gray-50"
            style={{ maxHeight: '120px' }}
          />
          <div className="mt-1 text-right text-[10px] text-gray-400">
            {text.length}/{MESSAGE_MAX_LENGTH}
          </div>
        </div>

        <button
          onClick={submit}
          disabled={!trimmed || disabled}
          className="mb-5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-500 text-white transition-colors hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          aria-label="Send message"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="h-5 w-5"
          >
            <path d="M3.478 2.404a.75.75 0 0 0-.926.941l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.519 60.519 0 0 0 18.445-8.986.75.75 0 0 0 0-1.218A60.517 60.517 0 0 0 3.478 2.404Z" />
          </svg>
        </button>
      </div>
    </div>
  );
}
