# InvestMateMobile Formatting Parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Добавить в FitnessMateMobile тот же набор инструментов форматирования, что используется в InvestMateMobile.

**Architecture:** Prettier отвечает за механическое форматирование, а ESLint — за обязательные фигурные скобки и разделение блоков пустыми строками. Конфигурация остаётся локальной для проекта и сохраняет текущий CommonJS-формат ESLint.

**Tech Stack:** Expo 57, TypeScript, ESLint 9 flat config, `@stylistic/eslint-plugin`, Prettier 3, VS Code.

---

### Task 1: Добавить инструменты и конфигурацию

**Files:**
- Create: `.prettierrc.json`
- Create: `.vscode/settings.json`
- Create: `.vscode/extensions.json`
- Modify: `eslint.config.js`
- Modify: `package.json`
- Modify: `package-lock.json`

- [ ] **Step 1: Установить зависимости**

Run:

```powershell
npm.cmd install --save-dev prettier@^3.9.5 @stylistic/eslint-plugin@^5.10.0 --cache .artifacts\npm-cache
```

Expected: зависимости добавлены в `devDependencies`, lock-файл обновлён.

- [ ] **Step 2: Добавить конфигурацию Prettier**

```json
{
  "printWidth": 100,
  "singleQuote": true
}
```

- [ ] **Step 3: Добавить настройки VS Code**

`settings.json` включает Prettier по умолчанию, форматирование при сохранении,
явные `source.fixAll`, `source.organizeImports`, `source.sortMembers` и
`prettier.requireConfig`.

`extensions.json` рекомендует `expo.vscode-expo-tools` и `esbenp.prettier-vscode`.

- [ ] **Step 4: Дополнить ESLint**

Подключить `@stylistic/eslint-plugin`, правило `curly: ['error', 'all']` и
`@stylistic/padding-line-between-statements` с теми же группами control flow,
что в InvestMateMobile. Сохранить существующие исключения `dist/**` и `coverage/**`.

- [ ] **Step 5: Дополнить npm-команды**

Добавить:

```json
"lint:fix": "expo lint --fix",
"format": "prettier --write \"src/**/*.{ts,tsx}\" \"app/**/*.{ts,tsx}\" \"eslint.config.js\" \"package.json\" \".prettierrc.json\" \".vscode/*.json\"",
"format:check": "prettier --check \"src/**/*.{ts,tsx}\" \"app/**/*.{ts,tsx}\" \"eslint.config.js\" \"package.json\" \".prettierrc.json\" \".vscode/*.json\"",
"fix": "npm run lint:fix && npm run format",
"check": "npm run format:check && npm run typecheck && npm run lint && npm test"
```

- [ ] **Step 6: Зафиксировать конфигурацию**

```powershell
git add .prettierrc.json .vscode eslint.config.js package.json package-lock.json
git commit -m "chore: align formatting with InvestMateMobile"
```

### Task 2: Отформатировать проект и проверить изменения

**Files:**
- Modify: `src/**/*.ts`
- Modify: `src/**/*.tsx`
- Modify: `app/**/*.ts`
- Modify: `app/**/*.tsx`

- [ ] **Step 1: Применить автоматические исправления**

Run:

```powershell
npm.cmd run fix
```

Expected: ESLint и Prettier завершаются без ошибок и форматируют поддерживаемые файлы.

- [ ] **Step 2: Запустить полную проверку**

Run:

```powershell
npm.cmd run check
git diff --check
```

Expected: форматирование, типизация, ESLint, тесты и проверка пробелов проходят.

- [ ] **Step 3: Зафиксировать механическое форматирование вместе с текущими UI-изменениями**

```powershell
git add app src
git commit -m "feat: improve mobile forms and reordering"
```

Файл `TODOS.md` не добавлять.
