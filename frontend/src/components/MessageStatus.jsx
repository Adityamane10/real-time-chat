import { MESSAGE_STATUS } from '../constants';

function ClockIcon() {
  return (
    <svg className="h-3 w-3 text-indigo-300" viewBox="0 0 12 12" fill="currentColor">
      <path d="M6 0a6 6 0 1 0 0 12A6 6 0 0 0 6 0zm0 10.8A4.8 4.8 0 1 1 6 1.2a4.8 4.8 0 0 1 0 9.6z" />
      <path d="M6 2.4a.6.6 0 0 0-.6.6V6a.6.6 0 0 0 .6.6h2.4a.6.6 0 0 0 0-1.2H6.6V3a.6.6 0 0 0-.6-.6z" />
    </svg>
  );
}

function ErrorIcon() {
  return (
    <svg className="h-3 w-3 text-red-400" viewBox="0 0 12 12" fill="currentColor">
      <path d="M6 0a6 6 0 1 0 0 12A6 6 0 0 0 6 0zm0 10.8A4.8 4.8 0 1 1 6 1.2a4.8 4.8 0 0 1 0 9.6z" />
      <path d="M6 2.4a.6.6 0 0 1 .6.6v3.6a.6.6 0 1 1-1.2 0V3a.6.6 0 0 1 .6-.6z" />
      <circle cx="6" cy="8.7" r=".6" />
    </svg>
  );
}

function SingleTick({ colorClass }) {
  return (
    <svg className={`h-4 w-4 ${colorClass}`} viewBox="0 0 16 12" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 6.5L6 10.5L14 1.5" />
    </svg>
  );
}

function DoubleTick({ colorClass }) {
  return (
    <svg className={`h-4 w-5 ${colorClass}`} viewBox="0 0 22 12" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1.5 6.5L5 10L12 1.5" opacity="0.55" />
      <path d="M7 6.5L10.5 10L17.5 1.5" />
    </svg>
  );
}

export default function MessageStatus({ status }) {
  if (status === MESSAGE_STATUS.PENDING) {
    return <ClockIcon />;
  }
  if (status === MESSAGE_STATUS.FAILED) {
    return <ErrorIcon />;
  }
  if (status === MESSAGE_STATUS.SENT) {
    return <SingleTick colorClass="text-indigo-400" />;
  }
  if (status === MESSAGE_STATUS.DELIVERED) {
    return <DoubleTick colorClass="text-indigo-400" />;
  }
  if (status === MESSAGE_STATUS.SEEN) {
    return <DoubleTick colorClass="text-blue-600" />;
  }
  return null;
}
