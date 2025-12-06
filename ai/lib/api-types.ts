/**
 * OpenAI API 响应类型定义
 * 
 * 本模块定义了与OpenAI API交互时使用的响应数据结构，
 * 包括流式和非流式响应的格式。
 */

import { ChatMessage } from './types';

/**
 * OpenAI 流式响应数据结构
 * 
 * 定义SSE流中每个事件的数据结构
 */
export interface OpenAIStreamResponse {
  /** 响应ID */
  id: string;
  /** 选择数组，包含生成的文本片段 */
  choices: Array<{
    /** 增量内容，包含本次响应的片段 */
    delta: {
      /** 文本内容片段 */
      content?: string;
      /** 工具调用片段 */
      tool_calls?: Array<{
        /** 工具调用ID */
        id: string;
        /** 调用类型，通常为 "function" */
        type: string;
        /** 函数调用详情 */
        function: {
          /** 函数名称 */
          name: string;
          /** 函数参数，可能是部分JSON */
          arguments: string;
        };
      }>;
    };
    /** 完成原因，如 'stop'、'length'、'tool_calls' 等 */
    finish_reason: string | null;
  }>;
}

/**
 * OpenAI 非流式响应数据结构
 * 
 * 定义标准API调用的完整响应结构
 */
export interface OpenAINonStreamResponse {
  /** 响应ID */
  id: string;
  /** 选择数组，包含完整的响应消息 */
  choices: Array<{
    /** 消息对象 */
    message: {
      /** 消息内容 */
      content: string | null;
      /** 消息角色 */
      role: string;
      /** 工具调用数组（如果有） */
      tool_calls?: Array<{
        /** 工具调用ID */
        id: string;
        /** 调用类型，通常为 "function" */
        type: string;
        /** 函数调用详情 */
        function: {
          /** 函数名称 */
          name: string;
          /** 函数参数，完整JSON字符串 */
          arguments: string;
        };
      }>;
    };
    /** 完成原因 */
    finish_reason: string;
  }>;
  /** 使用情况统计 */
  usage: {
    /** 提示词token数 */
    prompt_tokens: number;
    /** 生成内容token数 */
    completion_tokens: number;
    /** 总token数 */
    total_tokens: number;
  };
}

/**
 * OpenAI API 请求参数接口
 * 
 * 定义发送给OpenAI API的请求参数结构
 */
export interface OpenAIRequestParams {
  /** 使用的模型 */
  model: string;
  /** 消息数组 */
  messages: ChatMessage[];
  /** 是否流式响应 */
  stream: boolean;
  /** 温度参数 */
  temperature?: number;
  /** 最大token数 */
  max_tokens?: number;
  /** 可用工具定义 */
  tools?: Array<{ type: string, function: any }>;
  /** 工具选择策略 */
  tool_choice?: 'auto' | 'none' | { type: 'function', function: { name: string }};
}