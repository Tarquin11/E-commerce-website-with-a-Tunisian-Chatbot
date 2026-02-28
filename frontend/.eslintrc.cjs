module.exports = {
  ignorePatterns: ["venv/", "node_modules/", "build/", "dist/", "__pycache__/"] ,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2024,
    sourceType: 'module',
    ecmaFeatures: { jsx: true },
    project: './tsconfig.json'
  },
  plugins: ['@typescript-eslint', 'react'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react/recommended'
  ],
  settings: { react: { version: 'detect' } },
  env: { browser: true, es2024: true, node: true },
  rules: {
    // keep defaults; project can customize
  },
  overrides: [
    {
      files: ['*.ts', '*.tsx'],
      parser: '@typescript-eslint/parser'
    },
    {
      files: ['*.js', '*.jsx'],
      parserOptions: { ecmaFeatures: { jsx: true } }
    }
  ]
};
