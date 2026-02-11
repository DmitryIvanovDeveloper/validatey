// Load .env from project root (same as painkiller-assistent)
import 'dotenv/config';
import { createServer } from 'http';
import app from './app';
import { logEnvStatus } from './infrastructure/config/env-check';

const PORT = parseInt(process.env.PORT || '8080', 10);

// Create HTTP server
const server = createServer(app);

server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Validatey Backend Server running on port ${PORT}`);
  console.log(`🌐 API endpoint: http://localhost:${PORT}`);
  logEnvStatus();
});

server.on('error', (error: Error) => {
  console.error('❌ Server error:', error);
  process.exit(1);
});

process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});
