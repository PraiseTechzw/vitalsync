const { runRuleEngine } = require('../triage-engine/ruleEngine');

function extractJson(text) {
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) return null;

  try {
    return JSON.parse(text.slice(start, end + 1));
  } catch {
    return null;
  }
}

async function inferWithLLM({ symptoms, heart_rate }) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) return null;

  const model = process.env.OPENROUTER_MODEL || 'openai/gpt-4o-mini';

  const prompt = `You are a clinical triage assistant for Zimbabwe.\nThis is not diagnosis.\nGiven symptoms and optional heart rate, return strict JSON only:\n{\n  \"risk_level\": \"Low|Moderate|High\",\n  \"recommendation\": \"Stay home|Visit pharmacy|Go to clinic|Seek urgent care\",\n  \"explanation\": \"short, simple explanation\"\n}\n\nSymptoms: ${symptoms}\nHeart rate: ${heart_rate ?? 'unknown'}`;

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.2,
    }),
  });

  if (!response.ok) {
    return null;
  }

  const payload = await response.json();
  const content = payload?.choices?.[0]?.message?.content;
  if (!content) return null;

  const parsed = extractJson(content);
  if (!parsed?.risk_level || !parsed?.recommendation || !parsed?.explanation) {
    return null;
  }

  // Normalize and safeguard output.
  const normalized = runRuleEngine({ symptoms, heart_rate, aiHint: parsed });
  return {
    risk_level: parsed.risk_level || normalized.risk_level,
    recommendation: parsed.recommendation || normalized.recommendation,
    explanation: parsed.explanation || normalized.explanation,
  };
}

module.exports = {
  inferWithLLM,
};
