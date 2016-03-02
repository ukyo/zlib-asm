var InflateStream = require('./InflateStream');

/**
 * @param {number} zlibHeader - zlib header flag. 1: zlib, -1: raw deflate
 * @param {number} [params.chunkSize=32*1024] - chunk size
 * @return {Transform}
 */
function createInflateStream(zlibHeader, params) {
  return new InflateStream(zlibHeader, params);
}

module.exports['createInflateStream'] = createInflateStream.bind(null, 1);
module.exports['createRawInflateStream'] = createInflateStream.bind(null, -1);
