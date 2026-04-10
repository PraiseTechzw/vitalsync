import 'react-native-gesture-handler';
import React, { useMemo, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

import HomeScreen from './screens/HomeScreen';
import SymptomInputScreen from './screens/SymptomInputScreen';
import TriageChatScreen from './screens/TriageChatScreen';
import ResultScreen from './screens/ResultScreen';
import HeartRateScreen from './screens/HeartRateScreen';
import HistoryScreen from './screens/HistoryScreen';
import { STRINGS } from './app/i18n';

export const AppContext = React.createContext(null);

const Stack = createNativeStackNavigator();

export default function App() {
  const [language, setLanguage] = useState('en');
  const [heartRate, setHeartRate] = useState(null);

  const t = (key) => (STRINGS[language] && STRINGS[language][key]) || STRINGS.en[key] || key;

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      heartRate,
      setHeartRate,
      t,
    }),
    [language, heartRate]
  );

  return (
    <SafeAreaProvider>
      <AppContext.Provider value={value}>
        <NavigationContainer>
          <StatusBar style="light" />
          <Stack.Navigator
            initialRouteName="Home"
            screenOptions={{
              headerShown: false,
              animation: 'slide_from_right',
            }}
          >
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="SymptomInput" component={SymptomInputScreen} />
            <Stack.Screen name="TriageChat" component={TriageChatScreen} />
            <Stack.Screen name="Result" component={ResultScreen} />
            <Stack.Screen name="HeartRate" component={HeartRateScreen} />
            <Stack.Screen name="History" component={HistoryScreen} />
          </Stack.Navigator>
        </NavigationContainer>
      </AppContext.Provider>
    </SafeAreaProvider>
  );
}
