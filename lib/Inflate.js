var common = require('./common');
var BaseInflate = require('./BaseInflate');
var ReaderWriterMixin = require('./ReaderWriterMixin');

/**
 * @constructor
 * @extends BaseInflate
 * @param {number} zlibHeader - zlib header flag. 1: zlib, -1: raw deflate
 * @param {number} [params.chunkSize=32*1024] - chunk size
 * @param {Uint8Array|Buffer} params.input - input buffer
 * @param {Function} streamFn - stream function
 * @param {boolean} [shareMemory=false] - share memory flag
 */
function Inflate(zlibHeader, params) {
  BaseInflate.call(this, zlibHeader, params);
  this.src = params.input;
  this.streamFn = params.streamFn;
  this.shareMemory = params.shareMemory;
  this.offset = 0;
  this.srcSize = 0;
}
common.assign(Inflate.prototype, BaseInflate.prototype, ReaderWriterMixin);
Inflate.prototype.constructor = Inflate;

/**
 * inflate whole input buffer.
 */
Inflate.prototype['inflateAll'] = function() {
  for (; this.offset < this.src.length; this.offset += this.chunkSize) {
    this.srcSize = Math.min(this.src.length - this.offset, this.chunkSize);
    this.inflate();
  }
  this.cleanup();
};

module.exports = Inflate;
