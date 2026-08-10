import { IsNull } from 'typeorm';
import { AppDataSource } from '../config/data-source';
import { RefreshToken } from '../entities/RefreshToken.entity';

export class RefreshTokenRepository {
  private repo = AppDataSource.getRepository(RefreshToken);

  findByHash(tokenHash: string) {
    return this.repo.findOneBy({ tokenHash });
  }

  create(data: Partial<RefreshToken>) {
    const token = this.repo.create(data);
    return this.repo.save(token);
  }

  revoke(id: string, replacedByTokenId?: string) {
    return this.repo.update(id, { revokedAt: new Date(), ...(replacedByTokenId ? { replacedByTokenId } : {}) });
  }

  revokeAllForUser(userId: string) {
    return this.repo.update({ userId, revokedAt: IsNull() }, { revokedAt: new Date() });
  }
}

export const refreshTokenRepository = new RefreshTokenRepository();
