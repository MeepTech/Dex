const path = require('path');

module.exports = (env) => ({
  entry: './src/lib.ts',
  output: {
    path: path.resolve(__dirname, 'build', 'wp', env),
    filename: 'lib.js',
    library: 'Dex'
  },
  resolve: {
    extensions: ['.ts', 'js']
  },
  module: {
    rules: [
      {
        test: /\.(j|t)s?$/,
        include: path.resolve(__dirname, 'src'),
        loader: 'babel-loader'
      }
    ]
  }
});