var Module = require('./Module');
var common = require('./common');

/**
 * @constructor
 * @param {number} zlibHeader - zlib header flag. 1: zlib, -1: raw deflate
 * @param {number} [params.chunkSize=32*1024] - chunk size
 */
function BaseInflate(zlibHeader, params) {
  params = common.assign({}, common.defaultParams, params);
  this.chunkSize = params.chunkSize;
  this.ctxPtr = Module._ZLIBJS_createInflateContext(zlibHeader);
  if (!this.ctxPtr) throw common.zerror('ZLIBJS_createDeflateContext');
  Module.ZLIBJS_instances[this.ctxPtr] = this;
  Module._ZLIBJS_init(this.chunkSize);
}

/**
 * inflate chunk.
 */
BaseInflate.prototype['inflate'] = function() {
  var v = common.validate(Module._ZLIBJS_inflate(this.ctxPtr, this.chunkSize));
  if (!v.valid) {
    this.cleanup();
    throw common.zerror(v.error);
  }
};

/**
 * cleanup the z_stream struct.
 */
BaseInflate.prototype['cleanup'] = function() {
  this.ctxPtr && Module._ZLIBJS_freeInflateContext(this.ctxPtr);
  delete Module.ZLIBJS_instances[this.ctxPtr];
};

module.exports = BaseInflate;
