import AccountSelectModal from "@/components/ui/AddTransaction/AccountSelectModal";
import CategoryManageModal from "@/components/ui/AddTransaction/CategoryManageModal";
import PaymentMethodModal from "@/components/ui/AddTransaction/PaymentMethodModal";
import MonthPickerModal from "@/components/widgets/MonthSelect";
import { useTheme } from "@/context/ThemeContext";
import { Account } from "@/db/repositories/AccountRepository";
import { PaymentMethod } from "@/db/repositories/PaymentMethodRepository";
import { NewTag } from "@/db/repositories/TagRepository";
import useDataStore from "@/storage/store/useDataStore";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type SettingItemProps = {
  icon?: keyof typeof MaterialIcons.glyphMap;
  label: string;
  value?: string;
  onPress?: () => void;
  showArrow?: boolean;
  trailing?: React.ReactNode;
};

function SettingItem({
  icon,
  label,
  value,
  onPress,
  showArrow = true,
  trailing,
}: SettingItemProps) {
    const { theme } = useTheme();
  return (
    <Pressable
      className="flex-row items-center justify-between py-4 px-4 active:bg-gray-50 dark:active:bg-neutral-800 transition-colors"
      android_ripple={{ color: "#e5e5ea" }}
      onPress={() => {
        if (onPress) {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onPress();
        }
      }}
    >
      <View className="flex-row items-center flex-1">
        {icon ? (
          <View className="w-8 h-8 rounded-lg items-center justify-center mr-3 bg-gray-100 dark:bg-neutral-800">
            <MaterialIcons
              name={icon}
              size={18}
              color={theme.colors.primary}
            />
          </View>
        ) : null}
        <Text className="text-base text-neutral-900 dark:text-neutral-100 font-medium">
          {label}
        </Text>
      </View>
      <View className="flex-row items-center">
        {value ? (
          <Text className="text-sm text-gray-500 dark:text-gray-400 mr-2">
            {value}
          </Text>
        ) : null}
        {trailing}
        {showArrow && !trailing ? (
          <MaterialIcons name="chevron-right" size={20} color="#9CA3AF" />
        ) : null}
      </View>
    </Pressable>
  );
}

