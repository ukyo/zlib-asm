var ZLIBJS_instances = Module['ZLIBJS_instances'] = {};

function ZLIBJS_read(ptr, srcPtr, size) {
  return ZLIBJS_instances[ptr]['$read'](srcPtr, size);
}

function ZLIBJS_write(ptr, dstPtr, size) {
  return ZLIBJS_instances[ptr]['$write'](dstPtr, size);
}

module.exports = Module;
