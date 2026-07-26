import type { DatabaseAdapter, SqlParams, SqlRunResult } from '@/database/types';

export type RecordedQuery = {
  sql: string;
  params: SqlParams;
};

export class FakeDatabase implements DatabaseAdapter {
  executedSql: string[] = [];
  queries: RecordedQuery[] = [];
  userVersion: number;
  transactionCount = 0;
  committedTransactions = 0;
  private firstResults: unknown[] = [];
  private allResults: unknown[][] = [];
  private failPattern: string | null = null;

  constructor(options: { userVersion?: number } = {}) {
    this.userVersion = options.userVersion ?? 0;
  }

  queueFirst<T>(value: T | null): void {
    this.firstResults.push(value);
  }

  queueAll<T>(value: T[]): void {
    this.allResults.push(value);
  }

  failWhenSqlIncludes(pattern: string): void {
    this.failPattern = pattern;
  }

  async execAsync(sql: string): Promise<void> {
    this.record(sql, []);
    const versionMatch = sql.match(/PRAGMA user_version\s*=\s*(\d+)/i);

    if (versionMatch?.[1]) {
      this.userVersion = Number(versionMatch[1]);
    }
  }

  async runAsync(sql: string, params: SqlParams = []): Promise<SqlRunResult> {
    this.record(sql, params);

    return { changes: 1, lastInsertRowId: 1 };
  }

  async getFirstAsync<T>(sql: string, params: SqlParams = []): Promise<T | null> {
    this.record(sql, params);

    if (/PRAGMA user_version/i.test(sql)) {
      return { user_version: this.userVersion } as T;
    }

    return (this.firstResults.shift() as T | null | undefined) ?? null;
  }

  async getAllAsync<T>(sql: string, params: SqlParams = []): Promise<T[]> {
    this.record(sql, params);

    return (this.allResults.shift() as T[] | undefined) ?? [];
  }

  async withTransactionAsync(task: () => Promise<void>): Promise<void> {
    this.transactionCount += 1;
    await task();
    this.committedTransactions += 1;
  }

  private record(sql: string, params: SqlParams): void {
    if (this.failPattern && sql.includes(this.failPattern)) {
      throw new Error(`Forced SQL failure: ${this.failPattern}`);
    }

    this.executedSql.push(sql);
    this.queries.push({ sql, params });
  }
}
