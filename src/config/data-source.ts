import 'reflect-metadata';
import path from 'path';
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
  // __dirname-relative (not CWD-relative) so this resolves to src/migrations under ts-node
  // and dist/migrations from the compiled build — a hardcoded 'src/migrations/*.ts' path
  // still glob-matches in production (src/ ships alongside dist/), loading the raw .ts file
  // instead of the compiled .js one, which breaks on newer Node's native TS loader.
  migrations: [path.join(__dirname, '../migrations/*{.ts,.js}')],
});
