// client/src/hooks/useSocket.ts
// Socket.IO connection hook for React

import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { ServerToClientEvents, ClientToServerEvents } from '../types';

type SocketType = Socket<ServerToClientEvents, ClientToServerEvents>;

// Use environment variable or fallback to localhost for development
const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export function useSocket(): SocketType | null {
  const [socket, setSocket] = useState<SocketType | null>(null);

  useEffect(() => {
    console.log('🔌 Connecting to:', SOCKET_URL);
    
    const socketInstance = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
    }) as SocketType;

    socketInstance.on('connect', () => {
      console.log('✅ Connected to Pitch Perfect server:', socketInstance.id);
    });

    socketInstance.on('disconnect', () => {
      console.log('❌ Disconnected from server');
    });

    socketInstance.on('connect_error', (error) => {
      console.error('🔴 Connection error:', error.message);
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.close();
    };
  }, []);

  return socket;
}
