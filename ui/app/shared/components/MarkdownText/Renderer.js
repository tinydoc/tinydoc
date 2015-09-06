const React = require('react');
const marked = require('marked');
const Utils = require('./Utils');
const config = require('config');

const RE_INTERNAL_LINK = Object.freeze(/^tiny:\/\//);
const RE_EXTERNAL_LINK = Object.freeze(/^https?:\/\//);

module.exports = function createRenderer() {
  let renderer = new marked.Renderer();

  // this could be heavily optimized, but meh for now
  renderer.heading = function (text, level) {
    const sectionId = Utils.normalizeHeading(Utils.sanitize(text.split('\n')[0]));
    const articleURL = location.href.replace(/[\?|\&]section=[^\&]+/, '');
    const token = articleURL.indexOf('?') > -1 ? '&' : '?';
    const Tag = `h${level}`;

    return React.renderToString(
      <Tag className="markdown-text__heading" id={sectionId}>
        <span
          className="markdown-text__heading-title"
          dangerouslySetInnerHTML={{__html: text}}
        />

        <a
          name={sectionId}
          href={`${articleURL}${token}section=${sectionId}`}
          className="markdown-text__heading-anchor icon icon-link"
        />
      </Tag>
    );
  };

  renderer.link = function(href, title, text) {
    let a = document.createElement('a');

    a.href = decodeURIComponent(href.replace(RE_INTERNAL_LINK, ''));

    if (title) {
      a.title = title;
    }

    if (config.launchExternalLinksInNewTabs && href.match(RE_EXTERNAL_LINK)) {
      a.target = '_blank';
    }

    if (a.href !== href) {
      // When using History-based location, we need to mark internal links
      // generated by the LinkResolver with "data-internal" so that we can
      // intercept them and cause a transition when they're clicked, instead of
      // causing the browser to refresh.
      if (!config.useHashLocation) {
        a.dataset.internal = true;
      }
    }

    a.innerHTML = text;

    return a.outerHTML;
  };

  return renderer;
}