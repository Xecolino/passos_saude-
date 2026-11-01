import { useState, useEffect, useRef, useCallback } from 'react';
import { StepDetector } from '../utils/stepDetector';
import {
  calculateHaversineDistance,
  isReliableGpsPoint,
  formatPace,
  calculateSpeedKmh,
  calculateWalkingCalories,
  formatStopwatchTime
} from '../utils/geo';

const SESSIONS_STORAGE_KEY = 'passo_saude_workout_sessions';

// Initial seed session so user can test history immediately
const initialSeedSessions = [
  {
    id: 'sess_seed_1',
    date: 'Ontem às 18:20',
    timestamp: Date.now() - 86400000,
    durationSeconds: 1940, // 32m 20s
    steps: 3410,
    distanceKm: 2.38,
    caloriesKcal: 135,
    avgPace: "13'35\"/km",
    avgSpeedKmh: 4.4,
    avgCadence: 105,
    coinsEarned: 34,
    routePoints: [
      { latitude: -23.55052, longitude: -46.633308, timestamp: 1 },
      { latitude: -23.55085, longitude: -46.633720, timestamp: 2 },
      { latitude: -23.55130, longitude: -46.634200, timestamp: 3 },
      { latitude: -23.55190, longitude: -46.634550, timestamp: 4 },
      { latitude: -23.55240, longitude: -46.634100, timestamp: 5 },
      { latitude: -23.55220, longitude: -46.633350, timestamp: 6 },
      { latitude: -23.55160, longitude: -46.633000, timestamp: 7 }
    ]
  }
];

