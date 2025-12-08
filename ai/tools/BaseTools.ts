import { ExpoAgentCore } from '../lib';
import { ExecutionContext, ToolConfig } from '../lib/types';

/**
 * 工具类基础类，提供通用的工具注册和管理功能
 */
export abstract class BaseTools {
  protected agentCore: ExpoAgentCore;

  constructor(agentCore: ExpoAgentCore) {
    this.agentCore = agentCore;
  }

  /**
   * 创建并注册一个新工具
   * @param toolConfig 工具配置
   */
  protected createAndRegisterTool(toolConfig: ToolConfig): void {
    this.agentCore.registerTool(toolConfig);
  }

  /**
   * 创建标准成功响应
   * @param message 响应消息
   * @param data 响应数据
   */
  protected createSuccessResponse(message: string, data?: any): any {
    return {
      success: true,
      message,
      data
    };
  }

  /**
   * 创建标准错误响应
   * @param message 错误消息
   * @param error 错误对象
   */
  protected createErrorResponse(message: string, error?: any): any {
    return {
      success: false,
      message,
      error: error instanceof Error ? error.message : String(error)
    };
  }

  /**
   * 执行工具处理函数并包装错误处理
   * @param handler 实际的处理函数
   */
  protected wrapToolHandler(handler: (params: any, context: ExecutionContext) => Promise<any>) {
    return async (params: any, context: ExecutionContext) => {
      try {
        return await handler(params, context);
      } catch (error) {
        return this.createErrorResponse(
          error instanceof Error ? error.message : "操作失败",
          error
        );
      }
    };
  }

  /**
   * 获取工具描述信息
   * @param toolIds 工具ID数组
   * @returns 工具描述信息数组
   */
  public getToolsDesc(toolIds: string[]): Array<{id: string, name: string, description: string, parameters?: any}> {
    return toolIds.map(toolId => {
      const tool = this.agentCore.getTool(toolId);
      if (!tool) {
        return {
          id: toolId,
          name: 'Unknown',
          description: 'Tool not found'
        };
      }
      
      return {
        id: tool.id,
        name: tool.name,
        description: tool.description,
        parameters: tool.parameters
      };
    });
  }

  /**
   * 注册所有工具 - 子类需要实现此方法
   */
  public abstract registerAllTools(): void;
}