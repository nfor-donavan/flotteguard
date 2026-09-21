import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, FlatList } from 'react-native';
import { useTheme } from '../context/ThemeContext';

/**
 * options: [{ label, value }]
 */
export default function SelectField({ label, value, options, onSelect, placeholder = 'Select…' }) {
  const { colors } = useTheme();
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value);
  const styles = createStyles(colors);

  return (
    <View style={{ marginTop: 12 }}>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity style={styles.button} onPress={() => setOpen(true)}>
        <Text style={styles.buttonText}>{selected ? selected.label : placeholder}</Text>
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={() => setOpen(false)}>
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>{label}</Text>
            <FlatList
              data={options}
              keyExtractor={(item) => item.value}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.option}
                  onPress={() => {
                    onSelect(item.value);
                    setOpen(false);
                  }}
                >
                  <Text style={styles.optionText}>{item.label}</Text>
                </TouchableOpacity>
              )}
              ListEmptyComponent={<Text style={styles.empty}>Nothing available right now.</Text>}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

function createStyles(colors) {
  return StyleSheet.create({
    label: { fontSize: 13, fontWeight: '600', color: colors.inkMuted, marginBottom: 6 },
    button: { backgroundColor: colors.card, borderRadius: 10, padding: 12, borderWidth: 1, borderColor: colors.border },
    buttonText: { fontSize: 15, color: colors.ink },
    overlay: { flex: 1, backgroundColor: 'rgba(11,31,58,0.45)', justifyContent: 'flex-end' },
    sheet: { backgroundColor: colors.card, borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 20, maxHeight: '60%' },
    sheetTitle: { fontSize: 16, fontWeight: '700', color: colors.ink, marginBottom: 10 },
    option: { paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.border },
    optionText: { fontSize: 15, color: colors.ink },
    empty: { color: colors.inkMuted, textAlign: 'center', paddingVertical: 20 }
  });
}
