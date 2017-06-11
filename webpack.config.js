'use strict';
let path = require('path');
let webpack = require('webpack');
let jQuery = require('jQuery');

module.exports = {
    module: {
        loaders: [
            {
                test: /\.jsx?$/,
                exclude: /node_modules/,
                loader: 'babel'
            }
        ]
    }
}