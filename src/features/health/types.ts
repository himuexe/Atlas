export interface HealthSnapshot {
  weight: number | null;
  water: number | null;
  sleep: number | null;
  workout: number | null;
}

export type HealthMetricKey = keyof HealthSnapshot;
