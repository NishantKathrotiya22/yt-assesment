import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { env } from './env';
import { User } from '../entities/User.entity';
import { Video } from '../entities/Video.entity';
import { UploadSession } from '../entities/UploadSession.entity';
import { Reaction } from '../entities/Reaction.entity';
import { Comment } from '../entities/Comment.entity';
import { ViewEvent } from '../entities/ViewEvent.entity';
import { RefreshToken } from '../entities/RefreshToken.entity';

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: env.DATABASE_URL,
  ssl: env.isProduction || env.DATABASE_URL.includes('neon.tech') ? { rejectUnauthorized: false } : false,
  synchronize: false,
  logging: env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  entities: [User, Video, UploadSession, Reaction, Comment, ViewEvent, RefreshToken],
  migrations: ['src/migrations/*.ts'],
});
