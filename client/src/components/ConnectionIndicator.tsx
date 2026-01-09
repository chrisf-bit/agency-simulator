// client/src/components/ConnectionIndicator.tsx
// Connection status indicator - for WHITE header

interface ConnectionIndicatorProps {
  isConnected: boolean;
}

export default function ConnectionIndicator({ isConnected }: ConnectionIndicatorProps) {
  return (
    <div 
      className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${
        isConnected 
          ? 'bg-green-100 text-green-700' 
          : 'bg-red-100 text-red-700'
      }`}
      title={isConnected ? 'Connected to server' : 'Disconnected'}
    >
      <div className={`w-2 h-2 rounded-full ${
        isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'
      }`} />
      <span>{isConnected ? 'Live' : 'Offline'}</span>
    </div>
  );
}
