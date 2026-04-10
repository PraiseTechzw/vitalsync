const HIGH_KEYWORDS = [
  'chest pain',
  'shortness of breath',
  'breathing difficulty',
  'fainting',
  'severe bleeding',
  'confusion',
];

const MODERATE_KEYWORDS = [
  'fever',
  'cough',
  'sore throat',
  'vomiting',
  'diarrhea',
  'body pain',
];

const LOW_KEYWORDS = ['headache', 'runny nose', 'sneezing', 'mild pain'];

function hasAny(text, keywords) {
  return keywords.some((k) => text.includes(k));
}

function runRuleEngine({ symptoms, heart_rate, aiHint }) {
  const text = String(symptoms || '').toLowerCase();
  const hr = Number(heart_rate);
  const hasChestPain = text.includes('chest pain');
  const hasBreathIssue = text.includes('shortness of breath') || text.includes('breathing difficulty');

  // Critical rule requested by product spec.
  if (hasChestPain && hasBreathIssue) {
    return {
      risk_level: 'High',
      recommendation: 'Seek urgent care',
      explanation: 'Chest pain with breathing trouble can be serious. Please seek urgent care now.',
    };
  }

  // Heart rate safety rule.
  if (!Number.isNaN(hr) && (hr > 120 || hr < 45)) {
    return {
      risk_level: 'High',
      recommendation: 'Go to clinic',
      explanation: 'Your heart rate is outside the usual safe range. Please get medical attention today.',
    };
  }

  if (text.includes('fever') && hasAny(text, ['mild', 'headache', 'cough', 'sore throat'])) {
    return {
      risk_level: 'Moderate',
      recommendation: 'Visit pharmacy',
      explanation: 'Your symptoms may need medicines and monitoring. Start with a pharmacy or clinic advice.',
    };
  }

  if (text.includes('headache') && !hasAny(text, HIGH_KEYWORDS) && text.split(' ').length < 12) {
    return {
      risk_level: 'Low',
      recommendation: 'Stay home',
      explanation: 'This looks mild right now. Rest, hydrate, and monitor symptoms.',
    };
  }

  if (hasAny(text, HIGH_KEYWORDS)) {
    return {
      risk_level: 'High',
      recommendation: 'Go to clinic',
      explanation: 'Your symptoms may need in-person assessment soon.',
    };
  }

  if (hasAny(text, MODERATE_KEYWORDS)) {
    return {
      risk_level: 'Moderate',
      recommendation: 'Visit pharmacy',
      explanation: 'You have symptoms that may need early treatment and close follow-up.',
    };
  }

  if (hasAny(text, LOW_KEYWORDS)) {
    return {
      risk_level: 'Low',
      recommendation: 'Stay home',
      explanation: 'Symptoms appear mild. Rest and monitor for worsening signs.',
    };
  }

  if (aiHint?.risk_level && aiHint?.recommendation && aiHint?.explanation) {
    return aiHint;
  }

  return {
    risk_level: 'Moderate',
    recommendation: 'Go to clinic',
    explanation: 'We need a clinician review to be safe because symptoms are unclear.',
  };
}

module.exports = {
  runRuleEngine,
};
