// src/ai-core/core/network.ts
import EventSource from "react-native-sse";
import { DEFAULT_BASE_URL, DEFAULT_MODEL } from "../config";
import { ChatMessage, CoreConfig } from "../types";
import { Logger } from "../utils/logger";

export class NetworkClient {
  constructor(private config: CoreConfig) {}

  /**
   * 流式聊天请求
   */
  async stream(
    messages: ChatMessage[],
    systemPrompt: string,
    model: string,
    temperature: number,
    callbacks: {
      onDelta: (text: string) => void;
      onError: (err: any) => void;
    },
    signal?: AbortSignal,
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      try {

        // 构建 OpenAI 格式消息
        const apiMessages = [
          { role: "system", content: systemPrompt },
          ...messages.map((m) => ({
            role: m.role === "tool" ? "user" : m.role, // 兼容性转换：将 tool 结果伪装成 user 消息
            content: m.content,
          })).slice(-(this.config?.maxMsgCount || 10)),
        ];
        Logger.info("开始向云模型发送请求", "内容：", {
          messages: apiMessages,
          msgLen: apiMessages.length,
          model,
          temperature,
        });
        const url = `${this.config.baseURL || DEFAULT_BASE_URL}/chat/completions`;

        // 获取超时时间，默认为30秒
        const timeout = (this.config.timeout || 10 * 60) * 1000;

        const es = new EventSource(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${this.config.apiKey}`,
          },
          body: JSON.stringify({
            model: model || DEFAULT_MODEL,
            messages: apiMessages,
            stream: true,
            temperature: temperature,
          }),
        });

        let fullText = "";
        let isDone = false;

        const cleanup = () => {
          es.removeAllEventListeners();
          es.close();
        };

        // 设置超时定时器
        const timeoutId = setTimeout(() => {
          if (!isDone) {
            isDone = true;
            cleanup();
            const timeoutError = new Error(
              `Request timeout after ${timeout / 1000}s`
            );
            callbacks.onError(timeoutError);
            reject(timeoutError);
          }
        }, timeout);

        // 监听外部取消信号
        if (signal) {
          signal.addEventListener("abort", () => {
            if (!isDone) {
              isDone = true;
              clearTimeout(timeoutId);
              cleanup();
              reject(new Error("Request aborted"));
            }
          });
        }

        es.addEventListener("message", (event: any) => {
          if (isDone) return;

          if (event.data === "[DONE]") {
            isDone = true;
            clearTimeout(timeoutId);
            cleanup();
            Logger.info("流式请求完成", "内容：", {
              fullText,
            });
            resolve(fullText);
            return;
          }

          try { 
            const parsed = JSON.parse(event.data);
            const delta = parsed.choices?.[0]?.delta?.content;
            if (delta) {
              fullText += delta;
              callbacks.onDelta(delta);
            }
          } catch (e) {
            Logger.error("NetworkClient", "流式解析事件失败", e);
            // 忽略解析错误 (如 ping 帧)
          }
        });

        es.addEventListener("error", (event: any) => {
          Logger.error("NetworkClient", "流式连接错误", event);
          if (!isDone) {
            // 如果已经有内容了，可能只是连接中断，视为成功返回
            if (fullText.length > 0) {
              isDone = true;
              clearTimeout(timeoutId);
              cleanup();
              resolve(fullText);
            } else {
              isDone = true;
              clearTimeout(timeoutId);
              cleanup();
              callbacks.onError(event);
              reject(new Error("Stream connection error"));
            }
          }
        });

        es.addEventListener("open", () => {
          // 连接建立
        });
      } catch (error) {
        Logger.error("NetworkClient", "流式请求失败", error);
        reject(error);
      }
    });
  }
}
