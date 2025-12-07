// src/ai-core/core/registry.ts
import { AgentConfig, ToolConfig } from '../types';

export class Registry {
  private agents: Map<string, AgentConfig> = new Map();
  private tools: Map<string, ToolConfig> = new Map();

  registerAgent(agent: AgentConfig) {
    this.agents.set(agent.id, agent);
  }

  registerTool(tool: ToolConfig) {
    this.tools.set(tool.id, tool);
  }

  getAgent(id: string): AgentConfig | undefined {
    return this.agents.get(id);
  }

  getTool(id: string): ToolConfig | undefined {
    return this.tools.get(id);
  }

  getToolsForAgent(agentId: string): ToolConfig[] {
    const agent = this.agents.get(agentId);
    if (!agent) return [];

    const result: ToolConfig[] = [];

    // 1. 添加普通工具
    if (agent.tools) {
      agent.tools.forEach(toolId => {
        const tool = this.tools.get(toolId);
        if (tool) result.push(tool);
      });
    }

    // 2. 动态生成转接工具
    if (agent.handoffs) {
      agent.handoffs.forEach(targetId => {
        const targetAgent = this.agents.get(targetId);
        if (targetAgent) {
          result.push({
            id: `transfer_to_${targetId}`,
            name: `transfer_to_${targetAgent.name.replace(/\s+/g, '_')}`,
            description: `Transfer the conversation to ${targetAgent.name}. Role: ${targetAgent.description}`,
            // 修正此处：符合 ToolParams 接口
            parameters: {
              type: 'object',
              properties: {
                reason: {
                  type: 'string',
                  description: 'The specific reason for transferring context to this agent.'
                }
              },
              required: ['reason'] // 这是一个 string[]，现在类型匹配了
            },
            handler: () => ({ status: 'transferred' }),
            targetAgentId: targetId
          });
        }
      });
    }

    return result;
  }
}