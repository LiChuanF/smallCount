import type { InferInsertModel, InferSelectModel } from 'drizzle-orm';
import { and, eq, gte, lte, sum } from 'drizzle-orm';
import { budgets, transactions } from '../schema';
import { BaseRepository } from './BaseRepository';

type Budget = InferSelectModel<typeof budgets>;
type NewBudget = InferInsertModel<typeof budgets>;

export class BudgetRepository extends BaseRepository<Budget> {
  constructor() {
    super(budgets);
  }

  // 创建预算
  async create(data: Omit<NewBudget, 'id' | 'createdAt' | 'updatedAt'>): Promise<Budget> {
    const id = this.generateId();
    const [newBudget] = await this.db.insert(budgets).values({
      ...data,
      id,
      updatedAt: new Date(),
    }).returning();
    return newBudget;
  }

  // 获取账户的所有预算
  async findByAccount(accountId: string): Promise<Budget[]> {
    return await this.db.query.budgets.findMany({
      where: eq(budgets.accountId, accountId),
      orderBy: (budgets, { desc }) => [desc(budgets.year), desc(budgets.month || 0), desc(budgets.week || 0)],
    });
  }

  // 获取指定周期和时间的预算
  async findByPeriod(
    accountId: string,
    period: 'daily' | 'weekly' | 'monthly' | 'yearly',
    year: number,
    month?: number,
    week?: number
  ): Promise<Budget[]> {
    const whereConditions = [
      eq(budgets.accountId, accountId),
      eq(budgets.period, period),
      eq(budgets.year, year),
      eq(budgets.isActive, true)
    ];

    if (month !== undefined && period !== 'yearly') {
      whereConditions.push(eq(budgets.month, month));
    }

    if (week !== undefined && period === 'weekly') {
      whereConditions.push(eq(budgets.week, week));
    }

    return await this.db.query.budgets.findMany({
      where: and(...whereConditions)
    });
  }



  // 更新预算
  async update(id: string, data: Partial<Omit<NewBudget, 'id' | 'accountId' | 'createdAt'>>): Promise<Budget | undefined> {
    const [updated] = await this.db.update(budgets)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(budgets.id, id))
      .returning();
    return updated;
  }

  // 删除预算（软删除）
  async delete(id: string): Promise<void> {
    await this.db.update(budgets)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(budgets.id, id));
  }

  // 获取预算使用情况
  async getBudgetUsage(
    accountId: string,
    budgetId: string,
    startDate: Date,
    endDate: Date
  ): Promise<{ budget: Budget; usedAmount: number; percentage: number } | null> {
    // 1. 获取预算信息
    const budget = await this.db.query.budgets.findFirst({
      where: and(eq(budgets.id, budgetId), eq(budgets.accountId, accountId))
    });

    if (!budget) return null;

    // 2. 查询指定时间内的支出总额
    const expenseConditions = [
      eq(transactions.accountId, accountId),
      eq(transactions.type, 'expense'),
      gte(transactions.transactionDate, startDate),
      lte(transactions.transactionDate, endDate)
    ];

    // 使用聚合查询计算支出总额
    const result = await this.db.select({
      usedAmount: sum(transactions.amount).mapWith(Number)
    })
      .from(transactions)
      .where(and(...expenseConditions));

    const usedAmount = result[0]?.usedAmount || 0;
    const percentage = budget.amount > 0 ? (usedAmount / budget.amount) * 100 : 0;

    return {
      budget,
      usedAmount,
      percentage
    };
  }

  // 获取所有预算及使用情况
  async getAllBudgetsWithUsage(
    accountId: string,
    year: number,
    month: number
  ): Promise<Array<{ budget: Budget; usedAmount: number; percentage: number }>> {
    // 获取当月所有活跃预算
    const monthlyBudgets = await this.findByPeriod(accountId, 'monthly', year, month);
    
    // 计算当月的起始和结束日期
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);
    
    // 查询指定时间内的总支出
    const result = await this.db.select({
      usedAmount: sum(transactions.amount).mapWith(Number)
    })
      .from(transactions)
      .where(and(
        eq(transactions.accountId, accountId),
        eq(transactions.type, 'expense'),
        gte(transactions.transactionDate, startDate),
        lte(transactions.transactionDate, endDate)
      ));
    
    const totalUsedAmount = result[0]?.usedAmount || 0;
    
    // 计算每个预算的使用情况
    const budgetsWithUsage = monthlyBudgets.map(budget => {
      const percentage = budget.amount > 0 ? (totalUsedAmount / budget.amount) * 100 : 0;
      
      return {
        budget,
        usedAmount: totalUsedAmount,
        percentage
      };
    });

    return budgetsWithUsage;
  }

  // 批量创建或更新预算
  async upsertBudgets(accountId: string, budgetData: Array<{
    amount: number;
    period: 'daily' | 'weekly' | 'monthly' | 'yearly';
    year: number;
    month?: number;
    week?: number;
  }>): Promise<void> {
    await this.db.transaction(async (tx) => {
      for (const data of budgetData) {
        // 检查是否已存在相同的预算
        const existingBudget = await tx.query.budgets.findFirst({
          where: and(
            eq(budgets.accountId, accountId),
            eq(budgets.period, data.period),
            eq(budgets.year, data.year),
            data.month !== undefined ? eq(budgets.month, data.month) : undefined,
            data.week !== undefined ? eq(budgets.week, data.week) : undefined
          )
        });

        if (existingBudget) {
          // 更新现有预算
          await tx.update(budgets)
            .set({ amount: data.amount, updatedAt: new Date(), isActive: true })
            .where(eq(budgets.id, existingBudget.id));
        } else {
          // 创建新预算
          await tx.insert(budgets).values({
            id: this.generateId(),
            accountId,
            ...data,
            isActive: true,
            updatedAt: new Date(),
          });
        }
      }
    });
  }
}