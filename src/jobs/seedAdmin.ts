import 'reflect-metadata';
import { AppDataSource } from '../config/data-source';
import { env } from '../config/env';
import { userRepository } from '../repositories/user.repository';
import { hashPassword } from '../utils/password.util';
import { UserRole } from '../entities/User.entity';
import { logger } from '../config/logger';

async function seedAdmin() {
  await AppDataSource.initialize();

  const existing = await userRepository.findByEmail(env.SEED_ADMIN_EMAIL);
  if (existing) {
    logger.info(`Admin ${env.SEED_ADMIN_EMAIL} already exists, skipping seed.`);
    await AppDataSource.destroy();
    return;
  }

  const passwordHash = await hashPassword(env.SEED_ADMIN_PASSWORD);
  await userRepository.create({
    email: env.SEED_ADMIN_EMAIL,
    passwordHash,
    name: env.SEED_ADMIN_NAME,
    role: UserRole.ADMIN,
    channelName: env.SEED_ADMIN_NAME,
  });

  logger.info(`Admin account created for ${env.SEED_ADMIN_EMAIL}`);
  await AppDataSource.destroy();
}

seedAdmin().catch((err) => {
  logger.error({ err }, 'Failed to seed admin');
  process.exit(1);
});
