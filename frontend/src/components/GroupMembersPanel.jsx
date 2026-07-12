import { useSocket } from '../hooks/useSocket';

export default function GroupMembersPanel({ members = [], creator }) {
  const { onlineUsers } = useSocket();

  return (
    <div className="border-b border-gray-200 bg-gray-50 px-4 py-2">
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 mr-1">
          Members:
        </span>
        {members.map((member) => {
          const isOnline = onlineUsers.includes(member);
          const isCreator = member === creator;
          return (
            <span
              key={member}
              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs ${
                isCreator
                  ? 'bg-indigo-100 text-indigo-700'
                  : isOnline
                  ? 'bg-green-50 text-green-700'
                  : 'bg-gray-100 text-gray-500'
              }`}
            >
              {isOnline && <span className="h-1.5 w-1.5 rounded-full bg-green-500" />}
              {member}
              {isCreator && <span className="text-[9px] opacity-70">(creator)</span>}
            </span>
          );
        })}
      </div>
    </div>
  );
}
