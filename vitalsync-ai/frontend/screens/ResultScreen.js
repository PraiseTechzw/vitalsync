import React, { useContext, useMemo } from 'react';
import { View, Text, StyleSheet, Share, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { AppContext } from '../App';
import { COLORS } from '../app/theme';
import ActionButton from '../components/ActionButton';
import GlassCard from '../components/GlassCard';
import RiskBadge from '../components/RiskBadge';
import { addHistoryItem } from '../app/storage';

function actionKeyToLocalized(t, action) {
  const map = {
    'Stay home': t('stayHome'),
    'Visit pharmacy': t('visitPharmacy'),
    'Go to clinic': t('goClinic'),
    'Seek urgent care': t('urgentCare'),
  };
  return map[action] || action;
}

export default function ResultScreen({ route, navigation }) {
  const { t, language } = useContext(AppContext);
  const symptomSummary = route.params?.symptomSummary || '';
  const triage = route.params?.triage;

  const now = useMemo(() => new Date().toISOString(), []);

  const saveAndGoHistory = async () => {
    await addHistoryItem({
      date: now,
      symptoms: symptomSummary,
      risk_level: triage?.risk_level,
      recommendation: triage?.recommendation,
      language,
    });
    navigation.navigate('History');
  };

  const generateReport = async () => {
    const report = [
      'VitalSync AI Triage Report',
      `Date: ${new Date(now).toLocaleString()}`,
      `Symptoms: ${symptomSummary}`,
      `Risk: ${triage?.risk_level}`,
      `Action: ${triage?.recommendation}`,
      `Explanation: ${triage?.explanation}`,
      'This is triage support, not diagnosis.',
    ].join('\n');

    await Share.share({ message: report });
  };

  return (
    <LinearGradient colors={[COLORS.bgTop, COLORS.bgBottom]} style={styles.root}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>{t('resultTitle')}</Text>

        <GlassCard>
          <Text style={styles.label}>{t('riskLevel')}</Text>
          <RiskBadge level={triage?.risk_level || 'Moderate'} />

          <Text style={[styles.label, { marginTop: 14 }]}>{t('action')}</Text>
          <Text style={styles.actionText}>{actionKeyToLocalized(t, triage?.recommendation || '')}</Text>

          <Text style={[styles.label, { marginTop: 14 }]}>{t('explanation')}</Text>
          <Text style={styles.explanationText}>{triage?.explanation || 'No explanation available.'}</Text>
        </GlassCard>

        <ActionButton label={t('generateReport')} onPress={generateReport} />
        <ActionButton label={t('history')} type="ghost" onPress={saveAndGoHistory} />
        <ActionButton label={t('startHealthCheck')} type="ghost" onPress={() => navigation.navigate('Home')} />
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: {
    paddingTop: 58,
    paddingHorizontal: 18,
    paddingBottom: 30,
  },
  title: {
    color: COLORS.text,
    fontSize: 26,
    fontWeight: '800',
    marginBottom: 12,
  },
  label: {
    color: COLORS.textSoft,
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 8,
  },
  actionText: {
    color: COLORS.text,
    fontSize: 24,
    fontWeight: '800',
  },
  explanationText: {
    color: COLORS.text,
    fontSize: 16,
    lineHeight: 22,
  },
});
