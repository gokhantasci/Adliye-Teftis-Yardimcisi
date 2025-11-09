// ESLint flat config (v9+)
export default [
  {
    ignores: [
      'node_modules/**',
      'assets/js/vendor/**',
      'assets/js/*.min.js',
      'assets/js/jszip.min.js',
      'assets/js/xlsx.full.min.js'
    ]
  },
  {
    files: ['assets/js/**/*.js'],
    languageOptions: {
      ecmaVersion: 2020,
      sourceType: 'script',
      globals: {
        // Browser globals
        window: 'readonly',
        document: 'readonly',
        console: 'readonly',
        localStorage: 'readonly',
        sessionStorage: 'readonly',
        setTimeout: 'readonly',
        setInterval: 'readonly',
        clearTimeout: 'readonly',
        clearInterval: 'readonly',
        alert: 'readonly',
        confirm: 'readonly',
        prompt: 'readonly',
        fetch: 'readonly',
        FormData: 'readonly',
        Blob: 'readonly',
        FileReader: 'readonly',
        location: 'readonly',
        navigator: 'readonly',
        URL: 'readonly',
        CustomEvent: 'readonly',
        Event: 'readonly',
        Image: 'readonly',
        Date: 'readonly',
        Math: 'readonly',
        Number: 'readonly',
        String: 'readonly',
        Array: 'readonly',
        Object: 'readonly',
        Promise: 'readonly',
        requestAnimationFrame: 'readonly',
        cancelAnimationFrame: 'readonly',
        performance: 'readonly',
        DOMParser: 'readonly',
        Element: 'readonly',
        Node: 'readonly',
        MutationObserver: 'readonly',
        TextDecoder: 'readonly',
        // Third-party libraries
        XLSX: 'readonly',
        JSZip: 'readonly',
        jQuery: 'readonly',
        // Application globals
        TeftisUtils: 'readonly',
        G: 'writable',
        toast: 'readonly',
        save: 'readonly',
        logEvent: 'readonly',
        letterToIndex: 'readonly',
        buildMaps: 'readonly',
        renderMatrix: 'readonly',
        renderDecisionMatrixV5: 'readonly',
        TYPES_ORDER: 'readonly'
      }
    },
    rules: {
      'no-console': 'warn',
      'no-debugger': 'error',
      'no-unused-vars': ['warn', { args: 'none', varsIgnorePattern: '^_' }],
      'no-undef': 'error',
      semi: ['error', 'always'],
      quotes: ['warn', 'single', { avoidEscape: true, allowTemplateLiterals: true }],
      indent: ['warn', 2, { SwitchCase: 1 }],
      'no-trailing-spaces': 'warn',
      'eol-last': ['warn', 'always'],
      'no-multiple-empty-lines': ['warn', { max: 2, maxEOF: 1 }],
      'comma-dangle': ['warn', 'never'],
      'space-before-function-paren': ['warn', {
        anonymous: 'never',
        named: 'never',
        asyncArrow: 'always'
      }],
      'keyword-spacing': 'warn',
      'space-infix-ops': 'warn',
      'brace-style': ['warn', '1tbs', { allowSingleLine: true }],
      curly: ['warn', 'multi-line'],
      'no-var': 'warn',
      'prefer-const': 'warn',
      'arrow-spacing': 'warn'
    }
  }
];
