const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const triageRoutes = require('./routes/triageRoutes');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({
    ok: true,
    service: 'VitalSync AI backend',
    ai_configured: Boolean(process.env.OPENROUTER_API_KEY),
  });
});

app.use('/triage', triageRoutes);

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    message: 'Unexpected server error',
  });
});

app.listen(PORT, () => {
  console.log(`VitalSync AI backend running on http://localhost:${PORT}`);
});
