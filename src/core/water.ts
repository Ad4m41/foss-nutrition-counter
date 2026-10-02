import { validDay } from './nutrition';
export function validateWaterChange(day: string, delta: number) {
  if (!validDay(day) || !Number.isInteger(delta) || Math.abs(delta) > 20000)
    throw new Error('Invalid water entry');
}
