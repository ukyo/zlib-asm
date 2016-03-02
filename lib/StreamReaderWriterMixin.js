var Module = require('./Module');

var StreamReaderWriterMixin = {
  /**
   * @param  {number} srcPtr - src pointer
   * @param  {number} size - chunk size
   */
  $read: function(srcPtr, size) {
    Module.HEAPU8.set(new Uint8Array(this.src.buffer, this.src.byteOffset, this.srcSize), srcPtr);
    return this.srcSize;
  },
  /**
   * @param  {number} dstPtr - dst pointer
   * @param  {number} size - chunk size
   */
  $write: function(dstPtr, size) {
    this.dst = new Buffer(Module.HEAPU8.buffer).slice(dstPtr, dstPtr + size);
    this.push(new Buffer(this.dst));
  }
};

StreamReaderWriterMixin['$read'] = StreamReaderWriterMixin.$read;
StreamReaderWriterMixin['$write'] = StreamReaderWriterMixin.$write;

module.exports = StreamReaderWriterMixin;
