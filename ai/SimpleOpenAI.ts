import EventSource, { EventSourceListener } from 'react-native-sse';

// --- 类型定义 ---

export type Role = 'system' | 'user' | 'assistant';

export interface ChatMessage {
  role: Role;
  content: string;
  agentId?: string; // 标识消息来自哪个智能体
  timestamp?: number; // 消息时间戳
}

export interface SimpleOpenAIConfig {
  apiKey: string;
  baseURL?: string; // 默认为 https://api.openai.com/v1
  timeout?: number; // 请求超时时间，默认30秒
  maxRetries?: number; // 最大重试次数，默认3次
  defaultModel?: string; // 默认模型，如果没有指定则使用 tngtech/deepseek-r1t2-chimera:free
}

export interface AgentConfig {
  id: string; // 智能体唯一标识
  name: string; // 智能体名称
  systemPrompt: string; // 系统提示词
  model?: string; // 如果未指定，将使用SimpleOpenAI实例的默认模型
  temperature?: number; // 0.0 - 2.0
  maxTokens?: number; // 最大token数
  description?: string; // 智能体描述
  avatar?: string; // 智能体头像
  capabilities?: string[]; // 智能体能力标签
  toolIds?: string[]; // 智能体可用的工具ID列表
}

// 工具系统类型定义
export interface ToolParameter {
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  description: string;
  required?: boolean;
  enum?: any[]; // 可选的枚举值
  properties?: { [key: string]: ToolParameter }; // 当type为object时的子属性
  items?: ToolParameter; // 当type为array时的元素类型
}

export interface ToolConfig {
  id: string; // 工具唯一标识
  name: string; // 工具名称，用于API调用
  description: string; // 工具描述，用于AI理解工具用途
  parameters: { [key: string]: ToolParameter }; // 工具参数定义
  handler: (params: { [key: string]: any }) => Promise<any> | any; // 工具执行函数
  category?: string; // 工具分类，便于管理
  enabled?: boolean; // 是否启用，默认true
}

export interface ToolCall {
  id: string; // 工具调用ID
  type: string; // 通常为 "function"
  function: {
    name: string; // 工具名称
    arguments: string; // JSON字符串格式的参数
  };
}

export interface ToolResult {
  toolCallId: string; // 对应的工具调用ID
  result: any; // 工具执行结果
  isError?: boolean; // 是否为错误结果
  errorMessage?: string; // 错误信息
}

// 工具执行上下文
export interface ToolExecutionContext {
  agentId: string; // 调用工具的智能体ID
  sessionId?: string; // 会话ID
  userId?: string; // 用户ID（可选）
  conversationHistory: ChatMessage[]; // 当前对话历史
}

export interface ChatSession {
  id: string; // 会话ID
  agentId: string; // 当前对话的智能体ID
  messages: ChatMessage[]; // 对话历史
  createdAt: number; // 创建时间
  updatedAt: number; // 更新时间
}

export interface ChatStreamParams {
  sessionId?: string; // 会话ID，如果提供则会加载历史记录
  agentId: string; // 智能体ID
  message?: string; // 当前用户消息（可选，如果不提供则只使用历史记录）
  model?: string; // 覆盖智能体的默认模型
  temperature?: number; // 覆盖智能体的默认温度
  maxHistoryLength?: number; // 限制发送给 API 的历史记录条数 (默认 10)
  maxTokens?: number; // 最大token数
  tools?: string[]; // 指定本次对话可用的工具ID列表，如果不指定则使用智能体配置的工具
  toolChoice?: 'auto' | 'none' | { type: 'function', function: { name: string } }; // 工具选择策略
}

export interface ChatNonStreamParams extends Omit<ChatStreamParams, 'sessionId'> {
  messages: ChatMessage[]; // 直接提供消息历史，不使用会话管理
}

export interface StreamCallbacks {
  onDelta: (delta: string) => void;      // 接收到一个字符/片段时
  onCompletion?: (fullText: string, sessionId?: string) => void; // 对话结束时
  onError?: (error: any) => void;        // 发生错误时
  onStart?: () => void;                  // 开始接收响应时
  onToolCall?: (toolCall: ToolCall) => void; // 当需要调用工具时
  onToolResult?: (toolResult: ToolResult) => void; // 当工具调用返回结果时
}

export interface NonStreamCallbacks {
  onResponse: (response: string, sessionId?: string) => void; // 接收完整响应时
  onError?: (error: any) => void;        // 发生错误时
  onToolCall?: (toolCall: ToolCall) => void; // 当需要调用工具时
  onToolResult?: (toolResult: ToolResult) => void; // 当工具调用返回结果时
}

