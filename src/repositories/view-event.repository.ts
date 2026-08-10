import { MoreThan } from 'typeorm';
import { AppDataSource } from '../config/data-source';
import { ViewEvent } from '../entities/ViewEvent.entity';

export interface ViewsByDayRow {
  date: string;
  views: number;
}

export class ViewEventRepository {
  private repo = AppDataSource.getRepository(ViewEvent);

  findRecentByVideoAndUser(videoId: string, userId: string, since: Date) {
    return this.repo.findOneBy({ videoId, userId, createdAt: MoreThan(since) });
  }

  create(data: Partial<ViewEvent>) {
    const event = this.repo.create(data);
    return this.repo.save(event);
  }

  async countDistinctViewersByVideo(videoId: string): Promise<number> {
    const result = await this.repo
      .createQueryBuilder('view')
      .select('COUNT(DISTINCT view.userId)', 'count')
      .where('view.videoId = :videoId', { videoId })
      .getRawOne<{ count: string }>();
    return parseInt(result?.count ?? '0', 10);
  }

  async viewsByDay(videoId: string, from: Date, to: Date): Promise<ViewsByDayRow[]> {
    const rows = await this.repo
      .createQueryBuilder('view')
      .select("TO_CHAR(DATE_TRUNC('day', view.createdAt), 'YYYY-MM-DD')", 'date')
      .addSelect('COUNT(*)', 'views')
      .where('view.videoId = :videoId', { videoId })
      .andWhere('view.createdAt BETWEEN :from AND :to', { from, to })
      .groupBy("DATE_TRUNC('day', view.createdAt)")
      .orderBy("DATE_TRUNC('day', view.createdAt)", 'ASC')
      .getRawMany<{ date: string; views: string }>();
    return rows.map((r) => ({ date: r.date, views: parseInt(r.views, 10) }));
  }
}

export const viewEventRepository = new ViewEventRepository();
