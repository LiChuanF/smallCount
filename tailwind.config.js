// 导入多主题颜色配置
import { tailwindThemeColors } from './theme/colors';

// 默认主题名称
const DEFAULT_THEME = 'default';

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./components/**/*.{js,ts,tsx}", "./app/**/*.{js,ts,tsx}"],
  
  presets: [require("nativewind/preset")],
  darkMode: "class",
  theme: {
    extend: {
      // 使用默认主题的颜色配置
      colors: tailwindThemeColors(DEFAULT_THEME),
    },
  },
  plugins: [],
};

// 导出主题切换功能，用于开发环境或构建时切换主题
module.exports.switchTheme = (themeName) => {
  return {
    ...module.exports,
    theme: {
      ...module.exports.theme,
      extend: {
        ...module.exports.theme.extend,
        colors: tailwindThemeColors(themeName),
      },
    },
  };
};

// 导出所有可用主题名称
module.exports.availableThemes = ['default', 'blue', 'purple', 'orange'];
