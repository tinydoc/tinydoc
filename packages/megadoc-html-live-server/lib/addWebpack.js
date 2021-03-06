const webpack = require('webpack');
const createWebpackDevMiddleware = require('webpack-dev-middleware');
const createWebpackHotMiddleware = require('webpack-hot-middleware');

module.exports = function addWebpack({
  contentBase,
  runtimeOutputPath,
  webpackConfig,
}, app) {
  const webpackCompiler = webpack(webpackConfig);

  app.use(createWebpackDevMiddleware(webpackCompiler, {
    contentBase: contentBase,
    publicPath: runtimeOutputPath,
    hot: false,
    quiet: true,
    noInfo: true,
    lazy: false,
    inline: false,
    watchOptions: {
      poll: false,
      aggregateTimeout: 0,
    },
    stats: false,
    historyApiFallback: false,
  }));

  app.use(createWebpackHotMiddleware(webpackCompiler, {
    log: false,
    overlay: false,
  }));
}