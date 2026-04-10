import React, { useContext } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { AppContext } from '../App';
import { COLORS } from '../app/theme';
import ActionButton from '../components/ActionButton';
import GlassCard from '../components/GlassCard';

export default function HomeScreen({ navigation }) {
  const { t, language, setLanguage } = useContext(AppContext);

  const nextLanguage = () => {
    const order = ['en', 'sn', 'nd'];
    const next = order[(order.indexOf(language) + 1) % order.length];
    setLanguage(next);
  };

  return (
    <LinearGradient colors={[COLORS.bgTop, COLORS.bgBottom]} style={styles.root}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.topRow}>
          <Text style={styles.title}>{t('appTitle')}</Text>
          <Pressable onPress={nextLanguage} style={styles.langBtn}>
            <Text style={styles.langText}>{language.toUpperCase()}</Text>
          </Pressable>
        </View>

        <Text style={styles.subtitle}>{t('homeTagline')}</Text>

        <GlassCard style={styles.heroCard}>
          <Text style={styles.heroTitle}>AI Triage Decision Support</Text>
          <Text style={styles.heroSub}>Simple, multilingual, and built for quick care decisions.</Text>
          <ActionButton
            label={t('startHealthCheck')}
            onPress={() => navigation.navigate('SymptomInput')}
          />
        </GlassCard>

        <Text style={styles.sectionTitle}>Quick Actions</Text>

        <View style={styles.grid}>
          <Pressable style={styles.quickBtn} onPress={() => navigation.navigate('SymptomInput')}>
            <Text style={styles.quickIcon}>🩺</Text>
            <Text style={styles.quickLabel}>{t('symptomCheck')}</Text>
          </Pressable>

          <Pressable style={styles.quickBtn} onPress={() => navigation.navigate('HeartRate')}>
            <Text style={styles.quickIcon}>❤️</Text>
            <Text style={styles.quickLabel}>{t('heartRateScan')}</Text>
          </Pressable>

          <Pressable style={styles.quickBtn} onPress={() => navigation.navigate('History')}>
            <Text style={styles.quickIcon}>🕒</Text>
            <Text style={styles.quickLabel}>{t('history')}</Text>
          </Pressable>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: {
    paddingTop: 68,
    paddingHorizontal: 18,
    paddingBottom: 30,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    color: COLORS.text,
    fontSize: 32,
    fontWeight: '800',
  },
  subtitle: {
    marginTop: 6,
    marginBottom: 18,
    color: COLORS.textSoft,
    fontSize: 16,
  },
  langBtn: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  langText: {
    color: COLORS.text,
    fontWeight: '700',
  },
  heroCard: {
    marginBottom: 20,
  },
  heroTitle: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 6,
  },
  heroSub: {
    color: COLORS.textSoft,
    marginBottom: 10,
  },
  sectionTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 10,
  },
  grid: {
    gap: 10,
  },
  quickBtn: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 18,
    paddingVertical: 16,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },
  quickIcon: {
    fontSize: 22,
    marginRight: 10,
  },
  quickLabel: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '600',
  },
});
