import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface CategorySelectorProps {
  // 保留接口兼容性，但不再需要实际使用这些参数
  categories?: any[];
  selectedCategory?: string;
  onSelectCategory?: (categoryId: string) => void;
}

// 注意：此组件已被标记为废弃，因为分类功能已被移除
// 系统现在使用标签系统代替分类
export default function CategorySelector({}: CategorySelectorProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>分类功能已移除</Text>
      <Text style={styles.description}>系统已改用标签系统，您可以在添加交易时直接添加标签。</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
    padding: 16,
    backgroundColor: '#F5F5F7',
    borderRadius: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#1C1C1E',
  },
  description: {
    fontSize: 14,
    color: '#8E8E93',
    lineHeight: 20,
  },
});