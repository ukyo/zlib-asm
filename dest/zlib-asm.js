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
      if (!args.splice) args = Array.prototype.slice.call(args);
      args.splice(0, 0, ptr);
      return Module['dynCall_' + sig].apply(null, args);
    } else {
      return Module['dynCall_' + sig].call(null, ptr);
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
  makeBigInt: function (low,high,unsigned) { var ret = (unsigned ? ((+(((low)>>>(0))))+((+(((high)>>>(0))))*(+(4294967296)))) : ((+(((low)>>>(0))))+((+(((high)|(0))))*(+(4294967296))))); return ret; },
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
      case 'i64': (tempI64 = [value>>>0,Math.min(Math.floor((value)/(+(4294967296))), (+(4294967295)))>>>0],HEAP32[((ptr)>>2)]=tempI64[0],HEAP32[(((ptr)+(4))>>2)]=tempI64[1]); break;
      case 'float': HEAPF32[((ptr)>>2)]=value; break;
      case 'double': (HEAPF64[(tempDoublePtr)>>3]=value,HEAP32[((ptr)>>2)]=((HEAP32[((tempDoublePtr)>>2)])|0),HEAP32[(((ptr)+(4))>>2)]=((HEAP32[(((tempDoublePtr)+(4))>>2)])|0)); break;
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
      case 'double': return (HEAP32[((tempDoublePtr)>>2)]=HEAP32[((ptr)>>2)],HEAP32[(((tempDoublePtr)+(4))>>2)]=HEAP32[(((ptr)+(4))>>2)],(+(HEAPF64[(tempDoublePtr)>>3])));
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
  abort('Cannot enlarge memory arrays in asm.js. Either (1) compile with -s TOTAL_MEMORY=X with X higher than the current value, or (2) set Module.TOTAL_MEMORY before the program runs.');
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
  Module["_memset"] = _memset;var _llvm_memset_p0i8_i32=_memset;
  Module["_memcpy"] = _memcpy;var _llvm_memcpy_p0i8_p0i8_i32=_memcpy;
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
  Module["_strlen"] = _strlen;
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
var Math_min = Math.min;
function invoke_iiii(index,a1,a2,a3) {
  try {
    return Module.dynCall_iiii(index,a1,a2,a3);
  } catch(e) {
    asm.setThrew(1);
  }
}
function invoke_vi(index,a1) {
  try {
    Module.dynCall_vi(index,a1);
  } catch(e) {
    asm.setThrew(1);
  }
}
function invoke_vii(index,a1,a2) {
  try {
    Module.dynCall_vii(index,a1,a2);
  } catch(e) {
    asm.setThrew(1);
  }
}
function invoke_ii(index,a1) {
  try {
    return Module.dynCall_ii(index,a1);
  } catch(e) {
    asm.setThrew(1);
  }
}
function invoke_v(index) {
  try {
    Module.dynCall_v(index);
  } catch(e) {
    asm.setThrew(1);
  }
}
function invoke_iii(index,a1,a2) {
  try {
    return Module.dynCall_iii(index,a1,a2);
  } catch(e) {
    asm.setThrew(1);
  }
}
function asmPrintInt(x, y) {
  Module.print('int ' + x + ',' + y);// + ' ' + new Error().stack);
}
function asmPrintFloat(x, y) {
  Module.print('float ' + x + ',' + y);// + ' ' + new Error().stack);
}
// EMSCRIPTEN_START_ASM
var asm=(function(global,env,buffer){"use asm";var a=new global.Int8Array(buffer);var b=new global.Int16Array(buffer);var c=new global.Int32Array(buffer);var d=new global.Uint8Array(buffer);var e=new global.Uint16Array(buffer);var f=new global.Uint32Array(buffer);var g=new global.Float32Array(buffer);var h=new global.Float64Array(buffer);var i=env.STACKTOP|0;var j=env.STACK_MAX|0;var k=env.tempDoublePtr|0;var l=env.ABORT|0;var m=env._stdout|0;var n=env._stderr|0;var o=env._stdin|0;var p=+env.NaN;var q=+env.Infinity;var r=0;var s=0;var t=0,u=0,v=0,w=0,x=0.0,y=0,z=0,A=0,B=0.0;var C=0;var D=0;var E=0;var F=0;var G=0;var H=0;var I=0;var J=0;var K=0;var L=0;var M=global.Math.floor;var N=global.Math.abs;var O=global.Math.sqrt;var P=global.Math.pow;var Q=global.Math.cos;var R=global.Math.sin;var S=global.Math.tan;var T=global.Math.acos;var U=global.Math.asin;var V=global.Math.atan;var W=global.Math.atan2;var X=global.Math.exp;var Y=global.Math.log;var Z=global.Math.ceil;var _=global.Math.imul;var $=env.abort;var aa=env.assert;var ab=env.asmPrintInt;var ac=env.asmPrintFloat;var ad=env.copyTempDouble;var ae=env.copyTempFloat;var af=env.min;var ag=env.invoke_iiii;var ah=env.invoke_vi;var ai=env.invoke_vii;var aj=env.invoke_ii;var ak=env.invoke_v;var al=env.invoke_iii;var am=env._strncmp;var an=env._llvm_lifetime_end;var ao=env._sysconf;var ap=env._fread;var aq=env._abort;var ar=env._pread;var as=env._feof;var at=env.___setErrNo;var au=env._fwrite;var av=env._write;var aw=env._read;var ax=env._ferror;var ay=env.___assert_func;var az=env._pwrite;var aA=env._sbrk;var aB=env.___errno_location;var aC=env._llvm_lifetime_start;var aD=env._llvm_bswap_i32;var aE=env._time;var aF=env._strcmp;
// EMSCRIPTEN_START_FUNCS
function aM(a){a=a|0;var b=0;b=i;i=i+a|0;i=i+3>>2<<2;return b|0}function aN(){return i|0}function aO(a){a=a|0;i=a}function aP(a){a=a|0;r=a}function aQ(a){a=a|0;C=a}function aR(a){a=a|0;D=a}function aS(a){a=a|0;E=a}function aT(a){a=a|0;F=a}function aU(a){a=a|0;G=a}function aV(a){a=a|0;H=a}function aW(a){a=a|0;I=a}function aX(a){a=a|0;J=a}function aY(a){a=a|0;K=a}function aZ(a){a=a|0;L=a}function a_(a){a=a|0;var b=0;au(5255904,7,1,c[n>>2]|0);if((a|0)==(-1|0)){if((ax(c[o>>2]|0)|0)!=0){b=c[n>>2]|0;au(5255860,20,1,b|0)}if((ax(c[m>>2]|0)|0)==0){return}au(5255796,21,1,c[n>>2]|0);return}else if((a|0)==(-2|0)){au(5255688,26,1,c[n>>2]|0);return}else if((a|0)==(-3|0)){au(5255616,35,1,c[n>>2]|0);return}else if((a|0)==(-4|0)){au(5256384,14,1,c[n>>2]|0);return}else if((a|0)==(-6|0)){au(5256332,23,1,c[n>>2]|0);return}else{return}}function a$(a,b){a=a|0;b=b|0;var d=0,e=0,f=0;if((a|0)==1){d=a0(c[o>>2]|0,c[m>>2]|0,-1)|0;if((d|0)==0){e=0;return e|0}a_(d);e=d;return e|0}else if((a|0)==2){f=21}do{if((f|0)==21){if((aF(c[b+4>>2]|0,5256264)|0)!=0){break}a=a1(c[o>>2]|0,c[m>>2]|0)|0;if((a|0)==0){e=0;return e|0}a_(a);e=a;return e|0}}while(0);au(5256192,40,1,c[n>>2]|0);e=1;return e|0}function a0(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0;e=i;i=i+32824|0;f=e|0;c[f+32>>2]=0;g=f+36|0;c[g>>2]=0;h=f+40|0;c[h>>2]=0;j=f;k=a2(j,d,8,15,8,0,5256408,56)|0;if((k|0)!=0){l=k;i=e;return l|0}k=e+56|0;d=f+4|0;m=f|0;n=f+16|0;o=e+16440|0;p=f+12|0;L39:while(1){c[d>>2]=ap(k|0,1,16384,a|0)|0;if((ax(a|0)|0)!=0){q=34;break}r=(as(a|0)|0)!=0;s=r?4:0;c[m>>2]=k;while(1){c[n>>2]=16384;c[p>>2]=o;t=a6(j,s)|0;if((t|0)==-2){q=47;break L39}u=16384-(c[n>>2]|0)|0;if((au(o|0,1,u|0,b|0)|0)!=(u|0)){q=50;break L39}if((ax(b|0)|0)!=0){q=50;break L39}if((c[n>>2]|0)!=0){break}}if((c[d>>2]|0)!=0){q=63;break}if(r){q=65;break}}if((q|0)==34){d=f+28|0;n=c[d>>2]|0;if((n|0)==0){l=-1;i=e;return l|0}b=c[n+4>>2]|0;if(!((b|0)==666|(b|0)==113|(b|0)==103|(b|0)==91|(b|0)==73|(b|0)==69|(b|0)==42)){l=-1;i=e;return l|0}b=c[n+8>>2]|0;if((b|0)==0){v=n}else{aI[c[g>>2]&15](c[h>>2]|0,b);v=c[d>>2]|0}b=c[v+68>>2]|0;if((b|0)==0){w=v}else{aI[c[g>>2]&15](c[h>>2]|0,b);w=c[d>>2]|0}b=c[w+64>>2]|0;if((b|0)==0){x=w}else{aI[c[g>>2]&15](c[h>>2]|0,b);x=c[d>>2]|0}b=c[x+56>>2]|0;if((b|0)==0){y=x}else{aI[c[g>>2]&15](c[h>>2]|0,b);y=c[d>>2]|0}aI[c[g>>2]&15](c[h>>2]|0,y);c[d>>2]=0;l=-1;i=e;return l|0}else if((q|0)==47){ay(5256400,68,5257660,5256072)}else if((q|0)==50){d=f+28|0;y=c[d>>2]|0;if((y|0)==0){l=-1;i=e;return l|0}b=c[y+4>>2]|0;if(!((b|0)==666|(b|0)==113|(b|0)==103|(b|0)==91|(b|0)==73|(b|0)==69|(b|0)==42)){l=-1;i=e;return l|0}b=c[y+8>>2]|0;if((b|0)==0){z=y}else{aI[c[g>>2]&15](c[h>>2]|0,b);z=c[d>>2]|0}b=c[z+68>>2]|0;if((b|0)==0){A=z}else{aI[c[g>>2]&15](c[h>>2]|0,b);A=c[d>>2]|0}b=c[A+64>>2]|0;if((b|0)==0){B=A}else{aI[c[g>>2]&15](c[h>>2]|0,b);B=c[d>>2]|0}b=c[B+56>>2]|0;if((b|0)==0){C=B}else{aI[c[g>>2]&15](c[h>>2]|0,b);C=c[d>>2]|0}aI[c[g>>2]&15](c[h>>2]|0,C);c[d>>2]=0;l=-1;i=e;return l|0}else if((q|0)==63){ay(5256400,75,5257660,5255996)}else if((q|0)==65){if((t|0)!=1){ay(5256400,79,5257660,5255956)}t=f+28|0;f=c[t>>2]|0;if((f|0)==0){l=0;i=e;return l|0}q=c[f+4>>2]|0;if(!((q|0)==666|(q|0)==113|(q|0)==103|(q|0)==91|(q|0)==73|(q|0)==69|(q|0)==42)){l=0;i=e;return l|0}q=c[f+8>>2]|0;if((q|0)==0){D=f}else{aI[c[g>>2]&15](c[h>>2]|0,q);D=c[t>>2]|0}q=c[D+68>>2]|0;if((q|0)==0){E=D}else{aI[c[g>>2]&15](c[h>>2]|0,q);E=c[t>>2]|0}q=c[E+64>>2]|0;if((q|0)==0){F=E}else{aI[c[g>>2]&15](c[h>>2]|0,q);F=c[t>>2]|0}q=c[F+56>>2]|0;if((q|0)==0){G=F}else{aI[c[g>>2]&15](c[h>>2]|0,q);G=c[t>>2]|0}aI[c[g>>2]&15](c[h>>2]|0,G);c[t>>2]=0;l=0;i=e;return l|0}return 0}function a1(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0;d=i;i=i+32824|0;e=d|0;f=d+56|0;g=d+16440|0;h=e+36|0;j=e+40|0;k=e+4|0;c[k>>2]=0;l=e|0;c[l>>2]=0;m=e+24|0;c[m>>2]=0;c[e+32>>2]=4;c[j>>2]=0;c[h>>2]=10;n=bq(7116)|0;if((n|0)==0){o=-4;i=d;return o|0}p=e+28|0;c[p>>2]=n;c[n+52>>2]=0;q=c[p>>2]|0;do{if((q|0)!=0){r=q+52|0;s=c[r>>2]|0;t=q+36|0;do{if((s|0)!=0){if((c[t>>2]|0)==15){break}aI[c[h>>2]&15](c[j>>2]|0,s);c[r>>2]=0}}while(0);c[q+8>>2]=1;c[t>>2]=15;r=c[p>>2]|0;if((r|0)==0){break}c[r+40>>2]=0;c[r+44>>2]=0;c[r+48>>2]=0;r=c[p>>2]|0;if((r|0)==0){break}c[r+28>>2]=0;c[e+20>>2]=0;c[e+8>>2]=0;c[m>>2]=0;s=c[r+8>>2]|0;if((s|0)!=0){c[e+48>>2]=s&1}c[r>>2]=0;c[r+4>>2]=0;c[r+12>>2]=0;c[r+20>>2]=32768;c[r+32>>2]=0;c[r+56>>2]=0;c[r+60>>2]=0;s=r+1328|0;c[r+108>>2]=s;c[r+80>>2]=s;c[r+76>>2]=s;c[r+7104>>2]=1;c[r+7108>>2]=-1;r=f|0;s=e+16|0;u=g|0;v=e+12|0;w=0;L130:while(1){x=ap(r|0,1,16384,a|0)|0;c[k>>2]=x;if((ax(a|0)|0)!=0){y=101;break}if((x|0)==0){z=w;y=125;break}c[l>>2]=r;while(1){c[s>>2]=16384;c[v>>2]=u;A=bb(e,0)|0;if((A|0)==(-2|0)){y=109;break L130}else if((A|0)==2){y=110;break L130}else if((A|0)==(-3|0)|(A|0)==(-4|0)){B=A;break L130}x=16384-(c[s>>2]|0)|0;if((au(u|0,1,x|0,b|0)|0)!=(x|0)){y=118;break L130}if((ax(b|0)|0)!=0){y=118;break L130}if((c[s>>2]|0)!=0){break}}if((A|0)==1){z=1;y=125;break}else{w=A}}if((y|0)==118){w=c[p>>2]|0;if((w|0)==0){o=-1;i=d;return o|0}s=c[h>>2]|0;if((s|0)==0){o=-1;i=d;return o|0}u=c[w+52>>2]|0;if((u|0)==0){C=s;D=w}else{aI[s&15](c[j>>2]|0,u);C=c[h>>2]|0;D=c[p>>2]|0}aI[C&15](c[j>>2]|0,D);c[p>>2]=0;o=-1;i=d;return o|0}else if((y|0)==101){u=c[p>>2]|0;if((u|0)==0){o=-1;i=d;return o|0}s=c[h>>2]|0;if((s|0)==0){o=-1;i=d;return o|0}w=c[u+52>>2]|0;if((w|0)==0){E=s;F=u}else{aI[s&15](c[j>>2]|0,w);E=c[h>>2]|0;F=c[p>>2]|0}aI[E&15](c[j>>2]|0,F);c[p>>2]=0;o=-1;i=d;return o|0}else if((y|0)==109){ay(5256400,126,5257656,5256072)}else if((y|0)==110){B=-3}else if((y|0)==125){w=c[p>>2]|0;do{if((w|0)!=0){s=c[h>>2]|0;if((s|0)==0){break}u=c[w+52>>2]|0;if((u|0)==0){G=s;H=w}else{aI[s&15](c[j>>2]|0,u);G=c[h>>2]|0;H=c[p>>2]|0}aI[G&15](c[j>>2]|0,H);c[p>>2]=0}}while(0);o=(z|0)==1?0:-3;i=d;return o|0}w=c[p>>2]|0;if((w|0)==0){o=B;i=d;return o|0}u=c[h>>2]|0;if((u|0)==0){o=B;i=d;return o|0}s=c[w+52>>2]|0;if((s|0)==0){I=u;J=w}else{aI[u&15](c[j>>2]|0,s);I=c[h>>2]|0;J=c[p>>2]|0}aI[I&15](c[j>>2]|0,J);c[p>>2]=0;o=B;i=d;return o|0}}while(0);aI[c[h>>2]&15](c[j>>2]|0,n);c[p>>2]=0;o=-2;i=d;return o|0}function a2(b,d,e,f,g,h,i,j){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;i=i|0;j=j|0;var k=0,l=0,m=0,n=0,o=0,p=0;if((i|0)==0){k=-6;return k|0}if(!(a[i]<<24>>24==49&(j|0)==56)){k=-6;return k|0}if((b|0)==0){k=-2;return k|0}j=b+24|0;c[j>>2]=0;i=b+32|0;l=c[i>>2]|0;if((l|0)==0){c[i>>2]=4;c[b+40>>2]=0;m=4}else{m=l}l=b+36|0;if((c[l>>2]|0)==0){c[l>>2]=10}l=(d|0)==-1?6:d;if((f|0)<0){n=0;o=-f|0}else{d=(f|0)>15;n=d?2:1;o=d?f-16|0:f}if(!((g-1|0)>>>0<9&(e|0)==8)){k=-2;return k|0}if((o-8|0)>>>0>7|l>>>0>9|h>>>0>4){k=-2;return k|0}e=(o|0)==8?9:o;o=b+40|0;f=aG[m&15](c[o>>2]|0,1,5828)|0;if((f|0)==0){k=-4;return k|0}c[b+28>>2]=f;c[f>>2]=b;c[f+24>>2]=n;c[f+28>>2]=0;c[f+48>>2]=e;n=1<<e;e=f+44|0;c[e>>2]=n;c[f+52>>2]=n-1|0;m=g+7|0;c[f+80>>2]=m;d=1<<m;m=f+76|0;c[m>>2]=d;c[f+84>>2]=d-1|0;c[f+88>>2]=((g+9|0)>>>0)/3>>>0;d=f+56|0;c[d>>2]=aG[c[i>>2]&15](c[o>>2]|0,n,2)|0;n=f+64|0;c[n>>2]=aG[c[i>>2]&15](c[o>>2]|0,c[e>>2]|0,2)|0;e=f+68|0;c[e>>2]=aG[c[i>>2]&15](c[o>>2]|0,c[m>>2]|0,2)|0;c[f+5824>>2]=0;m=1<<g+6;g=f+5788|0;c[g>>2]=m;p=aG[c[i>>2]&15](c[o>>2]|0,m,4)|0;m=p;c[f+8>>2]=p;o=c[g>>2]|0;c[f+12>>2]=o<<2;do{if((c[d>>2]|0)!=0){if((c[n>>2]|0)==0){break}if((c[e>>2]|0)==0|(p|0)==0){break}c[f+5796>>2]=m+(o>>>1<<1)|0;c[f+5784>>2]=p+(o*3&-1)|0;c[f+132>>2]=l;c[f+136>>2]=h;a[f+36|0]=8;k=a4(b)|0;return k|0}}while(0);c[f+4>>2]=666;c[j>>2]=5255820;a3(b);k=-4;return k|0}function a3(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0;if((a|0)==0){b=-2;return b|0}d=a+28|0;e=c[d>>2]|0;if((e|0)==0){b=-2;return b|0}f=c[e+4>>2]|0;if(!((f|0)==666|(f|0)==113|(f|0)==103|(f|0)==91|(f|0)==73|(f|0)==69|(f|0)==42)){b=-2;return b|0}g=c[e+8>>2]|0;if((g|0)==0){h=e}else{aI[c[a+36>>2]&15](c[a+40>>2]|0,g);h=c[d>>2]|0}g=c[h+68>>2]|0;if((g|0)==0){i=h}else{aI[c[a+36>>2]&15](c[a+40>>2]|0,g);i=c[d>>2]|0}g=c[i+64>>2]|0;if((g|0)==0){j=i}else{aI[c[a+36>>2]&15](c[a+40>>2]|0,g);j=c[d>>2]|0}g=c[j+56>>2]|0;i=a+36|0;if((g|0)==0){k=j;l=a+40|0}else{j=a+40|0;aI[c[i>>2]&15](c[j>>2]|0,g);k=c[d>>2]|0;l=j}aI[c[i>>2]&15](c[l>>2]|0,k);c[d>>2]=0;b=(f|0)==113?-3:0;return b|0}function a4(a){a=a|0;var d=0,f=0,g=0,h=0,i=0,j=0,k=0;if((a|0)==0){d=-2;return d|0}f=a+28|0;g=c[f>>2]|0;if((g|0)==0){d=-2;return d|0}if((c[a+32>>2]|0)==0){d=-2;return d|0}if((c[a+36>>2]|0)==0){d=-2;return d|0}c[a+20>>2]=0;c[a+8>>2]=0;c[a+24>>2]=0;c[a+44>>2]=2;c[g+20>>2]=0;c[g+16>>2]=c[g+8>>2]|0;h=g+24|0;i=c[h>>2]|0;if((i|0)<0){j=-i|0;c[h>>2]=j;k=j}else{k=i}c[g+4>>2]=(k|0)!=0?42:113;c[a+48>>2]=(k|0)!=2&1;c[g+40>>2]=0;c[g+2840>>2]=g+148|0;c[g+2848>>2]=5244032;c[g+2852>>2]=g+2440|0;c[g+2860>>2]=5244172;c[g+2864>>2]=g+2684|0;c[g+2872>>2]=5244192;b[g+5816>>1]=0;c[g+5820>>2]=0;bc(g);g=c[f>>2]|0;c[g+60>>2]=c[g+44>>2]<<1;f=g+76|0;k=g+68|0;b[(c[k>>2]|0)+((c[f>>2]|0)-1<<1)>>1]=0;bt(c[k>>2]|0,0,(c[f>>2]<<1)-2|0);f=c[g+132>>2]|0;c[g+128>>2]=e[5255214+(f*12&-1)>>1]|0;c[g+140>>2]=e[5255212+(f*12&-1)>>1]|0;c[g+144>>2]=e[5255216+(f*12&-1)>>1]|0;c[g+124>>2]=e[5255218+(f*12&-1)>>1]|0;c[g+108>>2]=0;c[g+92>>2]=0;c[g+116>>2]=0;c[g+5812>>2]=0;c[g+120>>2]=2;c[g+96>>2]=2;c[g+104>>2]=0;c[g+72>>2]=0;d=0;return d|0}function a5(a){a=a|0;var f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0;f=a+44|0;g=c[f>>2]|0;h=a+60|0;i=a+116|0;j=a+108|0;k=g-262|0;l=a|0;m=a+56|0;n=a+5812|0;o=a+72|0;p=a+88|0;q=a+84|0;r=a+68|0;s=a+52|0;t=a+64|0;u=a+112|0;v=a+92|0;w=a+76|0;x=c[i>>2]|0;y=g;while(1){z=c[j>>2]|0;A=((c[h>>2]|0)-x|0)-z|0;if(z>>>0<(k+y|0)>>>0){B=A}else{z=c[m>>2]|0;bu(z|0,z+g|0,g|0);c[u>>2]=(c[u>>2]|0)-g|0;c[j>>2]=(c[j>>2]|0)-g|0;c[v>>2]=(c[v>>2]|0)-g|0;z=c[w>>2]|0;C=z;D=(c[r>>2]|0)+(z<<1)|0;while(1){z=D-2|0;E=e[z>>1]|0;if(E>>>0<g>>>0){F=0}else{F=E-g&65535}b[z>>1]=F;E=C-1|0;if((E|0)==0){break}else{C=E;D=z}}D=g;C=(c[t>>2]|0)+(g<<1)|0;while(1){z=C-2|0;E=e[z>>1]|0;if(E>>>0<g>>>0){G=0}else{G=E-g&65535}b[z>>1]=G;E=D-1|0;if((E|0)==0){break}else{D=E;C=z}}B=A+g|0}C=c[l>>2]|0;D=C+4|0;z=c[D>>2]|0;if((z|0)==0){break}E=c[i>>2]|0;H=(c[m>>2]|0)+(E+(c[j>>2]|0)|0)|0;I=z>>>0>B>>>0?B:z;if((I|0)==0){J=0;K=E}else{c[D>>2]=z-I|0;z=C|0;bu(H|0,c[z>>2]|0,I|0);D=c[(c[C+28>>2]|0)+24>>2]|0;if((D|0)==1){E=C+48|0;c[E>>2]=bn(c[E>>2]|0,H,I)|0}else if((D|0)==2){D=C+48|0;c[D>>2]=bo(c[D>>2]|0,H,I)|0}c[z>>2]=(c[z>>2]|0)+I|0;z=C+8|0;c[z>>2]=(c[z>>2]|0)+I|0;J=I;K=c[i>>2]|0}I=K+J|0;c[i>>2]=I;z=c[n>>2]|0;L290:do{if((I+z|0)>>>0>2){C=(c[j>>2]|0)-z|0;H=c[m>>2]|0;D=d[H+C|0]|0;c[o>>2]=D;c[o>>2]=((d[H+(C+1|0)|0]|0)^D<<c[p>>2])&c[q>>2];D=C;C=z;H=I;while(1){if((C|0)==0){L=H;break L290}E=((d[(c[m>>2]|0)+(D+2|0)|0]|0)^c[o>>2]<<c[p>>2])&c[q>>2];c[o>>2]=E;b[(c[t>>2]|0)+((c[s>>2]&D)<<1)>>1]=b[(c[r>>2]|0)+(E<<1)>>1]|0;b[(c[r>>2]|0)+(c[o>>2]<<1)>>1]=D&65535;E=(c[n>>2]|0)-1|0;c[n>>2]=E;M=c[i>>2]|0;if((M+E|0)>>>0<3){L=M;break L290}else{D=D+1|0;C=E;H=M}}}else{L=I}}while(0);if(L>>>0>=262){break}if((c[(c[l>>2]|0)+4>>2]|0)==0){break}x=L;y=c[f>>2]|0}f=a+5824|0;a=c[f>>2]|0;y=c[h>>2]|0;if(a>>>0>=y>>>0){return}h=(c[i>>2]|0)+(c[j>>2]|0)|0;if(a>>>0<h>>>0){j=y-h|0;i=j>>>0>258?258:j;bt((c[m>>2]|0)+h|0,0,i|0);c[f>>2]=i+h|0;return}i=h+258|0;if(a>>>0>=i>>>0){return}h=i-a|0;i=y-a|0;y=h>>>0>i>>>0?i:h;bt((c[m>>2]|0)+a|0,0,y|0);c[f>>2]=(c[f>>2]|0)+y|0;return}function a6(f,g){f=f|0;g=g|0;var h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,$=0,aa=0,ab=0,ac=0,ad=0,ae=0,af=0,ag=0,ah=0,ai=0,aj=0,ak=0,al=0,am=0,an=0,ao=0,ap=0,aq=0,ar=0,as=0,at=0,au=0,av=0,aw=0,ax=0,ay=0,az=0,aA=0,aB=0,aC=0,aD=0,aE=0,aF=0,aG=0,aH=0,aI=0,aJ=0,aK=0,aM=0,aN=0,aO=0,aP=0,aQ=0,aR=0,aS=0,aT=0,aU=0;if((f|0)==0){h=-2;return h|0}i=f+28|0;j=c[i>>2]|0;if((j|0)==0|g>>>0>5){h=-2;return h|0}k=f+12|0;do{if((c[k>>2]|0)!=0){if((c[f>>2]|0)==0){if((c[f+4>>2]|0)!=0){break}}l=j+4|0;m=c[l>>2]|0;n=(g|0)==4;if(!((m|0)!=666|n)){break}o=f+16|0;if((c[o>>2]|0)==0){c[f+24>>2]=5255716;h=-5;return h|0}p=j|0;c[p>>2]=f;q=j+40|0;r=c[q>>2]|0;c[q>>2]=g;do{if((m|0)==42){if((c[j+24>>2]|0)!=2){s=(c[j+48>>2]<<12)-30720|0;do{if((c[j+136>>2]|0)>1){t=0}else{u=c[j+132>>2]|0;if((u|0)<2){t=0;break}if((u|0)<6){t=64;break}t=(u|0)==6?128:192}}while(0);u=t|s;v=j+108|0;w=(c[v>>2]|0)==0?u:u|32;u=(w|(w>>>0)%31)^31;c[l>>2]=113;w=j+20|0;x=c[w>>2]|0;c[w>>2]=x+1|0;y=j+8|0;a[(c[y>>2]|0)+x|0]=u>>>8&255;x=c[w>>2]|0;c[w>>2]=x+1|0;a[(c[y>>2]|0)+x|0]=u&255;u=f+48|0;if((c[v>>2]|0)!=0){v=c[u>>2]|0;x=c[w>>2]|0;c[w>>2]=x+1|0;a[(c[y>>2]|0)+x|0]=v>>>24&255;x=c[w>>2]|0;c[w>>2]=x+1|0;a[(c[y>>2]|0)+x|0]=v>>>16&255;v=c[u>>2]|0;x=c[w>>2]|0;c[w>>2]=x+1|0;a[(c[y>>2]|0)+x|0]=v>>>8&255;x=c[w>>2]|0;c[w>>2]=x+1|0;a[(c[y>>2]|0)+x|0]=v&255}c[u>>2]=1;z=c[l>>2]|0;A=267;break}u=f+48|0;c[u>>2]=0;v=j+20|0;x=c[v>>2]|0;c[v>>2]=x+1|0;y=j+8|0;a[(c[y>>2]|0)+x|0]=31;x=c[v>>2]|0;c[v>>2]=x+1|0;a[(c[y>>2]|0)+x|0]=-117;x=c[v>>2]|0;c[v>>2]=x+1|0;a[(c[y>>2]|0)+x|0]=8;x=j+28|0;w=c[x>>2]|0;if((w|0)==0){B=c[v>>2]|0;c[v>>2]=B+1|0;a[(c[y>>2]|0)+B|0]=0;B=c[v>>2]|0;c[v>>2]=B+1|0;a[(c[y>>2]|0)+B|0]=0;B=c[v>>2]|0;c[v>>2]=B+1|0;a[(c[y>>2]|0)+B|0]=0;B=c[v>>2]|0;c[v>>2]=B+1|0;a[(c[y>>2]|0)+B|0]=0;B=c[v>>2]|0;c[v>>2]=B+1|0;a[(c[y>>2]|0)+B|0]=0;B=c[j+132>>2]|0;do{if((B|0)==9){C=2}else{if((c[j+136>>2]|0)>1){C=4;break}C=(B|0)<2?4:0}}while(0);B=c[v>>2]|0;c[v>>2]=B+1|0;a[(c[y>>2]|0)+B|0]=C;B=c[v>>2]|0;c[v>>2]=B+1|0;a[(c[y>>2]|0)+B|0]=3;c[l>>2]=113;break}B=((c[w+44>>2]|0)!=0?2:0)|(c[w>>2]|0)!=0&1|((c[w+16>>2]|0)==0?0:4)|((c[w+28>>2]|0)==0?0:8)|((c[w+36>>2]|0)==0?0:16);s=c[v>>2]|0;c[v>>2]=s+1|0;a[(c[y>>2]|0)+s|0]=B;B=c[(c[x>>2]|0)+4>>2]&255;s=c[v>>2]|0;c[v>>2]=s+1|0;a[(c[y>>2]|0)+s|0]=B;B=(c[(c[x>>2]|0)+4>>2]|0)>>>8&255;s=c[v>>2]|0;c[v>>2]=s+1|0;a[(c[y>>2]|0)+s|0]=B;B=(c[(c[x>>2]|0)+4>>2]|0)>>>16&255;s=c[v>>2]|0;c[v>>2]=s+1|0;a[(c[y>>2]|0)+s|0]=B;B=(c[(c[x>>2]|0)+4>>2]|0)>>>24&255;s=c[v>>2]|0;c[v>>2]=s+1|0;a[(c[y>>2]|0)+s|0]=B;B=c[j+132>>2]|0;do{if((B|0)==9){D=2}else{if((c[j+136>>2]|0)>1){D=4;break}D=(B|0)<2?4:0}}while(0);B=c[v>>2]|0;c[v>>2]=B+1|0;a[(c[y>>2]|0)+B|0]=D;B=c[(c[x>>2]|0)+12>>2]&255;w=c[v>>2]|0;c[v>>2]=w+1|0;a[(c[y>>2]|0)+w|0]=B;B=c[x>>2]|0;if((c[B+16>>2]|0)==0){E=B}else{w=c[B+20>>2]&255;B=c[v>>2]|0;c[v>>2]=B+1|0;a[(c[y>>2]|0)+B|0]=w;w=(c[(c[x>>2]|0)+20>>2]|0)>>>8&255;B=c[v>>2]|0;c[v>>2]=B+1|0;a[(c[y>>2]|0)+B|0]=w;E=c[x>>2]|0}if((c[E+44>>2]|0)!=0){c[u>>2]=bo(c[u>>2]|0,c[y>>2]|0,c[v>>2]|0)|0}c[j+32>>2]=0;c[l>>2]=69;F=x;A=269;break}else{z=m;A=267}}while(0);do{if((A|0)==267){if((z|0)!=69){G=z;A=295;break}F=j+28|0;A=269;break}}while(0);do{if((A|0)==269){m=c[F>>2]|0;if((c[m+16>>2]|0)==0){c[l>>2]=73;H=m;A=297;break}w=j+20|0;B=c[w>>2]|0;s=j+32|0;I=c[s>>2]|0;L365:do{if(I>>>0<(c[m+20>>2]&65535)>>>0){J=j+12|0;K=f+48|0;L=j+8|0;M=f+20|0;N=B;O=m;P=B;Q=I;while(1){if((P|0)==(c[J>>2]|0)){if((c[O+44>>2]|0)!=0&P>>>0>N>>>0){c[K>>2]=bo(c[K>>2]|0,(c[L>>2]|0)+N|0,P-N|0)|0}R=c[i>>2]|0;S=R+5820|0;T=c[S>>2]|0;do{if((T|0)==16){U=R+5816|0;V=b[U>>1]&255;W=R+20|0;X=c[W>>2]|0;c[W>>2]=X+1|0;Y=R+8|0;a[(c[Y>>2]|0)+X|0]=V;V=(e[U>>1]|0)>>>8&255;X=c[W>>2]|0;c[W>>2]=X+1|0;a[(c[Y>>2]|0)+X|0]=V;b[U>>1]=0;c[S>>2]=0;Z=W}else{if((T|0)>7){W=R+5816|0;U=b[W>>1]&255;V=R+20|0;X=c[V>>2]|0;c[V>>2]=X+1|0;a[(c[R+8>>2]|0)+X|0]=U;b[W>>1]=(e[W>>1]|0)>>>8;c[S>>2]=(c[S>>2]|0)-8|0;Z=V;break}else{Z=R+20|0;break}}}while(0);S=c[Z>>2]|0;T=c[o>>2]|0;V=S>>>0>T>>>0?T:S;do{if((V|0)!=0){S=R+16|0;bu(c[k>>2]|0,c[S>>2]|0,V|0);c[k>>2]=(c[k>>2]|0)+V|0;c[S>>2]=(c[S>>2]|0)+V|0;c[M>>2]=(c[M>>2]|0)+V|0;c[o>>2]=(c[o>>2]|0)-V|0;T=c[Z>>2]|0;c[Z>>2]=T-V|0;if((T|0)!=(V|0)){break}c[S>>2]=c[R+8>>2]|0}}while(0);_=c[w>>2]|0;if((_|0)==(c[J>>2]|0)){break}$=_;aa=_;ab=c[s>>2]|0;ac=c[F>>2]|0}else{$=N;aa=P;ab=Q;ac=O}R=a[(c[ac+16>>2]|0)+ab|0]|0;c[w>>2]=aa+1|0;a[(c[L>>2]|0)+aa|0]=R;R=(c[s>>2]|0)+1|0;c[s>>2]=R;V=c[F>>2]|0;if(R>>>0>=(c[V+20>>2]&65535)>>>0){ad=$;ae=V;break L365}N=$;O=V;P=c[w>>2]|0;Q=R}ad=_;ae=c[F>>2]|0}else{ad=B;ae=m}}while(0);do{if((c[ae+44>>2]|0)==0){af=ae}else{m=c[w>>2]|0;if(m>>>0<=ad>>>0){af=ae;break}B=f+48|0;c[B>>2]=bo(c[B>>2]|0,(c[j+8>>2]|0)+ad|0,m-ad|0)|0;af=c[F>>2]|0}}while(0);if((c[s>>2]|0)==(c[af+20>>2]|0)){c[s>>2]=0;c[l>>2]=73;H=af;A=297;break}else{G=c[l>>2]|0;A=295;break}}}while(0);do{if((A|0)==295){if((G|0)!=73){ag=G;A=321;break}H=c[j+28>>2]|0;A=297;break}}while(0);do{if((A|0)==297){w=j+28|0;if((c[H+28>>2]|0)==0){c[l>>2]=91;ah=w;A=323;break}m=j+20|0;B=c[m>>2]|0;I=j+12|0;x=f+48|0;v=j+8|0;y=f+20|0;u=j+32|0;Q=B;P=B;while(1){if((P|0)==(c[I>>2]|0)){if((c[(c[w>>2]|0)+44>>2]|0)!=0&P>>>0>Q>>>0){c[x>>2]=bo(c[x>>2]|0,(c[v>>2]|0)+Q|0,P-Q|0)|0}B=c[i>>2]|0;O=B+5820|0;N=c[O>>2]|0;do{if((N|0)==16){L=B+5816|0;J=b[L>>1]&255;M=B+20|0;K=c[M>>2]|0;c[M>>2]=K+1|0;R=B+8|0;a[(c[R>>2]|0)+K|0]=J;J=(e[L>>1]|0)>>>8&255;K=c[M>>2]|0;c[M>>2]=K+1|0;a[(c[R>>2]|0)+K|0]=J;b[L>>1]=0;c[O>>2]=0;ai=M}else{if((N|0)>7){M=B+5816|0;L=b[M>>1]&255;J=B+20|0;K=c[J>>2]|0;c[J>>2]=K+1|0;a[(c[B+8>>2]|0)+K|0]=L;b[M>>1]=(e[M>>1]|0)>>>8;c[O>>2]=(c[O>>2]|0)-8|0;ai=J;break}else{ai=B+20|0;break}}}while(0);O=c[ai>>2]|0;N=c[o>>2]|0;J=O>>>0>N>>>0?N:O;do{if((J|0)!=0){O=B+16|0;bu(c[k>>2]|0,c[O>>2]|0,J|0);c[k>>2]=(c[k>>2]|0)+J|0;c[O>>2]=(c[O>>2]|0)+J|0;c[y>>2]=(c[y>>2]|0)+J|0;c[o>>2]=(c[o>>2]|0)-J|0;N=c[ai>>2]|0;c[ai>>2]=N-J|0;if((N|0)!=(J|0)){break}c[O>>2]=c[B+8>>2]|0}}while(0);B=c[m>>2]|0;if((B|0)==(c[I>>2]|0)){aj=1;ak=B;break}else{al=B;am=B}}else{al=Q;am=P}B=c[u>>2]|0;c[u>>2]=B+1|0;an=a[(c[(c[w>>2]|0)+28>>2]|0)+B|0]|0;c[m>>2]=am+1|0;a[(c[v>>2]|0)+am|0]=an;if(an<<24>>24==0){A=313;break}Q=al;P=c[m>>2]|0}if((A|0)==313){aj=an&255;ak=al}do{if((c[(c[w>>2]|0)+44>>2]|0)!=0){P=c[m>>2]|0;if(P>>>0<=ak>>>0){break}c[x>>2]=bo(c[x>>2]|0,(c[v>>2]|0)+ak|0,P-ak|0)|0}}while(0);if((aj|0)==0){c[u>>2]=0;c[l>>2]=91;ah=w;A=323;break}else{ag=c[l>>2]|0;A=321;break}}}while(0);do{if((A|0)==321){if((ag|0)!=91){ao=ag;A=347;break}ah=j+28|0;A=323;break}}while(0);do{if((A|0)==323){if((c[(c[ah>>2]|0)+36>>2]|0)==0){c[l>>2]=103;ap=ah;A=349;break}v=j+20|0;x=c[v>>2]|0;m=j+12|0;P=f+48|0;Q=j+8|0;I=f+20|0;y=j+32|0;s=x;B=x;while(1){if((B|0)==(c[m>>2]|0)){if((c[(c[ah>>2]|0)+44>>2]|0)!=0&B>>>0>s>>>0){c[P>>2]=bo(c[P>>2]|0,(c[Q>>2]|0)+s|0,B-s|0)|0}x=c[i>>2]|0;J=x+5820|0;O=c[J>>2]|0;do{if((O|0)==16){N=x+5816|0;M=b[N>>1]&255;L=x+20|0;K=c[L>>2]|0;c[L>>2]=K+1|0;R=x+8|0;a[(c[R>>2]|0)+K|0]=M;M=(e[N>>1]|0)>>>8&255;K=c[L>>2]|0;c[L>>2]=K+1|0;a[(c[R>>2]|0)+K|0]=M;b[N>>1]=0;c[J>>2]=0;aq=L}else{if((O|0)>7){L=x+5816|0;N=b[L>>1]&255;M=x+20|0;K=c[M>>2]|0;c[M>>2]=K+1|0;a[(c[x+8>>2]|0)+K|0]=N;b[L>>1]=(e[L>>1]|0)>>>8;c[J>>2]=(c[J>>2]|0)-8|0;aq=M;break}else{aq=x+20|0;break}}}while(0);J=c[aq>>2]|0;O=c[o>>2]|0;M=J>>>0>O>>>0?O:J;do{if((M|0)!=0){J=x+16|0;bu(c[k>>2]|0,c[J>>2]|0,M|0);c[k>>2]=(c[k>>2]|0)+M|0;c[J>>2]=(c[J>>2]|0)+M|0;c[I>>2]=(c[I>>2]|0)+M|0;c[o>>2]=(c[o>>2]|0)-M|0;O=c[aq>>2]|0;c[aq>>2]=O-M|0;if((O|0)!=(M|0)){break}c[J>>2]=c[x+8>>2]|0}}while(0);x=c[v>>2]|0;if((x|0)==(c[m>>2]|0)){ar=1;as=x;break}else{at=x;au=x}}else{at=s;au=B}x=c[y>>2]|0;c[y>>2]=x+1|0;av=a[(c[(c[ah>>2]|0)+36>>2]|0)+x|0]|0;c[v>>2]=au+1|0;a[(c[Q>>2]|0)+au|0]=av;if(av<<24>>24==0){A=339;break}s=at;B=c[v>>2]|0}if((A|0)==339){ar=av&255;as=at}do{if((c[(c[ah>>2]|0)+44>>2]|0)!=0){B=c[v>>2]|0;if(B>>>0<=as>>>0){break}c[P>>2]=bo(c[P>>2]|0,(c[Q>>2]|0)+as|0,B-as|0)|0}}while(0);if((ar|0)==0){c[l>>2]=103;ap=ah;A=349;break}else{ao=c[l>>2]|0;A=347;break}}}while(0);do{if((A|0)==347){if((ao|0)!=103){break}ap=j+28|0;A=349;break}}while(0);do{if((A|0)==349){if((c[(c[ap>>2]|0)+44>>2]|0)==0){c[l>>2]=113;break}Q=j+20|0;P=j+12|0;do{if(((c[Q>>2]|0)+2|0)>>>0>(c[P>>2]|0)>>>0){v=c[i>>2]|0;B=v+5820|0;s=c[B>>2]|0;do{if((s|0)==16){y=v+5816|0;m=b[y>>1]&255;I=v+20|0;w=c[I>>2]|0;c[I>>2]=w+1|0;u=v+8|0;a[(c[u>>2]|0)+w|0]=m;m=(e[y>>1]|0)>>>8&255;w=c[I>>2]|0;c[I>>2]=w+1|0;a[(c[u>>2]|0)+w|0]=m;b[y>>1]=0;c[B>>2]=0;aw=I}else{if((s|0)>7){I=v+5816|0;y=b[I>>1]&255;m=v+20|0;w=c[m>>2]|0;c[m>>2]=w+1|0;a[(c[v+8>>2]|0)+w|0]=y;b[I>>1]=(e[I>>1]|0)>>>8;c[B>>2]=(c[B>>2]|0)-8|0;aw=m;break}else{aw=v+20|0;break}}}while(0);B=c[aw>>2]|0;s=c[o>>2]|0;m=B>>>0>s>>>0?s:B;if((m|0)==0){break}B=v+16|0;bu(c[k>>2]|0,c[B>>2]|0,m|0);c[k>>2]=(c[k>>2]|0)+m|0;c[B>>2]=(c[B>>2]|0)+m|0;s=f+20|0;c[s>>2]=(c[s>>2]|0)+m|0;c[o>>2]=(c[o>>2]|0)-m|0;s=c[aw>>2]|0;c[aw>>2]=s-m|0;if((s|0)!=(m|0)){break}c[B>>2]=c[v+8>>2]|0}}while(0);B=c[Q>>2]|0;if((B+2|0)>>>0>(c[P>>2]|0)>>>0){break}m=f+48|0;s=c[m>>2]&255;c[Q>>2]=B+1|0;I=j+8|0;a[(c[I>>2]|0)+B|0]=s;s=(c[m>>2]|0)>>>8&255;B=c[Q>>2]|0;c[Q>>2]=B+1|0;a[(c[I>>2]|0)+B|0]=s;c[m>>2]=0;c[l>>2]=113}}while(0);m=j+20|0;do{if((c[m>>2]|0)==0){if((c[f+4>>2]|0)!=0){break}if(((g<<1)-((g|0)>4?9:0)|0)>((r<<1)-((r|0)>4?9:0)|0)|n){break}c[f+24>>2]=5255716;h=-5;return h|0}else{s=c[i>>2]|0;B=s+5820|0;I=c[B>>2]|0;do{if((I|0)==16){y=s+5816|0;w=b[y>>1]&255;u=s+20|0;x=c[u>>2]|0;c[u>>2]=x+1|0;M=s+8|0;a[(c[M>>2]|0)+x|0]=w;w=(e[y>>1]|0)>>>8&255;x=c[u>>2]|0;c[u>>2]=x+1|0;a[(c[M>>2]|0)+x|0]=w;b[y>>1]=0;c[B>>2]=0;ax=u}else{if((I|0)>7){u=s+5816|0;y=b[u>>1]&255;w=s+20|0;x=c[w>>2]|0;c[w>>2]=x+1|0;a[(c[s+8>>2]|0)+x|0]=y;b[u>>1]=(e[u>>1]|0)>>>8;c[B>>2]=(c[B>>2]|0)-8|0;ax=w;break}else{ax=s+20|0;break}}}while(0);B=c[ax>>2]|0;I=c[o>>2]|0;Q=B>>>0>I>>>0?I:B;if((Q|0)==0){ay=I}else{I=s+16|0;bu(c[k>>2]|0,c[I>>2]|0,Q|0);c[k>>2]=(c[k>>2]|0)+Q|0;c[I>>2]=(c[I>>2]|0)+Q|0;B=f+20|0;c[B>>2]=(c[B>>2]|0)+Q|0;c[o>>2]=(c[o>>2]|0)-Q|0;B=c[ax>>2]|0;c[ax>>2]=B-Q|0;if((B|0)==(Q|0)){c[I>>2]=c[s+8>>2]|0}ay=c[o>>2]|0}if((ay|0)!=0){break}c[q>>2]=-1;h=0;return h|0}}while(0);r=(c[l>>2]|0)==666;I=(c[f+4>>2]|0)==0;do{if(r){if(I){A=381;break}c[f+24>>2]=5255716;h=-5;return h|0}else{if(I){A=381;break}else{A=384;break}}}while(0);do{if((A|0)==381){if((c[j+116>>2]|0)!=0){A=384;break}if((g|0)==0){h=0;return h|0}else{if(r){break}else{A=384;break}}}}while(0);L528:do{if((A|0)==384){r=c[j+136>>2]|0;L530:do{if((r|0)==2){I=j+116|0;Q=j+96|0;B=j+108|0;P=j+56|0;w=j+5792|0;u=j+5796|0;y=j+5784|0;x=j+5788|0;M=j+92|0;J=j;while(1){if((c[I>>2]|0)==0){a5(j);if((c[I>>2]|0)==0){break}}c[Q>>2]=0;O=a[(c[P>>2]|0)+(c[B>>2]|0)|0]|0;b[(c[u>>2]|0)+(c[w>>2]<<1)>>1]=0;L=c[w>>2]|0;c[w>>2]=L+1|0;a[(c[y>>2]|0)+L|0]=O;L=j+148+((O&255)<<2)|0;b[L>>1]=(b[L>>1]|0)+1&65535;L=(c[w>>2]|0)==((c[x>>2]|0)-1|0);c[I>>2]=(c[I>>2]|0)-1|0;O=(c[B>>2]|0)+1|0;c[B>>2]=O;if(!L){continue}L=c[M>>2]|0;if((L|0)>-1){az=(c[P>>2]|0)+L|0}else{az=0}bh(J,az,O-L|0,0);c[M>>2]=c[B>>2]|0;L=c[p>>2]|0;O=c[L+28>>2]|0;N=O+5820|0;K=c[N>>2]|0;do{if((K|0)==16){R=O+5816|0;V=b[R>>1]&255;S=O+20|0;T=c[S>>2]|0;c[S>>2]=T+1|0;W=O+8|0;a[(c[W>>2]|0)+T|0]=V;V=(e[R>>1]|0)>>>8&255;T=c[S>>2]|0;c[S>>2]=T+1|0;a[(c[W>>2]|0)+T|0]=V;b[R>>1]=0;c[N>>2]=0;aA=S}else{if((K|0)>7){S=O+5816|0;R=b[S>>1]&255;V=O+20|0;T=c[V>>2]|0;c[V>>2]=T+1|0;a[(c[O+8>>2]|0)+T|0]=R;b[S>>1]=(e[S>>1]|0)>>>8;c[N>>2]=(c[N>>2]|0)-8|0;aA=V;break}else{aA=O+20|0;break}}}while(0);N=c[aA>>2]|0;K=L+16|0;V=c[K>>2]|0;S=N>>>0>V>>>0?V:N;do{if((S|0)!=0){N=L+12|0;V=O+16|0;bu(c[N>>2]|0,c[V>>2]|0,S|0);c[N>>2]=(c[N>>2]|0)+S|0;c[V>>2]=(c[V>>2]|0)+S|0;N=L+20|0;c[N>>2]=(c[N>>2]|0)+S|0;c[K>>2]=(c[K>>2]|0)-S|0;N=c[aA>>2]|0;c[aA>>2]=N-S|0;if((N|0)!=(S|0)){break}c[V>>2]=c[O+8>>2]|0}}while(0);if((c[(c[p>>2]|0)+16>>2]|0)==0){A=488;break L530}}if((g|0)==0){A=488;break}c[j+5812>>2]=0;if(n){I=c[M>>2]|0;if((I|0)>-1){aB=(c[P>>2]|0)+I|0}else{aB=0}bh(J,aB,(c[B>>2]|0)-I|0,1);c[M>>2]=c[B>>2]|0;I=c[p>>2]|0;x=c[I+28>>2]|0;y=x+5820|0;u=c[y>>2]|0;do{if((u|0)==16){Q=x+5816|0;v=b[Q>>1]&255;O=x+20|0;S=c[O>>2]|0;c[O>>2]=S+1|0;K=x+8|0;a[(c[K>>2]|0)+S|0]=v;v=(e[Q>>1]|0)>>>8&255;S=c[O>>2]|0;c[O>>2]=S+1|0;a[(c[K>>2]|0)+S|0]=v;b[Q>>1]=0;c[y>>2]=0;aC=O}else{if((u|0)>7){O=x+5816|0;Q=b[O>>1]&255;v=x+20|0;S=c[v>>2]|0;c[v>>2]=S+1|0;a[(c[x+8>>2]|0)+S|0]=Q;b[O>>1]=(e[O>>1]|0)>>>8;c[y>>2]=(c[y>>2]|0)-8|0;aC=v;break}else{aC=x+20|0;break}}}while(0);y=c[aC>>2]|0;u=I+16|0;v=c[u>>2]|0;O=y>>>0>v>>>0?v:y;do{if((O|0)!=0){y=I+12|0;v=x+16|0;bu(c[y>>2]|0,c[v>>2]|0,O|0);c[y>>2]=(c[y>>2]|0)+O|0;c[v>>2]=(c[v>>2]|0)+O|0;y=I+20|0;c[y>>2]=(c[y>>2]|0)+O|0;c[u>>2]=(c[u>>2]|0)-O|0;y=c[aC>>2]|0;c[aC>>2]=y-O|0;if((y|0)!=(O|0)){break}c[v>>2]=c[x+8>>2]|0}}while(0);aD=(c[(c[p>>2]|0)+16>>2]|0)==0?2:3;A=485;break}if((c[w>>2]|0)==0){break}x=c[M>>2]|0;if((x|0)>-1){aE=(c[P>>2]|0)+x|0}else{aE=0}bh(J,aE,(c[B>>2]|0)-x|0,0);c[M>>2]=c[B>>2]|0;x=c[p>>2]|0;O=c[x+28>>2]|0;u=O+5820|0;I=c[u>>2]|0;do{if((I|0)==16){v=O+5816|0;y=b[v>>1]&255;Q=O+20|0;S=c[Q>>2]|0;c[Q>>2]=S+1|0;K=O+8|0;a[(c[K>>2]|0)+S|0]=y;y=(e[v>>1]|0)>>>8&255;S=c[Q>>2]|0;c[Q>>2]=S+1|0;a[(c[K>>2]|0)+S|0]=y;b[v>>1]=0;c[u>>2]=0;aF=Q}else{if((I|0)>7){Q=O+5816|0;v=b[Q>>1]&255;y=O+20|0;S=c[y>>2]|0;c[y>>2]=S+1|0;a[(c[O+8>>2]|0)+S|0]=v;b[Q>>1]=(e[Q>>1]|0)>>>8;c[u>>2]=(c[u>>2]|0)-8|0;aF=y;break}else{aF=O+20|0;break}}}while(0);u=c[aF>>2]|0;I=x+16|0;B=c[I>>2]|0;M=u>>>0>B>>>0?B:u;do{if((M|0)!=0){u=x+12|0;B=O+16|0;bu(c[u>>2]|0,c[B>>2]|0,M|0);c[u>>2]=(c[u>>2]|0)+M|0;c[B>>2]=(c[B>>2]|0)+M|0;u=x+20|0;c[u>>2]=(c[u>>2]|0)+M|0;c[I>>2]=(c[I>>2]|0)-M|0;u=c[aF>>2]|0;c[aF>>2]=u-M|0;if((u|0)!=(M|0)){break}c[B>>2]=c[O+8>>2]|0}}while(0);if((c[(c[p>>2]|0)+16>>2]|0)==0){A=488;break}else{break}}else if((r|0)==3){O=j+116|0;M=(g|0)==0;I=j+96|0;x=j+108|0;B=j+5792|0;u=j+5796|0;J=j+5784|0;P=j+2440|0;w=j+5788|0;y=j+56|0;Q=j+92|0;v=j;L587:while(1){S=c[O>>2]|0;do{if(S>>>0<259){a5(j);K=c[O>>2]|0;if(K>>>0<259&M){A=488;break L530}if((K|0)==0){break L587}c[I>>2]=0;if(K>>>0>2){aG=K;A=432;break}aH=c[x>>2]|0;A=447;break}else{c[I>>2]=0;aG=S;A=432;break}}while(0);do{if((A|0)==432){A=0;S=c[x>>2]|0;if((S|0)==0){aH=0;A=447;break}K=c[y>>2]|0;L=a[K+(S-1|0)|0]|0;if(L<<24>>24!=a[K+S|0]<<24>>24){aH=S;A=447;break}if(L<<24>>24!=a[K+(S+1|0)|0]<<24>>24){aH=S;A=447;break}V=K+(S+2|0)|0;if(L<<24>>24!=a[V]<<24>>24){aH=S;A=447;break}N=K+(S+258|0)|0;K=V;while(1){V=K+1|0;if(L<<24>>24!=a[V]<<24>>24){aI=V;break}V=K+2|0;if(L<<24>>24!=a[V]<<24>>24){aI=V;break}V=K+3|0;if(L<<24>>24!=a[V]<<24>>24){aI=V;break}V=K+4|0;if(L<<24>>24!=a[V]<<24>>24){aI=V;break}V=K+5|0;if(L<<24>>24!=a[V]<<24>>24){aI=V;break}V=K+6|0;if(L<<24>>24!=a[V]<<24>>24){aI=V;break}V=K+7|0;if(L<<24>>24!=a[V]<<24>>24){aI=V;break}V=K+8|0;if(L<<24>>24==a[V]<<24>>24&V>>>0<N>>>0){K=V}else{aI=V;break}}K=(aI-N|0)+258|0;L=K>>>0>aG>>>0?aG:K;c[I>>2]=L;if(L>>>0<=2){aH=S;A=447;break}K=L+253|0;b[(c[u>>2]|0)+(c[B>>2]<<1)>>1]=1;L=c[B>>2]|0;c[B>>2]=L+1|0;a[(c[J>>2]|0)+L|0]=K&255;L=j+148+((d[5256416+(K&255)|0]|0|256)+1<<2)|0;b[L>>1]=(b[L>>1]|0)+1&65535;b[P>>1]=(b[P>>1]|0)+1&65535;L=(c[B>>2]|0)==((c[w>>2]|0)-1|0)&1;K=c[I>>2]|0;c[O>>2]=(c[O>>2]|0)-K|0;V=(c[x>>2]|0)+K|0;c[x>>2]=V;c[I>>2]=0;aJ=L;aK=V;break}}while(0);if((A|0)==447){A=0;V=a[(c[y>>2]|0)+aH|0]|0;b[(c[u>>2]|0)+(c[B>>2]<<1)>>1]=0;L=c[B>>2]|0;c[B>>2]=L+1|0;a[(c[J>>2]|0)+L|0]=V;L=j+148+((V&255)<<2)|0;b[L>>1]=(b[L>>1]|0)+1&65535;L=(c[B>>2]|0)==((c[w>>2]|0)-1|0)&1;c[O>>2]=(c[O>>2]|0)-1|0;V=(c[x>>2]|0)+1|0;c[x>>2]=V;aJ=L;aK=V}if((aJ|0)==0){continue}V=c[Q>>2]|0;if((V|0)>-1){aM=(c[y>>2]|0)+V|0}else{aM=0}bh(v,aM,aK-V|0,0);c[Q>>2]=c[x>>2]|0;V=c[p>>2]|0;L=c[V+28>>2]|0;K=L+5820|0;R=c[K>>2]|0;do{if((R|0)==16){T=L+5816|0;W=b[T>>1]&255;U=L+20|0;X=c[U>>2]|0;c[U>>2]=X+1|0;Y=L+8|0;a[(c[Y>>2]|0)+X|0]=W;W=(e[T>>1]|0)>>>8&255;X=c[U>>2]|0;c[U>>2]=X+1|0;a[(c[Y>>2]|0)+X|0]=W;b[T>>1]=0;c[K>>2]=0;aN=U}else{if((R|0)>7){U=L+5816|0;T=b[U>>1]&255;W=L+20|0;X=c[W>>2]|0;c[W>>2]=X+1|0;a[(c[L+8>>2]|0)+X|0]=T;b[U>>1]=(e[U>>1]|0)>>>8;c[K>>2]=(c[K>>2]|0)-8|0;aN=W;break}else{aN=L+20|0;break}}}while(0);K=c[aN>>2]|0;R=V+16|0;W=c[R>>2]|0;U=K>>>0>W>>>0?W:K;do{if((U|0)!=0){K=V+12|0;W=L+16|0;bu(c[K>>2]|0,c[W>>2]|0,U|0);c[K>>2]=(c[K>>2]|0)+U|0;c[W>>2]=(c[W>>2]|0)+U|0;K=V+20|0;c[K>>2]=(c[K>>2]|0)+U|0;c[R>>2]=(c[R>>2]|0)-U|0;K=c[aN>>2]|0;c[aN>>2]=K-U|0;if((K|0)!=(U|0)){break}c[W>>2]=c[L+8>>2]|0}}while(0);if((c[(c[p>>2]|0)+16>>2]|0)==0){A=488;break L530}}c[j+5812>>2]=0;if(n){O=c[Q>>2]|0;if((O|0)>-1){aO=(c[y>>2]|0)+O|0}else{aO=0}bh(v,aO,(c[x>>2]|0)-O|0,1);c[Q>>2]=c[x>>2]|0;O=c[p>>2]|0;w=c[O+28>>2]|0;J=w+5820|0;u=c[J>>2]|0;do{if((u|0)==16){I=w+5816|0;P=b[I>>1]&255;M=w+20|0;L=c[M>>2]|0;c[M>>2]=L+1|0;U=w+8|0;a[(c[U>>2]|0)+L|0]=P;P=(e[I>>1]|0)>>>8&255;L=c[M>>2]|0;c[M>>2]=L+1|0;a[(c[U>>2]|0)+L|0]=P;b[I>>1]=0;c[J>>2]=0;aP=M}else{if((u|0)>7){M=w+5816|0;I=b[M>>1]&255;P=w+20|0;L=c[P>>2]|0;c[P>>2]=L+1|0;a[(c[w+8>>2]|0)+L|0]=I;b[M>>1]=(e[M>>1]|0)>>>8;c[J>>2]=(c[J>>2]|0)-8|0;aP=P;break}else{aP=w+20|0;break}}}while(0);J=c[aP>>2]|0;u=O+16|0;P=c[u>>2]|0;M=J>>>0>P>>>0?P:J;do{if((M|0)!=0){J=O+12|0;P=w+16|0;bu(c[J>>2]|0,c[P>>2]|0,M|0);c[J>>2]=(c[J>>2]|0)+M|0;c[P>>2]=(c[P>>2]|0)+M|0;J=O+20|0;c[J>>2]=(c[J>>2]|0)+M|0;c[u>>2]=(c[u>>2]|0)-M|0;J=c[aP>>2]|0;c[aP>>2]=J-M|0;if((J|0)!=(M|0)){break}c[P>>2]=c[w+8>>2]|0}}while(0);aD=(c[(c[p>>2]|0)+16>>2]|0)==0?2:3;A=485;break}if((c[B>>2]|0)==0){break}w=c[Q>>2]|0;if((w|0)>-1){aQ=(c[y>>2]|0)+w|0}else{aQ=0}bh(v,aQ,(c[x>>2]|0)-w|0,0);c[Q>>2]=c[x>>2]|0;w=c[p>>2]|0;M=c[w+28>>2]|0;u=M+5820|0;O=c[u>>2]|0;do{if((O|0)==16){P=M+5816|0;J=b[P>>1]&255;I=M+20|0;L=c[I>>2]|0;c[I>>2]=L+1|0;U=M+8|0;a[(c[U>>2]|0)+L|0]=J;J=(e[P>>1]|0)>>>8&255;L=c[I>>2]|0;c[I>>2]=L+1|0;a[(c[U>>2]|0)+L|0]=J;b[P>>1]=0;c[u>>2]=0;aR=I}else{if((O|0)>7){I=M+5816|0;P=b[I>>1]&255;J=M+20|0;L=c[J>>2]|0;c[J>>2]=L+1|0;a[(c[M+8>>2]|0)+L|0]=P;b[I>>1]=(e[I>>1]|0)>>>8;c[u>>2]=(c[u>>2]|0)-8|0;aR=J;break}else{aR=M+20|0;break}}}while(0);u=c[aR>>2]|0;O=w+16|0;x=c[O>>2]|0;Q=u>>>0>x>>>0?x:u;do{if((Q|0)!=0){u=w+12|0;x=M+16|0;bu(c[u>>2]|0,c[x>>2]|0,Q|0);c[u>>2]=(c[u>>2]|0)+Q|0;c[x>>2]=(c[x>>2]|0)+Q|0;u=w+20|0;c[u>>2]=(c[u>>2]|0)+Q|0;c[O>>2]=(c[O>>2]|0)-Q|0;u=c[aR>>2]|0;c[aR>>2]=u-Q|0;if((u|0)!=(Q|0)){break}c[x>>2]=c[M+8>>2]|0}}while(0);if((c[(c[p>>2]|0)+16>>2]|0)==0){A=488;break}else{break}}else{aD=aL[c[5255220+((c[j+132>>2]|0)*12&-1)>>2]&15](j,g)|0;A=485;break}}while(0);do{if((A|0)==485){if((aD-2|0)>>>0<2){c[l>>2]=666}if((aD|0)==2|(aD|0)==0){A=488;break}else if((aD|0)==1){break}else{break L528}}}while(0);if((A|0)==488){if((c[o>>2]|0)!=0){h=0;return h|0}c[q>>2]=-1;h=0;return h|0}do{if((g|0)==1){be(j)}else if((g|0)!=5){bd(j,0,0,0);if((g|0)!=3){break}r=j+76|0;s=j+68|0;b[(c[s>>2]|0)+((c[r>>2]|0)-1<<1)>>1]=0;bt(c[s>>2]|0,0,(c[r>>2]<<1)-2|0);if((c[j+116>>2]|0)!=0){break}c[j+108>>2]=0;c[j+92>>2]=0;c[j+5812>>2]=0}}while(0);r=c[i>>2]|0;s=r+5820|0;M=c[s>>2]|0;do{if((M|0)==16){Q=r+5816|0;O=b[Q>>1]&255;w=r+20|0;x=c[w>>2]|0;c[w>>2]=x+1|0;u=r+8|0;a[(c[u>>2]|0)+x|0]=O;O=(e[Q>>1]|0)>>>8&255;x=c[w>>2]|0;c[w>>2]=x+1|0;a[(c[u>>2]|0)+x|0]=O;b[Q>>1]=0;c[s>>2]=0;aS=w}else{if((M|0)>7){w=r+5816|0;Q=b[w>>1]&255;O=r+20|0;x=c[O>>2]|0;c[O>>2]=x+1|0;a[(c[r+8>>2]|0)+x|0]=Q;b[w>>1]=(e[w>>1]|0)>>>8;c[s>>2]=(c[s>>2]|0)-8|0;aS=O;break}else{aS=r+20|0;break}}}while(0);s=c[aS>>2]|0;M=c[o>>2]|0;O=s>>>0>M>>>0?M:s;if((O|0)==0){aT=M}else{M=r+16|0;bu(c[k>>2]|0,c[M>>2]|0,O|0);c[k>>2]=(c[k>>2]|0)+O|0;c[M>>2]=(c[M>>2]|0)+O|0;s=f+20|0;c[s>>2]=(c[s>>2]|0)+O|0;c[o>>2]=(c[o>>2]|0)-O|0;s=c[aS>>2]|0;c[aS>>2]=s-O|0;if((s|0)==(O|0)){c[M>>2]=c[r+8>>2]|0}aT=c[o>>2]|0}if((aT|0)!=0){break}c[q>>2]=-1;h=0;return h|0}}while(0);if(!n){h=0;return h|0}q=j+24|0;l=c[q>>2]|0;if((l|0)<1){h=1;return h|0}p=f+48|0;M=c[p>>2]|0;if((l|0)==2){l=c[m>>2]|0;c[m>>2]=l+1|0;O=j+8|0;a[(c[O>>2]|0)+l|0]=M&255;l=(c[p>>2]|0)>>>8&255;s=c[m>>2]|0;c[m>>2]=s+1|0;a[(c[O>>2]|0)+s|0]=l;l=(c[p>>2]|0)>>>16&255;s=c[m>>2]|0;c[m>>2]=s+1|0;a[(c[O>>2]|0)+s|0]=l;l=(c[p>>2]|0)>>>24&255;s=c[m>>2]|0;c[m>>2]=s+1|0;a[(c[O>>2]|0)+s|0]=l;l=f+8|0;s=c[l>>2]&255;w=c[m>>2]|0;c[m>>2]=w+1|0;a[(c[O>>2]|0)+w|0]=s;s=(c[l>>2]|0)>>>8&255;w=c[m>>2]|0;c[m>>2]=w+1|0;a[(c[O>>2]|0)+w|0]=s;s=(c[l>>2]|0)>>>16&255;w=c[m>>2]|0;c[m>>2]=w+1|0;a[(c[O>>2]|0)+w|0]=s;s=(c[l>>2]|0)>>>24&255;l=c[m>>2]|0;c[m>>2]=l+1|0;a[(c[O>>2]|0)+l|0]=s}else{s=c[m>>2]|0;c[m>>2]=s+1|0;l=j+8|0;a[(c[l>>2]|0)+s|0]=M>>>24&255;s=c[m>>2]|0;c[m>>2]=s+1|0;a[(c[l>>2]|0)+s|0]=M>>>16&255;M=c[p>>2]|0;p=c[m>>2]|0;c[m>>2]=p+1|0;a[(c[l>>2]|0)+p|0]=M>>>8&255;p=c[m>>2]|0;c[m>>2]=p+1|0;a[(c[l>>2]|0)+p|0]=M&255}M=c[i>>2]|0;p=M+5820|0;l=c[p>>2]|0;do{if((l|0)==16){s=M+5816|0;O=b[s>>1]&255;w=M+20|0;Q=c[w>>2]|0;c[w>>2]=Q+1|0;x=M+8|0;a[(c[x>>2]|0)+Q|0]=O;O=(e[s>>1]|0)>>>8&255;Q=c[w>>2]|0;c[w>>2]=Q+1|0;a[(c[x>>2]|0)+Q|0]=O;b[s>>1]=0;c[p>>2]=0;aU=w}else{if((l|0)>7){w=M+5816|0;s=b[w>>1]&255;O=M+20|0;Q=c[O>>2]|0;c[O>>2]=Q+1|0;a[(c[M+8>>2]|0)+Q|0]=s;b[w>>1]=(e[w>>1]|0)>>>8;c[p>>2]=(c[p>>2]|0)-8|0;aU=O;break}else{aU=M+20|0;break}}}while(0);p=c[aU>>2]|0;l=c[o>>2]|0;n=p>>>0>l>>>0?l:p;do{if((n|0)!=0){p=M+16|0;bu(c[k>>2]|0,c[p>>2]|0,n|0);c[k>>2]=(c[k>>2]|0)+n|0;c[p>>2]=(c[p>>2]|0)+n|0;l=f+20|0;c[l>>2]=(c[l>>2]|0)+n|0;c[o>>2]=(c[o>>2]|0)-n|0;l=c[aU>>2]|0;c[aU>>2]=l-n|0;if((l|0)!=(n|0)){break}c[p>>2]=c[M+8>>2]|0}}while(0);M=c[q>>2]|0;if((M|0)>0){c[q>>2]=-M|0}h=(c[m>>2]|0)==0&1;return h|0}}while(0);c[f+24>>2]=5255912;h=-2;return h|0}function a7(d,f){d=d|0;f=f|0;var g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0;g=(c[d+12>>2]|0)-5|0;h=g>>>0<65535?g:65535;g=d+116|0;i=d+108|0;j=d+92|0;k=d+44|0;l=d+56|0;m=d;n=d|0;while(1){o=c[g>>2]|0;if(o>>>0<2){a5(d);p=c[g>>2]|0;if((p|f|0)==0){q=0;r=592;break}if((p|0)==0){r=566;break}else{s=p}}else{s=o}o=(c[i>>2]|0)+s|0;c[i>>2]=o;c[g>>2]=0;p=c[j>>2]|0;t=p+h|0;if((o|0)!=0&o>>>0<t>>>0){u=o;v=p}else{c[g>>2]=o-t|0;c[i>>2]=t;if((p|0)>-1){w=(c[l>>2]|0)+p|0}else{w=0}bh(m,w,h,0);c[j>>2]=c[i>>2]|0;p=c[n>>2]|0;t=c[p+28>>2]|0;o=t+5820|0;x=c[o>>2]|0;do{if((x|0)==16){y=t+5816|0;z=b[y>>1]&255;A=t+20|0;B=c[A>>2]|0;c[A>>2]=B+1|0;C=t+8|0;a[(c[C>>2]|0)+B|0]=z;z=(e[y>>1]|0)>>>8&255;B=c[A>>2]|0;c[A>>2]=B+1|0;a[(c[C>>2]|0)+B|0]=z;b[y>>1]=0;c[o>>2]=0;D=A}else{if((x|0)>7){A=t+5816|0;y=b[A>>1]&255;z=t+20|0;B=c[z>>2]|0;c[z>>2]=B+1|0;a[(c[t+8>>2]|0)+B|0]=y;b[A>>1]=(e[A>>1]|0)>>>8;c[o>>2]=(c[o>>2]|0)-8|0;D=z;break}else{D=t+20|0;break}}}while(0);o=c[D>>2]|0;x=p+16|0;z=c[x>>2]|0;A=o>>>0>z>>>0?z:o;do{if((A|0)!=0){o=p+12|0;z=t+16|0;bu(c[o>>2]|0,c[z>>2]|0,A|0);c[o>>2]=(c[o>>2]|0)+A|0;c[z>>2]=(c[z>>2]|0)+A|0;o=p+20|0;c[o>>2]=(c[o>>2]|0)+A|0;c[x>>2]=(c[x>>2]|0)-A|0;o=c[D>>2]|0;c[D>>2]=o-A|0;if((o|0)!=(A|0)){break}c[z>>2]=c[t+8>>2]|0}}while(0);if((c[(c[n>>2]|0)+16>>2]|0)==0){q=0;r=596;break}u=c[i>>2]|0;v=c[j>>2]|0}t=u-v|0;if(t>>>0<((c[k>>2]|0)-262|0)>>>0){continue}if((v|0)>-1){E=(c[l>>2]|0)+v|0}else{E=0}bh(m,E,t,0);c[j>>2]=c[i>>2]|0;t=c[n>>2]|0;A=c[t+28>>2]|0;x=A+5820|0;p=c[x>>2]|0;do{if((p|0)==16){z=A+5816|0;o=b[z>>1]&255;y=A+20|0;B=c[y>>2]|0;c[y>>2]=B+1|0;C=A+8|0;a[(c[C>>2]|0)+B|0]=o;o=(e[z>>1]|0)>>>8&255;B=c[y>>2]|0;c[y>>2]=B+1|0;a[(c[C>>2]|0)+B|0]=o;b[z>>1]=0;c[x>>2]=0;F=y}else{if((p|0)>7){y=A+5816|0;z=b[y>>1]&255;o=A+20|0;B=c[o>>2]|0;c[o>>2]=B+1|0;a[(c[A+8>>2]|0)+B|0]=z;b[y>>1]=(e[y>>1]|0)>>>8;c[x>>2]=(c[x>>2]|0)-8|0;F=o;break}else{F=A+20|0;break}}}while(0);x=c[F>>2]|0;p=t+16|0;o=c[p>>2]|0;y=x>>>0>o>>>0?o:x;do{if((y|0)!=0){x=t+12|0;o=A+16|0;bu(c[x>>2]|0,c[o>>2]|0,y|0);c[x>>2]=(c[x>>2]|0)+y|0;c[o>>2]=(c[o>>2]|0)+y|0;x=t+20|0;c[x>>2]=(c[x>>2]|0)+y|0;c[p>>2]=(c[p>>2]|0)-y|0;x=c[F>>2]|0;c[F>>2]=x-y|0;if((x|0)!=(y|0)){break}c[o>>2]=c[A+8>>2]|0}}while(0);if((c[(c[n>>2]|0)+16>>2]|0)==0){q=0;r=595;break}}if((r|0)==566){c[d+5812>>2]=0;if((f|0)==4){f=c[j>>2]|0;if((f|0)>-1){G=(c[l>>2]|0)+f|0}else{G=0}bh(m,G,(c[i>>2]|0)-f|0,1);c[j>>2]=c[i>>2]|0;f=c[n>>2]|0;G=c[f+28>>2]|0;d=G+5820|0;F=c[d>>2]|0;do{if((F|0)==16){E=G+5816|0;v=b[E>>1]&255;k=G+20|0;u=c[k>>2]|0;c[k>>2]=u+1|0;D=G+8|0;a[(c[D>>2]|0)+u|0]=v;v=(e[E>>1]|0)>>>8&255;u=c[k>>2]|0;c[k>>2]=u+1|0;a[(c[D>>2]|0)+u|0]=v;b[E>>1]=0;c[d>>2]=0;H=k}else{if((F|0)>7){k=G+5816|0;E=b[k>>1]&255;v=G+20|0;u=c[v>>2]|0;c[v>>2]=u+1|0;a[(c[G+8>>2]|0)+u|0]=E;b[k>>1]=(e[k>>1]|0)>>>8;c[d>>2]=(c[d>>2]|0)-8|0;H=v;break}else{H=G+20|0;break}}}while(0);d=c[H>>2]|0;F=f+16|0;v=c[F>>2]|0;k=d>>>0>v>>>0?v:d;do{if((k|0)!=0){d=f+12|0;v=G+16|0;bu(c[d>>2]|0,c[v>>2]|0,k|0);c[d>>2]=(c[d>>2]|0)+k|0;c[v>>2]=(c[v>>2]|0)+k|0;d=f+20|0;c[d>>2]=(c[d>>2]|0)+k|0;c[F>>2]=(c[F>>2]|0)-k|0;d=c[H>>2]|0;c[H>>2]=d-k|0;if((d|0)!=(k|0)){break}c[v>>2]=c[G+8>>2]|0}}while(0);q=(c[(c[n>>2]|0)+16>>2]|0)==0?2:3;return q|0}G=c[i>>2]|0;k=c[j>>2]|0;do{if((G|0)>(k|0)){if((k|0)>-1){I=(c[l>>2]|0)+k|0}else{I=0}bh(m,I,G-k|0,0);c[j>>2]=c[i>>2]|0;H=c[n>>2]|0;F=c[H+28>>2]|0;f=F+5820|0;v=c[f>>2]|0;do{if((v|0)==16){d=F+5816|0;E=b[d>>1]&255;u=F+20|0;D=c[u>>2]|0;c[u>>2]=D+1|0;h=F+8|0;a[(c[h>>2]|0)+D|0]=E;E=(e[d>>1]|0)>>>8&255;D=c[u>>2]|0;c[u>>2]=D+1|0;a[(c[h>>2]|0)+D|0]=E;b[d>>1]=0;c[f>>2]=0;J=u}else{if((v|0)>7){u=F+5816|0;d=b[u>>1]&255;E=F+20|0;D=c[E>>2]|0;c[E>>2]=D+1|0;a[(c[F+8>>2]|0)+D|0]=d;b[u>>1]=(e[u>>1]|0)>>>8;c[f>>2]=(c[f>>2]|0)-8|0;J=E;break}else{J=F+20|0;break}}}while(0);f=c[J>>2]|0;v=H+16|0;E=c[v>>2]|0;u=f>>>0>E>>>0?E:f;do{if((u|0)!=0){f=H+12|0;E=F+16|0;bu(c[f>>2]|0,c[E>>2]|0,u|0);c[f>>2]=(c[f>>2]|0)+u|0;c[E>>2]=(c[E>>2]|0)+u|0;f=H+20|0;c[f>>2]=(c[f>>2]|0)+u|0;c[v>>2]=(c[v>>2]|0)-u|0;f=c[J>>2]|0;c[J>>2]=f-u|0;if((f|0)!=(u|0)){break}c[E>>2]=c[F+8>>2]|0}}while(0);if((c[(c[n>>2]|0)+16>>2]|0)==0){q=0}else{break}return q|0}}while(0);q=1;return q|0}else if((r|0)==592){return q|0}else if((r|0)==595){return q|0}else if((r|0)==596){return q|0}return 0}function a8(f,g){f=f|0;g=g|0;var h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0;h=f+116|0;i=(g|0)==0;j=f+72|0;k=f+88|0;l=f+108|0;m=f+56|0;n=f+84|0;o=f+68|0;p=f+52|0;q=f+64|0;r=f+44|0;s=f+96|0;t=f+112|0;u=f+5792|0;v=f+5796|0;w=f+5784|0;x=f+5788|0;y=f+128|0;z=f+92|0;A=f;B=f|0;L808:while(1){do{if((c[h>>2]|0)>>>0<262){a5(f);C=c[h>>2]|0;if(C>>>0<262&i){D=0;E=654;break L808}if((C|0)==0){E=628;break L808}if(C>>>0>2){E=603;break}else{E=606;break}}else{E=603}}while(0);do{if((E|0)==603){E=0;C=c[l>>2]|0;F=((d[(c[m>>2]|0)+(C+2|0)|0]|0)^c[j>>2]<<c[k>>2])&c[n>>2];c[j>>2]=F;G=b[(c[o>>2]|0)+(F<<1)>>1]|0;b[(c[q>>2]|0)+((c[p>>2]&C)<<1)>>1]=G;C=G&65535;b[(c[o>>2]|0)+(c[j>>2]<<1)>>1]=c[l>>2]&65535;if(G<<16>>16==0){E=606;break}if(((c[l>>2]|0)-C|0)>>>0>((c[r>>2]|0)-262|0)>>>0){E=606;break}G=ba(f,C)|0;c[s>>2]=G;H=G;break}}while(0);if((E|0)==606){E=0;H=c[s>>2]|0}do{if(H>>>0>2){G=H+253|0;C=(c[l>>2]|0)-(c[t>>2]|0)|0;b[(c[v>>2]|0)+(c[u>>2]<<1)>>1]=C&65535;F=c[u>>2]|0;c[u>>2]=F+1|0;a[(c[w>>2]|0)+F|0]=G&255;F=f+148+((d[5256416+(G&255)|0]|0|256)+1<<2)|0;b[F>>1]=(b[F>>1]|0)+1&65535;F=C+65535&65535;if(F>>>0<256){I=F}else{I=(F>>>7)+256|0}F=f+2440+((d[I+5257144|0]|0)<<2)|0;b[F>>1]=(b[F>>1]|0)+1&65535;F=(c[u>>2]|0)==((c[x>>2]|0)-1|0)&1;C=c[s>>2]|0;G=(c[h>>2]|0)-C|0;c[h>>2]=G;if(!(C>>>0<=(c[y>>2]|0)>>>0&G>>>0>2)){G=(c[l>>2]|0)+C|0;c[l>>2]=G;c[s>>2]=0;J=c[m>>2]|0;K=d[J+G|0]|0;c[j>>2]=K;c[j>>2]=((d[J+(G+1|0)|0]|0)^K<<c[k>>2])&c[n>>2];L=F;M=G;break}c[s>>2]=C-1|0;while(1){C=c[l>>2]|0;G=C+1|0;c[l>>2]=G;K=((d[(c[m>>2]|0)+(C+3|0)|0]|0)^c[j>>2]<<c[k>>2])&c[n>>2];c[j>>2]=K;b[(c[q>>2]|0)+((c[p>>2]&G)<<1)>>1]=b[(c[o>>2]|0)+(K<<1)>>1]|0;b[(c[o>>2]|0)+(c[j>>2]<<1)>>1]=c[l>>2]&65535;K=(c[s>>2]|0)-1|0;c[s>>2]=K;if((K|0)==0){break}}K=(c[l>>2]|0)+1|0;c[l>>2]=K;L=F;M=K}else{K=a[(c[m>>2]|0)+(c[l>>2]|0)|0]|0;b[(c[v>>2]|0)+(c[u>>2]<<1)>>1]=0;G=c[u>>2]|0;c[u>>2]=G+1|0;a[(c[w>>2]|0)+G|0]=K;G=f+148+((K&255)<<2)|0;b[G>>1]=(b[G>>1]|0)+1&65535;G=(c[u>>2]|0)==((c[x>>2]|0)-1|0)&1;c[h>>2]=(c[h>>2]|0)-1|0;K=(c[l>>2]|0)+1|0;c[l>>2]=K;L=G;M=K}}while(0);if((L|0)==0){continue}K=c[z>>2]|0;if((K|0)>-1){N=(c[m>>2]|0)+K|0}else{N=0}bh(A,N,M-K|0,0);c[z>>2]=c[l>>2]|0;K=c[B>>2]|0;G=c[K+28>>2]|0;C=G+5820|0;J=c[C>>2]|0;do{if((J|0)==16){O=G+5816|0;P=b[O>>1]&255;Q=G+20|0;R=c[Q>>2]|0;c[Q>>2]=R+1|0;S=G+8|0;a[(c[S>>2]|0)+R|0]=P;P=(e[O>>1]|0)>>>8&255;R=c[Q>>2]|0;c[Q>>2]=R+1|0;a[(c[S>>2]|0)+R|0]=P;b[O>>1]=0;c[C>>2]=0;T=Q}else{if((J|0)>7){Q=G+5816|0;O=b[Q>>1]&255;P=G+20|0;R=c[P>>2]|0;c[P>>2]=R+1|0;a[(c[G+8>>2]|0)+R|0]=O;b[Q>>1]=(e[Q>>1]|0)>>>8;c[C>>2]=(c[C>>2]|0)-8|0;T=P;break}else{T=G+20|0;break}}}while(0);C=c[T>>2]|0;J=K+16|0;P=c[J>>2]|0;Q=C>>>0>P>>>0?P:C;do{if((Q|0)!=0){C=K+12|0;P=G+16|0;bu(c[C>>2]|0,c[P>>2]|0,Q|0);c[C>>2]=(c[C>>2]|0)+Q|0;c[P>>2]=(c[P>>2]|0)+Q|0;C=K+20|0;c[C>>2]=(c[C>>2]|0)+Q|0;c[J>>2]=(c[J>>2]|0)-Q|0;C=c[T>>2]|0;c[T>>2]=C-Q|0;if((C|0)!=(Q|0)){break}c[P>>2]=c[G+8>>2]|0}}while(0);if((c[(c[B>>2]|0)+16>>2]|0)==0){D=0;E=655;break}}if((E|0)==655){return D|0}else if((E|0)==654){return D|0}else if((E|0)==628){E=c[l>>2]|0;c[f+5812>>2]=E>>>0<2?E:2;if((g|0)==4){g=c[z>>2]|0;if((g|0)>-1){U=(c[m>>2]|0)+g|0}else{U=0}bh(A,U,E-g|0,1);c[z>>2]=c[l>>2]|0;g=c[B>>2]|0;U=c[g+28>>2]|0;f=U+5820|0;T=c[f>>2]|0;do{if((T|0)==16){M=U+5816|0;N=b[M>>1]&255;L=U+20|0;h=c[L>>2]|0;c[L>>2]=h+1|0;x=U+8|0;a[(c[x>>2]|0)+h|0]=N;N=(e[M>>1]|0)>>>8&255;h=c[L>>2]|0;c[L>>2]=h+1|0;a[(c[x>>2]|0)+h|0]=N;b[M>>1]=0;c[f>>2]=0;V=L}else{if((T|0)>7){L=U+5816|0;M=b[L>>1]&255;N=U+20|0;h=c[N>>2]|0;c[N>>2]=h+1|0;a[(c[U+8>>2]|0)+h|0]=M;b[L>>1]=(e[L>>1]|0)>>>8;c[f>>2]=(c[f>>2]|0)-8|0;V=N;break}else{V=U+20|0;break}}}while(0);f=c[V>>2]|0;T=g+16|0;N=c[T>>2]|0;L=f>>>0>N>>>0?N:f;do{if((L|0)!=0){f=g+12|0;N=U+16|0;bu(c[f>>2]|0,c[N>>2]|0,L|0);c[f>>2]=(c[f>>2]|0)+L|0;c[N>>2]=(c[N>>2]|0)+L|0;f=g+20|0;c[f>>2]=(c[f>>2]|0)+L|0;c[T>>2]=(c[T>>2]|0)-L|0;f=c[V>>2]|0;c[V>>2]=f-L|0;if((f|0)!=(L|0)){break}c[N>>2]=c[U+8>>2]|0}}while(0);D=(c[(c[B>>2]|0)+16>>2]|0)==0?2:3;return D|0}do{if((c[u>>2]|0)!=0){U=c[z>>2]|0;if((U|0)>-1){W=(c[m>>2]|0)+U|0}else{W=0}bh(A,W,E-U|0,0);c[z>>2]=c[l>>2]|0;U=c[B>>2]|0;L=c[U+28>>2]|0;V=L+5820|0;T=c[V>>2]|0;do{if((T|0)==16){g=L+5816|0;N=b[g>>1]&255;f=L+20|0;M=c[f>>2]|0;c[f>>2]=M+1|0;h=L+8|0;a[(c[h>>2]|0)+M|0]=N;N=(e[g>>1]|0)>>>8&255;M=c[f>>2]|0;c[f>>2]=M+1|0;a[(c[h>>2]|0)+M|0]=N;b[g>>1]=0;c[V>>2]=0;X=f}else{if((T|0)>7){f=L+5816|0;g=b[f>>1]&255;N=L+20|0;M=c[N>>2]|0;c[N>>2]=M+1|0;a[(c[L+8>>2]|0)+M|0]=g;b[f>>1]=(e[f>>1]|0)>>>8;c[V>>2]=(c[V>>2]|0)-8|0;X=N;break}else{X=L+20|0;break}}}while(0);V=c[X>>2]|0;T=U+16|0;N=c[T>>2]|0;f=V>>>0>N>>>0?N:V;do{if((f|0)!=0){V=U+12|0;N=L+16|0;bu(c[V>>2]|0,c[N>>2]|0,f|0);c[V>>2]=(c[V>>2]|0)+f|0;c[N>>2]=(c[N>>2]|0)+f|0;V=U+20|0;c[V>>2]=(c[V>>2]|0)+f|0;c[T>>2]=(c[T>>2]|0)-f|0;V=c[X>>2]|0;c[X>>2]=V-f|0;if((V|0)!=(f|0)){break}c[N>>2]=c[L+8>>2]|0}}while(0);if((c[(c[B>>2]|0)+16>>2]|0)==0){D=0}else{break}return D|0}}while(0);D=1;return D|0}return 0}function a9(f,g){f=f|0;g=g|0;var h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,$=0,aa=0,ab=0,ac=0,ad=0,ae=0,af=0;h=f+116|0;i=(g|0)==0;j=f+72|0;k=f+88|0;l=f+108|0;m=f+56|0;n=f+84|0;o=f+68|0;p=f+52|0;q=f+64|0;r=f+96|0;s=f+120|0;t=f+112|0;u=f+100|0;v=f+5792|0;w=f+5796|0;x=f+5784|0;y=f+5788|0;z=f+104|0;A=f+92|0;B=f;C=f|0;D=f+128|0;E=f+44|0;F=f+136|0;L891:while(1){G=c[h>>2]|0;while(1){do{if(G>>>0<262){a5(f);H=c[h>>2]|0;if(H>>>0<262&i){I=0;J=737;break L891}if((H|0)==0){J=708;break L891}if(H>>>0>2){J=666;break}c[s>>2]=c[r>>2]|0;c[u>>2]=c[t>>2]|0;c[r>>2]=2;K=2;J=674;break}else{J=666}}while(0);do{if((J|0)==666){J=0;H=c[l>>2]|0;L=((d[(c[m>>2]|0)+(H+2|0)|0]|0)^c[j>>2]<<c[k>>2])&c[n>>2];c[j>>2]=L;M=b[(c[o>>2]|0)+(L<<1)>>1]|0;b[(c[q>>2]|0)+((c[p>>2]&H)<<1)>>1]=M;H=M&65535;b[(c[o>>2]|0)+(c[j>>2]<<1)>>1]=c[l>>2]&65535;L=c[r>>2]|0;c[s>>2]=L;c[u>>2]=c[t>>2]|0;c[r>>2]=2;if(M<<16>>16==0){K=2;J=674;break}if(L>>>0>=(c[D>>2]|0)>>>0){N=L;O=2;break}if(((c[l>>2]|0)-H|0)>>>0>((c[E>>2]|0)-262|0)>>>0){K=2;J=674;break}L=ba(f,H)|0;c[r>>2]=L;if(L>>>0>=6){K=L;J=674;break}if((c[F>>2]|0)!=1){if((L|0)!=3){K=L;J=674;break}if(((c[l>>2]|0)-(c[t>>2]|0)|0)>>>0<=4096){K=3;J=674;break}}c[r>>2]=2;K=2;J=674;break}}while(0);if((J|0)==674){J=0;N=c[s>>2]|0;O=K}if(!(N>>>0<3|O>>>0>N>>>0)){break}if((c[z>>2]|0)==0){c[z>>2]=1;c[l>>2]=(c[l>>2]|0)+1|0;L=(c[h>>2]|0)-1|0;c[h>>2]=L;G=L;continue}L=a[(c[m>>2]|0)+((c[l>>2]|0)-1|0)|0]|0;b[(c[w>>2]|0)+(c[v>>2]<<1)>>1]=0;H=c[v>>2]|0;c[v>>2]=H+1|0;a[(c[x>>2]|0)+H|0]=L;H=f+148+((L&255)<<2)|0;b[H>>1]=(b[H>>1]|0)+1&65535;do{if((c[v>>2]|0)==((c[y>>2]|0)-1|0)){H=c[A>>2]|0;if((H|0)>-1){P=(c[m>>2]|0)+H|0}else{P=0}bh(B,P,(c[l>>2]|0)-H|0,0);c[A>>2]=c[l>>2]|0;H=c[C>>2]|0;L=c[H+28>>2]|0;M=L+5820|0;Q=c[M>>2]|0;do{if((Q|0)==16){R=L+5816|0;S=b[R>>1]&255;T=L+20|0;U=c[T>>2]|0;c[T>>2]=U+1|0;V=L+8|0;a[(c[V>>2]|0)+U|0]=S;S=(e[R>>1]|0)>>>8&255;U=c[T>>2]|0;c[T>>2]=U+1|0;a[(c[V>>2]|0)+U|0]=S;b[R>>1]=0;c[M>>2]=0;W=T}else{if((Q|0)>7){T=L+5816|0;R=b[T>>1]&255;S=L+20|0;U=c[S>>2]|0;c[S>>2]=U+1|0;a[(c[L+8>>2]|0)+U|0]=R;b[T>>1]=(e[T>>1]|0)>>>8;c[M>>2]=(c[M>>2]|0)-8|0;W=S;break}else{W=L+20|0;break}}}while(0);M=c[W>>2]|0;Q=H+16|0;S=c[Q>>2]|0;T=M>>>0>S>>>0?S:M;if((T|0)==0){break}M=H+12|0;S=L+16|0;bu(c[M>>2]|0,c[S>>2]|0,T|0);c[M>>2]=(c[M>>2]|0)+T|0;c[S>>2]=(c[S>>2]|0)+T|0;M=H+20|0;c[M>>2]=(c[M>>2]|0)+T|0;c[Q>>2]=(c[Q>>2]|0)-T|0;Q=c[W>>2]|0;c[W>>2]=Q-T|0;if((Q|0)!=(T|0)){break}c[S>>2]=c[L+8>>2]|0}}while(0);c[l>>2]=(c[l>>2]|0)+1|0;S=(c[h>>2]|0)-1|0;c[h>>2]=S;if((c[(c[C>>2]|0)+16>>2]|0)==0){I=0;J=739;break L891}else{G=S}}G=c[l>>2]|0;S=(G-3|0)+(c[h>>2]|0)|0;T=N+253|0;Q=(G+65535|0)-(c[u>>2]|0)|0;b[(c[w>>2]|0)+(c[v>>2]<<1)>>1]=Q&65535;G=c[v>>2]|0;c[v>>2]=G+1|0;a[(c[x>>2]|0)+G|0]=T&255;G=f+148+((d[5256416+(T&255)|0]|0|256)+1<<2)|0;b[G>>1]=(b[G>>1]|0)+1&65535;G=Q+65535&65535;if(G>>>0<256){X=G}else{X=(G>>>7)+256|0}G=f+2440+((d[X+5257144|0]|0)<<2)|0;b[G>>1]=(b[G>>1]|0)+1&65535;G=c[v>>2]|0;Q=(c[y>>2]|0)-1|0;T=c[s>>2]|0;c[h>>2]=(1-T|0)+(c[h>>2]|0)|0;M=T-2|0;c[s>>2]=M;T=M;while(1){M=c[l>>2]|0;R=M+1|0;c[l>>2]=R;if(R>>>0>S>>>0){Y=T}else{U=((d[(c[m>>2]|0)+(M+3|0)|0]|0)^c[j>>2]<<c[k>>2])&c[n>>2];c[j>>2]=U;b[(c[q>>2]|0)+((c[p>>2]&R)<<1)>>1]=b[(c[o>>2]|0)+(U<<1)>>1]|0;b[(c[o>>2]|0)+(c[j>>2]<<1)>>1]=c[l>>2]&65535;Y=c[s>>2]|0}U=Y-1|0;c[s>>2]=U;if((U|0)==0){break}else{T=U}}c[z>>2]=0;c[r>>2]=2;T=(c[l>>2]|0)+1|0;c[l>>2]=T;if((G|0)!=(Q|0)){continue}S=c[A>>2]|0;if((S|0)>-1){Z=(c[m>>2]|0)+S|0}else{Z=0}bh(B,Z,T-S|0,0);c[A>>2]=c[l>>2]|0;S=c[C>>2]|0;T=c[S+28>>2]|0;U=T+5820|0;R=c[U>>2]|0;do{if((R|0)==16){M=T+5816|0;V=b[M>>1]&255;_=T+20|0;$=c[_>>2]|0;c[_>>2]=$+1|0;aa=T+8|0;a[(c[aa>>2]|0)+$|0]=V;V=(e[M>>1]|0)>>>8&255;$=c[_>>2]|0;c[_>>2]=$+1|0;a[(c[aa>>2]|0)+$|0]=V;b[M>>1]=0;c[U>>2]=0;ab=_}else{if((R|0)>7){_=T+5816|0;M=b[_>>1]&255;V=T+20|0;$=c[V>>2]|0;c[V>>2]=$+1|0;a[(c[T+8>>2]|0)+$|0]=M;b[_>>1]=(e[_>>1]|0)>>>8;c[U>>2]=(c[U>>2]|0)-8|0;ab=V;break}else{ab=T+20|0;break}}}while(0);U=c[ab>>2]|0;R=S+16|0;Q=c[R>>2]|0;G=U>>>0>Q>>>0?Q:U;do{if((G|0)!=0){U=S+12|0;Q=T+16|0;bu(c[U>>2]|0,c[Q>>2]|0,G|0);c[U>>2]=(c[U>>2]|0)+G|0;c[Q>>2]=(c[Q>>2]|0)+G|0;U=S+20|0;c[U>>2]=(c[U>>2]|0)+G|0;c[R>>2]=(c[R>>2]|0)-G|0;U=c[ab>>2]|0;c[ab>>2]=U-G|0;if((U|0)!=(G|0)){break}c[Q>>2]=c[T+8>>2]|0}}while(0);if((c[(c[C>>2]|0)+16>>2]|0)==0){I=0;J=741;break}}if((J|0)==708){if((c[z>>2]|0)!=0){ab=a[(c[m>>2]|0)+((c[l>>2]|0)-1|0)|0]|0;b[(c[w>>2]|0)+(c[v>>2]<<1)>>1]=0;w=c[v>>2]|0;c[v>>2]=w+1|0;a[(c[x>>2]|0)+w|0]=ab;w=f+148+((ab&255)<<2)|0;b[w>>1]=(b[w>>1]|0)+1&65535;c[z>>2]=0}z=c[l>>2]|0;c[f+5812>>2]=z>>>0<2?z:2;if((g|0)==4){g=c[A>>2]|0;if((g|0)>-1){ac=(c[m>>2]|0)+g|0}else{ac=0}bh(B,ac,z-g|0,1);c[A>>2]=c[l>>2]|0;g=c[C>>2]|0;ac=c[g+28>>2]|0;f=ac+5820|0;w=c[f>>2]|0;do{if((w|0)==16){ab=ac+5816|0;x=b[ab>>1]&255;Z=ac+20|0;r=c[Z>>2]|0;c[Z>>2]=r+1|0;s=ac+8|0;a[(c[s>>2]|0)+r|0]=x;x=(e[ab>>1]|0)>>>8&255;r=c[Z>>2]|0;c[Z>>2]=r+1|0;a[(c[s>>2]|0)+r|0]=x;b[ab>>1]=0;c[f>>2]=0;ad=Z}else{if((w|0)>7){Z=ac+5816|0;ab=b[Z>>1]&255;x=ac+20|0;r=c[x>>2]|0;c[x>>2]=r+1|0;a[(c[ac+8>>2]|0)+r|0]=ab;b[Z>>1]=(e[Z>>1]|0)>>>8;c[f>>2]=(c[f>>2]|0)-8|0;ad=x;break}else{ad=ac+20|0;break}}}while(0);f=c[ad>>2]|0;w=g+16|0;x=c[w>>2]|0;Z=f>>>0>x>>>0?x:f;do{if((Z|0)!=0){f=g+12|0;x=ac+16|0;bu(c[f>>2]|0,c[x>>2]|0,Z|0);c[f>>2]=(c[f>>2]|0)+Z|0;c[x>>2]=(c[x>>2]|0)+Z|0;f=g+20|0;c[f>>2]=(c[f>>2]|0)+Z|0;c[w>>2]=(c[w>>2]|0)-Z|0;f=c[ad>>2]|0;c[ad>>2]=f-Z|0;if((f|0)!=(Z|0)){break}c[x>>2]=c[ac+8>>2]|0}}while(0);I=(c[(c[C>>2]|0)+16>>2]|0)==0?2:3;return I|0}do{if((c[v>>2]|0)!=0){ac=c[A>>2]|0;if((ac|0)>-1){ae=(c[m>>2]|0)+ac|0}else{ae=0}bh(B,ae,z-ac|0,0);c[A>>2]=c[l>>2]|0;ac=c[C>>2]|0;Z=c[ac+28>>2]|0;ad=Z+5820|0;w=c[ad>>2]|0;do{if((w|0)==16){g=Z+5816|0;x=b[g>>1]&255;f=Z+20|0;ab=c[f>>2]|0;c[f>>2]=ab+1|0;r=Z+8|0;a[(c[r>>2]|0)+ab|0]=x;x=(e[g>>1]|0)>>>8&255;ab=c[f>>2]|0;c[f>>2]=ab+1|0;a[(c[r>>2]|0)+ab|0]=x;b[g>>1]=0;c[ad>>2]=0;af=f}else{if((w|0)>7){f=Z+5816|0;g=b[f>>1]&255;x=Z+20|0;ab=c[x>>2]|0;c[x>>2]=ab+1|0;a[(c[Z+8>>2]|0)+ab|0]=g;b[f>>1]=(e[f>>1]|0)>>>8;c[ad>>2]=(c[ad>>2]|0)-8|0;af=x;break}else{af=Z+20|0;break}}}while(0);ad=c[af>>2]|0;w=ac+16|0;x=c[w>>2]|0;f=ad>>>0>x>>>0?x:ad;do{if((f|0)!=0){ad=ac+12|0;x=Z+16|0;bu(c[ad>>2]|0,c[x>>2]|0,f|0);c[ad>>2]=(c[ad>>2]|0)+f|0;c[x>>2]=(c[x>>2]|0)+f|0;ad=ac+20|0;c[ad>>2]=(c[ad>>2]|0)+f|0;c[w>>2]=(c[w>>2]|0)-f|0;ad=c[af>>2]|0;c[af>>2]=ad-f|0;if((ad|0)!=(f|0)){break}c[x>>2]=c[Z+8>>2]|0}}while(0);if((c[(c[C>>2]|0)+16>>2]|0)==0){I=0}else{break}return I|0}}while(0);I=1;return I|0}else if((J|0)==737){return I|0}else if((J|0)==739){return I|0}else if((J|0)==741){return I|0}return 0}function ba(b,d){b=b|0;d=d|0;var f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0;f=c[b+124>>2]|0;g=c[b+56>>2]|0;h=c[b+108>>2]|0;i=g+h|0;j=c[b+120>>2]|0;k=c[b+144>>2]|0;l=(c[b+44>>2]|0)-262|0;m=h>>>0>l>>>0?h-l|0:0;l=c[b+64>>2]|0;n=c[b+52>>2]|0;o=g+(h+258|0)|0;p=c[b+116>>2]|0;q=k>>>0>p>>>0?p:k;k=b+112|0;r=g+(h+1|0)|0;s=g+(h+2|0)|0;t=o;u=h+257|0;v=a[g+(j+h|0)|0]|0;w=a[g+((h-1|0)+j|0)|0]|0;x=d;d=j>>>0<(c[b+140>>2]|0)>>>0?f:f>>>2;f=j;L1003:while(1){j=g+x|0;do{if(a[g+(x+f|0)|0]<<24>>24==v<<24>>24){if(a[g+((f-1|0)+x|0)|0]<<24>>24!=w<<24>>24){y=v;z=w;A=f;break}if(a[j]<<24>>24!=a[i]<<24>>24){y=v;z=w;A=f;break}if(a[g+(x+1|0)|0]<<24>>24!=a[r]<<24>>24){y=v;z=w;A=f;break}b=s;B=g+(x+2|0)|0;while(1){C=b+1|0;if(a[C]<<24>>24!=a[B+1|0]<<24>>24){D=C;break}C=b+2|0;if(a[C]<<24>>24!=a[B+2|0]<<24>>24){D=C;break}C=b+3|0;if(a[C]<<24>>24!=a[B+3|0]<<24>>24){D=C;break}C=b+4|0;if(a[C]<<24>>24!=a[B+4|0]<<24>>24){D=C;break}C=b+5|0;if(a[C]<<24>>24!=a[B+5|0]<<24>>24){D=C;break}C=b+6|0;if(a[C]<<24>>24!=a[B+6|0]<<24>>24){D=C;break}C=b+7|0;if(a[C]<<24>>24!=a[B+7|0]<<24>>24){D=C;break}C=b+8|0;E=B+8|0;if(a[C]<<24>>24==a[E]<<24>>24&C>>>0<o>>>0){b=C;B=E}else{D=C;break}}B=D-t|0;b=B+258|0;if((b|0)<=(f|0)){y=v;z=w;A=f;break}c[k>>2]=x;if((b|0)>=(q|0)){F=b;G=762;break L1003}y=a[g+(b+h|0)|0]|0;z=a[g+(u+B|0)|0]|0;A=b}else{y=v;z=w;A=f}}while(0);j=e[l+((x&n)<<1)>>1]|0;if(j>>>0<=m>>>0){F=A;G=763;break}b=d-1|0;if((b|0)==0){F=A;G=764;break}else{v=y;w=z;x=j;d=b;f=A}}if((G|0)==762){A=F>>>0>p>>>0;f=A?p:F;return f|0}else if((G|0)==763){A=F>>>0>p>>>0;f=A?p:F;return f|0}else if((G|0)==764){A=F>>>0>p>>>0;f=A?p:F;return f|0}return 0}function bb(f,g){f=f|0;g=g|0;var h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,$=0,aa=0,ab=0,ac=0,ad=0,ae=0,af=0,ag=0,ah=0,ai=0,aj=0,ak=0,al=0,am=0,an=0,ao=0,ap=0,aq=0,ar=0,as=0,at=0,au=0,av=0,aw=0,ax=0,ay=0,az=0,aA=0,aB=0,aC=0,aE=0,aF=0,aG=0,aH=0,aI=0,aJ=0,aK=0,aL=0,aM=0,aN=0,aO=0,aP=0,aQ=0,aR=0,aS=0,aT=0,aU=0,aV=0,aW=0,aX=0,aY=0,aZ=0,a_=0,a$=0,a0=0,a1=0,a2=0,a3=0,a4=0,a5=0,a6=0,a7=0,a8=0,a9=0,ba=0,bb=0,bc=0,bd=0,be=0,bh=0,bi=0,bj=0,bk=0,bl=0,bm=0,bq=0,br=0,bs=0,bt=0,bv=0,bw=0,bx=0,by=0,bz=0,bA=0,bB=0,bC=0,bD=0,bE=0,bF=0,bG=0,bH=0,bI=0,bJ=0,bK=0,bL=0,bM=0,bN=0,bO=0,bP=0,bQ=0,bR=0,bS=0,bT=0,bU=0,bV=0,bW=0,bX=0,bY=0,bZ=0,b_=0,b$=0,b0=0,b1=0,b2=0,b3=0,b4=0,b5=0,b6=0,b7=0,b8=0,b9=0,ca=0,cb=0,cc=0,cd=0,ce=0,cf=0,cg=0,ch=0,ci=0,cj=0,ck=0,cl=0,cm=0,cn=0,co=0,cp=0,cq=0,cr=0,cs=0,ct=0,cu=0,cv=0,cw=0,cx=0,cy=0,cz=0,cA=0,cB=0,cC=0,cD=0,cE=0,cF=0,cG=0,cH=0,cI=0,cJ=0,cK=0,cL=0,cM=0,cN=0,cO=0,cP=0,cQ=0,cR=0,cS=0,cT=0,cU=0,cV=0,cW=0,cX=0,cY=0,cZ=0,c_=0,c$=0,c0=0,c1=0,c2=0,c3=0,c4=0,c5=0,c6=0,c7=0,c8=0,c9=0,da=0,db=0,dc=0,dd=0,de=0,df=0,dg=0,dh=0,di=0,dj=0,dk=0,dl=0,dm=0,dn=0,dp=0,dq=0,dr=0,ds=0,dt=0,du=0,dv=0,dw=0,dx=0,dy=0,dz=0,dA=0,dB=0,dC=0,dD=0,dE=0,dF=0,dG=0,dH=0,dI=0,dJ=0,dK=0,dL=0,dM=0,dN=0,dO=0,dP=0,dQ=0,dR=0,dS=0,dT=0,dU=0,dV=0,dW=0,dX=0,dY=0,dZ=0,d_=0,d$=0,d0=0,d1=0,d2=0,d3=0,d4=0,d5=0,d6=0,d7=0,d8=0,d9=0,ea=0,eb=0,ec=0,ed=0,ee=0,ef=0,eg=0,eh=0,ei=0,ej=0,ek=0,el=0,em=0,en=0,eo=0,ep=0,eq=0,er=0,es=0,et=0,eu=0,ev=0,ew=0,ex=0,ey=0,ez=0,eA=0,eB=0,eC=0,eD=0,eE=0,eF=0,eG=0,eH=0,eI=0,eJ=0,eK=0,eL=0,eM=0,eN=0,eO=0,eP=0,eQ=0,eR=0,eS=0,eT=0,eU=0,eV=0,eW=0,eX=0,eY=0,eZ=0,e_=0,e$=0,e0=0,e1=0,e2=0,e3=0,e4=0,e5=0,e6=0,e7=0,e8=0,e9=0,fa=0,fb=0,fc=0,fd=0,fe=0,ff=0,fg=0,fh=0,fi=0,fj=0,fk=0,fl=0,fm=0,fn=0,fo=0,fp=0,fq=0,fr=0,fs=0,ft=0,fu=0,fv=0,fw=0,fx=0,fy=0,fz=0,fA=0,fB=0,fC=0,fD=0,fE=0,fF=0,fG=0,fH=0,fI=0,fJ=0,fK=0,fL=0,fM=0,fN=0,fO=0,fP=0,fQ=0,fR=0,fS=0,fT=0;h=i;i=i+4|0;j=h|0;if((f|0)==0){k=-2;i=h;return k|0}l=c[f+28>>2]|0;if((l|0)==0){k=-2;i=h;return k|0}m=f+12|0;n=c[m>>2]|0;if((n|0)==0){k=-2;i=h;return k|0}o=f|0;p=c[o>>2]|0;do{if((p|0)==0){if((c[f+4>>2]|0)==0){break}else{k=-2}i=h;return k|0}}while(0);q=l|0;r=c[q>>2]|0;if((r|0)==11){c[q>>2]=12;s=c[m>>2]|0;t=c[o>>2]|0;u=12}else{s=n;t=p;u=r}r=f+16|0;p=c[r>>2]|0;n=f+4|0;v=c[n>>2]|0;w=l+56|0;x=l+60|0;y=l+8|0;z=l+24|0;A=j|0;B=j+1|0;C=l+16|0;D=l+32|0;E=f+24|0;F=l+36|0;G=l+20|0;H=f+48|0;I=l+64|0;J=l+12|0;K=(g-5|0)>>>0<2;L=l+4|0;M=l+76|0;N=l+84|0;O=l+80|0;P=l+88|0;Q=(g|0)==6;R=l+7108|0;S=l+76|0;T=l+72|0;U=l+7112|0;V=l+68|0;W=l+44|0;X=l+7104|0;Y=l+48|0;Z=l+52|0;_=l+40|0;$=f+20|0;aa=l+28|0;ab=l+96|0;ac=l+100|0;ad=l+92|0;ae=l+104|0;af=l+108|0;ag=af;ah=af|0;af=l+1328|0;ai=l+112|0;aj=ai;ak=l+752|0;al=ai;ai=l+624|0;am=l+80|0;l=j+2|0;an=j+3|0;j=0;ao=p;ap=c[x>>2]|0;aq=c[w>>2]|0;ar=p;p=v;as=s;s=t;t=u;L1045:while(1){L1047:do{if((t|0)==10){at=ap;au=aq;av=p;aw=s;ax=886}else if((t|0)==8){ay=ap;az=aq;aA=p;aB=s;ax=874}else if((t|0)==21){aC=j;aE=ap;aF=aq;aG=p;aH=s;aI=c[T>>2]|0;ax=982;break}else if((t|0)==4){aJ=ap;aK=aq;aL=p;aM=s;ax=827}else if((t|0)==7){aN=ap;aO=aq;aP=p;aQ=s;ax=861}else if((t|0)==5){aR=ap;aS=aq;aT=p;aU=s;ax=838}else if((t|0)==6){aV=ap;aW=aq;aX=p;aY=s;aZ=c[C>>2]|0;ax=848;break}else if((t|0)==15){a_=ap;a$=aq;a0=p;a1=s;ax=909}else if((t|0)==13){u=ap&7;a2=aq>>>(u>>>0);a3=ap-u|0;L1051:do{if(a3>>>0<32){u=s;a4=p;a5=a2;a6=a3;while(1){if((a4|0)==0){a7=j;a8=ao;a9=a6;ba=a5;bb=0;bc=u;bd=ar;break L1045}be=a4-1|0;bh=u+1|0;bi=((d[u]|0)<<a6)+a5|0;bj=a6+8|0;if(bj>>>0<32){u=bh;a4=be;a5=bi;a6=bj}else{bk=bh;bl=be;bm=bi;bq=bj;break L1051}}}else{bk=s;bl=p;bm=a2;bq=a3}}while(0);a3=bm&65535;if((a3|0)==(bm>>>16^65535|0)){c[I>>2]=a3;c[q>>2]=14;if(Q){br=j;bs=0;bt=0;bv=bl;bw=bk;bx=ar;ax=1046;break L1045}else{by=0;bz=0;bA=bl;bB=bk;ax=908;break}}else{c[E>>2]=5255732;c[q>>2]=29;bC=j;bD=ao;bE=bq;bF=bm;bG=ar;bH=bl;bI=as;bJ=bk;break}}else if((t|0)==14){by=ap;bz=aq;bA=p;bB=s;ax=908}else if((t|0)==25){if((ar|0)==0){br=j;bs=ap;bt=aq;bv=p;bw=s;bx=0;ax=1046;break L1045}a[as]=c[I>>2]&255;c[q>>2]=20;bC=j;bD=ao;bE=ap;bF=aq;bG=ar-1|0;bH=p;bI=as+1|0;bJ=s;break}else if((t|0)==26){do{if((c[y>>2]|0)==0){bK=ao;bL=ap;bM=aq;bN=p;bO=s}else{L1064:do{if(ap>>>0<32){a3=s;a2=p;a6=aq;a5=ap;while(1){if((a2|0)==0){a7=j;a8=ao;a9=a5;ba=a6;bb=0;bc=a3;bd=ar;break L1045}a4=a2-1|0;u=a3+1|0;bj=((d[a3]|0)<<a5)+a6|0;bi=a5+8|0;if(bi>>>0<32){a3=u;a2=a4;a6=bj;a5=bi}else{bP=u;bQ=a4;bR=bj;bS=bi;break L1064}}}else{bP=s;bQ=p;bR=aq;bS=ap}}while(0);a5=ao-ar|0;c[$>>2]=(c[$>>2]|0)+a5|0;c[aa>>2]=(c[aa>>2]|0)+a5|0;if((ao|0)!=(ar|0)){a6=c[z>>2]|0;a2=as+(-a5|0)|0;if((c[C>>2]|0)==0){bT=bn(a6,a2,a5)|0}else{bT=bo(a6,a2,a5)|0}c[z>>2]=bT;c[H>>2]=bT}if((c[C>>2]|0)==0){bU=aD(bR|0)|0}else{bU=bR}if((bU|0)==(c[z>>2]|0)){bK=ar;bL=0;bM=0;bN=bQ;bO=bP;break}c[E>>2]=5256144;c[q>>2]=29;bC=j;bD=ar;bE=bS;bF=bR;bG=ar;bH=bQ;bI=as;bJ=bP;break L1047}}while(0);c[q>>2]=27;bV=bK;bW=bL;bX=bM;bY=bN;bZ=bO;ax=1038;break}else if((t|0)==27){bV=ao;bW=ap;bX=aq;bY=p;bZ=s;ax=1038}else if((t|0)==28){br=1;bs=ap;bt=aq;bv=p;bw=s;bx=ar;ax=1046;break L1045}else if((t|0)==29){a7=-3;a8=ao;a9=ap;ba=aq;bb=p;bc=s;bd=ar;break L1045}else if((t|0)==30){ax=1062;break L1045}else if((t|0)==19){b_=j;b$=ap;b0=aq;b1=p;b2=s;ax=962}else if((t|0)==20){b3=j;b4=ap;b5=aq;b6=p;b7=s;ax=963}else if((t|0)==17){a5=c[ae>>2]|0;if(a5>>>0<(c[ad>>2]|0)>>>0){b8=s;b9=p;ca=aq;cb=ap;cc=a5;ax=919;break}else{cd=s;ce=p;cf=aq;cg=ap;ch=a5;ax=923;break}}else if((t|0)==22){ci=j;cj=ap;ck=aq;cl=p;cm=s;ax=989}else if((t|0)==18){cn=j;co=ap;cp=aq;cq=p;cr=s;cs=c[ae>>2]|0;ax=928;break}else if((t|0)==24){ct=j;cu=ap;cv=aq;cw=p;cx=s;ax=1007}else if((t|0)==1){L1084:do{if(ap>>>0<16){a5=s;a2=p;a6=aq;a3=ap;while(1){if((a2|0)==0){a7=j;a8=ao;a9=a3;ba=a6;bb=0;bc=a5;bd=ar;break L1045}bi=a2-1|0;bj=a5+1|0;a4=((d[a5]|0)<<a3)+a6|0;u=a3+8|0;if(u>>>0<16){a5=bj;a2=bi;a6=a4;a3=u}else{cy=bj;cz=bi;cA=a4;cB=u;break L1084}}}else{cy=s;cz=p;cA=aq;cB=ap}}while(0);c[C>>2]=cA;if((cA&255|0)!=8){c[E>>2]=5256044;c[q>>2]=29;bC=j;bD=ao;bE=cB;bF=cA;bG=ar;bH=cz;bI=as;bJ=cy;break}if((cA&57344|0)!=0){c[E>>2]=5255928;c[q>>2]=29;bC=j;bD=ao;bE=cB;bF=cA;bG=ar;bH=cz;bI=as;bJ=cy;break}a3=c[D>>2]|0;if((a3|0)==0){cC=cA}else{c[a3>>2]=cA>>>8&1;cC=c[C>>2]|0}if((cC&512|0)!=0){a[A]=cA&255;a[B]=cA>>>8&255;c[z>>2]=bo(c[z>>2]|0,A,2)|0}c[q>>2]=2;cD=cy;cE=cz;cF=0;cG=0;ax=812;break}else if((t|0)==9){L1102:do{if(ap>>>0<32){a3=s;a6=p;a2=aq;a5=ap;while(1){if((a6|0)==0){a7=j;a8=ao;a9=a5;ba=a2;bb=0;bc=a3;bd=ar;break L1045}u=a6-1|0;a4=a3+1|0;bi=((d[a3]|0)<<a5)+a2|0;bj=a5+8|0;if(bj>>>0<32){a3=a4;a6=u;a2=bi;a5=bj}else{cH=a4;cI=u;cJ=bi;break L1102}}}else{cH=s;cI=p;cJ=aq}}while(0);a5=aD(cJ|0)|0;c[z>>2]=a5;c[H>>2]=a5;c[q>>2]=10;at=0;au=0;av=cI;aw=cH;ax=886;break}else if((t|0)==16){L1108:do{if(ap>>>0<14){a5=s;a2=p;a6=aq;a3=ap;while(1){if((a2|0)==0){a7=j;a8=ao;a9=a3;ba=a6;bb=0;bc=a5;bd=ar;break L1045}bi=a2-1|0;u=a5+1|0;a4=((d[a5]|0)<<a3)+a6|0;bj=a3+8|0;if(bj>>>0<14){a5=u;a2=bi;a6=a4;a3=bj}else{cK=u;cL=bi;cM=a4;cN=bj;break L1108}}}else{cK=s;cL=p;cM=aq;cN=ap}}while(0);a3=(cM&31)+257|0;c[ab>>2]=a3;a6=(cM>>>5&31)+1|0;c[ac>>2]=a6;c[ad>>2]=(cM>>>10&15)+4|0;a2=cM>>>14;a5=cN-14|0;if(a3>>>0>286|a6>>>0>30){c[E>>2]=5255652;c[q>>2]=29;bC=j;bD=ao;bE=a5;bF=a2;bG=ar;bH=cL;bI=as;bJ=cK;break}else{c[ae>>2]=0;c[q>>2]=17;b8=cK;b9=cL;ca=a2;cb=a5;cc=0;ax=919;break}}else if((t|0)==0){a5=c[y>>2]|0;if((a5|0)==0){c[q>>2]=12;bC=j;bD=ao;bE=ap;bF=aq;bG=ar;bH=p;bI=as;bJ=s;break}L1120:do{if(ap>>>0<16){a2=s;a6=p;a3=aq;bj=ap;while(1){if((a6|0)==0){a7=j;a8=ao;a9=bj;ba=a3;bb=0;bc=a2;bd=ar;break L1045}a4=a6-1|0;bi=a2+1|0;u=((d[a2]|0)<<bj)+a3|0;be=bj+8|0;if(be>>>0<16){a2=bi;a6=a4;a3=u;bj=be}else{cO=bi;cP=a4;cQ=u;cR=be;break L1120}}}else{cO=s;cP=p;cQ=aq;cR=ap}}while(0);if((a5&2|0)!=0&(cQ|0)==35615){c[z>>2]=0;a[A]=31;a[B]=-117;c[z>>2]=bo(c[z>>2]|0,A,2)|0;c[q>>2]=1;bC=j;bD=ao;bE=0;bF=0;bG=ar;bH=cP;bI=as;bJ=cO;break}c[C>>2]=0;bj=c[D>>2]|0;if((bj|0)==0){cS=a5}else{c[bj+48>>2]=-1;cS=c[y>>2]|0}do{if((cS&1|0)!=0){if(((((cQ<<8&65280)+(cQ>>>8)|0)>>>0)%31|0)!=0){break}if((cQ&15|0)!=8){c[E>>2]=5256044;c[q>>2]=29;bC=j;bD=ao;bE=cR;bF=cQ;bG=ar;bH=cP;bI=as;bJ=cO;break L1047}bj=cQ>>>4;a3=cR-4|0;a6=(bj&15)+8|0;a2=c[F>>2]|0;do{if((a2|0)==0){c[F>>2]=a6}else{if(a6>>>0<=a2>>>0){break}c[E>>2]=5255976;c[q>>2]=29;bC=j;bD=ao;bE=a3;bF=bj;bG=ar;bH=cP;bI=as;bJ=cO;break L1047}}while(0);c[G>>2]=1<<a6;c[z>>2]=1;c[H>>2]=1;c[q>>2]=cQ>>>12&2^11;bC=j;bD=ao;bE=0;bF=0;bG=ar;bH=cP;bI=as;bJ=cO;break L1047}}while(0);c[E>>2]=5256268;c[q>>2]=29;bC=j;bD=ao;bE=cR;bF=cQ;bG=ar;bH=cP;bI=as;bJ=cO;break}else if((t|0)==2){if(ap>>>0<32){cD=s;cE=p;cF=aq;cG=ap;ax=812;break}else{cT=s;cU=p;cV=aq;ax=814;break}}else if((t|0)==3){if(ap>>>0<16){cW=s;cX=p;cY=aq;cZ=ap;ax=820;break}else{c_=s;c$=p;c0=aq;ax=822;break}}else if((t|0)==11){c1=ap;c2=aq;c3=p;c4=s;ax=889}else if((t|0)==12){c5=ap;c6=aq;c7=p;c8=s;ax=890}else if((t|0)==23){c9=j;da=ap;db=aq;dc=p;dd=s;de=c[T>>2]|0;ax=1001;break}else{k=-2;ax=1069;break L1045}}while(0);L1146:do{if((ax|0)==886){ax=0;if((c[J>>2]|0)==0){ax=887;break L1045}c[z>>2]=1;c[H>>2]=1;c[q>>2]=11;c1=at;c2=au;c3=av;c4=aw;ax=889;break}else if((ax|0)==908){ax=0;c[q>>2]=15;a_=by;a$=bz;a0=bA;a1=bB;ax=909;break}else if((ax|0)==1038){ax=0;if((c[y>>2]|0)==0){df=bW;dg=bX;dh=bY;di=bZ;ax=1045;break L1045}if((c[C>>2]|0)==0){df=bW;dg=bX;dh=bY;di=bZ;ax=1045;break L1045}L1153:do{if(bW>>>0<32){a5=bZ;bj=bY;a3=bX;a2=bW;while(1){if((bj|0)==0){a7=j;a8=bV;a9=a2;ba=a3;bb=0;bc=a5;bd=ar;break L1045}be=bj-1|0;u=a5+1|0;a4=((d[a5]|0)<<a2)+a3|0;bi=a2+8|0;if(bi>>>0<32){a5=u;bj=be;a3=a4;a2=bi}else{dj=u;dk=be;dl=a4;dm=bi;break L1153}}}else{dj=bZ;dk=bY;dl=bX;dm=bW}}while(0);if((dl|0)==(c[aa>>2]|0)){df=0;dg=0;dh=dk;di=dj;ax=1045;break L1045}c[E>>2]=5256096;c[q>>2]=29;bC=j;bD=bV;bE=dm;bF=dl;bG=ar;bH=dk;bI=as;bJ=dj;break}else if((ax|0)==812){while(1){ax=0;if((cE|0)==0){a7=j;a8=ao;a9=cG;ba=cF;bb=0;bc=cD;bd=ar;break L1045}a2=cE-1|0;a3=cD+1|0;bj=((d[cD]|0)<<cG)+cF|0;a5=cG+8|0;if(a5>>>0<32){cD=a3;cE=a2;cF=bj;cG=a5;ax=812}else{cT=a3;cU=a2;cV=bj;ax=814;break L1146}}}else if((ax|0)==919){while(1){ax=0;L1164:do{if(cb>>>0<3){bj=b8;a2=b9;a3=ca;a5=cb;while(1){if((a2|0)==0){a7=j;a8=ao;a9=a5;ba=a3;bb=0;bc=bj;bd=ar;break L1045}a6=a2-1|0;bi=bj+1|0;a4=((d[bj]|0)<<a5)+a3|0;be=a5+8|0;if(be>>>0<3){bj=bi;a2=a6;a3=a4;a5=be}else{dn=bi;dp=a6;dq=a4;dr=be;break L1164}}}else{dn=b8;dp=b9;dq=ca;dr=cb}}while(0);c[ae>>2]=cc+1|0;b[al+((e[5244492+(cc<<1)>>1]|0)<<1)>>1]=dq&7;a5=dq>>>3;a3=dr-3|0;a2=c[ae>>2]|0;if(a2>>>0<(c[ad>>2]|0)>>>0){b8=dn;b9=dp;ca=a5;cb=a3;cc=a2;ax=919}else{cd=dn;ce=dp;cf=a5;cg=a3;ch=a2;ax=923;break L1146}}}}while(0);do{if((ax|0)==909){ax=0;a2=c[I>>2]|0;if((a2|0)==0){c[q>>2]=11;bC=j;bD=ao;bE=a_;bF=a$;bG=ar;bH=a0;bI=as;bJ=a1;break}a3=a2>>>0>a0>>>0?a0:a2;a2=a3>>>0>ar>>>0?ar:a3;if((a2|0)==0){br=j;bs=a_;bt=a$;bv=a0;bw=a1;bx=ar;ax=1046;break L1045}bu(as|0,a1|0,a2|0);c[I>>2]=(c[I>>2]|0)-a2|0;bC=j;bD=ao;bE=a_;bF=a$;bG=ar-a2|0;bH=a0-a2|0;bI=as+a2|0;bJ=a1+a2|0;break}else if((ax|0)==923){ax=0;L1176:do{if(ch>>>0<19){a2=ch;while(1){c[ae>>2]=a2+1|0;b[al+((e[5244492+(a2<<1)>>1]|0)<<1)>>1]=0;a3=c[ae>>2]|0;if(a3>>>0<19){a2=a3}else{break L1176}}}}while(0);c[ah>>2]=af;c[M>>2]=af;c[N>>2]=7;a2=bg(0,aj,19,ag,N,ak)|0;if((a2|0)==0){c[ae>>2]=0;c[q>>2]=18;cn=0;co=cg;cp=cf;cq=ce;cr=cd;cs=0;ax=928;break}else{c[E>>2]=5255588;c[q>>2]=29;bC=a2;bD=ao;bE=cg;bF=cf;bG=ar;bH=ce;bI=as;bJ=cd;break}}else if((ax|0)==814){ax=0;a2=c[D>>2]|0;if((a2|0)!=0){c[a2+4>>2]=cV}if((c[C>>2]&512|0)!=0){a[A]=cV&255;a[B]=cV>>>8&255;a[l]=cV>>>16&255;a[an]=cV>>>24&255;c[z>>2]=bo(c[z>>2]|0,A,4)|0}c[q>>2]=3;cW=cT;cX=cU;cY=0;cZ=0;ax=820;break}else if((ax|0)==889){ax=0;if(K){br=j;bs=c1;bt=c2;bv=c3;bw=c4;bx=ar;ax=1046;break L1045}else{c5=c1;c6=c2;c7=c3;c8=c4;ax=890;break}}}while(0);L1191:do{if((ax|0)==928){ax=0;a2=c[ab>>2]|0;a3=c[ac>>2]|0;do{if(cs>>>0<(a3+a2|0)>>>0){a5=cr;bj=cq;be=cp;a4=co;a6=cs;bi=a2;u=a3;L1194:while(1){bh=(1<<c[N>>2])-1|0;ds=bh&be;dt=c[S>>2]|0;du=d[dt+(ds<<2)+1|0]|0;L1196:do{if(du>>>0>a4>>>0){dv=a5;dw=bj;dx=be;dy=a4;while(1){if((dw|0)==0){a7=cn;a8=ao;a9=dy;ba=dx;bb=0;bc=dv;bd=ar;break L1045}dz=dw-1|0;dA=dv+1|0;dB=((d[dv]|0)<<dy)+dx|0;dC=dy+8|0;dD=bh&dB;dE=d[dt+(dD<<2)+1|0]|0;if(dE>>>0>dC>>>0){dv=dA;dw=dz;dx=dB;dy=dC}else{dF=dA;dG=dz;dH=dB;dI=dC;dJ=dD;dK=dE;break L1196}}}else{dF=a5;dG=bj;dH=be;dI=a4;dJ=ds;dK=du}}while(0);du=b[dt+(dJ<<2)+2>>1]|0;L1201:do{if((du&65535)<16){c[ae>>2]=a6+1|0;b[al+(a6<<1)>>1]=du;dL=dI-dK|0;dM=dH>>>(dK>>>0);dN=dG;dO=dF}else{if((du<<16>>16|0)==16){ds=dK+2|0;L1212:do{if(dI>>>0<ds>>>0){bh=dF;dy=dG;dx=dH;dw=dI;while(1){if((dy|0)==0){a7=cn;a8=ao;a9=dw;ba=dx;bb=0;bc=bh;bd=ar;break L1045}dv=dy-1|0;dE=bh+1|0;dD=((d[bh]|0)<<dw)+dx|0;dC=dw+8|0;if(dC>>>0<ds>>>0){bh=dE;dy=dv;dx=dD;dw=dC}else{dP=dE;dQ=dv;dR=dD;dS=dC;break L1212}}}else{dP=dF;dQ=dG;dR=dH;dS=dI}}while(0);dT=dR>>>(dK>>>0);dU=dS-dK|0;if((a6|0)==0){ax=942;break L1194}dV=b[al+(a6-1<<1)>>1]|0;dW=(dT&3)+3|0;dX=dU-2|0;dY=dT>>>2;dZ=dQ;d_=dP}else if((du<<16>>16|0)==17){ds=dK+3|0;L1219:do{if(dI>>>0<ds>>>0){dw=dF;dx=dG;dy=dH;bh=dI;while(1){if((dx|0)==0){a7=cn;a8=ao;a9=bh;ba=dy;bb=0;bc=dw;bd=ar;break L1045}dC=dx-1|0;dD=dw+1|0;dv=((d[dw]|0)<<bh)+dy|0;dE=bh+8|0;if(dE>>>0<ds>>>0){dw=dD;dx=dC;dy=dv;bh=dE}else{d$=dD;d0=dC;d1=dv;d2=dE;break L1219}}}else{d$=dF;d0=dG;d1=dH;d2=dI}}while(0);ds=d1>>>(dK>>>0);dV=0;dW=(ds&7)+3|0;dX=(-3-dK|0)+d2|0;dY=ds>>>3;dZ=d0;d_=d$}else{ds=dK+7|0;L1206:do{if(dI>>>0<ds>>>0){bh=dF;dy=dG;dx=dH;dw=dI;while(1){if((dy|0)==0){a7=cn;a8=ao;a9=dw;ba=dx;bb=0;bc=bh;bd=ar;break L1045}dE=dy-1|0;dv=bh+1|0;dC=((d[bh]|0)<<dw)+dx|0;dD=dw+8|0;if(dD>>>0<ds>>>0){bh=dv;dy=dE;dx=dC;dw=dD}else{d3=dv;d4=dE;d5=dC;d6=dD;break L1206}}}else{d3=dF;d4=dG;d5=dH;d6=dI}}while(0);ds=d5>>>(dK>>>0);dV=0;dW=(ds&127)+11|0;dX=(-7-dK|0)+d6|0;dY=ds>>>7;dZ=d4;d_=d3}if((a6+dW|0)>>>0>(u+bi|0)>>>0){ax=951;break L1194}else{d7=dW;d8=a6}while(1){ds=d7-1|0;c[ae>>2]=d8+1|0;b[al+(d8<<1)>>1]=dV;if((ds|0)==0){dL=dX;dM=dY;dN=dZ;dO=d_;break L1201}d7=ds;d8=c[ae>>2]|0}}}while(0);du=c[ae>>2]|0;d9=c[ab>>2]|0;dt=c[ac>>2]|0;if(du>>>0<(dt+d9|0)>>>0){a5=dO;bj=dN;be=dM;a4=dL;a6=du;bi=d9;u=dt}else{ax=954;break}}if((ax|0)==951){ax=0;c[E>>2]=5256356;c[q>>2]=29;bC=cn;bD=ao;bE=dX;bF=dY;bG=ar;bH=dZ;bI=as;bJ=d_;break L1191}else if((ax|0)==954){ax=0;if((c[q>>2]|0)==29){bC=cn;bD=ao;bE=dL;bF=dM;bG=ar;bH=dN;bI=as;bJ=dO;break L1191}else{ea=d9;eb=dL;ec=dM;ed=dN;ee=dO;break}}else if((ax|0)==942){ax=0;c[E>>2]=5256356;c[q>>2]=29;bC=cn;bD=ao;bE=dU;bF=dT;bG=ar;bH=dQ;bI=as;bJ=dP;break L1191}}else{ea=a2;eb=co;ec=cp;ed=cq;ee=cr}}while(0);if(b[ai>>1]<<16>>16==0){c[E>>2]=5256292;c[q>>2]=29;bC=cn;bD=ao;bE=eb;bF=ec;bG=ar;bH=ed;bI=as;bJ=ee;break}c[ah>>2]=af;c[M>>2]=af;c[N>>2]=9;a2=bg(1,aj,ea,ag,N,ak)|0;if((a2|0)!=0){c[E>>2]=5256236;c[q>>2]=29;bC=a2;bD=ao;bE=eb;bF=ec;bG=ar;bH=ed;bI=as;bJ=ee;break}c[O>>2]=c[ag>>2]|0;c[P>>2]=6;a2=bg(2,aj+(c[ab>>2]<<1)|0,c[ac>>2]|0,ag,P,ak)|0;if((a2|0)==0){c[q>>2]=19;if(Q){br=0;bs=eb;bt=ec;bv=ed;bw=ee;bx=ar;ax=1046;break L1045}else{b_=0;b$=eb;b0=ec;b1=ed;b2=ee;ax=962;break}}else{c[E>>2]=5256168;c[q>>2]=29;bC=a2;bD=ao;bE=eb;bF=ec;bG=ar;bH=ed;bI=as;bJ=ee;break}}else if((ax|0)==820){while(1){ax=0;if((cX|0)==0){a7=j;a8=ao;a9=cZ;ba=cY;bb=0;bc=cW;bd=ar;break L1045}a2=cX-1|0;a3=cW+1|0;u=((d[cW]|0)<<cZ)+cY|0;bi=cZ+8|0;if(bi>>>0<16){cW=a3;cX=a2;cY=u;cZ=bi;ax=820}else{c_=a3;c$=a2;c0=u;ax=822;break L1191}}}else if((ax|0)==890){ax=0;if((c[L>>2]|0)!=0){u=c5&7;c[q>>2]=26;bC=j;bD=ao;bE=c5-u|0;bF=c6>>>(u>>>0);bG=ar;bH=c7;bI=as;bJ=c8;break}L1250:do{if(c5>>>0<3){u=c8;a2=c7;a3=c6;bi=c5;while(1){if((a2|0)==0){a7=j;a8=ao;a9=bi;ba=a3;bb=0;bc=u;bd=ar;break L1045}a6=a2-1|0;a4=u+1|0;be=((d[u]|0)<<bi)+a3|0;bj=bi+8|0;if(bj>>>0<3){u=a4;a2=a6;a3=be;bi=bj}else{ef=a4;eg=a6;eh=be;ei=bj;break L1250}}}else{ef=c8;eg=c7;eh=c6;ei=c5}}while(0);c[L>>2]=eh&1;bi=eh>>>1&3;if((bi|0)==0){c[q>>2]=13}else if((bi|0)==1){c[M>>2]=5244532;c[N>>2]=9;c[O>>2]=5246580;c[P>>2]=5;c[q>>2]=19;if(Q){ax=898;break L1045}}else if((bi|0)==2){c[q>>2]=16}else if((bi|0)==3){c[E>>2]=5255840;c[q>>2]=29}bC=j;bD=ao;bE=ei-3|0;bF=eh>>>3;bG=ar;bH=eg;bI=as;bJ=ef;break}}while(0);do{if((ax|0)==962){ax=0;c[q>>2]=20;b3=b_;b4=b$;b5=b0;b6=b1;b7=b2;ax=963;break}else if((ax|0)==822){ax=0;bi=c[D>>2]|0;if((bi|0)!=0){c[bi+8>>2]=c0&255;c[(c[D>>2]|0)+12>>2]=c0>>>8}if((c[C>>2]&512|0)!=0){a[A]=c0&255;a[B]=c0>>>8&255;c[z>>2]=bo(c[z>>2]|0,A,2)|0}c[q>>2]=4;aJ=0;aK=0;aL=c$;aM=c_;ax=827;break}}while(0);do{if((ax|0)==827){ax=0;bi=c[C>>2]|0;do{if((bi&1024|0)==0){a3=c[D>>2]|0;if((a3|0)==0){ej=aJ;ek=aK;el=aL;em=aM;break}c[a3+16>>2]=0;ej=aJ;ek=aK;el=aL;em=aM}else{L1276:do{if(aJ>>>0<16){a3=aM;a2=aL;u=aK;bj=aJ;while(1){if((a2|0)==0){a7=j;a8=ao;a9=bj;ba=u;bb=0;bc=a3;bd=ar;break L1045}be=a2-1|0;a6=a3+1|0;a4=((d[a3]|0)<<bj)+u|0;a5=bj+8|0;if(a5>>>0<16){a3=a6;a2=be;u=a4;bj=a5}else{en=a6;eo=be;ep=a4;break L1276}}}else{en=aM;eo=aL;ep=aK}}while(0);c[I>>2]=ep;bj=c[D>>2]|0;if((bj|0)==0){eq=bi}else{c[bj+20>>2]=ep;eq=c[C>>2]|0}if((eq&512|0)==0){ej=0;ek=0;el=eo;em=en;break}a[A]=ep&255;a[B]=ep>>>8&255;c[z>>2]=bo(c[z>>2]|0,A,2)|0;ej=0;ek=0;el=eo;em=en}}while(0);c[q>>2]=5;aR=ej;aS=ek;aT=el;aU=em;ax=838;break}else if((ax|0)==963){ax=0;if(b6>>>0>5&ar>>>0>257){c[m>>2]=as;c[r>>2]=ar;c[o>>2]=b7;c[n>>2]=b6;c[w>>2]=b5;c[x>>2]=b4;bp(f,ao);bi=c[m>>2]|0;bj=c[r>>2]|0;u=c[o>>2]|0;a2=c[n>>2]|0;a3=c[w>>2]|0;a4=c[x>>2]|0;if((c[q>>2]|0)!=11){bC=b3;bD=ao;bE=a4;bF=a3;bG=bj;bH=a2;bI=bi;bJ=u;break}c[R>>2]=-1;bC=b3;bD=ao;bE=a4;bF=a3;bG=bj;bH=a2;bI=bi;bJ=u;break}c[R>>2]=0;u=(1<<c[N>>2])-1|0;bi=u&b5;a2=c[S>>2]|0;bj=a[a2+(bi<<2)+1|0]|0;a3=bj&255;L1291:do{if(a3>>>0>b4>>>0){a4=b7;be=b6;a6=b5;a5=b4;while(1){if((be|0)==0){a7=b3;a8=ao;a9=a5;ba=a6;bb=0;bc=a4;bd=ar;break L1045}dt=be-1|0;du=a4+1|0;ds=((d[a4]|0)<<a5)+a6|0;dw=a5+8|0;dx=u&ds;dy=a[a2+(dx<<2)+1|0]|0;bh=dy&255;if(bh>>>0>dw>>>0){a4=du;be=dt;a6=ds;a5=dw}else{er=du;es=dt;et=ds;eu=dw;ev=dy;ew=dx;ex=bh;break L1291}}}else{er=b7;es=b6;et=b5;eu=b4;ev=bj;ew=bi;ex=a3}}while(0);a3=a[a2+(ew<<2)|0]|0;bi=b[a2+(ew<<2)+2>>1]|0;bj=a3&255;do{if(a3<<24>>24==0){ey=0;ez=ev;eA=bi;eB=eu;eC=et;eD=es;eE=er;eF=0}else{if((bj&240|0)!=0){ey=a3;ez=ev;eA=bi;eB=eu;eC=et;eD=es;eE=er;eF=0;break}u=bi&65535;a5=(1<<ex+bj)-1|0;a6=((et&a5)>>>(ex>>>0))+u|0;be=a[a2+(a6<<2)+1|0]|0;L1299:do{if(((be&255)+ex|0)>>>0>eu>>>0){a4=er;bh=es;dx=et;dy=eu;while(1){if((bh|0)==0){a7=b3;a8=ao;a9=dy;ba=dx;bb=0;bc=a4;bd=ar;break L1045}dw=bh-1|0;ds=a4+1|0;dt=((d[a4]|0)<<dy)+dx|0;du=dy+8|0;dD=((dt&a5)>>>(ex>>>0))+u|0;dC=a[a2+(dD<<2)+1|0]|0;if(((dC&255)+ex|0)>>>0>du>>>0){a4=ds;bh=dw;dx=dt;dy=du}else{eG=ds;eH=dw;eI=dt;eJ=du;eK=dD;eL=dC;break L1299}}}else{eG=er;eH=es;eI=et;eJ=eu;eK=a6;eL=be}}while(0);be=b[a2+(eK<<2)+2>>1]|0;a6=a[a2+(eK<<2)|0]|0;c[R>>2]=ex;ey=a6;ez=eL;eA=be;eB=eJ-ex|0;eC=eI>>>(ex>>>0);eD=eH;eE=eG;eF=ex}}while(0);a2=ez&255;bj=eC>>>(a2>>>0);bi=eB-a2|0;c[R>>2]=eF+a2|0;c[I>>2]=eA&65535;a2=ey&255;if(ey<<24>>24==0){c[q>>2]=25;bC=b3;bD=ao;bE=bi;bF=bj;bG=ar;bH=eD;bI=as;bJ=eE;break}if((a2&32|0)!=0){c[R>>2]=-1;c[q>>2]=11;bC=b3;bD=ao;bE=bi;bF=bj;bG=ar;bH=eD;bI=as;bJ=eE;break}if((a2&64|0)==0){a3=a2&15;c[T>>2]=a3;c[q>>2]=21;aC=b3;aE=bi;aF=bj;aG=eD;aH=eE;aI=a3;ax=982;break}else{c[E>>2]=5256016;c[q>>2]=29;bC=b3;bD=ao;bE=bi;bF=bj;bG=ar;bH=eD;bI=as;bJ=eE;break}}}while(0);do{if((ax|0)==838){ax=0;bj=c[C>>2]|0;if((bj&1024|0)==0){eM=aT;eN=aU;eO=bj}else{bi=c[I>>2]|0;a3=bi>>>0>aT>>>0?aT:bi;if((a3|0)==0){eP=aT;eQ=aU;eR=bi;eS=bj}else{a2=c[D>>2]|0;do{if((a2|0)==0){eT=bj}else{be=c[a2+16>>2]|0;if((be|0)==0){eT=bj;break}a6=(c[a2+20>>2]|0)-bi|0;u=c[a2+24>>2]|0;bu(be+a6|0,aU|0,((a6+a3|0)>>>0>u>>>0?u-a6|0:a3)|0);eT=c[C>>2]|0}}while(0);if((eT&512|0)!=0){c[z>>2]=bo(c[z>>2]|0,aU,a3)|0}a2=(c[I>>2]|0)-a3|0;c[I>>2]=a2;eP=aT-a3|0;eQ=aU+a3|0;eR=a2;eS=eT}if((eR|0)==0){eM=eP;eN=eQ;eO=eS}else{br=j;bs=aR;bt=aS;bv=eP;bw=eQ;bx=ar;ax=1046;break L1045}}c[I>>2]=0;c[q>>2]=6;aV=aR;aW=aS;aX=eM;aY=eN;aZ=eO;ax=848;break}else if((ax|0)==982){ax=0;if((aI|0)==0){eU=aE;eV=aF;eW=aG;eX=aH;eY=c[I>>2]|0}else{L1333:do{if(aE>>>0<aI>>>0){a2=aH;bi=aG;bj=aF;a6=aE;while(1){if((bi|0)==0){a7=aC;a8=ao;a9=a6;ba=bj;bb=0;bc=a2;bd=ar;break L1045}u=bi-1|0;be=a2+1|0;a5=((d[a2]|0)<<a6)+bj|0;dy=a6+8|0;if(dy>>>0<aI>>>0){a2=be;bi=u;bj=a5;a6=dy}else{eZ=be;e_=u;e$=a5;e0=dy;break L1333}}}else{eZ=aH;e_=aG;e$=aF;e0=aE}}while(0);a3=(c[I>>2]|0)+((1<<aI)-1&e$)|0;c[I>>2]=a3;c[R>>2]=(c[R>>2]|0)+aI|0;eU=e0-aI|0;eV=e$>>>(aI>>>0);eW=e_;eX=eZ;eY=a3}c[U>>2]=eY;c[q>>2]=22;ci=aC;cj=eU;ck=eV;cl=eW;cm=eX;ax=989;break}}while(0);do{if((ax|0)==848){ax=0;do{if((aZ&2048|0)==0){a3=c[D>>2]|0;if((a3|0)==0){e1=aX;e2=aY;break}c[a3+28>>2]=0;e1=aX;e2=aY}else{if((aX|0)==0){br=j;bs=aV;bt=aW;bv=0;bw=aY;bx=ar;ax=1046;break L1045}else{e3=0}while(1){e4=e3+1|0;a3=a[aY+e3|0]|0;a6=c[D>>2]|0;do{if((a6|0)!=0){bj=a6+28|0;if((c[bj>>2]|0)==0){break}bi=c[I>>2]|0;if(bi>>>0>=(c[a6+32>>2]|0)>>>0){break}c[I>>2]=bi+1|0;a[(c[bj>>2]|0)+bi|0]=a3}}while(0);e5=a3<<24>>24!=0;if(e5&e4>>>0<aX>>>0){e3=e4}else{break}}if((c[C>>2]&512|0)!=0){c[z>>2]=bo(c[z>>2]|0,aY,e4)|0}a6=aX-e4|0;bi=aY+e4|0;if(e5){br=j;bs=aV;bt=aW;bv=a6;bw=bi;bx=ar;ax=1046;break L1045}else{e1=a6;e2=bi}}}while(0);c[I>>2]=0;c[q>>2]=7;aN=aV;aO=aW;aP=e1;aQ=e2;ax=861;break}else if((ax|0)==989){ax=0;bi=(1<<c[P>>2])-1|0;a6=bi&ck;bj=c[am>>2]|0;a2=a[bj+(a6<<2)+1|0]|0;dy=a2&255;L1358:do{if(dy>>>0>cj>>>0){a5=cm;u=cl;be=ck;dx=cj;while(1){if((u|0)==0){a7=ci;a8=ao;a9=dx;ba=be;bb=0;bc=a5;bd=ar;break L1045}bh=u-1|0;a4=a5+1|0;dC=((d[a5]|0)<<dx)+be|0;dD=dx+8|0;du=bi&dC;dt=a[bj+(du<<2)+1|0]|0;dw=dt&255;if(dw>>>0>dD>>>0){a5=a4;u=bh;be=dC;dx=dD}else{e6=a4;e7=bh;e8=dC;e9=dD;fa=dt;fb=du;fc=dw;break L1358}}}else{e6=cm;e7=cl;e8=ck;e9=cj;fa=a2;fb=a6;fc=dy}}while(0);dy=a[bj+(fb<<2)|0]|0;a6=b[bj+(fb<<2)+2>>1]|0;a2=dy&255;if((a2&240|0)==0){bi=a6&65535;dx=(1<<fc+a2)-1|0;a2=((e8&dx)>>>(fc>>>0))+bi|0;be=a[bj+(a2<<2)+1|0]|0;L1366:do{if(((be&255)+fc|0)>>>0>e9>>>0){u=e6;a5=e7;dw=e8;du=e9;while(1){if((a5|0)==0){a7=ci;a8=ao;a9=du;ba=dw;bb=0;bc=u;bd=ar;break L1045}dt=a5-1|0;dD=u+1|0;dC=((d[u]|0)<<du)+dw|0;bh=du+8|0;a4=((dC&dx)>>>(fc>>>0))+bi|0;ds=a[bj+(a4<<2)+1|0]|0;if(((ds&255)+fc|0)>>>0>bh>>>0){u=dD;a5=dt;dw=dC;du=bh}else{fd=dD;fe=dt;ff=dC;fg=bh;fh=a4;fi=ds;break L1366}}}else{fd=e6;fe=e7;ff=e8;fg=e9;fh=a2;fi=be}}while(0);be=b[bj+(fh<<2)+2>>1]|0;a2=a[bj+(fh<<2)|0]|0;bi=(c[R>>2]|0)+fc|0;c[R>>2]=bi;fj=a2;fk=fi;fl=be;fm=fg-fc|0;fn=ff>>>(fc>>>0);fo=fe;fp=fd;fq=bi}else{fj=dy;fk=fa;fl=a6;fm=e9;fn=e8;fo=e7;fp=e6;fq=c[R>>2]|0}bi=fk&255;be=fn>>>(bi>>>0);a2=fm-bi|0;c[R>>2]=fq+bi|0;bi=fj&255;if((bi&64|0)==0){c[V>>2]=fl&65535;dx=bi&15;c[T>>2]=dx;c[q>>2]=23;c9=ci;da=a2;db=be;dc=fo;dd=fp;de=dx;ax=1001;break}else{c[E>>2]=5256120;c[q>>2]=29;bC=ci;bD=ao;bE=a2;bF=be;bG=ar;bH=fo;bI=as;bJ=fp;break}}}while(0);do{if((ax|0)==861){ax=0;do{if((c[C>>2]&4096|0)==0){be=c[D>>2]|0;if((be|0)==0){fr=aP;fs=aQ;break}c[be+36>>2]=0;fr=aP;fs=aQ}else{if((aP|0)==0){br=j;bs=aN;bt=aO;bv=0;bw=aQ;bx=ar;ax=1046;break L1045}else{ft=0}while(1){fu=ft+1|0;be=a[aQ+ft|0]|0;a2=c[D>>2]|0;do{if((a2|0)!=0){dx=a2+36|0;if((c[dx>>2]|0)==0){break}bi=c[I>>2]|0;if(bi>>>0>=(c[a2+40>>2]|0)>>>0){break}c[I>>2]=bi+1|0;a[(c[dx>>2]|0)+bi|0]=be}}while(0);fv=be<<24>>24!=0;if(fv&fu>>>0<aP>>>0){ft=fu}else{break}}if((c[C>>2]&512|0)!=0){c[z>>2]=bo(c[z>>2]|0,aQ,fu)|0}a2=aP-fu|0;a3=aQ+fu|0;if(fv){br=j;bs=aN;bt=aO;bv=a2;bw=a3;bx=ar;ax=1046;break L1045}else{fr=a2;fs=a3}}}while(0);c[q>>2]=8;ay=aN;az=aO;aA=fr;aB=fs;ax=874;break}else if((ax|0)==1001){ax=0;if((de|0)==0){fw=da;fx=db;fy=dc;fz=dd}else{L1396:do{if(da>>>0<de>>>0){a6=dd;dy=dc;bj=db;a3=da;while(1){if((dy|0)==0){a7=c9;a8=ao;a9=a3;ba=bj;bb=0;bc=a6;bd=ar;break L1045}a2=dy-1|0;bi=a6+1|0;dx=((d[a6]|0)<<a3)+bj|0;du=a3+8|0;if(du>>>0<de>>>0){a6=bi;dy=a2;bj=dx;a3=du}else{fA=bi;fB=a2;fC=dx;fD=du;break L1396}}}else{fA=dd;fB=dc;fC=db;fD=da}}while(0);c[V>>2]=(c[V>>2]|0)+((1<<de)-1&fC)|0;c[R>>2]=(c[R>>2]|0)+de|0;fw=fD-de|0;fx=fC>>>(de>>>0);fy=fB;fz=fA}c[q>>2]=24;ct=c9;cu=fw;cv=fx;cw=fy;cx=fz;ax=1007;break}}while(0);L1402:do{if((ax|0)==874){ax=0;a3=c[C>>2]|0;do{if((a3&512|0)==0){fE=ay;fF=az;fG=aA;fH=aB}else{L1406:do{if(ay>>>0<16){bj=aB;dy=aA;a6=az;du=ay;while(1){if((dy|0)==0){a7=j;a8=ao;a9=du;ba=a6;bb=0;bc=bj;bd=ar;break L1045}dx=dy-1|0;a2=bj+1|0;bi=((d[bj]|0)<<du)+a6|0;dw=du+8|0;if(dw>>>0<16){bj=a2;dy=dx;a6=bi;du=dw}else{fI=a2;fJ=dx;fK=bi;fL=dw;break L1406}}}else{fI=aB;fJ=aA;fK=az;fL=ay}}while(0);if((fK|0)==(c[z>>2]&65535|0)){fE=0;fF=0;fG=fJ;fH=fI;break}c[E>>2]=5255884;c[q>>2]=29;bC=j;bD=ao;bE=fL;bF=fK;bG=ar;bH=fJ;bI=as;bJ=fI;break L1402}}while(0);du=c[D>>2]|0;if((du|0)!=0){c[du+44>>2]=a3>>>9&1;c[(c[D>>2]|0)+48>>2]=1}c[z>>2]=0;c[H>>2]=0;c[q>>2]=11;bC=j;bD=ao;bE=fE;bF=fF;bG=ar;bH=fG;bI=as;bJ=fH}else if((ax|0)==1007){ax=0;if((ar|0)==0){br=ct;bs=cu;bt=cv;bv=cw;bw=cx;bx=0;ax=1046;break L1045}du=ao-ar|0;a6=c[V>>2]|0;if(a6>>>0>du>>>0){dy=a6-du|0;do{if(dy>>>0>(c[W>>2]|0)>>>0){if((c[X>>2]|0)==0){break}c[E>>2]=5255764;c[q>>2]=29;bC=ct;bD=ao;bE=cu;bF=cv;bG=ar;bH=cw;bI=as;bJ=cx;break L1402}}while(0);a3=c[Y>>2]|0;if(dy>>>0>a3>>>0){du=dy-a3|0;fM=(c[Z>>2]|0)+((c[_>>2]|0)-du|0)|0;fN=du}else{fM=(c[Z>>2]|0)+(a3-dy|0)|0;fN=dy}a3=c[I>>2]|0;fO=fM;fP=fN>>>0>a3>>>0?a3:fN;fQ=a3}else{a3=c[I>>2]|0;fO=as+(-a6|0)|0;fP=a3;fQ=a3}a3=fP>>>0>ar>>>0?ar:fP;c[I>>2]=fQ-a3|0;du=ar^-1;bj=fP^-1;be=du>>>0>bj>>>0?du:bj;bj=fO;du=a3;dw=as;while(1){a[dw]=a[bj]|0;bi=du-1|0;if((bi|0)==0){break}else{bj=bj+1|0;du=bi;dw=dw+1|0}}dw=ar-a3|0;du=as+(be^-1)|0;if((c[I>>2]|0)!=0){bC=ct;bD=ao;bE=cu;bF=cv;bG=dw;bH=cw;bI=du;bJ=cx;break}c[q>>2]=20;bC=ct;bD=ao;bE=cu;bF=cv;bG=dw;bH=cw;bI=du;bJ=cx}}while(0);j=bC;ao=bD;ap=bE;aq=bF;ar=bG;p=bH;as=bI;s=bJ;t=c[q>>2]|0}if((ax|0)==887){c[m>>2]=as;c[r>>2]=ar;c[o>>2]=aw;c[n>>2]=av;c[w>>2]=au;c[x>>2]=at;k=2;i=h;return k|0}else if((ax|0)==898){a7=j;a8=ao;a9=ei-3|0;ba=eh>>>3;bb=eg;bc=ef;bd=ar}else if((ax|0)==1045){c[q>>2]=28;a7=1;a8=bV;a9=df;ba=dg;bb=dh;bc=di;bd=ar}else if((ax|0)==1046){a7=br;a8=ao;a9=bs;ba=bt;bb=bv;bc=bw;bd=bx}else if((ax|0)==1062){k=-4;i=h;return k|0}else if((ax|0)==1069){i=h;return k|0}c[m>>2]=as;c[r>>2]=bd;c[o>>2]=bc;c[n>>2]=bb;c[w>>2]=ba;c[x>>2]=a9;do{if((c[_>>2]|0)==0){a9=c[r>>2]|0;if((a8|0)==(a9|0)){fR=a8;break}ba=c[q>>2]|0;if(ba>>>0>=29){fR=a9;break}if(ba>>>0>25&(g|0)==4){fR=a9;break}else{ax=1051;break}}else{ax=1051}}while(0);do{if((ax|0)==1051){if((bf(f,a8)|0)==0){fR=c[r>>2]|0;break}c[q>>2]=30;k=-4;i=h;return k|0}}while(0);r=c[n>>2]|0;n=a8-fR|0;ax=f+8|0;c[ax>>2]=(v-r|0)+(c[ax>>2]|0)|0;c[$>>2]=(c[$>>2]|0)+n|0;c[aa>>2]=(c[aa>>2]|0)+n|0;aa=(a8|0)==(fR|0);if(!((c[y>>2]|0)==0|aa)){y=c[z>>2]|0;fR=(c[m>>2]|0)+(-n|0)|0;if((c[C>>2]|0)==0){fS=bn(y,fR,n)|0}else{fS=bo(y,fR,n)|0}c[z>>2]=fS;c[H>>2]=fS}fS=c[q>>2]|0;if((fS|0)==19){fT=256}else{fT=(fS|0)==14?256:0}c[f+44>>2]=((((c[L>>2]|0)!=0?64:0)+(c[x>>2]|0)|0)+((fS|0)==11?128:0)|0)+fT|0;k=((v|0)==(r|0)&aa|(g|0)==4)&(a7|0)==0?-5:a7;i=h;return k|0}function bc(a){a=a|0;var d=0,e=0;d=0;while(1){b[a+148+(d<<2)>>1]=0;e=d+1|0;if((e|0)==286){break}else{d=e}}b[a+2440>>1]=0;b[a+2444>>1]=0;b[a+2448>>1]=0;b[a+2452>>1]=0;b[a+2456>>1]=0;b[a+2460>>1]=0;b[a+2464>>1]=0;b[a+2468>>1]=0;b[a+2472>>1]=0;b[a+2476>>1]=0;b[a+2480>>1]=0;b[a+2484>>1]=0;b[a+2488>>1]=0;b[a+2492>>1]=0;b[a+2496>>1]=0;b[a+2500>>1]=0;b[a+2504>>1]=0;b[a+2508>>1]=0;b[a+2512>>1]=0;b[a+2516>>1]=0;b[a+2520>>1]=0;b[a+2524>>1]=0;b[a+2528>>1]=0;b[a+2532>>1]=0;b[a+2536>>1]=0;b[a+2540>>1]=0;b[a+2544>>1]=0;b[a+2548>>1]=0;b[a+2552>>1]=0;b[a+2556>>1]=0;b[a+2684>>1]=0;b[a+2688>>1]=0;b[a+2692>>1]=0;b[a+2696>>1]=0;b[a+2700>>1]=0;b[a+2704>>1]=0;b[a+2708>>1]=0;b[a+2712>>1]=0;b[a+2716>>1]=0;b[a+2720>>1]=0;b[a+2724>>1]=0;b[a+2728>>1]=0;b[a+2732>>1]=0;b[a+2736>>1]=0;b[a+2740>>1]=0;b[a+2744>>1]=0;b[a+2748>>1]=0;b[a+2752>>1]=0;b[a+2756>>1]=0;b[a+1172>>1]=1;c[a+5804>>2]=0;c[a+5800>>2]=0;c[a+5808>>2]=0;c[a+5792>>2]=0;return}function bd(d,f,g,h){d=d|0;f=f|0;g=g|0;h=h|0;var i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0;i=d+5820|0;j=c[i>>2]|0;k=h&65535;h=d+5816|0;l=e[h>>1]|0|k<<j;m=l&65535;b[h>>1]=m;if((j|0)>13){n=d+20|0;o=c[n>>2]|0;c[n>>2]=o+1|0;p=d+8|0;a[(c[p>>2]|0)+o|0]=l&255;l=(e[h>>1]|0)>>>8&255;o=c[n>>2]|0;c[n>>2]=o+1|0;a[(c[p>>2]|0)+o|0]=l;l=c[i>>2]|0;o=k>>>((16-l|0)>>>0)&65535;b[h>>1]=o;q=l-13|0;r=o}else{q=j+3|0;r=m}c[i>>2]=q;do{if((q|0)>8){m=d+20|0;j=c[m>>2]|0;c[m>>2]=j+1|0;o=d+8|0;a[(c[o>>2]|0)+j|0]=r&255;j=(e[h>>1]|0)>>>8&255;l=c[m>>2]|0;c[m>>2]=l+1|0;a[(c[o>>2]|0)+l|0]=j;s=m;t=o}else{if((q|0)>0){o=d+20|0;m=c[o>>2]|0;c[o>>2]=m+1|0;j=d+8|0;a[(c[j>>2]|0)+m|0]=r&255;s=o;t=j;break}else{s=d+20|0;t=d+8|0;break}}}while(0);b[h>>1]=0;c[i>>2]=0;i=c[s>>2]|0;c[s>>2]=i+1|0;a[(c[t>>2]|0)+i|0]=g&255;i=c[s>>2]|0;c[s>>2]=i+1|0;a[(c[t>>2]|0)+i|0]=g>>>8&255;i=g&65535^65535;h=c[s>>2]|0;c[s>>2]=h+1|0;a[(c[t>>2]|0)+h|0]=i&255;h=c[s>>2]|0;c[s>>2]=h+1|0;a[(c[t>>2]|0)+h|0]=i>>>8&255;if((g|0)==0){return}else{u=g;v=f}while(1){f=u-1|0;g=a[v]|0;i=c[s>>2]|0;c[s>>2]=i+1|0;a[(c[t>>2]|0)+i|0]=g;if((f|0)==0){break}else{u=f;v=v+1|0}}return}function be(d){d=d|0;var f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0;f=d+5820|0;g=c[f>>2]|0;h=d+5816|0;i=e[h>>1]|0|2<<g;j=i&65535;b[h>>1]=j;if((g|0)>13){k=d+20|0;l=c[k>>2]|0;c[k>>2]=l+1|0;m=d+8|0;a[(c[m>>2]|0)+l|0]=i&255;i=(e[h>>1]|0)>>>8&255;l=c[k>>2]|0;c[k>>2]=l+1|0;a[(c[m>>2]|0)+l|0]=i;i=c[f>>2]|0;l=2>>>((16-i|0)>>>0)&65535;b[h>>1]=l;n=i-13|0;o=l}else{n=g+3|0;o=j}c[f>>2]=n;if((n|0)>9){j=d+20|0;g=c[j>>2]|0;c[j>>2]=g+1|0;l=d+8|0;a[(c[l>>2]|0)+g|0]=o&255;g=(e[h>>1]|0)>>>8&255;i=c[j>>2]|0;c[j>>2]=i+1|0;a[(c[l>>2]|0)+i|0]=g;b[h>>1]=0;p=(c[f>>2]|0)-9|0;q=0}else{p=n+7|0;q=o}c[f>>2]=p;if((p|0)==16){o=d+20|0;n=c[o>>2]|0;c[o>>2]=n+1|0;g=d+8|0;a[(c[g>>2]|0)+n|0]=q&255;n=(e[h>>1]|0)>>>8&255;i=c[o>>2]|0;c[o>>2]=i+1|0;a[(c[g>>2]|0)+i|0]=n;b[h>>1]=0;c[f>>2]=0;return}if((p|0)<=7){return}p=d+20|0;n=c[p>>2]|0;c[p>>2]=n+1|0;a[(c[d+8>>2]|0)+n|0]=q&255;b[h>>1]=(e[h>>1]|0)>>>8;c[f>>2]=(c[f>>2]|0)-8|0;return}function bf(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0;d=c[a+28>>2]|0;e=d+52|0;f=e;g=c[f>>2]|0;do{if((g|0)==0){h=aG[c[a+32>>2]&15](c[a+40>>2]|0,1<<c[d+36>>2],1)|0;c[e>>2]=h;if((h|0)==0){i=1}else{j=h;break}return i|0}else{j=g}}while(0);g=d+40|0;e=c[g>>2]|0;if((e|0)==0){h=1<<c[d+36>>2];c[g>>2]=h;c[d+48>>2]=0;c[d+44>>2]=0;k=h}else{k=e}e=b-(c[a+16>>2]|0)|0;if(e>>>0>=k>>>0){bu(j|0,(c[a+12>>2]|0)+(-k|0)|0,k|0);c[d+48>>2]=0;c[d+44>>2]=c[g>>2]|0;i=0;return i|0}b=d+48|0;h=c[b>>2]|0;l=k-h|0;k=l>>>0>e>>>0?e:l;l=a+12|0;bu(j+h|0,(c[l>>2]|0)+(-e|0)|0,k|0);h=e-k|0;if((e|0)!=(k|0)){bu(c[f>>2]|0,(c[l>>2]|0)+(-h|0)|0,h|0);c[b>>2]=h;c[d+44>>2]=c[g>>2]|0;i=0;return i|0}h=(c[b>>2]|0)+e|0;c[b>>2]=h;l=c[g>>2]|0;if((h|0)==(l|0)){c[b>>2]=0}b=d+44|0;d=c[b>>2]|0;if(d>>>0>=l>>>0){i=0;return i|0}c[b>>2]=d+e|0;i=0;return i|0}function bg(d,f,g,h,j,k){d=d|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0;l=i;i=i+32|0;m=l|0;n=i;i=i+32|0;bt(m|0,0,32);o=(g|0)==0;L1529:do{if(!o){p=0;while(1){q=m+((e[f+(p<<1)>>1]|0)<<1)|0;b[q>>1]=(b[q>>1]|0)+1&65535;q=p+1|0;if((q|0)==(g|0)){break L1529}else{p=q}}}}while(0);p=c[j>>2]|0;q=15;while(1){if((q|0)==0){r=1127;break}if(b[m+(q<<1)>>1]<<16>>16==0){q=q-1|0}else{break}}if((r|0)==1127){s=c[h>>2]|0;c[h>>2]=s+4|0;a[s|0]=64;a[s+1|0]=1;b[s+2>>1]=0;s=c[h>>2]|0;c[h>>2]=s+4|0;a[s|0]=64;a[s+1|0]=1;b[s+2>>1]=0;c[j>>2]=1;t=0;i=l;return t|0}s=p>>>0>q>>>0?q:p;p=1;while(1){if(p>>>0>=q>>>0){break}if(b[m+(p<<1)>>1]<<16>>16==0){p=p+1|0}else{break}}u=s>>>0<p>>>0?p:s;s=1;v=1;while(1){if(v>>>0>=16){break}w=(s<<1)-(e[m+(v<<1)>>1]|0)|0;if((w|0)<0){t=-1;r=1169;break}else{s=w;v=v+1|0}}if((r|0)==1169){i=l;return t|0}do{if((s|0)>0){if((d|0)!=0&(q|0)==1){break}else{t=-1}i=l;return t|0}}while(0);b[n+2>>1]=0;s=b[m+2>>1]|0;b[n+4>>1]=s;v=(b[m+4>>1]|0)+s&65535;b[n+6>>1]=v;s=(b[m+6>>1]|0)+v&65535;b[n+8>>1]=s;v=(b[m+8>>1]|0)+s&65535;b[n+10>>1]=v;s=(b[m+10>>1]|0)+v&65535;b[n+12>>1]=s;v=(b[m+12>>1]|0)+s&65535;b[n+14>>1]=v;s=(b[m+14>>1]|0)+v&65535;b[n+16>>1]=s;v=(b[m+16>>1]|0)+s&65535;b[n+18>>1]=v;s=(b[m+18>>1]|0)+v&65535;b[n+20>>1]=s;v=(b[m+20>>1]|0)+s&65535;b[n+22>>1]=v;s=(b[m+22>>1]|0)+v&65535;b[n+24>>1]=s;v=(b[m+24>>1]|0)+s&65535;b[n+26>>1]=v;s=(b[m+26>>1]|0)+v&65535;b[n+28>>1]=s;b[n+30>>1]=(b[m+28>>1]|0)+s&65535;L1554:do{if(!o){s=0;while(1){v=b[f+(s<<1)>>1]|0;if(v<<16>>16!=0){w=n+((v&65535)<<1)|0;v=b[w>>1]|0;b[w>>1]=v+1&65535;b[k+((v&65535)<<1)>>1]=s&65535}v=s+1|0;if((v|0)==(g|0)){break L1554}else{s=v}}}}while(0);do{if((d|0)==0){x=0;y=1<<u;z=19;A=k;B=k;C=0}else if((d|0)==1){g=1<<u;if(g>>>0>851){t=1}else{x=1;y=g;z=256;A=5243722;B=5243786;C=0;break}i=l;return t|0}else{g=1<<u;n=(d|0)==2;if(n&g>>>0>591){t=1}else{x=0;y=g;z=-1;A=5244364;B=5244428;C=n;break}i=l;return t|0}}while(0);d=y-1|0;n=u&255;g=c[h>>2]|0;o=-1;s=0;v=y;y=0;w=u;D=0;E=p;L1568:while(1){p=1<<w;F=s;G=D;H=E;while(1){I=H-y|0;J=I&255;K=b[k+(G<<1)>>1]|0;L=K&65535;do{if((L|0)<(z|0)){M=0;N=K}else{if((L|0)<=(z|0)){M=96;N=0;break}M=b[A+(L<<1)>>1]&255;N=b[B+(L<<1)>>1]|0}}while(0);L=1<<I;K=F>>>(y>>>0);O=p;while(1){P=O-L|0;Q=P+K|0;a[g+(Q<<2)|0]=M;a[g+(Q<<2)+1|0]=J;b[g+(Q<<2)+2>>1]=N;if((O|0)==(L|0)){break}else{O=P}}O=1<<H-1;while(1){if((O&F|0)==0){break}else{O=O>>>1}}if((O|0)==0){R=0}else{R=(O-1&F)+O|0}S=G+1|0;L=m+(H<<1)|0;K=(b[L>>1]|0)-1&65535;b[L>>1]=K;if(K<<16>>16==0){if((H|0)==(q|0)){break L1568}T=e[f+((e[k+(S<<1)>>1]|0)<<1)>>1]|0}else{T=H}if(T>>>0<=u>>>0){F=R;G=S;H=T;continue}U=R&d;if((U|0)==(o|0)){F=R;G=S;H=T}else{break}}H=(y|0)==0?u:y;G=g+(p<<2)|0;F=T-H|0;L1591:do{if(T>>>0<q>>>0){K=F;L=1<<F;I=T;while(1){P=L-(e[m+(I<<1)>>1]|0)|0;if((P|0)<1){V=K;break L1591}Q=K+1|0;W=Q+H|0;if(W>>>0<q>>>0){K=Q;L=P<<1;I=W}else{V=Q;break L1591}}}else{V=F}}while(0);F=(1<<V)+v|0;if(x&F>>>0>851|C&F>>>0>591){t=1;r=1173;break}a[(c[h>>2]|0)+(U<<2)|0]=V&255;a[(c[h>>2]|0)+(U<<2)+1|0]=n;p=c[h>>2]|0;b[p+(U<<2)+2>>1]=(G-p|0)>>>2&65535;g=G;o=U;s=R;v=F;y=H;w=V;D=S;E=T}if((r|0)==1173){i=l;return t|0}if((R|0)!=0){a[g+(R<<2)|0]=64;a[g+(R<<2)+1|0]=J;b[g+(R<<2)+2>>1]=0}c[h>>2]=(c[h>>2]|0)+(v<<2)|0;c[j>>2]=u;t=0;i=l;return t|0}function bh(f,g,h,i){f=f|0;g=g|0;h=h|0;i=i|0;var j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0;if((c[f+132>>2]|0)>0){j=(c[f>>2]|0)+44|0;if((c[j>>2]|0)==2){k=-201342849;l=0;while(1){if((k&1|0)!=0){if(b[f+148+(l<<2)>>1]<<16>>16!=0){m=0;break}}n=l+1|0;if((n|0)<32){k=k>>>1;l=n}else{o=1181;break}}L1615:do{if((o|0)==1181){if(b[f+184>>1]<<16>>16!=0){m=1;break}if(b[f+188>>1]<<16>>16!=0){m=1;break}if(b[f+200>>1]<<16>>16==0){p=32}else{m=1;break}while(1){if((p|0)>=256){m=0;break L1615}if(b[f+148+(p<<2)>>1]<<16>>16==0){p=p+1|0}else{m=1;break L1615}}}}while(0);c[j>>2]=m}bi(f,f+2840|0);bi(f,f+2852|0);m=c[f+2844>>2]|0;j=b[f+150>>1]|0;p=j<<16>>16==0;b[f+148+(m+1<<2)+2>>1]=-1;o=f+2752|0;l=f+2756|0;k=f+2748|0;n=p?3:4;q=p?138:7;p=j&65535;j=0;r=-1;L1624:while(1){s=0;t=j;while(1){if((t|0)>(m|0)){break L1624}u=t+1|0;v=b[f+148+(u<<2)+2>>1]|0;w=v&65535;x=s+1|0;y=(p|0)==(w|0);if((x|0)<(q|0)&y){s=x;t=u}else{break}}do{if((x|0)<(n|0)){t=f+2684+(p<<2)|0;b[t>>1]=(e[t>>1]|0)+x&65535}else{if((p|0)==0){if((x|0)<11){b[o>>1]=(b[o>>1]|0)+1&65535;break}else{b[l>>1]=(b[l>>1]|0)+1&65535;break}}else{if((p|0)!=(r|0)){t=f+2684+(p<<2)|0;b[t>>1]=(b[t>>1]|0)+1&65535}b[k>>1]=(b[k>>1]|0)+1&65535;break}}}while(0);if(v<<16>>16==0){n=3;q=138;r=p;p=w;j=u;continue}n=y?3:4;q=y?6:7;r=p;p=w;j=u}u=c[f+2856>>2]|0;j=b[f+2442>>1]|0;w=j<<16>>16==0;b[f+2440+(u+1<<2)+2>>1]=-1;p=w?3:4;r=w?138:7;w=j&65535;j=0;y=-1;L1645:while(1){q=0;n=j;while(1){if((n|0)>(u|0)){break L1645}z=n+1|0;A=b[f+2440+(z<<2)+2>>1]|0;B=A&65535;C=q+1|0;D=(w|0)==(B|0);if((C|0)<(r|0)&D){q=C;n=z}else{break}}do{if((C|0)<(p|0)){n=f+2684+(w<<2)|0;b[n>>1]=(e[n>>1]|0)+C&65535}else{if((w|0)==0){if((C|0)<11){b[o>>1]=(b[o>>1]|0)+1&65535;break}else{b[l>>1]=(b[l>>1]|0)+1&65535;break}}else{if((w|0)!=(y|0)){n=f+2684+(w<<2)|0;b[n>>1]=(b[n>>1]|0)+1&65535}b[k>>1]=(b[k>>1]|0)+1&65535;break}}}while(0);if(A<<16>>16==0){p=3;r=138;y=w;w=B;j=z;continue}p=D?3:4;r=D?6:7;y=w;w=B;j=z}bi(f,f+2864|0);z=18;while(1){if((z|0)<=2){break}if(b[f+2684+((d[z+5255332|0]|0)<<2)+2>>1]<<16>>16==0){z=z-1|0}else{break}}j=f+5800|0;B=((z*3&-1)+17|0)+(c[j>>2]|0)|0;c[j>>2]=B;j=(B+10|0)>>>3;B=((c[f+5804>>2]|0)+10|0)>>>3;E=B>>>0>j>>>0?j:B;F=B;G=z}else{z=h+5|0;E=z;F=z;G=0}do{if((h+4|0)>>>0>E>>>0|(g|0)==0){z=f+5820|0;B=c[z>>2]|0;j=(B|0)>13;if((c[f+136>>2]|0)==4|(F|0)==(E|0)){w=i+2&65535;y=f+5816|0;D=e[y>>1]|0|w<<B;b[y>>1]=D&65535;if(j){r=f+20|0;p=c[r>>2]|0;c[r>>2]=p+1|0;A=f+8|0;a[(c[A>>2]|0)+p|0]=D&255;D=(e[y>>1]|0)>>>8&255;p=c[r>>2]|0;c[r>>2]=p+1|0;a[(c[A>>2]|0)+p|0]=D;D=c[z>>2]|0;b[y>>1]=w>>>((16-D|0)>>>0)&65535;H=D-13|0}else{H=B+3|0}c[z>>2]=H;bj(f,5242880,5244052);break}D=i+4&65535;w=f+5816|0;y=e[w>>1]|0|D<<B;b[w>>1]=y&65535;if(j){j=f+20|0;p=c[j>>2]|0;c[j>>2]=p+1|0;A=f+8|0;a[(c[A>>2]|0)+p|0]=y&255;p=(e[w>>1]|0)>>>8&255;r=c[j>>2]|0;c[j>>2]=r+1|0;a[(c[A>>2]|0)+r|0]=p;p=c[z>>2]|0;r=D>>>((16-p|0)>>>0);b[w>>1]=r&65535;I=p-13|0;J=r}else{I=B+3|0;J=y}c[z>>2]=I;y=c[f+2844>>2]|0;B=c[f+2856>>2]|0;r=G+1|0;p=y+65280&65535;D=J&65535|p<<I;b[w>>1]=D&65535;if((I|0)>11){A=f+20|0;j=c[A>>2]|0;c[A>>2]=j+1|0;k=f+8|0;a[(c[k>>2]|0)+j|0]=D&255;j=(e[w>>1]|0)>>>8&255;l=c[A>>2]|0;c[A>>2]=l+1|0;a[(c[k>>2]|0)+l|0]=j;j=c[z>>2]|0;l=p>>>((16-j|0)>>>0);b[w>>1]=l&65535;K=j-11|0;L=l}else{K=I+5|0;L=D}c[z>>2]=K;D=B&65535;l=D<<K|L&65535;b[w>>1]=l&65535;if((K|0)>11){j=f+20|0;p=c[j>>2]|0;c[j>>2]=p+1|0;k=f+8|0;a[(c[k>>2]|0)+p|0]=l&255;p=(e[w>>1]|0)>>>8&255;A=c[j>>2]|0;c[j>>2]=A+1|0;a[(c[k>>2]|0)+A|0]=p;p=c[z>>2]|0;A=D>>>((16-p|0)>>>0);b[w>>1]=A&65535;M=p-11|0;N=A}else{M=K+5|0;N=l}c[z>>2]=M;l=G+65533&65535;A=l<<M|N&65535;b[w>>1]=A&65535;if((M|0)>12){p=f+20|0;D=c[p>>2]|0;c[p>>2]=D+1|0;k=f+8|0;a[(c[k>>2]|0)+D|0]=A&255;D=(e[w>>1]|0)>>>8&255;j=c[p>>2]|0;c[p>>2]=j+1|0;a[(c[k>>2]|0)+j|0]=D;D=c[z>>2]|0;j=l>>>((16-D|0)>>>0);b[w>>1]=j&65535;O=D-12|0;P=j}else{O=M+4|0;P=A}c[z>>2]=O;L1697:do{if((r|0)>0){A=f+20|0;j=f+8|0;D=0;l=O;k=P;while(1){p=e[f+2684+((d[D+5255332|0]|0)<<2)+2>>1]|0;o=p<<l|k&65535;b[w>>1]=o&65535;if((l|0)>13){C=c[A>>2]|0;c[A>>2]=C+1|0;a[(c[j>>2]|0)+C|0]=o&255;C=(e[w>>1]|0)>>>8&255;u=c[A>>2]|0;c[A>>2]=u+1|0;a[(c[j>>2]|0)+u|0]=C;C=c[z>>2]|0;u=p>>>((16-C|0)>>>0);b[w>>1]=u&65535;Q=C-13|0;R=u}else{Q=l+3|0;R=o}c[z>>2]=Q;o=D+1|0;if((o|0)==(r|0)){break L1697}else{D=o;l=Q;k=R}}}}while(0);r=f+148|0;bk(f,r,y);z=f+2440|0;bk(f,z,B);bj(f,r,z)}else{bd(f,g,h,i)}}while(0);bc(f);if((i|0)==0){return}i=f+5820|0;h=c[i>>2]|0;do{if((h|0)>8){g=f+5816|0;R=b[g>>1]&255;Q=f+20|0;P=c[Q>>2]|0;c[Q>>2]=P+1|0;O=f+8|0;a[(c[O>>2]|0)+P|0]=R;R=(e[g>>1]|0)>>>8&255;P=c[Q>>2]|0;c[Q>>2]=P+1|0;a[(c[O>>2]|0)+P|0]=R;S=g}else{g=f+5816|0;if((h|0)<=0){S=g;break}R=b[g>>1]&255;P=f+20|0;O=c[P>>2]|0;c[P>>2]=O+1|0;a[(c[f+8>>2]|0)+O|0]=R;S=g}}while(0);b[S>>1]=0;c[i>>2]=0;return}function bi(f,g){f=f|0;g=g|0;var h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0;h=i;i=i+32|0;j=h|0;k=g|0;l=c[k>>2]|0;m=g+8|0;n=c[m>>2]|0;o=c[n>>2]|0;p=c[n+12>>2]|0;n=f+5200|0;c[n>>2]=0;q=f+5204|0;c[q>>2]=573;do{if((p|0)>0){r=0;s=-1;while(1){if(b[l+(r<<2)>>1]<<16>>16==0){b[l+(r<<2)+2>>1]=0;t=s}else{u=(c[n>>2]|0)+1|0;c[n>>2]=u;c[f+2908+(u<<2)>>2]=r;a[r+(f+5208)|0]=0;t=r}u=r+1|0;if((u|0)==(p|0)){break}else{r=u;s=t}}s=c[n>>2]|0;if((s|0)<2){v=s;w=t;x=1259;break}else{y=t;break}}else{v=0;w=-1;x=1259}}while(0);L1725:do{if((x|0)==1259){t=f+5800|0;s=f+5804|0;if((o|0)==0){r=w;u=v;while(1){z=(r|0)<2;A=r+1|0;B=z?A:r;C=z?A:0;A=u+1|0;c[n>>2]=A;c[f+2908+(A<<2)>>2]=C;b[l+(C<<2)>>1]=1;a[C+(f+5208)|0]=0;c[t>>2]=(c[t>>2]|0)-1|0;C=c[n>>2]|0;if((C|0)<2){r=B;u=C}else{y=B;break L1725}}}else{u=w;r=v;while(1){B=(u|0)<2;C=u+1|0;A=B?C:u;z=B?C:0;C=r+1|0;c[n>>2]=C;c[f+2908+(C<<2)>>2]=z;b[l+(z<<2)>>1]=1;a[z+(f+5208)|0]=0;c[t>>2]=(c[t>>2]|0)-1|0;c[s>>2]=(c[s>>2]|0)-(e[o+(z<<2)+2>>1]|0)|0;z=c[n>>2]|0;if((z|0)<2){u=A;r=z}else{y=A;break L1725}}}}}while(0);o=g+4|0;c[o>>2]=y;g=c[n>>2]|0;L1733:do{if((g|0)>1){v=(g|0)/2&-1;w=g;while(1){x=c[f+2908+(v<<2)>>2]|0;r=x+(f+5208)|0;u=v<<1;L1737:do{if((u|0)>(w|0)){D=v}else{s=l+(x<<2)|0;t=v;A=u;z=w;while(1){do{if((A|0)<(z|0)){C=A|1;B=c[f+2908+(C<<2)>>2]|0;E=b[l+(B<<2)>>1]|0;F=c[f+2908+(A<<2)>>2]|0;G=b[l+(F<<2)>>1]|0;if((E&65535)>=(G&65535)){if(E<<16>>16!=G<<16>>16){H=A;break}if((d[B+(f+5208)|0]|0)>(d[F+(f+5208)|0]|0)){H=A;break}}H=C}else{H=A}}while(0);C=b[s>>1]|0;F=c[f+2908+(H<<2)>>2]|0;B=b[l+(F<<2)>>1]|0;if((C&65535)<(B&65535)){D=t;break L1737}if(C<<16>>16==B<<16>>16){if((d[r]|0)<=(d[F+(f+5208)|0]|0)){D=t;break L1737}}c[f+2908+(t<<2)>>2]=F;F=H<<1;B=c[n>>2]|0;if((F|0)>(B|0)){D=H;break L1737}else{t=H;A=F;z=B}}}}while(0);c[f+2908+(D<<2)>>2]=x;r=v-1|0;u=c[n>>2]|0;if((r|0)>0){v=r;w=u}else{I=u;break L1733}}}else{I=g}}while(0);g=f+2912|0;D=p;p=I;while(1){I=c[g>>2]|0;H=p-1|0;c[n>>2]=H;w=c[f+2908+(p<<2)>>2]|0;c[g>>2]=w;v=w+(f+5208)|0;L1756:do{if((H|0)<2){J=1}else{u=l+(w<<2)|0;r=1;z=2;A=H;while(1){do{if((z|0)<(A|0)){t=z|1;s=c[f+2908+(t<<2)>>2]|0;B=b[l+(s<<2)>>1]|0;F=c[f+2908+(z<<2)>>2]|0;C=b[l+(F<<2)>>1]|0;if((B&65535)>=(C&65535)){if(B<<16>>16!=C<<16>>16){K=z;break}if((d[s+(f+5208)|0]|0)>(d[F+(f+5208)|0]|0)){K=z;break}}K=t}else{K=z}}while(0);t=b[u>>1]|0;F=c[f+2908+(K<<2)>>2]|0;s=b[l+(F<<2)>>1]|0;if((t&65535)<(s&65535)){J=r;break L1756}if(t<<16>>16==s<<16>>16){if((d[v]|0)<=(d[F+(f+5208)|0]|0)){J=r;break L1756}}c[f+2908+(r<<2)>>2]=F;F=K<<1;s=c[n>>2]|0;if((F|0)>(s|0)){J=K;break L1756}else{r=K;z=F;A=s}}}}while(0);c[f+2908+(J<<2)>>2]=w;v=c[g>>2]|0;H=(c[q>>2]|0)-1|0;c[q>>2]=H;c[f+2908+(H<<2)>>2]=I;H=(c[q>>2]|0)-1|0;c[q>>2]=H;c[f+2908+(H<<2)>>2]=v;H=l+(D<<2)|0;b[H>>1]=(b[l+(v<<2)>>1]|0)+(b[l+(I<<2)>>1]|0)&65535;A=a[I+(f+5208)|0]|0;z=a[v+(f+5208)|0]|0;r=D+(f+5208)|0;a[r]=((A&255)<(z&255)?z:A)+1&255;A=D&65535;b[l+(v<<2)+2>>1]=A;b[l+(I<<2)+2>>1]=A;A=D+1|0;c[g>>2]=D;v=c[n>>2]|0;L1772:do{if((v|0)<2){L=1}else{z=1;u=2;x=v;while(1){do{if((u|0)<(x|0)){s=u|1;F=c[f+2908+(s<<2)>>2]|0;t=b[l+(F<<2)>>1]|0;C=c[f+2908+(u<<2)>>2]|0;B=b[l+(C<<2)>>1]|0;if((t&65535)>=(B&65535)){if(t<<16>>16!=B<<16>>16){M=u;break}if((d[F+(f+5208)|0]|0)>(d[C+(f+5208)|0]|0)){M=u;break}}M=s}else{M=u}}while(0);s=b[H>>1]|0;C=c[f+2908+(M<<2)>>2]|0;F=b[l+(C<<2)>>1]|0;if((s&65535)<(F&65535)){L=z;break L1772}if(s<<16>>16==F<<16>>16){if((d[r]|0)<=(d[C+(f+5208)|0]|0)){L=z;break L1772}}c[f+2908+(z<<2)>>2]=C;C=M<<1;F=c[n>>2]|0;if((C|0)>(F|0)){L=M;break L1772}else{z=M;u=C;x=F}}}}while(0);c[f+2908+(L<<2)>>2]=D;r=c[n>>2]|0;if((r|0)>1){D=A;p=r}else{break}}p=c[g>>2]|0;g=(c[q>>2]|0)-1|0;c[q>>2]=g;c[f+2908+(g<<2)>>2]=p;p=c[k>>2]|0;k=c[o>>2]|0;o=c[m>>2]|0;m=c[o>>2]|0;g=c[o+4>>2]|0;D=c[o+8>>2]|0;n=c[o+16>>2]|0;bt(f+2876|0,0,32);b[p+(c[f+2908+(c[q>>2]<<2)>>2]<<2)+2>>1]=0;o=(c[q>>2]|0)+1|0;L1788:do{if((o|0)<573){q=f+5800|0;L=f+5804|0;L1790:do{if((m|0)==0){M=0;J=o;while(1){K=c[f+2908+(J<<2)>>2]|0;r=p+(K<<2)+2|0;H=(e[p+((e[r>>1]|0)<<2)+2>>1]|0)+1|0;v=(H|0)>(n|0);I=v?n:H;H=(v&1)+M|0;b[r>>1]=I&65535;if((K|0)<=(k|0)){r=f+2876+(I<<1)|0;b[r>>1]=(b[r>>1]|0)+1&65535;if((K|0)<(D|0)){N=0}else{N=c[g+(K-D<<2)>>2]|0}r=_(e[p+(K<<2)>>1]|0,N+I|0);c[q>>2]=r+(c[q>>2]|0)|0}r=J+1|0;if((r|0)==573){O=H;break L1790}else{M=H;J=r}}}else{J=0;M=o;while(1){r=c[f+2908+(M<<2)>>2]|0;H=p+(r<<2)+2|0;I=(e[p+((e[H>>1]|0)<<2)+2>>1]|0)+1|0;K=(I|0)>(n|0);v=K?n:I;I=(K&1)+J|0;b[H>>1]=v&65535;if((r|0)<=(k|0)){H=f+2876+(v<<1)|0;b[H>>1]=(b[H>>1]|0)+1&65535;if((r|0)<(D|0)){P=0}else{P=c[g+(r-D<<2)>>2]|0}H=e[p+(r<<2)>>1]|0;K=_(H,P+v|0);c[q>>2]=K+(c[q>>2]|0)|0;K=_((e[m+(r<<2)+2>>1]|0)+P|0,H);c[L>>2]=K+(c[L>>2]|0)|0}K=M+1|0;if((K|0)==573){O=I;break L1790}else{J=I;M=K}}}}while(0);if((O|0)==0){break}L=f+2876+(n<<1)|0;A=O;while(1){M=n;while(1){J=M-1|0;Q=f+2876+(J<<1)|0;R=b[Q>>1]|0;if(R<<16>>16==0){M=J}else{break}}b[Q>>1]=R-1&65535;J=f+2876+(M<<1)|0;b[J>>1]=(b[J>>1]|0)+2&65535;S=(b[L>>1]|0)-1&65535;b[L>>1]=S;J=A-2|0;if((J|0)>0){A=J}else{break}}if((n|0)==0){break}else{T=n;U=573;V=S}while(1){A=T&65535;L1817:do{if(V<<16>>16==0){W=U}else{L=V&65535;J=U;while(1){K=J;while(1){X=K-1|0;Y=c[f+2908+(X<<2)>>2]|0;if((Y|0)>(k|0)){K=X}else{break}}K=p+(Y<<2)+2|0;I=e[K>>1]|0;if((I|0)!=(T|0)){H=_(e[p+(Y<<2)>>1]|0,T-I|0);c[q>>2]=H+(c[q>>2]|0)|0;b[K>>1]=A}K=L-1|0;if((K|0)==0){W=X;break L1817}else{L=K;J=X}}}}while(0);A=T-1|0;if((A|0)==0){break L1788}T=A;U=W;V=b[f+2876+(A<<1)>>1]|0}}}while(0);V=1;W=0;while(1){U=(e[f+2876+(V-1<<1)>>1]|0)+(W&65534)<<1;b[j+(V<<1)>>1]=U&65535;T=V+1|0;if((T|0)==16){break}else{V=T;W=U}}if((y|0)<0){i=h;return}W=y+1|0;y=0;while(1){V=b[l+(y<<2)+2>>1]|0;f=V&65535;if(V<<16>>16!=0){V=j+(f<<1)|0;U=b[V>>1]|0;b[V>>1]=U+1&65535;V=0;T=f;f=U&65535;while(1){Z=V|f&1;U=T-1|0;if((U|0)>0){V=Z<<1;T=U;f=f>>>1}else{break}}b[l+(y<<2)>>1]=Z&65535}f=y+1|0;if((f|0)==(W|0)){break}else{y=f}}i=h;return}function bj(f,g,h){f=f|0;g=g|0;h=h|0;var i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0;i=f+5792|0;L1846:do{if((c[i>>2]|0)==0){j=c[f+5820>>2]|0;k=b[f+5816>>1]|0}else{l=f+5796|0;m=f+5784|0;n=f+5820|0;o=f+5816|0;p=f+20|0;q=f+8|0;r=0;while(1){s=b[(c[l>>2]|0)+(r<<1)>>1]|0;t=s&65535;u=r+1|0;v=d[(c[m>>2]|0)+r|0]|0;do{if(s<<16>>16==0){w=e[g+(v<<2)+2>>1]|0;x=c[n>>2]|0;y=e[g+(v<<2)>>1]|0;z=e[o>>1]|0|y<<x;A=z&65535;b[o>>1]=A;if((x|0)>(16-w|0)){B=c[p>>2]|0;c[p>>2]=B+1|0;a[(c[q>>2]|0)+B|0]=z&255;z=(e[o>>1]|0)>>>8&255;B=c[p>>2]|0;c[p>>2]=B+1|0;a[(c[q>>2]|0)+B|0]=z;z=c[n>>2]|0;B=y>>>((16-z|0)>>>0)&65535;b[o>>1]=B;y=(w-16|0)+z|0;c[n>>2]=y;C=y;D=B;break}else{B=x+w|0;c[n>>2]=B;C=B;D=A;break}}else{A=d[v+5256416|0]|0;B=(A|256)+1|0;w=e[g+(B<<2)+2>>1]|0;x=c[n>>2]|0;y=e[g+(B<<2)>>1]|0;B=e[o>>1]|0|y<<x;z=B&65535;b[o>>1]=z;if((x|0)>(16-w|0)){E=c[p>>2]|0;c[p>>2]=E+1|0;a[(c[q>>2]|0)+E|0]=B&255;B=(e[o>>1]|0)>>>8&255;E=c[p>>2]|0;c[p>>2]=E+1|0;a[(c[q>>2]|0)+E|0]=B;B=c[n>>2]|0;E=y>>>((16-B|0)>>>0)&65535;b[o>>1]=E;F=(w-16|0)+B|0;G=E}else{F=x+w|0;G=z}c[n>>2]=F;z=c[5246708+(A<<2)>>2]|0;do{if((A-8|0)>>>0<20){w=v-(c[5255352+(A<<2)>>2]|0)&65535;x=w<<F|G&65535;E=x&65535;b[o>>1]=E;if((F|0)>(16-z|0)){B=c[p>>2]|0;c[p>>2]=B+1|0;a[(c[q>>2]|0)+B|0]=x&255;x=(e[o>>1]|0)>>>8&255;B=c[p>>2]|0;c[p>>2]=B+1|0;a[(c[q>>2]|0)+B|0]=x;x=c[n>>2]|0;B=w>>>((16-x|0)>>>0)&65535;b[o>>1]=B;w=(z-16|0)+x|0;c[n>>2]=w;H=w;I=B;break}else{B=F+z|0;c[n>>2]=B;H=B;I=E;break}}else{H=F;I=G}}while(0);z=t-1|0;if(z>>>0<256){J=z}else{J=(z>>>7)+256|0}A=d[J+5257144|0]|0;E=e[h+(A<<2)+2>>1]|0;B=e[h+(A<<2)>>1]|0;w=I&65535|B<<H;x=w&65535;b[o>>1]=x;if((H|0)>(16-E|0)){y=c[p>>2]|0;c[p>>2]=y+1|0;a[(c[q>>2]|0)+y|0]=w&255;w=(e[o>>1]|0)>>>8&255;y=c[p>>2]|0;c[p>>2]=y+1|0;a[(c[q>>2]|0)+y|0]=w;w=c[n>>2]|0;y=B>>>((16-w|0)>>>0)&65535;b[o>>1]=y;K=(E-16|0)+w|0;L=y}else{K=H+E|0;L=x}c[n>>2]=K;x=c[5246824+(A<<2)>>2]|0;if((A-4|0)>>>0>=26){C=K;D=L;break}E=z-(c[5255468+(A<<2)>>2]|0)&65535;A=E<<K|L&65535;z=A&65535;b[o>>1]=z;if((K|0)>(16-x|0)){y=c[p>>2]|0;c[p>>2]=y+1|0;a[(c[q>>2]|0)+y|0]=A&255;A=(e[o>>1]|0)>>>8&255;y=c[p>>2]|0;c[p>>2]=y+1|0;a[(c[q>>2]|0)+y|0]=A;A=c[n>>2]|0;y=E>>>((16-A|0)>>>0)&65535;b[o>>1]=y;E=(x-16|0)+A|0;c[n>>2]=E;C=E;D=y;break}else{y=K+x|0;c[n>>2]=y;C=y;D=z;break}}}while(0);if(u>>>0<(c[i>>2]|0)>>>0){r=u}else{j=C;k=D;break L1846}}}}while(0);D=e[g+1026>>1]|0;C=f+5820|0;i=e[g+1024>>1]|0;g=f+5816|0;K=k&65535|i<<j;b[g>>1]=K&65535;if((j|0)>(16-D|0)){k=f+20|0;L=c[k>>2]|0;c[k>>2]=L+1|0;H=f+8|0;a[(c[H>>2]|0)+L|0]=K&255;K=(e[g>>1]|0)>>>8&255;L=c[k>>2]|0;c[k>>2]=L+1|0;a[(c[H>>2]|0)+L|0]=K;K=c[C>>2]|0;b[g>>1]=i>>>((16-K|0)>>>0)&65535;i=(D-16|0)+K|0;c[C>>2]=i;return}else{i=j+D|0;c[C>>2]=i;return}}function bk(d,f,g){d=d|0;f=f|0;g=g|0;var h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0;h=b[f+2>>1]|0;i=h<<16>>16==0;j=d+2754|0;k=d+5820|0;l=d+2752|0;m=d+5816|0;n=d+20|0;o=d+8|0;p=d+2758|0;q=d+2756|0;r=d+2750|0;s=d+2748|0;t=0;u=-1;v=h&65535;h=i?138:7;w=i?3:4;L1886:while(1){i=t;x=0;while(1){if((i|0)>(g|0)){break L1886}y=i+1|0;z=b[f+(y<<2)+2>>1]|0;A=z&65535;B=x+1|0;C=(v|0)==(A|0);if((B|0)<(h|0)&C){i=y;x=B}else{break}}L1892:do{if((B|0)<(w|0)){i=d+2684+(v<<2)+2|0;D=d+2684+(v<<2)|0;E=B;F=c[k>>2]|0;G=b[m>>1]|0;while(1){H=e[i>>1]|0;I=e[D>>1]|0;J=G&65535|I<<F;K=J&65535;b[m>>1]=K;if((F|0)>(16-H|0)){L=c[n>>2]|0;c[n>>2]=L+1|0;a[(c[o>>2]|0)+L|0]=J&255;J=(e[m>>1]|0)>>>8&255;L=c[n>>2]|0;c[n>>2]=L+1|0;a[(c[o>>2]|0)+L|0]=J;J=c[k>>2]|0;L=I>>>((16-J|0)>>>0)&65535;b[m>>1]=L;M=(H-16|0)+J|0;N=L}else{M=F+H|0;N=K}c[k>>2]=M;K=E-1|0;if((K|0)==0){break L1892}else{E=K;F=M;G=N}}}else{if((v|0)!=0){if((v|0)==(u|0)){O=B;P=c[k>>2]|0;Q=b[m>>1]|0}else{G=e[d+2684+(v<<2)+2>>1]|0;F=c[k>>2]|0;E=e[d+2684+(v<<2)>>1]|0;D=e[m>>1]|0|E<<F;i=D&65535;b[m>>1]=i;if((F|0)>(16-G|0)){K=c[n>>2]|0;c[n>>2]=K+1|0;a[(c[o>>2]|0)+K|0]=D&255;D=(e[m>>1]|0)>>>8&255;K=c[n>>2]|0;c[n>>2]=K+1|0;a[(c[o>>2]|0)+K|0]=D;D=c[k>>2]|0;K=E>>>((16-D|0)>>>0)&65535;b[m>>1]=K;R=(G-16|0)+D|0;S=K}else{R=F+G|0;S=i}c[k>>2]=R;O=x;P=R;Q=S}i=e[r>>1]|0;G=e[s>>1]|0;F=Q&65535|G<<P;b[m>>1]=F&65535;if((P|0)>(16-i|0)){K=c[n>>2]|0;c[n>>2]=K+1|0;a[(c[o>>2]|0)+K|0]=F&255;K=(e[m>>1]|0)>>>8&255;D=c[n>>2]|0;c[n>>2]=D+1|0;a[(c[o>>2]|0)+D|0]=K;K=c[k>>2]|0;D=G>>>((16-K|0)>>>0);b[m>>1]=D&65535;T=(i-16|0)+K|0;U=D}else{T=P+i|0;U=F}c[k>>2]=T;F=O+65533&65535;i=U&65535|F<<T;b[m>>1]=i&65535;if((T|0)>14){D=c[n>>2]|0;c[n>>2]=D+1|0;a[(c[o>>2]|0)+D|0]=i&255;i=(e[m>>1]|0)>>>8&255;D=c[n>>2]|0;c[n>>2]=D+1|0;a[(c[o>>2]|0)+D|0]=i;i=c[k>>2]|0;b[m>>1]=F>>>((16-i|0)>>>0)&65535;c[k>>2]=i-14|0;break}else{c[k>>2]=T+2|0;break}}if((B|0)<11){i=e[j>>1]|0;F=c[k>>2]|0;D=e[l>>1]|0;K=e[m>>1]|0|D<<F;b[m>>1]=K&65535;if((F|0)>(16-i|0)){G=c[n>>2]|0;c[n>>2]=G+1|0;a[(c[o>>2]|0)+G|0]=K&255;G=(e[m>>1]|0)>>>8&255;E=c[n>>2]|0;c[n>>2]=E+1|0;a[(c[o>>2]|0)+E|0]=G;G=c[k>>2]|0;E=D>>>((16-G|0)>>>0);b[m>>1]=E&65535;V=(i-16|0)+G|0;W=E}else{V=F+i|0;W=K}c[k>>2]=V;K=x+65534&65535;i=W&65535|K<<V;b[m>>1]=i&65535;if((V|0)>13){F=c[n>>2]|0;c[n>>2]=F+1|0;a[(c[o>>2]|0)+F|0]=i&255;i=(e[m>>1]|0)>>>8&255;F=c[n>>2]|0;c[n>>2]=F+1|0;a[(c[o>>2]|0)+F|0]=i;i=c[k>>2]|0;b[m>>1]=K>>>((16-i|0)>>>0)&65535;c[k>>2]=i-13|0;break}else{c[k>>2]=V+3|0;break}}else{i=e[p>>1]|0;K=c[k>>2]|0;F=e[q>>1]|0;E=e[m>>1]|0|F<<K;b[m>>1]=E&65535;if((K|0)>(16-i|0)){G=c[n>>2]|0;c[n>>2]=G+1|0;a[(c[o>>2]|0)+G|0]=E&255;G=(e[m>>1]|0)>>>8&255;D=c[n>>2]|0;c[n>>2]=D+1|0;a[(c[o>>2]|0)+D|0]=G;G=c[k>>2]|0;D=F>>>((16-G|0)>>>0);b[m>>1]=D&65535;X=(i-16|0)+G|0;Y=D}else{X=K+i|0;Y=E}c[k>>2]=X;E=x+65526&65535;i=Y&65535|E<<X;b[m>>1]=i&65535;if((X|0)>9){K=c[n>>2]|0;c[n>>2]=K+1|0;a[(c[o>>2]|0)+K|0]=i&255;i=(e[m>>1]|0)>>>8&255;K=c[n>>2]|0;c[n>>2]=K+1|0;a[(c[o>>2]|0)+K|0]=i;i=c[k>>2]|0;b[m>>1]=E>>>((16-i|0)>>>0)&65535;c[k>>2]=i-9|0;break}else{c[k>>2]=X+7|0;break}}}}while(0);if(z<<16>>16==0){t=y;u=v;v=A;h=138;w=3;continue}t=y;u=v;v=A;h=C?6:7;w=C?3:4}return}function bl(a,b,c){a=a|0;b=b|0;c=c|0;return bq(_(c,b))|0}function bm(a,b){a=a|0;b=b|0;br(b);return}function bn(a,b,c){a=a|0;b=b|0;c=c|0;var e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0;e=a>>>16;f=a&65535;if((c|0)==1){a=(d[b]|0)+f|0;g=a>>>0>65520?a-65521|0:a;a=g+e|0;h=(a>>>0>65520?a+15|0:a)<<16|g;return h|0}if((b|0)==0){h=1;return h|0}if(c>>>0<16){L1951:do{if((c|0)==0){i=f;j=e}else{g=f;a=b;k=c;l=e;while(1){m=k-1|0;n=(d[a]|0)+g|0;o=n+l|0;if((m|0)==0){i=n;j=o;break L1951}else{g=n;a=a+1|0;k=m;l=o}}}}while(0);h=(j>>>0)%65521<<16|(i>>>0>65520?i-65521|0:i);return h|0}do{if(c>>>0>5551){i=f;j=b;l=c;k=e;while(1){p=l-5552|0;a=347;g=k;o=j;m=i;while(1){n=(d[o]|0)+m|0;q=n+(d[o+1|0]|0)|0;r=q+(d[o+2|0]|0)|0;s=r+(d[o+3|0]|0)|0;t=s+(d[o+4|0]|0)|0;u=t+(d[o+5|0]|0)|0;v=u+(d[o+6|0]|0)|0;w=v+(d[o+7|0]|0)|0;x=w+(d[o+8|0]|0)|0;y=x+(d[o+9|0]|0)|0;z=y+(d[o+10|0]|0)|0;A=z+(d[o+11|0]|0)|0;B=A+(d[o+12|0]|0)|0;C=B+(d[o+13|0]|0)|0;D=C+(d[o+14|0]|0)|0;E=D+(d[o+15|0]|0)|0;F=(((((((((((((((n+g|0)+q|0)+r|0)+s|0)+t|0)+u|0)+v|0)+w|0)+x|0)+y|0)+z|0)+A|0)+B|0)+C|0)+D|0)+E|0;D=a-1|0;if((D|0)==0){break}else{a=D;g=F;o=o+16|0;m=E}}G=j+5552|0;H=(E>>>0)%65521;I=(F>>>0)%65521;if(p>>>0>5551){i=H;j=G;l=p;k=I}else{break}}if((p|0)==0){J=I;K=H;break}if(p>>>0>15){L=H;M=G;N=p;O=I;P=1427;break}else{Q=H;R=G;S=p;T=I;P=1428;break}}else{L=f;M=b;N=c;O=e;P=1427}}while(0);do{if((P|0)==1427){while(1){P=0;U=N-16|0;e=(d[M]|0)+L|0;c=e+(d[M+1|0]|0)|0;b=c+(d[M+2|0]|0)|0;f=b+(d[M+3|0]|0)|0;I=f+(d[M+4|0]|0)|0;p=I+(d[M+5|0]|0)|0;G=p+(d[M+6|0]|0)|0;H=G+(d[M+7|0]|0)|0;F=H+(d[M+8|0]|0)|0;E=F+(d[M+9|0]|0)|0;k=E+(d[M+10|0]|0)|0;l=k+(d[M+11|0]|0)|0;j=l+(d[M+12|0]|0)|0;i=j+(d[M+13|0]|0)|0;m=i+(d[M+14|0]|0)|0;V=m+(d[M+15|0]|0)|0;W=(((((((((((((((e+O|0)+c|0)+b|0)+f|0)+I|0)+p|0)+G|0)+H|0)+F|0)+E|0)+k|0)+l|0)+j|0)+i|0)+m|0)+V|0;X=M+16|0;if(U>>>0>15){L=V;M=X;N=U;O=W;P=1427}else{break}}if((U|0)==0){Y=V;Z=W;P=1429;break}else{Q=V;R=X;S=U;T=W;P=1428;break}}}while(0);L1969:do{if((P|0)==1428){while(1){P=0;W=S-1|0;U=(d[R]|0)+Q|0;X=U+T|0;if((W|0)==0){Y=U;Z=X;P=1429;break L1969}else{Q=U;R=R+1|0;S=W;T=X;P=1428}}}}while(0);if((P|0)==1429){J=(Z>>>0)%65521;K=(Y>>>0)%65521}h=J<<16|K;return h|0}function bo(a,b,e){a=a|0;b=b|0;e=e|0;var f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0;if((b|0)==0){f=0;return f|0}g=a^-1;L1980:do{if((e|0)==0){h=g}else{a=b;i=e;j=g;while(1){if((a&3|0)==0){break}k=c[5247020+(((d[a]|0)^j&255)<<2)>>2]^j>>>8;l=i-1|0;if((l|0)==0){h=k;break L1980}else{a=a+1|0;i=l;j=k}}k=a;L1985:do{if(i>>>0>31){l=i;m=j;n=k;while(1){o=c[n>>2]^m;p=c[5249068+((o>>>8&255)<<2)>>2]^c[5250092+((o&255)<<2)>>2]^c[5248044+((o>>>16&255)<<2)>>2]^c[5247020+(o>>>24<<2)>>2]^c[n+4>>2];o=c[5249068+((p>>>8&255)<<2)>>2]^c[5250092+((p&255)<<2)>>2]^c[5248044+((p>>>16&255)<<2)>>2]^c[5247020+(p>>>24<<2)>>2]^c[n+8>>2];p=c[5249068+((o>>>8&255)<<2)>>2]^c[5250092+((o&255)<<2)>>2]^c[5248044+((o>>>16&255)<<2)>>2]^c[5247020+(o>>>24<<2)>>2]^c[n+12>>2];o=c[5249068+((p>>>8&255)<<2)>>2]^c[5250092+((p&255)<<2)>>2]^c[5248044+((p>>>16&255)<<2)>>2]^c[5247020+(p>>>24<<2)>>2]^c[n+16>>2];p=c[5249068+((o>>>8&255)<<2)>>2]^c[5250092+((o&255)<<2)>>2]^c[5248044+((o>>>16&255)<<2)>>2]^c[5247020+(o>>>24<<2)>>2]^c[n+20>>2];o=c[5249068+((p>>>8&255)<<2)>>2]^c[5250092+((p&255)<<2)>>2]^c[5248044+((p>>>16&255)<<2)>>2]^c[5247020+(p>>>24<<2)>>2]^c[n+24>>2];p=n+32|0;q=c[5249068+((o>>>8&255)<<2)>>2]^c[5250092+((o&255)<<2)>>2]^c[5248044+((o>>>16&255)<<2)>>2]^c[5247020+(o>>>24<<2)>>2]^c[n+28>>2];o=c[5249068+((q>>>8&255)<<2)>>2]^c[5250092+((q&255)<<2)>>2]^c[5248044+((q>>>16&255)<<2)>>2]^c[5247020+(q>>>24<<2)>>2];q=l-32|0;if(q>>>0>31){l=q;m=o;n=p}else{r=q;s=o;t=p;break L1985}}}else{r=i;s=j;t=k}}while(0);L1989:do{if(r>>>0>3){k=r;j=s;i=t;while(1){a=i+4|0;n=c[i>>2]^j;m=c[5249068+((n>>>8&255)<<2)>>2]^c[5250092+((n&255)<<2)>>2]^c[5248044+((n>>>16&255)<<2)>>2]^c[5247020+(n>>>24<<2)>>2];n=k-4|0;if(n>>>0>3){k=n;j=m;i=a}else{u=n;v=m;w=a;break L1989}}}else{u=r;v=s;w=t}}while(0);if((u|0)==0){h=v;break}i=v;j=u;k=w;while(1){a=c[5247020+(((d[k]|0)^i&255)<<2)>>2]^i>>>8;m=j-1|0;if((m|0)==0){h=a;break L1980}else{i=a;j=m;k=k+1|0}}}}while(0);f=h^-1;return f|0}function bp(e,f){e=e|0;f=f|0;var g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,$=0,aa=0,ab=0,ac=0,ad=0,ae=0,af=0,ag=0,ah=0,ai=0,aj=0,ak=0,al=0,am=0,an=0,ao=0,ap=0,aq=0,ar=0,as=0,at=0,au=0,av=0,aw=0,ax=0,ay=0,az=0,aA=0,aB=0,aC=0,aD=0,aE=0,aF=0,aG=0,aH=0,aI=0,aJ=0,aK=0,aL=0,aM=0,aN=0,aO=0,aP=0,aQ=0,aR=0,aS=0,aT=0,aU=0,aV=0;g=c[e+28>>2]|0;h=e|0;i=c[h>>2]|0;j=e+4|0;k=i+((c[j>>2]|0)-6|0)|0;l=e+12|0;m=c[l>>2]|0;n=e+16|0;o=c[n>>2]|0;p=m+(o-258|0)|0;q=c[g+44>>2]|0;r=c[g+48>>2]|0;s=c[g+52>>2]|0;t=g+56|0;u=g+60|0;v=c[g+76>>2]|0;w=c[g+80>>2]|0;x=(1<<c[g+84>>2])-1|0;y=(1<<c[g+88>>2])-1|0;z=m+(o+(f^-1)|0)|0;f=g+7104|0;o=s-1|0;A=(r|0)==0;B=(c[g+40>>2]|0)-1|0;C=B+r|0;D=r-1|0;E=z-1|0;F=z-r|0;G=i-1|0;i=m-1|0;m=c[t>>2]|0;H=c[u>>2]|0;L1999:while(1){if(H>>>0<15){I=G+2|0;J=I;K=(((d[G+1|0]|0)<<H)+m|0)+((d[I]|0)<<H+8)|0;L=H+16|0}else{J=G;K=m;L=H}I=K&x;M=a[v+(I<<2)|0]|0;N=b[v+(I<<2)+2>>1]|0;O=d[v+(I<<2)+1|0]|0;I=K>>>(O>>>0);P=L-O|0;L2004:do{if(M<<24>>24==0){Q=N;R=I;S=P;T=1455}else{O=N;U=I;V=P;W=M;while(1){X=W&255;if((X&16|0)!=0){break}if((X&64|0)!=0){T=1503;break L1999}Y=(U&(1<<X)-1)+(O&65535)|0;Z=a[v+(Y<<2)|0]|0;_=b[v+(Y<<2)+2>>1]|0;$=d[v+(Y<<2)+1|0]|0;Y=U>>>($>>>0);aa=V-$|0;if(Z<<24>>24==0){Q=_;R=Y;S=aa;T=1455;break L2004}else{O=_;U=Y;V=aa;W=Z}}W=O&65535;Z=X&15;if((Z|0)==0){ab=W;ac=J;ad=U;ae=V}else{if(V>>>0<Z>>>0){aa=J+1|0;af=aa;ag=((d[aa]|0)<<V)+U|0;ah=V+8|0}else{af=J;ag=U;ah=V}ab=(ag&(1<<Z)-1)+W|0;ac=af;ad=ag>>>(Z>>>0);ae=ah-Z|0}if(ae>>>0<15){Z=ac+2|0;ai=Z;aj=(((d[ac+1|0]|0)<<ae)+ad|0)+((d[Z]|0)<<ae+8)|0;ak=ae+16|0}else{ai=ac;aj=ad;ak=ae}Z=aj&y;W=b[w+(Z<<2)+2>>1]|0;aa=d[w+(Z<<2)+1|0]|0;Y=aj>>>(aa>>>0);_=ak-aa|0;aa=d[w+(Z<<2)|0]|0;L2019:do{if((aa&16|0)==0){Z=W;al=Y;am=_;$=aa;while(1){if(($&64|0)!=0){T=1500;break L1999}an=(al&(1<<$)-1)+(Z&65535)|0;ao=b[w+(an<<2)+2>>1]|0;ap=d[w+(an<<2)+1|0]|0;aq=al>>>(ap>>>0);ar=am-ap|0;ap=d[w+(an<<2)|0]|0;if((ap&16|0)==0){Z=ao;al=aq;am=ar;$=ap}else{as=ao;at=aq;au=ar;av=ap;break L2019}}}else{as=W;at=Y;au=_;av=aa}}while(0);aa=as&65535;_=av&15;do{if(au>>>0<_>>>0){Y=ai+1|0;W=((d[Y]|0)<<au)+at|0;O=au+8|0;if(O>>>0>=_>>>0){aw=Y;ax=W;ay=O;break}Y=ai+2|0;aw=Y;ax=((d[Y]|0)<<O)+W|0;ay=au+16|0}else{aw=ai;ax=at;ay=au}}while(0);W=(ax&(1<<_)-1)+aa|0;az=ax>>>(_>>>0);aA=ay-_|0;O=i;Y=O-z|0;if(W>>>0<=Y>>>0){$=i+(-W|0)|0;Z=ab;ap=i;while(1){a[ap+1|0]=a[$+1|0]|0;a[ap+2|0]=a[$+2|0]|0;ar=$+3|0;aB=ap+3|0;a[aB]=a[ar]|0;aC=Z-3|0;if(aC>>>0>2){$=ar;Z=aC;ap=aB}else{break}}if((aC|0)==0){aD=aw;aE=aB;aF=az;aG=aA;break}Z=ap+4|0;a[Z]=a[$+4|0]|0;if(aC>>>0<=1){aD=aw;aE=Z;aF=az;aG=aA;break}Z=ap+5|0;a[Z]=a[$+5|0]|0;aD=aw;aE=Z;aF=az;aG=aA;break}Z=W-Y|0;if(Z>>>0>q>>>0){if((c[f>>2]|0)!=0){T=1470;break L1999}}do{if(A){_=s+(B-Z|0)|0;if(Z>>>0>=ab>>>0){aH=_;aI=ab;aJ=i;break}aa=ab-Z|0;ar=W-O|0;aq=_;_=Z;ao=i;while(1){an=aq+1|0;aK=ao+1|0;a[aK]=a[an]|0;aL=_-1|0;if((aL|0)==0){break}else{aq=an;_=aL;ao=aK}}aH=i+((E+ar|0)+(1-W|0)|0)|0;aI=aa;aJ=i+(z+ar|0)|0}else{if(r>>>0>=Z>>>0){ao=s+(D-Z|0)|0;if(Z>>>0>=ab>>>0){aH=ao;aI=ab;aJ=i;break}_=ab-Z|0;aq=W-O|0;aK=ao;ao=Z;aL=i;while(1){an=aK+1|0;aM=aL+1|0;a[aM]=a[an]|0;aN=ao-1|0;if((aN|0)==0){break}else{aK=an;ao=aN;aL=aM}}aH=i+((E+aq|0)+(1-W|0)|0)|0;aI=_;aJ=i+(z+aq|0)|0;break}aL=s+(C-Z|0)|0;ao=Z-r|0;if(ao>>>0>=ab>>>0){aH=aL;aI=ab;aJ=i;break}aK=ab-ao|0;ar=W-O|0;aa=aL;aL=ao;ao=i;while(1){aM=aa+1|0;aN=ao+1|0;a[aN]=a[aM]|0;an=aL-1|0;if((an|0)==0){break}else{aa=aM;aL=an;ao=aN}}ao=i+(F+ar|0)|0;if(r>>>0>=aK>>>0){aH=o;aI=aK;aJ=ao;break}aL=aK-r|0;aa=o;aq=r;_=ao;while(1){ao=aa+1|0;aN=_+1|0;a[aN]=a[ao]|0;an=aq-1|0;if((an|0)==0){break}else{aa=ao;aq=an;_=aN}}aH=i+((E+ar|0)+(1-W|0)|0)|0;aI=aL;aJ=i+(z+ar|0)|0}}while(0);L2062:do{if(aI>>>0>2){W=aJ;O=aI;Z=aH;while(1){a[W+1|0]=a[Z+1|0]|0;a[W+2|0]=a[Z+2|0]|0;Y=Z+3|0;$=W+3|0;a[$]=a[Y]|0;ap=O-3|0;if(ap>>>0>2){W=$;O=ap;Z=Y}else{aO=$;aP=ap;aQ=Y;break L2062}}}else{aO=aJ;aP=aI;aQ=aH}}while(0);if((aP|0)==0){aD=aw;aE=aO;aF=az;aG=aA;break}Z=aO+1|0;a[Z]=a[aQ+1|0]|0;if(aP>>>0<=1){aD=aw;aE=Z;aF=az;aG=aA;break}Z=aO+2|0;a[Z]=a[aQ+2|0]|0;aD=aw;aE=Z;aF=az;aG=aA;break}}while(0);if((T|0)==1455){T=0;M=i+1|0;a[M]=Q&255;aD=J;aE=M;aF=R;aG=S}if(aD>>>0<k>>>0&aE>>>0<p>>>0){G=aD;i=aE;m=aF;H=aG}else{aR=aD;aS=aE;aT=aF;aU=aG;break}}do{if((T|0)==1500){c[e+24>>2]=5256120;c[g>>2]=29;aR=ai;aS=i;aT=al;aU=am}else if((T|0)==1470){c[e+24>>2]=5255764;c[g>>2]=29;aR=aw;aS=i;aT=az;aU=aA}else if((T|0)==1503){if((X&32|0)==0){c[e+24>>2]=5256016;c[g>>2]=29;aR=J;aS=i;aT=U;aU=V;break}else{c[g>>2]=11;aR=J;aS=i;aT=U;aU=V;break}}}while(0);V=aU>>>3;U=aR+(-V|0)|0;i=aU-(V<<3)|0;aU=(1<<i)-1&aT;c[h>>2]=aR+(1-V|0)|0;c[l>>2]=aS+1|0;if(U>>>0<k>>>0){aV=k-U|0}else{aV=k-U|0}c[j>>2]=aV+5|0;if(aS>>>0<p>>>0){aV=p-aS|0;j=aV+257|0;c[n>>2]=j;c[t>>2]=aU;c[u>>2]=i;return}else{aV=p-aS|0;j=aV+257|0;c[n>>2]=j;c[t>>2]=aU;c[u>>2]=i;return}}function bq(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,$=0,aa=0,ab=0,ac=0,ad=0,ae=0,af=0,ag=0,ah=0,ai=0,aj=0,ak=0,al=0,am=0,an=0,ap=0,ar=0,as=0,at=0,au=0,av=0,aw=0,ax=0,ay=0,az=0,aC=0,aD=0,aF=0,aG=0,aH=0,aI=0,aJ=0,aK=0,aL=0;do{if(a>>>0<245){if(a>>>0<11){b=16}else{b=a+11&-8}d=b>>>3;e=c[1314168]|0;f=e>>>(d>>>0);if((f&3|0)!=0){g=(f&1^1)+d|0;h=g<<1;i=5256712+(h<<2)|0;j=5256712+(h+2<<2)|0;h=c[j>>2]|0;k=h+8|0;l=c[k>>2]|0;do{if((i|0)==(l|0)){c[1314168]=e&(1<<g^-1)}else{if(l>>>0<(c[1314172]|0)>>>0){aq();return 0}m=l+12|0;if((c[m>>2]|0)==(h|0)){c[m>>2]=i;c[j>>2]=l;break}else{aq();return 0}}}while(0);l=g<<3;c[h+4>>2]=l|3;j=h+(l|4)|0;c[j>>2]=c[j>>2]|1;n=k;return n|0}if(b>>>0<=(c[1314170]|0)>>>0){o=b;break}if((f|0)!=0){j=2<<d;l=f<<d&(j|-j);j=(l&-l)-1|0;l=j>>>12&16;i=j>>>(l>>>0);j=i>>>5&8;m=i>>>(j>>>0);i=m>>>2&4;p=m>>>(i>>>0);m=p>>>1&2;q=p>>>(m>>>0);p=q>>>1&1;r=(j|l|i|m|p)+(q>>>(p>>>0))|0;p=r<<1;q=5256712+(p<<2)|0;m=5256712+(p+2<<2)|0;p=c[m>>2]|0;i=p+8|0;l=c[i>>2]|0;do{if((q|0)==(l|0)){c[1314168]=e&(1<<r^-1)}else{if(l>>>0<(c[1314172]|0)>>>0){aq();return 0}j=l+12|0;if((c[j>>2]|0)==(p|0)){c[j>>2]=q;c[m>>2]=l;break}else{aq();return 0}}}while(0);l=r<<3;m=l-b|0;c[p+4>>2]=b|3;q=p;e=q+b|0;c[q+(b|4)>>2]=m|1;c[q+l>>2]=m;l=c[1314170]|0;if((l|0)!=0){q=c[1314173]|0;d=l>>>3;l=d<<1;f=5256712+(l<<2)|0;k=c[1314168]|0;h=1<<d;do{if((k&h|0)==0){c[1314168]=k|h;s=f;t=5256712+(l+2<<2)|0}else{d=5256712+(l+2<<2)|0;g=c[d>>2]|0;if(g>>>0>=(c[1314172]|0)>>>0){s=g;t=d;break}aq();return 0}}while(0);c[t>>2]=q;c[s+12>>2]=q;c[q+8>>2]=s;c[q+12>>2]=f}c[1314170]=m;c[1314173]=e;n=i;return n|0}l=c[1314169]|0;if((l|0)==0){o=b;break}h=(l&-l)-1|0;l=h>>>12&16;k=h>>>(l>>>0);h=k>>>5&8;p=k>>>(h>>>0);k=p>>>2&4;r=p>>>(k>>>0);p=r>>>1&2;d=r>>>(p>>>0);r=d>>>1&1;g=c[5256976+((h|l|k|p|r)+(d>>>(r>>>0))<<2)>>2]|0;r=g;d=g;p=(c[g+4>>2]&-8)-b|0;while(1){g=c[r+16>>2]|0;if((g|0)==0){k=c[r+20>>2]|0;if((k|0)==0){break}else{u=k}}else{u=g}g=(c[u+4>>2]&-8)-b|0;k=g>>>0<p>>>0;r=u;d=k?u:d;p=k?g:p}r=d;i=c[1314172]|0;if(r>>>0<i>>>0){aq();return 0}e=r+b|0;m=e;if(r>>>0>=e>>>0){aq();return 0}e=c[d+24>>2]|0;f=c[d+12>>2]|0;L2267:do{if((f|0)==(d|0)){q=d+20|0;g=c[q>>2]|0;do{if((g|0)==0){k=d+16|0;l=c[k>>2]|0;if((l|0)==0){v=0;break L2267}else{w=l;x=k;break}}else{w=g;x=q}}while(0);while(1){q=w+20|0;g=c[q>>2]|0;if((g|0)!=0){w=g;x=q;continue}q=w+16|0;g=c[q>>2]|0;if((g|0)==0){break}else{w=g;x=q}}if(x>>>0<i>>>0){aq();return 0}else{c[x>>2]=0;v=w;break}}else{q=c[d+8>>2]|0;if(q>>>0<i>>>0){aq();return 0}g=q+12|0;if((c[g>>2]|0)!=(d|0)){aq();return 0}k=f+8|0;if((c[k>>2]|0)==(d|0)){c[g>>2]=f;c[k>>2]=q;v=f;break}else{aq();return 0}}}while(0);L2289:do{if((e|0)!=0){f=d+28|0;i=5256976+(c[f>>2]<<2)|0;do{if((d|0)==(c[i>>2]|0)){c[i>>2]=v;if((v|0)!=0){break}c[1314169]=c[1314169]&(1<<c[f>>2]^-1);break L2289}else{if(e>>>0<(c[1314172]|0)>>>0){aq();return 0}q=e+16|0;if((c[q>>2]|0)==(d|0)){c[q>>2]=v}else{c[e+20>>2]=v}if((v|0)==0){break L2289}}}while(0);if(v>>>0<(c[1314172]|0)>>>0){aq();return 0}c[v+24>>2]=e;f=c[d+16>>2]|0;do{if((f|0)!=0){if(f>>>0<(c[1314172]|0)>>>0){aq();return 0}else{c[v+16>>2]=f;c[f+24>>2]=v;break}}}while(0);f=c[d+20>>2]|0;if((f|0)==0){break}if(f>>>0<(c[1314172]|0)>>>0){aq();return 0}else{c[v+20>>2]=f;c[f+24>>2]=v;break}}}while(0);if(p>>>0<16){e=p+b|0;c[d+4>>2]=e|3;f=r+(e+4|0)|0;c[f>>2]=c[f>>2]|1}else{c[d+4>>2]=b|3;c[r+(b|4)>>2]=p|1;c[r+(p+b|0)>>2]=p;f=c[1314170]|0;if((f|0)!=0){e=c[1314173]|0;i=f>>>3;f=i<<1;q=5256712+(f<<2)|0;k=c[1314168]|0;g=1<<i;do{if((k&g|0)==0){c[1314168]=k|g;y=q;z=5256712+(f+2<<2)|0}else{i=5256712+(f+2<<2)|0;l=c[i>>2]|0;if(l>>>0>=(c[1314172]|0)>>>0){y=l;z=i;break}aq();return 0}}while(0);c[z>>2]=e;c[y+12>>2]=e;c[e+8>>2]=y;c[e+12>>2]=q}c[1314170]=p;c[1314173]=m}f=d+8|0;if((f|0)==0){o=b;break}else{n=f}return n|0}else{if(a>>>0>4294967231){o=-1;break}f=a+11|0;g=f&-8;k=c[1314169]|0;if((k|0)==0){o=g;break}r=-g|0;i=f>>>8;do{if((i|0)==0){A=0}else{if(g>>>0>16777215){A=31;break}f=(i+1048320|0)>>>16&8;l=i<<f;h=(l+520192|0)>>>16&4;j=l<<h;l=(j+245760|0)>>>16&2;B=(14-(h|f|l)|0)+(j<<l>>>15)|0;A=g>>>((B+7|0)>>>0)&1|B<<1}}while(0);i=c[5256976+(A<<2)>>2]|0;L2097:do{if((i|0)==0){C=0;D=r;E=0}else{if((A|0)==31){F=0}else{F=25-(A>>>1)|0}d=0;m=r;p=i;q=g<<F;e=0;while(1){B=c[p+4>>2]&-8;l=B-g|0;if(l>>>0<m>>>0){if((B|0)==(g|0)){C=p;D=l;E=p;break L2097}else{G=p;H=l}}else{G=d;H=m}l=c[p+20>>2]|0;B=c[p+16+(q>>>31<<2)>>2]|0;j=(l|0)==0|(l|0)==(B|0)?e:l;if((B|0)==0){C=G;D=H;E=j;break L2097}else{d=G;m=H;p=B;q=q<<1;e=j}}}}while(0);if((E|0)==0&(C|0)==0){i=2<<A;r=k&(i|-i);if((r|0)==0){o=g;break}i=(r&-r)-1|0;r=i>>>12&16;e=i>>>(r>>>0);i=e>>>5&8;q=e>>>(i>>>0);e=q>>>2&4;p=q>>>(e>>>0);q=p>>>1&2;m=p>>>(q>>>0);p=m>>>1&1;I=c[5256976+((i|r|e|q|p)+(m>>>(p>>>0))<<2)>>2]|0}else{I=E}L2112:do{if((I|0)==0){J=D;K=C}else{p=I;m=D;q=C;while(1){e=(c[p+4>>2]&-8)-g|0;r=e>>>0<m>>>0;i=r?e:m;e=r?p:q;r=c[p+16>>2]|0;if((r|0)!=0){p=r;m=i;q=e;continue}r=c[p+20>>2]|0;if((r|0)==0){J=i;K=e;break L2112}else{p=r;m=i;q=e}}}}while(0);if((K|0)==0){o=g;break}if(J>>>0>=((c[1314170]|0)-g|0)>>>0){o=g;break}k=K;q=c[1314172]|0;if(k>>>0<q>>>0){aq();return 0}m=k+g|0;p=m;if(k>>>0>=m>>>0){aq();return 0}e=c[K+24>>2]|0;i=c[K+12>>2]|0;L2125:do{if((i|0)==(K|0)){r=K+20|0;d=c[r>>2]|0;do{if((d|0)==0){j=K+16|0;B=c[j>>2]|0;if((B|0)==0){L=0;break L2125}else{M=B;N=j;break}}else{M=d;N=r}}while(0);while(1){r=M+20|0;d=c[r>>2]|0;if((d|0)!=0){M=d;N=r;continue}r=M+16|0;d=c[r>>2]|0;if((d|0)==0){break}else{M=d;N=r}}if(N>>>0<q>>>0){aq();return 0}else{c[N>>2]=0;L=M;break}}else{r=c[K+8>>2]|0;if(r>>>0<q>>>0){aq();return 0}d=r+12|0;if((c[d>>2]|0)!=(K|0)){aq();return 0}j=i+8|0;if((c[j>>2]|0)==(K|0)){c[d>>2]=i;c[j>>2]=r;L=i;break}else{aq();return 0}}}while(0);L2147:do{if((e|0)!=0){i=K+28|0;q=5256976+(c[i>>2]<<2)|0;do{if((K|0)==(c[q>>2]|0)){c[q>>2]=L;if((L|0)!=0){break}c[1314169]=c[1314169]&(1<<c[i>>2]^-1);break L2147}else{if(e>>>0<(c[1314172]|0)>>>0){aq();return 0}r=e+16|0;if((c[r>>2]|0)==(K|0)){c[r>>2]=L}else{c[e+20>>2]=L}if((L|0)==0){break L2147}}}while(0);if(L>>>0<(c[1314172]|0)>>>0){aq();return 0}c[L+24>>2]=e;i=c[K+16>>2]|0;do{if((i|0)!=0){if(i>>>0<(c[1314172]|0)>>>0){aq();return 0}else{c[L+16>>2]=i;c[i+24>>2]=L;break}}}while(0);i=c[K+20>>2]|0;if((i|0)==0){break}if(i>>>0<(c[1314172]|0)>>>0){aq();return 0}else{c[L+20>>2]=i;c[i+24>>2]=L;break}}}while(0);do{if(J>>>0<16){e=J+g|0;c[K+4>>2]=e|3;i=k+(e+4|0)|0;c[i>>2]=c[i>>2]|1}else{c[K+4>>2]=g|3;c[k+(g|4)>>2]=J|1;c[k+(J+g|0)>>2]=J;i=J>>>3;if(J>>>0<256){e=i<<1;q=5256712+(e<<2)|0;r=c[1314168]|0;j=1<<i;do{if((r&j|0)==0){c[1314168]=r|j;O=q;P=5256712+(e+2<<2)|0}else{i=5256712+(e+2<<2)|0;d=c[i>>2]|0;if(d>>>0>=(c[1314172]|0)>>>0){O=d;P=i;break}aq();return 0}}while(0);c[P>>2]=p;c[O+12>>2]=p;c[k+(g+8|0)>>2]=O;c[k+(g+12|0)>>2]=q;break}e=m;j=J>>>8;do{if((j|0)==0){Q=0}else{if(J>>>0>16777215){Q=31;break}r=(j+1048320|0)>>>16&8;i=j<<r;d=(i+520192|0)>>>16&4;B=i<<d;i=(B+245760|0)>>>16&2;l=(14-(d|r|i)|0)+(B<<i>>>15)|0;Q=J>>>((l+7|0)>>>0)&1|l<<1}}while(0);j=5256976+(Q<<2)|0;c[k+(g+28|0)>>2]=Q;c[k+(g+20|0)>>2]=0;c[k+(g+16|0)>>2]=0;q=c[1314169]|0;l=1<<Q;if((q&l|0)==0){c[1314169]=q|l;c[j>>2]=e;c[k+(g+24|0)>>2]=j;c[k+(g+12|0)>>2]=e;c[k+(g+8|0)>>2]=e;break}if((Q|0)==31){R=0}else{R=25-(Q>>>1)|0}l=J<<R;q=c[j>>2]|0;while(1){if((c[q+4>>2]&-8|0)==(J|0)){break}S=q+16+(l>>>31<<2)|0;j=c[S>>2]|0;if((j|0)==0){T=1666;break}else{l=l<<1;q=j}}if((T|0)==1666){if(S>>>0<(c[1314172]|0)>>>0){aq();return 0}else{c[S>>2]=e;c[k+(g+24|0)>>2]=q;c[k+(g+12|0)>>2]=e;c[k+(g+8|0)>>2]=e;break}}l=q+8|0;j=c[l>>2]|0;i=c[1314172]|0;if(q>>>0<i>>>0){aq();return 0}if(j>>>0<i>>>0){aq();return 0}else{c[j+12>>2]=e;c[l>>2]=e;c[k+(g+8|0)>>2]=j;c[k+(g+12|0)>>2]=q;c[k+(g+24|0)>>2]=0;break}}}while(0);k=K+8|0;if((k|0)==0){o=g;break}else{n=k}return n|0}}while(0);K=c[1314170]|0;if(o>>>0<=K>>>0){S=K-o|0;J=c[1314173]|0;if(S>>>0>15){R=J;c[1314173]=R+o|0;c[1314170]=S;c[R+(o+4|0)>>2]=S|1;c[R+K>>2]=S;c[J+4>>2]=o|3}else{c[1314170]=0;c[1314173]=0;c[J+4>>2]=K|3;S=J+(K+4|0)|0;c[S>>2]=c[S>>2]|1}n=J+8|0;return n|0}J=c[1314171]|0;if(o>>>0<J>>>0){S=J-o|0;c[1314171]=S;J=c[1314174]|0;K=J;c[1314174]=K+o|0;c[K+(o+4|0)>>2]=S|1;c[J+4>>2]=o|3;n=J+8|0;return n|0}do{if((c[1311053]|0)==0){J=ao(8)|0;if((J-1&J|0)==0){c[1311055]=J;c[1311054]=J;c[1311056]=-1;c[1311057]=2097152;c[1311058]=0;c[1314279]=0;c[1311053]=aE(0)&-16^1431655768;break}else{aq();return 0}}}while(0);J=o+48|0;S=c[1311055]|0;K=o+47|0;R=S+K|0;Q=-S|0;S=R&Q;if(S>>>0<=o>>>0){n=0;return n|0}O=c[1314278]|0;do{if((O|0)!=0){P=c[1314276]|0;L=P+S|0;if(L>>>0<=P>>>0|L>>>0>O>>>0){n=0}else{break}return n|0}}while(0);L2356:do{if((c[1314279]&4|0)==0){O=c[1314174]|0;L2358:do{if((O|0)==0){T=1696}else{L=O;P=5257120;while(1){U=P|0;M=c[U>>2]|0;if(M>>>0<=L>>>0){V=P+4|0;if((M+(c[V>>2]|0)|0)>>>0>L>>>0){break}}M=c[P+8>>2]|0;if((M|0)==0){T=1696;break L2358}else{P=M}}if((P|0)==0){T=1696;break}L=R-(c[1314171]|0)&Q;if(L>>>0>=2147483647){W=0;break}q=aA(L|0)|0;e=(q|0)==((c[U>>2]|0)+(c[V>>2]|0)|0);X=e?q:-1;Y=e?L:0;Z=q;_=L;T=1705;break}}while(0);do{if((T|0)==1696){O=aA(0)|0;if((O|0)==-1){W=0;break}g=O;L=c[1311054]|0;q=L-1|0;if((q&g|0)==0){$=S}else{$=(S-g|0)+(q+g&-L)|0}L=c[1314276]|0;g=L+$|0;if(!($>>>0>o>>>0&$>>>0<2147483647)){W=0;break}q=c[1314278]|0;if((q|0)!=0){if(g>>>0<=L>>>0|g>>>0>q>>>0){W=0;break}}q=aA($|0)|0;g=(q|0)==(O|0);X=g?O:-1;Y=g?$:0;Z=q;_=$;T=1705;break}}while(0);L2378:do{if((T|0)==1705){q=-_|0;if((X|0)!=-1){aa=Y;ab=X;T=1716;break L2356}do{if((Z|0)!=-1&_>>>0<2147483647&_>>>0<J>>>0){g=c[1311055]|0;O=(K-_|0)+g&-g;if(O>>>0>=2147483647){ac=_;break}if((aA(O|0)|0)==-1){aA(q|0);W=Y;break L2378}else{ac=O+_|0;break}}else{ac=_}}while(0);if((Z|0)==-1){W=Y}else{aa=ac;ab=Z;T=1716;break L2356}}}while(0);c[1314279]=c[1314279]|4;ad=W;T=1713;break}else{ad=0;T=1713}}while(0);do{if((T|0)==1713){if(S>>>0>=2147483647){break}W=aA(S|0)|0;Z=aA(0)|0;if(!((Z|0)!=-1&(W|0)!=-1&W>>>0<Z>>>0)){break}ac=Z-W|0;Z=ac>>>0>(o+40|0)>>>0;Y=Z?W:-1;if((Y|0)==-1){break}else{aa=Z?ac:ad;ab=Y;T=1716;break}}}while(0);do{if((T|0)==1716){ad=(c[1314276]|0)+aa|0;c[1314276]=ad;if(ad>>>0>(c[1314277]|0)>>>0){c[1314277]=ad}ad=c[1314174]|0;L2398:do{if((ad|0)==0){S=c[1314172]|0;if((S|0)==0|ab>>>0<S>>>0){c[1314172]=ab}c[1314280]=ab;c[1314281]=aa;c[1314283]=0;c[1314177]=c[1311053]|0;c[1314176]=-1;S=0;while(1){Y=S<<1;ac=5256712+(Y<<2)|0;c[5256712+(Y+3<<2)>>2]=ac;c[5256712+(Y+2<<2)>>2]=ac;ac=S+1|0;if((ac|0)==32){break}else{S=ac}}S=ab+8|0;if((S&7|0)==0){ae=0}else{ae=-S&7}S=(aa-40|0)-ae|0;c[1314174]=ab+ae|0;c[1314171]=S;c[ab+(ae+4|0)>>2]=S|1;c[ab+(aa-36|0)>>2]=40;c[1314175]=c[1311057]|0}else{S=5257120;while(1){af=c[S>>2]|0;ag=S+4|0;ah=c[ag>>2]|0;if((ab|0)==(af+ah|0)){T=1728;break}ac=c[S+8>>2]|0;if((ac|0)==0){break}else{S=ac}}do{if((T|0)==1728){if((c[S+12>>2]&8|0)!=0){break}ac=ad;if(!(ac>>>0>=af>>>0&ac>>>0<ab>>>0)){break}c[ag>>2]=ah+aa|0;ac=c[1314174]|0;Y=(c[1314171]|0)+aa|0;Z=ac;W=ac+8|0;if((W&7|0)==0){ai=0}else{ai=-W&7}W=Y-ai|0;c[1314174]=Z+ai|0;c[1314171]=W;c[Z+(ai+4|0)>>2]=W|1;c[Z+(Y+4|0)>>2]=40;c[1314175]=c[1311057]|0;break L2398}}while(0);if(ab>>>0<(c[1314172]|0)>>>0){c[1314172]=ab}S=ab+aa|0;Y=5257120;while(1){aj=Y|0;if((c[aj>>2]|0)==(S|0)){T=1738;break}Z=c[Y+8>>2]|0;if((Z|0)==0){break}else{Y=Z}}do{if((T|0)==1738){if((c[Y+12>>2]&8|0)!=0){break}c[aj>>2]=ab;S=Y+4|0;c[S>>2]=(c[S>>2]|0)+aa|0;S=ab+8|0;if((S&7|0)==0){ak=0}else{ak=-S&7}S=ab+(aa+8|0)|0;if((S&7|0)==0){al=0}else{al=-S&7}S=ab+(al+aa|0)|0;Z=S;W=ak+o|0;ac=ab+W|0;_=ac;K=(S-(ab+ak|0)|0)-o|0;c[ab+(ak+4|0)>>2]=o|3;do{if((Z|0)==(c[1314174]|0)){J=(c[1314171]|0)+K|0;c[1314171]=J;c[1314174]=_;c[ab+(W+4|0)>>2]=J|1}else{if((Z|0)==(c[1314173]|0)){J=(c[1314170]|0)+K|0;c[1314170]=J;c[1314173]=_;c[ab+(W+4|0)>>2]=J|1;c[ab+(J+W|0)>>2]=J;break}J=aa+4|0;X=c[ab+(J+al|0)>>2]|0;if((X&3|0)==1){$=X&-8;V=X>>>3;L2433:do{if(X>>>0<256){U=c[ab+((al|8)+aa|0)>>2]|0;Q=c[ab+((aa+12|0)+al|0)>>2]|0;R=5256712+(V<<1<<2)|0;do{if((U|0)!=(R|0)){if(U>>>0<(c[1314172]|0)>>>0){aq();return 0}if((c[U+12>>2]|0)==(Z|0)){break}aq();return 0}}while(0);if((Q|0)==(U|0)){c[1314168]=c[1314168]&(1<<V^-1);break}do{if((Q|0)==(R|0)){am=Q+8|0}else{if(Q>>>0<(c[1314172]|0)>>>0){aq();return 0}q=Q+8|0;if((c[q>>2]|0)==(Z|0)){am=q;break}aq();return 0}}while(0);c[U+12>>2]=Q;c[am>>2]=U}else{R=S;q=c[ab+((al|24)+aa|0)>>2]|0;P=c[ab+((aa+12|0)+al|0)>>2]|0;L2435:do{if((P|0)==(R|0)){O=al|16;g=ab+(J+O|0)|0;L=c[g>>2]|0;do{if((L|0)==0){e=ab+(O+aa|0)|0;M=c[e>>2]|0;if((M|0)==0){an=0;break L2435}else{ap=M;ar=e;break}}else{ap=L;ar=g}}while(0);while(1){g=ap+20|0;L=c[g>>2]|0;if((L|0)!=0){ap=L;ar=g;continue}g=ap+16|0;L=c[g>>2]|0;if((L|0)==0){break}else{ap=L;ar=g}}if(ar>>>0<(c[1314172]|0)>>>0){aq();return 0}else{c[ar>>2]=0;an=ap;break}}else{g=c[ab+((al|8)+aa|0)>>2]|0;if(g>>>0<(c[1314172]|0)>>>0){aq();return 0}L=g+12|0;if((c[L>>2]|0)!=(R|0)){aq();return 0}O=P+8|0;if((c[O>>2]|0)==(R|0)){c[L>>2]=P;c[O>>2]=g;an=P;break}else{aq();return 0}}}while(0);if((q|0)==0){break}P=ab+((aa+28|0)+al|0)|0;U=5256976+(c[P>>2]<<2)|0;do{if((R|0)==(c[U>>2]|0)){c[U>>2]=an;if((an|0)!=0){break}c[1314169]=c[1314169]&(1<<c[P>>2]^-1);break L2433}else{if(q>>>0<(c[1314172]|0)>>>0){aq();return 0}Q=q+16|0;if((c[Q>>2]|0)==(R|0)){c[Q>>2]=an}else{c[q+20>>2]=an}if((an|0)==0){break L2433}}}while(0);if(an>>>0<(c[1314172]|0)>>>0){aq();return 0}c[an+24>>2]=q;R=al|16;P=c[ab+(R+aa|0)>>2]|0;do{if((P|0)!=0){if(P>>>0<(c[1314172]|0)>>>0){aq();return 0}else{c[an+16>>2]=P;c[P+24>>2]=an;break}}}while(0);P=c[ab+(J+R|0)>>2]|0;if((P|0)==0){break}if(P>>>0<(c[1314172]|0)>>>0){aq();return 0}else{c[an+20>>2]=P;c[P+24>>2]=an;break}}}while(0);as=ab+(($|al)+aa|0)|0;at=$+K|0}else{as=Z;at=K}J=as+4|0;c[J>>2]=c[J>>2]&-2;c[ab+(W+4|0)>>2]=at|1;c[ab+(at+W|0)>>2]=at;J=at>>>3;if(at>>>0<256){V=J<<1;X=5256712+(V<<2)|0;P=c[1314168]|0;q=1<<J;do{if((P&q|0)==0){c[1314168]=P|q;au=X;av=5256712+(V+2<<2)|0}else{J=5256712+(V+2<<2)|0;U=c[J>>2]|0;if(U>>>0>=(c[1314172]|0)>>>0){au=U;av=J;break}aq();return 0}}while(0);c[av>>2]=_;c[au+12>>2]=_;c[ab+(W+8|0)>>2]=au;c[ab+(W+12|0)>>2]=X;break}V=ac;q=at>>>8;do{if((q|0)==0){aw=0}else{if(at>>>0>16777215){aw=31;break}P=(q+1048320|0)>>>16&8;$=q<<P;J=($+520192|0)>>>16&4;U=$<<J;$=(U+245760|0)>>>16&2;Q=(14-(J|P|$)|0)+(U<<$>>>15)|0;aw=at>>>((Q+7|0)>>>0)&1|Q<<1}}while(0);q=5256976+(aw<<2)|0;c[ab+(W+28|0)>>2]=aw;c[ab+(W+20|0)>>2]=0;c[ab+(W+16|0)>>2]=0;X=c[1314169]|0;Q=1<<aw;if((X&Q|0)==0){c[1314169]=X|Q;c[q>>2]=V;c[ab+(W+24|0)>>2]=q;c[ab+(W+12|0)>>2]=V;c[ab+(W+8|0)>>2]=V;break}if((aw|0)==31){ax=0}else{ax=25-(aw>>>1)|0}Q=at<<ax;X=c[q>>2]|0;while(1){if((c[X+4>>2]&-8|0)==(at|0)){break}ay=X+16+(Q>>>31<<2)|0;q=c[ay>>2]|0;if((q|0)==0){T=1811;break}else{Q=Q<<1;X=q}}if((T|0)==1811){if(ay>>>0<(c[1314172]|0)>>>0){aq();return 0}else{c[ay>>2]=V;c[ab+(W+24|0)>>2]=X;c[ab+(W+12|0)>>2]=V;c[ab+(W+8|0)>>2]=V;break}}Q=X+8|0;q=c[Q>>2]|0;$=c[1314172]|0;if(X>>>0<$>>>0){aq();return 0}if(q>>>0<$>>>0){aq();return 0}else{c[q+12>>2]=V;c[Q>>2]=V;c[ab+(W+8|0)>>2]=q;c[ab+(W+12|0)>>2]=X;c[ab+(W+24|0)>>2]=0;break}}}while(0);n=ab+(ak|8)|0;return n|0}}while(0);Y=ad;W=5257120;while(1){az=c[W>>2]|0;if(az>>>0<=Y>>>0){aC=c[W+4>>2]|0;aD=az+aC|0;if(aD>>>0>Y>>>0){break}}W=c[W+8>>2]|0}W=az+(aC-39|0)|0;if((W&7|0)==0){aF=0}else{aF=-W&7}W=az+((aC-47|0)+aF|0)|0;ac=W>>>0<(ad+16|0)>>>0?Y:W;W=ac+8|0;_=ab+8|0;if((_&7|0)==0){aG=0}else{aG=-_&7}_=(aa-40|0)-aG|0;c[1314174]=ab+aG|0;c[1314171]=_;c[ab+(aG+4|0)>>2]=_|1;c[ab+(aa-36|0)>>2]=40;c[1314175]=c[1311057]|0;c[ac+4>>2]=27;bu(W|0,5257120,16);c[1314280]=ab;c[1314281]=aa;c[1314283]=0;c[1314282]=W;W=ac+28|0;c[W>>2]=7;L2552:do{if((ac+32|0)>>>0<aD>>>0){_=W;while(1){K=_+4|0;c[K>>2]=7;if((_+8|0)>>>0<aD>>>0){_=K}else{break L2552}}}}while(0);if((ac|0)==(Y|0)){break}W=ac-ad|0;_=Y+(W+4|0)|0;c[_>>2]=c[_>>2]&-2;c[ad+4>>2]=W|1;c[Y+W>>2]=W;_=W>>>3;if(W>>>0<256){K=_<<1;Z=5256712+(K<<2)|0;S=c[1314168]|0;q=1<<_;do{if((S&q|0)==0){c[1314168]=S|q;aH=Z;aI=5256712+(K+2<<2)|0}else{_=5256712+(K+2<<2)|0;Q=c[_>>2]|0;if(Q>>>0>=(c[1314172]|0)>>>0){aH=Q;aI=_;break}aq();return 0}}while(0);c[aI>>2]=ad;c[aH+12>>2]=ad;c[ad+8>>2]=aH;c[ad+12>>2]=Z;break}K=ad;q=W>>>8;do{if((q|0)==0){aJ=0}else{if(W>>>0>16777215){aJ=31;break}S=(q+1048320|0)>>>16&8;Y=q<<S;ac=(Y+520192|0)>>>16&4;_=Y<<ac;Y=(_+245760|0)>>>16&2;Q=(14-(ac|S|Y)|0)+(_<<Y>>>15)|0;aJ=W>>>((Q+7|0)>>>0)&1|Q<<1}}while(0);q=5256976+(aJ<<2)|0;c[ad+28>>2]=aJ;c[ad+20>>2]=0;c[ad+16>>2]=0;Z=c[1314169]|0;Q=1<<aJ;if((Z&Q|0)==0){c[1314169]=Z|Q;c[q>>2]=K;c[ad+24>>2]=q;c[ad+12>>2]=ad;c[ad+8>>2]=ad;break}if((aJ|0)==31){aK=0}else{aK=25-(aJ>>>1)|0}Q=W<<aK;Z=c[q>>2]|0;while(1){if((c[Z+4>>2]&-8|0)==(W|0)){break}aL=Z+16+(Q>>>31<<2)|0;q=c[aL>>2]|0;if((q|0)==0){T=1846;break}else{Q=Q<<1;Z=q}}if((T|0)==1846){if(aL>>>0<(c[1314172]|0)>>>0){aq();return 0}else{c[aL>>2]=K;c[ad+24>>2]=Z;c[ad+12>>2]=ad;c[ad+8>>2]=ad;break}}Q=Z+8|0;W=c[Q>>2]|0;q=c[1314172]|0;if(Z>>>0<q>>>0){aq();return 0}if(W>>>0<q>>>0){aq();return 0}else{c[W+12>>2]=K;c[Q>>2]=K;c[ad+8>>2]=W;c[ad+12>>2]=Z;c[ad+24>>2]=0;break}}}while(0);ad=c[1314171]|0;if(ad>>>0<=o>>>0){break}W=ad-o|0;c[1314171]=W;ad=c[1314174]|0;Q=ad;c[1314174]=Q+o|0;c[Q+(o+4|0)>>2]=W|1;c[ad+4>>2]=o|3;n=ad+8|0;return n|0}}while(0);c[aB()>>2]=12;n=0;return n|0}function br(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0;if((a|0)==0){return}b=a-8|0;d=b;e=c[1314172]|0;if(b>>>0<e>>>0){aq()}f=c[a-4>>2]|0;g=f&3;if((g|0)==1){aq()}h=f&-8;i=a+(h-8|0)|0;j=i;L2615:do{if((f&1|0)==0){k=c[b>>2]|0;if((g|0)==0){return}l=-8-k|0;m=a+l|0;n=m;o=k+h|0;if(m>>>0<e>>>0){aq()}if((n|0)==(c[1314173]|0)){p=a+(h-4|0)|0;if((c[p>>2]&3|0)!=3){q=n;r=o;break}c[1314170]=o;c[p>>2]=c[p>>2]&-2;c[a+(l+4|0)>>2]=o|1;c[i>>2]=o;return}p=k>>>3;if(k>>>0<256){k=c[a+(l+8|0)>>2]|0;s=c[a+(l+12|0)>>2]|0;t=5256712+(p<<1<<2)|0;do{if((k|0)!=(t|0)){if(k>>>0<e>>>0){aq()}if((c[k+12>>2]|0)==(n|0)){break}aq()}}while(0);if((s|0)==(k|0)){c[1314168]=c[1314168]&(1<<p^-1);q=n;r=o;break}do{if((s|0)==(t|0)){u=s+8|0}else{if(s>>>0<e>>>0){aq()}v=s+8|0;if((c[v>>2]|0)==(n|0)){u=v;break}aq()}}while(0);c[k+12>>2]=s;c[u>>2]=k;q=n;r=o;break}t=m;p=c[a+(l+24|0)>>2]|0;v=c[a+(l+12|0)>>2]|0;L2649:do{if((v|0)==(t|0)){w=a+(l+20|0)|0;x=c[w>>2]|0;do{if((x|0)==0){y=a+(l+16|0)|0;z=c[y>>2]|0;if((z|0)==0){A=0;break L2649}else{B=z;C=y;break}}else{B=x;C=w}}while(0);while(1){w=B+20|0;x=c[w>>2]|0;if((x|0)!=0){B=x;C=w;continue}w=B+16|0;x=c[w>>2]|0;if((x|0)==0){break}else{B=x;C=w}}if(C>>>0<e>>>0){aq()}else{c[C>>2]=0;A=B;break}}else{w=c[a+(l+8|0)>>2]|0;if(w>>>0<e>>>0){aq()}x=w+12|0;if((c[x>>2]|0)!=(t|0)){aq()}y=v+8|0;if((c[y>>2]|0)==(t|0)){c[x>>2]=v;c[y>>2]=w;A=v;break}else{aq()}}}while(0);if((p|0)==0){q=n;r=o;break}v=a+(l+28|0)|0;m=5256976+(c[v>>2]<<2)|0;do{if((t|0)==(c[m>>2]|0)){c[m>>2]=A;if((A|0)!=0){break}c[1314169]=c[1314169]&(1<<c[v>>2]^-1);q=n;r=o;break L2615}else{if(p>>>0<(c[1314172]|0)>>>0){aq()}k=p+16|0;if((c[k>>2]|0)==(t|0)){c[k>>2]=A}else{c[p+20>>2]=A}if((A|0)==0){q=n;r=o;break L2615}}}while(0);if(A>>>0<(c[1314172]|0)>>>0){aq()}c[A+24>>2]=p;t=c[a+(l+16|0)>>2]|0;do{if((t|0)!=0){if(t>>>0<(c[1314172]|0)>>>0){aq()}else{c[A+16>>2]=t;c[t+24>>2]=A;break}}}while(0);t=c[a+(l+20|0)>>2]|0;if((t|0)==0){q=n;r=o;break}if(t>>>0<(c[1314172]|0)>>>0){aq()}else{c[A+20>>2]=t;c[t+24>>2]=A;q=n;r=o;break}}else{q=d;r=h}}while(0);d=q;if(d>>>0>=i>>>0){aq()}A=a+(h-4|0)|0;e=c[A>>2]|0;if((e&1|0)==0){aq()}do{if((e&2|0)==0){if((j|0)==(c[1314174]|0)){B=(c[1314171]|0)+r|0;c[1314171]=B;c[1314174]=q;c[q+4>>2]=B|1;if((q|0)==(c[1314173]|0)){c[1314173]=0;c[1314170]=0}if(B>>>0<=(c[1314175]|0)>>>0){return}bs(0);return}if((j|0)==(c[1314173]|0)){B=(c[1314170]|0)+r|0;c[1314170]=B;c[1314173]=q;c[q+4>>2]=B|1;c[d+B>>2]=B;return}B=(e&-8)+r|0;C=e>>>3;L2721:do{if(e>>>0<256){u=c[a+h>>2]|0;g=c[a+(h|4)>>2]|0;b=5256712+(C<<1<<2)|0;do{if((u|0)!=(b|0)){if(u>>>0<(c[1314172]|0)>>>0){aq()}if((c[u+12>>2]|0)==(j|0)){break}aq()}}while(0);if((g|0)==(u|0)){c[1314168]=c[1314168]&(1<<C^-1);break}do{if((g|0)==(b|0)){D=g+8|0}else{if(g>>>0<(c[1314172]|0)>>>0){aq()}f=g+8|0;if((c[f>>2]|0)==(j|0)){D=f;break}aq()}}while(0);c[u+12>>2]=g;c[D>>2]=u}else{b=i;f=c[a+(h+16|0)>>2]|0;t=c[a+(h|4)>>2]|0;L2742:do{if((t|0)==(b|0)){p=a+(h+12|0)|0;v=c[p>>2]|0;do{if((v|0)==0){m=a+(h+8|0)|0;k=c[m>>2]|0;if((k|0)==0){E=0;break L2742}else{F=k;G=m;break}}else{F=v;G=p}}while(0);while(1){p=F+20|0;v=c[p>>2]|0;if((v|0)!=0){F=v;G=p;continue}p=F+16|0;v=c[p>>2]|0;if((v|0)==0){break}else{F=v;G=p}}if(G>>>0<(c[1314172]|0)>>>0){aq()}else{c[G>>2]=0;E=F;break}}else{p=c[a+h>>2]|0;if(p>>>0<(c[1314172]|0)>>>0){aq()}v=p+12|0;if((c[v>>2]|0)!=(b|0)){aq()}m=t+8|0;if((c[m>>2]|0)==(b|0)){c[v>>2]=t;c[m>>2]=p;E=t;break}else{aq()}}}while(0);if((f|0)==0){break}t=a+(h+20|0)|0;u=5256976+(c[t>>2]<<2)|0;do{if((b|0)==(c[u>>2]|0)){c[u>>2]=E;if((E|0)!=0){break}c[1314169]=c[1314169]&(1<<c[t>>2]^-1);break L2721}else{if(f>>>0<(c[1314172]|0)>>>0){aq()}g=f+16|0;if((c[g>>2]|0)==(b|0)){c[g>>2]=E}else{c[f+20>>2]=E}if((E|0)==0){break L2721}}}while(0);if(E>>>0<(c[1314172]|0)>>>0){aq()}c[E+24>>2]=f;b=c[a+(h+8|0)>>2]|0;do{if((b|0)!=0){if(b>>>0<(c[1314172]|0)>>>0){aq()}else{c[E+16>>2]=b;c[b+24>>2]=E;break}}}while(0);b=c[a+(h+12|0)>>2]|0;if((b|0)==0){break}if(b>>>0<(c[1314172]|0)>>>0){aq()}else{c[E+20>>2]=b;c[b+24>>2]=E;break}}}while(0);c[q+4>>2]=B|1;c[d+B>>2]=B;if((q|0)!=(c[1314173]|0)){H=B;break}c[1314170]=B;return}else{c[A>>2]=e&-2;c[q+4>>2]=r|1;c[d+r>>2]=r;H=r}}while(0);r=H>>>3;if(H>>>0<256){d=r<<1;e=5256712+(d<<2)|0;A=c[1314168]|0;E=1<<r;do{if((A&E|0)==0){c[1314168]=A|E;I=e;J=5256712+(d+2<<2)|0}else{r=5256712+(d+2<<2)|0;h=c[r>>2]|0;if(h>>>0>=(c[1314172]|0)>>>0){I=h;J=r;break}aq()}}while(0);c[J>>2]=q;c[I+12>>2]=q;c[q+8>>2]=I;c[q+12>>2]=e;return}e=q;I=H>>>8;do{if((I|0)==0){K=0}else{if(H>>>0>16777215){K=31;break}J=(I+1048320|0)>>>16&8;d=I<<J;E=(d+520192|0)>>>16&4;A=d<<E;d=(A+245760|0)>>>16&2;r=(14-(E|J|d)|0)+(A<<d>>>15)|0;K=H>>>((r+7|0)>>>0)&1|r<<1}}while(0);I=5256976+(K<<2)|0;c[q+28>>2]=K;c[q+20>>2]=0;c[q+16>>2]=0;r=c[1314169]|0;d=1<<K;do{if((r&d|0)==0){c[1314169]=r|d;c[I>>2]=e;c[q+24>>2]=I;c[q+12>>2]=q;c[q+8>>2]=q}else{if((K|0)==31){L=0}else{L=25-(K>>>1)|0}A=H<<L;J=c[I>>2]|0;while(1){if((c[J+4>>2]&-8|0)==(H|0)){break}M=J+16+(A>>>31<<2)|0;E=c[M>>2]|0;if((E|0)==0){N=2025;break}else{A=A<<1;J=E}}if((N|0)==2025){if(M>>>0<(c[1314172]|0)>>>0){aq()}else{c[M>>2]=e;c[q+24>>2]=J;c[q+12>>2]=q;c[q+8>>2]=q;break}}A=J+8|0;B=c[A>>2]|0;E=c[1314172]|0;if(J>>>0<E>>>0){aq()}if(B>>>0<E>>>0){aq()}else{c[B+12>>2]=e;c[A>>2]=e;c[q+8>>2]=B;c[q+12>>2]=J;c[q+24>>2]=0;break}}}while(0);q=(c[1314176]|0)-1|0;c[1314176]=q;if((q|0)==0){O=5257128}else{return}while(1){q=c[O>>2]|0;if((q|0)==0){break}else{O=q+8|0}}c[1314176]=-1;return}function bs(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0;do{if((c[1311053]|0)==0){b=ao(8)|0;if((b-1&b|0)==0){c[1311055]=b;c[1311054]=b;c[1311056]=-1;c[1311057]=2097152;c[1311058]=0;c[1314279]=0;c[1311053]=aE(0)&-16^1431655768;break}else{aq();return 0}}}while(0);if(a>>>0>=4294967232){d=0;e=d&1;return e|0}b=c[1314174]|0;if((b|0)==0){d=0;e=d&1;return e|0}f=c[1314171]|0;do{if(f>>>0>(a+40|0)>>>0){g=c[1311055]|0;h=_(((((((-40-a|0)-1|0)+f|0)+g|0)>>>0)/(g>>>0)>>>0)-1|0,g);i=b;j=5257120;while(1){k=c[j>>2]|0;if(k>>>0<=i>>>0){if((k+(c[j+4>>2]|0)|0)>>>0>i>>>0){l=j;break}}k=c[j+8>>2]|0;if((k|0)==0){l=0;break}else{j=k}}if((c[l+12>>2]&8|0)!=0){break}j=aA(0)|0;i=l+4|0;if((j|0)!=((c[l>>2]|0)+(c[i>>2]|0)|0)){break}k=aA(-(h>>>0>2147483646?-2147483648-g|0:h)|0)|0;m=aA(0)|0;if(!((k|0)!=-1&m>>>0<j>>>0)){break}k=j-m|0;if((j|0)==(m|0)){break}c[i>>2]=(c[i>>2]|0)-k|0;c[1314276]=(c[1314276]|0)-k|0;i=c[1314174]|0;n=(c[1314171]|0)-k|0;k=i;o=i+8|0;if((o&7|0)==0){p=0}else{p=-o&7}o=n-p|0;c[1314174]=k+p|0;c[1314171]=o;c[k+(p+4|0)>>2]=o|1;c[k+(n+4|0)>>2]=40;c[1314175]=c[1311057]|0;d=(j|0)!=(m|0);e=d&1;return e|0}}while(0);if((c[1314171]|0)>>>0<=(c[1314175]|0)>>>0){d=0;e=d&1;return e|0}c[1314175]=-1;d=0;e=d&1;return e|0}function bt(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0;f=b+e|0;if((e|0)>=20){d=d&255;e=b&3;g=d|d<<8|d<<16|d<<24;h=f&~3;if(e){e=b+4-e|0;while((b|0)<(e|0)){a[b]=d;b=b+1|0}}while((b|0)<(h|0)){c[b>>2]=g;b=b+4|0}}while((b|0)<(f|0)){a[b]=d;b=b+1|0}}function bu(b,d,e){b=b|0;d=d|0;e=e|0;var f=0;f=b|0;if((b&3)==(d&3)){while(b&3){if((e|0)==0)return f|0;a[b]=a[d]|0;b=b+1|0;d=d+1|0;e=e-1|0}while((e|0)>=4){c[b>>2]=c[d>>2]|0;b=b+4|0;d=d+4|0;e=e-4|0}}while((e|0)>0){a[b]=a[d]|0;b=b+1|0;d=d+1|0;e=e-1|0}return f|0}function bv(b){b=b|0;var c=0;c=b;while(a[c]|0!=0){c=c+1|0}return c-b|0}function bw(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;return aG[a&15](b|0,c|0,d|0)|0}function bx(a,b){a=a|0;b=b|0;aH[a&15](b|0)}function by(a,b,c){a=a|0;b=b|0;c=c|0;aI[a&15](b|0,c|0)}function bz(a,b){a=a|0;b=b|0;return aJ[a&15](b|0)|0}function bA(a){a=a|0;aK[a&15]()}function bB(a,b,c){a=a|0;b=b|0;c=c|0;return aL[a&15](b|0,c|0)|0}function bC(a,b,c){a=a|0;b=b|0;c=c|0;$(0);return 0}function bD(a){a=a|0;$(1)}function bE(a,b){a=a|0;b=b|0;$(2)}function bF(a){a=a|0;$(3);return 0}function bG(){$(4)}function bH(a,b){a=a|0;b=b|0;$(5);return 0}
// EMSCRIPTEN_END_FUNCS
var aG=[bC,bC,bC,bC,bl,bC,bC,bC,bC,bC,bC,bC,bC,bC,bC,bC];var aH=[bD,bD,bD,bD,bD,bD,bD,bD,bD,bD,bD,bD,bD,bD,bD,bD];var aI=[bE,bE,bE,bE,bE,bE,bE,bE,bE,bE,bm,bE,bE,bE,bE,bE];var aJ=[bF,bF,bF,bF,bF,bF,bF,bF,bF,bF,bF,bF,bF,bF,bF,bF];var aK=[bG,bG,bG,bG,bG,bG,bG,bG,bG,bG,bG,bG,bG,bG,bG,bG];var aL=[bH,bH,a8,bH,bH,bH,a9,bH,a7,bH,bH,bH,bH,bH,bH,bH];return{_strlen:bv,_free:br,_main:a$,_memset:bt,_malloc:bq,_memcpy:bu,stackAlloc:aM,stackSave:aN,stackRestore:aO,setThrew:aP,setTempRet0:aQ,setTempRet1:aR,setTempRet2:aS,setTempRet3:aT,setTempRet4:aU,setTempRet5:aV,setTempRet6:aW,setTempRet7:aX,setTempRet8:aY,setTempRet9:aZ,dynCall_iiii:bw,dynCall_vi:bx,dynCall_vii:by,dynCall_ii:bz,dynCall_v:bA,dynCall_iii:bB}})
// EMSCRIPTEN_END_ASM
({ Math: Math, Int8Array: Int8Array, Int16Array: Int16Array, Int32Array: Int32Array, Uint8Array: Uint8Array, Uint16Array: Uint16Array, Uint32Array: Uint32Array, Float32Array: Float32Array, Float64Array: Float64Array }, { abort: abort, assert: assert, asmPrintInt: asmPrintInt, asmPrintFloat: asmPrintFloat, copyTempDouble: copyTempDouble, copyTempFloat: copyTempFloat, min: Math_min, invoke_iiii: invoke_iiii, invoke_vi: invoke_vi, invoke_vii: invoke_vii, invoke_ii: invoke_ii, invoke_v: invoke_v, invoke_iii: invoke_iii, _strncmp: _strncmp, _llvm_lifetime_end: _llvm_lifetime_end, _sysconf: _sysconf, _fread: _fread, _abort: _abort, _pread: _pread, _feof: _feof, ___setErrNo: ___setErrNo, _fwrite: _fwrite, _write: _write, _read: _read, _ferror: _ferror, ___assert_func: ___assert_func, _pwrite: _pwrite, _sbrk: _sbrk, ___errno_location: ___errno_location, _llvm_lifetime_start: _llvm_lifetime_start, _llvm_bswap_i32: _llvm_bswap_i32, _time: _time, _strcmp: _strcmp, STACKTOP: STACKTOP, STACK_MAX: STACK_MAX, tempDoublePtr: tempDoublePtr, ABORT: ABORT, NaN: NaN, Infinity: Infinity, _stdout: _stdout, _stderr: _stderr, _stdin: _stdin }, buffer);
var _strlen = Module["_strlen"] = asm._strlen;
var _free = Module["_free"] = asm._free;
var _main = Module["_main"] = asm._main;
var _memset = Module["_memset"] = asm._memset;
var _malloc = Module["_malloc"] = asm._malloc;
var _memcpy = Module["_memcpy"] = asm._memcpy;
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