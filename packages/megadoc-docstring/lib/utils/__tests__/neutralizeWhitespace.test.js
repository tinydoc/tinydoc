var neutralizeWhitespace = require('../neutralizeWhitespace');
var { assert, multiline } = require('megadoc-test-utils');

describe('utils::neutralizeWhitespace', function() {
  it('strips leading whitespace ONLY if all lines are padded equally', function() {
    var string = multiline(function() {;
      //          This
      //          is
      //          a
      //          multiline
      //          description.
    });

    var expected = multiline(function() {;
      //
      // This
      // is
      // a
      // multiline
      // description.
    }, true);

    assert.deepEqual(neutralizeWhitespace(string), expected);
  });

  it('does not touch unequally padded lines', function() {
    var input = multiline(function() {;
      // This
      //          is
      //          a
      //          multiline
      //          description.
    }, true);

    var output = neutralizeWhitespace(input);

    assert.deepEqual(input, output);
  });

  it('does not touch code blocks', function() {
    var input = multiline(function() {;
      //     var foo = '5';
      //
      //     console.log("hello world");
    }, true);

    var output = neutralizeWhitespace(input);

    assert.deepEqual(input, output);
  });

  it('does not touch a block of text and a code block', function() {
    var input = multiline(function() {;
      // This example shows how to assign a variable and log it.
      //
      //     var foo = '5';
      //
      //     console.log("hello world");
    }, true);

    var output = neutralizeWhitespace(input);

    assert.deepEqual(input, output);
  });

  it('strips leading whitespace from description', function() {
    var string = multiline(function() {;
      //          This
      //          is
      //          a
      //          multiline
      //          description.
    });

    assert.equal(
      neutralizeWhitespace(string)
        // this silly hack is to work around istanbul's instrumentor /
        // multiline-slash where when NOT instrumenting, we'll have a leading
        // newline
        .replace(/^\n{0,1}/, '')
      ,
      'This\nis\na\nmultiline\ndescription.\n    '
    );
  });
});