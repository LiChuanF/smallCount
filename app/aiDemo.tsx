import { ExpoAgentCore } from "@/ai/lib2";
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
  View,
} from "react-native";
import {
  Bubble,
  ComposerProps,
  GiftedChat,
  IMessage,
  InputToolbar,
} from "react-native-gifted-chat";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

// --- 1. Mock Data & Types ---
interface Transaction {
  id: string;
  type: "income" | "expense";
  amount: number;
  category: string;
  date: string;
  description: string;
}

// 模拟数据库
let transactions: Transaction[] = [
  {
    id: "1",
    type: "expense",
    amount: 30,
    category: "餐饮",
    date: "2025-12-05",
    description: "午餐",
  },
];

// --- 2. Tool Handlers ---
const addTransactionHandler = async (params: any) => {
  const { type, amount, category, description } = params;
  const newTx: Transaction = {
    id: Math.random().toString(36).substr(2, 9),
    type,
    amount: Number(amount),
    category,
    date: new Date().toISOString().split("T")[0],
    description: description || "",
  };
  transactions.push(newTx);
  return {
    success: true,
    message: `已成功记录一笔${type === "income" ? "收入" : "支出"}：${amount}元，分类：${category}`,
    data: newTx,
  };
};

const queryTransactionsHandler = async (params: any) => {
  // 简单模拟查询，实际场景可以根据 params 过滤
  return {
    success: true,
    count: transactions.length,
    transactions: transactions,
  };
};

