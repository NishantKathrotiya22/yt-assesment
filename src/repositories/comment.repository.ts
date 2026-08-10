import { AppDataSource } from '../config/data-source';
import { Comment } from '../entities/Comment.entity';

export class CommentRepository {
  private repo = AppDataSource.getRepository(Comment);

  findById(id: string) {
    return this.repo.findOne({ where: { id }, relations: { user: true } });
  }

  async listByVideo(videoId: string, page: number, limit: number) {
    const [items, total] = await this.repo.findAndCount({
      where: { videoId },
      relations: { user: true },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { items, total };
  }

  create(data: Partial<Comment>) {
    const comment = this.repo.create(data);
    return this.repo.save(comment);
  }

  delete(id: string) {
    return this.repo.delete(id);
  }
}

export const commentRepository = new CommentRepository();
