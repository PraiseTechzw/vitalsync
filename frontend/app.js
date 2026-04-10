/* ═══════════════════════════════════════════════════════════════
   HealthGuard AI v4.2 — Smart Adaptive Medical Interview
   NEW: Intelligent triage — extracts data from free text,
        asks only what's missing, max 1–4 questions,
        natural doctor conversation style.
   All original features preserved.
═══════════════════════════════════════════════════════════════ */

'use strict';

const DOCTOR_CONTACT = {
  phone: '+263771234567',
  whatsapp: '+263771234567',
  bookingUrl: 'https://example-clinic-booking.com',
};

// ─── Symptom Database ───────────────────────────────────────────
const SYMPTOMS_EN = [
  "fever","cough","sore throat","headache","vomiting","nausea",
  "chest pain","breathing difficulty","shortness of breath",
  "stomach pain","abdominal pain","fatigue","tiredness","weakness",
  "diarrhea","rash","fainting","dizziness","body ache","runny nose",
  "cold","sneezing","back pain","joint pain","swelling",
  "chills","muscle pain","loss of appetite","dehydration",
  "high temperature","throat pain","eye pain","ear pain"
];

const SYMPTOMS_SN = [
  "fivha","kukosora","kurwadza huro","musoro kurwadza","kurutsa",
  "kuda kurutsa","kurwadza chipfuva","kushaya mweya","kurwadza dumbu",
  "kuneta","kusava nesimba","manyoka","mapundu",
  "kupera simba","dzungu","kurwadza muviri","mhino dzinoyerera","kuhotsira",
  "kurwadza musana","kurwadza majoini"
];

const SYMPTOMS_ND = [
  "imfiva","ukukhwehlela","ubuhlungu bomphimbo","ikhanda elibuhlungu","ukuhlanza",
  "isicanucanu","ubuhlungu besifuba","ukuphelelwa ngumoya","ubuhlungu besisu",
  "ukukhathala","ubuthakathaka","uhudo","amaqhuqhuva",
  "isiyezi","ubuhlungu bomzimba","umkhuhlane","ukuthimula",
  "ubuhlungu bomhlane","ubuhlungu bamalunga"
];

const QUICK_SYMPTOMS = [
  { icon:"🌡️", label:"Fever",          key:"fever" },
  { icon:"😮‍💨", label:"Cough",          key:"cough" },
  { icon:"🤕", label:"Headache",       key:"headache" },
  { icon:"🤢", label:"Nausea",         key:"nausea" },
  { icon:"💨", label:"Breathlessness", key:"breathing difficulty" },
  { icon:"😫", label:"Fatigue",        key:"fatigue" },
  { icon:"🤧", label:"Cold",           key:"cold" },
  { icon:"🫀", label:"Chest Pain",     key:"chest pain" },
  { icon:"🤮", label:"Vomiting",       key:"vomiting" },
  { icon:"🩹", label:"Stomach Pain",   key:"stomach pain" },
  { icon:"💪", label:"Body Ache",      key:"body ache" },
  { icon:"🥴", label:"Dizziness",      key:"dizziness" },
];

// ═══════════════════════════════════════════════════════════════
//  SMART TRIAGE ENGINE
//  Extracts fields from free-text, decides what to ask next
// ═══════════════════════════════════════════════════════════════

// Patterns for auto-extraction
const EXTRACT_PATTERNS = {
  duration: [
    /(\d+)\s*day[s]?/i, /(\d+)\s*நாட்க/,
    /since\s+(yesterday|today|last\s+\w+)/i,
    /for\s+(a\s+)?(few|couple\s+of)?\s*day[s]?/i,
    /(\d+)\s*week[s]?/i,
    /(yesterday|today|this\s+morning|since\s+\w+)/i
  ],
  medication: [
    /paracetamol/i, /ibuprofen/i, /aspirin/i, /antibiotic[s]?/i,
    /crocin/i, /dolo/i, /azithromycin/i, /amoxicillin/i,
    /took?\s+([a-z]+)/i, /taking\s+([a-z]+)/i,
    /medicine\s*[:=]?\s*([a-z]+)/i,
    /பாராசிட்டமால்/i, /மருந்து/i
  ],
  severity: [
    /mild/i, /moderate/i, /severe/i, /high/i, /low/i, /லேசான/i, /கடுமையான/i,
    /slight/i, /little/i, /lot/i, /very\s+(bad|high|severe)/i,
    /unbearable/i, /terrible/i
  ],
  fever_level: [
    /(\d{2,3})[°℉F]/i, /fever\s*(of|at|around|above)?\s*(\d+)/i,
    /temperature\s*(of|at|around)?\s*(\d+)/i,
    /high\s*fever/i, /low\s*grade/i, /low-grade/i
  ],
  trend: [
    /getting\s+(worse|better|bad)/i, /improving/i, /worsening/i,
    /no\s+improvement/i, /same/i, /மேம்பட/i, /மோசமாக/i
  ],
  remedies: [
    /rest(ing)?/i, /steam/i, /fluids?/i, /water/i,
    /home\s*remedy/i, /nothing/i, /no\s*medicine/i,
    /ஓய்வு/i, /தண்ணீர்/i
  ],
  history: [
    /before/i, /previously/i, /again/i, /recurring/i,
    /first\s+time/i, /never\s+had/i, /had\s+this\s+before/i,
    /முன்பு/i, /முதல்\s*முறை/i
  ]
};

// Symptom-specific follow-up questions (adaptive)
const SYMPTOM_QUESTIONS = {
  en: {
    fever: [
      { id:'fever_level', text:"How high is your fever — low grade or above 101°F?",   key:'Fever Level',  quick:['Low grade','Around 101°F','Above 102°F','Not sure'] },
      { id:'fatigue',     text:"Are you feeling weakness or chills along with the fever?", key:'Weakness',  quick:['Yes, weak','Some chills','Both','No, just fever'] },
    ],
    headache: [
      { id:'onset',       text:"Did the headache come on suddenly or build up gradually?", key:'Onset',    quick:['Suddenly','Gradually','After waking','After screen time'] },
    ],
    cough: [
      { id:'cough_type',  text:"Is the cough dry or are you bringing up phlegm?",          key:'Cough type',quick:['Dry cough','Wet / phlegm','Mostly at night','With chest pain'] },
    ],
    stomach_pain: [
      { id:'pain_detail', text:"Is the pain after eating, or on an empty stomach?",        key:'Pain when', quick:['After eating','Empty stomach','Both','Constant pain'] },
    ],
    vomiting: [
      { id:'vomit_freq',  text:"How many times have you vomited? Any blood?",              key:'Vomiting',  quick:['Once or twice','Several times','With blood','Just nausea'] },
    ],
    chest_pain: [
      { id:'chest_detail',text:"Is the chest pain sharp, pressure, or tightness?",        key:'Chest pain',quick:['Sharp','Pressure / heavy','Tightness','Mild discomfort'] },
    ],
    breathing_difficulty: [
      { id:'breath_detail',text:"Do you get breathless at rest or only when moving?",     key:'Breathlessness',quick:['At rest','Only moving','Worsening','Sudden onset'] },
    ],
    diarrhea: [
      { id:'stool_detail', text:"Is there any blood in the stool, or is it watery?",      key:'Stool type', quick:['Watery','With mucus','Blood present','Just loose'] },
    ],
    default: [
      { id:'trend',       text:"Are these symptoms getting better, worse, or staying the same?", key:'Trend', quick:['Getting better','Getting worse','Same','Fluctuating'] },
    ]
  },
  sn: {
    fever: [
      { id:'fever_level', text:"Fivha yako yakakwira sei - yakaderera here kana kupfuura 101°F?", key:'Fever level', quick:['Yakaderera','Around 101°F','Pamusoro pe102°F','Handina chokwadi'] },
      { id:'fatigue',     text:"Uri kunzwa kusava nesimba kana kutonhora pamwe nefivha here?",       key:'Weakness',    quick:['Ehe, handina simba','Ndiri kutonhora','Zvese zviri zviviri','Kwete'] },
    ],
    headache: [
      { id:'onset',       text:"Musoro wakatanga kamwe kamwe here kana zvishoma nezvishoma?",          key:'Onset',       quick:['Kamwe kamwe','Zvishoma nezvishoma','Mangwanani','Mushure me screen'] },
    ],
    cough: [
      { id:'cough_type',  text:"Kukosora kwakaoma here kana kune phlegm?",                             key:'Cough type',  quick:['Kukosora kwakaoma','Kune phlegm','Kunonyanya usiku','Nechipfuva kurwadza'] },
    ],
    stomach_pain: [
      { id:'pain_detail', text:"Kurwadza dumbu kunouya mushure mekudya here kana usina kudya?",         key:'Pain when',   quick:['Mushure mekudya','Ndisina kudya','Zvese','Kunoramba kuripo'] },
    ],
    vomiting: [
      { id:'vomit_freq',  text:"Warutsa kangani? Pane ropa here?",                                      key:'Vomiting',    quick:['Kamwe kana kaviri','Kakawanda','Kune ropa','Ndinongonzwa kuda kurutsa'] },
    ],
    chest_pain: [
      { id:'chest_detail',text:"Kurwadza chipfuva kuri kubaya, kumanikidza kana kusunga here?",         key:'Chest pain',  quick:['Kubaya','Kumanikidza','Kusunga','Kurwadza kushoma'] },
    ],
    breathing_difficulty: [
      { id:'breath_detail',text:"Unoshaya mweya wakazorora here kana paunofamba chete?",                key:'Breathless',  quick:['Ndakazorora','Pakufamba chete','Zviri kuwedzera','Zvakatanga kamwe'] },
    ],
    diarrhea: [
      { id:'stool_detail', text:"Pane ropa mumanyoka here kana ari emvura chete?",                      key:'Stool type',  quick:['Emvura','Ane mucus','Ropa riripo','Akasununguka chete'] },
    ],
    default: [
      { id:'trend',       text:"Zviratidzo zviri nani here, zviri kuipa here, kana zvakangofanana?",     key:'Trend',       quick:['Zviri nani','Zviri kuipa','Zvakangofanana','Zviri kuchinja'] },
    ]
  },
  nd: {
    fever: [
      { id:'fever_level', text:"Imfiva yakho iphakeme kangakanani - iphansi loba ingaphezu kuka 101°F?", key:'Fever level', quick:['Iphansi','Around 101°F','Ngaphezu kuka102°F','Angiqiniseki'] },
      { id:'fatigue',     text:"Uzizwa ubuthakathaka loba uqhaqhazela kanye lemfiva na?",                key:'Weakness',    quick:['Yebo ngibuthakathaka','Ngiyagodola','Kokubili','Hatshi'] },
    ],
    headache: [
      { id:'onset',       text:"Ikhanda liqale masinyane kumbe kancane kancane?",                         key:'Onset',       quick:['Masinyane','Kancane kancane','Ekuseni','Ngemva kwe screen'] },
    ],
    cough: [
      { id:'cough_type',  text:"Ukukhwehlela kwakho komile kumbe kuphuma iphlegm?",                      key:'Cough type',  quick:['Komile','Kuphuma iphlegm','Kakhulu ebusuku','Nobuhlungu besifuba'] },
    ],
    stomach_pain: [
      { id:'pain_detail', text:"Ubuhlungu besisu buza ngemva kokudla kumbe uselambile?",                  key:'Pain when',   quick:['Ngemva kokudla','Ngelambile','Kokubili','Buhlala khona'] },
    ],
    vomiting: [
      { id:'vomit_freq',  text:"Usuhlanze kangaki? Kukhona igazi na?",                                     key:'Vomiting',    quick:['Kanye loba kabili','Kanengi','Kukhona igazi','Ngilesicanucanu kuphela'] },
    ],
    chest_pain: [
      { id:'chest_detail',text:"Ubuhlungu besifuba bubukhali, bunzima kumbe buqinile?",                   key:'Chest pain',  quick:['Bubukhali','Bunzima','Buqinile','Bumancane'] },
    ],
    breathing_difficulty: [
      { id:'breath_detail',text:"Uyaphelelwa ngumoya uphumule kumbe nxa uhamba kuphela?",                key:'Breathless',  quick:['Nxa ngiphumule','Nxa ngihamba','Kuyakhula','Kuqale masinyane'] },
    ],
    diarrhea: [
      { id:'stool_detail', text:"Kukhona igazi kuhudo kumbe kungamanzi kuphela?",                         key:'Stool type',  quick:['Kungamanzi','Kune mucus','Kunegazi','Kuthambile kuphela'] },
    ],
    default: [
      { id:'trend',       text:"Izimpawu ziba ngcono, ziba zimbi, kumbe zifanayo?",                        key:'Trend',       quick:['Ziba ngcono','Ziba zimbi','Zifanayo','Ziyatshintsha'] },
    ]
  }
};

