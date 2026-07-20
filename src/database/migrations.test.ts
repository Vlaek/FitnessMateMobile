import { FakeDatabase } from '@/test/fake-database';

import { CURRENT_DATABASE_VERSION, migrateDatabase } from './migrations';

describe('migrateDatabase', () => {
  it('enables foreign keys and applies the current schema once', async () => {
    const db = new FakeDatabase({ userVersion: 0 });

    await migrateDatabase(db);

    expect(db.executedSql.join('\n')).toContain('PRAGMA foreign_keys = ON');
    expect(db.executedSql.join('\n')).toContain('CREATE TABLE IF NOT EXISTS exercises');
    expect(db.userVersion).toBe(CURRENT_DATABASE_VERSION);

    const schemaApplications = db.executedSql.filter((sql) =>
      sql.includes('CREATE TABLE IF NOT EXISTS exercises'),
    ).length;
    await migrateDatabase(db);
    expect(
      db.executedSql.filter((sql) => sql.includes('CREATE TABLE IF NOT EXISTS exercises')),
    ).toHaveLength(schemaApplications);
  });

  it('rejects a database newer than the application', async () => {
    const db = new FakeDatabase({ userVersion: CURRENT_DATABASE_VERSION + 1 });
    await expect(migrateDatabase(db)).rejects.toThrow('Unsupported database version');
  });
});
