import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import LoginScreen from '../screens/LoginScreen';
import DriverHomeScreen from '../screens/DriverHomeScreen';
import RenterHomeScreen from '../screens/RenterHomeScreen';
import BookingScreen from '../screens/BookingScreen';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  const { user, loading } = useAuth();

  if (loading) return null; // could render a splash screen here

  return (
    <NavigationContainer>
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
            <Stack.Screen name="RenterHome" component={RenterHomeScreen} options={{ headerShown: true, title: 'FlotteGuard' }} />
            <Stack.Screen name="Booking" component={BookingScreen} options={{ headerShown: true, title: 'Book vehicle' }} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
