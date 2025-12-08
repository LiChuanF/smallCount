import { PaymentMethodService } from '@/db/services/PaymentMethodService';
import { ExecutionContext, ToolConfig } from '../lib/types';
import { BaseTools } from './BaseTools';

/**
 * 支付方式相关工具类
 */
export class PaymentMethodTools extends BaseTools {

  /**
   * 注册所有支付方式相关工具
   */
  public registerAllTools(): void {
    this.createCreatePaymentMethodTool();
    this.createGetAllPaymentMethodsTool();
    this.createGetPaymentMethodByIdTool();
    this.createUpdatePaymentMethodTool();
    this.createDeletePaymentMethodTool();
    this.createSetDefaultPaymentMethodTool();
    this.createGetDefaultPaymentMethodTool();
    this.createSearchPaymentMethodsTool();
    this.createCreatePaymentMethodsBatchTool();
    this.createUpdatePaymentMethodsBatchTool();
    this.createFindByNamePaymentMethodTool();
  }

  /**
   * 创建支付方式 - 单个创建
   */
  private createCreatePaymentMethodTool(): void {
    const tool: ToolConfig = {
      id: "createPaymentMethod",
      name: "createPaymentMethod",
      description: "创建新的支付方式",
      parameters: {
        type: "object",
        properties: {
          accountIds: { type: "string", description: "账户ID" },
          name: { type: "string", description: "支付方式名称" },
          icon: { type: "string", description: "支付方式图标" },
          isDefault: { type: "boolean", description: "是否设为默认支付方式" }
        },
        required: ["accountIds", "name"]
      },
      handler: this.wrapToolHandler(async (params: any, context: ExecutionContext) => {
        const { accountIds, name, icon, isDefault } = params;
        const result = await PaymentMethodService.createPaymentMethod(accountIds, name, icon, isDefault);
        return this.createSuccessResponse(`成功创建支付方式: ${name}`, result);
      })
    };

    this.createAndRegisterTool(tool);
  }

  /**
   * 获取所有支付方式
   */
  private createGetAllPaymentMethodsTool(): void {
    const tool: ToolConfig = {
      id: "getAllPaymentMethods",
      name: "getAllPaymentMethods",
      description: "获取所有支付方式列表",
      parameters: {
        type: "object",
        properties: {},
        required: []
      },
      handler: this.wrapToolHandler(async (params: any, context: ExecutionContext) => {
        const result = await PaymentMethodService.getAllPaymentMethods();
        return {
          success: true,
          count: result.length,
          data: result
        };
      })
    };

    this.createAndRegisterTool(tool);
  }

  /**
   * 根据ID获取支付方式
   */
  private createGetPaymentMethodByIdTool(): void {
    const tool: ToolConfig = {
      id: "getPaymentMethodById",
      name: "getPaymentMethodById",
      description: "根据ID获取指定支付方式",
      parameters: {
        type: "object",
        properties: {
          id: { type: "string", description: "支付方式ID" }
        },
        required: ["id"]
      },
      handler: this.wrapToolHandler(async (params: any, context: ExecutionContext) => {
        const { id } = params;
        const result = await PaymentMethodService.getPaymentMethodById(id);
        return {
          success: true,
          data: result
        };
      })
    };

    this.createAndRegisterTool(tool);
  }

  /**
   * 更新支付方式
   */
  private createUpdatePaymentMethodTool(): void {
    const tool: ToolConfig = {
      id: "updatePaymentMethod",
      name: "updatePaymentMethod",
      description: "更新指定支付方式的信息",
      parameters: {
        type: "object",
        properties: {
          id: { type: "string", description: "支付方式ID" },
          name: { type: "string", description: "支付方式名称" },
          icon: { type: "string", description: "支付方式图标" },
          isDefault: { type: "boolean", description: "是否设为默认支付方式" }
        },
        required: ["id"]
      },
      handler: this.wrapToolHandler(async (params: any, context: ExecutionContext) => {
        const { id, ...updates } = params;
        const result = await PaymentMethodService.updatePaymentMethod(id, updates);
        return this.createSuccessResponse(`成功更新支付方式`, result);
      })
    };

    this.createAndRegisterTool(tool);
  }

  /**
   * 删除支付方式
   */
  private createDeletePaymentMethodTool(): void {
    const tool: ToolConfig = {
      id: "deletePaymentMethod",
      name: "deletePaymentMethod",
      description: "删除指定的支付方式",
      parameters: {
        type: "object",
        properties: {
          id: { type: "string", description: "支付方式ID" }
        },
        required: ["id"]
      },
      handler: this.wrapToolHandler(async (params: any, context: ExecutionContext) => {
        const { id } = params;
        await PaymentMethodService.deletePaymentMethod(id);
        return this.createSuccessResponse(`成功删除支付方式`);
      })
    };

    this.createAndRegisterTool(tool);
  }

