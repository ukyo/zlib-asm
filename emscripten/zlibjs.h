#include <stdio.h>
#include <string.h>
#include <assert.h>
#include <stdlib.h>
#include <zlib.h>
#include <emscripten.h>

void ZLIBJS_init(size_t chunk_size);
z_stream* ZLIBJS_createDeflateContext(int compression_level, int zlib_header);
int ZLIBJS_deflate(z_stream* ptr, size_t chunk_size, int flush);
void ZLIBJS_freeDeflateContext(z_stream* p);

z_stream* ZLIBJS_createInflateContext(int zlib_header);
int ZLIBJS_inflate(z_stream* ptr, size_t chunk_size);
void ZLIBJS_freeInflateContext(z_stream* p);
