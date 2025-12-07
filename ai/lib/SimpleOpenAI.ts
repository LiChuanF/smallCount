/**
 * SimpleOpenAI 主类
 * 
 * 重构后的主类，使用模块化组件实现AI对话功能。
 * 保持与原始API的兼容性，同时提供更清晰的架构。
 */

import { AgentManager } from './agent-manager';
import { APIClient } from './api-client';
import { MultiAgentCollaborationManager } from './multi-agent-collaboration';
import { SessionManager } from './session-manager';
import { ToolManager } from './tool-manager';
import {
  AgentConfig,
  ChatMessage,
  ChatSession,
  NonStreamCallbacks,
  SimpleOpenAIConfig,
  SimpleOpenAIError,
  SimpleOpenAIErrorType,
  StreamCallbacks,
  ToolConfig
} from './types';

/**
 * SimpleOpenAI 主类
 * 
 * 提供与OpenAI API交互的高级接口，支持多智能体、工具调用和会话管理
 */
export class SimpleOpenAI {
  /** 配置信息 */
  private config: SimpleOpenAIConfig;
  /** 智能体管理器 */
  private agentManager: AgentManager;
  /** 工具管理器 */
  private toolManager: ToolManager;
  /** 会话管理器 */
  private sessionManager: SessionManager;
  /** API客户端 */
  private apiClient: APIClient;
  /** 多智能体协作管理器 */
  private multiAgentManager: MultiAgentCollaborationManager;
  /** 是否暂停所有AI接口调用 */
  private isPaused: boolean = false;
  /** 是否完全停止所有AI接口调用 */
  private isStopped: boolean = false;
  /** 暂停时等待的请求队列 */
  private pendingRequests: Array<() => void> = [];
  /** 当前活跃的请求取消函数数组 */
  private activeRequests: Array<() => void> = [];

  /**
   * 构造函数
   * 
   * @param config 配置对象
   */
  constructor(config: SimpleOpenAIConfig) {
    this.config = config;

    // 初始化各个管理器
    this.agentManager = new AgentManager();
    this.toolManager = new ToolManager();
    this.sessionManager = new SessionManager();
    this.apiClient = new APIClient(
      config.apiKey,
      config.baseURL || 'https://api.openai.com/v1',
      config.timeout || 30000,
      config.maxRetries || 3,
      config.mockHandler
    );
    this.multiAgentManager = new MultiAgentCollaborationManager(
      this.agentManager,
      this.apiClient,
      this.sessionManager,
      this.toolManager
    );
  }

  /**
   * 注册智能体
   * 
   * @param agentConfig 智能体配置
   */
  public registerAgent(agentConfig: AgentConfig): void {
    this.agentManager.registerAgent(agentConfig);
  }

  /**
   * 获取智能体
   * 
   * @param agentId 智能体ID
   * @returns 智能体配置
   */
  public getAgent(agentId: string): AgentConfig | undefined {
    return this.agentManager.getAgent(agentId);
  }

  /**
   * 获取所有智能体
   * 
   * @returns 智能体配置数组
   */
  public getAllAgents(): AgentConfig[] {
    return this.agentManager.getAllAgents();
  }

  /**
   * 设置默认智能体
   * 
   * @param agentId 智能体ID
   */
  public setDefaultAgent(agentId: string): void {
    this.agentManager.setDefaultAgent(agentId);
  }

  /**
   * 路由到指定智能体
   * 
   * @param agentId 智能体ID
   * @returns 智能体配置
   */
  public routeToAgent(agentId: string): AgentConfig | undefined {
    return this.agentManager.getAgent(agentId);
  }

  /**
   * 为智能体绑定工具
   * 
   * @param agentId 智能体ID
   * @param toolIds 要绑定的工具ID列表
   * @returns 更新后的智能体配置
   */
  public bindToolsToAgent(agentId: string, toolIds: string[]): AgentConfig {
    return this.agentManager.bindToolsToAgent(agentId, toolIds);
  }

  /**
   * 注册工具
   * 
   * @param toolConfig 工具配置
   */
  public registerTool(toolConfig: ToolConfig): void {
    this.toolManager.registerTool(toolConfig);
  }

  /**
   * 获取工具
   * 
   * @param toolId 工具ID
   * @returns 工具配置
   */
  public getTool(toolId: string): ToolConfig | undefined {
    return this.toolManager.getTool(toolId);
  }

  /**
   * 获取所有工具
   * 
   * @returns 工具配置数组
   */
  public getAllTools(): ToolConfig[] {
    return this.toolManager.getAllTools();
  }

