export interface HealthSnapshot {
  weight: number | null;
  /** Number of 750 ml bottles recorded in the current snapshot. */
  water: number | null;
  sleep: number | null;
  workout: number | null;
}

export type HealthMetricKey = keyof HealthSnapshot;
