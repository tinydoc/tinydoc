function dumpNodeFilePath(node) {
  var buffer = `${node && node.id || '<<unknown>>'}`;

  if (node && node.filePath) {
    buffer = node.filePath;

    if (node.loc && node.loc.start && node.loc.start.line) {
      buffer += ':' + node.loc.start.line;
    }
  }

  return buffer;
}

exports.dumpNodeFilePath = dumpNodeFilePath;