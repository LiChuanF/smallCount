import { AgentConfig } from '../lib/types';
import { SUMMARIZER_PROMPT } from '../prompts/summarizer';

export const summarizerAgent: AgentConfig = {
  id: 'summarizer',
  name: '总结归纳助手',
  systemPrompt: SUMMARIZER_PROMPT,
  temperature: 0.5,
  description: '负责总结和归纳smallCount应用中各类信息，将复杂数据转化为易于理解的报告',
  capabilities: [
    '分析结果总结',
    '操作结果反馈',
    '问答结果整理',
    '信息聚合',
    '报告生成'
  ],
  avatar: '📋'
};
