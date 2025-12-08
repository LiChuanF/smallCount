import { ExpoAgentCore } from './lib';
import { PaymentMethodTools, TransactionTools } from './tools';

/**
 * 工具创建类，用于简化和标准化工具的创建过程
 */
export class AgentToolsCreate {
  private agentCore: ExpoAgentCore;
  private transactionTools: TransactionTools;
  private paymentMethodTools: PaymentMethodTools;

  constructor(agentCore: ExpoAgentCore) {
    this.agentCore = agentCore;
    this.transactionTools = new TransactionTools(agentCore);
    this.paymentMethodTools = new PaymentMethodTools(agentCore);
  }

  /**
   * 注册所有工具
   */
  public registerAllTools(): void {
    this.transactionTools.registerAllTools();
    this.paymentMethodTools.registerAllTools();
  }

}