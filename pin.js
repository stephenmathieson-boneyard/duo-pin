#!/usr/bin/env node

/**
 * Module dependencies.
 */

var debug = require('debug')('duo-pin');
var Logger = require('stream-log');
var fs = require('fs');
var path = require('path');
var fmt = require('util').format;

/**
 * Quiet flag.
 */

var quiet = !!~process.argv.indexOf('-q')
         || !!~process.argv.indexOf('--quiet');

/**
 * Logger.
 */

var logger = new Logger(process.stderr);

if (quiet) {
  // noop
  debug('disabling all logging');
  logger.reading =
  logger.pin =
  logger.dupe =
  logger.writing = function(){};
} else {
  logger
  .type('reading', '36m')
  .type('pin', '36m')
  .type('writing', '36m')
  .type('dupe', '33m');
}

/**
 * Error.
 */

logger.type('error', '31m', function () {
  logger.end();
  process.exit(1);
});

/**
 * Resolve duo.json.
 */

var root = process.cwd();
var duo = path.join(root, 'components', 'duo.json');

/**
 * Read duo.json.
 */

logger.reading('components/duo.json');
try {
  var manifest = require(duo);
} catch (err) {
  debug(err);
  if ('MODULE_NOT_FOUND' == err.code) {
    logger.error(
        'unable to locate components/duo.json: '
      + 'you must run `duo` before running `duo pin`.'
    );
  }
  throw err;
}

/**
 * Build `dependencies: {}`.
 */

var dependencies = {};
for (var component in manifest) {
  // skip components that don't start with 'components'
  if (0 != component.indexOf('components')) {
    debug('skip local component: %s', component);
    continue;
  }
  // parse/add dep
  var parsed = dependency(component);
  if (!dependencies[parsed.component]) {
    dependencies[parsed.component] = parsed.version;
    logger.pin('%s@%s', parsed.component, parsed.version);
  } else {
    logger.dupe('%s@%s', parsed.component, parsed.version);
  }
}

/**
 * Sort for better diffs.
 */

var components = Object.keys(dependencies).sort();
var json = { dependencies: {} };
for (var slug, i = 0; slug = components[i]; i++) {
  json.dependencies[slug] = dependencies[slug];
}

var c8 = path.join(root, 'component.json');
debug('component.json: %s', c8);

/**
 * Merge.
 */

if (fs.existsSync(c8)) {
  var existing = require(c8);
  debug('merging component.json with new dependencies');
  existing.dependencies = json.dependencies;
  json = existing;
}

/**
 * Write.
 */

logger.writing(
    '%d dependencies to component.json'
  , Object.keys(json.dependencies).length
);
fs.writeFileSync(c8, JSON.stringify(json, null, 2));

if (!quiet) logger.end();

/**
 * Parse `id` into a dependency.
 *
 * @api private
 * @param {String} id
 * @return {Object}
 */

function dependency(id) {
  var slug = id.split('/')[1].split('@')
  var name = slug[0];
  var version = slug[1];
  var p = name.split('-');
  return {
    component: fmt('%s/%s', p.shift(), p.join('-')),
    version: version,
  };
}
