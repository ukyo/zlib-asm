# zlib-asm

convert zlib for asm.js.

## required

* [kripken/emscripten · GitHub](https://github.com/kripken/emscripten)
* [odinmonkey](http://hg.mozilla.org/users/lwagner_mozilla.com/odinmonkey) - for bench
* grunt

## build

install grunt-cli.

```
npm install -g grunt-cli
```

install npm packages.

```
npm install
```

run grunt tasks.

```
grunt
```

## bench

```
time path/to/odinmonkey/js -f dest/zlib-asm.js bench-asm.js
time path/to/odinmonkey/js -f dest/zlib-noasm.js bench-noasm.js
```
