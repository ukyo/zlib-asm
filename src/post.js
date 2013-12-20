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
      var chunk = new Uint8Array(buffer.buffer, offset, length);
      if (!MYFS.shareMemory) chunk = new Uint8Array(chunk);
      MYFS.writeStreamFn(chunk);
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
  },
  writeStreamFn: null
};

// MYFSをマウント。絶対必要！  
FS.mount(MYFS, {}, '/');

function zerror (message) {
  throw new Error('zlib-asm: ' + message);
}

function validate (ret) {
  var Z_STREAM_ERROR = -2;
  var Z_DATA_ERROR = -3;
  var Z_MEM_ERROR = -4;
  var Z_VERSION_ERROR = -6;
  switch (ret) {
    case Z_STREAM_ERROR: zerror('invalid compression level');
    case Z_DATA_ERROR: zerror('invalid or incomplete deflate data');
    case Z_MEM_ERROR: zerror('out of memory');
    case Z_VERSION_ERROR: zerror('zlib version mismatch');
  }
}

function init (input, streamFn, shareMemory) {
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
  MYFS.createFile(
    '/',
    'output',
    new Uint8Array(0),
    true,
    true
  );
  MYFS.writeStreamFn = streamFn;
  MYFS.shareMemory = shareMemory;
}

var DEFAULT_COMPRESSION_LEVEL = 6;
var DEFAULT_CHUNK_SIZE = 0x8000;

function deflate (input, streamFn, level, shareMemory, zlibHeader, chunkSize) {
  init(input, streamFn, shareMemory);
  return _deflate_file(level || DEFAULT_COMPRESSION_LEVEL, zlibHeader, chunkSize || DEFAULT_CHUNK_SIZE);
}

function inflate (input, streamFn, shareMemory, zlibHeader, chunkSize) {
  init(input, streamFn, shareMemory);
  return _inflate_file(zlibHeader, chunkSize || DEFAULT_CHUNK_SIZE);
}

var zlib = this;

function concatChunks (chunks) {
  var size = chunks.map(function (chunk) { return chunk.length }).reduce(function (a, b) { return a + b });
  var ret = new Uint8Array(size);
  var offset = 0;
  chunks.forEach(function (chunk) {
    ret.set(chunk, offset);
    offset += chunk.length;
  });
  return ret;
}

function zlibDeflate (zlibHeader, input, level, chunkSize) {
  var chunks = [];
  validate(deflate(input, chunks.push.bind(chunks), level, false, zlibHeader, chunkSize));
  return concatChunks(chunks);
}

function zlibInflate (zlibHeader, input, chunkSize) {
  var chunks = [];
  validate(inflate(input, chunks.push.bind(chunks), false, zlibHeader, chunkSize));
  return concatChunks(chunks);
}

zlib['deflate'] = zlibDeflate.bind(null, 1);
zlib['rawDeflate'] = zlibDeflate.bind(null, -1);
zlib['inflate'] = zlibInflate.bind(null, 1);
zlib['rawInflate'] = zlibInflate.bind(null, -1);

var zlibStream = zlib['stream'] = {};

function zlibStreamDeflate (zlibHeader, params) {
  validate(deflate(params['input'], params['streamFn'], params['level'], params['shareMemory'], zlibHeader, params['chunkSize']));
}

function zlibSteamInflate (zlibHeader, params) {
  validate(inflate(params['input'], params['streamFn'], params['shareMemory'], zlibHeader, params['chunkSize']));
}

zlibStream['deflate'] = zlibStreamDeflate.bind(null, 1);
zlibStream['rawDeflate'] = zlibStreamDeflate.bind(null, -1);
zlibStream['inflate'] = zlibSteamInflate.bind(null, 1);
zlibStream['rawInflate'] = zlibSteamInflate.bind(null, -1);

if (typeof define !== 'undefined' && define['amd']) {
  define('zlib', function () { return zlib });
} else if (ENVIRONMENT_IS_NODE) {
  module['exports'] = zlib;
}
