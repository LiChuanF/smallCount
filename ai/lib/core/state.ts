// src/ai-core/core/state.ts
import { ChatMessage } from '../types';

interface Session {
  id: string;
  messages: ChatMessage[];
  currentAgentId: string;
  updatedAt: number;
}

export class StateManager {
  private sessions: Map<string, Session> = new Map();

  createSession(id: string, initialAgentId: string) {
    this.sessions.set(id, {
      id,
      messages: [],
      currentAgentId: initialAgentId,
      updatedAt: Date.now()
    });
  }

  getSession(id: string): Session | undefined {
    return this.sessions.get(id);
  }

  getHistory(id: string): ChatMessage[] {
    return this.sessions.get(id)?.messages || [];
  }

  addMessage(id: string, msg: Omit<ChatMessage, 'id' | 'timestamp'>) {
    const session = this.sessions.get(id);
    if (session) {
      session.messages.push({
        ...msg,
        id: Math.random().toString(36).substring(7),
        timestamp: Date.now()
      });
      session.updatedAt = Date.now();
    }
  }

  setCurrentAgent(id: string, agentId: string) {
    const session = this.sessions.get(id);
    if (session) {
      session.currentAgentId = agentId;
      session.updatedAt = Date.now();
    }
  }
}