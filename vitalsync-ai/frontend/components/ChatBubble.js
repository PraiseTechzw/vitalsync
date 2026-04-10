import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../app/theme';

export default function ChatBubble({ role, message }) {
  const isUser = role === 'user';
  return (
    <View style={[styles.row, isUser ? styles.userRow : styles.botRow]}>
      <View style={[styles.bubble, isUser ? styles.userBubble : styles.botBubble]}>
        <Text style={styles.text}>{message}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    marginVertical: 6,
    flexDirection: 'row',
  },
  userRow: {
    justifyContent: 'flex-end',
  },
  botRow: {
    justifyContent: 'flex-start',
  },
  bubble: {
    maxWidth: '82%',
    borderRadius: 16,
    padding: 12,
  },
  userBubble: {
    backgroundColor: 'rgba(100,181,246,0.32)',
    borderWidth: 1,
    borderColor: 'rgba(125,226,209,0.6)',
  },
  botBubble: {
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  text: {
    color: COLORS.text,
    fontSize: 15,
    lineHeight: 21,
  },
});
