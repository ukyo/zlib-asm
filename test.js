var zlib_asm = require('./dest/zlib-asm').zlib_asm;
var zlib_noasm = require('./dest/zlib-noasm').zlib_noasm;

exports.testZlib = function(test) {
  var bytes = new Uint8Array(100000);
  var asm = zlib_asm.compress(bytes);
  var noasm = zlib_asm.compress(bytes);
  test.equal(asm.length, noasm.length, 'check lengths');
  for(var i = 0; i < asm.length; ++i) {
    test.equal(asm[i], noasm[i], 'check all items');
  }
  var asm2 = zlib_asm.decompress(asm);
  var noasm2 = zlib_noasm.decompress(asm);
  test.equal(asm2.length, noasm2.length, 'check lengths');
  test.equal(asm2.length, bytes.length, 'check lengths');
  for(i = 0; i < 100000; ++i) {
    test.equal(asm2[i], noasm2[i]);
    test.equal(asm2[i], bytes[i]);
  }
  test.done();
}