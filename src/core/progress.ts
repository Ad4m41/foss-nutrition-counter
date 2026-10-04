/** Above the goal, the rail represents the full consumed amount. */
export function progressSegments(value: number, goal?: number) {
  if (!Number.isFinite(value) || !goal || !Number.isFinite(goal) || goal <= 0)
    return { within: 0, excess: 0 };
  const consumed = Math.max(0, value);
  const scale = Math.max(goal, consumed);
  return {
    within: Math.min(consumed, goal) / scale,
    excess: Math.max(0, consumed - goal) / scale,
  };
}
