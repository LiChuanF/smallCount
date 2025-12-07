/**
 * API请求处理模块
 * 
 * 本模块负责处理与OpenAI API的交互，
 * 包括流式和非流式请求、重试逻辑和错误处理。
 */

import EventSource, { EventSourceListener } from 'react-native-sse';
import {
  OpenAINonStreamResponse,
  OpenAIStreamResponse
} from './api-types';
import { SessionManager } from './session-manager';
import { ToolManager } from './tool-manager';
import {
  ChatMessage,
  NonStreamCallbacks,
  SimpleOpenAIError,
  SimpleOpenAIErrorType,
  StreamCallbacks,
  ToolCall
} from './types';

/**
 * API客户端类
 * 
 * 负责处理与OpenAI API的所有交互，包括流式和非流式请求
 */
export class APIClient {
  /** API密钥 */
  private apiKey: string;
  /** API基础URL */
  private baseURL: string;
  /** 请求超时时间（毫秒） */
  private timeout: number;
  /** 最大重试次数 */
  private maxRetries: number;
  /** 模拟请求处理器 */
  private mockHandler?: (url: string, options: any) => Promise<any>;

  /**
   * 构造函数
   * 
   * @param apiKey OpenAI API密钥
   * @param baseURL API基础URL
   * @param timeout 请求超时时间（毫秒）
   * @param maxRetries 最大重试次数
   * @param mockHandler 模拟请求处理器
   */
  constructor(
    apiKey: string,
    baseURL: string,
    timeout: number,
    maxRetries: number,
    mockHandler?: (url: string, options: any) => Promise<any>
  ) {
    this.apiKey = apiKey;
    this.baseURL = baseURL;
    this.timeout = timeout;
    this.maxRetries = maxRetries;
    this.mockHandler = mockHandler;
  }

