// store/index.ts
import { create, StateCreator, StoreApi, UseBoundStore } from 'zustand';
import { createJSONStorage, persist, PersistOptions } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { StorageType } from '../utils/storage'; // 引用你的枚举
import { createZustandStorage } from './adapter';

// --- 类型定义 ---

// 自动生成 Selector 的类型工具
type WithSelectors<S> = S extends { getState: () => infer T }
  ? S & { use: { [K in keyof T]: () => T[K] } }
  : never;

// 生成 Selector 的具体实现
const createSelectors = <S extends UseBoundStore<StoreApi<object>>>(
  _store: S
) => {
  let store = _store as WithSelectors<S>;
  store.use = {};
  for (let k of Object.keys(store.getState())) {
    (store.use as any)[k] = () => store((s) => s[k as keyof typeof s]);
  }
  return store;
};

// 配置项接口
interface CreateStoreOptions {
  persist?: {
    name: string; // 存储的 key (不含前缀，前缀由 StorageManager 处理)
    type?: StorageType; // 选择使用哪个 StorageManager (Default/Theme/Settings)
  };
}

/**
 * 核心 Store 创建函数
 * @param storeCreator Zustand 的状态创建函数
 * @param options 配置项 (可选持久化)
 */
export const createAppStore = <T extends object>(
  storeCreator: StateCreator<T, [['zustand/immer', never]], []>,
  options?: CreateStoreOptions
) => {
  let store;

  if (options?.persist) {
    // 启用持久化 - 正确的中间件组合顺序：persist 包裹 immer
    store = create<T>()(
      persist(
        immer(storeCreator),
        {
          name: options.persist.name,
          // 使用我们封装的 adapter，并传入指定的 StorageType
          storage: createJSONStorage(() => 
            createZustandStorage(options.persist!.type || StorageType.DEFAULT)
          ),
        } as PersistOptions<T>
      )
    );
  } else {
    // 仅使用 Immer，不持久化
    store = create<T>()(immer(storeCreator));
  }

  return createSelectors(store);
};