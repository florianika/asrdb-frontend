const { FlatCompat } = require('@eslint/eslintrc');
const js = require('@eslint/js');

const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
});

module.exports = [
  {
    ignores: ['projects/**/*', 'dist/**/*'],
  },
  ...compat.config({
    overrides: [
      {
        files: ['**/*.ts'],
        extends: [
          'eslint:recommended',
          'plugin:@typescript-eslint/recommended',
          'plugin:@angular-eslint/recommended',
          'plugin:@angular-eslint/template/process-inline-templates',
          'plugin:prettier/recommended',
        ],
        rules: {
          '@angular-eslint/directive-selector': [
            'error',
            {
              type: 'attribute',
              prefix: 'asrdb',
              style: 'camelCase',
            },
          ],
          '@angular-eslint/component-selector': [
            'error',
            {
              type: 'element',
              prefix: 'asrdb',
              style: 'kebab-case',
            },
          ],
          '@typescript-eslint/no-explicit-any': 'warn',
          '@typescript-eslint/no-unused-vars': 'warn',
          '@typescript-eslint/ban-ts-comment': 'warn',
          '@angular-eslint/prefer-inject': 'off',
          '@angular-eslint/prefer-standalone': 'off',
          '@angular-eslint/no-empty-lifecycle-method': 'warn',
          'no-restricted-imports': [
            'error',
            {
              patterns: ['rxjs/internal/*', 'rxjs/internal/**'],
            },
          ],
          'prettier/prettier': 'warn',
          semi: ['warn', 'always'],
          quotes: ['warn', 'single'],
        },
      },
      {
        files: ['**/*.html'],
        excludedFiles: ['**/*inline-template-*.component.html'],
        extends: [
          'plugin:@angular-eslint/template/recommended',
          'plugin:prettier/recommended',
        ],
        rules: {
          '@angular-eslint/template/eqeqeq': 'warn',
          '@angular-eslint/template/no-negated-async': 'warn',
          'prettier/prettier': ['warn', { parser: 'angular' }],
        },
      },
    ],
  }),
];
