// storage/store/useSettingStore.ts

import { DEFAULT_BASE_URL, DEFAULT_MODEL, DEFAULT_SERVICE_PROVIDER } from '@/ai/lib/config';
import { settingsStorageManager } from '@/utils/storage';
import { createAppStore } from '../index';
import type { SettingState, SettingStore } from './types';

// 初始状态
const initialState: SettingState = {
  // AI配置相关
  apiUrl: DEFAULT_BASE_URL,
  apiKey: '',
  modelName: DEFAULT_MODEL,
  serviceProvider: DEFAULT_SERVICE_PROVIDER,
  
  // 状态相关
  isConfigured: false,
  isLoading: false,
  lastTestTime: null,
  testResult: null,
  
  // 其他设置
  autoSave: true,
  enableNotifications: true,
  theme: 'default',
};

// 初始化函数，从本地存储加载AI配置
const initializeAiConfig = async (): Promise<Partial<SettingState>> => {
  try {
    const savedConfig = await settingsStorageManager.get<SettingState>('aiConfig');
    if (savedConfig) {
      return {
        apiUrl: savedConfig.apiUrl || DEFAULT_BASE_URL,
        apiKey: savedConfig.apiKey || '',
        modelName: savedConfig.modelName || DEFAULT_MODEL,
        serviceProvider: savedConfig.serviceProvider || DEFAULT_SERVICE_PROVIDER,
        isConfigured: savedConfig.isConfigured || false,
      };
    }
    return {};
  } catch (error) {
    console.error('加载AI配置失败:', error);
    return {};
  }
};

// 创建设置存储
const useSettingStore = createAppStore<SettingStore>(
  (set, get) => ({
    // 初始状态，将从本地存储加载
    ...initialState,

    // AI配置操作
    updateApiUrl: async (url: string) => {
      set({ apiUrl: url });
      // 同步更新本地存储
      const currentState = get();
      const aiConfig = {
        ...currentState,
        apiUrl: url,
        isConfigured: !!(url && currentState.apiKey && currentState.modelName)
      };
      await settingsStorageManager.set('aiConfig', aiConfig);
    },

    updateApiKey: async (key: string) => {
      set({ apiKey: key });
      // 同步更新本地存储
      const currentState = get();
      const aiConfig = {
        ...currentState,
        apiKey: key,
        isConfigured: !!(currentState.apiUrl && key && currentState.modelName)
      };
      await settingsStorageManager.set('aiConfig', aiConfig);
    },

    updateModelName: async (model: string) => {
      set({ modelName: model });
      // 同步更新本地存储
      const currentState = get();
      const aiConfig = {
        ...currentState,
        modelName: model,
        isConfigured: !!(currentState.apiUrl && currentState.apiKey && model)
      };
      await settingsStorageManager.set('aiConfig', aiConfig);
    },

    updateServiceProvider: async (provider: string) => {
      set({ serviceProvider: provider });
      // 同步更新本地存储
      const currentState = get();
      const aiConfig = {
        ...currentState,
        serviceProvider: provider,
      };
      await settingsStorageManager.set('aiConfig', aiConfig);
    },

    // 初始化AI配置
    initializeConfig: async () => {
      try {
        const config = await initializeAiConfig();
        if (Object.keys(config).length > 0) {
          set(config);
        }
      } catch (error) {
        console.error('初始化AI配置失败:', error);
      }
    },

    // 保存AI配置
    saveAiConfig: async (config: {
      apiUrl: string;
      apiKey: string;
      modelName: string;
      serviceProvider?: string;
    }) => {
      try {
        set({ isLoading: true });
        
        // 准备要保存的配置对象
        const aiConfig = {
          apiUrl: config.apiUrl,
          apiKey: config.apiKey,
          modelName: config.modelName,
          serviceProvider: config.serviceProvider || DEFAULT_SERVICE_PROVIDER,
          isConfigured: !!(config.apiUrl && config.apiKey && config.modelName),
        };
        
        // 保存到本地存储
        const saveResult = await settingsStorageManager.set('aiConfig', aiConfig);
        if (!saveResult) {
          throw new Error('保存配置到本地存储失败');
        }
        
        // 更新状态
        set({
          ...aiConfig,
          isLoading: false,
        });
        
        return true;
      } catch (error) {
        set({ isLoading: false });
        throw error;
      }
    },

    // 测试AI连接
    testAiConnection: async () => {
      try {
        const { apiUrl, apiKey, modelName } = get();
        
        if (!apiUrl || !apiKey) {
          throw new Error('请填写完整的API配置信息');
        }

        set({ isLoading: true });
        
        // 构造API请求URL，确保URL格式正确
        let requestUrl = apiUrl;
        if (!requestUrl.endsWith('/')) {
          requestUrl += '/';
        }
        requestUrl += 'chat/completions';
        
        // 构造请求头
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        };
        
        // 构造请求体，使用最小的测试请求
        const requestBody = {
          model: modelName,
          messages: [
            {
              role: 'user',
              content: 'Hi'
            }
          ],
          max_tokens: 1,
          temperature: 0,
        };
        
        // 发送请求
        const response = await fetch(requestUrl, {
          method: 'POST',
          headers,
          body: JSON.stringify(requestBody),
        });
        
        // 检查响应状态
        if (!response.ok) {
          const errorData = await response.json().catch(() => null);
          let errorMessage = `连接失败: ${response.status} ${response.statusText}`;
          
          if (errorData && errorData.error) {
            errorMessage = errorData.error.message || errorMessage;
          }
          
          throw new Error(errorMessage);
        }
        
        // 解析响应数据
        const responseData = await response.json();
        
        // 验证响应格式
        if (!responseData.choices || !responseData.choices.length || !responseData.choices[0].message) {
          throw new Error('API响应格式不正确');
        }
        
        // 更新测试结果
        set({
          isLoading: false,
          lastTestTime: Date.now(),
          testResult: {
            success: true,
            message: '连接测试成功，API响应正常',
            timestamp: Date.now(),
          },
        });
        
        return { success: true, message: '连接测试成功，API响应正常' };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : '连接测试失败';
        
        set({
          isLoading: false,
          lastTestTime: Date.now(),
          testResult: {
            success: false,
            message: errorMessage,
            timestamp: Date.now(),
          },
        });
        
        throw error;
      }
    },

    // 重置AI配置
    resetAiConfig: async () => {
      try {
        // 从本地存储删除配置
        await settingsStorageManager.remove('aiConfig');
        
        // 重置状态
        set({
          apiUrl: DEFAULT_BASE_URL, // 默认使用硅基流动
          apiKey: '',
          modelName: DEFAULT_MODEL,
          serviceProvider: 'openai',
          isConfigured: false,
          lastTestTime: null,
          testResult: null,
        });
      } catch (error) {
        console.error('重置AI配置失败:', error);
      }
    },

    // 其他设置操作
    updateAutoSave: (autoSave: boolean) => {
      set({ autoSave });
    },

    updateEnableNotifications: (enableNotifications: boolean) => {
      set({ enableNotifications });
    },

    updateTheme: (theme: string) => {
      set({ theme });
    },

    // 重置所有设置
    resetAllSettings: async () => {
      try {
        // 清空本地存储中的所有设置
        await settingsStorageManager.clear();
        
        // 重置所有状态
        set(initialState);
      } catch (error) {
        console.error('重置所有设置失败:', error);
      }
    },
  })
);

export default useSettingStore;