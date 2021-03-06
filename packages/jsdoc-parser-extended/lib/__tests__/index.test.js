const { findWhere } = require('lodash');
const TestUtils = require('../TestUtils');
const K = require('../constants');
const { assert, stubConsoleWarn, createSinonSuite } = require('megadoc-test-utils')
const { NullLinter } = require('megadoc-linter')
const { CommentAnnotations } = require('../lintingRules')

var parseInline = TestUtils.parseInline;

describe('CJS::Parser::Main', function() {
  var sinon = createSinonSuite(this);

  it('should ignore @internal docs', function() {
    var docs = parseInline(function() {;
      // /**
      //  * @internal
      //  * Something.
      //  */
      //  function Something() {
      //  }
      //
      //  module.exports = Something;
    });

    assert.equal(docs.length, 0);
  });

  it('should warn about invalid docstrings', function() {
    sinon.stub(console, 'warn');
    sinon.spy(NullLinter, 'logRuleEntry')

    parseInline(function() {;
      // /**
      //  * @internal
      //    Something.
      //  */
      //  function Something() {
      //  }
      //
      //  module.exports = Something;
    });

    assert.calledWith(NullLinter.logRuleEntry, sinon.match({
      rule: CommentAnnotations,
      params: sinon.match({
        commentString: sinon.match.string
      })
    }))
  });

  describe('resolving identifiers', function() {
    it('resolves an Identifier to a function', function() {
      var docs = parseInline(function() {;
        // /** @module */
        // var DragonHunter = function() {
        //   var scan = function(a, b) {
        //   };
        //
        //   return {
        //     /** Hi */
        //     scan: scan
        //   };
        // };
      });

      assert.equal(docs.length, 2);

      var doc = findWhere(docs, { name: 'scan' });

      assert.equal(doc.type, K.TYPE_FUNCTION);
      assert.equal(doc.receiver, 'DragonHunter');
      assert.equal(doc.nodeInfo.scope, K.SCOPE_FACTORY_EXPORTS);
      assert.equal(doc.description, "Hi");
    });

    it('resolves an Identifier to a variable', function() {
      var docs = parseInline(function() {;
        // /** @module */
        // var DragonHunter = function() {
        //   var scan = 5;
        //
        //   return {
        //     /** Hi */
        //     scan: scan
        //   };
        // };
      });

      assert.equal(docs.length, 2);

      var doc = findWhere(docs, { name: 'scan' });

      assert.equal(doc.type, K.TYPE_LITERAL);
      assert.equal(doc.receiver, 'DragonHunter');
      assert.equal(doc.nodeInfo.scope, K.SCOPE_FACTORY_EXPORTS);
      assert.equal(doc.description, "Hi");
    });
  });

  describe('docstrings defined without nodes', function() {
    it('can parse a node-free docstring', function() {
      var docs = parseInline(function() {;
        // /** @module Something */
      });

      assert.equal(docs.length, 1);
      assert.equal(docs[0].id, 'Something');
      assert.equal(docs[0].type, K.TYPE_UNKNOWN);
      assert.equal(docs[0].isModule, true);
    });

    it('correctly maps entities to a node-free @module docstring', function() {
      var docs = parseInline(function() {;
        // /**
        //   * @module Something
        //   * @type {Object}
        //   */
        //
        // /** weehee */
        // exports.someFunc = function() {
        // };
        //
        // /** weehee */
        // exports.someProperty = '5';
      });

      assert.equal(docs.length, 3);

      assert.equal(docs[0].id, 'Something');
      assert.deepEqual(docs[0].type, K.TYPE_OBJECT);
      assert.equal(docs[0].isModule, true);

      assert.equal(docs[1].name, 'someFunc');
      assert.equal(docs[1].receiver, 'Something');
      assert.equal(docs[1].type, K.TYPE_FUNCTION);
      assert.equal(docs[1].nodeInfo.scope, K.SCOPE_UNSCOPED);

      assert.equal(docs[2].name, 'someProperty');
      assert.equal(docs[2].receiver, 'Something');
      assert.equal(docs[2].type, K.TYPE_LITERAL);
    });
  });

  describe('config.alias', function() {
    it('should use the aliases', function() {
      var docs = parseInline(function() {;
        // /**
        //  * @module
        //  */
        //  function Foo() {
        //  }
      }, { alias: { 'Foo': [ 'Bar', 'Baz' ] } });

      assert.equal(docs.length, 1);
      assert.deepEqual(docs[0].aliases, [ 'Bar', 'Baz' ]);
    });
  });

  describe('config.namespaceDirMap', function() {
    it('should namespace modules that match the directory pattern', function() {
      var docs = parseInline(function() {;
        // /**
        //  * @module
        //  */
        //  function Foo() {
        //  }
      }, {
        namespaceDirMap: {
          'lib/core': 'Core'
        }
      }, 'lib/core/Cache.js');

      assert.equal(docs.length, 1);
      assert.equal(docs[0].namespace, 'Core');
    });

    it('should ignore it if the module already has a namespace', function() {
      stubConsoleWarn(`Ignoring pre-defined namespace 'Core' for module as it already specifies one`);

      var docs = parseInline(function() {;
        // /**
        //  * @module
        //  * @namespace TheVoid
        //  */
        //  function Foo() {
        //  }
      }, {
        namespaceDirMap: {
          'lib/core': 'Core'
        }
      }, 'lib/core/Cache.js');

      assert.equal(docs.length, 1);
      assert.equal(docs[0].namespace, 'TheVoid');
    });
  });

  it.skip('should infer the module name from the file name', function() {
    const docs = parseInline(`
      const ajax = require('utils/ajax');
      const Promise = require('Promise');

      /**
       *
       */
      module.exports = {
        /**
         * The queue itself...
         *
         * @param {Object} config
         * @param {?Function} config.adapter
         *        Override the ajax adapter if you need to, otherwise we use the default
         *        [[ajax]].
         *
         * @param {?String} [config.retryCount=3]
         *        The number of times that it should retry a request before it gives up
         *        and rejects it.
        */
        createQueue: function (config = { retryCount: 3, adapter: ajax, callback: () => {}}) {
        }
      };
    `, { inferModuleIdFromFileName: true }, 'src/XHRQueue/index.js');

    assert.equal(docs.length, 2);
    assert.equal(docs[0].id, 'XHRQueue');
    assert.equal(docs[0].type, K.TYPE_MODULE);

    assert.equal(docs[1].id, 'XHRQueue.createQueue');
    assert.equal(docs[1].type, K.TYPE_FUNCTION)
  })
});