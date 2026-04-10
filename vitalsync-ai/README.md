# VitalSync AI MVP

VitalSync AI is a multilingual triage decision-support MVP for Zimbabwe.

## What this MVP includes

- Expo React Native mobile app (mobile-first)
- Express backend triage API
- AI layer (OpenRouter optional) + fallback rule engine (required)
- English + mock Shona/Ndebele support
- Glassmorphism-style UI
- Symptom to risk to action flow in under 2-5 minutes

## Folder structure

```text
vitalsync-ai/
  frontend/
    app/
    components/
    screens/
    api/
    App.js
  backend/
    routes/
    controllers/
    services/
    triage-engine/
    server.js
```

## Backend setup

```bash
cd backend
npm install
cp .env.example .env
npm run dev
```

Runs at: http://localhost:4000

### API endpoint

#### POST /triage/analyze

Request body:

```json
{
  "symptoms": "chest pain and shortness of breath",
  "heart_rate": 125,
  "language": "en"
}
```

Example response (high risk):

```json
{
  "success": true,
  "source": "rules",
  "data": {
    "risk_level": "High",
    "recommendation": "Seek urgent care",
    "explanation": "Chest pain with breathing trouble can be serious. Please seek urgent care now.",
    "language": "en"
  }
}
```

Example response (moderate, Shona):

```json
{
  "success": true,
  "source": "rules",
  "data": {
    "risk_level": "Pakati",
    "recommendation": "Enda kufamasi",
    "explanation": "You have symptoms that may need early treatment and close follow-up.",
    "language": "sn"
  }
}
```

Example response (low risk):

```json
{
  "success": true,
  "source": "rules",
  "data": {
    "risk_level": "Low",
    "recommendation": "Stay home",
    "explanation": "This looks mild right now. Rest, hydrate, and monitor symptoms.",
    "language": "en"
  }
}
```

## Frontend setup

```bash
cd frontend
npm install
npm start
```

Then run on:

- Android emulator/device
- iOS simulator/device
- Expo Go

## Demo script (2-5 min)

1. Open app -> Home.
2. Tap Start Health Check.
3. Enter symptoms or tap quick symptoms.
4. Continue to triage chat and answer 2-3 questions.
5. Tap Analyze Symptoms.
6. Show risk level + action + explanation.
7. Tap Generate Report.
8. Save and view entry in History.

## Product guardrail

This app provides triage support only. It does not provide diagnosis.
