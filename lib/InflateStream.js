var Transform = require('stream').Transform;
var inherits = require('util').inherits;
var common = require('./common');
var BaseInflate = require('./BaseInflate');
var StreamReaderWriterMixin = require('./StreamReaderWriterMixin');

/**
 * @constructor
 * @extends Transform
 * @extends BaseInflate
 * @param {number} zlibHeader - zlib header flag. 1: zlib, -1: raw deflate
 * @param {number} [params.chunkSize=32*1024] - chunk size
 */
function InflateStream(zlibHeader, params) {
  BaseInflate.call(this, zlibHeader, params);
  Transform.call(this, params);
  this.srcSize = 0;
  this.dstSize = 0;
  this.src = new Buffer(0);
  this.dst = new Buffer(0);
}
inherits(InflateStream, Transform);
common.assign(InflateStream.prototype, BaseInflate.prototype, StreamReaderWriterMixin);
InflateStream.prototype.constructor = InflateStream;

InflateStream.prototype['_transform'] = function(chunk, encoding, callback) {
  try {
    var offset;
    for (offset = 0; offset < chunk.length; offset += this.chunkSize) {
      this.srcSize = Math.min(chunk.length - offset, this.chunkSize);
      this.src = chunk.slice(offset, offset + this.srcSize);
      this.inflate();
    }
    callback();
  } catch (error) {
    callback(error);
  }
};

InflateStream.prototype['_flush'] = function(callback) {
  this.cleanup();
  callback();
};

module.exports = InflateStream;
