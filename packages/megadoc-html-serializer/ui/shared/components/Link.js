const React = require('react');
const classSet = require('utils/classSet');
const resolvePathname = require('utils/resolvePathname');
const { string, func, node, bool, shape, } = React.PropTypes;
const { findDOMNode } = require('react-dom');

const Link = React.createClass({
  contextTypes: {
    navigate: func.isRequired,
    location: shape({
      pathname: string.isRequired,
    }).isRequired,
  },

  propTypes: {
    to: shape({
      meta: shape({
        href: string.isRequired
      }).isRequired
    }),
    href: string,
    id: string,
    name: string,
    title: string,
    onClick: func,
    className: string,
    children: node,
    active: bool,
  },

  render() {
    const href = this.getHref();
    const isActive = this.props.active || this.isActive(href);

    if (!href) {
      console.warn(
        `Link with text "${this.props.children}" has no resolvable destination... ` +
        `This most likely indicates a configuration error.`
      );
    }

    return (
      <a
        id={this.props.id}
        name={this.props.name}
        title={this.props.title}
        href={href && this.getRelativeHref(href) || undefined}
        onClick={this.navigate}
        children={this.props.children}
        className={classSet(this.props.className, {
          'active': isActive,
          'mega-link--internal mega-link--broken': !href
        })}
      />
    );
  },

  navigate(e) {
    this.context.navigate(e, findDOMNode(this));

    if (this.props.onClick) {
      this.props.onClick(e);
    }
  },

  isActive(href) {
    const { location } = this.context;

    return (
      href === location.pathname ||
      href === location.pathname + location.hash
    );
  },

  getHref() {
    if (this.props.href) {
      return this.props.href;
    }
    else if (typeof this.props.to === 'string') {
      return this.props.to;
    }
    else if (this.props.to && typeof this.props.to === 'object') {
      const { href, anchor } = this.props.to.meta;

      if (this.props.to.type === 'DocumentEntity') {
        return href;
      }
      else {
        return href + '#' + anchor;
      }
    }
  },

  getRelativeHref(href) {
    return resolvePathname(href, this.context.location.pathname);
  },
});


module.exports = Link;
