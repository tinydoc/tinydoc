const findCommonPrefix = require('./utils/findCommonPrefix');
const { normalizeHeading } = require('megadoc-markdown-utils');
const path = require('path');

module.exports = function refineFn({ options: config }, documents, done) {
  // console.log('[D] megadoc-plugin-markdown: Refining %d documents', documents.length);

  const commonPrefix = findCommonPrefix(documents.map(x => x.filePath), '/');
  const withCommonRoot = documents.map(document => {
    const extName = path.extname(document.filePath);
    let id;

    if (config.discardFileExtension) {
      id = normalizeHeading(
        document.filePath
          .replace(extName, '')
          .replace(commonPrefix, '')
      );
    }
    else {
      id = normalizeHeading(document.filePath.replace(commonPrefix, ''));
    }

    if (config.discardIdPrefix) {
      id = id.replace(config.discardIdPrefix, '');
    }

    return Object.assign({}, document, {
      id,
      sortingId: document.filePath.replace(commonPrefix, ''),
    })
  });

  done(null, withCommonRoot);
};
