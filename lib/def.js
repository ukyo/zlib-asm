var common = require('./common');
var Deflate = require('./Deflate');

/**
 * @param {number} zlibHeader - zlib header flag. 1: zlib, -1: raw deflate
 * @param {Uint8Array|Buffer} input - input buffer
 * @param {number} [compressionLevel=6] - compression level
 * @param {number} [chunkSize=32*1024] - chunk size
 * @return {Uint8Array|Buffer}
 */
function zlibDeflate(zlibHeader, input, compressionLevel, chunkSize) {
  var buffers = [];
  var def = new Deflate(zlibHeader, {
    input: input,
    compressionLevel: compressionLevel,
    chunkSize: chunkSize,
    shareMemory: false,
    streamFn: function(bytes) {
      buffers.push(bytes);
    }
  });
  def.deflateAll();
  return common.concat(buffers);
}

/**
 * @param {number} zlibHeader - zlib header flag. 1: zlib, -1: raw deflate
 * @param {number} [params.chunkSize=32*1024] - chunk size
 * @param {Uint8Array|Buffer} params.input - input buffer
 * @param {number} [params.compressionLevel=6] - compression level
 * @param {Function} streamFn - stream function
 * @param {boolean} [shareMemory=false] - share memory flag
 */
function zlibOldDeflateStream(zlibHeader, params) {
  var def = new Deflate(zlibHeader, params);
  def.deflateAll();
}

var oldStream = module.exports['stream'] = {};
module.exports['deflate'] = zlibDeflate.bind(null, 1);
module.exports['rawDeflate'] = zlibDeflate.bind(null, -1);
oldStream['deflate'] = zlibOldDeflateStream.bind(null, 1);
oldStream['rawDeflate'] = zlibOldDeflateStream.bind(null, -1);
