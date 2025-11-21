import type { Theme } from '@react-navigation/native';
import {
  DarkTheme as _DarkTheme,
  DefaultTheme,
} from '@react-navigation/native';
import { colors, Colors } from './colors';
/**
 * 主题接口
 */

/**
 * 主题颜色接口
 */
export interface ThemeColors {
  // 主色调
  primary: string;
  primaryLight: string;
  primaryDark: string;
  
  // 辅助色
  secondary: string;
  secondaryLight: string;
  secondaryDark: string;
  
  // 背景色
  background: string;
  backgroundSecondary: string;
  backgroundTertiary: string;
  
  // 表面色
  surface: string;
  surfaceSecondary: string;
  surfaceTertiary: string;
  
  // 文本色
  text: string;
  textSecondary: string;
  textTertiary: string;
  textInverse: string;
  
  // 边框色
  border: string;
  borderSecondary: string;
  borderTertiary: string;
  
  // 状态色
  success: string;
  successLight: string;
  warning: string;
  warningLight: string;
  error: string;
  errorLight: string;
  info: string;
  infoLight: string;
  
  // 收支颜色
  income: string;
  incomeLight: string;
  expense: string;
  expenseLight: string;
  
  // 特殊颜色
  overlay: string;
  shadow: string;
  highlight: string;
  divider: string;
}

/**
 * 字体排版接口
 */
export interface Typography {
  // 字体大小
  fontSize: {
    xs: number;
    sm: number;
    base: number;
    lg: number;
    xl: number;
    xxl: number;
    xxxl: number;
    huge: number;
  };
  
  // 字体粗细
  fontWeight: {
    light: string;
    normal: string;
    medium: string;
    semibold: string;
    bold: string;
    extrabold: string;
  };
  
  // 行高
  lineHeight: {
    tight: number;
    normal: number;
    relaxed: number;
    loose: number;
  };
  
  // 字体族
  fontFamily: {
    regular: string;
    medium: string;
    semibold: string;
    bold: string;
  };
}

/**
 * 间距接口
 */
export interface Spacing {
  xs: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
  xxl: number;
  xxxl: number;
}

/**
 * 圆角接口
 */
export interface BorderRadius {
  xs: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
  xxl: number;
  round: number;
}

/**
 * 阴影接口 - 根据主题动态返回阴影样式
 */
export interface Shadows {
  small: any;
  medium: any;
  large: any;
  primary: {
    small: any;
    medium: any;
    large: any;
  };
}

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

// 导出颜色工具函数和颜色常量
export { Colors };


