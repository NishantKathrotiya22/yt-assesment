import 'reflect-metadata';
import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import pinoHttp from 'pino-http';
import { logger } from './config/logger';
import routes from './routes';
import { errorHandler } from './middlewares/error-handler';
import { ApiError } from './utils/ApiError';

export function createApp(): Express {
  const app = express();

  app.use(helmet());
  app.use(cors());
  app.use(express.json({ limit: '1mb' }));
  app.use(pinoHttp({ logger }));

  app.get('/health', (_req, res) => {
    res.json({ success: true, data: { status: 'ok' } });
  });

  app.use('/api/v1', routes);

  app.use((_req, _res, next) => next(new ApiError('ROUTE_NOT_FOUND')));

  app.use(errorHandler);

  return app;
}
