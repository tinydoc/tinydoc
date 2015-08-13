var React = require('react');
var Router = require('react-router');
var config = require('config');
var PluginManager = require('core/PluginManager');
var EventEmitter = require('core/EventEmitter');
var OutletStore = require('stores/OutletStore');
var { Route, DefaultRoute, NotFoundRoute } = Router;

/**
 * @namespace tinydocReact
 */
window.tinydocReact = {};

var emitter = new EventEmitter([
  'loading plugins',
  'plugins loaded',
  'starting',
  'started'
]);

var emitStarted = function(done) {
  emitter.emit('started');
  done();
};

console.assert(!!config && Array.isArray(config.plugins),
  'Configuration file might have not been loaded correctly.'
);

var pluginMgr = new PluginManager(config.plugins, emitter, function start(registrar) {
  emitter.emit('starting');

  var router = Router.create({
    location: config.useHashLocation ? Router.HashLocation : Router.HistoryLocation,
    routes: [
      <Route name="root" path={config.publicPath} handler={require('./screens/Root')}>
        <DefaultRoute name="home" handler={require('./screens/Home')} />
        <Route name="404" handler={require('./screens/NotFound')} />

        {registrar.getPluginRouteMap()}

        <NotFoundRoute
          name="not-found"
          handler={require('./screens/NotFound')}
        />
      </Route>,
    ]
  });

  OutletStore.setOutletElements(registrar.getOutletElements());

  router.run(function(Handler, state) {
    React.render(<Handler onStart={emitStarted} {...state} />, document.body);
  });
});

/**
 * @method tinydocReact.use
 *
 * @param {Function} pluginEntryRunner
 *        The function that will register your plugin.
 *
 * @param {PluginRegistrar} pluginEntryRunner.api
 *        The plugin registration API you can use.
 */
window.tinydocReact.use = pluginMgr.use;

pluginMgr.load();