// Required fields — once all filled, run diagnosis
const REQUIRED_FIELDS = ['symptoms','duration','medication'];
// Sufficient fields — if these 4+ are present, definitely enough
const SUFFICIENT_FIELDS = ['symptoms','duration','medication','severity'];

// Natural doctor phrases (varied, not robotic)
const DOCTOR_PHRASES = {
  en: {
    ack:      ["Got it.", "Okay.", "Thanks for that.", "Noted.", "Alright.", "I see."],
    follow:   ["Just one quick thing —", "One more thing I want to check —", "Almost there —", "Quick follow-up:"],
    enough:   ["I have enough to work with.", "That gives me a clear picture.", "Perfect, that's all I need."],
    running:  ["Let me analyze that now...", "Running your diagnosis...", "Analyzing everything now..."],
    greet_info: ["I can see you have", "You've mentioned", "From what you've described —"],
    extracted:  ["I've picked up the following details from what you said:", "Here's what I gathered:"],
  },
  sn: {
    ack:      ["Zvakanaka.", "Ndazvinzwa.", "Ndatenda.", "Zvanyorwa."],
    follow:   ["Pane chimwe chinhu chidiki -", "Mubvunzo umwe wekupedzisira -", "Ngationei izvi -"],
    enough:   ["Ruzivo rwakwana.", "Izvi zvandipa mufananidzo wakajeka.", "Zvakanaka, ndava kukwanisa kuongorora."],
    running:  ["Ndiri kuongorora zvino...", "Kuyedza kuwana mhedziso yako..."],
    greet_info: ["Zvandiri kuona ndezvekuti", "Mataura kuti", "Kubva pane zvamataura -"],
    extracted:  ["Ndaburitsa ruzivo urwu kubva pamashoko enyu:"],
  },
  nd: {
    ack:      ["Kulungile.", "Ngikuzwile.", "Ngiyabonga.", "Sekubhaliwe."],
    follow:   ["Okokugcina okuncane -", "Umbuzo owodwa futhi -", "Ake ngibuze lokhu -"],
    enough:   ["Ulwazi lwanele.", "Lokhu kunginike umfanekiso ocacileyo.", "Kulungile, sengingahlaziya."],
    running:  ["Sengihlaziya manje...", "Ngisebenzisa ukuhlaziya kwakho..."],
    greet_info: ["Engikubonayo yikuthi", "Ukhulume ukuthi", "Ngokwalokho okuchazileyo -"],
    extracted:  ["Ngikhiphe ulwazi olulandelayo kulokho okukhulumileyo:"],
  }
};

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

// ─── App State ──────────────────────────────────────────────────
const state = {
  lang: 'en',
  theme: 'light',
  lastResult: null,
  selectedQuickSymptoms: new Set(),
  recognizing: false,
  chart: null,
  history: [],
  heartRate: null,         // { bpm, risk, category, quality, message, message_sn, message_nd }
};

// Smart interview state
const iv = {
  active: false,
  rawText: '',
  symptoms: [],       // detected symptom keys
  // Extracted data fields (pre-filled from free text)
  data: {
    symptoms: null,
    duration: null,
    medication: null,
    severity: null,
    fever_level: null,
    trend: null,
    remedies: null,
    history: null,
    fatigue: null,
    onset: null,
    existing: null,
    cough_type: null,
    pain_detail: null,
    vomit_freq: null,
    chest_detail: null,
    breath_detail: null,
    stool_detail: null,
    age: null,
    gender: null,
  },
  questionQueue: [],    // questions still to ask
  questionsAsked: 0,
  maxQuestions: 4,      // adaptive cap
  waitingForAnswer: false,
};

// ─── DOM ───────────────────────────────────────────────────────
const $ = id => document.getElementById(id);
const $$ = sel => document.querySelectorAll(sel);

// ─── Init ──────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  loadPrefs();
  loadHistory();
  setupNav();
  setupTabs();
  setupSymptomInput();
  setupQuickSymptoms();
  setupVoice();
  setupSeveritySlider();
  setupDarkToggle();
  setupLangToggle();
  checkApiStatus();
  renderDashHistory();
  updateStatCounts();
  restoreDashboardResult();

  $('goToDiagnose').addEventListener('click', () => switchSection('diagnose'));
  $('quickDiagnoseBtn').addEventListener('click', () => switchSection('diagnose'));
  $('viewAllHistory').addEventListener('click', () => switchSection('history'));
  $('historyStartDiag')?.addEventListener('click', () => switchSection('diagnose'));
  $('clearHistoryBtn').addEventListener('click', clearHistory);

  $('startInterviewFromInput').addEventListener('click', handleStartInterview);
  $('resetDiagnoseBtn').addEventListener('click', resetDiagnoseFlow);
  $('skipInterviewBtn')?.addEventListener('click', skipToAnalysis);
  $('newDiagnosisBtn')?.addEventListener('click', resetDiagnoseFlow);

  $('downloadPdfBtn').addEventListener('click', () => $('pdfModal').classList.remove('hidden'));
  $('saveHistoryBtn').addEventListener('click', saveCurrentToHistory);
  $('closePdfModal').addEventListener('click', () => $('pdfModal').classList.add('hidden'));
  $('cancelPdfBtn').addEventListener('click', () => $('pdfModal').classList.add('hidden'));
  $('confirmPdfBtn').addEventListener('click', generatePdf);

  $('talkDoctorBtn')?.addEventListener('click', () => $('doctorModal')?.classList.remove('hidden'));
  $('closeDoctorModal')?.addEventListener('click', () => $('doctorModal')?.classList.add('hidden'));
  $('doctorCallBtn')?.addEventListener('click', callDoctorNow);
  $('doctorWhatsAppBtn')?.addEventListener('click', openDoctorWhatsApp);
  $('doctorBookBtn')?.addEventListener('click', openDoctorBooking);

  $('chatSendBtn')?.addEventListener('click', submitChatAnswer);
  $('chatInputField')?.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submitChatAnswer(); }
  });

  showStep('input');
  setupHeartRateSensor();
});

// ═══════════════════ NAV ═══════════════════
function setupNav() {
  $$('.nav-link').forEach(link => {
    link.addEventListener('click', e => {
      e.preventDefault();
      switchSection(link.dataset.section);
    });
  });
}

function switchSection(name) {
  $$('.section').forEach(s => s.classList.remove('active'));
  $$('.nav-link').forEach(l => l.classList.remove('active'));
  $(`${name}Section`)?.classList.add('active');
  document.querySelector(`[data-section="${name}"]`)?.classList.add('active');
  if (name === 'history') renderHistoryList();
  if (name === 'dashboard') { renderDashHistory(); restoreDashboardResult(); }
}

// ═══════════════════ STEP MANAGEMENT ═══════════════════
function showStep(step) {
  ['stepInput','stepInterview','stepResults'].forEach(id => $( id )?.classList.add('hidden'));
  $('resetDiagnoseBtn').style.display = 'none';
  $(`step${step.charAt(0).toUpperCase()+step.slice(1)}`)?.classList.remove('hidden');

  const T = {
    input: {
      en:['Symptom Analysis', 'Speak or type your symptoms — our AI will guide you'],
      sn:['Kuongorora Zviratidzo', 'Taura kana nyora zviratidzo zvako — AI doctor inokutungamirira'],
      nd:['Ukuhlaziya Izimpawu', 'Khuluma loba bhala izimpawu zakho — i-AI doctor izakukhokhela']
    },
    interview: {
      en:['AI Doctor Consultation','Gathering the information I need'],
      sn:['Kubvunzana naAI Doctor','Ndiri kuunganidza ruzivo rwandinoda'],
      nd:['Ukubonisana loAI Doctor','Ngibutha ulwazi engiludingayo']
    },
    results: {
      en:['Diagnosis Results','Analysis complete'],
      sn:['Mhedziso yeDiagnosis','Kuongorora kwapera'],
      nd:['Imiphumela yeDiagnosis','Ukuhlaziya sekuphelile']
    },
  };
  const t = T[step]?.[state.lang] || T[step]?.en || ['',''];
  if ($('diagnoseSectionTitle')) $('diagnoseSectionTitle').textContent = t[0];
  if ($('diagnoseSectionSub'))   $('diagnoseSectionSub').textContent   = t[1];
  if (step !== 'input') $('resetDiagnoseBtn').style.display = 'inline-flex';
}

function resetDiagnoseFlow() {
  iv.active = false;
  iv.data = Object.fromEntries(Object.keys(iv.data).map(k => [k, null]));
  iv.questionQueue = [];
  iv.questionsAsked = 0;
  iv.waitingForAnswer = false;
  iv.rawText = '';
  iv.symptoms = [];
  $('symptomText').value = '';
  $('selectedChips').innerHTML = '';
  state.selectedQuickSymptoms.clear();
  $$('.symptom-toggle').forEach(b => { b.classList.remove('checked'); b.querySelector('.toggle-check').textContent = ''; });
  showStep('input');
  window.scrollTo({ top:0, behavior:'smooth' });
}

