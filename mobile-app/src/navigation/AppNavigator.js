import React from 'react';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import LoginScreen from '../screens/LoginScreen';
import DriverHomeScreen from '../screens/DriverHomeScreen';
import RenterHomeScreen from '../screens/RenterHomeScreen';
import BookingScreen from '../screens/BookingScreen';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  const { user, loading } = useAuth();
  const { mode, colors } = useTheme();
  const { t } = useLanguage();

  if (loading) return null; // could render a splash screen here

  // Keeps react-navigation's own chrome (screen transition backgrounds,
  // native back-swipe overlays) in sync with the app's light/dark mode
  // instead of only theming what's inside each screen.
  const navTheme = {
    ...(mode === 'dark' ? DarkTheme : DefaultTheme),
    colors: {
      ...(mode === 'dark' ? DarkTheme.colors : DefaultTheme.colors),
      background: colors.background,
      card: colors.card,
      text: colors.ink,
      border: colors.border,
      primary: colors.gold
    }
  };

  return (
    <NavigationContainer theme={navTheme}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!user ? (
          <Stack.Screen name="Login" component={LoginScreen} />
        ) : user.role === 'driver' ? (
          <Stack.Screen name="DriverHome" component={DriverHomeScreen} />
        ) : (
          // Renter mode is also the default fallback for owner/manager
          // accounts testing the app - a real build would give staff
          // roles their own read-only screens here.
          <>
            <Stack.Screen name="RenterHome" component={RenterHomeScreen} />
            <Stack.Screen
              name="Booking"
              component={BookingScreen}
              options={{
                headerShown: true,
                title: t('book_vehicle'),
                headerStyle: { backgroundColor: colors.navy },
                headerTintColor: '#fff',
                headerTitleStyle: { fontWeight: '800' }
              }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
