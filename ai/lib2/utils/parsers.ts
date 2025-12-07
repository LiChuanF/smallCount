// src/ai-core/utils/parsers.ts
import { ToolConfig } from '../types';

export function buildSystemPrompt(basePrompt: string, tools: ToolConfig[]): string {
  if (!tools || tools.length === 0) return basePrompt;

  const toolDefinitions = tools.map(t => ({
    name: t.name,
    description: t.description,
    parameters: t.parameters
  }));

  const instructions = `
\n\n### Tool Usage Instructions
You have access to the following tools.
To call a tool, you MUST respond with a JSON object.
The JSON should be wrapped in a markdown code block, BUT if you forget the block, valid JSON is also accepted.

Format:
\`\`\`json
{
  "tool": "tool_name",
  "arguments": {
    "arg1": "value1"
  }
}
\`\`\`

### Available Tools
${JSON.stringify(toolDefinitions, null, 2)}
`;

  return basePrompt + instructions;
}

export function parseToolCall(content: string): { name: string; args: any } | null {
  try {
    let jsonStr = '';

    // 1. 优先尝试匹配 Markdown 代码块 (兼容 json, JSON, 或无语言标记)
    const codeBlockRegex = /```(?:json)?\s*([\s\S]*?)\s*```/i;
    const match = content.match(codeBlockRegex);

    if (match) {
      jsonStr = match[1];
    } else {
      // 2. 暴力提取：寻找最外层的 {}
      // 这解决了 LLM 有时只返回 JSON 不返回 Markdown 的问题
      const firstBrace = content.indexOf('{');
      const lastBrace = content.lastIndexOf('}');
      
      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        jsonStr = content.substring(firstBrace, lastBrace + 1);
      }
    }

    if (!jsonStr) return null;

    // 3. 清理与容错处理
    jsonStr = jsonStr.trim()
      // 移除可能的非法控制字符
      .replace(/[\u0000-\u001F]+/g, "")
      // 有些模型会在 JSON 中包含注释，简单尝试清理 (并不完美，但够用)
      .replace(/\/\/.*$/gm, ""); 

    const parsed = JSON.parse(jsonStr);

    // 4. 验证结构
    // 兼容 {"tool": "name", "args": ...} 和 {"tool": "name", "arguments": ...}
    if (parsed && typeof parsed === 'object' && parsed.tool) {
      const args = parsed.arguments || parsed.args || {};
      return { name: parsed.tool, args: args };
    }
    
    // 兼容 OpenAI 原生格式 {"function": {"name": ...}} (虽然我们Prompt没教，但以防万一)
    if (parsed?.function?.name) {
        return { name: parsed.function.name, args: JSON.parse(parsed.function.arguments || '{}') };
    }

  } catch (e) {
    // 解析失败意味着这可能只是一段包含花括号的普通文本
    return null;
  }
  return null;
}