// ═══════════════════ SMART EXTRACTION ═══════════════════
function extractFromText(text) {
  const t = text.toLowerCase();
  const out = {};

  // symptoms
  const symFound = SYMPTOMS_EN.filter(s => t.includes(s));
  if (symFound.length) out.symptoms = symFound.join(', ');

  // duration
  for (const pat of EXTRACT_PATTERNS.duration) {
    const m = text.match(pat);
    if (m) { out.duration = m[0]; break; }
  }

  // medication
  const medWords = ['paracetamol','ibuprofen','aspirin','crocin','dolo','antibiotic',
                    'azithromycin','amoxicillin','medicine','tablet','drug'];
  for (const w of medWords) {
    if (t.includes(w)) { out.medication = w.charAt(0).toUpperCase() + w.slice(1); break; }
  }
  if (!out.medication) {
    const m = text.match(/took?\s+(\w+)|taking\s+(\w+)/i);
    if (m) out.medication = m[1] || m[2];
  }
  if (t.includes('no medicine') || t.includes('nothing') || t.includes('no medication')) {
    out.medication = 'None';
  }

  // severity
  if (/mild|slight|little|low/i.test(text)) out.severity = 'Mild';
  else if (/moderate|medium/i.test(text))    out.severity = 'Moderate';
  else if (/severe|high|very|lot|terrible|unbearable/i.test(text)) out.severity = 'Severe';

  // fever level
  const feverMatch = text.match(/(\d{2,3})[°℉F]|fever\s*(of|at|around|above)?\s*(\d+)/i);
  if (feverMatch) out.fever_level = feverMatch[0];
  else if (/high\s*fever/i.test(text)) out.fever_level = 'High fever';
  else if (/low.grade|low grade/i.test(text)) out.fever_level = 'Low grade';
  else if (/no fever/i.test(text)) out.fever_level = 'No fever';

  // trend
  if (/getting\s*worse|worsening|increasing/i.test(text)) out.trend = 'Getting worse';
  else if (/getting\s*better|improving|better\s*now/i.test(text)) out.trend = 'Getting better';
  else if (/same|no\s*change|not\s*changing/i.test(text)) out.trend = 'Same';

  // remedies
  if (/rest|sleep|resting/i.test(text)) out.remedies = 'Rest';
  if (/steam/i.test(text)) out.remedies = 'Steam inhalation';
  if (/fluid|water|drink/i.test(text)) out.remedies = out.remedies ? out.remedies + ', fluids' : 'Fluids';
  if (/nothing|no remedy|no treatment/i.test(text)) out.remedies = 'None';

  // history
  if (/before|previously|again|recurring/i.test(text)) out.history = 'Yes, had before';
  else if (/first time|never|new symptom/i.test(text)) out.history = 'First time';

  // fatigue/weakness
  if (/weak|fatigue|tired|exhausted|no energy/i.test(text)) out.fatigue = 'Yes';
  else if (/no weakness|not tired|feeling fine/i.test(text)) out.fatigue = 'No';

  // onset
  if (/sudden|suddenly|out of nowhere/i.test(text)) out.onset = 'Sudden';
  else if (/gradual|slowly|over time/i.test(text)) out.onset = 'Gradual';

  return out;
}

function countFilledFields(data) {
  return Object.values(data).filter(v => v !== null && v !== '').length;
}

function hasSufficientInfo(data) {
  // If symptoms + any 2 others → sufficient
  const filled = Object.keys(data).filter(k => data[k] !== null && data[k] !== '');
  return filled.includes('symptoms') && filled.length >= 3;
}

// Decide which questions to ask based on what's missing + symptoms
function buildQuestionQueue(data, symptoms, lang) {
  const L = ['sn', 'nd'].includes(lang) ? lang : 'en';
  const SQ = SYMPTOM_QUESTIONS[L];
  const queue = [];
  const asked = new Set();

  const addQ = (q) => {
    if (!asked.has(q.id) && !data[q.id]) { queue.push(q); asked.add(q.id); }
  };

  // Add symptom-specific questions
  const symText = (data.symptoms || '').toLowerCase();
  if (symText.includes('fever'))              SQ.fever?.forEach(addQ);
  if (symText.includes('headache'))           SQ.headache?.forEach(addQ);
  if (symText.includes('cough'))              SQ.cough?.forEach(addQ);
  if (symText.includes('stomach') || symText.includes('abdominal')) SQ.stomach_pain?.forEach(addQ);
  if (symText.includes('vomit') || symText.includes('nausea'))      SQ.vomiting?.forEach(addQ);
  if (symText.includes('chest'))              SQ.chest_pain?.forEach(addQ);
  if (symText.includes('breath') || symText.includes('breath')) SQ.breathing_difficulty?.forEach(addQ);
  if (symText.includes('diarrhea') || symText.includes('loose')) SQ.diarrhea?.forEach(addQ);

  // Generic fallback questions if we still need data
  const genericEN = [
    { id:'duration',   text:"How long have you been feeling this way?",                 key:'Duration',    quick:['Since yesterday','2-3 days','About a week','More than a week'] },
    { id:'medication', text:"Have you taken anything for it?",                          key:'Medication',  quick:['Nothing yet','Paracetamol','OTC medicine','Prescription meds'] },
    { id:'trend',      text:"Are things getting better or worse since it started?",     key:'Trend',       quick:['Getting better','Getting worse','About the same','Fluctuating'] },
    { id:'existing',   text:"Any existing conditions I should know about?",             key:'Conditions',  quick:['None','Diabetes','Heart condition','Other'] },
  ];
  const genericSN = [
    { id:'duration',   text:'Wava nemazuva mangani uchinzwa kudai?',                  key:'Duration',   quick:['Kubva nezuro','2-3 mazuva','Inenge svondo','Kupfuura svondo'] },
    { id:'medication', text:'Watora mushonga here?',                                   key:'Medication', quick:['Hapana','Paracetamol','Mushonga we pharmacy','Prescription'] },
    { id:'trend',      text:'Zviratidzo zviri kuita nani here kana kuipa?',            key:'Trend',      quick:['Zviri nani','Zviri kuipa','Zvakangofanana','Zviri kuchinja'] },
    { id:'existing',   text:'Une zvimwe zvirwere zviripo zvandinofanira kuziva here?', key:'Conditions', quick:['Hapana','Diabetes','Chirwere chemoyo','Zvimwe'] },
  ];
  const genericND = [
    { id:'duration',   text:'Sekulamalanga amangaki uzwa unje?',                       key:'Duration',   quick:['Kusukela izolo','2-3 amalanga','Cishe iviki','Kwedlula iviki'] },
    { id:'medication', text:'Usuthathe umuthi yini?',                                  key:'Medication', quick:['Kangikathathi','Paracetamol','Owase pharmacy','Prescription'] },
    { id:'trend',      text:'Izimpawu zakho ziya ngcono kumbe ziya zimbi?',            key:'Trend',      quick:['Ziya ngcono','Ziya zimbi','Zifanayo','Ziyatshintsha'] },
    { id:'existing',   text:'Kukhona ezinye izifo oselazo engifanele ngizazi?',        key:'Conditions', quick:['Azikho','Diabetes','Isifo senhliziyo','Okunye'] },
  ];

  const generic = L === 'sn' ? genericSN : L === 'nd' ? genericND : genericEN;
  generic.forEach(q => { if (!data[q.id]) addQ(q); });

  // Always add default trend if not present
  if (!data.trend) SQ.default?.forEach(addQ);

  return queue;
}

// ═══════════════════ LAUNCH SMART INTERVIEW ═══════════════════
function handleStartInterview() {
  const text = buildSymptomText();
  if (!text.trim()) {
    const msgByLang = {
      en: 'Please enter or select at least one symptom.',
      sn: 'Ndapota nyora kana sarudza chiratidzo chimwe chete kana kupfuura.',
      nd: 'Sicela ufake loba ukhethe okungenani uphawu olulodwa.',
    };
    showToast(msgByLang[state.lang] || msgByLang.en, 'error');
    return;
  }
  launchSmartInterview(text);
}

function launchSmartInterview(symptomText) {
  const lang = state.lang;
  const ph = DOCTOR_PHRASES[lang] || DOCTOR_PHRASES.en;

  // Extract what we already know
  const extracted = extractFromText(symptomText);
  const ageVal  = $('patientAge')?.value  || '';
  const genVal  = $('patientGender')?.value || '';

  // Merge into iv.data
  iv.data = { ...Object.fromEntries(Object.keys(iv.data).map(k => [k, null])), ...extracted };
  iv.data.age    = ageVal  || iv.data.age;
  iv.data.gender = genVal  || iv.data.gender;
  iv.data._rawSymptoms = symptomText;

  iv.rawText = symptomText;
  iv.active  = true;
  iv.questionsAsked = 0;
  iv.waitingForAnswer = false;

  // Detect symptom list
  iv.symptoms = SYMPTOMS_EN.filter(s => symptomText.toLowerCase().includes(s));
  if (!iv.symptoms.length) iv.symptoms = [symptomText.split(' ').slice(0, 3).join(' ')];

  // Reset chat UI
  $('chatMessages').innerHTML = '';
  $('collectedAnswersDisplay').innerHTML = '<div class="answers-empty">Your information appears here</div>';
  enableChatInput(false);

  // Update sidebar detected tags
  const tagsEl = $('interviewDetectedTags');
  if (tagsEl) {
    const tags = iv.symptoms.length
      ? iv.symptoms.map(s => `<span class="detected-tag">${s}</span>`).join('')
      : `<span class="detected-tag">${symptomText.slice(0, 30)}</span>`;
    tagsEl.innerHTML = tags;
  }

  // Pre-fill sidebar with extracted data
  Object.entries(extracted).forEach(([k, v]) => {
    if (v && k !== 'symptoms') {
      updateAnswersSidebar(k.replace(/_/g,' '), v);
    }
  });
  if (extracted.symptoms) updateAnswersSidebar('Symptoms', extracted.symptoms);

  showStep('interview');
  window.scrollTo({ top:0, behavior:'smooth' });

  // Build greeting
  const filledCount = countFilledFields(iv.data);
  let greetText = '';

  if (hasSufficientInfo(iv.data)) {
    // Enough info already — say so and run immediately
    if (lang !== 'en') {
      greetText = `${pick(ph.greet_info)} <strong>${iv.symptoms.join(', ')}</strong>. ${pick(ph.enough)} ${pick(ph.running)}`;
    } else {
      greetText = `I can see: <strong>${iv.symptoms.join(', ')}</strong>${extracted.duration ? ` for ${extracted.duration}` : ''}${extracted.medication ? `, taking ${extracted.medication}` : ''}. ${pick(ph.enough)} ${pick(ph.running)}`;
    }
    addDoctorMessage(greetText, false);
    setTimeout(() => runFinalAnalysis(), 1200);
    return;
  }

  // Need more info — build queue
  iv.questionQueue = buildQuestionQueue(iv.data, iv.symptoms, lang);
  // Cap at maxQuestions
  iv.questionQueue = iv.questionQueue.slice(0, iv.maxQuestions);

  // Determine how many questions we need
  const qCount = iv.questionQueue.length;

  if (lang === 'sn') {
    if (qCount === 0) {
      greetText = `<strong>${iv.symptoms.join(', ')}</strong> ndazviona. ${pick(ph.enough)} ${pick(ph.running)}`;
    } else if (qCount === 1) {
      greetText = `<strong>${iv.symptoms.join(', ')}</strong> ndazviona. ${pick(ph.follow)}`;
    } else {
      greetText = `<strong>${iv.symptoms.join(', ')}</strong> ndazviona. Ndichabvunza ${qCount === 2 ? 'mibvunzo miviri mipfupi' : 'mibvunzo mishoma'}.`;
    }
  } else if (lang === 'nd') {
    if (qCount === 0) {
      greetText = `<strong>${iv.symptoms.join(', ')}</strong> sengikubonile. ${pick(ph.enough)} ${pick(ph.running)}`;
    } else if (qCount === 1) {
      greetText = `<strong>${iv.symptoms.join(', ')}</strong> sengikubonile. ${pick(ph.follow)}`;
    } else {
      greetText = `<strong>${iv.symptoms.join(', ')}</strong> sengikubonile. Ngizabuza ${qCount === 2 ? 'imibuzo emibili emifitshane' : 'imibuzo embalwa'} ukuze nginike impendulo enembile.`;
    }
  } else {
    const symStr = iv.symptoms.slice(0, 2).join(' and ');
    if (qCount === 0) {
      greetText = `${pick(ph.greet_info)} <strong>${symStr}</strong>. ${pick(ph.enough)} ${pick(ph.running)}`;
    } else if (qCount === 1) {
      greetText = `${pick(ph.greet_info)} <strong>${symStr}</strong>${extracted.duration ? ` for ${extracted.duration}` : ''}. ${pick(ph.follow)}`;
    } else {
      greetText = `${pick(ph.greet_info)} <strong>${symStr}</strong>. I just need ${qCount === 2 ? 'a couple of quick details' : 'a few quick details'} to give you an accurate diagnosis.`;
    }
  }

  addDoctorMessage(greetText, false);

  if (qCount === 0) {
    setTimeout(() => runFinalAnalysis(), 1000);
  } else {
    setTimeout(() => askNextSmartQuestion(), 900);
  }
}

