// src/ai-core/utils/logger.ts

export const Logger = {
  info: (tag: string, message: string, data?: any) => {
    const timestamp = new Date().toISOString().split('T')[1].slice(0, 8);
    const prefix = `[${timestamp}] [${tag}]`;
    if (data) {
      console.log(`${prefix} ${message}`, JSON.stringify(data, null, 2));
    } else {
      console.log(`${prefix} ${message}`);
    }
  },
  error: (tag: string, message: string, error?: any) => {
    const timestamp = new Date().toISOString().split('T')[1].slice(0, 8);
    console.error(`[${timestamp}] [${tag}] ❌ ${message}`, error);
  }
};