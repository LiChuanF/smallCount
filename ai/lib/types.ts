// src/ai-core/types.ts

export type Role = 'system' | 'user' | 'assistant' | 'tool';

export interface ChatMessage {
  id: string;
  role: Role;
  content: string;
  name?: string;
  agentId?: string;
  timestamp: number;
}

// 单个属性的定义
export interface ToolProperty {
  type: string; // 'string' | 'number' | 'boolean' | 'object' | 'array'
  description?: string;
  enum?: any[];
  items?: ToolProperty; // 数组类型时使用
  properties?: { [key: string]: ToolProperty }; // 对象嵌套时使用
  required?: string[];
}

// 整个 parameters 对象的结构 (符合 JSON Schema)
export interface ToolParams {
  type: 'object';
  properties: { [key: string]: ToolProperty };
  required?: string[];
}

export interface ToolConfig {
  id: string;
  name: string;
  description: string;
  parameters: ToolParams; // 这里修改为 ToolParams 类型
  handler: (args: any, context: ExecutionContext) => Promise<any> | any;
  targetAgentId?: string;
}

export interface AgentConfig {
  id: string; // 代理的唯一标识符
  name: string; // 代理名称，用于显示和识别
  description: string; // 代理的描述信息，说明其功能和用途
  systemPrompt: string; // 系统提示词，定义代理的行为和角色
  model?: string; // 可选，使用的语言模型名称，如gpt-4、claude等
  temperature?: number; // 可选，控制输出的随机性，值越高越随机，通常为0-1之间
  maxTokens?: number; // 可选，生成文本的最大token数量限制
  tools?: Omit<ToolConfig, 'handler' | 'parameters'>[]; // 可选，代理可使用的工具ID列表
  handoffs?: string[]; // 可选，可交接给的其他代理ID列表
}

export interface ExecutionContext {
  sessionId: string;
  currentAgentId: string;
  history: ChatMessage[];
}

export interface CoreConfig {
  apiKey: string;
  baseURL?: string;
  defaultModel?: string;
  timeout?: number;
  maxRetries?: number;
  maxMsgCount?: number;
}

export interface WorkflowEvents {
  onStart?: () => void;
  onTextDelta?: (text: string, agentId: string) => void;
  onToolCall?: (toolName: string, args: any, agentId: string) => void;
  onToolResult?: (toolName: string, result: any) => void;
  onAgentChange?: (fromAgentId: string, toAgentId: string) => void;
  onComplete?: () => void;
  onError?: (error: Error) => void;
}

