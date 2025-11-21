// 主题类型定义
export type ThemeName = 'default' | 'blue' | 'purple' | 'orange';

// 颜色集合接口定义
export interface ColorPalette {
  white: string;
  black: string;
  charcoal: {
    50: string;
    100: string;
    200: string;
    300: string;
    400: string;
    500: string;
    600: string;
    700: string;
    800: string;
    850: string;
    900: string;
    950: string;
  };
  neutral: {
    50: string;
    100: string;
    200: string;
    300: string;
    400: string;
    500: string;
    600: string;
    700: string;
    800: string;
    900: string;
  };
  primary: {
    50: string;
    100: string;
    200: string;
    300: string;
    400: string;
    500: string;
    600: string;
    700: string;
    800: string;
    900: string;
  };
  success: {
    50: string;
    100: string;
    200: string;
    300: string;
    400: string;
    500: string;
    600: string;
    700: string;
    800: string;
    900: string;
  };
  warning: {
    50: string;
    100: string;
    200: string;
    300: string;
    400: string;
    500: string;
    600: string;
    700: string;
    800: string;
    900: string;
  };
  danger: {
    50: string;
    100: string;
    200: string;
    300: string;
    400: string;
    500: string;
    600: string;
    700: string;
    800: string;
    900: string;
  };
}

// 通用基础颜色（所有主题共享的基础颜色）
const baseColors = {
  white: "#ffffff",
  black: "#000000",
  // 深色模式和中性色在所有主题中保持一致
  charcoal: {
    50: "#f6f6f7",
    100: "#e3e3e6",
    200: "#c7c7cc",
    300: "#aeb0b6",
    400: "#8e8e93",
    500: "#636366",
    600: "#48484a",
    700: "#3a3a3c",
    800: "#2c2c2e",
    850: "#1c1c1e",
    900: "#18181a",
    950: "#121212",
  },
  neutral: {
    50: "#f9fafb",
    100: "#f3f4f6",
    200: "#e5e7eb",
    300: "#d1d5db",
    400: "#9ca3af",
    500: "#6b7280",
    600: "#4b5563",
    700: "#374151",
    800: "#1f2937",
    900: "#111827",
  },
};

// 默认主题（绿色系）
const defaultTheme: ColorPalette = {
  ...baseColors,
  primary: {
    50: "#ecfdf5",
    100: "#d1fae5",
    200: "#a7f3d0",
    300: "#6ee7b7",
    400: "#34d399",
    500: "#10b981",
    600: "#059669",
    700: "#047857",
    800: "#065f46",
    900: "#064e3b",
  },
  success: {
    50: "#f0fdf4",
    100: "#dcfce7",
    200: "#bbf7d0",
    300: "#86efac",
    400: "#4ade80",
    500: "#22c55e",
    600: "#16a34a",
    700: "#15803d",
    800: "#166534",
    900: "#14532d",
  },
  warning: {
    50: "#fffbeb",
    100: "#fef3c7",
    200: "#fde68a",
    300: "#fcd34d",
    400: "#fbbf24",
    500: "#f59e0b",
    600: "#d97706",
    700: "#b45309",
    800: "#92400e",
    900: "#78350f",
  },
  danger: {
    50: "#fef2f2",
    100: "#fee2e2",
    200: "#fecaca",
    300: "#fca5a5",
    400: "#f87171",
    500: "#ef4444",
    600: "#dc2626",
    700: "#b91c1c",
    800: "#991b1b",
    900: "#7f1d1d",
  },
};

// 蓝色主题
const blueTheme: ColorPalette = {
  ...baseColors,
  primary: {
    50: "#eff6ff",
    100: "#dbeafe",
    200: "#bfdbfe",
    300: "#93c5fd",
    400: "#60a5fa",
    500: "#3b82f6",
    600: "#2563eb",
    700: "#1d4ed8",
    800: "#1e40af",
    900: "#1e3a8a",
  },
  success: {
    50: "#eff6ff",
    100: "#dbeafe",
    200: "#bfdbfe",
    300: "#93c5fd",
    400: "#60a5fa",
    500: "#3b82f6",
    600: "#2563eb",
    700: "#1d4ed8",
    800: "#1e40af",
    900: "#1e3a8a",
  },
  warning: {
    50: "#fffbeb",
    100: "#fef3c7",
    200: "#fde68a",
    300: "#fcd34d",
    400: "#fbbf24",
    500: "#f59e0b",
    600: "#d97706",
    700: "#b45309",
    800: "#92400e",
    900: "#78350f",
  },
  danger: {
    50: "#fee2e2",
    100: "#fecaca",
    200: "#fca5a5",
    300: "#f87171",
    400: "#ef4444",
    500: "#dc2626",
    600: "#b91c1c",
    700: "#991b1b",
    800: "#7f1d1d",
    900: "#621b1b",
  },
};

