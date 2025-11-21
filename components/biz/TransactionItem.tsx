import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface TransactionItemProps {
  title: string;
  amount: number;
  category: string;
  date: string;
  type: 'income' | 'expense';
}

export default function TransactionItem({ 
  title, 
  amount, 
  category, 
  date, 
  type 
}: TransactionItemProps) {
  return (
    <View style={styles.container}>
      <View style={styles.left}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.category}>{category}</Text>
        <Text style={styles.date}>{date}</Text>
      </View>
      <Text style={[styles.amount, styles[type]]}>
        {type === 'income' ? '+' : '-'}¥{Math.abs(amount).toFixed(2)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  left: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  category: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 2,
  },
  date: {
    fontSize: 12,
    color: '#C7C7CC',
  },
  amount: {
    fontSize: 16,
    fontWeight: '600',
  },
  income: {
    color: '#34C759',
  },
  expense: {
    color: '#FF3B30',
  },
});