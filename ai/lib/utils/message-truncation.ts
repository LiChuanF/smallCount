// src/ai-core/utils/message-truncation.ts
import { ChatMessage, Role } from '../types';

/**
 * 估算文本的token数量
 * 这里使用简单的估算：1 token ≈ 4个字符（英文）或1个字符（中文）
 * 对于中英文混合的内容，我们使用一个折中的估算方法
 */
export function estimateTokens(text: string): number {
  // 简单估算：平均1个token约等于3-4个字符
  // 这是一个粗略的估算，实际应用中可能需要更精确的计算
  return Math.ceil(text.length / 3);
}

/**
 * 计算消息列表的总token数
 */
export function calculateTotalTokens(messages: ChatMessage[]): number {
  return messages.reduce((total, msg) => {
    return total + estimateTokens(msg.content);
  }, 0);
}

/**
 * 截断消息以适应上下文大小限制
 * @param messages 原始消息列表
 * @param maxTokens 最大token限制
 * @param systemPrompt 系统提示词（需要额外计算）
 * @returns 截断后的消息列表
 */
export function truncateMessages(
  messages: ChatMessage[],
  maxTokens: number,
  systemPrompt: string = ''
): ChatMessage[] {
  // 计算系统提示词的token数
  const systemTokens = systemPrompt ? estimateTokens(systemPrompt) : 0;
  
  // 为系统提示词和响应预留空间（约25%的token）
  const availableTokens = Math.floor(maxTokens * 0.75) - systemTokens;
  
  // 如果消息总token数没有超过限制，直接返回
  const totalTokens = calculateTotalTokens(messages);
  if (totalTokens <= availableTokens) {
    return messages;
  }

  // 需要截断消息
  const result: ChatMessage[] = [];
  let currentTokens = 0;
  
  // 从最新消息开始，向前遍历，保留最近的对话
  for (let i = messages.length - 1; i >= 0; i--) {
    const message = messages[i];
    const messageTokens = estimateTokens(message.content);
    
    // 如果添加这条消息会超过限制，并且我们已经有一些消息了，就停止
    if (currentTokens + messageTokens > availableTokens && result.length > 0) {
      break;
    }
    
    // 将消息插入到结果数组的开头
    result.unshift(message);
    currentTokens += messageTokens;
  }
  
  // 如果我们截断了消息，在日志中记录截断信息
  if (result.length < messages.length) {
    const truncatedCount = messages.length - result.length;
    console.log(`[消息截断] 由于上下文长度限制，已省略 ${truncatedCount} 条较早的对话记录`);
  }
  
  return result;
}

/**
 * 根据角色重要性过滤消息
 * 系统消息 > 用户消息 > 助手消息 > 工具消息
 */
export function prioritizeMessages(messages: ChatMessage[]): ChatMessage[] {
  const rolePriority: Record<Role, number> = {
    system: 4,
    user: 3,
    assistant: 2,
    tool: 1
  };
  
  return [...messages].sort((a, b) => {
    // 首先按角色优先级排序
    const priorityDiff = rolePriority[b.role] - rolePriority[a.role];
    if (priorityDiff !== 0) {
      return priorityDiff;
    }
    
    // 如果角色相同，按时间戳排序（新的在前）
    return b.timestamp - a.timestamp;
  });
}