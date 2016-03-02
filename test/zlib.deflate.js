describe('zlib.deflate', function () {
  it('should be defined.', function () {
    expect(zlib.deflate).to.be.a('function');
  });

  it('should compress the source as a valid zlib stream.', function () {
    var result = zlib.inflate(zlib.deflate(sourceBuffer));
    expect(result.equals(sourceBuffer)).to.be.true;
  });
});
