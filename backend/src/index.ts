import dotenv from 'dotenv';
import { app } from './app';
import { connectDB } from './db/index.js';
import { createServer } from 'http';

dotenv.config();

connectDB()
  .then(() => {
    const PORT = process.env.PORT || 8080;
    const server = createServer(app);

    server.listen(PORT, () => {
      console.log(`✅ Server is running on http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error('❌ Database connection failed:', error.message);
  });
