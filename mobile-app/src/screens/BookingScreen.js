import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Image, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { colors } from '../theme';
import client from '../api/client';
import DateField, { toIsoDate } from '../components/DateField';

export default function BookingScreen({ route, navigation }) {
  const { vehicle } = route.params;
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientIdPassport, setClientIdPassport] = useState('');
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [idImage, setIdImage] = useState(null);
  const [availability, setAvailability] = useState(null);
  const [submitting, setSubmitting] = useState(false);

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
      Alert.alert('Missing info', 'Please fill in every field before booking.');
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
        startDate: toIsoDate(startDate),
        endDate: toIsoDate(endDate),
        securityDeposit: 0,
        totalCost: 0
      });
      Alert.alert('Booked', 'Your reservation is confirmed. The agency will contact you to arrange payment.');
      navigation.goBack();
    } catch (err) {
      // 409 means the transactional lock caught a conflict that slipped
      // past the live availability preview above (e.g. someone else booked
      // in the last few seconds) - this is the real guarantee, not the preview.
      const message =
        err.response?.status === 409
          ? 'That vehicle just got booked for part of these dates. Try different dates.'
          : err.response?.data?.error || 'Could not complete the booking.';
      Alert.alert('Booking failed', message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>{vehicle.makeModel}</Text>
      <Text style={styles.subtitle}>{vehicle.plateNumber}</Text>

      <Text style={styles.label}>Your full name</Text>
      <TextInput style={styles.input} value={clientName} onChangeText={setClientName} />

      <Text style={styles.label}>Phone number</Text>
      <TextInput style={styles.input} value={clientPhone} onChangeText={setClientPhone} keyboardType="phone-pad" />

      <Text style={styles.label}>ID / passport number</Text>
      <TextInput style={styles.input} value={clientIdPassport} onChangeText={setClientIdPassport} />

      <DateField label="Start date" value={startDate} onChange={setStartDate} minimumDate={new Date()} />
      <DateField label="End date" value={endDate} onChange={setEndDate} minimumDate={startDate || new Date()} />

      {availability === true && <Text style={styles.availableText}>Available for these dates.</Text>}
      {availability === false && <Text style={styles.unavailableText}>Already booked for part of these dates.</Text>}

      <TouchableOpacity style={styles.secondaryButton} onPress={pickIdPhoto}>
        <Text style={styles.secondaryButtonText}>{idImage ? 'Retake ID photo' : 'Upload ID / passport photo'}</Text>
      </TouchableOpacity>
      {idImage && <Image source={{ uri: idImage.uri }} style={styles.preview} />}

      <TouchableOpacity
        style={[styles.button, availability === false && { opacity: 0.5 }]}
        onPress={handleBook}
        disabled={submitting || availability === false}
      >
        <Text style={styles.buttonText}>{submitting ? 'Booking…' : 'Confirm booking'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: colors.paper, flexGrow: 1 },
  title: { fontSize: 22, fontWeight: '800', color: colors.ink },
  subtitle: { color: colors.inkMuted, marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', color: colors.inkMuted, marginBottom: 6, marginTop: 12 },
  input: { backgroundColor: colors.white, borderRadius: 10, padding: 12, fontSize: 15, borderWidth: 1, borderColor: '#E4E7EF' },
  availableText: { color: colors.success, fontSize: 13, marginTop: 10 },
  unavailableText: { color: colors.danger, fontSize: 13, marginTop: 10 },
  secondaryButton: { marginTop: 16, padding: 12, borderRadius: 10, borderWidth: 1, borderColor: colors.navy, alignItems: 'center' },
  secondaryButtonText: { color: colors.navy, fontWeight: '600' },
  preview: { width: '100%', height: 160, borderRadius: 10, marginTop: 12 },
  button: { marginTop: 20, backgroundColor: colors.gold, borderRadius: 10, padding: 14, alignItems: 'center' },
  buttonText: { color: colors.navy, fontWeight: '700', fontSize: 15 }
});
