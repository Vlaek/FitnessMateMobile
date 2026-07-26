import { spawnSync } from 'node:child_process';

describe('ESLint project conventions', () => {
  it('requires a blank line between exported type declarations', () => {
    const result = spawnSync(
      process.execPath,
      [
        'node_modules/eslint/bin/eslint.js',
        '--stdin',
        '--stdin-filename',
        'src/type-spacing-fixture.ts',
        '--format',
        'json',
      ],
      {
        cwd: process.cwd(),
        encoding: 'utf8',
        input: ['export type TFirst = string;', 'export type TSecond = number;'].join('\n'),
      },
    );
    const [report] = JSON.parse(result.stdout) as {
      messages: { messageId?: string; ruleId: string | null }[];
    }[];

    expect(result.error).toBeUndefined();
    expect(report.messages).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          messageId: 'expectedBlankLine',
          ruleId: '@stylistic/padding-line-between-statements',
        }),
      ]),
    );
  });
});
