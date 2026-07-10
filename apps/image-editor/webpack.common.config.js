/* eslint-disable */
const path = require('path');

const ESLintPlugin = require('eslint-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

module.exports = ({ minify, WEBPACK_BUILD }) => ({
  entry: './src/index.js',
  output: {
    library: {
      // 注释掉 export: 'default'，使打包出的 UMD 产物保留 default 属性导出，方便思源插件中正常 require.default 引入
      export: 'default',
      type: 'umd',
      name: ['tui', 'ImageEditor'],
    },
    path: path.resolve('dist'),
    publicPath: '/dist',
    filename: `tui-image-editor${minify ? '.min' : ''}.js`,
    hashFunction: 'xxhash64',
  },
  resolve: {
    alias: {
      '@': path.resolve('src/js'),
      '@css': path.resolve('src/css'),
      '@svg': path.resolve('src/svg'),
    },
  },
  // 注释掉 externals，使 tui-code-snippet 和 tui-color-picker 打包进最终的 JS，解决思源笔记插件缺少依赖报错
  externals: [],
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        loader: 'babel-loader',
        options: {
          rootMode: 'upward',
        },
      },
      {
        test: /\.styl$/,
        use: [MiniCssExtractPlugin.loader, 'css-loader', 'stylus-loader'],
      },
      {
        test: /\.svg$/,
        type: 'asset/inline',
      },
    ],
  },
  plugins: [
    new ESLintPlugin({
      extensions: ['js'],
      failOnError: WEBPACK_BUILD,
    }),
    new MiniCssExtractPlugin({
      filename: `tui-image-editor${minify ? '.min' : ''}.css`,
    }),
  ],
});
