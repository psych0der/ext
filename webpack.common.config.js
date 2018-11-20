const CopyWebpackPlugin = require('copy-webpack-plugin')

module.exports = {
    entry: {
        background: "./src/js/background.ts",
        content: "./src/js/content.ts"
    },
    output: {
        filename: "[name].js",
        path: __dirname + "/dist/js"
    },

    resolve: {
        extensions: [".js", ".json"]
    },

    module: {
        rules: [
            { enforce: "pre", test: /\.js$/, loader: "source-map-loader" },
            { test: /\.tsx?$/, loader: "source-map-loader" }
        ]
    },

    plugins: [
        new CopyWebpackPlugin([
            { from: 'src/icons', to: '../icons' },
            { from: 'src/html', to: '../html' },
            { from: 'src/css', to: '../css' },
            { from: 'src/manifest.json', to: '../' }
        ])
    ]
};
