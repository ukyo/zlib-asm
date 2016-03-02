var common = require('./common');
var BaseDeflate = require('./BaseDeflate');
var ReaderWriterMixin = require('./ReaderWriterMixin');

/**
 * @constructor
 * @extends BaseDeflate
 * @param {number} zlibHeader - zlib header flag. 1: zlib, -1: raw deflate
 * @param {number} [params.compressionLevel=6] - compression level
 * @param {number} [params.chunkSize=32*1024] - chunk size
 * @param {Uint8Array|Buffer} params.input - input buffer
 * @param {Function} streamFn - stream function
 * @param {boolean} [shareMemory=false] - share memory flag
 */
function Deflate(zlibHeader, params) {
  BaseDeflate.call(this, zlibHeader, params);
  this.src = params.input;
  this.streamFn = params.streamFn;
  this.shareMemory = params.shareMemory;
  this.offset = 0;
  this.srcSize = 0;
}
common.assign(Deflate.prototype, BaseDeflate.prototype, ReaderWriterMixin);
Deflate.prototype.constructor = Deflate;

/**
 * deflate whole input buffer.
 */
Deflate.prototype['deflateAll'] = function() {
  for (; this.offset < this.src.length; this.offset += this.chunkSize) {
    this.srcSize = Math.min(this.src.length - this.offset, this.chunkSize);
    this.deflate(this.src.length - this.offset <= this.chunkSize);
  }
  this.cleanup();
};

module.exports = Deflate;
