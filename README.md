# zlib-asm

zlib for asm.js.

## APIs

### zlib.deflate(input, level)

It compresses the byte array as a zlib stream.

* @param *{Uint8Array}* input
* @param *{number}* level (optional: default is `6`)
* @returns *{Uint8Array}*

### zlib.rawDeflate(input, level)

It compresses the byte array as a raw deflated stream.

* @param *{Uint8Array}* input
* @param *{number}* level (optional: default is `6`)
* @returns *{Uint8Array}*

### zlib.inflate(input)

It decompresses the zlib stream.

* @param *{Uint8Array}* input
* @returns *{Uint8Array}*



### zlib.rawInflate(input)

It decompresses the raw deflated stream.

* @param *{Uint8Array}* input
* @returns *{Uint8Array}*

### zlib.stream.deflate({input, streamFn, level, shareMemory})

* @param *{Uint8Array}* input
* @param *{Function}* streamFn
* @param *{number}* level (optional: default is `6`)
* @param *{boolean}* shareMemory (optional: default is `false`)

```js
zlib.stream.deflate({
    input: sourcefile,
    streamFn: function (chunk) {
        // End of stream
        if (chunk === null) return;
        // WebSocket connection.
        connection.send(chunk);
    },
    shareMemory: true // use the heap of Emscripten directly.
})
```

### zlib.stream.rawDeflate({input, streamFn, level, shareMemory})

* @param *{Uint8Array}* input
* @param *{Function}* streamFn
* @param *{number}* level (optional: default is `6`)
* @param *{boolean}* shareMemory (optional: default is `false`)

### zlib.stream.inflate({input, streamFn, shareMemory})

* @param *{Uint8Array}* input
* @param *{Function}* streamFn
* @param *{boolean}* shareMemory (optional: default is `false`)

### zlib.stream.rawInflate({input, streamFn, shareMemory})

* @param *{Uint8Array}* input
* @param *{Function}* streamFn
* @param *{boolean}* shareMemory (optional: default is `false`)

## Development

It is required below to build zlib-asm.

* llvm 3.2
* [kripken/emscripten · GitHub](https://github.com/kripken/emscripten)
* grunt


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
