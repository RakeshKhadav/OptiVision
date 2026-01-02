import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';

let io: SocketIOServer | null = null;

export const initSocket = (server: HTTPServer) => {
  io = new SocketIOServer(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);

    // Send current system status to the new client
    socket.emit('initial_status', { systemReady: true });

    // Handle privacy mode toggle from frontend
    socket.on('toggle_settings', (data: { privacyMode: boolean }) => {
      console.log('Settings updated:', data);
      // Broadcast to all connected clients (including Python AI script)
      io!.emit('settings_update', data);
    });

    // High-frequency video stream relay from Python AI script
    // Uses volatile.emit to drop packets if client is slow (prevents backpressure at 30FPS)
    socket.on('stream_data', (data: { image: string; boxes: any }) => {
      // Broadcast to all OTHER clients (frontend dashboards)
      socket.volatile.broadcast.emit('stream_feed', data);
    });

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.id}`);
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized!');
  }
  return io;
};
