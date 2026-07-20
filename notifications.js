// ============================================================================
//  Notifications — local milestone + friend-request alerts.
//  NOTE: expo-notifications push is NOT supported in Expo Go (SDK53+).
//  These are LOCAL notifications (scheduleNotificationAsync) which still work
//  in a dev build; in Expo Go the calls are safely no-oped.
// ============================================================================

import * as Notifications from 'expo-notifications';
import { MILESTONES } from './theme';

Notifications.setNotificationHandler({
  handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: true, shouldSetBadge: false }),
});

let available = true;
try {
  // Calling this in Expo Go throws; guard so the app never crashes.
  Notifications.setNotificationChannelAsync?.('default', { name: 'default', importance: 4 });
} catch (e) { available = false; }

export async function requestPermissions() {
  if (!available) return false;
  try { const { status } = await Notifications.requestPermissionsAsync(); return status === 'granted'; }
  catch (e) { return false; }
}

let fired = {};
export async function scheduleMilestoneCheck(total) {
  if (!available) return;
  for (const m of MILESTONES) {
    if (total >= m && !fired[m]) {
      fired[m] = true;
      try {
        await Notifications.scheduleNotificationAsync({
          content: { title: 'Step milestone!', body: `You hit ${m.toLocaleString()} steps. Keep going!` },
          trigger: null,
        });
      } catch (e) { /* ignore in Expo Go */ }
      break;
    }
  }
}

export async function notifyFriendRequest(fromName) {
  if (!available) return;
  try {
    await Notifications.scheduleNotificationAsync({
      content: { title: 'New friend request', body: `${fromName} wants to step with you.` },
      trigger: null,
    });
  } catch (e) { /* ignore */ }
}

export async function notifyNearby(name) {
  if (!available) return;
  try {
    await Notifications.scheduleNotificationAsync({
      content: { title: 'Friend nearby!', body: `${name} is close — go step together.` },
      trigger: null,
    });
  } catch (e) { /* ignore */ }
}
