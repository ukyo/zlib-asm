var common = require('./common');
var Inflate = require('./Inflate');

/**
 * @param {number} zlibHeader - zlib header flag. 1: zlib, -1: raw deflate
 * @param {Uint8Array|Buffer} input - input buffer
 * @param {number} [chunkSize=32*1024] - chunk size
 * @return {Uint8Array|Buffer}
 */
function zlibInflate(zlibHeader, input, chunkSize) {
  var buffers = [];
  var inf = new Inflate(zlibHeader, {
    input: input,
    chunkSize: chunkSize,
    shareMemory: false,
    streamFn: function(bytes) {
      buffers.push(bytes);
    }
  });
  inf.inflateAll();
  return common.concat(buffers);
}

/**
 * @param {number} zlibHeader - zlib header flag. 1: zlib, -1: raw deflate
 * @param {number} [params.chunkSize=32*1024] - chunk size
 * @param {Uint8Array|Buffer} params.input - input buffer
 * @param {Function} streamFn - stream function
 * @param {boolean} [shareMemory=false] - share memory flag
 */
function zlibOldInflateStream(zlibHeader, params) {
  var inf = new Inflate(zlibHeader, params);
  inf.inflateAll();
}

var oldStream = module.exports['stream'] = {};
module.exports['inflate'] = zlibInflate.bind(null, 1);
module.exports['rawInflate'] = zlibInflate.bind(null, -1);
oldStream['inflate'] = zlibOldInflateStream.bind(null, 1);
oldStream['rawInflate'] = zlibOldInflateStream.bind(null, -1);
