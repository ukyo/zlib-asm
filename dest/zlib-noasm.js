var zlib_noasm =
{
  run: function(bytes, decompress) {
    var inputIndex = -1;
    var outputIndex = -1;
    var returnValue = new Uint8Array(0x8000);
    var Module = {
      arguments: decompress ? ['-d'] : [],
      stdin: function() {
        return bytes[++inputIndex];
      },
      stdout: function(x) {
        var tmp;
        if (x !== null) {
          if (++outputIndex === returnValue.length) {
            tmp = new Uint8Array(returnValue.length * 2);
            tmp.set(returnValue);
            bytes = tmp;
          }
          returnValue[outputIndex] = x;
        }
      }
    };

// Note: For maximum-speed code, see "Optimizing Code" on the Emscripten wiki, https://github.com/kripken/emscripten/wiki/Optimizing-Code
// Note: Some Emscripten settings may limit the speed of the generated code.
// TODO: " u s e   s t r i c t ";

try {
  this['Module'] = Module;
} catch(e) {
  this['Module'] = Module = {};
}

// The environment setup code below is customized to use Module.
// *** Environment setup code ***
var ENVIRONMENT_IS_NODE = typeof process === 'object' && typeof require === 'function';
var ENVIRONMENT_IS_WEB = typeof window === 'object';
var ENVIRONMENT_IS_WORKER = typeof importScripts === 'function';
var ENVIRONMENT_IS_SHELL = !ENVIRONMENT_IS_WEB && !ENVIRONMENT_IS_NODE && !ENVIRONMENT_IS_WORKER;

if (ENVIRONMENT_IS_NODE) {
  // Expose functionality in the same simple way that the shells work
  // Note that we pollute the global namespace here, otherwise we break in node
  Module['print'] = function(x) {
    process['stdout'].write(x + '\n');
  };
  Module['printErr'] = function(x) {
    process['stderr'].write(x + '\n');
  };

  var nodeFS = require('fs');
  var nodePath = require('path');

  Module['read'] = function(filename) {
    filename = nodePath['normalize'](filename);
    var ret = nodeFS['readFileSync'](filename).toString();
    // The path is absolute if the normalized version is the same as the resolved.
    if (!ret && filename != nodePath['resolve'](filename)) {
      filename = path.join(__dirname, '..', 'src', filename);
      ret = nodeFS['readFileSync'](filename).toString();
    }
    return ret;
  };

  Module['load'] = function(f) {
    globalEval(read(f));
  };

  if (!Module['arguments']) {
    Module['arguments'] = process['argv'].slice(2);
  }
}

if (ENVIRONMENT_IS_SHELL) {
  Module['print'] = print;
  if (typeof printErr != 'undefined') Module['printErr'] = printErr; // not present in v8 or older sm

  // Polyfill over SpiderMonkey/V8 differences
  if (typeof read != 'undefined') {
    Module['read'] = read;
  } else {
    Module['read'] = function(f) { snarf(f) };
  }

  if (!Module['arguments']) {
    if (typeof scriptArgs != 'undefined') {
      Module['arguments'] = scriptArgs;
    } else if (typeof arguments != 'undefined') {
      Module['arguments'] = arguments;
    }
  }
}

if (ENVIRONMENT_IS_WEB && !ENVIRONMENT_IS_WORKER) {
  if (!Module['print']) {
    Module['print'] = function(x) {
      console.log(x);
    };
  }

  if (!Module['printErr']) {
    Module['printErr'] = function(x) {
      console.log(x);
    };
  }
}

if (ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER) {
  Module['read'] = function(url) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, false);
    xhr.send(null);
    return xhr.responseText;
  };

  if (!Module['arguments']) {
    if (typeof arguments != 'undefined') {
      Module['arguments'] = arguments;
    }
  }
}

if (ENVIRONMENT_IS_WORKER) {
  // We can do very little here...
  var TRY_USE_DUMP = false;
  if (!Module['print']) {
    Module['print'] = (TRY_USE_DUMP && (typeof(dump) !== "undefined") ? (function(x) {
      dump(x);
    }) : (function(x) {
      // self.postMessage(x); // enable this if you want stdout to be sent as messages
    }));
  }

  Module['load'] = importScripts;
}

if (!ENVIRONMENT_IS_WORKER && !ENVIRONMENT_IS_WEB && !ENVIRONMENT_IS_NODE && !ENVIRONMENT_IS_SHELL) {
  // Unreachable because SHELL is dependant on the others
  throw 'Unknown runtime environment. Where are we?';
}

function globalEval(x) {
  eval.call(null, x);
}
if (!Module['load'] == 'undefined' && Module['read']) {
  Module['load'] = function(f) {
    globalEval(Module['read'](f));
  };
}
if (!Module['print']) {
  Module['print'] = function(){};
}
if (!Module['printErr']) {
  Module['printErr'] = Module['print'];
}
if (!Module['arguments']) {
  Module['arguments'] = [];
}
// *** Environment setup code ***

// Closure helpers
Module.print = Module['print'];
Module.printErr = Module['printErr'];

// Callbacks
if (!Module['preRun']) Module['preRun'] = [];
if (!Module['postRun']) Module['postRun'] = [];

  
// === Auto-generated preamble library stuff ===

//========================================
// Runtime code shared with compiler
//========================================

var Runtime = {
  stackSave: function () {
    return STACKTOP;
  },
  stackRestore: function (stackTop) {
    STACKTOP = stackTop;
  },
  forceAlign: function (target, quantum) {
    quantum = quantum || 4;
    if (quantum == 1) return target;
    if (isNumber(target) && isNumber(quantum)) {
      return Math.ceil(target/quantum)*quantum;
    } else if (isNumber(quantum) && isPowerOfTwo(quantum)) {
      var logg = log2(quantum);
      return '((((' +target + ')+' + (quantum-1) + ')>>' + logg + ')<<' + logg + ')';
    }
    return 'Math.ceil((' + target + ')/' + quantum + ')*' + quantum;
  },
  isNumberType: function (type) {
    return type in Runtime.INT_TYPES || type in Runtime.FLOAT_TYPES;
  },
  isPointerType: function isPointerType(type) {
  return type[type.length-1] == '*';
},
  isStructType: function isStructType(type) {
  if (isPointerType(type)) return false;
  if (/^\[\d+\ x\ (.*)\]/.test(type)) return true; // [15 x ?] blocks. Like structs
  if (/<?{ ?[^}]* ?}>?/.test(type)) return true; // { i32, i8 } etc. - anonymous struct types
  // See comment in isStructPointerType()
  return type[0] == '%';
},
  INT_TYPES: {"i1":0,"i8":0,"i16":0,"i32":0,"i64":0},
  FLOAT_TYPES: {"float":0,"double":0},
  bitshift64: function (low, high, op, bits) {
    var ret;
    var ander = Math.pow(2, bits)-1;
    if (bits < 32) {
      switch (op) {
        case 'shl':
          ret = [low << bits, (high << bits) | ((low&(ander << (32 - bits))) >>> (32 - bits))];
          break;
        case 'ashr':
          ret = [(((low >>> bits ) | ((high&ander) << (32 - bits))) >> 0) >>> 0, (high >> bits) >>> 0];
          break;
        case 'lshr':
          ret = [((low >>> bits) | ((high&ander) << (32 - bits))) >>> 0, high >>> bits];
          break;
      }
    } else if (bits == 32) {
      switch (op) {
        case 'shl':
          ret = [0, low];
          break;
        case 'ashr':
          ret = [high, (high|0) < 0 ? ander : 0];
          break;
        case 'lshr':
          ret = [high, 0];
          break;
      }
    } else { // bits > 32
      switch (op) {
        case 'shl':
          ret = [0, low << (bits - 32)];
          break;
        case 'ashr':
          ret = [(high >> (bits - 32)) >>> 0, (high|0) < 0 ? ander : 0];
          break;
        case 'lshr':
          ret = [high >>>  (bits - 32) , 0];
          break;
      }
    }
    HEAP32[tempDoublePtr>>2] = ret[0]; // cannot use utility functions since we are in runtime itself
    HEAP32[tempDoublePtr+4>>2] = ret[1];
  },
  or64: function (x, y) {
    var l = (x | 0) | (y | 0);
    var h = (Math.round(x / 4294967296) | Math.round(y / 4294967296)) * 4294967296;
    return l + h;
  },
  and64: function (x, y) {
    var l = (x | 0) & (y | 0);
    var h = (Math.round(x / 4294967296) & Math.round(y / 4294967296)) * 4294967296;
    return l + h;
  },
  xor64: function (x, y) {
    var l = (x | 0) ^ (y | 0);
    var h = (Math.round(x / 4294967296) ^ Math.round(y / 4294967296)) * 4294967296;
    return l + h;
  },
  getNativeTypeSize: function (type, quantumSize) {
    if (Runtime.QUANTUM_SIZE == 1) return 1;
    var size = {
      '%i1': 1,
      '%i8': 1,
      '%i16': 2,
      '%i32': 4,
      '%i64': 8,
      "%float": 4,
      "%double": 8
    }['%'+type]; // add '%' since float and double confuse Closure compiler as keys, and also spidermonkey as a compiler will remove 's from '_i8' etc
    if (!size) {
      if (type.charAt(type.length-1) == '*') {
        size = Runtime.QUANTUM_SIZE; // A pointer
      } else if (type[0] == 'i') {
        var bits = parseInt(type.substr(1));
        assert(bits % 8 == 0);
        size = bits/8;
      }
    }
    return size;
  },
  getNativeFieldSize: function (type) {
    return Math.max(Runtime.getNativeTypeSize(type), Runtime.QUANTUM_SIZE);
  },
  dedup: function dedup(items, ident) {
  var seen = {};
  if (ident) {
    return items.filter(function(item) {
      if (seen[item[ident]]) return false;
      seen[item[ident]] = true;
      return true;
    });
  } else {
    return items.filter(function(item) {
      if (seen[item]) return false;
      seen[item] = true;
      return true;
    });
  }
},
  set: function set() {
  var args = typeof arguments[0] === 'object' ? arguments[0] : arguments;
  var ret = {};
  for (var i = 0; i < args.length; i++) {
    ret[args[i]] = 0;
  }
  return ret;
},
  calculateStructAlignment: function calculateStructAlignment(type) {
    type.flatSize = 0;
    type.alignSize = 0;
    var diffs = [];
    var prev = -1;
    type.flatIndexes = type.fields.map(function(field) {
      var size, alignSize;
      if (Runtime.isNumberType(field) || Runtime.isPointerType(field)) {
        size = Runtime.getNativeTypeSize(field); // pack char; char; in structs, also char[X]s.
        alignSize = size;
      } else if (Runtime.isStructType(field)) {
        size = Types.types[field].flatSize;
        alignSize = Types.types[field].alignSize;
      } else {
        throw 'Unclear type in struct: ' + field + ', in ' + type.name_ + ' :: ' + dump(Types.types[type.name_]);
      }
      alignSize = type.packed ? 1 : Math.min(alignSize, Runtime.QUANTUM_SIZE);
      type.alignSize = Math.max(type.alignSize, alignSize);
      var curr = Runtime.alignMemory(type.flatSize, alignSize); // if necessary, place this on aligned memory
      type.flatSize = curr + size;
      if (prev >= 0) {
        diffs.push(curr-prev);
      }
      prev = curr;
      return curr;
    });
    type.flatSize = Runtime.alignMemory(type.flatSize, type.alignSize);
    if (diffs.length == 0) {
      type.flatFactor = type.flatSize;
    } else if (Runtime.dedup(diffs).length == 1) {
      type.flatFactor = diffs[0];
    }
    type.needsFlattening = (type.flatFactor != 1);
    return type.flatIndexes;
  },
  generateStructInfo: function (struct, typeName, offset) {
    var type, alignment;
    if (typeName) {
      offset = offset || 0;
      type = (typeof Types === 'undefined' ? Runtime.typeInfo : Types.types)[typeName];
      if (!type) return null;
      if (type.fields.length != struct.length) {
        printErr('Number of named fields must match the type for ' + typeName + ': possibly duplicate struct names. Cannot return structInfo');
        return null;
      }
      alignment = type.flatIndexes;
    } else {
      var type = { fields: struct.map(function(item) { return item[0] }) };
      alignment = Runtime.calculateStructAlignment(type);
    }
    var ret = {
      __size__: type.flatSize
    };
    if (typeName) {
      struct.forEach(function(item, i) {
        if (typeof item === 'string') {
          ret[item] = alignment[i] + offset;
        } else {
          // embedded struct
          var key;
          for (var k in item) key = k;
          ret[key] = Runtime.generateStructInfo(item[key], type.fields[i], alignment[i]);
        }
      });
    } else {
      struct.forEach(function(item, i) {
        ret[item[1]] = alignment[i];
      });
    }
    return ret;
  },
  dynCall: function (sig, ptr, args) {
    if (args && args.length) {
      return FUNCTION_TABLE[ptr].apply(null, args);
    } else {
      return FUNCTION_TABLE[ptr]();
    }
  },
  addFunction: function (func, sig) {
    assert(sig);
    var table = FUNCTION_TABLE; // TODO: support asm
    var ret = table.length;
    table.push(func);
    table.push(0);
    return ret;
  },
  warnOnce: function (text) {
    if (!Runtime.warnOnce.shown) Runtime.warnOnce.shown = {};
    if (!Runtime.warnOnce.shown[text]) {
      Runtime.warnOnce.shown[text] = 1;
      Module.printErr(text);
    }
  },
  funcWrappers: {},
  getFuncWrapper: function (func, sig) {
    assert(sig);
    if (!Runtime.funcWrappers[func]) {
      Runtime.funcWrappers[func] = function() {
        Runtime.dynCall(sig, func, arguments);
      };
    }
    return Runtime.funcWrappers[func];
  },
  UTF8Processor: function () {
    var buffer = [];
    var needed = 0;
    this.processCChar = function (code) {
      code = code & 0xff;
      if (needed) {
        buffer.push(code);
        needed--;
      }
      if (buffer.length == 0) {
        if (code < 128) return String.fromCharCode(code);
        buffer.push(code);
        if (code > 191 && code < 224) {
          needed = 1;
        } else {
          needed = 2;
        }
        return '';
      }
      if (needed > 0) return '';
      var c1 = buffer[0];
      var c2 = buffer[1];
      var c3 = buffer[2];
      var ret;
      if (c1 > 191 && c1 < 224) {
        ret = String.fromCharCode(((c1 & 31) << 6) | (c2 & 63));
      } else {
        ret = String.fromCharCode(((c1 & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63));
      }
      buffer.length = 0;
      return ret;
    }
    this.processJSString = function(string) {
      string = unescape(encodeURIComponent(string));
      var ret = [];
      for (var i = 0; i < string.length; i++) {
        ret.push(string.charCodeAt(i));
      }
      return ret;
    }
  },
  stackAlloc: function stackAlloc(size) { var ret = STACKTOP;STACKTOP = (STACKTOP + size)|0;STACKTOP = ((((STACKTOP)+3)>>2)<<2); return ret; },
  staticAlloc: function staticAlloc(size) { var ret = STATICTOP;STATICTOP = (STATICTOP + size)|0;STATICTOP = ((((STATICTOP)+3)>>2)<<2); if (STATICTOP >= TOTAL_MEMORY) enlargeMemory();; return ret; },
  alignMemory: function alignMemory(size,quantum) { var ret = size = Math.ceil((size)/(quantum ? quantum : 4))*(quantum ? quantum : 4); return ret; },
  makeBigInt: function makeBigInt(low,high,unsigned) { var ret = (unsigned ? (((low)>>>0)+(((high)>>>0)*4294967296)) : (((low)>>>0)+(((high)|0)*4294967296))); return ret; },
  QUANTUM_SIZE: 4,
  __dummy__: 0
}



var CorrectionsMonitor = {
  MAX_ALLOWED: 0, // XXX
  corrections: 0,
  sigs: {},

  note: function(type, succeed, sig) {
    if (!succeed) {
      this.corrections++;
      if (this.corrections >= this.MAX_ALLOWED) abort('\n\nToo many corrections!');
    }
  },

  print: function() {
  }
};





//========================================
// Runtime essentials
//========================================

var __THREW__ = 0; // Used in checking for thrown exceptions.
var setjmpId = 1; // Used in setjmp/longjmp
var setjmpLabels = {};

var ABORT = false;

var undef = 0;
// tempInt is used for 32-bit signed values or smaller. tempBigInt is used
// for 32-bit unsigned values or more than 32 bits. TODO: audit all uses of tempInt
var tempValue, tempInt, tempBigInt, tempInt2, tempBigInt2, tempPair, tempBigIntI, tempBigIntR, tempBigIntS, tempBigIntP, tempBigIntD;
var tempI64, tempI64b;
var tempRet0, tempRet1, tempRet2, tempRet3, tempRet4, tempRet5, tempRet6, tempRet7, tempRet8, tempRet9;

function abort(text) {
  Module.print(text + ':\n' + (new Error).stack);
  ABORT = true;
  throw "Assertion: " + text;
}

function assert(condition, text) {
  if (!condition) {
    abort('Assertion failed: ' + text);
  }
}

var globalScope = this;

// C calling interface. A convenient way to call C functions (in C files, or
// defined with extern "C").
//
// Note: LLVM optimizations can inline and remove functions, after which you will not be
//       able to call them. Adding
//
//         __attribute__((used))
//
//       to the function definition will prevent that.
//
// Note: Closure optimizations will minify function names, making
//       functions no longer callable. If you run closure (on by default
//       in -O2 and above), you should export the functions you will call
//       by calling emcc with something like
//
//         -s EXPORTED_FUNCTIONS='["_func1","_func2"]'
//
// @param ident      The name of the C function (note that C++ functions will be name-mangled - use extern "C")
// @param returnType The return type of the function, one of the JS types 'number', 'string' or 'array' (use 'number' for any C pointer, and
//                   'array' for JavaScript arrays and typed arrays).
// @param argTypes   An array of the types of arguments for the function (if there are no arguments, this can be ommitted). Types are as in returnType,
//                   except that 'array' is not possible (there is no way for us to know the length of the array)
// @param args       An array of the arguments to the function, as native JS values (as in returnType)
//                   Note that string arguments will be stored on the stack (the JS string will become a C string on the stack).
// @return           The return value, as a native JS value (as in returnType)
function ccall(ident, returnType, argTypes, args) {
  return ccallFunc(getCFunc(ident), returnType, argTypes, args);
}
Module["ccall"] = ccall;

// Returns the C function with a specified identifier (for C++, you need to do manual name mangling)
function getCFunc(ident) {
  try {
    var func = eval('_' + ident);
  } catch(e) {
    try {
      func = globalScope['Module']['_' + ident]; // closure exported function
    } catch(e) {}
  }
  assert(func, 'Cannot call unknown function ' + ident + ' (perhaps LLVM optimizations or closure removed it?)');
  return func;
}

// Internal function that does a C call using a function, not an identifier
function ccallFunc(func, returnType, argTypes, args) {
  var stack = 0;
  function toC(value, type) {
    if (type == 'string') {
      if (value === null || value === undefined || value === 0) return 0; // null string
      if (!stack) stack = Runtime.stackSave();
      var ret = Runtime.stackAlloc(value.length+1);
      writeStringToMemory(value, ret);
      return ret;
    } else if (type == 'array') {
      if (!stack) stack = Runtime.stackSave();
      var ret = Runtime.stackAlloc(value.length);
      writeArrayToMemory(value, ret);
      return ret;
    }
    return value;
  }
  function fromC(value, type) {
    if (type == 'string') {
      return Pointer_stringify(value);
    }
    assert(type != 'array');
    return value;
  }
  var i = 0;
  var cArgs = args ? args.map(function(arg) {
    return toC(arg, argTypes[i++]);
  }) : [];
  var ret = fromC(func.apply(null, cArgs), returnType);
  if (stack) Runtime.stackRestore(stack);
  return ret;
}

// Returns a native JS wrapper for a C function. This is similar to ccall, but
// returns a function you can call repeatedly in a normal way. For example:
//
//   var my_function = cwrap('my_c_function', 'number', ['number', 'number']);
//   alert(my_function(5, 22));
//   alert(my_function(99, 12));
//
function cwrap(ident, returnType, argTypes) {
  var func = getCFunc(ident);
  return function() {
    return ccallFunc(func, returnType, argTypes, Array.prototype.slice.call(arguments));
  }
}
Module["cwrap"] = cwrap;

// Sets a value in memory in a dynamic way at run-time. Uses the
// type data. This is the same as makeSetValue, except that
// makeSetValue is done at compile-time and generates the needed
// code then, whereas this function picks the right code at
// run-time.
// Note that setValue and getValue only do *aligned* writes and reads!
// Note that ccall uses JS types as for defining types, while setValue and
// getValue need LLVM types ('i8', 'i32') - this is a lower-level operation
function setValue(ptr, value, type, noSafe) {
  type = type || 'i8';
  if (type.charAt(type.length-1) === '*') type = 'i32'; // pointers are 32-bit
    switch(type) {
      case 'i1': HEAP8[(ptr)]=value; break;
      case 'i8': HEAP8[(ptr)]=value; break;
      case 'i16': HEAP16[((ptr)>>1)]=value; break;
      case 'i32': HEAP32[((ptr)>>2)]=value; break;
      case 'i64': (tempI64 = [value>>>0,Math.min(Math.floor((value)/4294967296), 4294967295)],HEAP32[((ptr)>>2)]=tempI64[0],HEAP32[(((ptr)+(4))>>2)]=tempI64[1]); break;
      case 'float': HEAPF32[((ptr)>>2)]=value; break;
      case 'double': (HEAPF64[tempDoublePtr>>3]=value,HEAP32[((ptr)>>2)]=HEAP32[tempDoublePtr>>2],HEAP32[(((ptr)+(4))>>2)]=HEAP32[tempDoublePtr+4>>2]); break;
      default: abort('invalid type for setValue: ' + type);
    }
}
Module['setValue'] = setValue;

// Parallel to setValue.
function getValue(ptr, type, noSafe) {
  type = type || 'i8';
  if (type.charAt(type.length-1) === '*') type = 'i32'; // pointers are 32-bit
    switch(type) {
      case 'i1': return HEAP8[(ptr)];
      case 'i8': return HEAP8[(ptr)];
      case 'i16': return HEAP16[((ptr)>>1)];
      case 'i32': return HEAP32[((ptr)>>2)];
      case 'i64': return HEAP32[((ptr)>>2)];
      case 'float': return HEAPF32[((ptr)>>2)];
      case 'double': return (HEAP32[tempDoublePtr>>2]=HEAP32[((ptr)>>2)],HEAP32[tempDoublePtr+4>>2]=HEAP32[(((ptr)+(4))>>2)],HEAPF64[tempDoublePtr>>3]);
      default: abort('invalid type for setValue: ' + type);
    }
  return null;
}
Module['getValue'] = getValue;

var ALLOC_NORMAL = 0; // Tries to use _malloc()
var ALLOC_STACK = 1; // Lives for the duration of the current function call
var ALLOC_STATIC = 2; // Cannot be freed
var ALLOC_NONE = 3; // Do not allocate
Module['ALLOC_NORMAL'] = ALLOC_NORMAL;
Module['ALLOC_STACK'] = ALLOC_STACK;
Module['ALLOC_STATIC'] = ALLOC_STATIC;
Module['ALLOC_NONE'] = ALLOC_NONE;

// allocate(): This is for internal use. You can use it yourself as well, but the interface
//             is a little tricky (see docs right below). The reason is that it is optimized
//             for multiple syntaxes to save space in generated code. So you should
//             normally not use allocate(), and instead allocate memory using _malloc(),
//             initialize it with setValue(), and so forth.
// @slab: An array of data, or a number. If a number, then the size of the block to allocate,
//        in *bytes* (note that this is sometimes confusing: the next parameter does not
//        affect this!)
// @types: Either an array of types, one for each byte (or 0 if no type at that position),
//         or a single type which is used for the entire block. This only matters if there
//         is initial data - if @slab is a number, then this does not matter at all and is
//         ignored.
// @allocator: How to allocate memory, see ALLOC_*
function allocate(slab, types, allocator, ptr) {
  var zeroinit, size;
  if (typeof slab === 'number') {
    zeroinit = true;
    size = slab;
  } else {
    zeroinit = false;
    size = slab.length;
  }

  var singleType = typeof types === 'string' ? types : null;

  var ret;
  if (allocator == ALLOC_NONE) {
    ret = ptr;
  } else {
    ret = [_malloc, Runtime.stackAlloc, Runtime.staticAlloc][allocator === undefined ? ALLOC_STATIC : allocator](Math.max(size, singleType ? 1 : types.length));
  }

  if (zeroinit) {
      _memset(ret, 0, size);
      return ret;
  }
  
  var i = 0, type;
  while (i < size) {
    var curr = slab[i];

    if (typeof curr === 'function') {
      curr = Runtime.getFunctionIndex(curr);
    }

    type = singleType || types[i];
    if (type === 0) {
      i++;
      continue;
    }

    if (type == 'i64') type = 'i32'; // special case: we have one i32 here, and one i32 later

    setValue(ret+i, curr, type);
    i += Runtime.getNativeTypeSize(type);
  }

  return ret;
}
Module['allocate'] = allocate;

function Pointer_stringify(ptr, /* optional */ length) {
  var utf8 = new Runtime.UTF8Processor();
  var nullTerminated = typeof(length) == "undefined";
  var ret = "";
  var i = 0;
  var t;
  while (1) {
    t = HEAPU8[((ptr)+(i))];
    if (nullTerminated && t == 0) break;
    ret += utf8.processCChar(t);
    i += 1;
    if (!nullTerminated && i == length) break;
  }
  return ret;
}
Module['Pointer_stringify'] = Pointer_stringify;

function Array_stringify(array) {
  var ret = "";
  for (var i = 0; i < array.length; i++) {
    ret += String.fromCharCode(array[i]);
  }
  return ret;
}
Module['Array_stringify'] = Array_stringify;

// Memory management

var PAGE_SIZE = 4096;
function alignMemoryPage(x) {
  return ((x+4095)>>12)<<12;
}

var HEAP;
var HEAP8, HEAPU8, HEAP16, HEAPU16, HEAP32, HEAPU32, HEAPF32, HEAPF64;

var STACK_ROOT, STACKTOP, STACK_MAX;
var STATICTOP;
function enlargeMemory() {
  abort('Cannot enlarge memory arrays. Either (1) compile with -s TOTAL_MEMORY=X with X higher than the current value ( ' + TOTAL_MEMORY + '), (2) compile with ALLOW_MEMORY_GROWTH which adjusts the size at runtime but prevents some optimizations, or (3) set Module.TOTAL_MEMORY before the program runs.');
}

var TOTAL_STACK = Module['TOTAL_STACK'] || 5242880;
var TOTAL_MEMORY = Module['TOTAL_MEMORY'] || 16777216;
var FAST_MEMORY = Module['FAST_MEMORY'] || 2097152;

// Initialize the runtime's memory
// check for full engine support (use string 'subarray' to avoid closure compiler confusion)
  assert(!!Int32Array && !!Float64Array && !!(new Int32Array(1)['subarray']) && !!(new Int32Array(1)['set']),
         'Cannot fallback to non-typed array case: Code is too specialized');

  var buffer = new ArrayBuffer(TOTAL_MEMORY);
  HEAP8 = new Int8Array(buffer);
  HEAP16 = new Int16Array(buffer);
  HEAP32 = new Int32Array(buffer);
  HEAPU8 = new Uint8Array(buffer);
  HEAPU16 = new Uint16Array(buffer);
  HEAPU32 = new Uint32Array(buffer);
  HEAPF32 = new Float32Array(buffer);
  HEAPF64 = new Float64Array(buffer);

  // Endianness check (note: assumes compiler arch was little-endian)
  HEAP32[0] = 255;
  assert(HEAPU8[0] === 255 && HEAPU8[3] === 0, 'Typed arrays 2 must be run on a little-endian system');

Module['HEAP'] = HEAP;
Module['HEAP8'] = HEAP8;
Module['HEAP16'] = HEAP16;
Module['HEAP32'] = HEAP32;
Module['HEAPU8'] = HEAPU8;
Module['HEAPU16'] = HEAPU16;
Module['HEAPU32'] = HEAPU32;
Module['HEAPF32'] = HEAPF32;
Module['HEAPF64'] = HEAPF64;

STACK_ROOT = STACKTOP = Runtime.alignMemory(1);
STACK_MAX = TOTAL_STACK; // we lose a little stack here, but TOTAL_STACK is nice and round so use that as the max

var tempDoublePtr = Runtime.alignMemory(allocate(12, 'i8', ALLOC_STACK), 8);
assert(tempDoublePtr % 8 == 0);
function copyTempFloat(ptr) { // functions, because inlining this code is increases code size too much
  HEAP8[tempDoublePtr] = HEAP8[ptr];
  HEAP8[tempDoublePtr+1] = HEAP8[ptr+1];
  HEAP8[tempDoublePtr+2] = HEAP8[ptr+2];
  HEAP8[tempDoublePtr+3] = HEAP8[ptr+3];
}
function copyTempDouble(ptr) {
  HEAP8[tempDoublePtr] = HEAP8[ptr];
  HEAP8[tempDoublePtr+1] = HEAP8[ptr+1];
  HEAP8[tempDoublePtr+2] = HEAP8[ptr+2];
  HEAP8[tempDoublePtr+3] = HEAP8[ptr+3];
  HEAP8[tempDoublePtr+4] = HEAP8[ptr+4];
  HEAP8[tempDoublePtr+5] = HEAP8[ptr+5];
  HEAP8[tempDoublePtr+6] = HEAP8[ptr+6];
  HEAP8[tempDoublePtr+7] = HEAP8[ptr+7];
}

STATICTOP = STACK_MAX;
assert(STATICTOP < TOTAL_MEMORY); // Stack must fit in TOTAL_MEMORY; allocations from here on may enlarge TOTAL_MEMORY

var nullString = allocate(intArrayFromString('(null)'), 'i8', ALLOC_STACK);

function callRuntimeCallbacks(callbacks) {
  while(callbacks.length > 0) {
    var callback = callbacks.shift();
    var func = callback.func;
    if (typeof func === 'number') {
      if (callback.arg === undefined) {
        Runtime.dynCall('v', func);
      } else {
        Runtime.dynCall('vi', func, [callback.arg]);
      }
    } else {
      func(callback.arg === undefined ? null : callback.arg);
    }
  }
}

var __ATINIT__ = []; // functions called during startup
var __ATMAIN__ = []; // functions called when main() is to be run
var __ATEXIT__ = []; // functions called during shutdown

function initRuntime() {
  callRuntimeCallbacks(__ATINIT__);
}
function preMain() {
  callRuntimeCallbacks(__ATMAIN__);
}
function exitRuntime() {
  callRuntimeCallbacks(__ATEXIT__);

  // Print summary of correction activity
  CorrectionsMonitor.print();
}

function String_len(ptr) {
  var i = ptr;
  while (HEAP8[(i++)]) { // Note: should be |!= 0|, technically. But this helps catch bugs with undefineds
  }
  return i - ptr - 1;
}
Module['String_len'] = String_len;

// Tools

// This processes a JS string into a C-line array of numbers, 0-terminated.
// For LLVM-originating strings, see parser.js:parseLLVMString function
function intArrayFromString(stringy, dontAddNull, length /* optional */) {
  var ret = (new Runtime.UTF8Processor()).processJSString(stringy);
  if (length) {
    ret.length = length;
  }
  if (!dontAddNull) {
    ret.push(0);
  }
  return ret;
}
Module['intArrayFromString'] = intArrayFromString;

function intArrayToString(array) {
  var ret = [];
  for (var i = 0; i < array.length; i++) {
    var chr = array[i];
    if (chr > 0xFF) {
      chr &= 0xFF;
    }
    ret.push(String.fromCharCode(chr));
  }
  return ret.join('');
}
Module['intArrayToString'] = intArrayToString;

// Write a Javascript array to somewhere in the heap
function writeStringToMemory(string, buffer, dontAddNull) {
  var array = intArrayFromString(string, dontAddNull);
  var i = 0;
  while (i < array.length) {
    var chr = array[i];
    HEAP8[((buffer)+(i))]=chr
    i = i + 1;
  }
}
Module['writeStringToMemory'] = writeStringToMemory;

function writeArrayToMemory(array, buffer) {
  for (var i = 0; i < array.length; i++) {
    HEAP8[((buffer)+(i))]=array[i];
  }
}
Module['writeArrayToMemory'] = writeArrayToMemory;

function unSign(value, bits, ignore, sig) {
  if (value >= 0) {
    return value;
  }
  return bits <= 32 ? 2*Math.abs(1 << (bits-1)) + value // Need some trickery, since if bits == 32, we are right at the limit of the bits JS uses in bitshifts
                    : Math.pow(2, bits)         + value;
  // TODO: clean up previous line
}
function reSign(value, bits, ignore, sig) {
  if (value <= 0) {
    return value;
  }
  var half = bits <= 32 ? Math.abs(1 << (bits-1)) // abs is needed if bits == 32
                        : Math.pow(2, bits-1);
  if (value >= half && (bits <= 32 || value > half)) { // for huge values, we can hit the precision limit and always get true here. so don't do that
                                                       // but, in general there is no perfect solution here. With 64-bit ints, we get rounding and errors
                                                       // TODO: In i64 mode 1, resign the two parts separately and safely
    value = -2*half + value; // Cannot bitshift half, as it may be at the limit of the bits JS uses in bitshifts
  }
  return value;
}

// A counter of dependencies for calling run(). If we need to
// do asynchronous work before running, increment this and
// decrement it. Incrementing must happen in a place like
// PRE_RUN_ADDITIONS (used by emcc to add file preloading).
// Note that you can add dependencies in preRun, even though
// it happens right before run - run will be postponed until
// the dependencies are met.
var runDependencies = 0;
var runDependencyTracking = {};
var calledRun = false;
var runDependencyWatcher = null;
function addRunDependency(id) {
  runDependencies++;
  if (Module['monitorRunDependencies']) {
    Module['monitorRunDependencies'](runDependencies);
  }
  if (id) {
    assert(!runDependencyTracking[id]);
    runDependencyTracking[id] = 1;
    if (runDependencyWatcher === null && typeof setInterval !== 'undefined') {
      // Check for missing dependencies every few seconds
      runDependencyWatcher = setInterval(function() {
        var shown = false;
        for (var dep in runDependencyTracking) {
          if (!shown) {
            shown = true;
            Module.printErr('still waiting on run dependencies:');
          }
          Module.printErr('dependency: ' + dep);
        }
        if (shown) {
          Module.printErr('(end of list)');
        }
      }, 6000);
    }
  } else {
    Module.printErr('warning: run dependency added without ID');
  }
}
Module['addRunDependency'] = addRunDependency;
function removeRunDependency(id) {
  runDependencies--;
  if (Module['monitorRunDependencies']) {
    Module['monitorRunDependencies'](runDependencies);
  }
  if (id) {
    assert(runDependencyTracking[id]);
    delete runDependencyTracking[id];
  } else {
    Module.printErr('warning: run dependency removed without ID');
  }
  if (runDependencies == 0) {
    if (runDependencyWatcher !== null) {
      clearInterval(runDependencyWatcher);
      runDependencyWatcher = null;
    } 
    if (!calledRun) run();
  }
}
Module['removeRunDependency'] = removeRunDependency;

Module["preloadedImages"] = {}; // maps url to image data
Module["preloadedAudios"] = {}; // maps url to audio data

// === Body ===



assert(STATICTOP == STACK_MAX); assert(STACK_MAX == TOTAL_STACK);

STATICTOP += 14772;

assert(STATICTOP < TOTAL_MEMORY);

var _stdout;
var _stdin;
var _stderr;




























































allocate([12, 0, 8, 0, 140, 0, 8, 0, 76, 0, 8, 0, 204, 0, 8, 0, 44, 0, 8, 0, 172, 0, 8, 0, 108, 0, 8, 0, 236, 0, 8, 0, 28, 0, 8, 0, 156, 0, 8, 0, 92, 0, 8, 0, 220, 0, 8, 0, 60, 0, 8, 0, 188, 0, 8, 0, 124, 0, 8, 0, 252, 0, 8, 0, 2, 0, 8, 0, 130, 0, 8, 0, 66, 0, 8, 0, 194, 0, 8, 0, 34, 0, 8, 0, 162, 0, 8, 0, 98, 0, 8, 0, 226, 0, 8, 0, 18, 0, 8, 0, 146, 0, 8, 0, 82, 0, 8, 0, 210, 0, 8, 0, 50, 0, 8, 0, 178, 0, 8, 0, 114, 0, 8, 0, 242, 0, 8, 0, 10, 0, 8, 0, 138, 0, 8, 0, 74, 0, 8, 0, 202, 0, 8, 0, 42, 0, 8, 0, 170, 0, 8, 0, 106, 0, 8, 0, 234, 0, 8, 0, 26, 0, 8, 0, 154, 0, 8, 0, 90, 0, 8, 0, 218, 0, 8, 0, 58, 0, 8, 0, 186, 0, 8, 0, 122, 0, 8, 0, 250, 0, 8, 0, 6, 0, 8, 0, 134, 0, 8, 0, 70, 0, 8, 0, 198, 0, 8, 0, 38, 0, 8, 0, 166, 0, 8, 0, 102, 0, 8, 0, 230, 0, 8, 0, 22, 0, 8, 0, 150, 0, 8, 0, 86, 0, 8, 0, 214, 0, 8, 0, 54, 0, 8, 0, 182, 0, 8, 0, 118, 0, 8, 0, 246, 0, 8, 0, 14, 0, 8, 0, 142, 0, 8, 0, 78, 0, 8, 0, 206, 0, 8, 0, 46, 0, 8, 0, 174, 0, 8, 0, 110, 0, 8, 0, 238, 0, 8, 0, 30, 0, 8, 0, 158, 0, 8, 0, 94, 0, 8, 0, 222, 0, 8, 0, 62, 0, 8, 0, 190, 0, 8, 0, 126, 0, 8, 0, 254, 0, 8, 0, 1, 0, 8, 0, 129, 0, 8, 0, 65, 0, 8, 0, 193, 0, 8, 0, 33, 0, 8, 0, 161, 0, 8, 0, 97, 0, 8, 0, 225, 0, 8, 0, 17, 0, 8, 0, 145, 0, 8, 0, 81, 0, 8, 0, 209, 0, 8, 0, 49, 0, 8, 0, 177, 0, 8, 0, 113, 0, 8, 0, 241, 0, 8, 0, 9, 0, 8, 0, 137, 0, 8, 0, 73, 0, 8, 0, 201, 0, 8, 0, 41, 0, 8, 0, 169, 0, 8, 0, 105, 0, 8, 0, 233, 0, 8, 0, 25, 0, 8, 0, 153, 0, 8, 0, 89, 0, 8, 0, 217, 0, 8, 0, 57, 0, 8, 0, 185, 0, 8, 0, 121, 0, 8, 0, 249, 0, 8, 0, 5, 0, 8, 0, 133, 0, 8, 0, 69, 0, 8, 0, 197, 0, 8, 0, 37, 0, 8, 0, 165, 0, 8, 0, 101, 0, 8, 0, 229, 0, 8, 0, 21, 0, 8, 0, 149, 0, 8, 0, 85, 0, 8, 0, 213, 0, 8, 0, 53, 0, 8, 0, 181, 0, 8, 0, 117, 0, 8, 0, 245, 0, 8, 0, 13, 0, 8, 0, 141, 0, 8, 0, 77, 0, 8, 0, 205, 0, 8, 0, 45, 0, 8, 0, 173, 0, 8, 0, 109, 0, 8, 0, 237, 0, 8, 0, 29, 0, 8, 0, 157, 0, 8, 0, 93, 0, 8, 0, 221, 0, 8, 0, 61, 0, 8, 0, 189, 0, 8, 0, 125, 0, 8, 0, 253, 0, 8, 0, 19, 0, 9, 0, 275, 0, 9, 0, 147, 0, 9, 0, 403, 0, 9, 0, 83, 0, 9, 0, 339, 0, 9, 0, 211, 0, 9, 0, 467, 0, 9, 0, 51, 0, 9, 0, 307, 0, 9, 0, 179, 0, 9, 0, 435, 0, 9, 0, 115, 0, 9, 0, 371, 0, 9, 0, 243, 0, 9, 0, 499, 0, 9, 0, 11, 0, 9, 0, 267, 0, 9, 0, 139, 0, 9, 0, 395, 0, 9, 0, 75, 0, 9, 0, 331, 0, 9, 0, 203, 0, 9, 0, 459, 0, 9, 0, 43, 0, 9, 0, 299, 0, 9, 0, 171, 0, 9, 0, 427, 0, 9, 0, 107, 0, 9, 0, 363, 0, 9, 0, 235, 0, 9, 0, 491, 0, 9, 0, 27, 0, 9, 0, 283, 0, 9, 0, 155, 0, 9, 0, 411, 0, 9, 0, 91, 0, 9, 0, 347, 0, 9, 0, 219, 0, 9, 0, 475, 0, 9, 0, 59, 0, 9, 0, 315, 0, 9, 0, 187, 0, 9, 0, 443, 0, 9, 0, 123, 0, 9, 0, 379, 0, 9, 0, 251, 0, 9, 0, 507, 0, 9, 0, 7, 0, 9, 0, 263, 0, 9, 0, 135, 0, 9, 0, 391, 0, 9, 0, 71, 0, 9, 0, 327, 0, 9, 0, 199, 0, 9, 0, 455, 0, 9, 0, 39, 0, 9, 0, 295, 0, 9, 0, 167, 0, 9, 0, 423, 0, 9, 0, 103, 0, 9, 0, 359, 0, 9, 0, 231, 0, 9, 0, 487, 0, 9, 0, 23, 0, 9, 0, 279, 0, 9, 0, 151, 0, 9, 0, 407, 0, 9, 0, 87, 0, 9, 0, 343, 0, 9, 0, 215, 0, 9, 0, 471, 0, 9, 0, 55, 0, 9, 0, 311, 0, 9, 0, 183, 0, 9, 0, 439, 0, 9, 0, 119, 0, 9, 0, 375, 0, 9, 0, 247, 0, 9, 0, 503, 0, 9, 0, 15, 0, 9, 0, 271, 0, 9, 0, 143, 0, 9, 0, 399, 0, 9, 0, 79, 0, 9, 0, 335, 0, 9, 0, 207, 0, 9, 0, 463, 0, 9, 0, 47, 0, 9, 0, 303, 0, 9, 0, 175, 0, 9, 0, 431, 0, 9, 0, 111, 0, 9, 0, 367, 0, 9, 0, 239, 0, 9, 0, 495, 0, 9, 0, 31, 0, 9, 0, 287, 0, 9, 0, 159, 0, 9, 0, 415, 0, 9, 0, 95, 0, 9, 0, 351, 0, 9, 0, 223, 0, 9, 0, 479, 0, 9, 0, 63, 0, 9, 0, 319, 0, 9, 0, 191, 0, 9, 0, 447, 0, 9, 0, 127, 0, 9, 0, 383, 0, 9, 0, 255, 0, 9, 0, 511, 0, 9, 0, 0, 0, 7, 0, 64, 0, 7, 0, 32, 0, 7, 0, 96, 0, 7, 0, 16, 0, 7, 0, 80, 0, 7, 0, 48, 0, 7, 0, 112, 0, 7, 0, 8, 0, 7, 0, 72, 0, 7, 0, 40, 0, 7, 0, 104, 0, 7, 0, 24, 0, 7, 0, 88, 0, 7, 0, 56, 0, 7, 0, 120, 0, 7, 0, 4, 0, 7, 0, 68, 0, 7, 0, 36, 0, 7, 0, 100, 0, 7, 0, 20, 0, 7, 0, 84, 0, 7, 0, 52, 0, 7, 0, 116, 0, 7, 0, 3, 0, 8, 0, 131, 0, 8, 0, 67, 0, 8, 0, 195, 0, 8, 0, 35, 0, 8, 0, 163, 0, 8, 0, 99, 0, 8, 0, 227, 0, 8, 0], ["i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0], ALLOC_NONE, 5242880);
allocate([0, 0, 0, 0, 0, 0, 0, 0, 257, 0, 0, 0, 286, 0, 0, 0, 15, 0, 0, 0], ["*",0,0,0,"*",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0], ALLOC_NONE, 5244032);
allocate([0, 0, 5, 0, 16, 0, 5, 0, 8, 0, 5, 0, 24, 0, 5, 0, 4, 0, 5, 0, 20, 0, 5, 0, 12, 0, 5, 0, 28, 0, 5, 0, 2, 0, 5, 0, 18, 0, 5, 0, 10, 0, 5, 0, 26, 0, 5, 0, 6, 0, 5, 0, 22, 0, 5, 0, 14, 0, 5, 0, 30, 0, 5, 0, 1, 0, 5, 0, 17, 0, 5, 0, 9, 0, 5, 0, 25, 0, 5, 0, 5, 0, 5, 0, 21, 0, 5, 0, 13, 0, 5, 0, 29, 0, 5, 0, 3, 0, 5, 0, 19, 0, 5, 0, 11, 0, 5, 0, 27, 0, 5, 0, 7, 0, 5, 0, 23, 0, 5, 0], ["i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0], ALLOC_NONE, 5244052);
allocate([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 30, 0, 0, 0, 15, 0, 0, 0], ["*",0,0,0,"*",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0], ALLOC_NONE, 5244172);
allocate([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 19, 0, 0, 0, 7, 0, 0, 0], ["*",0,0,0,"*",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0], ALLOC_NONE, 5244192);
allocate(24, "i8", ALLOC_NONE, 5244212);
allocate([16, 0, 16, 0, 16, 0, 16, 0, 16, 0, 16, 0, 16, 0, 16, 0, 17, 0, 17, 0, 17, 0, 17, 0, 18, 0, 18, 0, 18, 0, 18, 0, 19, 0, 19, 0, 19, 0, 19, 0, 20, 0, 20, 0, 20, 0, 20, 0, 21, 0, 21, 0, 21, 0, 21, 0, 16, 0, 78, 0, 68, 0], ["i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0], ALLOC_NONE, 5244236);
allocate([3, 0, 4, 0, 5, 0, 6, 0, 7, 0, 8, 0, 9, 0, 10, 0, 11, 0, 13, 0, 15, 0, 17, 0, 19, 0, 23, 0, 27, 0, 31, 0, 35, 0, 43, 0, 51, 0, 59, 0, 67, 0, 83, 0, 99, 0, 115, 0, 131, 0, 163, 0, 195, 0, 227, 0, 258, 0, 0, 0, 0, 0], ["i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0], ALLOC_NONE, 5244300);
allocate([16, 0, 16, 0, 16, 0, 16, 0, 17, 0, 17, 0, 18, 0, 18, 0, 19, 0, 19, 0, 20, 0, 20, 0, 21, 0, 21, 0, 22, 0, 22, 0, 23, 0, 23, 0, 24, 0, 24, 0, 25, 0, 25, 0, 26, 0, 26, 0, 27, 0, 27, 0, 28, 0, 28, 0, 29, 0, 29, 0, 64, 0, 64, 0], ["i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0], ALLOC_NONE, 5244364);
allocate([1, 0, 2, 0, 3, 0, 4, 0, 5, 0, 7, 0, 9, 0, 13, 0, 17, 0, 25, 0, 33, 0, 49, 0, 65, 0, 97, 0, 129, 0, 193, 0, 257, 0, 385, 0, 513, 0, 769, 0, 1025, 0, 1537, 0, 2049, 0, 3073, 0, 4097, 0, 6145, 0, 8193, 0, 12289, 0, 16385, 0, 24577, 0, 0, 0, 0, 0], ["i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0], ALLOC_NONE, 5244428);
allocate([16, 0, 17, 0, 18, 0, 0, 0, 8, 0, 7, 0, 9, 0, 6, 0, 10, 0, 5, 0, 11, 0, 4, 0, 12, 0, 3, 0, 13, 0, 2, 0, 14, 0, 1, 0, 15, 0], ["i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0,"i16",0], ALLOC_NONE, 5244492);
allocate([96, 7, 0, 0, 0, 8, 80, 0, 0, 8, 16, 0, 20, 8, 115, 0, 18, 7, 31, 0, 0, 8, 112, 0, 0, 8, 48, 0, 0, 9, 192, 0, 16, 7, 10, 0, 0, 8, 96, 0, 0, 8, 32, 0, 0, 9, 160, 0, 0, 8, 0, 0, 0, 8, 128, 0, 0, 8, 64, 0, 0, 9, 224, 0, 16, 7, 6, 0, 0, 8, 88, 0, 0, 8, 24, 0, 0, 9, 144, 0, 19, 7, 59, 0, 0, 8, 120, 0, 0, 8, 56, 0, 0, 9, 208, 0, 17, 7, 17, 0, 0, 8, 104, 0, 0, 8, 40, 0, 0, 9, 176, 0, 0, 8, 8, 0, 0, 8, 136, 0, 0, 8, 72, 0, 0, 9, 240, 0, 16, 7, 4, 0, 0, 8, 84, 0, 0, 8, 20, 0, 21, 8, 227, 0, 19, 7, 43, 0, 0, 8, 116, 0, 0, 8, 52, 0, 0, 9, 200, 0, 17, 7, 13, 0, 0, 8, 100, 0, 0, 8, 36, 0, 0, 9, 168, 0, 0, 8, 4, 0, 0, 8, 132, 0, 0, 8, 68, 0, 0, 9, 232, 0, 16, 7, 8, 0, 0, 8, 92, 0, 0, 8, 28, 0, 0, 9, 152, 0, 20, 7, 83, 0, 0, 8, 124, 0, 0, 8, 60, 0, 0, 9, 216, 0, 18, 7, 23, 0, 0, 8, 108, 0, 0, 8, 44, 0, 0, 9, 184, 0, 0, 8, 12, 0, 0, 8, 140, 0, 0, 8, 76, 0, 0, 9, 248, 0, 16, 7, 3, 0, 0, 8, 82, 0, 0, 8, 18, 0, 21, 8, 163, 0, 19, 7, 35, 0, 0, 8, 114, 0, 0, 8, 50, 0, 0, 9, 196, 0, 17, 7, 11, 0, 0, 8, 98, 0, 0, 8, 34, 0, 0, 9, 164, 0, 0, 8, 2, 0, 0, 8, 130, 0, 0, 8, 66, 0, 0, 9, 228, 0, 16, 7, 7, 0, 0, 8, 90, 0, 0, 8, 26, 0, 0, 9, 148, 0, 20, 7, 67, 0, 0, 8, 122, 0, 0, 8, 58, 0, 0, 9, 212, 0, 18, 7, 19, 0, 0, 8, 106, 0, 0, 8, 42, 0, 0, 9, 180, 0, 0, 8, 10, 0, 0, 8, 138, 0, 0, 8, 74, 0, 0, 9, 244, 0, 16, 7, 5, 0, 0, 8, 86, 0, 0, 8, 22, 0, 64, 8, 0, 0, 19, 7, 51, 0, 0, 8, 118, 0, 0, 8, 54, 0, 0, 9, 204, 0, 17, 7, 15, 0, 0, 8, 102, 0, 0, 8, 38, 0, 0, 9, 172, 0, 0, 8, 6, 0, 0, 8, 134, 0, 0, 8, 70, 0, 0, 9, 236, 0, 16, 7, 9, 0, 0, 8, 94, 0, 0, 8, 30, 0, 0, 9, 156, 0, 20, 7, 99, 0, 0, 8, 126, 0, 0, 8, 62, 0, 0, 9, 220, 0, 18, 7, 27, 0, 0, 8, 110, 0, 0, 8, 46, 0, 0, 9, 188, 0, 0, 8, 14, 0, 0, 8, 142, 0, 0, 8, 78, 0, 0, 9, 252, 0, 96, 7, 0, 0, 0, 8, 81, 0, 0, 8, 17, 0, 21, 8, 131, 0, 18, 7, 31, 0, 0, 8, 113, 0, 0, 8, 49, 0, 0, 9, 194, 0, 16, 7, 10, 0, 0, 8, 97, 0, 0, 8, 33, 0, 0, 9, 162, 0, 0, 8, 1, 0, 0, 8, 129, 0, 0, 8, 65, 0, 0, 9, 226, 0, 16, 7, 6, 0, 0, 8, 89, 0, 0, 8, 25, 0, 0, 9, 146, 0, 19, 7, 59, 0, 0, 8, 121, 0, 0, 8, 57, 0, 0, 9, 210, 0, 17, 7, 17, 0, 0, 8, 105, 0, 0, 8, 41, 0, 0, 9, 178, 0, 0, 8, 9, 0, 0, 8, 137, 0, 0, 8, 73, 0, 0, 9, 242, 0, 16, 7, 4, 0, 0, 8, 85, 0, 0, 8, 21, 0, 16, 8, 258, 0, 19, 7, 43, 0, 0, 8, 117, 0, 0, 8, 53, 0, 0, 9, 202, 0, 17, 7, 13, 0, 0, 8, 101, 0, 0, 8, 37, 0, 0, 9, 170, 0, 0, 8, 5, 0, 0, 8, 133, 0, 0, 8, 69, 0, 0, 9, 234, 0, 16, 7, 8, 0, 0, 8, 93, 0, 0, 8, 29, 0, 0, 9, 154, 0, 20, 7, 83, 0, 0, 8, 125, 0, 0, 8, 61, 0, 0, 9, 218, 0, 18, 7, 23, 0, 0, 8, 109, 0, 0, 8, 45, 0, 0, 9, 186, 0, 0, 8, 13, 0, 0, 8, 141, 0, 0, 8, 77, 0, 0, 9, 250, 0, 16, 7, 3, 0, 0, 8, 83, 0, 0, 8, 19, 0, 21, 8, 195, 0, 19, 7, 35, 0, 0, 8, 115, 0, 0, 8, 51, 0, 0, 9, 198, 0, 17, 7, 11, 0, 0, 8, 99, 0, 0, 8, 35, 0, 0, 9, 166, 0, 0, 8, 3, 0, 0, 8, 131, 0, 0, 8, 67, 0, 0, 9, 230, 0, 16, 7, 7, 0, 0, 8, 91, 0, 0, 8, 27, 0, 0, 9, 150, 0, 20, 7, 67, 0, 0, 8, 123, 0, 0, 8, 59, 0, 0, 9, 214, 0, 18, 7, 19, 0, 0, 8, 107, 0, 0, 8, 43, 0, 0, 9, 182, 0, 0, 8, 11, 0, 0, 8, 139, 0, 0, 8, 75, 0, 0, 9, 246, 0, 16, 7, 5, 0, 0, 8, 87, 0, 0, 8, 23, 0, 64, 8, 0, 0, 19, 7, 51, 0, 0, 8, 119, 0, 0, 8, 55, 0, 0, 9, 206, 0, 17, 7, 15, 0, 0, 8, 103, 0, 0, 8, 39, 0, 0, 9, 174, 0, 0, 8, 7, 0, 0, 8, 135, 0, 0, 8, 71, 0, 0, 9, 238, 0, 16, 7, 9, 0, 0, 8, 95, 0, 0, 8, 31, 0, 0, 9, 158, 0, 20, 7, 99, 0, 0, 8, 127, 0, 0, 8, 63, 0, 0, 9, 222, 0, 18, 7, 27, 0, 0, 8, 111, 0, 0, 8, 47, 0, 0, 9, 190, 0, 0, 8, 15, 0, 0, 8, 143, 0, 0, 8, 79, 0, 0, 9, 254, 0, 96, 7, 0, 0, 0, 8, 80, 0, 0, 8, 16, 0, 20, 8, 115, 0, 18, 7, 31, 0, 0, 8, 112, 0, 0, 8, 48, 0, 0, 9, 193, 0, 16, 7, 10, 0, 0, 8, 96, 0, 0, 8, 32, 0, 0, 9, 161, 0, 0, 8, 0, 0, 0, 8, 128, 0, 0, 8, 64, 0, 0, 9, 225, 0, 16, 7, 6, 0, 0, 8, 88, 0, 0, 8, 24, 0, 0, 9, 145, 0, 19, 7, 59, 0, 0, 8, 120, 0, 0, 8, 56, 0, 0, 9, 209, 0, 17, 7, 17, 0, 0, 8, 104, 0, 0, 8, 40, 0, 0, 9, 177, 0, 0, 8, 8, 0, 0, 8, 136, 0, 0, 8, 72, 0, 0, 9, 241, 0, 16, 7, 4, 0, 0, 8, 84, 0, 0, 8, 20, 0, 21, 8, 227, 0, 19, 7, 43, 0, 0, 8, 116, 0, 0, 8, 52, 0, 0, 9, 201, 0, 17, 7, 13, 0, 0, 8, 100, 0, 0, 8, 36, 0, 0, 9, 169, 0, 0, 8, 4, 0, 0, 8, 132, 0, 0, 8, 68, 0, 0, 9, 233, 0, 16, 7, 8, 0, 0, 8, 92, 0, 0, 8, 28, 0, 0, 9, 153, 0, 20, 7, 83, 0, 0, 8, 124, 0, 0, 8, 60, 0, 0, 9, 217, 0, 18, 7, 23, 0, 0, 8, 108, 0, 0, 8, 44, 0, 0, 9, 185, 0, 0, 8, 12, 0, 0, 8, 140, 0, 0, 8, 76, 0, 0, 9, 249, 0, 16, 7, 3, 0, 0, 8, 82, 0, 0, 8, 18, 0, 21, 8, 163, 0, 19, 7, 35, 0, 0, 8, 114, 0, 0, 8, 50, 0, 0, 9, 197, 0, 17, 7, 11, 0, 0, 8, 98, 0, 0, 8, 34, 0, 0, 9, 165, 0, 0, 8, 2, 0, 0, 8, 130, 0, 0, 8, 66, 0, 0, 9, 229, 0, 16, 7, 7, 0, 0, 8, 90, 0, 0, 8, 26, 0, 0, 9, 149, 0, 20, 7, 67, 0, 0, 8, 122, 0, 0, 8, 58, 0, 0, 9, 213, 0, 18, 7, 19, 0, 0, 8, 106, 0, 0, 8, 42, 0, 0, 9, 181, 0, 0, 8, 10, 0, 0, 8, 138, 0, 0, 8, 74, 0, 0, 9, 245, 0, 16, 7, 5, 0, 0, 8, 86, 0, 0, 8, 22, 0, 64, 8, 0, 0, 19, 7, 51, 0, 0, 8, 118, 0, 0, 8, 54, 0, 0, 9, 205, 0, 17, 7, 15, 0, 0, 8, 102, 0, 0, 8, 38, 0, 0, 9, 173, 0, 0, 8, 6, 0, 0, 8, 134, 0, 0, 8, 70, 0, 0, 9, 237, 0, 16, 7, 9, 0, 0, 8, 94, 0, 0, 8, 30, 0, 0, 9, 157, 0, 20, 7, 99, 0, 0, 8, 126, 0, 0, 8, 62, 0, 0, 9, 221, 0, 18, 7, 27, 0, 0, 8, 110, 0, 0, 8, 46, 0, 0, 9, 189, 0, 0, 8, 14, 0, 0, 8, 142, 0, 0, 8, 78, 0, 0, 9, 253, 0, 96, 7, 0, 0, 0, 8, 81, 0, 0, 8, 17, 0, 21, 8, 131, 0, 18, 7, 31, 0, 0, 8, 113, 0, 0, 8, 49, 0, 0, 9, 195, 0, 16, 7, 10, 0, 0, 8, 97, 0, 0, 8, 33, 0, 0, 9, 163, 0, 0, 8, 1, 0, 0, 8, 129, 0, 0, 8, 65, 0, 0, 9, 227, 0, 16, 7, 6, 0, 0, 8, 89, 0, 0, 8, 25, 0, 0, 9, 147, 0, 19, 7, 59, 0, 0, 8, 121, 0, 0, 8, 57, 0, 0, 9, 211, 0, 17, 7, 17, 0, 0, 8, 105, 0, 0, 8, 41, 0, 0, 9, 179, 0, 0, 8, 9, 0, 0, 8, 137, 0, 0, 8, 73, 0, 0, 9, 243, 0, 16, 7, 4, 0, 0, 8, 85, 0, 0, 8, 21, 0, 16, 8, 258, 0, 19, 7, 43, 0, 0, 8, 117, 0, 0, 8, 53, 0, 0, 9, 203, 0, 17, 7, 13, 0, 0, 8, 101, 0, 0, 8, 37, 0, 0, 9, 171, 0, 0, 8, 5, 0, 0, 8, 133, 0, 0, 8, 69, 0, 0, 9, 235, 0, 16, 7, 8, 0, 0, 8, 93, 0, 0, 8, 29, 0, 0, 9, 155, 0, 20, 7, 83, 0, 0, 8, 125, 0, 0, 8, 61, 0, 0, 9, 219, 0, 18, 7, 23, 0, 0, 8, 109, 0, 0, 8, 45, 0, 0, 9, 187, 0, 0, 8, 13, 0, 0, 8, 141, 0, 0, 8, 77, 0, 0, 9, 251, 0, 16, 7, 3, 0, 0, 8, 83, 0, 0, 8, 19, 0, 21, 8, 195, 0, 19, 7, 35, 0, 0, 8, 115, 0, 0, 8, 51, 0, 0, 9, 199, 0, 17, 7, 11, 0, 0, 8, 99, 0, 0, 8, 35, 0, 0, 9, 167, 0, 0, 8, 3, 0, 0, 8, 131, 0, 0, 8, 67, 0, 0, 9, 231, 0, 16, 7, 7, 0, 0, 8, 91, 0, 0, 8, 27, 0, 0, 9, 151, 0, 20, 7, 67, 0, 0, 8, 123, 0, 0, 8, 59, 0, 0, 9, 215, 0, 18, 7, 19, 0, 0, 8, 107, 0, 0, 8, 43, 0, 0, 9, 183, 0, 0, 8, 11, 0, 0, 8, 139, 0, 0, 8, 75, 0, 0, 9, 247, 0, 16, 7, 5, 0, 0, 8, 87, 0, 0, 8, 23, 0, 64, 8, 0, 0, 19, 7, 51, 0, 0, 8, 119, 0, 0, 8, 55, 0, 0, 9, 207, 0, 17, 7, 15, 0, 0, 8, 103, 0, 0, 8, 39, 0, 0, 9, 175, 0, 0, 8, 7, 0, 0, 8, 135, 0, 0, 8, 71, 0, 0, 9, 239, 0, 16, 7, 9, 0, 0, 8, 95, 0, 0, 8, 31, 0, 0, 9, 159, 0, 20, 7, 99, 0, 0, 8, 127, 0, 0, 8, 63, 0, 0, 9, 223, 0, 18, 7, 27, 0, 0, 8, 111, 0, 0, 8, 47, 0, 0, 9, 191, 0, 0, 8, 15, 0, 0, 8, 143, 0, 0, 8, 79, 0, 0, 9, 255, 0], ["i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0], ALLOC_NONE, 5244532);
allocate([16, 5, 1, 0, 23, 5, 257, 0, 19, 5, 17, 0, 27, 5, 4097, 0, 17, 5, 5, 0, 25, 5, 1025, 0, 21, 5, 65, 0, 29, 5, 16385, 0, 16, 5, 3, 0, 24, 5, 513, 0, 20, 5, 33, 0, 28, 5, 8193, 0, 18, 5, 9, 0, 26, 5, 2049, 0, 22, 5, 129, 0, 64, 5, 0, 0, 16, 5, 2, 0, 23, 5, 385, 0, 19, 5, 25, 0, 27, 5, 6145, 0, 17, 5, 7, 0, 25, 5, 1537, 0, 21, 5, 97, 0, 29, 5, 24577, 0, 16, 5, 4, 0, 24, 5, 769, 0, 20, 5, 49, 0, 28, 5, 12289, 0, 18, 5, 13, 0, 26, 5, 3073, 0, 22, 5, 193, 0, 64, 5, 0, 0], ["i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0,"i8","i8","i16",0], ALLOC_NONE, 5246580);
allocate([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0, 3, 0, 0, 0, 3, 0, 0, 0, 3, 0, 0, 0, 3, 0, 0, 0, 4, 0, 0, 0, 4, 0, 0, 0, 4, 0, 0, 0, 4, 0, 0, 0, 5, 0, 0, 0, 5, 0, 0, 0, 5, 0, 0, 0, 5, 0, 0, 0, 0, 0, 0, 0], ["i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0], ALLOC_NONE, 5246708);
allocate([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0, 3, 0, 0, 0, 3, 0, 0, 0, 4, 0, 0, 0, 4, 0, 0, 0, 5, 0, 0, 0, 5, 0, 0, 0, 6, 0, 0, 0, 6, 0, 0, 0, 7, 0, 0, 0, 7, 0, 0, 0, 8, 0, 0, 0, 8, 0, 0, 0, 9, 0, 0, 0, 9, 0, 0, 0, 10, 0, 0, 0, 10, 0, 0, 0, 11, 0, 0, 0, 11, 0, 0, 0, 12, 0, 0, 0, 12, 0, 0, 0, 13, 0, 0, 0, 13, 0, 0, 0], ["i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0], ALLOC_NONE, 5246824);
allocate([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 3, 0, 0, 0, 7, 0, 0, 0], ["i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0], ALLOC_NONE, 5246944);
allocate([0, 0, 0, 0, 1996959894, 0, 0, 0, -301047508, 0, 0, 0, -1727442502, 0, 0, 0, 124634137, 0, 0, 0, 1886057615, 0, 0, 0, -379345611, 0, 0, 0, -1637575261, 0, 0, 0, 249268274, 0, 0, 0, 2044508324, 0, 0, 0, -522852066, 0, 0, 0, -1747789432, 0, 0, 0, 162941995, 0, 0, 0, 2125561021, 0, 0, 0, -407360249, 0, 0, 0, -1866523247, 0, 0, 0, 498536548, 0, 0, 0, 1789927666, 0, 0, 0, -205950648, 0, 0, 0, -2067906082, 0, 0, 0, 450548861, 0, 0, 0, 1843258603, 0, 0, 0, -187386543, 0, 0, 0, -2083289657, 0, 0, 0, 325883990, 0, 0, 0, 1684777152, 0, 0, 0, -43845254, 0, 0, 0, -1973040660, 0, 0, 0, 335633487, 0, 0, 0, 1661365465, 0, 0, 0, -99664541, 0, 0, 0, -1928851979, 0, 0, 0, 997073096, 0, 0, 0, 1281953886, 0, 0, 0, -715111964, 0, 0, 0, -1570279054, 0, 0, 0, 1006888145, 0, 0, 0, 1258607687, 0, 0, 0, -770865667, 0, 0, 0, -1526024853, 0, 0, 0, 901097722, 0, 0, 0, 1119000684, 0, 0, 0, -608450090, 0, 0, 0, -1396901568, 0, 0, 0, 853044451, 0, 0, 0, 1172266101, 0, 0, 0, -589951537, 0, 0, 0, -1412350631, 0, 0, 0, 651767980, 0, 0, 0, 1373503546, 0, 0, 0, -925412992, 0, 0, 0, -1076862698, 0, 0, 0, 565507253, 0, 0, 0, 1454621731, 0, 0, 0, -809855591, 0, 0, 0, -1195530993, 0, 0, 0, 671266974, 0, 0, 0, 1594198024, 0, 0, 0, -972236366, 0, 0, 0, -1324619484, 0, 0, 0, 795835527, 0, 0, 0, 1483230225, 0, 0, 0, -1050600021, 0, 0, 0, -1234817731, 0, 0, 0, 1994146192, 0, 0, 0, 31158534, 0, 0, 0, -1731059524, 0, 0, 0, -271249366, 0, 0, 0, 1907459465, 0, 0, 0, 112637215, 0, 0, 0, -1614814043, 0, 0, 0, -390540237, 0, 0, 0, 2013776290, 0, 0, 0, 251722036, 0, 0, 0, -1777751922, 0, 0, 0, -519137256, 0, 0, 0, 2137656763, 0, 0, 0, 141376813, 0, 0, 0, -1855689577, 0, 0, 0, -429695999, 0, 0, 0, 1802195444, 0, 0, 0, 476864866, 0, 0, 0, -2056965928, 0, 0, 0, -228458418, 0, 0, 0, 1812370925, 0, 0, 0, 453092731, 0, 0, 0, -2113342271, 0, 0, 0, -183516073, 0, 0, 0, 1706088902, 0, 0, 0, 314042704, 0, 0, 0, -1950435094, 0, 0, 0, -54949764, 0, 0, 0, 1658658271, 0, 0, 0, 366619977, 0, 0, 0, -1932296973, 0, 0, 0, -69972891, 0, 0, 0, 1303535960, 0, 0, 0, 984961486, 0, 0, 0, -1547960204, 0, 0, 0, -725929758, 0, 0, 0, 1256170817, 0, 0, 0, 1037604311, 0, 0, 0, -1529756563, 0, 0, 0, -740887301, 0, 0, 0, 1131014506, 0, 0, 0, 879679996, 0, 0, 0, -1385723834, 0, 0, 0, -631195440, 0, 0, 0, 1141124467, 0, 0, 0, 855842277, 0, 0, 0, -1442165665, 0, 0, 0, -586318647, 0, 0, 0, 1342533948, 0, 0, 0, 654459306, 0, 0, 0, -1106571248, 0, 0, 0, -921952122, 0, 0, 0, 1466479909, 0, 0, 0, 544179635, 0, 0, 0, -1184443383, 0, 0, 0, -832445281, 0, 0, 0, 1591671054, 0, 0, 0, 702138776, 0, 0, 0, -1328506846, 0, 0, 0, -942167884, 0, 0, 0, 1504918807, 0, 0, 0, 783551873, 0, 0, 0, -1212326853, 0, 0, 0, -1061524307, 0, 0, 0, -306674912, 0, 0, 0, -1698712650, 0, 0, 0, 62317068, 0, 0, 0, 1957810842, 0, 0, 0, -355121351, 0, 0, 0, -1647151185, 0, 0, 0, 81470997, 0, 0, 0, 1943803523, 0, 0, 0, -480048366, 0, 0, 0, -1805370492, 0, 0, 0, 225274430, 0, 0, 0, 2053790376, 0, 0, 0, -468791541, 0, 0, 0, -1828061283, 0, 0, 0, 167816743, 0, 0, 0, 2097651377, 0, 0, 0, -267414716, 0, 0, 0, -2029476910, 0, 0, 0, 503444072, 0, 0, 0, 1762050814, 0, 0, 0, -144550051, 0, 0, 0, -2140837941, 0, 0, 0, 426522225, 0, 0, 0, 1852507879, 0, 0, 0, -19653770, 0, 0, 0, -1982649376, 0, 0, 0, 282753626, 0, 0, 0, 1742555852, 0, 0, 0, -105259153, 0, 0, 0, -1900089351, 0, 0, 0, 397917763, 0, 0, 0, 1622183637, 0, 0, 0, -690576408, 0, 0, 0, -1580100738, 0, 0, 0, 953729732, 0, 0, 0, 1340076626, 0, 0, 0, -776247311, 0, 0, 0, -1497606297, 0, 0, 0, 1068828381, 0, 0, 0, 1219638859, 0, 0, 0, -670225446, 0, 0, 0, -1358292148, 0, 0, 0, 906185462, 0, 0, 0, 1090812512, 0, 0, 0, -547295293, 0, 0, 0, -1469587627, 0, 0, 0, 829329135, 0, 0, 0, 1181335161, 0, 0, 0, -882789492, 0, 0, 0, -1134132454, 0, 0, 0, 628085408, 0, 0, 0, 1382605366, 0, 0, 0, -871598187, 0, 0, 0, -1156888829, 0, 0, 0, 570562233, 0, 0, 0, 1426400815, 0, 0, 0, -977650754, 0, 0, 0, -1296233688, 0, 0, 0, 733239954, 0, 0, 0, 1555261956, 0, 0, 0, -1026031705, 0, 0, 0, -1244606671, 0, 0, 0, 752459403, 0, 0, 0, 1541320221, 0, 0, 0, -1687895376, 0, 0, 0, -328994266, 0, 0, 0, 1969922972, 0, 0, 0, 40735498, 0, 0, 0, -1677130071, 0, 0, 0, -351390145, 0, 0, 0, 1913087877, 0, 0, 0, 83908371, 0, 0, 0, -1782625662, 0, 0, 0, -491226604, 0, 0, 0, 2075208622, 0, 0, 0, 213261112, 0, 0, 0, -1831694693, 0, 0, 0, -438977011, 0, 0, 0, 2094854071, 0, 0, 0, 198958881, 0, 0, 0, -2032938284, 0, 0, 0, -237706686, 0, 0, 0, 1759359992, 0, 0, 0, 534414190, 0, 0, 0, -2118248755, 0, 0, 0, -155638181, 0, 0, 0, 1873836001, 0, 0, 0, 414664567, 0, 0, 0, -2012718362, 0, 0, 0, -15766928, 0, 0, 0, 1711684554, 0, 0, 0, 285281116, 0, 0, 0, -1889165569, 0, 0, 0, -127750551, 0, 0, 0, 1634467795, 0, 0, 0, 376229701, 0, 0, 0, -1609899400, 0, 0, 0, -686959890, 0, 0, 0, 1308918612, 0, 0, 0, 956543938, 0, 0, 0, -1486412191, 0, 0, 0, -799009033, 0, 0, 0, 1231636301, 0, 0, 0, 1047427035, 0, 0, 0, -1362007478, 0, 0, 0, -640263460, 0, 0, 0, 1088359270, 0, 0, 0, 936918000, 0, 0, 0, -1447252397, 0, 0, 0, -558129467, 0, 0, 0, 1202900863, 0, 0, 0, 817233897, 0, 0, 0, -1111625188, 0, 0, 0, -893730166, 0, 0, 0, 1404277552, 0, 0, 0, 615818150, 0, 0, 0, -1160759803, 0, 0, 0, -841546093, 0, 0, 0, 1423857449, 0, 0, 0, 601450431, 0, 0, 0, -1285129682, 0, 0, 0, -1000256840, 0, 0, 0, 1567103746, 0, 0, 0, 711928724, 0, 0, 0, -1274298825, 0, 0, 0, -1022587231, 0, 0, 0, 1510334235, 0, 0, 0, 755167117, 0, 0, 0, 0, 0, 0, 0, 421212481, 0, 0, 0, 842424962, 0, 0, 0, 724390851, 0, 0, 0, 1684849924, 0, 0, 0, 2105013317, 0, 0, 0, 1448781702, 0, 0, 0, 1329698503, 0, 0, 0, -925267448, 0, 0, 0, -775767223, 0, 0, 0, -84940662, 0, 0, 0, -470492725, 0, 0, 0, -1397403892, 0, 0, 0, -1246855603, 0, 0, 0, -1635570290, 0, 0, 0, -2020074289, 0, 0, 0, 1254232657, 0, 0, 0, 1406739216, 0, 0, 0, 2029285587, 0, 0, 0, 1643069842, 0, 0, 0, 783210325, 0, 0, 0, 934667796, 0, 0, 0, 479770071, 0, 0, 0, 92505238, 0, 0, 0, -2112120743, 0, 0, 0, -1694455528, 0, 0, 0, -1339163941, 0, 0, 0, -1456026726, 0, 0, 0, -428384931, 0, 0, 0, -9671652, 0, 0, 0, -733921313, 0, 0, 0, -849736034, 0, 0, 0, -1786501982, 0, 0, 0, -1935731229, 0, 0, 0, -1481488864, 0, 0, 0, -1096190111, 0, 0, 0, -236396122, 0, 0, 0, -386674457, 0, 0, 0, -1008827612, 0, 0, 0, -624577947, 0, 0, 0, 1566420650, 0, 0, 0, 1145479147, 0, 0, 0, 1869335592, 0, 0, 0, 1987116393, 0, 0, 0, 959540142, 0, 0, 0, 539646703, 0, 0, 0, 185010476, 0, 0, 0, 303839341, 0, 0, 0, -549046541, 0, 0, 0, -966981710, 0, 0, 0, -311405455, 0, 0, 0, -194288336, 0, 0, 0, -1154812937, 0, 0, 0, -1573797194, 0, 0, 0, -1994616459, 0, 0, 0, -1878548428, 0, 0, 0, 396344571, 0, 0, 0, 243568058, 0, 0, 0, 631889529, 0, 0, 0, 1018359608, 0, 0, 0, 1945336319, 0, 0, 0, 1793607870, 0, 0, 0, 1103436669, 0, 0, 0, 1490954812, 0, 0, 0, -260485371, 0, 0, 0, -379421116, 0, 0, 0, -1034998393, 0, 0, 0, -615244602, 0, 0, 0, -1810527743, 0, 0, 0, -1928414400, 0, 0, 0, -1507596157, 0, 0, 0, -1086793278, 0, 0, 0, 950060301, 0, 0, 0, 565965900, 0, 0, 0, 177645455, 0, 0, 0, 328046286, 0, 0, 0, 1556873225, 0, 0, 0, 1171730760, 0, 0, 0, 1861902987, 0, 0, 0, 2011255754, 0, 0, 0, -1162125996, 0, 0, 0, -1549767659, 0, 0, 0, -2004009002, 0, 0, 0, -1852436841, 0, 0, 0, -556296112, 0, 0, 0, -942888687, 0, 0, 0, -320734510, 0, 0, 0, -168113261, 0, 0, 0, 1919080284, 0, 0, 0, 1803150877, 0, 0, 0, 1079293406, 0, 0, 0, 1498383519, 0, 0, 0, 370020952, 0, 0, 0, 253043481, 0, 0, 0, 607678682, 0, 0, 0, 1025720731, 0, 0, 0, 1711106983, 0, 0, 0, 2095471334, 0, 0, 0, 1472923941, 0, 0, 0, 1322268772, 0, 0, 0, 26324643, 0, 0, 0, 411738082, 0, 0, 0, 866634785, 0, 0, 0, 717028704, 0, 0, 0, -1390091857, 0, 0, 0, -1270886162, 0, 0, 0, -1626176723, 0, 0, 0, -2046184852, 0, 0, 0, -918018901, 0, 0, 0, -799861270, 0, 0, 0, -75610583, 0, 0, 0, -496666776, 0, 0, 0, 792689142, 0, 0, 0, 908347575, 0, 0, 0, 487136116, 0, 0, 0, 68299317, 0, 0, 0, 1263779058, 0, 0, 0, 1380486579, 0, 0, 0, 2036719216, 0, 0, 0, 1618931505, 0, 0, 0, -404294658, 0, 0, 0, -16923969, 0, 0, 0, -707751556, 0, 0, 0, -859070403, 0, 0, 0, -2088093958, 0, 0, 0, -1701771333, 0, 0, 0, -1313057672, 0, 0, 0, -1465424583, 0, 0, 0, 998479947, 0, 0, 0, 580430090, 0, 0, 0, 162921161, 0, 0, 0, 279890824, 0, 0, 0, 1609522511, 0, 0, 0, 1190423566, 0, 0, 0, 1842954189, 0, 0, 0, 1958874764, 0, 0, 0, -212200893, 0, 0, 0, -364829950, 0, 0, 0, -1049857855, 0, 0, 0, -663273088, 0, 0, 0, -1758013625, 0, 0, 0, -1909594618, 0, 0, 0, -1526680123, 0, 0, 0, -1139047292, 0, 0, 0, 1900120602, 0, 0, 0, 1750776667, 0, 0, 0, 1131931800, 0, 0, 0, 1517083097, 0, 0, 0, 355290910, 0, 0, 0, 204897887, 0, 0, 0, 656092572, 0, 0, 0, 1040194781, 0, 0, 0, -1181220846, 0, 0, 0, -1602014893, 0, 0, 0, -1951505776, 0, 0, 0, -1833610287, 0, 0, 0, -571161322, 0, 0, 0, -990907305, 0, 0, 0, -272455788, 0, 0, 0, -153512235, 0, 0, 0, -1375224599, 0, 0, 0, -1222865496, 0, 0, 0, -1674453397, 0, 0, 0, -2060783830, 0, 0, 0, -898926099, 0, 0, 0, -747616084, 0, 0, 0, -128115857, 0, 0, 0, -515495378, 0, 0, 0, 1725839073, 0, 0, 0, 2143618976, 0, 0, 0, 1424512099, 0, 0, 0, 1307796770, 0, 0, 0, 45282277, 0, 0, 0, 464110244, 0, 0, 0, 813994343, 0, 0, 0, 698327078, 0, 0, 0, -456806728, 0, 0, 0, -35741703, 0, 0, 0, -688665542, 0, 0, 0, -806814341, 0, 0, 0, -2136380484, 0, 0, 0, -1716364547, 0, 0, 0, -1298200258, 0, 0, 0, -1417398145, 0, 0, 0, 740041904, 0, 0, 0, 889656817, 0, 0, 0, 506086962, 0, 0, 0, 120682355, 0, 0, 0, 1215357364, 0, 0, 0, 1366020341, 0, 0, 0, 2051441462, 0, 0, 0, 1667084919, 0, 0, 0, -872753330, 0, 0, 0, -756947441, 0, 0, 0, -104024628, 0, 0, 0, -522746739, 0, 0, 0, -1349119414, 0, 0, 0, -1232264437, 0, 0, 0, -1650429752, 0, 0, 0, -2068102775, 0, 0, 0, 52649286, 0, 0, 0, 439905287, 0, 0, 0, 823476164, 0, 0, 0, 672009861, 0, 0, 0, 1733269570, 0, 0, 0, 2119477507, 0, 0, 0, 1434057408, 0, 0, 0, 1281543041, 0, 0, 0, -2126985953, 0, 0, 0, -1742474146, 0, 0, 0, -1290885219, 0, 0, 0, -1441425700, 0, 0, 0, -447479781, 0, 0, 0, -61918886, 0, 0, 0, -681418087, 0, 0, 0, -830909480, 0, 0, 0, 1239502615, 0, 0, 0, 1358593622, 0, 0, 0, 2077699477, 0, 0, 0, 1657543892, 0, 0, 0, 764250643, 0, 0, 0, 882293586, 0, 0, 0, 532408465, 0, 0, 0, 111204816, 0, 0, 0, 1585378284, 0, 0, 0, 1197851309, 0, 0, 0, 1816695150, 0, 0, 0, 1968414767, 0, 0, 0, 974272232, 0, 0, 0, 587794345, 0, 0, 0, 136598634, 0, 0, 0, 289367339, 0, 0, 0, -1767409180, 0, 0, 0, -1883486043, 0, 0, 0, -1533994138, 0, 0, 0, -1115018713, 0, 0, 0, -221528864, 0, 0, 0, -338653791, 0, 0, 0, -1057104286, 0, 0, 0, -639176925, 0, 0, 0, 347922877, 0, 0, 0, 229101820, 0, 0, 0, 646611775, 0, 0, 0, 1066513022, 0, 0, 0, 1892689081, 0, 0, 0, 1774917112, 0, 0, 0, 1122387515, 0, 0, 0, 1543337850, 0, 0, 0, -597333067, 0, 0, 0, -981574924, 0, 0, 0, -296548041, 0, 0, 0, -146261898, 0, 0, 0, -1207325007, 0, 0, 0, -1592614928, 0, 0, 0, -1975530445, 0, 0, 0, -1826292366, 0, 0, 0, 0, 0, 0, 0, 29518391, 0, 0, 0, 59036782, 0, 0, 0, 38190681, 0, 0, 0, 118073564, 0, 0, 0, 114017003, 0, 0, 0, 76381362, 0, 0, 0, 89069189, 0, 0, 0, 236147128, 0, 0, 0, 265370511, 0, 0, 0, 228034006, 0, 0, 0, 206958561, 0, 0, 0, 152762724, 0, 0, 0, 148411219, 0, 0, 0, 178138378, 0, 0, 0, 190596925, 0, 0, 0, 472294256, 0, 0, 0, 501532999, 0, 0, 0, 530741022, 0, 0, 0, 509615401, 0, 0, 0, 456068012, 0, 0, 0, 451764635, 0, 0, 0, 413917122, 0, 0, 0, 426358261, 0, 0, 0, 305525448, 0, 0, 0, 334993663, 0, 0, 0, 296822438, 0, 0, 0, 275991697, 0, 0, 0, 356276756, 0, 0, 0, 352202787, 0, 0, 0, 381193850, 0, 0, 0, 393929805, 0, 0, 0, 944588512, 0, 0, 0, 965684439, 0, 0, 0, 1003065998, 0, 0, 0, 973863097, 0, 0, 0, 1061482044, 0, 0, 0, 1049003019, 0, 0, 0, 1019230802, 0, 0, 0, 1023561829, 0, 0, 0, 912136024, 0, 0, 0, 933002607, 0, 0, 0, 903529270, 0, 0, 0, 874031361, 0, 0, 0, 827834244, 0, 0, 0, 815125939, 0, 0, 0, 852716522, 0, 0, 0, 856752605, 0, 0, 0, 611050896, 0, 0, 0, 631869351, 0, 0, 0, 669987326, 0, 0, 0, 640506825, 0, 0, 0, 593644876, 0, 0, 0, 580921211, 0, 0, 0, 551983394, 0, 0, 0, 556069653, 0, 0, 0, 712553512, 0, 0, 0, 733666847, 0, 0, 0, 704405574, 0, 0, 0, 675154545, 0, 0, 0, 762387700, 0, 0, 0, 749958851, 0, 0, 0, 787859610, 0, 0, 0, 792175277, 0, 0, 0, 1889177024, 0, 0, 0, 1901651959, 0, 0, 0, 1931368878, 0, 0, 0, 1927033753, 0, 0, 0, 2006131996, 0, 0, 0, 1985040171, 0, 0, 0, 1947726194, 0, 0, 0, 1976933189, 0, 0, 0, 2122964088, 0, 0, 0, 2135668303, 0, 0, 0, 2098006038, 0, 0, 0, 2093965857, 0, 0, 0, 2038461604, 0, 0, 0, 2017599123, 0, 0, 0, 2047123658, 0, 0, 0, 2076625661, 0, 0, 0, 1824272048, 0, 0, 0, 1836991623, 0, 0, 0, 1866005214, 0, 0, 0, 1861914857, 0, 0, 0, 1807058540, 0, 0, 0, 1786244187, 0, 0, 0, 1748062722, 0, 0, 0, 1777547317, 0, 0, 0, 1655668488, 0, 0, 0, 1668093247, 0, 0, 0, 1630251878, 0, 0, 0, 1625932113, 0, 0, 0, 1705433044, 0, 0, 0, 1684323811, 0, 0, 0, 1713505210, 0, 0, 0, 1742760333, 0, 0, 0, 1222101792, 0, 0, 0, 1226154263, 0, 0, 0, 1263738702, 0, 0, 0, 1251046777, 0, 0, 0, 1339974652, 0, 0, 0, 1310460363, 0, 0, 0, 1281013650, 0, 0, 0, 1301863845, 0, 0, 0, 1187289752, 0, 0, 0, 1191637167, 0, 0, 0, 1161842422, 0, 0, 0, 1149379777, 0, 0, 0, 1103966788, 0, 0, 0, 1074747507, 0, 0, 0, 1112139306, 0, 0, 0, 1133218845, 0, 0, 0, 1425107024, 0, 0, 0, 1429406311, 0, 0, 0, 1467333694, 0, 0, 0, 1454888457, 0, 0, 0, 1408811148, 0, 0, 0, 1379576507, 0, 0, 0, 1350309090, 0, 0, 0, 1371438805, 0, 0, 0, 1524775400, 0, 0, 0, 1528845279, 0, 0, 0, 1499917702, 0, 0, 0, 1487177649, 0, 0, 0, 1575719220, 0, 0, 0, 1546255107, 0, 0, 0, 1584350554, 0, 0, 0, 1605185389, 0, 0, 0, -516613248, 0, 0, 0, -520654409, 0, 0, 0, -491663378, 0, 0, 0, -478960167, 0, 0, 0, -432229540, 0, 0, 0, -402728597, 0, 0, 0, -440899790, 0, 0, 0, -461763323, 0, 0, 0, -282703304, 0, 0, 0, -287039473, 0, 0, 0, -324886954, 0, 0, 0, -312413087, 0, 0, 0, -399514908, 0, 0, 0, -370308909, 0, 0, 0, -341100918, 0, 0, 0, -362193731, 0, 0, 0, -49039120, 0, 0, 0, -53357881, 0, 0, 0, -23630690, 0, 0, 0, -11204951, 0, 0, 0, -98955220, 0, 0, 0, -69699045, 0, 0, 0, -107035582, 0, 0, 0, -128143755, 0, 0, 0, -218044088, 0, 0, 0, -222133377, 0, 0, 0, -259769050, 0, 0, 0, -247048431, 0, 0, 0, -200719980, 0, 0, 0, -171234397, 0, 0, 0, -141715974, 0, 0, 0, -162529331, 0, 0, 0, -646423200, 0, 0, 0, -658884777, 0, 0, 0, -620984050, 0, 0, 0, -616635591, 0, 0, 0, -562956868, 0, 0, 0, -541876341, 0, 0, 0, -571137582, 0, 0, 0, -600355867, 0, 0, 0, -680850216, 0, 0, 0, -693541137, 0, 0, 0, -722478922, 0, 0, 0, -718425471, 0, 0, 0, -798841852, 0, 0, 0, -777990605, 0, 0, 0, -739872662, 0, 0, 0, -769385891, 0, 0, 0, -983630320, 0, 0, 0, -996371417, 0, 0, 0, -958780802, 0, 0, 0, -954711991, 0, 0, 0, -1034463540, 0, 0, 0, -1013629701, 0, 0, 0, -1043103070, 0, 0, 0, -1072568171, 0, 0, 0, -884101208, 0, 0, 0, -896547425, 0, 0, 0, -926319674, 0, 0, 0, -922021391, 0, 0, 0, -867956876, 0, 0, 0, -846828221, 0, 0, 0, -809446630, 0, 0, 0, -838682323, 0, 0, 0, -1850763712, 0, 0, 0, -1871840137, 0, 0, 0, -1842658770, 0, 0, 0, -1813436391, 0, 0, 0, -1767489892, 0, 0, 0, -1755032405, 0, 0, 0, -1792873742, 0, 0, 0, -1797226299, 0, 0, 0, -1615017992, 0, 0, 0, -1635865137, 0, 0, 0, -1674046570, 0, 0, 0, -1644529247, 0, 0, 0, -1732939996, 0, 0, 0, -1720253165, 0, 0, 0, -1691239606, 0, 0, 0, -1695297155, 0, 0, 0, -1920387792, 0, 0, 0, -1941217529, 0, 0, 0, -1911692962, 0, 0, 0, -1882223767, 0, 0, 0, -1971282452, 0, 0, 0, -1958545445, 0, 0, 0, -1996207742, 0, 0, 0, -2000280651, 0, 0, 0, -2087033720, 0, 0, 0, -2108158273, 0, 0, 0, -2145472282, 0, 0, 0, -2116232495, 0, 0, 0, -2070688684, 0, 0, 0, -2058246557, 0, 0, 0, -2028529606, 0, 0, 0, -2032831987, 0, 0, 0, -1444753248, 0, 0, 0, -1474250089, 0, 0, 0, -1436154674, 0, 0, 0, -1415287047, 0, 0, 0, -1360299908, 0, 0, 0, -1356262837, 0, 0, 0, -1385190382, 0, 0, 0, -1397897691, 0, 0, 0, -1477345000, 0, 0, 0, -1506546897, 0, 0, 0, -1535814282, 0, 0, 0, -1514717375, 0, 0, 0, -1594349116, 0, 0, 0, -1590017037, 0, 0, 0, -1552089686, 0, 0, 0, -1564567651, 0, 0, 0, -1245416496, 0, 0, 0, -1274668569, 0, 0, 0, -1237276738, 0, 0, 0, -1216164471, 0, 0, 0, -1295131892, 0, 0, 0, -1290817221, 0, 0, 0, -1320611998, 0, 0, 0, -1333041835, 0, 0, 0, -1143528856, 0, 0, 0, -1173010337, 0, 0, 0, -1202457082, 0, 0, 0, -1181639631, 0, 0, 0, -1126266188, 0, 0, 0, -1122180989, 0, 0, 0, -1084596518, 0, 0, 0, -1097321235, 0, 0, 0, 0, 0, 0, 0, -1195612315, 0, 0, 0, -1442199413, 0, 0, 0, 313896942, 0, 0, 0, -1889364137, 0, 0, 0, 937357362, 0, 0, 0, 627793884, 0, 0, 0, -1646839623, 0, 0, 0, -978048785, 0, 0, 0, 2097696650, 0, 0, 0, 1874714724, 0, 0, 0, -687765759, 0, 0, 0, 1255587768, 0, 0, 0, -227878691, 0, 0, 0, -522225869, 0, 0, 0, 1482887254, 0, 0, 0, 1343838111, 0, 0, 0, -391827206, 0, 0, 0, -99573996, 0, 0, 0, 1118632049, 0, 0, 0, -545537848, 0, 0, 0, 1741137837, 0, 0, 0, 1970407491, 0, 0, 0, -842109146, 0, 0, 0, -1783791760, 0, 0, 0, 756094997, 0, 0, 0, 1067759611, 0, 0, 0, -2028416866, 0, 0, 0, 449832999, 0, 0, 0, -1569484990, 0, 0, 0, -1329192788, 0, 0, 0, 142231497, 0, 0, 0, -1607291074, 0, 0, 0, 412010587, 0, 0, 0, 171665333, 0, 0, 0, -1299775280, 0, 0, 0, 793786473, 0, 0, 0, -1746116852, 0, 0, 0, -2057703198, 0, 0, 0, 1038456711, 0, 0, 0, 1703315409, 0, 0, 0, -583343948, 0, 0, 0, -812691622, 0, 0, 0, 1999841343, 0, 0, 0, -354152314, 0, 0, 0, 1381529571, 0, 0, 0, 1089329165, 0, 0, 0, -128860312, 0, 0, 0, -265553759, 0, 0, 0, 1217896388, 0, 0, 0, 1512189994, 0, 0, 0, -492939441, 0, 0, 0, 2135519222, 0, 0, 0, -940242797, 0, 0, 0, -717183107, 0, 0, 0, 1845280792, 0, 0, 0, 899665998, 0, 0, 0, -1927039189, 0, 0, 0, -1617553211, 0, 0, 0, 657096608, 0, 0, 0, -1157806311, 0, 0, 0, 37822588, 0, 0, 0, 284462994, 0, 0, 0, -1471616777, 0, 0, 0, -1693165507, 0, 0, 0, 598228824, 0, 0, 0, 824021174, 0, 0, 0, -1985873965, 0, 0, 0, 343330666, 0, 0, 0, -1396004849, 0, 0, 0, -1098971167, 0, 0, 0, 113467524, 0, 0, 0, 1587572946, 0, 0, 0, -434366537, 0, 0, 0, -190203815, 0, 0, 0, 1276501820, 0, 0, 0, -775755899, 0, 0, 0, 1769898208, 0, 0, 0, 2076913422, 0, 0, 0, -1015592853, 0, 0, 0, -888336478, 0, 0, 0, 1941006535, 0, 0, 0, 1627703081, 0, 0, 0, -642211764, 0, 0, 0, 1148164341, 0, 0, 0, -53215344, 0, 0, 0, -295284610, 0, 0, 0, 1457141531, 0, 0, 0, 247015245, 0, 0, 0, -1241169880, 0, 0, 0, -1531908154, 0, 0, 0, 470583459, 0, 0, 0, -2116308966, 0, 0, 0, 963106687, 0, 0, 0, 735213713, 0, 0, 0, -1821499404, 0, 0, 0, 992409347, 0, 0, 0, -2087022490, 0, 0, 0, -1859174520, 0, 0, 0, 697522413, 0, 0, 0, -1270587308, 0, 0, 0, 217581361, 0, 0, 0, 508405983, 0, 0, 0, -1494102086, 0, 0, 0, -23928852, 0, 0, 0, 1177467017, 0, 0, 0, 1419450215, 0, 0, 0, -332959742, 0, 0, 0, 1911572667, 0, 0, 0, -917753890, 0, 0, 0, -604405712, 0, 0, 0, 1665525589, 0, 0, 0, 1799331996, 0, 0, 0, -746338311, 0, 0, 0, -1053399017, 0, 0, 0, 2039091058, 0, 0, 0, -463652917, 0, 0, 0, 1558270126, 0, 0, 0, 1314193216, 0, 0, 0, -152528859, 0, 0, 0, -1366587277, 0, 0, 0, 372764438, 0, 0, 0, 75645176, 0, 0, 0, -1136777315, 0, 0, 0, 568925988, 0, 0, 0, -1722451903, 0, 0, 0, -1948198993, 0, 0, 0, 861712586, 0, 0, 0, -312887749, 0, 0, 0, 1441124702, 0, 0, 0, 1196457648, 0, 0, 0, -1304107, 0, 0, 0, 1648042348, 0, 0, 0, -628668919, 0, 0, 0, -936187417, 0, 0, 0, 1888390786, 0, 0, 0, 686661332, 0, 0, 0, -1873675855, 0, 0, 0, -2098964897, 0, 0, 0, 978858298, 0, 0, 0, -1483798141, 0, 0, 0, 523464422, 0, 0, 0, 226935048, 0, 0, 0, -1254447507, 0, 0, 0, -1119821404, 0, 0, 0, 100435649, 0, 0, 0, 390670639, 0, 0, 0, -1342878134, 0, 0, 0, 841119475, 0, 0, 0, -1969352298, 0, 0, 0, -1741963656, 0, 0, 0, 546822429, 0, 0, 0, 2029308235, 0, 0, 0, -1068978642, 0, 0, 0, -755170880, 0, 0, 0, 1782671013, 0, 0, 0, -141140452, 0, 0, 0, 1328167289, 0, 0, 0, 1570739863, 0, 0, 0, -450629134, 0, 0, 0, 1298864389, 0, 0, 0, -170426784, 0, 0, 0, -412954226, 0, 0, 0, 1608431339, 0, 0, 0, -1039561134, 0, 0, 0, 2058742071, 0, 0, 0, 1744848601, 0, 0, 0, -792976964, 0, 0, 0, -1998638614, 0, 0, 0, 811816591, 0, 0, 0, 584513889, 0, 0, 0, -1704288764, 0, 0, 0, 129869501, 0, 0, 0, -1090403880, 0, 0, 0, -1380684234, 0, 0, 0, 352848211, 0, 0, 0, 494030490, 0, 0, 0, -1513215489, 0, 0, 0, -1216641519, 0, 0, 0, 264757620, 0, 0, 0, -1844389427, 0, 0, 0, 715964072, 0, 0, 0, 941166918, 0, 0, 0, -2136639965, 0, 0, 0, -658086283, 0, 0, 0, 1618608400, 0, 0, 0, 1926213374, 0, 0, 0, -898381413, 0, 0, 0, 1470427426, 0, 0, 0, -283601337, 0, 0, 0, -38979159, 0, 0, 0, 1158766284, 0, 0, 0, 1984818694, 0, 0, 0, -823031453, 0, 0, 0, -599513459, 0, 0, 0, 1693991400, 0, 0, 0, -114329263, 0, 0, 0, 1100160564, 0, 0, 0, 1395044826, 0, 0, 0, -342174017, 0, 0, 0, -1275476247, 0, 0, 0, 189112716, 0, 0, 0, 435162722, 0, 0, 0, -1588827897, 0, 0, 0, 1016811966, 0, 0, 0, -2077804837, 0, 0, 0, -1768777419, 0, 0, 0, 774831696, 0, 0, 0, 643086745, 0, 0, 0, -1628905732, 0, 0, 0, -1940033262, 0, 0, 0, 887166583, 0, 0, 0, -1456066866, 0, 0, 0, 294275499, 0, 0, 0, 54519365, 0, 0, 0, -1149009632, 0, 0, 0, -471821962, 0, 0, 0, 1532818963, 0, 0, 0, 1240029693, 0, 0, 0, -246071656, 0, 0, 0, 1820460577, 0, 0, 0, -734109372, 0, 0, 0, -963916118, 0, 0, 0, 2117577167, 0, 0, 0, -696303304, 0, 0, 0, 1858283101, 0, 0, 0, 2088143283, 0, 0, 0, -993333546, 0, 0, 0, 1495127663, 0, 0, 0, -509497078, 0, 0, 0, -216785180, 0, 0, 0, 1269332353, 0, 0, 0, 332098007, 0, 0, 0, -1418260814, 0, 0, 0, -1178427044, 0, 0, 0, 25085497, 0, 0, 0, -1666580864, 0, 0, 0, 605395429, 0, 0, 0, 916469259, 0, 0, 0, -1910746770, 0, 0, 0, -2040129881, 0, 0, 0, 1054503362, 0, 0, 0, 745528876, 0, 0, 0, -1798063799, 0, 0, 0, 151290352, 0, 0, 0, -1313282411, 0, 0, 0, -1559410309, 0, 0, 0, 464596510, 0, 0, 0, 1137851976, 0, 0, 0, -76654291, 0, 0, 0, -371460413, 0, 0, 0, 1365741990, 0, 0, 0, -860837601, 0, 0, 0, 1946996346, 0, 0, 0, 1723425172, 0, 0, 0, -570095887, 0, 0, 0, 0, 0, 0, 0, -1775237257, 0, 0, 0, 744558318, 0, 0, 0, -1169094247, 0, 0, 0, 432303367, 0, 0, 0, -1879807376, 0, 0, 0, 900031465, 0, 0, 0, -1550490466, 0, 0, 0, 847829774, 0, 0, 0, -1531388807, 0, 0, 0, 518641120, 0, 0, 0, -1998990697, 0, 0, 0, 726447625, 0, 0, 0, -1115901570, 0, 0, 0, 120436967, 0, 0, 0, -1860321392, 0, 0, 0, 1678817053, 0, 0, 0, -232738710, 0, 0, 0, 1215412723, 0, 0, 0, -566116732, 0, 0, 0, 2111101466, 0, 0, 0, -337322643, 0, 0, 0, 1370871028, 0, 0, 0, -947530877, 0, 0, 0, 1452829715, 0, 0, 0, -1062704284, 0, 0, 0, 2063164157, 0, 0, 0, -322345590, 0, 0, 0, 1331429652, 0, 0, 0, -647231901, 0, 0, 0, 1664946170, 0, 0, 0, -183695219, 0, 0, 0, -937398725, 0, 0, 0, 1578133836, 0, 0, 0, -465477419, 0, 0, 0, 1920034722, 0, 0, 0, -773586116, 0, 0, 0, 1205077067, 0, 0, 0, -41611822, 0, 0, 0, 1807026853, 0, 0, 0, -89606859, 0, 0, 0, 1821946434, 0, 0, 0, -691422245, 0, 0, 0, 1090108588, 0, 0, 0, -479406030, 0, 0, 0, 1969020741, 0, 0, 0, -821176612, 0, 0, 0, 1497223595, 0, 0, 0, -1406084826, 0, 0, 0, 973135441, 0, 0, 0, -2142119992, 0, 0, 0, 375509183, 0, 0, 0, -1242254303, 0, 0, 0, 600093526, 0, 0, 0, -1718240561, 0, 0, 0, 262520248, 0, 0, 0, -1632107992, 0, 0, 0, 143131999, 0, 0, 0, -1294398266, 0, 0, 0, 619252657, 0, 0, 0, -2021888209, 0, 0, 0, 290220120, 0, 0, 0, -1424137791, 0, 0, 0, 1026385590, 0, 0, 0, -1874731914, 0, 0, 0, 108124929, 0, 0, 0, -1138699624, 0, 0, 0, 705746415, 0, 0, 0, -1987726991, 0, 0, 0, 532002310, 0, 0, 0, -1511735393, 0, 0, 0, 869578984, 0, 0, 0, -1563883656, 0, 0, 0, 888733711, 0, 0, 0, -1901590122, 0, 0, 0, 412618465, 0, 0, 0, -1156748673, 0, 0, 0, 759000328, 0, 0, 0, -1754504047, 0, 0, 0, 22832102, 0, 0, 0, -195990677, 0, 0, 0, 1650551836, 0, 0, 0, -667916923, 0, 0, 0, 1308648178, 0, 0, 0, -309000596, 0, 0, 0, 2074411291, 0, 0, 0, -1040971646, 0, 0, 0, 1472466933, 0, 0, 0, -958812059, 0, 0, 0, 1357494034, 0, 0, 0, -356991349, 0, 0, 0, 2089335292, 0, 0, 0, -551690910, 0, 0, 0, 1227741717, 0, 0, 0, -209923188, 0, 0, 0, 1699534075, 0, 0, 0, 1482797645, 0, 0, 0, -833505990, 0, 0, 0, 1946205347, 0, 0, 0, -500122668, 0, 0, 0, 1101389642, 0, 0, 0, -678045635, 0, 0, 0, 1841615268, 0, 0, 0, -67840301, 0, 0, 0, 1793681731, 0, 0, 0, -52859340, 0, 0, 0, 1183344557, 0, 0, 0, -793222950, 0, 0, 0, 1932330052, 0, 0, 0, -451083469, 0, 0, 0, 1598818986, 0, 0, 0, -914616867, 0, 0, 0, 1014039888, 0, 0, 0, -1438580185, 0, 0, 0, 269487038, 0, 0, 0, -2044719927, 0, 0, 0, 632645719, 0, 0, 0, -1283100896, 0, 0, 0, 164914873, 0, 0, 0, -1612422706, 0, 0, 0, 251256414, 0, 0, 0, -1731602135, 0, 0, 0, 580440240, 0, 0, 0, -1264003129, 0, 0, 0, 389919577, 0, 0, 0, -2129808338, 0, 0, 0, 995933623, 0, 0, 0, -1385383232, 0, 0, 0, 545503469, 0, 0, 0, -1229733990, 0, 0, 0, 216184323, 0, 0, 0, -1697468044, 0, 0, 0, 961009130, 0, 0, 0, -1351101795, 0, 0, 0, 354867972, 0, 0, 0, -2095653773, 0, 0, 0, 302736355, 0, 0, 0, -2076482412, 0, 0, 0, 1047162125, 0, 0, 0, -1470469510, 0, 0, 0, 198119140, 0, 0, 0, -1644230253, 0, 0, 0, 665714698, 0, 0, 0, -1315043459, 0, 0, 0, 1150488560, 0, 0, 0, -761067385, 0, 0, 0, 1760690462, 0, 0, 0, -20838807, 0, 0, 0, 1566008055, 0, 0, 0, -882416256, 0, 0, 0, 1899392025, 0, 0, 0, -419009682, 0, 0, 0, 1981535486, 0, 0, 0, -533998711, 0, 0, 0, 1518000656, 0, 0, 0, -867508889, 0, 0, 0, 1876933113, 0, 0, 0, -101728626, 0, 0, 0, 1136572183, 0, 0, 0, -712069024, 0, 0, 0, -391915818, 0, 0, 0, 2123616673, 0, 0, 0, -993863624, 0, 0, 0, 1391648591, 0, 0, 0, -244859951, 0, 0, 0, 1733803174, 0, 0, 0, -586762945, 0, 0, 0, 1261875784, 0, 0, 0, -634712616, 0, 0, 0, 1276840623, 0, 0, 0, -162921674, 0, 0, 0, 1618609217, 0, 0, 0, -1007722273, 0, 0, 0, 1440704424, 0, 0, 0, -275878351, 0, 0, 0, 2042521926, 0, 0, 0, -1934401077, 0, 0, 0, 444819132, 0, 0, 0, -1596821723, 0, 0, 0, 920807506, 0, 0, 0, -1787360052, 0, 0, 0, 54987707, 0, 0, 0, -1189739998, 0, 0, 0, 791020885, 0, 0, 0, -1103381819, 0, 0, 0, 671858098, 0, 0, 0, -1839549397, 0, 0, 0, 74101596, 0, 0, 0, -1476405310, 0, 0, 0, 835702965, 0, 0, 0, -1952523988, 0, 0, 0, 497999451, 0, 0, 0, -1329437541, 0, 0, 0, 653419500, 0, 0, 0, -1667011979, 0, 0, 0, 177433858, 0, 0, 0, -1459222116, 0, 0, 0, 1060507371, 0, 0, 0, -2056845454, 0, 0, 0, 324468741, 0, 0, 0, -2109030507, 0, 0, 0, 343587042, 0, 0, 0, -1372868229, 0, 0, 0, 941340172, 0, 0, 0, -1685138798, 0, 0, 0, 230610405, 0, 0, 0, -1209017220, 0, 0, 0, 568318731, 0, 0, 0, -724380794, 0, 0, 0, 1122161905, 0, 0, 0, -122430104, 0, 0, 0, 1854134815, 0, 0, 0, -854147455, 0, 0, 0, 1529264630, 0, 0, 0, -512249745, 0, 0, 0, 2001188632, 0, 0, 0, -430307192, 0, 0, 0, 1885999103, 0, 0, 0, -902101402, 0, 0, 0, 1544225041, 0, 0, 0, -6396529, 0, 0, 0, 1773036280, 0, 0, 0, -738235551, 0, 0, 0, 1171221526, 0, 0, 0, 2028079776, 0, 0, 0, -288223785, 0, 0, 0, 1417872462, 0, 0, 0, -1028455623, 0, 0, 0, 1629906855, 0, 0, 0, -149528368, 0, 0, 0, 1296525641, 0, 0, 0, -612929986, 0, 0, 0, 1248514478, 0, 0, 0, -598026535, 0, 0, 0, 1712054080, 0, 0, 0, -264513481, 0, 0, 0, 1403960489, 0, 0, 0, -979452962, 0, 0, 0, 2144318023, 0, 0, 0, -369117904, 0, 0, 0, 485670333, 0, 0, 0, -1966949686, 0, 0, 0, 814986067, 0, 0, 0, -1499220956, 0, 0, 0, 87478458, 0, 0, 0, -1828268083, 0, 0, 0, 693624404, 0, 0, 0, -1083713245, 0, 0, 0, 779773619, 0, 0, 0, -1203084860, 0, 0, 0, 35350621, 0, 0, 0, -1809092822, 0, 0, 0, 935201716, 0, 0, 0, -1584526141, 0, 0, 0, 467600730, 0, 0, 0, -1913716179, 0, 0, 0, 0, 0, 0, 0, 1093737241, 0, 0, 0, -2107492814, 0, 0, 0, -1017959125, 0, 0, 0, 80047204, 0, 0, 0, 1173649277, 0, 0, 0, -2035852714, 0, 0, 0, -946454193, 0, 0, 0, 143317448, 0, 0, 0, 1237041873, 0, 0, 0, -1964445702, 0, 0, 0, -874908445, 0, 0, 0, 206550444, 0, 0, 0, 1300147893, 0, 0, 0, -1909619810, 0, 0, 0, -820209529, 0, 0, 0, 1360183882, 0, 0, 0, 270784851, 0, 0, 0, -747572104, 0, 0, 0, -1841172639, 0, 0, 0, 1440198190, 0, 0, 0, 350663991, 0, 0, 0, -675964900, 0, 0, 0, -1769700603, 0, 0, 0, 1503140738, 0, 0, 0, 413728923, 0, 0, 0, -604361296, 0, 0, 0, -1697958231, 0, 0, 0, 1566406630, 0, 0, 0, 476867839, 0, 0, 0, -549502508, 0, 0, 0, -1643226419, 0, 0, 0, -1574665067, 0, 0, 0, -485122164, 0, 0, 0, 541504167, 0, 0, 0, 1635232190, 0, 0, 0, -1495144207, 0, 0, 0, -405736472, 0, 0, 0, 612622019, 0, 0, 0, 1706214874, 0, 0, 0, -1431413411, 0, 0, 0, -341883324, 0, 0, 0, 684485487, 0, 0, 0, 1778217078, 0, 0, 0, -1368706759, 0, 0, 0, -279303648, 0, 0, 0, 738789131, 0, 0, 0, 1832393746, 0, 0, 0, -214546721, 0, 0, 0, -1308140090, 0, 0, 0, 1901359341, 0, 0, 0, 811953140, 0, 0, 0, -135058757, 0, 0, 0, -1228787294, 0, 0, 0, 1972444297, 0, 0, 0, 882902928, 0, 0, 0, -71524585, 0, 0, 0, -1165130738, 0, 0, 0, 2044635429, 0, 0, 0, 955232828, 0, 0, 0, -8785037, 0, 0, 0, -1102518166, 0, 0, 0, 2098971969, 0, 0, 0, 1009442392, 0, 0, 0, 89094640, 0, 0, 0, 1149133545, 0, 0, 0, -2027073598, 0, 0, 0, -971221797, 0, 0, 0, 25826708, 0, 0, 0, 1086000781, 0, 0, 0, -2081938522, 0, 0, 0, -1025951553, 0, 0, 0, 231055416, 0, 0, 0, 1291107105, 0, 0, 0, -1884842486, 0, 0, 0, -828994285, 0, 0, 0, 151047260, 0, 0, 0, 1211225925, 0, 0, 0, -1956447634, 0, 0, 0, -900472457, 0, 0, 0, 1415429050, 0, 0, 0, 359440547, 0, 0, 0, -700478072, 0, 0, 0, -1760651631, 0, 0, 0, 1352194014, 0, 0, 0, 296340679, 0, 0, 0, -755310100, 0, 0, 0, -1815348491, 0, 0, 0, 1557619314, 0, 0, 0, 501643627, 0, 0, 0, -558541760, 0, 0, 0, -1618718887, 0, 0, 0, 1477578262, 0, 0, 0, 421729551, 0, 0, 0, -630179804, 0, 0, 0, -1690229955, 0, 0, 0, -1486095003, 0, 0, 0, -430250372, 0, 0, 0, 621398871, 0, 0, 0, 1681444942, 0, 0, 0, -1548840703, 0, 0, 0, -492860904, 0, 0, 0, 567060275, 0, 0, 0, 1627241514, 0, 0, 0, -1344199507, 0, 0, 0, -288342092, 0, 0, 0, 763564703, 0, 0, 0, 1823607174, 0, 0, 0, -1423685431, 0, 0, 0, -367701040, 0, 0, 0, 692485883, 0, 0, 0, 1752655330, 0, 0, 0, -159826129, 0, 0, 0, -1220008906, 0, 0, 0, 1947928861, 0, 0, 0, 891949572, 0, 0, 0, -222538933, 0, 0, 0, -1282586542, 0, 0, 0, 1893623161, 0, 0, 0, 837779040, 0, 0, 0, -17570073, 0, 0, 0, -1077740034, 0, 0, 0, 2089930965, 0, 0, 0, 1033948108, 0, 0, 0, -97088893, 0, 0, 0, -1157131878, 0, 0, 0, 2018819249, 0, 0, 0, 962963368, 0, 0, 0, 1268286267, 0, 0, 0, 178886690, 0, 0, 0, -906316535, 0, 0, 0, -1999917552, 0, 0, 0, 1331556191, 0, 0, 0, 242021446, 0, 0, 0, -851453587, 0, 0, 0, -1945189772, 0, 0, 0, 1125276403, 0, 0, 0, 35865066, 0, 0, 0, -1049596735, 0, 0, 0, -2143193128, 0, 0, 0, 1205286551, 0, 0, 0, 115748238, 0, 0, 0, -977993563, 0, 0, 0, -2071716932, 0, 0, 0, 445268337, 0, 0, 0, 1539005032, 0, 0, 0, -1729595581, 0, 0, 0, -640062374, 0, 0, 0, 508505365, 0, 0, 0, 1602106892, 0, 0, 0, -1674765529, 0, 0, 0, -585367490, 0, 0, 0, 302028985, 0, 0, 0, 1395753888, 0, 0, 0, -1872580981, 0, 0, 0, -783043182, 0, 0, 0, 382072029, 0, 0, 0, 1475669956, 0, 0, 0, -1800944913, 0, 0, 0, -711534090, 0, 0, 0, -373553234, 0, 0, 0, -1467147081, 0, 0, 0, 1809723804, 0, 0, 0, 720317061, 0, 0, 0, -310809654, 0, 0, 0, -1404538669, 0, 0, 0, 1864064504, 0, 0, 0, 774522593, 0, 0, 0, -516497818, 0, 0, 0, -1610103425, 0, 0, 0, 1666508884, 0, 0, 0, 577106765, 0, 0, 0, -437014014, 0, 0, 0, -1530746597, 0, 0, 0, 1737589808, 0, 0, 0, 648060713, 0, 0, 0, -1196505628, 0, 0, 0, -106963203, 0, 0, 0, 986510294, 0, 0, 0, 2080237775, 0, 0, 0, -1133794944, 0, 0, 0, -44387687, 0, 0, 0, 1040818098, 0, 0, 0, 2134410411, 0, 0, 0, -1339810772, 0, 0, 0, -250280139, 0, 0, 0, 843459102, 0, 0, 0, 1937191175, 0, 0, 0, -1260294072, 0, 0, 0, -170890415, 0, 0, 0, 914572922, 0, 0, 0, 2008178019, 0, 0, 0, 1322777291, 0, 0, 0, 266789330, 0, 0, 0, -860500743, 0, 0, 0, -1920673824, 0, 0, 0, 1242732207, 0, 0, 0, 186879414, 0, 0, 0, -932142947, 0, 0, 0, -1992180860, 0, 0, 0, 1180508931, 0, 0, 0, 124532762, 0, 0, 0, -1002498767, 0, 0, 0, -2062676440, 0, 0, 0, 1117278055, 0, 0, 0, 61428862, 0, 0, 0, -1057326763, 0, 0, 0, -2117377460, 0, 0, 0, 533018753, 0, 0, 0, 1593058200, 0, 0, 0, -1649996109, 0, 0, 0, -594143830, 0, 0, 0, 453006565, 0, 0, 0, 1513181180, 0, 0, 0, -1721605417, 0, 0, 0, -665617970, 0, 0, 0, 391110985, 0, 0, 0, 1451162192, 0, 0, 0, -1792157829, 0, 0, 0, -736310174, 0, 0, 0, 327847213, 0, 0, 0, 1388025396, 0, 0, 0, -1847018721, 0, 0, 0, -791044090, 0, 0, 0, -319586722, 0, 0, 0, -1379769017, 0, 0, 0, 1855015020, 0, 0, 0, 799036277, 0, 0, 0, -399109574, 0, 0, 0, -1459156701, 0, 0, 0, 1783899144, 0, 0, 0, 728055569, 0, 0, 0, -461789290, 0, 0, 0, -1521959793, 0, 0, 0, 1713082788, 0, 0, 0, 657099453, 0, 0, 0, -524497934, 0, 0, 0, -1584541461, 0, 0, 0, 1658781120, 0, 0, 0, 602924761, 0, 0, 0, -1109279724, 0, 0, 0, -53434611, 0, 0, 0, 1065585190, 0, 0, 0, 2125631807, 0, 0, 0, -1188769680, 0, 0, 0, -132789399, 0, 0, 0, 994502210, 0, 0, 0, 2054683995, 0, 0, 0, -1251252772, 0, 0, 0, -195395899, 0, 0, 0, 923358190, 0, 0, 0, 1983400183, 0, 0, 0, -1313994312, 0, 0, 0, -258010463, 0, 0, 0, 869023626, 0, 0, 0, 1929192595, 0, 0, 0, 0, 0, 0, 0, 929743361, 0, 0, 0, 1859421187, 0, 0, 0, 1505641986, 0, 0, 0, -592967417, 0, 0, 0, -339555578, 0, 0, 0, -1300460284, 0, 0, 0, -2062135547, 0, 0, 0, -1202646258, 0, 0, 0, -1891905265, 0, 0, 0, -695888115, 0, 0, 0, -504408820, 0, 0, 0, 1694046729, 0, 0, 0, 1402198024, 0, 0, 0, 170761738, 0, 0, 0, 1028086795, 0, 0, 0, 1889740316, 0, 0, 0, 1204413469, 0, 0, 0, 511156767, 0, 0, 0, 689791006, 0, 0, 0, -1408553189, 0, 0, 0, -1688081126, 0, 0, 0, -1025529064, 0, 0, 0, -172660455, 0, 0, 0, -923650798, 0, 0, 0, -6752493, 0, 0, 0, -1507413743, 0, 0, 0, -1857260784, 0, 0, 0, 341457941, 0, 0, 0, 590413332, 0, 0, 0, 2056173590, 0, 0, 0, 1306819095, 0, 0, 0, -532263624, 0, 0, 0, -684945607, 0, 0, 0, -1902982853, 0, 0, 0, -1174926534, 0, 0, 0, 1022247999, 0, 0, 0, 193234494, 0, 0, 0, 1379582012, 0, 0, 0, 1699742269, 0, 0, 0, 1477926454, 0, 0, 0, 1870502967, 0, 0, 0, 918805045, 0, 0, 0, 27858996, 0, 0, 0, -2067835087, 0, 0, 0, -1277848272, 0, 0, 0, -362032334, 0, 0, 0, -587132621, 0, 0, 0, -1864013020, 0, 0, 0, -1483757275, 0, 0, 0, -30281945, 0, 0, 0, -916771546, 0, 0, 0, 1280139811, 0, 0, 0, 2066194466, 0, 0, 0, 580511264, 0, 0, 0, 368256033, 0, 0, 0, 682915882, 0, 0, 0, 534690347, 0, 0, 0, 1180761129, 0, 0, 0, 1896496680, 0, 0, 0, -199462611, 0, 0, 0, -1015631060, 0, 0, 0, -1698106066, 0, 0, 0, -1381877969, 0, 0, 0, -1064461712, 0, 0, 0, -135833487, 0, 0, 0, -1369891213, 0, 0, 0, -1724654478, 0, 0, 0, 472224631, 0, 0, 0, 726618486, 0, 0, 0, 1928402804, 0, 0, 0, 1167840629, 0, 0, 0, 2027719038, 0, 0, 0, 1337346943, 0, 0, 0, 369626493, 0, 0, 0, 560123772, 0, 0, 0, -1535868807, 0, 0, 0, -1826733448, 0, 0, 0, -895482758, 0, 0, 0, -37042565, 0, 0, 0, -1339114388, 0, 0, 0, -2025554323, 0, 0, 0, -554026897, 0, 0, 0, -376374674, 0, 0, 0, 1820767595, 0, 0, 0, 1542223722, 0, 0, 0, 38941032, 0, 0, 0, 892924777, 0, 0, 0, 142585698, 0, 0, 0, 1058368867, 0, 0, 0, 1722493793, 0, 0, 0, 1371662688, 0, 0, 0, -724064667, 0, 0, 0, -474127260, 0, 0, 0, -1174199706, 0, 0, 0, -1922441113, 0, 0, 0, 550229832, 0, 0, 0, 396432713, 0, 0, 0, 1310675787, 0, 0, 0, 2037748042, 0, 0, 0, -60563889, 0, 0, 0, -888595378, 0, 0, 0, -1833477556, 0, 0, 0, -1512204211, 0, 0, 0, -1734687674, 0, 0, 0, -1343224249, 0, 0, 0, -162643899, 0, 0, 0, -1054571964, 0, 0, 0, 1144180033, 0, 0, 0, 1935150912, 0, 0, 0, 719735106, 0, 0, 0, 495749955, 0, 0, 0, 1349054804, 0, 0, 0, 1728197461, 0, 0, 0, 1052538199, 0, 0, 0, 165066582, 0, 0, 0, -1933510573, 0, 0, 0, -1146471854, 0, 0, 0, -501973936, 0, 0, 0, -713114031, 0, 0, 0, -398859686, 0, 0, 0, -548200357, 0, 0, 0, -2031262119, 0, 0, 0, -1316510632, 0, 0, 0, 881978205, 0, 0, 0, 66791772, 0, 0, 0, 1514499934, 0, 0, 0, 1831841119, 0, 0, 0, -2145700383, 0, 0, 0, -1217267744, 0, 0, 0, -288378398, 0, 0, 0, -643468317, 0, 0, 0, 1555250406, 0, 0, 0, 1809448679, 0, 0, 0, 845658341, 0, 0, 0, 84769508, 0, 0, 0, 944383727, 0, 0, 0, 253813998, 0, 0, 0, 1453236972, 0, 0, 0, 1643405549, 0, 0, 0, -454938648, 0, 0, 0, -746000919, 0, 0, 0, -1976128533, 0, 0, 0, -1118017046, 0, 0, 0, -256371715, 0, 0, 0, -942484996, 0, 0, 0, -1637050370, 0, 0, 0, -1459202561, 0, 0, 0, 739252986, 0, 0, 0, 461035771, 0, 0, 0, 1120182009, 0, 0, 0, 1974361336, 0, 0, 0, 1223229683, 0, 0, 0, 2139341554, 0, 0, 0, 641565936, 0, 0, 0, 290932465, 0, 0, 0, -1807676940, 0, 0, 0, -1557410827, 0, 0, 0, -90862089, 0, 0, 0, -838905866, 0, 0, 0, 1616738521, 0, 0, 0, 1463270104, 0, 0, 0, 243924186, 0, 0, 0, 971194075, 0, 0, 0, -1124765218, 0, 0, 0, -1952468001, 0, 0, 0, -769526307, 0, 0, 0, -448055332, 0, 0, 0, -670274601, 0, 0, 0, -278484522, 0, 0, 0, -1227296812, 0, 0, 0, -2119029291, 0, 0, 0, 77882064, 0, 0, 0, 869179601, 0, 0, 0, 1785784019, 0, 0, 0, 1561994450, 0, 0, 0, 285105861, 0, 0, 0, 664050884, 0, 0, 0, 2116737734, 0, 0, 0, 1228937415, 0, 0, 0, -866756670, 0, 0, 0, -79915581, 0, 0, 0, -1568484415, 0, 0, 0, -1779953216, 0, 0, 0, -1464906293, 0, 0, 0, -1614442550, 0, 0, 0, -964965944, 0, 0, 0, -250541111, 0, 0, 0, 1946633420, 0, 0, 0, 1131251405, 0, 0, 0, 450085071, 0, 0, 0, 767099598, 0, 0, 0, 1083617169, 0, 0, 0, 2013031824, 0, 0, 0, 776088466, 0, 0, 0, 422111635, 0, 0, 0, -1673615722, 0, 0, 0, -1420532585, 0, 0, 0, -219536747, 0, 0, 0, -981409644, 0, 0, 0, -121127777, 0, 0, 0, -810713442, 0, 0, 0, -1777125220, 0, 0, 0, -1585841507, 0, 0, 0, 611300760, 0, 0, 0, 319125401, 0, 0, 0, 1253781915, 0, 0, 0, 2110911386, 0, 0, 0, 808814989, 0, 0, 0, 123685772, 0, 0, 0, 1591807374, 0, 0, 0, 1770770319, 0, 0, 0, -325222262, 0, 0, 0, -604552565, 0, 0, 0, -2109143927, 0, 0, 0, -1255946616, 0, 0, 0, -2006672765, 0, 0, 0, -1089578878, 0, 0, 0, -424665472, 0, 0, 0, -774185855, 0, 0, 0, 1422693252, 0, 0, 0, 1671844229, 0, 0, 0, 974657415, 0, 0, 0, 225629574, 0, 0, 0, -1596923223, 0, 0, 0, -1749409624, 0, 0, 0, -838572374, 0, 0, 0, -110189397, 0, 0, 0, 2088299438, 0, 0, 0, 1259481519, 0, 0, 0, 313290669, 0, 0, 0, 633777580, 0, 0, 0, 411169191, 0, 0, 0, 803943334, 0, 0, 0, 1985312164, 0, 0, 0, 1094694821, 0, 0, 0, -1003882336, 0, 0, 0, -213697887, 0, 0, 0, -1426228061, 0, 0, 0, -1650999646, 0, 0, 0, -797719371, 0, 0, 0, -417790284, 0, 0, 0, -1096335178, 0, 0, 0, -1983020361, 0, 0, 0, 215731634, 0, 0, 0, 1001459635, 0, 0, 0, 1645169073, 0, 0, 0, 1432718256, 0, 0, 0, 1747113915, 0, 0, 0, 1598559674, 0, 0, 0, 116806584, 0, 0, 0, 832344505, 0, 0, 0, -1265967428, 0, 0, 0, -2082464579, 0, 0, 0, -631350593, 0, 0, 0, -315320130, 0, 0, 0, 0, 0, 0, 0, 1701297336, 0, 0, 0, -1949824598, 0, 0, 0, -290474734, 0, 0, 0, 1469538959, 0, 0, 0, 854646327, 0, 0, 0, -597726427, 0, 0, 0, -1187457123, 0, 0, 0, -282544955, 0, 0, 0, -1974531971, 0, 0, 0, 1692450159, 0, 0, 0, 25625047, 0, 0, 0, -1195387318, 0, 0, 0, -573019406, 0, 0, 0, 863494112, 0, 0, 0, 1443914584, 0, 0, 0, -1621681840, 0, 0, 0, -97475096, 0, 0, 0, 345968890, 0, 0, 0, 1912122434, 0, 0, 0, -926909473, 0, 0, 0, -1381513369, 0, 0, 0, 1124627061, 0, 0, 0, 644861645, 0, 0, 0, 1887415701, 0, 0, 0, 353898797, 0, 0, 0, -71850945, 0, 0, 0, -1630529401, 0, 0, 0, 669568794, 0, 0, 0, 1116697506, 0, 0, 0, -1407138128, 0, 0, 0, -918062584, 0, 0, 0, 1051669152, 0, 0, 0, 1539870232, 0, 0, 0, -1251525878, 0, 0, 0, -805271630, 0, 0, 0, 1765298223, 0, 0, 0, 207613079, 0, 0, 0, -487564923, 0, 0, 0, -2020088515, 0, 0, 0, -779647387, 0, 0, 0, -1260373283, 0, 0, 0, 1515163599, 0, 0, 0, 1059599223, 0, 0, 0, -2045713174, 0, 0, 0, -478717870, 0, 0, 0, 232320320, 0, 0, 0, 1757368824, 0, 0, 0, -1577571344, 0, 0, 0, -996174008, 0, 0, 0, 707797594, 0, 0, 0, 1331142370, 0, 0, 0, -160478849, 0, 0, 0, -1828129337, 0, 0, 0, 2108113109, 0, 0, 0, 415300717, 0, 0, 0, 1322295093, 0, 0, 0, 733422477, 0, 0, 0, -988244321, 0, 0, 0, -1602278873, 0, 0, 0, 424148410, 0, 0, 0, 2082488578, 0, 0, 0, -1836059632, 0, 0, 0, -135771992, 0, 0, 0, 1029182619, 0, 0, 0, 1480566819, 0, 0, 0, -1232069327, 0, 0, 0, -738745975, 0, 0, 0, 1791981076, 0, 0, 0, 262720172, 0, 0, 0, -519602242, 0, 0, 0, -2074033402, 0, 0, 0, -764370850, 0, 0, 0, -1223222042, 0, 0, 0, 1505274356, 0, 0, 0, 1021252940, 0, 0, 0, -2048408879, 0, 0, 0, -528449943, 0, 0, 0, 238013307, 0, 0, 0, 1799911363, 0, 0, 0, -1576071733, 0, 0, 0, -949440141, 0, 0, 0, 700908641, 0, 0, 0, 1285601497, 0, 0, 0, -174559420, 0, 0, 0, -1862282244, 0, 0, 0, 2119198446, 0, 0, 0, 456645206, 0, 0, 0, 1294448910, 0, 0, 0, 675284406, 0, 0, 0, -957370204, 0, 0, 0, -1551365092, 0, 0, 0, 447798145, 0, 0, 0, 2144823097, 0, 0, 0, -1854352853, 0, 0, 0, -199266669, 0, 0, 0, 66528827, 0, 0, 0, 1720752771, 0, 0, 0, -2009124975, 0, 0, 0, -312962263, 0, 0, 0, 1415595188, 0, 0, 0, 822605836, 0, 0, 0, -542618338, 0, 0, 0, -1160777306, 0, 0, 0, -320892162, 0, 0, 0, -1984418234, 0, 0, 0, 1729600340, 0, 0, 0, 40904684, 0, 0, 0, -1152847759, 0, 0, 0, -567325495, 0, 0, 0, 813758939, 0, 0, 0, 1441219939, 0, 0, 0, -1667219605, 0, 0, 0, -104365101, 0, 0, 0, 392705729, 0, 0, 0, 1913621113, 0, 0, 0, -885563932, 0, 0, 0, -1370431140, 0, 0, 0, 1090475086, 0, 0, 0, 630778102, 0, 0, 0, 1938328494, 0, 0, 0, 384775958, 0, 0, 0, -129990140, 0, 0, 0, -1658372420, 0, 0, 0, 606071073, 0, 0, 0, 1098405273, 0, 0, 0, -1344806773, 0, 0, 0, -894411725, 0, 0, 0, 1001806317, 0, 0, 0, 1590814037, 0, 0, 0, -1333899193, 0, 0, 0, -719721217, 0, 0, 0, 1814117218, 0, 0, 0, 155617242, 0, 0, 0, -404147512, 0, 0, 0, -2104586640, 0, 0, 0, -727782104, 0, 0, 0, -1309060720, 0, 0, 0, 1599530114, 0, 0, 0, 976312378, 0, 0, 0, -2096525401, 0, 0, 0, -428985569, 0, 0, 0, 146900493, 0, 0, 0, 1839610549, 0, 0, 0, -1528741699, 0, 0, 0, -1048118267, 0, 0, 0, 791234839, 0, 0, 0, 1246688687, 0, 0, 0, -210361806, 0, 0, 0, -1777230198, 0, 0, 0, 2025728920, 0, 0, 0, 500799264, 0, 0, 0, 1271526520, 0, 0, 0, 783173824, 0, 0, 0, -1073611310, 0, 0, 0, -1520025238, 0, 0, 0, 475961079, 0, 0, 0, 2033789519, 0, 0, 0, -1751736483, 0, 0, 0, -219077659, 0, 0, 0, 85551949, 0, 0, 0, 1618925557, 0, 0, 0, -1898880281, 0, 0, 0, -340337057, 0, 0, 0, 1385040322, 0, 0, 0, 938063226, 0, 0, 0, -649723800, 0, 0, 0, -1138639664, 0, 0, 0, -365830264, 0, 0, 0, -1890163920, 0, 0, 0, 1643763234, 0, 0, 0, 77490842, 0, 0, 0, -1113146105, 0, 0, 0, -658439745, 0, 0, 0, 913224877, 0, 0, 0, 1393100821, 0, 0, 0, -1706135011, 0, 0, 0, -14037339, 0, 0, 0, 294026167, 0, 0, 0, 1960953615, 0, 0, 0, -841412462, 0, 0, 0, -1463899094, 0, 0, 0, 1175525688, 0, 0, 0, 594978176, 0, 0, 0, 1969669848, 0, 0, 0, 268532320, 0, 0, 0, -22098062, 0, 0, 0, -1681296438, 0, 0, 0, 586261591, 0, 0, 0, 1201019119, 0, 0, 0, -1455837699, 0, 0, 0, -866250427, 0, 0, 0, 116280694, 0, 0, 0, 1669984718, 0, 0, 0, -1926871844, 0, 0, 0, -398329756, 0, 0, 0, 1366896633, 0, 0, 0, 874419009, 0, 0, 0, -625924525, 0, 0, 0, -1076454677, 0, 0, 0, -372835917, 0, 0, 0, -1935588085, 0, 0, 0, 1645146137, 0, 0, 0, 124341409, 0, 0, 0, -1101948100, 0, 0, 0, -617207932, 0, 0, 0, 899256982, 0, 0, 0, 1358835246, 0, 0, 0, -1715907546, 0, 0, 0, -52500322, 0, 0, 0, 309419404, 0, 0, 0, 1997988148, 0, 0, 0, -835832151, 0, 0, 0, -1421243887, 0, 0, 0, 1172717315, 0, 0, 0, 545358779, 0, 0, 0, 1989271779, 0, 0, 0, 334912603, 0, 0, 0, -44439223, 0, 0, 0, -1740745231, 0, 0, 0, 554074732, 0, 0, 0, 1147223764, 0, 0, 0, -1429304378, 0, 0, 0, -810993794, 0, 0, 0, 943816662, 0, 0, 0, 1562821486, 0, 0, 0, -1282836868, 0, 0, 0, -688993596, 0, 0, 0, 1876303193, 0, 0, 0, 179413473, 0, 0, 0, -467790605, 0, 0, 0, -2122733493, 0, 0, 0, -680932589, 0, 0, 0, -1307674709, 0, 0, 0, 1554105017, 0, 0, 0, 969309697, 0, 0, 0, -2130794084, 0, 0, 0, -442952412, 0, 0, 0, 188129334, 0, 0, 0, 1850809486, 0, 0, 0, -1491704186, 0, 0, 0, -1032725954, 0, 0, 0, 752774956, 0, 0, 0, 1236915092, 0, 0, 0, -259980279, 0, 0, 0, -1780041551, 0, 0, 0, 2068385187, 0, 0, 0, 506376475, 0, 0, 0, 1212076611, 0, 0, 0, 760835835, 0, 0, 0, -1007232023, 0, 0, 0, -1500420271, 0, 0, 0, 531214540, 0, 0, 0, 2060323956, 0, 0, 0, -1805534874, 0, 0, 0, -251263522, 0, 0, 0], ["i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0], ALLOC_NONE, 5247020);
allocate([0, 0, 0, 0, 0, 0, 0, 0, 8, 0, 0, 0, 4, 0, 4, 0, 8, 0, 4, 0, 2, 0, 0, 0, 4, 0, 5, 0, 16, 0, 8, 0, 2, 0, 0, 0, 4, 0, 6, 0, 32, 0, 32, 0, 2, 0, 0, 0, 4, 0, 4, 0, 16, 0, 16, 0, 6, 0, 0, 0, 8, 0, 16, 0, 32, 0, 32, 0, 6, 0, 0, 0, 8, 0, 16, 0, 128, 0, 128, 0, 6, 0, 0, 0, 8, 0, 32, 0, 128, 0, 256, 0, 6, 0, 0, 0, 32, 0, 128, 0, 258, 0, 1024, 0, 6, 0, 0, 0, 32, 0, 258, 0, 258, 0, 4096, 0, 6, 0, 0, 0], ["i16",0,"i16",0,"i16",0,"i16",0,"*",0,0,0,"i16",0,"i16",0,"i16",0,"i16",0,"*",0,0,0,"i16",0,"i16",0,"i16",0,"i16",0,"*",0,0,0,"i16",0,"i16",0,"i16",0,"i16",0,"*",0,0,0,"i16",0,"i16",0,"i16",0,"i16",0,"*",0,0,0,"i16",0,"i16",0,"i16",0,"i16",0,"*",0,0,0,"i16",0,"i16",0,"i16",0,"i16",0,"*",0,0,0,"i16",0,"i16",0,"i16",0,"i16",0,"*",0,0,0,"i16",0,"i16",0,"i16",0,"i16",0,"*",0,0,0,"i16",0,"i16",0,"i16",0,"i16",0,"*",0,0,0], ALLOC_NONE, 5255212);
allocate([16,17,18,0,8,7,9,6,10,5,11,4,12,3,13,2,14,1,15] /* \10\11\12\00\08\07\0 */, "i8", ALLOC_NONE, 5255332);
allocate([0, 0, 0, 0, 1, 0, 0, 0, 2, 0, 0, 0, 3, 0, 0, 0, 4, 0, 0, 0, 5, 0, 0, 0, 6, 0, 0, 0, 7, 0, 0, 0, 8, 0, 0, 0, 10, 0, 0, 0, 12, 0, 0, 0, 14, 0, 0, 0, 16, 0, 0, 0, 20, 0, 0, 0, 24, 0, 0, 0, 28, 0, 0, 0, 32, 0, 0, 0, 40, 0, 0, 0, 48, 0, 0, 0, 56, 0, 0, 0, 64, 0, 0, 0, 80, 0, 0, 0, 96, 0, 0, 0, 112, 0, 0, 0, 128, 0, 0, 0, 160, 0, 0, 0, 192, 0, 0, 0, 224, 0, 0, 0, 0, 0, 0, 0], ["i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0], ALLOC_NONE, 5255352);
allocate([0, 0, 0, 0, 1, 0, 0, 0, 2, 0, 0, 0, 3, 0, 0, 0, 4, 0, 0, 0, 6, 0, 0, 0, 8, 0, 0, 0, 12, 0, 0, 0, 16, 0, 0, 0, 24, 0, 0, 0, 32, 0, 0, 0, 48, 0, 0, 0, 64, 0, 0, 0, 96, 0, 0, 0, 128, 0, 0, 0, 192, 0, 0, 0, 256, 0, 0, 0, 384, 0, 0, 0, 512, 0, 0, 0, 768, 0, 0, 0, 1024, 0, 0, 0, 1536, 0, 0, 0, 2048, 0, 0, 0, 3072, 0, 0, 0, 4096, 0, 0, 0, 6144, 0, 0, 0, 8192, 0, 0, 0, 12288, 0, 0, 0, 16384, 0, 0, 0, 24576, 0, 0, 0], ["i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0], ALLOC_NONE, 5255468);
allocate([105,110,118,97,108,105,100,32,99,111,100,101,32,108,101,110,103,116,104,115,32,115,101,116,0] /* invalid code lengths */, "i8", ALLOC_NONE, 5255588);
allocate([105,110,118,97,108,105,100,32,111,114,32,105,110,99,111,109,112,108,101,116,101,32,100,101,102,108,97,116,101,32,100,97,116,97,10,0] /* invalid or incomplet */, "i8", ALLOC_NONE, 5255616);
allocate([116,111,111,32,109,97,110,121,32,108,101,110,103,116,104,32,111,114,32,100,105,115,116,97,110,99,101,32,115,121,109,98,111,108,115,0] /* too many length or d */, "i8", ALLOC_NONE, 5255652);
allocate([105,110,118,97,108,105,100,32,99,111,109,112,114,101,115,115,105,111,110,32,108,101,118,101,108,10,0] /* invalid compression  */, "i8", ALLOC_NONE, 5255688);
allocate([98,117,102,102,101,114,32,101,114,114,111,114,0] /* buffer error\00 */, "i8", ALLOC_NONE, 5255716);
allocate([105,110,118,97,108,105,100,32,115,116,111,114,101,100,32,98,108,111,99,107,32,108,101,110,103,116,104,115,0] /* invalid stored block */, "i8", ALLOC_NONE, 5255732);
allocate([105,110,118,97,108,105,100,32,100,105,115,116,97,110,99,101,32,116,111,111,32,102,97,114,32,98,97,99,107,0] /* invalid distance too */, "i8", ALLOC_NONE, 5255764);
allocate([101,114,114,111,114,32,119,114,105,116,105,110,103,32,115,116,100,111,117,116,10,0] /* error writing stdout */, "i8", ALLOC_NONE, 5255796);
allocate([105,110,115,117,102,102,105,99,105,101,110,116,32,109,101,109,111,114,121,0] /* insufficient memory\ */, "i8", ALLOC_NONE, 5255820);
allocate([105,110,118,97,108,105,100,32,98,108,111,99,107,32,116,121,112,101,0] /* invalid block type\0 */, "i8", ALLOC_NONE, 5255840);
allocate([101,114,114,111,114,32,114,101,97,100,105,110,103,32,115,116,100,105,110,10,0] /* error reading stdin\ */, "i8", ALLOC_NONE, 5255860);
allocate([104,101,97,100,101,114,32,99,114,99,32,109,105,115,109,97,116,99,104,0] /* header crc mismatch\ */, "i8", ALLOC_NONE, 5255884);
allocate([122,112,105,112,101,58,32,0] /* zpipe: \00 */, "i8", ALLOC_NONE, 5255904);
allocate([115,116,114,101,97,109,32,101,114,114,111,114,0] /* stream error\00 */, "i8", ALLOC_NONE, 5255912);
allocate([117,110,107,110,111,119,110,32,104,101,97,100,101,114,32,102,108,97,103,115,32,115,101,116,0] /* unknown header flags */, "i8", ALLOC_NONE, 5255928);
allocate([114,101,116,32,61,61,32,90,95,83,84,82,69,65,77,95,69,78,68,0] /* ret == Z_STREAM_END\ */, "i8", ALLOC_NONE, 5255956);
allocate([105,110,118,97,108,105,100,32,119,105,110,100,111,119,32,115,105,122,101,0] /* invalid window size\ */, "i8", ALLOC_NONE, 5255976);
allocate([115,116,114,109,46,97,118,97,105,108,95,105,110,32,61,61,32,48,0] /* strm.avail_in == 0\0 */, "i8", ALLOC_NONE, 5255996);
allocate([105,110,118,97,108,105,100,32,108,105,116,101,114,97,108,47,108,101,110,103,116,104,32,99,111,100,101,0] /* invalid literal/leng */, "i8", ALLOC_NONE, 5256016);
allocate([117,110,107,110,111,119,110,32,99,111,109,112,114,101,115,115,105,111,110,32,109,101,116,104,111,100,0] /* unknown compression  */, "i8", ALLOC_NONE, 5256044);
allocate([114,101,116,32,33,61,32,90,95,83,84,82,69,65,77,95,69,82,82,79,82,0] /* ret != Z_STREAM_ERRO */, "i8", ALLOC_NONE, 5256072);
allocate([105,110,99,111,114,114,101,99,116,32,108,101,110,103,116,104,32,99,104,101,99,107,0] /* incorrect length che */, "i8", ALLOC_NONE, 5256096);
allocate([105,110,118,97,108,105,100,32,100,105,115,116,97,110,99,101,32,99,111,100,101,0] /* invalid distance cod */, "i8", ALLOC_NONE, 5256120);
allocate([105,110,99,111,114,114,101,99,116,32,100,97,116,97,32,99,104,101,99,107,0] /* incorrect data check */, "i8", ALLOC_NONE, 5256144);
allocate([105,110,118,97,108,105,100,32,100,105,115,116,97,110,99,101,115,32,115,101,116,0] /* invalid distances se */, "i8", ALLOC_NONE, 5256168);
allocate([122,112,105,112,101,32,117,115,97,103,101,58,32,122,112,105,112,101,32,91,45,100,93,32,60,32,115,111,117,114,99,101,32,62,32,100,101,115,116,10,0] /* zpipe usage: zpipe [ */, "i8", ALLOC_NONE, 5256192);
allocate([105,110,118,97,108,105,100,32,108,105,116,101,114,97,108,47,108,101,110,103,116,104,115,32,115,101,116,0] /* invalid literal/leng */, "i8", ALLOC_NONE, 5256236);
allocate([45,100,0] /* -d\00 */, "i8", ALLOC_NONE, 5256264);
allocate([105,110,99,111,114,114,101,99,116,32,104,101,97,100,101,114,32,99,104,101,99,107,0] /* incorrect header che */, "i8", ALLOC_NONE, 5256268);
allocate([105,110,118,97,108,105,100,32,99,111,100,101,32,45,45,32,109,105,115,115,105,110,103,32,101,110,100,45,111,102,45,98,108,111,99,107,0] /* invalid code -- miss */, "i8", ALLOC_NONE, 5256292);
allocate([122,108,105,98,32,118,101,114,115,105,111,110,32,109,105,115,109,97,116,99,104,33,10,0] /* zlib version mismatc */, "i8", ALLOC_NONE, 5256332);
allocate([105,110,118,97,108,105,100,32,98,105,116,32,108,101,110,103,116,104,32,114,101,112,101,97,116,0] /* invalid bit length r */, "i8", ALLOC_NONE, 5256356);
allocate([111,117,116,32,111,102,32,109,101,109,111,114,121,10,0] /* out of memory\0A\00 */, "i8", ALLOC_NONE, 5256384);
allocate([122,112,105,112,101,46,99,0] /* zpipe.c\00 */, "i8", ALLOC_NONE, 5256400);
allocate([0,1,2,3,4,5,6,7,8,8,9,9,10,10,11,11,12,12,12,12,13,13,13,13,14,14,14,14,15,15,15,15,16,16,16,16,16,16,16,16,17,17,17,17,17,17,17,17,18,18,18,18,18,18,18,18,19,19,19,19,19,19,19,19,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,21,21,21,21,21,21,21,21,21,21,21,21,21,21,21,21,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,23,23,23,23,23,23,23,23,23,23,23,23,23,23,23,23,24,24,24,24,24,24,24,24,24,24,24,24,24,24,24,24,24,24,24,24,24,24,24,24,24,24,24,24,24,24,24,24,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,27,27,27,27,27,27,27,27,27,27,27,27,27,27,27,27,27,27,27,27,27,27,27,27,27,27,27,27,27,27,27,28] /* \00\01\02\03\04\05\0 */, "i8", ALLOC_NONE, 5256408);
allocate(468, "i8", ALLOC_NONE, 5256664);
allocate([0,1,2,3,4,4,5,5,6,6,6,6,7,7,7,7,8,8,8,8,8,8,8,8,9,9,9,9,9,9,9,9,10,10,10,10,10,10,10,10,10,10,10,10,10,10,10,10,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,0,0,16,17,18,18,19,19,20,20,20,20,21,21,21,21,22,22,22,22,22,22,22,22,23,23,23,23,23,23,23,23,24,24,24,24,24,24,24,24,24,24,24,24,24,24,24,24,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,27,27,27,27,27,27,27,27,27,27,27,27,27,27,27,27,27,27,27,27,27,27,27,27,27,27,27,27,27,27,27,27,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29] /* \00\01\02\03\04\04\0 */, "i8", ALLOC_NONE, 5257132);
allocate([105,110,102,0] /* inf\00 */, "i8", ALLOC_NONE, 5257644);
allocate([100,101,102,0] /* def\00 */, "i8", ALLOC_NONE, 5257648);
HEAP32[((5244032)>>2)]=((5242880)|0);
HEAP32[((5244036)>>2)]=((5246708)|0);
HEAP32[((5244172)>>2)]=((5244052)|0);
HEAP32[((5244176)>>2)]=((5246824)|0);
HEAP32[((5244196)>>2)]=((5246944)|0);

  
  
  var ERRNO_CODES={E2BIG:7,EACCES:13,EADDRINUSE:98,EADDRNOTAVAIL:99,EAFNOSUPPORT:97,EAGAIN:11,EALREADY:114,EBADF:9,EBADMSG:74,EBUSY:16,ECANCELED:125,ECHILD:10,ECONNABORTED:103,ECONNREFUSED:111,ECONNRESET:104,EDEADLK:35,EDESTADDRREQ:89,EDOM:33,EDQUOT:122,EEXIST:17,EFAULT:14,EFBIG:27,EHOSTUNREACH:113,EIDRM:43,EILSEQ:84,EINPROGRESS:115,EINTR:4,EINVAL:22,EIO:5,EISCONN:106,EISDIR:21,ELOOP:40,EMFILE:24,EMLINK:31,EMSGSIZE:90,EMULTIHOP:72,ENAMETOOLONG:36,ENETDOWN:100,ENETRESET:102,ENETUNREACH:101,ENFILE:23,ENOBUFS:105,ENODATA:61,ENODEV:19,ENOENT:2,ENOEXEC:8,ENOLCK:37,ENOLINK:67,ENOMEM:12,ENOMSG:42,ENOPROTOOPT:92,ENOSPC:28,ENOSR:63,ENOSTR:60,ENOSYS:38,ENOTCONN:107,ENOTDIR:20,ENOTEMPTY:39,ENOTRECOVERABLE:131,ENOTSOCK:88,ENOTSUP:95,ENOTTY:25,ENXIO:6,EOVERFLOW:75,EOWNERDEAD:130,EPERM:1,EPIPE:32,EPROTO:71,EPROTONOSUPPORT:93,EPROTOTYPE:91,ERANGE:34,EROFS:30,ESPIPE:29,ESRCH:3,ESTALE:116,ETIME:62,ETIMEDOUT:110,ETXTBSY:26,EWOULDBLOCK:11,EXDEV:18};
  
  function ___setErrNo(value) {
      // For convenient setting and returning of errno.
      if (!___setErrNo.ret) ___setErrNo.ret = allocate([0], 'i32', ALLOC_STATIC);
      HEAP32[((___setErrNo.ret)>>2)]=value
      return value;
    }
  
  var _stdin=allocate(1, "i32*", ALLOC_STACK);
  
  var _stdout=allocate(1, "i32*", ALLOC_STACK);
  
  var _stderr=allocate(1, "i32*", ALLOC_STACK);
  
  var __impure_ptr=allocate(1, "i32*", ALLOC_STACK);var FS={currentPath:"/",nextInode:2,streams:[null],ignorePermissions:true,joinPath:function (parts, forceRelative) {
        var ret = parts[0];
        for (var i = 1; i < parts.length; i++) {
          if (ret[ret.length-1] != '/') ret += '/';
          ret += parts[i];
        }
        if (forceRelative && ret[0] == '/') ret = ret.substr(1);
        return ret;
      },absolutePath:function (relative, base) {
        if (typeof relative !== 'string') return null;
        if (base === undefined) base = FS.currentPath;
        if (relative && relative[0] == '/') base = '';
        var full = base + '/' + relative;
        var parts = full.split('/').reverse();
        var absolute = [''];
        while (parts.length) {
          var part = parts.pop();
          if (part == '' || part == '.') {
            // Nothing.
          } else if (part == '..') {
            if (absolute.length > 1) absolute.pop();
          } else {
            absolute.push(part);
          }
        }
        return absolute.length == 1 ? '/' : absolute.join('/');
      },analyzePath:function (path, dontResolveLastLink, linksVisited) {
        var ret = {
          isRoot: false,
          exists: false,
          error: 0,
          name: null,
          path: null,
          object: null,
          parentExists: false,
          parentPath: null,
          parentObject: null
        };
        path = FS.absolutePath(path);
        if (path == '/') {
          ret.isRoot = true;
          ret.exists = ret.parentExists = true;
          ret.name = '/';
          ret.path = ret.parentPath = '/';
          ret.object = ret.parentObject = FS.root;
        } else if (path !== null) {
          linksVisited = linksVisited || 0;
          path = path.slice(1).split('/');
          var current = FS.root;
          var traversed = [''];
          while (path.length) {
            if (path.length == 1 && current.isFolder) {
              ret.parentExists = true;
              ret.parentPath = traversed.length == 1 ? '/' : traversed.join('/');
              ret.parentObject = current;
              ret.name = path[0];
            }
            var target = path.shift();
            if (!current.isFolder) {
              ret.error = ERRNO_CODES.ENOTDIR;
              break;
            } else if (!current.read) {
              ret.error = ERRNO_CODES.EACCES;
              break;
            } else if (!current.contents.hasOwnProperty(target)) {
              ret.error = ERRNO_CODES.ENOENT;
              break;
            }
            current = current.contents[target];
            if (current.link && !(dontResolveLastLink && path.length == 0)) {
              if (linksVisited > 40) { // Usual Linux SYMLOOP_MAX.
                ret.error = ERRNO_CODES.ELOOP;
                break;
              }
              var link = FS.absolutePath(current.link, traversed.join('/'));
              ret = FS.analyzePath([link].concat(path).join('/'),
                                   dontResolveLastLink, linksVisited + 1);
              return ret;
            }
            traversed.push(target);
            if (path.length == 0) {
              ret.exists = true;
              ret.path = traversed.join('/');
              ret.object = current;
            }
          }
        }
        return ret;
      },findObject:function (path, dontResolveLastLink) {
        FS.ensureRoot();
        var ret = FS.analyzePath(path, dontResolveLastLink);
        if (ret.exists) {
          return ret.object;
        } else {
          ___setErrNo(ret.error);
          return null;
        }
      },createObject:function (parent, name, properties, canRead, canWrite) {
        if (!parent) parent = '/';
        if (typeof parent === 'string') parent = FS.findObject(parent);
  
        if (!parent) {
          ___setErrNo(ERRNO_CODES.EACCES);
          throw new Error('Parent path must exist.');
        }
        if (!parent.isFolder) {
          ___setErrNo(ERRNO_CODES.ENOTDIR);
          throw new Error('Parent must be a folder.');
        }
        if (!parent.write && !FS.ignorePermissions) {
          ___setErrNo(ERRNO_CODES.EACCES);
          throw new Error('Parent folder must be writeable.');
        }
        if (!name || name == '.' || name == '..') {
          ___setErrNo(ERRNO_CODES.ENOENT);
          throw new Error('Name must not be empty.');
        }
        if (parent.contents.hasOwnProperty(name)) {
          ___setErrNo(ERRNO_CODES.EEXIST);
          throw new Error("Can't overwrite object.");
        }
  
        parent.contents[name] = {
          read: canRead === undefined ? true : canRead,
          write: canWrite === undefined ? false : canWrite,
          timestamp: Date.now(),
          inodeNumber: FS.nextInode++
        };
        for (var key in properties) {
          if (properties.hasOwnProperty(key)) {
            parent.contents[name][key] = properties[key];
          }
        }
  
        return parent.contents[name];
      },createFolder:function (parent, name, canRead, canWrite) {
        var properties = {isFolder: true, isDevice: false, contents: {}};
        return FS.createObject(parent, name, properties, canRead, canWrite);
      },createPath:function (parent, path, canRead, canWrite) {
        var current = FS.findObject(parent);
        if (current === null) throw new Error('Invalid parent.');
        path = path.split('/').reverse();
        while (path.length) {
          var part = path.pop();
          if (!part) continue;
          if (!current.contents.hasOwnProperty(part)) {
            FS.createFolder(current, part, canRead, canWrite);
          }
          current = current.contents[part];
        }
        return current;
      },createFile:function (parent, name, properties, canRead, canWrite) {
        properties.isFolder = false;
        return FS.createObject(parent, name, properties, canRead, canWrite);
      },createDataFile:function (parent, name, data, canRead, canWrite) {
        if (typeof data === 'string') {
          var dataArray = new Array(data.length);
          for (var i = 0, len = data.length; i < len; ++i) dataArray[i] = data.charCodeAt(i);
          data = dataArray;
        }
        var properties = {
          isDevice: false,
          contents: data.subarray ? data.subarray(0) : data // as an optimization, create a new array wrapper (not buffer) here, to help JS engines understand this object
        };
        return FS.createFile(parent, name, properties, canRead, canWrite);
      },createLazyFile:function (parent, name, url, canRead, canWrite) {
  
        if (typeof XMLHttpRequest !== 'undefined') {
          if (!ENVIRONMENT_IS_WORKER) throw 'Cannot do synchronous binary XHRs outside webworkers in modern browsers. Use --embed-file or --preload-file in emcc';
          // Lazy chunked Uint8Array (implements get and length from Uint8Array). Actual getting is abstracted away for eventual reuse.
          var LazyUint8Array = function(chunkSize, length) {
            this.length = length;
            this.chunkSize = chunkSize;
            this.chunks = []; // Loaded chunks. Index is the chunk number
          }
          LazyUint8Array.prototype.get = function(idx) {
            if (idx > this.length-1 || idx < 0) {
              return undefined;
            }
            var chunkOffset = idx % chunkSize;
            var chunkNum = Math.floor(idx / chunkSize);
            return this.getter(chunkNum)[chunkOffset];
          }
          LazyUint8Array.prototype.setDataGetter = function(getter) {
            this.getter = getter;
          }
    
          // Find length
          var xhr = new XMLHttpRequest();
          xhr.open('HEAD', url, false);
          xhr.send(null);
          if (!(xhr.status >= 200 && xhr.status < 300 || xhr.status === 304)) throw new Error("Couldn't load " + url + ". Status: " + xhr.status);
          var datalength = Number(xhr.getResponseHeader("Content-length"));
          var header;
          var hasByteServing = (header = xhr.getResponseHeader("Accept-Ranges")) && header === "bytes";
          var chunkSize = 1024*1024; // Chunk size in bytes
          if (!hasByteServing) chunkSize = datalength;
    
          // Function to get a range from the remote URL.
          var doXHR = (function(from, to) {
            if (from > to) throw new Error("invalid range (" + from + ", " + to + ") or no bytes requested!");
            if (to > datalength-1) throw new Error("only " + datalength + " bytes available! programmer error!");
    
            // TODO: Use mozResponseArrayBuffer, responseStream, etc. if available.
            var xhr = new XMLHttpRequest();
            xhr.open('GET', url, false);
            if (datalength !== chunkSize) xhr.setRequestHeader("Range", "bytes=" + from + "-" + to);
    
            // Some hints to the browser that we want binary data.
            if (typeof Uint8Array != 'undefined') xhr.responseType = 'arraybuffer';
            if (xhr.overrideMimeType) {
              xhr.overrideMimeType('text/plain; charset=x-user-defined');
            }
    
            xhr.send(null);
            if (!(xhr.status >= 200 && xhr.status < 300 || xhr.status === 304)) throw new Error("Couldn't load " + url + ". Status: " + xhr.status);
            if (xhr.response !== undefined) {
              return new Uint8Array(xhr.response || []);
            } else {
              return intArrayFromString(xhr.responseText || '', true);
            }
          });
    
          var lazyArray = new LazyUint8Array(chunkSize, datalength);
          lazyArray.setDataGetter(function(chunkNum) {
            var start = chunkNum * lazyArray.chunkSize;
            var end = (chunkNum+1) * lazyArray.chunkSize - 1; // including this byte
            end = Math.min(end, datalength-1); // if datalength-1 is selected, this is the last block
            if (typeof(lazyArray.chunks[chunkNum]) === "undefined") {
              lazyArray.chunks[chunkNum] = doXHR(start, end);
            }
            if (typeof(lazyArray.chunks[chunkNum]) === "undefined") throw new Error("doXHR failed!");
            return lazyArray.chunks[chunkNum];
          });
          var properties = { isDevice: false, contents: lazyArray };
        } else {
          var properties = { isDevice: false, url: url };
        }
  
        return FS.createFile(parent, name, properties, canRead, canWrite);
      },createPreloadedFile:function (parent, name, url, canRead, canWrite, onload, onerror, dontCreateFile) {
        Browser.ensureObjects();
        var fullname = FS.joinPath([parent, name], true);
        function processData(byteArray) {
          function finish(byteArray) {
            if (!dontCreateFile) {
              FS.createDataFile(parent, name, byteArray, canRead, canWrite);
            }
            if (onload) onload();
            removeRunDependency('cp ' + fullname);
          }
          var handled = false;
          Module['preloadPlugins'].forEach(function(plugin) {
            if (handled) return;
            if (plugin['canHandle'](fullname)) {
              plugin['handle'](byteArray, fullname, finish, function() {
                if (onerror) onerror();
                removeRunDependency('cp ' + fullname);
              });
              handled = true;
            }
          });
          if (!handled) finish(byteArray);
        }
        addRunDependency('cp ' + fullname);
        if (typeof url == 'string') {
          Browser.asyncLoad(url, function(byteArray) {
            processData(byteArray);
          }, onerror);
        } else {
          processData(url);
        }
      },createLink:function (parent, name, target, canRead, canWrite) {
        var properties = {isDevice: false, link: target};
        return FS.createFile(parent, name, properties, canRead, canWrite);
      },createDevice:function (parent, name, input, output) {
        if (!(input || output)) {
          throw new Error('A device must have at least one callback defined.');
        }
        var ops = {isDevice: true, input: input, output: output};
        return FS.createFile(parent, name, ops, Boolean(input), Boolean(output));
      },forceLoadFile:function (obj) {
        if (obj.isDevice || obj.isFolder || obj.link || obj.contents) return true;
        var success = true;
        if (typeof XMLHttpRequest !== 'undefined') {
          throw new Error("Lazy loading should have been performed (contents set) in createLazyFile, but it was not. Lazy loading only works in web workers. Use --embed-file or --preload-file in emcc on the main thread.");
        } else if (Module['read']) {
          // Command-line.
          try {
            // WARNING: Can't read binary files in V8's d8 or tracemonkey's js, as
            //          read() will try to parse UTF8.
            obj.contents = intArrayFromString(Module['read'](obj.url), true);
          } catch (e) {
            success = false;
          }
        } else {
          throw new Error('Cannot load without read() or XMLHttpRequest.');
        }
        if (!success) ___setErrNo(ERRNO_CODES.EIO);
        return success;
      },ensureRoot:function () {
        if (FS.root) return;
        // The main file system tree. All the contents are inside this.
        FS.root = {
          read: true,
          write: true,
          isFolder: true,
          isDevice: false,
          timestamp: Date.now(),
          inodeNumber: 1,
          contents: {}
        };
      },init:function (input, output, error) {
        // Make sure we initialize only once.
        assert(!FS.init.initialized, 'FS.init was previously called. If you want to initialize later with custom parameters, remove any earlier calls (note that one is automatically added to the generated code)');
        FS.init.initialized = true;
  
        FS.ensureRoot();
  
        // Allow Module.stdin etc. to provide defaults, if none explicitly passed to us here
        input = input || Module['stdin'];
        output = output || Module['stdout'];
        error = error || Module['stderr'];
  
        // Default handlers.
        var stdinOverridden = true, stdoutOverridden = true, stderrOverridden = true;
        if (!input) {
          stdinOverridden = false;
          input = function() {
            if (!input.cache || !input.cache.length) {
              var result;
              if (typeof window != 'undefined' &&
                  typeof window.prompt == 'function') {
                // Browser.
                result = window.prompt('Input: ');
                if (result === null) result = String.fromCharCode(0); // cancel ==> EOF
              } else if (typeof readline == 'function') {
                // Command line.
                result = readline();
              }
              if (!result) result = '';
              input.cache = intArrayFromString(result + '\n', true);
            }
            return input.cache.shift();
          };
        }
        var utf8 = new Runtime.UTF8Processor();
        function simpleOutput(val) {
          if (val === null || val === '\n'.charCodeAt(0)) {
            output.printer(output.buffer.join(''));
            output.buffer = [];
          } else {
            output.buffer.push(utf8.processCChar(val));
          }
        }
        if (!output) {
          stdoutOverridden = false;
          output = simpleOutput;
        }
        if (!output.printer) output.printer = Module['print'];
        if (!output.buffer) output.buffer = [];
        if (!error) {
          stderrOverridden = false;
          error = simpleOutput;
        }
        if (!error.printer) error.printer = Module['print'];
        if (!error.buffer) error.buffer = [];
  
        // Create the temporary folder, if not already created
        try {
          FS.createFolder('/', 'tmp', true, true);
        } catch(e) {}
  
        // Create the I/O devices.
        var devFolder = FS.createFolder('/', 'dev', true, true);
        var stdin = FS.createDevice(devFolder, 'stdin', input);
        var stdout = FS.createDevice(devFolder, 'stdout', null, output);
        var stderr = FS.createDevice(devFolder, 'stderr', null, error);
        FS.createDevice(devFolder, 'tty', input, output);
  
        // Create default streams.
        FS.streams[1] = {
          path: '/dev/stdin',
          object: stdin,
          position: 0,
          isRead: true,
          isWrite: false,
          isAppend: false,
          isTerminal: !stdinOverridden,
          error: false,
          eof: false,
          ungotten: []
        };
        FS.streams[2] = {
          path: '/dev/stdout',
          object: stdout,
          position: 0,
          isRead: false,
          isWrite: true,
          isAppend: false,
          isTerminal: !stdoutOverridden,
          error: false,
          eof: false,
          ungotten: []
        };
        FS.streams[3] = {
          path: '/dev/stderr',
          object: stderr,
          position: 0,
          isRead: false,
          isWrite: true,
          isAppend: false,
          isTerminal: !stderrOverridden,
          error: false,
          eof: false,
          ungotten: []
        };
        assert(Math.max(_stdin, _stdout, _stderr) < 128); // make sure these are low, we flatten arrays with these
        HEAP32[((_stdin)>>2)]=1;
        HEAP32[((_stdout)>>2)]=2;
        HEAP32[((_stderr)>>2)]=3;
  
        // Other system paths
        FS.createPath('/', 'dev/shm/tmp', true, true); // temp files
  
        // Newlib initialization
        for (var i = FS.streams.length; i < Math.max(_stdin, _stdout, _stderr) + 4; i++) {
          FS.streams[i] = null; // Make sure to keep FS.streams dense
        }
        FS.streams[_stdin] = FS.streams[1];
        FS.streams[_stdout] = FS.streams[2];
        FS.streams[_stderr] = FS.streams[3];
        allocate([ allocate(
          [0, 0, 0, 0, _stdin, 0, 0, 0, _stdout, 0, 0, 0, _stderr, 0, 0, 0],
          'void*', ALLOC_STATIC) ], 'void*', ALLOC_NONE, __impure_ptr);
      },quit:function () {
        if (!FS.init.initialized) return;
        // Flush any partially-printed lines in stdout and stderr. Careful, they may have been closed
        if (FS.streams[2] && FS.streams[2].object.output.buffer.length > 0) FS.streams[2].object.output('\n'.charCodeAt(0));
        if (FS.streams[3] && FS.streams[3].object.output.buffer.length > 0) FS.streams[3].object.output('\n'.charCodeAt(0));
      },standardizePath:function (path) {
        if (path.substr(0, 2) == './') path = path.substr(2);
        return path;
      },deleteFile:function (path) {
        path = FS.analyzePath(path);
        if (!path.parentExists || !path.exists) {
          throw 'Invalid path ' + path;
        }
        delete path.parentObject.contents[path.name];
      }};
  
  
  function _pread(fildes, buf, nbyte, offset) {
      // ssize_t pread(int fildes, void *buf, size_t nbyte, off_t offset);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/read.html
      var stream = FS.streams[fildes];
      if (!stream || stream.object.isDevice) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      } else if (!stream.isRead) {
        ___setErrNo(ERRNO_CODES.EACCES);
        return -1;
      } else if (stream.object.isFolder) {
        ___setErrNo(ERRNO_CODES.EISDIR);
        return -1;
      } else if (nbyte < 0 || offset < 0) {
        ___setErrNo(ERRNO_CODES.EINVAL);
        return -1;
      } else {
        var bytesRead = 0;
        while (stream.ungotten.length && nbyte > 0) {
          HEAP8[(buf++)]=stream.ungotten.pop()
          nbyte--;
          bytesRead++;
        }
        var contents = stream.object.contents;
        var size = Math.min(contents.length - offset, nbyte);
        if (contents.subarray || contents.slice) { // typed array or normal array
          for (var i = 0; i < size; i++) {
            HEAP8[((buf)+(i))]=contents[offset + i]
          }
        } else {
          for (var i = 0; i < size; i++) { // LazyUint8Array from sync binary XHR
            HEAP8[((buf)+(i))]=contents.get(offset + i)
          }
        }
        bytesRead += size;
        return bytesRead;
      }
    }function _read(fildes, buf, nbyte) {
      // ssize_t read(int fildes, void *buf, size_t nbyte);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/read.html
      var stream = FS.streams[fildes];
      if (!stream) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      } else if (!stream.isRead) {
        ___setErrNo(ERRNO_CODES.EACCES);
        return -1;
      } else if (nbyte < 0) {
        ___setErrNo(ERRNO_CODES.EINVAL);
        return -1;
      } else {
        var bytesRead;
        if (stream.object.isDevice) {
          if (stream.object.input) {
            bytesRead = 0;
            while (stream.ungotten.length && nbyte > 0) {
              HEAP8[(buf++)]=stream.ungotten.pop()
              nbyte--;
              bytesRead++;
            }
            for (var i = 0; i < nbyte; i++) {
              try {
                var result = stream.object.input();
              } catch (e) {
                ___setErrNo(ERRNO_CODES.EIO);
                return -1;
              }
              if (result === null || result === undefined) break;
              bytesRead++;
              HEAP8[((buf)+(i))]=result
            }
            return bytesRead;
          } else {
            ___setErrNo(ERRNO_CODES.ENXIO);
            return -1;
          }
        } else {
          var ungotSize = stream.ungotten.length;
          bytesRead = _pread(fildes, buf, nbyte, stream.position);
          if (bytesRead != -1) {
            stream.position += (stream.ungotten.length - ungotSize) + bytesRead;
          }
          return bytesRead;
        }
      }
    }function _fread(ptr, size, nitems, stream) {
      // size_t fread(void *restrict ptr, size_t size, size_t nitems, FILE *restrict stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fread.html
      var bytesToRead = nitems * size;
      if (bytesToRead == 0) return 0;
      var bytesRead = _read(stream, ptr, bytesToRead);
      var streamObj = FS.streams[stream];
      if (bytesRead == -1) {
        if (streamObj) streamObj.error = true;
        return 0;
      } else {
        if (bytesRead < bytesToRead) streamObj.eof = true;
        return Math.floor(bytesRead / size);
      }
    }

  function _ferror(stream) {
      // int ferror(FILE *stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/ferror.html
      return Number(FS.streams[stream] && FS.streams[stream].error);
    }

  function _feof(stream) {
      // int feof(FILE *stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/feof.html
      return Number(FS.streams[stream] && FS.streams[stream].eof);
    }

  function ___assert_func(filename, line, func, condition) {
      throw 'Assertion failed: ' + (condition ? Pointer_stringify(condition) : 'unknown condition') + ', at: ' + [filename ? Pointer_stringify(filename) : 'unknown filename', line, func ? Pointer_stringify(func) : 'unknown function'] + ' at ' + new Error().stack;
    }

  
  
  function _pwrite(fildes, buf, nbyte, offset) {
      // ssize_t pwrite(int fildes, const void *buf, size_t nbyte, off_t offset);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/write.html
      var stream = FS.streams[fildes];
      if (!stream || stream.object.isDevice) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      } else if (!stream.isWrite) {
        ___setErrNo(ERRNO_CODES.EACCES);
        return -1;
      } else if (stream.object.isFolder) {
        ___setErrNo(ERRNO_CODES.EISDIR);
        return -1;
      } else if (nbyte < 0 || offset < 0) {
        ___setErrNo(ERRNO_CODES.EINVAL);
        return -1;
      } else {
        var contents = stream.object.contents;
        while (contents.length < offset) contents.push(0);
        for (var i = 0; i < nbyte; i++) {
          contents[offset + i] = HEAPU8[((buf)+(i))];
        }
        stream.object.timestamp = Date.now();
        return i;
      }
    }function _write(fildes, buf, nbyte) {
      // ssize_t write(int fildes, const void *buf, size_t nbyte);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/write.html
      var stream = FS.streams[fildes];
      if (!stream) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      } else if (!stream.isWrite) {
        ___setErrNo(ERRNO_CODES.EACCES);
        return -1;
      } else if (nbyte < 0) {
        ___setErrNo(ERRNO_CODES.EINVAL);
        return -1;
      } else {
        if (stream.object.isDevice) {
          if (stream.object.output) {
            for (var i = 0; i < nbyte; i++) {
              try {
                stream.object.output(HEAP8[((buf)+(i))]);
              } catch (e) {
                ___setErrNo(ERRNO_CODES.EIO);
                return -1;
              }
            }
            stream.object.timestamp = Date.now();
            return i;
          } else {
            ___setErrNo(ERRNO_CODES.ENXIO);
            return -1;
          }
        } else {
          var bytesWritten = _pwrite(fildes, buf, nbyte, stream.position);
          if (bytesWritten != -1) stream.position += bytesWritten;
          return bytesWritten;
        }
      }
    }function _fwrite(ptr, size, nitems, stream) {
      // size_t fwrite(const void *restrict ptr, size_t size, size_t nitems, FILE *restrict stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fwrite.html
      var bytesToWrite = nitems * size;
      if (bytesToWrite == 0) return 0;
      var bytesWritten = _write(stream, ptr, bytesToWrite);
      if (bytesWritten == -1) {
        if (FS.streams[stream]) FS.streams[stream].error = true;
        return 0;
      } else {
        return Math.floor(bytesWritten / size);
      }
    }

  
  function _strncmp(px, py, n) {
      var i = 0;
      while (i < n) {
        var x = HEAPU8[((px)+(i))];
        var y = HEAPU8[((py)+(i))];
        if (x == y && x == 0) return 0;
        if (x == 0) return -1;
        if (y == 0) return 1;
        if (x == y) {
          i ++;
          continue;
        } else {
          return x > y ? 1 : -1;
        }
      }
      return 0;
    }function _strcmp(px, py) {
      return _strncmp(px, py, TOTAL_MEMORY);
    }

  
  function _memset(ptr, value, num, align) {
      // TODO: make these settings, and in memcpy, {{'s
      if (num >= 20) {
        // This is unaligned, but quite large, so work hard to get to aligned settings
        var stop = ptr + num;
        while (ptr % 4) { // no need to check for stop, since we have large num
          HEAP8[ptr++] = value;
        }
        if (value < 0) value += 256; // make it unsigned
        var ptr4 = ptr >> 2, stop4 = stop >> 2, value4 = value | (value << 8) | (value << 16) | (value << 24);
        while (ptr4 < stop4) {
          HEAP32[ptr4++] = value4;
        }
        ptr = ptr4 << 2;
        while (ptr < stop) {
          HEAP8[ptr++] = value;
        }
      } else {
        while (num--) {
          HEAP8[ptr++] = value;
        }
      }
    }var _llvm_memset_p0i8_i32=_memset;

  
  function _memcpy(dest, src, num, align) {
      if (num >= 20 && src % 2 == dest % 2) {
        // This is unaligned, but quite large, and potentially alignable, so work hard to get to aligned settings
        if (src % 4 == dest % 4) {
          var stop = src + num;
          while (src % 4) { // no need to check for stop, since we have large num
            HEAP8[dest++] = HEAP8[src++];
          }
          var src4 = src >> 2, dest4 = dest >> 2, stop4 = stop >> 2;
          while (src4 < stop4) {
            HEAP32[dest4++] = HEAP32[src4++];
          }
          src = src4 << 2;
          dest = dest4 << 2;
          while (src < stop) {
            HEAP8[dest++] = HEAP8[src++];
          }
        } else {
          var stop = src + num;
          if (src % 2) { // no need to check for stop, since we have large num
            HEAP8[dest++] = HEAP8[src++];
          }
          var src2 = src >> 1, dest2 = dest >> 1, stop2 = stop >> 1;
          while (src2 < stop2) {
            HEAP16[dest2++] = HEAP16[src2++];
          }
          src = src2 << 1;
          dest = dest2 << 1;
          if (src < stop) {
            HEAP8[dest++] = HEAP8[src++];
          }
        }
      } else {
        while (num--) {
          HEAP8[dest++] = HEAP8[src++];
        }
      }
    }var _llvm_memcpy_p0i8_p0i8_i32=_memcpy;

  function _abort() {
      ABORT = true;
      throw 'abort() at ' + (new Error().stack);
    }

  function _sysconf(name) {
      // long sysconf(int name);
      // http://pubs.opengroup.org/onlinepubs/009695399/functions/sysconf.html
      switch(name) {
        case 8: return PAGE_SIZE;
        case 54:
        case 56:
        case 21:
        case 61:
        case 63:
        case 22:
        case 67:
        case 23:
        case 24:
        case 25:
        case 26:
        case 27:
        case 69:
        case 28:
        case 101:
        case 70:
        case 71:
        case 29:
        case 30:
        case 199:
        case 75:
        case 76:
        case 32:
        case 43:
        case 44:
        case 80:
        case 46:
        case 47:
        case 45:
        case 48:
        case 49:
        case 42:
        case 82:
        case 33:
        case 7:
        case 108:
        case 109:
        case 107:
        case 112:
        case 119:
        case 121:
          return 200809;
        case 13:
        case 104:
        case 94:
        case 95:
        case 34:
        case 35:
        case 77:
        case 81:
        case 83:
        case 84:
        case 85:
        case 86:
        case 87:
        case 88:
        case 89:
        case 90:
        case 91:
        case 94:
        case 95:
        case 110:
        case 111:
        case 113:
        case 114:
        case 115:
        case 116:
        case 117:
        case 118:
        case 120:
        case 40:
        case 16:
        case 79:
        case 19:
          return -1;
        case 92:
        case 93:
        case 5:
        case 72:
        case 6:
        case 74:
        case 92:
        case 93:
        case 96:
        case 97:
        case 98:
        case 99:
        case 102:
        case 103:
        case 105:
          return 1;
        case 38:
        case 66:
        case 50:
        case 51:
        case 4:
          return 1024;
        case 15:
        case 64:
        case 41:
          return 32;
        case 55:
        case 37:
        case 17:
          return 2147483647;
        case 18:
        case 1:
          return 47839;
        case 59:
        case 57:
          return 99;
        case 68:
        case 58:
          return 2048;
        case 0: return 2097152;
        case 3: return 65536;
        case 14: return 32768;
        case 73: return 32767;
        case 39: return 16384;
        case 60: return 1000;
        case 106: return 700;
        case 52: return 256;
        case 62: return 255;
        case 2: return 100;
        case 65: return 64;
        case 36: return 20;
        case 100: return 16;
        case 20: return 6;
        case 53: return 4;
      }
      ___setErrNo(ERRNO_CODES.EINVAL);
      return -1;
    }

  function _time(ptr) {
      var ret = Math.floor(Date.now()/1000);
      if (ptr) {
        HEAP32[((ptr)>>2)]=ret
      }
      return ret;
    }

  
  function ___errno_location() {
      return ___setErrNo.ret;
    }var ___errno=___errno_location;

  function _sbrk(bytes) {
      // Implement a Linux-like 'memory area' for our 'process'.
      // Changes the size of the memory area by |bytes|; returns the
      // address of the previous top ('break') of the memory area
  
      // We need to make sure no one else allocates unfreeable memory!
      // We must control this entirely. So we don't even need to do
      // unfreeable allocations - the HEAP is ours, from STATICTOP up.
      // TODO: We could in theory slice off the top of the HEAP when
      //       sbrk gets a negative increment in |bytes|...
      var self = _sbrk;
      if (!self.called) {
        STATICTOP = alignMemoryPage(STATICTOP); // make sure we start out aligned
        self.called = true;
        _sbrk.DYNAMIC_START = STATICTOP;
      }
      var ret = STATICTOP;
      if (bytes != 0) Runtime.staticAlloc(bytes);
      return ret;  // Previous break location.
    }

  function _llvm_bswap_i32(x) {
      return ((x&0xff)<<24) | (((x>>8)&0xff)<<16) | (((x>>16)&0xff)<<8) | (x>>>24);
    }





  var Browser={mainLoop:{scheduler:null,shouldPause:false,paused:false,queue:[],pause:function () {
          Browser.mainLoop.shouldPause = true;
        },resume:function () {
          if (Browser.mainLoop.paused) {
            Browser.mainLoop.paused = false;
            Browser.mainLoop.scheduler();
          }
          Browser.mainLoop.shouldPause = false;
        },updateStatus:function () {
          if (Module['setStatus']) {
            var message = Module['statusMessage'] || 'Please wait...';
            var remaining = Browser.mainLoop.remainingBlockers;
            var expected = Browser.mainLoop.expectedBlockers;
            if (remaining) {
              if (remaining < expected) {
                Module['setStatus'](message + ' (' + (expected - remaining) + '/' + expected + ')');
              } else {
                Module['setStatus'](message);
              }
            } else {
              Module['setStatus']('');
            }
          }
        }},pointerLock:false,moduleContextCreatedCallbacks:[],workers:[],ensureObjects:function () {
        if (Browser.ensured) return;
        Browser.ensured = true;
        try {
          new Blob();
          Browser.hasBlobConstructor = true;
        } catch(e) {
          Browser.hasBlobConstructor = false;
          console.log("warning: no blob constructor, cannot create blobs with mimetypes");
        }
        Browser.BlobBuilder = typeof MozBlobBuilder != "undefined" ? MozBlobBuilder : (typeof WebKitBlobBuilder != "undefined" ? WebKitBlobBuilder : (!Browser.hasBlobConstructor ? console.log("warning: no BlobBuilder") : null));
        Browser.URLObject = typeof window != "undefined" ? (window.URL ? window.URL : window.webkitURL) : console.log("warning: cannot create object URLs");
  
        // Support for plugins that can process preloaded files. You can add more of these to
        // your app by creating and appending to Module.preloadPlugins.
        //
        // Each plugin is asked if it can handle a file based on the file's name. If it can,
        // it is given the file's raw data. When it is done, it calls a callback with the file's
        // (possibly modified) data. For example, a plugin might decompress a file, or it
        // might create some side data structure for use later (like an Image element, etc.).
  
        function getMimetype(name) {
          return {
            'jpg': 'image/jpeg',
            'png': 'image/png',
            'bmp': 'image/bmp',
            'ogg': 'audio/ogg',
            'wav': 'audio/wav',
            'mp3': 'audio/mpeg'
          }[name.substr(-3)];
          return ret;
        }
  
        if (!Module["preloadPlugins"]) Module["preloadPlugins"] = [];
  
        var imagePlugin = {};
        imagePlugin['canHandle'] = function(name) {
          return name.substr(-4) in { '.jpg': 1, '.png': 1, '.bmp': 1 };
        };
        imagePlugin['handle'] = function(byteArray, name, onload, onerror) {
          var b = null;
          if (Browser.hasBlobConstructor) {
            try {
              b = new Blob([byteArray], { type: getMimetype(name) });
            } catch(e) {
              Runtime.warnOnce('Blob constructor present but fails: ' + e + '; falling back to blob builder');
            }
          }
          if (!b) {
            var bb = new Browser.BlobBuilder();
            bb.append((new Uint8Array(byteArray)).buffer); // we need to pass a buffer, and must copy the array to get the right data range
            b = bb.getBlob();
          }
          var url = Browser.URLObject.createObjectURL(b);
          assert(typeof url == 'string', 'createObjectURL must return a url as a string');
          var img = new Image();
          img.onload = function() {
            assert(img.complete, 'Image ' + name + ' could not be decoded');
            var canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            var ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            Module["preloadedImages"][name] = canvas;
            Browser.URLObject.revokeObjectURL(url);
            if (onload) onload(byteArray);
          };
          img.onerror = function(event) {
            console.log('Image ' + url + ' could not be decoded');
            if (onerror) onerror();
          };
          img.src = url;
        };
        Module['preloadPlugins'].push(imagePlugin);
  
        var audioPlugin = {};
        audioPlugin['canHandle'] = function(name) {
          return name.substr(-4) in { '.ogg': 1, '.wav': 1, '.mp3': 1 };
        };
        audioPlugin['handle'] = function(byteArray, name, onload, onerror) {
          var done = false;
          function finish(audio) {
            if (done) return;
            done = true;
            Module["preloadedAudios"][name] = audio;
            if (onload) onload(byteArray);
          }
          function fail() {
            if (done) return;
            done = true;
            Module["preloadedAudios"][name] = new Audio(); // empty shim
            if (onerror) onerror();
          }
          if (Browser.hasBlobConstructor) {
            try {
              var b = new Blob([byteArray], { type: getMimetype(name) });
            } catch(e) {
              return fail();
            }
            var url = Browser.URLObject.createObjectURL(b); // XXX we never revoke this!
            assert(typeof url == 'string', 'createObjectURL must return a url as a string');
            var audio = new Audio();
            audio.addEventListener('canplaythrough', function() { finish(audio) }, false); // use addEventListener due to chromium bug 124926
            audio.onerror = function(event) {
              if (done) return;
              console.log('warning: browser could not fully decode audio ' + name + ', trying slower base64 approach');
              function encode64(data) {
                var BASE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
                var PAD = '=';
                var ret = '';
                var leftchar = 0;
                var leftbits = 0;
                for (var i = 0; i < data.length; i++) {
                  leftchar = (leftchar << 8) | data[i];
                  leftbits += 8;
                  while (leftbits >= 6) {
                    var curr = (leftchar >> (leftbits-6)) & 0x3f;
                    leftbits -= 6;
                    ret += BASE[curr];
                  }
                }
                if (leftbits == 2) {
                  ret += BASE[(leftchar&3) << 4];
                  ret += PAD + PAD;
                } else if (leftbits == 4) {
                  ret += BASE[(leftchar&0xf) << 2];
                  ret += PAD;
                }
                return ret;
              }
              audio.src = 'data:audio/x-' + name.substr(-3) + ';base64,' + encode64(byteArray);
              finish(audio); // we don't wait for confirmation this worked - but it's worth trying
            };
            audio.src = url;
            // workaround for chrome bug 124926 - we do not always get oncanplaythrough or onerror
            setTimeout(function() {
              finish(audio); // try to use it even though it is not necessarily ready to play
            }, 10000);
          } else {
            return fail();
          }
        };
        Module['preloadPlugins'].push(audioPlugin);
      },createContext:function (canvas, useWebGL, setInModule) {
        try {
          var ctx = canvas.getContext(useWebGL ? 'experimental-webgl' : '2d');
          if (!ctx) throw ':(';
        } catch (e) {
          Module.print('Could not create canvas - ' + e);
          return null;
        }
        if (useWebGL) {
          // Set the background of the WebGL canvas to black
          canvas.style.backgroundColor = "black";
  
          // Warn on context loss
          canvas.addEventListener('webglcontextlost', function(event) {
            alert('WebGL context lost. You will need to reload the page.');
          }, false);
        }
        if (setInModule) {
          Module.ctx = ctx;
          Module.useWebGL = useWebGL;
          Browser.moduleContextCreatedCallbacks.forEach(function(callback) { callback() });
        }
        return ctx;
      },requestFullScreen:function () {
        var canvas = Module['canvas'];
        function fullScreenChange() {
          var isFullScreen = false;
          if ((document['webkitFullScreenElement'] || document['webkitFullscreenElement'] ||
               document['mozFullScreenElement'] || document['mozFullscreenElement'] ||
               document['fullScreenElement'] || document['fullscreenElement']) === canvas) {
            canvas.requestPointerLock = canvas['requestPointerLock'] ||
                                        canvas['mozRequestPointerLock'] ||
                                        canvas['webkitRequestPointerLock'];
            canvas.requestPointerLock();
            isFullScreen = true;
          }
          if (Module['onFullScreen']) Module['onFullScreen'](isFullScreen);
        }
  
        document.addEventListener('fullscreenchange', fullScreenChange, false);
        document.addEventListener('mozfullscreenchange', fullScreenChange, false);
        document.addEventListener('webkitfullscreenchange', fullScreenChange, false);
  
        function pointerLockChange() {
          Browser.pointerLock = document['pointerLockElement'] === canvas ||
                                document['mozPointerLockElement'] === canvas ||
                                document['webkitPointerLockElement'] === canvas;
        }
  
        document.addEventListener('pointerlockchange', pointerLockChange, false);
        document.addEventListener('mozpointerlockchange', pointerLockChange, false);
        document.addEventListener('webkitpointerlockchange', pointerLockChange, false);
  
        canvas.requestFullScreen = canvas['requestFullScreen'] ||
                                   canvas['mozRequestFullScreen'] ||
                                   (canvas['webkitRequestFullScreen'] ? function() { canvas['webkitRequestFullScreen'](Element['ALLOW_KEYBOARD_INPUT']) } : null);
        canvas.requestFullScreen(); 
      },requestAnimationFrame:function (func) {
        if (!window.requestAnimationFrame) {
          window.requestAnimationFrame = window['requestAnimationFrame'] ||
                                         window['mozRequestAnimationFrame'] ||
                                         window['webkitRequestAnimationFrame'] ||
                                         window['msRequestAnimationFrame'] ||
                                         window['oRequestAnimationFrame'] ||
                                         window['setTimeout'];
        }
        window.requestAnimationFrame(func);
      },getMovementX:function (event) {
        return event['movementX'] ||
               event['mozMovementX'] ||
               event['webkitMovementX'] ||
               0;
      },getMovementY:function (event) {
        return event['movementY'] ||
               event['mozMovementY'] ||
               event['webkitMovementY'] ||
               0;
      },xhrLoad:function (url, onload, onerror) {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', url, true);
        xhr.responseType = 'arraybuffer';
        xhr.onload = function() {
          if (xhr.status == 200) {
            onload(xhr.response);
          } else {
            onerror();
          }
        };
        xhr.onerror = onerror;
        xhr.send(null);
      },asyncLoad:function (url, onload, onerror, noRunDep) {
        Browser.xhrLoad(url, function(arrayBuffer) {
          assert(arrayBuffer, 'Loading data file "' + url + '" failed (no arrayBuffer).');
          onload(new Uint8Array(arrayBuffer));
          if (!noRunDep) removeRunDependency('al ' + url);
        }, function(event) {
          if (onerror) {
            onerror();
          } else {
            throw 'Loading data file "' + url + '" failed.';
          }
        });
        if (!noRunDep) addRunDependency('al ' + url);
      },resizeListeners:[],updateResizeListeners:function () {
        var canvas = Module['canvas'];
        Browser.resizeListeners.forEach(function(listener) {
          listener(canvas.width, canvas.height);
        });
      },setCanvasSize:function (width, height, noUpdates) {
        var canvas = Module['canvas'];
        canvas.width = width;
        canvas.height = height;
        if (!noUpdates) Browser.updateResizeListeners();
      }};
__ATINIT__.unshift({ func: function() { if (!Module["noFSInit"] && !FS.init.initialized) FS.init() } });__ATMAIN__.push({ func: function() { FS.ignorePermissions = false } });__ATEXIT__.push({ func: function() { FS.quit() } });Module["FS_createFolder"] = FS.createFolder;Module["FS_createPath"] = FS.createPath;Module["FS_createDataFile"] = FS.createDataFile;Module["FS_createPreloadedFile"] = FS.createPreloadedFile;Module["FS_createLazyFile"] = FS.createLazyFile;Module["FS_createLink"] = FS.createLink;Module["FS_createDevice"] = FS.createDevice;
___setErrNo(0);
Module["requestFullScreen"] = function() { Browser.requestFullScreen() };
  Module["requestAnimationFrame"] = function(func) { Browser.requestAnimationFrame(func) };
  Module["pauseMainLoop"] = function() { Browser.mainLoop.pause() };
  Module["resumeMainLoop"] = function() { Browser.mainLoop.resume() };
  

var FUNCTION_TABLE = [0,0,_deflate_fast,0,_zcalloc,0,_deflate_slow,0,_deflate_stored,0,_zcfree,0];

function _def($source, $dest) {
  var $10$s2;
  var $strm$s2;
  var label = 0;
  var __stackBase__ = STACKTOP;
  STACKTOP = STACKTOP + 32824 | 0;
  var $strm = __stackBase__, $strm$s2 = $strm >> 2;
  HEAP32[$strm$s2 + 8] = 0;
  HEAP32[$strm$s2 + 9] = 0;
  HEAP32[$strm$s2 + 10] = 0;
  var $4 = $strm;
  var $5 = _deflateInit_($4);
  if (($5 | 0) != 0) {
    var $_0 = $5;
    var $_0;
    STACKTOP = __stackBase__;
    return $_0;
  }
  var $7 = __stackBase__ + 56 | 0;
  var $8 = $strm + 4 | 0;
  var $9 = $strm | 0;
  var $10$s2 = ($strm + 16 | 0) >> 2;
  var $11 = __stackBase__ + 16440 | 0;
  var $12 = $strm + 12 | 0;
  L4 : while (1) {
    HEAP32[$8 >> 2] = _fread($7, 1, 16384, $source);
    if ((_ferror($source) | 0) != 0) {
      label = 4;
      break;
    }
    var $20 = (_feof($source) | 0) != 0;
    var $21 = $20 ? 4 : 0;
    HEAP32[$9 >> 2] = $7;
    while (1) {
      HEAP32[$10$s2] = 16384;
      HEAP32[$12 >> 2] = $11;
      var $23 = _deflate($4, $21);
      if (($23 | 0) == -2) {
        ___assert_func(5256400 | 0, 68, 5257648 | 0, 5256072 | 0);
      }
      var $28 = 16384 - HEAP32[$10$s2] | 0;
      if ((_fwrite($11, 1, $28, $dest) | 0) != ($28 | 0)) {
        label = 10;
        break L4;
      }
      if ((_ferror($dest) | 0) != 0) {
        label = 10;
        break L4;
      }
      if ((HEAP32[$10$s2] | 0) != 0) {
        break;
      }
    }
    if ((HEAP32[$8 >> 2] | 0) != 0) {
      ___assert_func(5256400 | 0, 75, 5257648 | 0, 5255996 | 0);
    }
    if ($20) {
      label = 15;
      break;
    }
  }
  if (label == 4) {
    _deflateEnd($4);
    var $_0 = -1;
    var $_0;
    STACKTOP = __stackBase__;
    return $_0;
  } else if (label == 10) {
    _deflateEnd($4);
    var $_0 = -1;
    var $_0;
    STACKTOP = __stackBase__;
    return $_0;
  } else if (label == 15) {
    if (($23 | 0) != 1) {
      ___assert_func(5256400 | 0, 79, 5257648 | 0, 5255956 | 0);
    }
    _deflateEnd($4);
    var $_0 = 0;
    var $_0;
    STACKTOP = __stackBase__;
    return $_0;
  }
}
_def["X"] = 1;
function _inf($source, $dest) {
  var $9$s2;
  var $strm$s2;
  var label = 0;
  var __stackBase__ = STACKTOP;
  STACKTOP = STACKTOP + 32824 | 0;
  var $strm = __stackBase__, $strm$s2 = $strm >> 2;
  HEAP32[$strm$s2 + 8] = 0;
  HEAP32[$strm$s2 + 9] = 0;
  HEAP32[$strm$s2 + 10] = 0;
  var $4 = $strm + 4 | 0;
  HEAP32[$4 >> 2] = 0;
  var $5 = $strm | 0;
  HEAP32[$5 >> 2] = 0;
  var $6 = _inflateInit_($strm);
  if (($6 | 0) != 0) {
    var $_0 = $6;
    var $_0;
    STACKTOP = __stackBase__;
    return $_0;
  }
  var $8 = __stackBase__ + 56 | 0;
  var $9$s2 = ($strm + 16 | 0) >> 2;
  var $10 = __stackBase__ + 16440 | 0;
  var $11 = $strm + 12 | 0;
  var $ret_0 = 0;
  L32 : while (1) {
    var $ret_0;
    var $13 = _fread($8, 1, 16384, $source);
    HEAP32[$4 >> 2] = $13;
    if ((_ferror($source) | 0) != 0) {
      label = 26;
      break;
    }
    if (($13 | 0) == 0) {
      var $ret_2 = $ret_0;
      label = 38;
      break;
    }
    HEAP32[$5 >> 2] = $8;
    while (1) {
      HEAP32[$9$s2] = 16384;
      HEAP32[$11 >> 2] = $10;
      var $21 = _inflate($strm);
      if (($21 | 0) == -2) {
        ___assert_func(5256400 | 0, 126, 5257644 | 0, 5256072 | 0);
      } else if (($21 | 0) == 2) {
        label = 31;
        break L32;
      } else if (($21 | 0) == -3 || ($21 | 0) == -4) {
        var $ret_1 = $21;
        break L32;
      }
      var $25 = 16384 - HEAP32[$9$s2] | 0;
      if ((_fwrite($10, 1, $25, $dest) | 0) != ($25 | 0)) {
        label = 35;
        break L32;
      }
      if ((_ferror($dest) | 0) != 0) {
        label = 35;
        break L32;
      }
      if ((HEAP32[$9$s2] | 0) != 0) {
        break;
      }
    }
    if (($21 | 0) == 1) {
      var $ret_2 = 1;
      label = 38;
      break;
    } else {
      var $ret_0 = $21;
    }
  }
  if (label == 31) {
    var $ret_1 = -3;
  } else if (label == 26) {
    _inflateEnd($strm);
    var $_0 = -1;
    var $_0;
    STACKTOP = __stackBase__;
    return $_0;
  } else if (label == 35) {
    _inflateEnd($strm);
    var $_0 = -1;
    var $_0;
    STACKTOP = __stackBase__;
    return $_0;
  } else if (label == 38) {
    var $ret_2;
    _inflateEnd($strm);
    var $_0 = ($ret_2 | 0) == 1 ? 0 : -3;
    var $_0;
    STACKTOP = __stackBase__;
    return $_0;
  }
  var $ret_1;
  _inflateEnd($strm);
  var $_0 = $ret_1;
  var $_0;
  STACKTOP = __stackBase__;
  return $_0;
}
_inf["X"] = 1;
function _zerr($ret) {
  _fwrite(5255904 | 0, 7, 1, HEAP32[_stderr >> 2]);
  if (($ret | 0) == -3) {
    _fwrite(5255616 | 0, 35, 1, HEAP32[_stderr >> 2]);
    return;
  } else if (($ret | 0) == -4) {
    _fwrite(5256384 | 0, 14, 1, HEAP32[_stderr >> 2]);
    return;
  } else if (($ret | 0) == -6) {
    _fwrite(5256332 | 0, 23, 1, HEAP32[_stderr >> 2]);
    return;
  } else if (($ret | 0) == -2) {
    _fwrite(5255688 | 0, 26, 1, HEAP32[_stderr >> 2]);
    return;
  } else if (($ret | 0) == -1) {
    if ((_ferror(HEAP32[_stdin >> 2]) | 0) != 0) {
      _fwrite(5255860 | 0, 20, 1, HEAP32[_stderr >> 2]);
    }
    if ((_ferror(HEAP32[_stdout >> 2]) | 0) == 0) {
      return;
    }
    _fwrite(5255796 | 0, 21, 1, HEAP32[_stderr >> 2]);
    return;
  } else {
    return;
  }
}
function _main($argc, $argv) {
  var label = 0;
  do {
    if (($argc | 0) == 1) {
      var $4 = _def(HEAP32[_stdin >> 2], HEAP32[_stdout >> 2]);
      if (($4 | 0) == 0) {
        var $_0 = 0;
        break;
      }
      _zerr($4);
      var $_0 = $4;
      break;
    } else if (($argc | 0) == 2) {
      if ((_strcmp(HEAP32[$argv + 4 >> 2], 5256264 | 0) | 0) != 0) {
        label = 68;
        break;
      }
      var $15 = _inf(HEAP32[_stdin >> 2], HEAP32[_stdout >> 2]);
      if (($15 | 0) == 0) {
        var $_0 = 0;
        break;
      }
      _zerr($15);
      var $_0 = $15;
      break;
    } else {
      label = 68;
    }
  } while (0);
  if (label == 68) {
    _fwrite(5256192 | 0, 40, 1, HEAP32[_stderr >> 2]);
    var $_0 = 1;
  }
  var $_0;
  return $_0;
}
Module["_main"] = _main;
function _deflateInit_($strm) {
  return _deflateInit2_($strm);
}
function _deflateInit2_($strm) {
  var $17$s2;
  var $15$s2;
  var $4$s2;
  if (($strm | 0) == 0) {
    var $_0 = -2;
    var $_0;
    return $_0;
  }
  var $3 = $strm + 24 | 0;
  HEAP32[$3 >> 2] = 0;
  var $4$s2 = ($strm + 32 | 0) >> 2;
  var $5 = HEAP32[$4$s2];
  if (($5 | 0) == 0) {
    HEAP32[$4$s2] = 4;
    HEAP32[$strm + 40 >> 2] = 0;
    var $10 = 4;
  } else {
    var $10 = $5;
  }
  var $10;
  var $11 = $strm + 36 | 0;
  if ((HEAP32[$11 >> 2] | 0) == 0) {
    HEAP32[$11 >> 2] = 10;
  }
  var $15$s2 = ($strm + 40 | 0) >> 2;
  var $17 = FUNCTION_TABLE[$10](HEAP32[$15$s2], 1, 5828), $17$s2 = $17 >> 2;
  if (($17 | 0) == 0) {
    var $_0 = -4;
    var $_0;
    return $_0;
  }
  HEAP32[$strm + 28 >> 2] = $17;
  HEAP32[$17$s2] = $strm;
  HEAP32[$17$s2 + 6] = 1;
  HEAP32[$17$s2 + 7] = 0;
  HEAP32[$17$s2 + 12] = 15;
  var $30 = $17 + 44 | 0;
  HEAP32[$30 >> 2] = 32768;
  HEAP32[$17$s2 + 13] = 32767;
  HEAP32[$17$s2 + 20] = 15;
  var $36 = $17 + 76 | 0;
  HEAP32[$36 >> 2] = 32768;
  HEAP32[$17$s2 + 21] = 32767;
  HEAP32[$17$s2 + 22] = 5;
  var $45 = $17 + 56 | 0;
  HEAP32[$45 >> 2] = FUNCTION_TABLE[HEAP32[$4$s2]](HEAP32[$15$s2], 32768, 2);
  var $52 = $17 + 64 | 0;
  HEAP32[$52 >> 2] = FUNCTION_TABLE[HEAP32[$4$s2]](HEAP32[$15$s2], HEAP32[$30 >> 2], 2);
  var $59 = $17 + 68 | 0;
  HEAP32[$59 >> 2] = FUNCTION_TABLE[HEAP32[$4$s2]](HEAP32[$15$s2], HEAP32[$36 >> 2], 2);
  HEAP32[$17$s2 + 1456] = 0;
  var $63 = $17 + 5788 | 0;
  HEAP32[$63 >> 2] = 16384;
  var $66 = FUNCTION_TABLE[HEAP32[$4$s2]](HEAP32[$15$s2], 16384, 4);
  var $67 = $66;
  HEAP32[$17$s2 + 2] = $66;
  var $70 = HEAP32[$63 >> 2];
  HEAP32[$17$s2 + 3] = $70 << 2;
  do {
    if ((HEAP32[$45 >> 2] | 0) != 0) {
      if ((HEAP32[$52 >> 2] | 0) == 0) {
        break;
      }
      if ((HEAP32[$59 >> 2] | 0) == 0 | ($66 | 0) == 0) {
        break;
      }
      HEAP32[$17$s2 + 1449] = ($70 >>> 1 << 1) + $67 | 0;
      HEAP32[$17$s2 + 1446] = $66 + $70 * 3 | 0;
      HEAP32[$17$s2 + 33] = 6;
      HEAP32[$17$s2 + 34] = 0;
      HEAP8[$17 + 36 | 0] = 8;
      var $_0 = _deflateReset($strm);
      var $_0;
      return $_0;
    }
  } while (0);
  HEAP32[$17$s2 + 1] = 666;
  HEAP32[$3 >> 2] = 5255820 | 0;
  _deflateEnd($strm);
  var $_0 = -4;
  var $_0;
  return $_0;
}
_deflateInit2_["X"] = 1;
function _deflateEnd($strm) {
  var $_pre45_pre$s2;
  var $3$s2;
  var $strm$s2 = $strm >> 2;
  if (($strm | 0) == 0) {
    return;
  }
  var $3$s2 = ($strm + 28 | 0) >> 2;
  var $4 = HEAP32[$3$s2];
  if (($4 | 0) == 0) {
    return;
  }
  var $8 = HEAP32[$4 + 4 >> 2];
  if (!(($8 | 0) == 666 || ($8 | 0) == 113 || ($8 | 0) == 103 || ($8 | 0) == 91 || ($8 | 0) == 73 || ($8 | 0) == 69 || ($8 | 0) == 42)) {
    return;
  }
  var $11 = HEAP32[$4 + 8 >> 2];
  if (($11 | 0) == 0) {
    var $19 = $4;
  } else {
    FUNCTION_TABLE[HEAP32[$strm$s2 + 9]](HEAP32[$strm$s2 + 10], $11);
    var $19 = HEAP32[$3$s2];
  }
  var $19;
  var $21 = HEAP32[$19 + 68 >> 2];
  if (($21 | 0) == 0) {
    var $30 = $19;
  } else {
    FUNCTION_TABLE[HEAP32[$strm$s2 + 9]](HEAP32[$strm$s2 + 10], $21);
    var $30 = HEAP32[$3$s2];
  }
  var $30;
  var $32 = HEAP32[$30 + 64 >> 2];
  var $_pre45_pre$s2 = ($strm + 36 | 0) >> 2;
  if (($32 | 0) == 0) {
    var $39 = $30;
  } else {
    FUNCTION_TABLE[HEAP32[$_pre45_pre$s2]](HEAP32[$strm$s2 + 10], $32);
    var $39 = HEAP32[$3$s2];
  }
  var $39;
  var $41 = HEAP32[$39 + 56 >> 2];
  if (($41 | 0) == 0) {
    var $48 = $39;
    var $_pre_phi47 = $strm + 40 | 0;
  } else {
    var $45 = $strm + 40 | 0;
    FUNCTION_TABLE[HEAP32[$_pre45_pre$s2]](HEAP32[$45 >> 2], $41);
    var $48 = HEAP32[$3$s2];
    var $_pre_phi47 = $45;
  }
  var $_pre_phi47;
  var $48;
  FUNCTION_TABLE[HEAP32[$_pre45_pre$s2]](HEAP32[$_pre_phi47 >> 2], $48);
  HEAP32[$3$s2] = 0;
  return;
}
_deflateEnd["X"] = 1;
function _deflateReset($strm) {
  var $1 = _deflateResetKeep($strm);
  if (($1 | 0) != 0) {
    return $1;
  }
  _lm_init(HEAP32[$strm + 28 >> 2]);
  return $1;
}
function _fill_window($s) {
  var $137$s2;
  var $13$s2;
  var $10$s2;
  var $9$s2;
  var $8$s2;
  var $5$s2;
  var $4$s2;
  var $1 = $s + 44 | 0;
  var $2 = HEAP32[$1 >> 2];
  var $3 = $s + 60 | 0;
  var $4$s2 = ($s + 116 | 0) >> 2;
  var $5$s2 = ($s + 108 | 0) >> 2;
  var $6 = $2 - 262 | 0;
  var $7 = $s | 0;
  var $8$s2 = ($s + 56 | 0) >> 2;
  var $9$s2 = ($s + 5812 | 0) >> 2;
  var $10$s2 = ($s + 72 | 0) >> 2;
  var $11 = $s + 88 | 0;
  var $12 = $s + 84 | 0;
  var $13$s2 = ($s + 68 | 0) >> 2;
  var $14 = $s + 52 | 0;
  var $15 = $s + 64 | 0;
  var $16 = $s + 112 | 0;
  var $17 = $s + 92 | 0;
  var $18 = $s + 76 | 0;
  var $21 = HEAP32[$4$s2];
  var $20 = $2;
  while (1) {
    var $20;
    var $21;
    var $24 = HEAP32[$5$s2];
    var $25 = HEAP32[$3 >> 2] - $21 - $24 | 0;
    if ($24 >>> 0 < ($6 + $20 | 0) >>> 0) {
      var $more_0 = $25;
    } else {
      var $29 = HEAP32[$8$s2];
      _memcpy($29, $29 + $2 | 0, $2, 1);
      HEAP32[$16 >> 2] = HEAP32[$16 >> 2] - $2 | 0;
      HEAP32[$5$s2] = HEAP32[$5$s2] - $2 | 0;
      HEAP32[$17 >> 2] = HEAP32[$17 >> 2] - $2 | 0;
      var $37 = HEAP32[$18 >> 2];
      var $n_0 = $37;
      var $p_0 = ($37 << 1) + HEAP32[$13$s2] | 0;
      while (1) {
        var $p_0;
        var $n_0;
        var $41 = $p_0 - 2 | 0;
        var $43 = HEAPU16[$41 >> 1];
        if ($43 >>> 0 < $2 >>> 0) {
          var $48 = 0;
        } else {
          var $48 = $43 - $2 & 65535;
        }
        var $48;
        HEAP16[$41 >> 1] = $48;
        var $49 = $n_0 - 1 | 0;
        if (($49 | 0) == 0) {
          break;
        } else {
          var $n_0 = $49;
          var $p_0 = $41;
        }
      }
      var $n_1 = $2;
      var $p_1 = ($2 << 1) + HEAP32[$15 >> 2] | 0;
      while (1) {
        var $p_1;
        var $n_1;
        var $55 = $p_1 - 2 | 0;
        var $57 = HEAPU16[$55 >> 1];
        if ($57 >>> 0 < $2 >>> 0) {
          var $62 = 0;
        } else {
          var $62 = $57 - $2 & 65535;
        }
        var $62;
        HEAP16[$55 >> 1] = $62;
        var $63 = $n_1 - 1 | 0;
        if (($63 | 0) == 0) {
          break;
        } else {
          var $n_1 = $63;
          var $p_1 = $55;
        }
      }
      var $more_0 = $25 + $2 | 0;
    }
    var $more_0;
    var $67 = HEAP32[$7 >> 2];
    if ((HEAP32[$67 + 4 >> 2] | 0) == 0) {
      break;
    }
    var $78 = _read_buf($67, HEAP32[$8$s2] + HEAP32[$4$s2] + HEAP32[$5$s2] | 0, $more_0) + HEAP32[$4$s2] | 0;
    HEAP32[$4$s2] = $78;
    var $79 = HEAP32[$9$s2];
    var $81 = ($78 + $79 | 0) >>> 0 > 2;
    L152 : do {
      if ($81) {
        var $84 = HEAP32[$5$s2] - $79 | 0;
        var $85 = HEAP32[$8$s2];
        var $88 = HEAPU8[$85 + $84 | 0];
        HEAP32[$10$s2] = $88;
        HEAP32[$10$s2] = (HEAPU8[$84 + ($85 + 1) | 0] ^ $88 << HEAP32[$11 >> 2]) & HEAP32[$12 >> 2];
        var $str_0 = $84;
        var $99 = $79;
        var $_pr103 = $78;
        while (1) {
          var $_pr103;
          var $99;
          var $str_0;
          if (($99 | 0) == 0) {
            var $130 = $_pr103;
            break L152;
          }
          var $112 = (HEAPU8[HEAP32[$8$s2] + $str_0 + 2 | 0] ^ HEAP32[$10$s2] << HEAP32[$11 >> 2]) & HEAP32[$12 >> 2];
          HEAP32[$10$s2] = $112;
          HEAP16[HEAP32[$15 >> 2] + ((HEAP32[$14 >> 2] & $str_0) << 1) >> 1] = HEAP16[HEAP32[$13$s2] + ($112 << 1) >> 1];
          HEAP16[HEAP32[$13$s2] + (HEAP32[$10$s2] << 1) >> 1] = $str_0 & 65535;
          var $126 = HEAP32[$9$s2] - 1 | 0;
          HEAP32[$9$s2] = $126;
          var $127 = HEAP32[$4$s2];
          if (($127 + $126 | 0) >>> 0 < 3) {
            var $130 = $127;
            break L152;
          } else {
            var $str_0 = $str_0 + 1 | 0;
            var $99 = $126;
            var $_pr103 = $127;
          }
        }
      } else {
        var $130 = $78;
      }
    } while (0);
    var $130;
    if ($130 >>> 0 >= 262) {
      break;
    }
    if ((HEAP32[HEAP32[$7 >> 2] + 4 >> 2] | 0) == 0) {
      break;
    }
    var $21 = $130;
    var $20 = HEAP32[$1 >> 2];
  }
  var $137$s2 = ($s + 5824 | 0) >> 2;
  var $138 = HEAP32[$137$s2];
  var $139 = HEAP32[$3 >> 2];
  if ($138 >>> 0 >= $139 >>> 0) {
    return;
  }
  var $144 = HEAP32[$4$s2] + HEAP32[$5$s2] | 0;
  if ($138 >>> 0 < $144 >>> 0) {
    var $147 = $139 - $144 | 0;
    var $_ = $147 >>> 0 > 258 ? 258 : $147;
    _memset(HEAP32[$8$s2] + $144 | 0, 0, $_, 1);
    HEAP32[$137$s2] = $_ + $144 | 0;
    return;
  }
  var $153 = $144 + 258 | 0;
  if ($138 >>> 0 >= $153 >>> 0) {
    return;
  }
  var $156 = $153 - $138 | 0;
  var $157 = $139 - $138 | 0;
  var $_102 = $156 >>> 0 > $157 >>> 0 ? $157 : $156;
  _memset(HEAP32[$8$s2] + $138 | 0, 0, $_102, 1);
  HEAP32[$137$s2] = HEAP32[$137$s2] + $_102 | 0;
  return;
}
_fill_window["X"] = 1;
function _deflateResetKeep($strm) {
  var $4$s2;
  var $strm$s2 = $strm >> 2;
  if (($strm | 0) == 0) {
    var $_0 = -2;
    var $_0;
    return $_0;
  }
  var $4 = HEAP32[$strm$s2 + 7], $4$s2 = $4 >> 2;
  if (($4 | 0) == 0) {
    var $_0 = -2;
    var $_0;
    return $_0;
  }
  if ((HEAP32[$strm$s2 + 8] | 0) == 0) {
    var $_0 = -2;
    var $_0;
    return $_0;
  }
  if ((HEAP32[$strm$s2 + 9] | 0) == 0) {
    var $_0 = -2;
    var $_0;
    return $_0;
  }
  HEAP32[$strm$s2 + 5] = 0;
  HEAP32[$strm$s2 + 2] = 0;
  HEAP32[$strm$s2 + 6] = 0;
  HEAP32[$strm$s2 + 11] = 2;
  HEAP32[$4$s2 + 5] = 0;
  HEAP32[$4$s2 + 4] = HEAP32[$4$s2 + 2];
  var $23 = $4 + 24 | 0;
  var $24 = HEAP32[$23 >> 2];
  if (($24 | 0) < 0) {
    var $27 = -$24 | 0;
    HEAP32[$23 >> 2] = $27;
    var $29 = $27;
  } else {
    var $29 = $24;
  }
  var $29;
  HEAP32[$4$s2 + 1] = ($29 | 0) != 0 ? 42 : 113;
  if (($29 | 0) == 2) {
    var $39 = _crc32(0, 0, 0);
  } else {
    var $39 = _adler32(0, 0, 0);
  }
  var $39;
  HEAP32[$strm$s2 + 12] = $39;
  HEAP32[$4$s2 + 10] = 0;
  __tr_init($4);
  var $_0 = 0;
  var $_0;
  return $_0;
}
_deflateResetKeep["X"] = 1;
function _lm_init($s) {
  var $s$s2 = $s >> 2;
  HEAP32[$s$s2 + 15] = HEAP32[$s$s2 + 11] << 1;
  var $5 = $s + 76 | 0;
  var $8 = $s + 68 | 0;
  HEAP16[HEAP32[$8 >> 2] + (HEAP32[$5 >> 2] - 1 << 1) >> 1] = 0;
  _memset(HEAP32[$8 >> 2], 0, (HEAP32[$5 >> 2] << 1) - 2 | 0, 1);
  var $17 = HEAP32[$s$s2 + 33];
  HEAP32[$s$s2 + 32] = HEAPU16[($17 * 6 | 0) + 2627607];
  HEAP32[$s$s2 + 35] = HEAPU16[($17 * 6 | 0) + 2627606];
  HEAP32[$s$s2 + 36] = HEAPU16[($17 * 6 | 0) + 2627608];
  HEAP32[$s$s2 + 31] = HEAPU16[($17 * 6 | 0) + 2627609];
  HEAP32[$s$s2 + 27] = 0;
  HEAP32[$s$s2 + 23] = 0;
  HEAP32[$s$s2 + 29] = 0;
  HEAP32[$s$s2 + 1453] = 0;
  HEAP32[$s$s2 + 30] = 2;
  HEAP32[$s$s2 + 24] = 2;
  HEAP32[$s$s2 + 26] = 0;
  HEAP32[$s$s2 + 18] = 0;
  return;
}
_lm_init["X"] = 1;
function _deflate($strm, $flush) {
  var $623$s2;
  var $599$s2;
  var $593$s2;
  var $588$s2;
  var $499$s2;
  var $483$s2;
  var $470$s2;
  var $410$s2;
  var $409$s2;
  var $406$s2;
  var $346$s2;
  var $345$s2;
  var $344$s2;
  var $341$s2;
  var $_pre_phi368$s2;
  var $336$s2;
  var $263$s2;
  var $261$s2;
  var $_pre_phi$s2;
  var $59$s2;
  var $58$s2;
  var $47$s2;
  var $44$s2;
  var $43$s2;
  var $_pre372$s2;
  var $34$s2;
  var $27$s2;
  var $20$s2;
  var $4$s2;
  var $strm$s2 = $strm >> 2;
  var label = 0;
  if (($strm | 0) == 0) {
    var $_0 = -2;
    var $_0;
    return $_0;
  }
  var $4 = HEAP32[$strm$s2 + 7], $4$s2 = $4 >> 2;
  if (($4 | 0) == 0 | $flush >>> 0 > 5) {
    var $_0 = -2;
    var $_0;
    return $_0;
  }
  do {
    if ((HEAP32[$strm$s2 + 3] | 0) != 0) {
      if ((HEAP32[$strm$s2] | 0) == 0) {
        if ((HEAP32[$strm$s2 + 1] | 0) != 0) {
          break;
        }
      }
      var $20$s2 = ($4 + 4 | 0) >> 2;
      var $21 = HEAP32[$20$s2];
      var $23 = ($flush | 0) == 4;
      if (!(($21 | 0) != 666 | $23)) {
        break;
      }
      var $27$s2 = ($strm + 16 | 0) >> 2;
      if ((HEAP32[$27$s2] | 0) == 0) {
        HEAP32[$strm$s2 + 6] = 5255716 | 0;
        var $_0 = -5;
        var $_0;
        return $_0;
      }
      HEAP32[$4$s2] = $strm;
      var $34$s2 = ($4 + 40 | 0) >> 2;
      var $35 = HEAP32[$34$s2];
      HEAP32[$34$s2] = $flush;
      do {
        if (($21 | 0) == 42) {
          if ((HEAP32[$4$s2 + 6] | 0) != 2) {
            var $223 = (HEAP32[$4$s2 + 12] << 12) - 30720 | 0;
            do {
              if ((HEAP32[$4$s2 + 34] | 0) > 1) {
                var $level_flags_0 = 0;
              } else {
                var $229 = HEAP32[$4$s2 + 33];
                if (($229 | 0) < 2) {
                  var $level_flags_0 = 0;
                  break;
                }
                if (($229 | 0) < 6) {
                  var $level_flags_0 = 64;
                  break;
                }
                var $level_flags_0 = ($229 | 0) == 6 ? 128 : 192;
              }
            } while (0);
            var $level_flags_0;
            var $236 = $level_flags_0 | $223;
            var $237 = $4 + 108 | 0;
            var $241 = (HEAP32[$237 >> 2] | 0) == 0 ? $236 : $236 | 32;
            HEAP32[$20$s2] = 113;
            _putShortMSB($4, ($241 | ($241 >>> 0) % 31) ^ 31);
            var $_pre372$s2 = ($strm + 48 | 0) >> 2;
            if ((HEAP32[$237 >> 2] | 0) != 0) {
              _putShortMSB($4, HEAP32[$_pre372$s2] >>> 16);
              _putShortMSB($4, HEAP32[$_pre372$s2] & 65535);
            }
            HEAP32[$_pre372$s2] = _adler32(0, 0, 0);
            var $253 = HEAP32[$20$s2];
            label = 187;
            break;
          }
          var $43$s2 = ($strm + 48 | 0) >> 2;
          HEAP32[$43$s2] = _crc32(0, 0, 0);
          var $44$s2 = ($4 + 20 | 0) >> 2;
          var $45 = HEAP32[$44$s2];
          HEAP32[$44$s2] = $45 + 1 | 0;
          var $47$s2 = ($4 + 8 | 0) >> 2;
          HEAP8[HEAP32[$47$s2] + $45 | 0] = 31;
          var $50 = HEAP32[$44$s2];
          HEAP32[$44$s2] = $50 + 1 | 0;
          HEAP8[HEAP32[$47$s2] + $50 | 0] = -117;
          var $54 = HEAP32[$44$s2];
          HEAP32[$44$s2] = $54 + 1 | 0;
          HEAP8[HEAP32[$47$s2] + $54 | 0] = 8;
          var $58 = $4 + 28 | 0, $58$s2 = $58 >> 2;
          var $59 = HEAP32[$58$s2], $59$s2 = $59 >> 2;
          if (($59 | 0) == 0) {
            var $62 = HEAP32[$44$s2];
            HEAP32[$44$s2] = $62 + 1 | 0;
            HEAP8[HEAP32[$47$s2] + $62 | 0] = 0;
            var $66 = HEAP32[$44$s2];
            HEAP32[$44$s2] = $66 + 1 | 0;
            HEAP8[HEAP32[$47$s2] + $66 | 0] = 0;
            var $70 = HEAP32[$44$s2];
            HEAP32[$44$s2] = $70 + 1 | 0;
            HEAP8[HEAP32[$47$s2] + $70 | 0] = 0;
            var $74 = HEAP32[$44$s2];
            HEAP32[$44$s2] = $74 + 1 | 0;
            HEAP8[HEAP32[$47$s2] + $74 | 0] = 0;
            var $78 = HEAP32[$44$s2];
            HEAP32[$44$s2] = $78 + 1 | 0;
            HEAP8[HEAP32[$47$s2] + $78 | 0] = 0;
            var $83 = HEAP32[$4$s2 + 33];
            do {
              if (($83 | 0) == 9) {
                var $91 = 2;
              } else {
                if ((HEAP32[$4$s2 + 34] | 0) > 1) {
                  var $91 = 4;
                  break;
                }
                var $91 = ($83 | 0) < 2 ? 4 : 0;
              }
            } while (0);
            var $91;
            var $92 = HEAP32[$44$s2];
            HEAP32[$44$s2] = $92 + 1 | 0;
            HEAP8[HEAP32[$47$s2] + $92 | 0] = $91;
            var $96 = HEAP32[$44$s2];
            HEAP32[$44$s2] = $96 + 1 | 0;
            HEAP8[HEAP32[$47$s2] + $96 | 0] = 3;
            HEAP32[$20$s2] = 113;
            break;
          }
          var $124 = ((HEAP32[$59$s2 + 11] | 0) != 0 ? 2 : 0) | (HEAP32[$59$s2] | 0) != 0 & 1 | ((HEAP32[$59$s2 + 4] | 0) == 0 ? 0 : 4) | ((HEAP32[$59$s2 + 7] | 0) == 0 ? 0 : 8) | ((HEAP32[$59$s2 + 9] | 0) == 0 ? 0 : 16);
          var $125 = HEAP32[$44$s2];
          HEAP32[$44$s2] = $125 + 1 | 0;
          HEAP8[HEAP32[$47$s2] + $125 | 0] = $124;
          var $132 = HEAP32[HEAP32[$58$s2] + 4 >> 2] & 255;
          var $133 = HEAP32[$44$s2];
          HEAP32[$44$s2] = $133 + 1 | 0;
          HEAP8[HEAP32[$47$s2] + $133 | 0] = $132;
          var $141 = HEAP32[HEAP32[$58$s2] + 4 >> 2] >>> 8 & 255;
          var $142 = HEAP32[$44$s2];
          HEAP32[$44$s2] = $142 + 1 | 0;
          HEAP8[HEAP32[$47$s2] + $142 | 0] = $141;
          var $150 = HEAP32[HEAP32[$58$s2] + 4 >> 2] >>> 16 & 255;
          var $151 = HEAP32[$44$s2];
          HEAP32[$44$s2] = $151 + 1 | 0;
          HEAP8[HEAP32[$47$s2] + $151 | 0] = $150;
          var $159 = HEAP32[HEAP32[$58$s2] + 4 >> 2] >>> 24 & 255;
          var $160 = HEAP32[$44$s2];
          HEAP32[$44$s2] = $160 + 1 | 0;
          HEAP8[HEAP32[$47$s2] + $160 | 0] = $159;
          var $165 = HEAP32[$4$s2 + 33];
          do {
            if (($165 | 0) == 9) {
              var $174 = 2;
            } else {
              if ((HEAP32[$4$s2 + 34] | 0) > 1) {
                var $174 = 4;
                break;
              }
              var $174 = ($165 | 0) < 2 ? 4 : 0;
            }
          } while (0);
          var $174;
          var $175 = HEAP32[$44$s2];
          HEAP32[$44$s2] = $175 + 1 | 0;
          HEAP8[HEAP32[$47$s2] + $175 | 0] = $174;
          var $182 = HEAP32[HEAP32[$58$s2] + 12 >> 2] & 255;
          var $183 = HEAP32[$44$s2];
          HEAP32[$44$s2] = $183 + 1 | 0;
          HEAP8[HEAP32[$47$s2] + $183 | 0] = $182;
          var $187 = HEAP32[$58$s2];
          if ((HEAP32[$187 + 16 >> 2] | 0) == 0) {
            var $209 = $187;
          } else {
            var $194 = HEAP32[$187 + 20 >> 2] & 255;
            var $195 = HEAP32[$44$s2];
            HEAP32[$44$s2] = $195 + 1 | 0;
            HEAP8[HEAP32[$47$s2] + $195 | 0] = $194;
            var $203 = HEAP32[HEAP32[$58$s2] + 20 >> 2] >>> 8 & 255;
            var $204 = HEAP32[$44$s2];
            HEAP32[$44$s2] = $204 + 1 | 0;
            HEAP8[HEAP32[$47$s2] + $204 | 0] = $203;
            var $209 = HEAP32[$58$s2];
          }
          var $209;
          if ((HEAP32[$209 + 44 >> 2] | 0) != 0) {
            HEAP32[$43$s2] = _crc32(HEAP32[$43$s2], HEAP32[$47$s2], HEAP32[$44$s2]);
          }
          HEAP32[$4$s2 + 8] = 0;
          HEAP32[$20$s2] = 69;
          var $_pre_phi = $58, $_pre_phi$s2 = $_pre_phi >> 2;
          label = 189;
          break;
        } else {
          var $253 = $21;
          label = 187;
        }
      } while (0);
      do {
        if (label == 187) {
          var $253;
          if (($253 | 0) != 69) {
            var $_pr317_pr = $253;
            label = 207;
            break;
          }
          var $_pre_phi = $4 + 28 | 0, $_pre_phi$s2 = $_pre_phi >> 2;
          label = 189;
          break;
        }
      } while (0);
      do {
        if (label == 189) {
          var $_pre_phi;
          var $256 = HEAP32[$_pre_phi$s2];
          if ((HEAP32[$256 + 16 >> 2] | 0) == 0) {
            HEAP32[$20$s2] = 73;
            var $335 = $256;
            label = 209;
            break;
          }
          var $261$s2 = ($4 + 20 | 0) >> 2;
          var $262 = HEAP32[$261$s2];
          var $263$s2 = ($4 + 32 | 0) >> 2;
          var $264 = HEAP32[$263$s2];
          var $268 = $264 >>> 0 < (HEAP32[$256 + 20 >> 2] & 65535) >>> 0;
          L249 : do {
            if ($268) {
              var $269 = $4 + 12 | 0;
              var $270 = $strm + 48 | 0;
              var $271 = $4 + 8 | 0;
              var $beg_0331 = $262;
              var $275 = $256;
              var $274 = $262;
              var $273 = $264;
              while (1) {
                var $273;
                var $274;
                var $275;
                var $beg_0331;
                if (($274 | 0) == (HEAP32[$269 >> 2] | 0)) {
                  if ((HEAP32[$275 + 44 >> 2] | 0) != 0 & $274 >>> 0 > $beg_0331 >>> 0) {
                    HEAP32[$270 >> 2] = _crc32(HEAP32[$270 >> 2], HEAP32[$271 >> 2] + $beg_0331 | 0, $274 - $beg_0331 | 0);
                  }
                  _flush_pending($strm);
                  var $290 = HEAP32[$261$s2];
                  if (($290 | 0) == (HEAP32[$269 >> 2] | 0)) {
                    break;
                  }
                  var $beg_1 = $290;
                  var $296 = $290;
                  var $295 = HEAP32[$263$s2];
                  var $294 = HEAP32[$_pre_phi$s2];
                } else {
                  var $beg_1 = $beg_0331;
                  var $296 = $274;
                  var $295 = $273;
                  var $294 = $275;
                }
                var $294;
                var $295;
                var $296;
                var $beg_1;
                var $300 = HEAP8[HEAP32[$294 + 16 >> 2] + $295 | 0];
                HEAP32[$261$s2] = $296 + 1 | 0;
                HEAP8[HEAP32[$271 >> 2] + $296 | 0] = $300;
                var $305 = HEAP32[$263$s2] + 1 | 0;
                HEAP32[$263$s2] = $305;
                var $306 = HEAP32[$_pre_phi$s2];
                if ($305 >>> 0 >= (HEAP32[$306 + 20 >> 2] & 65535) >>> 0) {
                  var $beg_2 = $beg_1;
                  var $311 = $306;
                  break L249;
                }
                var $beg_0331 = $beg_1;
                var $275 = $306;
                var $274 = HEAP32[$261$s2];
                var $273 = $305;
              }
              var $beg_2 = $290;
              var $311 = HEAP32[$_pre_phi$s2];
            } else {
              var $beg_2 = $262;
              var $311 = $256;
            }
          } while (0);
          var $311;
          var $beg_2;
          do {
            if ((HEAP32[$311 + 44 >> 2] | 0) == 0) {
              var $326 = $311;
            } else {
              var $316 = HEAP32[$261$s2];
              if ($316 >>> 0 <= $beg_2 >>> 0) {
                var $326 = $311;
                break;
              }
              var $319 = $strm + 48 | 0;
              HEAP32[$319 >> 2] = _crc32(HEAP32[$319 >> 2], HEAP32[$4$s2 + 2] + $beg_2 | 0, $316 - $beg_2 | 0);
              var $326 = HEAP32[$_pre_phi$s2];
            }
          } while (0);
          var $326;
          if ((HEAP32[$263$s2] | 0) == (HEAP32[$326 + 20 >> 2] | 0)) {
            HEAP32[$263$s2] = 0;
            HEAP32[$20$s2] = 73;
            var $335 = $326;
            label = 209;
            break;
          } else {
            var $_pr317_pr = HEAP32[$20$s2];
            label = 207;
            break;
          }
        }
      } while (0);
      do {
        if (label == 207) {
          var $_pr317_pr;
          if (($_pr317_pr | 0) != 73) {
            var $399 = $_pr317_pr;
            label = 224;
            break;
          }
          var $335 = HEAP32[$4$s2 + 7];
          label = 209;
          break;
        }
      } while (0);
      do {
        if (label == 209) {
          var $335;
          var $336 = $4 + 28 | 0, $336$s2 = $336 >> 2;
          if ((HEAP32[$335 + 28 >> 2] | 0) == 0) {
            HEAP32[$20$s2] = 91;
            var $_pre_phi368 = $336, $_pre_phi368$s2 = $_pre_phi368 >> 2;
            label = 226;
            break;
          }
          var $341$s2 = ($4 + 20 | 0) >> 2;
          var $342 = HEAP32[$341$s2];
          var $343 = $4 + 12 | 0;
          var $344$s2 = ($strm + 48 | 0) >> 2;
          var $345$s2 = ($4 + 8 | 0) >> 2;
          var $346$s2 = ($4 + 32 | 0) >> 2;
          var $beg1_0 = $342;
          var $348 = $342;
          while (1) {
            var $348;
            var $beg1_0;
            if (($348 | 0) == (HEAP32[$343 >> 2] | 0)) {
              if ((HEAP32[HEAP32[$336$s2] + 44 >> 2] | 0) != 0 & $348 >>> 0 > $beg1_0 >>> 0) {
                HEAP32[$344$s2] = _crc32(HEAP32[$344$s2], HEAP32[$345$s2] + $beg1_0 | 0, $348 - $beg1_0 | 0);
              }
              _flush_pending($strm);
              var $364 = HEAP32[$341$s2];
              if (($364 | 0) == (HEAP32[$343 >> 2] | 0)) {
                var $val_0 = 1;
                var $beg1_2 = $364;
                break;
              } else {
                var $beg1_1 = $364;
                var $367 = $364;
              }
            } else {
              var $beg1_1 = $beg1_0;
              var $367 = $348;
            }
            var $367;
            var $beg1_1;
            var $368 = HEAP32[$346$s2];
            HEAP32[$346$s2] = $368 + 1 | 0;
            var $374 = HEAP8[HEAP32[HEAP32[$336$s2] + 28 >> 2] + $368 | 0];
            HEAP32[$341$s2] = $367 + 1 | 0;
            HEAP8[HEAP32[$345$s2] + $367 | 0] = $374;
            if ($374 << 24 >> 24 == 0) {
              var $val_0 = $374 & 255;
              var $beg1_2 = $beg1_1;
              break;
            }
            var $beg1_0 = $beg1_1;
            var $348 = HEAP32[$341$s2];
          }
          var $beg1_2;
          var $val_0;
          do {
            if ((HEAP32[HEAP32[$336$s2] + 44 >> 2] | 0) != 0) {
              var $386 = HEAP32[$341$s2];
              if ($386 >>> 0 <= $beg1_2 >>> 0) {
                break;
              }
              HEAP32[$344$s2] = _crc32(HEAP32[$344$s2], HEAP32[$345$s2] + $beg1_2 | 0, $386 - $beg1_2 | 0);
            }
          } while (0);
          if (($val_0 | 0) == 0) {
            HEAP32[$346$s2] = 0;
            HEAP32[$20$s2] = 91;
            var $_pre_phi368 = $336, $_pre_phi368$s2 = $_pre_phi368 >> 2;
            label = 226;
            break;
          } else {
            var $399 = HEAP32[$20$s2];
            label = 224;
            break;
          }
        }
      } while (0);
      do {
        if (label == 224) {
          var $399;
          if (($399 | 0) != 91) {
            var $_pr323_pr = $399;
            label = 241;
            break;
          }
          var $_pre_phi368 = $4 + 28 | 0, $_pre_phi368$s2 = $_pre_phi368 >> 2;
          label = 226;
          break;
        }
      } while (0);
      do {
        if (label == 226) {
          var $_pre_phi368;
          if ((HEAP32[HEAP32[$_pre_phi368$s2] + 36 >> 2] | 0) == 0) {
            HEAP32[$20$s2] = 103;
            var $_pre_phi370 = $_pre_phi368;
            label = 243;
            break;
          }
          var $406$s2 = ($4 + 20 | 0) >> 2;
          var $407 = HEAP32[$406$s2];
          var $408 = $4 + 12 | 0;
          var $409$s2 = ($strm + 48 | 0) >> 2;
          var $410$s2 = ($4 + 8 | 0) >> 2;
          var $411 = $4 + 32 | 0;
          var $beg2_0 = $407;
          var $413 = $407;
          while (1) {
            var $413;
            var $beg2_0;
            if (($413 | 0) == (HEAP32[$408 >> 2] | 0)) {
              if ((HEAP32[HEAP32[$_pre_phi368$s2] + 44 >> 2] | 0) != 0 & $413 >>> 0 > $beg2_0 >>> 0) {
                HEAP32[$409$s2] = _crc32(HEAP32[$409$s2], HEAP32[$410$s2] + $beg2_0 | 0, $413 - $beg2_0 | 0);
              }
              _flush_pending($strm);
              var $429 = HEAP32[$406$s2];
              if (($429 | 0) == (HEAP32[$408 >> 2] | 0)) {
                var $val3_0 = 1;
                var $beg2_2 = $429;
                break;
              } else {
                var $beg2_1 = $429;
                var $432 = $429;
              }
            } else {
              var $beg2_1 = $beg2_0;
              var $432 = $413;
            }
            var $432;
            var $beg2_1;
            var $433 = HEAP32[$411 >> 2];
            HEAP32[$411 >> 2] = $433 + 1 | 0;
            var $439 = HEAP8[HEAP32[HEAP32[$_pre_phi368$s2] + 36 >> 2] + $433 | 0];
            HEAP32[$406$s2] = $432 + 1 | 0;
            HEAP8[HEAP32[$410$s2] + $432 | 0] = $439;
            if ($439 << 24 >> 24 == 0) {
              var $val3_0 = $439 & 255;
              var $beg2_2 = $beg2_1;
              break;
            }
            var $beg2_0 = $beg2_1;
            var $413 = HEAP32[$406$s2];
          }
          var $beg2_2;
          var $val3_0;
          do {
            if ((HEAP32[HEAP32[$_pre_phi368$s2] + 44 >> 2] | 0) != 0) {
              var $451 = HEAP32[$406$s2];
              if ($451 >>> 0 <= $beg2_2 >>> 0) {
                break;
              }
              HEAP32[$409$s2] = _crc32(HEAP32[$409$s2], HEAP32[$410$s2] + $beg2_2 | 0, $451 - $beg2_2 | 0);
            }
          } while (0);
          if (($val3_0 | 0) == 0) {
            HEAP32[$20$s2] = 103;
            var $_pre_phi370 = $_pre_phi368;
            label = 243;
            break;
          } else {
            var $_pr323_pr = HEAP32[$20$s2];
            label = 241;
            break;
          }
        }
      } while (0);
      do {
        if (label == 241) {
          var $_pr323_pr;
          if (($_pr323_pr | 0) != 103) {
            break;
          }
          var $_pre_phi370 = $4 + 28 | 0;
          label = 243;
          break;
        }
      } while (0);
      do {
        if (label == 243) {
          var $_pre_phi370;
          if ((HEAP32[HEAP32[$_pre_phi370 >> 2] + 44 >> 2] | 0) == 0) {
            HEAP32[$20$s2] = 113;
            break;
          }
          var $470$s2 = ($4 + 20 | 0) >> 2;
          var $471 = HEAP32[$470$s2];
          var $473 = $4 + 12 | 0;
          var $474 = HEAP32[$473 >> 2];
          if (($471 + 2 | 0) >>> 0 > $474 >>> 0) {
            _flush_pending($strm);
            var $479 = HEAP32[$470$s2];
            var $478 = HEAP32[$473 >> 2];
          } else {
            var $479 = $471;
            var $478 = $474;
          }
          var $478;
          var $479;
          if (($479 + 2 | 0) >>> 0 > $478 >>> 0) {
            break;
          }
          var $483$s2 = ($strm + 48 | 0) >> 2;
          var $485 = HEAP32[$483$s2] & 255;
          HEAP32[$470$s2] = $479 + 1 | 0;
          var $487 = $4 + 8 | 0;
          HEAP8[HEAP32[$487 >> 2] + $479 | 0] = $485;
          var $492 = HEAP32[$483$s2] >>> 8 & 255;
          var $493 = HEAP32[$470$s2];
          HEAP32[$470$s2] = $493 + 1 | 0;
          HEAP8[HEAP32[$487 >> 2] + $493 | 0] = $492;
          HEAP32[$483$s2] = _crc32(0, 0, 0);
          HEAP32[$20$s2] = 113;
        }
      } while (0);
      var $499$s2 = ($4 + 20 | 0) >> 2;
      do {
        if ((HEAP32[$499$s2] | 0) == 0) {
          var $508 = HEAP32[$strm$s2 + 1];
          if (($508 | 0) != 0) {
            var $522 = $508;
            break;
          }
          if ((($flush << 1) - (($flush | 0) > 4 ? 9 : 0) | 0) > (($35 << 1) - (($35 | 0) > 4 ? 9 : 0) | 0) | $23) {
            var $522 = 0;
            break;
          }
          HEAP32[$strm$s2 + 6] = 5255716 | 0;
          var $_0 = -5;
          var $_0;
          return $_0;
        } else {
          _flush_pending($strm);
          if ((HEAP32[$27$s2] | 0) != 0) {
            var $522 = HEAP32[$strm$s2 + 1];
            break;
          }
          HEAP32[$34$s2] = -1;
          var $_0 = 0;
          var $_0;
          return $_0;
        }
      } while (0);
      var $522;
      var $524 = (HEAP32[$20$s2] | 0) == 666;
      var $525 = ($522 | 0) == 0;
      do {
        if ($524) {
          if ($525) {
            label = 260;
            break;
          }
          HEAP32[$strm$s2 + 6] = 5255716 | 0;
          var $_0 = -5;
          var $_0;
          return $_0;
        } else {
          if ($525) {
            label = 260;
            break;
          } else {
            label = 263;
            break;
          }
        }
      } while (0);
      do {
        if (label == 260) {
          if ((HEAP32[$4$s2 + 29] | 0) != 0) {
            label = 263;
            break;
          }
          if (($flush | 0) == 0) {
            var $_0 = 0;
            var $_0;
            return $_0;
          } else {
            if ($524) {
              break;
            } else {
              label = 263;
              break;
            }
          }
        }
      } while (0);
      do {
        if (label == 263) {
          var $537 = HEAP32[$4$s2 + 34];
          if (($537 | 0) == 2) {
            var $549 = _deflate_huff($4, $flush);
          } else if (($537 | 0) == 3) {
            var $549 = _deflate_rle($4, $flush);
          } else {
            var $549 = FUNCTION_TABLE[HEAP32[(HEAP32[$4$s2 + 33] * 3 | 0) + 1313805]]($4, $flush);
          }
          var $549;
          if (($549 - 2 | 0) >>> 0 < 2) {
            HEAP32[$20$s2] = 666;
          }
          if (($549 | 0) == 2 || ($549 | 0) == 0) {
            if ((HEAP32[$27$s2] | 0) != 0) {
              var $_0 = 0;
              var $_0;
              return $_0;
            }
            HEAP32[$34$s2] = -1;
            var $_0 = 0;
            var $_0;
            return $_0;
          } else if (($549 | 0) != 1) {
            break;
          }
          do {
            if (($flush | 0) == 1) {
              __tr_align($4);
            } else if (($flush | 0) != 5) {
              __tr_stored_block($4, 0, 0, 0);
              if (($flush | 0) != 3) {
                break;
              }
              var $564 = $4 + 76 | 0;
              var $567 = $4 + 68 | 0;
              HEAP16[HEAP32[$567 >> 2] + (HEAP32[$564 >> 2] - 1 << 1) >> 1] = 0;
              _memset(HEAP32[$567 >> 2], 0, (HEAP32[$564 >> 2] << 1) - 2 | 0, 1);
              if ((HEAP32[$4$s2 + 29] | 0) != 0) {
                break;
              }
              HEAP32[$4$s2 + 27] = 0;
              HEAP32[$4$s2 + 23] = 0;
              HEAP32[$4$s2 + 1453] = 0;
            }
          } while (0);
          _flush_pending($strm);
          if ((HEAP32[$27$s2] | 0) != 0) {
            break;
          }
          HEAP32[$34$s2] = -1;
          var $_0 = 0;
          var $_0;
          return $_0;
        }
      } while (0);
      if (!$23) {
        var $_0 = 0;
        var $_0;
        return $_0;
      }
      var $588$s2 = ($4 + 24 | 0) >> 2;
      var $589 = HEAP32[$588$s2];
      if (($589 | 0) < 1) {
        var $_0 = 1;
        var $_0;
        return $_0;
      }
      var $593$s2 = ($strm + 48 | 0) >> 2;
      var $594 = HEAP32[$593$s2];
      if (($589 | 0) == 2) {
        var $597 = HEAP32[$499$s2];
        HEAP32[$499$s2] = $597 + 1 | 0;
        var $599$s2 = ($4 + 8 | 0) >> 2;
        HEAP8[HEAP32[$599$s2] + $597 | 0] = $594 & 255;
        var $604 = HEAP32[$593$s2] >>> 8 & 255;
        var $605 = HEAP32[$499$s2];
        HEAP32[$499$s2] = $605 + 1 | 0;
        HEAP8[HEAP32[$599$s2] + $605 | 0] = $604;
        var $611 = HEAP32[$593$s2] >>> 16 & 255;
        var $612 = HEAP32[$499$s2];
        HEAP32[$499$s2] = $612 + 1 | 0;
        HEAP8[HEAP32[$599$s2] + $612 | 0] = $611;
        var $618 = HEAP32[$593$s2] >>> 24 & 255;
        var $619 = HEAP32[$499$s2];
        HEAP32[$499$s2] = $619 + 1 | 0;
        HEAP8[HEAP32[$599$s2] + $619 | 0] = $618;
        var $623$s2 = ($strm + 8 | 0) >> 2;
        var $625 = HEAP32[$623$s2] & 255;
        var $626 = HEAP32[$499$s2];
        HEAP32[$499$s2] = $626 + 1 | 0;
        HEAP8[HEAP32[$599$s2] + $626 | 0] = $625;
        var $632 = HEAP32[$623$s2] >>> 8 & 255;
        var $633 = HEAP32[$499$s2];
        HEAP32[$499$s2] = $633 + 1 | 0;
        HEAP8[HEAP32[$599$s2] + $633 | 0] = $632;
        var $639 = HEAP32[$623$s2] >>> 16 & 255;
        var $640 = HEAP32[$499$s2];
        HEAP32[$499$s2] = $640 + 1 | 0;
        HEAP8[HEAP32[$599$s2] + $640 | 0] = $639;
        var $646 = HEAP32[$623$s2] >>> 24 & 255;
        var $647 = HEAP32[$499$s2];
        HEAP32[$499$s2] = $647 + 1 | 0;
        HEAP8[HEAP32[$599$s2] + $647 | 0] = $646;
      } else {
        _putShortMSB($4, $594 >>> 16);
        _putShortMSB($4, HEAP32[$593$s2] & 65535);
      }
      _flush_pending($strm);
      var $656 = HEAP32[$588$s2];
      if (($656 | 0) > 0) {
        HEAP32[$588$s2] = -$656 | 0;
      }
      var $_0 = (HEAP32[$499$s2] | 0) == 0 & 1;
      var $_0;
      return $_0;
    }
  } while (0);
  HEAP32[$strm$s2 + 6] = 5255912 | 0;
  var $_0 = -2;
  var $_0;
  return $_0;
}
_deflate["X"] = 1;
function _putShortMSB($s, $b) {
  var $3$s2;
  var $3$s2 = ($s + 20 | 0) >> 2;
  var $4 = HEAP32[$3$s2];
  HEAP32[$3$s2] = $4 + 1 | 0;
  var $6 = $s + 8 | 0;
  HEAP8[HEAP32[$6 >> 2] + $4 | 0] = $b >>> 8 & 255;
  var $10 = HEAP32[$3$s2];
  HEAP32[$3$s2] = $10 + 1 | 0;
  HEAP8[HEAP32[$6 >> 2] + $10 | 0] = $b & 255;
  return;
}
function _flush_pending($strm) {
  var $13$s2;
  var $11$s2;
  var $6$s2;
  var $4$s2;
  var $2 = HEAP32[$strm + 28 >> 2];
  __tr_flush_bits($2);
  var $4$s2 = ($2 + 20 | 0) >> 2;
  var $5 = HEAP32[$4$s2];
  var $6$s2 = ($strm + 16 | 0) >> 2;
  var $7 = HEAP32[$6$s2];
  var $_ = $5 >>> 0 > $7 >>> 0 ? $7 : $5;
  if (($_ | 0) == 0) {
    return;
  }
  var $11$s2 = ($strm + 12 | 0) >> 2;
  var $13$s2 = ($2 + 16 | 0) >> 2;
  _memcpy(HEAP32[$11$s2], HEAP32[$13$s2], $_, 1);
  HEAP32[$11$s2] = HEAP32[$11$s2] + $_ | 0;
  HEAP32[$13$s2] = HEAP32[$13$s2] + $_ | 0;
  var $19 = $strm + 20 | 0;
  HEAP32[$19 >> 2] = HEAP32[$19 >> 2] + $_ | 0;
  HEAP32[$6$s2] = HEAP32[$6$s2] - $_ | 0;
  var $24 = HEAP32[$4$s2];
  HEAP32[$4$s2] = $24 - $_ | 0;
  if (($24 | 0) != ($_ | 0)) {
    return;
  }
  HEAP32[$13$s2] = HEAP32[$2 + 8 >> 2];
  return;
}
function _deflate_huff($s, $flush) {
  var $11$s2;
  var $9$s2;
  var $5$s2;
  var $4$s2;
  var $3$s2;
  var $1$s2;
  var label = 0;
  var $1$s2 = ($s + 116 | 0) >> 2;
  var $2 = $s + 96 | 0;
  var $3$s2 = ($s + 108 | 0) >> 2;
  var $4$s2 = ($s + 56 | 0) >> 2;
  var $5$s2 = ($s + 5792 | 0) >> 2;
  var $6 = $s + 5796 | 0;
  var $7 = $s + 5784 | 0;
  var $8 = $s + 5788 | 0;
  var $9$s2 = ($s + 92 | 0) >> 2;
  var $10 = $s;
  var $11$s2 = ($s | 0) >> 2;
  while (1) {
    if ((HEAP32[$1$s2] | 0) == 0) {
      _fill_window($s);
      if ((HEAP32[$1$s2] | 0) == 0) {
        break;
      }
    }
    HEAP32[$2 >> 2] = 0;
    var $22 = HEAP8[HEAP32[$4$s2] + HEAP32[$3$s2] | 0];
    HEAP16[HEAP32[$6 >> 2] + (HEAP32[$5$s2] << 1) >> 1] = 0;
    var $26 = HEAP32[$5$s2];
    HEAP32[$5$s2] = $26 + 1 | 0;
    HEAP8[HEAP32[$7 >> 2] + $26 | 0] = $22;
    var $31 = (($22 & 255) << 2) + $s + 148 | 0;
    HEAP16[$31 >> 1] = HEAP16[$31 >> 1] + 1 & 65535;
    var $37 = (HEAP32[$5$s2] | 0) == (HEAP32[$8 >> 2] - 1 | 0);
    HEAP32[$1$s2] = HEAP32[$1$s2] - 1 | 0;
    var $41 = HEAP32[$3$s2] + 1 | 0;
    HEAP32[$3$s2] = $41;
    if (!$37) {
      continue;
    }
    var $43 = HEAP32[$9$s2];
    if (($43 | 0) > -1) {
      var $49 = HEAP32[$4$s2] + $43 | 0;
    } else {
      var $49 = 0;
    }
    var $49;
    __tr_flush_block($10, $49, $41 - $43 | 0, 0);
    HEAP32[$9$s2] = HEAP32[$3$s2];
    _flush_pending(HEAP32[$11$s2]);
    if ((HEAP32[HEAP32[$11$s2] + 16 >> 2] | 0) == 0) {
      var $_0 = 0;
      label = 330;
      break;
    }
  }
  if (label == 330) {
    var $_0;
    return $_0;
  }
  if (($flush | 0) == 0) {
    var $_0 = 0;
    var $_0;
    return $_0;
  }
  HEAP32[$s + 5812 >> 2] = 0;
  if (($flush | 0) == 4) {
    var $61 = HEAP32[$9$s2];
    if (($61 | 0) > -1) {
      var $67 = HEAP32[$4$s2] + $61 | 0;
    } else {
      var $67 = 0;
    }
    var $67;
    __tr_flush_block($10, $67, HEAP32[$3$s2] - $61 | 0, 1);
    HEAP32[$9$s2] = HEAP32[$3$s2];
    _flush_pending(HEAP32[$11$s2]);
    var $_0 = (HEAP32[HEAP32[$11$s2] + 16 >> 2] | 0) == 0 ? 2 : 3;
    var $_0;
    return $_0;
  }
  do {
    if ((HEAP32[$5$s2] | 0) != 0) {
      var $80 = HEAP32[$9$s2];
      if (($80 | 0) > -1) {
        var $86 = HEAP32[$4$s2] + $80 | 0;
      } else {
        var $86 = 0;
      }
      var $86;
      __tr_flush_block($10, $86, HEAP32[$3$s2] - $80 | 0, 0);
      HEAP32[$9$s2] = HEAP32[$3$s2];
      _flush_pending(HEAP32[$11$s2]);
      if ((HEAP32[HEAP32[$11$s2] + 16 >> 2] | 0) == 0) {
        var $_0 = 0;
      } else {
        break;
      }
      var $_0;
      return $_0;
    }
  } while (0);
  var $_0 = 1;
  var $_0;
  return $_0;
}
_deflate_huff["X"] = 1;
function _deflate_rle($s, $flush) {
  var $13$s2;
  var $11$s2;
  var $10$s2;
  var $5$s2;
  var $4$s2;
  var $3$s2;
  var $1$s2;
  var label = 0;
  var $1$s2 = ($s + 116 | 0) >> 2;
  var $2 = ($flush | 0) == 0;
  var $3$s2 = ($s + 96 | 0) >> 2;
  var $4$s2 = ($s + 108 | 0) >> 2;
  var $5$s2 = ($s + 5792 | 0) >> 2;
  var $6 = $s + 5796 | 0;
  var $7 = $s + 5784 | 0;
  var $8 = $s + 2440 | 0;
  var $9 = $s + 5788 | 0;
  var $10$s2 = ($s + 56 | 0) >> 2;
  var $11$s2 = ($s + 92 | 0) >> 2;
  var $12 = $s;
  var $13$s2 = ($s | 0) >> 2;
  L438 : while (1) {
    var $14 = HEAP32[$1$s2];
    do {
      if ($14 >>> 0 < 259) {
        _fill_window($s);
        var $17 = HEAP32[$1$s2];
        if ($17 >>> 0 < 259 & $2) {
          var $_0 = 0;
          label = 372;
          break L438;
        }
        if (($17 | 0) == 0) {
          label = 360;
          break L438;
        }
        HEAP32[$3$s2] = 0;
        if ($17 >>> 0 > 2) {
          var $23 = $17;
          label = 340;
          break;
        }
        var $113 = HEAP32[$4$s2];
        label = 355;
        break;
      } else {
        HEAP32[$3$s2] = 0;
        var $23 = $14;
        label = 340;
        break;
      }
    } while (0);
    do {
      if (label == 340) {
        label = 0;
        var $23;
        var $24 = HEAP32[$4$s2];
        if (($24 | 0) == 0) {
          var $113 = 0;
          label = 355;
          break;
        }
        var $27 = HEAP32[$10$s2];
        var $29 = HEAP8[$27 + ($24 - 1) | 0];
        if ($29 << 24 >> 24 != HEAP8[$27 + $24 | 0] << 24 >> 24) {
          var $113 = $24;
          label = 355;
          break;
        }
        if ($29 << 24 >> 24 != HEAP8[$24 + ($27 + 1) | 0] << 24 >> 24) {
          var $113 = $24;
          label = 355;
          break;
        }
        var $38 = $24 + ($27 + 2) | 0;
        if ($29 << 24 >> 24 != HEAP8[$38] << 24 >> 24) {
          var $113 = $24;
          label = 355;
          break;
        }
        var $42 = $24 + ($27 + 258) | 0;
        var $scan_0 = $38;
        while (1) {
          var $scan_0;
          var $44 = $scan_0 + 1 | 0;
          if ($29 << 24 >> 24 != HEAP8[$44] << 24 >> 24) {
            var $scan_1 = $44;
            break;
          }
          var $48 = $scan_0 + 2 | 0;
          if ($29 << 24 >> 24 != HEAP8[$48] << 24 >> 24) {
            var $scan_1 = $48;
            break;
          }
          var $52 = $scan_0 + 3 | 0;
          if ($29 << 24 >> 24 != HEAP8[$52] << 24 >> 24) {
            var $scan_1 = $52;
            break;
          }
          var $56 = $scan_0 + 4 | 0;
          if ($29 << 24 >> 24 != HEAP8[$56] << 24 >> 24) {
            var $scan_1 = $56;
            break;
          }
          var $60 = $scan_0 + 5 | 0;
          if ($29 << 24 >> 24 != HEAP8[$60] << 24 >> 24) {
            var $scan_1 = $60;
            break;
          }
          var $64 = $scan_0 + 6 | 0;
          if ($29 << 24 >> 24 != HEAP8[$64] << 24 >> 24) {
            var $scan_1 = $64;
            break;
          }
          var $68 = $scan_0 + 7 | 0;
          if ($29 << 24 >> 24 != HEAP8[$68] << 24 >> 24) {
            var $scan_1 = $68;
            break;
          }
          var $72 = $scan_0 + 8 | 0;
          if ($29 << 24 >> 24 == HEAP8[$72] << 24 >> 24 & $72 >>> 0 < $42 >>> 0) {
            var $scan_0 = $72;
          } else {
            var $scan_1 = $72;
            break;
          }
        }
        var $scan_1;
        var $79 = $scan_1 - $42 + 258 | 0;
        var $_4 = $79 >>> 0 > $23 >>> 0 ? $23 : $79;
        HEAP32[$3$s2] = $_4;
        if ($_4 >>> 0 <= 2) {
          var $113 = $24;
          label = 355;
          break;
        }
        var $83 = $_4 + 253 | 0;
        HEAP16[HEAP32[$6 >> 2] + (HEAP32[$5$s2] << 1) >> 1] = 1;
        var $88 = HEAP32[$5$s2];
        HEAP32[$5$s2] = $88 + 1 | 0;
        HEAP8[HEAP32[$7 >> 2] + $88 | 0] = $83 & 255;
        var $98 = ((HEAPU8[($83 & 255) + 5256408 | 0] | 256) + 1 << 2) + $s + 148 | 0;
        HEAP16[$98 >> 1] = HEAP16[$98 >> 1] + 1 & 65535;
        HEAP16[$8 >> 1] = HEAP16[$8 >> 1] + 1 & 65535;
        var $107 = (HEAP32[$5$s2] | 0) == (HEAP32[$9 >> 2] - 1 | 0) & 1;
        var $108 = HEAP32[$3$s2];
        HEAP32[$1$s2] = HEAP32[$1$s2] - $108 | 0;
        var $112 = HEAP32[$4$s2] + $108 | 0;
        HEAP32[$4$s2] = $112;
        HEAP32[$3$s2] = 0;
        var $bflush_0 = $107;
        var $138 = $112;
        break;
      }
    } while (0);
    if (label == 355) {
      label = 0;
      var $113;
      var $116 = HEAP8[HEAP32[$10$s2] + $113 | 0];
      HEAP16[HEAP32[$6 >> 2] + (HEAP32[$5$s2] << 1) >> 1] = 0;
      var $120 = HEAP32[$5$s2];
      HEAP32[$5$s2] = $120 + 1 | 0;
      HEAP8[HEAP32[$7 >> 2] + $120 | 0] = $116;
      var $125 = (($116 & 255) << 2) + $s + 148 | 0;
      HEAP16[$125 >> 1] = HEAP16[$125 >> 1] + 1 & 65535;
      var $132 = (HEAP32[$5$s2] | 0) == (HEAP32[$9 >> 2] - 1 | 0) & 1;
      HEAP32[$1$s2] = HEAP32[$1$s2] - 1 | 0;
      var $136 = HEAP32[$4$s2] + 1 | 0;
      HEAP32[$4$s2] = $136;
      var $bflush_0 = $132;
      var $138 = $136;
    }
    var $138;
    var $bflush_0;
    if (($bflush_0 | 0) == 0) {
      continue;
    }
    var $141 = HEAP32[$11$s2];
    if (($141 | 0) > -1) {
      var $147 = HEAP32[$10$s2] + $141 | 0;
    } else {
      var $147 = 0;
    }
    var $147;
    __tr_flush_block($12, $147, $138 - $141 | 0, 0);
    HEAP32[$11$s2] = HEAP32[$4$s2];
    _flush_pending(HEAP32[$13$s2]);
    if ((HEAP32[HEAP32[$13$s2] + 16 >> 2] | 0) == 0) {
      var $_0 = 0;
      label = 373;
      break;
    }
  }
  if (label == 360) {
    HEAP32[$s + 5812 >> 2] = 0;
    if (($flush | 0) == 4) {
      var $159 = HEAP32[$11$s2];
      if (($159 | 0) > -1) {
        var $165 = HEAP32[$10$s2] + $159 | 0;
      } else {
        var $165 = 0;
      }
      var $165;
      __tr_flush_block($12, $165, HEAP32[$4$s2] - $159 | 0, 1);
      HEAP32[$11$s2] = HEAP32[$4$s2];
      _flush_pending(HEAP32[$13$s2]);
      var $_0 = (HEAP32[HEAP32[$13$s2] + 16 >> 2] | 0) == 0 ? 2 : 3;
      var $_0;
      return $_0;
    }
    do {
      if ((HEAP32[$5$s2] | 0) != 0) {
        var $178 = HEAP32[$11$s2];
        if (($178 | 0) > -1) {
          var $184 = HEAP32[$10$s2] + $178 | 0;
        } else {
          var $184 = 0;
        }
        var $184;
        __tr_flush_block($12, $184, HEAP32[$4$s2] - $178 | 0, 0);
        HEAP32[$11$s2] = HEAP32[$4$s2];
        _flush_pending(HEAP32[$13$s2]);
        if ((HEAP32[HEAP32[$13$s2] + 16 >> 2] | 0) == 0) {
          var $_0 = 0;
        } else {
          break;
        }
        var $_0;
        return $_0;
      }
    } while (0);
    var $_0 = 1;
    var $_0;
    return $_0;
  } else if (label == 373) {
    var $_0;
    return $_0;
  } else if (label == 372) {
    var $_0;
    return $_0;
  }
}
_deflate_rle["X"] = 1;
function _read_buf($strm, $buf, $size) {
  var $7$s2;
  var $1 = $strm + 4 | 0;
  var $2 = HEAP32[$1 >> 2];
  var $size_ = $2 >>> 0 > $size >>> 0 ? $size : $2;
  if (($size_ | 0) == 0) {
    var $_0 = 0;
    var $_0;
    return $_0;
  }
  HEAP32[$1 >> 2] = $2 - $size_ | 0;
  var $7$s2 = ($strm | 0) >> 2;
  _memcpy($buf, HEAP32[$7$s2], $size_, 1);
  var $12 = HEAP32[HEAP32[$strm + 28 >> 2] + 24 >> 2];
  if (($12 | 0) == 1) {
    var $14 = $strm + 48 | 0;
    HEAP32[$14 >> 2] = _adler32(HEAP32[$14 >> 2], $buf, $size_);
  } else if (($12 | 0) == 2) {
    var $18 = $strm + 48 | 0;
    HEAP32[$18 >> 2] = _crc32(HEAP32[$18 >> 2], $buf, $size_);
  }
  HEAP32[$7$s2] = HEAP32[$7$s2] + $size_ | 0;
  var $24 = $strm + 8 | 0;
  HEAP32[$24 >> 2] = HEAP32[$24 >> 2] + $size_ | 0;
  var $_0 = $size_;
  var $_0;
  return $_0;
}
function _deflate_stored($s, $flush) {
  var $11$s2;
  var $9$s2;
  var $7$s2;
  var $6$s2;
  var $5$s2;
  var label = 0;
  var $3 = HEAP32[$s + 12 >> 2] - 5 | 0;
  var $_ = $3 >>> 0 < 65535 ? $3 : 65535;
  var $5$s2 = ($s + 116 | 0) >> 2;
  var $6$s2 = ($s + 108 | 0) >> 2;
  var $7$s2 = ($s + 92 | 0) >> 2;
  var $8 = $s + 44 | 0;
  var $9$s2 = ($s + 56 | 0) >> 2;
  var $10 = $s;
  var $11$s2 = ($s | 0) >> 2;
  while (1) {
    var $12 = HEAP32[$5$s2];
    if ($12 >>> 0 < 2) {
      _fill_window($s);
      var $15 = HEAP32[$5$s2];
      if (($15 | $flush | 0) == 0) {
        var $_0 = 0;
        label = 406;
        break;
      }
      if (($15 | 0) == 0) {
        label = 396;
        break;
      } else {
        var $20 = $15;
      }
    } else {
      var $20 = $12;
    }
    var $20;
    var $22 = HEAP32[$6$s2] + $20 | 0;
    HEAP32[$6$s2] = $22;
    HEAP32[$5$s2] = 0;
    var $23 = HEAP32[$7$s2];
    var $24 = $23 + $_ | 0;
    if (($22 | 0) != 0 & $22 >>> 0 < $24 >>> 0) {
      var $42 = $22;
      var $41 = $23;
    } else {
      HEAP32[$5$s2] = $22 - $24 | 0;
      HEAP32[$6$s2] = $24;
      if (($23 | 0) > -1) {
        var $34 = HEAP32[$9$s2] + $23 | 0;
      } else {
        var $34 = 0;
      }
      var $34;
      __tr_flush_block($10, $34, $_, 0);
      HEAP32[$7$s2] = HEAP32[$6$s2];
      _flush_pending(HEAP32[$11$s2]);
      if ((HEAP32[HEAP32[$11$s2] + 16 >> 2] | 0) == 0) {
        var $_0 = 0;
        label = 407;
        break;
      }
      var $42 = HEAP32[$6$s2];
      var $41 = HEAP32[$7$s2];
    }
    var $41;
    var $42;
    var $43 = $42 - $41 | 0;
    if ($43 >>> 0 < (HEAP32[$8 >> 2] - 262 | 0) >>> 0) {
      continue;
    }
    if (($41 | 0) > -1) {
      var $53 = HEAP32[$9$s2] + $41 | 0;
    } else {
      var $53 = 0;
    }
    var $53;
    __tr_flush_block($10, $53, $43, 0);
    HEAP32[$7$s2] = HEAP32[$6$s2];
    _flush_pending(HEAP32[$11$s2]);
    if ((HEAP32[HEAP32[$11$s2] + 16 >> 2] | 0) == 0) {
      var $_0 = 0;
      label = 408;
      break;
    }
  }
  if (label == 406) {
    var $_0;
    return $_0;
  } else if (label == 396) {
    HEAP32[$s + 5812 >> 2] = 0;
    if (($flush | 0) == 4) {
      var $64 = HEAP32[$7$s2];
      if (($64 | 0) > -1) {
        var $70 = HEAP32[$9$s2] + $64 | 0;
      } else {
        var $70 = 0;
      }
      var $70;
      __tr_flush_block($10, $70, HEAP32[$6$s2] - $64 | 0, 1);
      HEAP32[$7$s2] = HEAP32[$6$s2];
      _flush_pending(HEAP32[$11$s2]);
      var $_0 = (HEAP32[HEAP32[$11$s2] + 16 >> 2] | 0) == 0 ? 2 : 3;
      var $_0;
      return $_0;
    }
    var $80 = HEAP32[$6$s2];
    var $81 = HEAP32[$7$s2];
    do {
      if (($80 | 0) > ($81 | 0)) {
        if (($81 | 0) > -1) {
          var $89 = HEAP32[$9$s2] + $81 | 0;
        } else {
          var $89 = 0;
        }
        var $89;
        __tr_flush_block($10, $89, $80 - $81 | 0, 0);
        HEAP32[$7$s2] = HEAP32[$6$s2];
        _flush_pending(HEAP32[$11$s2]);
        if ((HEAP32[HEAP32[$11$s2] + 16 >> 2] | 0) == 0) {
          var $_0 = 0;
        } else {
          break;
        }
        var $_0;
        return $_0;
      }
    } while (0);
    var $_0 = 1;
    var $_0;
    return $_0;
  } else if (label == 407) {
    var $_0;
    return $_0;
  } else if (label == 408) {
    var $_0;
    return $_0;
  }
}
_deflate_stored["X"] = 1;
function _deflate_fast($s, $flush) {
  var $21$s2;
  var $19$s2;
  var $14$s2;
  var $12$s2;
  var $8$s2;
  var $7$s2;
  var $6$s2;
  var $5$s2;
  var $4$s2;
  var $3$s2;
  var $1$s2;
  var label = 0;
  var $1$s2 = ($s + 116 | 0) >> 2;
  var $2 = ($flush | 0) == 0;
  var $3$s2 = ($s + 72 | 0) >> 2;
  var $4$s2 = ($s + 88 | 0) >> 2;
  var $5$s2 = ($s + 108 | 0) >> 2;
  var $6$s2 = ($s + 56 | 0) >> 2;
  var $7$s2 = ($s + 84 | 0) >> 2;
  var $8$s2 = ($s + 68 | 0) >> 2;
  var $9 = $s + 52 | 0;
  var $10 = $s + 64 | 0;
  var $11 = $s + 44 | 0;
  var $12$s2 = ($s + 96 | 0) >> 2;
  var $13 = $s + 112 | 0;
  var $14$s2 = ($s + 5792 | 0) >> 2;
  var $15 = $s + 5796 | 0;
  var $16 = $s + 5784 | 0;
  var $17 = $s + 5788 | 0;
  var $18 = $s + 128 | 0;
  var $19$s2 = ($s + 92 | 0) >> 2;
  var $20 = $s;
  var $21$s2 = ($s | 0) >> 2;
  L537 : while (1) {
    do {
      if (HEAP32[$1$s2] >>> 0 < 262) {
        _fill_window($s);
        var $25 = HEAP32[$1$s2];
        if ($25 >>> 0 < 262 & $2) {
          var $_0 = 0;
          label = 446;
          break L537;
        }
        if (($25 | 0) == 0) {
          label = 434;
          break L537;
        }
        if ($25 >>> 0 > 2) {
          label = 417;
          break;
        } else {
          label = 420;
          break;
        }
      } else {
        label = 417;
      }
    } while (0);
    do {
      if (label == 417) {
        label = 0;
        var $34 = HEAP32[$5$s2];
        var $42 = (HEAPU8[HEAP32[$6$s2] + $34 + 2 | 0] ^ HEAP32[$3$s2] << HEAP32[$4$s2]) & HEAP32[$7$s2];
        HEAP32[$3$s2] = $42;
        var $45 = HEAP16[HEAP32[$8$s2] + ($42 << 1) >> 1];
        HEAP16[HEAP32[$10 >> 2] + ((HEAP32[$9 >> 2] & $34) << 1) >> 1] = $45;
        var $50 = $45 & 65535;
        HEAP16[HEAP32[$8$s2] + (HEAP32[$3$s2] << 1) >> 1] = HEAP32[$5$s2] & 65535;
        if ($45 << 16 >> 16 == 0) {
          label = 420;
          break;
        }
        if ((HEAP32[$5$s2] - $50 | 0) >>> 0 > (HEAP32[$11 >> 2] - 262 | 0) >>> 0) {
          label = 420;
          break;
        }
        var $64 = _longest_match($s, $50);
        HEAP32[$12$s2] = $64;
        var $65 = $64;
        break;
      }
    } while (0);
    if (label == 420) {
      label = 0;
      var $65 = HEAP32[$12$s2];
    }
    var $65;
    do {
      if ($65 >>> 0 > 2) {
        var $68 = $65 + 253 | 0;
        var $72 = HEAP32[$5$s2] - HEAP32[$13 >> 2] | 0;
        HEAP16[HEAP32[$15 >> 2] + (HEAP32[$14$s2] << 1) >> 1] = $72 & 65535;
        var $77 = HEAP32[$14$s2];
        HEAP32[$14$s2] = $77 + 1 | 0;
        HEAP8[HEAP32[$16 >> 2] + $77 | 0] = $68 & 255;
        var $88 = ((HEAPU8[($68 & 255) + 5256408 | 0] | 256) + 1 << 2) + $s + 148 | 0;
        HEAP16[$88 >> 1] = HEAP16[$88 >> 1] + 1 & 65535;
        var $91 = $72 + 65535 & 65535;
        if ($91 >>> 0 < 256) {
          var $_pn = $91;
        } else {
          var $_pn = ($91 >>> 7) + 256 | 0;
        }
        var $_pn;
        var $98 = (HEAPU8[$_pn + 5257132 | 0] << 2) + $s + 2440 | 0;
        HEAP16[$98 >> 1] = HEAP16[$98 >> 1] + 1 & 65535;
        var $105 = (HEAP32[$14$s2] | 0) == (HEAP32[$17 >> 2] - 1 | 0) & 1;
        var $106 = HEAP32[$12$s2];
        var $108 = HEAP32[$1$s2] - $106 | 0;
        HEAP32[$1$s2] = $108;
        if (!($106 >>> 0 <= HEAP32[$18 >> 2] >>> 0 & $108 >>> 0 > 2)) {
          var $148 = HEAP32[$5$s2] + $106 | 0;
          HEAP32[$5$s2] = $148;
          HEAP32[$12$s2] = 0;
          var $149 = HEAP32[$6$s2];
          var $152 = HEAPU8[$149 + $148 | 0];
          HEAP32[$3$s2] = $152;
          HEAP32[$3$s2] = (HEAPU8[$148 + ($149 + 1) | 0] ^ $152 << HEAP32[$4$s2]) & HEAP32[$7$s2];
          var $bflush_0 = $105;
          var $188 = $148;
          break;
        }
        HEAP32[$12$s2] = $106 - 1 | 0;
        while (1) {
          var $115 = HEAP32[$5$s2];
          var $116 = $115 + 1 | 0;
          HEAP32[$5$s2] = $116;
          var $127 = (HEAPU8[HEAP32[$6$s2] + $115 + 3 | 0] ^ HEAP32[$3$s2] << HEAP32[$4$s2]) & HEAP32[$7$s2];
          HEAP32[$3$s2] = $127;
          HEAP16[HEAP32[$10 >> 2] + ((HEAP32[$9 >> 2] & $116) << 1) >> 1] = HEAP16[HEAP32[$8$s2] + ($127 << 1) >> 1];
          HEAP16[HEAP32[$8$s2] + (HEAP32[$3$s2] << 1) >> 1] = HEAP32[$5$s2] & 65535;
          var $141 = HEAP32[$12$s2] - 1 | 0;
          HEAP32[$12$s2] = $141;
          if (($141 | 0) == 0) {
            break;
          }
        }
        var $145 = HEAP32[$5$s2] + 1 | 0;
        HEAP32[$5$s2] = $145;
        var $bflush_0 = $105;
        var $188 = $145;
      } else {
        var $166 = HEAP8[HEAP32[$6$s2] + HEAP32[$5$s2] | 0];
        HEAP16[HEAP32[$15 >> 2] + (HEAP32[$14$s2] << 1) >> 1] = 0;
        var $170 = HEAP32[$14$s2];
        HEAP32[$14$s2] = $170 + 1 | 0;
        HEAP8[HEAP32[$16 >> 2] + $170 | 0] = $166;
        var $175 = (($166 & 255) << 2) + $s + 148 | 0;
        HEAP16[$175 >> 1] = HEAP16[$175 >> 1] + 1 & 65535;
        var $182 = (HEAP32[$14$s2] | 0) == (HEAP32[$17 >> 2] - 1 | 0) & 1;
        HEAP32[$1$s2] = HEAP32[$1$s2] - 1 | 0;
        var $186 = HEAP32[$5$s2] + 1 | 0;
        HEAP32[$5$s2] = $186;
        var $bflush_0 = $182;
        var $188 = $186;
      }
    } while (0);
    var $188;
    var $bflush_0;
    if (($bflush_0 | 0) == 0) {
      continue;
    }
    var $191 = HEAP32[$19$s2];
    if (($191 | 0) > -1) {
      var $197 = HEAP32[$6$s2] + $191 | 0;
    } else {
      var $197 = 0;
    }
    var $197;
    __tr_flush_block($20, $197, $188 - $191 | 0, 0);
    HEAP32[$19$s2] = HEAP32[$5$s2];
    _flush_pending(HEAP32[$21$s2]);
    if ((HEAP32[HEAP32[$21$s2] + 16 >> 2] | 0) == 0) {
      var $_0 = 0;
      label = 445;
      break;
    }
  }
  if (label == 434) {
    var $206 = HEAP32[$5$s2];
    HEAP32[$s + 5812 >> 2] = $206 >>> 0 < 2 ? $206 : 2;
    if (($flush | 0) == 4) {
      var $211 = HEAP32[$19$s2];
      if (($211 | 0) > -1) {
        var $217 = HEAP32[$6$s2] + $211 | 0;
      } else {
        var $217 = 0;
      }
      var $217;
      __tr_flush_block($20, $217, $206 - $211 | 0, 1);
      HEAP32[$19$s2] = HEAP32[$5$s2];
      _flush_pending(HEAP32[$21$s2]);
      var $_0 = (HEAP32[HEAP32[$21$s2] + 16 >> 2] | 0) == 0 ? 2 : 3;
      var $_0;
      return $_0;
    }
    do {
      if ((HEAP32[$14$s2] | 0) != 0) {
        var $229 = HEAP32[$19$s2];
        if (($229 | 0) > -1) {
          var $235 = HEAP32[$6$s2] + $229 | 0;
        } else {
          var $235 = 0;
        }
        var $235;
        __tr_flush_block($20, $235, $206 - $229 | 0, 0);
        HEAP32[$19$s2] = HEAP32[$5$s2];
        _flush_pending(HEAP32[$21$s2]);
        if ((HEAP32[HEAP32[$21$s2] + 16 >> 2] | 0) == 0) {
          var $_0 = 0;
        } else {
          break;
        }
        var $_0;
        return $_0;
      }
    } while (0);
    var $_0 = 1;
    var $_0;
    return $_0;
  } else if (label == 445) {
    var $_0;
    return $_0;
  } else if (label == 446) {
    var $_0;
    return $_0;
  }
}
_deflate_fast["X"] = 1;
function _deflate_slow($s, $flush) {
  var $22$s2;
  var $20$s2;
  var $19$s2;
  var $17$s2;
  var $16$s2;
  var $15$s2;
  var $14$s2;
  var $13$s2;
  var $12$s2;
  var $11$s2;
  var $8$s2;
  var $6$s2;
  var $5$s2;
  var $3$s2;
  var $1$s2;
  var label = 0;
  var $1$s2 = ($s + 116 | 0) >> 2;
  var $2 = ($flush | 0) == 0;
  var $3$s2 = ($s + 72 | 0) >> 2;
  var $4 = $s + 88 | 0;
  var $5$s2 = ($s + 108 | 0) >> 2;
  var $6$s2 = ($s + 56 | 0) >> 2;
  var $7 = $s + 84 | 0;
  var $8$s2 = ($s + 68 | 0) >> 2;
  var $9 = $s + 52 | 0;
  var $10 = $s + 64 | 0;
  var $11$s2 = ($s + 96 | 0) >> 2;
  var $12$s2 = ($s + 120 | 0) >> 2;
  var $13$s2 = ($s + 112 | 0) >> 2;
  var $14$s2 = ($s + 100 | 0) >> 2;
  var $15$s2 = ($s + 5792 | 0) >> 2;
  var $16$s2 = ($s + 5796 | 0) >> 2;
  var $17$s2 = ($s + 5784 | 0) >> 2;
  var $18 = $s + 5788 | 0;
  var $19$s2 = ($s + 104 | 0) >> 2;
  var $20$s2 = ($s + 92 | 0) >> 2;
  var $21 = $s;
  var $22$s2 = ($s | 0) >> 2;
  var $23 = $s + 128 | 0;
  var $24 = $s + 44 | 0;
  var $25 = $s + 136 | 0;
  L587 : while (1) {
    var $26 = HEAP32[$1$s2];
    while (1) {
      var $26;
      do {
        if ($26 >>> 0 < 262) {
          _fill_window($s);
          var $29 = HEAP32[$1$s2];
          if ($29 >>> 0 < 262 & $2) {
            var $_0 = 0;
            label = 497;
            break L587;
          }
          if (($29 | 0) == 0) {
            label = 483;
            break L587;
          }
          if ($29 >>> 0 > 2) {
            label = 456;
            break;
          }
          HEAP32[$12$s2] = HEAP32[$11$s2];
          HEAP32[$14$s2] = HEAP32[$13$s2];
          HEAP32[$11$s2] = 2;
          var $88 = 2;
          label = 464;
          break;
        } else {
          label = 456;
        }
      } while (0);
      do {
        if (label == 456) {
          label = 0;
          var $40 = HEAP32[$5$s2];
          var $48 = (HEAPU8[HEAP32[$6$s2] + $40 + 2 | 0] ^ HEAP32[$3$s2] << HEAP32[$4 >> 2]) & HEAP32[$7 >> 2];
          HEAP32[$3$s2] = $48;
          var $51 = HEAP16[HEAP32[$8$s2] + ($48 << 1) >> 1];
          HEAP16[HEAP32[$10 >> 2] + ((HEAP32[$9 >> 2] & $40) << 1) >> 1] = $51;
          var $56 = $51 & 65535;
          HEAP16[HEAP32[$8$s2] + (HEAP32[$3$s2] << 1) >> 1] = HEAP32[$5$s2] & 65535;
          var $62 = HEAP32[$11$s2];
          HEAP32[$12$s2] = $62;
          HEAP32[$14$s2] = HEAP32[$13$s2];
          HEAP32[$11$s2] = 2;
          if ($51 << 16 >> 16 == 0) {
            var $88 = 2;
            label = 464;
            break;
          }
          if ($62 >>> 0 >= HEAP32[$23 >> 2] >>> 0) {
            var $91 = $62;
            var $90 = 2;
            break;
          }
          if ((HEAP32[$5$s2] - $56 | 0) >>> 0 > (HEAP32[$24 >> 2] - 262 | 0) >>> 0) {
            var $88 = 2;
            label = 464;
            break;
          }
          var $75 = _longest_match($s, $56);
          HEAP32[$11$s2] = $75;
          if ($75 >>> 0 >= 6) {
            var $88 = $75;
            label = 464;
            break;
          }
          if ((HEAP32[$25 >> 2] | 0) != 1) {
            if (($75 | 0) != 3) {
              var $88 = $75;
              label = 464;
              break;
            }
            if ((HEAP32[$5$s2] - HEAP32[$13$s2] | 0) >>> 0 <= 4096) {
              var $88 = 3;
              label = 464;
              break;
            }
          }
          HEAP32[$11$s2] = 2;
          var $88 = 2;
          label = 464;
          break;
        }
      } while (0);
      if (label == 464) {
        label = 0;
        var $88;
        var $91 = HEAP32[$12$s2];
        var $90 = $88;
      }
      var $90;
      var $91;
      if (!($91 >>> 0 < 3 | $90 >>> 0 > $91 >>> 0)) {
        break;
      }
      if ((HEAP32[$19$s2] | 0) == 0) {
        HEAP32[$19$s2] = 1;
        HEAP32[$5$s2] = HEAP32[$5$s2] + 1 | 0;
        var $239 = HEAP32[$1$s2] - 1 | 0;
        HEAP32[$1$s2] = $239;
        var $26 = $239;
        continue;
      }
      var $198 = HEAP8[HEAP32[$6$s2] + (HEAP32[$5$s2] - 1) | 0];
      HEAP16[HEAP32[$16$s2] + (HEAP32[$15$s2] << 1) >> 1] = 0;
      var $202 = HEAP32[$15$s2];
      HEAP32[$15$s2] = $202 + 1 | 0;
      HEAP8[HEAP32[$17$s2] + $202 | 0] = $198;
      var $207 = (($198 & 255) << 2) + $s + 148 | 0;
      HEAP16[$207 >> 1] = HEAP16[$207 >> 1] + 1 & 65535;
      if ((HEAP32[$15$s2] | 0) == (HEAP32[$18 >> 2] - 1 | 0)) {
        var $215 = HEAP32[$20$s2];
        if (($215 | 0) > -1) {
          var $221 = HEAP32[$6$s2] + $215 | 0;
        } else {
          var $221 = 0;
        }
        var $221;
        __tr_flush_block($21, $221, HEAP32[$5$s2] - $215 | 0, 0);
        HEAP32[$20$s2] = HEAP32[$5$s2];
        _flush_pending(HEAP32[$22$s2]);
      }
      HEAP32[$5$s2] = HEAP32[$5$s2] + 1 | 0;
      var $230 = HEAP32[$1$s2] - 1 | 0;
      HEAP32[$1$s2] = $230;
      if ((HEAP32[HEAP32[$22$s2] + 16 >> 2] | 0) == 0) {
        var $_0 = 0;
        label = 500;
        break L587;
      } else {
        var $26 = $230;
      }
    }
    var $95 = HEAP32[$5$s2];
    var $98 = $95 - 3 + HEAP32[$1$s2] | 0;
    var $99 = $91 + 253 | 0;
    var $103 = $95 + 65535 - HEAP32[$14$s2] | 0;
    HEAP16[HEAP32[$16$s2] + (HEAP32[$15$s2] << 1) >> 1] = $103 & 65535;
    var $108 = HEAP32[$15$s2];
    HEAP32[$15$s2] = $108 + 1 | 0;
    HEAP8[HEAP32[$17$s2] + $108 | 0] = $99 & 255;
    var $119 = ((HEAPU8[($99 & 255) + 5256408 | 0] | 256) + 1 << 2) + $s + 148 | 0;
    HEAP16[$119 >> 1] = HEAP16[$119 >> 1] + 1 & 65535;
    var $122 = $103 + 65535 & 65535;
    if ($122 >>> 0 < 256) {
      var $_pn = $122;
    } else {
      var $_pn = ($122 >>> 7) + 256 | 0;
    }
    var $_pn;
    var $129 = (HEAPU8[$_pn + 5257132 | 0] << 2) + $s + 2440 | 0;
    HEAP16[$129 >> 1] = HEAP16[$129 >> 1] + 1 & 65535;
    var $132 = HEAP32[$15$s2];
    var $134 = HEAP32[$18 >> 2] - 1 | 0;
    var $135 = HEAP32[$12$s2];
    HEAP32[$1$s2] = 1 - $135 + HEAP32[$1$s2] | 0;
    var $138 = $135 - 2 | 0;
    HEAP32[$12$s2] = $138;
    var $139 = $138;
    while (1) {
      var $139;
      var $140 = HEAP32[$5$s2];
      var $141 = $140 + 1 | 0;
      HEAP32[$5$s2] = $141;
      if ($141 >>> 0 > $98 >>> 0) {
        var $168 = $139;
      } else {
        var $154 = (HEAPU8[HEAP32[$6$s2] + $140 + 3 | 0] ^ HEAP32[$3$s2] << HEAP32[$4 >> 2]) & HEAP32[$7 >> 2];
        HEAP32[$3$s2] = $154;
        HEAP16[HEAP32[$10 >> 2] + ((HEAP32[$9 >> 2] & $141) << 1) >> 1] = HEAP16[HEAP32[$8$s2] + ($154 << 1) >> 1];
        HEAP16[HEAP32[$8$s2] + (HEAP32[$3$s2] << 1) >> 1] = HEAP32[$5$s2] & 65535;
        var $168 = HEAP32[$12$s2];
      }
      var $168;
      var $169 = $168 - 1 | 0;
      HEAP32[$12$s2] = $169;
      if (($169 | 0) == 0) {
        break;
      } else {
        var $139 = $169;
      }
    }
    HEAP32[$19$s2] = 0;
    HEAP32[$11$s2] = 2;
    var $174 = HEAP32[$5$s2] + 1 | 0;
    HEAP32[$5$s2] = $174;
    if (($132 | 0) != ($134 | 0)) {
      continue;
    }
    var $176 = HEAP32[$20$s2];
    if (($176 | 0) > -1) {
      var $182 = HEAP32[$6$s2] + $176 | 0;
    } else {
      var $182 = 0;
    }
    var $182;
    __tr_flush_block($21, $182, $174 - $176 | 0, 0);
    HEAP32[$20$s2] = HEAP32[$5$s2];
    _flush_pending(HEAP32[$22$s2]);
    if ((HEAP32[HEAP32[$22$s2] + 16 >> 2] | 0) == 0) {
      var $_0 = 0;
      label = 495;
      break;
    }
  }
  if (label == 483) {
    if ((HEAP32[$19$s2] | 0) != 0) {
      var $248 = HEAP8[HEAP32[$6$s2] + (HEAP32[$5$s2] - 1) | 0];
      HEAP16[HEAP32[$16$s2] + (HEAP32[$15$s2] << 1) >> 1] = 0;
      var $252 = HEAP32[$15$s2];
      HEAP32[$15$s2] = $252 + 1 | 0;
      HEAP8[HEAP32[$17$s2] + $252 | 0] = $248;
      var $257 = (($248 & 255) << 2) + $s + 148 | 0;
      HEAP16[$257 >> 1] = HEAP16[$257 >> 1] + 1 & 65535;
      HEAP32[$19$s2] = 0;
    }
    var $261 = HEAP32[$5$s2];
    HEAP32[$s + 5812 >> 2] = $261 >>> 0 < 2 ? $261 : 2;
    if (($flush | 0) == 4) {
      var $266 = HEAP32[$20$s2];
      if (($266 | 0) > -1) {
        var $272 = HEAP32[$6$s2] + $266 | 0;
      } else {
        var $272 = 0;
      }
      var $272;
      __tr_flush_block($21, $272, $261 - $266 | 0, 1);
      HEAP32[$20$s2] = HEAP32[$5$s2];
      _flush_pending(HEAP32[$22$s2]);
      var $_0 = (HEAP32[HEAP32[$22$s2] + 16 >> 2] | 0) == 0 ? 2 : 3;
      var $_0;
      return $_0;
    }
    do {
      if ((HEAP32[$15$s2] | 0) != 0) {
        var $284 = HEAP32[$20$s2];
        if (($284 | 0) > -1) {
          var $290 = HEAP32[$6$s2] + $284 | 0;
        } else {
          var $290 = 0;
        }
        var $290;
        __tr_flush_block($21, $290, $261 - $284 | 0, 0);
        HEAP32[$20$s2] = HEAP32[$5$s2];
        _flush_pending(HEAP32[$22$s2]);
        if ((HEAP32[HEAP32[$22$s2] + 16 >> 2] | 0) == 0) {
          var $_0 = 0;
        } else {
          break;
        }
        var $_0;
        return $_0;
      }
    } while (0);
    var $_0 = 1;
    var $_0;
    return $_0;
  } else if (label == 495) {
    var $_0;
    return $_0;
  } else if (label == 497) {
    var $_0;
    return $_0;
  } else if (label == 500) {
    var $_0;
    return $_0;
  }
}
_deflate_slow["X"] = 1;
function _longest_match($s, $cur_match) {
  var $s$s2 = $s >> 2;
  var label = 0;
  var $2 = HEAP32[$s$s2 + 31];
  var $4 = HEAP32[$s$s2 + 14];
  var $6 = HEAP32[$s$s2 + 27];
  var $7 = $4 + $6 | 0;
  var $9 = HEAP32[$s$s2 + 30];
  var $11 = HEAP32[$s$s2 + 36];
  var $14 = HEAP32[$s$s2 + 11] - 262 | 0;
  var $17 = $6 >>> 0 > $14 >>> 0 ? $6 - $14 | 0 : 0;
  var $19 = HEAP32[$s$s2 + 16];
  var $21 = HEAP32[$s$s2 + 13];
  var $22 = $6 + ($4 + 258) | 0;
  var $33 = HEAP32[$s$s2 + 29];
  var $_85 = $11 >>> 0 > $33 >>> 0 ? $33 : $11;
  var $35 = $s + 112 | 0;
  var $36 = $6 + ($4 + 1) | 0;
  var $37 = $6 + ($4 + 2) | 0;
  var $38 = $22;
  var $39 = $6 + 257 | 0;
  var $scan_end_0 = HEAP8[$4 + $9 + $6 | 0];
  var $scan_end1_0 = HEAP8[$4 + ($6 - 1) + $9 | 0];
  var $_075 = $cur_match;
  var $chain_length_1 = $9 >>> 0 < HEAP32[$s$s2 + 35] >>> 0 ? $2 : $2 >>> 2;
  var $best_len_0 = $9;
  L657 : while (1) {
    var $best_len_0;
    var $chain_length_1;
    var $_075;
    var $scan_end1_0;
    var $scan_end_0;
    var $41 = $4 + $_075 | 0;
    do {
      if (HEAP8[$4 + $_075 + $best_len_0 | 0] << 24 >> 24 == $scan_end_0 << 24 >> 24) {
        if (HEAP8[$4 + ($best_len_0 - 1) + $_075 | 0] << 24 >> 24 != $scan_end1_0 << 24 >> 24) {
          var $scan_end_1 = $scan_end_0;
          var $scan_end1_1 = $scan_end1_0;
          var $best_len_1 = $best_len_0;
          break;
        }
        if (HEAP8[$41] << 24 >> 24 != HEAP8[$7] << 24 >> 24) {
          var $scan_end_1 = $scan_end_0;
          var $scan_end1_1 = $scan_end1_0;
          var $best_len_1 = $best_len_0;
          break;
        }
        if (HEAP8[$_075 + ($4 + 1) | 0] << 24 >> 24 != HEAP8[$36] << 24 >> 24) {
          var $scan_end_1 = $scan_end_0;
          var $scan_end1_1 = $scan_end1_0;
          var $best_len_1 = $best_len_0;
          break;
        }
        var $scan_1 = $37;
        var $match_0 = $_075 + ($4 + 2) | 0;
        while (1) {
          var $match_0;
          var $scan_1;
          var $62 = $scan_1 + 1 | 0;
          if (HEAP8[$62] << 24 >> 24 != HEAP8[$match_0 + 1 | 0] << 24 >> 24) {
            var $scan_2 = $62;
            break;
          }
          var $68 = $scan_1 + 2 | 0;
          if (HEAP8[$68] << 24 >> 24 != HEAP8[$match_0 + 2 | 0] << 24 >> 24) {
            var $scan_2 = $68;
            break;
          }
          var $74 = $scan_1 + 3 | 0;
          if (HEAP8[$74] << 24 >> 24 != HEAP8[$match_0 + 3 | 0] << 24 >> 24) {
            var $scan_2 = $74;
            break;
          }
          var $80 = $scan_1 + 4 | 0;
          if (HEAP8[$80] << 24 >> 24 != HEAP8[$match_0 + 4 | 0] << 24 >> 24) {
            var $scan_2 = $80;
            break;
          }
          var $86 = $scan_1 + 5 | 0;
          if (HEAP8[$86] << 24 >> 24 != HEAP8[$match_0 + 5 | 0] << 24 >> 24) {
            var $scan_2 = $86;
            break;
          }
          var $92 = $scan_1 + 6 | 0;
          if (HEAP8[$92] << 24 >> 24 != HEAP8[$match_0 + 6 | 0] << 24 >> 24) {
            var $scan_2 = $92;
            break;
          }
          var $98 = $scan_1 + 7 | 0;
          if (HEAP8[$98] << 24 >> 24 != HEAP8[$match_0 + 7 | 0] << 24 >> 24) {
            var $scan_2 = $98;
            break;
          }
          var $104 = $scan_1 + 8 | 0;
          var $106 = $match_0 + 8 | 0;
          if (HEAP8[$104] << 24 >> 24 == HEAP8[$106] << 24 >> 24 & $104 >>> 0 < $22 >>> 0) {
            var $scan_1 = $104;
            var $match_0 = $106;
          } else {
            var $scan_2 = $104;
            break;
          }
        }
        var $scan_2;
        var $111 = $scan_2 - $38 | 0;
        var $112 = $111 + 258 | 0;
        if (($112 | 0) <= ($best_len_0 | 0)) {
          var $scan_end_1 = $scan_end_0;
          var $scan_end1_1 = $scan_end1_0;
          var $best_len_1 = $best_len_0;
          break;
        }
        HEAP32[$35 >> 2] = $_075;
        if (($112 | 0) >= ($_85 | 0)) {
          var $best_len_2 = $112;
          label = 521;
          break L657;
        }
        var $scan_end_1 = HEAP8[$4 + $112 + $6 | 0];
        var $scan_end1_1 = HEAP8[$4 + $39 + $111 | 0];
        var $best_len_1 = $112;
      } else {
        var $scan_end_1 = $scan_end_0;
        var $scan_end1_1 = $scan_end1_0;
        var $best_len_1 = $best_len_0;
      }
    } while (0);
    var $best_len_1;
    var $scan_end1_1;
    var $scan_end_1;
    var $125 = HEAPU16[$19 + (($_075 & $21) << 1) >> 1];
    if ($125 >>> 0 <= $17 >>> 0) {
      var $best_len_2 = $best_len_1;
      label = 522;
      break;
    }
    var $128 = $chain_length_1 - 1 | 0;
    if (($128 | 0) == 0) {
      var $best_len_2 = $best_len_1;
      label = 523;
      break;
    } else {
      var $scan_end_0 = $scan_end_1;
      var $scan_end1_0 = $scan_end1_1;
      var $_075 = $125;
      var $chain_length_1 = $128;
      var $best_len_0 = $best_len_1;
    }
  }
  if (label == 522) {
    var $best_len_2;
    var $130 = $best_len_2 >>> 0 > $33 >>> 0;
    var $_best_len_2 = $130 ? $33 : $best_len_2;
    return $_best_len_2;
  } else if (label == 521) {
    var $best_len_2;
    var $130 = $best_len_2 >>> 0 > $33 >>> 0;
    var $_best_len_2 = $130 ? $33 : $best_len_2;
    return $_best_len_2;
  } else if (label == 523) {
    var $best_len_2;
    var $130 = $best_len_2 >>> 0 > $33 >>> 0;
    var $_best_len_2 = $130 ? $33 : $best_len_2;
    return $_best_len_2;
  }
}
_longest_match["X"] = 1;
function _inflateResetKeep($strm) {
  var $4$s2;
  var $strm$s2 = $strm >> 2;
  if (($strm | 0) == 0) {
    var $_0 = -2;
    var $_0;
    return $_0;
  }
  var $4 = HEAP32[$strm$s2 + 7], $4$s2 = $4 >> 2;
  if (($4 | 0) == 0) {
    var $_0 = -2;
    var $_0;
    return $_0;
  }
  HEAP32[$4$s2 + 7] = 0;
  HEAP32[$strm$s2 + 5] = 0;
  HEAP32[$strm$s2 + 2] = 0;
  HEAP32[$strm$s2 + 6] = 0;
  var $12 = HEAP32[$4$s2 + 2];
  if (($12 | 0) != 0) {
    HEAP32[$strm$s2 + 12] = $12 & 1;
  }
  HEAP32[$4$s2] = 0;
  HEAP32[$4$s2 + 1] = 0;
  HEAP32[$4$s2 + 3] = 0;
  HEAP32[$4$s2 + 5] = 32768;
  HEAP32[$4$s2 + 8] = 0;
  HEAP32[$4$s2 + 14] = 0;
  HEAP32[$4$s2 + 15] = 0;
  var $_c = $4 + 1328 | 0;
  HEAP32[$4$s2 + 27] = $_c;
  HEAP32[$4$s2 + 20] = $_c;
  HEAP32[$4$s2 + 19] = $_c;
  HEAP32[$4$s2 + 1776] = 1;
  HEAP32[$4$s2 + 1777] = -1;
  var $_0 = 0;
  var $_0;
  return $_0;
}
_inflateResetKeep["X"] = 1;
function _inflateReset($strm) {
  var $4$s2;
  if (($strm | 0) == 0) {
    var $_0 = -2;
    var $_0;
    return $_0;
  }
  var $4 = HEAP32[$strm + 28 >> 2], $4$s2 = $4 >> 2;
  if (($4 | 0) == 0) {
    var $_0 = -2;
    var $_0;
    return $_0;
  }
  HEAP32[$4$s2 + 10] = 0;
  HEAP32[$4$s2 + 11] = 0;
  HEAP32[$4$s2 + 12] = 0;
  var $_0 = _inflateResetKeep($strm);
  var $_0;
  return $_0;
}
function _inflateReset2($strm) {
  if (($strm | 0) == 0) {
    var $_0 = -2;
    var $_0;
    return $_0;
  }
  var $4 = HEAP32[$strm + 28 >> 2];
  if (($4 | 0) == 0) {
    var $_0 = -2;
    var $_0;
    return $_0;
  }
  var $7 = $4 + 52 | 0;
  var $9 = HEAP32[$7 >> 2];
  var $_pre = $4 + 36 | 0;
  do {
    if (($9 | 0) != 0) {
      if ((HEAP32[$_pre >> 2] | 0) == 15) {
        break;
      }
      FUNCTION_TABLE[HEAP32[$strm + 36 >> 2]](HEAP32[$strm + 40 >> 2], $9);
      HEAP32[$7 >> 2] = 0;
    }
  } while (0);
  HEAP32[$4 + 8 >> 2] = 1;
  HEAP32[$_pre >> 2] = 15;
  var $_0 = _inflateReset($strm);
  var $_0;
  return $_0;
}
function _inflateInit2_($strm) {
  var $11$s2;
  if (($strm | 0) == 0) {
    var $_0 = -2;
    var $_0;
    return $_0;
  }
  HEAP32[$strm + 24 >> 2] = 0;
  var $4 = $strm + 32 | 0;
  var $5 = HEAP32[$4 >> 2];
  if (($5 | 0) == 0) {
    HEAP32[$4 >> 2] = 4;
    HEAP32[$strm + 40 >> 2] = 0;
    var $10 = 4;
  } else {
    var $10 = $5;
  }
  var $10;
  var $11$s2 = ($strm + 36 | 0) >> 2;
  if ((HEAP32[$11$s2] | 0) == 0) {
    HEAP32[$11$s2] = 10;
  }
  var $15 = $strm + 40 | 0;
  var $17 = FUNCTION_TABLE[$10](HEAP32[$15 >> 2], 1, 7116);
  if (($17 | 0) == 0) {
    var $_0 = -4;
    var $_0;
    return $_0;
  }
  var $21 = $strm + 28 | 0;
  HEAP32[$21 >> 2] = $17;
  HEAP32[$17 + 52 >> 2] = 0;
  var $24 = _inflateReset2($strm);
  if (($24 | 0) == 0) {
    var $_0 = 0;
    var $_0;
    return $_0;
  }
  FUNCTION_TABLE[HEAP32[$11$s2]](HEAP32[$15 >> 2], $17);
  HEAP32[$21 >> 2] = 0;
  var $_0 = $24;
  var $_0;
  return $_0;
}
function _inflateInit_($strm) {
  return _inflateInit2_($strm);
}
function _inflate($strm) {
  var $283$s2;
  var $77$s1;
  var $67$s2;
  var $66$s2;
  var $65$s2;
  var $64$s2;
  var $63$s2;
  var $62$s2;
  var $55$s2;
  var $53$s2;
  var $50$s2;
  var $49$s2;
  var $48$s2;
  var $46$s2;
  var $45$s2;
  var $42$s2;
  var $41$s2;
  var $39$s2;
  var $36$s2;
  var $35$s2;
  var $33$s2;
  var $31$s2;
  var $29$s2;
  var $27$s2;
  var $20$s2;
  var $11$s2;
  var $7$s2;
  var label = 0;
  var __stackBase__ = STACKTOP;
  STACKTOP = STACKTOP + 4 | 0;
  var $hbuf = __stackBase__;
  if (($strm | 0) == 0) {
    var $_0 = -2;
    var $_0;
    STACKTOP = __stackBase__;
    return $_0;
  }
  var $4 = HEAP32[$strm + 28 >> 2];
  if (($4 | 0) == 0) {
    var $_0 = -2;
    var $_0;
    STACKTOP = __stackBase__;
    return $_0;
  }
  var $7$s2 = ($strm + 12 | 0) >> 2;
  var $8 = HEAP32[$7$s2];
  if (($8 | 0) == 0) {
    var $_0 = -2;
    var $_0;
    STACKTOP = __stackBase__;
    return $_0;
  }
  var $11$s2 = ($strm | 0) >> 2;
  var $12 = HEAP32[$11$s2];
  do {
    if (($12 | 0) == 0) {
      if ((HEAP32[$strm + 4 >> 2] | 0) == 0) {
        break;
      } else {
        var $_0 = -2;
      }
      var $_0;
      STACKTOP = __stackBase__;
      return $_0;
    }
  } while (0);
  var $19 = $4;
  var $20$s2 = ($4 | 0) >> 2;
  var $21 = HEAP32[$20$s2];
  if (($21 | 0) == 11) {
    HEAP32[$20$s2] = 12;
    var $26 = HEAP32[$7$s2];
    var $25 = HEAP32[$11$s2];
    var $24 = 12;
  } else {
    var $26 = $8;
    var $25 = $12;
    var $24 = $21;
  }
  var $24;
  var $25;
  var $26;
  var $27$s2 = ($strm + 16 | 0) >> 2;
  var $28 = HEAP32[$27$s2];
  var $29$s2 = ($strm + 4 | 0) >> 2;
  var $30 = HEAP32[$29$s2];
  var $31$s2 = ($4 + 56 | 0) >> 2;
  var $33$s2 = ($4 + 60 | 0) >> 2;
  var $35$s2 = ($4 + 8 | 0) >> 2;
  var $36$s2 = ($4 + 24 | 0) >> 2;
  var $37 = $hbuf | 0;
  var $38 = $hbuf + 1 | 0;
  var $39$s2 = ($4 + 16 | 0) >> 2;
  var $41$s2 = ($4 + 32 | 0) >> 2;
  var $42$s2 = ($strm + 24 | 0) >> 2;
  var $43 = $4 + 36 | 0;
  var $44 = $4 + 20 | 0;
  var $45$s2 = ($strm + 48 | 0) >> 2;
  var $46$s2 = ($4 + 64 | 0) >> 2;
  var $47 = $4 + 12 | 0;
  var $48$s2 = ($4 + 4 | 0) >> 2;
  var $49$s2 = ($4 + 7108 | 0) >> 2;
  var $50 = $4 + 84 | 0, $50$s2 = $50 >> 2;
  var $52 = $4 + 76 | 0;
  var $53$s2 = ($4 + 72 | 0) >> 2;
  var $54 = $4 + 7112 | 0;
  var $55$s2 = ($4 + 68 | 0) >> 2;
  var $56 = $4 + 44 | 0;
  var $57 = $4 + 7104 | 0;
  var $58 = $4 + 48 | 0;
  var $60 = $4 + 52 | 0;
  var $61 = $4 + 40 | 0;
  var $62$s2 = ($strm + 20 | 0) >> 2;
  var $63$s2 = ($4 + 28 | 0) >> 2;
  var $64$s2 = ($4 + 96 | 0) >> 2;
  var $65$s2 = ($4 + 100 | 0) >> 2;
  var $66$s2 = ($4 + 92 | 0) >> 2;
  var $67$s2 = ($4 + 104 | 0) >> 2;
  var $69 = $4 + 108 | 0;
  var $70 = $69;
  var $71 = $69 | 0;
  var $_c853 = $4 + 1328 | 0;
  var $72 = $4 + 76 | 0;
  var $73 = $4 + 112 | 0;
  var $74 = $73;
  var $76 = $4 + 752 | 0;
  var $77$s1 = $73 >> 1;
  var $79 = $4 + 624 | 0;
  var $80 = $4 + 80 | 0;
  var $81 = $4 + 88 | 0;
  var $83 = $4 + 80 | 0;
  var $84 = $hbuf + 2 | 0;
  var $85 = $hbuf + 3 | 0;
  var $ret_0 = 0;
  var $out_0 = $28;
  var $bits_0 = HEAP32[$33$s2];
  var $hold_0 = HEAP32[$31$s2];
  var $left_0 = $28;
  var $have_0 = $30;
  var $put_0 = $26;
  var $next_0 = $25;
  var $86 = $24;
  L748 : while (1) {
    var $86;
    var $next_0;
    var $put_0;
    var $have_0;
    var $left_0;
    var $hold_0;
    var $bits_0;
    var $out_0;
    var $ret_0;
    L750 : do {
      if (($86 | 0) == 18) {
        var $ret_1_ph = $ret_0;
        var $bits_25_ph = $bits_0;
        var $hold_25_ph = $hold_0;
        var $have_29_ph = $have_0;
        var $next_29_ph = $next_0;
        var $567 = HEAP32[$67$s2];
        label = 725;
        break;
      } else if (($86 | 0) == 16) {
        var $89 = $bits_0 >>> 0 < 14;
        L753 : do {
          if ($89) {
            var $next_26898 = $next_0;
            var $have_26899 = $have_0;
            var $hold_22900 = $hold_0;
            var $bits_22901 = $bits_0;
            while (1) {
              var $bits_22901;
              var $hold_22900;
              var $have_26899;
              var $next_26898;
              if (($have_26899 | 0) == 0) {
                var $ret_8 = $ret_0;
                var $out_4 = $out_0;
                var $bits_53 = $bits_22901;
                var $hold_53 = $hold_22900;
                var $have_57 = 0;
                var $next_57 = $next_26898;
                var $left_01926 = $left_0;
                break L748;
              }
              var $510 = $have_26899 - 1 | 0;
              var $511 = $next_26898 + 1 | 0;
              var $515 = (HEAPU8[$next_26898] << $bits_22901) + $hold_22900 | 0;
              var $516 = $bits_22901 + 8 | 0;
              if ($516 >>> 0 < 14) {
                var $next_26898 = $511;
                var $have_26899 = $510;
                var $hold_22900 = $515;
                var $bits_22901 = $516;
              } else {
                var $next_26_lcssa = $511;
                var $have_26_lcssa = $510;
                var $hold_22_lcssa = $515;
                var $bits_22_lcssa = $516;
                break L753;
              }
            }
          } else {
            var $next_26_lcssa = $next_0;
            var $have_26_lcssa = $have_0;
            var $hold_22_lcssa = $hold_0;
            var $bits_22_lcssa = $bits_0;
          }
        } while (0);
        var $bits_22_lcssa;
        var $hold_22_lcssa;
        var $have_26_lcssa;
        var $next_26_lcssa;
        var $519 = ($hold_22_lcssa & 31) + 257 | 0;
        HEAP32[$64$s2] = $519;
        var $522 = ($hold_22_lcssa >>> 5 & 31) + 1 | 0;
        HEAP32[$65$s2] = $522;
        HEAP32[$66$s2] = ($hold_22_lcssa >>> 10 & 15) + 4 | 0;
        var $526 = $hold_22_lcssa >>> 14;
        var $527 = $bits_22_lcssa - 14 | 0;
        if ($519 >>> 0 > 286 | $522 >>> 0 > 30) {
          HEAP32[$42$s2] = 5255652 | 0;
          HEAP32[$20$s2] = 29;
          var $ret_0_be = $ret_0;
          var $out_0_be = $out_0;
          var $bits_0_be = $527;
          var $hold_0_be = $526;
          var $left_0_be = $left_0;
          var $have_0_be = $have_26_lcssa;
          var $put_0_be = $put_0;
          var $next_0_be = $next_26_lcssa;
          break;
        } else {
          HEAP32[$67$s2] = 0;
          HEAP32[$20$s2] = 17;
          var $next_27933 = $next_26_lcssa;
          var $have_27934 = $have_26_lcssa;
          var $hold_23935 = $526;
          var $bits_23936 = $527;
          var $532 = 0;
          label = 716;
          break;
        }
      } else if (($86 | 0) == 6) {
        var $bits_9 = $bits_0;
        var $hold_9 = $hold_0;
        var $have_11 = $have_0;
        var $next_11 = $next_0;
        var $318 = HEAP32[$39$s2];
        label = 647;
        break;
      } else if (($86 | 0) == 21) {
        var $ret_4 = $ret_0;
        var $bits_37 = $bits_0;
        var $hold_37 = $hold_0;
        var $have_41 = $have_0;
        var $next_41 = $next_0;
        var $781 = HEAP32[$53$s2];
        label = 779;
        break;
      } else if (($86 | 0) == 8) {
        var $bits_11 = $bits_0;
        var $hold_11 = $hold_0;
        var $have_15 = $have_0;
        var $next_15 = $next_0;
        label = 673;
      } else if (($86 | 0) == 4) {
        var $bits_5 = $bits_0;
        var $hold_5 = $hold_0;
        var $have_5 = $have_0;
        var $next_5 = $next_0;
        label = 626;
      } else if (($86 | 0) == 7) {
        var $bits_10 = $bits_0;
        var $hold_10 = $hold_0;
        var $have_13 = $have_0;
        var $next_13 = $next_0;
        label = 660;
      } else if (($86 | 0) == 19) {
        var $ret_2 = $ret_0;
        var $bits_32 = $bits_0;
        var $hold_32 = $hold_0;
        var $have_36 = $have_0;
        var $next_36 = $next_0;
        label = 759;
      } else if (($86 | 0) == 20) {
        var $ret_3 = $ret_0;
        var $bits_33 = $bits_0;
        var $hold_33 = $hold_0;
        var $have_37 = $have_0;
        var $next_37 = $next_0;
        label = 760;
      } else if (($86 | 0) == 22) {
        var $ret_5_ph = $ret_0;
        var $bits_40_ph = $bits_0;
        var $hold_40_ph = $hold_0;
        var $have_44_ph = $have_0;
        var $next_44_ph = $next_0;
        label = 786;
      } else if (($86 | 0) == 5) {
        var $bits_8 = $bits_0;
        var $hold_8 = $hold_0;
        var $have_8 = $have_0;
        var $next_8 = $next_0;
        label = 637;
      } else if (($86 | 0) == 0) {
        var $91 = HEAP32[$35$s2];
        if (($91 | 0) == 0) {
          HEAP32[$20$s2] = 12;
          var $ret_0_be = $ret_0;
          var $out_0_be = $out_0;
          var $bits_0_be = $bits_0;
          var $hold_0_be = $hold_0;
          var $left_0_be = $left_0;
          var $have_0_be = $have_0;
          var $put_0_be = $put_0;
          var $next_0_be = $next_0;
          break;
        }
        var $93 = $bits_0 >>> 0 < 16;
        L767 : do {
          if ($93) {
            var $next_11371 = $next_0;
            var $have_11372 = $have_0;
            var $hold_11373 = $hold_0;
            var $bits_11374 = $bits_0;
            while (1) {
              var $bits_11374;
              var $hold_11373;
              var $have_11372;
              var $next_11371;
              if (($have_11372 | 0) == 0) {
                var $ret_8 = $ret_0;
                var $out_4 = $out_0;
                var $bits_53 = $bits_11374;
                var $hold_53 = $hold_11373;
                var $have_57 = 0;
                var $next_57 = $next_11371;
                var $left_01926 = $left_0;
                break L748;
              }
              var $97 = $have_11372 - 1 | 0;
              var $98 = $next_11371 + 1 | 0;
              var $102 = (HEAPU8[$next_11371] << $bits_11374) + $hold_11373 | 0;
              var $103 = $bits_11374 + 8 | 0;
              if ($103 >>> 0 < 16) {
                var $next_11371 = $98;
                var $have_11372 = $97;
                var $hold_11373 = $102;
                var $bits_11374 = $103;
              } else {
                var $next_1_lcssa = $98;
                var $have_1_lcssa = $97;
                var $hold_1_lcssa = $102;
                var $bits_1_lcssa = $103;
                break L767;
              }
            }
          } else {
            var $next_1_lcssa = $next_0;
            var $have_1_lcssa = $have_0;
            var $hold_1_lcssa = $hold_0;
            var $bits_1_lcssa = $bits_0;
          }
        } while (0);
        var $bits_1_lcssa;
        var $hold_1_lcssa;
        var $have_1_lcssa;
        var $next_1_lcssa;
        if (($91 & 2 | 0) != 0 & ($hold_1_lcssa | 0) == 35615) {
          HEAP32[$36$s2] = _crc32(0, 0, 0);
          HEAP8[$37] = 31;
          HEAP8[$38] = -117;
          HEAP32[$36$s2] = _crc32(HEAP32[$36$s2], $37, 2);
          HEAP32[$20$s2] = 1;
          var $ret_0_be = $ret_0;
          var $out_0_be = $out_0;
          var $bits_0_be = 0;
          var $hold_0_be = 0;
          var $left_0_be = $left_0;
          var $have_0_be = $have_1_lcssa;
          var $put_0_be = $put_0;
          var $next_0_be = $next_1_lcssa;
          break;
        }
        HEAP32[$39$s2] = 0;
        var $113 = HEAP32[$41$s2];
        if (($113 | 0) == 0) {
          var $118 = $91;
        } else {
          HEAP32[$113 + 48 >> 2] = -1;
          var $118 = HEAP32[$35$s2];
        }
        var $118;
        do {
          if (($118 & 1 | 0) != 0) {
            if ((((($hold_1_lcssa << 8 & 65280) + ($hold_1_lcssa >>> 8) | 0) >>> 0) % 31 | 0) != 0) {
              break;
            }
            if (($hold_1_lcssa & 15 | 0) != 8) {
              HEAP32[$42$s2] = 5256044 | 0;
              HEAP32[$20$s2] = 29;
              var $ret_0_be = $ret_0;
              var $out_0_be = $out_0;
              var $bits_0_be = $bits_1_lcssa;
              var $hold_0_be = $hold_1_lcssa;
              var $left_0_be = $left_0;
              var $have_0_be = $have_1_lcssa;
              var $put_0_be = $put_0;
              var $next_0_be = $next_1_lcssa;
              break L750;
            }
            var $134 = $hold_1_lcssa >>> 4;
            var $135 = $bits_1_lcssa - 4 | 0;
            var $137 = ($134 & 15) + 8 | 0;
            var $138 = HEAP32[$43 >> 2];
            do {
              if (($138 | 0) == 0) {
                HEAP32[$43 >> 2] = $137;
              } else {
                if ($137 >>> 0 <= $138 >>> 0) {
                  break;
                }
                HEAP32[$42$s2] = 5255976 | 0;
                HEAP32[$20$s2] = 29;
                var $ret_0_be = $ret_0;
                var $out_0_be = $out_0;
                var $bits_0_be = $135;
                var $hold_0_be = $134;
                var $left_0_be = $left_0;
                var $have_0_be = $have_1_lcssa;
                var $put_0_be = $put_0;
                var $next_0_be = $next_1_lcssa;
                break L750;
              }
            } while (0);
            HEAP32[$44 >> 2] = 1 << $137;
            var $146 = _adler32(0, 0, 0);
            HEAP32[$36$s2] = $146;
            HEAP32[$45$s2] = $146;
            HEAP32[$20$s2] = $hold_1_lcssa >>> 12 & 2 ^ 11;
            var $ret_0_be = $ret_0;
            var $out_0_be = $out_0;
            var $bits_0_be = 0;
            var $hold_0_be = 0;
            var $left_0_be = $left_0;
            var $have_0_be = $have_1_lcssa;
            var $put_0_be = $put_0;
            var $next_0_be = $next_1_lcssa;
            break L750;
          }
        } while (0);
        HEAP32[$42$s2] = 5256268 | 0;
        HEAP32[$20$s2] = 29;
        var $ret_0_be = $ret_0;
        var $out_0_be = $out_0;
        var $bits_0_be = $bits_1_lcssa;
        var $hold_0_be = $hold_1_lcssa;
        var $left_0_be = $left_0;
        var $have_0_be = $have_1_lcssa;
        var $put_0_be = $put_0;
        var $next_0_be = $next_1_lcssa;
        break;
      } else if (($86 | 0) == 13) {
        var $473 = $bits_0 & 7;
        var $474 = $hold_0 >>> ($473 >>> 0);
        var $475 = $bits_0 - $473 | 0;
        var $476 = $475 >>> 0 < 32;
        L791 : do {
          if ($476) {
            var $next_231240 = $next_0;
            var $have_231241 = $have_0;
            var $hold_191242 = $474;
            var $bits_191243 = $475;
            while (1) {
              var $bits_191243;
              var $hold_191242;
              var $have_231241;
              var $next_231240;
              if (($have_231241 | 0) == 0) {
                var $ret_8 = $ret_0;
                var $out_4 = $out_0;
                var $bits_53 = $bits_191243;
                var $hold_53 = $hold_191242;
                var $have_57 = 0;
                var $next_57 = $next_231240;
                var $left_01926 = $left_0;
                break L748;
              }
              var $479 = $have_231241 - 1 | 0;
              var $480 = $next_231240 + 1 | 0;
              var $484 = (HEAPU8[$next_231240] << $bits_191243) + $hold_191242 | 0;
              var $485 = $bits_191243 + 8 | 0;
              if ($485 >>> 0 < 32) {
                var $next_231240 = $480;
                var $have_231241 = $479;
                var $hold_191242 = $484;
                var $bits_191243 = $485;
              } else {
                var $next_23_lcssa = $480;
                var $have_23_lcssa = $479;
                var $hold_19_lcssa = $484;
                var $bits_19_lcssa = $485;
                break L791;
              }
            }
          } else {
            var $next_23_lcssa = $next_0;
            var $have_23_lcssa = $have_0;
            var $hold_19_lcssa = $474;
            var $bits_19_lcssa = $475;
          }
        } while (0);
        var $bits_19_lcssa;
        var $hold_19_lcssa;
        var $have_23_lcssa;
        var $next_23_lcssa;
        var $487 = $hold_19_lcssa & 65535;
        if (($487 | 0) == ($hold_19_lcssa >>> 16 ^ 65535 | 0)) {
          HEAP32[$46$s2] = $487;
          HEAP32[$20$s2] = 14;
          var $bits_20 = 0;
          var $hold_20 = 0;
          var $have_24 = $have_23_lcssa;
          var $next_24 = $next_23_lcssa;
          label = 705;
          break;
        } else {
          HEAP32[$42$s2] = 5255732 | 0;
          HEAP32[$20$s2] = 29;
          var $ret_0_be = $ret_0;
          var $out_0_be = $out_0;
          var $bits_0_be = $bits_19_lcssa;
          var $hold_0_be = $hold_19_lcssa;
          var $left_0_be = $left_0;
          var $have_0_be = $have_23_lcssa;
          var $put_0_be = $put_0;
          var $next_0_be = $next_23_lcssa;
          break;
        }
      } else if (($86 | 0) == 14) {
        var $bits_20 = $bits_0;
        var $hold_20 = $hold_0;
        var $have_24 = $have_0;
        var $next_24 = $next_0;
        label = 705;
      } else if (($86 | 0) == 15) {
        var $bits_21 = $bits_0;
        var $hold_21 = $hold_0;
        var $have_25 = $have_0;
        var $next_25 = $next_0;
        label = 706;
      } else if (($86 | 0) == 17) {
        var $_pre2084 = HEAP32[$67$s2];
        if ($_pre2084 >>> 0 < HEAP32[$66$s2] >>> 0) {
          var $next_27933 = $next_0;
          var $have_27934 = $have_0;
          var $hold_23935 = $hold_0;
          var $bits_23936 = $bits_0;
          var $532 = $_pre2084;
          label = 716;
          break;
        } else {
          var $next_27_lcssa = $next_0;
          var $have_27_lcssa = $have_0;
          var $hold_23_lcssa = $hold_0;
          var $bits_23_lcssa = $bits_0;
          var $_lcssa931 = $_pre2084;
          label = 720;
          break;
        }
      } else if (($86 | 0) == 9) {
        var $88 = $bits_0 >>> 0 < 32;
        L801 : do {
          if ($88) {
            var $next_181257 = $next_0;
            var $have_181258 = $have_0;
            var $hold_141259 = $hold_0;
            var $bits_141260 = $bits_0;
            while (1) {
              var $bits_141260;
              var $hold_141259;
              var $have_181258;
              var $next_181257;
              if (($have_181258 | 0) == 0) {
                var $ret_8 = $ret_0;
                var $out_4 = $out_0;
                var $bits_53 = $bits_141260;
                var $hold_53 = $hold_141259;
                var $have_57 = 0;
                var $next_57 = $next_181257;
                var $left_01926 = $left_0;
                break L748;
              }
              var $430 = $have_181258 - 1 | 0;
              var $431 = $next_181257 + 1 | 0;
              var $435 = (HEAPU8[$next_181257] << $bits_141260) + $hold_141259 | 0;
              var $436 = $bits_141260 + 8 | 0;
              if ($436 >>> 0 < 32) {
                var $next_181257 = $431;
                var $have_181258 = $430;
                var $hold_141259 = $435;
                var $bits_141260 = $436;
              } else {
                var $next_18_lcssa = $431;
                var $have_18_lcssa = $430;
                var $hold_14_lcssa = $435;
                break L801;
              }
            }
          } else {
            var $next_18_lcssa = $next_0;
            var $have_18_lcssa = $have_0;
            var $hold_14_lcssa = $hold_0;
          }
        } while (0);
        var $hold_14_lcssa;
        var $have_18_lcssa;
        var $next_18_lcssa;
        var $438 = _llvm_bswap_i32($hold_14_lcssa);
        HEAP32[$36$s2] = $438;
        HEAP32[$45$s2] = $438;
        HEAP32[$20$s2] = 10;
        var $bits_15 = 0;
        var $hold_15 = 0;
        var $have_19 = $have_18_lcssa;
        var $next_19 = $next_18_lcssa;
        label = 685;
        break;
      } else if (($86 | 0) == 23) {
        var $ret_6 = $ret_0;
        var $bits_43 = $bits_0;
        var $hold_43 = $hold_0;
        var $have_47 = $have_0;
        var $next_47 = $next_0;
        var $870 = HEAP32[$53$s2];
        label = 798;
        break;
      } else if (($86 | 0) == 1) {
        var $87 = $bits_0 >>> 0 < 16;
        L808 : do {
          if ($87) {
            var $next_21288 = $next_0;
            var $have_21289 = $have_0;
            var $hold_21290 = $hold_0;
            var $bits_21291 = $bits_0;
            while (1) {
              var $bits_21291;
              var $hold_21290;
              var $have_21289;
              var $next_21288;
              if (($have_21289 | 0) == 0) {
                var $ret_8 = $ret_0;
                var $out_4 = $out_0;
                var $bits_53 = $bits_21291;
                var $hold_53 = $hold_21290;
                var $have_57 = 0;
                var $next_57 = $next_21288;
                var $left_01926 = $left_0;
                break L748;
              }
              var $152 = $have_21289 - 1 | 0;
              var $153 = $next_21288 + 1 | 0;
              var $157 = (HEAPU8[$next_21288] << $bits_21291) + $hold_21290 | 0;
              var $158 = $bits_21291 + 8 | 0;
              if ($158 >>> 0 < 16) {
                var $next_21288 = $153;
                var $have_21289 = $152;
                var $hold_21290 = $157;
                var $bits_21291 = $158;
              } else {
                var $next_2_lcssa = $153;
                var $have_2_lcssa = $152;
                var $hold_2_lcssa = $157;
                var $bits_2_lcssa = $158;
                break L808;
              }
            }
          } else {
            var $next_2_lcssa = $next_0;
            var $have_2_lcssa = $have_0;
            var $hold_2_lcssa = $hold_0;
            var $bits_2_lcssa = $bits_0;
          }
        } while (0);
        var $bits_2_lcssa;
        var $hold_2_lcssa;
        var $have_2_lcssa;
        var $next_2_lcssa;
        HEAP32[$39$s2] = $hold_2_lcssa;
        if (($hold_2_lcssa & 255 | 0) != 8) {
          HEAP32[$42$s2] = 5256044 | 0;
          HEAP32[$20$s2] = 29;
          var $ret_0_be = $ret_0;
          var $out_0_be = $out_0;
          var $bits_0_be = $bits_2_lcssa;
          var $hold_0_be = $hold_2_lcssa;
          var $left_0_be = $left_0;
          var $have_0_be = $have_2_lcssa;
          var $put_0_be = $put_0;
          var $next_0_be = $next_2_lcssa;
          break;
        }
        if (($hold_2_lcssa & 57344 | 0) != 0) {
          HEAP32[$42$s2] = 5255928 | 0;
          HEAP32[$20$s2] = 29;
          var $ret_0_be = $ret_0;
          var $out_0_be = $out_0;
          var $bits_0_be = $bits_2_lcssa;
          var $hold_0_be = $hold_2_lcssa;
          var $left_0_be = $left_0;
          var $have_0_be = $have_2_lcssa;
          var $put_0_be = $put_0;
          var $next_0_be = $next_2_lcssa;
          break;
        }
        var $168 = HEAP32[$41$s2];
        if (($168 | 0) == 0) {
          var $175 = $hold_2_lcssa;
        } else {
          HEAP32[$168 >> 2] = $hold_2_lcssa >>> 8 & 1;
          var $175 = HEAP32[$39$s2];
        }
        var $175;
        if (($175 & 512 | 0) != 0) {
          HEAP8[$37] = $hold_2_lcssa & 255;
          HEAP8[$38] = $hold_2_lcssa >>> 8 & 255;
          HEAP32[$36$s2] = _crc32(HEAP32[$36$s2], $37, 2);
        }
        HEAP32[$20$s2] = 2;
        var $next_31304 = $next_2_lcssa;
        var $have_31305 = $have_2_lcssa;
        var $hold_31306 = 0;
        var $bits_31307 = 0;
        label = 611;
        break;
      } else if (($86 | 0) == 2) {
        if ($bits_0 >>> 0 < 32) {
          var $next_31304 = $next_0;
          var $have_31305 = $have_0;
          var $hold_31306 = $hold_0;
          var $bits_31307 = $bits_0;
          label = 611;
          break;
        } else {
          var $next_3_lcssa = $next_0;
          var $have_3_lcssa = $have_0;
          var $hold_3_lcssa = $hold_0;
          label = 613;
          break;
        }
      } else if (($86 | 0) == 10) {
        var $bits_15 = $bits_0;
        var $hold_15 = $hold_0;
        var $have_19 = $have_0;
        var $next_19 = $next_0;
        label = 685;
      } else if (($86 | 0) == 11 || ($86 | 0) == 12) {
        var $bits_17 = $bits_0;
        var $hold_17 = $hold_0;
        var $have_21 = $have_0;
        var $next_21 = $next_0;
        label = 688;
      } else if (($86 | 0) == 3) {
        if ($bits_0 >>> 0 < 16) {
          var $next_41319 = $next_0;
          var $have_41320 = $have_0;
          var $hold_41321 = $hold_0;
          var $bits_41322 = $bits_0;
          label = 619;
          break;
        } else {
          var $next_4_lcssa = $next_0;
          var $have_4_lcssa = $have_0;
          var $hold_4_lcssa = $hold_0;
          label = 621;
          break;
        }
      } else if (($86 | 0) == 24) {
        var $ret_7 = $ret_0;
        var $bits_46 = $bits_0;
        var $hold_46 = $hold_0;
        var $have_50 = $have_0;
        var $next_50 = $next_0;
        label = 804;
      } else if (($86 | 0) == 25) {
        if (($left_0 | 0) == 0) {
          var $ret_8 = $ret_0;
          var $out_4 = $out_0;
          var $bits_53 = $bits_0;
          var $hold_53 = $hold_0;
          var $have_57 = $have_0;
          var $next_57 = $next_0;
          var $left_01926 = 0;
          break L748;
        }
        HEAP8[$put_0] = HEAP32[$46$s2] & 255;
        HEAP32[$20$s2] = 20;
        var $ret_0_be = $ret_0;
        var $out_0_be = $out_0;
        var $bits_0_be = $bits_0;
        var $hold_0_be = $hold_0;
        var $left_0_be = $left_0 - 1 | 0;
        var $have_0_be = $have_0;
        var $put_0_be = $put_0 + 1 | 0;
        var $next_0_be = $next_0;
        break;
      } else if (($86 | 0) == 26) {
        do {
          if ((HEAP32[$35$s2] | 0) == 0) {
            var $out_1 = $out_0;
            var $bits_48 = $bits_0;
            var $hold_48 = $hold_0;
            var $have_52 = $have_0;
            var $next_52 = $next_0;
          } else {
            var $955 = $bits_0 >>> 0 < 32;
            L832 : do {
              if ($955) {
                var $next_51869 = $next_0;
                var $have_51870 = $have_0;
                var $hold_47871 = $hold_0;
                var $bits_47872 = $bits_0;
                while (1) {
                  var $bits_47872;
                  var $hold_47871;
                  var $have_51870;
                  var $next_51869;
                  if (($have_51870 | 0) == 0) {
                    var $ret_8 = $ret_0;
                    var $out_4 = $out_0;
                    var $bits_53 = $bits_47872;
                    var $hold_53 = $hold_47871;
                    var $have_57 = 0;
                    var $next_57 = $next_51869;
                    var $left_01926 = $left_0;
                    break L748;
                  }
                  var $958 = $have_51870 - 1 | 0;
                  var $959 = $next_51869 + 1 | 0;
                  var $963 = (HEAPU8[$next_51869] << $bits_47872) + $hold_47871 | 0;
                  var $964 = $bits_47872 + 8 | 0;
                  if ($964 >>> 0 < 32) {
                    var $next_51869 = $959;
                    var $have_51870 = $958;
                    var $hold_47871 = $963;
                    var $bits_47872 = $964;
                  } else {
                    var $next_51_lcssa = $959;
                    var $have_51_lcssa = $958;
                    var $hold_47_lcssa = $963;
                    var $bits_47_lcssa = $964;
                    break L832;
                  }
                }
              } else {
                var $next_51_lcssa = $next_0;
                var $have_51_lcssa = $have_0;
                var $hold_47_lcssa = $hold_0;
                var $bits_47_lcssa = $bits_0;
              }
            } while (0);
            var $bits_47_lcssa;
            var $hold_47_lcssa;
            var $have_51_lcssa;
            var $next_51_lcssa;
            var $966 = $out_0 - $left_0 | 0;
            HEAP32[$62$s2] = HEAP32[$62$s2] + $966 | 0;
            HEAP32[$63$s2] = HEAP32[$63$s2] + $966 | 0;
            if (($out_0 | 0) != ($left_0 | 0)) {
              var $975 = HEAP32[$36$s2];
              var $977 = $put_0 + -$966 | 0;
              if ((HEAP32[$39$s2] | 0) == 0) {
                var $983 = _adler32($975, $977, $966);
              } else {
                var $983 = _crc32($975, $977, $966);
              }
              var $983;
              HEAP32[$36$s2] = $983;
              HEAP32[$45$s2] = $983;
            }
            if ((HEAP32[$39$s2] | 0) == 0) {
              var $990 = _llvm_bswap_i32($hold_47_lcssa);
            } else {
              var $990 = $hold_47_lcssa;
            }
            var $990;
            if (($990 | 0) == (HEAP32[$36$s2] | 0)) {
              var $out_1 = $left_0;
              var $bits_48 = 0;
              var $hold_48 = 0;
              var $have_52 = $have_51_lcssa;
              var $next_52 = $next_51_lcssa;
              break;
            }
            HEAP32[$42$s2] = 5256144 | 0;
            HEAP32[$20$s2] = 29;
            var $ret_0_be = $ret_0;
            var $out_0_be = $left_0;
            var $bits_0_be = $bits_47_lcssa;
            var $hold_0_be = $hold_47_lcssa;
            var $left_0_be = $left_0;
            var $have_0_be = $have_51_lcssa;
            var $put_0_be = $put_0;
            var $next_0_be = $next_51_lcssa;
            break L750;
          }
        } while (0);
        var $next_52;
        var $have_52;
        var $hold_48;
        var $bits_48;
        var $out_1;
        HEAP32[$20$s2] = 27;
        var $out_2 = $out_1;
        var $bits_49 = $bits_48;
        var $hold_49 = $hold_48;
        var $have_53 = $have_52;
        var $next_53 = $next_52;
        label = 835;
        break;
      } else if (($86 | 0) == 27) {
        var $out_2 = $out_0;
        var $bits_49 = $bits_0;
        var $hold_49 = $hold_0;
        var $have_53 = $have_0;
        var $next_53 = $next_0;
        label = 835;
      } else if (($86 | 0) == 29) {
        label = 843;
        break L748;
      } else if (($86 | 0) == 28) {
        var $ret_8 = 1;
        var $out_4 = $out_0;
        var $bits_53 = $bits_0;
        var $hold_53 = $hold_0;
        var $have_57 = $have_0;
        var $next_57 = $next_0;
        var $left_01926 = $left_0;
        break L748;
      } else if (($86 | 0) == 30) {
        var $_0 = -4;
        label = 861;
        break L748;
      } else {
        label = 858;
        break L748;
      }
    } while (0);
    L849 : do {
      if (label == 611) {
        while (1) {
          label = 0;
          var $bits_31307;
          var $hold_31306;
          var $have_31305;
          var $next_31304;
          if (($have_31305 | 0) == 0) {
            var $ret_8 = $ret_0;
            var $out_4 = $out_0;
            var $bits_53 = $bits_31307;
            var $hold_53 = $hold_31306;
            var $have_57 = 0;
            var $next_57 = $next_31304;
            var $left_01926 = $left_0;
            break L748;
          }
          var $187 = $have_31305 - 1 | 0;
          var $188 = $next_31304 + 1 | 0;
          var $192 = (HEAPU8[$next_31304] << $bits_31307) + $hold_31306 | 0;
          var $193 = $bits_31307 + 8 | 0;
          if ($193 >>> 0 < 32) {
            var $next_31304 = $188;
            var $have_31305 = $187;
            var $hold_31306 = $192;
            var $bits_31307 = $193;
            label = 611;
          } else {
            var $next_3_lcssa = $188;
            var $have_3_lcssa = $187;
            var $hold_3_lcssa = $192;
            label = 613;
            break L849;
          }
        }
      } else if (label == 705) {
        label = 0;
        var $next_24;
        var $have_24;
        var $hold_20;
        var $bits_20;
        HEAP32[$20$s2] = 15;
        var $bits_21 = $bits_20;
        var $hold_21 = $hold_20;
        var $have_25 = $have_24;
        var $next_25 = $next_24;
        label = 706;
        break;
      } else if (label == 716) {
        while (1) {
          label = 0;
          var $532;
          var $bits_23936;
          var $hold_23935;
          var $have_27934;
          var $next_27933;
          var $533 = $bits_23936 >>> 0 < 3;
          L856 : do {
            if ($533) {
              var $next_28914 = $next_27933;
              var $have_28915 = $have_27934;
              var $hold_24916 = $hold_23935;
              var $bits_24917 = $bits_23936;
              while (1) {
                var $bits_24917;
                var $hold_24916;
                var $have_28915;
                var $next_28914;
                if (($have_28915 | 0) == 0) {
                  var $ret_8 = $ret_0;
                  var $out_4 = $out_0;
                  var $bits_53 = $bits_24917;
                  var $hold_53 = $hold_24916;
                  var $have_57 = 0;
                  var $next_57 = $next_28914;
                  var $left_01926 = $left_0;
                  break L748;
                }
                var $536 = $have_28915 - 1 | 0;
                var $537 = $next_28914 + 1 | 0;
                var $541 = (HEAPU8[$next_28914] << $bits_24917) + $hold_24916 | 0;
                var $542 = $bits_24917 + 8 | 0;
                if ($542 >>> 0 < 3) {
                  var $next_28914 = $537;
                  var $have_28915 = $536;
                  var $hold_24916 = $541;
                  var $bits_24917 = $542;
                } else {
                  var $next_28_lcssa = $537;
                  var $have_28_lcssa = $536;
                  var $hold_24_lcssa = $541;
                  var $bits_24_lcssa = $542;
                  break L856;
                }
              }
            } else {
              var $next_28_lcssa = $next_27933;
              var $have_28_lcssa = $have_27934;
              var $hold_24_lcssa = $hold_23935;
              var $bits_24_lcssa = $bits_23936;
            }
          } while (0);
          var $bits_24_lcssa;
          var $hold_24_lcssa;
          var $have_28_lcssa;
          var $next_28_lcssa;
          HEAP32[$67$s2] = $532 + 1 | 0;
          HEAP16[(HEAPU16[($532 << 1) + 5244492 >> 1] << 1 >> 1) + $77$s1] = $hold_24_lcssa & 7;
          var $550 = $hold_24_lcssa >>> 3;
          var $551 = $bits_24_lcssa - 3 | 0;
          var $552 = HEAP32[$67$s2];
          if ($552 >>> 0 < HEAP32[$66$s2] >>> 0) {
            var $next_27933 = $next_28_lcssa;
            var $have_27934 = $have_28_lcssa;
            var $hold_23935 = $550;
            var $bits_23936 = $551;
            var $532 = $552;
            label = 716;
          } else {
            var $next_27_lcssa = $next_28_lcssa;
            var $have_27_lcssa = $have_28_lcssa;
            var $hold_23_lcssa = $550;
            var $bits_23_lcssa = $551;
            var $_lcssa931 = $552;
            label = 720;
            break L849;
          }
        }
      } else if (label == 685) {
        label = 0;
        var $next_19;
        var $have_19;
        var $hold_15;
        var $bits_15;
        if ((HEAP32[$47 >> 2] | 0) == 0) {
          label = 686;
          break L748;
        }
        var $444 = _adler32(0, 0, 0);
        HEAP32[$36$s2] = $444;
        HEAP32[$45$s2] = $444;
        HEAP32[$20$s2] = 11;
        var $bits_17 = $bits_15;
        var $hold_17 = $hold_15;
        var $have_21 = $have_19;
        var $next_21 = $next_19;
        label = 688;
        break;
      } else if (label == 835) {
        label = 0;
        var $next_53;
        var $have_53;
        var $hold_49;
        var $bits_49;
        var $out_2;
        if ((HEAP32[$35$s2] | 0) == 0) {
          var $bits_51 = $bits_49;
          var $hold_51 = $hold_49;
          var $have_55 = $have_53;
          var $next_55 = $next_53;
          label = 842;
          break L748;
        }
        if ((HEAP32[$39$s2] | 0) == 0) {
          var $bits_51 = $bits_49;
          var $hold_51 = $hold_49;
          var $have_55 = $have_53;
          var $next_55 = $next_53;
          label = 842;
          break L748;
        }
        var $1000 = $bits_49 >>> 0 < 32;
        L866 : do {
          if ($1000) {
            var $next_54882 = $next_53;
            var $have_54883 = $have_53;
            var $hold_50884 = $hold_49;
            var $bits_50885 = $bits_49;
            while (1) {
              var $bits_50885;
              var $hold_50884;
              var $have_54883;
              var $next_54882;
              if (($have_54883 | 0) == 0) {
                var $ret_8 = $ret_0;
                var $out_4 = $out_2;
                var $bits_53 = $bits_50885;
                var $hold_53 = $hold_50884;
                var $have_57 = 0;
                var $next_57 = $next_54882;
                var $left_01926 = $left_0;
                break L748;
              }
              var $1003 = $have_54883 - 1 | 0;
              var $1004 = $next_54882 + 1 | 0;
              var $1008 = (HEAPU8[$next_54882] << $bits_50885) + $hold_50884 | 0;
              var $1009 = $bits_50885 + 8 | 0;
              if ($1009 >>> 0 < 32) {
                var $next_54882 = $1004;
                var $have_54883 = $1003;
                var $hold_50884 = $1008;
                var $bits_50885 = $1009;
              } else {
                var $next_54_lcssa = $1004;
                var $have_54_lcssa = $1003;
                var $hold_50_lcssa = $1008;
                var $bits_50_lcssa = $1009;
                break L866;
              }
            }
          } else {
            var $next_54_lcssa = $next_53;
            var $have_54_lcssa = $have_53;
            var $hold_50_lcssa = $hold_49;
            var $bits_50_lcssa = $bits_49;
          }
        } while (0);
        var $bits_50_lcssa;
        var $hold_50_lcssa;
        var $have_54_lcssa;
        var $next_54_lcssa;
        if (($hold_50_lcssa | 0) == (HEAP32[$63$s2] | 0)) {
          var $bits_51 = 0;
          var $hold_51 = 0;
          var $have_55 = $have_54_lcssa;
          var $next_55 = $next_54_lcssa;
          label = 842;
          break L748;
        }
        HEAP32[$42$s2] = 5256096 | 0;
        HEAP32[$20$s2] = 29;
        var $ret_0_be = $ret_0;
        var $out_0_be = $out_2;
        var $bits_0_be = $bits_50_lcssa;
        var $hold_0_be = $hold_50_lcssa;
        var $left_0_be = $left_0;
        var $have_0_be = $have_54_lcssa;
        var $put_0_be = $put_0;
        var $next_0_be = $next_54_lcssa;
        break;
      }
    } while (0);
    do {
      if (label == 613) {
        label = 0;
        var $hold_3_lcssa;
        var $have_3_lcssa;
        var $next_3_lcssa;
        var $195 = HEAP32[$41$s2];
        if (($195 | 0) != 0) {
          HEAP32[$195 + 4 >> 2] = $hold_3_lcssa;
        }
        if ((HEAP32[$39$s2] & 512 | 0) != 0) {
          HEAP8[$37] = $hold_3_lcssa & 255;
          HEAP8[$38] = $hold_3_lcssa >>> 8 & 255;
          HEAP8[$84] = $hold_3_lcssa >>> 16 & 255;
          HEAP8[$85] = $hold_3_lcssa >>> 24 & 255;
          HEAP32[$36$s2] = _crc32(HEAP32[$36$s2], $37, 4);
        }
        HEAP32[$20$s2] = 3;
        var $next_41319 = $next_3_lcssa;
        var $have_41320 = $have_3_lcssa;
        var $hold_41321 = 0;
        var $bits_41322 = 0;
        label = 619;
        break;
      } else if (label == 706) {
        label = 0;
        var $next_25;
        var $have_25;
        var $hold_21;
        var $bits_21;
        var $494 = HEAP32[$46$s2];
        if (($494 | 0) == 0) {
          HEAP32[$20$s2] = 11;
          var $ret_0_be = $ret_0;
          var $out_0_be = $out_0;
          var $bits_0_be = $bits_21;
          var $hold_0_be = $hold_21;
          var $left_0_be = $left_0;
          var $have_0_be = $have_25;
          var $put_0_be = $put_0;
          var $next_0_be = $next_25;
          break;
        }
        var $have_25_ = $494 >>> 0 > $have_25 >>> 0 ? $have_25 : $494;
        var $copy_4 = $have_25_ >>> 0 > $left_0 >>> 0 ? $left_0 : $have_25_;
        if (($copy_4 | 0) == 0) {
          var $ret_8 = $ret_0;
          var $out_4 = $out_0;
          var $bits_53 = $bits_21;
          var $hold_53 = $hold_21;
          var $have_57 = $have_25;
          var $next_57 = $next_25;
          var $left_01926 = $left_0;
          break L748;
        }
        _memcpy($put_0, $next_25, $copy_4, 1);
        HEAP32[$46$s2] = HEAP32[$46$s2] - $copy_4 | 0;
        var $ret_0_be = $ret_0;
        var $out_0_be = $out_0;
        var $bits_0_be = $bits_21;
        var $hold_0_be = $hold_21;
        var $left_0_be = $left_0 - $copy_4 | 0;
        var $have_0_be = $have_25 - $copy_4 | 0;
        var $put_0_be = $put_0 + $copy_4 | 0;
        var $next_0_be = $next_25 + $copy_4 | 0;
        break;
      } else if (label == 720) {
        label = 0;
        var $_lcssa931;
        var $bits_23_lcssa;
        var $hold_23_lcssa;
        var $have_27_lcssa;
        var $next_27_lcssa;
        var $555 = $_lcssa931 >>> 0 < 19;
        L886 : do {
          if ($555) {
            var $556 = $_lcssa931;
            while (1) {
              var $556;
              HEAP32[$67$s2] = $556 + 1 | 0;
              HEAP16[(HEAPU16[($556 << 1) + 5244492 >> 1] << 1 >> 1) + $77$s1] = 0;
              var $_pr = HEAP32[$67$s2];
              if ($_pr >>> 0 < 19) {
                var $556 = $_pr;
              } else {
                break L886;
              }
            }
          }
        } while (0);
        HEAP32[$71 >> 2] = $_c853;
        HEAP32[$72 >> 2] = $_c853;
        HEAP32[$50$s2] = 7;
        var $563 = _inflate_table(0, $74, 19, $70, $50, $76);
        if (($563 | 0) == 0) {
          HEAP32[$67$s2] = 0;
          HEAP32[$20$s2] = 18;
          var $ret_1_ph = 0;
          var $bits_25_ph = $bits_23_lcssa;
          var $hold_25_ph = $hold_23_lcssa;
          var $have_29_ph = $have_27_lcssa;
          var $next_29_ph = $next_27_lcssa;
          var $567 = 0;
          label = 725;
          break;
        } else {
          HEAP32[$42$s2] = 5255588 | 0;
          HEAP32[$20$s2] = 29;
          var $ret_0_be = $563;
          var $out_0_be = $out_0;
          var $bits_0_be = $bits_23_lcssa;
          var $hold_0_be = $hold_23_lcssa;
          var $left_0_be = $left_0;
          var $have_0_be = $have_27_lcssa;
          var $put_0_be = $put_0;
          var $next_0_be = $next_27_lcssa;
          break;
        }
      } else if (label == 688) {
        label = 0;
        var $next_21;
        var $have_21;
        var $hold_17;
        var $bits_17;
        if ((HEAP32[$48$s2] | 0) != 0) {
          var $449 = $bits_17 & 7;
          HEAP32[$20$s2] = 26;
          var $ret_0_be = $ret_0;
          var $out_0_be = $out_0;
          var $bits_0_be = $bits_17 - $449 | 0;
          var $hold_0_be = $hold_17 >>> ($449 >>> 0);
          var $left_0_be = $left_0;
          var $have_0_be = $have_21;
          var $put_0_be = $put_0;
          var $next_0_be = $next_21;
          break;
        }
        var $447 = $bits_17 >>> 0 < 3;
        L897 : do {
          if ($447) {
            var $next_221272 = $next_21;
            var $have_221273 = $have_21;
            var $hold_181274 = $hold_17;
            var $bits_181275 = $bits_17;
            while (1) {
              var $bits_181275;
              var $hold_181274;
              var $have_221273;
              var $next_221272;
              if (($have_221273 | 0) == 0) {
                var $ret_8 = $ret_0;
                var $out_4 = $out_0;
                var $bits_53 = $bits_181275;
                var $hold_53 = $hold_181274;
                var $have_57 = 0;
                var $next_57 = $next_221272;
                var $left_01926 = $left_0;
                break L748;
              }
              var $454 = $have_221273 - 1 | 0;
              var $455 = $next_221272 + 1 | 0;
              var $459 = (HEAPU8[$next_221272] << $bits_181275) + $hold_181274 | 0;
              var $460 = $bits_181275 + 8 | 0;
              if ($460 >>> 0 < 3) {
                var $next_221272 = $455;
                var $have_221273 = $454;
                var $hold_181274 = $459;
                var $bits_181275 = $460;
              } else {
                var $next_22_lcssa = $455;
                var $have_22_lcssa = $454;
                var $hold_18_lcssa = $459;
                var $bits_18_lcssa = $460;
                break L897;
              }
            }
          } else {
            var $next_22_lcssa = $next_21;
            var $have_22_lcssa = $have_21;
            var $hold_18_lcssa = $hold_17;
            var $bits_18_lcssa = $bits_17;
          }
        } while (0);
        var $bits_18_lcssa;
        var $hold_18_lcssa;
        var $have_22_lcssa;
        var $next_22_lcssa;
        HEAP32[$48$s2] = $hold_18_lcssa & 1;
        var $464 = $hold_18_lcssa >>> 1 & 3;
        if (($464 | 0) == 1) {
          _fixedtables($19);
          HEAP32[$20$s2] = 19;
        } else if (($464 | 0) == 2) {
          HEAP32[$20$s2] = 16;
        } else if (($464 | 0) == 3) {
          HEAP32[$42$s2] = 5255840 | 0;
          HEAP32[$20$s2] = 29;
        } else if (($464 | 0) == 0) {
          HEAP32[$20$s2] = 13;
        }
        var $ret_0_be = $ret_0;
        var $out_0_be = $out_0;
        var $bits_0_be = $bits_18_lcssa - 3 | 0;
        var $hold_0_be = $hold_18_lcssa >>> 3;
        var $left_0_be = $left_0;
        var $have_0_be = $have_22_lcssa;
        var $put_0_be = $put_0;
        var $next_0_be = $next_22_lcssa;
        break;
      }
    } while (0);
    L908 : do {
      if (label == 725) {
        label = 0;
        var $567;
        var $next_29_ph;
        var $have_29_ph;
        var $hold_25_ph;
        var $bits_25_ph;
        var $ret_1_ph;
        var $568 = HEAP32[$64$s2];
        var $569 = HEAP32[$65$s2];
        do {
          if ($567 >>> 0 < ($569 + $568 | 0) >>> 0) {
            var $next_291065 = $next_29_ph;
            var $have_291066 = $have_29_ph;
            var $hold_251067 = $hold_25_ph;
            var $bits_251068 = $bits_25_ph;
            var $574 = $567;
            var $573 = $568;
            var $572 = $569;
            L911 : while (1) {
              var $572;
              var $573;
              var $574;
              var $bits_251068;
              var $hold_251067;
              var $have_291066;
              var $next_291065;
              var $577 = (1 << HEAP32[$50$s2]) - 1 | 0;
              var $578 = $577 & $hold_251067;
              var $579 = HEAP32[$52 >> 2];
              var $580 = HEAPU8[($578 << 2) + $579 + 1 | 0];
              var $581 = $580 >>> 0 > $bits_251068 >>> 0;
              L913 : do {
                if ($581) {
                  var $next_30960 = $next_291065;
                  var $have_30961 = $have_291066;
                  var $hold_26962 = $hold_251067;
                  var $bits_26963 = $bits_251068;
                  while (1) {
                    var $bits_26963;
                    var $hold_26962;
                    var $have_30961;
                    var $next_30960;
                    if (($have_30961 | 0) == 0) {
                      var $ret_8 = $ret_1_ph;
                      var $out_4 = $out_0;
                      var $bits_53 = $bits_26963;
                      var $hold_53 = $hold_26962;
                      var $have_57 = 0;
                      var $next_57 = $next_30960;
                      var $left_01926 = $left_0;
                      break L748;
                    }
                    var $584 = $have_30961 - 1 | 0;
                    var $585 = $next_30960 + 1 | 0;
                    var $589 = (HEAPU8[$next_30960] << $bits_26963) + $hold_26962 | 0;
                    var $590 = $bits_26963 + 8 | 0;
                    var $591 = $577 & $589;
                    var $592 = HEAPU8[($591 << 2) + $579 + 1 | 0];
                    if ($592 >>> 0 > $590 >>> 0) {
                      var $next_30960 = $585;
                      var $have_30961 = $584;
                      var $hold_26962 = $589;
                      var $bits_26963 = $590;
                    } else {
                      var $next_30_lcssa = $585;
                      var $have_30_lcssa = $584;
                      var $hold_26_lcssa = $589;
                      var $bits_26_lcssa = $590;
                      var $_pn2094 = $591;
                      var $_pn = $592;
                      break L913;
                    }
                  }
                } else {
                  var $next_30_lcssa = $next_291065;
                  var $have_30_lcssa = $have_291066;
                  var $hold_26_lcssa = $hold_251067;
                  var $bits_26_lcssa = $bits_251068;
                  var $_pn2094 = $578;
                  var $_pn = $580;
                }
              } while (0);
              var $_pn;
              var $_pn2094;
              var $bits_26_lcssa;
              var $hold_26_lcssa;
              var $have_30_lcssa;
              var $next_30_lcssa;
              var $here_sroa_2_2_copyload102_lcssa = HEAP16[$579 + ($_pn2094 << 2) + 2 >> 1];
              var $594 = ($here_sroa_2_2_copyload102_lcssa & 65535) < 16;
              L918 : do {
                if ($594) {
                  HEAP32[$67$s2] = $574 + 1 | 0;
                  HEAP16[($574 << 1 >> 1) + $77$s1] = $here_sroa_2_2_copyload102_lcssa;
                  var $bits_25_be = $bits_26_lcssa - $_pn | 0;
                  var $hold_25_be = $hold_26_lcssa >>> ($_pn >>> 0);
                  var $have_29_be = $have_30_lcssa;
                  var $next_29_be = $next_30_lcssa;
                } else {
                  if ($here_sroa_2_2_copyload102_lcssa << 16 >> 16 == 16) {
                    var $608 = $_pn + 2 | 0;
                    var $609 = $bits_26_lcssa >>> 0 < $608 >>> 0;
                    L929 : do {
                      if ($609) {
                        var $next_31995 = $next_30_lcssa;
                        var $have_31996 = $have_30_lcssa;
                        var $hold_27997 = $hold_26_lcssa;
                        var $bits_27998 = $bits_26_lcssa;
                        while (1) {
                          var $bits_27998;
                          var $hold_27997;
                          var $have_31996;
                          var $next_31995;
                          if (($have_31996 | 0) == 0) {
                            var $ret_8 = $ret_1_ph;
                            var $out_4 = $out_0;
                            var $bits_53 = $bits_27998;
                            var $hold_53 = $hold_27997;
                            var $have_57 = 0;
                            var $next_57 = $next_31995;
                            var $left_01926 = $left_0;
                            break L748;
                          }
                          var $614 = $have_31996 - 1 | 0;
                          var $615 = $next_31995 + 1 | 0;
                          var $619 = (HEAPU8[$next_31995] << $bits_27998) + $hold_27997 | 0;
                          var $620 = $bits_27998 + 8 | 0;
                          if ($620 >>> 0 < $608 >>> 0) {
                            var $next_31995 = $615;
                            var $have_31996 = $614;
                            var $hold_27997 = $619;
                            var $bits_27998 = $620;
                          } else {
                            var $next_31_lcssa = $615;
                            var $have_31_lcssa = $614;
                            var $hold_27_lcssa = $619;
                            var $bits_27_lcssa = $620;
                            break L929;
                          }
                        }
                      } else {
                        var $next_31_lcssa = $next_30_lcssa;
                        var $have_31_lcssa = $have_30_lcssa;
                        var $hold_27_lcssa = $hold_26_lcssa;
                        var $bits_27_lcssa = $bits_26_lcssa;
                      }
                    } while (0);
                    var $bits_27_lcssa;
                    var $hold_27_lcssa;
                    var $have_31_lcssa;
                    var $next_31_lcssa;
                    var $622 = $hold_27_lcssa >>> ($_pn >>> 0);
                    var $623 = $bits_27_lcssa - $_pn | 0;
                    if (($574 | 0) == 0) {
                      label = 739;
                      break L911;
                    }
                    var $len_0 = HEAP16[($574 - 1 << 1 >> 1) + $77$s1];
                    var $copy_5 = ($622 & 3) + 3 | 0;
                    var $bits_30 = $623 - 2 | 0;
                    var $hold_30 = $622 >>> 2;
                    var $have_34 = $have_31_lcssa;
                    var $next_34 = $next_31_lcssa;
                  } else if ($here_sroa_2_2_copyload102_lcssa << 16 >> 16 == 17) {
                    var $610 = $_pn + 3 | 0;
                    var $611 = $bits_26_lcssa >>> 0 < $610 >>> 0;
                    L936 : do {
                      if ($611) {
                        var $next_32979 = $next_30_lcssa;
                        var $have_32980 = $have_30_lcssa;
                        var $hold_28981 = $hold_26_lcssa;
                        var $bits_28982 = $bits_26_lcssa;
                        while (1) {
                          var $bits_28982;
                          var $hold_28981;
                          var $have_32980;
                          var $next_32979;
                          if (($have_32980 | 0) == 0) {
                            var $ret_8 = $ret_1_ph;
                            var $out_4 = $out_0;
                            var $bits_53 = $bits_28982;
                            var $hold_53 = $hold_28981;
                            var $have_57 = 0;
                            var $next_57 = $next_32979;
                            var $left_01926 = $left_0;
                            break L748;
                          }
                          var $636 = $have_32980 - 1 | 0;
                          var $637 = $next_32979 + 1 | 0;
                          var $641 = (HEAPU8[$next_32979] << $bits_28982) + $hold_28981 | 0;
                          var $642 = $bits_28982 + 8 | 0;
                          if ($642 >>> 0 < $610 >>> 0) {
                            var $next_32979 = $637;
                            var $have_32980 = $636;
                            var $hold_28981 = $641;
                            var $bits_28982 = $642;
                          } else {
                            var $next_32_lcssa = $637;
                            var $have_32_lcssa = $636;
                            var $hold_28_lcssa = $641;
                            var $bits_28_lcssa = $642;
                            break L936;
                          }
                        }
                      } else {
                        var $next_32_lcssa = $next_30_lcssa;
                        var $have_32_lcssa = $have_30_lcssa;
                        var $hold_28_lcssa = $hold_26_lcssa;
                        var $bits_28_lcssa = $bits_26_lcssa;
                      }
                    } while (0);
                    var $bits_28_lcssa;
                    var $hold_28_lcssa;
                    var $have_32_lcssa;
                    var $next_32_lcssa;
                    var $644 = $hold_28_lcssa >>> ($_pn >>> 0);
                    var $len_0 = 0;
                    var $copy_5 = ($644 & 7) + 3 | 0;
                    var $bits_30 = -3 - $_pn + $bits_28_lcssa | 0;
                    var $hold_30 = $644 >>> 3;
                    var $have_34 = $have_32_lcssa;
                    var $next_34 = $next_32_lcssa;
                  } else {
                    var $606 = $_pn + 7 | 0;
                    var $607 = $bits_26_lcssa >>> 0 < $606 >>> 0;
                    L923 : do {
                      if ($607) {
                        var $next_331011 = $next_30_lcssa;
                        var $have_331012 = $have_30_lcssa;
                        var $hold_291013 = $hold_26_lcssa;
                        var $bits_291014 = $bits_26_lcssa;
                        while (1) {
                          var $bits_291014;
                          var $hold_291013;
                          var $have_331012;
                          var $next_331011;
                          if (($have_331012 | 0) == 0) {
                            var $ret_8 = $ret_1_ph;
                            var $out_4 = $out_0;
                            var $bits_53 = $bits_291014;
                            var $hold_53 = $hold_291013;
                            var $have_57 = 0;
                            var $next_57 = $next_331011;
                            var $left_01926 = $left_0;
                            break L748;
                          }
                          var $652 = $have_331012 - 1 | 0;
                          var $653 = $next_331011 + 1 | 0;
                          var $657 = (HEAPU8[$next_331011] << $bits_291014) + $hold_291013 | 0;
                          var $658 = $bits_291014 + 8 | 0;
                          if ($658 >>> 0 < $606 >>> 0) {
                            var $next_331011 = $653;
                            var $have_331012 = $652;
                            var $hold_291013 = $657;
                            var $bits_291014 = $658;
                          } else {
                            var $next_33_lcssa = $653;
                            var $have_33_lcssa = $652;
                            var $hold_29_lcssa = $657;
                            var $bits_29_lcssa = $658;
                            break L923;
                          }
                        }
                      } else {
                        var $next_33_lcssa = $next_30_lcssa;
                        var $have_33_lcssa = $have_30_lcssa;
                        var $hold_29_lcssa = $hold_26_lcssa;
                        var $bits_29_lcssa = $bits_26_lcssa;
                      }
                    } while (0);
                    var $bits_29_lcssa;
                    var $hold_29_lcssa;
                    var $have_33_lcssa;
                    var $next_33_lcssa;
                    var $660 = $hold_29_lcssa >>> ($_pn >>> 0);
                    var $len_0 = 0;
                    var $copy_5 = ($660 & 127) + 11 | 0;
                    var $bits_30 = -7 - $_pn + $bits_29_lcssa | 0;
                    var $hold_30 = $660 >>> 7;
                    var $have_34 = $have_33_lcssa;
                    var $next_34 = $next_33_lcssa;
                  }
                  var $next_34;
                  var $have_34;
                  var $hold_30;
                  var $bits_30;
                  var $copy_5;
                  var $len_0;
                  if (($574 + $copy_5 | 0) >>> 0 > ($572 + $573 | 0) >>> 0) {
                    label = 748;
                    break L911;
                  } else {
                    var $copy_61023 = $copy_5;
                    var $671 = $574;
                  }
                  while (1) {
                    var $671;
                    var $copy_61023;
                    var $672 = $copy_61023 - 1 | 0;
                    HEAP32[$67$s2] = $671 + 1 | 0;
                    HEAP16[($671 << 1 >> 1) + $77$s1] = $len_0;
                    if (($672 | 0) == 0) {
                      var $bits_25_be = $bits_30;
                      var $hold_25_be = $hold_30;
                      var $have_29_be = $have_34;
                      var $next_29_be = $next_34;
                      break L918;
                    }
                    var $copy_61023 = $672;
                    var $671 = HEAP32[$67$s2];
                  }
                }
              } while (0);
              var $next_29_be;
              var $have_29_be;
              var $hold_25_be;
              var $bits_25_be;
              var $600 = HEAP32[$67$s2];
              var $601 = HEAP32[$64$s2];
              var $602 = HEAP32[$65$s2];
              if ($600 >>> 0 < ($602 + $601 | 0) >>> 0) {
                var $next_291065 = $next_29_be;
                var $have_291066 = $have_29_be;
                var $hold_251067 = $hold_25_be;
                var $bits_251068 = $bits_25_be;
                var $574 = $600;
                var $573 = $601;
                var $572 = $602;
              } else {
                label = 751;
                break;
              }
            }
            if (label == 739) {
              label = 0;
              HEAP32[$42$s2] = 5256356 | 0;
              HEAP32[$20$s2] = 29;
              var $ret_0_be = $ret_1_ph;
              var $out_0_be = $out_0;
              var $bits_0_be = $623;
              var $hold_0_be = $622;
              var $left_0_be = $left_0;
              var $have_0_be = $have_31_lcssa;
              var $put_0_be = $put_0;
              var $next_0_be = $next_31_lcssa;
              break L908;
            } else if (label == 748) {
              label = 0;
              HEAP32[$42$s2] = 5256356 | 0;
              HEAP32[$20$s2] = 29;
              var $ret_0_be = $ret_1_ph;
              var $out_0_be = $out_0;
              var $bits_0_be = $bits_30;
              var $hold_0_be = $hold_30;
              var $left_0_be = $left_0;
              var $have_0_be = $have_34;
              var $put_0_be = $put_0;
              var $next_0_be = $next_34;
              break L908;
            } else if (label == 751) {
              label = 0;
              if ((HEAP32[$20$s2] | 0) == 29) {
                var $ret_0_be = $ret_1_ph;
                var $out_0_be = $out_0;
                var $bits_0_be = $bits_25_be;
                var $hold_0_be = $hold_25_be;
                var $left_0_be = $left_0;
                var $have_0_be = $have_29_be;
                var $put_0_be = $put_0;
                var $next_0_be = $next_29_be;
                break L908;
              } else {
                var $677 = $601;
                var $bits_25_lcssa2108 = $bits_25_be;
                var $hold_25_lcssa2109 = $hold_25_be;
                var $have_29_lcssa2110 = $have_29_be;
                var $next_29_lcssa2111 = $next_29_be;
                break;
              }
            }
          } else {
            var $677 = $568;
            var $bits_25_lcssa2108 = $bits_25_ph;
            var $hold_25_lcssa2109 = $hold_25_ph;
            var $have_29_lcssa2110 = $have_29_ph;
            var $next_29_lcssa2111 = $next_29_ph;
          }
        } while (0);
        var $next_29_lcssa2111;
        var $have_29_lcssa2110;
        var $hold_25_lcssa2109;
        var $bits_25_lcssa2108;
        var $677;
        if (HEAP16[$79 >> 1] << 16 >> 16 == 0) {
          HEAP32[$42$s2] = 5256292 | 0;
          HEAP32[$20$s2] = 29;
          var $ret_0_be = $ret_1_ph;
          var $out_0_be = $out_0;
          var $bits_0_be = $bits_25_lcssa2108;
          var $hold_0_be = $hold_25_lcssa2109;
          var $left_0_be = $left_0;
          var $have_0_be = $have_29_lcssa2110;
          var $put_0_be = $put_0;
          var $next_0_be = $next_29_lcssa2111;
          break;
        }
        HEAP32[$71 >> 2] = $_c853;
        HEAP32[$72 >> 2] = $_c853;
        HEAP32[$50$s2] = 9;
        var $682 = _inflate_table(1, $74, $677, $70, $50, $76);
        if (($682 | 0) != 0) {
          HEAP32[$42$s2] = 5256236 | 0;
          HEAP32[$20$s2] = 29;
          var $ret_0_be = $682;
          var $out_0_be = $out_0;
          var $bits_0_be = $bits_25_lcssa2108;
          var $hold_0_be = $hold_25_lcssa2109;
          var $left_0_be = $left_0;
          var $have_0_be = $have_29_lcssa2110;
          var $put_0_be = $put_0;
          var $next_0_be = $next_29_lcssa2111;
          break;
        }
        HEAP32[$80 >> 2] = HEAP32[$70 >> 2];
        HEAP32[$81 >> 2] = 6;
        var $690 = _inflate_table(2, (HEAP32[$64$s2] << 1) + $74 | 0, HEAP32[$65$s2], $70, $81, $76);
        if (($690 | 0) == 0) {
          HEAP32[$20$s2] = 19;
          var $ret_2 = 0;
          var $bits_32 = $bits_25_lcssa2108;
          var $hold_32 = $hold_25_lcssa2109;
          var $have_36 = $have_29_lcssa2110;
          var $next_36 = $next_29_lcssa2111;
          label = 759;
          break;
        } else {
          HEAP32[$42$s2] = 5256168 | 0;
          HEAP32[$20$s2] = 29;
          var $ret_0_be = $690;
          var $out_0_be = $out_0;
          var $bits_0_be = $bits_25_lcssa2108;
          var $hold_0_be = $hold_25_lcssa2109;
          var $left_0_be = $left_0;
          var $have_0_be = $have_29_lcssa2110;
          var $put_0_be = $put_0;
          var $next_0_be = $next_29_lcssa2111;
          break;
        }
      } else if (label == 619) {
        while (1) {
          label = 0;
          var $bits_41322;
          var $hold_41321;
          var $have_41320;
          var $next_41319;
          if (($have_41320 | 0) == 0) {
            var $ret_8 = $ret_0;
            var $out_4 = $out_0;
            var $bits_53 = $bits_41322;
            var $hold_53 = $hold_41321;
            var $have_57 = 0;
            var $next_57 = $next_41319;
            var $left_01926 = $left_0;
            break L748;
          }
          var $215 = $have_41320 - 1 | 0;
          var $216 = $next_41319 + 1 | 0;
          var $220 = (HEAPU8[$next_41319] << $bits_41322) + $hold_41321 | 0;
          var $221 = $bits_41322 + 8 | 0;
          if ($221 >>> 0 < 16) {
            var $next_41319 = $216;
            var $have_41320 = $215;
            var $hold_41321 = $220;
            var $bits_41322 = $221;
            label = 619;
          } else {
            var $next_4_lcssa = $216;
            var $have_4_lcssa = $215;
            var $hold_4_lcssa = $220;
            label = 621;
            break L908;
          }
        }
      }
    } while (0);
    do {
      if (label == 759) {
        label = 0;
        var $next_36;
        var $have_36;
        var $hold_32;
        var $bits_32;
        var $ret_2;
        HEAP32[$20$s2] = 20;
        var $ret_3 = $ret_2;
        var $bits_33 = $bits_32;
        var $hold_33 = $hold_32;
        var $have_37 = $have_36;
        var $next_37 = $next_36;
        label = 760;
        break;
      } else if (label == 621) {
        label = 0;
        var $hold_4_lcssa;
        var $have_4_lcssa;
        var $next_4_lcssa;
        var $223 = HEAP32[$41$s2];
        if (($223 | 0) != 0) {
          HEAP32[$223 + 8 >> 2] = $hold_4_lcssa & 255;
          HEAP32[HEAP32[$41$s2] + 12 >> 2] = $hold_4_lcssa >>> 8;
        }
        if ((HEAP32[$39$s2] & 512 | 0) != 0) {
          HEAP8[$37] = $hold_4_lcssa & 255;
          HEAP8[$38] = $hold_4_lcssa >>> 8 & 255;
          HEAP32[$36$s2] = _crc32(HEAP32[$36$s2], $37, 2);
        }
        HEAP32[$20$s2] = 4;
        var $bits_5 = 0;
        var $hold_5 = 0;
        var $have_5 = $have_4_lcssa;
        var $next_5 = $next_4_lcssa;
        label = 626;
        break;
      }
    } while (0);
    do {
      if (label == 626) {
        label = 0;
        var $next_5;
        var $have_5;
        var $hold_5;
        var $bits_5;
        var $241 = HEAP32[$39$s2];
        do {
          if (($241 & 1024 | 0) == 0) {
            var $270 = HEAP32[$41$s2];
            if (($270 | 0) == 0) {
              var $bits_7 = $bits_5;
              var $hold_7 = $hold_5;
              var $have_7 = $have_5;
              var $next_7 = $next_5;
              break;
            }
            HEAP32[$270 + 16 >> 2] = 0;
            var $bits_7 = $bits_5;
            var $hold_7 = $hold_5;
            var $have_7 = $have_5;
            var $next_7 = $next_5;
          } else {
            var $244 = $bits_5 >>> 0 < 16;
            L978 : do {
              if ($244) {
                var $next_61334 = $next_5;
                var $have_61335 = $have_5;
                var $hold_61336 = $hold_5;
                var $bits_61337 = $bits_5;
                while (1) {
                  var $bits_61337;
                  var $hold_61336;
                  var $have_61335;
                  var $next_61334;
                  if (($have_61335 | 0) == 0) {
                    var $ret_8 = $ret_0;
                    var $out_4 = $out_0;
                    var $bits_53 = $bits_61337;
                    var $hold_53 = $hold_61336;
                    var $have_57 = 0;
                    var $next_57 = $next_61334;
                    var $left_01926 = $left_0;
                    break L748;
                  }
                  var $247 = $have_61335 - 1 | 0;
                  var $248 = $next_61334 + 1 | 0;
                  var $252 = (HEAPU8[$next_61334] << $bits_61337) + $hold_61336 | 0;
                  var $253 = $bits_61337 + 8 | 0;
                  if ($253 >>> 0 < 16) {
                    var $next_61334 = $248;
                    var $have_61335 = $247;
                    var $hold_61336 = $252;
                    var $bits_61337 = $253;
                  } else {
                    var $next_6_lcssa = $248;
                    var $have_6_lcssa = $247;
                    var $hold_6_lcssa = $252;
                    break L978;
                  }
                }
              } else {
                var $next_6_lcssa = $next_5;
                var $have_6_lcssa = $have_5;
                var $hold_6_lcssa = $hold_5;
              }
            } while (0);
            var $hold_6_lcssa;
            var $have_6_lcssa;
            var $next_6_lcssa;
            HEAP32[$46$s2] = $hold_6_lcssa;
            var $255 = HEAP32[$41$s2];
            if (($255 | 0) == 0) {
              var $260 = $241;
            } else {
              HEAP32[$255 + 20 >> 2] = $hold_6_lcssa;
              var $260 = HEAP32[$39$s2];
            }
            var $260;
            if (($260 & 512 | 0) == 0) {
              var $bits_7 = 0;
              var $hold_7 = 0;
              var $have_7 = $have_6_lcssa;
              var $next_7 = $next_6_lcssa;
              break;
            }
            HEAP8[$37] = $hold_6_lcssa & 255;
            HEAP8[$38] = $hold_6_lcssa >>> 8 & 255;
            HEAP32[$36$s2] = _crc32(HEAP32[$36$s2], $37, 2);
            var $bits_7 = 0;
            var $hold_7 = 0;
            var $have_7 = $have_6_lcssa;
            var $next_7 = $next_6_lcssa;
          }
        } while (0);
        var $next_7;
        var $have_7;
        var $hold_7;
        var $bits_7;
        HEAP32[$20$s2] = 5;
        var $bits_8 = $bits_7;
        var $hold_8 = $hold_7;
        var $have_8 = $have_7;
        var $next_8 = $next_7;
        label = 637;
        break;
      } else if (label == 760) {
        label = 0;
        var $next_37;
        var $have_37;
        var $hold_33;
        var $bits_33;
        var $ret_3;
        if ($have_37 >>> 0 > 5 & $left_0 >>> 0 > 257) {
          HEAP32[$7$s2] = $put_0;
          HEAP32[$27$s2] = $left_0;
          HEAP32[$11$s2] = $next_37;
          HEAP32[$29$s2] = $have_37;
          HEAP32[$31$s2] = $hold_33;
          HEAP32[$33$s2] = $bits_33;
          _inflate_fast($strm, $out_0);
          var $699 = HEAP32[$7$s2];
          var $700 = HEAP32[$27$s2];
          var $701 = HEAP32[$11$s2];
          var $702 = HEAP32[$29$s2];
          var $703 = HEAP32[$31$s2];
          var $704 = HEAP32[$33$s2];
          if ((HEAP32[$20$s2] | 0) != 11) {
            var $ret_0_be = $ret_3;
            var $out_0_be = $out_0;
            var $bits_0_be = $704;
            var $hold_0_be = $703;
            var $left_0_be = $700;
            var $have_0_be = $702;
            var $put_0_be = $699;
            var $next_0_be = $701;
            break;
          }
          HEAP32[$49$s2] = -1;
          var $ret_0_be = $ret_3;
          var $out_0_be = $out_0;
          var $bits_0_be = $704;
          var $hold_0_be = $703;
          var $left_0_be = $700;
          var $have_0_be = $702;
          var $put_0_be = $699;
          var $next_0_be = $701;
          break;
        }
        HEAP32[$49$s2] = 0;
        var $711 = (1 << HEAP32[$50$s2]) - 1 | 0;
        var $712 = $711 & $hold_33;
        var $713 = HEAP32[$52 >> 2];
        var $here_sroa_1_1_copyload721091 = HEAP8[($712 << 2) + $713 + 1 | 0];
        var $714 = $here_sroa_1_1_copyload721091 & 255;
        var $715 = $714 >>> 0 > $bits_33 >>> 0;
        L993 : do {
          if ($715) {
            var $next_381094 = $next_37;
            var $have_381095 = $have_37;
            var $hold_341096 = $hold_33;
            var $bits_341097 = $bits_33;
            while (1) {
              var $bits_341097;
              var $hold_341096;
              var $have_381095;
              var $next_381094;
              if (($have_381095 | 0) == 0) {
                var $ret_8 = $ret_3;
                var $out_4 = $out_0;
                var $bits_53 = $bits_341097;
                var $hold_53 = $hold_341096;
                var $have_57 = 0;
                var $next_57 = $next_381094;
                var $left_01926 = $left_0;
                break L748;
              }
              var $718 = $have_381095 - 1 | 0;
              var $719 = $next_381094 + 1 | 0;
              var $723 = (HEAPU8[$next_381094] << $bits_341097) + $hold_341096 | 0;
              var $724 = $bits_341097 + 8 | 0;
              var $725 = $711 & $723;
              var $here_sroa_1_1_copyload72 = HEAP8[($725 << 2) + $713 + 1 | 0];
              var $726 = $here_sroa_1_1_copyload72 & 255;
              if ($726 >>> 0 > $724 >>> 0) {
                var $next_381094 = $719;
                var $have_381095 = $718;
                var $hold_341096 = $723;
                var $bits_341097 = $724;
              } else {
                var $next_38_lcssa = $719;
                var $have_38_lcssa = $718;
                var $hold_34_lcssa = $723;
                var $bits_34_lcssa = $724;
                var $here_sroa_1_1_copyload72_lcssa = $here_sroa_1_1_copyload72;
                var $_pn2091 = $725;
                var $_lcssa1086 = $726;
                break L993;
              }
            }
          } else {
            var $next_38_lcssa = $next_37;
            var $have_38_lcssa = $have_37;
            var $hold_34_lcssa = $hold_33;
            var $bits_34_lcssa = $bits_33;
            var $here_sroa_1_1_copyload72_lcssa = $here_sroa_1_1_copyload721091;
            var $_pn2091 = $712;
            var $_lcssa1086 = $714;
          }
        } while (0);
        var $_lcssa1086;
        var $_pn2091;
        var $here_sroa_1_1_copyload72_lcssa;
        var $bits_34_lcssa;
        var $hold_34_lcssa;
        var $have_38_lcssa;
        var $next_38_lcssa;
        var $here_sroa_0_0_copyload53_lcssa = HEAP8[($_pn2091 << 2) + $713 | 0];
        var $here_sroa_2_2_copyload96_lcssa = HEAP16[$713 + ($_pn2091 << 2) + 2 >> 1];
        var $728 = $here_sroa_0_0_copyload53_lcssa & 255;
        do {
          if ($here_sroa_0_0_copyload53_lcssa << 24 >> 24 == 0) {
            var $here_sroa_0_0 = 0;
            var $here_sroa_1_0 = $here_sroa_1_1_copyload72_lcssa;
            var $here_sroa_2_0 = $here_sroa_2_2_copyload96_lcssa;
            var $bits_36 = $bits_34_lcssa;
            var $hold_36 = $hold_34_lcssa;
            var $have_40 = $have_38_lcssa;
            var $next_40 = $next_38_lcssa;
            var $761 = 0;
          } else {
            if (($728 & 240 | 0) != 0) {
              var $here_sroa_0_0 = $here_sroa_0_0_copyload53_lcssa;
              var $here_sroa_1_0 = $here_sroa_1_1_copyload72_lcssa;
              var $here_sroa_2_0 = $here_sroa_2_2_copyload96_lcssa;
              var $bits_36 = $bits_34_lcssa;
              var $hold_36 = $hold_34_lcssa;
              var $have_40 = $have_38_lcssa;
              var $next_40 = $next_38_lcssa;
              var $761 = 0;
              break;
            }
            var $733 = $here_sroa_2_2_copyload96_lcssa & 65535;
            var $736 = (1 << $_lcssa1086 + $728) - 1 | 0;
            var $739 = (($hold_34_lcssa & $736) >>> ($_lcssa1086 >>> 0)) + $733 | 0;
            var $here_sroa_1_1_copyload691122 = HEAP8[($739 << 2) + $713 + 1 | 0];
            var $742 = (($here_sroa_1_1_copyload691122 & 255) + $_lcssa1086 | 0) >>> 0 > $bits_34_lcssa >>> 0;
            L1001 : do {
              if ($742) {
                var $next_391123 = $next_38_lcssa;
                var $have_391124 = $have_38_lcssa;
                var $hold_351125 = $hold_34_lcssa;
                var $bits_351126 = $bits_34_lcssa;
                while (1) {
                  var $bits_351126;
                  var $hold_351125;
                  var $have_391124;
                  var $next_391123;
                  if (($have_391124 | 0) == 0) {
                    var $ret_8 = $ret_3;
                    var $out_4 = $out_0;
                    var $bits_53 = $bits_351126;
                    var $hold_53 = $hold_351125;
                    var $have_57 = 0;
                    var $next_57 = $next_391123;
                    var $left_01926 = $left_0;
                    break L748;
                  }
                  var $745 = $have_391124 - 1 | 0;
                  var $746 = $next_391123 + 1 | 0;
                  var $750 = (HEAPU8[$next_391123] << $bits_351126) + $hold_351125 | 0;
                  var $751 = $bits_351126 + 8 | 0;
                  var $754 = (($750 & $736) >>> ($_lcssa1086 >>> 0)) + $733 | 0;
                  var $here_sroa_1_1_copyload69 = HEAP8[($754 << 2) + $713 + 1 | 0];
                  if ((($here_sroa_1_1_copyload69 & 255) + $_lcssa1086 | 0) >>> 0 > $751 >>> 0) {
                    var $next_391123 = $746;
                    var $have_391124 = $745;
                    var $hold_351125 = $750;
                    var $bits_351126 = $751;
                  } else {
                    var $next_39_lcssa = $746;
                    var $have_39_lcssa = $745;
                    var $hold_35_lcssa = $750;
                    var $bits_35_lcssa = $751;
                    var $_lcssa1116 = $754;
                    var $here_sroa_1_1_copyload69_lcssa = $here_sroa_1_1_copyload69;
                    break L1001;
                  }
                }
              } else {
                var $next_39_lcssa = $next_38_lcssa;
                var $have_39_lcssa = $have_38_lcssa;
                var $hold_35_lcssa = $hold_34_lcssa;
                var $bits_35_lcssa = $bits_34_lcssa;
                var $_lcssa1116 = $739;
                var $here_sroa_1_1_copyload69_lcssa = $here_sroa_1_1_copyload691122;
              }
            } while (0);
            var $here_sroa_1_1_copyload69_lcssa;
            var $_lcssa1116;
            var $bits_35_lcssa;
            var $hold_35_lcssa;
            var $have_39_lcssa;
            var $next_39_lcssa;
            var $here_sroa_2_2_copyload94 = HEAP16[$713 + ($_lcssa1116 << 2) + 2 >> 1];
            var $here_sroa_0_0_copyload49 = HEAP8[($_lcssa1116 << 2) + $713 | 0];
            HEAP32[$49$s2] = $_lcssa1086;
            var $here_sroa_0_0 = $here_sroa_0_0_copyload49;
            var $here_sroa_1_0 = $here_sroa_1_1_copyload69_lcssa;
            var $here_sroa_2_0 = $here_sroa_2_2_copyload94;
            var $bits_36 = $bits_35_lcssa - $_lcssa1086 | 0;
            var $hold_36 = $hold_35_lcssa >>> ($_lcssa1086 >>> 0);
            var $have_40 = $have_39_lcssa;
            var $next_40 = $next_39_lcssa;
            var $761 = $_lcssa1086;
          }
        } while (0);
        var $761;
        var $next_40;
        var $have_40;
        var $hold_36;
        var $bits_36;
        var $here_sroa_2_0;
        var $here_sroa_1_0;
        var $here_sroa_0_0;
        var $762 = $here_sroa_1_0 & 255;
        var $763 = $hold_36 >>> ($762 >>> 0);
        var $764 = $bits_36 - $762 | 0;
        HEAP32[$49$s2] = $761 + $762 | 0;
        HEAP32[$46$s2] = $here_sroa_2_0 & 65535;
        var $767 = $here_sroa_0_0 & 255;
        if ($here_sroa_0_0 << 24 >> 24 == 0) {
          HEAP32[$20$s2] = 25;
          var $ret_0_be = $ret_3;
          var $out_0_be = $out_0;
          var $bits_0_be = $764;
          var $hold_0_be = $763;
          var $left_0_be = $left_0;
          var $have_0_be = $have_40;
          var $put_0_be = $put_0;
          var $next_0_be = $next_40;
          break;
        }
        if (($767 & 32 | 0) != 0) {
          HEAP32[$49$s2] = -1;
          HEAP32[$20$s2] = 11;
          var $ret_0_be = $ret_3;
          var $out_0_be = $out_0;
          var $bits_0_be = $764;
          var $hold_0_be = $763;
          var $left_0_be = $left_0;
          var $have_0_be = $have_40;
          var $put_0_be = $put_0;
          var $next_0_be = $next_40;
          break;
        }
        if (($767 & 64 | 0) == 0) {
          var $779 = $767 & 15;
          HEAP32[$53$s2] = $779;
          HEAP32[$20$s2] = 21;
          var $ret_4 = $ret_3;
          var $bits_37 = $764;
          var $hold_37 = $763;
          var $have_41 = $have_40;
          var $next_41 = $next_40;
          var $781 = $779;
          label = 779;
          break;
        } else {
          HEAP32[$42$s2] = 5256016 | 0;
          HEAP32[$20$s2] = 29;
          var $ret_0_be = $ret_3;
          var $out_0_be = $out_0;
          var $bits_0_be = $764;
          var $hold_0_be = $763;
          var $left_0_be = $left_0;
          var $have_0_be = $have_40;
          var $put_0_be = $put_0;
          var $next_0_be = $next_40;
          break;
        }
      }
    } while (0);
    do {
      if (label == 779) {
        label = 0;
        var $781;
        var $next_41;
        var $have_41;
        var $hold_37;
        var $bits_37;
        var $ret_4;
        if (($781 | 0) == 0) {
          var $bits_39 = $bits_37;
          var $hold_39 = $hold_37;
          var $have_43 = $have_41;
          var $next_43 = $next_41;
          var $804 = HEAP32[$46$s2];
        } else {
          var $783 = $bits_37 >>> 0 < $781 >>> 0;
          L1021 : do {
            if ($783) {
              var $next_421144 = $next_41;
              var $have_421145 = $have_41;
              var $hold_381146 = $hold_37;
              var $bits_381147 = $bits_37;
              while (1) {
                var $bits_381147;
                var $hold_381146;
                var $have_421145;
                var $next_421144;
                if (($have_421145 | 0) == 0) {
                  var $ret_8 = $ret_4;
                  var $out_4 = $out_0;
                  var $bits_53 = $bits_381147;
                  var $hold_53 = $hold_381146;
                  var $have_57 = 0;
                  var $next_57 = $next_421144;
                  var $left_01926 = $left_0;
                  break L748;
                }
                var $786 = $have_421145 - 1 | 0;
                var $787 = $next_421144 + 1 | 0;
                var $791 = (HEAPU8[$next_421144] << $bits_381147) + $hold_381146 | 0;
                var $792 = $bits_381147 + 8 | 0;
                if ($792 >>> 0 < $781 >>> 0) {
                  var $next_421144 = $787;
                  var $have_421145 = $786;
                  var $hold_381146 = $791;
                  var $bits_381147 = $792;
                } else {
                  var $next_42_lcssa = $787;
                  var $have_42_lcssa = $786;
                  var $hold_38_lcssa = $791;
                  var $bits_38_lcssa = $792;
                  break L1021;
                }
              }
            } else {
              var $next_42_lcssa = $next_41;
              var $have_42_lcssa = $have_41;
              var $hold_38_lcssa = $hold_37;
              var $bits_38_lcssa = $bits_37;
            }
          } while (0);
          var $bits_38_lcssa;
          var $hold_38_lcssa;
          var $have_42_lcssa;
          var $next_42_lcssa;
          var $798 = HEAP32[$46$s2] + ((1 << $781) - 1 & $hold_38_lcssa) | 0;
          HEAP32[$46$s2] = $798;
          HEAP32[$49$s2] = HEAP32[$49$s2] + $781 | 0;
          var $bits_39 = $bits_38_lcssa - $781 | 0;
          var $hold_39 = $hold_38_lcssa >>> ($781 >>> 0);
          var $have_43 = $have_42_lcssa;
          var $next_43 = $next_42_lcssa;
          var $804 = $798;
        }
        var $804;
        var $next_43;
        var $have_43;
        var $hold_39;
        var $bits_39;
        HEAP32[$54 >> 2] = $804;
        HEAP32[$20$s2] = 22;
        var $ret_5_ph = $ret_4;
        var $bits_40_ph = $bits_39;
        var $hold_40_ph = $hold_39;
        var $have_44_ph = $have_43;
        var $next_44_ph = $next_43;
        label = 786;
        break;
      } else if (label == 637) {
        label = 0;
        var $next_8;
        var $have_8;
        var $hold_8;
        var $bits_8;
        var $275 = HEAP32[$39$s2];
        if (($275 & 1024 | 0) == 0) {
          var $have_10 = $have_8;
          var $next_10 = $next_8;
          var $316 = $275;
        } else {
          var $279 = HEAP32[$46$s2];
          var $have_8_ = $279 >>> 0 > $have_8 >>> 0 ? $have_8 : $279;
          if (($have_8_ | 0) == 0) {
            var $have_9 = $have_8;
            var $next_9 = $next_8;
            var $313 = $279;
            var $312 = $275;
          } else {
            var $283 = HEAP32[$41$s2], $283$s2 = $283 >> 2;
            do {
              if (($283 | 0) == 0) {
                var $301 = $275;
              } else {
                var $287 = HEAP32[$283$s2 + 4];
                if (($287 | 0) == 0) {
                  var $301 = $275;
                  break;
                }
                var $292 = HEAP32[$283$s2 + 5] - $279 | 0;
                var $296 = HEAP32[$283$s2 + 6];
                _memcpy($287 + $292 | 0, $next_8, ($292 + $have_8_ | 0) >>> 0 > $296 >>> 0 ? $296 - $292 | 0 : $have_8_, 1);
                var $301 = HEAP32[$39$s2];
              }
            } while (0);
            var $301;
            if (($301 & 512 | 0) != 0) {
              HEAP32[$36$s2] = _crc32(HEAP32[$36$s2], $next_8, $have_8_);
            }
            var $310 = HEAP32[$46$s2] - $have_8_ | 0;
            HEAP32[$46$s2] = $310;
            var $have_9 = $have_8 - $have_8_ | 0;
            var $next_9 = $next_8 + $have_8_ | 0;
            var $313 = $310;
            var $312 = $301;
          }
          var $312;
          var $313;
          var $next_9;
          var $have_9;
          if (($313 | 0) == 0) {
            var $have_10 = $have_9;
            var $next_10 = $next_9;
            var $316 = $312;
          } else {
            var $ret_8 = $ret_0;
            var $out_4 = $out_0;
            var $bits_53 = $bits_8;
            var $hold_53 = $hold_8;
            var $have_57 = $have_9;
            var $next_57 = $next_9;
            var $left_01926 = $left_0;
            break L748;
          }
        }
        var $316;
        var $next_10;
        var $have_10;
        HEAP32[$46$s2] = 0;
        HEAP32[$20$s2] = 6;
        var $bits_9 = $bits_8;
        var $hold_9 = $hold_8;
        var $have_11 = $have_10;
        var $next_11 = $next_10;
        var $318 = $316;
        label = 647;
        break;
      }
    } while (0);
    do {
      if (label == 786) {
        label = 0;
        var $next_44_ph;
        var $have_44_ph;
        var $hold_40_ph;
        var $bits_40_ph;
        var $ret_5_ph;
        var $807 = (1 << HEAP32[$81 >> 2]) - 1 | 0;
        var $808 = $807 & $hold_40_ph;
        var $809 = HEAP32[$83 >> 2];
        var $here_sroa_1_1_copyload631171 = HEAP8[($808 << 2) + $809 + 1 | 0];
        var $810 = $here_sroa_1_1_copyload631171 & 255;
        var $811 = $810 >>> 0 > $bits_40_ph >>> 0;
        L1043 : do {
          if ($811) {
            var $next_441174 = $next_44_ph;
            var $have_441175 = $have_44_ph;
            var $hold_401176 = $hold_40_ph;
            var $bits_401177 = $bits_40_ph;
            while (1) {
              var $bits_401177;
              var $hold_401176;
              var $have_441175;
              var $next_441174;
              if (($have_441175 | 0) == 0) {
                var $ret_8 = $ret_5_ph;
                var $out_4 = $out_0;
                var $bits_53 = $bits_401177;
                var $hold_53 = $hold_401176;
                var $have_57 = 0;
                var $next_57 = $next_441174;
                var $left_01926 = $left_0;
                break L748;
              }
              var $814 = $have_441175 - 1 | 0;
              var $815 = $next_441174 + 1 | 0;
              var $819 = (HEAPU8[$next_441174] << $bits_401177) + $hold_401176 | 0;
              var $820 = $bits_401177 + 8 | 0;
              var $821 = $807 & $819;
              var $here_sroa_1_1_copyload63 = HEAP8[($821 << 2) + $809 + 1 | 0];
              var $822 = $here_sroa_1_1_copyload63 & 255;
              if ($822 >>> 0 > $820 >>> 0) {
                var $next_441174 = $815;
                var $have_441175 = $814;
                var $hold_401176 = $819;
                var $bits_401177 = $820;
              } else {
                var $next_44_lcssa = $815;
                var $have_44_lcssa = $814;
                var $hold_40_lcssa = $819;
                var $bits_40_lcssa = $820;
                var $here_sroa_1_1_copyload63_lcssa = $here_sroa_1_1_copyload63;
                var $_pn2089 = $821;
                var $_lcssa1166 = $822;
                break L1043;
              }
            }
          } else {
            var $next_44_lcssa = $next_44_ph;
            var $have_44_lcssa = $have_44_ph;
            var $hold_40_lcssa = $hold_40_ph;
            var $bits_40_lcssa = $bits_40_ph;
            var $here_sroa_1_1_copyload63_lcssa = $here_sroa_1_1_copyload631171;
            var $_pn2089 = $808;
            var $_lcssa1166 = $810;
          }
        } while (0);
        var $_lcssa1166;
        var $_pn2089;
        var $here_sroa_1_1_copyload63_lcssa;
        var $bits_40_lcssa;
        var $hold_40_lcssa;
        var $have_44_lcssa;
        var $next_44_lcssa;
        var $here_sroa_0_0_copyload43_lcssa = HEAP8[($_pn2089 << 2) + $809 | 0];
        var $here_sroa_2_2_copyload91_lcssa = HEAP16[$809 + ($_pn2089 << 2) + 2 >> 1];
        var $824 = $here_sroa_0_0_copyload43_lcssa & 255;
        if (($824 & 240 | 0) == 0) {
          var $827 = $here_sroa_2_2_copyload91_lcssa & 65535;
          var $830 = (1 << $_lcssa1166 + $824) - 1 | 0;
          var $833 = (($hold_40_lcssa & $830) >>> ($_lcssa1166 >>> 0)) + $827 | 0;
          var $here_sroa_1_1_copyload1201 = HEAP8[($833 << 2) + $809 + 1 | 0];
          var $836 = (($here_sroa_1_1_copyload1201 & 255) + $_lcssa1166 | 0) >>> 0 > $bits_40_lcssa >>> 0;
          L1051 : do {
            if ($836) {
              var $next_451202 = $next_44_lcssa;
              var $have_451203 = $have_44_lcssa;
              var $hold_411204 = $hold_40_lcssa;
              var $bits_411205 = $bits_40_lcssa;
              while (1) {
                var $bits_411205;
                var $hold_411204;
                var $have_451203;
                var $next_451202;
                if (($have_451203 | 0) == 0) {
                  var $ret_8 = $ret_5_ph;
                  var $out_4 = $out_0;
                  var $bits_53 = $bits_411205;
                  var $hold_53 = $hold_411204;
                  var $have_57 = 0;
                  var $next_57 = $next_451202;
                  var $left_01926 = $left_0;
                  break L748;
                }
                var $839 = $have_451203 - 1 | 0;
                var $840 = $next_451202 + 1 | 0;
                var $844 = (HEAPU8[$next_451202] << $bits_411205) + $hold_411204 | 0;
                var $845 = $bits_411205 + 8 | 0;
                var $848 = (($844 & $830) >>> ($_lcssa1166 >>> 0)) + $827 | 0;
                var $here_sroa_1_1_copyload = HEAP8[($848 << 2) + $809 + 1 | 0];
                if ((($here_sroa_1_1_copyload & 255) + $_lcssa1166 | 0) >>> 0 > $845 >>> 0) {
                  var $next_451202 = $840;
                  var $have_451203 = $839;
                  var $hold_411204 = $844;
                  var $bits_411205 = $845;
                } else {
                  var $next_45_lcssa = $840;
                  var $have_45_lcssa = $839;
                  var $hold_41_lcssa = $844;
                  var $bits_41_lcssa = $845;
                  var $_lcssa1195 = $848;
                  var $here_sroa_1_1_copyload_lcssa = $here_sroa_1_1_copyload;
                  break L1051;
                }
              }
            } else {
              var $next_45_lcssa = $next_44_lcssa;
              var $have_45_lcssa = $have_44_lcssa;
              var $hold_41_lcssa = $hold_40_lcssa;
              var $bits_41_lcssa = $bits_40_lcssa;
              var $_lcssa1195 = $833;
              var $here_sroa_1_1_copyload_lcssa = $here_sroa_1_1_copyload1201;
            }
          } while (0);
          var $here_sroa_1_1_copyload_lcssa;
          var $_lcssa1195;
          var $bits_41_lcssa;
          var $hold_41_lcssa;
          var $have_45_lcssa;
          var $next_45_lcssa;
          var $here_sroa_2_2_copyload = HEAP16[$809 + ($_lcssa1195 << 2) + 2 >> 1];
          var $here_sroa_0_0_copyload = HEAP8[($_lcssa1195 << 2) + $809 | 0];
          var $855 = HEAP32[$49$s2] + $_lcssa1166 | 0;
          HEAP32[$49$s2] = $855;
          var $here_sroa_0_1 = $here_sroa_0_0_copyload;
          var $here_sroa_1_1 = $here_sroa_1_1_copyload_lcssa;
          var $here_sroa_2_1 = $here_sroa_2_2_copyload;
          var $bits_42 = $bits_41_lcssa - $_lcssa1166 | 0;
          var $hold_42 = $hold_41_lcssa >>> ($_lcssa1166 >>> 0);
          var $have_46 = $have_45_lcssa;
          var $next_46 = $next_45_lcssa;
          var $857 = $855;
        } else {
          var $here_sroa_0_1 = $here_sroa_0_0_copyload43_lcssa;
          var $here_sroa_1_1 = $here_sroa_1_1_copyload63_lcssa;
          var $here_sroa_2_1 = $here_sroa_2_2_copyload91_lcssa;
          var $bits_42 = $bits_40_lcssa;
          var $hold_42 = $hold_40_lcssa;
          var $have_46 = $have_44_lcssa;
          var $next_46 = $next_44_lcssa;
          var $857 = HEAP32[$49$s2];
        }
        var $857;
        var $next_46;
        var $have_46;
        var $hold_42;
        var $bits_42;
        var $here_sroa_2_1;
        var $here_sroa_1_1;
        var $here_sroa_0_1;
        var $858 = $here_sroa_1_1 & 255;
        var $859 = $hold_42 >>> ($858 >>> 0);
        var $860 = $bits_42 - $858 | 0;
        HEAP32[$49$s2] = $857 + $858 | 0;
        var $862 = $here_sroa_0_1 & 255;
        if (($862 & 64 | 0) == 0) {
          HEAP32[$55$s2] = $here_sroa_2_1 & 65535;
          var $868 = $862 & 15;
          HEAP32[$53$s2] = $868;
          HEAP32[$20$s2] = 23;
          var $ret_6 = $ret_5_ph;
          var $bits_43 = $860;
          var $hold_43 = $859;
          var $have_47 = $have_46;
          var $next_47 = $next_46;
          var $870 = $868;
          label = 798;
          break;
        } else {
          HEAP32[$42$s2] = 5256120 | 0;
          HEAP32[$20$s2] = 29;
          var $ret_0_be = $ret_5_ph;
          var $out_0_be = $out_0;
          var $bits_0_be = $860;
          var $hold_0_be = $859;
          var $left_0_be = $left_0;
          var $have_0_be = $have_46;
          var $put_0_be = $put_0;
          var $next_0_be = $next_46;
          break;
        }
      } else if (label == 647) {
        label = 0;
        var $318;
        var $next_11;
        var $have_11;
        var $hold_9;
        var $bits_9;
        do {
          if (($318 & 2048 | 0) == 0) {
            var $354 = HEAP32[$41$s2];
            if (($354 | 0) == 0) {
              var $have_12 = $have_11;
              var $next_12 = $next_11;
              break;
            }
            HEAP32[$354 + 28 >> 2] = 0;
            var $have_12 = $have_11;
            var $next_12 = $next_11;
          } else {
            if (($have_11 | 0) == 0) {
              var $ret_8 = $ret_0;
              var $out_4 = $out_0;
              var $bits_53 = $bits_9;
              var $hold_53 = $hold_9;
              var $have_57 = 0;
              var $next_57 = $next_11;
              var $left_01926 = $left_0;
              break L748;
            } else {
              var $copy_1 = 0;
            }
            while (1) {
              var $copy_1;
              var $323 = $copy_1 + 1 | 0;
              var $325 = HEAP8[$next_11 + $copy_1 | 0];
              var $326 = HEAP32[$41$s2];
              do {
                if (($326 | 0) != 0) {
                  var $329 = $326 + 28 | 0;
                  if ((HEAP32[$329 >> 2] | 0) == 0) {
                    break;
                  }
                  var $333 = HEAP32[$46$s2];
                  if ($333 >>> 0 >= HEAP32[$326 + 32 >> 2] >>> 0) {
                    break;
                  }
                  HEAP32[$46$s2] = $333 + 1 | 0;
                  HEAP8[HEAP32[$329 >> 2] + $333 | 0] = $325;
                }
              } while (0);
              var $342 = $325 << 24 >> 24 != 0;
              if ($342 & $323 >>> 0 < $have_11 >>> 0) {
                var $copy_1 = $323;
              } else {
                break;
              }
            }
            if ((HEAP32[$39$s2] & 512 | 0) != 0) {
              HEAP32[$36$s2] = _crc32(HEAP32[$36$s2], $next_11, $323);
            }
            var $351 = $have_11 - $323 | 0;
            var $352 = $next_11 + $323 | 0;
            if ($342) {
              var $ret_8 = $ret_0;
              var $out_4 = $out_0;
              var $bits_53 = $bits_9;
              var $hold_53 = $hold_9;
              var $have_57 = $351;
              var $next_57 = $352;
              var $left_01926 = $left_0;
              break L748;
            } else {
              var $have_12 = $351;
              var $next_12 = $352;
            }
          }
        } while (0);
        var $next_12;
        var $have_12;
        HEAP32[$46$s2] = 0;
        HEAP32[$20$s2] = 7;
        var $bits_10 = $bits_9;
        var $hold_10 = $hold_9;
        var $have_13 = $have_12;
        var $next_13 = $next_12;
        label = 660;
        break;
      }
    } while (0);
    do {
      if (label == 660) {
        label = 0;
        var $next_13;
        var $have_13;
        var $hold_10;
        var $bits_10;
        do {
          if ((HEAP32[$39$s2] & 4096 | 0) == 0) {
            var $395 = HEAP32[$41$s2];
            if (($395 | 0) == 0) {
              var $have_14 = $have_13;
              var $next_14 = $next_13;
              break;
            }
            HEAP32[$395 + 36 >> 2] = 0;
            var $have_14 = $have_13;
            var $next_14 = $next_13;
          } else {
            if (($have_13 | 0) == 0) {
              var $ret_8 = $ret_0;
              var $out_4 = $out_0;
              var $bits_53 = $bits_10;
              var $hold_53 = $hold_10;
              var $have_57 = 0;
              var $next_57 = $next_13;
              var $left_01926 = $left_0;
              break L748;
            } else {
              var $copy_2 = 0;
            }
            while (1) {
              var $copy_2;
              var $364 = $copy_2 + 1 | 0;
              var $366 = HEAP8[$next_13 + $copy_2 | 0];
              var $367 = HEAP32[$41$s2];
              do {
                if (($367 | 0) != 0) {
                  var $370 = $367 + 36 | 0;
                  if ((HEAP32[$370 >> 2] | 0) == 0) {
                    break;
                  }
                  var $374 = HEAP32[$46$s2];
                  if ($374 >>> 0 >= HEAP32[$367 + 40 >> 2] >>> 0) {
                    break;
                  }
                  HEAP32[$46$s2] = $374 + 1 | 0;
                  HEAP8[HEAP32[$370 >> 2] + $374 | 0] = $366;
                }
              } while (0);
              var $383 = $366 << 24 >> 24 != 0;
              if ($383 & $364 >>> 0 < $have_13 >>> 0) {
                var $copy_2 = $364;
              } else {
                break;
              }
            }
            if ((HEAP32[$39$s2] & 512 | 0) != 0) {
              HEAP32[$36$s2] = _crc32(HEAP32[$36$s2], $next_13, $364);
            }
            var $392 = $have_13 - $364 | 0;
            var $393 = $next_13 + $364 | 0;
            if ($383) {
              var $ret_8 = $ret_0;
              var $out_4 = $out_0;
              var $bits_53 = $bits_10;
              var $hold_53 = $hold_10;
              var $have_57 = $392;
              var $next_57 = $393;
              var $left_01926 = $left_0;
              break L748;
            } else {
              var $have_14 = $392;
              var $next_14 = $393;
            }
          }
        } while (0);
        var $next_14;
        var $have_14;
        HEAP32[$20$s2] = 8;
        var $bits_11 = $bits_10;
        var $hold_11 = $hold_10;
        var $have_15 = $have_14;
        var $next_15 = $next_14;
        label = 673;
        break;
      } else if (label == 798) {
        label = 0;
        var $870;
        var $next_47;
        var $have_47;
        var $hold_43;
        var $bits_43;
        var $ret_6;
        if (($870 | 0) == 0) {
          var $bits_45 = $bits_43;
          var $hold_45 = $hold_43;
          var $have_49 = $have_47;
          var $next_49 = $next_47;
        } else {
          var $872 = $bits_43 >>> 0 < $870 >>> 0;
          L1098 : do {
            if ($872) {
              var $next_481223 = $next_47;
              var $have_481224 = $have_47;
              var $hold_441225 = $hold_43;
              var $bits_441226 = $bits_43;
              while (1) {
                var $bits_441226;
                var $hold_441225;
                var $have_481224;
                var $next_481223;
                if (($have_481224 | 0) == 0) {
                  var $ret_8 = $ret_6;
                  var $out_4 = $out_0;
                  var $bits_53 = $bits_441226;
                  var $hold_53 = $hold_441225;
                  var $have_57 = 0;
                  var $next_57 = $next_481223;
                  var $left_01926 = $left_0;
                  break L748;
                }
                var $875 = $have_481224 - 1 | 0;
                var $876 = $next_481223 + 1 | 0;
                var $880 = (HEAPU8[$next_481223] << $bits_441226) + $hold_441225 | 0;
                var $881 = $bits_441226 + 8 | 0;
                if ($881 >>> 0 < $870 >>> 0) {
                  var $next_481223 = $876;
                  var $have_481224 = $875;
                  var $hold_441225 = $880;
                  var $bits_441226 = $881;
                } else {
                  var $next_48_lcssa = $876;
                  var $have_48_lcssa = $875;
                  var $hold_44_lcssa = $880;
                  var $bits_44_lcssa = $881;
                  break L1098;
                }
              }
            } else {
              var $next_48_lcssa = $next_47;
              var $have_48_lcssa = $have_47;
              var $hold_44_lcssa = $hold_43;
              var $bits_44_lcssa = $bits_43;
            }
          } while (0);
          var $bits_44_lcssa;
          var $hold_44_lcssa;
          var $have_48_lcssa;
          var $next_48_lcssa;
          HEAP32[$55$s2] = HEAP32[$55$s2] + ((1 << $870) - 1 & $hold_44_lcssa) | 0;
          HEAP32[$49$s2] = HEAP32[$49$s2] + $870 | 0;
          var $bits_45 = $bits_44_lcssa - $870 | 0;
          var $hold_45 = $hold_44_lcssa >>> ($870 >>> 0);
          var $have_49 = $have_48_lcssa;
          var $next_49 = $next_48_lcssa;
        }
        var $next_49;
        var $have_49;
        var $hold_45;
        var $bits_45;
        HEAP32[$20$s2] = 24;
        var $ret_7 = $ret_6;
        var $bits_46 = $bits_45;
        var $hold_46 = $hold_45;
        var $have_50 = $have_49;
        var $next_50 = $next_49;
        label = 804;
        break;
      }
    } while (0);
    L1104 : do {
      if (label == 673) {
        label = 0;
        var $next_15;
        var $have_15;
        var $hold_11;
        var $bits_11;
        var $400 = HEAP32[$39$s2];
        do {
          if (($400 & 512 | 0) == 0) {
            var $bits_13 = $bits_11;
            var $hold_13 = $hold_11;
            var $have_17 = $have_15;
            var $next_17 = $next_15;
          } else {
            var $403 = $bits_11 >>> 0 < 16;
            L1108 : do {
              if ($403) {
                var $next_161355 = $next_15;
                var $have_161356 = $have_15;
                var $hold_121357 = $hold_11;
                var $bits_121358 = $bits_11;
                while (1) {
                  var $bits_121358;
                  var $hold_121357;
                  var $have_161356;
                  var $next_161355;
                  if (($have_161356 | 0) == 0) {
                    var $ret_8 = $ret_0;
                    var $out_4 = $out_0;
                    var $bits_53 = $bits_121358;
                    var $hold_53 = $hold_121357;
                    var $have_57 = 0;
                    var $next_57 = $next_161355;
                    var $left_01926 = $left_0;
                    break L748;
                  }
                  var $406 = $have_161356 - 1 | 0;
                  var $407 = $next_161355 + 1 | 0;
                  var $411 = (HEAPU8[$next_161355] << $bits_121358) + $hold_121357 | 0;
                  var $412 = $bits_121358 + 8 | 0;
                  if ($412 >>> 0 < 16) {
                    var $next_161355 = $407;
                    var $have_161356 = $406;
                    var $hold_121357 = $411;
                    var $bits_121358 = $412;
                  } else {
                    var $next_16_lcssa = $407;
                    var $have_16_lcssa = $406;
                    var $hold_12_lcssa = $411;
                    var $bits_12_lcssa = $412;
                    break L1108;
                  }
                }
              } else {
                var $next_16_lcssa = $next_15;
                var $have_16_lcssa = $have_15;
                var $hold_12_lcssa = $hold_11;
                var $bits_12_lcssa = $bits_11;
              }
            } while (0);
            var $bits_12_lcssa;
            var $hold_12_lcssa;
            var $have_16_lcssa;
            var $next_16_lcssa;
            if (($hold_12_lcssa | 0) == (HEAP32[$36$s2] & 65535 | 0)) {
              var $bits_13 = 0;
              var $hold_13 = 0;
              var $have_17 = $have_16_lcssa;
              var $next_17 = $next_16_lcssa;
              break;
            }
            HEAP32[$42$s2] = 5255884 | 0;
            HEAP32[$20$s2] = 29;
            var $ret_0_be = $ret_0;
            var $out_0_be = $out_0;
            var $bits_0_be = $bits_12_lcssa;
            var $hold_0_be = $hold_12_lcssa;
            var $left_0_be = $left_0;
            var $have_0_be = $have_16_lcssa;
            var $put_0_be = $put_0;
            var $next_0_be = $next_16_lcssa;
            break L1104;
          }
        } while (0);
        var $next_17;
        var $have_17;
        var $hold_13;
        var $bits_13;
        var $418 = HEAP32[$41$s2];
        if (($418 | 0) != 0) {
          HEAP32[$418 + 44 >> 2] = $400 >>> 9 & 1;
          HEAP32[HEAP32[$41$s2] + 48 >> 2] = 1;
        }
        var $427 = _crc32(0, 0, 0);
        HEAP32[$36$s2] = $427;
        HEAP32[$45$s2] = $427;
        HEAP32[$20$s2] = 11;
        var $ret_0_be = $ret_0;
        var $out_0_be = $out_0;
        var $bits_0_be = $bits_13;
        var $hold_0_be = $hold_13;
        var $left_0_be = $left_0;
        var $have_0_be = $have_17;
        var $put_0_be = $put_0;
        var $next_0_be = $next_17;
      } else if (label == 804) {
        label = 0;
        var $next_50;
        var $have_50;
        var $hold_46;
        var $bits_46;
        var $ret_7;
        if (($left_0 | 0) == 0) {
          var $ret_8 = $ret_7;
          var $out_4 = $out_0;
          var $bits_53 = $bits_46;
          var $hold_53 = $hold_46;
          var $have_57 = $have_50;
          var $next_57 = $next_50;
          var $left_01926 = 0;
          break L748;
        }
        var $896 = $out_0 - $left_0 | 0;
        var $897 = HEAP32[$55$s2];
        if ($897 >>> 0 > $896 >>> 0) {
          var $900 = $897 - $896 | 0;
          do {
            if ($900 >>> 0 > HEAP32[$56 >> 2] >>> 0) {
              if ((HEAP32[$57 >> 2] | 0) == 0) {
                break;
              }
              HEAP32[$42$s2] = 5255764 | 0;
              HEAP32[$20$s2] = 29;
              var $ret_0_be = $ret_7;
              var $out_0_be = $out_0;
              var $bits_0_be = $bits_46;
              var $hold_0_be = $hold_46;
              var $left_0_be = $left_0;
              var $have_0_be = $have_50;
              var $put_0_be = $put_0;
              var $next_0_be = $next_50;
              break L1104;
            }
          } while (0);
          var $908 = HEAP32[$58 >> 2];
          if ($900 >>> 0 > $908 >>> 0) {
            var $911 = $900 - $908 | 0;
            var $from_0 = HEAP32[$60 >> 2] + (HEAP32[$61 >> 2] - $911) | 0;
            var $copy_7 = $911;
          } else {
            var $from_0 = HEAP32[$60 >> 2] + ($908 - $900) | 0;
            var $copy_7 = $900;
          }
          var $copy_7;
          var $from_0;
          var $921 = HEAP32[$46$s2];
          var $from_1 = $from_0;
          var $copy_8 = $copy_7 >>> 0 > $921 >>> 0 ? $921 : $copy_7;
          var $928 = $921;
        } else {
          var $926 = HEAP32[$46$s2];
          var $from_1 = $put_0 + -$897 | 0;
          var $copy_8 = $926;
          var $928 = $926;
        }
        var $928;
        var $copy_8;
        var $from_1;
        var $left_0_copy_8 = $copy_8 >>> 0 > $left_0 >>> 0 ? $left_0 : $copy_8;
        HEAP32[$46$s2] = $928 - $left_0_copy_8 | 0;
        var $931 = $left_0 ^ -1;
        var $932 = $copy_8 ^ -1;
        var $umax = $931 >>> 0 > $932 >>> 0 ? $931 : $932;
        var $from_2 = $from_1;
        var $copy_10 = $left_0_copy_8;
        var $put_1 = $put_0;
        while (1) {
          var $put_1;
          var $copy_10;
          var $from_2;
          HEAP8[$put_1] = HEAP8[$from_2];
          var $938 = $copy_10 - 1 | 0;
          if (($938 | 0) == 0) {
            break;
          } else {
            var $from_2 = $from_2 + 1 | 0;
            var $copy_10 = $938;
            var $put_1 = $put_1 + 1 | 0;
          }
        }
        var $941 = $left_0 - $left_0_copy_8 | 0;
        var $scevgep1745 = $put_0 + ($umax ^ -1) | 0;
        if ((HEAP32[$46$s2] | 0) != 0) {
          var $ret_0_be = $ret_7;
          var $out_0_be = $out_0;
          var $bits_0_be = $bits_46;
          var $hold_0_be = $hold_46;
          var $left_0_be = $941;
          var $have_0_be = $have_50;
          var $put_0_be = $scevgep1745;
          var $next_0_be = $next_50;
          break;
        }
        HEAP32[$20$s2] = 20;
        var $ret_0_be = $ret_7;
        var $out_0_be = $out_0;
        var $bits_0_be = $bits_46;
        var $hold_0_be = $hold_46;
        var $left_0_be = $941;
        var $have_0_be = $have_50;
        var $put_0_be = $scevgep1745;
        var $next_0_be = $next_50;
      }
    } while (0);
    var $next_0_be;
    var $put_0_be;
    var $have_0_be;
    var $left_0_be;
    var $hold_0_be;
    var $bits_0_be;
    var $out_0_be;
    var $ret_0_be;
    var $ret_0 = $ret_0_be;
    var $out_0 = $out_0_be;
    var $bits_0 = $bits_0_be;
    var $hold_0 = $hold_0_be;
    var $left_0 = $left_0_be;
    var $have_0 = $have_0_be;
    var $put_0 = $put_0_be;
    var $next_0 = $next_0_be;
    var $86 = HEAP32[$20$s2];
  }
  if (label == 686) {
    HEAP32[$7$s2] = $put_0;
    HEAP32[$27$s2] = $left_0;
    HEAP32[$11$s2] = $next_19;
    HEAP32[$29$s2] = $have_19;
    HEAP32[$31$s2] = $hold_15;
    HEAP32[$33$s2] = $bits_15;
    var $_0 = 2;
    var $_0;
    STACKTOP = __stackBase__;
    return $_0;
  } else if (label == 842) {
    var $next_55;
    var $have_55;
    var $hold_51;
    var $bits_51;
    HEAP32[$20$s2] = 28;
    var $ret_8 = 1;
    var $out_4 = $out_2;
    var $bits_53 = $bits_51;
    var $hold_53 = $hold_51;
    var $have_57 = $have_55;
    var $next_57 = $next_55;
    var $left_01926 = $left_0;
  } else if (label == 843) {
    var $ret_8 = -3;
    var $out_4 = $out_0;
    var $bits_53 = $bits_0;
    var $hold_53 = $hold_0;
    var $have_57 = $have_0;
    var $next_57 = $next_0;
    var $left_01926 = $left_0;
  } else if (label == 858) {
    var $_0 = -2;
    var $_0;
    STACKTOP = __stackBase__;
    return $_0;
  } else if (label == 861) {
    var $_0;
    STACKTOP = __stackBase__;
    return $_0;
  }
  var $left_01926;
  var $next_57;
  var $have_57;
  var $hold_53;
  var $bits_53;
  var $out_4;
  var $ret_8;
  HEAP32[$7$s2] = $put_0;
  HEAP32[$27$s2] = $left_01926;
  HEAP32[$11$s2] = $next_57;
  HEAP32[$29$s2] = $have_57;
  HEAP32[$31$s2] = $hold_53;
  HEAP32[$33$s2] = $bits_53;
  do {
    if ((HEAP32[$61 >> 2] | 0) == 0) {
      var $1018 = HEAP32[$27$s2];
      if (($out_4 | 0) == ($1018 | 0)) {
        var $1028 = $out_4;
        break;
      }
      if (HEAP32[$20$s2] >>> 0 < 29) {
        label = 847;
        break;
      } else {
        var $1028 = $1018;
        break;
      }
    } else {
      label = 847;
    }
  } while (0);
  do {
    if (label == 847) {
      if ((_updatewindow($strm, $out_4) | 0) == 0) {
        var $1028 = HEAP32[$27$s2];
        break;
      }
      HEAP32[$20$s2] = 30;
      var $_0 = -4;
      var $_0;
      STACKTOP = __stackBase__;
      return $_0;
    }
  } while (0);
  var $1028;
  var $1029 = HEAP32[$29$s2];
  var $1031 = $out_4 - $1028 | 0;
  var $1032 = $strm + 8 | 0;
  HEAP32[$1032 >> 2] = $30 - $1029 + HEAP32[$1032 >> 2] | 0;
  HEAP32[$62$s2] = HEAP32[$62$s2] + $1031 | 0;
  HEAP32[$63$s2] = HEAP32[$63$s2] + $1031 | 0;
  var $1041 = ($out_4 | 0) == ($1028 | 0);
  if (!((HEAP32[$35$s2] | 0) == 0 | $1041)) {
    var $1045 = HEAP32[$36$s2];
    var $1048 = HEAP32[$7$s2] + -$1031 | 0;
    if ((HEAP32[$39$s2] | 0) == 0) {
      var $1054 = _adler32($1045, $1048, $1031);
    } else {
      var $1054 = _crc32($1045, $1048, $1031);
    }
    var $1054;
    HEAP32[$36$s2] = $1054;
    HEAP32[$45$s2] = $1054;
  }
  var $1061 = HEAP32[$20$s2];
  if (($1061 | 0) == 19) {
    var $1069 = 256;
  } else {
    var $1069 = ($1061 | 0) == 14 ? 256 : 0;
  }
  var $1069;
  HEAP32[$strm + 44 >> 2] = ((HEAP32[$48$s2] | 0) != 0 ? 64 : 0) + HEAP32[$33$s2] + (($1061 | 0) == 11 ? 128 : 0) + $1069 | 0;
  var $_0 = ($30 | 0) == ($1029 | 0) & $1041 & ($ret_8 | 0) == 0 ? -5 : $ret_8;
  var $_0;
  STACKTOP = __stackBase__;
  return $_0;
}
_inflate["X"] = 1;
function _fixedtables($state) {
  HEAP32[$state + 76 >> 2] = 5244532 | 0;
  HEAP32[$state + 84 >> 2] = 9;
  HEAP32[$state + 80 >> 2] = 5246580 | 0;
  HEAP32[$state + 88 >> 2] = 5;
  return;
}
function _init_block($s) {
  var $n_019 = 0;
  while (1) {
    var $n_019;
    HEAP16[$s + ($n_019 << 2) + 148 >> 1] = 0;
    var $57 = $n_019 + 1 | 0;
    if (($57 | 0) == 286) {
      break;
    } else {
      var $n_019 = $57;
    }
  }
  HEAP16[$s + 2440 >> 1] = 0;
  HEAP16[$s + 2444 >> 1] = 0;
  HEAP16[$s + 2448 >> 1] = 0;
  HEAP16[$s + 2452 >> 1] = 0;
  HEAP16[$s + 2456 >> 1] = 0;
  HEAP16[$s + 2460 >> 1] = 0;
  HEAP16[$s + 2464 >> 1] = 0;
  HEAP16[$s + 2468 >> 1] = 0;
  HEAP16[$s + 2472 >> 1] = 0;
  HEAP16[$s + 2476 >> 1] = 0;
  HEAP16[$s + 2480 >> 1] = 0;
  HEAP16[$s + 2484 >> 1] = 0;
  HEAP16[$s + 2488 >> 1] = 0;
  HEAP16[$s + 2492 >> 1] = 0;
  HEAP16[$s + 2496 >> 1] = 0;
  HEAP16[$s + 2500 >> 1] = 0;
  HEAP16[$s + 2504 >> 1] = 0;
  HEAP16[$s + 2508 >> 1] = 0;
  HEAP16[$s + 2512 >> 1] = 0;
  HEAP16[$s + 2516 >> 1] = 0;
  HEAP16[$s + 2520 >> 1] = 0;
  HEAP16[$s + 2524 >> 1] = 0;
  HEAP16[$s + 2528 >> 1] = 0;
  HEAP16[$s + 2532 >> 1] = 0;
  HEAP16[$s + 2536 >> 1] = 0;
  HEAP16[$s + 2540 >> 1] = 0;
  HEAP16[$s + 2544 >> 1] = 0;
  HEAP16[$s + 2548 >> 1] = 0;
  HEAP16[$s + 2552 >> 1] = 0;
  HEAP16[$s + 2556 >> 1] = 0;
  HEAP16[$s + 2684 >> 1] = 0;
  HEAP16[$s + 2688 >> 1] = 0;
  HEAP16[$s + 2692 >> 1] = 0;
  HEAP16[$s + 2696 >> 1] = 0;
  HEAP16[$s + 2700 >> 1] = 0;
  HEAP16[$s + 2704 >> 1] = 0;
  HEAP16[$s + 2708 >> 1] = 0;
  HEAP16[$s + 2712 >> 1] = 0;
  HEAP16[$s + 2716 >> 1] = 0;
  HEAP16[$s + 2720 >> 1] = 0;
  HEAP16[$s + 2724 >> 1] = 0;
  HEAP16[$s + 2728 >> 1] = 0;
  HEAP16[$s + 2732 >> 1] = 0;
  HEAP16[$s + 2736 >> 1] = 0;
  HEAP16[$s + 2740 >> 1] = 0;
  HEAP16[$s + 2744 >> 1] = 0;
  HEAP16[$s + 2748 >> 1] = 0;
  HEAP16[$s + 2752 >> 1] = 0;
  HEAP16[$s + 2756 >> 1] = 0;
  HEAP16[$s + 1172 >> 1] = 1;
  HEAP32[$s + 5804 >> 2] = 0;
  HEAP32[$s + 5800 >> 2] = 0;
  HEAP32[$s + 5808 >> 2] = 0;
  HEAP32[$s + 5792 >> 2] = 0;
  return;
}
_init_block["X"] = 1;
function _bi_flush($s) {
  var $24$s1;
  var $8$s2;
  var $5$s1;
  var $1$s2;
  var $1$s2 = ($s + 5820 | 0) >> 2;
  var $2 = HEAP32[$1$s2];
  if (($2 | 0) == 16) {
    var $5$s1 = ($s + 5816 | 0) >> 1;
    var $7 = HEAP16[$5$s1] & 255;
    var $8$s2 = ($s + 20 | 0) >> 2;
    var $9 = HEAP32[$8$s2];
    HEAP32[$8$s2] = $9 + 1 | 0;
    var $11 = $s + 8 | 0;
    HEAP8[HEAP32[$11 >> 2] + $9 | 0] = $7;
    var $16 = HEAPU16[$5$s1] >>> 8 & 255;
    var $17 = HEAP32[$8$s2];
    HEAP32[$8$s2] = $17 + 1 | 0;
    HEAP8[HEAP32[$11 >> 2] + $17 | 0] = $16;
    HEAP16[$5$s1] = 0;
    HEAP32[$1$s2] = 0;
    return;
  }
  if (($2 | 0) <= 7) {
    return;
  }
  var $24$s1 = ($s + 5816 | 0) >> 1;
  var $26 = HEAP16[$24$s1] & 255;
  var $27 = $s + 20 | 0;
  var $28 = HEAP32[$27 >> 2];
  HEAP32[$27 >> 2] = $28 + 1 | 0;
  HEAP8[HEAP32[$s + 8 >> 2] + $28 | 0] = $26;
  HEAP16[$24$s1] = HEAPU16[$24$s1] >>> 8;
  HEAP32[$1$s2] = HEAP32[$1$s2] - 8 | 0;
  return;
}
function _updatewindow($strm, $out) {
  var $44$s2;
  var $20$s2;
  var $2$s2;
  var $strm$s2 = $strm >> 2;
  var $2 = HEAP32[$strm$s2 + 7], $2$s2 = $2 >> 2;
  var $3 = $2 + 52 | 0;
  var $4 = $3;
  var $5 = HEAP32[$4 >> 2];
  do {
    if (($5 | 0) == 0) {
      var $15 = FUNCTION_TABLE[HEAP32[$strm$s2 + 8]](HEAP32[$strm$s2 + 10], 1 << HEAP32[$2$s2 + 9], 1);
      HEAP32[$3 >> 2] = $15;
      if (($15 | 0) == 0) {
        var $_0 = 1;
      } else {
        var $19 = $15;
        break;
      }
      var $_0;
      return $_0;
    } else {
      var $19 = $5;
    }
  } while (0);
  var $19;
  var $20$s2 = ($2 + 40 | 0) >> 2;
  var $21 = HEAP32[$20$s2];
  if (($21 | 0) == 0) {
    var $26 = 1 << HEAP32[$2$s2 + 9];
    HEAP32[$20$s2] = $26;
    HEAP32[$2$s2 + 12] = 0;
    HEAP32[$2$s2 + 11] = 0;
    var $30 = $26;
  } else {
    var $30 = $21;
  }
  var $30;
  var $33 = $out - HEAP32[$strm$s2 + 4] | 0;
  if ($33 >>> 0 >= $30 >>> 0) {
    _memcpy($19, HEAP32[$strm$s2 + 3] + -$30 | 0, $30, 1);
    HEAP32[$2$s2 + 12] = 0;
    HEAP32[$2$s2 + 11] = HEAP32[$20$s2];
    var $_0 = 0;
    var $_0;
    return $_0;
  }
  var $44$s2 = ($2 + 48 | 0) >> 2;
  var $45 = HEAP32[$44$s2];
  var $46 = $30 - $45 | 0;
  var $_ = $46 >>> 0 > $33 >>> 0 ? $33 : $46;
  var $49 = $strm + 12 | 0;
  _memcpy($19 + $45 | 0, HEAP32[$49 >> 2] + -$33 | 0, $_, 1);
  var $53 = $33 - $_ | 0;
  if (($33 | 0) != ($_ | 0)) {
    _memcpy(HEAP32[$4 >> 2], HEAP32[$49 >> 2] + -$53 | 0, $53, 1);
    HEAP32[$44$s2] = $53;
    HEAP32[$2$s2 + 11] = HEAP32[$20$s2];
    var $_0 = 0;
    var $_0;
    return $_0;
  }
  var $64 = HEAP32[$44$s2] + $33 | 0;
  HEAP32[$44$s2] = $64;
  var $65 = HEAP32[$20$s2];
  if (($64 | 0) == ($65 | 0)) {
    HEAP32[$44$s2] = 0;
  }
  var $69 = $2 + 44 | 0;
  var $70 = HEAP32[$69 >> 2];
  if ($70 >>> 0 >= $65 >>> 0) {
    var $_0 = 0;
    var $_0;
    return $_0;
  }
  HEAP32[$69 >> 2] = $70 + $33 | 0;
  var $_0 = 0;
  var $_0;
  return $_0;
}
_updatewindow["X"] = 1;
function _inflateEnd($strm) {
  var $3$s2;
  if (($strm | 0) == 0) {
    return;
  }
  var $3$s2 = ($strm + 28 | 0) >> 2;
  var $4 = HEAP32[$3$s2];
  if (($4 | 0) == 0) {
    return;
  }
  var $7 = $strm + 36 | 0;
  var $8 = HEAP32[$7 >> 2];
  if (($8 | 0) == 0) {
    return;
  }
  var $13 = HEAP32[$4 + 52 >> 2];
  var $_pre13 = $strm + 40 | 0;
  if (($13 | 0) == 0) {
    var $18 = $8;
    var $17 = $4;
  } else {
    FUNCTION_TABLE[$8](HEAP32[$_pre13 >> 2], $13);
    var $18 = HEAP32[$7 >> 2];
    var $17 = HEAP32[$3$s2];
  }
  var $17;
  var $18;
  FUNCTION_TABLE[$18](HEAP32[$_pre13 >> 2], $17);
  HEAP32[$3$s2] = 0;
  return;
}
function _inflate_table($type, $lens, $codes, $table, $bits, $work) {
  var $offs$s1;
  var $count$s1;
  var $table$s2 = $table >> 2;
  var label = 0;
  var __stackBase__ = STACKTOP;
  STACKTOP = STACKTOP + 32 | 0;
  var $count = __stackBase__, $count$s1 = $count >> 1;
  var $offs = STACKTOP, $offs$s1 = $offs >> 1;
  STACKTOP = STACKTOP + 32 | 0;
  _memset($count, 0, 32, 2);
  var $0 = ($codes | 0) == 0;
  L1219 : do {
    if (!$0) {
      var $sym_0196 = 0;
      while (1) {
        var $sym_0196;
        var $4 = (HEAPU16[$lens + ($sym_0196 << 1) >> 1] << 1) + $count | 0;
        HEAP16[$4 >> 1] = HEAP16[$4 >> 1] + 1 & 65535;
        var $7 = $sym_0196 + 1 | 0;
        if (($7 | 0) == ($codes | 0)) {
          break L1219;
        } else {
          var $sym_0196 = $7;
        }
      }
    }
  } while (0);
  var $8 = HEAP32[$bits >> 2];
  var $max_0 = 15;
  while (1) {
    var $max_0;
    if (($max_0 | 0) == 0) {
      label = 916;
      break;
    }
    if (HEAP16[($max_0 << 1 >> 1) + $count$s1] << 16 >> 16 == 0) {
      var $max_0 = $max_0 - 1 | 0;
    } else {
      break;
    }
  }
  if (label == 916) {
    var $18 = HEAP32[$table$s2];
    HEAP32[$table$s2] = $18 + 4 | 0;
    HEAP8[$18 | 0] = 64;
    HEAP8[$18 + 1 | 0] = 1;
    HEAP16[$18 + 2 >> 1] = 0;
    var $20 = HEAP32[$table$s2];
    HEAP32[$table$s2] = $20 + 4 | 0;
    HEAP8[$20 | 0] = 64;
    HEAP8[$20 + 1 | 0] = 1;
    HEAP16[$20 + 2 >> 1] = 0;
    HEAP32[$bits >> 2] = 1;
    var $_0 = 0;
    var $_0;
    STACKTOP = __stackBase__;
    return $_0;
  }
  var $max_0_160 = $8 >>> 0 > $max_0 >>> 0 ? $max_0 : $8;
  var $min_0 = 1;
  while (1) {
    var $min_0;
    if ($min_0 >>> 0 >= $max_0 >>> 0) {
      break;
    }
    if (HEAP16[($min_0 << 1 >> 1) + $count$s1] << 16 >> 16 == 0) {
      var $min_0 = $min_0 + 1 | 0;
    } else {
      break;
    }
  }
  var $min_0_max_0_ = $max_0_160 >>> 0 < $min_0 >>> 0 ? $min_0 : $max_0_160;
  var $left_0 = 1;
  var $len_1 = 1;
  while (1) {
    var $len_1;
    var $left_0;
    if ($len_1 >>> 0 >= 16) {
      break;
    }
    var $38 = ($left_0 << 1) - HEAPU16[($len_1 << 1 >> 1) + $count$s1] | 0;
    if (($38 | 0) < 0) {
      var $_0 = -1;
      label = 958;
      break;
    } else {
      var $left_0 = $38;
      var $len_1 = $len_1 + 1 | 0;
    }
  }
  if (label == 958) {
    var $_0;
    STACKTOP = __stackBase__;
    return $_0;
  }
  do {
    if (($left_0 | 0) > 0) {
      if (($type | 0) != 0 & ($max_0 | 0) == 1) {
        break;
      } else {
        var $_0 = -1;
      }
      var $_0;
      STACKTOP = __stackBase__;
      return $_0;
    }
  } while (0);
  HEAP16[$offs$s1 + 1] = 0;
  var $48 = HEAP16[$count$s1 + 1];
  HEAP16[$offs$s1 + 2] = $48;
  var $52 = HEAP16[$count$s1 + 2] + $48 & 65535;
  HEAP16[$offs$s1 + 3] = $52;
  var $56 = HEAP16[$count$s1 + 3] + $52 & 65535;
  HEAP16[$offs$s1 + 4] = $56;
  var $60 = HEAP16[$count$s1 + 4] + $56 & 65535;
  HEAP16[$offs$s1 + 5] = $60;
  var $64 = HEAP16[$count$s1 + 5] + $60 & 65535;
  HEAP16[$offs$s1 + 6] = $64;
  var $68 = HEAP16[$count$s1 + 6] + $64 & 65535;
  HEAP16[$offs$s1 + 7] = $68;
  var $72 = HEAP16[$count$s1 + 7] + $68 & 65535;
  HEAP16[$offs$s1 + 8] = $72;
  var $76 = HEAP16[$count$s1 + 8] + $72 & 65535;
  HEAP16[$offs$s1 + 9] = $76;
  var $80 = HEAP16[$count$s1 + 9] + $76 & 65535;
  HEAP16[$offs$s1 + 10] = $80;
  var $84 = HEAP16[$count$s1 + 10] + $80 & 65535;
  HEAP16[$offs$s1 + 11] = $84;
  var $88 = HEAP16[$count$s1 + 11] + $84 & 65535;
  HEAP16[$offs$s1 + 12] = $88;
  var $92 = HEAP16[$count$s1 + 12] + $88 & 65535;
  HEAP16[$offs$s1 + 13] = $92;
  var $96 = HEAP16[$count$s1 + 13] + $92 & 65535;
  HEAP16[$offs$s1 + 14] = $96;
  HEAP16[$offs$s1 + 15] = HEAP16[$count$s1 + 14] + $96 & 65535;
  L1244 : do {
    if (!$0) {
      var $sym_1188 = 0;
      while (1) {
        var $sym_1188;
        var $103 = HEAP16[$lens + ($sym_1188 << 1) >> 1];
        if ($103 << 16 >> 16 != 0) {
          var $108 = (($103 & 65535) << 1) + $offs | 0;
          var $109 = HEAP16[$108 >> 1];
          HEAP16[$108 >> 1] = $109 + 1 & 65535;
          HEAP16[$work + (($109 & 65535) << 1) >> 1] = $sym_1188 & 65535;
        }
        var $114 = $sym_1188 + 1 | 0;
        if (($114 | 0) == ($codes | 0)) {
          break L1244;
        } else {
          var $sym_1188 = $114;
        }
      }
    }
  } while (0);
  do {
    if (($type | 0) == 0) {
      var $_ph178 = 0;
      var $_ph177_in = 1 << $min_0_max_0_;
      var $end_0165168_ph = 19;
      var $extra_0164169_ph = $work;
      var $base_0163170_ph = $work;
      var $_ph = 0;
    } else if (($type | 0) == 1) {
      var $117 = 1 << $min_0_max_0_;
      if ($117 >>> 0 > 851) {
        var $_0 = 1;
      } else {
        var $_ph178 = 1;
        var $_ph177_in = $117;
        var $end_0165168_ph = 256;
        var $extra_0164169_ph = 4300211018 | 0;
        var $base_0163170_ph = 4300211082 | 0;
        var $_ph = 0;
        break;
      }
      var $_0;
      STACKTOP = __stackBase__;
      return $_0;
    } else {
      var $120 = 1 << $min_0_max_0_;
      var $121 = ($type | 0) == 2;
      if ($121 & $120 >>> 0 > 591) {
        var $_0 = 1;
      } else {
        var $_ph178 = 0;
        var $_ph177_in = $120;
        var $end_0165168_ph = -1;
        var $extra_0164169_ph = 5244364 | 0;
        var $base_0163170_ph = 5244428 | 0;
        var $_ph = $121;
        break;
      }
      var $_0;
      STACKTOP = __stackBase__;
      return $_0;
    }
  } while (0);
  var $_ph;
  var $base_0163170_ph;
  var $extra_0164169_ph;
  var $end_0165168_ph;
  var $_ph177_in;
  var $_ph178;
  var $_ph177 = $_ph177_in - 1 | 0;
  var $123 = $min_0_max_0_ & 255;
  var $next_0_ph180 = HEAP32[$table$s2];
  var $low_0_ph = -1;
  var $huff_0_ph = 0;
  var $used_0_ph179 = $_ph177_in;
  var $drop_0_ph = 0;
  var $curr_0_ph = $min_0_max_0_;
  var $sym_2_ph = 0;
  var $len_3_ph = $min_0;
  L1258 : while (1) {
    var $len_3_ph;
    var $sym_2_ph;
    var $curr_0_ph;
    var $drop_0_ph;
    var $used_0_ph179;
    var $huff_0_ph;
    var $low_0_ph;
    var $next_0_ph180;
    var $124 = 1 << $curr_0_ph;
    var $huff_0 = $huff_0_ph;
    var $sym_2 = $sym_2_ph;
    var $len_3 = $len_3_ph;
    while (1) {
      var $len_3;
      var $sym_2;
      var $huff_0;
      var $125 = $len_3 - $drop_0_ph | 0;
      var $126 = $125 & 255;
      var $128 = HEAP16[$work + ($sym_2 << 1) >> 1];
      var $129 = $128 & 65535;
      do {
        if (($129 | 0) < ($end_0165168_ph | 0)) {
          var $here_sroa_0_0 = 0;
          var $here_sroa_2_0 = $128;
        } else {
          if (($129 | 0) <= ($end_0165168_ph | 0)) {
            var $here_sroa_0_0 = 96;
            var $here_sroa_2_0 = 0;
            break;
          }
          var $here_sroa_0_0 = HEAP16[$extra_0164169_ph + ($129 << 1) >> 1] & 255;
          var $here_sroa_2_0 = HEAP16[$base_0163170_ph + ($129 << 1) >> 1];
        }
      } while (0);
      var $here_sroa_2_0;
      var $here_sroa_0_0;
      var $140 = 1 << $125;
      var $141 = $huff_0 >>> ($drop_0_ph >>> 0);
      var $fill_0 = $124;
      while (1) {
        var $fill_0;
        var $143 = $fill_0 - $140 | 0;
        var $144 = $143 + $141 | 0;
        HEAP8[($144 << 2) + $next_0_ph180 | 0] = $here_sroa_0_0;
        HEAP8[($144 << 2) + $next_0_ph180 + 1 | 0] = $126;
        HEAP16[$next_0_ph180 + ($144 << 2) + 2 >> 1] = $here_sroa_2_0;
        if (($fill_0 | 0) == ($140 | 0)) {
          break;
        } else {
          var $fill_0 = $143;
        }
      }
      var $incr_0 = 1 << $len_3 - 1;
      while (1) {
        var $incr_0;
        if (($incr_0 & $huff_0 | 0) == 0) {
          break;
        } else {
          var $incr_0 = $incr_0 >>> 1;
        }
      }
      if (($incr_0 | 0) == 0) {
        var $huff_1 = 0;
      } else {
        var $huff_1 = ($incr_0 - 1 & $huff_0) + $incr_0 | 0;
      }
      var $huff_1;
      var $160 = $sym_2 + 1 | 0;
      var $161 = ($len_3 << 1) + $count | 0;
      var $163 = HEAP16[$161 >> 1] - 1 & 65535;
      HEAP16[$161 >> 1] = $163;
      if ($163 << 16 >> 16 == 0) {
        if (($len_3 | 0) == ($max_0 | 0)) {
          break L1258;
        }
        var $len_4 = HEAPU16[$lens + (HEAPU16[$work + ($160 << 1) >> 1] << 1) >> 1];
      } else {
        var $len_4 = $len_3;
      }
      var $len_4;
      if ($len_4 >>> 0 <= $min_0_max_0_ >>> 0) {
        var $huff_0 = $huff_1;
        var $sym_2 = $160;
        var $len_3 = $len_4;
        continue;
      }
      var $177 = $huff_1 & $_ph177;
      if (($177 | 0) == ($low_0_ph | 0)) {
        var $huff_0 = $huff_1;
        var $sym_2 = $160;
        var $len_3 = $len_4;
      } else {
        break;
      }
    }
    var $min_0_max_0__drop_0 = ($drop_0_ph | 0) == 0 ? $min_0_max_0_ : $drop_0_ph;
    var $181 = ($124 << 2) + $next_0_ph180 | 0;
    var $182 = $len_4 - $min_0_max_0__drop_0 | 0;
    var $183 = $len_4 >>> 0 < $max_0 >>> 0;
    L1281 : do {
      if ($183) {
        var $curr_1174 = $182;
        var $left_1175 = 1 << $182;
        var $186 = $len_4;
        while (1) {
          var $186;
          var $left_1175;
          var $curr_1174;
          var $190 = $left_1175 - HEAPU16[($186 << 1 >> 1) + $count$s1] | 0;
          if (($190 | 0) < 1) {
            var $curr_1_lcssa = $curr_1174;
            break L1281;
          }
          var $193 = $curr_1174 + 1 | 0;
          var $195 = $193 + $min_0_max_0__drop_0 | 0;
          if ($195 >>> 0 < $max_0 >>> 0) {
            var $curr_1174 = $193;
            var $left_1175 = $190 << 1;
            var $186 = $195;
          } else {
            var $curr_1_lcssa = $193;
            break L1281;
          }
        }
      } else {
        var $curr_1_lcssa = $182;
      }
    } while (0);
    var $curr_1_lcssa;
    var $198 = (1 << $curr_1_lcssa) + $used_0_ph179 | 0;
    if ($_ph178 & $198 >>> 0 > 851 | $_ph & $198 >>> 0 > 591) {
      var $_0 = 1;
      label = 961;
      break;
    }
    HEAP8[($177 << 2) + HEAP32[$table$s2] | 0] = $curr_1_lcssa & 255;
    HEAP8[($177 << 2) + HEAP32[$table$s2] + 1 | 0] = $123;
    var $207 = HEAP32[$table$s2];
    HEAP16[$207 + ($177 << 2) + 2 >> 1] = ($181 - $207 | 0) >>> 2 & 65535;
    var $next_0_ph180 = $181;
    var $low_0_ph = $177;
    var $huff_0_ph = $huff_1;
    var $used_0_ph179 = $198;
    var $drop_0_ph = $min_0_max_0__drop_0;
    var $curr_0_ph = $curr_1_lcssa;
    var $sym_2_ph = $160;
    var $len_3_ph = $len_4;
  }
  if (label == 961) {
    var $_0;
    STACKTOP = __stackBase__;
    return $_0;
  }
  if (($huff_1 | 0) != 0) {
    HEAP8[($huff_1 << 2) + $next_0_ph180 | 0] = 64;
    HEAP8[($huff_1 << 2) + $next_0_ph180 + 1 | 0] = $126;
    HEAP16[$next_0_ph180 + ($huff_1 << 2) + 2 >> 1] = 0;
  }
  HEAP32[$table$s2] = ($used_0_ph179 << 2) + HEAP32[$table$s2] | 0;
  HEAP32[$bits >> 2] = $min_0_max_0_;
  var $_0 = 0;
  var $_0;
  STACKTOP = __stackBase__;
  return $_0;
}
_inflate_table["X"] = 1;
function __tr_init($s) {
  HEAP32[$s + 2840 >> 2] = $s + 148 | 0;
  HEAP32[$s + 2848 >> 2] = 5244032;
  HEAP32[$s + 2852 >> 2] = $s + 2440 | 0;
  HEAP32[$s + 2860 >> 2] = 5244172;
  HEAP32[$s + 2864 >> 2] = $s + 2684 | 0;
  HEAP32[$s + 2872 >> 2] = 5244192;
  HEAP16[$s + 5816 >> 1] = 0;
  HEAP32[$s + 5820 >> 2] = 0;
  _init_block($s);
  return;
}
function __tr_stored_block($s, $buf, $stored_len, $last) {
  var $13$s2;
  var $6$s1;
  var $1$s2;
  var $1$s2 = ($s + 5820 | 0) >> 2;
  var $2 = HEAP32[$1$s2];
  var $4 = $last & 65535;
  var $6$s1 = ($s + 5816 | 0) >> 1;
  var $9 = HEAPU16[$6$s1] | $4 << $2;
  HEAP16[$6$s1] = $9 & 65535;
  if (($2 | 0) > 13) {
    var $13$s2 = ($s + 20 | 0) >> 2;
    var $14 = HEAP32[$13$s2];
    HEAP32[$13$s2] = $14 + 1 | 0;
    var $16 = $s + 8 | 0;
    HEAP8[HEAP32[$16 >> 2] + $14 | 0] = $9 & 255;
    var $21 = HEAPU16[$6$s1] >>> 8 & 255;
    var $22 = HEAP32[$13$s2];
    HEAP32[$13$s2] = $22 + 1 | 0;
    HEAP8[HEAP32[$16 >> 2] + $22 | 0] = $21;
    var $26 = HEAP32[$1$s2];
    HEAP16[$6$s1] = $4 >>> ((16 - $26 | 0) >>> 0) & 65535;
    var $storemerge = $26 - 13 | 0;
    var $storemerge;
    HEAP32[$1$s2] = $storemerge;
    _copy_block($s, $buf, $stored_len);
    return;
  } else {
    var $storemerge = $2 + 3 | 0;
    var $storemerge;
    HEAP32[$1$s2] = $storemerge;
    _copy_block($s, $buf, $stored_len);
    return;
  }
}
function _copy_block($s, $buf, $len) {
  var $5$s2;
  var $2$s2;
  _bi_windup($s);
  var $2$s2 = ($s + 20 | 0) >> 2;
  var $3 = HEAP32[$2$s2];
  HEAP32[$2$s2] = $3 + 1 | 0;
  var $5$s2 = ($s + 8 | 0) >> 2;
  HEAP8[HEAP32[$5$s2] + $3 | 0] = $len & 255;
  var $10 = HEAP32[$2$s2];
  HEAP32[$2$s2] = $10 + 1 | 0;
  HEAP8[HEAP32[$5$s2] + $10 | 0] = $len >>> 8 & 255;
  var $15 = $len & 65535 ^ 65535;
  var $17 = HEAP32[$2$s2];
  HEAP32[$2$s2] = $17 + 1 | 0;
  HEAP8[HEAP32[$5$s2] + $17 | 0] = $15 & 255;
  var $23 = HEAP32[$2$s2];
  HEAP32[$2$s2] = $23 + 1 | 0;
  HEAP8[HEAP32[$5$s2] + $23 | 0] = $15 >>> 8 & 255;
  if (($len | 0) == 0) {
    return;
  } else {
    var $_0181 = $len;
    var $_02 = $buf;
  }
  while (1) {
    var $_02;
    var $_0181;
    var $28 = $_0181 - 1 | 0;
    var $30 = HEAP8[$_02];
    var $31 = HEAP32[$2$s2];
    HEAP32[$2$s2] = $31 + 1 | 0;
    HEAP8[HEAP32[$5$s2] + $31 | 0] = $30;
    if (($28 | 0) == 0) {
      break;
    } else {
      var $_0181 = $28;
      var $_02 = $_02 + 1 | 0;
    }
  }
  return;
}
_copy_block["X"] = 1;
function __tr_flush_bits($s) {
  _bi_flush($s);
  return;
}
function _detect_data_type($s) {
  var $s$s1 = $s >> 1;
  var label = 0;
  var $black_mask_013 = -201342849;
  var $n_014 = 0;
  while (1) {
    var $n_014;
    var $black_mask_013;
    if (($black_mask_013 & 1 | 0) != 0) {
      if (HEAP16[(($n_014 << 2) + 148 >> 1) + $s$s1] << 16 >> 16 != 0) {
        var $_0 = 0;
        label = 992;
        break;
      }
    }
    var $9 = $n_014 + 1 | 0;
    if (($9 | 0) < 32) {
      var $black_mask_013 = $black_mask_013 >>> 1;
      var $n_014 = $9;
    } else {
      break;
    }
  }
  if (label == 992) {
    var $_0;
    return $_0;
  }
  if (HEAP16[$s$s1 + 92] << 16 >> 16 != 0) {
    var $_0 = 1;
    var $_0;
    return $_0;
  }
  if (HEAP16[$s$s1 + 94] << 16 >> 16 != 0) {
    var $_0 = 1;
    var $_0;
    return $_0;
  }
  if (HEAP16[$s$s1 + 100] << 16 >> 16 == 0) {
    var $n_1 = 32;
  } else {
    var $_0 = 1;
    var $_0;
    return $_0;
  }
  while (1) {
    var $n_1;
    if (($n_1 | 0) >= 256) {
      var $_0 = 0;
      label = 993;
      break;
    }
    if (HEAP16[(($n_1 << 2) + 148 >> 1) + $s$s1] << 16 >> 16 == 0) {
      var $n_1 = $n_1 + 1 | 0;
    } else {
      var $_0 = 1;
      label = 988;
      break;
    }
  }
  if (label == 988) {
    var $_0;
    return $_0;
  } else if (label == 993) {
    var $_0;
    return $_0;
  }
}
function _compress_block($s, $ltree, $dtree) {
  var $240$s2;
  var $234$s1;
  var $227$s2;
  var $9$s2;
  var $8$s2;
  var $7$s1;
  var $6$s2;
  var $ltree$s1 = $ltree >> 1;
  var $1 = $s + 5792 | 0;
  var $3 = (HEAP32[$1 >> 2] | 0) == 0;
  L1333 : do {
    if ($3) {
      var $223 = HEAP32[$s + 5820 >> 2];
      var $222 = HEAP16[$s + 5816 >> 1];
    } else {
      var $4 = $s + 5796 | 0;
      var $5 = $s + 5784 | 0;
      var $6$s2 = ($s + 5820 | 0) >> 2;
      var $7$s1 = ($s + 5816 | 0) >> 1;
      var $8$s2 = ($s + 20 | 0) >> 2;
      var $9$s2 = ($s + 8 | 0) >> 2;
      var $lx_0 = 0;
      while (1) {
        var $lx_0;
        var $12 = HEAP16[HEAP32[$4 >> 2] + ($lx_0 << 1) >> 1];
        var $13 = $12 & 65535;
        var $14 = $lx_0 + 1 | 0;
        var $18 = HEAPU8[HEAP32[$5 >> 2] + $lx_0 | 0];
        do {
          if ($12 << 16 >> 16 == 0) {
            var $23 = HEAPU16[(($18 << 2) + 2 >> 1) + $ltree$s1];
            var $24 = HEAP32[$6$s2];
            var $29 = HEAPU16[($18 << 2 >> 1) + $ltree$s1];
            var $33 = HEAPU16[$7$s1] | $29 << $24;
            var $34 = $33 & 65535;
            HEAP16[$7$s1] = $34;
            if (($24 | 0) > (16 - $23 | 0)) {
              var $37 = HEAP32[$8$s2];
              HEAP32[$8$s2] = $37 + 1 | 0;
              HEAP8[HEAP32[$9$s2] + $37 | 0] = $33 & 255;
              var $43 = HEAPU16[$7$s1] >>> 8 & 255;
              var $44 = HEAP32[$8$s2];
              HEAP32[$8$s2] = $44 + 1 | 0;
              HEAP8[HEAP32[$9$s2] + $44 | 0] = $43;
              var $48 = HEAP32[$6$s2];
              var $51 = $29 >>> ((16 - $48 | 0) >>> 0) & 65535;
              HEAP16[$7$s1] = $51;
              var $53 = $23 - 16 + $48 | 0;
              HEAP32[$6$s2] = $53;
              var $219 = $53;
              var $218 = $51;
              break;
            } else {
              var $55 = $24 + $23 | 0;
              HEAP32[$6$s2] = $55;
              var $219 = $55;
              var $218 = $34;
              break;
            }
          } else {
            var $59 = HEAPU8[$18 + 5256408 | 0];
            var $61 = ($59 | 256) + 1 | 0;
            var $64 = HEAPU16[(($61 << 2) + 2 >> 1) + $ltree$s1];
            var $65 = HEAP32[$6$s2];
            var $70 = HEAPU16[($61 << 2 >> 1) + $ltree$s1];
            var $74 = HEAPU16[$7$s1] | $70 << $65;
            var $75 = $74 & 65535;
            HEAP16[$7$s1] = $75;
            if (($65 | 0) > (16 - $64 | 0)) {
              var $78 = HEAP32[$8$s2];
              HEAP32[$8$s2] = $78 + 1 | 0;
              HEAP8[HEAP32[$9$s2] + $78 | 0] = $74 & 255;
              var $84 = HEAPU16[$7$s1] >>> 8 & 255;
              var $85 = HEAP32[$8$s2];
              HEAP32[$8$s2] = $85 + 1 | 0;
              HEAP8[HEAP32[$9$s2] + $85 | 0] = $84;
              var $89 = HEAP32[$6$s2];
              var $92 = $70 >>> ((16 - $89 | 0) >>> 0) & 65535;
              HEAP16[$7$s1] = $92;
              var $99 = $64 - 16 + $89 | 0;
              var $98 = $92;
            } else {
              var $99 = $65 + $64 | 0;
              var $98 = $75;
            }
            var $98;
            var $99;
            HEAP32[$6$s2] = $99;
            var $101 = HEAP32[($59 << 2) + 5246708 >> 2];
            do {
              if (($59 - 8 | 0) >>> 0 < 20) {
                var $110 = $18 - HEAP32[($59 << 2) + 5255352 >> 2] & 65535;
                var $113 = $110 << $99 | $98 & 65535;
                var $114 = $113 & 65535;
                HEAP16[$7$s1] = $114;
                if (($99 | 0) > (16 - $101 | 0)) {
                  var $117 = HEAP32[$8$s2];
                  HEAP32[$8$s2] = $117 + 1 | 0;
                  HEAP8[HEAP32[$9$s2] + $117 | 0] = $113 & 255;
                  var $123 = HEAPU16[$7$s1] >>> 8 & 255;
                  var $124 = HEAP32[$8$s2];
                  HEAP32[$8$s2] = $124 + 1 | 0;
                  HEAP8[HEAP32[$9$s2] + $124 | 0] = $123;
                  var $128 = HEAP32[$6$s2];
                  var $131 = $110 >>> ((16 - $128 | 0) >>> 0) & 65535;
                  HEAP16[$7$s1] = $131;
                  var $133 = $101 - 16 + $128 | 0;
                  HEAP32[$6$s2] = $133;
                  var $138 = $133;
                  var $137 = $131;
                  break;
                } else {
                  var $135 = $99 + $101 | 0;
                  HEAP32[$6$s2] = $135;
                  var $138 = $135;
                  var $137 = $114;
                  break;
                }
              } else {
                var $138 = $99;
                var $137 = $98;
              }
            } while (0);
            var $137;
            var $138;
            var $139 = $13 - 1 | 0;
            if ($139 >>> 0 < 256) {
              var $_pn = $139;
            } else {
              var $_pn = ($139 >>> 7) + 256 | 0;
            }
            var $_pn;
            var $145 = HEAPU8[$_pn + 5257132 | 0];
            var $148 = HEAPU16[$dtree + ($145 << 2) + 2 >> 1];
            var $153 = HEAPU16[$dtree + ($145 << 2) >> 1];
            var $156 = $137 & 65535 | $153 << $138;
            var $157 = $156 & 65535;
            HEAP16[$7$s1] = $157;
            if (($138 | 0) > (16 - $148 | 0)) {
              var $160 = HEAP32[$8$s2];
              HEAP32[$8$s2] = $160 + 1 | 0;
              HEAP8[HEAP32[$9$s2] + $160 | 0] = $156 & 255;
              var $166 = HEAPU16[$7$s1] >>> 8 & 255;
              var $167 = HEAP32[$8$s2];
              HEAP32[$8$s2] = $167 + 1 | 0;
              HEAP8[HEAP32[$9$s2] + $167 | 0] = $166;
              var $171 = HEAP32[$6$s2];
              var $174 = $153 >>> ((16 - $171 | 0) >>> 0) & 65535;
              HEAP16[$7$s1] = $174;
              var $181 = $148 - 16 + $171 | 0;
              var $180 = $174;
            } else {
              var $181 = $138 + $148 | 0;
              var $180 = $157;
            }
            var $180;
            var $181;
            HEAP32[$6$s2] = $181;
            var $183 = HEAP32[($145 << 2) + 5246824 >> 2];
            if (($145 - 4 | 0) >>> 0 >= 26) {
              var $219 = $181;
              var $218 = $180;
              break;
            }
            var $192 = $139 - HEAP32[($145 << 2) + 5255468 >> 2] & 65535;
            var $195 = $192 << $181 | $180 & 65535;
            var $196 = $195 & 65535;
            HEAP16[$7$s1] = $196;
            if (($181 | 0) > (16 - $183 | 0)) {
              var $199 = HEAP32[$8$s2];
              HEAP32[$8$s2] = $199 + 1 | 0;
              HEAP8[HEAP32[$9$s2] + $199 | 0] = $195 & 255;
              var $205 = HEAPU16[$7$s1] >>> 8 & 255;
              var $206 = HEAP32[$8$s2];
              HEAP32[$8$s2] = $206 + 1 | 0;
              HEAP8[HEAP32[$9$s2] + $206 | 0] = $205;
              var $210 = HEAP32[$6$s2];
              var $213 = $192 >>> ((16 - $210 | 0) >>> 0) & 65535;
              HEAP16[$7$s1] = $213;
              var $215 = $183 - 16 + $210 | 0;
              HEAP32[$6$s2] = $215;
              var $219 = $215;
              var $218 = $213;
              break;
            } else {
              var $217 = $181 + $183 | 0;
              HEAP32[$6$s2] = $217;
              var $219 = $217;
              var $218 = $196;
              break;
            }
          }
        } while (0);
        var $218;
        var $219;
        if ($14 >>> 0 < HEAP32[$1 >> 2] >>> 0) {
          var $lx_0 = $14;
        } else {
          var $223 = $219;
          var $222 = $218;
          break L1333;
        }
      }
    }
  } while (0);
  var $222;
  var $223;
  var $226 = HEAPU16[$ltree$s1 + 513];
  var $227$s2 = ($s + 5820 | 0) >> 2;
  var $232 = HEAPU16[$ltree$s1 + 512];
  var $234$s1 = ($s + 5816 | 0) >> 1;
  var $236 = $222 & 65535 | $232 << $223;
  HEAP16[$234$s1] = $236 & 65535;
  if (($223 | 0) > (16 - $226 | 0)) {
    var $240$s2 = ($s + 20 | 0) >> 2;
    var $241 = HEAP32[$240$s2];
    HEAP32[$240$s2] = $241 + 1 | 0;
    var $243 = $s + 8 | 0;
    HEAP8[HEAP32[$243 >> 2] + $241 | 0] = $236 & 255;
    var $248 = HEAPU16[$234$s1] >>> 8 & 255;
    var $249 = HEAP32[$240$s2];
    HEAP32[$240$s2] = $249 + 1 | 0;
    HEAP8[HEAP32[$243 >> 2] + $249 | 0] = $248;
    var $253 = HEAP32[$227$s2];
    HEAP16[$234$s1] = $232 >>> ((16 - $253 | 0) >>> 0) & 65535;
    var $storemerge = $226 - 16 + $253 | 0;
    var $storemerge;
    HEAP32[$227$s2] = $storemerge;
    return;
  } else {
    var $storemerge = $223 + $226 | 0;
    var $storemerge;
    HEAP32[$227$s2] = $storemerge;
    return;
  }
}
_compress_block["X"] = 1;
function __tr_align($s) {
  var $37$s2;
  var $12$s2;
  var $5$s1;
  var $1$s2;
  var $1$s2 = ($s + 5820 | 0) >> 2;
  var $2 = HEAP32[$1$s2];
  var $5$s1 = ($s + 5816 | 0) >> 1;
  var $8 = HEAPU16[$5$s1] | 2 << $2;
  var $9 = $8 & 65535;
  HEAP16[$5$s1] = $9;
  if (($2 | 0) > 13) {
    var $12$s2 = ($s + 20 | 0) >> 2;
    var $13 = HEAP32[$12$s2];
    HEAP32[$12$s2] = $13 + 1 | 0;
    var $15 = $s + 8 | 0;
    HEAP8[HEAP32[$15 >> 2] + $13 | 0] = $8 & 255;
    var $20 = HEAPU16[$5$s1] >>> 8 & 255;
    var $21 = HEAP32[$12$s2];
    HEAP32[$12$s2] = $21 + 1 | 0;
    HEAP8[HEAP32[$15 >> 2] + $21 | 0] = $20;
    var $25 = HEAP32[$1$s2];
    var $28 = 2 >>> ((16 - $25 | 0) >>> 0) & 65535;
    HEAP16[$5$s1] = $28;
    var $storemerge = $25 - 13 | 0;
    var $33 = $28;
  } else {
    var $storemerge = $2 + 3 | 0;
    var $33 = $9;
  }
  var $33;
  var $storemerge;
  HEAP32[$1$s2] = $storemerge;
  if (($storemerge | 0) > 9) {
    var $37$s2 = ($s + 20 | 0) >> 2;
    var $38 = HEAP32[$37$s2];
    HEAP32[$37$s2] = $38 + 1 | 0;
    var $40 = $s + 8 | 0;
    HEAP8[HEAP32[$40 >> 2] + $38 | 0] = $33 & 255;
    var $45 = HEAPU16[$5$s1] >>> 8 & 255;
    var $46 = HEAP32[$37$s2];
    HEAP32[$37$s2] = $46 + 1 | 0;
    HEAP8[HEAP32[$40 >> 2] + $46 | 0] = $45;
    HEAP16[$5$s1] = 0;
    var $storemerge37 = HEAP32[$1$s2] - 9 | 0;
    var $storemerge37;
    HEAP32[$1$s2] = $storemerge37;
    _bi_flush($s);
    return;
  } else {
    var $storemerge37 = $storemerge + 7 | 0;
    var $storemerge37;
    HEAP32[$1$s2] = $storemerge37;
    _bi_flush($s);
    return;
  }
}
__tr_align["X"] = 1;
function __tr_flush_block($s, $buf, $stored_len, $last) {
  var $83$s2;
  var $76$s1;
  var $51$s2;
  var $44$s1;
  var $37$s2;
  var $s$s2 = $s >> 2;
  if ((HEAP32[$s$s2 + 33] | 0) > 0) {
    var $7 = HEAP32[$s$s2] + 44 | 0;
    if ((HEAP32[$7 >> 2] | 0) == 2) {
      HEAP32[$7 >> 2] = _detect_data_type($s);
    }
    _build_tree($s, $s + 2840 | 0);
    _build_tree($s, $s + 2852 | 0);
    var $15 = _build_bl_tree($s);
    var $19 = (HEAP32[$s$s2 + 1450] + 10 | 0) >>> 3;
    var $23 = (HEAP32[$s$s2 + 1451] + 10 | 0) >>> 3;
    var $opt_lenb_0 = $23 >>> 0 > $19 >>> 0 ? $19 : $23;
    var $static_lenb_0 = $23;
    var $max_blindex_0 = $15 + 1 | 0;
  } else {
    var $26 = $stored_len + 5 | 0;
    var $opt_lenb_0 = $26;
    var $static_lenb_0 = $26;
    var $max_blindex_0 = 1;
  }
  var $max_blindex_0;
  var $static_lenb_0;
  var $opt_lenb_0;
  do {
    if (($stored_len + 4 | 0) >>> 0 > $opt_lenb_0 >>> 0 | ($buf | 0) == 0) {
      var $37$s2 = ($s + 5820 | 0) >> 2;
      var $38 = HEAP32[$37$s2];
      var $39 = ($38 | 0) > 13;
      if ((HEAP32[$s$s2 + 34] | 0) == 4 | ($static_lenb_0 | 0) == ($opt_lenb_0 | 0)) {
        var $42 = $last + 2 & 65535;
        var $44$s1 = ($s + 5816 | 0) >> 1;
        var $47 = HEAPU16[$44$s1] | $42 << $38;
        HEAP16[$44$s1] = $47 & 65535;
        if ($39) {
          var $51$s2 = ($s + 20 | 0) >> 2;
          var $52 = HEAP32[$51$s2];
          HEAP32[$51$s2] = $52 + 1 | 0;
          var $54 = $s + 8 | 0;
          HEAP8[HEAP32[$54 >> 2] + $52 | 0] = $47 & 255;
          var $59 = HEAPU16[$44$s1] >>> 8 & 255;
          var $60 = HEAP32[$51$s2];
          HEAP32[$51$s2] = $60 + 1 | 0;
          HEAP8[HEAP32[$54 >> 2] + $60 | 0] = $59;
          var $64 = HEAP32[$37$s2];
          HEAP16[$44$s1] = $42 >>> ((16 - $64 | 0) >>> 0) & 65535;
          var $storemerge71 = $64 - 13 | 0;
        } else {
          var $storemerge71 = $38 + 3 | 0;
        }
        var $storemerge71;
        HEAP32[$37$s2] = $storemerge71;
        _compress_block($s, 5242880 | 0, 5244052 | 0);
        break;
      } else {
        var $74 = $last + 4 & 65535;
        var $76$s1 = ($s + 5816 | 0) >> 1;
        var $79 = HEAPU16[$76$s1] | $74 << $38;
        HEAP16[$76$s1] = $79 & 65535;
        if ($39) {
          var $83$s2 = ($s + 20 | 0) >> 2;
          var $84 = HEAP32[$83$s2];
          HEAP32[$83$s2] = $84 + 1 | 0;
          var $86 = $s + 8 | 0;
          HEAP8[HEAP32[$86 >> 2] + $84 | 0] = $79 & 255;
          var $91 = HEAPU16[$76$s1] >>> 8 & 255;
          var $92 = HEAP32[$83$s2];
          HEAP32[$83$s2] = $92 + 1 | 0;
          HEAP8[HEAP32[$86 >> 2] + $92 | 0] = $91;
          var $96 = HEAP32[$37$s2];
          HEAP16[$76$s1] = $74 >>> ((16 - $96 | 0) >>> 0) & 65535;
          var $storemerge = $96 - 13 | 0;
        } else {
          var $storemerge = $38 + 3 | 0;
        }
        var $storemerge;
        HEAP32[$37$s2] = $storemerge;
        _send_all_trees($s, HEAP32[$s$s2 + 711] + 1 | 0, HEAP32[$s$s2 + 714] + 1 | 0, $max_blindex_0);
        _compress_block($s, $s + 148 | 0, $s + 2440 | 0);
        break;
      }
    } else {
      __tr_stored_block($s, $buf, $stored_len, $last);
    }
  } while (0);
  _init_block($s);
  if (($last | 0) == 0) {
    return;
  }
  _bi_windup($s);
  return;
}
__tr_flush_block["X"] = 1;
function _build_tree($s, $desc) {
  var $60$s2;
  var $14$s2;
  var $10$s2;
  var $9$s2;
  var $2$s1;
  var $s$s2 = $s >> 2;
  var label = 0;
  var $1 = $desc | 0;
  var $2 = HEAP32[$1 >> 2], $2$s1 = $2 >> 1;
  var $3 = $desc + 8 | 0;
  var $4 = HEAP32[$3 >> 2];
  var $6 = HEAP32[$4 >> 2];
  var $8 = HEAP32[$4 + 12 >> 2];
  var $9$s2 = ($s + 5200 | 0) >> 2;
  HEAP32[$9$s2] = 0;
  var $10$s2 = ($s + 5204 | 0) >> 2;
  HEAP32[$10$s2] = 573;
  do {
    if (($8 | 0) > 0) {
      var $n_085 = 0;
      var $max_code_086 = -1;
      while (1) {
        var $max_code_086;
        var $n_085;
        if (HEAP16[($n_085 << 2 >> 1) + $2$s1] << 16 >> 16 == 0) {
          HEAP16[(($n_085 << 2) + 2 >> 1) + $2$s1] = 0;
          var $max_code_1 = $max_code_086;
        } else {
          var $33 = HEAP32[$9$s2] + 1 | 0;
          HEAP32[$9$s2] = $33;
          HEAP32[(($33 << 2) + 2908 >> 2) + $s$s2] = $n_085;
          HEAP8[$s + ($n_085 + 5208) | 0] = 0;
          var $max_code_1 = $n_085;
        }
        var $max_code_1;
        var $39 = $n_085 + 1 | 0;
        if (($39 | 0) == ($8 | 0)) {
          break;
        } else {
          var $n_085 = $39;
          var $max_code_086 = $max_code_1;
        }
      }
      var $_pre = HEAP32[$9$s2];
      if (($_pre | 0) < 2) {
        var $13 = $_pre;
        var $max_code_0_lcssa92 = $max_code_1;
        label = 1056;
        break;
      } else {
        var $max_code_2_lcssa = $max_code_1;
        break;
      }
    } else {
      var $13 = 0;
      var $max_code_0_lcssa92 = -1;
      label = 1056;
    }
  } while (0);
  L1418 : do {
    if (label == 1056) {
      var $max_code_0_lcssa92;
      var $13;
      var $14$s2 = ($s + 5800 | 0) >> 2;
      var $16 = $s + 5804 | 0;
      if (($6 | 0) == 0) {
        var $max_code_283_us = $max_code_0_lcssa92;
        var $17 = $13;
        while (1) {
          var $17;
          var $max_code_283_us;
          var $18 = ($max_code_283_us | 0) < 2;
          var $19 = $max_code_283_us + 1 | 0;
          var $_max_code_2_us = $18 ? $19 : $max_code_283_us;
          var $__us = $18 ? $19 : 0;
          var $20 = $17 + 1 | 0;
          HEAP32[$9$s2] = $20;
          HEAP32[(($20 << 2) + 2908 >> 2) + $s$s2] = $__us;
          HEAP16[($__us << 2 >> 1) + $2$s1] = 1;
          HEAP8[$s + ($__us + 5208) | 0] = 0;
          HEAP32[$14$s2] = HEAP32[$14$s2] - 1 | 0;
          var $26 = HEAP32[$9$s2];
          if (($26 | 0) < 2) {
            var $max_code_283_us = $_max_code_2_us;
            var $17 = $26;
          } else {
            var $max_code_2_lcssa = $_max_code_2_us;
            break L1418;
          }
        }
      } else {
        var $max_code_283 = $max_code_0_lcssa92;
        var $40 = $13;
        while (1) {
          var $40;
          var $max_code_283;
          var $41 = ($max_code_283 | 0) < 2;
          var $42 = $max_code_283 + 1 | 0;
          var $_max_code_2 = $41 ? $42 : $max_code_283;
          var $_ = $41 ? $42 : 0;
          var $43 = $40 + 1 | 0;
          HEAP32[$9$s2] = $43;
          HEAP32[(($43 << 2) + 2908 >> 2) + $s$s2] = $_;
          HEAP16[($_ << 2 >> 1) + $2$s1] = 1;
          HEAP8[$s + ($_ + 5208) | 0] = 0;
          HEAP32[$14$s2] = HEAP32[$14$s2] - 1 | 0;
          HEAP32[$16 >> 2] = HEAP32[$16 >> 2] - HEAPU16[$6 + ($_ << 2) + 2 >> 1] | 0;
          var $54 = HEAP32[$9$s2];
          if (($54 | 0) < 2) {
            var $max_code_283 = $_max_code_2;
            var $40 = $54;
          } else {
            var $max_code_2_lcssa = $_max_code_2;
            break L1418;
          }
        }
      }
    }
  } while (0);
  var $max_code_2_lcssa;
  var $56 = $desc + 4 | 0;
  HEAP32[$56 >> 2] = $max_code_2_lcssa;
  var $57 = HEAP32[$9$s2];
  if (($57 | 0) > 1) {
    var $n_181 = ($57 | 0) / 2 & -1;
    while (1) {
      var $n_181;
      _pqdownheap($s, $2, $n_181);
      var $62 = $n_181 - 1 | 0;
      if (($62 | 0) > 0) {
        var $n_181 = $62;
      } else {
        break;
      }
    }
    var $_pre90 = HEAP32[$9$s2];
  } else {
    var $_pre90 = $57;
  }
  var $_pre90;
  var $60$s2 = ($s + 2912 | 0) >> 2;
  var $node_0 = $8;
  var $65 = $_pre90;
  while (1) {
    var $65;
    var $node_0;
    var $66 = HEAP32[$60$s2];
    HEAP32[$9$s2] = $65 - 1 | 0;
    HEAP32[$60$s2] = HEAP32[(($65 << 2) + 2908 >> 2) + $s$s2];
    _pqdownheap($s, $2, 1);
    var $70 = HEAP32[$60$s2];
    var $72 = HEAP32[$10$s2] - 1 | 0;
    HEAP32[$10$s2] = $72;
    HEAP32[(($72 << 2) + 2908 >> 2) + $s$s2] = $66;
    var $75 = HEAP32[$10$s2] - 1 | 0;
    HEAP32[$10$s2] = $75;
    HEAP32[(($75 << 2) + 2908 >> 2) + $s$s2] = $70;
    HEAP16[($node_0 << 2 >> 1) + $2$s1] = HEAP16[($70 << 2 >> 1) + $2$s1] + HEAP16[($66 << 2 >> 1) + $2$s1] & 65535;
    var $84 = HEAP8[$s + ($66 + 5208) | 0];
    var $86 = HEAP8[$s + ($70 + 5208) | 0];
    HEAP8[$s + ($node_0 + 5208) | 0] = (($84 & 255) < ($86 & 255) ? $86 : $84) + 1 & 255;
    var $90 = $node_0 & 65535;
    HEAP16[(($70 << 2) + 2 >> 1) + $2$s1] = $90;
    HEAP16[(($66 << 2) + 2 >> 1) + $2$s1] = $90;
    HEAP32[$60$s2] = $node_0;
    _pqdownheap($s, $2, 1);
    var $94 = HEAP32[$9$s2];
    if (($94 | 0) > 1) {
      var $node_0 = $node_0 + 1 | 0;
      var $65 = $94;
    } else {
      break;
    }
  }
  var $97 = HEAP32[$60$s2];
  var $99 = HEAP32[$10$s2] - 1 | 0;
  HEAP32[$10$s2] = $99;
  HEAP32[(($99 << 2) + 2908 >> 2) + $s$s2] = $97;
  _gen_bitlen($s, HEAP32[$1 >> 2], HEAP32[$56 >> 2], HEAP32[$3 >> 2]);
  _gen_codes($2, $max_code_2_lcssa, $s + 2876 | 0);
  return;
}
_build_tree["X"] = 1;
function _build_bl_tree($s) {
  _scan_tree($s, $s + 148 | 0, HEAP32[$s + 2844 >> 2]);
  _scan_tree($s, $s + 2440 | 0, HEAP32[$s + 2856 >> 2]);
  _build_tree($s, $s + 2864 | 0);
  var $max_blindex_0 = 18;
  while (1) {
    var $max_blindex_0;
    if (($max_blindex_0 | 0) <= 2) {
      break;
    }
    if (HEAP16[$s + (HEAPU8[$max_blindex_0 + 5255332 | 0] << 2) + 2686 >> 1] << 16 >> 16 == 0) {
      var $max_blindex_0 = $max_blindex_0 - 1 | 0;
    } else {
      break;
    }
  }
  var $21 = $s + 5800 | 0;
  HEAP32[$21 >> 2] = $max_blindex_0 * 3 + HEAP32[$21 >> 2] + 17 | 0;
  return $max_blindex_0;
}
function _bi_windup($s) {
  var $_pre_phi$s1;
  var $8$s2;
  var $1$s2;
  var $1$s2 = ($s + 5820 | 0) >> 2;
  var $2 = HEAP32[$1$s2];
  if (($2 | 0) > 8) {
    var $5 = $s + 5816 | 0;
    var $7 = HEAP16[$5 >> 1] & 255;
    var $8$s2 = ($s + 20 | 0) >> 2;
    var $9 = HEAP32[$8$s2];
    HEAP32[$8$s2] = $9 + 1 | 0;
    var $11 = $s + 8 | 0;
    HEAP8[HEAP32[$11 >> 2] + $9 | 0] = $7;
    var $16 = HEAPU16[$5 >> 1] >>> 8 & 255;
    var $17 = HEAP32[$8$s2];
    HEAP32[$8$s2] = $17 + 1 | 0;
    HEAP8[HEAP32[$11 >> 2] + $17 | 0] = $16;
    var $_pre_phi = $5, $_pre_phi$s1 = $_pre_phi >> 1;
    var $_pre_phi;
    HEAP16[$_pre_phi$s1] = 0;
    HEAP32[$1$s2] = 0;
    return;
  }
  var $23 = $s + 5816 | 0;
  if (($2 | 0) <= 0) {
    var $_pre_phi = $23, $_pre_phi$s1 = $_pre_phi >> 1;
    var $_pre_phi;
    HEAP16[$_pre_phi$s1] = 0;
    HEAP32[$1$s2] = 0;
    return;
  }
  var $26 = HEAP16[$23 >> 1] & 255;
  var $27 = $s + 20 | 0;
  var $28 = HEAP32[$27 >> 2];
  HEAP32[$27 >> 2] = $28 + 1 | 0;
  HEAP8[HEAP32[$s + 8 >> 2] + $28 | 0] = $26;
  var $_pre_phi = $23, $_pre_phi$s1 = $_pre_phi >> 1;
  var $_pre_phi;
  HEAP16[$_pre_phi$s1] = 0;
  HEAP32[$1$s2] = 0;
  return;
}
function _send_tree($s, $tree, $max_code) {
  var $10$s2;
  var $9$s2;
  var $8$s1;
  var $6$s2;
  var $2 = HEAP16[$tree + 2 >> 1];
  var $4 = $2 << 16 >> 16 == 0;
  var $5 = $s + 2754 | 0;
  var $6$s2 = ($s + 5820 | 0) >> 2;
  var $7 = $s + 2752 | 0;
  var $8$s1 = ($s + 5816 | 0) >> 1;
  var $9$s2 = ($s + 20 | 0) >> 2;
  var $10$s2 = ($s + 8 | 0) >> 2;
  var $11 = $s + 2758 | 0;
  var $12 = $s + 2756 | 0;
  var $13 = $s + 2750 | 0;
  var $14 = $s + 2748 | 0;
  var $n_0_ph = 0;
  var $prevlen_0_ph = -1;
  var $nextlen_0_ph = $2 & 65535;
  var $max_count_1_ph = $4 ? 138 : 7;
  var $min_count_1_ph = $4 ? 3 : 4;
  L1450 : while (1) {
    var $min_count_1_ph;
    var $max_count_1_ph;
    var $nextlen_0_ph;
    var $prevlen_0_ph;
    var $n_0_ph;
    var $n_0 = $n_0_ph;
    var $count_0 = 0;
    while (1) {
      var $count_0;
      var $n_0;
      if (($n_0 | 0) > ($max_code | 0)) {
        break L1450;
      }
      var $18 = $n_0 + 1 | 0;
      var $20 = HEAP16[$tree + ($18 << 2) + 2 >> 1];
      var $21 = $20 & 65535;
      var $22 = $count_0 + 1 | 0;
      var $24 = ($nextlen_0_ph | 0) == ($21 | 0);
      if (($22 | 0) < ($max_count_1_ph | 0) & $24) {
        var $n_0 = $18;
        var $count_0 = $22;
      } else {
        break;
      }
    }
    var $26 = ($22 | 0) < ($min_count_1_ph | 0);
    L1456 : do {
      if ($26) {
        var $27 = ($nextlen_0_ph << 2) + $s + 2686 | 0;
        var $28 = ($nextlen_0_ph << 2) + $s + 2684 | 0;
        var $count_1 = $22;
        var $31 = HEAP32[$6$s2];
        var $30 = HEAP16[$8$s1];
        while (1) {
          var $30;
          var $31;
          var $count_1;
          var $33 = HEAPU16[$27 >> 1];
          var $37 = HEAPU16[$28 >> 1];
          var $40 = $30 & 65535 | $37 << $31;
          var $41 = $40 & 65535;
          HEAP16[$8$s1] = $41;
          if (($31 | 0) > (16 - $33 | 0)) {
            var $44 = HEAP32[$9$s2];
            HEAP32[$9$s2] = $44 + 1 | 0;
            HEAP8[HEAP32[$10$s2] + $44 | 0] = $40 & 255;
            var $50 = HEAPU16[$8$s1] >>> 8 & 255;
            var $51 = HEAP32[$9$s2];
            HEAP32[$9$s2] = $51 + 1 | 0;
            HEAP8[HEAP32[$10$s2] + $51 | 0] = $50;
            var $55 = HEAP32[$6$s2];
            var $58 = $37 >>> ((16 - $55 | 0) >>> 0) & 65535;
            HEAP16[$8$s1] = $58;
            var $storemerge180 = $33 - 16 + $55 | 0;
            var $64 = $58;
          } else {
            var $storemerge180 = $31 + $33 | 0;
            var $64 = $41;
          }
          var $64;
          var $storemerge180;
          HEAP32[$6$s2] = $storemerge180;
          var $65 = $count_1 - 1 | 0;
          if (($65 | 0) == 0) {
            break L1456;
          } else {
            var $count_1 = $65;
            var $31 = $storemerge180;
            var $30 = $64;
          }
        }
      } else {
        if (($nextlen_0_ph | 0) != 0) {
          if (($nextlen_0_ph | 0) == ($prevlen_0_ph | 0)) {
            var $count_2 = $22;
            var $111 = HEAP32[$6$s2];
            var $110 = HEAP16[$8$s1];
          } else {
            var $74 = HEAPU16[$s + ($nextlen_0_ph << 2) + 2686 >> 1];
            var $75 = HEAP32[$6$s2];
            var $80 = HEAPU16[$s + ($nextlen_0_ph << 2) + 2684 >> 1];
            var $84 = HEAPU16[$8$s1] | $80 << $75;
            var $85 = $84 & 65535;
            HEAP16[$8$s1] = $85;
            if (($75 | 0) > (16 - $74 | 0)) {
              var $88 = HEAP32[$9$s2];
              HEAP32[$9$s2] = $88 + 1 | 0;
              HEAP8[HEAP32[$10$s2] + $88 | 0] = $84 & 255;
              var $94 = HEAPU16[$8$s1] >>> 8 & 255;
              var $95 = HEAP32[$9$s2];
              HEAP32[$9$s2] = $95 + 1 | 0;
              HEAP8[HEAP32[$10$s2] + $95 | 0] = $94;
              var $99 = HEAP32[$6$s2];
              var $102 = $80 >>> ((16 - $99 | 0) >>> 0) & 65535;
              HEAP16[$8$s1] = $102;
              var $storemerge179 = $74 - 16 + $99 | 0;
              var $108 = $102;
            } else {
              var $storemerge179 = $75 + $74 | 0;
              var $108 = $85;
            }
            var $108;
            var $storemerge179;
            HEAP32[$6$s2] = $storemerge179;
            var $count_2 = $count_0;
            var $111 = $storemerge179;
            var $110 = $108;
          }
          var $110;
          var $111;
          var $count_2;
          var $113 = HEAPU16[$13 >> 1];
          var $117 = HEAPU16[$14 >> 1];
          var $120 = $110 & 65535 | $117 << $111;
          HEAP16[$8$s1] = $120 & 65535;
          if (($111 | 0) > (16 - $113 | 0)) {
            var $124 = HEAP32[$9$s2];
            HEAP32[$9$s2] = $124 + 1 | 0;
            HEAP8[HEAP32[$10$s2] + $124 | 0] = $120 & 255;
            var $130 = HEAPU16[$8$s1] >>> 8 & 255;
            var $131 = HEAP32[$9$s2];
            HEAP32[$9$s2] = $131 + 1 | 0;
            HEAP8[HEAP32[$10$s2] + $131 | 0] = $130;
            var $135 = HEAP32[$6$s2];
            var $137 = $117 >>> ((16 - $135 | 0) >>> 0);
            HEAP16[$8$s1] = $137 & 65535;
            var $145 = $113 - 16 + $135 | 0;
            var $144 = $137;
          } else {
            var $145 = $111 + $113 | 0;
            var $144 = $120;
          }
          var $144;
          var $145;
          HEAP32[$6$s2] = $145;
          var $148 = $count_2 + 65533 & 65535;
          var $151 = $144 & 65535 | $148 << $145;
          HEAP16[$8$s1] = $151 & 65535;
          if (($145 | 0) > 14) {
            var $155 = HEAP32[$9$s2];
            HEAP32[$9$s2] = $155 + 1 | 0;
            HEAP8[HEAP32[$10$s2] + $155 | 0] = $151 & 255;
            var $161 = HEAPU16[$8$s1] >>> 8 & 255;
            var $162 = HEAP32[$9$s2];
            HEAP32[$9$s2] = $162 + 1 | 0;
            HEAP8[HEAP32[$10$s2] + $162 | 0] = $161;
            var $166 = HEAP32[$6$s2];
            HEAP16[$8$s1] = $148 >>> ((16 - $166 | 0) >>> 0) & 65535;
            HEAP32[$6$s2] = $166 - 14 | 0;
            break;
          } else {
            HEAP32[$6$s2] = $145 + 2 | 0;
            break;
          }
        }
        if (($22 | 0) < 11) {
          var $177 = HEAPU16[$5 >> 1];
          var $178 = HEAP32[$6$s2];
          var $182 = HEAPU16[$7 >> 1];
          var $186 = HEAPU16[$8$s1] | $182 << $178;
          HEAP16[$8$s1] = $186 & 65535;
          if (($178 | 0) > (16 - $177 | 0)) {
            var $190 = HEAP32[$9$s2];
            HEAP32[$9$s2] = $190 + 1 | 0;
            HEAP8[HEAP32[$10$s2] + $190 | 0] = $186 & 255;
            var $196 = HEAPU16[$8$s1] >>> 8 & 255;
            var $197 = HEAP32[$9$s2];
            HEAP32[$9$s2] = $197 + 1 | 0;
            HEAP8[HEAP32[$10$s2] + $197 | 0] = $196;
            var $201 = HEAP32[$6$s2];
            var $203 = $182 >>> ((16 - $201 | 0) >>> 0);
            HEAP16[$8$s1] = $203 & 65535;
            var $211 = $177 - 16 + $201 | 0;
            var $210 = $203;
          } else {
            var $211 = $178 + $177 | 0;
            var $210 = $186;
          }
          var $210;
          var $211;
          HEAP32[$6$s2] = $211;
          var $214 = $count_0 + 65534 & 65535;
          var $217 = $210 & 65535 | $214 << $211;
          HEAP16[$8$s1] = $217 & 65535;
          if (($211 | 0) > 13) {
            var $221 = HEAP32[$9$s2];
            HEAP32[$9$s2] = $221 + 1 | 0;
            HEAP8[HEAP32[$10$s2] + $221 | 0] = $217 & 255;
            var $227 = HEAPU16[$8$s1] >>> 8 & 255;
            var $228 = HEAP32[$9$s2];
            HEAP32[$9$s2] = $228 + 1 | 0;
            HEAP8[HEAP32[$10$s2] + $228 | 0] = $227;
            var $232 = HEAP32[$6$s2];
            HEAP16[$8$s1] = $214 >>> ((16 - $232 | 0) >>> 0) & 65535;
            HEAP32[$6$s2] = $232 - 13 | 0;
            break;
          } else {
            HEAP32[$6$s2] = $211 + 3 | 0;
            break;
          }
        } else {
          var $241 = HEAPU16[$11 >> 1];
          var $242 = HEAP32[$6$s2];
          var $246 = HEAPU16[$12 >> 1];
          var $250 = HEAPU16[$8$s1] | $246 << $242;
          HEAP16[$8$s1] = $250 & 65535;
          if (($242 | 0) > (16 - $241 | 0)) {
            var $254 = HEAP32[$9$s2];
            HEAP32[$9$s2] = $254 + 1 | 0;
            HEAP8[HEAP32[$10$s2] + $254 | 0] = $250 & 255;
            var $260 = HEAPU16[$8$s1] >>> 8 & 255;
            var $261 = HEAP32[$9$s2];
            HEAP32[$9$s2] = $261 + 1 | 0;
            HEAP8[HEAP32[$10$s2] + $261 | 0] = $260;
            var $265 = HEAP32[$6$s2];
            var $267 = $246 >>> ((16 - $265 | 0) >>> 0);
            HEAP16[$8$s1] = $267 & 65535;
            var $275 = $241 - 16 + $265 | 0;
            var $274 = $267;
          } else {
            var $275 = $242 + $241 | 0;
            var $274 = $250;
          }
          var $274;
          var $275;
          HEAP32[$6$s2] = $275;
          var $278 = $count_0 + 65526 & 65535;
          var $281 = $274 & 65535 | $278 << $275;
          HEAP16[$8$s1] = $281 & 65535;
          if (($275 | 0) > 9) {
            var $285 = HEAP32[$9$s2];
            HEAP32[$9$s2] = $285 + 1 | 0;
            HEAP8[HEAP32[$10$s2] + $285 | 0] = $281 & 255;
            var $291 = HEAPU16[$8$s1] >>> 8 & 255;
            var $292 = HEAP32[$9$s2];
            HEAP32[$9$s2] = $292 + 1 | 0;
            HEAP8[HEAP32[$10$s2] + $292 | 0] = $291;
            var $296 = HEAP32[$6$s2];
            HEAP16[$8$s1] = $278 >>> ((16 - $296 | 0) >>> 0) & 65535;
            HEAP32[$6$s2] = $296 - 9 | 0;
            break;
          } else {
            HEAP32[$6$s2] = $275 + 7 | 0;
            break;
          }
        }
      }
    } while (0);
    if ($20 << 16 >> 16 == 0) {
      var $n_0_ph = $18;
      var $prevlen_0_ph = $nextlen_0_ph;
      var $nextlen_0_ph = $21;
      var $max_count_1_ph = 138;
      var $min_count_1_ph = 3;
      continue;
    }
    var $n_0_ph = $18;
    var $prevlen_0_ph = $nextlen_0_ph;
    var $nextlen_0_ph = $21;
    var $max_count_1_ph = $24 ? 6 : 7;
    var $min_count_1_ph = $24 ? 3 : 4;
  }
  return;
}
_send_tree["X"] = 1;
function _scan_tree($s, $tree, $max_code) {
  var $2 = HEAP16[$tree + 2 >> 1];
  var $4 = $2 << 16 >> 16 == 0;
  HEAP16[$tree + ($max_code + 1 << 2) + 2 >> 1] = -1;
  var $7 = $s + 2752 | 0;
  var $8 = $s + 2756 | 0;
  var $9 = $s + 2748 | 0;
  var $min_count_1_ph = $4 ? 3 : 4;
  var $max_count_1_ph = $4 ? 138 : 7;
  var $nextlen_0_ph = $2 & 65535;
  var $n_0_ph = 0;
  var $prevlen_0_ph = -1;
  L1504 : while (1) {
    var $prevlen_0_ph;
    var $n_0_ph;
    var $nextlen_0_ph;
    var $max_count_1_ph;
    var $min_count_1_ph;
    var $count_0 = 0;
    var $n_0 = $n_0_ph;
    while (1) {
      var $n_0;
      var $count_0;
      if (($n_0 | 0) > ($max_code | 0)) {
        break L1504;
      }
      var $13 = $n_0 + 1 | 0;
      var $15 = HEAP16[$tree + ($13 << 2) + 2 >> 1];
      var $16 = $15 & 65535;
      var $17 = $count_0 + 1 | 0;
      var $19 = ($nextlen_0_ph | 0) == ($16 | 0);
      if (($17 | 0) < ($max_count_1_ph | 0) & $19) {
        var $count_0 = $17;
        var $n_0 = $13;
      } else {
        break;
      }
    }
    do {
      if (($17 | 0) < ($min_count_1_ph | 0)) {
        var $23 = ($nextlen_0_ph << 2) + $s + 2684 | 0;
        HEAP16[$23 >> 1] = HEAPU16[$23 >> 1] + $17 & 65535;
      } else {
        if (($nextlen_0_ph | 0) == 0) {
          if (($17 | 0) < 11) {
            HEAP16[$7 >> 1] = HEAP16[$7 >> 1] + 1 & 65535;
            break;
          } else {
            HEAP16[$8 >> 1] = HEAP16[$8 >> 1] + 1 & 65535;
            break;
          }
        } else {
          if (($nextlen_0_ph | 0) != ($prevlen_0_ph | 0)) {
            var $33 = ($nextlen_0_ph << 2) + $s + 2684 | 0;
            HEAP16[$33 >> 1] = HEAP16[$33 >> 1] + 1 & 65535;
          }
          HEAP16[$9 >> 1] = HEAP16[$9 >> 1] + 1 & 65535;
          break;
        }
      }
    } while (0);
    if ($15 << 16 >> 16 == 0) {
      var $min_count_1_ph = 3;
      var $max_count_1_ph = 138;
      var $prevlen_0_ph = $nextlen_0_ph;
      var $nextlen_0_ph = $16;
      var $n_0_ph = $13;
      continue;
    }
    var $min_count_1_ph = $19 ? 3 : 4;
    var $max_count_1_ph = $19 ? 6 : 7;
    var $prevlen_0_ph = $nextlen_0_ph;
    var $nextlen_0_ph = $16;
    var $n_0_ph = $13;
  }
  return;
}
_scan_tree["X"] = 1;
function _pqdownheap($s, $tree, $k) {
  var $48$s2;
  var $s$s2 = $s >> 2;
  var label = 0;
  var $2 = HEAP32[(($k << 2) + 2908 >> 2) + $s$s2];
  var $3 = $s + ($2 + 5208) | 0;
  var $j_048 = $k << 1;
  var $4 = $s + 5200 | 0;
  var $5 = HEAP32[$4 >> 2];
  if (($j_048 | 0) > ($5 | 0)) {
    var $_0_lcssa = $k;
    var $_0_lcssa;
    var $48 = ($_0_lcssa << 2) + $s + 2908 | 0, $48$s2 = $48 >> 2;
    HEAP32[$48$s2] = $2;
    return;
  }
  var $7 = ($2 << 2) + $tree | 0;
  var $_049 = $k;
  var $j_050 = $j_048;
  var $9 = $5;
  while (1) {
    var $9;
    var $j_050;
    var $_049;
    do {
      if (($j_050 | 0) < ($9 | 0)) {
        var $12 = $j_050 | 1;
        var $14 = HEAP32[(($12 << 2) + 2908 >> 2) + $s$s2];
        var $16 = HEAP16[$tree + ($14 << 2) >> 1];
        var $18 = HEAP32[(($j_050 << 2) + 2908 >> 2) + $s$s2];
        var $20 = HEAP16[$tree + ($18 << 2) >> 1];
        if (($16 & 65535) >= ($20 & 65535)) {
          if ($16 << 16 >> 16 != $20 << 16 >> 16) {
            var $j_1 = $j_050;
            break;
          }
          if (HEAPU8[$s + ($14 + 5208) | 0] > HEAPU8[$s + ($18 + 5208) | 0]) {
            var $j_1 = $j_050;
            break;
          }
        }
        var $j_1 = $12;
      } else {
        var $j_1 = $j_050;
      }
    } while (0);
    var $j_1;
    var $31 = HEAP16[$7 >> 1];
    var $33 = HEAP32[(($j_1 << 2) + 2908 >> 2) + $s$s2];
    var $35 = HEAP16[$tree + ($33 << 2) >> 1];
    if (($31 & 65535) < ($35 & 65535)) {
      var $_0_lcssa = $_049;
      label = 1149;
      break;
    }
    if ($31 << 16 >> 16 == $35 << 16 >> 16) {
      if (HEAPU8[$3] <= HEAPU8[$s + ($33 + 5208) | 0]) {
        var $_0_lcssa = $_049;
        label = 1150;
        break;
      }
    }
    HEAP32[(($_049 << 2) + 2908 >> 2) + $s$s2] = $33;
    var $j_0 = $j_1 << 1;
    var $46 = HEAP32[$4 >> 2];
    if (($j_0 | 0) > ($46 | 0)) {
      var $_0_lcssa = $j_1;
      label = 1151;
      break;
    } else {
      var $_049 = $j_1;
      var $j_050 = $j_0;
      var $9 = $46;
    }
  }
  if (label == 1149) {
    var $_0_lcssa;
    var $48 = ($_0_lcssa << 2) + $s + 2908 | 0, $48$s2 = $48 >> 2;
    HEAP32[$48$s2] = $2;
    return;
  } else if (label == 1150) {
    var $_0_lcssa;
    var $48 = ($_0_lcssa << 2) + $s + 2908 | 0, $48$s2 = $48 >> 2;
    HEAP32[$48$s2] = $2;
    return;
  } else if (label == 1151) {
    var $_0_lcssa;
    var $48 = ($_0_lcssa << 2) + $s + 2908 | 0, $48$s2 = $48 >> 2;
    HEAP32[$48$s2] = $2;
    return;
  }
}
_pqdownheap["X"] = 1;
function _send_all_trees($s, $lcodes, $dcodes, $blcodes) {
  var $101$s2;
  var $78$s2;
  var $46$s2;
  var $14$s2;
  var $7$s1;
  var $1$s2;
  var $1$s2 = ($s + 5820 | 0) >> 2;
  var $2 = HEAP32[$1$s2];
  var $5 = $lcodes + 65279 & 65535;
  var $7$s1 = ($s + 5816 | 0) >> 1;
  var $10 = HEAPU16[$7$s1] | $5 << $2;
  HEAP16[$7$s1] = $10 & 65535;
  if (($2 | 0) > 11) {
    var $14$s2 = ($s + 20 | 0) >> 2;
    var $15 = HEAP32[$14$s2];
    HEAP32[$14$s2] = $15 + 1 | 0;
    var $17 = $s + 8 | 0;
    HEAP8[HEAP32[$17 >> 2] + $15 | 0] = $10 & 255;
    var $22 = HEAPU16[$7$s1] >>> 8 & 255;
    var $23 = HEAP32[$14$s2];
    HEAP32[$14$s2] = $23 + 1 | 0;
    HEAP8[HEAP32[$17 >> 2] + $23 | 0] = $22;
    var $27 = HEAP32[$1$s2];
    var $29 = $5 >>> ((16 - $27 | 0) >>> 0);
    HEAP16[$7$s1] = $29 & 65535;
    var $36 = $27 - 11 | 0;
    var $35 = $29;
  } else {
    var $36 = $2 + 5 | 0;
    var $35 = $10;
  }
  var $35;
  var $36;
  HEAP32[$1$s2] = $36;
  var $38 = $dcodes - 1 | 0;
  var $39 = $38 & 65535;
  var $42 = $35 & 65535 | $39 << $36;
  HEAP16[$7$s1] = $42 & 65535;
  if (($36 | 0) > 11) {
    var $46$s2 = ($s + 20 | 0) >> 2;
    var $47 = HEAP32[$46$s2];
    HEAP32[$46$s2] = $47 + 1 | 0;
    var $49 = $s + 8 | 0;
    HEAP8[HEAP32[$49 >> 2] + $47 | 0] = $42 & 255;
    var $54 = HEAPU16[$7$s1] >>> 8 & 255;
    var $55 = HEAP32[$46$s2];
    HEAP32[$46$s2] = $55 + 1 | 0;
    HEAP8[HEAP32[$49 >> 2] + $55 | 0] = $54;
    var $59 = HEAP32[$1$s2];
    var $61 = $39 >>> ((16 - $59 | 0) >>> 0);
    HEAP16[$7$s1] = $61 & 65535;
    var $68 = $59 - 11 | 0;
    var $67 = $61;
  } else {
    var $68 = $36 + 5 | 0;
    var $67 = $42;
  }
  var $67;
  var $68;
  HEAP32[$1$s2] = $68;
  var $71 = $blcodes + 65532 & 65535;
  var $74 = $67 & 65535 | $71 << $68;
  HEAP16[$7$s1] = $74 & 65535;
  if (($68 | 0) > 12) {
    var $78$s2 = ($s + 20 | 0) >> 2;
    var $79 = HEAP32[$78$s2];
    HEAP32[$78$s2] = $79 + 1 | 0;
    var $81 = $s + 8 | 0;
    HEAP8[HEAP32[$81 >> 2] + $79 | 0] = $74 & 255;
    var $86 = HEAPU16[$7$s1] >>> 8 & 255;
    var $87 = HEAP32[$78$s2];
    HEAP32[$78$s2] = $87 + 1 | 0;
    HEAP8[HEAP32[$81 >> 2] + $87 | 0] = $86;
    var $91 = HEAP32[$1$s2];
    var $93 = $71 >>> ((16 - $91 | 0) >>> 0);
    HEAP16[$7$s1] = $93 & 65535;
    var $storemerge86 = $91 - 12 | 0;
    var $99 = $93;
  } else {
    var $storemerge86 = $68 + 4 | 0;
    var $99 = $74;
  }
  var $99;
  var $storemerge86;
  HEAP32[$1$s2] = $storemerge86;
  if (($blcodes | 0) <= 0) {
    var $140 = $s + 148 | 0;
    var $141 = $lcodes - 1 | 0;
    _send_tree($s, $140, $141);
    var $142 = $s + 2440 | 0;
    _send_tree($s, $142, $38);
    return;
  }
  var $101$s2 = ($s + 20 | 0) >> 2;
  var $102 = $s + 8 | 0;
  var $rank_088 = 0;
  var $105 = $storemerge86;
  var $104 = $99;
  while (1) {
    var $104;
    var $105;
    var $rank_088;
    var $112 = HEAPU16[$s + (HEAPU8[$rank_088 + 5255332 | 0] << 2) + 2686 >> 1];
    var $115 = $104 & 65535 | $112 << $105;
    HEAP16[$7$s1] = $115 & 65535;
    if (($105 | 0) > 13) {
      var $119 = HEAP32[$101$s2];
      HEAP32[$101$s2] = $119 + 1 | 0;
      HEAP8[HEAP32[$102 >> 2] + $119 | 0] = $115 & 255;
      var $125 = HEAPU16[$7$s1] >>> 8 & 255;
      var $126 = HEAP32[$101$s2];
      HEAP32[$101$s2] = $126 + 1 | 0;
      HEAP8[HEAP32[$102 >> 2] + $126 | 0] = $125;
      var $130 = HEAP32[$1$s2];
      var $132 = $112 >>> ((16 - $130 | 0) >>> 0);
      HEAP16[$7$s1] = $132 & 65535;
      var $storemerge87 = $130 - 13 | 0;
      var $138 = $132;
    } else {
      var $storemerge87 = $105 + 3 | 0;
      var $138 = $115;
    }
    var $138;
    var $storemerge87;
    HEAP32[$1$s2] = $storemerge87;
    var $139 = $rank_088 + 1 | 0;
    if (($139 | 0) == ($blcodes | 0)) {
      break;
    } else {
      var $rank_088 = $139;
      var $105 = $storemerge87;
      var $104 = $138;
    }
  }
  var $140 = $s + 148 | 0;
  var $141 = $lcodes - 1 | 0;
  _send_tree($s, $140, $141);
  var $142 = $s + 2440 | 0;
  _send_tree($s, $142, $38);
  return;
}
_send_all_trees["X"] = 1;
function _bi_reverse($code, $len) {
  var $res_0 = 0;
  var $_0 = $len;
  var $_05 = $code;
  while (1) {
    var $_05;
    var $_0;
    var $res_0;
    var $3 = $res_0 | $_05 & 1;
    var $6 = $_0 - 1 | 0;
    if (($6 | 0) > 0) {
      var $res_0 = $3 << 1;
      var $_0 = $6;
      var $_05 = $_05 >>> 1;
    } else {
      break;
    }
  }
  return $3 & 2147483647;
}
function _adler32($adler, $buf, $len) {
  var label = 0;
  var $1 = $adler >>> 16;
  var $2 = $adler & 65535;
  if (($len | 0) == 1) {
    var $7 = HEAPU8[$buf] + $2 | 0;
    var $_ = $7 >>> 0 > 65520 ? $7 - 65521 | 0 : $7;
    var $10 = $_ + $1 | 0;
    var $_0178 = ($10 >>> 0 > 65520 ? $10 + 15 | 0 : $10) << 16 | $_;
    var $_0178;
    return $_0178;
  }
  if (($buf | 0) == 0) {
    var $_0178 = 1;
    var $_0178;
    return $_0178;
  }
  if ($len >>> 0 < 16) {
    var $20 = ($len | 0) == 0;
    L1583 : do {
      if ($20) {
        var $_1174_lcssa = $2;
        var $sum2_1_lcssa = $1;
      } else {
        var $_1174179 = $2;
        var $_0169180 = $buf;
        var $_0181 = $len;
        var $sum2_1182 = $1;
        while (1) {
          var $sum2_1182;
          var $_0181;
          var $_0169180;
          var $_1174179;
          var $21 = $_0181 - 1 | 0;
          var $25 = HEAPU8[$_0169180] + $_1174179 | 0;
          var $26 = $25 + $sum2_1182 | 0;
          if (($21 | 0) == 0) {
            var $_1174_lcssa = $25;
            var $sum2_1_lcssa = $26;
            break L1583;
          } else {
            var $_1174179 = $25;
            var $_0169180 = $_0169180 + 1 | 0;
            var $_0181 = $21;
            var $sum2_1182 = $26;
          }
        }
      }
    } while (0);
    var $sum2_1_lcssa;
    var $_1174_lcssa;
    var $_0178 = ($sum2_1_lcssa >>> 0) % 65521 << 16 | ($_1174_lcssa >>> 0 > 65520 ? $_1174_lcssa - 65521 | 0 : $_1174_lcssa);
    var $_0178;
    return $_0178;
  }
  do {
    if ($len >>> 0 > 5551) {
      var $_3176206 = $2;
      var $_1170207 = $buf;
      var $_1208 = $len;
      var $sum2_2209 = $1;
      while (1) {
        var $sum2_2209;
        var $_1208;
        var $_1170207;
        var $_3176206;
        var $33 = $_1208 - 5552 | 0;
        var $n_0 = 347;
        var $sum2_3 = $sum2_2209;
        var $_2171 = $_1170207;
        var $_4177 = $_3176206;
        while (1) {
          var $_4177;
          var $_2171;
          var $sum2_3;
          var $n_0;
          var $37 = HEAPU8[$_2171] + $_4177 | 0;
          var $42 = $37 + HEAPU8[$_2171 + 1 | 0] | 0;
          var $47 = $42 + HEAPU8[$_2171 + 2 | 0] | 0;
          var $52 = $47 + HEAPU8[$_2171 + 3 | 0] | 0;
          var $57 = $52 + HEAPU8[$_2171 + 4 | 0] | 0;
          var $62 = $57 + HEAPU8[$_2171 + 5 | 0] | 0;
          var $67 = $62 + HEAPU8[$_2171 + 6 | 0] | 0;
          var $72 = $67 + HEAPU8[$_2171 + 7 | 0] | 0;
          var $77 = $72 + HEAPU8[$_2171 + 8 | 0] | 0;
          var $82 = $77 + HEAPU8[$_2171 + 9 | 0] | 0;
          var $87 = $82 + HEAPU8[$_2171 + 10 | 0] | 0;
          var $92 = $87 + HEAPU8[$_2171 + 11 | 0] | 0;
          var $97 = $92 + HEAPU8[$_2171 + 12 | 0] | 0;
          var $102 = $97 + HEAPU8[$_2171 + 13 | 0] | 0;
          var $107 = $102 + HEAPU8[$_2171 + 14 | 0] | 0;
          var $112 = $107 + HEAPU8[$_2171 + 15 | 0] | 0;
          var $113 = $37 + $sum2_3 + $42 + $47 + $52 + $57 + $62 + $67 + $72 + $77 + $82 + $87 + $92 + $97 + $102 + $107 + $112 | 0;
          var $115 = $n_0 - 1 | 0;
          if (($115 | 0) == 0) {
            break;
          } else {
            var $n_0 = $115;
            var $sum2_3 = $113;
            var $_2171 = $_2171 + 16 | 0;
            var $_4177 = $112;
          }
        }
        var $scevgep = $_1170207 + 5552 | 0;
        var $118 = ($112 >>> 0) % 65521;
        var $119 = ($113 >>> 0) % 65521;
        if ($33 >>> 0 > 5551) {
          var $_3176206 = $118;
          var $_1170207 = $scevgep;
          var $_1208 = $33;
          var $sum2_2209 = $119;
        } else {
          break;
        }
      }
      if (($33 | 0) == 0) {
        var $sum2_6 = $119;
        var $_7 = $118;
        break;
      }
      if ($33 >>> 0 > 15) {
        var $_5194 = $118;
        var $_3172195 = $scevgep;
        var $_2196 = $33;
        var $sum2_4197 = $119;
        label = 1188;
        break;
      } else {
        var $_6185 = $118;
        var $_4186 = $scevgep;
        var $_3187 = $33;
        var $sum2_5188 = $119;
        label = 1189;
        break;
      }
    } else {
      var $_5194 = $2;
      var $_3172195 = $buf;
      var $_2196 = $len;
      var $sum2_4197 = $1;
      label = 1188;
    }
  } while (0);
  do {
    if (label == 1188) {
      while (1) {
        label = 0;
        var $sum2_4197;
        var $_2196;
        var $_3172195;
        var $_5194;
        var $124 = $_2196 - 16 | 0;
        var $127 = HEAPU8[$_3172195] + $_5194 | 0;
        var $132 = $127 + HEAPU8[$_3172195 + 1 | 0] | 0;
        var $137 = $132 + HEAPU8[$_3172195 + 2 | 0] | 0;
        var $142 = $137 + HEAPU8[$_3172195 + 3 | 0] | 0;
        var $147 = $142 + HEAPU8[$_3172195 + 4 | 0] | 0;
        var $152 = $147 + HEAPU8[$_3172195 + 5 | 0] | 0;
        var $157 = $152 + HEAPU8[$_3172195 + 6 | 0] | 0;
        var $162 = $157 + HEAPU8[$_3172195 + 7 | 0] | 0;
        var $167 = $162 + HEAPU8[$_3172195 + 8 | 0] | 0;
        var $172 = $167 + HEAPU8[$_3172195 + 9 | 0] | 0;
        var $177 = $172 + HEAPU8[$_3172195 + 10 | 0] | 0;
        var $182 = $177 + HEAPU8[$_3172195 + 11 | 0] | 0;
        var $187 = $182 + HEAPU8[$_3172195 + 12 | 0] | 0;
        var $192 = $187 + HEAPU8[$_3172195 + 13 | 0] | 0;
        var $197 = $192 + HEAPU8[$_3172195 + 14 | 0] | 0;
        var $202 = $197 + HEAPU8[$_3172195 + 15 | 0] | 0;
        var $203 = $127 + $sum2_4197 + $132 + $137 + $142 + $147 + $152 + $157 + $162 + $167 + $172 + $177 + $182 + $187 + $192 + $197 + $202 | 0;
        var $204 = $_3172195 + 16 | 0;
        if ($124 >>> 0 > 15) {
          var $_5194 = $202;
          var $_3172195 = $204;
          var $_2196 = $124;
          var $sum2_4197 = $203;
          label = 1188;
        } else {
          break;
        }
      }
      if (($124 | 0) == 0) {
        var $_6_lcssa = $202;
        var $sum2_5_lcssa = $203;
        label = 1190;
        break;
      } else {
        var $_6185 = $202;
        var $_4186 = $204;
        var $_3187 = $124;
        var $sum2_5188 = $203;
        label = 1189;
        break;
      }
    }
  } while (0);
  L1601 : do {
    if (label == 1189) {
      while (1) {
        label = 0;
        var $sum2_5188;
        var $_3187;
        var $_4186;
        var $_6185;
        var $206 = $_3187 - 1 | 0;
        var $210 = HEAPU8[$_4186] + $_6185 | 0;
        var $211 = $210 + $sum2_5188 | 0;
        if (($206 | 0) == 0) {
          var $_6_lcssa = $210;
          var $sum2_5_lcssa = $211;
          label = 1190;
          break L1601;
        } else {
          var $_6185 = $210;
          var $_4186 = $_4186 + 1 | 0;
          var $_3187 = $206;
          var $sum2_5188 = $211;
          label = 1189;
        }
      }
    }
  } while (0);
  if (label == 1190) {
    var $sum2_5_lcssa;
    var $_6_lcssa;
    var $sum2_6 = ($sum2_5_lcssa >>> 0) % 65521;
    var $_7 = ($_6_lcssa >>> 0) % 65521;
  }
  var $_7;
  var $sum2_6;
  var $_0178 = $sum2_6 << 16 | $_7;
  var $_0178;
  return $_0178;
}
_adler32["X"] = 1;
function _crc32_little($crc, $buf, $len) {
  var $buf4_082$s2;
  var label = 0;
  var $1 = $crc ^ -1;
  if (($len | 0) == 0) {
    var $c_4 = $1;
    var $c_4;
    var $217 = $c_4 ^ -1;
    return $217;
  } else {
    var $_07287 = $buf;
    var $_088 = $len;
    var $c_089 = $1;
  }
  while (1) {
    var $c_089;
    var $_088;
    var $_07287;
    if (($_07287 & 3 | 0) == 0) {
      break;
    }
    var $14 = HEAP32[((HEAPU8[$_07287] ^ $c_089 & 255) << 2) + 5247020 >> 2] ^ $c_089 >>> 8;
    var $15 = $_088 - 1 | 0;
    if (($15 | 0) == 0) {
      var $c_4 = $14;
      label = 1211;
      break;
    } else {
      var $_07287 = $_07287 + 1 | 0;
      var $_088 = $15;
      var $c_089 = $14;
    }
  }
  if (label == 1211) {
    var $c_4;
    var $217 = $c_4 ^ -1;
    return $217;
  }
  var $17 = $_07287;
  var $18 = $_088 >>> 0 > 31;
  L1617 : do {
    if ($18) {
      var $_180 = $_088;
      var $c_181 = $c_089;
      var $buf4_082 = $17, $buf4_082$s2 = $buf4_082 >> 2;
      while (1) {
        var $buf4_082;
        var $c_181;
        var $_180;
        var $22 = HEAP32[$buf4_082$s2] ^ $c_181;
        var $42 = HEAP32[(($22 >>> 8 & 255) << 2) + 5249068 >> 2] ^ HEAP32[(($22 & 255) << 2) + 5250092 >> 2] ^ HEAP32[(($22 >>> 16 & 255) << 2) + 5248044 >> 2] ^ HEAP32[($22 >>> 24 << 2) + 5247020 >> 2] ^ HEAP32[$buf4_082$s2 + 1];
        var $62 = HEAP32[(($42 >>> 8 & 255) << 2) + 5249068 >> 2] ^ HEAP32[(($42 & 255) << 2) + 5250092 >> 2] ^ HEAP32[(($42 >>> 16 & 255) << 2) + 5248044 >> 2] ^ HEAP32[($42 >>> 24 << 2) + 5247020 >> 2] ^ HEAP32[$buf4_082$s2 + 2];
        var $82 = HEAP32[(($62 >>> 8 & 255) << 2) + 5249068 >> 2] ^ HEAP32[(($62 & 255) << 2) + 5250092 >> 2] ^ HEAP32[(($62 >>> 16 & 255) << 2) + 5248044 >> 2] ^ HEAP32[($62 >>> 24 << 2) + 5247020 >> 2] ^ HEAP32[$buf4_082$s2 + 3];
        var $102 = HEAP32[(($82 >>> 8 & 255) << 2) + 5249068 >> 2] ^ HEAP32[(($82 & 255) << 2) + 5250092 >> 2] ^ HEAP32[(($82 >>> 16 & 255) << 2) + 5248044 >> 2] ^ HEAP32[($82 >>> 24 << 2) + 5247020 >> 2] ^ HEAP32[$buf4_082$s2 + 4];
        var $122 = HEAP32[(($102 >>> 8 & 255) << 2) + 5249068 >> 2] ^ HEAP32[(($102 & 255) << 2) + 5250092 >> 2] ^ HEAP32[(($102 >>> 16 & 255) << 2) + 5248044 >> 2] ^ HEAP32[($102 >>> 24 << 2) + 5247020 >> 2] ^ HEAP32[$buf4_082$s2 + 5];
        var $142 = HEAP32[(($122 >>> 8 & 255) << 2) + 5249068 >> 2] ^ HEAP32[(($122 & 255) << 2) + 5250092 >> 2] ^ HEAP32[(($122 >>> 16 & 255) << 2) + 5248044 >> 2] ^ HEAP32[($122 >>> 24 << 2) + 5247020 >> 2] ^ HEAP32[$buf4_082$s2 + 6];
        var $160 = $buf4_082 + 32 | 0;
        var $162 = HEAP32[(($142 >>> 8 & 255) << 2) + 5249068 >> 2] ^ HEAP32[(($142 & 255) << 2) + 5250092 >> 2] ^ HEAP32[(($142 >>> 16 & 255) << 2) + 5248044 >> 2] ^ HEAP32[($142 >>> 24 << 2) + 5247020 >> 2] ^ HEAP32[$buf4_082$s2 + 7];
        var $179 = HEAP32[(($162 >>> 8 & 255) << 2) + 5249068 >> 2] ^ HEAP32[(($162 & 255) << 2) + 5250092 >> 2] ^ HEAP32[(($162 >>> 16 & 255) << 2) + 5248044 >> 2] ^ HEAP32[($162 >>> 24 << 2) + 5247020 >> 2];
        var $180 = $_180 - 32 | 0;
        if ($180 >>> 0 > 31) {
          var $_180 = $180;
          var $c_181 = $179;
          var $buf4_082 = $160, $buf4_082$s2 = $buf4_082 >> 2;
        } else {
          var $_1_lcssa = $180;
          var $c_1_lcssa = $179;
          var $buf4_0_lcssa = $160;
          break L1617;
        }
      }
    } else {
      var $_1_lcssa = $_088;
      var $c_1_lcssa = $c_089;
      var $buf4_0_lcssa = $17;
    }
  } while (0);
  var $buf4_0_lcssa;
  var $c_1_lcssa;
  var $_1_lcssa;
  var $19 = $_1_lcssa >>> 0 > 3;
  L1621 : do {
    if ($19) {
      var $_275 = $_1_lcssa;
      var $c_276 = $c_1_lcssa;
      var $buf4_177 = $buf4_0_lcssa;
      while (1) {
        var $buf4_177;
        var $c_276;
        var $_275;
        var $182 = $buf4_177 + 4 | 0;
        var $184 = HEAP32[$buf4_177 >> 2] ^ $c_276;
        var $201 = HEAP32[(($184 >>> 8 & 255) << 2) + 5249068 >> 2] ^ HEAP32[(($184 & 255) << 2) + 5250092 >> 2] ^ HEAP32[(($184 >>> 16 & 255) << 2) + 5248044 >> 2] ^ HEAP32[($184 >>> 24 << 2) + 5247020 >> 2];
        var $202 = $_275 - 4 | 0;
        if ($202 >>> 0 > 3) {
          var $_275 = $202;
          var $c_276 = $201;
          var $buf4_177 = $182;
        } else {
          var $_2_lcssa = $202;
          var $c_2_lcssa = $201;
          var $buf4_1_lcssa = $182;
          break L1621;
        }
      }
    } else {
      var $_2_lcssa = $_1_lcssa;
      var $c_2_lcssa = $c_1_lcssa;
      var $buf4_1_lcssa = $buf4_0_lcssa;
    }
  } while (0);
  var $buf4_1_lcssa;
  var $c_2_lcssa;
  var $_2_lcssa;
  if (($_2_lcssa | 0) == 0) {
    var $c_4 = $c_2_lcssa;
    var $c_4;
    var $217 = $c_4 ^ -1;
    return $217;
  }
  var $c_3 = $c_2_lcssa;
  var $_3 = $_2_lcssa;
  var $_173 = $buf4_1_lcssa;
  while (1) {
    var $_173;
    var $_3;
    var $c_3;
    var $214 = HEAP32[((HEAPU8[$_173] ^ $c_3 & 255) << 2) + 5247020 >> 2] ^ $c_3 >>> 8;
    var $215 = $_3 - 1 | 0;
    if (($215 | 0) == 0) {
      var $c_4 = $214;
      break;
    } else {
      var $c_3 = $214;
      var $_3 = $215;
      var $_173 = $_173 + 1 | 0;
    }
  }
  var $c_4;
  var $217 = $c_4 ^ -1;
  return $217;
}
_crc32_little["X"] = 1;
function _gen_bitlen($s, $desc_0_0_val, $desc_0_1_val, $desc_0_2_val) {
  var $16$s2;
  var $desc_0_0_val$s1 = $desc_0_0_val >> 1;
  var $2 = HEAP32[$desc_0_2_val >> 2];
  var $4 = HEAP32[$desc_0_2_val + 4 >> 2];
  var $6 = HEAP32[$desc_0_2_val + 8 >> 2];
  var $8 = HEAP32[$desc_0_2_val + 16 >> 2];
  _memset($s + 2876 | 0, 0, 32, 2);
  var $9 = $s + 5204 | 0;
  HEAP16[((HEAP32[$s + (HEAP32[$9 >> 2] << 2) + 2908 >> 2] << 2) + 2 >> 1) + $desc_0_0_val$s1] = 0;
  var $h_09 = HEAP32[$9 >> 2] + 1 | 0;
  if (($h_09 | 0) >= 573) {
    return;
  }
  var $16$s2 = ($s + 5800 | 0) >> 2;
  var $17 = ($2 | 0) == 0;
  var $18 = $s + 5804 | 0;
  L1635 : do {
    if ($17) {
      var $overflow_010_us = 0;
      var $h_011_us = $h_09;
      while (1) {
        var $h_011_us;
        var $overflow_010_us;
        var $20 = HEAP32[$s + ($h_011_us << 2) + 2908 >> 2];
        var $21 = ($20 << 2) + $desc_0_0_val + 2 | 0;
        var $27 = HEAPU16[((HEAPU16[$21 >> 1] << 2) + 2 >> 1) + $desc_0_0_val$s1] + 1 | 0;
        var $28 = ($27 | 0) > ($8 | 0);
        var $__us = $28 ? $8 : $27;
        var $_overflow_0_us = ($28 & 1) + $overflow_010_us | 0;
        HEAP16[$21 >> 1] = $__us & 65535;
        if (($20 | 0) <= ($desc_0_1_val | 0)) {
          var $33 = ($__us << 1) + $s + 2876 | 0;
          HEAP16[$33 >> 1] = HEAP16[$33 >> 1] + 1 & 65535;
          if (($20 | 0) < ($6 | 0)) {
            var $xbits_0_us = 0;
          } else {
            var $xbits_0_us = HEAP32[$4 + ($20 - $6 << 2) >> 2];
          }
          var $xbits_0_us;
          HEAP32[$16$s2] = HEAPU16[($20 << 2 >> 1) + $desc_0_0_val$s1] * ($xbits_0_us + $__us) + HEAP32[$16$s2] | 0;
        }
        var $h_0_us = $h_011_us + 1 | 0;
        if (($h_0_us | 0) == 573) {
          var $overflow_0_lcssa = $_overflow_0_us;
          break L1635;
        } else {
          var $overflow_010_us = $_overflow_0_us;
          var $h_011_us = $h_0_us;
        }
      }
    } else {
      var $overflow_010 = 0;
      var $h_011 = $h_09;
      while (1) {
        var $h_011;
        var $overflow_010;
        var $50 = HEAP32[$s + ($h_011 << 2) + 2908 >> 2];
        var $51 = ($50 << 2) + $desc_0_0_val + 2 | 0;
        var $57 = HEAPU16[((HEAPU16[$51 >> 1] << 2) + 2 >> 1) + $desc_0_0_val$s1] + 1 | 0;
        var $58 = ($57 | 0) > ($8 | 0);
        var $_ = $58 ? $8 : $57;
        var $_overflow_0 = ($58 & 1) + $overflow_010 | 0;
        HEAP16[$51 >> 1] = $_ & 65535;
        if (($50 | 0) <= ($desc_0_1_val | 0)) {
          var $63 = ($_ << 1) + $s + 2876 | 0;
          HEAP16[$63 >> 1] = HEAP16[$63 >> 1] + 1 & 65535;
          if (($50 | 0) < ($6 | 0)) {
            var $xbits_0 = 0;
          } else {
            var $xbits_0 = HEAP32[$4 + ($50 - $6 << 2) >> 2];
          }
          var $xbits_0;
          var $74 = HEAPU16[($50 << 2 >> 1) + $desc_0_0_val$s1];
          HEAP32[$16$s2] = $74 * ($xbits_0 + $_) + HEAP32[$16$s2] | 0;
          HEAP32[$18 >> 2] = (HEAPU16[$2 + ($50 << 2) + 2 >> 1] + $xbits_0) * $74 + HEAP32[$18 >> 2] | 0;
        }
        var $h_0 = $h_011 + 1 | 0;
        if (($h_0 | 0) == 573) {
          var $overflow_0_lcssa = $_overflow_0;
          break L1635;
        } else {
          var $overflow_010 = $_overflow_0;
          var $h_011 = $h_0;
        }
      }
    }
  } while (0);
  var $overflow_0_lcssa;
  if (($overflow_0_lcssa | 0) == 0) {
    return;
  }
  var $87 = ($8 << 1) + $s + 2876 | 0;
  var $overflow_2 = $overflow_0_lcssa;
  while (1) {
    var $overflow_2;
    var $bits_2_in = $8;
    while (1) {
      var $bits_2_in;
      var $bits_2 = $bits_2_in - 1 | 0;
      var $90 = ($bits_2 << 1) + $s + 2876 | 0;
      var $91 = HEAP16[$90 >> 1];
      if ($91 << 16 >> 16 == 0) {
        var $bits_2_in = $bits_2;
      } else {
        break;
      }
    }
    HEAP16[$90 >> 1] = $91 - 1 & 65535;
    var $95 = ($bits_2_in << 1) + $s + 2876 | 0;
    HEAP16[$95 >> 1] = HEAP16[$95 >> 1] + 2 & 65535;
    var $99 = HEAP16[$87 >> 1] - 1 & 65535;
    HEAP16[$87 >> 1] = $99;
    var $100 = $overflow_2 - 2 | 0;
    if (($100 | 0) > 0) {
      var $overflow_2 = $100;
    } else {
      break;
    }
  }
  if (($8 | 0) == 0) {
    return;
  } else {
    var $bits_34 = $8;
    var $h_15 = 573;
    var $103 = $99;
  }
  while (1) {
    var $103;
    var $h_15;
    var $bits_34;
    var $105 = $bits_34 & 65535;
    var $h_2_ph = $h_15;
    var $n_0_ph = $103 & 65535;
    while (1) {
      var $n_0_ph;
      var $h_2_ph;
      if (($n_0_ph | 0) == 0) {
        break;
      } else {
        var $h_2 = $h_2_ph;
      }
      while (1) {
        var $h_2;
        var $107 = $h_2 - 1 | 0;
        var $109 = HEAP32[$s + ($107 << 2) + 2908 >> 2];
        if (($109 | 0) > ($desc_0_1_val | 0)) {
          var $h_2 = $107;
        } else {
          break;
        }
      }
      var $111 = ($109 << 2) + $desc_0_0_val + 2 | 0;
      var $113 = HEAPU16[$111 >> 1];
      if (($113 | 0) != ($bits_34 | 0)) {
        HEAP32[$16$s2] = HEAPU16[($109 << 2 >> 1) + $desc_0_0_val$s1] * ($bits_34 - $113) + HEAP32[$16$s2] | 0;
        HEAP16[$111 >> 1] = $105;
      }
      var $h_2_ph = $107;
      var $n_0_ph = $n_0_ph - 1 | 0;
    }
    var $125 = $bits_34 - 1 | 0;
    if (($125 | 0) == 0) {
      break;
    }
    var $bits_34 = $125;
    var $h_15 = $h_2_ph;
    var $103 = HEAP16[$s + ($125 << 1) + 2876 >> 1];
  }
  return;
}
_gen_bitlen["X"] = 1;
function _gen_codes($tree, $max_code, $bl_count) {
  var __stackBase__ = STACKTOP;
  STACKTOP = STACKTOP + 32 | 0;
  var $next_code = __stackBase__;
  var $bits_013 = 1;
  var $code_014 = 0;
  while (1) {
    var $code_014;
    var $bits_013;
    var $10 = HEAPU16[$bl_count + ($bits_013 - 1 << 1) >> 1] + ($code_014 & 65534) << 1;
    HEAP16[$next_code + ($bits_013 << 1) >> 1] = $10 & 65535;
    var $13 = $bits_013 + 1 | 0;
    if (($13 | 0) == 16) {
      break;
    } else {
      var $bits_013 = $13;
      var $code_014 = $10;
    }
  }
  if (($max_code | 0) < 0) {
    STACKTOP = __stackBase__;
    return;
  }
  var $2 = $max_code + 1 | 0;
  var $n_012 = 0;
  while (1) {
    var $n_012;
    var $16 = HEAP16[$tree + ($n_012 << 2) + 2 >> 1];
    var $17 = $16 & 65535;
    if ($16 << 16 >> 16 != 0) {
      var $20 = ($17 << 1) + $next_code | 0;
      var $21 = HEAP16[$20 >> 1];
      HEAP16[$20 >> 1] = $21 + 1 & 65535;
      HEAP16[$tree + ($n_012 << 2) >> 1] = _bi_reverse($21 & 65535, $17) & 65535;
    }
    var $28 = $n_012 + 1 | 0;
    if (($28 | 0) == ($2 | 0)) {
      break;
    } else {
      var $n_012 = $28;
    }
  }
  STACKTOP = __stackBase__;
  return;
}
function _zcalloc($opaque, $items, $size) {
  return _malloc($size * $items | 0);
}
function _zcfree($opaque, $ptr) {
  _free($ptr);
  return;
}
function _crc32($crc, $buf, $len) {
  if (($buf | 0) == 0) {
    var $_0 = 0;
  } else {
    var $_0 = _crc32_little($crc, $buf, $len);
  }
  var $_0;
  return $_0;
}
function _inflate_fast($strm, $start) {
  var $28$s2;
  var $26$s2;
  var $12$s2;
  var $2$s2;
  var label = 0;
  var $2 = HEAP32[$strm + 28 >> 2], $2$s2 = $2 >> 2;
  var $3 = $strm | 0;
  var $4 = HEAP32[$3 >> 2];
  var $6 = $strm + 4 | 0;
  var $8 = $4 + (HEAP32[$6 >> 2] - 6) | 0;
  var $9 = $strm + 12 | 0;
  var $10 = HEAP32[$9 >> 2];
  var $12$s2 = ($strm + 16 | 0) >> 2;
  var $13 = HEAP32[$12$s2];
  var $16 = $10 + ($13 - 258) | 0;
  var $20 = HEAP32[$2$s2 + 11];
  var $22 = HEAP32[$2$s2 + 12];
  var $25 = HEAP32[$2$s2 + 13];
  var $26$s2 = ($2 + 56 | 0) >> 2;
  var $28$s2 = ($2 + 60 | 0) >> 2;
  var $32 = HEAP32[$2$s2 + 19];
  var $35 = HEAP32[$2$s2 + 20];
  var $39 = (1 << HEAP32[$2$s2 + 21]) - 1 | 0;
  var $43 = (1 << HEAP32[$2$s2 + 22]) - 1 | 0;
  var $44 = $10 + $13 + ($start ^ -1) | 0;
  var $45 = $2 + 7104 | 0;
  var $46 = $25 - 1 | 0;
  var $47 = ($22 | 0) == 0;
  var $48 = HEAP32[$2$s2 + 10] - 1 | 0;
  var $49 = $48 + $22 | 0;
  var $50 = $22 - 1 | 0;
  var $51 = $44 - 1 | 0;
  var $52 = $44 - $22 | 0;
  var $in_0 = $4 - 1 | 0;
  var $out_0 = $10 - 1 | 0;
  var $hold_0 = HEAP32[$26$s2];
  var $bits_0 = HEAP32[$28$s2];
  L1697 : while (1) {
    var $bits_0;
    var $hold_0;
    var $out_0;
    var $in_0;
    if ($bits_0 >>> 0 < 15) {
      var $62 = $in_0 + 2 | 0;
      var $in_1 = $62;
      var $hold_1 = (HEAPU8[$in_0 + 1 | 0] << $bits_0) + (HEAPU8[$62] << $bits_0 + 8) + $hold_0 | 0;
      var $bits_1 = $bits_0 + 16 | 0;
    } else {
      var $in_1 = $in_0;
      var $hold_1 = $hold_0;
      var $bits_1 = $bits_0;
    }
    var $bits_1;
    var $hold_1;
    var $in_1;
    var $69 = $hold_1 & $39;
    var $here_sroa_0_0264 = HEAP8[($69 << 2) + $32 | 0];
    var $here_sroa_2_0266 = HEAP16[$32 + ($69 << 2) + 2 >> 1];
    var $70 = HEAPU8[($69 << 2) + $32 + 1 | 0];
    var $71 = $hold_1 >>> ($70 >>> 0);
    var $72 = $bits_1 - $70 | 0;
    var $73 = $here_sroa_0_0264 << 24 >> 24 == 0;
    L1702 : do {
      if ($73) {
        var $here_sroa_2_0_lcssa = $here_sroa_2_0266;
        var $_lcssa = $71;
        var $_lcssa255 = $72;
        label = 1262;
      } else {
        var $here_sroa_2_0267 = $here_sroa_2_0266;
        var $77 = $71;
        var $76 = $72;
        var $_in314 = $here_sroa_0_0264;
        while (1) {
          var $_in314;
          var $76;
          var $77;
          var $here_sroa_2_0267;
          var $78 = $_in314 & 255;
          if (($78 & 16 | 0) != 0) {
            break;
          }
          if (($78 & 64 | 0) != 0) {
            label = 1310;
            break L1697;
          }
          var $293 = ($77 & (1 << $78) - 1) + ($here_sroa_2_0267 & 65535) | 0;
          var $here_sroa_0_0 = HEAP8[($293 << 2) + $32 | 0];
          var $here_sroa_2_0 = HEAP16[$32 + ($293 << 2) + 2 >> 1];
          var $294 = HEAPU8[($293 << 2) + $32 + 1 | 0];
          var $295 = $77 >>> ($294 >>> 0);
          var $296 = $76 - $294 | 0;
          if ($here_sroa_0_0 << 24 >> 24 == 0) {
            var $here_sroa_2_0_lcssa = $here_sroa_2_0;
            var $_lcssa = $295;
            var $_lcssa255 = $296;
            label = 1262;
            break L1702;
          } else {
            var $here_sroa_2_0267 = $here_sroa_2_0;
            var $77 = $295;
            var $76 = $296;
            var $_in314 = $here_sroa_0_0;
          }
        }
        var $82 = $here_sroa_2_0267 & 65535;
        var $83 = $78 & 15;
        if (($83 | 0) == 0) {
          var $len_0 = $82;
          var $in_3 = $in_1;
          var $hold_4 = $77;
          var $bits_4 = $76;
        } else {
          if ($76 >>> 0 < $83 >>> 0) {
            var $88 = $in_1 + 1 | 0;
            var $in_2 = $88;
            var $hold_3 = (HEAPU8[$88] << $76) + $77 | 0;
            var $bits_3 = $76 + 8 | 0;
          } else {
            var $in_2 = $in_1;
            var $hold_3 = $77;
            var $bits_3 = $76;
          }
          var $bits_3;
          var $hold_3;
          var $in_2;
          var $len_0 = ($hold_3 & (1 << $83) - 1) + $82 | 0;
          var $in_3 = $in_2;
          var $hold_4 = $hold_3 >>> ($83 >>> 0);
          var $bits_4 = $bits_3 - $83 | 0;
        }
        var $bits_4;
        var $hold_4;
        var $in_3;
        var $len_0;
        if ($bits_4 >>> 0 < 15) {
          var $110 = $in_3 + 2 | 0;
          var $in_4 = $110;
          var $hold_5 = (HEAPU8[$in_3 + 1 | 0] << $bits_4) + (HEAPU8[$110] << $bits_4 + 8) + $hold_4 | 0;
          var $bits_5 = $bits_4 + 16 | 0;
        } else {
          var $in_4 = $in_3;
          var $hold_5 = $hold_4;
          var $bits_5 = $bits_4;
        }
        var $bits_5;
        var $hold_5;
        var $in_4;
        var $117 = $hold_5 & $43;
        var $here_sroa_2_1282 = HEAP16[$35 + ($117 << 2) + 2 >> 1];
        var $118 = HEAPU8[($117 << 2) + $35 + 1 | 0];
        var $119 = $hold_5 >>> ($118 >>> 0);
        var $120 = $bits_5 - $118 | 0;
        var $121 = HEAPU8[($117 << 2) + $35 | 0];
        var $123 = ($121 & 16 | 0) == 0;
        L1717 : do {
          if ($123) {
            var $here_sroa_2_1283 = $here_sroa_2_1282;
            var $267 = $119;
            var $266 = $120;
            var $265 = $121;
            while (1) {
              var $265;
              var $266;
              var $267;
              var $here_sroa_2_1283;
              if (($265 & 64 | 0) != 0) {
                label = 1307;
                break L1697;
              }
              var $275 = ($267 & (1 << $265) - 1) + ($here_sroa_2_1283 & 65535) | 0;
              var $here_sroa_2_1 = HEAP16[$35 + ($275 << 2) + 2 >> 1];
              var $276 = HEAPU8[($275 << 2) + $35 + 1 | 0];
              var $277 = $267 >>> ($276 >>> 0);
              var $278 = $266 - $276 | 0;
              var $279 = HEAPU8[($275 << 2) + $35 | 0];
              if (($279 & 16 | 0) == 0) {
                var $here_sroa_2_1283 = $here_sroa_2_1;
                var $267 = $277;
                var $266 = $278;
                var $265 = $279;
              } else {
                var $here_sroa_2_1_lcssa = $here_sroa_2_1;
                var $_lcssa271 = $277;
                var $_lcssa273 = $278;
                var $_lcssa275 = $279;
                break L1717;
              }
            }
          } else {
            var $here_sroa_2_1_lcssa = $here_sroa_2_1282;
            var $_lcssa271 = $119;
            var $_lcssa273 = $120;
            var $_lcssa275 = $121;
          }
        } while (0);
        var $_lcssa275;
        var $_lcssa273;
        var $_lcssa271;
        var $here_sroa_2_1_lcssa;
        var $124 = $here_sroa_2_1_lcssa & 65535;
        var $125 = $_lcssa275 & 15;
        do {
          if ($_lcssa273 >>> 0 < $125 >>> 0) {
            var $128 = $in_4 + 1 | 0;
            var $132 = (HEAPU8[$128] << $_lcssa273) + $_lcssa271 | 0;
            var $133 = $_lcssa273 + 8 | 0;
            if ($133 >>> 0 >= $125 >>> 0) {
              var $in_5 = $128;
              var $hold_7 = $132;
              var $bits_7 = $133;
              break;
            }
            var $136 = $in_4 + 2 | 0;
            var $in_5 = $136;
            var $hold_7 = (HEAPU8[$136] << $133) + $132 | 0;
            var $bits_7 = $_lcssa273 + 16 | 0;
          } else {
            var $in_5 = $in_4;
            var $hold_7 = $_lcssa271;
            var $bits_7 = $_lcssa273;
          }
        } while (0);
        var $bits_7;
        var $hold_7;
        var $in_5;
        var $146 = ($hold_7 & (1 << $125) - 1) + $124 | 0;
        var $147 = $hold_7 >>> ($125 >>> 0);
        var $148 = $bits_7 - $125 | 0;
        var $149 = $out_0;
        var $150 = $149 - $44 | 0;
        if ($146 >>> 0 <= $150 >>> 0) {
          var $from_5 = $out_0 + -$146 | 0;
          var $len_2 = $len_0;
          var $out_6 = $out_0;
          while (1) {
            var $out_6;
            var $len_2;
            var $from_5;
            HEAP8[$out_6 + 1 | 0] = HEAP8[$from_5 + 1 | 0];
            HEAP8[$out_6 + 2 | 0] = HEAP8[$from_5 + 2 | 0];
            var $249 = $from_5 + 3 | 0;
            var $251 = $out_6 + 3 | 0;
            HEAP8[$251] = HEAP8[$249];
            var $252 = $len_2 - 3 | 0;
            if ($252 >>> 0 > 2) {
              var $from_5 = $249;
              var $len_2 = $252;
              var $out_6 = $251;
            } else {
              break;
            }
          }
          if (($252 | 0) == 0) {
            var $in_6 = $in_5;
            var $out_7 = $251;
            var $hold_8 = $147;
            var $bits_8 = $148;
            break;
          }
          var $259 = $out_6 + 4 | 0;
          HEAP8[$259] = HEAP8[$from_5 + 4 | 0];
          if ($252 >>> 0 <= 1) {
            var $in_6 = $in_5;
            var $out_7 = $259;
            var $hold_8 = $147;
            var $bits_8 = $148;
            break;
          }
          var $264 = $out_6 + 5 | 0;
          HEAP8[$264] = HEAP8[$from_5 + 5 | 0];
          var $in_6 = $in_5;
          var $out_7 = $264;
          var $hold_8 = $147;
          var $bits_8 = $148;
          break;
        }
        var $153 = $146 - $150 | 0;
        if ($153 >>> 0 > $20 >>> 0) {
          if ((HEAP32[$45 >> 2] | 0) != 0) {
            label = 1277;
            break L1697;
          }
        }
        do {
          if ($47) {
            var $163 = $25 + ($48 - $153) | 0;
            if ($153 >>> 0 >= $len_0 >>> 0) {
              var $from_4_ph = $163;
              var $len_1_ph = $len_0;
              var $out_5_ph = $out_0;
              break;
            }
            var $166 = $len_0 - $153 | 0;
            var $167 = $146 - $149 | 0;
            var $from_0 = $163;
            var $op_0 = $153;
            var $out_1 = $out_0;
            while (1) {
              var $out_1;
              var $op_0;
              var $from_0;
              var $169 = $from_0 + 1 | 0;
              var $171 = $out_1 + 1 | 0;
              HEAP8[$171] = HEAP8[$169];
              var $172 = $op_0 - 1 | 0;
              if (($172 | 0) == 0) {
                break;
              } else {
                var $from_0 = $169;
                var $op_0 = $172;
                var $out_1 = $171;
              }
            }
            var $from_4_ph = $out_0 + $51 + $167 + (1 - $146) | 0;
            var $len_1_ph = $166;
            var $out_5_ph = $out_0 + $44 + $167 | 0;
          } else {
            if ($22 >>> 0 >= $153 >>> 0) {
              var $204 = $25 + ($50 - $153) | 0;
              if ($153 >>> 0 >= $len_0 >>> 0) {
                var $from_4_ph = $204;
                var $len_1_ph = $len_0;
                var $out_5_ph = $out_0;
                break;
              }
              var $207 = $len_0 - $153 | 0;
              var $208 = $146 - $149 | 0;
              var $from_3 = $204;
              var $op_3 = $153;
              var $out_4 = $out_0;
              while (1) {
                var $out_4;
                var $op_3;
                var $from_3;
                var $210 = $from_3 + 1 | 0;
                var $212 = $out_4 + 1 | 0;
                HEAP8[$212] = HEAP8[$210];
                var $213 = $op_3 - 1 | 0;
                if (($213 | 0) == 0) {
                  break;
                } else {
                  var $from_3 = $210;
                  var $op_3 = $213;
                  var $out_4 = $212;
                }
              }
              var $from_4_ph = $out_0 + $51 + $208 + (1 - $146) | 0;
              var $len_1_ph = $207;
              var $out_5_ph = $out_0 + $44 + $208 | 0;
              break;
            }
            var $179 = $25 + ($49 - $153) | 0;
            var $180 = $153 - $22 | 0;
            if ($180 >>> 0 >= $len_0 >>> 0) {
              var $from_4_ph = $179;
              var $len_1_ph = $len_0;
              var $out_5_ph = $out_0;
              break;
            }
            var $183 = $len_0 - $180 | 0;
            var $184 = $146 - $149 | 0;
            var $from_1 = $179;
            var $op_1 = $180;
            var $out_2 = $out_0;
            while (1) {
              var $out_2;
              var $op_1;
              var $from_1;
              var $186 = $from_1 + 1 | 0;
              var $188 = $out_2 + 1 | 0;
              HEAP8[$188] = HEAP8[$186];
              var $189 = $op_1 - 1 | 0;
              if (($189 | 0) == 0) {
                break;
              } else {
                var $from_1 = $186;
                var $op_1 = $189;
                var $out_2 = $188;
              }
            }
            var $scevgep346 = $out_0 + $52 + $184 | 0;
            if ($22 >>> 0 >= $183 >>> 0) {
              var $from_4_ph = $46;
              var $len_1_ph = $183;
              var $out_5_ph = $scevgep346;
              break;
            }
            var $194 = $183 - $22 | 0;
            var $from_2 = $46;
            var $op_2 = $22;
            var $out_3 = $scevgep346;
            while (1) {
              var $out_3;
              var $op_2;
              var $from_2;
              var $196 = $from_2 + 1 | 0;
              var $198 = $out_3 + 1 | 0;
              HEAP8[$198] = HEAP8[$196];
              var $199 = $op_2 - 1 | 0;
              if (($199 | 0) == 0) {
                break;
              } else {
                var $from_2 = $196;
                var $op_2 = $199;
                var $out_3 = $198;
              }
            }
            var $from_4_ph = $out_0 + $51 + $184 + (1 - $146) | 0;
            var $len_1_ph = $194;
            var $out_5_ph = $out_0 + $44 + $184 | 0;
          }
        } while (0);
        var $out_5_ph;
        var $len_1_ph;
        var $from_4_ph;
        var $217 = $len_1_ph >>> 0 > 2;
        L1760 : do {
          if ($217) {
            var $out_5297 = $out_5_ph;
            var $len_1298 = $len_1_ph;
            var $from_4299 = $from_4_ph;
            while (1) {
              var $from_4299;
              var $len_1298;
              var $out_5297;
              HEAP8[$out_5297 + 1 | 0] = HEAP8[$from_4299 + 1 | 0];
              HEAP8[$out_5297 + 2 | 0] = HEAP8[$from_4299 + 2 | 0];
              var $224 = $from_4299 + 3 | 0;
              var $226 = $out_5297 + 3 | 0;
              HEAP8[$226] = HEAP8[$224];
              var $227 = $len_1298 - 3 | 0;
              if ($227 >>> 0 > 2) {
                var $out_5297 = $226;
                var $len_1298 = $227;
                var $from_4299 = $224;
              } else {
                var $out_5_lcssa = $226;
                var $len_1_lcssa = $227;
                var $from_4_lcssa = $224;
                break L1760;
              }
            }
          } else {
            var $out_5_lcssa = $out_5_ph;
            var $len_1_lcssa = $len_1_ph;
            var $from_4_lcssa = $from_4_ph;
          }
        } while (0);
        var $from_4_lcssa;
        var $len_1_lcssa;
        var $out_5_lcssa;
        if (($len_1_lcssa | 0) == 0) {
          var $in_6 = $in_5;
          var $out_7 = $out_5_lcssa;
          var $hold_8 = $147;
          var $bits_8 = $148;
          break;
        }
        var $233 = $out_5_lcssa + 1 | 0;
        HEAP8[$233] = HEAP8[$from_4_lcssa + 1 | 0];
        if ($len_1_lcssa >>> 0 <= 1) {
          var $in_6 = $in_5;
          var $out_7 = $233;
          var $hold_8 = $147;
          var $bits_8 = $148;
          break;
        }
        var $238 = $out_5_lcssa + 2 | 0;
        HEAP8[$238] = HEAP8[$from_4_lcssa + 2 | 0];
        var $in_6 = $in_5;
        var $out_7 = $238;
        var $hold_8 = $147;
        var $bits_8 = $148;
        break;
      }
    } while (0);
    if (label == 1262) {
      label = 0;
      var $_lcssa255;
      var $_lcssa;
      var $here_sroa_2_0_lcssa;
      var $75 = $out_0 + 1 | 0;
      HEAP8[$75] = $here_sroa_2_0_lcssa & 255;
      var $in_6 = $in_1;
      var $out_7 = $75;
      var $hold_8 = $_lcssa;
      var $bits_8 = $_lcssa255;
    }
    var $bits_8;
    var $hold_8;
    var $out_7;
    var $in_6;
    if ($in_6 >>> 0 < $8 >>> 0 & $out_7 >>> 0 < $16 >>> 0) {
      var $in_0 = $in_6;
      var $out_0 = $out_7;
      var $hold_0 = $hold_8;
      var $bits_0 = $bits_8;
    } else {
      var $in_7 = $in_6;
      var $out_8 = $out_7;
      var $hold_9 = $hold_8;
      var $bits_9 = $bits_8;
      break;
    }
  }
  do {
    if (label == 1310) {
      if (($78 & 32 | 0) == 0) {
        HEAP32[$strm + 24 >> 2] = 5256016 | 0;
        HEAP32[$2$s2] = 29;
        var $in_7 = $in_1;
        var $out_8 = $out_0;
        var $hold_9 = $77;
        var $bits_9 = $76;
        break;
      } else {
        HEAP32[$2$s2] = 11;
        var $in_7 = $in_1;
        var $out_8 = $out_0;
        var $hold_9 = $77;
        var $bits_9 = $76;
        break;
      }
    } else if (label == 1307) {
      HEAP32[$strm + 24 >> 2] = 5256120 | 0;
      HEAP32[$2$s2] = 29;
      var $in_7 = $in_4;
      var $out_8 = $out_0;
      var $hold_9 = $267;
      var $bits_9 = $266;
    } else if (label == 1277) {
      HEAP32[$strm + 24 >> 2] = 5255764 | 0;
      HEAP32[$2$s2] = 29;
      var $in_7 = $in_5;
      var $out_8 = $out_0;
      var $hold_9 = $147;
      var $bits_9 = $148;
    }
  } while (0);
  var $bits_9;
  var $hold_9;
  var $out_8;
  var $in_7;
  var $309 = $bits_9 >>> 3;
  var $311 = $in_7 + -$309 | 0;
  var $313 = $bits_9 - ($309 << 3) | 0;
  var $316 = (1 << $313) - 1 & $hold_9;
  HEAP32[$3 >> 2] = $in_7 + (1 - $309) | 0;
  HEAP32[$9 >> 2] = $out_8 + 1 | 0;
  if ($311 >>> 0 < $8 >>> 0) {
    var $_in239 = $8 - $311 | 0;
  } else {
    var $_in239 = $8 - $311 | 0;
  }
  var $_in239;
  HEAP32[$6 >> 2] = $_in239 + 5 | 0;
  if ($out_8 >>> 0 < $16 >>> 0) {
    var $_in = $16 - $out_8 | 0;
    var $_in;
    var $340 = $_in + 257 | 0;
    HEAP32[$12$s2] = $340;
    HEAP32[$26$s2] = $316;
    HEAP32[$28$s2] = $313;
    return;
  } else {
    var $_in = $16 - $out_8 | 0;
    var $_in;
    var $340 = $_in + 257 | 0;
    HEAP32[$12$s2] = $340;
    HEAP32[$26$s2] = $316;
    HEAP32[$28$s2] = $313;
    return;
  }
}
_inflate_fast["X"] = 1;
function _malloc($bytes) {
  do {
    if ($bytes >>> 0 < 245) {
      if ($bytes >>> 0 < 11) {
        var $8 = 16;
      } else {
        var $8 = $bytes + 11 & -8;
      }
      var $8;
      var $9 = $8 >>> 3;
      var $10 = HEAP32[1314166];
      var $11 = $10 >>> ($9 >>> 0);
      if (($11 & 3 | 0) != 0) {
        var $17 = ($11 & 1 ^ 1) + $9 | 0;
        var $18 = $17 << 1;
        var $20 = ($18 << 2) + 5256704 | 0;
        var $21 = ($18 + 2 << 2) + 5256704 | 0;
        var $22 = HEAP32[$21 >> 2];
        var $23 = $22 + 8 | 0;
        var $24 = HEAP32[$23 >> 2];
        do {
          if (($20 | 0) == ($24 | 0)) {
            HEAP32[1314166] = $10 & (1 << $17 ^ -1);
          } else {
            if ($24 >>> 0 < HEAP32[1314170] >>> 0) {
              _abort();
            } else {
              HEAP32[$21 >> 2] = $24;
              HEAP32[$24 + 12 >> 2] = $20;
              break;
            }
          }
        } while (0);
        var $38 = $17 << 3;
        HEAP32[$22 + 4 >> 2] = $38 | 3;
        var $43 = $22 + ($38 | 4) | 0;
        HEAP32[$43 >> 2] = HEAP32[$43 >> 2] | 1;
        var $mem_0 = $23;
        var $mem_0;
        return $mem_0;
      }
      if ($8 >>> 0 <= HEAP32[1314168] >>> 0) {
        var $nb_0 = $8;
        break;
      }
      if (($11 | 0) == 0) {
        if ((HEAP32[1314167] | 0) == 0) {
          var $nb_0 = $8;
          break;
        }
        var $144 = _tmalloc_small($8);
        if (($144 | 0) == 0) {
          var $nb_0 = $8;
          break;
        } else {
          var $mem_0 = $144;
        }
        var $mem_0;
        return $mem_0;
      }
      var $54 = 2 << $9;
      var $57 = $11 << $9 & ($54 | -$54);
      var $60 = ($57 & -$57) - 1 | 0;
      var $62 = $60 >>> 12 & 16;
      var $63 = $60 >>> ($62 >>> 0);
      var $65 = $63 >>> 5 & 8;
      var $67 = $63 >>> ($65 >>> 0);
      var $69 = $67 >>> 2 & 4;
      var $71 = $67 >>> ($69 >>> 0);
      var $73 = $71 >>> 1 & 2;
      var $75 = $71 >>> ($73 >>> 0);
      var $77 = $75 >>> 1 & 1;
      var $80 = ($65 | $62 | $69 | $73 | $77) + ($75 >>> ($77 >>> 0)) | 0;
      var $81 = $80 << 1;
      var $83 = ($81 << 2) + 5256704 | 0;
      var $84 = ($81 + 2 << 2) + 5256704 | 0;
      var $85 = HEAP32[$84 >> 2];
      var $86 = $85 + 8 | 0;
      var $87 = HEAP32[$86 >> 2];
      do {
        if (($83 | 0) == ($87 | 0)) {
          HEAP32[1314166] = $10 & (1 << $80 ^ -1);
        } else {
          if ($87 >>> 0 < HEAP32[1314170] >>> 0) {
            _abort();
          } else {
            HEAP32[$84 >> 2] = $87;
            HEAP32[$87 + 12 >> 2] = $83;
            break;
          }
        }
      } while (0);
      var $101 = $80 << 3;
      var $102 = $101 - $8 | 0;
      HEAP32[$85 + 4 >> 2] = $8 | 3;
      var $105 = $85;
      var $107 = $105 + $8 | 0;
      HEAP32[$105 + ($8 | 4) >> 2] = $102 | 1;
      HEAP32[$105 + $101 >> 2] = $102;
      var $113 = HEAP32[1314168];
      if (($113 | 0) != 0) {
        var $116 = HEAP32[1314171];
        var $117 = $113 >>> 3;
        var $118 = $117 << 1;
        var $120 = ($118 << 2) + 5256704 | 0;
        var $121 = HEAP32[1314166];
        var $122 = 1 << $117;
        do {
          if (($121 & $122 | 0) == 0) {
            HEAP32[1314166] = $121 | $122;
            var $F4_0 = $120;
            var $_pre_phi = ($118 + 2 << 2) + 5256704 | 0;
          } else {
            var $128 = ($118 + 2 << 2) + 5256704 | 0;
            var $129 = HEAP32[$128 >> 2];
            if ($129 >>> 0 >= HEAP32[1314170] >>> 0) {
              var $F4_0 = $129;
              var $_pre_phi = $128;
              break;
            }
            _abort();
          }
        } while (0);
        var $_pre_phi;
        var $F4_0;
        HEAP32[$_pre_phi >> 2] = $116;
        HEAP32[$F4_0 + 12 >> 2] = $116;
        HEAP32[$116 + 8 >> 2] = $F4_0;
        HEAP32[$116 + 12 >> 2] = $120;
      }
      HEAP32[1314168] = $102;
      HEAP32[1314171] = $107;
      var $mem_0 = $86;
      var $mem_0;
      return $mem_0;
    } else {
      if ($bytes >>> 0 > 4294967231) {
        var $nb_0 = -1;
        break;
      }
      var $150 = $bytes + 11 & -8;
      if ((HEAP32[1314167] | 0) == 0) {
        var $nb_0 = $150;
        break;
      }
      var $154 = _tmalloc_large($150);
      if (($154 | 0) == 0) {
        var $nb_0 = $150;
        break;
      } else {
        var $mem_0 = $154;
      }
      var $mem_0;
      return $mem_0;
    }
  } while (0);
  var $nb_0;
  var $156 = HEAP32[1314168];
  if ($nb_0 >>> 0 > $156 >>> 0) {
    var $185 = HEAP32[1314169];
    if ($nb_0 >>> 0 < $185 >>> 0) {
      var $188 = $185 - $nb_0 | 0;
      HEAP32[1314169] = $188;
      var $189 = HEAP32[1314172];
      var $190 = $189;
      HEAP32[1314172] = $190 + $nb_0 | 0;
      HEAP32[$nb_0 + ($190 + 4) >> 2] = $188 | 1;
      HEAP32[$189 + 4 >> 2] = $nb_0 | 3;
      var $mem_0 = $189 + 8 | 0;
      var $mem_0;
      return $mem_0;
    } else {
      var $mem_0 = _sys_alloc($nb_0);
      var $mem_0;
      return $mem_0;
    }
  } else {
    var $159 = $156 - $nb_0 | 0;
    var $160 = HEAP32[1314171];
    if ($159 >>> 0 > 15) {
      var $163 = $160;
      HEAP32[1314171] = $163 + $nb_0 | 0;
      HEAP32[1314168] = $159;
      HEAP32[$nb_0 + ($163 + 4) >> 2] = $159 | 1;
      HEAP32[$163 + $156 >> 2] = $159;
      HEAP32[$160 + 4 >> 2] = $nb_0 | 3;
    } else {
      HEAP32[1314168] = 0;
      HEAP32[1314171] = 0;
      HEAP32[$160 + 4 >> 2] = $156 | 3;
      var $178 = $156 + ($160 + 4) | 0;
      HEAP32[$178 >> 2] = HEAP32[$178 >> 2] | 1;
    }
    var $mem_0 = $160 + 8 | 0;
    var $mem_0;
    return $mem_0;
  }
}
_malloc["X"] = 1;
function _tmalloc_small($nb) {
  var $R_1$s2;
  var $v_0$s2;
  var $1 = HEAP32[1314167];
  var $4 = ($1 & -$1) - 1 | 0;
  var $6 = $4 >>> 12 & 16;
  var $7 = $4 >>> ($6 >>> 0);
  var $9 = $7 >>> 5 & 8;
  var $11 = $7 >>> ($9 >>> 0);
  var $13 = $11 >>> 2 & 4;
  var $15 = $11 >>> ($13 >>> 0);
  var $17 = $15 >>> 1 & 2;
  var $19 = $15 >>> ($17 >>> 0);
  var $21 = $19 >>> 1 & 1;
  var $26 = HEAP32[(($9 | $6 | $13 | $17 | $21) + ($19 >>> ($21 >>> 0)) << 2) + 5256968 >> 2];
  var $t_0 = $26;
  var $v_0 = $26, $v_0$s2 = $v_0 >> 2;
  var $rsize_0 = (HEAP32[$26 + 4 >> 2] & -8) - $nb | 0;
  while (1) {
    var $rsize_0;
    var $v_0;
    var $t_0;
    var $33 = HEAP32[$t_0 + 16 >> 2];
    if (($33 | 0) == 0) {
      var $37 = HEAP32[$t_0 + 20 >> 2];
      if (($37 | 0) == 0) {
        break;
      } else {
        var $39 = $37;
      }
    } else {
      var $39 = $33;
    }
    var $39;
    var $43 = (HEAP32[$39 + 4 >> 2] & -8) - $nb | 0;
    var $44 = $43 >>> 0 < $rsize_0 >>> 0;
    var $t_0 = $39;
    var $v_0 = $44 ? $39 : $v_0, $v_0$s2 = $v_0 >> 2;
    var $rsize_0 = $44 ? $43 : $rsize_0;
  }
  var $46 = $v_0;
  var $47 = HEAP32[1314170];
  if ($46 >>> 0 < $47 >>> 0) {
    _abort();
  }
  var $50 = $46 + $nb | 0;
  var $51 = $50;
  if ($46 >>> 0 >= $50 >>> 0) {
    _abort();
  }
  var $55 = HEAP32[$v_0$s2 + 6];
  var $57 = HEAP32[$v_0$s2 + 3];
  var $58 = ($57 | 0) == ($v_0 | 0);
  L1856 : do {
    if ($58) {
      var $69 = $v_0 + 20 | 0;
      var $70 = HEAP32[$69 >> 2];
      do {
        if (($70 | 0) == 0) {
          var $73 = $v_0 + 16 | 0;
          var $74 = HEAP32[$73 >> 2];
          if (($74 | 0) == 0) {
            var $R_1 = 0, $R_1$s2 = $R_1 >> 2;
            break L1856;
          } else {
            var $R_0 = $74;
            var $RP_0 = $73;
            break;
          }
        } else {
          var $R_0 = $70;
          var $RP_0 = $69;
        }
      } while (0);
      while (1) {
        var $RP_0;
        var $R_0;
        var $76 = $R_0 + 20 | 0;
        var $77 = HEAP32[$76 >> 2];
        if (($77 | 0) != 0) {
          var $R_0 = $77;
          var $RP_0 = $76;
          continue;
        }
        var $80 = $R_0 + 16 | 0;
        var $81 = HEAP32[$80 >> 2];
        if (($81 | 0) == 0) {
          break;
        } else {
          var $R_0 = $81;
          var $RP_0 = $80;
        }
      }
      if ($RP_0 >>> 0 < $47 >>> 0) {
        _abort();
      } else {
        HEAP32[$RP_0 >> 2] = 0;
        var $R_1 = $R_0, $R_1$s2 = $R_1 >> 2;
        break;
      }
    } else {
      var $61 = HEAP32[$v_0$s2 + 2];
      if ($61 >>> 0 < $47 >>> 0) {
        _abort();
      } else {
        HEAP32[$61 + 12 >> 2] = $57;
        HEAP32[$57 + 8 >> 2] = $61;
        var $R_1 = $57, $R_1$s2 = $R_1 >> 2;
        break;
      }
    }
  } while (0);
  var $R_1;
  var $89 = ($55 | 0) == 0;
  L1872 : do {
    if (!$89) {
      var $91 = $v_0 + 28 | 0;
      var $93 = (HEAP32[$91 >> 2] << 2) + 5256968 | 0;
      do {
        if (($v_0 | 0) == (HEAP32[$93 >> 2] | 0)) {
          HEAP32[$93 >> 2] = $R_1;
          if (($R_1 | 0) != 0) {
            break;
          }
          HEAP32[1314167] = HEAP32[1314167] & (1 << HEAP32[$91 >> 2] ^ -1);
          break L1872;
        } else {
          if ($55 >>> 0 < HEAP32[1314170] >>> 0) {
            _abort();
          }
          var $107 = $55 + 16 | 0;
          if ((HEAP32[$107 >> 2] | 0) == ($v_0 | 0)) {
            HEAP32[$107 >> 2] = $R_1;
          } else {
            HEAP32[$55 + 20 >> 2] = $R_1;
          }
          if (($R_1 | 0) == 0) {
            break L1872;
          }
        }
      } while (0);
      if ($R_1 >>> 0 < HEAP32[1314170] >>> 0) {
        _abort();
      }
      HEAP32[$R_1$s2 + 6] = $55;
      var $123 = HEAP32[$v_0$s2 + 4];
      do {
        if (($123 | 0) != 0) {
          if ($123 >>> 0 < HEAP32[1314170] >>> 0) {
            _abort();
          } else {
            HEAP32[$R_1$s2 + 4] = $123;
            HEAP32[$123 + 24 >> 2] = $R_1;
            break;
          }
        }
      } while (0);
      var $135 = HEAP32[$v_0$s2 + 5];
      if (($135 | 0) == 0) {
        break;
      }
      if ($135 >>> 0 < HEAP32[1314170] >>> 0) {
        _abort();
      } else {
        HEAP32[$R_1$s2 + 5] = $135;
        HEAP32[$135 + 24 >> 2] = $R_1;
        break;
      }
    }
  } while (0);
  if ($rsize_0 >>> 0 < 16) {
    var $149 = $rsize_0 + $nb | 0;
    HEAP32[$v_0$s2 + 1] = $149 | 3;
    var $153 = $149 + ($46 + 4) | 0;
    HEAP32[$153 >> 2] = HEAP32[$153 >> 2] | 1;
    var $191 = $v_0 + 8 | 0;
    var $192 = $191;
    return $192;
  }
  HEAP32[$v_0$s2 + 1] = $nb | 3;
  HEAP32[$nb + ($46 + 4) >> 2] = $rsize_0 | 1;
  HEAP32[$46 + $rsize_0 + $nb >> 2] = $rsize_0;
  var $164 = HEAP32[1314168];
  if (($164 | 0) != 0) {
    var $167 = HEAP32[1314171];
    var $168 = $164 >>> 3;
    var $169 = $168 << 1;
    var $171 = ($169 << 2) + 5256704 | 0;
    var $172 = HEAP32[1314166];
    var $173 = 1 << $168;
    do {
      if (($172 & $173 | 0) == 0) {
        HEAP32[1314166] = $172 | $173;
        var $F1_0 = $171;
        var $_pre_phi = ($169 + 2 << 2) + 5256704 | 0;
      } else {
        var $179 = ($169 + 2 << 2) + 5256704 | 0;
        var $180 = HEAP32[$179 >> 2];
        if ($180 >>> 0 >= HEAP32[1314170] >>> 0) {
          var $F1_0 = $180;
          var $_pre_phi = $179;
          break;
        }
        _abort();
      }
    } while (0);
    var $_pre_phi;
    var $F1_0;
    HEAP32[$_pre_phi >> 2] = $167;
    HEAP32[$F1_0 + 12 >> 2] = $167;
    HEAP32[$167 + 8 >> 2] = $F1_0;
    HEAP32[$167 + 12 >> 2] = $171;
  }
  HEAP32[1314168] = $rsize_0;
  HEAP32[1314171] = $51;
  var $191 = $v_0 + 8 | 0;
  var $192 = $191;
  return $192;
}
_tmalloc_small["X"] = 1;
function _tmalloc_large($nb) {
  var $R_1$s2;
  var $112$s2;
  var $t_224$s2;
  var $v_3_lcssa$s2;
  var $t_0$s2;
  var $nb$s2 = $nb >> 2;
  var label = 0;
  var $1 = -$nb | 0;
  var $2 = $nb >>> 8;
  do {
    if (($2 | 0) == 0) {
      var $idx_0 = 0;
    } else {
      if ($nb >>> 0 > 16777215) {
        var $idx_0 = 31;
        break;
      }
      var $9 = ($2 + 1048320 | 0) >>> 16 & 8;
      var $10 = $2 << $9;
      var $13 = ($10 + 520192 | 0) >>> 16 & 4;
      var $15 = $10 << $13;
      var $18 = ($15 + 245760 | 0) >>> 16 & 2;
      var $23 = 14 - ($13 | $9 | $18) + ($15 << $18 >>> 15) | 0;
      var $idx_0 = $nb >>> (($23 + 7 | 0) >>> 0) & 1 | $23 << 1;
    }
  } while (0);
  var $idx_0;
  var $31 = HEAP32[($idx_0 << 2) + 5256968 >> 2];
  var $32 = ($31 | 0) == 0;
  L1918 : do {
    if ($32) {
      var $v_2 = 0;
      var $rsize_2 = $1;
      var $t_1 = 0;
    } else {
      if (($idx_0 | 0) == 31) {
        var $39 = 0;
      } else {
        var $39 = 25 - ($idx_0 >>> 1) | 0;
      }
      var $39;
      var $v_0 = 0;
      var $rsize_0 = $1;
      var $t_0 = $31, $t_0$s2 = $t_0 >> 2;
      var $sizebits_0 = $nb << $39;
      var $rst_0 = 0;
      while (1) {
        var $rst_0;
        var $sizebits_0;
        var $t_0;
        var $rsize_0;
        var $v_0;
        var $44 = HEAP32[$t_0$s2 + 1] & -8;
        var $45 = $44 - $nb | 0;
        if ($45 >>> 0 < $rsize_0 >>> 0) {
          if (($44 | 0) == ($nb | 0)) {
            var $v_2 = $t_0;
            var $rsize_2 = $45;
            var $t_1 = $t_0;
            break L1918;
          } else {
            var $v_1 = $t_0;
            var $rsize_1 = $45;
          }
        } else {
          var $v_1 = $v_0;
          var $rsize_1 = $rsize_0;
        }
        var $rsize_1;
        var $v_1;
        var $51 = HEAP32[$t_0$s2 + 5];
        var $54 = HEAP32[(($sizebits_0 >>> 31 << 2) + 16 >> 2) + $t_0$s2];
        var $rst_1 = ($51 | 0) == 0 | ($51 | 0) == ($54 | 0) ? $rst_0 : $51;
        if (($54 | 0) == 0) {
          var $v_2 = $v_1;
          var $rsize_2 = $rsize_1;
          var $t_1 = $rst_1;
          break L1918;
        } else {
          var $v_0 = $v_1;
          var $rsize_0 = $rsize_1;
          var $t_0 = $54, $t_0$s2 = $t_0 >> 2;
          var $sizebits_0 = $sizebits_0 << 1;
          var $rst_0 = $rst_1;
        }
      }
    }
  } while (0);
  var $t_1;
  var $rsize_2;
  var $v_2;
  do {
    if (($t_1 | 0) == 0 & ($v_2 | 0) == 0) {
      var $62 = 2 << $idx_0;
      var $66 = HEAP32[1314167] & ($62 | -$62);
      if (($66 | 0) == 0) {
        var $_0 = 0;
        var $_0;
        return $_0;
      } else {
        var $71 = ($66 & -$66) - 1 | 0;
        var $73 = $71 >>> 12 & 16;
        var $74 = $71 >>> ($73 >>> 0);
        var $76 = $74 >>> 5 & 8;
        var $78 = $74 >>> ($76 >>> 0);
        var $80 = $78 >>> 2 & 4;
        var $82 = $78 >>> ($80 >>> 0);
        var $84 = $82 >>> 1 & 2;
        var $86 = $82 >>> ($84 >>> 0);
        var $88 = $86 >>> 1 & 1;
        var $t_2_ph = HEAP32[(($76 | $73 | $80 | $84 | $88) + ($86 >>> ($88 >>> 0)) << 2) + 5256968 >> 2];
        break;
      }
    } else {
      var $t_2_ph = $t_1;
    }
  } while (0);
  var $t_2_ph;
  var $94 = ($t_2_ph | 0) == 0;
  L1935 : do {
    if ($94) {
      var $rsize_3_lcssa = $rsize_2;
      var $v_3_lcssa = $v_2, $v_3_lcssa$s2 = $v_3_lcssa >> 2;
    } else {
      var $t_224 = $t_2_ph, $t_224$s2 = $t_224 >> 2;
      var $rsize_325 = $rsize_2;
      var $v_326 = $v_2;
      while (1) {
        var $v_326;
        var $rsize_325;
        var $t_224;
        var $98 = (HEAP32[$t_224$s2 + 1] & -8) - $nb | 0;
        var $99 = $98 >>> 0 < $rsize_325 >>> 0;
        var $_rsize_3 = $99 ? $98 : $rsize_325;
        var $t_2_v_3 = $99 ? $t_224 : $v_326;
        var $101 = HEAP32[$t_224$s2 + 4];
        if (($101 | 0) != 0) {
          var $t_224 = $101, $t_224$s2 = $t_224 >> 2;
          var $rsize_325 = $_rsize_3;
          var $v_326 = $t_2_v_3;
          continue;
        }
        var $104 = HEAP32[$t_224$s2 + 5];
        if (($104 | 0) == 0) {
          var $rsize_3_lcssa = $_rsize_3;
          var $v_3_lcssa = $t_2_v_3, $v_3_lcssa$s2 = $v_3_lcssa >> 2;
          break L1935;
        } else {
          var $t_224 = $104, $t_224$s2 = $t_224 >> 2;
          var $rsize_325 = $_rsize_3;
          var $v_326 = $t_2_v_3;
        }
      }
    }
  } while (0);
  var $v_3_lcssa;
  var $rsize_3_lcssa;
  if (($v_3_lcssa | 0) == 0) {
    var $_0 = 0;
    var $_0;
    return $_0;
  }
  if ($rsize_3_lcssa >>> 0 >= (HEAP32[1314168] - $nb | 0) >>> 0) {
    var $_0 = 0;
    var $_0;
    return $_0;
  }
  var $112 = $v_3_lcssa, $112$s2 = $112 >> 2;
  var $113 = HEAP32[1314170];
  if ($112 >>> 0 < $113 >>> 0) {
    _abort();
  }
  var $116 = $112 + $nb | 0;
  var $117 = $116;
  if ($112 >>> 0 >= $116 >>> 0) {
    _abort();
  }
  var $121 = HEAP32[$v_3_lcssa$s2 + 6];
  var $123 = HEAP32[$v_3_lcssa$s2 + 3];
  var $124 = ($123 | 0) == ($v_3_lcssa | 0);
  L1952 : do {
    if ($124) {
      var $135 = $v_3_lcssa + 20 | 0;
      var $136 = HEAP32[$135 >> 2];
      do {
        if (($136 | 0) == 0) {
          var $139 = $v_3_lcssa + 16 | 0;
          var $140 = HEAP32[$139 >> 2];
          if (($140 | 0) == 0) {
            var $R_1 = 0, $R_1$s2 = $R_1 >> 2;
            break L1952;
          } else {
            var $R_0 = $140;
            var $RP_0 = $139;
            break;
          }
        } else {
          var $R_0 = $136;
          var $RP_0 = $135;
        }
      } while (0);
      while (1) {
        var $RP_0;
        var $R_0;
        var $142 = $R_0 + 20 | 0;
        var $143 = HEAP32[$142 >> 2];
        if (($143 | 0) != 0) {
          var $R_0 = $143;
          var $RP_0 = $142;
          continue;
        }
        var $146 = $R_0 + 16 | 0;
        var $147 = HEAP32[$146 >> 2];
        if (($147 | 0) == 0) {
          break;
        } else {
          var $R_0 = $147;
          var $RP_0 = $146;
        }
      }
      if ($RP_0 >>> 0 < $113 >>> 0) {
        _abort();
      } else {
        HEAP32[$RP_0 >> 2] = 0;
        var $R_1 = $R_0, $R_1$s2 = $R_1 >> 2;
        break;
      }
    } else {
      var $127 = HEAP32[$v_3_lcssa$s2 + 2];
      if ($127 >>> 0 < $113 >>> 0) {
        _abort();
      } else {
        HEAP32[$127 + 12 >> 2] = $123;
        HEAP32[$123 + 8 >> 2] = $127;
        var $R_1 = $123, $R_1$s2 = $R_1 >> 2;
        break;
      }
    }
  } while (0);
  var $R_1;
  var $155 = ($121 | 0) == 0;
  L1968 : do {
    if ($155) {
      var $v_3_lcssa1 = $v_3_lcssa;
    } else {
      var $157 = $v_3_lcssa + 28 | 0;
      var $159 = (HEAP32[$157 >> 2] << 2) + 5256968 | 0;
      do {
        if (($v_3_lcssa | 0) == (HEAP32[$159 >> 2] | 0)) {
          HEAP32[$159 >> 2] = $R_1;
          if (($R_1 | 0) != 0) {
            break;
          }
          HEAP32[1314167] = HEAP32[1314167] & (1 << HEAP32[$157 >> 2] ^ -1);
          var $v_3_lcssa1 = $v_3_lcssa;
          break L1968;
        } else {
          if ($121 >>> 0 < HEAP32[1314170] >>> 0) {
            _abort();
          }
          var $173 = $121 + 16 | 0;
          if ((HEAP32[$173 >> 2] | 0) == ($v_3_lcssa | 0)) {
            HEAP32[$173 >> 2] = $R_1;
          } else {
            HEAP32[$121 + 20 >> 2] = $R_1;
          }
          if (($R_1 | 0) == 0) {
            var $v_3_lcssa1 = $v_3_lcssa;
            break L1968;
          }
        }
      } while (0);
      if ($R_1 >>> 0 < HEAP32[1314170] >>> 0) {
        _abort();
      }
      HEAP32[$R_1$s2 + 6] = $121;
      var $189 = HEAP32[$v_3_lcssa$s2 + 4];
      do {
        if (($189 | 0) != 0) {
          if ($189 >>> 0 < HEAP32[1314170] >>> 0) {
            _abort();
          } else {
            HEAP32[$R_1$s2 + 4] = $189;
            HEAP32[$189 + 24 >> 2] = $R_1;
            break;
          }
        }
      } while (0);
      var $201 = HEAP32[$v_3_lcssa$s2 + 5];
      if (($201 | 0) == 0) {
        var $v_3_lcssa1 = $v_3_lcssa;
        break;
      }
      if ($201 >>> 0 < HEAP32[1314170] >>> 0) {
        _abort();
      } else {
        HEAP32[$R_1$s2 + 5] = $201;
        HEAP32[$201 + 24 >> 2] = $R_1;
        var $v_3_lcssa1 = $v_3_lcssa;
        break;
      }
    }
  } while (0);
  var $v_3_lcssa1;
  do {
    if ($rsize_3_lcssa >>> 0 < 16) {
      var $215 = $rsize_3_lcssa + $nb | 0;
      HEAP32[$v_3_lcssa1 + 4 >> 2] = $215 | 3;
      var $219 = $215 + ($112 + 4) | 0;
      HEAP32[$219 >> 2] = HEAP32[$219 >> 2] | 1;
    } else {
      HEAP32[$v_3_lcssa1 + 4 >> 2] = $nb | 3;
      HEAP32[$nb$s2 + ($112$s2 + 1)] = $rsize_3_lcssa | 1;
      HEAP32[($rsize_3_lcssa >> 2) + $112$s2 + $nb$s2] = $rsize_3_lcssa;
      var $230 = $rsize_3_lcssa >>> 3;
      if ($rsize_3_lcssa >>> 0 < 256) {
        var $233 = $230 << 1;
        var $235 = ($233 << 2) + 5256704 | 0;
        var $236 = HEAP32[1314166];
        var $237 = 1 << $230;
        do {
          if (($236 & $237 | 0) == 0) {
            HEAP32[1314166] = $236 | $237;
            var $F5_0 = $235;
            var $_pre_phi = ($233 + 2 << 2) + 5256704 | 0;
          } else {
            var $243 = ($233 + 2 << 2) + 5256704 | 0;
            var $244 = HEAP32[$243 >> 2];
            if ($244 >>> 0 >= HEAP32[1314170] >>> 0) {
              var $F5_0 = $244;
              var $_pre_phi = $243;
              break;
            }
            _abort();
          }
        } while (0);
        var $_pre_phi;
        var $F5_0;
        HEAP32[$_pre_phi >> 2] = $117;
        HEAP32[$F5_0 + 12 >> 2] = $117;
        HEAP32[$nb$s2 + ($112$s2 + 2)] = $F5_0;
        HEAP32[$nb$s2 + ($112$s2 + 3)] = $235;
        break;
      }
      var $256 = $116;
      var $257 = $rsize_3_lcssa >>> 8;
      do {
        if (($257 | 0) == 0) {
          var $I7_0 = 0;
        } else {
          if ($rsize_3_lcssa >>> 0 > 16777215) {
            var $I7_0 = 31;
            break;
          }
          var $264 = ($257 + 1048320 | 0) >>> 16 & 8;
          var $265 = $257 << $264;
          var $268 = ($265 + 520192 | 0) >>> 16 & 4;
          var $270 = $265 << $268;
          var $273 = ($270 + 245760 | 0) >>> 16 & 2;
          var $278 = 14 - ($268 | $264 | $273) + ($270 << $273 >>> 15) | 0;
          var $I7_0 = $rsize_3_lcssa >>> (($278 + 7 | 0) >>> 0) & 1 | $278 << 1;
        }
      } while (0);
      var $I7_0;
      var $285 = ($I7_0 << 2) + 5256968 | 0;
      HEAP32[$nb$s2 + ($112$s2 + 7)] = $I7_0;
      HEAP32[$nb$s2 + ($112$s2 + 5)] = 0;
      HEAP32[$nb$s2 + ($112$s2 + 4)] = 0;
      var $292 = HEAP32[1314167];
      var $293 = 1 << $I7_0;
      if (($292 & $293 | 0) == 0) {
        HEAP32[1314167] = $292 | $293;
        HEAP32[$285 >> 2] = $256;
        HEAP32[$nb$s2 + ($112$s2 + 6)] = $285;
        HEAP32[$nb$s2 + ($112$s2 + 3)] = $256;
        HEAP32[$nb$s2 + ($112$s2 + 2)] = $256;
        break;
      }
      if (($I7_0 | 0) == 31) {
        var $312 = 0;
      } else {
        var $312 = 25 - ($I7_0 >>> 1) | 0;
      }
      var $312;
      var $K12_0 = $rsize_3_lcssa << $312;
      var $T_0 = HEAP32[$285 >> 2];
      while (1) {
        var $T_0;
        var $K12_0;
        if ((HEAP32[$T_0 + 4 >> 2] & -8 | 0) == ($rsize_3_lcssa | 0)) {
          break;
        }
        var $321 = ($K12_0 >>> 31 << 2) + $T_0 + 16 | 0;
        var $322 = HEAP32[$321 >> 2];
        if (($322 | 0) == 0) {
          label = 1489;
          break;
        } else {
          var $K12_0 = $K12_0 << 1;
          var $T_0 = $322;
        }
      }
      if (label == 1489) {
        if ($321 >>> 0 < HEAP32[1314170] >>> 0) {
          _abort();
        } else {
          HEAP32[$321 >> 2] = $256;
          HEAP32[$nb$s2 + ($112$s2 + 6)] = $T_0;
          HEAP32[$nb$s2 + ($112$s2 + 3)] = $256;
          HEAP32[$nb$s2 + ($112$s2 + 2)] = $256;
          break;
        }
      }
      var $338 = $T_0 + 8 | 0;
      var $339 = HEAP32[$338 >> 2];
      var $341 = HEAP32[1314170];
      if ($T_0 >>> 0 < $341 >>> 0) {
        _abort();
      }
      if ($339 >>> 0 < $341 >>> 0) {
        _abort();
      } else {
        HEAP32[$339 + 12 >> 2] = $256;
        HEAP32[$338 >> 2] = $256;
        HEAP32[$nb$s2 + ($112$s2 + 2)] = $339;
        HEAP32[$nb$s2 + ($112$s2 + 3)] = $T_0;
        HEAP32[$nb$s2 + ($112$s2 + 6)] = 0;
        break;
      }
    }
  } while (0);
  var $_0 = $v_3_lcssa1 + 8 | 0;
  var $_0;
  return $_0;
}
_tmalloc_large["X"] = 1;
function _sys_alloc($nb) {
  var $sp_042$s2;
  var label = 0;
  if ((HEAP32[1311053] | 0) == 0) {
    _init_mparams();
  }
  var $7 = (HEAP32[1314276] & 4 | 0) == 0;
  L2038 : do {
    if ($7) {
      var $9 = HEAP32[1314172];
      do {
        if (($9 | 0) == 0) {
          label = 1512;
        } else {
          var $13 = _segment_holding($9);
          if (($13 | 0) == 0) {
            label = 1512;
            break;
          }
          var $41 = HEAP32[1311055];
          var $46 = $nb + 47 - HEAP32[1314169] + $41 & -$41;
          if ($46 >>> 0 >= 2147483647) {
            var $tsize_0121720_ph = 0;
            break;
          }
          var $49 = _sbrk($46);
          var $55 = ($49 | 0) == (HEAP32[$13 >> 2] + HEAP32[$13 + 4 >> 2] | 0);
          var $tbase_0 = $55 ? $49 : -1;
          var $tsize_0 = $55 ? $46 : 0;
          var $br_0 = $49;
          var $asize_1 = $46;
          label = 1519;
          break;
        }
      } while (0);
      do {
        if (label == 1512) {
          var $15 = _sbrk(0);
          if (($15 | 0) == -1) {
            var $tsize_0121720_ph = 0;
            break;
          }
          var $18 = HEAP32[1311055];
          var $22 = $18 + ($nb + 47) & -$18;
          var $23 = $15;
          var $24 = HEAP32[1311054];
          var $25 = $24 - 1 | 0;
          if (($25 & $23 | 0) == 0) {
            var $asize_0 = $22;
          } else {
            var $asize_0 = $22 - $23 + ($25 + $23 & -$24) | 0;
          }
          var $asize_0;
          if ($asize_0 >>> 0 >= 2147483647) {
            var $tsize_0121720_ph = 0;
            break;
          }
          var $37 = _sbrk($asize_0);
          var $38 = ($37 | 0) == ($15 | 0);
          var $tbase_0 = $38 ? $15 : -1;
          var $tsize_0 = $38 ? $asize_0 : 0;
          var $br_0 = $37;
          var $asize_1 = $asize_0;
          label = 1519;
          break;
        }
      } while (0);
      L2051 : do {
        if (label == 1519) {
          var $asize_1;
          var $br_0;
          var $tsize_0;
          var $tbase_0;
          var $57 = -$asize_1 | 0;
          if (($tbase_0 | 0) != -1) {
            var $tsize_229 = $tsize_0;
            var $tbase_230 = $tbase_0;
            label = 1532;
            break L2038;
          }
          do {
            if (($br_0 | 0) != -1 & $asize_1 >>> 0 < 2147483647) {
              if ($asize_1 >>> 0 >= ($nb + 48 | 0) >>> 0) {
                var $asize_2 = $asize_1;
                break;
              }
              var $66 = HEAP32[1311055];
              var $71 = $nb + 47 - $asize_1 + $66 & -$66;
              if ($71 >>> 0 >= 2147483647) {
                var $asize_2 = $asize_1;
                break;
              }
              if ((_sbrk($71) | 0) == -1) {
                _sbrk($57);
                var $tsize_0121720_ph = $tsize_0;
                break L2051;
              } else {
                var $asize_2 = $71 + $asize_1 | 0;
                break;
              }
            } else {
              var $asize_2 = $asize_1;
            }
          } while (0);
          var $asize_2;
          if (($br_0 | 0) != -1) {
            var $tsize_229 = $asize_2;
            var $tbase_230 = $br_0;
            label = 1532;
            break L2038;
          }
          HEAP32[1314276] = HEAP32[1314276] | 4;
          var $tsize_125 = $tsize_0;
          label = 1529;
          break L2038;
        }
      } while (0);
      var $tsize_0121720_ph;
      HEAP32[1314276] = HEAP32[1314276] | 4;
      var $tsize_125 = $tsize_0121720_ph;
      label = 1529;
      break;
    } else {
      var $tsize_125 = 0;
      label = 1529;
    }
  } while (0);
  do {
    if (label == 1529) {
      var $tsize_125;
      var $86 = HEAP32[1311055];
      var $90 = $86 + ($nb + 47) & -$86;
      if ($90 >>> 0 >= 2147483647) {
        break;
      }
      var $93 = _sbrk($90);
      var $94 = _sbrk(0);
      if (!(($94 | 0) != -1 & ($93 | 0) != -1 & $93 >>> 0 < $94 >>> 0)) {
        break;
      }
      var $98 = $94 - $93 | 0;
      var $100 = $98 >>> 0 > ($nb + 40 | 0) >>> 0;
      var $_tbase_1 = $100 ? $93 : -1;
      if (($_tbase_1 | 0) == -1) {
        break;
      } else {
        var $tsize_229 = $100 ? $98 : $tsize_125;
        var $tbase_230 = $_tbase_1;
        label = 1532;
        break;
      }
    }
  } while (0);
  do {
    if (label == 1532) {
      var $tbase_230;
      var $tsize_229;
      var $103 = HEAP32[1314274] + $tsize_229 | 0;
      HEAP32[1314274] = $103;
      if ($103 >>> 0 > HEAP32[1314275] >>> 0) {
        HEAP32[1314275] = $103;
      }
      var $108 = HEAP32[1314172];
      var $109 = ($108 | 0) == 0;
      L2073 : do {
        if ($109) {
          var $111 = HEAP32[1314170];
          if (($111 | 0) == 0 | $tbase_230 >>> 0 < $111 >>> 0) {
            HEAP32[1314170] = $tbase_230;
          }
          HEAP32[1314277] = $tbase_230;
          HEAP32[1314278] = $tsize_229;
          HEAP32[1314280] = 0;
          HEAP32[1314175] = HEAP32[1311053];
          HEAP32[1314174] = -1;
          _init_bins();
          _init_top($tbase_230, $tsize_229 - 40 | 0);
        } else {
          var $sp_042 = 5257108 | 0, $sp_042$s2 = $sp_042 >> 2;
          while (1) {
            var $sp_042;
            var $120 = HEAP32[$sp_042$s2];
            var $121 = $sp_042 + 4 | 0;
            var $122 = HEAP32[$121 >> 2];
            if (($tbase_230 | 0) == ($120 + $122 | 0)) {
              label = 1540;
              break;
            }
            var $127 = HEAP32[$sp_042$s2 + 2];
            if (($127 | 0) == 0) {
              break;
            } else {
              var $sp_042 = $127, $sp_042$s2 = $sp_042 >> 2;
            }
          }
          do {
            if (label == 1540) {
              if ((HEAP32[$sp_042$s2 + 3] & 8 | 0) != 0) {
                break;
              }
              var $134 = $108;
              if (!($134 >>> 0 >= $120 >>> 0 & $134 >>> 0 < $tbase_230 >>> 0)) {
                break;
              }
              HEAP32[$121 >> 2] = $122 + $tsize_229 | 0;
              _init_top(HEAP32[1314172], HEAP32[1314169] + $tsize_229 | 0);
              break L2073;
            }
          } while (0);
          if ($tbase_230 >>> 0 < HEAP32[1314170] >>> 0) {
            HEAP32[1314170] = $tbase_230;
          }
          var $145 = $tbase_230 + $tsize_229 | 0;
          var $sp_135 = 5257108 | 0;
          while (1) {
            var $sp_135;
            var $147 = $sp_135 | 0;
            if ((HEAP32[$147 >> 2] | 0) == ($145 | 0)) {
              label = 1548;
              break;
            }
            var $152 = HEAP32[$sp_135 + 8 >> 2];
            if (($152 | 0) == 0) {
              break;
            } else {
              var $sp_135 = $152;
            }
          }
          do {
            if (label == 1548) {
              if ((HEAP32[$sp_135 + 12 >> 2] & 8 | 0) != 0) {
                break;
              }
              HEAP32[$147 >> 2] = $tbase_230;
              var $159 = $sp_135 + 4 | 0;
              HEAP32[$159 >> 2] = HEAP32[$159 >> 2] + $tsize_229 | 0;
              var $_0 = _prepend_alloc($tbase_230, $145, $nb);
              var $_0;
              return $_0;
            }
          } while (0);
          _add_segment($tbase_230, $tsize_229);
        }
      } while (0);
      var $164 = HEAP32[1314169];
      if ($164 >>> 0 <= $nb >>> 0) {
        break;
      }
      var $167 = $164 - $nb | 0;
      HEAP32[1314169] = $167;
      var $168 = HEAP32[1314172];
      var $169 = $168;
      HEAP32[1314172] = $169 + $nb | 0;
      HEAP32[$nb + ($169 + 4) >> 2] = $167 | 1;
      HEAP32[$168 + 4 >> 2] = $nb | 3;
      var $_0 = $168 + 8 | 0;
      var $_0;
      return $_0;
    }
  } while (0);
  HEAP32[___errno() >> 2] = 12;
  var $_0 = 0;
  var $_0;
  return $_0;
}
_sys_alloc["X"] = 1;
function _release_unused_segments() {
  var $sp_0_in = 5257116 | 0;
  while (1) {
    var $sp_0_in;
    var $sp_0 = HEAP32[$sp_0_in >> 2];
    if (($sp_0 | 0) == 0) {
      break;
    } else {
      var $sp_0_in = $sp_0 + 8 | 0;
    }
  }
  HEAP32[1314174] = -1;
  return;
}
function _sys_trim() {
  var $27$s2;
  if ((HEAP32[1311053] | 0) == 0) {
    _init_mparams();
  }
  var $5 = HEAP32[1314172];
  if (($5 | 0) == 0) {
    return;
  }
  var $8 = HEAP32[1314169];
  do {
    if ($8 >>> 0 > 40) {
      var $11 = HEAP32[1311055];
      var $16 = (Math.floor((($8 - 41 + $11 | 0) >>> 0) / ($11 >>> 0)) - 1) * $11 | 0;
      var $18 = _segment_holding($5);
      if ((HEAP32[$18 + 12 >> 2] & 8 | 0) != 0) {
        break;
      }
      var $24 = _sbrk(0);
      var $27$s2 = ($18 + 4 | 0) >> 2;
      if (($24 | 0) != (HEAP32[$18 >> 2] + HEAP32[$27$s2] | 0)) {
        break;
      }
      var $35 = _sbrk(-($16 >>> 0 > 2147483646 ? -2147483648 - $11 | 0 : $16) | 0);
      var $36 = _sbrk(0);
      if (!(($35 | 0) != -1 & $36 >>> 0 < $24 >>> 0)) {
        break;
      }
      var $42 = $24 - $36 | 0;
      if (($24 | 0) == ($36 | 0)) {
        break;
      }
      HEAP32[$27$s2] = HEAP32[$27$s2] - $42 | 0;
      HEAP32[1314274] = HEAP32[1314274] - $42 | 0;
      _init_top(HEAP32[1314172], HEAP32[1314169] - $42 | 0);
      return;
    }
  } while (0);
  if (HEAP32[1314169] >>> 0 <= HEAP32[1314173] >>> 0) {
    return;
  }
  HEAP32[1314173] = -1;
  return;
}
_sys_trim["X"] = 1;
function _free($mem) {
  var $R7_1$s2;
  var $176$s2;
  var $R_1$s2;
  var $p_0$s2;
  var $164$s2;
  var $_sum216$s2;
  var $14$s2;
  var $mem$s2 = $mem >> 2;
  var label = 0;
  if (($mem | 0) == 0) {
    return;
  }
  var $3 = $mem - 8 | 0;
  var $4 = $3;
  var $5 = HEAP32[1314170];
  if ($3 >>> 0 < $5 >>> 0) {
    _abort();
  }
  var $10 = HEAP32[$mem - 4 >> 2];
  var $11 = $10 & 3;
  if (($11 | 0) == 1) {
    _abort();
  }
  var $14 = $10 & -8, $14$s2 = $14 >> 2;
  var $15 = $mem + ($14 - 8) | 0;
  var $16 = $15;
  var $18 = ($10 & 1 | 0) == 0;
  L2135 : do {
    if ($18) {
      var $21 = HEAP32[$3 >> 2];
      if (($11 | 0) == 0) {
        return;
      }
      var $_sum216 = -8 - $21 | 0, $_sum216$s2 = $_sum216 >> 2;
      var $24 = $mem + $_sum216 | 0;
      var $25 = $24;
      var $26 = $21 + $14 | 0;
      if ($24 >>> 0 < $5 >>> 0) {
        _abort();
      }
      if (($25 | 0) == (HEAP32[1314171] | 0)) {
        var $164$s2 = ($mem + ($14 - 4) | 0) >> 2;
        if ((HEAP32[$164$s2] & 3 | 0) != 3) {
          var $p_0 = $25, $p_0$s2 = $p_0 >> 2;
          var $psize_0 = $26;
          break;
        }
        HEAP32[1314168] = $26;
        HEAP32[$164$s2] = HEAP32[$164$s2] & -2;
        HEAP32[$_sum216$s2 + ($mem$s2 + 1)] = $26 | 1;
        HEAP32[$15 >> 2] = $26;
        return;
      }
      var $32 = $21 >>> 3;
      if ($21 >>> 0 < 256) {
        var $37 = HEAP32[$_sum216$s2 + ($mem$s2 + 2)];
        var $40 = HEAP32[$_sum216$s2 + ($mem$s2 + 3)];
        if (($37 | 0) == ($40 | 0)) {
          HEAP32[1314166] = HEAP32[1314166] & (1 << $32 ^ -1);
          var $p_0 = $25, $p_0$s2 = $p_0 >> 2;
          var $psize_0 = $26;
          break;
        }
        var $50 = ($32 << 3) + 5256704 | 0;
        if (($37 | 0) != ($50 | 0) & $37 >>> 0 < $5 >>> 0) {
          _abort();
        }
        if (($40 | 0) == ($50 | 0) | $40 >>> 0 >= $5 >>> 0) {
          HEAP32[$37 + 12 >> 2] = $40;
          HEAP32[$40 + 8 >> 2] = $37;
          var $p_0 = $25, $p_0$s2 = $p_0 >> 2;
          var $psize_0 = $26;
          break;
        } else {
          _abort();
        }
      }
      var $61 = $24;
      var $64 = HEAP32[$_sum216$s2 + ($mem$s2 + 6)];
      var $67 = HEAP32[$_sum216$s2 + ($mem$s2 + 3)];
      var $68 = ($67 | 0) == ($61 | 0);
      L2160 : do {
        if ($68) {
          var $81 = $_sum216 + ($mem + 20) | 0;
          var $82 = HEAP32[$81 >> 2];
          do {
            if (($82 | 0) == 0) {
              var $86 = $_sum216 + ($mem + 16) | 0;
              var $87 = HEAP32[$86 >> 2];
              if (($87 | 0) == 0) {
                var $R_1 = 0, $R_1$s2 = $R_1 >> 2;
                break L2160;
              } else {
                var $R_0 = $87;
                var $RP_0 = $86;
                break;
              }
            } else {
              var $R_0 = $82;
              var $RP_0 = $81;
            }
          } while (0);
          while (1) {
            var $RP_0;
            var $R_0;
            var $89 = $R_0 + 20 | 0;
            var $90 = HEAP32[$89 >> 2];
            if (($90 | 0) != 0) {
              var $R_0 = $90;
              var $RP_0 = $89;
              continue;
            }
            var $93 = $R_0 + 16 | 0;
            var $94 = HEAP32[$93 >> 2];
            if (($94 | 0) == 0) {
              break;
            } else {
              var $R_0 = $94;
              var $RP_0 = $93;
            }
          }
          if ($RP_0 >>> 0 < $5 >>> 0) {
            _abort();
          } else {
            HEAP32[$RP_0 >> 2] = 0;
            var $R_1 = $R_0, $R_1$s2 = $R_1 >> 2;
            break;
          }
        } else {
          var $72 = HEAP32[$_sum216$s2 + ($mem$s2 + 2)];
          if ($72 >>> 0 < $5 >>> 0) {
            _abort();
          } else {
            HEAP32[$72 + 12 >> 2] = $67;
            HEAP32[$67 + 8 >> 2] = $72;
            var $R_1 = $67, $R_1$s2 = $R_1 >> 2;
            break;
          }
        }
      } while (0);
      var $R_1;
      if (($64 | 0) == 0) {
        var $p_0 = $25, $p_0$s2 = $p_0 >> 2;
        var $psize_0 = $26;
        break;
      }
      var $105 = $_sum216 + ($mem + 28) | 0;
      var $107 = (HEAP32[$105 >> 2] << 2) + 5256968 | 0;
      do {
        if (($61 | 0) == (HEAP32[$107 >> 2] | 0)) {
          HEAP32[$107 >> 2] = $R_1;
          if (($R_1 | 0) != 0) {
            break;
          }
          HEAP32[1314167] = HEAP32[1314167] & (1 << HEAP32[$105 >> 2] ^ -1);
          var $p_0 = $25, $p_0$s2 = $p_0 >> 2;
          var $psize_0 = $26;
          break L2135;
        } else {
          if ($64 >>> 0 < HEAP32[1314170] >>> 0) {
            _abort();
          }
          var $121 = $64 + 16 | 0;
          if ((HEAP32[$121 >> 2] | 0) == ($61 | 0)) {
            HEAP32[$121 >> 2] = $R_1;
          } else {
            HEAP32[$64 + 20 >> 2] = $R_1;
          }
          if (($R_1 | 0) == 0) {
            var $p_0 = $25, $p_0$s2 = $p_0 >> 2;
            var $psize_0 = $26;
            break L2135;
          }
        }
      } while (0);
      if ($R_1 >>> 0 < HEAP32[1314170] >>> 0) {
        _abort();
      }
      HEAP32[$R_1$s2 + 6] = $64;
      var $138 = HEAP32[$_sum216$s2 + ($mem$s2 + 4)];
      do {
        if (($138 | 0) != 0) {
          if ($138 >>> 0 < HEAP32[1314170] >>> 0) {
            _abort();
          } else {
            HEAP32[$R_1$s2 + 4] = $138;
            HEAP32[$138 + 24 >> 2] = $R_1;
            break;
          }
        }
      } while (0);
      var $151 = HEAP32[$_sum216$s2 + ($mem$s2 + 5)];
      if (($151 | 0) == 0) {
        var $p_0 = $25, $p_0$s2 = $p_0 >> 2;
        var $psize_0 = $26;
        break;
      }
      if ($151 >>> 0 < HEAP32[1314170] >>> 0) {
        _abort();
      } else {
        HEAP32[$R_1$s2 + 5] = $151;
        HEAP32[$151 + 24 >> 2] = $R_1;
        var $p_0 = $25, $p_0$s2 = $p_0 >> 2;
        var $psize_0 = $26;
        break;
      }
    } else {
      var $p_0 = $4, $p_0$s2 = $p_0 >> 2;
      var $psize_0 = $14;
    }
  } while (0);
  var $psize_0;
  var $p_0;
  var $176 = $p_0, $176$s2 = $176 >> 2;
  if ($176 >>> 0 >= $15 >>> 0) {
    _abort();
  }
  var $180 = $mem + ($14 - 4) | 0;
  var $181 = HEAP32[$180 >> 2];
  if (($181 & 1 | 0) == 0) {
    _abort();
  }
  do {
    if (($181 & 2 | 0) == 0) {
      if (($16 | 0) == (HEAP32[1314172] | 0)) {
        var $192 = HEAP32[1314169] + $psize_0 | 0;
        HEAP32[1314169] = $192;
        HEAP32[1314172] = $p_0;
        HEAP32[$p_0$s2 + 1] = $192 | 1;
        if (($p_0 | 0) == (HEAP32[1314171] | 0)) {
          HEAP32[1314171] = 0;
          HEAP32[1314168] = 0;
        }
        if ($192 >>> 0 <= HEAP32[1314173] >>> 0) {
          return;
        }
        _sys_trim();
        return;
      }
      if (($16 | 0) == (HEAP32[1314171] | 0)) {
        var $207 = HEAP32[1314168] + $psize_0 | 0;
        HEAP32[1314168] = $207;
        HEAP32[1314171] = $p_0;
        HEAP32[$p_0$s2 + 1] = $207 | 1;
        HEAP32[($207 >> 2) + $176$s2] = $207;
        return;
      }
      var $214 = ($181 & -8) + $psize_0 | 0;
      var $215 = $181 >>> 3;
      var $216 = $181 >>> 0 < 256;
      L2225 : do {
        if ($216) {
          var $220 = HEAP32[$mem$s2 + $14$s2];
          var $223 = HEAP32[(($14 | 4) >> 2) + $mem$s2];
          if (($220 | 0) == ($223 | 0)) {
            HEAP32[1314166] = HEAP32[1314166] & (1 << $215 ^ -1);
            break;
          }
          var $233 = ($215 << 3) + 5256704 | 0;
          do {
            if (($220 | 0) != ($233 | 0)) {
              if ($220 >>> 0 >= HEAP32[1314170] >>> 0) {
                break;
              }
              _abort();
            }
          } while (0);
          do {
            if (($223 | 0) != ($233 | 0)) {
              if ($223 >>> 0 >= HEAP32[1314170] >>> 0) {
                break;
              }
              _abort();
            }
          } while (0);
          HEAP32[$220 + 12 >> 2] = $223;
          HEAP32[$223 + 8 >> 2] = $220;
        } else {
          var $248 = $15;
          var $251 = HEAP32[$14$s2 + ($mem$s2 + 4)];
          var $254 = HEAP32[(($14 | 4) >> 2) + $mem$s2];
          var $255 = ($254 | 0) == ($248 | 0);
          L2239 : do {
            if ($255) {
              var $269 = $14 + ($mem + 12) | 0;
              var $270 = HEAP32[$269 >> 2];
              do {
                if (($270 | 0) == 0) {
                  var $274 = $14 + ($mem + 8) | 0;
                  var $275 = HEAP32[$274 >> 2];
                  if (($275 | 0) == 0) {
                    var $R7_1 = 0, $R7_1$s2 = $R7_1 >> 2;
                    break L2239;
                  } else {
                    var $R7_0 = $275;
                    var $RP9_0 = $274;
                    break;
                  }
                } else {
                  var $R7_0 = $270;
                  var $RP9_0 = $269;
                }
              } while (0);
              while (1) {
                var $RP9_0;
                var $R7_0;
                var $277 = $R7_0 + 20 | 0;
                var $278 = HEAP32[$277 >> 2];
                if (($278 | 0) != 0) {
                  var $R7_0 = $278;
                  var $RP9_0 = $277;
                  continue;
                }
                var $281 = $R7_0 + 16 | 0;
                var $282 = HEAP32[$281 >> 2];
                if (($282 | 0) == 0) {
                  break;
                } else {
                  var $R7_0 = $282;
                  var $RP9_0 = $281;
                }
              }
              if ($RP9_0 >>> 0 < HEAP32[1314170] >>> 0) {
                _abort();
              } else {
                HEAP32[$RP9_0 >> 2] = 0;
                var $R7_1 = $R7_0, $R7_1$s2 = $R7_1 >> 2;
                break;
              }
            } else {
              var $259 = HEAP32[$mem$s2 + $14$s2];
              if ($259 >>> 0 < HEAP32[1314170] >>> 0) {
                _abort();
              } else {
                HEAP32[$259 + 12 >> 2] = $254;
                HEAP32[$254 + 8 >> 2] = $259;
                var $R7_1 = $254, $R7_1$s2 = $R7_1 >> 2;
                break;
              }
            }
          } while (0);
          var $R7_1;
          if (($251 | 0) == 0) {
            break;
          }
          var $294 = $14 + ($mem + 20) | 0;
          var $296 = (HEAP32[$294 >> 2] << 2) + 5256968 | 0;
          do {
            if (($248 | 0) == (HEAP32[$296 >> 2] | 0)) {
              HEAP32[$296 >> 2] = $R7_1;
              if (($R7_1 | 0) != 0) {
                break;
              }
              HEAP32[1314167] = HEAP32[1314167] & (1 << HEAP32[$294 >> 2] ^ -1);
              break L2225;
            } else {
              if ($251 >>> 0 < HEAP32[1314170] >>> 0) {
                _abort();
              }
              var $310 = $251 + 16 | 0;
              if ((HEAP32[$310 >> 2] | 0) == ($248 | 0)) {
                HEAP32[$310 >> 2] = $R7_1;
              } else {
                HEAP32[$251 + 20 >> 2] = $R7_1;
              }
              if (($R7_1 | 0) == 0) {
                break L2225;
              }
            }
          } while (0);
          if ($R7_1 >>> 0 < HEAP32[1314170] >>> 0) {
            _abort();
          }
          HEAP32[$R7_1$s2 + 6] = $251;
          var $327 = HEAP32[$14$s2 + ($mem$s2 + 2)];
          do {
            if (($327 | 0) != 0) {
              if ($327 >>> 0 < HEAP32[1314170] >>> 0) {
                _abort();
              } else {
                HEAP32[$R7_1$s2 + 4] = $327;
                HEAP32[$327 + 24 >> 2] = $R7_1;
                break;
              }
            }
          } while (0);
          var $340 = HEAP32[$14$s2 + ($mem$s2 + 3)];
          if (($340 | 0) == 0) {
            break;
          }
          if ($340 >>> 0 < HEAP32[1314170] >>> 0) {
            _abort();
          } else {
            HEAP32[$R7_1$s2 + 5] = $340;
            HEAP32[$340 + 24 >> 2] = $R7_1;
            break;
          }
        }
      } while (0);
      HEAP32[$p_0$s2 + 1] = $214 | 1;
      HEAP32[($214 >> 2) + $176$s2] = $214;
      if (($p_0 | 0) != (HEAP32[1314171] | 0)) {
        var $psize_1 = $214;
        break;
      }
      HEAP32[1314168] = $214;
      return;
    } else {
      HEAP32[$180 >> 2] = $181 & -2;
      HEAP32[$p_0$s2 + 1] = $psize_0 | 1;
      HEAP32[($psize_0 >> 2) + $176$s2] = $psize_0;
      var $psize_1 = $psize_0;
    }
  } while (0);
  var $psize_1;
  var $366 = $psize_1 >>> 3;
  if ($psize_1 >>> 0 < 256) {
    var $369 = $366 << 1;
    var $371 = ($369 << 2) + 5256704 | 0;
    var $372 = HEAP32[1314166];
    var $373 = 1 << $366;
    do {
      if (($372 & $373 | 0) == 0) {
        HEAP32[1314166] = $372 | $373;
        var $F16_0 = $371;
        var $_pre_phi = ($369 + 2 << 2) + 5256704 | 0;
      } else {
        var $379 = ($369 + 2 << 2) + 5256704 | 0;
        var $380 = HEAP32[$379 >> 2];
        if ($380 >>> 0 >= HEAP32[1314170] >>> 0) {
          var $F16_0 = $380;
          var $_pre_phi = $379;
          break;
        }
        _abort();
      }
    } while (0);
    var $_pre_phi;
    var $F16_0;
    HEAP32[$_pre_phi >> 2] = $p_0;
    HEAP32[$F16_0 + 12 >> 2] = $p_0;
    HEAP32[$p_0$s2 + 2] = $F16_0;
    HEAP32[$p_0$s2 + 3] = $371;
    return;
  }
  var $390 = $p_0;
  var $391 = $psize_1 >>> 8;
  do {
    if (($391 | 0) == 0) {
      var $I18_0 = 0;
    } else {
      if ($psize_1 >>> 0 > 16777215) {
        var $I18_0 = 31;
        break;
      }
      var $398 = ($391 + 1048320 | 0) >>> 16 & 8;
      var $399 = $391 << $398;
      var $402 = ($399 + 520192 | 0) >>> 16 & 4;
      var $404 = $399 << $402;
      var $407 = ($404 + 245760 | 0) >>> 16 & 2;
      var $412 = 14 - ($402 | $398 | $407) + ($404 << $407 >>> 15) | 0;
      var $I18_0 = $psize_1 >>> (($412 + 7 | 0) >>> 0) & 1 | $412 << 1;
    }
  } while (0);
  var $I18_0;
  var $419 = ($I18_0 << 2) + 5256968 | 0;
  HEAP32[$p_0$s2 + 7] = $I18_0;
  HEAP32[$p_0$s2 + 5] = 0;
  HEAP32[$p_0$s2 + 4] = 0;
  var $423 = HEAP32[1314167];
  var $424 = 1 << $I18_0;
  do {
    if (($423 & $424 | 0) == 0) {
      HEAP32[1314167] = $423 | $424;
      HEAP32[$419 >> 2] = $390;
      HEAP32[$p_0$s2 + 6] = $419;
      HEAP32[$p_0$s2 + 3] = $p_0;
      HEAP32[$p_0$s2 + 2] = $p_0;
    } else {
      if (($I18_0 | 0) == 31) {
        var $439 = 0;
      } else {
        var $439 = 25 - ($I18_0 >>> 1) | 0;
      }
      var $439;
      var $K19_0 = $psize_1 << $439;
      var $T_0 = HEAP32[$419 >> 2];
      while (1) {
        var $T_0;
        var $K19_0;
        if ((HEAP32[$T_0 + 4 >> 2] & -8 | 0) == ($psize_1 | 0)) {
          break;
        }
        var $448 = ($K19_0 >>> 31 << 2) + $T_0 + 16 | 0;
        var $449 = HEAP32[$448 >> 2];
        if (($449 | 0) == 0) {
          label = 1693;
          break;
        } else {
          var $K19_0 = $K19_0 << 1;
          var $T_0 = $449;
        }
      }
      if (label == 1693) {
        if ($448 >>> 0 < HEAP32[1314170] >>> 0) {
          _abort();
        } else {
          HEAP32[$448 >> 2] = $390;
          HEAP32[$p_0$s2 + 6] = $T_0;
          HEAP32[$p_0$s2 + 3] = $p_0;
          HEAP32[$p_0$s2 + 2] = $p_0;
          break;
        }
      }
      var $462 = $T_0 + 8 | 0;
      var $463 = HEAP32[$462 >> 2];
      var $465 = HEAP32[1314170];
      if ($T_0 >>> 0 < $465 >>> 0) {
        _abort();
      }
      if ($463 >>> 0 < $465 >>> 0) {
        _abort();
      } else {
        HEAP32[$463 + 12 >> 2] = $390;
        HEAP32[$462 >> 2] = $390;
        HEAP32[$p_0$s2 + 2] = $463;
        HEAP32[$p_0$s2 + 3] = $T_0;
        HEAP32[$p_0$s2 + 6] = 0;
        break;
      }
    }
  } while (0);
  var $477 = HEAP32[1314174] - 1 | 0;
  HEAP32[1314174] = $477;
  if (($477 | 0) != 0) {
    return;
  }
  _release_unused_segments();
  return;
}
_free["X"] = 1;
function _segment_holding($addr) {
  var $sp_0$s2;
  var label = 0;
  var $sp_0 = 5257108 | 0, $sp_0$s2 = $sp_0 >> 2;
  while (1) {
    var $sp_0;
    var $3 = HEAP32[$sp_0$s2];
    if ($3 >>> 0 <= $addr >>> 0) {
      if (($3 + HEAP32[$sp_0$s2 + 1] | 0) >>> 0 > $addr >>> 0) {
        var $_0 = $sp_0;
        label = 1731;
        break;
      }
    }
    var $12 = HEAP32[$sp_0$s2 + 2];
    if (($12 | 0) == 0) {
      var $_0 = 0;
      label = 1730;
      break;
    } else {
      var $sp_0 = $12, $sp_0$s2 = $sp_0 >> 2;
    }
  }
  if (label == 1730) {
    var $_0;
    return $_0;
  } else if (label == 1731) {
    var $_0;
    return $_0;
  }
}
function _init_top($p, $psize) {
  var $1 = $p;
  var $3 = $p + 8 | 0;
  if (($3 & 7 | 0) == 0) {
    var $10 = 0;
  } else {
    var $10 = -$3 & 7;
  }
  var $10;
  var $13 = $psize - $10 | 0;
  HEAP32[1314172] = $1 + $10 | 0;
  HEAP32[1314169] = $13;
  HEAP32[$10 + ($1 + 4) >> 2] = $13 | 1;
  HEAP32[$psize + ($1 + 4) >> 2] = 40;
  HEAP32[1314173] = HEAP32[1311057];
  return;
}
function _init_bins() {
  var $i_02 = 0;
  while (1) {
    var $i_02;
    var $2 = $i_02 << 1;
    var $4 = ($2 << 2) + 5256704 | 0;
    HEAP32[($2 + 3 << 2) + 5256704 >> 2] = $4;
    HEAP32[($2 + 2 << 2) + 5256704 >> 2] = $4;
    var $7 = $i_02 + 1 | 0;
    if (($7 | 0) == 32) {
      break;
    } else {
      var $i_02 = $7;
    }
  }
  return;
}
function _init_mparams() {
  if ((HEAP32[1311053] | 0) != 0) {
    return;
  }
  var $4 = _sysconf(8);
  if (($4 - 1 & $4 | 0) != 0) {
    _abort();
  }
  HEAP32[1311055] = $4;
  HEAP32[1311054] = $4;
  HEAP32[1311056] = -1;
  HEAP32[1311057] = 2097152;
  HEAP32[1311058] = 0;
  HEAP32[1314276] = 0;
  HEAP32[1311053] = _time(0) & -16 ^ 1431655768;
  return;
}
function _prepend_alloc($newbase, $oldbase, $nb) {
  var $R_1$s2;
  var $_sum$s2;
  var $19$s2;
  var $oldbase$s2 = $oldbase >> 2;
  var $newbase$s2 = $newbase >> 2;
  var label = 0;
  var $2 = $newbase + 8 | 0;
  if (($2 & 7 | 0) == 0) {
    var $9 = 0;
  } else {
    var $9 = -$2 & 7;
  }
  var $9;
  var $12 = $oldbase + 8 | 0;
  if (($12 & 7 | 0) == 0) {
    var $19 = 0, $19$s2 = $19 >> 2;
  } else {
    var $19 = -$12 & 7, $19$s2 = $19 >> 2;
  }
  var $19;
  var $20 = $oldbase + $19 | 0;
  var $21 = $20;
  var $_sum = $9 + $nb | 0, $_sum$s2 = $_sum >> 2;
  var $25 = $newbase + $_sum | 0;
  var $26 = $25;
  var $27 = $20 - ($newbase + $9) - $nb | 0;
  HEAP32[($9 + 4 >> 2) + $newbase$s2] = $nb | 3;
  if (($21 | 0) == (HEAP32[1314172] | 0)) {
    var $35 = HEAP32[1314169] + $27 | 0;
    HEAP32[1314169] = $35;
    HEAP32[1314172] = $26;
    HEAP32[$_sum$s2 + ($newbase$s2 + 1)] = $35 | 1;
    var $_sum1819 = $9 | 8;
    var $332 = $newbase + $_sum1819 | 0;
    return $332;
  }
  if (($21 | 0) == (HEAP32[1314171] | 0)) {
    var $44 = HEAP32[1314168] + $27 | 0;
    HEAP32[1314168] = $44;
    HEAP32[1314171] = $26;
    HEAP32[$_sum$s2 + ($newbase$s2 + 1)] = $44 | 1;
    HEAP32[($44 >> 2) + $newbase$s2 + $_sum$s2] = $44;
    var $_sum1819 = $9 | 8;
    var $332 = $newbase + $_sum1819 | 0;
    return $332;
  }
  var $53 = HEAP32[$19$s2 + ($oldbase$s2 + 1)];
  if (($53 & 3 | 0) == 1) {
    var $57 = $53 & -8;
    var $58 = $53 >>> 3;
    var $59 = $53 >>> 0 < 256;
    L2367 : do {
      if ($59) {
        var $63 = HEAP32[(($19 | 8) >> 2) + $oldbase$s2];
        var $66 = HEAP32[$19$s2 + ($oldbase$s2 + 3)];
        if (($63 | 0) == ($66 | 0)) {
          HEAP32[1314166] = HEAP32[1314166] & (1 << $58 ^ -1);
          break;
        }
        var $76 = ($58 << 3) + 5256704 | 0;
        do {
          if (($63 | 0) != ($76 | 0)) {
            if ($63 >>> 0 >= HEAP32[1314170] >>> 0) {
              break;
            }
            _abort();
          }
        } while (0);
        do {
          if (($66 | 0) != ($76 | 0)) {
            if ($66 >>> 0 >= HEAP32[1314170] >>> 0) {
              break;
            }
            _abort();
          }
        } while (0);
        HEAP32[$63 + 12 >> 2] = $66;
        HEAP32[$66 + 8 >> 2] = $63;
      } else {
        var $91 = $20;
        var $94 = HEAP32[(($19 | 24) >> 2) + $oldbase$s2];
        var $97 = HEAP32[$19$s2 + ($oldbase$s2 + 3)];
        var $98 = ($97 | 0) == ($91 | 0);
        L2381 : do {
          if ($98) {
            var $_sum67 = $19 | 16;
            var $112 = $_sum67 + ($oldbase + 4) | 0;
            var $113 = HEAP32[$112 >> 2];
            do {
              if (($113 | 0) == 0) {
                var $117 = $oldbase + $_sum67 | 0;
                var $118 = HEAP32[$117 >> 2];
                if (($118 | 0) == 0) {
                  var $R_1 = 0, $R_1$s2 = $R_1 >> 2;
                  break L2381;
                } else {
                  var $R_0 = $118;
                  var $RP_0 = $117;
                  break;
                }
              } else {
                var $R_0 = $113;
                var $RP_0 = $112;
              }
            } while (0);
            while (1) {
              var $RP_0;
              var $R_0;
              var $120 = $R_0 + 20 | 0;
              var $121 = HEAP32[$120 >> 2];
              if (($121 | 0) != 0) {
                var $R_0 = $121;
                var $RP_0 = $120;
                continue;
              }
              var $124 = $R_0 + 16 | 0;
              var $125 = HEAP32[$124 >> 2];
              if (($125 | 0) == 0) {
                break;
              } else {
                var $R_0 = $125;
                var $RP_0 = $124;
              }
            }
            if ($RP_0 >>> 0 < HEAP32[1314170] >>> 0) {
              _abort();
            } else {
              HEAP32[$RP_0 >> 2] = 0;
              var $R_1 = $R_0, $R_1$s2 = $R_1 >> 2;
              break;
            }
          } else {
            var $102 = HEAP32[(($19 | 8) >> 2) + $oldbase$s2];
            if ($102 >>> 0 < HEAP32[1314170] >>> 0) {
              _abort();
            } else {
              HEAP32[$102 + 12 >> 2] = $97;
              HEAP32[$97 + 8 >> 2] = $102;
              var $R_1 = $97, $R_1$s2 = $R_1 >> 2;
              break;
            }
          }
        } while (0);
        var $R_1;
        if (($94 | 0) == 0) {
          break;
        }
        var $137 = $19 + ($oldbase + 28) | 0;
        var $139 = (HEAP32[$137 >> 2] << 2) + 5256968 | 0;
        do {
          if (($91 | 0) == (HEAP32[$139 >> 2] | 0)) {
            HEAP32[$139 >> 2] = $R_1;
            if (($R_1 | 0) != 0) {
              break;
            }
            HEAP32[1314167] = HEAP32[1314167] & (1 << HEAP32[$137 >> 2] ^ -1);
            break L2367;
          } else {
            if ($94 >>> 0 < HEAP32[1314170] >>> 0) {
              _abort();
            }
            var $153 = $94 + 16 | 0;
            if ((HEAP32[$153 >> 2] | 0) == ($91 | 0)) {
              HEAP32[$153 >> 2] = $R_1;
            } else {
              HEAP32[$94 + 20 >> 2] = $R_1;
            }
            if (($R_1 | 0) == 0) {
              break L2367;
            }
          }
        } while (0);
        if ($R_1 >>> 0 < HEAP32[1314170] >>> 0) {
          _abort();
        }
        HEAP32[$R_1$s2 + 6] = $94;
        var $_sum3132 = $19 | 16;
        var $170 = HEAP32[($_sum3132 >> 2) + $oldbase$s2];
        do {
          if (($170 | 0) != 0) {
            if ($170 >>> 0 < HEAP32[1314170] >>> 0) {
              _abort();
            } else {
              HEAP32[$R_1$s2 + 4] = $170;
              HEAP32[$170 + 24 >> 2] = $R_1;
              break;
            }
          }
        } while (0);
        var $183 = HEAP32[($_sum3132 + 4 >> 2) + $oldbase$s2];
        if (($183 | 0) == 0) {
          break;
        }
        if ($183 >>> 0 < HEAP32[1314170] >>> 0) {
          _abort();
        } else {
          HEAP32[$R_1$s2 + 5] = $183;
          HEAP32[$183 + 24 >> 2] = $R_1;
          break;
        }
      }
    } while (0);
    var $oldfirst_0 = $oldbase + ($57 | $19) | 0;
    var $qsize_0 = $57 + $27 | 0;
  } else {
    var $oldfirst_0 = $21;
    var $qsize_0 = $27;
  }
  var $qsize_0;
  var $oldfirst_0;
  var $199 = $oldfirst_0 + 4 | 0;
  HEAP32[$199 >> 2] = HEAP32[$199 >> 2] & -2;
  HEAP32[$_sum$s2 + ($newbase$s2 + 1)] = $qsize_0 | 1;
  HEAP32[($qsize_0 >> 2) + $newbase$s2 + $_sum$s2] = $qsize_0;
  var $207 = $qsize_0 >>> 3;
  if ($qsize_0 >>> 0 < 256) {
    var $210 = $207 << 1;
    var $212 = ($210 << 2) + 5256704 | 0;
    var $213 = HEAP32[1314166];
    var $214 = 1 << $207;
    do {
      if (($213 & $214 | 0) == 0) {
        HEAP32[1314166] = $213 | $214;
        var $F4_0 = $212;
        var $_pre_phi = ($210 + 2 << 2) + 5256704 | 0;
      } else {
        var $220 = ($210 + 2 << 2) + 5256704 | 0;
        var $221 = HEAP32[$220 >> 2];
        if ($221 >>> 0 >= HEAP32[1314170] >>> 0) {
          var $F4_0 = $221;
          var $_pre_phi = $220;
          break;
        }
        _abort();
      }
    } while (0);
    var $_pre_phi;
    var $F4_0;
    HEAP32[$_pre_phi >> 2] = $26;
    HEAP32[$F4_0 + 12 >> 2] = $26;
    HEAP32[$_sum$s2 + ($newbase$s2 + 2)] = $F4_0;
    HEAP32[$_sum$s2 + ($newbase$s2 + 3)] = $212;
    var $_sum1819 = $9 | 8;
    var $332 = $newbase + $_sum1819 | 0;
    return $332;
  }
  var $233 = $25;
  var $234 = $qsize_0 >>> 8;
  do {
    if (($234 | 0) == 0) {
      var $I7_0 = 0;
    } else {
      if ($qsize_0 >>> 0 > 16777215) {
        var $I7_0 = 31;
        break;
      }
      var $241 = ($234 + 1048320 | 0) >>> 16 & 8;
      var $242 = $234 << $241;
      var $245 = ($242 + 520192 | 0) >>> 16 & 4;
      var $247 = $242 << $245;
      var $250 = ($247 + 245760 | 0) >>> 16 & 2;
      var $255 = 14 - ($245 | $241 | $250) + ($247 << $250 >>> 15) | 0;
      var $I7_0 = $qsize_0 >>> (($255 + 7 | 0) >>> 0) & 1 | $255 << 1;
    }
  } while (0);
  var $I7_0;
  var $262 = ($I7_0 << 2) + 5256968 | 0;
  HEAP32[$_sum$s2 + ($newbase$s2 + 7)] = $I7_0;
  HEAP32[$_sum$s2 + ($newbase$s2 + 5)] = 0;
  HEAP32[$_sum$s2 + ($newbase$s2 + 4)] = 0;
  var $269 = HEAP32[1314167];
  var $270 = 1 << $I7_0;
  if (($269 & $270 | 0) == 0) {
    HEAP32[1314167] = $269 | $270;
    HEAP32[$262 >> 2] = $233;
    HEAP32[$_sum$s2 + ($newbase$s2 + 6)] = $262;
    HEAP32[$_sum$s2 + ($newbase$s2 + 3)] = $233;
    HEAP32[$_sum$s2 + ($newbase$s2 + 2)] = $233;
    var $_sum1819 = $9 | 8;
    var $332 = $newbase + $_sum1819 | 0;
    return $332;
  }
  if (($I7_0 | 0) == 31) {
    var $289 = 0;
  } else {
    var $289 = 25 - ($I7_0 >>> 1) | 0;
  }
  var $289;
  var $K8_0 = $qsize_0 << $289;
  var $T_0 = HEAP32[$262 >> 2];
  while (1) {
    var $T_0;
    var $K8_0;
    if ((HEAP32[$T_0 + 4 >> 2] & -8 | 0) == ($qsize_0 | 0)) {
      break;
    }
    var $298 = ($K8_0 >>> 31 << 2) + $T_0 + 16 | 0;
    var $299 = HEAP32[$298 >> 2];
    if (($299 | 0) == 0) {
      label = 1811;
      break;
    } else {
      var $K8_0 = $K8_0 << 1;
      var $T_0 = $299;
    }
  }
  if (label == 1811) {
    if ($298 >>> 0 < HEAP32[1314170] >>> 0) {
      _abort();
    }
    HEAP32[$298 >> 2] = $233;
    HEAP32[$_sum$s2 + ($newbase$s2 + 6)] = $T_0;
    HEAP32[$_sum$s2 + ($newbase$s2 + 3)] = $233;
    HEAP32[$_sum$s2 + ($newbase$s2 + 2)] = $233;
    var $_sum1819 = $9 | 8;
    var $332 = $newbase + $_sum1819 | 0;
    return $332;
  }
  var $315 = $T_0 + 8 | 0;
  var $316 = HEAP32[$315 >> 2];
  var $318 = HEAP32[1314170];
  if ($T_0 >>> 0 < $318 >>> 0) {
    _abort();
  }
  if ($316 >>> 0 < $318 >>> 0) {
    _abort();
  }
  HEAP32[$316 + 12 >> 2] = $233;
  HEAP32[$315 >> 2] = $233;
  HEAP32[$_sum$s2 + ($newbase$s2 + 2)] = $316;
  HEAP32[$_sum$s2 + ($newbase$s2 + 3)] = $T_0;
  HEAP32[$_sum$s2 + ($newbase$s2 + 6)] = 0;
  var $_sum1819 = $9 | 8;
  var $332 = $newbase + $_sum1819 | 0;
  return $332;
}
_prepend_alloc["X"] = 1;
function _add_segment($tbase, $tsize) {
  var $23$s2;
  var $1$s2;
  var label = 0;
  var $1 = HEAP32[1314172], $1$s2 = $1 >> 2;
  var $2 = $1;
  var $3 = _segment_holding($2);
  var $5 = HEAP32[$3 >> 2];
  var $7 = HEAP32[$3 + 4 >> 2];
  var $8 = $5 + $7 | 0;
  var $10 = $5 + ($7 - 39) | 0;
  if (($10 & 7 | 0) == 0) {
    var $17 = 0;
  } else {
    var $17 = -$10 & 7;
  }
  var $17;
  var $18 = $5 + ($7 - 47) + $17 | 0;
  var $22 = $18 >>> 0 < ($1 + 16 | 0) >>> 0 ? $2 : $18;
  var $23 = $22 + 8 | 0, $23$s2 = $23 >> 2;
  _init_top($tbase, $tsize - 40 | 0);
  HEAP32[$22 + 4 >> 2] = 27;
  HEAP32[$23$s2] = HEAP32[1314277];
  HEAP32[$23$s2 + 1] = HEAP32[1314278];
  HEAP32[$23$s2 + 2] = HEAP32[1314279];
  HEAP32[$23$s2 + 3] = HEAP32[1314280];
  HEAP32[1314277] = $tbase;
  HEAP32[1314278] = $tsize;
  HEAP32[1314280] = 0;
  HEAP32[1314279] = $23;
  var $30 = $22 + 28 | 0;
  HEAP32[$30 >> 2] = 7;
  var $32 = ($22 + 32 | 0) >>> 0 < $8 >>> 0;
  L2466 : do {
    if ($32) {
      var $33 = $30;
      while (1) {
        var $33;
        var $34 = $33 + 4 | 0;
        HEAP32[$34 >> 2] = 7;
        if (($33 + 8 | 0) >>> 0 < $8 >>> 0) {
          var $33 = $34;
        } else {
          break L2466;
        }
      }
    }
  } while (0);
  if (($22 | 0) == ($2 | 0)) {
    return;
  }
  var $42 = $22 - $1 | 0;
  var $45 = $42 + ($2 + 4) | 0;
  HEAP32[$45 >> 2] = HEAP32[$45 >> 2] & -2;
  HEAP32[$1$s2 + 1] = $42 | 1;
  HEAP32[$2 + $42 >> 2] = $42;
  var $51 = $42 >>> 3;
  if ($42 >>> 0 < 256) {
    var $54 = $51 << 1;
    var $56 = ($54 << 2) + 5256704 | 0;
    var $57 = HEAP32[1314166];
    var $58 = 1 << $51;
    do {
      if (($57 & $58 | 0) == 0) {
        HEAP32[1314166] = $57 | $58;
        var $F_0 = $56;
        var $_pre_phi = ($54 + 2 << 2) + 5256704 | 0;
      } else {
        var $64 = ($54 + 2 << 2) + 5256704 | 0;
        var $65 = HEAP32[$64 >> 2];
        if ($65 >>> 0 >= HEAP32[1314170] >>> 0) {
          var $F_0 = $65;
          var $_pre_phi = $64;
          break;
        }
        _abort();
      }
    } while (0);
    var $_pre_phi;
    var $F_0;
    HEAP32[$_pre_phi >> 2] = $1;
    HEAP32[$F_0 + 12 >> 2] = $1;
    HEAP32[$1$s2 + 2] = $F_0;
    HEAP32[$1$s2 + 3] = $56;
    return;
  }
  var $75 = $1;
  var $76 = $42 >>> 8;
  do {
    if (($76 | 0) == 0) {
      var $I1_0 = 0;
    } else {
      if ($42 >>> 0 > 16777215) {
        var $I1_0 = 31;
        break;
      }
      var $83 = ($76 + 1048320 | 0) >>> 16 & 8;
      var $84 = $76 << $83;
      var $87 = ($84 + 520192 | 0) >>> 16 & 4;
      var $89 = $84 << $87;
      var $92 = ($89 + 245760 | 0) >>> 16 & 2;
      var $97 = 14 - ($87 | $83 | $92) + ($89 << $92 >>> 15) | 0;
      var $I1_0 = $42 >>> (($97 + 7 | 0) >>> 0) & 1 | $97 << 1;
    }
  } while (0);
  var $I1_0;
  var $104 = ($I1_0 << 2) + 5256968 | 0;
  HEAP32[$1$s2 + 7] = $I1_0;
  HEAP32[$1$s2 + 5] = 0;
  HEAP32[$1$s2 + 4] = 0;
  var $108 = HEAP32[1314167];
  var $109 = 1 << $I1_0;
  if (($108 & $109 | 0) == 0) {
    HEAP32[1314167] = $108 | $109;
    HEAP32[$104 >> 2] = $75;
    HEAP32[$1$s2 + 6] = $104;
    HEAP32[$1$s2 + 3] = $1;
    HEAP32[$1$s2 + 2] = $1;
    return;
  }
  if (($I1_0 | 0) == 31) {
    var $124 = 0;
  } else {
    var $124 = 25 - ($I1_0 >>> 1) | 0;
  }
  var $124;
  var $K2_0 = $42 << $124;
  var $T_0 = HEAP32[$104 >> 2];
  while (1) {
    var $T_0;
    var $K2_0;
    if ((HEAP32[$T_0 + 4 >> 2] & -8 | 0) == ($42 | 0)) {
      break;
    }
    var $133 = ($K2_0 >>> 31 << 2) + $T_0 + 16 | 0;
    var $134 = HEAP32[$133 >> 2];
    if (($134 | 0) == 0) {
      label = 1850;
      break;
    } else {
      var $K2_0 = $K2_0 << 1;
      var $T_0 = $134;
    }
  }
  if (label == 1850) {
    if ($133 >>> 0 < HEAP32[1314170] >>> 0) {
      _abort();
    }
    HEAP32[$133 >> 2] = $75;
    HEAP32[$1$s2 + 6] = $T_0;
    HEAP32[$1$s2 + 3] = $1;
    HEAP32[$1$s2 + 2] = $1;
    return;
  }
  var $147 = $T_0 + 8 | 0;
  var $148 = HEAP32[$147 >> 2];
  var $150 = HEAP32[1314170];
  if ($T_0 >>> 0 < $150 >>> 0) {
    _abort();
  }
  if ($148 >>> 0 < $150 >>> 0) {
    _abort();
  }
  HEAP32[$148 + 12 >> 2] = $75;
  HEAP32[$147 >> 2] = $75;
  HEAP32[$1$s2 + 2] = $148;
  HEAP32[$1$s2 + 3] = $T_0;
  HEAP32[$1$s2 + 6] = 0;
  return;
}



_add_segment["X"]=1;

// Warning: printing of i64 values may be slightly rounded! No deep i64 math used, so precise i64 code not included
var i64Math = null;

// === Auto-generated postamble setup entry stuff ===

Module.callMain = function callMain(args) {
  var argc = args.length+1;
  function pad() {
    for (var i = 0; i < 4-1; i++) {
      argv.push(0);
    }
  }
  var argv = [allocate(intArrayFromString("/bin/this.program"), 'i8', ALLOC_STATIC) ];
  pad();
  for (var i = 0; i < argc-1; i = i + 1) {
    argv.push(allocate(intArrayFromString(args[i]), 'i8', ALLOC_STATIC));
    pad();
  }
  argv.push(0);
  argv = allocate(argv, 'i32', ALLOC_STATIC);

  return Module['_main'](argc, argv, 0);
}




function run(args) {
  args = args || Module['arguments'];

  if (runDependencies > 0) {
    Module.printErr('run() called, but dependencies remain, so not running');
    return 0;
  }

  if (Module['preRun']) {
    if (typeof Module['preRun'] == 'function') Module['preRun'] = [Module['preRun']];
    var toRun = Module['preRun'];
    Module['preRun'] = [];
    for (var i = toRun.length-1; i >= 0; i--) {
      toRun[i]();
    }
    if (runDependencies > 0) {
      // a preRun added a dependency, run will be called later
      return 0;
    }
  }

  function doRun() {
    var ret = 0;
    calledRun = true;
    if (Module['_main']) {
      preMain();
      ret = Module.callMain(args);
      if (!Module['noExitRuntime']) {
        exitRuntime();
      }
    }
    if (Module['postRun']) {
      if (typeof Module['postRun'] == 'function') Module['postRun'] = [Module['postRun']];
      while (Module['postRun'].length > 0) {
        Module['postRun'].pop()();
      }
    }
    return ret;
  }

  if (Module['setStatus']) {
    Module['setStatus']('Running...');
    setTimeout(function() {
      setTimeout(function() {
        Module['setStatus']('');
      }, 1);
      doRun();
    }, 1);
    return 0;
  } else {
    return doRun();
  }
}
Module['run'] = Module.run = run;

// {{PRE_RUN_ADDITIONS}}

if (Module['preInit']) {
  if (typeof Module['preInit'] == 'function') Module['preInit'] = [Module['preInit']];
  while (Module['preInit'].length > 0) {
    Module['preInit'].pop()();
  }
}

initRuntime();

var shouldRunNow = true;
if (Module['noInitialRun']) {
  shouldRunNow = false;
}

if (shouldRunNow) {
  var ret = run();
}

// {{POST_RUN_ADDITIONS}}






  // {{MODULE_ADDITIONS}}


// EMSCRIPTEN_GENERATED_FUNCTIONS: ["_sys_trim","_putShortMSB","_pqdownheap","_inflateInit2_","_main","_inflate_fast","_adler32","_build_bl_tree","_inflate","_copy_block","_gen_codes","_deflateEnd","_tmalloc_small","__tr_init","_inflate_table","_bi_reverse","_malloc","_deflate_stored","_deflateInit2_","_send_tree","_longest_match","_init_top","_free","_tmalloc_large","_deflate","_deflateInit_","_deflateResetKeep","_inf","_inflateReset2","_fixedtables","_crc32_little","_init_block","_init_mparams","_inflateResetKeep","_deflateReset","_init_bins","_gen_bitlen","__tr_flush_block","_prepend_alloc","_def","_segment_holding","_send_all_trees","_detect_data_type","_deflate_rle","_deflate_slow","__tr_flush_bits","_deflate_fast","__tr_stored_block","_deflate_huff","_zcalloc","_zcfree","_sys_alloc","_bi_windup","_compress_block","__tr_align","_add_segment","_lm_init","_inflateInit_","_bi_flush","_inflateEnd","_zerr","_crc32","_scan_tree","_read_buf","_flush_pending","_release_unused_segments","_inflateReset","_fill_window","_updatewindow","_build_tree"]




    var tmp = new Uint8Array(++outputIndex);
    tmp.set(returnValue.subarray(0, outputIndex));
    return tmp;
  },

  compress: function(bytes) {
    return this.run(bytes);
  },

  decompress: function(bytes) {
    return this.run(bytes, true);
  }
};