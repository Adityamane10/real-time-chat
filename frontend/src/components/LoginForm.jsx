import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { USERNAME_MAX_LENGTH } from '../constants';

export default function LoginForm() {
  const { login } = useAuth();
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    const trimmed = name.trim();

    if (!trimmed) {
      setError('Username is required');
      return;
    }

    if (trimmed.length > USERNAME_MAX_LENGTH) {
      setError(`Username cannot exceed ${USERNAME_MAX_LENGTH} characters`);
      return;
    }

    login(trimmed);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-500 to-purple-600 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl">
        <h1 className="mb-2 text-center text-3xl font-bold text-gray-900">
          Welcome
        </h1>
        <p className="mb-8 text-center text-sm text-gray-500">
          Enter your username to join the chat
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="username" className="sr-only">
              Username
            </label>
            <input
              id="username"
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError('');
              }}
              placeholder="Enter your username"
              maxLength={USERNAME_MAX_LENGTH}
              autoFocus
              className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 placeholder-gray-400 transition-colors focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
            />
            {error && (
              <p className="mt-1 text-sm text-red-500" role="alert">
                {error}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={!name.trim()}
            className="w-full rounded-lg bg-indigo-500 px-4 py-3 font-medium text-white transition-colors hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Join Chat
          </button>
        </form>
      </div>
    </div>
  );
}