  /**
   * 启用/禁用工具
   * 
   * @param toolId 工具ID
   * @param enabled 是否启用
   * @returns 操作是否成功
   */
  public setToolEnabled(toolId: string, enabled: boolean): boolean {
    return this.toolManager.setToolEnabled(toolId, enabled);
  }

  /**
   * 创建会话
   * 
   * @param agentId 智能体ID
   * @returns 会话ID
   */
  public createSession(agentId: string): string {
    return this.sessionManager.createSession(agentId);
  }

  /**
   * 获取会话
   * 
   * @param sessionId 会话ID
   * @returns 会话对象
   */
  public getSession(sessionId: string): ChatSession | undefined {
    return this.sessionManager.getSession(sessionId);
  }

  /**
   * 获取所有会话
   * 
   * @returns 会话数组
   */
  public getAllSessions(): ChatSession[] {
    return this.sessionManager.getAllSessions();
  }

  /**
   * 删除会话
   * 
   * @param sessionId 会话ID
   * @returns 操作是否成功
   */
  public deleteSession(sessionId: string): boolean {
    return this.sessionManager.deleteSession(sessionId);
  }

  /**
   * 切换会话的智能体
   * 
   * @param sessionId 会话ID
   * @param newAgentId 新的智能体ID
   * @returns 操作是否成功
   */
  public switchSessionAgent(sessionId: string, newAgentId: string): boolean {
    return this.sessionManager.switchSessionAgent(sessionId, newAgentId);
  }

  /**
   * 获取会话中的消息历史
   * 
   * @param sessionId 会话ID
   * @param limit 限制返回的消息数量（可选）
   * @returns 消息数组
   */
  public getMessages(sessionId: string, limit?: number): ChatMessage[] {
    return this.sessionManager.getMessages(sessionId, limit);
  }

  /**
   * 流式对话
   * 
   * @param params 对话参数
   * @param params.sessionId 会话ID（可选）
   * @param params.agentId 智能体ID（可选）
   * @param params.message 用户消息（可选）
   * @param params.model 模型名称（可选）
   * @param params.temperature 温度参数（可选）
   * @param params.maxHistoryLength 最大历史消息长度（可选）
   * @param params.maxTokens 最大令牌数（可选）
   * @param params.tools 可用工具数组（可选）
   * @param params.toolChoice 工具选择策略（可选）
   * @param callbacks 回调函数
   * @returns 取消函数
   */
  public chatStream(
    params: {
      sessionId?: string;
      agentId?: string;
      message?: string;
      model?: string;
      temperature?: number;
      maxHistoryLength?: number;
      maxTokens?: number;
      tools?: string[];
      toolChoice?: 'auto' | 'none' | { type: 'function', function: { name: string } };
    },
    callbacks: StreamCallbacks
  ): () => void {
    // 如果没有提供agentId，使用默认智能体
    let agentId = params.agentId;
    if (!agentId) {
      const defaultAgent = this.agentManager.getDefaultAgent();
      if (!defaultAgent) {
        const error = {
          type: SimpleOpenAIErrorType.AGENT_NOT_FOUND,
          message: 'No agent ID provided and no default agent set.'
        } as SimpleOpenAIError;
        if (callbacks.onError) callbacks.onError(error);
        return () => { };
      }
      agentId = defaultAgent.id;
    }

    // 如果提供了sessionId，验证会话是否存在且属于指定的智能体
    if (params.sessionId) {
      const session = this.sessionManager.getSession(params.sessionId);
      if (!session) {
        const error = {
          type: SimpleOpenAIErrorType.SESSION_NOT_FOUND,
          message: `Session with ID ${params.sessionId} not found.`
        } as SimpleOpenAIError;
        if (callbacks.onError) callbacks.onError(error);
        return () => { };
      }

      if (session.agentId !== agentId) {
        const error = {
          type: SimpleOpenAIErrorType.SESSION_MISMATCH,
          message: `Session ${params.sessionId} belongs to agent ${session.agentId}, not ${agentId}.`
        } as SimpleOpenAIError;
        if (callbacks.onError) callbacks.onError(error);
        return () => { };
      }
    }

    // 调用API客户端进行流式对话
    const agent = this.agentManager.getAgent(agentId!);
    const systemPrompt = agent?.systemPrompt || '';
    const agentModel = agent?.model || this.config.defaultModel;
    const agentTemperature = params.temperature ?? agent?.temperature;
    const agentMaxTokens = params.maxTokens || agent?.maxTokens;

    if (this.isStopped) {
      // 如果已停止，返回一个什么都不做的停止函数
      return () => {};
    }

    if (this.isPaused) {
      // 如果暂停，返回一个什么都不做的停止函数
      // 并将请求加入队列
      let cancelFn: () => void = () => {};
      this.pendingRequests.push(() => {
        if (!this.isStopped) {
          cancelFn = this.apiClient.chatStream(
            {
              ...params,
              agentId: agentId!,
              systemPrompt,
              model: params.model || agentModel,
              temperature: agentTemperature,
              maxTokens: agentMaxTokens
            },
            callbacks,
            this.toolManager,
            this.sessionManager
          );
          
          // 将取消函数添加到活跃请求列表
          this.activeRequests.push(cancelFn);
        }
      });
      
      // 返回一个可以取消队列中请求的函数
      return () => {
        // 从队列中移除这个请求
        const index = this.pendingRequests.findIndex(req => req === cancelFn);
        if (index !== -1) {
          this.pendingRequests.splice(index, 1);
        }
      };
    }

    const cancelFn = this.apiClient.chatStream(
      {
        ...params,
        agentId: agentId!,
        systemPrompt,
        model: params.model || agentModel,
        temperature: agentTemperature,
        maxTokens: agentMaxTokens
      },
      {
        ...callbacks,
        onCompletion: (fullText, sessionId) => {
          // 请求完成时，从活跃请求列表中移除
          const index = this.activeRequests.indexOf(cancelFn);
          if (index !== -1) {
            this.activeRequests.splice(index, 1);
          }
          if (callbacks.onCompletion) callbacks.onCompletion(fullText, sessionId);
        },
        onError: (error) => {
          // 请求出错时，从活跃请求列表中移除
          const index = this.activeRequests.indexOf(cancelFn);
          if (index !== -1) {
            this.activeRequests.splice(index, 1);
          }
          if (callbacks.onError) callbacks.onError(error);
        }
      },
      this.toolManager,
      this.sessionManager
    );
    
    // 将取消函数添加到活跃请求列表
    this.activeRequests.push(cancelFn);
    
    // 返回一个可以取消请求的函数
    return () => {
      cancelFn();
      // 从活跃请求列表中移除
      const index = this.activeRequests.indexOf(cancelFn);
      if (index !== -1) {
        this.activeRequests.splice(index, 1);
      }
    };
  }

