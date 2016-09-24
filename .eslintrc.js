
module.exports = {
  'env': {
    'es6': true,
    'node': true,
    'mocha': true,
  },
  'extends': [
    'eslint:recommended',
    'plugin:import/errors',
    'plugin:import/warnings',
  ],
  'installedESLint': true,
  'parserOptions': {
    'ecmaVersion': 7,
    'ecmaFeatures': {
      'experimentalObjectRestSpread': true,
      'jsx': true,
    },
    'sourceType': 'module',
  },
  'plugins': [ 'import' ],
  'parser': 'babel-eslint',
  'rules': {
    'eqeqeq': [ 'warn', 'smart' ],
    'block-spacing': [ 'error', 'always' ],
    'brace-style': 'error',
    'keyword-spacing': 'error',
    'key-spacing': 'error',
    'space-in-parens': [ 'error', 'never' ],
    'jsx-quotes': 'warn',
    'array-bracket-spacing': [ 'error', 'always' ],
    'object-curly-spacing': [ 'error', 'always' ],
    'operator-linebreak': [ 'error', 'before' ],
    'comma-dangle': [ 'error', 'always-multiline' ],
    'indent': [ 'warn', 2 ],
    'no-console': [ 'warn', { 'allow': [ 'warn', 'error' ] } ],
    'no-var': 'error',
    'no-unused-vars': [ 'warn', { 'args': 'none' } ],
    'no-use-before-define': 'error',
    'no-dupe-keys': 'error',
    'no-duplicate-case': 'error',
    'no-sparse-arrays': 'error',
    'use-isnan': 'warn',
    'curly': [ 'error', 'multi-line' ],
    'linebreak-style': [ 'error', 'unix' ],
    'semi': [ 'error', 'never' ],
    'unicode-bom': 'error',
    'prefer-const': [ 'error', { 'destructuring': 'all' } ],
    'no-irregular-whitespace': [ 'error', { 'skipStrings': true, 'skipTemplates': true, 'skipComments': true } ],
  },
  'settings': {
    'import/resolver': {
      'node': {
        'extensions': [ '.es', '.js' ],
        'paths': [ __dirname ],
      },
    },
    'import/core-modules': [
      'redux-observers',
    ],
  },
}
