import 'reflect-metadata';
import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import pinoHttp from 'pino-http';
import { apiReference } from '@scalar/express-api-reference';
import { logger } from './config/logger';
import { openApiDocument } from './config/openapi';
import routes from './routes';
import { errorHandler } from './middlewares/error-handler';
import { ApiError } from './utils/ApiError';

export function createApp(): Express {
  const app = express();

  // Helmet's default CSP blocks the CDN script Scalar's docs page loads — relax it there only.
  app.use(helmet({ contentSecurityPolicy: false }));
  app.use(cors());
  app.use(express.json({ limit: '1mb' }));
  app.use(pinoHttp({ logger }));

  app.get('/health', (_req, res) => {
    res.json({ success: true, data: { status: 'ok' } });
  });

  app.get('/openapi.json', (_req, res) => {
    res.json(openApiDocument);
  });

  app.use(
    '/docs',
    apiReference({
      url: '/openapi.json',
      theme: 'purple',
      pageTitle: 'YT Server API Reference',
    })
  );

  app.use('/api/v1', routes);

  app.use((_req, _res, next) => next(new ApiError('ROUTE_NOT_FOUND')));

  app.use(errorHandler);

  return app;
}
