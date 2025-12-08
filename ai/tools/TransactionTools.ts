import useDataStore from "@/storage/store/useDataStore";
import { ExecutionContext, ToolConfig } from "../lib/types";
import { Logger } from "../lib/utils/logger";
import { BaseTools } from "./BaseTools";

/**
 * 交易相关工具类
 */
export class TransactionTools extends BaseTools {
  /**
   * 注册所有交易相关工具
   */
  public registerAllTools(): void {
    this.createTransactionTool();
    this.createQueryTransactionsTool();
    this.createDeleteTransactionTool();
    this.createUpdateTransactionTool();
  }

  /**
   * 创建交易记录工具
   */
  private createTransactionTool(): void {
    const addTransactionTool: ToolConfig = {
      id: "addTransaction",
      name: "addTransaction",
      description: "添加一笔新的收支记录",
      parameters: {
        type: "object",
        properties: {
          type: {
            type: "string",
            description: "'income' (收入) 或 'expense' (支出)",
            enum: ["income", "expense"],
          },
          amount: { type: "number", description: "金额" },
          tagId: {
            type: "string",
            description: "分类标签ID",
          },
          paymentMethodId: {
            type: "string",
            description: "支付方式ID",
          },
          description: { type: "string", description: "其他的一些描述" },
          notes: { type: "string", description: "备注" },
          transactionDate: {
            type: "string",
            description: "交易日期 (YYYY-MM-DD)",
          },
        },
        required: ["type", "amount", "tagId"],
      },
      handler: this.wrapToolHandler(
        async (params: any, context: ExecutionContext) => {
          const {
            type,
            amount,
            tagId,
            paymentMethodId,
            description,
            transactionDate,
            notes,
          } = params;

          // 使用 useDataStore 的 addTransaction 方法
          const { addTransaction, activeAccountId } = useDataStore.getState();

          // 构建交易对象
          const transaction = {
            type,
            amount: Number(amount),
            tagId,
            paymentMethodId,
            description: description || "",
            transactionDate: new Date(transactionDate) || new Date(), // 使用当前日期
            accountId: activeAccountId || "", // 使用当前活跃账户ID
            notes: notes || "",
            transferAccountId: null, // 简化版本不支持转账
            location: null, // 简化版本不支持位置
            receiptImageUrl: null, // 简化版本不支持收据图片
            isRecurring: false, // 简化版本不支持周期性交易
            recurringRule: null, // 简化版本不支持周期性规则
            isConfirmed: true, // 默认已确认
            attachmentIds: null, // 简化版本不支持附件
          };

          try {
            Logger.info(
              "TransactionTools",
              `添加交易记录: ${JSON.stringify(transaction)}`
            );
            const newTransaction = await addTransaction(transaction);

            return this.createSuccessResponse(
              `已成功记录一笔${type === "income" ? "收入" : "支出"}：${amount}元，分类：${tagId}`,
              newTransaction
            );
          } catch (error) {
            throw error;
          }
        }
      ),
    };

    this.createAndRegisterTool(addTransactionTool);
  }

  /**
   * 创建查询交易工具
   */
  private createQueryTransactionsTool(): void {
    const queryTransactionsTool: ToolConfig = {
      id: "queryTransactions",
      name: "queryTransactions",
      description: "按日期月份查询所有的收支记录数据",
      parameters: {
        type: "object",
        properties: {
          limit: { type: "number", description: "返回数量限制" },
          startDate: { type: "string", description: "开始日期 (YYYY-MM-DD)" },
          endDate: { type: "string", description: "结束日期 (YYYY-MM-DD)" },
        },
        required: [],
      },
      handler: this.wrapToolHandler(
        async (params: any, context: ExecutionContext) => {
          const { limit, startDate, endDate, category, type } = params;

          // 使用 useDataStore 的 loadTransactions 和 transactions 方法
          const { loadTransactions, transactions, activeAccountId } =
            useDataStore.getState();

          try {
            // 加载当前月份的交易数据
            await loadTransactions(
              activeAccountId || "",
              new Date().getFullYear(),
              new Date().getMonth() + 1
            );

            // 获取当前所有交易数据
            let filteredTransactions = [...transactions];

            // 应用筛选条件
            if (type) {
              filteredTransactions = filteredTransactions.filter(
                (tx) => tx.type === type
              );
            }

            if (startDate) {
              const start = new Date(startDate);
              filteredTransactions = filteredTransactions.filter(
                (tx) => new Date(tx.transactionDate) >= start
              );
            }

            if (endDate) {
              const end = new Date(endDate);
              filteredTransactions = filteredTransactions.filter(
                (tx) => new Date(tx.transactionDate) <= end
              );
            }

            // 应用数量限制
            if (limit && limit > 0) {
              filteredTransactions = filteredTransactions.slice(0, limit);
            }

            return {
              success: true,
              count: filteredTransactions.length,
              transactions: filteredTransactions,
              filters: { limit, startDate, endDate, category, type },
            };
          } catch (error) {
            throw error;
          }
        }
      ),
    };

    this.createAndRegisterTool(queryTransactionsTool);
  }

  /**
   * 创建删除交易工具
   */
  private createDeleteTransactionTool(): void {
    const deleteTransactionTool: ToolConfig = {
      id: "deleteTransaction",
      name: "deleteTransaction",
      description: "删除指定的收支记录",
      parameters: {
        type: "object",
        properties: {
          id: { type: "string", description: "交易记录ID" },
        },
        required: ["id"],
      },
      handler: this.wrapToolHandler(
        async (params: any, context: ExecutionContext) => {
          const { id } = params;

          // 使用 useDataStore 的 deleteTransaction 方法
          const { deleteTransaction } = useDataStore.getState();

          try {
            await deleteTransaction(id);

            return this.createSuccessResponse(
              `已成功删除ID为 ${id} 的交易记录`
            );
          } catch (error) {
            throw error;
          }
        }
      ),
    };

    this.createAndRegisterTool(deleteTransactionTool);
  }

  /**
   * 创建更新交易工具
   */
  private createUpdateTransactionTool(): void {
    const updateTransactionTool: ToolConfig = {
      id: "updateTransaction",
      name: "updateTransaction",
      description: "更新指定的收支记录",
      parameters: {
        type: "object",
        properties: {
          id: { type: "string", description: "交易记录ID" },
          type: {
            type: "string",
            description: "'income' (收入) 或 'expense' (支出)",
            enum: ["income", "expense"],
          },
          amount: { type: "number", description: "金额" },
          category: {
            type: "string",
            description: "分类，如：餐饮、交通、工资",
          },
          description: { type: "string", description: "备注描述" },
        },
        required: ["id"],
      },
      handler: this.wrapToolHandler(
        async (params: any, context: ExecutionContext) => {
          const { id, type, amount, category, description } = params;

          // 使用 useDataStore 的 updateTransaction 方法
          const { updateTransaction } = useDataStore.getState();

          // 构建更新数据对象
          const transactionData: any = {};

          if (type !== undefined) transactionData.type = type;
          if (amount !== undefined) transactionData.amount = Number(amount);
          if (category !== undefined) transactionData.category = category;
          if (description !== undefined)
            transactionData.description = description;

          try {
            await updateTransaction(id, transactionData);

            return this.createSuccessResponse(
              `已成功更新ID为 ${id} 的交易记录`,
              { id, type, amount, category, description }
            );
          } catch (error) {
            throw error;
          }
        }
      ),
    };

    this.createAndRegisterTool(updateTransactionTool);
  }
}
