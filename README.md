# zlib-asm

zlib for asm.js.

## Install and Use

### bower

```
bower install zlib-asm
```

```
<script src="path/to/bower_components/zlib-asm/zlib.js"></script>
```

### npm

```
npm install zlib-asm
```

```
var zlib = require('zlib-asm');
```

## APIs

### zlib.deflate(input, compressionLevel, chunkSize)

It compresses the byte array as a zlib stream.

* @param *{Uint8Array|Buffer}* input
* @param *{number}* compressionLevel (optional: default is `6`)
* @param *{number}* chunkSize (optional: default is `32768`)
* @returns *{Uint8Array|Buffer}*

### zlib.rawDeflate(input, compressionLevel, chunkSize)

It compresses the byte array as a raw deflated stream.

* @param *{Uint8Array|Buffer}* input
* @param *{number}* compressionLevel (optional: default is `6`)
* @param *{number}* chunkSize (optional: default is `32768`)
* @returns *{Uint8Array|Buffer}*

### zlib.inflate(input, chunkSize)

It decompresses the zlib stream.

* @param *{Uint8Array|Buffer}* input
* @param *{number}* chunkSize (optional: default is `32768`)
* @returns *{Uint8Array|Buffer}*



### zlib.rawInflate(input, chunkSize)

It decompresses the raw deflated stream.

* @param *{Uint8Array|Buffer}* input
* @param *{number}* chunkSize (optional: default is `32768`)
* @returns *{Uint8Array|Buffer}*

### zlib.stream.deflate({input, streamFn, compressionLevel, shareMemory, chunkSize})

* @param *{Uint8Array}* input
* @param *{Function}* streamFn
* @param *{number}* compressionLevel (optional: default is `6`)
* @param *{boolean}* shareMemory (optional: default is `false`)
* @param *{number}* chunkSize (optional: default is `32768`)

```js
zlib.stream.deflate({
    input: sourcefile,
    streamFn: function (chunk) {
        // WebSocket connection.
        connection.send(chunk);
    },
    shareMemory: true // use the heap of Emscripten directly.
})
```

### zlib.stream.rawDeflate({input, streamFn, compressionLevel, shareMemory, chunkSize})

* @param *{Uint8Array}* input
* @param *{Function}* streamFn
* @param *{number}* compressionLevel (optional: default is `6`)
* @param *{boolean}* shareMemory (optional: default is `false`)
* @param *{number}* chunkSize (optional: default is `32768`)

### zlib.stream.inflate({input, streamFn, shareMemory, chunkSize})

* @param *{Uint8Array}* input
* @param *{Function}* streamFn
* @param *{boolean}* shareMemory (optional: default is `false`)
* @param *{number}* chunkSize (optional: default is `32768`)

### zlib.stream.rawInflate({input, streamFn, shareMemory, chunkSize})

* @param *{Uint8Array}* input
* @param *{Function}* streamFn
* @param *{boolean}* shareMemory (optional: default is `false`)
* @param *{number}* chunkSize (optional: default is `32768`)

### zlib.createDeflateStream({compressionLevel, chunkSize})

nodejs only.

* @param *{number}* compressionLevel (optional: default is `6`)
* @param *{number}* chunkSize (optional: default is `32768`)
* @returns *{stream.Transform}*

### zlib.createRawDeflateStream({compressionLevel, chunkSize})

nodejs only.

* @param *{number}* compressionLevel (optional: default is `6`)
* @param *{number}* chunkSize (optional: default is `32768`)
* @returns *{stream.Transform}*

### zlib.createInflateStream({chunkSize})

nodejs only.

* @param *{number}* chunkSize (optional: default is `32768`)
* @returns *{stream.Transform}*

### zlib.createRawInflateStream({chunkSize})

nodejs only.

* @param *{number}* chunkSize (optional: default is `32768`)
* @returns *{stream.Transform}*

## Development

Install emsdk.

[Emscripten SDK · kripken/emscripten Wiki](https://github.com/kripken/emscripten/wiki/Emscripten-SDK)

Install npm packages.

```
npm install
```

Init zlib.

```
make init
```

Test.

```
make test
```

Build for release.

```
make
```

## Benchmark

* [benchmark page](http://ukyo.github.io/zlib-asm/bench)
