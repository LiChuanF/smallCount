// src/ai-core/utils/parsers.ts
import { ToolConfig } from '../types';
import { Logger } from './logger';

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

export function parseToolCall (content: string) {
  try {
    let jsonStr = '';

    // 1. 优先尝试匹配 Markdown 代码块
    const codeBlockRegex = /```(?:json)?\s*([\s\S]*?)\s*```/i;
    const match = content.match(codeBlockRegex);

    if (match) {
      jsonStr = match[1];
    } else {
      // 2. 暴力提取：寻找最外层的 {}
      const firstBrace = content.indexOf('{');
      const lastBrace = content.lastIndexOf('}');

      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        jsonStr = content.substring(firstBrace, lastBrace + 1);
      }
    }

    if (!jsonStr) return null;

    // 3. 清理与容错处理 (修复部分)
    jsonStr = jsonStr.trim()
      // 【关键修复1】移除控制字符，但保留 换行(\n)、回车(\r)、制表符(\t)
      // 范围排除：\u0009(tab), \u000A(\n), \u000D(\r)
      .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]+/g, "")
      
      // 【关键修复2】移除注释 (现在有了换行符，正则变得简单且安全)
      .replace(/\/\*[\s\S]*?\*\//g, "")  // 移除块注释 /* ... */
      // 移除单行注释 // ...
      // 使用 (^|[^\\:]) 是为了避免误删 URL (如 https://) 中的双斜杠，
      // 如果你的场景不涉及 URL 参数，可以直接用 .replace(/\/\/.*$/gm, "")
      .replace(/(^|[^\\:])\/\/.*$/gm, '$1'); 

    const parsed = JSON.parse(jsonStr);

    // 4. 验证结构
    if (parsed && typeof parsed === 'object' && parsed.tool) {
      const args = parsed.arguments || parsed.args || {};
      return { name: parsed.tool, args: args };
    }

    if (parsed?.function?.name) {
      return { name: parsed.function.name, args: JSON.parse(parsed.function.arguments || '{}') };
    }

  } catch (e: any) {
    // 解析失败意味着这可能只是一段包含花括号的普通文本
    Logger.error('parseToolCall', `JSON 解析错误: ${e.message}`);
    return null;
  }
  return null;
}
