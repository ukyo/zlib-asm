global.expect = require('chai').expect;
global.fs = require('fs');
global.zlib = require('../index');
global.sourceBuffer = fs.readFileSync('test/source.txt');
global.zlibBuffer = fs.readFileSync('test/comped.zlib');
global.rawZlibBuffer = zlibBuffer.slice(2, -4);
global.concatChunks = function(chunks) {
  var size = chunks.map(function (chunk) { return chunk.length }).reduce(function (a, b) { return a + b });
  var ret = new Uint8Array(size);
  var offset = 0;
  chunks.forEach(function (chunk) {
    ret.set(chunk, offset);
    offset += chunk.length;
  });
  return ret;
};
