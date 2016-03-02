var DeflateStream = require('./DeflateStream');

/**
 * @param {number} zlibHeader - zlib header flag. 1: zlib, -1: raw deflate
 * @param {number} [params.chunkSize=32*1024] - chunk size
 * @param {number} [params.compressionLevel=6] - compression level
 * @return {Transform}
 */
function createDeflateStream(zlibHeader, params) {
  return new DeflateStream(zlibHeader, params);
}

module.exports['createDeflateStream'] = createDeflateStream.bind(null, 1);
module.exports['createRawDeflateStream'] = createDeflateStream.bind(null, -1);
