var global;
if (typeof module !== 'undefined' && module.exports) {
  global = module.exports;
} else if(typeof window !== 'undefined') {
  global = window;
} else {
  global = this;
}

global[key] = {
  run: function(inputBytes, decompress) {
    var inputIndex = -1;
    var outputIndex = -1;
    var outputBytes = new Uint8Array(0x8000);
    var Module = {
      arguments: decompress ? ['-d'] : [],
      stdin: function() {
        return inputBytes[++inputIndex];
      },
      stdout: function(x) {
        var tmp;
        if (x !== null) {
          if (++outputIndex === outputBytes.length) {
            tmp = new Uint8Array(outputBytes.length * 2);
            tmp.set(outputBytes);
            outputBytes = tmp;
          }
          outputBytes[outputIndex] = x;
        }
      }
    };
