import React, { useContext, useState } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { AppContext } from '../App';
import { COLORS } from '../app/theme';
import ActionButton from '../components/ActionButton';
import GlassCard from '../components/GlassCard';

const PRESET = ['fever', 'cough', 'chest pain', 'headache'];

export default function SymptomInputScreen({ navigation }) {
  const { t } = useContext(AppContext);
  const [text, setText] = useState('');
  const [selected, setSelected] = useState([]);

  const toggleSymptom = (item) => {
    setSelected((prev) => (prev.includes(item) ? prev.filter((x) => x !== item) : [...prev, item]));
  };

  const mockVoiceInput = () => {
    const voiceText = 'I have fever and cough for two days';
    setText((prev) => (prev ? `${prev}. ${voiceText}` : voiceText));
  };

  const onContinue = () => {
    const summary = [text.trim(), ...selected].filter(Boolean).join(', ');
    if (!summary) return;

    navigation.navigate('TriageChat', {
      symptomSummary: summary,
    });
  };

  return (
    <LinearGradient colors={[COLORS.bgTop, COLORS.bgBottom]} style={styles.root}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>{t('symptomInputTitle')}</Text>

        <GlassCard>
          <Text style={styles.label}>Text Input</Text>
          <TextInput
            placeholder={t('symptomPlaceholder')}
            placeholderTextColor="#AFC4DD"
            multiline
            value={text}
            onChangeText={setText}
            style={styles.input}
          />

          <ActionButton label={t('useVoice')} type="ghost" onPress={mockVoiceInput} />
          <Text style={styles.hint}>{t('voiceMocked')}</Text>
        </GlassCard>

        <GlassCard>
          <Text style={styles.label}>Symptom Selector</Text>
          <View style={styles.selectorWrap}>
            {PRESET.map((symptom) => {
              const active = selected.includes(symptom);
              return (
                <Pressable
                  key={symptom}
                  onPress={() => toggleSymptom(symptom)}
                  style={[styles.tag, active && styles.tagActive]}
                >
                  <Text style={styles.tagText}>{symptom}</Text>
                </Pressable>
              );
            })}
          </View>
        </GlassCard>

        <ActionButton label={t('continue')} onPress={onContinue} />
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: {
    paddingTop: 60,
    paddingHorizontal: 18,
    paddingBottom: 32,
  },
  title: {
    color: COLORS.text,
    fontSize: 26,
    fontWeight: '800',
    marginBottom: 12,
  },
  label: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
  },
  input: {
    minHeight: 110,
    color: COLORS.text,
    fontSize: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
  },
  hint: {
    color: COLORS.textSoft,
    fontSize: 13,
  },
  selectorWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  tag: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 999,
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: 'rgba(255,255,255,0.07)',
  },
  tagActive: {
    backgroundColor: 'rgba(125,226,209,0.28)',
    borderColor: '#7DE2D1',
  },
  tagText: {
    color: COLORS.text,
    fontWeight: '600',
  },
});