// ═══════════════════ SMART QUESTION FLOW ═══════════════════
function askNextSmartQuestion() {
  if (iv.questionQueue.length === 0 || iv.questionsAsked >= iv.maxQuestions) {
    runFinalAnalysis();
    return;
  }

  const q = iv.questionQueue.shift();
  iv.questionsAsked++;
  iv.waitingForAnswer = true;
  updateProgressUI();

  showTypingIndicator();
  setTimeout(() => {
    removeTypingIndicator();
    addDoctorMessage(q.text);
    renderQuickAnswers(q.quick || []);
    enableChatInput(true);
    // Store current question for answer mapping
    iv._currentQ = q;
  }, 650 + Math.random() * 300);
}

// ═══════════════════ ANSWER HANDLING ═══════════════════
function submitChatAnswer() {
  if (!iv.waitingForAnswer) return;
  const input = $('chatInputField');
  const raw = (input.value || '').trim();
  if (!raw) return;

  const q = iv._currentQ;
  iv.waitingForAnswer = false;

  addUserMessage(raw);
  input.value = '';
  renderQuickAnswers([]);
  enableChatInput(false);

  // Store answer
  if (q) {
    iv.data[q.id] = raw;
    updateAnswersSidebar(q.key, raw);
  }

  // Extract additional data from their answer
  const moreExtracted = extractFromText(raw);
  Object.entries(moreExtracted).forEach(([k, v]) => {
    if (v && !iv.data[k]) {
      iv.data[k] = v;
      updateAnswersSidebar(k.replace(/_/g, ' '), v);
    }
  });

  // Remove from queue any questions now answered by their response
  iv.questionQueue = iv.questionQueue.filter(qItem => !iv.data[qItem.id]);

  // Acknowledge naturally
  const ph = DOCTOR_PHRASES[state.lang] || DOCTOR_PHRASES.en;

  // Decide: enough info now?
  if (hasSufficientInfo(iv.data) || iv.questionQueue.length === 0 || iv.questionsAsked >= iv.maxQuestions) {
    const ack = pick(ph.ack);
    const enough = pick(ph.enough);
    setTimeout(() => {
      showTypingIndicator();
      setTimeout(() => {
        removeTypingIndicator();
        addDoctorMessage(`${ack} ${enough}`);
        setTimeout(() => runFinalAnalysis(), 700);
      }, 600);
    }, 200);
  } else {
    // More questions needed — brief ack before next question
    const ack = pick(ph.ack);
    setTimeout(() => {
      showTypingIndicator();
      setTimeout(() => {
        removeTypingIndicator();
        if (iv.questionQueue.length > 1) {
          addDoctorMessage(ack);
        }
        setTimeout(() => askNextSmartQuestion(), iv.questionQueue.length > 1 ? 400 : 100);
      }, 500);
    }, 200);
  }
}

window.selectQuickAnswer = function(val) {
  $('chatInputField').value = val;
  submitChatAnswer();
};

function skipToAnalysis() {
  iv.waitingForAnswer = false;
  enableChatInput(false);
  renderQuickAnswers([]);
  runFinalAnalysis();
}

// ═══════════════════ FINAL ANALYSIS ═══════════════════
async function runFinalAnalysis() {
  iv.waitingForAnswer = false;
  enableChatInput(false);
  renderQuickAnswers([]);

  const lang = state.lang;
  const ph = DOCTOR_PHRASES[lang] || DOCTOR_PHRASES.en;

  // Show "running" message
  showTypingIndicator();
  setTimeout(() => {
    removeTypingIndicator();
    const runMsgByLang = {
      en: `${pick(ph.running)}`,
      sn: `${pick(ph.running)} mhedziso dziri kuuya munguva pfupi.`,
      nd: `${pick(ph.running)} imiphumela iyeza masinyane.`,
    };
    const runMsg = runMsgByLang[lang] || runMsgByLang.en;
    addDoctorMessage(runMsg, false);
  }, 500);

  if ($('chatDoctorStatus')) {
    const statusByLang = {
      en: 'Running analysis...',
      sn: 'Kuongorora kuri kuitwa...',
      nd: 'Ukuhlaziya kuyaqhubeka...',
    };
    $('chatDoctorStatus').textContent = statusByLang[lang] || statusByLang.en;
  }

  // Build enriched text
  const d = iv.data;
  const enriched = [
    iv.rawText,
    d.duration    ? `Duration: ${d.duration}` : '',
    d.age         ? `Age: ${d.age}` : '',
    d.gender      ? `Gender: ${d.gender}` : '',
    d.medication  ? `Medication: ${d.medication}` : '',
    d.remedies    ? `Remedies: ${d.remedies}` : '',
    d.fever_level ? `Fever: ${d.fever_level}` : '',
    d.fatigue     ? `Fatigue/weakness: ${d.fatigue}` : '',
    d.severity    ? `Severity: ${d.severity}` : '',
    d.onset       ? `Onset: ${d.onset}` : '',
    d.existing    ? `Existing conditions: ${d.existing}` : '',
    d.trend       ? `Symptom trend: ${d.trend}` : '',
    d.history     ? `Medical history: ${d.history}` : '',
    d.cough_type  ? `Cough type: ${d.cough_type}` : '',
    d.pain_detail ? `Pain details: ${d.pain_detail}` : '',
    d.chest_detail? `Chest: ${d.chest_detail}` : '',
  ].filter(Boolean).join('. ');

  showLoading(true);

  try {
    const res = await fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: enriched,
        language: state.lang,
        questionnaire: d,
        patientAge: d.age || $('patientAge')?.value || '',
        patientGender: d.gender || $('patientGender')?.value || '',
        severity: d.severity || $('severitySlider')?.value || '5',
      }),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'Analysis failed');

    state.lastResult = {
      ...data,
      timestamp: Date.now(),
      patientAge: d.age || $('patientAge')?.value || '',
      patientGender: d.gender || $('patientGender')?.value || '',
      severity: d.severity || $('severitySlider')?.value || '5',
      questionnaire: d,
    };

    try { localStorage.setItem('hg_last_result', JSON.stringify(state.lastResult)); } catch {}

    renderResult(data);
    renderChart(data);
    renderAIExplain(data);
    renderPatientSummary(d);
    renderMedAdvice(data);
    updateStatCounts();

    showStep('results');
    window.scrollTo({ top:0, behavior:'smooth' });

  } catch (err) {
    showToast('Analysis failed: ' + err.message, 'error');
    if ($('chatDoctorStatus')) $('chatDoctorStatus').textContent = 'Error — please try again';
  } finally {
    showLoading(false);
  }
}

// ═══════════════════ TABS ═══════════════════
function setupTabs() {
  $$('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      $$('.tab-btn').forEach(b => b.classList.remove('active'));
      $$('.tab-content').forEach(t => t.classList.remove('active'));
      btn.classList.add('active');
      $(`tab${btn.dataset.tab.charAt(0).toUpperCase()+btn.dataset.tab.slice(1)}`)?.classList.add('active');
    });
  });
}

// ═══════════════════ SYMPTOM AUTOCOMPLETE ═══════════════════
function setupSymptomInput() {
  const inputEl = $('symptomText');
  const dropdown = $('autocompleteDropdown');
  if (!inputEl || !dropdown) return;
  inputEl.addEventListener('input', () => {
    const val = inputEl.value;
    const words = val.split(/[\s,]+/);
    const last = words[words.length-1].trim().toLowerCase();
    if (last.length < 2) { dropdown.classList.add('hidden'); return; }
    const list = state.lang === 'sn' ? SYMPTOMS_SN : state.lang === 'nd' ? SYMPTOMS_ND : SYMPTOMS_EN;
    const matches = list.filter(s => s.toLowerCase().includes(last)).slice(0, 6);
    if (!matches.length) { dropdown.classList.add('hidden'); return; }
    dropdown.innerHTML = matches.map(m => `<div class="autocomplete-item" data-val="${m}">🔍 ${m}</div>`).join('');
    dropdown.classList.remove('hidden');
    dropdown.querySelectorAll('.autocomplete-item').forEach(item => {
      item.addEventListener('mousedown', e => {
        e.preventDefault();
        insertSymptom(inputEl, item.dataset.val);
        dropdown.classList.add('hidden');
        addChip(item.dataset.val);
      });
    });
  });
  document.addEventListener('click', e => {
    if (!dropdown.contains(e.target) && e.target !== inputEl) dropdown.classList.add('hidden');
  });
}

function insertSymptom(inputEl, sym) {
  const words = inputEl.value.split(/[\s,]+/);
  words[words.length-1] = sym;
  inputEl.value = words.join(', ') + ', ';
  inputEl.focus();
}

function addChip(sym) {
  if (document.querySelector(`.chip[data-sym="${sym}"]`)) return;
  const chips = $('selectedChips');
  const chip = document.createElement('div');
  chip.className = 'chip'; chip.dataset.sym = sym;
  chip.innerHTML = `${sym} <button class="chip-remove" title="Remove">✕</button>`;
  chip.querySelector('.chip-remove').addEventListener('click', () => chip.remove());
  chips.appendChild(chip);
}

// ═══════════════════ QUICK SYMPTOMS ═══════════════════
function setupQuickSymptoms() {
  const grid = $('symptomQuickGrid');
  if (!grid) return;
  grid.innerHTML = QUICK_SYMPTOMS.map(s => `
    <button class="symptom-toggle" data-key="${s.key}">
      <span class="toggle-check"></span>
      <span>${s.icon}</span>
      <span>${s.label}</span>
    </button>`).join('');
  grid.querySelectorAll('.symptom-toggle').forEach(btn => {
    btn.addEventListener('click', () => {
      const key = btn.dataset.key;
      const isChecked = btn.classList.toggle('checked');
      const check = btn.querySelector('.toggle-check');
      if (isChecked) { state.selectedQuickSymptoms.add(key); check.textContent='✓'; addChip(key); }
      else { state.selectedQuickSymptoms.delete(key); check.textContent=''; document.querySelector(`.chip[data-sym="${key}"]`)?.remove(); }
    });
  });
}

