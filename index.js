var common = require('./lib/common');

module.exports = {
  common: common,
  BaseDeflate: require('./lib/BaseDeflate'),
  Deflate: require('./lib/Deflate'),
  DeflateStream: require('./lib/DeflateStream'),
  BaseInflate: require('./lib/BaseInflate'),
  Inflate: require('./lib/Inflate')
};

common.assign(
  module.exports,
  require('./lib/def'),
  require('./lib/inf'),
  require('./lib/nodeDeflateStream'),
  require('./lib/nodeInflateStream')
);

function wrapForNode(fn) {
  return function(src) {
    var uint8 = fn.apply(null, arguments);
    return Buffer.isBuffer(src) ? new Buffer(uint8.buffer, uint8.byteOffset, uint8.byteOffset + uint8.length) : uint8;
  };
}

if (typeof Buffer === 'function') {
  [
    'deflate',
    'rawDeflate',
    'inflate',
    'rawInflate'
  ].forEach(function(name) { module.exports[name] = wrapForNode(module.exports[name]) });
};
