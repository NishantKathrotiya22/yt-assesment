import { FindOptionsOrder, FindOptionsWhere, ILike, In, Not } from 'typeorm';
import { AppDataSource } from '../config/data-source';
import { Video, VideoCategory } from '../entities/Video.entity';

export type VideoSort = 'recent' | 'popular';

export class VideoRepository {
  private repo = AppDataSource.getRepository(Video);

  findById(id: string) {
    return this.repo.findOne({ where: { id }, relations: { owner: true } });
  }

  async list(page: number, limit: number, sort: VideoSort, search?: string) {
    const order: FindOptionsOrder<Video> = sort === 'popular' ? { viewCount: 'DESC' } : { createdAt: 'DESC' };
    // An array of where-clauses is OR'd by TypeORM — matches title OR description.
    const where: FindOptionsWhere<Video>[] | undefined = search
      ? [{ title: ILike(`%${search}%`) }, { description: ILike(`%${search}%`) }]
      : undefined;
    const [items, total] = await this.repo.findAndCount({
      where,
      relations: { owner: true },
      order,
      skip: (page - 1) * limit,
      take: limit,
    });
    return { items, total };
  }

  async listByOwner(ownerId: string, page: number, limit: number) {
    const [items, total] = await this.repo.findAndCount({
      where: { ownerId },
      relations: { owner: true },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { items, total };
  }

  findRecommendedByCategory(category: VideoCategory, excludeId: string, limit: number) {
    return this.repo.find({
      where: { category, id: Not(excludeId) },
      relations: { owner: true },
      order: { viewCount: 'DESC', createdAt: 'DESC' },
      take: limit,
    });
  }

  findMostViewed(excludeIds: string[], limit: number) {
    return this.repo.find({
      where: { id: Not(In(excludeIds)) },
      relations: { owner: true },
      order: { viewCount: 'DESC', createdAt: 'DESC' },
      take: limit,
    });
  }

  create(data: Partial<Video>) {
    const video = this.repo.create(data);
    return this.repo.save(video);
  }

  update(id: string, data: Partial<Video>) {
    return this.repo.update(id, data);
  }

  softDelete(id: string) {
    return this.repo.softDelete(id);
  }

  incrementViewCount(id: string) {
    return this.repo.increment({ id }, 'viewCount', 1);
  }

  incrementLikeCount(id: string, delta: number) {
    return this.repo.increment({ id }, 'likeCount', delta);
  }

  incrementDislikeCount(id: string, delta: number) {
    return this.repo.increment({ id }, 'dislikeCount', delta);
  }

  incrementCommentCount(id: string, delta: number) {
    return this.repo.increment({ id }, 'commentCount', delta);
  }

  countByOwner(ownerId: string) {
    return this.repo.count({ where: { ownerId } });
  }

  countAll() {
    return this.repo.count();
  }

  async sumViewCount(): Promise<number> {
    const result = await this.repo
      .createQueryBuilder('video')
      .select('COALESCE(SUM(video.viewCount), 0)', 'sum')
      .getRawOne<{ sum: string }>();
    return parseInt(result?.sum ?? '0', 10);
  }
}

export const videoRepository = new VideoRepository();
