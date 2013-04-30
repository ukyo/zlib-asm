var key = ['zlib_noasm'];
var global;
if (typeof module !== 'undefined' && module.exports) {
  global = module.exports;
} else if(typeof window !== 'undefined') {
  global = window;
} else {
  global = this;
}

global[key] = {
  run: function(inputBytes, decompress) {
    var inputIndex = -1;
    var outputIndex = -1;
    var outputBytes = new Uint8Array(0x8000);
    var Module = {
      arguments: decompress ? ['-d'] : [],
      stdin: function() {
        return inputBytes[++inputIndex];
      },
      stdout: function(x) {
        var tmp;
        if (x !== null) {
          if (++outputIndex === outputBytes.length) {
            tmp = new Uint8Array(outputBytes.length * 2);
            tmp.set(outputBytes);
            outputBytes = tmp;
          }
          outputBytes[outputIndex] = x;
        }
      }
    };

// Note: For maximum-speed code, see "Optimizing Code" on the Emscripten wiki, https://github.com/kripken/emscripten/wiki/Optimizing-Code
// Note: Some Emscripten settings may limit the speed of the generated code.
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
  Module['read'] = function(filename, binary) {
    filename = nodePath['normalize'](filename);
    var ret = nodeFS['readFileSync'](filename);
    // The path is absolute if the normalized version is the same as the resolved.
    if (!ret && filename != nodePath['resolve'](filename)) {
      filename = path.join(__dirname, '..', 'src', filename);
      ret = nodeFS['readFileSync'](filename);
    }
    if (ret && !binary) ret = ret.toString();
    return ret;
  };
  Module['readBinary'] = function(filename) { return Module['read'](filename, true) };
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
  Module['read'] = read;
  Module['readBinary'] = function(f) {
    return read(f, 'binary');
  };
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
      } else if (field[0] == 'b') {
        // bN, large number field, like a [N x i8]
        size = field.substr(1)|0;
        alignSize = 1;
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
    //assert(sig); // TODO: support asm
    var table = FUNCTION_TABLE; // TODO: support asm
    var ret = table.length;
    table.push(func);
    table.push(0);
    return ret;
  },
  removeFunction: function (index) {
    var table = FUNCTION_TABLE; // TODO: support asm
    table[index] = null;
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
  stackAlloc: function (size) { var ret = STACKTOP;STACKTOP = (STACKTOP + size)|0;STACKTOP = ((((STACKTOP)+3)>>2)<<2); return ret; },
  staticAlloc: function (size) { var ret = STATICTOP;STATICTOP = (STATICTOP + size)|0;STATICTOP = ((((STATICTOP)+3)>>2)<<2); if (STATICTOP >= TOTAL_MEMORY) enlargeMemory();; return ret; },
  alignMemory: function (size,quantum) { var ret = size = Math.ceil((size)/(quantum ? quantum : 4))*(quantum ? quantum : 4); return ret; },
  makeBigInt: function (low,high,unsigned) { var ret = (unsigned ? (((low)>>>(0))+(((high)>>>(0))*4294967296)) : (((low)>>>(0))+(((high)|(0))*4294967296))); return ret; },
  QUANTUM_SIZE: 4,
  __dummy__: 0
}
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
//       able to call them. Closure can also do so. To avoid that, add your function to
//       the exports using something like
//
//         -s EXPORTED_FUNCTIONS='["_main", "_myfunc"]'
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
    var func = globalScope['Module']['_' + ident]; // closure exported function
    if (!func) func = eval('_' + ident); // explicit lookup
  } catch(e) {
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
      case 'i64': (tempI64 = [value>>>0,Math.min(Math.floor((value)/4294967296), 4294967295)>>>0],HEAP32[((ptr)>>2)]=tempI64[0],HEAP32[(((ptr)+(4))>>2)]=tempI64[1]); break;
      case 'float': HEAPF32[((ptr)>>2)]=value; break;
      case 'double': (HEAPF64[(tempDoublePtr)>>3]=value,HEAP32[((ptr)>>2)]=HEAP32[((tempDoublePtr)>>2)],HEAP32[(((ptr)+(4))>>2)]=HEAP32[(((tempDoublePtr)+(4))>>2)]); break;
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
      case 'double': return (HEAP32[((tempDoublePtr)>>2)]=HEAP32[((ptr)>>2)],HEAP32[(((tempDoublePtr)+(4))>>2)]=HEAP32[(((ptr)+(4))>>2)],HEAPF64[(tempDoublePtr)>>3]);
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
    var ptr = ret, stop;
    assert((ret & 3) == 0);
    stop = ret + (size & ~3);
    for (; ptr < stop; ptr += 4) {
      HEAP32[((ptr)>>2)]=0;
    }
    stop = ret + size;
    while (ptr < stop) {
      HEAP8[((ptr++)|0)]=0;
    }
    return ret;
  }
  if (singleType === 'i8') {
    HEAPU8.set(new Uint8Array(slab), ret);
    return ret;
  }
  var i = 0, type, typeSize, previousType;
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
    // no need to look up size unless type changes, so cache it
    if (previousType !== type) {
      typeSize = Runtime.getNativeTypeSize(type);
      previousType = type;
    }
    i += typeSize;
  }
  return ret;
}
Module['allocate'] = allocate;
function Pointer_stringify(ptr, /* optional */ length) {
  // Find the length, and check for UTF while doing so
  var hasUtf = false;
  var t;
  var i = 0;
  while (1) {
    t = HEAPU8[(((ptr)+(i))|0)];
    if (t >= 128) hasUtf = true;
    else if (t == 0 && !length) break;
    i++;
    if (length && i == length) break;
  }
  if (!length) length = i;
  var ret = '';
  if (!hasUtf) {
    var MAX_CHUNK = 1024; // split up into chunks, because .apply on a huge string can overflow the stack
    var curr;
    while (length > 0) {
      curr = String.fromCharCode.apply(String, HEAPU8.subarray(ptr, ptr + Math.min(length, MAX_CHUNK)));
      ret = ret ? ret + curr : curr;
      ptr += MAX_CHUNK;
      length -= MAX_CHUNK;
    }
    return ret;
  }
  var utf8 = new Runtime.UTF8Processor();
  for (i = 0; i < length; i++) {
    t = HEAPU8[(((ptr)+(i))|0)];
    ret += utf8.processCChar(t);
  }
  return ret;
}
Module['Pointer_stringify'] = Pointer_stringify;
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
  abort('Cannot enlarge memory arrays. Either (1) compile with -s TOTAL_MEMORY=X with X higher than the current value, (2) compile with ALLOW_MEMORY_GROWTH which adjusts the size at runtime but prevents some optimizations, or (3) set Module.TOTAL_MEMORY before the program runs.');
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
function copyTempFloat(ptr) { // functions, because inlining this code increases code size too much
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
    if (typeof callback == 'function') {
      callback();
      continue;
    }
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
var runtimeInitialized = false;
function ensureInitRuntime() {
  if (runtimeInitialized) return;
  runtimeInitialized = true;
  callRuntimeCallbacks(__ATINIT__);
}
function preMain() {
  callRuntimeCallbacks(__ATMAIN__);
}
function exitRuntime() {
  callRuntimeCallbacks(__ATEXIT__);
}
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
    HEAP8[(((buffer)+(i))|0)]=chr
    i = i + 1;
  }
}
Module['writeStringToMemory'] = writeStringToMemory;
function writeArrayToMemory(array, buffer) {
  for (var i = 0; i < array.length; i++) {
    HEAP8[(((buffer)+(i))|0)]=array[i];
  }
}
Module['writeArrayToMemory'] = writeArrayToMemory;
function unSign(value, bits, ignore, sig) {
  if (value >= 0) {
    return value;
  }
  return bits <= 32 ? 2*Math.abs(1 << (bits-1)) + value // Need some trickery, since if bits == 32, we are right at the limit of the bits JS uses in bitshifts
                    : Math.pow(2, bits)         + value;
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
if (!Math.imul) Math.imul = function(a, b) {
  var ah  = a >>> 16;
  var al = a & 0xffff;
  var bh  = b >>> 16;
  var bl = b & 0xffff;
  return (al*bl + ((ah*bl + al*bh) << 16))|0;
};
// A counter of dependencies for calling run(). If we need to
// do asynchronous work before running, increment this and
// decrement it. Incrementing must happen in a place like
// PRE_RUN_ADDITIONS (used by emcc to add file preloading).
// Note that you can add dependencies in preRun, even though
// it happens right before run - run will be postponed until
// the dependencies are met.
var runDependencies = 0;
var runDependencyTracking = {};
var calledInit = false, calledRun = false;
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
    // If run has never been called, and we should call run (INVOKE_RUN is true, and Module.noInitialRun is not false)
    if (!calledRun && shouldRunNow) run();
  }
}
Module['removeRunDependency'] = removeRunDependency;
Module["preloadedImages"] = {}; // maps url to image data
Module["preloadedAudios"] = {}; // maps url to audio data
function addPreRun(func) {
  if (!Module['preRun']) Module['preRun'] = [];
  else if (typeof Module['preRun'] == 'function') Module['preRun'] = [Module['preRun']];
  Module['preRun'].push(func);
}
var awaitingMemoryInitializer = false;
function loadMemoryInitializer(filename) {
  function applyData(data) {
    HEAPU8.set(data, TOTAL_STACK);
    runPostSets();
  }
  // always do this asynchronously, to keep shell and web as similar as possible
  addPreRun(function() {
    if (ENVIRONMENT_IS_NODE || ENVIRONMENT_IS_SHELL) {
      applyData(Module['readBinary'](filename));
    } else {
      Browser.asyncLoad(filename, function(data) {
        applyData(data);
      }, function(data) {
        throw 'could not load memory initializer ' + filename;
      });
    }
  });
  awaitingMemoryInitializer = false;
}
// === Body ===
assert(STATICTOP == STACK_MAX); assert(STACK_MAX == TOTAL_STACK);
STATICTOP += 14784;
assert(STATICTOP < TOTAL_MEMORY);
var _stdout;
var _stdin;
var _stderr;
var _stdout = _stdout=allocate([0,0,0,0], "i8", ALLOC_STATIC);
var _stdin = _stdin=allocate([0,0,0,0], "i8", ALLOC_STATIC);
var _stderr = _stderr=allocate([0,0,0,0], "i8", ALLOC_STATIC);
/* memory initializer */ allocate([12,0,8,0,140,0,8,0,76,0,8,0,204,0,8,0,44,0,8,0,172,0,8,0,108,0,8,0,236,0,8,0,28,0,8,0,156,0,8,0,92,0,8,0,220,0,8,0,60,0,8,0,188,0,8,0,124,0,8,0,252,0,8,0,2,0,8,0,130,0,8,0,66,0,8,0,194,0,8,0,34,0,8,0,162,0,8,0,98,0,8,0,226,0,8,0,18,0,8,0,146,0,8,0,82,0,8,0,210,0,8,0,50,0,8,0,178,0,8,0,114,0,8,0,242,0,8,0,10,0,8,0,138,0,8,0,74,0,8,0,202,0,8,0,42,0,8,0,170,0,8,0,106,0,8,0,234,0,8,0,26,0,8,0,154,0,8,0,90,0,8,0,218,0,8,0,58,0,8,0,186,0,8,0,122,0,8,0,250,0,8,0,6,0,8,0,134,0,8,0,70,0,8,0,198,0,8,0,38,0,8,0,166,0,8,0,102,0,8,0,230,0,8,0,22,0,8,0,150,0,8,0,86,0,8,0,214,0,8,0,54,0,8,0,182,0,8,0,118,0,8,0,246,0,8,0,14,0,8,0,142,0,8,0,78,0,8,0,206,0,8,0,46,0,8,0,174,0,8,0,110,0,8,0,238,0,8,0,30,0,8,0,158,0,8,0,94,0,8,0,222,0,8,0,62,0,8,0,190,0,8,0,126,0,8,0,254,0,8,0,1,0,8,0,129,0,8,0,65,0,8,0,193,0,8,0,33,0,8,0,161,0,8,0,97,0,8,0,225,0,8,0,17,0,8,0,145,0,8,0,81,0,8,0,209,0,8,0,49,0,8,0,177,0,8,0,113,0,8,0,241,0,8,0,9,0,8,0,137,0,8,0,73,0,8,0,201,0,8,0,41,0,8,0,169,0,8,0,105,0,8,0,233,0,8,0,25,0,8,0,153,0,8,0,89,0,8,0,217,0,8,0,57,0,8,0,185,0,8,0,121,0,8,0,249,0,8,0,5,0,8,0,133,0,8,0,69,0,8,0,197,0,8,0,37,0,8,0,165,0,8,0,101,0,8,0,229,0,8,0,21,0,8,0,149,0,8,0,85,0,8,0,213,0,8,0,53,0,8,0,181,0,8,0,117,0,8,0,245,0,8,0,13,0,8,0,141,0,8,0,77,0,8,0,205,0,8,0,45,0,8,0,173,0,8,0,109,0,8,0,237,0,8,0,29,0,8,0,157,0,8,0,93,0,8,0,221,0,8,0,61,0,8,0,189,0,8,0,125,0,8,0,253,0,8,0,19,0,9,0,19,1,9,0,147,0,9,0,147,1,9,0,83,0,9,0,83,1,9,0,211,0,9,0,211,1,9,0,51,0,9,0,51,1,9,0,179,0,9,0,179,1,9,0,115,0,9,0,115,1,9,0,243,0,9,0,243,1,9,0,11,0,9,0,11,1,9,0,139,0,9,0,139,1,9,0,75,0,9,0,75,1,9,0,203,0,9,0,203,1,9,0,43,0,9,0,43,1,9,0,171,0,9,0,171,1,9,0,107,0,9,0,107,1,9,0,235,0,9,0,235,1,9,0,27,0,9,0,27,1,9,0,155,0,9,0,155,1,9,0,91,0,9,0,91,1,9,0,219,0,9,0,219,1,9,0,59,0,9,0,59,1,9,0,187,0,9,0,187,1,9,0,123,0,9,0,123,1,9,0,251,0,9,0,251,1,9,0,7,0,9,0,7,1,9,0,135,0,9,0,135,1,9,0,71,0,9,0,71,1,9,0,199,0,9,0,199,1,9,0,39,0,9,0,39,1,9,0,167,0,9,0,167,1,9,0,103,0,9,0,103,1,9,0,231,0,9,0,231,1,9,0,23,0,9,0,23,1,9,0,151,0,9,0,151,1,9,0,87,0,9,0,87,1,9,0,215,0,9,0,215,1,9,0,55,0,9,0,55,1,9,0,183,0,9,0,183,1,9,0,119,0,9,0,119,1,9,0,247,0,9,0,247,1,9,0,15,0,9,0,15,1,9,0,143,0,9,0,143,1,9,0,79,0,9,0,79,1,9,0,207,0,9,0,207,1,9,0,47,0,9,0,47,1,9,0,175,0,9,0,175,1,9,0,111,0,9,0,111,1,9,0,239,0,9,0,239,1,9,0,31,0,9,0,31,1,9,0,159,0,9,0,159,1,9,0,95,0,9,0,95,1,9,0,223,0,9,0,223,1,9,0,63,0,9,0,63,1,9,0,191,0,9,0,191,1,9,0,127,0,9,0,127,1,9,0,255,0,9,0,255,1,9,0,0,0,7,0,64,0,7,0,32,0,7,0,96,0,7,0,16,0,7,0,80,0,7,0,48,0,7,0,112,0,7,0,8,0,7,0,72,0,7,0,40,0,7,0,104,0,7,0,24,0,7,0,88,0,7,0,56,0,7,0,120,0,7,0,4,0,7,0,68,0,7,0,36,0,7,0,100,0,7,0,20,0,7,0,84,0,7,0,52,0,7,0,116,0,7,0,3,0,8,0,131,0,8,0,67,0,8,0,195,0,8,0,35,0,8,0,163,0,8,0,99,0,8,0,227,0,8,0,0,0,80,0,244,14,80,0,1,1,0,0,30,1,0,0,15,0,0,0,0,0,5,0,16,0,5,0,8,0,5,0,24,0,5,0,4,0,5,0,20,0,5,0,12,0,5,0,28,0,5,0,2,0,5,0,18,0,5,0,10,0,5,0,26,0,5,0,6,0,5,0,22,0,5,0,14,0,5,0,30,0,5,0,1,0,5,0,17,0,5,0,9,0,5,0,25,0,5,0,5,0,5,0,21,0,5,0,13,0,5,0,29,0,5,0,3,0,5,0,19,0,5,0,11,0,5,0,27,0,5,0,7,0,5,0,23,0,5,0,148,4,80,0,104,15,80,0,0,0,0,0,30,0,0,0,15,0,0,0,0,0,0,0,224,15,80,0,0,0,0,0,19,0,0,0,7,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,16,0,16,0,16,0,16,0,16,0,16,0,16,0,16,0,17,0,17,0,17,0,17,0,18,0,18,0,18,0,18,0,19,0,19,0,19,0,19,0,20,0,20,0,20,0,20,0,21,0,21,0,21,0,21,0,16,0,78,0,68,0,0,0,3,0,4,0,5,0,6,0,7,0,8,0,9,0,10,0,11,0,13,0,15,0,17,0,19,0,23,0,27,0,31,0,35,0,43,0,51,0,59,0,67,0,83,0,99,0,115,0,131,0,163,0,195,0,227,0,2,1,0,0,0,0,0,0,16,0,16,0,16,0,16,0,17,0,17,0,18,0,18,0,19,0,19,0,20,0,20,0,21,0,21,0,22,0,22,0,23,0,23,0,24,0,24,0,25,0,25,0,26,0,26,0,27,0,27,0,28,0,28,0,29,0,29,0,64,0,64,0,1,0,2,0,3,0,4,0,5,0,7,0,9,0,13,0,17,0,25,0,33,0,49,0,65,0,97,0,129,0,193,0,1,1,129,1,1,2,1,3,1,4,1,6,1,8,1,12,1,16,1,24,1,32,1,48,1,64,1,96,0,0,0,0,16,0,17,0,18,0,0,0,8,0,7,0,9,0,6,0,10,0,5,0,11,0,4,0,12,0,3,0,13,0,2,0,14,0,1,0,15,0,0,0,96,7,0,0,0,8,80,0,0,8,16,0,20,8,115,0,18,7,31,0,0,8,112,0,0,8,48,0,0,9,192,0,16,7,10,0,0,8,96,0,0,8,32,0,0,9,160,0,0,8,0,0,0,8,128,0,0,8,64,0,0,9,224,0,16,7,6,0,0,8,88,0,0,8,24,0,0,9,144,0,19,7,59,0,0,8,120,0,0,8,56,0,0,9,208,0,17,7,17,0,0,8,104,0,0,8,40,0,0,9,176,0,0,8,8,0,0,8,136,0,0,8,72,0,0,9,240,0,16,7,4,0,0,8,84,0,0,8,20,0,21,8,227,0,19,7,43,0,0,8,116,0,0,8,52,0,0,9,200,0,17,7,13,0,0,8,100,0,0,8,36,0,0,9,168,0,0,8,4,0,0,8,132,0,0,8,68,0,0,9,232,0,16,7,8,0,0,8,92,0,0,8,28,0,0,9,152,0,20,7,83,0,0,8,124,0,0,8,60,0,0,9,216,0,18,7,23,0,0,8,108,0,0,8,44,0,0,9,184,0,0,8,12,0,0,8,140,0,0,8,76,0,0,9,248,0,16,7,3,0,0,8,82,0,0,8,18,0,21,8,163,0,19,7,35,0,0,8,114,0,0,8,50,0,0,9,196,0,17,7,11,0,0,8,98,0,0,8,34,0,0,9,164,0,0,8,2,0,0,8,130,0,0,8,66,0,0,9,228,0,16,7,7,0,0,8,90,0,0,8,26,0,0,9,148,0,20,7,67,0,0,8,122,0,0,8,58,0,0,9,212,0,18,7,19,0,0,8,106,0,0,8,42,0,0,9,180,0,0,8,10,0,0,8,138,0,0,8,74,0,0,9,244,0,16,7,5,0,0,8,86,0,0,8,22,0,64,8,0,0,19,7,51,0,0,8,118,0,0,8,54,0,0,9,204,0,17,7,15,0,0,8,102,0,0,8,38,0,0,9,172,0,0,8,6,0,0,8,134,0,0,8,70,0,0,9,236,0,16,7,9,0,0,8,94,0,0,8,30,0,0,9,156,0,20,7,99,0,0,8,126,0,0,8,62,0,0,9,220,0,18,7,27,0,0,8,110,0,0,8,46,0,0,9,188,0,0,8,14,0,0,8,142,0,0,8,78,0,0,9,252,0,96,7,0,0,0,8,81,0,0,8,17,0,21,8,131,0,18,7,31,0,0,8,113,0,0,8,49,0,0,9,194,0,16,7,10,0,0,8,97,0,0,8,33,0,0,9,162,0,0,8,1,0,0,8,129,0,0,8,65,0,0,9,226,0,16,7,6,0,0,8,89,0,0,8,25,0,0,9,146,0,19,7,59,0,0,8,121,0,0,8,57,0,0,9,210,0,17,7,17,0,0,8,105,0,0,8,41,0,0,9,178,0,0,8,9,0,0,8,137,0,0,8,73,0,0,9,242,0,16,7,4,0,0,8,85,0,0,8,21,0,16,8,2,1,19,7,43,0,0,8,117,0,0,8,53,0,0,9,202,0,17,7,13,0,0,8,101,0,0,8,37,0,0,9,170,0,0,8,5,0,0,8,133,0,0,8,69,0,0,9,234,0,16,7,8,0,0,8,93,0,0,8,29,0,0,9,154,0,20,7,83,0,0,8,125,0,0,8,61,0,0,9,218,0,18,7,23,0,0,8,109,0,0,8,45,0,0,9,186,0,0,8,13,0,0,8,141,0,0,8,77,0,0,9,250,0,16,7,3,0,0,8,83,0,0,8,19,0,21,8,195,0,19,7,35,0,0,8,115,0,0,8,51,0,0,9,198,0,17,7,11,0,0,8,99,0,0,8,35,0,0,9,166,0,0,8,3,0,0,8,131,0,0,8,67,0,0,9,230,0,16,7,7,0,0,8,91,0,0,8,27,0,0,9,150,0,20,7,67,0,0,8,123,0,0,8,59,0,0,9,214,0,18,7,19,0,0,8,107,0,0,8,43,0,0,9,182,0,0,8,11,0,0,8,139,0,0,8,75,0,0,9,246,0,16,7,5,0,0,8,87,0,0,8,23,0,64,8,0,0,19,7,51,0,0,8,119,0,0,8,55,0,0,9,206,0,17,7,15,0,0,8,103,0,0,8,39,0,0,9,174,0,0,8,7,0,0,8,135,0,0,8,71,0,0,9,238,0,16,7,9,0,0,8,95,0,0,8,31,0,0,9,158,0,20,7,99,0,0,8,127,0,0,8,63,0,0,9,222,0,18,7,27,0,0,8,111,0,0,8,47,0,0,9,190,0,0,8,15,0,0,8,143,0,0,8,79,0,0,9,254,0,96,7,0,0,0,8,80,0,0,8,16,0,20,8,115,0,18,7,31,0,0,8,112,0,0,8,48,0,0,9,193,0,16,7,10,0,0,8,96,0,0,8,32,0,0,9,161,0,0,8,0,0,0,8,128,0,0,8,64,0,0,9,225,0,16,7,6,0,0,8,88,0,0,8,24,0,0,9,145,0,19,7,59,0,0,8,120,0,0,8,56,0,0,9,209,0,17,7,17,0,0,8,104,0,0,8,40,0,0,9,177,0,0,8,8,0,0,8,136,0,0,8,72,0,0,9,241,0,16,7,4,0,0,8,84,0,0,8,20,0,21,8,227,0,19,7,43,0,0,8,116,0,0,8,52,0,0,9,201,0,17,7,13,0,0,8,100,0,0,8,36,0,0,9,169,0,0,8,4,0,0,8,132,0,0,8,68,0,0,9,233,0,16,7,8,0,0,8,92,0,0,8,28,0,0,9,153,0,20,7,83,0,0,8,124,0,0,8,60,0,0,9,217,0,18,7,23,0,0,8,108,0,0,8,44,0,0,9,185,0,0,8,12,0,0,8,140,0,0,8,76,0,0,9,249,0,16,7,3,0,0,8,82,0,0,8,18,0,21,8,163,0,19,7,35,0,0,8,114,0,0,8,50,0,0,9,197,0,17,7,11,0,0,8,98,0,0,8,34,0,0,9,165,0,0,8,2,0,0,8,130,0,0,8,66,0,0,9,229,0,16,7,7,0,0,8,90,0,0,8,26,0,0,9,149,0,20,7,67,0,0,8,122,0,0,8,58,0,0,9,213,0,18,7,19,0,0,8,106,0,0,8,42,0,0,9,181,0,0,8,10,0,0,8,138,0,0,8,74,0,0,9,245,0,16,7,5,0,0,8,86,0,0,8,22,0,64,8,0,0,19,7,51,0,0,8,118,0,0,8,54,0,0,9,205,0,17,7,15,0,0,8,102,0,0,8,38,0,0,9,173,0,0,8,6,0,0,8,134,0,0,8,70,0,0,9,237,0,16,7,9,0,0,8,94,0,0,8,30,0,0,9,157,0,20,7,99,0,0,8,126,0,0,8,62,0,0,9,221,0,18,7,27,0,0,8,110,0,0,8,46,0,0,9,189,0,0,8,14,0,0,8,142,0,0,8,78,0,0,9,253,0,96,7,0,0,0,8,81,0,0,8,17,0,21,8,131,0,18,7,31,0,0,8,113,0,0,8,49,0,0,9,195,0,16,7,10,0,0,8,97,0,0,8,33,0,0,9,163,0,0,8,1,0,0,8,129,0,0,8,65,0,0,9,227,0,16,7,6,0,0,8,89,0,0,8,25,0,0,9,147,0,19,7,59,0,0,8,121,0,0,8,57,0,0,9,211,0,17,7,17,0,0,8,105,0,0,8,41,0,0,9,179,0,0,8,9,0,0,8,137,0,0,8,73,0,0,9,243,0,16,7,4,0,0,8,85,0,0,8,21,0,16,8,2,1,19,7,43,0,0,8,117,0,0,8,53,0,0,9,203,0,17,7,13,0,0,8,101,0,0,8,37,0,0,9,171,0,0,8,5,0,0,8,133,0,0,8,69,0,0,9,235,0,16,7,8,0,0,8,93,0,0,8,29,0,0,9,155,0,20,7,83,0,0,8,125,0,0,8,61,0,0,9,219,0,18,7,23,0,0,8,109,0,0,8,45,0,0,9,187,0,0,8,13,0,0,8,141,0,0,8,77,0,0,9,251,0,16,7,3,0,0,8,83,0,0,8,19,0,21,8,195,0,19,7,35,0,0,8,115,0,0,8,51,0,0,9,199,0,17,7,11,0,0,8,99,0,0,8,35,0,0,9,167,0,0,8,3,0,0,8,131,0,0,8,67,0,0,9,231,0,16,7,7,0,0,8,91,0,0,8,27,0,0,9,151,0,20,7,67,0,0,8,123,0,0,8,59,0,0,9,215,0,18,7,19,0,0,8,107,0,0,8,43,0,0,9,183,0,0,8,11,0,0,8,139,0,0,8,75,0,0,9,247,0,16,7,5,0,0,8,87,0,0,8,23,0,64,8,0,0,19,7,51,0,0,8,119,0,0,8,55,0,0,9,207,0,17,7,15,0,0,8,103,0,0,8,39,0,0,9,175,0,0,8,7,0,0,8,135,0,0,8,71,0,0,9,239,0,16,7,9,0,0,8,95,0,0,8,31,0,0,9,159,0,20,7,99,0,0,8,127,0,0,8,63,0,0,9,223,0,18,7,27,0,0,8,111,0,0,8,47,0,0,9,191,0,0,8,15,0,0,8,143,0,0,8,79,0,0,9,255,0,16,5,1,0,23,5,1,1,19,5,17,0,27,5,1,16,17,5,5,0,25,5,1,4,21,5,65,0,29,5,1,64,16,5,3,0,24,5,1,2,20,5,33,0,28,5,1,32,18,5,9,0,26,5,1,8,22,5,129,0,64,5,0,0,16,5,2,0,23,5,129,1,19,5,25,0,27,5,1,24,17,5,7,0,25,5,1,6,21,5,97,0,29,5,1,96,16,5,4,0,24,5,1,3,20,5,49,0,28,5,1,48,18,5,13,0,26,5,1,12,22,5,193,0,64,5,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,2,0,0,0,2,0,0,0,2,0,0,0,2,0,0,0,3,0,0,0,3,0,0,0,3,0,0,0,3,0,0,0,4,0,0,0,4,0,0,0,4,0,0,0,4,0,0,0,5,0,0,0,5,0,0,0,5,0,0,0,5,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,1,0,0,0,2,0,0,0,2,0,0,0,3,0,0,0,3,0,0,0,4,0,0,0,4,0,0,0,5,0,0,0,5,0,0,0,6,0,0,0,6,0,0,0,7,0,0,0,7,0,0,0,8,0,0,0,8,0,0,0,9,0,0,0,9,0,0,0,10,0,0,0,10,0,0,0,11,0,0,0,11,0,0,0,12,0,0,0,12,0,0,0,13,0,0,0,13,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,0,0,0,3,0,0,0,7,0,0,0,0,0,0,0,150,48,7,119,44,97,14,238,186,81,9,153,25,196,109,7,143,244,106,112,53,165,99,233,163,149,100,158,50,136,219,14,164,184,220,121,30,233,213,224,136,217,210,151,43,76,182,9,189,124,177,126,7,45,184,231,145,29,191,144,100,16,183,29,242,32,176,106,72,113,185,243,222,65,190,132,125,212,218,26,235,228,221,109,81,181,212,244,199,133,211,131,86,152,108,19,192,168,107,100,122,249,98,253,236,201,101,138,79,92,1,20,217,108,6,99,99,61,15,250,245,13,8,141,200,32,110,59,94,16,105,76,228,65,96,213,114,113,103,162,209,228,3,60,71,212,4,75,253,133,13,210,107,181,10,165,250,168,181,53,108,152,178,66,214,201,187,219,64,249,188,172,227,108,216,50,117,92,223,69,207,13,214,220,89,61,209,171,172,48,217,38,58,0,222,81,128,81,215,200,22,97,208,191,181,244,180,33,35,196,179,86,153,149,186,207,15,165,189,184,158,184,2,40,8,136,5,95,178,217,12,198,36,233,11,177,135,124,111,47,17,76,104,88,171,29,97,193,61,45,102,182,144,65,220,118,6,113,219,1,188,32,210,152,42,16,213,239,137,133,177,113,31,181,182,6,165,228,191,159,51,212,184,232,162,201,7,120,52,249,0,15,142,168,9,150,24,152,14,225,187,13,106,127,45,61,109,8,151,108,100,145,1,92,99,230,244,81,107,107,98,97,108,28,216,48,101,133,78,0,98,242,237,149,6,108,123,165,1,27,193,244,8,130,87,196,15,245,198,217,176,101,80,233,183,18,234,184,190,139,124,136,185,252,223,29,221,98,73,45,218,21,243,124,211,140,101,76,212,251,88,97,178,77,206,81,181,58,116,0,188,163,226,48,187,212,65,165,223,74,215,149,216,61,109,196,209,164,251,244,214,211,106,233,105,67,252,217,110,52,70,136,103,173,208,184,96,218,115,45,4,68,229,29,3,51,95,76,10,170,201,124,13,221,60,113,5,80,170,65,2,39,16,16,11,190,134,32,12,201,37,181,104,87,179,133,111,32,9,212,102,185,159,228,97,206,14,249,222,94,152,201,217,41,34,152,208,176,180,168,215,199,23,61,179,89,129,13,180,46,59,92,189,183,173,108,186,192,32,131,184,237,182,179,191,154,12,226,182,3,154,210,177,116,57,71,213,234,175,119,210,157,21,38,219,4,131,22,220,115,18,11,99,227,132,59,100,148,62,106,109,13,168,90,106,122,11,207,14,228,157,255,9,147,39,174,0,10,177,158,7,125,68,147,15,240,210,163,8,135,104,242,1,30,254,194,6,105,93,87,98,247,203,103,101,128,113,54,108,25,231,6,107,110,118,27,212,254,224,43,211,137,90,122,218,16,204,74,221,103,111,223,185,249,249,239,190,142,67,190,183,23,213,142,176,96,232,163,214,214,126,147,209,161,196,194,216,56,82,242,223,79,241,103,187,209,103,87,188,166,221,6,181,63,75,54,178,72,218,43,13,216,76,27,10,175,246,74,3,54,96,122,4,65,195,239,96,223,85,223,103,168,239,142,110,49,121,190,105,70,140,179,97,203,26,131,102,188,160,210,111,37,54,226,104,82,149,119,12,204,3,71,11,187,185,22,2,34,47,38,5,85,190,59,186,197,40,11,189,178,146,90,180,43,4,106,179,92,167,255,215,194,49,207,208,181,139,158,217,44,29,174,222,91,176,194,100,155,38,242,99,236,156,163,106,117,10,147,109,2,169,6,9,156,63,54,14,235,133,103,7,114,19,87,0,5,130,74,191,149,20,122,184,226,174,43,177,123,56,27,182,12,155,142,210,146,13,190,213,229,183,239,220,124,33,223,219,11,212,210,211,134,66,226,212,241,248,179,221,104,110,131,218,31,205,22,190,129,91,38,185,246,225,119,176,111,119,71,183,24,230,90,8,136,112,106,15,255,202,59,6,102,92,11,1,17,255,158,101,143,105,174,98,248,211,255,107,97,69,207,108,22,120,226,10,160,238,210,13,215,84,131,4,78,194,179,3,57,97,38,103,167,247,22,96,208,77,71,105,73,219,119,110,62,74,106,209,174,220,90,214,217,102,11,223,64,240,59,216,55,83,174,188,169,197,158,187,222,127,207,178,71,233,255,181,48,28,242,189,189,138,194,186,202,48,147,179,83,166,163,180,36,5,54,208,186,147,6,215,205,41,87,222,84,191,103,217,35,46,122,102,179,184,74,97,196,2,27,104,93,148,43,111,42,55,190,11,180,161,142,12,195,27,223,5,90,141,239,2,45,0,0,0,0,65,49,27,25,130,98,54,50,195,83,45,43,4,197,108,100,69,244,119,125,134,167,90,86,199,150,65,79,8,138,217,200,73,187,194,209,138,232,239,250,203,217,244,227,12,79,181,172,77,126,174,181,142,45,131,158,207,28,152,135,81,18,194,74,16,35,217,83,211,112,244,120,146,65,239,97,85,215,174,46,20,230,181,55,215,181,152,28,150,132,131,5,89,152,27,130,24,169,0,155,219,250,45,176,154,203,54,169,93,93,119,230,28,108,108,255,223,63,65,212,158,14,90,205,162,36,132,149,227,21,159,140,32,70,178,167,97,119,169,190,166,225,232,241,231,208,243,232,36,131,222,195,101,178,197,218,170,174,93,93,235,159,70,68,40,204,107,111,105,253,112,118,174,107,49,57,239,90,42,32,44,9,7,11,109,56,28,18,243,54,70,223,178,7,93,198,113,84,112,237,48,101,107,244,247,243,42,187,182,194,49,162,117,145,28,137,52,160,7,144,251,188,159,23,186,141,132,14,121,222,169,37,56,239,178,60,255,121,243,115,190,72,232,106,125,27,197,65,60,42,222,88,5,79,121,240,68,126,98,233,135,45,79,194,198,28,84,219,1,138,21,148,64,187,14,141,131,232,35,166,194,217,56,191,13,197,160,56,76,244,187,33,143,167,150,10,206,150,141,19,9,0,204,92,72,49,215,69,139,98,250,110,202,83,225,119,84,93,187,186,21,108,160,163,214,63,141,136,151,14,150,145,80,152,215,222,17,169,204,199,210,250,225,236,147,203,250,245,92,215,98,114,29,230,121,107,222,181,84,64,159,132,79,89,88,18,14,22,25,35,21,15,218,112,56,36,155,65,35,61,167,107,253,101,230,90,230,124,37,9,203,87,100,56,208,78,163,174,145,1,226,159,138,24,33,204,167,51,96,253,188,42,175,225,36,173,238,208,63,180,45,131,18,159,108,178,9,134,171,36,72,201,234,21,83,208,41,70,126,251,104,119,101,226,246,121,63,47,183,72,36,54,116,27,9,29,53,42,18,4,242,188,83,75,179,141,72,82,112,222,101,121,49,239,126,96,254,243,230,231,191,194,253,254,124,145,208,213,61,160,203,204,250,54,138,131,187,7,145,154,120,84,188,177,57,101,167,168,75,152,131,59,10,169,152,34,201,250,181,9,136,203,174,16,79,93,239,95,14,108,244,70,205,63,217,109,140,14,194,116,67,18,90,243,2,35,65,234,193,112,108,193,128,65,119,216,71,215,54,151,6,230,45,142,197,181,0,165,132,132,27,188,26,138,65,113,91,187,90,104,152,232,119,67,217,217,108,90,30,79,45,21,95,126,54,12,156,45,27,39,221,28,0,62,18,0,152,185,83,49,131,160,144,98,174,139,209,83,181,146,22,197,244,221,87,244,239,196,148,167,194,239,213,150,217,246,233,188,7,174,168,141,28,183,107,222,49,156,42,239,42,133,237,121,107,202,172,72,112,211,111,27,93,248,46,42,70,225,225,54,222,102,160,7,197,127,99,84,232,84,34,101,243,77,229,243,178,2,164,194,169,27,103,145,132,48,38,160,159,41,184,174,197,228,249,159,222,253,58,204,243,214,123,253,232,207,188,107,169,128,253,90,178,153,62,9,159,178,127,56,132,171,176,36,28,44,241,21,7,53,50,70,42,30,115,119,49,7,180,225,112,72,245,208,107,81,54,131,70,122,119,178,93,99,78,215,250,203,15,230,225,210,204,181,204,249,141,132,215,224,74,18,150,175,11,35,141,182,200,112,160,157,137,65,187,132,70,93,35,3,7,108,56,26,196,63,21,49,133,14,14,40,66,152,79,103,3,169,84,126,192,250,121,85,129,203,98,76,31,197,56,129,94,244,35,152,157,167,14,179,220,150,21,170,27,0,84,229,90,49,79,252,153,98,98,215,216,83,121,206,23,79,225,73,86,126,250,80,149,45,215,123,212,28,204,98,19,138,141,45,82,187,150,52,145,232,187,31,208,217,160,6,236,243,126,94,173,194,101,71,110,145,72,108,47,160,83,117,232,54,18,58,169,7,9,35,106,84,36,8,43,101,63,17,228,121,167,150,165,72,188,143,102,27,145,164,39,42,138,189,224,188,203,242,161,141,208,235,98,222,253,192,35,239,230,217,189,225,188,20,252,208,167,13,63,131,138,38,126,178,145,63,185,36,208,112,248,21,203,105,59,70,230,66,122,119,253,91,181,107,101,220,244,90,126,197,55,9,83,238,118,56,72,247,177,174,9,184,240,159,18,161,51,204,63,138,114,253,36,147,0,0,0,0,55,106,194,1,110,212,132,3,89,190,70,2,220,168,9,7,235,194,203,6,178,124,141,4,133,22,79,5,184,81,19,14,143,59,209,15,214,133,151,13,225,239,85,12,100,249,26,9,83,147,216,8,10,45,158,10,61,71,92,11,112,163,38,28,71,201,228,29,30,119,162,31,41,29,96,30,172,11,47,27,155,97,237,26,194,223,171,24,245,181,105,25,200,242,53,18,255,152,247,19,166,38,177,17,145,76,115,16,20,90,60,21,35,48,254,20,122,142,184,22,77,228,122,23,224,70,77,56,215,44,143,57,142,146,201,59,185,248,11,58,60,238,68,63,11,132,134,62,82,58,192,60,101,80,2,61,88,23,94,54,111,125,156,55,54,195,218,53,1,169,24,52,132,191,87,49,179,213,149,48,234,107,211,50,221,1,17,51,144,229,107,36,167,143,169,37,254,49,239,39,201,91,45,38,76,77,98,35,123,39,160,34,34,153,230,32,21,243,36,33,40,180,120,42,31,222,186,43,70,96,252,41,113,10,62,40,244,28,113,45,195,118,179,44,154,200,245,46,173,162,55,47,192,141,154,112,247,231,88,113,174,89,30,115,153,51,220,114,28,37,147,119,43,79,81,118,114,241,23,116,69,155,213,117,120,220,137,126,79,182,75,127,22,8,13,125,33,98,207,124,164,116,128,121,147,30,66,120,202,160,4,122,253,202,198,123,176,46,188,108,135,68,126,109,222,250,56,111,233,144,250,110,108,134,181,107,91,236,119,106,2,82,49,104,53,56,243,105,8,127,175,98,63,21,109,99,102,171,43,97,81,193,233,96,212,215,166,101,227,189,100,100,186,3,34,102,141,105,224,103,32,203,215,72,23,161,21,73,78,31,83,75,121,117,145,74,252,99,222,79,203,9,28,78,146,183,90,76,165,221,152,77,152,154,196,70,175,240,6,71,246,78,64,69,193,36,130,68,68,50,205,65,115,88,15,64,42,230,73,66,29,140,139,67,80,104,241,84,103,2,51,85,62,188,117,87,9,214,183,86,140,192,248,83,187,170,58,82,226,20,124,80,213,126,190,81,232,57,226,90,223,83,32,91,134,237,102,89,177,135,164,88,52,145,235,93,3,251,41,92,90,69,111,94,109,47,173,95,128,27,53,225,183,113,247,224,238,207,177,226,217,165,115,227,92,179,60,230,107,217,254,231,50,103,184,229,5,13,122,228,56,74,38,239,15,32,228,238,86,158,162,236,97,244,96,237,228,226,47,232,211,136,237,233,138,54,171,235,189,92,105,234,240,184,19,253,199,210,209,252,158,108,151,254,169,6,85,255,44,16,26,250,27,122,216,251,66,196,158,249,117,174,92,248,72,233,0,243,127,131,194,242,38,61,132,240,17,87,70,241,148,65,9,244,163,43,203,245,250,149,141,247,205,255,79,246,96,93,120,217,87,55,186,216,14,137,252,218,57,227,62,219,188,245,113,222,139,159,179,223,210,33,245,221,229,75,55,220,216,12,107,215,239,102,169,214,182,216,239,212,129,178,45,213,4,164,98,208,51,206,160,209,106,112,230,211,93,26,36,210,16,254,94,197,39,148,156,196,126,42,218,198,73,64,24,199,204,86,87,194,251,60,149,195,162,130,211,193,149,232,17,192,168,175,77,203,159,197,143,202,198,123,201,200,241,17,11,201,116,7,68,204,67,109,134,205,26,211,192,207,45,185,2,206,64,150,175,145,119,252,109,144,46,66,43,146,25,40,233,147,156,62,166,150,171,84,100,151,242,234,34,149,197,128,224,148,248,199,188,159,207,173,126,158,150,19,56,156,161,121,250,157,36,111,181,152,19,5,119,153,74,187,49,155,125,209,243,154,48,53,137,141,7,95,75,140,94,225,13,142,105,139,207,143,236,157,128,138,219,247,66,139,130,73,4,137,181,35,198,136,136,100,154,131,191,14,88,130,230,176,30,128,209,218,220,129,84,204,147,132,99,166,81,133,58,24,23,135,13,114,213,134,160,208,226,169,151,186,32,168,206,4,102,170,249,110,164,171,124,120,235,174,75,18,41,175,18,172,111,173,37,198,173,172,24,129,241,167,47,235,51,166,118,85,117,164,65,63,183,165,196,41,248,160,243,67,58,161,170,253,124,163,157,151,190,162,208,115,196,181,231,25,6,180,190,167,64,182,137,205,130,183,12,219,205,178,59,177,15,179,98,15,73,177,85,101,139,176,104,34,215,187,95,72,21,186,6,246,83,184,49,156,145,185,180,138,222,188,131,224,28,189,218,94,90,191,237,52,152,190,0,0,0,0,101,103,188,184,139,200,9,170,238,175,181,18,87,151,98,143,50,240,222,55,220,95,107,37,185,56,215,157,239,40,180,197,138,79,8,125,100,224,189,111,1,135,1,215,184,191,214,74,221,216,106,242,51,119,223,224,86,16,99,88,159,87,25,80,250,48,165,232,20,159,16,250,113,248,172,66,200,192,123,223,173,167,199,103,67,8,114,117,38,111,206,205,112,127,173,149,21,24,17,45,251,183,164,63,158,208,24,135,39,232,207,26,66,143,115,162,172,32,198,176,201,71,122,8,62,175,50,160,91,200,142,24,181,103,59,10,208,0,135,178,105,56,80,47,12,95,236,151,226,240,89,133,135,151,229,61,209,135,134,101,180,224,58,221,90,79,143,207,63,40,51,119,134,16,228,234,227,119,88,82,13,216,237,64,104,191,81,248,161,248,43,240,196,159,151,72,42,48,34,90,79,87,158,226,246,111,73,127,147,8,245,199,125,167,64,213,24,192,252,109,78,208,159,53,43,183,35,141,197,24,150,159,160,127,42,39,25,71,253,186,124,32,65,2,146,143,244,16,247,232,72,168,61,88,20,155,88,63,168,35,182,144,29,49,211,247,161,137,106,207,118,20,15,168,202,172,225,7,127,190,132,96,195,6,210,112,160,94,183,23,28,230,89,184,169,244,60,223,21,76,133,231,194,209,224,128,126,105,14,47,203,123,107,72,119,195,162,15,13,203,199,104,177,115,41,199,4,97,76,160,184,217,245,152,111,68,144,255,211,252,126,80,102,238,27,55,218,86,77,39,185,14,40,64,5,182,198,239,176,164,163,136,12,28,26,176,219,129,127,215,103,57,145,120,210,43,244,31,110,147,3,247,38,59,102,144,154,131,136,63,47,145,237,88,147,41,84,96,68,180,49,7,248,12,223,168,77,30,186,207,241,166,236,223,146,254,137,184,46,70,103,23,155,84,2,112,39,236,187,72,240,113,222,47,76,201,48,128,249,219,85,231,69,99,156,160,63,107,249,199,131,211,23,104,54,193,114,15,138,121,203,55,93,228,174,80,225,92,64,255,84,78,37,152,232,246,115,136,139,174,22,239,55,22,248,64,130,4,157,39,62,188,36,31,233,33,65,120,85,153,175,215,224,139,202,176,92,51,59,182,89,237,94,209,229,85,176,126,80,71,213,25,236,255,108,33,59,98,9,70,135,218,231,233,50,200,130,142,142,112,212,158,237,40,177,249,81,144,95,86,228,130,58,49,88,58,131,9,143,167,230,110,51,31,8,193,134,13,109,166,58,181,164,225,64,189,193,134,252,5,47,41,73,23,74,78,245,175,243,118,34,50,150,17,158,138,120,190,43,152,29,217,151,32,75,201,244,120,46,174,72,192,192,1,253,210,165,102,65,106,28,94,150,247,121,57,42,79,151,150,159,93,242,241,35,229,5,25,107,77,96,126,215,245,142,209,98,231,235,182,222,95,82,142,9,194,55,233,181,122,217,70,0,104,188,33,188,208,234,49,223,136,143,86,99,48,97,249,214,34,4,158,106,154,189,166,189,7,216,193,1,191,54,110,180,173,83,9,8,21,154,78,114,29,255,41,206,165,17,134,123,183,116,225,199,15,205,217,16,146,168,190,172,42,70,17,25,56,35,118,165,128,117,102,198,216,16,1,122,96,254,174,207,114,155,201,115,202,34,241,164,87,71,150,24,239,169,57,173,253,204,94,17,69,6,238,77,118,99,137,241,206,141,38,68,220,232,65,248,100,81,121,47,249,52,30,147,65,218,177,38,83,191,214,154,235,233,198,249,179,140,161,69,11,98,14,240,25,7,105,76,161,190,81,155,60,219,54,39,132,53,153,146,150,80,254,46,46,153,185,84,38,252,222,232,158,18,113,93,140,119,22,225,52,206,46,54,169,171,73,138,17,69,230,63,3,32,129,131,187,118,145,224,227,19,246,92,91,253,89,233,73,152,62,85,241,33,6,130,108,68,97,62,212,170,206,139,198,207,169,55,126,56,65,127,214,93,38,195,110,179,137,118,124,214,238,202,196,111,214,29,89,10,177,161,225,228,30,20,243,129,121,168,75,215,105,203,19,178,14,119,171,92,161,194,185,57,198,126,1,128,254,169,156,229,153,21,36,11,54,160,54,110,81,28,142,167,22,102,134,194,113,218,62,44,222,111,44,73,185,211,148,240,129,4,9,149,230,184,177,123,73,13,163,30,46,177,27,72,62,210,67,45,89,110,251,195,246,219,233,166,145,103,81,31,169,176,204,122,206,12,116,148,97,185,102,241,6,5,222,0,0,0,0,119,7,48,150,238,14,97,44,153,9,81,186,7,109,196,25,112,106,244,143,233,99,165,53,158,100,149,163,14,219,136,50,121,220,184,164,224,213,233,30,151,210,217,136,9,182,76,43,126,177,124,189,231,184,45,7,144,191,29,145,29,183,16,100,106,176,32,242,243,185,113,72,132,190,65,222,26,218,212,125,109,221,228,235,244,212,181,81,131,211,133,199,19,108,152,86,100,107,168,192,253,98,249,122,138,101,201,236,20,1,92,79,99,6,108,217,250,15,61,99,141,8,13,245,59,110,32,200,76,105,16,94,213,96,65,228,162,103,113,114,60,3,228,209,75,4,212,71,210,13,133,253,165,10,181,107,53,181,168,250,66,178,152,108,219,187,201,214,172,188,249,64,50,216,108,227,69,223,92,117,220,214,13,207,171,209,61,89,38,217,48,172,81,222,0,58,200,215,81,128,191,208,97,22,33,180,244,181,86,179,196,35,207,186,149,153,184,189,165,15,40,2,184,158,95,5,136,8,198,12,217,178,177,11,233,36,47,111,124,135,88,104,76,17,193,97,29,171,182,102,45,61,118,220,65,144,1,219,113,6,152,210,32,188,239,213,16,42,113,177,133,137,6,182,181,31,159,191,228,165,232,184,212,51,120,7,201,162,15,0,249,52,150,9,168,142,225,14,152,24,127,106,13,187,8,109,61,45,145,100,108,151,230,99,92,1,107,107,81,244,28,108,97,98,133,101,48,216,242,98,0,78,108,6,149,237,27,1,165,123,130,8,244,193,245,15,196,87,101,176,217,198,18,183,233,80,139,190,184,234,252,185,136,124,98,221,29,223,21,218,45,73,140,211,124,243,251,212,76,101,77,178,97,88,58,181,81,206,163,188,0,116,212,187,48,226,74,223,165,65,61,216,149,215,164,209,196,109,211,214,244,251,67,105,233,106,52,110,217,252,173,103,136,70,218,96,184,208,68,4,45,115,51,3,29,229,170,10,76,95,221,13,124,201,80,5,113,60,39,2,65,170,190,11,16,16,201,12,32,134,87,104,181,37,32,111,133,179,185,102,212,9,206,97,228,159,94,222,249,14,41,217,201,152,176,208,152,34,199,215,168,180,89,179,61,23,46,180,13,129,183,189,92,59,192,186,108,173,237,184,131,32,154,191,179,182,3,182,226,12,116,177,210,154,234,213,71,57,157,210,119,175,4,219,38,21,115,220,22,131,227,99,11,18,148,100,59,132,13,109,106,62,122,106,90,168,228,14,207,11,147,9,255,157,10,0,174,39,125,7,158,177,240,15,147,68,135,8,163,210,30,1,242,104,105,6,194,254,247,98,87,93,128,101,103,203,25,108,54,113,110,107,6,231,254,212,27,118,137,211,43,224,16,218,122,90,103,221,74,204,249,185,223,111,142,190,239,249,23,183,190,67,96,176,142,213,214,214,163,232,161,209,147,126,56,216,194,196,79,223,242,82,209,187,103,241,166,188,87,103,63,181,6,221,72,178,54,75,216,13,43,218,175,10,27,76,54,3,74,246,65,4,122,96,223,96,239,195,168,103,223,85,49,110,142,239,70,105,190,121,203,97,179,140,188,102,131,26,37,111,210,160,82,104,226,54,204,12,119,149,187,11,71,3,34,2,22,185,85,5,38,47,197,186,59,190,178,189,11,40,43,180,90,146,92,179,106,4,194,215,255,167,181,208,207,49,44,217,158,139,91,222,174,29,155,100,194,176,236,99,242,38,117,106,163,156,2,109,147,10,156,9,6,169,235,14,54,63,114,7,103,133,5,0,87,19,149,191,74,130,226,184,122,20,123,177,43,174,12,182,27,56,146,210,142,155,229,213,190,13,124,220,239,183,11,219,223,33,134,211,210,212,241,212,226,66,104,221,179,248,31,218,131,110,129,190,22,205,246,185,38,91,111,176,119,225,24,183,71,119,136,8,90,230,255,15,106,112,102,6,59,202,17,1,11,92,143,101,158,255,248,98,174,105,97,107,255,211,22,108,207,69,160,10,226,120,215,13,210,238,78,4,131,84,57,3,179,194,167,103,38,97,208,96,22,247,73,105,71,77,62,110,119,219,174,209,106,74,217,214,90,220,64,223,11,102,55,216,59,240,169,188,174,83,222,187,158,197,71,178,207,127,48,181,255,233,189,189,242,28,202,186,194,138,83,179,147,48,36,180,163,166,186,208,54,5,205,215,6,147,84,222,87,41,35,217,103,191,179,102,122,46,196,97,74,184,93,104,27,2,42,111,43,148,180,11,190,55,195,12,142,161,90,5,223,27,45,2,239,141,0,0,0,0,25,27,49,65,50,54,98,130,43,45,83,195,100,108,197,4,125,119,244,69,86,90,167,134,79,65,150,199,200,217,138,8,209,194,187,73,250,239,232,138,227,244,217,203,172,181,79,12,181,174,126,77,158,131,45,142,135,152,28,207,74,194,18,81,83,217,35,16,120,244,112,211,97,239,65,146,46,174,215,85,55,181,230,20,28,152,181,215,5,131,132,150,130,27,152,89,155,0,169,24,176,45,250,219,169,54,203,154,230,119,93,93,255,108,108,28,212,65,63,223,205,90,14,158,149,132,36,162,140,159,21,227,167,178,70,32,190,169,119,97,241,232,225,166,232,243,208,231,195,222,131,36,218,197,178,101,93,93,174,170,68,70,159,235,111,107,204,40,118,112,253,105,57,49,107,174,32,42,90,239,11,7,9,44,18,28,56,109,223,70,54,243,198,93,7,178,237,112,84,113,244,107,101,48,187,42,243,247,162,49,194,182,137,28,145,117,144,7,160,52,23,159,188,251,14,132,141,186,37,169,222,121,60,178,239,56,115,243,121,255,106,232,72,190,65,197,27,125,88,222,42,60,240,121,79,5,233,98,126,68,194,79,45,135,219,84,28,198,148,21,138,1,141,14,187,64,166,35,232,131,191,56,217,194,56,160,197,13,33,187,244,76,10,150,167,143,19,141,150,206,92,204,0,9,69,215,49,72,110,250,98,139,119,225,83,202,186,187,93,84,163,160,108,21,136,141,63,214,145,150,14,151,222,215,152,80,199,204,169,17,236,225,250,210,245,250,203,147,114,98,215,92,107,121,230,29,64,84,181,222,89,79,132,159,22,14,18,88,15,21,35,25,36,56,112,218,61,35,65,155,101,253,107,167,124,230,90,230,87,203,9,37,78,208,56,100,1,145,174,163,24,138,159,226,51,167,204,33,42,188,253,96,173,36,225,175,180,63,208,238,159,18,131,45,134,9,178,108,201,72,36,171,208,83,21,234,251,126,70,41,226,101,119,104,47,63,121,246,54,36,72,183,29,9,27,116,4,18,42,53,75,83,188,242,82,72,141,179,121,101,222,112,96,126,239,49,231,230,243,254,254,253,194,191,213,208,145,124,204,203,160,61,131,138,54,250,154,145,7,187,177,188,84,120,168,167,101,57,59,131,152,75,34,152,169,10,9,181,250,201,16,174,203,136,95,239,93,79,70,244,108,14,109,217,63,205,116,194,14,140,243,90,18,67,234,65,35,2,193,108,112,193,216,119,65,128,151,54,215,71,142,45,230,6,165,0,181,197,188,27,132,132,113,65,138,26,104,90,187,91,67,119,232,152,90,108,217,217,21,45,79,30,12,54,126,95,39,27,45,156,62,0,28,221,185,152,0,18,160,131,49,83,139,174,98,144,146,181,83,209,221,244,197,22,196,239,244,87,239,194,167,148,246,217,150,213,174,7,188,233,183,28,141,168,156,49,222,107,133,42,239,42,202,107,121,237,211,112,72,172,248,93,27,111,225,70,42,46,102,222,54,225,127,197,7,160,84,232,84,99,77,243,101,34,2,178,243,229,27,169,194,164,48,132,145,103,41,159,160,38,228,197,174,184,253,222,159,249,214,243,204,58,207,232,253,123,128,169,107,188,153,178,90,253,178,159,9,62,171,132,56,127,44,28,36,176,53,7,21,241,30,42,70,50,7,49,119,115,72,112,225,180,81,107,208,245,122,70,131,54,99,93,178,119,203,250,215,78,210,225,230,15,249,204,181,204,224,215,132,141,175,150,18,74,182,141,35,11,157,160,112,200,132,187,65,137,3,35,93,70,26,56,108,7,49,21,63,196,40,14,14,133,103,79,152,66,126,84,169,3,85,121,250,192,76,98,203,129,129,56,197,31,152,35,244,94,179,14,167,157,170,21,150,220,229,84,0,27,252,79,49,90,215,98,98,153,206,121,83,216,73,225,79,23,80,250,126,86,123,215,45,149,98,204,28,212,45,141,138,19,52,150,187,82,31,187,232,145,6,160,217,208,94,126,243,236,71,101,194,173,108,72,145,110,117,83,160,47,58,18,54,232,35,9,7,169,8,36,84,106,17,63,101,43,150,167,121,228,143,188,72,165,164,145,27,102,189,138,42,39,242,203,188,224,235,208,141,161,192,253,222,98,217,230,239,35,20,188,225,189,13,167,208,252,38,138,131,63,63,145,178,126,112,208,36,185].concat([105,203,21,248,66,230,70,59,91,253,119,122,220,101,107,181,197,126,90,244,238,83,9,55,247,72,56,118,184,9,174,177,161,18,159,240,138,63,204,51,147,36,253,114,0,0,0,0,1,194,106,55,3,132,212,110,2,70,190,89,7,9,168,220,6,203,194,235,4,141,124,178,5,79,22,133,14,19,81,184,15,209,59,143,13,151,133,214,12,85,239,225,9,26,249,100,8,216,147,83,10,158,45,10,11,92,71,61,28,38,163,112,29,228,201,71,31,162,119,30,30,96,29,41,27,47,11,172,26,237,97,155,24,171,223,194,25,105,181,245,18,53,242,200,19,247,152,255,17,177,38,166,16,115,76,145,21,60,90,20,20,254,48,35,22,184,142,122,23,122,228,77,56,77,70,224,57,143,44,215,59,201,146,142,58,11,248,185,63,68,238,60,62,134,132,11,60,192,58,82,61,2,80,101,54,94,23,88,55,156,125,111,53,218,195,54,52,24,169,1,49,87,191,132,48,149,213,179,50,211,107,234,51,17,1,221,36,107,229,144,37,169,143,167,39,239,49,254,38,45,91,201,35,98,77,76,34,160,39,123,32,230,153,34,33,36,243,21,42,120,180,40,43,186,222,31,41,252,96,70,40,62,10,113,45,113,28,244,44,179,118,195,46,245,200,154,47,55,162,173,112,154,141,192,113,88,231,247,115,30,89,174,114,220,51,153,119,147,37,28,118,81,79,43,116,23,241,114,117,213,155,69,126,137,220,120,127,75,182,79,125,13,8,22,124,207,98,33,121,128,116,164,120,66,30,147,122,4,160,202,123,198,202,253,108,188,46,176,109,126,68,135,111,56,250,222,110,250,144,233,107,181,134,108,106,119,236,91,104,49,82,2,105,243,56,53,98,175,127,8,99,109,21,63,97,43,171,102,96,233,193,81,101,166,215,212,100,100,189,227,102,34,3,186,103,224,105,141,72,215,203,32,73,21,161,23,75,83,31,78,74,145,117,121,79,222,99,252,78,28,9,203,76,90,183,146,77,152,221,165,70,196,154,152,71,6,240,175,69,64,78,246,68,130,36,193,65,205,50,68,64,15,88,115,66,73,230,42,67,139,140,29,84,241,104,80,85,51,2,103,87,117,188,62,86,183,214,9,83,248,192,140,82,58,170,187,80,124,20,226,81,190,126,213,90,226,57,232,91,32,83,223,89,102,237,134,88,164,135,177,93,235,145,52,92,41,251,3,94,111,69,90,95,173,47,109,225,53,27,128,224,247,113,183,226,177,207,238,227,115,165,217,230,60,179,92,231,254,217,107,229,184,103,50,228,122,13,5,239,38,74,56,238,228,32,15,236,162,158,86,237,96,244,97,232,47,226,228,233,237,136,211,235,171,54,138,234,105,92,189,253,19,184,240,252,209,210,199,254,151,108,158,255,85,6,169,250,26,16,44,251,216,122,27,249,158,196,66,248,92,174,117,243,0,233,72,242,194,131,127,240,132,61,38,241,70,87,17,244,9,65,148,245,203,43,163,247,141,149,250,246,79,255,205,217,120,93,96,216,186,55,87,218,252,137,14,219,62,227,57,222,113,245,188,223,179,159,139,221,245,33,210,220,55,75,229,215,107,12,216,214,169,102,239,212,239,216,182,213,45,178,129,208,98,164,4,209,160,206,51,211,230,112,106,210,36,26,93,197,94,254,16,196,156,148,39,198,218,42,126,199,24,64,73,194,87,86,204,195,149,60,251,193,211,130,162,192,17,232,149,203,77,175,168,202,143,197,159,200,201,123,198,201,11,17,241,204,68,7,116,205,134,109,67,207,192,211,26,206,2,185,45,145,175,150,64,144,109,252,119,146,43,66,46,147,233,40,25,150,166,62,156,151,100,84,171,149,34,234,242,148,224,128,197,159,188,199,248,158,126,173,207,156,56,19,150,157,250,121,161,152,181,111,36,153,119,5,19,155,49,187,74,154,243,209,125,141,137,53,48,140,75,95,7,142,13,225,94,143,207,139,105,138,128,157,236,139,66,247,219,137,4,73,130,136,198,35,181,131,154,100,136,130,88,14,191,128,30,176,230,129,220,218,209,132,147,204,84,133,81,166,99,135,23,24,58,134,213,114,13,169,226,208,160,168,32,186,151,170,102,4,206,171,164,110,249,174,235,120,124,175,41,18,75,173,111,172,18,172,173,198,37,167,241,129,24,166,51,235,47,164,117,85,118,165,183,63,65,160,248,41,196,161,58,67,243,163,124,253,170,162,190,151,157,181,196,115,208,180,6,25,231,182,64,167,190,183,130,205,137,178,205,219,12,179,15,177,59,177,73,15,98,176,139,101,85,187,215,34,104,186,21,72,95,184,83,246,6,185,145,156,49,188,222,138,180,189,28,224,131,191,90,94,218,190,152,52,237,0,0,0,0,184,188,103,101,170,9,200,139,18,181,175,238,143,98,151,87,55,222,240,50,37,107,95,220,157,215,56,185,197,180,40,239,125,8,79,138,111,189,224,100,215,1,135,1,74,214,191,184,242,106,216,221,224,223,119,51,88,99,16,86,80,25,87,159,232,165,48,250,250,16,159,20,66,172,248,113,223,123,192,200,103,199,167,173,117,114,8,67,205,206,111,38,149,173,127,112,45,17,24,21,63,164,183,251,135,24,208,158,26,207,232,39,162,115,143,66,176,198,32,172,8,122,71,201,160,50,175,62,24,142,200,91,10,59,103,181,178,135,0,208,47,80,56,105,151,236,95,12,133,89,240,226,61,229,151,135,101,134,135,209,221,58,224,180,207,143,79,90,119,51,40,63,234,228,16,134,82,88,119,227,64,237,216,13,248,81,191,104,240,43,248,161,72,151,159,196,90,34,48,42,226,158,87,79,127,73,111,246,199,245,8,147,213,64,167,125,109,252,192,24,53,159,208,78,141,35,183,43,159,150,24,197,39,42,127,160,186,253,71,25,2,65,32,124,16,244,143,146,168,72,232,247,155,20,88,61,35,168,63,88,49,29,144,182,137,161,247,211,20,118,207,106,172,202,168,15,190,127,7,225,6,195,96,132,94,160,112,210,230,28,23,183,244,169,184,89,76,21,223,60,209,194,231,133,105,126,128,224,123,203,47,14,195,119,72,107,203,13,15,162,115,177,104,199,97,4,199,41,217,184,160,76,68,111,152,245,252,211,255,144,238,102,80,126,86,218,55,27,14,185,39,77,182,5,64,40,164,176,239,198,28,12,136,163,129,219,176,26,57,103,215,127,43,210,120,145,147,110,31,244,59,38,247,3,131,154,144,102,145,47,63,136,41,147,88,237,180,68,96,84,12,248,7,49,30,77,168,223,166,241,207,186,254,146,223,236,70,46,184,137,84,155,23,103,236,39,112,2,113,240,72,187,201,76,47,222,219,249,128,48,99,69,231,85,107,63,160,156,211,131,199,249,193,54,104,23,121,138,15,114,228,93,55,203,92,225,80,174,78,84,255,64,246,232,152,37,174,139,136,115,22,55,239,22,4,130,64,248,188,62,39,157,33,233,31,36,153,85,120,65,139,224,215,175,51,92,176,202,237,89,182,59,85,229,209,94,71,80,126,176,255,236,25,213,98,59,33,108,218,135,70,9,200,50,233,231,112,142,142,130,40,237,158,212,144,81,249,177,130,228,86,95,58,88,49,58,167,143,9,131,31,51,110,230,13,134,193,8,181,58,166,109,189,64,225,164,5,252,134,193,23,73,41,47,175,245,78,74,50,34,118,243,138,158,17,150,152,43,190,120,32,151,217,29,120,244,201,75,192,72,174,46,210,253,1,192,106,65,102,165,247,150,94,28,79,42,57,121,93,159,150,151,229,35,241,242,77,107,25,5,245,215,126,96,231,98,209,142,95,222,182,235,194,9,142,82,122,181,233,55,104,0,70,217,208,188,33,188,136,223,49,234,48,99,86,143,34,214,249,97,154,106,158,4,7,189,166,189,191,1,193,216,173,180,110,54,21,8,9,83,29,114,78,154,165,206,41,255,183,123,134,17,15,199,225,116,146,16,217,205,42,172,190,168,56,25,17,70,128,165,118,35,216,198,102,117,96,122,1,16,114,207,174,254,202,115,201,155,87,164,241,34,239,24,150,71,253,173,57,169,69,17,94,204,118,77,238,6,206,241,137,99,220,68,38,141,100,248,65,232,249,47,121,81,65,147,30,52,83,38,177,218,235,154,214,191,179,249,198,233,11,69,161,140,25,240,14,98,161,76,105,7,60,155,81,190,132,39,54,219,150,146,153,53,46,46,254,80,38,84,185,153,158,232,222,252,140,93,113,18,52,225,22,119,169,54,46,206,17,138,73,171,3,63,230,69,187,131,129,32,227,224,145,118,91,92,246,19,73,233,89,253,241,85,62,152,108,130,6,33,212,62,97,68,198,139,206,170,126,55,169,207,214,127,65,56,110,195,38,93,124,118,137,179,196,202,238,214,89,29,214,111,225,161,177,10,243,20,30,228,75,168,121,129,19,203,105,215,171,119,14,178,185,194,161,92,1,126,198,57,156,169,254,128,36,21,153,229,54,160,54,11,142,28,81,110,134,102,22,167,62,218,113,194,44,111,222,44,148,211,185,73,9,4,129,240,177,184,230,149,163,13,73,123,27,177,46,30,67,210,62,72,251,110,89,45,233,219,246,195,81,103,145,166,204,176,169,31,116,12,206,122,102,185,97,148,222,5,6,241,0,0,0,0,0,0,0,0,8,0,0,0,4,0,4,0,8,0,4,0,2,0,0,0,4,0,5,0,16,0,8,0,2,0,0,0,4,0,6,0,32,0,32,0,2,0,0,0,4,0,4,0,16,0,16,0,6,0,0,0,8,0,16,0,32,0,32,0,6,0,0,0,8,0,16,0,128,0,128,0,6,0,0,0,8,0,32,0,128,0,0,1,6,0,0,0,32,0,128,0,2,1,0,4,6,0,0,0,32,0,2,1,2,1,0,16,6,0,0,0,16,17,18,0,8,7,9,6,10,5,11,4,12,3,13,2,14,1,15,0,0,0,0,0,1,0,0,0,2,0,0,0,3,0,0,0,4,0,0,0,5,0,0,0,6,0,0,0,7,0,0,0,8,0,0,0,10,0,0,0,12,0,0,0,14,0,0,0,16,0,0,0,20,0,0,0,24,0,0,0,28,0,0,0,32,0,0,0,40,0,0,0,48,0,0,0,56,0,0,0,64,0,0,0,80,0,0,0,96,0,0,0,112,0,0,0,128,0,0,0,160,0,0,0,192,0,0,0,224,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,2,0,0,0,3,0,0,0,4,0,0,0,6,0,0,0,8,0,0,0,12,0,0,0,16,0,0,0,24,0,0,0,32,0,0,0,48,0,0,0,64,0,0,0,96,0,0,0,128,0,0,0,192,0,0,0,0,1,0,0,128,1,0,0,0,2,0,0,0,3,0,0,0,4,0,0,0,6,0,0,0,8,0,0,0,12,0,0,0,16,0,0,0,24,0,0,0,32,0,0,0,48,0,0,0,64,0,0,0,96,0,0,105,110,118,97,108,105,100,32,99,111,100,101,32,108,101,110,103,116,104,115,32,115,101,116,0,0,0,0,105,110,118,97,108,105,100,32,111,114,32,105,110,99,111,109,112,108,101,116,101,32,100,101,102,108,97,116,101,32,100,97,116,97,10,0,116,111,111,32,109,97,110,121,32,108,101,110,103,116,104,32,111,114,32,100,105,115,116,97,110,99,101,32,115,121,109,98,111,108,115,0,105,110,118,97,108,105,100,32,99,111,109,112,114,101,115,115,105,111,110,32,108,101,118,101,108,10,0,0,98,117,102,102,101,114,32,101,114,114,111,114,0,0,0,0,105,110,118,97,108,105,100,32,115,116,111,114,101,100,32,98,108,111,99,107,32,108,101,110,103,116,104,115,0,0,0,0,105,110,118,97,108,105,100,32,100,105,115,116,97,110,99,101,32,116,111,111,32,102,97,114,32,98,97,99,107,0,0,0,101,114,114,111,114,32,119,114,105,116,105,110,103,32,115,116,100,111,117,116,10,0,0,0,105,110,115,117,102,102,105,99,105,101,110,116,32,109,101,109,111,114,121,0,105,110,118,97,108,105,100,32,98,108,111,99,107,32,116,121,112,101,0,0,101,114,114,111,114,32,114,101,97,100,105,110,103,32,115,116,100,105,110,10,0,0,0,0,104,101,97,100,101,114,32,99,114,99,32,109,105,115,109,97,116,99,104,0,122,112,105,112,101,58,32,0,115,116,114,101,97,109,32,101,114,114,111,114,0,0,0,0,117,110,107,110,111,119,110,32,104,101,97,100,101,114,32,102,108,97,103,115,32,115,101,116,0,0,0,0,114,101,116,32,61,61,32,90,95,83,84,82,69,65,77,95,69,78,68,0,105,110,118,97,108,105,100,32,119,105,110,100,111,119,32,115,105,122,101,0,115,116,114,109,46,97,118,97,105,108,95,105,110,32,61,61,32,48,0,0,105,110,118,97,108,105,100,32,108,105,116,101,114,97,108,47,108,101,110,103,116,104,32,99,111,100,101,0,117,110,107,110,111,119,110,32,99,111,109,112,114,101,115,115,105,111,110,32,109,101,116,104,111,100,0,0,114,101,116,32,33,61,32,90,95,83,84,82,69,65,77,95,69,82,82,79,82,0,0,0,105,110,99,111,114,114,101,99,116,32,108,101,110,103,116,104,32,99,104,101,99,107,0,0,105,110,118,97,108,105,100,32,100,105,115,116,97,110,99,101,32,99,111,100,101,0,0,0,105,110,99,111,114,114,101,99,116,32,100,97,116,97,32,99,104,101,99,107,0,0,0,0,105,110,118,97,108,105,100,32,100,105,115,116,97,110,99,101,115,32,115,101,116,0,0,0,122,112,105,112,101,32,117,115,97,103,101,58,32,122,112,105,112,101,32,91,45,100,93,32,60,32,115,111,117,114,99,101,32,62,32,100,101,115,116,10,0,0,0,0,105,110,118,97,108,105,100,32,108,105,116,101,114,97,108,47,108,101,110,103,116,104,115,32,115,101,116,0,45,100,0,0,105,110,99,111,114,114,101,99,116,32,104,101,97,100,101,114,32,99,104,101,99,107,0,0,105,110,118,97,108,105,100,32,99,111,100,101,32,45,45,32,109,105,115,115,105,110,103,32,101,110,100,45,111,102,45,98,108,111,99,107,0,0,0,0,122,108,105,98,32,118,101,114,115,105,111,110,32,109,105,115,109,97,116,99,104,33,10,0,105,110,118,97,108,105,100,32,98,105,116,32,108,101,110,103,116,104,32,114,101,112,101,97,116,0,0,0,111,117,116,32,111,102,32,109,101,109,111,114,121,10,0,0,122,112,105,112,101,46,99,0,49,46,50,46,53,0,0,0,0,1,2,3,4,5,6,7,8,8,9,9,10,10,11,11,12,12,12,12,13,13,13,13,14,14,14,14,15,15,15,15,16,16,16,16,16,16,16,16,17,17,17,17,17,17,17,17,18,18,18,18,18,18,18,18,19,19,19,19,19,19,19,19,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,21,21,21,21,21,21,21,21,21,21,21,21,21,21,21,21,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,23,23,23,23,23,23,23,23,23,23,23,23,23,23,23,23,24,24,24,24,24,24,24,24,24,24,24,24,24,24,24,24,24,24,24,24,24,24,24,24,24,24,24,24,24,24,24,24,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,27,27,27,27,27,27,27,27,27,27,27,27,27,27,27,27,27,27,27,27,27,27,27,27,27,27,27,27,27,27,27,28,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,2,3,4,4,5,5,6,6,6,6,7,7,7,7,8,8,8,8,8,8,8,8,9,9,9,9,9,9,9,9,10,10,10,10,10,10,10,10,10,10,10,10,10,10,10,10,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,0,0,16,17,18,18,19,19,20,20,20,20,21,21,21,21,22,22,22,22,22,22,22,22,23,23,23,23,23,23,23,23,24,24,24,24,24,24,24,24,24,24,24,24,24,24,24,24,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,27,27,27,27,27,27,27,27,27,27,27,27,27,27,27,27,27,27,27,27,27,27,27,27,27,27,27,27,27,27,27,27,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,105,110,102,0,100,101,102,0])
, "i8", ALLOC_NONE, TOTAL_STACK)
function runPostSets() {
}
if (!awaitingMemoryInitializer) runPostSets();
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
        Browser.init();
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
          if (val === null || val === 10) {
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
        if (FS.streams[2] && FS.streams[2].object.output.buffer.length > 0) FS.streams[2].object.output(10);
        if (FS.streams[3] && FS.streams[3].object.output.buffer.length > 0) FS.streams[3].object.output(10);
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
          HEAP8[((buf++)|0)]=stream.ungotten.pop()
          nbyte--;
          bytesRead++;
        }
        var contents = stream.object.contents;
        var size = Math.min(contents.length - offset, nbyte);
        if (contents.subarray) { // typed array
          HEAPU8.set(contents.subarray(offset, offset+size), buf);
        } else
        if (contents.slice) { // normal array
          for (var i = 0; i < size; i++) {
            HEAP8[(((buf)+(i))|0)]=contents[offset + i]
          }
        } else {
          for (var i = 0; i < size; i++) { // LazyUint8Array from sync binary XHR
            HEAP8[(((buf)+(i))|0)]=contents.get(offset + i)
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
              HEAP8[((buf++)|0)]=stream.ungotten.pop()
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
              HEAP8[(((buf)+(i))|0)]=result
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
          contents[offset + i] = HEAPU8[(((buf)+(i))|0)];
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
                stream.object.output(HEAP8[(((buf)+(i))|0)]);
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
        var x = HEAPU8[(((px)+(i))|0)];
        var y = HEAPU8[(((py)+(i))|0)];
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
  function _memset(ptr, value, num) {
      ptr = ptr|0; value = value|0; num = num|0;
      var stop = 0, value4 = 0, stop4 = 0, unaligned = 0;
      stop = (ptr + num)|0;
      if ((num|0) >= 20) {
        // This is unaligned, but quite large, so work hard to get to aligned settings
        value = value & 0xff;
        unaligned = ptr & 3;
        value4 = value | (value << 8) | (value << 16) | (value << 24);
        stop4 = stop & ~3;
        if (unaligned) {
          unaligned = (ptr + 4 - unaligned)|0;
          while ((ptr|0) < (unaligned|0)) { // no need to check for stop, since we have large num
            HEAP8[(ptr)]=value;
            ptr = (ptr+1)|0;
          }
        }
        while ((ptr|0) < (stop4|0)) {
          HEAP32[((ptr)>>2)]=value4;
          ptr = (ptr+4)|0;
        }
      }
      while ((ptr|0) < (stop|0)) {
        HEAP8[(ptr)]=value;
        ptr = (ptr+1)|0;
      }
    }var _llvm_memset_p0i8_i32=_memset;
  function _memcpy(dest, src, num) {
      dest = dest|0; src = src|0; num = num|0;
      var ret = 0;
      ret = dest|0;
      if ((dest&3) == (src&3)) {
        while (dest & 3) {
          if ((num|0) == 0) return ret|0;
          HEAP8[(dest)]=HEAP8[(src)];
          dest = (dest+1)|0;
          src = (src+1)|0;
          num = (num-1)|0;
        }
        while ((num|0) >= 4) {
          HEAP32[((dest)>>2)]=HEAP32[((src)>>2)];
          dest = (dest+4)|0;
          src = (src+4)|0;
          num = (num-4)|0;
        }
      }
      while ((num|0) > 0) {
        HEAP8[(dest)]=HEAP8[(src)];
        dest = (dest+1)|0;
        src = (src+1)|0;
        num = (num-1)|0;
      }
      return ret|0;
    }var _llvm_memcpy_p0i8_p0i8_i32=_memcpy;
  function _abort() {
      ABORT = true;
      throw 'abort() at ' + (new Error().stack);
    }
  function ___errno_location() {
      return ___setErrNo.ret;
    }var ___errno=___errno_location;
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
        case 10: return 1;
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
  function _llvm_lifetime_start() {}
  function _llvm_lifetime_end() {}
  function _strlen(ptr) {
      ptr = ptr|0;
      var curr = 0;
      curr = ptr;
      while (HEAP8[(curr)]|0 != 0) {
        curr = (curr + 1)|0;
      }
      return (curr - ptr)|0;
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
        }},isFullScreen:false,pointerLock:false,moduleContextCreatedCallbacks:[],workers:[],init:function () {
        if (Browser.initted) return;
        Browser.initted = true;
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
            'jpeg': 'image/jpeg',
            'png': 'image/png',
            'bmp': 'image/bmp',
            'ogg': 'audio/ogg',
            'wav': 'audio/wav',
            'mp3': 'audio/mpeg'
          }[name.substr(name.lastIndexOf('.')+1)];
        }
        if (!Module["preloadPlugins"]) Module["preloadPlugins"] = [];
        var imagePlugin = {};
        imagePlugin['canHandle'] = function(name) {
          return !Module.noImageDecoding && /\.(jpg|jpeg|png|bmp)$/.exec(name);
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
          return !Module.noAudioDecoding && name.substr(-4) in { '.ogg': 1, '.wav': 1, '.mp3': 1 };
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
        // Canvas event setup
        var canvas = Module['canvas'];
        canvas.requestPointerLock = canvas['requestPointerLock'] ||
                                    canvas['mozRequestPointerLock'] ||
                                    canvas['webkitRequestPointerLock'];
        canvas.exitPointerLock = document['exitPointerLock'] ||
                                 document['mozExitPointerLock'] ||
                                 document['webkitExitPointerLock'];
        canvas.exitPointerLock = canvas.exitPointerLock.bind(document);
        function pointerLockChange() {
          Browser.pointerLock = document['pointerLockElement'] === canvas ||
                                document['mozPointerLockElement'] === canvas ||
                                document['webkitPointerLockElement'] === canvas;
        }
        document.addEventListener('pointerlockchange', pointerLockChange, false);
        document.addEventListener('mozpointerlockchange', pointerLockChange, false);
        document.addEventListener('webkitpointerlockchange', pointerLockChange, false);
        if (Module['elementPointerLock']) {
          canvas.addEventListener("click", function(ev) {
            if (!Browser.pointerLock && canvas.requestPointerLock) {
              canvas.requestPointerLock();
              ev.preventDefault();
            }
          }, false);
        }
      },createContext:function (canvas, useWebGL, setInModule) {
        var ctx;
        try {
          if (useWebGL) {
            ctx = canvas.getContext('experimental-webgl', {
              alpha: false
            });
          } else {
            ctx = canvas.getContext('2d');
          }
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
          Browser.init();
        }
        return ctx;
      },destroyContext:function (canvas, useWebGL, setInModule) {},fullScreenHandlersInstalled:false,lockPointer:undefined,resizeCanvas:undefined,requestFullScreen:function (lockPointer, resizeCanvas) {
        this.lockPointer = lockPointer;
        this.resizeCanvas = resizeCanvas;
        if (typeof this.lockPointer === 'undefined') this.lockPointer = true;
        if (typeof this.resizeCanvas === 'undefined') this.resizeCanvas = false;
        var canvas = Module['canvas'];
        function fullScreenChange() {
          Browser.isFullScreen = false;
          if ((document['webkitFullScreenElement'] || document['webkitFullscreenElement'] ||
               document['mozFullScreenElement'] || document['mozFullscreenElement'] ||
               document['fullScreenElement'] || document['fullscreenElement']) === canvas) {
            canvas.cancelFullScreen = document['cancelFullScreen'] ||
                                      document['mozCancelFullScreen'] ||
                                      document['webkitCancelFullScreen'];
            canvas.cancelFullScreen = canvas.cancelFullScreen.bind(document);
            if (Browser.lockPointer) canvas.requestPointerLock();
            Browser.isFullScreen = true;
            if (Browser.resizeCanvas) Browser.setFullScreenCanvasSize();
          } else if (Browser.resizeCanvas){
            Browser.setWindowedCanvasSize();
          }
          if (Module['onFullScreen']) Module['onFullScreen'](Browser.isFullScreen);
        }
        if (!this.fullScreenHandlersInstalled) {
          this.fullScreenHandlersInstalled = true;
          document.addEventListener('fullscreenchange', fullScreenChange, false);
          document.addEventListener('mozfullscreenchange', fullScreenChange, false);
          document.addEventListener('webkitfullscreenchange', fullScreenChange, false);
        }
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
          if (xhr.status == 200 || (xhr.status == 0 && xhr.response)) { // file URLs can return 0
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
      },windowedWidth:0,windowedHeight:0,setFullScreenCanvasSize:function () {
        var canvas = Module['canvas'];
        this.windowedWidth = canvas.width;
        this.windowedHeight = canvas.height;
        canvas.width = screen.width;
        canvas.height = screen.height;
        var flags = HEAPU32[((SDL.screen+Runtime.QUANTUM_SIZE*0)>>2)];
        flags = flags | 0x00800000; // set SDL_FULLSCREEN flag
        HEAP32[((SDL.screen+Runtime.QUANTUM_SIZE*0)>>2)]=flags
        Browser.updateResizeListeners();
      },setWindowedCanvasSize:function () {
        var canvas = Module['canvas'];
        canvas.width = this.windowedWidth;
        canvas.height = this.windowedHeight;
        var flags = HEAPU32[((SDL.screen+Runtime.QUANTUM_SIZE*0)>>2)];
        flags = flags & ~0x00800000; // clear SDL_FULLSCREEN flag
        HEAP32[((SDL.screen+Runtime.QUANTUM_SIZE*0)>>2)]=flags
        Browser.updateResizeListeners();
      }};
__ATINIT__.unshift({ func: function() { if (!Module["noFSInit"] && !FS.init.initialized) FS.init() } });__ATMAIN__.push({ func: function() { FS.ignorePermissions = false } });__ATEXIT__.push({ func: function() { FS.quit() } });Module["FS_createFolder"] = FS.createFolder;Module["FS_createPath"] = FS.createPath;Module["FS_createDataFile"] = FS.createDataFile;Module["FS_createPreloadedFile"] = FS.createPreloadedFile;Module["FS_createLazyFile"] = FS.createLazyFile;Module["FS_createLink"] = FS.createLink;Module["FS_createDevice"] = FS.createDevice;
___setErrNo(0);
Module["requestFullScreen"] = function(lockPointer, resizeCanvas) { Browser.requestFullScreen(lockPointer, resizeCanvas) };
  Module["requestAnimationFrame"] = function(func) { Browser.requestAnimationFrame(func) };
  Module["pauseMainLoop"] = function() { Browser.mainLoop.pause() };
  Module["resumeMainLoop"] = function() { Browser.mainLoop.resume() };
var FUNCTION_TABLE = [0,0,_deflate_fast,0,_zcalloc,0,_deflate_slow,0,_deflate_stored,0,_zcfree,0];
// EMSCRIPTEN_START_FUNCS
function _zerr(r1){_fwrite(5255904,7,1,HEAP32[_stderr>>2]);if((r1|0)==-1){if((_ferror(HEAP32[_stdin>>2])|0)!=0){_fwrite(5255860,20,1,HEAP32[_stderr>>2])}if((_ferror(HEAP32[_stdout>>2])|0)==0){return}_fwrite(5255796,21,1,HEAP32[_stderr>>2]);return}else if((r1|0)==-2){_fwrite(5255688,26,1,HEAP32[_stderr>>2]);return}else if((r1|0)==-3){_fwrite(5255616,35,1,HEAP32[_stderr>>2]);return}else if((r1|0)==-4){_fwrite(5256384,14,1,HEAP32[_stderr>>2]);return}else if((r1|0)==-6){_fwrite(5256332,23,1,HEAP32[_stderr>>2]);return}else{return}}function _main(r1,r2){var r3,r4,r5;r3=0;if((r1|0)==1){r4=_def(HEAP32[_stdin>>2],HEAP32[_stdout>>2],-1);if((r4|0)==0){r5=0;return r5}_zerr(r4);r5=r4;return r5}else if((r1|0)==2){r3=21}do{if(r3==21){if((_strcmp(HEAP32[r2+4>>2],5256264)|0)!=0){break}r1=_inf(HEAP32[_stdin>>2],HEAP32[_stdout>>2]);if((r1|0)==0){r5=0;return r5}_zerr(r1);r5=r1;return r5}}while(0);_fwrite(5256192,40,1,HEAP32[_stderr>>2]);r5=1;return r5}function _def(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31;r4=0;r5=STACKTOP;STACKTOP=STACKTOP+32824|0;r6=r5;HEAP32[r6+32>>2]=0;r7=(r6+36|0)>>2;HEAP32[r7]=0;r8=(r6+40|0)>>2;HEAP32[r8]=0;r9=r6;r10=_deflateInit2_(r9,r3,8,15,8,0,5256408,56);if((r10|0)!=0){r11=r10;STACKTOP=r5;return r11}r10=r5+56|0;r3=r6+4|0;r12=r6|0;r13=(r6+16|0)>>2;r14=r5+16440|0;r15=r6+12|0;L39:while(1){HEAP32[r3>>2]=_fread(r10,1,16384,r1);if((_ferror(r1)|0)!=0){r4=34;break}r16=(_feof(r1)|0)!=0;r17=r16?4:0;HEAP32[r12>>2]=r10;while(1){HEAP32[r13]=16384;HEAP32[r15>>2]=r14;r18=_deflate(r9,r17);if((r18|0)==-2){r4=47;break L39}r19=16384-HEAP32[r13]|0;if((_fwrite(r14,1,r19,r2)|0)!=(r19|0)){r4=50;break L39}if((_ferror(r2)|0)!=0){r4=50;break L39}if((HEAP32[r13]|0)!=0){break}}if((HEAP32[r3>>2]|0)!=0){r4=63;break}if(r16){r4=65;break}}if(r4==34){r3=(r6+28|0)>>2;r13=HEAP32[r3];if((r13|0)==0){r11=-1;STACKTOP=r5;return r11}r2=HEAP32[r13+4>>2];if(!((r2|0)==666|(r2|0)==113|(r2|0)==103|(r2|0)==91|(r2|0)==73|(r2|0)==69|(r2|0)==42)){r11=-1;STACKTOP=r5;return r11}r2=HEAP32[r13+8>>2];if((r2|0)==0){r20=r13}else{FUNCTION_TABLE[HEAP32[r7]](HEAP32[r8],r2);r20=HEAP32[r3]}r2=HEAP32[r20+68>>2];if((r2|0)==0){r21=r20}else{FUNCTION_TABLE[HEAP32[r7]](HEAP32[r8],r2);r21=HEAP32[r3]}r2=HEAP32[r21+64>>2];if((r2|0)==0){r22=r21}else{FUNCTION_TABLE[HEAP32[r7]](HEAP32[r8],r2);r22=HEAP32[r3]}r2=HEAP32[r22+56>>2];if((r2|0)==0){r23=r22}else{FUNCTION_TABLE[HEAP32[r7]](HEAP32[r8],r2);r23=HEAP32[r3]}FUNCTION_TABLE[HEAP32[r7]](HEAP32[r8],r23);HEAP32[r3]=0;r11=-1;STACKTOP=r5;return r11}else if(r4==47){___assert_func(5256400,68,5257660,5256072)}else if(r4==50){r3=(r6+28|0)>>2;r23=HEAP32[r3];if((r23|0)==0){r11=-1;STACKTOP=r5;return r11}r2=HEAP32[r23+4>>2];if(!((r2|0)==666|(r2|0)==113|(r2|0)==103|(r2|0)==91|(r2|0)==73|(r2|0)==69|(r2|0)==42)){r11=-1;STACKTOP=r5;return r11}r2=HEAP32[r23+8>>2];if((r2|0)==0){r24=r23}else{FUNCTION_TABLE[HEAP32[r7]](HEAP32[r8],r2);r24=HEAP32[r3]}r2=HEAP32[r24+68>>2];if((r2|0)==0){r25=r24}else{FUNCTION_TABLE[HEAP32[r7]](HEAP32[r8],r2);r25=HEAP32[r3]}r2=HEAP32[r25+64>>2];if((r2|0)==0){r26=r25}else{FUNCTION_TABLE[HEAP32[r7]](HEAP32[r8],r2);r26=HEAP32[r3]}r2=HEAP32[r26+56>>2];if((r2|0)==0){r27=r26}else{FUNCTION_TABLE[HEAP32[r7]](HEAP32[r8],r2);r27=HEAP32[r3]}FUNCTION_TABLE[HEAP32[r7]](HEAP32[r8],r27);HEAP32[r3]=0;r11=-1;STACKTOP=r5;return r11}else if(r4==63){___assert_func(5256400,75,5257660,5255996)}else if(r4==65){if((r18|0)!=1){___assert_func(5256400,79,5257660,5255956)}r18=(r6+28|0)>>2;r6=HEAP32[r18];if((r6|0)==0){r11=0;STACKTOP=r5;return r11}r4=HEAP32[r6+4>>2];if(!((r4|0)==666|(r4|0)==113|(r4|0)==103|(r4|0)==91|(r4|0)==73|(r4|0)==69|(r4|0)==42)){r11=0;STACKTOP=r5;return r11}r4=HEAP32[r6+8>>2];if((r4|0)==0){r28=r6}else{FUNCTION_TABLE[HEAP32[r7]](HEAP32[r8],r4);r28=HEAP32[r18]}r4=HEAP32[r28+68>>2];if((r4|0)==0){r29=r28}else{FUNCTION_TABLE[HEAP32[r7]](HEAP32[r8],r4);r29=HEAP32[r18]}r4=HEAP32[r29+64>>2];if((r4|0)==0){r30=r29}else{FUNCTION_TABLE[HEAP32[r7]](HEAP32[r8],r4);r30=HEAP32[r18]}r4=HEAP32[r30+56>>2];if((r4|0)==0){r31=r30}else{FUNCTION_TABLE[HEAP32[r7]](HEAP32[r8],r4);r31=HEAP32[r18]}FUNCTION_TABLE[HEAP32[r7]](HEAP32[r8],r31);HEAP32[r18]=0;r11=0;STACKTOP=r5;return r11}}function _inf(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35;r3=0;r4=STACKTOP;STACKTOP=STACKTOP+32824|0;r5=r4,r6=r5>>2;r7=r4+56;r8=r4+16440;r9=(r5+36|0)>>2;r10=(r5+40|0)>>2;r11=r5+4|0;HEAP32[r11>>2]=0;r12=r5|0;HEAP32[r12>>2]=0;r13=r5+24|0;HEAP32[r13>>2]=0;HEAP32[r6+8]=4;HEAP32[r10]=0;HEAP32[r9]=10;r14=_malloc(7116);if((r14|0)==0){r15=-4;STACKTOP=r4;return r15}r16=(r5+28|0)>>2;HEAP32[r16]=r14;HEAP32[r14+52>>2]=0;r17=HEAP32[r16];do{if((r17|0)!=0){r18=r17+52|0;r19=HEAP32[r18>>2];r20=r17+36|0;do{if((r19|0)!=0){if((HEAP32[r20>>2]|0)==15){break}FUNCTION_TABLE[HEAP32[r9]](HEAP32[r10],r19);HEAP32[r18>>2]=0}}while(0);HEAP32[r17+8>>2]=1;HEAP32[r20>>2]=15;r18=HEAP32[r16],r19=r18>>2;if((r18|0)==0){break}HEAP32[r19+10]=0;HEAP32[r19+11]=0;HEAP32[r19+12]=0;r19=HEAP32[r16],r18=r19>>2;if((r19|0)==0){break}HEAP32[r18+7]=0;HEAP32[r6+5]=0;HEAP32[r6+2]=0;HEAP32[r13>>2]=0;r21=HEAP32[r18+2];if((r21|0)!=0){HEAP32[r6+12]=r21&1}HEAP32[r18]=0;HEAP32[r18+1]=0;HEAP32[r18+3]=0;HEAP32[r18+5]=32768;HEAP32[r18+8]=0;HEAP32[r18+14]=0;HEAP32[r18+15]=0;r21=r19+1328|0;HEAP32[r18+27]=r21;HEAP32[r18+20]=r21;HEAP32[r18+19]=r21;HEAP32[r18+1776]=1;HEAP32[r18+1777]=-1;r18=r7|0;r21=(r5+16|0)>>2;r19=r8|0;r22=r5+12|0;r23=0;L130:while(1){r24=_fread(r18,1,16384,r1);HEAP32[r11>>2]=r24;if((_ferror(r1)|0)!=0){r3=101;break}if((r24|0)==0){r25=r23;r3=125;break}HEAP32[r12>>2]=r18;while(1){HEAP32[r21]=16384;HEAP32[r22>>2]=r19;r26=_inflate(r5,0);if((r26|0)==-2){r3=109;break L130}else if((r26|0)==2){r3=110;break L130}else if((r26|0)==-3|(r26|0)==-4){r27=r26;break L130}r24=16384-HEAP32[r21]|0;if((_fwrite(r19,1,r24,r2)|0)!=(r24|0)){r3=118;break L130}if((_ferror(r2)|0)!=0){r3=118;break L130}if((HEAP32[r21]|0)!=0){break}}if((r26|0)==1){r25=1;r3=125;break}else{r23=r26}}if(r3==101){r23=HEAP32[r16];if((r23|0)==0){r15=-1;STACKTOP=r4;return r15}r21=HEAP32[r9];if((r21|0)==0){r15=-1;STACKTOP=r4;return r15}r19=HEAP32[r23+52>>2];if((r19|0)==0){r28=r21;r29=r23}else{FUNCTION_TABLE[r21](HEAP32[r10],r19);r28=HEAP32[r9];r29=HEAP32[r16]}FUNCTION_TABLE[r28](HEAP32[r10],r29);HEAP32[r16]=0;r15=-1;STACKTOP=r4;return r15}else if(r3==125){r19=HEAP32[r16];do{if((r19|0)!=0){r21=HEAP32[r9];if((r21|0)==0){break}r23=HEAP32[r19+52>>2];if((r23|0)==0){r30=r21;r31=r19}else{FUNCTION_TABLE[r21](HEAP32[r10],r23);r30=HEAP32[r9];r31=HEAP32[r16]}FUNCTION_TABLE[r30](HEAP32[r10],r31);HEAP32[r16]=0}}while(0);r15=(r25|0)==1?0:-3;STACKTOP=r4;return r15}else if(r3==109){___assert_func(5256400,126,5257656,5256072)}else if(r3==110){r27=-3}else if(r3==118){r19=HEAP32[r16];if((r19|0)==0){r15=-1;STACKTOP=r4;return r15}r23=HEAP32[r9];if((r23|0)==0){r15=-1;STACKTOP=r4;return r15}r21=HEAP32[r19+52>>2];if((r21|0)==0){r32=r23;r33=r19}else{FUNCTION_TABLE[r23](HEAP32[r10],r21);r32=HEAP32[r9];r33=HEAP32[r16]}FUNCTION_TABLE[r32](HEAP32[r10],r33);HEAP32[r16]=0;r15=-1;STACKTOP=r4;return r15}r21=HEAP32[r16];if((r21|0)==0){r15=r27;STACKTOP=r4;return r15}r23=HEAP32[r9];if((r23|0)==0){r15=r27;STACKTOP=r4;return r15}r19=HEAP32[r21+52>>2];if((r19|0)==0){r34=r23;r35=r21}else{FUNCTION_TABLE[r23](HEAP32[r10],r19);r34=HEAP32[r9];r35=HEAP32[r16]}FUNCTION_TABLE[r34](HEAP32[r10],r35);HEAP32[r16]=0;r15=r27;STACKTOP=r4;return r15}}while(0);FUNCTION_TABLE[HEAP32[r9]](HEAP32[r10],r14);HEAP32[r16]=0;r15=-2;STACKTOP=r4;return r15}function _deflateInit2_(r1,r2,r3,r4,r5,r6,r7,r8){var r9,r10,r11,r12,r13,r14,r15;if((r7|0)==0){r9=-6;return r9}if(!(HEAP8[r7]<<24>>24==49&(r8|0)==56)){r9=-6;return r9}if((r1|0)==0){r9=-2;return r9}r8=r1+24|0;HEAP32[r8>>2]=0;r7=(r1+32|0)>>2;r10=HEAP32[r7];if((r10|0)==0){HEAP32[r7]=4;HEAP32[r1+40>>2]=0;r11=4}else{r11=r10}r10=r1+36|0;if((HEAP32[r10>>2]|0)==0){HEAP32[r10>>2]=10}r10=(r2|0)==-1?6:r2;if((r4|0)<0){r12=0;r13=-r4|0}else{r2=(r4|0)>15;r12=r2?2:1;r13=r2?r4-16|0:r4}if(!((r5-1|0)>>>0<9&(r3|0)==8)){r9=-2;return r9}if((r13-8|0)>>>0>7|r10>>>0>9|r6>>>0>4){r9=-2;return r9}r3=(r13|0)==8?9:r13;r13=(r1+40|0)>>2;r4=FUNCTION_TABLE[r11](HEAP32[r13],1,5828),r11=r4>>2;if((r4|0)==0){r9=-4;return r9}HEAP32[r1+28>>2]=r4;HEAP32[r11]=r1;HEAP32[r11+6]=r12;HEAP32[r11+7]=0;HEAP32[r11+12]=r3;r12=1<<r3;r3=r4+44|0;HEAP32[r3>>2]=r12;HEAP32[r11+13]=r12-1|0;r2=r5+7|0;HEAP32[r11+20]=r2;r14=1<<r2;r2=r4+76|0;HEAP32[r2>>2]=r14;HEAP32[r11+21]=r14-1|0;HEAP32[r11+22]=Math.floor(((r5+9|0)>>>0)/3);r14=r4+56|0;HEAP32[r14>>2]=FUNCTION_TABLE[HEAP32[r7]](HEAP32[r13],r12,2);r12=r4+64|0;HEAP32[r12>>2]=FUNCTION_TABLE[HEAP32[r7]](HEAP32[r13],HEAP32[r3>>2],2);r3=r4+68|0;HEAP32[r3>>2]=FUNCTION_TABLE[HEAP32[r7]](HEAP32[r13],HEAP32[r2>>2],2);HEAP32[r11+1456]=0;r2=1<<r5+6;r5=r4+5788|0;HEAP32[r5>>2]=r2;r15=FUNCTION_TABLE[HEAP32[r7]](HEAP32[r13],r2,4);r2=r15;HEAP32[r11+2]=r15;r13=HEAP32[r5>>2];HEAP32[r11+3]=r13<<2;do{if((HEAP32[r14>>2]|0)!=0){if((HEAP32[r12>>2]|0)==0){break}if((HEAP32[r3>>2]|0)==0|(r15|0)==0){break}HEAP32[r11+1449]=(r13>>>1<<1)+r2|0;HEAP32[r11+1446]=r15+(r13*3&-1)|0;HEAP32[r11+33]=r10;HEAP32[r11+34]=r6;HEAP8[r4+36|0]=8;r9=_deflateReset(r1);return r9}}while(0);HEAP32[r11+1]=666;HEAP32[r8>>2]=5255820;_deflateEnd(r1);r9=-4;return r9}function _deflateEnd(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12;r2=r1>>2;if((r1|0)==0){r3=-2;return r3}r4=(r1+28|0)>>2;r5=HEAP32[r4];if((r5|0)==0){r3=-2;return r3}r6=HEAP32[r5+4>>2];if(!((r6|0)==666|(r6|0)==113|(r6|0)==103|(r6|0)==91|(r6|0)==73|(r6|0)==69|(r6|0)==42)){r3=-2;return r3}r7=HEAP32[r5+8>>2];if((r7|0)==0){r8=r5}else{FUNCTION_TABLE[HEAP32[r2+9]](HEAP32[r2+10],r7);r8=HEAP32[r4]}r7=HEAP32[r8+68>>2];if((r7|0)==0){r9=r8}else{FUNCTION_TABLE[HEAP32[r2+9]](HEAP32[r2+10],r7);r9=HEAP32[r4]}r7=HEAP32[r9+64>>2];if((r7|0)==0){r10=r9}else{FUNCTION_TABLE[HEAP32[r2+9]](HEAP32[r2+10],r7);r10=HEAP32[r4]}r7=HEAP32[r10+56>>2];r2=r1+36|0;if((r7|0)==0){r11=r10;r12=r1+40|0}else{r10=r1+40|0;FUNCTION_TABLE[HEAP32[r2>>2]](HEAP32[r10>>2],r7);r11=HEAP32[r4];r12=r10}FUNCTION_TABLE[HEAP32[r2>>2]](HEAP32[r12>>2],r11);HEAP32[r4]=0;r3=(r6|0)==113?-3:0;return r3}function _deflateReset(r1){var r2,r3,r4,r5,r6,r7,r8;r2=r1>>2;if((r1|0)==0){r3=-2;return r3}r4=r1+28|0;r1=HEAP32[r4>>2];if((r1|0)==0){r3=-2;return r3}if((HEAP32[r2+8]|0)==0){r3=-2;return r3}if((HEAP32[r2+9]|0)==0){r3=-2;return r3}HEAP32[r2+5]=0;HEAP32[r2+2]=0;HEAP32[r2+6]=0;HEAP32[r2+11]=2;HEAP32[r1+20>>2]=0;HEAP32[r1+16>>2]=HEAP32[r1+8>>2];r5=r1+24|0;r6=HEAP32[r5>>2];if((r6|0)<0){r7=-r6|0;HEAP32[r5>>2]=r7;r8=r7}else{r8=r6}HEAP32[r1+4>>2]=(r8|0)!=0?42:113;HEAP32[r2+12]=(r8|0)!=2&1;HEAP32[r1+40>>2]=0;HEAP32[r1+2840>>2]=r1+148|0;HEAP32[r1+2848>>2]=5244032;HEAP32[r1+2852>>2]=r1+2440|0;HEAP32[r1+2860>>2]=5244172;HEAP32[r1+2864>>2]=r1+2684|0;HEAP32[r1+2872>>2]=5244192;HEAP16[r1+5816>>1]=0;HEAP32[r1+5820>>2]=0;_init_block(r1);r1=HEAP32[r4>>2],r4=r1>>2;HEAP32[r4+15]=HEAP32[r4+11]<<1;r8=r1+76|0;r2=r1+68|0;HEAP16[HEAP32[r2>>2]+(HEAP32[r8>>2]-1<<1)>>1]=0;_memset(HEAP32[r2>>2],0,(HEAP32[r8>>2]<<1)-2|0);r8=HEAP32[r4+33];HEAP32[r4+32]=HEAPU16[(r8*12&-1)+5255214>>1];HEAP32[r4+35]=HEAPU16[(r8*12&-1)+5255212>>1];HEAP32[r4+36]=HEAPU16[(r8*12&-1)+5255216>>1];HEAP32[r4+31]=HEAPU16[(r8*12&-1)+5255218>>1];HEAP32[r4+27]=0;HEAP32[r4+23]=0;HEAP32[r4+29]=0;HEAP32[r4+1453]=0;HEAP32[r4+30]=2;HEAP32[r4+24]=2;HEAP32[r4+26]=0;HEAP32[r4+18]=0;r3=0;return r3}function _fill_window(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35;r2=r1+44|0;r3=HEAP32[r2>>2];r4=r1+60|0;r5=(r1+116|0)>>2;r6=(r1+108|0)>>2;r7=r3-262|0;r8=r1|0;r9=(r1+56|0)>>2;r10=(r1+5812|0)>>2;r11=(r1+72|0)>>2;r12=r1+88|0;r13=r1+84|0;r14=(r1+68|0)>>2;r15=r1+52|0;r16=r1+64|0;r17=r1+112|0;r18=r1+92|0;r19=r1+76|0;r20=HEAP32[r5];r21=r3;while(1){r22=HEAP32[r6];r23=HEAP32[r4>>2]-r20-r22|0;if(r22>>>0<(r7+r21|0)>>>0){r24=r23}else{r22=HEAP32[r9];_memcpy(r22,r22+r3|0,r3);HEAP32[r17>>2]=HEAP32[r17>>2]-r3|0;HEAP32[r6]=HEAP32[r6]-r3|0;HEAP32[r18>>2]=HEAP32[r18>>2]-r3|0;r22=HEAP32[r19>>2];r25=r22;r26=(r22<<1)+HEAP32[r14]|0;while(1){r22=r26-2|0;r27=HEAPU16[r22>>1];if(r27>>>0<r3>>>0){r28=0}else{r28=r27-r3&65535}HEAP16[r22>>1]=r28;r27=r25-1|0;if((r27|0)==0){break}else{r25=r27;r26=r22}}r26=r3;r25=(r3<<1)+HEAP32[r16>>2]|0;while(1){r22=r25-2|0;r27=HEAPU16[r22>>1];if(r27>>>0<r3>>>0){r29=0}else{r29=r27-r3&65535}HEAP16[r22>>1]=r29;r27=r26-1|0;if((r27|0)==0){break}else{r26=r27;r25=r22}}r24=r23+r3|0}r25=HEAP32[r8>>2];r26=r25+4|0;r22=HEAP32[r26>>2];if((r22|0)==0){break}r27=HEAP32[r5];r30=HEAP32[r9]+r27+HEAP32[r6]|0;r31=r22>>>0>r24>>>0?r24:r22;if((r31|0)==0){r32=0;r33=r27}else{HEAP32[r26>>2]=r22-r31|0;r22=(r25|0)>>2;_memcpy(r30,HEAP32[r22],r31);r26=HEAP32[HEAP32[r25+28>>2]+24>>2];if((r26|0)==2){r27=r25+48|0;HEAP32[r27>>2]=_crc32(HEAP32[r27>>2],r30,r31)}else if((r26|0)==1){r26=r25+48|0;HEAP32[r26>>2]=_adler32(HEAP32[r26>>2],r30,r31)}HEAP32[r22]=HEAP32[r22]+r31|0;r22=r25+8|0;HEAP32[r22>>2]=HEAP32[r22>>2]+r31|0;r32=r31;r33=HEAP32[r5]}r31=r33+r32|0;HEAP32[r5]=r31;r22=HEAP32[r10];L290:do{if((r31+r22|0)>>>0>2){r25=HEAP32[r6]-r22|0;r30=HEAP32[r9];r26=HEAPU8[r30+r25|0];HEAP32[r11]=r26;HEAP32[r11]=(HEAPU8[r25+(r30+1)|0]^r26<<HEAP32[r12>>2])&HEAP32[r13>>2];r26=r25;r25=r22;r30=r31;while(1){if((r25|0)==0){r34=r30;break L290}r27=(HEAPU8[HEAP32[r9]+r26+2|0]^HEAP32[r11]<<HEAP32[r12>>2])&HEAP32[r13>>2];HEAP32[r11]=r27;HEAP16[HEAP32[r16>>2]+((HEAP32[r15>>2]&r26)<<1)>>1]=HEAP16[HEAP32[r14]+(r27<<1)>>1];HEAP16[HEAP32[r14]+(HEAP32[r11]<<1)>>1]=r26&65535;r27=HEAP32[r10]-1|0;HEAP32[r10]=r27;r35=HEAP32[r5];if((r35+r27|0)>>>0<3){r34=r35;break L290}else{r26=r26+1|0;r25=r27;r30=r35}}}else{r34=r31}}while(0);if(r34>>>0>=262){break}if((HEAP32[HEAP32[r8>>2]+4>>2]|0)==0){break}r20=r34;r21=HEAP32[r2>>2]}r2=(r1+5824|0)>>2;r1=HEAP32[r2];r21=HEAP32[r4>>2];if(r1>>>0>=r21>>>0){return}r4=HEAP32[r5]+HEAP32[r6]|0;if(r1>>>0<r4>>>0){r6=r21-r4|0;r5=r6>>>0>258?258:r6;_memset(HEAP32[r9]+r4|0,0,r5);HEAP32[r2]=r5+r4|0;return}r5=r4+258|0;if(r1>>>0>=r5>>>0){return}r4=r5-r1|0;r5=r21-r1|0;r21=r4>>>0>r5>>>0?r5:r4;_memset(HEAP32[r9]+r1|0,0,r21);HEAP32[r2]=HEAP32[r2]+r21|0;return}function _deflate(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36,r37,r38,r39,r40,r41,r42,r43,r44,r45,r46,r47,r48,r49,r50,r51,r52,r53,r54,r55,r56,r57,r58,r59,r60,r61,r62,r63,r64,r65,r66,r67,r68,r69,r70,r71,r72,r73,r74,r75,r76,r77,r78,r79,r80,r81,r82,r83,r84,r85,r86,r87,r88,r89,r90,r91,r92,r93,r94,r95,r96,r97,r98,r99,r100,r101;r3=r1>>2;r4=0;if((r1|0)==0){r5=-2;return r5}r6=(r1+28|0)>>2;r7=HEAP32[r6],r8=r7>>2;if((r7|0)==0|r2>>>0>5){r5=-2;return r5}r9=(r1+12|0)>>2;do{if((HEAP32[r9]|0)!=0){if((HEAP32[r3]|0)==0){if((HEAP32[r3+1]|0)!=0){break}}r10=(r7+4|0)>>2;r11=HEAP32[r10];r12=(r2|0)==4;if(!((r11|0)!=666|r12)){break}r13=(r1+16|0)>>2;if((HEAP32[r13]|0)==0){HEAP32[r3+6]=5255716;r5=-5;return r5}r14=(r7|0)>>2;HEAP32[r14]=r1;r15=(r7+40|0)>>2;r16=HEAP32[r15];HEAP32[r15]=r2;do{if((r11|0)==42){if((HEAP32[r8+6]|0)!=2){r17=(HEAP32[r8+12]<<12)-30720|0;do{if((HEAP32[r8+34]|0)>1){r18=0}else{r19=HEAP32[r8+33];if((r19|0)<2){r18=0;break}if((r19|0)<6){r18=64;break}r18=(r19|0)==6?128:192}}while(0);r19=r18|r17;r20=r7+108|0;r21=(HEAP32[r20>>2]|0)==0?r19:r19|32;r19=(r21|(r21>>>0)%31)^31;HEAP32[r10]=113;r21=(r7+20|0)>>2;r22=HEAP32[r21];HEAP32[r21]=r22+1|0;r23=(r7+8|0)>>2;HEAP8[HEAP32[r23]+r22|0]=r19>>>8&255;r22=HEAP32[r21];HEAP32[r21]=r22+1|0;HEAP8[HEAP32[r23]+r22|0]=r19&255;r19=(r1+48|0)>>2;if((HEAP32[r20>>2]|0)!=0){r20=HEAP32[r19];r22=HEAP32[r21];HEAP32[r21]=r22+1|0;HEAP8[HEAP32[r23]+r22|0]=r20>>>24&255;r22=HEAP32[r21];HEAP32[r21]=r22+1|0;HEAP8[HEAP32[r23]+r22|0]=r20>>>16&255;r20=HEAP32[r19];r22=HEAP32[r21];HEAP32[r21]=r22+1|0;HEAP8[HEAP32[r23]+r22|0]=r20>>>8&255;r22=HEAP32[r21];HEAP32[r21]=r22+1|0;HEAP8[HEAP32[r23]+r22|0]=r20&255}HEAP32[r19]=1;r24=HEAP32[r10];r4=267;break}r19=(r1+48|0)>>2;HEAP32[r19]=0;r20=(r7+20|0)>>2;r22=HEAP32[r20];HEAP32[r20]=r22+1|0;r23=(r7+8|0)>>2;HEAP8[HEAP32[r23]+r22|0]=31;r22=HEAP32[r20];HEAP32[r20]=r22+1|0;HEAP8[HEAP32[r23]+r22|0]=-117;r22=HEAP32[r20];HEAP32[r20]=r22+1|0;HEAP8[HEAP32[r23]+r22|0]=8;r22=r7+28|0,r21=r22>>2;r25=HEAP32[r21],r26=r25>>2;if((r25|0)==0){r25=HEAP32[r20];HEAP32[r20]=r25+1|0;HEAP8[HEAP32[r23]+r25|0]=0;r25=HEAP32[r20];HEAP32[r20]=r25+1|0;HEAP8[HEAP32[r23]+r25|0]=0;r25=HEAP32[r20];HEAP32[r20]=r25+1|0;HEAP8[HEAP32[r23]+r25|0]=0;r25=HEAP32[r20];HEAP32[r20]=r25+1|0;HEAP8[HEAP32[r23]+r25|0]=0;r25=HEAP32[r20];HEAP32[r20]=r25+1|0;HEAP8[HEAP32[r23]+r25|0]=0;r25=HEAP32[r8+33];do{if((r25|0)==9){r27=2}else{if((HEAP32[r8+34]|0)>1){r27=4;break}r27=(r25|0)<2?4:0}}while(0);r25=HEAP32[r20];HEAP32[r20]=r25+1|0;HEAP8[HEAP32[r23]+r25|0]=r27;r25=HEAP32[r20];HEAP32[r20]=r25+1|0;HEAP8[HEAP32[r23]+r25|0]=3;HEAP32[r10]=113;break}r25=((HEAP32[r26+11]|0)!=0?2:0)|(HEAP32[r26]|0)!=0&1|((HEAP32[r26+4]|0)==0?0:4)|((HEAP32[r26+7]|0)==0?0:8)|((HEAP32[r26+9]|0)==0?0:16);r17=HEAP32[r20];HEAP32[r20]=r17+1|0;HEAP8[HEAP32[r23]+r17|0]=r25;r25=HEAP32[HEAP32[r21]+4>>2]&255;r17=HEAP32[r20];HEAP32[r20]=r17+1|0;HEAP8[HEAP32[r23]+r17|0]=r25;r25=HEAP32[HEAP32[r21]+4>>2]>>>8&255;r17=HEAP32[r20];HEAP32[r20]=r17+1|0;HEAP8[HEAP32[r23]+r17|0]=r25;r25=HEAP32[HEAP32[r21]+4>>2]>>>16&255;r17=HEAP32[r20];HEAP32[r20]=r17+1|0;HEAP8[HEAP32[r23]+r17|0]=r25;r25=HEAP32[HEAP32[r21]+4>>2]>>>24&255;r17=HEAP32[r20];HEAP32[r20]=r17+1|0;HEAP8[HEAP32[r23]+r17|0]=r25;r25=HEAP32[r8+33];do{if((r25|0)==9){r28=2}else{if((HEAP32[r8+34]|0)>1){r28=4;break}r28=(r25|0)<2?4:0}}while(0);r25=HEAP32[r20];HEAP32[r20]=r25+1|0;HEAP8[HEAP32[r23]+r25|0]=r28;r25=HEAP32[HEAP32[r21]+12>>2]&255;r26=HEAP32[r20];HEAP32[r20]=r26+1|0;HEAP8[HEAP32[r23]+r26|0]=r25;r25=HEAP32[r21];if((HEAP32[r25+16>>2]|0)==0){r29=r25}else{r26=HEAP32[r25+20>>2]&255;r25=HEAP32[r20];HEAP32[r20]=r25+1|0;HEAP8[HEAP32[r23]+r25|0]=r26;r26=HEAP32[HEAP32[r21]+20>>2]>>>8&255;r25=HEAP32[r20];HEAP32[r20]=r25+1|0;HEAP8[HEAP32[r23]+r25|0]=r26;r29=HEAP32[r21]}if((HEAP32[r29+44>>2]|0)!=0){HEAP32[r19]=_crc32(HEAP32[r19],HEAP32[r23],HEAP32[r20])}HEAP32[r8+8]=0;HEAP32[r10]=69;r30=r22,r31=r30>>2;r4=269;break}else{r24=r11;r4=267}}while(0);do{if(r4==267){if((r24|0)!=69){r32=r24;r4=295;break}r30=r7+28|0,r31=r30>>2;r4=269;break}}while(0);do{if(r4==269){r11=HEAP32[r31];if((HEAP32[r11+16>>2]|0)==0){HEAP32[r10]=73;r33=r11;r4=297;break}r26=(r7+20|0)>>2;r25=HEAP32[r26];r17=(r7+32|0)>>2;r34=HEAP32[r17];L365:do{if(r34>>>0<(HEAP32[r11+20>>2]&65535)>>>0){r35=r7+12|0;r36=r1+48|0;r37=r7+8|0;r38=r1+20|0;r39=r25;r40=r11;r41=r25;r42=r34;while(1){if((r41|0)==(HEAP32[r35>>2]|0)){if((HEAP32[r40+44>>2]|0)!=0&r41>>>0>r39>>>0){HEAP32[r36>>2]=_crc32(HEAP32[r36>>2],HEAP32[r37>>2]+r39|0,r41-r39|0)}r43=HEAP32[r6];r44=(r43+5820|0)>>2;r45=HEAP32[r44];do{if((r45|0)==16){r46=(r43+5816|0)>>1;r47=HEAP16[r46]&255;r48=r43+20|0,r49=r48>>2;r50=HEAP32[r49];HEAP32[r49]=r50+1|0;r51=r43+8|0;HEAP8[HEAP32[r51>>2]+r50|0]=r47;r47=HEAPU16[r46]>>>8&255;r50=HEAP32[r49];HEAP32[r49]=r50+1|0;HEAP8[HEAP32[r51>>2]+r50|0]=r47;HEAP16[r46]=0;HEAP32[r44]=0;r46=r48,r52=r46>>2}else{if((r45|0)>7){r48=(r43+5816|0)>>1;r47=HEAP16[r48]&255;r50=r43+20|0;r51=HEAP32[r50>>2];HEAP32[r50>>2]=r51+1|0;HEAP8[HEAP32[r43+8>>2]+r51|0]=r47;HEAP16[r48]=HEAPU16[r48]>>>8;HEAP32[r44]=HEAP32[r44]-8|0;r46=r50,r52=r46>>2;break}else{r46=r43+20|0,r52=r46>>2;break}}}while(0);r44=HEAP32[r52];r45=HEAP32[r13];r46=r44>>>0>r45>>>0?r45:r44;do{if((r46|0)!=0){r44=(r43+16|0)>>2;_memcpy(HEAP32[r9],HEAP32[r44],r46);HEAP32[r9]=HEAP32[r9]+r46|0;HEAP32[r44]=HEAP32[r44]+r46|0;HEAP32[r38>>2]=HEAP32[r38>>2]+r46|0;HEAP32[r13]=HEAP32[r13]-r46|0;r45=HEAP32[r52];HEAP32[r52]=r45-r46|0;if((r45|0)!=(r46|0)){break}HEAP32[r44]=HEAP32[r43+8>>2]}}while(0);r53=HEAP32[r26];if((r53|0)==(HEAP32[r35>>2]|0)){break}r54=r53;r55=r53;r56=HEAP32[r17];r57=HEAP32[r31]}else{r54=r39;r55=r41;r56=r42;r57=r40}r43=HEAP8[HEAP32[r57+16>>2]+r56|0];HEAP32[r26]=r55+1|0;HEAP8[HEAP32[r37>>2]+r55|0]=r43;r43=HEAP32[r17]+1|0;HEAP32[r17]=r43;r46=HEAP32[r31];if(r43>>>0>=(HEAP32[r46+20>>2]&65535)>>>0){r58=r54;r59=r46;break L365}r39=r54;r40=r46;r41=HEAP32[r26];r42=r43}r58=r53;r59=HEAP32[r31]}else{r58=r25;r59=r11}}while(0);do{if((HEAP32[r59+44>>2]|0)==0){r60=r59}else{r11=HEAP32[r26];if(r11>>>0<=r58>>>0){r60=r59;break}r25=r1+48|0;HEAP32[r25>>2]=_crc32(HEAP32[r25>>2],HEAP32[r8+2]+r58|0,r11-r58|0);r60=HEAP32[r31]}}while(0);if((HEAP32[r17]|0)==(HEAP32[r60+20>>2]|0)){HEAP32[r17]=0;HEAP32[r10]=73;r33=r60;r4=297;break}else{r32=HEAP32[r10];r4=295;break}}}while(0);do{if(r4==295){if((r32|0)!=73){r61=r32;r4=321;break}r33=HEAP32[r8+7];r4=297;break}}while(0);do{if(r4==297){r26=r7+28|0,r11=r26>>2;if((HEAP32[r33+28>>2]|0)==0){HEAP32[r10]=91;r62=r26,r63=r62>>2;r4=323;break}r25=(r7+20|0)>>2;r34=HEAP32[r25];r22=r7+12|0;r20=(r1+48|0)>>2;r23=(r7+8|0)>>2;r19=r1+20|0;r21=(r7+32|0)>>2;r42=r34;r41=r34;while(1){if((r41|0)==(HEAP32[r22>>2]|0)){if((HEAP32[HEAP32[r11]+44>>2]|0)!=0&r41>>>0>r42>>>0){HEAP32[r20]=_crc32(HEAP32[r20],HEAP32[r23]+r42|0,r41-r42|0)}r34=HEAP32[r6];r40=(r34+5820|0)>>2;r39=HEAP32[r40];do{if((r39|0)==16){r37=(r34+5816|0)>>1;r35=HEAP16[r37]&255;r38=r34+20|0,r36=r38>>2;r43=HEAP32[r36];HEAP32[r36]=r43+1|0;r46=r34+8|0;HEAP8[HEAP32[r46>>2]+r43|0]=r35;r35=HEAPU16[r37]>>>8&255;r43=HEAP32[r36];HEAP32[r36]=r43+1|0;HEAP8[HEAP32[r46>>2]+r43|0]=r35;HEAP16[r37]=0;HEAP32[r40]=0;r37=r38,r64=r37>>2}else{if((r39|0)>7){r38=(r34+5816|0)>>1;r35=HEAP16[r38]&255;r43=r34+20|0;r46=HEAP32[r43>>2];HEAP32[r43>>2]=r46+1|0;HEAP8[HEAP32[r34+8>>2]+r46|0]=r35;HEAP16[r38]=HEAPU16[r38]>>>8;HEAP32[r40]=HEAP32[r40]-8|0;r37=r43,r64=r37>>2;break}else{r37=r34+20|0,r64=r37>>2;break}}}while(0);r40=HEAP32[r64];r39=HEAP32[r13];r37=r40>>>0>r39>>>0?r39:r40;do{if((r37|0)!=0){r40=(r34+16|0)>>2;_memcpy(HEAP32[r9],HEAP32[r40],r37);HEAP32[r9]=HEAP32[r9]+r37|0;HEAP32[r40]=HEAP32[r40]+r37|0;HEAP32[r19>>2]=HEAP32[r19>>2]+r37|0;HEAP32[r13]=HEAP32[r13]-r37|0;r39=HEAP32[r64];HEAP32[r64]=r39-r37|0;if((r39|0)!=(r37|0)){break}HEAP32[r40]=HEAP32[r34+8>>2]}}while(0);r34=HEAP32[r25];if((r34|0)==(HEAP32[r22>>2]|0)){r65=1;r66=r34;break}else{r67=r34;r68=r34}}else{r67=r42;r68=r41}r34=HEAP32[r21];HEAP32[r21]=r34+1|0;r69=HEAP8[HEAP32[HEAP32[r11]+28>>2]+r34|0];HEAP32[r25]=r68+1|0;HEAP8[HEAP32[r23]+r68|0]=r69;if(r69<<24>>24==0){r4=313;break}r42=r67;r41=HEAP32[r25]}if(r4==313){r65=r69&255;r66=r67}do{if((HEAP32[HEAP32[r11]+44>>2]|0)!=0){r41=HEAP32[r25];if(r41>>>0<=r66>>>0){break}HEAP32[r20]=_crc32(HEAP32[r20],HEAP32[r23]+r66|0,r41-r66|0)}}while(0);if((r65|0)==0){HEAP32[r21]=0;HEAP32[r10]=91;r62=r26,r63=r62>>2;r4=323;break}else{r61=HEAP32[r10];r4=321;break}}}while(0);do{if(r4==321){if((r61|0)!=91){r70=r61;r4=347;break}r62=r7+28|0,r63=r62>>2;r4=323;break}}while(0);do{if(r4==323){if((HEAP32[HEAP32[r63]+36>>2]|0)==0){HEAP32[r10]=103;r71=r62;r4=349;break}r23=(r7+20|0)>>2;r20=HEAP32[r23];r25=r7+12|0;r11=(r1+48|0)>>2;r41=(r7+8|0)>>2;r42=r1+20|0;r22=r7+32|0;r19=r20;r17=r20;while(1){if((r17|0)==(HEAP32[r25>>2]|0)){if((HEAP32[HEAP32[r63]+44>>2]|0)!=0&r17>>>0>r19>>>0){HEAP32[r11]=_crc32(HEAP32[r11],HEAP32[r41]+r19|0,r17-r19|0)}r20=HEAP32[r6];r34=(r20+5820|0)>>2;r37=HEAP32[r34];do{if((r37|0)==16){r40=(r20+5816|0)>>1;r39=HEAP16[r40]&255;r43=r20+20|0,r38=r43>>2;r35=HEAP32[r38];HEAP32[r38]=r35+1|0;r46=r20+8|0;HEAP8[HEAP32[r46>>2]+r35|0]=r39;r39=HEAPU16[r40]>>>8&255;r35=HEAP32[r38];HEAP32[r38]=r35+1|0;HEAP8[HEAP32[r46>>2]+r35|0]=r39;HEAP16[r40]=0;HEAP32[r34]=0;r40=r43,r72=r40>>2}else{if((r37|0)>7){r43=(r20+5816|0)>>1;r39=HEAP16[r43]&255;r35=r20+20|0;r46=HEAP32[r35>>2];HEAP32[r35>>2]=r46+1|0;HEAP8[HEAP32[r20+8>>2]+r46|0]=r39;HEAP16[r43]=HEAPU16[r43]>>>8;HEAP32[r34]=HEAP32[r34]-8|0;r40=r35,r72=r40>>2;break}else{r40=r20+20|0,r72=r40>>2;break}}}while(0);r34=HEAP32[r72];r37=HEAP32[r13];r40=r34>>>0>r37>>>0?r37:r34;do{if((r40|0)!=0){r34=(r20+16|0)>>2;_memcpy(HEAP32[r9],HEAP32[r34],r40);HEAP32[r9]=HEAP32[r9]+r40|0;HEAP32[r34]=HEAP32[r34]+r40|0;HEAP32[r42>>2]=HEAP32[r42>>2]+r40|0;HEAP32[r13]=HEAP32[r13]-r40|0;r37=HEAP32[r72];HEAP32[r72]=r37-r40|0;if((r37|0)!=(r40|0)){break}HEAP32[r34]=HEAP32[r20+8>>2]}}while(0);r20=HEAP32[r23];if((r20|0)==(HEAP32[r25>>2]|0)){r73=1;r74=r20;break}else{r75=r20;r76=r20}}else{r75=r19;r76=r17}r20=HEAP32[r22>>2];HEAP32[r22>>2]=r20+1|0;r77=HEAP8[HEAP32[HEAP32[r63]+36>>2]+r20|0];HEAP32[r23]=r76+1|0;HEAP8[HEAP32[r41]+r76|0]=r77;if(r77<<24>>24==0){r4=339;break}r19=r75;r17=HEAP32[r23]}if(r4==339){r73=r77&255;r74=r75}do{if((HEAP32[HEAP32[r63]+44>>2]|0)!=0){r17=HEAP32[r23];if(r17>>>0<=r74>>>0){break}HEAP32[r11]=_crc32(HEAP32[r11],HEAP32[r41]+r74|0,r17-r74|0)}}while(0);if((r73|0)==0){HEAP32[r10]=103;r71=r62;r4=349;break}else{r70=HEAP32[r10];r4=347;break}}}while(0);do{if(r4==347){if((r70|0)!=103){break}r71=r7+28|0;r4=349;break}}while(0);do{if(r4==349){if((HEAP32[HEAP32[r71>>2]+44>>2]|0)==0){HEAP32[r10]=113;break}r41=(r7+20|0)>>2;r11=r7+12|0;do{if((HEAP32[r41]+2|0)>>>0>HEAP32[r11>>2]>>>0){r23=HEAP32[r6];r17=(r23+5820|0)>>2;r19=HEAP32[r17];do{if((r19|0)==16){r22=(r23+5816|0)>>1;r25=HEAP16[r22]&255;r42=r23+20|0,r26=r42>>2;r21=HEAP32[r26];HEAP32[r26]=r21+1|0;r20=r23+8|0;HEAP8[HEAP32[r20>>2]+r21|0]=r25;r25=HEAPU16[r22]>>>8&255;r21=HEAP32[r26];HEAP32[r26]=r21+1|0;HEAP8[HEAP32[r20>>2]+r21|0]=r25;HEAP16[r22]=0;HEAP32[r17]=0;r22=r42,r78=r22>>2}else{if((r19|0)>7){r42=(r23+5816|0)>>1;r25=HEAP16[r42]&255;r21=r23+20|0;r20=HEAP32[r21>>2];HEAP32[r21>>2]=r20+1|0;HEAP8[HEAP32[r23+8>>2]+r20|0]=r25;HEAP16[r42]=HEAPU16[r42]>>>8;HEAP32[r17]=HEAP32[r17]-8|0;r22=r21,r78=r22>>2;break}else{r22=r23+20|0,r78=r22>>2;break}}}while(0);r17=HEAP32[r78];r19=HEAP32[r13];r22=r17>>>0>r19>>>0?r19:r17;if((r22|0)==0){break}r17=(r23+16|0)>>2;_memcpy(HEAP32[r9],HEAP32[r17],r22);HEAP32[r9]=HEAP32[r9]+r22|0;HEAP32[r17]=HEAP32[r17]+r22|0;r19=r1+20|0;HEAP32[r19>>2]=HEAP32[r19>>2]+r22|0;HEAP32[r13]=HEAP32[r13]-r22|0;r19=HEAP32[r78];HEAP32[r78]=r19-r22|0;if((r19|0)!=(r22|0)){break}HEAP32[r17]=HEAP32[r23+8>>2]}}while(0);r17=HEAP32[r41];if((r17+2|0)>>>0>HEAP32[r11>>2]>>>0){break}r22=(r1+48|0)>>2;r19=HEAP32[r22]&255;HEAP32[r41]=r17+1|0;r21=r7+8|0;HEAP8[HEAP32[r21>>2]+r17|0]=r19;r19=HEAP32[r22]>>>8&255;r17=HEAP32[r41];HEAP32[r41]=r17+1|0;HEAP8[HEAP32[r21>>2]+r17|0]=r19;HEAP32[r22]=0;HEAP32[r10]=113}}while(0);r22=(r7+20|0)>>2;do{if((HEAP32[r22]|0)==0){if((HEAP32[r3+1]|0)!=0){break}if(((r2<<1)-((r2|0)>4?9:0)|0)>((r16<<1)-((r16|0)>4?9:0)|0)|r12){break}HEAP32[r3+6]=5255716;r5=-5;return r5}else{r19=HEAP32[r6];r17=(r19+5820|0)>>2;r21=HEAP32[r17];do{if((r21|0)==16){r42=(r19+5816|0)>>1;r25=HEAP16[r42]&255;r20=r19+20|0,r26=r20>>2;r40=HEAP32[r26];HEAP32[r26]=r40+1|0;r34=r19+8|0;HEAP8[HEAP32[r34>>2]+r40|0]=r25;r25=HEAPU16[r42]>>>8&255;r40=HEAP32[r26];HEAP32[r26]=r40+1|0;HEAP8[HEAP32[r34>>2]+r40|0]=r25;HEAP16[r42]=0;HEAP32[r17]=0;r42=r20,r79=r42>>2}else{if((r21|0)>7){r20=(r19+5816|0)>>1;r25=HEAP16[r20]&255;r40=r19+20|0;r34=HEAP32[r40>>2];HEAP32[r40>>2]=r34+1|0;HEAP8[HEAP32[r19+8>>2]+r34|0]=r25;HEAP16[r20]=HEAPU16[r20]>>>8;HEAP32[r17]=HEAP32[r17]-8|0;r42=r40,r79=r42>>2;break}else{r42=r19+20|0,r79=r42>>2;break}}}while(0);r17=HEAP32[r79];r21=HEAP32[r13];r41=r17>>>0>r21>>>0?r21:r17;if((r41|0)==0){r80=r21}else{r21=(r19+16|0)>>2;_memcpy(HEAP32[r9],HEAP32[r21],r41);HEAP32[r9]=HEAP32[r9]+r41|0;HEAP32[r21]=HEAP32[r21]+r41|0;r17=r1+20|0;HEAP32[r17>>2]=HEAP32[r17>>2]+r41|0;HEAP32[r13]=HEAP32[r13]-r41|0;r17=HEAP32[r79];HEAP32[r79]=r17-r41|0;if((r17|0)==(r41|0)){HEAP32[r21]=HEAP32[r19+8>>2]}r80=HEAP32[r13]}if((r80|0)!=0){break}HEAP32[r15]=-1;r5=0;return r5}}while(0);r16=(HEAP32[r10]|0)==666;r21=(HEAP32[r3+1]|0)==0;do{if(r16){if(r21){r4=381;break}HEAP32[r3+6]=5255716;r5=-5;return r5}else{if(r21){r4=381;break}else{r4=384;break}}}while(0);do{if(r4==381){if((HEAP32[r8+29]|0)!=0){r4=384;break}if((r2|0)==0){r5=0;return r5}else{if(r16){break}else{r4=384;break}}}}while(0);L528:do{if(r4==384){r16=HEAP32[r8+34];L530:do{if((r16|0)==2){r21=(r7+116|0)>>2;r41=r7+96|0;r17=(r7+108|0)>>2;r11=(r7+56|0)>>2;r42=(r7+5792|0)>>2;r40=r7+5796|0;r20=r7+5784|0;r25=r7+5788|0;r34=(r7+92|0)>>2;r26=r7;while(1){if((HEAP32[r21]|0)==0){_fill_window(r7);if((HEAP32[r21]|0)==0){break}}HEAP32[r41>>2]=0;r37=HEAP8[HEAP32[r11]+HEAP32[r17]|0];HEAP16[HEAP32[r40>>2]+(HEAP32[r42]<<1)>>1]=0;r35=HEAP32[r42];HEAP32[r42]=r35+1|0;HEAP8[HEAP32[r20>>2]+r35|0]=r37;r35=((r37&255)<<2)+r7+148|0;HEAP16[r35>>1]=HEAP16[r35>>1]+1&65535;r35=(HEAP32[r42]|0)==(HEAP32[r25>>2]-1|0);HEAP32[r21]=HEAP32[r21]-1|0;r37=HEAP32[r17]+1|0;HEAP32[r17]=r37;if(!r35){continue}r35=HEAP32[r34];if((r35|0)>-1){r81=HEAP32[r11]+r35|0}else{r81=0}__tr_flush_block(r26,r81,r37-r35|0,0);HEAP32[r34]=HEAP32[r17];r35=HEAP32[r14];r37=HEAP32[r35+28>>2];r43=(r37+5820|0)>>2;r39=HEAP32[r43];do{if((r39|0)==16){r46=(r37+5816|0)>>1;r38=HEAP16[r46]&255;r36=r37+20|0,r44=r36>>2;r45=HEAP32[r44];HEAP32[r44]=r45+1|0;r50=r37+8|0;HEAP8[HEAP32[r50>>2]+r45|0]=r38;r38=HEAPU16[r46]>>>8&255;r45=HEAP32[r44];HEAP32[r44]=r45+1|0;HEAP8[HEAP32[r50>>2]+r45|0]=r38;HEAP16[r46]=0;HEAP32[r43]=0;r46=r36,r82=r46>>2}else{if((r39|0)>7){r36=(r37+5816|0)>>1;r38=HEAP16[r36]&255;r45=r37+20|0;r50=HEAP32[r45>>2];HEAP32[r45>>2]=r50+1|0;HEAP8[HEAP32[r37+8>>2]+r50|0]=r38;HEAP16[r36]=HEAPU16[r36]>>>8;HEAP32[r43]=HEAP32[r43]-8|0;r46=r45,r82=r46>>2;break}else{r46=r37+20|0,r82=r46>>2;break}}}while(0);r43=HEAP32[r82];r39=(r35+16|0)>>2;r46=HEAP32[r39];r45=r43>>>0>r46>>>0?r46:r43;do{if((r45|0)!=0){r43=(r35+12|0)>>2;r46=(r37+16|0)>>2;_memcpy(HEAP32[r43],HEAP32[r46],r45);HEAP32[r43]=HEAP32[r43]+r45|0;HEAP32[r46]=HEAP32[r46]+r45|0;r43=r35+20|0;HEAP32[r43>>2]=HEAP32[r43>>2]+r45|0;HEAP32[r39]=HEAP32[r39]-r45|0;r43=HEAP32[r82];HEAP32[r82]=r43-r45|0;if((r43|0)!=(r45|0)){break}HEAP32[r46]=HEAP32[r37+8>>2]}}while(0);if((HEAP32[HEAP32[r14]+16>>2]|0)==0){r4=488;break L530}}if((r2|0)==0){r4=488;break}HEAP32[r8+1453]=0;if(r12){r21=HEAP32[r34];if((r21|0)>-1){r83=HEAP32[r11]+r21|0}else{r83=0}__tr_flush_block(r26,r83,HEAP32[r17]-r21|0,1);HEAP32[r34]=HEAP32[r17];r21=HEAP32[r14];r25=HEAP32[r21+28>>2];r20=(r25+5820|0)>>2;r40=HEAP32[r20];do{if((r40|0)==16){r41=(r25+5816|0)>>1;r23=HEAP16[r41]&255;r37=r25+20|0,r45=r37>>2;r39=HEAP32[r45];HEAP32[r45]=r39+1|0;r35=r25+8|0;HEAP8[HEAP32[r35>>2]+r39|0]=r23;r23=HEAPU16[r41]>>>8&255;r39=HEAP32[r45];HEAP32[r45]=r39+1|0;HEAP8[HEAP32[r35>>2]+r39|0]=r23;HEAP16[r41]=0;HEAP32[r20]=0;r41=r37,r84=r41>>2}else{if((r40|0)>7){r37=(r25+5816|0)>>1;r23=HEAP16[r37]&255;r39=r25+20|0;r35=HEAP32[r39>>2];HEAP32[r39>>2]=r35+1|0;HEAP8[HEAP32[r25+8>>2]+r35|0]=r23;HEAP16[r37]=HEAPU16[r37]>>>8;HEAP32[r20]=HEAP32[r20]-8|0;r41=r39,r84=r41>>2;break}else{r41=r25+20|0,r84=r41>>2;break}}}while(0);r20=HEAP32[r84];r40=(r21+16|0)>>2;r41=HEAP32[r40];r39=r20>>>0>r41>>>0?r41:r20;do{if((r39|0)!=0){r20=(r21+12|0)>>2;r41=(r25+16|0)>>2;_memcpy(HEAP32[r20],HEAP32[r41],r39);HEAP32[r20]=HEAP32[r20]+r39|0;HEAP32[r41]=HEAP32[r41]+r39|0;r20=r21+20|0;HEAP32[r20>>2]=HEAP32[r20>>2]+r39|0;HEAP32[r40]=HEAP32[r40]-r39|0;r20=HEAP32[r84];HEAP32[r84]=r20-r39|0;if((r20|0)!=(r39|0)){break}HEAP32[r41]=HEAP32[r25+8>>2]}}while(0);r85=(HEAP32[HEAP32[r14]+16>>2]|0)==0?2:3;r4=485;break}if((HEAP32[r42]|0)==0){break}r25=HEAP32[r34];if((r25|0)>-1){r86=HEAP32[r11]+r25|0}else{r86=0}__tr_flush_block(r26,r86,HEAP32[r17]-r25|0,0);HEAP32[r34]=HEAP32[r17];r25=HEAP32[r14];r39=HEAP32[r25+28>>2];r40=(r39+5820|0)>>2;r21=HEAP32[r40];do{if((r21|0)==16){r41=(r39+5816|0)>>1;r20=HEAP16[r41]&255;r37=r39+20|0,r23=r37>>2;r35=HEAP32[r23];HEAP32[r23]=r35+1|0;r45=r39+8|0;HEAP8[HEAP32[r45>>2]+r35|0]=r20;r20=HEAPU16[r41]>>>8&255;r35=HEAP32[r23];HEAP32[r23]=r35+1|0;HEAP8[HEAP32[r45>>2]+r35|0]=r20;HEAP16[r41]=0;HEAP32[r40]=0;r41=r37,r87=r41>>2}else{if((r21|0)>7){r37=(r39+5816|0)>>1;r20=HEAP16[r37]&255;r35=r39+20|0;r45=HEAP32[r35>>2];HEAP32[r35>>2]=r45+1|0;HEAP8[HEAP32[r39+8>>2]+r45|0]=r20;HEAP16[r37]=HEAPU16[r37]>>>8;HEAP32[r40]=HEAP32[r40]-8|0;r41=r35,r87=r41>>2;break}else{r41=r39+20|0,r87=r41>>2;break}}}while(0);r40=HEAP32[r87];r21=(r25+16|0)>>2;r17=HEAP32[r21];r34=r40>>>0>r17>>>0?r17:r40;do{if((r34|0)!=0){r40=(r25+12|0)>>2;r17=(r39+16|0)>>2;_memcpy(HEAP32[r40],HEAP32[r17],r34);HEAP32[r40]=HEAP32[r40]+r34|0;HEAP32[r17]=HEAP32[r17]+r34|0;r40=r25+20|0;HEAP32[r40>>2]=HEAP32[r40>>2]+r34|0;HEAP32[r21]=HEAP32[r21]-r34|0;r40=HEAP32[r87];HEAP32[r87]=r40-r34|0;if((r40|0)!=(r34|0)){break}HEAP32[r17]=HEAP32[r39+8>>2]}}while(0);if((HEAP32[HEAP32[r14]+16>>2]|0)==0){r4=488;break}else{break}}else if((r16|0)==3){r39=(r7+116|0)>>2;r34=(r2|0)==0;r21=(r7+96|0)>>2;r25=(r7+108|0)>>2;r17=(r7+5792|0)>>2;r40=r7+5796|0;r26=r7+5784|0;r11=r7+2440|0;r42=r7+5788|0;r41=(r7+56|0)>>2;r35=(r7+92|0)>>2;r37=r7;L587:while(1){r20=HEAP32[r39];do{if(r20>>>0<259){_fill_window(r7);r45=HEAP32[r39];if(r45>>>0<259&r34){r4=488;break L530}if((r45|0)==0){break L587}HEAP32[r21]=0;if(r45>>>0>2){r88=r45;r4=432;break}r89=HEAP32[r25];r4=447;break}else{HEAP32[r21]=0;r88=r20;r4=432;break}}while(0);do{if(r4==432){r4=0;r20=HEAP32[r25];if((r20|0)==0){r89=0;r4=447;break}r45=HEAP32[r41];r23=HEAP8[r45+(r20-1)|0];if(r23<<24>>24!=HEAP8[r45+r20|0]<<24>>24){r89=r20;r4=447;break}if(r23<<24>>24!=HEAP8[r20+(r45+1)|0]<<24>>24){r89=r20;r4=447;break}r46=r20+(r45+2)|0;if(r23<<24>>24!=HEAP8[r46]<<24>>24){r89=r20;r4=447;break}r43=r20+(r45+258)|0;r45=r46;while(1){r46=r45+1|0;if(r23<<24>>24!=HEAP8[r46]<<24>>24){r90=r46;break}r46=r45+2|0;if(r23<<24>>24!=HEAP8[r46]<<24>>24){r90=r46;break}r46=r45+3|0;if(r23<<24>>24!=HEAP8[r46]<<24>>24){r90=r46;break}r46=r45+4|0;if(r23<<24>>24!=HEAP8[r46]<<24>>24){r90=r46;break}r46=r45+5|0;if(r23<<24>>24!=HEAP8[r46]<<24>>24){r90=r46;break}r46=r45+6|0;if(r23<<24>>24!=HEAP8[r46]<<24>>24){r90=r46;break}r46=r45+7|0;if(r23<<24>>24!=HEAP8[r46]<<24>>24){r90=r46;break}r46=r45+8|0;if(r23<<24>>24==HEAP8[r46]<<24>>24&r46>>>0<r43>>>0){r45=r46}else{r90=r46;break}}r45=r90-r43+258|0;r23=r45>>>0>r88>>>0?r88:r45;HEAP32[r21]=r23;if(r23>>>0<=2){r89=r20;r4=447;break}r45=r23+253|0;HEAP16[HEAP32[r40>>2]+(HEAP32[r17]<<1)>>1]=1;r23=HEAP32[r17];HEAP32[r17]=r23+1|0;HEAP8[HEAP32[r26>>2]+r23|0]=r45&255;r23=((HEAPU8[(r45&255)+5256416|0]|256)+1<<2)+r7+148|0;HEAP16[r23>>1]=HEAP16[r23>>1]+1&65535;HEAP16[r11>>1]=HEAP16[r11>>1]+1&65535;r23=(HEAP32[r17]|0)==(HEAP32[r42>>2]-1|0)&1;r45=HEAP32[r21];HEAP32[r39]=HEAP32[r39]-r45|0;r46=HEAP32[r25]+r45|0;HEAP32[r25]=r46;HEAP32[r21]=0;r91=r23;r92=r46;break}}while(0);if(r4==447){r4=0;r46=HEAP8[HEAP32[r41]+r89|0];HEAP16[HEAP32[r40>>2]+(HEAP32[r17]<<1)>>1]=0;r23=HEAP32[r17];HEAP32[r17]=r23+1|0;HEAP8[HEAP32[r26>>2]+r23|0]=r46;r23=((r46&255)<<2)+r7+148|0;HEAP16[r23>>1]=HEAP16[r23>>1]+1&65535;r23=(HEAP32[r17]|0)==(HEAP32[r42>>2]-1|0)&1;HEAP32[r39]=HEAP32[r39]-1|0;r46=HEAP32[r25]+1|0;HEAP32[r25]=r46;r91=r23;r92=r46}if((r91|0)==0){continue}r46=HEAP32[r35];if((r46|0)>-1){r93=HEAP32[r41]+r46|0}else{r93=0}__tr_flush_block(r37,r93,r92-r46|0,0);HEAP32[r35]=HEAP32[r25];r46=HEAP32[r14];r23=HEAP32[r46+28>>2];r45=(r23+5820|0)>>2;r36=HEAP32[r45];do{if((r36|0)==16){r38=(r23+5816|0)>>1;r50=HEAP16[r38]&255;r44=r23+20|0,r48=r44>>2;r47=HEAP32[r48];HEAP32[r48]=r47+1|0;r51=r23+8|0;HEAP8[HEAP32[r51>>2]+r47|0]=r50;r50=HEAPU16[r38]>>>8&255;r47=HEAP32[r48];HEAP32[r48]=r47+1|0;HEAP8[HEAP32[r51>>2]+r47|0]=r50;HEAP16[r38]=0;HEAP32[r45]=0;r38=r44,r94=r38>>2}else{if((r36|0)>7){r44=(r23+5816|0)>>1;r50=HEAP16[r44]&255;r47=r23+20|0;r51=HEAP32[r47>>2];HEAP32[r47>>2]=r51+1|0;HEAP8[HEAP32[r23+8>>2]+r51|0]=r50;HEAP16[r44]=HEAPU16[r44]>>>8;HEAP32[r45]=HEAP32[r45]-8|0;r38=r47,r94=r38>>2;break}else{r38=r23+20|0,r94=r38>>2;break}}}while(0);r45=HEAP32[r94];r36=(r46+16|0)>>2;r38=HEAP32[r36];r47=r45>>>0>r38>>>0?r38:r45;do{if((r47|0)!=0){r45=(r46+12|0)>>2;r38=(r23+16|0)>>2;_memcpy(HEAP32[r45],HEAP32[r38],r47);HEAP32[r45]=HEAP32[r45]+r47|0;HEAP32[r38]=HEAP32[r38]+r47|0;r45=r46+20|0;HEAP32[r45>>2]=HEAP32[r45>>2]+r47|0;HEAP32[r36]=HEAP32[r36]-r47|0;r45=HEAP32[r94];HEAP32[r94]=r45-r47|0;if((r45|0)!=(r47|0)){break}HEAP32[r38]=HEAP32[r23+8>>2]}}while(0);if((HEAP32[HEAP32[r14]+16>>2]|0)==0){r4=488;break L530}}HEAP32[r8+1453]=0;if(r12){r39=HEAP32[r35];if((r39|0)>-1){r95=HEAP32[r41]+r39|0}else{r95=0}__tr_flush_block(r37,r95,HEAP32[r25]-r39|0,1);HEAP32[r35]=HEAP32[r25];r39=HEAP32[r14];r42=HEAP32[r39+28>>2];r26=(r42+5820|0)>>2;r40=HEAP32[r26];do{if((r40|0)==16){r21=(r42+5816|0)>>1;r11=HEAP16[r21]&255;r34=r42+20|0,r23=r34>>2;r47=HEAP32[r23];HEAP32[r23]=r47+1|0;r36=r42+8|0;HEAP8[HEAP32[r36>>2]+r47|0]=r11;r11=HEAPU16[r21]>>>8&255;r47=HEAP32[r23];HEAP32[r23]=r47+1|0;HEAP8[HEAP32[r36>>2]+r47|0]=r11;HEAP16[r21]=0;HEAP32[r26]=0;r21=r34,r96=r21>>2}else{if((r40|0)>7){r34=(r42+5816|0)>>1;r11=HEAP16[r34]&255;r47=r42+20|0;r36=HEAP32[r47>>2];HEAP32[r47>>2]=r36+1|0;HEAP8[HEAP32[r42+8>>2]+r36|0]=r11;HEAP16[r34]=HEAPU16[r34]>>>8;HEAP32[r26]=HEAP32[r26]-8|0;r21=r47,r96=r21>>2;break}else{r21=r42+20|0,r96=r21>>2;break}}}while(0);r26=HEAP32[r96];r40=(r39+16|0)>>2;r21=HEAP32[r40];r47=r26>>>0>r21>>>0?r21:r26;do{if((r47|0)!=0){r26=(r39+12|0)>>2;r21=(r42+16|0)>>2;_memcpy(HEAP32[r26],HEAP32[r21],r47);HEAP32[r26]=HEAP32[r26]+r47|0;HEAP32[r21]=HEAP32[r21]+r47|0;r26=r39+20|0;HEAP32[r26>>2]=HEAP32[r26>>2]+r47|0;HEAP32[r40]=HEAP32[r40]-r47|0;r26=HEAP32[r96];HEAP32[r96]=r26-r47|0;if((r26|0)!=(r47|0)){break}HEAP32[r21]=HEAP32[r42+8>>2]}}while(0);r85=(HEAP32[HEAP32[r14]+16>>2]|0)==0?2:3;r4=485;break}if((HEAP32[r17]|0)==0){break}r42=HEAP32[r35];if((r42|0)>-1){r97=HEAP32[r41]+r42|0}else{r97=0}__tr_flush_block(r37,r97,HEAP32[r25]-r42|0,0);HEAP32[r35]=HEAP32[r25];r42=HEAP32[r14];r47=HEAP32[r42+28>>2];r40=(r47+5820|0)>>2;r39=HEAP32[r40];do{if((r39|0)==16){r21=(r47+5816|0)>>1;r26=HEAP16[r21]&255;r34=r47+20|0,r11=r34>>2;r36=HEAP32[r11];HEAP32[r11]=r36+1|0;r23=r47+8|0;HEAP8[HEAP32[r23>>2]+r36|0]=r26;r26=HEAPU16[r21]>>>8&255;r36=HEAP32[r11];HEAP32[r11]=r36+1|0;HEAP8[HEAP32[r23>>2]+r36|0]=r26;HEAP16[r21]=0;HEAP32[r40]=0;r21=r34,r98=r21>>2}else{if((r39|0)>7){r34=(r47+5816|0)>>1;r26=HEAP16[r34]&255;r36=r47+20|0;r23=HEAP32[r36>>2];HEAP32[r36>>2]=r23+1|0;HEAP8[HEAP32[r47+8>>2]+r23|0]=r26;HEAP16[r34]=HEAPU16[r34]>>>8;HEAP32[r40]=HEAP32[r40]-8|0;r21=r36,r98=r21>>2;break}else{r21=r47+20|0,r98=r21>>2;break}}}while(0);r40=HEAP32[r98];r39=(r42+16|0)>>2;r25=HEAP32[r39];r35=r40>>>0>r25>>>0?r25:r40;do{if((r35|0)!=0){r40=(r42+12|0)>>2;r25=(r47+16|0)>>2;_memcpy(HEAP32[r40],HEAP32[r25],r35);HEAP32[r40]=HEAP32[r40]+r35|0;HEAP32[r25]=HEAP32[r25]+r35|0;r40=r42+20|0;HEAP32[r40>>2]=HEAP32[r40>>2]+r35|0;HEAP32[r39]=HEAP32[r39]-r35|0;r40=HEAP32[r98];HEAP32[r98]=r40-r35|0;if((r40|0)!=(r35|0)){break}HEAP32[r25]=HEAP32[r47+8>>2]}}while(0);if((HEAP32[HEAP32[r14]+16>>2]|0)==0){r4=488;break}else{break}}else{r85=FUNCTION_TABLE[HEAP32[(HEAP32[r8+33]*12&-1)+5255220>>2]](r7,r2);r4=485;break}}while(0);do{if(r4==485){if((r85-2|0)>>>0<2){HEAP32[r10]=666}if((r85|0)==2|(r85|0)==0){r4=488;break}else if((r85|0)==1){break}else{break L528}}}while(0);if(r4==488){if((HEAP32[r13]|0)!=0){r5=0;return r5}HEAP32[r15]=-1;r5=0;return r5}do{if((r2|0)==1){__tr_align(r7)}else if((r2|0)!=5){__tr_stored_block(r7,0,0,0);if((r2|0)!=3){break}r16=r7+76|0;r19=r7+68|0;HEAP16[HEAP32[r19>>2]+(HEAP32[r16>>2]-1<<1)>>1]=0;_memset(HEAP32[r19>>2],0,(HEAP32[r16>>2]<<1)-2|0);if((HEAP32[r8+29]|0)!=0){break}HEAP32[r8+27]=0;HEAP32[r8+23]=0;HEAP32[r8+1453]=0}}while(0);r16=HEAP32[r6];r19=(r16+5820|0)>>2;r47=HEAP32[r19];do{if((r47|0)==16){r35=(r16+5816|0)>>1;r39=HEAP16[r35]&255;r42=r16+20|0,r25=r42>>2;r40=HEAP32[r25];HEAP32[r25]=r40+1|0;r37=r16+8|0;HEAP8[HEAP32[r37>>2]+r40|0]=r39;r39=HEAPU16[r35]>>>8&255;r40=HEAP32[r25];HEAP32[r25]=r40+1|0;HEAP8[HEAP32[r37>>2]+r40|0]=r39;HEAP16[r35]=0;HEAP32[r19]=0;r35=r42,r99=r35>>2}else{if((r47|0)>7){r42=(r16+5816|0)>>1;r39=HEAP16[r42]&255;r40=r16+20|0;r37=HEAP32[r40>>2];HEAP32[r40>>2]=r37+1|0;HEAP8[HEAP32[r16+8>>2]+r37|0]=r39;HEAP16[r42]=HEAPU16[r42]>>>8;HEAP32[r19]=HEAP32[r19]-8|0;r35=r40,r99=r35>>2;break}else{r35=r16+20|0,r99=r35>>2;break}}}while(0);r19=HEAP32[r99];r47=HEAP32[r13];r35=r19>>>0>r47>>>0?r47:r19;if((r35|0)==0){r100=r47}else{r47=(r16+16|0)>>2;_memcpy(HEAP32[r9],HEAP32[r47],r35);HEAP32[r9]=HEAP32[r9]+r35|0;HEAP32[r47]=HEAP32[r47]+r35|0;r19=r1+20|0;HEAP32[r19>>2]=HEAP32[r19>>2]+r35|0;HEAP32[r13]=HEAP32[r13]-r35|0;r19=HEAP32[r99];HEAP32[r99]=r19-r35|0;if((r19|0)==(r35|0)){HEAP32[r47]=HEAP32[r16+8>>2]}r100=HEAP32[r13]}if((r100|0)!=0){break}HEAP32[r15]=-1;r5=0;return r5}}while(0);if(!r12){r5=0;return r5}r15=(r7+24|0)>>2;r10=HEAP32[r15];if((r10|0)<1){r5=1;return r5}r14=(r1+48|0)>>2;r47=HEAP32[r14];if((r10|0)==2){r10=HEAP32[r22];HEAP32[r22]=r10+1|0;r35=(r7+8|0)>>2;HEAP8[HEAP32[r35]+r10|0]=r47&255;r10=HEAP32[r14]>>>8&255;r19=HEAP32[r22];HEAP32[r22]=r19+1|0;HEAP8[HEAP32[r35]+r19|0]=r10;r10=HEAP32[r14]>>>16&255;r19=HEAP32[r22];HEAP32[r22]=r19+1|0;HEAP8[HEAP32[r35]+r19|0]=r10;r10=HEAP32[r14]>>>24&255;r19=HEAP32[r22];HEAP32[r22]=r19+1|0;HEAP8[HEAP32[r35]+r19|0]=r10;r10=(r1+8|0)>>2;r19=HEAP32[r10]&255;r40=HEAP32[r22];HEAP32[r22]=r40+1|0;HEAP8[HEAP32[r35]+r40|0]=r19;r19=HEAP32[r10]>>>8&255;r40=HEAP32[r22];HEAP32[r22]=r40+1|0;HEAP8[HEAP32[r35]+r40|0]=r19;r19=HEAP32[r10]>>>16&255;r40=HEAP32[r22];HEAP32[r22]=r40+1|0;HEAP8[HEAP32[r35]+r40|0]=r19;r19=HEAP32[r10]>>>24&255;r10=HEAP32[r22];HEAP32[r22]=r10+1|0;HEAP8[HEAP32[r35]+r10|0]=r19}else{r19=HEAP32[r22];HEAP32[r22]=r19+1|0;r10=(r7+8|0)>>2;HEAP8[HEAP32[r10]+r19|0]=r47>>>24&255;r19=HEAP32[r22];HEAP32[r22]=r19+1|0;HEAP8[HEAP32[r10]+r19|0]=r47>>>16&255;r47=HEAP32[r14];r14=HEAP32[r22];HEAP32[r22]=r14+1|0;HEAP8[HEAP32[r10]+r14|0]=r47>>>8&255;r14=HEAP32[r22];HEAP32[r22]=r14+1|0;HEAP8[HEAP32[r10]+r14|0]=r47&255}r47=HEAP32[r6];r14=(r47+5820|0)>>2;r10=HEAP32[r14];do{if((r10|0)==16){r19=(r47+5816|0)>>1;r35=HEAP16[r19]&255;r40=r47+20|0,r42=r40>>2;r39=HEAP32[r42];HEAP32[r42]=r39+1|0;r37=r47+8|0;HEAP8[HEAP32[r37>>2]+r39|0]=r35;r35=HEAPU16[r19]>>>8&255;r39=HEAP32[r42];HEAP32[r42]=r39+1|0;HEAP8[HEAP32[r37>>2]+r39|0]=r35;HEAP16[r19]=0;HEAP32[r14]=0;r19=r40,r101=r19>>2}else{if((r10|0)>7){r40=(r47+5816|0)>>1;r35=HEAP16[r40]&255;r39=r47+20|0;r37=HEAP32[r39>>2];HEAP32[r39>>2]=r37+1|0;HEAP8[HEAP32[r47+8>>2]+r37|0]=r35;HEAP16[r40]=HEAPU16[r40]>>>8;HEAP32[r14]=HEAP32[r14]-8|0;r19=r39,r101=r19>>2;break}else{r19=r47+20|0,r101=r19>>2;break}}}while(0);r14=HEAP32[r101];r10=HEAP32[r13];r12=r14>>>0>r10>>>0?r10:r14;do{if((r12|0)!=0){r14=(r47+16|0)>>2;_memcpy(HEAP32[r9],HEAP32[r14],r12);HEAP32[r9]=HEAP32[r9]+r12|0;HEAP32[r14]=HEAP32[r14]+r12|0;r10=r1+20|0;HEAP32[r10>>2]=HEAP32[r10>>2]+r12|0;HEAP32[r13]=HEAP32[r13]-r12|0;r10=HEAP32[r101];HEAP32[r101]=r10-r12|0;if((r10|0)!=(r12|0)){break}HEAP32[r14]=HEAP32[r47+8>>2]}}while(0);r47=HEAP32[r15];if((r47|0)>0){HEAP32[r15]=-r47|0}r5=(HEAP32[r22]|0)==0&1;return r5}}while(0);HEAP32[r3+6]=5255912;r5=-2;return r5}function _deflate_stored(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33;r3=0;r4=HEAP32[r1+12>>2]-5|0;r5=r4>>>0<65535?r4:65535;r4=(r1+116|0)>>2;r6=(r1+108|0)>>2;r7=(r1+92|0)>>2;r8=r1+44|0;r9=(r1+56|0)>>2;r10=r1;r11=(r1|0)>>2;while(1){r12=HEAP32[r4];if(r12>>>0<2){_fill_window(r1);r13=HEAP32[r4];if((r13|r2|0)==0){r14=0;r3=594;break}if((r13|0)==0){r3=566;break}else{r15=r13}}else{r15=r12}r12=HEAP32[r6]+r15|0;HEAP32[r6]=r12;HEAP32[r4]=0;r13=HEAP32[r7];r16=r13+r5|0;if((r12|0)!=0&r12>>>0<r16>>>0){r17=r12;r18=r13}else{HEAP32[r4]=r12-r16|0;HEAP32[r6]=r16;if((r13|0)>-1){r19=HEAP32[r9]+r13|0}else{r19=0}__tr_flush_block(r10,r19,r5,0);HEAP32[r7]=HEAP32[r6];r13=HEAP32[r11];r16=HEAP32[r13+28>>2];r12=(r16+5820|0)>>2;r20=HEAP32[r12];do{if((r20|0)==16){r21=(r16+5816|0)>>1;r22=HEAP16[r21]&255;r23=r16+20|0,r24=r23>>2;r25=HEAP32[r24];HEAP32[r24]=r25+1|0;r26=r16+8|0;HEAP8[HEAP32[r26>>2]+r25|0]=r22;r22=HEAPU16[r21]>>>8&255;r25=HEAP32[r24];HEAP32[r24]=r25+1|0;HEAP8[HEAP32[r26>>2]+r25|0]=r22;HEAP16[r21]=0;HEAP32[r12]=0;r21=r23,r27=r21>>2}else{if((r20|0)>7){r23=(r16+5816|0)>>1;r22=HEAP16[r23]&255;r25=r16+20|0;r26=HEAP32[r25>>2];HEAP32[r25>>2]=r26+1|0;HEAP8[HEAP32[r16+8>>2]+r26|0]=r22;HEAP16[r23]=HEAPU16[r23]>>>8;HEAP32[r12]=HEAP32[r12]-8|0;r21=r25,r27=r21>>2;break}else{r21=r16+20|0,r27=r21>>2;break}}}while(0);r12=HEAP32[r27];r20=(r13+16|0)>>2;r21=HEAP32[r20];r25=r12>>>0>r21>>>0?r21:r12;do{if((r25|0)!=0){r12=(r13+12|0)>>2;r21=(r16+16|0)>>2;_memcpy(HEAP32[r12],HEAP32[r21],r25);HEAP32[r12]=HEAP32[r12]+r25|0;HEAP32[r21]=HEAP32[r21]+r25|0;r12=r13+20|0;HEAP32[r12>>2]=HEAP32[r12>>2]+r25|0;HEAP32[r20]=HEAP32[r20]-r25|0;r12=HEAP32[r27];HEAP32[r27]=r12-r25|0;if((r12|0)!=(r25|0)){break}HEAP32[r21]=HEAP32[r16+8>>2]}}while(0);if((HEAP32[HEAP32[r11]+16>>2]|0)==0){r14=0;r3=593;break}r17=HEAP32[r6];r18=HEAP32[r7]}r16=r17-r18|0;if(r16>>>0<(HEAP32[r8>>2]-262|0)>>>0){continue}if((r18|0)>-1){r28=HEAP32[r9]+r18|0}else{r28=0}__tr_flush_block(r10,r28,r16,0);HEAP32[r7]=HEAP32[r6];r16=HEAP32[r11];r25=HEAP32[r16+28>>2];r20=(r25+5820|0)>>2;r13=HEAP32[r20];do{if((r13|0)==16){r21=(r25+5816|0)>>1;r12=HEAP16[r21]&255;r23=r25+20|0,r22=r23>>2;r26=HEAP32[r22];HEAP32[r22]=r26+1|0;r24=r25+8|0;HEAP8[HEAP32[r24>>2]+r26|0]=r12;r12=HEAPU16[r21]>>>8&255;r26=HEAP32[r22];HEAP32[r22]=r26+1|0;HEAP8[HEAP32[r24>>2]+r26|0]=r12;HEAP16[r21]=0;HEAP32[r20]=0;r21=r23,r29=r21>>2}else{if((r13|0)>7){r23=(r25+5816|0)>>1;r12=HEAP16[r23]&255;r26=r25+20|0;r24=HEAP32[r26>>2];HEAP32[r26>>2]=r24+1|0;HEAP8[HEAP32[r25+8>>2]+r24|0]=r12;HEAP16[r23]=HEAPU16[r23]>>>8;HEAP32[r20]=HEAP32[r20]-8|0;r21=r26,r29=r21>>2;break}else{r21=r25+20|0,r29=r21>>2;break}}}while(0);r20=HEAP32[r29];r13=(r16+16|0)>>2;r21=HEAP32[r13];r26=r20>>>0>r21>>>0?r21:r20;do{if((r26|0)!=0){r20=(r16+12|0)>>2;r21=(r25+16|0)>>2;_memcpy(HEAP32[r20],HEAP32[r21],r26);HEAP32[r20]=HEAP32[r20]+r26|0;HEAP32[r21]=HEAP32[r21]+r26|0;r20=r16+20|0;HEAP32[r20>>2]=HEAP32[r20>>2]+r26|0;HEAP32[r13]=HEAP32[r13]-r26|0;r20=HEAP32[r29];HEAP32[r29]=r20-r26|0;if((r20|0)!=(r26|0)){break}HEAP32[r21]=HEAP32[r25+8>>2]}}while(0);if((HEAP32[HEAP32[r11]+16>>2]|0)==0){r14=0;r3=595;break}}if(r3==566){HEAP32[r1+5812>>2]=0;if((r2|0)==4){r2=HEAP32[r7];if((r2|0)>-1){r30=HEAP32[r9]+r2|0}else{r30=0}__tr_flush_block(r10,r30,HEAP32[r6]-r2|0,1);HEAP32[r7]=HEAP32[r6];r2=HEAP32[r11];r30=HEAP32[r2+28>>2];r1=(r30+5820|0)>>2;r29=HEAP32[r1];do{if((r29|0)==16){r28=(r30+5816|0)>>1;r18=HEAP16[r28]&255;r8=r30+20|0,r17=r8>>2;r27=HEAP32[r17];HEAP32[r17]=r27+1|0;r5=r30+8|0;HEAP8[HEAP32[r5>>2]+r27|0]=r18;r18=HEAPU16[r28]>>>8&255;r27=HEAP32[r17];HEAP32[r17]=r27+1|0;HEAP8[HEAP32[r5>>2]+r27|0]=r18;HEAP16[r28]=0;HEAP32[r1]=0;r28=r8,r31=r28>>2}else{if((r29|0)>7){r8=(r30+5816|0)>>1;r18=HEAP16[r8]&255;r27=r30+20|0;r5=HEAP32[r27>>2];HEAP32[r27>>2]=r5+1|0;HEAP8[HEAP32[r30+8>>2]+r5|0]=r18;HEAP16[r8]=HEAPU16[r8]>>>8;HEAP32[r1]=HEAP32[r1]-8|0;r28=r27,r31=r28>>2;break}else{r28=r30+20|0,r31=r28>>2;break}}}while(0);r1=HEAP32[r31];r29=(r2+16|0)>>2;r28=HEAP32[r29];r27=r1>>>0>r28>>>0?r28:r1;do{if((r27|0)!=0){r1=(r2+12|0)>>2;r28=(r30+16|0)>>2;_memcpy(HEAP32[r1],HEAP32[r28],r27);HEAP32[r1]=HEAP32[r1]+r27|0;HEAP32[r28]=HEAP32[r28]+r27|0;r1=r2+20|0;HEAP32[r1>>2]=HEAP32[r1>>2]+r27|0;HEAP32[r29]=HEAP32[r29]-r27|0;r1=HEAP32[r31];HEAP32[r31]=r1-r27|0;if((r1|0)!=(r27|0)){break}HEAP32[r28]=HEAP32[r30+8>>2]}}while(0);r14=(HEAP32[HEAP32[r11]+16>>2]|0)==0?2:3;return r14}r30=HEAP32[r6];r27=HEAP32[r7];do{if((r30|0)>(r27|0)){if((r27|0)>-1){r32=HEAP32[r9]+r27|0}else{r32=0}__tr_flush_block(r10,r32,r30-r27|0,0);HEAP32[r7]=HEAP32[r6];r31=HEAP32[r11];r29=HEAP32[r31+28>>2];r2=(r29+5820|0)>>2;r28=HEAP32[r2];do{if((r28|0)==16){r1=(r29+5816|0)>>1;r8=HEAP16[r1]&255;r18=r29+20|0,r5=r18>>2;r17=HEAP32[r5];HEAP32[r5]=r17+1|0;r19=r29+8|0;HEAP8[HEAP32[r19>>2]+r17|0]=r8;r8=HEAPU16[r1]>>>8&255;r17=HEAP32[r5];HEAP32[r5]=r17+1|0;HEAP8[HEAP32[r19>>2]+r17|0]=r8;HEAP16[r1]=0;HEAP32[r2]=0;r1=r18,r33=r1>>2}else{if((r28|0)>7){r18=(r29+5816|0)>>1;r8=HEAP16[r18]&255;r17=r29+20|0;r19=HEAP32[r17>>2];HEAP32[r17>>2]=r19+1|0;HEAP8[HEAP32[r29+8>>2]+r19|0]=r8;HEAP16[r18]=HEAPU16[r18]>>>8;HEAP32[r2]=HEAP32[r2]-8|0;r1=r17,r33=r1>>2;break}else{r1=r29+20|0,r33=r1>>2;break}}}while(0);r2=HEAP32[r33];r28=(r31+16|0)>>2;r1=HEAP32[r28];r17=r2>>>0>r1>>>0?r1:r2;do{if((r17|0)!=0){r2=(r31+12|0)>>2;r1=(r29+16|0)>>2;_memcpy(HEAP32[r2],HEAP32[r1],r17);HEAP32[r2]=HEAP32[r2]+r17|0;HEAP32[r1]=HEAP32[r1]+r17|0;r2=r31+20|0;HEAP32[r2>>2]=HEAP32[r2>>2]+r17|0;HEAP32[r28]=HEAP32[r28]-r17|0;r2=HEAP32[r33];HEAP32[r33]=r2-r17|0;if((r2|0)!=(r17|0)){break}HEAP32[r1]=HEAP32[r29+8>>2]}}while(0);if((HEAP32[HEAP32[r11]+16>>2]|0)==0){r14=0}else{break}return r14}}while(0);r14=1;return r14}else if(r3==593){return r14}else if(r3==594){return r14}else if(r3==595){return r14}}function _deflate_fast(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36,r37,r38,r39,r40,r41,r42,r43,r44,r45,r46;r3=0;r4=(r1+116|0)>>2;r5=(r2|0)==0;r6=(r1+72|0)>>2;r7=(r1+88|0)>>2;r8=(r1+108|0)>>2;r9=(r1+56|0)>>2;r10=(r1+84|0)>>2;r11=(r1+68|0)>>2;r12=r1+52|0;r13=r1+64|0;r14=r1+44|0;r15=(r1+96|0)>>2;r16=r1+112|0;r17=(r1+5792|0)>>2;r18=r1+5796|0;r19=r1+5784|0;r20=r1+5788|0;r21=r1+128|0;r22=(r1+92|0)>>2;r23=r1;r24=(r1|0)>>2;L808:while(1){do{if(HEAP32[r4]>>>0<262){_fill_window(r1);r25=HEAP32[r4];if(r25>>>0<262&r5){r26=0;r3=654;break L808}if((r25|0)==0){r3=628;break L808}if(r25>>>0>2){r3=603;break}else{r3=606;break}}else{r3=603}}while(0);do{if(r3==603){r3=0;r25=HEAP32[r8];r27=(HEAPU8[HEAP32[r9]+r25+2|0]^HEAP32[r6]<<HEAP32[r7])&HEAP32[r10];HEAP32[r6]=r27;r28=HEAP16[HEAP32[r11]+(r27<<1)>>1];HEAP16[HEAP32[r13>>2]+((HEAP32[r12>>2]&r25)<<1)>>1]=r28;r25=r28&65535;HEAP16[HEAP32[r11]+(HEAP32[r6]<<1)>>1]=HEAP32[r8]&65535;if(r28<<16>>16==0){r3=606;break}if((HEAP32[r8]-r25|0)>>>0>(HEAP32[r14>>2]-262|0)>>>0){r3=606;break}r28=_longest_match(r1,r25);HEAP32[r15]=r28;r29=r28;break}}while(0);if(r3==606){r3=0;r29=HEAP32[r15]}do{if(r29>>>0>2){r28=r29+253|0;r25=HEAP32[r8]-HEAP32[r16>>2]|0;HEAP16[HEAP32[r18>>2]+(HEAP32[r17]<<1)>>1]=r25&65535;r27=HEAP32[r17];HEAP32[r17]=r27+1|0;HEAP8[HEAP32[r19>>2]+r27|0]=r28&255;r27=((HEAPU8[(r28&255)+5256416|0]|256)+1<<2)+r1+148|0;HEAP16[r27>>1]=HEAP16[r27>>1]+1&65535;r27=r25+65535&65535;if(r27>>>0<256){r30=r27}else{r30=(r27>>>7)+256|0}r27=(HEAPU8[r30+5257144|0]<<2)+r1+2440|0;HEAP16[r27>>1]=HEAP16[r27>>1]+1&65535;r27=(HEAP32[r17]|0)==(HEAP32[r20>>2]-1|0)&1;r25=HEAP32[r15];r28=HEAP32[r4]-r25|0;HEAP32[r4]=r28;if(!(r25>>>0<=HEAP32[r21>>2]>>>0&r28>>>0>2)){r28=HEAP32[r8]+r25|0;HEAP32[r8]=r28;HEAP32[r15]=0;r31=HEAP32[r9];r32=HEAPU8[r31+r28|0];HEAP32[r6]=r32;HEAP32[r6]=(HEAPU8[r28+(r31+1)|0]^r32<<HEAP32[r7])&HEAP32[r10];r33=r27;r34=r28;break}HEAP32[r15]=r25-1|0;while(1){r25=HEAP32[r8];r28=r25+1|0;HEAP32[r8]=r28;r32=(HEAPU8[HEAP32[r9]+r25+3|0]^HEAP32[r6]<<HEAP32[r7])&HEAP32[r10];HEAP32[r6]=r32;HEAP16[HEAP32[r13>>2]+((HEAP32[r12>>2]&r28)<<1)>>1]=HEAP16[HEAP32[r11]+(r32<<1)>>1];HEAP16[HEAP32[r11]+(HEAP32[r6]<<1)>>1]=HEAP32[r8]&65535;r32=HEAP32[r15]-1|0;HEAP32[r15]=r32;if((r32|0)==0){break}}r32=HEAP32[r8]+1|0;HEAP32[r8]=r32;r33=r27;r34=r32}else{r32=HEAP8[HEAP32[r9]+HEAP32[r8]|0];HEAP16[HEAP32[r18>>2]+(HEAP32[r17]<<1)>>1]=0;r28=HEAP32[r17];HEAP32[r17]=r28+1|0;HEAP8[HEAP32[r19>>2]+r28|0]=r32;r28=((r32&255)<<2)+r1+148|0;HEAP16[r28>>1]=HEAP16[r28>>1]+1&65535;r28=(HEAP32[r17]|0)==(HEAP32[r20>>2]-1|0)&1;HEAP32[r4]=HEAP32[r4]-1|0;r32=HEAP32[r8]+1|0;HEAP32[r8]=r32;r33=r28;r34=r32}}while(0);if((r33|0)==0){continue}r32=HEAP32[r22];if((r32|0)>-1){r35=HEAP32[r9]+r32|0}else{r35=0}__tr_flush_block(r23,r35,r34-r32|0,0);HEAP32[r22]=HEAP32[r8];r32=HEAP32[r24];r28=HEAP32[r32+28>>2];r25=(r28+5820|0)>>2;r31=HEAP32[r25];do{if((r31|0)==16){r36=(r28+5816|0)>>1;r37=HEAP16[r36]&255;r38=r28+20|0,r39=r38>>2;r40=HEAP32[r39];HEAP32[r39]=r40+1|0;r41=r28+8|0;HEAP8[HEAP32[r41>>2]+r40|0]=r37;r37=HEAPU16[r36]>>>8&255;r40=HEAP32[r39];HEAP32[r39]=r40+1|0;HEAP8[HEAP32[r41>>2]+r40|0]=r37;HEAP16[r36]=0;HEAP32[r25]=0;r36=r38,r42=r36>>2}else{if((r31|0)>7){r38=(r28+5816|0)>>1;r37=HEAP16[r38]&255;r40=r28+20|0;r41=HEAP32[r40>>2];HEAP32[r40>>2]=r41+1|0;HEAP8[HEAP32[r28+8>>2]+r41|0]=r37;HEAP16[r38]=HEAPU16[r38]>>>8;HEAP32[r25]=HEAP32[r25]-8|0;r36=r40,r42=r36>>2;break}else{r36=r28+20|0,r42=r36>>2;break}}}while(0);r25=HEAP32[r42];r31=(r32+16|0)>>2;r36=HEAP32[r31];r40=r25>>>0>r36>>>0?r36:r25;do{if((r40|0)!=0){r25=(r32+12|0)>>2;r36=(r28+16|0)>>2;_memcpy(HEAP32[r25],HEAP32[r36],r40);HEAP32[r25]=HEAP32[r25]+r40|0;HEAP32[r36]=HEAP32[r36]+r40|0;r25=r32+20|0;HEAP32[r25>>2]=HEAP32[r25>>2]+r40|0;HEAP32[r31]=HEAP32[r31]-r40|0;r25=HEAP32[r42];HEAP32[r42]=r25-r40|0;if((r25|0)!=(r40|0)){break}HEAP32[r36]=HEAP32[r28+8>>2]}}while(0);if((HEAP32[HEAP32[r24]+16>>2]|0)==0){r26=0;r3=655;break}}if(r3==655){return r26}else if(r3==654){return r26}else if(r3==628){r3=HEAP32[r8];HEAP32[r1+5812>>2]=r3>>>0<2?r3:2;if((r2|0)==4){r2=HEAP32[r22];if((r2|0)>-1){r43=HEAP32[r9]+r2|0}else{r43=0}__tr_flush_block(r23,r43,r3-r2|0,1);HEAP32[r22]=HEAP32[r8];r2=HEAP32[r24];r43=HEAP32[r2+28>>2];r1=(r43+5820|0)>>2;r42=HEAP32[r1];do{if((r42|0)==16){r34=(r43+5816|0)>>1;r35=HEAP16[r34]&255;r33=r43+20|0,r4=r33>>2;r20=HEAP32[r4];HEAP32[r4]=r20+1|0;r19=r43+8|0;HEAP8[HEAP32[r19>>2]+r20|0]=r35;r35=HEAPU16[r34]>>>8&255;r20=HEAP32[r4];HEAP32[r4]=r20+1|0;HEAP8[HEAP32[r19>>2]+r20|0]=r35;HEAP16[r34]=0;HEAP32[r1]=0;r34=r33,r44=r34>>2}else{if((r42|0)>7){r33=(r43+5816|0)>>1;r35=HEAP16[r33]&255;r20=r43+20|0;r19=HEAP32[r20>>2];HEAP32[r20>>2]=r19+1|0;HEAP8[HEAP32[r43+8>>2]+r19|0]=r35;HEAP16[r33]=HEAPU16[r33]>>>8;HEAP32[r1]=HEAP32[r1]-8|0;r34=r20,r44=r34>>2;break}else{r34=r43+20|0,r44=r34>>2;break}}}while(0);r1=HEAP32[r44];r42=(r2+16|0)>>2;r34=HEAP32[r42];r20=r1>>>0>r34>>>0?r34:r1;do{if((r20|0)!=0){r1=(r2+12|0)>>2;r34=(r43+16|0)>>2;_memcpy(HEAP32[r1],HEAP32[r34],r20);HEAP32[r1]=HEAP32[r1]+r20|0;HEAP32[r34]=HEAP32[r34]+r20|0;r1=r2+20|0;HEAP32[r1>>2]=HEAP32[r1>>2]+r20|0;HEAP32[r42]=HEAP32[r42]-r20|0;r1=HEAP32[r44];HEAP32[r44]=r1-r20|0;if((r1|0)!=(r20|0)){break}HEAP32[r34]=HEAP32[r43+8>>2]}}while(0);r26=(HEAP32[HEAP32[r24]+16>>2]|0)==0?2:3;return r26}do{if((HEAP32[r17]|0)!=0){r43=HEAP32[r22];if((r43|0)>-1){r45=HEAP32[r9]+r43|0}else{r45=0}__tr_flush_block(r23,r45,r3-r43|0,0);HEAP32[r22]=HEAP32[r8];r43=HEAP32[r24];r20=HEAP32[r43+28>>2];r44=(r20+5820|0)>>2;r42=HEAP32[r44];do{if((r42|0)==16){r2=(r20+5816|0)>>1;r34=HEAP16[r2]&255;r1=r20+20|0,r33=r1>>2;r35=HEAP32[r33];HEAP32[r33]=r35+1|0;r19=r20+8|0;HEAP8[HEAP32[r19>>2]+r35|0]=r34;r34=HEAPU16[r2]>>>8&255;r35=HEAP32[r33];HEAP32[r33]=r35+1|0;HEAP8[HEAP32[r19>>2]+r35|0]=r34;HEAP16[r2]=0;HEAP32[r44]=0;r2=r1,r46=r2>>2}else{if((r42|0)>7){r1=(r20+5816|0)>>1;r34=HEAP16[r1]&255;r35=r20+20|0;r19=HEAP32[r35>>2];HEAP32[r35>>2]=r19+1|0;HEAP8[HEAP32[r20+8>>2]+r19|0]=r34;HEAP16[r1]=HEAPU16[r1]>>>8;HEAP32[r44]=HEAP32[r44]-8|0;r2=r35,r46=r2>>2;break}else{r2=r20+20|0,r46=r2>>2;break}}}while(0);r44=HEAP32[r46];r42=(r43+16|0)>>2;r2=HEAP32[r42];r35=r44>>>0>r2>>>0?r2:r44;do{if((r35|0)!=0){r44=(r43+12|0)>>2;r2=(r20+16|0)>>2;_memcpy(HEAP32[r44],HEAP32[r2],r35);HEAP32[r44]=HEAP32[r44]+r35|0;HEAP32[r2]=HEAP32[r2]+r35|0;r44=r43+20|0;HEAP32[r44>>2]=HEAP32[r44>>2]+r35|0;HEAP32[r42]=HEAP32[r42]-r35|0;r44=HEAP32[r46];HEAP32[r46]=r44-r35|0;if((r44|0)!=(r35|0)){break}HEAP32[r2]=HEAP32[r20+8>>2]}}while(0);if((HEAP32[HEAP32[r24]+16>>2]|0)==0){r26=0}else{break}return r26}}while(0);r26=1;return r26}}function _deflate_slow(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36,r37,r38,r39,r40,r41,r42,r43,r44,r45,r46,r47,r48,r49,r50,r51,r52,r53,r54,r55,r56;r3=0;r4=(r1+116|0)>>2;r5=(r2|0)==0;r6=(r1+72|0)>>2;r7=r1+88|0;r8=(r1+108|0)>>2;r9=(r1+56|0)>>2;r10=r1+84|0;r11=(r1+68|0)>>2;r12=r1+52|0;r13=r1+64|0;r14=(r1+96|0)>>2;r15=(r1+120|0)>>2;r16=(r1+112|0)>>2;r17=(r1+100|0)>>2;r18=(r1+5792|0)>>2;r19=(r1+5796|0)>>2;r20=(r1+5784|0)>>2;r21=r1+5788|0;r22=(r1+104|0)>>2;r23=(r1+92|0)>>2;r24=r1;r25=(r1|0)>>2;r26=r1+128|0;r27=r1+44|0;r28=r1+136|0;L891:while(1){r29=HEAP32[r4];while(1){do{if(r29>>>0<262){_fill_window(r1);r30=HEAP32[r4];if(r30>>>0<262&r5){r31=0;r3=738;break L891}if((r30|0)==0){r3=708;break L891}if(r30>>>0>2){r3=666;break}HEAP32[r15]=HEAP32[r14];HEAP32[r17]=HEAP32[r16];HEAP32[r14]=2;r32=2;r3=674;break}else{r3=666}}while(0);do{if(r3==666){r3=0;r30=HEAP32[r8];r33=(HEAPU8[HEAP32[r9]+r30+2|0]^HEAP32[r6]<<HEAP32[r7>>2])&HEAP32[r10>>2];HEAP32[r6]=r33;r34=HEAP16[HEAP32[r11]+(r33<<1)>>1];HEAP16[HEAP32[r13>>2]+((HEAP32[r12>>2]&r30)<<1)>>1]=r34;r30=r34&65535;HEAP16[HEAP32[r11]+(HEAP32[r6]<<1)>>1]=HEAP32[r8]&65535;r33=HEAP32[r14];HEAP32[r15]=r33;HEAP32[r17]=HEAP32[r16];HEAP32[r14]=2;if(r34<<16>>16==0){r32=2;r3=674;break}if(r33>>>0>=HEAP32[r26>>2]>>>0){r35=r33;r36=2;break}if((HEAP32[r8]-r30|0)>>>0>(HEAP32[r27>>2]-262|0)>>>0){r32=2;r3=674;break}r33=_longest_match(r1,r30);HEAP32[r14]=r33;if(r33>>>0>=6){r32=r33;r3=674;break}if((HEAP32[r28>>2]|0)!=1){if((r33|0)!=3){r32=r33;r3=674;break}if((HEAP32[r8]-HEAP32[r16]|0)>>>0<=4096){r32=3;r3=674;break}}HEAP32[r14]=2;r32=2;r3=674;break}}while(0);if(r3==674){r3=0;r35=HEAP32[r15];r36=r32}if(!(r35>>>0<3|r36>>>0>r35>>>0)){break}if((HEAP32[r22]|0)==0){HEAP32[r22]=1;HEAP32[r8]=HEAP32[r8]+1|0;r33=HEAP32[r4]-1|0;HEAP32[r4]=r33;r29=r33;continue}r33=HEAP8[HEAP32[r9]+(HEAP32[r8]-1)|0];HEAP16[HEAP32[r19]+(HEAP32[r18]<<1)>>1]=0;r30=HEAP32[r18];HEAP32[r18]=r30+1|0;HEAP8[HEAP32[r20]+r30|0]=r33;r30=((r33&255)<<2)+r1+148|0;HEAP16[r30>>1]=HEAP16[r30>>1]+1&65535;do{if((HEAP32[r18]|0)==(HEAP32[r21>>2]-1|0)){r30=HEAP32[r23];if((r30|0)>-1){r37=HEAP32[r9]+r30|0}else{r37=0}__tr_flush_block(r24,r37,HEAP32[r8]-r30|0,0);HEAP32[r23]=HEAP32[r8];r30=HEAP32[r25];r33=HEAP32[r30+28>>2];r34=(r33+5820|0)>>2;r38=HEAP32[r34];do{if((r38|0)==16){r39=(r33+5816|0)>>1;r40=HEAP16[r39]&255;r41=r33+20|0,r42=r41>>2;r43=HEAP32[r42];HEAP32[r42]=r43+1|0;r44=r33+8|0;HEAP8[HEAP32[r44>>2]+r43|0]=r40;r40=HEAPU16[r39]>>>8&255;r43=HEAP32[r42];HEAP32[r42]=r43+1|0;HEAP8[HEAP32[r44>>2]+r43|0]=r40;HEAP16[r39]=0;HEAP32[r34]=0;r39=r41,r45=r39>>2}else{if((r38|0)>7){r41=(r33+5816|0)>>1;r40=HEAP16[r41]&255;r43=r33+20|0;r44=HEAP32[r43>>2];HEAP32[r43>>2]=r44+1|0;HEAP8[HEAP32[r33+8>>2]+r44|0]=r40;HEAP16[r41]=HEAPU16[r41]>>>8;HEAP32[r34]=HEAP32[r34]-8|0;r39=r43,r45=r39>>2;break}else{r39=r33+20|0,r45=r39>>2;break}}}while(0);r34=HEAP32[r45];r38=(r30+16|0)>>2;r39=HEAP32[r38];r43=r34>>>0>r39>>>0?r39:r34;if((r43|0)==0){break}r34=(r30+12|0)>>2;r39=(r33+16|0)>>2;_memcpy(HEAP32[r34],HEAP32[r39],r43);HEAP32[r34]=HEAP32[r34]+r43|0;HEAP32[r39]=HEAP32[r39]+r43|0;r34=r30+20|0;HEAP32[r34>>2]=HEAP32[r34>>2]+r43|0;HEAP32[r38]=HEAP32[r38]-r43|0;r38=HEAP32[r45];HEAP32[r45]=r38-r43|0;if((r38|0)!=(r43|0)){break}HEAP32[r39]=HEAP32[r33+8>>2]}}while(0);HEAP32[r8]=HEAP32[r8]+1|0;r39=HEAP32[r4]-1|0;HEAP32[r4]=r39;if((HEAP32[HEAP32[r25]+16>>2]|0)==0){r31=0;r3=739;break L891}else{r29=r39}}r29=HEAP32[r8];r39=r29-3+HEAP32[r4]|0;r43=r35+253|0;r38=r29+65535-HEAP32[r17]|0;HEAP16[HEAP32[r19]+(HEAP32[r18]<<1)>>1]=r38&65535;r29=HEAP32[r18];HEAP32[r18]=r29+1|0;HEAP8[HEAP32[r20]+r29|0]=r43&255;r29=((HEAPU8[(r43&255)+5256416|0]|256)+1<<2)+r1+148|0;HEAP16[r29>>1]=HEAP16[r29>>1]+1&65535;r29=r38+65535&65535;if(r29>>>0<256){r46=r29}else{r46=(r29>>>7)+256|0}r29=(HEAPU8[r46+5257144|0]<<2)+r1+2440|0;HEAP16[r29>>1]=HEAP16[r29>>1]+1&65535;r29=HEAP32[r18];r38=HEAP32[r21>>2]-1|0;r43=HEAP32[r15];HEAP32[r4]=1-r43+HEAP32[r4]|0;r34=r43-2|0;HEAP32[r15]=r34;r43=r34;while(1){r34=HEAP32[r8];r41=r34+1|0;HEAP32[r8]=r41;if(r41>>>0>r39>>>0){r47=r43}else{r40=(HEAPU8[HEAP32[r9]+r34+3|0]^HEAP32[r6]<<HEAP32[r7>>2])&HEAP32[r10>>2];HEAP32[r6]=r40;HEAP16[HEAP32[r13>>2]+((HEAP32[r12>>2]&r41)<<1)>>1]=HEAP16[HEAP32[r11]+(r40<<1)>>1];HEAP16[HEAP32[r11]+(HEAP32[r6]<<1)>>1]=HEAP32[r8]&65535;r47=HEAP32[r15]}r40=r47-1|0;HEAP32[r15]=r40;if((r40|0)==0){break}else{r43=r40}}HEAP32[r22]=0;HEAP32[r14]=2;r43=HEAP32[r8]+1|0;HEAP32[r8]=r43;if((r29|0)!=(r38|0)){continue}r39=HEAP32[r23];if((r39|0)>-1){r48=HEAP32[r9]+r39|0}else{r48=0}__tr_flush_block(r24,r48,r43-r39|0,0);HEAP32[r23]=HEAP32[r8];r39=HEAP32[r25];r43=HEAP32[r39+28>>2];r40=(r43+5820|0)>>2;r41=HEAP32[r40];do{if((r41|0)==16){r34=(r43+5816|0)>>1;r44=HEAP16[r34]&255;r42=r43+20|0,r49=r42>>2;r50=HEAP32[r49];HEAP32[r49]=r50+1|0;r51=r43+8|0;HEAP8[HEAP32[r51>>2]+r50|0]=r44;r44=HEAPU16[r34]>>>8&255;r50=HEAP32[r49];HEAP32[r49]=r50+1|0;HEAP8[HEAP32[r51>>2]+r50|0]=r44;HEAP16[r34]=0;HEAP32[r40]=0;r34=r42,r52=r34>>2}else{if((r41|0)>7){r42=(r43+5816|0)>>1;r44=HEAP16[r42]&255;r50=r43+20|0;r51=HEAP32[r50>>2];HEAP32[r50>>2]=r51+1|0;HEAP8[HEAP32[r43+8>>2]+r51|0]=r44;HEAP16[r42]=HEAPU16[r42]>>>8;HEAP32[r40]=HEAP32[r40]-8|0;r34=r50,r52=r34>>2;break}else{r34=r43+20|0,r52=r34>>2;break}}}while(0);r40=HEAP32[r52];r41=(r39+16|0)>>2;r38=HEAP32[r41];r29=r40>>>0>r38>>>0?r38:r40;do{if((r29|0)!=0){r40=(r39+12|0)>>2;r38=(r43+16|0)>>2;_memcpy(HEAP32[r40],HEAP32[r38],r29);HEAP32[r40]=HEAP32[r40]+r29|0;HEAP32[r38]=HEAP32[r38]+r29|0;r40=r39+20|0;HEAP32[r40>>2]=HEAP32[r40>>2]+r29|0;HEAP32[r41]=HEAP32[r41]-r29|0;r40=HEAP32[r52];HEAP32[r52]=r40-r29|0;if((r40|0)!=(r29|0)){break}HEAP32[r38]=HEAP32[r43+8>>2]}}while(0);if((HEAP32[HEAP32[r25]+16>>2]|0)==0){r31=0;r3=737;break}}if(r3==708){if((HEAP32[r22]|0)!=0){r52=HEAP8[HEAP32[r9]+(HEAP32[r8]-1)|0];HEAP16[HEAP32[r19]+(HEAP32[r18]<<1)>>1]=0;r19=HEAP32[r18];HEAP32[r18]=r19+1|0;HEAP8[HEAP32[r20]+r19|0]=r52;r19=((r52&255)<<2)+r1+148|0;HEAP16[r19>>1]=HEAP16[r19>>1]+1&65535;HEAP32[r22]=0}r22=HEAP32[r8];HEAP32[r1+5812>>2]=r22>>>0<2?r22:2;if((r2|0)==4){r2=HEAP32[r23];if((r2|0)>-1){r53=HEAP32[r9]+r2|0}else{r53=0}__tr_flush_block(r24,r53,r22-r2|0,1);HEAP32[r23]=HEAP32[r8];r2=HEAP32[r25];r53=HEAP32[r2+28>>2];r1=(r53+5820|0)>>2;r19=HEAP32[r1];do{if((r19|0)==16){r52=(r53+5816|0)>>1;r20=HEAP16[r52]&255;r48=r53+20|0,r14=r48>>2;r15=HEAP32[r14];HEAP32[r14]=r15+1|0;r47=r53+8|0;HEAP8[HEAP32[r47>>2]+r15|0]=r20;r20=HEAPU16[r52]>>>8&255;r15=HEAP32[r14];HEAP32[r14]=r15+1|0;HEAP8[HEAP32[r47>>2]+r15|0]=r20;HEAP16[r52]=0;HEAP32[r1]=0;r52=r48,r54=r52>>2}else{if((r19|0)>7){r48=(r53+5816|0)>>1;r20=HEAP16[r48]&255;r15=r53+20|0;r47=HEAP32[r15>>2];HEAP32[r15>>2]=r47+1|0;HEAP8[HEAP32[r53+8>>2]+r47|0]=r20;HEAP16[r48]=HEAPU16[r48]>>>8;HEAP32[r1]=HEAP32[r1]-8|0;r52=r15,r54=r52>>2;break}else{r52=r53+20|0,r54=r52>>2;break}}}while(0);r1=HEAP32[r54];r19=(r2+16|0)>>2;r52=HEAP32[r19];r15=r1>>>0>r52>>>0?r52:r1;do{if((r15|0)!=0){r1=(r2+12|0)>>2;r52=(r53+16|0)>>2;_memcpy(HEAP32[r1],HEAP32[r52],r15);HEAP32[r1]=HEAP32[r1]+r15|0;HEAP32[r52]=HEAP32[r52]+r15|0;r1=r2+20|0;HEAP32[r1>>2]=HEAP32[r1>>2]+r15|0;HEAP32[r19]=HEAP32[r19]-r15|0;r1=HEAP32[r54];HEAP32[r54]=r1-r15|0;if((r1|0)!=(r15|0)){break}HEAP32[r52]=HEAP32[r53+8>>2]}}while(0);r31=(HEAP32[HEAP32[r25]+16>>2]|0)==0?2:3;return r31}do{if((HEAP32[r18]|0)!=0){r53=HEAP32[r23];if((r53|0)>-1){r55=HEAP32[r9]+r53|0}else{r55=0}__tr_flush_block(r24,r55,r22-r53|0,0);HEAP32[r23]=HEAP32[r8];r53=HEAP32[r25];r15=HEAP32[r53+28>>2];r54=(r15+5820|0)>>2;r19=HEAP32[r54];do{if((r19|0)==16){r2=(r15+5816|0)>>1;r52=HEAP16[r2]&255;r1=r15+20|0,r48=r1>>2;r20=HEAP32[r48];HEAP32[r48]=r20+1|0;r47=r15+8|0;HEAP8[HEAP32[r47>>2]+r20|0]=r52;r52=HEAPU16[r2]>>>8&255;r20=HEAP32[r48];HEAP32[r48]=r20+1|0;HEAP8[HEAP32[r47>>2]+r20|0]=r52;HEAP16[r2]=0;HEAP32[r54]=0;r2=r1,r56=r2>>2}else{if((r19|0)>7){r1=(r15+5816|0)>>1;r52=HEAP16[r1]&255;r20=r15+20|0;r47=HEAP32[r20>>2];HEAP32[r20>>2]=r47+1|0;HEAP8[HEAP32[r15+8>>2]+r47|0]=r52;HEAP16[r1]=HEAPU16[r1]>>>8;HEAP32[r54]=HEAP32[r54]-8|0;r2=r20,r56=r2>>2;break}else{r2=r15+20|0,r56=r2>>2;break}}}while(0);r54=HEAP32[r56];r19=(r53+16|0)>>2;r2=HEAP32[r19];r20=r54>>>0>r2>>>0?r2:r54;do{if((r20|0)!=0){r54=(r53+12|0)>>2;r2=(r15+16|0)>>2;_memcpy(HEAP32[r54],HEAP32[r2],r20);HEAP32[r54]=HEAP32[r54]+r20|0;HEAP32[r2]=HEAP32[r2]+r20|0;r54=r53+20|0;HEAP32[r54>>2]=HEAP32[r54>>2]+r20|0;HEAP32[r19]=HEAP32[r19]-r20|0;r54=HEAP32[r56];HEAP32[r56]=r54-r20|0;if((r54|0)!=(r20|0)){break}HEAP32[r2]=HEAP32[r15+8>>2]}}while(0);if((HEAP32[HEAP32[r25]+16>>2]|0)==0){r31=0}else{break}return r31}}while(0);r31=1;return r31}else if(r3==737){return r31}else if(r3==738){return r31}else if(r3==739){return r31}}function _longest_match(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30;r3=r1>>2;r4=0;r5=HEAP32[r3+31];r6=HEAP32[r3+14];r7=HEAP32[r3+27];r8=r6+r7|0;r9=HEAP32[r3+30];r10=HEAP32[r3+36];r11=HEAP32[r3+11]-262|0;r12=r7>>>0>r11>>>0?r7-r11|0:0;r11=HEAP32[r3+16];r13=HEAP32[r3+13];r14=r7+(r6+258)|0;r15=HEAP32[r3+29];r16=r10>>>0>r15>>>0?r15:r10;r10=r1+112|0;r1=r7+(r6+1)|0;r17=r7+(r6+2)|0;r18=r14;r19=r7+257|0;r20=HEAP8[r6+r9+r7|0];r21=HEAP8[r6+(r7-1)+r9|0];r22=r2;r2=r9>>>0<HEAP32[r3+35]>>>0?r5:r5>>>2;r5=r9;L1003:while(1){r9=r6+r22|0;do{if(HEAP8[r6+r22+r5|0]<<24>>24==r20<<24>>24){if(HEAP8[r6+(r5-1)+r22|0]<<24>>24!=r21<<24>>24){r23=r20;r24=r21;r25=r5;break}if(HEAP8[r9]<<24>>24!=HEAP8[r8]<<24>>24){r23=r20;r24=r21;r25=r5;break}if(HEAP8[r22+(r6+1)|0]<<24>>24!=HEAP8[r1]<<24>>24){r23=r20;r24=r21;r25=r5;break}r3=r17;r26=r22+(r6+2)|0;while(1){r27=r3+1|0;if(HEAP8[r27]<<24>>24!=HEAP8[r26+1|0]<<24>>24){r28=r27;break}r27=r3+2|0;if(HEAP8[r27]<<24>>24!=HEAP8[r26+2|0]<<24>>24){r28=r27;break}r27=r3+3|0;if(HEAP8[r27]<<24>>24!=HEAP8[r26+3|0]<<24>>24){r28=r27;break}r27=r3+4|0;if(HEAP8[r27]<<24>>24!=HEAP8[r26+4|0]<<24>>24){r28=r27;break}r27=r3+5|0;if(HEAP8[r27]<<24>>24!=HEAP8[r26+5|0]<<24>>24){r28=r27;break}r27=r3+6|0;if(HEAP8[r27]<<24>>24!=HEAP8[r26+6|0]<<24>>24){r28=r27;break}r27=r3+7|0;if(HEAP8[r27]<<24>>24!=HEAP8[r26+7|0]<<24>>24){r28=r27;break}r27=r3+8|0;r29=r26+8|0;if(HEAP8[r27]<<24>>24==HEAP8[r29]<<24>>24&r27>>>0<r14>>>0){r3=r27;r26=r29}else{r28=r27;break}}r26=r28-r18|0;r3=r26+258|0;if((r3|0)<=(r5|0)){r23=r20;r24=r21;r25=r5;break}HEAP32[r10>>2]=r22;if((r3|0)>=(r16|0)){r30=r3;r4=762;break L1003}r23=HEAP8[r6+r3+r7|0];r24=HEAP8[r6+r19+r26|0];r25=r3}else{r23=r20;r24=r21;r25=r5}}while(0);r9=HEAPU16[r11+((r22&r13)<<1)>>1];if(r9>>>0<=r12>>>0){r30=r25;r4=763;break}r3=r2-1|0;if((r3|0)==0){r30=r25;r4=764;break}else{r20=r23;r21=r24;r22=r9;r2=r3;r5=r25}}if(r4==762){r25=r30>>>0>r15>>>0;r5=r25?r15:r30;return r5}else if(r4==763){r25=r30>>>0>r15>>>0;r5=r25?r15:r30;return r5}else if(r4==764){r25=r30>>>0>r15>>>0;r5=r25?r15:r30;return r5}}function _inflate(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36,r37,r38,r39,r40,r41,r42,r43,r44,r45,r46,r47,r48,r49,r50,r51,r52,r53,r54,r55,r56,r57,r58,r59,r60,r61,r62,r63,r64,r65,r66,r67,r68,r69,r70,r71,r72,r73,r74,r75,r76,r77,r78,r79,r80,r81,r82,r83,r84,r85,r86,r87,r88,r89,r90,r91,r92,r93,r94,r95,r96,r97,r98,r99,r100,r101,r102,r103,r104,r105,r106,r107,r108,r109,r110,r111,r112,r113,r114,r115,r116,r117,r118,r119,r120,r121,r122,r123,r124,r125,r126,r127,r128,r129,r130,r131,r132,r133,r134,r135,r136,r137,r138,r139,r140,r141,r142,r143,r144,r145,r146,r147,r148,r149,r150,r151,r152,r153,r154,r155,r156,r157,r158,r159,r160,r161,r162,r163,r164,r165,r166,r167,r168,r169,r170,r171,r172,r173,r174,r175,r176,r177,r178,r179,r180,r181,r182,r183,r184,r185,r186,r187,r188,r189,r190,r191,r192,r193,r194,r195,r196,r197,r198,r199,r200,r201,r202,r203,r204,r205,r206,r207,r208,r209,r210,r211,r212,r213,r214,r215,r216,r217,r218,r219,r220,r221,r222,r223,r224,r225,r226,r227,r228,r229,r230,r231,r232,r233,r234,r235,r236,r237,r238,r239,r240,r241,r242,r243,r244,r245,r246,r247,r248,r249,r250,r251,r252,r253,r254,r255,r256,r257,r258,r259,r260,r261,r262,r263,r264,r265,r266,r267,r268,r269,r270,r271,r272,r273,r274,r275,r276,r277,r278,r279,r280,r281,r282,r283,r284,r285,r286,r287,r288,r289,r290,r291,r292,r293,r294,r295,r296,r297,r298,r299,r300,r301,r302,r303,r304,r305,r306,r307,r308,r309,r310,r311,r312,r313,r314,r315,r316,r317,r318,r319,r320,r321,r322,r323,r324,r325,r326,r327,r328,r329,r330,r331,r332,r333,r334,r335,r336,r337,r338,r339,r340,r341,r342,r343,r344,r345,r346,r347,r348,r349,r350,r351,r352,r353,r354,r355,r356,r357,r358,r359,r360,r361,r362,r363,r364,r365,r366,r367,r368,r369,r370,r371,r372,r373,r374,r375,r376,r377,r378,r379,r380,r381,r382,r383,r384,r385,r386,r387,r388,r389,r390,r391,r392,r393,r394,r395,r396,r397,r398,r399,r400,r401,r402,r403,r404,r405,r406,r407,r408;r3=0;r4=STACKTOP;STACKTOP=STACKTOP+4|0;r5=r4;if((r1|0)==0){r6=-2;STACKTOP=r4;return r6}r7=HEAP32[r1+28>>2];if((r7|0)==0){r6=-2;STACKTOP=r4;return r6}r8=(r1+12|0)>>2;r9=HEAP32[r8];if((r9|0)==0){r6=-2;STACKTOP=r4;return r6}r10=(r1|0)>>2;r11=HEAP32[r10];do{if((r11|0)==0){if((HEAP32[r1+4>>2]|0)==0){break}else{r6=-2}STACKTOP=r4;return r6}}while(0);r12=(r7|0)>>2;r13=HEAP32[r12];if((r13|0)==11){HEAP32[r12]=12;r14=HEAP32[r8];r15=HEAP32[r10];r16=12}else{r14=r9;r15=r11;r16=r13}r13=(r1+16|0)>>2;r11=HEAP32[r13];r9=(r1+4|0)>>2;r17=HEAP32[r9];r18=(r7+56|0)>>2;r19=(r7+60|0)>>2;r20=(r7+8|0)>>2;r21=(r7+24|0)>>2;r22=r5|0;r23=r5+1|0;r24=(r7+16|0)>>2;r25=(r7+32|0)>>2;r26=(r1+24|0)>>2;r27=r7+36|0;r28=r7+20|0;r29=(r1+48|0)>>2;r30=(r7+64|0)>>2;r31=r7+12|0;r32=(r2-5|0)>>>0<2;r33=(r7+4|0)>>2;r34=(r7+76|0)>>2;r35=r7+84|0,r36=r35>>2;r37=r7+80|0;r38=r7+88|0,r39=r38>>2;r40=(r2|0)==6;r41=(r7+7108|0)>>2;r42=r7+76|0;r43=(r7+72|0)>>2;r44=r7+7112|0;r45=(r7+68|0)>>2;r46=r7+44|0;r47=r7+7104|0;r48=r7+48|0;r49=r7+52|0;r50=r7+40|0;r51=(r1+20|0)>>2;r52=(r7+28|0)>>2;r53=(r7+96|0)>>2;r54=(r7+100|0)>>2;r55=(r7+92|0)>>2;r56=(r7+104|0)>>2;r57=r7+108|0;r58=r57;r59=r57|0;r57=r7+1328|0;r60=r7+112|0;r61=r60;r62=r7+752|0;r63=r60>>1;r60=r7+624|0;r64=r7+80|0;r7=r5+2|0;r65=r5+3|0;r5=0;r66=r11;r67=HEAP32[r19];r68=HEAP32[r18];r69=r11;r11=r17;r70=r14;r14=r15;r15=r16;L1045:while(1){L1047:do{if((r15|0)==7){r71=r67;r72=r68;r73=r11;r74=r14;r3=861}else if((r15|0)==16){L1049:do{if(r67>>>0<14){r16=r14;r75=r11;r76=r68;r77=r67;while(1){if((r75|0)==0){r78=r5;r79=r66;r80=r77;r81=r76;r82=0;r83=r16;r84=r69;break L1045}r85=r75-1|0;r86=r16+1|0;r87=(HEAPU8[r16]<<r77)+r76|0;r88=r77+8|0;if(r88>>>0<14){r16=r86;r75=r85;r76=r87;r77=r88}else{r89=r86;r90=r85;r91=r87;r92=r88;break L1049}}}else{r89=r14;r90=r11;r91=r68;r92=r67}}while(0);r77=(r91&31)+257|0;HEAP32[r53]=r77;r76=(r91>>>5&31)+1|0;HEAP32[r54]=r76;HEAP32[r55]=(r91>>>10&15)+4|0;r75=r91>>>14;r16=r92-14|0;if(r77>>>0>286|r76>>>0>30){HEAP32[r26]=5255652;HEAP32[r12]=29;r93=r5;r94=r66;r95=r16;r96=r75;r97=r69;r98=r90;r99=r70;r100=r89;break}else{HEAP32[r56]=0;HEAP32[r12]=17;r101=r89;r102=r90;r103=r75;r104=r16;r105=0;r3=919;break}}else if((r15|0)==2){if(r67>>>0<32){r106=r14;r107=r11;r108=r68;r109=r67;r3=812;break}else{r110=r14;r111=r11;r112=r68;r3=814;break}}else if((r15|0)==9){L1059:do{if(r67>>>0<32){r16=r14;r75=r11;r76=r68;r77=r67;while(1){if((r75|0)==0){r78=r5;r79=r66;r80=r77;r81=r76;r82=0;r83=r16;r84=r69;break L1045}r88=r75-1|0;r87=r16+1|0;r85=(HEAPU8[r16]<<r77)+r76|0;r86=r77+8|0;if(r86>>>0<32){r16=r87;r75=r88;r76=r85;r77=r86}else{r113=r87;r114=r88;r115=r85;break L1059}}}else{r113=r14;r114=r11;r115=r68}}while(0);r77=_llvm_bswap_i32(r115);HEAP32[r21]=r77;HEAP32[r29]=r77;HEAP32[r12]=10;r116=0;r117=0;r118=r114;r119=r113;r3=886;break}else if((r15|0)==6){r120=r67;r121=r68;r122=r11;r123=r14;r124=HEAP32[r24];r3=848;break}else if((r15|0)==23){r125=r5;r126=r67;r127=r68;r128=r11;r129=r14;r130=HEAP32[r43];r3=1001;break}else if((r15|0)==5){r131=r67;r132=r68;r133=r11;r134=r14;r3=838}else if((r15|0)==28){r135=1;r136=r67;r137=r68;r138=r11;r139=r14;r140=r69;r3=1046;break L1045}else if((r15|0)==29){r78=-3;r79=r66;r80=r67;r81=r68;r82=r11;r83=r14;r84=r69;break L1045}else if((r15|0)==30){r3=1062;break L1045}else if((r15|0)==18){r141=r5;r142=r67;r143=r68;r144=r11;r145=r14;r146=HEAP32[r56];r3=928;break}else if((r15|0)==19){r147=r5;r148=r67;r149=r68;r150=r11;r151=r14;r3=962}else if((r15|0)==20){r152=r5;r153=r67;r154=r68;r155=r11;r156=r14;r3=963}else if((r15|0)==0){r77=HEAP32[r20];if((r77|0)==0){HEAP32[r12]=12;r93=r5;r94=r66;r95=r67;r96=r68;r97=r69;r98=r11;r99=r70;r100=r14;break}L1071:do{if(r67>>>0<16){r76=r14;r75=r11;r16=r68;r85=r67;while(1){if((r75|0)==0){r78=r5;r79=r66;r80=r85;r81=r16;r82=0;r83=r76;r84=r69;break L1045}r88=r75-1|0;r87=r76+1|0;r86=(HEAPU8[r76]<<r85)+r16|0;r157=r85+8|0;if(r157>>>0<16){r76=r87;r75=r88;r16=r86;r85=r157}else{r158=r87;r159=r88;r160=r86;r161=r157;break L1071}}}else{r158=r14;r159=r11;r160=r68;r161=r67}}while(0);if((r77&2|0)!=0&(r160|0)==35615){HEAP32[r21]=0;HEAP8[r22]=31;HEAP8[r23]=-117;HEAP32[r21]=_crc32(HEAP32[r21],r22,2);HEAP32[r12]=1;r93=r5;r94=r66;r95=0;r96=0;r97=r69;r98=r159;r99=r70;r100=r158;break}HEAP32[r24]=0;r85=HEAP32[r25];if((r85|0)==0){r162=r77}else{HEAP32[r85+48>>2]=-1;r162=HEAP32[r20]}do{if((r162&1|0)!=0){if(((((r160<<8&65280)+(r160>>>8)|0)>>>0)%31|0)!=0){break}if((r160&15|0)!=8){HEAP32[r26]=5256044;HEAP32[r12]=29;r93=r5;r94=r66;r95=r161;r96=r160;r97=r69;r98=r159;r99=r70;r100=r158;break L1047}r85=r160>>>4;r16=r161-4|0;r75=(r85&15)+8|0;r76=HEAP32[r27>>2];do{if((r76|0)==0){HEAP32[r27>>2]=r75}else{if(r75>>>0<=r76>>>0){break}HEAP32[r26]=5255976;HEAP32[r12]=29;r93=r5;r94=r66;r95=r16;r96=r85;r97=r69;r98=r159;r99=r70;r100=r158;break L1047}}while(0);HEAP32[r28>>2]=1<<r75;HEAP32[r21]=1;HEAP32[r29]=1;HEAP32[r12]=r160>>>12&2^11;r93=r5;r94=r66;r95=0;r96=0;r97=r69;r98=r159;r99=r70;r100=r158;break L1047}}while(0);HEAP32[r26]=5256268;HEAP32[r12]=29;r93=r5;r94=r66;r95=r161;r96=r160;r97=r69;r98=r159;r99=r70;r100=r158;break}else if((r15|0)==22){r163=r5;r164=r67;r165=r68;r166=r11;r167=r14;r3=989}else if((r15|0)==14){r168=r67;r169=r68;r170=r11;r171=r14;r3=908}else if((r15|0)==15){r172=r67;r173=r68;r174=r11;r175=r14;r3=909}else if((r15|0)==11){r176=r67;r177=r68;r178=r11;r179=r14;r3=889}else if((r15|0)==12){r180=r67;r181=r68;r182=r11;r183=r14;r3=890}else if((r15|0)==21){r184=r5;r185=r67;r186=r68;r187=r11;r188=r14;r189=HEAP32[r43];r3=982;break}else if((r15|0)==4){r190=r67;r191=r68;r192=r11;r193=r14;r3=827}else if((r15|0)==24){r194=r5;r195=r67;r196=r68;r197=r11;r198=r14;r3=1007}else if((r15|0)==25){if((r69|0)==0){r135=r5;r136=r67;r137=r68;r138=r11;r139=r14;r140=0;r3=1046;break L1045}HEAP8[r70]=HEAP32[r30]&255;HEAP32[r12]=20;r93=r5;r94=r66;r95=r67;r96=r68;r97=r69-1|0;r98=r11;r99=r70+1|0;r100=r14;break}else if((r15|0)==26){do{if((HEAP32[r20]|0)==0){r199=r66;r200=r67;r201=r68;r202=r11;r203=r14}else{L1100:do{if(r67>>>0<32){r77=r14;r85=r11;r16=r68;r76=r67;while(1){if((r85|0)==0){r78=r5;r79=r66;r80=r76;r81=r16;r82=0;r83=r77;r84=r69;break L1045}r157=r85-1|0;r86=r77+1|0;r88=(HEAPU8[r77]<<r76)+r16|0;r87=r76+8|0;if(r87>>>0<32){r77=r86;r85=r157;r16=r88;r76=r87}else{r204=r86;r205=r157;r206=r88;r207=r87;break L1100}}}else{r204=r14;r205=r11;r206=r68;r207=r67}}while(0);r75=r66-r69|0;HEAP32[r51]=HEAP32[r51]+r75|0;HEAP32[r52]=HEAP32[r52]+r75|0;if((r66|0)!=(r69|0)){r76=HEAP32[r21];r16=r70+ -r75|0;if((HEAP32[r24]|0)==0){r208=_adler32(r76,r16,r75)}else{r208=_crc32(r76,r16,r75)}HEAP32[r21]=r208;HEAP32[r29]=r208}if((HEAP32[r24]|0)==0){r209=_llvm_bswap_i32(r206)}else{r209=r206}if((r209|0)==(HEAP32[r21]|0)){r199=r69;r200=0;r201=0;r202=r205;r203=r204;break}HEAP32[r26]=5256144;HEAP32[r12]=29;r93=r5;r94=r69;r95=r207;r96=r206;r97=r69;r98=r205;r99=r70;r100=r204;break L1047}}while(0);HEAP32[r12]=27;r210=r199;r211=r200;r212=r201;r213=r202;r214=r203;r3=1038;break}else if((r15|0)==27){r210=r66;r211=r67;r212=r68;r213=r11;r214=r14;r3=1038}else if((r15|0)==3){if(r67>>>0<16){r215=r14;r216=r11;r217=r68;r218=r67;r3=820;break}else{r219=r14;r220=r11;r221=r68;r3=822;break}}else if((r15|0)==1){L1119:do{if(r67>>>0<16){r75=r14;r16=r11;r76=r68;r85=r67;while(1){if((r16|0)==0){r78=r5;r79=r66;r80=r85;r81=r76;r82=0;r83=r75;r84=r69;break L1045}r77=r16-1|0;r87=r75+1|0;r88=(HEAPU8[r75]<<r85)+r76|0;r157=r85+8|0;if(r157>>>0<16){r75=r87;r16=r77;r76=r88;r85=r157}else{r222=r87;r223=r77;r224=r88;r225=r157;break L1119}}}else{r222=r14;r223=r11;r224=r68;r225=r67}}while(0);HEAP32[r24]=r224;if((r224&255|0)!=8){HEAP32[r26]=5256044;HEAP32[r12]=29;r93=r5;r94=r66;r95=r225;r96=r224;r97=r69;r98=r223;r99=r70;r100=r222;break}if((r224&57344|0)!=0){HEAP32[r26]=5255928;HEAP32[r12]=29;r93=r5;r94=r66;r95=r225;r96=r224;r97=r69;r98=r223;r99=r70;r100=r222;break}r85=HEAP32[r25];if((r85|0)==0){r226=r224}else{HEAP32[r85>>2]=r224>>>8&1;r226=HEAP32[r24]}if((r226&512|0)!=0){HEAP8[r22]=r224&255;HEAP8[r23]=r224>>>8&255;HEAP32[r21]=_crc32(HEAP32[r21],r22,2)}HEAP32[r12]=2;r106=r222;r107=r223;r108=0;r109=0;r3=812;break}else if((r15|0)==10){r116=r67;r117=r68;r118=r11;r119=r14;r3=886}else if((r15|0)==13){r85=r67&7;r76=r68>>>(r85>>>0);r16=r67-r85|0;L1137:do{if(r16>>>0<32){r85=r14;r75=r11;r157=r76;r88=r16;while(1){if((r75|0)==0){r78=r5;r79=r66;r80=r88;r81=r157;r82=0;r83=r85;r84=r69;break L1045}r77=r75-1|0;r87=r85+1|0;r86=(HEAPU8[r85]<<r88)+r157|0;r227=r88+8|0;if(r227>>>0<32){r85=r87;r75=r77;r157=r86;r88=r227}else{r228=r87;r229=r77;r230=r86;r231=r227;break L1137}}}else{r228=r14;r229=r11;r230=r76;r231=r16}}while(0);r16=r230&65535;if((r16|0)==(r230>>>16^65535|0)){HEAP32[r30]=r16;HEAP32[r12]=14;if(r40){r135=r5;r136=0;r137=0;r138=r229;r139=r228;r140=r69;r3=1046;break L1045}else{r168=0;r169=0;r170=r229;r171=r228;r3=908;break}}else{HEAP32[r26]=5255732;HEAP32[r12]=29;r93=r5;r94=r66;r95=r231;r96=r230;r97=r69;r98=r229;r99=r70;r100=r228;break}}else if((r15|0)==17){r16=HEAP32[r56];if(r16>>>0<HEAP32[r55]>>>0){r101=r14;r102=r11;r103=r68;r104=r67;r105=r16;r3=919;break}else{r232=r14;r233=r11;r234=r68;r235=r67;r236=r16;r3=923;break}}else if((r15|0)==8){r237=r67;r238=r68;r239=r11;r240=r14;r3=874}else{r6=-2;r3=1067;break L1045}}while(0);L1146:do{if(r3==919){while(1){r3=0;L1149:do{if(r104>>>0<3){r16=r101;r76=r102;r88=r103;r157=r104;while(1){if((r76|0)==0){r78=r5;r79=r66;r80=r157;r81=r88;r82=0;r83=r16;r84=r69;break L1045}r75=r76-1|0;r85=r16+1|0;r227=(HEAPU8[r16]<<r157)+r88|0;r86=r157+8|0;if(r86>>>0<3){r16=r85;r76=r75;r88=r227;r157=r86}else{r241=r85;r242=r75;r243=r227;r244=r86;break L1149}}}else{r241=r101;r242=r102;r243=r103;r244=r104}}while(0);HEAP32[r56]=r105+1|0;HEAP16[(HEAPU16[(r105<<1)+5244492>>1]<<1>>1)+r63]=r243&7;r157=r243>>>3;r88=r244-3|0;r76=HEAP32[r56];if(r76>>>0<HEAP32[r55]>>>0){r101=r241;r102=r242;r103=r157;r104=r88;r105=r76;r3=919}else{r232=r241;r233=r242;r234=r157;r235=r88;r236=r76;r3=923;break L1146}}}else if(r3==908){r3=0;HEAP32[r12]=15;r172=r168;r173=r169;r174=r170;r175=r171;r3=909;break}else if(r3==1038){r3=0;if((HEAP32[r20]|0)==0){r245=r211;r246=r212;r247=r213;r248=r214;r3=1045;break L1045}if((HEAP32[r24]|0)==0){r245=r211;r246=r212;r247=r213;r248=r214;r3=1045;break L1045}L1158:do{if(r211>>>0<32){r76=r214;r88=r213;r157=r212;r16=r211;while(1){if((r88|0)==0){r78=r5;r79=r210;r80=r16;r81=r157;r82=0;r83=r76;r84=r69;break L1045}r86=r88-1|0;r227=r76+1|0;r75=(HEAPU8[r76]<<r16)+r157|0;r85=r16+8|0;if(r85>>>0<32){r76=r227;r88=r86;r157=r75;r16=r85}else{r249=r227;r250=r86;r251=r75;r252=r85;break L1158}}}else{r249=r214;r250=r213;r251=r212;r252=r211}}while(0);if((r251|0)==(HEAP32[r52]|0)){r245=0;r246=0;r247=r250;r248=r249;r3=1045;break L1045}HEAP32[r26]=5256096;HEAP32[r12]=29;r93=r5;r94=r210;r95=r252;r96=r251;r97=r69;r98=r250;r99=r70;r100=r249;break}else if(r3==812){while(1){r3=0;if((r107|0)==0){r78=r5;r79=r66;r80=r109;r81=r108;r82=0;r83=r106;r84=r69;break L1045}r16=r107-1|0;r157=r106+1|0;r88=(HEAPU8[r106]<<r109)+r108|0;r76=r109+8|0;if(r76>>>0<32){r106=r157;r107=r16;r108=r88;r109=r76;r3=812}else{r110=r157;r111=r16;r112=r88;r3=814;break L1146}}}else if(r3==886){r3=0;if((HEAP32[r31>>2]|0)==0){r3=887;break L1045}HEAP32[r21]=1;HEAP32[r29]=1;HEAP32[r12]=11;r176=r116;r177=r117;r178=r118;r179=r119;r3=889;break}}while(0);do{if(r3==923){r3=0;L1171:do{if(r236>>>0<19){r88=r236;while(1){HEAP32[r56]=r88+1|0;HEAP16[(HEAPU16[(r88<<1)+5244492>>1]<<1>>1)+r63]=0;r16=HEAP32[r56];if(r16>>>0<19){r88=r16}else{break L1171}}}}while(0);HEAP32[r59>>2]=r57;HEAP32[r34]=r57;HEAP32[r36]=7;r88=_inflate_table(0,r61,19,r58,r35,r62);if((r88|0)==0){HEAP32[r56]=0;HEAP32[r12]=18;r141=0;r142=r235;r143=r234;r144=r233;r145=r232;r146=0;r3=928;break}else{HEAP32[r26]=5255588;HEAP32[r12]=29;r93=r88;r94=r66;r95=r235;r96=r234;r97=r69;r98=r233;r99=r70;r100=r232;break}}else if(r3==814){r3=0;r88=HEAP32[r25];if((r88|0)!=0){HEAP32[r88+4>>2]=r112}if((HEAP32[r24]&512|0)!=0){HEAP8[r22]=r112&255;HEAP8[r23]=r112>>>8&255;HEAP8[r7]=r112>>>16&255;HEAP8[r65]=r112>>>24&255;HEAP32[r21]=_crc32(HEAP32[r21],r22,4)}HEAP32[r12]=3;r215=r110;r216=r111;r217=0;r218=0;r3=820;break}else if(r3==909){r3=0;r88=HEAP32[r30];if((r88|0)==0){HEAP32[r12]=11;r93=r5;r94=r66;r95=r172;r96=r173;r97=r69;r98=r174;r99=r70;r100=r175;break}r16=r88>>>0>r174>>>0?r174:r88;r88=r16>>>0>r69>>>0?r69:r16;if((r88|0)==0){r135=r5;r136=r172;r137=r173;r138=r174;r139=r175;r140=r69;r3=1046;break L1045}_memcpy(r70,r175,r88);HEAP32[r30]=HEAP32[r30]-r88|0;r93=r5;r94=r66;r95=r172;r96=r173;r97=r69-r88|0;r98=r174-r88|0;r99=r70+r88|0;r100=r175+r88|0;break}else if(r3==889){r3=0;if(r32){r135=r5;r136=r176;r137=r177;r138=r178;r139=r179;r140=r69;r3=1046;break L1045}else{r180=r176;r181=r177;r182=r178;r183=r179;r3=890;break}}}while(0);L1191:do{if(r3==928){r3=0;r88=HEAP32[r53];r16=HEAP32[r54];do{if(r146>>>0<(r16+r88|0)>>>0){r157=r145;r76=r144;r85=r143;r75=r142;r86=r146;r227=r88;r77=r16;L1194:while(1){r87=(1<<HEAP32[r36])-1|0;r253=r87&r85;r254=HEAP32[r42>>2];r255=HEAPU8[(r253<<2)+r254+1|0];L1196:do{if(r255>>>0>r75>>>0){r256=r157;r257=r76;r258=r85;r259=r75;while(1){if((r257|0)==0){r78=r141;r79=r66;r80=r259;r81=r258;r82=0;r83=r256;r84=r69;break L1045}r260=r257-1|0;r261=r256+1|0;r262=(HEAPU8[r256]<<r259)+r258|0;r263=r259+8|0;r264=r87&r262;r265=HEAPU8[(r264<<2)+r254+1|0];if(r265>>>0>r263>>>0){r256=r261;r257=r260;r258=r262;r259=r263}else{r266=r261;r267=r260;r268=r262;r269=r263;r270=r264;r271=r265;break L1196}}}else{r266=r157;r267=r76;r268=r85;r269=r75;r270=r253;r271=r255}}while(0);r255=HEAP16[r254+(r270<<2)+2>>1];L1201:do{if((r255&65535)<16){HEAP32[r56]=r86+1|0;HEAP16[(r86<<1>>1)+r63]=r255;r272=r269-r271|0;r273=r268>>>(r271>>>0);r274=r267;r275=r266}else{if(r255<<16>>16==16){r253=r271+2|0;L1212:do{if(r269>>>0<r253>>>0){r87=r266;r259=r267;r258=r268;r257=r269;while(1){if((r259|0)==0){r78=r141;r79=r66;r80=r257;r81=r258;r82=0;r83=r87;r84=r69;break L1045}r256=r259-1|0;r265=r87+1|0;r264=(HEAPU8[r87]<<r257)+r258|0;r263=r257+8|0;if(r263>>>0<r253>>>0){r87=r265;r259=r256;r258=r264;r257=r263}else{r276=r265;r277=r256;r278=r264;r279=r263;break L1212}}}else{r276=r266;r277=r267;r278=r268;r279=r269}}while(0);r280=r278>>>(r271>>>0);r281=r279-r271|0;if((r86|0)==0){r3=942;break L1194}r282=HEAP16[(r86-1<<1>>1)+r63];r283=(r280&3)+3|0;r284=r281-2|0;r285=r280>>>2;r286=r277;r287=r276}else if(r255<<16>>16==17){r253=r271+3|0;L1219:do{if(r269>>>0<r253>>>0){r257=r266;r258=r267;r259=r268;r87=r269;while(1){if((r258|0)==0){r78=r141;r79=r66;r80=r87;r81=r259;r82=0;r83=r257;r84=r69;break L1045}r263=r258-1|0;r264=r257+1|0;r256=(HEAPU8[r257]<<r87)+r259|0;r265=r87+8|0;if(r265>>>0<r253>>>0){r257=r264;r258=r263;r259=r256;r87=r265}else{r288=r264;r289=r263;r290=r256;r291=r265;break L1219}}}else{r288=r266;r289=r267;r290=r268;r291=r269}}while(0);r253=r290>>>(r271>>>0);r282=0;r283=(r253&7)+3|0;r284=-3-r271+r291|0;r285=r253>>>3;r286=r289;r287=r288}else{r253=r271+7|0;L1206:do{if(r269>>>0<r253>>>0){r87=r266;r259=r267;r258=r268;r257=r269;while(1){if((r259|0)==0){r78=r141;r79=r66;r80=r257;r81=r258;r82=0;r83=r87;r84=r69;break L1045}r265=r259-1|0;r256=r87+1|0;r263=(HEAPU8[r87]<<r257)+r258|0;r264=r257+8|0;if(r264>>>0<r253>>>0){r87=r256;r259=r265;r258=r263;r257=r264}else{r292=r256;r293=r265;r294=r263;r295=r264;break L1206}}}else{r292=r266;r293=r267;r294=r268;r295=r269}}while(0);r253=r294>>>(r271>>>0);r282=0;r283=(r253&127)+11|0;r284=-7-r271+r295|0;r285=r253>>>7;r286=r293;r287=r292}if((r86+r283|0)>>>0>(r77+r227|0)>>>0){r3=951;break L1194}else{r296=r283;r297=r86}while(1){r253=r296-1|0;HEAP32[r56]=r297+1|0;HEAP16[(r297<<1>>1)+r63]=r282;if((r253|0)==0){r272=r284;r273=r285;r274=r286;r275=r287;break L1201}r296=r253;r297=HEAP32[r56]}}}while(0);r255=HEAP32[r56];r298=HEAP32[r53];r254=HEAP32[r54];if(r255>>>0<(r254+r298|0)>>>0){r157=r275;r76=r274;r85=r273;r75=r272;r86=r255;r227=r298;r77=r254}else{r3=954;break}}if(r3==942){r3=0;HEAP32[r26]=5256356;HEAP32[r12]=29;r93=r141;r94=r66;r95=r281;r96=r280;r97=r69;r98=r277;r99=r70;r100=r276;break L1191}else if(r3==951){r3=0;HEAP32[r26]=5256356;HEAP32[r12]=29;r93=r141;r94=r66;r95=r284;r96=r285;r97=r69;r98=r286;r99=r70;r100=r287;break L1191}else if(r3==954){r3=0;if((HEAP32[r12]|0)==29){r93=r141;r94=r66;r95=r272;r96=r273;r97=r69;r98=r274;r99=r70;r100=r275;break L1191}else{r299=r298;r300=r272;r301=r273;r302=r274;r303=r275;break}}}else{r299=r88;r300=r142;r301=r143;r302=r144;r303=r145}}while(0);if(HEAP16[r60>>1]<<16>>16==0){HEAP32[r26]=5256292;HEAP32[r12]=29;r93=r141;r94=r66;r95=r300;r96=r301;r97=r69;r98=r302;r99=r70;r100=r303;break}HEAP32[r59>>2]=r57;HEAP32[r34]=r57;HEAP32[r36]=9;r88=_inflate_table(1,r61,r299,r58,r35,r62);if((r88|0)!=0){HEAP32[r26]=5256236;HEAP32[r12]=29;r93=r88;r94=r66;r95=r300;r96=r301;r97=r69;r98=r302;r99=r70;r100=r303;break}HEAP32[r37>>2]=HEAP32[r58>>2];HEAP32[r39]=6;r88=_inflate_table(2,(HEAP32[r53]<<1)+r61|0,HEAP32[r54],r58,r38,r62);if((r88|0)==0){HEAP32[r12]=19;if(r40){r135=0;r136=r300;r137=r301;r138=r302;r139=r303;r140=r69;r3=1046;break L1045}else{r147=0;r148=r300;r149=r301;r150=r302;r151=r303;r3=962;break}}else{HEAP32[r26]=5256168;HEAP32[r12]=29;r93=r88;r94=r66;r95=r300;r96=r301;r97=r69;r98=r302;r99=r70;r100=r303;break}}else if(r3==890){r3=0;if((HEAP32[r33]|0)!=0){r88=r180&7;HEAP32[r12]=26;r93=r5;r94=r66;r95=r180-r88|0;r96=r181>>>(r88>>>0);r97=r69;r98=r182;r99=r70;r100=r183;break}L1247:do{if(r180>>>0<3){r88=r183;r16=r182;r77=r181;r227=r180;while(1){if((r16|0)==0){r78=r5;r79=r66;r80=r227;r81=r77;r82=0;r83=r88;r84=r69;break L1045}r86=r16-1|0;r75=r88+1|0;r85=(HEAPU8[r88]<<r227)+r77|0;r76=r227+8|0;if(r76>>>0<3){r88=r75;r16=r86;r77=r85;r227=r76}else{r304=r75;r305=r86;r306=r85;r307=r76;break L1247}}}else{r304=r183;r305=r182;r306=r181;r307=r180}}while(0);HEAP32[r33]=r306&1;r227=r306>>>1&3;if((r227|0)==0){HEAP32[r12]=13}else if((r227|0)==1){HEAP32[r34]=5244532;HEAP32[r36]=9;HEAP32[r37>>2]=5246580;HEAP32[r39]=5;HEAP32[r12]=19;if(r40){r3=898;break L1045}}else if((r227|0)==2){HEAP32[r12]=16}else if((r227|0)==3){HEAP32[r26]=5255840;HEAP32[r12]=29}r93=r5;r94=r66;r95=r307-3|0;r96=r306>>>3;r97=r69;r98=r305;r99=r70;r100=r304;break}else if(r3==820){while(1){r3=0;if((r216|0)==0){r78=r5;r79=r66;r80=r218;r81=r217;r82=0;r83=r215;r84=r69;break L1045}r227=r216-1|0;r77=r215+1|0;r16=(HEAPU8[r215]<<r218)+r217|0;r88=r218+8|0;if(r88>>>0<16){r215=r77;r216=r227;r217=r16;r218=r88;r3=820}else{r219=r77;r220=r227;r221=r16;r3=822;break L1191}}}}while(0);do{if(r3==822){r3=0;r16=HEAP32[r25];if((r16|0)!=0){HEAP32[r16+8>>2]=r221&255;HEAP32[HEAP32[r25]+12>>2]=r221>>>8}if((HEAP32[r24]&512|0)!=0){HEAP8[r22]=r221&255;HEAP8[r23]=r221>>>8&255;HEAP32[r21]=_crc32(HEAP32[r21],r22,2)}HEAP32[r12]=4;r190=0;r191=0;r192=r220;r193=r219;r3=827;break}else if(r3==962){r3=0;HEAP32[r12]=20;r152=r147;r153=r148;r154=r149;r155=r150;r156=r151;r3=963;break}}while(0);do{if(r3==963){r3=0;if(r155>>>0>5&r69>>>0>257){HEAP32[r8]=r70;HEAP32[r13]=r69;HEAP32[r10]=r156;HEAP32[r9]=r155;HEAP32[r18]=r154;HEAP32[r19]=r153;_inflate_fast(r1,r66);r16=HEAP32[r8];r227=HEAP32[r13];r77=HEAP32[r10];r88=HEAP32[r9];r76=HEAP32[r18];r85=HEAP32[r19];if((HEAP32[r12]|0)!=11){r93=r152;r94=r66;r95=r85;r96=r76;r97=r227;r98=r88;r99=r16;r100=r77;break}HEAP32[r41]=-1;r93=r152;r94=r66;r95=r85;r96=r76;r97=r227;r98=r88;r99=r16;r100=r77;break}HEAP32[r41]=0;r77=(1<<HEAP32[r36])-1|0;r16=r77&r154;r88=HEAP32[r42>>2];r227=HEAP8[(r16<<2)+r88+1|0];r76=r227&255;L1276:do{if(r76>>>0>r153>>>0){r85=r156;r86=r155;r75=r154;r157=r153;while(1){if((r86|0)==0){r78=r152;r79=r66;r80=r157;r81=r75;r82=0;r83=r85;r84=r69;break L1045}r254=r86-1|0;r255=r85+1|0;r253=(HEAPU8[r85]<<r157)+r75|0;r257=r157+8|0;r258=r77&r253;r259=HEAP8[(r258<<2)+r88+1|0];r87=r259&255;if(r87>>>0>r257>>>0){r85=r255;r86=r254;r75=r253;r157=r257}else{r308=r255;r309=r254;r310=r253;r311=r257;r312=r259;r313=r258;r314=r87;break L1276}}}else{r308=r156;r309=r155;r310=r154;r311=r153;r312=r227;r313=r16;r314=r76}}while(0);r76=HEAP8[(r313<<2)+r88|0];r16=HEAP16[r88+(r313<<2)+2>>1];r227=r76&255;do{if(r76<<24>>24==0){r315=0;r316=r312;r317=r16;r318=r311;r319=r310;r320=r309;r321=r308;r322=0}else{if((r227&240|0)!=0){r315=r76;r316=r312;r317=r16;r318=r311;r319=r310;r320=r309;r321=r308;r322=0;break}r77=r16&65535;r157=(1<<r314+r227)-1|0;r75=((r310&r157)>>>(r314>>>0))+r77|0;r86=HEAP8[(r75<<2)+r88+1|0];L1284:do{if(((r86&255)+r314|0)>>>0>r311>>>0){r85=r308;r87=r309;r258=r310;r259=r311;while(1){if((r87|0)==0){r78=r152;r79=r66;r80=r259;r81=r258;r82=0;r83=r85;r84=r69;break L1045}r257=r87-1|0;r253=r85+1|0;r254=(HEAPU8[r85]<<r259)+r258|0;r255=r259+8|0;r264=((r254&r157)>>>(r314>>>0))+r77|0;r263=HEAP8[(r264<<2)+r88+1|0];if(((r263&255)+r314|0)>>>0>r255>>>0){r85=r253;r87=r257;r258=r254;r259=r255}else{r323=r253;r324=r257;r325=r254;r326=r255;r327=r264;r328=r263;break L1284}}}else{r323=r308;r324=r309;r325=r310;r326=r311;r327=r75;r328=r86}}while(0);r86=HEAP16[r88+(r327<<2)+2>>1];r75=HEAP8[(r327<<2)+r88|0];HEAP32[r41]=r314;r315=r75;r316=r328;r317=r86;r318=r326-r314|0;r319=r325>>>(r314>>>0);r320=r324;r321=r323;r322=r314}}while(0);r88=r316&255;r227=r319>>>(r88>>>0);r16=r318-r88|0;HEAP32[r41]=r322+r88|0;HEAP32[r30]=r317&65535;r88=r315&255;if(r315<<24>>24==0){HEAP32[r12]=25;r93=r152;r94=r66;r95=r16;r96=r227;r97=r69;r98=r320;r99=r70;r100=r321;break}if((r88&32|0)!=0){HEAP32[r41]=-1;HEAP32[r12]=11;r93=r152;r94=r66;r95=r16;r96=r227;r97=r69;r98=r320;r99=r70;r100=r321;break}if((r88&64|0)==0){r76=r88&15;HEAP32[r43]=r76;HEAP32[r12]=21;r184=r152;r185=r16;r186=r227;r187=r320;r188=r321;r189=r76;r3=982;break}else{HEAP32[r26]=5256016;HEAP32[r12]=29;r93=r152;r94=r66;r95=r16;r96=r227;r97=r69;r98=r320;r99=r70;r100=r321;break}}else if(r3==827){r3=0;r227=HEAP32[r24];do{if((r227&1024|0)==0){r16=HEAP32[r25];if((r16|0)==0){r329=r190;r330=r191;r331=r192;r332=r193;break}HEAP32[r16+16>>2]=0;r329=r190;r330=r191;r331=r192;r332=r193}else{L1302:do{if(r190>>>0<16){r16=r193;r76=r192;r88=r191;r86=r190;while(1){if((r76|0)==0){r78=r5;r79=r66;r80=r86;r81=r88;r82=0;r83=r16;r84=r69;break L1045}r75=r76-1|0;r77=r16+1|0;r157=(HEAPU8[r16]<<r86)+r88|0;r259=r86+8|0;if(r259>>>0<16){r16=r77;r76=r75;r88=r157;r86=r259}else{r333=r77;r334=r75;r335=r157;break L1302}}}else{r333=r193;r334=r192;r335=r191}}while(0);HEAP32[r30]=r335;r86=HEAP32[r25];if((r86|0)==0){r336=r227}else{HEAP32[r86+20>>2]=r335;r336=HEAP32[r24]}if((r336&512|0)==0){r329=0;r330=0;r331=r334;r332=r333;break}HEAP8[r22]=r335&255;HEAP8[r23]=r335>>>8&255;HEAP32[r21]=_crc32(HEAP32[r21],r22,2);r329=0;r330=0;r331=r334;r332=r333}}while(0);HEAP32[r12]=5;r131=r329;r132=r330;r133=r331;r134=r332;r3=838;break}}while(0);do{if(r3==838){r3=0;r227=HEAP32[r24];if((r227&1024|0)==0){r337=r133;r338=r134;r339=r227}else{r86=HEAP32[r30];r88=r86>>>0>r133>>>0?r133:r86;if((r88|0)==0){r340=r133;r341=r134;r342=r86;r343=r227}else{r76=HEAP32[r25],r16=r76>>2;do{if((r76|0)==0){r344=r227}else{r157=HEAP32[r16+4];if((r157|0)==0){r344=r227;break}r75=HEAP32[r16+5]-r86|0;r77=HEAP32[r16+6];_memcpy(r157+r75|0,r134,(r75+r88|0)>>>0>r77>>>0?r77-r75|0:r88);r344=HEAP32[r24]}}while(0);if((r344&512|0)!=0){HEAP32[r21]=_crc32(HEAP32[r21],r134,r88)}r16=HEAP32[r30]-r88|0;HEAP32[r30]=r16;r340=r133-r88|0;r341=r134+r88|0;r342=r16;r343=r344}if((r342|0)==0){r337=r340;r338=r341;r339=r343}else{r135=r5;r136=r131;r137=r132;r138=r340;r139=r341;r140=r69;r3=1046;break L1045}}HEAP32[r30]=0;HEAP32[r12]=6;r120=r131;r121=r132;r122=r337;r123=r338;r124=r339;r3=848;break}else if(r3==982){r3=0;if((r189|0)==0){r345=r185;r346=r186;r347=r187;r348=r188;r349=HEAP32[r30]}else{L1333:do{if(r185>>>0<r189>>>0){r16=r188;r86=r187;r227=r186;r76=r185;while(1){if((r86|0)==0){r78=r184;r79=r66;r80=r76;r81=r227;r82=0;r83=r16;r84=r69;break L1045}r75=r86-1|0;r77=r16+1|0;r157=(HEAPU8[r16]<<r76)+r227|0;r259=r76+8|0;if(r259>>>0<r189>>>0){r16=r77;r86=r75;r227=r157;r76=r259}else{r350=r77;r351=r75;r352=r157;r353=r259;break L1333}}}else{r350=r188;r351=r187;r352=r186;r353=r185}}while(0);r88=HEAP32[r30]+((1<<r189)-1&r352)|0;HEAP32[r30]=r88;HEAP32[r41]=HEAP32[r41]+r189|0;r345=r353-r189|0;r346=r352>>>(r189>>>0);r347=r351;r348=r350;r349=r88}HEAP32[r44>>2]=r349;HEAP32[r12]=22;r163=r184;r164=r345;r165=r346;r166=r347;r167=r348;r3=989;break}}while(0);do{if(r3==848){r3=0;do{if((r124&2048|0)==0){r88=HEAP32[r25];if((r88|0)==0){r354=r122;r355=r123;break}HEAP32[r88+28>>2]=0;r354=r122;r355=r123}else{if((r122|0)==0){r135=r5;r136=r120;r137=r121;r138=0;r139=r123;r140=r69;r3=1046;break L1045}else{r356=0}while(1){r357=r356+1|0;r88=HEAP8[r123+r356|0];r76=HEAP32[r25];do{if((r76|0)!=0){r227=r76+28|0;if((HEAP32[r227>>2]|0)==0){break}r86=HEAP32[r30];if(r86>>>0>=HEAP32[r76+32>>2]>>>0){break}HEAP32[r30]=r86+1|0;HEAP8[HEAP32[r227>>2]+r86|0]=r88}}while(0);r358=r88<<24>>24!=0;if(r358&r357>>>0<r122>>>0){r356=r357}else{break}}if((HEAP32[r24]&512|0)!=0){HEAP32[r21]=_crc32(HEAP32[r21],r123,r357)}r76=r122-r357|0;r86=r123+r357|0;if(r358){r135=r5;r136=r120;r137=r121;r138=r76;r139=r86;r140=r69;r3=1046;break L1045}else{r354=r76;r355=r86}}}while(0);HEAP32[r30]=0;HEAP32[r12]=7;r71=r120;r72=r121;r73=r354;r74=r355;r3=861;break}else if(r3==989){r3=0;r86=(1<<HEAP32[r39])-1|0;r76=r86&r165;r227=HEAP32[r64>>2];r16=HEAP8[(r76<<2)+r227+1|0];r259=r16&255;L1358:do{if(r259>>>0>r164>>>0){r157=r167;r75=r166;r77=r165;r258=r164;while(1){if((r75|0)==0){r78=r163;r79=r66;r80=r258;r81=r77;r82=0;r83=r157;r84=r69;break L1045}r87=r75-1|0;r85=r157+1|0;r263=(HEAPU8[r157]<<r258)+r77|0;r264=r258+8|0;r255=r86&r263;r254=HEAP8[(r255<<2)+r227+1|0];r257=r254&255;if(r257>>>0>r264>>>0){r157=r85;r75=r87;r77=r263;r258=r264}else{r359=r85;r360=r87;r361=r263;r362=r264;r363=r254;r364=r255;r365=r257;break L1358}}}else{r359=r167;r360=r166;r361=r165;r362=r164;r363=r16;r364=r76;r365=r259}}while(0);r259=HEAP8[(r364<<2)+r227|0];r76=HEAP16[r227+(r364<<2)+2>>1];r16=r259&255;if((r16&240|0)==0){r86=r76&65535;r258=(1<<r365+r16)-1|0;r16=((r361&r258)>>>(r365>>>0))+r86|0;r77=HEAP8[(r16<<2)+r227+1|0];L1366:do{if(((r77&255)+r365|0)>>>0>r362>>>0){r75=r359;r157=r360;r257=r361;r255=r362;while(1){if((r157|0)==0){r78=r163;r79=r66;r80=r255;r81=r257;r82=0;r83=r75;r84=r69;break L1045}r254=r157-1|0;r264=r75+1|0;r263=(HEAPU8[r75]<<r255)+r257|0;r87=r255+8|0;r85=((r263&r258)>>>(r365>>>0))+r86|0;r253=HEAP8[(r85<<2)+r227+1|0];if(((r253&255)+r365|0)>>>0>r87>>>0){r75=r264;r157=r254;r257=r263;r255=r87}else{r366=r264;r367=r254;r368=r263;r369=r87;r370=r85;r371=r253;break L1366}}}else{r366=r359;r367=r360;r368=r361;r369=r362;r370=r16;r371=r77}}while(0);r77=HEAP16[r227+(r370<<2)+2>>1];r16=HEAP8[(r370<<2)+r227|0];r86=HEAP32[r41]+r365|0;HEAP32[r41]=r86;r372=r16;r373=r371;r374=r77;r375=r369-r365|0;r376=r368>>>(r365>>>0);r377=r367;r378=r366;r379=r86}else{r372=r259;r373=r363;r374=r76;r375=r362;r376=r361;r377=r360;r378=r359;r379=HEAP32[r41]}r86=r373&255;r77=r376>>>(r86>>>0);r16=r375-r86|0;HEAP32[r41]=r379+r86|0;r86=r372&255;if((r86&64|0)==0){HEAP32[r45]=r374&65535;r258=r86&15;HEAP32[r43]=r258;HEAP32[r12]=23;r125=r163;r126=r16;r127=r77;r128=r377;r129=r378;r130=r258;r3=1001;break}else{HEAP32[r26]=5256120;HEAP32[r12]=29;r93=r163;r94=r66;r95=r16;r96=r77;r97=r69;r98=r377;r99=r70;r100=r378;break}}}while(0);do{if(r3==861){r3=0;do{if((HEAP32[r24]&4096|0)==0){r77=HEAP32[r25];if((r77|0)==0){r380=r73;r381=r74;break}HEAP32[r77+36>>2]=0;r380=r73;r381=r74}else{if((r73|0)==0){r135=r5;r136=r71;r137=r72;r138=0;r139=r74;r140=r69;r3=1046;break L1045}else{r382=0}while(1){r383=r382+1|0;r77=HEAP8[r74+r382|0];r16=HEAP32[r25];do{if((r16|0)!=0){r258=r16+36|0;if((HEAP32[r258>>2]|0)==0){break}r86=HEAP32[r30];if(r86>>>0>=HEAP32[r16+40>>2]>>>0){break}HEAP32[r30]=r86+1|0;HEAP8[HEAP32[r258>>2]+r86|0]=r77}}while(0);r384=r77<<24>>24!=0;if(r384&r383>>>0<r73>>>0){r382=r383}else{break}}if((HEAP32[r24]&512|0)!=0){HEAP32[r21]=_crc32(HEAP32[r21],r74,r383)}r16=r73-r383|0;r88=r74+r383|0;if(r384){r135=r5;r136=r71;r137=r72;r138=r16;r139=r88;r140=r69;r3=1046;break L1045}else{r380=r16;r381=r88}}}while(0);HEAP32[r12]=8;r237=r71;r238=r72;r239=r380;r240=r381;r3=874;break}else if(r3==1001){r3=0;if((r130|0)==0){r385=r126;r386=r127;r387=r128;r388=r129}else{L1396:do{if(r126>>>0<r130>>>0){r76=r129;r259=r128;r227=r127;r88=r126;while(1){if((r259|0)==0){r78=r125;r79=r66;r80=r88;r81=r227;r82=0;r83=r76;r84=r69;break L1045}r16=r259-1|0;r86=r76+1|0;r258=(HEAPU8[r76]<<r88)+r227|0;r255=r88+8|0;if(r255>>>0<r130>>>0){r76=r86;r259=r16;r227=r258;r88=r255}else{r389=r86;r390=r16;r391=r258;r392=r255;break L1396}}}else{r389=r129;r390=r128;r391=r127;r392=r126}}while(0);HEAP32[r45]=HEAP32[r45]+((1<<r130)-1&r391)|0;HEAP32[r41]=HEAP32[r41]+r130|0;r385=r392-r130|0;r386=r391>>>(r130>>>0);r387=r390;r388=r389}HEAP32[r12]=24;r194=r125;r195=r385;r196=r386;r197=r387;r198=r388;r3=1007;break}}while(0);L1402:do{if(r3==1007){r3=0;if((r69|0)==0){r135=r194;r136=r195;r137=r196;r138=r197;r139=r198;r140=0;r3=1046;break L1045}r88=r66-r69|0;r227=HEAP32[r45];if(r227>>>0>r88>>>0){r259=r227-r88|0;do{if(r259>>>0>HEAP32[r46>>2]>>>0){if((HEAP32[r47>>2]|0)==0){break}HEAP32[r26]=5255764;HEAP32[r12]=29;r93=r194;r94=r66;r95=r195;r96=r196;r97=r69;r98=r197;r99=r70;r100=r198;break L1402}}while(0);r88=HEAP32[r48>>2];if(r259>>>0>r88>>>0){r76=r259-r88|0;r393=HEAP32[r49>>2]+(HEAP32[r50>>2]-r76)|0;r394=r76}else{r393=HEAP32[r49>>2]+(r88-r259)|0;r394=r259}r88=HEAP32[r30];r395=r393;r396=r394>>>0>r88>>>0?r88:r394;r397=r88}else{r88=HEAP32[r30];r395=r70+ -r227|0;r396=r88;r397=r88}r88=r396>>>0>r69>>>0?r69:r396;HEAP32[r30]=r397-r88|0;r76=r69^-1;r255=r396^-1;r258=r76>>>0>r255>>>0?r76:r255;r255=r395;r76=r88;r16=r70;while(1){HEAP8[r16]=HEAP8[r255];r86=r76-1|0;if((r86|0)==0){break}else{r255=r255+1|0;r76=r86;r16=r16+1|0}}r16=r69-r88|0;r76=r70+(r258^-1)|0;if((HEAP32[r30]|0)!=0){r93=r194;r94=r66;r95=r195;r96=r196;r97=r16;r98=r197;r99=r76;r100=r198;break}HEAP32[r12]=20;r93=r194;r94=r66;r95=r195;r96=r196;r97=r16;r98=r197;r99=r76;r100=r198}else if(r3==874){r3=0;r76=HEAP32[r24];do{if((r76&512|0)==0){r398=r237;r399=r238;r400=r239;r401=r240}else{L1424:do{if(r237>>>0<16){r16=r240;r255=r239;r227=r238;r259=r237;while(1){if((r255|0)==0){r78=r5;r79=r66;r80=r259;r81=r227;r82=0;r83=r16;r84=r69;break L1045}r86=r255-1|0;r257=r16+1|0;r157=(HEAPU8[r16]<<r259)+r227|0;r75=r259+8|0;if(r75>>>0<16){r16=r257;r255=r86;r227=r157;r259=r75}else{r402=r257;r403=r86;r404=r157;r405=r75;break L1424}}}else{r402=r240;r403=r239;r404=r238;r405=r237}}while(0);if((r404|0)==(HEAP32[r21]&65535|0)){r398=0;r399=0;r400=r403;r401=r402;break}HEAP32[r26]=5255884;HEAP32[r12]=29;r93=r5;r94=r66;r95=r405;r96=r404;r97=r69;r98=r403;r99=r70;r100=r402;break L1402}}while(0);r258=HEAP32[r25];if((r258|0)!=0){HEAP32[r258+44>>2]=r76>>>9&1;HEAP32[HEAP32[r25]+48>>2]=1}HEAP32[r21]=0;HEAP32[r29]=0;HEAP32[r12]=11;r93=r5;r94=r66;r95=r398;r96=r399;r97=r69;r98=r400;r99=r70;r100=r401}}while(0);r5=r93;r66=r94;r67=r95;r68=r96;r69=r97;r11=r98;r70=r99;r14=r100;r15=HEAP32[r12]}if(r3==1045){HEAP32[r12]=28;r78=1;r79=r210;r80=r245;r81=r246;r82=r247;r83=r248;r84=r69}else if(r3==1046){r78=r135;r79=r66;r80=r136;r81=r137;r82=r138;r83=r139;r84=r140}else if(r3==1062){r6=-4;STACKTOP=r4;return r6}else if(r3==887){HEAP32[r8]=r70;HEAP32[r13]=r69;HEAP32[r10]=r119;HEAP32[r9]=r118;HEAP32[r18]=r117;HEAP32[r19]=r116;r6=2;STACKTOP=r4;return r6}else if(r3==898){r78=r5;r79=r66;r80=r307-3|0;r81=r306>>>3;r82=r305;r83=r304;r84=r69}else if(r3==1067){STACKTOP=r4;return r6}HEAP32[r8]=r70;HEAP32[r13]=r84;HEAP32[r10]=r83;HEAP32[r9]=r82;HEAP32[r18]=r81;HEAP32[r19]=r80;do{if((HEAP32[r50>>2]|0)==0){r80=HEAP32[r13];if((r79|0)==(r80|0)){r406=r79;break}r81=HEAP32[r12];if(r81>>>0>=29){r406=r80;break}if(r81>>>0>25&(r2|0)==4){r406=r80;break}else{r3=1051;break}}else{r3=1051}}while(0);do{if(r3==1051){if((_updatewindow(r1,r79)|0)==0){r406=HEAP32[r13];break}HEAP32[r12]=30;r6=-4;STACKTOP=r4;return r6}}while(0);r13=HEAP32[r9];r9=r79-r406|0;r3=r1+8|0;HEAP32[r3>>2]=r17-r13+HEAP32[r3>>2]|0;HEAP32[r51]=HEAP32[r51]+r9|0;HEAP32[r52]=HEAP32[r52]+r9|0;r52=(r79|0)==(r406|0);if(!((HEAP32[r20]|0)==0|r52)){r20=HEAP32[r21];r406=HEAP32[r8]+ -r9|0;if((HEAP32[r24]|0)==0){r407=_adler32(r20,r406,r9)}else{r407=_crc32(r20,r406,r9)}HEAP32[r21]=r407;HEAP32[r29]=r407}r407=HEAP32[r12];if((r407|0)==19){r408=256}else{r408=(r407|0)==14?256:0}HEAP32[r1+44>>2]=((HEAP32[r33]|0)!=0?64:0)+HEAP32[r19]+((r407|0)==11?128:0)+r408|0;r6=((r17|0)==(r13|0)&r52|(r2|0)==4)&(r78|0)==0?-5:r78;STACKTOP=r4;return r6}function _init_block(r1){var r2,r3;r2=0;while(1){HEAP16[r1+(r2<<2)+148>>1]=0;r3=r2+1|0;if((r3|0)==286){break}else{r2=r3}}HEAP16[r1+2440>>1]=0;HEAP16[r1+2444>>1]=0;HEAP16[r1+2448>>1]=0;HEAP16[r1+2452>>1]=0;HEAP16[r1+2456>>1]=0;HEAP16[r1+2460>>1]=0;HEAP16[r1+2464>>1]=0;HEAP16[r1+2468>>1]=0;HEAP16[r1+2472>>1]=0;HEAP16[r1+2476>>1]=0;HEAP16[r1+2480>>1]=0;HEAP16[r1+2484>>1]=0;HEAP16[r1+2488>>1]=0;HEAP16[r1+2492>>1]=0;HEAP16[r1+2496>>1]=0;HEAP16[r1+2500>>1]=0;HEAP16[r1+2504>>1]=0;HEAP16[r1+2508>>1]=0;HEAP16[r1+2512>>1]=0;HEAP16[r1+2516>>1]=0;HEAP16[r1+2520>>1]=0;HEAP16[r1+2524>>1]=0;HEAP16[r1+2528>>1]=0;HEAP16[r1+2532>>1]=0;HEAP16[r1+2536>>1]=0;HEAP16[r1+2540>>1]=0;HEAP16[r1+2544>>1]=0;HEAP16[r1+2548>>1]=0;HEAP16[r1+2552>>1]=0;HEAP16[r1+2556>>1]=0;HEAP16[r1+2684>>1]=0;HEAP16[r1+2688>>1]=0;HEAP16[r1+2692>>1]=0;HEAP16[r1+2696>>1]=0;HEAP16[r1+2700>>1]=0;HEAP16[r1+2704>>1]=0;HEAP16[r1+2708>>1]=0;HEAP16[r1+2712>>1]=0;HEAP16[r1+2716>>1]=0;HEAP16[r1+2720>>1]=0;HEAP16[r1+2724>>1]=0;HEAP16[r1+2728>>1]=0;HEAP16[r1+2732>>1]=0;HEAP16[r1+2736>>1]=0;HEAP16[r1+2740>>1]=0;HEAP16[r1+2744>>1]=0;HEAP16[r1+2748>>1]=0;HEAP16[r1+2752>>1]=0;HEAP16[r1+2756>>1]=0;HEAP16[r1+1172>>1]=1;HEAP32[r1+5804>>2]=0;HEAP32[r1+5800>>2]=0;HEAP32[r1+5808>>2]=0;HEAP32[r1+5792>>2]=0;return}function __tr_stored_block(r1,r2,r3,r4){var r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18;r5=(r1+5820|0)>>2;r6=HEAP32[r5];r7=r4&65535;r4=(r1+5816|0)>>1;r8=HEAPU16[r4]|r7<<r6;r9=r8&65535;HEAP16[r4]=r9;if((r6|0)>13){r10=(r1+20|0)>>2;r11=HEAP32[r10];HEAP32[r10]=r11+1|0;r12=r1+8|0;HEAP8[HEAP32[r12>>2]+r11|0]=r8&255;r8=HEAPU16[r4]>>>8&255;r11=HEAP32[r10];HEAP32[r10]=r11+1|0;HEAP8[HEAP32[r12>>2]+r11|0]=r8;r8=HEAP32[r5];r11=r7>>>((16-r8|0)>>>0)&65535;HEAP16[r4]=r11;r13=r8-13|0;r14=r11}else{r13=r6+3|0;r14=r9}HEAP32[r5]=r13;do{if((r13|0)>8){r9=r1+20|0,r6=r9>>2;r11=HEAP32[r6];HEAP32[r6]=r11+1|0;r8=r1+8|0;HEAP8[HEAP32[r8>>2]+r11|0]=r14&255;r11=HEAPU16[r4]>>>8&255;r7=HEAP32[r6];HEAP32[r6]=r7+1|0;HEAP8[HEAP32[r8>>2]+r7|0]=r11;r11=r9,r15=r11>>2;r9=r8,r16=r9>>2}else{if((r13|0)>0){r8=r1+20|0;r7=HEAP32[r8>>2];HEAP32[r8>>2]=r7+1|0;r6=r1+8|0;HEAP8[HEAP32[r6>>2]+r7|0]=r14&255;r11=r8,r15=r11>>2;r9=r6,r16=r9>>2;break}else{r11=r1+20|0,r15=r11>>2;r9=r1+8|0,r16=r9>>2;break}}}while(0);HEAP16[r4]=0;HEAP32[r5]=0;r5=HEAP32[r15];HEAP32[r15]=r5+1|0;HEAP8[HEAP32[r16]+r5|0]=r3&255;r5=HEAP32[r15];HEAP32[r15]=r5+1|0;HEAP8[HEAP32[r16]+r5|0]=r3>>>8&255;r5=r3&65535^65535;r4=HEAP32[r15];HEAP32[r15]=r4+1|0;HEAP8[HEAP32[r16]+r4|0]=r5&255;r4=HEAP32[r15];HEAP32[r15]=r4+1|0;HEAP8[HEAP32[r16]+r4|0]=r5>>>8&255;if((r3|0)==0){return}else{r17=r3;r18=r2}while(1){r2=r17-1|0;r3=HEAP8[r18];r5=HEAP32[r15];HEAP32[r15]=r5+1|0;HEAP8[HEAP32[r16]+r5|0]=r3;if((r2|0)==0){break}else{r17=r2;r18=r18+1|0}}return}function __tr_align(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13;r2=(r1+5820|0)>>2;r3=HEAP32[r2];r4=(r1+5816|0)>>1;r5=HEAPU16[r4]|2<<r3;r6=r5&65535;HEAP16[r4]=r6;if((r3|0)>13){r7=(r1+20|0)>>2;r8=HEAP32[r7];HEAP32[r7]=r8+1|0;r9=r1+8|0;HEAP8[HEAP32[r9>>2]+r8|0]=r5&255;r5=HEAPU16[r4]>>>8&255;r8=HEAP32[r7];HEAP32[r7]=r8+1|0;HEAP8[HEAP32[r9>>2]+r8|0]=r5;r5=HEAP32[r2];r8=2>>>((16-r5|0)>>>0)&65535;HEAP16[r4]=r8;r10=r5-13|0;r11=r8}else{r10=r3+3|0;r11=r6}HEAP32[r2]=r10;if((r10|0)>9){r6=(r1+20|0)>>2;r3=HEAP32[r6];HEAP32[r6]=r3+1|0;r8=r1+8|0;HEAP8[HEAP32[r8>>2]+r3|0]=r11&255;r3=HEAPU16[r4]>>>8&255;r5=HEAP32[r6];HEAP32[r6]=r5+1|0;HEAP8[HEAP32[r8>>2]+r5|0]=r3;HEAP16[r4]=0;r12=HEAP32[r2]-9|0;r13=0}else{r12=r10+7|0;r13=r11}HEAP32[r2]=r12;if((r12|0)==16){r11=(r1+20|0)>>2;r10=HEAP32[r11];HEAP32[r11]=r10+1|0;r3=r1+8|0;HEAP8[HEAP32[r3>>2]+r10|0]=r13&255;r10=HEAPU16[r4]>>>8&255;r5=HEAP32[r11];HEAP32[r11]=r5+1|0;HEAP8[HEAP32[r3>>2]+r5|0]=r10;HEAP16[r4]=0;HEAP32[r2]=0;return}if((r12|0)<=7){return}r12=r1+20|0;r10=HEAP32[r12>>2];HEAP32[r12>>2]=r10+1|0;HEAP8[HEAP32[r1+8>>2]+r10|0]=r13&255;HEAP16[r4]=HEAPU16[r4]>>>8;HEAP32[r2]=HEAP32[r2]-8|0;return}function _updatewindow(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10,r11,r12;r3=r1>>2;r4=HEAP32[r3+7],r5=r4>>2;r6=r4+52|0;r7=r6;r8=HEAP32[r7>>2];do{if((r8|0)==0){r9=FUNCTION_TABLE[HEAP32[r3+8]](HEAP32[r3+10],1<<HEAP32[r5+9],1);HEAP32[r6>>2]=r9;if((r9|0)==0){r10=1}else{r11=r9;break}return r10}else{r11=r8}}while(0);r8=(r4+40|0)>>2;r6=HEAP32[r8];if((r6|0)==0){r9=1<<HEAP32[r5+9];HEAP32[r8]=r9;HEAP32[r5+12]=0;HEAP32[r5+11]=0;r12=r9}else{r12=r6}r6=r2-HEAP32[r3+4]|0;if(r6>>>0>=r12>>>0){_memcpy(r11,HEAP32[r3+3]+ -r12|0,r12);HEAP32[r5+12]=0;HEAP32[r5+11]=HEAP32[r8];r10=0;return r10}r3=(r4+48|0)>>2;r2=HEAP32[r3];r9=r12-r2|0;r12=r9>>>0>r6>>>0?r6:r9;r9=r1+12|0;_memcpy(r11+r2|0,HEAP32[r9>>2]+ -r6|0,r12);r2=r6-r12|0;if((r6|0)!=(r12|0)){_memcpy(HEAP32[r7>>2],HEAP32[r9>>2]+ -r2|0,r2);HEAP32[r3]=r2;HEAP32[r5+11]=HEAP32[r8];r10=0;return r10}r5=HEAP32[r3]+r6|0;HEAP32[r3]=r5;r2=HEAP32[r8];if((r5|0)==(r2|0)){HEAP32[r3]=0}r3=r4+44|0;r4=HEAP32[r3>>2];if(r4>>>0>=r2>>>0){r10=0;return r10}HEAP32[r3>>2]=r4+r6|0;r10=0;return r10}function _inflate_table(r1,r2,r3,r4,r5,r6){var r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36,r37,r38,r39,r40,r41,r42,r43,r44,r45;r7=r4>>2;r4=0;r8=STACKTOP;STACKTOP=STACKTOP+32|0;r9=r8,r10=r9>>1;r11=STACKTOP,r12=r11>>1;STACKTOP=STACKTOP+32|0;_memset(r9,0,32);r13=(r3|0)==0;L1529:do{if(!r13){r14=0;while(1){r15=(HEAPU16[r2+(r14<<1)>>1]<<1)+r9|0;HEAP16[r15>>1]=HEAP16[r15>>1]+1&65535;r15=r14+1|0;if((r15|0)==(r3|0)){break L1529}else{r14=r15}}}}while(0);r14=HEAP32[r5>>2];r15=15;while(1){if((r15|0)==0){r4=1127;break}if(HEAP16[(r15<<1>>1)+r10]<<16>>16==0){r15=r15-1|0}else{break}}if(r4==1127){r16=HEAP32[r7];HEAP32[r7]=r16+4|0;HEAP8[r16|0]=64;HEAP8[r16+1|0]=1;HEAP16[r16+2>>1]=0;r16=HEAP32[r7];HEAP32[r7]=r16+4|0;HEAP8[r16|0]=64;HEAP8[r16+1|0]=1;HEAP16[r16+2>>1]=0;HEAP32[r5>>2]=1;r17=0;STACKTOP=r8;return r17}r16=r14>>>0>r15>>>0?r15:r14;r14=1;while(1){if(r14>>>0>=r15>>>0){break}if(HEAP16[(r14<<1>>1)+r10]<<16>>16==0){r14=r14+1|0}else{break}}r18=r16>>>0<r14>>>0?r14:r16;r16=1;r19=1;while(1){if(r19>>>0>=16){break}r20=(r16<<1)-HEAPU16[(r19<<1>>1)+r10]|0;if((r20|0)<0){r17=-1;r4=1172;break}else{r16=r20;r19=r19+1|0}}if(r4==1172){STACKTOP=r8;return r17}do{if((r16|0)>0){if((r1|0)!=0&(r15|0)==1){break}else{r17=-1}STACKTOP=r8;return r17}}while(0);HEAP16[r12+1]=0;r16=HEAP16[r10+1];HEAP16[r12+2]=r16;r19=HEAP16[r10+2]+r16&65535;HEAP16[r12+3]=r19;r16=HEAP16[r10+3]+r19&65535;HEAP16[r12+4]=r16;r19=HEAP16[r10+4]+r16&65535;HEAP16[r12+5]=r19;r16=HEAP16[r10+5]+r19&65535;HEAP16[r12+6]=r16;r19=HEAP16[r10+6]+r16&65535;HEAP16[r12+7]=r19;r16=HEAP16[r10+7]+r19&65535;HEAP16[r12+8]=r16;r19=HEAP16[r10+8]+r16&65535;HEAP16[r12+9]=r19;r16=HEAP16[r10+9]+r19&65535;HEAP16[r12+10]=r16;r19=HEAP16[r10+10]+r16&65535;HEAP16[r12+11]=r19;r16=HEAP16[r10+11]+r19&65535;HEAP16[r12+12]=r16;r19=HEAP16[r10+12]+r16&65535;HEAP16[r12+13]=r19;r16=HEAP16[r10+13]+r19&65535;HEAP16[r12+14]=r16;HEAP16[r12+15]=HEAP16[r10+14]+r16&65535;L1554:do{if(!r13){r16=0;while(1){r12=HEAP16[r2+(r16<<1)>>1];if(r12<<16>>16!=0){r19=((r12&65535)<<1)+r11|0;r12=HEAP16[r19>>1];HEAP16[r19>>1]=r12+1&65535;HEAP16[r6+((r12&65535)<<1)>>1]=r16&65535}r12=r16+1|0;if((r12|0)==(r3|0)){break L1554}else{r16=r12}}}}while(0);do{if((r1|0)==0){r21=0;r22=1<<r18;r23=19;r24=r6;r25=r6;r26=0}else if((r1|0)==1){r3=1<<r18;if(r3>>>0>851){r17=1}else{r21=1;r22=r3;r23=256;r24=5243722;r25=5243786;r26=0;break}STACKTOP=r8;return r17}else{r3=1<<r18;r11=(r1|0)==2;if(r11&r3>>>0>591){r17=1}else{r21=0;r22=r3;r23=-1;r24=5244364;r25=5244428;r26=r11;break}STACKTOP=r8;return r17}}while(0);r1=r22-1|0;r11=r18&255;r3=HEAP32[r7];r13=-1;r16=0;r12=r22;r22=0;r19=r18;r20=0;r27=r14;L1568:while(1){r14=1<<r19;r28=r16;r29=r20;r30=r27;while(1){r31=r30-r22|0;r32=r31&255;r33=HEAP16[r6+(r29<<1)>>1];r34=r33&65535;do{if((r34|0)<(r23|0)){r35=0;r36=r33}else{if((r34|0)<=(r23|0)){r35=96;r36=0;break}r35=HEAP16[r24+(r34<<1)>>1]&255;r36=HEAP16[r25+(r34<<1)>>1]}}while(0);r34=1<<r31;r33=r28>>>(r22>>>0);r37=r14;while(1){r38=r37-r34|0;r39=r38+r33|0;HEAP8[(r39<<2)+r3|0]=r35;HEAP8[(r39<<2)+r3+1|0]=r32;HEAP16[r3+(r39<<2)+2>>1]=r36;if((r37|0)==(r34|0)){break}else{r37=r38}}r37=1<<r30-1;while(1){if((r37&r28|0)==0){break}else{r37=r37>>>1}}if((r37|0)==0){r40=0}else{r40=(r37-1&r28)+r37|0}r41=r29+1|0;r34=(r30<<1)+r9|0;r33=HEAP16[r34>>1]-1&65535;HEAP16[r34>>1]=r33;if(r33<<16>>16==0){if((r30|0)==(r15|0)){break L1568}r42=HEAPU16[r2+(HEAPU16[r6+(r41<<1)>>1]<<1)>>1]}else{r42=r30}if(r42>>>0<=r18>>>0){r28=r40;r29=r41;r30=r42;continue}r43=r40&r1;if((r43|0)==(r13|0)){r28=r40;r29=r41;r30=r42}else{break}}r30=(r22|0)==0?r18:r22;r29=(r14<<2)+r3|0;r28=r42-r30|0;L1591:do{if(r42>>>0<r15>>>0){r33=r28;r34=1<<r28;r31=r42;while(1){r38=r34-HEAPU16[(r31<<1>>1)+r10]|0;if((r38|0)<1){r44=r33;break L1591}r39=r33+1|0;r45=r39+r30|0;if(r45>>>0<r15>>>0){r33=r39;r34=r38<<1;r31=r45}else{r44=r39;break L1591}}}else{r44=r28}}while(0);r28=(1<<r44)+r12|0;if(r21&r28>>>0>851|r26&r28>>>0>591){r17=1;r4=1175;break}HEAP8[(r43<<2)+HEAP32[r7]|0]=r44&255;HEAP8[(r43<<2)+HEAP32[r7]+1|0]=r11;r14=HEAP32[r7];HEAP16[r14+(r43<<2)+2>>1]=(r29-r14|0)>>>2&65535;r3=r29;r13=r43;r16=r40;r12=r28;r22=r30;r19=r44;r20=r41;r27=r42}if(r4==1175){STACKTOP=r8;return r17}if((r40|0)!=0){HEAP8[(r40<<2)+r3|0]=64;HEAP8[(r40<<2)+r3+1|0]=r32;HEAP16[r3+(r40<<2)+2>>1]=0}HEAP32[r7]=(r12<<2)+HEAP32[r7]|0;HEAP32[r5>>2]=r18;r17=0;STACKTOP=r8;return r17}function __tr_flush_block(r1,r2,r3,r4){var r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36,r37,r38,r39,r40;r5=0;if((HEAP32[r1+132>>2]|0)>0){r6=HEAP32[r1>>2]+44|0;if((HEAP32[r6>>2]|0)==2){r7=-201342849;r8=0;while(1){if((r7&1|0)!=0){if(HEAP16[r1+(r8<<2)+148>>1]<<16>>16!=0){r9=0;break}}r10=r8+1|0;if((r10|0)<32){r7=r7>>>1;r8=r10}else{r5=1181;break}}L1614:do{if(r5==1181){if(HEAP16[r1+184>>1]<<16>>16!=0){r9=1;break}if(HEAP16[r1+188>>1]<<16>>16!=0){r9=1;break}if(HEAP16[r1+200>>1]<<16>>16==0){r11=32}else{r9=1;break}while(1){if((r11|0)>=256){r9=0;break L1614}if(HEAP16[r1+(r11<<2)+148>>1]<<16>>16==0){r11=r11+1|0}else{r9=1;break L1614}}}}while(0);HEAP32[r6>>2]=r9}_build_tree(r1,r1+2840|0);_build_tree(r1,r1+2852|0);r9=HEAP32[r1+2844>>2];r6=HEAP16[r1+150>>1];r11=r6<<16>>16==0;HEAP16[r1+(r9+1<<2)+150>>1]=-1;r5=(r1+2752|0)>>1;r8=(r1+2756|0)>>1;r7=(r1+2748|0)>>1;r10=r11?3:4;r12=r11?138:7;r11=r6&65535;r6=0;r13=-1;L1623:while(1){r14=0;r15=r6;while(1){if((r15|0)>(r9|0)){break L1623}r16=r15+1|0;r17=HEAP16[r1+(r16<<2)+150>>1];r18=r17&65535;r19=r14+1|0;r20=(r11|0)==(r18|0);if((r19|0)<(r12|0)&r20){r14=r19;r15=r16}else{break}}do{if((r19|0)<(r10|0)){r15=(r11<<2)+r1+2684|0;HEAP16[r15>>1]=HEAPU16[r15>>1]+r19&65535}else{if((r11|0)==0){if((r19|0)<11){HEAP16[r5]=HEAP16[r5]+1&65535;break}else{HEAP16[r8]=HEAP16[r8]+1&65535;break}}else{if((r11|0)!=(r13|0)){r15=(r11<<2)+r1+2684|0;HEAP16[r15>>1]=HEAP16[r15>>1]+1&65535}HEAP16[r7]=HEAP16[r7]+1&65535;break}}}while(0);if(r17<<16>>16==0){r10=3;r12=138;r13=r11;r11=r18;r6=r16;continue}r10=r20?3:4;r12=r20?6:7;r13=r11;r11=r18;r6=r16}r16=HEAP32[r1+2856>>2];r6=HEAP16[r1+2442>>1];r18=r6<<16>>16==0;HEAP16[r1+(r16+1<<2)+2442>>1]=-1;r11=r18?3:4;r13=r18?138:7;r18=r6&65535;r6=0;r20=-1;L1644:while(1){r12=0;r10=r6;while(1){if((r10|0)>(r16|0)){break L1644}r21=r10+1|0;r22=HEAP16[r1+(r21<<2)+2442>>1];r23=r22&65535;r24=r12+1|0;r25=(r18|0)==(r23|0);if((r24|0)<(r13|0)&r25){r12=r24;r10=r21}else{break}}do{if((r24|0)<(r11|0)){r10=(r18<<2)+r1+2684|0;HEAP16[r10>>1]=HEAPU16[r10>>1]+r24&65535}else{if((r18|0)==0){if((r24|0)<11){HEAP16[r5]=HEAP16[r5]+1&65535;break}else{HEAP16[r8]=HEAP16[r8]+1&65535;break}}else{if((r18|0)!=(r20|0)){r10=(r18<<2)+r1+2684|0;HEAP16[r10>>1]=HEAP16[r10>>1]+1&65535}HEAP16[r7]=HEAP16[r7]+1&65535;break}}}while(0);if(r22<<16>>16==0){r11=3;r13=138;r20=r18;r18=r23;r6=r21;continue}r11=r25?3:4;r13=r25?6:7;r20=r18;r18=r23;r6=r21}_build_tree(r1,r1+2864|0);r21=18;while(1){if((r21|0)<=2){break}if(HEAP16[r1+(HEAPU8[r21+5255332|0]<<2)+2686>>1]<<16>>16==0){r21=r21-1|0}else{break}}r6=r1+5800|0;r23=(r21*3&-1)+HEAP32[r6>>2]+17|0;HEAP32[r6>>2]=r23;r6=(r23+10|0)>>>3;r23=(HEAP32[r1+5804>>2]+10|0)>>>3;r26=r23>>>0>r6>>>0?r6:r23;r27=r23;r28=r21}else{r21=r3+5|0;r26=r21;r27=r21;r28=0}do{if((r3+4|0)>>>0>r26>>>0|(r2|0)==0){r21=(r1+5820|0)>>2;r23=HEAP32[r21];r6=(r23|0)>13;if((HEAP32[r1+136>>2]|0)==4|(r27|0)==(r26|0)){r18=r4+2&65535;r20=(r1+5816|0)>>1;r25=HEAPU16[r20]|r18<<r23;HEAP16[r20]=r25&65535;if(r6){r13=(r1+20|0)>>2;r11=HEAP32[r13];HEAP32[r13]=r11+1|0;r22=r1+8|0;HEAP8[HEAP32[r22>>2]+r11|0]=r25&255;r25=HEAPU16[r20]>>>8&255;r11=HEAP32[r13];HEAP32[r13]=r11+1|0;HEAP8[HEAP32[r22>>2]+r11|0]=r25;r25=HEAP32[r21];HEAP16[r20]=r18>>>((16-r25|0)>>>0)&65535;r29=r25-13|0}else{r29=r23+3|0}HEAP32[r21]=r29;_compress_block(r1,5242880,5244052);break}r25=r4+4&65535;r18=(r1+5816|0)>>1;r20=HEAPU16[r18]|r25<<r23;HEAP16[r18]=r20&65535;if(r6){r6=(r1+20|0)>>2;r11=HEAP32[r6];HEAP32[r6]=r11+1|0;r22=r1+8|0;HEAP8[HEAP32[r22>>2]+r11|0]=r20&255;r11=HEAPU16[r18]>>>8&255;r13=HEAP32[r6];HEAP32[r6]=r13+1|0;HEAP8[HEAP32[r22>>2]+r13|0]=r11;r11=HEAP32[r21];r13=r25>>>((16-r11|0)>>>0);HEAP16[r18]=r13&65535;r30=r11-13|0;r31=r13}else{r30=r23+3|0;r31=r20}HEAP32[r21]=r30;r20=HEAP32[r1+2844>>2];r23=HEAP32[r1+2856>>2];r13=r28+1|0;r11=r20+65280&65535;r25=r31&65535|r11<<r30;HEAP16[r18]=r25&65535;if((r30|0)>11){r22=(r1+20|0)>>2;r6=HEAP32[r22];HEAP32[r22]=r6+1|0;r7=r1+8|0;HEAP8[HEAP32[r7>>2]+r6|0]=r25&255;r6=HEAPU16[r18]>>>8&255;r8=HEAP32[r22];HEAP32[r22]=r8+1|0;HEAP8[HEAP32[r7>>2]+r8|0]=r6;r6=HEAP32[r21];r8=r11>>>((16-r6|0)>>>0);HEAP16[r18]=r8&65535;r32=r6-11|0;r33=r8}else{r32=r30+5|0;r33=r25}HEAP32[r21]=r32;r25=r23&65535;r8=r25<<r32|r33&65535;HEAP16[r18]=r8&65535;if((r32|0)>11){r6=(r1+20|0)>>2;r11=HEAP32[r6];HEAP32[r6]=r11+1|0;r7=r1+8|0;HEAP8[HEAP32[r7>>2]+r11|0]=r8&255;r11=HEAPU16[r18]>>>8&255;r22=HEAP32[r6];HEAP32[r6]=r22+1|0;HEAP8[HEAP32[r7>>2]+r22|0]=r11;r11=HEAP32[r21];r22=r25>>>((16-r11|0)>>>0);HEAP16[r18]=r22&65535;r34=r11-11|0;r35=r22}else{r34=r32+5|0;r35=r8}HEAP32[r21]=r34;r8=r28+65533&65535;r22=r8<<r34|r35&65535;HEAP16[r18]=r22&65535;if((r34|0)>12){r11=(r1+20|0)>>2;r25=HEAP32[r11];HEAP32[r11]=r25+1|0;r7=r1+8|0;HEAP8[HEAP32[r7>>2]+r25|0]=r22&255;r25=HEAPU16[r18]>>>8&255;r6=HEAP32[r11];HEAP32[r11]=r6+1|0;HEAP8[HEAP32[r7>>2]+r6|0]=r25;r25=HEAP32[r21];r6=r8>>>((16-r25|0)>>>0);HEAP16[r18]=r6&65535;r36=r25-12|0;r37=r6}else{r36=r34+4|0;r37=r22}HEAP32[r21]=r36;L1697:do{if((r13|0)>0){r22=(r1+20|0)>>2;r6=r1+8|0;r25=0;r8=r36;r7=r37;while(1){r11=HEAPU16[r1+(HEAPU8[r25+5255332|0]<<2)+2686>>1];r5=r11<<r8|r7&65535;HEAP16[r18]=r5&65535;if((r8|0)>13){r24=HEAP32[r22];HEAP32[r22]=r24+1|0;HEAP8[HEAP32[r6>>2]+r24|0]=r5&255;r24=HEAPU16[r18]>>>8&255;r16=HEAP32[r22];HEAP32[r22]=r16+1|0;HEAP8[HEAP32[r6>>2]+r16|0]=r24;r24=HEAP32[r21];r16=r11>>>((16-r24|0)>>>0);HEAP16[r18]=r16&65535;r38=r24-13|0;r39=r16}else{r38=r8+3|0;r39=r5}HEAP32[r21]=r38;r5=r25+1|0;if((r5|0)==(r13|0)){break L1697}else{r25=r5;r8=r38;r7=r39}}}}while(0);r13=r1+148|0;_send_tree(r1,r13,r20);r21=r1+2440|0;_send_tree(r1,r21,r23);_compress_block(r1,r13,r21)}else{__tr_stored_block(r1,r2,r3,r4)}}while(0);_init_block(r1);if((r4|0)==0){return}r4=r1+5820|0;r3=HEAP32[r4>>2];do{if((r3|0)>8){r2=r1+5816|0;r39=HEAP16[r2>>1]&255;r38=(r1+20|0)>>2;r37=HEAP32[r38];HEAP32[r38]=r37+1|0;r36=r1+8|0;HEAP8[HEAP32[r36>>2]+r37|0]=r39;r39=HEAPU16[r2>>1]>>>8&255;r37=HEAP32[r38];HEAP32[r38]=r37+1|0;HEAP8[HEAP32[r36>>2]+r37|0]=r39;r40=r2}else{r2=r1+5816|0;if((r3|0)<=0){r40=r2;break}r39=HEAP16[r2>>1]&255;r37=r1+20|0;r36=HEAP32[r37>>2];HEAP32[r37>>2]=r36+1|0;HEAP8[HEAP32[r1+8>>2]+r36|0]=r39;r40=r2}}while(0);HEAP16[r40>>1]=0;HEAP32[r4>>2]=0;return}function _build_tree(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36,r37,r38,r39,r40,r41,r42,r43,r44,r45,r46,r47;r3=0;r4=STACKTOP;STACKTOP=STACKTOP+32|0;r5=r4;r6=r2|0;r7=HEAP32[r6>>2],r8=r7>>1;r9=r2+8|0;r10=HEAP32[r9>>2];r11=HEAP32[r10>>2];r12=HEAP32[r10+12>>2];r10=(r1+5200|0)>>2;HEAP32[r10]=0;r13=(r1+5204|0)>>2;HEAP32[r13]=573;do{if((r12|0)>0){r14=0;r15=-1;while(1){if(HEAP16[(r14<<2>>1)+r8]<<16>>16==0){HEAP16[((r14<<2)+2>>1)+r8]=0;r16=r15}else{r17=HEAP32[r10]+1|0;HEAP32[r10]=r17;HEAP32[r1+(r17<<2)+2908>>2]=r14;HEAP8[r1+(r14+5208)|0]=0;r16=r14}r17=r14+1|0;if((r17|0)==(r12|0)){break}else{r14=r17;r15=r16}}r15=HEAP32[r10];if((r15|0)<2){r18=r15;r19=r16;r3=1259;break}else{r20=r16;break}}else{r18=0;r19=-1;r3=1259}}while(0);L1725:do{if(r3==1259){r16=(r1+5800|0)>>2;r15=r1+5804|0;if((r11|0)==0){r14=r19;r17=r18;while(1){r21=(r14|0)<2;r22=r14+1|0;r23=r21?r22:r14;r24=r21?r22:0;r22=r17+1|0;HEAP32[r10]=r22;HEAP32[r1+(r22<<2)+2908>>2]=r24;HEAP16[(r24<<2>>1)+r8]=1;HEAP8[r1+(r24+5208)|0]=0;HEAP32[r16]=HEAP32[r16]-1|0;r24=HEAP32[r10];if((r24|0)<2){r14=r23;r17=r24}else{r20=r23;break L1725}}}else{r17=r19;r14=r18;while(1){r23=(r17|0)<2;r24=r17+1|0;r22=r23?r24:r17;r21=r23?r24:0;r24=r14+1|0;HEAP32[r10]=r24;HEAP32[r1+(r24<<2)+2908>>2]=r21;HEAP16[(r21<<2>>1)+r8]=1;HEAP8[r1+(r21+5208)|0]=0;HEAP32[r16]=HEAP32[r16]-1|0;HEAP32[r15>>2]=HEAP32[r15>>2]-HEAPU16[r11+(r21<<2)+2>>1]|0;r21=HEAP32[r10];if((r21|0)<2){r17=r22;r14=r21}else{r20=r22;break L1725}}}}}while(0);r11=r2+4|0;HEAP32[r11>>2]=r20;r2=HEAP32[r10];L1733:do{if((r2|0)>1){r18=(r2|0)/2&-1;r19=r2;while(1){r3=HEAP32[r1+(r18<<2)+2908>>2];r14=r1+(r3+5208)|0;r17=r18<<1;L1737:do{if((r17|0)>(r19|0)){r25=r18}else{r15=(r3<<2)+r7|0;r16=r18;r22=r17;r21=r19;while(1){do{if((r22|0)<(r21|0)){r24=r22|1;r23=HEAP32[r1+(r24<<2)+2908>>2];r26=HEAP16[(r23<<2>>1)+r8];r27=HEAP32[r1+(r22<<2)+2908>>2];r28=HEAP16[(r27<<2>>1)+r8];if((r26&65535)>=(r28&65535)){if(r26<<16>>16!=r28<<16>>16){r29=r22;break}if(HEAPU8[r1+(r23+5208)|0]>HEAPU8[r1+(r27+5208)|0]){r29=r22;break}}r29=r24}else{r29=r22}}while(0);r24=HEAP16[r15>>1];r27=HEAP32[r1+(r29<<2)+2908>>2];r23=HEAP16[(r27<<2>>1)+r8];if((r24&65535)<(r23&65535)){r25=r16;break L1737}if(r24<<16>>16==r23<<16>>16){if(HEAPU8[r14]<=HEAPU8[r1+(r27+5208)|0]){r25=r16;break L1737}}HEAP32[r1+(r16<<2)+2908>>2]=r27;r27=r29<<1;r23=HEAP32[r10];if((r27|0)>(r23|0)){r25=r29;break L1737}else{r16=r29;r22=r27;r21=r23}}}}while(0);HEAP32[r1+(r25<<2)+2908>>2]=r3;r14=r18-1|0;r17=HEAP32[r10];if((r14|0)>0){r18=r14;r19=r17}else{r30=r17;break L1733}}}else{r30=r2}}while(0);r2=(r1+2912|0)>>2;r25=r12;r12=r30;while(1){r30=HEAP32[r2];r29=r12-1|0;HEAP32[r10]=r29;r19=HEAP32[r1+(r12<<2)+2908>>2];HEAP32[r2]=r19;r18=r1+(r19+5208)|0;L1756:do{if((r29|0)<2){r31=1}else{r17=(r19<<2)+r7|0;r14=1;r21=2;r22=r29;while(1){do{if((r21|0)<(r22|0)){r16=r21|1;r15=HEAP32[r1+(r16<<2)+2908>>2];r23=HEAP16[(r15<<2>>1)+r8];r27=HEAP32[r1+(r21<<2)+2908>>2];r24=HEAP16[(r27<<2>>1)+r8];if((r23&65535)>=(r24&65535)){if(r23<<16>>16!=r24<<16>>16){r32=r21;break}if(HEAPU8[r1+(r15+5208)|0]>HEAPU8[r1+(r27+5208)|0]){r32=r21;break}}r32=r16}else{r32=r21}}while(0);r16=HEAP16[r17>>1];r27=HEAP32[r1+(r32<<2)+2908>>2];r15=HEAP16[(r27<<2>>1)+r8];if((r16&65535)<(r15&65535)){r31=r14;break L1756}if(r16<<16>>16==r15<<16>>16){if(HEAPU8[r18]<=HEAPU8[r1+(r27+5208)|0]){r31=r14;break L1756}}HEAP32[r1+(r14<<2)+2908>>2]=r27;r27=r32<<1;r15=HEAP32[r10];if((r27|0)>(r15|0)){r31=r32;break L1756}else{r14=r32;r21=r27;r22=r15}}}}while(0);HEAP32[r1+(r31<<2)+2908>>2]=r19;r18=HEAP32[r2];r29=HEAP32[r13]-1|0;HEAP32[r13]=r29;HEAP32[r1+(r29<<2)+2908>>2]=r30;r29=HEAP32[r13]-1|0;HEAP32[r13]=r29;HEAP32[r1+(r29<<2)+2908>>2]=r18;r29=(r25<<2)+r7|0;HEAP16[r29>>1]=HEAP16[(r18<<2>>1)+r8]+HEAP16[(r30<<2>>1)+r8]&65535;r22=HEAP8[r1+(r30+5208)|0];r21=HEAP8[r1+(r18+5208)|0];r14=r1+(r25+5208)|0;HEAP8[r14]=((r22&255)<(r21&255)?r21:r22)+1&255;r22=r25&65535;HEAP16[((r18<<2)+2>>1)+r8]=r22;HEAP16[((r30<<2)+2>>1)+r8]=r22;r22=r25+1|0;HEAP32[r2]=r25;r18=HEAP32[r10];L1772:do{if((r18|0)<2){r33=1}else{r21=1;r17=2;r3=r18;while(1){do{if((r17|0)<(r3|0)){r15=r17|1;r27=HEAP32[r1+(r15<<2)+2908>>2];r16=HEAP16[(r27<<2>>1)+r8];r24=HEAP32[r1+(r17<<2)+2908>>2];r23=HEAP16[(r24<<2>>1)+r8];if((r16&65535)>=(r23&65535)){if(r16<<16>>16!=r23<<16>>16){r34=r17;break}if(HEAPU8[r1+(r27+5208)|0]>HEAPU8[r1+(r24+5208)|0]){r34=r17;break}}r34=r15}else{r34=r17}}while(0);r15=HEAP16[r29>>1];r24=HEAP32[r1+(r34<<2)+2908>>2];r27=HEAP16[(r24<<2>>1)+r8];if((r15&65535)<(r27&65535)){r33=r21;break L1772}if(r15<<16>>16==r27<<16>>16){if(HEAPU8[r14]<=HEAPU8[r1+(r24+5208)|0]){r33=r21;break L1772}}HEAP32[r1+(r21<<2)+2908>>2]=r24;r24=r34<<1;r27=HEAP32[r10];if((r24|0)>(r27|0)){r33=r34;break L1772}else{r21=r34;r17=r24;r3=r27}}}}while(0);HEAP32[r1+(r33<<2)+2908>>2]=r25;r14=HEAP32[r10];if((r14|0)>1){r25=r22;r12=r14}else{break}}r12=HEAP32[r2];r2=HEAP32[r13]-1|0;HEAP32[r13]=r2;HEAP32[r1+(r2<<2)+2908>>2]=r12;r12=HEAP32[r6>>2],r6=r12>>1;r2=HEAP32[r11>>2];r11=HEAP32[r9>>2]>>2;r9=HEAP32[r11];r25=HEAP32[r11+1];r10=HEAP32[r11+2];r33=HEAP32[r11+4];_memset(r1+2876|0,0,32);HEAP16[((HEAP32[r1+(HEAP32[r13]<<2)+2908>>2]<<2)+2>>1)+r6]=0;r11=HEAP32[r13]+1|0;L1788:do{if((r11|0)<573){r13=(r1+5800|0)>>2;r34=r1+5804|0;L1790:do{if((r9|0)==0){r7=0;r31=r11;while(1){r32=HEAP32[r1+(r31<<2)+2908>>2];r14=(r32<<2)+r12+2|0;r29=HEAPU16[((HEAPU16[r14>>1]<<2)+2>>1)+r6]+1|0;r18=(r29|0)>(r33|0);r30=r18?r33:r29;r29=(r18&1)+r7|0;HEAP16[r14>>1]=r30&65535;if((r32|0)<=(r2|0)){r14=(r30<<1)+r1+2876|0;HEAP16[r14>>1]=HEAP16[r14>>1]+1&65535;if((r32|0)<(r10|0)){r35=0}else{r35=HEAP32[r25+(r32-r10<<2)>>2]}HEAP32[r13]=Math.imul(HEAPU16[(r32<<2>>1)+r6],r35+r30|0)+HEAP32[r13]|0}r30=r31+1|0;if((r30|0)==573){r36=r29;break L1790}else{r7=r29;r31=r30}}}else{r31=0;r7=r11;while(1){r30=HEAP32[r1+(r7<<2)+2908>>2];r29=(r30<<2)+r12+2|0;r32=HEAPU16[((HEAPU16[r29>>1]<<2)+2>>1)+r6]+1|0;r14=(r32|0)>(r33|0);r18=r14?r33:r32;r32=(r14&1)+r31|0;HEAP16[r29>>1]=r18&65535;if((r30|0)<=(r2|0)){r29=(r18<<1)+r1+2876|0;HEAP16[r29>>1]=HEAP16[r29>>1]+1&65535;if((r30|0)<(r10|0)){r37=0}else{r37=HEAP32[r25+(r30-r10<<2)>>2]}r29=HEAPU16[(r30<<2>>1)+r6];HEAP32[r13]=Math.imul(r29,r37+r18|0)+HEAP32[r13]|0;HEAP32[r34>>2]=Math.imul(HEAPU16[r9+(r30<<2)+2>>1]+r37|0,r29)+HEAP32[r34>>2]|0}r29=r7+1|0;if((r29|0)==573){r36=r32;break L1790}else{r31=r32;r7=r29}}}}while(0);if((r36|0)==0){break}r34=(r33<<1)+r1+2876|0;r22=r36;while(1){r7=r33;while(1){r31=r7-1|0;r38=(r31<<1)+r1+2876|0;r39=HEAP16[r38>>1];if(r39<<16>>16==0){r7=r31}else{break}}HEAP16[r38>>1]=r39-1&65535;r31=(r7<<1)+r1+2876|0;HEAP16[r31>>1]=HEAP16[r31>>1]+2&65535;r40=HEAP16[r34>>1]-1&65535;HEAP16[r34>>1]=r40;r31=r22-2|0;if((r31|0)>0){r22=r31}else{break}}if((r33|0)==0){break}else{r41=r33;r42=573;r43=r40}while(1){r22=r41&65535;L1817:do{if(r43<<16>>16==0){r44=r42}else{r34=r43&65535;r31=r42;while(1){r29=r31;while(1){r45=r29-1|0;r46=HEAP32[r1+(r45<<2)+2908>>2];if((r46|0)>(r2|0)){r29=r45}else{break}}r29=(r46<<2)+r12+2|0;r32=HEAPU16[r29>>1];if((r32|0)!=(r41|0)){HEAP32[r13]=Math.imul(HEAPU16[(r46<<2>>1)+r6],r41-r32|0)+HEAP32[r13]|0;HEAP16[r29>>1]=r22}r29=r34-1|0;if((r29|0)==0){r44=r45;break L1817}else{r34=r29;r31=r45}}}}while(0);r22=r41-1|0;if((r22|0)==0){break L1788}r41=r22;r42=r44;r43=HEAP16[r1+(r22<<1)+2876>>1]}}}while(0);r43=1;r44=0;while(1){r42=HEAPU16[r1+(r43-1<<1)+2876>>1]+(r44&65534)<<1;HEAP16[r5+(r43<<1)>>1]=r42&65535;r41=r43+1|0;if((r41|0)==16){break}else{r43=r41;r44=r42}}if((r20|0)<0){STACKTOP=r4;return}r44=r20+1|0;r20=0;while(1){r43=HEAP16[((r20<<2)+2>>1)+r8];r1=r43&65535;if(r43<<16>>16!=0){r43=(r1<<1)+r5|0;r42=HEAP16[r43>>1];HEAP16[r43>>1]=r42+1&65535;r43=0;r41=r1;r1=r42&65535;while(1){r47=r43|r1&1;r42=r41-1|0;if((r42|0)>0){r43=r47<<1;r41=r42;r1=r1>>>1}else{break}}HEAP16[(r20<<2>>1)+r8]=r47&65535}r1=r20+1|0;if((r1|0)==(r44|0)){break}else{r20=r1}}STACKTOP=r4;return}function _compress_block(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33;r4=r2>>1;r2=r1+5792|0;L1846:do{if((HEAP32[r2>>2]|0)==0){r5=HEAP32[r1+5820>>2];r6=HEAP16[r1+5816>>1]}else{r7=r1+5796|0;r8=r1+5784|0;r9=(r1+5820|0)>>2;r10=(r1+5816|0)>>1;r11=(r1+20|0)>>2;r12=(r1+8|0)>>2;r13=0;while(1){r14=HEAP16[HEAP32[r7>>2]+(r13<<1)>>1];r15=r14&65535;r16=r13+1|0;r17=HEAPU8[HEAP32[r8>>2]+r13|0];do{if(r14<<16>>16==0){r18=HEAPU16[((r17<<2)+2>>1)+r4];r19=HEAP32[r9];r20=HEAPU16[(r17<<2>>1)+r4];r21=HEAPU16[r10]|r20<<r19;r22=r21&65535;HEAP16[r10]=r22;if((r19|0)>(16-r18|0)){r23=HEAP32[r11];HEAP32[r11]=r23+1|0;HEAP8[HEAP32[r12]+r23|0]=r21&255;r21=HEAPU16[r10]>>>8&255;r23=HEAP32[r11];HEAP32[r11]=r23+1|0;HEAP8[HEAP32[r12]+r23|0]=r21;r21=HEAP32[r9];r23=r20>>>((16-r21|0)>>>0)&65535;HEAP16[r10]=r23;r20=r18-16+r21|0;HEAP32[r9]=r20;r24=r20;r25=r23;break}else{r23=r19+r18|0;HEAP32[r9]=r23;r24=r23;r25=r22;break}}else{r22=HEAPU8[r17+5256416|0];r23=(r22|256)+1|0;r18=HEAPU16[((r23<<2)+2>>1)+r4];r19=HEAP32[r9];r20=HEAPU16[(r23<<2>>1)+r4];r23=HEAPU16[r10]|r20<<r19;r21=r23&65535;HEAP16[r10]=r21;if((r19|0)>(16-r18|0)){r26=HEAP32[r11];HEAP32[r11]=r26+1|0;HEAP8[HEAP32[r12]+r26|0]=r23&255;r23=HEAPU16[r10]>>>8&255;r26=HEAP32[r11];HEAP32[r11]=r26+1|0;HEAP8[HEAP32[r12]+r26|0]=r23;r23=HEAP32[r9];r26=r20>>>((16-r23|0)>>>0)&65535;HEAP16[r10]=r26;r27=r18-16+r23|0;r28=r26}else{r27=r19+r18|0;r28=r21}HEAP32[r9]=r27;r21=HEAP32[(r22<<2)+5246708>>2];do{if((r22-8|0)>>>0<20){r18=r17-HEAP32[(r22<<2)+5255352>>2]&65535;r19=r18<<r27|r28&65535;r26=r19&65535;HEAP16[r10]=r26;if((r27|0)>(16-r21|0)){r23=HEAP32[r11];HEAP32[r11]=r23+1|0;HEAP8[HEAP32[r12]+r23|0]=r19&255;r19=HEAPU16[r10]>>>8&255;r23=HEAP32[r11];HEAP32[r11]=r23+1|0;HEAP8[HEAP32[r12]+r23|0]=r19;r19=HEAP32[r9];r23=r18>>>((16-r19|0)>>>0)&65535;HEAP16[r10]=r23;r18=r21-16+r19|0;HEAP32[r9]=r18;r29=r18;r30=r23;break}else{r23=r27+r21|0;HEAP32[r9]=r23;r29=r23;r30=r26;break}}else{r29=r27;r30=r28}}while(0);r21=r15-1|0;if(r21>>>0<256){r31=r21}else{r31=(r21>>>7)+256|0}r22=HEAPU8[r31+5257144|0];r26=HEAPU16[r3+(r22<<2)+2>>1];r23=HEAPU16[r3+(r22<<2)>>1];r18=r30&65535|r23<<r29;r19=r18&65535;HEAP16[r10]=r19;if((r29|0)>(16-r26|0)){r20=HEAP32[r11];HEAP32[r11]=r20+1|0;HEAP8[HEAP32[r12]+r20|0]=r18&255;r18=HEAPU16[r10]>>>8&255;r20=HEAP32[r11];HEAP32[r11]=r20+1|0;HEAP8[HEAP32[r12]+r20|0]=r18;r18=HEAP32[r9];r20=r23>>>((16-r18|0)>>>0)&65535;HEAP16[r10]=r20;r32=r26-16+r18|0;r33=r20}else{r32=r29+r26|0;r33=r19}HEAP32[r9]=r32;r19=HEAP32[(r22<<2)+5246824>>2];if((r22-4|0)>>>0>=26){r24=r32;r25=r33;break}r26=r21-HEAP32[(r22<<2)+5255468>>2]&65535;r22=r26<<r32|r33&65535;r21=r22&65535;HEAP16[r10]=r21;if((r32|0)>(16-r19|0)){r20=HEAP32[r11];HEAP32[r11]=r20+1|0;HEAP8[HEAP32[r12]+r20|0]=r22&255;r22=HEAPU16[r10]>>>8&255;r20=HEAP32[r11];HEAP32[r11]=r20+1|0;HEAP8[HEAP32[r12]+r20|0]=r22;r22=HEAP32[r9];r20=r26>>>((16-r22|0)>>>0)&65535;HEAP16[r10]=r20;r26=r19-16+r22|0;HEAP32[r9]=r26;r24=r26;r25=r20;break}else{r20=r32+r19|0;HEAP32[r9]=r20;r24=r20;r25=r21;break}}}while(0);if(r16>>>0<HEAP32[r2>>2]>>>0){r13=r16}else{r5=r24;r6=r25;break L1846}}}}while(0);r25=HEAPU16[r4+513];r24=(r1+5820|0)>>2;r2=HEAPU16[r4+512];r4=(r1+5816|0)>>1;r32=r6&65535|r2<<r5;HEAP16[r4]=r32&65535;if((r5|0)>(16-r25|0)){r6=(r1+20|0)>>2;r33=HEAP32[r6];HEAP32[r6]=r33+1|0;r29=r1+8|0;HEAP8[HEAP32[r29>>2]+r33|0]=r32&255;r32=HEAPU16[r4]>>>8&255;r33=HEAP32[r6];HEAP32[r6]=r33+1|0;HEAP8[HEAP32[r29>>2]+r33|0]=r32;r32=HEAP32[r24];HEAP16[r4]=r2>>>((16-r32|0)>>>0)&65535;r2=r25-16+r32|0;HEAP32[r24]=r2;return}else{r2=r5+r25|0;HEAP32[r24]=r2;return}}function _send_tree(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36,r37,r38,r39,r40,r41,r42,r43,r44,r45,r46,r47;r4=HEAP16[r2+2>>1];r5=r4<<16>>16==0;r6=r1+2754|0;r7=(r1+5820|0)>>2;r8=r1+2752|0;r9=(r1+5816|0)>>1;r10=(r1+20|0)>>2;r11=(r1+8|0)>>2;r12=r1+2758|0;r13=r1+2756|0;r14=r1+2750|0;r15=r1+2748|0;r16=0;r17=-1;r18=r4&65535;r4=r5?138:7;r19=r5?3:4;L1886:while(1){r5=r16;r20=0;while(1){if((r5|0)>(r3|0)){break L1886}r21=r5+1|0;r22=HEAP16[r2+(r21<<2)+2>>1];r23=r22&65535;r24=r20+1|0;r25=(r18|0)==(r23|0);if((r24|0)<(r4|0)&r25){r5=r21;r20=r24}else{break}}L1892:do{if((r24|0)<(r19|0)){r5=(r18<<2)+r1+2686|0;r26=(r18<<2)+r1+2684|0;r27=r24;r28=HEAP32[r7];r29=HEAP16[r9];while(1){r30=HEAPU16[r5>>1];r31=HEAPU16[r26>>1];r32=r29&65535|r31<<r28;r33=r32&65535;HEAP16[r9]=r33;if((r28|0)>(16-r30|0)){r34=HEAP32[r10];HEAP32[r10]=r34+1|0;HEAP8[HEAP32[r11]+r34|0]=r32&255;r32=HEAPU16[r9]>>>8&255;r34=HEAP32[r10];HEAP32[r10]=r34+1|0;HEAP8[HEAP32[r11]+r34|0]=r32;r32=HEAP32[r7];r34=r31>>>((16-r32|0)>>>0)&65535;HEAP16[r9]=r34;r35=r30-16+r32|0;r36=r34}else{r35=r28+r30|0;r36=r33}HEAP32[r7]=r35;r33=r27-1|0;if((r33|0)==0){break L1892}else{r27=r33;r28=r35;r29=r36}}}else{if((r18|0)!=0){if((r18|0)==(r17|0)){r37=r24;r38=HEAP32[r7];r39=HEAP16[r9]}else{r29=HEAPU16[r1+(r18<<2)+2686>>1];r28=HEAP32[r7];r27=HEAPU16[r1+(r18<<2)+2684>>1];r26=HEAPU16[r9]|r27<<r28;r5=r26&65535;HEAP16[r9]=r5;if((r28|0)>(16-r29|0)){r33=HEAP32[r10];HEAP32[r10]=r33+1|0;HEAP8[HEAP32[r11]+r33|0]=r26&255;r26=HEAPU16[r9]>>>8&255;r33=HEAP32[r10];HEAP32[r10]=r33+1|0;HEAP8[HEAP32[r11]+r33|0]=r26;r26=HEAP32[r7];r33=r27>>>((16-r26|0)>>>0)&65535;HEAP16[r9]=r33;r40=r29-16+r26|0;r41=r33}else{r40=r28+r29|0;r41=r5}HEAP32[r7]=r40;r37=r20;r38=r40;r39=r41}r5=HEAPU16[r14>>1];r29=HEAPU16[r15>>1];r28=r39&65535|r29<<r38;HEAP16[r9]=r28&65535;if((r38|0)>(16-r5|0)){r33=HEAP32[r10];HEAP32[r10]=r33+1|0;HEAP8[HEAP32[r11]+r33|0]=r28&255;r33=HEAPU16[r9]>>>8&255;r26=HEAP32[r10];HEAP32[r10]=r26+1|0;HEAP8[HEAP32[r11]+r26|0]=r33;r33=HEAP32[r7];r26=r29>>>((16-r33|0)>>>0);HEAP16[r9]=r26&65535;r42=r5-16+r33|0;r43=r26}else{r42=r38+r5|0;r43=r28}HEAP32[r7]=r42;r28=r37+65533&65535;r5=r43&65535|r28<<r42;HEAP16[r9]=r5&65535;if((r42|0)>14){r26=HEAP32[r10];HEAP32[r10]=r26+1|0;HEAP8[HEAP32[r11]+r26|0]=r5&255;r5=HEAPU16[r9]>>>8&255;r26=HEAP32[r10];HEAP32[r10]=r26+1|0;HEAP8[HEAP32[r11]+r26|0]=r5;r5=HEAP32[r7];HEAP16[r9]=r28>>>((16-r5|0)>>>0)&65535;HEAP32[r7]=r5-14|0;break}else{HEAP32[r7]=r42+2|0;break}}if((r24|0)<11){r5=HEAPU16[r6>>1];r28=HEAP32[r7];r26=HEAPU16[r8>>1];r33=HEAPU16[r9]|r26<<r28;HEAP16[r9]=r33&65535;if((r28|0)>(16-r5|0)){r29=HEAP32[r10];HEAP32[r10]=r29+1|0;HEAP8[HEAP32[r11]+r29|0]=r33&255;r29=HEAPU16[r9]>>>8&255;r27=HEAP32[r10];HEAP32[r10]=r27+1|0;HEAP8[HEAP32[r11]+r27|0]=r29;r29=HEAP32[r7];r27=r26>>>((16-r29|0)>>>0);HEAP16[r9]=r27&65535;r44=r5-16+r29|0;r45=r27}else{r44=r28+r5|0;r45=r33}HEAP32[r7]=r44;r33=r20+65534&65535;r5=r45&65535|r33<<r44;HEAP16[r9]=r5&65535;if((r44|0)>13){r28=HEAP32[r10];HEAP32[r10]=r28+1|0;HEAP8[HEAP32[r11]+r28|0]=r5&255;r5=HEAPU16[r9]>>>8&255;r28=HEAP32[r10];HEAP32[r10]=r28+1|0;HEAP8[HEAP32[r11]+r28|0]=r5;r5=HEAP32[r7];HEAP16[r9]=r33>>>((16-r5|0)>>>0)&65535;HEAP32[r7]=r5-13|0;break}else{HEAP32[r7]=r44+3|0;break}}else{r5=HEAPU16[r12>>1];r33=HEAP32[r7];r28=HEAPU16[r13>>1];r27=HEAPU16[r9]|r28<<r33;HEAP16[r9]=r27&65535;if((r33|0)>(16-r5|0)){r29=HEAP32[r10];HEAP32[r10]=r29+1|0;HEAP8[HEAP32[r11]+r29|0]=r27&255;r29=HEAPU16[r9]>>>8&255;r26=HEAP32[r10];HEAP32[r10]=r26+1|0;HEAP8[HEAP32[r11]+r26|0]=r29;r29=HEAP32[r7];r26=r28>>>((16-r29|0)>>>0);HEAP16[r9]=r26&65535;r46=r5-16+r29|0;r47=r26}else{r46=r33+r5|0;r47=r27}HEAP32[r7]=r46;r27=r20+65526&65535;r5=r47&65535|r27<<r46;HEAP16[r9]=r5&65535;if((r46|0)>9){r33=HEAP32[r10];HEAP32[r10]=r33+1|0;HEAP8[HEAP32[r11]+r33|0]=r5&255;r5=HEAPU16[r9]>>>8&255;r33=HEAP32[r10];HEAP32[r10]=r33+1|0;HEAP8[HEAP32[r11]+r33|0]=r5;r5=HEAP32[r7];HEAP16[r9]=r27>>>((16-r5|0)>>>0)&65535;HEAP32[r7]=r5-9|0;break}else{HEAP32[r7]=r46+7|0;break}}}}while(0);if(r22<<16>>16==0){r16=r21;r17=r18;r18=r23;r4=138;r19=3;continue}r16=r21;r17=r18;r18=r23;r4=r25?6:7;r19=r25?3:4}return}function _zcalloc(r1,r2,r3){return _malloc(Math.imul(r3,r2))}function _zcfree(r1,r2){_free(r2);return}function _adler32(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36,r37,r38,r39,r40,r41,r42,r43,r44,r45,r46,r47,r48,r49,r50,r51;r4=0;r5=r1>>>16;r6=r1&65535;if((r3|0)==1){r1=HEAPU8[r2]+r6|0;r7=r1>>>0>65520?r1-65521|0:r1;r1=r7+r5|0;r8=(r1>>>0>65520?r1+15|0:r1)<<16|r7;return r8}if((r2|0)==0){r8=1;return r8}if(r3>>>0<16){L1951:do{if((r3|0)==0){r9=r6;r10=r5}else{r7=r6;r1=r2;r11=r3;r12=r5;while(1){r13=r11-1|0;r14=HEAPU8[r1]+r7|0;r15=r14+r12|0;if((r13|0)==0){r9=r14;r10=r15;break L1951}else{r7=r14;r1=r1+1|0;r11=r13;r12=r15}}}}while(0);r8=(r10>>>0)%65521<<16|(r9>>>0>65520?r9-65521|0:r9);return r8}do{if(r3>>>0>5551){r9=r6;r10=r2;r12=r3;r11=r5;while(1){r16=r12-5552|0;r1=347;r7=r11;r15=r10;r13=r9;while(1){r14=HEAPU8[r15]+r13|0;r17=r14+HEAPU8[r15+1|0]|0;r18=r17+HEAPU8[r15+2|0]|0;r19=r18+HEAPU8[r15+3|0]|0;r20=r19+HEAPU8[r15+4|0]|0;r21=r20+HEAPU8[r15+5|0]|0;r22=r21+HEAPU8[r15+6|0]|0;r23=r22+HEAPU8[r15+7|0]|0;r24=r23+HEAPU8[r15+8|0]|0;r25=r24+HEAPU8[r15+9|0]|0;r26=r25+HEAPU8[r15+10|0]|0;r27=r26+HEAPU8[r15+11|0]|0;r28=r27+HEAPU8[r15+12|0]|0;r29=r28+HEAPU8[r15+13|0]|0;r30=r29+HEAPU8[r15+14|0]|0;r31=r30+HEAPU8[r15+15|0]|0;r32=r14+r7+r17+r18+r19+r20+r21+r22+r23+r24+r25+r26+r27+r28+r29+r30+r31|0;r30=r1-1|0;if((r30|0)==0){break}else{r1=r30;r7=r32;r15=r15+16|0;r13=r31}}r33=r10+5552|0;r34=(r31>>>0)%65521;r35=(r32>>>0)%65521;if(r16>>>0>5551){r9=r34;r10=r33;r12=r16;r11=r35}else{break}}if((r16|0)==0){r36=r35;r37=r34;break}if(r16>>>0>15){r38=r34;r39=r33;r40=r16;r41=r35;r4=1427;break}else{r42=r34;r43=r33;r44=r16;r45=r35;r4=1428;break}}else{r38=r6;r39=r2;r40=r3;r41=r5;r4=1427}}while(0);do{if(r4==1427){while(1){r4=0;r46=r40-16|0;r5=HEAPU8[r39]+r38|0;r3=r5+HEAPU8[r39+1|0]|0;r2=r3+HEAPU8[r39+2|0]|0;r6=r2+HEAPU8[r39+3|0]|0;r35=r6+HEAPU8[r39+4|0]|0;r16=r35+HEAPU8[r39+5|0]|0;r33=r16+HEAPU8[r39+6|0]|0;r34=r33+HEAPU8[r39+7|0]|0;r32=r34+HEAPU8[r39+8|0]|0;r31=r32+HEAPU8[r39+9|0]|0;r11=r31+HEAPU8[r39+10|0]|0;r12=r11+HEAPU8[r39+11|0]|0;r10=r12+HEAPU8[r39+12|0]|0;r9=r10+HEAPU8[r39+13|0]|0;r13=r9+HEAPU8[r39+14|0]|0;r47=r13+HEAPU8[r39+15|0]|0;r48=r5+r41+r3+r2+r6+r35+r16+r33+r34+r32+r31+r11+r12+r10+r9+r13+r47|0;r49=r39+16|0;if(r46>>>0>15){r38=r47;r39=r49;r40=r46;r41=r48;r4=1427}else{break}}if((r46|0)==0){r50=r47;r51=r48;r4=1429;break}else{r42=r47;r43=r49;r44=r46;r45=r48;r4=1428;break}}}while(0);L1969:do{if(r4==1428){while(1){r4=0;r48=r44-1|0;r46=HEAPU8[r43]+r42|0;r49=r46+r45|0;if((r48|0)==0){r50=r46;r51=r49;r4=1429;break L1969}else{r42=r46;r43=r43+1|0;r44=r48;r45=r49;r4=1428}}}}while(0);if(r4==1429){r36=(r51>>>0)%65521;r37=(r50>>>0)%65521}r8=r36<<16|r37;return r8}function _crc32(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22;if((r2|0)==0){r4=0;return r4}r5=r1^-1;L1980:do{if((r3|0)==0){r6=r5}else{r1=r2;r7=r3;r8=r5;while(1){if((r1&3|0)==0){break}r9=HEAP32[((HEAPU8[r1]^r8&255)<<2)+5247020>>2]^r8>>>8;r10=r7-1|0;if((r10|0)==0){r6=r9;break L1980}else{r1=r1+1|0;r7=r10;r8=r9}}r9=r1;L1985:do{if(r7>>>0>31){r10=r7;r11=r8;r12=r9,r13=r12>>2;while(1){r14=HEAP32[r13]^r11;r15=HEAP32[((r14>>>8&255)<<2)+5249068>>2]^HEAP32[((r14&255)<<2)+5250092>>2]^HEAP32[((r14>>>16&255)<<2)+5248044>>2]^HEAP32[(r14>>>24<<2)+5247020>>2]^HEAP32[r13+1];r14=HEAP32[((r15>>>8&255)<<2)+5249068>>2]^HEAP32[((r15&255)<<2)+5250092>>2]^HEAP32[((r15>>>16&255)<<2)+5248044>>2]^HEAP32[(r15>>>24<<2)+5247020>>2]^HEAP32[r13+2];r15=HEAP32[((r14>>>8&255)<<2)+5249068>>2]^HEAP32[((r14&255)<<2)+5250092>>2]^HEAP32[((r14>>>16&255)<<2)+5248044>>2]^HEAP32[(r14>>>24<<2)+5247020>>2]^HEAP32[r13+3];r14=HEAP32[((r15>>>8&255)<<2)+5249068>>2]^HEAP32[((r15&255)<<2)+5250092>>2]^HEAP32[((r15>>>16&255)<<2)+5248044>>2]^HEAP32[(r15>>>24<<2)+5247020>>2]^HEAP32[r13+4];r15=HEAP32[((r14>>>8&255)<<2)+5249068>>2]^HEAP32[((r14&255)<<2)+5250092>>2]^HEAP32[((r14>>>16&255)<<2)+5248044>>2]^HEAP32[(r14>>>24<<2)+5247020>>2]^HEAP32[r13+5];r14=HEAP32[((r15>>>8&255)<<2)+5249068>>2]^HEAP32[((r15&255)<<2)+5250092>>2]^HEAP32[((r15>>>16&255)<<2)+5248044>>2]^HEAP32[(r15>>>24<<2)+5247020>>2]^HEAP32[r13+6];r15=r12+32|0;r16=HEAP32[((r14>>>8&255)<<2)+5249068>>2]^HEAP32[((r14&255)<<2)+5250092>>2]^HEAP32[((r14>>>16&255)<<2)+5248044>>2]^HEAP32[(r14>>>24<<2)+5247020>>2]^HEAP32[r13+7];r14=HEAP32[((r16>>>8&255)<<2)+5249068>>2]^HEAP32[((r16&255)<<2)+5250092>>2]^HEAP32[((r16>>>16&255)<<2)+5248044>>2]^HEAP32[(r16>>>24<<2)+5247020>>2];r16=r10-32|0;if(r16>>>0>31){r10=r16;r11=r14;r12=r15,r13=r12>>2}else{r17=r16;r18=r14;r19=r15;break L1985}}}else{r17=r7;r18=r8;r19=r9}}while(0);L1989:do{if(r17>>>0>3){r9=r17;r8=r18;r7=r19;while(1){r1=r7+4|0;r12=HEAP32[r7>>2]^r8;r13=HEAP32[((r12>>>8&255)<<2)+5249068>>2]^HEAP32[((r12&255)<<2)+5250092>>2]^HEAP32[((r12>>>16&255)<<2)+5248044>>2]^HEAP32[(r12>>>24<<2)+5247020>>2];r12=r9-4|0;if(r12>>>0>3){r9=r12;r8=r13;r7=r1}else{r20=r12;r21=r13;r22=r1;break L1989}}}else{r20=r17;r21=r18;r22=r19}}while(0);if((r20|0)==0){r6=r21;break}r7=r21;r8=r20;r9=r22;while(1){r1=HEAP32[((HEAPU8[r9]^r7&255)<<2)+5247020>>2]^r7>>>8;r13=r8-1|0;if((r13|0)==0){r6=r1;break L1980}else{r7=r1;r8=r13;r9=r9+1|0}}}}while(0);r4=r6^-1;return r4}function _inflate_fast(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36,r37,r38,r39,r40,r41,r42,r43,r44,r45,r46,r47,r48,r49,r50,r51,r52,r53,r54,r55,r56,r57,r58,r59,r60,r61,r62,r63,r64,r65,r66,r67,r68,r69,r70,r71,r72,r73,r74,r75,r76,r77,r78,r79,r80,r81,r82,r83,r84,r85,r86,r87,r88,r89,r90,r91,r92,r93,r94,r95,r96,r97,r98;r3=0;r4=HEAP32[r1+28>>2],r5=r4>>2;r6=r1|0;r7=HEAP32[r6>>2];r8=r1+4|0;r9=r7+(HEAP32[r8>>2]-6)|0;r10=r1+12|0;r11=HEAP32[r10>>2];r12=(r1+16|0)>>2;r13=HEAP32[r12];r14=r11+(r13-258)|0;r15=HEAP32[r5+11];r16=HEAP32[r5+12];r17=HEAP32[r5+13];r18=(r4+56|0)>>2;r19=(r4+60|0)>>2;r20=HEAP32[r5+19];r21=HEAP32[r5+20];r22=(1<<HEAP32[r5+21])-1|0;r23=(1<<HEAP32[r5+22])-1|0;r24=r11+r13+(r2^-1)|0;r2=r4+7104|0;r4=r17-1|0;r13=(r16|0)==0;r25=HEAP32[r5+10]-1|0;r26=r25+r16|0;r27=r16-1|0;r28=r24-1|0;r29=r24-r16|0;r30=r7-1|0;r7=r11-1|0;r11=HEAP32[r18];r31=HEAP32[r19];L1999:while(1){if(r31>>>0<15){r32=r30+2|0;r33=r32;r34=(HEAPU8[r30+1|0]<<r31)+(HEAPU8[r32]<<r31+8)+r11|0;r35=r31+16|0}else{r33=r30;r34=r11;r35=r31}r32=r34&r22;r36=HEAP8[(r32<<2)+r20|0];r37=HEAP16[r20+(r32<<2)+2>>1];r38=HEAPU8[(r32<<2)+r20+1|0];r32=r34>>>(r38>>>0);r39=r35-r38|0;L2004:do{if(r36<<24>>24==0){r40=r37;r41=r32;r42=r39;r3=1455}else{r38=r37;r43=r32;r44=r39;r45=r36;while(1){r46=r45&255;if((r46&16|0)!=0){break}if((r46&64|0)!=0){r3=1503;break L1999}r47=(r43&(1<<r46)-1)+(r38&65535)|0;r48=HEAP8[(r47<<2)+r20|0];r49=HEAP16[r20+(r47<<2)+2>>1];r50=HEAPU8[(r47<<2)+r20+1|0];r47=r43>>>(r50>>>0);r51=r44-r50|0;if(r48<<24>>24==0){r40=r49;r41=r47;r42=r51;r3=1455;break L2004}else{r38=r49;r43=r47;r44=r51;r45=r48}}r45=r38&65535;r48=r46&15;if((r48|0)==0){r52=r45;r53=r33;r54=r43;r55=r44}else{if(r44>>>0<r48>>>0){r51=r33+1|0;r56=r51;r57=(HEAPU8[r51]<<r44)+r43|0;r58=r44+8|0}else{r56=r33;r57=r43;r58=r44}r52=(r57&(1<<r48)-1)+r45|0;r53=r56;r54=r57>>>(r48>>>0);r55=r58-r48|0}if(r55>>>0<15){r48=r53+2|0;r59=r48;r60=(HEAPU8[r53+1|0]<<r55)+(HEAPU8[r48]<<r55+8)+r54|0;r61=r55+16|0}else{r59=r53;r60=r54;r61=r55}r48=r60&r23;r45=HEAP16[r21+(r48<<2)+2>>1];r51=HEAPU8[(r48<<2)+r21+1|0];r47=r60>>>(r51>>>0);r49=r61-r51|0;r51=HEAPU8[(r48<<2)+r21|0];L2019:do{if((r51&16|0)==0){r48=r45;r62=r47;r63=r49;r50=r51;while(1){if((r50&64|0)!=0){r3=1500;break L1999}r64=(r62&(1<<r50)-1)+(r48&65535)|0;r65=HEAP16[r21+(r64<<2)+2>>1];r66=HEAPU8[(r64<<2)+r21+1|0];r67=r62>>>(r66>>>0);r68=r63-r66|0;r66=HEAPU8[(r64<<2)+r21|0];if((r66&16|0)==0){r48=r65;r62=r67;r63=r68;r50=r66}else{r69=r65;r70=r67;r71=r68;r72=r66;break L2019}}}else{r69=r45;r70=r47;r71=r49;r72=r51}}while(0);r51=r69&65535;r49=r72&15;do{if(r71>>>0<r49>>>0){r47=r59+1|0;r45=(HEAPU8[r47]<<r71)+r70|0;r38=r71+8|0;if(r38>>>0>=r49>>>0){r73=r47;r74=r45;r75=r38;break}r47=r59+2|0;r73=r47;r74=(HEAPU8[r47]<<r38)+r45|0;r75=r71+16|0}else{r73=r59;r74=r70;r75=r71}}while(0);r45=(r74&(1<<r49)-1)+r51|0;r76=r74>>>(r49>>>0);r77=r75-r49|0;r38=r7;r47=r38-r24|0;if(r45>>>0<=r47>>>0){r50=r7+ -r45|0;r48=r52;r66=r7;while(1){HEAP8[r66+1|0]=HEAP8[r50+1|0];HEAP8[r66+2|0]=HEAP8[r50+2|0];r68=r50+3|0;r78=r66+3|0;HEAP8[r78]=HEAP8[r68];r79=r48-3|0;if(r79>>>0>2){r50=r68;r48=r79;r66=r78}else{break}}if((r79|0)==0){r80=r73;r81=r78;r82=r76;r83=r77;break}r48=r66+4|0;HEAP8[r48]=HEAP8[r50+4|0];if(r79>>>0<=1){r80=r73;r81=r48;r82=r76;r83=r77;break}r48=r66+5|0;HEAP8[r48]=HEAP8[r50+5|0];r80=r73;r81=r48;r82=r76;r83=r77;break}r48=r45-r47|0;if(r48>>>0>r15>>>0){if((HEAP32[r2>>2]|0)!=0){r3=1470;break L1999}}do{if(r13){r49=r17+(r25-r48)|0;if(r48>>>0>=r52>>>0){r84=r49;r85=r52;r86=r7;break}r51=r52-r48|0;r68=r45-r38|0;r67=r49;r49=r48;r65=r7;while(1){r64=r67+1|0;r87=r65+1|0;HEAP8[r87]=HEAP8[r64];r88=r49-1|0;if((r88|0)==0){break}else{r67=r64;r49=r88;r65=r87}}r84=r7+r28+r68+(1-r45)|0;r85=r51;r86=r7+r24+r68|0}else{if(r16>>>0>=r48>>>0){r65=r17+(r27-r48)|0;if(r48>>>0>=r52>>>0){r84=r65;r85=r52;r86=r7;break}r49=r52-r48|0;r67=r45-r38|0;r87=r65;r65=r48;r88=r7;while(1){r64=r87+1|0;r89=r88+1|0;HEAP8[r89]=HEAP8[r64];r90=r65-1|0;if((r90|0)==0){break}else{r87=r64;r65=r90;r88=r89}}r84=r7+r28+r67+(1-r45)|0;r85=r49;r86=r7+r24+r67|0;break}r88=r17+(r26-r48)|0;r65=r48-r16|0;if(r65>>>0>=r52>>>0){r84=r88;r85=r52;r86=r7;break}r87=r52-r65|0;r68=r45-r38|0;r51=r88;r88=r65;r65=r7;while(1){r89=r51+1|0;r90=r65+1|0;HEAP8[r90]=HEAP8[r89];r64=r88-1|0;if((r64|0)==0){break}else{r51=r89;r88=r64;r65=r90}}r65=r7+r29+r68|0;if(r16>>>0>=r87>>>0){r84=r4;r85=r87;r86=r65;break}r88=r87-r16|0;r51=r4;r67=r16;r49=r65;while(1){r65=r51+1|0;r90=r49+1|0;HEAP8[r90]=HEAP8[r65];r64=r67-1|0;if((r64|0)==0){break}else{r51=r65;r67=r64;r49=r90}}r84=r7+r28+r68+(1-r45)|0;r85=r88;r86=r7+r24+r68|0}}while(0);L2062:do{if(r85>>>0>2){r45=r86;r38=r85;r48=r84;while(1){HEAP8[r45+1|0]=HEAP8[r48+1|0];HEAP8[r45+2|0]=HEAP8[r48+2|0];r47=r48+3|0;r50=r45+3|0;HEAP8[r50]=HEAP8[r47];r66=r38-3|0;if(r66>>>0>2){r45=r50;r38=r66;r48=r47}else{r91=r50;r92=r66;r93=r47;break L2062}}}else{r91=r86;r92=r85;r93=r84}}while(0);if((r92|0)==0){r80=r73;r81=r91;r82=r76;r83=r77;break}r48=r91+1|0;HEAP8[r48]=HEAP8[r93+1|0];if(r92>>>0<=1){r80=r73;r81=r48;r82=r76;r83=r77;break}r48=r91+2|0;HEAP8[r48]=HEAP8[r93+2|0];r80=r73;r81=r48;r82=r76;r83=r77;break}}while(0);if(r3==1455){r3=0;r36=r7+1|0;HEAP8[r36]=r40&255;r80=r33;r81=r36;r82=r41;r83=r42}if(r80>>>0<r9>>>0&r81>>>0<r14>>>0){r30=r80;r7=r81;r11=r82;r31=r83}else{r94=r80;r95=r81;r96=r82;r97=r83;break}}do{if(r3==1500){HEAP32[r1+24>>2]=5256120;HEAP32[r5]=29;r94=r59;r95=r7;r96=r62;r97=r63}else if(r3==1503){if((r46&32|0)==0){HEAP32[r1+24>>2]=5256016;HEAP32[r5]=29;r94=r33;r95=r7;r96=r43;r97=r44;break}else{HEAP32[r5]=11;r94=r33;r95=r7;r96=r43;r97=r44;break}}else if(r3==1470){HEAP32[r1+24>>2]=5255764;HEAP32[r5]=29;r94=r73;r95=r7;r96=r76;r97=r77}}while(0);r77=r97>>>3;r76=r94+ -r77|0;r7=r97-(r77<<3)|0;r97=(1<<r7)-1&r96;HEAP32[r6>>2]=r94+(1-r77)|0;HEAP32[r10>>2]=r95+1|0;if(r76>>>0<r9>>>0){r98=r9-r76|0}else{r98=r9-r76|0}HEAP32[r8>>2]=r98+5|0;if(r95>>>0<r14>>>0){r98=r14-r95|0;r8=r98+257|0;HEAP32[r12]=r8;HEAP32[r18]=r97;HEAP32[r19]=r7;return}else{r98=r14-r95|0;r8=r98+257|0;HEAP32[r12]=r8;HEAP32[r18]=r97;HEAP32[r19]=r7;return}}function _malloc(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36,r37,r38,r39,r40,r41,r42,r43,r44,r45,r46,r47,r48,r49,r50,r51,r52,r53,r54,r55,r56,r57,r58,r59,r60,r61,r62,r63,r64,r65,r66,r67,r68,r69,r70,r71,r72,r73,r74,r75,r76,r77,r78,r79,r80,r81,r82,r83,r84,r85,r86,r87,r88,r89,r90,r91,r92,r93,r94,r95;r2=0;do{if(r1>>>0<245){if(r1>>>0<11){r3=16}else{r3=r1+11&-8}r4=r3>>>3;r5=HEAP32[1314168];r6=r5>>>(r4>>>0);if((r6&3|0)!=0){r7=(r6&1^1)+r4|0;r8=r7<<1;r9=(r8<<2)+5256712|0;r10=(r8+2<<2)+5256712|0;r8=HEAP32[r10>>2];r11=r8+8|0;r12=HEAP32[r11>>2];do{if((r9|0)==(r12|0)){HEAP32[1314168]=r5&(1<<r7^-1)}else{if(r12>>>0<HEAP32[1314172]>>>0){_abort()}r13=r12+12|0;if((HEAP32[r13>>2]|0)==(r8|0)){HEAP32[r13>>2]=r9;HEAP32[r10>>2]=r12;break}else{_abort()}}}while(0);r12=r7<<3;HEAP32[r8+4>>2]=r12|3;r10=r8+(r12|4)|0;HEAP32[r10>>2]=HEAP32[r10>>2]|1;r14=r11;return r14}if(r3>>>0<=HEAP32[1314170]>>>0){r15=r3,r16=r15>>2;break}if((r6|0)!=0){r10=2<<r4;r12=r6<<r4&(r10|-r10);r10=(r12&-r12)-1|0;r12=r10>>>12&16;r9=r10>>>(r12>>>0);r10=r9>>>5&8;r13=r9>>>(r10>>>0);r9=r13>>>2&4;r17=r13>>>(r9>>>0);r13=r17>>>1&2;r18=r17>>>(r13>>>0);r17=r18>>>1&1;r19=(r10|r12|r9|r13|r17)+(r18>>>(r17>>>0))|0;r17=r19<<1;r18=(r17<<2)+5256712|0;r13=(r17+2<<2)+5256712|0;r17=HEAP32[r13>>2];r9=r17+8|0;r12=HEAP32[r9>>2];do{if((r18|0)==(r12|0)){HEAP32[1314168]=r5&(1<<r19^-1)}else{if(r12>>>0<HEAP32[1314172]>>>0){_abort()}r10=r12+12|0;if((HEAP32[r10>>2]|0)==(r17|0)){HEAP32[r10>>2]=r18;HEAP32[r13>>2]=r12;break}else{_abort()}}}while(0);r12=r19<<3;r13=r12-r3|0;HEAP32[r17+4>>2]=r3|3;r18=r17;r5=r18+r3|0;HEAP32[r18+(r3|4)>>2]=r13|1;HEAP32[r18+r12>>2]=r13;r12=HEAP32[1314170];if((r12|0)!=0){r18=HEAP32[1314173];r4=r12>>>3;r12=r4<<1;r6=(r12<<2)+5256712|0;r11=HEAP32[1314168];r8=1<<r4;do{if((r11&r8|0)==0){HEAP32[1314168]=r11|r8;r20=r6;r21=(r12+2<<2)+5256712|0}else{r4=(r12+2<<2)+5256712|0;r7=HEAP32[r4>>2];if(r7>>>0>=HEAP32[1314172]>>>0){r20=r7;r21=r4;break}_abort()}}while(0);HEAP32[r21>>2]=r18;HEAP32[r20+12>>2]=r18;HEAP32[r18+8>>2]=r20;HEAP32[r18+12>>2]=r6}HEAP32[1314170]=r13;HEAP32[1314173]=r5;r14=r9;return r14}r12=HEAP32[1314169];if((r12|0)==0){r15=r3,r16=r15>>2;break}r8=(r12&-r12)-1|0;r12=r8>>>12&16;r11=r8>>>(r12>>>0);r8=r11>>>5&8;r17=r11>>>(r8>>>0);r11=r17>>>2&4;r19=r17>>>(r11>>>0);r17=r19>>>1&2;r4=r19>>>(r17>>>0);r19=r4>>>1&1;r7=HEAP32[((r8|r12|r11|r17|r19)+(r4>>>(r19>>>0))<<2)+5256976>>2];r19=r7;r4=r7,r17=r4>>2;r11=(HEAP32[r7+4>>2]&-8)-r3|0;while(1){r7=HEAP32[r19+16>>2];if((r7|0)==0){r12=HEAP32[r19+20>>2];if((r12|0)==0){break}else{r22=r12}}else{r22=r7}r7=(HEAP32[r22+4>>2]&-8)-r3|0;r12=r7>>>0<r11>>>0;r19=r22;r4=r12?r22:r4,r17=r4>>2;r11=r12?r7:r11}r19=r4;r9=HEAP32[1314172];if(r19>>>0<r9>>>0){_abort()}r5=r19+r3|0;r13=r5;if(r19>>>0>=r5>>>0){_abort()}r5=HEAP32[r17+6];r6=HEAP32[r17+3];L2144:do{if((r6|0)==(r4|0)){r18=r4+20|0;r7=HEAP32[r18>>2];do{if((r7|0)==0){r12=r4+16|0;r8=HEAP32[r12>>2];if((r8|0)==0){r23=0,r24=r23>>2;break L2144}else{r25=r8;r26=r12;break}}else{r25=r7;r26=r18}}while(0);while(1){r18=r25+20|0;r7=HEAP32[r18>>2];if((r7|0)!=0){r25=r7;r26=r18;continue}r18=r25+16|0;r7=HEAP32[r18>>2];if((r7|0)==0){break}else{r25=r7;r26=r18}}if(r26>>>0<r9>>>0){_abort()}else{HEAP32[r26>>2]=0;r23=r25,r24=r23>>2;break}}else{r18=HEAP32[r17+2];if(r18>>>0<r9>>>0){_abort()}r7=r18+12|0;if((HEAP32[r7>>2]|0)!=(r4|0)){_abort()}r12=r6+8|0;if((HEAP32[r12>>2]|0)==(r4|0)){HEAP32[r7>>2]=r6;HEAP32[r12>>2]=r18;r23=r6,r24=r23>>2;break}else{_abort()}}}while(0);L2166:do{if((r5|0)!=0){r6=r4+28|0;r9=(HEAP32[r6>>2]<<2)+5256976|0;do{if((r4|0)==(HEAP32[r9>>2]|0)){HEAP32[r9>>2]=r23;if((r23|0)!=0){break}HEAP32[1314169]=HEAP32[1314169]&(1<<HEAP32[r6>>2]^-1);break L2166}else{if(r5>>>0<HEAP32[1314172]>>>0){_abort()}r18=r5+16|0;if((HEAP32[r18>>2]|0)==(r4|0)){HEAP32[r18>>2]=r23}else{HEAP32[r5+20>>2]=r23}if((r23|0)==0){break L2166}}}while(0);if(r23>>>0<HEAP32[1314172]>>>0){_abort()}HEAP32[r24+6]=r5;r6=HEAP32[r17+4];do{if((r6|0)!=0){if(r6>>>0<HEAP32[1314172]>>>0){_abort()}else{HEAP32[r24+4]=r6;HEAP32[r6+24>>2]=r23;break}}}while(0);r6=HEAP32[r17+5];if((r6|0)==0){break}if(r6>>>0<HEAP32[1314172]>>>0){_abort()}else{HEAP32[r24+5]=r6;HEAP32[r6+24>>2]=r23;break}}}while(0);if(r11>>>0<16){r5=r11+r3|0;HEAP32[r17+1]=r5|3;r6=r5+(r19+4)|0;HEAP32[r6>>2]=HEAP32[r6>>2]|1}else{HEAP32[r17+1]=r3|3;HEAP32[r19+(r3|4)>>2]=r11|1;HEAP32[r19+r11+r3>>2]=r11;r6=HEAP32[1314170];if((r6|0)!=0){r5=HEAP32[1314173];r9=r6>>>3;r6=r9<<1;r18=(r6<<2)+5256712|0;r12=HEAP32[1314168];r7=1<<r9;do{if((r12&r7|0)==0){HEAP32[1314168]=r12|r7;r27=r18;r28=(r6+2<<2)+5256712|0}else{r9=(r6+2<<2)+5256712|0;r8=HEAP32[r9>>2];if(r8>>>0>=HEAP32[1314172]>>>0){r27=r8;r28=r9;break}_abort()}}while(0);HEAP32[r28>>2]=r5;HEAP32[r27+12>>2]=r5;HEAP32[r5+8>>2]=r27;HEAP32[r5+12>>2]=r18}HEAP32[1314170]=r11;HEAP32[1314173]=r13}r6=r4+8|0;if((r6|0)==0){r15=r3,r16=r15>>2;break}else{r14=r6}return r14}else{if(r1>>>0>4294967231){r15=-1,r16=r15>>2;break}r6=r1+11|0;r7=r6&-8,r12=r7>>2;r19=HEAP32[1314169];if((r19|0)==0){r15=r7,r16=r15>>2;break}r17=-r7|0;r9=r6>>>8;do{if((r9|0)==0){r29=0}else{if(r7>>>0>16777215){r29=31;break}r6=(r9+1048320|0)>>>16&8;r8=r9<<r6;r10=(r8+520192|0)>>>16&4;r30=r8<<r10;r8=(r30+245760|0)>>>16&2;r31=14-(r10|r6|r8)+(r30<<r8>>>15)|0;r29=r7>>>((r31+7|0)>>>0)&1|r31<<1}}while(0);r9=HEAP32[(r29<<2)+5256976>>2];L2214:do{if((r9|0)==0){r32=0;r33=r17;r34=0}else{if((r29|0)==31){r35=0}else{r35=25-(r29>>>1)|0}r4=0;r13=r17;r11=r9,r18=r11>>2;r5=r7<<r35;r31=0;while(1){r8=HEAP32[r18+1]&-8;r30=r8-r7|0;if(r30>>>0<r13>>>0){if((r8|0)==(r7|0)){r32=r11;r33=r30;r34=r11;break L2214}else{r36=r11;r37=r30}}else{r36=r4;r37=r13}r30=HEAP32[r18+5];r8=HEAP32[((r5>>>31<<2)+16>>2)+r18];r6=(r30|0)==0|(r30|0)==(r8|0)?r31:r30;if((r8|0)==0){r32=r36;r33=r37;r34=r6;break L2214}else{r4=r36;r13=r37;r11=r8,r18=r11>>2;r5=r5<<1;r31=r6}}}}while(0);if((r34|0)==0&(r32|0)==0){r9=2<<r29;r17=r19&(r9|-r9);if((r17|0)==0){r15=r7,r16=r15>>2;break}r9=(r17&-r17)-1|0;r17=r9>>>12&16;r31=r9>>>(r17>>>0);r9=r31>>>5&8;r5=r31>>>(r9>>>0);r31=r5>>>2&4;r11=r5>>>(r31>>>0);r5=r11>>>1&2;r18=r11>>>(r5>>>0);r11=r18>>>1&1;r38=HEAP32[((r9|r17|r31|r5|r11)+(r18>>>(r11>>>0))<<2)+5256976>>2]}else{r38=r34}L2229:do{if((r38|0)==0){r39=r33;r40=r32,r41=r40>>2}else{r11=r38,r18=r11>>2;r5=r33;r31=r32;while(1){r17=(HEAP32[r18+1]&-8)-r7|0;r9=r17>>>0<r5>>>0;r13=r9?r17:r5;r17=r9?r11:r31;r9=HEAP32[r18+4];if((r9|0)!=0){r11=r9,r18=r11>>2;r5=r13;r31=r17;continue}r9=HEAP32[r18+5];if((r9|0)==0){r39=r13;r40=r17,r41=r40>>2;break L2229}else{r11=r9,r18=r11>>2;r5=r13;r31=r17}}}}while(0);if((r40|0)==0){r15=r7,r16=r15>>2;break}if(r39>>>0>=(HEAP32[1314170]-r7|0)>>>0){r15=r7,r16=r15>>2;break}r19=r40,r31=r19>>2;r5=HEAP32[1314172];if(r19>>>0<r5>>>0){_abort()}r11=r19+r7|0;r18=r11;if(r19>>>0>=r11>>>0){_abort()}r17=HEAP32[r41+6];r13=HEAP32[r41+3];L2242:do{if((r13|0)==(r40|0)){r9=r40+20|0;r4=HEAP32[r9>>2];do{if((r4|0)==0){r6=r40+16|0;r8=HEAP32[r6>>2];if((r8|0)==0){r42=0,r43=r42>>2;break L2242}else{r44=r8;r45=r6;break}}else{r44=r4;r45=r9}}while(0);while(1){r9=r44+20|0;r4=HEAP32[r9>>2];if((r4|0)!=0){r44=r4;r45=r9;continue}r9=r44+16|0;r4=HEAP32[r9>>2];if((r4|0)==0){break}else{r44=r4;r45=r9}}if(r45>>>0<r5>>>0){_abort()}else{HEAP32[r45>>2]=0;r42=r44,r43=r42>>2;break}}else{r9=HEAP32[r41+2];if(r9>>>0<r5>>>0){_abort()}r4=r9+12|0;if((HEAP32[r4>>2]|0)!=(r40|0)){_abort()}r6=r13+8|0;if((HEAP32[r6>>2]|0)==(r40|0)){HEAP32[r4>>2]=r13;HEAP32[r6>>2]=r9;r42=r13,r43=r42>>2;break}else{_abort()}}}while(0);L2264:do{if((r17|0)!=0){r13=r40+28|0;r5=(HEAP32[r13>>2]<<2)+5256976|0;do{if((r40|0)==(HEAP32[r5>>2]|0)){HEAP32[r5>>2]=r42;if((r42|0)!=0){break}HEAP32[1314169]=HEAP32[1314169]&(1<<HEAP32[r13>>2]^-1);break L2264}else{if(r17>>>0<HEAP32[1314172]>>>0){_abort()}r9=r17+16|0;if((HEAP32[r9>>2]|0)==(r40|0)){HEAP32[r9>>2]=r42}else{HEAP32[r17+20>>2]=r42}if((r42|0)==0){break L2264}}}while(0);if(r42>>>0<HEAP32[1314172]>>>0){_abort()}HEAP32[r43+6]=r17;r13=HEAP32[r41+4];do{if((r13|0)!=0){if(r13>>>0<HEAP32[1314172]>>>0){_abort()}else{HEAP32[r43+4]=r13;HEAP32[r13+24>>2]=r42;break}}}while(0);r13=HEAP32[r41+5];if((r13|0)==0){break}if(r13>>>0<HEAP32[1314172]>>>0){_abort()}else{HEAP32[r43+5]=r13;HEAP32[r13+24>>2]=r42;break}}}while(0);do{if(r39>>>0<16){r17=r39+r7|0;HEAP32[r41+1]=r17|3;r13=r17+(r19+4)|0;HEAP32[r13>>2]=HEAP32[r13>>2]|1}else{HEAP32[r41+1]=r7|3;HEAP32[((r7|4)>>2)+r31]=r39|1;HEAP32[(r39>>2)+r31+r12]=r39;r13=r39>>>3;if(r39>>>0<256){r17=r13<<1;r5=(r17<<2)+5256712|0;r9=HEAP32[1314168];r6=1<<r13;do{if((r9&r6|0)==0){HEAP32[1314168]=r9|r6;r46=r5;r47=(r17+2<<2)+5256712|0}else{r13=(r17+2<<2)+5256712|0;r4=HEAP32[r13>>2];if(r4>>>0>=HEAP32[1314172]>>>0){r46=r4;r47=r13;break}_abort()}}while(0);HEAP32[r47>>2]=r18;HEAP32[r46+12>>2]=r18;HEAP32[r12+(r31+2)]=r46;HEAP32[r12+(r31+3)]=r5;break}r17=r11;r6=r39>>>8;do{if((r6|0)==0){r48=0}else{if(r39>>>0>16777215){r48=31;break}r9=(r6+1048320|0)>>>16&8;r13=r6<<r9;r4=(r13+520192|0)>>>16&4;r8=r13<<r4;r13=(r8+245760|0)>>>16&2;r30=14-(r4|r9|r13)+(r8<<r13>>>15)|0;r48=r39>>>((r30+7|0)>>>0)&1|r30<<1}}while(0);r6=(r48<<2)+5256976|0;HEAP32[r12+(r31+7)]=r48;HEAP32[r12+(r31+5)]=0;HEAP32[r12+(r31+4)]=0;r5=HEAP32[1314169];r30=1<<r48;if((r5&r30|0)==0){HEAP32[1314169]=r5|r30;HEAP32[r6>>2]=r17;HEAP32[r12+(r31+6)]=r6;HEAP32[r12+(r31+3)]=r17;HEAP32[r12+(r31+2)]=r17;break}if((r48|0)==31){r49=0}else{r49=25-(r48>>>1)|0}r30=r39<<r49;r5=HEAP32[r6>>2];while(1){if((HEAP32[r5+4>>2]&-8|0)==(r39|0)){break}r50=(r30>>>31<<2)+r5+16|0;r6=HEAP32[r50>>2];if((r6|0)==0){r2=1666;break}else{r30=r30<<1;r5=r6}}if(r2==1666){if(r50>>>0<HEAP32[1314172]>>>0){_abort()}else{HEAP32[r50>>2]=r17;HEAP32[r12+(r31+6)]=r5;HEAP32[r12+(r31+3)]=r17;HEAP32[r12+(r31+2)]=r17;break}}r30=r5+8|0;r6=HEAP32[r30>>2];r13=HEAP32[1314172];if(r5>>>0<r13>>>0){_abort()}if(r6>>>0<r13>>>0){_abort()}else{HEAP32[r6+12>>2]=r17;HEAP32[r30>>2]=r17;HEAP32[r12+(r31+2)]=r6;HEAP32[r12+(r31+3)]=r5;HEAP32[r12+(r31+6)]=0;break}}}while(0);r31=r40+8|0;if((r31|0)==0){r15=r7,r16=r15>>2;break}else{r14=r31}return r14}}while(0);r40=HEAP32[1314170];if(r15>>>0<=r40>>>0){r50=r40-r15|0;r39=HEAP32[1314173];if(r50>>>0>15){r49=r39;HEAP32[1314173]=r49+r15|0;HEAP32[1314170]=r50;HEAP32[(r49+4>>2)+r16]=r50|1;HEAP32[r49+r40>>2]=r50;HEAP32[r39+4>>2]=r15|3}else{HEAP32[1314170]=0;HEAP32[1314173]=0;HEAP32[r39+4>>2]=r40|3;r50=r40+(r39+4)|0;HEAP32[r50>>2]=HEAP32[r50>>2]|1}r14=r39+8|0;return r14}r39=HEAP32[1314171];if(r15>>>0<r39>>>0){r50=r39-r15|0;HEAP32[1314171]=r50;r39=HEAP32[1314174];r40=r39;HEAP32[1314174]=r40+r15|0;HEAP32[(r40+4>>2)+r16]=r50|1;HEAP32[r39+4>>2]=r15|3;r14=r39+8|0;return r14}do{if((HEAP32[1311053]|0)==0){r39=_sysconf(8);if((r39-1&r39|0)==0){HEAP32[1311055]=r39;HEAP32[1311054]=r39;HEAP32[1311056]=-1;HEAP32[1311057]=2097152;HEAP32[1311058]=0;HEAP32[1314279]=0;HEAP32[1311053]=_time(0)&-16^1431655768;break}else{_abort()}}}while(0);r39=r15+48|0;r50=HEAP32[1311055];r40=r15+47|0;r49=r50+r40|0;r48=-r50|0;r50=r49&r48;if(r50>>>0<=r15>>>0){r14=0;return r14}r46=HEAP32[1314278];do{if((r46|0)!=0){r47=HEAP32[1314276];r41=r47+r50|0;if(r41>>>0<=r47>>>0|r41>>>0>r46>>>0){r14=0}else{break}return r14}}while(0);L2356:do{if((HEAP32[1314279]&4|0)==0){r46=HEAP32[1314174];L2358:do{if((r46|0)==0){r2=1696}else{r41=r46;r47=5257120;while(1){r51=r47|0;r42=HEAP32[r51>>2];if(r42>>>0<=r41>>>0){r52=r47+4|0;if((r42+HEAP32[r52>>2]|0)>>>0>r41>>>0){break}}r42=HEAP32[r47+8>>2];if((r42|0)==0){r2=1696;break L2358}else{r47=r42}}if((r47|0)==0){r2=1696;break}r41=r49-HEAP32[1314171]&r48;if(r41>>>0>=2147483647){r53=0;break}r5=_sbrk(r41);r17=(r5|0)==(HEAP32[r51>>2]+HEAP32[r52>>2]|0);r54=r17?r5:-1;r55=r17?r41:0;r56=r5;r57=r41;r2=1705;break}}while(0);do{if(r2==1696){r46=_sbrk(0);if((r46|0)==-1){r53=0;break}r7=r46;r41=HEAP32[1311054];r5=r41-1|0;if((r5&r7|0)==0){r58=r50}else{r58=r50-r7+(r5+r7&-r41)|0}r41=HEAP32[1314276];r7=r41+r58|0;if(!(r58>>>0>r15>>>0&r58>>>0<2147483647)){r53=0;break}r5=HEAP32[1314278];if((r5|0)!=0){if(r7>>>0<=r41>>>0|r7>>>0>r5>>>0){r53=0;break}}r5=_sbrk(r58);r7=(r5|0)==(r46|0);r54=r7?r46:-1;r55=r7?r58:0;r56=r5;r57=r58;r2=1705;break}}while(0);L2378:do{if(r2==1705){r5=-r57|0;if((r54|0)!=-1){r59=r55,r60=r59>>2;r61=r54,r62=r61>>2;r2=1716;break L2356}do{if((r56|0)!=-1&r57>>>0<2147483647&r57>>>0<r39>>>0){r7=HEAP32[1311055];r46=r40-r57+r7&-r7;if(r46>>>0>=2147483647){r63=r57;break}if((_sbrk(r46)|0)==-1){_sbrk(r5);r53=r55;break L2378}else{r63=r46+r57|0;break}}else{r63=r57}}while(0);if((r56|0)==-1){r53=r55}else{r59=r63,r60=r59>>2;r61=r56,r62=r61>>2;r2=1716;break L2356}}}while(0);HEAP32[1314279]=HEAP32[1314279]|4;r64=r53;r2=1713;break}else{r64=0;r2=1713}}while(0);do{if(r2==1713){if(r50>>>0>=2147483647){break}r53=_sbrk(r50);r56=_sbrk(0);if(!((r56|0)!=-1&(r53|0)!=-1&r53>>>0<r56>>>0)){break}r63=r56-r53|0;r56=r63>>>0>(r15+40|0)>>>0;r55=r56?r53:-1;if((r55|0)==-1){break}else{r59=r56?r63:r64,r60=r59>>2;r61=r55,r62=r61>>2;r2=1716;break}}}while(0);do{if(r2==1716){r64=HEAP32[1314276]+r59|0;HEAP32[1314276]=r64;if(r64>>>0>HEAP32[1314277]>>>0){HEAP32[1314277]=r64}r64=HEAP32[1314174],r50=r64>>2;L2398:do{if((r64|0)==0){r55=HEAP32[1314172];if((r55|0)==0|r61>>>0<r55>>>0){HEAP32[1314172]=r61}HEAP32[1314280]=r61;HEAP32[1314281]=r59;HEAP32[1314283]=0;HEAP32[1314177]=HEAP32[1311053];HEAP32[1314176]=-1;r55=0;while(1){r63=r55<<1;r56=(r63<<2)+5256712|0;HEAP32[(r63+3<<2)+5256712>>2]=r56;HEAP32[(r63+2<<2)+5256712>>2]=r56;r56=r55+1|0;if((r56|0)==32){break}else{r55=r56}}r55=r61+8|0;if((r55&7|0)==0){r65=0}else{r65=-r55&7}r55=r59-40-r65|0;HEAP32[1314174]=r61+r65|0;HEAP32[1314171]=r55;HEAP32[(r65+4>>2)+r62]=r55|1;HEAP32[(r59-36>>2)+r62]=40;HEAP32[1314175]=HEAP32[1311057]}else{r55=5257120,r56=r55>>2;while(1){r66=HEAP32[r56];r67=r55+4|0;r68=HEAP32[r67>>2];if((r61|0)==(r66+r68|0)){r2=1728;break}r63=HEAP32[r56+2];if((r63|0)==0){break}else{r55=r63,r56=r55>>2}}do{if(r2==1728){if((HEAP32[r56+3]&8|0)!=0){break}r55=r64;if(!(r55>>>0>=r66>>>0&r55>>>0<r61>>>0)){break}HEAP32[r67>>2]=r68+r59|0;r55=HEAP32[1314174];r63=HEAP32[1314171]+r59|0;r53=r55;r57=r55+8|0;if((r57&7|0)==0){r69=0}else{r69=-r57&7}r57=r63-r69|0;HEAP32[1314174]=r53+r69|0;HEAP32[1314171]=r57;HEAP32[r69+(r53+4)>>2]=r57|1;HEAP32[r63+(r53+4)>>2]=40;HEAP32[1314175]=HEAP32[1311057];break L2398}}while(0);if(r61>>>0<HEAP32[1314172]>>>0){HEAP32[1314172]=r61}r56=r61+r59|0;r53=5257120;while(1){r70=r53|0;if((HEAP32[r70>>2]|0)==(r56|0)){r2=1738;break}r63=HEAP32[r53+8>>2];if((r63|0)==0){break}else{r53=r63}}do{if(r2==1738){if((HEAP32[r53+12>>2]&8|0)!=0){break}HEAP32[r70>>2]=r61;r56=r53+4|0;HEAP32[r56>>2]=HEAP32[r56>>2]+r59|0;r56=r61+8|0;if((r56&7|0)==0){r71=0}else{r71=-r56&7}r56=r59+(r61+8)|0;if((r56&7|0)==0){r72=0,r73=r72>>2}else{r72=-r56&7,r73=r72>>2}r56=r61+r72+r59|0;r63=r56;r57=r71+r15|0,r55=r57>>2;r40=r61+r57|0;r57=r40;r39=r56-(r61+r71)-r15|0;HEAP32[(r71+4>>2)+r62]=r15|3;do{if((r63|0)==(HEAP32[1314174]|0)){r54=HEAP32[1314171]+r39|0;HEAP32[1314171]=r54;HEAP32[1314174]=r57;HEAP32[r55+(r62+1)]=r54|1}else{if((r63|0)==(HEAP32[1314173]|0)){r54=HEAP32[1314170]+r39|0;HEAP32[1314170]=r54;HEAP32[1314173]=r57;HEAP32[r55+(r62+1)]=r54|1;HEAP32[(r54>>2)+r62+r55]=r54;break}r54=r59+4|0;r58=HEAP32[(r54>>2)+r62+r73];if((r58&3|0)==1){r52=r58&-8;r51=r58>>>3;L2433:do{if(r58>>>0<256){r48=HEAP32[((r72|8)>>2)+r62+r60];r49=HEAP32[r73+(r62+(r60+3))];r5=(r51<<3)+5256712|0;do{if((r48|0)!=(r5|0)){if(r48>>>0<HEAP32[1314172]>>>0){_abort()}if((HEAP32[r48+12>>2]|0)==(r63|0)){break}_abort()}}while(0);if((r49|0)==(r48|0)){HEAP32[1314168]=HEAP32[1314168]&(1<<r51^-1);break}do{if((r49|0)==(r5|0)){r74=r49+8|0}else{if(r49>>>0<HEAP32[1314172]>>>0){_abort()}r47=r49+8|0;if((HEAP32[r47>>2]|0)==(r63|0)){r74=r47;break}_abort()}}while(0);HEAP32[r48+12>>2]=r49;HEAP32[r74>>2]=r48}else{r5=r56;r47=HEAP32[((r72|24)>>2)+r62+r60];r46=HEAP32[r73+(r62+(r60+3))];L2454:do{if((r46|0)==(r5|0)){r7=r72|16;r41=r61+r54+r7|0;r17=HEAP32[r41>>2];do{if((r17|0)==0){r42=r61+r7+r59|0;r43=HEAP32[r42>>2];if((r43|0)==0){r75=0,r76=r75>>2;break L2454}else{r77=r43;r78=r42;break}}else{r77=r17;r78=r41}}while(0);while(1){r41=r77+20|0;r17=HEAP32[r41>>2];if((r17|0)!=0){r77=r17;r78=r41;continue}r41=r77+16|0;r17=HEAP32[r41>>2];if((r17|0)==0){break}else{r77=r17;r78=r41}}if(r78>>>0<HEAP32[1314172]>>>0){_abort()}else{HEAP32[r78>>2]=0;r75=r77,r76=r75>>2;break}}else{r41=HEAP32[((r72|8)>>2)+r62+r60];if(r41>>>0<HEAP32[1314172]>>>0){_abort()}r17=r41+12|0;if((HEAP32[r17>>2]|0)!=(r5|0)){_abort()}r7=r46+8|0;if((HEAP32[r7>>2]|0)==(r5|0)){HEAP32[r17>>2]=r46;HEAP32[r7>>2]=r41;r75=r46,r76=r75>>2;break}else{_abort()}}}while(0);if((r47|0)==0){break}r46=r72+(r61+(r59+28))|0;r48=(HEAP32[r46>>2]<<2)+5256976|0;do{if((r5|0)==(HEAP32[r48>>2]|0)){HEAP32[r48>>2]=r75;if((r75|0)!=0){break}HEAP32[1314169]=HEAP32[1314169]&(1<<HEAP32[r46>>2]^-1);break L2433}else{if(r47>>>0<HEAP32[1314172]>>>0){_abort()}r49=r47+16|0;if((HEAP32[r49>>2]|0)==(r5|0)){HEAP32[r49>>2]=r75}else{HEAP32[r47+20>>2]=r75}if((r75|0)==0){break L2433}}}while(0);if(r75>>>0<HEAP32[1314172]>>>0){_abort()}HEAP32[r76+6]=r47;r5=r72|16;r46=HEAP32[(r5>>2)+r62+r60];do{if((r46|0)!=0){if(r46>>>0<HEAP32[1314172]>>>0){_abort()}else{HEAP32[r76+4]=r46;HEAP32[r46+24>>2]=r75;break}}}while(0);r46=HEAP32[(r54+r5>>2)+r62];if((r46|0)==0){break}if(r46>>>0<HEAP32[1314172]>>>0){_abort()}else{HEAP32[r76+5]=r46;HEAP32[r46+24>>2]=r75;break}}}while(0);r79=r61+(r52|r72)+r59|0;r80=r52+r39|0}else{r79=r63;r80=r39}r54=r79+4|0;HEAP32[r54>>2]=HEAP32[r54>>2]&-2;HEAP32[r55+(r62+1)]=r80|1;HEAP32[(r80>>2)+r62+r55]=r80;r54=r80>>>3;if(r80>>>0<256){r51=r54<<1;r58=(r51<<2)+5256712|0;r46=HEAP32[1314168];r47=1<<r54;do{if((r46&r47|0)==0){HEAP32[1314168]=r46|r47;r81=r58;r82=(r51+2<<2)+5256712|0}else{r54=(r51+2<<2)+5256712|0;r48=HEAP32[r54>>2];if(r48>>>0>=HEAP32[1314172]>>>0){r81=r48;r82=r54;break}_abort()}}while(0);HEAP32[r82>>2]=r57;HEAP32[r81+12>>2]=r57;HEAP32[r55+(r62+2)]=r81;HEAP32[r55+(r62+3)]=r58;break}r51=r40;r47=r80>>>8;do{if((r47|0)==0){r83=0}else{if(r80>>>0>16777215){r83=31;break}r46=(r47+1048320|0)>>>16&8;r52=r47<<r46;r54=(r52+520192|0)>>>16&4;r48=r52<<r54;r52=(r48+245760|0)>>>16&2;r49=14-(r54|r46|r52)+(r48<<r52>>>15)|0;r83=r80>>>((r49+7|0)>>>0)&1|r49<<1}}while(0);r47=(r83<<2)+5256976|0;HEAP32[r55+(r62+7)]=r83;HEAP32[r55+(r62+5)]=0;HEAP32[r55+(r62+4)]=0;r58=HEAP32[1314169];r49=1<<r83;if((r58&r49|0)==0){HEAP32[1314169]=r58|r49;HEAP32[r47>>2]=r51;HEAP32[r55+(r62+6)]=r47;HEAP32[r55+(r62+3)]=r51;HEAP32[r55+(r62+2)]=r51;break}if((r83|0)==31){r84=0}else{r84=25-(r83>>>1)|0}r49=r80<<r84;r58=HEAP32[r47>>2];while(1){if((HEAP32[r58+4>>2]&-8|0)==(r80|0)){break}r85=(r49>>>31<<2)+r58+16|0;r47=HEAP32[r85>>2];if((r47|0)==0){r2=1811;break}else{r49=r49<<1;r58=r47}}if(r2==1811){if(r85>>>0<HEAP32[1314172]>>>0){_abort()}else{HEAP32[r85>>2]=r51;HEAP32[r55+(r62+6)]=r58;HEAP32[r55+(r62+3)]=r51;HEAP32[r55+(r62+2)]=r51;break}}r49=r58+8|0;r47=HEAP32[r49>>2];r52=HEAP32[1314172];if(r58>>>0<r52>>>0){_abort()}if(r47>>>0<r52>>>0){_abort()}else{HEAP32[r47+12>>2]=r51;HEAP32[r49>>2]=r51;HEAP32[r55+(r62+2)]=r47;HEAP32[r55+(r62+3)]=r58;HEAP32[r55+(r62+6)]=0;break}}}while(0);r14=r61+(r71|8)|0;return r14}}while(0);r53=r64;r55=5257120,r40=r55>>2;while(1){r86=HEAP32[r40];if(r86>>>0<=r53>>>0){r87=HEAP32[r40+1];r88=r86+r87|0;if(r88>>>0>r53>>>0){break}}r55=HEAP32[r40+2],r40=r55>>2}r55=r86+(r87-39)|0;if((r55&7|0)==0){r89=0}else{r89=-r55&7}r55=r86+(r87-47)+r89|0;r40=r55>>>0<(r64+16|0)>>>0?r53:r55;r55=r40+8|0,r57=r55>>2;r39=r61+8|0;if((r39&7|0)==0){r90=0}else{r90=-r39&7}r39=r59-40-r90|0;HEAP32[1314174]=r61+r90|0;HEAP32[1314171]=r39;HEAP32[(r90+4>>2)+r62]=r39|1;HEAP32[(r59-36>>2)+r62]=40;HEAP32[1314175]=HEAP32[1311057];HEAP32[r40+4>>2]=27;HEAP32[r57]=HEAP32[1314280];HEAP32[r57+1]=HEAP32[1314281];HEAP32[r57+2]=HEAP32[1314282];HEAP32[r57+3]=HEAP32[1314283];HEAP32[1314280]=r61;HEAP32[1314281]=r59;HEAP32[1314283]=0;HEAP32[1314282]=r55;r55=r40+28|0;HEAP32[r55>>2]=7;L2552:do{if((r40+32|0)>>>0<r88>>>0){r57=r55;while(1){r39=r57+4|0;HEAP32[r39>>2]=7;if((r57+8|0)>>>0<r88>>>0){r57=r39}else{break L2552}}}}while(0);if((r40|0)==(r53|0)){break}r55=r40-r64|0;r57=r55+(r53+4)|0;HEAP32[r57>>2]=HEAP32[r57>>2]&-2;HEAP32[r50+1]=r55|1;HEAP32[r53+r55>>2]=r55;r57=r55>>>3;if(r55>>>0<256){r39=r57<<1;r63=(r39<<2)+5256712|0;r56=HEAP32[1314168];r47=1<<r57;do{if((r56&r47|0)==0){HEAP32[1314168]=r56|r47;r91=r63;r92=(r39+2<<2)+5256712|0}else{r57=(r39+2<<2)+5256712|0;r49=HEAP32[r57>>2];if(r49>>>0>=HEAP32[1314172]>>>0){r91=r49;r92=r57;break}_abort()}}while(0);HEAP32[r92>>2]=r64;HEAP32[r91+12>>2]=r64;HEAP32[r50+2]=r91;HEAP32[r50+3]=r63;break}r39=r64;r47=r55>>>8;do{if((r47|0)==0){r93=0}else{if(r55>>>0>16777215){r93=31;break}r56=(r47+1048320|0)>>>16&8;r53=r47<<r56;r40=(r53+520192|0)>>>16&4;r57=r53<<r40;r53=(r57+245760|0)>>>16&2;r49=14-(r40|r56|r53)+(r57<<r53>>>15)|0;r93=r55>>>((r49+7|0)>>>0)&1|r49<<1}}while(0);r47=(r93<<2)+5256976|0;HEAP32[r50+7]=r93;HEAP32[r50+5]=0;HEAP32[r50+4]=0;r63=HEAP32[1314169];r49=1<<r93;if((r63&r49|0)==0){HEAP32[1314169]=r63|r49;HEAP32[r47>>2]=r39;HEAP32[r50+6]=r47;HEAP32[r50+3]=r64;HEAP32[r50+2]=r64;break}if((r93|0)==31){r94=0}else{r94=25-(r93>>>1)|0}r49=r55<<r94;r63=HEAP32[r47>>2];while(1){if((HEAP32[r63+4>>2]&-8|0)==(r55|0)){break}r95=(r49>>>31<<2)+r63+16|0;r47=HEAP32[r95>>2];if((r47|0)==0){r2=1846;break}else{r49=r49<<1;r63=r47}}if(r2==1846){if(r95>>>0<HEAP32[1314172]>>>0){_abort()}else{HEAP32[r95>>2]=r39;HEAP32[r50+6]=r63;HEAP32[r50+3]=r64;HEAP32[r50+2]=r64;break}}r49=r63+8|0;r55=HEAP32[r49>>2];r47=HEAP32[1314172];if(r63>>>0<r47>>>0){_abort()}if(r55>>>0<r47>>>0){_abort()}else{HEAP32[r55+12>>2]=r39;HEAP32[r49>>2]=r39;HEAP32[r50+2]=r55;HEAP32[r50+3]=r63;HEAP32[r50+6]=0;break}}}while(0);r50=HEAP32[1314171];if(r50>>>0<=r15>>>0){break}r64=r50-r15|0;HEAP32[1314171]=r64;r50=HEAP32[1314174];r55=r50;HEAP32[1314174]=r55+r15|0;HEAP32[(r55+4>>2)+r16]=r64|1;HEAP32[r50+4>>2]=r15|3;r14=r50+8|0;return r14}}while(0);HEAP32[___errno_location()>>2]=12;r14=0;return r14}function _free(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36,r37,r38,r39,r40,r41,r42,r43,r44,r45,r46;r2=r1>>2;r3=0;if((r1|0)==0){return}r4=r1-8|0;r5=r4;r6=HEAP32[1314172];if(r4>>>0<r6>>>0){_abort()}r7=HEAP32[r1-4>>2];r8=r7&3;if((r8|0)==1){_abort()}r9=r7&-8,r10=r9>>2;r11=r1+(r9-8)|0;r12=r11;L2615:do{if((r7&1|0)==0){r13=HEAP32[r4>>2];if((r8|0)==0){return}r14=-8-r13|0,r15=r14>>2;r16=r1+r14|0;r17=r16;r18=r13+r9|0;if(r16>>>0<r6>>>0){_abort()}if((r17|0)==(HEAP32[1314173]|0)){r19=(r1+(r9-4)|0)>>2;if((HEAP32[r19]&3|0)!=3){r20=r17,r21=r20>>2;r22=r18;break}HEAP32[1314170]=r18;HEAP32[r19]=HEAP32[r19]&-2;HEAP32[r15+(r2+1)]=r18|1;HEAP32[r11>>2]=r18;return}r19=r13>>>3;if(r13>>>0<256){r13=HEAP32[r15+(r2+2)];r23=HEAP32[r15+(r2+3)];r24=(r19<<3)+5256712|0;do{if((r13|0)!=(r24|0)){if(r13>>>0<r6>>>0){_abort()}if((HEAP32[r13+12>>2]|0)==(r17|0)){break}_abort()}}while(0);if((r23|0)==(r13|0)){HEAP32[1314168]=HEAP32[1314168]&(1<<r19^-1);r20=r17,r21=r20>>2;r22=r18;break}do{if((r23|0)==(r24|0)){r25=r23+8|0}else{if(r23>>>0<r6>>>0){_abort()}r26=r23+8|0;if((HEAP32[r26>>2]|0)==(r17|0)){r25=r26;break}_abort()}}while(0);HEAP32[r13+12>>2]=r23;HEAP32[r25>>2]=r13;r20=r17,r21=r20>>2;r22=r18;break}r24=r16;r19=HEAP32[r15+(r2+6)];r26=HEAP32[r15+(r2+3)];L2649:do{if((r26|0)==(r24|0)){r27=r14+(r1+20)|0;r28=HEAP32[r27>>2];do{if((r28|0)==0){r29=r14+(r1+16)|0;r30=HEAP32[r29>>2];if((r30|0)==0){r31=0,r32=r31>>2;break L2649}else{r33=r30;r34=r29;break}}else{r33=r28;r34=r27}}while(0);while(1){r27=r33+20|0;r28=HEAP32[r27>>2];if((r28|0)!=0){r33=r28;r34=r27;continue}r27=r33+16|0;r28=HEAP32[r27>>2];if((r28|0)==0){break}else{r33=r28;r34=r27}}if(r34>>>0<r6>>>0){_abort()}else{HEAP32[r34>>2]=0;r31=r33,r32=r31>>2;break}}else{r27=HEAP32[r15+(r2+2)];if(r27>>>0<r6>>>0){_abort()}r28=r27+12|0;if((HEAP32[r28>>2]|0)!=(r24|0)){_abort()}r29=r26+8|0;if((HEAP32[r29>>2]|0)==(r24|0)){HEAP32[r28>>2]=r26;HEAP32[r29>>2]=r27;r31=r26,r32=r31>>2;break}else{_abort()}}}while(0);if((r19|0)==0){r20=r17,r21=r20>>2;r22=r18;break}r26=r14+(r1+28)|0;r16=(HEAP32[r26>>2]<<2)+5256976|0;do{if((r24|0)==(HEAP32[r16>>2]|0)){HEAP32[r16>>2]=r31;if((r31|0)!=0){break}HEAP32[1314169]=HEAP32[1314169]&(1<<HEAP32[r26>>2]^-1);r20=r17,r21=r20>>2;r22=r18;break L2615}else{if(r19>>>0<HEAP32[1314172]>>>0){_abort()}r13=r19+16|0;if((HEAP32[r13>>2]|0)==(r24|0)){HEAP32[r13>>2]=r31}else{HEAP32[r19+20>>2]=r31}if((r31|0)==0){r20=r17,r21=r20>>2;r22=r18;break L2615}}}while(0);if(r31>>>0<HEAP32[1314172]>>>0){_abort()}HEAP32[r32+6]=r19;r24=HEAP32[r15+(r2+4)];do{if((r24|0)!=0){if(r24>>>0<HEAP32[1314172]>>>0){_abort()}else{HEAP32[r32+4]=r24;HEAP32[r24+24>>2]=r31;break}}}while(0);r24=HEAP32[r15+(r2+5)];if((r24|0)==0){r20=r17,r21=r20>>2;r22=r18;break}if(r24>>>0<HEAP32[1314172]>>>0){_abort()}else{HEAP32[r32+5]=r24;HEAP32[r24+24>>2]=r31;r20=r17,r21=r20>>2;r22=r18;break}}else{r20=r5,r21=r20>>2;r22=r9}}while(0);r5=r20,r31=r5>>2;if(r5>>>0>=r11>>>0){_abort()}r5=r1+(r9-4)|0;r32=HEAP32[r5>>2];if((r32&1|0)==0){_abort()}do{if((r32&2|0)==0){if((r12|0)==(HEAP32[1314174]|0)){r6=HEAP32[1314171]+r22|0;HEAP32[1314171]=r6;HEAP32[1314174]=r20;HEAP32[r21+1]=r6|1;if((r20|0)==(HEAP32[1314173]|0)){HEAP32[1314173]=0;HEAP32[1314170]=0}if(r6>>>0<=HEAP32[1314175]>>>0){return}_sys_trim(0);return}if((r12|0)==(HEAP32[1314173]|0)){r6=HEAP32[1314170]+r22|0;HEAP32[1314170]=r6;HEAP32[1314173]=r20;HEAP32[r21+1]=r6|1;HEAP32[(r6>>2)+r31]=r6;return}r6=(r32&-8)+r22|0;r33=r32>>>3;L2721:do{if(r32>>>0<256){r34=HEAP32[r2+r10];r25=HEAP32[((r9|4)>>2)+r2];r8=(r33<<3)+5256712|0;do{if((r34|0)!=(r8|0)){if(r34>>>0<HEAP32[1314172]>>>0){_abort()}if((HEAP32[r34+12>>2]|0)==(r12|0)){break}_abort()}}while(0);if((r25|0)==(r34|0)){HEAP32[1314168]=HEAP32[1314168]&(1<<r33^-1);break}do{if((r25|0)==(r8|0)){r35=r25+8|0}else{if(r25>>>0<HEAP32[1314172]>>>0){_abort()}r4=r25+8|0;if((HEAP32[r4>>2]|0)==(r12|0)){r35=r4;break}_abort()}}while(0);HEAP32[r34+12>>2]=r25;HEAP32[r35>>2]=r34}else{r8=r11;r4=HEAP32[r10+(r2+4)];r7=HEAP32[((r9|4)>>2)+r2];L2723:do{if((r7|0)==(r8|0)){r24=r9+(r1+12)|0;r19=HEAP32[r24>>2];do{if((r19|0)==0){r26=r9+(r1+8)|0;r16=HEAP32[r26>>2];if((r16|0)==0){r36=0,r37=r36>>2;break L2723}else{r38=r16;r39=r26;break}}else{r38=r19;r39=r24}}while(0);while(1){r24=r38+20|0;r19=HEAP32[r24>>2];if((r19|0)!=0){r38=r19;r39=r24;continue}r24=r38+16|0;r19=HEAP32[r24>>2];if((r19|0)==0){break}else{r38=r19;r39=r24}}if(r39>>>0<HEAP32[1314172]>>>0){_abort()}else{HEAP32[r39>>2]=0;r36=r38,r37=r36>>2;break}}else{r24=HEAP32[r2+r10];if(r24>>>0<HEAP32[1314172]>>>0){_abort()}r19=r24+12|0;if((HEAP32[r19>>2]|0)!=(r8|0)){_abort()}r26=r7+8|0;if((HEAP32[r26>>2]|0)==(r8|0)){HEAP32[r19>>2]=r7;HEAP32[r26>>2]=r24;r36=r7,r37=r36>>2;break}else{_abort()}}}while(0);if((r4|0)==0){break}r7=r9+(r1+20)|0;r34=(HEAP32[r7>>2]<<2)+5256976|0;do{if((r8|0)==(HEAP32[r34>>2]|0)){HEAP32[r34>>2]=r36;if((r36|0)!=0){break}HEAP32[1314169]=HEAP32[1314169]&(1<<HEAP32[r7>>2]^-1);break L2721}else{if(r4>>>0<HEAP32[1314172]>>>0){_abort()}r25=r4+16|0;if((HEAP32[r25>>2]|0)==(r8|0)){HEAP32[r25>>2]=r36}else{HEAP32[r4+20>>2]=r36}if((r36|0)==0){break L2721}}}while(0);if(r36>>>0<HEAP32[1314172]>>>0){_abort()}HEAP32[r37+6]=r4;r8=HEAP32[r10+(r2+2)];do{if((r8|0)!=0){if(r8>>>0<HEAP32[1314172]>>>0){_abort()}else{HEAP32[r37+4]=r8;HEAP32[r8+24>>2]=r36;break}}}while(0);r8=HEAP32[r10+(r2+3)];if((r8|0)==0){break}if(r8>>>0<HEAP32[1314172]>>>0){_abort()}else{HEAP32[r37+5]=r8;HEAP32[r8+24>>2]=r36;break}}}while(0);HEAP32[r21+1]=r6|1;HEAP32[(r6>>2)+r31]=r6;if((r20|0)!=(HEAP32[1314173]|0)){r40=r6;break}HEAP32[1314170]=r6;return}else{HEAP32[r5>>2]=r32&-2;HEAP32[r21+1]=r22|1;HEAP32[(r22>>2)+r31]=r22;r40=r22}}while(0);r22=r40>>>3;if(r40>>>0<256){r31=r22<<1;r32=(r31<<2)+5256712|0;r5=HEAP32[1314168];r36=1<<r22;do{if((r5&r36|0)==0){HEAP32[1314168]=r5|r36;r41=r32;r42=(r31+2<<2)+5256712|0}else{r22=(r31+2<<2)+5256712|0;r37=HEAP32[r22>>2];if(r37>>>0>=HEAP32[1314172]>>>0){r41=r37;r42=r22;break}_abort()}}while(0);HEAP32[r42>>2]=r20;HEAP32[r41+12>>2]=r20;HEAP32[r21+2]=r41;HEAP32[r21+3]=r32;return}r32=r20;r41=r40>>>8;do{if((r41|0)==0){r43=0}else{if(r40>>>0>16777215){r43=31;break}r42=(r41+1048320|0)>>>16&8;r31=r41<<r42;r36=(r31+520192|0)>>>16&4;r5=r31<<r36;r31=(r5+245760|0)>>>16&2;r22=14-(r36|r42|r31)+(r5<<r31>>>15)|0;r43=r40>>>((r22+7|0)>>>0)&1|r22<<1}}while(0);r41=(r43<<2)+5256976|0;HEAP32[r21+7]=r43;HEAP32[r21+5]=0;HEAP32[r21+4]=0;r22=HEAP32[1314169];r31=1<<r43;do{if((r22&r31|0)==0){HEAP32[1314169]=r22|r31;HEAP32[r41>>2]=r32;HEAP32[r21+6]=r41;HEAP32[r21+3]=r20;HEAP32[r21+2]=r20}else{if((r43|0)==31){r44=0}else{r44=25-(r43>>>1)|0}r5=r40<<r44;r42=HEAP32[r41>>2];while(1){if((HEAP32[r42+4>>2]&-8|0)==(r40|0)){break}r45=(r5>>>31<<2)+r42+16|0;r36=HEAP32[r45>>2];if((r36|0)==0){r3=2025;break}else{r5=r5<<1;r42=r36}}if(r3==2025){if(r45>>>0<HEAP32[1314172]>>>0){_abort()}else{HEAP32[r45>>2]=r32;HEAP32[r21+6]=r42;HEAP32[r21+3]=r20;HEAP32[r21+2]=r20;break}}r5=r42+8|0;r6=HEAP32[r5>>2];r36=HEAP32[1314172];if(r42>>>0<r36>>>0){_abort()}if(r6>>>0<r36>>>0){_abort()}else{HEAP32[r6+12>>2]=r32;HEAP32[r5>>2]=r32;HEAP32[r21+2]=r6;HEAP32[r21+3]=r42;HEAP32[r21+6]=0;break}}}while(0);r21=HEAP32[1314176]-1|0;HEAP32[1314176]=r21;if((r21|0)==0){r46=5257128}else{return}while(1){r21=HEAP32[r46>>2];if((r21|0)==0){break}else{r46=r21+8|0}}HEAP32[1314176]=-1;return}function _sys_trim(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15;do{if((HEAP32[1311053]|0)==0){r2=_sysconf(8);if((r2-1&r2|0)==0){HEAP32[1311055]=r2;HEAP32[1311054]=r2;HEAP32[1311056]=-1;HEAP32[1311057]=2097152;HEAP32[1311058]=0;HEAP32[1314279]=0;HEAP32[1311053]=_time(0)&-16^1431655768;break}else{_abort()}}}while(0);if(r1>>>0>=4294967232){r3=0;r4=r3&1;return r4}r2=HEAP32[1314174];if((r2|0)==0){r3=0;r4=r3&1;return r4}r5=HEAP32[1314171];do{if(r5>>>0>(r1+40|0)>>>0){r6=HEAP32[1311055];r7=Math.imul(Math.floor(((-40-r1-1+r5+r6|0)>>>0)/(r6>>>0))-1|0,r6);r8=r2;r9=5257120,r10=r9>>2;while(1){r11=HEAP32[r10];if(r11>>>0<=r8>>>0){if((r11+HEAP32[r10+1]|0)>>>0>r8>>>0){r12=r9;break}}r11=HEAP32[r10+2];if((r11|0)==0){r12=0;break}else{r9=r11,r10=r9>>2}}if((HEAP32[r12+12>>2]&8|0)!=0){break}r9=_sbrk(0);r10=(r12+4|0)>>2;if((r9|0)!=(HEAP32[r12>>2]+HEAP32[r10]|0)){break}r8=_sbrk(-(r7>>>0>2147483646?-2147483648-r6|0:r7)|0);r11=_sbrk(0);if(!((r8|0)!=-1&r11>>>0<r9>>>0)){break}r8=r9-r11|0;if((r9|0)==(r11|0)){break}HEAP32[r10]=HEAP32[r10]-r8|0;HEAP32[1314276]=HEAP32[1314276]-r8|0;r10=HEAP32[1314174];r13=HEAP32[1314171]-r8|0;r8=r10;r14=r10+8|0;if((r14&7|0)==0){r15=0}else{r15=-r14&7}r14=r13-r15|0;HEAP32[1314174]=r8+r15|0;HEAP32[1314171]=r14;HEAP32[r15+(r8+4)>>2]=r14|1;HEAP32[r13+(r8+4)>>2]=40;HEAP32[1314175]=HEAP32[1311057];r3=(r9|0)!=(r11|0);r4=r3&1;return r4}}while(0);if(HEAP32[1314171]>>>0<=HEAP32[1314175]>>>0){r3=0;r4=r3&1;return r4}HEAP32[1314175]=-1;r3=0;r4=r3&1;return r4}
// EMSCRIPTEN_END_FUNCS
Module["_main"] = _main;
// Warning: printing of i64 values may be slightly rounded! No deep i64 math used, so precise i64 code not included
var i64Math = null;
// === Auto-generated postamble setup entry stuff ===
Module.callMain = function callMain(args) {
  assert(runDependencies == 0, 'cannot call main when async dependencies remain! (listen on __ATMAIN__)');
  assert(!Module['preRun'] || Module['preRun'].length == 0, 'cannot call main when preRun functions remain to be called');
  args = args || [];
  ensureInitRuntime();
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
  var ret;
  var initialStackTop = STACKTOP;
  try {
    ret = Module['_main'](argc, argv, 0);
  }
  catch(e) {
    if (e.name == 'ExitStatus') {
      return e.status;
    } else if (e == 'SimulateInfiniteLoop') {
      Module['noExitRuntime'] = true;
    } else {
      throw e;
    }
  } finally {
    STACKTOP = initialStackTop;
  }
  return ret;
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
    ensureInitRuntime();
    preMain();
    var ret = 0;
    calledRun = true;
    if (Module['_main'] && shouldRunNow) {
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
// shouldRunNow refers to calling main(), not run().
var shouldRunNow = true;
if (Module['noInitialRun']) {
  shouldRunNow = false;
}
run();
// {{POST_RUN_ADDITIONS}}
  // {{MODULE_ADDITIONS}}

    var tmp = new Uint8Array(++outputIndex);
    tmp.set(outputBytes.subarray(0, outputIndex));
    return tmp;
  },

  compress: function(bytes) {
    return this.run(bytes);
  },

  decompress: function(bytes) {
    return this.run(bytes, true);
  }
};
