import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  joinBranchRoom: (branchId: string) => void;
  leaveBranchRoom: (branchId: string) => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const { user, token } = useAuth();

  useEffect(() => {
    // If running in development with Vite proxy or production with relative path
    const serverUrl = import.meta.env.VITE_SOCKET_URL || window.location.origin;
    
    const newSocket = io(serverUrl, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    newSocket.on('connect', () => {
      setIsConnected(true);
      if (user?.id) {
        newSocket.emit('join:user', user.id);
      }
      if (user?.staffBranchId) {
        newSocket.emit('join:branch', user.staffBranchId);
      }
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [user?.id, user?.staffBranchId, token]);

  const joinBranchRoom = (branchId: string) => {
    if (socket && isConnected) {
      socket.emit('join:branch', branchId);
    }
  };

  const leaveBranchRoom = (branchId: string) => {
    if (socket && isConnected) {
      socket.emit('leave:branch', branchId);
    }
  };

  return (
    <SocketContext.Provider value={{ socket, isConnected, joinBranchRoom, leaveBranchRoom }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};
