const flowRight = require('lodash').flowRight;
const invariant = require('invariant');
const { dumpNodeFilePath } = require('megadoc-corpus');

module.exports = function NodeURIDecorator(config) {
  var g = FileBasedURIGenerator(config);

  var layoutConfig = config;
  var redirectMap = config.redirect || {};
  var rewriteMap = layoutConfig.rewrite || config.rewrite || {};

  return {
    Namespace: decorateNode,
    Document: decorateNode,
    DocumentEntity: decorateNode,
  };

  // This will decorate a node with the following meta properties:
  //
  // @property {String} meta.href
  //
  // A fully-qualified URL to the document. This will include the file extension
  // if applicable (multi-page-mode) and the hash segment if it's an entity.
  //
  // @property {String} meta.anchor
  //
  // A local URL (hash segment) that can be used to "jump" (anchor) to the
  // document or the entity. In SPM (HashLocation) this is unused.
  //
  // @property {Boolean} meta.hrefRewritten
  //
  // Whether the href was not generated and instead an explicit rewritten URL
  // was used. We need this so that we can force the generation of the .html
  // file over any existing one (in case the rewrite shadows another document)
  // and in the UI to accommodate for links to rewritten URLs.
  //
  function decorateNode(node, traversalContext) {
    var href;

    // allow rewrite by filepath
    if (node.filePath && rewriteMap.hasOwnProperty(node.filePath)) {
      href = rewriteMap[node.filePath];
      node.meta.hrefRewritten = true;
    }
    // allow rewrite by UID
    else if (rewriteMap.hasOwnProperty(node.path)) {
      href = rewriteMap[node.path];
      node.meta.hrefRewritten = true;
    }
    else {
      href = g.NodeURI(node, traversalContext);

      // allow rewrite by URL
      if (rewriteMap.hasOwnProperty(href)) {
        href = rewriteMap[href];
        node.meta.hrefRewritten = true;
      }
    }

    // allow redirect by filepath
    if (node.filePath && redirectMap.hasOwnProperty(node.filePath)) {
      node.meta.redirect = redirectMap[node.filePath];
    }
    // allow redirect by UID
    else if (redirectMap.hasOwnProperty(node.path)) {
      node.meta.redirect = redirectMap[node.path];
    }
    // allow redirect by URL
    else if (redirectMap.hasOwnProperty(href)) {
      node.meta.redirect = redirectMap[href];
    }

    node.meta.href = href;
    node.meta.anchor = g.NodeAnchor(node, traversalContext);

    if (node.type !== 'DocumentEntity') {
      invariant(typeof node.meta.href === 'string',
        `Expected node to have an @href attribute! ${dumpNodeFilePath(node)}`
      )
    }

    // we replace the hashtag for single-page mode URLs, otherwise ensure there
    // is no leading slash in the filepath! we do not want to write to /
    node.meta.htmlFilePath = node.type === 'DocumentEntity' ?
      null :
      node.meta.href.replace(/^(\#?)\/+/, '')
    ;

    if (process.env.VERBOSE) {
      console.log('Node "%s" href: "%s"', node.path, node.meta.href)
    }
  }
};

const DONT_INCLUDE = {}

function FileBasedURIGenerator(config) {
  var extension = config.emittedFileExtension || '';
  var RE = extension.length > 0 && new RegExp(extension + '$');

  return {
    NodeURI: flowRight(ensureHasOneLeadingSlash, NodeURI),
    NodeAnchor: NodeAnchor
  };

  function NodeURI(node, traversalContext, includeEntityAnchor) {
    const { getParentOf } = traversalContext;

    if (shouldIgnore(node) && includeEntityAnchor !== DONT_INCLUDE) {
      return node.type === 'DocumentEntity' ?
        node.meta.href :
        ensureHasExtension(
          ensureHasValidFilename(
            node.meta.href
          )
        )
      ;
    }

    const parentNode = getParentOf(node);

    if (node.type === 'DocumentEntity') {
      if (!parentNode) {
        invariant(false, `Node has no parent! ${dumpNodeFilePath(node)}`);
      }

      if (includeEntityAnchor === DONT_INCLUDE) {
        return NodeURI(parentNode, traversalContext, includeEntityAnchor);
      }
      else if (parentNode.type === 'DocumentEntity') {
        return NodeURI(parentNode, traversalContext, DONT_INCLUDE) + '#' + NodeAnchor(node, traversalContext);
      }
      else {
        return NodeURI(parentNode, traversalContext) + '#' + NodeAnchor(node, traversalContext);
      }
    }
    else if (node.type === 'Document') {
      if (!parentNode) {
        invariant(false, `Node has no parent! ${dumpNodeFilePath(node)}`);
      }

      return (
        ParentNodeURI(parentNode, traversalContext) + '/' + encodeURI(node.id) +
        // What's happening here merits some explanation: documents that nest
        // other documents beneath them should be placed inside
        // `/path/to/document/index.html` instead of `/path/to/document.html`
        // and that is because there may be a sibling document (that is, at
        // this level in the tree) that has the same name INCLUDING the extension
        // (like `tinymce` and `tinymce.html`) in which case we'll have conflicts
        // since both documents will point to /path/to/tinymce.html
        //
        // With this tuning, for a document structure that looks like this:
        //
        //     [
        //       { type: 'Document', id: 'tinymce', documents: [{ id: 'A' }] },
        //       { type: 'Document', id: 'tinymce.html', documents: [{ id: 'A' }]
        //     ]
        //
        // We'll have:
        //
        //     /.../tinymce/index.html
        //     /.../tinymce/A.html
        //     /.../tinymce.html/index.html
        //     /.../tinymce.html/A.html
        //
        // Et voila! No conflicts.
        (node.documents && node.documents.length ? '/index' : '') +
        extension
      );
    }
    else if (node.type === 'Namespace') {
      return '/' + encodeURI(node.id) + '/index' + extension;
    }
    else if (node.type === 'Corpus') {
      return  null;
    }
  }

  function ParentNodeURI(node, traversalContext) {
    return NodeURI(node, traversalContext).replace(RE, '').replace(/\/index$/, '');
  }

  function NodeAnchor(node, traversalContext) {
    const { getParentOf } = traversalContext;

    if (node.meta.hasOwnProperty('anchor')) {
      return node.meta.anchor;
    }
    else if (node.type === 'Corpus') {
      return null;
    }
    else {
      const parentNode = getParentOf(node);
      const anchor = encodeURI(node.id.replace(/[\/\s]+/g, '-'));

      if (parentNode.type === 'DocumentEntity') {
        return NodeAnchor(parentNode, traversalContext) + anchor
      }
      else {
        return anchor
      }
    }
  }

  function ensureHasExtension(s) {
    if (s) {
      return s.match(RE) ? s : s + extension;
    }
  }
}

function ensureHasValidFilename(x) {
  if (x === '/' || x === '') {
    return '/index.html';
  }
  else {
    return x;
  }
}

function shouldIgnore(node) {
  return node.meta.hasOwnProperty('href') && (
    // PLEASE for the love of all that's holy stop switching over `null`, if
    // we want to opt out of this, use a well-defined flag >.<
    node.meta.href === null ||
    (node.meta.href && node.meta.href[0] === '/')
  );
}

// because people could add a leading slash, or forget to add it - we should
// support either notation really
function ensureHasOneLeadingSlash(href) {
  if (href) {
    return href.replace(/^(\#?)\/+/, '$1/');
  }
}