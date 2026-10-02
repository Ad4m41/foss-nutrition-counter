import { otterState } from '../src/core/otter';
describe('otter reaction to diary entries', () => {
  it('changes body and droplet independently', () => {
    const empty = otterState(0, 2000, 0, 2000);
    const fed = otterState(2000, 2000, 0, 2000);
    const watered = otterState(0, 2000, 2000, 2000);
    expect(fed.bodyScale).toBeGreaterThan(empty.bodyScale);
    expect(fed.hydration).toBe(empty.hydration);
    expect(watered.bodyScale).toBe(empty.bodyScale);
    expect(watered.hydration).toBe(1);
  });
  it('bounds reactions without hiding the droplet or collapsing the body', () => {
    expect(otterState(-100, 2000, -100, 2000)).toEqual({
      bodyScale: 0.92,
      hydration: 0.15,
    });
    expect(otterState(10000, 2000, 10000, 2000)).toEqual({
      bodyScale: 1.1,
      hydration: 1,
    });
  });
  it('handles unset or non-finite goals and entries', () => {
    expect(otterState(NaN, 0, Infinity, -1)).toEqual({
      bodyScale: 0.92,
      hydration: 0.15,
    });
  });
});