// ═══════════════════ VOICE INPUT ═══════════════════
function setupVoice() {
  const btn = $('voiceBtn');
  const largeBtn = $('voiceLargeBtn');
  const status = $('voiceStatus');
  const supported = ('webkitSpeechRecognition' in window) || ('SpeechRecognition' in window);
  if (!supported) {
    [btn, largeBtn].forEach(b => { if (b) { b.style.opacity='0.4'; b.style.cursor='not-allowed'; } });
    return;
  }
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  const rec = new SR();
  rec.continuous = false; rec.interimResults = true;
  const start = () => {
    if (state.recognizing) { rec.stop(); return; }
    rec.lang = state.lang === 'sn' ? 'sn-ZW' : state.lang === 'nd' ? 'nd-ZW' : 'en-ZW';
    rec.start();
  };
  [btn, largeBtn].forEach(b => b?.addEventListener('click', start));
  rec.onstart = () => {
    state.recognizing = true;
    if (btn) { btn.classList.add('recording'); btn.textContent='⏹️'; }
    const listeningByLang = { en: 'Listening...', sn: 'Ndiri kuteerera...', nd: 'Ngilalele...' };
    if (largeBtn) { largeBtn.classList.add('recording'); $('voiceLargeLabel').textContent = listeningByLang[state.lang] || listeningByLang.en; }
    if (status) { status.textContent = listeningByLang[state.lang] || listeningByLang.en; status.classList.add('active'); }
  };
  rec.onresult = e => {
    const t = Array.from(e.results).map(r => r[0].transcript).join('');
    if ($('symptomText')) $('symptomText').value = t;
  };
  rec.onend = () => {
    state.recognizing = false;
    if (btn) { btn.classList.remove('recording'); btn.textContent='🎙️'; }
    const tapByLang = { en: 'Tap to Speak', sn: 'Tinya kuti utaure', nd: 'Cofa ukuze ukhulume' };
    if (largeBtn) { largeBtn.classList.remove('recording'); $('voiceLargeLabel').textContent = tapByLang[state.lang] || tapByLang.en; }
    if (status) { status.textContent=''; status.classList.remove('active'); }
    const text = $('symptomText')?.value.trim();
    if (text) {
      SYMPTOMS_EN.filter(s => text.toLowerCase().includes(s)).forEach(addChip);
      const sub = $('voiceLargeSub');
      const capturedByLang = {
        en: '✅ Captured — starting consultation...',
        sn: '✅ Zvatorwa — kubvunzana kuri kutanga...',
        nd: '✅ Kubhaliwe — ukubonisana kuyaqala...',
      };
      if (sub) sub.textContent = capturedByLang[state.lang] || capturedByLang.en;
      setTimeout(() => launchSmartInterview(text), 700);
    }
  };
  rec.onerror = () => rec.onend();
}

// ═══════════════════ SEVERITY SLIDER ═══════════════════
function setupSeveritySlider() {
  const slider = $('severitySlider'); const val = $('severityVal');
  if (!slider) return;
  slider.addEventListener('input', () => {
    val.textContent = slider.value;
    const v = parseInt(slider.value);
    val.style.background = v<=3?'var(--green-light)':v<=6?'var(--yellow-light)':'var(--red-light)';
    val.style.color       = v<=3?'var(--green)':v<=6?'var(--yellow)':'var(--red)';
  });
}

// ═══════════════════ DARK MODE / LANG ═══════════════════
function setupDarkToggle() {
  $('darkToggle').addEventListener('click', () => {
    state.theme = state.theme==='light'?'dark':'light';
    document.documentElement.setAttribute('data-theme', state.theme);
    savePrefs();
    if (state.chart) updateChartTheme();
  });
}
function setupLangToggle() {
  $('langToggle').addEventListener('click', () => {
    const order = ['en', 'sn', 'nd'];
    const nextIdx = (order.indexOf(state.lang) + 1) % order.length;
    state.lang = order[nextIdx];
    $('langLabel').textContent = state.lang.toUpperCase();
    savePrefs();
    const t = $('startInterviewBtnText');
    const labelByLang = {
      en: 'Begin Consultation ->',
      sn: 'Tanga Kubvunzana ->',
      nd: 'Qala Ukubonisana ->',
    };
    if (t) t.textContent = labelByLang[state.lang] || labelByLang.en;
  });
}

// ═══════════════════ API STATUS ═══════════════════
async function checkApiStatus() {
  const dot = $('apiStatusDot'); const label = dot?.querySelector('.status-label');
  try {
    const res = await fetch('/api/health', { signal:AbortSignal.timeout(5000) });
    const data = await res.json();
    if (data.status==='ok') { dot?.classList.remove('offline'); if (label) label.textContent = data.aiReady?'AI Online':'Fallback'; }
    else throw new Error();
  } catch {
    dot?.classList.add('offline'); if (label) label.textContent='Offline';
    dot?.querySelector('.dot') && (dot.querySelector('.dot').style.background='var(--red)');
  }
}

// ═══════════════════ BUILD SYMPTOM TEXT ═══════════════════
function buildSymptomText() {
  const parts = [];
  const textArea = $('symptomText')?.value.trim();
  if (textArea) parts.push(textArea);
  state.selectedQuickSymptoms.forEach(s => { if (!textArea?.includes(s)) parts.push(s); });
  document.querySelectorAll('.chip').forEach(c => {
    const sym = c.dataset.sym;
    if (sym && !parts.join(' ').includes(sym)) parts.push(sym);
  });
  return parts.join(', ');
}

// ═══════════════════ RENDER RESULTS ═══════════════════
function renderResult(data) {
  const risk = (data.riskLevel||data.risk||'low').toLowerCase();
  const rb = $('riskBadge');
  rb.className = `risk-badge ${risk}`;
  rb.innerHTML = `${riskIcon(risk)} ${risk.charAt(0).toUpperCase()+risk.slice(1)} Risk`;
  $('confidencePill').textContent = `${data.confidence||'Medium'} Confidence`;
  $('diagnosisTitle').textContent = data.condition||'Unknown Condition';
  const ds = $('detectedSymptoms');
  ds.innerHTML = (data.symptoms||[]).length
    ? data.symptoms.map(s => `<span class="symptom-tag">${s}</span>`).join('')
    : '<span class="symptom-tag">General symptoms</span>';
  $('riskFill').className = `risk-fill ${risk}`;
  if ($('resultFlowMeta')) {
    const t = new Date().toLocaleString('en-IN',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'});
    const metaByLang = {
      en: `Analysis completed • ${t}`,
      sn: `Kuongorora kwapera • ${t}`,
      nd: `Ukuhlaziya kuphelile • ${t}`,
    };
    $('resultFlowMeta').textContent = metaByLang[state.lang] || metaByLang.en;
  }
  if (data.isEmergency||risk==='emergency') {
    $('emergencyBanner').classList.remove('hidden');
    $('emergencyText').textContent = data.emergencyWarning||'Seek emergency care. Call 108.';
  } else {
    $('emergencyBanner').classList.add('hidden');
  }
}

function renderPatientSummary(d) {
  const card = $('patientSummaryCard'); const grid = $('patientSummaryGrid');
  if (!card||!grid) return;
  const lang = state.lang;
  const map = [
    { id:'duration', en:'Duration', sn:'Nguva', nd:'Isikhathi' },
    { id:'age', en:'Age', sn:'Zera', nd:'Iminyaka' },
    { id:'gender', en:'Gender', sn:'Murume/Mukadzi', nd:'Ubulili' },
    { id:'fever_level', en:'Fever', sn:'Fivha', nd:'Imfiva' },
    { id:'medication', en:'Medication', sn:'Mushonga', nd:'Umuthi' },
    { id:'fatigue', en:'Fatigue', sn:'Kuneta', nd:'Ukukhathala' },
    { id:'severity', en:'Severity', sn:'Kuoma', nd:'Ubunzima' },
    { id:'onset', en:'Onset', sn:'Kutanga', nd:'Ukuqala' },
    { id:'trend', en:'Trend', sn:'Mafambiro', nd:'Ukuhamba kwesimo' },
    { id:'existing', en:'Conditions', sn:'Zvirwere zviripo', nd:'Izifo ezikhona' },
    { id:'history', en:'History', sn:'Nhoroondo', nd:'Umlando' },
  ];
  const items = map.filter(item => d[item.id] && d[item.id] !== '' && !item.id.startsWith('_'));
  if (!items.length) { card.style.display='none'; return; }
  grid.innerHTML = items.map(item => `
    <div class="report-item">
      <label>${item[lang] || item.en}</label>
      <span>${d[item.id]}</span>
    </div>`).join('');
  card.style.display = '';
}

function renderMedAdvice(data) {
  const card = $('medAdviceCard'); const txt = $('medAdviceText');
  if (!card||!txt) return;
  const advice = data.medicalAdvice||data.advice||'';
  if (!advice) { card.style.display='none'; return; }
  txt.textContent = advice; card.style.display='';
}

function riskIcon(risk) {
  return {low:'🟢',medium:'🟡',high:'🔴',emergency:'🚨'}[risk]||'⚪';
}

// ═══════════════════ CHART ═══════════════════
function renderChart(data) {
  const conditions = (data.possibleConditions||data.conditions||[]).slice(0,5);
  if (!conditions.length) return;
  const isDark = state.theme==='dark';
  const textColor = isDark?'#94A3B8':'#475569';
  const gridColor = isDark?'rgba(255,255,255,0.05)':'rgba(0,0,0,0.06)';
  const rP = r => ({low:30,medium:60,high:80,emergency:95}[r?.toLowerCase()]||50);
  const labels = conditions.map(c=>truncate(c.name,28));
  const values = conditions.map(c=>rP(c.risk));
  const colors = conditions.map(c=>({low:'#059669',medium:'#D97706',high:'#DC2626',emergency:'#9F1239'}[c.risk?.toLowerCase()]||'#0EA5E9'));
  const ctx = $('diseaseChart')?.getContext('2d');
  if (!ctx) return;
  if (state.chart) state.chart.destroy();
  state.chart = new Chart(ctx, {
    type:'bar',
    data:{ labels, datasets:[{ data:values, backgroundColor:colors.map(c=>c+'22'), borderColor:colors, borderWidth:2, borderRadius:8, borderSkipped:false }] },
    options:{
      responsive:true, maintainAspectRatio:true, indexAxis:'y',
      plugins:{ legend:{display:false}, tooltip:{callbacks:{label:c=>` ${c.parsed.x}% probability`}} },
      scales:{
        x:{max:100,grid:{color:gridColor},ticks:{color:textColor,callback:v=>v+'%',font:{family:"'DM Sans',sans-serif",size:11}},border:{display:false}},
        y:{grid:{display:false},ticks:{color:textColor,font:{family:"'DM Sans',sans-serif",size:12}},border:{display:false}}
      },
      animation:{duration:900,easing:'easeInOutQuart'}
    }
  });
}
function updateChartTheme() { if (state.lastResult) renderChart(state.lastResult); }

// ═══════════════════ AI EXPLANATION ═══════════════════
async function renderAIExplain(data) {
  const c = $('aiExplainContent');
  if (!c) return;
  c.innerHTML = `<div class="explain-loading"><div class="explain-spinner"></div><span>Generating explanation...</span></div>`;
  try {
    const langNameMap = { en: 'English', sn: 'Shona', nd: 'Ndebele' };
    const langName = langNameMap[state.lang] || langNameMap.en;
    const prompt = `You are a compassionate clinical AI. Respond in ${langName}.\n\nCondition: ${data.condition}\nSymptoms: ${(data.symptoms||[]).join(', ')}\nRisk: ${data.riskLevel||data.risk}\nAdvice: ${data.medicalAdvice||data.advice}\n\nProvide:\n**What is this condition?**\n**Possible causes**\n**Recommended precautions**\n**When to see a doctor**\n\nKeep it clear, friendly, and patient-appropriate.`;
    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body:JSON.stringify({model:'claude-sonnet-4-20250514',max_tokens:1000,messages:[{role:'user',content:prompt}]})
    });
    const result = await resp.json();
    const text = result.content?.map(b=>b.text||'').join('')||'';
    renderExplainMarkdown(c, text);
  } catch {
    const cond=data.condition||'General Health Concern';
    const advice=data.medicalAdvice||data.advice||'Please consult a doctor.';
    const risk=(data.riskLevel||data.risk||'low').toLowerCase();
    const urg=risk==='emergency'?'Call 108 immediately.':risk==='high'?'See a doctor today.':risk==='medium'?'Consult a doctor within 1-2 days.':'Monitor and see a doctor if it persists.';
    renderExplainMarkdown(c, `**What is this condition?**\n${cond}. ${advice}\n\n**Recommended precautions**\nRest and stay hydrated. Avoid strenuous activity.\n\n**When to see a doctor**\n${urg}`);
  }
}

