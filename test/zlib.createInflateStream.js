describe('zlib.createInflateStream', function() {
  it('should be defined.', function() {
    expect(zlib.createInflateStream).to.be.a('function');
  });

  it('should decompress the zlib stream correctly.', function(done) {
    var rs = fs.createReadStream('test/comped.zlib');
    var is = zlib.createInflateStream();
    var ws = fs.createWriteStream('test/dst_inflate.txt');
    rs.pipe(is).pipe(ws);
    ws.on('close', function() {
      expect(sourceBuffer.equals(fs.readFileSync('test/dst_inflate.txt'))).to.be.true;
      done();
    });
  })
});
