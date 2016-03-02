#include "zlibjs.h"

unsigned char* src;
unsigned char* dst;
size_t max_chunk_size = 0;

void ZLIBJS_init(size_t chunk_size) {
  if (max_chunk_size >= chunk_size) return;
  max_chunk_size = chunk_size;
  free(src);
  free(dst);
  src = (unsigned char*)malloc(max_chunk_size);
  dst = (unsigned char*)malloc(max_chunk_size);
}

size_t ZLIBJS_read(z_stream* ptr, unsigned char* buf, size_t size) {
  return EM_ASM_INT({return ZLIBJS_read($0, $1, $2)}, ptr, buf, size);
}

void ZLIBJS_write(z_stream* ptr, unsigned char* buf, size_t size) {
  EM_ASM_INT({ZLIBJS_write($0, $1, $2)}, ptr, buf, size);
}

z_stream* ZLIBJS_createDeflateContext(int compression_level, int zlib_header) {
  z_stream* ptr = (z_stream*)malloc(sizeof(z_stream));
  ptr->zalloc = Z_NULL;
  ptr->zfree = Z_NULL;
  ptr->opaque = Z_NULL;
  if (deflateInit2(ptr, compression_level, Z_DEFLATED, MAX_WBITS * zlib_header, MAX_MEM_LEVEL, Z_DEFAULT_STRATEGY) == Z_OK) {
    return ptr;
  } else {
    deflateEnd(ptr);
    return NULL;
  }
}

int ZLIBJS_deflate(z_stream* ptr, size_t chunk_size, int flush) {
  ptr->avail_in = ZLIBJS_read(ptr, src, chunk_size);
  ptr->next_in = src;
  int have;
  int ret;
  do {
      ptr->avail_out = chunk_size;
      ptr->next_out = dst;
      ret = deflate(ptr, flush ? Z_FINISH : Z_NO_FLUSH);
      if (ret == Z_STREAM_ERROR) return ret;
      have = chunk_size - ptr->avail_out;
      ZLIBJS_write(ptr, dst, have);
  } while (ptr->avail_out == 0);
  return ret;
}

void ZLIBJS_freeDeflateContext(z_stream* ptr) {
  deflateEnd(ptr);
}

z_stream* ZLIBJS_createInflateContext(int zlib_header) {
  z_stream* ptr = malloc(sizeof(z_stream));
  ptr->zalloc = Z_NULL;
  ptr->zfree = Z_NULL;
  ptr->opaque = Z_NULL;
  ptr->avail_in = 0;
  ptr->next_in = Z_NULL;
  if (inflateInit2(ptr, MAX_WBITS * zlib_header) == Z_OK) {
    return ptr;
  } else {
    inflateEnd(ptr);
    return NULL;
  }
}

int ZLIBJS_inflate(z_stream* ptr, size_t chunk_size) {
  ptr->avail_in = ZLIBJS_read(ptr, src, chunk_size);
  ptr->next_in = src;
  int ret;
  int have;
  do {
    ptr->avail_out = chunk_size;
    ptr->next_out = dst;
    ret = inflate(ptr, Z_NO_FLUSH);
    switch (ret) {
      case Z_NEED_DICT:
        ret = Z_DATA_ERROR;
      case Z_DATA_ERROR:
      case Z_MEM_ERROR:
        return ret;
    }
    have = chunk_size - ptr->avail_out;
    ZLIBJS_write(ptr, dst, have);
  } while (ptr->avail_out == 0);
  return ret;
}

void ZLIBJS_freeInflateContext(z_stream* ptr) {
  inflateEnd(ptr);
}
