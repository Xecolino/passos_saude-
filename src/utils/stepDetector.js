/**
 * Pedometer Digital Signal Processing (DSP) Step Detector
 * Uses DeviceMotionEvent (accelerometer) with adaptive filtering,
 * peak detection, refractory period, and rhythmic validation.
 */

export class StepDetector {
  constructor(options = {}) {
    this.onStep = options.onStep || (() => {});
    this.onCadenceUpdate = options.onCadenceUpdate || (() => {});

    // Sensitivity settings: threshold in m/s^2
    this.sensitivity = options.sensitivity || 'normal'; // 'alta', 'normal', 'baixa'
    this.threshold = this.getThresholdForSensitivity(this.sensitivity);

    // Filtering variables
    this.gravity = 9.81;
    this.alpha = 0.88; // Low-pass filter smoothing coefficient
    this.lastMagnitude = 0;
    this.lastTimestamp = 0;
    this.lastStepTime = 0;

    // State machine for peak detection
    this.isAboveThreshold = false;
    this.peakValue = 0;

    // Minimum refractory period between consecutive steps (ms)
    // 270ms corresponds to ~222 steps/min (maximum brisk human walking)
    this.minStepIntervalMs = 270;
    this.maxStepIntervalMs = 2400;

    // Anti-false-positive validation buffer
    // Requires at least 4 rhythmic steps before confirming walk cadence
    this.stepCandidateTimes = [];
    this.confirmedSteps = 0;
    this.isWalkingConfirmed = false;

    // Cadence calculation (steps per minute)
    this.recentIntervals = [];
  }

  getThresholdForSensitivity(level) {
    switch (level) {
      case 'alta': // Pocket or smoother walk
        return 1.3;
      case 'baixa': // Strict filter against fidgeting
        return 2.5;
      case 'normal':
      default:
        return 1.8;
    }
  }

  setSensitivity(level) {
    this.sensitivity = level;
    this.threshold = this.getThresholdForSensitivity(level);
  }

  /**
   * Process a motion sample from DeviceMotionEvent
   * @param {Object} acceleration {x, y, z}
   * @param {number} timestamp DOMHighResTimeStamp or Date.now()
   */
  processSample(accel, timestamp = Date.now()) {
    if (!accel || accel.x === null || accel.y === null || accel.z === null) {
      return false;
    }

    const x = accel.x || 0;
    const y = accel.y || 0;
    const z = accel.z || 0;

    // 1. Calculate raw vector magnitude
    const rawMagnitude = Math.sqrt(x * x + y * y + z * z);

    // 2. Low-pass filter to estimate gravity component
    this.gravity = this.alpha * this.gravity + (1 - this.alpha) * rawMagnitude;

    // 3. Dynamic acceleration (remove baseline gravity)
    const dynamicAcc = rawMagnitude - this.gravity;

    // 4. Peak detection with adaptive threshold
    let stepDetected = false;

    if (dynamicAcc > this.threshold) {
      if (!this.isAboveThreshold) {
        this.isAboveThreshold = true;
        this.peakValue = dynamicAcc;
      } else if (dynamicAcc > this.peakValue) {
        this.peakValue = dynamicAcc;
      }
    } else if (this.isAboveThreshold && dynamicAcc < this.threshold * 0.4) {
      // Downward slope crossing: potential peak
      this.isAboveThreshold = false;
      const intervalSinceLast = timestamp - this.lastStepTime;

      // Check refractory period: reject noise occurring too quickly (< 270ms)
      if (intervalSinceLast >= this.minStepIntervalMs) {
        stepDetected = this.validateRhythmicStep(timestamp, intervalSinceLast);
      }
    }

    this.lastMagnitude = rawMagnitude;
    this.lastTimestamp = timestamp;

    return stepDetected;
  }

  /**
   * Validates whether candidate steps are part of a continuous rhythmic walk
   * Prevents false counts when picking up phone or typing.
   */
  validateRhythmicStep(timestamp, intervalMs) {
    // Check if interval is within typical walking cadence range (270ms - 2400ms)
    const isPlausibleCadence = intervalMs <= this.maxStepIntervalMs;

    if (!isPlausibleCadence) {
      // Motion stopped: reset confirmation buffer
      this.stepCandidateTimes = [timestamp];
      this.isWalkingConfirmed = false;
      this.recentIntervals = [];
      this.lastStepTime = timestamp;
      return false;
    }

    this.stepCandidateTimes.push(timestamp);
    this.lastStepTime = timestamp;

    // Store recent interval for cadence computation
    this.recentIntervals.push(intervalMs);
    if (this.recentIntervals.length > 6) {
      this.recentIntervals.shift();
    }

    // Compute live cadence (steps per minute)
    const avgInterval =
      this.recentIntervals.reduce((a, b) => a + b, 0) / this.recentIntervals.length;
    const liveCadenceSpm = avgInterval > 0 ? Math.round(60000 / avgInterval) : 0;
    this.onCadenceUpdate(liveCadenceSpm);

    // If walking is already confirmed, fire step immediately
    if (this.isWalkingConfirmed) {
      this.confirmedSteps += 1;
      this.onStep({
        count: 1,
        total: this.confirmedSteps,
        timestamp,
        cadence: liveCadenceSpm
      });
      return true;
    }

    // If not yet confirmed, wait for 4 consecutive rhythmic steps
    if (this.stepCandidateTimes.length >= 4) {
      this.isWalkingConfirmed = true;
      // Credit the 4 validated steps that started the streak
      const initialStepBatch = this.stepCandidateTimes.length;
      this.confirmedSteps += initialStepBatch;
      this.onStep({
        count: initialStepBatch,
        total: this.confirmedSteps,
        timestamp,
        cadence: liveCadenceSpm
      });
      return true;
    }

    return false;
  }

  reset() {
    this.gravity = 9.81;
    this.lastMagnitude = 0;
    this.lastTimestamp = 0;
    this.lastStepTime = 0;
    this.isAboveThreshold = false;
    this.peakValue = 0;
    this.stepCandidateTimes = [];
    this.confirmedSteps = 0;
    this.isWalkingConfirmed = false;
    this.recentIntervals = [];
  }
}
