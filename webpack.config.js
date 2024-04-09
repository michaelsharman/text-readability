module.exports = {
    entry: {
        main: './src/index.js',
    },
    output: {
        path: __dirname + '/dist',
        filename: 'main.js',
    },
    module: {
        rules: [
            {
                test: /\.7b/,
                type: 'asset/source',
            },
        ],
    },
};
