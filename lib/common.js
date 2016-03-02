var Z_STREAM_ERROR = -2;
var Z_DATA_ERROR = -3;
var Z_MEM_ERROR = -4;
var Z_VERSION_ERROR = -6;
var ERROR_TABLE = {};
ERROR_TABLE[Z_STREAM_ERROR] = 'invalptr compression level';
ERROR_TABLE[Z_DATA_ERROR] = 'invalptr or incomplete deflate data';
ERROR_TABLE[Z_MEM_ERROR] = 'out of memory';
ERROR_TABLE[Z_VERSION_ERROR] = 'zlib version mismatch';
var defaultParams = {
  compressionLevel: 6,
  chunkSize: 32 * 1024,
  shareMemory: false,
  src: null,
  streamFn: function() {}
};

/**
 * This function is like a `Object.assign`. It assigns recursively and ignores `undefined` and `null`.
 * @param  {object} source
 * @param  {...rest} rest
 * @return {object}
 */
function assign(source) {
  Array.prototype.slice.call(arguments, 1).forEach(function(o) {
    if (o == null || typeof o !== 'object') return;
    Object.keys(o).forEach(function(k) {
      var v = o[k];
      if (v == null) return;
      if (typeof v === 'object') {
        source[k] = source[k] || {};
        assign(source[k], v);
      } else {
        source[k] = v;
      }
    });
  });
  return source;
}

/**
 * concat buffers.
 * @param  {Uint8Array[]} buffers
 * @return {Uint8Array}
 */
function concat(buffers) {
  var n, ret, offset = 0;
  n = buffers.map(function(buffer) {
    return buffer.length;
  }).reduce(function(a, b) {
    return a + b;
  }, 0);
  ret = new Uint8Array(n);
  buffers.forEach(function(buffer) {
    ret.set(buffer, offset);
    offset += buffer.length;
  });
  return ret;
}

function zerror (message) {
  return new Error('zlib-asm: ' + message);
}

function validate (state) {
  return {
    valid: state >= 0,
    error: ERROR_TABLE[state]
  };
}

module.exports = {
  defaultParams: defaultParams,
  assign: assign,
  concat: concat,
  zerror: zerror,
  validate: validate
};
