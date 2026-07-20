import * as SQLite from 'expo-sqlite';

import type { DatabaseAdapter, SqlParams } from './types';

let nativeDb: SQLite.SQLiteDatabase | null = null;

function getNativeDb(): SQLite.SQLiteDatabase {
  nativeDb ??= SQLite.openDatabaseSync('fitnessmate.db', {
    enableChangeListener: true,
  });
  return nativeDb;
}

export const database: DatabaseAdapter = {
  execAsync: (sql) => getNativeDb().execAsync(sql),
  runAsync: async (sql, params: SqlParams = []) => {
    const result = await getNativeDb().runAsync(sql, ...params);
    return { changes: result.changes, lastInsertRowId: result.lastInsertRowId };
  },
  getFirstAsync: (sql, params: SqlParams = []) => getNativeDb().getFirstAsync(sql, ...params),
  getAllAsync: (sql, params: SqlParams = []) => getNativeDb().getAllAsync(sql, ...params),
  withTransactionAsync: (task) => getNativeDb().withTransactionAsync(task),
};
