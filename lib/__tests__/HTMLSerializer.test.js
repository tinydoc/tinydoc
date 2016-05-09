var HTMLSerializer = require('../HTMLSerializer');
var TestUtils = require('../TestUtils');
var Compiler = require('../Compiler');
var assert = require('assert');
var CorpusTypes = require('tinydoc-corpus').Types;
var b = CorpusTypes.builders;

describe('HTMLSerializer', function() {
  TestUtils.IntegrationSuite(this);

  describe('.index', function() {
    var compiler, corpus;

    function runWithConfig(config, done) {
      compiler = new Compiler(TestUtils.generateTestConfig(config));
      corpus = compiler.corpus;
      HTMLSerializer(config).run(compiler);

      corpus.add(
        b.namespace({
          id: 'A',
          documents: [
            b.document({
              id: 'foo',
              title: 'Foo',
              symbol: '/',
              entities: [
                b.documentEntity({
                  id: 'someProp'
                })
              ]
            })
          ]
        })
      );

      corpus.add(
        b.namespace({
          id: 'B',
          meta: {
            href: '/api',
          },
          documents: [
            b.document({
              id: 'foo',
              title: 'Foo',
              symbol: '/',
              entities: [
                b.documentEntity({
                  id: 'someOtherProp'
                }),
                b.documentEntity({
                  id: '#someMethod'
                })
              ]
            })
          ]
        })
      );

      compiler.run({ scan: true, index: true, }, function(err) {
        if (err) { return done(err); }

        done();
      });
    }

    context('when not using hash location', function() {
      beforeEach(function(done) {
        runWithConfig({ useHashLocation: false, emittedFileExtension: '.html' }, done);
      });

      describe('Namespace URIs', function() {
        it('should generate an @href for a namespace', function() {
          assert.equal(corpus.get('A').meta.href, '/A.html');
        });

        it('should use a pre-defined namespace @href', function() {
          assert.equal(corpus.get('B').meta.href, '/api');
        });
      });

      describe('Document URIs', function() {
        it('should generate an @href for every document within a namespace', function() {
          assert.equal(corpus.get('A/foo').meta.href, '/A/foo.html');
          assert.equal(corpus.get('B/foo').meta.href, '/api/foo.html');
        });
      });

      describe('DocumentEntity URIs', function() {
        it('should generate an @href for every document entity as a hashtag', function() {
          assert.equal(corpus.get('A/foo/someProp').meta.href, '/A/foo.html#A%2Ffoo%2FsomeProp');
          assert.equal(corpus.get('B/foo/someOtherProp').meta.href, '/api/foo.html#B%2Ffoo%2FsomeOtherProp');
          assert.equal(corpus.get('B/foo/#someMethod').meta.href, '/api/foo.html#B%2Ffoo%2F%23someMethod');
        });
      });
    });

    context('when using hash location', function() {
      beforeEach(function(done) {
        runWithConfig({ useHashLocation: true }, done);
      });

      describe('Namespace URIs', function() {
        it('should generate an @href for a namespace', function() {
          assert.equal(corpus.get('A').meta.href, '/A');
        });

        it('should use a pre-defined namespace @href', function() {
          assert.equal(corpus.get('B').meta.href, '/api');
        });
      });

      describe('Document URIs', function() {
        it('should generate an @href for every document within a namespace', function() {
          assert.equal(corpus.get('A/foo').meta.href, '/A/foo');
          assert.equal(corpus.get('B/foo').meta.href, '/api/foo');
        });
      });

      describe('DocumentEntity URIs', function() {
        it('should generate an @href for every document entity as a hashtag', function() {
          assert.equal(corpus.get('A/foo/someProp').meta.href, '/A/foo/someProp');
          assert.equal(corpus.get('B/foo/someOtherProp').meta.href, '/api/foo/someOtherProp');
          assert.equal(corpus.get('B/foo/#someMethod').meta.href, '/api/foo/%23someMethod');
        });
      });
    });
  });
});