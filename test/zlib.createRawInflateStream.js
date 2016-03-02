describe('zlib.createRawInflateStream', function() {
  it('should be defined.', function() {
    expect(zlib.createRawInflateStream).to.be.a('function');
  });

  it('should decompress the raw zlib stream correctly.', function(done) {
    var rs = fs.createReadStream('test/comped.zlib', {start: 2, end: zlibBuffer.length - 4});
    var is = zlib.createRawInflateStream();
    var ws = fs.createWriteStream('test/dst_raw_inflate.txt');
    rs.pipe(is).pipe(ws);
    ws.on('close', function() {
      expect(sourceBuffer.equals(fs.readFileSync('test/dst_raw_inflate.txt'))).to.be.true;
      done();
    });
  })
});
