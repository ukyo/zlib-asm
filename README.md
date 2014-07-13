# zlib-asm

zlib for asm.js.

## Install and Use

Install

```
bower install zlib-asm
```

Use

```
<script src="path/to/bower_components/zlib-asm/zlib.js"></script>
```

## APIs

### zlib.deflate(input, level, chunkSize)

It compresses the byte array as a zlib stream.

* @param *{Uint8Array}* input
* @param *{number}* level (optional: default is `6`)
* @param *{number}* chunkSize (optional: default is `32768`)
* @returns *{Uint8Array}*

### zlib.rawDeflate(input, level, chunkSize)

It compresses the byte array as a raw deflated stream.

* @param *{Uint8Array}* input
* @param *{number}* level (optional: default is `6`)
* @param *{number}* chunkSize (optional: default is `32768`)
* @returns *{Uint8Array}*

### zlib.inflate(input, chunkSize)

It decompresses the zlib stream.

* @param *{Uint8Array}* input
* @param *{number}* chunkSize (optional: default is `32768`)
* @returns *{Uint8Array}*



### zlib.rawInflate(input, chunkSize)

It decompresses the raw deflated stream.

* @param *{Uint8Array}* input
* @param *{number}* chunkSize (optional: default is `32768`)
* @returns *{Uint8Array}*

### zlib.stream.deflate({input, streamFn, level, shareMemory, chunkSize})

* @param *{Uint8Array}* input
* @param *{Function}* streamFn
* @param *{number}* level (optional: default is `6`)
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

### zlib.stream.rawDeflate({input, streamFn, level, shareMemory, chunkSize})

* @param *{Uint8Array}* input
* @param *{Function}* streamFn
* @param *{number}* level (optional: default is `6`)
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

## Development

Install emsdk

[Emscripten SDK · kripken/emscripten Wiki](https://github.com/kripken/emscripten/wiki/Emscripten-SDK)

Install grunt-cli.

```
npm install -g grunt-cli
```

Install npm packages.

```
npm install
```

Init zlib and dev dir.

```
grunt init
```

Write codes and test.

```
grunt watch
```

Build for release.

```
grunt release
```

## Benchmark

* [benchmark page](http://ukyo.github.io/zlib-asm/bench)
