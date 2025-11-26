// store/adapter.ts
import { StateStorage } from 'zustand/middleware';
import {
    StorageType,
    defaultStorageManager,
    settingsStorageManager,
    themeStorageManager
} from '../utils/storage'; // 假设你的 StorageManager 代码在这个路径

// 映射 StorageType 到具体的实例
const managerMap = {
  [StorageType.DEFAULT]: defaultStorageManager,
  [StorageType.THEME]: themeStorageManager,
  [StorageType.SETTINGS]: settingsStorageManager,
};

/**
 * 将你的 StorageManager 转换为 Zustand 需要的 StateStorage 接口
 */
export const createZustandStorage = (type: StorageType = StorageType.DEFAULT): StateStorage => {
  const manager = managerMap[type];

  return {
    // Zustand 会传入序列化后的 JSON 字符串
    setItem: async (name: string, value: string): Promise<void> => {
      // 直接调用你的 set 方法，因为它内部判断了 typeof value === 'string'
      await manager.set(name, value);
    },

    // Zustand 期望读回 JSON 字符串，然后它自己去 parse
    getItem: async (name: string): Promise<string | null> => {
      // 关键：必须调用 getString，不能调用 get (因为 get 会尝试 JSON.parse)
      // 如果这里返回了 Object，Zustand 内部再次 JSON.parse 会崩溃
      const value = await manager.getString(name);
      return value ?? null;
    },

    removeItem: async (name: string): Promise<void> => {
      await manager.remove(name);
    },
  };
};