  /**
   * 非流式对话
   * 
   * @param params 对话参数
   * @param callbacks 回调函数
   * @returns 停止函数
   */
  public async chatNonStream(
    params: {
      sessionId?: string;
      agentId?: string;
      message?: string;
      model?: string;
      temperature?: number;
      maxHistoryLength?: number;
      maxTokens?: number;
      tools?: string[];
      toolChoice?: 'auto' | 'none' | { type: 'function', function: { name: string } };
    },
    callbacks: NonStreamCallbacks
  ): Promise<() => void> {
    // 如果没有提供agentId，使用默认智能体
    let agentId = params.agentId;
    if (!agentId) {
      const defaultAgent = this.agentManager.getDefaultAgent();
      if (!defaultAgent) {
        const error = {
          type: SimpleOpenAIErrorType.AGENT_NOT_FOUND,
          message: 'No agent ID provided and no default agent set.'
        } as SimpleOpenAIError;
        if (callbacks.onError) callbacks.onError(error);
        return () => {};
      }
      agentId = defaultAgent.id;
    }

    // 获取消息历史
    let messages: ChatMessage[] = [];
    if (params.sessionId) {
      const session = this.sessionManager.getSession(params.sessionId);
      if (!session) {
        const error = {
          type: SimpleOpenAIErrorType.SESSION_NOT_FOUND,
          message: `Session with ID ${params.sessionId} not found.`
        } as SimpleOpenAIError;
        if (callbacks.onError) callbacks.onError(error);
        return () => {};
      }

      if (session.agentId !== agentId) {
        const error = {
          type: SimpleOpenAIErrorType.SESSION_MISMATCH,
          message: `Session ${params.sessionId} belongs to agent ${session.agentId}, not ${agentId}.`
        } as SimpleOpenAIError;
        if (callbacks.onError) callbacks.onError(error);
        return () => {};
      }

      messages = session.messages;
    }

    // 如果提供了用户消息，添加到消息历史
    if (params.message) {
      messages.push({
        role: 'user',
        content: params.message,
        agentId: agentId!,
        timestamp: Date.now(),
      });
    }

    // 调用API客户端进行非流式对话
    const agent = this.agentManager.getAgent(agentId!);
    const systemPrompt = agent?.systemPrompt || '';

    if (this.isStopped) {
      // 如果已停止，返回一个什么都不做的停止函数
      return Promise.resolve(() => {});
    }

    if (this.isPaused) {
      // 如果暂停，将请求加入队列
      return new Promise<() => void>((resolve) => {
        this.pendingRequests.push(async () => {
          if (!this.isStopped) {
            await this.apiClient.chatNonStream(
              {
                messages,
                agentId: agentId!,
                systemPrompt, // 传递 systemPrompt
                model: params.model || this.config.defaultModel,
                temperature: params.temperature || this.config.defaultTemperature,
                maxHistoryLength: params.maxHistoryLength || this.config.defaultMaxHistoryLength,
                maxTokens: params.maxTokens || this.config.defaultMaxTokens,
                tools: params.tools,
                toolChoice: params.toolChoice
              },
              callbacks,
              this.toolManager,
              this.sessionManager
            );
          }
          
          // 返回停止函数
          resolve(() => {});
        });
      });
    }

    await this.apiClient.chatNonStream(
      {
        messages,
        agentId: agentId!,
        systemPrompt, // 传递 systemPrompt
        model: params.model || this.config.defaultModel,
        temperature: params.temperature || this.config.defaultTemperature,
        maxHistoryLength: params.maxHistoryLength || this.config.defaultMaxHistoryLength,
        maxTokens: params.maxTokens || this.config.defaultMaxTokens,
        tools: params.tools,
        toolChoice: params.toolChoice
      },
      callbacks,
      this.toolManager,
      this.sessionManager
    );

    // 返回停止函数
    return () => {};
  }

