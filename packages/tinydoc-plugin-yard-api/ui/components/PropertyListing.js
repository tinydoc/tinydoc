var React = require('react');
var MarkdownText = require('components/MarkdownText');

var Properties = React.createClass({
  propTypes: {
    tags: React.PropTypes.arrayOf(React.PropTypes.shape({
      name: React.PropTypes.string,
      types: React.PropTypes.arrayOf(React.PropTypes.string),
      accepted_values: React.PropTypes.arrayOf(React.PropTypes.string),
      is_required: React.PropTypes.bool,
      text: React.PropTypes.string,
    })),
  },

  getDefaultProps() {
    return {
      tags: []
    };
  },

  render() {
    if (!this.props.tags || !this.props.tags.length) {
      return null;
    }

    return (
      <div>
        {this.props.children}

        <ul className="argument-listing">
          {this.props.tags.map(this.renderArgument)}
        </ul>
      </div>
    );
  },

  renderArgument(tag) {
    return (
      <li key={tag.name} className="argument-listing__argument">
        <div className="argument-listing__argument-details">
          <code className="argument-listing__argument-name">{tag.name}</code>

          <span className="argument-listing__argument-type">
            <MarkdownText>{tag.types.join('|')}</MarkdownText>
          </span>

          {(tag.accepted_values || []).length > 0 && (
            <span className="argument-listing__argument-values">
              <span>[ {tag.accepted_values.join(', ')} ]</span>
            </span>
          )}

          {tag.is_required && (
            <span className="argument-listing__argument-required">Required</span>
          )}
        </div>

        <div className="argument-listing__argument-text">
          {tag.text.length > 0 && (
            <MarkdownText>{tag.text}</MarkdownText>
          )}

          {tag.text.length === 0 && (
            <em className="type-mute">No description provided.</em>
          )}
        </div>
      </li>
    );
  }
});

module.exports = Properties;