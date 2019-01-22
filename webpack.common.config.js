const CopyWebpackPlugin = require('copy-webpack-plugin')

module.exports = {
    entry: {
        background: "./src/js/background.ts",
        content: "./src/js/content.ts",
        popup: "./src/js/popup.ts"
    },
    output: {
        filename: "[name].js",
        path: __dirname + "/dist/js"
    },

    resolve: {
        extensions: [".ts", ".tsx", ".js", ".json"],
        mainFields: ["main", "module"]
    },

    module: {
        rules: [
            { enforce: "pre", test: /\.js$/, loader: "source-map-loader" },
            { test: /\.tsx?$/, loader: "awesome-typescript-loader" },
            { test: /\.css$/, use: [
                "style-loader",
                "css-loader"
            ] },
            {
                test: /\.scss$/,
                use: [
                    "style-loader",
                    "css-loader",
                    "sass-loader"
                ]
            }
        ]
    },

    plugins: [
        new CopyWebpackPlugin([
            { from: 'src/icons', to: '../icons' },
            { from: 'src/includes', to: '../' },
            { from: 'src/js/includes', to: '../js' },
            { from: 'src/html', to: '../html' }
        ])
    ]
};