  /**
   * 多智能体协作
   * 
   * @param params 协作参数
   * @param callbacks 回调函数
   * @returns 取消函数
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
    if (this.isStopped) {
      // 如果已停止，返回一个什么都不做的停止函数
      return () => {};
    }

    if (this.isPaused) {
      // 如果暂停，返回一个什么都不做的停止函数
      // 并将请求加入队列
      let cancelFn: () => void = () => {};
      this.pendingRequests.push(() => {
        if (!this.isStopped) {
          cancelFn = this.multiAgentManager.collaborate(params, callbacks);
          
          // 将取消函数添加到活跃请求列表
          this.activeRequests.push(cancelFn);
        }
      });
      
      // 返回一个可以取消队列中请求的函数
      return () => {
        // 从队列中移除这个请求
        const index = this.pendingRequests.findIndex(req => req === cancelFn);
        if (index !== -1) {
          this.pendingRequests.splice(index, 1);
        }
      };
    }

    const cancelFn = this.multiAgentManager.collaborate(params, callbacks);
    
    // 将取消函数添加到活跃请求列表
    this.activeRequests.push(cancelFn);
    
    // 返回一个可以取消请求的函数
    return () => {
      cancelFn();
      // 从活跃请求列表中移除
      const index = this.activeRequests.indexOf(cancelFn);
      if (index !== -1) {
        this.activeRequests.splice(index, 1);
      }
    };
  }

  /**
   * 暂停所有AI接口调用
   * 
   * 暂停后，新的请求将被放入队列等待，直到调用 resume 方法
   */
  public pause(): void {
    if (!this.isStopped) {
      this.isPaused = true;
    }
  }

  /**
   * 停止所有AI接口调用
   * 
   * 停止后，新的请求将被拒绝，正在进行的请求将被中断，
   * 队列中的等待请求将被清空，且无法恢复
   */
  public stop(): void {
    this.isStopped = true;
    this.isPaused = false;
    
    // 清空等待队列
    this.pendingRequests = [];
    
    // 中断所有正在进行的请求
    this.activeRequests.forEach(cancelFn => cancelFn());
    this.activeRequests = [];
  }

  /**
   * 恢复所有AI接口调用
   * 
   * 恢复后，队列中的等待请求将被执行
   */
  public resume(): void {
    if (this.isStopped) {
      return; // 如果已停止，无法恢复
    }
    
    this.isPaused = false;
    // 执行所有等待的请求
    const requests = [...this.pendingRequests];
    this.pendingRequests = [];
    requests.forEach(request => request());
  }

  /**
   * 检查是否已暂停
   * 
   * @returns 是否暂停状态
   */
  public isPausedState(): boolean {
    return this.isPaused;
  }

  /**
   * 检查是否已停止
   * 
   * @returns 是否停止状态
   */
  public isStoppedState(): boolean {
    return this.isStopped;
  }

  /**
   * 获取配置信息
   * 
   * @returns 当前配置对象
   */
  public getConfig(): SimpleOpenAIConfig {
    return { ...this.config };
  }

  /**
   * 更新配置信息
   * 
   * @param newConfig 新的配置对象
   */
  public updateConfig(newConfig: Partial<SimpleOpenAIConfig>): void {
    this.config = { ...this.config, ...newConfig };

    // 更新API客户端配置
    if (newConfig.apiKey) {
      this.apiClient = new APIClient(
        this.config.apiKey,
        this.config.baseURL || 'https://api.openai.com/v1',
        this.config.timeout || 30000,
        this.config.maxRetries || 3
      );
    }
  }
}