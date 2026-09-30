export type TWeightUnit = 'kg' | 'lb';

export function getWeightUnitTranslationKey(unit: TWeightUnit): `common.${TWeightUnit}` {
  return `common.${unit}`;
}

const POUNDS_PER_KILOGRAM = 2.2046226218;

function assertWeight(value: number): void {
  if (!Number.isFinite(value) || value < 0) {
    throw new Error('Weight must be a finite non-negative number');
  }
}

export function toCanonicalKg(value: number, unit: TWeightUnit): number {
  assertWeight(value);

  return unit === 'kg' ? value : value / POUNDS_PER_KILOGRAM;
}

export function fromCanonicalKg(valueKg: number, unit: TWeightUnit): number {
  assertWeight(valueKg);
  const displayed = unit === 'kg' ? valueKg : valueKg * POUNDS_PER_KILOGRAM;

  return Math.round(displayed * 100) / 100;
}
