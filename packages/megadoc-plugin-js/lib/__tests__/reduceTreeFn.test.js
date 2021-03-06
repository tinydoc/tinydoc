const { assert } = require('megadoc-test-utils');
const subject = require('../reduceTreeFn');
const b = require('megadoc-corpus').builders;

describe('megadoc-plugin-js::reduceTreeFn', function() {
  const defaultContext = {
    compilerOptions: {},
    options: {},
  };

  const uidOf = (id, nodes) => nodes.filter(x => x.id === id).map(x => x.uid)[0]

  it('wires entities to their parents', function() {
    const documents = [
      b.document({
        id: 'truck',
        title: 'truck',
        properties: {
          id: 'truck',
          isModule: true
        }
      }),

      b.documentEntity({
        id: '#beep',
        properties: {
          receiver: 'truck'
        }
      })
    ];

    const treeOperations = subject(defaultContext, documents)

    assert.equal(treeOperations.length, 2);
    assert.include(treeOperations[1].data, {
      uid: uidOf('#beep', documents),
      parentUid: uidOf('truck', documents),
    });
  });

  it('wires documents nested inside namespaces to their namespace nodes', function() {
    const documents = [
      b.document({
        id: 'MyNamespace',
        properties: {}
      }),

      b.document({
        id: 'truck',
        title: 'truck',
        properties: {
          namespace: 'MyNamespace',
          isModule: true
        }
      }),
    ];

    const treeOperations = subject(defaultContext, documents)

    assert.equal(treeOperations.length, 2);
    assert.include(treeOperations[1].data, {
      uid: uidOf('truck', documents),
      parentUid: uidOf('MyNamespace', documents),
    });
  });

  it('wires entities to documents nested inside namespaces', function() {
    const documents = [
      b.document({
        id: 'MyNamespace',
        properties: {}
      }),

      b.document({
        id: 'truck',
        title: 'truck',
        properties: {
          id: 'MyNamespace.truck',
          namespace: 'MyNamespace',
          isModule: true
        }
      }),

      b.documentEntity({
        id: 'beep',
        title: 'truck#beep',
        properties: {
          isModule: false,
          receiver: 'MyNamespace.truck'
        }
      })
    ];

    const treeOperations = subject(defaultContext, documents)

    assert.equal(treeOperations.length, 3);
    assert.include(treeOperations[2].data, {
      uid: uidOf('truck', documents),
      parentUid: uidOf('MyNamespace', documents),
    });

    assert.include(treeOperations[1].data, {
      uid: uidOf('beep', documents),
      parentUid: documents[1].uid
    });
  });
});