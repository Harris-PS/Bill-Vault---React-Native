// App.tsx
import 'react-native-gesture-handler';
import 'react-native-url-polyfill/auto';
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { RootNavigator } from './src/navigation/RootNavigator';
import { useThemeStore } from './src/store/theme.store';
import {
  lightTheme,
  darkTheme,
  navigationLightTheme,
  navigationDarkTheme,
} from './src/theme';

function AppContent() {
  const { isDark } = useThemeStore();

  return (
    <PaperProvider theme={isDark ? darkTheme : lightTheme}>
      <NavigationContainer
        theme={isDark ? navigationDarkTheme : navigationLightTheme}
      >
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <RootNavigator />
      </NavigationContainer>
    </PaperProvider>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AppContent />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
