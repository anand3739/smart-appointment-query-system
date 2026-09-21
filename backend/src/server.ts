import http from 'http';
import { app } from './app';
import { env } from './config/env';
import { initSocketServer } from './realtime/socket.server';
import { initializeDatabase } from './config/db';
import { startBackgroundJobs } from './jobs';

const server = http.createServer(app);

// Initialize WebSockets
initSocketServer(server);

// Start server
server.listen(env.PORT, async () => {
  console.log(`=======================================================`);
  console.log(`🚀 Smart Appointment & Queue API running on port ${env.PORT}`);
  console.log(`📖 Swagger Documentation available at http://localhost:${env.PORT}/api/docs`);
  console.log(`=======================================================`);

  // Initialize DB & Background Jobs
  await initializeDatabase();
  startBackgroundJobs();
});

// Graceful Shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
  });
});
