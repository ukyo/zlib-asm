HEADERS=-Izlib/ -Iemscripten/
LIBS=zlib/libz.a
C_FILES=emscripten/zlibjs.c
POST_JS=--post-js emscripten/post.js
COMPILE_OUTPUT=-o lib/Module.js

COMMON_FUNCS='_ZLIBJS_init'
DEF_FUNCS='_ZLIBJS_deflate', '_ZLIBJS_createDeflateContext', '_ZLIBJS_freeDeflateContext'
INF_FUNCS='_ZLIBJS_inflate', '_ZLIBJS_createInflateContext', '_ZLIBJS_freeInflateContext'

EXPORTED_FUNCTIONS_FULL=-s EXPORTED_FUNCTIONS="[$(COMMON_FUNCS), $(DEF_FUNCS), $(INF_FUNCS)]"
EXPORTED_FUNCTIONS_DEF=-s EXPORTED_FUNCTIONS="[$(COMMON_FUNCS), $(DEF_FUNCS)]"
EXPORTED_FUNCTIONS_INF=-s EXPORTED_FUNCTIONS="[$(COMMON_FUNCS), $(INF_FUNCS)]"

RELEASE_FLAGS=-O3 --memory-init-file 0 --closure 1 --llvm-lto 1 -s NO_FILESYSTEM=1 -s NO_BROWSER=1 -s EXPORTED_RUNTIME_METHODS="[]"


BROWSERIFY=npm run browserify --
BROWSERIFY_FLAGS=--no-builtins
LICENSIFY=-p licensify
MINIFYIFY=-p [minifyify --exclude=lib/Module.js --no-map]


MOCHA=npm run mocha -loglevel silent -- --require test/helper.js
TEST_FILES_INF=test/zlib.inflate.js test/zlib.rawInflate.js test/zlib.stream.inflate.js test/zlib.stream.rawInflate.js test/zlib.createInflateStream.js test/zlib.createRawInflateStream.js
TEST_FILES_DEF=test/zlib.deflate.js test/zlib.rawDeflate.js test/zlib.stream.deflate.js test/zlib.stream.rawDeflate.js test/zlib.createDeflateStream.js test/zlib.createRawDeflateStream.js


# release

all: release-inf release-def release-full

release-inf: compile-release-inf browserify-inf

release-def: compile-release-def browserify-def

release-full: compile-release-full test browserify-full


# init zlib

init: zlib/*
	npm run init


# emscripten

compile-dev: compile
	emcc $(HEADERS) $(C_FILES) $(LIBS) $(POST_JS) $(EXPORTED_FUNCTIONS_FULL) $(COMPILE_OUTPUT)

compile-release-full: compile
	emcc $(HEADERS) $(C_FILES) $(LIBS) $(POST_JS) $(EXPORTED_FUNCTIONS_FULL) $(RELEASE_FLAGS) $(COMPILE_OUTPUT)

compile-release-inf: compile
	emcc $(HEADERS) $(C_FILES) $(LIBS) $(POST_JS) $(EXPORTED_FUNCTIONS_INF) $(RELEASE_FLAGS) $(COMPILE_OUTPUT)

compile-release-def: compile
	emcc $(HEADERS) $(C_FILES) $(LIBS) $(POST_JS) $(EXPORTED_FUNCTIONS_DEF) $(RELEASE_FLAGS) $(COMPILE_OUTPUT)


# browserify

browserify-dev: lib-def
	$(BROWSERIFY) browserify/deflate.js $(BROWSERIFY_FLAGS) -o dev/zlib.js

browserify-def: lib-def
	$(BROWSERIFY) browserify/deflate.js $(BROWSERIFY_FLAGS) $(LICENSIFY) $(MINIFYIFY) -o dist/zlib.def.js

browserify-inf: lib-inf
	$(BROWSERIFY) browserify/inflate.js $(BROWSERIFY_FLAGS) $(LICENSIFY) $(MINIFYIFY) -o dist/zlib.inf.js

browserify-full: lib-full
	$(BROWSERIFY) browserify/full.js $(BROWSERIFY_FLAGS) $(LICENSIFY) $(MINIFYIFY) -o dist/zlib.js


# test

test: lib-full test/helper.js
	$(MOCHA) $(TEST_FILES_INF) $(TEST_FILES_DEF)
	rm test/dst*

test-inf: test-files-inf
	$(MOCHA) $(TEST_FILES_INF)

test-def: test-files-def
	$(MOCHA) $(TEST_FILES_DEF)


# dependencies

compile: zlib emscripten
emscripten: emscripten/zlibjs.h emscripten/zlibjs.c emscripten/post.js
zlib: zlib/zlib.h zlib/libz.a

lib-full: lib-inf lib-def
lib-def: lib-common lib/BaseDeflate.js lib/Deflate.js lib/def.js
lib-inf: lib-common lib/BaseInflate.js lib/Inflate.js lib/inf.js
lib-common: lib/Module.js lib/common.js lib/ReaderWriterMixin.js

test-files-full: test-files-inf test-files-def
test-files-inf: test-files-common $(TEST_FILES_INF)
test-files-def: test-files-common $(TEST_FILES_DEF)
test-files-common: lib-full test/helper.js
