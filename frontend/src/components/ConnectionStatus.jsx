export default function ConnectionStatus({ isConnected }) {
  return (
    <div className="flex items-center gap-1.5 text-xs">
      <span
        className={`inline-block h-2 w-2 rounded-full ${
          isConnected ? 'bg-green-500' : 'bg-red-500'
        }`}
      />
      <span className="text-gray-500">
        {isConnected ? 'Connected' : 'Disconnected'}
      </span>
    </div>
  );
}
