  var $inputNode, $outputNode;

  function $run (args, input) {
    if ($inputNode) FS.destroyNode($inputNode);
    if ($outputNode) FS.destroyNode($outputNode);

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
    return $outputNode.contents;
  }

  return {
    run: $run,
    compress: $run.bind(null, []),
    decompress: $run.bind(null, ['-d'])
  };

})();