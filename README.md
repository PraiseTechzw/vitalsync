# HealthGuard AI v4.2

AI-assisted symptom triage web app with multilingual support, smart interview flow, heart-rate scan integration, and clinical handoff options.

## Quick Start
```bash
npm install
cp .env.example .env
# Add OPENAI_API_KEY in .env (optional, fallback works without it)
npm start
# Open http://localhost:3000
```

## Current Features

### Frontend
- Modern responsive UI with glass-style polish
- Symptom input via text, quick-select chips, and voice
- Smart adaptive interview (asks only missing details)
- Result view with risk level, confidence, and explanation
- Heart-rate scan module (camera/demo)
- History tracking and downloadable report
- **Talk to Doctor flow** on results page:
	- Call doctor
	- WhatsApp doctor
	- Book clinic visit
- Theme toggle (light/dark)
- Language support in app flow: English, Shona, Ndebele

### Backend
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/analyze` | POST | Main symptom triage analysis |
| `/api/interview` | POST | Interview-enriched analysis |
| `/api/explain` | POST | AI clinical explanation |
| `/api/history` | GET | Server prediction history |
| `/api/health` | GET | Service health/status |
| `/api/symptoms` | GET | Symptom + diagnosis data |
| `/measure-heart-rate` | POST | Heart rate measurement service |

## Data

`data/symptoms.json` now includes:
- `symptoms`: `en`, `ta`, `hi`, `sn`, `nd`
- `symptomMap`: `ta`, `hi`, `sn`, `nd`
- `diagnosisRules` with localized condition/advice entries for `sn` and `nd`
- `ui` labels for `en`, `ta`, `hi`, `sn`, `nd`

## Project Structure
```text
frontend/
	index.html
	styles.css
	app.js
backend/
	server.js
data/
	symptoms.json
heart_rate_detector.py
```

## Notes
- Without `OPENAI_API_KEY`, the app uses smart fallback triage logic.
- Doctor contact values are configured in `frontend/app.js` under `DOCTOR_CONTACT`.

## Disclaimer
This tool provides decision support only and is not a replacement for professional medical care.

