import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Avatar from './Avatar';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { radius, shadow } from '../theme';

const CARD_WIDTH = 156;

export default function DriverCard({ driver, onPress, selected = false }) {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const styles = createStyles(colors);
  const profile = driver.driverProfile || {};
  const unavailable = driver.available === false;

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      style={[styles.card, selected && styles.cardSelected, unavailable && { opacity: 0.45 }]}
    >
      <Avatar uri={driver.photoUrl} name={driver.name} size={CARD_WIDTH - 2} radius={0} />
      <View style={styles.body}>
        <Text style={styles.name} numberOfLines={1}>
          {driver.name}
        </Text>
        {profile.yearsExperience != null && (
          <Text style={styles.meta}>{t('years_experience', { years: profile.yearsExperience })}</Text>
        )}
        {unavailable ? (
          <Text style={[styles.meta, { color: colors.danger, fontWeight: '700' }]}>{t('driver_unavailable')}</Text>
        ) : profile.languages?.length ? (
          <Text style={styles.meta} numberOfLines={1}>
            {profile.languages.join(' · ')}
          </Text>
        ) : null}
      </View>
      {selected && (
        <View style={styles.tick}>
          <Text style={styles.tickText}>✓</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

function createStyles(colors) {
  return StyleSheet.create({
    card: {
      width: CARD_WIDTH,
      backgroundColor: colors.card,
      borderRadius: radius.lg,
      borderWidth: 2,
      borderColor: colors.border,
      overflow: 'hidden',
      marginRight: 12,
      ...shadow(1)
    },
    cardSelected: { borderColor: colors.gold },
    body: { padding: 12 },
    name: { color: colors.ink, fontSize: 15, fontWeight: '800' },
    meta: { color: colors.inkMuted, fontSize: 12, marginTop: 3 },
    tick: { position: 'absolute', top: 8, right: 8, width: 26, height: 26, borderRadius: 13, backgroundColor: colors.gold, alignItems: 'center', justifyContent: 'center' },
    tickText: { color: colors.navy, fontWeight: '900' }
  });
}
