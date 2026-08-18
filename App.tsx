import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from './context/AuthContext';
import { FinanceProvider } from './context/FinanceContext';
import { AuthScreen } from './screens/AuthScreen';
import { AddTransactionScreen } from './screens/AddTransactionScreen';
import { MainTabs } from './navigation/MainTabs';
import { colors } from './lib/theme';

const Stack = createNativeStackNavigator();

function Splash() {
  const pulse = useRef(new Animated.Value(0.85)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.85, duration: 600, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  return (
    <View style={splashStyles.wrap}>
      <Animated.View style={[splashStyles.logo, { transform: [{ scale: pulse }] }]}>
        <Ionicons name="wallet" size={30} color={colors.accentDark} />
      </Animated.View>
      <Text style={splashStyles.name}>Ledgerly</Text>
      <Text style={splashStyles.sub}>Unlocking your vault…</Text>
    </View>
  );
}

const splashStyles = StyleSheet.create({
  wrap: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 66,
    height: 66,
    borderRadius: 20,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  name: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '900',
  },
  sub: {
    color: colors.textSub,
    fontSize: 13,
    marginTop: 6,
  },
});

function AuthenticatedApp() {
  return (
    <FinanceProvider>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Tabs" component={MainTabs} />
        <Stack.Screen
          name="AddTransaction"
          component={AddTransactionScreen}
          options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
        />
      </Stack.Navigator>
    </FinanceProvider>
  );
}

function Root() {
  const { user, initializing } = useAuth();

  if (initializing) return <Splash />;
  if (!user) return <AuthScreen />;
  return <AuthenticatedApp />;
}

const navTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: colors.accent,
    background: colors.bg,
    card: colors.surface,
    text: colors.text,
    border: colors.border,
    notification: colors.rose,
  },
};

export default function App() {
  // Preload icon fonts for web — required so icons render correctly.
  const [fontsLoaded] = useFonts({
    ...Ionicons.font,
    ...MaterialCommunityIcons.font,
  });

  if (!fontsLoaded) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <NavigationContainer theme={navTheme}>
          <AuthProvider>
            <Root />
          </AuthProvider>
          <StatusBar style="light" />
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
