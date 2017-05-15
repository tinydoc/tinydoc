#!/usr/bin/env node

var program = require('commander');
var path = require('path');
var pkg = require('../package');
var PluginCompiler = require('megadoc-html-serializer/lib/PluginCompiler');
var ctx = {};

program
  .version(pkg.version)
  .description('Compile a megadoc UI plugin.')
  .arguments('<outfile> <entry_file> [other_entry_files...]')
  .option('--optimize', 'Build a production-ready version.')
  .action(function(output, entry, otherEntries) {
    ctx.output = output;
    ctx.entry = [ entry ].concat(otherEntries);
  })
  .parse(process.argv)
;

if (!ctx.output || ctx.entry.length === 0) {
  program.help();
}

PluginCompiler.compile(
  ctx.entry.map(resolvePath),
  resolvePath(ctx.output),
  program.optimize,
  throwOnError
);

function resolvePath(arg) {
  return path.resolve(arg);
}

function throwOnError(e) {
  if (e) {
    throw e;
  }
}