describe('zlib.stream.rawInflate', function () {
  it('should be defined.', function () {
    expect(zlib.stream.rawInflate).to.be.a('function');
  });

  it('should decompress the raw deflated stream correctly.', function () {
    var offset = 0;
    zlib.stream.rawInflate({
      input: rawZlibBuffer,
      streamFn: function (chunk) {
        expect(new Buffer(chunk).equals(sourceBuffer.slice(offset, offset + chunk.length))).to.be.true;
        offset += chunk.length;
      },
      shareMemory: true
    });
  });
});
