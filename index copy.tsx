// import CalendarWidget from "@/components/widgets/CalendarWidget";
import { useRouter } from "expo-router";
import {
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
// 组件导入
import TransactionItem from "@/components/biz/TransactionItem";
import Card from "@/components/ui/Card";
import BalanceWidget from "@/components/widgets/BalanceWidget";
import { useShadowStyle } from "@/hooks/use-shadow";
import { useThemeConfig } from "@/hooks/use-theme-config";
import DateTimePicker from '@react-native-community/datetimepicker';
import { useState } from "react";

// 模拟数据
const mockTransactions = [
  {
    id: "1",
    amount: 128.5,
    description: "午餐",
    type: "expense" as const,
    category: "餐饮",
    date: "2024-01-15",
    icon: "🍔",
    color: "#FF9500",
  },
  {
    id: "2",
    amount: 5000.0,
    description: "工资",
    type: "income" as const,
    category: "工资收入",
    date: "2024-01-15",
    icon: "💰",
    color: "#34C759",
  },
  {
    id: "3",
    amount: 89.9,
    description: "超市购物",
    type: "expense" as const,
    category: "日用品",
    date: "2024-01-14",
    icon: "🛒",
    color: "#5AC8FA",
  },
];

// 根据时间获取问候语
const getGreeting = (): string => {
  const hour = new Date().getHours();

  if (hour >= 5 && hour < 9) {
    return "早上好";
  } else if (hour >= 9 && hour < 12) {
    return "上午好";
  } else if (hour >= 12 && hour < 14) {
    return "中午好";
  } else if (hour >= 14 && hour < 18) {
    return "下午好";
  } else if (hour >= 18 && hour < 22) {
    return "晚上好";
  } else {
    return "夜深了";
  }
};

export default function HomeScreen() {
  const theme = useThemeConfig();
  const shadowStyle = useShadowStyle(theme.dark, "large");
  const router = useRouter();

  // 日期选择器状态
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  // 获取当前日期和问候语
  const currentYear = selectedDate.getFullYear();
  const greeting = getGreeting();
  const formatDate = selectedDate.toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "long",
  });

  // 日期选择器变化处理
  const onDateChange = (event: any) => {
    setShowDatePicker(false);
    setSelectedDate(new Date(event.nativeEvent.timestamp));
  };

  // 显示日期选择器
  const showDatepicker = () => {
    setShowDatePicker(true);
  };

  const handleAddTransaction = (type: "income" | "expense") => {
    // navigation.navigate(Routes.ADD_TRANSACTION, { type });
    // 暂时注释，因为还没有创建添加交易页面
    console.log("添加交易:", type);
  };

  const handleViewAllTransactions = () => {
    // navigation.navigate(Routes.TRANSACTIONS as any);
    // 暂时注释，因为还没有创建交易列表页面
  };

  const handleNavigateToStats = () => {
    router.push("/stats");
  };

  const handleNavigateToLedgers = () => {
    router.push("/ledgers");
  };



  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-black">
      <StatusBar barStyle="dark-content" />
      {/* 头部 */}
      <View
        style={shadowStyle.shadow}
        className="shadow-lg flex-row justify-between items-center px-6 py-4 bg-primary-700 dark:bg-charcoal-950"
      >
        <View className="flex-1">
          <Text className="text-2xl font-bold text-white dark:text-charcoal-100 mb-2">
            {greeting}
          </Text>
          <Text className="text-xl font-bold text-primary-100 dark:text-primary-200">
            欢迎使用 YB COUNT
          </Text>
        </View>
        <View className="items-end flex-col items-center">
          <Text className="text-lg font-bold text-white dark:text-charcoal-100">
            {currentYear}
          </Text>
          <TouchableOpacity onPress={showDatepicker} className="mt-0.5">
            <Text className="text-md font-bold text-white dark:text-charcoal-100 underline">
              {formatDate}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView className="flex-1 px-3" showsVerticalScrollIndicator={false}>

        {/* 余额组件 */}
        <BalanceWidget balance={12580.5} income={5000.0} expense={218.4} />


        {/* 日历组件 - 传入测试数据 */}
        {/* <Card className="mb-4">
          <CalendarWidget
          transactionsData={{
            '2025-11-12': { expense: 120.50, income: 0 },
            '2025-11-13': { expense: 0, income: 500.00 },
            '2025-11-14': { expense: 85.30, income: 200.00 },
            '2025-11-15': { expense: 256.80, income: 0 },
            '2025-11-16': { expense: 0, income: 0 },
            '2025-11-17': { expense: 45.60, income: 1000.00 },
            '2025-11-18': { expense: 178.90, income: 0 },
            '2025-11-19': { expense: 0, income: 300.50 },
            '2025-11-20': { expense: 92.40, income: 0 },
            '2025-11-21': { expense: 0, income: 0 },
            '2025-11-22': { expense: 167.80, income: 800.00 },
            '2025-11-23': { expense: 34.20, income: 0 },
            '2025-11-24': { expense: 0, income: 150.00 },
            '2025-11-25': { expense: 289.60, income: 0 },
            '2025-11-26': { expense: 0, income: 0 },
            '2025-11-27': { expense: 123.45, income: 600.00 },
            '2025-11-28': { expense: 67.80, income: 0 },
            '2025-11-29': { expense: 0, income: 0 },
            '2025-03-30': { expense: 198.70, income: 1200.00 },
            '2025-03-31': { expense: 76.30, income: 0 },
          }}
          onDayPress={(date) => {
            // console.log('选中日期:', date);
          }}
          onMonthChange={(date) => {
            // console.log('月份变化:', date);
          }}
          style={{
            borderRadius: 12,
            marginBottom: 16,
          }}
        />

        <View>
          
        </View>
        </Card> */}

        {/* 最近交易 */}
        <Card>
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-lg font-semibold text-charcoal-900 dark:text-charcoal-100">
              最近交易
            </Text>
            <TouchableOpacity onPress={handleViewAllTransactions}>
              <Text className="text-sm text-primary-400 dark:text-primary-200 font-medium">
                查看全部
              </Text>
            </TouchableOpacity>
          </View>

          <View className="gap-2">
            {mockTransactions.map((transaction) => (
              <TransactionItem
                key={transaction.id}
                title={transaction.description}
                amount={transaction.amount}
                type={transaction.type}
                category={transaction.category}
                date={transaction.date}
              />
            ))}
          </View>
        </Card>

        {/* 底部间距 */}
        <View className="h-8" />
      </ScrollView>

      {/* 日期选择器 */}
      {showDatePicker && (
        <DateTimePicker
          testID="dateTimePicker"
          value={selectedDate}
          mode="date"
          onChange={onDateChange}
          design="material"
        />
      )}
    </SafeAreaView>
  );
}
