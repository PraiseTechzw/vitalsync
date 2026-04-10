import React, { useContext, useMemo, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { AppContext } from '../App';
import { COLORS } from '../app/theme';
import ActionButton from '../components/ActionButton';
import GlassCard from '../components/GlassCard';

function mockHeartRate() {
  return Math.floor(62 + Math.random() * 48);
}

export default function HeartRateScreen({ navigation }) {
  const { t, setHeartRate } = useContext(AppContext);
  const [scanning, setScanning] = useState(false);
  const [bpm, setBpm] = useState(null);

  const pulseSize = useMemo(() => (scanning ? 160 : 140), [scanning]);

  const startScan = () => {
    setScanning(true);
    setTimeout(() => {
      const value = mockHeartRate();
      setBpm(value);
      setHeartRate(value);
      setScanning(false);
    }, 2200);
  };

  return (
    <LinearGradient colors={[COLORS.bgTop, COLORS.bgBottom]} style={styles.root}>
      <View style={styles.content}>
        <Text style={styles.title}>{t('heartRateScan')}</Text>
        <Text style={styles.sub}>Mock camera-based rPPG scan</Text>

        <GlassCard style={styles.cardCenter}>
          <View style={[styles.pulse, { width: pulseSize, height: pulseSize }]}>
            <Text style={styles.heart}>❤️</Text>
          </View>
          <Text style={styles.bpmText}>{bpm ? `${bpm} ${t('bpm')}` : '--'}</Text>
          <Text style={styles.scanText}>{scanning ? 'Scanning...' : 'Ready'}</Text>
        </GlassCard>

        <ActionButton label={bpm ? t('scanAgain') : t('startScan')} onPress={startScan} />
        <ActionButton label={t('continue')} type="ghost" onPress={() => navigation.navigate('SymptomInput')} />
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: {
    paddingTop: 58,
    paddingHorizontal: 18,
    paddingBottom: 20,
  },
  title: {
    color: COLORS.text,
    fontSize: 26,
    fontWeight: '800',
    marginBottom: 4,
  },
  sub: {
    color: COLORS.textSoft,
    marginBottom: 14,
  },
  cardCenter: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 28,
    marginBottom: 14,
  },
  pulse: {
    borderRadius: 999,
    borderWidth: 2,
    borderColor: 'rgba(125,226,209,0.8)',
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  heart: {
    fontSize: 48,
  },
  bpmText: {
    color: COLORS.text,
    fontSize: 28,
    fontWeight: '800',
  },
  scanText: {
    marginTop: 6,
    color: COLORS.textSoft,
    fontSize: 14,
  },
});