// --- 3. Main Component ---
export default function AIDemo() {
  const { theme, isDarkMode } = useTheme();
  const insets = useSafeAreaInsets();

  // State
  const [messages, setMessages] = useState<IMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [core, setCore] = useState<ExpoAgentCore | null>(null);
  const [sessionId, setSessionId] = useState<string>("");

  const [isTyping, setIsTyping] = useState(false);
  const responseBufferRef = useRef<string>("");
  const typingTimerRef = useRef<number | null>(null);

  // Refs for cleanup
  const cancelRef = useRef<(() => void) | null>(null);

  // Layout constants
  const tabbarHeight = 0;
  const keyboardTopToolbarHeight = Platform.select({ ios: 44, default: 0 });
  const keyboardVerticalOffset =
    insets.bottom + tabbarHeight + keyboardTopToolbarHeight;

  // --- Initialization ---
  useEffect(() => {
    // 初始化 Core
    const agentCore = new ExpoAgentCore({
      apiKey: "sk-mewdvwtamzdkpsaiyzcqbbyelzscbyjeizfwzemitoovpnbr", // API密钥留空，用户需要自己填写
      baseURL: "https://api.siliconflow.cn/v1",
      defaultModel: "deepseek-ai/DeepSeek-R1-0528-Qwen3-8B", // 使用默认模型
      timeout: 30000,
    });

    // ---------------------------------------------------------
    // A. 注册工具 (Register Tools)
    // ---------------------------------------------------------
    agentCore.registerTool({
      id: "addTransaction",
      name: "addTransaction",
      description: "添加一笔新的收支记录",
      parameters: {
        type: "object",
        properties: {
          type: {
            type: "string",
            description: "'income' (收入) 或 'expense' (支出)",
            enum: ["income", "expense"],
          },
          amount: { type: "number", description: "金额" },
          category: {
            type: "string",
            description: "分类，如：餐饮、交通、工资",
          },
          description: { type: "string", description: "备注描述" },
        },
        required: ["type", "amount", "category"],
      },
      handler: addTransactionHandler,
    });

    agentCore.registerTool({
      id: "queryTransactions",
      name: "queryTransactions",
      description: "查询所有的收支记录数据",
      parameters: {
        type: "object",
        properties: {
          limit: { type: "number", description: "返回数量限制" },
        },
        required: [],
      },
      handler: queryTransactionsHandler,
    });

    // ---------------------------------------------------------
    // B. 注册智能体 (Register Agents based on ai.md)
    // ---------------------------------------------------------

    // 1. SMALLCOUNT助手 (总入口)
    agentCore.registerAgent({
      id: "main_agent",
      name: "SMALLCOUNT助手",
      description: "主接待员，负责意图识别和分发。",
      // System Prompt 核心逻辑：路由分发
      systemPrompt: `你是一个智能记账助手的主脑。
      你的职责是分析用户的意图，并将任务分发给专业的助手，或者直接回答简单的问候。
      
      路由规则：
      1. 如果用户想要记账、修改数据、删除数据 -> 转接给 [DataOperator]。
      2. 如果用户想要查询数据、分析收支、统计报表 -> 转接给 [Analyst]。
      3. 如果只是打招呼或闲聊 -> 你可以直接回复。
      
      请勿直接调用数据工具，必须转接。`,
      handoffs: ["data_agent", "analysis_agent"],
      tools: [],
    });

    // 2. 数据操作助手
    agentCore.registerAgent({
      id: "data_agent",
      name: "DataOperator",
      description: "负责数据的增删改查操作。",
      systemPrompt: `你是数据操作专员。你的职责是准确地记录或修改用户的数据。
      
      工作流程：
      1. 使用工具完成用户的指令（如 addTransaction）。
      2. 操作成功后，你必须将结果转接给 [Summarizer] 进行汇报。
      3. 不要直接给用户最终回复，必须转接。`,
      tools: ["addTransaction", "queryTransactions"],
      handoffs: ["summary_agent"], // 强制流转到总结助手
    });

    // 3. 收支分析师
    agentCore.registerAgent({
      id: "analysis_agent",
      name: "Analyst",
      description: "负责数据分析和统计。",
      systemPrompt: `你是专业的收支分析师。你的职责是读取数据并挖掘 insights。
      
      工作流程：
      1. 使用工具查询必要的数据 (queryTransactions)。
      2. 根据数据进行计算和分析。
      3. 将分析结果转接给 [Summarizer] 进行汇报。
      4. 不要直接给用户最终回复，必须转接。`,
      tools: ["queryTransactions"],
      handoffs: ["summary_agent"], // 强制流转到总结助手
    });

    // 4. 总结归纳助手 (出口)
    agentCore.registerAgent({
      id: "summary_agent",
      name: "Summarizer",
      description: "负责汇总信息并输出给用户。",
      systemPrompt: `你是总结归纳助手。
      你的上游同事（数据专员或分析师）已经完成了工作，并会把执行结果或分析数据传递给你。
      
      你的职责：
      1. 将上游的技术性结果转化为用户友好的、温暖的自然语言。
      2. 如果是分析结果，请使用清晰的格式（如列表）。
      3. 你是直接面对用户的最终接口。`,
      tools: [],
      handoffs: [], // 末端节点
    });

    setCore(agentCore);

    // 创建会话
    const newSessionId = agentCore.createSession("main_agent");
    setSessionId(newSessionId);

    // Initial greeting
    setMessages([
      {
        _id: generateUUID(),
        text: "你好！我是SMALLCOUNT助手。我可以帮你记账或分析收支。请告诉我你的需求。",
        createdAt: new Date(),
        user: { _id: 2, name: "SMALLCOUNT助手" },
      },
      {
        _id: generateUUID(),
        text: "🔮 欢迎使用全新的 SMALLCOUNT AI 系统！\n\n这是一个基于多智能体协作的智能记账助手，采用先进的 ExpoAgentCore 架构。系统包含多个专业智能体协同工作，为您提供更智能、更专业的记账服务。",
        createdAt: new Date(),
        user: { _id: 3, name: "系统通知" },
        system: true,
      },
    ]);

    return () => {
      if (cancelRef.current) cancelRef.current();
    };
  }, []);

// ... 前面的 import 和 state 保持不变

 // --- 辅助函数：清洗文本 ---
  const cleanText = (text: string) => {
    return text
      .replace(/<think>[\s\S]*?<\/think>/gi, "") // 移除深度思考过程
      .replace(/<think>[\s\S]*/gi, "") // 移除未闭合标签
      .replace(/```json[\s\S]*?```/gi, "") // 移除 JSON 代码块
      .replace(/```[\s\S]*?```/gi, "") // 移除普通代码块（如果也是工具调用的话）
      .trim();
  };

   const startTypewriterEffect = (fullText: string) => {
    const aiMessageId = generateUUID();
    const createdAt = new Date();
    
    // 1. 先添加一个空的 AI 消息气泡
    setMessages((prev) => GiftedChat.append(prev, [{
      _id: aiMessageId,
      text: " ", // 给一个空格占位，防止气泡塌陷
      createdAt: createdAt,
      user: { _id: 2, name: "SMALLCOUNT助手" },
    }]));

    let currentIndex = 0;
    const length = fullText.length;
    // 调整打字速度：数字越小越快。30ms 比较接近真实流式感
    const speed = 30; 
    // 每次增加的字符数：增加到 2 或 3 可以让长文本显示得更流畅
    const chunkSize = 2; 

    const typeChar = () => {
      if (currentIndex < length) {
        // 计算下一帧要显示的完整文本
        currentIndex += chunkSize;
        const currentText = fullText.slice(0, currentIndex);

        setMessages((prev) => {
          const next = [...prev];
          // 找到我们刚才创建的那条消息
          const targetIndex = next.findIndex(m => m._id === aiMessageId);
          if (targetIndex !== -1) {
            next[targetIndex] = {
              ...next[targetIndex],
              text: currentText, // 更新文本
            };
          }
          return next;
        });
        
        // 继续下一帧
        typingTimerRef.current = setTimeout(typeChar, speed);
      } else {
        // 打字结束
        typingTimerRef.current = null;
      }
    };

    // 启动打字
    typeChar();
  };
   // --- Chat Handler ---
  const onSend = useCallback(
    (newMessages: IMessage[] = []) => {
      if (!core || !sessionId) return;
      const userMsg = newMessages[0];
      if (!userMsg?.text) return;

      // 重置默认代理为SMALLCOUNT助手
      core.setCurrentAgent(sessionId, "main_agent");

      // 1. UI: 显示用户消息
      setMessages((prev) => GiftedChat.append(prev, newMessages));
      // 2. UI: 显示 "对方正在输入" 小点点
      setIsTyping(true);
      // 3. 重置缓冲区
      responseBufferRef.current = "";
      
      // 如果上一次的打字动画还没播完，强制停止，直接显示完整结果（可选优化）
      if (typingTimerRef.current) {
        clearTimeout(typingTimerRef.current);
        typingTimerRef.current = null;
      }

      const cancel = core.chat(sessionId, userMsg.text, {
        onStart: () => {}, // 保持静默

        onTextDelta: (text, agentId) => {
          // 只在后台积累，完全不更新 UI
          responseBufferRef.current += text;
        },

        onToolCall: (name, args) => {
          responseBufferRef.current = ""; // 丢弃废话
          addSystemStatusMessage(`🛠️ 正在执行：${name}...`);
        },

        onAgentChange: (from, to) => {
          responseBufferRef.current = ""; // 丢弃废话
          const agentNameMap: Record<string, string> = {
            main_agent: "总助手",
            data_agent: "数据专员",
            analysis_agent: "分析师",
            summary_agent: "总结助手",
          };
          const name = agentNameMap[to] || to;
          addSystemStatusMessage(`🔄 正在转接给：${name}...`);
        },

        onToolResult: () => {},

        onComplete: () => {
          // 网络请求完全结束
          setIsTyping(false);
          cancelRef.current = null;

          // 清洗文本
          const finalContent = cleanText(responseBufferRef.current);

          if (finalContent) {
            // 关键：调用打字机效果函数
            startTypewriterEffect(finalContent);
          } else {
            // 兜底：如果没有内容
            startTypewriterEffect("✅ 操作已完成");
          }
        },

        onError: (err) => {
          setIsTyping(false);
          addSystemStatusMessage(`❌ 出错: ${err.message}`);
        },
      });

      cancelRef.current = cancel;
    },
    [core, sessionId]
  );

  // 组件卸载时清理定时器
  useEffect(() => {
    return () => {
        if (typingTimerRef.current) {
            clearTimeout(typingTimerRef.current);
        }
        if (cancelRef.current) {
            cancelRef.current();
        }
    };
  }, []);

  // 辅助函数：添加系统消息 (保持不变)
  const addSystemStatusMessage = (text: string) => {
    const systemMessage: IMessage = {
      _id: generateUUID(),
      text: text,
      createdAt: new Date(),
      user: { _id: 0, name: "系统" },
      system: true,
    };
    setMessages((prev) => GiftedChat.append(prev, [systemMessage]));
  };

 const handleStop = () => {
    if (cancelRef.current) {
      cancelRef.current();
      cancelRef.current = null;
      setIsTyping(false);
      addSystemStatusMessage("⏹️ 操作已停止");
    }
  };
  
  // ... 其余渲染代码保持不变
  // Helper to update a specific message - now updates only the AI message
  const updateAiMessage = (
    msgId: string,
    content: string
  ) => {
    setMessages((prev) => {
      const next = [...prev];
      const index = next.findIndex((m) => m._id === msgId);
      
      if (index !== -1) {
        // 只更新AI消息的内容
        next[index] = {
          ...next[index],
          text: content.trim(),
        };
      }
      return next;
    });
  };


  // --- 5. UI Components (Similar to original) ---

  const renderBubble = useCallback(
    (props: any) => {
      return (
        <Bubble
          {...props}
          wrapperStyle={{
            left: {
              backgroundColor: theme.colors.card,
              borderWidth: 0,
              padding: 4,
              borderRadius: 12,
            },
            right: {
              backgroundColor: theme.colors.primary,
              borderRadius: 12,
              padding: 4,
            },
          }}
          textStyle={{
            left: { color: theme.colors.text, fontSize: 15, lineHeight: 22 },
            right: { color: "#FFFFFF", fontSize: 15, lineHeight: 22 },
          }}
        />
      );
    },
    [theme]
  );

  // Input components ...
  const renderComposer = (props: ComposerProps) => (
    <View className="flex-row items-center flex-1 gap-3">
      <View
        className="flex-1 rounded-full px-4 py-2"
        style={{
          backgroundColor: isDarkMode ? "#2c2c2e" : "#f3f4f6",
          height: 40,
          justifyContent: "center",
        }}
      >
        <TextInput
          style={{
            color: theme.colors.text,
            fontSize: 15,
            padding: 0, // Remove default padding
            height: "100%",
          }}
          placeholder="输入：记一笔午餐30元 / 分析本月支出"
          placeholderTextColor={theme.colors.textSecondary}
          onChangeText={(text) => props?.textInputProps?.onChangeText?.(text)}
          value={props.text}
          returnKeyType="send"
          editable={!isLoading}
        />
      </View>
    </View>
  );

  const renderSend = (props: any) => (
    <TouchableOpacity
      onPress={() =>
        props.text?.trim() && props.onSend({ text: props.text.trim() }, true)
      }
      disabled={isLoading || !props.text?.trim()}
      className="ml-3 w-10 h-10 rounded-full items-center justify-center"
      style={{ backgroundColor: isLoading ? "#ef4444" : theme.colors.primary }}
    >
      {isLoading ? (
        <TouchableOpacity onPress={handleStop}>
          <Ionicons name="stop" size={20} color="#FFFFFF" />
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
  );

  const renderSystemMessage = (props: any) => {
    const { currentMessage } = props;
    
    if (!currentMessage?.system) return null;

    // 根据消息内容判断消息类型
    const isStatusMessage = currentMessage.text?.includes("正在调用") || 
                           currentMessage.text?.includes("转接任务") ||
                           currentMessage.text?.includes("系统");

    return (
      <View className="items-center my-2">
        <View 
          className={`px-4 py-2 rounded-full flex-row items-center ${isStatusMessage ? 'max-w-xs' : 'max-w-md'}`}
          style={{
            backgroundColor: isDarkMode ? "rgba(59, 130, 246, 0.2)" : "rgba(59, 130, 246, 0.1)",
            borderWidth: 1,
            borderColor: isDarkMode ? "rgba(59, 130, 246, 0.3)" : "rgba(59, 130, 246, 0.2)",
          }}
        >
          {isStatusMessage && (
            <Ionicons 
              name="information-circle-outline" 
              size={14} 
              color={theme.colors.primary}
              style={{ marginRight: 6 }}
            />
          )}
          <Text 
            className={`text-xs font-medium text-center ${isStatusMessage ? 'italic' : ''}`}
            style={{ color: theme.colors.primary }}
          >
            {currentMessage.text}
          </Text>
        </View>
      </View>
    );
  };



  const renderInputToolbar = (props: any) => (
    <InputToolbar
      {...props}
      containerStyle={{
        backgroundColor: theme.colors.card,
        borderTopWidth: 0,
        padding: 8,
        paddingBottom: insets.bottom + 8,
      }}
      renderComposer={renderComposer}
      renderSend={renderSend}
    />
  );

  const renderAIControls = () => (
    <View className="p-4 bg-gray-100 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
      <Text className="text-xs text-gray-500 mb-2">快速指令:</Text>
      <View className="flex-row flex-wrap gap-2">
        {[
          "今天吃饭吃了肯德基花了50元",
          "发工资 10000元",
          "查询最近的收支",
          "分析一下我的消费习惯",
        ].map((cmd, i) => (
          <TouchableOpacity
            key={i}
            onPress={() =>
              onSend([
                {
                  _id: generateUUID(),
                  text: cmd,
                  createdAt: new Date(),
                  user: { _id: 1 },
                },
              ])
            }
            className="bg-blue-100 dark:bg-blue-900 px-3 py-1 rounded-full"
          >
            <Text className="text-xs text-blue-700 dark:text-blue-300">
              {cmd}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <RNStatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />

      {/* Header */}
      <View
        className="flex-row items-center justify-between px-4 py-2 border-b bg-card"
        style={{ borderColor: theme.colors.border }}
      >
        <Text
          className="text-xl font-bold"
          style={{ color: theme.colors.text }}
        >
          SmallCount AI (架构重构版)
        </Text>
      </View>

      <GiftedChat
        messages={messages}
        onSend={onSend}
        user={{ _id: 1 }}
        renderBubble={renderBubble}
        renderInputToolbar={renderInputToolbar}
        renderSystemMessage={renderSystemMessage}
        minInputToolbarHeight={60}
        keyboardAvoidingViewProps={{ keyboardVerticalOffset }}
        isTyping={isTyping}
      />

      {renderAIControls()}
    </SafeAreaView>
  );
}