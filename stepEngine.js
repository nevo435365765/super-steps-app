// ============================================================================
//  StepEngine — foreground step counting.
//  - iOS:  expo-sensors DeviceMotionEvent gives raw acceleration; we detect
//           step cadence. (Apple restricts direct pedometer access to HealthKit;
//           this is a robust motion-based estimator that works in Expo Go.)
//  - Android: expo-sensors Pedometer (if available) for exact counts,
//           else falls back to motion estimation.
//  Batches writes every 30s to save battery + respects offline.
// ============================================================================

import { useEffect, useRef, useState } from 'react';
import { Accelerometer, Pedometer } from 'expo-sensors';
import * as cloud from './cloud';
import { scheduleMilestoneCheck } from './notifications';

const BATCH_MS = 30000; // 30s batching

export function useStepEngine(uid) {
  const [steps, setSteps] = useState(0);          // today's steps (live, local)
  const [walking, setWalking] = useState(false);
  const buffer = useRef(0);                        // unsynced steps
  const lastMag = useRef(null);
  const lastTs = useRef(Date.now());
  const subRef = useRef(null);
  const pedRef = useRef(null);

  // ---- motion-based step detector ----
  const onAccel = (a) => {
    if (!a) return;
    const mag = Math.sqrt((a.x || 0) ** 2 + (a.y || 0) ** 2 + (a.z || 0) ** 2);
    if (lastMag.current !== null) {
      const d = Math.abs(mag - lastMag.current);
      if (d > 2.2 && d < 12) { buffer.current += 1; setSteps((s) => s + 1); }
    }
    lastMag.current = mag;
  };

  const flush = async () => {
    if (!uid || buffer.current <= 0) return;
    const delta = buffer.current;
    buffer.current = 0;
    try {
      await cloud.addSteps(uid, delta);
      const total = cloud.getUser(uid)?.totalSteps || 0;
      await scheduleMilestoneCheck(total);
    } catch (e) {
      buffer.current += delta; // roll back so we retry next flush (offline-safe)
    }
  };

  useEffect(() => {
    if (!uid) return;
    let cancelled = false;
    (async () => {
      // Prefer Android Pedometer (exact) when available
      try {
        const avail = await Pedometer.isAvailableAsync();
        if (avail) {
          const end = new Date();
          const start = new Date(end.getTime() - 1000);
          const past = await Pedometer.getStepCountAsync(start, end);
          let base = past.steps || 0;
          pedRef.current = Pedometer.watchStepCount((r) => {
            const inc = Math.max(0, r.steps - base);
            if (inc > 0) { buffer.current += inc; setSteps((s) => s + inc); base = r.steps; }
          });
        }
      } catch (e) { /* fall to motion */ }

      if (!pedRef.current) {
        subRef.current = Accelerometer.addListener(onAccel);
        Accelerometer.setUpdateInterval(200);
      }
      setWalking(true);
    })();

    const iv = setInterval(flush, BATCH_MS);
    return () => {
      cancelled = true;
      clearInterval(iv);
      subRef.current?.remove();
      pedRef.current?.remove?.();
      setWalking(false);
      if (!cancelled) flush();
    };
  }, [uid]);

  return { steps, walking, flush };
}
