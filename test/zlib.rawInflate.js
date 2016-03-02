describe('zlib.rawInflate', function () {
  it('should be defined.', function () {
    expect(zlib.rawInflate).to.be.a('function');
  });

  it('should decompress the raw deflated stream correctly.', function () {
    var result = zlib.rawInflate(rawZlibBuffer);
    expect(result.equals(sourceBuffer)).to.be.true;
  });

  it('should decompress the raw deflated zero-length data correctly.', function () {
    var inf = zlib.rawInflate(new Uint8Array(0));
    expect(inf.length).to.equal(0);
  });
});
