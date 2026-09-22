import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import client from '../api/client';
import ScreenContainer from '../components/ScreenContainer';
import TopBar from '../components/TopBar';

export default function RenterHomeScreen({ navigation }) {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const styles = createStyles(colors);
  const [vehicles, setVehicles] = useState([]);

  useEffect(() => {
    // Don't filter by status: 'Available' here - that field is a coarse
    // label, not a per-date availability check. A vehicle sitting at
    // "Rented" is only busy for whatever specific dates someone else
    // booked - it can still be perfectly bookable for a different date
    // range, which is exactly what the availability check on the Booking
    // screen verifies. Filtering strictly on "Available" was hiding real
    // rental candidates just because they had an unrelated booking on the
    // books. Only exclude vehicles that structurally can't be rented at
    // all: dedicated taxis and anything in maintenance.
    client.get('/vehicles').then((res) => {
      const rentable = res.data.vehicles.filter((v) => v.status !== 'Active_Taxi' && v.status !== 'Maintenance');
      setVehicles(rentable);
    });
  }, []);

  return (
    <ScreenContainer edges={['top', 'bottom']}>
      <TopBar title={t('app_name')} />
      <View style={styles.container}>
        <Text style={styles.title}>{t('available_vehicles')}</Text>
        <FlatList
          data={vehicles}
          keyExtractor={(v) => v._id}
          contentContainerStyle={{ paddingBottom: 20 }}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('Booking', { vehicle: item })}>
              <Text style={styles.cardTitle}>{item.makeModel}</Text>
              <Text style={styles.cardSubtitle}>{item.plateNumber}</Text>
            </TouchableOpacity>
          )}
          ListEmptyComponent={<Text style={styles.empty}>{t('no_vehicles_available')}</Text>}
        />
      </View>
    </ScreenContainer>
  );
}

function createStyles(colors) {
  return StyleSheet.create({
    container: { flex: 1, padding: 20 },
    title: { fontSize: 22, fontWeight: '800', color: colors.ink, marginBottom: 16 },
    card: { backgroundColor: colors.card, borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: colors.border },
    cardTitle: { fontSize: 16, fontWeight: '700', color: colors.ink },
    cardSubtitle: { color: colors.inkMuted, marginTop: 4 },
    empty: { color: colors.inkMuted, textAlign: 'center', marginTop: 40 }
  });
}
