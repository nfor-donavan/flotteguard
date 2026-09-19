import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { colors } from '../theme';

export default function LoginScreen() {
  const { login } = useAuth();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleLogin() {
    setError('');
    setSubmitting(true);
    try {
      await login(phone, password);
      // Navigation switches automatically based on user.role once
      // AuthContext's user is set - see AppNavigator.js.
    } catch (err) {
      setError('Could not sign in. Check your phone number and password.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <View style={styles.container}>
      <Image source={require('../../assets/icon.png')} style={styles.logo} />
      <Text style={styles.title}>FlotteGuard</Text>
      <Text style={styles.subtitle}>Driver & renter access</Text>

      <TextInput
        style={styles.input}
        placeholder="Phone number"
        placeholderTextColor={colors.inkMuted}
        keyboardType="phone-pad"
        value={phone}
        onChangeText={setPhone}
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        placeholderTextColor={colors.inkMuted}
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={submitting}>
        <Text style={styles.buttonText}>{submitting ? 'Signing in…' : 'Sign in'}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.navy, alignItems: 'center', justifyContent: 'center', padding: 24 },
  logo: { width: 72, height: 72, borderRadius: 18, marginBottom: 16 },
  title: { color: colors.white, fontSize: 24, fontWeight: '800' },
  subtitle: { color: 'rgba(255,255,255,0.7)', marginBottom: 28 },
  input: {
    width: '100%',
    backgroundColor: colors.white,
    borderRadius: 10,
    padding: 14,
    marginBottom: 12,
    fontSize: 15
  },
  button: { width: '100%', backgroundColor: colors.gold, borderRadius: 10, padding: 14, alignItems: 'center', marginTop: 6 },
  buttonText: { color: colors.navy, fontWeight: '700', fontSize: 15 },
  error: { color: '#FF8A80', marginBottom: 8, fontSize: 13 }
});
