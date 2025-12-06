/**
 * Session管理模块
 * 
 * 本模块负责管理聊天会话的生命周期，
 * 包括会话创建、查询、更新和删除等功能。
 */

import { ChatMessage, ChatSession, SimpleOpenAIError, SimpleOpenAIErrorType } from './types';

/**
 * 会话管理器类
 * 
 * 负责管理所有聊天会话，提供会话的创建、查询、更新和删除功能
 */
export class SessionManager {
  /** 存储所有会话的Map，key为sessionId */
  private sessions: Map<string, ChatSession> = new Map();

  /**
   * 创建新的聊天会话
   * 
   * @param agentId 智能体ID
   * @returns 新创建的会话ID
   * @throws 如果智能体ID无效则抛出错误
   */
  public createSession(agentId: string): string {
    if (!agentId) {
      throw new Error('[SessionManager] Agent ID is required to create a session.');
    }

    const sessionId = this.generateId();
    const session: ChatSession = {
      id: sessionId,
      agentId: agentId,
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    this.sessions.set(sessionId, session);
    return sessionId;
  }

  /**
   * 获取会话
   * 
   * @param sessionId 会话ID
   * @returns 会话对象，如果不存在则返回undefined
   */
  public getSession(sessionId: string): ChatSession | undefined {
    return this.sessions.get(sessionId);
  }

  /**
   * 获取所有会话
   * 
   * @returns 包含所有会话的数组
   */
  public getAllSessions(): ChatSession[] {
    return Array.from(this.sessions.values());
  }

  /**
   * 获取指定智能体的所有会话
   * 
   * @param agentId 智能体ID
   * @returns 该智能体的所有会话
   */
  public getSessionsByAgent(agentId: string): ChatSession[] {
    return Array.from(this.sessions.values()).filter(session => session.agentId === agentId);
  }

  /**
   * 删除会话
   * 
   * @param sessionId 要删除的会话ID
   * @returns 如果成功删除返回true，否则返回false
   */
  public deleteSession(sessionId: string): boolean {
    return this.sessions.delete(sessionId);
  }

  /**
   * 清空所有会话
   * 
   * @returns 删除的会话数量
   */
  public clearAllSessions(): number {
    const count = this.sessions.size;
    this.sessions.clear();
    return count;
  }

  /**
   * 切换会话的智能体
   * 
   * @param sessionId 会话ID
   * @param newAgentId 新的智能体ID
   * @returns 如果切换成功返回true，否则返回false
   * @throws 如果智能体ID无效则抛出错误
   */
  public switchSessionAgent(sessionId: string, newAgentId: string): boolean {
    const session = this.sessions.get(sessionId);
    if (!session) return false;
    
    if (!newAgentId) {
      throw new Error('[SessionManager] New agent ID is required.');
    }

    session.agentId = newAgentId;
    session.updatedAt = Date.now();
    return true;
  }

  /**
   * 向会话添加消息
   * 
   * @param sessionId 会话ID
   * @param message 要添加的消息
   * @returns 如果添加成功返回true，否则返回false
   */
  public addMessage(sessionId: string, message: ChatMessage): boolean {
    const session = this.sessions.get(sessionId);
    if (!session) return false;
    
    session.messages.push(message);
    session.updatedAt = Date.now();
    return true;
  }

  /**
   * 批量向会话添加消息
   * 
   * @param sessionId 会话ID
   * @param messages 要添加的消息数组
   * @returns 如果添加成功返回true，否则返回false
   */
  public addMessages(sessionId: string, messages: ChatMessage[]): boolean {
    const session = this.sessions.get(sessionId);
    if (!session) return false;
    
    session.messages.push(...messages);
    session.updatedAt = Date.now();
    return true;
  }

  /**
   * 更新会话中的最后一条消息
   * 
   * @param sessionId 会话ID
   * @param content 新的消息内容
   * @returns 如果更新成功返回true，否则返回false
   */
  public updateLastMessage(sessionId: string, content: string): boolean {
    const session = this.sessions.get(sessionId);
    if (!session || session.messages.length === 0) return false;
    
    const lastMessage = session.messages[session.messages.length - 1];
    lastMessage.content = content;
    session.updatedAt = Date.now();
    return true;
  }

  /**
   * 获取会话中的消息历史
   * 
   * @param sessionId 会话ID
   * @param limit 限制返回的消息数量（可选）
   * @returns 消息数组
   */
  public getMessages(sessionId: string, limit?: number): ChatMessage[] {
    const session = this.sessions.get(sessionId);
    if (!session) return [];
    
    const messages = session.messages;
    return limit ? messages.slice(-limit) : [...messages];
  }

  /**
   * 清空会话消息历史
   * 
   * @param sessionId 会话ID
   * @returns 如果清空成功返回true，否则返回false
   */
  public clearMessages(sessionId: string): boolean {
    const session = this.sessions.get(sessionId);
    if (!session) return false;
    
    session.messages = [];
    session.updatedAt = Date.now();
    return true;
  }

  /**
   * 获取会话统计信息
   * 
   * @param sessionId 会话ID
   * @returns 包含消息数量、创建时间等信息的对象
   */
  public getSessionStats(sessionId: string): {
    messageCount: number;
    createdAt: number;
    updatedAt: number;
    agentId: string;
  } | null {
    const session = this.sessions.get(sessionId);
    if (!session) return null;
    
    return {
      messageCount: session.messages.length,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
      agentId: session.agentId
    };
  }

  /**
   * 生成唯一ID
   * 
   * @returns 随机生成的唯一ID字符串
   */
  private generateId(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }

  /**
   * 构建发送给 OpenAI 的上下文 (System + History)
   * 
   * @param historyMessages 历史消息数组
   * @param systemPrompt 系统提示词
   * @param maxHistoryLength 限制发送给API的历史记录条数，默认为10
   * @returns 格式化后的消息数组
   */
  public buildContext(
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