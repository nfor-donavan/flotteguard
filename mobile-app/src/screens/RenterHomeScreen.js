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
    client.get('/vehicles', { params: { status: 'Available' } }).then((res) => setVehicles(res.data.vehicles));
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
