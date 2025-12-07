import { AgentConfig } from '../lib/types';
import { DATA_OPERATOR_PROMPT } from '../prompts/data_operator';

export const dataOperatorAgent: AgentConfig = {
  id: 'data-operator',
  name: '数据操作助手',
  systemPrompt: DATA_OPERATOR_PROMPT,
  temperature: 0.5,
  description: '负责执行用户数据的增删改查操作，确保数据操作的准确性和完整性',
  capabilities: [
    '数据查询',
    '数据添加',
    '数据修改',
    '数据删除',
    '数据验证',
    '数据一致性维护'
  ],
  avatar: '💾'
};
