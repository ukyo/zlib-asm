window.onload = function() {
  var fileInput = document.querySelector('#f'),
      result = document.querySelector('#result');
  
  fileInput.addEventListener('change', function(e) {
    var file = e.target.files[0];
    var reader = new FileReader;
    reader.readAsArrayBuffer(file);
    reader.onload = function() {
      bench(new Uint8Array(reader.result));
    };
  }, false);
  
  function bench(bytes) {
    var start = Date.now();
    var s = '<div>';
    var comp = zlib.deflate(bytes);
    s += 'compress: ' + (Date.now() - start) + 'ms.';
    start = Date.now();
    zlib.inflate(comp);
    s += ' decompress: ' + (Date.now() - start) + 'ms.</div>';
    result.innerHTML += s;
  }
};
