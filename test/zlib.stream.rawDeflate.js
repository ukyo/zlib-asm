describe('zlib.stream.rawDeflate', function () {
  it('should be defined', function () {
    expect(zlib.stream.rawDeflate).to.be.a('function');
  });

  it('should compress the as a valid deflated stream', function () {
    var chunks = [];
    var offset = 0;
    zlib.stream.rawDeflate({
      input: sourceBuffer,
      streamFn: chunks.push.bind(chunks)
    });
    var c = concatChunks(chunks);
    zlib.stream.rawInflate({
      input: c,
      streamFn: function (chunk) {
        expect(new Buffer(chunk).equals(sourceBuffer.slice(offset, offset + chunk.length))).to.be.true;
        offset += chunk.length;
      },
      shareMemory: true
    });
  })
});
