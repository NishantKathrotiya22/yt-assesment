import { AppDataSource } from '../config/data-source';
import { Reaction, ReactionType } from '../entities/Reaction.entity';

export class ReactionRepository {
  private repo = AppDataSource.getRepository(Reaction);

  findByVideoAndUser(videoId: string, userId: string) {
    return this.repo.findOneBy({ videoId, userId });
  }

  create(data: Partial<Reaction>) {
    const reaction = this.repo.create(data);
    return this.repo.save(reaction);
  }

  updateType(id: string, type: ReactionType) {
    return this.repo.update(id, { type });
  }

  delete(id: string) {
    return this.repo.delete(id);
  }
}

export const reactionRepository = new ReactionRepository();