export function useWorkoutTracker({ onStepsCounted = () => {}, userWeightKg = 70 } = {}) {
  // Tracker active state
  const [isTracking, setIsTracking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Live Workout Stats
  const [workoutSteps, setWorkoutSteps] = useState(0);
  const [distanceKm, setDistanceKm] = useState(0);
  const [cadenceSpm, setCadenceSpm] = useState(0);
  const [routePoints, setRoutePoints] = useState([]);
  const [currentLocation, setCurrentLocation] = useState(null);

  // Hardware Sensor States
  const [sensorPermission, setSensorPermission] = useState('prompt'); // 'granted', 'denied', 'prompt', 'unsupported'
  const [gpsStatus, setGpsStatus] = useState('idle'); // 'searching', 'active', 'denied', 'idle'
  const [sensitivity, setSensitivity] = useState('normal'); // 'alta', 'normal', 'baixa'
  const [isSimulatedGps, setIsSimulatedGps] = useState(false);

  // Sessions History (stored in local device storage)
  const [sessionsHistory, setSessionsHistory] = useState(() => {
    try {
      const saved = localStorage.getItem(SESSIONS_STORAGE_KEY);
      return saved ? JSON.parse(saved) : initialSeedSessions;
    } catch {
      return initialSeedSessions;
    }
  });

  // Internal refs
  const stepDetectorRef = useRef(null);
  const gpsWatchIdRef = useRef(null);
  const timerIntervalRef = useRef(null);
  const simGpsIntervalRef = useRef(null);
  const lastGpsPointRef = useRef(null);

  // Initialize Step Detector
  useEffect(() => {
    stepDetectorRef.current = new StepDetector({
      sensitivity,
      onStep: ({ count, cadence }) => {
        setWorkoutSteps(prev => {
          const updated = prev + count;
          onStepsCounted(count);
          return updated;
        });
        if (cadence > 0) setCadenceSpm(cadence);
      },
      onCadenceUpdate: (spm) => {
        setCadenceSpm(spm);
      }
    });

    return () => {
      stopHardwareListeners();
    };
  }, []);

  // Update detector sensitivity on change
  useEffect(() => {
    if (stepDetectorRef.current) {
      stepDetectorRef.current.setSensitivity(sensitivity);
    }
  }, [sensitivity]);

  // Save sessions to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(sessionsHistory));
    } catch (e) {
      console.warn('Failed to persist workout sessions:', e);
    }
  }, [sessionsHistory]);

  // Stopwatch timer
  useEffect(() => {
    if (isTracking && !isPaused) {
      timerIntervalRef.current = setInterval(() => {
        setElapsedSeconds(prev => prev + 1);
      }, 1000);
    } else {
      clearInterval(timerIntervalRef.current);
    }
    return () => clearInterval(timerIntervalRef.current);
  }, [isTracking, isPaused]);

  // Accelerometer motion listener
  const handleDeviceMotion = useCallback((event) => {
    if (!isTracking || isPaused || !stepDetectorRef.current) return;
    const accel = event.accelerationIncludingGravity || event.acceleration;
    if (accel) {
      stepDetectorRef.current.processSample(accel, Date.now());
    }
  }, [isTracking, isPaused]);

  // Request Accelerometer Motion Sensor Permission (iOS 13+ & Mobile)
  const requestMotionPermission = async () => {
    if (typeof DeviceMotionEvent !== 'undefined' && typeof DeviceMotionEvent.requestPermission === 'function') {
      try {
        const response = await DeviceMotionEvent.requestPermission();
        if (response === 'granted') {
          setSensorPermission('granted');
          window.addEventListener('devicemotion', handleDeviceMotion, { passive: true });
          return true;
        } else {
          setSensorPermission('denied');
          return false;
        }
      } catch (err) {
        console.warn('Permission request error:', err);
        setSensorPermission('denied');
        return false;
      }
    } else if (typeof window !== 'undefined' && 'DeviceMotionEvent' in window) {
      // Android / Standard browser
      setSensorPermission('granted');
      window.addEventListener('devicemotion', handleDeviceMotion, { passive: true });
      return true;
    } else {
      setSensorPermission('unsupported');
      return false;
    }
  };

  // Start GPS Geolocation Tracker
  const startGpsTracking = () => {
    if (!navigator.geolocation) {
      setGpsStatus('denied');
      return;
    }

    setGpsStatus('searching');

    gpsWatchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude, accuracy, speed } = position.coords;
        const newPoint = {
          latitude,
          longitude,
          accuracy,
          timestamp: position.timestamp || Date.now()
        };

        setGpsStatus('active');
        setCurrentLocation(newPoint);

        const prevPoint = lastGpsPointRef.current;
        if (isReliableGpsPoint(prevPoint, newPoint)) {
          if (prevPoint) {
            const addedDistKm = calculateHaversineDistance(
              prevPoint.latitude,
              prevPoint.longitude,
              newPoint.latitude,
              newPoint.longitude
            );
            setDistanceKm(prev => Number((prev + addedDistKm).toFixed(3)));
          }

          setRoutePoints(prev => [...prev, newPoint]);
          lastGpsPointRef.current = newPoint;
        }
      },
      (error) => {
        console.warn('GPS location error:', error.message);
        setGpsStatus(error.code === 1 ? 'denied' : 'searching');
      },
      {
        enableHighAccuracy: true,
        maximumAge: 1000,
        timeout: 10000
      }
    );
  };

  const stopHardwareListeners = () => {
    if (typeof window !== 'undefined') {
      window.removeEventListener('devicemotion', handleDeviceMotion);
    }
    if (gpsWatchIdRef.current !== null && navigator.geolocation) {
      navigator.geolocation.clearWatch(gpsWatchIdRef.current);
      gpsWatchIdRef.current = null;
    }
    clearInterval(simGpsIntervalRef.current);
  };

  // Start Workout
  const startWorkout = async (useSimulation = false) => {
    setIsTracking(true);
    setIsPaused(false);
    setElapsedSeconds(0);
    setWorkoutSteps(0);
    setDistanceKm(0);
    setCadenceSpm(0);
    setRoutePoints([]);
    lastGpsPointRef.current = null;

    if (stepDetectorRef.current) {
      stepDetectorRef.current.reset();
    }

    // Try hardware sensors
    const sensorOk = await requestMotionPermission();

    if (!sensorOk || useSimulation) {
      // Start simulated smooth walking path around a park for desktop/testing
      setIsSimulatedGps(true);
      startSimulatedWalk();
    } else {
      setIsSimulatedGps(false);
      startGpsTracking();
    }
  };

  // Simulated GPS Walking Path for testing / indoor / desktop environments
  const startSimulatedWalk = () => {
    setGpsStatus('active');
    let angle = 0;
    const baseLat = -23.55052;
    const baseLng = -46.633308;
    const radius = 0.0018;

    simGpsIntervalRef.current = setInterval(() => {
      angle += 0.08;
      const lat = baseLat + Math.sin(angle) * radius + (Math.sin(angle * 2) * 0.0004);
      const lng = baseLng + Math.cos(angle) * (radius * 1.2);

      const pt = { latitude: lat, longitude: lng, timestamp: Date.now() };

      setRoutePoints(prev => {
        if (prev.length > 0) {
          const last = prev[prev.length - 1];
          const added = calculateHaversineDistance(last.latitude, last.longitude, lat, lng);
          setDistanceKm(d => Number((d + added).toFixed(3)));
        }
        return [...prev, pt];
      });
    }, 1000);
  };

  const pauseWorkout = () => {
    setIsPaused(true);
    clearInterval(simGpsIntervalRef.current);
  };

  const resumeWorkout = () => {
    setIsPaused(false);
    if (isSimulatedGps) {
      startSimulatedWalk();
    }
  };

  // Finish Workout and Save to Device History
  const finishWorkout = () => {
    setIsTracking(false);
    setIsPaused(false);
    stopHardwareListeners();

    const speed = calculateSpeedKmh(distanceKm, elapsedSeconds);
    const pace = formatPace(elapsedSeconds, distanceKm);
    const calories = calculateWalkingCalories(distanceKm, workoutSteps, elapsedSeconds, userWeightKg);
    const coinsEarned = Math.round(workoutSteps / 100) + Math.round(elapsedSeconds / 60);

    const newSession = {
      id: 'sess_' + Date.now(),
      date: new Date().toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      }),
      timestamp: Date.now(),
      durationSeconds: elapsedSeconds,
      steps: workoutSteps,
      distanceKm: Number(distanceKm.toFixed(2)),
      caloriesKcal: calories,
      avgPace: pace,
      avgSpeedKmh: speed,
      avgCadence: cadenceSpm || (workoutSteps > 0 && elapsedSeconds > 0 ? Math.round((workoutSteps / elapsedSeconds) * 60) : 0),
      coinsEarned,
      routePoints: [...routePoints]
    };

    setSessionsHistory(prev => [newSession, ...prev]);
    return newSession;
  };

  // Delete single session from local device
  const deleteSession = (sessionId) => {
    setSessionsHistory(prev => prev.filter(s => s.id !== sessionId));
  };

  // Clear all sessions from local device
  const clearAllSessions = () => {
    setSessionsHistory([]);
    try {
      localStorage.removeItem(SESSIONS_STORAGE_KEY);
    } catch {}
  };

  // Computed Live Metrics
  const currentPace = formatPace(elapsedSeconds, distanceKm);
  const currentSpeed = calculateSpeedKmh(distanceKm, elapsedSeconds);
  const currentCalories = calculateWalkingCalories(distanceKm, workoutSteps, elapsedSeconds, userWeightKg);
  const formattedTime = formatStopwatchTime(elapsedSeconds);

  return {
    isTracking,
    isPaused,
    elapsedSeconds,
    formattedTime,
    workoutSteps,
    distanceKm,
    currentPace,
    currentSpeed,
    cadenceSpm,
    currentCalories,
    routePoints,
    currentLocation,
    sensorPermission,
    gpsStatus,
    sensitivity,
    setSensitivity,
    isSimulatedGps,
    setIsSimulatedGps,
    sessionsHistory,
    startWorkout,
    pauseWorkout,
    resumeWorkout,
    finishWorkout,
    deleteSession,
    clearAllSessions,
    requestMotionPermission
  };
}
