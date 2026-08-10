import { AppDataSource } from '../config/data-source';
import { User } from '../entities/User.entity';

export class UserRepository {
  private repo = AppDataSource.getRepository(User);

  findById(id: string) {
    return this.repo.findOneBy({ id });
  }

  findByEmail(email: string) {
    return this.repo.findOneBy({ email });
  }

  /** `passwordHash` is `select: false` on the entity — this is the one place we explicitly pull it in. */
  findByEmailWithPassword(email: string) {
    return this.repo.findOne({
      where: { email },
      select: ['id', 'email', 'passwordHash', 'name', 'role', 'channelName', 'avatarUrl', 'createdAt', 'updatedAt'],
    });
  }

  create(data: Partial<User>) {
    const user = this.repo.create(data);
    return this.repo.save(user);
  }

  update(id: string, data: Partial<User>) {
    return this.repo.update(id, data);
  }

  countAll() {
    return this.repo.count();
  }
}

export const userRepository = new UserRepository();
