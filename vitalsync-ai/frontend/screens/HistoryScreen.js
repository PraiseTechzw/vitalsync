import React, { useContext, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { AppContext } from '../App';
import { COLORS } from '../app/theme';
import { loadHistory } from '../app/storage';
import GlassCard from '../components/GlassCard';
import RiskBadge from '../components/RiskBadge';

export default function HistoryScreen() {
  const { t } = useContext(AppContext);
  const [items, setItems] = useState([]);

  useEffect(() => {
    let mounted = true;
    loadHistory().then((data) => {
      if (mounted) setItems(data);
    });
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <LinearGradient colors={[COLORS.bgTop, COLORS.bgBottom]} style={styles.root}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>{t('history')}</Text>

        {!items.length ? (
          <GlassCard>
            <Text style={styles.empty}>{t('noHistory')}</Text>
          </GlassCard>
        ) : (
          items.map((item, idx) => (
            <GlassCard key={`${item.date}-${idx}`}>
              <Text style={styles.date}>{new Date(item.date).toLocaleString()}</Text>
              <Text style={styles.symptoms}>{item.symptoms}</Text>
              <View style={{ marginTop: 10 }}>
                <RiskBadge level={item.risk_level} />
              </View>
            </GlassCard>
          ))
        )}
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: {
    paddingTop: 58,
    paddingHorizontal: 18,
    paddingBottom: 28,
  },
  title: {
    color: COLORS.text,
    fontSize: 26,
    fontWeight: '800',
    marginBottom: 12,
  },
  empty: {
    color: COLORS.textSoft,
    fontSize: 16,
  },
  date: {
    color: COLORS.textSoft,
    fontSize: 13,
    marginBottom: 6,
  },
  symptoms: {
    color: COLORS.text,
    fontSize: 15,
    lineHeight: 22,
  },
});
