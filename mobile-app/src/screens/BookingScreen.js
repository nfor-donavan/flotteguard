import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Image, Alert, Switch } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import client from '../api/client';
import DateField, { toIsoDate } from '../components/DateField';
import ScreenContainer from '../components/ScreenContainer';
import PhotoGallery from '../components/PhotoGallery';
import DriverCard from '../components/DriverCard';
import DriverSheet from '../components/DriverSheet';
import { radius, shadow } from '../theme';

export default function BookingScreen({ route, navigation }) {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const styles = createStyles(colors);
  const { vehicle } = route.params;

  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientIdPassport, setClientIdPassport] = useState('');
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [idImage, setIdImage] = useState(null);
  const [availability, setAvailability] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [withDriver, setWithDriver] = useState(false);
  const [drivers, setDrivers] = useState([]);
  const [driversLoading, setDriversLoading] = useState(false);
  const [driverId, setDriverId] = useState(null);
  const [sheetDriver, setSheetDriver] = useState(null);

  // Driver availability for the chosen dates. Only runs once the person has
  // opted in to a chauffeur AND picked both dates.
  useEffect(() => {
    if (!withDriver || !startDate || !endDate) {
      setDrivers([]);
      return;
    }
    let cancelled = false;
    setDriversLoading(true);
    client
      .get('/drivers', { params: { startDate: toIsoDate(startDate), endDate: toIsoDate(endDate) } })
      .then((res) => {
        if (cancelled) return;
        setDrivers(res.data.drivers);
        // A previously chosen driver may be busy for the new dates.
        setDriverId((current) => (res.data.drivers.some((d) => d._id === current && d.available !== false) ? current : null));
      })
      .catch(() => !cancelled && setDrivers([]))
      .finally(() => !cancelled && setDriversLoading(false));
    return () => {
      cancelled = true;
    };
  }, [withDriver, startDate, endDate]);

  // Live availability preview, same endpoint the admin dashboard uses.
  // The actual double-booking guarantee lives server-side in the booking
  // transaction - this just avoids letting someone fill out the whole
  // form before finding out the dates don't work.
  useEffect(() => {
    if (!startDate || !endDate) {
      setAvailability(null);
      return;
    }
    const timeout = setTimeout(() => {
      client
        .get('/rentals/availability', {
          params: { vehicleId: vehicle._id, startDate: toIsoDate(startDate), endDate: toIsoDate(endDate) }
        })
        .then((res) => setAvailability(res.data.available))
        .catch(() => setAvailability(null));
    }, 300);
    return () => clearTimeout(timeout);
  }, [startDate, endDate]);

  async function pickIdPhoto() {
    const result = await ImagePicker.launchImageLibraryAsync({ quality: 0.6 });
    if (!result.canceled) setIdImage(result.assets[0]);
  }

  async function uploadIdIfNeeded() {
    if (!idImage) return undefined;
    const { data: signed } = await client.get('/rentals/upload-signature');
    const formData = new FormData();
    formData.append('file', { uri: idImage.uri, type: 'image/jpeg', name: 'id.jpg' });
    formData.append('api_key', signed.apiKey);
    formData.append('timestamp', signed.timestamp);
    formData.append('signature', signed.signature);
    formData.append('folder', signed.folder);

    const uploadRes = await fetch(`https://api.cloudinary.com/v1_1/${signed.cloudName}/image/upload`, {
      method: 'POST',
      body: formData
    });
    const uploadJson = await uploadRes.json();
    return uploadJson.secure_url;
  }

  async function handleBook() {
    if (!clientName || !clientPhone || !clientIdPassport || !startDate || !endDate) {
      Alert.alert(t('missing_info'), t('booking_missing_info'));
      return;
    }
    setSubmitting(true);
    try {
      const clientIdPhotoUrl = await uploadIdIfNeeded();
      await client.post('/rentals', {
        vehicleId: vehicle._id,
        clientName,
        clientPhone,
        clientIdPassport,
        clientIdPhotoUrl,
        driverId: withDriver && driverId ? driverId : undefined,
        startDate: toIsoDate(startDate),
        endDate: toIsoDate(endDate),
        securityDeposit: 0,
        totalCost: 0
      });
      Alert.alert(t('booked_title'), t('booked_message'));
      navigation.goBack();
    } catch (err) {
      // 409 means the transactional lock caught a conflict that slipped
      // past the live availability preview above (e.g. someone else booked
      // in the last few seconds) - this is the real guarantee, not the preview.
      const serverMessage = err.response?.data?.error || '';
      const message =
        err.response?.status === 409
          ? /driver/i.test(serverMessage)
            ? t('booking_failed_driver')
            : t('booking_failed_conflict')
          : serverMessage || t('booking_failed_generic');
      Alert.alert(t('booking_failed_title'), message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ScreenContainer edges={['bottom']}>
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }} keyboardShouldPersistTaps="handled">
        <PhotoGallery photos={vehicle.photos || []} height={260} />

        <View style={styles.container}>
          <Text style={styles.title}>{vehicle.makeModel}</Text>
          <Text style={styles.subtitle}>{vehicle.plateNumber}</Text>

          <Text style={styles.label}>{t('your_full_name')}</Text>
          <TextInput style={styles.input} value={clientName} onChangeText={setClientName} placeholderTextColor={colors.inkMuted} />

          <Text style={styles.label}>{t('phone_number')}</Text>
          <TextInput style={styles.input} value={clientPhone} onChangeText={setClientPhone} keyboardType="phone-pad" placeholderTextColor={colors.inkMuted} />

          <Text style={styles.label}>{t('id_passport_number')}</Text>
          <TextInput style={styles.input} value={clientIdPassport} onChangeText={setClientIdPassport} placeholderTextColor={colors.inkMuted} />

          <DateField label={t('start_date')} value={startDate} onChange={setStartDate} minimumDate={new Date()} />
          <DateField label={t('end_date')} value={endDate} onChange={setEndDate} minimumDate={startDate || new Date()} />

          {availability === true && <Text style={styles.availableText}>{t('available_for_dates')}</Text>}
          {availability === false && <Text style={styles.unavailableText}>{t('unavailable_for_dates')}</Text>}

          <View style={styles.chauffeurCard}>
            <View style={styles.chauffeurRow}>
              <View style={{ flex: 1, paddingRight: 12 }}>
                <Text style={styles.chauffeurTitle}>{t('add_driver')}</Text>
                <Text style={styles.chauffeurHint}>{t('add_driver_hint')}</Text>
              </View>
              <Switch
                value={withDriver}
                onValueChange={(v) => {
                  setWithDriver(v);
                  if (!v) setDriverId(null);
                }}
                trackColor={{ true: colors.gold, false: colors.border }}
                thumbColor="#fff"
              />
            </View>

            {withDriver && (!startDate || !endDate) && <Text style={styles.chauffeurHint}>{t('pick_dates_for_drivers')}</Text>}
            {withDriver && startDate && endDate && driversLoading && <Text style={styles.chauffeurHint}>{t('checking_drivers')}</Text>}
            {withDriver && startDate && endDate && !driversLoading && drivers.length === 0 && (
              <Text style={styles.chauffeurHint}>{t('no_drivers')}</Text>
            )}
          </View>
          {withDriver && drivers.length > 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -20 }} contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 12 }}>
              {drivers.map((d) => (
                <DriverCard
                  key={d._id}
                  driver={d}
                  selected={driverId === d._id}
                  onPress={() => (d.available === false ? setSheetDriver(d) : setDriverId(driverId === d._id ? null : d._id))}
                />
              ))}
            </ScrollView>
          )}
          {withDriver && driverId && (
            <TouchableOpacity onPress={() => setSheetDriver(drivers.find((d) => d._id === driverId))}>
              <Text style={styles.driverSelected}>
                {t('driver_selected', { name: drivers.find((d) => d._id === driverId)?.name || '' })}
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity style={styles.secondaryButton} onPress={pickIdPhoto}>
            <Text style={styles.secondaryButtonText}>{idImage ? t('retake_id_photo') : t('upload_id_photo')}</Text>
          </TouchableOpacity>
          {idImage && <Image source={{ uri: idImage.uri }} style={styles.preview} />}

          <TouchableOpacity
            style={[styles.button, availability === false && { opacity: 0.5 }]}
            onPress={handleBook}
            disabled={submitting || availability === false}
          >
            <Text style={styles.buttonText}>{submitting ? t('booking_ellipsis') : t('confirm_booking')}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
      <DriverSheet driver={sheetDriver} onClose={() => setSheetDriver(null)} />
    </ScreenContainer>
  );
}

