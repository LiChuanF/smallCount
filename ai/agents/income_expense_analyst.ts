import { AgentConfig } from '../lib/types';
import { INCOME_EXPENSE_ANALYST_PROMPT } from '../prompts/income_expense_analyst';

export const incomeExpenseAnalystAgent: AgentConfig = {
  id: 'income-expense-analyst',
  name: '收支分析师',
  systemPrompt: INCOME_EXPENSE_ANALYST_PROMPT,
  temperature: 0.7,
  description: '专门负责分析smallCount应用中用户收支数据，提供深入的收支情况分析和财务洞察',
  capabilities: [
    '收入分析',
    '支出分析',
    '收支平衡分析',
    '时间序列分析',
    '财务模式识别',
    '财务建议提供'
  ],
  avatar: '📊'
};
