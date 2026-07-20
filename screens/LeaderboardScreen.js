// ============================================================================
//  LeaderboardScreen — daily / weekly / all-time rankings
// ============================================================================

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import * as cloud from '../cloud';
import { useAuth } from '../AuthContext';
import { Avatar } from '../components';
import { COLORS, RANK_SCOPES } from '../theme';
import { fmtNum, todayKey, weekKey } from '../utils';

export default function LeaderboardScreen() {
  const { user } = useAuth();
  const [scope, setScope] = useState('daily');
  const [users, setUsers] = useState([]);

  useEffect(() => {
    const reload = () => setUsers(cloud.allUsers());
    reload();
    return cloud.subscribe(reload);
  }, []);

  const ranked = [...users].sort((a, b) => (b.totalSteps || 0) - (a.totalSteps || 0));

  return (
    <View style={styles.container}>
      <View style={styles.scopes}>
        {RANK_SCOPES.map((s) => (
          <TouchableOpacity key={s} style={[styles.scope, scope === s && styles.scopeActive]} onPress={() => setScope(s)}>
            <Text style={[styles.scopeTxt, scope === s && { color: '#fff' }]}>{s.toUpperCase()}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <FlatList
        data={ranked}
        keyExtractor={(i) => i.uid}
        renderItem={({ item, index }) => (
          <View style={styles.row}>
            <Text style={styles.pos}>{index + 1}</Text>
            <Avatar name={item.name} size={38} />
            <View style={styles.mid}>
              <Text style={styles.name}>{item.name}{item.uid === user?.uid ? ' (you)' : ''}</Text>
              <Text style={styles.sub}>{scope} · {todayKey()}</Text>
            </View>
            <Text style={styles.pts}>{fmtNum(item.totalSteps)}</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.dark.bg, paddingTop: 8 },
  scopes: { flexDirection: 'row', padding: 12, gap: 8 },
  scope: { flex: 1, padding: 10, borderRadius: 8, backgroundColor: COLORS.dark.card2, borderWidth: 1, borderColor: COLORS.dark.line, alignItems: 'center' },
  scopeActive: { backgroundColor: COLORS.dark.acc, borderColor: COLORS.dark.acc },
  scopeTxt: { color: COLORS.dark.mut, fontWeight: '700', fontSize: 13 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderBottomWidth: 1, borderColor: COLORS.dark.line },
  pos: { width: 24, color: COLORS.dark.mut, fontWeight: '700' },
  mid: { flex: 1 },
  name: { color: COLORS.dark.txt, fontSize: 15, fontWeight: '600' },
  sub: { color: COLORS.dark.mut, fontSize: 12 },
  pts: { color: COLORS.dark.acc2, fontWeight: '800', fontSize: 15 },
});
