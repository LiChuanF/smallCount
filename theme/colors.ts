export const colors = {  
  white: "#ffffff",  
  black: "#000000",  
  
  // 深色模式主色调 (基于 HTML Dark Mode 调整)  
  charcoal: {  
    50: "#f6f6f7",  
    100: "#e3e3e6",  
    200: "#c7c7cc",  
    300: "#aeb0b6",  
    400: "#8e8e93",  
    500: "#636366",  
    600: "#48484a",  
    700: "#3a3a3c", // 对应 HTML 深色键盘激活背景  
    800: "#2c2c2e", // 对应 HTML 深色模式边框/键盘背景  
    850: "#1c1c1e", // [重要] 对应 HTML 深色模式卡片背景 (--bg-card dark)  
    900: "#18181a",  
    950: "#121212", // [重要] 对应 HTML 深色模式最底层背景  
  },  
  
  // 中性色 (基于 HTML Light Mode 调整，匹配 Cool Gray 系列)  
  neutral: {  
    50: "#f9fafb", // 对应 HTML 键盘激活背景  
    100: "#f3f4f6", // [重要] 对应 HTML 应用背景/输入框背景 (--bg-app)  
    200: "#e5e7eb", // [重要] 对应 HTML 边框/Pill背景 (--border)  
    300: "#d1d5db",  
    400: "#9ca3af", // 对应 HTML 深色模式副文本  
    500: "#6b7280", // [重要] 对应 HTML 浅色模式副文本 (--text-sub)  
    600: "#4b5563",  
    700: "#374151",  
    800: "#1f2937", // [重要] 对应 HTML 浅色模式主文本 (--text-main)  
    900: "#111827",  
  },  
  
  // 主题色 (已修改为 HTML 默认的绿色系 Emerald)  
  // 对应 HTML 中的 --primary: #10b981  
  primary: {  
    50: "#ecfdf5",  
    100: "#d1fae5", // 对应 HTML 选中分类/图表背景  
    200: "#a7f3d0",  
    300: "#6ee7b7",  
    400: "#34d399",  
    500: "#10b981", // [重要] HTML 默认主色  
    600: "#059669",  
    700: "#047857",  
    800: "#065f46",  
    900: "#064e3b", // 对应 HTML 深色模式选中背景  
  },  
  
  // 语义化颜色 - 成功 (保持与微信图标一致的绿色)  
  success: {  
    50: "#f0fdf4",  
    100: "#dcfce7",  
    200: "#bbf7d0",  
    300: "#86efac",  
    400: "#4ade80",  
    500: "#22c55e", // [重要] 匹配 HTML 中微信图标颜色  
    600: "#16a34a",  
    700: "#15803d",  
    800: "#166534",  
    900: "#14532d",  
  },  
  
  // 语义化颜色 - 警告 (保持与 HTML 一致的黄色)  
  warning: {  
    50: "#fffbeb",  
    100: "#fef3c7",  
    200: "#fde68a",  
    300: "#fcd34d",  
    400: "#fbbf24",  
    500: "#f59e0b", // [重要] 匹配 HTML 中购物/现金图标及 --accent-orange  
    600: "#d97706",  
    700: "#b45309",  
    800: "#92400e",  
    900: "#78350f",  
  },  
  
  // 语义化颜色 - 危险/支出 (保持与 HTML 一致的红色)  
  danger: {  
    50: "#fef2f2",  
    100: "#fee2e2",  
    200: "#fecaca",  
    300: "#fca5a5",  
    400: "#f87171",  
    500: "#ef4444", // [重要] 匹配 HTML 中 --danger  
    600: "#dc2626",  
    700: "#b91c1c",  
    800: "#991b1b",  
    900: "#7f1d1d",  
  },  
};  




export const Colors = {
  // 主色调
  primary: '#007AFF',
  primaryLight: '#5AC8FA',
  primaryDark: '#0051D5',
  
  // 辅助色
  secondary: '#5856D6',
  secondaryLight: '#7C7AE8',
  secondaryDark: '#4640B8',
  accent: '#FF9500',
  
  // 功能色
  success: '#34C759',
  successLight: '#63D86E',
  warning: '#FF9500',
  warningLight: '#FFB143',
  error: '#FF3B30',
  errorLight: '#FF6B62',
  info: '#5AC8FA',
  infoLight: '#7DD4FC',
  
  // 收支颜色
  income: '#34C759',
  incomeLight: '#63D86E',
  expense: '#FF3B30',
  expenseLight: '#FF6B62',
  
  // 中性色
  background: '#FFFFFF',
  backgroundSecondary: '#F2F2F7',
  backgroundTertiary: '#FFFFFF',
  
  text: '#000000',
  textSecondary: '#3C3C43',
  textTertiary: '#3C3C4399',
  textQuaternary: '#3C3C4333',
  
  border: '#C6C6C8',
  borderLight: '#E5E5EA',
  separator: '#C6C6C8',
  
  // 阴影
  shadow: '#000000',
  
  // 分类预设颜色
  categories: [
    '#FF3B30', // 红色
    '#FF9500', // 橙色
    '#FFCC00', // 黄色
    '#34C759', // 绿色
    '#5AC8FA', // 浅蓝
    '#007AFF', // 蓝色
    '#5856D6', // 紫色
    '#AF52DE', // 紫罗兰
    '#FF2D92', // 粉色
    '#8E8E93', // 灰色
  ],
} as const;