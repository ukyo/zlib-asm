describe('zlib.stream.deflate', function () {
  it('should be defined', function () {
    expect(zlib.stream.deflate).to.be.a('function');
  });

  it('should set Uint8Array to the argument of callbacks and set null to the argument of the last callback.', function () {
    var chunks = [];
    zlib.stream.deflate({
      input: sourceBuffer,
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
      input: sourceBuffer,
      streamFn: chunks.push.bind(chunks)
    });
    var c = concatChunks(chunks);
    zlib.stream.inflate({
      input: c,
      streamFn: function (chunk) {
        expect(new Buffer(chunk).equals(sourceBuffer.slice(offset, offset + chunk.length))).to.be.true;
        offset += chunk.length;
      },
      shareMemory: true
    });
  })
});
