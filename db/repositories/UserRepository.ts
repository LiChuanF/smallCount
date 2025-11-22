import type { InferInsertModel, InferSelectModel } from 'drizzle-orm';
import { eq } from 'drizzle-orm';
import { users } from '../schema';
import { BaseRepository } from './BaseRepository';

type User = InferSelectModel<typeof users>;
type NewUser = InferInsertModel<typeof users>;

export class UserRepository extends BaseRepository<User> {
  constructor() {
    super(users);
  }

  async create(data: Omit<NewUser, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> {
    const id = this.generateId();
    const [newUser] = await this.db
      .insert(users)
      .values({
        ...data,
        id,
        updatedAt: new Date(),
      })
      .returning();
    return newUser;
  }

  async findByUsername(username: string): Promise<User | undefined> {
    return await this.db.query.users.findFirst({ where: eq(users.username, username) });
  }

  async findByEmail(email: string): Promise<User | undefined> {
    return await this.db.query.users.findFirst({ where: eq(users.email, email) });
  }

  async findAny(): Promise<User | undefined> {
    return await this.db.query.users.findFirst();
  }
}