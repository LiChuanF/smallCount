/**
 * 多智能体协作模块
 * 
 * 本模块负责多智能体之间的协作功能，
 * 包括多智能体协同解决复杂问题的逻辑。
 */

import { AgentManager } from './agent-manager';
import { APIClient } from './api-client';
import { SessionManager } from './session-manager';
import { ToolManager } from './tool-manager';
import { SimpleOpenAIError, SimpleOpenAIErrorType, ToolConfig } from './types';

/**
 * 多智能体协作管理器类
 * 
 * 负责协调多个智能体之间的协作，实现复杂问题的分布式解决
 */
export class MultiAgentCollaborationManager {
  /** 智能体管理器引用 */
  private agentManager: AgentManager;
  /** API客户端引用 */
  private apiClient: APIClient;
  /** 会话管理器引用 */
  private sessionManager: SessionManager;
  /** 工具管理器引用 */
  private toolManager: ToolManager;

  /**
   * 构造函数
   * 
   * @param agentManager 智能体管理器实例
   * @param apiClient API客户端实例
   * @param sessionManager 会话管理器实例
   * @param toolManager 工具管理器实例
   */
  constructor(
    agentManager: AgentManager,
    apiClient: APIClient,
    sessionManager: SessionManager,
    toolManager: ToolManager
  ) {
    this.agentManager = agentManager;
    this.apiClient = apiClient;
    this.sessionManager = sessionManager;
    this.toolManager = toolManager;
  }

  /**
   * 创建代理工具
   * 将其他智能体封装为当前智能体可以调用的工具
   */
  private createAgentTool(targetAgentId: string): ToolConfig {
    const agent = this.agentManager.getAgent(targetAgentId);
    if (!agent) throw new Error(`Agent ${targetAgentId} not found`);

    return {
      id: `call_${targetAgentId}`,
      name: `call_${agent.name.replace(/\s+/g, '_')}`,
      description: `Delegate a task to ${agent.name}. Description: ${agent.description}`,
      parameters: {
        message: {
          type: 'string',
          description: 'The message/task to send to the agent',
          required: true
        }
      },
      handler: async (params: { [key: string]: any }) => {
        const { message } = params;
        let responseContent = '';
        // Create a temporary session for the worker agent
        const tempSessionId = `temp_${targetAgentId}_${Date.now()}`;
        this.sessionManager.createSession(targetAgentId);

        const targetAgent = this.agentManager.getAgent(targetAgentId);
        const systemPrompt = targetAgent?.systemPrompt || '';

        // Use chatNonStream to get response from the worker agent
        await this.apiClient.chatNonStream(
          {
            messages: [{ role: 'user', content: message, agentId: targetAgentId, timestamp: Date.now() }],
            agentId: targetAgentId,
            systemPrompt,
            model: targetAgent?.model,
            temperature: targetAgent?.temperature,
            maxTokens: targetAgent?.maxTokens
          },
          {
            onResponse: (response) => { responseContent = response; },
            onError: (err) => { responseContent = `Error: ${err.message}`; }
          },
          this.toolManager,
          this.sessionManager
        );

        // Clean up temp session
        this.sessionManager.deleteSession(tempSessionId);
        return responseContent;
      }
    };
  }

  /**
   * 多智能体协作：让多个智能体协作解决复杂问题
   * 采用 Supervisor 模式，第一个智能体作为 Supervisor，其他作为 Tools
   * 
   * @param params 协作参数
   * @param callbacks 回调函数集合
   * @returns 取消函数，用于停止协作过程
   */
  public collaborate(
    params: {
      agentIds: string[];
      message: string;
      model?: string;
      temperature?: number;
      maxTokens?: number;
      maxHistoryLength?: number;
    },
    callbacks: {
      onAgentResponse?: (agentId: string, response: string) => void;
      onFinalResponse?: (response: string) => void;
      onError?: (error: SimpleOpenAIError) => void;
    }
  ): () => void {
    const { agentIds, message, model, temperature, maxTokens, maxHistoryLength } = params;
    const { onAgentResponse, onFinalResponse, onError } = callbacks;

    if (agentIds.length < 2) {
      if (onError) onError({ type: SimpleOpenAIErrorType.INVALID_CONFIG, message: "At least 2 agents are required for collaboration." });
      return () => { };
    }

    const supervisorId = agentIds[0];
    const workerIds = agentIds.slice(1);
    const tempTools: string[] = [];

    // 1. Register worker agents as tools
    workerIds.forEach(workerId => {
      if (this.agentManager.hasAgent(workerId)) {
        const tool = this.createAgentTool(workerId);
        // Avoid duplicate registration if possible, or handle it
        if (!this.toolManager.hasTool(tool.id)) {
          this.toolManager.registerTool(tool);
          tempTools.push(tool.id);
        }
      }
    });

    // 2. Start the supervisor session
    const sessionId = this.sessionManager.createSession(supervisorId);
    this.sessionManager.addMessage(sessionId, {
      role: 'user',
      content: message,
      agentId: supervisorId,
      timestamp: Date.now()
    });

    // 3. Run the supervisor
    const supervisor = this.agentManager.getAgent(supervisorId);
    const systemPrompt = supervisor?.systemPrompt || '';

    // Append instruction to supervisor
    const collaborationInstruction = "\nYou are a Supervisor Agent. You can use tools to delegate tasks to other agents. Use the available tools to solve the user's problem. When you have the final answer, respond to the user directly.";

    let isCancelled = false;

    this.apiClient.chatNonStream(
      {
        messages: this.sessionManager.getMessages(sessionId),
        agentId: supervisorId,
        systemPrompt: systemPrompt + collaborationInstruction,
        model: model || supervisor?.model,
        temperature: temperature || supervisor?.temperature,
        maxTokens: maxTokens || supervisor?.maxTokens,
        tools: tempTools, // Pass the agent-tools
        maxHistoryLength
      },
      {
        onResponse: (response) => {
          if (isCancelled) return;
          if (onFinalResponse) onFinalResponse(response);

          // Cleanup
          tempTools.forEach(id => this.toolManager.removeTool(id));
          this.sessionManager.deleteSession(sessionId);
        },
        onError: (err) => {
          if (isCancelled) return;
          if (onError) onError(err);

          // Cleanup
          tempTools.forEach(id => this.toolManager.removeTool(id));
          this.sessionManager.deleteSession(sessionId);
        },
        onToolResult: (result) => {
          // 尝试从 result 中推断 agent (比较 hacky)
          // 或者在 createAgentTool 中直接调用 onAgentResponse?
          // 在 createAgentTool handler 中调用 onAgentResponse 会更好。
          // 这里暂时留空，因为 APIClient 的 onToolResult 主要是给 Client 用的
        }
      },
      this.toolManager,
      this.sessionManager
    );

    return () => {
      isCancelled = true;
      // Cleanup on cancel
      tempTools.forEach(id => this.toolManager.removeTool(id));
    };
  }
}
