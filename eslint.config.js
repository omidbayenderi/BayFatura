import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist', 'android', 'ios', '**/SeoAgent.jsx', '**/Success.jsx']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    rules: {
      'no-unused-vars': 'off',
      'no-undef': 'off',
      'react-hooks/set-state-in-effect': 'off',
      'react-hooks/exhaustive-deps': 'off',
      'react-refresh/only-export-components': 'off',
      'react-hooks/purity': 'off',
    },
  },
  {
    files: ['functions/**/*.{js,jsx}'],
    languageOptions: {
      globals: { ...globals.node, process: 'readonly', Buffer: 'readonly' },
      ecmaVersion: 'latest',
      sourceType: 'module',
    },
  },
  {
    files: ['src/components/SeoAgent.jsx'],
    rules: {
      'no-unused-vars': 'off',
      'react-hooks/purity': 'off',
    },
  },
  {
    files: ['src/pages/Settings.jsx'],
    rules: {
      'react-hooks/exhaustive-deps': 'off',
      'react-hooks/immutability': 'off',
    },
  },
  {
    files: ['src/pages/InvoiceView.jsx'],
    rules: {
      'react-hooks/immutability': 'off',
    },
  },
])
