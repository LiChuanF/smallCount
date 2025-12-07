export * from './data_operator';
export * from './income_expense_analyst';
export * from './smallcount_assistant';
export * from './summarizer';

import { AgentConfig } from '../lib/types';
import { dataOperatorAgent } from './data_operator';
import { incomeExpenseAnalystAgent } from './income_expense_analyst';
import { smallcountAssistantAgent } from './smallcount_assistant';
import { summarizerAgent } from './summarizer';

/**
 * 所有智能体的配置列表
 */
export const allAgents: AgentConfig[] = [
  dataOperatorAgent,
  incomeExpenseAnalystAgent,
  smallcountAssistantAgent,
  summarizerAgent
];
