import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';

let io: SocketIOServer | null = null;

export function initSocketServer(server: HttpServer): SocketIOServer {
  io = new SocketIOServer(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
    pingInterval: 10000,
    pingTimeout: 5000,
  });

  io.use((socket: Socket, next) => {
    const token = socket.handshake.auth?.token;
    if (token) {
      try {
        const decoded = jwt.verify(token, env.JWT_SECRET) as any;
        (socket as any).user = decoded;
      } catch (err) {
        // Allow unauthenticated connection (e.g. public queue display)
      }
    }
    next();
  });

  io.on('connection', (socket: Socket) => {
    const user = (socket as any).user;

    if (user?.userId) {
      socket.join(`user:${user.userId}`);
    }

    socket.on('join:branch', (branchId: string) => {
      socket.join(`branch:${branchId}`);
    });

    socket.on('leave:branch', (branchId: string) => {
      socket.leave(`branch:${branchId}`);
    });

    socket.on('join:user', (userId: string) => {
      socket.join(`user:${userId}`);
    });

    socket.on('disconnect', () => {
      // Disconnect cleanly
    });
  });

  return io;
}

export function getIO(): SocketIOServer {
  if (!io) {
    throw new Error('Socket.IO is not initialized yet.');
  }
  return io;
}
