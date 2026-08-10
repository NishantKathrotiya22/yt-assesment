import 'reflect-metadata';
import { AppDataSource } from './config/data-source';
import { env } from './config/env';
import { logger } from './config/logger';
import { createApp } from './app';

async function bootstrap() {
  await AppDataSource.initialize();
  logger.info('Database connection established');

  const app = createApp();
  app.listen(env.PORT, () => {
    logger.info(`Server listening on port ${env.PORT}`);
  });
}

bootstrap().catch((err) => {
  logger.error({ err }, 'Failed to start server');
  process.exit(1);
});
