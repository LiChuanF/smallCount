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
  id: string;
  name: string;
  description: string;
  systemPrompt: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  tools?: string[];
  handoffs?: string[];
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

