describe('zlib.stream.inflate', function () {
  it('should be defined.', function () {
    expect(zlib.stream.inflate).to.be.a('function');
  });

  it('should set Uint8Array to the argument of callbacks.', function () {
    var chunks = [];
    zlib.stream.inflate({
      input: zlibBuffer,
      streamFn: chunks.push.bind(chunks)
    });
    chunks.forEach(function (chunk) {
      expect(chunk).to.be.a.instanceof(Uint8Array);
    });
  });

  it('should share buffer if set true to the "shareMemory" option.', function () {
    var chunks = [];
    zlib.stream.inflate({
      input: zlibBuffer,
      streamFn: chunks.push.bind(chunks),
      shareMemory: true
    });
    var c = chunks.pop();
    chunks.forEach(function (chunk) {
      expect(c.buffer).to.equal(chunk.buffer);
      expect(c.byteOffset).to.equal(chunk.byteOffset);
    });
  });

  it('should change the chunk size if change the "chunkSize" option.', function () {
    var chunks = [];
    zlib.stream.inflate({
      input: zlibBuffer,
      streamFn: chunks.push.bind(chunks),
      shareMemory: true
    });
    expect(chunks.shift().length).to.equal(0x8000); // default size
    var chunks = [];
    zlib.stream.inflate({
      input: zlibBuffer,
      streamFn: chunks.push.bind(chunks),
      shareMemory: true,
      chunkSize: 0xf000
    });
    expect(chunks.shift().length).to.equal(0xf000);
  });

  it('should decompress the zlib stream correctly.', function () {
    var offset = 0;
    zlib.stream.inflate({
      input: zlibBuffer,
      streamFn: function (chunk) {
        expect(new Buffer(chunk).equals(sourceBuffer.slice(offset, offset + chunk.length))).to.be.true;
        offset += chunk.length;
      },
      shareMemory: true
    });
  });
});
