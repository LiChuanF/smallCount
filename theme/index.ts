import type { Theme } from '@react-navigation/native';
import {
  DarkTheme as _DarkTheme,
  DefaultTheme,
} from '@react-navigation/native';
import { colors } from './colors';


export const darkTheme: Theme = {
  ..._DarkTheme,
  colors: {
    ..._DarkTheme.colors,
    primary: colors.primary[600], // 深色模式下使用较浅的主题色
    background: colors.charcoal[950], // 深黑色背景
    text: colors.charcoal[100], // 浅色文字
    border: colors.charcoal[500], // 边框颜色
    card: colors.charcoal[850], // 卡片背景
  },
};

// 自定义浅色主题
export const lightTheme: Theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: colors.primary[600], // 浅色模式下使用较深的主题色
    background: colors.white, // 白色背景
    text: colors.black, // 黑色文字
    border: colors.neutral[300], // 边框颜色
    card: colors.neutral[100], // 卡片背景
  },
};

/**
 * 主题类型
 */
export type ThemeType = 'light' | 'dark' | 'system';

/**
 * 默认主题
 */
export const defaultTheme = lightTheme;




