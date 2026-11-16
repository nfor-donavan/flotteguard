import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';

export default function TopBar({ title }) {
  const { mode, colors, toggleTheme } = useTheme();
  const { lang, toggleLanguage } = useLanguage();
  const { logout } = useAuth();

  return (
    <View style={[styles.container, { borderBottomColor: colors.border }]}>
      <View style={styles.brand}>
        <Image source={require('../../assets/icon.png')} style={styles.logo} />
        <Text style={[styles.title, { color: colors.ink }]}>{title}</Text>
      </View>
      <View style={styles.controls}>
        <TouchableOpacity style={[styles.pill, { borderColor: colors.border, backgroundColor: colors.card }]} onPress={toggleTheme}>
          <Text style={styles.pillText}>{mode === 'light' ? '🌙' : '☀️'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.pill, { borderColor: colors.border, backgroundColor: colors.card }]} onPress={toggleLanguage}>
          <Text style={[styles.pillText, { color: colors.ink }]}>{lang === 'en' ? 'FR' : 'EN'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.pill, { borderColor: colors.border, backgroundColor: colors.card }]} onPress={logout}>
          <Text style={[styles.pillText, { color: colors.danger }]}>⏻</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1
  },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logo: { width: 30, height: 30, borderRadius: 9 },
  title: { fontSize: 18, fontWeight: '800' },
  controls: { flexDirection: 'row', gap: 8 },
  pill: { width: 36, height: 36, borderRadius: 18, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  pillText: { fontSize: 13, fontWeight: '700' }
});
