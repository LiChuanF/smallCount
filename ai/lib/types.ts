/**
 * SimpleOpenAI 核心类型定义
 * 
 * 本模块包含了SimpleOpenAI系统中使用的所有核心类型定义，
 * 包括消息、智能体、工具、会话等相关的接口和枚举。
 */

/**
 * 聊天消息角色类型
 */
export type Role = 'system' | 'user' | 'assistant';

/**
 * 聊天消息接口
 * 
 * 表示对话中的一条消息，包含角色、内容和可选的元数据
 */
export interface ChatMessage {
  /** 消息角色，可以是 'system'、'user' 或 'assistant' */
  role: Role;
  /** 消息内容 */
  content: string;
  /** 标识消息来自哪个智能体（可选） */
  agentId?: string;
  /** 消息时间戳（可选） */
  timestamp?: number;
}

/**
 * SimpleOpenAI 配置接口
 * 
 * 用于初始化 SimpleOpenAI 实例的配置参数
 */
export interface SimpleOpenAIConfig {
  /** OpenAI API 密钥 */
  apiKey: string;
  /** API 基础URL，默认为 https://api.openai.com/v1 */
  baseURL?: string;
  /** 请求超时时间（毫秒），默认30秒 */
  timeout?: number;
  /** 最大重试次数，默认3次 */
  maxRetries?: number;
  /** 默认模型，如果没有指定则使用 tngtech/deepseek-r1t2-chimera:free */
  defaultModel?: string;
  /** 模拟请求处理器，用于测试或演示 */
  mockHandler?: (url: string, options: any) => Promise<any>;
  /** 默认温度参数，默认0.7 */
  defaultTemperature?: number;
  /** 默认最大历史消息长度，默认10 */
  defaultMaxHistoryLength?: number;
  /** 默认最大token数，默认2048 */
  defaultMaxTokens?: number;
}

/**
 * 智能体配置接口
 * 
 * 定义一个AI智能体的配置参数，包括系统提示词、模型等
 */
export interface AgentConfig {
  /** 智能体唯一标识 */
  id: string;
  /** 智能体名称 */
  name: string;
  /** 系统提示词，定义智能体的行为和角色 */
  systemPrompt: string;
  /** 使用的模型，如果未指定将使用SimpleOpenAI实例的默认模型 */
  model?: string;
  /** 温度参数，控制回复的随机性，范围 0.0 - 2.0 */
  temperature?: number;
  /** 最大token数限制 */
  maxTokens?: number;
  /** 智能体描述 */
  description?: string;
  /** 智能体头像URL或标识 */
  avatar?: string;
  /** 智能体能力标签数组 */
  capabilities?: string[];
  /** 智能体可用的工具ID列表 */
  toolIds?: string[];
}

/**
 * 工具参数类型定义
 * 
 * 定义工具函数参数的类型和约束
 */
export interface ToolParameter {
  /** 参数类型，可以是 'string'、'number'、'boolean'、'object' 或 'array' */
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  /** 参数描述，用于AI理解参数用途 */
  description: string;
  /** 参数是否必需，默认为false */
  required?: boolean;
  /** 可选的枚举值，限制参数的取值范围 */
  enum?: any[];
  /** 当type为object时的子属性定义 */
  properties?: { [key: string]: ToolParameter };
  /** 当type为array时的元素类型定义 */
  items?: ToolParameter;
}

/**
 * 工具配置接口
 * 
 * 定义一个可供AI调用的工具的配置
 */
export interface ToolConfig {
  /** 工具唯一标识 */
  id: string;
  /** 工具名称，用于API调用 */
  name: string;
  /** 工具描述，用于AI理解工具用途 */
  description: string;
  /** 工具参数定义 */
  parameters: { [key: string]: ToolParameter };
  /** 工具执行函数 */
  handler: (params: { [key: string]: any }) => Promise<any> | any;
  /** 工具分类，便于管理 */
  category?: string;
  /** 是否启用，默认为true */
  enabled?: boolean;
}

/**
 * 工具调用接口
 * 
 * 表示AI发起的一次工具调用请求
 */
export interface ToolCall {
  /** 工具调用ID */
  id: string;
  /** 调用类型，通常为 "function" */
  type: string;
  /** 函数调用详情 */
  function: {
    /** 工具名称 */
    name: string;
    /** 工具参数，JSON字符串格式 */
    arguments: string;
  };
}

/**
 * 工具执行结果接口
 * 
 * 表示工具执行后的返回结果
 */
