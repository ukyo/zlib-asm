var common = require('../lib/common');
var zlib = window['zlib'] = window['zlib'] || {};
common.assign(
  zlib,
  require('../lib/inf')
);
