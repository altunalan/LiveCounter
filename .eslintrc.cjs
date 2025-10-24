module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint', 'react', 'react-hooks', 'prettier'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    'plugin:prettier/recommended'
  ],
  settings: {
    react: {
      version: 'detect'
    }
  },
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module'
  },
  env: {
    node: true,
    browser: true,
    es2021: true
  },
  rules: {
    "react/react-in-jsx-scope": "off"
  },
  overrides: [
    {
      files: ['**/*.ts', '**/*.tsx'],
      parserOptions: {
        project: ['./tsconfig.eslint.json']
      }
    },
    {
      files: ['packages/server/**/*.ts'],
      env: {
        node: true
      }
    },
    {
      files: ['packages/contracts/**/*.ts'],
      env: {
        node: true
      }
    }
  ]
};
