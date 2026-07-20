// ============================================================================
//  Shared UI — Avatar, Card, Button, SectionTitle
// ============================================================================

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS } from './theme';
import { avatarColor } from './utils';

export function Avatar({ name, size = 40, dark = true }) {
  const c = avatarColor(name);
  return (
    <View style={[styles.avatar, { width: size, height: size, borderRadius: size / 2, backgroundColor: c }]}>
      <Text style={[styles.avatarTxt, { fontSize: size * 0.4 }]}>{(name || '?').charAt(0).toUpperCase()}</Text>
    </View>
  );
}

export function Card({ children, style }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function Button({ title, onPress, primary, secondary, disabled, style }) {
  return (
    <TouchableOpacity style={[styles.btn, primary && styles.btnPrimary, secondary && styles.btnSec, disabled && styles.btnDisabled, style]} onPress={onPress} disabled={disabled}>
      <Text style={[styles.btnTxt, primary && { color: '#fff' }]}>{title}</Text>
    </TouchableOpacity>
  );
}

export function SectionTitle({ children }) {
  return <Text style={styles.sectionTitle}>{children}</Text>;
}

const styles = StyleSheet.create({
  avatar: { alignItems: 'center', justifyContent: 'center' },
  avatarTxt: { color: '#fff', fontWeight: '800' },
  card: { backgroundColor: 'transparent' },
  btn: { paddingVertical: 14, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  btnPrimary: { backgroundColor: COLORS.dark.acc },
  btnSec: { backgroundColor: COLORS.dark.card2, borderWidth: 1, borderColor: COLORS.dark.line },
  btnDisabled: { opacity: 0.5 },
  btnTxt: { color: COLORS.dark.txt, fontSize: 15, fontWeight: '700' },
  sectionTitle: { color: COLORS.dark.acc, fontSize: 16, fontWeight: '700', marginVertical: 8 },
});
