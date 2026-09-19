import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { colors } from '../theme';
import client from '../api/client';

export default function RenterHomeScreen({ navigation }) {
  const [vehicles, setVehicles] = useState([]);

  useEffect(() => {
    client.get('/vehicles', { params: { status: 'Available' } }).then((res) => setVehicles(res.data.vehicles));
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Available vehicles</Text>
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
        ListEmptyComponent={<Text style={styles.empty}>No vehicles available right now.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.paper, padding: 20 },
  title: { fontSize: 22, fontWeight: '800', color: colors.ink, marginBottom: 16 },
  card: { backgroundColor: colors.white, borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#E4E7EF' },
  cardTitle: { fontSize: 16, fontWeight: '700', color: colors.ink },
  cardSubtitle: { color: colors.inkMuted, marginTop: 4 },
  empty: { color: colors.inkMuted, textAlign: 'center', marginTop: 40 }
});
