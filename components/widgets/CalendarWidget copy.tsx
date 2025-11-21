import { colors } from '@/theme/colors';
import React, { useState, useEffect } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { Calendar, LocaleConfig } from "react-native-calendars";
import { useThemeConfig } from '@/hooks/use-theme-config';
import { StyleProp, ViewStyle } from 'react-native';
import { DateData, MarkedDates, Theme } from 'react-native-calendars/src/types';

LocaleConfig.locales['zh'] = {
  monthNames: [
    '01',
    '02',
    '03',
    '04',
    '05',
    '06',
    '07',
    '08',
    '09',
    '10',
    '11',
    '12'
  ],
  monthNamesShort: ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'],
  dayNames: ['周日', '周一', '周二', '周三', '周四', '周五', '周六'],
  dayNamesShort: ['日', '一', '二', '三', '四', '五', '六'],
  today: "今天"
};

LocaleConfig.defaultLocale = 'zh';

// 自定义日期组件
const CustomDay = ({ date, state, marking, onPress, onLongPress, theme, transactionsData }: any) => {
  const themeConfig = useThemeConfig();
  const [isSelected, setIsSelected] = useState(state === 'selected');
  
  // 监听 state 变化，同步选择状态
  useEffect(() => {
    setIsSelected(state === 'selected');
  }, [state]);
  
  // 获取某日的支出和收入数据
  const getDayTransactions = (dateString: string) => {
    // 从传入的交易数据中获取指定日期的收支信息
    const dayData = transactionsData?.[dateString];
    
    if (dayData) {
      return {
        expense: dayData.expense || 0,
        income: dayData.income || 0
      };
    }
    
    // 如果没有数据，返回0
    return { expense: 0, income: 0 };
  };

  const { expense, income } = getDayTransactions(date?.dateString || '');
  
  // 格式化金额显示
  const formatAmount = (amount: number, isExpense: boolean) => {
    if (amount === 0) return '0';
    const prefix = isExpense ? '-' : '+';
    return `${prefix}${amount.toFixed(2)}`;
  };

  // 判断背景色逻辑 - 支持亮暗主题和选择状态
  const getBackgroundColor = () => {
    // 选中状态优先级最高
    if (isSelected || state === 'selected') {
      return theme?.selectedDayBackgroundColor || colors.primary[600];
    }
    
    // 今日状态次之
    if (state === 'today') {
      return themeConfig.dark ? colors.primary[900] : colors.charcoal[200]; // 深色模式用深色，浅色模式用浅色
    }
    
    // 本月日期
    if (state === 'normal' || !state) {
      return themeConfig.dark ? colors.charcoal[800] : colors.neutral[200]; // 深色模式用深灰，浅色模式用浅灰
    }
    
    // 非本月日期（disabled状态或其他）
    return themeConfig.dark ? colors.charcoal[900] : colors.neutral[50]; // 深色模式用更深色，浅色模式用更浅色
  };

  // 判断文字颜色 - 支持亮暗主题和选择状态
  const getTextColor = () => {
    // 选中状态文字颜色
    if (isSelected || state === 'selected') {
      return theme?.selectedDayTextColor || colors.white;
    }
    
    // 今日状态文字颜色
    if (state === 'today') {
      return themeConfig.dark ? colors.primary[200] : colors.primary[700]; // 深色模式用浅色，浅色模式用深色
    }
    
    // 禁用状态文字颜色
    if (state === 'disabled') {
      return themeConfig.dark ? colors.neutral[500] : colors.neutral[400]; // 深色模式用更深的灰色
    }
    
    // 正常状态文字颜色
    return themeConfig.dark ? colors.neutral[200] : colors.charcoal[700]; // 深色模式用浅色，浅色模式用深色
  };

  // 判断边框颜色 - 支持亮暗主题和选择状态
  const getBorderColor = () => {
    // 选中状态优先级最高
    if (isSelected || state === 'selected') {
      return colors.primary[600]; // 选中状态用主题色边框
    }
    
    // 今日状态次之
    if (state === 'today') {
      return themeConfig.dark ? colors.primary[700] : colors.primary[300]; // 深色模式用深色边框
    }
    
    return 'transparent';
  };


  return (
    <TouchableOpacity
      style={{
        width: 46,
        height: 60,
        justifyContent: 'flex-start',
        alignItems: 'center',
        backgroundColor: getBackgroundColor(),
        borderRadius: 10,
        borderWidth: (state === 'today' || isSelected) ? 1 : 0,
        borderColor: getBorderColor(),
        opacity: state === 'disabled' ? 0.5 : 1,
      }}
      onPress={() => {
        // 触发选择事件
        onPress?.(date);
        // 更新内部选择状态（用于视觉反馈）
        setIsSelected(!isSelected);
      }}
      onLongPress={() => onLongPress?.(date)}
      disabled={state === 'disabled'}
    >
      {/* 日期数字 */}
      <Text
        style={{
          color: getTextColor(),
          fontSize: 18,
          fontWeight: (state === 'today' || isSelected) ? 'bold' : 'normal',
          marginBottom: 4,
        }}
      >
        {date?.day}
      </Text>
      
      {/* 收入和支出显示 - 上下结构 */}
      <View style={{ alignItems: 'center' }}>
        {/* 收入 */}
        <Text
          style={{
            color: income > 0 
              ? (themeConfig.dark ? colors.success[400] : colors.success[700]) // 深色模式用更亮的绿色
              : (themeConfig.dark ? colors.neutral[500] : colors.neutral[400]),
            fontSize: 10,
            fontWeight: '500',
            marginBottom: 1,
          }}
        >
          {income > 0 ? `+${income.toFixed(2)}` : '+0'}
        </Text>
        
        {/* 支出 */}
        <Text
          style={{
            color: expense > 0 
              ? (themeConfig.dark ? colors.danger[400] : colors.danger[700]) // 深色模式用更亮的红色
              : (themeConfig.dark ? colors.neutral[500] : colors.neutral[400]),
            fontSize: 10,
            fontWeight: '500',
          }}
        >
          {expense > 0 ? `-${expense.toFixed(2)}` : '-0'}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

interface CalendarWidgetProps {
  // 自定义交易数据
  transactionsData?: {
    [date: string]: {
      expense: number;
      income: number;
    };
  };
  
  // Calendar 核心属性
  current?: string;
  initialDate?: string;
  minDate?: string;
  maxDate?: string;
  allowSelectionOutOfRange?: boolean;
  markedDates?: MarkedDates;
  hideExtraDays?: boolean;
  showSixWeeks?: boolean;
  disableMonthChange?: boolean;
  enableSwipeMonths?: boolean;
  disabledByDefault?: boolean;
  disabledByWeekDays?: number[];
  
  // 样式相关
  style?: StyleProp<ViewStyle>;
  headerStyle?: StyleProp<ViewStyle>;
  theme?: Theme;
  customHeader?: any;
  
  // 事件回调
  onDayPress?: (date: DateData) => void;
  onDayLongPress?: (date: DateData) => void;
  onMonthChange?: (date: DateData) => void;
  onVisibleMonthsChange?: (months: DateData[]) => void;
  
  // 其他
  testID?: string;
}

export default function CalendarWidget({ 
  transactionsData = {},
  // Calendar 默认属性
  current = new Date().toISOString().split('T')[0], // 默认使用当前日期
  initialDate,
  minDate,
  maxDate,
  allowSelectionOutOfRange,
  markedDates,
  hideExtraDays,
  showSixWeeks,
  disableMonthChange,
  enableSwipeMonths = true,
  disabledByDefault,
  disabledByWeekDays,
  style,
  headerStyle,
  theme,
  customHeader,
  onDayPress,
  onDayLongPress,
  onMonthChange,
  onVisibleMonthsChange,
  testID
}: CalendarWidgetProps) {
    const themeConfig = useThemeConfig(); 
    
    // 创建一个包装组件来传递 transactionsData
    const DayComponentWithProps = (props: any) => (
      <CustomDay {...props} transactionsData={transactionsData} />
    );
    // 默认头部样式 - 支持亮暗主题
    const defaultHeaderStyle: StyleProp<ViewStyle> = {
      backgroundColor: themeConfig.dark ? colors.charcoal[950] : colors.white,
      borderBottomWidth: 1,
      borderBottomColor: themeConfig.dark ? colors.charcoal[800] : colors.neutral[200],
      paddingBottom: 8,
    };

    // 默认容器样式 - 支持亮暗主题
    const defaultStyle: StyleProp<ViewStyle> = {
      height: 550,
      backgroundColor: themeConfig.dark ? colors.charcoal[950] : colors.white,
      padding: 6,
    };

    // 合并默认主题和传入的主题 - 支持亮暗主题
    const defaultTheme = {
      backgroundColor: themeConfig.dark ? colors.charcoal[950] : colors.white,
      calendarBackground: themeConfig.dark ? colors.charcoal[950] : colors.white,
      textSectionTitleColor: themeConfig.dark ? colors.neutral[400] : colors.neutral[500],
      selectedDayBackgroundColor: colors.primary[600],
      selectedDayTextColor: colors.white,
      todayTextColor: themeConfig.dark ? colors.primary[400] : colors.primary[600],
      dayTextColor: themeConfig.dark ? colors.neutral[200] : colors.charcoal[700],
      textDisabledColor: themeConfig.dark ? colors.neutral[600] : colors.neutral[400],
      arrowColor: themeConfig.dark ? colors.neutral[300] : colors.charcoal[600],
      monthTextColor: themeConfig.dark ? colors.neutral[100] : colors.charcoal[800],
      textDayFontFamily: 'System',
      textMonthFontFamily: 'System',
      textDayHeaderFontFamily: 'System',
    };

    return (
        <Calendar
          // 基础属性
          current={current}
          initialDate={initialDate}
          minDate={minDate}
          maxDate={maxDate}
          allowSelectionOutOfRange={allowSelectionOutOfRange}
          markedDates={markedDates}
          hideExtraDays={hideExtraDays}
          showSixWeeks={showSixWeeks}
          disableMonthChange={disableMonthChange}
          enableSwipeMonths={enableSwipeMonths}
          disabledByDefault={disabledByDefault}
          disabledByWeekDays={disabledByWeekDays}
          
          // 样式属性
          style={style ? [defaultStyle, style] : defaultStyle}
          headerStyle={headerStyle ? [defaultHeaderStyle, headerStyle] : defaultHeaderStyle}
          theme={theme ? { ...defaultTheme, ...theme } : defaultTheme}
          customHeader={customHeader}
          
          // 自定义日期组件
          dayComponent={DayComponentWithProps}
          
          // 事件回调
          onDayPress={onDayPress}
          onDayLongPress={onDayLongPress}
          onMonthChange={onMonthChange}
          onVisibleMonthsChange={onVisibleMonthsChange}
          
          // 其他
          testID={testID}
        />
    );
};