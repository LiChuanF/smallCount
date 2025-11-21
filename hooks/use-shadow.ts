// 自定义钩子：根据布尔值自动选择主题获取阴影样式 主要用于android
import { colors } from "@/theme/colors";
import { StyleSheet } from "react-native";
// 阴影相关 - 支持浅色和深色主题
const shadows = {
  // 浅色主题阴影
  light: {
    small: {
      shadowColor: colors.charcoal[900], // 使用深色作为阴影颜色
      shadowOffset: {
        width: 0,
        height: 1,
      },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 2,
    },
    medium: {
      shadowColor: colors.charcoal[900], // 使用深色作为阴影颜色
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 3.84,
      elevation: 5,
    },
    large: {
      shadowColor: colors.charcoal[900], // 使用深色作为阴影颜色
      shadowOffset: {
        width: 0,
        height: 4,
      },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 8,
    },
  },
  // 深色主题阴影
  dark: {
    small: {
      shadowColor: colors.charcoal[500], // 使用浅色作为阴影颜色
      shadowOffset: {
        width: 0,
        height: 1,
      },
      shadowOpacity: 0.08,
      shadowRadius: 2,
      elevation: 2,
    },
    medium: {
      shadowColor: colors.charcoal[500], // 使用浅色作为阴影颜色
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.12,
      shadowRadius: 3.84,
      elevation: 5,
    },
    large: {
      shadowColor: colors.charcoal[500], // 使用浅色作为阴影颜色
      shadowOffset: {
        width: 0,
        height: 4,
      },
      shadowOpacity: 0.18,
      shadowRadius: 8,
      elevation: 8,
    },
  },
  // 主题色阴影 - 使用primary[500]作为阴影颜色
  primary: {
    small: {
      shadowColor: colors.primary[500], // 使用主题色作为阴影颜色
      shadowOffset: {
        width: 0,
        height: 1,
      },
      shadowOpacity: 0.15,
      shadowRadius: 2,
      elevation: 2,
    },
    medium: {
      shadowColor: colors.primary[500], // 使用主题色作为阴影颜色
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.2,
      shadowRadius: 3.84,
      elevation: 5,
    },
    large: {
      shadowColor: colors.primary[500], // 使用主题色作为阴影颜色
      shadowOffset: {
        width: 0,
        height: 4,
      },
      shadowOpacity: 0.25,
      shadowRadius: 8,
      elevation: 8,
    },
  },
} as const;

export function useShadowStyle(isDarkMode: boolean, size: 'small' | 'medium' | 'large') {
  return StyleSheet.create({
    shadow: isDarkMode ? shadows.dark[size] : shadows.light[size],
  });
}