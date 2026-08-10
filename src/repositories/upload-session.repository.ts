import { AppDataSource } from '../config/data-source';
import { UploadSession, UploadSessionStatus } from '../entities/UploadSession.entity';

export class UploadSessionRepository {
  private repo = AppDataSource.getRepository(UploadSession);

  findById(id: string) {
    return this.repo.findOneBy({ id });
  }

  create(data: Partial<UploadSession>) {
    const session = this.repo.create(data);
    return this.repo.save(session);
  }

  updateStatus(id: string, status: UploadSessionStatus) {
    return this.repo.update(id, { status });
  }
}

export const uploadSessionRepository = new UploadSessionRepository();
