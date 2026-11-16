import React from 'react';
import { View, Text, Modal, TouchableOpacity, TouchableWithoutFeedback, ScrollView, Linking, StyleSheet } from 'react-native';
import Avatar from './Avatar';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { radius } from '../theme';

/** Bottom-sheet style driver profile with a call button. */
export default function DriverSheet({ driver, onClose }) {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const styles = createStyles(colors);
  if (!driver) return null;
  const profile = driver.driverProfile || {};

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.root}>
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={styles.backdrop} />
        </TouchableWithoutFeedback>
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.header}>
              <Avatar uri={driver.photoUrl} name={driver.name} size={92} />
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{driver.name}</Text>
                {profile.yearsExperience != null && (
                  <Text style={styles.meta}>{t('years_experience', { years: profile.yearsExperience })}</Text>
                )}
                {driver.available === false && (
                  <Text style={[styles.meta, { color: colors.danger, fontWeight: '700' }]}>{t('driver_unavailable')}</Text>
                )}
              </View>
            </View>

            {profile.languages?.length ? (
              <View style={styles.chips}>
                {profile.languages.map((l) => (
                  <View key={l} style={styles.chip}>
                    <Text style={styles.chipText}>{l}</Text>
                  </View>
                ))}
              </View>
            ) : null}

            {profile.bio ? (
              <>
                <Text style={styles.sectionTitle}>{t('about_driver')}</Text>
                <Text style={styles.bio}>{profile.bio}</Text>
              </>
            ) : null}

            {driver.phone ? (
              <TouchableOpacity style={styles.callButton} onPress={() => Linking.openURL(`tel:${driver.phone.replace(/\s/g, '')}`)}>
                <Text style={styles.callText}>📞  {t('call_driver', { name: driver.name.split(' ')[0] })}</Text>
              </TouchableOpacity>
            ) : null}
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeText}>{t('close')}</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function createStyles(colors) {
  return StyleSheet.create({
    root: { flex: 1, justifyContent: 'flex-end' },
    backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(5,12,24,0.55)' },
    sheet: {
      backgroundColor: colors.card,
      borderTopLeftRadius: radius.xl,
      borderTopRightRadius: radius.xl,
      padding: 22,
      paddingBottom: 30,
      maxHeight: '80%'
    },
    handle: { alignSelf: 'center', width: 44, height: 5, borderRadius: 3, backgroundColor: colors.border, marginBottom: 18 },
    header: { flexDirection: 'row', alignItems: 'center', gap: 16 },
    name: { color: colors.ink, fontSize: 22, fontWeight: '800' },
    meta: { color: colors.inkMuted, marginTop: 4 },
    chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 16 },
    chip: { backgroundColor: colors.goldSoft, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 },
    chipText: { color: colors.ink, fontWeight: '600', fontSize: 12.5 },
    sectionTitle: { color: colors.ink, fontWeight: '800', fontSize: 15, marginTop: 20, marginBottom: 6 },
    bio: { color: colors.inkMuted, lineHeight: 21 },
    callButton: { marginTop: 22, backgroundColor: colors.gold, borderRadius: radius.md, padding: 15, alignItems: 'center' },
    callText: { color: colors.navy, fontWeight: '800', fontSize: 15 },
    closeButton: { marginTop: 10, padding: 12, alignItems: 'center' },
    closeText: { color: colors.inkMuted, fontWeight: '700' }
  });
}
