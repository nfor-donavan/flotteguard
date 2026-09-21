import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, KeyboardAvoidingView, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import ScreenContainer from '../components/ScreenContainer';

export default function LoginScreen() {
  const { login } = useAuth();
  const { mode, colors, toggleTheme } = useTheme();
  const { lang, toggleLanguage, t } = useLanguage();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const year = new Date().getFullYear();

  async function handleLogin() {
    setError('');
    setSubmitting(true);
    try {
      await login(phone, password);
      // Navigation switches automatically based on user.role once
      // AuthContext's user is set - see AppNavigator.js.
    } catch (err) {
      setError(t('login_error'));
    } finally {
      setSubmitting(false);
    }
  }

  const styles = createStyles(colors);

  return (
    // The hero panel is always the navy brand gradient regardless of
    // light/dark mode - like the admin dashboard's login page, brand
    // identity stays constant while the rest of the app follows the
    // person's theme choice. statusBarStyle is forced to "light" here for
    // exactly that reason: this screen's background never changes.
    <ScreenContainer statusBarStyle="light" edges={['top']} style={{ backgroundColor: colors.navy }}>
      <View style={styles.controlsRow}>
        <TouchableOpacity style={styles.pill} onPress={toggleTheme}>
          <Text style={styles.pillText}>{mode === 'light' ? '🌙' : '☀️'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.pill} onPress={toggleLanguage}>
          <Text style={styles.pillText}>{lang === 'en' ? 'FR' : 'EN'}</Text>
        </TouchableOpacity>
      </View>

      <LinearGradient
        colors={[colors.navy, '#081426']}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.hero}
      >
        <Image source={require('../../assets/icon.png')} style={styles.logo} />
        <Text style={styles.title}>{t('app_name')}</Text>
        <Text style={styles.subtitle}>{t('login_tagline')}</Text>
      </LinearGradient>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.formSheet}>
        <TextInput
          style={styles.input}
          placeholder={t('phone_number')}
          placeholderTextColor={colors.inkMuted}
          keyboardType="phone-pad"
          value={phone}
          onChangeText={setPhone}
        />
        <TextInput
          style={styles.input}
          placeholder={t('password')}
          placeholderTextColor={colors.inkMuted}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
        {error ? <Text style={styles.error}>{error}</Text> : null}

        <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={submitting}>
          <Text style={styles.buttonText}>{submitting ? t('signing_in') : t('sign_in')}</Text>
        </TouchableOpacity>

        <Text style={styles.copyright}>{t('copyright', { year })}</Text>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

function createStyles(colors) {
  return StyleSheet.create({
    controlsRow: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      gap: 8,
      paddingHorizontal: 20,
      paddingTop: 8
    },
    pill: {
      width: 34,
      height: 34,
      borderRadius: 17,
      backgroundColor: 'rgba(255,255,255,0.1)',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.2)',
      alignItems: 'center',
      justifyContent: 'center'
    },
    pillText: { fontSize: 13, fontWeight: '700', color: colors.white },
    hero: { alignItems: 'center', paddingTop: 24, paddingBottom: 40 },
    logo: { width: 76, height: 76, borderRadius: 20, marginBottom: 14 },
    title: { color: colors.white, fontSize: 26, fontWeight: '800' },
    subtitle: { color: 'rgba(255,255,255,0.7)', marginTop: 4 },
    formSheet: {
      flex: 1,
      backgroundColor: colors.card,
      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,
      padding: 24,
      paddingTop: 32
    },
    input: {
      backgroundColor: colors.background,
      borderRadius: 10,
      padding: 14,
      marginBottom: 12,
      fontSize: 15,
      color: colors.ink,
      borderWidth: 1,
      borderColor: colors.border
    },
    button: { backgroundColor: colors.gold, borderRadius: 10, padding: 14, alignItems: 'center', marginTop: 6 },
    buttonText: { color: colors.navy, fontWeight: '700', fontSize: 15 },
    error: { color: colors.danger, marginBottom: 8, fontSize: 13 },
    copyright: { textAlign: 'center', color: colors.inkMuted, fontSize: 12, marginTop: 'auto', paddingTop: 24 }
  });
}
