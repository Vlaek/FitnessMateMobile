import { parseProgramInput } from './program-schema';

const validProgram = {
  name: 'Upper body',
  description: 'Monday session',
  exercises: [
    {
      exerciseId: '11111111-1111-4111-8111-111111111111',
      sets: [{ weightKg: 60, repetitions: 8 }],
    },
  ],
};

describe('parseProgramInput', () => {
  it('normalizes valid input', () => {
    expect(parseProgramInput(validProgram)).toEqual(validProgram);
  });

  it('trims metadata', () => {
    expect(parseProgramInput({ ...validProgram, name: ' Upper body ', description: ' Note ' }))
      .toMatchObject({ name: 'Upper body', description: 'Note' });
  });

  it('requires a name, exercise, and set', () => {
    expect(() => parseProgramInput({ ...validProgram, name: '  ' })).toThrow();
    expect(() => parseProgramInput({ ...validProgram, exercises: [] })).toThrow();
    expect(() =>
      parseProgramInput({
        ...validProgram,
        exercises: [{ ...validProgram.exercises[0], sets: [] }],
      }),
    ).toThrow();
  });

  it('rejects invalid set data', () => {
    expect(() =>
      parseProgramInput({
        ...validProgram,
        exercises: [
          {
            ...validProgram.exercises[0],
            sets: [{ weightKg: -1, repetitions: 1 }],
          },
        ],
      }),
    ).toThrow();
  });

  it('accepts zero repetitions normalized from an empty field', () => {
    const input = {
      ...validProgram,
      exercises: [{
        ...validProgram.exercises[0],
        sets: [{ weightKg: 0, repetitions: 0 }],
      }],
    };

    expect(parseProgramInput(input).exercises[0]?.sets[0]?.repetitions).toBe(0);
  });
});
