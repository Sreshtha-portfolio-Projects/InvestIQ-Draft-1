import express, { Application } from 'express';
import config from './config';
import logger from './utils/logger';
import { setupMiddleware } from './middleware/setup';
import { errorHandler, notFound } from './middleware/errorHandler';
import routes from './routes';
import { testConnection } from './db/supabase';

const app: Application = express();

setupMiddleware(app);

app.use('/api', routes);

app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'InvestIQ API Server',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      auth: '/api/auth',
      stocks: '/api/stocks',
      market: '/api/market',
      ai: '/api/ai',
      screener: '/api/screener',
      watchlist: '/api/watchlist',
      earnings: '/api/earnings',
    },
  });
});

app.use(notFound);
app.use(errorHandler);

const startServer = async () => {
  try {
    const dbConnected = await testConnection();
    
    if (!dbConnected) {
      logger.warn('Database connection failed, but server will start anyway');
    }

    app.listen(config.port, () => {
      logger.info(`🚀 Server running on port ${config.port}`);
      logger.info(`📊 Environment: ${config.nodeEnv}`);
      logger.info(`🔗 API: http://localhost:${config.port}/api`);
      logger.info(`💚 Health Check: http://localhost:${config.port}/api/health`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

export default app;
