import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist', 'call-center-backend', 'forecasting-service']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
    },
    rules: {
      // legacy thunks/pages use `any`; keep visible but do not fail the build
      '@typescript-eslint/no-explicit-any': 'warn',
      // "load data on mount" effects are intentional in this codebase
      'react-hooks/set-state-in-effect': 'off',
      'preserve-caught-error': 'off',
      'react-refresh/only-export-components': 'warn',
    },
  },
])
