/**
 * Agent管理模块
 * 
 * 本模块负责管理AI智能体的注册、查询和路由功能，
 * 包括智能体的配置管理和智能选择逻辑。
 */

import { AgentConfig, SimpleOpenAIError, SimpleOpenAIErrorType } from './types';

/**
 * Agent管理器类
 * 
 * 负责管理所有注册的智能体，提供注册、查询、默认设置和路由功能
 */
export class AgentManager {
  /** 存储所有智能体的Map，key为agentId */
  private agents: Map<string, AgentConfig> = new Map();
  /** 默认智能体ID */
  private defaultAgentId: string | null = null;

  /**
   * 注册智能体
   * 
   * @param agentConfig 智能体配置对象
   * @throws 如果配置无效则抛出错误
   */
  public registerAgent(agentConfig: AgentConfig): void {
    if (!agentConfig.id || !agentConfig.name || !agentConfig.systemPrompt) {
      throw new Error('[AgentManager] Agent ID, name, and system prompt are required.');
    }

    this.agents.set(agentConfig.id, agentConfig);
    
    // 如果是第一个注册的智能体，设为默认智能体
    if (!this.defaultAgentId) {
      this.defaultAgentId = agentConfig.id;
    }
  }

  /**
   * 获取智能体配置
   * 
   * @param agentId 智能体ID
   * @returns 智能体配置对象，如果不存在则返回undefined
   */
  public getAgent(agentId: string): AgentConfig | undefined {
    return this.agents.get(agentId);
  }

  /**
   * 获取所有智能体
   * 
   * @returns 包含所有智能体配置的数组
   */
  public getAllAgents(): AgentConfig[] {
    return Array.from(this.agents.values());
  }

  /**
   * 设置默认智能体
   * 
   * @param agentId 要设置为默认的智能体ID
   * @throws 如果智能体不存在则抛出错误
   */
  public setDefaultAgent(agentId: string): void {
    if (!this.agents.has(agentId)) {
      throw new Error(`[AgentManager] Agent with ID ${agentId} not found.`);
    }
    this.defaultAgentId = agentId;
  }

  /**
   * 获取默认智能体ID
   * 
   * @returns 默认智能体ID，如果没有则返回null
   */
  public getDefaultAgentId(): string | null {
    return this.defaultAgentId;
  }

  /**
   * 获取默认智能体配置
   * 
   * @returns 默认智能体配置，如果没有则返回undefined
   */
  public getDefaultAgent(): AgentConfig | undefined {
    if (!this.defaultAgentId) return undefined;
    return this.agents.get(this.defaultAgentId);
  }

  /**
   * 检查智能体是否存在
   * 
   * @param agentId 智能体ID
   * @returns 如果智能体存在返回true，否则返回false
   */
  public hasAgent(agentId: string): boolean {
    return this.agents.has(agentId);
  }

  /**
   * 移除智能体
   * 
   * @param agentId 要移除的智能体ID
   * @returns 如果成功移除返回true，否则返回false
   */
  public removeAgent(agentId: string): boolean {
    const existed = this.agents.has(agentId);
    this.agents.delete(agentId);
    
    // 如果移除的是默认智能体，需要重新选择默认智能体
    if (this.defaultAgentId === agentId) {
      const remainingAgents = Array.from(this.agents.keys());
      this.defaultAgentId = remainingAgents.length > 0 ? remainingAgents[0] : null;
    }
    
    return existed;
  }

  /**
   * 为智能体绑定工具
   * 
   * @param agentId 智能体ID
   * @param toolIds 要绑定的工具ID列表
   * @returns 更新后的智能体配置
   * @throws 如果智能体不存在则抛出错误
   */
  public bindToolsToAgent(agentId: string, toolIds: string[]): AgentConfig {
    const agent = this.agents.get(agentId);
    
    if (!agent) {
      throw new Error(`[AgentManager] Agent with ID ${agentId} not found.`);
    }
    
    // 更新智能体的工具ID列表
    const updatedAgent: AgentConfig = {
      ...agent,
      toolIds
    };
    
    // 保存更新后的智能体配置
    this.agents.set(agentId, updatedAgent);
    
    return updatedAgent;
  }

  /**
   * 智能体路由：根据用户输入智能选择最合适的智能体
   * 
   * @param userInput 用户输入文本
   * @param availableAgentIds 可选的智能体ID列表，如果不提供则考虑所有智能体
   * @returns 最合适的智能体ID，如果没有合适的则返回null
   */
  public async routeToAgent(userInput: string, availableAgentIds?: string[]): Promise<string | null> {
    const agentsToConsider = availableAgentIds 
      ? availableAgentIds.filter(id => this.agents.has(id))
      : Array.from(this.agents.keys());

    if (agentsToConsider.length === 0) return null;
    if (agentsToConsider.length === 1) return agentsToConsider[0];

    // 简单的关键词匹配路由逻辑
    // 在实际应用中，可以使用更复杂的NLP或向量相似度匹配
    const agentScores: { [agentId: string]: number } = {};
    
    for (const agentId of agentsToConsider) {
      const agent = this.agents.get(agentId);
      if (!agent || !agent.capabilities) continue;
      
      let score = 0;
      const lowerInput = userInput.toLowerCase();
      
      // 计算能力关键词匹配分数
      for (const capability of agent.capabilities) {
        if (lowerInput.includes(capability.toLowerCase())) {
          score += 1;
        }
      }
      
      // 计算描述关键词匹配分数
      if (agent.description) {
        const descWords = agent.description.toLowerCase().split(/\s+/);
        for (const word of descWords) {
          if (lowerInput.includes(word) && word.length > 3) { // 忽略短词
            score += 0.5;
          }
        }
      }
      
      agentScores[agentId] = score;
    }

    // 选择得分最高的智能体
    let bestAgentId: string | null = null;
    let highestScore = 0;
    
    for (const [agentId, score] of Object.entries(agentScores)) {
      if (score > highestScore) {
        highestScore = score;
        bestAgentId = agentId;
      }
    }

    // 如果所有智能体得分都很低，返回默认智能体
    if (highestScore < 1 && this.defaultAgentId) {
      return this.defaultAgentId;
    }

    return bestAgentId;
  }

  /**
   * 创建错误对象
   * 
   * @param type 错误类型
   * @param message 错误消息
   * @param originalError 原始错误对象（可选）
   * @returns 格式化的错误对象
   */
  private createError(type: SimpleOpenAIErrorType, message: string, originalError?: any): SimpleOpenAIError {
    return {
      type,
      message,
      originalError
    };
  }
}