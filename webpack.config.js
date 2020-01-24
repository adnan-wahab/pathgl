const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');

const VERSION = require('./version.js');

module.exports = (env, argv) => ({
  entry: {
    index: './example/index.js',
    //textureBackground: './example/texture-background.js'
  },
  output: {
    path: `${__dirname}/docs`,
    publicPath: argv.mode === 'production' ? './' : '/'
  },
  devServer: {
    contentBase: './example'
  },
  module: {
    rules: [
      {
        test: /\.(js|fs|vs)$/,
        exclude: /node_modules/,
        use: ['babel-loader']
      }
    ]
  },
  resolve: {
    extensions: ['*', '.js', '.fs', '.vs']
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: 'example/index.html',
      filename: 'index.html',
      chunks: ['index']
    }),
    new HtmlWebpackPlugin({
      template: 'example/index.html',
      filename: 'texture-background.html',
      chunks: ['textureBackground']
    }),
    new webpack.DefinePlugin({ VERSION })
  ]
});
