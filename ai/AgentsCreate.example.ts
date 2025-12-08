import { AgentsCreate } from './AgentsCreate';

// 创建 AgentsCreate 实例的示例
export function createSmallCountAgents() {
  // 初始化 AgentsCreate
  const agentsCreator = new AgentsCreate({
    apiKey: "your-api-key-here", // 替换为实际的 API 密钥
    baseURL: "https://api.siliconflow.cn/v1",
    defaultModel: "deepseek-ai/DeepSeek-R1-0528-Qwen3-8B",
    timeout: 30000,
  });

  // 初始化所有工具和智能体
  agentsCreator.initialize();

  // 创建会话
  const sessionId = agentsCreator.createSession();

  // 获取 agentCore 实例
  const agentCore = agentsCreator.getAgentCore();

  return {
    agentsCreator,
    agentCore,
    sessionId,
  };
}

// 使用示例
export function exampleUsage() {
  const { agentsCreator, agentCore, sessionId } = createSmallCountAgents();

  // 发送消息
  const cancelChat = agentCore.chat(sessionId, "我想记录一笔支出，金额是50元，分类是餐饮", {
    onStart: () => console.log("开始处理..."),
    onTextDelta: (text, agentId) => console.log(`[${agentId}] ${text}`),
    onToolCall: (toolName, args, agentId) => console.log(`[${agentId}] 调用工具: ${toolName}`, args),
    onToolResult: (toolName, result) => console.log(`工具 ${toolName} 返回:`, result),
    onAgentChange: (fromAgentId, toAgentId) => console.log(`智能体切换: ${fromAgentId} -> ${toAgentId}`),
    onComplete: () => console.log("处理完成"),
    onError: (error) => console.error("处理出错:", error),
  });

  // 如果需要取消聊天
  // cancelChat();

  // 获取交易数据
  const transactions = agentsCreator.getTransactions();
  console.log("当前交易记录:", transactions);

  // 设置外部交易数据
  agentsCreator.setTransactions([
    {
      id: "external-1",
      type: "income",
      amount: 5000,
      category: "工资",
      date: "2025-12-01",
      description: "月度工资",
    },
  ]);
}