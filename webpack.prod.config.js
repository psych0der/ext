const CopyWebpackPlugin = require('copy-webpack-plugin')
const webpack = require('webpack')
const merge = require('webpack-merge')
const UglifyJSPlugin = require('uglifyjs-webpack-plugin');
const common = require('./webpack.common.config.js')

module.exports = merge(common, {
    mode: 'production',
    devtool: 'none'
})
