import useDataStore from '@/storage/store/useDataStore';
import { AGENT_IDS } from './constant';
import { ExpoAgentCore } from './lib';
import {
    AgentInfo,
    AnalysisDimension,
    generateDataOperatorPrompt,
    generateIncomeExpenseAnalystPrompt,
    generateSmallcountAssistantPrompt,
    generateSummarizerPrompt,
    ToolInfo
} from './prompts';
import { CommonTools, PaymentMethodTools, TagTools, TransactionTools } from './tools';

// 定义交易类型
interface Transaction {
  id: string;
  type: "income" | "expense";
  amount: number;
  category: string;
  date: string;
  description: string;
}



// 定义工具处理器类型
type ToolHandler = (params: any, context: any) => Promise<any>;

export class AgentsCreate {
  private agentCore: ExpoAgentCore;
  private transactions: Transaction[] = [];
  private transactionTools: TransactionTools;
  private paymentMethodTools: PaymentMethodTools;
  private commonTools: CommonTools;
  private tagTools: TagTools;

  constructor(config: {
    apiKey: string;
    baseURL?: string;
    defaultModel?: string;
    timeout?: number; // 单位：秒
  }) {
    // 初始化 ExpoAgentCore
    this.agentCore = new ExpoAgentCore({
      apiKey: config.apiKey,
      baseURL: config.baseURL || "https://api.siliconflow.cn/v1",
      defaultModel: config.defaultModel || "deepseek-ai/DeepSeek-R1-0528-Qwen3-8B",
      timeout: config.timeout || 30000,
    });

    // 初始化示例交易数据
    this.transactions = [];
    
    // 初始化工具类
    this.transactionTools = new TransactionTools(this.agentCore);
    this.paymentMethodTools = new PaymentMethodTools(this.agentCore);
    this.commonTools = new CommonTools(this.agentCore);
    this.tagTools = new TagTools(this.agentCore);
  }

  /**
   * 注册所有工具
   */
  public registerTools(): void {
    // 注册交易相关工具
    this.transactionTools.registerAllTools();
    
    // 注册支付方式相关工具
    this.paymentMethodTools.registerAllTools();
    
    // 注册常用工具
    this.commonTools.registerAllTools();
  }

