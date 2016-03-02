var Module = require('./Module');
var common = require('./common');

/**
 * @constructor
 * @param {number} zlibHeader - zlib header flag. 1: zlib, -1: raw deflate
 * @param {number} [params.compressionLevel=6] - compression level
 * @param {number} [params.chunkSize=32*1024] - chunk size
 */
function BaseDeflate(zlibHeader, params) {
  params = common.assign({}, common.defaultParams, params);
  this.chunkSize = params.chunkSize;
  if (params.level) this.compressionLevel = params.level;
  this.compressionLevel = Math.min(Math.max(this.compressionLevel, 0), 9);
  this.ctxPtr = Module._ZLIBJS_createDeflateContext(params.compressionLevel, zlibHeader);
  if (!this.ctxPtr) throw common.zerror('ZLIBJS_createDeflateContext');
  Module.ZLIBJS_instances[this.ctxPtr] = this;
  Module._ZLIBJS_init(this.chunkSize);
}

/**
 * deflate chunk.
 * @param {boolean} flush - stream end flag.
 */
BaseDeflate.prototype['deflate'] = function(flush) {
  var v = common.validate(Module._ZLIBJS_deflate(this.ctxPtr, this.chunkSize, +flush));
  if (!v.valid) {
    this.cleanup();
    throw common.zerror(v.error);
  }
};

/**
 * cleanup the z_stream struct.
 */
BaseDeflate.prototype['cleanup'] = function() {
  this.ctxPtr && Module._ZLIBJS_freeDeflateContext(this.ctxPtr);
  delete Module.ZLIBJS_instances[this.ctxPtr];
};

module.exports = BaseDeflate;
