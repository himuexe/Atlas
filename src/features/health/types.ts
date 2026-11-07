export interface HealthSnapshot {
  weight: number | null;
  /** Number of 750 ml bottles recorded in the current snapshot. */
  water: number | null;
  sleep: number | null;
  workout: number | null;
}

export type HealthMetricKey = keyof HealthSnapshot;

export interface HealthMetricEntry {
  id: string;
  metric: HealthMetricKey;
  value: number | null;
  observedAt: string | null;
  enteredAt: string;
  origin: 'user' | 'legacy-baseline';
}
