const API_BASE = 'http://localhost:4000';

export async function analyzeTriage(payload) {
  const response = await fetch(`${API_BASE}/triage/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error('Failed to analyze symptoms');
  }

  return response.json();
}
