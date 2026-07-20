// ============================================================================
//  App.js — root. Auth gate + bottom tabs + live location writer (cloud).
// ============================================================================

import React, { useEffect, useRef } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, View } from 'react-native';
import * as Location from 'expo-location';
import * as cloud from './cloud';
import { AuthProvider, useAuth } from './AuthContext';
import { requestPermissions as reqNotif } from './notifications';
import { COLORS } from './theme';

import AuthScreen from './screens/AuthScreen';
import HomeScreen from './screens/HomeScreen';
import LeaderboardScreen from './screens/LeaderboardScreen';
import FriendsScreen from './screens/FriendsScreen';
import ProfileScreen from './screens/ProfileScreen';

const Tab = createBottomTabNavigator();

function Tabs() {
  const { user } = useAuth();
  const lastWrite = useRef(0);

  useEffect(() => {
    if (!user) return;
    let sub;
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      await reqNotif();
      sub = await Location.watchPositionAsync({ accuracy: Location.Accuracy.Balanced, distanceInterval: 30, timeInterval: 15000 }, async (loc) => {
        const now = Date.now();
        if (now - lastWrite.current < 15000) return; // throttle writes
        lastWrite.current = now;
        await cloud.setLocation(user.uid, { lat: loc.coords.latitude, lng: loc.coords.longitude });
      });
    })();
    return () => sub?.remove();
  }, [user]);

  return (
    <Tab.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: COLORS.dark.card },
        headerTintColor: COLORS.dark.txt,
        tabBarStyle: { backgroundColor: COLORS.dark.card, borderTopColor: COLORS.dark.line },
        tabBarActiveTintColor: COLORS.dark.acc,
        tabBarInactiveTintColor: COLORS.dark.mut,
      }}
    >
      <Tab.Screen name="Map" component={HomeScreen} />
      <Tab.Screen name="Ranking" component={LeaderboardScreen} />
      <Tab.Screen name="Friends" component={FriendsScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

function Root() {
  const { user, loading } = useAuth();
  if (loading) return <View style={{ flex: 1, backgroundColor: COLORS.dark.bg, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: COLORS.dark.mut }}>Loading…</Text></View>;
  return user ? <Tabs /> : <AuthScreen />;
}

export default function App() {
  return (
    <AuthProvider>
      <StatusBar style="light" />
      <NavigationContainer>
        <Root />
      </NavigationContainer>
    </AuthProvider>
  );
}
