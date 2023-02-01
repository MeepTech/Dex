const path = require('path')
const {merge} = require('webpack-merge');
const shared = require(path.resolve(__dirname, 'webpack.config.shared.js'));

module.exports = merge(shared({dev: true}), {
  mode: 'development',
  devtool: 'inline-source-map',
  stats: 'verbose'
});