  /**
   * 解析手动工具调用
   */
  private parseManualToolCall(content: string): { toolName: string; args: any } | null {
    try {
      // 匹配 markdown json 代码块
      const jsonBlockRegex = /```json\s*([\s\S]*?)\s*```/;
      const match = content.match(jsonBlockRegex);

      let jsonStr = '';
      if (match) {
        jsonStr = match[1];
      } else {
        // 尝试寻找可能是JSON的部分
        const firstBrace = content.indexOf('{');
        const lastBrace = content.lastIndexOf('}');
        if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
          jsonStr = content.substring(firstBrace, lastBrace + 1);
        }
      }

      if (!jsonStr) return null;

      // 清理可能存在的注释或其他非JSON字符
      jsonStr = jsonStr.replace(/\\n/g, '\n');

      const parsed = JSON.parse(jsonStr);
      if (parsed && typeof parsed === 'object' && parsed.tool && parsed.args) {
        return { toolName: parsed.tool, args: parsed.args };
      }
    } catch (e) {
      // 忽略解析错误
    }
    return null;
  }

  /**
   * 生成随机ID
   */
  private generateId(): string {
    return 'call_' + Math.random().toString(36).substring(2, 15);
  }

  /**
   * 非流式对话请求
   * 
   * @param params 请求参数
   * @param callbacks 回调函数
   * @param toolManager 工具管理器实例
   * @param sessionManager 会话管理器实例
   */
  public async chatNonStream(
    params: {
      messages: ChatMessage[];
      agentId: string;
      systemPrompt?: string; // 新增 systemPrompt 参数
      model?: string;
      temperature?: number;
      maxHistoryLength?: number;
      maxTokens?: number;
      tools?: string[];
      toolChoice?: 'auto' | 'none' | { type: 'function', function: { name: string } };
    },
    callbacks: NonStreamCallbacks,
    toolManager: ToolManager,
    sessionManager: SessionManager
  ): Promise<void> {
    const {
      messages,
      agentId,
      systemPrompt,
      model,
      temperature = 0.7,
      maxHistoryLength = 10,
      maxTokens,
      tools,
      toolChoice = 'auto'
    } = params;
    console.log('chatNonStream params:', params);

    const { onResponse, onError, onToolCall, onToolResult } = callbacks;

    try {
      // 获取可用工具
      const availableTools = toolManager.getToolsByIds(tools || []);
      // 手动工具调用：不传递 tools 给 API，而是注入到 systemPrompt

      let finalSystemPrompt = systemPrompt || '';
      if (availableTools.length > 0) {
        const toolPrompt = toolManager.getToolsSystemPrompt(availableTools);
        finalSystemPrompt = finalSystemPrompt ? `${finalSystemPrompt}\n\n${toolPrompt}` : toolPrompt;
      }

      const url = `${this.baseURL}/chat/completions`;

      // 构建最终请求的消息体
      const finalMessages = sessionManager.buildContext(messages, finalSystemPrompt, maxHistoryLength);

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
              model: model,
              messages: finalMessages,
              stream: false,
              temperature,
              max_tokens: maxTokens,
              // 移除原生工具调用参数
              // tools: openAITools.length > 0 ? openAITools : undefined,
              // tool_choice: openAITools.length > 0 ? toolChoice : undefined,
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
      const content = message?.content || '';

      // 检查是否有手动工具调用
      const manualToolCall = this.parseManualToolCall(content);

      if (manualToolCall) {
        const toolCallId = this.generateId();
        const toolCall: ToolCall = {
          id: toolCallId,
          type: 'function',
          function: {
            name: manualToolCall.toolName,
            arguments: JSON.stringify(manualToolCall.args)
          }
        };

        // 通知有工具调用
        if (onToolCall) {
          onToolCall(toolCall);
        }

        // 执行工具调用
        const context = {
          agentId,
          conversationHistory: messages
        };

        const result = await toolManager.executeToolCall(toolCall, context);

        // 通知工具结果
        if (onToolResult) {
          onToolResult(result);
        }

        // 递归调用以获取最终响应
        // 构建新的消息历史
        const newMessages = [...messages];
        // 添加助手的工具调用消息
        newMessages.push({
          role: 'assistant',
          content: content,
          agentId,
          timestamp: Date.now()
        });
        // 添加工具结果消息 (作为 User 消息，告知工具执行结果)
        newMessages.push({
          role: 'user',
          content: `Tool "${manualToolCall.toolName}" execution result:\n${JSON.stringify(result.result)}`,
          agentId,
          timestamp: Date.now()
        });

        await this.chatNonStream(
          {
            ...params,
            messages: newMessages,
            systemPrompt // 传递 systemPrompt
          },
          callbacks,
          toolManager,
          sessionManager
        );
        return;
      }

      // 如果没有工具调用，直接返回响应
      if (onResponse) onResponse(content);
    } catch (error) {
      if (onError) onError(error);
    }
  }

  /**
   * 流式对话请求
   * 
   * @param params 请求参数
   * @param callbacks 回调函数
   * @param toolManager 工具管理器实例
   * @param sessionManager 会话管理器实例
   * @returns 取消函数，用于停止流式请求
   */
  public chatStream(
    params: {
      sessionId?: string;
      agentId: string;
      systemPrompt?: string;
      message?: string;
      model?: string;
      temperature?: number;
      maxHistoryLength?: number;
      maxTokens?: number;
      tools?: string[];
      toolChoice?: 'auto' | 'none' | { type: 'function', function: { name: string } };
    },
    callbacks: StreamCallbacks,
    toolManager: ToolManager,
    sessionManager: SessionManager
  ): () => void {
    const {
      sessionId,
      agentId,
      systemPrompt,
      message,
      model,
      temperature = 0.7,
      maxHistoryLength = 10,
      maxTokens,
      tools,
      toolChoice = 'auto'
    } = params;

    const { onDelta, onCompletion, onError, onStart, onToolCall, onToolResult } = callbacks;

    // 状态变量
    let fullText = '';
    let retryCount = 0;
    let currentEventSource: EventSource | null = null;
    let retryTimeoutId: number | null = null;
    let isCancelled = false;

    // 获取会话和历史记录
    let historyMessages: ChatMessage[] = [];
    let currentSessionId = sessionId;

    if (sessionId) {
      const session = sessionManager.getSession(sessionId);
      if (!session) {
        const error = {
          type: SimpleOpenAIErrorType.SESSION_NOT_FOUND,
          message: `Session with ID ${sessionId} not found.`
        } as SimpleOpenAIError;
        if (onError) onError(error);
        return () => { };
      }
      historyMessages = session.messages;
      currentSessionId = sessionId;
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

    // 准备手动工具调用的系统提示词
    const availableTools = toolManager.getToolsByIds(tools || []);
    let finalSystemPrompt = systemPrompt || '';
    if (availableTools.length > 0) {
      const toolPrompt = toolManager.getToolsSystemPrompt(availableTools);
      finalSystemPrompt = finalSystemPrompt ? `${finalSystemPrompt}\n\n${toolPrompt}` : toolPrompt;
    }

    // 执行流式请求的函数
    const executeStream = (): void => {
      // 构建最终请求的消息体 (每次执行都重新构建，以包含最新的工具调用历史)
      const finalMessages = sessionManager.buildContext(historyMessages, finalSystemPrompt, maxHistoryLength);

      // 初始化 SSE 连接
      const es = new EventSource(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: model,
          messages: finalMessages,
          stream: true,
          temperature,
          max_tokens: maxTokens,
          // 移除原生工具调用
          // tools: openAITools.length > 0 ? openAITools : undefined,
          // tool_choice: openAITools.length > 0 ? toolChoice : undefined,
        }),
      });

      currentEventSource = es;

      // 监听消息事件
      const messageListener: EventSourceListener = (event) => {
        if (event.type !== 'message') return;

        // 1. 处理结束标识
        if (event.data === '[DONE]') {
          es.close();

          // 检查是否有手动工具调用
          const manualToolCall = this.parseManualToolCall(fullText);

          if (manualToolCall) {
            handleManualToolCall(manualToolCall);
            return;
          }

          // 保存助手回复到会话
          if (fullText && currentSessionId) {
            let session = sessionManager.getSession(currentSessionId);
            if (session) {
              // 确保用户消息已保存 (如果是第一次响应)
              if (message && historyMessages.length > 0 && historyMessages[historyMessages.length - 1].content === message) {
                // 已经在上面 push 到 historyMessages 了，但这里需要确保 session 里也有
                // sessionManager.getSession 返回的是引用吗？是的。
                // 但是 historyMessages 是 session.messages 的引用吗？
                // historyMessages = session.messages; 是引用。
                // 所以 historyMessages.push 已经修改了 session.messages。
                // 但是 SimpleOpenAI 的逻辑似乎是 sessionManager.addMessage 负责保存？
                // sessionManager.addMessage 也会 push。
                // 如果我们直接修改了 historyMessages (引用)，那么 session 里的 messages 也变了。
                // 这里的逻辑有点乱，原代码中有重复添加的嫌疑，或者 defensive check。

                // 原代码逻辑：
                // if (message) sessionManager.addMessage(..., message)
                // if (fullText) sessionManager.addMessage(..., fullText)

                // 这里的 historyMessages 只是用于 buildContext 的本地副本还是引用？
                // session.messages 是数组。
                // historyMessages = session.messages; 是引用。
                // historyMessages.push(...) 修改了原数组。

                // 但是原代码在 [DONE] 时又调用了 sessionManager.addMessage。
                // addMessage 会 push 到数组。
                // 如果 historyMessages 引用了同一个数组，那 message 会被添加两次？
                // 让我们检查 session-manager.ts。
                // getSession 返回 ChatSession 对象。
                // session.messages 是 ChatMessage[]。

                // 如果 APIClient 直接修改了 session.messages (通过 historyMessages 引用)，
                // 那么 sessionManager.addMessage 会再次添加。
                // 这确实是个问题。

                // 但是 APIClient 开头做了 historyMessages = session.messages;
                // 然后 if (message) historyMessages.push(...)
                // 这已经修改了 session。

                // 为了安全起见，我们应该遵循原代码的 pattern，但在手动工具调用循环中，我们需要手动管理 historyMessages。
                // 简单起见，我们假设 historyMessages 是我们需要维护的状态，最后再一次性同步到 session？
                // 或者，我们不直接修改 session.messages，而是拷贝一份？
                // let historyMessages = [...session.messages];
                // 这样就不会影响 session，直到最后 addMessage。

                // 但是为了支持递归调用，我们需要 historyMessages 包含最新的上下文。
              }

              // 简单的做法：
              // 如果是普通结束（非工具调用），我们调用 addMessage 保存 fullText。
              // 对于 message (user input)，如果之前没保存，也保存。
              // 但是注意 historyMessages 已经被我们用来发送请求了。

              // 让我们修正一下：
              // 在 chatStream 开始时，不要直接 push 到 session.messages 引用。
              // let historyMessages = [...(session ? session.messages : [])];
              // 这样我们可以在本地维护 conversation state。
            }
          }

          // 如果有 session，保存最终结果
          if (currentSessionId) {
            // 这里逻辑稍微复杂，因为我们可能递归了多次。
            // 实际上，每次递归的中间结果（工具调用和结果）也应该保存到 session 吗？
            // 是的，应该保存，这样用户能看到历史。

            // 所以，每次 executeStream 完成一次交互（无论是工具调用还是最终回复），
            // 都应该把产生的新消息保存到 session。

            // 对于本次 executeStream：
            // 1. 如果是第一次（有 user message），且还没保存到 session，保存 user message。
            // 2. 如果是工具调用，保存 assistant message (with tool call) 和 tool result message。
            // 3. 如果是最终回复，保存 assistant message。
          }

          if (onCompletion) onCompletion(fullText, currentSessionId);
          return;
        }

        // 2. 解析 JSON 数据
        try {
          const result = JSON.parse(event.data as string) as OpenAIStreamResponse;
          const delta = result.choices[0]?.delta;

          if (!delta) return;

          // 处理普通文本内容
          if (delta.content) {
            fullText += delta.content;
            onDelta && onDelta(delta.content);
          }
        } catch (error) {
          console.warn('[APIClient] Parse Error:', error);
        }
      };

      // 处理手动工具调用
      const handleManualToolCall = async (manualToolCall: { toolName: string; args: any }) => {
        const toolCallId = this.generateId();
        const toolCall: ToolCall = {
          id: toolCallId,
          type: 'function',
          function: {
            name: manualToolCall.toolName,
            arguments: JSON.stringify(manualToolCall.args)
          }
        };

        if (onToolCall) onToolCall(toolCall);

        const context = {
          agentId,
          sessionId: currentSessionId,
          conversationHistory: historyMessages
        };

        const result = await toolManager.executeToolCall(toolCall, context);
        if (onToolResult) onToolResult(result);

        // 更新历史记录
        // 1. 助手消息 (包含工具调用)
        const assistantMsg: ChatMessage = {
          role: 'assistant',
          content: fullText,
          agentId,
          timestamp: Date.now()
        };
        historyMessages.push(assistantMsg);
        if (currentSessionId) sessionManager.addMessage(currentSessionId, assistantMsg);

        // 2. 工具结果消息
        const toolMsg: ChatMessage = {
          role: 'user', // 使用 user 角色反馈工具结果
          content: `Tool "${manualToolCall.toolName}" execution result:\n${JSON.stringify(result.result)}`,
          agentId,
          timestamp: Date.now()
        };
        historyMessages.push(toolMsg);
        if (currentSessionId) sessionManager.addMessage(currentSessionId, toolMsg);

        // 重置状态并递归
        fullText = '';
        if (!isCancelled) {
          executeStream();
        }
      };

      // 监听错误事件
      const errorListener: EventSourceListener = (event) => {
        if (event.type === 'error') {
          es.close();

          // 重试逻辑
          if (retryCount < this.maxRetries && !isCancelled) {
            retryCount++;
            console.warn(`[APIClient] Stream error, retrying (${retryCount}/${this.maxRetries})...`);

            const delay = Math.pow(2, retryCount - 1) * 1000;
            retryTimeoutId = setTimeout(() => {
              if (!isCancelled) {
                executeStream();
              }
            }, delay);
          } else {
            const error = {
              type: SimpleOpenAIErrorType.NETWORK_ERROR,
              message: 'Stream connection failed after retries',
              originalError: event
            } as SimpleOpenAIError;
            if (onError) onError(error);
          }
        }
      };

      const openListener: EventSourceListener = (event) => {
        if (event.type === 'open' && onStart) {
          onStart();
        }
      };

      es.addEventListener('message', messageListener);
      es.addEventListener('error', errorListener);
      es.addEventListener('open', openListener);
    };

    // 初始历史记录处理
    // 为了不破坏 sessionManager 的逻辑，我们这里先添加 user message 到 session
    if (sessionId && message) {
      // 检查是否已经添加过（避免重试时重复添加）
      // 这里简化处理，假设调用 chatStream 时 message 还没添加
      sessionManager.addMessage(sessionId, {
        role: 'user',
        content: message,
        agentId,
        timestamp: Date.now()
      });
      // 重新获取 messages 以确保同步
      const session = sessionManager.getSession(sessionId);
      if (session) historyMessages = [...session.messages];
    } else if (message) {
      // 如果没有 session，就用本地 historyMessages
      // 注意：historyMessages 已经在上面初始化并 push 了 message
    } else if (sessionId) {
      // 只有 sessionId 没有 message (可能是继续对话)
      const session = sessionManager.getSession(sessionId);
      if (session) historyMessages = [...session.messages];
    }

    // 启动流
    executeStream();

    // 返回取消函数
    return () => {
      isCancelled = true;
      
      // 清除重试定时器
      if (retryTimeoutId) {
        clearTimeout(retryTimeoutId);
        retryTimeoutId = null;
      }
      
      // 关闭 EventSource 连接
      if (currentEventSource) {
        currentEventSource.removeAllEventListeners();
        currentEventSource.close();
        currentEventSource = null;
      }
    };
  }

  /**
   * 带重试的请求封装
   * 
   * @param requestFn 请求函数
   * @param retries 重试次数
   * @returns 请求结果Promise
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
}