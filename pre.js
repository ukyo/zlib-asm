{
  run: function(bytes, decompress) {
    var inputIndex = -1;
    var outputIndex = -1;
    var ret = new Uint8Array(0x8000);
    var Module = {
      arguments: decompress ? ['-d'] : []
      stdin: function() {
        return bytes[++inputIndex];
      },
      stdout: function(x) {
        var tmp;
        if (x !== null) {
          if (++outputIndex === bytes.length) {
            tmp = new Uint8Array(bytes.length * 2);
            tmp.set(bytes);
            bytes = tmp;
          }
          bytes[outputIndex] = x;
        }
      }
    };
