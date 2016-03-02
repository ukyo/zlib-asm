var Module = require('./Module');

var ReaderWriterMixin = {
  /**
   * @param  {number} srcPtr - src pointer
   * @param  {number} size - chunk size
   */
  $read: function(srcPtr, size) {
    Module.HEAPU8.set(this.src.subarray(this.offset, this.offset + this.srcSize), srcPtr);
    return this.srcSize;
  },
  /**
   * @param  {number} dstPtr - dst pointer
   * @param  {number} size - chunk size
   */
  $write: function(dstPtr, size) {
    var bytes = Module.HEAPU8.subarray(dstPtr, dstPtr + size)
    bytes = this.shareMemory ? bytes : new Uint8Array(bytes);
    this.streamFn(bytes);
  }
};

ReaderWriterMixin['$read'] = ReaderWriterMixin.$read;
ReaderWriterMixin['$write'] = ReaderWriterMixin.$write;

module.exports = ReaderWriterMixin;
