'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { BUS_CONFIG } from '@/types/index';
import { supabase } from '@/lib/supabase';
import { addPing, flushBuffer, getBuffer } from '@/lib/offline-buffer';

const MAX_ATTEMPTS = 5;
const LOCK_MS = 10 * 60 * 1000;
const LOCK_KEY = 'gpha_lock_until';
const ATTEMPTS_KEY = 'gpha_lock_attempts';

type TrackingStatus = 'stopped' | 'active' | 'offline';

export default function TrackerPage() {
  // PIN screen state
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [lockUntil, setLockUntil] = useState<number | null>(null);
  const [countdown, setCountdown] = useState(0);
  const [fetchingBus, setFetchingBus] = useState(false);

  // Tracking screen state
  const [busIndex, setBusIndex] = useState<number | null>(null);
  const [busId, setBusId] = useState<string | null>(null);
  const [tracking, setTracking] = useState(false);
  const [status, setStatus] = useState<TrackingStatus>('stopped');
  const [pingCount, setPingCount] = useState(0);
  const [bufferedCount, setBufferedCount] = useState(0);

  // Refs for stable callbacks (avoid stale closures)
  const watchIdRef = useRef<number | null>(null);
  const trackingRef = useRef(false);
  const busIdRef = useRef<string | null>(null);

  useEffect(() => { trackingRef.current = tracking; }, [tracking]);
  useEffect(() => { busIdRef.current = busId; }, [busId]);

  // Restore lock state from localStorage on mount
  useEffect(() => {
    const storedAttempts = localStorage.getItem(ATTEMPTS_KEY);
    const storedLock = localStorage.getItem(LOCK_KEY);
    if (storedAttempts) setAttempts(parseInt(storedAttempts, 10));
    if (storedLock) {
      const t = parseInt(storedLock, 10);
      if (t > Date.now()) {
        setLockUntil(t);
        setCountdown(Math.ceil((t - Date.now()) / 1000));
      } else {
        localStorage.removeItem(LOCK_KEY);
        localStorage.removeItem(ATTEMPTS_KEY);
      }
    }
  }, []);

  // Countdown ticker
  useEffect(() => {
    if (!lockUntil) return;
    const interval = setInterval(() => {
      const remaining = lockUntil - Date.now();
      if (remaining <= 0) {
        setLockUntil(null);
        setAttempts(0);
        setCountdown(0);
        localStorage.removeItem(LOCK_KEY);
        localStorage.removeItem(ATTEMPTS_KEY);
      } else {
        setCountdown(Math.ceil(remaining / 1000));
      }
    }, 500);
    return () => clearInterval(interval);
  }, [lockUntil]);

  // Online: flush buffer and restore active status
  const handleOnline = useCallback(() => {
    if (!trackingRef.current) return;
    setStatus('active');
    void flushBuffer(supabase).then(() => setBufferedCount(getBuffer().length));
  }, []);

  // Offline: switch to buffering status
  const handleOffline = useCallback(() => {
    if (!trackingRef.current) return;
    setStatus('offline');
  }, []);

  useEffect(() => {
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [handleOnline, handleOffline]);

  // Cleanup watchPosition on unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  const handlePinSubmit = async () => {
    if (lockUntil || fetchingBus) return;

    const idx = BUS_CONFIG.findIndex((b) => b.pin === pin.trim());

    if (idx === -1) {
      const next = attempts + 1;
      setAttempts(next);
      localStorage.setItem(ATTEMPTS_KEY, String(next));
      setPin('');
      if (next >= MAX_ATTEMPTS) {
        const lockTime = Date.now() + LOCK_MS;
        setLockUntil(lockTime);
        setCountdown(Math.ceil(LOCK_MS / 1000));
        localStorage.setItem(LOCK_KEY, String(lockTime));
        setPinError('Too many incorrect attempts. Form locked for 10 minutes.');
      } else {
        setPinError('Incorrect PIN. Try again.');
      }
      return;
    }

    // PIN valid — clear lock, fetch bus UUID from Supabase
    setPinError('');
    setAttempts(0);
    localStorage.removeItem(LOCK_KEY);
    localStorage.removeItem(ATTEMPTS_KEY);
    setBusIndex(idx);
    setFetchingBus(true);

    const { data, error: dbError } = await supabase
      .from('buses')
      .select('id')
      .eq('name', BUS_CONFIG[idx].name)
      .single();

    setFetchingBus(false);

    if (dbError || !data) {
      setPinError('Could not connect to server. Check your connection and try again.');
      setBusIndex(null);
      return;
    }

    setBusId((data as { id: string }).id);
  };

  const startTracking = () => {
    const id = busIdRef.current;
    if (!id) return;

    trackingRef.current = true;
    setTracking(true);
    setStatus(navigator.onLine ? 'active' : 'offline');
    setPingCount(0);
    setBufferedCount(0);

    const watchId = navigator.geolocation.watchPosition(
      async (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        if (accuracy > 50) return;

        const currentId = busIdRef.current;
        if (!currentId) return;

        const ping = {
          bus_id: currentId,
          latitude,
          longitude,
          accuracy,
          created_at: new Date().toISOString(),
        };

        if (navigator.onLine) {
          const { error: insertError } = await supabase.from('locations').insert(ping);
          if (insertError) addPing(ping);
        } else {
          addPing(ping);
          setBufferedCount(getBuffer().length);
        }

        setPingCount((prev) => prev + 1);
      },
      (err) => {
        console.error('Geolocation error:', err.message);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    );

    watchIdRef.current = watchId;
  };

  const stopTracking = () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    trackingRef.current = false;
    setTracking(false);
    setStatus('stopped');
  };

  const busConfig = busIndex !== null ? BUS_CONFIG[busIndex] : null;

  // ── Tracking screen ───────────────────────────────────────────────────────
  if (busId && busConfig) {
    return (
      <main className="min-h-screen flex flex-col bg-gray-950 p-6">
        <div className="text-center pt-8 pb-6">
          <h1
            className="text-4xl font-black tracking-tight"
            style={{ color: busConfig.color }}
          >
            {busConfig.name}
          </h1>
          <p className="text-gray-400 text-xl mt-1">{busConfig.route} Route</p>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center gap-6">
          {/* Pulsing status dot */}
          <div className="relative flex items-center justify-center h-28 w-28">
            {status === 'active' && (
              <span className="absolute inset-0 rounded-full bg-green-500 opacity-30 animate-ping" />
            )}
            <span
              className={`relative h-24 w-24 rounded-full ${
                status === 'active'
                  ? 'bg-green-500'
                  : status === 'offline'
                    ? 'bg-amber-500'
                    : 'bg-gray-700'
              }`}
            />
          </div>

          {/* Status label */}
          <div className="text-center space-y-1">
            <p
              className={`text-2xl font-bold ${
                status === 'active'
                  ? 'text-green-400'
                  : status === 'offline'
                    ? 'text-amber-400'
                    : 'text-gray-500'
              }`}
            >
              {status === 'active'
                ? 'Tracking active'
                : status === 'offline'
                  ? 'Offline — buffering'
                  : 'Stopped'}
            </p>
            {status === 'offline' && bufferedCount > 0 && (
              <p className="text-amber-500 text-sm">
                {bufferedCount} ping{bufferedCount !== 1 ? 's' : ''} buffered
              </p>
            )}
          </div>

          <p className="text-gray-600 text-sm">
            {pingCount} location{pingCount !== 1 ? 's' : ''} sent this session
          </p>
        </div>

        {/* Start / Stop */}
        <button
          onClick={tracking ? stopTracking : startTracking}
          className="w-full py-6 rounded-2xl text-white text-2xl font-black tracking-wide active:scale-95 transition-transform mb-6"
          style={{ backgroundColor: tracking ? '#374151' : busConfig.color }}
        >
          {tracking ? 'Stop Tracking' : 'Start Tracking'}
        </button>
      </main>
    );
  }

  // ── PIN screen ────────────────────────────────────────────────────────────
  return (
    <main className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-black text-white">GPHA Bus Tracker</h1>
          <p className="text-gray-500 mt-2">Enter your 4-digit bus PIN</p>
        </div>

        <div className="bg-gray-900 rounded-2xl p-8 shadow-xl space-y-5">
          {lockUntil ? (
            <div className="text-center space-y-3">
              <p className="text-red-400 font-semibold text-lg">Form Locked</p>
              <p className="text-gray-400">
                Try again in{' '}
                <span className="text-white font-mono text-2xl">
                  {Math.floor(countdown / 60)}:{String(countdown % 60).padStart(2, '0')}
                </span>
              </p>
            </div>
          ) : (
            <>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={4}
                value={pin}
                onChange={(e) => {
                  setPin(e.target.value.replace(/\D/g, ''));
                  setPinError('');
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && pin.length === 4) void handlePinSubmit();
                }}
                placeholder="0000"
                autoFocus
                className="w-full text-center text-4xl font-mono tracking-[0.5em] bg-gray-800 text-white rounded-xl px-4 py-5 border border-gray-700 focus:outline-none focus:border-blue-500 placeholder:text-gray-700"
              />

              {pinError && (
                <p className="text-red-400 text-sm text-center">{pinError}</p>
              )}

              <button
                onClick={() => void handlePinSubmit()}
                disabled={pin.length !== 4 || fetchingBus}
                className="w-full py-4 rounded-xl text-white text-lg font-bold bg-blue-600 disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 transition-transform"
              >
                {fetchingBus ? 'Connecting…' : 'Continue'}
              </button>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
