const config = require('config');
const { assign, where, findWhere } = require('lodash');
const { makeHref } = require('actions/RouteActions');
const strHumanize = require('tinydoc/lib/utils/strHumanize');

const articles = config.database;
let folders = [];

let Database = {
  getTitle() {
    return config.title;
  },

  getArticles() {
    return articles;
  },

  get(articleId) {
    return findWhere(articles, { id: decodeURIComponent(articleId) });
  },

  getFolders() {
    return folders;
  },

  getLinkableEntities() {
    return articles.reduce(function(links, entry) {
      const { filePath } = entry;

      links[filePath] = {
        href: makeHref(`${config.name}.article`, { articleId: entry.id }),
        title: `${strHumanize(config.title)}: ${entry.title}`
      };

      if (config.allowLeadingSlashInLinks) {
        if (filePath[0] !== '/') {
          links['/' + filePath] = links[filePath];
        }
      }

      return links;
    }, {});
  }
};

function createFolderConfig(folderPath) {
  const folderConfig = findWhere(config.folders, { path: folderPath });

  let folder = assign({}, folderConfig, { path: folderPath });

  // generate a title
  if (!folder.title) {
    if (config.fullFolderTitles) {
      folder.title = folderPath
        .replace(config.commonPrefix, '')
        .split('/')
        .map(strHumanize)
        .join(config.fullFolderTitleDelimiter)
      ;
    }
    else {
      const fragments = folderPath.split('/');
      folder.title = strHumanize(fragments[fragments.length-1]);
    }
  }

  return folder;
}

// generate folders
config.database.forEach((article) => {
  if (!findWhere(folders, { path: article.folder })) {
    folders.push(createFolderConfig(article.folder));
  }
});

folders.forEach(function(folder) {
  folder.articles = where(articles, { folder: folder.path });
});

module.exports = Database;