import { ExpoAgentCore } from '../lib';
import { ExecutionContext } from '../lib/types';
import { BaseTools } from './BaseTools';

/**
 * 常用工具类，提供通用功能
 */
export class CommonTools extends BaseTools {
  constructor(agentCore: ExpoAgentCore) {
    super(agentCore);
  }

  /**
   * 注册所有常用工具
   */
  public registerAllTools(): void {
    // 注册获取当前时间的工具
    this.createAndRegisterTool({
      id: 'getCurrentTime',
      name: 'getCurrentTime',
      description: '获取当前时间的年月日',
      parameters: {
        type: 'object',
        properties: {},
        required: []
      },
      handler: this.wrapToolHandler(async (params: any, context: ExecutionContext) => {
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth() + 1; // 月份从0开始，需要+1
        
        return this.createSuccessResponse('获取当前时间成功', {
          year,
          month,
          day: now.getDate(),
          yearMonth: `${year}年${month}月${now.getDate()}日`,
        });
      })
    });
  }
}