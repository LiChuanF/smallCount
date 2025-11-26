import type { InferInsertModel } from 'drizzle-orm';
import { BudgetRepository } from '../repositories/BudgetRepository';
import { budgets } from '../schema';

type NewBudget = InferInsertModel<typeof budgets>;

const budgetRepo = new BudgetRepository();

export const BudgetService = {
  /**
   * 创建预算
   * @param budgetData - 预算数据
   * @returns 创建的预算对象
   */
  async createBudget(budgetData: Omit<NewBudget, 'id' | 'createdAt' | 'updatedAt'>) {
    // 业务规则校验
    if (!budgetData.accountId || budgetData.accountId.trim().length === 0) {
      throw new Error('账户ID不能为空');
    }
    
    if (!budgetData.period || !['daily', 'weekly', 'monthly', 'yearly'].includes(budgetData.period)) {
      throw new Error('预算周期必须为 daily, weekly, monthly 或 yearly');
    }
    
    if (budgetData.amount <= 0) {
      throw new Error('预算金额必须大于0');
    }
    
    if (budgetData.year < 2000 || budgetData.year > 2100) {
      throw new Error('年份必须在2000-2100之间');
    }
    
    // 验证周期相关的参数
    if (budgetData.period === 'monthly' && (!budgetData.month || budgetData.month < 1 || budgetData.month > 12)) {
      throw new Error('月度预算必须指定有效的月份（1-12）');
    }
    
    if (budgetData.period === 'weekly' && (!budgetData.week || budgetData.week < 1 || budgetData.week > 53)) {
      throw new Error('周度预算必须指定有效的周数（1-53）');
    }
    
    return await budgetRepo.create(budgetData);
  },

  /**
   * 获取账户的所有预算
   * @param accountId - 账户ID
   * @returns 预算列表
   */
  async getBudgetsByAccount(accountId: string) {
    if (!accountId || accountId.trim().length === 0) {
      throw new Error('账户ID不能为空');
    }
    
    return await budgetRepo.findByAccount(accountId);
  },

  /**
   * 获取指定周期和时间的预算
   * @param accountId - 账户ID
   * @param period - 预算周期
   * @param year - 年份
   * @param month - 月份（可选）
   * @param week - 周数（可选）
   * @returns 预算列表
   */
  async getBudgetsByPeriod(
    accountId: string,
    period: 'daily' | 'weekly' | 'monthly' | 'yearly',
    year: number,
    month?: number,
    week?: number
  ) {
    if (!accountId || accountId.trim().length === 0) {
      throw new Error('账户ID不能为空');
    }
    
    if (!['daily', 'weekly', 'monthly', 'yearly'].includes(period)) {
      throw new Error('预算周期必须为 daily, weekly, monthly 或 yearly');
    }
    
    if (year < 2000 || year > 2100) {
      throw new Error('年份必须在2000-2100之间');
    }
    
    if (period === 'monthly' && (!month || month < 1 || month > 12)) {
      throw new Error('月度预算必须指定有效的月份（1-12）');
    }
    
    if (period === 'weekly' && (!week || week < 1 || week > 53)) {
      throw new Error('周度预算必须指定有效的周数（1-53）');
    }
    
    return await budgetRepo.findByPeriod(accountId, period, year, month, week);
  },

  /**
   * 更新预算
   * @param id - 预算ID
   * @param updateData - 更新数据
   * @returns 更新后的预算
   */
  async updateBudget(
    id: string,
    updateData: Partial<Omit<NewBudget, 'id' | 'accountId' | 'createdAt'>>
  ) {
    if (!id || id.trim().length === 0) {
      throw new Error('预算ID不能为空');
    }
    
    if (updateData.amount !== undefined && updateData.amount <= 0) {
      throw new Error('预算金额必须大于0');
    }
    
    if (updateData.year !== undefined && (updateData.year < 2000 || updateData.year > 2100)) {
      throw new Error('年份必须在2000-2100之间');
    }
    
    
    return await budgetRepo.update(id, updateData);
  },

  /**
   * 删除预算（软删除）
   * @param id - 预算ID
   * @returns 删除结果
   */
  async deleteBudget(id: string) {
    if (!id || id.trim().length === 0) {
      throw new Error('预算ID不能为空');
    }
    
    return await budgetRepo.delete(id);
  },

  /**
   * 获取预算使用情况
   * @param accountId - 账户ID
   * @param budgetId - 预算ID
   * @param startDate - 开始日期
   * @param endDate - 结束日期
   * @returns 预算使用情况
   */
  async getBudgetUsage(
    accountId: string,
    budgetId: string,
    startDate: Date,
    endDate: Date
  ) {
    if (!accountId || accountId.trim().length === 0) {
      throw new Error('账户ID不能为空');
    }
    
    if (!budgetId || budgetId.trim().length === 0) {
      throw new Error('预算ID不能为空');
    }
    
    if (startDate >= endDate) {
      throw new Error('开始日期必须早于结束日期');
    }
    
    return await budgetRepo.getBudgetUsage(accountId, budgetId, startDate, endDate);
  },

  /**
   * 获取所有预算及使用情况
   * @param accountId - 账户ID
   * @param year - 年份
   * @param month - 月份
   * @returns 预算及使用情况列表
   */
  async getAllBudgetsWithUsage(accountId: string, year: number, month: number) {
    if (!accountId || accountId.trim().length === 0) {
      throw new Error('账户ID不能为空');
    }
    
    if (year < 2000 || year > 2100) {
      throw new Error('年份必须在2000-2100之间');
    }
    
    if (month < 1 || month > 12) {
      throw new Error('月份必须在1-12之间');
    }
    
    return await budgetRepo.getAllBudgetsWithUsage(accountId, year, month);
  },

  /**
   * 批量创建或更新预算
   * @param accountId - 账户ID
   * @param budgetData - 预算数据数组
   * @returns 操作结果
   */
  async upsertBudgets(
    accountId: string,
    budgetData: Array<{
      amount: number;
      period: 'daily' | 'weekly' | 'monthly' | 'yearly';
      year: number;
      month?: number;
      week?: number;
    }>
  ) {
    if (!accountId || accountId.trim().length === 0) {
      throw new Error('账户ID不能为空');
    }
    
    if (!budgetData || budgetData.length === 0) {
      throw new Error('预算数据不能为空');
    }
    
    if (budgetData.length > 100) {
      throw new Error('批量操作预算数量不能超过100个');
    }
    
    // 验证每个预算数据
    for (const [index, data] of budgetData.entries()) {
      if (data.amount <= 0) {
        throw new Error(`第${index + 1}个预算金额必须大于0`);
      }
      
      if (!['daily', 'weekly', 'monthly', 'yearly'].includes(data.period)) {
        throw new Error(`第${index + 1}个预算周期必须为 daily, weekly, monthly 或 yearly`);
      }
      
      if (data.year < 2000 || data.year > 2100) {
        throw new Error(`第${index + 1}个预算年份必须在2000-2100之间`);
      }
      
      if (data.period === 'monthly' && (!data.month || data.month < 1 || data.month > 12)) {
        throw new Error(`第${index + 1}个月度预算必须指定有效的月份（1-12）`);
      }
      
      if (data.period === 'weekly' && (!data.week || data.week < 1 || data.week > 53)) {
        throw new Error(`第${index + 1}个周度预算必须指定有效的周数（1-53）`);
      }
    }
    
    return await budgetRepo.upsertBudgets(accountId, budgetData);
  },

  /**
   * 获取月度预算概览
   * @param accountId - 账户ID
   * @param year - 年份
   * @param month - 月份
   * @returns 月度预算概览
   */
  async getMonthlyBudgetOverview(accountId: string, year: number, month: number) {
    const budgetsWithUsage = await this.getAllBudgetsWithUsage(accountId, year, month);
    
    const totalBudget = budgetsWithUsage.reduce((sum, item) => sum + item.budget.amount, 0);
    const totalUsed = budgetsWithUsage.reduce((sum, item) => sum + item.usedAmount, 0);
    const averagePercentage = budgetsWithUsage.length > 0 
      ? budgetsWithUsage.reduce((sum, item) => sum + item.percentage, 0) / budgetsWithUsage.length 
      : 0;
    
    return {
      budgets: budgetsWithUsage,
      totalBudget,
      totalUsed,
      remaining: totalBudget - totalUsed,
      averagePercentage,
      budgetCount: budgetsWithUsage.length
    };
  },

  /**
   * 检查预算是否超支
   * @param accountId - 账户ID
   * @param budgetId - 预算ID
   * @param startDate - 开始日期
   * @param endDate - 结束日期
   * @returns 是否超支
   */
  async isBudgetOverLimit(
    accountId: string,
    budgetId: string,
    startDate: Date,
    endDate: Date
  ) {
    const usage = await this.getBudgetUsage(accountId, budgetId, startDate, endDate);
    
    if (!usage) {
      return false; // 预算不存在，不算超支
    }
    
    return usage.percentage > 100;
  },

  /**
   * 获取预算提醒（即将超支或已超支的预算）
   * @param accountId - 账户ID
   * @param year - 年份
   * @param month - 月份
   * @param warningThreshold - 警告阈值（百分比，默认80）
   * @returns 预算提醒列表
   */
  async getBudgetAlerts(
    accountId: string,
    year: number,
    month: number,
    warningThreshold: number = 80
  ) {
    const budgetsWithUsage = await this.getAllBudgetsWithUsage(accountId, year, month);
    
    const alerts = budgetsWithUsage
      .filter(item => item.percentage >= warningThreshold)
      .map(item => ({
        budget: item.budget,
        usedAmount: item.usedAmount,
        percentage: item.percentage,
        alertType: item.percentage > 100 ? 'over_limit' : 'warning'
      }));
    
    return alerts;
  }
};