function renderExplainMarkdown(c, text) {
  const parts = text.split(/\*\*(.+?)\*\*/).filter(Boolean);
  let html = '';
  for (let i=0; i<parts.length; i+=2) {
    const h = parts[i]; const b = parts[i+1]||'';
    if (h&&b) html+=`<div class="explain-section"><h4>${sectionIcon(h)} ${h}</h4><p>${b.trim().replace(/\n/g,'<br>')}</p></div>`;
    else if(h) html+=`<p style="margin-bottom:8px">${h}</p>`;
  }
  c.innerHTML = html||`<p>${text}</p>`;
}
function sectionIcon(h) {
  h=h.toLowerCase();
  if(h.includes('what')) return '🔬';
  if(h.includes('cause')) return '⚕️';
  if(h.includes('precaution')||h.includes('recommendation')) return '✅';
  if(h.includes('doctor')||h.includes('when')) return '🏥';
  return '📋';
}

// ═══════════════════ DASHBOARD PERSISTENCE ═══════════════════
function restoreDashboardResult() {
  try {
    const saved = localStorage.getItem('hg_last_result');
    if (!saved) return;
    const data = JSON.parse(saved);
    if (!data?.condition) return;
    state.lastResult = data;
    const card=$('dashLastResult'); const content=$('dashLastResultContent');
    if (!card||!content) return;
    const risk=(data.riskLevel||data.risk||'low').toLowerCase();
    const t=data.timestamp?new Date(data.timestamp).toLocaleString('en-IN',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'}):'';
    const syms=(data.symptoms||[]).slice(0,4).join(', ')||'N/A';
    content.innerHTML=`
      <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap;padding:4px 0">
        <div class="risk-badge ${risk}" style="font-size:13px">${riskIcon(risk)} ${risk.charAt(0).toUpperCase()+risk.slice(1)} Risk</div>
        <span style="font-size:18px;font-weight:700;color:var(--text)">${data.condition}</span>
      </div>
      <div style="font-size:13px;color:var(--text2);margin-top:8px">Symptoms: ${syms} &nbsp;•&nbsp; 🕐 ${t}</div>
      ${data.medicalAdvice?`<div style="font-size:13px;color:var(--text2);margin-top:6px;padding:10px 12px;background:var(--surface2);border-radius:8px;border-left:3px solid var(--teal)">${data.medicalAdvice}</div>`:''}`;
    card.classList.remove('hidden');
  } catch(e) { console.warn('Could not restore dashboard',e); }
}

// ═══════════════════ HISTORY ═══════════════════
function loadHistory() {
  try { state.history=JSON.parse(localStorage.getItem('hg_history')||'[]'); } catch { state.history=[]; }
}
function saveHistory() {
  try { localStorage.setItem('hg_history',JSON.stringify(state.history)); } catch {}
}
function saveCurrentToHistory() {
  if (!state.lastResult) return;
  if (state.history.findIndex(h=>h.timestamp===state.lastResult.timestamp)===-1) {
    state.history.unshift(state.lastResult);
    if (state.history.length>50) state.history.pop();
    saveHistory(); renderDashHistory(); updateStatCounts();
    showToast('Saved to history!','success');
  } else showToast('Already saved.','info');
}
function renderDashHistory() {
  const list=$('dashHistoryList');
  if (!list) return;
  if (!state.history.length) { list.innerHTML='<div class="empty-state-mini">No predictions yet.</div>'; return; }
  list.innerHTML=state.history.slice(0,4).map(h=>{
    const risk=(h.riskLevel||h.risk||'low').toLowerCase();
    const date=new Date(h.timestamp).toLocaleDateString('en-IN',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'});
    return `<div class="history-mini-item">
      <div class="mini-risk-dot" style="background:${riskColor(risk)}"></div>
      <span class="mini-condition">${truncate(h.condition,40)}</span>
      <span class="mini-date">${date}</span>
    </div>`;
  }).join('');
}
function renderHistoryList() {
  const list=$('historyList'); if (!list) return;
  if (!state.history.length) {
    list.innerHTML=`<div class="empty-state"><div class="empty-icon">📋</div><h3>No history yet</h3><p>Completed predictions will appear here.</p><button class="btn btn-primary" onclick="switchSection('diagnose')">Start Diagnosis</button></div>`;
    return;
  }
  list.innerHTML=state.history.map((h,idx)=>{
    const risk=(h.riskLevel||h.risk||'low').toLowerCase();
    const syms=(h.symptoms||[]).slice(0,4).join(', ');
    const date=new Date(h.timestamp).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'});
    return `<div class="history-item">
      <div class="history-risk-bar ${risk}"></div>
      <div class="history-content">
        <div class="history-condition">${h.condition}</div>
        <div class="history-symptoms">Symptoms: ${syms||'N/A'}</div>
        <div class="history-meta">
          <span class="risk-badge ${risk}" style="font-size:11px">${risk} risk</span>
          <span class="history-date">🕐 ${date}</span>
          ${h.patientAge?`<span class="history-date">Age: ${h.patientAge}</span>`:''}
        </div>
      </div>
      <div class="history-actions">
        <button class="btn btn-ghost" style="padding:6px 10px;font-size:12px" onclick="deleteHistory(${idx})">🗑️ Delete</button>
      </div>
    </div>`;
  }).join('');
}
function deleteHistory(idx) { state.history.splice(idx,1); saveHistory();renderHistoryList();renderDashHistory();updateStatCounts(); }
function clearHistory() { if(!confirm('Clear all history?'))return; state.history=[]; saveHistory();renderHistoryList();renderDashHistory();updateStatCounts(); }
function updateStatCounts() { if($('totalPredCount')) $('totalPredCount').textContent=state.history.length; }

// ═══════════════════ PDF ═══════════════════
function generatePdf() {
  $('pdfModal').classList.add('hidden');
  const data=state.lastResult;
  if (!data) { showToast('No result to export','error'); return; }
  const risk=(data.riskLevel||data.risk||'low').toLowerCase();
  const now=new Date().toLocaleString('en-IN');
  const symptoms=(data.symptoms||[]).join(', ')||'N/A';
  const q=data.questionnaire||{};
  const conditions=(data.possibleConditions||data.conditions||[]).slice(0,5).map((c,i)=>
    `<tr><td>${i+1}. ${c.name}</td><td><b style="color:${riskColor(c.risk?.toLowerCase())}">${c.risk||'N/A'}</b></td></tr>`).join('');
  const advice=data.medicalAdvice||data.advice||'N/A';
  const qRows=Object.entries(q).filter(([k])=>!k.startsWith('_')&&q[k]).map(([k,v])=>
    `<tr><td style="text-transform:capitalize">${k.replace(/_/g,' ')}</td><td>${v}</td></tr>`).join('');
  const html=`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>HealthGuard AI Report</title>
<style>body{font-family:'Segoe UI',sans-serif;color:#0F172A;margin:0;font-size:13px}.header{background:linear-gradient(135deg,#0EA5E9,#0D9488);color:white;padding:28px 32px}.header h1{font-size:22px;margin:0 0 4px;font-weight:700}.header p{font-size:12px;opacity:.85;margin:0}.body{padding:28px 32px}.section{margin-bottom:22px}h2{font-size:14px;font-weight:700;color:#0EA5E9;border-bottom:1.5px solid #E2E8F0;padding-bottom:6px;margin-bottom:12px}table{width:100%;border-collapse:collapse}th{background:#F8FAFC;text-align:left;padding:8px 12px;font-size:12px;color:#475569;border-bottom:1px solid #E2E8F0}td{padding:8px 12px;border-bottom:1px solid #F1F5F9}.risk{display:inline-block;padding:3px 10px;border-radius:12px;font-size:11px;font-weight:700;text-transform:uppercase}.risk.low{background:#DCFCE7;color:#059669}.risk.medium{background:#FEF3C7;color:#D97706}.risk.high{background:#FEE2E2;color:#DC2626}.risk.emergency{background:#FFE4E6;color:#9F1239}.advice-box{background:#F0F9FF;border-left:3px solid #0EA5E9;padding:14px 16px;border-radius:0 8px 8px 0;line-height:1.6}.disclaimer{font-size:11px;color:#94A3B8;margin-top:32px;padding-top:16px;border-top:1px solid #E2E8F0}.meta-row{display:flex;gap:32px;flex-wrap:wrap}.meta-item label{display:block;font-size:11px;color:#94A3B8;font-weight:600;text-transform:uppercase;letter-spacing:.5px;margin-bottom:2px}.meta-item value{font-size:14px;font-weight:600}</style></head><body>
<div class="header"><h1>🏥 HealthGuard AI — Medical Report</h1><p>AI-Generated • ${now} • Not a substitute for professional medical advice</p></div>
<div class="body">
<div class="section"><h2>Patient</h2><div class="meta-row">
<div class="meta-item"><label>Age</label><value>${data.patientAge||'—'}</value></div>
<div class="meta-item"><label>Gender</label><value>${data.patientGender||'—'}</value></div>
<div class="meta-item"><label>Date</label><value>${now}</value></div></div></div>
<div class="section"><h2>Symptoms</h2><p>${symptoms}</p></div>
<div class="section"><h2>Primary Diagnosis</h2><table><tr><th>Condition</th><th>Risk</th><th>Confidence</th></tr>
<tr><td><b>${data.condition}</b></td><td><span class="risk ${risk}">${risk}</span></td><td>${data.confidence||'Medium'}</td></tr></table></div>
${conditions?`<div class="section"><h2>Differential Diagnosis</h2><table><tr><th>Condition</th><th>Risk</th></tr>${conditions}</table></div>`:''}
${qRows?`<div class="section"><h2>Consultation Notes</h2><table><tr><th>Field</th><th>Answer</th></tr>${qRows}</table></div>`:''}
<div class="section"><h2>Medical Advice</h2><div class="advice-box">${advice}</div></div>
<div class="disclaimer">⚕️ This AI report is for information only. Always consult a qualified healthcare professional.</div>
</div></body></html>`;
  const blob=new Blob([html],{type:'text/html'});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');
  a.href=url; a.download=`HealthGuard-Report-${Date.now()}.html`; a.click();
  URL.revokeObjectURL(url);
  showToast('Report downloaded!','success');
}

// ═══════════════════ CHAT UI HELPERS ═══════════════════
function addDoctorMessage(text, scroll=true) {
  const c=$('chatMessages'); if (!c) return;
  const div=document.createElement('div'); div.className='msg-doctor';
  const fmt=text.replace(/\*\*(.*?)\*\*/g,'<strong>$1</strong>');
  div.innerHTML=`<div class="msg-doctor-avatar">👨‍⚕️</div><div class="msg-bubble-doctor">${fmt}</div>`;
  c.appendChild(div);
  if (scroll) c.scrollTop=c.scrollHeight;
}
function addUserMessage(text) {
  const c=$('chatMessages'); if (!c) return;
  const div=document.createElement('div'); div.className='msg-user';
  div.innerHTML=`<div class="msg-bubble-user">${text}</div>`;
  c.appendChild(div); c.scrollTop=c.scrollHeight;
}
function showTypingIndicator() {
  const c=$('chatMessages'); if (!c) return;
  if ($('typingIndicator')) return;
  const div=document.createElement('div'); div.className='typing-indicator'; div.id='typingIndicator';
  div.innerHTML=`<div class="msg-doctor-avatar">👨‍⚕️</div><div class="typing-dots"><div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div></div>`;
  c.appendChild(div); c.scrollTop=c.scrollHeight;
}
function removeTypingIndicator() { $('typingIndicator')?.remove(); }

function renderQuickAnswers(answers) {
  const c=$('quickAnswerBtns'); if (!c) return;
  c.innerHTML=answers.map(a=>
    `<button class="quick-ans-btn" onclick="window.selectQuickAnswer('${a.replace(/'/g,"\\'")}')">${a}</button>`
  ).join('');
}

function enableChatInput(enable) {
  const inp=$('chatInputField'); const btn=$('chatSendBtn');
  if (inp) { inp.disabled=!enable; if(enable) setTimeout(()=>inp.focus(),150); }
  if (btn) btn.disabled=!enable;
}

function updateProgressUI() {
  // Hide the Q/10 counter — show natural status instead
  const badge = $('interviewProgressBadge');
  const label = $('progressLabel');
  const fill  = $('progressBarFill');
  const pct   = $('progressPct');

  const asked = iv.questionsAsked;
  const max   = Math.max(iv.questionQueue.length + asked, 1);
  const p     = Math.min(Math.round((asked / max) * 85), 85); // cap at 85 until done

  if (badge) badge.style.display = 'none'; // hide Q 1/10 badge
  if (fill)  fill.style.width = `${p}%`;
  if (pct)   pct.textContent  = `${p}%`;
  const progressByLang = { en: 'Gathering details...', sn: 'Ndiri kuunganidza ruzivo...', nd: 'Ngibutha ulwazi...' };
  if (label) label.textContent = progressByLang[state.lang] || progressByLang.en;
}

function updateAnswersSidebar(key, value) {
  const c=$('collectedAnswersDisplay'); if (!c) return;
  c.querySelector('.answers-empty')?.remove();
  // Update existing row if key matches
  const existing = [...c.querySelectorAll('.answer-row')].find(r => r.querySelector('.answer-key')?.textContent.toLowerCase() === key.toLowerCase());
  if (existing) {
    existing.querySelector('.answer-val').textContent = value;
    return;
  }
  const row=document.createElement('div'); row.className='answer-row';
  row.innerHTML=`<span class="answer-key">${key}</span><span class="answer-val">${value}</span>`;
  c.appendChild(row);
}

// ═══════════════════ UI HELPERS ═══════════════════
function showLoading(show) {
  const o=$('loadingOverlay');
  if (o) show?o.classList.remove('hidden'):o.classList.add('hidden');
}

function callDoctorNow() {
  $('doctorModal')?.classList.add('hidden');
  window.location.href = `tel:${DOCTOR_CONTACT.phone}`;
}

function openDoctorWhatsApp() {
  $('doctorModal')?.classList.add('hidden');
  const msg = encodeURIComponent('Hello doctor, I need a consultation based on my symptom analysis.');
  const number = DOCTOR_CONTACT.whatsapp.replace(/\+/g, '');
  window.open(`https://wa.me/${number}?text=${msg}`, '_blank');
}

function openDoctorBooking() {
  $('doctorModal')?.classList.add('hidden');
  window.open(DOCTOR_CONTACT.bookingUrl, '_blank');
}

let toastT;
function showToast(msg,type='info') {
  let t=document.getElementById('toast');
  if (!t) {
    t=document.createElement('div'); t.id='toast';
    t.style.cssText='position:fixed;bottom:24px;right:24px;z-index:9999;padding:12px 20px;border-radius:10px;font-size:14px;font-weight:600;box-shadow:0 8px 24px rgba(0,0,0,0.18);transition:all 0.3s;font-family:"DM Sans",sans-serif;max-width:300px;line-height:1.4;';
    document.body.appendChild(t);
  }
  const cols={success:['#DCFCE7','#059669'],error:['#FEE2E2','#DC2626'],info:['#E0F2FE','#0EA5E9']};
  const [bg,c]=cols[type]||cols.info;
  t.style.background=bg; t.style.color=c;
  t.textContent=msg; t.style.opacity='1'; t.style.transform='translateY(0)';
  clearTimeout(toastT);
  toastT=setTimeout(()=>{t.style.opacity='0';t.style.transform='translateY(8px)';},3500);
}
function riskColor(r) { return {low:'#059669',medium:'#D97706',high:'#DC2626',emergency:'#9F1239'}[r]||'#0EA5E9'; }
function truncate(s,n) { return s&&s.length>n?s.slice(0,n-3)+'...':s; }

function savePrefs() { try{localStorage.setItem('hg_prefs',JSON.stringify({lang:state.lang,theme:state.theme}));}catch{} }
function loadPrefs() {
  try {
    const p = JSON.parse(localStorage.getItem('hg_prefs') || '{}');
    if (p.lang === 'ta') p.lang = 'sn';
    if (['en', 'sn', 'nd'].includes(p.lang)) state.lang = p.lang;
    if (p.theme) state.theme = p.theme;
  } catch {}
  document.documentElement.setAttribute('data-theme',state.theme);
  if ($('langLabel')) $('langLabel').textContent=state.lang.toUpperCase();
}

window.switchSection=switchSection;
window.deleteHistory=deleteHistory;
window.selectQuickAnswer=function(val){ $('chatInputField').value=val; submitChatAnswer(); };

// ═══════════════════════════════════════════════════════════════
//  HEART RATE SENSOR — rPPG Feature
//  Camera-based pulse detection with live UI feedback
// ═══════════════════════════════════════════════════════════════

const HR_TRANSLATIONS = {
  en: {
    cardTitle:       'Heart Rate Sensor',
    statusReady:     'Ready',
    statusScanning:  'Scanning...',
    statusDone:      'Complete',
    statusError:     'Error',
    instructionMain: 'Place your finger gently over your camera lens',
    instructionSub:  'The system will analyze blood flow to calculate your heart rate using rPPG technology',
    startBtn:        'Start Heart Rate Scan',
    demoBtn:         'Demo Mode',
    progressLabel:   'Analyzing pulse signal...',
    cancelBtn:       '✕ Cancel',
    remeasure:       '↺ Remeasure',
    included:        'Included in diagnosis',
    qualityLabel:    'Signal Quality:',
    bpmLabel:        'Heart Rate',
    videoLabel:      '🔴 Recording...',
    demoLabel:       '🟡 Demo Mode',
  },
  sn: {
    cardTitle:       'Sensor yeHeart Rate',
    statusReady:     'Yakagadzirira',
    statusScanning:  'Kuyera...',
    statusDone:      'Zvaitwa',
    statusError:     'Kukanganisa',
    instructionMain: 'Isa munwe wako zvinyoronyoro pamusoro pe lens yekamera',
    instructionSub:  'System ichaongorora kufamba kweropa kuti iwerenge kurova kwemoyo nerPPG',
    startBtn:        'Tanga Kuyera Heart Rate',
    demoBtn:         'Demo Mode',
    progressLabel:   'Kuongorora chiratidzo chepulse...',
    cancelBtn:       '✕ Kanzura',
    remeasure:       '↺ Yerazve',
    included:        'Yabatanidzwa mu diagnosis',
    qualityLabel:    'Hunhu hwechiratidzo:',
    bpmLabel:        'Kurova Kwemoyo',
    videoLabel:      '🔴 Kurekodha...',
    demoLabel:       '🟡 Demo Mode',
  },
  nd: {
    cardTitle:       'I-Sensor yeHeart Rate',
    statusReady:     'Sekulungile',
    statusScanning:  'Kuyahlolwa...',
    statusDone:      'Kuphelile',
    statusError:     'Iphutha',
    instructionMain: 'Beka umunwe wakho kancane phezu kwe lens yekhamera',
    instructionSub:  'I-system izahlaziya ukugeleza kwegazi ukubala inhliziyo usebenzisa i-rPPG',
    startBtn:        'Qala Ukuhlola Heart Rate',
    demoBtn:         'Demo Mode',
    progressLabel:   'Kuhlaziywa isignali ye pulse...',
    cancelBtn:       '✕ Khansela',
    remeasure:       '↺ Linganisa futhi',
    included:        'Kufakiwe ku diagnosis',
    qualityLabel:    'Ikhwalithi yesignali:',
    bpmLabel:        'Ukushaya Kwenhliziyo',
    videoLabel:      '🔴 Kuyarekhodwa...',
    demoLabel:       '🟡 Demo Mode',
  }
};

const HR_RISK_LABELS = {
  normal:  { en: 'Normal',      sn: 'Normal',               nd: 'Kujwayelekile' },
  low:     { en: 'Low Normal',  sn: 'Low Normal',           nd: 'Kuphansi Kancane' },
  warning: { en: 'Warning',     sn: 'Yambiro',              nd: 'Isexwayiso' },
  high:    { en: 'Elevated',    sn: 'Yakakwira',            nd: 'Kuphezulu' },
  poor:    { en: 'Poor Signal', sn: 'Signal Isina Kusimba', nd: 'Isignali Engelamandla' },
};

// Waveform canvas renderer
const hrWaveform = {
  canvas: null,
  ctx: null,
  data: [],
  maxPoints: 80,
  animFrame: null,

  init() {
    this.canvas = $('hrWaveformCanvas');
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.data = [];
    this.draw();
  },

  push(value) {
    this.data.push(value);
    if (this.data.length > this.maxPoints) this.data.shift();
  },

  generateFakePoint() {
    const t = Date.now() / 1000;
    const beat = Math.sin(2 * Math.PI * 1.2 * t) * 20;
    const noise = (Math.random() - 0.5) * 6;
    return 25 + beat + noise;
  },

  draw() {
    if (!this.ctx || !this.canvas) return;
    const w = this.canvas.offsetWidth || 300;
    const h = 50;
    this.canvas.width = w;
    this.canvas.height = h;

    const ctx = this.ctx;
    ctx.clearRect(0, 0, w, h);

    // Background grid lines
    ctx.strokeStyle = 'rgba(239,68,68,0.1)';
    ctx.lineWidth = 1;
    for (let y = 10; y < h; y += 12) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
    }

    if (this.data.length < 2) {
      this.animFrame = requestAnimationFrame(() => this.draw());
      return;
    }

    // Draw waveform
    ctx.beginPath();
    ctx.strokeStyle = '#EF4444';
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';

    const stepX = w / this.maxPoints;
    this.data.forEach((val, i) => {
      const x = i * stepX;
      const y = h - (val / 50) * h;
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Gradient fill under curve
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, 'rgba(239,68,68,0.2)');
    grad.addColorStop(1, 'rgba(239,68,68,0)');
    ctx.lineTo(w, h); ctx.lineTo(0, h); ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();

    this.animFrame = requestAnimationFrame(() => this.draw());
  },

  stop() {
    if (this.animFrame) cancelAnimationFrame(this.animFrame);
  }
};

// HR Sensor state
const hrState = {
  scanning: false,
  mediaStream: null,
  progressTimer: null,
  waveformTimer: null,
  duration: 15,
};

function t(key) {
  const lang = ['sn', 'nd'].includes(state.lang) ? state.lang : 'en';
  return HR_TRANSLATIONS[lang][key] || HR_TRANSLATIONS.en[key] || key;
}

function setupHeartRateSensor() {
  // Ensure elements exist
  if (!$('hrStartBtn')) return;

  $('hrStartBtn').addEventListener('click', () => startHeartRateScan(false));
  $('hrDemoBtn').addEventListener('click', () => startHeartRateScan(true));
  $('hrCancelBtn').addEventListener('click', cancelHeartRateScan);
  $('hrRemeasureBtn').addEventListener('click', resetHeartRateUI);

  applyHeartRateTranslations();
}

function applyHeartRateTranslations() {
  const ids = {
    hrCardTitle: 'cardTitle', hrStatusLabel: 'statusReady',
    hrInstructionMain: 'instructionMain', hrInstructionSub: 'instructionSub',
    hrStartBtnLabel: 'startBtn', hrDemoBtnLabel: 'demoBtn',
    hrProgressLabel: 'progressLabel', hrCancelBtn: 'cancelBtn',
    hrRemeasureLabel: 'remeasure', hrIncludedLabel: 'included',
    hrQualityLabel: 'qualityLabel',
  };
  Object.entries(ids).forEach(([id, key]) => {
    if ($(id)) $(id).textContent = t(key);
  });
}

function setHrStatus(type, labelKey) {
  const pill = $('hrStatusPill');
  if (!pill) return;
  pill.className = `hr-status-pill ${type}`;
  if ($('hrStatusLabel')) $('hrStatusLabel').textContent = t(labelKey);
}

function showHrState(name) {
  ['hrIdleState', 'hrScanningState', 'hrResultState'].forEach(id => {
    const el = $(id);
    if (el) el.classList.add('hidden');
  });
  const target = $(`hr${name.charAt(0).toUpperCase() + name.slice(1)}State`);
  if (target) target.classList.remove('hidden');
}

async function startHeartRateScan(isDemo = false) {
  hrState.scanning = true;
  hrState.duration = 15;

  showHrState('scanning');
  setHrStatus('scanning', 'statusScanning');

  // Start camera preview (for non-demo)
  if (!isDemo) {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      hrState.mediaStream = stream;
      const video = $('hrVideoPreview');
      if (video) {
        video.srcObject = stream;
        if ($('hrVideoLabel')) $('hrVideoLabel').textContent = t('videoLabel');
      }
    } catch (err) {
      // Camera permission denied — continue to demo fallback or show error
      console.warn('Camera access denied:', err.message);
      if ($('hrVideoLabel')) $('hrVideoLabel').textContent = '⚠️ Camera unavailable';
    }
  } else {
    if ($('hrVideoPreview')) $('hrVideoPreview').style.filter = 'sepia(0.5) hue-rotate(60deg)';
    if ($('hrVideoLabel')) $('hrVideoLabel').textContent = t('demoLabel');
  }

  // Initialize waveform
  hrWaveform.init();
  hrState.waveformTimer = setInterval(() => {
    hrWaveform.push(hrWaveform.generateFakePoint());
  }, 60);

  // Progress bar countdown
  const fillEl = $('hrProgressFill');
  const secEl  = $('hrProgressSec');
  let elapsed = 0;
  hrState.progressTimer = setInterval(() => {
    elapsed++;
    const pct = (elapsed / hrState.duration) * 100;
    if (fillEl) fillEl.style.width = `${pct}%`;
    const remaining = hrState.duration - elapsed;
    if (secEl) secEl.textContent = `${remaining}s remaining`;
    if (elapsed >= hrState.duration) clearInterval(hrState.progressTimer);
  }, 1000);

  // Call backend
  try {
    const resp = await fetch('/measure-heart-rate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ demo: isDemo, duration: hrState.duration, camera: 0 }),
    });
    const data = await resp.json();
    displayHeartRateResult(data);
  } catch (err) {
    displayHeartRateResult({ success: false, error: err.message });
  }
}

