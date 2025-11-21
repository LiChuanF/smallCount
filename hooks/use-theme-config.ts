import type { Theme } from '@react-navigation/native';
import { useColorScheme } from 'nativewind';
import { useCallback, useDeferredValue, useEffect, useMemo, useState } from 'react';

import { darkTheme, lightTheme } from '../theme/index';
import { themeStorageManager } from '../utils/storage';

export type ColorSchemeType = 'light' | 'dark' | 'system';
// 统一使用相同的存储键名，与 use-selected-theme.ts 保持一致
const SELECTED_THEME = 'SELECTED_THEME';



/**
 * 主题配置 Hook - 提供完整的主题管理功能
 * 
 * 该 Hook 整合了主题的获取、设置、更新和监听功能，为应用提供统一的主题管理接口。
 * 支持浅色/深色/系统主题切换，并与 React Navigation 和 NativeWind 无缝集成。
 * 
 * @returns 主题管理对象，包含当前主题配置和操作方法
 */
export function useThemeConfig() {
  const { colorScheme: nativeWindColorScheme, setColorScheme } = useColorScheme();
  const [savedTheme, setSavedTheme] = useState<string | undefined>(undefined);
  
  // 使用延迟值来减少频繁的重新计算
  const deferredSavedTheme = useDeferredValue(savedTheme);
  const deferredNativeWindColorScheme = useDeferredValue(nativeWindColorScheme);
  
  // 初始化时从存储中读取主题设置，与 use-selected-theme.ts 保持一致
  useEffect(() => {
    const loadTheme = async () => {
      const theme = await themeStorageManager.getString(SELECTED_THEME);
      if (theme && ['light', 'dark', 'system'].includes(theme)) {
        setSavedTheme(theme);
        // 同步设置到 NativeWind
        setColorScheme(theme as ColorSchemeType);
      } else {
        // 如果没有保存的主题，使用系统主题
        setColorScheme('system');
      }
    };
    loadTheme();
  }, [setColorScheme]);
  
  // 计算实际的颜色模式（考虑系统主题）
  const effectiveColorScheme = useMemo(() => {
    if (deferredSavedTheme === 'system' || !deferredSavedTheme) {
      return deferredNativeWindColorScheme || 'light';
    }
    return deferredSavedTheme as 'light' | 'dark';
  }, [deferredNativeWindColorScheme, deferredSavedTheme]);

  /**
   * 获取当前应用的主题配置
   */
  const theme = useMemo(() => {
    return effectiveColorScheme === 'dark' ? darkTheme : lightTheme;
  }, [effectiveColorScheme]);

  // 设置应用主题
  const setTheme = useCallback(async (newTheme: ColorSchemeType): Promise<boolean> => {
    try {
      // 先更新本地状态，避免多次重新渲染
      setSavedTheme(newTheme);
      
      // 然后更新 NativeWind 和持久化存储
      setColorScheme(newTheme);
      await themeStorageManager.set(SELECTED_THEME, newTheme);
      
      return true;
    } catch (error) {
      console.error('Failed to set theme:', error);
      return false;
    }
  }, [setColorScheme]);

  /**
   * 重置主题为系统默认
   * @returns Promise<boolean> 重置是否成功
   */
  const resetTheme = useCallback(async (): Promise<boolean> => {
    return setTheme('system');
  }, [setTheme]);

  /**
   * 切换主题（浅色/深色）
   * @returns Promise<boolean> 切换是否成功
   */
  const toggleTheme = useCallback(async (): Promise<boolean> => {
    const newTheme = effectiveColorScheme === 'dark' ? 'light' : 'dark';
    return setTheme(newTheme);
  }, [effectiveColorScheme, setTheme]);

  /**
   * 检查当前是否为深色模式
   */
  const isDarkMode = useMemo(() => {
    return effectiveColorScheme === 'dark';
  }, [effectiveColorScheme]);

  /**
   * 检查当前是否为浅色模式
   */
  const isLightMode = useMemo(() => {
    return effectiveColorScheme === 'light';
  }, [effectiveColorScheme]);

  /**
   * 检查当前是否使用系统主题
   */
  const isSystemTheme = useMemo(() => {
    return deferredSavedTheme === 'system' || !deferredSavedTheme;
  }, [deferredSavedTheme]);

  /**
   * 获取当前主题类型
   */
  const themeType = useMemo(() => {
    return (deferredSavedTheme || 'system') as ColorSchemeType;
  }, [deferredSavedTheme]);

  // 创建返回对象，包含所有新功能
  const result = {
    // 主题配置（用于 React Navigation）
    theme,
    
    // 主题状态
    isDarkMode,
    isLightMode,
    isSystemTheme,
    themeType,
    effectiveColorScheme,
    
    // 主题操作方法
    setTheme,
    resetTheme,
    toggleTheme,
    
    // 原始颜色方案（如果需要直接访问）
    nativeWindColorScheme,
  };

  // 为了向后兼容性，让返回对象也能直接作为 Theme 对象使用
  // 这样现有代码中直接使用 `useThemeConfig()` 作为 Theme 的地方仍然有效
  Object.assign(result, theme);

  return result as typeof result & Theme;
}


