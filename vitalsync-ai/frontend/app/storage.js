import AsyncStorage from '@react-native-async-storage/async-storage';

const HISTORY_KEY = 'vitalsync_history';

export async function loadHistory() {
  const raw = await AsyncStorage.getItem(HISTORY_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export async function addHistoryItem(item) {
  const current = await loadHistory();
  const next = [item, ...current].slice(0, 50);
  await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(next));
  return next;
}
