import { AgentConfig } from '../lib/types';
import { SMALLCOUNT_ASSISTANT_PROMPT } from '../prompts/smallcount_assistant';

export const smallcountAssistantAgent: AgentConfig = {
  id: 'smallcount-assistant',
  name: 'SmallCount 助手',
  systemPrompt: SMALLCOUNT_ASSISTANT_PROMPT,
  temperature: 0.7,
  description: '作为用户与smallCount应用之间的总入口和任务分发中枢，协调各智能体工作',
  capabilities: [
    '用户需求分析',
    '任务分发',
    '应用功能解答',
    '多智能体协调'
  ],
  avatar: '🤖'
};
