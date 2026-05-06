import express from 'express';
import type { Express } from 'express';
import cors from 'cors';
import { config } from './config/index.js';
import { testConnection } from './config/database.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import apiRoutes from './routes/index.js';

export function createApp(): Express {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  // Health check
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', environment: config.nodeEnv });
  });

  // API Routes
  app.use('/api', apiRoutes);

  // Error handling
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

export async function startServer(): Promise<void> {
  const app = createApp();

  // Test database connection
  const connected = await testConnection();
  if (!connected) {
    console.error('Failed to connect to database. Exiting...');
    process.exit(1);
  }

  // Start listening
  app.listen(config.port, () => {
    console.log(`🚀 Server running on port ${config.port}`);
    console.log(`Environment: ${config.nodeEnv}`);
  });
}
