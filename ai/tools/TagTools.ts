import useDataStore from '@/storage/store/useDataStore';
import { ExecutionContext, ToolConfig } from '../lib/types';
import { Logger } from '../lib/utils/logger';
import { BaseTools } from './BaseTools';

/**
 * 标签相关工具类
 */
export class TagTools extends BaseTools {

  /**
   * 注册所有标签相关工具
   */
  public registerAllTools(): void {
    this.createLoadTagsTool();
    this.createAddTagTool();
    this.createUpdateTagTool();
    this.createDeleteTagTool();
  }

  /**
   * 创建加载标签工具
   */
  private createLoadTagsTool(): void {
    const loadTagsTool: ToolConfig = {
      id: "loadTags",
      name: "loadTags",
      description: "加载当前账户的所有标签",
      parameters: {
        type: "object",
        properties: {},
        required: [],
      },
      handler: this.wrapToolHandler(async (params: any, context: ExecutionContext) => {
        // 使用 useDataStore 的 loadTags 方法
        const { loadTags, tags } = useDataStore.getState();
        
        try {
          await loadTags();
          
          return this.createSuccessResponse(
            `已成功加载 ${tags.length} 个标签`,
            { tags, count: tags.length }
          );
        } catch (error) {
          throw error;
        }
      }),
    };

    this.createAndRegisterTool(loadTagsTool);
  }

  /**
   * 创建添加标签工具
   */
  private createAddTagTool(): void {
    const addTagTool: ToolConfig = {
      id: "addTag",
      name: "addTag",
      description: "添加一个新的标签",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string", description: "标签名称" },
          color: { type: "string", description: "标签颜色，十六进制格式，如 #FF5733" },
          description: { type: "string", description: "标签描述" },
          type: { type: "string", description: "enum: ['category', 'custom']", enum: ['category', 'custom'] },
          icon: { type: "string", description: "标签图标，必须是@expo/vector-icons中Ionicons图标的名称" },
        },
        required: ["name"],
      },
      handler: this.wrapToolHandler(async (params: any, context: ExecutionContext) => {
        const { name, color, description ,type, icon} = params;
        
        // 使用 useDataStore 的 addTag 方法
        const { addTag } = useDataStore.getState();
        
        // 构建标签对象
        const tagData = {
          name,
          color: color || "#007AFF", // 默认蓝色
          description: description || "",
          type: type || 'income',
          icon: icon || '',
          isDefault: false,
        };
        
        try {
          Logger.info('TagTools', `添加标签: ${JSON.stringify(tagData)}`);
          const newTag = await addTag(tagData);
          
          return this.createSuccessResponse(
            `已成功添加标签：${name}`,
            newTag
          );
        } catch (error) {
          throw error;
        }
      }),
    };

    this.createAndRegisterTool(addTagTool);
  }

  /**
   * 创建更新标签工具
   */
  private createUpdateTagTool(): void {
    const updateTagTool: ToolConfig = {
      id: "updateTag",
      name: "updateTag",
      description: "更新指定的标签信息",
      parameters: {
        type: "object",
        properties: {
          id: { type: "string", description: "标签ID" },
          name: { type: "string", description: "标签名称" },
          color: { type: "string", description: "标签颜色，十六进制格式，如 #FF5733" },
          description: { type: "string", description: "标签描述" },
        },
        required: ["id"],
      },
      handler: this.wrapToolHandler(async (params: any, context: ExecutionContext) => {
        const { id, name, color, description } = params;
        
        // 使用 useDataStore 的 updateTag 方法
        const { updateTag } = useDataStore.getState();
        
        // 构建更新数据对象
        const tagData: any = {};
        
        if (name !== undefined) tagData.name = name;
        if (color !== undefined) tagData.color = color;
        if (description !== undefined) tagData.description = description;
        
        try {
          await updateTag(id, tagData);
          
          return this.createSuccessResponse(
            `已成功更新ID为 ${id} 的标签`,
            { id, name, color, description }
          );
        } catch (error) {
          throw error;
        }
      }),
    };

    this.createAndRegisterTool(updateTagTool);
  }

  /**
   * 创建删除标签工具
   */
  private createDeleteTagTool(): void {
    const deleteTagTool: ToolConfig = {
      id: "deleteTag",
      name: "deleteTag",
      description: "删除指定的标签",
      parameters: {
        type: "object",
        properties: {
          id: { type: "string", description: "标签ID" },
        },
        required: ["id"],
      },
      handler: this.wrapToolHandler(async (params: any, context: ExecutionContext) => {
        const { id } = params;
        
        // 使用 useDataStore 的 deleteTag 方法
        const { deleteTag } = useDataStore.getState();
        
        try {
          await deleteTag(id);
          
          return this.createSuccessResponse(`已成功删除ID为 ${id} 的标签`);
        } catch (error) {
          throw error;
        }
      }),
    };

    this.createAndRegisterTool(deleteTagTool);
  }

}