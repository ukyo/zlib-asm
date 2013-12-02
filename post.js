  // 必要なのだけ実装
  var MYFS = {
    // FS.mount実行時に呼ばれる  
    mount: function (parent, name, mode, rdev) {
      return MYFS.createNode(null, '/', 16384 | 0777, 0);
    },
    // 作成したノードを操作するメソッド
    node_ops: {
      // ノードの属性を書き込み(例: node.timestamp)
      setattr: function (node, attr) {
        if (attr.mode !== undefined) node.mode = attr.mode;
        if (attr.timestamp !== undefined) node.timestamp = attr.timestamp;
        if (attr.size !== undefined) {
          var contents = node.contents;
          if (contents.length > attr.size) {
            contents = contents.subarray(0, attr.size);
          } else {
            contents = MYFS.expandBuffer(contents, attr.size);
          }
          node.contents = contents;
          node.size = attr.size;
        }
      },
      // ノードを検索するんだけど、不必要なのでMEMFSから拝借
      lookup: MEMFS.node_ops.lookup,
      // 新しいノードを作る
      mknod: function (parent, name, mode, dev) {
        return MYFS.createNode(parent, name, mode, dev);
      }
    },
    // IO系の操作をするメソッド
    stream_ops: {
      // 読み
      read: function (stream, buffer, offset, length, position) {
        var node = stream.node,
            contents = node.contents,
            size = Math.min(contents.length - position, length);

        if (size > 8 && contents.subarray) { // non-trivial, and typed array
          buffer.set(contents.subarray(position, position + size), offset);
        } else {
          for (var i = 0; i < size; i++) {
            buffer[offset + i] = contents[position + i];
          }
        }
        return size;
      },
      // 書き
      write: function (stream, buffer, offset, length, position, canOwn) {
        var node = stream.node,
            contents = node.contents,
            bufferSize = contents.length,
            size = position + length;
        // expand buffer
        if (bufferSize === 0) {
          contents = new Uint8Array(size);
          bufferSize = contents.length;
        }
        contents = MYFS.expandBuffer(contents, size);
        // write
        contents.set(buffer.subarray(offset, offset + length), position);
        node.contents = contents;
        node.size = size;

        return length;
      }
    },
    // ノードの作成。node_ops, stream_ops, contentsを設定する必要がある
    createNode: function (parent, name, mode, dev) {
      var node = FS.createNode(parent, name, mode, dev);
      node.node_ops = MYFS.node_ops;
      node.stream_ops = MYFS.stream_ops;
      node.contents = [];
      node.timestamp = Date.now();
      if (parent) parent.contents[name] = node;
      return node;
    },
    // FS.createDataFileっぽく使えるやつ
    createFile: function (parent, name, data, r, w) {
      var node = FS.createFile(
        parent,
        name,
        {},
        r,
        w
      );
      node.contents = data;
      node.node_ops = MYFS.node_ops;
      node.stream_ops = MYFS.stream_ops;
      return node;
    },
    // バッファサイズの拡張。とりあえず倍々
    expandBuffer: function (buffer, size) {
      if (buffer.length >= size) return buffer;
      var bufferSize = buffer.length, _buffer;
      while (bufferSize < size) bufferSize *= 2;
      var _buffer = new Uint8Array(bufferSize);
      _buffer.set(buffer);
      return _buffer;
    }
  };

  // MYFSをマウント。絶対必要！  
  FS.mount(MYFS, {}, '/');

  function $run (args, input) {
    // ファイルが残っている場合は削除
    try {
      FS.destroyNode(FS.lookupPath('/input').node);
    } catch (e) {} 
    try {
      FS.destroyNode(FS.lookupPath('/output').node);
    } catch (e) {}
    // ファイルを作成
    MYFS.createFile(
      '/',
      'input',
      input,
      true,
      true
    );
    var outputNode = MYFS.createFile(
      '/',
      'output',
      new Uint8Array(0),
      true,
      true
    );
    // main関数呼び出し
    Module.callMain(args);
    // おしりを削って返す
    return outputNode.contents.subarray(0, outputNode.size);
  }

  return {
    run: $run,
    compress: $run.bind(null, []),
    decompress: $run.bind(null, ['-d'])
  };

})();

if (typeof module !== 'undefined' && module.exports) {
  eval('module.exports.' + key + ' = zlib;');
} else if(typeof window !== 'undefined') {
  eval('window.' + key + ' = zlib;');
} else {
  eval('this.' + key + ' = zlib;');
}
