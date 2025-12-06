/**
 * SimpleOpenAI 统一导出文件
 * 
 * 本文件提供所有模块的统一导出，方便外部使用。
 * 保持与原始API的兼容性，同时提供更细粒度的模块访问。
 */

// 主类导出
export { SimpleOpenAI } from './SimpleOpenAI';

// 核心类型导出
export type {
    AgentConfig, ChatMessage, ChatSession, NonStreamCallbacks, Role, SimpleOpenAIConfig, SimpleOpenAIError,
    SimpleOpenAIErrorType, StreamCallbacks, ToolCall, ToolConfig, ToolExecutionContext, ToolParameter, ToolResult
} from './types';

// API类型导出
export type {
    OpenAINonStreamResponse,
    OpenAIRequestParams, OpenAIStreamResponse
} from './api-types';

// 管理器类导出
export { AgentManager } from './agent-manager';
export { APIClient } from './api-client';
export { MultiAgentCollaborationManager } from './multi-agent-collaboration';
export { SessionManager } from './session-manager';
export { ToolManager } from './tool-manager';

// 默认导出主类
export { SimpleOpenAI as default } from './SimpleOpenAI';