export interface ToolResult {
  /** 对应的工具调用ID */
  toolCallId: string;
  /** 工具执行结果 */
  result: any;
  /** 是否为错误结果 */
  isError?: boolean;
  /** 错误信息（如果有） */
  errorMessage?: string;
}

/**
 * 工具执行上下文接口
 * 
 * 提供工具执行时需要的上下文信息
 */
export interface ToolExecutionContext {
  /** 调用工具的智能体ID */
  agentId: string;
  /** 会话ID（可选） */
  sessionId?: string;
  /** 用户ID（可选） */
  userId?: string;
  /** 当前对话历史 */
  conversationHistory: ChatMessage[];
}

/**
 * 聊天会话接口
 * 
 * 表示一个持续的多轮对话会话
 */
export interface ChatSession {
  /** 会话ID */
  id: string;
  /** 当前对话的智能体ID */
  agentId: string;
  /** 对话历史消息 */
  messages: ChatMessage[];
  /** 会话创建时间 */
  createdAt: number;
  /** 会话最后更新时间 */
  updatedAt: number;
}

/**
 * 流式聊天参数接口
 * 
 * 用于流式对话的参数配置
 */
export interface ChatStreamParams {
  /** 会话ID，如果提供则会加载历史记录 */
  sessionId?: string;
  /** 智能体ID */
  agentId: string;
  /** 当前用户消息（可选，如果不提供则只使用历史记录） */
  message?: string;
  /** 覆盖智能体的默认模型 */
  model?: string;
  /** 覆盖智能体的默认温度 */
  temperature?: number;
  /** 限制发送给API的历史记录条数，默认为10 */
  maxHistoryLength?: number;
  /** 最大token数 */
  maxTokens?: number;
  /** 指定本次对话可用的工具ID列表，如果不指定则使用智能体配置的工具 */
  tools?: string[];
  /** 工具选择策略 */
  toolChoice?: 'auto' | 'none' | { type: 'function', function: { name: string } };
}

/**
 * 非流式聊天参数接口
 * 
 * 用于非流式对话的参数配置，直接提供消息历史
 */
export interface ChatNonStreamParams extends Omit<ChatStreamParams, 'sessionId'> {
  /** 直接提供消息历史，不使用会话管理 */
  messages: ChatMessage[];
}

/**
 * 流式回调函数接口
 * 
 * 定义流式对话过程中的各种回调函数
 */
export interface StreamCallbacks {
  /** 接收到一个字符/片段时调用 */
  onDelta: (delta: string) => void;
  /** 对话结束时调用 */
  onCompletion?: (fullText: string, sessionId?: string) => void;
  /** 发生错误时调用 */
  onError?: (error: any) => void;
  /** 开始接收响应时调用 */
  onStart?: () => void;
  /** 当需要调用工具时调用 */
  onToolCall?: (toolCall: ToolCall) => void;
  /** 当工具调用返回结果时调用 */
  onToolResult?: (toolResult: ToolResult) => void;
}

/**
 * 非流式回调函数接口
 * 
 * 定义非流式对话过程中的各种回调函数
 */
export interface NonStreamCallbacks {
  /** 接收完整响应时调用 */
  onResponse: (response: string, sessionId?: string) => void;
  /** 发生错误时调用 */
  onError?: (error: any) => void;
  /** 当需要调用工具时调用 */
  onToolCall?: (toolCall: ToolCall) => void;
  /** 当工具调用返回结果时调用 */
  onToolResult?: (toolResult: ToolResult) => void;
}

/**
 * SimpleOpenAI 错误类型枚举
 * 
 * 定义系统中可能出现的各种错误类型
 */
export enum SimpleOpenAIErrorType {
  /** 网络错误 */
  NETWORK_ERROR = 'NETWORK_ERROR',
  /** API错误 */
  API_ERROR = 'API_ERROR',
  /** 超时错误 */
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  /** 智能体未找到错误 */
  AGENT_NOT_FOUND = 'AGENT_NOT_FOUND',
  /** 会话未找到错误 */
  SESSION_NOT_FOUND = 'SESSION_NOT_FOUND',
  /** 会话不匹配错误 */
  SESSION_MISMATCH = 'SESSION_MISMATCH',
  /** 配置无效错误 */
  INVALID_CONFIG = 'INVALID_CONFIG',
}

/**
 * SimpleOpenAI 错误接口
 * 
 * 定义系统中的错误对象结构
 */
export interface SimpleOpenAIError {
  /** 错误类型 */
  type: SimpleOpenAIErrorType;
  /** 错误消息 */
  message: string;
  /** 原始错误对象（可选） */
  originalError?: any;
}