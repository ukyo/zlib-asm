describe('zlib.createDeflateStream', function() {
  it('should be defined.', function() {
    expect(zlib.createDeflateStream).to.be.a('function');
  });

  it('should decompress the zlib stream correctly.', function(done) {
    var rs = fs.createReadStream('test/source.txt');
    var ds = zlib.createDeflateStream();
    var is = zlib.createInflateStream();
    var ws = fs.createWriteStream('test/dst_deflate.txt');
    rs.pipe(ds).pipe(is).pipe(ws);
    ws.on('close', function() {
      expect(sourceBuffer.equals(fs.readFileSync('test/dst_deflate.txt'))).to.be.true;
      done();
    });
  });
});