export default function DataExportPage() {
  const { isDarkMode } = useTheme();
  const { accounts, paymentMethods, tags } = useDataStore();
  const [dateRange, setDateRange] = useState("本月");
  const [accountSource, setAccountSource] = useState("全部账户");
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [selectedTags, setSelectedTags] = useState<NewTag[]>([]);
  const [exportFormat, setExportFormat] = useState("Excel 表格 (.xlsx)");
  
  // 新增：MonthSelect组件相关状态
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [startYear, setStartYear] = useState(new Date().getFullYear());
  const [startMonth, setStartMonth] = useState(new Date().getMonth() + 1);
  const [endYear, setEndYear] = useState(new Date().getFullYear());
  const [endMonth, setEndMonth] = useState(new Date().getMonth() + 1);
  
  // 新增：AccountSelectModal组件相关状态
  const [showAccountPicker, setShowAccountPicker] = useState(false);
  const [selectedAccounts, setSelectedAccounts] = useState<Account[]>([]);
  
  // 新增：PaymentMethodModal组件相关状态
  const [showPaymentPicker, setShowPaymentPicker] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod | null>(null);
  const [selectedPaymentMethods, setSelectedPaymentMethods] = useState<PaymentMethod[]>([]);
  
  // 新增：CategoryManageModal组件相关状态
  const [showTagPicker, setShowTagPicker] = useState(false);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);

  const handleExport = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    // 这里实现导出逻辑
    console.log("导出数据", {
      dateRange,
      accountSource,
      selectedAccount,
      selectedTags,
      exportFormat,
      startYear,
      startMonth,
      endYear,
      endMonth,
      selectedAccounts,
      selectedPaymentMethod,
      selectedPaymentMethods,
      selectedTagIds,
    });
  };
  
  
  // 格式化日期范围显示
  const formatDateRange = (startYear: number, startMonth: number, endYear: number, endMonth: number) => {
    if (startYear === endYear && startMonth === endMonth) {
      return `${startYear}年${startMonth}月`;
    }
    return `${startYear}-${startMonth.toString().padStart(2, '0')} 至 ${endYear}-${endMonth.toString().padStart(2, '0')}`;
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50 dark:bg-neutral-950">
      <View className="flex-1">
        {/* Header */}
        <View className="flex-row items-center px-6 py-4 border-b border-border">
          <Pressable onPress={() => router.back()}>
            <MaterialIcons name="arrow-back" size={24} color="#6B7280" />
          </Pressable>
          <Text className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 ml-4">
            导出选项
          </Text>
        </View>

        <View className="flex-1">
          <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
            {/* Title Section */}
            <View className="px-6 pt-6 pb-4">
              <Text className="text-3xl font-bold text-neutral-900 dark:text-white mb-2">
                导出数据
              </Text>
              <Text className="text-sm text-gray-500 dark:text-gray-400">
                筛选并导出你的记账记录到本地文件。
              </Text>
            </View>

            {/* Filter Section */}
            <View className="px-6 pb-6">
              <Text className="text-sm font-bold text-gray-500 dark:text-gray-400 mb-3 uppercase tracking-wide">
                筛选条件
              </Text>
              
              <View className="bg-card rounded-2xl overflow-hidden border border-border">
                {/* Date Range */}
                <SettingItem
                  icon="event"
                  label="日期范围"
                  value={dateRange}
                  onPress={() => {
                    setShowMonthPicker(true);
                  }}
                />

                {/* Account Source */}
                <SettingItem
                  icon="account-balance-wallet"
                  label="账户来源"
                  value={selectedAccounts.length > 0 ? `已选 ${selectedAccounts.length} 项` : accountSource}
                  onPress={() => {
                    setShowAccountPicker(true);
                  }}
                />

                {/* Tags */}
                <SettingItem
                  icon="local-offer"
                  label="消费标签"
                  value={selectedTags.length > 0 ? `已选 ${selectedTags.length} 个` : "不限"}
                  onPress={() => {
                    setShowTagPicker(true);
                  }}
                />

                {/* Payment Method */}
                <SettingItem
                  icon="apps"
                  label="支付方式"
                  value={selectedPaymentMethods.length > 0 ? `已选 ${selectedPaymentMethods.length} 项` : '不限'}
                  onPress={() => {
                    setShowPaymentPicker(true);
                  }}
                />
              </View>
            </View>

            {/* File Format Section */}
            <View className="px-6 pb-6">
              <Text className="text-sm font-bold text-gray-500 dark:text-gray-400 mb-3 uppercase tracking-wide">
                文件格式
              </Text>
              
              <View className="bg-card rounded-2xl overflow-hidden border border-border">
                <SettingItem
                  icon="description"
                  label="Excel 表格 (.xlsx)"
                  trailing={
                    <View className="w-5 h-5 rounded-full bg-primary items-center justify-center">
                      <MaterialIcons name="check" size={14} color="white" />
                    </View>
                  }
                  onPress={() => {
                    // 这里可以添加格式选择逻辑
                    console.log("选择文件格式");
                  }}
                />
              </View>
            </View>

            {/* 添加底部占位，避免内容被固定底部遮挡 */}
            <View className="h-24" />
          </ScrollView>
        </View>

        {/* 固定在底部的导出按钮区域 */}
        <View className="px-6 py-4 bg-card bg-card border-t border-border">
          <Pressable
            className="bg-primary rounded-2xl py-4 items-center justify-center shadow-sm flex-row"
            onPress={handleExport}
          >
            <MaterialIcons name="download" size={20} color="white" style={{ marginRight: 8 }} />
            <Text className="text-white font-semibold text-base">
              确认导出
            </Text>
          </Pressable>
        </View>
      </View>
      
      {/* MonthPicker Modal */}
      <MonthPickerModal
        visible={showMonthPicker}
        onClose={() => setShowMonthPicker(false)}
        enableRangeSelection={true}
        initialStartYear={startYear}
        initialStartMonth={startMonth}
        initialEndYear={endYear}
        initialEndMonth={endMonth}
        onRangeConfirm={(startYear, startMonth, endYear, endMonth) => {
          setStartYear(startYear);
          setStartMonth(startMonth);
          setEndYear(endYear);
          setEndMonth(endMonth);
          setDateRange(formatDateRange(startYear, startMonth, endYear, endMonth));
          setShowMonthPicker(false);
        }}
      />
      
      {/* AccountSelect Modal */}
      <AccountSelectModal
        visible={showAccountPicker}
        onClose={() => setShowAccountPicker(false)}
        enableMultipleSelection={true}
        selectedIds={selectedAccounts.map(account => account.id)}
        onMultipleSelect={(accounts) => {
          setSelectedAccounts(accounts);
          setShowAccountPicker(false);
        }}
        data={accounts}
        confirmButtonText="确定选择"
        maxSelection={5}
      />
      
      {/* PaymentMethod Modal */}
      <PaymentMethodModal
        visible={showPaymentPicker}
        onClose={() => setShowPaymentPicker(false)}
        enableMultipleSelection={true}
        selectedIds={selectedPaymentMethods.map(method => method.id)}
        onMultipleSelect={(methods) => {
          setSelectedPaymentMethods(methods);
          setShowPaymentPicker(false);
        }}
        data={paymentMethods}
        confirmButtonText="确定选择"
      />
      
      {/* CategoryManage Modal */}
      <CategoryManageModal
        visible={showTagPicker}
        onClose={() => setShowTagPicker(false)}
        categories={tags}
        currentType="expense"
        onUpdateCategories={() => {}} // 在选择模式下不需要更新分类
        enableSelection={true}
        selectionMode="multiple"
        selectedIds={selectedTagIds}
        onSelectionChange={(tagIds) => {
          setSelectedTagIds(tagIds);
          // 根据选中的ID获取完整的标签对象
          const selectedTagObjects = tags.filter(tag => tagIds.includes(tag.id));
          setSelectedTags(selectedTagObjects);
        }}
        confirmButtonText="确定"
        showEditButtons={false}
      />
    </SafeAreaView>
  );
}