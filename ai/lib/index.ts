// src/ai-core/index.ts
import { Engine } from './core/engine';
import { NetworkClient } from './core/network';
import { Registry } from './core/registry';
import { StateManager } from './core/state';
import { AgentConfig, CoreConfig, ToolConfig, WorkflowEvents } from './types';

export * from './types';

export class ExpoAgentCore {
  private registry: Registry;
  private state: StateManager;
  private network: NetworkClient;
  private engine: Engine;
  private config: CoreConfig;

  private defaultAgentId: string | null = null;

  constructor(config: CoreConfig) {
    this.registry = new Registry();
    this.state = new StateManager();
    this.network = new NetworkClient(config);
    this.engine = new Engine(this.network, this.state, this.registry);
    this.config = config;
  }

  /**
   * 注册智能体
   */
  public registerAgent(agent: AgentConfig) {
    this.registry.registerAgent({
        ...agent,
        model: agent.model || this.config.defaultModel,
        temperature: agent.temperature || 0.7,
        maxTokens: agent.maxTokens || 2048,
    });
    if (!this.defaultAgentId) {
      this.defaultAgentId = agent.id;
    }
  }

  /**
   * 注册工具
   */
  public registerTool(tool: ToolConfig) {
    this.registry.registerTool(tool);
  }

  /**
   * 创建新会话
   */
  public createSession(initialAgentId?: string): string {
    const agentId = initialAgentId || this.defaultAgentId;
    if (!agentId) throw new Error('No agent registered or specified');
    
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.state.createSession(sessionId, agentId);
    return sessionId;
  }

  /**
   * 获取会话历史消息
   */
  public getMessages(sessionId: string) {
    return this.state.getHistory(sessionId);
  }

  /**
   * 设置当前会话的代理
   */
  public setCurrentAgent(sessionId: string, agentId: string) {
    this.state.setCurrentAgent(sessionId, agentId);
  }

  /**
   * 获取已注册的工具
   */
  public getTool(id: string) {
    return this.registry.getTool(id);
  }

  /**
   * 获取所有已注册的工具
   */
  public getAllTools() {
    const tools: { [key: string]: ToolConfig } = {};
    // 由于registry的tools是私有属性，我们需要添加一个getter方法
    // 这里我们通过反射来获取私有属性，这不是最佳实践，但为了快速实现
    // 在生产环境中，应该修改Registry类添加一个getAllTools方法
    const registryAny = this.registry as any;
    if (registryAny.tools && typeof registryAny.tools.entries === 'function') {
      for (const [id, tool] of registryAny.tools.entries()) {
        tools[id] = tool;
      }
    }
    return tools;
  }

  /**
   * 发送消息并开始处理 (非阻塞，返回取消函数)
   */
  public chat(
    sessionId: string, 
    message: string, 
    events: WorkflowEvents = {}
  ): () => void {
    try {
      // 异步执行 Engine 逻辑
      this.engine.run({ sessionId, input: message }, events);
    } catch (error) {
      events.onError?.(error as Error);
    }
    // 返回取消函数
    return () => {
      this.engine.stop();
    };
  }
}