function cancelHeartRateScan() {
  stopHrScan();
  resetHeartRateUI();
}

function stopHrScan() {
  hrState.scanning = false;
  clearInterval(hrState.progressTimer);
  clearInterval(hrState.waveformTimer);
  hrWaveform.stop();
  if (hrState.mediaStream) {
    hrState.mediaStream.getTracks().forEach(t => t.stop());
    hrState.mediaStream = null;
  }
  const video = $('hrVideoPreview');
  if (video) { video.srcObject = null; video.style.filter = ''; }
}

function resetHeartRateUI() {
  stopHrScan();
  state.heartRate = null;
  showHrState('idle');
  setHrStatus('', 'statusReady');
  if ($('hrProgressFill')) $('hrProgressFill').style.width = '0%';
  applyHeartRateTranslations();
}

function displayHeartRateResult(data) {
  stopHrScan();

  if (!data.success) {
    // Show error in idle state with message
    showHrState('idle');
    setHrStatus('error', 'statusError');
    const instrMain = $('hrInstructionMain');
    if (instrMain) instrMain.textContent = `⚠️ ${data.error || 'Measurement failed. Try again.'}`;
    showToast(data.error || 'Heart rate scan failed', 'error');
    return;
  }

  // Store in app state
  state.heartRate = {
    bpm:        data.bpm_rounded || Math.round(data.bpm),
    risk:       data.risk || 'normal',
    category:   data.category || 'Normal',
    quality:    data.signal_quality || 'good',
    message:    data.message || '',
    message_sn: data.message_sn || data.message_ta || data.message || '',
    message_nd: data.message_nd || data.message || '',
    demo:       data.demo || false,
  };

  // Update UI
  const bpm = state.heartRate.bpm;
  const risk = state.heartRate.risk;
  const lang = state.lang;

  if ($('hrBpmValue'))   $('hrBpmValue').textContent   = bpm;
  if ($('hrCategory'))   $('hrCategory').textContent   = data.category || 'Normal';
  if ($('hrQualityValue')) $('hrQualityValue').textContent = capitalise(data.signal_quality || 'good');
  if ($('hrMessage')) {
    const hrMsgByLang = {
      en: data.message,
      sn: state.heartRate.message_sn,
      nd: state.heartRate.message_nd,
    };
    $('hrMessage').textContent = hrMsgByLang[lang] || hrMsgByLang.en;
  }

  // BPM circle color class
  const circle = $('hrBpmCircle');
  if (circle) {
    circle.className = 'hr-bpm-circle';
    if (risk === 'warning') circle.classList.add('warning');
    if (risk === 'high')    circle.classList.add('high');
  }

  // Risk badge
  const badge = $('hrRiskBadge');
  if (badge) {
    const riskLabel = HR_RISK_LABELS[risk]?.[lang] || HR_RISK_LABELS[risk]?.en || 'Normal';
    badge.textContent = riskLabel;
    badge.className = 'hr-risk-badge';
    if (risk === 'warning') badge.classList.add('warning');
    if (risk === 'high')    badge.classList.add('high');
    if (data.signal_quality === 'poor') badge.classList.add('poor');
  }

  // Included label
  if ($('hrIncludedLabel')) $('hrIncludedLabel').textContent = t('included');
  if ($('hrRemeasureLabel')) $('hrRemeasureLabel').textContent = t('remeasure');

  setHrStatus('success', 'statusDone');
  showHrState('result');

  showToast(`Heart rate: ${bpm} BPM${data.demo ? ' (demo)' : ''}`, 'success');
}

