import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, FlatList, ScrollView, TouchableOpacity, RefreshControl, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import client from '../api/client';
import ScreenContainer from '../components/ScreenContainer';
import TopBar from '../components/TopBar';
import Photo from '../components/Photo';
import DriverCard from '../components/DriverCard';
import DriverSheet from '../components/DriverSheet';
import { radius, shadow } from '../theme';

const statusKey = { Available: 'status_available', Rented: 'status_rented' };

export default function RenterHomeScreen({ navigation }) {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const { user } = useAuth();
  const styles = createStyles(colors);
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeDriver, setActiveDriver] = useState(null);

  const load = useCallback(async () => {
    // Don't filter by status: 'Available' here - that field is a coarse
    // label, not a per-date availability check. A vehicle sitting at
    // "Rented" is only busy for whatever specific dates someone else
    // booked, which the availability check on the Booking screen verifies.
    // Only exclude vehicles that structurally can't be rented at all:
    // dedicated taxis and anything in maintenance.
    const [vRes, dRes] = await Promise.allSettled([client.get('/vehicles'), client.get('/drivers')]);
    if (vRes.status === 'fulfilled') {
      setVehicles(vRes.value.data.vehicles.filter((v) => v.status !== 'Active_Taxi' && v.status !== 'Maintenance'));
    }
    if (dRes.status === 'fulfilled') setDrivers(dRes.value.data.drivers);
  }, []);

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, [load]);

  async function onRefresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  const firstName = (user?.name || '').split(' ')[0];

  const header = (
    <View>
      <View style={styles.greeting}>
        <Text style={styles.hello}>{t('hello_name', { name: firstName })}</Text>
        <Text style={styles.helloSub}>{t('home_subtitle')}</Text>
      </View>

      {drivers.length > 0 && (
        <View style={{ marginBottom: 24 }}>
          <Text style={styles.sectionTitle}>{t('meet_drivers')}</Text>
          <Text style={styles.sectionSub}>{t('meet_drivers_subtitle')}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 6 }}>
            {drivers.map((d) => (
              <DriverCard key={d._id} driver={d} onPress={() => setActiveDriver(d)} />
            ))}
          </ScrollView>
        </View>
      )}

      <Text style={[styles.sectionTitle, { marginBottom: 12 }]}>{t('available_vehicles')}</Text>
    </View>
  );

  return (
    <ScreenContainer edges={['top', 'bottom']}>
      <TopBar title={t('app_name')} />
      <FlatList
        data={loading ? [] : vehicles}
        keyExtractor={(v) => v._id}
        ListHeaderComponent={header}
        contentContainerStyle={{ paddingBottom: 28 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.gold} colors={[colors.gold]} />}
        renderItem={({ item }) => (
          <TouchableOpacity activeOpacity={0.9} style={styles.card} onPress={() => navigation.navigate('Booking', { vehicle: item })}>
            <Photo uri={item.photos?.[0]} style={styles.cardPhoto} iconSize={48} />
            <LinearGradient colors={['transparent', 'rgba(5,12,24,0.85)']} style={styles.scrim} />
            <View style={styles.chip}>
              <View style={[styles.chipDot, { backgroundColor: item.status === 'Available' ? colors.success : colors.gold }]} />
              <Text style={styles.chipText}>{t(statusKey[item.status] || 'status_available')}</Text>
            </View>
            {item.photos?.length > 1 && (
              <View style={[styles.chip, { left: undefined, right: 14 }]}>
                <Text style={styles.chipText}>📷 {item.photos.length}</Text>
              </View>
            )}
            <View style={styles.cardText}>
              <Text style={styles.cardTitle}>{item.makeModel}</Text>
              <Text style={styles.cardSubtitle}>{item.plateNumber}</Text>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          loading ? (
            <>
              <View style={[styles.card, { backgroundColor: colors.skeleton }]} />
              <View style={[styles.card, { backgroundColor: colors.skeleton }]} />
            </>
          ) : (
            <Text style={styles.empty}>{t('no_vehicles_available')}</Text>
          )
        }
      />
      <DriverSheet driver={activeDriver} onClose={() => setActiveDriver(null)} />
    </ScreenContainer>
  );
}

function createStyles(colors) {
  return StyleSheet.create({
    greeting: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 22 },
    hello: { fontSize: 26, fontWeight: '800', color: colors.ink },
    helloSub: { color: colors.inkMuted, marginTop: 4, fontSize: 15 },
    sectionTitle: { fontSize: 18, fontWeight: '800', color: colors.ink, paddingHorizontal: 20 },
    sectionSub: { color: colors.inkMuted, paddingHorizontal: 20, marginTop: 2 },
    card: {
      height: 220,
      marginHorizontal: 20,
      marginBottom: 16,
      borderRadius: radius.lg,
      overflow: 'hidden',
      backgroundColor: colors.card,
      ...shadow(2)
    },
    cardPhoto: { ...StyleSheet.absoluteFillObject, width: undefined, height: undefined },
    scrim: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 110 },
    chip: {
      position: 'absolute',
      top: 14,
      left: 14,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: 'rgba(5,12,24,0.55)',
      borderRadius: 999,
      paddingHorizontal: 10,
      paddingVertical: 5
    },
    chipDot: { width: 7, height: 7, borderRadius: 4 },
    chipText: { color: '#fff', fontSize: 12, fontWeight: '700' },
    cardText: { position: 'absolute', left: 18, right: 18, bottom: 14 },
    cardTitle: { color: '#fff', fontSize: 20, fontWeight: '800' },
    cardSubtitle: { color: 'rgba(255,255,255,0.78)', marginTop: 2, fontWeight: '600' },
    empty: { color: colors.inkMuted, textAlign: 'center', marginTop: 40 }
  });
}
