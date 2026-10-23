export type BatteryTone = "healthy" | "moderate" | "low" | "unknown";

export function batteryTone(health: number | null | undefined): BatteryTone {
  if (health == null || !Number.isFinite(health) || health <= 0) return "unknown";
  if (health > 80) return "healthy";
  if (health >= 70) return "moderate";
  return "low";
}
