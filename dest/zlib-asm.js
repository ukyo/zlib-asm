var key = ['zlib_asm'];
var global;
if (module && module.exports) {
  global = module.exports;
} else {
  global = window;
}

global[key] = {
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


(function() { // prevent new Function from seeing the global scope
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
      args.splice(0, 0, ptr);
      return Module['dynCall_' + sig].apply(null, args);
    } else {
      return Module['dynCall_' + sig].call(null, ptr);
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




























































var _stdout = _stdout=allocate(4, "i8", ALLOC_STATIC);
var _stdin = _stdin=allocate(4, "i8", ALLOC_STATIC);
var _stderr = _stderr=allocate(4, "i8", ALLOC_STATIC);
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
  


var Runtime_bitshift64 = Runtime.bitshift64;
var Math_floor = Math.floor;
var Math_min = Math.min;
var asmPre = (function(env, buffer) {
  'use asm';
  var HEAP8 = new env.Int8Array(buffer);
  var HEAP16 = new env.Int16Array(buffer);
  var HEAP32 = new env.Int32Array(buffer);
  var HEAPU8 = new env.Uint8Array(buffer);
  var HEAPU16 = new env.Uint16Array(buffer);
  var HEAPU32 = new env.Uint32Array(buffer);
  var HEAPF32 = new env.Float32Array(buffer);
  var HEAPF64 = new env.Float64Array(buffer);

  var STACKTOP=env.STACKTOP|0;
  var STACK_MAX=env.STACK_MAX|0;
  var tempDoublePtr=env.tempDoublePtr|0;
  var ABORT=env.ABORT|0;
  var _stdout=env._stdout|0;
  var _stderr=env._stderr|0;
  var _stdin=env._stdin|0;

  var __THREW__ = 0;
  var undef = 0;

  var tempRet0 = 0;
  var tempRet1 = 0;
  var tempRet2 = 0;
  var tempRet3 = 0;
  var tempRet4 = 0;
  var tempRet5 = 0;
  var tempRet6 = 0;
  var tempRet7 = 0;
  var tempRet8 = 0;
  var tempRet9 = 0;
  var abort=env.abort;
  var assert=env.assert;
  var Runtime_bitshift64=env.Runtime_bitshift64;
  var Math_floor=env.Math_floor;
  var Math_min=env.Math_min;
  var _strncmp=env._strncmp;
  var _llvm_memset_p0i8_i32=env._llvm_memset_p0i8_i32;
  var _sysconf=env._sysconf;
  var _stdout=env._stdout;
  var _fread=env._fread;
  var _llvm_memcpy_p0i8_p0i8_i32=env._llvm_memcpy_p0i8_p0i8_i32;
  var _pread=env._pread;
  var _feof=env._feof;
  var ___setErrNo=env.___setErrNo;
  var _fwrite=env._fwrite;
  var _write=env._write;
  var ___errno=env.___errno;
  var _memset=env._memset;
  var _read=env._read;
  var _ferror=env._ferror;
  var __impure_ptr=env.__impure_ptr;
  var ___assert_func=env.___assert_func;
  var _memcpy=env._memcpy;
  var _pwrite=env._pwrite;
  var _sbrk=env._sbrk;
  var _stdin=env._stdin;
  var ___errno_location=env.___errno_location;
  var _abort=env._abort;
  var _llvm_bswap_i32=env._llvm_bswap_i32;
  var _stderr=env._stderr;
  var _time=env._time;
  var _strcmp=env._strcmp;

  function stackAlloc(size) {
    size = size|0;
    var ret = 0;
    ret = STACKTOP;
    STACKTOP = (STACKTOP + size)|0;
    STACKTOP = ((STACKTOP + 3)>>2)<<2;
    return ret|0;
  }
  function stackSave() {
    return STACKTOP|0;
  }
  function stackRestore(top) {
    top = top|0;
    STACKTOP = top;
  }
  function setThrew(threw) {
    threw = threw|0;
    __THREW__ = threw;
  }

  function setTempRet0(value) {
    value = value|0;
    tempRet0 = value;
  }

  function setTempRet1(value) {
    value = value|0;
    tempRet1 = value;
  }

  function setTempRet2(value) {
    value = value|0;
    tempRet2 = value;
  }

  function setTempRet3(value) {
    value = value|0;
    tempRet3 = value;
  }

  function setTempRet4(value) {
    value = value|0;
    tempRet4 = value;
  }

  function setTempRet5(value) {
    value = value|0;
    tempRet5 = value;
  }

  function setTempRet6(value) {
    value = value|0;
    tempRet6 = value;
  }

  function setTempRet7(value) {
    value = value|0;
    tempRet7 = value;
  }

  function setTempRet8(value) {
    value = value|0;
    tempRet8 = value;
  }

  function setTempRet9(value) {
    value = value|0;
    tempRet9 = value;
  }

function _def(i1, i2) {
  i1 = i1 | 0;
  i2 = i2 | 0;
  var i3 = 0, i4 = 0, i5 = 0, i6 = 0, i7 = 0, i8 = 0, i9 = 0, i10 = 0, i11 = 0, i12 = 0, i13 = 0, i14 = 0, i15 = 0, i16 = 0;
  i3 = STACKTOP;
  STACKTOP = STACKTOP + 32824 | 0;
  i4 = i3 | 0;
  HEAP32[(i4 + 32 & 16777215) >> 2] = 0;
  HEAP32[(i4 + 36 & 16777215) >> 2] = 0;
  HEAP32[(i4 + 40 & 16777215) >> 2] = 0;
  i5 = i4;
  i6 = _deflateInit_(i5);
  if ((i6 | 0) != 0) {
    i7 = i6;
    STACKTOP = i3;
    return i7 | 0;
  }
  i6 = i3 + 56 | 0;
  i8 = i4 + 4 | 0;
  i9 = i4 | 0;
  i10 = i4 + 16 | 0;
  i11 = i3 + 16440 | 0;
  i12 = i4 + 12 | 0;
  L4 : while (1) {
    HEAP32[(i8 & 16777215) >> 2] = _fread(i6 | 0, 1 | 0, 16384 | 0, i1 | 0) | 0;
    if ((_ferror(i1) | 0) != 0) {
      i13 = 4;
      break;
    }
    i4 = (_feof(i1) | 0) != 0;
    i14 = i4 ? 4 : 0;
    HEAP32[(i9 & 16777215) >> 2] = i6;
    while (1) {
      HEAP32[(i10 & 16777215) >> 2] = 16384;
      HEAP32[(i12 & 16777215) >> 2] = i11;
      i15 = _deflate(i5, i14);
      if ((i15 | 0) == -2) {
        +___assert_func(5256400 | 0, 68 | 0, 5257648 | 0, 5256072 | 0);
      }
      i16 = 16384 - HEAP32[(i10 & 16777215) >> 2] | 0;
      if ((_fwrite(i11, 1, i16, i2) | 0) != (i16 | 0)) {
        i13 = 10;
        break L4;
      }
      if ((_ferror(i2) | 0) != 0) {
        i13 = 10;
        break L4;
      }
      if ((HEAP32[(i10 & 16777215) >> 2] | 0) != 0) {
        break;
      }
    }
    if ((HEAP32[(i8 & 16777215) >> 2] | 0) != 0) {
      +___assert_func(5256400 | 0, 75 | 0, 5257648 | 0, 5255996 | 0);
    }
    if (i4) {
      i13 = 15;
      break;
    }
  }
  if (i13 == 4) {
    _deflateEnd(i5);
    i7 = -1;
    STACKTOP = i3;
    return i7 | 0;
  } else if (i13 == 10) {
    _deflateEnd(i5);
    i7 = -1;
    STACKTOP = i3;
    return i7 | 0;
  } else if (i13 == 15) {
    if ((i15 | 0) != 1) {
      +___assert_func(5256400 | 0, 79 | 0, 5257648 | 0, 5255956 | 0);
    }
    _deflateEnd(i5);
    i7 = 0;
    STACKTOP = i3;
    return i7 | 0;
  }
}
function _inf(i1, i2) {
  i1 = i1 | 0;
  i2 = i2 | 0;
  var i3 = 0, i4 = 0, i5 = 0, i6 = 0, i7 = 0, i8 = 0, i9 = 0, i10 = 0, i11 = 0, i12 = 0, i13 = 0, i14 = 0, i15 = 0, i16 = 0, i17 = 0;
  i3 = STACKTOP;
  STACKTOP = STACKTOP + 32824 | 0;
  i4 = i3 | 0;
  HEAP32[(i4 + 32 & 16777215) >> 2] = 0;
  HEAP32[(i4 + 36 & 16777215) >> 2] = 0;
  HEAP32[(i4 + 40 & 16777215) >> 2] = 0;
  i5 = i4 + 4 | 0;
  HEAP32[(i5 & 16777215) >> 2] = 0;
  i6 = i4 | 0;
  HEAP32[(i6 & 16777215) >> 2] = 0;
  i7 = _inflateInit_(i4);
  if ((i7 | 0) != 0) {
    i8 = i7;
    STACKTOP = i3;
    return i8 | 0;
  }
  i7 = i3 + 56 | 0;
  i9 = i4 + 16 | 0;
  i10 = i3 + 16440 | 0;
  i11 = i4 + 12 | 0;
  i12 = 0;
  L32 : while (1) {
    i13 = _fread(i7 | 0, 1 | 0, 16384 | 0, i1 | 0) | 0;
    HEAP32[(i5 & 16777215) >> 2] = i13;
    if ((_ferror(i1) | 0) != 0) {
      i14 = 26;
      break;
    }
    if ((i13 | 0) == 0) {
      i15 = i12;
      i14 = 38;
      break;
    }
    HEAP32[(i6 & 16777215) >> 2] = i7;
    while (1) {
      HEAP32[(i9 & 16777215) >> 2] = 16384;
      HEAP32[(i11 & 16777215) >> 2] = i10;
      i16 = _inflate(i4);
      if ((i16 | 0) == -2) {
        +___assert_func(5256400 | 0, 126 | 0, 5257644 | 0, 5256072 | 0);
      } else if ((i16 | 0) == 2) {
        i14 = 31;
        break L32;
      } else if ((i16 | 0) == -3 || (i16 | 0) == -4) {
        i17 = i16;
        break L32;
      }
      i13 = 16384 - HEAP32[(i9 & 16777215) >> 2] | 0;
      if ((_fwrite(i10, 1, i13, i2) | 0) != (i13 | 0)) {
        i14 = 35;
        break L32;
      }
      if ((_ferror(i2) | 0) != 0) {
        i14 = 35;
        break L32;
      }
      if ((HEAP32[(i9 & 16777215) >> 2] | 0) != 0) {
        break;
      }
    }
    if ((i16 | 0) == 1) {
      i15 = 1;
      i14 = 38;
      break;
    } else {
      i12 = i16;
    }
  }
  if (i14 == 31) {
    i17 = -3;
  } else if (i14 == 38) {
    _inflateEnd(i4);
    i8 = (i15 | 0) == 1 ? 0 : -3;
    STACKTOP = i3;
    return i8 | 0;
  } else if (i14 == 26) {
    _inflateEnd(i4);
    i8 = -1;
    STACKTOP = i3;
    return i8 | 0;
  } else if (i14 == 35) {
    _inflateEnd(i4);
    i8 = -1;
    STACKTOP = i3;
    return i8 | 0;
  }
  _inflateEnd(i4);
  i8 = i17;
  STACKTOP = i3;
  return i8 | 0;
}
function _zerr(i1) {
  i1 = i1 | 0;
  var i2 = 0;
  _fwrite(5255904 | 0, 7 | 0, 1 | 0, HEAP32[(_stderr & 16777215) >> 2] | 0) | 0;
  if ((i1 | 0) == -3) {
    i2 = HEAP32[(_stderr & 16777215) >> 2] | 0;
    _fwrite(5255616 | 0, 35 | 0, 1 | 0, i2 | 0) | 0;
    return;
  } else if ((i1 | 0) == -4) {
    _fwrite(5256384 | 0, 14 | 0, 1 | 0, HEAP32[(_stderr & 16777215) >> 2] | 0) | 0;
    return;
  } else if ((i1 | 0) == -6) {
    _fwrite(5256332 | 0, 23 | 0, 1 | 0, HEAP32[(_stderr & 16777215) >> 2] | 0) | 0;
    return;
  } else if ((i1 | 0) == -2) {
    _fwrite(5255688 | 0, 26 | 0, 1 | 0, HEAP32[(_stderr & 16777215) >> 2] | 0) | 0;
    return;
  } else if ((i1 | 0) == -1) {
    if ((_ferror(HEAP32[(_stdin & 16777215) >> 2] | 0) | 0) != 0) {
      i1 = HEAP32[(_stderr & 16777215) >> 2] | 0;
      _fwrite(5255860 | 0, 20 | 0, 1 | 0, i1 | 0) | 0;
    }
    if ((_ferror(HEAP32[(_stdout & 16777215) >> 2] | 0) | 0) == 0) {
      return;
    }
    _fwrite(5255796 | 0, 21 | 0, 1 | 0, HEAP32[(_stderr & 16777215) >> 2] | 0) | 0;
    return;
  } else {
    return;
  }
}
function _main(i1, i2) {
  i1 = i1 | 0;
  i2 = i2 | 0;
  var i3 = 0, i4 = 0, i5 = 0;
  if ((i1 | 0) == 1) {
    i3 = _def(HEAP32[(_stdin & 16777215) >> 2] | 0, HEAP32[(_stdout & 16777215) >> 2] | 0);
    if ((i3 | 0) == 0) {
      i4 = 0;
      return i4 | 0;
    }
    _zerr(i3);
    i4 = i3;
    return i4 | 0;
  } else if ((i1 | 0) == 2) {
    i5 = 65;
  }
  do {
    if (i5 == 65) {
      if ((_strcmp(HEAP32[(i2 + 4 & 16777215) >> 2] | 0, 5256264 | 0) | 0) != 0) {
        break;
      }
      i1 = _inf(HEAP32[(_stdin & 16777215) >> 2] | 0, HEAP32[(_stdout & 16777215) >> 2] | 0);
      if ((i1 | 0) == 0) {
        i4 = 0;
        return i4 | 0;
      }
      _zerr(i1);
      i4 = i1;
      return i4 | 0;
    }
  } while (0);
  _fwrite(5256192 | 0, 40 | 0, 1 | 0, HEAP32[(_stderr & 16777215) >> 2] | 0) | 0;
  i4 = 1;
  return i4 | 0;
}
function _deflateInit_(i1) {
  i1 = i1 | 0;
  return _deflateInit2_(i1) | 0;
}
function _deflateInit2_(i1) {
  i1 = i1 | 0;
  var i2 = 0, i3 = 0, i4 = 0, i5 = 0, i6 = 0, i7 = 0, i8 = 0, i9 = 0, i10 = 0, i11 = 0;
  if ((i1 | 0) == 0) {
    i2 = -2;
    return i2 | 0;
  }
  i3 = i1 + 24 | 0;
  HEAP32[(i3 & 16777215) >> 2] = 0;
  i4 = i1 + 32 | 0;
  i5 = HEAP32[(i4 & 16777215) >> 2] | 0;
  if ((i5 | 0) == 0) {
    HEAP32[(i4 & 16777215) >> 2] = 4;
    HEAP32[(i1 + 40 & 16777215) >> 2] = 0;
    i6 = 4;
  } else {
    i6 = i5;
  }
  i5 = i1 + 36 | 0;
  if ((HEAP32[(i5 & 16777215) >> 2] | 0) == 0) {
    HEAP32[(i5 & 16777215) >> 2] = 10;
  }
  i5 = i1 + 40 | 0;
  i7 = FUNCTION_TABLE_iiii[i6 & 15](HEAP32[(i5 & 16777215) >> 2] | 0, 1, 5828);
  if ((i7 | 0) == 0) {
    i2 = -4;
    return i2 | 0;
  }
  HEAP32[(i1 + 28 & 16777215) >> 2] = i7;
  HEAP32[(i7 & 16777215) >> 2] = i1;
  HEAP32[(i7 + 24 & 16777215) >> 2] = 1;
  HEAP32[(i7 + 28 & 16777215) >> 2] = 0;
  HEAP32[(i7 + 48 & 16777215) >> 2] = 15;
  i6 = i7 + 44 | 0;
  HEAP32[(i6 & 16777215) >> 2] = 32768;
  HEAP32[(i7 + 52 & 16777215) >> 2] = 32767;
  HEAP32[(i7 + 80 & 16777215) >> 2] = 15;
  i8 = i7 + 76 | 0;
  HEAP32[(i8 & 16777215) >> 2] = 32768;
  HEAP32[(i7 + 84 & 16777215) >> 2] = 32767;
  HEAP32[(i7 + 88 & 16777215) >> 2] = 5;
  i9 = i7 + 56 | 0;
  HEAP32[(i9 & 16777215) >> 2] = FUNCTION_TABLE_iiii[HEAP32[(i4 & 16777215) >> 2] & 15](HEAP32[(i5 & 16777215) >> 2] | 0, 32768, 2);
  i10 = i7 + 64 | 0;
  HEAP32[(i10 & 16777215) >> 2] = FUNCTION_TABLE_iiii[HEAP32[(i4 & 16777215) >> 2] & 15](HEAP32[(i5 & 16777215) >> 2] | 0, HEAP32[(i6 & 16777215) >> 2] | 0, 2);
  i6 = i7 + 68 | 0;
  HEAP32[(i6 & 16777215) >> 2] = FUNCTION_TABLE_iiii[HEAP32[(i4 & 16777215) >> 2] & 15](HEAP32[(i5 & 16777215) >> 2] | 0, HEAP32[(i8 & 16777215) >> 2] | 0, 2);
  HEAP32[(i7 + 5824 & 16777215) >> 2] = 0;
  i8 = i7 + 5788 | 0;
  HEAP32[(i8 & 16777215) >> 2] = 16384;
  i11 = FUNCTION_TABLE_iiii[HEAP32[(i4 & 16777215) >> 2] & 15](HEAP32[(i5 & 16777215) >> 2] | 0, 16384, 4);
  i5 = i11;
  HEAP32[(i7 + 8 & 16777215) >> 2] = i11;
  i4 = HEAP32[(i8 & 16777215) >> 2] | 0;
  HEAP32[(i7 + 12 & 16777215) >> 2] = i4 << 2;
  do {
    if ((HEAP32[(i9 & 16777215) >> 2] | 0) != 0) {
      if ((HEAP32[(i10 & 16777215) >> 2] | 0) == 0) {
        break;
      }
      if ((HEAP32[(i6 & 16777215) >> 2] | 0) == 0 | (i11 | 0) == 0) {
        break;
      }
      HEAP32[(i7 + 5796 & 16777215) >> 2] = (i4 >>> 1 << 1) + i5 | 0;
      HEAP32[(i7 + 5784 & 16777215) >> 2] = i11 + ~~(+i4 * +3) | 0;
      HEAP32[(i7 + 132 & 16777215) >> 2] = 6;
      HEAP32[(i7 + 136 & 16777215) >> 2] = 0;
      HEAP8[i7 + 36 & 16777215] = 8;
      i2 = _deflateReset(i1);
      return i2 | 0;
    }
  } while (0);
  HEAP32[(i7 + 4 & 16777215) >> 2] = 666;
  HEAP32[(i3 & 16777215) >> 2] = 5255820 | 0;
  _deflateEnd(i1);
  i2 = -4;
  return i2 | 0;
}
function _deflateEnd(i1) {
  i1 = i1 | 0;
  var i2 = 0, i3 = 0, i4 = 0, i5 = 0, i6 = 0, i7 = 0, i8 = 0, i9 = 0;
  if ((i1 | 0) == 0) {
    return;
  }
  i2 = i1 + 28 | 0;
  i3 = HEAP32[(i2 & 16777215) >> 2] | 0;
  if ((i3 | 0) == 0) {
    return;
  }
  i4 = HEAP32[(i3 + 4 & 16777215) >> 2] | 0;
  if (!((i4 | 0) == 666 || (i4 | 0) == 113 || (i4 | 0) == 103 || (i4 | 0) == 91 || (i4 | 0) == 73 || (i4 | 0) == 69 || (i4 | 0) == 42)) {
    return;
  }
  i4 = HEAP32[(i3 + 8 & 16777215) >> 2] | 0;
  if ((i4 | 0) == 0) {
    i5 = i3;
  } else {
    FUNCTION_TABLE_vii[HEAP32[(i1 + 36 & 16777215) >> 2] & 15](HEAP32[(i1 + 40 & 16777215) >> 2] | 0, i4);
    i5 = HEAP32[(i2 & 16777215) >> 2] | 0;
  }
  i4 = HEAP32[(i5 + 68 & 16777215) >> 2] | 0;
  if ((i4 | 0) == 0) {
    i6 = i5;
  } else {
    FUNCTION_TABLE_vii[HEAP32[(i1 + 36 & 16777215) >> 2] & 15](HEAP32[(i1 + 40 & 16777215) >> 2] | 0, i4);
    i6 = HEAP32[(i2 & 16777215) >> 2] | 0;
  }
  i4 = HEAP32[(i6 + 64 & 16777215) >> 2] | 0;
  i5 = i1 + 36 | 0;
  if ((i4 | 0) == 0) {
    i7 = i6;
  } else {
    FUNCTION_TABLE_vii[HEAP32[(i5 & 16777215) >> 2] & 15](HEAP32[(i1 + 40 & 16777215) >> 2] | 0, i4);
    i7 = HEAP32[(i2 & 16777215) >> 2] | 0;
  }
  i4 = HEAP32[(i7 + 56 & 16777215) >> 2] | 0;
  if ((i4 | 0) == 0) {
    i8 = i7;
    i9 = i1 + 40 | 0;
  } else {
    i7 = i1 + 40 | 0;
    FUNCTION_TABLE_vii[HEAP32[(i5 & 16777215) >> 2] & 15](HEAP32[(i7 & 16777215) >> 2] | 0, i4);
    i8 = HEAP32[(i2 & 16777215) >> 2] | 0;
    i9 = i7;
  }
  FUNCTION_TABLE_vii[HEAP32[(i5 & 16777215) >> 2] & 15](HEAP32[(i9 & 16777215) >> 2] | 0, i8);
  HEAP32[(i2 & 16777215) >> 2] = 0;
  return;
}
function _deflateReset(i1) {
  i1 = i1 | 0;
  var i2 = 0;
  i2 = _deflateResetKeep(i1);
  if ((i2 | 0) != 0) {
    return i2 | 0;
  }
  _lm_init(HEAP32[(i1 + 28 & 16777215) >> 2] | 0);
  return i2 | 0;
}
function _fill_window(i1) {
  i1 = i1 | 0;
  var i2 = 0, i3 = 0, i4 = 0, i5 = 0, i6 = 0, i7 = 0, i8 = 0, i9 = 0, i10 = 0, i11 = 0, i12 = 0, i13 = 0, i14 = 0, i15 = 0, i16 = 0, i17 = 0, i18 = 0, i19 = 0, i20 = 0, i21 = 0, i22 = 0, i23 = 0, i24 = 0, i25 = 0, i26 = 0, i27 = 0, i28 = 0, i29 = 0, i30 = 0, i31 = 0, i32 = 0, i33 = 0, i34 = 0;
  i2 = i1 + 44 | 0;
  i3 = HEAP32[(i2 & 16777215) >> 2] | 0;
  i4 = i1 + 60 | 0;
  i5 = i1 + 116 | 0;
  i6 = i1 + 108 | 0;
  i7 = i3 - 262 | 0;
  i8 = i1 | 0;
  i9 = i1 + 56 | 0;
  i10 = i1 + 5812 | 0;
  i11 = i1 + 72 | 0;
  i12 = i1 + 88 | 0;
  i13 = i1 + 84 | 0;
  i14 = i1 + 68 | 0;
  i15 = i1 + 52 | 0;
  i16 = i1 + 64 | 0;
  i17 = i1 + 112 | 0;
  i18 = i1 + 92 | 0;
  i19 = i1 + 76 | 0;
  i20 = HEAP32[(i5 & 16777215) >> 2] | 0;
  i21 = i3;
  while (1) {
    i22 = HEAP32[(i6 & 16777215) >> 2] | 0;
    i23 = HEAP32[(i4 & 16777215) >> 2] - i20 - i22 | 0;
    if (i22 >>> 0 < (i7 + i21 | 0) >>> 0) {
      i24 = i23;
    } else {
      i22 = HEAP32[(i9 & 16777215) >> 2] | 0;
      _memcpy(i22 | 0, i22 + i3 | 0, i3 | 0, 1 | 0);
      HEAP32[(i17 & 16777215) >> 2] = HEAP32[(i17 & 16777215) >> 2] - i3 | 0;
      HEAP32[(i6 & 16777215) >> 2] = HEAP32[(i6 & 16777215) >> 2] - i3 | 0;
      HEAP32[(i18 & 16777215) >> 2] = HEAP32[(i18 & 16777215) >> 2] - i3 | 0;
      i22 = HEAP32[(i19 & 16777215) >> 2] | 0;
      i25 = i22;
      i26 = (i22 << 1) + HEAP32[(i14 & 16777215) >> 2] | 0;
      while (1) {
        i22 = i26 - 2 | 0;
        i27 = HEAPU16[(i22 & 16777215) >> 1];
        if (i27 >>> 0 < i3 >>> 0) {
          i28 = 0;
        } else {
          i28 = i27 - i3 & 65535;
        }
        HEAP16[(i22 & 16777215) >> 1] = i28;
        i27 = i25 - 1 | 0;
        if ((i27 | 0) == 0) {
          break;
        } else {
          i25 = i27;
          i26 = i22;
        }
      }
      i26 = i3;
      i25 = (i3 << 1) + HEAP32[(i16 & 16777215) >> 2] | 0;
      while (1) {
        i22 = i25 - 2 | 0;
        i27 = HEAPU16[(i22 & 16777215) >> 1];
        if (i27 >>> 0 < i3 >>> 0) {
          i29 = 0;
        } else {
          i29 = i27 - i3 & 65535;
        }
        HEAP16[(i22 & 16777215) >> 1] = i29;
        i27 = i26 - 1 | 0;
        if ((i27 | 0) == 0) {
          break;
        } else {
          i26 = i27;
          i25 = i22;
        }
      }
      i24 = i23 + i3 | 0;
    }
    i25 = HEAP32[(i8 & 16777215) >> 2] | 0;
    if ((HEAP32[(i25 + 4 & 16777215) >> 2] | 0) == 0) {
      break;
    }
    i26 = _read_buf(i25, HEAP32[(i9 & 16777215) >> 2] + HEAP32[(i5 & 16777215) >> 2] + HEAP32[(i6 & 16777215) >> 2] | 0, i24) + HEAP32[(i5 & 16777215) >> 2] | 0;
    HEAP32[(i5 & 16777215) >> 2] = i26;
    i25 = HEAP32[(i10 & 16777215) >> 2] | 0;
    i22 = (i26 + i25 | 0) >>> 0 > 2;
    L158 : do {
      if (i22) {
        i27 = HEAP32[(i6 & 16777215) >> 2] - i25 | 0;
        i30 = HEAP32[(i9 & 16777215) >> 2] | 0;
        i31 = HEAPU8[i30 + i27 & 16777215];
        HEAP32[(i11 & 16777215) >> 2] = i31;
        HEAP32[(i11 & 16777215) >> 2] = (HEAPU8[i27 + (i30 + 1) & 16777215] ^ i31 << HEAP32[(i12 & 16777215) >> 2]) & HEAP32[(i13 & 16777215) >> 2];
        i31 = i27;
        i27 = i25;
        i30 = i26;
        while (1) {
          if ((i27 | 0) == 0) {
            i32 = i30;
            break L158;
          }
          i33 = (HEAPU8[HEAP32[(i9 & 16777215) >> 2] + i31 + 2 & 16777215] ^ HEAP32[(i11 & 16777215) >> 2] << HEAP32[(i12 & 16777215) >> 2]) & HEAP32[(i13 & 16777215) >> 2];
          HEAP32[(i11 & 16777215) >> 2] = i33;
          HEAP16[(((HEAP32[(i15 & 16777215) >> 2] & i31) << 1) + HEAP32[(i16 & 16777215) >> 2] & 16777215) >> 1] = HEAP16[((i33 << 1) + HEAP32[(i14 & 16777215) >> 2] & 16777215) >> 1] | 0;
          HEAP16[((HEAP32[(i11 & 16777215) >> 2] << 1) + HEAP32[(i14 & 16777215) >> 2] & 16777215) >> 1] = i31 & 65535;
          i33 = HEAP32[(i10 & 16777215) >> 2] - 1 | 0;
          HEAP32[(i10 & 16777215) >> 2] = i33;
          i34 = HEAP32[(i5 & 16777215) >> 2] | 0;
          if ((i34 + i33 | 0) >>> 0 < 3) {
            i32 = i34;
            break L158;
          } else {
            i31 = i31 + 1 | 0;
            i27 = i33;
            i30 = i34;
          }
        }
      } else {
        i32 = i26;
      }
    } while (0);
    if (i32 >>> 0 >= 262) {
      break;
    }
    if ((HEAP32[(HEAP32[(i8 & 16777215) >> 2] + 4 & 16777215) >> 2] | 0) == 0) {
      break;
    }
    i20 = i32;
    i21 = HEAP32[(i2 & 16777215) >> 2] | 0;
  }
  i2 = i1 + 5824 | 0;
  i1 = HEAP32[(i2 & 16777215) >> 2] | 0;
  i21 = HEAP32[(i4 & 16777215) >> 2] | 0;
  if (i1 >>> 0 >= i21 >>> 0) {
    return;
  }
  i4 = HEAP32[(i5 & 16777215) >> 2] + HEAP32[(i6 & 16777215) >> 2] | 0;
  if (i1 >>> 0 < i4 >>> 0) {
    i6 = i21 - i4 | 0;
    i5 = i6 >>> 0 > 258 ? 258 : i6;
    _memset(HEAP32[(i9 & 16777215) >> 2] + i4 | 0, 0 | 0, i5 | 0, 1 | 0);
    HEAP32[(i2 & 16777215) >> 2] = i5 + i4 | 0;
    return;
  }
  i5 = i4 + 258 | 0;
  if (i1 >>> 0 >= i5 >>> 0) {
    return;
  }
  i4 = i5 - i1 | 0;
  i5 = i21 - i1 | 0;
  i21 = i4 >>> 0 > i5 >>> 0 ? i5 : i4;
  _memset(HEAP32[(i9 & 16777215) >> 2] + i1 | 0, 0 | 0, i21 | 0, 1 | 0);
  HEAP32[(i2 & 16777215) >> 2] = HEAP32[(i2 & 16777215) >> 2] + i21 | 0;
  return;
}
function _deflateResetKeep(i1) {
  i1 = i1 | 0;
  var i2 = 0, i3 = 0, i4 = 0, i5 = 0, i6 = 0, i7 = 0, i8 = 0;
  if ((i1 | 0) == 0) {
    i2 = -2;
    return i2 | 0;
  }
  i3 = HEAP32[(i1 + 28 & 16777215) >> 2] | 0;
  if ((i3 | 0) == 0) {
    i2 = -2;
    return i2 | 0;
  }
  if ((HEAP32[(i1 + 32 & 16777215) >> 2] | 0) == 0) {
    i2 = -2;
    return i2 | 0;
  }
  if ((HEAP32[(i1 + 36 & 16777215) >> 2] | 0) == 0) {
    i2 = -2;
    return i2 | 0;
  }
  HEAP32[(i1 + 20 & 16777215) >> 2] = 0;
  HEAP32[(i1 + 8 & 16777215) >> 2] = 0;
  HEAP32[(i1 + 24 & 16777215) >> 2] = 0;
  HEAP32[(i1 + 44 & 16777215) >> 2] = 2;
  HEAP32[(i3 + 20 & 16777215) >> 2] = 0;
  HEAP32[(i3 + 16 & 16777215) >> 2] = HEAP32[(i3 + 8 & 16777215) >> 2] | 0;
  i4 = i3 + 24 | 0;
  i5 = HEAP32[(i4 & 16777215) >> 2] | 0;
  if ((i5 | 0) < 0) {
    i6 = -i5 | 0;
    HEAP32[(i4 & 16777215) >> 2] = i6;
    i7 = i6;
  } else {
    i7 = i5;
  }
  HEAP32[(i3 + 4 & 16777215) >> 2] = (i7 | 0) != 0 ? 42 : 113;
  if ((i7 | 0) == 2) {
    i8 = _crc32(0, 0, 0);
  } else {
    i8 = _adler32(0, 0, 0);
  }
  HEAP32[(i1 + 48 & 16777215) >> 2] = i8;
  HEAP32[(i3 + 40 & 16777215) >> 2] = 0;
  __tr_init(i3);
  i2 = 0;
  return i2 | 0;
}
function _lm_init(i1) {
  i1 = i1 | 0;
  var i2 = 0, i3 = 0;
  HEAP32[(i1 + 60 & 16777215) >> 2] = HEAP32[(i1 + 44 & 16777215) >> 2] << 1;
  i2 = i1 + 76 | 0;
  i3 = i1 + 68 | 0;
  HEAP16[((HEAP32[(i2 & 16777215) >> 2] - 1 << 1) + HEAP32[(i3 & 16777215) >> 2] & 16777215) >> 1] = 0;
  _memset(HEAP32[(i3 & 16777215) >> 2] | 0, 0 | 0, (HEAP32[(i2 & 16777215) >> 2] << 1) - 2 | 0, 1 | 0);
  i2 = HEAP32[(i1 + 132 & 16777215) >> 2] | 0;
  HEAP32[(i1 + 128 & 16777215) >> 2] = HEAPU16[(i2 * 12 + 5255214 & 16777215) >> 1];
  HEAP32[(i1 + 140 & 16777215) >> 2] = HEAPU16[(i2 * 12 + 5255212 & 16777215) >> 1];
  HEAP32[(i1 + 144 & 16777215) >> 2] = HEAPU16[(i2 * 12 + 5255216 & 16777215) >> 1];
  HEAP32[(i1 + 124 & 16777215) >> 2] = HEAPU16[(i2 * 12 + 5255218 & 16777215) >> 1];
  HEAP32[(i1 + 108 & 16777215) >> 2] = 0;
  HEAP32[(i1 + 92 & 16777215) >> 2] = 0;
  HEAP32[(i1 + 116 & 16777215) >> 2] = 0;
  HEAP32[(i1 + 5812 & 16777215) >> 2] = 0;
  HEAP32[(i1 + 120 & 16777215) >> 2] = 2;
  HEAP32[(i1 + 96 & 16777215) >> 2] = 2;
  HEAP32[(i1 + 104 & 16777215) >> 2] = 0;
  HEAP32[(i1 + 72 & 16777215) >> 2] = 0;
  return;
}
function _deflate(i1, i2) {
  i1 = i1 | 0;
  i2 = i2 | 0;
  var i3 = 0, i4 = 0, i5 = 0, i6 = 0, i7 = 0, i8 = 0, i9 = 0, i10 = 0, i11 = 0, i12 = 0, i13 = 0, i14 = 0, i15 = 0, i16 = 0, i17 = 0, i18 = 0, i19 = 0, i20 = 0, i21 = 0, i22 = 0, i23 = 0, i24 = 0, i25 = 0, i26 = 0, i27 = 0, i28 = 0, i29 = 0, i30 = 0, i31 = 0, i32 = 0, i33 = 0, i34 = 0, i35 = 0, i36 = 0, i37 = 0, i38 = 0, i39 = 0, i40 = 0, i41 = 0, i42 = 0, i43 = 0, i44 = 0, i45 = 0, i46 = 0, i47 = 0, i48 = 0, i49 = 0, i50 = 0, i51 = 0, i52 = 0, i53 = 0, i54 = 0, i55 = 0, i56 = 0, i57 = 0, i58 = 0, i59 = 0, i60 = 0, i61 = 0;
  if ((i1 | 0) == 0) {
    i3 = -2;
    return i3 | 0;
  }
  i4 = HEAP32[(i1 + 28 & 16777215) >> 2] | 0;
  if ((i4 | 0) == 0 | i2 >>> 0 > 5) {
    i3 = -2;
    return i3 | 0;
  }
  do {
    if ((HEAP32[(i1 + 12 & 16777215) >> 2] | 0) != 0) {
      if ((HEAP32[(i1 & 16777215) >> 2] | 0) == 0) {
        if ((HEAP32[(i1 + 4 & 16777215) >> 2] | 0) != 0) {
          break;
        }
      }
      i5 = i4 + 4 | 0;
      i6 = HEAP32[(i5 & 16777215) >> 2] | 0;
      i7 = (i2 | 0) == 4;
      if (!((i6 | 0) != 666 | i7)) {
        break;
      }
      i8 = i1 + 16 | 0;
      if ((HEAP32[(i8 & 16777215) >> 2] | 0) == 0) {
        HEAP32[(i1 + 24 & 16777215) >> 2] = 5255716 | 0;
        i3 = -5;
        return i3 | 0;
      }
      HEAP32[(i4 & 16777215) >> 2] = i1;
      i9 = i4 + 40 | 0;
      i10 = HEAP32[(i9 & 16777215) >> 2] | 0;
      HEAP32[(i9 & 16777215) >> 2] = i2;
      do {
        if ((i6 | 0) == 42) {
          if ((HEAP32[(i4 + 24 & 16777215) >> 2] | 0) != 2) {
            i11 = (HEAP32[(i4 + 48 & 16777215) >> 2] << 12) - 30720 | 0;
            do {
              if ((HEAP32[(i4 + 136 & 16777215) >> 2] | 0) > 1) {
                i12 = 0;
              } else {
                i13 = HEAP32[(i4 + 132 & 16777215) >> 2] | 0;
                if ((i13 | 0) < 2) {
                  i12 = 0;
                  break;
                }
                if ((i13 | 0) < 6) {
                  i12 = 64;
                  break;
                }
                i12 = (i13 | 0) == 6 ? 128 : 192;
              }
            } while (0);
            i13 = i12 | i11;
            i14 = i4 + 108 | 0;
            i15 = (HEAP32[(i14 & 16777215) >> 2] | 0) == 0 ? i13 : i13 | 32;
            HEAP32[(i5 & 16777215) >> 2] = 113;
            _putShortMSB(i4, (i15 | (i15 >>> 0) % 31) ^ 31);
            i15 = i1 + 48 | 0;
            if ((HEAP32[(i14 & 16777215) >> 2] | 0) != 0) {
              _putShortMSB(i4, (HEAP32[(i15 & 16777215) >> 2] | 0) >>> 16);
              _putShortMSB(i4, HEAP32[(i15 & 16777215) >> 2] & 65535);
            }
            HEAP32[(i15 & 16777215) >> 2] = _adler32(0, 0, 0);
            i16 = HEAP32[(i5 & 16777215) >> 2] | 0;
            i17 = 192;
            break;
          }
          i15 = i1 + 48 | 0;
          HEAP32[(i15 & 16777215) >> 2] = _crc32(0, 0, 0);
          i14 = i4 + 20 | 0;
          i13 = HEAP32[(i14 & 16777215) >> 2] | 0;
          HEAP32[(i14 & 16777215) >> 2] = i13 + 1 | 0;
          i18 = i4 + 8 | 0;
          HEAP8[HEAP32[(i18 & 16777215) >> 2] + i13 & 16777215] = 31;
          i13 = HEAP32[(i14 & 16777215) >> 2] | 0;
          HEAP32[(i14 & 16777215) >> 2] = i13 + 1 | 0;
          HEAP8[HEAP32[(i18 & 16777215) >> 2] + i13 & 16777215] = -117;
          i13 = HEAP32[(i14 & 16777215) >> 2] | 0;
          HEAP32[(i14 & 16777215) >> 2] = i13 + 1 | 0;
          HEAP8[HEAP32[(i18 & 16777215) >> 2] + i13 & 16777215] = 8;
          i13 = i4 + 28 | 0;
          i19 = HEAP32[(i13 & 16777215) >> 2] | 0;
          if ((i19 | 0) == 0) {
            i20 = HEAP32[(i14 & 16777215) >> 2] | 0;
            HEAP32[(i14 & 16777215) >> 2] = i20 + 1 | 0;
            HEAP8[HEAP32[(i18 & 16777215) >> 2] + i20 & 16777215] = 0;
            i20 = HEAP32[(i14 & 16777215) >> 2] | 0;
            HEAP32[(i14 & 16777215) >> 2] = i20 + 1 | 0;
            HEAP8[HEAP32[(i18 & 16777215) >> 2] + i20 & 16777215] = 0;
            i20 = HEAP32[(i14 & 16777215) >> 2] | 0;
            HEAP32[(i14 & 16777215) >> 2] = i20 + 1 | 0;
            HEAP8[HEAP32[(i18 & 16777215) >> 2] + i20 & 16777215] = 0;
            i20 = HEAP32[(i14 & 16777215) >> 2] | 0;
            HEAP32[(i14 & 16777215) >> 2] = i20 + 1 | 0;
            HEAP8[HEAP32[(i18 & 16777215) >> 2] + i20 & 16777215] = 0;
            i20 = HEAP32[(i14 & 16777215) >> 2] | 0;
            HEAP32[(i14 & 16777215) >> 2] = i20 + 1 | 0;
            HEAP8[HEAP32[(i18 & 16777215) >> 2] + i20 & 16777215] = 0;
            i20 = HEAP32[(i4 + 132 & 16777215) >> 2] | 0;
            do {
              if ((i20 | 0) == 9) {
                i21 = 2;
              } else {
                if ((HEAP32[(i4 + 136 & 16777215) >> 2] | 0) > 1) {
                  i21 = 4;
                  break;
                }
                i21 = (i20 | 0) < 2 ? 4 : 0;
              }
            } while (0);
            i20 = HEAP32[(i14 & 16777215) >> 2] | 0;
            HEAP32[(i14 & 16777215) >> 2] = i20 + 1 | 0;
            HEAP8[HEAP32[(i18 & 16777215) >> 2] + i20 & 16777215] = i21;
            i20 = HEAP32[(i14 & 16777215) >> 2] | 0;
            HEAP32[(i14 & 16777215) >> 2] = i20 + 1 | 0;
            HEAP8[HEAP32[(i18 & 16777215) >> 2] + i20 & 16777215] = 3;
            HEAP32[(i5 & 16777215) >> 2] = 113;
            break;
          }
          i20 = ((HEAP32[(i19 + 44 & 16777215) >> 2] | 0) != 0 ? 2 : 0) | (HEAP32[(i19 & 16777215) >> 2] | 0) != 0 & 1 | ((HEAP32[(i19 + 16 & 16777215) >> 2] | 0) == 0 ? 0 : 4) | ((HEAP32[(i19 + 28 & 16777215) >> 2] | 0) == 0 ? 0 : 8) | ((HEAP32[(i19 + 36 & 16777215) >> 2] | 0) == 0 ? 0 : 16);
          i11 = HEAP32[(i14 & 16777215) >> 2] | 0;
          HEAP32[(i14 & 16777215) >> 2] = i11 + 1 | 0;
          HEAP8[HEAP32[(i18 & 16777215) >> 2] + i11 & 16777215] = i20;
          i20 = HEAP32[(HEAP32[(i13 & 16777215) >> 2] + 4 & 16777215) >> 2] & 255;
          i11 = HEAP32[(i14 & 16777215) >> 2] | 0;
          HEAP32[(i14 & 16777215) >> 2] = i11 + 1 | 0;
          HEAP8[HEAP32[(i18 & 16777215) >> 2] + i11 & 16777215] = i20;
          i20 = (HEAP32[(HEAP32[(i13 & 16777215) >> 2] + 4 & 16777215) >> 2] | 0) >>> 8 & 255;
          i11 = HEAP32[(i14 & 16777215) >> 2] | 0;
          HEAP32[(i14 & 16777215) >> 2] = i11 + 1 | 0;
          HEAP8[HEAP32[(i18 & 16777215) >> 2] + i11 & 16777215] = i20;
          i20 = (HEAP32[(HEAP32[(i13 & 16777215) >> 2] + 4 & 16777215) >> 2] | 0) >>> 16 & 255;
          i11 = HEAP32[(i14 & 16777215) >> 2] | 0;
          HEAP32[(i14 & 16777215) >> 2] = i11 + 1 | 0;
          HEAP8[HEAP32[(i18 & 16777215) >> 2] + i11 & 16777215] = i20;
          i20 = (HEAP32[(HEAP32[(i13 & 16777215) >> 2] + 4 & 16777215) >> 2] | 0) >>> 24 & 255;
          i11 = HEAP32[(i14 & 16777215) >> 2] | 0;
          HEAP32[(i14 & 16777215) >> 2] = i11 + 1 | 0;
          HEAP8[HEAP32[(i18 & 16777215) >> 2] + i11 & 16777215] = i20;
          i20 = HEAP32[(i4 + 132 & 16777215) >> 2] | 0;
          do {
            if ((i20 | 0) == 9) {
              i22 = 2;
            } else {
              if ((HEAP32[(i4 + 136 & 16777215) >> 2] | 0) > 1) {
                i22 = 4;
                break;
              }
              i22 = (i20 | 0) < 2 ? 4 : 0;
            }
          } while (0);
          i20 = HEAP32[(i14 & 16777215) >> 2] | 0;
          HEAP32[(i14 & 16777215) >> 2] = i20 + 1 | 0;
          HEAP8[HEAP32[(i18 & 16777215) >> 2] + i20 & 16777215] = i22;
          i20 = HEAP32[(HEAP32[(i13 & 16777215) >> 2] + 12 & 16777215) >> 2] & 255;
          i19 = HEAP32[(i14 & 16777215) >> 2] | 0;
          HEAP32[(i14 & 16777215) >> 2] = i19 + 1 | 0;
          HEAP8[HEAP32[(i18 & 16777215) >> 2] + i19 & 16777215] = i20;
          i20 = HEAP32[(i13 & 16777215) >> 2] | 0;
          if ((HEAP32[(i20 + 16 & 16777215) >> 2] | 0) == 0) {
            i23 = i20;
          } else {
            i19 = HEAP32[(i20 + 20 & 16777215) >> 2] & 255;
            i20 = HEAP32[(i14 & 16777215) >> 2] | 0;
            HEAP32[(i14 & 16777215) >> 2] = i20 + 1 | 0;
            HEAP8[HEAP32[(i18 & 16777215) >> 2] + i20 & 16777215] = i19;
            i19 = (HEAP32[(HEAP32[(i13 & 16777215) >> 2] + 20 & 16777215) >> 2] | 0) >>> 8 & 255;
            i20 = HEAP32[(i14 & 16777215) >> 2] | 0;
            HEAP32[(i14 & 16777215) >> 2] = i20 + 1 | 0;
            HEAP8[HEAP32[(i18 & 16777215) >> 2] + i20 & 16777215] = i19;
            i23 = HEAP32[(i13 & 16777215) >> 2] | 0;
          }
          if ((HEAP32[(i23 + 44 & 16777215) >> 2] | 0) != 0) {
            HEAP32[(i15 & 16777215) >> 2] = _crc32(HEAP32[(i15 & 16777215) >> 2] | 0, HEAP32[(i18 & 16777215) >> 2] | 0, HEAP32[(i14 & 16777215) >> 2] | 0);
          }
          HEAP32[(i4 + 32 & 16777215) >> 2] = 0;
          HEAP32[(i5 & 16777215) >> 2] = 69;
          i24 = i13;
          i17 = 194;
          break;
        } else {
          i16 = i6;
          i17 = 192;
        }
      } while (0);
      do {
        if (i17 == 192) {
          if ((i16 | 0) != 69) {
            i25 = i16;
            i17 = 212;
            break;
          }
          i24 = i4 + 28 | 0;
          i17 = 194;
          break;
        }
      } while (0);
      do {
        if (i17 == 194) {
          i6 = HEAP32[(i24 & 16777215) >> 2] | 0;
          if ((HEAP32[(i6 + 16 & 16777215) >> 2] | 0) == 0) {
            HEAP32[(i5 & 16777215) >> 2] = 73;
            i26 = i6;
            i17 = 214;
            break;
          }
          i19 = i4 + 20 | 0;
          i20 = HEAP32[(i19 & 16777215) >> 2] | 0;
          i11 = i4 + 32 | 0;
          i27 = HEAP32[(i11 & 16777215) >> 2] | 0;
          i28 = i27 >>> 0 < (HEAP32[(i6 + 20 & 16777215) >> 2] & 65535) >>> 0;
          L255 : do {
            if (i28) {
              i29 = i4 + 12 | 0;
              i30 = i1 + 48 | 0;
              i31 = i4 + 8 | 0;
              i32 = i20;
              i33 = i6;
              i34 = i20;
              i35 = i27;
              while (1) {
                if ((i34 | 0) == (HEAP32[(i29 & 16777215) >> 2] | 0)) {
                  if ((HEAP32[(i33 + 44 & 16777215) >> 2] | 0) != 0 & i34 >>> 0 > i32 >>> 0) {
                    HEAP32[(i30 & 16777215) >> 2] = _crc32(HEAP32[(i30 & 16777215) >> 2] | 0, HEAP32[(i31 & 16777215) >> 2] + i32 | 0, i34 - i32 | 0);
                  }
                  _flush_pending(i1);
                  i36 = HEAP32[(i19 & 16777215) >> 2] | 0;
                  if ((i36 | 0) == (HEAP32[(i29 & 16777215) >> 2] | 0)) {
                    break;
                  }
                  i37 = i36;
                  i38 = i36;
                  i39 = HEAP32[(i11 & 16777215) >> 2] | 0;
                  i40 = HEAP32[(i24 & 16777215) >> 2] | 0;
                } else {
                  i37 = i32;
                  i38 = i34;
                  i39 = i35;
                  i40 = i33;
                }
                i41 = HEAP8[HEAP32[(i40 + 16 & 16777215) >> 2] + i39 & 16777215] | 0;
                HEAP32[(i19 & 16777215) >> 2] = i38 + 1 | 0;
                HEAP8[HEAP32[(i31 & 16777215) >> 2] + i38 & 16777215] = i41;
                i41 = HEAP32[(i11 & 16777215) >> 2] + 1 | 0;
                HEAP32[(i11 & 16777215) >> 2] = i41;
                i42 = HEAP32[(i24 & 16777215) >> 2] | 0;
                if (i41 >>> 0 >= (HEAP32[(i42 + 20 & 16777215) >> 2] & 65535) >>> 0) {
                  i43 = i37;
                  i44 = i42;
                  break L255;
                }
                i32 = i37;
                i33 = i42;
                i34 = HEAP32[(i19 & 16777215) >> 2] | 0;
                i35 = i41;
              }
              i43 = i36;
              i44 = HEAP32[(i24 & 16777215) >> 2] | 0;
            } else {
              i43 = i20;
              i44 = i6;
            }
          } while (0);
          do {
            if ((HEAP32[(i44 + 44 & 16777215) >> 2] | 0) == 0) {
              i45 = i44;
            } else {
              i6 = HEAP32[(i19 & 16777215) >> 2] | 0;
              if (i6 >>> 0 <= i43 >>> 0) {
                i45 = i44;
                break;
              }
              i20 = i1 + 48 | 0;
              HEAP32[(i20 & 16777215) >> 2] = _crc32(HEAP32[(i20 & 16777215) >> 2] | 0, HEAP32[(i4 + 8 & 16777215) >> 2] + i43 | 0, i6 - i43 | 0);
              i45 = HEAP32[(i24 & 16777215) >> 2] | 0;
            }
          } while (0);
          if ((HEAP32[(i11 & 16777215) >> 2] | 0) == (HEAP32[(i45 + 20 & 16777215) >> 2] | 0)) {
            HEAP32[(i11 & 16777215) >> 2] = 0;
            HEAP32[(i5 & 16777215) >> 2] = 73;
            i26 = i45;
            i17 = 214;
            break;
          } else {
            i25 = HEAP32[(i5 & 16777215) >> 2] | 0;
            i17 = 212;
            break;
          }
        }
      } while (0);
      do {
        if (i17 == 212) {
          if ((i25 | 0) != 73) {
            i46 = i25;
            i17 = 229;
            break;
          }
          i26 = HEAP32[(i4 + 28 & 16777215) >> 2] | 0;
          i17 = 214;
          break;
        }
      } while (0);
      do {
        if (i17 == 214) {
          i19 = i4 + 28 | 0;
          if ((HEAP32[(i26 + 28 & 16777215) >> 2] | 0) == 0) {
            HEAP32[(i5 & 16777215) >> 2] = 91;
            i47 = i19;
            i17 = 231;
            break;
          }
          i6 = i4 + 20 | 0;
          i20 = HEAP32[(i6 & 16777215) >> 2] | 0;
          i27 = i4 + 12 | 0;
          i28 = i1 + 48 | 0;
          i13 = i4 + 8 | 0;
          i14 = i4 + 32 | 0;
          i18 = i20;
          i15 = i20;
          while (1) {
            if ((i15 | 0) == (HEAP32[(i27 & 16777215) >> 2] | 0)) {
              if ((HEAP32[(HEAP32[(i19 & 16777215) >> 2] + 44 & 16777215) >> 2] | 0) != 0 & i15 >>> 0 > i18 >>> 0) {
                HEAP32[(i28 & 16777215) >> 2] = _crc32(HEAP32[(i28 & 16777215) >> 2] | 0, HEAP32[(i13 & 16777215) >> 2] + i18 | 0, i15 - i18 | 0);
              }
              _flush_pending(i1);
              i20 = HEAP32[(i6 & 16777215) >> 2] | 0;
              if ((i20 | 0) == (HEAP32[(i27 & 16777215) >> 2] | 0)) {
                i48 = 1;
                i49 = i20;
                break;
              } else {
                i50 = i20;
                i51 = i20;
              }
            } else {
              i50 = i18;
              i51 = i15;
            }
            i20 = HEAP32[(i14 & 16777215) >> 2] | 0;
            HEAP32[(i14 & 16777215) >> 2] = i20 + 1 | 0;
            i35 = HEAP8[HEAP32[(HEAP32[(i19 & 16777215) >> 2] + 28 & 16777215) >> 2] + i20 & 16777215] | 0;
            HEAP32[(i6 & 16777215) >> 2] = i51 + 1 | 0;
            HEAP8[HEAP32[(i13 & 16777215) >> 2] + i51 & 16777215] = i35;
            if (i35 << 24 >> 24 == 0) {
              i48 = i35 & 255;
              i49 = i50;
              break;
            }
            i18 = i50;
            i15 = HEAP32[(i6 & 16777215) >> 2] | 0;
          }
          do {
            if ((HEAP32[(HEAP32[(i19 & 16777215) >> 2] + 44 & 16777215) >> 2] | 0) != 0) {
              i15 = HEAP32[(i6 & 16777215) >> 2] | 0;
              if (i15 >>> 0 <= i49 >>> 0) {
                break;
              }
              HEAP32[(i28 & 16777215) >> 2] = _crc32(HEAP32[(i28 & 16777215) >> 2] | 0, HEAP32[(i13 & 16777215) >> 2] + i49 | 0, i15 - i49 | 0);
            }
          } while (0);
          if ((i48 | 0) == 0) {
            HEAP32[(i14 & 16777215) >> 2] = 0;
            HEAP32[(i5 & 16777215) >> 2] = 91;
            i47 = i19;
            i17 = 231;
            break;
          } else {
            i46 = HEAP32[(i5 & 16777215) >> 2] | 0;
            i17 = 229;
            break;
          }
        }
      } while (0);
      do {
        if (i17 == 229) {
          if ((i46 | 0) != 91) {
            i52 = i46;
            i17 = 246;
            break;
          }
          i47 = i4 + 28 | 0;
          i17 = 231;
          break;
        }
      } while (0);
      do {
        if (i17 == 231) {
          if ((HEAP32[(HEAP32[(i47 & 16777215) >> 2] + 36 & 16777215) >> 2] | 0) == 0) {
            HEAP32[(i5 & 16777215) >> 2] = 103;
            i53 = i47;
            i17 = 248;
            break;
          }
          i13 = i4 + 20 | 0;
          i28 = HEAP32[(i13 & 16777215) >> 2] | 0;
          i6 = i4 + 12 | 0;
          i15 = i1 + 48 | 0;
          i18 = i4 + 8 | 0;
          i27 = i4 + 32 | 0;
          i11 = i28;
          i35 = i28;
          while (1) {
            if ((i35 | 0) == (HEAP32[(i6 & 16777215) >> 2] | 0)) {
              if ((HEAP32[(HEAP32[(i47 & 16777215) >> 2] + 44 & 16777215) >> 2] | 0) != 0 & i35 >>> 0 > i11 >>> 0) {
                HEAP32[(i15 & 16777215) >> 2] = _crc32(HEAP32[(i15 & 16777215) >> 2] | 0, HEAP32[(i18 & 16777215) >> 2] + i11 | 0, i35 - i11 | 0);
              }
              _flush_pending(i1);
              i28 = HEAP32[(i13 & 16777215) >> 2] | 0;
              if ((i28 | 0) == (HEAP32[(i6 & 16777215) >> 2] | 0)) {
                i54 = 1;
                i55 = i28;
                break;
              } else {
                i56 = i28;
                i57 = i28;
              }
            } else {
              i56 = i11;
              i57 = i35;
            }
            i28 = HEAP32[(i27 & 16777215) >> 2] | 0;
            HEAP32[(i27 & 16777215) >> 2] = i28 + 1 | 0;
            i20 = HEAP8[HEAP32[(HEAP32[(i47 & 16777215) >> 2] + 36 & 16777215) >> 2] + i28 & 16777215] | 0;
            HEAP32[(i13 & 16777215) >> 2] = i57 + 1 | 0;
            HEAP8[HEAP32[(i18 & 16777215) >> 2] + i57 & 16777215] = i20;
            if (i20 << 24 >> 24 == 0) {
              i54 = i20 & 255;
              i55 = i56;
              break;
            }
            i11 = i56;
            i35 = HEAP32[(i13 & 16777215) >> 2] | 0;
          }
          do {
            if ((HEAP32[(HEAP32[(i47 & 16777215) >> 2] + 44 & 16777215) >> 2] | 0) != 0) {
              i35 = HEAP32[(i13 & 16777215) >> 2] | 0;
              if (i35 >>> 0 <= i55 >>> 0) {
                break;
              }
              HEAP32[(i15 & 16777215) >> 2] = _crc32(HEAP32[(i15 & 16777215) >> 2] | 0, HEAP32[(i18 & 16777215) >> 2] + i55 | 0, i35 - i55 | 0);
            }
          } while (0);
          if ((i54 | 0) == 0) {
            HEAP32[(i5 & 16777215) >> 2] = 103;
            i53 = i47;
            i17 = 248;
            break;
          } else {
            i52 = HEAP32[(i5 & 16777215) >> 2] | 0;
            i17 = 246;
            break;
          }
        }
      } while (0);
      do {
        if (i17 == 246) {
          if ((i52 | 0) != 103) {
            break;
          }
          i53 = i4 + 28 | 0;
          i17 = 248;
          break;
        }
      } while (0);
      do {
        if (i17 == 248) {
          if ((HEAP32[(HEAP32[(i53 & 16777215) >> 2] + 44 & 16777215) >> 2] | 0) == 0) {
            HEAP32[(i5 & 16777215) >> 2] = 113;
            break;
          }
          i18 = i4 + 20 | 0;
          i15 = HEAP32[(i18 & 16777215) >> 2] | 0;
          i13 = i4 + 12 | 0;
          i35 = HEAP32[(i13 & 16777215) >> 2] | 0;
          if ((i15 + 2 | 0) >>> 0 > i35 >>> 0) {
            _flush_pending(i1);
            i58 = HEAP32[(i18 & 16777215) >> 2] | 0;
            i59 = HEAP32[(i13 & 16777215) >> 2] | 0;
          } else {
            i58 = i15;
            i59 = i35;
          }
          if ((i58 + 2 | 0) >>> 0 > i59 >>> 0) {
            break;
          }
          i35 = i1 + 48 | 0;
          i15 = HEAP32[(i35 & 16777215) >> 2] & 255;
          HEAP32[(i18 & 16777215) >> 2] = i58 + 1 | 0;
          i13 = i4 + 8 | 0;
          HEAP8[HEAP32[(i13 & 16777215) >> 2] + i58 & 16777215] = i15;
          i15 = (HEAP32[(i35 & 16777215) >> 2] | 0) >>> 8 & 255;
          i11 = HEAP32[(i18 & 16777215) >> 2] | 0;
          HEAP32[(i18 & 16777215) >> 2] = i11 + 1 | 0;
          HEAP8[HEAP32[(i13 & 16777215) >> 2] + i11 & 16777215] = i15;
          HEAP32[(i35 & 16777215) >> 2] = _crc32(0, 0, 0);
          HEAP32[(i5 & 16777215) >> 2] = 113;
        }
      } while (0);
      i35 = i4 + 20 | 0;
      do {
        if ((HEAP32[(i35 & 16777215) >> 2] | 0) == 0) {
          i15 = HEAP32[(i1 + 4 & 16777215) >> 2] | 0;
          if ((i15 | 0) != 0) {
            i60 = i15;
            break;
          }
          if (((i2 << 1) - ((i2 | 0) > 4 ? 9 : 0) | 0) > ((i10 << 1) - ((i10 | 0) > 4 ? 9 : 0) | 0) | i7) {
            i60 = 0;
            break;
          }
          HEAP32[(i1 + 24 & 16777215) >> 2] = 5255716 | 0;
          i3 = -5;
          return i3 | 0;
        } else {
          _flush_pending(i1);
          if ((HEAP32[(i8 & 16777215) >> 2] | 0) != 0) {
            i60 = HEAP32[(i1 + 4 & 16777215) >> 2] | 0;
            break;
          }
          HEAP32[(i9 & 16777215) >> 2] = -1;
          i3 = 0;
          return i3 | 0;
        }
      } while (0);
      i10 = (HEAP32[(i5 & 16777215) >> 2] | 0) == 666;
      i15 = (i60 | 0) == 0;
      do {
        if (i10) {
          if (i15) {
            i17 = 265;
            break;
          }
          HEAP32[(i1 + 24 & 16777215) >> 2] = 5255716 | 0;
          i3 = -5;
          return i3 | 0;
        } else {
          if (i15) {
            i17 = 265;
            break;
          } else {
            i17 = 268;
            break;
          }
        }
      } while (0);
      do {
        if (i17 == 265) {
          if ((HEAP32[(i4 + 116 & 16777215) >> 2] | 0) != 0) {
            i17 = 268;
            break;
          }
          if ((i2 | 0) == 0) {
            i3 = 0;
            return i3 | 0;
          } else {
            if (i10) {
              break;
            } else {
              i17 = 268;
              break;
            }
          }
        }
      } while (0);
      do {
        if (i17 == 268) {
          i10 = HEAP32[(i4 + 136 & 16777215) >> 2] | 0;
          if ((i10 | 0) == 2) {
            i61 = _deflate_huff(i4, i2);
          } else if ((i10 | 0) == 3) {
            i61 = _deflate_rle(i4, i2);
          } else {
            i61 = FUNCTION_TABLE_iii[HEAP32[(HEAP32[(i4 + 132 & 16777215) >> 2] * 12 + 5255220 & 16777215) >> 2] & 15](i4, i2);
          }
          if ((i61 - 2 | 0) >>> 0 < 2) {
            HEAP32[(i5 & 16777215) >> 2] = 666;
          }
          if ((i61 | 0) == 2 || (i61 | 0) == 0) {
            if ((HEAP32[(i8 & 16777215) >> 2] | 0) != 0) {
              i3 = 0;
              return i3 | 0;
            }
            HEAP32[(i9 & 16777215) >> 2] = -1;
            i3 = 0;
            return i3 | 0;
          } else if ((i61 | 0) != 1) {
            break;
          }
          do {
            if ((i2 | 0) == 1) {
              __tr_align(i4);
            } else if ((i2 | 0) != 5) {
              __tr_stored_block(i4, 0, 0, 0);
              if ((i2 | 0) != 3) {
                break;
              }
              i10 = i4 + 76 | 0;
              i15 = i4 + 68 | 0;
              HEAP16[((HEAP32[(i10 & 16777215) >> 2] - 1 << 1) + HEAP32[(i15 & 16777215) >> 2] & 16777215) >> 1] = 0;
              _memset(HEAP32[(i15 & 16777215) >> 2] | 0, 0 | 0, (HEAP32[(i10 & 16777215) >> 2] << 1) - 2 | 0, 1 | 0);
              if ((HEAP32[(i4 + 116 & 16777215) >> 2] | 0) != 0) {
                break;
              }
              HEAP32[(i4 + 108 & 16777215) >> 2] = 0;
              HEAP32[(i4 + 92 & 16777215) >> 2] = 0;
              HEAP32[(i4 + 5812 & 16777215) >> 2] = 0;
            }
          } while (0);
          _flush_pending(i1);
          if ((HEAP32[(i8 & 16777215) >> 2] | 0) != 0) {
            break;
          }
          HEAP32[(i9 & 16777215) >> 2] = -1;
          i3 = 0;
          return i3 | 0;
        }
      } while (0);
      if (!i7) {
        i3 = 0;
        return i3 | 0;
      }
      i9 = i4 + 24 | 0;
      i8 = HEAP32[(i9 & 16777215) >> 2] | 0;
      if ((i8 | 0) < 1) {
        i3 = 1;
        return i3 | 0;
      }
      i5 = i1 + 48 | 0;
      i10 = HEAP32[(i5 & 16777215) >> 2] | 0;
      if ((i8 | 0) == 2) {
        i8 = HEAP32[(i35 & 16777215) >> 2] | 0;
        HEAP32[(i35 & 16777215) >> 2] = i8 + 1 | 0;
        i15 = i4 + 8 | 0;
        HEAP8[HEAP32[(i15 & 16777215) >> 2] + i8 & 16777215] = i10 & 255;
        i8 = (HEAP32[(i5 & 16777215) >> 2] | 0) >>> 8 & 255;
        i11 = HEAP32[(i35 & 16777215) >> 2] | 0;
        HEAP32[(i35 & 16777215) >> 2] = i11 + 1 | 0;
        HEAP8[HEAP32[(i15 & 16777215) >> 2] + i11 & 16777215] = i8;
        i8 = (HEAP32[(i5 & 16777215) >> 2] | 0) >>> 16 & 255;
        i11 = HEAP32[(i35 & 16777215) >> 2] | 0;
        HEAP32[(i35 & 16777215) >> 2] = i11 + 1 | 0;
        HEAP8[HEAP32[(i15 & 16777215) >> 2] + i11 & 16777215] = i8;
        i8 = (HEAP32[(i5 & 16777215) >> 2] | 0) >>> 24 & 255;
        i11 = HEAP32[(i35 & 16777215) >> 2] | 0;
        HEAP32[(i35 & 16777215) >> 2] = i11 + 1 | 0;
        HEAP8[HEAP32[(i15 & 16777215) >> 2] + i11 & 16777215] = i8;
        i8 = i1 + 8 | 0;
        i11 = HEAP32[(i8 & 16777215) >> 2] & 255;
        i13 = HEAP32[(i35 & 16777215) >> 2] | 0;
        HEAP32[(i35 & 16777215) >> 2] = i13 + 1 | 0;
        HEAP8[HEAP32[(i15 & 16777215) >> 2] + i13 & 16777215] = i11;
        i11 = (HEAP32[(i8 & 16777215) >> 2] | 0) >>> 8 & 255;
        i13 = HEAP32[(i35 & 16777215) >> 2] | 0;
        HEAP32[(i35 & 16777215) >> 2] = i13 + 1 | 0;
        HEAP8[HEAP32[(i15 & 16777215) >> 2] + i13 & 16777215] = i11;
        i11 = (HEAP32[(i8 & 16777215) >> 2] | 0) >>> 16 & 255;
        i13 = HEAP32[(i35 & 16777215) >> 2] | 0;
        HEAP32[(i35 & 16777215) >> 2] = i13 + 1 | 0;
        HEAP8[HEAP32[(i15 & 16777215) >> 2] + i13 & 16777215] = i11;
        i11 = (HEAP32[(i8 & 16777215) >> 2] | 0) >>> 24 & 255;
        i8 = HEAP32[(i35 & 16777215) >> 2] | 0;
        HEAP32[(i35 & 16777215) >> 2] = i8 + 1 | 0;
        HEAP8[HEAP32[(i15 & 16777215) >> 2] + i8 & 16777215] = i11;
      } else {
        _putShortMSB(i4, i10 >>> 16);
        _putShortMSB(i4, HEAP32[(i5 & 16777215) >> 2] & 65535);
      }
      _flush_pending(i1);
      i5 = HEAP32[(i9 & 16777215) >> 2] | 0;
      if ((i5 | 0) > 0) {
        HEAP32[(i9 & 16777215) >> 2] = -i5 | 0;
      }
      i3 = (HEAP32[(i35 & 16777215) >> 2] | 0) == 0 & 1;
      return i3 | 0;
    }
  } while (0);
  HEAP32[(i1 + 24 & 16777215) >> 2] = 5255912 | 0;
  i3 = -2;
  return i3 | 0;
}
function _putShortMSB(i1, i2) {
  i1 = i1 | 0;
  i2 = i2 | 0;
  var i3 = 0, i4 = 0, i5 = 0;
  i3 = i1 + 20 | 0;
  i4 = HEAP32[(i3 & 16777215) >> 2] | 0;
  HEAP32[(i3 & 16777215) >> 2] = i4 + 1 | 0;
  i5 = i1 + 8 | 0;
  HEAP8[HEAP32[(i5 & 16777215) >> 2] + i4 & 16777215] = i2 >>> 8 & 255;
  i4 = HEAP32[(i3 & 16777215) >> 2] | 0;
  HEAP32[(i3 & 16777215) >> 2] = i4 + 1 | 0;
  HEAP8[HEAP32[(i5 & 16777215) >> 2] + i4 & 16777215] = i2 & 255;
  return;
}
function _flush_pending(i1) {
  i1 = i1 | 0;
  var i2 = 0, i3 = 0, i4 = 0, i5 = 0, i6 = 0, i7 = 0;
  i2 = HEAP32[(i1 + 28 & 16777215) >> 2] | 0;
  __tr_flush_bits(i2);
  i3 = i2 + 20 | 0;
  i4 = HEAP32[(i3 & 16777215) >> 2] | 0;
  i5 = i1 + 16 | 0;
  i6 = HEAP32[(i5 & 16777215) >> 2] | 0;
  i7 = i4 >>> 0 > i6 >>> 0 ? i6 : i4;
  if ((i7 | 0) == 0) {
    return;
  }
  i4 = i1 + 12 | 0;
  i6 = i2 + 16 | 0;
  _memcpy(HEAP32[(i4 & 16777215) >> 2] | 0, HEAP32[(i6 & 16777215) >> 2] | 0, i7 | 0, 1 | 0);
  HEAP32[(i4 & 16777215) >> 2] = HEAP32[(i4 & 16777215) >> 2] + i7 | 0;
  HEAP32[(i6 & 16777215) >> 2] = HEAP32[(i6 & 16777215) >> 2] + i7 | 0;
  i4 = i1 + 20 | 0;
  HEAP32[(i4 & 16777215) >> 2] = HEAP32[(i4 & 16777215) >> 2] + i7 | 0;
  HEAP32[(i5 & 16777215) >> 2] = HEAP32[(i5 & 16777215) >> 2] - i7 | 0;
  i5 = HEAP32[(i3 & 16777215) >> 2] | 0;
  HEAP32[(i3 & 16777215) >> 2] = i5 - i7 | 0;
  if ((i5 | 0) != (i7 | 0)) {
    return;
  }
  HEAP32[(i6 & 16777215) >> 2] = HEAP32[(i2 + 8 & 16777215) >> 2] | 0;
  return;
}
function _deflate_huff(i1, i2) {
  i1 = i1 | 0;
  i2 = i2 | 0;
  var i3 = 0, i4 = 0, i5 = 0, i6 = 0, i7 = 0, i8 = 0, i9 = 0, i10 = 0, i11 = 0, i12 = 0, i13 = 0, i14 = 0, i15 = 0, i16 = 0, i17 = 0, i18 = 0, i19 = 0, i20 = 0;
  i3 = i1 + 116 | 0;
  i4 = i1 + 96 | 0;
  i5 = i1 + 108 | 0;
  i6 = i1 + 56 | 0;
  i7 = i1 + 5792 | 0;
  i8 = i1 + 5796 | 0;
  i9 = i1 + 5784 | 0;
  i10 = i1 + 5788 | 0;
  i11 = i1 + 92 | 0;
  i12 = i1;
  i13 = i1 | 0;
  while (1) {
    if ((HEAP32[(i3 & 16777215) >> 2] | 0) == 0) {
      _fill_window(i1);
      if ((HEAP32[(i3 & 16777215) >> 2] | 0) == 0) {
        break;
      }
    }
    HEAP32[(i4 & 16777215) >> 2] = 0;
    i14 = HEAP8[HEAP32[(i6 & 16777215) >> 2] + HEAP32[(i5 & 16777215) >> 2] & 16777215] | 0;
    HEAP16[((HEAP32[(i7 & 16777215) >> 2] << 1) + HEAP32[(i8 & 16777215) >> 2] & 16777215) >> 1] = 0;
    i15 = HEAP32[(i7 & 16777215) >> 2] | 0;
    HEAP32[(i7 & 16777215) >> 2] = i15 + 1 | 0;
    HEAP8[HEAP32[(i9 & 16777215) >> 2] + i15 & 16777215] = i14;
    i15 = ((i14 & 255) << 2) + i1 + 148 | 0;
    HEAP16[(i15 & 16777215) >> 1] = HEAP16[(i15 & 16777215) >> 1] + 1 & 65535;
    i15 = (HEAP32[(i7 & 16777215) >> 2] | 0) == (HEAP32[(i10 & 16777215) >> 2] - 1 | 0);
    HEAP32[(i3 & 16777215) >> 2] = HEAP32[(i3 & 16777215) >> 2] - 1 | 0;
    i14 = HEAP32[(i5 & 16777215) >> 2] + 1 | 0;
    HEAP32[(i5 & 16777215) >> 2] = i14;
    if (!i15) {
      continue;
    }
    i15 = HEAP32[(i11 & 16777215) >> 2] | 0;
    if ((i15 | 0) > -1) {
      i16 = HEAP32[(i6 & 16777215) >> 2] + i15 | 0;
    } else {
      i16 = 0;
    }
    __tr_flush_block(i12, i16, i14 - i15 | 0, 0);
    HEAP32[(i11 & 16777215) >> 2] = HEAP32[(i5 & 16777215) >> 2] | 0;
    _flush_pending(HEAP32[(i13 & 16777215) >> 2] | 0);
    if ((HEAP32[(HEAP32[(i13 & 16777215) >> 2] + 16 & 16777215) >> 2] | 0) == 0) {
      i17 = 0;
      i18 = 337;
      break;
    }
  }
  if (i18 == 337) {
    return i17 | 0;
  }
  if ((i2 | 0) == 0) {
    i17 = 0;
    return i17 | 0;
  }
  HEAP32[(i1 + 5812 & 16777215) >> 2] = 0;
  if ((i2 | 0) == 4) {
    i2 = HEAP32[(i11 & 16777215) >> 2] | 0;
    if ((i2 | 0) > -1) {
      i19 = HEAP32[(i6 & 16777215) >> 2] + i2 | 0;
    } else {
      i19 = 0;
    }
    __tr_flush_block(i12, i19, HEAP32[(i5 & 16777215) >> 2] - i2 | 0, 1);
    HEAP32[(i11 & 16777215) >> 2] = HEAP32[(i5 & 16777215) >> 2] | 0;
    _flush_pending(HEAP32[(i13 & 16777215) >> 2] | 0);
    i17 = (HEAP32[(HEAP32[(i13 & 16777215) >> 2] + 16 & 16777215) >> 2] | 0) == 0 ? 2 : 3;
    return i17 | 0;
  }
  do {
    if ((HEAP32[(i7 & 16777215) >> 2] | 0) != 0) {
      i2 = HEAP32[(i11 & 16777215) >> 2] | 0;
      if ((i2 | 0) > -1) {
        i20 = HEAP32[(i6 & 16777215) >> 2] + i2 | 0;
      } else {
        i20 = 0;
      }
      __tr_flush_block(i12, i20, HEAP32[(i5 & 16777215) >> 2] - i2 | 0, 0);
      HEAP32[(i11 & 16777215) >> 2] = HEAP32[(i5 & 16777215) >> 2] | 0;
      _flush_pending(HEAP32[(i13 & 16777215) >> 2] | 0);
      if ((HEAP32[(HEAP32[(i13 & 16777215) >> 2] + 16 & 16777215) >> 2] | 0) == 0) {
        i17 = 0;
      } else {
        break;
      }
      return i17 | 0;
    }
  } while (0);
  i17 = 1;
  return i17 | 0;
}
function _deflate_rle(i1, i2) {
  i1 = i1 | 0;
  i2 = i2 | 0;
  var i3 = 0, i4 = 0, i5 = 0, i6 = 0, i7 = 0, i8 = 0, i9 = 0, i10 = 0, i11 = 0, i12 = 0, i13 = 0, i14 = 0, i15 = 0, i16 = 0, i17 = 0, i18 = 0, i19 = 0, i20 = 0, i21 = 0, i22 = 0, i23 = 0, i24 = 0, i25 = 0, i26 = 0, i27 = 0, i28 = 0, i29 = 0, i30 = 0;
  i3 = i1 + 116 | 0;
  i4 = (i2 | 0) == 0;
  i5 = i1 + 96 | 0;
  i6 = i1 + 108 | 0;
  i7 = i1 + 5792 | 0;
  i8 = i1 + 5796 | 0;
  i9 = i1 + 5784 | 0;
  i10 = i1 + 2440 | 0;
  i11 = i1 + 5788 | 0;
  i12 = i1 + 56 | 0;
  i13 = i1 + 92 | 0;
  i14 = i1;
  i15 = i1 | 0;
  L444 : while (1) {
    i16 = HEAP32[(i3 & 16777215) >> 2] | 0;
    do {
      if (i16 >>> 0 < 259) {
        _fill_window(i1);
        i17 = HEAP32[(i3 & 16777215) >> 2] | 0;
        if (i17 >>> 0 < 259 & i4) {
          i18 = 0;
          i19 = 378;
          break L444;
        }
        if ((i17 | 0) == 0) {
          i19 = 365;
          break L444;
        }
        HEAP32[(i5 & 16777215) >> 2] = 0;
        if (i17 >>> 0 > 2) {
          i20 = i17;
          i19 = 345;
          break;
        }
        i21 = HEAP32[(i6 & 16777215) >> 2] | 0;
        i19 = 360;
        break;
      } else {
        HEAP32[(i5 & 16777215) >> 2] = 0;
        i20 = i16;
        i19 = 345;
        break;
      }
    } while (0);
    do {
      if (i19 == 345) {
        i19 = 0;
        i16 = HEAP32[(i6 & 16777215) >> 2] | 0;
        if ((i16 | 0) == 0) {
          i21 = 0;
          i19 = 360;
          break;
        }
        i17 = HEAP32[(i12 & 16777215) >> 2] | 0;
        i22 = HEAP8[i17 + (i16 - 1) & 16777215] | 0;
        if (i22 << 24 >> 24 != HEAP8[i17 + i16 & 16777215] << 24 >> 24) {
          i21 = i16;
          i19 = 360;
          break;
        }
        if (i22 << 24 >> 24 != HEAP8[i16 + (i17 + 1) & 16777215] << 24 >> 24) {
          i21 = i16;
          i19 = 360;
          break;
        }
        i23 = i16 + (i17 + 2) | 0;
        if (i22 << 24 >> 24 != HEAP8[i23 & 16777215] << 24 >> 24) {
          i21 = i16;
          i19 = 360;
          break;
        }
        i24 = i16 + (i17 + 258) | 0;
        i17 = i23;
        while (1) {
          i23 = i17 + 1 | 0;
          if (i22 << 24 >> 24 != HEAP8[i23 & 16777215] << 24 >> 24) {
            i25 = i23;
            break;
          }
          i23 = i17 + 2 | 0;
          if (i22 << 24 >> 24 != HEAP8[i23 & 16777215] << 24 >> 24) {
            i25 = i23;
            break;
          }
          i23 = i17 + 3 | 0;
          if (i22 << 24 >> 24 != HEAP8[i23 & 16777215] << 24 >> 24) {
            i25 = i23;
            break;
          }
          i23 = i17 + 4 | 0;
          if (i22 << 24 >> 24 != HEAP8[i23 & 16777215] << 24 >> 24) {
            i25 = i23;
            break;
          }
          i23 = i17 + 5 | 0;
          if (i22 << 24 >> 24 != HEAP8[i23 & 16777215] << 24 >> 24) {
            i25 = i23;
            break;
          }
          i23 = i17 + 6 | 0;
          if (i22 << 24 >> 24 != HEAP8[i23 & 16777215] << 24 >> 24) {
            i25 = i23;
            break;
          }
          i23 = i17 + 7 | 0;
          if (i22 << 24 >> 24 != HEAP8[i23 & 16777215] << 24 >> 24) {
            i25 = i23;
            break;
          }
          i23 = i17 + 8 | 0;
          if (i22 << 24 >> 24 == HEAP8[i23 & 16777215] << 24 >> 24 & i23 >>> 0 < i24 >>> 0) {
            i17 = i23;
          } else {
            i25 = i23;
            break;
          }
        }
        i17 = i25 - i24 + 258 | 0;
        i22 = i17 >>> 0 > i20 >>> 0 ? i20 : i17;
        HEAP32[(i5 & 16777215) >> 2] = i22;
        if (i22 >>> 0 <= 2) {
          i21 = i16;
          i19 = 360;
          break;
        }
        i17 = i22 + 253 | 0;
        HEAP16[((HEAP32[(i7 & 16777215) >> 2] << 1) + HEAP32[(i8 & 16777215) >> 2] & 16777215) >> 1] = 1;
        i22 = HEAP32[(i7 & 16777215) >> 2] | 0;
        HEAP32[(i7 & 16777215) >> 2] = i22 + 1 | 0;
        HEAP8[HEAP32[(i9 & 16777215) >> 2] + i22 & 16777215] = i17 & 255;
        i22 = ((HEAPU8[(i17 & 255) + 5256408 & 16777215] | 256) + 1 << 2) + i1 + 148 | 0;
        HEAP16[(i22 & 16777215) >> 1] = HEAP16[(i22 & 16777215) >> 1] + 1 & 65535;
        HEAP16[(i10 & 16777215) >> 1] = HEAP16[(i10 & 16777215) >> 1] + 1 & 65535;
        i22 = (HEAP32[(i7 & 16777215) >> 2] | 0) == (HEAP32[(i11 & 16777215) >> 2] - 1 | 0) & 1;
        i17 = HEAP32[(i5 & 16777215) >> 2] | 0;
        HEAP32[(i3 & 16777215) >> 2] = HEAP32[(i3 & 16777215) >> 2] - i17 | 0;
        i23 = HEAP32[(i6 & 16777215) >> 2] + i17 | 0;
        HEAP32[(i6 & 16777215) >> 2] = i23;
        HEAP32[(i5 & 16777215) >> 2] = 0;
        i26 = i22;
        i27 = i23;
        break;
      }
    } while (0);
    if (i19 == 360) {
      i19 = 0;
      i23 = HEAP8[HEAP32[(i12 & 16777215) >> 2] + i21 & 16777215] | 0;
      HEAP16[((HEAP32[(i7 & 16777215) >> 2] << 1) + HEAP32[(i8 & 16777215) >> 2] & 16777215) >> 1] = 0;
      i22 = HEAP32[(i7 & 16777215) >> 2] | 0;
      HEAP32[(i7 & 16777215) >> 2] = i22 + 1 | 0;
      HEAP8[HEAP32[(i9 & 16777215) >> 2] + i22 & 16777215] = i23;
      i22 = ((i23 & 255) << 2) + i1 + 148 | 0;
      HEAP16[(i22 & 16777215) >> 1] = HEAP16[(i22 & 16777215) >> 1] + 1 & 65535;
      i22 = (HEAP32[(i7 & 16777215) >> 2] | 0) == (HEAP32[(i11 & 16777215) >> 2] - 1 | 0) & 1;
      HEAP32[(i3 & 16777215) >> 2] = HEAP32[(i3 & 16777215) >> 2] - 1 | 0;
      i23 = HEAP32[(i6 & 16777215) >> 2] + 1 | 0;
      HEAP32[(i6 & 16777215) >> 2] = i23;
      i26 = i22;
      i27 = i23;
    }
    if ((i26 | 0) == 0) {
      continue;
    }
    i23 = HEAP32[(i13 & 16777215) >> 2] | 0;
    if ((i23 | 0) > -1) {
      i28 = HEAP32[(i12 & 16777215) >> 2] + i23 | 0;
    } else {
      i28 = 0;
    }
    __tr_flush_block(i14, i28, i27 - i23 | 0, 0);
    HEAP32[(i13 & 16777215) >> 2] = HEAP32[(i6 & 16777215) >> 2] | 0;
    _flush_pending(HEAP32[(i15 & 16777215) >> 2] | 0);
    if ((HEAP32[(HEAP32[(i15 & 16777215) >> 2] + 16 & 16777215) >> 2] | 0) == 0) {
      i18 = 0;
      i19 = 377;
      break;
    }
  }
  if (i19 == 365) {
    HEAP32[(i1 + 5812 & 16777215) >> 2] = 0;
    if ((i2 | 0) == 4) {
      i2 = HEAP32[(i13 & 16777215) >> 2] | 0;
      if ((i2 | 0) > -1) {
        i29 = HEAP32[(i12 & 16777215) >> 2] + i2 | 0;
      } else {
        i29 = 0;
      }
      __tr_flush_block(i14, i29, HEAP32[(i6 & 16777215) >> 2] - i2 | 0, 1);
      HEAP32[(i13 & 16777215) >> 2] = HEAP32[(i6 & 16777215) >> 2] | 0;
      _flush_pending(HEAP32[(i15 & 16777215) >> 2] | 0);
      i18 = (HEAP32[(HEAP32[(i15 & 16777215) >> 2] + 16 & 16777215) >> 2] | 0) == 0 ? 2 : 3;
      return i18 | 0;
    }
    do {
      if ((HEAP32[(i7 & 16777215) >> 2] | 0) != 0) {
        i2 = HEAP32[(i13 & 16777215) >> 2] | 0;
        if ((i2 | 0) > -1) {
          i30 = HEAP32[(i12 & 16777215) >> 2] + i2 | 0;
        } else {
          i30 = 0;
        }
        __tr_flush_block(i14, i30, HEAP32[(i6 & 16777215) >> 2] - i2 | 0, 0);
        HEAP32[(i13 & 16777215) >> 2] = HEAP32[(i6 & 16777215) >> 2] | 0;
        _flush_pending(HEAP32[(i15 & 16777215) >> 2] | 0);
        if ((HEAP32[(HEAP32[(i15 & 16777215) >> 2] + 16 & 16777215) >> 2] | 0) == 0) {
          i18 = 0;
        } else {
          break;
        }
        return i18 | 0;
      }
    } while (0);
    i18 = 1;
    return i18 | 0;
  } else if (i19 == 378) {
    return i18 | 0;
  } else if (i19 == 377) {
    return i18 | 0;
  }
}
function _read_buf(i1, i2, i3) {
  i1 = i1 | 0;
  i2 = i2 | 0;
  i3 = i3 | 0;
  var i4 = 0, i5 = 0, i6 = 0, i7 = 0;
  i4 = i1 + 4 | 0;
  i5 = HEAP32[(i4 & 16777215) >> 2] | 0;
  i6 = i5 >>> 0 > i3 >>> 0 ? i3 : i5;
  if ((i6 | 0) == 0) {
    i7 = 0;
    return i7 | 0;
  }
  HEAP32[(i4 & 16777215) >> 2] = i5 - i6 | 0;
  i5 = i1 | 0;
  _memcpy(i2 | 0, HEAP32[(i5 & 16777215) >> 2] | 0, i6 | 0, 1 | 0);
  i4 = HEAP32[(HEAP32[(i1 + 28 & 16777215) >> 2] + 24 & 16777215) >> 2] | 0;
  if ((i4 | 0) == 1) {
    i3 = i1 + 48 | 0;
    HEAP32[(i3 & 16777215) >> 2] = _adler32(HEAP32[(i3 & 16777215) >> 2] | 0, i2, i6);
  } else if ((i4 | 0) == 2) {
    i4 = i1 + 48 | 0;
    HEAP32[(i4 & 16777215) >> 2] = _crc32(HEAP32[(i4 & 16777215) >> 2] | 0, i2, i6);
  }
  HEAP32[(i5 & 16777215) >> 2] = HEAP32[(i5 & 16777215) >> 2] + i6 | 0;
  i5 = i1 + 8 | 0;
  HEAP32[(i5 & 16777215) >> 2] = HEAP32[(i5 & 16777215) >> 2] + i6 | 0;
  i7 = i6;
  return i7 | 0;
}
function _deflate_stored(i1, i2) {
  i1 = i1 | 0;
  i2 = i2 | 0;
  var i3 = 0, i4 = 0, i5 = 0, i6 = 0, i7 = 0, i8 = 0, i9 = 0, i10 = 0, i11 = 0, i12 = 0, i13 = 0, i14 = 0, i15 = 0, i16 = 0, i17 = 0, i18 = 0, i19 = 0, i20 = 0, i21 = 0, i22 = 0;
  i3 = HEAP32[(i1 + 12 & 16777215) >> 2] - 5 | 0;
  i4 = i3 >>> 0 < 65535 ? i3 : 65535;
  i3 = i1 + 116 | 0;
  i5 = i1 + 108 | 0;
  i6 = i1 + 92 | 0;
  i7 = i1 + 44 | 0;
  i8 = i1 + 56 | 0;
  i9 = i1;
  i10 = i1 | 0;
  while (1) {
    i11 = HEAP32[(i3 & 16777215) >> 2] | 0;
    if (i11 >>> 0 < 2) {
      _fill_window(i1);
      i12 = HEAP32[(i3 & 16777215) >> 2] | 0;
      if ((i12 | i2 | 0) == 0) {
        i13 = 0;
        i14 = 412;
        break;
      }
      if ((i12 | 0) == 0) {
        i14 = 401;
        break;
      } else {
        i15 = i12;
      }
    } else {
      i15 = i11;
    }
    i11 = HEAP32[(i5 & 16777215) >> 2] + i15 | 0;
    HEAP32[(i5 & 16777215) >> 2] = i11;
    HEAP32[(i3 & 16777215) >> 2] = 0;
    i12 = HEAP32[(i6 & 16777215) >> 2] | 0;
    i16 = i12 + i4 | 0;
    if ((i11 | 0) != 0 & i11 >>> 0 < i16 >>> 0) {
      i17 = i11;
      i18 = i12;
    } else {
      HEAP32[(i3 & 16777215) >> 2] = i11 - i16 | 0;
      HEAP32[(i5 & 16777215) >> 2] = i16;
      if ((i12 | 0) > -1) {
        i19 = HEAP32[(i8 & 16777215) >> 2] + i12 | 0;
      } else {
        i19 = 0;
      }
      __tr_flush_block(i9, i19, i4, 0);
      HEAP32[(i6 & 16777215) >> 2] = HEAP32[(i5 & 16777215) >> 2] | 0;
      _flush_pending(HEAP32[(i10 & 16777215) >> 2] | 0);
      if ((HEAP32[(HEAP32[(i10 & 16777215) >> 2] + 16 & 16777215) >> 2] | 0) == 0) {
        i13 = 0;
        i14 = 411;
        break;
      }
      i17 = HEAP32[(i5 & 16777215) >> 2] | 0;
      i18 = HEAP32[(i6 & 16777215) >> 2] | 0;
    }
    i12 = i17 - i18 | 0;
    if (i12 >>> 0 < (HEAP32[(i7 & 16777215) >> 2] - 262 | 0) >>> 0) {
      continue;
    }
    if ((i18 | 0) > -1) {
      i20 = HEAP32[(i8 & 16777215) >> 2] + i18 | 0;
    } else {
      i20 = 0;
    }
    __tr_flush_block(i9, i20, i12, 0);
    HEAP32[(i6 & 16777215) >> 2] = HEAP32[(i5 & 16777215) >> 2] | 0;
    _flush_pending(HEAP32[(i10 & 16777215) >> 2] | 0);
    if ((HEAP32[(HEAP32[(i10 & 16777215) >> 2] + 16 & 16777215) >> 2] | 0) == 0) {
      i13 = 0;
      i14 = 413;
      break;
    }
  }
  if (i14 == 412) {
    return i13 | 0;
  } else if (i14 == 401) {
    HEAP32[(i1 + 5812 & 16777215) >> 2] = 0;
    if ((i2 | 0) == 4) {
      i2 = HEAP32[(i6 & 16777215) >> 2] | 0;
      if ((i2 | 0) > -1) {
        i21 = HEAP32[(i8 & 16777215) >> 2] + i2 | 0;
      } else {
        i21 = 0;
      }
      __tr_flush_block(i9, i21, HEAP32[(i5 & 16777215) >> 2] - i2 | 0, 1);
      HEAP32[(i6 & 16777215) >> 2] = HEAP32[(i5 & 16777215) >> 2] | 0;
      _flush_pending(HEAP32[(i10 & 16777215) >> 2] | 0);
      i13 = (HEAP32[(HEAP32[(i10 & 16777215) >> 2] + 16 & 16777215) >> 2] | 0) == 0 ? 2 : 3;
      return i13 | 0;
    }
    i2 = HEAP32[(i5 & 16777215) >> 2] | 0;
    i21 = HEAP32[(i6 & 16777215) >> 2] | 0;
    do {
      if ((i2 | 0) > (i21 | 0)) {
        if ((i21 | 0) > -1) {
          i22 = HEAP32[(i8 & 16777215) >> 2] + i21 | 0;
        } else {
          i22 = 0;
        }
        __tr_flush_block(i9, i22, i2 - i21 | 0, 0);
        HEAP32[(i6 & 16777215) >> 2] = HEAP32[(i5 & 16777215) >> 2] | 0;
        _flush_pending(HEAP32[(i10 & 16777215) >> 2] | 0);
        if ((HEAP32[(HEAP32[(i10 & 16777215) >> 2] + 16 & 16777215) >> 2] | 0) == 0) {
          i13 = 0;
        } else {
          break;
        }
        return i13 | 0;
      }
    } while (0);
    i13 = 1;
    return i13 | 0;
  } else if (i14 == 413) {
    return i13 | 0;
  } else if (i14 == 411) {
    return i13 | 0;
  }
}
function _deflate_fast(i1, i2) {
  i1 = i1 | 0;
  i2 = i2 | 0;
  var i3 = 0, i4 = 0, i5 = 0, i6 = 0, i7 = 0, i8 = 0, i9 = 0, i10 = 0, i11 = 0, i12 = 0, i13 = 0, i14 = 0, i15 = 0, i16 = 0, i17 = 0, i18 = 0, i19 = 0, i20 = 0, i21 = 0, i22 = 0, i23 = 0, i24 = 0, i25 = 0, i26 = 0, i27 = 0, i28 = 0, i29 = 0, i30 = 0, i31 = 0, i32 = 0, i33 = 0, i34 = 0, i35 = 0, i36 = 0, i37 = 0;
  i3 = i1 + 116 | 0;
  i4 = (i2 | 0) == 0;
  i5 = i1 + 72 | 0;
  i6 = i1 + 88 | 0;
  i7 = i1 + 108 | 0;
  i8 = i1 + 56 | 0;
  i9 = i1 + 84 | 0;
  i10 = i1 + 68 | 0;
  i11 = i1 + 52 | 0;
  i12 = i1 + 64 | 0;
  i13 = i1 + 44 | 0;
  i14 = i1 + 96 | 0;
  i15 = i1 + 112 | 0;
  i16 = i1 + 5792 | 0;
  i17 = i1 + 5796 | 0;
  i18 = i1 + 5784 | 0;
  i19 = i1 + 5788 | 0;
  i20 = i1 + 128 | 0;
  i21 = i1 + 92 | 0;
  i22 = i1;
  i23 = i1 | 0;
  L543 : while (1) {
    do {
      if ((HEAP32[(i3 & 16777215) >> 2] | 0) >>> 0 < 262) {
        _fill_window(i1);
        i24 = HEAP32[(i3 & 16777215) >> 2] | 0;
        if (i24 >>> 0 < 262 & i4) {
          i25 = 0;
          i26 = 452;
          break L543;
        }
        if ((i24 | 0) == 0) {
          i26 = 439;
          break L543;
        }
        if (i24 >>> 0 > 2) {
          i26 = 422;
          break;
        } else {
          i26 = 425;
          break;
        }
      } else {
        i26 = 422;
      }
    } while (0);
    do {
      if (i26 == 422) {
        i26 = 0;
        i24 = HEAP32[(i7 & 16777215) >> 2] | 0;
        i27 = (HEAPU8[HEAP32[(i8 & 16777215) >> 2] + i24 + 2 & 16777215] ^ HEAP32[(i5 & 16777215) >> 2] << HEAP32[(i6 & 16777215) >> 2]) & HEAP32[(i9 & 16777215) >> 2];
        HEAP32[(i5 & 16777215) >> 2] = i27;
        i28 = HEAP16[((i27 << 1) + HEAP32[(i10 & 16777215) >> 2] & 16777215) >> 1] | 0;
        HEAP16[(((HEAP32[(i11 & 16777215) >> 2] & i24) << 1) + HEAP32[(i12 & 16777215) >> 2] & 16777215) >> 1] = i28;
        i24 = i28 & 65535;
        HEAP16[((HEAP32[(i5 & 16777215) >> 2] << 1) + HEAP32[(i10 & 16777215) >> 2] & 16777215) >> 1] = HEAP32[(i7 & 16777215) >> 2] & 65535;
        if (i28 << 16 >> 16 == 0) {
          i26 = 425;
          break;
        }
        if ((HEAP32[(i7 & 16777215) >> 2] - i24 | 0) >>> 0 > (HEAP32[(i13 & 16777215) >> 2] - 262 | 0) >>> 0) {
          i26 = 425;
          break;
        }
        i28 = _longest_match(i1, i24);
        HEAP32[(i14 & 16777215) >> 2] = i28;
        i29 = i28;
        break;
      }
    } while (0);
    if (i26 == 425) {
      i26 = 0;
      i29 = HEAP32[(i14 & 16777215) >> 2] | 0;
    }
    do {
      if (i29 >>> 0 > 2) {
        i28 = i29 + 253 | 0;
        i24 = HEAP32[(i7 & 16777215) >> 2] - HEAP32[(i15 & 16777215) >> 2] | 0;
        HEAP16[((HEAP32[(i16 & 16777215) >> 2] << 1) + HEAP32[(i17 & 16777215) >> 2] & 16777215) >> 1] = i24 & 65535;
        i27 = HEAP32[(i16 & 16777215) >> 2] | 0;
        HEAP32[(i16 & 16777215) >> 2] = i27 + 1 | 0;
        HEAP8[HEAP32[(i18 & 16777215) >> 2] + i27 & 16777215] = i28 & 255;
        i27 = ((HEAPU8[(i28 & 255) + 5256408 & 16777215] | 256) + 1 << 2) + i1 + 148 | 0;
        HEAP16[(i27 & 16777215) >> 1] = HEAP16[(i27 & 16777215) >> 1] + 1 & 65535;
        i27 = i24 + 65535 & 65535;
        if (i27 >>> 0 < 256) {
          i30 = i27;
        } else {
          i30 = (i27 >>> 7) + 256 | 0;
        }
        i27 = (HEAPU8[i30 + 5257132 & 16777215] << 2) + i1 + 2440 | 0;
        HEAP16[(i27 & 16777215) >> 1] = HEAP16[(i27 & 16777215) >> 1] + 1 & 65535;
        i27 = (HEAP32[(i16 & 16777215) >> 2] | 0) == (HEAP32[(i19 & 16777215) >> 2] - 1 | 0) & 1;
        i24 = HEAP32[(i14 & 16777215) >> 2] | 0;
        i28 = HEAP32[(i3 & 16777215) >> 2] - i24 | 0;
        HEAP32[(i3 & 16777215) >> 2] = i28;
        if (!(i24 >>> 0 <= (HEAP32[(i20 & 16777215) >> 2] | 0) >>> 0 & i28 >>> 0 > 2)) {
          i28 = HEAP32[(i7 & 16777215) >> 2] + i24 | 0;
          HEAP32[(i7 & 16777215) >> 2] = i28;
          HEAP32[(i14 & 16777215) >> 2] = 0;
          i31 = HEAP32[(i8 & 16777215) >> 2] | 0;
          i32 = HEAPU8[i31 + i28 & 16777215];
          HEAP32[(i5 & 16777215) >> 2] = i32;
          HEAP32[(i5 & 16777215) >> 2] = (HEAPU8[i28 + (i31 + 1) & 16777215] ^ i32 << HEAP32[(i6 & 16777215) >> 2]) & HEAP32[(i9 & 16777215) >> 2];
          i33 = i27;
          i34 = i28;
          break;
        }
        HEAP32[(i14 & 16777215) >> 2] = i24 - 1 | 0;
        while (1) {
          i24 = HEAP32[(i7 & 16777215) >> 2] | 0;
          i28 = i24 + 1 | 0;
          HEAP32[(i7 & 16777215) >> 2] = i28;
          i32 = (HEAPU8[HEAP32[(i8 & 16777215) >> 2] + i24 + 3 & 16777215] ^ HEAP32[(i5 & 16777215) >> 2] << HEAP32[(i6 & 16777215) >> 2]) & HEAP32[(i9 & 16777215) >> 2];
          HEAP32[(i5 & 16777215) >> 2] = i32;
          HEAP16[(((HEAP32[(i11 & 16777215) >> 2] & i28) << 1) + HEAP32[(i12 & 16777215) >> 2] & 16777215) >> 1] = HEAP16[((i32 << 1) + HEAP32[(i10 & 16777215) >> 2] & 16777215) >> 1] | 0;
          HEAP16[((HEAP32[(i5 & 16777215) >> 2] << 1) + HEAP32[(i10 & 16777215) >> 2] & 16777215) >> 1] = HEAP32[(i7 & 16777215) >> 2] & 65535;
          i32 = HEAP32[(i14 & 16777215) >> 2] - 1 | 0;
          HEAP32[(i14 & 16777215) >> 2] = i32;
          if ((i32 | 0) == 0) {
            break;
          }
        }
        i32 = HEAP32[(i7 & 16777215) >> 2] + 1 | 0;
        HEAP32[(i7 & 16777215) >> 2] = i32;
        i33 = i27;
        i34 = i32;
      } else {
        i32 = HEAP8[HEAP32[(i8 & 16777215) >> 2] + HEAP32[(i7 & 16777215) >> 2] & 16777215] | 0;
        HEAP16[((HEAP32[(i16 & 16777215) >> 2] << 1) + HEAP32[(i17 & 16777215) >> 2] & 16777215) >> 1] = 0;
        i28 = HEAP32[(i16 & 16777215) >> 2] | 0;
        HEAP32[(i16 & 16777215) >> 2] = i28 + 1 | 0;
        HEAP8[HEAP32[(i18 & 16777215) >> 2] + i28 & 16777215] = i32;
        i28 = ((i32 & 255) << 2) + i1 + 148 | 0;
        HEAP16[(i28 & 16777215) >> 1] = HEAP16[(i28 & 16777215) >> 1] + 1 & 65535;
        i28 = (HEAP32[(i16 & 16777215) >> 2] | 0) == (HEAP32[(i19 & 16777215) >> 2] - 1 | 0) & 1;
        HEAP32[(i3 & 16777215) >> 2] = HEAP32[(i3 & 16777215) >> 2] - 1 | 0;
        i32 = HEAP32[(i7 & 16777215) >> 2] + 1 | 0;
        HEAP32[(i7 & 16777215) >> 2] = i32;
        i33 = i28;
        i34 = i32;
      }
    } while (0);
    if ((i33 | 0) == 0) {
      continue;
    }
    i32 = HEAP32[(i21 & 16777215) >> 2] | 0;
    if ((i32 | 0) > -1) {
      i35 = HEAP32[(i8 & 16777215) >> 2] + i32 | 0;
    } else {
      i35 = 0;
    }
    __tr_flush_block(i22, i35, i34 - i32 | 0, 0);
    HEAP32[(i21 & 16777215) >> 2] = HEAP32[(i7 & 16777215) >> 2] | 0;
    _flush_pending(HEAP32[(i23 & 16777215) >> 2] | 0);
    if ((HEAP32[(HEAP32[(i23 & 16777215) >> 2] + 16 & 16777215) >> 2] | 0) == 0) {
      i25 = 0;
      i26 = 453;
      break;
    }
  }
  if (i26 == 439) {
    i34 = HEAP32[(i7 & 16777215) >> 2] | 0;
    HEAP32[(i1 + 5812 & 16777215) >> 2] = i34 >>> 0 < 2 ? i34 : 2;
    if ((i2 | 0) == 4) {
      i2 = HEAP32[(i21 & 16777215) >> 2] | 0;
      if ((i2 | 0) > -1) {
        i36 = HEAP32[(i8 & 16777215) >> 2] + i2 | 0;
      } else {
        i36 = 0;
      }
      __tr_flush_block(i22, i36, i34 - i2 | 0, 1);
      HEAP32[(i21 & 16777215) >> 2] = HEAP32[(i7 & 16777215) >> 2] | 0;
      _flush_pending(HEAP32[(i23 & 16777215) >> 2] | 0);
      i25 = (HEAP32[(HEAP32[(i23 & 16777215) >> 2] + 16 & 16777215) >> 2] | 0) == 0 ? 2 : 3;
      return i25 | 0;
    }
    do {
      if ((HEAP32[(i16 & 16777215) >> 2] | 0) != 0) {
        i2 = HEAP32[(i21 & 16777215) >> 2] | 0;
        if ((i2 | 0) > -1) {
          i37 = HEAP32[(i8 & 16777215) >> 2] + i2 | 0;
        } else {
          i37 = 0;
        }
        __tr_flush_block(i22, i37, i34 - i2 | 0, 0);
        HEAP32[(i21 & 16777215) >> 2] = HEAP32[(i7 & 16777215) >> 2] | 0;
        _flush_pending(HEAP32[(i23 & 16777215) >> 2] | 0);
        if ((HEAP32[(HEAP32[(i23 & 16777215) >> 2] + 16 & 16777215) >> 2] | 0) == 0) {
          i25 = 0;
        } else {
          break;
        }
        return i25 | 0;
      }
    } while (0);
    i25 = 1;
    return i25 | 0;
  } else if (i26 == 452) {
    return i25 | 0;
  } else if (i26 == 453) {
    return i25 | 0;
  }
}
function _deflate_slow(i1, i2) {
  i1 = i1 | 0;
  i2 = i2 | 0;
  var i3 = 0, i4 = 0, i5 = 0, i6 = 0, i7 = 0, i8 = 0, i9 = 0, i10 = 0, i11 = 0, i12 = 0, i13 = 0, i14 = 0, i15 = 0, i16 = 0, i17 = 0, i18 = 0, i19 = 0, i20 = 0, i21 = 0, i22 = 0, i23 = 0, i24 = 0, i25 = 0, i26 = 0, i27 = 0, i28 = 0, i29 = 0, i30 = 0, i31 = 0, i32 = 0, i33 = 0, i34 = 0, i35 = 0, i36 = 0, i37 = 0, i38 = 0, i39 = 0, i40 = 0, i41 = 0, i42 = 0, i43 = 0, i44 = 0, i45 = 0;
  i3 = i1 + 116 | 0;
  i4 = (i2 | 0) == 0;
  i5 = i1 + 72 | 0;
  i6 = i1 + 88 | 0;
  i7 = i1 + 108 | 0;
  i8 = i1 + 56 | 0;
  i9 = i1 + 84 | 0;
  i10 = i1 + 68 | 0;
  i11 = i1 + 52 | 0;
  i12 = i1 + 64 | 0;
  i13 = i1 + 96 | 0;
  i14 = i1 + 120 | 0;
  i15 = i1 + 112 | 0;
  i16 = i1 + 100 | 0;
  i17 = i1 + 5792 | 0;
  i18 = i1 + 5796 | 0;
  i19 = i1 + 5784 | 0;
  i20 = i1 + 5788 | 0;
  i21 = i1 + 104 | 0;
  i22 = i1 + 92 | 0;
  i23 = i1;
  i24 = i1 | 0;
  i25 = i1 + 128 | 0;
  i26 = i1 + 44 | 0;
  i27 = i1 + 136 | 0;
  L593 : while (1) {
    i28 = HEAP32[(i3 & 16777215) >> 2] | 0;
    while (1) {
      do {
        if (i28 >>> 0 < 262) {
          _fill_window(i1);
          i29 = HEAP32[(i3 & 16777215) >> 2] | 0;
          if (i29 >>> 0 < 262 & i4) {
            i30 = 0;
            i31 = 501;
            break L593;
          }
          if ((i29 | 0) == 0) {
            i31 = 488;
            break L593;
          }
          if (i29 >>> 0 > 2) {
            i31 = 461;
            break;
          }
          HEAP32[(i14 & 16777215) >> 2] = HEAP32[(i13 & 16777215) >> 2] | 0;
          HEAP32[(i16 & 16777215) >> 2] = HEAP32[(i15 & 16777215) >> 2] | 0;
          HEAP32[(i13 & 16777215) >> 2] = 2;
          i32 = 2;
          i31 = 469;
          break;
        } else {
          i31 = 461;
        }
      } while (0);
      do {
        if (i31 == 461) {
          i31 = 0;
          i29 = HEAP32[(i7 & 16777215) >> 2] | 0;
          i33 = (HEAPU8[HEAP32[(i8 & 16777215) >> 2] + i29 + 2 & 16777215] ^ HEAP32[(i5 & 16777215) >> 2] << HEAP32[(i6 & 16777215) >> 2]) & HEAP32[(i9 & 16777215) >> 2];
          HEAP32[(i5 & 16777215) >> 2] = i33;
          i34 = HEAP16[((i33 << 1) + HEAP32[(i10 & 16777215) >> 2] & 16777215) >> 1] | 0;
          HEAP16[(((HEAP32[(i11 & 16777215) >> 2] & i29) << 1) + HEAP32[(i12 & 16777215) >> 2] & 16777215) >> 1] = i34;
          i29 = i34 & 65535;
          HEAP16[((HEAP32[(i5 & 16777215) >> 2] << 1) + HEAP32[(i10 & 16777215) >> 2] & 16777215) >> 1] = HEAP32[(i7 & 16777215) >> 2] & 65535;
          i33 = HEAP32[(i13 & 16777215) >> 2] | 0;
          HEAP32[(i14 & 16777215) >> 2] = i33;
          HEAP32[(i16 & 16777215) >> 2] = HEAP32[(i15 & 16777215) >> 2] | 0;
          HEAP32[(i13 & 16777215) >> 2] = 2;
          if (i34 << 16 >> 16 == 0) {
            i32 = 2;
            i31 = 469;
            break;
          }
          if (i33 >>> 0 >= (HEAP32[(i25 & 16777215) >> 2] | 0) >>> 0) {
            i35 = i33;
            i36 = 2;
            break;
          }
          if ((HEAP32[(i7 & 16777215) >> 2] - i29 | 0) >>> 0 > (HEAP32[(i26 & 16777215) >> 2] - 262 | 0) >>> 0) {
            i32 = 2;
            i31 = 469;
            break;
          }
          i33 = _longest_match(i1, i29);
          HEAP32[(i13 & 16777215) >> 2] = i33;
          if (i33 >>> 0 >= 6) {
            i32 = i33;
            i31 = 469;
            break;
          }
          if ((HEAP32[(i27 & 16777215) >> 2] | 0) != 1) {
            if ((i33 | 0) != 3) {
              i32 = i33;
              i31 = 469;
              break;
            }
            if ((HEAP32[(i7 & 16777215) >> 2] - HEAP32[(i15 & 16777215) >> 2] | 0) >>> 0 <= 4096) {
              i32 = 3;
              i31 = 469;
              break;
            }
          }
          HEAP32[(i13 & 16777215) >> 2] = 2;
          i32 = 2;
          i31 = 469;
          break;
        }
      } while (0);
      if (i31 == 469) {
        i31 = 0;
        i35 = HEAP32[(i14 & 16777215) >> 2] | 0;
        i36 = i32;
      }
      if (!(i35 >>> 0 < 3 | i36 >>> 0 > i35 >>> 0)) {
        break;
      }
      if ((HEAP32[(i21 & 16777215) >> 2] | 0) == 0) {
        HEAP32[(i21 & 16777215) >> 2] = 1;
        HEAP32[(i7 & 16777215) >> 2] = HEAP32[(i7 & 16777215) >> 2] + 1 | 0;
        i33 = HEAP32[(i3 & 16777215) >> 2] - 1 | 0;
        HEAP32[(i3 & 16777215) >> 2] = i33;
        i28 = i33;
        continue;
      }
      i33 = HEAP8[HEAP32[(i8 & 16777215) >> 2] + (HEAP32[(i7 & 16777215) >> 2] - 1) & 16777215] | 0;
      HEAP16[((HEAP32[(i17 & 16777215) >> 2] << 1) + HEAP32[(i18 & 16777215) >> 2] & 16777215) >> 1] = 0;
      i29 = HEAP32[(i17 & 16777215) >> 2] | 0;
      HEAP32[(i17 & 16777215) >> 2] = i29 + 1 | 0;
      HEAP8[HEAP32[(i19 & 16777215) >> 2] + i29 & 16777215] = i33;
      i29 = ((i33 & 255) << 2) + i1 + 148 | 0;
      HEAP16[(i29 & 16777215) >> 1] = HEAP16[(i29 & 16777215) >> 1] + 1 & 65535;
      if ((HEAP32[(i17 & 16777215) >> 2] | 0) == (HEAP32[(i20 & 16777215) >> 2] - 1 | 0)) {
        i29 = HEAP32[(i22 & 16777215) >> 2] | 0;
        if ((i29 | 0) > -1) {
          i37 = HEAP32[(i8 & 16777215) >> 2] + i29 | 0;
        } else {
          i37 = 0;
        }
        __tr_flush_block(i23, i37, HEAP32[(i7 & 16777215) >> 2] - i29 | 0, 0);
        HEAP32[(i22 & 16777215) >> 2] = HEAP32[(i7 & 16777215) >> 2] | 0;
        _flush_pending(HEAP32[(i24 & 16777215) >> 2] | 0);
      }
      HEAP32[(i7 & 16777215) >> 2] = HEAP32[(i7 & 16777215) >> 2] + 1 | 0;
      i29 = HEAP32[(i3 & 16777215) >> 2] - 1 | 0;
      HEAP32[(i3 & 16777215) >> 2] = i29;
      if ((HEAP32[(HEAP32[(i24 & 16777215) >> 2] + 16 & 16777215) >> 2] | 0) == 0) {
        i30 = 0;
        i31 = 504;
        break L593;
      } else {
        i28 = i29;
      }
    }
    i28 = HEAP32[(i7 & 16777215) >> 2] | 0;
    i29 = i28 - 3 + HEAP32[(i3 & 16777215) >> 2] | 0;
    i33 = i35 + 253 | 0;
    i34 = i28 + 65535 - HEAP32[(i16 & 16777215) >> 2] | 0;
    HEAP16[((HEAP32[(i17 & 16777215) >> 2] << 1) + HEAP32[(i18 & 16777215) >> 2] & 16777215) >> 1] = i34 & 65535;
    i28 = HEAP32[(i17 & 16777215) >> 2] | 0;
    HEAP32[(i17 & 16777215) >> 2] = i28 + 1 | 0;
    HEAP8[HEAP32[(i19 & 16777215) >> 2] + i28 & 16777215] = i33 & 255;
    i28 = ((HEAPU8[(i33 & 255) + 5256408 & 16777215] | 256) + 1 << 2) + i1 + 148 | 0;
    HEAP16[(i28 & 16777215) >> 1] = HEAP16[(i28 & 16777215) >> 1] + 1 & 65535;
    i28 = i34 + 65535 & 65535;
    if (i28 >>> 0 < 256) {
      i38 = i28;
    } else {
      i38 = (i28 >>> 7) + 256 | 0;
    }
    i28 = (HEAPU8[i38 + 5257132 & 16777215] << 2) + i1 + 2440 | 0;
    HEAP16[(i28 & 16777215) >> 1] = HEAP16[(i28 & 16777215) >> 1] + 1 & 65535;
    i28 = HEAP32[(i17 & 16777215) >> 2] | 0;
    i34 = HEAP32[(i20 & 16777215) >> 2] - 1 | 0;
    i33 = HEAP32[(i14 & 16777215) >> 2] | 0;
    HEAP32[(i3 & 16777215) >> 2] = 1 - i33 + HEAP32[(i3 & 16777215) >> 2] | 0;
    i39 = i33 - 2 | 0;
    HEAP32[(i14 & 16777215) >> 2] = i39;
    i33 = i39;
    while (1) {
      i39 = HEAP32[(i7 & 16777215) >> 2] | 0;
      i40 = i39 + 1 | 0;
      HEAP32[(i7 & 16777215) >> 2] = i40;
      if (i40 >>> 0 > i29 >>> 0) {
        i41 = i33;
      } else {
        i42 = (HEAPU8[HEAP32[(i8 & 16777215) >> 2] + i39 + 3 & 16777215] ^ HEAP32[(i5 & 16777215) >> 2] << HEAP32[(i6 & 16777215) >> 2]) & HEAP32[(i9 & 16777215) >> 2];
        HEAP32[(i5 & 16777215) >> 2] = i42;
        HEAP16[(((HEAP32[(i11 & 16777215) >> 2] & i40) << 1) + HEAP32[(i12 & 16777215) >> 2] & 16777215) >> 1] = HEAP16[((i42 << 1) + HEAP32[(i10 & 16777215) >> 2] & 16777215) >> 1] | 0;
        HEAP16[((HEAP32[(i5 & 16777215) >> 2] << 1) + HEAP32[(i10 & 16777215) >> 2] & 16777215) >> 1] = HEAP32[(i7 & 16777215) >> 2] & 65535;
        i41 = HEAP32[(i14 & 16777215) >> 2] | 0;
      }
      i42 = i41 - 1 | 0;
      HEAP32[(i14 & 16777215) >> 2] = i42;
      if ((i42 | 0) == 0) {
        break;
      } else {
        i33 = i42;
      }
    }
    HEAP32[(i21 & 16777215) >> 2] = 0;
    HEAP32[(i13 & 16777215) >> 2] = 2;
    i33 = HEAP32[(i7 & 16777215) >> 2] + 1 | 0;
    HEAP32[(i7 & 16777215) >> 2] = i33;
    if ((i28 | 0) != (i34 | 0)) {
      continue;
    }
    i29 = HEAP32[(i22 & 16777215) >> 2] | 0;
    if ((i29 | 0) > -1) {
      i43 = HEAP32[(i8 & 16777215) >> 2] + i29 | 0;
    } else {
      i43 = 0;
    }
    __tr_flush_block(i23, i43, i33 - i29 | 0, 0);
    HEAP32[(i22 & 16777215) >> 2] = HEAP32[(i7 & 16777215) >> 2] | 0;
    _flush_pending(HEAP32[(i24 & 16777215) >> 2] | 0);
    if ((HEAP32[(HEAP32[(i24 & 16777215) >> 2] + 16 & 16777215) >> 2] | 0) == 0) {
      i30 = 0;
      i31 = 500;
      break;
    }
  }
  if (i31 == 488) {
    if ((HEAP32[(i21 & 16777215) >> 2] | 0) != 0) {
      i43 = HEAP8[HEAP32[(i8 & 16777215) >> 2] + (HEAP32[(i7 & 16777215) >> 2] - 1) & 16777215] | 0;
      HEAP16[((HEAP32[(i17 & 16777215) >> 2] << 1) + HEAP32[(i18 & 16777215) >> 2] & 16777215) >> 1] = 0;
      i18 = HEAP32[(i17 & 16777215) >> 2] | 0;
      HEAP32[(i17 & 16777215) >> 2] = i18 + 1 | 0;
      HEAP8[HEAP32[(i19 & 16777215) >> 2] + i18 & 16777215] = i43;
      i18 = ((i43 & 255) << 2) + i1 + 148 | 0;
      HEAP16[(i18 & 16777215) >> 1] = HEAP16[(i18 & 16777215) >> 1] + 1 & 65535;
      HEAP32[(i21 & 16777215) >> 2] = 0;
    }
    i21 = HEAP32[(i7 & 16777215) >> 2] | 0;
    HEAP32[(i1 + 5812 & 16777215) >> 2] = i21 >>> 0 < 2 ? i21 : 2;
    if ((i2 | 0) == 4) {
      i2 = HEAP32[(i22 & 16777215) >> 2] | 0;
      if ((i2 | 0) > -1) {
        i44 = HEAP32[(i8 & 16777215) >> 2] + i2 | 0;
      } else {
        i44 = 0;
      }
      __tr_flush_block(i23, i44, i21 - i2 | 0, 1);
      HEAP32[(i22 & 16777215) >> 2] = HEAP32[(i7 & 16777215) >> 2] | 0;
      _flush_pending(HEAP32[(i24 & 16777215) >> 2] | 0);
      i30 = (HEAP32[(HEAP32[(i24 & 16777215) >> 2] + 16 & 16777215) >> 2] | 0) == 0 ? 2 : 3;
      return i30 | 0;
    }
    do {
      if ((HEAP32[(i17 & 16777215) >> 2] | 0) != 0) {
        i2 = HEAP32[(i22 & 16777215) >> 2] | 0;
        if ((i2 | 0) > -1) {
          i45 = HEAP32[(i8 & 16777215) >> 2] + i2 | 0;
        } else {
          i45 = 0;
        }
        __tr_flush_block(i23, i45, i21 - i2 | 0, 0);
        HEAP32[(i22 & 16777215) >> 2] = HEAP32[(i7 & 16777215) >> 2] | 0;
        _flush_pending(HEAP32[(i24 & 16777215) >> 2] | 0);
        if ((HEAP32[(HEAP32[(i24 & 16777215) >> 2] + 16 & 16777215) >> 2] | 0) == 0) {
          i30 = 0;
        } else {
          break;
        }
        return i30 | 0;
      }
    } while (0);
    i30 = 1;
    return i30 | 0;
  } else if (i31 == 500) {
    return i30 | 0;
  } else if (i31 == 501) {
    return i30 | 0;
  } else if (i31 == 504) {
    return i30 | 0;
  }
}
function _longest_match(i1, i2) {
  i1 = i1 | 0;
  i2 = i2 | 0;
  var i3 = 0, i4 = 0, i5 = 0, i6 = 0, i7 = 0, i8 = 0, i9 = 0, i10 = 0, i11 = 0, i12 = 0, i13 = 0, i14 = 0, i15 = 0, i16 = 0, i17 = 0, i18 = 0, i19 = 0, i20 = 0, i21 = 0, i22 = 0, i23 = 0, i24 = 0, i25 = 0, i26 = 0, i27 = 0, i28 = 0, i29 = 0, i30 = 0;
  i3 = HEAP32[(i1 + 124 & 16777215) >> 2] | 0;
  i4 = HEAP32[(i1 + 56 & 16777215) >> 2] | 0;
  i5 = HEAP32[(i1 + 108 & 16777215) >> 2] | 0;
  i6 = i4 + i5 | 0;
  i7 = HEAP32[(i1 + 120 & 16777215) >> 2] | 0;
  i8 = HEAP32[(i1 + 144 & 16777215) >> 2] | 0;
  i9 = HEAP32[(i1 + 44 & 16777215) >> 2] - 262 | 0;
  i10 = i5 >>> 0 > i9 >>> 0 ? i5 - i9 | 0 : 0;
  i9 = HEAP32[(i1 + 64 & 16777215) >> 2] | 0;
  i11 = HEAP32[(i1 + 52 & 16777215) >> 2] | 0;
  i12 = i5 + (i4 + 258) | 0;
  i13 = HEAP32[(i1 + 116 & 16777215) >> 2] | 0;
  i14 = i8 >>> 0 > i13 >>> 0 ? i13 : i8;
  i8 = i1 + 112 | 0;
  i15 = i5 + (i4 + 1) | 0;
  i16 = i5 + (i4 + 2) | 0;
  i17 = i12;
  i18 = i5 + 257 | 0;
  i19 = HEAP8[i4 + i7 + i5 & 16777215] | 0;
  i20 = HEAP8[i4 + (i5 - 1) + i7 & 16777215] | 0;
  i21 = i2;
  i2 = i7 >>> 0 < (HEAP32[(i1 + 140 & 16777215) >> 2] | 0) >>> 0 ? i3 : i3 >>> 2;
  i3 = i7;
  L663 : while (1) {
    i7 = i4 + i21 | 0;
    do {
      if (HEAP8[i4 + i21 + i3 & 16777215] << 24 >> 24 == i19 << 24 >> 24) {
        if (HEAP8[i4 + (i3 - 1) + i21 & 16777215] << 24 >> 24 != i20 << 24 >> 24) {
          i22 = i19;
          i23 = i20;
          i24 = i3;
          break;
        }
        if (HEAP8[i7 & 16777215] << 24 >> 24 != HEAP8[i6 & 16777215] << 24 >> 24) {
          i22 = i19;
          i23 = i20;
          i24 = i3;
          break;
        }
        if (HEAP8[i21 + (i4 + 1) & 16777215] << 24 >> 24 != HEAP8[i15 & 16777215] << 24 >> 24) {
          i22 = i19;
          i23 = i20;
          i24 = i3;
          break;
        }
        i1 = i16;
        i25 = i21 + (i4 + 2) | 0;
        while (1) {
          i26 = i1 + 1 | 0;
          if (HEAP8[i26 & 16777215] << 24 >> 24 != HEAP8[i25 + 1 & 16777215] << 24 >> 24) {
            i27 = i26;
            break;
          }
          i26 = i1 + 2 | 0;
          if (HEAP8[i26 & 16777215] << 24 >> 24 != HEAP8[i25 + 2 & 16777215] << 24 >> 24) {
            i27 = i26;
            break;
          }
          i26 = i1 + 3 | 0;
          if (HEAP8[i26 & 16777215] << 24 >> 24 != HEAP8[i25 + 3 & 16777215] << 24 >> 24) {
            i27 = i26;
            break;
          }
          i26 = i1 + 4 | 0;
          if (HEAP8[i26 & 16777215] << 24 >> 24 != HEAP8[i25 + 4 & 16777215] << 24 >> 24) {
            i27 = i26;
            break;
          }
          i26 = i1 + 5 | 0;
          if (HEAP8[i26 & 16777215] << 24 >> 24 != HEAP8[i25 + 5 & 16777215] << 24 >> 24) {
            i27 = i26;
            break;
          }
          i26 = i1 + 6 | 0;
          if (HEAP8[i26 & 16777215] << 24 >> 24 != HEAP8[i25 + 6 & 16777215] << 24 >> 24) {
            i27 = i26;
            break;
          }
          i26 = i1 + 7 | 0;
          if (HEAP8[i26 & 16777215] << 24 >> 24 != HEAP8[i25 + 7 & 16777215] << 24 >> 24) {
            i27 = i26;
            break;
          }
          i26 = i1 + 8 | 0;
          i28 = i25 + 8 | 0;
          if (HEAP8[i26 & 16777215] << 24 >> 24 == HEAP8[i28 & 16777215] << 24 >> 24 & i26 >>> 0 < i12 >>> 0) {
            i1 = i26;
            i25 = i28;
          } else {
            i27 = i26;
            break;
          }
        }
        i25 = i27 - i17 | 0;
        i1 = i25 + 258 | 0;
        if ((i1 | 0) <= (i3 | 0)) {
          i22 = i19;
          i23 = i20;
          i24 = i3;
          break;
        }
        HEAP32[(i8 & 16777215) >> 2] = i21;
        if ((i1 | 0) >= (i14 | 0)) {
          i29 = i1;
          i30 = 526;
          break L663;
        }
        i22 = HEAP8[i4 + i1 + i5 & 16777215] | 0;
        i23 = HEAP8[i4 + i18 + i25 & 16777215] | 0;
        i24 = i1;
      } else {
        i22 = i19;
        i23 = i20;
        i24 = i3;
      }
    } while (0);
    i7 = HEAPU16[(((i21 & i11) << 1) + i9 & 16777215) >> 1];
    if (i7 >>> 0 <= i10 >>> 0) {
      i29 = i24;
      i30 = 527;
      break;
    }
    i1 = i2 - 1 | 0;
    if ((i1 | 0) == 0) {
      i29 = i24;
      i30 = 528;
      break;
    } else {
      i19 = i22;
      i20 = i23;
      i21 = i7;
      i2 = i1;
      i3 = i24;
    }
  }
  if (i30 == 526) {
    i24 = i29 >>> 0 > i13 >>> 0;
    i3 = i24 ? i13 : i29;
    return i3 | 0;
  } else if (i30 == 527) {
    i24 = i29 >>> 0 > i13 >>> 0;
    i3 = i24 ? i13 : i29;
    return i3 | 0;
  } else if (i30 == 528) {
    i24 = i29 >>> 0 > i13 >>> 0;
    i3 = i24 ? i13 : i29;
    return i3 | 0;
  }
}
function _inflateResetKeep(i1) {
  i1 = i1 | 0;
  var i2 = 0, i3 = 0, i4 = 0;
  if ((i1 | 0) == 0) {
    i2 = -2;
    return i2 | 0;
  }
  i3 = HEAP32[(i1 + 28 & 16777215) >> 2] | 0;
  if ((i3 | 0) == 0) {
    i2 = -2;
    return i2 | 0;
  }
  HEAP32[(i3 + 28 & 16777215) >> 2] = 0;
  HEAP32[(i1 + 20 & 16777215) >> 2] = 0;
  HEAP32[(i1 + 8 & 16777215) >> 2] = 0;
  HEAP32[(i1 + 24 & 16777215) >> 2] = 0;
  i4 = HEAP32[(i3 + 8 & 16777215) >> 2] | 0;
  if ((i4 | 0) != 0) {
    HEAP32[(i1 + 48 & 16777215) >> 2] = i4 & 1;
  }
  HEAP32[(i3 & 16777215) >> 2] = 0;
  HEAP32[(i3 + 4 & 16777215) >> 2] = 0;
  HEAP32[(i3 + 12 & 16777215) >> 2] = 0;
  HEAP32[(i3 + 20 & 16777215) >> 2] = 32768;
  HEAP32[(i3 + 32 & 16777215) >> 2] = 0;
  HEAP32[(i3 + 56 & 16777215) >> 2] = 0;
  HEAP32[(i3 + 60 & 16777215) >> 2] = 0;
  i4 = i3 + 1328 | 0;
  HEAP32[(i3 + 108 & 16777215) >> 2] = i4;
  HEAP32[(i3 + 80 & 16777215) >> 2] = i4;
  HEAP32[(i3 + 76 & 16777215) >> 2] = i4;
  HEAP32[(i3 + 7104 & 16777215) >> 2] = 1;
  HEAP32[(i3 + 7108 & 16777215) >> 2] = -1;
  i2 = 0;
  return i2 | 0;
}
function _inflateReset(i1) {
  i1 = i1 | 0;
  var i2 = 0, i3 = 0;
  if ((i1 | 0) == 0) {
    i2 = -2;
    return i2 | 0;
  }
  i3 = HEAP32[(i1 + 28 & 16777215) >> 2] | 0;
  if ((i3 | 0) == 0) {
    i2 = -2;
    return i2 | 0;
  }
  HEAP32[(i3 + 40 & 16777215) >> 2] = 0;
  HEAP32[(i3 + 44 & 16777215) >> 2] = 0;
  HEAP32[(i3 + 48 & 16777215) >> 2] = 0;
  i2 = _inflateResetKeep(i1);
  return i2 | 0;
}
function _inflateReset2(i1) {
  i1 = i1 | 0;
  var i2 = 0, i3 = 0, i4 = 0, i5 = 0, i6 = 0;
  if ((i1 | 0) == 0) {
    i2 = -2;
    return i2 | 0;
  }
  i3 = HEAP32[(i1 + 28 & 16777215) >> 2] | 0;
  if ((i3 | 0) == 0) {
    i2 = -2;
    return i2 | 0;
  }
  i4 = i3 + 52 | 0;
  i5 = HEAP32[(i4 & 16777215) >> 2] | 0;
  i6 = i3 + 36 | 0;
  do {
    if ((i5 | 0) != 0) {
      if ((HEAP32[(i6 & 16777215) >> 2] | 0) == 15) {
        break;
      }
      FUNCTION_TABLE_vii[HEAP32[(i1 + 36 & 16777215) >> 2] & 15](HEAP32[(i1 + 40 & 16777215) >> 2] | 0, i5);
      HEAP32[(i4 & 16777215) >> 2] = 0;
    }
  } while (0);
  HEAP32[(i3 + 8 & 16777215) >> 2] = 1;
  HEAP32[(i6 & 16777215) >> 2] = 15;
  i2 = _inflateReset(i1);
  return i2 | 0;
}
function _inflateInit2_(i1) {
  i1 = i1 | 0;
  var i2 = 0, i3 = 0, i4 = 0, i5 = 0, i6 = 0, i7 = 0;
  if ((i1 | 0) == 0) {
    i2 = -2;
    return i2 | 0;
  }
  HEAP32[(i1 + 24 & 16777215) >> 2] = 0;
  i3 = i1 + 32 | 0;
  i4 = HEAP32[(i3 & 16777215) >> 2] | 0;
  if ((i4 | 0) == 0) {
    HEAP32[(i3 & 16777215) >> 2] = 4;
    HEAP32[(i1 + 40 & 16777215) >> 2] = 0;
    i5 = 4;
  } else {
    i5 = i4;
  }
  i4 = i1 + 36 | 0;
  if ((HEAP32[(i4 & 16777215) >> 2] | 0) == 0) {
    HEAP32[(i4 & 16777215) >> 2] = 10;
  }
  i3 = i1 + 40 | 0;
  i6 = FUNCTION_TABLE_iiii[i5 & 15](HEAP32[(i3 & 16777215) >> 2] | 0, 1, 7116);
  if ((i6 | 0) == 0) {
    i2 = -4;
    return i2 | 0;
  }
  i5 = i1 + 28 | 0;
  HEAP32[(i5 & 16777215) >> 2] = i6;
  HEAP32[(i6 + 52 & 16777215) >> 2] = 0;
  i7 = _inflateReset2(i1);
  if ((i7 | 0) == 0) {
    i2 = 0;
    return i2 | 0;
  }
  FUNCTION_TABLE_vii[HEAP32[(i4 & 16777215) >> 2] & 15](HEAP32[(i3 & 16777215) >> 2] | 0, i6);
  HEAP32[(i5 & 16777215) >> 2] = 0;
  i2 = i7;
  return i2 | 0;
}
function _inflateInit_(i1) {
  i1 = i1 | 0;
  return _inflateInit2_(i1) | 0;
}
function _inflate(i1) {
  i1 = i1 | 0;
  var i2 = 0, i3 = 0, i4 = 0, i5 = 0, i6 = 0, i7 = 0, i8 = 0, i9 = 0, i10 = 0, i11 = 0, i12 = 0, i13 = 0, i14 = 0, i15 = 0, i16 = 0, i17 = 0, i18 = 0, i19 = 0, i20 = 0, i21 = 0, i22 = 0, i23 = 0, i24 = 0, i25 = 0, i26 = 0, i27 = 0, i28 = 0, i29 = 0, i30 = 0, i31 = 0, i32 = 0, i33 = 0, i34 = 0, i35 = 0, i36 = 0, i37 = 0, i38 = 0, i39 = 0, i40 = 0, i41 = 0, i42 = 0, i43 = 0, i44 = 0, i45 = 0, i46 = 0, i47 = 0, i48 = 0, i49 = 0, i50 = 0, i51 = 0, i52 = 0, i53 = 0, i54 = 0, i55 = 0, i56 = 0, i57 = 0, i58 = 0, i59 = 0, i60 = 0, i61 = 0, i62 = 0, i63 = 0, i64 = 0, i65 = 0, i66 = 0, i67 = 0, i68 = 0, i69 = 0, i70 = 0, i71 = 0, i72 = 0, i73 = 0, i74 = 0, i75 = 0, i76 = 0, i77 = 0, i78 = 0, i79 = 0, i80 = 0, i81 = 0, i82 = 0, i83 = 0, i84 = 0, i85 = 0, i86 = 0, i87 = 0, i88 = 0, i89 = 0, i90 = 0, i91 = 0, i92 = 0, i93 = 0, i94 = 0, i95 = 0, i96 = 0, i97 = 0, i98 = 0, i99 = 0, i100 = 0, i101 = 0, i102 = 0, i103 = 0, i104 = 0, i105 = 0, i106 = 0, i107 = 0, i108 = 0, i109 = 0, i110 = 0, i111 = 0, i112 = 0, i113 = 0, i114 = 0, i115 = 0, i116 = 0, i117 = 0, i118 = 0, i119 = 0, i120 = 0, i121 = 0, i122 = 0, i123 = 0, i124 = 0, i125 = 0, i126 = 0, i127 = 0, i128 = 0, i129 = 0, i130 = 0, i131 = 0, i132 = 0, i133 = 0, i134 = 0, i135 = 0, i136 = 0, i137 = 0, i138 = 0, i139 = 0, i140 = 0, i141 = 0, i142 = 0, i143 = 0, i144 = 0, i145 = 0, i146 = 0, i147 = 0, i148 = 0, i149 = 0, i150 = 0, i151 = 0, i152 = 0, i153 = 0, i154 = 0, i155 = 0, i156 = 0, i157 = 0, i158 = 0, i159 = 0, i160 = 0, i161 = 0, i162 = 0, i163 = 0, i164 = 0, i165 = 0, i166 = 0, i167 = 0, i168 = 0, i169 = 0, i170 = 0, i171 = 0, i172 = 0, i173 = 0, i174 = 0, i175 = 0, i176 = 0, i177 = 0, i178 = 0, i179 = 0, i180 = 0, i181 = 0, i182 = 0, i183 = 0, i184 = 0, i185 = 0, i186 = 0, i187 = 0, i188 = 0, i189 = 0, i190 = 0, i191 = 0, i192 = 0, i193 = 0, i194 = 0, i195 = 0, i196 = 0, i197 = 0, i198 = 0, i199 = 0, i200 = 0, i201 = 0, i202 = 0, i203 = 0, i204 = 0, i205 = 0, i206 = 0, i207 = 0, i208 = 0, i209 = 0, i210 = 0, i211 = 0, i212 = 0, i213 = 0, i214 = 0, i215 = 0, i216 = 0, i217 = 0, i218 = 0, i219 = 0, i220 = 0, i221 = 0, i222 = 0, i223 = 0, i224 = 0, i225 = 0, i226 = 0, i227 = 0, i228 = 0, i229 = 0, i230 = 0, i231 = 0, i232 = 0, i233 = 0, i234 = 0, i235 = 0, i236 = 0, i237 = 0, i238 = 0, i239 = 0, i240 = 0, i241 = 0, i242 = 0, i243 = 0, i244 = 0, i245 = 0, i246 = 0, i247 = 0, i248 = 0, i249 = 0, i250 = 0, i251 = 0, i252 = 0, i253 = 0, i254 = 0, i255 = 0, i256 = 0, i257 = 0, i258 = 0, i259 = 0, i260 = 0, i261 = 0, i262 = 0, i263 = 0, i264 = 0, i265 = 0, i266 = 0, i267 = 0, i268 = 0, i269 = 0, i270 = 0, i271 = 0, i272 = 0, i273 = 0, i274 = 0, i275 = 0, i276 = 0, i277 = 0, i278 = 0, i279 = 0, i280 = 0, i281 = 0, i282 = 0, i283 = 0, i284 = 0, i285 = 0, i286 = 0, i287 = 0, i288 = 0, i289 = 0, i290 = 0, i291 = 0, i292 = 0, i293 = 0, i294 = 0, i295 = 0, i296 = 0, i297 = 0, i298 = 0, i299 = 0, i300 = 0, i301 = 0, i302 = 0, i303 = 0, i304 = 0, i305 = 0, i306 = 0, i307 = 0, i308 = 0, i309 = 0, i310 = 0, i311 = 0, i312 = 0, i313 = 0, i314 = 0, i315 = 0, i316 = 0, i317 = 0, i318 = 0, i319 = 0, i320 = 0, i321 = 0, i322 = 0, i323 = 0, i324 = 0, i325 = 0, i326 = 0, i327 = 0, i328 = 0, i329 = 0, i330 = 0, i331 = 0, i332 = 0, i333 = 0, i334 = 0, i335 = 0, i336 = 0, i337 = 0, i338 = 0, i339 = 0, i340 = 0, i341 = 0, i342 = 0, i343 = 0, i344 = 0, i345 = 0, i346 = 0, i347 = 0, i348 = 0, i349 = 0, i350 = 0, i351 = 0, i352 = 0, i353 = 0, i354 = 0, i355 = 0, i356 = 0, i357 = 0, i358 = 0, i359 = 0, i360 = 0, i361 = 0, i362 = 0, i363 = 0, i364 = 0, i365 = 0, i366 = 0, i367 = 0, i368 = 0, i369 = 0, i370 = 0, i371 = 0, i372 = 0, i373 = 0, i374 = 0, i375 = 0, i376 = 0, i377 = 0, i378 = 0, i379 = 0, i380 = 0, i381 = 0, i382 = 0, i383 = 0, i384 = 0, i385 = 0, i386 = 0, i387 = 0, i388 = 0, i389 = 0, i390 = 0, i391 = 0, i392 = 0, i393 = 0, i394 = 0, i395 = 0;
  i2 = STACKTOP;
  STACKTOP = STACKTOP + 4 | 0;
  i3 = i2 | 0;
  if ((i1 | 0) == 0) {
    i4 = -2;
    STACKTOP = i2;
    return i4 | 0;
  }
  i5 = HEAP32[(i1 + 28 & 16777215) >> 2] | 0;
  if ((i5 | 0) == 0) {
    i4 = -2;
    STACKTOP = i2;
    return i4 | 0;
  }
  i6 = i1 + 12 | 0;
  i7 = HEAP32[(i6 & 16777215) >> 2] | 0;
  if ((i7 | 0) == 0) {
    i4 = -2;
    STACKTOP = i2;
    return i4 | 0;
  }
  i8 = i1 | 0;
  i9 = HEAP32[(i8 & 16777215) >> 2] | 0;
  do {
    if ((i9 | 0) == 0) {
      if ((HEAP32[(i1 + 4 & 16777215) >> 2] | 0) == 0) {
        break;
      } else {
        i4 = -2;
      }
      STACKTOP = i2;
      return i4 | 0;
    }
  } while (0);
  i10 = i5;
  i11 = i5 | 0;
  i12 = HEAP32[(i11 & 16777215) >> 2] | 0;
  if ((i12 | 0) == 11) {
    HEAP32[(i11 & 16777215) >> 2] = 12;
    i13 = HEAP32[(i6 & 16777215) >> 2] | 0;
    i14 = HEAP32[(i8 & 16777215) >> 2] | 0;
    i15 = 12;
  } else {
    i13 = i7;
    i14 = i9;
    i15 = i12;
  }
  i12 = i1 + 16 | 0;
  i9 = HEAP32[(i12 & 16777215) >> 2] | 0;
  i7 = i1 + 4 | 0;
  i16 = HEAP32[(i7 & 16777215) >> 2] | 0;
  i17 = i5 + 56 | 0;
  i18 = i5 + 60 | 0;
  i19 = i5 + 8 | 0;
  i20 = i5 + 24 | 0;
  i21 = i3 | 0;
  i22 = i3 + 1 | 0;
  i23 = i5 + 16 | 0;
  i24 = i5 + 32 | 0;
  i25 = i1 + 24 | 0;
  i26 = i5 + 36 | 0;
  i27 = i5 + 20 | 0;
  i28 = i1 + 48 | 0;
  i29 = i5 + 64 | 0;
  i30 = i5 + 12 | 0;
  i31 = i5 + 4 | 0;
  i32 = i5 + 7108 | 0;
  i33 = i5 + 84 | 0;
  i34 = i5 + 76 | 0;
  i35 = i5 + 72 | 0;
  i36 = i5 + 7112 | 0;
  i37 = i5 + 68 | 0;
  i38 = i5 + 44 | 0;
  i39 = i5 + 7104 | 0;
  i40 = i5 + 48 | 0;
  i41 = i5 + 52 | 0;
  i42 = i5 + 40 | 0;
  i43 = i1 + 20 | 0;
  i44 = i5 + 28 | 0;
  i45 = i5 + 96 | 0;
  i46 = i5 + 100 | 0;
  i47 = i5 + 92 | 0;
  i48 = i5 + 104 | 0;
  i49 = i5 + 108 | 0;
  i50 = i49;
  i51 = i49 | 0;
  i49 = i5 + 1328 | 0;
  i52 = i5 + 76 | 0;
  i53 = i5 + 112 | 0;
  i54 = i53;
  i55 = i5 + 752 | 0;
  i56 = i53;
  i53 = i5 + 624 | 0;
  i57 = i5 + 80 | 0;
  i58 = i5 + 88 | 0;
  i59 = i5 + 80 | 0;
  i5 = i3 + 2 | 0;
  i60 = i3 + 3 | 0;
  i3 = 0;
  i61 = i9;
  i62 = HEAP32[(i18 & 16777215) >> 2] | 0;
  i63 = HEAP32[(i17 & 16777215) >> 2] | 0;
  i64 = i9;
  i9 = i16;
  i65 = i13;
  i13 = i14;
  i14 = i15;
  L754 : while (1) {
    L756 : do {
      if ((i14 | 0) == 3) {
        if (i62 >>> 0 < 16) {
          i66 = i13;
          i67 = i9;
          i68 = i63;
          i69 = i62;
          i70 = 624;
          break;
        } else {
          i71 = i13;
          i72 = i9;
          i73 = i63;
          i70 = 626;
          break;
        }
      } else if ((i14 | 0) == 1) {
        i15 = i62 >>> 0 < 16;
        L759 : do {
          if (i15) {
            i74 = i13;
            i75 = i9;
            i76 = i63;
            i77 = i62;
            while (1) {
              if ((i75 | 0) == 0) {
                i78 = i3;
                i79 = i61;
                i80 = i77;
                i81 = i76;
                i82 = 0;
                i83 = i74;
                i84 = i64;
                break L754;
              }
              i85 = i75 - 1 | 0;
              i86 = i74 + 1 | 0;
              i87 = (HEAPU8[i74 & 16777215] << i77) + i76 | 0;
              i88 = i77 + 8 | 0;
              if (i88 >>> 0 < 16) {
                i74 = i86;
                i75 = i85;
                i76 = i87;
                i77 = i88;
              } else {
                i89 = i86;
                i90 = i85;
                i91 = i87;
                i92 = i88;
                break L759;
              }
            }
          } else {
            i89 = i13;
            i90 = i9;
            i91 = i63;
            i92 = i62;
          }
        } while (0);
        HEAP32[(i23 & 16777215) >> 2] = i91;
        if ((i91 & 255 | 0) != 8) {
          HEAP32[(i25 & 16777215) >> 2] = 5256044 | 0;
          HEAP32[(i11 & 16777215) >> 2] = 29;
          i93 = i3;
          i94 = i61;
          i95 = i92;
          i96 = i91;
          i97 = i64;
          i98 = i90;
          i99 = i65;
          i100 = i89;
          break;
        }
        if ((i91 & 57344 | 0) != 0) {
          HEAP32[(i25 & 16777215) >> 2] = 5255928 | 0;
          HEAP32[(i11 & 16777215) >> 2] = 29;
          i93 = i3;
          i94 = i61;
          i95 = i92;
          i96 = i91;
          i97 = i64;
          i98 = i90;
          i99 = i65;
          i100 = i89;
          break;
        }
        i15 = HEAP32[(i24 & 16777215) >> 2] | 0;
        if ((i15 | 0) == 0) {
          i101 = i91;
        } else {
          HEAP32[(i15 & 16777215) >> 2] = i91 >>> 8 & 1;
          i101 = HEAP32[(i23 & 16777215) >> 2] | 0;
        }
        if ((i101 & 512 | 0) != 0) {
          HEAP8[i21 & 16777215] = i91 & 255;
          HEAP8[i22 & 16777215] = i91 >>> 8 & 255;
          HEAP32[(i20 & 16777215) >> 2] = _crc32(HEAP32[(i20 & 16777215) >> 2] | 0, i21, 2);
        }
        HEAP32[(i11 & 16777215) >> 2] = 2;
        i102 = i89;
        i103 = i90;
        i104 = 0;
        i105 = 0;
        i70 = 616;
        break;
      } else if ((i14 | 0) == 9) {
        i15 = i62 >>> 0 < 32;
        L777 : do {
          if (i15) {
            i77 = i13;
            i76 = i9;
            i75 = i63;
            i74 = i62;
            while (1) {
              if ((i76 | 0) == 0) {
                i78 = i3;
                i79 = i61;
                i80 = i74;
                i81 = i75;
                i82 = 0;
                i83 = i77;
                i84 = i64;
                break L754;
              }
              i88 = i76 - 1 | 0;
              i87 = i77 + 1 | 0;
              i85 = (HEAPU8[i77 & 16777215] << i74) + i75 | 0;
              i86 = i74 + 8 | 0;
              if (i86 >>> 0 < 32) {
                i77 = i87;
                i76 = i88;
                i75 = i85;
                i74 = i86;
              } else {
                i106 = i87;
                i107 = i88;
                i108 = i85;
                break L777;
              }
            }
          } else {
            i106 = i13;
            i107 = i9;
            i108 = i63;
          }
        } while (0);
        i15 = _llvm_bswap_i32(i108 | 0) | 0;
        HEAP32[(i20 & 16777215) >> 2] = i15;
        HEAP32[(i28 & 16777215) >> 2] = i15;
        HEAP32[(i11 & 16777215) >> 2] = 10;
        i109 = 0;
        i110 = 0;
        i111 = i107;
        i112 = i106;
        i70 = 690;
        break;
      } else if ((i14 | 0) == 2) {
        if (i62 >>> 0 < 32) {
          i102 = i13;
          i103 = i9;
          i104 = i63;
          i105 = i62;
          i70 = 616;
          break;
        } else {
          i113 = i13;
          i114 = i9;
          i115 = i63;
          i70 = 618;
          break;
        }
      } else if ((i14 | 0) == 23) {
        i116 = i3;
        i117 = i62;
        i118 = i63;
        i119 = i9;
        i120 = i13;
        i121 = HEAP32[(i35 & 16777215) >> 2] | 0;
        i70 = 803;
        break;
      } else if ((i14 | 0) == 8) {
        i122 = i62;
        i123 = i63;
        i124 = i9;
        i125 = i13;
        i70 = 678;
      } else if ((i14 | 0) == 5) {
        i126 = i62;
        i127 = i63;
        i128 = i9;
        i129 = i13;
        i70 = 642;
      } else if ((i14 | 0) == 13) {
        i15 = i62 & 7;
        i74 = i63 >>> (i15 >>> 0);
        i75 = i62 - i15 | 0;
        i15 = i75 >>> 0 < 32;
        L785 : do {
          if (i15) {
            i76 = i13;
            i77 = i9;
            i85 = i74;
            i88 = i75;
            while (1) {
              if ((i77 | 0) == 0) {
                i78 = i3;
                i79 = i61;
                i80 = i88;
                i81 = i85;
                i82 = 0;
                i83 = i76;
                i84 = i64;
                break L754;
              }
              i87 = i77 - 1 | 0;
              i86 = i76 + 1 | 0;
              i130 = (HEAPU8[i76 & 16777215] << i88) + i85 | 0;
              i131 = i88 + 8 | 0;
              if (i131 >>> 0 < 32) {
                i76 = i86;
                i77 = i87;
                i85 = i130;
                i88 = i131;
              } else {
                i132 = i86;
                i133 = i87;
                i134 = i130;
                i135 = i131;
                break L785;
              }
            }
          } else {
            i132 = i13;
            i133 = i9;
            i134 = i74;
            i135 = i75;
          }
        } while (0);
        i75 = i134 & 65535;
        if ((i75 | 0) == (i134 >>> 16 ^ 65535 | 0)) {
          HEAP32[(i29 & 16777215) >> 2] = i75;
          HEAP32[(i11 & 16777215) >> 2] = 14;
          i136 = 0;
          i137 = 0;
          i138 = i133;
          i139 = i132;
          i70 = 710;
          break;
        } else {
          HEAP32[(i25 & 16777215) >> 2] = 5255732 | 0;
          HEAP32[(i11 & 16777215) >> 2] = 29;
          i93 = i3;
          i94 = i61;
          i95 = i135;
          i96 = i134;
          i97 = i64;
          i98 = i133;
          i99 = i65;
          i100 = i132;
          break;
        }
      } else if ((i14 | 0) == 14) {
        i136 = i62;
        i137 = i63;
        i138 = i9;
        i139 = i13;
        i70 = 710;
      } else if ((i14 | 0) == 15) {
        i140 = i62;
        i141 = i63;
        i142 = i9;
        i143 = i13;
        i70 = 711;
      } else if ((i14 | 0) == 6) {
        i144 = i62;
        i145 = i63;
        i146 = i9;
        i147 = i13;
        i148 = HEAP32[(i23 & 16777215) >> 2] | 0;
        i70 = 652;
        break;
      } else if ((i14 | 0) == 19) {
        i149 = i3;
        i150 = i62;
        i151 = i63;
        i152 = i9;
        i153 = i13;
        i70 = 764;
      } else if ((i14 | 0) == 20) {
        i154 = i3;
        i155 = i62;
        i156 = i63;
        i157 = i9;
        i158 = i13;
        i70 = 765;
      } else if ((i14 | 0) == 22) {
        i159 = i3;
        i160 = i62;
        i161 = i63;
        i162 = i9;
        i163 = i13;
        i70 = 791;
      } else if ((i14 | 0) == 24) {
        i164 = i3;
        i165 = i62;
        i166 = i63;
        i167 = i9;
        i168 = i13;
        i70 = 809;
      } else if ((i14 | 0) == 25) {
        if ((i64 | 0) == 0) {
          i78 = i3;
          i79 = i61;
          i80 = i62;
          i81 = i63;
          i82 = i9;
          i83 = i13;
          i84 = 0;
          break L754;
        }
        HEAP8[i65 & 16777215] = HEAP32[(i29 & 16777215) >> 2] & 255;
        HEAP32[(i11 & 16777215) >> 2] = 20;
        i93 = i3;
        i94 = i61;
        i95 = i62;
        i96 = i63;
        i97 = i64 - 1 | 0;
        i98 = i9;
        i99 = i65 + 1 | 0;
        i100 = i13;
        break;
      } else if ((i14 | 0) == 26) {
        do {
          if ((HEAP32[(i19 & 16777215) >> 2] | 0) == 0) {
            i169 = i61;
            i170 = i62;
            i171 = i63;
            i172 = i9;
            i173 = i13;
          } else {
            i75 = i62 >>> 0 < 32;
            L799 : do {
              if (i75) {
                i74 = i13;
                i15 = i9;
                i88 = i63;
                i85 = i62;
                while (1) {
                  if ((i15 | 0) == 0) {
                    i78 = i3;
                    i79 = i61;
                    i80 = i85;
                    i81 = i88;
                    i82 = 0;
                    i83 = i74;
                    i84 = i64;
                    break L754;
                  }
                  i77 = i15 - 1 | 0;
                  i76 = i74 + 1 | 0;
                  i131 = (HEAPU8[i74 & 16777215] << i85) + i88 | 0;
                  i130 = i85 + 8 | 0;
                  if (i130 >>> 0 < 32) {
                    i74 = i76;
                    i15 = i77;
                    i88 = i131;
                    i85 = i130;
                  } else {
                    i174 = i76;
                    i175 = i77;
                    i176 = i131;
                    i177 = i130;
                    break L799;
                  }
                }
              } else {
                i174 = i13;
                i175 = i9;
                i176 = i63;
                i177 = i62;
              }
            } while (0);
            i75 = i61 - i64 | 0;
            HEAP32[(i43 & 16777215) >> 2] = HEAP32[(i43 & 16777215) >> 2] + i75 | 0;
            HEAP32[(i44 & 16777215) >> 2] = HEAP32[(i44 & 16777215) >> 2] + i75 | 0;
            if ((i61 | 0) != (i64 | 0)) {
              i85 = HEAP32[(i20 & 16777215) >> 2] | 0;
              i88 = i65 + -i75 | 0;
              if ((HEAP32[(i23 & 16777215) >> 2] | 0) == 0) {
                i178 = _adler32(i85, i88, i75);
              } else {
                i178 = _crc32(i85, i88, i75);
              }
              HEAP32[(i20 & 16777215) >> 2] = i178;
              HEAP32[(i28 & 16777215) >> 2] = i178;
            }
            if ((HEAP32[(i23 & 16777215) >> 2] | 0) == 0) {
              i179 = _llvm_bswap_i32(i176 | 0) | 0;
            } else {
              i179 = i176;
            }
            if ((i179 | 0) == (HEAP32[(i20 & 16777215) >> 2] | 0)) {
              i169 = i64;
              i170 = 0;
              i171 = 0;
              i172 = i175;
              i173 = i174;
              break;
            }
            HEAP32[(i25 & 16777215) >> 2] = 5256144 | 0;
            HEAP32[(i11 & 16777215) >> 2] = 29;
            i93 = i3;
            i94 = i64;
            i95 = i177;
            i96 = i176;
            i97 = i64;
            i98 = i175;
            i99 = i65;
            i100 = i174;
            break L756;
          }
        } while (0);
        HEAP32[(i11 & 16777215) >> 2] = 27;
        i180 = i169;
        i181 = i170;
        i182 = i171;
        i183 = i172;
        i184 = i173;
        i70 = 840;
        break;
      } else if ((i14 | 0) == 27) {
        i180 = i61;
        i181 = i62;
        i182 = i63;
        i183 = i9;
        i184 = i13;
        i70 = 840;
      } else if ((i14 | 0) == 17) {
        i75 = HEAP32[(i48 & 16777215) >> 2] | 0;
        if (i75 >>> 0 < (HEAP32[(i47 & 16777215) >> 2] | 0) >>> 0) {
          i185 = i13;
          i186 = i9;
          i187 = i63;
          i188 = i62;
          i189 = i75;
          i70 = 721;
          break;
        } else {
          i190 = i13;
          i191 = i9;
          i192 = i63;
          i193 = i62;
          i194 = i75;
          i70 = 725;
          break;
        }
      } else if ((i14 | 0) == 18) {
        i195 = i3;
        i196 = i62;
        i197 = i63;
        i198 = i9;
        i199 = i13;
        i200 = HEAP32[(i48 & 16777215) >> 2] | 0;
        i70 = 730;
        break;
      } else if ((i14 | 0) == 0) {
        i75 = HEAP32[(i19 & 16777215) >> 2] | 0;
        if ((i75 | 0) == 0) {
          HEAP32[(i11 & 16777215) >> 2] = 12;
          i93 = i3;
          i94 = i61;
          i95 = i62;
          i96 = i63;
          i97 = i64;
          i98 = i9;
          i99 = i65;
          i100 = i13;
          break;
        }
        i88 = i62 >>> 0 < 16;
        L822 : do {
          if (i88) {
            i85 = i13;
            i15 = i9;
            i74 = i63;
            i130 = i62;
            while (1) {
              if ((i15 | 0) == 0) {
                i78 = i3;
                i79 = i61;
                i80 = i130;
                i81 = i74;
                i82 = 0;
                i83 = i85;
                i84 = i64;
                break L754;
              }
              i131 = i15 - 1 | 0;
              i77 = i85 + 1 | 0;
              i76 = (HEAPU8[i85 & 16777215] << i130) + i74 | 0;
              i87 = i130 + 8 | 0;
              if (i87 >>> 0 < 16) {
                i85 = i77;
                i15 = i131;
                i74 = i76;
                i130 = i87;
              } else {
                i201 = i77;
                i202 = i131;
                i203 = i76;
                i204 = i87;
                break L822;
              }
            }
          } else {
            i201 = i13;
            i202 = i9;
            i203 = i63;
            i204 = i62;
          }
        } while (0);
        if ((i75 & 2 | 0) != 0 & (i203 | 0) == 35615) {
          HEAP32[(i20 & 16777215) >> 2] = _crc32(0, 0, 0);
          HEAP8[i21 & 16777215] = 31;
          HEAP8[i22 & 16777215] = -117;
          HEAP32[(i20 & 16777215) >> 2] = _crc32(HEAP32[(i20 & 16777215) >> 2] | 0, i21, 2);
          HEAP32[(i11 & 16777215) >> 2] = 1;
          i93 = i3;
          i94 = i61;
          i95 = 0;
          i96 = 0;
          i97 = i64;
          i98 = i202;
          i99 = i65;
          i100 = i201;
          break;
        }
        HEAP32[(i23 & 16777215) >> 2] = 0;
        i88 = HEAP32[(i24 & 16777215) >> 2] | 0;
        if ((i88 | 0) == 0) {
          i205 = i75;
        } else {
          HEAP32[(i88 + 48 & 16777215) >> 2] = -1;
          i205 = HEAP32[(i19 & 16777215) >> 2] | 0;
        }
        do {
          if ((i205 & 1 | 0) != 0) {
            if (((((i203 << 8 & 65280) + (i203 >>> 8) | 0) >>> 0) % 31 | 0) != 0) {
              break;
            }
            if ((i203 & 15 | 0) != 8) {
              HEAP32[(i25 & 16777215) >> 2] = 5256044 | 0;
              HEAP32[(i11 & 16777215) >> 2] = 29;
              i93 = i3;
              i94 = i61;
              i95 = i204;
              i96 = i203;
              i97 = i64;
              i98 = i202;
              i99 = i65;
              i100 = i201;
              break L756;
            }
            i88 = i203 >>> 4;
            i130 = i204 - 4 | 0;
            i74 = (i88 & 15) + 8 | 0;
            i15 = HEAP32[(i26 & 16777215) >> 2] | 0;
            do {
              if ((i15 | 0) == 0) {
                HEAP32[(i26 & 16777215) >> 2] = i74;
              } else {
                if (i74 >>> 0 <= i15 >>> 0) {
                  break;
                }
                HEAP32[(i25 & 16777215) >> 2] = 5255976 | 0;
                HEAP32[(i11 & 16777215) >> 2] = 29;
                i93 = i3;
                i94 = i61;
                i95 = i130;
                i96 = i88;
                i97 = i64;
                i98 = i202;
                i99 = i65;
                i100 = i201;
                break L756;
              }
            } while (0);
            HEAP32[(i27 & 16777215) >> 2] = 1 << i74;
            i88 = _adler32(0, 0, 0);
            HEAP32[(i20 & 16777215) >> 2] = i88;
            HEAP32[(i28 & 16777215) >> 2] = i88;
            HEAP32[(i11 & 16777215) >> 2] = i203 >>> 12 & 2 ^ 11;
            i93 = i3;
            i94 = i61;
            i95 = 0;
            i96 = 0;
            i97 = i64;
            i98 = i202;
            i99 = i65;
            i100 = i201;
            break L756;
          }
        } while (0);
        HEAP32[(i25 & 16777215) >> 2] = 5256268 | 0;
        HEAP32[(i11 & 16777215) >> 2] = 29;
        i93 = i3;
        i94 = i61;
        i95 = i204;
        i96 = i203;
        i97 = i64;
        i98 = i202;
        i99 = i65;
        i100 = i201;
        break;
      } else if ((i14 | 0) == 16) {
        i75 = i62 >>> 0 < 14;
        L846 : do {
          if (i75) {
            i88 = i13;
            i130 = i9;
            i15 = i63;
            i85 = i62;
            while (1) {
              if ((i130 | 0) == 0) {
                i78 = i3;
                i79 = i61;
                i80 = i85;
                i81 = i15;
                i82 = 0;
                i83 = i88;
                i84 = i64;
                break L754;
              }
              i87 = i130 - 1 | 0;
              i76 = i88 + 1 | 0;
              i131 = (HEAPU8[i88 & 16777215] << i85) + i15 | 0;
              i77 = i85 + 8 | 0;
              if (i77 >>> 0 < 14) {
                i88 = i76;
                i130 = i87;
                i15 = i131;
                i85 = i77;
              } else {
                i206 = i76;
                i207 = i87;
                i208 = i131;
                i209 = i77;
                break L846;
              }
            }
          } else {
            i206 = i13;
            i207 = i9;
            i208 = i63;
            i209 = i62;
          }
        } while (0);
        i75 = (i208 & 31) + 257 | 0;
        HEAP32[(i45 & 16777215) >> 2] = i75;
        i85 = (i208 >>> 5 & 31) + 1 | 0;
        HEAP32[(i46 & 16777215) >> 2] = i85;
        HEAP32[(i47 & 16777215) >> 2] = (i208 >>> 10 & 15) + 4 | 0;
        i15 = i208 >>> 14;
        i130 = i209 - 14 | 0;
        if (i75 >>> 0 > 286 | i85 >>> 0 > 30) {
          HEAP32[(i25 & 16777215) >> 2] = 5255652 | 0;
          HEAP32[(i11 & 16777215) >> 2] = 29;
          i93 = i3;
          i94 = i61;
          i95 = i130;
          i96 = i15;
          i97 = i64;
          i98 = i207;
          i99 = i65;
          i100 = i206;
          break;
        } else {
          HEAP32[(i48 & 16777215) >> 2] = 0;
          HEAP32[(i11 & 16777215) >> 2] = 17;
          i185 = i206;
          i186 = i207;
          i187 = i15;
          i188 = i130;
          i189 = 0;
          i70 = 721;
          break;
        }
      } else if ((i14 | 0) == 4) {
        i210 = i62;
        i211 = i63;
        i212 = i9;
        i213 = i13;
        i70 = 631;
      } else if ((i14 | 0) == 11 || (i14 | 0) == 12) {
        i214 = i62;
        i215 = i63;
        i216 = i9;
        i217 = i13;
        i70 = 693;
      } else if ((i14 | 0) == 7) {
        i218 = i62;
        i219 = i63;
        i220 = i9;
        i221 = i13;
        i70 = 665;
      } else if ((i14 | 0) == 21) {
        i222 = i3;
        i223 = i62;
        i224 = i63;
        i225 = i9;
        i226 = i13;
        i227 = HEAP32[(i35 & 16777215) >> 2] | 0;
        i70 = 784;
        break;
      } else if ((i14 | 0) == 10) {
        i109 = i62;
        i110 = i63;
        i111 = i9;
        i112 = i13;
        i70 = 690;
      } else if ((i14 | 0) == 29) {
        i70 = 848;
        break L754;
      } else if ((i14 | 0) == 28) {
        i78 = 1;
        i79 = i61;
        i80 = i62;
        i81 = i63;
        i82 = i9;
        i83 = i13;
        i84 = i64;
        break L754;
      } else if ((i14 | 0) == 30) {
        i4 = -4;
        i70 = 865;
        break L754;
      } else {
        i70 = 863;
        break L754;
      }
    } while (0);
    L855 : do {
      if (i70 == 616) {
        while (1) {
          i70 = 0;
          if ((i103 | 0) == 0) {
            i78 = i3;
            i79 = i61;
            i80 = i105;
            i81 = i104;
            i82 = 0;
            i83 = i102;
            i84 = i64;
            break L754;
          }
          i130 = i103 - 1 | 0;
          i15 = i102 + 1 | 0;
          i85 = (HEAPU8[i102 & 16777215] << i105) + i104 | 0;
          i75 = i105 + 8 | 0;
          if (i75 >>> 0 < 32) {
            i102 = i15;
            i103 = i130;
            i104 = i85;
            i105 = i75;
            i70 = 616;
          } else {
            i113 = i15;
            i114 = i130;
            i115 = i85;
            i70 = 618;
            break L855;
          }
        }
      } else if (i70 == 710) {
        i70 = 0;
        HEAP32[(i11 & 16777215) >> 2] = 15;
        i140 = i136;
        i141 = i137;
        i142 = i138;
        i143 = i139;
        i70 = 711;
        break;
      } else if (i70 == 840) {
        i70 = 0;
        if ((HEAP32[(i19 & 16777215) >> 2] | 0) == 0) {
          i228 = i181;
          i229 = i182;
          i230 = i183;
          i231 = i184;
          i70 = 847;
          break L754;
        }
        if ((HEAP32[(i23 & 16777215) >> 2] | 0) == 0) {
          i228 = i181;
          i229 = i182;
          i230 = i183;
          i231 = i184;
          i70 = 847;
          break L754;
        }
        i85 = i181 >>> 0 < 32;
        L863 : do {
          if (i85) {
            i130 = i184;
            i15 = i183;
            i75 = i182;
            i88 = i181;
            while (1) {
              if ((i15 | 0) == 0) {
                i78 = i3;
                i79 = i180;
                i80 = i88;
                i81 = i75;
                i82 = 0;
                i83 = i130;
                i84 = i64;
                break L754;
              }
              i74 = i15 - 1 | 0;
              i77 = i130 + 1 | 0;
              i131 = (HEAPU8[i130 & 16777215] << i88) + i75 | 0;
              i87 = i88 + 8 | 0;
              if (i87 >>> 0 < 32) {
                i130 = i77;
                i15 = i74;
                i75 = i131;
                i88 = i87;
              } else {
                i232 = i77;
                i233 = i74;
                i234 = i131;
                i235 = i87;
                break L863;
              }
            }
          } else {
            i232 = i184;
            i233 = i183;
            i234 = i182;
            i235 = i181;
          }
        } while (0);
        if ((i234 | 0) == (HEAP32[(i44 & 16777215) >> 2] | 0)) {
          i228 = 0;
          i229 = 0;
          i230 = i233;
          i231 = i232;
          i70 = 847;
          break L754;
        }
        HEAP32[(i25 & 16777215) >> 2] = 5256096 | 0;
        HEAP32[(i11 & 16777215) >> 2] = 29;
        i93 = i3;
        i94 = i180;
        i95 = i235;
        i96 = i234;
        i97 = i64;
        i98 = i233;
        i99 = i65;
        i100 = i232;
        break;
      } else if (i70 == 721) {
        while (1) {
          i70 = 0;
          i85 = i188 >>> 0 < 3;
          L871 : do {
            if (i85) {
              i88 = i185;
              i75 = i186;
              i15 = i187;
              i130 = i188;
              while (1) {
                if ((i75 | 0) == 0) {
                  i78 = i3;
                  i79 = i61;
                  i80 = i130;
                  i81 = i15;
                  i82 = 0;
                  i83 = i88;
                  i84 = i64;
                  break L754;
                }
                i87 = i75 - 1 | 0;
                i131 = i88 + 1 | 0;
                i74 = (HEAPU8[i88 & 16777215] << i130) + i15 | 0;
                i77 = i130 + 8 | 0;
                if (i77 >>> 0 < 3) {
                  i88 = i131;
                  i75 = i87;
                  i15 = i74;
                  i130 = i77;
                } else {
                  i236 = i131;
                  i237 = i87;
                  i238 = i74;
                  i239 = i77;
                  break L871;
                }
              }
            } else {
              i236 = i185;
              i237 = i186;
              i238 = i187;
              i239 = i188;
            }
          } while (0);
          HEAP32[(i48 & 16777215) >> 2] = i189 + 1 | 0;
          HEAP16[((HEAPU16[((i189 << 1) + 5244492 & 16777215) >> 1] << 1) + i56 & 16777215) >> 1] = i238 & 7;
          i85 = i238 >>> 3;
          i130 = i239 - 3 | 0;
          i15 = HEAP32[(i48 & 16777215) >> 2] | 0;
          if (i15 >>> 0 < (HEAP32[(i47 & 16777215) >> 2] | 0) >>> 0) {
            i185 = i236;
            i186 = i237;
            i187 = i85;
            i188 = i130;
            i189 = i15;
            i70 = 721;
          } else {
            i190 = i236;
            i191 = i237;
            i192 = i85;
            i193 = i130;
            i194 = i15;
            i70 = 725;
            break L855;
          }
        }
      } else if (i70 == 690) {
        i70 = 0;
        if ((HEAP32[(i30 & 16777215) >> 2] | 0) == 0) {
          i70 = 691;
          break L754;
        }
        i15 = _adler32(0, 0, 0);
        HEAP32[(i20 & 16777215) >> 2] = i15;
        HEAP32[(i28 & 16777215) >> 2] = i15;
        HEAP32[(i11 & 16777215) >> 2] = 11;
        i214 = i109;
        i215 = i110;
        i216 = i111;
        i217 = i112;
        i70 = 693;
        break;
      }
    } while (0);
    do {
      if (i70 == 618) {
        i70 = 0;
        i15 = HEAP32[(i24 & 16777215) >> 2] | 0;
        if ((i15 | 0) != 0) {
          HEAP32[(i15 + 4 & 16777215) >> 2] = i115;
        }
        if ((HEAP32[(i23 & 16777215) >> 2] & 512 | 0) != 0) {
          HEAP8[i21 & 16777215] = i115 & 255;
          HEAP8[i22 & 16777215] = i115 >>> 8 & 255;
          HEAP8[i5 & 16777215] = i115 >>> 16 & 255;
          HEAP8[i60 & 16777215] = i115 >>> 24 & 255;
          HEAP32[(i20 & 16777215) >> 2] = _crc32(HEAP32[(i20 & 16777215) >> 2] | 0, i21, 4);
        }
        HEAP32[(i11 & 16777215) >> 2] = 3;
        i66 = i113;
        i67 = i114;
        i68 = 0;
        i69 = 0;
        i70 = 624;
        break;
      } else if (i70 == 711) {
        i70 = 0;
        i15 = HEAP32[(i29 & 16777215) >> 2] | 0;
        if ((i15 | 0) == 0) {
          HEAP32[(i11 & 16777215) >> 2] = 11;
          i93 = i3;
          i94 = i61;
          i95 = i140;
          i96 = i141;
          i97 = i64;
          i98 = i142;
          i99 = i65;
          i100 = i143;
          break;
        }
        i130 = i15 >>> 0 > i142 >>> 0 ? i142 : i15;
        i15 = i130 >>> 0 > i64 >>> 0 ? i64 : i130;
        if ((i15 | 0) == 0) {
          i78 = i3;
          i79 = i61;
          i80 = i140;
          i81 = i141;
          i82 = i142;
          i83 = i143;
          i84 = i64;
          break L754;
        }
        _memcpy(i65 | 0, i143 | 0, i15 | 0, 1 | 0);
        HEAP32[(i29 & 16777215) >> 2] = HEAP32[(i29 & 16777215) >> 2] - i15 | 0;
        i93 = i3;
        i94 = i61;
        i95 = i140;
        i96 = i141;
        i97 = i64 - i15 | 0;
        i98 = i142 - i15 | 0;
        i99 = i65 + i15 | 0;
        i100 = i143 + i15 | 0;
        break;
      } else if (i70 == 725) {
        i70 = 0;
        i15 = i194 >>> 0 < 19;
        L892 : do {
          if (i15) {
            i130 = i194;
            while (1) {
              HEAP32[(i48 & 16777215) >> 2] = i130 + 1 | 0;
              HEAP16[((HEAPU16[((i130 << 1) + 5244492 & 16777215) >> 1] << 1) + i56 & 16777215) >> 1] = 0;
              i85 = HEAP32[(i48 & 16777215) >> 2] | 0;
              if (i85 >>> 0 < 19) {
                i130 = i85;
              } else {
                break L892;
              }
            }
          }
        } while (0);
        HEAP32[(i51 & 16777215) >> 2] = i49;
        HEAP32[(i52 & 16777215) >> 2] = i49;
        HEAP32[(i33 & 16777215) >> 2] = 7;
        i15 = _inflate_table(0, i54, 19, i50, i33, i55);
        if ((i15 | 0) == 0) {
          HEAP32[(i48 & 16777215) >> 2] = 0;
          HEAP32[(i11 & 16777215) >> 2] = 18;
          i195 = 0;
          i196 = i193;
          i197 = i192;
          i198 = i191;
          i199 = i190;
          i200 = 0;
          i70 = 730;
          break;
        } else {
          HEAP32[(i25 & 16777215) >> 2] = 5255588 | 0;
          HEAP32[(i11 & 16777215) >> 2] = 29;
          i93 = i15;
          i94 = i61;
          i95 = i193;
          i96 = i192;
          i97 = i64;
          i98 = i191;
          i99 = i65;
          i100 = i190;
          break;
        }
      } else if (i70 == 693) {
        i70 = 0;
        if ((HEAP32[(i31 & 16777215) >> 2] | 0) != 0) {
          i15 = i214 & 7;
          HEAP32[(i11 & 16777215) >> 2] = 26;
          i93 = i3;
          i94 = i61;
          i95 = i214 - i15 | 0;
          i96 = i215 >>> (i15 >>> 0);
          i97 = i64;
          i98 = i216;
          i99 = i65;
          i100 = i217;
          break;
        }
        i15 = i214 >>> 0 < 3;
        L903 : do {
          if (i15) {
            i130 = i217;
            i85 = i216;
            i75 = i215;
            i88 = i214;
            while (1) {
              if ((i85 | 0) == 0) {
                i78 = i3;
                i79 = i61;
                i80 = i88;
                i81 = i75;
                i82 = 0;
                i83 = i130;
                i84 = i64;
                break L754;
              }
              i77 = i85 - 1 | 0;
              i74 = i130 + 1 | 0;
              i87 = (HEAPU8[i130 & 16777215] << i88) + i75 | 0;
              i131 = i88 + 8 | 0;
              if (i131 >>> 0 < 3) {
                i130 = i74;
                i85 = i77;
                i75 = i87;
                i88 = i131;
              } else {
                i240 = i74;
                i241 = i77;
                i242 = i87;
                i243 = i131;
                break L903;
              }
            }
          } else {
            i240 = i217;
            i241 = i216;
            i242 = i215;
            i243 = i214;
          }
        } while (0);
        HEAP32[(i31 & 16777215) >> 2] = i242 & 1;
        i15 = i242 >>> 1 & 3;
        if ((i15 | 0) == 3) {
          HEAP32[(i25 & 16777215) >> 2] = 5255840 | 0;
          HEAP32[(i11 & 16777215) >> 2] = 29;
        } else if ((i15 | 0) == 0) {
          HEAP32[(i11 & 16777215) >> 2] = 13;
        } else if ((i15 | 0) == 1) {
          _fixedtables(i10);
          HEAP32[(i11 & 16777215) >> 2] = 19;
        } else if ((i15 | 0) == 2) {
          HEAP32[(i11 & 16777215) >> 2] = 16;
        }
        i93 = i3;
        i94 = i61;
        i95 = i243 - 3 | 0;
        i96 = i242 >>> 3;
        i97 = i64;
        i98 = i241;
        i99 = i65;
        i100 = i240;
        break;
      }
    } while (0);
    L914 : do {
      if (i70 == 624) {
        while (1) {
          i70 = 0;
          if ((i67 | 0) == 0) {
            i78 = i3;
            i79 = i61;
            i80 = i69;
            i81 = i68;
            i82 = 0;
            i83 = i66;
            i84 = i64;
            break L754;
          }
          i15 = i67 - 1 | 0;
          i88 = i66 + 1 | 0;
          i75 = (HEAPU8[i66 & 16777215] << i69) + i68 | 0;
          i85 = i69 + 8 | 0;
          if (i85 >>> 0 < 16) {
            i66 = i88;
            i67 = i15;
            i68 = i75;
            i69 = i85;
            i70 = 624;
          } else {
            i71 = i88;
            i72 = i15;
            i73 = i75;
            i70 = 626;
            break L914;
          }
        }
      } else if (i70 == 730) {
        i70 = 0;
        i75 = HEAP32[(i45 & 16777215) >> 2] | 0;
        i15 = HEAP32[(i46 & 16777215) >> 2] | 0;
        do {
          if (i200 >>> 0 < (i15 + i75 | 0) >>> 0) {
            i88 = i199;
            i85 = i198;
            i130 = i197;
            i131 = i196;
            i87 = i200;
            i77 = i75;
            i74 = i15;
            L920 : while (1) {
              i76 = (1 << HEAP32[(i33 & 16777215) >> 2]) - 1 | 0;
              i86 = i76 & i130;
              i244 = HEAP32[(i34 & 16777215) >> 2] | 0;
              i245 = HEAPU8[(i86 << 2) + i244 + 1 & 16777215];
              i246 = i245 >>> 0 > i131 >>> 0;
              L922 : do {
                if (i246) {
                  i247 = i88;
                  i248 = i85;
                  i249 = i130;
                  i250 = i131;
                  while (1) {
                    if ((i248 | 0) == 0) {
                      i78 = i195;
                      i79 = i61;
                      i80 = i250;
                      i81 = i249;
                      i82 = 0;
                      i83 = i247;
                      i84 = i64;
                      break L754;
                    }
                    i251 = i248 - 1 | 0;
                    i252 = i247 + 1 | 0;
                    i253 = (HEAPU8[i247 & 16777215] << i250) + i249 | 0;
                    i254 = i250 + 8 | 0;
                    i255 = i76 & i253;
                    i256 = HEAPU8[(i255 << 2) + i244 + 1 & 16777215];
                    if (i256 >>> 0 > i254 >>> 0) {
                      i247 = i252;
                      i248 = i251;
                      i249 = i253;
                      i250 = i254;
                    } else {
                      i257 = i252;
                      i258 = i251;
                      i259 = i253;
                      i260 = i254;
                      i261 = i255;
                      i262 = i256;
                      break L922;
                    }
                  }
                } else {
                  i257 = i88;
                  i258 = i85;
                  i259 = i130;
                  i260 = i131;
                  i261 = i86;
                  i262 = i245;
                }
              } while (0);
              i245 = HEAP16[((i261 << 2) + i244 + 2 & 16777215) >> 1] | 0;
              i86 = (i245 & 65535) < 16;
              L927 : do {
                if (i86) {
                  HEAP32[(i48 & 16777215) >> 2] = i87 + 1 | 0;
                  HEAP16[((i87 << 1) + i56 & 16777215) >> 1] = i245;
                  i263 = i260 - i262 | 0;
                  i264 = i259 >>> (i262 >>> 0);
                  i265 = i258;
                  i266 = i257;
                } else {
                  if (i245 << 16 >> 16 == 16) {
                    i76 = i262 + 2 | 0;
                    i246 = i260 >>> 0 < i76 >>> 0;
                    L938 : do {
                      if (i246) {
                        i250 = i257;
                        i249 = i258;
                        i248 = i259;
                        i247 = i260;
                        while (1) {
                          if ((i249 | 0) == 0) {
                            i78 = i195;
                            i79 = i61;
                            i80 = i247;
                            i81 = i248;
                            i82 = 0;
                            i83 = i250;
                            i84 = i64;
                            break L754;
                          }
                          i256 = i249 - 1 | 0;
                          i255 = i250 + 1 | 0;
                          i254 = (HEAPU8[i250 & 16777215] << i247) + i248 | 0;
                          i253 = i247 + 8 | 0;
                          if (i253 >>> 0 < i76 >>> 0) {
                            i250 = i255;
                            i249 = i256;
                            i248 = i254;
                            i247 = i253;
                          } else {
                            i267 = i255;
                            i268 = i256;
                            i269 = i254;
                            i270 = i253;
                            break L938;
                          }
                        }
                      } else {
                        i267 = i257;
                        i268 = i258;
                        i269 = i259;
                        i270 = i260;
                      }
                    } while (0);
                    i271 = i269 >>> (i262 >>> 0);
                    i272 = i270 - i262 | 0;
                    if ((i87 | 0) == 0) {
                      i70 = 744;
                      break L920;
                    }
                    i273 = HEAP16[((i87 - 1 << 1) + i56 & 16777215) >> 1] | 0;
                    i274 = (i271 & 3) + 3 | 0;
                    i275 = i272 - 2 | 0;
                    i276 = i271 >>> 2;
                    i277 = i268;
                    i278 = i267;
                  } else if (i245 << 16 >> 16 == 17) {
                    i76 = i262 + 3 | 0;
                    i246 = i260 >>> 0 < i76 >>> 0;
                    L945 : do {
                      if (i246) {
                        i247 = i257;
                        i248 = i258;
                        i249 = i259;
                        i250 = i260;
                        while (1) {
                          if ((i248 | 0) == 0) {
                            i78 = i195;
                            i79 = i61;
                            i80 = i250;
                            i81 = i249;
                            i82 = 0;
                            i83 = i247;
                            i84 = i64;
                            break L754;
                          }
                          i253 = i248 - 1 | 0;
                          i254 = i247 + 1 | 0;
                          i256 = (HEAPU8[i247 & 16777215] << i250) + i249 | 0;
                          i255 = i250 + 8 | 0;
                          if (i255 >>> 0 < i76 >>> 0) {
                            i247 = i254;
                            i248 = i253;
                            i249 = i256;
                            i250 = i255;
                          } else {
                            i279 = i254;
                            i280 = i253;
                            i281 = i256;
                            i282 = i255;
                            break L945;
                          }
                        }
                      } else {
                        i279 = i257;
                        i280 = i258;
                        i281 = i259;
                        i282 = i260;
                      }
                    } while (0);
                    i76 = i281 >>> (i262 >>> 0);
                    i273 = 0;
                    i274 = (i76 & 7) + 3 | 0;
                    i275 = -3 - i262 + i282 | 0;
                    i276 = i76 >>> 3;
                    i277 = i280;
                    i278 = i279;
                  } else {
                    i76 = i262 + 7 | 0;
                    i246 = i260 >>> 0 < i76 >>> 0;
                    L932 : do {
                      if (i246) {
                        i250 = i257;
                        i249 = i258;
                        i248 = i259;
                        i247 = i260;
                        while (1) {
                          if ((i249 | 0) == 0) {
                            i78 = i195;
                            i79 = i61;
                            i80 = i247;
                            i81 = i248;
                            i82 = 0;
                            i83 = i250;
                            i84 = i64;
                            break L754;
                          }
                          i255 = i249 - 1 | 0;
                          i256 = i250 + 1 | 0;
                          i253 = (HEAPU8[i250 & 16777215] << i247) + i248 | 0;
                          i254 = i247 + 8 | 0;
                          if (i254 >>> 0 < i76 >>> 0) {
                            i250 = i256;
                            i249 = i255;
                            i248 = i253;
                            i247 = i254;
                          } else {
                            i283 = i256;
                            i284 = i255;
                            i285 = i253;
                            i286 = i254;
                            break L932;
                          }
                        }
                      } else {
                        i283 = i257;
                        i284 = i258;
                        i285 = i259;
                        i286 = i260;
                      }
                    } while (0);
                    i76 = i285 >>> (i262 >>> 0);
                    i273 = 0;
                    i274 = (i76 & 127) + 11 | 0;
                    i275 = -7 - i262 + i286 | 0;
                    i276 = i76 >>> 7;
                    i277 = i284;
                    i278 = i283;
                  }
                  if ((i87 + i274 | 0) >>> 0 > (i74 + i77 | 0) >>> 0) {
                    i70 = 753;
                    break L920;
                  } else {
                    i287 = i274;
                    i288 = i87;
                  }
                  while (1) {
                    i76 = i287 - 1 | 0;
                    HEAP32[(i48 & 16777215) >> 2] = i288 + 1 | 0;
                    HEAP16[((i288 << 1) + i56 & 16777215) >> 1] = i273;
                    if ((i76 | 0) == 0) {
                      i263 = i275;
                      i264 = i276;
                      i265 = i277;
                      i266 = i278;
                      break L927;
                    }
                    i287 = i76;
                    i288 = HEAP32[(i48 & 16777215) >> 2] | 0;
                  }
                }
              } while (0);
              i245 = HEAP32[(i48 & 16777215) >> 2] | 0;
              i289 = HEAP32[(i45 & 16777215) >> 2] | 0;
              i86 = HEAP32[(i46 & 16777215) >> 2] | 0;
              if (i245 >>> 0 < (i86 + i289 | 0) >>> 0) {
                i88 = i266;
                i85 = i265;
                i130 = i264;
                i131 = i263;
                i87 = i245;
                i77 = i289;
                i74 = i86;
              } else {
                i70 = 756;
                break;
              }
            }
            if (i70 == 756) {
              i70 = 0;
              if ((HEAP32[(i11 & 16777215) >> 2] | 0) == 29) {
                i93 = i195;
                i94 = i61;
                i95 = i263;
                i96 = i264;
                i97 = i64;
                i98 = i265;
                i99 = i65;
                i100 = i266;
                break L914;
              } else {
                i290 = i289;
                i291 = i263;
                i292 = i264;
                i293 = i265;
                i294 = i266;
                break;
              }
            } else if (i70 == 744) {
              i70 = 0;
              HEAP32[(i25 & 16777215) >> 2] = 5256356 | 0;
              HEAP32[(i11 & 16777215) >> 2] = 29;
              i93 = i195;
              i94 = i61;
              i95 = i272;
              i96 = i271;
              i97 = i64;
              i98 = i268;
              i99 = i65;
              i100 = i267;
              break L914;
            } else if (i70 == 753) {
              i70 = 0;
              HEAP32[(i25 & 16777215) >> 2] = 5256356 | 0;
              HEAP32[(i11 & 16777215) >> 2] = 29;
              i93 = i195;
              i94 = i61;
              i95 = i275;
              i96 = i276;
              i97 = i64;
              i98 = i277;
              i99 = i65;
              i100 = i278;
              break L914;
            }
          } else {
            i290 = i75;
            i291 = i196;
            i292 = i197;
            i293 = i198;
            i294 = i199;
          }
        } while (0);
        if (HEAP16[(i53 & 16777215) >> 1] << 16 >> 16 == 0) {
          HEAP32[(i25 & 16777215) >> 2] = 5256292 | 0;
          HEAP32[(i11 & 16777215) >> 2] = 29;
          i93 = i195;
          i94 = i61;
          i95 = i291;
          i96 = i292;
          i97 = i64;
          i98 = i293;
          i99 = i65;
          i100 = i294;
          break;
        }
        HEAP32[(i51 & 16777215) >> 2] = i49;
        HEAP32[(i52 & 16777215) >> 2] = i49;
        HEAP32[(i33 & 16777215) >> 2] = 9;
        i75 = _inflate_table(1, i54, i290, i50, i33, i55);
        if ((i75 | 0) != 0) {
          HEAP32[(i25 & 16777215) >> 2] = 5256236 | 0;
          HEAP32[(i11 & 16777215) >> 2] = 29;
          i93 = i75;
          i94 = i61;
          i95 = i291;
          i96 = i292;
          i97 = i64;
          i98 = i293;
          i99 = i65;
          i100 = i294;
          break;
        }
        HEAP32[(i57 & 16777215) >> 2] = HEAP32[(i50 & 16777215) >> 2] | 0;
        HEAP32[(i58 & 16777215) >> 2] = 6;
        i75 = _inflate_table(2, (HEAP32[(i45 & 16777215) >> 2] << 1) + i54 | 0, HEAP32[(i46 & 16777215) >> 2] | 0, i50, i58, i55);
        if ((i75 | 0) == 0) {
          HEAP32[(i11 & 16777215) >> 2] = 19;
          i149 = 0;
          i150 = i291;
          i151 = i292;
          i152 = i293;
          i153 = i294;
          i70 = 764;
          break;
        } else {
          HEAP32[(i25 & 16777215) >> 2] = 5256168 | 0;
          HEAP32[(i11 & 16777215) >> 2] = 29;
          i93 = i75;
          i94 = i61;
          i95 = i291;
          i96 = i292;
          i97 = i64;
          i98 = i293;
          i99 = i65;
          i100 = i294;
          break;
        }
      }
    } while (0);
    do {
      if (i70 == 764) {
        i70 = 0;
        HEAP32[(i11 & 16777215) >> 2] = 20;
        i154 = i149;
        i155 = i150;
        i156 = i151;
        i157 = i152;
        i158 = i153;
        i70 = 765;
        break;
      } else if (i70 == 626) {
        i70 = 0;
        i75 = HEAP32[(i24 & 16777215) >> 2] | 0;
        if ((i75 | 0) != 0) {
          HEAP32[(i75 + 8 & 16777215) >> 2] = i73 & 255;
          HEAP32[(HEAP32[(i24 & 16777215) >> 2] + 12 & 16777215) >> 2] = i73 >>> 8;
        }
        if ((HEAP32[(i23 & 16777215) >> 2] & 512 | 0) != 0) {
          HEAP8[i21 & 16777215] = i73 & 255;
          HEAP8[i22 & 16777215] = i73 >>> 8 & 255;
          HEAP32[(i20 & 16777215) >> 2] = _crc32(HEAP32[(i20 & 16777215) >> 2] | 0, i21, 2);
        }
        HEAP32[(i11 & 16777215) >> 2] = 4;
        i210 = 0;
        i211 = 0;
        i212 = i72;
        i213 = i71;
        i70 = 631;
        break;
      }
    } while (0);
    do {
      if (i70 == 765) {
        i70 = 0;
        if (i157 >>> 0 > 5 & i64 >>> 0 > 257) {
          HEAP32[(i6 & 16777215) >> 2] = i65;
          HEAP32[(i12 & 16777215) >> 2] = i64;
          HEAP32[(i8 & 16777215) >> 2] = i158;
          HEAP32[(i7 & 16777215) >> 2] = i157;
          HEAP32[(i17 & 16777215) >> 2] = i156;
          HEAP32[(i18 & 16777215) >> 2] = i155;
          _inflate_fast(i1, i61);
          i75 = HEAP32[(i6 & 16777215) >> 2] | 0;
          i15 = HEAP32[(i12 & 16777215) >> 2] | 0;
          i74 = HEAP32[(i8 & 16777215) >> 2] | 0;
          i77 = HEAP32[(i7 & 16777215) >> 2] | 0;
          i87 = HEAP32[(i17 & 16777215) >> 2] | 0;
          i131 = HEAP32[(i18 & 16777215) >> 2] | 0;
          if ((HEAP32[(i11 & 16777215) >> 2] | 0) != 11) {
            i93 = i154;
            i94 = i61;
            i95 = i131;
            i96 = i87;
            i97 = i15;
            i98 = i77;
            i99 = i75;
            i100 = i74;
            break;
          }
          HEAP32[(i32 & 16777215) >> 2] = -1;
          i93 = i154;
          i94 = i61;
          i95 = i131;
          i96 = i87;
          i97 = i15;
          i98 = i77;
          i99 = i75;
          i100 = i74;
          break;
        }
        HEAP32[(i32 & 16777215) >> 2] = 0;
        i74 = (1 << HEAP32[(i33 & 16777215) >> 2]) - 1 | 0;
        i75 = i74 & i156;
        i77 = HEAP32[(i34 & 16777215) >> 2] | 0;
        i15 = HEAP8[(i75 << 2) + i77 + 1 & 16777215] | 0;
        i87 = i15 & 255;
        i131 = i87 >>> 0 > i155 >>> 0;
        L984 : do {
          if (i131) {
            i130 = i158;
            i85 = i157;
            i88 = i156;
            i86 = i155;
            while (1) {
              if ((i85 | 0) == 0) {
                i78 = i154;
                i79 = i61;
                i80 = i86;
                i81 = i88;
                i82 = 0;
                i83 = i130;
                i84 = i64;
                break L754;
              }
              i245 = i85 - 1 | 0;
              i244 = i130 + 1 | 0;
              i76 = (HEAPU8[i130 & 16777215] << i86) + i88 | 0;
              i246 = i86 + 8 | 0;
              i247 = i74 & i76;
              i248 = HEAP8[(i247 << 2) + i77 + 1 & 16777215] | 0;
              i249 = i248 & 255;
              if (i249 >>> 0 > i246 >>> 0) {
                i130 = i244;
                i85 = i245;
                i88 = i76;
                i86 = i246;
              } else {
                i295 = i244;
                i296 = i245;
                i297 = i76;
                i298 = i246;
                i299 = i248;
                i300 = i247;
                i301 = i249;
                break L984;
              }
            }
          } else {
            i295 = i158;
            i296 = i157;
            i297 = i156;
            i298 = i155;
            i299 = i15;
            i300 = i75;
            i301 = i87;
          }
        } while (0);
        i87 = HEAP8[(i300 << 2) + i77 & 16777215] | 0;
        i75 = HEAP16[((i300 << 2) + i77 + 2 & 16777215) >> 1] | 0;
        i15 = i87 & 255;
        do {
          if (i87 << 24 >> 24 == 0) {
            i302 = 0;
            i303 = i299;
            i304 = i75;
            i305 = i298;
            i306 = i297;
            i307 = i296;
            i308 = i295;
            i309 = 0;
          } else {
            if ((i15 & 240 | 0) != 0) {
              i302 = i87;
              i303 = i299;
              i304 = i75;
              i305 = i298;
              i306 = i297;
              i307 = i296;
              i308 = i295;
              i309 = 0;
              break;
            }
            i74 = i75 & 65535;
            i131 = (1 << i301 + i15) - 1 | 0;
            i86 = ((i297 & i131) >>> (i301 >>> 0)) + i74 | 0;
            i88 = HEAP8[(i86 << 2) + i77 + 1 & 16777215] | 0;
            i85 = ((i88 & 255) + i301 | 0) >>> 0 > i298 >>> 0;
            L992 : do {
              if (i85) {
                i130 = i295;
                i249 = i296;
                i247 = i297;
                i248 = i298;
                while (1) {
                  if ((i249 | 0) == 0) {
                    i78 = i154;
                    i79 = i61;
                    i80 = i248;
                    i81 = i247;
                    i82 = 0;
                    i83 = i130;
                    i84 = i64;
                    break L754;
                  }
                  i246 = i249 - 1 | 0;
                  i76 = i130 + 1 | 0;
                  i245 = (HEAPU8[i130 & 16777215] << i248) + i247 | 0;
                  i244 = i248 + 8 | 0;
                  i250 = ((i245 & i131) >>> (i301 >>> 0)) + i74 | 0;
                  i254 = HEAP8[(i250 << 2) + i77 + 1 & 16777215] | 0;
                  if (((i254 & 255) + i301 | 0) >>> 0 > i244 >>> 0) {
                    i130 = i76;
                    i249 = i246;
                    i247 = i245;
                    i248 = i244;
                  } else {
                    i310 = i76;
                    i311 = i246;
                    i312 = i245;
                    i313 = i244;
                    i314 = i250;
                    i315 = i254;
                    break L992;
                  }
                }
              } else {
                i310 = i295;
                i311 = i296;
                i312 = i297;
                i313 = i298;
                i314 = i86;
                i315 = i88;
              }
            } while (0);
            i88 = HEAP16[((i314 << 2) + i77 + 2 & 16777215) >> 1] | 0;
            i86 = HEAP8[(i314 << 2) + i77 & 16777215] | 0;
            HEAP32[(i32 & 16777215) >> 2] = i301;
            i302 = i86;
            i303 = i315;
            i304 = i88;
            i305 = i313 - i301 | 0;
            i306 = i312 >>> (i301 >>> 0);
            i307 = i311;
            i308 = i310;
            i309 = i301;
          }
        } while (0);
        i77 = i303 & 255;
        i15 = i306 >>> (i77 >>> 0);
        i75 = i305 - i77 | 0;
        HEAP32[(i32 & 16777215) >> 2] = i309 + i77 | 0;
        HEAP32[(i29 & 16777215) >> 2] = i304 & 65535;
        i77 = i302 & 255;
        if (i302 << 24 >> 24 == 0) {
          HEAP32[(i11 & 16777215) >> 2] = 25;
          i93 = i154;
          i94 = i61;
          i95 = i75;
          i96 = i15;
          i97 = i64;
          i98 = i307;
          i99 = i65;
          i100 = i308;
          break;
        }
        if ((i77 & 32 | 0) != 0) {
          HEAP32[(i32 & 16777215) >> 2] = -1;
          HEAP32[(i11 & 16777215) >> 2] = 11;
          i93 = i154;
          i94 = i61;
          i95 = i75;
          i96 = i15;
          i97 = i64;
          i98 = i307;
          i99 = i65;
          i100 = i308;
          break;
        }
        if ((i77 & 64 | 0) == 0) {
          i87 = i77 & 15;
          HEAP32[(i35 & 16777215) >> 2] = i87;
          HEAP32[(i11 & 16777215) >> 2] = 21;
          i222 = i154;
          i223 = i75;
          i224 = i15;
          i225 = i307;
          i226 = i308;
          i227 = i87;
          i70 = 784;
          break;
        } else {
          HEAP32[(i25 & 16777215) >> 2] = 5256016 | 0;
          HEAP32[(i11 & 16777215) >> 2] = 29;
          i93 = i154;
          i94 = i61;
          i95 = i75;
          i96 = i15;
          i97 = i64;
          i98 = i307;
          i99 = i65;
          i100 = i308;
          break;
        }
      } else if (i70 == 631) {
        i70 = 0;
        i15 = HEAP32[(i23 & 16777215) >> 2] | 0;
        do {
          if ((i15 & 1024 | 0) == 0) {
            i75 = HEAP32[(i24 & 16777215) >> 2] | 0;
            if ((i75 | 0) == 0) {
              i316 = i210;
              i317 = i211;
              i318 = i212;
              i319 = i213;
              break;
            }
            HEAP32[(i75 + 16 & 16777215) >> 2] = 0;
            i316 = i210;
            i317 = i211;
            i318 = i212;
            i319 = i213;
          } else {
            i75 = i210 >>> 0 < 16;
            L1010 : do {
              if (i75) {
                i87 = i213;
                i77 = i212;
                i88 = i211;
                i86 = i210;
                while (1) {
                  if ((i77 | 0) == 0) {
                    i78 = i3;
                    i79 = i61;
                    i80 = i86;
                    i81 = i88;
                    i82 = 0;
                    i83 = i87;
                    i84 = i64;
                    break L754;
                  }
                  i74 = i77 - 1 | 0;
                  i131 = i87 + 1 | 0;
                  i85 = (HEAPU8[i87 & 16777215] << i86) + i88 | 0;
                  i248 = i86 + 8 | 0;
                  if (i248 >>> 0 < 16) {
                    i87 = i131;
                    i77 = i74;
                    i88 = i85;
                    i86 = i248;
                  } else {
                    i320 = i131;
                    i321 = i74;
                    i322 = i85;
                    break L1010;
                  }
                }
              } else {
                i320 = i213;
                i321 = i212;
                i322 = i211;
              }
            } while (0);
            HEAP32[(i29 & 16777215) >> 2] = i322;
            i75 = HEAP32[(i24 & 16777215) >> 2] | 0;
            if ((i75 | 0) == 0) {
              i323 = i15;
            } else {
              HEAP32[(i75 + 20 & 16777215) >> 2] = i322;
              i323 = HEAP32[(i23 & 16777215) >> 2] | 0;
            }
            if ((i323 & 512 | 0) == 0) {
              i316 = 0;
              i317 = 0;
              i318 = i321;
              i319 = i320;
              break;
            }
            HEAP8[i21 & 16777215] = i322 & 255;
            HEAP8[i22 & 16777215] = i322 >>> 8 & 255;
            HEAP32[(i20 & 16777215) >> 2] = _crc32(HEAP32[(i20 & 16777215) >> 2] | 0, i21, 2);
            i316 = 0;
            i317 = 0;
            i318 = i321;
            i319 = i320;
          }
        } while (0);
        HEAP32[(i11 & 16777215) >> 2] = 5;
        i126 = i316;
        i127 = i317;
        i128 = i318;
        i129 = i319;
        i70 = 642;
        break;
      }
    } while (0);
    do {
      if (i70 == 642) {
        i70 = 0;
        i15 = HEAP32[(i23 & 16777215) >> 2] | 0;
        if ((i15 & 1024 | 0) == 0) {
          i324 = i128;
          i325 = i129;
          i326 = i15;
        } else {
          i75 = HEAP32[(i29 & 16777215) >> 2] | 0;
          i86 = i75 >>> 0 > i128 >>> 0 ? i128 : i75;
          if ((i86 | 0) == 0) {
            i327 = i128;
            i328 = i129;
            i329 = i75;
            i330 = i15;
          } else {
            i88 = HEAP32[(i24 & 16777215) >> 2] | 0;
            do {
              if ((i88 | 0) == 0) {
                i331 = i15;
              } else {
                i77 = HEAP32[(i88 + 16 & 16777215) >> 2] | 0;
                if ((i77 | 0) == 0) {
                  i331 = i15;
                  break;
                }
                i87 = HEAP32[(i88 + 20 & 16777215) >> 2] - i75 | 0;
                i85 = HEAP32[(i88 + 24 & 16777215) >> 2] | 0;
                _memcpy(i77 + i87 | 0, i129 | 0, ((i87 + i86 | 0) >>> 0 > i85 >>> 0 ? i85 - i87 | 0 : i86) | 0, 1 | 0);
                i331 = HEAP32[(i23 & 16777215) >> 2] | 0;
              }
            } while (0);
            if ((i331 & 512 | 0) != 0) {
              HEAP32[(i20 & 16777215) >> 2] = _crc32(HEAP32[(i20 & 16777215) >> 2] | 0, i129, i86);
            }
            i88 = HEAP32[(i29 & 16777215) >> 2] - i86 | 0;
            HEAP32[(i29 & 16777215) >> 2] = i88;
            i327 = i128 - i86 | 0;
            i328 = i129 + i86 | 0;
            i329 = i88;
            i330 = i331;
          }
          if ((i329 | 0) == 0) {
            i324 = i327;
            i325 = i328;
            i326 = i330;
          } else {
            i78 = i3;
            i79 = i61;
            i80 = i126;
            i81 = i127;
            i82 = i327;
            i83 = i328;
            i84 = i64;
            break L754;
          }
        }
        HEAP32[(i29 & 16777215) >> 2] = 0;
        HEAP32[(i11 & 16777215) >> 2] = 6;
        i144 = i126;
        i145 = i127;
        i146 = i324;
        i147 = i325;
        i148 = i326;
        i70 = 652;
        break;
      } else if (i70 == 784) {
        i70 = 0;
        if ((i227 | 0) == 0) {
          i332 = i223;
          i333 = i224;
          i334 = i225;
          i335 = i226;
          i336 = HEAP32[(i29 & 16777215) >> 2] | 0;
        } else {
          i88 = i223 >>> 0 < i227 >>> 0;
          L1041 : do {
            if (i88) {
              i75 = i226;
              i15 = i225;
              i87 = i224;
              i85 = i223;
              while (1) {
                if ((i15 | 0) == 0) {
                  i78 = i222;
                  i79 = i61;
                  i80 = i85;
                  i81 = i87;
                  i82 = 0;
                  i83 = i75;
                  i84 = i64;
                  break L754;
                }
                i77 = i15 - 1 | 0;
                i74 = i75 + 1 | 0;
                i131 = (HEAPU8[i75 & 16777215] << i85) + i87 | 0;
                i248 = i85 + 8 | 0;
                if (i248 >>> 0 < i227 >>> 0) {
                  i75 = i74;
                  i15 = i77;
                  i87 = i131;
                  i85 = i248;
                } else {
                  i337 = i74;
                  i338 = i77;
                  i339 = i131;
                  i340 = i248;
                  break L1041;
                }
              }
            } else {
              i337 = i226;
              i338 = i225;
              i339 = i224;
              i340 = i223;
            }
          } while (0);
          i88 = HEAP32[(i29 & 16777215) >> 2] + ((1 << i227) - 1 & i339) | 0;
          HEAP32[(i29 & 16777215) >> 2] = i88;
          HEAP32[(i32 & 16777215) >> 2] = HEAP32[(i32 & 16777215) >> 2] + i227 | 0;
          i332 = i340 - i227 | 0;
          i333 = i339 >>> (i227 >>> 0);
          i334 = i338;
          i335 = i337;
          i336 = i88;
        }
        HEAP32[(i36 & 16777215) >> 2] = i336;
        HEAP32[(i11 & 16777215) >> 2] = 22;
        i159 = i222;
        i160 = i332;
        i161 = i333;
        i162 = i334;
        i163 = i335;
        i70 = 791;
        break;
      }
    } while (0);
    do {
      if (i70 == 791) {
        i70 = 0;
        i88 = (1 << HEAP32[(i58 & 16777215) >> 2]) - 1 | 0;
        i86 = i88 & i161;
        i85 = HEAP32[(i59 & 16777215) >> 2] | 0;
        i87 = HEAP8[(i86 << 2) + i85 + 1 & 16777215] | 0;
        i15 = i87 & 255;
        i75 = i15 >>> 0 > i160 >>> 0;
        L1049 : do {
          if (i75) {
            i248 = i163;
            i131 = i162;
            i77 = i161;
            i74 = i160;
            while (1) {
              if ((i131 | 0) == 0) {
                i78 = i159;
                i79 = i61;
                i80 = i74;
                i81 = i77;
                i82 = 0;
                i83 = i248;
                i84 = i64;
                break L754;
              }
              i247 = i131 - 1 | 0;
              i249 = i248 + 1 | 0;
              i130 = (HEAPU8[i248 & 16777215] << i74) + i77 | 0;
              i254 = i74 + 8 | 0;
              i250 = i88 & i130;
              i244 = HEAP8[(i250 << 2) + i85 + 1 & 16777215] | 0;
              i245 = i244 & 255;
              if (i245 >>> 0 > i254 >>> 0) {
                i248 = i249;
                i131 = i247;
                i77 = i130;
                i74 = i254;
              } else {
                i341 = i249;
                i342 = i247;
                i343 = i130;
                i344 = i254;
                i345 = i244;
                i346 = i250;
                i347 = i245;
                break L1049;
              }
            }
          } else {
            i341 = i163;
            i342 = i162;
            i343 = i161;
            i344 = i160;
            i345 = i87;
            i346 = i86;
            i347 = i15;
          }
        } while (0);
        i15 = HEAP8[(i346 << 2) + i85 & 16777215] | 0;
        i86 = HEAP16[((i346 << 2) + i85 + 2 & 16777215) >> 1] | 0;
        i87 = i15 & 255;
        if ((i87 & 240 | 0) == 0) {
          i88 = i86 & 65535;
          i75 = (1 << i347 + i87) - 1 | 0;
          i87 = ((i343 & i75) >>> (i347 >>> 0)) + i88 | 0;
          i74 = HEAP8[(i87 << 2) + i85 + 1 & 16777215] | 0;
          i77 = ((i74 & 255) + i347 | 0) >>> 0 > i344 >>> 0;
          L1057 : do {
            if (i77) {
              i131 = i341;
              i248 = i342;
              i245 = i343;
              i250 = i344;
              while (1) {
                if ((i248 | 0) == 0) {
                  i78 = i159;
                  i79 = i61;
                  i80 = i250;
                  i81 = i245;
                  i82 = 0;
                  i83 = i131;
                  i84 = i64;
                  break L754;
                }
                i244 = i248 - 1 | 0;
                i254 = i131 + 1 | 0;
                i130 = (HEAPU8[i131 & 16777215] << i250) + i245 | 0;
                i247 = i250 + 8 | 0;
                i249 = ((i130 & i75) >>> (i347 >>> 0)) + i88 | 0;
                i246 = HEAP8[(i249 << 2) + i85 + 1 & 16777215] | 0;
                if (((i246 & 255) + i347 | 0) >>> 0 > i247 >>> 0) {
                  i131 = i254;
                  i248 = i244;
                  i245 = i130;
                  i250 = i247;
                } else {
                  i348 = i254;
                  i349 = i244;
                  i350 = i130;
                  i351 = i247;
                  i352 = i249;
                  i353 = i246;
                  break L1057;
                }
              }
            } else {
              i348 = i341;
              i349 = i342;
              i350 = i343;
              i351 = i344;
              i352 = i87;
              i353 = i74;
            }
          } while (0);
          i74 = HEAP16[((i352 << 2) + i85 + 2 & 16777215) >> 1] | 0;
          i87 = HEAP8[(i352 << 2) + i85 & 16777215] | 0;
          i88 = HEAP32[(i32 & 16777215) >> 2] + i347 | 0;
          HEAP32[(i32 & 16777215) >> 2] = i88;
          i354 = i87;
          i355 = i353;
          i356 = i74;
          i357 = i351 - i347 | 0;
          i358 = i350 >>> (i347 >>> 0);
          i359 = i349;
          i360 = i348;
          i361 = i88;
        } else {
          i354 = i15;
          i355 = i345;
          i356 = i86;
          i357 = i344;
          i358 = i343;
          i359 = i342;
          i360 = i341;
          i361 = HEAP32[(i32 & 16777215) >> 2] | 0;
        }
        i88 = i355 & 255;
        i74 = i358 >>> (i88 >>> 0);
        i87 = i357 - i88 | 0;
        HEAP32[(i32 & 16777215) >> 2] = i361 + i88 | 0;
        i88 = i354 & 255;
        if ((i88 & 64 | 0) == 0) {
          HEAP32[(i37 & 16777215) >> 2] = i356 & 65535;
          i75 = i88 & 15;
          HEAP32[(i35 & 16777215) >> 2] = i75;
          HEAP32[(i11 & 16777215) >> 2] = 23;
          i116 = i159;
          i117 = i87;
          i118 = i74;
          i119 = i359;
          i120 = i360;
          i121 = i75;
          i70 = 803;
          break;
        } else {
          HEAP32[(i25 & 16777215) >> 2] = 5256120 | 0;
          HEAP32[(i11 & 16777215) >> 2] = 29;
          i93 = i159;
          i94 = i61;
          i95 = i87;
          i96 = i74;
          i97 = i64;
          i98 = i359;
          i99 = i65;
          i100 = i360;
          break;
        }
      } else if (i70 == 652) {
        i70 = 0;
        do {
          if ((i148 & 2048 | 0) == 0) {
            i74 = HEAP32[(i24 & 16777215) >> 2] | 0;
            if ((i74 | 0) == 0) {
              i362 = i146;
              i363 = i147;
              break;
            }
            HEAP32[(i74 + 28 & 16777215) >> 2] = 0;
            i362 = i146;
            i363 = i147;
          } else {
            if ((i146 | 0) == 0) {
              i78 = i3;
              i79 = i61;
              i80 = i144;
              i81 = i145;
              i82 = 0;
              i83 = i147;
              i84 = i64;
              break L754;
            } else {
              i364 = 0;
            }
            while (1) {
              i365 = i364 + 1 | 0;
              i74 = HEAP8[i147 + i364 & 16777215] | 0;
              i87 = HEAP32[(i24 & 16777215) >> 2] | 0;
              do {
                if ((i87 | 0) != 0) {
                  i75 = i87 + 28 | 0;
                  if ((HEAP32[(i75 & 16777215) >> 2] | 0) == 0) {
                    break;
                  }
                  i88 = HEAP32[(i29 & 16777215) >> 2] | 0;
                  if (i88 >>> 0 >= (HEAP32[(i87 + 32 & 16777215) >> 2] | 0) >>> 0) {
                    break;
                  }
                  HEAP32[(i29 & 16777215) >> 2] = i88 + 1 | 0;
                  HEAP8[HEAP32[(i75 & 16777215) >> 2] + i88 & 16777215] = i74;
                }
              } while (0);
              i366 = i74 << 24 >> 24 != 0;
              if (i366 & i365 >>> 0 < i146 >>> 0) {
                i364 = i365;
              } else {
                break;
              }
            }
            if ((HEAP32[(i23 & 16777215) >> 2] & 512 | 0) != 0) {
              HEAP32[(i20 & 16777215) >> 2] = _crc32(HEAP32[(i20 & 16777215) >> 2] | 0, i147, i365);
            }
            i87 = i146 - i365 | 0;
            i88 = i147 + i365 | 0;
            if (i366) {
              i78 = i3;
              i79 = i61;
              i80 = i144;
              i81 = i145;
              i82 = i87;
              i83 = i88;
              i84 = i64;
              break L754;
            } else {
              i362 = i87;
              i363 = i88;
            }
          }
        } while (0);
        HEAP32[(i29 & 16777215) >> 2] = 0;
        HEAP32[(i11 & 16777215) >> 2] = 7;
        i218 = i144;
        i219 = i145;
        i220 = i362;
        i221 = i363;
        i70 = 665;
        break;
      }
    } while (0);
    do {
      if (i70 == 803) {
        i70 = 0;
        if ((i121 | 0) == 0) {
          i367 = i117;
          i368 = i118;
          i369 = i119;
          i370 = i120;
        } else {
          i86 = i117 >>> 0 < i121 >>> 0;
          L1087 : do {
            if (i86) {
              i15 = i120;
              i85 = i119;
              i88 = i118;
              i87 = i117;
              while (1) {
                if ((i85 | 0) == 0) {
                  i78 = i116;
                  i79 = i61;
                  i80 = i87;
                  i81 = i88;
                  i82 = 0;
                  i83 = i15;
                  i84 = i64;
                  break L754;
                }
                i75 = i85 - 1 | 0;
                i77 = i15 + 1 | 0;
                i250 = (HEAPU8[i15 & 16777215] << i87) + i88 | 0;
                i245 = i87 + 8 | 0;
                if (i245 >>> 0 < i121 >>> 0) {
                  i15 = i77;
                  i85 = i75;
                  i88 = i250;
                  i87 = i245;
                } else {
                  i371 = i77;
                  i372 = i75;
                  i373 = i250;
                  i374 = i245;
                  break L1087;
                }
              }
            } else {
              i371 = i120;
              i372 = i119;
              i373 = i118;
              i374 = i117;
            }
          } while (0);
          HEAP32[(i37 & 16777215) >> 2] = HEAP32[(i37 & 16777215) >> 2] + ((1 << i121) - 1 & i373) | 0;
          HEAP32[(i32 & 16777215) >> 2] = HEAP32[(i32 & 16777215) >> 2] + i121 | 0;
          i367 = i374 - i121 | 0;
          i368 = i373 >>> (i121 >>> 0);
          i369 = i372;
          i370 = i371;
        }
        HEAP32[(i11 & 16777215) >> 2] = 24;
        i164 = i116;
        i165 = i367;
        i166 = i368;
        i167 = i369;
        i168 = i370;
        i70 = 809;
        break;
      } else if (i70 == 665) {
        i70 = 0;
        do {
          if ((HEAP32[(i23 & 16777215) >> 2] & 4096 | 0) == 0) {
            i86 = HEAP32[(i24 & 16777215) >> 2] | 0;
            if ((i86 | 0) == 0) {
              i375 = i220;
              i376 = i221;
              break;
            }
            HEAP32[(i86 + 36 & 16777215) >> 2] = 0;
            i375 = i220;
            i376 = i221;
          } else {
            if ((i220 | 0) == 0) {
              i78 = i3;
              i79 = i61;
              i80 = i218;
              i81 = i219;
              i82 = 0;
              i83 = i221;
              i84 = i64;
              break L754;
            } else {
              i377 = 0;
            }
            while (1) {
              i378 = i377 + 1 | 0;
              i86 = HEAP8[i221 + i377 & 16777215] | 0;
              i87 = HEAP32[(i24 & 16777215) >> 2] | 0;
              do {
                if ((i87 | 0) != 0) {
                  i88 = i87 + 36 | 0;
                  if ((HEAP32[(i88 & 16777215) >> 2] | 0) == 0) {
                    break;
                  }
                  i85 = HEAP32[(i29 & 16777215) >> 2] | 0;
                  if (i85 >>> 0 >= (HEAP32[(i87 + 40 & 16777215) >> 2] | 0) >>> 0) {
                    break;
                  }
                  HEAP32[(i29 & 16777215) >> 2] = i85 + 1 | 0;
                  HEAP8[HEAP32[(i88 & 16777215) >> 2] + i85 & 16777215] = i86;
                }
              } while (0);
              i379 = i86 << 24 >> 24 != 0;
              if (i379 & i378 >>> 0 < i220 >>> 0) {
                i377 = i378;
              } else {
                break;
              }
            }
            if ((HEAP32[(i23 & 16777215) >> 2] & 512 | 0) != 0) {
              HEAP32[(i20 & 16777215) >> 2] = _crc32(HEAP32[(i20 & 16777215) >> 2] | 0, i221, i378);
            }
            i87 = i220 - i378 | 0;
            i74 = i221 + i378 | 0;
            if (i379) {
              i78 = i3;
              i79 = i61;
              i80 = i218;
              i81 = i219;
              i82 = i87;
              i83 = i74;
              i84 = i64;
              break L754;
            } else {
              i375 = i87;
              i376 = i74;
            }
          }
        } while (0);
        HEAP32[(i11 & 16777215) >> 2] = 8;
        i122 = i218;
        i123 = i219;
        i124 = i375;
        i125 = i376;
        i70 = 678;
        break;
      }
    } while (0);
    L1110 : do {
      if (i70 == 678) {
        i70 = 0;
        i74 = HEAP32[(i23 & 16777215) >> 2] | 0;
        do {
          if ((i74 & 512 | 0) == 0) {
            i380 = i122;
            i381 = i123;
            i382 = i124;
            i383 = i125;
          } else {
            i87 = i122 >>> 0 < 16;
            L1114 : do {
              if (i87) {
                i85 = i125;
                i88 = i124;
                i15 = i123;
                i245 = i122;
                while (1) {
                  if ((i88 | 0) == 0) {
                    i78 = i3;
                    i79 = i61;
                    i80 = i245;
                    i81 = i15;
                    i82 = 0;
                    i83 = i85;
                    i84 = i64;
                    break L754;
                  }
                  i250 = i88 - 1 | 0;
                  i75 = i85 + 1 | 0;
                  i77 = (HEAPU8[i85 & 16777215] << i245) + i15 | 0;
                  i248 = i245 + 8 | 0;
                  if (i248 >>> 0 < 16) {
                    i85 = i75;
                    i88 = i250;
                    i15 = i77;
                    i245 = i248;
                  } else {
                    i384 = i75;
                    i385 = i250;
                    i386 = i77;
                    i387 = i248;
                    break L1114;
                  }
                }
              } else {
                i384 = i125;
                i385 = i124;
                i386 = i123;
                i387 = i122;
              }
            } while (0);
            if ((i386 | 0) == (HEAP32[(i20 & 16777215) >> 2] & 65535 | 0)) {
              i380 = 0;
              i381 = 0;
              i382 = i385;
              i383 = i384;
              break;
            }
            HEAP32[(i25 & 16777215) >> 2] = 5255884 | 0;
            HEAP32[(i11 & 16777215) >> 2] = 29;
            i93 = i3;
            i94 = i61;
            i95 = i387;
            i96 = i386;
            i97 = i64;
            i98 = i385;
            i99 = i65;
            i100 = i384;
            break L1110;
          }
        } while (0);
        i87 = HEAP32[(i24 & 16777215) >> 2] | 0;
        if ((i87 | 0) != 0) {
          HEAP32[(i87 + 44 & 16777215) >> 2] = i74 >>> 9 & 1;
          HEAP32[(HEAP32[(i24 & 16777215) >> 2] + 48 & 16777215) >> 2] = 1;
        }
        i87 = _crc32(0, 0, 0);
        HEAP32[(i20 & 16777215) >> 2] = i87;
        HEAP32[(i28 & 16777215) >> 2] = i87;
        HEAP32[(i11 & 16777215) >> 2] = 11;
        i93 = i3;
        i94 = i61;
        i95 = i380;
        i96 = i381;
        i97 = i64;
        i98 = i382;
        i99 = i65;
        i100 = i383;
      } else if (i70 == 809) {
        i70 = 0;
        if ((i64 | 0) == 0) {
          i78 = i164;
          i79 = i61;
          i80 = i165;
          i81 = i166;
          i82 = i167;
          i83 = i168;
          i84 = 0;
          break L754;
        }
        i87 = i61 - i64 | 0;
        i245 = HEAP32[(i37 & 16777215) >> 2] | 0;
        if (i245 >>> 0 > i87 >>> 0) {
          i15 = i245 - i87 | 0;
          do {
            if (i15 >>> 0 > (HEAP32[(i38 & 16777215) >> 2] | 0) >>> 0) {
              if ((HEAP32[(i39 & 16777215) >> 2] | 0) == 0) {
                break;
              }
              HEAP32[(i25 & 16777215) >> 2] = 5255764 | 0;
              HEAP32[(i11 & 16777215) >> 2] = 29;
              i93 = i164;
              i94 = i61;
              i95 = i165;
              i96 = i166;
              i97 = i64;
              i98 = i167;
              i99 = i65;
              i100 = i168;
              break L1110;
            }
          } while (0);
          i74 = HEAP32[(i40 & 16777215) >> 2] | 0;
          if (i15 >>> 0 > i74 >>> 0) {
            i87 = i15 - i74 | 0;
            i388 = HEAP32[(i41 & 16777215) >> 2] + (HEAP32[(i42 & 16777215) >> 2] - i87) | 0;
            i389 = i87;
          } else {
            i388 = HEAP32[(i41 & 16777215) >> 2] + (i74 - i15) | 0;
            i389 = i15;
          }
          i74 = HEAP32[(i29 & 16777215) >> 2] | 0;
          i390 = i388;
          i391 = i389 >>> 0 > i74 >>> 0 ? i74 : i389;
          i392 = i74;
        } else {
          i74 = HEAP32[(i29 & 16777215) >> 2] | 0;
          i390 = i65 + -i245 | 0;
          i391 = i74;
          i392 = i74;
        }
        i74 = i391 >>> 0 > i64 >>> 0 ? i64 : i391;
        HEAP32[(i29 & 16777215) >> 2] = i392 - i74 | 0;
        i87 = i64 ^ -1;
        i88 = i391 ^ -1;
        i85 = i87 >>> 0 > i88 >>> 0 ? i87 : i88;
        i88 = i390;
        i87 = i74;
        i86 = i65;
        while (1) {
          HEAP8[i86 & 16777215] = HEAP8[i88 & 16777215] | 0;
          i248 = i87 - 1 | 0;
          if ((i248 | 0) == 0) {
            break;
          } else {
            i88 = i88 + 1 | 0;
            i87 = i248;
            i86 = i86 + 1 | 0;
          }
        }
        i86 = i64 - i74 | 0;
        i87 = i65 + (i85 ^ -1) | 0;
        if ((HEAP32[(i29 & 16777215) >> 2] | 0) != 0) {
          i93 = i164;
          i94 = i61;
          i95 = i165;
          i96 = i166;
          i97 = i86;
          i98 = i167;
          i99 = i87;
          i100 = i168;
          break;
        }
        HEAP32[(i11 & 16777215) >> 2] = 20;
        i93 = i164;
        i94 = i61;
        i95 = i165;
        i96 = i166;
        i97 = i86;
        i98 = i167;
        i99 = i87;
        i100 = i168;
      }
    } while (0);
    i3 = i93;
    i61 = i94;
    i62 = i95;
    i63 = i96;
    i64 = i97;
    i9 = i98;
    i65 = i99;
    i13 = i100;
    i14 = HEAP32[(i11 & 16777215) >> 2] | 0;
  }
  if (i70 == 691) {
    HEAP32[(i6 & 16777215) >> 2] = i65;
    HEAP32[(i12 & 16777215) >> 2] = i64;
    HEAP32[(i8 & 16777215) >> 2] = i112;
    HEAP32[(i7 & 16777215) >> 2] = i111;
    HEAP32[(i17 & 16777215) >> 2] = i110;
    HEAP32[(i18 & 16777215) >> 2] = i109;
    i4 = 2;
    STACKTOP = i2;
    return i4 | 0;
  } else if (i70 == 847) {
    HEAP32[(i11 & 16777215) >> 2] = 28;
    i78 = 1;
    i79 = i180;
    i80 = i228;
    i81 = i229;
    i82 = i230;
    i83 = i231;
    i84 = i64;
  } else if (i70 == 848) {
    i78 = -3;
    i79 = i61;
    i80 = i62;
    i81 = i63;
    i82 = i9;
    i83 = i13;
    i84 = i64;
  } else if (i70 == 863) {
    i4 = -2;
    STACKTOP = i2;
    return i4 | 0;
  } else if (i70 == 865) {
    STACKTOP = i2;
    return i4 | 0;
  }
  HEAP32[(i6 & 16777215) >> 2] = i65;
  HEAP32[(i12 & 16777215) >> 2] = i84;
  HEAP32[(i8 & 16777215) >> 2] = i83;
  HEAP32[(i7 & 16777215) >> 2] = i82;
  HEAP32[(i17 & 16777215) >> 2] = i81;
  HEAP32[(i18 & 16777215) >> 2] = i80;
  do {
    if ((HEAP32[(i42 & 16777215) >> 2] | 0) == 0) {
      i80 = HEAP32[(i12 & 16777215) >> 2] | 0;
      if ((i79 | 0) == (i80 | 0)) {
        i393 = i79;
        break;
      }
      if ((HEAP32[(i11 & 16777215) >> 2] | 0) >>> 0 < 29) {
        i70 = 852;
        break;
      } else {
        i393 = i80;
        break;
      }
    } else {
      i70 = 852;
    }
  } while (0);
  do {
    if (i70 == 852) {
      if ((_updatewindow(i1, i79) | 0) == 0) {
        i393 = HEAP32[(i12 & 16777215) >> 2] | 0;
        break;
      }
      HEAP32[(i11 & 16777215) >> 2] = 30;
      i4 = -4;
      STACKTOP = i2;
      return i4 | 0;
    }
  } while (0);
  i12 = HEAP32[(i7 & 16777215) >> 2] | 0;
  i7 = i79 - i393 | 0;
  i70 = i1 + 8 | 0;
  HEAP32[(i70 & 16777215) >> 2] = i16 - i12 + HEAP32[(i70 & 16777215) >> 2] | 0;
  HEAP32[(i43 & 16777215) >> 2] = HEAP32[(i43 & 16777215) >> 2] + i7 | 0;
  HEAP32[(i44 & 16777215) >> 2] = HEAP32[(i44 & 16777215) >> 2] + i7 | 0;
  i44 = (i79 | 0) == (i393 | 0);
  if (!((HEAP32[(i19 & 16777215) >> 2] | 0) == 0 | i44)) {
    i19 = HEAP32[(i20 & 16777215) >> 2] | 0;
    i393 = HEAP32[(i6 & 16777215) >> 2] + -i7 | 0;
    if ((HEAP32[(i23 & 16777215) >> 2] | 0) == 0) {
      i394 = _adler32(i19, i393, i7);
    } else {
      i394 = _crc32(i19, i393, i7);
    }
    HEAP32[(i20 & 16777215) >> 2] = i394;
    HEAP32[(i28 & 16777215) >> 2] = i394;
  }
  i394 = HEAP32[(i11 & 16777215) >> 2] | 0;
  if ((i394 | 0) == 19) {
    i395 = 256;
  } else {
    i395 = (i394 | 0) == 14 ? 256 : 0;
  }
  HEAP32[(i1 + 44 & 16777215) >> 2] = ((HEAP32[(i31 & 16777215) >> 2] | 0) != 0 ? 64 : 0) + HEAP32[(i18 & 16777215) >> 2] + ((i394 | 0) == 11 ? 128 : 0) + i395 | 0;
  i4 = (i16 | 0) == (i12 | 0) & i44 & (i78 | 0) == 0 ? -5 : i78;
  STACKTOP = i2;
  return i4 | 0;
}
function _fixedtables(i1) {
  i1 = i1 | 0;
  HEAP32[(i1 + 76 & 16777215) >> 2] = 5244532 | 0;
  HEAP32[(i1 + 84 & 16777215) >> 2] = 9;
  HEAP32[(i1 + 80 & 16777215) >> 2] = 5246580 | 0;
  HEAP32[(i1 + 88 & 16777215) >> 2] = 5;
  return;
}
function _init_block(i1) {
  i1 = i1 | 0;
  var i2 = 0, i3 = 0;
  i2 = 0;
  while (1) {
    HEAP16[((i2 << 2) + i1 + 148 & 16777215) >> 1] = 0;
    i3 = i2 + 1 | 0;
    if ((i3 | 0) == 286) {
      break;
    } else {
      i2 = i3;
    }
  }
  HEAP16[(i1 + 2440 & 16777215) >> 1] = 0;
  HEAP16[(i1 + 2444 & 16777215) >> 1] = 0;
  HEAP16[(i1 + 2448 & 16777215) >> 1] = 0;
  HEAP16[(i1 + 2452 & 16777215) >> 1] = 0;
  HEAP16[(i1 + 2456 & 16777215) >> 1] = 0;
  HEAP16[(i1 + 2460 & 16777215) >> 1] = 0;
  HEAP16[(i1 + 2464 & 16777215) >> 1] = 0;
  HEAP16[(i1 + 2468 & 16777215) >> 1] = 0;
  HEAP16[(i1 + 2472 & 16777215) >> 1] = 0;
  HEAP16[(i1 + 2476 & 16777215) >> 1] = 0;
  HEAP16[(i1 + 2480 & 16777215) >> 1] = 0;
  HEAP16[(i1 + 2484 & 16777215) >> 1] = 0;
  HEAP16[(i1 + 2488 & 16777215) >> 1] = 0;
  HEAP16[(i1 + 2492 & 16777215) >> 1] = 0;
  HEAP16[(i1 + 2496 & 16777215) >> 1] = 0;
  HEAP16[(i1 + 2500 & 16777215) >> 1] = 0;
  HEAP16[(i1 + 2504 & 16777215) >> 1] = 0;
  HEAP16[(i1 + 2508 & 16777215) >> 1] = 0;
  HEAP16[(i1 + 2512 & 16777215) >> 1] = 0;
  HEAP16[(i1 + 2516 & 16777215) >> 1] = 0;
  HEAP16[(i1 + 2520 & 16777215) >> 1] = 0;
  HEAP16[(i1 + 2524 & 16777215) >> 1] = 0;
  HEAP16[(i1 + 2528 & 16777215) >> 1] = 0;
  HEAP16[(i1 + 2532 & 16777215) >> 1] = 0;
  HEAP16[(i1 + 2536 & 16777215) >> 1] = 0;
  HEAP16[(i1 + 2540 & 16777215) >> 1] = 0;
  HEAP16[(i1 + 2544 & 16777215) >> 1] = 0;
  HEAP16[(i1 + 2548 & 16777215) >> 1] = 0;
  HEAP16[(i1 + 2552 & 16777215) >> 1] = 0;
  HEAP16[(i1 + 2556 & 16777215) >> 1] = 0;
  HEAP16[(i1 + 2684 & 16777215) >> 1] = 0;
  HEAP16[(i1 + 2688 & 16777215) >> 1] = 0;
  HEAP16[(i1 + 2692 & 16777215) >> 1] = 0;
  HEAP16[(i1 + 2696 & 16777215) >> 1] = 0;
  HEAP16[(i1 + 2700 & 16777215) >> 1] = 0;
  HEAP16[(i1 + 2704 & 16777215) >> 1] = 0;
  HEAP16[(i1 + 2708 & 16777215) >> 1] = 0;
  HEAP16[(i1 + 2712 & 16777215) >> 1] = 0;
  HEAP16[(i1 + 2716 & 16777215) >> 1] = 0;
  HEAP16[(i1 + 2720 & 16777215) >> 1] = 0;
  HEAP16[(i1 + 2724 & 16777215) >> 1] = 0;
  HEAP16[(i1 + 2728 & 16777215) >> 1] = 0;
  HEAP16[(i1 + 2732 & 16777215) >> 1] = 0;
  HEAP16[(i1 + 2736 & 16777215) >> 1] = 0;
  HEAP16[(i1 + 2740 & 16777215) >> 1] = 0;
  HEAP16[(i1 + 2744 & 16777215) >> 1] = 0;
  HEAP16[(i1 + 2748 & 16777215) >> 1] = 0;
  HEAP16[(i1 + 2752 & 16777215) >> 1] = 0;
  HEAP16[(i1 + 2756 & 16777215) >> 1] = 0;
  HEAP16[(i1 + 1172 & 16777215) >> 1] = 1;
  HEAP32[(i1 + 5804 & 16777215) >> 2] = 0;
  HEAP32[(i1 + 5800 & 16777215) >> 2] = 0;
  HEAP32[(i1 + 5808 & 16777215) >> 2] = 0;
  HEAP32[(i1 + 5792 & 16777215) >> 2] = 0;
  return;
}
function _bi_flush(i1) {
  i1 = i1 | 0;
  var i2 = 0, i3 = 0, i4 = 0, i5 = 0, i6 = 0, i7 = 0, i8 = 0;
  i2 = i1 + 5820 | 0;
  i3 = HEAP32[(i2 & 16777215) >> 2] | 0;
  if ((i3 | 0) == 16) {
    i4 = i1 + 5816 | 0;
    i5 = HEAP16[(i4 & 16777215) >> 1] & 255;
    i6 = i1 + 20 | 0;
    i7 = HEAP32[(i6 & 16777215) >> 2] | 0;
    HEAP32[(i6 & 16777215) >> 2] = i7 + 1 | 0;
    i8 = i1 + 8 | 0;
    HEAP8[HEAP32[(i8 & 16777215) >> 2] + i7 & 16777215] = i5;
    i5 = HEAPU16[(i4 & 16777215) >> 1] >>> 8 & 255;
    i7 = HEAP32[(i6 & 16777215) >> 2] | 0;
    HEAP32[(i6 & 16777215) >> 2] = i7 + 1 | 0;
    HEAP8[HEAP32[(i8 & 16777215) >> 2] + i7 & 16777215] = i5;
    HEAP16[(i4 & 16777215) >> 1] = 0;
    HEAP32[(i2 & 16777215) >> 2] = 0;
    return;
  }
  if ((i3 | 0) <= 7) {
    return;
  }
  i3 = i1 + 5816 | 0;
  i4 = HEAP16[(i3 & 16777215) >> 1] & 255;
  i5 = i1 + 20 | 0;
  i7 = HEAP32[(i5 & 16777215) >> 2] | 0;
  HEAP32[(i5 & 16777215) >> 2] = i7 + 1 | 0;
  HEAP8[HEAP32[(i1 + 8 & 16777215) >> 2] + i7 & 16777215] = i4;
  HEAP16[(i3 & 16777215) >> 1] = HEAPU16[(i3 & 16777215) >> 1] >>> 8;
  HEAP32[(i2 & 16777215) >> 2] = HEAP32[(i2 & 16777215) >> 2] - 8 | 0;
  return;
}
function _updatewindow(i1, i2) {
  i1 = i1 | 0;
  i2 = i2 | 0;
  var i3 = 0, i4 = 0, i5 = 0, i6 = 0, i7 = 0, i8 = 0, i9 = 0, i10 = 0, i11 = 0;
  i3 = HEAP32[(i1 + 28 & 16777215) >> 2] | 0;
  i4 = i3 + 52 | 0;
  i5 = i4;
  i6 = HEAP32[(i5 & 16777215) >> 2] | 0;
  do {
    if ((i6 | 0) == 0) {
      i7 = FUNCTION_TABLE_iiii[HEAP32[(i1 + 32 & 16777215) >> 2] & 15](HEAP32[(i1 + 40 & 16777215) >> 2] | 0, 1 << HEAP32[(i3 + 36 & 16777215) >> 2], 1);
      HEAP32[(i4 & 16777215) >> 2] = i7;
      if ((i7 | 0) == 0) {
        i8 = 1;
      } else {
        i9 = i7;
        break;
      }
      return i8 | 0;
    } else {
      i9 = i6;
    }
  } while (0);
  i6 = i3 + 40 | 0;
  i4 = HEAP32[(i6 & 16777215) >> 2] | 0;
  if ((i4 | 0) == 0) {
    i7 = 1 << HEAP32[(i3 + 36 & 16777215) >> 2];
    HEAP32[(i6 & 16777215) >> 2] = i7;
    HEAP32[(i3 + 48 & 16777215) >> 2] = 0;
    HEAP32[(i3 + 44 & 16777215) >> 2] = 0;
    i10 = i7;
  } else {
    i10 = i4;
  }
  i4 = i2 - HEAP32[(i1 + 16 & 16777215) >> 2] | 0;
  if (i4 >>> 0 >= i10 >>> 0) {
    _memcpy(i9 | 0, HEAP32[(i1 + 12 & 16777215) >> 2] + -i10 | 0, i10 | 0, 1 | 0);
    HEAP32[(i3 + 48 & 16777215) >> 2] = 0;
    HEAP32[(i3 + 44 & 16777215) >> 2] = HEAP32[(i6 & 16777215) >> 2] | 0;
    i8 = 0;
    return i8 | 0;
  }
  i2 = i3 + 48 | 0;
  i7 = HEAP32[(i2 & 16777215) >> 2] | 0;
  i11 = i10 - i7 | 0;
  i10 = i11 >>> 0 > i4 >>> 0 ? i4 : i11;
  i11 = i1 + 12 | 0;
  _memcpy(i9 + i7 | 0, HEAP32[(i11 & 16777215) >> 2] + -i4 | 0, i10 | 0, 1 | 0);
  i7 = i4 - i10 | 0;
  if ((i4 | 0) != (i10 | 0)) {
    _memcpy(HEAP32[(i5 & 16777215) >> 2] | 0, HEAP32[(i11 & 16777215) >> 2] + -i7 | 0, i7 | 0, 1 | 0);
    HEAP32[(i2 & 16777215) >> 2] = i7;
    HEAP32[(i3 + 44 & 16777215) >> 2] = HEAP32[(i6 & 16777215) >> 2] | 0;
    i8 = 0;
    return i8 | 0;
  }
  i7 = HEAP32[(i2 & 16777215) >> 2] + i4 | 0;
  HEAP32[(i2 & 16777215) >> 2] = i7;
  i11 = HEAP32[(i6 & 16777215) >> 2] | 0;
  if ((i7 | 0) == (i11 | 0)) {
    HEAP32[(i2 & 16777215) >> 2] = 0;
  }
  i2 = i3 + 44 | 0;
  i3 = HEAP32[(i2 & 16777215) >> 2] | 0;
  if (i3 >>> 0 >= i11 >>> 0) {
    i8 = 0;
    return i8 | 0;
  }
  HEAP32[(i2 & 16777215) >> 2] = i3 + i4 | 0;
  i8 = 0;
  return i8 | 0;
}
function _inflateEnd(i1) {
  i1 = i1 | 0;
  var i2 = 0, i3 = 0, i4 = 0, i5 = 0, i6 = 0, i7 = 0, i8 = 0, i9 = 0;
  if ((i1 | 0) == 0) {
    return;
  }
  i2 = i1 + 28 | 0;
  i3 = HEAP32[(i2 & 16777215) >> 2] | 0;
  if ((i3 | 0) == 0) {
    return;
  }
  i4 = i1 + 36 | 0;
  i5 = HEAP32[(i4 & 16777215) >> 2] | 0;
  if ((i5 | 0) == 0) {
    return;
  }
  i6 = HEAP32[(i3 + 52 & 16777215) >> 2] | 0;
  i7 = i1 + 40 | 0;
  if ((i6 | 0) == 0) {
    i8 = i5;
    i9 = i3;
  } else {
    FUNCTION_TABLE_vii[i5 & 15](HEAP32[(i7 & 16777215) >> 2] | 0, i6);
    i8 = HEAP32[(i4 & 16777215) >> 2] | 0;
    i9 = HEAP32[(i2 & 16777215) >> 2] | 0;
  }
  FUNCTION_TABLE_vii[i8 & 15](HEAP32[(i7 & 16777215) >> 2] | 0, i9);
  HEAP32[(i2 & 16777215) >> 2] = 0;
  return;
}
function _inflate_table(i1, i2, i3, i4, i5, i6) {
  i1 = i1 | 0;
  i2 = i2 | 0;
  i3 = i3 | 0;
  i4 = i4 | 0;
  i5 = i5 | 0;
  i6 = i6 | 0;
  var i7 = 0, i8 = 0, i9 = 0, i10 = 0, i11 = 0, i12 = 0, i13 = 0, i14 = 0, i15 = 0, i16 = 0, i17 = 0, i18 = 0, i19 = 0, i20 = 0, i21 = 0, i22 = 0, i23 = 0, i24 = 0, i25 = 0, i26 = 0, i27 = 0, i28 = 0, i29 = 0, i30 = 0, i31 = 0, i32 = 0, i33 = 0, i34 = 0, i35 = 0, i36 = 0, i37 = 0, i38 = 0, i39 = 0, i40 = 0, i41 = 0, i42 = 0, i43 = 0, i44 = 0, i45 = 0;
  i7 = STACKTOP;
  STACKTOP = STACKTOP + 32 | 0;
  i8 = i7 | 0;
  i9 = STACKTOP;
  STACKTOP = STACKTOP + 32 | 0;
  _memset(i8 | 0, 0 | 0, 32 | 0, 2 | 0);
  i10 = (i3 | 0) == 0;
  L1225 : do {
    if (!i10) {
      i11 = 0;
      while (1) {
        i12 = (HEAPU16[((i11 << 1) + i2 & 16777215) >> 1] << 1) + i8 | 0;
        HEAP16[(i12 & 16777215) >> 1] = HEAP16[(i12 & 16777215) >> 1] + 1 & 65535;
        i12 = i11 + 1 | 0;
        if ((i12 | 0) == (i3 | 0)) {
          break L1225;
        } else {
          i11 = i12;
        }
      }
    }
  } while (0);
  i11 = HEAP32[(i5 & 16777215) >> 2] | 0;
  i12 = 15;
  while (1) {
    if ((i12 | 0) == 0) {
      i13 = 921;
      break;
    }
    if (HEAP16[((i12 << 1) + i8 & 16777215) >> 1] << 16 >> 16 == 0) {
      i12 = i12 - 1 | 0;
    } else {
      break;
    }
  }
  if (i13 == 921) {
    i14 = HEAP32[(i4 & 16777215) >> 2] | 0;
    HEAP32[(i4 & 16777215) >> 2] = i14 + 4 | 0;
    HEAP8[i14 & 16777215] = 64;
    HEAP8[i14 + 1 & 16777215] = 1;
    HEAP16[(i14 + 2 & 16777215) >> 1] = 0;
    i14 = HEAP32[(i4 & 16777215) >> 2] | 0;
    HEAP32[(i4 & 16777215) >> 2] = i14 + 4 | 0;
    HEAP8[i14 & 16777215] = 64;
    HEAP8[i14 + 1 & 16777215] = 1;
    HEAP16[(i14 + 2 & 16777215) >> 1] = 0;
    HEAP32[(i5 & 16777215) >> 2] = 1;
    i15 = 0;
    STACKTOP = i7;
    return i15 | 0;
  }
  i14 = i11 >>> 0 > i12 >>> 0 ? i12 : i11;
  i11 = 1;
  while (1) {
    if (i11 >>> 0 >= i12 >>> 0) {
      break;
    }
    if (HEAP16[((i11 << 1) + i8 & 16777215) >> 1] << 16 >> 16 == 0) {
      i11 = i11 + 1 | 0;
    } else {
      break;
    }
  }
  i16 = i14 >>> 0 < i11 >>> 0 ? i11 : i14;
  i14 = 1;
  i17 = 1;
  while (1) {
    if (i17 >>> 0 >= 16) {
      break;
    }
    i18 = (i14 << 1) - HEAPU16[((i17 << 1) + i8 & 16777215) >> 1] | 0;
    if ((i18 | 0) < 0) {
      i15 = -1;
      i13 = 963;
      break;
    } else {
      i14 = i18;
      i17 = i17 + 1 | 0;
    }
  }
  if (i13 == 963) {
    STACKTOP = i7;
    return i15 | 0;
  }
  do {
    if ((i14 | 0) > 0) {
      if ((i1 | 0) != 0 & (i12 | 0) == 1) {
        break;
      } else {
        i15 = -1;
      }
      STACKTOP = i7;
      return i15 | 0;
    }
  } while (0);
  HEAP16[(i9 + 2 & 16777215) >> 1] = 0;
  i14 = HEAP16[(i8 + 2 & 16777215) >> 1] | 0;
  HEAP16[(i9 + 4 & 16777215) >> 1] = i14;
  i17 = HEAP16[(i8 + 4 & 16777215) >> 1] + i14 & 65535;
  HEAP16[(i9 + 6 & 16777215) >> 1] = i17;
  i14 = HEAP16[(i8 + 6 & 16777215) >> 1] + i17 & 65535;
  HEAP16[(i9 + 8 & 16777215) >> 1] = i14;
  i17 = HEAP16[(i8 + 8 & 16777215) >> 1] + i14 & 65535;
  HEAP16[(i9 + 10 & 16777215) >> 1] = i17;
  i14 = HEAP16[(i8 + 10 & 16777215) >> 1] + i17 & 65535;
  HEAP16[(i9 + 12 & 16777215) >> 1] = i14;
  i17 = HEAP16[(i8 + 12 & 16777215) >> 1] + i14 & 65535;
  HEAP16[(i9 + 14 & 16777215) >> 1] = i17;
  i14 = HEAP16[(i8 + 14 & 16777215) >> 1] + i17 & 65535;
  HEAP16[(i9 + 16 & 16777215) >> 1] = i14;
  i17 = HEAP16[(i8 + 16 & 16777215) >> 1] + i14 & 65535;
  HEAP16[(i9 + 18 & 16777215) >> 1] = i17;
  i14 = HEAP16[(i8 + 18 & 16777215) >> 1] + i17 & 65535;
  HEAP16[(i9 + 20 & 16777215) >> 1] = i14;
  i17 = HEAP16[(i8 + 20 & 16777215) >> 1] + i14 & 65535;
  HEAP16[(i9 + 22 & 16777215) >> 1] = i17;
  i14 = HEAP16[(i8 + 22 & 16777215) >> 1] + i17 & 65535;
  HEAP16[(i9 + 24 & 16777215) >> 1] = i14;
  i17 = HEAP16[(i8 + 24 & 16777215) >> 1] + i14 & 65535;
  HEAP16[(i9 + 26 & 16777215) >> 1] = i17;
  i14 = HEAP16[(i8 + 26 & 16777215) >> 1] + i17 & 65535;
  HEAP16[(i9 + 28 & 16777215) >> 1] = i14;
  HEAP16[(i9 + 30 & 16777215) >> 1] = HEAP16[(i8 + 28 & 16777215) >> 1] + i14 & 65535;
  L1250 : do {
    if (!i10) {
      i14 = 0;
      while (1) {
        i17 = HEAP16[((i14 << 1) + i2 & 16777215) >> 1] | 0;
        if (i17 << 16 >> 16 != 0) {
          i18 = ((i17 & 65535) << 1) + i9 | 0;
          i17 = HEAP16[(i18 & 16777215) >> 1] | 0;
          HEAP16[(i18 & 16777215) >> 1] = i17 + 1 & 65535;
          HEAP16[(((i17 & 65535) << 1) + i6 & 16777215) >> 1] = i14 & 65535;
        }
        i17 = i14 + 1 | 0;
        if ((i17 | 0) == (i3 | 0)) {
          break L1250;
        } else {
          i14 = i17;
        }
      }
    }
  } while (0);
  do {
    if ((i1 | 0) == 1) {
      i3 = 1 << i16;
      if (i3 >>> 0 > 851) {
        i15 = 1;
      } else {
        i19 = 1;
        i20 = i3;
        i21 = 256;
        i22 = 4300211018 | 0;
        i23 = 4300211082 | 0;
        i24 = 0;
        break;
      }
      STACKTOP = i7;
      return i15 | 0;
    } else if ((i1 | 0) == 0) {
      i19 = 0;
      i20 = 1 << i16;
      i21 = 19;
      i22 = i6;
      i23 = i6;
      i24 = 0;
    } else {
      i3 = 1 << i16;
      i9 = (i1 | 0) == 2;
      if (i9 & i3 >>> 0 > 591) {
        i15 = 1;
      } else {
        i19 = 0;
        i20 = i3;
        i21 = -1;
        i22 = 5244364 | 0;
        i23 = 5244428 | 0;
        i24 = i9;
        break;
      }
      STACKTOP = i7;
      return i15 | 0;
    }
  } while (0);
  i1 = i20 - 1 | 0;
  i9 = i16 & 255;
  i3 = HEAP32[(i4 & 16777215) >> 2] | 0;
  i10 = -1;
  i14 = 0;
  i17 = i20;
  i20 = 0;
  i18 = i16;
  i25 = 0;
  i26 = i11;
  L1264 : while (1) {
    i11 = 1 << i18;
    i27 = i14;
    i28 = i25;
    i29 = i26;
    while (1) {
      i30 = i29 - i20 | 0;
      i31 = i30 & 255;
      i32 = HEAP16[((i28 << 1) + i6 & 16777215) >> 1] | 0;
      i33 = i32 & 65535;
      do {
        if ((i33 | 0) < (i21 | 0)) {
          i34 = 0;
          i35 = i32;
        } else {
          if ((i33 | 0) <= (i21 | 0)) {
            i34 = 96;
            i35 = 0;
            break;
          }
          i34 = HEAP16[((i33 << 1) + i22 & 16777215) >> 1] & 255;
          i35 = HEAP16[((i33 << 1) + i23 & 16777215) >> 1] | 0;
        }
      } while (0);
      i33 = 1 << i30;
      i32 = i27 >>> (i20 >>> 0);
      i36 = i11;
      while (1) {
        i37 = i36 - i33 | 0;
        i38 = i37 + i32 | 0;
        HEAP8[(i38 << 2) + i3 & 16777215] = i34;
        HEAP8[(i38 << 2) + i3 + 1 & 16777215] = i31;
        HEAP16[((i38 << 2) + i3 + 2 & 16777215) >> 1] = i35;
        if ((i36 | 0) == (i33 | 0)) {
          break;
        } else {
          i36 = i37;
        }
      }
      i36 = 1 << i29 - 1;
      while (1) {
        if ((i36 & i27 | 0) == 0) {
          break;
        } else {
          i36 = i36 >>> 1;
        }
      }
      if ((i36 | 0) == 0) {
        i39 = 0;
      } else {
        i39 = (i36 - 1 & i27) + i36 | 0;
      }
      i40 = i28 + 1 | 0;
      i33 = (i29 << 1) + i8 | 0;
      i32 = HEAP16[(i33 & 16777215) >> 1] - 1 & 65535;
      HEAP16[(i33 & 16777215) >> 1] = i32;
      if (i32 << 16 >> 16 == 0) {
        if ((i29 | 0) == (i12 | 0)) {
          break L1264;
        }
        i41 = HEAPU16[((HEAPU16[((i40 << 1) + i6 & 16777215) >> 1] << 1) + i2 & 16777215) >> 1];
      } else {
        i41 = i29;
      }
      if (i41 >>> 0 <= i16 >>> 0) {
        i27 = i39;
        i28 = i40;
        i29 = i41;
        continue;
      }
      i42 = i39 & i1;
      if ((i42 | 0) == (i10 | 0)) {
        i27 = i39;
        i28 = i40;
        i29 = i41;
      } else {
        break;
      }
    }
    i29 = (i20 | 0) == 0 ? i16 : i20;
    i28 = (i11 << 2) + i3 | 0;
    i27 = i41 - i29 | 0;
    i32 = i41 >>> 0 < i12 >>> 0;
    L1287 : do {
      if (i32) {
        i33 = i27;
        i30 = 1 << i27;
        i37 = i41;
        while (1) {
          i38 = i30 - HEAPU16[((i37 << 1) + i8 & 16777215) >> 1] | 0;
          if ((i38 | 0) < 1) {
            i43 = i33;
            break L1287;
          }
          i44 = i33 + 1 | 0;
          i45 = i44 + i29 | 0;
          if (i45 >>> 0 < i12 >>> 0) {
            i33 = i44;
            i30 = i38 << 1;
            i37 = i45;
          } else {
            i43 = i44;
            break L1287;
          }
        }
      } else {
        i43 = i27;
      }
    } while (0);
    i27 = (1 << i43) + i17 | 0;
    if (i19 & i27 >>> 0 > 851 | i24 & i27 >>> 0 > 591) {
      i15 = 1;
      i13 = 969;
      break;
    }
    HEAP8[(i42 << 2) + HEAP32[(i4 & 16777215) >> 2] & 16777215] = i43 & 255;
    HEAP8[(i42 << 2) + HEAP32[(i4 & 16777215) >> 2] + 1 & 16777215] = i9;
    i32 = HEAP32[(i4 & 16777215) >> 2] | 0;
    HEAP16[((i42 << 2) + i32 + 2 & 16777215) >> 1] = (i28 - i32 | 0) >>> 2 & 65535;
    i3 = i28;
    i10 = i42;
    i14 = i39;
    i17 = i27;
    i20 = i29;
    i18 = i43;
    i25 = i40;
    i26 = i41;
  }
  if (i13 == 969) {
    STACKTOP = i7;
    return i15 | 0;
  }
  if ((i39 | 0) != 0) {
    HEAP8[(i39 << 2) + i3 & 16777215] = 64;
    HEAP8[(i39 << 2) + i3 + 1 & 16777215] = i31;
    HEAP16[((i39 << 2) + i3 + 2 & 16777215) >> 1] = 0;
  }
  HEAP32[(i4 & 16777215) >> 2] = (i17 << 2) + HEAP32[(i4 & 16777215) >> 2] | 0;
  HEAP32[(i5 & 16777215) >> 2] = i16;
  i15 = 0;
  STACKTOP = i7;
  return i15 | 0;
}
function __tr_init(i1) {
  i1 = i1 | 0;
  HEAP32[(i1 + 2840 & 16777215) >> 2] = i1 + 148 | 0;
  HEAP32[(i1 + 2848 & 16777215) >> 2] = 5244032;
  HEAP32[(i1 + 2852 & 16777215) >> 2] = i1 + 2440 | 0;
  HEAP32[(i1 + 2860 & 16777215) >> 2] = 5244172;
  HEAP32[(i1 + 2864 & 16777215) >> 2] = i1 + 2684 | 0;
  HEAP32[(i1 + 2872 & 16777215) >> 2] = 5244192;
  HEAP16[(i1 + 5816 & 16777215) >> 1] = 0;
  HEAP32[(i1 + 5820 & 16777215) >> 2] = 0;
  _init_block(i1);
  return;
}
function __tr_stored_block(i1, i2, i3, i4) {
  i1 = i1 | 0;
  i2 = i2 | 0;
  i3 = i3 | 0;
  i4 = i4 | 0;
  var i5 = 0, i6 = 0, i7 = 0, i8 = 0, i9 = 0, i10 = 0, i11 = 0;
  i5 = i1 + 5820 | 0;
  i6 = HEAP32[(i5 & 16777215) >> 2] | 0;
  i7 = i4 & 65535;
  i4 = i1 + 5816 | 0;
  i8 = HEAPU16[(i4 & 16777215) >> 1] | i7 << i6;
  HEAP16[(i4 & 16777215) >> 1] = i8 & 65535;
  if ((i6 | 0) > 13) {
    i9 = i1 + 20 | 0;
    i10 = HEAP32[(i9 & 16777215) >> 2] | 0;
    HEAP32[(i9 & 16777215) >> 2] = i10 + 1 | 0;
    i11 = i1 + 8 | 0;
    HEAP8[HEAP32[(i11 & 16777215) >> 2] + i10 & 16777215] = i8 & 255;
    i8 = HEAPU16[(i4 & 16777215) >> 1] >>> 8 & 255;
    i10 = HEAP32[(i9 & 16777215) >> 2] | 0;
    HEAP32[(i9 & 16777215) >> 2] = i10 + 1 | 0;
    HEAP8[HEAP32[(i11 & 16777215) >> 2] + i10 & 16777215] = i8;
    i8 = HEAP32[(i5 & 16777215) >> 2] | 0;
    HEAP16[(i4 & 16777215) >> 1] = i7 >>> ((16 - i8 | 0) >>> 0) & 65535;
    i7 = i8 - 13 | 0;
    HEAP32[(i5 & 16777215) >> 2] = i7;
    _copy_block(i1, i2, i3);
    return;
  } else {
    i7 = i6 + 3 | 0;
    HEAP32[(i5 & 16777215) >> 2] = i7;
    _copy_block(i1, i2, i3);
    return;
  }
}
function _copy_block(i1, i2, i3) {
  i1 = i1 | 0;
  i2 = i2 | 0;
  i3 = i3 | 0;
  var i4 = 0, i5 = 0, i6 = 0, i7 = 0, i8 = 0;
  _bi_windup(i1);
  i4 = i1 + 20 | 0;
  i5 = HEAP32[(i4 & 16777215) >> 2] | 0;
  HEAP32[(i4 & 16777215) >> 2] = i5 + 1 | 0;
  i6 = i1 + 8 | 0;
  HEAP8[HEAP32[(i6 & 16777215) >> 2] + i5 & 16777215] = i3 & 255;
  i5 = HEAP32[(i4 & 16777215) >> 2] | 0;
  HEAP32[(i4 & 16777215) >> 2] = i5 + 1 | 0;
  HEAP8[HEAP32[(i6 & 16777215) >> 2] + i5 & 16777215] = i3 >>> 8 & 255;
  i5 = i3 & 65535 ^ 65535;
  i1 = HEAP32[(i4 & 16777215) >> 2] | 0;
  HEAP32[(i4 & 16777215) >> 2] = i1 + 1 | 0;
  HEAP8[HEAP32[(i6 & 16777215) >> 2] + i1 & 16777215] = i5 & 255;
  i1 = HEAP32[(i4 & 16777215) >> 2] | 0;
  HEAP32[(i4 & 16777215) >> 2] = i1 + 1 | 0;
  HEAP8[HEAP32[(i6 & 16777215) >> 2] + i1 & 16777215] = i5 >>> 8 & 255;
  if ((i3 | 0) == 0) {
    return;
  } else {
    i7 = i3;
    i8 = i2;
  }
  while (1) {
    i2 = i7 - 1 | 0;
    i3 = HEAP8[i8 & 16777215] | 0;
    i5 = HEAP32[(i4 & 16777215) >> 2] | 0;
    HEAP32[(i4 & 16777215) >> 2] = i5 + 1 | 0;
    HEAP8[HEAP32[(i6 & 16777215) >> 2] + i5 & 16777215] = i3;
    if ((i2 | 0) == 0) {
      break;
    } else {
      i7 = i2;
      i8 = i8 + 1 | 0;
    }
  }
  return;
}
function __tr_flush_bits(i1) {
  i1 = i1 | 0;
  _bi_flush(i1);
  return;
}
function _detect_data_type(i1) {
  i1 = i1 | 0;
  var i2 = 0, i3 = 0, i4 = 0, i5 = 0, i6 = 0, i7 = 0;
  i2 = -201342849;
  i3 = 0;
  while (1) {
    if ((i2 & 1 | 0) != 0) {
      if (HEAP16[((i3 << 2) + i1 + 148 & 16777215) >> 1] << 16 >> 16 != 0) {
        i4 = 0;
        i5 = 998;
        break;
      }
    }
    i6 = i3 + 1 | 0;
    if ((i6 | 0) < 32) {
      i2 = i2 >>> 1;
      i3 = i6;
    } else {
      break;
    }
  }
  if (i5 == 998) {
    return i4 | 0;
  }
  if (HEAP16[(i1 + 184 & 16777215) >> 1] << 16 >> 16 != 0) {
    i4 = 1;
    return i4 | 0;
  }
  if (HEAP16[(i1 + 188 & 16777215) >> 1] << 16 >> 16 != 0) {
    i4 = 1;
    return i4 | 0;
  }
  if (HEAP16[(i1 + 200 & 16777215) >> 1] << 16 >> 16 == 0) {
    i7 = 32;
  } else {
    i4 = 1;
    return i4 | 0;
  }
  while (1) {
    if ((i7 | 0) >= 256) {
      i4 = 0;
      i5 = 995;
      break;
    }
    if (HEAP16[((i7 << 2) + i1 + 148 & 16777215) >> 1] << 16 >> 16 == 0) {
      i7 = i7 + 1 | 0;
    } else {
      i4 = 1;
      i5 = 996;
      break;
    }
  }
  if (i5 == 996) {
    return i4 | 0;
  } else if (i5 == 995) {
    return i4 | 0;
  }
}
function _compress_block(i1, i2, i3) {
  i1 = i1 | 0;
  i2 = i2 | 0;
  i3 = i3 | 0;
  var i4 = 0, i5 = 0, i6 = 0, i7 = 0, i8 = 0, i9 = 0, i10 = 0, i11 = 0, i12 = 0, i13 = 0, i14 = 0, i15 = 0, i16 = 0, i17 = 0, i18 = 0, i19 = 0, i20 = 0, i21 = 0, i22 = 0, i23 = 0, i24 = 0, i25 = 0, i26 = 0, i27 = 0, i28 = 0, i29 = 0, i30 = 0, i31 = 0, i32 = 0, i33 = 0, i34 = 0;
  i4 = i1 + 5792 | 0;
  i5 = (HEAP32[(i4 & 16777215) >> 2] | 0) == 0;
  L1339 : do {
    if (i5) {
      i6 = HEAP32[(i1 + 5820 & 16777215) >> 2] | 0;
      i7 = HEAP16[(i1 + 5816 & 16777215) >> 1] | 0;
    } else {
      i8 = i1 + 5796 | 0;
      i9 = i1 + 5784 | 0;
      i10 = i1 + 5820 | 0;
      i11 = i1 + 5816 | 0;
      i12 = i1 + 20 | 0;
      i13 = i1 + 8 | 0;
      i14 = 0;
      while (1) {
        i15 = HEAP16[((i14 << 1) + HEAP32[(i8 & 16777215) >> 2] & 16777215) >> 1] | 0;
        i16 = i15 & 65535;
        i17 = i14 + 1 | 0;
        i18 = HEAPU8[HEAP32[(i9 & 16777215) >> 2] + i14 & 16777215];
        do {
          if (i15 << 16 >> 16 == 0) {
            i19 = HEAPU16[((i18 << 2) + i2 + 2 & 16777215) >> 1];
            i20 = HEAP32[(i10 & 16777215) >> 2] | 0;
            i21 = HEAPU16[((i18 << 2) + i2 & 16777215) >> 1];
            i22 = HEAPU16[(i11 & 16777215) >> 1] | i21 << i20;
            i23 = i22 & 65535;
            HEAP16[(i11 & 16777215) >> 1] = i23;
            if ((i20 | 0) > (16 - i19 | 0)) {
              i24 = HEAP32[(i12 & 16777215) >> 2] | 0;
              HEAP32[(i12 & 16777215) >> 2] = i24 + 1 | 0;
              HEAP8[HEAP32[(i13 & 16777215) >> 2] + i24 & 16777215] = i22 & 255;
              i22 = HEAPU16[(i11 & 16777215) >> 1] >>> 8 & 255;
              i24 = HEAP32[(i12 & 16777215) >> 2] | 0;
              HEAP32[(i12 & 16777215) >> 2] = i24 + 1 | 0;
              HEAP8[HEAP32[(i13 & 16777215) >> 2] + i24 & 16777215] = i22;
              i22 = HEAP32[(i10 & 16777215) >> 2] | 0;
              i24 = i21 >>> ((16 - i22 | 0) >>> 0) & 65535;
              HEAP16[(i11 & 16777215) >> 1] = i24;
              i21 = i19 - 16 + i22 | 0;
              HEAP32[(i10 & 16777215) >> 2] = i21;
              i25 = i21;
              i26 = i24;
              break;
            } else {
              i24 = i20 + i19 | 0;
              HEAP32[(i10 & 16777215) >> 2] = i24;
              i25 = i24;
              i26 = i23;
              break;
            }
          } else {
            i23 = HEAPU8[i18 + 5256408 & 16777215];
            i24 = (i23 | 256) + 1 | 0;
            i19 = HEAPU16[((i24 << 2) + i2 + 2 & 16777215) >> 1];
            i20 = HEAP32[(i10 & 16777215) >> 2] | 0;
            i21 = HEAPU16[((i24 << 2) + i2 & 16777215) >> 1];
            i24 = HEAPU16[(i11 & 16777215) >> 1] | i21 << i20;
            i22 = i24 & 65535;
            HEAP16[(i11 & 16777215) >> 1] = i22;
            if ((i20 | 0) > (16 - i19 | 0)) {
              i27 = HEAP32[(i12 & 16777215) >> 2] | 0;
              HEAP32[(i12 & 16777215) >> 2] = i27 + 1 | 0;
              HEAP8[HEAP32[(i13 & 16777215) >> 2] + i27 & 16777215] = i24 & 255;
              i24 = HEAPU16[(i11 & 16777215) >> 1] >>> 8 & 255;
              i27 = HEAP32[(i12 & 16777215) >> 2] | 0;
              HEAP32[(i12 & 16777215) >> 2] = i27 + 1 | 0;
              HEAP8[HEAP32[(i13 & 16777215) >> 2] + i27 & 16777215] = i24;
              i24 = HEAP32[(i10 & 16777215) >> 2] | 0;
              i27 = i21 >>> ((16 - i24 | 0) >>> 0) & 65535;
              HEAP16[(i11 & 16777215) >> 1] = i27;
              i28 = i19 - 16 + i24 | 0;
              i29 = i27;
            } else {
              i28 = i20 + i19 | 0;
              i29 = i22;
            }
            HEAP32[(i10 & 16777215) >> 2] = i28;
            i22 = HEAP32[((i23 << 2) + 5246708 & 16777215) >> 2] | 0;
            do {
              if ((i23 - 8 | 0) >>> 0 < 20) {
                i19 = i18 - HEAP32[((i23 << 2) + 5255352 & 16777215) >> 2] & 65535;
                i20 = i19 << i28 | i29 & 65535;
                i27 = i20 & 65535;
                HEAP16[(i11 & 16777215) >> 1] = i27;
                if ((i28 | 0) > (16 - i22 | 0)) {
                  i24 = HEAP32[(i12 & 16777215) >> 2] | 0;
                  HEAP32[(i12 & 16777215) >> 2] = i24 + 1 | 0;
                  HEAP8[HEAP32[(i13 & 16777215) >> 2] + i24 & 16777215] = i20 & 255;
                  i20 = HEAPU16[(i11 & 16777215) >> 1] >>> 8 & 255;
                  i24 = HEAP32[(i12 & 16777215) >> 2] | 0;
                  HEAP32[(i12 & 16777215) >> 2] = i24 + 1 | 0;
                  HEAP8[HEAP32[(i13 & 16777215) >> 2] + i24 & 16777215] = i20;
                  i20 = HEAP32[(i10 & 16777215) >> 2] | 0;
                  i24 = i19 >>> ((16 - i20 | 0) >>> 0) & 65535;
                  HEAP16[(i11 & 16777215) >> 1] = i24;
                  i19 = i22 - 16 + i20 | 0;
                  HEAP32[(i10 & 16777215) >> 2] = i19;
                  i30 = i19;
                  i31 = i24;
                  break;
                } else {
                  i24 = i28 + i22 | 0;
                  HEAP32[(i10 & 16777215) >> 2] = i24;
                  i30 = i24;
                  i31 = i27;
                  break;
                }
              } else {
                i30 = i28;
                i31 = i29;
              }
            } while (0);
            i22 = i16 - 1 | 0;
            if (i22 >>> 0 < 256) {
              i32 = i22;
            } else {
              i32 = (i22 >>> 7) + 256 | 0;
            }
            i23 = HEAPU8[i32 + 5257132 & 16777215];
            i27 = HEAPU16[((i23 << 2) + i3 + 2 & 16777215) >> 1];
            i24 = HEAPU16[((i23 << 2) + i3 & 16777215) >> 1];
            i19 = i31 & 65535 | i24 << i30;
            i20 = i19 & 65535;
            HEAP16[(i11 & 16777215) >> 1] = i20;
            if ((i30 | 0) > (16 - i27 | 0)) {
              i21 = HEAP32[(i12 & 16777215) >> 2] | 0;
              HEAP32[(i12 & 16777215) >> 2] = i21 + 1 | 0;
              HEAP8[HEAP32[(i13 & 16777215) >> 2] + i21 & 16777215] = i19 & 255;
              i19 = HEAPU16[(i11 & 16777215) >> 1] >>> 8 & 255;
              i21 = HEAP32[(i12 & 16777215) >> 2] | 0;
              HEAP32[(i12 & 16777215) >> 2] = i21 + 1 | 0;
              HEAP8[HEAP32[(i13 & 16777215) >> 2] + i21 & 16777215] = i19;
              i19 = HEAP32[(i10 & 16777215) >> 2] | 0;
              i21 = i24 >>> ((16 - i19 | 0) >>> 0) & 65535;
              HEAP16[(i11 & 16777215) >> 1] = i21;
              i33 = i27 - 16 + i19 | 0;
              i34 = i21;
            } else {
              i33 = i30 + i27 | 0;
              i34 = i20;
            }
            HEAP32[(i10 & 16777215) >> 2] = i33;
            i20 = HEAP32[((i23 << 2) + 5246824 & 16777215) >> 2] | 0;
            if ((i23 - 4 | 0) >>> 0 >= 26) {
              i25 = i33;
              i26 = i34;
              break;
            }
            i27 = i22 - HEAP32[((i23 << 2) + 5255468 & 16777215) >> 2] & 65535;
            i23 = i27 << i33 | i34 & 65535;
            i22 = i23 & 65535;
            HEAP16[(i11 & 16777215) >> 1] = i22;
            if ((i33 | 0) > (16 - i20 | 0)) {
              i21 = HEAP32[(i12 & 16777215) >> 2] | 0;
              HEAP32[(i12 & 16777215) >> 2] = i21 + 1 | 0;
              HEAP8[HEAP32[(i13 & 16777215) >> 2] + i21 & 16777215] = i23 & 255;
              i23 = HEAPU16[(i11 & 16777215) >> 1] >>> 8 & 255;
              i21 = HEAP32[(i12 & 16777215) >> 2] | 0;
              HEAP32[(i12 & 16777215) >> 2] = i21 + 1 | 0;
              HEAP8[HEAP32[(i13 & 16777215) >> 2] + i21 & 16777215] = i23;
              i23 = HEAP32[(i10 & 16777215) >> 2] | 0;
              i21 = i27 >>> ((16 - i23 | 0) >>> 0) & 65535;
              HEAP16[(i11 & 16777215) >> 1] = i21;
              i27 = i20 - 16 + i23 | 0;
              HEAP32[(i10 & 16777215) >> 2] = i27;
              i25 = i27;
              i26 = i21;
              break;
            } else {
              i21 = i33 + i20 | 0;
              HEAP32[(i10 & 16777215) >> 2] = i21;
              i25 = i21;
              i26 = i22;
              break;
            }
          }
        } while (0);
        if (i17 >>> 0 < (HEAP32[(i4 & 16777215) >> 2] | 0) >>> 0) {
          i14 = i17;
        } else {
          i6 = i25;
          i7 = i26;
          break L1339;
        }
      }
    }
  } while (0);
  i26 = HEAPU16[(i2 + 1026 & 16777215) >> 1];
  i25 = i1 + 5820 | 0;
  i4 = HEAPU16[(i2 + 1024 & 16777215) >> 1];
  i2 = i1 + 5816 | 0;
  i33 = i7 & 65535 | i4 << i6;
  HEAP16[(i2 & 16777215) >> 1] = i33 & 65535;
  if ((i6 | 0) > (16 - i26 | 0)) {
    i7 = i1 + 20 | 0;
    i34 = HEAP32[(i7 & 16777215) >> 2] | 0;
    HEAP32[(i7 & 16777215) >> 2] = i34 + 1 | 0;
    i30 = i1 + 8 | 0;
    HEAP8[HEAP32[(i30 & 16777215) >> 2] + i34 & 16777215] = i33 & 255;
    i33 = HEAPU16[(i2 & 16777215) >> 1] >>> 8 & 255;
    i34 = HEAP32[(i7 & 16777215) >> 2] | 0;
    HEAP32[(i7 & 16777215) >> 2] = i34 + 1 | 0;
    HEAP8[HEAP32[(i30 & 16777215) >> 2] + i34 & 16777215] = i33;
    i33 = HEAP32[(i25 & 16777215) >> 2] | 0;
    HEAP16[(i2 & 16777215) >> 1] = i4 >>> ((16 - i33 | 0) >>> 0) & 65535;
    i4 = i26 - 16 + i33 | 0;
    HEAP32[(i25 & 16777215) >> 2] = i4;
    return;
  } else {
    i4 = i6 + i26 | 0;
    HEAP32[(i25 & 16777215) >> 2] = i4;
    return;
  }
}
function __tr_align(i1) {
  i1 = i1 | 0;
  var i2 = 0, i3 = 0, i4 = 0, i5 = 0, i6 = 0, i7 = 0, i8 = 0, i9 = 0, i10 = 0, i11 = 0;
  i2 = i1 + 5820 | 0;
  i3 = HEAP32[(i2 & 16777215) >> 2] | 0;
  i4 = i1 + 5816 | 0;
  i5 = HEAPU16[(i4 & 16777215) >> 1] | 2 << i3;
  i6 = i5 & 65535;
  HEAP16[(i4 & 16777215) >> 1] = i6;
  if ((i3 | 0) > 13) {
    i7 = i1 + 20 | 0;
    i8 = HEAP32[(i7 & 16777215) >> 2] | 0;
    HEAP32[(i7 & 16777215) >> 2] = i8 + 1 | 0;
    i9 = i1 + 8 | 0;
    HEAP8[HEAP32[(i9 & 16777215) >> 2] + i8 & 16777215] = i5 & 255;
    i5 = HEAPU16[(i4 & 16777215) >> 1] >>> 8 & 255;
    i8 = HEAP32[(i7 & 16777215) >> 2] | 0;
    HEAP32[(i7 & 16777215) >> 2] = i8 + 1 | 0;
    HEAP8[HEAP32[(i9 & 16777215) >> 2] + i8 & 16777215] = i5;
    i5 = HEAP32[(i2 & 16777215) >> 2] | 0;
    i8 = 2 >>> ((16 - i5 | 0) >>> 0) & 65535;
    HEAP16[(i4 & 16777215) >> 1] = i8;
    i10 = i5 - 13 | 0;
    i11 = i8;
  } else {
    i10 = i3 + 3 | 0;
    i11 = i6;
  }
  HEAP32[(i2 & 16777215) >> 2] = i10;
  if ((i10 | 0) > 9) {
    i6 = i1 + 20 | 0;
    i3 = HEAP32[(i6 & 16777215) >> 2] | 0;
    HEAP32[(i6 & 16777215) >> 2] = i3 + 1 | 0;
    i8 = i1 + 8 | 0;
    HEAP8[HEAP32[(i8 & 16777215) >> 2] + i3 & 16777215] = i11 & 255;
    i11 = HEAPU16[(i4 & 16777215) >> 1] >>> 8 & 255;
    i3 = HEAP32[(i6 & 16777215) >> 2] | 0;
    HEAP32[(i6 & 16777215) >> 2] = i3 + 1 | 0;
    HEAP8[HEAP32[(i8 & 16777215) >> 2] + i3 & 16777215] = i11;
    HEAP16[(i4 & 16777215) >> 1] = 0;
    i4 = HEAP32[(i2 & 16777215) >> 2] - 9 | 0;
    HEAP32[(i2 & 16777215) >> 2] = i4;
    _bi_flush(i1);
    return;
  } else {
    i4 = i10 + 7 | 0;
    HEAP32[(i2 & 16777215) >> 2] = i4;
    _bi_flush(i1);
    return;
  }
}
function __tr_flush_block(i1, i2, i3, i4) {
  i1 = i1 | 0;
  i2 = i2 | 0;
  i3 = i3 | 0;
  i4 = i4 | 0;
  var i5 = 0, i6 = 0, i7 = 0, i8 = 0, i9 = 0, i10 = 0, i11 = 0, i12 = 0, i13 = 0, i14 = 0, i15 = 0, i16 = 0, i17 = 0, i18 = 0;
  if ((HEAP32[(i1 + 132 & 16777215) >> 2] | 0) > 0) {
    i5 = HEAP32[(i1 & 16777215) >> 2] + 44 | 0;
    if ((HEAP32[(i5 & 16777215) >> 2] | 0) == 2) {
      HEAP32[(i5 & 16777215) >> 2] = _detect_data_type(i1);
    }
    _build_tree(i1, i1 + 2840 | 0);
    _build_tree(i1, i1 + 2852 | 0);
    i5 = _build_bl_tree(i1);
    i6 = (HEAP32[(i1 + 5800 & 16777215) >> 2] + 10 | 0) >>> 3;
    i7 = (HEAP32[(i1 + 5804 & 16777215) >> 2] + 10 | 0) >>> 3;
    i8 = i7 >>> 0 > i6 >>> 0 ? i6 : i7;
    i9 = i7;
    i10 = i5 + 1 | 0;
  } else {
    i5 = i3 + 5 | 0;
    i8 = i5;
    i9 = i5;
    i10 = 1;
  }
  do {
    if ((i3 + 4 | 0) >>> 0 > i8 >>> 0 | (i2 | 0) == 0) {
      i5 = i1 + 5820 | 0;
      i7 = HEAP32[(i5 & 16777215) >> 2] | 0;
      i6 = (i7 | 0) > 13;
      if ((HEAP32[(i1 + 136 & 16777215) >> 2] | 0) == 4 | (i9 | 0) == (i8 | 0)) {
        i11 = i4 + 2 & 65535;
        i12 = i1 + 5816 | 0;
        i13 = HEAPU16[(i12 & 16777215) >> 1] | i11 << i7;
        HEAP16[(i12 & 16777215) >> 1] = i13 & 65535;
        if (i6) {
          i14 = i1 + 20 | 0;
          i15 = HEAP32[(i14 & 16777215) >> 2] | 0;
          HEAP32[(i14 & 16777215) >> 2] = i15 + 1 | 0;
          i16 = i1 + 8 | 0;
          HEAP8[HEAP32[(i16 & 16777215) >> 2] + i15 & 16777215] = i13 & 255;
          i13 = HEAPU16[(i12 & 16777215) >> 1] >>> 8 & 255;
          i15 = HEAP32[(i14 & 16777215) >> 2] | 0;
          HEAP32[(i14 & 16777215) >> 2] = i15 + 1 | 0;
          HEAP8[HEAP32[(i16 & 16777215) >> 2] + i15 & 16777215] = i13;
          i13 = HEAP32[(i5 & 16777215) >> 2] | 0;
          HEAP16[(i12 & 16777215) >> 1] = i11 >>> ((16 - i13 | 0) >>> 0) & 65535;
          i17 = i13 - 13 | 0;
        } else {
          i17 = i7 + 3 | 0;
        }
        HEAP32[(i5 & 16777215) >> 2] = i17;
        _compress_block(i1, 5242880 | 0, 5244052 | 0);
        break;
      } else {
        i13 = i4 + 4 & 65535;
        i11 = i1 + 5816 | 0;
        i12 = HEAPU16[(i11 & 16777215) >> 1] | i13 << i7;
        HEAP16[(i11 & 16777215) >> 1] = i12 & 65535;
        if (i6) {
          i6 = i1 + 20 | 0;
          i15 = HEAP32[(i6 & 16777215) >> 2] | 0;
          HEAP32[(i6 & 16777215) >> 2] = i15 + 1 | 0;
          i16 = i1 + 8 | 0;
          HEAP8[HEAP32[(i16 & 16777215) >> 2] + i15 & 16777215] = i12 & 255;
          i12 = HEAPU16[(i11 & 16777215) >> 1] >>> 8 & 255;
          i15 = HEAP32[(i6 & 16777215) >> 2] | 0;
          HEAP32[(i6 & 16777215) >> 2] = i15 + 1 | 0;
          HEAP8[HEAP32[(i16 & 16777215) >> 2] + i15 & 16777215] = i12;
          i12 = HEAP32[(i5 & 16777215) >> 2] | 0;
          HEAP16[(i11 & 16777215) >> 1] = i13 >>> ((16 - i12 | 0) >>> 0) & 65535;
          i18 = i12 - 13 | 0;
        } else {
          i18 = i7 + 3 | 0;
        }
        HEAP32[(i5 & 16777215) >> 2] = i18;
        _send_all_trees(i1, HEAP32[(i1 + 2844 & 16777215) >> 2] + 1 | 0, HEAP32[(i1 + 2856 & 16777215) >> 2] + 1 | 0, i10);
        _compress_block(i1, i1 + 148 | 0, i1 + 2440 | 0);
        break;
      }
    } else {
      __tr_stored_block(i1, i2, i3, i4);
    }
  } while (0);
  _init_block(i1);
  if ((i4 | 0) == 0) {
    return;
  }
  _bi_windup(i1);
  return;
}
function _build_tree(i1, i2) {
  i1 = i1 | 0;
  i2 = i2 | 0;
  var i3 = 0, i4 = 0, i5 = 0, i6 = 0, i7 = 0, i8 = 0, i9 = 0, i10 = 0, i11 = 0, i12 = 0, i13 = 0, i14 = 0, i15 = 0, i16 = 0, i17 = 0, i18 = 0, i19 = 0, i20 = 0, i21 = 0, i22 = 0;
  i3 = i2 | 0;
  i4 = HEAP32[(i3 & 16777215) >> 2] | 0;
  i5 = i2 + 8 | 0;
  i6 = HEAP32[(i5 & 16777215) >> 2] | 0;
  i7 = HEAP32[(i6 & 16777215) >> 2] | 0;
  i8 = HEAP32[(i6 + 12 & 16777215) >> 2] | 0;
  i6 = i1 + 5200 | 0;
  HEAP32[(i6 & 16777215) >> 2] = 0;
  i9 = i1 + 5204 | 0;
  HEAP32[(i9 & 16777215) >> 2] = 573;
  do {
    if ((i8 | 0) > 0) {
      i10 = 0;
      i11 = -1;
      while (1) {
        if (HEAP16[((i10 << 2) + i4 & 16777215) >> 1] << 16 >> 16 == 0) {
          HEAP16[((i10 << 2) + i4 + 2 & 16777215) >> 1] = 0;
          i12 = i11;
        } else {
          i13 = HEAP32[(i6 & 16777215) >> 2] + 1 | 0;
          HEAP32[(i6 & 16777215) >> 2] = i13;
          HEAP32[((i13 << 2) + i1 + 2908 & 16777215) >> 2] = i10;
          HEAP8[i1 + (i10 + 5208) & 16777215] = 0;
          i12 = i10;
        }
        i13 = i10 + 1 | 0;
        if ((i13 | 0) == (i8 | 0)) {
          break;
        } else {
          i10 = i13;
          i11 = i12;
        }
      }
      i11 = HEAP32[(i6 & 16777215) >> 2] | 0;
      if ((i11 | 0) < 2) {
        i14 = i11;
        i15 = i12;
        i16 = 1061;
        break;
      } else {
        i17 = i12;
        break;
      }
    } else {
      i14 = 0;
      i15 = -1;
      i16 = 1061;
    }
  } while (0);
  L1424 : do {
    if (i16 == 1061) {
      i12 = i1 + 5800 | 0;
      i11 = i1 + 5804 | 0;
      if ((i7 | 0) == 0) {
        i10 = i15;
        i13 = i14;
        while (1) {
          i18 = (i10 | 0) < 2;
          i19 = i10 + 1 | 0;
          i20 = i18 ? i19 : i10;
          i21 = i18 ? i19 : 0;
          i19 = i13 + 1 | 0;
          HEAP32[(i6 & 16777215) >> 2] = i19;
          HEAP32[((i19 << 2) + i1 + 2908 & 16777215) >> 2] = i21;
          HEAP16[((i21 << 2) + i4 & 16777215) >> 1] = 1;
          HEAP8[i1 + (i21 + 5208) & 16777215] = 0;
          HEAP32[(i12 & 16777215) >> 2] = HEAP32[(i12 & 16777215) >> 2] - 1 | 0;
          i21 = HEAP32[(i6 & 16777215) >> 2] | 0;
          if ((i21 | 0) < 2) {
            i10 = i20;
            i13 = i21;
          } else {
            i17 = i20;
            break L1424;
          }
        }
      } else {
        i13 = i15;
        i10 = i14;
        while (1) {
          i20 = (i13 | 0) < 2;
          i21 = i13 + 1 | 0;
          i19 = i20 ? i21 : i13;
          i18 = i20 ? i21 : 0;
          i21 = i10 + 1 | 0;
          HEAP32[(i6 & 16777215) >> 2] = i21;
          HEAP32[((i21 << 2) + i1 + 2908 & 16777215) >> 2] = i18;
          HEAP16[((i18 << 2) + i4 & 16777215) >> 1] = 1;
          HEAP8[i1 + (i18 + 5208) & 16777215] = 0;
          HEAP32[(i12 & 16777215) >> 2] = HEAP32[(i12 & 16777215) >> 2] - 1 | 0;
          HEAP32[(i11 & 16777215) >> 2] = HEAP32[(i11 & 16777215) >> 2] - HEAPU16[((i18 << 2) + i7 + 2 & 16777215) >> 1] | 0;
          i18 = HEAP32[(i6 & 16777215) >> 2] | 0;
          if ((i18 | 0) < 2) {
            i13 = i19;
            i10 = i18;
          } else {
            i17 = i19;
            break L1424;
          }
        }
      }
    }
  } while (0);
  i7 = i2 + 4 | 0;
  HEAP32[(i7 & 16777215) >> 2] = i17;
  i2 = HEAP32[(i6 & 16777215) >> 2] | 0;
  if ((i2 | 0) > 1) {
    i14 = (i2 | 0) / 2 & -1;
    while (1) {
      _pqdownheap(i1, i4, i14);
      i15 = i14 - 1 | 0;
      if ((i15 | 0) > 0) {
        i14 = i15;
      } else {
        break;
      }
    }
    i22 = HEAP32[(i6 & 16777215) >> 2] | 0;
  } else {
    i22 = i2;
  }
  i2 = i1 + 2912 | 0;
  i14 = i8;
  i8 = i22;
  while (1) {
    i22 = HEAP32[(i2 & 16777215) >> 2] | 0;
    HEAP32[(i6 & 16777215) >> 2] = i8 - 1 | 0;
    HEAP32[(i2 & 16777215) >> 2] = HEAP32[((i8 << 2) + i1 + 2908 & 16777215) >> 2] | 0;
    _pqdownheap(i1, i4, 1);
    i15 = HEAP32[(i2 & 16777215) >> 2] | 0;
    i16 = HEAP32[(i9 & 16777215) >> 2] - 1 | 0;
    HEAP32[(i9 & 16777215) >> 2] = i16;
    HEAP32[((i16 << 2) + i1 + 2908 & 16777215) >> 2] = i22;
    i16 = HEAP32[(i9 & 16777215) >> 2] - 1 | 0;
    HEAP32[(i9 & 16777215) >> 2] = i16;
    HEAP32[((i16 << 2) + i1 + 2908 & 16777215) >> 2] = i15;
    HEAP16[((i14 << 2) + i4 & 16777215) >> 1] = HEAP16[((i15 << 2) + i4 & 16777215) >> 1] + HEAP16[((i22 << 2) + i4 & 16777215) >> 1] & 65535;
    i16 = HEAP8[i1 + (i22 + 5208) & 16777215] | 0;
    i10 = HEAP8[i1 + (i15 + 5208) & 16777215] | 0;
    HEAP8[i1 + (i14 + 5208) & 16777215] = ((i16 & 255) < (i10 & 255) ? i10 : i16) + 1 & 255;
    i16 = i14 & 65535;
    HEAP16[((i15 << 2) + i4 + 2 & 16777215) >> 1] = i16;
    HEAP16[((i22 << 2) + i4 + 2 & 16777215) >> 1] = i16;
    HEAP32[(i2 & 16777215) >> 2] = i14;
    _pqdownheap(i1, i4, 1);
    i16 = HEAP32[(i6 & 16777215) >> 2] | 0;
    if ((i16 | 0) > 1) {
      i14 = i14 + 1 | 0;
      i8 = i16;
    } else {
      break;
    }
  }
  i8 = HEAP32[(i2 & 16777215) >> 2] | 0;
  i2 = HEAP32[(i9 & 16777215) >> 2] - 1 | 0;
  HEAP32[(i9 & 16777215) >> 2] = i2;
  HEAP32[((i2 << 2) + i1 + 2908 & 16777215) >> 2] = i8;
  _gen_bitlen(i1, HEAP32[(i3 & 16777215) >> 2] | 0, HEAP32[(i7 & 16777215) >> 2] | 0, HEAP32[(i5 & 16777215) >> 2] | 0);
  _gen_codes(i4, i17, i1 + 2876 | 0);
  return;
}
function _build_bl_tree(i1) {
  i1 = i1 | 0;
  var i2 = 0, i3 = 0;
  _scan_tree(i1, i1 + 148 | 0, HEAP32[(i1 + 2844 & 16777215) >> 2] | 0);
  _scan_tree(i1, i1 + 2440 | 0, HEAP32[(i1 + 2856 & 16777215) >> 2] | 0);
  _build_tree(i1, i1 + 2864 | 0);
  i2 = 18;
  while (1) {
    if ((i2 | 0) <= 2) {
      break;
    }
    if (HEAP16[((HEAPU8[i2 + 5255332 & 16777215] << 2) + i1 + 2686 & 16777215) >> 1] << 16 >> 16 == 0) {
      i2 = i2 - 1 | 0;
    } else {
      break;
    }
  }
  i3 = i1 + 5800 | 0;
  HEAP32[(i3 & 16777215) >> 2] = ~~(+i2 * +3) + HEAP32[(i3 & 16777215) >> 2] + 17 | 0;
  return i2 | 0;
}
function _bi_windup(i1) {
  i1 = i1 | 0;
  var i2 = 0, i3 = 0, i4 = 0, i5 = 0, i6 = 0, i7 = 0, i8 = 0, i9 = 0;
  i2 = i1 + 5820 | 0;
  i3 = HEAP32[(i2 & 16777215) >> 2] | 0;
  if ((i3 | 0) > 8) {
    i4 = i1 + 5816 | 0;
    i5 = HEAP16[(i4 & 16777215) >> 1] & 255;
    i6 = i1 + 20 | 0;
    i7 = HEAP32[(i6 & 16777215) >> 2] | 0;
    HEAP32[(i6 & 16777215) >> 2] = i7 + 1 | 0;
    i8 = i1 + 8 | 0;
    HEAP8[HEAP32[(i8 & 16777215) >> 2] + i7 & 16777215] = i5;
    i5 = HEAPU16[(i4 & 16777215) >> 1] >>> 8 & 255;
    i7 = HEAP32[(i6 & 16777215) >> 2] | 0;
    HEAP32[(i6 & 16777215) >> 2] = i7 + 1 | 0;
    HEAP8[HEAP32[(i8 & 16777215) >> 2] + i7 & 16777215] = i5;
    i9 = i4;
    HEAP16[(i9 & 16777215) >> 1] = 0;
    HEAP32[(i2 & 16777215) >> 2] = 0;
    return;
  }
  i4 = i1 + 5816 | 0;
  if ((i3 | 0) <= 0) {
    i9 = i4;
    HEAP16[(i9 & 16777215) >> 1] = 0;
    HEAP32[(i2 & 16777215) >> 2] = 0;
    return;
  }
  i3 = HEAP16[(i4 & 16777215) >> 1] & 255;
  i5 = i1 + 20 | 0;
  i7 = HEAP32[(i5 & 16777215) >> 2] | 0;
  HEAP32[(i5 & 16777215) >> 2] = i7 + 1 | 0;
  HEAP8[HEAP32[(i1 + 8 & 16777215) >> 2] + i7 & 16777215] = i3;
  i9 = i4;
  HEAP16[(i9 & 16777215) >> 1] = 0;
  HEAP32[(i2 & 16777215) >> 2] = 0;
  return;
}
function _send_tree(i1, i2, i3) {
  i1 = i1 | 0;
  i2 = i2 | 0;
  i3 = i3 | 0;
  var i4 = 0, i5 = 0, i6 = 0, i7 = 0, i8 = 0, i9 = 0, i10 = 0, i11 = 0, i12 = 0, i13 = 0, i14 = 0, i15 = 0, i16 = 0, i17 = 0, i18 = 0, i19 = 0, i20 = 0, i21 = 0, i22 = 0, i23 = 0, i24 = 0, i25 = 0, i26 = 0, i27 = 0, i28 = 0, i29 = 0, i30 = 0, i31 = 0, i32 = 0, i33 = 0, i34 = 0, i35 = 0, i36 = 0, i37 = 0, i38 = 0, i39 = 0, i40 = 0, i41 = 0, i42 = 0, i43 = 0, i44 = 0, i45 = 0, i46 = 0, i47 = 0, i48 = 0;
  i4 = HEAP16[(i2 + 2 & 16777215) >> 1] | 0;
  i5 = i4 << 16 >> 16 == 0;
  i6 = i1 + 2754 | 0;
  i7 = i1 + 5820 | 0;
  i8 = i1 + 2752 | 0;
  i9 = i1 + 5816 | 0;
  i10 = i1 + 20 | 0;
  i11 = i1 + 8 | 0;
  i12 = i1 + 2758 | 0;
  i13 = i1 + 2756 | 0;
  i14 = i1 + 2750 | 0;
  i15 = i1 + 2748 | 0;
  i16 = 0;
  i17 = -1;
  i18 = i4 & 65535;
  i4 = i5 ? 138 : 7;
  i19 = i5 ? 3 : 4;
  L1456 : while (1) {
    i5 = i16;
    i20 = 0;
    while (1) {
      if ((i5 | 0) > (i3 | 0)) {
        break L1456;
      }
      i21 = i5 + 1 | 0;
      i22 = HEAP16[((i21 << 2) + i2 + 2 & 16777215) >> 1] | 0;
      i23 = i22 & 65535;
      i24 = i20 + 1 | 0;
      i25 = (i18 | 0) == (i23 | 0);
      if ((i24 | 0) < (i4 | 0) & i25) {
        i5 = i21;
        i20 = i24;
      } else {
        break;
      }
    }
    i5 = (i24 | 0) < (i19 | 0);
    L1462 : do {
      if (i5) {
        i26 = (i18 << 2) + i1 + 2686 | 0;
        i27 = (i18 << 2) + i1 + 2684 | 0;
        i28 = i24;
        i29 = HEAP32[(i7 & 16777215) >> 2] | 0;
        i30 = HEAP16[(i9 & 16777215) >> 1] | 0;
        while (1) {
          i31 = HEAPU16[(i26 & 16777215) >> 1];
          i32 = HEAPU16[(i27 & 16777215) >> 1];
          i33 = i30 & 65535 | i32 << i29;
          i34 = i33 & 65535;
          HEAP16[(i9 & 16777215) >> 1] = i34;
          if ((i29 | 0) > (16 - i31 | 0)) {
            i35 = HEAP32[(i10 & 16777215) >> 2] | 0;
            HEAP32[(i10 & 16777215) >> 2] = i35 + 1 | 0;
            HEAP8[HEAP32[(i11 & 16777215) >> 2] + i35 & 16777215] = i33 & 255;
            i33 = HEAPU16[(i9 & 16777215) >> 1] >>> 8 & 255;
            i35 = HEAP32[(i10 & 16777215) >> 2] | 0;
            HEAP32[(i10 & 16777215) >> 2] = i35 + 1 | 0;
            HEAP8[HEAP32[(i11 & 16777215) >> 2] + i35 & 16777215] = i33;
            i33 = HEAP32[(i7 & 16777215) >> 2] | 0;
            i35 = i32 >>> ((16 - i33 | 0) >>> 0) & 65535;
            HEAP16[(i9 & 16777215) >> 1] = i35;
            i36 = i31 - 16 + i33 | 0;
            i37 = i35;
          } else {
            i36 = i29 + i31 | 0;
            i37 = i34;
          }
          HEAP32[(i7 & 16777215) >> 2] = i36;
          i34 = i28 - 1 | 0;
          if ((i34 | 0) == 0) {
            break L1462;
          } else {
            i28 = i34;
            i29 = i36;
            i30 = i37;
          }
        }
      } else {
        if ((i18 | 0) != 0) {
          if ((i18 | 0) == (i17 | 0)) {
            i38 = i24;
            i39 = HEAP32[(i7 & 16777215) >> 2] | 0;
            i40 = HEAP16[(i9 & 16777215) >> 1] | 0;
          } else {
            i30 = HEAPU16[((i18 << 2) + i1 + 2686 & 16777215) >> 1];
            i29 = HEAP32[(i7 & 16777215) >> 2] | 0;
            i28 = HEAPU16[((i18 << 2) + i1 + 2684 & 16777215) >> 1];
            i27 = HEAPU16[(i9 & 16777215) >> 1] | i28 << i29;
            i26 = i27 & 65535;
            HEAP16[(i9 & 16777215) >> 1] = i26;
            if ((i29 | 0) > (16 - i30 | 0)) {
              i34 = HEAP32[(i10 & 16777215) >> 2] | 0;
              HEAP32[(i10 & 16777215) >> 2] = i34 + 1 | 0;
              HEAP8[HEAP32[(i11 & 16777215) >> 2] + i34 & 16777215] = i27 & 255;
              i27 = HEAPU16[(i9 & 16777215) >> 1] >>> 8 & 255;
              i34 = HEAP32[(i10 & 16777215) >> 2] | 0;
              HEAP32[(i10 & 16777215) >> 2] = i34 + 1 | 0;
              HEAP8[HEAP32[(i11 & 16777215) >> 2] + i34 & 16777215] = i27;
              i27 = HEAP32[(i7 & 16777215) >> 2] | 0;
              i34 = i28 >>> ((16 - i27 | 0) >>> 0) & 65535;
              HEAP16[(i9 & 16777215) >> 1] = i34;
              i41 = i30 - 16 + i27 | 0;
              i42 = i34;
            } else {
              i41 = i29 + i30 | 0;
              i42 = i26;
            }
            HEAP32[(i7 & 16777215) >> 2] = i41;
            i38 = i20;
            i39 = i41;
            i40 = i42;
          }
          i26 = HEAPU16[(i14 & 16777215) >> 1];
          i30 = HEAPU16[(i15 & 16777215) >> 1];
          i29 = i40 & 65535 | i30 << i39;
          HEAP16[(i9 & 16777215) >> 1] = i29 & 65535;
          if ((i39 | 0) > (16 - i26 | 0)) {
            i34 = HEAP32[(i10 & 16777215) >> 2] | 0;
            HEAP32[(i10 & 16777215) >> 2] = i34 + 1 | 0;
            HEAP8[HEAP32[(i11 & 16777215) >> 2] + i34 & 16777215] = i29 & 255;
            i34 = HEAPU16[(i9 & 16777215) >> 1] >>> 8 & 255;
            i27 = HEAP32[(i10 & 16777215) >> 2] | 0;
            HEAP32[(i10 & 16777215) >> 2] = i27 + 1 | 0;
            HEAP8[HEAP32[(i11 & 16777215) >> 2] + i27 & 16777215] = i34;
            i34 = HEAP32[(i7 & 16777215) >> 2] | 0;
            i27 = i30 >>> ((16 - i34 | 0) >>> 0);
            HEAP16[(i9 & 16777215) >> 1] = i27 & 65535;
            i43 = i26 - 16 + i34 | 0;
            i44 = i27;
          } else {
            i43 = i39 + i26 | 0;
            i44 = i29;
          }
          HEAP32[(i7 & 16777215) >> 2] = i43;
          i29 = i38 + 65533 & 65535;
          i26 = i44 & 65535 | i29 << i43;
          HEAP16[(i9 & 16777215) >> 1] = i26 & 65535;
          if ((i43 | 0) > 14) {
            i27 = HEAP32[(i10 & 16777215) >> 2] | 0;
            HEAP32[(i10 & 16777215) >> 2] = i27 + 1 | 0;
            HEAP8[HEAP32[(i11 & 16777215) >> 2] + i27 & 16777215] = i26 & 255;
            i26 = HEAPU16[(i9 & 16777215) >> 1] >>> 8 & 255;
            i27 = HEAP32[(i10 & 16777215) >> 2] | 0;
            HEAP32[(i10 & 16777215) >> 2] = i27 + 1 | 0;
            HEAP8[HEAP32[(i11 & 16777215) >> 2] + i27 & 16777215] = i26;
            i26 = HEAP32[(i7 & 16777215) >> 2] | 0;
            HEAP16[(i9 & 16777215) >> 1] = i29 >>> ((16 - i26 | 0) >>> 0) & 65535;
            HEAP32[(i7 & 16777215) >> 2] = i26 - 14 | 0;
            break;
          } else {
            HEAP32[(i7 & 16777215) >> 2] = i43 + 2 | 0;
            break;
          }
        }
        if ((i24 | 0) < 11) {
          i26 = HEAPU16[(i6 & 16777215) >> 1];
          i29 = HEAP32[(i7 & 16777215) >> 2] | 0;
          i27 = HEAPU16[(i8 & 16777215) >> 1];
          i34 = HEAPU16[(i9 & 16777215) >> 1] | i27 << i29;
          HEAP16[(i9 & 16777215) >> 1] = i34 & 65535;
          if ((i29 | 0) > (16 - i26 | 0)) {
            i30 = HEAP32[(i10 & 16777215) >> 2] | 0;
            HEAP32[(i10 & 16777215) >> 2] = i30 + 1 | 0;
            HEAP8[HEAP32[(i11 & 16777215) >> 2] + i30 & 16777215] = i34 & 255;
            i30 = HEAPU16[(i9 & 16777215) >> 1] >>> 8 & 255;
            i28 = HEAP32[(i10 & 16777215) >> 2] | 0;
            HEAP32[(i10 & 16777215) >> 2] = i28 + 1 | 0;
            HEAP8[HEAP32[(i11 & 16777215) >> 2] + i28 & 16777215] = i30;
            i30 = HEAP32[(i7 & 16777215) >> 2] | 0;
            i28 = i27 >>> ((16 - i30 | 0) >>> 0);
            HEAP16[(i9 & 16777215) >> 1] = i28 & 65535;
            i45 = i26 - 16 + i30 | 0;
            i46 = i28;
          } else {
            i45 = i29 + i26 | 0;
            i46 = i34;
          }
          HEAP32[(i7 & 16777215) >> 2] = i45;
          i34 = i20 + 65534 & 65535;
          i26 = i46 & 65535 | i34 << i45;
          HEAP16[(i9 & 16777215) >> 1] = i26 & 65535;
          if ((i45 | 0) > 13) {
            i29 = HEAP32[(i10 & 16777215) >> 2] | 0;
            HEAP32[(i10 & 16777215) >> 2] = i29 + 1 | 0;
            HEAP8[HEAP32[(i11 & 16777215) >> 2] + i29 & 16777215] = i26 & 255;
            i26 = HEAPU16[(i9 & 16777215) >> 1] >>> 8 & 255;
            i29 = HEAP32[(i10 & 16777215) >> 2] | 0;
            HEAP32[(i10 & 16777215) >> 2] = i29 + 1 | 0;
            HEAP8[HEAP32[(i11 & 16777215) >> 2] + i29 & 16777215] = i26;
            i26 = HEAP32[(i7 & 16777215) >> 2] | 0;
            HEAP16[(i9 & 16777215) >> 1] = i34 >>> ((16 - i26 | 0) >>> 0) & 65535;
            HEAP32[(i7 & 16777215) >> 2] = i26 - 13 | 0;
            break;
          } else {
            HEAP32[(i7 & 16777215) >> 2] = i45 + 3 | 0;
            break;
          }
        } else {
          i26 = HEAPU16[(i12 & 16777215) >> 1];
          i34 = HEAP32[(i7 & 16777215) >> 2] | 0;
          i29 = HEAPU16[(i13 & 16777215) >> 1];
          i28 = HEAPU16[(i9 & 16777215) >> 1] | i29 << i34;
          HEAP16[(i9 & 16777215) >> 1] = i28 & 65535;
          if ((i34 | 0) > (16 - i26 | 0)) {
            i30 = HEAP32[(i10 & 16777215) >> 2] | 0;
            HEAP32[(i10 & 16777215) >> 2] = i30 + 1 | 0;
            HEAP8[HEAP32[(i11 & 16777215) >> 2] + i30 & 16777215] = i28 & 255;
            i30 = HEAPU16[(i9 & 16777215) >> 1] >>> 8 & 255;
            i27 = HEAP32[(i10 & 16777215) >> 2] | 0;
            HEAP32[(i10 & 16777215) >> 2] = i27 + 1 | 0;
            HEAP8[HEAP32[(i11 & 16777215) >> 2] + i27 & 16777215] = i30;
            i30 = HEAP32[(i7 & 16777215) >> 2] | 0;
            i27 = i29 >>> ((16 - i30 | 0) >>> 0);
            HEAP16[(i9 & 16777215) >> 1] = i27 & 65535;
            i47 = i26 - 16 + i30 | 0;
            i48 = i27;
          } else {
            i47 = i34 + i26 | 0;
            i48 = i28;
          }
          HEAP32[(i7 & 16777215) >> 2] = i47;
          i28 = i20 + 65526 & 65535;
          i26 = i48 & 65535 | i28 << i47;
          HEAP16[(i9 & 16777215) >> 1] = i26 & 65535;
          if ((i47 | 0) > 9) {
            i34 = HEAP32[(i10 & 16777215) >> 2] | 0;
            HEAP32[(i10 & 16777215) >> 2] = i34 + 1 | 0;
            HEAP8[HEAP32[(i11 & 16777215) >> 2] + i34 & 16777215] = i26 & 255;
            i26 = HEAPU16[(i9 & 16777215) >> 1] >>> 8 & 255;
            i34 = HEAP32[(i10 & 16777215) >> 2] | 0;
            HEAP32[(i10 & 16777215) >> 2] = i34 + 1 | 0;
            HEAP8[HEAP32[(i11 & 16777215) >> 2] + i34 & 16777215] = i26;
            i26 = HEAP32[(i7 & 16777215) >> 2] | 0;
            HEAP16[(i9 & 16777215) >> 1] = i28 >>> ((16 - i26 | 0) >>> 0) & 65535;
            HEAP32[(i7 & 16777215) >> 2] = i26 - 9 | 0;
            break;
          } else {
            HEAP32[(i7 & 16777215) >> 2] = i47 + 7 | 0;
            break;
          }
        }
      }
    } while (0);
    if (i22 << 16 >> 16 == 0) {
      i16 = i21;
      i17 = i18;
      i18 = i23;
      i4 = 138;
      i19 = 3;
      continue;
    }
    i16 = i21;
    i17 = i18;
    i18 = i23;
    i4 = i25 ? 6 : 7;
    i19 = i25 ? 3 : 4;
  }
  return;
}
function _scan_tree(i1, i2, i3) {
  i1 = i1 | 0;
  i2 = i2 | 0;
  i3 = i3 | 0;
  var i4 = 0, i5 = 0, i6 = 0, i7 = 0, i8 = 0, i9 = 0, i10 = 0, i11 = 0, i12 = 0, i13 = 0, i14 = 0, i15 = 0, i16 = 0, i17 = 0, i18 = 0;
  i4 = HEAP16[(i2 + 2 & 16777215) >> 1] | 0;
  i5 = i4 << 16 >> 16 == 0;
  HEAP16[((i3 + 1 << 2) + i2 + 2 & 16777215) >> 1] = -1;
  i6 = i1 + 2752 | 0;
  i7 = i1 + 2756 | 0;
  i8 = i1 + 2748 | 0;
  i9 = i5 ? 3 : 4;
  i10 = i5 ? 138 : 7;
  i5 = i4 & 65535;
  i4 = 0;
  i11 = -1;
  L1510 : while (1) {
    i12 = 0;
    i13 = i4;
    while (1) {
      if ((i13 | 0) > (i3 | 0)) {
        break L1510;
      }
      i14 = i13 + 1 | 0;
      i15 = HEAP16[((i14 << 2) + i2 + 2 & 16777215) >> 1] | 0;
      i16 = i15 & 65535;
      i17 = i12 + 1 | 0;
      i18 = (i5 | 0) == (i16 | 0);
      if ((i17 | 0) < (i10 | 0) & i18) {
        i12 = i17;
        i13 = i14;
      } else {
        break;
      }
    }
    do {
      if ((i17 | 0) < (i9 | 0)) {
        i13 = (i5 << 2) + i1 + 2684 | 0;
        HEAP16[(i13 & 16777215) >> 1] = HEAPU16[(i13 & 16777215) >> 1] + i17 & 65535;
      } else {
        if ((i5 | 0) == 0) {
          if ((i17 | 0) < 11) {
            HEAP16[(i6 & 16777215) >> 1] = HEAP16[(i6 & 16777215) >> 1] + 1 & 65535;
            break;
          } else {
            HEAP16[(i7 & 16777215) >> 1] = HEAP16[(i7 & 16777215) >> 1] + 1 & 65535;
            break;
          }
        } else {
          if ((i5 | 0) != (i11 | 0)) {
            i13 = (i5 << 2) + i1 + 2684 | 0;
            HEAP16[(i13 & 16777215) >> 1] = HEAP16[(i13 & 16777215) >> 1] + 1 & 65535;
          }
          HEAP16[(i8 & 16777215) >> 1] = HEAP16[(i8 & 16777215) >> 1] + 1 & 65535;
          break;
        }
      }
    } while (0);
    if (i15 << 16 >> 16 == 0) {
      i9 = 3;
      i10 = 138;
      i11 = i5;
      i5 = i16;
      i4 = i14;
      continue;
    }
    i9 = i18 ? 3 : 4;
    i10 = i18 ? 6 : 7;
    i11 = i5;
    i5 = i16;
    i4 = i14;
  }
  return;
}
function _pqdownheap(i1, i2, i3) {
  i1 = i1 | 0;
  i2 = i2 | 0;
  i3 = i3 | 0;
  var i4 = 0, i5 = 0, i6 = 0, i7 = 0, i8 = 0, i9 = 0, i10 = 0, i11 = 0, i12 = 0, i13 = 0, i14 = 0, i15 = 0, i16 = 0, i17 = 0, i18 = 0;
  i4 = HEAP32[((i3 << 2) + i1 + 2908 & 16777215) >> 2] | 0;
  i5 = i1 + (i4 + 5208) | 0;
  i6 = i3 << 1;
  i7 = i1 + 5200 | 0;
  i8 = HEAP32[(i7 & 16777215) >> 2] | 0;
  if ((i6 | 0) > (i8 | 0)) {
    i9 = i3;
    i10 = (i9 << 2) + i1 + 2908 | 0;
    HEAP32[(i10 & 16777215) >> 2] = i4;
    return;
  }
  i11 = (i4 << 2) + i2 | 0;
  i12 = i3;
  i3 = i6;
  i6 = i8;
  while (1) {
    do {
      if ((i3 | 0) < (i6 | 0)) {
        i8 = i3 | 1;
        i13 = HEAP32[((i8 << 2) + i1 + 2908 & 16777215) >> 2] | 0;
        i14 = HEAP16[((i13 << 2) + i2 & 16777215) >> 1] | 0;
        i15 = HEAP32[((i3 << 2) + i1 + 2908 & 16777215) >> 2] | 0;
        i16 = HEAP16[((i15 << 2) + i2 & 16777215) >> 1] | 0;
        if ((i14 & 65535) >= (i16 & 65535)) {
          if (i14 << 16 >> 16 != i16 << 16 >> 16) {
            i17 = i3;
            break;
          }
          if (HEAPU8[i1 + (i13 + 5208) & 16777215] > HEAPU8[i1 + (i15 + 5208) & 16777215]) {
            i17 = i3;
            break;
          }
        }
        i17 = i8;
      } else {
        i17 = i3;
      }
    } while (0);
    i8 = HEAP16[(i11 & 16777215) >> 1] | 0;
    i15 = HEAP32[((i17 << 2) + i1 + 2908 & 16777215) >> 2] | 0;
    i13 = HEAP16[((i15 << 2) + i2 & 16777215) >> 1] | 0;
    if ((i8 & 65535) < (i13 & 65535)) {
      i9 = i12;
      i18 = 1155;
      break;
    }
    if (i8 << 16 >> 16 == i13 << 16 >> 16) {
      if (HEAPU8[i5 & 16777215] <= HEAPU8[i1 + (i15 + 5208) & 16777215]) {
        i9 = i12;
        i18 = 1157;
        break;
      }
    }
    HEAP32[((i12 << 2) + i1 + 2908 & 16777215) >> 2] = i15;
    i15 = i17 << 1;
    i13 = HEAP32[(i7 & 16777215) >> 2] | 0;
    if ((i15 | 0) > (i13 | 0)) {
      i9 = i17;
      i18 = 1156;
      break;
    } else {
      i12 = i17;
      i3 = i15;
      i6 = i13;
    }
  }
  if (i18 == 1155) {
    i10 = (i9 << 2) + i1 + 2908 | 0;
    HEAP32[(i10 & 16777215) >> 2] = i4;
    return;
  } else if (i18 == 1157) {
    i10 = (i9 << 2) + i1 + 2908 | 0;
    HEAP32[(i10 & 16777215) >> 2] = i4;
    return;
  } else if (i18 == 1156) {
    i10 = (i9 << 2) + i1 + 2908 | 0;
    HEAP32[(i10 & 16777215) >> 2] = i4;
    return;
  }
}
function _send_all_trees(i1, i2, i3, i4) {
  i1 = i1 | 0;
  i2 = i2 | 0;
  i3 = i3 | 0;
  i4 = i4 | 0;
  var i5 = 0, i6 = 0, i7 = 0, i8 = 0, i9 = 0, i10 = 0, i11 = 0, i12 = 0, i13 = 0, i14 = 0, i15 = 0, i16 = 0, i17 = 0, i18 = 0, i19 = 0, i20 = 0, i21 = 0, i22 = 0, i23 = 0, i24 = 0;
  i5 = i1 + 5820 | 0;
  i6 = HEAP32[(i5 & 16777215) >> 2] | 0;
  i7 = i2 + 65279 & 65535;
  i8 = i1 + 5816 | 0;
  i9 = HEAPU16[(i8 & 16777215) >> 1] | i7 << i6;
  HEAP16[(i8 & 16777215) >> 1] = i9 & 65535;
  if ((i6 | 0) > 11) {
    i10 = i1 + 20 | 0;
    i11 = HEAP32[(i10 & 16777215) >> 2] | 0;
    HEAP32[(i10 & 16777215) >> 2] = i11 + 1 | 0;
    i12 = i1 + 8 | 0;
    HEAP8[HEAP32[(i12 & 16777215) >> 2] + i11 & 16777215] = i9 & 255;
    i11 = HEAPU16[(i8 & 16777215) >> 1] >>> 8 & 255;
    i13 = HEAP32[(i10 & 16777215) >> 2] | 0;
    HEAP32[(i10 & 16777215) >> 2] = i13 + 1 | 0;
    HEAP8[HEAP32[(i12 & 16777215) >> 2] + i13 & 16777215] = i11;
    i11 = HEAP32[(i5 & 16777215) >> 2] | 0;
    i13 = i7 >>> ((16 - i11 | 0) >>> 0);
    HEAP16[(i8 & 16777215) >> 1] = i13 & 65535;
    i14 = i11 - 11 | 0;
    i15 = i13;
  } else {
    i14 = i6 + 5 | 0;
    i15 = i9;
  }
  HEAP32[(i5 & 16777215) >> 2] = i14;
  i9 = i3 - 1 | 0;
  i3 = i9 & 65535;
  i6 = i15 & 65535 | i3 << i14;
  HEAP16[(i8 & 16777215) >> 1] = i6 & 65535;
  if ((i14 | 0) > 11) {
    i15 = i1 + 20 | 0;
    i13 = HEAP32[(i15 & 16777215) >> 2] | 0;
    HEAP32[(i15 & 16777215) >> 2] = i13 + 1 | 0;
    i11 = i1 + 8 | 0;
    HEAP8[HEAP32[(i11 & 16777215) >> 2] + i13 & 16777215] = i6 & 255;
    i13 = HEAPU16[(i8 & 16777215) >> 1] >>> 8 & 255;
    i7 = HEAP32[(i15 & 16777215) >> 2] | 0;
    HEAP32[(i15 & 16777215) >> 2] = i7 + 1 | 0;
    HEAP8[HEAP32[(i11 & 16777215) >> 2] + i7 & 16777215] = i13;
    i13 = HEAP32[(i5 & 16777215) >> 2] | 0;
    i7 = i3 >>> ((16 - i13 | 0) >>> 0);
    HEAP16[(i8 & 16777215) >> 1] = i7 & 65535;
    i16 = i13 - 11 | 0;
    i17 = i7;
  } else {
    i16 = i14 + 5 | 0;
    i17 = i6;
  }
  HEAP32[(i5 & 16777215) >> 2] = i16;
  i6 = i4 + 65532 & 65535;
  i14 = i17 & 65535 | i6 << i16;
  HEAP16[(i8 & 16777215) >> 1] = i14 & 65535;
  if ((i16 | 0) > 12) {
    i17 = i1 + 20 | 0;
    i7 = HEAP32[(i17 & 16777215) >> 2] | 0;
    HEAP32[(i17 & 16777215) >> 2] = i7 + 1 | 0;
    i13 = i1 + 8 | 0;
    HEAP8[HEAP32[(i13 & 16777215) >> 2] + i7 & 16777215] = i14 & 255;
    i7 = HEAPU16[(i8 & 16777215) >> 1] >>> 8 & 255;
    i3 = HEAP32[(i17 & 16777215) >> 2] | 0;
    HEAP32[(i17 & 16777215) >> 2] = i3 + 1 | 0;
    HEAP8[HEAP32[(i13 & 16777215) >> 2] + i3 & 16777215] = i7;
    i7 = HEAP32[(i5 & 16777215) >> 2] | 0;
    i3 = i6 >>> ((16 - i7 | 0) >>> 0);
    HEAP16[(i8 & 16777215) >> 1] = i3 & 65535;
    i18 = i7 - 12 | 0;
    i19 = i3;
  } else {
    i18 = i16 + 4 | 0;
    i19 = i14;
  }
  HEAP32[(i5 & 16777215) >> 2] = i18;
  if ((i4 | 0) <= 0) {
    i20 = i1 + 148 | 0;
    i21 = i2 - 1 | 0;
    _send_tree(i1, i20, i21);
    i22 = i1 + 2440 | 0;
    _send_tree(i1, i22, i9);
    return;
  }
  i14 = i1 + 20 | 0;
  i16 = i1 + 8 | 0;
  i3 = 0;
  i7 = i18;
  i18 = i19;
  while (1) {
    i19 = HEAPU16[((HEAPU8[i3 + 5255332 & 16777215] << 2) + i1 + 2686 & 16777215) >> 1];
    i6 = i18 & 65535 | i19 << i7;
    HEAP16[(i8 & 16777215) >> 1] = i6 & 65535;
    if ((i7 | 0) > 13) {
      i13 = HEAP32[(i14 & 16777215) >> 2] | 0;
      HEAP32[(i14 & 16777215) >> 2] = i13 + 1 | 0;
      HEAP8[HEAP32[(i16 & 16777215) >> 2] + i13 & 16777215] = i6 & 255;
      i13 = HEAPU16[(i8 & 16777215) >> 1] >>> 8 & 255;
      i17 = HEAP32[(i14 & 16777215) >> 2] | 0;
      HEAP32[(i14 & 16777215) >> 2] = i17 + 1 | 0;
      HEAP8[HEAP32[(i16 & 16777215) >> 2] + i17 & 16777215] = i13;
      i13 = HEAP32[(i5 & 16777215) >> 2] | 0;
      i17 = i19 >>> ((16 - i13 | 0) >>> 0);
      HEAP16[(i8 & 16777215) >> 1] = i17 & 65535;
      i23 = i13 - 13 | 0;
      i24 = i17;
    } else {
      i23 = i7 + 3 | 0;
      i24 = i6;
    }
    HEAP32[(i5 & 16777215) >> 2] = i23;
    i6 = i3 + 1 | 0;
    if ((i6 | 0) == (i4 | 0)) {
      break;
    } else {
      i3 = i6;
      i7 = i23;
      i18 = i24;
    }
  }
  i20 = i1 + 148 | 0;
  i21 = i2 - 1 | 0;
  _send_tree(i1, i20, i21);
  i22 = i1 + 2440 | 0;
  _send_tree(i1, i22, i9);
  return;
}
function _bi_reverse(i1, i2) {
  i1 = i1 | 0;
  i2 = i2 | 0;
  var i3 = 0, i4 = 0, i5 = 0;
  i3 = 0;
  i4 = i2;
  i2 = i1;
  while (1) {
    i5 = i3 | i2 & 1;
    i1 = i4 - 1 | 0;
    if ((i1 | 0) > 0) {
      i3 = i5 << 1;
      i4 = i1;
      i2 = i2 >>> 1;
    } else {
      break;
    }
  }
  return i5 & 2147483647 | 0;
}
function _adler32(i1, i2, i3) {
  i1 = i1 | 0;
  i2 = i2 | 0;
  i3 = i3 | 0;
  var i4 = 0, i5 = 0, i6 = 0, i7 = 0, i8 = 0, i9 = 0, i10 = 0, i11 = 0, i12 = 0, i13 = 0, i14 = 0, i15 = 0, i16 = 0, i17 = 0, i18 = 0, i19 = 0, i20 = 0, i21 = 0, i22 = 0, i23 = 0, i24 = 0, i25 = 0, i26 = 0, i27 = 0, i28 = 0, i29 = 0, i30 = 0, i31 = 0, i32 = 0, i33 = 0, i34 = 0, i35 = 0, i36 = 0, i37 = 0, i38 = 0, i39 = 0, i40 = 0, i41 = 0, i42 = 0, i43 = 0, i44 = 0, i45 = 0, i46 = 0, i47 = 0, i48 = 0, i49 = 0, i50 = 0, i51 = 0;
  i4 = i1 >>> 16;
  i5 = i1 & 65535;
  if ((i3 | 0) == 1) {
    i1 = HEAPU8[i2 & 16777215] + i5 | 0;
    i6 = i1 >>> 0 > 65520 ? i1 - 65521 | 0 : i1;
    i1 = i6 + i4 | 0;
    i7 = (i1 >>> 0 > 65520 ? i1 + 15 | 0 : i1) << 16 | i6;
    return i7 | 0;
  }
  if ((i2 | 0) == 0) {
    i7 = 1;
    return i7 | 0;
  }
  if (i3 >>> 0 < 16) {
    i6 = (i3 | 0) == 0;
    L1589 : do {
      if (i6) {
        i8 = i5;
        i9 = i4;
      } else {
        i1 = i5;
        i10 = i2;
        i11 = i3;
        i12 = i4;
        while (1) {
          i13 = i11 - 1 | 0;
          i14 = HEAPU8[i10 & 16777215] + i1 | 0;
          i15 = i14 + i12 | 0;
          if ((i13 | 0) == 0) {
            i8 = i14;
            i9 = i15;
            break L1589;
          } else {
            i1 = i14;
            i10 = i10 + 1 | 0;
            i11 = i13;
            i12 = i15;
          }
        }
      }
    } while (0);
    i7 = (i9 >>> 0) % 65521 << 16 | (i8 >>> 0 > 65520 ? i8 - 65521 | 0 : i8);
    return i7 | 0;
  }
  do {
    if (i3 >>> 0 > 5551) {
      i8 = i5;
      i9 = i2;
      i6 = i3;
      i12 = i4;
      while (1) {
        i16 = i6 - 5552 | 0;
        i11 = 347;
        i10 = i12;
        i1 = i9;
        i15 = i8;
        while (1) {
          i13 = HEAPU8[i1 & 16777215] + i15 | 0;
          i14 = i13 + HEAPU8[i1 + 1 & 16777215] | 0;
          i17 = i14 + HEAPU8[i1 + 2 & 16777215] | 0;
          i18 = i17 + HEAPU8[i1 + 3 & 16777215] | 0;
          i19 = i18 + HEAPU8[i1 + 4 & 16777215] | 0;
          i20 = i19 + HEAPU8[i1 + 5 & 16777215] | 0;
          i21 = i20 + HEAPU8[i1 + 6 & 16777215] | 0;
          i22 = i21 + HEAPU8[i1 + 7 & 16777215] | 0;
          i23 = i22 + HEAPU8[i1 + 8 & 16777215] | 0;
          i24 = i23 + HEAPU8[i1 + 9 & 16777215] | 0;
          i25 = i24 + HEAPU8[i1 + 10 & 16777215] | 0;
          i26 = i25 + HEAPU8[i1 + 11 & 16777215] | 0;
          i27 = i26 + HEAPU8[i1 + 12 & 16777215] | 0;
          i28 = i27 + HEAPU8[i1 + 13 & 16777215] | 0;
          i29 = i28 + HEAPU8[i1 + 14 & 16777215] | 0;
          i30 = i29 + HEAPU8[i1 + 15 & 16777215] | 0;
          i31 = i13 + i10 + i14 + i17 + i18 + i19 + i20 + i21 + i22 + i23 + i24 + i25 + i26 + i27 + i28 + i29 + i30 | 0;
          i29 = i11 - 1 | 0;
          if ((i29 | 0) == 0) {
            break;
          } else {
            i11 = i29;
            i10 = i31;
            i1 = i1 + 16 | 0;
            i15 = i30;
          }
        }
        i32 = i9 + 5552 | 0;
        i33 = (i30 >>> 0) % 65521;
        i34 = (i31 >>> 0) % 65521;
        if (i16 >>> 0 > 5551) {
          i8 = i33;
          i9 = i32;
          i6 = i16;
          i12 = i34;
        } else {
          break;
        }
      }
      if ((i16 | 0) == 0) {
        i35 = i34;
        i36 = i33;
        break;
      }
      if (i16 >>> 0 > 15) {
        i37 = i33;
        i38 = i32;
        i39 = i16;
        i40 = i34;
        i41 = 1193;
        break;
      } else {
        i42 = i33;
        i43 = i32;
        i44 = i16;
        i45 = i34;
        i41 = 1194;
        break;
      }
    } else {
      i37 = i5;
      i38 = i2;
      i39 = i3;
      i40 = i4;
      i41 = 1193;
    }
  } while (0);
  do {
    if (i41 == 1193) {
      while (1) {
        i41 = 0;
        i46 = i39 - 16 | 0;
        i4 = HEAPU8[i38 & 16777215] + i37 | 0;
        i3 = i4 + HEAPU8[i38 + 1 & 16777215] | 0;
        i2 = i3 + HEAPU8[i38 + 2 & 16777215] | 0;
        i5 = i2 + HEAPU8[i38 + 3 & 16777215] | 0;
        i34 = i5 + HEAPU8[i38 + 4 & 16777215] | 0;
        i16 = i34 + HEAPU8[i38 + 5 & 16777215] | 0;
        i32 = i16 + HEAPU8[i38 + 6 & 16777215] | 0;
        i33 = i32 + HEAPU8[i38 + 7 & 16777215] | 0;
        i31 = i33 + HEAPU8[i38 + 8 & 16777215] | 0;
        i30 = i31 + HEAPU8[i38 + 9 & 16777215] | 0;
        i12 = i30 + HEAPU8[i38 + 10 & 16777215] | 0;
        i6 = i12 + HEAPU8[i38 + 11 & 16777215] | 0;
        i9 = i6 + HEAPU8[i38 + 12 & 16777215] | 0;
        i8 = i9 + HEAPU8[i38 + 13 & 16777215] | 0;
        i15 = i8 + HEAPU8[i38 + 14 & 16777215] | 0;
        i47 = i15 + HEAPU8[i38 + 15 & 16777215] | 0;
        i48 = i4 + i40 + i3 + i2 + i5 + i34 + i16 + i32 + i33 + i31 + i30 + i12 + i6 + i9 + i8 + i15 + i47 | 0;
        i49 = i38 + 16 | 0;
        if (i46 >>> 0 > 15) {
          i37 = i47;
          i38 = i49;
          i39 = i46;
          i40 = i48;
          i41 = 1193;
        } else {
          break;
        }
      }
      if ((i46 | 0) == 0) {
        i50 = i47;
        i51 = i48;
        i41 = 1195;
        break;
      } else {
        i42 = i47;
        i43 = i49;
        i44 = i46;
        i45 = i48;
        i41 = 1194;
        break;
      }
    }
  } while (0);
  L1607 : do {
    if (i41 == 1194) {
      while (1) {
        i41 = 0;
        i48 = i44 - 1 | 0;
        i46 = HEAPU8[i43 & 16777215] + i42 | 0;
        i49 = i46 + i45 | 0;
        if ((i48 | 0) == 0) {
          i50 = i46;
          i51 = i49;
          i41 = 1195;
          break L1607;
        } else {
          i42 = i46;
          i43 = i43 + 1 | 0;
          i44 = i48;
          i45 = i49;
          i41 = 1194;
        }
      }
    }
  } while (0);
  if (i41 == 1195) {
    i35 = (i51 >>> 0) % 65521;
    i36 = (i50 >>> 0) % 65521;
  }
  i7 = i35 << 16 | i36;
  return i7 | 0;
}
function _crc32_little(i1, i2, i3) {
  i1 = i1 | 0;
  i2 = i2 | 0;
  i3 = i3 | 0;
  var i4 = 0, i5 = 0, i6 = 0, i7 = 0, i8 = 0, i9 = 0, i10 = 0, i11 = 0, i12 = 0, i13 = 0, i14 = 0, i15 = 0, i16 = 0, i17 = 0, i18 = 0;
  i4 = i1 ^ -1;
  if ((i3 | 0) == 0) {
    i5 = i4;
    i6 = i5 ^ -1;
    return i6 | 0;
  } else {
    i7 = i2;
    i8 = i3;
    i9 = i4;
  }
  while (1) {
    if ((i7 & 3 | 0) == 0) {
      break;
    }
    i4 = HEAP32[(((HEAPU8[i7 & 16777215] ^ i9 & 255) << 2) + 5247020 & 16777215) >> 2] ^ i9 >>> 8;
    i3 = i8 - 1 | 0;
    if ((i3 | 0) == 0) {
      i5 = i4;
      i10 = 1216;
      break;
    } else {
      i7 = i7 + 1 | 0;
      i8 = i3;
      i9 = i4;
    }
  }
  if (i10 == 1216) {
    i6 = i5 ^ -1;
    return i6 | 0;
  }
  i10 = i7;
  i7 = i8 >>> 0 > 31;
  L1623 : do {
    if (i7) {
      i4 = i8;
      i3 = i9;
      i2 = i10;
      while (1) {
        i1 = HEAP32[(i2 & 16777215) >> 2] ^ i3;
        i11 = HEAP32[(((i1 >>> 8 & 255) << 2) + 5249068 & 16777215) >> 2] ^ HEAP32[(((i1 & 255) << 2) + 5250092 & 16777215) >> 2] ^ HEAP32[(((i1 >>> 16 & 255) << 2) + 5248044 & 16777215) >> 2] ^ HEAP32[((i1 >>> 24 << 2) + 5247020 & 16777215) >> 2] ^ HEAP32[(i2 + 4 & 16777215) >> 2];
        i1 = HEAP32[(((i11 >>> 8 & 255) << 2) + 5249068 & 16777215) >> 2] ^ HEAP32[(((i11 & 255) << 2) + 5250092 & 16777215) >> 2] ^ HEAP32[(((i11 >>> 16 & 255) << 2) + 5248044 & 16777215) >> 2] ^ HEAP32[((i11 >>> 24 << 2) + 5247020 & 16777215) >> 2] ^ HEAP32[(i2 + 8 & 16777215) >> 2];
        i11 = HEAP32[(((i1 >>> 8 & 255) << 2) + 5249068 & 16777215) >> 2] ^ HEAP32[(((i1 & 255) << 2) + 5250092 & 16777215) >> 2] ^ HEAP32[(((i1 >>> 16 & 255) << 2) + 5248044 & 16777215) >> 2] ^ HEAP32[((i1 >>> 24 << 2) + 5247020 & 16777215) >> 2] ^ HEAP32[(i2 + 12 & 16777215) >> 2];
        i1 = HEAP32[(((i11 >>> 8 & 255) << 2) + 5249068 & 16777215) >> 2] ^ HEAP32[(((i11 & 255) << 2) + 5250092 & 16777215) >> 2] ^ HEAP32[(((i11 >>> 16 & 255) << 2) + 5248044 & 16777215) >> 2] ^ HEAP32[((i11 >>> 24 << 2) + 5247020 & 16777215) >> 2] ^ HEAP32[(i2 + 16 & 16777215) >> 2];
        i11 = HEAP32[(((i1 >>> 8 & 255) << 2) + 5249068 & 16777215) >> 2] ^ HEAP32[(((i1 & 255) << 2) + 5250092 & 16777215) >> 2] ^ HEAP32[(((i1 >>> 16 & 255) << 2) + 5248044 & 16777215) >> 2] ^ HEAP32[((i1 >>> 24 << 2) + 5247020 & 16777215) >> 2] ^ HEAP32[(i2 + 20 & 16777215) >> 2];
        i1 = HEAP32[(((i11 >>> 8 & 255) << 2) + 5249068 & 16777215) >> 2] ^ HEAP32[(((i11 & 255) << 2) + 5250092 & 16777215) >> 2] ^ HEAP32[(((i11 >>> 16 & 255) << 2) + 5248044 & 16777215) >> 2] ^ HEAP32[((i11 >>> 24 << 2) + 5247020 & 16777215) >> 2] ^ HEAP32[(i2 + 24 & 16777215) >> 2];
        i11 = i2 + 32 | 0;
        i12 = HEAP32[(((i1 >>> 8 & 255) << 2) + 5249068 & 16777215) >> 2] ^ HEAP32[(((i1 & 255) << 2) + 5250092 & 16777215) >> 2] ^ HEAP32[(((i1 >>> 16 & 255) << 2) + 5248044 & 16777215) >> 2] ^ HEAP32[((i1 >>> 24 << 2) + 5247020 & 16777215) >> 2] ^ HEAP32[(i2 + 28 & 16777215) >> 2];
        i1 = HEAP32[(((i12 >>> 8 & 255) << 2) + 5249068 & 16777215) >> 2] ^ HEAP32[(((i12 & 255) << 2) + 5250092 & 16777215) >> 2] ^ HEAP32[(((i12 >>> 16 & 255) << 2) + 5248044 & 16777215) >> 2] ^ HEAP32[((i12 >>> 24 << 2) + 5247020 & 16777215) >> 2];
        i12 = i4 - 32 | 0;
        if (i12 >>> 0 > 31) {
          i4 = i12;
          i3 = i1;
          i2 = i11;
        } else {
          i13 = i12;
          i14 = i1;
          i15 = i11;
          break L1623;
        }
      }
    } else {
      i13 = i8;
      i14 = i9;
      i15 = i10;
    }
  } while (0);
  i10 = i13 >>> 0 > 3;
  L1627 : do {
    if (i10) {
      i9 = i13;
      i8 = i14;
      i7 = i15;
      while (1) {
        i2 = i7 + 4 | 0;
        i3 = HEAP32[(i7 & 16777215) >> 2] ^ i8;
        i4 = HEAP32[(((i3 >>> 8 & 255) << 2) + 5249068 & 16777215) >> 2] ^ HEAP32[(((i3 & 255) << 2) + 5250092 & 16777215) >> 2] ^ HEAP32[(((i3 >>> 16 & 255) << 2) + 5248044 & 16777215) >> 2] ^ HEAP32[((i3 >>> 24 << 2) + 5247020 & 16777215) >> 2];
        i3 = i9 - 4 | 0;
        if (i3 >>> 0 > 3) {
          i9 = i3;
          i8 = i4;
          i7 = i2;
        } else {
          i16 = i3;
          i17 = i4;
          i18 = i2;
          break L1627;
        }
      }
    } else {
      i16 = i13;
      i17 = i14;
      i18 = i15;
    }
  } while (0);
  if ((i16 | 0) == 0) {
    i5 = i17;
    i6 = i5 ^ -1;
    return i6 | 0;
  }
  i15 = i17;
  i17 = i16;
  i16 = i18;
  while (1) {
    i18 = HEAP32[(((HEAPU8[i16 & 16777215] ^ i15 & 255) << 2) + 5247020 & 16777215) >> 2] ^ i15 >>> 8;
    i14 = i17 - 1 | 0;
    if ((i14 | 0) == 0) {
      i5 = i18;
      break;
    } else {
      i15 = i18;
      i17 = i14;
      i16 = i16 + 1 | 0;
    }
  }
  i6 = i5 ^ -1;
  return i6 | 0;
}
function _gen_bitlen(i1, i2, i3, i4) {
  i1 = i1 | 0;
  i2 = i2 | 0;
  i3 = i3 | 0;
  i4 = i4 | 0;
  var i5 = 0, i6 = 0, i7 = 0, i8 = 0, i9 = 0, i10 = 0, i11 = 0, i12 = 0, i13 = 0, i14 = 0, i15 = 0, i16 = 0, i17 = 0, i18 = 0, i19 = 0, i20 = 0, i21 = 0, i22 = 0, i23 = 0, i24 = 0, i25 = 0, i26 = 0, i27 = 0, i28 = 0, i29 = 0, i30 = 0;
  i5 = HEAP32[(i4 & 16777215) >> 2] | 0;
  i6 = HEAP32[(i4 + 4 & 16777215) >> 2] | 0;
  i7 = HEAP32[(i4 + 8 & 16777215) >> 2] | 0;
  i8 = HEAP32[(i4 + 16 & 16777215) >> 2] | 0;
  _memset(i1 + 2876 | 0, 0 | 0, 32 | 0, 2 | 0);
  i4 = i1 + 5204 | 0;
  HEAP16[((HEAP32[((HEAP32[(i4 & 16777215) >> 2] << 2) + i1 + 2908 & 16777215) >> 2] << 2) + i2 + 2 & 16777215) >> 1] = 0;
  i9 = HEAP32[(i4 & 16777215) >> 2] + 1 | 0;
  if ((i9 | 0) >= 573) {
    return;
  }
  i4 = i1 + 5800 | 0;
  i10 = (i5 | 0) == 0;
  i11 = i1 + 5804 | 0;
  L1641 : do {
    if (i10) {
      i12 = 0;
      i13 = i9;
      while (1) {
        i14 = HEAP32[((i13 << 2) + i1 + 2908 & 16777215) >> 2] | 0;
        i15 = (i14 << 2) + i2 + 2 | 0;
        i16 = HEAPU16[((HEAPU16[(i15 & 16777215) >> 1] << 2) + i2 + 2 & 16777215) >> 1] + 1 | 0;
        i17 = (i16 | 0) > (i8 | 0);
        i18 = i17 ? i8 : i16;
        i16 = (i17 & 1) + i12 | 0;
        HEAP16[(i15 & 16777215) >> 1] = i18 & 65535;
        if ((i14 | 0) <= (i3 | 0)) {
          i15 = (i18 << 1) + i1 + 2876 | 0;
          HEAP16[(i15 & 16777215) >> 1] = HEAP16[(i15 & 16777215) >> 1] + 1 & 65535;
          if ((i14 | 0) < (i7 | 0)) {
            i19 = 0;
          } else {
            i19 = HEAP32[((i14 - i7 << 2) + i6 & 16777215) >> 2] | 0;
          }
          HEAP32[(i4 & 16777215) >> 2] = ~~(+HEAPU16[((i14 << 2) + i2 & 16777215) >> 1] * +(i19 + i18 | 0)) + HEAP32[(i4 & 16777215) >> 2] | 0;
        }
        i18 = i13 + 1 | 0;
        if ((i18 | 0) == 573) {
          i20 = i16;
          break L1641;
        } else {
          i12 = i16;
          i13 = i18;
        }
      }
    } else {
      i13 = 0;
      i12 = i9;
      while (1) {
        i18 = HEAP32[((i12 << 2) + i1 + 2908 & 16777215) >> 2] | 0;
        i16 = (i18 << 2) + i2 + 2 | 0;
        i14 = HEAPU16[((HEAPU16[(i16 & 16777215) >> 1] << 2) + i2 + 2 & 16777215) >> 1] + 1 | 0;
        i15 = (i14 | 0) > (i8 | 0);
        i17 = i15 ? i8 : i14;
        i14 = (i15 & 1) + i13 | 0;
        HEAP16[(i16 & 16777215) >> 1] = i17 & 65535;
        if ((i18 | 0) <= (i3 | 0)) {
          i16 = (i17 << 1) + i1 + 2876 | 0;
          HEAP16[(i16 & 16777215) >> 1] = HEAP16[(i16 & 16777215) >> 1] + 1 & 65535;
          if ((i18 | 0) < (i7 | 0)) {
            i21 = 0;
          } else {
            i21 = HEAP32[((i18 - i7 << 2) + i6 & 16777215) >> 2] | 0;
          }
          i16 = HEAPU16[((i18 << 2) + i2 & 16777215) >> 1];
          HEAP32[(i4 & 16777215) >> 2] = ~~(+i16 * +(i21 + i17 | 0)) + HEAP32[(i4 & 16777215) >> 2] | 0;
          HEAP32[(i11 & 16777215) >> 2] = ~~(+(HEAPU16[((i18 << 2) + i5 + 2 & 16777215) >> 1] + i21 | 0) * +i16) + HEAP32[(i11 & 16777215) >> 2] | 0;
        }
        i16 = i12 + 1 | 0;
        if ((i16 | 0) == 573) {
          i20 = i14;
          break L1641;
        } else {
          i13 = i14;
          i12 = i16;
        }
      }
    }
  } while (0);
  if ((i20 | 0) == 0) {
    return;
  }
  i11 = (i8 << 1) + i1 + 2876 | 0;
  i21 = i20;
  while (1) {
    i20 = i8;
    while (1) {
      i5 = i20 - 1 | 0;
      i22 = (i5 << 1) + i1 + 2876 | 0;
      i23 = HEAP16[(i22 & 16777215) >> 1] | 0;
      if (i23 << 16 >> 16 == 0) {
        i20 = i5;
      } else {
        break;
      }
    }
    HEAP16[(i22 & 16777215) >> 1] = i23 - 1 & 65535;
    i5 = (i20 << 1) + i1 + 2876 | 0;
    HEAP16[(i5 & 16777215) >> 1] = HEAP16[(i5 & 16777215) >> 1] + 2 & 65535;
    i24 = HEAP16[(i11 & 16777215) >> 1] - 1 & 65535;
    HEAP16[(i11 & 16777215) >> 1] = i24;
    i5 = i21 - 2 | 0;
    if ((i5 | 0) > 0) {
      i21 = i5;
    } else {
      break;
    }
  }
  if ((i8 | 0) == 0) {
    return;
  } else {
    i25 = i8;
    i26 = 573;
    i27 = i24;
  }
  while (1) {
    i24 = i25 & 65535;
    i8 = i26;
    i21 = i27 & 65535;
    while (1) {
      if ((i21 | 0) == 0) {
        break;
      } else {
        i28 = i8;
      }
      while (1) {
        i29 = i28 - 1 | 0;
        i30 = HEAP32[((i29 << 2) + i1 + 2908 & 16777215) >> 2] | 0;
        if ((i30 | 0) > (i3 | 0)) {
          i28 = i29;
        } else {
          break;
        }
      }
      i11 = (i30 << 2) + i2 + 2 | 0;
      i23 = HEAPU16[(i11 & 16777215) >> 1];
      if ((i23 | 0) != (i25 | 0)) {
        HEAP32[(i4 & 16777215) >> 2] = ~~(+HEAPU16[((i30 << 2) + i2 & 16777215) >> 1] * +(i25 - i23 | 0)) + HEAP32[(i4 & 16777215) >> 2] | 0;
        HEAP16[(i11 & 16777215) >> 1] = i24;
      }
      i8 = i29;
      i21 = i21 - 1 | 0;
    }
    i21 = i25 - 1 | 0;
    if ((i21 | 0) == 0) {
      break;
    }
    i25 = i21;
    i26 = i8;
    i27 = HEAP16[((i21 << 1) + i1 + 2876 & 16777215) >> 1] | 0;
  }
  return;
}
function _gen_codes(i1, i2, i3) {
  i1 = i1 | 0;
  i2 = i2 | 0;
  i3 = i3 | 0;
  var i4 = 0, i5 = 0, i6 = 0, i7 = 0, i8 = 0, i9 = 0;
  i4 = STACKTOP;
  STACKTOP = STACKTOP + 32 | 0;
  i5 = i4 | 0;
  i6 = 1;
  i7 = 0;
  while (1) {
    i8 = HEAPU16[((i6 - 1 << 1) + i3 & 16777215) >> 1] + (i7 & 65534) << 1;
    HEAP16[((i6 << 1) + i5 & 16777215) >> 1] = i8 & 65535;
    i9 = i6 + 1 | 0;
    if ((i9 | 0) == 16) {
      break;
    } else {
      i6 = i9;
      i7 = i8;
    }
  }
  if ((i2 | 0) < 0) {
    STACKTOP = i4;
    return;
  }
  i7 = i2 + 1 | 0;
  i2 = 0;
  while (1) {
    i6 = HEAP16[((i2 << 2) + i1 + 2 & 16777215) >> 1] | 0;
    i3 = i6 & 65535;
    if (i6 << 16 >> 16 != 0) {
      i6 = (i3 << 1) + i5 | 0;
      i8 = HEAP16[(i6 & 16777215) >> 1] | 0;
      HEAP16[(i6 & 16777215) >> 1] = i8 + 1 & 65535;
      HEAP16[((i2 << 2) + i1 & 16777215) >> 1] = _bi_reverse(i8 & 65535, i3) & 65535;
    }
    i3 = i2 + 1 | 0;
    if ((i3 | 0) == (i7 | 0)) {
      break;
    } else {
      i2 = i3;
    }
  }
  STACKTOP = i4;
  return;
}
function _zcalloc(i1, i2, i3) {
  i1 = i1 | 0;
  i2 = i2 | 0;
  i3 = i3 | 0;
  return _malloc(~~(+i3 * +i2)) | 0;
}
function _zcfree(i1, i2) {
  i1 = i1 | 0;
  i2 = i2 | 0;
  _free(i2);
  return;
}
function _crc32(i1, i2, i3) {
  i1 = i1 | 0;
  i2 = i2 | 0;
  i3 = i3 | 0;
  var i4 = 0;
  if ((i2 | 0) == 0) {
    i4 = 0;
  } else {
    i4 = _crc32_little(i1, i2, i3);
  }
  return i4 | 0;
}
function _inflate_fast(i1, i2) {
  i1 = i1 | 0;
  i2 = i2 | 0;
  var i3 = 0, i4 = 0, i5 = 0, i6 = 0, i7 = 0, i8 = 0, i9 = 0, i10 = 0, i11 = 0, i12 = 0, i13 = 0, i14 = 0, i15 = 0, i16 = 0, i17 = 0, i18 = 0, i19 = 0, i20 = 0, i21 = 0, i22 = 0, i23 = 0, i24 = 0, i25 = 0, i26 = 0, i27 = 0, i28 = 0, i29 = 0, i30 = 0, i31 = 0, i32 = 0, i33 = 0, i34 = 0, i35 = 0, i36 = 0, i37 = 0, i38 = 0, i39 = 0, i40 = 0, i41 = 0, i42 = 0, i43 = 0, i44 = 0, i45 = 0, i46 = 0, i47 = 0, i48 = 0, i49 = 0, i50 = 0, i51 = 0, i52 = 0, i53 = 0, i54 = 0, i55 = 0, i56 = 0, i57 = 0, i58 = 0, i59 = 0, i60 = 0, i61 = 0, i62 = 0, i63 = 0, i64 = 0, i65 = 0, i66 = 0, i67 = 0, i68 = 0, i69 = 0, i70 = 0, i71 = 0, i72 = 0, i73 = 0, i74 = 0, i75 = 0, i76 = 0, i77 = 0, i78 = 0, i79 = 0, i80 = 0, i81 = 0, i82 = 0, i83 = 0, i84 = 0, i85 = 0, i86 = 0, i87 = 0, i88 = 0, i89 = 0, i90 = 0, i91 = 0, i92 = 0, i93 = 0, i94 = 0, i95 = 0, i96 = 0, i97 = 0, i98 = 0, i99 = 0;
  i3 = HEAP32[(i1 + 28 & 16777215) >> 2] | 0;
  i4 = i1 | 0;
  i5 = HEAP32[(i4 & 16777215) >> 2] | 0;
  i6 = i1 + 4 | 0;
  i7 = i5 + (HEAP32[(i6 & 16777215) >> 2] - 6) | 0;
  i8 = i1 + 12 | 0;
  i9 = HEAP32[(i8 & 16777215) >> 2] | 0;
  i10 = i1 + 16 | 0;
  i11 = HEAP32[(i10 & 16777215) >> 2] | 0;
  i12 = i9 + (i11 - 258) | 0;
  i13 = HEAP32[(i3 + 44 & 16777215) >> 2] | 0;
  i14 = HEAP32[(i3 + 48 & 16777215) >> 2] | 0;
  i15 = HEAP32[(i3 + 52 & 16777215) >> 2] | 0;
  i16 = i3 + 56 | 0;
  i17 = i3 + 60 | 0;
  i18 = HEAP32[(i3 + 76 & 16777215) >> 2] | 0;
  i19 = HEAP32[(i3 + 80 & 16777215) >> 2] | 0;
  i20 = (1 << HEAP32[(i3 + 84 & 16777215) >> 2]) - 1 | 0;
  i21 = (1 << HEAP32[(i3 + 88 & 16777215) >> 2]) - 1 | 0;
  i22 = i9 + i11 + (i2 ^ -1) | 0;
  i2 = i3 + 7104 | 0;
  i11 = i15 - 1 | 0;
  i23 = (i14 | 0) == 0;
  i24 = HEAP32[(i3 + 40 & 16777215) >> 2] - 1 | 0;
  i25 = i24 + i14 | 0;
  i26 = i14 - 1 | 0;
  i27 = i22 - 1 | 0;
  i28 = i22 - i14 | 0;
  i29 = i5 - 1 | 0;
  i5 = i9 - 1 | 0;
  i9 = HEAP32[(i16 & 16777215) >> 2] | 0;
  i30 = HEAP32[(i17 & 16777215) >> 2] | 0;
  L1703 : while (1) {
    if (i30 >>> 0 < 15) {
      i31 = i29 + 2 | 0;
      i32 = i31;
      i33 = (HEAPU8[i29 + 1 & 16777215] << i30) + (HEAPU8[i31 & 16777215] << i30 + 8) + i9 | 0;
      i34 = i30 + 16 | 0;
    } else {
      i32 = i29;
      i33 = i9;
      i34 = i30;
    }
    i31 = i33 & i20;
    i35 = HEAP8[(i31 << 2) + i18 & 16777215] | 0;
    i36 = HEAP16[((i31 << 2) + i18 + 2 & 16777215) >> 1] | 0;
    i37 = HEAPU8[(i31 << 2) + i18 + 1 & 16777215];
    i31 = i33 >>> (i37 >>> 0);
    i38 = i34 - i37 | 0;
    i37 = i35 << 24 >> 24 == 0;
    L1708 : do {
      if (i37) {
        i39 = i36;
        i40 = i31;
        i41 = i38;
        i42 = 1267;
      } else {
        i43 = i36;
        i44 = i31;
        i45 = i38;
        i46 = i35;
        while (1) {
          i47 = i46 & 255;
          if ((i47 & 16 | 0) != 0) {
            break;
          }
          if ((i47 & 64 | 0) != 0) {
            i42 = 1315;
            break L1703;
          }
          i48 = (i44 & (1 << i47) - 1) + (i43 & 65535) | 0;
          i49 = HEAP8[(i48 << 2) + i18 & 16777215] | 0;
          i50 = HEAP16[((i48 << 2) + i18 + 2 & 16777215) >> 1] | 0;
          i51 = HEAPU8[(i48 << 2) + i18 + 1 & 16777215];
          i48 = i44 >>> (i51 >>> 0);
          i52 = i45 - i51 | 0;
          if (i49 << 24 >> 24 == 0) {
            i39 = i50;
            i40 = i48;
            i41 = i52;
            i42 = 1267;
            break L1708;
          } else {
            i43 = i50;
            i44 = i48;
            i45 = i52;
            i46 = i49;
          }
        }
        i46 = i43 & 65535;
        i49 = i47 & 15;
        if ((i49 | 0) == 0) {
          i53 = i46;
          i54 = i32;
          i55 = i44;
          i56 = i45;
        } else {
          if (i45 >>> 0 < i49 >>> 0) {
            i52 = i32 + 1 | 0;
            i57 = i52;
            i58 = (HEAPU8[i52 & 16777215] << i45) + i44 | 0;
            i59 = i45 + 8 | 0;
          } else {
            i57 = i32;
            i58 = i44;
            i59 = i45;
          }
          i53 = (i58 & (1 << i49) - 1) + i46 | 0;
          i54 = i57;
          i55 = i58 >>> (i49 >>> 0);
          i56 = i59 - i49 | 0;
        }
        if (i56 >>> 0 < 15) {
          i49 = i54 + 2 | 0;
          i60 = i49;
          i61 = (HEAPU8[i54 + 1 & 16777215] << i56) + (HEAPU8[i49 & 16777215] << i56 + 8) + i55 | 0;
          i62 = i56 + 16 | 0;
        } else {
          i60 = i54;
          i61 = i55;
          i62 = i56;
        }
        i49 = i61 & i21;
        i46 = HEAP16[((i49 << 2) + i19 + 2 & 16777215) >> 1] | 0;
        i52 = HEAPU8[(i49 << 2) + i19 + 1 & 16777215];
        i48 = i61 >>> (i52 >>> 0);
        i50 = i62 - i52 | 0;
        i52 = HEAPU8[(i49 << 2) + i19 & 16777215];
        i49 = (i52 & 16 | 0) == 0;
        L1723 : do {
          if (i49) {
            i51 = i46;
            i63 = i48;
            i64 = i50;
            i65 = i52;
            while (1) {
              if ((i65 & 64 | 0) != 0) {
                i42 = 1312;
                break L1703;
              }
              i66 = (i63 & (1 << i65) - 1) + (i51 & 65535) | 0;
              i67 = HEAP16[((i66 << 2) + i19 + 2 & 16777215) >> 1] | 0;
              i68 = HEAPU8[(i66 << 2) + i19 + 1 & 16777215];
              i69 = i63 >>> (i68 >>> 0);
              i70 = i64 - i68 | 0;
              i68 = HEAPU8[(i66 << 2) + i19 & 16777215];
              if ((i68 & 16 | 0) == 0) {
                i51 = i67;
                i63 = i69;
                i64 = i70;
                i65 = i68;
              } else {
                i71 = i67;
                i72 = i69;
                i73 = i70;
                i74 = i68;
                break L1723;
              }
            }
          } else {
            i71 = i46;
            i72 = i48;
            i73 = i50;
            i74 = i52;
          }
        } while (0);
        i52 = i71 & 65535;
        i50 = i74 & 15;
        do {
          if (i73 >>> 0 < i50 >>> 0) {
            i48 = i60 + 1 | 0;
            i46 = (HEAPU8[i48 & 16777215] << i73) + i72 | 0;
            i49 = i73 + 8 | 0;
            if (i49 >>> 0 >= i50 >>> 0) {
              i75 = i48;
              i76 = i46;
              i77 = i49;
              break;
            }
            i48 = i60 + 2 | 0;
            i75 = i48;
            i76 = (HEAPU8[i48 & 16777215] << i49) + i46 | 0;
            i77 = i73 + 16 | 0;
          } else {
            i75 = i60;
            i76 = i72;
            i77 = i73;
          }
        } while (0);
        i46 = (i76 & (1 << i50) - 1) + i52 | 0;
        i78 = i76 >>> (i50 >>> 0);
        i79 = i77 - i50 | 0;
        i49 = i5;
        i48 = i49 - i22 | 0;
        if (i46 >>> 0 <= i48 >>> 0) {
          i43 = i5 + -i46 | 0;
          i65 = i53;
          i51 = i5;
          while (1) {
            HEAP8[i51 + 1 & 16777215] = HEAP8[i43 + 1 & 16777215] | 0;
            HEAP8[i51 + 2 & 16777215] = HEAP8[i43 + 2 & 16777215] | 0;
            i68 = i43 + 3 | 0;
            i80 = i51 + 3 | 0;
            HEAP8[i80 & 16777215] = HEAP8[i68 & 16777215] | 0;
            i81 = i65 - 3 | 0;
            if (i81 >>> 0 > 2) {
              i43 = i68;
              i65 = i81;
              i51 = i80;
            } else {
              break;
            }
          }
          if ((i81 | 0) == 0) {
            i82 = i75;
            i83 = i80;
            i84 = i78;
            i85 = i79;
            break;
          }
          i65 = i51 + 4 | 0;
          HEAP8[i65 & 16777215] = HEAP8[i43 + 4 & 16777215] | 0;
          if (i81 >>> 0 <= 1) {
            i82 = i75;
            i83 = i65;
            i84 = i78;
            i85 = i79;
            break;
          }
          i65 = i51 + 5 | 0;
          HEAP8[i65 & 16777215] = HEAP8[i43 + 5 & 16777215] | 0;
          i82 = i75;
          i83 = i65;
          i84 = i78;
          i85 = i79;
          break;
        }
        i65 = i46 - i48 | 0;
        if (i65 >>> 0 > i13 >>> 0) {
          if ((HEAP32[(i2 & 16777215) >> 2] | 0) != 0) {
            i42 = 1282;
            break L1703;
          }
        }
        do {
          if (i23) {
            i50 = i15 + (i24 - i65) | 0;
            if (i65 >>> 0 >= i53 >>> 0) {
              i86 = i50;
              i87 = i53;
              i88 = i5;
              break;
            }
            i52 = i53 - i65 | 0;
            i68 = i46 - i49 | 0;
            i70 = i50;
            i50 = i65;
            i69 = i5;
            while (1) {
              i67 = i70 + 1 | 0;
              i66 = i69 + 1 | 0;
              HEAP8[i66 & 16777215] = HEAP8[i67 & 16777215] | 0;
              i89 = i50 - 1 | 0;
              if ((i89 | 0) == 0) {
                break;
              } else {
                i70 = i67;
                i50 = i89;
                i69 = i66;
              }
            }
            i86 = i5 + i27 + i68 + (1 - i46) | 0;
            i87 = i52;
            i88 = i5 + i22 + i68 | 0;
          } else {
            if (i14 >>> 0 >= i65 >>> 0) {
              i69 = i15 + (i26 - i65) | 0;
              if (i65 >>> 0 >= i53 >>> 0) {
                i86 = i69;
                i87 = i53;
                i88 = i5;
                break;
              }
              i50 = i53 - i65 | 0;
              i70 = i46 - i49 | 0;
              i66 = i69;
              i69 = i65;
              i89 = i5;
              while (1) {
                i67 = i66 + 1 | 0;
                i90 = i89 + 1 | 0;
                HEAP8[i90 & 16777215] = HEAP8[i67 & 16777215] | 0;
                i91 = i69 - 1 | 0;
                if ((i91 | 0) == 0) {
                  break;
                } else {
                  i66 = i67;
                  i69 = i91;
                  i89 = i90;
                }
              }
              i86 = i5 + i27 + i70 + (1 - i46) | 0;
              i87 = i50;
              i88 = i5 + i22 + i70 | 0;
              break;
            }
            i89 = i15 + (i25 - i65) | 0;
            i69 = i65 - i14 | 0;
            if (i69 >>> 0 >= i53 >>> 0) {
              i86 = i89;
              i87 = i53;
              i88 = i5;
              break;
            }
            i66 = i53 - i69 | 0;
            i68 = i46 - i49 | 0;
            i52 = i89;
            i89 = i69;
            i69 = i5;
            while (1) {
              i90 = i52 + 1 | 0;
              i91 = i69 + 1 | 0;
              HEAP8[i91 & 16777215] = HEAP8[i90 & 16777215] | 0;
              i67 = i89 - 1 | 0;
              if ((i67 | 0) == 0) {
                break;
              } else {
                i52 = i90;
                i89 = i67;
                i69 = i91;
              }
            }
            i69 = i5 + i28 + i68 | 0;
            if (i14 >>> 0 >= i66 >>> 0) {
              i86 = i11;
              i87 = i66;
              i88 = i69;
              break;
            }
            i89 = i66 - i14 | 0;
            i52 = i11;
            i70 = i14;
            i50 = i69;
            while (1) {
              i69 = i52 + 1 | 0;
              i91 = i50 + 1 | 0;
              HEAP8[i91 & 16777215] = HEAP8[i69 & 16777215] | 0;
              i67 = i70 - 1 | 0;
              if ((i67 | 0) == 0) {
                break;
              } else {
                i52 = i69;
                i70 = i67;
                i50 = i91;
              }
            }
            i86 = i5 + i27 + i68 + (1 - i46) | 0;
            i87 = i89;
            i88 = i5 + i22 + i68 | 0;
          }
        } while (0);
        i46 = i87 >>> 0 > 2;
        L1766 : do {
          if (i46) {
            i49 = i88;
            i65 = i87;
            i48 = i86;
            while (1) {
              HEAP8[i49 + 1 & 16777215] = HEAP8[i48 + 1 & 16777215] | 0;
              HEAP8[i49 + 2 & 16777215] = HEAP8[i48 + 2 & 16777215] | 0;
              i43 = i48 + 3 | 0;
              i51 = i49 + 3 | 0;
              HEAP8[i51 & 16777215] = HEAP8[i43 & 16777215] | 0;
              i50 = i65 - 3 | 0;
              if (i50 >>> 0 > 2) {
                i49 = i51;
                i65 = i50;
                i48 = i43;
              } else {
                i92 = i51;
                i93 = i50;
                i94 = i43;
                break L1766;
              }
            }
          } else {
            i92 = i88;
            i93 = i87;
            i94 = i86;
          }
        } while (0);
        if ((i93 | 0) == 0) {
          i82 = i75;
          i83 = i92;
          i84 = i78;
          i85 = i79;
          break;
        }
        i46 = i92 + 1 | 0;
        HEAP8[i46 & 16777215] = HEAP8[i94 + 1 & 16777215] | 0;
        if (i93 >>> 0 <= 1) {
          i82 = i75;
          i83 = i46;
          i84 = i78;
          i85 = i79;
          break;
        }
        i46 = i92 + 2 | 0;
        HEAP8[i46 & 16777215] = HEAP8[i94 + 2 & 16777215] | 0;
        i82 = i75;
        i83 = i46;
        i84 = i78;
        i85 = i79;
        break;
      }
    } while (0);
    if (i42 == 1267) {
      i42 = 0;
      i35 = i5 + 1 | 0;
      HEAP8[i35 & 16777215] = i39 & 255;
      i82 = i32;
      i83 = i35;
      i84 = i40;
      i85 = i41;
    }
    if (i82 >>> 0 < i7 >>> 0 & i83 >>> 0 < i12 >>> 0) {
      i29 = i82;
      i5 = i83;
      i9 = i84;
      i30 = i85;
    } else {
      i95 = i82;
      i96 = i83;
      i97 = i84;
      i98 = i85;
      break;
    }
  }
  do {
    if (i42 == 1282) {
      HEAP32[(i1 + 24 & 16777215) >> 2] = 5255764 | 0;
      HEAP32[(i3 & 16777215) >> 2] = 29;
      i95 = i75;
      i96 = i5;
      i97 = i78;
      i98 = i79;
    } else if (i42 == 1315) {
      if ((i47 & 32 | 0) == 0) {
        HEAP32[(i1 + 24 & 16777215) >> 2] = 5256016 | 0;
        HEAP32[(i3 & 16777215) >> 2] = 29;
        i95 = i32;
        i96 = i5;
        i97 = i44;
        i98 = i45;
        break;
      } else {
        HEAP32[(i3 & 16777215) >> 2] = 11;
        i95 = i32;
        i96 = i5;
        i97 = i44;
        i98 = i45;
        break;
      }
    } else if (i42 == 1312) {
      HEAP32[(i1 + 24 & 16777215) >> 2] = 5256120 | 0;
      HEAP32[(i3 & 16777215) >> 2] = 29;
      i95 = i60;
      i96 = i5;
      i97 = i63;
      i98 = i64;
    }
  } while (0);
  i64 = i98 >>> 3;
  i63 = i95 + -i64 | 0;
  i5 = i98 - (i64 << 3) | 0;
  i98 = (1 << i5) - 1 & i97;
  HEAP32[(i4 & 16777215) >> 2] = i95 + (1 - i64) | 0;
  HEAP32[(i8 & 16777215) >> 2] = i96 + 1 | 0;
  if (i63 >>> 0 < i7 >>> 0) {
    i99 = i7 - i63 | 0;
  } else {
    i99 = i7 - i63 | 0;
  }
  HEAP32[(i6 & 16777215) >> 2] = i99 + 5 | 0;
  if (i96 >>> 0 < i12 >>> 0) {
    i99 = i12 - i96 | 0;
    i6 = i99 + 257 | 0;
    HEAP32[(i10 & 16777215) >> 2] = i6;
    HEAP32[(i16 & 16777215) >> 2] = i98;
    HEAP32[(i17 & 16777215) >> 2] = i5;
    return;
  } else {
    i99 = i12 - i96 | 0;
    i6 = i99 + 257 | 0;
    HEAP32[(i10 & 16777215) >> 2] = i6;
    HEAP32[(i16 & 16777215) >> 2] = i98;
    HEAP32[(i17 & 16777215) >> 2] = i5;
    return;
  }
}
function _malloc(i1) {
  i1 = i1 | 0;
  var i2 = 0, i3 = 0, i4 = 0, i5 = 0, i6 = 0, i7 = 0, i8 = 0, i9 = 0, i10 = 0, i11 = 0, i12 = 0, i13 = 0, i14 = 0, i15 = 0, i16 = 0, i17 = 0, i18 = 0, i19 = 0;
  do {
    if (i1 >>> 0 < 245) {
      if (i1 >>> 0 < 11) {
        i2 = 16;
      } else {
        i2 = i1 + 11 & -8;
      }
      i3 = i2 >>> 3;
      i4 = HEAP32[(5256664 & 16777215) >> 2] | 0;
      i5 = i4 >>> (i3 >>> 0);
      if ((i5 & 3 | 0) != 0) {
        i6 = (i5 & 1 ^ 1) + i3 | 0;
        i7 = i6 << 1;
        i8 = (i7 << 2) + 5256704 | 0;
        i9 = (i7 + 2 << 2) + 5256704 | 0;
        i7 = HEAP32[(i9 & 16777215) >> 2] | 0;
        i10 = i7 + 8 | 0;
        i11 = HEAP32[(i10 & 16777215) >> 2] | 0;
        do {
          if ((i8 | 0) == (i11 | 0)) {
            HEAP32[(5256664 & 16777215) >> 2] = i4 & (1 << i6 ^ -1);
          } else {
            if (i11 >>> 0 < (HEAP32[(5256680 & 16777215) >> 2] | 0) >>> 0) {
              +_abort();
            } else {
              HEAP32[(i9 & 16777215) >> 2] = i11;
              HEAP32[(i11 + 12 & 16777215) >> 2] = i8;
              break;
            }
          }
        } while (0);
        i8 = i6 << 3;
        HEAP32[(i7 + 4 & 16777215) >> 2] = i8 | 3;
        i11 = i7 + (i8 | 4) | 0;
        HEAP32[(i11 & 16777215) >> 2] = HEAP32[(i11 & 16777215) >> 2] | 1;
        i12 = i10;
        return i12 | 0;
      }
      if (i2 >>> 0 <= (HEAP32[(5256672 & 16777215) >> 2] | 0) >>> 0) {
        i13 = i2;
        break;
      }
      if ((i5 | 0) == 0) {
        if ((HEAP32[(5256668 & 16777215) >> 2] | 0) == 0) {
          i13 = i2;
          break;
        }
        i11 = _tmalloc_small(i2);
        if ((i11 | 0) == 0) {
          i13 = i2;
          break;
        } else {
          i12 = i11;
        }
        return i12 | 0;
      }
      i11 = 2 << i3;
      i8 = i5 << i3 & (i11 | -i11);
      i11 = (i8 & -i8) - 1 | 0;
      i8 = i11 >>> 12 & 16;
      i9 = i11 >>> (i8 >>> 0);
      i11 = i9 >>> 5 & 8;
      i14 = i9 >>> (i11 >>> 0);
      i9 = i14 >>> 2 & 4;
      i15 = i14 >>> (i9 >>> 0);
      i14 = i15 >>> 1 & 2;
      i16 = i15 >>> (i14 >>> 0);
      i15 = i16 >>> 1 & 1;
      i17 = (i11 | i8 | i9 | i14 | i15) + (i16 >>> (i15 >>> 0)) | 0;
      i15 = i17 << 1;
      i16 = (i15 << 2) + 5256704 | 0;
      i14 = (i15 + 2 << 2) + 5256704 | 0;
      i15 = HEAP32[(i14 & 16777215) >> 2] | 0;
      i9 = i15 + 8 | 0;
      i8 = HEAP32[(i9 & 16777215) >> 2] | 0;
      do {
        if ((i16 | 0) == (i8 | 0)) {
          HEAP32[(5256664 & 16777215) >> 2] = i4 & (1 << i17 ^ -1);
        } else {
          if (i8 >>> 0 < (HEAP32[(5256680 & 16777215) >> 2] | 0) >>> 0) {
            +_abort();
          } else {
            HEAP32[(i14 & 16777215) >> 2] = i8;
            HEAP32[(i8 + 12 & 16777215) >> 2] = i16;
            break;
          }
        }
      } while (0);
      i16 = i17 << 3;
      i8 = i16 - i2 | 0;
      HEAP32[(i15 + 4 & 16777215) >> 2] = i2 | 3;
      i14 = i15;
      i4 = i14 + i2 | 0;
      HEAP32[(i14 + (i2 | 4) & 16777215) >> 2] = i8 | 1;
      HEAP32[(i14 + i16 & 16777215) >> 2] = i8;
      i16 = HEAP32[(5256672 & 16777215) >> 2] | 0;
      if ((i16 | 0) != 0) {
        i14 = HEAP32[(5256684 & 16777215) >> 2] | 0;
        i3 = i16 >>> 3;
        i16 = i3 << 1;
        i5 = (i16 << 2) + 5256704 | 0;
        i10 = HEAP32[(5256664 & 16777215) >> 2] | 0;
        i7 = 1 << i3;
        do {
          if ((i10 & i7 | 0) == 0) {
            HEAP32[(5256664 & 16777215) >> 2] = i10 | i7;
            i18 = i5;
            i19 = (i16 + 2 << 2) + 5256704 | 0;
          } else {
            i3 = (i16 + 2 << 2) + 5256704 | 0;
            i6 = HEAP32[(i3 & 16777215) >> 2] | 0;
            if (i6 >>> 0 >= (HEAP32[(5256680 & 16777215) >> 2] | 0) >>> 0) {
              i18 = i6;
              i19 = i3;
              break;
            }
            +_abort();
          }
        } while (0);
        HEAP32[(i19 & 16777215) >> 2] = i14;
        HEAP32[(i18 + 12 & 16777215) >> 2] = i14;
        HEAP32[(i14 + 8 & 16777215) >> 2] = i18;
        HEAP32[(i14 + 12 & 16777215) >> 2] = i5;
      }
      HEAP32[(5256672 & 16777215) >> 2] = i8;
      HEAP32[(5256684 & 16777215) >> 2] = i4;
      i12 = i9;
      return i12 | 0;
    } else {
      if (i1 >>> 0 > 4294967231) {
        i13 = -1;
        break;
      }
      i16 = i1 + 11 & -8;
      if ((HEAP32[(5256668 & 16777215) >> 2] | 0) == 0) {
        i13 = i16;
        break;
      }
      i7 = _tmalloc_large(i16);
      if ((i7 | 0) == 0) {
        i13 = i16;
        break;
      } else {
        i12 = i7;
      }
      return i12 | 0;
    }
  } while (0);
  i1 = HEAP32[(5256672 & 16777215) >> 2] | 0;
  if (i13 >>> 0 > i1 >>> 0) {
    i18 = HEAP32[(5256676 & 16777215) >> 2] | 0;
    if (i13 >>> 0 < i18 >>> 0) {
      i19 = i18 - i13 | 0;
      HEAP32[(5256676 & 16777215) >> 2] = i19;
      i18 = HEAP32[(5256688 & 16777215) >> 2] | 0;
      i2 = i18;
      HEAP32[(5256688 & 16777215) >> 2] = i2 + i13 | 0;
      HEAP32[(i13 + (i2 + 4) & 16777215) >> 2] = i19 | 1;
      HEAP32[(i18 + 4 & 16777215) >> 2] = i13 | 3;
      i12 = i18 + 8 | 0;
      return i12 | 0;
    } else {
      i12 = _sys_alloc(i13);
      return i12 | 0;
    }
  } else {
    i18 = i1 - i13 | 0;
    i19 = HEAP32[(5256684 & 16777215) >> 2] | 0;
    if (i18 >>> 0 > 15) {
      i2 = i19;
      HEAP32[(5256684 & 16777215) >> 2] = i2 + i13 | 0;
      HEAP32[(5256672 & 16777215) >> 2] = i18;
      HEAP32[(i13 + (i2 + 4) & 16777215) >> 2] = i18 | 1;
      HEAP32[(i2 + i1 & 16777215) >> 2] = i18;
      HEAP32[(i19 + 4 & 16777215) >> 2] = i13 | 3;
    } else {
      HEAP32[(5256672 & 16777215) >> 2] = 0;
      HEAP32[(5256684 & 16777215) >> 2] = 0;
      HEAP32[(i19 + 4 & 16777215) >> 2] = i1 | 3;
      i13 = i1 + (i19 + 4) | 0;
      HEAP32[(i13 & 16777215) >> 2] = HEAP32[(i13 & 16777215) >> 2] | 1;
    }
    i12 = i19 + 8 | 0;
    return i12 | 0;
  }
}
function _tmalloc_small(i1) {
  i1 = i1 | 0;
  var i2 = 0, i3 = 0, i4 = 0, i5 = 0, i6 = 0, i7 = 0, i8 = 0, i9 = 0, i10 = 0, i11 = 0, i12 = 0, i13 = 0, i14 = 0, i15 = 0, i16 = 0, i17 = 0, i18 = 0, i19 = 0, i20 = 0;
  i2 = HEAP32[(5256668 & 16777215) >> 2] | 0;
  i3 = (i2 & -i2) - 1 | 0;
  i2 = i3 >>> 12 & 16;
  i4 = i3 >>> (i2 >>> 0);
  i3 = i4 >>> 5 & 8;
  i5 = i4 >>> (i3 >>> 0);
  i4 = i5 >>> 2 & 4;
  i6 = i5 >>> (i4 >>> 0);
  i5 = i6 >>> 1 & 2;
  i7 = i6 >>> (i5 >>> 0);
  i6 = i7 >>> 1 & 1;
  i8 = HEAP32[(((i3 | i2 | i4 | i5 | i6) + (i7 >>> (i6 >>> 0)) << 2) + 5256968 & 16777215) >> 2] | 0;
  i6 = i8;
  i7 = i8;
  i5 = (HEAP32[(i8 + 4 & 16777215) >> 2] & -8) - i1 | 0;
  while (1) {
    i8 = HEAP32[(i6 + 16 & 16777215) >> 2] | 0;
    if ((i8 | 0) == 0) {
      i4 = HEAP32[(i6 + 20 & 16777215) >> 2] | 0;
      if ((i4 | 0) == 0) {
        break;
      } else {
        i9 = i4;
      }
    } else {
      i9 = i8;
    }
    i8 = (HEAP32[(i9 + 4 & 16777215) >> 2] & -8) - i1 | 0;
    i4 = i8 >>> 0 < i5 >>> 0;
    i6 = i9;
    i7 = i4 ? i9 : i7;
    i5 = i4 ? i8 : i5;
  }
  i9 = i7;
  i6 = HEAP32[(5256680 & 16777215) >> 2] | 0;
  if (i9 >>> 0 < i6 >>> 0) {
    +_abort();
  }
  i8 = i9 + i1 | 0;
  i4 = i8;
  if (i9 >>> 0 >= i8 >>> 0) {
    +_abort();
  }
  i8 = HEAP32[(i7 + 24 & 16777215) >> 2] | 0;
  i2 = HEAP32[(i7 + 12 & 16777215) >> 2] | 0;
  i3 = (i2 | 0) == (i7 | 0);
  L1862 : do {
    if (i3) {
      i10 = i7 + 20 | 0;
      i11 = HEAP32[(i10 & 16777215) >> 2] | 0;
      do {
        if ((i11 | 0) == 0) {
          i12 = i7 + 16 | 0;
          i13 = HEAP32[(i12 & 16777215) >> 2] | 0;
          if ((i13 | 0) == 0) {
            i14 = 0;
            break L1862;
          } else {
            i15 = i13;
            i16 = i12;
            break;
          }
        } else {
          i15 = i11;
          i16 = i10;
        }
      } while (0);
      while (1) {
        i10 = i15 + 20 | 0;
        i11 = HEAP32[(i10 & 16777215) >> 2] | 0;
        if ((i11 | 0) != 0) {
          i15 = i11;
          i16 = i10;
          continue;
        }
        i10 = i15 + 16 | 0;
        i11 = HEAP32[(i10 & 16777215) >> 2] | 0;
        if ((i11 | 0) == 0) {
          break;
        } else {
          i15 = i11;
          i16 = i10;
        }
      }
      if (i16 >>> 0 < i6 >>> 0) {
        +_abort();
      } else {
        HEAP32[(i16 & 16777215) >> 2] = 0;
        i14 = i15;
        break;
      }
    } else {
      i10 = HEAP32[(i7 + 8 & 16777215) >> 2] | 0;
      if (i10 >>> 0 < i6 >>> 0) {
        +_abort();
      } else {
        HEAP32[(i10 + 12 & 16777215) >> 2] = i2;
        HEAP32[(i2 + 8 & 16777215) >> 2] = i10;
        i14 = i2;
        break;
      }
    }
  } while (0);
  i2 = (i8 | 0) == 0;
  L1878 : do {
    if (!i2) {
      i6 = i7 + 28 | 0;
      i15 = (HEAP32[(i6 & 16777215) >> 2] << 2) + 5256968 | 0;
      do {
        if ((i7 | 0) == (HEAP32[(i15 & 16777215) >> 2] | 0)) {
          HEAP32[(i15 & 16777215) >> 2] = i14;
          if ((i14 | 0) != 0) {
            break;
          }
          HEAP32[(5256668 & 16777215) >> 2] = HEAP32[(5256668 & 16777215) >> 2] & (1 << HEAP32[(i6 & 16777215) >> 2] ^ -1);
          break L1878;
        } else {
          if (i8 >>> 0 < (HEAP32[(5256680 & 16777215) >> 2] | 0) >>> 0) {
            +_abort();
          }
          i16 = i8 + 16 | 0;
          if ((HEAP32[(i16 & 16777215) >> 2] | 0) == (i7 | 0)) {
            HEAP32[(i16 & 16777215) >> 2] = i14;
          } else {
            HEAP32[(i8 + 20 & 16777215) >> 2] = i14;
          }
          if ((i14 | 0) == 0) {
            break L1878;
          }
        }
      } while (0);
      if (i14 >>> 0 < (HEAP32[(5256680 & 16777215) >> 2] | 0) >>> 0) {
        +_abort();
      }
      HEAP32[(i14 + 24 & 16777215) >> 2] = i8;
      i6 = HEAP32[(i7 + 16 & 16777215) >> 2] | 0;
      do {
        if ((i6 | 0) != 0) {
          if (i6 >>> 0 < (HEAP32[(5256680 & 16777215) >> 2] | 0) >>> 0) {
            +_abort();
          } else {
            HEAP32[(i14 + 16 & 16777215) >> 2] = i6;
            HEAP32[(i6 + 24 & 16777215) >> 2] = i14;
            break;
          }
        }
      } while (0);
      i6 = HEAP32[(i7 + 20 & 16777215) >> 2] | 0;
      if ((i6 | 0) == 0) {
        break;
      }
      if (i6 >>> 0 < (HEAP32[(5256680 & 16777215) >> 2] | 0) >>> 0) {
        +_abort();
      } else {
        HEAP32[(i14 + 20 & 16777215) >> 2] = i6;
        HEAP32[(i6 + 24 & 16777215) >> 2] = i14;
        break;
      }
    }
  } while (0);
  if (i5 >>> 0 < 16) {
    i14 = i5 + i1 | 0;
    HEAP32[(i7 + 4 & 16777215) >> 2] = i14 | 3;
    i8 = i14 + (i9 + 4) | 0;
    HEAP32[(i8 & 16777215) >> 2] = HEAP32[(i8 & 16777215) >> 2] | 1;
    i17 = i7 + 8 | 0;
    i18 = i17;
    return i18 | 0;
  }
  HEAP32[(i7 + 4 & 16777215) >> 2] = i1 | 3;
  HEAP32[(i1 + (i9 + 4) & 16777215) >> 2] = i5 | 1;
  HEAP32[(i9 + i5 + i1 & 16777215) >> 2] = i5;
  i1 = HEAP32[(5256672 & 16777215) >> 2] | 0;
  if ((i1 | 0) != 0) {
    i9 = HEAP32[(5256684 & 16777215) >> 2] | 0;
    i8 = i1 >>> 3;
    i1 = i8 << 1;
    i14 = (i1 << 2) + 5256704 | 0;
    i2 = HEAP32[(5256664 & 16777215) >> 2] | 0;
    i6 = 1 << i8;
    do {
      if ((i2 & i6 | 0) == 0) {
        HEAP32[(5256664 & 16777215) >> 2] = i2 | i6;
        i19 = i14;
        i20 = (i1 + 2 << 2) + 5256704 | 0;
      } else {
        i8 = (i1 + 2 << 2) + 5256704 | 0;
        i15 = HEAP32[(i8 & 16777215) >> 2] | 0;
        if (i15 >>> 0 >= (HEAP32[(5256680 & 16777215) >> 2] | 0) >>> 0) {
          i19 = i15;
          i20 = i8;
          break;
        }
        +_abort();
      }
    } while (0);
    HEAP32[(i20 & 16777215) >> 2] = i9;
    HEAP32[(i19 + 12 & 16777215) >> 2] = i9;
    HEAP32[(i9 + 8 & 16777215) >> 2] = i19;
    HEAP32[(i9 + 12 & 16777215) >> 2] = i14;
  }
  HEAP32[(5256672 & 16777215) >> 2] = i5;
  HEAP32[(5256684 & 16777215) >> 2] = i4;
  i17 = i7 + 8 | 0;
  i18 = i17;
  return i18 | 0;
}
function _tmalloc_large(i1) {
  i1 = i1 | 0;
  var i2 = 0, i3 = 0, i4 = 0, i5 = 0, i6 = 0, i7 = 0, i8 = 0, i9 = 0, i10 = 0, i11 = 0, i12 = 0, i13 = 0, i14 = 0, i15 = 0, i16 = 0, i17 = 0, i18 = 0, i19 = 0, i20 = 0, i21 = 0, i22 = 0, i23 = 0, i24 = 0, i25 = 0, i26 = 0, i27 = 0, i28 = 0, i29 = 0, i30 = 0, i31 = 0, i32 = 0, i33 = 0;
  i2 = -i1 | 0;
  i3 = i1 >>> 8;
  do {
    if ((i3 | 0) == 0) {
      i4 = 0;
    } else {
      if (i1 >>> 0 > 16777215) {
        i4 = 31;
        break;
      }
      i5 = (i3 + 1048320 | 0) >>> 16 & 8;
      i6 = i3 << i5;
      i7 = (i6 + 520192 | 0) >>> 16 & 4;
      i8 = i6 << i7;
      i6 = (i8 + 245760 | 0) >>> 16 & 2;
      i9 = 14 - (i7 | i5 | i6) + (i8 << i6 >>> 15) | 0;
      i4 = i1 >>> ((i9 + 7 | 0) >>> 0) & 1 | i9 << 1;
    }
  } while (0);
  i3 = HEAP32[((i4 << 2) + 5256968 & 16777215) >> 2] | 0;
  i9 = (i3 | 0) == 0;
  L1924 : do {
    if (i9) {
      i10 = 0;
      i11 = i2;
      i12 = 0;
    } else {
      if ((i4 | 0) == 31) {
        i13 = 0;
      } else {
        i13 = 25 - (i4 >>> 1) | 0;
      }
      i6 = 0;
      i8 = i2;
      i5 = i3;
      i7 = i1 << i13;
      i14 = 0;
      while (1) {
        i15 = HEAP32[(i5 + 4 & 16777215) >> 2] & -8;
        i16 = i15 - i1 | 0;
        if (i16 >>> 0 < i8 >>> 0) {
          if ((i15 | 0) == (i1 | 0)) {
            i10 = i5;
            i11 = i16;
            i12 = i5;
            break L1924;
          } else {
            i17 = i5;
            i18 = i16;
          }
        } else {
          i17 = i6;
          i18 = i8;
        }
        i16 = HEAP32[(i5 + 20 & 16777215) >> 2] | 0;
        i15 = HEAP32[((i7 >>> 31 << 2) + i5 + 16 & 16777215) >> 2] | 0;
        i19 = (i16 | 0) == 0 | (i16 | 0) == (i15 | 0) ? i14 : i16;
        if ((i15 | 0) == 0) {
          i10 = i17;
          i11 = i18;
          i12 = i19;
          break L1924;
        } else {
          i6 = i17;
          i8 = i18;
          i5 = i15;
          i7 = i7 << 1;
          i14 = i19;
        }
      }
    }
  } while (0);
  do {
    if ((i12 | 0) == 0 & (i10 | 0) == 0) {
      i18 = 2 << i4;
      i17 = HEAP32[(5256668 & 16777215) >> 2] & (i18 | -i18);
      if ((i17 | 0) == 0) {
        i20 = 0;
        return i20 | 0;
      } else {
        i18 = (i17 & -i17) - 1 | 0;
        i17 = i18 >>> 12 & 16;
        i13 = i18 >>> (i17 >>> 0);
        i18 = i13 >>> 5 & 8;
        i3 = i13 >>> (i18 >>> 0);
        i13 = i3 >>> 2 & 4;
        i2 = i3 >>> (i13 >>> 0);
        i3 = i2 >>> 1 & 2;
        i9 = i2 >>> (i3 >>> 0);
        i2 = i9 >>> 1 & 1;
        i21 = HEAP32[(((i18 | i17 | i13 | i3 | i2) + (i9 >>> (i2 >>> 0)) << 2) + 5256968 & 16777215) >> 2] | 0;
        break;
      }
    } else {
      i21 = i12;
    }
  } while (0);
  i12 = (i21 | 0) == 0;
  L1941 : do {
    if (i12) {
      i22 = i11;
      i23 = i10;
    } else {
      i4 = i21;
      i2 = i11;
      i9 = i10;
      while (1) {
        i3 = (HEAP32[(i4 + 4 & 16777215) >> 2] & -8) - i1 | 0;
        i13 = i3 >>> 0 < i2 >>> 0;
        i17 = i13 ? i3 : i2;
        i3 = i13 ? i4 : i9;
        i13 = HEAP32[(i4 + 16 & 16777215) >> 2] | 0;
        if ((i13 | 0) != 0) {
          i4 = i13;
          i2 = i17;
          i9 = i3;
          continue;
        }
        i13 = HEAP32[(i4 + 20 & 16777215) >> 2] | 0;
        if ((i13 | 0) == 0) {
          i22 = i17;
          i23 = i3;
          break L1941;
        } else {
          i4 = i13;
          i2 = i17;
          i9 = i3;
        }
      }
    }
  } while (0);
  if ((i23 | 0) == 0) {
    i20 = 0;
    return i20 | 0;
  }
  if (i22 >>> 0 >= (HEAP32[(5256672 & 16777215) >> 2] - i1 | 0) >>> 0) {
    i20 = 0;
    return i20 | 0;
  }
  i10 = i23;
  i11 = HEAP32[(5256680 & 16777215) >> 2] | 0;
  if (i10 >>> 0 < i11 >>> 0) {
    +_abort();
  }
  i21 = i10 + i1 | 0;
  i12 = i21;
  if (i10 >>> 0 >= i21 >>> 0) {
    +_abort();
  }
  i9 = HEAP32[(i23 + 24 & 16777215) >> 2] | 0;
  i2 = HEAP32[(i23 + 12 & 16777215) >> 2] | 0;
  i4 = (i2 | 0) == (i23 | 0);
  L1958 : do {
    if (i4) {
      i3 = i23 + 20 | 0;
      i17 = HEAP32[(i3 & 16777215) >> 2] | 0;
      do {
        if ((i17 | 0) == 0) {
          i13 = i23 + 16 | 0;
          i18 = HEAP32[(i13 & 16777215) >> 2] | 0;
          if ((i18 | 0) == 0) {
            i24 = 0;
            break L1958;
          } else {
            i25 = i18;
            i26 = i13;
            break;
          }
        } else {
          i25 = i17;
          i26 = i3;
        }
      } while (0);
      while (1) {
        i3 = i25 + 20 | 0;
        i17 = HEAP32[(i3 & 16777215) >> 2] | 0;
        if ((i17 | 0) != 0) {
          i25 = i17;
          i26 = i3;
          continue;
        }
        i3 = i25 + 16 | 0;
        i17 = HEAP32[(i3 & 16777215) >> 2] | 0;
        if ((i17 | 0) == 0) {
          break;
        } else {
          i25 = i17;
          i26 = i3;
        }
      }
      if (i26 >>> 0 < i11 >>> 0) {
        +_abort();
      } else {
        HEAP32[(i26 & 16777215) >> 2] = 0;
        i24 = i25;
        break;
      }
    } else {
      i3 = HEAP32[(i23 + 8 & 16777215) >> 2] | 0;
      if (i3 >>> 0 < i11 >>> 0) {
        +_abort();
      } else {
        HEAP32[(i3 + 12 & 16777215) >> 2] = i2;
        HEAP32[(i2 + 8 & 16777215) >> 2] = i3;
        i24 = i2;
        break;
      }
    }
  } while (0);
  i2 = (i9 | 0) == 0;
  L1974 : do {
    if (i2) {
      i27 = i23;
    } else {
      i11 = i23 + 28 | 0;
      i25 = (HEAP32[(i11 & 16777215) >> 2] << 2) + 5256968 | 0;
      do {
        if ((i23 | 0) == (HEAP32[(i25 & 16777215) >> 2] | 0)) {
          HEAP32[(i25 & 16777215) >> 2] = i24;
          if ((i24 | 0) != 0) {
            break;
          }
          HEAP32[(5256668 & 16777215) >> 2] = HEAP32[(5256668 & 16777215) >> 2] & (1 << HEAP32[(i11 & 16777215) >> 2] ^ -1);
          i27 = i23;
          break L1974;
        } else {
          if (i9 >>> 0 < (HEAP32[(5256680 & 16777215) >> 2] | 0) >>> 0) {
            +_abort();
          }
          i26 = i9 + 16 | 0;
          if ((HEAP32[(i26 & 16777215) >> 2] | 0) == (i23 | 0)) {
            HEAP32[(i26 & 16777215) >> 2] = i24;
          } else {
            HEAP32[(i9 + 20 & 16777215) >> 2] = i24;
          }
          if ((i24 | 0) == 0) {
            i27 = i23;
            break L1974;
          }
        }
      } while (0);
      if (i24 >>> 0 < (HEAP32[(5256680 & 16777215) >> 2] | 0) >>> 0) {
        +_abort();
      }
      HEAP32[(i24 + 24 & 16777215) >> 2] = i9;
      i11 = HEAP32[(i23 + 16 & 16777215) >> 2] | 0;
      do {
        if ((i11 | 0) != 0) {
          if (i11 >>> 0 < (HEAP32[(5256680 & 16777215) >> 2] | 0) >>> 0) {
            +_abort();
          } else {
            HEAP32[(i24 + 16 & 16777215) >> 2] = i11;
            HEAP32[(i11 + 24 & 16777215) >> 2] = i24;
            break;
          }
        }
      } while (0);
      i11 = HEAP32[(i23 + 20 & 16777215) >> 2] | 0;
      if ((i11 | 0) == 0) {
        i27 = i23;
        break;
      }
      if (i11 >>> 0 < (HEAP32[(5256680 & 16777215) >> 2] | 0) >>> 0) {
        +_abort();
      } else {
        HEAP32[(i24 + 20 & 16777215) >> 2] = i11;
        HEAP32[(i11 + 24 & 16777215) >> 2] = i24;
        i27 = i23;
        break;
      }
    }
  } while (0);
  do {
    if (i22 >>> 0 < 16) {
      i23 = i22 + i1 | 0;
      HEAP32[(i27 + 4 & 16777215) >> 2] = i23 | 3;
      i24 = i23 + (i10 + 4) | 0;
      HEAP32[(i24 & 16777215) >> 2] = HEAP32[(i24 & 16777215) >> 2] | 1;
    } else {
      HEAP32[(i27 + 4 & 16777215) >> 2] = i1 | 3;
      HEAP32[(i1 + (i10 + 4) & 16777215) >> 2] = i22 | 1;
      HEAP32[(i10 + i22 + i1 & 16777215) >> 2] = i22;
      i24 = i22 >>> 3;
      if (i22 >>> 0 < 256) {
        i23 = i24 << 1;
        i9 = (i23 << 2) + 5256704 | 0;
        i2 = HEAP32[(5256664 & 16777215) >> 2] | 0;
        i11 = 1 << i24;
        do {
          if ((i2 & i11 | 0) == 0) {
            HEAP32[(5256664 & 16777215) >> 2] = i2 | i11;
            i28 = i9;
            i29 = (i23 + 2 << 2) + 5256704 | 0;
          } else {
            i24 = (i23 + 2 << 2) + 5256704 | 0;
            i25 = HEAP32[(i24 & 16777215) >> 2] | 0;
            if (i25 >>> 0 >= (HEAP32[(5256680 & 16777215) >> 2] | 0) >>> 0) {
              i28 = i25;
              i29 = i24;
              break;
            }
            +_abort();
          }
        } while (0);
        HEAP32[(i29 & 16777215) >> 2] = i12;
        HEAP32[(i28 + 12 & 16777215) >> 2] = i12;
        HEAP32[(i1 + (i10 + 8) & 16777215) >> 2] = i28;
        HEAP32[(i1 + (i10 + 12) & 16777215) >> 2] = i9;
        break;
      }
      i23 = i21;
      i11 = i22 >>> 8;
      do {
        if ((i11 | 0) == 0) {
          i30 = 0;
        } else {
          if (i22 >>> 0 > 16777215) {
            i30 = 31;
            break;
          }
          i2 = (i11 + 1048320 | 0) >>> 16 & 8;
          i24 = i11 << i2;
          i25 = (i24 + 520192 | 0) >>> 16 & 4;
          i26 = i24 << i25;
          i24 = (i26 + 245760 | 0) >>> 16 & 2;
          i4 = 14 - (i25 | i2 | i24) + (i26 << i24 >>> 15) | 0;
          i30 = i22 >>> ((i4 + 7 | 0) >>> 0) & 1 | i4 << 1;
        }
      } while (0);
      i11 = (i30 << 2) + 5256968 | 0;
      HEAP32[(i1 + (i10 + 28) & 16777215) >> 2] = i30;
      HEAP32[(i1 + (i10 + 20) & 16777215) >> 2] = 0;
      HEAP32[(i1 + (i10 + 16) & 16777215) >> 2] = 0;
      i9 = HEAP32[(5256668 & 16777215) >> 2] | 0;
      i4 = 1 << i30;
      if ((i9 & i4 | 0) == 0) {
        HEAP32[(5256668 & 16777215) >> 2] = i9 | i4;
        HEAP32[(i11 & 16777215) >> 2] = i23;
        HEAP32[(i1 + (i10 + 24) & 16777215) >> 2] = i11;
        HEAP32[(i1 + (i10 + 12) & 16777215) >> 2] = i23;
        HEAP32[(i1 + (i10 + 8) & 16777215) >> 2] = i23;
        break;
      }
      if ((i30 | 0) == 31) {
        i31 = 0;
      } else {
        i31 = 25 - (i30 >>> 1) | 0;
      }
      i4 = i22 << i31;
      i9 = HEAP32[(i11 & 16777215) >> 2] | 0;
      while (1) {
        if ((HEAP32[(i9 + 4 & 16777215) >> 2] & -8 | 0) == (i22 | 0)) {
          break;
        }
        i32 = (i4 >>> 31 << 2) + i9 + 16 | 0;
        i11 = HEAP32[(i32 & 16777215) >> 2] | 0;
        if ((i11 | 0) == 0) {
          i33 = 1494;
          break;
        } else {
          i4 = i4 << 1;
          i9 = i11;
        }
      }
      if (i33 == 1494) {
        if (i32 >>> 0 < (HEAP32[(5256680 & 16777215) >> 2] | 0) >>> 0) {
          +_abort();
        } else {
          HEAP32[(i32 & 16777215) >> 2] = i23;
          HEAP32[(i1 + (i10 + 24) & 16777215) >> 2] = i9;
          HEAP32[(i1 + (i10 + 12) & 16777215) >> 2] = i23;
          HEAP32[(i1 + (i10 + 8) & 16777215) >> 2] = i23;
          break;
        }
      }
      i4 = i9 + 8 | 0;
      i11 = HEAP32[(i4 & 16777215) >> 2] | 0;
      i24 = HEAP32[(5256680 & 16777215) >> 2] | 0;
      if (i9 >>> 0 < i24 >>> 0) {
        +_abort();
      }
      if (i11 >>> 0 < i24 >>> 0) {
        +_abort();
      } else {
        HEAP32[(i11 + 12 & 16777215) >> 2] = i23;
        HEAP32[(i4 & 16777215) >> 2] = i23;
        HEAP32[(i1 + (i10 + 8) & 16777215) >> 2] = i11;
        HEAP32[(i1 + (i10 + 12) & 16777215) >> 2] = i9;
        HEAP32[(i1 + (i10 + 24) & 16777215) >> 2] = 0;
        break;
      }
    }
  } while (0);
  i20 = i27 + 8 | 0;
  return i20 | 0;
}
function _sys_alloc(i1) {
  i1 = i1 | 0;
  var i2 = 0, i3 = 0, i4 = 0, i5 = 0, i6 = 0, i7 = 0, i8 = 0, i9 = 0, i10 = 0, i11 = 0, i12 = 0, i13 = 0, i14 = 0, i15 = 0, i16 = 0, i17 = 0, i18 = 0, i19 = 0, i20 = 0, i21 = 0, i22 = 0, i23 = 0;
  if ((HEAP32[(5244212 & 16777215) >> 2] | 0) == 0) {
    _init_mparams();
  }
  i2 = (HEAP32[(5257104 & 16777215) >> 2] & 4 | 0) == 0;
  L2044 : do {
    if (i2) {
      i3 = HEAP32[(5256688 & 16777215) >> 2] | 0;
      do {
        if ((i3 | 0) == 0) {
          i4 = 1517;
        } else {
          i5 = _segment_holding(i3);
          if ((i5 | 0) == 0) {
            i4 = 1517;
            break;
          }
          i6 = HEAP32[(5244220 & 16777215) >> 2] | 0;
          i7 = i1 + 47 - HEAP32[(5256676 & 16777215) >> 2] + i6 & -i6;
          if (i7 >>> 0 >= 2147483647) {
            i8 = 0;
            break;
          }
          i6 = _sbrk(i7 | 0) | 0;
          i9 = (i6 | 0) == (HEAP32[(i5 & 16777215) >> 2] + HEAP32[(i5 + 4 & 16777215) >> 2] | 0);
          i10 = i9 ? i6 : -1;
          i11 = i9 ? i7 : 0;
          i12 = i6;
          i13 = i7;
          i4 = 1524;
          break;
        }
      } while (0);
      do {
        if (i4 == 1517) {
          i3 = _sbrk(0 | 0) | 0;
          if ((i3 | 0) == -1) {
            i8 = 0;
            break;
          }
          i7 = HEAP32[(5244220 & 16777215) >> 2] | 0;
          i6 = i7 + (i1 + 47) & -i7;
          i7 = i3;
          i9 = HEAP32[(5244216 & 16777215) >> 2] | 0;
          i5 = i9 - 1 | 0;
          if ((i5 & i7 | 0) == 0) {
            i14 = i6;
          } else {
            i14 = i6 - i7 + (i5 + i7 & -i9) | 0;
          }
          if (i14 >>> 0 >= 2147483647) {
            i8 = 0;
            break;
          }
          i9 = _sbrk(i14 | 0) | 0;
          i7 = (i9 | 0) == (i3 | 0);
          i10 = i7 ? i3 : -1;
          i11 = i7 ? i14 : 0;
          i12 = i9;
          i13 = i14;
          i4 = 1524;
          break;
        }
      } while (0);
      L2057 : do {
        if (i4 == 1524) {
          i9 = -i13 | 0;
          if ((i10 | 0) != -1) {
            i15 = i11;
            i16 = i10;
            i4 = 1537;
            break L2044;
          }
          do {
            if ((i12 | 0) != -1 & i13 >>> 0 < 2147483647) {
              if (i13 >>> 0 >= (i1 + 48 | 0) >>> 0) {
                i17 = i13;
                break;
              }
              i7 = HEAP32[(5244220 & 16777215) >> 2] | 0;
              i3 = i1 + 47 - i13 + i7 & -i7;
              if (i3 >>> 0 >= 2147483647) {
                i17 = i13;
                break;
              }
              if ((_sbrk(i3) | 0) == -1) {
                _sbrk(i9 | 0) | 0;
                i8 = i11;
                break L2057;
              } else {
                i17 = i3 + i13 | 0;
                break;
              }
            } else {
              i17 = i13;
            }
          } while (0);
          if ((i12 | 0) != -1) {
            i15 = i17;
            i16 = i12;
            i4 = 1537;
            break L2044;
          }
          HEAP32[(5257104 & 16777215) >> 2] = HEAP32[(5257104 & 16777215) >> 2] | 4;
          i18 = i11;
          i4 = 1534;
          break L2044;
        }
      } while (0);
      HEAP32[(5257104 & 16777215) >> 2] = HEAP32[(5257104 & 16777215) >> 2] | 4;
      i18 = i8;
      i4 = 1534;
      break;
    } else {
      i18 = 0;
      i4 = 1534;
    }
  } while (0);
  do {
    if (i4 == 1534) {
      i8 = HEAP32[(5244220 & 16777215) >> 2] | 0;
      i11 = i8 + (i1 + 47) & -i8;
      if (i11 >>> 0 >= 2147483647) {
        break;
      }
      i8 = _sbrk(i11 | 0) | 0;
      i11 = _sbrk(0 | 0) | 0;
      if (!((i11 | 0) != -1 & (i8 | 0) != -1 & i8 >>> 0 < i11 >>> 0)) {
        break;
      }
      i12 = i11 - i8 | 0;
      i11 = i12 >>> 0 > (i1 + 40 | 0) >>> 0;
      i17 = i11 ? i8 : -1;
      if ((i17 | 0) == -1) {
        break;
      } else {
        i15 = i11 ? i12 : i18;
        i16 = i17;
        i4 = 1537;
        break;
      }
    }
  } while (0);
  do {
    if (i4 == 1537) {
      i18 = HEAP32[(5257096 & 16777215) >> 2] + i15 | 0;
      HEAP32[(5257096 & 16777215) >> 2] = i18;
      if (i18 >>> 0 > (HEAP32[(5257100 & 16777215) >> 2] | 0) >>> 0) {
        HEAP32[(5257100 & 16777215) >> 2] = i18;
      }
      i18 = HEAP32[(5256688 & 16777215) >> 2] | 0;
      i17 = (i18 | 0) == 0;
      L2079 : do {
        if (i17) {
          i12 = HEAP32[(5256680 & 16777215) >> 2] | 0;
          if ((i12 | 0) == 0 | i16 >>> 0 < i12 >>> 0) {
            HEAP32[(5256680 & 16777215) >> 2] = i16;
          }
          HEAP32[(5257108 & 16777215) >> 2] = i16;
          HEAP32[(5257112 & 16777215) >> 2] = i15;
          HEAP32[(5257120 & 16777215) >> 2] = 0;
          HEAP32[(5256700 & 16777215) >> 2] = HEAP32[(5244212 & 16777215) >> 2] | 0;
          HEAP32[(5256696 & 16777215) >> 2] = -1;
          _init_bins();
          _init_top(i16, i15 - 40 | 0);
        } else {
          i12 = 5257108 | 0;
          while (1) {
            i19 = HEAP32[(i12 & 16777215) >> 2] | 0;
            i20 = i12 + 4 | 0;
            i21 = HEAP32[(i20 & 16777215) >> 2] | 0;
            if ((i16 | 0) == (i19 + i21 | 0)) {
              i4 = 1545;
              break;
            }
            i11 = HEAP32[(i12 + 8 & 16777215) >> 2] | 0;
            if ((i11 | 0) == 0) {
              break;
            } else {
              i12 = i11;
            }
          }
          do {
            if (i4 == 1545) {
              if ((HEAP32[(i12 + 12 & 16777215) >> 2] & 8 | 0) != 0) {
                break;
              }
              i11 = i18;
              if (!(i11 >>> 0 >= i19 >>> 0 & i11 >>> 0 < i16 >>> 0)) {
                break;
              }
              HEAP32[(i20 & 16777215) >> 2] = i21 + i15 | 0;
              _init_top(HEAP32[(5256688 & 16777215) >> 2] | 0, HEAP32[(5256676 & 16777215) >> 2] + i15 | 0);
              break L2079;
            }
          } while (0);
          if (i16 >>> 0 < (HEAP32[(5256680 & 16777215) >> 2] | 0) >>> 0) {
            HEAP32[(5256680 & 16777215) >> 2] = i16;
          }
          i12 = i16 + i15 | 0;
          i11 = 5257108 | 0;
          while (1) {
            i22 = i11 | 0;
            if ((HEAP32[(i22 & 16777215) >> 2] | 0) == (i12 | 0)) {
              i4 = 1553;
              break;
            }
            i8 = HEAP32[(i11 + 8 & 16777215) >> 2] | 0;
            if ((i8 | 0) == 0) {
              break;
            } else {
              i11 = i8;
            }
          }
          do {
            if (i4 == 1553) {
              if ((HEAP32[(i11 + 12 & 16777215) >> 2] & 8 | 0) != 0) {
                break;
              }
              HEAP32[(i22 & 16777215) >> 2] = i16;
              i8 = i11 + 4 | 0;
              HEAP32[(i8 & 16777215) >> 2] = HEAP32[(i8 & 16777215) >> 2] + i15 | 0;
              i23 = _prepend_alloc(i16, i12, i1);
              return i23 | 0;
            }
          } while (0);
          _add_segment(i16, i15);
        }
      } while (0);
      i18 = HEAP32[(5256676 & 16777215) >> 2] | 0;
      if (i18 >>> 0 <= i1 >>> 0) {
        break;
      }
      i17 = i18 - i1 | 0;
      HEAP32[(5256676 & 16777215) >> 2] = i17;
      i18 = HEAP32[(5256688 & 16777215) >> 2] | 0;
      i12 = i18;
      HEAP32[(5256688 & 16777215) >> 2] = i12 + i1 | 0;
      HEAP32[(i1 + (i12 + 4) & 16777215) >> 2] = i17 | 1;
      HEAP32[(i18 + 4 & 16777215) >> 2] = i1 | 3;
      i23 = i18 + 8 | 0;
      return i23 | 0;
    }
  } while (0);
  HEAP32[(___errno() & 16777215) >> 2] = 12;
  i23 = 0;
  return i23 | 0;
}
function _release_unused_segments() {
  var i1 = 0, i2 = 0;
  i1 = 5257116 | 0;
  while (1) {
    i2 = HEAP32[(i1 & 16777215) >> 2] | 0;
    if ((i2 | 0) == 0) {
      break;
    } else {
      i1 = i2 + 8 | 0;
    }
  }
  HEAP32[(5256696 & 16777215) >> 2] = -1;
  return;
}
function _sys_trim() {
  var i1 = 0, i2 = 0, i3 = 0, i4 = 0, i5 = 0, i6 = 0, i7 = 0;
  if ((HEAP32[(5244212 & 16777215) >> 2] | 0) == 0) {
    _init_mparams();
  }
  i1 = HEAP32[(5256688 & 16777215) >> 2] | 0;
  if ((i1 | 0) == 0) {
    return;
  }
  i2 = HEAP32[(5256676 & 16777215) >> 2] | 0;
  do {
    if (i2 >>> 0 > 40) {
      i3 = HEAP32[(5244220 & 16777215) >> 2] | 0;
      i4 = ~~(+((((i2 - 41 + i3 | 0) >>> 0) / (i3 >>> 0) >>> 0) - 1 | 0) * +i3);
      i5 = _segment_holding(i1);
      if ((HEAP32[(i5 + 12 & 16777215) >> 2] & 8 | 0) != 0) {
        break;
      }
      i6 = _sbrk(0 | 0) | 0;
      i7 = i5 + 4 | 0;
      if ((i6 | 0) != (HEAP32[(i5 & 16777215) >> 2] + HEAP32[(i7 & 16777215) >> 2] | 0)) {
        break;
      }
      i5 = _sbrk(-(i4 >>> 0 > 2147483646 ? -2147483648 - i3 | 0 : i4) | 0) | 0;
      i4 = _sbrk(0 | 0) | 0;
      if (!((i5 | 0) != -1 & i4 >>> 0 < i6 >>> 0)) {
        break;
      }
      i5 = i6 - i4 | 0;
      if ((i6 | 0) == (i4 | 0)) {
        break;
      }
      HEAP32[(i7 & 16777215) >> 2] = HEAP32[(i7 & 16777215) >> 2] - i5 | 0;
      HEAP32[(5257096 & 16777215) >> 2] = HEAP32[(5257096 & 16777215) >> 2] - i5 | 0;
      _init_top(HEAP32[(5256688 & 16777215) >> 2] | 0, HEAP32[(5256676 & 16777215) >> 2] - i5 | 0);
      return;
    }
  } while (0);
  if ((HEAP32[(5256676 & 16777215) >> 2] | 0) >>> 0 <= (HEAP32[(5256692 & 16777215) >> 2] | 0) >>> 0) {
    return;
  }
  HEAP32[(5256692 & 16777215) >> 2] = -1;
  return;
}
function _free(i1) {
  i1 = i1 | 0;
  var i2 = 0, i3 = 0, i4 = 0, i5 = 0, i6 = 0, i7 = 0, i8 = 0, i9 = 0, i10 = 0, i11 = 0, i12 = 0, i13 = 0, i14 = 0, i15 = 0, i16 = 0, i17 = 0, i18 = 0, i19 = 0, i20 = 0, i21 = 0, i22 = 0, i23 = 0, i24 = 0, i25 = 0, i26 = 0, i27 = 0, i28 = 0, i29 = 0, i30 = 0, i31 = 0, i32 = 0, i33 = 0, i34 = 0, i35 = 0;
  if ((i1 | 0) == 0) {
    return;
  }
  i2 = i1 - 8 | 0;
  i3 = i2;
  i4 = HEAP32[(5256680 & 16777215) >> 2] | 0;
  if (i2 >>> 0 < i4 >>> 0) {
    +_abort();
  }
  i5 = HEAP32[(i1 - 4 & 16777215) >> 2] | 0;
  i6 = i5 & 3;
  if ((i6 | 0) == 1) {
    +_abort();
  }
  i7 = i5 & -8;
  i8 = i1 + (i7 - 8) | 0;
  i9 = i8;
  i10 = (i5 & 1 | 0) == 0;
  L2141 : do {
    if (i10) {
      i5 = HEAP32[(i2 & 16777215) >> 2] | 0;
      if ((i6 | 0) == 0) {
        return;
      }
      i11 = -8 - i5 | 0;
      i12 = i1 + i11 | 0;
      i13 = i12;
      i14 = i5 + i7 | 0;
      if (i12 >>> 0 < i4 >>> 0) {
        +_abort();
      }
      if ((i13 | 0) == (HEAP32[(5256684 & 16777215) >> 2] | 0)) {
        i15 = i1 + (i7 - 4) | 0;
        if ((HEAP32[(i15 & 16777215) >> 2] & 3 | 0) != 3) {
          i16 = i13;
          i17 = i14;
          break;
        }
        HEAP32[(5256672 & 16777215) >> 2] = i14;
        HEAP32[(i15 & 16777215) >> 2] = HEAP32[(i15 & 16777215) >> 2] & -2;
        HEAP32[(i11 + (i1 + 4) & 16777215) >> 2] = i14 | 1;
        HEAP32[(i8 & 16777215) >> 2] = i14;
        return;
      }
      i15 = i5 >>> 3;
      if (i5 >>> 0 < 256) {
        i5 = HEAP32[(i11 + (i1 + 8) & 16777215) >> 2] | 0;
        i18 = HEAP32[(i11 + (i1 + 12) & 16777215) >> 2] | 0;
        if ((i5 | 0) == (i18 | 0)) {
          HEAP32[(5256664 & 16777215) >> 2] = HEAP32[(5256664 & 16777215) >> 2] & (1 << i15 ^ -1);
          i16 = i13;
          i17 = i14;
          break;
        }
        i19 = (i15 << 3) + 5256704 | 0;
        if ((i5 | 0) != (i19 | 0) & i5 >>> 0 < i4 >>> 0) {
          +_abort();
        }
        if ((i18 | 0) == (i19 | 0) | i18 >>> 0 >= i4 >>> 0) {
          HEAP32[(i5 + 12 & 16777215) >> 2] = i18;
          HEAP32[(i18 + 8 & 16777215) >> 2] = i5;
          i16 = i13;
          i17 = i14;
          break;
        } else {
          +_abort();
        }
      }
      i5 = i12;
      i12 = HEAP32[(i11 + (i1 + 24) & 16777215) >> 2] | 0;
      i18 = HEAP32[(i11 + (i1 + 12) & 16777215) >> 2] | 0;
      i19 = (i18 | 0) == (i5 | 0);
      L2166 : do {
        if (i19) {
          i15 = i11 + (i1 + 20) | 0;
          i20 = HEAP32[(i15 & 16777215) >> 2] | 0;
          do {
            if ((i20 | 0) == 0) {
              i21 = i11 + (i1 + 16) | 0;
              i22 = HEAP32[(i21 & 16777215) >> 2] | 0;
              if ((i22 | 0) == 0) {
                i23 = 0;
                break L2166;
              } else {
                i24 = i22;
                i25 = i21;
                break;
              }
            } else {
              i24 = i20;
              i25 = i15;
            }
          } while (0);
          while (1) {
            i15 = i24 + 20 | 0;
            i20 = HEAP32[(i15 & 16777215) >> 2] | 0;
            if ((i20 | 0) != 0) {
              i24 = i20;
              i25 = i15;
              continue;
            }
            i15 = i24 + 16 | 0;
            i20 = HEAP32[(i15 & 16777215) >> 2] | 0;
            if ((i20 | 0) == 0) {
              break;
            } else {
              i24 = i20;
              i25 = i15;
            }
          }
          if (i25 >>> 0 < i4 >>> 0) {
            +_abort();
          } else {
            HEAP32[(i25 & 16777215) >> 2] = 0;
            i23 = i24;
            break;
          }
        } else {
          i15 = HEAP32[(i11 + (i1 + 8) & 16777215) >> 2] | 0;
          if (i15 >>> 0 < i4 >>> 0) {
            +_abort();
          } else {
            HEAP32[(i15 + 12 & 16777215) >> 2] = i18;
            HEAP32[(i18 + 8 & 16777215) >> 2] = i15;
            i23 = i18;
            break;
          }
        }
      } while (0);
      if ((i12 | 0) == 0) {
        i16 = i13;
        i17 = i14;
        break;
      }
      i18 = i11 + (i1 + 28) | 0;
      i19 = (HEAP32[(i18 & 16777215) >> 2] << 2) + 5256968 | 0;
      do {
        if ((i5 | 0) == (HEAP32[(i19 & 16777215) >> 2] | 0)) {
          HEAP32[(i19 & 16777215) >> 2] = i23;
          if ((i23 | 0) != 0) {
            break;
          }
          HEAP32[(5256668 & 16777215) >> 2] = HEAP32[(5256668 & 16777215) >> 2] & (1 << HEAP32[(i18 & 16777215) >> 2] ^ -1);
          i16 = i13;
          i17 = i14;
          break L2141;
        } else {
          if (i12 >>> 0 < (HEAP32[(5256680 & 16777215) >> 2] | 0) >>> 0) {
            +_abort();
          }
          i15 = i12 + 16 | 0;
          if ((HEAP32[(i15 & 16777215) >> 2] | 0) == (i5 | 0)) {
            HEAP32[(i15 & 16777215) >> 2] = i23;
          } else {
            HEAP32[(i12 + 20 & 16777215) >> 2] = i23;
          }
          if ((i23 | 0) == 0) {
            i16 = i13;
            i17 = i14;
            break L2141;
          }
        }
      } while (0);
      if (i23 >>> 0 < (HEAP32[(5256680 & 16777215) >> 2] | 0) >>> 0) {
        +_abort();
      }
      HEAP32[(i23 + 24 & 16777215) >> 2] = i12;
      i5 = HEAP32[(i11 + (i1 + 16) & 16777215) >> 2] | 0;
      do {
        if ((i5 | 0) != 0) {
          if (i5 >>> 0 < (HEAP32[(5256680 & 16777215) >> 2] | 0) >>> 0) {
            +_abort();
          } else {
            HEAP32[(i23 + 16 & 16777215) >> 2] = i5;
            HEAP32[(i5 + 24 & 16777215) >> 2] = i23;
            break;
          }
        }
      } while (0);
      i5 = HEAP32[(i11 + (i1 + 20) & 16777215) >> 2] | 0;
      if ((i5 | 0) == 0) {
        i16 = i13;
        i17 = i14;
        break;
      }
      if (i5 >>> 0 < (HEAP32[(5256680 & 16777215) >> 2] | 0) >>> 0) {
        +_abort();
      } else {
        HEAP32[(i23 + 20 & 16777215) >> 2] = i5;
        HEAP32[(i5 + 24 & 16777215) >> 2] = i23;
        i16 = i13;
        i17 = i14;
        break;
      }
    } else {
      i16 = i3;
      i17 = i7;
    }
  } while (0);
  i3 = i16;
  if (i3 >>> 0 >= i8 >>> 0) {
    +_abort();
  }
  i23 = i1 + (i7 - 4) | 0;
  i4 = HEAP32[(i23 & 16777215) >> 2] | 0;
  if ((i4 & 1 | 0) == 0) {
    +_abort();
  }
  do {
    if ((i4 & 2 | 0) == 0) {
      if ((i9 | 0) == (HEAP32[(5256688 & 16777215) >> 2] | 0)) {
        i24 = HEAP32[(5256676 & 16777215) >> 2] + i17 | 0;
        HEAP32[(5256676 & 16777215) >> 2] = i24;
        HEAP32[(5256688 & 16777215) >> 2] = i16;
        HEAP32[(i16 + 4 & 16777215) >> 2] = i24 | 1;
        if ((i16 | 0) == (HEAP32[(5256684 & 16777215) >> 2] | 0)) {
          HEAP32[(5256684 & 16777215) >> 2] = 0;
          HEAP32[(5256672 & 16777215) >> 2] = 0;
        }
        if (i24 >>> 0 <= (HEAP32[(5256692 & 16777215) >> 2] | 0) >>> 0) {
          return;
        }
        _sys_trim();
        return;
      }
      if ((i9 | 0) == (HEAP32[(5256684 & 16777215) >> 2] | 0)) {
        i24 = HEAP32[(5256672 & 16777215) >> 2] + i17 | 0;
        HEAP32[(5256672 & 16777215) >> 2] = i24;
        HEAP32[(5256684 & 16777215) >> 2] = i16;
        HEAP32[(i16 + 4 & 16777215) >> 2] = i24 | 1;
        HEAP32[(i3 + i24 & 16777215) >> 2] = i24;
        return;
      }
      i24 = (i4 & -8) + i17 | 0;
      i25 = i4 >>> 3;
      i6 = i4 >>> 0 < 256;
      L2231 : do {
        if (i6) {
          i2 = HEAP32[(i1 + i7 & 16777215) >> 2] | 0;
          i10 = HEAP32[(i1 + (i7 | 4) & 16777215) >> 2] | 0;
          if ((i2 | 0) == (i10 | 0)) {
            HEAP32[(5256664 & 16777215) >> 2] = HEAP32[(5256664 & 16777215) >> 2] & (1 << i25 ^ -1);
            break;
          }
          i5 = (i25 << 3) + 5256704 | 0;
          do {
            if ((i2 | 0) != (i5 | 0)) {
              if (i2 >>> 0 >= (HEAP32[(5256680 & 16777215) >> 2] | 0) >>> 0) {
                break;
              }
              +_abort();
            }
          } while (0);
          do {
            if ((i10 | 0) != (i5 | 0)) {
              if (i10 >>> 0 >= (HEAP32[(5256680 & 16777215) >> 2] | 0) >>> 0) {
                break;
              }
              +_abort();
            }
          } while (0);
          HEAP32[(i2 + 12 & 16777215) >> 2] = i10;
          HEAP32[(i10 + 8 & 16777215) >> 2] = i2;
        } else {
          i5 = i8;
          i12 = HEAP32[(i7 + (i1 + 16) & 16777215) >> 2] | 0;
          i18 = HEAP32[(i1 + (i7 | 4) & 16777215) >> 2] | 0;
          i19 = (i18 | 0) == (i5 | 0);
          L2245 : do {
            if (i19) {
              i15 = i7 + (i1 + 12) | 0;
              i20 = HEAP32[(i15 & 16777215) >> 2] | 0;
              do {
                if ((i20 | 0) == 0) {
                  i21 = i7 + (i1 + 8) | 0;
                  i22 = HEAP32[(i21 & 16777215) >> 2] | 0;
                  if ((i22 | 0) == 0) {
                    i26 = 0;
                    break L2245;
                  } else {
                    i27 = i22;
                    i28 = i21;
                    break;
                  }
                } else {
                  i27 = i20;
                  i28 = i15;
                }
              } while (0);
              while (1) {
                i15 = i27 + 20 | 0;
                i20 = HEAP32[(i15 & 16777215) >> 2] | 0;
                if ((i20 | 0) != 0) {
                  i27 = i20;
                  i28 = i15;
                  continue;
                }
                i15 = i27 + 16 | 0;
                i20 = HEAP32[(i15 & 16777215) >> 2] | 0;
                if ((i20 | 0) == 0) {
                  break;
                } else {
                  i27 = i20;
                  i28 = i15;
                }
              }
              if (i28 >>> 0 < (HEAP32[(5256680 & 16777215) >> 2] | 0) >>> 0) {
                +_abort();
              } else {
                HEAP32[(i28 & 16777215) >> 2] = 0;
                i26 = i27;
                break;
              }
            } else {
              i15 = HEAP32[(i1 + i7 & 16777215) >> 2] | 0;
              if (i15 >>> 0 < (HEAP32[(5256680 & 16777215) >> 2] | 0) >>> 0) {
                +_abort();
              } else {
                HEAP32[(i15 + 12 & 16777215) >> 2] = i18;
                HEAP32[(i18 + 8 & 16777215) >> 2] = i15;
                i26 = i18;
                break;
              }
            }
          } while (0);
          if ((i12 | 0) == 0) {
            break;
          }
          i18 = i7 + (i1 + 20) | 0;
          i19 = (HEAP32[(i18 & 16777215) >> 2] << 2) + 5256968 | 0;
          do {
            if ((i5 | 0) == (HEAP32[(i19 & 16777215) >> 2] | 0)) {
              HEAP32[(i19 & 16777215) >> 2] = i26;
              if ((i26 | 0) != 0) {
                break;
              }
              HEAP32[(5256668 & 16777215) >> 2] = HEAP32[(5256668 & 16777215) >> 2] & (1 << HEAP32[(i18 & 16777215) >> 2] ^ -1);
              break L2231;
            } else {
              if (i12 >>> 0 < (HEAP32[(5256680 & 16777215) >> 2] | 0) >>> 0) {
                +_abort();
              }
              i2 = i12 + 16 | 0;
              if ((HEAP32[(i2 & 16777215) >> 2] | 0) == (i5 | 0)) {
                HEAP32[(i2 & 16777215) >> 2] = i26;
              } else {
                HEAP32[(i12 + 20 & 16777215) >> 2] = i26;
              }
              if ((i26 | 0) == 0) {
                break L2231;
              }
            }
          } while (0);
          if (i26 >>> 0 < (HEAP32[(5256680 & 16777215) >> 2] | 0) >>> 0) {
            +_abort();
          }
          HEAP32[(i26 + 24 & 16777215) >> 2] = i12;
          i5 = HEAP32[(i7 + (i1 + 8) & 16777215) >> 2] | 0;
          do {
            if ((i5 | 0) != 0) {
              if (i5 >>> 0 < (HEAP32[(5256680 & 16777215) >> 2] | 0) >>> 0) {
                +_abort();
              } else {
                HEAP32[(i26 + 16 & 16777215) >> 2] = i5;
                HEAP32[(i5 + 24 & 16777215) >> 2] = i26;
                break;
              }
            }
          } while (0);
          i5 = HEAP32[(i7 + (i1 + 12) & 16777215) >> 2] | 0;
          if ((i5 | 0) == 0) {
            break;
          }
          if (i5 >>> 0 < (HEAP32[(5256680 & 16777215) >> 2] | 0) >>> 0) {
            +_abort();
          } else {
            HEAP32[(i26 + 20 & 16777215) >> 2] = i5;
            HEAP32[(i5 + 24 & 16777215) >> 2] = i26;
            break;
          }
        }
      } while (0);
      HEAP32[(i16 + 4 & 16777215) >> 2] = i24 | 1;
      HEAP32[(i3 + i24 & 16777215) >> 2] = i24;
      if ((i16 | 0) != (HEAP32[(5256684 & 16777215) >> 2] | 0)) {
        i29 = i24;
        break;
      }
      HEAP32[(5256672 & 16777215) >> 2] = i24;
      return;
    } else {
      HEAP32[(i23 & 16777215) >> 2] = i4 & -2;
      HEAP32[(i16 + 4 & 16777215) >> 2] = i17 | 1;
      HEAP32[(i3 + i17 & 16777215) >> 2] = i17;
      i29 = i17;
    }
  } while (0);
  i17 = i29 >>> 3;
  if (i29 >>> 0 < 256) {
    i3 = i17 << 1;
    i4 = (i3 << 2) + 5256704 | 0;
    i23 = HEAP32[(5256664 & 16777215) >> 2] | 0;
    i26 = 1 << i17;
    do {
      if ((i23 & i26 | 0) == 0) {
        HEAP32[(5256664 & 16777215) >> 2] = i23 | i26;
        i30 = i4;
        i31 = (i3 + 2 << 2) + 5256704 | 0;
      } else {
        i17 = (i3 + 2 << 2) + 5256704 | 0;
        i1 = HEAP32[(i17 & 16777215) >> 2] | 0;
        if (i1 >>> 0 >= (HEAP32[(5256680 & 16777215) >> 2] | 0) >>> 0) {
          i30 = i1;
          i31 = i17;
          break;
        }
        +_abort();
      }
    } while (0);
    HEAP32[(i31 & 16777215) >> 2] = i16;
    HEAP32[(i30 + 12 & 16777215) >> 2] = i16;
    HEAP32[(i16 + 8 & 16777215) >> 2] = i30;
    HEAP32[(i16 + 12 & 16777215) >> 2] = i4;
    return;
  }
  i4 = i16;
  i30 = i29 >>> 8;
  do {
    if ((i30 | 0) == 0) {
      i32 = 0;
    } else {
      if (i29 >>> 0 > 16777215) {
        i32 = 31;
        break;
      }
      i31 = (i30 + 1048320 | 0) >>> 16 & 8;
      i3 = i30 << i31;
      i26 = (i3 + 520192 | 0) >>> 16 & 4;
      i23 = i3 << i26;
      i3 = (i23 + 245760 | 0) >>> 16 & 2;
      i17 = 14 - (i26 | i31 | i3) + (i23 << i3 >>> 15) | 0;
      i32 = i29 >>> ((i17 + 7 | 0) >>> 0) & 1 | i17 << 1;
    }
  } while (0);
  i30 = (i32 << 2) + 5256968 | 0;
  HEAP32[(i16 + 28 & 16777215) >> 2] = i32;
  HEAP32[(i16 + 20 & 16777215) >> 2] = 0;
  HEAP32[(i16 + 16 & 16777215) >> 2] = 0;
  i17 = HEAP32[(5256668 & 16777215) >> 2] | 0;
  i3 = 1 << i32;
  do {
    if ((i17 & i3 | 0) == 0) {
      HEAP32[(5256668 & 16777215) >> 2] = i17 | i3;
      HEAP32[(i30 & 16777215) >> 2] = i4;
      HEAP32[(i16 + 24 & 16777215) >> 2] = i30;
      HEAP32[(i16 + 12 & 16777215) >> 2] = i16;
      HEAP32[(i16 + 8 & 16777215) >> 2] = i16;
    } else {
      if ((i32 | 0) == 31) {
        i33 = 0;
      } else {
        i33 = 25 - (i32 >>> 1) | 0;
      }
      i23 = i29 << i33;
      i31 = HEAP32[(i30 & 16777215) >> 2] | 0;
      while (1) {
        if ((HEAP32[(i31 + 4 & 16777215) >> 2] & -8 | 0) == (i29 | 0)) {
          break;
        }
        i34 = (i23 >>> 31 << 2) + i31 + 16 | 0;
        i26 = HEAP32[(i34 & 16777215) >> 2] | 0;
        if ((i26 | 0) == 0) {
          i35 = 1698;
          break;
        } else {
          i23 = i23 << 1;
          i31 = i26;
        }
      }
      if (i35 == 1698) {
        if (i34 >>> 0 < (HEAP32[(5256680 & 16777215) >> 2] | 0) >>> 0) {
          +_abort();
        } else {
          HEAP32[(i34 & 16777215) >> 2] = i4;
          HEAP32[(i16 + 24 & 16777215) >> 2] = i31;
          HEAP32[(i16 + 12 & 16777215) >> 2] = i16;
          HEAP32[(i16 + 8 & 16777215) >> 2] = i16;
          break;
        }
      }
      i23 = i31 + 8 | 0;
      i24 = HEAP32[(i23 & 16777215) >> 2] | 0;
      i26 = HEAP32[(5256680 & 16777215) >> 2] | 0;
      if (i31 >>> 0 < i26 >>> 0) {
        +_abort();
      }
      if (i24 >>> 0 < i26 >>> 0) {
        +_abort();
      } else {
        HEAP32[(i24 + 12 & 16777215) >> 2] = i4;
        HEAP32[(i23 & 16777215) >> 2] = i4;
        HEAP32[(i16 + 8 & 16777215) >> 2] = i24;
        HEAP32[(i16 + 12 & 16777215) >> 2] = i31;
        HEAP32[(i16 + 24 & 16777215) >> 2] = 0;
        break;
      }
    }
  } while (0);
  i16 = HEAP32[(5256696 & 16777215) >> 2] - 1 | 0;
  HEAP32[(5256696 & 16777215) >> 2] = i16;
  if ((i16 | 0) != 0) {
    return;
  }
  _release_unused_segments();
  return;
}
function _segment_holding(i1) {
  i1 = i1 | 0;
  var i2 = 0, i3 = 0, i4 = 0, i5 = 0;
  i2 = 5257108 | 0;
  while (1) {
    i3 = HEAP32[(i2 & 16777215) >> 2] | 0;
    if (i3 >>> 0 <= i1 >>> 0) {
      if ((i3 + HEAP32[(i2 + 4 & 16777215) >> 2] | 0) >>> 0 > i1 >>> 0) {
        i4 = i2;
        i5 = 1735;
        break;
      }
    }
    i3 = HEAP32[(i2 + 8 & 16777215) >> 2] | 0;
    if ((i3 | 0) == 0) {
      i4 = 0;
      i5 = 1736;
      break;
    } else {
      i2 = i3;
    }
  }
  if (i5 == 1736) {
    return i4 | 0;
  } else if (i5 == 1735) {
    return i4 | 0;
  }
}
function _init_top(i1, i2) {
  i1 = i1 | 0;
  i2 = i2 | 0;
  var i3 = 0, i4 = 0, i5 = 0;
  i3 = i1;
  i4 = i1 + 8 | 0;
  if ((i4 & 7 | 0) == 0) {
    i5 = 0;
  } else {
    i5 = -i4 & 7;
  }
  i4 = i2 - i5 | 0;
  HEAP32[(5256688 & 16777215) >> 2] = i3 + i5 | 0;
  HEAP32[(5256676 & 16777215) >> 2] = i4;
  HEAP32[(i5 + (i3 + 4) & 16777215) >> 2] = i4 | 1;
  HEAP32[(i2 + (i3 + 4) & 16777215) >> 2] = 40;
  HEAP32[(5256692 & 16777215) >> 2] = HEAP32[(5244228 & 16777215) >> 2] | 0;
  return;
}
function _init_bins() {
  var i1 = 0, i2 = 0, i3 = 0;
  i1 = 0;
  while (1) {
    i2 = i1 << 1;
    i3 = (i2 << 2) + 5256704 | 0;
    HEAP32[((i2 + 3 << 2) + 5256704 & 16777215) >> 2] = i3;
    HEAP32[((i2 + 2 << 2) + 5256704 & 16777215) >> 2] = i3;
    i3 = i1 + 1 | 0;
    if ((i3 | 0) == 32) {
      break;
    } else {
      i1 = i3;
    }
  }
  return;
}
function _init_mparams() {
  var i1 = 0;
  if ((HEAP32[(5244212 & 16777215) >> 2] | 0) != 0) {
    return;
  }
  i1 = _sysconf(8 | 0) | 0;
  if ((i1 - 1 & i1 | 0) != 0) {
    +_abort();
  }
  HEAP32[(5244220 & 16777215) >> 2] = i1;
  HEAP32[(5244216 & 16777215) >> 2] = i1;
  HEAP32[(5244224 & 16777215) >> 2] = -1;
  HEAP32[(5244228 & 16777215) >> 2] = 2097152;
  HEAP32[(5244232 & 16777215) >> 2] = 0;
  HEAP32[(5257104 & 16777215) >> 2] = 0;
  HEAP32[(5244212 & 16777215) >> 2] = _time(0) & -16 ^ 1431655768;
  return;
}
function _prepend_alloc(i1, i2, i3) {
  i1 = i1 | 0;
  i2 = i2 | 0;
  i3 = i3 | 0;
  var i4 = 0, i5 = 0, i6 = 0, i7 = 0, i8 = 0, i9 = 0, i10 = 0, i11 = 0, i12 = 0, i13 = 0, i14 = 0, i15 = 0, i16 = 0, i17 = 0, i18 = 0, i19 = 0, i20 = 0, i21 = 0, i22 = 0, i23 = 0, i24 = 0, i25 = 0, i26 = 0, i27 = 0, i28 = 0, i29 = 0, i30 = 0, i31 = 0, i32 = 0, i33 = 0, i34 = 0, i35 = 0, i36 = 0, i37 = 0;
  i4 = i1 + 8 | 0;
  if ((i4 & 7 | 0) == 0) {
    i5 = 0;
  } else {
    i5 = -i4 & 7;
  }
  i4 = i2 + 8 | 0;
  if ((i4 & 7 | 0) == 0) {
    i6 = 0;
  } else {
    i6 = -i4 & 7;
  }
  i4 = i2 + i6 | 0;
  i7 = i4;
  i8 = i5 + i3 | 0;
  i9 = i1 + i8 | 0;
  i10 = i9;
  i11 = i4 - (i1 + i5) - i3 | 0;
  HEAP32[(i5 + (i1 + 4) & 16777215) >> 2] = i3 | 3;
  if ((i7 | 0) == (HEAP32[(5256688 & 16777215) >> 2] | 0)) {
    i3 = HEAP32[(5256676 & 16777215) >> 2] + i11 | 0;
    HEAP32[(5256676 & 16777215) >> 2] = i3;
    HEAP32[(5256688 & 16777215) >> 2] = i10;
    HEAP32[(i8 + (i1 + 4) & 16777215) >> 2] = i3 | 1;
    i12 = i5 | 8;
    i13 = i1 + i12 | 0;
    return i13 | 0;
  }
  if ((i7 | 0) == (HEAP32[(5256684 & 16777215) >> 2] | 0)) {
    i3 = HEAP32[(5256672 & 16777215) >> 2] + i11 | 0;
    HEAP32[(5256672 & 16777215) >> 2] = i3;
    HEAP32[(5256684 & 16777215) >> 2] = i10;
    HEAP32[(i8 + (i1 + 4) & 16777215) >> 2] = i3 | 1;
    HEAP32[(i1 + i3 + i8 & 16777215) >> 2] = i3;
    i12 = i5 | 8;
    i13 = i1 + i12 | 0;
    return i13 | 0;
  }
  i3 = HEAP32[(i6 + (i2 + 4) & 16777215) >> 2] | 0;
  if ((i3 & 3 | 0) == 1) {
    i14 = i3 & -8;
    i15 = i3 >>> 3;
    i16 = i3 >>> 0 < 256;
    L2373 : do {
      if (i16) {
        i3 = HEAP32[(i2 + (i6 | 8) & 16777215) >> 2] | 0;
        i17 = HEAP32[(i6 + (i2 + 12) & 16777215) >> 2] | 0;
        if ((i3 | 0) == (i17 | 0)) {
          HEAP32[(5256664 & 16777215) >> 2] = HEAP32[(5256664 & 16777215) >> 2] & (1 << i15 ^ -1);
          break;
        }
        i18 = (i15 << 3) + 5256704 | 0;
        do {
          if ((i3 | 0) != (i18 | 0)) {
            if (i3 >>> 0 >= (HEAP32[(5256680 & 16777215) >> 2] | 0) >>> 0) {
              break;
            }
            +_abort();
          }
        } while (0);
        do {
          if ((i17 | 0) != (i18 | 0)) {
            if (i17 >>> 0 >= (HEAP32[(5256680 & 16777215) >> 2] | 0) >>> 0) {
              break;
            }
            +_abort();
          }
        } while (0);
        HEAP32[(i3 + 12 & 16777215) >> 2] = i17;
        HEAP32[(i17 + 8 & 16777215) >> 2] = i3;
      } else {
        i18 = i4;
        i19 = HEAP32[(i2 + (i6 | 24) & 16777215) >> 2] | 0;
        i20 = HEAP32[(i6 + (i2 + 12) & 16777215) >> 2] | 0;
        i21 = (i20 | 0) == (i18 | 0);
        L2387 : do {
          if (i21) {
            i22 = i6 | 16;
            i23 = i22 + (i2 + 4) | 0;
            i24 = HEAP32[(i23 & 16777215) >> 2] | 0;
            do {
              if ((i24 | 0) == 0) {
                i25 = i2 + i22 | 0;
                i26 = HEAP32[(i25 & 16777215) >> 2] | 0;
                if ((i26 | 0) == 0) {
                  i27 = 0;
                  break L2387;
                } else {
                  i28 = i26;
                  i29 = i25;
                  break;
                }
              } else {
                i28 = i24;
                i29 = i23;
              }
            } while (0);
            while (1) {
              i23 = i28 + 20 | 0;
              i24 = HEAP32[(i23 & 16777215) >> 2] | 0;
              if ((i24 | 0) != 0) {
                i28 = i24;
                i29 = i23;
                continue;
              }
              i23 = i28 + 16 | 0;
              i24 = HEAP32[(i23 & 16777215) >> 2] | 0;
              if ((i24 | 0) == 0) {
                break;
              } else {
                i28 = i24;
                i29 = i23;
              }
            }
            if (i29 >>> 0 < (HEAP32[(5256680 & 16777215) >> 2] | 0) >>> 0) {
              +_abort();
            } else {
              HEAP32[(i29 & 16777215) >> 2] = 0;
              i27 = i28;
              break;
            }
          } else {
            i23 = HEAP32[(i2 + (i6 | 8) & 16777215) >> 2] | 0;
            if (i23 >>> 0 < (HEAP32[(5256680 & 16777215) >> 2] | 0) >>> 0) {
              +_abort();
            } else {
              HEAP32[(i23 + 12 & 16777215) >> 2] = i20;
              HEAP32[(i20 + 8 & 16777215) >> 2] = i23;
              i27 = i20;
              break;
            }
          }
        } while (0);
        if ((i19 | 0) == 0) {
          break;
        }
        i20 = i6 + (i2 + 28) | 0;
        i21 = (HEAP32[(i20 & 16777215) >> 2] << 2) + 5256968 | 0;
        do {
          if ((i18 | 0) == (HEAP32[(i21 & 16777215) >> 2] | 0)) {
            HEAP32[(i21 & 16777215) >> 2] = i27;
            if ((i27 | 0) != 0) {
              break;
            }
            HEAP32[(5256668 & 16777215) >> 2] = HEAP32[(5256668 & 16777215) >> 2] & (1 << HEAP32[(i20 & 16777215) >> 2] ^ -1);
            break L2373;
          } else {
            if (i19 >>> 0 < (HEAP32[(5256680 & 16777215) >> 2] | 0) >>> 0) {
              +_abort();
            }
            i3 = i19 + 16 | 0;
            if ((HEAP32[(i3 & 16777215) >> 2] | 0) == (i18 | 0)) {
              HEAP32[(i3 & 16777215) >> 2] = i27;
            } else {
              HEAP32[(i19 + 20 & 16777215) >> 2] = i27;
            }
            if ((i27 | 0) == 0) {
              break L2373;
            }
          }
        } while (0);
        if (i27 >>> 0 < (HEAP32[(5256680 & 16777215) >> 2] | 0) >>> 0) {
          +_abort();
        }
        HEAP32[(i27 + 24 & 16777215) >> 2] = i19;
        i18 = i6 | 16;
        i20 = HEAP32[(i2 + i18 & 16777215) >> 2] | 0;
        do {
          if ((i20 | 0) != 0) {
            if (i20 >>> 0 < (HEAP32[(5256680 & 16777215) >> 2] | 0) >>> 0) {
              +_abort();
            } else {
              HEAP32[(i27 + 16 & 16777215) >> 2] = i20;
              HEAP32[(i20 + 24 & 16777215) >> 2] = i27;
              break;
            }
          }
        } while (0);
        i20 = HEAP32[(i18 + (i2 + 4) & 16777215) >> 2] | 0;
        if ((i20 | 0) == 0) {
          break;
        }
        if (i20 >>> 0 < (HEAP32[(5256680 & 16777215) >> 2] | 0) >>> 0) {
          +_abort();
        } else {
          HEAP32[(i27 + 20 & 16777215) >> 2] = i20;
          HEAP32[(i20 + 24 & 16777215) >> 2] = i27;
          break;
        }
      }
    } while (0);
    i30 = i2 + (i14 | i6) | 0;
    i31 = i14 + i11 | 0;
  } else {
    i30 = i7;
    i31 = i11;
  }
  i11 = i30 + 4 | 0;
  HEAP32[(i11 & 16777215) >> 2] = HEAP32[(i11 & 16777215) >> 2] & -2;
  HEAP32[(i8 + (i1 + 4) & 16777215) >> 2] = i31 | 1;
  HEAP32[(i1 + i31 + i8 & 16777215) >> 2] = i31;
  i11 = i31 >>> 3;
  if (i31 >>> 0 < 256) {
    i30 = i11 << 1;
    i7 = (i30 << 2) + 5256704 | 0;
    i14 = HEAP32[(5256664 & 16777215) >> 2] | 0;
    i6 = 1 << i11;
    do {
      if ((i14 & i6 | 0) == 0) {
        HEAP32[(5256664 & 16777215) >> 2] = i14 | i6;
        i32 = i7;
        i33 = (i30 + 2 << 2) + 5256704 | 0;
      } else {
        i11 = (i30 + 2 << 2) + 5256704 | 0;
        i2 = HEAP32[(i11 & 16777215) >> 2] | 0;
        if (i2 >>> 0 >= (HEAP32[(5256680 & 16777215) >> 2] | 0) >>> 0) {
          i32 = i2;
          i33 = i11;
          break;
        }
        +_abort();
      }
    } while (0);
    HEAP32[(i33 & 16777215) >> 2] = i10;
    HEAP32[(i32 + 12 & 16777215) >> 2] = i10;
    HEAP32[(i8 + (i1 + 8) & 16777215) >> 2] = i32;
    HEAP32[(i8 + (i1 + 12) & 16777215) >> 2] = i7;
    i12 = i5 | 8;
    i13 = i1 + i12 | 0;
    return i13 | 0;
  }
  i7 = i9;
  i9 = i31 >>> 8;
  do {
    if ((i9 | 0) == 0) {
      i34 = 0;
    } else {
      if (i31 >>> 0 > 16777215) {
        i34 = 31;
        break;
      }
      i32 = (i9 + 1048320 | 0) >>> 16 & 8;
      i10 = i9 << i32;
      i33 = (i10 + 520192 | 0) >>> 16 & 4;
      i30 = i10 << i33;
      i10 = (i30 + 245760 | 0) >>> 16 & 2;
      i6 = 14 - (i33 | i32 | i10) + (i30 << i10 >>> 15) | 0;
      i34 = i31 >>> ((i6 + 7 | 0) >>> 0) & 1 | i6 << 1;
    }
  } while (0);
  i9 = (i34 << 2) + 5256968 | 0;
  HEAP32[(i8 + (i1 + 28) & 16777215) >> 2] = i34;
  HEAP32[(i8 + (i1 + 20) & 16777215) >> 2] = 0;
  HEAP32[(i8 + (i1 + 16) & 16777215) >> 2] = 0;
  i6 = HEAP32[(5256668 & 16777215) >> 2] | 0;
  i10 = 1 << i34;
  if ((i6 & i10 | 0) == 0) {
    HEAP32[(5256668 & 16777215) >> 2] = i6 | i10;
    HEAP32[(i9 & 16777215) >> 2] = i7;
    HEAP32[(i8 + (i1 + 24) & 16777215) >> 2] = i9;
    HEAP32[(i8 + (i1 + 12) & 16777215) >> 2] = i7;
    HEAP32[(i8 + (i1 + 8) & 16777215) >> 2] = i7;
    i12 = i5 | 8;
    i13 = i1 + i12 | 0;
    return i13 | 0;
  }
  if ((i34 | 0) == 31) {
    i35 = 0;
  } else {
    i35 = 25 - (i34 >>> 1) | 0;
  }
  i34 = i31 << i35;
  i35 = HEAP32[(i9 & 16777215) >> 2] | 0;
  while (1) {
    if ((HEAP32[(i35 + 4 & 16777215) >> 2] & -8 | 0) == (i31 | 0)) {
      break;
    }
    i36 = (i34 >>> 31 << 2) + i35 + 16 | 0;
    i9 = HEAP32[(i36 & 16777215) >> 2] | 0;
    if ((i9 | 0) == 0) {
      i37 = 1816;
      break;
    } else {
      i34 = i34 << 1;
      i35 = i9;
    }
  }
  if (i37 == 1816) {
    if (i36 >>> 0 < (HEAP32[(5256680 & 16777215) >> 2] | 0) >>> 0) {
      +_abort();
    }
    HEAP32[(i36 & 16777215) >> 2] = i7;
    HEAP32[(i8 + (i1 + 24) & 16777215) >> 2] = i35;
    HEAP32[(i8 + (i1 + 12) & 16777215) >> 2] = i7;
    HEAP32[(i8 + (i1 + 8) & 16777215) >> 2] = i7;
    i12 = i5 | 8;
    i13 = i1 + i12 | 0;
    return i13 | 0;
  }
  i36 = i35 + 8 | 0;
  i37 = HEAP32[(i36 & 16777215) >> 2] | 0;
  i34 = HEAP32[(5256680 & 16777215) >> 2] | 0;
  if (i35 >>> 0 < i34 >>> 0) {
    +_abort();
  }
  if (i37 >>> 0 < i34 >>> 0) {
    +_abort();
  }
  HEAP32[(i37 + 12 & 16777215) >> 2] = i7;
  HEAP32[(i36 & 16777215) >> 2] = i7;
  HEAP32[(i8 + (i1 + 8) & 16777215) >> 2] = i37;
  HEAP32[(i8 + (i1 + 12) & 16777215) >> 2] = i35;
  HEAP32[(i8 + (i1 + 24) & 16777215) >> 2] = 0;
  i12 = i5 | 8;
  i13 = i1 + i12 | 0;
  return i13 | 0;
}
function _add_segment(i1, i2) {
  i1 = i1 | 0;
  i2 = i2 | 0;
  var i3 = 0, i4 = 0, i5 = 0, i6 = 0, i7 = 0, i8 = 0, i9 = 0, i10 = 0, i11 = 0, i12 = 0, i13 = 0, i14 = 0, i15 = 0;
  i3 = HEAP32[(5256688 & 16777215) >> 2] | 0;
  i4 = i3;
  i5 = _segment_holding(i4);
  i6 = HEAP32[(i5 & 16777215) >> 2] | 0;
  i7 = HEAP32[(i5 + 4 & 16777215) >> 2] | 0;
  i5 = i6 + i7 | 0;
  i8 = i6 + (i7 - 39) | 0;
  if ((i8 & 7 | 0) == 0) {
    i9 = 0;
  } else {
    i9 = -i8 & 7;
  }
  i8 = i6 + (i7 - 47) + i9 | 0;
  i9 = i8 >>> 0 < (i3 + 16 | 0) >>> 0 ? i4 : i8;
  i8 = i9 + 8 | 0;
  _init_top(i1, i2 - 40 | 0);
  HEAP32[(i9 + 4 & 16777215) >> 2] = 27;
  _memcpy(i8 | 0, 5257108 | 0, 16 | 0, 4 | 0);
  HEAP32[(5257108 & 16777215) >> 2] = i1;
  HEAP32[(5257112 & 16777215) >> 2] = i2;
  HEAP32[(5257120 & 16777215) >> 2] = 0;
  HEAP32[(5257116 & 16777215) >> 2] = i8;
  i8 = i9 + 28 | 0;
  HEAP32[(i8 & 16777215) >> 2] = 7;
  i2 = (i9 + 32 | 0) >>> 0 < i5 >>> 0;
  L2472 : do {
    if (i2) {
      i1 = i8;
      while (1) {
        i7 = i1 + 4 | 0;
        HEAP32[(i7 & 16777215) >> 2] = 7;
        if ((i1 + 8 | 0) >>> 0 < i5 >>> 0) {
          i1 = i7;
        } else {
          break L2472;
        }
      }
    }
  } while (0);
  if ((i9 | 0) == (i4 | 0)) {
    return;
  }
  i5 = i9 - i3 | 0;
  i9 = i5 + (i4 + 4) | 0;
  HEAP32[(i9 & 16777215) >> 2] = HEAP32[(i9 & 16777215) >> 2] & -2;
  HEAP32[(i3 + 4 & 16777215) >> 2] = i5 | 1;
  HEAP32[(i4 + i5 & 16777215) >> 2] = i5;
  i4 = i5 >>> 3;
  if (i5 >>> 0 < 256) {
    i9 = i4 << 1;
    i8 = (i9 << 2) + 5256704 | 0;
    i2 = HEAP32[(5256664 & 16777215) >> 2] | 0;
    i1 = 1 << i4;
    do {
      if ((i2 & i1 | 0) == 0) {
        HEAP32[(5256664 & 16777215) >> 2] = i2 | i1;
        i10 = i8;
        i11 = (i9 + 2 << 2) + 5256704 | 0;
      } else {
        i4 = (i9 + 2 << 2) + 5256704 | 0;
        i7 = HEAP32[(i4 & 16777215) >> 2] | 0;
        if (i7 >>> 0 >= (HEAP32[(5256680 & 16777215) >> 2] | 0) >>> 0) {
          i10 = i7;
          i11 = i4;
          break;
        }
        +_abort();
      }
    } while (0);
    HEAP32[(i11 & 16777215) >> 2] = i3;
    HEAP32[(i10 + 12 & 16777215) >> 2] = i3;
    HEAP32[(i3 + 8 & 16777215) >> 2] = i10;
    HEAP32[(i3 + 12 & 16777215) >> 2] = i8;
    return;
  }
  i8 = i3;
  i10 = i5 >>> 8;
  do {
    if ((i10 | 0) == 0) {
      i12 = 0;
    } else {
      if (i5 >>> 0 > 16777215) {
        i12 = 31;
        break;
      }
      i11 = (i10 + 1048320 | 0) >>> 16 & 8;
      i9 = i10 << i11;
      i1 = (i9 + 520192 | 0) >>> 16 & 4;
      i2 = i9 << i1;
      i9 = (i2 + 245760 | 0) >>> 16 & 2;
      i4 = 14 - (i1 | i11 | i9) + (i2 << i9 >>> 15) | 0;
      i12 = i5 >>> ((i4 + 7 | 0) >>> 0) & 1 | i4 << 1;
    }
  } while (0);
  i10 = (i12 << 2) + 5256968 | 0;
  HEAP32[(i3 + 28 & 16777215) >> 2] = i12;
  HEAP32[(i3 + 20 & 16777215) >> 2] = 0;
  HEAP32[(i3 + 16 & 16777215) >> 2] = 0;
  i4 = HEAP32[(5256668 & 16777215) >> 2] | 0;
  i9 = 1 << i12;
  if ((i4 & i9 | 0) == 0) {
    HEAP32[(5256668 & 16777215) >> 2] = i4 | i9;
    HEAP32[(i10 & 16777215) >> 2] = i8;
    HEAP32[(i3 + 24 & 16777215) >> 2] = i10;
    HEAP32[(i3 + 12 & 16777215) >> 2] = i3;
    HEAP32[(i3 + 8 & 16777215) >> 2] = i3;
    return;
  }
  if ((i12 | 0) == 31) {
    i13 = 0;
  } else {
    i13 = 25 - (i12 >>> 1) | 0;
  }
  i12 = i5 << i13;
  i13 = HEAP32[(i10 & 16777215) >> 2] | 0;
  while (1) {
    if ((HEAP32[(i13 + 4 & 16777215) >> 2] & -8 | 0) == (i5 | 0)) {
      break;
    }
    i14 = (i12 >>> 31 << 2) + i13 + 16 | 0;
    i10 = HEAP32[(i14 & 16777215) >> 2] | 0;
    if ((i10 | 0) == 0) {
      i15 = 1855;
      break;
    } else {
      i12 = i12 << 1;
      i13 = i10;
    }
  }
  if (i15 == 1855) {
    if (i14 >>> 0 < (HEAP32[(5256680 & 16777215) >> 2] | 0) >>> 0) {
      +_abort();
    }
    HEAP32[(i14 & 16777215) >> 2] = i8;
    HEAP32[(i3 + 24 & 16777215) >> 2] = i13;
    HEAP32[(i3 + 12 & 16777215) >> 2] = i3;
    HEAP32[(i3 + 8 & 16777215) >> 2] = i3;
    return;
  }
  i14 = i13 + 8 | 0;
  i15 = HEAP32[(i14 & 16777215) >> 2] | 0;
  i12 = HEAP32[(5256680 & 16777215) >> 2] | 0;
  if (i13 >>> 0 < i12 >>> 0) {
    +_abort();
  }
  if (i15 >>> 0 < i12 >>> 0) {
    +_abort();
  }
  HEAP32[(i15 + 12 & 16777215) >> 2] = i8;
  HEAP32[(i14 & 16777215) >> 2] = i8;
  HEAP32[(i3 + 8 & 16777215) >> 2] = i15;
  HEAP32[(i3 + 12 & 16777215) >> 2] = i13;
  HEAP32[(i3 + 24 & 16777215) >> 2] = 0;
  return;
}



  
  
  

  function b0(p0,p1,p2) { p0 = p0|0;p1 = p1|0;p2 = p2|0; abort(0); return 0 };
  var FUNCTION_TABLE_iiii = [b0,b0,b0,b0,_zcalloc,b0,b0,b0,b0,b0,b0,b0,b0,b0,b0,b0];
  
  function b1(p0) { p0 = p0|0; abort(1);  };
  var FUNCTION_TABLE_vi = [b1,b1,b1,b1,b1,b1,b1,b1,b1,b1,b1,b1,b1,b1,b1,b1];
  
  function b2(p0,p1) { p0 = p0|0;p1 = p1|0; abort(2);  };
  var FUNCTION_TABLE_vii = [b2,b2,b2,b2,b2,b2,b2,b2,b2,b2,_zcfree,b2,b2,b2,b2,b2];
  
  function b3(p0) { p0 = p0|0; abort(3); return 0 };
  var FUNCTION_TABLE_ii = [b3,b3,b3,b3,b3,b3,b3,b3,b3,b3,b3,b3,b3,b3,b3,b3];
  
  function b4() { ; abort(4);  };
  var FUNCTION_TABLE_v = [b4,b4,b4,b4,b4,b4,b4,b4,b4,b4,b4,b4,b4,b4,b4,b4];
  
  function b5(p0,p1) { p0 = p0|0;p1 = p1|0; abort(5); return 0 };
  var FUNCTION_TABLE_iii = [b5,b5,_deflate_fast,b5,b5,b5,_deflate_slow,b5,_deflate_stored,b5,b5,b5,b5,b5,b5,b5];
  

  function dynCall_iiii(index,a1,a2,a3) {
    index = index|0;
    a1=a1|0; a2=a2|0; a3=a3|0;
    return FUNCTION_TABLE_iiii[index&15](a1,a2,a3);
  }


  function dynCall_vi(index,a1) {
    index = index|0;
    a1=a1|0;
    FUNCTION_TABLE_vi[index&15](a1);
  }


  function dynCall_vii(index,a1,a2) {
    index = index|0;
    a1=a1|0; a2=a2|0;
    FUNCTION_TABLE_vii[index&15](a1,a2);
  }


  function dynCall_ii(index,a1) {
    index = index|0;
    a1=a1|0;
    return FUNCTION_TABLE_ii[index&15](a1);
  }


  function dynCall_v(index) {
    index = index|0;
    
    FUNCTION_TABLE_v[index&15]();
  }


  function dynCall_iii(index,a1,a2) {
    index = index|0;
    a1=a1|0; a2=a2|0;
    return FUNCTION_TABLE_iii[index&15](a1,a2);
  }


  return { '_malloc': _malloc, '_free': _free, '_main': _main, 'stackAlloc': stackAlloc, 'stackSave': stackSave, 'stackRestore': stackRestore, 'setThrew': setThrew, 'setTempRet0': setTempRet0, 'setTempRet1': setTempRet1, 'setTempRet2': setTempRet2, 'setTempRet3': setTempRet3, 'setTempRet4': setTempRet4, 'setTempRet5': setTempRet5, 'setTempRet6': setTempRet6, 'setTempRet7': setTempRet7, 'setTempRet8': setTempRet8, 'setTempRet9': setTempRet9, 'dynCall_iiii': dynCall_iiii, 'dynCall_vi': dynCall_vi, 'dynCall_vii': dynCall_vii, 'dynCall_ii': dynCall_ii, 'dynCall_v': dynCall_v, 'dynCall_iii': dynCall_iii };
});
if (asmPre.toSource) { // works in sm but not v8, so we get full coverage between those two
  asmPre = asmPre.toSource();
  asmPre = asmPre.substr(25, asmPre.length-28);
  asmPre = new Function('env', 'buffer', asmPre);
}
var asm = asmPre({ buffer: buffer, Int8Array: Int8Array, Int16Array: Int16Array, Int32Array: Int32Array, Uint8Array: Uint8Array, Uint16Array: Uint16Array, Uint32Array: Uint32Array, Float32Array: Float32Array, Float64Array: Float64Array, abort: abort, assert: assert, Runtime_bitshift64: Runtime_bitshift64, Math_floor: Math_floor, Math_min: Math_min, _strncmp: _strncmp, _llvm_memset_p0i8_i32: _llvm_memset_p0i8_i32, _sysconf: _sysconf, _stdout: _stdout, _fread: _fread, _llvm_memcpy_p0i8_p0i8_i32: _llvm_memcpy_p0i8_p0i8_i32, _pread: _pread, _feof: _feof, ___setErrNo: ___setErrNo, _fwrite: _fwrite, _write: _write, ___errno: ___errno, _memset: _memset, _read: _read, _ferror: _ferror, __impure_ptr: __impure_ptr, ___assert_func: ___assert_func, _memcpy: _memcpy, _pwrite: _pwrite, _sbrk: _sbrk, _stdin: _stdin, ___errno_location: ___errno_location, _abort: _abort, _llvm_bswap_i32: _llvm_bswap_i32, _stderr: _stderr, _time: _time, _strcmp: _strcmp, STACKTOP: STACKTOP, STACK_MAX: STACK_MAX, tempDoublePtr: tempDoublePtr, ABORT: ABORT, _stdout: _stdout, _stderr: _stderr, _stdin: _stdin }, buffer); // pass through Function to prevent seeing outside scope
var _malloc = Module["_malloc"] = asm._malloc;
var _free = Module["_free"] = asm._free;
var _main = Module["_main"] = asm._main;
var dynCall_iiii = Module["dynCall_iiii"] = asm.dynCall_iiii;
var dynCall_vi = Module["dynCall_vi"] = asm.dynCall_vi;
var dynCall_vii = Module["dynCall_vii"] = asm.dynCall_vii;
var dynCall_ii = Module["dynCall_ii"] = asm.dynCall_ii;
var dynCall_v = Module["dynCall_v"] = asm.dynCall_v;
var dynCall_iii = Module["dynCall_iii"] = asm.dynCall_iii;
Runtime.stackAlloc = function(size) { return asm.stackAlloc(size) };
Runtime.stackSave = function() { return asm.stackSave() };
Runtime.stackRestore = function(top) { asm.stackRestore(top) };
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



}).apply(null, arguments);


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