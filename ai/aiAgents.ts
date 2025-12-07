import {
  dataOperatorAgent,
  incomeExpenseAnalystAgent,
  smallcountAssistantAgent,
  summarizerAgent,
} from "./agents";
import { AgentConfig, SimpleOpenAI } from "./lib";

//   apiKey: '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',
//   baseURL: 'https://openrouter.ai/api/v1',
//   defaultModel: 'tngtech/deepseek-r1t2-chimera:free',
//   apiKey: "sk-mewdvwtamzdkpsaiyzcqbbyelzscbyjeizfwzemitoovpnbr", // API密钥留空，用户需要自己填写
//   baseURL: "https://api.siliconflow.cn/v1",
//   defaultModel: "deepseek-ai/DeepSeek-OCR", // 使用默认模型
  // apiKey: "658d3fd1f1e1485983186992472f1b9e.Ri9PknpGt3qLMQiP", // API密钥留空，用户需要自己填写
  // baseURL: "https://open.bigmodel.cn/api/paas/v4",
  // defaultModel: "GLM-4.5-Flash", // 使用默认模型
// 创建SimpleOpenAI实例
export const simpleOpenAI = new SimpleOpenAI({
  apiKey: "sk-mewdvwtamzdkpsaiyzcqbbyelzscbyjeizfwzemitoovpnbr", // API密钥留空，用户需要自己填写
  baseURL: "https://api.siliconflow.cn/v1",
  defaultModel: "deepseek-ai/DeepSeek-OCR", // 使用默认模型
  timeout: 30000,
  maxRetries: 3,
});

// 记账相关的智能体配置
export const accountingAgents: AgentConfig[] = [
  smallcountAssistantAgent,
  dataOperatorAgent,
  incomeExpenseAnalystAgent,
  summarizerAgent,
];

// 初始化智能体
export const initializeAgents = () => {
  console.log("初始化智能体...");

  try {
    accountingAgents.forEach((agent) => {
      console.log("正在注册智能体:", agent.id);
      simpleOpenAI.registerAgent(agent);
      console.log("智能体注册成功:", agent.id);
    });

    // 设置默认智能体为SmallCount助手
    simpleOpenAI.setDefaultAgent("smallcount-assistant");
    const defaultAgent = simpleOpenAI.getAgent("smallcount-assistant");
    console.log("默认智能体设置为：", defaultAgent?.id);
    console.log(
      "默认智能体ID：",
      simpleOpenAI.getAgent("smallcount-assistant")?.id
    );

    return accountingAgents;
  } catch (error) {
    console.error("初始化智能体失败:", error);
    throw error;
  }
};
