// src/ai-core/core/engine.ts
import { WorkflowEvents } from '../types';
import { Logger } from '../utils/logger';
import { buildSystemPrompt, parseToolCall } from '../utils/parsers';
import { NetworkClient } from './network';
import { Registry } from './registry';
import { StateManager } from './state';

interface RunOptions {
  sessionId: string;
  input: string;
  maxSteps?: number;
}

export class Engine {
  private abortController: AbortController | null = null;

  constructor(
    private network: NetworkClient,
    private state: StateManager,
    private registry: Registry
  ) {}

  public stop() {
    if (this.abortController) {
      Logger.info('Engine', '用户手动停止执行');
      this.abortController.abort();
      this.abortController = null;
    }
  }

  public async run(options: RunOptions, events: WorkflowEvents) {
    this.abortController = new AbortController();
    const { sessionId, input, maxSteps = 15 } = options;

    if (events.onStart) events.onStart();
    Logger.info('Engine', `开始工作流 Session: ${sessionId}`, { input });

    
    try {
      let session = this.state.getSession(sessionId);
      Logger.info('Engine', `当前 Session 状态:`, session);
      if (!session) throw new Error(`Session ${sessionId} not found`);
        if (input && input.trim() !== '') {
                this.state.addMessage(sessionId, {
                role: 'user',
                content: input,
                name: 'User'
                });
            }
      // 记录用户消息
      this.state.addMessage(sessionId, {
        role: 'user',
        content: input,
        name: 'User'
      });

      let step = 0;
      // 核心循环状态机
      while (step < maxSteps) {
        if (this.abortController.signal.aborted) break;
        step++;

        const currentAgentId = session.currentAgentId;
        const agent = this.registry.getAgent(currentAgentId);
        if (!agent) throw new Error(`Agent ${currentAgentId} not found`);

        Logger.info('Loop', `Step ${step}: 当前 Agent [${agent.name} (${currentAgentId})]`);

        // 1. 准备上下文
        const history = this.state.getHistory(sessionId);
        const availableTools = this.registry.getToolsForAgent(currentAgentId);
        const systemPrompt = buildSystemPrompt(agent.systemPrompt, availableTools);

        // 2. 调用 LLM (等待完整响应)
        Logger.info('LLM', `正在调用模型: ${agent.model || 'Default'}...`);
        let responseContent = '';
        
        try {
          // 注意：虽然是 stream，但我们在这里 await 它的完成以确保拿到完整的 JSON
          // UI 的流式更新通过 onTextDelta 回调进行
          responseContent = await this.network.stream(
            history,
            systemPrompt,
            agent.model!,
            agent.temperature ?? 0.5, // 降低温度以提高工具调用稳定性
            {
              onDelta: (text) => {
                if (events.onTextDelta) events.onTextDelta(text, currentAgentId);
              },
              onError: (e) => {
                if (events.onError) events.onError(e);
              }
            },
            this.abortController.signal
          );
        } catch (error) {
          if (this.abortController.signal.aborted) break;
          throw error;
        }

        // 3. 记录 LLM 原始回复
        Logger.info('LLM', `模型回复完成 (${responseContent.length} chars)`);
        Logger.info('LLM', `模型回复内容: ${responseContent}`);
        this.state.addMessage(sessionId, {
          role: 'assistant',
          content: responseContent,
          name: agent.name,
          agentId: currentAgentId
        });

        // 4. 解析工具调用
        const toolCall = parseToolCall(responseContent);

        if (toolCall) {
          // === 分支 A: 发现工具调用 ===
          Logger.info('Parser', `检测到工具调用: ${toolCall.name} ${JSON.stringify(availableTools)}`, toolCall.args);
          
          if (events.onToolCall) {
             events.onToolCall(toolCall.name, toolCall.args, currentAgentId);
          }

          const toolConfig = availableTools.find(t => t.name === toolCall.name);

          if (!toolConfig) {
             Logger.error('Engine', `试图调用未注册/不可用的工具: ${toolCall.name}`);
             // 将错误反馈给 Agent，让它重试或道歉
             this.state.addMessage(sessionId, {
               role: 'user',
               content: `System Error: Tool "${toolCall.name}" not found in available tools list.`,
               name: 'System'
             });
             continue; // 继续循环，让 AI 看到错误并处理
          }

          // 4.1 处理转接 (Handoff)
          if (toolConfig.targetAgentId) {
            const fromAgent = currentAgentId;
            const toAgentId = toolConfig.targetAgentId;
            
            Logger.info('Engine', `🔄 正在转接: ${fromAgent} -> ${toAgentId}`);
            
            this.state.setCurrentAgent(sessionId, toAgentId);
            session = this.state.getSession(sessionId)!; // 刷新引用

            // 插入系统消息，不仅是记录，更是为了告诉下一个 Agent 前因后果
            this.state.addMessage(sessionId, {
              role: 'system',
              content: `[System]: Task transferred from ${agent.name} to ${toolConfig.name}. Context: ${JSON.stringify(toolCall.args)}`,
              name: 'System'
            });

            if (events.onAgentChange) events.onAgentChange(fromAgent, toAgentId);
            
            // 关键：转接后，立即进入下一轮循环，让新 Agent 接管
            continue; 
          } 
          
          // 4.2 处理普通工具
          else {
            Logger.info('Tool', `执行工具: ${toolConfig.name}...`);
            try {
              const result = await toolConfig.handler(toolCall.args, {
                sessionId,
                currentAgentId,
                history
              });
              
              Logger.info('Tool', `工具执行成功`, result);
              if (events.onToolResult) events.onToolResult(toolConfig.name, result);

              // 将结果存入历史
              this.state.addMessage(sessionId, {
                role: 'user', 
                content: `Tool '${toolConfig.name}' output:\n${typeof result === 'string' ? result : JSON.stringify(result)}`,
                name: 'Tool'
              });

              // 关键：工具执行完，必须 Continue，让当前 Agent 读取结果并决定下一步 (是总结还是继续调用)
              continue;

            } catch (err: any) {
              Logger.error('Tool', `工具执行失败`, err);
              this.state.addMessage(sessionId, {
                role: 'user',
                content: `Tool Error: ${err.message}`,
                name: 'System'
              });
              continue;
            }
          }
        } else {
          // === 分支 B: 没有工具调用 ===
          Logger.info('Engine', `未检测到工具调用，任务可能已完成或等待用户输入。`);
          
          // 如果当前 Agent 只是一个中间人 (如 DataOperator)，但它没有调用工具也没有转接，
          // 这通常意味着出错了 (Prompt 没遵循好)，或者它直接回复了用户。
          // 在当前架构下，如果它回复了文本，我们视为本轮对话结束。
          break;
        }
      }

      if (step >= maxSteps) {
        Logger.error('Engine', `达到最大循环次数 (${maxSteps})，强制停止`);
      }

    } catch (error) {
      Logger.error('Engine', '工作流发生未捕获异常', error);
      if (events.onError) events.onError(error as Error);
    } finally {
      this.abortController = null;
      Logger.info('Engine', '工作流结束');
      if (events.onComplete) events.onComplete();
    }
  }
}