// 定义 OpenAI SSE 响应的数据结构，方便类型推断
interface OpenAIStreamResponse {
  id: string;
  choices: Array<{
    delta: {
      content?: string;
      tool_calls?: Array<{
        id: string;
        type: string;
        function: {
          name: string;
          arguments: string;
        };
      }>;
    };
    finish_reason: string | null;
  }>;
}

// 定义 OpenAI 非流式响应的数据结构
interface OpenAINonStreamResponse {
  id: string;
  choices: Array<{
    message: {
      content: string | null;
      role: string;
      tool_calls?: Array<{
        id: string;
        type: string;
        function: {
          name: string;
          arguments: string;
        };
      }>;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

// 错误类型定义
export enum SimpleOpenAIErrorType {
  NETWORK_ERROR = 'NETWORK_ERROR',
  API_ERROR = 'API_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  AGENT_NOT_FOUND = 'AGENT_NOT_FOUND',
  SESSION_NOT_FOUND = 'SESSION_NOT_FOUND',
  INVALID_CONFIG = 'INVALID_CONFIG',
}

export interface SimpleOpenAIError {
  type: SimpleOpenAIErrorType;
  message: string;
  originalError?: any;
}

// --- 类实现 ---

export class SimpleOpenAI {
  private apiKey: string;
  private baseURL: string;
  private timeout: number;
  private maxRetries: number;
  private defaultModel: string;
  private agents: Map<string, AgentConfig> = new Map();
  private sessions: Map<string, ChatSession> = new Map();
  private tools: Map<string, ToolConfig> = new Map();
  private defaultAgentId: string | null = null;

  get defaultAgId(): string | null {
    return this.defaultAgentId;
  }

  // 添加一个公共方法来获取默认智能体ID，用于调试
  public getDefaultAgentId(): string | null {
    return this.defaultAgentId;
  }

  constructor(config: SimpleOpenAIConfig) {
    this.apiKey = config.apiKey;
    this.baseURL = config.baseURL || 'https://api.openai.com/v1';
    this.timeout = config.timeout || 30000; // 默认30秒
    this.maxRetries = config.maxRetries || 3; // 默认重试3次
    this.defaultModel = config.defaultModel || 'tngtech/deepseek-r1t2-chimera:free';


    if (!this.apiKey) {
      throw new Error('[SimpleOpenAI] API Key is required.');
    }
    
  }

  /**
   * 注册智能体
   */
  public registerAgent(agentConfig: AgentConfig): void {
    
    if (!agentConfig.id || !agentConfig.name || !agentConfig.systemPrompt) {
      throw new Error('[SimpleOpenAI] Agent ID, name, and system prompt are required.');
    }

    this.agents.set(agentConfig.id, agentConfig);
    
    // 如果是第一个注册的智能体，设为默认智能体
    if (!this.defaultAgentId) {
      this.defaultAgentId = agentConfig.id;
    
    }
  }

  /**
   * 获取智能体配置
   */
  public getAgent(agentId: string): AgentConfig | undefined {
    return this.agents.get(agentId);
  }

  /**
   * 获取所有智能体
   */
  public getAllAgents(): AgentConfig[] {
    return Array.from(this.agents.values());
  }

  /**
   * 设置默认智能体
   */
  public setDefaultAgent(agentId: string): void {
    
    if (!this.agents.has(agentId)) {
      throw new Error(`[SimpleOpenAI] Agent with ID ${agentId} not found.`);
    }
    this.defaultAgentId = agentId;
  }

  /**
   * 注册工具
   */
  public registerTool(toolConfig: ToolConfig): void {
    if (!toolConfig.id || !toolConfig.name || !toolConfig.description || !toolConfig.handler) {
      throw new Error('[SimpleOpenAI] Tool ID, name, description, and handler are required.');
    }

    this.tools.set(toolConfig.id, toolConfig);
  }

  /**
   * 获取工具配置
   */
  public getTool(toolId: string): ToolConfig | undefined {
    return this.tools.get(toolId);
  }

  /**
   * 获取所有工具
   */
  public getAllTools(): ToolConfig[] {
    return Array.from(this.tools.values());
  }

  /**
   * 获取智能体可用的工具
   */
  public getAgentTools(agentId: string, additionalToolIds?: string[]): ToolConfig[] {
    const agent = this.agents.get(agentId);
    if (!agent) return [];

    // 获取智能体配置的工具ID
    const agentToolIds = agent.toolIds || [];
    
    // 合并额外提供的工具ID
    const allToolIds = [...new Set([...agentToolIds, ...(additionalToolIds || [])])];
    
    // 获取所有启用的工具
    return allToolIds
      .map(id => this.tools.get(id))
      .filter(tool => tool && tool.enabled !== false) as ToolConfig[];
  }

  /**
   * 移除工具
   */
  public removeTool(toolId: string): boolean {
    return this.tools.delete(toolId);
  }

  /**
   * 启用/禁用工具
   */
  public setToolEnabled(toolId: string, enabled: boolean): boolean {
    const tool = this.tools.get(toolId);
    if (!tool) return false;
    
    tool.enabled = enabled;
    return true;
  }

  /**
   * 执行工具调用
   */
  public async executeToolCall(
    toolCall: ToolCall,
    context: ToolExecutionContext
  ): Promise<ToolResult> {
    const { id, function: { name, arguments: argsString } } = toolCall;
    
    try {
      // 解析参数
      let args;
      try {
        args = JSON.parse(argsString);
      } catch (error) {
        throw new Error(`Invalid JSON in tool arguments: ${argsString}`);
      }

      // 查找工具
      const tool = Array.from(this.tools.values()).find(t => t.name === name);
      if (!tool) {
        throw new Error(`Tool with name "${name}" not found`);
      }

      if (tool.enabled === false) {
        throw new Error(`Tool "${name}" is disabled`);
      }

      // 验证参数
      this.validateToolParameters(tool, args);

      // 执行工具
      const result = await tool.handler(args);

      return {
        toolCallId: id,
        result,
        isError: false
      };
    } catch (error) {
      return {
        toolCallId: id,
        result: null,
        isError: true,
        errorMessage: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * 验证工具参数
   */
  private validateToolParameters(tool: ToolConfig, args: { [key: string]: any }): void {
    for (const [paramName, paramConfig] of Object.entries(tool.parameters)) {
      const value = args[paramName];
      
      // 检查必需参数
      if (paramConfig.required && (value === undefined || value === null)) {
        throw new Error(`Required parameter "${paramName}" is missing`);
      }
      
      // 如果参数不存在且不是必需的，跳过验证
      if (value === undefined || value === null) {
        continue;
      }
      
      // 类型验证
      switch (paramConfig.type) {
        case 'string':
          if (typeof value !== 'string') {
            throw new Error(`Parameter "${paramName}" must be a string`);
          }
          break;
        case 'number':
          if (typeof value !== 'number') {
            throw new Error(`Parameter "${paramName}" must be a number`);
          }
          break;
        case 'boolean':
          if (typeof value !== 'boolean') {
            throw new Error(`Parameter "${paramName}" must be a boolean`);
          }
          break;
        case 'object':
          if (typeof value !== 'object' || Array.isArray(value)) {
            throw new Error(`Parameter "${paramName}" must be an object`);
          }
          // 递归验证对象属性
          if (paramConfig.properties) {
            for (const [subParamName, subParamConfig] of Object.entries(paramConfig.properties)) {
              const subValue = value[subParamName];
              if (subParamConfig.required && (subValue === undefined || subValue === null)) {
                throw new Error(`Required parameter "${paramName}.${subParamName}" is missing`);
              }
            }
          }
          break;
        case 'array':
          if (!Array.isArray(value)) {
            throw new Error(`Parameter "${paramName}" must be an array`);
          }
          break;
      }
      
      // 枚举值验证
      if (paramConfig.enum && !paramConfig.enum.includes(value)) {
        throw new Error(`Parameter "${paramName}" must be one of: ${paramConfig.enum.join(', ')}`);
      }
    }
  }

  /**
   * 将工具配置转换为 OpenAI API 格式
   */
  private toolsToOpenAIFormat(tools: ToolConfig[]): Array<{ type: string, function: any }> {
    return tools.map(tool => ({
      type: 'function',
      function: {
        name: tool.name,
        description: tool.description,
        parameters: {
          type: 'object',
          properties: tool.parameters,
          required: Object.entries(tool.parameters)
            .filter(([_, config]) => config.required)
            .map(([name, _]) => name)
        }
      }
    }));
  }

  /**
   * 创建新的聊天会话
   */
  public createSession(agentId?: string): string {
    const sessionId = this.generateId();
    const actualAgentId = agentId || this.defaultAgentId;
    
    if (!actualAgentId) {
      throw new Error('[SimpleOpenAI] No agent specified and no default agent available.');
    }
    
    if (!this.agents.has(actualAgentId)) {
      throw new Error(`[SimpleOpenAI] Agent with ID ${actualAgentId} not found.`);
    }

    const session: ChatSession = {
      id: sessionId,
      agentId: actualAgentId,
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    this.sessions.set(sessionId, session);
    return sessionId;
  }

  /**
   * 获取会话
   */
  public getSession(sessionId: string): ChatSession | undefined {
    return this.sessions.get(sessionId);
  }

  /**
   * 获取所有会话
   */
  public getAllSessions(): ChatSession[] {
    return Array.from(this.sessions.values());
  }

  /**
   * 删除会话
   */
  public deleteSession(sessionId: string): boolean {
    return this.sessions.delete(sessionId);
  }

  /**
   * 切换会话的智能体
   */
  public switchSessionAgent(sessionId: string, newAgentId: string): boolean {
    const session = this.sessions.get(sessionId);
    if (!session) return false;
    
    if (!this.agents.has(newAgentId)) {
      throw new Error(`[SimpleOpenAI] Agent with ID ${newAgentId} not found.`);
    }

    session.agentId = newAgentId;
    session.updatedAt = Date.now();
    return true;
  }

  /**
   * 生成唯一ID
   */
  private generateId(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }

  /**
   * 内部方法：构建发送给 OpenAI 的上下文 (System + History)
   */
  private _buildContext(
    historyMessages: ChatMessage[], 
    systemPrompt: string, 
    maxHistoryLength: number = 10
  ): ChatMessage[] {
    // 1. 过滤掉历史记录中可能残留的 system 消息
    let cleanHistory = historyMessages.filter(msg => msg.role !== 'system');

    // 2. 滑动窗口：只保留最近的 N 条，防止 Token 爆炸
    if (cleanHistory.length > maxHistoryLength) {
      cleanHistory = cleanHistory.slice(cleanHistory.length - maxHistoryLength);
    }

    // 3. 组装最终数组
    return [
      { role: 'system', content: systemPrompt },
      ...cleanHistory
    ];
  }

  /**
   * 创建错误对象
   */
  private createError(type: SimpleOpenAIErrorType, message: string, originalError?: any): SimpleOpenAIError {
    return {
      type,
      message,
      originalError
    };
  }

  /**
   * 带重试的请求封装
   */
  private async requestWithRetry<T>(
    requestFn: () => Promise<T>,
    retries: number = this.maxRetries
  ): Promise<T> {
    let lastError: any;
    
    for (let i = 0; i <= retries; i++) {
      try {
        return await requestFn();
      } catch (error) {
        lastError = error;
        
        // 如果是最后一次重试，直接抛出错误
        if (i === retries) break;
        
        // 指数退避
        const delay = Math.pow(2, i) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw lastError;
  }

  /**
   * 非流式对话请求
   */
  public async chatNonStream(
    params: ChatNonStreamParams,
    callbacks: NonStreamCallbacks
  ): Promise<void> {
    const { 
      messages, 
      agentId,
      model, 
      temperature = 0.7, 
      maxHistoryLength = 10,
      maxTokens,
      tools,
      toolChoice = 'auto'
    } = params;

    const { onResponse, onError, onToolCall, onToolResult } = callbacks;

    try {
      // 获取智能体配置
      const agent = this.agents.get(agentId);
      if (!agent) {
        throw this.createError(
          SimpleOpenAIErrorType.AGENT_NOT_FOUND,
          `Agent with ID ${agentId} not found.`
        );
      }

      // 获取可用工具
      const availableTools = this.getAgentTools(agentId, tools);
      const openAITools = this.toolsToOpenAIFormat(availableTools);

      const url = `${this.baseURL}/chat/completions`;
      
      // 构建最终请求的消息体
      const finalMessages = this._buildContext(messages, agent.systemPrompt, maxHistoryLength);

      // 发送请求
      const response = await this.requestWithRetry(async () => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);
        
        try {
          const res = await fetch(url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${this.apiKey}`,
            },
            body: JSON.stringify({
              model: model || agent.model || this.defaultModel,
              messages: finalMessages,
              stream: false,
              temperature: temperature ?? agent.temperature,
              max_tokens: maxTokens || agent.maxTokens,
              tools: openAITools.length > 0 ? openAITools : undefined,
              tool_choice: openAITools.length > 0 ? toolChoice : undefined,
            }),
            signal: controller.signal,
          });
          
          clearTimeout(timeoutId);
          
          if (!res.ok) {
            const errorText = await res.text();
            throw new Error(`API Error: ${res.status} - ${errorText}`);
          }
          
          return res.json() as Promise<OpenAINonStreamResponse>;
        } catch (error) {
          clearTimeout(timeoutId);
          throw error;
        }
      });

      const message = response.choices[0]?.message;
      
      // 检查是否有工具调用
      if (message?.tool_calls && message.tool_calls.length > 0) {
        // 处理工具调用
        const toolCalls: ToolCall[] = message.tool_calls.map(tc => ({
          id: tc.id,
          type: tc.type,
          function: {
            name: tc.function.name,
            arguments: tc.function.arguments
          }
        }));

        // 通知有工具调用
        if (onToolCall) {
          for (const toolCall of toolCalls) {
            onToolCall(toolCall);
          }
        }

        // 执行工具调用
        const toolResults: ToolResult[] = [];
        for (const toolCall of toolCalls) {
          const context: ToolExecutionContext = {
            agentId,
            conversationHistory: messages
          };
          
          const result = await this.executeToolCall(toolCall, context);
          toolResults.push(result);
          
          // 通知工具结果
          if (onToolResult) {
            onToolResult(result);
          }
        }

        // 如果有工具调用，需要再次调用API获取最终响应
        if (toolResults.length > 0) {
          // 构建包含工具调用和结果的消息历史
          const messagesWithTools = [
            ...finalMessages,
            {
              role: 'assistant' as const,
              content: message.content,
              tool_calls: message.tool_calls
            },
            ...toolResults.map(result => ({
              role: 'tool' as const,
              content: JSON.stringify(result.result),
              tool_call_id: result.toolCallId
            }))
          ];

          // 再次发送请求
          const finalResponse = await this.requestWithRetry(async () => {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), this.timeout);
            
            try {
              const res = await fetch(url, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${this.apiKey}`,
                },
                body: JSON.stringify({
                  model: model || agent.model || this.defaultModel,
                  messages: messagesWithTools,
                  stream: false,
                  temperature: temperature ?? agent.temperature,
                  max_tokens: maxTokens || agent.maxTokens,
                  tools: openAITools.length > 0 ? openAITools : undefined,
                  tool_choice: openAITools.length > 0 ? toolChoice : undefined,
                }),
                signal: controller.signal,
              });
              
              clearTimeout(timeoutId);
              
              if (!res.ok) {
                const errorText = await res.text();
                throw new Error(`API Error: ${res.status} - ${errorText}`);
              }
              
              return res.json() as Promise<OpenAINonStreamResponse>;
            } catch (error) {
              clearTimeout(timeoutId);
              throw error;
            }
          });

          const finalContent = finalResponse.choices[0]?.message?.content || '';
          onResponse(finalContent);
        }
      } else {
        // 没有工具调用，直接返回内容
        const content = message?.content || '';
        onResponse(content);
      }
    } catch (error) {
      const errorObj = this.createError(
        SimpleOpenAIErrorType.API_ERROR,
        error instanceof Error ? error.message : 'Unknown error occurred',
        error
      );
      if (onError) onError(errorObj);
    }
  }

  /**
   * 流式对话请求
   * 返回一个 unsubscribe 函数，用于取消请求
   */
  public chatStream(params: ChatStreamParams, callbacks: StreamCallbacks): () => void {
    const { 
      sessionId,
      agentId,
      message,
      model, 
      temperature = 0.7, 
      maxHistoryLength = 10,
      maxTokens,
      tools,
      toolChoice = 'auto'
    } = params;

    const { onDelta, onCompletion, onError, onStart, onToolCall, onToolResult } = callbacks;

    let fullText = '';
    let retryCount = 0;
    let currentToolCalls: { [id: string]: ToolCall } = {};
    let isProcessingTools = false;
    
    const executeStream = (): (() => void) => {
      // 获取智能体配置
      const agent = this.agents.get(agentId);
      if (!agent) {
        const error = this.createError(
          SimpleOpenAIErrorType.AGENT_NOT_FOUND,
          `Agent with ID ${agentId} not found.`
        );
        if (onError) onError(error);
        return () => {};
      }

      // 获取可用工具
      const availableTools = this.getAgentTools(agentId, tools);
      const openAITools = this.toolsToOpenAIFormat(availableTools);

      // 获取会话和历史记录
      let historyMessages: ChatMessage[] = [];
      let currentSessionId = sessionId;

      if (sessionId) {
        const session = this.sessions.get(sessionId);
        if (!session) {
          const error = this.createError(
            SimpleOpenAIErrorType.SESSION_NOT_FOUND,
            `Session with ID ${sessionId} not found.`
          );
          if (onError) onError(error);
          return () => {};
        }
        historyMessages = session.messages;
        currentSessionId = sessionId;
      } else {
        // 如果没有提供sessionId，创建一个临时会话
        currentSessionId = this.generateId();
      }

      // 如果提供了用户消息，添加到历史记录
      if (message) {
        historyMessages.push({
          role: 'user',
          content: message,
          agentId: agentId,
          timestamp: Date.now(),
        });
      }

      const url = `${this.baseURL}/chat/completions`;
      
      // 构建最终请求的消息体
      const finalMessages = this._buildContext(historyMessages, agent.systemPrompt, maxHistoryLength);

      // 初始化 SSE 连接
      const es = new EventSource(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: model || agent.model || this.defaultModel,
          messages: finalMessages,
          stream: true,
          temperature: temperature ?? agent.temperature,
          max_tokens: maxTokens || agent.maxTokens,
          tools: openAITools.length > 0 ? openAITools : undefined,
          tool_choice: openAITools.length > 0 ? toolChoice : undefined,
        }),
      });

      // 监听消息事件
      const messageListener: EventSourceListener = (event) => {
        // 检查 event.type 是否为 'message' (react-native-sse 的类型定义可能包含 open/error)
        if (event.type !== 'message') return;

        // 1. 处理结束标识
        if (event.data === '[DONE]') {
          es.close();
          
          // 检查是否有工具调用需要处理
          if (Object.keys(currentToolCalls).length > 0 && !isProcessingTools) {
            isProcessingTools = true;
            processToolCalls();
            return;
          }
          
          // 保存助手回复到会话
          if (fullText && currentSessionId) {
            let session = this.sessions.get(currentSessionId);
            if (session) {
              // 添加用户消息（如果之前没有添加）
              if (message) {
                session.messages.push({
                  role: 'user',
                  content: message,
                  agentId: agentId,
                  timestamp: Date.now(),
                });
              }
              
              // 添加助手回复
              session.messages.push({
                role: 'assistant',
                content: fullText,
                agentId: agentId,
                timestamp: Date.now(),
              });
              
              session.updatedAt = Date.now();
            }
          }
          
          if (onCompletion) onCompletion(fullText, currentSessionId);
          return;
        }

        // 2. 解析 JSON 数据
        try {
          // 这里的 event.data 是 string，需要 parse
          const result = JSON.parse(event.data as string) as OpenAIStreamResponse;
          const delta = result.choices[0]?.delta;
          
          if (!delta) return;
          
          // 处理工具调用
          if (delta.tool_calls && delta.tool_calls.length > 0) {
            for (const toolCall of delta.tool_calls) {
              const id = toolCall.id;
              
              // 如果有ID，这是一个新的工具调用
              if (id && !currentToolCalls[id]) {
                currentToolCalls[id] = {
                  id,
                  type: toolCall.type,
                  function: {
                    name: toolCall.function?.name || '',
                    arguments: toolCall.function?.arguments || ''
                  }
                };
                
                // 通知有新的工具调用
                if (onToolCall) {
                  onToolCall(currentToolCalls[id]);
                }
              } 
              // 更新现有工具调用的参数
              else if (id && currentToolCalls[id]) {
                if (toolCall.function?.name) {
                  currentToolCalls[id].function.name = toolCall.function.name;
                }
                if (toolCall.function?.arguments) {
                  currentToolCalls[id].function.arguments += toolCall.function.arguments;
                }
              }
            }
          }
          
          // 处理普通文本内容
          if (delta.content) {
            fullText += delta.content;
            onDelta(delta.content);
          }
        } catch (error) {
          console.warn('[SimpleOpenAI] Parse Error:', error);
        }
      };

      // 处理工具调用的函数
      const processToolCalls = async () => {
        const toolCalls = Object.values(currentToolCalls);
        const toolResults: ToolResult[] = [];
        
        // 执行所有工具调用
        for (const toolCall of toolCalls) {
          const context: ToolExecutionContext = {
            agentId,
            sessionId: currentSessionId,
            conversationHistory: historyMessages
          };
          
          const result = await this.executeToolCall(toolCall, context);
          toolResults.push(result);
          
          // 通知工具结果
          if (onToolResult) {
            onToolResult(result);
          }
        }
        
        // 构建包含工具调用和结果的消息历史
        const messagesWithTools = [
          ...finalMessages,
          {
            role: 'assistant' as const,
            content: fullText,
            tool_calls: toolCalls.map(tc => ({
              id: tc.id,
              type: tc.type,
              function: tc.function
            }))
          },
          ...toolResults.map(result => ({
            role: 'tool' as const,
            content: JSON.stringify(result.result),
            tool_call_id: result.toolCallId
          }))
        ];
        
        // 重置状态
        fullText = '';
        currentToolCalls = {};
        isProcessingTools = false;
        
        // 发起第二次流式请求，获取最终响应
        const es2 = new EventSource(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`,
          },
          body: JSON.stringify({
            model: model || agent.model || this.defaultModel,
            messages: messagesWithTools,
            stream: true,
            temperature: temperature ?? agent.temperature,
            max_tokens: maxTokens || agent.maxTokens,
            tools: openAITools.length > 0 ? openAITools : undefined,
            tool_choice: openAITools.length > 0 ? toolChoice : undefined,
          }),
        });
        
        // 监听第二次请求的消息事件
        const messageListener2: EventSourceListener = (event) => {
          if (event.type !== 'message') return;
          
          if (event.data === '[DONE]') {
            es2.close();
            
            // 保存最终回复到会话
            if (fullText && currentSessionId) {
              let session = this.sessions.get(currentSessionId);
              if (session) {
                // 添加用户消息（如果之前没有添加）
                if (message) {
                  session.messages.push({
                    role: 'user',
                    content: message,
                    agentId: agentId,
                    timestamp: Date.now(),
                  });
                }
                
                // 添加助手回复
                session.messages.push({
                  role: 'assistant',
                  content: fullText,
                  agentId: agentId,
                  timestamp: Date.now(),
                });
                
                session.updatedAt = Date.now();
              }
            }
            
            if (onCompletion) onCompletion(fullText, currentSessionId);
            return;
          }
          
          try {
            const result = JSON.parse(event.data as string) as OpenAIStreamResponse;
            const delta = result.choices[0]?.delta?.content;
            
            if (delta) {
              fullText += delta;
              onDelta(delta);
            }
          } catch (error) {
            console.warn('[SimpleOpenAI] Parse Error in second stream:', error);
          }
        };
        
        // 监听第二次请求的错误事件
        const errorListener2: EventSourceListener = (event) => {
          if (event.type === 'error') {
            es2.close();
            const error = this.createError(
              SimpleOpenAIErrorType.NETWORK_ERROR,
              'Stream connection failed during tool processing',
              event
            );
            if (onError) onError(error);
          }
        };
        
        es2.addEventListener('message', messageListener2);
        es2.addEventListener('error', errorListener2);
      };

      // 监听错误事件
      const errorListener: EventSourceListener = (event) => {
        if (event.type === 'error') {
          es.close();
          
          // 重试逻辑
          if (retryCount < this.maxRetries) {
            retryCount++;
            console.warn(`[SimpleOpenAI] Stream error, retrying (${retryCount}/${this.maxRetries})...`);
            
            // 指数退避
            const delay = Math.pow(2, retryCount - 1) * 1000;
            setTimeout(() => {
              executeStream();
            }, delay);
          } else {
            const error = this.createError(
              SimpleOpenAIErrorType.NETWORK_ERROR,
              'Stream connection failed after retries',
              event
            );
            if (onError) onError(error);
          }
        }
      };

      // 监听打开事件
      const openListener: EventSourceListener = (event) => {
        if (event.type === 'open' && onStart) {
          onStart();
        }
      };

      es.addEventListener('message', messageListener);
      es.addEventListener('error', errorListener);
      es.addEventListener('open', openListener);

      // 返回取消函数 (用于 useEffect cleanup 或 手动停止)
      return () => {
        es.removeAllEventListeners();
        es.close();
      };
    };

    return executeStream();
  }

  /**
   * 智能体路由：根据用户输入智能选择最合适的智能体
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
   * 多智能体协作：让多个智能体协作解决复杂问题
   */
  public async multiAgentCollaboration(
    userInput: string,
    agentIds: string[],
    callbacks: {
      onAgentResponse: (agentId: string, response: string) => void;
      onFinalResponse: (finalResponse: string) => void;
      onError: (error: SimpleOpenAIError) => void;
    }
  ): Promise<() => void> {
    const { onAgentResponse, onFinalResponse, onError } = callbacks;
    const responses: { [agentId: string]: string } = {};
    let completedAgents = 0;
    
    // 为每个智能体创建临时会话并获取响应
    for (const agentId of agentIds) {
      const agent = this.agents.get(agentId);
      if (!agent) {
        const error = this.createError(
          SimpleOpenAIErrorType.AGENT_NOT_FOUND,
          `Agent with ID ${agentId} not found.`
        );
        if (onError) onError(error);
        continue;
      }

      // 创建临时会话
      const tempSessionId = this.createSession(agentId);
      
      // 使用非流式请求获取响应
      this.chatNonStream(
        {
          agentId,
          messages: [{ role: 'user', content: userInput }],
        },
        {
          onResponse: (response) => {
            responses[agentId] = response;
            onAgentResponse(agentId, response);
            completedAgents++;
            
            // 所有智能体都响应后，生成最终综合回复
            if (completedAgents === agentIds.length) {
              this.generateFinalResponse(userInput, responses, onFinalResponse, onError);
            }
          },
          onError: (error) => {
            if (onError) onError(error);
          }
        }
      );
    }

    // 返回取消函数
    return () => {
      // 这里可以添加取消逻辑
    };
  }

  /**
   * 生成多智能体协作的最终综合回复
   */
  private async generateFinalResponse(
    originalInput: string,
    agentResponses: { [agentId: string]: string },
    onFinalResponse: (finalResponse: string) => void,
    onError: (error: SimpleOpenAIError) => void
  ): Promise<void> {
    // 这里可以实现更复杂的逻辑，比如让一个总结智能体来整合所有回复
    // 简单起见，这里只是将所有回复合并
    const combinedResponse = Object.entries(agentResponses)
      .map(([agentId, response]) => `[${agentId}]: ${response}`)
      .join('\n\n');
    
    onFinalResponse(combinedResponse);
  }
}

/**
 * 工具系统使用示例
 * 
 * // 1. 初始化 SimpleOpenAI 实例
 * const openAI = new SimpleOpenAI({
 *   apiKey: 'your-api-key',
 *   baseURL: 'https://api.openai.com/v1',
 *   defaultModel: 'gpt-4'
 * });
 * 
 * // 2. 注册工具
 * openAI.registerTool({
 *   id: 'weather',
 *   name: 'get_weather',
 *   description: '获取指定城市的天气信息',
 *   parameters: {
 *     city: {
 *       type: 'string',
 *       description: '城市名称',
 *       required: true
 *     },
 *     units: {
 *       type: 'string',
 *       description: '温度单位',
 *       enum: ['celsius', 'fahrenheit'],
 *       required: false
 *     }
 *   },
 *   handler: async (params) => {
 *     // 实际的天气API调用
 *     const response = await fetch(`https://api.weather.com/?city=${params.city}&units=${params.units || 'celsius'}`);
 *     return await response.json();
 *   },
 *   category: 'utility'
 * });
 * 
 * // 3. 注册智能体并配置工具
 * openAI.registerAgent({
 *   id: 'weather-assistant',
 *   name: '天气助手',
 *   systemPrompt: '你是一个专业的天气助手，可以帮助用户查询天气信息。',
 *   toolIds: ['weather'], // 关联工具
 *   capabilities: ['weather-forecast', 'climate-info']
 * });
 * 
 * // 4. 使用工具进行对话
 * openAI.chatStream(
 *   {
 *     agentId: 'weather-assistant',
 *     message: '北京今天的天气怎么样？',
 *     toolChoice: 'auto' // 让AI自动决定是否使用工具
 *   },
 *   {
 *     onDelta: (delta) => console.log(delta),
 *     onCompletion: (fullText) => console.log('完成:', fullText),
 *     onToolCall: (toolCall) => console.log('工具调用:', toolCall),
 *     onToolResult: (result) => console.log('工具结果:', result),
 *     onError: (error) => console.error('错误:', error)
 *   }
 * );
 * 
 * // 5. 高级用法：动态指定工具
 * openAI.chatStream(
 *   {
 *     agentId: 'general-assistant',
 *     message: '帮我查询天气并计算明天是一年中的第几天',
 *     tools: ['weather', 'day-of-year'], // 临时指定可用工具，覆盖智能体配置
 *     toolChoice: 'auto'
 *   },
 *   {
 *     onDelta: (delta) => console.log(delta),
 *     onCompletion: (fullText) => console.log('完成:', fullText),
 *     onToolCall: (toolCall) => console.log('工具调用:', toolCall),
 *     onToolResult: (result) => console.log('工具结果:', result),
 *     onError: (error) => console.error('错误:', error)
 *   }
 * );
 */