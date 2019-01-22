const common = require('./webpack.common.config')
const merge = require('webpack-merge')
const CopyWebpackPlugin = require('copy-webpack-plugin')

module.exports = merge(common, {
  mode: 'development',
  devtool: 'source-map',
  plugins: [
    new CopyWebpackPlugin([
        { from: 'src/manifest.dev.json', to: '../manifest.json' }
    ])
]
})
