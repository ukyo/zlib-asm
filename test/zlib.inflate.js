describe('zlib.inflate', function () {
  it('should be defined.', function () {
    expect(zlib.inflate).to.be.a('function');
  });

  it('should decompress the zlib stream correctly.', function () {
    var result = zlib.inflate(zlibBuffer);
    expect(result.equals(sourceBuffer)).to.be.true;
  });

  it('should return "Uint8Array" if input is "Uint8Array"', function () {
    var result = zlib.inflate(new Uint8Array(zlibBuffer));
    expect(Buffer.isBuffer(result)).to.be.false;
    expect(result).to.be.a.instanceof(Uint8Array);
    expect(new Buffer(result).equals(sourceBuffer)).to.be.true;
  });
});
