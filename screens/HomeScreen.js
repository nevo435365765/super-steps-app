// ============================================================================
//  HomeScreen — step counter + live map with friend markers
// ============================================================================

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import MapView, { Marker, Circle } from 'react-native-maps';
import * as cloud from '../cloud';
import { useAuth } from '../AuthContext';
import { useStepEngine } from '../stepEngine';
import { Avatar } from '../components';
import { COLORS } from '../theme';
import { haversineKm, fmtNum } from '../utils';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const { user, profile } = useAuth();
  const { steps, walking } = useStepEngine(user?.uid);
  const [friends, setFriends] = useState([]);

  useEffect(() => {
    if (!user) return;
    const reload = () => {
      const me = cloud.getUser(user.uid);
      const list = cloud.allUsers().filter((u) => u.uid !== user.uid && me && me.currentLocation && u.currentLocation);
      setFriends(list);
    };
    reload();
    const unsub = cloud.subscribe(reload);
    return unsub;
  }, [user]);

  const me = profile?.currentLocation;

  return (
    <View style={styles.container}>
      <View style={styles.topCard}>
        <Text style={styles.big}>{fmtNum(steps)}</Text>
        <Text style={styles.label}>steps today {walking ? '• live' : ''}</Text>
        <Text style={styles.total}>{fmtNum(profile?.totalSteps || 0)} total steps</Text>
      </View>

      <MapView
        style={styles.map}
        initialRegion={{ latitude: me?.lat || 32.0853, longitude: me?.lng || 34.7818, latitudeDelta: 0.05, longitudeDelta: 0.05 }}
        showsUserLocation
      >
        {me && <Circle center={{ latitude: me.lat, longitude: me.lng }} radius={150} fillColor="rgba(79,140,255,0.12)" strokeColor="rgba(79,140,255,0.4)" />}
        {friends.map((f) => f.currentLocation && (
          <Marker key={f.uid} coordinate={{ latitude: f.currentLocation.lat, longitude: f.currentLocation.lng }} title={f.name} description={fmtNum(f.totalSteps) + ' steps'}>
            <View style={styles.marker}>
              <Avatar name={f.name} size={34} />
              <View style={styles.badge}><Text style={styles.badgeTxt}>{fmtNum(f.totalSteps)}</Text></View>
            </View>
          </Marker>
        ))}
      </MapView>
      <Text style={styles.hint}>Blue circle = friends within ~150m (Bump-style proximity).</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.dark.bg },
  topCard: { backgroundColor: COLORS.dark.card, padding: 20, alignItems: 'center', borderBottomWidth: 1, borderColor: COLORS.dark.line },
  big: { fontSize: 48, fontWeight: '800', color: COLORS.dark.txt },
  label: { color: COLORS.dark.mut, fontSize: 13 },
  total: { color: COLORS.dark.acc2, fontSize: 13, marginTop: 4 },
  map: { flex: 1, width },
  marker: { alignItems: 'center' },
  badge: { backgroundColor: COLORS.dark.acc, borderRadius: 10, paddingHorizontal: 6, paddingVertical: 2, marginTop: 2 },
  badgeTxt: { color: '#fff', fontSize: 11, fontWeight: '700' },
  hint: { color: COLORS.dark.mut, fontSize: 12, textAlign: 'center', padding: 8 },
});
