import { FakeDatabase } from '@/test/fake-database';

import { bootstrapDatabase } from './bootstrap';
import { BUILT_IN_EXERCISES } from './seed/built-in-exercises';

describe('bootstrapDatabase', () => {
  it('seeds stable built-in exercises idempotently', async () => {
    const db = new FakeDatabase();

    await bootstrapDatabase(db);
    await bootstrapDatabase(db);

    const inserts = db.queries.filter((query) =>
      query.sql.includes('INSERT OR IGNORE INTO exercises'),
    );
    expect(BUILT_IN_EXERCISES).toHaveLength(10);
    expect(new Set(BUILT_IN_EXERCISES.map((exercise) => exercise.id)).size).toBe(10);
    expect(inserts).toHaveLength(20);
    expect(inserts.every((query) => query.params[2] !== null)).toBe(true);
  });
});
