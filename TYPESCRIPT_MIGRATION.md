# TypeScript Migration Guide

This guide provides a roadmap for migrating the JavaScript codebase to TypeScript.

## Why TypeScript?

- **Type Safety**: Catch errors at compile time instead of runtime
- **Better IDE Support**: Improved autocomplete and IntelliSense
- **Documentation**: Types serve as inline documentation
- **Refactoring**: Safer and easier code refactoring
- **Maintainability**: Easier to understand and maintain large codebases

## Migration Strategy

We recommend a **gradual migration** approach:

1. Set up TypeScript configuration
2. Rename `.js` files to `.ts` one module at a time
3. Add type annotations incrementally
4. Fix type errors as they arise
5. Gradually increase strictness

## Step 1: Install TypeScript

```bash
npm install --save-dev typescript @types/node @types/jquery
```

## Step 2: Create TypeScript Configuration

Create a `tsconfig.json` file in the project root:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "outDir": "./dist",
    "rootDir": "./assets/js",
    "strict": false,  // Start with false, enable gradually
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "moduleResolution": "node",
    "resolveJsonModule": true,
    "allowJs": true,  // Allow mixing .js and .ts files
    "checkJs": false,  // Don't check .js files initially
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "noEmit": false
  },
  "include": [
    "assets/js/**/*"
  ],
  "exclude": [
    "node_modules",
    "assets/js/vendor",
    "assets/js/**/*.min.js"
  ]
}
```

## Step 3: Create Type Definitions

Create a `types` directory for global type definitions:

### `types/global.d.ts`

```typescript
// Global window extensions
interface Window {
  TeftisUtils: typeof TeftisUtils;
  XLSX: any;
  JSZip: any;
  jQuery: any;
  $: any;
  addNote: (val?: string) => void;
  renderNotes: () => void;
  toast: (opts: ToastOptions) => void;
  escapeHtml: (s: string) => string;
  formatRetryMessage: (sec: number) => string;
  XlsSpinner: {
    show: () => void;
    hide: () => void;
  };
  setInlineXlsLoading: (container: string | HTMLElement, active: boolean) => void;
}

interface ToastOptions {
  type: 'success' | 'danger' | 'warning' | 'info';
  title: string;
  body: string;
  delay?: number;
}

// TeftisUtils namespace
declare namespace TeftisUtils {
  function letterToIndex(col: string): number;
  function escapeHtml(s: string): string;
  function normalizeTurkish(s: string): string;
  function showToast(opts: ToastOptions): void;
  function toastWithIcon(
    type: 'success' | 'danger' | 'warning' | 'info',
    title: string,
    msg: string,
    delay?: number
  ): void;
  function formatNumber(n: number): string;
  function formatDate(d: Date | string): string;
  function debounce<T extends (...args: any[]) => any>(
    fn: T,
    delay: number
  ): (...args: Parameters<T>) => void;
  function isExcelFile(file: File): boolean;
  function isValidAdaletEmail(email: string): boolean;
  function extractEmail(text: string): string | null;
  function formatRetryMessage(sec: number): string;
  function createElement<K extends keyof HTMLElementTagNameMap>(
    tag: K,
    attrs?: Record<string, string>,
    html?: string
  ): HTMLElementTagNameMap[K];
}
```

### `types/xlsx.d.ts`

```typescript
// Basic XLSX type definitions
declare module 'xlsx' {
  export interface WorkBook {
    SheetNames: string[];
    Sheets: { [sheet: string]: WorkSheet };
  }

  export interface WorkSheet {
    [cell: string]: CellObject;
  }

  export interface CellObject {
    v: any;
    w?: string;
    t: string;
    f?: string;
    r?: string;
    h?: string;
    c?: any[];
    z?: string;
  }

  export function read(data: any, opts?: any): WorkBook;
  export function utils: {
    sheet_to_json: (sheet: WorkSheet, opts?: any) => any[];
    sheet_to_csv: (sheet: WorkSheet, opts?: any) => string;
  };
}
```

## Step 4: Migrate utils.js to utils.ts

Example migration of `utils.js`:

```typescript
// assets/js/utils.ts

type ToastType = 'success' | 'danger' | 'warning' | 'info';

interface ToastOptions {
  type: ToastType;
  title: string;
  body: string;
  delay?: number;
}

(function(window: Window): void {
  'use strict';

  // Prevent double initialization
  if (window.TeftisUtils) return;

  function letterToIndex(col: string): number {
    col = String(col || '').trim().toUpperCase();
    let n = 0;
    for (let i = 0; i < col.length; i++) {
      n = n * 26 + (col.charCodeAt(i) - 64);
    }
    return n - 1;
  }

  function escapeHtml(s: string): string {
    const map: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    };
    return String(s ?? '').replace(/[&<>"']/g, (m) => map[m]);
  }

  // ... rest of the functions with types

  // Export to window
  window.TeftisUtils = {
    letterToIndex,
    escapeHtml,
    // ... rest of exports
  };
})(window);
```

## Step 5: Update Build Process

Add TypeScript compilation to package.json:

```json
{
  "scripts": {
    "build": "tsc",
    "build:watch": "tsc --watch",
    "type-check": "tsc --noEmit",
    "lint": "eslint 'assets/js/**/*.{js,ts}' --ignore-pattern '*.min.js'",
    "test": "jest"
  }
}
```

## Step 6: Gradual Migration Plan

Migrate files in this order (from most critical to least):

1. ✅ **utils.ts** - Core utilities (already well-structured)
2. **app.ts** - Main application logic
3. **modal-*.ts** - Modal management
4. **kesinlesme.ts** - Core business logic modules
5. **iddianame.ts** - Excel processing modules
6. Other specialized modules

## Step 7: Enable Strict Mode Gradually

Once basic migration is complete, gradually enable strict checks:

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictBindCallApply": true,
    "strictPropertyInitialization": true,
    "noImplicitThis": true,
    "alwaysStrict": true
  }
}
```

## Benefits of This Approach

✅ **No Breaking Changes**: Existing code continues to work  
✅ **Incremental**: Migrate one file at a time  
✅ **Safe**: Type checking prevents bugs  
✅ **Gradual**: Can take as much time as needed  
✅ **Reversible**: Can always revert to JavaScript if needed  

## Additional Resources

- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- [TypeScript for JavaScript Programmers](https://www.typescriptlang.org/docs/handbook/typescript-in-5-minutes.html)
- [Migrating from JavaScript](https://www.typescriptlang.org/docs/handbook/migrating-from-javascript.html)

## Current Status

TypeScript migration is **optional** and can be implemented gradually without disrupting the current workflow. The codebase is already well-structured for migration.