// 紫色主题
const purpleTheme: ColorPalette = {
  ...baseColors,
  primary: {
    50: "#f5f3ff",
    100: "#ede9fe",
    200: "#ddd6fe",
    300: "#c4b5fd",
    400: "#a78bfa",
    500: "#8b5cf6",
    600: "#7c3aed",
    700: "#6d28d9",
    800: "#5b21b6",
    900: "#4c1d95",
  },
  success: {
    50: "#f5f3ff",
    100: "#ede9fe",
    200: "#ddd6fe",
    300: "#c4b5fd",
    400: "#a78bfa",
    500: "#8b5cf6",
    600: "#7c3aed",
    700: "#6d28d9",
    800: "#5b21b6",
    900: "#4c1d95",
  },
  warning: {
    50: "#fffbeb",
    100: "#fef3c7",
    200: "#fde68a",
    300: "#fcd34d",
    400: "#fbbf24",
    500: "#f59e0b",
    600: "#d97706",
    700: "#b45309",
    800: "#92400e",
    900: "#78350f",
  },
  danger: {
    50: "#fdf2f8",
    100: "#fce7f3",
    200: "#fbcfe8",
    300: "#f9a8d4",
    400: "#f472b6",
    500: "#ec4899",
    600: "#db2777",
    700: "#be185d",
    800: "#9d174d",
    900: "#831843",
  },
};

// 橙色主题
const orangeTheme: ColorPalette = {
  ...baseColors,
  primary: {
    50: "#fff7ed",
    100: "#ffedd5",
    200: "#fed7aa",
    300: "#fdba74",
    400: "#fb923c",
    500: "#f97316",
    600: "#ea580c",
    700: "#c2410c",
    800: "#9a3412",
    900: "#7c2d12",
  },
  success: {
    50: "#fff7ed",
    100: "#ffedd5",
    200: "#fed7aa",
    300: "#fdba74",
    400: "#fb923c",
    500: "#f97316",
    600: "#ea580c",
    700: "#c2410c",
    800: "#9a3412",
    900: "#7c2d12",
  },
  warning: {
    50: "#fffbeb",
    100: "#fef3c7",
    200: "#fde68a",
    300: "#fcd34d",
    400: "#fbbf24",
    500: "#f59e0b",
    600: "#d97706",
    700: "#b45309",
    800: "#92400e",
    900: "#78350f",
  },
  danger: {
    50: "#fffbeb",
    100: "#fef3c7",
    200: "#fde68a",
    300: "#fcd34d",
    400: "#fbbf24",
    500: "#f59e0b",
    600: "#d97706",
    700: "#b45309",
    800: "#92400e",
    900: "#78350f",
  },
};

// 主题集合
export const themes: Record<ThemeName, ColorPalette> = {
  default: defaultTheme,
  blue: blueTheme,
  purple: purpleTheme,
  orange: orangeTheme,
};

// 获取当前主题的颜色
export const getThemeColors = (themeName: ThemeName = 'default'): ColorPalette => {
  return themes[themeName] || themes.default;
};

// 为特定主题生成 TailwindCSS 颜色配置
const generateThemeTailwindColors = (theme: ColorPalette) => {
  return {
    ...theme,
    // 扩展颜色别名，便于在 Tailwind 中使用
    'bg-primary': theme.primary[500],
    'bg-secondary': theme.neutral[100],
    'bg-dark': theme.charcoal[950],
    'bg-card': {
      light: theme.neutral[100],
      dark: theme.charcoal[850]
    },
    'text-primary': theme.neutral[800],
    'text-secondary': theme.neutral[500],
    'text-dark': theme.charcoal[900],
    'text-light': theme.neutral[50],
    'border-light': theme.neutral[200],
    'border-dark': theme.charcoal[800],
    // 状态颜色
    'success': theme.success[500],
    'warning': theme.warning[500],
    'error': theme.danger[500],
    'info': theme.primary[400],
  };
};

// 生成 TailwindCSS 配置对象
export const generateTailwindConfig = (themeName: ThemeName = 'default') => {
  const theme = getThemeColors(themeName);
  const tailwindColors = generateThemeTailwindColors(theme);
  
  return {
    theme: {
      extend: {
        colors: tailwindColors,
      },
    },
  };
};

// 导出可直接用于 tailwind.config.js 的颜色对象
export const tailwindThemeColors = (themeName: ThemeName = 'default') => {
  const theme = getThemeColors(themeName);
  return {
    white: theme.white,
    black: theme.black,
    charcoal: theme.charcoal,
    neutral: theme.neutral,
    primary: theme.primary,
    success: theme.success,
    warning: theme.warning,
    danger: theme.danger,
    'bg-primary': theme.primary[500],
    'bg-secondary': theme.neutral[100],
    'bg-dark': theme.charcoal[950],
    'text-primary': theme.neutral[800],
    'text-secondary': theme.neutral[500],
    'border': theme.neutral[200],
  };
};

// 导出默认主题颜色作为向后兼容
export const colors = defaultTheme;

