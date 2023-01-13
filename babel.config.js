module.exports = {

  presets: [
    ['@babel/preset-env', {
      targets: { node: 'current' }
    }],
    '@babel/preset-typescript',
  ],

  plugins: [
    ['@babel/plugin-proposal-decorators', {
      version: "2021-12",
      decoratorsBeforeExport: true
    }]
  ],
};