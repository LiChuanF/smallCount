/**
 * Tool系统管理模块
 * 
 * 本模块负责管理AI可调用的工具系统，
 * 包括工具注册、执行、参数验证和格式转换等功能。
 */

import { 
  ToolConfig, 
  ToolCall, 
  ToolResult, 
  ToolExecutionContext, 
  ToolParameter,
  SimpleOpenAIError,
  SimpleOpenAIErrorType 
} from './types';

/**
 * 工具管理器类
 * 
 * 负责管理所有注册的工具，提供注册、查询、执行和格式转换功能
 */
export class ToolManager {
  /** 存储所有工具的Map，key为toolId */
  private tools: Map<string, ToolConfig> = new Map();

  /**
   * 注册工具
   * 
   * @param toolConfig 工具配置对象
   * @throws 如果配置无效则抛出错误
   */
  public registerTool(toolConfig: ToolConfig): void {
    if (!toolConfig.id || !toolConfig.name || !toolConfig.description || !toolConfig.handler) {
      throw new Error('[ToolManager] Tool ID, name, description, and handler are required.');
    }

    this.tools.set(toolConfig.id, toolConfig);
  }

  /**
   * 获取工具配置
   * 
   * @param toolId 工具ID
   * @returns 工具配置对象，如果不存在则返回undefined
   */
  public getTool(toolId: string): ToolConfig | undefined {
    return this.tools.get(toolId);
  }

  /**
   * 根据工具名称获取工具配置
   * 
   * @param toolName 工具名称
   * @returns 工具配置对象，如果不存在则返回undefined
   */
  public getToolByName(toolName: string): ToolConfig | undefined {
    return Array.from(this.tools.values()).find(tool => tool.name === toolName);
  }

  /**
   * 获取所有工具
   * 
   * @returns 包含所有工具配置的数组
   */
  public getAllTools(): ToolConfig[] {
    return Array.from(this.tools.values());
  }

  /**
   * 获取指定工具ID列表的工具配置
   * 
   * @param toolIds 工具ID列表
   * @returns 工具配置数组
   */
  public getToolsByIds(toolIds: string[]): ToolConfig[] {
    return toolIds
      .map(id => this.tools.get(id))
      .filter(tool => tool && tool.enabled !== false) as ToolConfig[];
  }

  /**
   * 移除工具
   * 
   * @param toolId 要移除的工具ID
   * @returns 如果成功移除返回true，否则返回false
   */
  public removeTool(toolId: string): boolean {
    return this.tools.delete(toolId);
  }

  /**
   * 启用/禁用工具
   * 
   * @param toolId 工具ID
   * @param enabled 是否启用
   * @returns 如果操作成功返回true，否则返回false
   */
  public setToolEnabled(toolId: string, enabled: boolean): boolean {
    const tool = this.tools.get(toolId);
    if (!tool) return false;
    
    tool.enabled = enabled;
    return true;
  }

  /**
   * 检查工具是否存在
   * 
   * @param toolId 工具ID
   * @returns 如果工具存在返回true，否则返回false
   */
  public hasTool(toolId: string): boolean {
    return this.tools.has(toolId);
  }

