var assert = require('assert');
var TestUtils = require('../../TestUtils');
var K = require('jsdoc-parser-extended').Constants;
var findWhere = require('lodash').findWhere;

describe('analyzeReactNode - statics', function() {
  it('should find and track a static property', function() {
    var docs = TestUtils.parse(function() {;
      // /** @module */
      //  var Something = React.createClass({
      //    statics: {
      //      someFunction: function() {}
      //    }
      //  });
    });

    assert.equal(docs.length, 1);

    assert.equal(docs[0].nodeInfo.statics.length, 1);
    assert.equal(docs[0].nodeInfo.statics[0], 'someFunction');
  });

  it('should correctify the scope of documented static methods', function() {
    var docs = TestUtils.parse(function() {;
      // /** @module */
      //  var Something = React.createClass({
      //    statics: {
      //      /** Foo */
      //      someFunction: function() {}
      //    }
      //  });
    });

    assert.equal(docs.length, 2);

    var doc = findWhere(docs, { name: 'someFunction' });

    assert.equal(doc.nodeInfo.scope, K.SCOPE_UNDEFINED);
    assert.equal(doc.symbol, '.');
    assert.equal(doc.id, 'Something.someFunction');
  });
});

describe('analyzeReactNode - methods', function() {
  it('should correctify the scope of an instance method', function() {
    var docs = TestUtils.parse(function() {;
      // /** @module */
      //  var Something = React.createClass({
      //    /** Do something. */
      //    someMethod() {
      //    }
      //  });
    });

    assert.equal(docs.length, 2);

    var doc = findWhere(docs, { name: 'someMethod' });

    assert.equal(doc.type, K.TYPE_FUNCTION);
    assert.equal(doc.nodeInfo.scope, K.SCOPE_INSTANCE);
    assert.equal(doc.id, 'Something#someMethod');
  });
});
