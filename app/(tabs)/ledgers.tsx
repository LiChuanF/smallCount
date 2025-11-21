import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function LedgersPage() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>账本页面</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
});