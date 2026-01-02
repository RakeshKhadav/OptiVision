import dotenv from 'dotenv';
import { app } from './app.js';
import { connectDB } from './db/index.js';
import { createServer } from 'http';
import { initSocket } from './services/socketService.js';

// Type declaration for BigInt JSON serialization and Socket.IO global
declare global {
  interface BigInt {
    toJSON(): string;
  }
}

// Add BigInt serialization support
BigInt.prototype.toJSON = function () {
  return this.toString();
};

dotenv.config();

connectDB()
  .then(() => {
    const PORT = process.env.PORT || 3000;
    const server = createServer(app);

    // Initialize Socket.IO
    initSocket(server);

    // Start the server
    server.listen(PORT, () => {
      console.log(`✅ Server is running on http://localhost:${PORT}`);
      console.log(`🔌 Socket.io server initialized`);
    });

    // Error handling for server-level errors
    server.on('error', (error) => {
      console.error('❌ Failed to start server:', error);
      process.exit(1);
    });
  })
  .catch((error) => {
    console.error('❌ Database connection failed:', error.message);
  });
