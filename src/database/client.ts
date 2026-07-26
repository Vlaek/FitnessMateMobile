import * as SQLite from 'expo-sqlite';
import type { IDatabaseAdapter, TSqlParams } from './types';

let nativeDb: SQLite.SQLiteDatabase | null = null;

function getNativeDb(): SQLite.SQLiteDatabase {
  nativeDb ??= SQLite.openDatabaseSync('fitnessmate.db', {
    enableChangeListener: true,
  });

  return nativeDb;
}

export const database: IDatabaseAdapter = {
  execAsync: (sql) => getNativeDb().execAsync(sql),
  runAsync: async (sql, params: TSqlParams = []) => {
    const result = await getNativeDb().runAsync(sql, ...params);

    return { changes: result.changes, lastInsertRowId: result.lastInsertRowId };
  },
  getFirstAsync: (sql, params: TSqlParams = []) => getNativeDb().getFirstAsync(sql, ...params),
  getAllAsync: (sql, params: TSqlParams = []) => getNativeDb().getAllAsync(sql, ...params),
  withTransactionAsync: (task) => getNativeDb().withTransactionAsync(task),
};
