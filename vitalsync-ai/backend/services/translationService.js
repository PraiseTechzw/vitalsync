const MAP = {
  en: {
    Low: 'Low',
    Moderate: 'Moderate',
    High: 'High',
    'Stay home': 'Stay home',
    'Visit pharmacy': 'Visit pharmacy',
    'Go to clinic': 'Go to clinic',
    'Seek urgent care': 'Seek urgent care',
  },
  sn: {
    Low: 'Shoma',
    Moderate: 'Pakati',
    High: 'Yakakwirira',
    'Stay home': 'Gara kumba',
    'Visit pharmacy': 'Enda kufamasi',
    'Go to clinic': 'Enda kukiriniki',
    'Seek urgent care': 'Tsvaga rubatsiro rwechimbichimbi',
  },
  nd: {
    Low: 'Phansi',
    Moderate: 'Maphakathi',
    High: 'Phezulu',
    'Stay home': 'Hlala ekhaya',
    'Visit pharmacy': 'Yiya epharmacy',
    'Go to clinic': 'Yiya ekliniki',
    'Seek urgent care': 'Dinga usizo oluphuthumayo',
  },
};

function translateResult(result, language = 'en') {
  const lang = MAP[language] ? language : 'en';
  const table = MAP[lang];

  return {
    risk_level: table[result.risk_level] || result.risk_level,
    recommendation: table[result.recommendation] || result.recommendation,
    explanation: result.explanation,
    language: lang,
  };
}

module.exports = {
  translateResult,
};
