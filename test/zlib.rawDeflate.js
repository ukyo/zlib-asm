describe('zlib.rawDeflate', function () {
  it('should be defined.', function () {
    expect(zlib.rawDeflate).to.be.a('function');
  });

  it('should compress the source as a valid deflated stream.', function () {
    var result = zlib.rawInflate(zlib.rawDeflate(sourceBuffer));
    expect(result.equals(sourceBuffer)).to.be.true;
  })
});
