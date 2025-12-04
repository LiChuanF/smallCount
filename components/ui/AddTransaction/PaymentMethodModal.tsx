import { PAYMENT_METHODS } from '@/constants/data';
import { useTheme } from '@/context/ThemeContext';
import { PaymentMethod } from '@/db/repositories/PaymentMethodRepository';
import { Ionicons } from '@expo/vector-icons'; // 替换为 Ionicons
import React, { useState } from 'react';
import { FlatList, Modal, Pressable, Text, useColorScheme, View } from 'react-native';
import { SafeAreaView } from "react-native-safe-area-context";


interface PaymentMethodModalProps {
  visible: boolean;
  onClose?: () => void;
  onSelect?: (method: PaymentMethod) => void;
  selectedId?: string; // 当前选中的支付方式ID
  data?: PaymentMethod[];
  // 新增多选相关属性
  enableMultipleSelection?: boolean; // 是否启用多选模式
  selectedIds?: string[]; // 当前选中的支付方式ID数组（多选模式）
  onMultipleSelect?: (methods: PaymentMethod[]) => void; // 多选确认回调
  confirmButtonText?: string; // 确认按钮文字
  maxSelection?: number; // 最大选择数量
}

const PaymentMethodModal: React.FC<PaymentMethodModalProps> = ({
  visible,
  onClose,
  onSelect,
  selectedId,
  data = PAYMENT_METHODS,
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

  // 渲染单个列表项
  const renderItem = ({ item }: { item: PaymentMethod }) => {
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
            onSelect?.(item as PaymentMethod);
            onClose?.();
          }
        }}
        className={`
          flex-row items-center justify-between p-4 rounded-xl mb-2
          active:bg-gray-100 dark:active:bg-slate-700
          ${isSelected ? 'bg-blue-50 dark:bg-slate-700/60' : ''}
        `}
      >
        <View className="flex-row items-center">
          {/* 图标容器：增加背景色让图标更突出 */}
          <View className={`
            w-10 h-10 rounded-full items-center justify-center mr-4 
            ${isSelected ? 'bg-blue-100 dark:bg-slate-600' : 'bg-gray-100 dark:bg-slate-700'}
          `}>
            <Ionicons 
              name={item.icon as any} 
              size={22} 
              color={theme.colors.primary} 
            />
          </View>
          
          {/* 支付名称 */}
          <Text className={`${textColorClass} text-base text-text`}>
            {item.name}
          </Text>
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
      const selectedMethods = data.filter(method => multipleSelectedIds.includes(method.id));
      onMultipleSelect(selectedMethods as PaymentMethod[]);
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
        <View className="bg-card dark:bg-card-dark w-full rounded-t-3xl shadow-2xl h-[55%]" style={{
            backgroundColor: theme.colors.card
        }}>
          
          {/* 顶部把手区域 */}
          <View className="items-center pt-3 pb-2">
            <View className="w-12 h-1.5 bg-gray-300 dark:bg-gray-600 rounded-full mb-4 opacity-80" />
            
            <View className="w-full flex-row justify-between items-center px-5 border-b border-gray-100 dark:border-slate-700 pb-3">
              <Text className="text-lg font-bold text-gray-800 dark:text-gray-100">
                {enableMultipleSelection ? '选择支付方式' : '选择支付方式'}
              </Text>
              <Pressable onPress={onClose} hitSlop={10}>
                <Ionicons name="close" size={24} color={isDark ? '#9ca3af' : '#6b7280'} />
              </Pressable>
            </View>
          </View>

          {/* 列表区域 */}
          <FlatList<PaymentMethod>
            data={data as PaymentMethod[]}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
            showsVerticalScrollIndicator={false}
          />
          
          {/* 多选模式底部按钮区域 */}
          {enableMultipleSelection && (
            <View className="px-5 py-3 border-t border-gray-100 dark:border-slate-700">
              <View className="flex-row justify-between items-center mb-3">
                <Text className="text-sm text-gray-500 dark:text-gray-400">
                  已选择 {multipleSelectedIds.length} 项
                  {maxSelection && ` (最多${maxSelection}项)`}
                </Text>
                {multipleSelectedIds.length > 0 && (
                  <Pressable 
                    onPress={() => setMultipleSelectedIds([])}
                    className="text-sm text-primary"
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
        <SafeAreaView className="bg-card dark:bg-card-dark" />
      </View>
    </Modal>
  );
};

export default PaymentMethodModal;