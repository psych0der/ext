const common = require('./webpack.common.config')
const merge = require('webpack-merge')

module.exports = merge(common, {
  mode: 'development',
  devtool: 'source-map'
})
