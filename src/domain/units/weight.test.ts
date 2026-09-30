import { fromCanonicalKg, getWeightUnitTranslationKey, toCanonicalKg } from './weight';

describe('weight conversion', () => {
  it('keeps kilograms canonical', () => {
    expect(toCanonicalKg(82.5, 'kg')).toBe(82.5);
    expect(fromCanonicalKg(82.5, 'kg')).toBe(82.5);
  });

  it('round-trips pounds without accumulating display noise', () => {
    const kilograms = toCanonicalKg(225, 'lb');
    expect(kilograms).toBeCloseTo(102.058, 3);
    expect(fromCanonicalKg(kilograms, 'lb')).toBe(225);
  });

  it('rejects invalid input', () => {
    expect(() => toCanonicalKg(-1, 'kg')).toThrow('Weight must be a finite non-negative number');
    expect(() => toCanonicalKg(Number.NaN, 'lb')).toThrow(
      'Weight must be a finite non-negative number',
    );
  });
});

describe('weight unit translation', () => {
  it.each([
    ['kg', 'common.kg'],
    ['lb', 'common.lb'],
  ] as const)('maps %s to %s', (unit, key) => {
    expect(getWeightUnitTranslationKey(unit)).toBe(key);
  });
});
