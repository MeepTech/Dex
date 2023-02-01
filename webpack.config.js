// webpack.config.js
const path = require('path')

module.exports = (env = {}) => {
  return require(path.resolve(__dirname,  `webpack.config.${env.dev?"dev":"prod"}.js`))
}