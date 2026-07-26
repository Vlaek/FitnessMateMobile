export type TSqlValue = string | number | null;

export type TSqlParams = TSqlValue[];

export type TSqlRunResult = {
  changes: number;
  lastInsertRowId: number;
};

export interface IDatabaseAdapter {
  execAsync(sql: string): Promise<void>;
  runAsync(sql: string, params?: TSqlParams): Promise<TSqlRunResult>;
  getFirstAsync<T>(sql: string, params?: TSqlParams): Promise<T | null>;
  getAllAsync<T>(sql: string, params?: TSqlParams): Promise<T[]>;
  withTransactionAsync(task: () => Promise<void>): Promise<void>;
}
