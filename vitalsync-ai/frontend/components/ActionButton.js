import React from 'react';
import { Pressable, Text, StyleSheet } from 'react-native';
import { COLORS } from '../app/theme';

export default function ActionButton({ label, onPress, type = 'primary', disabled = false, style }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.btn,
        type === 'ghost' ? styles.ghost : styles.primary,
        pressed && !disabled ? styles.pressed : null,
        disabled ? styles.disabled : null,
        style,
      ]}
    >
      <Text style={type === 'ghost' ? styles.ghostText : styles.primaryText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 6,
  },
  primary: {
    backgroundColor: COLORS.primary,
  },
  ghost: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  primaryText: {
    color: '#061426',
    fontWeight: '700',
    fontSize: 16,
  },
  ghostText: {
    color: COLORS.text,
    fontWeight: '600',
    fontSize: 16,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.99 }],
  },
  disabled: {
    opacity: 0.5,
  },
});