  /**
   * 注册所有智能体
   */
  public registerAgents(): void {
    // 首先注册所有工具
    this.registerTools();
    
    // 准备智能体和工具信息
    const agentsInfo: AgentInfo[] = [
      {
        id: AGENT_IDS.SMALLCOUNT_ASSISTANT,
        name: AGENT_IDS.SMALLCOUNT_ASSISTANT,
        description: "主接待员，负责意图识别和分发。"
      },
      {
        id: AGENT_IDS.DATA_OPERATOR,
        name: AGENT_IDS.DATA_OPERATOR,
        description: "负责数据的增删改查操作。"
      },
      {
        id: AGENT_IDS.INCOME_EXPENSE_ANALYST,
        name: AGENT_IDS.INCOME_EXPENSE_ANALYST,
        description: "负责数据分析和统计。"
      },
      {
        id: AGENT_IDS.SUMMARIZER,
        name: AGENT_IDS.SUMMARIZER,
        description: "负责汇总信息并输出给用户。"
      }
    ];

    
    // 使用 BaseTools.getToolsDesc 方法获取工具信息
    const transactionToolIds = [
      "addTransaction",
      "queryTransactions", 
      "deleteTransaction",
      "updateTransaction",
    ];
    
    const paymentMethodToolIds = [
      "createPaymentMethod",
      "getAllPaymentMethods",
      "getPaymentMethodById",
      "updatePaymentMethod",
      "deletePaymentMethod",
      "searchPaymentMethods",
      "findByNamePaymentMethod"
    ];
    
    const commonToolIds = [
      "getCurrentTime"
    ];

    // 获取tag工具信息
    const tagToolIds = [
      "addTag",
      "loadTags", 
      "deleteTag",
      "updateTag",
    ];
    
    // 获取交易工具信息
    const transactionToolsDesc = this.transactionTools.getToolsDesc(transactionToolIds);
    
    // 获取支付方式工具信息
    const paymentMethodToolsDesc = this.paymentMethodTools.getToolsDesc(paymentMethodToolIds);
    
    // 获取常用工具信息
    const commonToolsDesc = this.commonTools.getToolsDesc(commonToolIds);

    
    const tagToolsDesc = this.tagTools.getToolsDesc(tagToolIds);
    
    // 合并所有工具描述并转换为 ToolInfo 类型（包含 parameters）
    const toolsInfo: ToolInfo[] = [...commonToolsDesc, ...transactionToolsDesc, ...paymentMethodToolsDesc, ...tagToolsDesc].map(toolDesc => {
      // 从 agentCore 获取完整的工具信息，包括参数
      const tool = this.agentCore.getTool(toolDesc.id);
      return {
        id: toolDesc.id,
        name: toolDesc.name,
        description: toolDesc.description,
        parameters: tool?.parameters
      };
    });

    // 准备分析维度
    const analysisDimensions: AnalysisDimension[] = [
      {
        name: "收入分析",
        description: "分析用户的收入来源、稳定性和增长趋势",
        metrics: [
          "收入来源分析",
          "收入稳定性评估",
          "收入增长趋势",
          "收入结构优化建议"
        ]
      },
      {
        name: "支出分析",
        description: "分析用户的支出类别和习惯",
        metrics: [
          "支出类别分布",
          "必要支出与非必要支出比例",
          "支出习惯识别",
          "异常支出检测"
        ]
      },
      {
        name: "收支平衡分析",
        description: "评估用户的收支平衡状况",
        metrics: [
          "收支比例评估",
          "储蓄率计算",
          "财务健康度评分",
          "收支平衡建议"
        ]
      },
      {
        name: "时间序列分析",
        description: "分析收支的时间模式和趋势",
        metrics: [
          "月度/季度/年度收支对比",
          "季节性收支模式",
          "长期趋势预测",
          "周期性波动识别"
        ]
      }
    ];


    // 1. SMALLCOUNT助手 (总入口)
    this.agentCore.registerAgent({
      id: AGENT_IDS.SMALLCOUNT_ASSISTANT,
      name: "SMALLCOUNT助手",
      description: "主接待员，负责意图识别和分发。",
      systemPrompt: generateSmallcountAssistantPrompt(),
      handoffs: [AGENT_IDS.DATA_OPERATOR, AGENT_IDS.SUMMARIZER],
    });

    // 2. 数据操作助手
    this.agentCore.registerAgent({
      id: AGENT_IDS.DATA_OPERATOR,
      name: "DataOperator",
      description: "负责数据的增删改查操作。",
      systemPrompt: generateDataOperatorPrompt(
        useDataStore.getState().tags.map(tag => ({
          id: tag.id,
          name: tag.name,
        })),
        useDataStore.getState().paymentMethods.map(paymentMethod => ({
          id: paymentMethod.id,
          name: paymentMethod.name,
        })),
      ),
      tools: toolsInfo,
      handoffs: [AGENT_IDS.SUMMARIZER, AGENT_IDS.INCOME_EXPENSE_ANALYST,AGENT_IDS.DATA_OPERATOR], // 强制流转到总结助手
    });

    // 3. 收支分析师
    this.agentCore.registerAgent({
      id: AGENT_IDS.INCOME_EXPENSE_ANALYST,
      name: "Analyst",
      description: "负责数据分析和统计。",
      systemPrompt: generateIncomeExpenseAnalystPrompt({
        analysisDimensions
      }),
      tools: [],
      handoffs: [AGENT_IDS.SUMMARIZER], // 强制流转到总结助手
    });

    // 4. 总结归纳助手 (出口)
    this.agentCore.registerAgent({
      id: AGENT_IDS.SUMMARIZER,
      name: "Summarizer",
      description: "负责汇总信息并输出给用户。",
      systemPrompt: generateSummarizerPrompt(),
      tools: [],
      handoffs: [], // 末端节点
    });
  }

  /**
   * 初始化所有工具和智能体
   */
  public initialize(): void {
    this.registerTools();
    this.registerAgents();
  }

  /**
   * 创建新会话
   * @param initialAgentId 初始智能体ID，默认为main_agent
   * @returns 会话ID
   */
  public createSession(initialAgentId: string = "main_agent"): string {
    return this.agentCore.createSession(initialAgentId);
  }

  /**
   * 获取agentCore实例
   */
  public getAgentCore(): ExpoAgentCore {
    return this.agentCore;
  }

  /**
   * 设置交易数据（用于外部数据同步）
   */
  public setTransactions(transactions: Transaction[]): void {
    this.transactions = transactions;
  }

  /**
   * 获取当前所有交易数据
   */
  public getTransactions(): Transaction[] {
    return this.transactions;
  }
}