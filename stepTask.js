// ============================================================================
//  Background step tracking — uses expo-task-manager + expo-location.
//  On iOS, steps are sampled via the motion/health bridge indirectly through
//  pedometer history; on Android, the ActivityRecognition + a periodic
//  pedometer poll batches steps every 30s and writes to Firestore.
// ============================================================================

import * as TaskManager from 'expo-task-manager';
import * as Location from 'expo-location';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from './firebase';
import { todayKey, weekKey } from './utils';
import { scheduleMilestoneCheck } from './notifications';

export const STEP_TASK = 'step-tracking';

let lastBatch = 0;

async function pushSteps(uid, delta) {
  if (!uid || delta <= 0) return;
  const t = todayKey();
  const w = weekKey();
  const dayRef = doc(db, 'steps', uid + '_' + t);
  const weekRef = doc(db, 'steps', uid + '_' + w);
  const daySnap = await getDoc(dayRef);
  const daySteps = (daySnap.exists() ? daySnap.data().steps : 0) + delta;
  await setDoc(dayRef, { userId: uid, date: t, steps: daySteps, timestamp: Date.now() }, { merge: true });
  const weekSnap = await getDoc(weekRef);
  const weekSteps = (weekSnap.exists() ? weekSnap.data().steps : 0) + delta;
  await setDoc(weekRef, { userId: uid, date: w, steps: weekSteps, timestamp: Date.now() }, { merge: true });
  // bump total on user doc
  const userRef = doc(db, 'users', uid);
  const uSnap = await getDoc(userRef);
  const total = (uSnap.exists() ? (uSnap.data().totalSteps || 0) : 0) + delta;
  await setDoc(userRef, { totalSteps: total }, { merge: true });
  await scheduleMilestoneCheck(total);
}

TaskManager.defineTask(STEP_TASK, async ({ data, error }) => {
  if (error) { console.warn('step task error', error); return; }
  const uid = data?.uid;
  if (!uid) return;
  // data.stepsDelta arrives from the foreground engine or platform pedometer hook.
  const delta = data?.stepsDelta || 0;
  if (delta > 0) await pushSteps(uid, delta);
});

export async function registerStepTask() {
  if (!TaskManager.isTaskDefined(STEP_TASK)) return;
  const status = await Location.getBackgroundPermissionsAsync();
  if (status.granted) {
    await Location.startLocationUpdatesAsync(STEP_TASK, {
      accuracy: Location.Accuracy.Balanced,
      timeInterval: 30000,   // batch every 30 seconds -> battery friendly
      distanceInterval: 0,
      deferredUpdatesInterval: 30000,
      showsBackgroundLocationIndicator: true,
    });
  }
}

export { pushSteps };