  /**
   * 设置默认支付方式
   */
  private createSetDefaultPaymentMethodTool(): void {
    const tool: ToolConfig = {
      id: "setDefaultPaymentMethod",
      name: "setDefaultPaymentMethod",
      description: "设置指定支付方式为默认支付方式",
      parameters: {
        type: "object",
        properties: {
          id: { type: "string", description: "支付方式ID" }
        },
        required: ["id"]
      },
      handler: this.wrapToolHandler(async (params: any, context: ExecutionContext) => {
        const { id } = params;
        const result = await PaymentMethodService.setDefaultPaymentMethod(id);
        return this.createSuccessResponse(`成功设置默认支付方式`, result);
      })
    };

    this.createAndRegisterTool(tool);
  }

  /**
   * 获取默认支付方式
   */
  private createGetDefaultPaymentMethodTool(): void {
    const tool: ToolConfig = {
      id: "getDefaultPaymentMethod",
      name: "getDefaultPaymentMethod",
      description: "获取当前默认支付方式",
      parameters: {
        type: "object",
        properties: {},
        required: []
      },
      handler: this.wrapToolHandler(async (params: any, context: ExecutionContext) => {
        const result = await PaymentMethodService.getDefaultPaymentMethod();
        return {
          success: true,
          data: result
        };
      })
    };

    this.createAndRegisterTool(tool);
  }

  /**
   * 搜索支付方式
   */
  private createSearchPaymentMethodsTool(): void {
    const tool: ToolConfig = {
      id: "searchPaymentMethods",
      name: "searchPaymentMethods",
      description: "根据关键词搜索支付方式",
      parameters: {
        type: "object",
        properties: {
          keyword: { type: "string", description: "搜索关键词" }
        },
        required: ["keyword"]
      },
      handler: this.wrapToolHandler(async (params: any, context: ExecutionContext) => {
        const { keyword } = params;
        const result = await PaymentMethodService.searchPaymentMethods(keyword);
        return {
          success: true,
          count: result.length,
          keyword,
          data: result
        };
      })
    };

    this.createAndRegisterTool(tool);
  }

  /**
   * 批量创建支付方式
   */
  private createCreatePaymentMethodsBatchTool(): void {
    const tool: ToolConfig = {
      id: "createPaymentMethodsBatch",
      name: "createPaymentMethodsBatch",
      description: "批量创建支付方式",
      parameters: {
        type: "object",
        properties: {
          paymentMethods: {
            type: "array",
            description: "支付方式数据数组",
            items: {
              type: "object",
              properties: {
                accountIds: { type: "string", description: "账户ID" },
                name: { type: "string", description: "支付方式名称" },
                icon: { type: "string", description: "支付方式图标" },
                isDefault: { type: "boolean", description: "是否设为默认支付方式" }
              },
              required: ["accountIds", "name"]
            }
          }
        },
        required: ["paymentMethods"]
      },
      handler: this.wrapToolHandler(async (params: any, context: ExecutionContext) => {
        const { paymentMethods } = params;
        const result = await PaymentMethodService.createPaymentMethodsBatch(paymentMethods);
        return this.createSuccessResponse(`成功批量创建 ${result.length} 个支付方式`, result);
      })
    };

    this.createAndRegisterTool(tool);
  }

  /**
   * 批量更新支付方式
   */
  private createUpdatePaymentMethodsBatchTool(): void {
    const tool: ToolConfig = {
      id: "updatePaymentMethodsBatch",
      name: "updatePaymentMethodsBatch",
      description: "批量更新支付方式",
      parameters: {
        type: "object",
        properties: {
          updates: {
            type: "array",
            description: "支付方式更新数据数组",
            items: {
              type: "object",
              properties: {
                id: { type: "string", description: "支付方式ID" },
                name: { type: "string", description: "支付方式名称" },
                icon: { type: "string", description: "支付方式图标" },
                isDefault: { type: "boolean", description: "是否设为默认支付方式" }
              },
              required: ["id"]
            }
          }
        },
        required: ["updates"]
      },
      handler: this.wrapToolHandler(async (params: any, context: ExecutionContext) => {
        const { updates } = params;
        const result = await PaymentMethodService.updatePaymentMethodsBatch(updates);
        return this.createSuccessResponse(`成功批量更新 ${result.length} 个支付方式`, result);
      })
    };

    this.createAndRegisterTool(tool);
  }

  /**
   * 根据名称查找支付方式
   */
  private createFindByNamePaymentMethodTool(): void {
    const tool: ToolConfig = {
      id: "findByNamePaymentMethod",
      name: "findByNamePaymentMethod",
      description: "根据名称查找支付方式",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string", description: "支付方式名称" }
        },
        required: ["name"]
      },
      handler: this.wrapToolHandler(async (params: any, context: ExecutionContext) => {
        const { name } = params;
        const result = await PaymentMethodService.findByName(name);
        return {
          success: true,
          data: result
        };
      })
    };

    this.createAndRegisterTool(tool);
  }
}