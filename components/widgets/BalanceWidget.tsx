import { Text, View } from 'react-native';

interface BalanceWidgetProps {
  balance: number;
  income: number;
  expense: number;
}

export default function BalanceWidget({ balance, income, expense }: BalanceWidgetProps) {
  return (
    <View className="bg-primary-600 rounded-2xl p-5 my-4">
      <View className="items-center mb-5">
        <Text className="text-base text-white dark:text-gray-100 opacity-80 mb-2">本月余额</Text>
        <Text className="text-[32px] font-bold text-white dark:text-gray-100">¥{balance.toFixed(2)}</Text>
      </View>
      <View className="flex-row justify-around">
        <View className="items-center flex-1">
          <Text className="text-sm text-white dark:text-gray-100 opacity-80 mb-1">本月收入</Text>
          <Text className="text-base font-semibold text-success-500">+¥{income.toFixed(2)}</Text>
        </View>
        <View className="w-px bg-white dark:bg-gray-300 opacity-30 mx-4" />
        <View className="items-center flex-1">
          <Text className="text-sm text-white dark:text-gray-100 opacity-80 mb-1">本月支出</Text>
          <Text className="text-base font-semibold text-danger-500">-¥{expense.toFixed(2)}</Text>
        </View>
      </View>
    </View>
  );
}