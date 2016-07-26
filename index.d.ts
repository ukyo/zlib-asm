export type Bytes = Uint8Array | Buffer;
import {Transform} from 'stream';

/**
 * Compress a byte stream to a RFC 1950 zlib data format byte stream.
 * 
 * @param input
 * @param [compressionLevel=6]
 * @param [chunkSize=0x8000]
 */
export function deflate<T extends Bytes>(input: T, compressionLevel?: number, chunkSize?: number): T;

/**
 * Compress a byte stream to a RFC 1951 deflate byte stream.
 * 
 * @param input
 * @param [compressionLevel=6]
 * @param [chunkSize=0x8000]
 */
export function rawDeflate<T extends Bytes>(input: T, compressionLevel?: number, chunkSize?: number): T;

/**
 * Decompress a RFC 1950 zlib data format byte stream.
 * 
 * @export
 * @template T
 * @param {T} input
 * @param {number} [chunkSize]
 * @returns {T}
 */
export function inflate<T extends Bytes>(input: T, chunkSize?: number): T;

/**
 * Decompress a RFC 1951 deflate byte stream.
 * 
 * @param input
 * @param [compressionLevel=6]
 * @param [chunkSize=0x8000]
 */
export function rawInflate<T extends Bytes>(input: T, chunkSize?: number): T;

export interface BrowserDeflateStreamParams {
    input: Uint8Array
    streamFn: (chunk: Uint8Array) => any
    compressionLevel?: number
    shareMemory?: boolean
    chunkSize?: number
}

export interface BrowserInflateStreamParams {
    input: Uint8Array
    streamFn: (chunk: Uint8Array) => any
    shareMemory?: boolean
    chunkSize?: number
}

interface BrowserStreamFuncs {
    deflate: (params: BrowserDeflateStreamParams) => void
    rawDeflate: (params: BrowserDeflateStreamParams) => void
    inflate: (params: BrowserInflateStreamParams) => void
    rawInflate: (params: BrowserInflateStreamParams) => void
}

export var stream: BrowserStreamFuncs;

export interface NodeDeflateStreamParams {
    compressionLevel?: number
    chunkSize?: number
}

export interface NodeInflateStreamParams {
    chunkSize?: number
}

export function createDeflateStream(params: NodeDeflateStreamParams): Transform;
export function createRawDeflateStream(params: NodeDeflateStreamParams): Transform;
export function createInflateStream(params: NodeInflateStreamParams): Transform;
export function createRawInflateStream(params: NodeInflateStreamParams): Transform;