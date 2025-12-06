import { useTheme } from "@/context/ThemeContext";
import { generateUUID } from "@/utils/uuid";
import { Ionicons } from "@expo/vector-icons";
import * as React from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import {
    Platform,
    StatusBar as RNStatusBar,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from "react-native";
import {
    Bubble,
    ComposerProps,
    DayProps,
    GiftedChat,
    IMessage,
    InputToolbar,
} from "react-native-gifted-chat";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { SimpleOpenAI } from "../ai/lib";

// --- Mock Data & Types ---
interface Transaction {
  id: string;
  type: "income" | "expense";
  amount: number;
  category: string;
  date: string;
  description: string;
}

let transactions: Transaction[] = [
  {
    id: "1",
    type: "expense",
    amount: 30,
    category: "Food",
    date: "2025-12-05",
    description: "Lunch",
  },
];

// --- Mock Tools Implementation ---
const addTransaction = (params: { [key: string]: any }) => {
  const { type, amount, category, description } = params;
  const newTx: Transaction = {
    id: Math.random().toString(36).substr(2, 9),
    type,
    amount,
    category,
    date: new Date().toISOString().split("T")[0],
    description: description || "",
  };
  transactions.push(newTx);
  return {
    success: true,
    message: `Added ${type} of ${amount} for ${category}`,
    transaction: newTx,
  };
};

const queryTransactions = (params: { [key: string]: any }) => {
  return { success: true, transactions };
};

// --- Main Component ---
export default function AIDemo() {
  const { theme, isDarkMode } = useTheme();
  const insets = useSafeAreaInsets();
  const [messages, setMessages] = useState<IMessage[]>([]);
  const [input, setInput] = useState("上周我的支出和收入相差多少？");
  const [isLoading, setIsLoading] = useState(false);
  const [ai, setAi] = useState<SimpleOpenAI | null>(null);
  const [currentRequest, setCurrentRequest] = useState<{
    cancel: () => void;
  } | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const tabbarHeight = 0;
  const keyboardTopToolbarHeight = Platform.select({ ios: 44, default: 0 });
  const keyboardVerticalOffset =
    insets.bottom + tabbarHeight + keyboardTopToolbarHeight;

  // Initialize AI
  useEffect(() => {
    const simpleOpenAI = new SimpleOpenAI({
      //   apiKey: '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',
      //   baseURL: 'https://openrouter.ai/api/v1',
      //   defaultModel: 'tngtech/deepseek-r1t2-chimera:free',
      //   apiKey: "sk-mewdvwtamzdkpsaiyzcqbbyelzscbyjeizfwzemitoovpnbr", // API密钥留空，用户需要自己填写
      //   baseURL: "https://api.siliconflow.cn/v1",
      //   defaultModel: "deepseek-ai/DeepSeek-OCR", // 使用默认模型
      apiKey: "658d3fd1f1e1485983186992472f1b9e.Ri9PknpGt3qLMQiP", // API密钥留空，用户需要自己填写
      baseURL: "https://open.bigmodel.cn/api/paas/v4",
      defaultModel: "GLM-4.5-Flash", // 使用默认模型
      timeout: 30000,
      maxRetries: 3,
    });

    // 1. Register Agents
    // Main Agent
    simpleOpenAI.registerAgent({
      id: "main_agent",
      name: "SMALLCOUNT助手",
      systemPrompt:
        "你是SMALLCOUNT助手（总入口/任务分发中枢），根据用户需求进行分析，分派任务给不同的智能体。",
      toolIds: ["dispatchToDataAgent", "dispatchToAnalysisAgent"],
    });

    // Data Agent
    simpleOpenAI.registerAgent({
      id: "data_agent",
      name: "数据操作助手",
      systemPrompt: "你是数据操作助手，负责数据的增删改查。",
      toolIds: ["addTransaction", "queryTransactions"],
    });

    // Analysis Agent
    simpleOpenAI.registerAgent({
      id: "analysis_agent",
      name: "收支分析师",
      systemPrompt: "你是收支分析师，负责分析收支数据。",
      toolIds: ["queryTransactions"],
    });

    // Summary Agent
    simpleOpenAI.registerAgent({
      id: "summary_agent",
      name: "总结归纳助手",
      systemPrompt: "你是总结归纳助手，负责聚合分析结果，生成用户所需输出。",
      toolIds: [],
    });

    // 2. Register Tools
    // Dispatch Tools (Bridge to other agents)
    simpleOpenAI.registerTool({
      id: "dispatchToDataAgent",
      name: "dispatchToDataAgent",
      description: "Dispatch task to Data Agent",
      parameters: {
        instruction: {
          type: "string",
          description: "User instruction",
        },
      },
      handler: async ({ instruction }) => {
        // Create a session for Data Agent
        const sessionId = simpleOpenAI.createSession("data_agent");

        let result = "";
        await simpleOpenAI.chatNonStream(
          {
            agentId: "data_agent",
            message: instruction,
            tools: ["addTransaction", "queryTransactions"],
          },
          {
            onResponse: (res) => {
              result = res;
            },
            onError: (err) => console.error("DataAgent Error:", err),
          }
        );

        // Pass to Summary Agent
        let summary = "";
        await simpleOpenAI.chatNonStream(
          {
            agentId: "summary_agent",
            message: `请总结此操作结果：${result}`,
          },
          {
            onResponse: (res) => {
              summary = res;
            },
            onError: (err) => console.error("SummaryAgent Error:", err),
          }
        );

        return summary;
      },
    });

    simpleOpenAI.registerTool({
      id: "dispatchToAnalysisAgent",
      name: "dispatchToAnalysisAgent",
      description: "Dispatch task to Analysis Agent",
      parameters: {
        instruction: {
          type: "string",
          description: "User instruction",
        },
      },
      handler: async ({ instruction }) => {
        const sessionId = simpleOpenAI.createSession("analysis_agent");

        let result = "";
        await simpleOpenAI.chatNonStream(
          {
            agentId: "analysis_agent",
            message: instruction,
            tools: ["queryTransactions"],
          },
          {
            onResponse: (res) => {
              result = res;
            },
            onError: (err) => console.error("AnalysisAgent Error:", err),
          }
        );

        // Pass to Summary Agent
        let summary = "";
        await simpleOpenAI.chatNonStream(
          {
            agentId: "summary_agent",
            message: `请总结此分析结果：${result}`,
          },
          {
            onResponse: (res) => {
              summary = res;
            },
            onError: (err) => console.error("SummaryAgent Error:", err),
          }
        );

        return summary;
      },
    });

    // Actual Functional Tools
    simpleOpenAI.registerTool({
      id: "addTransaction",
      name: "addTransaction",
      description: "Add a transaction",
      parameters: {
        type: {
          type: "string",
          description: "income or expense",
        },
        amount: {
          type: "number",
          description: "amount",
        },
        category: {
          type: "string",
          description: "category",
        },
        description: {
          type: "string",
          description: "description",
        },
      },
      handler: addTransaction,
    });

    simpleOpenAI.registerTool({
      id: "queryTransactions",
      name: "queryTransactions",
      description: "Query transactions",
      parameters: {},
      handler: queryTransactions,
    });

    setAi(simpleOpenAI);

    // Initial greeting - 转换为 GiftedChat 格式
    setMessages([
      {
        _id: generateUUID(),
        text: "你好！我是SMALLCOUNT助手。我可以帮你记账或分析收支。",
        createdAt: new Date(),
        user: {
          _id: 2,
          name: "SMALLCOUNT助手",
        },
      },
    ]);
  }, []);

  // 工具调用JSON解析函数
  const parseToolCall = (jsonString: string): { name?: string; args?: Record<string, any>; isToolCall: boolean } => {
    try {
      // 尝试解析整个JSON字符串
      const data = JSON.parse(jsonString);
      
      // 支持OpenAI格式: {"tool_call":{"function":{"name":"...","arguments":"..."}}}
      if (data.tool_call && data.tool_call.function) {
        let args: Record<string, any> = {};
        
        // 处理各种参数类型情况
        if (data.tool_call.function.arguments) {
          if (typeof data.tool_call.function.arguments === 'string') {
            try {
              // 尝试解析字符串形式的参数
              args = JSON.parse(data.tool_call.function.arguments);
            } catch (e) {
              // 如果解析失败，将字符串作为单个参数
              args = { value: data.tool_call.function.arguments };
            }
          } else if (typeof data.tool_call.function.arguments === 'object') {
            // 直接使用对象形式的参数
            args = data.tool_call.function.arguments;
          } else {
            // 其他类型，转换为字符串
            args = { value: String(data.tool_call.function.arguments) };
          }
        }
        
        return {
          name: data.tool_call.function.name,
          args,
          isToolCall: true
        };
      }
      // 支持tool-manager.ts格式: {"tool":"tool_name","args":{...}}
      else if (data.tool && typeof data.tool === 'string') {
        return {
          name: data.tool,
          args: data.args || {},
          isToolCall: true
        };
      }
    } catch (e) {
      // 不是有效的JSON或工具调用格式
      console.error('解析工具调用JSON失败:', e);
    }
    return { isToolCall: false };
  };

  // 工具调用格式化为用户友好的消息
  const formatToolCall = (toolCall: { name?: string; args?: Record<string, any> }): string => {
    if (!toolCall.name) return '';
    
    let formatted = `正在调用${toolCall.name}工具`;
    
    // 根据工具名称定制显示
    switch (toolCall.name) {
      case 'dispatchToDataAgent':
        formatted = '正在分析您的请求并调用数据代理...';
        break;
      case 'dispatchToAnalysisAgent':
        formatted = '正在进行深度分析，请稍候...';
        break;
      default:
        if (toolCall.args) {
          formatted += `，参数：${JSON.stringify(toolCall.args)}`;
        }
    }
    
    return formatted;
  };

  // 发送消息并获取AI回复
  const onSend = useCallback((messages: IMessage[] = []) => {
    // 确保用户消息有唯一ID
    const userMessagesWithId = messages.map(msg => ({
      ...msg,
      _id: msg._id || generateUUID()
    }));
    
    setMessages(previousMessages =>
      GiftedChat.append(previousMessages, userMessagesWithId)
    );

    // 获取用户发送的消息
    const userMessage = userMessagesWithId[0];
    if (!userMessage || !userMessage.text) return;
    
    setIsLoading(true);
    
    // 取消之前的请求
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }
    
    // 为AI回复生成一个唯一的消息ID
    const aiMessageId = generateUUID();
    
    try {
      // 使用流式对话
      const unsubscribe = ai?.chatStream({
        agentId: "main_agent",
        message: userMessage.text,
        tools: ["dispatchToDataAgent", "dispatchToAnalysisAgent"],
      }, {
        onStart: () => {
          // 添加AI的空消息，确保只添加一次
          setMessages(previousMessages => {
            // 检查是否已经存在相同ID的消息
            const existingMessageIndex = previousMessages.findIndex(msg => msg._id === aiMessageId);
            if (existingMessageIndex === -1) {
              return GiftedChat.append(previousMessages, [
                {
                  _id: aiMessageId,
                  text: '',
                  createdAt: new Date(),
                  user: {
                    _id: 2,
                    name: "SMALLCOUNT助手",
                  },
                },
              ]);
            }
            return previousMessages;
          });
        },
        onDelta: (delta) => {
          // 更新特定ID的消息
          setMessages(previousMessages => {
            const updatedMessages = [...previousMessages];
            const aiMessageIndex = updatedMessages.findIndex(msg => msg._id === aiMessageId);
            if (aiMessageIndex !== -1) {
              let currentText = updatedMessages[aiMessageIndex].text + delta;
              
              // 使用更健壮的正则表达式匹配两种工具调用格式：OpenAI格式和tool-manager.ts格式
              const toolCallRegex = /\{"(tool_call|tool)":\{?[\s\S]*?\}\}/g;
              let match;
              let tempText = currentText;
              let result = '';
              let lastIndex = 0;
              
              while ((match = toolCallRegex.exec(tempText)) !== null) {
                // 添加匹配前的文本
                result += tempText.slice(lastIndex, match.index);
                
                // 解析工具调用
                const toolCall = parseToolCall(match[0]);
                if (toolCall.isToolCall) {
                  // 替换为友好提示
                  result += formatToolCall(toolCall);
                } else {
                  // 如果不是有效的工具调用，保留原始内容
                  result += match[0];
                }
                
                lastIndex = match.index + match[0].length;
              }
              
              // 添加剩余文本
              result += tempText.slice(lastIndex);
              
              updatedMessages[aiMessageIndex] = {
                ...updatedMessages[aiMessageIndex],
                text: result,
              };
            }
            return updatedMessages;
          });
        },
        onCompletion: (fullText) => {
          setIsLoading(false);
          setCurrentRequest(null); // 请求完成，清除当前请求
          
          // 检查最终消息是否包含工具调用JSON
          setMessages(previousMessages => {
            const updatedMessages = [...previousMessages];
            const aiMessageIndex = updatedMessages.findIndex(msg => msg._id === aiMessageId);
            if (aiMessageIndex !== -1) {
              let finalText = updatedMessages[aiMessageIndex].text;
              
              // 使用与onDelta相同的正则表达式和处理逻辑，匹配两种工具调用格式
              const toolCallRegex = /\{"(tool_call|tool)":\{?[\s\S]*?\}\}/g;
              let match;
              let tempText = finalText;
              let result = '';
              let lastIndex = 0;
              
              while ((match = toolCallRegex.exec(tempText)) !== null) {
                // 添加匹配前的文本
                result += tempText.slice(lastIndex, match.index);
                
                // 解析工具调用
                const toolCall = parseToolCall(match[0]);
                if (toolCall.isToolCall) {
                  // 替换为友好提示
                  result += formatToolCall(toolCall);
                } else {
                  // 如果不是有效的工具调用，保留原始内容
                  result += match[0];
                }
                
                lastIndex = match.index + match[0].length;
              }
              
              // 添加剩余文本
              result += tempText.slice(lastIndex);
              
              // 确保最终文本不为空
              if (!result.trim()) {
                result = "操作已完成";
              }
              
              updatedMessages[aiMessageIndex] = {
                ...updatedMessages[aiMessageIndex],
                text: result,
              };
            }
            return updatedMessages;
          });
        },
        onError: (error) => {
          setIsLoading(false);
          console.error('AI对话错误:', error);
          
          // 更新特定ID的消息为错误提示
          setMessages(previousMessages => {
            const updatedMessages = [...previousMessages];
            const aiMessageIndex = updatedMessages.findIndex(msg => msg._id === aiMessageId);
            if (aiMessageIndex !== -1) {
              updatedMessages[aiMessageIndex] = {
                ...updatedMessages[aiMessageIndex],
                text: '抱歉，处理您的请求时出现了错误。请检查API密钥配置或稍后再试。',
              };
            }
            return updatedMessages;
          });
        }
      });
      
      // 只有当 unsubscribe 存在时才赋值
      if (unsubscribe) {
        unsubscribeRef.current = unsubscribe;
      }
    } catch (error) {
      setIsLoading(false);
      console.error('发送消息失败:', error);
    }
  }, [ai]);

  // 组件卸载时取消请求
  useEffect(() => {
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, []);

  // 取消当前请求
  const handleCancel = () => {
    if (currentRequest) {
      currentRequest.cancel();
      setCurrentRequest(null);
      setIsLoading(false);
      setMessages((prev) =>
        GiftedChat.append(prev, [
          {
            _id: generateUUID(),
            text: "请求已取消",
            createdAt: new Date(),
            user: {
              _id: 2,
              name: "SMALLCOUNT助手",
            },
          },
        ])
      );
    }
  };

  // Custom Header
  const renderHeader = () => (
    <View
      className="flex-row items-center justify-between px-4 py-2 border-b border-border bg-card"
      style={{
        borderBottomColor: theme.colors.border,
        backgroundColor: theme.colors.card,
        paddingTop: insets.top > 0 ? insets.top : 10, // Handle notch if not in SafeAreaView or if we want custom padding
      }}
    >
      <Text
        className="text-xl font-bold"
        style={{ color: theme.colors.text }}
      >
        SmallCount AI Demo
      </Text>
      <Text className="text-sm" style={{ color: theme.colors.primary }}>
        基于 AI 协作者模式架构
      </Text>
    </View>
  );

  // Custom Bubble
  const renderBubble = useCallback(
    (props: any) => {
      return (
        <Bubble
          {...props}
          wrapperStyle={{
            left: {
              backgroundColor: theme.colors.card,
              borderWidth: 0, // No border in design
              padding: 4,
              borderRadius: 12,
              borderTopLeftRadius: 4,
              marginBottom: 4,
            },
            right: {
              backgroundColor: theme.colors.primary,
              borderRadius: 12,
              borderTopRightRadius: 4,
              padding: 4,
              marginBottom: 4,
            },
          }}
          textStyle={{
            left: {
              color: theme.colors.text,
              fontSize: 15,
              lineHeight: 22,
            },
            right: {
              color: "#FFFFFF",
              fontSize: 15,
              lineHeight: 22,
            },
          }}
        />
      );
    },
    [theme.colors.card, theme.colors.primary, theme.colors.text]
  );

  const [text, setText] = useState("");
  const handleTextChange = useCallback((text: string, composerProps: any) => {
    setText(text);
  }, []);

  const handleSubmit = useCallback((composerProps: any) => {
    if (composerProps.text && composerProps.text.trim()) {
      composerProps.onSend({ text: composerProps.text.trim() }, true);
    }
  }, []);

  // Custom Composer to ensure stable reference and avoid re-render focus loss
  const renderComposer = useCallback(
    (composerProps: ComposerProps) => (
      <View className="flex-row items-center flex-1 gap-3">
        <TouchableOpacity disabled={isLoading}>
          <Ionicons name="add" size={24} color={isLoading ? "#9CA3AF" : theme.colors.textSecondary} />
        </TouchableOpacity>
        <View
          className="flex-1 rounded-full px-4 py-2"
          style={{
            backgroundColor: isDarkMode ? "#2c2c2e" : "#f3f4f6", // Light gray for input bg
            height: 40,
            justifyContent: "center",
            opacity: isLoading ? 0.6 : 1,
          }}
        >
          {isLoading ? (
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center" }}>
              <Text style={{ color: theme.colors.textSecondary, marginRight: 8 }}>
                AI正在思考...
              </Text>
              <Ionicons name="ellipsis-horizontal" size={16} color={theme.colors.textSecondary} />
            </View>
          ) : (
            <TextInput
              style={{
                color: theme.colors.text,
                fontSize: 15,
                padding: 0, // Remove default padding
                height: "100%",
              }}
              placeholder="输入：今天午饭花了30元 / 分析一下支出"
              placeholderTextColor={theme.colors.textSecondary}
              onChangeText={(text) => composerProps?.textInputProps?.onChangeText?.(text)}
              defaultValue={composerProps.text}
              returnKeyType="send"
              editable={!isLoading}
            />
          )}
        </View>
      </View>
    ),
    [
      theme.colors.text,
      theme.colors.textSecondary,
      "#9CA3AF", // 代替 theme.colors.textDisabled
      theme.colors.card,
      isDarkMode,
      isLoading,
      handleTextChange,
      handleSubmit,
    ]
  );

  // Custom Send Button
  const renderSend = useCallback(
    (sendProps: any) => (
      <TouchableOpacity
        onPress={() => {
          if (sendProps.text && sendProps.text.trim() && !isLoading) {
            sendProps.onSend({ text: sendProps.text.trim() }, true);
          }
        }}
        disabled={isLoading || !sendProps.text || !sendProps.text.trim()}
        className="ml-3 w-10 h-10 rounded-full items-center justify-center"
        style={{ 
          backgroundColor: (isLoading || !sendProps.text || !sendProps.text.trim()) 
            ? "#D1D5DB" // 代替 theme.colors.disabled
            : theme.colors.primary 
        }}
      >
        {isLoading ? (
          <TouchableOpacity
            onPress={handleCancel}
            className="w-10 h-10 rounded-full items-center justify-center"
            style={{ backgroundColor: "#ef4444" }}
          >
            <Ionicons
              name="stop"
              size={20}
              color="#FFFFFF"
            />
          </TouchableOpacity>
        ) : (
          <Ionicons
            name="paper-plane-outline"
            size={20}
            color="#FFFFFF"
            style={{ marginLeft: -2, marginTop: 2 }}
          />
        )}
      </TouchableOpacity>
    ),
    [theme.colors.primary, "#D1D5DB", isLoading, handleCancel] // 代替 theme.colors.disabled
  );

  // Custom Input Toolbar
  const renderInputToolbar = useCallback(
    (props: any) => {
      return (
        <InputToolbar
          {...props}
          containerStyle={{
            backgroundColor: theme.colors.card,
            borderTopWidth: 0,
            padding: 8,
            paddingBottom: insets.bottom + 8, // Add bottom padding for home indicator
          }}
          primaryStyle={{ alignItems: "center" }}
          renderComposer={renderComposer}
          renderSend={renderSend}
        />
      );
    },
    [theme.colors.card, insets.bottom, renderComposer, renderSend]
  );

  // Custom Day (Date)
  const renderDay = useCallback(
    (props: DayProps) => {
      const { createdAt } = props;
      
      // Convert createdAt to Date object if it's a number
      const date = typeof createdAt === 'number' ? new Date(createdAt) : createdAt;
      
      // Format the date and time
      const today = new Date();
      const isToday = date.toDateString() === today.toDateString();
      
      let dateText = '';
      if (isToday) {
        dateText = `今天 ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
      } else {
        dateText = `${date.getMonth() + 1}月${date.getDate()}日 ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
      }
      
      return (
        <View style={{ alignItems: "center", marginVertical: 10 }}>
          <Text
            style={{
              fontSize: 12,
              color: theme.colors.textSecondary,
              backgroundColor: theme.colors.background,
              paddingHorizontal: 10,
              paddingVertical: 3,
              borderRadius: 10,
              overflow: "hidden",
            }}
          >
            {dateText}
          </Text>
        </View>
      );
    },
    [theme.colors.textSecondary, theme.colors.background]
  );

  // AI控制面板
  const renderAIControls = () => (
    <View className="p-4 bg-gray-100 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
      <View className="flex-row justify-between mb-2">
        <Text className="text-xs text-gray-500">AI控制:</Text>
        <View className="flex-row">
          <TouchableOpacity
            onPress={() => {
              if (ai) {
                ai.stop();
                setIsLoading(false);
                setCurrentRequest(null);
                setMessages((prev) =>
                  GiftedChat.append(prev, [
                    {
                      _id: generateUUID(),
                      text: "所有AI功能已停止，无法恢复",
                      createdAt: new Date(),
                      user: {
                        _id: 2,
                        name: "System",
                      },
                    },
                  ])
                );
              }
            }}
            className="bg-red-600 px-3 py-1 rounded mr-2"
          >
            <Text className="text-white text-xs">完全停止</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              if (ai && !ai.isStoppedState()) {
                if (ai.isPausedState()) {
                  ai.resume();
                  setMessages((prev) =>
                    GiftedChat.append(prev, [
                      {
                        _id: generateUUID(),
                        text: "AI功能已恢复",
                        createdAt: new Date(),
                        user: {
                          _id: 2,
                          name: "System",
                        },
                      },
                    ])
                  );
                } else {
                  ai.pause();
                  setMessages((prev) =>
                    GiftedChat.append(prev, [
                      {
                        _id: generateUUID(),
                        text: "AI功能已暂停",
                        createdAt: new Date(),
                        user: {
                          _id: 2,
                          name: "System",
                        },
                      },
                    ])
                  );
                }
              }
            }}
            className={`${ai && ai.isPausedState() ? "bg-green-600" : "bg-yellow-600"} px-3 py-1 rounded`}
            disabled={ai?.isStoppedState()}
          >
            <Text className="text-white text-xs">
              {ai && ai.isPausedState() ? "恢复" : "暂停"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
      
      {/* 模拟AI模型调用方法按钮 */}
      <View className="mb-2">
        <Text className="text-xs text-gray-500 mb-1">模拟AI调用:</Text>
        <View className="flex-row flex-wrap gap-1">
          <TouchableOpacity
            onPress={() => {
              // 模拟添加支出
              const testMessage = {
                _id: generateUUID(),
                text: "今天午饭花了30元",
                createdAt: new Date(),
                user: { _id: 1 }
              };
              onSend([testMessage]);
            }}
            className="bg-blue-500 px-2 py-1 rounded"
          >
            <Text className="text-white text-xs">添加支出</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            onPress={() => {
              // 模拟添加收入
              const testMessage = {
                _id: generateUUID(),
                text: "今天工资收入5000元",
                createdAt: new Date(),
                user: { _id: 1 }
              };
              onSend([testMessage]);
            }}
            className="bg-green-500 px-2 py-1 rounded"
          >
            <Text className="text-white text-xs">添加收入</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            onPress={() => {
              // 模拟查询支出
              const testMessage = {
                _id: generateUUID(),
                text: "查询上个月的支出情况",
                createdAt: new Date(),
                user: { _id: 1 }
              };
              onSend([testMessage]);
            }}
            className="bg-purple-500 px-2 py-1 rounded"
          >
            <Text className="text-white text-xs">查询支出</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            onPress={() => {
              // 模拟分析请求
              const testMessage = {
                _id: generateUUID(),
                text: "分析一下我的消费习惯",
                createdAt: new Date(),
                user: { _id: 1 }
              };
              onSend([testMessage]);
            }}
            className="bg-indigo-500 px-2 py-1 rounded"
          >
            <Text className="text-white text-xs">分析消费</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            onPress={() => {
              // 模拟复杂查询
              const testMessage = {
                _id: generateUUID(),
                text: "帮我统计一下最近三个月的收支情况，并给出理财建议",
                createdAt: new Date(),
                user: { _id: 1 }
              };
              onSend([testMessage]);
            }}
            className="bg-pink-500 px-2 py-1 rounded"
          >
            <Text className="text-white text-xs">综合分析</Text>
          </TouchableOpacity>
        </View>
      </View>
      
      {/* 测试工具按钮 */}
      <View className="mb-2">
        <Text className="text-xs text-gray-500 mb-1">测试工具:</Text>
        <View className="flex-row flex-wrap gap-1">
          <TouchableOpacity
            onPress={() => {
              // 清空交易数据
              transactions.length = 0;
              setMessages((prev) =>
                GiftedChat.append(prev, [
                  {
                    _id: generateUUID(),
                    text: "已清空所有交易数据",
                    createdAt: new Date(),
                    user: {
                      _id: 2,
                      name: "System",
                    },
                  },
                ])
              );
            }}
            className="bg-orange-500 px-2 py-1 rounded"
          >
            <Text className="text-white text-xs">清空数据</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            onPress={() => {
              // 添加测试数据
              const testData = [
                { type: "expense", amount: 30, category: "餐饮", description: "午餐" },
                { type: "expense", amount: 50, category: "交通", description: "打车" },
                { type: "income", amount: 5000, category: "工资", description: "月薪" },
                { type: "expense", amount: 200, category: "购物", description: "衣服" },
                { type: "expense", amount: 100, category: "娱乐", description: "电影票" },
              ];
              
              testData.forEach(item => {
                addTransaction(item);
              });
              
              setMessages((prev) =>
                GiftedChat.append(prev, [
                  {
                    _id: generateUUID(),
                    text: `已添加${testData.length}条测试数据`,
                    createdAt: new Date(),
                    user: {
                      _id: 2,
                      name: "System",
                    },
                  },
                ])
              );
            }}
            className="bg-teal-500 px-2 py-1 rounded"
          >
            <Text className="text-white text-xs">添加测试数据</Text>
          </TouchableOpacity>
        </View>
      </View>
      
      <Text className="text-xs text-gray-500 mb-2">
        Debug Info (In-Memory DB):
      </Text>
      <Text className="text-xs font-mono text-gray-600 dark:text-gray-400">
        {JSON.stringify(transactions.slice(-3), null, 2)}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <RNStatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />

      {renderHeader()}

      <GiftedChat
        messages={messages}
        onSend={(messages) => onSend(messages)}
        user={{
          _id: 1,
        }}
        renderBubble={renderBubble}
        renderInputToolbar={renderInputToolbar}
        renderDay={renderDay}
        renderAvatar={null} // No avatars in design
        minInputToolbarHeight={60}
        keyboardAvoidingViewProps={{ keyboardVerticalOffset }}
      />

      {renderAIControls()}
    </SafeAreaView>
  );
}