function capitalise(str) {
  return str ? str.charAt(0).toUpperCase() + str.slice(1) : '';
}

// ─── Language toggle hook: re-apply HR translations ────────────────────────
// Patch into existing lang toggle
const _origSetupLangToggle = window.setupLangToggle;
function patchLangForHeartRate() {
  const btn = $('langToggle');
  if (!btn) return;
  btn.addEventListener('click', () => {
    setTimeout(() => {
      applyHeartRateTranslations();
      // Update result message language if result visible
      if (state.heartRate && !$('hrResultState')?.classList.contains('hidden')) {
        const msgByLang = {
          en: state.heartRate.message,
          sn: state.heartRate.message_sn,
          nd: state.heartRate.message_nd,
        };
        const msg = msgByLang[state.lang] || msgByLang.en;
        if ($('hrMessage')) $('hrMessage').textContent = msg;
        const risk = state.heartRate.risk;
        if ($('hrRiskBadge')) {
          $('hrRiskBadge').textContent =
            HR_RISK_LABELS[risk]?.[state.lang] || HR_RISK_LABELS[risk]?.en || 'Normal';
        }
      }
      // Update result section HR label
      if ($('resultHrLabel')) $('resultHrLabel').textContent = t('bpmLabel');
    }, 50);
  });
}

// ─── Inject HR data into diagnosis request ────────────────────────────────
// Override the analysis call to include heart rate
const _origRunAnalysis = window.runAnalysis;

// Patch displayResults to show heart rate in result card
function injectHeartRateIntoResults() {
  const card = $('resultHeartRateCard');
  if (!card) return;
  if (!state.heartRate) {
    card.classList.add('hidden');
    return;
  }
  card.classList.remove('hidden');
  const lang = ['sn', 'nd'].includes(state.lang) ? state.lang : 'en';
  const bpm  = state.heartRate.bpm;
  const risk = state.heartRate.risk;

  if ($('resultHrLabel')) $('resultHrLabel').textContent = t('bpmLabel');
  if ($('resultHrBpm'))   $('resultHrBpm').textContent   = `${bpm} BPM`;

  const riskEl = $('resultHrRisk');
  if (riskEl) {
    const riskLabel = HR_RISK_LABELS[risk]?.[lang] || 'Normal';
    riskEl.textContent = riskLabel;
    riskEl.style.cssText = '';
    const colorMap = {
      normal:  { bg:'var(--green-light)', color:'var(--green)' },
      low:     { bg:'var(--green-light)', color:'var(--green)' },
      warning: { bg:'var(--yellow-light)',color:'var(--yellow)' },
      high:    { bg:'var(--red-light)',   color:'var(--red)' },
    };
    const c = colorMap[risk] || colorMap.normal;
    riskEl.style.background = c.bg;
    riskEl.style.color = c.color;
    riskEl.style.padding = '2px 8px';
    riskEl.style.borderRadius = '12px';
    riskEl.style.fontWeight = '700';
    riskEl.style.fontSize = '11px';
    riskEl.style.textTransform = 'uppercase';
  }
}

// Monkey-patch showStep to inject HR into results
const _origShowStep = showStep;
window.showStep = function(step) {
  _origShowStep(step);
  if (step === 'results') {
    setTimeout(injectHeartRateIntoResults, 100);
  }
};

// Monkey-patch buildAnalysisText or enrich questionnaire with heart rate
// We patch the interview submission to include heart rate
const _origSkipToAnalysis = window.skipToAnalysis;
const _origRunAIAnalysis = window.runAIAnalysis;

// Enrich combined text with heart rate before sending
function enrichTextWithHeartRate(text) {
  if (!state.heartRate) return text;
  const hr = state.heartRate;
  return `${text}. Heart Rate: ${hr.bpm} BPM (${hr.category}, ${hr.risk} risk, signal quality: ${hr.quality}).`;
}

// Patch fetch calls in interview submission
const _origFetch = window.fetch;
window.fetch = function(url, opts) {
  if (typeof url === 'string' && (url.includes('/api/analyze') || url.includes('/api/interview')) && opts && opts.body && state.heartRate) {
    try {
      const body = JSON.parse(opts.body);
      // Inject heart_rate field
      body.heart_rate = state.heartRate.bpm;
      body.heart_rate_risk = state.heartRate.risk;
      body.heart_rate_category = state.heartRate.category;
      // Enrich text if present
      if (body.text) body.text = enrichTextWithHeartRate(body.text);
      opts.body = JSON.stringify(body);
    } catch(e) {}
  }
  return _origFetch.apply(this, arguments);
};

// Init HR language patch after DOM load
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(patchLangForHeartRate, 200);
});
