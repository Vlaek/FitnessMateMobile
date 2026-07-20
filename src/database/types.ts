export type SqlValue = string | number | null;
export type SqlParams = SqlValue[];

export type SqlRunResult = {
  changes: number;
  lastInsertRowId: number;
};

export interface DatabaseAdapter {
  execAsync(sql: string): Promise<void>;
  runAsync(sql: string, params?: SqlParams): Promise<SqlRunResult>;
  getFirstAsync<T>(sql: string, params?: SqlParams): Promise<T | null>;
  getAllAsync<T>(sql: string, params?: SqlParams): Promise<T[]>;
  withTransactionAsync(task: () => Promise<void>): Promise<void>;
}
