var expect = require('chai').expect;
var fs = require('fs');
var source = new Uint8Array(Array.prototype.slice.call(fs.readFileSync('test/source.txt')));
var comped = new Uint8Array(Array.prototype.slice.call(fs.readFileSync('test/comped.zlib')));

function sameAll(a, b) {
  return Array.prototype.every.call(a, function (_, i) {
    return a[i] === b[i];
  });
}

describe('zlib', function () {
  it('should be defined.', function () {
    expect(zlib).to.be.an('object');
  });
});

describe('zlib.inflate', function () {
  it('should be defined.', function () {
    expect(zlib.inflate).to.be.a('function');
  });

  it('should decompress the zlib stream correctly.', function () {
    var s = zlib.inflate(comped);
    expect(s.length).to.equal(source.length);
    expect(sameAll(s, source)).to.be.true;
  })
});

describe('zlib.deflate', function () {
  it('should be defined.', function () {
    expect(zlib.deflate).to.be.a('function');
  });

  it('should compress the source as a valid zlib stream.', function () {
    var c = zlib.deflate(source);
    var s = zlib.inflate(c);
    expect(s.length).to.equal(source.length);
    expect(sameAll(s, source)).to.be.true;
  });
});

describe('zlib.rawInflate', function () {
  it('should be defined.', function () {
    expect(zlib.rawInflate).to.be.a('function');
  });

  it('should decompress the raw deflated stream correctly.', function () {
    var s = zlib.rawInflate(comped.subarray(2, -4));
    expect(s.length).to.equal(source.length);
    expect(sameAll(s, source)).to.be.true;
  })
});

describe('zlib.rawDeflate', function () {
  it('should be defined.', function () {
    expect(zlib.rawDeflate).to.be.a('function');
  });

  it('should compress the source as a valid deflated stream.', function () {
    var c = zlib.rawDeflate(source);
    var s = zlib.rawInflate(c);
    expect(s.length).to.equal(source.length);
    expect(sameAll(s, source)).to.be.true;
  })
});

describe('zlib.stream', function () {
  it('should be defined.', function () {
    expect(zlib.stream).to.be.an('object');
  });
});

function concatChunks (chunks) {
  var size = chunks.map(function (chunk) { return chunk.length }).reduce(function (a, b) { return a + b });
  var ret = new Uint8Array(size);
  var offset = 0;
  chunks.forEach(function (chunk) {
    ret.set(chunk, offset);
    offset += chunk.length;
  });
  return ret;
}

describe('zlib.stream.inflate', function () {
  it('should be defined.', function () {
    expect(zlib.stream.inflate).to.be.a('function');
  });

  it('should set Uint8Array to the argument of callbacks.', function () {
    var chunks = [];
    zlib.stream.inflate({
      input: comped,
      streamFn: chunks.push.bind(chunks)
    });
    chunks.forEach(function (chunk) {
      expect(chunk).to.be.a.instanceof(Uint8Array);
    });
  });

  it('should share buffer if set true to the "shareMemory" option.', function () {
    var chunks = [];
    zlib.stream.inflate({
      input: comped,
      streamFn: chunks.push.bind(chunks),
      shareMemory: true
    });
    var c = chunks.pop();
    chunks.forEach(function (chunk) {
      expect(c.buffer).to.equal(chunk.buffer);
      expect(c.byteOffset).to.equal(chunk.byteOffset);
    });
  })

  it('should decompress the zlib stream correctly.', function () {
    var offset = 0;
    zlib.stream.inflate({
      input: comped,
      streamFn: function (chunk) {
        expect(sameAll(chunk, source.subarray(offset, offset + chunk.length))).to.be.true;
        offset += chunk.length;
      },
      shareMemory: true
    });
  });
});

describe('zlib.stream.deflate', function () {
  it('should be defined', function () {
    expect(zlib.stream.deflate).to.be.a('function');
  });

  it('should set Uint8Array to the argument of callbacks and set null to the argument of the last callback.', function () {
    var chunks = [];
    zlib.stream.deflate({
      input: source,
      streamFn: function (chunk) {
        chunks.push(chunk);
      }
    });
    chunks.forEach(function (chunk) {
      expect(chunk).to.be.a.instanceof(Uint8Array);
    });
  });

  it('should compress the source as a valid zlib stream.', function () {
    var chunks = [];
    var offset = 0;
    zlib.stream.deflate({
      input: source,
      streamFn: chunks.push.bind(chunks)
    });
    var c = concatChunks(chunks);
    zlib.stream.inflate({
      input: c,
      streamFn: function (chunk) {
        expect(sameAll(chunk, source.subarray(offset, offset + chunk.length))).to.be.true;
        offset += chunk.length;
      },
      shareMemory: true
    });
  })
});

describe('zlib.stream.rawInflate', function () {
  it('should be defined.', function () {
    expect(zlib.stream.rawInflate).to.be.a('function');
  });

  it('should decompress the raw deflated stream correctly.', function () {
    var offset = 0;
    zlib.stream.rawInflate({
      input: comped.subarray(2, -4),
      streamFn: function (chunk) {
        expect(sameAll(chunk, source.subarray(offset, offset + chunk.length))).to.be.true;
        offset += chunk.length;
      },
      shareMemory: true
    });
  });
});

describe('zlib.stream.rawDeflate', function () {
  it('should be defined', function () {
    expect(zlib.stream.rawDeflate).to.be.a('function');
  });

  it('should compress the as a valid deflated stream', function () {
    var chunks = [];
    var offset = 0;
    zlib.stream.rawDeflate({
      input: source,
      streamFn: chunks.push.bind(chunks)
    });
    var c = concatChunks(chunks);
    zlib.stream.rawInflate({
      input: c,
      streamFn: function (chunk) {
        expect(sameAll(chunk, source.subarray(offset, offset + chunk.length))).to.be.true;
        offset += chunk.length;
      },
      shareMemory: true
    });
  })
});
