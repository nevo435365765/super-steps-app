// ============================================================================
//  AuthContext — wraps cloud.js (Gist-backed) auth + profile
// ============================================================================

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import * as cloud from './cloud';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);      // { uid, email }
  const [profile, setProfile] = useState(null); // user doc
  const [loading, setLoading] = useState(true);

  const applyAuth = useCallback((u) => {
    if (!u) { setUser(null); setProfile(null); return; }
    setUser(u);
    setProfile(cloud.getUser(u.uid));
  }, []);

  useEffect(() => {
    (async () => {
      await cloud.refresh();
      const saved = cloud.loadAuth();
      applyAuth(saved);
      setLoading(false);
      // live updates from cloud
      cloud.subscribe(() => { const cur = cloud.loadAuth(); if (cur) setProfile(cloud.getUser(cur.uid)); });
    })();
  }, []);

  const signUp = useCallback(async (email, password, name) => {
    const u = await cloud.signUp(email, password, name);
    applyAuth(u);
    return u;
  }, []);

  const signIn = useCallback(async (email, password) => {
    const u = await cloud.signIn(email, password);
    applyAuth(u);
    return u;
  }, []);

  const signOut = useCallback(() => { cloud.signOut(); applyAuth(null); }, []);

  const refreshProfile = useCallback(() => { if (user) setProfile(cloud.getUser(user.uid)); }, [user]);

  return (
    <AuthContext.Provider value={{ user, profile, loading, signUp, signIn, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
