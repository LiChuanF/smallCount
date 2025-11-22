import type { InferInsertModel, InferSelectModel } from 'drizzle-orm';
import { and, desc, eq, ilike } from 'drizzle-orm';
import { accounts, tags, transactions } from '../schema';
import { BaseRepository } from './BaseRepository';

type Tag = InferSelectModel<typeof tags>;
type NewTag = InferInsertModel<typeof tags>;

export class TagRepository extends BaseRepository<Tag> {
  constructor() {
    super(tags);
  }

  // 创建标签
  async create(data: Omit<NewTag, 'id' | 'createdAt'>): Promise<Tag> {
    const id = this.generateId();
    const [newTag] = await this.db.insert(tags).values({
      ...data,
      id,
      createdAt: new Date()
    }).returning();
    return newTag;
  }

  // 获取交易的所有标签
  async findByTransaction(transactionId: string): Promise<Tag[]> {
    return await this.db.query.tags.findMany({
      where: eq(tags.transactionId, transactionId),
      orderBy: (tags, { asc }) => [asc(tags.name)]
    });
  }

  // 通过ID获取标签
  async findById(id: string): Promise<Tag | undefined> {
    return await this.db.query.tags.findFirst({
      where: eq(tags.id, id)
    });
  }

  // 更新标签
  async update(id: string, data: Partial<Omit<NewTag, 'id' | 'transactionId' | 'createdAt'>>): Promise<Tag | undefined> {
    const [updated] = await this.db.update(tags)
      .set(data)
      .where(eq(tags.id, id))
      .returning();
    return updated;
  }

  // 删除标签
  async delete(id: string): Promise<void> {
    await this.db.delete(tags)
      .where(eq(tags.id, id));
  }

  // 为交易批量创建标签
  async createTagsForTransaction(transactionId: string, tagNames: string[]): Promise<Tag[]> {
    // 先删除该交易的所有现有标签
    await this.db.delete(tags)
      .where(eq(tags.transactionId, transactionId));

    // 创建新的标签
    if (tagNames.length > 0) {
      const tagRecords = tagNames.map(name => ({
        id: this.generateId(),
        transactionId,
        name,
        color: this.generateRandomColor(),
        createdAt: new Date()
      }));

      const insertedTags = await this.db.insert(tags).values(tagRecords).returning();
      return insertedTags;
    }

    return [];
  }

  // 根据标签名查找交易的标签
  async findTagByNameForTransaction(transactionId: string, name: string): Promise<Tag | undefined> {
    return await this.db.query.tags.findFirst({
      where: and(eq(tags.transactionId, transactionId), eq(tags.name, name))
    });
  }

  // 搜索用户交易的标签（通过账户关联）
  async searchUserTags(userId: string, keyword: string): Promise<Tag[]> {
    return await this.db.query.tags.findMany({
      where: and(
        eq(transactions.accountId, accounts.id),
        eq(accounts.userId, userId),
        eq(tags.transactionId, transactions.id),
        ilike(tags.name, `%${keyword}%`)
      ),
      orderBy: (tags, { asc }) => [asc(tags.name)]
    });
  }

  // 生成随机颜色
  private generateRandomColor(): string {
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
      '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
      '#F8C471', '#82E0AA', '#F1948A', '#AED6F1', '#D7BDE2'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }
}
