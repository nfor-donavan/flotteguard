import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTheme } from '../context/ThemeContext';

function toIsoDate(date) {
  // Local calendar date, not UTC - avoids the classic bug where picking
  // "Oct 10" near a timezone boundary submits Oct 9 to the backend.
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * value: Date | null. onChange receives a Date.
 */
export default function DateField({ label, value, onChange, minimumDate }) {
  const { colors } = useTheme();
  const [showPicker, setShowPicker] = useState(false);
  const styles = createStyles(colors);

  function handleChange(event, selected) {
    setShowPicker(Platform.OS === 'ios'); // iOS picker stays open inline; Android closes itself
    if (selected) onChange(selected);
  }

  return (
    <View style={{ marginTop: 12 }}>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity style={styles.button} onPress={() => setShowPicker(true)}>
        <Text style={styles.buttonText}>{value ? toIsoDate(value) : 'Select a date'}</Text>
      </TouchableOpacity>
      {showPicker && (
        <DateTimePicker
          value={value || new Date()}
          mode="date"
          display={Platform.OS === 'ios' ? 'inline' : 'default'}
          minimumDate={minimumDate}
          onChange={handleChange}
        />
      )}
    </View>
  );
}

export { toIsoDate };

function createStyles(colors) {
  return StyleSheet.create({
    label: { fontSize: 13, fontWeight: '600', color: colors.inkMuted, marginBottom: 6 },
    button: { backgroundColor: colors.card, borderRadius: 10, padding: 12, borderWidth: 1, borderColor: colors.border },
    buttonText: { fontSize: 15, color: colors.ink }
  });
}
