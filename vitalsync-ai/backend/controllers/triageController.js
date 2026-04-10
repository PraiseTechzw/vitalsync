const { inferWithLLM } = require('../services/llmService');
const { runRuleEngine } = require('../triage-engine/ruleEngine');
const { translateResult } = require('../services/translationService');

async function analyzeTriage(req, res) {
  try {
    const { symptoms, heart_rate, language = 'en' } = req.body || {};

    if (!symptoms || typeof symptoms !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'symptoms is required and must be text',
      });
    }

    // Try AI first. If AI fails or returns no usable output, fallback to rules.
    let aiResult = null;
    try {
      aiResult = await inferWithLLM({ symptoms, heart_rate });
    } catch (err) {
      aiResult = null;
    }

    const baseResult = aiResult || runRuleEngine({ symptoms, heart_rate });
    const localized = translateResult(baseResult, language);

    return res.json({
      success: true,
      source: aiResult ? 'ai' : 'rules',
      data: localized,
    });
  } catch (error) {
    console.error('analyzeTriage error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to analyze triage request',
    });
  }
}

module.exports = {
  analyzeTriage,
};
