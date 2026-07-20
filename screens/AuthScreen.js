// ============================================================================
//  AuthScreen — login + signup
// ============================================================================

import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useAuth } from '../AuthContext';
import { Button } from '../components';
import { COLORS } from '../theme';

export default function AuthScreen() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState('login'); // 'login' | 'signup'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setErr(''); setBusy(true);
    try {
      if (mode === 'signup') await signUp(email.trim(), password, name.trim());
      else await signIn(email.trim(), password);
    } catch (e) {
      setErr(e.message.replace('Firebase: ', ''));
    } finally { setBusy(false); }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.inner}>
        <Text style={styles.logo}>Super-Steps</Text>
        <Text style={styles.tag}>Step together. Compete with friends.</Text>

        {mode === 'signup' && (
          <TextInput style={styles.input} placeholder="Name" placeholderTextColor={COLORS.dark.mut} value={name} onChangeText={setName} autoCapitalize="words" />
        )}
        <TextInput style={styles.input} placeholder="Email" placeholderTextColor={COLORS.dark.mut} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
        <TextInput style={styles.input} placeholder="Password (min 6)" placeholderTextColor={COLORS.dark.mut} value={password} onChangeText={setPassword} secureTextEntry />

        {err ? <Text style={styles.err}>{err}</Text> : null}

        <Button title={busy ? '...' : mode === 'login' ? 'Log in' : 'Create account'} onPress={submit} primary disabled={busy} />
        <Button title={mode === 'login' ? 'Need an account? Sign up' : 'Have an account? Log in'} onPress={() => setMode(mode === 'login' ? 'signup' : 'login')} secondary style={{ marginTop: 10 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.dark.bg },
  inner: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  logo: { fontSize: 32, fontWeight: '800', color: COLORS.dark.txt, textAlign: 'center' },
  tag: { color: COLORS.dark.mut, textAlign: 'center', marginBottom: 28 },
  input: { backgroundColor: COLORS.dark.card, borderWidth: 1, borderColor: COLORS.dark.line, borderRadius: 10, color: COLORS.dark.txt, padding: 14, fontSize: 15, marginBottom: 12 },
  err: { color: COLORS.dark.bad, marginBottom: 10, fontSize: 13 },
});
