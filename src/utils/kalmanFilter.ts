/**
 * Simple 1D Kalman Filter for smoothing position estimates
 * Reduces noise and drift from optical flow calculations
 */
export class KalmanFilter1D {
  private estimate: number;
  private estimate_error: number;
  private measurement_error: number;
  private kalman_gain: number;

  constructor(
    initialEstimate: number = 0,
    initialEstimateError: number = 1,
    measurementError: number = 0.2
  ) {
    this.estimate = initialEstimate;
    this.estimate_error = initialEstimateError;
    this.measurement_error = measurementError;
    this.kalman_gain = 0;
  }

  /**
   * Update filter with new measurement
   * Returns smoothed estimate
   */
  update(measurement: number): number {
    // Predict: assume position might drift, increase uncertainty
    this.estimate_error += 0.005; // Process noise (minimal drift for better responsiveness)

    // Update: correct based on measurement
    this.kalman_gain =
      this.estimate_error / (this.estimate_error + this.measurement_error);

    // New estimate = old estimate + gain * (measurement - estimate)
    this.estimate = this.estimate + this.kalman_gain * (measurement - this.estimate);

    // Update error
    this.estimate_error = (1 - this.kalman_gain) * this.estimate_error;

    return this.estimate;
  }

  /**
   * Reset filter to initial state
   */
  reset(initialEstimate: number = 0): void {
    this.estimate = initialEstimate;
    this.estimate_error = 1;
    this.kalman_gain = 0;
  }

  /**
   * Get current smoothed estimate without updating
   */
  getEstimate(): number {
    return this.estimate;
  }

  /**
   * Get current uncertainty/error
   */
  getError(): number {
    return this.estimate_error;
  }
}

/**
 * 2D position filter using separate Kalman filters for X and Y
 */
export class KalmanFilter2D {
  private filterX: KalmanFilter1D;
  private filterY: KalmanFilter1D;

  constructor(initialX: number = 0, initialY: number = 0) {
    this.filterX = new KalmanFilter1D(initialX, 1, 0.2);
    this.filterY = new KalmanFilter1D(initialY, 1, 0.2);
  }

  /**
   * Update both X and Y with new measurements
   */
  update(x: number, y: number): { x: number; y: number } {
    return {
      x: this.filterX.update(x),
      y: this.filterY.update(y),
    };
  }

  /**
   * Reset to initial position
   */
  reset(x: number = 0, y: number = 0): void {
    this.filterX.reset(x);
    this.filterY.reset(y);
  }

  /**
   * Get current position
   */
  getPosition(): { x: number; y: number } {
    return {
      x: this.filterX.getEstimate(),
      y: this.filterY.getEstimate(),
    };
  }
}
