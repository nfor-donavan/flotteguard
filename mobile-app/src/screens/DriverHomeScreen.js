import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Image, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';
import SelectField from '../components/SelectField';
import ScreenContainer from '../components/ScreenContainer';
import TopBar from '../components/TopBar';

export default function DriverHomeScreen() {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const { user } = useAuth();
  const styles = createStyles(colors);

  const [vehicles, setVehicles] = useState([]);
  const [vehicleId, setVehicleId] = useState('');
  const [expectedRevenue, setExpectedRevenue] = useState('');
  const [submittedRevenue, setSubmittedRevenue] = useState('');
  const [fuelExpense, setFuelExpense] = useState('0');
  const [receiptImage, setReceiptImage] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // Drivers only ever pick from active taxis in their own agency - the
    // tenant scoping middleware on the backend already guarantees this
    // list can't include another tenant's vehicles.
    client.get('/vehicles', { params: { status: 'Active_Taxi' } }).then((res) => setVehicles(res.data.vehicles));
  }, []);

  async function pickReceipt() {
    const result = await ImagePicker.launchCameraAsync({ quality: 0.5, base64: false });
    if (!result.canceled) setReceiptImage(result.assets[0]);
  }

  async function uploadReceiptIfNeeded() {
    if (!receiptImage) return undefined;

    const { data: signed } = await client.get('/daily-logs/upload-signature');
    const formData = new FormData();
    formData.append('file', { uri: receiptImage.uri, type: 'image/jpeg', name: 'receipt.jpg' });
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

  async function handleSubmit() {
    if (!vehicleId || !expectedRevenue || !submittedRevenue) {
      Alert.alert(t('missing_info'), t('missing_info_driver'));
      return;
    }
    setSubmitting(true);
    try {
      const fuelReceiptUrl = await uploadReceiptIfNeeded();
      await client.post('/daily-logs', {
        vehicleId,
        driverName: user.name,
        expectedRevenue: Number(expectedRevenue),
        submittedRevenue: Number(submittedRevenue),
        fuelExpense: Number(fuelExpense),
        fuelReceiptUrl
      });
      Alert.alert(t('submitted_title'), t('submitted_message'));
      setSubmittedRevenue('');
      setFuelExpense('0');
      setReceiptImage(null);
    } catch (err) {
      Alert.alert(t('error_title'), err.response?.data?.error || t('error_generic'));
    } finally {
      setSubmitting(false);
    }
  }

  const vehicleOptions = vehicles.map((v) => ({ value: v._id, label: `${v.plateNumber} — ${v.makeModel}` }));

  return (
    <ScreenContainer edges={['top', 'bottom']}>
      <TopBar title={t('app_name')} />
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>{t('daily_turn_in')}</Text>
        <Text style={styles.subtitle}>{t('greeting_turn_in', { name: user?.name })}</Text>

        <SelectField label={t('vehicle')} value={vehicleId} options={vehicleOptions} onSelect={setVehicleId} placeholder={t('select_your_vehicle')} />

        <Text style={styles.label}>{t('expected_revenue')}</Text>
        <TextInput
          style={styles.input}
          value={expectedRevenue}
          onChangeText={setExpectedRevenue}
          keyboardType="numeric"
          placeholder="10000"
          placeholderTextColor={colors.inkMuted}
        />

        <Text style={styles.label}>{t('submitted_revenue')}</Text>
        <TextInput
          style={styles.input}
          value={submittedRevenue}
          onChangeText={setSubmittedRevenue}
          keyboardType="numeric"
          placeholder="9500"
          placeholderTextColor={colors.inkMuted}
        />

        <Text style={styles.label}>{t('fuel_expense')}</Text>
        <TextInput style={styles.input} value={fuelExpense} onChangeText={setFuelExpense} keyboardType="numeric" placeholderTextColor={colors.inkMuted} />

        <TouchableOpacity style={styles.secondaryButton} onPress={pickReceipt}>
          <Text style={styles.secondaryButtonText}>{receiptImage ? t('retake_receipt') : t('photograph_receipt')}</Text>
        </TouchableOpacity>
        {receiptImage && <Image source={{ uri: receiptImage.uri }} style={styles.preview} />}

        <TouchableOpacity style={styles.button} onPress={handleSubmit} disabled={submitting}>
          <Text style={styles.buttonText}>{submitting ? t('submitting') : t('submit_turn_in')}</Text>
        </TouchableOpacity>
      </ScrollView>
    </ScreenContainer>
  );
}

function createStyles(colors) {
  return StyleSheet.create({
    container: { padding: 20, flexGrow: 1 },
    title: { fontSize: 22, fontWeight: '800', color: colors.ink },
    subtitle: { color: colors.inkMuted, marginBottom: 20 },
    label: { fontSize: 13, fontWeight: '600', color: colors.inkMuted, marginBottom: 6, marginTop: 12 },
    input: { backgroundColor: colors.card, borderRadius: 10, padding: 12, fontSize: 15, borderWidth: 1, borderColor: colors.border, color: colors.ink },
    secondaryButton: { marginTop: 16, padding: 12, borderRadius: 10, borderWidth: 1, borderColor: colors.ink, alignItems: 'center' },
    secondaryButtonText: { color: colors.ink, fontWeight: '600' },
    preview: { width: '100%', height: 160, borderRadius: 10, marginTop: 12 },
    button: { marginTop: 20, backgroundColor: colors.gold, borderRadius: 10, padding: 14, alignItems: 'center' },
    buttonText: { color: colors.navy, fontWeight: '700', fontSize: 15 }
  });
}