  /**
   * 执行工具调用
   * 
   * @param toolCall 工具调用对象
   * @param context 工具执行上下文
   * @returns 工具执行结果
   */
  public async executeToolCall(
    toolCall: ToolCall,
    context: ToolExecutionContext
  ): Promise<ToolResult> {
    const { id, function: { name, arguments: argsString } } = toolCall;
    
    try {
      // 解析参数
      let args;
      try {
        args = JSON.parse(argsString);
      } catch (error) {
        throw new Error(`Invalid JSON in tool arguments: ${argsString}`);
      }

      // 查找工具
      const tool = this.getToolByName(name);
      if (!tool) {
        throw new Error(`Tool with name "${name}" not found`);
      }

      if (tool.enabled === false) {
        throw new Error(`Tool "${name}" is disabled`);
      }

      // 验证参数
      this.validateToolParameters(tool, args);

      // 执行工具
      const result = await tool.handler(args);

      return {
        toolCallId: id,
        result,
        isError: false
      };
    } catch (error) {
      return {
        toolCallId: id,
        result: null,
        isError: true,
        errorMessage: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * 批量执行工具调用
   * 
   * @param toolCalls 工具调用数组
   * @param context 工具执行上下文
   * @returns 工具执行结果数组
   */
  public async executeToolCalls(
    toolCalls: ToolCall[],
    context: ToolExecutionContext
  ): Promise<ToolResult[]> {
    const results: ToolResult[] = [];
    
    for (const toolCall of toolCalls) {
      const result = await this.executeToolCall(toolCall, context);
      results.push(result);
    }
    
    return results;
  }

  /**
   * 验证工具参数
   * 
   * @param tool 工具配置
   * @param args 参数对象
   * @throws 如果参数验证失败则抛出错误
   */
  private validateToolParameters(tool: ToolConfig, args: { [key: string]: any }): void {
    for (const [paramName, paramConfig] of Object.entries(tool.parameters)) {
      const value = args[paramName];
      
      // 检查必需参数
      if (paramConfig.required && (value === undefined || value === null)) {
        throw new Error(`Required parameter "${paramName}" is missing`);
      }
      
      // 如果参数不存在且不是必需的，跳过验证
      if (value === undefined || value === null) {
        continue;
      }
      
      // 类型验证
      switch (paramConfig.type) {
        case 'string':
          if (typeof value !== 'string') {
            throw new Error(`Parameter "${paramName}" must be a string`);
          }
          break;
        case 'number':
          if (typeof value !== 'number') {
            throw new Error(`Parameter "${paramName}" must be a number`);
          }
          break;
        case 'boolean':
          if (typeof value !== 'boolean') {
            throw new Error(`Parameter "${paramName}" must be a boolean`);
          }
          break;
        case 'object':
          if (typeof value !== 'object' || Array.isArray(value)) {
            throw new Error(`Parameter "${paramName}" must be an object`);
          }
          // 递归验证对象属性
          if (paramConfig.properties) {
            for (const [subParamName, subParamConfig] of Object.entries(paramConfig.properties)) {
              const subValue = value[subParamName];
              if (subParamConfig.required && (subValue === undefined || subValue === null)) {
                throw new Error(`Required parameter "${paramName}.${subParamName}" is missing`);
              }
            }
          }
          break;
        case 'array':
          if (!Array.isArray(value)) {
            throw new Error(`Parameter "${paramName}" must be an array`);
          }
          break;
      }
      
      // 枚举值验证
      if (paramConfig.enum && !paramConfig.enum.includes(value)) {
        throw new Error(`Parameter "${paramName}" must be one of: ${paramConfig.enum.join(', ')}`);
      }
    }
  }

  /**
   * 将工具配置转换为 OpenAI API 格式
   * 
   * @param tools 工具配置数组
   * @returns OpenAI API格式的工具定义数组
   */
  public toolsToOpenAIFormat(tools: ToolConfig[]): Array<{ type: string, function: any }> {
    return tools.map(tool => ({
      type: 'function',
      function: {
        name: tool.name,
        description: tool.description,
        parameters: {
          type: 'object',
          properties: tool.parameters,
          required: Object.entries(tool.parameters)
            .filter(([_, config]) => config.required)
            .map(([name, _]) => name)
        }
      }
    }));
  }

  /**
   * 将工具配置转换为系统提示词格式 (用于手动工具调用)
   * 
   * @param tools 工具配置数组
   * @returns 系统提示词字符串
   */
  public getToolsSystemPrompt(tools: ToolConfig[]): string {
    if (tools.length === 0) return '';
    
    let prompt = "## Available Tools\n\nYou have access to the following tools:\n\n";
    
    tools.forEach(tool => {
      prompt += `### ${tool.name}\n`;
      prompt += `- Description: ${tool.description}\n`;
      prompt += `- Parameters: ${JSON.stringify(tool.parameters, null, 2)}\n\n`;
    });
    
    prompt += "## Tool Usage Instruction\n";
    prompt += "To use a tool, you MUST output a JSON object in the following format. Do not include any other text before or after the JSON object when calling a tool.\n\n";
    prompt += "```json\n";
    prompt += "{\n  \"tool\": \"tool_name\",\n  \"args\": {\n    \"param1\": \"value1\"\n  }\n}\n";
    prompt += "```\n\n";
    
    return prompt;
  }

  /**
   * 创建错误对象
   * 
   * @param type 错误类型
   * @param message 错误消息
   * @param originalError 原始错误对象（可选）
   * @returns 格式化的错误对象
   */
  private createError(type: SimpleOpenAIErrorType, message: string, originalError?: any): SimpleOpenAIError {
    return {
      type,
      message,
      originalError
    };
  }
}