function createStyles(colors) {
  return StyleSheet.create({
    container: { padding: 20 },
    title: { fontSize: 24, fontWeight: '800', color: colors.ink },
    subtitle: { color: colors.inkMuted, marginBottom: 16 },
    label: { fontSize: 13, fontWeight: '600', color: colors.inkMuted, marginBottom: 6, marginTop: 12 },
    input: { backgroundColor: colors.card, borderRadius: radius.sm, padding: 13, fontSize: 15, borderWidth: 1, borderColor: colors.border, color: colors.ink },
    availableText: { color: colors.success, fontSize: 13, marginTop: 10 },
    unavailableText: { color: colors.danger, fontSize: 13, marginTop: 10 },
    secondaryButton: { marginTop: 16, padding: 12, borderRadius: 10, borderWidth: 1, borderColor: colors.ink, alignItems: 'center' },
    secondaryButtonText: { color: colors.ink, fontWeight: '600' },
    preview: { width: '100%', height: 160, borderRadius: 10, marginTop: 12 },
    chauffeurCard: { marginTop: 22, backgroundColor: colors.card, borderRadius: radius.lg, padding: 16, borderWidth: 1, borderColor: colors.border, ...shadow(1) },
    chauffeurRow: { flexDirection: 'row', alignItems: 'center' },
    chauffeurTitle: { color: colors.ink, fontWeight: '800', fontSize: 15 },
    chauffeurHint: { color: colors.inkMuted, fontSize: 13, marginTop: 4, lineHeight: 18 },
    driverSelected: { color: colors.ink, fontWeight: '700', marginBottom: 4 },
    button: { marginTop: 20, backgroundColor: colors.gold, borderRadius: radius.md, padding: 15, alignItems: 'center', ...shadow(1) },
    buttonText: { color: colors.navy, fontWeight: '700', fontSize: 15 }
  });
}
