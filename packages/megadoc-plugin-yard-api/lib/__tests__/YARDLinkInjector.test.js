var subject = require("../YARDLinkInjector");
var assert = require('chai').assert;
var TestUtils = require('megadoc/lib/TestUtils');

describe("YARDLinkInjector", function() {
  var sinon = TestUtils.sinonSuite(this);
  var onResolve;

  beforeEach(function() {
    onResolve = sinon.stub();
  });

  it('works using {API::Foo}', function() {
    subject('{API::Foo}', onResolve);

    assert.calledWith(onResolve, sinon.match({
      path: 'API::Foo',
      text: 'API::Foo'
    }));
  });

  it('works using {API::Foo[]}', function() {
    subject('{API::Foo[]}', onResolve);

    assert.calledWith(onResolve, sinon.match({
      path: 'API::Foo',
      text: 'API::Foo[]'
    }));
  });

  it('works using {Array.<API::Foo>}', function() {
    subject('{Array.<API::Foo>}', onResolve);

    assert.calledWith(onResolve, sinon.match({
      path: 'API::Foo',
      text: 'API::Foo[]'
    }));
  });

  it('is not greedy', function() {
    [
      '{ API::Foo }',
      '[ API::Foo ]',
      '{}',
      '{ }',
      '{ API::',
      '{ }}}',
      'xoxo {API}',
      '{API:X}'
    ].forEach(function(nonMatchingString) {
      onResolve = sinon.stub();
      var str = subject(nonMatchingString, onResolve);
      assert.notCalled(onResolve);
      assert.equal(str, nonMatchingString);
    });
  });
});