// ============================================================================
//  ProfileScreen — step history (last 14 days) + theme + sign out
// ============================================================================

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import * as cloud from '../cloud';
import { useAuth } from '../AuthContext';
import { Avatar, Button } from '../components';
import { COLORS } from '../theme';
import { fmtNum } from '../utils';

export default function ProfileScreen() {
  const { user, profile, signOut } = useAuth();
  const [history, setHistory] = useState([]);
  const [dark, setDark] = useState(true);

  useEffect(() => {
    if (!user) return;
    const reload = () => setHistory(cloud.history(user.uid));
    reload();
    return cloud.subscribe(reload);
  }, [user]);

  const max = Math.max(1, ...history.map((h) => h.steps || 0));
  const C = dark ? COLORS.dark : COLORS.light;

  return (
    <ScrollView style={[styles.container, { backgroundColor: C.bg }]}>
      <View style={[styles.head, { borderColor: C.line }]}>
        <Avatar name={profile?.name} size={64} />
        <View style={{ flex: 1, marginLeft: 14 }}>
          <Text style={[styles.name, { color: C.txt }]}>{profile?.name}</Text>
          <Text style={[styles.sub, { color: C.mut }]}>{profile?.email}</Text>
          <Text style={[styles.total, { color: C.acc2 }]}>{fmtNum(profile?.totalSteps)} total steps</Text>
        </View>
      </View>

      <Text style={[styles.section, { color: C.acc }]}>Step history (last {history.length} days)</Text>
      <View style={[styles.chart, { backgroundColor: C.card }]}>
        {history.length === 0 && <Text style={[styles.empty, { color: C.mut }]}>No history yet — start walking.</Text>}
        {history.map((h) => (
          <View key={h.date} style={styles.barWrap}>
            <View style={[styles.bar, { height: Math.max(4, (h.steps / max) * 90), backgroundColor: C.acc }]} />
            <Text style={[styles.barLbl, { color: C.mut }]}>{h.steps ? (h.steps >= 1000 ? (h.steps / 1000).toFixed(1) + 'k' : h.steps) : '0'}</Text>
          </View>
        ))}
      </View>

      <TouchableOpacity style={[styles.themeRow, { borderColor: C.line }]} onPress={() => setDark(!dark)}>
        <Text style={[styles.themeTxt, { color: C.txt }]}>Dark mode: {dark ? 'On' : 'Off'}</Text>
      </TouchableOpacity>

      <Button title="Log out" onPress={signOut} secondary style={{ marginTop: 16 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  head: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, paddingBottom: 16, marginBottom: 12 },
  name: { fontSize: 20, fontWeight: '800' },
  sub: { fontSize: 13 },
  total: { fontSize: 13, marginTop: 4 },
  section: { fontSize: 16, fontWeight: '700', marginVertical: 10 },
  chart: { flexDirection: 'row', alignItems: 'flex-end', height: 120, borderRadius: 12, padding: 12, gap: 6 },
  barWrap: { flex: 1, alignItems: 'center', justifyContent: 'flex-end' },
  bar: { width: '100%', borderRadius: 4 },
  barLbl: { fontSize: 9, marginTop: 4 },
  empty: { color: '#9aa3b2', fontSize: 13 },
  themeRow: { borderWidth: 1, borderRadius: 10, padding: 14, marginTop: 16 },
  themeTxt: { fontSize: 15, fontWeight: '600' },
});
