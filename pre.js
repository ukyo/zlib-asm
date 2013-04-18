{
  run: function(bytes, decompress) {
    var inputIndex = -1;
    var outputIndex = -1;
    var returnValue = new Uint8Array(0x8000);
    var Module = {
      arguments: decompress ? ['-d'] : [],
      stdin: function() {
        return bytes[++inputIndex];
      },
      stdout: function(x) {
        var tmp;
        if (x !== null) {
          if (++outputIndex === returnValue.length) {
            tmp = new Uint8Array(returnValue.length * 2);
            tmp.set(returnValue);
            bytes = tmp;
          }
          returnValue[outputIndex] = x;
        }
      }
    };
