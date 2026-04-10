import React, { useContext, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { AppContext } from '../App';
import { COLORS } from '../app/theme';
import ActionButton from '../components/ActionButton';
import ChatBubble from '../components/ChatBubble';
import { analyzeTriage } from '../api/client';

const QUESTIONS = [
  'How long have you had these symptoms?',
  'Do you have shortness of breath or severe chest pain now?',
  'Are symptoms getting worse quickly?',
];

export default function TriageChatScreen({ route, navigation }) {
  const { t, language, heartRate } = useContext(AppContext);
  const symptomSummary = route.params?.symptomSummary || '';

  const initialMessages = useMemo(
    () => [
      { role: 'system', message: `I understand: ${symptomSummary}` },
      { role: 'system', message: QUESTIONS[0] },
    ],
    [symptomSummary]
  );

  const [messages, setMessages] = useState(initialMessages);
  const [step, setStep] = useState(0);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const submitAnswer = () => {
    if (!input.trim()) return;

    const nextMessages = [...messages, { role: 'user', message: input.trim() }];
    const nextStep = step + 1;

    if (nextStep < QUESTIONS.length) {
      nextMessages.push({ role: 'system', message: QUESTIONS[nextStep] });
    }

    setMessages(nextMessages);
    setInput('');
    setStep(nextStep);
  };

  const runAnalysis = async () => {
    setLoading(true);
    try {
      const chatText = messages.map((m) => `${m.role}: ${m.message}`).join(' | ');
      const response = await analyzeTriage({
        symptoms: `${symptomSummary}. ${chatText}`,
        heart_rate: heartRate,
        language,
      });

      navigation.replace('Result', {
        symptomSummary,
        triage: response.data,
      });
    } catch (error) {
      const fallback = {
        risk_level: 'Moderate',
        recommendation: t('goClinic'),
        explanation: 'Could not connect to server. Please verify backend is running.',
      };
      navigation.replace('Result', {
        symptomSummary,
        triage: fallback,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={[COLORS.bgTop, COLORS.bgBottom]} style={styles.root}>
      <View style={styles.content}>
        <Text style={styles.title}>{t('triageChatTitle')}</Text>

        <ScrollView style={styles.chatArea} contentContainerStyle={styles.chatContent}>
          {messages.map((m, i) => (
            <ChatBubble key={`${m.role}-${i}`} role={m.role === 'system' ? 'bot' : 'user'} message={m.message} />
          ))}
        </ScrollView>

        <TextInput
          placeholder="Type your response"
          placeholderTextColor="#AFC4DD"
          style={styles.input}
          value={input}
          onChangeText={setInput}
        />

        <ActionButton label="Send" onPress={submitAnswer} />

        <ActionButton
          label={loading ? t('checking') : t('analyzeNow')}
          onPress={runAnalysis}
          disabled={loading}
          style={{ marginTop: 8 }}
        />

        {loading ? <ActivityIndicator color={COLORS.accent} style={{ marginTop: 10 }} /> : null}
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: {
    flex: 1,
    paddingTop: 58,
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  title: {
    color: COLORS.text,
    fontSize: 25,
    fontWeight: '800',
    marginBottom: 12,
  },
  chatArea: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.07)',
    marginBottom: 10,
  },
  chatContent: {
    padding: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 12,
    color: COLORS.text,
    fontSize: 16,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
});
