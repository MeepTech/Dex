const path = require('path')
const merge = require('webpack-merge');
const shared = require('./webpack.config.shared.js');

module.exports = merge(shared, {
  mode: 'development',
});