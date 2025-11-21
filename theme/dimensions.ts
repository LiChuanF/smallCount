/**
 * 屏幕尺寸相关常量
 */
export const Screen = {
  // 基准尺寸 (iPhone 13)
  baseWidth: 390,
  baseHeight: 844,
  
  // 最小和最大尺寸
  minWidth: 320,
  maxWidth: 768,
  minHeight: 568,
  maxHeight: 1024,
} as const;

/**
 * 间距常量
 */
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
} as const;

/**
 * 字体大小常量
 */
export const FontSize = {
  xs: 12,
  sm: 14,
  base: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 40,
} as const;

/**
 * 字体粗细常量
 */
export const FontWeight = {
  light: '300',
  normal: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
  extrabold: '800',
} as const;

/**
 * 圆角常量
 */
export const BorderRadius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  round: 9999,
} as const;

/**
 * 边框宽度常量
 */
export const BorderWidth = {
  thin: 0.5,
  normal: 1,
  thick: 2,
  extraThick: 4,
} as const;

/**
 * 阴影常量
 */
export const Shadow = {
  small: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  large: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
} as const;

/**
 * 图标大小常量
 */
export const IconSize = {
  xs: 12,
  sm: 16,
  md: 20,
  lg: 24,
  xl: 28,
  xxl: 32,
  xxxl: 40,
} as const;

/**
 * 按钮尺寸常量
 */
export const ButtonSize = {
  small: {
    height: 32,
    paddingHorizontal: 16,
    fontSize: FontSize.sm,
  },
  medium: {
    height: 44,
    paddingHorizontal: 24,
    fontSize: FontSize.base,
  },
  large: {
    height: 52,
    paddingHorizontal: 32,
    fontSize: FontSize.lg,
  },
} as const;

/**
 * 输入框尺寸常量
 */
export const InputSize = {
  small: {
    height: 36,
    fontSize: FontSize.sm,
    paddingHorizontal: Spacing.sm,
  },
  medium: {
    height: 44,
    fontSize: FontSize.base,
    paddingHorizontal: Spacing.md,
  },
  large: {
    height: 52,
    fontSize: FontSize.lg,
    paddingHorizontal: Spacing.lg,
  },
} as const;

/**
 * 列表项高度常量
 */
export const ListItemHeight = {
  small: 44,
  medium: 56,
  large: 72,
} as const;

/**
 * 标签栏高度常量
 */
export const TabBarHeight = {
  standard: 49,
  large: 65,
} as const;

/**
 * 导航栏高度常量
 */
export const NavigationBarHeight = {
  standard: 44,
  large: 96, // 包含状态栏
} as const;

/**
 * 状态栏高度常量
 */
export const StatusBarHeight = {
  standard: 44, // iPhone刘海屏
  small: 20,    // 普通屏幕
} as const;