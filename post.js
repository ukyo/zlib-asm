  var $inputNode, $outputNode, $originalWriteFn, $originalEnsureFlexible, $buffer;

  // cache of output buffer
  $buffer = new Uint8Array(0x8000);

  // save original functions of MEMFS
  $originalWriteFn = MEMFS.stream_ops.write;
  $originalEnsureFlexible = MEMFS.ensureFlexible;

  var contentsSize;
  function $write (stream, buffer, offset, length, position, canOwn) {
    var bufferSize = $buffer.length, b;
    stream.node.timestamp = Date.now();
    
    // resize the buffer
    while (bufferSize < position) bufferSize *= 2;
    b = new Uint8Array(bufferSize);
    b.set($buffer);
    $buffer = b;
    $buffer.set(buffer.subarray(offset, offset + length), position);
    
    stream.node.contents = $buffer;
    contentsSize = position;
    return length;
  }

  function $noop () {}


  function $run (args, input) {
    if ($inputNode) FS.destroyNode($inputNode);
    if ($outputNode) FS.destroyNode($outputNode);
    MEMFS.stream_ops.write = $write;
    MEMFS.ensureFlexible = $noop;

    $inputNode = FS.createDataFile(
      '/',
      'input',
      input,
      true,
      false
    );

    $outputNode = FS.createDataFile(
      '/',
      'output',
      new Uint8Array(0),
      false,
      true
    );
    Module.callMain(args);

    MEMFS.stream_ops.write = $originalWriteFn;
    MEMFS.ensureFlexible = $originalEnsureFlexible;

    return new Uint8Array($outputNode.contents.subarray(0, contentsSize));
  }

  return {
    run: $run,
    compress: $run.bind(null, []),
    decompress: $run.bind(null, ['-d'])
  };

})();