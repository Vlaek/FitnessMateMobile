import { calculateAnalytics } from './analytics';

describe('calculateAnalytics', () => {
  it('calculates weekly volume and records from completed sets', () => {
    const result = calculateAnalytics(
      [
        {
          workoutId: 'a',
          completedAt: '2026-07-20T10:00:00.000Z',
          exerciseName: 'squat',
          weightKg: 100,
          repetitions: 5,
        },
        {
          workoutId: 'a',
          completedAt: '2026-07-20T10:00:00.000Z',
          exerciseName: 'squat',
          weightKg: 110,
          repetitions: 3,
        },
        {
          workoutId: 'b',
          completedAt: '2026-07-01T10:00:00.000Z',
          exerciseName: 'squat',
          weightKg: 80,
          repetitions: 10,
        },
      ],
      new Date('2026-07-20T12:00:00.000Z'),
    );
    expect(result.totalWorkouts).toBe(2);
    expect(result.weeklyVolumeKg).toBe(830);
    expect(result.records[0]).toMatchObject({
      exerciseName: 'squat',
      maxWeightKg: 110,
      maxSetVolumeKg: 800,
    });
  });
});
