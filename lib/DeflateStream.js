var Transform = require('stream').Transform;
var inherits = require('util').inherits;
var common = require('./common');
var BaseDeflate = require('./BaseDeflate');
var StreamReaderWriterMixin = require('./StreamReaderWriterMixin');

/**
 * @constructor
 * @extends Transform
 * @extends BaseDeflate
 * @param {number} zlibHeader - zlib header flag. 1: zlib, -1: raw deflate
 * @param {number} [params.compressionLevel=6] - compression level
 * @param {number} [params.chunkSize=32*1024] - chunk size
 */
function DeflateStream(zlibHeader, params) {
  BaseDeflate.call(this, zlibHeader, params);
  Transform.call(this, params);
  this.srcSize = 0;
  this.dstSize = 0;
  this.src = new Buffer(0);
  this.dst = new Buffer(0);
}
inherits(DeflateStream, Transform);
common.assign(DeflateStream.prototype, BaseDeflate.prototype, StreamReaderWriterMixin);
DeflateStream.prototype.constructor = DeflateStream;

DeflateStream.prototype['_transform'] = function(chunk, encoding, callback) {
  try {
    var offset;
    for (offset = 0; offset < chunk.length; offset += this.chunkSize) {
      this.srcSize = Math.min(chunk.length - offset, this.chunkSize);
      this.src = chunk.slice(offset, offset + this.srcSize);
      this.deflate(false);
    }
    callback();
  } catch (error) {
    callback(error);
  }
};

DeflateStream.prototype['_flush'] = function(callback) {
  try {
    this.srcSize = 0;
    this.deflate(true);
    this.cleanup();
    callback();
  } catch (error) {
    callback(error);
  }
};

module.exports = DeflateStream;
