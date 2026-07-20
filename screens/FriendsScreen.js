// ============================================================================
//  FriendsScreen — discovery (nearby + by email) + friend requests
// ============================================================================

import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, StyleSheet, FlatList, Alert } from 'react-native';
import * as cloud from '../cloud';
import { useAuth } from '../AuthContext';
import { Avatar, Button } from '../components';
import { COLORS } from '../theme';
import { haversineKm, fmtNum } from '../utils';

export default function FriendsScreen() {
  const { user, profile } = useAuth();
  const [nearby, setNearby] = useState([]);
  const [incoming, setIncoming] = useState([]);
  const [email, setEmail] = useState('');
  const me = profile?.currentLocation;

  const reload = () => {
    if (!user) return;
    setNearby(cloud.allUsers().filter((u) => u.uid !== user.uid && u.currentLocation && me && haversineKm(me, u.currentLocation) < 0.15));
    setIncoming(cloud.incomingRequests(user.uid));
  };

  useEffect(() => { reload(); return cloud.subscribe(reload); }, [user, me]);

  const sendRequest = async (toUid) => {
    if (!user) return;
    await cloud.sendRequest(user.uid, toUid);
    Alert.alert('Sent', 'Friend request sent.');
  };

  const accept = async (fromUid) => { await cloud.accept(fromUid, user.uid); };

  const findEmail = () => {
    const e = email.trim().toLowerCase();
    if (!e) return;
    const u = cloud.findByEmail(e);
    if (!u) { Alert.alert('Not found', 'No user with that email.'); return; }
    sendRequest(u.uid);
    setEmail('');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Nearby ({nearby.length})</Text>
      <FlatList data={nearby} keyExtractor={(i) => i.uid} renderItem={({ item }) => (
        <View style={styles.row}>
          <Avatar name={item.name} size={38} />
          <View style={styles.mid}><Text style={styles.name}>{item.name}</Text><Text style={styles.sub}>~{Math.round(haversineKm(me, item.currentLocation) * 1000)} m away</Text></View>
          <Button title="Add" onPress={() => sendRequest(item.uid)} primary style={styles.addBtn} />
        </View>
      )} ListEmptyComponent={<Text style={styles.empty}>No friends nearby right now.</Text>} />

      <Text style={styles.heading}>Requests ({incoming.length})</Text>
      {incoming.map((r) => (
        <View key={r.fromUid} style={styles.row}>
          <Avatar name={r.fromName} size={38} />
          <View style={styles.mid}><Text style={styles.name}>{r.fromName}</Text><Text style={styles.sub}>wants to connect</Text></View>
          <Button title="Accept" onPress={() => accept(r.fromUid)} primary style={styles.addBtn} />
        </View>
      ))}

      <Text style={styles.heading}>Add by email</Text>
      <View style={styles.addRow}>
        <TextInput style={styles.input} placeholder="friend@example.com" placeholderTextColor={COLORS.dark.mut} value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
        <Button title="Find" onPress={findEmail} secondary style={styles.findBtn} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.dark.bg, padding: 14 },
  heading: { color: COLORS.dark.acc, fontSize: 16, fontWeight: '700', marginVertical: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, borderBottomWidth: 1, borderColor: COLORS.dark.line },
  mid: { flex: 1 },
  name: { color: COLORS.dark.txt, fontSize: 15, fontWeight: '600' },
  sub: { color: COLORS.dark.mut, fontSize: 12 },
  addBtn: { paddingHorizontal: 14, paddingVertical: 8 },
  empty: { color: COLORS.dark.mut, fontSize: 13, padding: 10 },
  addRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  input: { flex: 1, backgroundColor: COLORS.dark.card, borderWidth: 1, borderColor: COLORS.dark.line, borderRadius: 10, color: COLORS.dark.txt, padding: 12, fontSize: 14 },
  findBtn: { paddingHorizontal: 16 },
});
