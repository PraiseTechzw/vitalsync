import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../app/theme';

function getColor(level) {
  const normalized = String(level || '').toLowerCase();
  if (normalized.includes('high') || normalized.includes('phezulu') || normalized.includes('yakakwirira')) return COLORS.riskHigh;
  if (normalized.includes('moderate') || normalized.includes('pakati') || normalized.includes('maphakathi')) return COLORS.riskModerate;
  return COLORS.riskLow;
}

export default function RiskBadge({ level }) {
  const bg = getColor(level);
  return (
    <View style={[styles.badge, { backgroundColor: bg }]}> 
      <Text style={styles.text}>{level}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  text: {
    color: '#0C1118',
    fontWeight: '800',
    fontSize: 14,
  },
});
