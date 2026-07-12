export default function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center text-gray-400">
      <div className="mb-4 text-6xl">...</div>
      <p className="text-lg font-medium">No messages yet</p>
      <p className="mt-1 text-sm">Send a message to start the conversation</p>
    </div>
  );
}
