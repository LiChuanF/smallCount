import { CURRENCIES } from '@/constants/data';
import { useTheme } from '@/context/ThemeContext';
import { Account } from '@/db/repositories/AccountRepository';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { FlatList, Modal, Pressable, Text, useColorScheme, View } from 'react-native';
import { SafeAreaView } from "react-native-safe-area-context";

interface AccountSelectModalProps {
  visible: boolean;
  onClose?: () => void;
  onSelect?: (account: Account) => void;
  selectedId?: string; // 当前选中的账户ID
  data?: Account[]; // 账户数据
  // 新增多选相关属性
  enableMultipleSelection?: boolean; // 是否启用多选模式
  selectedIds?: string[]; // 当前选中的账户ID数组（多选模式）
  onMultipleSelect?: (accounts: Account[]) => void; // 多选确认回调
  confirmButtonText?: string; // 确认按钮文字
  maxSelection?: number; // 最大选择数量
}

const AccountSelectModal: React.FC<AccountSelectModalProps> = ({
  visible,
  onClose,
  onSelect,
  selectedId,
  data = [],
  // 多选相关属性
  enableMultipleSelection = false,
  selectedIds = [],
  onMultipleSelect,
  confirmButtonText = "确认",
  maxSelection
}) => {
  const {
    theme
  } = useTheme()
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  // 多选状态管理
  const [multipleSelectedIds, setMultipleSelectedIds] = useState<string[]>(selectedIds);

  // 获取账户类型对应的图标
  const getAccountIcon = (type: string): keyof typeof Ionicons.glyphMap => {
    switch (type) {
      case 'cash':
        return 'cash-outline' as keyof typeof Ionicons.glyphMap;
      case 'bank':
        return 'business-outline' as keyof typeof Ionicons.glyphMap;
      case 'credit_card':
        return 'card-outline' as keyof typeof Ionicons.glyphMap;
      case 'digital_wallet':
        return 'phone-portrait-outline' as keyof typeof Ionicons.glyphMap;
      case 'investment':
        return 'trending-up-outline' as keyof typeof Ionicons.glyphMap;
      case 'loan':
        return 'loan-outline' as keyof typeof Ionicons.glyphMap;
      default:
        return 'wallet-outline' as keyof typeof Ionicons.glyphMap;
    }
  };

  // 渲染单个列表项
  const renderItem = ({ item }: { item: Account }) => {
    // 单选模式：检查单个选中项
    const isSelected = !enableMultipleSelection ? selectedId === item.id : multipleSelectedIds.includes(item.id);
    
    // 选中时文字用 primary，未选中跟随主题
    const textColorClass = isSelected
      ? 'text-primary font-bold'
      : 'text-cardForeground dark:text-cardForeground-dark font-medium';

    return (
      <Pressable
        onPress={() => {
          if (enableMultipleSelection) {
            // 多选模式：切换选中状态
            let newSelectedIds: string[];
            
            if (multipleSelectedIds.includes(item.id)) {
              // 如果已选中，则取消选中
              newSelectedIds = multipleSelectedIds.filter(id => id !== item.id);
            } else {
              // 如果未选中，则添加选中
              // 检查是否超过最大选择数量
              if (maxSelection && multipleSelectedIds.length >= maxSelection) {
                return; // 超过最大选择数量，不执行任何操作
              }
              newSelectedIds = [...multipleSelectedIds, item.id];
            }
            
            setMultipleSelectedIds(newSelectedIds);
          } else {
            // 单选模式：直接调用回调并关闭弹窗
            onSelect?.(item);
            onClose?.();  
          }
        }}
        className={`
          flex-row items-center justify-between p-4 rounded-xl mb-2
          active:bg-gray-100 dark:active:bg-slate-700
          ${isSelected ? 'bg-blue-50 dark:bg-slate-700/60' : ''}
        `}
      >
        <View className="flex-row items-center flex-1 mr-4">
          {/* 图标容器：增加背景色让图标更突出 */}
          <View className={`
            w-10 h-10 rounded-full items-center justify-center mr-4 
            ${isSelected ? 'bg-blue-100 dark:bg-slate-600' : 'bg-gray-100 dark:bg-slate-700'}
          `}>
            <Ionicons 
              name={getAccountIcon(item.type)} 
              size={22} 
              color={theme.colors.primary} 
            />
          </View>
          
          {/* 账户信息 */}
          <View className="flex-1">
            {/* 账户名称 */}
            <Text className={`text-base text-text ${textColorClass}`}>
              {item.name}
            </Text>
            {/* 账户类型和余额 */}
            <View className="flex-row justify-between items-center mt-1">
              <Text className="text-sm font-medium text-gray-700 dark:text-gray-300">
                总资产：{item?.currency && CURRENCIES[item.currency as keyof typeof CURRENCIES]?.char || '￥'}{item.balance || '0.00'}
              </Text>
            </View>
          </View>
        </View>

        {/* 选中状态显示 */}
        {isSelected && (
          enableMultipleSelection ? (
            // 多选模式：显示复选框
            <Ionicons name="checkbox" size={22} color={theme.colors.primary} />
          ) : (
            // 单选模式：显示圆圈选中
            <Ionicons name="checkmark-circle" size={22} color={theme.colors.primary} />
          )
        )}
      </Pressable>
    );
  };

  // 处理多选确认
  const handleConfirm = () => {
    if (enableMultipleSelection && onMultipleSelect) {
      const selectedAccounts = data.filter(account => multipleSelectedIds.includes(account.id));
      onMultipleSelect(selectedAccounts);
    }
    onClose?.();  
  };

  // 重置多选状态
  React.useEffect(() => {
    if (visible) {
      setMultipleSelectedIds(selectedIds);
    }
  }, [visible, selectedIds]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide" // 从底部滑入
      onRequestClose={onClose}
    >
      {/* 背景遮罩 */}
      <View className="flex-1 justify-end bg-black/50">
        <Pressable className="flex-1" onPress={onClose} />
        
        {/* 内容区域 */}
        <View className="bg-card dark:bg-card-dark w-full rounded-t-3xl shadow-2xl h-[65%]" style={{
            backgroundColor: theme.colors.card
        }}>
          
          {/* 顶部把手区域 */}
          <View className="items-center pt-3 pb-2">
            <View className="w-12 h-1.5 bg-gray-300 dark:bg-gray-600 rounded-full mb-4 opacity-80" />
            
            <View className="w-full flex-row justify-between items-center px-5 border-b border-gray-100 dark:border-slate-700 pb-3">
              <Text className="text-lg font-bold text-gray-800 dark:text-gray-100">
                {enableMultipleSelection ? '选择账户' : '选择账户'}
              </Text>
              <Pressable onPress={onClose} hitSlop={10}>
                <Ionicons name="close" size={24} color={isDark ? '#9ca3af' : '#6b7280'} />
              </Pressable>
            </View>
          </View>

          {/* 列表区域 */}
          {data.length > 0 ? (
            <FlatList
              data={data}
              keyExtractor={(item) => item.id}
              renderItem={renderItem}
              contentContainerStyle={{ padding: 20, paddingBottom: enableMultipleSelection ? 120 : 40 }}
              showsVerticalScrollIndicator={false}
            />
          ) : (
            <View className="flex-1 justify-center items-center">
              <Ionicons name="wallet-outline" size={48} color={theme.colors.border} />
              <Text className="text-lg text-text mt-4">
                暂无账户
              </Text>
              <Text className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                请先添加账户
              </Text>
            </View>
          )}
          
          {/* 多选模式底部按钮区域 */}
          {enableMultipleSelection && (
            <View className="absolute bottom-0 left-0 right-0 px-5 py-3 border-t border-gray-100 dark:border-slate-700 bg-card dark:bg-card-dark" style={{
              backgroundColor: theme.colors.card
            }}>
              <View className="flex-row justify-between items-center mb-3">
                <Text className="text-sm text-gray-500 dark:text-gray-400">
                  已选择 {multipleSelectedIds.length} 项
                  {maxSelection && ` (最多${maxSelection}项)`}
                </Text>
                {multipleSelectedIds.length > 0 && (
                  <Pressable 
                    onPress={() => setMultipleSelectedIds([])}
                  >
                    <Text className="text-sm text-primary">清空</Text>
                  </Pressable>
                )}
              </View>
              
              <Pressable
                className={`py-3 rounded-xl items-center justify-center ${
                  multipleSelectedIds.length > 0 
                    ? 'bg-primary' 
                    : 'bg-gray-300 dark:bg-gray-700'
                }`}
                onPress={handleConfirm}
                disabled={multipleSelectedIds.length === 0}
              >
                <Text className={`font-medium ${
                  multipleSelectedIds.length > 0 
                    ? 'text-white' 
                    : 'text-gray-500 dark:text-gray-400'
                }`}>
                  {confirmButtonText}
                </Text>
              </Pressable>
            </View>
          )}
        </View>
        
        {/* 底部安全区填充 */}
        <SafeAreaView className="bg-card dark:bg-card-dark" style={{
          backgroundColor: theme.colors.card
        }} />
      </View>
    </Modal>
  );
};

export default AccountSelectModal;