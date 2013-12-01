var key = ['zlib_noasm'];
var global;
if (typeof module !== 'undefined' && module.exports) {
  global = module.exports;
} else if(typeof window !== 'undefined') {
  global = window;
} else {
  global = this;
}

global[key] = (function () {
  var Module = {
    noInitialRun: true
  };



// Note: For maximum-speed code, see "Optimizing Code" on the Emscripten wiki, https://github.com/kripken/emscripten/wiki/Optimizing-Code
// Note: Some Emscripten settings may limit the speed of the generated code.
// The Module object: Our interface to the outside world. We import
// and export values on it, and do the work to get that through
// closure compiler if necessary. There are various ways Module can be used:
// 1. Not defined. We create it here
// 2. A function parameter, function(Module) { ..generated code.. }
// 3. pre-run appended it, var Module = {}; ..generated code..
// 4. External script tag defines var Module.
// We need to do an eval in order to handle the closure compiler
// case, where this code here is minified but Module was defined
// elsewhere (e.g. case 4 above). We also need to check if Module
// already exists (e.g. case 3 above).
// Note that if you want to run closure, and also to use Module
// after the generated code, you will need to define   var Module = {};
// before the code. Then that object will be used in the code, and you
// can continue to use Module afterwards as well.
var Module;
if (!Module) Module = eval('(function() { try { return Module || {} } catch(e) { return {} } })()');
// Sometimes an existing Module object exists with properties
// meant to overwrite the default module functionality. Here
// we collect those properties and reapply _after_ we configure
// the current environment's defaults to avoid having to be so
// defensive during initialization.
var moduleOverrides = {};
for (var key in Module) {
  if (Module.hasOwnProperty(key)) {
    moduleOverrides[key] = Module[key];
  }
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
  Module['print'] = function print(x) {
    process['stdout'].write(x + '\n');
  };
  Module['printErr'] = function printErr(x) {
    process['stderr'].write(x + '\n');
  };
  var nodeFS = require('fs');
  var nodePath = require('path');
  Module['read'] = function read(filename, binary) {
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
  Module['readBinary'] = function readBinary(filename) { return Module['read'](filename, true) };
  Module['load'] = function load(f) {
    globalEval(read(f));
  };
  Module['arguments'] = process['argv'].slice(2);
  module['exports'] = Module;
}
else if (ENVIRONMENT_IS_SHELL) {
  Module['print'] = print;
  if (typeof printErr != 'undefined') Module['printErr'] = printErr; // not present in v8 or older sm
  if (typeof read != 'undefined') {
    Module['read'] = read;
  } else {
    Module['read'] = function read() { throw 'no read() available (jsc?)' };
  }
  Module['readBinary'] = function readBinary(f) {
    return read(f, 'binary');
  };
  if (typeof scriptArgs != 'undefined') {
    Module['arguments'] = scriptArgs;
  } else if (typeof arguments != 'undefined') {
    Module['arguments'] = arguments;
  }
  this['Module'] = Module;
}
else if (ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER) {
  Module['read'] = function read(url) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, false);
    xhr.send(null);
    return xhr.responseText;
  };
  if (typeof arguments != 'undefined') {
    Module['arguments'] = arguments;
  }
  if (typeof console !== 'undefined') {
    Module['print'] = function print(x) {
      console.log(x);
    };
    Module['printErr'] = function printErr(x) {
      console.log(x);
    };
  } else {
    // Probably a worker, and without console.log. We can do very little here...
    var TRY_USE_DUMP = false;
    Module['print'] = (TRY_USE_DUMP && (typeof(dump) !== "undefined") ? (function(x) {
      dump(x);
    }) : (function(x) {
      // self.postMessage(x); // enable this if you want stdout to be sent as messages
    }));
  }
  if (ENVIRONMENT_IS_WEB) {
    this['Module'] = Module;
  } else {
    Module['load'] = importScripts;
  }
}
else {
  // Unreachable because SHELL is dependant on the others
  throw 'Unknown runtime environment. Where are we?';
}
function globalEval(x) {
  eval.call(null, x);
}
if (!Module['load'] == 'undefined' && Module['read']) {
  Module['load'] = function load(f) {
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
Module['preRun'] = [];
Module['postRun'] = [];
// Merge back in the overrides
for (var key in moduleOverrides) {
  if (moduleOverrides.hasOwnProperty(key)) {
    Module[key] = moduleOverrides[key];
  }
}
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
      return '(((' +target + ')+' + (quantum-1) + ')&' + -quantum + ')';
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
  if (isArrayType(type)) return true;
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
  getNativeTypeSize: function (type) {
    switch (type) {
      case 'i1': case 'i8': return 1;
      case 'i16': return 2;
      case 'i32': return 4;
      case 'i64': return 8;
      case 'float': return 4;
      case 'double': return 8;
      default: {
        if (type[type.length-1] === '*') {
          return Runtime.QUANTUM_SIZE; // A pointer
        } else if (type[0] === 'i') {
          var bits = parseInt(type.substr(1));
          assert(bits % 8 === 0);
          return bits/8;
        } else {
          return 0;
        }
      }
    }
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
  STACK_ALIGN: 8,
  getAlignSize: function (type, size, vararg) {
    // we align i64s and doubles on 64-bit boundaries, unlike x86
    if (type == 'i64' || type == 'double' || vararg) return 8;
    if (!type) return Math.min(size, 8); // align structures internally to 64 bits
    return Math.min(size || (type ? Runtime.getNativeFieldSize(type) : 0), Runtime.QUANTUM_SIZE);
  },
  calculateStructAlignment: function calculateStructAlignment(type) {
    type.flatSize = 0;
    type.alignSize = 0;
    var diffs = [];
    var prev = -1;
    var index = 0;
    type.flatIndexes = type.fields.map(function(field) {
      index++;
      var size, alignSize;
      if (Runtime.isNumberType(field) || Runtime.isPointerType(field)) {
        size = Runtime.getNativeTypeSize(field); // pack char; char; in structs, also char[X]s.
        alignSize = Runtime.getAlignSize(field, size);
      } else if (Runtime.isStructType(field)) {
        if (field[1] === '0') {
          // this is [0 x something]. When inside another structure like here, it must be at the end,
          // and it adds no size
          // XXX this happens in java-nbody for example... assert(index === type.fields.length, 'zero-length in the middle!');
          size = 0;
          if (Types.types[field]) {
            alignSize = Runtime.getAlignSize(null, Types.types[field].alignSize);
          } else {
            alignSize = type.alignSize || QUANTUM_SIZE;
          }
        } else {
          size = Types.types[field].flatSize;
          alignSize = Runtime.getAlignSize(null, Types.types[field].alignSize);
        }
      } else if (field[0] == 'b') {
        // bN, large number field, like a [N x i8]
        size = field.substr(1)|0;
        alignSize = 1;
      } else if (field[0] === '<') {
        // vector type
        size = alignSize = Types.types[field].flatSize; // fully aligned
      } else if (field[0] === 'i') {
        // illegal integer field, that could not be legalized because it is an internal structure field
        // it is ok to have such fields, if we just use them as markers of field size and nothing more complex
        size = alignSize = parseInt(field.substr(1))/8;
        assert(size % 1 === 0, 'cannot handle non-byte-size field ' + field);
      } else {
        assert(false, 'invalid type for calculateStructAlignment');
      }
      if (type.packed) alignSize = 1;
      type.alignSize = Math.max(type.alignSize, alignSize);
      var curr = Runtime.alignMemory(type.flatSize, alignSize); // if necessary, place this on aligned memory
      type.flatSize = curr + size;
      if (prev >= 0) {
        diffs.push(curr-prev);
      }
      prev = curr;
      return curr;
    });
    if (type.name_[0] === '[') {
      // arrays have 2 elements, so we get the proper difference. then we scale here. that way we avoid
      // allocating a potentially huge array for [999999 x i8] etc.
      type.flatSize = parseInt(type.name_.substr(1))*type.flatSize/2;
    }
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
  addFunction: function (func) {
    var table = FUNCTION_TABLE;
    var ret = table.length;
    assert(ret % 2 === 0);
    table.push(func);
    for (var i = 0; i < 2-1; i++) table.push(0);
    return ret;
  },
  removeFunction: function (index) {
    var table = FUNCTION_TABLE;
    table[index] = null;
  },
  getAsmConst: function (code, numArgs) {
    // code is a constant string on the heap, so we can cache these
    if (!Runtime.asmConstCache) Runtime.asmConstCache = {};
    var func = Runtime.asmConstCache[code];
    if (func) return func;
    var args = [];
    for (var i = 0; i < numArgs; i++) {
      args.push(String.fromCharCode(36) + i); // $0, $1 etc
    }
    return Runtime.asmConstCache[code] = eval('(function(' + args.join(',') + '){ ' + Pointer_stringify(code) + ' })'); // new Function does not allow upvars in node
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
      Runtime.funcWrappers[func] = function dynCall_wrapper() {
        return Runtime.dynCall(sig, func, arguments);
      };
    }
    return Runtime.funcWrappers[func];
  },
  UTF8Processor: function () {
    var buffer = [];
    var needed = 0;
    this.processCChar = function (code) {
      code = code & 0xFF;
      if (buffer.length == 0) {
        if ((code & 0x80) == 0x00) {        // 0xxxxxxx
          return String.fromCharCode(code);
        }
        buffer.push(code);
        if ((code & 0xE0) == 0xC0) {        // 110xxxxx
          needed = 1;
        } else if ((code & 0xF0) == 0xE0) { // 1110xxxx
          needed = 2;
        } else {                            // 11110xxx
          needed = 3;
        }
        return '';
      }
      if (needed) {
        buffer.push(code);
        needed--;
        if (needed > 0) return '';
      }
      var c1 = buffer[0];
      var c2 = buffer[1];
      var c3 = buffer[2];
      var c4 = buffer[3];
      var ret;
      if (buffer.length == 2) {
        ret = String.fromCharCode(((c1 & 0x1F) << 6)  | (c2 & 0x3F));
      } else if (buffer.length == 3) {
        ret = String.fromCharCode(((c1 & 0x0F) << 12) | ((c2 & 0x3F) << 6)  | (c3 & 0x3F));
      } else {
        // http://mathiasbynens.be/notes/javascript-encoding#surrogate-formulae
        var codePoint = ((c1 & 0x07) << 18) | ((c2 & 0x3F) << 12) |
                        ((c3 & 0x3F) << 6)  | (c4 & 0x3F);
        ret = String.fromCharCode(
          Math.floor((codePoint - 0x10000) / 0x400) + 0xD800,
          (codePoint - 0x10000) % 0x400 + 0xDC00);
      }
      buffer.length = 0;
      return ret;
    }
    this.processJSString = function processJSString(string) {
      string = unescape(encodeURIComponent(string));
      var ret = [];
      for (var i = 0; i < string.length; i++) {
        ret.push(string.charCodeAt(i));
      }
      return ret;
    }
  },
  stackAlloc: function (size) { var ret = STACKTOP;STACKTOP = (STACKTOP + size)|0;STACKTOP = (((STACKTOP)+7)&-8); return ret; },
  staticAlloc: function (size) { var ret = STATICTOP;STATICTOP = (STATICTOP + size)|0;STATICTOP = (((STATICTOP)+7)&-8); return ret; },
  dynamicAlloc: function (size) { var ret = DYNAMICTOP;DYNAMICTOP = (DYNAMICTOP + size)|0;DYNAMICTOP = (((DYNAMICTOP)+7)&-8); if (DYNAMICTOP >= TOTAL_MEMORY) enlargeMemory();; return ret; },
  alignMemory: function (size,quantum) { var ret = size = Math.ceil((size)/(quantum ? quantum : 8))*(quantum ? quantum : 8); return ret; },
  makeBigInt: function (low,high,unsigned) { var ret = (unsigned ? ((low>>>0)+((high>>>0)*4294967296)) : ((low>>>0)+((high|0)*4294967296))); return ret; },
  GLOBAL_BASE: 8,
  QUANTUM_SIZE: 4,
  __dummy__: 0
}
//========================================
// Runtime essentials
//========================================
var __THREW__ = 0; // Used in checking for thrown exceptions.
var setjmpId = 1; // Used in setjmp/longjmp
var setjmpLabels = {};
var ABORT = false; // whether we are quitting the application. no code should run after this. set in exit() and abort()
var EXITSTATUS = 0;
var undef = 0;
// tempInt is used for 32-bit signed values or smaller. tempBigInt is used
// for 32-bit unsigned values or more than 32 bits. TODO: audit all uses of tempInt
var tempValue, tempInt, tempBigInt, tempInt2, tempBigInt2, tempPair, tempBigIntI, tempBigIntR, tempBigIntS, tempBigIntP, tempBigIntD, tempDouble, tempFloat;
var tempI64, tempI64b;
var tempRet0, tempRet1, tempRet2, tempRet3, tempRet4, tempRet5, tempRet6, tempRet7, tempRet8, tempRet9;
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
//                   'array' for JavaScript arrays and typed arrays; note that arrays are 8-bit).
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
    var func = Module['_' + ident]; // closure exported function
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
      value = intArrayFromString(value);
      type = 'array';
    }
    if (type == 'array') {
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
      case 'i64': (tempI64 = [value>>>0,(tempDouble=value,Math_abs(tempDouble) >= 1 ? (tempDouble > 0 ? Math_min(Math_floor((tempDouble)/4294967296), 4294967295)>>>0 : (~~(Math_ceil((tempDouble - +(((~~(tempDouble)))>>>0))/4294967296)))>>>0) : 0)],HEAP32[((ptr)>>2)]=tempI64[0],HEAP32[(((ptr)+(4))>>2)]=tempI64[1]); break;
      case 'float': HEAPF32[((ptr)>>2)]=value; break;
      case 'double': HEAPF64[((ptr)>>3)]=value; break;
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
      case 'double': return HEAPF64[((ptr)>>3)];
      default: abort('invalid type for setValue: ' + type);
    }
  return null;
}
Module['getValue'] = getValue;
var ALLOC_NORMAL = 0; // Tries to use _malloc()
var ALLOC_STACK = 1; // Lives for the duration of the current function call
var ALLOC_STATIC = 2; // Cannot be freed
var ALLOC_DYNAMIC = 3; // Cannot be freed except through sbrk
var ALLOC_NONE = 4; // Do not allocate
Module['ALLOC_NORMAL'] = ALLOC_NORMAL;
Module['ALLOC_STACK'] = ALLOC_STACK;
Module['ALLOC_STATIC'] = ALLOC_STATIC;
Module['ALLOC_DYNAMIC'] = ALLOC_DYNAMIC;
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
    ret = [_malloc, Runtime.stackAlloc, Runtime.staticAlloc, Runtime.dynamicAlloc][allocator === undefined ? ALLOC_STATIC : allocator](Math.max(size, singleType ? 1 : types.length));
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
    if (slab.subarray || slab.slice) {
      HEAPU8.set(slab, ret);
    } else {
      HEAPU8.set(new Uint8Array(slab), ret);
    }
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
  // TODO: use TextDecoder
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
// Given a pointer 'ptr' to a null-terminated UTF16LE-encoded string in the emscripten HEAP, returns
// a copy of that string as a Javascript String object.
function UTF16ToString(ptr) {
  var i = 0;
  var str = '';
  while (1) {
    var codeUnit = HEAP16[(((ptr)+(i*2))>>1)];
    if (codeUnit == 0)
      return str;
    ++i;
    // fromCharCode constructs a character from a UTF-16 code unit, so we can pass the UTF16 string right through.
    str += String.fromCharCode(codeUnit);
  }
}
Module['UTF16ToString'] = UTF16ToString;
// Copies the given Javascript String object 'str' to the emscripten HEAP at address 'outPtr', 
// null-terminated and encoded in UTF16LE form. The copy will require at most (str.length*2+1)*2 bytes of space in the HEAP.
function stringToUTF16(str, outPtr) {
  for(var i = 0; i < str.length; ++i) {
    // charCodeAt returns a UTF-16 encoded code unit, so it can be directly written to the HEAP.
    var codeUnit = str.charCodeAt(i); // possibly a lead surrogate
    HEAP16[(((outPtr)+(i*2))>>1)]=codeUnit
  }
  // Null-terminate the pointer to the HEAP.
  HEAP16[(((outPtr)+(str.length*2))>>1)]=0
}
Module['stringToUTF16'] = stringToUTF16;
// Given a pointer 'ptr' to a null-terminated UTF32LE-encoded string in the emscripten HEAP, returns
// a copy of that string as a Javascript String object.
function UTF32ToString(ptr) {
  var i = 0;
  var str = '';
  while (1) {
    var utf32 = HEAP32[(((ptr)+(i*4))>>2)];
    if (utf32 == 0)
      return str;
    ++i;
    // Gotcha: fromCharCode constructs a character from a UTF-16 encoded code (pair), not from a Unicode code point! So encode the code point to UTF-16 for constructing.
    if (utf32 >= 0x10000) {
      var ch = utf32 - 0x10000;
      str += String.fromCharCode(0xD800 | (ch >> 10), 0xDC00 | (ch & 0x3FF));
    } else {
      str += String.fromCharCode(utf32);
    }
  }
}
Module['UTF32ToString'] = UTF32ToString;
// Copies the given Javascript String object 'str' to the emscripten HEAP at address 'outPtr', 
// null-terminated and encoded in UTF32LE form. The copy will require at most (str.length+1)*4 bytes of space in the HEAP,
// but can use less, since str.length does not return the number of characters in the string, but the number of UTF-16 code units in the string.
function stringToUTF32(str, outPtr) {
  var iChar = 0;
  for(var iCodeUnit = 0; iCodeUnit < str.length; ++iCodeUnit) {
    // Gotcha: charCodeAt returns a 16-bit word that is a UTF-16 encoded code unit, not a Unicode code point of the character! We must decode the string to UTF-32 to the heap.
    var codeUnit = str.charCodeAt(iCodeUnit); // possibly a lead surrogate
    if (codeUnit >= 0xD800 && codeUnit <= 0xDFFF) {
      var trailSurrogate = str.charCodeAt(++iCodeUnit);
      codeUnit = 0x10000 + ((codeUnit & 0x3FF) << 10) | (trailSurrogate & 0x3FF);
    }
    HEAP32[(((outPtr)+(iChar*4))>>2)]=codeUnit
    ++iChar;
  }
  // Null-terminate the pointer to the HEAP.
  HEAP32[(((outPtr)+(iChar*4))>>2)]=0
}
Module['stringToUTF32'] = stringToUTF32;
function demangle(func) {
  try {
    if (typeof func === 'number') func = Pointer_stringify(func);
    if (func[0] !== '_') return func;
    if (func[1] !== '_') return func; // C function
    if (func[2] !== 'Z') return func;
    switch (func[3]) {
      case 'n': return 'operator new()';
      case 'd': return 'operator delete()';
    }
    var i = 3;
    // params, etc.
    var basicTypes = {
      'v': 'void',
      'b': 'bool',
      'c': 'char',
      's': 'short',
      'i': 'int',
      'l': 'long',
      'f': 'float',
      'd': 'double',
      'w': 'wchar_t',
      'a': 'signed char',
      'h': 'unsigned char',
      't': 'unsigned short',
      'j': 'unsigned int',
      'm': 'unsigned long',
      'x': 'long long',
      'y': 'unsigned long long',
      'z': '...'
    };
    function dump(x) {
      //return;
      if (x) Module.print(x);
      Module.print(func);
      var pre = '';
      for (var a = 0; a < i; a++) pre += ' ';
      Module.print (pre + '^');
    }
    var subs = [];
    function parseNested() {
      i++;
      if (func[i] === 'K') i++; // ignore const
      var parts = [];
      while (func[i] !== 'E') {
        if (func[i] === 'S') { // substitution
          i++;
          var next = func.indexOf('_', i);
          var num = func.substring(i, next) || 0;
          parts.push(subs[num] || '?');
          i = next+1;
          continue;
        }
        if (func[i] === 'C') { // constructor
          parts.push(parts[parts.length-1]);
          i += 2;
          continue;
        }
        var size = parseInt(func.substr(i));
        var pre = size.toString().length;
        if (!size || !pre) { i--; break; } // counter i++ below us
        var curr = func.substr(i + pre, size);
        parts.push(curr);
        subs.push(curr);
        i += pre + size;
      }
      i++; // skip E
      return parts;
    }
    var first = true;
    function parse(rawList, limit, allowVoid) { // main parser
      limit = limit || Infinity;
      var ret = '', list = [];
      function flushList() {
        return '(' + list.join(', ') + ')';
      }
      var name;
      if (func[i] === 'N') {
        // namespaced N-E
        name = parseNested().join('::');
        limit--;
        if (limit === 0) return rawList ? [name] : name;
      } else {
        // not namespaced
        if (func[i] === 'K' || (first && func[i] === 'L')) i++; // ignore const and first 'L'
        var size = parseInt(func.substr(i));
        if (size) {
          var pre = size.toString().length;
          name = func.substr(i + pre, size);
          i += pre + size;
        }
      }
      first = false;
      if (func[i] === 'I') {
        i++;
        var iList = parse(true);
        var iRet = parse(true, 1, true);
        ret += iRet[0] + ' ' + name + '<' + iList.join(', ') + '>';
      } else {
        ret = name;
      }
      paramLoop: while (i < func.length && limit-- > 0) {
        //dump('paramLoop');
        var c = func[i++];
        if (c in basicTypes) {
          list.push(basicTypes[c]);
        } else {
          switch (c) {
            case 'P': list.push(parse(true, 1, true)[0] + '*'); break; // pointer
            case 'R': list.push(parse(true, 1, true)[0] + '&'); break; // reference
            case 'L': { // literal
              i++; // skip basic type
              var end = func.indexOf('E', i);
              var size = end - i;
              list.push(func.substr(i, size));
              i += size + 2; // size + 'EE'
              break;
            }
            case 'A': { // array
              var size = parseInt(func.substr(i));
              i += size.toString().length;
              if (func[i] !== '_') throw '?';
              i++; // skip _
              list.push(parse(true, 1, true)[0] + ' [' + size + ']');
              break;
            }
            case 'E': break paramLoop;
            default: ret += '?' + c; break paramLoop;
          }
        }
      }
      if (!allowVoid && list.length === 1 && list[0] === 'void') list = []; // avoid (void)
      return rawList ? list : ret + flushList();
    }
    return parse();
  } catch(e) {
    return func;
  }
}
function demangleAll(text) {
  return text.replace(/__Z[\w\d_]+/g, function(x) { var y = demangle(x); return x === y ? x : (x + ' [' + y + ']') });
}
function stackTrace() {
  var stack = new Error().stack;
  return stack ? demangleAll(stack) : '(no stack trace available)'; // Stack trace is not available at least on IE10 and Safari 6.
}
// Memory management
var PAGE_SIZE = 4096;
function alignMemoryPage(x) {
  return (x+4095)&-4096;
}
var HEAP;
var HEAP8, HEAPU8, HEAP16, HEAPU16, HEAP32, HEAPU32, HEAPF32, HEAPF64;
var STATIC_BASE = 0, STATICTOP = 0, staticSealed = false; // static area
var STACK_BASE = 0, STACKTOP = 0, STACK_MAX = 0; // stack area
var DYNAMIC_BASE = 0, DYNAMICTOP = 0; // dynamic area handled by sbrk
function enlargeMemory() {
  abort('Cannot enlarge memory arrays. Either (1) compile with -s TOTAL_MEMORY=X with X higher than the current value ' + TOTAL_MEMORY + ', (2) compile with ALLOW_MEMORY_GROWTH which adjusts the size at runtime but prevents some optimizations, or (3) set Module.TOTAL_MEMORY before the program runs.');
}
var TOTAL_STACK = Module['TOTAL_STACK'] || 5242880;
var TOTAL_MEMORY = Module['TOTAL_MEMORY'] || 16777216;
var FAST_MEMORY = Module['FAST_MEMORY'] || 2097152;
// Initialize the runtime's memory
// check for full engine support (use string 'subarray' to avoid closure compiler confusion)
assert(typeof Int32Array !== 'undefined' && typeof Float64Array !== 'undefined' && !!(new Int32Array(1)['subarray']) && !!(new Int32Array(1)['set']),
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
var __ATPRERUN__  = []; // functions called before the runtime is initialized
var __ATINIT__    = []; // functions called during startup
var __ATMAIN__    = []; // functions called when main() is to be run
var __ATEXIT__    = []; // functions called during shutdown
var __ATPOSTRUN__ = []; // functions called after the runtime has exited
var runtimeInitialized = false;
function preRun() {
  // compatibility - merge in anything from Module['preRun'] at this time
  if (Module['preRun']) {
    if (typeof Module['preRun'] == 'function') Module['preRun'] = [Module['preRun']];
    while (Module['preRun'].length) {
      addOnPreRun(Module['preRun'].shift());
    }
  }
  callRuntimeCallbacks(__ATPRERUN__);
}
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
function postRun() {
  // compatibility - merge in anything from Module['postRun'] at this time
  if (Module['postRun']) {
    if (typeof Module['postRun'] == 'function') Module['postRun'] = [Module['postRun']];
    while (Module['postRun'].length) {
      addOnPostRun(Module['postRun'].shift());
    }
  }
  callRuntimeCallbacks(__ATPOSTRUN__);
}
function addOnPreRun(cb) {
  __ATPRERUN__.unshift(cb);
}
Module['addOnPreRun'] = Module.addOnPreRun = addOnPreRun;
function addOnInit(cb) {
  __ATINIT__.unshift(cb);
}
Module['addOnInit'] = Module.addOnInit = addOnInit;
function addOnPreMain(cb) {
  __ATMAIN__.unshift(cb);
}
Module['addOnPreMain'] = Module.addOnPreMain = addOnPreMain;
function addOnExit(cb) {
  __ATEXIT__.unshift(cb);
}
Module['addOnExit'] = Module.addOnExit = addOnExit;
function addOnPostRun(cb) {
  __ATPOSTRUN__.unshift(cb);
}
Module['addOnPostRun'] = Module.addOnPostRun = addOnPostRun;
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
function writeAsciiToMemory(str, buffer, dontAddNull) {
  for (var i = 0; i < str.length; i++) {
    HEAP8[(((buffer)+(i))|0)]=str.charCodeAt(i)
  }
  if (!dontAddNull) HEAP8[(((buffer)+(str.length))|0)]=0
}
Module['writeAsciiToMemory'] = writeAsciiToMemory;
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
if (!Math['imul']) Math['imul'] = function imul(a, b) {
  var ah  = a >>> 16;
  var al = a & 0xffff;
  var bh  = b >>> 16;
  var bl = b & 0xffff;
  return (al*bl + ((ah*bl + al*bh) << 16))|0;
};
Math.imul = Math['imul'];
var Math_abs = Math.abs;
var Math_cos = Math.cos;
var Math_sin = Math.sin;
var Math_tan = Math.tan;
var Math_acos = Math.acos;
var Math_asin = Math.asin;
var Math_atan = Math.atan;
var Math_atan2 = Math.atan2;
var Math_exp = Math.exp;
var Math_log = Math.log;
var Math_sqrt = Math.sqrt;
var Math_ceil = Math.ceil;
var Math_floor = Math.floor;
var Math_pow = Math.pow;
var Math_imul = Math.imul;
var Math_fround = Math.fround;
var Math_min = Math.min;
// A counter of dependencies for calling run(). If we need to
// do asynchronous work before running, increment this and
// decrement it. Incrementing must happen in a place like
// PRE_RUN_ADDITIONS (used by emcc to add file preloading).
// Note that you can add dependencies in preRun, even though
// it happens right before run - run will be postponed until
// the dependencies are met.
var runDependencies = 0;
var runDependencyWatcher = null;
var dependenciesFulfilled = null; // overridden to take different actions when all run dependencies are fulfilled
function addRunDependency(id) {
  runDependencies++;
  if (Module['monitorRunDependencies']) {
    Module['monitorRunDependencies'](runDependencies);
  }
}
Module['addRunDependency'] = addRunDependency;
function removeRunDependency(id) {
  runDependencies--;
  if (Module['monitorRunDependencies']) {
    Module['monitorRunDependencies'](runDependencies);
  }
  if (runDependencies == 0) {
    if (runDependencyWatcher !== null) {
      clearInterval(runDependencyWatcher);
      runDependencyWatcher = null;
    }
    if (dependenciesFulfilled) {
      var callback = dependenciesFulfilled;
      dependenciesFulfilled = null;
      callback(); // can add another dependenciesFulfilled
    }
  }
}
Module['removeRunDependency'] = removeRunDependency;
Module["preloadedImages"] = {}; // maps url to image data
Module["preloadedAudios"] = {}; // maps url to audio data
var memoryInitializer = null;
// === Body ===
STATIC_BASE = 8;
STATICTOP = STATIC_BASE + 15160;
/* global initializers */ __ATINIT__.push({ func: function() { runPostSets() } });
var _stdout;
var _stdout=_stdout=allocate([0,0,0,0,0,0,0,0], "i8", ALLOC_STATIC);
var _stdin;
var _stdin=_stdin=allocate([0,0,0,0,0,0,0,0], "i8", ALLOC_STATIC);
var _stderr;
var _stderr=_stderr=allocate([0,0,0,0,0,0,0,0], "i8", ALLOC_STATIC);
/* memory initializer */ allocate([56,51,0,0,232,52,0,0,96,57,0,0,192,51,0,0,120,51,0,0,72,51,0,0,240,50,0,0,168,50,0,0,40,50,0,0,96,57,0,0,12,0,8,0,140,0,8,0,76,0,8,0,204,0,8,0,44,0,8,0,172,0,8,0,108,0,8,0,236,0,8,0,28,0,8,0,156,0,8,0,92,0,8,0,220,0,8,0,60,0,8,0,188,0,8,0,124,0,8,0,252,0,8,0,2,0,8,0,130,0,8,0,66,0,8,0,194,0,8,0,34,0,8,0,162,0,8,0,98,0,8,0,226,0,8,0,18,0,8,0,146,0,8,0,82,0,8,0,210,0,8,0,50,0,8,0,178,0,8,0,114,0,8,0,242,0,8,0,10,0,8,0,138,0,8,0,74,0,8,0,202,0,8,0,42,0,8,0,170,0,8,0,106,0,8,0,234,0,8,0,26,0,8,0,154,0,8,0,90,0,8,0,218,0,8,0,58,0,8,0,186,0,8,0,122,0,8,0,250,0,8,0,6,0,8,0,134,0,8,0,70,0,8,0,198,0,8,0,38,0,8,0,166,0,8,0,102,0,8,0,230,0,8,0,22,0,8,0,150,0,8,0,86,0,8,0,214,0,8,0,54,0,8,0,182,0,8,0,118,0,8,0,246,0,8,0,14,0,8,0,142,0,8,0,78,0,8,0,206,0,8,0,46,0,8,0,174,0,8,0,110,0,8,0,238,0,8,0,30,0,8,0,158,0,8,0,94,0,8,0,222,0,8,0,62,0,8,0,190,0,8,0,126,0,8,0,254,0,8,0,1,0,8,0,129,0,8,0,65,0,8,0,193,0,8,0,33,0,8,0,161,0,8,0,97,0,8,0,225,0,8,0,17,0,8,0,145,0,8,0,81,0,8,0,209,0,8,0,49,0,8,0,177,0,8,0,113,0,8,0,241,0,8,0,9,0,8,0,137,0,8,0,73,0,8,0,201,0,8,0,41,0,8,0,169,0,8,0,105,0,8,0,233,0,8,0,25,0,8,0,153,0,8,0,89,0,8,0,217,0,8,0,57,0,8,0,185,0,8,0,121,0,8,0,249,0,8,0,5,0,8,0,133,0,8,0,69,0,8,0,197,0,8,0,37,0,8,0,165,0,8,0,101,0,8,0,229,0,8,0,21,0,8,0,149,0,8,0,85,0,8,0,213,0,8,0,53,0,8,0,181,0,8,0,117,0,8,0,245,0,8,0,13,0,8,0,141,0,8,0,77,0,8,0,205,0,8,0,45,0,8,0,173,0,8,0,109,0,8,0,237,0,8,0,29,0,8,0,157,0,8,0,93,0,8,0,221,0,8,0,61,0,8,0,189,0,8,0,125,0,8,0,253,0,8,0,19,0,9,0,19,1,9,0,147,0,9,0,147,1,9,0,83,0,9,0,83,1,9,0,211,0,9,0,211,1,9,0,51,0,9,0,51,1,9,0,179,0,9,0,179,1,9,0,115,0,9,0,115,1,9,0,243,0,9,0,243,1,9,0,11,0,9,0,11,1,9,0,139,0,9,0,139,1,9,0,75,0,9,0,75,1,9,0,203,0,9,0,203,1,9,0,43,0,9,0,43,1,9,0,171,0,9,0,171,1,9,0,107,0,9,0,107,1,9,0,235,0,9,0,235,1,9,0,27,0,9,0,27,1,9,0,155,0,9,0,155,1,9,0,91,0,9,0,91,1,9,0,219,0,9,0,219,1,9,0,59,0,9,0,59,1,9,0,187,0,9,0,187,1,9,0,123,0,9,0,123,1,9,0,251,0,9,0,251,1,9,0,7,0,9,0,7,1,9,0,135,0,9,0,135,1,9,0,71,0,9,0,71,1,9,0,199,0,9,0,199,1,9,0,39,0,9,0,39,1,9,0,167,0,9,0,167,1,9,0,103,0,9,0,103,1,9,0,231,0,9,0,231,1,9,0,23,0,9,0,23,1,9,0,151,0,9,0,151,1,9,0,87,0,9,0,87,1,9,0,215,0,9,0,215,1,9,0,55,0,9,0,55,1,9,0,183,0,9,0,183,1,9,0,119,0,9,0,119,1,9,0,247,0,9,0,247,1,9,0,15,0,9,0,15,1,9,0,143,0,9,0,143,1,9,0,79,0,9,0,79,1,9,0,207,0,9,0,207,1,9,0,47,0,9,0,47,1,9,0,175,0,9,0,175,1,9,0,111,0,9,0,111,1,9,0,239,0,9,0,239,1,9,0,31,0,9,0,31,1,9,0,159,0,9,0,159,1,9,0,95,0,9,0,95,1,9,0,223,0,9,0,223,1,9,0,63,0,9,0,63,1,9,0,191,0,9,0,191,1,9,0,127,0,9,0,127,1,9,0,255,0,9,0,255,1,9,0,0,0,7,0,64,0,7,0,32,0,7,0,96,0,7,0,16,0,7,0,80,0,7,0,48,0,7,0,112,0,7,0,8,0,7,0,72,0,7,0,40,0,7,0,104,0,7,0,24,0,7,0,88,0,7,0,56,0,7,0,120,0,7,0,4,0,7,0,68,0,7,0,36,0,7,0,100,0,7,0,20,0,7,0,84,0,7,0,52,0,7,0,116,0,7,0,3,0,8,0,131,0,8,0,67,0,8,0,195,0,8,0,35,0,8,0,163,0,8,0,99,0,8,0,227,0,8,0,48,0,0,0,24,15,0,0,1,1,0,0,30,1,0,0,15,0,0,0,0,0,0,0,0,0,5,0,16,0,5,0,8,0,5,0,24,0,5,0,4,0,5,0,20,0,5,0,12,0,5,0,28,0,5,0,2,0,5,0,18,0,5,0,10,0,5,0,26,0,5,0,6,0,5,0,22,0,5,0,14,0,5,0,30,0,5,0,1,0,5,0,17,0,5,0,9,0,5,0,25,0,5,0,5,0,5,0,21,0,5,0,13,0,5,0,29,0,5,0,3,0,5,0,19,0,5,0,11,0,5,0,27,0,5,0,7,0,5,0,23,0,5,0,200,4,0,0,144,15,0,0,0,0,0,0,30,0,0,0,15,0,0,0,0,0,0,0,0,0,0,0,8,16,0,0,0,0,0,0,19,0,0,0,7,0,0,0,0,0,0,0,16,0,16,0,16,0,16,0,16,0,16,0,16,0,16,0,17,0,17,0,17,0,17,0,18,0,18,0,18,0,18,0,19,0,19,0,19,0,19,0,20,0,20,0,20,0,20,0,21,0,21,0,21,0,21,0,16,0,78,0,68,0,0,0,3,0,4,0,5,0,6,0,7,0,8,0,9,0,10,0,11,0,13,0,15,0,17,0,19,0,23,0,27,0,31,0,35,0,43,0,51,0,59,0,67,0,83,0,99,0,115,0,131,0,163,0,195,0,227,0,2,1,0,0,0,0,0,0,16,0,16,0,16,0,16,0,17,0,17,0,18,0,18,0,19,0,19,0,20,0,20,0,21,0,21,0,22,0,22,0,23,0,23,0,24,0,24,0,25,0,25,0,26,0,26,0,27,0,27,0,28,0,28,0,29,0,29,0,64,0,64,0,1,0,2,0,3,0,4,0,5,0,7,0,9,0,13,0,17,0,25,0,33,0,49,0,65,0,97,0,129,0,193,0,1,1,129,1,1,2,1,3,1,4,1,6,1,8,1,12,1,16,1,24,1,32,1,48,1,64,1,96,0,0,0,0,16,0,17,0,18,0,0,0,8,0,7,0,9,0,6,0,10,0,5,0,11,0,4,0,12,0,3,0,13,0,2,0,14,0,1,0,15,0,0,0,96,7,0,0,0,8,80,0,0,8,16,0,20,8,115,0,18,7,31,0,0,8,112,0,0,8,48,0,0,9,192,0,16,7,10,0,0,8,96,0,0,8,32,0,0,9,160,0,0,8,0,0,0,8,128,0,0,8,64,0,0,9,224,0,16,7,6,0,0,8,88,0,0,8,24,0,0,9,144,0,19,7,59,0,0,8,120,0,0,8,56,0,0,9,208,0,17,7,17,0,0,8,104,0,0,8,40,0,0,9,176,0,0,8,8,0,0,8,136,0,0,8,72,0,0,9,240,0,16,7,4,0,0,8,84,0,0,8,20,0,21,8,227,0,19,7,43,0,0,8,116,0,0,8,52,0,0,9,200,0,17,7,13,0,0,8,100,0,0,8,36,0,0,9,168,0,0,8,4,0,0,8,132,0,0,8,68,0,0,9,232,0,16,7,8,0,0,8,92,0,0,8,28,0,0,9,152,0,20,7,83,0,0,8,124,0,0,8,60,0,0,9,216,0,18,7,23,0,0,8,108,0,0,8,44,0,0,9,184,0,0,8,12,0,0,8,140,0,0,8,76,0,0,9,248,0,16,7,3,0,0,8,82,0,0,8,18,0,21,8,163,0,19,7,35,0,0,8,114,0,0,8,50,0,0,9,196,0,17,7,11,0,0,8,98,0,0,8,34,0,0,9,164,0,0,8,2,0,0,8,130,0,0,8,66,0,0,9,228,0,16,7,7,0,0,8,90,0,0,8,26,0,0,9,148,0,20,7,67,0,0,8,122,0,0,8,58,0,0,9,212,0,18,7,19,0,0,8,106,0,0,8,42,0,0,9,180,0,0,8,10,0,0,8,138,0,0,8,74,0,0,9,244,0,16,7,5,0,0,8,86,0,0,8,22,0,64,8,0,0,19,7,51,0,0,8,118,0,0,8,54,0,0,9,204,0,17,7,15,0,0,8,102,0,0,8,38,0,0,9,172,0,0,8,6,0,0,8,134,0,0,8,70,0,0,9,236,0,16,7,9,0,0,8,94,0,0,8,30,0,0,9,156,0,20,7,99,0,0,8,126,0,0,8,62,0,0,9,220,0,18,7,27,0,0,8,110,0,0,8,46,0,0,9,188,0,0,8,14,0,0,8,142,0,0,8,78,0,0,9,252,0,96,7,0,0,0,8,81,0,0,8,17,0,21,8,131,0,18,7,31,0,0,8,113,0,0,8,49,0,0,9,194,0,16,7,10,0,0,8,97,0,0,8,33,0,0,9,162,0,0,8,1,0,0,8,129,0,0,8,65,0,0,9,226,0,16,7,6,0,0,8,89,0,0,8,25,0,0,9,146,0,19,7,59,0,0,8,121,0,0,8,57,0,0,9,210,0,17,7,17,0,0,8,105,0,0,8,41,0,0,9,178,0,0,8,9,0,0,8,137,0,0,8,73,0,0,9,242,0,16,7,4,0,0,8,85,0,0,8,21,0,16,8,2,1,19,7,43,0,0,8,117,0,0,8,53,0,0,9,202,0,17,7,13,0,0,8,101,0,0,8,37,0,0,9,170,0,0,8,5,0,0,8,133,0,0,8,69,0,0,9,234,0,16,7,8,0,0,8,93,0,0,8,29,0,0,9,154,0,20,7,83,0,0,8,125,0,0,8,61,0,0,9,218,0,18,7,23,0,0,8,109,0,0,8,45,0,0,9,186,0,0,8,13,0,0,8,141,0,0,8,77,0,0,9,250,0,16,7,3,0,0,8,83,0,0,8,19,0,21,8,195,0,19,7,35,0,0,8,115,0,0,8,51,0,0,9,198,0,17,7,11,0,0,8,99,0,0,8,35,0,0,9,166,0,0,8,3,0,0,8,131,0,0,8,67,0,0,9,230,0,16,7,7,0,0,8,91,0,0,8,27,0,0,9,150,0,20,7,67,0,0,8,123,0,0,8,59,0,0,9,214,0,18,7,19,0,0,8,107,0,0,8,43,0,0,9,182,0,0,8,11,0,0,8,139,0,0,8,75,0,0,9,246,0,16,7,5,0,0,8,87,0,0,8,23,0,64,8,0,0,19,7,51,0,0,8,119,0,0,8,55,0,0,9,206,0,17,7,15,0,0,8,103,0,0,8,39,0,0,9,174,0,0,8,7,0,0,8,135,0,0,8,71,0,0,9,238,0,16,7,9,0,0,8,95,0,0,8,31,0,0,9,158,0,20,7,99,0,0,8,127,0,0,8,63,0,0,9,222,0,18,7,27,0,0,8,111,0,0,8,47,0,0,9,190,0,0,8,15,0,0,8,143,0,0,8,79,0,0,9,254,0,96,7,0,0,0,8,80,0,0,8,16,0,20,8,115,0,18,7,31,0,0,8,112,0,0,8,48,0,0,9,193,0,16,7,10,0,0,8,96,0,0,8,32,0,0,9,161,0,0,8,0,0,0,8,128,0,0,8,64,0,0,9,225,0,16,7,6,0,0,8,88,0,0,8,24,0,0,9,145,0,19,7,59,0,0,8,120,0,0,8,56,0,0,9,209,0,17,7,17,0,0,8,104,0,0,8,40,0,0,9,177,0,0,8,8,0,0,8,136,0,0,8,72,0,0,9,241,0,16,7,4,0,0,8,84,0,0,8,20,0,21,8,227,0,19,7,43,0,0,8,116,0,0,8,52,0,0,9,201,0,17,7,13,0,0,8,100,0,0,8,36,0,0,9,169,0,0,8,4,0,0,8,132,0,0,8,68,0,0,9,233,0,16,7,8,0,0,8,92,0,0,8,28,0,0,9,153,0,20,7,83,0,0,8,124,0,0,8,60,0,0,9,217,0,18,7,23,0,0,8,108,0,0,8,44,0,0,9,185,0,0,8,12,0,0,8,140,0,0,8,76,0,0,9,249,0,16,7,3,0,0,8,82,0,0,8,18,0,21,8,163,0,19,7,35,0,0,8,114,0,0,8,50,0,0,9,197,0,17,7,11,0,0,8,98,0,0,8,34,0,0,9,165,0,0,8,2,0,0,8,130,0,0,8,66,0,0,9,229,0,16,7,7,0,0,8,90,0,0,8,26,0,0,9,149,0,20,7,67,0,0,8,122,0,0,8,58,0,0,9,213,0,18,7,19,0,0,8,106,0,0,8,42,0,0,9,181,0,0,8,10,0,0,8,138,0,0,8,74,0,0,9,245,0,16,7,5,0,0,8,86,0,0,8,22,0,64,8,0,0,19,7,51,0,0,8,118,0,0,8,54,0,0,9,205,0,17,7,15,0,0,8,102,0,0,8,38,0,0,9,173,0,0,8,6,0,0,8,134,0,0,8,70,0,0,9,237,0,16,7,9,0,0,8,94,0,0,8,30,0,0,9,157,0,20,7,99,0,0,8,126,0,0,8,62,0,0,9,221,0,18,7,27,0,0,8,110,0,0,8,46,0,0,9,189,0,0,8,14,0,0,8,142,0,0,8,78,0,0,9,253,0,96,7,0,0,0,8,81,0,0,8,17,0,21,8,131,0,18,7,31,0,0,8,113,0,0,8,49,0,0,9,195,0,16,7,10,0,0,8,97,0,0,8,33,0,0,9,163,0,0,8,1,0,0,8,129,0,0,8,65,0,0,9,227,0,16,7,6,0,0,8,89,0,0,8,25,0,0,9,147,0,19,7,59,0,0,8,121,0,0,8,57,0,0,9,211,0,17,7,17,0,0,8,105,0,0,8,41,0,0,9,179,0,0,8,9,0,0,8,137,0,0,8,73,0,0,9,243,0,16,7,4,0,0,8,85,0,0,8,21,0,16,8,2,1,19,7,43,0,0,8,117,0,0,8,53,0,0,9,203,0,17,7,13,0,0,8,101,0,0,8,37,0,0,9,171,0,0,8,5,0,0,8,133,0,0,8,69,0,0,9,235,0,16,7,8,0,0,8,93,0,0,8,29,0,0,9,155,0,20,7,83,0,0,8,125,0,0,8,61,0,0,9,219,0,18,7,23,0,0,8,109,0,0,8,45,0,0,9,187,0,0,8,13,0,0,8,141,0,0,8,77,0,0,9,251,0,16,7,3,0,0,8,83,0,0,8,19,0,21,8,195,0,19,7,35,0,0,8,115,0,0,8,51,0,0,9,199,0,17,7,11,0,0,8,99,0,0,8,35,0,0,9,167,0,0,8,3,0,0,8,131,0,0,8,67,0,0,9,231,0,16,7,7,0,0,8,91,0,0,8,27,0,0,9,151,0,20,7,67,0,0,8,123,0,0,8,59,0,0,9,215,0,18,7,19,0,0,8,107,0,0,8,43,0,0,9,183,0,0,8,11,0,0,8,139,0,0,8,75,0,0,9,247,0,16,7,5,0,0,8,87,0,0,8,23,0,64,8,0,0,19,7,51,0,0,8,119,0,0,8,55,0,0,9,207,0,17,7,15,0,0,8,103,0,0,8,39,0,0,9,175,0,0,8,7,0,0,8,135,0,0,8,71,0,0,9,239,0,16,7,9,0,0,8,95,0,0,8,31,0,0,9,159,0,20,7,99,0,0,8,127,0,0,8,63,0,0,9,223,0,18,7,27,0,0,8,111,0,0,8,47,0,0,9,191,0,0,8,15,0,0,8,143,0,0,8,79,0,0,9,255,0,16,5,1,0,23,5,1,1,19,5,17,0,27,5,1,16,17,5,5,0,25,5,1,4,21,5,65,0,29,5,1,64,16,5,3,0,24,5,1,2,20,5,33,0,28,5,1,32,18,5,9,0,26,5,1,8,22,5,129,0,64,5,0,0,16,5,2,0,23,5,129,1,19,5,25,0,27,5,1,24,17,5,7,0,25,5,1,6,21,5,97,0,29,5,1,96,16,5,4,0,24,5,1,3,20,5,49,0,28,5,1,48,18,5,13,0,26,5,1,12,22,5,193,0,64,5,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,2,0,0,0,2,0,0,0,2,0,0,0,2,0,0,0,3,0,0,0,3,0,0,0,3,0,0,0,3,0,0,0,4,0,0,0,4,0,0,0,4,0,0,0,4,0,0,0,5,0,0,0,5,0,0,0,5,0,0,0,5,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,1,0,0,0,2,0,0,0,2,0,0,0,3,0,0,0,3,0,0,0,4,0,0,0,4,0,0,0,5,0,0,0,5,0,0,0,6,0,0,0,6,0,0,0,7,0,0,0,7,0,0,0,8,0,0,0,8,0,0,0,9,0,0,0,9,0,0,0,10,0,0,0,10,0,0,0,11,0,0,0,11,0,0,0,12,0,0,0,12,0,0,0,13,0,0,0,13,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,0,0,0,3,0,0,0,7,0,0,0,0,0,0,0,49,46,50,46,55,0,0,0,0,0,0,0,150,48,7,119,44,97,14,238,186,81,9,153,25,196,109,7,143,244,106,112,53,165,99,233,163,149,100,158,50,136,219,14,164,184,220,121,30,233,213,224,136,217,210,151,43,76,182,9,189,124,177,126,7,45,184,231,145,29,191,144,100,16,183,29,242,32,176,106,72,113,185,243,222,65,190,132,125,212,218,26,235,228,221,109,81,181,212,244,199,133,211,131,86,152,108,19,192,168,107,100,122,249,98,253,236,201,101,138,79,92,1,20,217,108,6,99,99,61,15,250,245,13,8,141,200,32,110,59,94,16,105,76,228,65,96,213,114,113,103,162,209,228,3,60,71,212,4,75,253,133,13,210,107,181,10,165,250,168,181,53,108,152,178,66,214,201,187,219,64,249,188,172,227,108,216,50,117,92,223,69,207,13,214,220,89,61,209,171,172,48,217,38,58,0,222,81,128,81,215,200,22,97,208,191,181,244,180,33,35,196,179,86,153,149,186,207,15,165,189,184,158,184,2,40,8,136,5,95,178,217,12,198,36,233,11,177,135,124,111,47,17,76,104,88,171,29,97,193,61,45,102,182,144,65,220,118,6,113,219,1,188,32,210,152,42,16,213,239,137,133,177,113,31,181,182,6,165,228,191,159,51,212,184,232,162,201,7,120,52,249,0,15,142,168,9,150,24,152,14,225,187,13,106,127,45,61,109,8,151,108,100,145,1,92,99,230,244,81,107,107,98,97,108,28,216,48,101,133,78,0,98,242,237,149,6,108,123,165,1,27,193,244,8,130,87,196,15,245,198,217,176,101,80,233,183,18,234,184,190,139,124,136,185,252,223,29,221,98,73,45,218,21,243,124,211,140,101,76,212,251,88,97,178,77,206,81,181,58,116,0,188,163,226,48,187,212,65,165,223,74,215,149,216,61,109,196,209,164,251,244,214,211,106,233,105,67,252,217,110,52,70,136,103,173,208,184,96,218,115,45,4,68,229,29,3,51,95,76,10,170,201,124,13,221,60,113,5,80,170,65,2,39,16,16,11,190,134,32,12,201,37,181,104,87,179,133,111,32,9,212,102,185,159,228,97,206,14,249,222,94,152,201,217,41,34,152,208,176,180,168,215,199,23,61,179,89,129,13,180,46,59,92,189,183,173,108,186,192,32,131,184,237,182,179,191,154,12,226,182,3,154,210,177,116,57,71,213,234,175,119,210,157,21,38,219,4,131,22,220,115,18,11,99,227,132,59,100,148,62,106,109,13,168,90,106,122,11,207,14,228,157,255,9,147,39,174,0,10,177,158,7,125,68,147,15,240,210,163,8,135,104,242,1,30,254,194,6,105,93,87,98,247,203,103,101,128,113,54,108,25,231,6,107,110,118,27,212,254,224,43,211,137,90,122,218,16,204,74,221,103,111,223,185,249,249,239,190,142,67,190,183,23,213,142,176,96,232,163,214,214,126,147,209,161,196,194,216,56,82,242,223,79,241,103,187,209,103,87,188,166,221,6,181,63,75,54,178,72,218,43,13,216,76,27,10,175,246,74,3,54,96,122,4,65,195,239,96,223,85,223,103,168,239,142,110,49,121,190,105,70,140,179,97,203,26,131,102,188,160,210,111,37,54,226,104,82,149,119,12,204,3,71,11,187,185,22,2,34,47,38,5,85,190,59,186,197,40,11,189,178,146,90,180,43,4,106,179,92,167,255,215,194,49,207,208,181,139,158,217,44,29,174,222,91,176,194,100,155,38,242,99,236,156,163,106,117,10,147,109,2,169,6,9,156,63,54,14,235,133,103,7,114,19,87,0,5,130,74,191,149,20,122,184,226,174,43,177,123,56,27,182,12,155,142,210,146,13,190,213,229,183,239,220,124,33,223,219,11,212,210,211,134,66,226,212,241,248,179,221,104,110,131,218,31,205,22,190,129,91,38,185,246,225,119,176,111,119,71,183,24,230,90,8,136,112,106,15,255,202,59,6,102,92,11,1,17,255,158,101,143,105,174,98,248,211,255,107,97,69,207,108,22,120,226,10,160,238,210,13,215,84,131,4,78,194,179,3,57,97,38,103,167,247,22,96,208,77,71,105,73,219,119,110,62,74,106,209,174,220,90,214,217,102,11,223,64,240,59,216,55,83,174,188,169,197,158,187,222,127,207,178,71,233,255,181,48,28,242,189,189,138,194,186,202,48,147,179,83,166,163,180,36,5,54,208,186,147,6,215,205,41,87,222,84,191,103,217,35,46,122,102,179,184,74,97,196,2,27,104,93,148,43,111,42,55,190,11,180,161,142,12,195,27,223,5,90,141,239,2,45,0,0,0,0,65,49,27,25,130,98,54,50,195,83,45,43,4,197,108,100,69,244,119,125,134,167,90,86,199,150,65,79,8,138,217,200,73,187,194,209,138,232,239,250,203,217,244,227,12,79,181,172,77,126,174,181,142,45,131,158,207,28,152,135,81,18,194,74,16,35,217,83,211,112,244,120,146,65,239,97,85,215,174,46,20,230,181,55,215,181,152,28,150,132,131,5,89,152,27,130,24,169,0,155,219,250,45,176,154,203,54,169,93,93,119,230,28,108,108,255,223,63,65,212,158,14,90,205,162,36,132,149,227,21,159,140,32,70,178,167,97,119,169,190,166,225,232,241,231,208,243,232,36,131,222,195,101,178,197,218,170,174,93,93,235,159,70,68,40,204,107,111,105,253,112,118,174,107,49,57,239,90,42,32,44,9,7,11,109,56,28,18,243,54,70,223,178,7,93,198,113,84,112,237,48,101,107,244,247,243,42,187,182,194,49,162,117,145,28,137,52,160,7,144,251,188,159,23,186,141,132,14,121,222,169,37,56,239,178,60,255,121,243,115,190,72,232,106,125,27,197,65,60,42,222,88,5,79,121,240,68,126,98,233,135,45,79,194,198,28,84,219,1,138,21,148,64,187,14,141,131,232,35,166,194,217,56,191,13,197,160,56,76,244,187,33,143,167,150,10,206,150,141,19,9,0,204,92,72,49,215,69,139,98,250,110,202,83,225,119,84,93,187,186,21,108,160,163,214,63,141,136,151,14,150,145,80,152,215,222,17,169,204,199,210,250,225,236,147,203,250,245,92,215,98,114,29,230,121,107,222,181,84,64,159,132,79,89,88,18,14,22,25,35,21,15,218,112,56,36,155,65,35,61,167,107,253,101,230,90,230,124,37,9,203,87,100,56,208,78,163,174,145,1,226,159,138,24,33,204,167,51,96,253,188,42,175,225,36,173,238,208,63,180,45,131,18,159,108,178,9,134,171,36,72,201,234,21,83,208,41,70,126,251,104,119,101,226,246,121,63,47,183,72,36,54,116,27,9,29,53,42,18,4,242,188,83,75,179,141,72,82,112,222,101,121,49,239,126,96,254,243,230,231,191,194,253,254,124,145,208,213,61,160,203,204,250,54,138,131,187,7,145,154,120,84,188,177,57,101,167,168,75,152,131,59,10,169,152,34,201,250,181,9,136,203,174,16,79,93,239,95,14,108,244,70,205,63,217,109,140,14,194,116,67,18,90,243,2,35,65,234,193,112,108,193,128,65,119,216,71,215,54,151,6,230,45,142,197,181,0,165,132,132,27,188,26,138,65,113,91,187,90,104,152,232,119,67,217,217,108,90,30,79,45,21,95,126,54,12,156,45,27,39,221,28,0,62,18,0,152,185,83,49,131,160,144,98,174,139,209,83,181,146,22,197,244,221,87,244,239,196,148,167,194,239,213,150,217,246,233,188,7,174,168,141,28,183,107,222,49,156,42,239,42,133,237,121,107,202,172,72,112,211,111,27,93,248,46,42,70,225,225,54,222,102,160,7,197,127,99,84,232,84,34,101,243,77,229,243,178,2,164,194,169,27,103,145,132,48,38,160,159,41,184,174,197,228,249,159,222,253,58,204,243,214,123,253,232,207,188,107,169,128,253,90,178,153,62,9,159,178,127,56,132,171,176,36,28,44,241,21,7,53,50,70,42,30,115,119,49,7,180,225,112,72,245,208,107,81,54,131,70,122,119,178,93,99,78,215,250,203,15,230,225,210,204,181,204,249,141,132,215,224,74,18,150,175,11,35,141,182,200,112,160,157,137,65,187,132,70,93,35,3,7,108,56,26,196,63,21,49,133,14,14,40,66,152,79,103,3,169,84,126,192,250,121,85,129,203,98,76,31,197,56,129,94,244,35,152,157,167,14,179,220,150,21,170,27,0,84,229,90,49,79,252,153,98,98,215,216,83,121,206,23,79,225,73,86,126,250,80,149,45,215,123,212,28,204,98,19,138,141,45,82,187,150,52,145,232,187,31,208,217,160,6,236,243,126,94,173,194,101,71,110,145,72,108,47,160,83,117,232,54,18,58,169,7,9,35,106,84,36,8,43,101,63,17,228,121,167,150,165,72,188,143,102,27,145,164,39,42,138,189,224,188,203,242,161,141,208,235,98,222,253,192,35,239,230,217,189,225,188,20,252,208,167,13,63,131,138,38,126,178,145,63,185,36,208,112,248,21,203,105,59,70,230,66,122,119,253,91,181,107,101,220,244,90,126,197,55,9,83,238,118,56,72,247,177,174,9,184,240,159,18,161,51,204,63,138,114,253,36,147,0,0,0,0,55,106,194,1,110,212,132,3,89,190,70,2,220,168,9,7,235,194,203,6,178,124,141,4,133,22,79,5,184,81,19,14,143,59,209,15,214,133,151,13,225,239,85,12,100,249,26,9,83,147,216,8,10,45,158,10,61,71,92,11,112,163,38,28,71,201,228,29,30,119,162,31,41,29,96,30,172,11,47,27,155,97,237,26,194,223,171,24,245,181,105,25,200,242,53,18,255,152,247,19,166,38,177,17,145,76,115,16,20,90,60,21,35,48,254,20,122,142,184,22,77,228,122,23,224,70,77,56,215,44,143,57,142,146,201,59,185,248,11,58,60,238,68,63,11,132,134,62,82,58,192,60,101,80,2,61,88,23,94,54,111,125,156,55,54,195,218,53,1,169,24,52,132,191,87,49,179,213,149,48,234,107,211,50,221,1,17,51,144,229,107,36,167,143,169,37,254,49,239,39,201,91,45,38,76,77,98,35,123,39,160,34,34,153,230,32,21,243,36,33,40,180,120,42,31,222,186,43,70,96,252,41,113,10,62,40,244,28,113,45,195,118,179,44,154,200,245,46,173,162,55,47,192,141,154,112,247,231,88,113,174,89,30,115,153,51,220,114,28,37,147,119,43,79,81,118,114,241,23,116,69,155,213,117,120,220,137,126,79,182,75,127,22,8,13,125,33,98,207,124,164,116,128,121,147,30,66,120,202,160,4,122,253,202,198,123,176,46,188,108,135,68,126,109,222,250,56,111,233,144,250,110,108,134,181,107,91,236,119,106,2,82,49,104,53,56,243,105,8,127,175,98,63,21,109,99,102,171,43,97,81,193,233,96,212,215,166,101,227,189,100,100,186,3,34,102,141,105,224,103,32,203,215,72,23,161,21,73,78,31,83,75,121,117,145,74,252,99,222,79,203,9,28,78,146,183,90,76,165,221,152,77,152,154,196,70,175,240,6,71,246,78,64,69,193,36,130,68,68,50,205,65,115,88,15,64,42,230,73,66,29,140,139,67,80,104,241,84,103,2,51,85,62,188,117,87,9,214,183,86,140,192,248,83,187,170,58,82,226,20,124,80,213,126,190,81,232,57,226,90,223,83,32,91,134,237,102,89,177,135,164,88,52,145,235,93,3,251,41,92,90,69,111,94,109,47,173,95,128,27,53,225,183,113,247,224,238,207,177,226,217,165,115,227,92,179,60,230,107,217,254,231,50,103,184,229,5,13,122,228,56,74,38,239,15,32,228,238,86,158,162,236,97,244,96,237,228,226,47,232,211,136,237,233,138,54,171,235,189,92,105,234,240,184,19,253,199,210,209,252,158,108,151,254,169,6,85,255,44,16,26,250,27,122,216,251,66,196,158,249,117,174,92,248,72,233,0,243,127,131,194,242,38,61,132,240,17,87,70,241,148,65,9,244,163,43,203,245,250,149,141,247,205,255,79,246,96,93,120,217,87,55,186,216,14,137,252,218,57,227,62,219,188,245,113,222,139,159,179,223,210,33,245,221,229,75,55,220,216,12,107,215,239,102,169,214,182,216,239,212,129,178,45,213,4,164,98,208,51,206,160,209,106,112,230,211,93,26,36,210,16,254,94,197,39,148,156,196,126,42,218,198,73,64,24,199,204,86,87,194,251,60,149,195,162,130,211,193,149,232,17,192,168,175,77,203,159,197,143,202,198,123,201,200,241,17,11,201,116,7,68,204,67,109,134,205,26,211,192,207,45,185,2,206,64,150,175,145,119,252,109,144,46,66,43,146,25,40,233,147,156,62,166,150,171,84,100,151,242,234,34,149,197,128,224,148,248,199,188,159,207,173,126,158,150,19,56,156,161,121,250,157,36,111,181,152,19,5,119,153,74,187,49,155,125,209,243,154,48,53,137,141,7,95,75,140,94,225,13,142,105,139,207,143,236,157,128,138,219,247,66,139,130,73,4,137,181,35,198,136,136,100,154,131,191,14,88,130,230,176,30,128,209,218,220,129,84,204,147,132,99,166,81,133,58,24,23,135,13,114,213,134,160,208,226,169,151,186,32,168,206,4,102,170,249,110,164,171,124,120,235,174,75,18,41,175,18,172,111,173,37,198,173,172,24,129,241,167,47,235,51,166,118,85,117,164,65,63,183,165,196,41,248,160,243,67,58,161,170,253,124,163,157,151,190,162,208,115,196,181,231,25,6,180,190,167,64,182,137,205,130,183,12,219,205,178,59,177,15,179,98,15,73,177,85,101,139,176,104,34,215,187,95,72,21,186,6,246,83,184,49,156,145,185,180,138,222,188,131,224,28,189,218,94,90,191,237,52,152,190,0,0,0,0,101,103,188,184,139,200,9,170,238,175,181,18,87,151,98,143,50,240,222,55,220,95,107,37,185,56,215,157,239,40,180,197,138,79,8,125,100,224,189,111,1,135,1,215,184,191,214,74,221,216,106,242,51,119,223,224,86,16,99,88,159,87,25,80,250,48,165,232,20,159,16,250,113,248,172,66,200,192,123,223,173,167,199,103,67,8,114,117,38,111,206,205,112,127,173,149,21,24,17,45,251,183,164,63,158,208,24,135,39,232,207,26,66,143,115,162,172,32,198,176,201,71,122,8,62,175,50,160,91,200,142,24,181,103,59,10,208,0,135,178,105,56,80,47,12,95,236,151,226,240,89,133,135,151,229,61,209,135,134,101,180,224,58,221,90,79,143,207,63,40,51,119,134,16,228,234,227,119,88,82,13,216,237,64,104,191,81,248,161,248,43,240,196,159,151,72,42,48,34,90,79,87,158,226,246,111,73,127,147,8,245,199,125,167,64,213,24,192,252,109,78,208,159,53,43,183,35,141,197,24,150,159,160,127,42,39,25,71,253,186,124,32,65,2,146,143,244,16,247,232,72,168,61,88,20,155,88,63,168,35,182,144,29,49,211,247,161,137,106,207,118,20,15,168,202,172,225,7,127,190,132,96,195,6,210,112,160,94,183,23,28,230,89,184,169,244,60,223,21,76,133,231,194,209,224,128,126,105,14,47,203,123,107,72,119,195,162,15,13,203,199,104,177,115,41,199,4,97,76,160,184,217,245,152,111,68,144,255,211,252,126,80,102,238,27,55,218,86,77,39,185,14,40,64,5,182,198,239,176,164,163,136,12,28,26,176,219,129,127,215,103,57,145,120,210,43,244,31,110,147,3,247,38,59,102,144,154,131,136,63,47,145,237,88,147,41,84,96,68,180,49,7,248,12,223,168,77,30,186,207,241,166,236,223,146,254,137,184,46,70,103,23,155,84,2,112,39,236,187,72,240,113,222,47,76,201,48,128,249,219,85,231,69,99,156,160,63,107,249,199,131,211,23,104,54,193,114,15,138,121,203,55,93,228,174,80,225,92,64,255,84,78,37,152,232,246,115,136,139,174,22,239,55,22,248,64,130,4,157,39,62,188,36,31,233,33,65,120,85,153,175,215,224,139,202,176,92,51,59,182,89,237,94,209,229,85,176,126,80,71,213,25,236,255,108,33,59,98,9,70,135,218,231,233,50,200,130,142,142,112,212,158,237,40,177,249,81,144,95,86,228,130,58,49,88,58,131,9,143,167,230,110,51,31,8,193,134,13,109,166,58,181,164,225,64,189,193,134,252,5,47,41,73,23,74,78,245,175,243,118,34,50,150,17,158,138,120,190,43,152,29,217,151,32,75,201,244,120,46,174,72,192,192,1,253,210,165,102,65,106,28,94,150,247,121,57,42,79,151,150,159,93,242,241,35,229,5,25,107,77,96,126,215,245,142,209,98,231,235,182,222,95,82,142,9,194,55,233,181,122,217,70,0,104,188,33,188,208,234,49,223,136,143,86,99,48,97,249,214,34,4,158,106,154,189,166,189,7,216,193,1,191,54,110,180,173,83,9,8,21,154,78,114,29,255,41,206,165,17,134,123,183,116,225,199,15,205,217,16,146,168,190,172,42,70,17,25,56,35,118,165,128,117,102,198,216,16,1,122,96,254,174,207,114,155,201,115,202,34,241,164,87,71,150,24,239,169,57,173,253,204,94,17,69,6,238,77,118,99,137,241,206,141,38,68,220,232,65,248,100,81,121,47,249,52,30,147,65,218,177,38,83,191,214,154,235,233,198,249,179,140,161,69,11,98,14,240,25,7,105,76,161,190,81,155,60,219,54,39,132,53,153,146,150,80,254,46,46,153,185,84,38,252,222,232,158,18,113,93,140,119,22,225,52,206,46,54,169,171,73,138,17,69,230,63,3,32,129,131,187,118,145,224,227,19,246,92,91,253,89,233,73,152,62,85,241,33,6,130,108,68,97,62,212,170,206,139,198,207,169,55,126,56,65,127,214,93,38,195,110,179,137,118,124,214,238,202,196,111,214,29,89,10,177,161,225,228,30,20,243,129,121,168,75,215,105,203,19,178,14,119,171,92,161,194,185,57,198,126,1,128,254,169,156,229,153,21,36,11,54,160,54,110,81,28,142,167,22,102,134,194,113,218,62,44,222,111,44,73,185,211,148,240,129,4,9,149,230,184,177,123,73,13,163,30,46,177,27,72,62,210,67,45,89,110,251,195,246,219,233,166,145,103,81,31,169,176,204,122,206,12,116,148,97,185,102,241,6,5,222,0,0,0,0,119,7,48,150,238,14,97,44,153,9,81,186,7,109,196,25,112,106,244,143,233,99,165,53,158,100,149,163,14,219,136,50,121,220,184,164,224,213,233,30,151,210,217,136,9,182,76,43,126,177,124,189,231,184,45,7,144,191,29,145,29,183,16,100,106,176,32,242,243,185,113,72,132,190,65,222,26,218,212,125,109,221,228,235,244,212,181,81,131,211,133,199,19,108,152,86,100,107,168,192,253,98,249,122,138,101,201,236,20,1,92,79,99,6,108,217,250,15,61,99,141,8,13,245,59,110,32,200,76,105,16,94,213,96,65,228,162,103,113,114,60,3,228,209,75,4,212,71,210,13,133,253,165,10,181,107,53,181,168,250,66,178,152,108,219,187,201,214,172,188,249,64,50,216,108,227,69,223,92,117,220,214,13,207,171,209,61,89,38,217,48,172,81,222,0,58,200,215,81,128,191,208,97,22,33,180,244,181,86,179,196,35,207,186,149,153,184,189,165,15,40,2,184,158,95,5,136,8,198,12,217,178,177,11,233,36,47,111,124,135,88,104,76,17,193,97,29,171,182,102,45,61,118,220,65,144,1,219,113,6,152,210,32,188,239,213,16,42,113,177,133,137,6,182,181,31,159,191,228,165,232,184,212,51,120,7,201,162,15,0,249,52,150,9,168,142,225,14,152,24,127,106,13,187,8,109,61,45,145,100,108,151,230,99,92,1,107,107,81,244,28,108,97,98,133,101,48,216,242,98,0,78,108,6,149,237,27,1,165,123,130,8,244,193,245,15,196,87,101,176,217,198,18,183,233,80,139,190,184,234,252,185,136,124,98,221,29,223,21,218,45,73,140,211,124,243,251,212,76,101,77,178,97,88,58,181,81,206,163,188,0,116,212,187,48,226,74,223,165,65,61,216,149,215,164,209,196,109,211,214,244,251,67,105,233,106,52,110,217,252,173,103,136,70,218,96,184,208,68,4,45,115,51,3,29,229,170,10,76,95,221,13,124,201,80,5,113,60,39,2,65,170,190,11,16,16,201,12,32,134,87,104,181,37,32,111,133,179,185,102,212,9,206,97,228,159,94,222,249,14,41,217,201,152,176,208,152,34,199,215,168,180,89,179,61,23,46,180,13,129,183,189,92,59,192,186,108,173,237,184,131,32,154,191,179,182,3,182,226,12,116,177,210,154,234,213,71,57,157,210,119,175,4,219,38,21,115,220,22,131,227,99,11,18,148,100,59,132,13,109,106,62,122,106,90,168,228,14,207,11,147,9,255,157,10,0,174,39,125,7,158,177,240,15,147,68,135,8,163,210,30,1,242,104,105,6,194,254,247,98,87,93,128,101,103,203,25,108,54,113,110,107,6,231,254,212,27,118,137,211,43,224,16,218,122,90,103,221,74,204,249,185,223,111,142,190,239,249,23,183,190,67,96,176,142,213,214,214,163,232,161,209,147,126,56,216,194,196,79,223,242,82,209,187,103,241,166,188,87,103,63,181,6,221,72,178,54,75,216,13,43,218,175,10,27,76,54,3,74,246,65,4,122,96,223,96,239,195,168,103,223,85,49,110,142,239,70,105,190,121,203,97,179,140,188,102,131,26,37,111,210,160,82,104,226,54,204,12,119,149,187,11,71,3,34,2,22,185,85,5,38,47,197,186,59,190,178,189,11,40,43,180,90,146,92,179,106,4,194,215,255,167,181,208,207,49,44,217,158,139,91,222,174,29,155,100,194,176,236,99,242,38,117,106,163,156,2,109,147,10,156,9,6,169,235,14,54,63,114,7,103,133,5,0,87,19,149,191,74,130,226,184,122,20,123,177,43,174,12,182,27,56,146,210,142,155,229,213,190,13,124,220,239,183,11,219,223,33,134,211,210,212,241,212,226,66,104,221,179,248,31,218,131,110,129,190,22,205,246,185,38,91,111,176,119,225,24,183,71,119,136,8,90,230,255,15,106,112,102,6,59,202,17,1,11,92,143,101,158,255,248,98,174,105,97,107,255,211,22,108,207,69,160,10,226,120,215,13,210,238,78,4,131,84,57,3,179,194,167,103,38,97,208,96,22,247,73,105,71,77,62,110,119,219,174,209,106,74,217,214,90,220,64,223,11,102,55,216,59,240,169,188,174,83,222,187,158,197,71,178,207,127,48,181,255,233,189,189,242,28,202,186,194,138,83,179,147,48,36,180,163,166,186,208,54,5,205,215,6,147,84,222,87,41,35,217,103,191,179,102,122,46,196,97,74,184,93,104,27,2,42,111,43,148,180,11,190,55,195,12,142,161,90,5,223,27,45,2,239,141,0,0,0,0,25,27,49,65,50,54,98,130,43,45,83,195,100,108,197,4,125,119,244,69,86,90,167,134,79,65,150,199,200,217,138,8,209,194,187,73,250,239,232,138,227,244,217,203,172,181,79,12,181,174,126,77,158,131,45,142,135,152,28,207,74,194,18,81,83,217,35,16,120,244,112,211,97,239,65,146,46,174,215,85,55,181,230,20,28,152,181,215,5,131,132,150,130,27,152,89,155,0,169,24,176,45,250,219,169,54,203,154,230,119,93,93,255,108,108,28,212,65,63,223,205,90,14,158,149,132,36,162,140,159,21,227,167,178,70,32,190,169,119,97,241,232,225,166,232,243,208,231,195,222,131,36,218,197,178,101,93,93,174,170,68,70,159,235,111,107,204,40,118,112,253,105,57,49,107,174,32,42,90,239,11,7,9,44,18,28,56,109,223,70,54,243,198,93,7,178,237,112,84,113,244,107,101,48,187,42,243,247,162,49,194,182,137,28,145,117,144,7,160,52,23,159,188,251,14,132,141,186,37,169,222,121,60,178,239,56,115,243,121,255,106,232,72,190,65,197,27,125,88,222,42,60,240,121,79,5,233,98,126,68,194,79,45,135,219,84,28,198,148,21,138,1,141,14,187,64,166,35,232,131,191,56,217,194,56,160,197,13,33,187,244,76,10,150,167,143,19,141,150,206,92,204,0,9,69,215,49,72,110,250,98,139,119,225,83,202,186,187,93,84,163,160,108,21,136,141,63,214,145,150,14,151,222,215,152,80,199,204,169,17,236,225,250,210,245,250,203,147,114,98,215,92,107,121,230,29,64,84,181,222,89,79,132,159,22,14,18,88,15,21,35,25,36,56,112,218,61,35,65,155,101,253,107,167,124,230,90,230,87,203,9,37,78,208,56,100,1,145,174,163,24,138,159,226,51,167,204,33,42,188,253,96,173,36,225,175,180,63,208,238,159,18,131,45,134,9,178,108,201,72,36,171,208,83,21,234,251,126,70,41,226,101,119,104,47,63,121,246,54,36,72,183,29,9,27,116,4,18,42,53,75,83,188,242,82,72,141,179,121,101,222,112,96,126,239,49,231,230,243,254,254,253,194,191,213,208,145,124,204,203,160,61,131,138,54,250,154,145,7,187,177,188,84,120,168,167,101,57,59,131,152,75,34,152,169,10,9,181,250,201,16,174,203,136,95,239,93,79,70,244,108,14,109,217,63,205,116,194,14,140,243,90,18,67,234,65,35,2,193,108,112,193,216,119,65,128,151,54,215,71,142,45,230,6,165,0,181,197,188,27,132,132,113,65,138,26,104,90,187,91,67,119,232,152,90,108,217,217,21,45,79,30,12,54,126,95,39,27,45,156,62,0,28,221,185,152,0,18,160,131,49,83,139,174,98,144,146,181,83,209,221,244,197,22,196,239,244,87,239,194,167,148,246,217,150,213,174,7,188,233,183,28,141,168,156,49,222,107,133,42,239,42,202,107,121,237,211,112,72,172,248,93,27,111,225,70,42,46,102,222,54,225,127,197,7,160,84,232,84,99,77,243,101,34,2,178,243,229,27,169,194,164,48,132,145,103,41,159,160,38,228,197,174,184,253,222,159,249,214,243,204,58,207,232,253,123,128,169,107,188,153,178,90,253,178,159,9,62,171,132,56,127,44,28,36,176,53,7,21,241,30,42,70,50,7,49,119,115,72,112,225,180,81,107,208,245,122,70,131,54,99,93,178,119,203,250,215,78,210,225,230,15,249,204,181,204,224,215,132,141,175,150,18,74,182,141,35,11,157,160,112,200,132,187,65,137,3,35,93,70,26,56,108,7,49,21,63,196,40,14,14,133,103,79,152,66,126,84,169,3,85,121,250,192,76,98,203,129,129,56,197,31,152,35,244,94,179,14,167,157,170,21,150,220,229,84,0,27,252,79,49,90,215,98,98,153,206,121,83,216,73,225,79,23,80,250,126,86,123,215,45,149,98,204,28,212,45,141,138,19,52,150,187,82,31,187,232,145,6,160,217,208,94,126,243,236,71,101,194,173,108,72,145,110,117,83,160,47,58,18,54,232,35,9,7,169,8,36,84,106,17,63,101,43,150,167,121,228,143,188,72,165].concat([164,145,27,102,189,138,42,39,242,203,188,224,235,208,141,161,192,253,222,98,217,230,239,35,20,188,225,189,13,167,208,252,38,138,131,63,63,145,178,126,112,208,36,185,105,203,21,248,66,230,70,59,91,253,119,122,220,101,107,181,197,126,90,244,238,83,9,55,247,72,56,118,184,9,174,177,161,18,159,240,138,63,204,51,147,36,253,114,0,0,0,0,1,194,106,55,3,132,212,110,2,70,190,89,7,9,168,220,6,203,194,235,4,141,124,178,5,79,22,133,14,19,81,184,15,209,59,143,13,151,133,214,12,85,239,225,9,26,249,100,8,216,147,83,10,158,45,10,11,92,71,61,28,38,163,112,29,228,201,71,31,162,119,30,30,96,29,41,27,47,11,172,26,237,97,155,24,171,223,194,25,105,181,245,18,53,242,200,19,247,152,255,17,177,38,166,16,115,76,145,21,60,90,20,20,254,48,35,22,184,142,122,23,122,228,77,56,77,70,224,57,143,44,215,59,201,146,142,58,11,248,185,63,68,238,60,62,134,132,11,60,192,58,82,61,2,80,101,54,94,23,88,55,156,125,111,53,218,195,54,52,24,169,1,49,87,191,132,48,149,213,179,50,211,107,234,51,17,1,221,36,107,229,144,37,169,143,167,39,239,49,254,38,45,91,201,35,98,77,76,34,160,39,123,32,230,153,34,33,36,243,21,42,120,180,40,43,186,222,31,41,252,96,70,40,62,10,113,45,113,28,244,44,179,118,195,46,245,200,154,47,55,162,173,112,154,141,192,113,88,231,247,115,30,89,174,114,220,51,153,119,147,37,28,118,81,79,43,116,23,241,114,117,213,155,69,126,137,220,120,127,75,182,79,125,13,8,22,124,207,98,33,121,128,116,164,120,66,30,147,122,4,160,202,123,198,202,253,108,188,46,176,109,126,68,135,111,56,250,222,110,250,144,233,107,181,134,108,106,119,236,91,104,49,82,2,105,243,56,53,98,175,127,8,99,109,21,63,97,43,171,102,96,233,193,81,101,166,215,212,100,100,189,227,102,34,3,186,103,224,105,141,72,215,203,32,73,21,161,23,75,83,31,78,74,145,117,121,79,222,99,252,78,28,9,203,76,90,183,146,77,152,221,165,70,196,154,152,71,6,240,175,69,64,78,246,68,130,36,193,65,205,50,68,64,15,88,115,66,73,230,42,67,139,140,29,84,241,104,80,85,51,2,103,87,117,188,62,86,183,214,9,83,248,192,140,82,58,170,187,80,124,20,226,81,190,126,213,90,226,57,232,91,32,83,223,89,102,237,134,88,164,135,177,93,235,145,52,92,41,251,3,94,111,69,90,95,173,47,109,225,53,27,128,224,247,113,183,226,177,207,238,227,115,165,217,230,60,179,92,231,254,217,107,229,184,103,50,228,122,13,5,239,38,74,56,238,228,32,15,236,162,158,86,237,96,244,97,232,47,226,228,233,237,136,211,235,171,54,138,234,105,92,189,253,19,184,240,252,209,210,199,254,151,108,158,255,85,6,169,250,26,16,44,251,216,122,27,249,158,196,66,248,92,174,117,243,0,233,72,242,194,131,127,240,132,61,38,241,70,87,17,244,9,65,148,245,203,43,163,247,141,149,250,246,79,255,205,217,120,93,96,216,186,55,87,218,252,137,14,219,62,227,57,222,113,245,188,223,179,159,139,221,245,33,210,220,55,75,229,215,107,12,216,214,169,102,239,212,239,216,182,213,45,178,129,208,98,164,4,209,160,206,51,211,230,112,106,210,36,26,93,197,94,254,16,196,156,148,39,198,218,42,126,199,24,64,73,194,87,86,204,195,149,60,251,193,211,130,162,192,17,232,149,203,77,175,168,202,143,197,159,200,201,123,198,201,11,17,241,204,68,7,116,205,134,109,67,207,192,211,26,206,2,185,45,145,175,150,64,144,109,252,119,146,43,66,46,147,233,40,25,150,166,62,156,151,100,84,171,149,34,234,242,148,224,128,197,159,188,199,248,158,126,173,207,156,56,19,150,157,250,121,161,152,181,111,36,153,119,5,19,155,49,187,74,154,243,209,125,141,137,53,48,140,75,95,7,142,13,225,94,143,207,139,105,138,128,157,236,139,66,247,219,137,4,73,130,136,198,35,181,131,154,100,136,130,88,14,191,128,30,176,230,129,220,218,209,132,147,204,84,133,81,166,99,135,23,24,58,134,213,114,13,169,226,208,160,168,32,186,151,170,102,4,206,171,164,110,249,174,235,120,124,175,41,18,75,173,111,172,18,172,173,198,37,167,241,129,24,166,51,235,47,164,117,85,118,165,183,63,65,160,248,41,196,161,58,67,243,163,124,253,170,162,190,151,157,181,196,115,208,180,6,25,231,182,64,167,190,183,130,205,137,178,205,219,12,179,15,177,59,177,73,15,98,176,139,101,85,187,215,34,104,186,21,72,95,184,83,246,6,185,145,156,49,188,222,138,180,189,28,224,131,191,90,94,218,190,152,52,237,0,0,0,0,184,188,103,101,170,9,200,139,18,181,175,238,143,98,151,87,55,222,240,50,37,107,95,220,157,215,56,185,197,180,40,239,125,8,79,138,111,189,224,100,215,1,135,1,74,214,191,184,242,106,216,221,224,223,119,51,88,99,16,86,80,25,87,159,232,165,48,250,250,16,159,20,66,172,248,113,223,123,192,200,103,199,167,173,117,114,8,67,205,206,111,38,149,173,127,112,45,17,24,21,63,164,183,251,135,24,208,158,26,207,232,39,162,115,143,66,176,198,32,172,8,122,71,201,160,50,175,62,24,142,200,91,10,59,103,181,178,135,0,208,47,80,56,105,151,236,95,12,133,89,240,226,61,229,151,135,101,134,135,209,221,58,224,180,207,143,79,90,119,51,40,63,234,228,16,134,82,88,119,227,64,237,216,13,248,81,191,104,240,43,248,161,72,151,159,196,90,34,48,42,226,158,87,79,127,73,111,246,199,245,8,147,213,64,167,125,109,252,192,24,53,159,208,78,141,35,183,43,159,150,24,197,39,42,127,160,186,253,71,25,2,65,32,124,16,244,143,146,168,72,232,247,155,20,88,61,35,168,63,88,49,29,144,182,137,161,247,211,20,118,207,106,172,202,168,15,190,127,7,225,6,195,96,132,94,160,112,210,230,28,23,183,244,169,184,89,76,21,223,60,209,194,231,133,105,126,128,224,123,203,47,14,195,119,72,107,203,13,15,162,115,177,104,199,97,4,199,41,217,184,160,76,68,111,152,245,252,211,255,144,238,102,80,126,86,218,55,27,14,185,39,77,182,5,64,40,164,176,239,198,28,12,136,163,129,219,176,26,57,103,215,127,43,210,120,145,147,110,31,244,59,38,247,3,131,154,144,102,145,47,63,136,41,147,88,237,180,68,96,84,12,248,7,49,30,77,168,223,166,241,207,186,254,146,223,236,70,46,184,137,84,155,23,103,236,39,112,2,113,240,72,187,201,76,47,222,219,249,128,48,99,69,231,85,107,63,160,156,211,131,199,249,193,54,104,23,121,138,15,114,228,93,55,203,92,225,80,174,78,84,255,64,246,232,152,37,174,139,136,115,22,55,239,22,4,130,64,248,188,62,39,157,33,233,31,36,153,85,120,65,139,224,215,175,51,92,176,202,237,89,182,59,85,229,209,94,71,80,126,176,255,236,25,213,98,59,33,108,218,135,70,9,200,50,233,231,112,142,142,130,40,237,158,212,144,81,249,177,130,228,86,95,58,88,49,58,167,143,9,131,31,51,110,230,13,134,193,8,181,58,166,109,189,64,225,164,5,252,134,193,23,73,41,47,175,245,78,74,50,34,118,243,138,158,17,150,152,43,190,120,32,151,217,29,120,244,201,75,192,72,174,46,210,253,1,192,106,65,102,165,247,150,94,28,79,42,57,121,93,159,150,151,229,35,241,242,77,107,25,5,245,215,126,96,231,98,209,142,95,222,182,235,194,9,142,82,122,181,233,55,104,0,70,217,208,188,33,188,136,223,49,234,48,99,86,143,34,214,249,97,154,106,158,4,7,189,166,189,191,1,193,216,173,180,110,54,21,8,9,83,29,114,78,154,165,206,41,255,183,123,134,17,15,199,225,116,146,16,217,205,42,172,190,168,56,25,17,70,128,165,118,35,216,198,102,117,96,122,1,16,114,207,174,254,202,115,201,155,87,164,241,34,239,24,150,71,253,173,57,169,69,17,94,204,118,77,238,6,206,241,137,99,220,68,38,141,100,248,65,232,249,47,121,81,65,147,30,52,83,38,177,218,235,154,214,191,179,249,198,233,11,69,161,140,25,240,14,98,161,76,105,7,60,155,81,190,132,39,54,219,150,146,153,53,46,46,254,80,38,84,185,153,158,232,222,252,140,93,113,18,52,225,22,119,169,54,46,206,17,138,73,171,3,63,230,69,187,131,129,32,227,224,145,118,91,92,246,19,73,233,89,253,241,85,62,152,108,130,6,33,212,62,97,68,198,139,206,170,126,55,169,207,214,127,65,56,110,195,38,93,124,118,137,179,196,202,238,214,89,29,214,111,225,161,177,10,243,20,30,228,75,168,121,129,19,203,105,215,171,119,14,178,185,194,161,92,1,126,198,57,156,169,254,128,36,21,153,229,54,160,54,11,142,28,81,110,134,102,22,167,62,218,113,194,44,111,222,44,148,211,185,73,9,4,129,240,177,184,230,149,163,13,73,123,27,177,46,30,67,210,62,72,251,110,89,45,233,219,246,195,81,103,145,166,204,176,169,31,116,12,206,122,102,185,97,148,222,5,6,241,0,0,0,0,0,0,0,0,8,0,0,0,4,0,4,0,8,0,4,0,2,0,0,0,4,0,5,0,16,0,8,0,2,0,0,0,4,0,6,0,32,0,32,0,2,0,0,0,4,0,4,0,16,0,16,0,10,0,0,0,8,0,16,0,32,0,32,0,10,0,0,0,8,0,16,0,128,0,128,0,10,0,0,0,8,0,32,0,128,0,0,1,10,0,0,0,32,0,128,0,2,1,0,4,10,0,0,0,32,0,2,1,2,1,0,16,10,0,0,0,16,17,18,0,8,7,9,6,10,5,11,4,12,3,13,2,14,1,15,0,0,0,0,0,0,0,0,0,1,0,0,0,2,0,0,0,3,0,0,0,4,0,0,0,5,0,0,0,6,0,0,0,7,0,0,0,8,0,0,0,10,0,0,0,12,0,0,0,14,0,0,0,16,0,0,0,20,0,0,0,24,0,0,0,28,0,0,0,32,0,0,0,40,0,0,0,48,0,0,0,56,0,0,0,64,0,0,0,80,0,0,0,96,0,0,0,112,0,0,0,128,0,0,0,160,0,0,0,192,0,0,0,224,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,2,0,0,0,3,0,0,0,4,0,0,0,6,0,0,0,8,0,0,0,12,0,0,0,16,0,0,0,24,0,0,0,32,0,0,0,48,0,0,0,64,0,0,0,96,0,0,0,128,0,0,0,192,0,0,0,0,1,0,0,128,1,0,0,0,2,0,0,0,3,0,0,0,4,0,0,0,6,0,0,0,8,0,0,0,12,0,0,0,16,0,0,0,24,0,0,0,32,0,0,0,48,0,0,0,64,0,0,0,96,0,0,105,110,118,97,108,105,100,32,99,111,100,101,32,108,101,110,103,116,104,115,32,115,101,116,0,0,0,0,0,0,0,0,105,110,118,97,108,105,100,32,111,114,32,105,110,99,111,109,112,108,101,116,101,32,100,101,102,108,97,116,101,32,100,97,116,97,10,0,0,0,0,0,105,110,99,111,109,112,97,116,105,98,108,101,32,118,101,114,115,105,111,110,0,0,0,0,116,111,111,32,109,97,110,121,32,108,101,110,103,116,104,32,111,114,32,100,105,115,116,97,110,99,101,32,115,121,109,98,111,108,115,0,0,0,0,0,105,110,118,97,108,105,100,32,99,111,109,112,114,101,115,115,105,111,110,32,108,101,118,101,108,10,0,0,0,0,0,0,105,110,118,97,108,105,100,32,100,105,115,116,97,110,99,101,32,116,111,111,32,102,97,114,32,98,97,99,107,0,0,0,98,117,102,102,101,114,32,101,114,114,111,114,0,0,0,0,105,110,118,97,108,105,100,32,115,116,111,114,101,100,32,98,108,111,99,107,32,108,101,110,103,116,104,115,0,0,0,0,101,114,114,111,114,32,119,114,105,116,105,110,103,32,115,116,100,111,117,116,10,0,0,0,105,110,115,117,102,102,105,99,105,101,110,116,32,109,101,109,111,114,121,0,0,0,0,0,105,110,118,97,108,105,100,32,98,108,111,99,107,32,116,121,112,101,0,0,0,0,0,0,101,114,114,111,114,32,114,101,97,100,105,110,103,32,115,116,100,105,110,10,0,0,0,0,110,101,101,100,32,100,105,99,116,105,111,110,97,114,121,0,100,97,116,97,32,101,114,114,111,114,0,0,0,0,0,0,104,101,97,100,101,114,32,99,114,99,32,109,105,115,109,97,116,99,104,0,0,0,0,0,122,112,105,112,101,58,32,0,115,116,114,101,97,109,32,101,114,114,111,114,0,0,0,0,117,110,107,110,111,119,110,32,104,101,97,100,101,114,32,102,108,97,103,115,32,115,101,116,0,0,0,0,0,0,0,0,114,101,116,32,61,61,32,90,95,83,84,82,69,65,77,95,69,78,68,0,0,0,0,0,102,105,108,101,32,101,114,114,111,114,0,0,0,0,0,0,105,110,118,97,108,105,100,32,119,105,110,100,111,119,32,115,105,122,101,0,0,0,0,0,115,116,114,109,46,97,118,97,105,108,95,105,110,32,61,61,32,48,0,0,0,0,0,0,105,110,118,97,108,105,100,32,108,105,116,101,114,97,108,47,108,101,110,103,116,104,32,99,111,100,101,0,0,0,0,0,117,110,107,110,111,119,110,32,99,111,109,112,114,101,115,115,105,111,110,32,109,101,116,104,111,100,0,0,0,0,0,0,122,112,105,112,101,46,99,0,105,110,99,111,114,114,101,99,116,32,108,101,110,103,116,104,32,99,104,101,99,107,0,0,105,110,118,97,108,105,100,32,100,105,115,116,97,110,99,101,32,99,111,100,101,0,0,0,49,46,50,46,55,0,0,0,105,110,99,111,114,114,101,99,116,32,100,97,116,97,32,99,104,101,99,107,0,0,0,0,122,112,105,112,101,32,117,115,97,103,101,58,32,122,112,105,112,101,32,91,45,100,93,32,60,32,115,111,117,114,99,101,32,62,32,100,101,115,116,10,0,0,0,0,0,0,0,0,105,110,118,97,108,105,100,32,100,105,115,116,97,110,99,101,32,116,111,111,32,102,97,114,32,98,97,99,107,0,0,0,115,116,114,101,97,109,32,101,110,100,0,0,0,0,0,0,45,100,0,0,0,0,0,0,105,110,118,97,108,105,100,32,100,105,115,116,97,110,99,101,32,99,111,100,101,0,0,0,119,0,0,0,0,0,0,0,105,110,118,97,108,105,100,32,108,105,116,101,114,97,108,47,108,101,110,103,116,104,32,99,111,100,101,0,0,0,0,0,111,117,116,112,117,116,0,0,105,110,118,97,108,105,100,32,100,105,115,116,97,110,99,101,115,32,115,101,116,0,0,0,114,0,0,0,0,0,0,0,105,110,118,97,108,105,100,32,108,105,116,101,114,97,108,47,108,101,110,103,116,104,115,32,115,101,116,0,0,0,0,0,105,110,112,117,116,0,0,0,105,110,99,111,114,114,101,99,116,32,104,101,97,100,101,114,32,99,104,101,99,107,0,0,105,110,118,97,108,105,100,32,99,111,100,101,32,45,45,32,109,105,115,115,105,110,103,32,101,110,100,45,111,102,45,98,108,111,99,107,0,0,0,0,122,108,105,98,32,118,101,114,115,105,111,110,32,109,105,115,109,97,116,99,104,33,10,0,105,110,118,97,108,105,100,32,98,105,116,32,108,101,110,103,116,104,32,114,101,112,101,97,116,0,0,0,0,0,0,0,111,117,116,32,111,102,32,109,101,109,111,114,121,10,0,0,114,101,116,32,33,61,32,90,95,83,84,82,69,65,77,95,69,82,82,79,82,0,0,0,49,46,50,46,53,0,0,0,0,1,2,3,4,5,6,7,8,8,9,9,10,10,11,11,12,12,12,12,13,13,13,13,14,14,14,14,15,15,15,15,16,16,16,16,16,16,16,16,17,17,17,17,17,17,17,17,18,18,18,18,18,18,18,18,19,19,19,19,19,19,19,19,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,21,21,21,21,21,21,21,21,21,21,21,21,21,21,21,21,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,23,23,23,23,23,23,23,23,23,23,23,23,23,23,23,23,24,24,24,24,24,24,24,24,24,24,24,24,24,24,24,24,24,24,24,24,24,24,24,24,24,24,24,24,24,24,24,24,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,27,27,27,27,27,27,27,27,27,27,27,27,27,27,27,27,27,27,27,27,27,27,27,27,27,27,27,27,27,27,27,28,0,1,2,3,4,4,5,5,6,6,6,6,7,7,7,7,8,8,8,8,8,8,8,8,9,9,9,9,9,9,9,9,10,10,10,10,10,10,10,10,10,10,10,10,10,10,10,10,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,0,0,16,17,18,18,19,19,20,20,20,20,21,21,21,21,22,22,22,22,22,22,22,22,23,23,23,23,23,23,23,23,24,24,24,24,24,24,24,24,24,24,24,24,24,24,24,24,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,27,27,27,27,27,27,27,27,27,27,27,27,27,27,27,27,27,27,27,27,27,27,27,27,27,27,27,27,27,27,27,27,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,105,110,102,0,0,0,0,0,100,101,102,0,0,0,0,0])
, "i8", ALLOC_NONE, Runtime.GLOBAL_BASE)
function runPostSets() {
}
var tempDoublePtr = Runtime.alignMemory(allocate(12, "i8", ALLOC_STATIC), 8);
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
  var ERRNO_CODES={EPERM:1,ENOENT:2,ESRCH:3,EINTR:4,EIO:5,ENXIO:6,E2BIG:7,ENOEXEC:8,EBADF:9,ECHILD:10,EAGAIN:11,EWOULDBLOCK:11,ENOMEM:12,EACCES:13,EFAULT:14,ENOTBLK:15,EBUSY:16,EEXIST:17,EXDEV:18,ENODEV:19,ENOTDIR:20,EISDIR:21,EINVAL:22,ENFILE:23,EMFILE:24,ENOTTY:25,ETXTBSY:26,EFBIG:27,ENOSPC:28,ESPIPE:29,EROFS:30,EMLINK:31,EPIPE:32,EDOM:33,ERANGE:34,ENOMSG:42,EIDRM:43,ECHRNG:44,EL2NSYNC:45,EL3HLT:46,EL3RST:47,ELNRNG:48,EUNATCH:49,ENOCSI:50,EL2HLT:51,EDEADLK:35,ENOLCK:37,EBADE:52,EBADR:53,EXFULL:54,ENOANO:55,EBADRQC:56,EBADSLT:57,EDEADLOCK:35,EBFONT:59,ENOSTR:60,ENODATA:61,ETIME:62,ENOSR:63,ENONET:64,ENOPKG:65,EREMOTE:66,ENOLINK:67,EADV:68,ESRMNT:69,ECOMM:70,EPROTO:71,EMULTIHOP:72,EDOTDOT:73,EBADMSG:74,ENOTUNIQ:76,EBADFD:77,EREMCHG:78,ELIBACC:79,ELIBBAD:80,ELIBSCN:81,ELIBMAX:82,ELIBEXEC:83,ENOSYS:38,ENOTEMPTY:39,ENAMETOOLONG:36,ELOOP:40,EOPNOTSUPP:95,EPFNOSUPPORT:96,ECONNRESET:104,ENOBUFS:105,EAFNOSUPPORT:97,EPROTOTYPE:91,ENOTSOCK:88,ENOPROTOOPT:92,ESHUTDOWN:108,ECONNREFUSED:111,EADDRINUSE:98,ECONNABORTED:103,ENETUNREACH:101,ENETDOWN:100,ETIMEDOUT:110,EHOSTDOWN:112,EHOSTUNREACH:113,EINPROGRESS:115,EALREADY:114,EDESTADDRREQ:89,EMSGSIZE:90,EPROTONOSUPPORT:93,ESOCKTNOSUPPORT:94,EADDRNOTAVAIL:99,ENETRESET:102,EISCONN:106,ENOTCONN:107,ETOOMANYREFS:109,EUSERS:87,EDQUOT:122,ESTALE:116,ENOTSUP:95,ENOMEDIUM:123,EILSEQ:84,EOVERFLOW:75,ECANCELED:125,ENOTRECOVERABLE:131,EOWNERDEAD:130,ESTRPIPE:86};
  var ERRNO_MESSAGES={0:"Success",1:"Not super-user",2:"No such file or directory",3:"No such process",4:"Interrupted system call",5:"I/O error",6:"No such device or address",7:"Arg list too long",8:"Exec format error",9:"Bad file number",10:"No children",11:"No more processes",12:"Not enough core",13:"Permission denied",14:"Bad address",15:"Block device required",16:"Mount device busy",17:"File exists",18:"Cross-device link",19:"No such device",20:"Not a directory",21:"Is a directory",22:"Invalid argument",23:"Too many open files in system",24:"Too many open files",25:"Not a typewriter",26:"Text file busy",27:"File too large",28:"No space left on device",29:"Illegal seek",30:"Read only file system",31:"Too many links",32:"Broken pipe",33:"Math arg out of domain of func",34:"Math result not representable",35:"File locking deadlock error",36:"File or path name too long",37:"No record locks available",38:"Function not implemented",39:"Directory not empty",40:"Too many symbolic links",42:"No message of desired type",43:"Identifier removed",44:"Channel number out of range",45:"Level 2 not synchronized",46:"Level 3 halted",47:"Level 3 reset",48:"Link number out of range",49:"Protocol driver not attached",50:"No CSI structure available",51:"Level 2 halted",52:"Invalid exchange",53:"Invalid request descriptor",54:"Exchange full",55:"No anode",56:"Invalid request code",57:"Invalid slot",59:"Bad font file fmt",60:"Device not a stream",61:"No data (for no delay io)",62:"Timer expired",63:"Out of streams resources",64:"Machine is not on the network",65:"Package not installed",66:"The object is remote",67:"The link has been severed",68:"Advertise error",69:"Srmount error",70:"Communication error on send",71:"Protocol error",72:"Multihop attempted",73:"Cross mount point (not really error)",74:"Trying to read unreadable message",75:"Value too large for defined data type",76:"Given log. name not unique",77:"f.d. invalid for this operation",78:"Remote address changed",79:"Can   access a needed shared lib",80:"Accessing a corrupted shared lib",81:".lib section in a.out corrupted",82:"Attempting to link in too many libs",83:"Attempting to exec a shared library",84:"Illegal byte sequence",86:"Streams pipe error",87:"Too many users",88:"Socket operation on non-socket",89:"Destination address required",90:"Message too long",91:"Protocol wrong type for socket",92:"Protocol not available",93:"Unknown protocol",94:"Socket type not supported",95:"Not supported",96:"Protocol family not supported",97:"Address family not supported by protocol family",98:"Address already in use",99:"Address not available",100:"Network interface is not configured",101:"Network is unreachable",102:"Connection reset by network",103:"Connection aborted",104:"Connection reset by peer",105:"No buffer space available",106:"Socket is already connected",107:"Socket is not connected",108:"Can't send after socket shutdown",109:"Too many references",110:"Connection timed out",111:"Connection refused",112:"Host is down",113:"Host is unreachable",114:"Socket already connected",115:"Connection already in progress",116:"Stale file handle",122:"Quota exceeded",123:"No medium (in tape drive)",125:"Operation canceled",130:"Previous owner died",131:"State not recoverable"};
  var ___errno_state=0;function ___setErrNo(value) {
      // For convenient setting and returning of errno.
      HEAP32[((___errno_state)>>2)]=value
      return value;
    }
  var PATH={splitPath:function (filename) {
        var splitPathRe = /^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/;
        return splitPathRe.exec(filename).slice(1);
      },normalizeArray:function (parts, allowAboveRoot) {
        // if the path tries to go above the root, `up` ends up > 0
        var up = 0;
        for (var i = parts.length - 1; i >= 0; i--) {
          var last = parts[i];
          if (last === '.') {
            parts.splice(i, 1);
          } else if (last === '..') {
            parts.splice(i, 1);
            up++;
          } else if (up) {
            parts.splice(i, 1);
            up--;
          }
        }
        // if the path is allowed to go above the root, restore leading ..s
        if (allowAboveRoot) {
          for (; up--; up) {
            parts.unshift('..');
          }
        }
        return parts;
      },normalize:function (path) {
        var isAbsolute = path.charAt(0) === '/',
            trailingSlash = path.substr(-1) === '/';
        // Normalize the path
        path = PATH.normalizeArray(path.split('/').filter(function(p) {
          return !!p;
        }), !isAbsolute).join('/');
        if (!path && !isAbsolute) {
          path = '.';
        }
        if (path && trailingSlash) {
          path += '/';
        }
        return (isAbsolute ? '/' : '') + path;
      },dirname:function (path) {
        var result = PATH.splitPath(path),
            root = result[0],
            dir = result[1];
        if (!root && !dir) {
          // No dirname whatsoever
          return '.';
        }
        if (dir) {
          // It has a dirname, strip trailing slash
          dir = dir.substr(0, dir.length - 1);
        }
        return root + dir;
      },basename:function (path) {
        // EMSCRIPTEN return '/'' for '/', not an empty string
        if (path === '/') return '/';
        var lastSlash = path.lastIndexOf('/');
        if (lastSlash === -1) return path;
        return path.substr(lastSlash+1);
      },extname:function (path) {
        return PATH.splitPath(path)[3];
      },join:function () {
        var paths = Array.prototype.slice.call(arguments, 0);
        return PATH.normalize(paths.join('/'));
      },join2:function (l, r) {
        return PATH.normalize(l + '/' + r);
      },resolve:function () {
        var resolvedPath = '',
          resolvedAbsolute = false;
        for (var i = arguments.length - 1; i >= -1 && !resolvedAbsolute; i--) {
          var path = (i >= 0) ? arguments[i] : FS.cwd();
          // Skip empty and invalid entries
          if (typeof path !== 'string') {
            throw new TypeError('Arguments to path.resolve must be strings');
          } else if (!path) {
            continue;
          }
          resolvedPath = path + '/' + resolvedPath;
          resolvedAbsolute = path.charAt(0) === '/';
        }
        // At this point the path should be resolved to a full absolute path, but
        // handle relative paths to be safe (might happen when process.cwd() fails)
        resolvedPath = PATH.normalizeArray(resolvedPath.split('/').filter(function(p) {
          return !!p;
        }), !resolvedAbsolute).join('/');
        return ((resolvedAbsolute ? '/' : '') + resolvedPath) || '.';
      },relative:function (from, to) {
        from = PATH.resolve(from).substr(1);
        to = PATH.resolve(to).substr(1);
        function trim(arr) {
          var start = 0;
          for (; start < arr.length; start++) {
            if (arr[start] !== '') break;
          }
          var end = arr.length - 1;
          for (; end >= 0; end--) {
            if (arr[end] !== '') break;
          }
          if (start > end) return [];
          return arr.slice(start, end - start + 1);
        }
        var fromParts = trim(from.split('/'));
        var toParts = trim(to.split('/'));
        var length = Math.min(fromParts.length, toParts.length);
        var samePartsLength = length;
        for (var i = 0; i < length; i++) {
          if (fromParts[i] !== toParts[i]) {
            samePartsLength = i;
            break;
          }
        }
        var outputParts = [];
        for (var i = samePartsLength; i < fromParts.length; i++) {
          outputParts.push('..');
        }
        outputParts = outputParts.concat(toParts.slice(samePartsLength));
        return outputParts.join('/');
      }};
  var TTY={ttys:[],init:function () {
        // https://github.com/kripken/emscripten/pull/1555
        // if (ENVIRONMENT_IS_NODE) {
        //   // currently, FS.init does not distinguish if process.stdin is a file or TTY
        //   // device, it always assumes it's a TTY device. because of this, we're forcing
        //   // process.stdin to UTF8 encoding to at least make stdin reading compatible
        //   // with text files until FS.init can be refactored.
        //   process['stdin']['setEncoding']('utf8');
        // }
      },shutdown:function () {
        // https://github.com/kripken/emscripten/pull/1555
        // if (ENVIRONMENT_IS_NODE) {
        //   // inolen: any idea as to why node -e 'process.stdin.read()' wouldn't exit immediately (with process.stdin being a tty)?
        //   // isaacs: because now it's reading from the stream, you've expressed interest in it, so that read() kicks off a _read() which creates a ReadReq operation
        //   // inolen: I thought read() in that case was a synchronous operation that just grabbed some amount of buffered data if it exists?
        //   // isaacs: it is. but it also triggers a _read() call, which calls readStart() on the handle
        //   // isaacs: do process.stdin.pause() and i'd think it'd probably close the pending call
        //   process['stdin']['pause']();
        // }
      },register:function (dev, ops) {
        TTY.ttys[dev] = { input: [], output: [], ops: ops };
        FS.registerDevice(dev, TTY.stream_ops);
      },stream_ops:{open:function (stream) {
          var tty = TTY.ttys[stream.node.rdev];
          if (!tty) {
            throw new FS.ErrnoError(ERRNO_CODES.ENODEV);
          }
          stream.tty = tty;
          stream.seekable = false;
        },close:function (stream) {
          // flush any pending line data
          if (stream.tty.output.length) {
            stream.tty.ops.put_char(stream.tty, 10);
          }
        },read:function (stream, buffer, offset, length, pos /* ignored */) {
          if (!stream.tty || !stream.tty.ops.get_char) {
            throw new FS.ErrnoError(ERRNO_CODES.ENXIO);
          }
          var bytesRead = 0;
          for (var i = 0; i < length; i++) {
            var result;
            try {
              result = stream.tty.ops.get_char(stream.tty);
            } catch (e) {
              throw new FS.ErrnoError(ERRNO_CODES.EIO);
            }
            if (result === undefined && bytesRead === 0) {
              throw new FS.ErrnoError(ERRNO_CODES.EAGAIN);
            }
            if (result === null || result === undefined) break;
            bytesRead++;
            buffer[offset+i] = result;
          }
          if (bytesRead) {
            stream.node.timestamp = Date.now();
          }
          return bytesRead;
        },write:function (stream, buffer, offset, length, pos) {
          if (!stream.tty || !stream.tty.ops.put_char) {
            throw new FS.ErrnoError(ERRNO_CODES.ENXIO);
          }
          for (var i = 0; i < length; i++) {
            try {
              stream.tty.ops.put_char(stream.tty, buffer[offset+i]);
            } catch (e) {
              throw new FS.ErrnoError(ERRNO_CODES.EIO);
            }
          }
          if (length) {
            stream.node.timestamp = Date.now();
          }
          return i;
        }},default_tty_ops:{get_char:function (tty) {
          if (!tty.input.length) {
            var result = null;
            if (ENVIRONMENT_IS_NODE) {
              result = process['stdin']['read']();
              if (!result) {
                if (process['stdin']['_readableState'] && process['stdin']['_readableState']['ended']) {
                  return null;  // EOF
                }
                return undefined;  // no data available
              }
            } else if (typeof window != 'undefined' &&
              typeof window.prompt == 'function') {
              // Browser.
              result = window.prompt('Input: ');  // returns null on cancel
              if (result !== null) {
                result += '\n';
              }
            } else if (typeof readline == 'function') {
              // Command line.
              result = readline();
              if (result !== null) {
                result += '\n';
              }
            }
            if (!result) {
              return null;
            }
            tty.input = intArrayFromString(result, true);
          }
          return tty.input.shift();
        },put_char:function (tty, val) {
          if (val === null || val === 10) {
            Module['print'](tty.output.join(''));
            tty.output = [];
          } else {
            tty.output.push(TTY.utf8.processCChar(val));
          }
        }},default_tty1_ops:{put_char:function (tty, val) {
          if (val === null || val === 10) {
            Module['printErr'](tty.output.join(''));
            tty.output = [];
          } else {
            tty.output.push(TTY.utf8.processCChar(val));
          }
        }}};
  var MEMFS={ops_table:null,CONTENT_OWNING:1,CONTENT_FLEXIBLE:2,CONTENT_FIXED:3,mount:function (mount) {
        return MEMFS.createNode(null, '/', 16384 | 0777, 0);
      },createNode:function (parent, name, mode, dev) {
        if (FS.isBlkdev(mode) || FS.isFIFO(mode)) {
          // no supported
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        if (!MEMFS.ops_table) {
          MEMFS.ops_table = {
            dir: {
              node: {
                getattr: MEMFS.node_ops.getattr,
                setattr: MEMFS.node_ops.setattr,
                lookup: MEMFS.node_ops.lookup,
                mknod: MEMFS.node_ops.mknod,
                mknod: MEMFS.node_ops.mknod,
                rename: MEMFS.node_ops.rename,
                unlink: MEMFS.node_ops.unlink,
                rmdir: MEMFS.node_ops.rmdir,
                readdir: MEMFS.node_ops.readdir,
                symlink: MEMFS.node_ops.symlink
              },
              stream: {
                llseek: MEMFS.stream_ops.llseek
              }
            },
            file: {
              node: {
                getattr: MEMFS.node_ops.getattr,
                setattr: MEMFS.node_ops.setattr
              },
              stream: {
                llseek: MEMFS.stream_ops.llseek,
                read: MEMFS.stream_ops.read,
                write: MEMFS.stream_ops.write,
                allocate: MEMFS.stream_ops.allocate,
                mmap: MEMFS.stream_ops.mmap
              }
            },
            link: {
              node: {
                getattr: MEMFS.node_ops.getattr,
                setattr: MEMFS.node_ops.setattr,
                readlink: MEMFS.node_ops.readlink
              },
              stream: {}
            },
            chrdev: {
              node: {
                getattr: MEMFS.node_ops.getattr,
                setattr: MEMFS.node_ops.setattr
              },
              stream: FS.chrdev_stream_ops
            },
          };
        }
        var node = FS.createNode(parent, name, mode, dev);
        if (FS.isDir(node.mode)) {
          node.node_ops = MEMFS.ops_table.dir.node;
          node.stream_ops = MEMFS.ops_table.dir.stream;
          node.contents = {};
        } else if (FS.isFile(node.mode)) {
          node.node_ops = MEMFS.ops_table.file.node;
          node.stream_ops = MEMFS.ops_table.file.stream;
          node.contents = [];
          node.contentMode = MEMFS.CONTENT_FLEXIBLE;
        } else if (FS.isLink(node.mode)) {
          node.node_ops = MEMFS.ops_table.link.node;
          node.stream_ops = MEMFS.ops_table.link.stream;
        } else if (FS.isChrdev(node.mode)) {
          node.node_ops = MEMFS.ops_table.chrdev.node;
          node.stream_ops = MEMFS.ops_table.chrdev.stream;
        }
        node.timestamp = Date.now();
        // add the new node to the parent
        if (parent) {
          parent.contents[name] = node;
        }
        return node;
      },ensureFlexible:function (node) {
        if (node.contentMode !== MEMFS.CONTENT_FLEXIBLE) {
          var contents = node.contents;
          node.contents = Array.prototype.slice.call(contents);
          node.contentMode = MEMFS.CONTENT_FLEXIBLE;
        }
      },node_ops:{getattr:function (node) {
          var attr = {};
          // device numbers reuse inode numbers.
          attr.dev = FS.isChrdev(node.mode) ? node.id : 1;
          attr.ino = node.id;
          attr.mode = node.mode;
          attr.nlink = 1;
          attr.uid = 0;
          attr.gid = 0;
          attr.rdev = node.rdev;
          if (FS.isDir(node.mode)) {
            attr.size = 4096;
          } else if (FS.isFile(node.mode)) {
            attr.size = node.contents.length;
          } else if (FS.isLink(node.mode)) {
            attr.size = node.link.length;
          } else {
            attr.size = 0;
          }
          attr.atime = new Date(node.timestamp);
          attr.mtime = new Date(node.timestamp);
          attr.ctime = new Date(node.timestamp);
          // NOTE: In our implementation, st_blocks = Math.ceil(st_size/st_blksize),
          //       but this is not required by the standard.
          attr.blksize = 4096;
          attr.blocks = Math.ceil(attr.size / attr.blksize);
          return attr;
        },setattr:function (node, attr) {
          if (attr.mode !== undefined) {
            node.mode = attr.mode;
          }
          if (attr.timestamp !== undefined) {
            node.timestamp = attr.timestamp;
          }
          if (attr.size !== undefined) {
            MEMFS.ensureFlexible(node);
            var contents = node.contents;
            if (attr.size < contents.length) contents.length = attr.size;
            else while (attr.size > contents.length) contents.push(0);
          }
        },lookup:function (parent, name) {
          throw FS.genericErrors[ERRNO_CODES.ENOENT];
        },mknod:function (parent, name, mode, dev) {
          return MEMFS.createNode(parent, name, mode, dev);
        },rename:function (old_node, new_dir, new_name) {
          // if we're overwriting a directory at new_name, make sure it's empty.
          if (FS.isDir(old_node.mode)) {
            var new_node;
            try {
              new_node = FS.lookupNode(new_dir, new_name);
            } catch (e) {
            }
            if (new_node) {
              for (var i in new_node.contents) {
                throw new FS.ErrnoError(ERRNO_CODES.ENOTEMPTY);
              }
            }
          }
          // do the internal rewiring
          delete old_node.parent.contents[old_node.name];
          old_node.name = new_name;
          new_dir.contents[new_name] = old_node;
          old_node.parent = new_dir;
        },unlink:function (parent, name) {
          delete parent.contents[name];
        },rmdir:function (parent, name) {
          var node = FS.lookupNode(parent, name);
          for (var i in node.contents) {
            throw new FS.ErrnoError(ERRNO_CODES.ENOTEMPTY);
          }
          delete parent.contents[name];
        },readdir:function (node) {
          var entries = ['.', '..']
          for (var key in node.contents) {
            if (!node.contents.hasOwnProperty(key)) {
              continue;
            }
            entries.push(key);
          }
          return entries;
        },symlink:function (parent, newname, oldpath) {
          var node = MEMFS.createNode(parent, newname, 0777 | 40960, 0);
          node.link = oldpath;
          return node;
        },readlink:function (node) {
          if (!FS.isLink(node.mode)) {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
          }
          return node.link;
        }},stream_ops:{read:function (stream, buffer, offset, length, position) {
          var contents = stream.node.contents;
          if (position >= contents.length)
            return 0;
          var size = Math.min(contents.length - position, length);
          assert(size >= 0);
          if (size > 8 && contents.subarray) { // non-trivial, and typed array
            buffer.set(contents.subarray(position, position + size), offset);
          } else
          {
            for (var i = 0; i < size; i++) {
              buffer[offset + i] = contents[position + i];
            }
          }
          return size;
        },write:function (stream, buffer, offset, length, position, canOwn) {
          var node = stream.node;
          node.timestamp = Date.now();
          var contents = node.contents;
          if (length && contents.length === 0 && position === 0 && buffer.subarray) {
            // just replace it with the new data
            if (canOwn && offset === 0) {
              node.contents = buffer; // this could be a subarray of Emscripten HEAP, or allocated from some other source.
              node.contentMode = (buffer.buffer === HEAP8.buffer) ? MEMFS.CONTENT_OWNING : MEMFS.CONTENT_FIXED;
            } else {
              node.contents = new Uint8Array(buffer.subarray(offset, offset+length));
              node.contentMode = MEMFS.CONTENT_FIXED;
            }
            return length;
          }
          MEMFS.ensureFlexible(node);
          var contents = node.contents;
          while (contents.length < position) contents.push(0);
          for (var i = 0; i < length; i++) {
            contents[position + i] = buffer[offset + i];
          }
          return length;
        },llseek:function (stream, offset, whence) {
          var position = offset;
          if (whence === 1) {  // SEEK_CUR.
            position += stream.position;
          } else if (whence === 2) {  // SEEK_END.
            if (FS.isFile(stream.node.mode)) {
              position += stream.node.contents.length;
            }
          }
          if (position < 0) {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
          }
          stream.ungotten = [];
          stream.position = position;
          return position;
        },allocate:function (stream, offset, length) {
          MEMFS.ensureFlexible(stream.node);
          var contents = stream.node.contents;
          var limit = offset + length;
          while (limit > contents.length) contents.push(0);
        },mmap:function (stream, buffer, offset, length, position, prot, flags) {
          if (!FS.isFile(stream.node.mode)) {
            throw new FS.ErrnoError(ERRNO_CODES.ENODEV);
          }
          var ptr;
          var allocated;
          var contents = stream.node.contents;
          // Only make a new copy when MAP_PRIVATE is specified.
          if ( !(flags & 2) &&
                (contents.buffer === buffer || contents.buffer === buffer.buffer) ) {
            // We can't emulate MAP_SHARED when the file is not backed by the buffer
            // we're mapping to (e.g. the HEAP buffer).
            allocated = false;
            ptr = contents.byteOffset;
          } else {
            // Try to avoid unnecessary slices.
            if (position > 0 || position + length < contents.length) {
              if (contents.subarray) {
                contents = contents.subarray(position, position + length);
              } else {
                contents = Array.prototype.slice.call(contents, position, position + length);
              }
            }
            allocated = true;
            ptr = _malloc(length);
            if (!ptr) {
              throw new FS.ErrnoError(ERRNO_CODES.ENOMEM);
            }
            buffer.set(contents, ptr);
          }
          return { ptr: ptr, allocated: allocated };
        }}};
  var IDBFS={dbs:{},indexedDB:function () {
        return window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
      },DB_VERSION:20,DB_STORE_NAME:"FILE_DATA",mount:function (mount) {
        return MEMFS.mount.apply(null, arguments);
      },syncfs:function (mount, populate, callback) {
        IDBFS.getLocalSet(mount, function(err, local) {
          if (err) return callback(err);
          IDBFS.getRemoteSet(mount, function(err, remote) {
            if (err) return callback(err);
            var src = populate ? remote : local;
            var dst = populate ? local : remote;
            IDBFS.reconcile(src, dst, callback);
          });
        });
      },reconcile:function (src, dst, callback) {
        var total = 0;
        var create = {};
        for (var key in src.files) {
          if (!src.files.hasOwnProperty(key)) continue;
          var e = src.files[key];
          var e2 = dst.files[key];
          if (!e2 || e.timestamp > e2.timestamp) {
            create[key] = e;
            total++;
          }
        }
        var remove = {};
        for (var key in dst.files) {
          if (!dst.files.hasOwnProperty(key)) continue;
          var e = dst.files[key];
          var e2 = src.files[key];
          if (!e2) {
            remove[key] = e;
            total++;
          }
        }
        if (!total) {
          // early out
          return callback(null);
        }
        var completed = 0;
        function done(err) {
          if (err) return callback(err);
          if (++completed >= total) {
            return callback(null);
          }
        };
        // create a single transaction to handle and IDB reads / writes we'll need to do
        var db = src.type === 'remote' ? src.db : dst.db;
        var transaction = db.transaction([IDBFS.DB_STORE_NAME], 'readwrite');
        transaction.onerror = function transaction_onerror() { callback(this.error); };
        var store = transaction.objectStore(IDBFS.DB_STORE_NAME);
        for (var path in create) {
          if (!create.hasOwnProperty(path)) continue;
          var entry = create[path];
          if (dst.type === 'local') {
            // save file to local
            try {
              if (FS.isDir(entry.mode)) {
                FS.mkdir(path, entry.mode);
              } else if (FS.isFile(entry.mode)) {
                var stream = FS.open(path, 'w+', 0666);
                FS.write(stream, entry.contents, 0, entry.contents.length, 0, true /* canOwn */);
                FS.close(stream);
              }
              done(null);
            } catch (e) {
              return done(e);
            }
          } else {
            // save file to IDB
            var req = store.put(entry, path);
            req.onsuccess = function req_onsuccess() { done(null); };
            req.onerror = function req_onerror() { done(this.error); };
          }
        }
        for (var path in remove) {
          if (!remove.hasOwnProperty(path)) continue;
          var entry = remove[path];
          if (dst.type === 'local') {
            // delete file from local
            try {
              if (FS.isDir(entry.mode)) {
                // TODO recursive delete?
                FS.rmdir(path);
              } else if (FS.isFile(entry.mode)) {
                FS.unlink(path);
              }
              done(null);
            } catch (e) {
              return done(e);
            }
          } else {
            // delete file from IDB
            var req = store.delete(path);
            req.onsuccess = function req_onsuccess() { done(null); };
            req.onerror = function req_onerror() { done(this.error); };
          }
        }
      },getLocalSet:function (mount, callback) {
        var files = {};
        function isRealDir(p) {
          return p !== '.' && p !== '..';
        };
        function toAbsolute(root) {
          return function(p) {
            return PATH.join2(root, p);
          }
        };
        var check = FS.readdir(mount.mountpoint)
          .filter(isRealDir)
          .map(toAbsolute(mount.mountpoint));
        while (check.length) {
          var path = check.pop();
          var stat, node;
          try {
            var lookup = FS.lookupPath(path);
            node = lookup.node;
            stat = FS.stat(path);
          } catch (e) {
            return callback(e);
          }
          if (FS.isDir(stat.mode)) {
            check.push.apply(check, FS.readdir(path)
              .filter(isRealDir)
              .map(toAbsolute(path)));
            files[path] = { mode: stat.mode, timestamp: stat.mtime };
          } else if (FS.isFile(stat.mode)) {
            files[path] = { contents: node.contents, mode: stat.mode, timestamp: stat.mtime };
          } else {
            return callback(new Error('node type not supported'));
          }
        }
        return callback(null, { type: 'local', files: files });
      },getDB:function (name, callback) {
        // look it up in the cache
        var db = IDBFS.dbs[name];
        if (db) {
          return callback(null, db);
        }
        var req;
        try {
          req = IDBFS.indexedDB().open(name, IDBFS.DB_VERSION);
        } catch (e) {
          return onerror(e);
        }
        req.onupgradeneeded = function req_onupgradeneeded() {
          db = req.result;
          db.createObjectStore(IDBFS.DB_STORE_NAME);
        };
        req.onsuccess = function req_onsuccess() {
          db = req.result;
          // add to the cache
          IDBFS.dbs[name] = db;
          callback(null, db);
        };
        req.onerror = function req_onerror() {
          callback(this.error);
        };
      },getRemoteSet:function (mount, callback) {
        var files = {};
        IDBFS.getDB(mount.mountpoint, function(err, db) {
          if (err) return callback(err);
          var transaction = db.transaction([IDBFS.DB_STORE_NAME], 'readonly');
          transaction.onerror = function transaction_onerror() { callback(this.error); };
          var store = transaction.objectStore(IDBFS.DB_STORE_NAME);
          store.openCursor().onsuccess = function store_openCursor_onsuccess(event) {
            var cursor = event.target.result;
            if (!cursor) {
              return callback(null, { type: 'remote', db: db, files: files });
            }
            files[cursor.key] = cursor.value;
            cursor.continue();
          };
        });
      }};
  var NODEFS={isWindows:false,staticInit:function () {
        NODEFS.isWindows = !!process.platform.match(/^win/);
      },mount:function (mount) {
        assert(ENVIRONMENT_IS_NODE);
        return NODEFS.createNode(null, '/', NODEFS.getMode(mount.opts.root), 0);
      },createNode:function (parent, name, mode, dev) {
        if (!FS.isDir(mode) && !FS.isFile(mode) && !FS.isLink(mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        var node = FS.createNode(parent, name, mode);
        node.node_ops = NODEFS.node_ops;
        node.stream_ops = NODEFS.stream_ops;
        return node;
      },getMode:function (path) {
        var stat;
        try {
          stat = fs.lstatSync(path);
          if (NODEFS.isWindows) {
            // On Windows, directories return permission bits 'rw-rw-rw-', even though they have 'rwxrwxrwx', so 
            // propagate write bits to execute bits.
            stat.mode = stat.mode | ((stat.mode & 146) >> 1);
          }
        } catch (e) {
          if (!e.code) throw e;
          throw new FS.ErrnoError(ERRNO_CODES[e.code]);
        }
        return stat.mode;
      },realPath:function (node) {
        var parts = [];
        while (node.parent !== node) {
          parts.push(node.name);
          node = node.parent;
        }
        parts.push(node.mount.opts.root);
        parts.reverse();
        return PATH.join.apply(null, parts);
      },flagsToPermissionStringMap:{0:"r",1:"r+",2:"r+",64:"r",65:"r+",66:"r+",129:"rx+",193:"rx+",514:"w+",577:"w",578:"w+",705:"wx",706:"wx+",1024:"a",1025:"a",1026:"a+",1089:"a",1090:"a+",1153:"ax",1154:"ax+",1217:"ax",1218:"ax+",4096:"rs",4098:"rs+"},flagsToPermissionString:function (flags) {
        if (flags in NODEFS.flagsToPermissionStringMap) {
          return NODEFS.flagsToPermissionStringMap[flags];
        } else {
          return flags;
        }
      },node_ops:{getattr:function (node) {
          var path = NODEFS.realPath(node);
          var stat;
          try {
            stat = fs.lstatSync(path);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
          // node.js v0.10.20 doesn't report blksize and blocks on Windows. Fake them with default blksize of 4096.
          // See http://support.microsoft.com/kb/140365
          if (NODEFS.isWindows && !stat.blksize) {
            stat.blksize = 4096;
          }
          if (NODEFS.isWindows && !stat.blocks) {
            stat.blocks = (stat.size+stat.blksize-1)/stat.blksize|0;
          }
          return {
            dev: stat.dev,
            ino: stat.ino,
            mode: stat.mode,
            nlink: stat.nlink,
            uid: stat.uid,
            gid: stat.gid,
            rdev: stat.rdev,
            size: stat.size,
            atime: stat.atime,
            mtime: stat.mtime,
            ctime: stat.ctime,
            blksize: stat.blksize,
            blocks: stat.blocks
          };
        },setattr:function (node, attr) {
          var path = NODEFS.realPath(node);
          try {
            if (attr.mode !== undefined) {
              fs.chmodSync(path, attr.mode);
              // update the common node structure mode as well
              node.mode = attr.mode;
            }
            if (attr.timestamp !== undefined) {
              var date = new Date(attr.timestamp);
              fs.utimesSync(path, date, date);
            }
            if (attr.size !== undefined) {
              fs.truncateSync(path, attr.size);
            }
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },lookup:function (parent, name) {
          var path = PATH.join2(NODEFS.realPath(parent), name);
          var mode = NODEFS.getMode(path);
          return NODEFS.createNode(parent, name, mode);
        },mknod:function (parent, name, mode, dev) {
          var node = NODEFS.createNode(parent, name, mode, dev);
          // create the backing node for this in the fs root as well
          var path = NODEFS.realPath(node);
          try {
            if (FS.isDir(node.mode)) {
              fs.mkdirSync(path, node.mode);
            } else {
              fs.writeFileSync(path, '', { mode: node.mode });
            }
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
          return node;
        },rename:function (oldNode, newDir, newName) {
          var oldPath = NODEFS.realPath(oldNode);
          var newPath = PATH.join2(NODEFS.realPath(newDir), newName);
          try {
            fs.renameSync(oldPath, newPath);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },unlink:function (parent, name) {
          var path = PATH.join2(NODEFS.realPath(parent), name);
          try {
            fs.unlinkSync(path);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },rmdir:function (parent, name) {
          var path = PATH.join2(NODEFS.realPath(parent), name);
          try {
            fs.rmdirSync(path);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },readdir:function (node) {
          var path = NODEFS.realPath(node);
          try {
            return fs.readdirSync(path);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },symlink:function (parent, newName, oldPath) {
          var newPath = PATH.join2(NODEFS.realPath(parent), newName);
          try {
            fs.symlinkSync(oldPath, newPath);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },readlink:function (node) {
          var path = NODEFS.realPath(node);
          try {
            return fs.readlinkSync(path);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        }},stream_ops:{open:function (stream) {
          var path = NODEFS.realPath(stream.node);
          try {
            if (FS.isFile(stream.node.mode)) {
              stream.nfd = fs.openSync(path, NODEFS.flagsToPermissionString(stream.flags));
            }
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },close:function (stream) {
          try {
            if (FS.isFile(stream.node.mode) && stream.nfd) {
              fs.closeSync(stream.nfd);
            }
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },read:function (stream, buffer, offset, length, position) {
          // FIXME this is terrible.
          var nbuffer = new Buffer(length);
          var res;
          try {
            res = fs.readSync(stream.nfd, nbuffer, 0, length, position);
          } catch (e) {
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
          if (res > 0) {
            for (var i = 0; i < res; i++) {
              buffer[offset + i] = nbuffer[i];
            }
          }
          return res;
        },write:function (stream, buffer, offset, length, position) {
          // FIXME this is terrible.
          var nbuffer = new Buffer(buffer.subarray(offset, offset + length));
          var res;
          try {
            res = fs.writeSync(stream.nfd, nbuffer, 0, length, position);
          } catch (e) {
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
          return res;
        },llseek:function (stream, offset, whence) {
          var position = offset;
          if (whence === 1) {  // SEEK_CUR.
            position += stream.position;
          } else if (whence === 2) {  // SEEK_END.
            if (FS.isFile(stream.node.mode)) {
              try {
                var stat = fs.fstatSync(stream.nfd);
                position += stat.size;
              } catch (e) {
                throw new FS.ErrnoError(ERRNO_CODES[e.code]);
              }
            }
          }
          if (position < 0) {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
          }
          stream.position = position;
          return position;
        }}};
  var _stdin=allocate(1, "i32*", ALLOC_STATIC);
  var _stdout=allocate(1, "i32*", ALLOC_STATIC);
  var _stderr=allocate(1, "i32*", ALLOC_STATIC);
  function _fflush(stream) {
      // int fflush(FILE *stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fflush.html
      // we don't currently perform any user-space buffering of data
    }var FS={root:null,mounts:[],devices:[null],streams:[null],nextInode:1,nameTable:null,currentPath:"/",initialized:false,ignorePermissions:true,ErrnoError:null,genericErrors:{},handleFSError:function (e) {
        if (!(e instanceof FS.ErrnoError)) throw e + ' : ' + stackTrace();
        return ___setErrNo(e.errno);
      },lookupPath:function (path, opts) {
        path = PATH.resolve(FS.cwd(), path);
        opts = opts || { recurse_count: 0 };
        if (opts.recurse_count > 8) {  // max recursive lookup of 8
          throw new FS.ErrnoError(ERRNO_CODES.ELOOP);
        }
        // split the path
        var parts = PATH.normalizeArray(path.split('/').filter(function(p) {
          return !!p;
        }), false);
        // start at the root
        var current = FS.root;
        var current_path = '/';
        for (var i = 0; i < parts.length; i++) {
          var islast = (i === parts.length-1);
          if (islast && opts.parent) {
            // stop resolving
            break;
          }
          current = FS.lookupNode(current, parts[i]);
          current_path = PATH.join2(current_path, parts[i]);
          // jump to the mount's root node if this is a mountpoint
          if (FS.isMountpoint(current)) {
            current = current.mount.root;
          }
          // follow symlinks
          // by default, lookupPath will not follow a symlink if it is the final path component.
          // setting opts.follow = true will override this behavior.
          if (!islast || opts.follow) {
            var count = 0;
            while (FS.isLink(current.mode)) {
              var link = FS.readlink(current_path);
              current_path = PATH.resolve(PATH.dirname(current_path), link);
              var lookup = FS.lookupPath(current_path, { recurse_count: opts.recurse_count });
              current = lookup.node;
              if (count++ > 40) {  // limit max consecutive symlinks to 40 (SYMLOOP_MAX).
                throw new FS.ErrnoError(ERRNO_CODES.ELOOP);
              }
            }
          }
        }
        return { path: current_path, node: current };
      },getPath:function (node) {
        var path;
        while (true) {
          if (FS.isRoot(node)) {
            var mount = node.mount.mountpoint;
            if (!path) return mount;
            return mount[mount.length-1] !== '/' ? mount + '/' + path : mount + path;
          }
          path = path ? node.name + '/' + path : node.name;
          node = node.parent;
        }
      },hashName:function (parentid, name) {
        var hash = 0;
        for (var i = 0; i < name.length; i++) {
          hash = ((hash << 5) - hash + name.charCodeAt(i)) | 0;
        }
        return ((parentid + hash) >>> 0) % FS.nameTable.length;
      },hashAddNode:function (node) {
        var hash = FS.hashName(node.parent.id, node.name);
        node.name_next = FS.nameTable[hash];
        FS.nameTable[hash] = node;
      },hashRemoveNode:function (node) {
        var hash = FS.hashName(node.parent.id, node.name);
        if (FS.nameTable[hash] === node) {
          FS.nameTable[hash] = node.name_next;
        } else {
          var current = FS.nameTable[hash];
          while (current) {
            if (current.name_next === node) {
              current.name_next = node.name_next;
              break;
            }
            current = current.name_next;
          }
        }
      },lookupNode:function (parent, name) {
        var err = FS.mayLookup(parent);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        var hash = FS.hashName(parent.id, name);
        for (var node = FS.nameTable[hash]; node; node = node.name_next) {
          var nodeName = node.name;
          if (node.parent.id === parent.id && nodeName === name) {
            return node;
          }
        }
        // if we failed to find it in the cache, call into the VFS
        return FS.lookup(parent, name);
      },createNode:function (parent, name, mode, rdev) {
        if (!FS.FSNode) {
          FS.FSNode = function(parent, name, mode, rdev) {
            this.id = FS.nextInode++;
            this.name = name;
            this.mode = mode;
            this.node_ops = {};
            this.stream_ops = {};
            this.rdev = rdev;
            this.parent = null;
            this.mount = null;
            if (!parent) {
              parent = this;  // root node sets parent to itself
            }
            this.parent = parent;
            this.mount = parent.mount;
            FS.hashAddNode(this);
          };
          // compatibility
          var readMode = 292 | 73;
          var writeMode = 146;
          FS.FSNode.prototype = {};
          // NOTE we must use Object.defineProperties instead of individual calls to
          // Object.defineProperty in order to make closure compiler happy
          Object.defineProperties(FS.FSNode.prototype, {
            read: {
              get: function() { return (this.mode & readMode) === readMode; },
              set: function(val) { val ? this.mode |= readMode : this.mode &= ~readMode; }
            },
            write: {
              get: function() { return (this.mode & writeMode) === writeMode; },
              set: function(val) { val ? this.mode |= writeMode : this.mode &= ~writeMode; }
            },
            isFolder: {
              get: function() { return FS.isDir(this.mode); },
            },
            isDevice: {
              get: function() { return FS.isChrdev(this.mode); },
            },
          });
        }
        return new FS.FSNode(parent, name, mode, rdev);
      },destroyNode:function (node) {
        FS.hashRemoveNode(node);
      },isRoot:function (node) {
        return node === node.parent;
      },isMountpoint:function (node) {
        return node.mounted;
      },isFile:function (mode) {
        return (mode & 61440) === 32768;
      },isDir:function (mode) {
        return (mode & 61440) === 16384;
      },isLink:function (mode) {
        return (mode & 61440) === 40960;
      },isChrdev:function (mode) {
        return (mode & 61440) === 8192;
      },isBlkdev:function (mode) {
        return (mode & 61440) === 24576;
      },isFIFO:function (mode) {
        return (mode & 61440) === 4096;
      },isSocket:function (mode) {
        return (mode & 49152) === 49152;
      },flagModes:{"r":0,"rs":1052672,"r+":2,"w":577,"wx":705,"xw":705,"w+":578,"wx+":706,"xw+":706,"a":1089,"ax":1217,"xa":1217,"a+":1090,"ax+":1218,"xa+":1218},modeStringToFlags:function (str) {
        var flags = FS.flagModes[str];
        if (typeof flags === 'undefined') {
          throw new Error('Unknown file open mode: ' + str);
        }
        return flags;
      },flagsToPermissionString:function (flag) {
        var accmode = flag & 2097155;
        var perms = ['r', 'w', 'rw'][accmode];
        if ((flag & 512)) {
          perms += 'w';
        }
        return perms;
      },nodePermissions:function (node, perms) {
        if (FS.ignorePermissions) {
          return 0;
        }
        // return 0 if any user, group or owner bits are set.
        if (perms.indexOf('r') !== -1 && !(node.mode & 292)) {
          return ERRNO_CODES.EACCES;
        } else if (perms.indexOf('w') !== -1 && !(node.mode & 146)) {
          return ERRNO_CODES.EACCES;
        } else if (perms.indexOf('x') !== -1 && !(node.mode & 73)) {
          return ERRNO_CODES.EACCES;
        }
        return 0;
      },mayLookup:function (dir) {
        return FS.nodePermissions(dir, 'x');
      },mayCreate:function (dir, name) {
        try {
          var node = FS.lookupNode(dir, name);
          return ERRNO_CODES.EEXIST;
        } catch (e) {
        }
        return FS.nodePermissions(dir, 'wx');
      },mayDelete:function (dir, name, isdir) {
        var node;
        try {
          node = FS.lookupNode(dir, name);
        } catch (e) {
          return e.errno;
        }
        var err = FS.nodePermissions(dir, 'wx');
        if (err) {
          return err;
        }
        if (isdir) {
          if (!FS.isDir(node.mode)) {
            return ERRNO_CODES.ENOTDIR;
          }
          if (FS.isRoot(node) || FS.getPath(node) === FS.cwd()) {
            return ERRNO_CODES.EBUSY;
          }
        } else {
          if (FS.isDir(node.mode)) {
            return ERRNO_CODES.EISDIR;
          }
        }
        return 0;
      },mayOpen:function (node, flags) {
        if (!node) {
          return ERRNO_CODES.ENOENT;
        }
        if (FS.isLink(node.mode)) {
          return ERRNO_CODES.ELOOP;
        } else if (FS.isDir(node.mode)) {
          if ((flags & 2097155) !== 0 ||  // opening for write
              (flags & 512)) {
            return ERRNO_CODES.EISDIR;
          }
        }
        return FS.nodePermissions(node, FS.flagsToPermissionString(flags));
      },MAX_OPEN_FDS:4096,nextfd:function (fd_start, fd_end) {
        fd_start = fd_start || 1;
        fd_end = fd_end || FS.MAX_OPEN_FDS;
        for (var fd = fd_start; fd <= fd_end; fd++) {
          if (!FS.streams[fd]) {
            return fd;
          }
        }
        throw new FS.ErrnoError(ERRNO_CODES.EMFILE);
      },getStream:function (fd) {
        return FS.streams[fd];
      },createStream:function (stream, fd_start, fd_end) {
        if (!FS.FSStream) {
          FS.FSStream = function(){};
          FS.FSStream.prototype = {};
          // compatibility
          Object.defineProperties(FS.FSStream.prototype, {
            object: {
              get: function() { return this.node; },
              set: function(val) { this.node = val; }
            },
            isRead: {
              get: function() { return (this.flags & 2097155) !== 1; }
            },
            isWrite: {
              get: function() { return (this.flags & 2097155) !== 0; }
            },
            isAppend: {
              get: function() { return (this.flags & 1024); }
            }
          });
        }
        if (stream.__proto__) {
          // reuse the object
          stream.__proto__ = FS.FSStream.prototype;
        } else {
          var newStream = new FS.FSStream();
          for (var p in stream) {
            newStream[p] = stream[p];
          }
          stream = newStream;
        }
        var fd = FS.nextfd(fd_start, fd_end);
        stream.fd = fd;
        FS.streams[fd] = stream;
        return stream;
      },closeStream:function (fd) {
        FS.streams[fd] = null;
      },chrdev_stream_ops:{open:function (stream) {
          var device = FS.getDevice(stream.node.rdev);
          // override node's stream ops with the device's
          stream.stream_ops = device.stream_ops;
          // forward the open call
          if (stream.stream_ops.open) {
            stream.stream_ops.open(stream);
          }
        },llseek:function () {
          throw new FS.ErrnoError(ERRNO_CODES.ESPIPE);
        }},major:function (dev) {
        return ((dev) >> 8);
      },minor:function (dev) {
        return ((dev) & 0xff);
      },makedev:function (ma, mi) {
        return ((ma) << 8 | (mi));
      },registerDevice:function (dev, ops) {
        FS.devices[dev] = { stream_ops: ops };
      },getDevice:function (dev) {
        return FS.devices[dev];
      },syncfs:function (populate, callback) {
        if (typeof(populate) === 'function') {
          callback = populate;
          populate = false;
        }
        var completed = 0;
        var total = FS.mounts.length;
        function done(err) {
          if (err) {
            return callback(err);
          }
          if (++completed >= total) {
            callback(null);
          }
        };
        // sync all mounts
        for (var i = 0; i < FS.mounts.length; i++) {
          var mount = FS.mounts[i];
          if (!mount.type.syncfs) {
            done(null);
            continue;
          }
          mount.type.syncfs(mount, populate, done);
        }
      },mount:function (type, opts, mountpoint) {
        var lookup;
        if (mountpoint) {
          lookup = FS.lookupPath(mountpoint, { follow: false });
          mountpoint = lookup.path;  // use the absolute path
        }
        var mount = {
          type: type,
          opts: opts,
          mountpoint: mountpoint,
          root: null
        };
        // create a root node for the fs
        var root = type.mount(mount);
        root.mount = mount;
        mount.root = root;
        // assign the mount info to the mountpoint's node
        if (lookup) {
          lookup.node.mount = mount;
          lookup.node.mounted = true;
          // compatibility update FS.root if we mount to /
          if (mountpoint === '/') {
            FS.root = mount.root;
          }
        }
        // add to our cached list of mounts
        FS.mounts.push(mount);
        return root;
      },lookup:function (parent, name) {
        return parent.node_ops.lookup(parent, name);
      },mknod:function (path, mode, dev) {
        var lookup = FS.lookupPath(path, { parent: true });
        var parent = lookup.node;
        var name = PATH.basename(path);
        var err = FS.mayCreate(parent, name);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        if (!parent.node_ops.mknod) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        return parent.node_ops.mknod(parent, name, mode, dev);
      },create:function (path, mode) {
        mode = mode !== undefined ? mode : 0666;
        mode &= 4095;
        mode |= 32768;
        return FS.mknod(path, mode, 0);
      },mkdir:function (path, mode) {
        mode = mode !== undefined ? mode : 0777;
        mode &= 511 | 512;
        mode |= 16384;
        return FS.mknod(path, mode, 0);
      },mkdev:function (path, mode, dev) {
        if (typeof(dev) === 'undefined') {
          dev = mode;
          mode = 0666;
        }
        mode |= 8192;
        return FS.mknod(path, mode, dev);
      },symlink:function (oldpath, newpath) {
        var lookup = FS.lookupPath(newpath, { parent: true });
        var parent = lookup.node;
        var newname = PATH.basename(newpath);
        var err = FS.mayCreate(parent, newname);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        if (!parent.node_ops.symlink) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        return parent.node_ops.symlink(parent, newname, oldpath);
      },rename:function (old_path, new_path) {
        var old_dirname = PATH.dirname(old_path);
        var new_dirname = PATH.dirname(new_path);
        var old_name = PATH.basename(old_path);
        var new_name = PATH.basename(new_path);
        // parents must exist
        var lookup, old_dir, new_dir;
        try {
          lookup = FS.lookupPath(old_path, { parent: true });
          old_dir = lookup.node;
          lookup = FS.lookupPath(new_path, { parent: true });
          new_dir = lookup.node;
        } catch (e) {
          throw new FS.ErrnoError(ERRNO_CODES.EBUSY);
        }
        // need to be part of the same mount
        if (old_dir.mount !== new_dir.mount) {
          throw new FS.ErrnoError(ERRNO_CODES.EXDEV);
        }
        // source must exist
        var old_node = FS.lookupNode(old_dir, old_name);
        // old path should not be an ancestor of the new path
        var relative = PATH.relative(old_path, new_dirname);
        if (relative.charAt(0) !== '.') {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        // new path should not be an ancestor of the old path
        relative = PATH.relative(new_path, old_dirname);
        if (relative.charAt(0) !== '.') {
          throw new FS.ErrnoError(ERRNO_CODES.ENOTEMPTY);
        }
        // see if the new path already exists
        var new_node;
        try {
          new_node = FS.lookupNode(new_dir, new_name);
        } catch (e) {
          // not fatal
        }
        // early out if nothing needs to change
        if (old_node === new_node) {
          return;
        }
        // we'll need to delete the old entry
        var isdir = FS.isDir(old_node.mode);
        var err = FS.mayDelete(old_dir, old_name, isdir);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        // need delete permissions if we'll be overwriting.
        // need create permissions if new doesn't already exist.
        err = new_node ?
          FS.mayDelete(new_dir, new_name, isdir) :
          FS.mayCreate(new_dir, new_name);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        if (!old_dir.node_ops.rename) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        if (FS.isMountpoint(old_node) || (new_node && FS.isMountpoint(new_node))) {
          throw new FS.ErrnoError(ERRNO_CODES.EBUSY);
        }
        // if we are going to change the parent, check write permissions
        if (new_dir !== old_dir) {
          err = FS.nodePermissions(old_dir, 'w');
          if (err) {
            throw new FS.ErrnoError(err);
          }
        }
        // remove the node from the lookup hash
        FS.hashRemoveNode(old_node);
        // do the underlying fs rename
        try {
          old_dir.node_ops.rename(old_node, new_dir, new_name);
        } catch (e) {
          throw e;
        } finally {
          // add the node back to the hash (in case node_ops.rename
          // changed its name)
          FS.hashAddNode(old_node);
        }
      },rmdir:function (path) {
        var lookup = FS.lookupPath(path, { parent: true });
        var parent = lookup.node;
        var name = PATH.basename(path);
        var node = FS.lookupNode(parent, name);
        var err = FS.mayDelete(parent, name, true);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        if (!parent.node_ops.rmdir) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        if (FS.isMountpoint(node)) {
          throw new FS.ErrnoError(ERRNO_CODES.EBUSY);
        }
        parent.node_ops.rmdir(parent, name);
        FS.destroyNode(node);
      },readdir:function (path) {
        var lookup = FS.lookupPath(path, { follow: true });
        var node = lookup.node;
        if (!node.node_ops.readdir) {
          throw new FS.ErrnoError(ERRNO_CODES.ENOTDIR);
        }
        return node.node_ops.readdir(node);
      },unlink:function (path) {
        var lookup = FS.lookupPath(path, { parent: true });
        var parent = lookup.node;
        var name = PATH.basename(path);
        var node = FS.lookupNode(parent, name);
        var err = FS.mayDelete(parent, name, false);
        if (err) {
          // POSIX says unlink should set EPERM, not EISDIR
          if (err === ERRNO_CODES.EISDIR) err = ERRNO_CODES.EPERM;
          throw new FS.ErrnoError(err);
        }
        if (!parent.node_ops.unlink) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        if (FS.isMountpoint(node)) {
          throw new FS.ErrnoError(ERRNO_CODES.EBUSY);
        }
        parent.node_ops.unlink(parent, name);
        FS.destroyNode(node);
      },readlink:function (path) {
        var lookup = FS.lookupPath(path, { follow: false });
        var link = lookup.node;
        if (!link.node_ops.readlink) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        return link.node_ops.readlink(link);
      },stat:function (path, dontFollow) {
        var lookup = FS.lookupPath(path, { follow: !dontFollow });
        var node = lookup.node;
        if (!node.node_ops.getattr) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        return node.node_ops.getattr(node);
      },lstat:function (path) {
        return FS.stat(path, true);
      },chmod:function (path, mode, dontFollow) {
        var node;
        if (typeof path === 'string') {
          var lookup = FS.lookupPath(path, { follow: !dontFollow });
          node = lookup.node;
        } else {
          node = path;
        }
        if (!node.node_ops.setattr) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        node.node_ops.setattr(node, {
          mode: (mode & 4095) | (node.mode & ~4095),
          timestamp: Date.now()
        });
      },lchmod:function (path, mode) {
        FS.chmod(path, mode, true);
      },fchmod:function (fd, mode) {
        var stream = FS.getStream(fd);
        if (!stream) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        FS.chmod(stream.node, mode);
      },chown:function (path, uid, gid, dontFollow) {
        var node;
        if (typeof path === 'string') {
          var lookup = FS.lookupPath(path, { follow: !dontFollow });
          node = lookup.node;
        } else {
          node = path;
        }
        if (!node.node_ops.setattr) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        node.node_ops.setattr(node, {
          timestamp: Date.now()
          // we ignore the uid / gid for now
        });
      },lchown:function (path, uid, gid) {
        FS.chown(path, uid, gid, true);
      },fchown:function (fd, uid, gid) {
        var stream = FS.getStream(fd);
        if (!stream) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        FS.chown(stream.node, uid, gid);
      },truncate:function (path, len) {
        if (len < 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        var node;
        if (typeof path === 'string') {
          var lookup = FS.lookupPath(path, { follow: true });
          node = lookup.node;
        } else {
          node = path;
        }
        if (!node.node_ops.setattr) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        if (FS.isDir(node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.EISDIR);
        }
        if (!FS.isFile(node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        var err = FS.nodePermissions(node, 'w');
        if (err) {
          throw new FS.ErrnoError(err);
        }
        node.node_ops.setattr(node, {
          size: len,
          timestamp: Date.now()
        });
      },ftruncate:function (fd, len) {
        var stream = FS.getStream(fd);
        if (!stream) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        if ((stream.flags & 2097155) === 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        FS.truncate(stream.node, len);
      },utime:function (path, atime, mtime) {
        var lookup = FS.lookupPath(path, { follow: true });
        var node = lookup.node;
        node.node_ops.setattr(node, {
          timestamp: Math.max(atime, mtime)
        });
      },open:function (path, flags, mode, fd_start, fd_end) {
        flags = typeof flags === 'string' ? FS.modeStringToFlags(flags) : flags;
        mode = typeof mode === 'undefined' ? 0666 : mode;
        if ((flags & 64)) {
          mode = (mode & 4095) | 32768;
        } else {
          mode = 0;
        }
        var node;
        if (typeof path === 'object') {
          node = path;
        } else {
          path = PATH.normalize(path);
          try {
            var lookup = FS.lookupPath(path, {
              follow: !(flags & 131072)
            });
            node = lookup.node;
          } catch (e) {
            // ignore
          }
        }
        // perhaps we need to create the node
        if ((flags & 64)) {
          if (node) {
            // if O_CREAT and O_EXCL are set, error out if the node already exists
            if ((flags & 128)) {
              throw new FS.ErrnoError(ERRNO_CODES.EEXIST);
            }
          } else {
            // node doesn't exist, try to create it
            node = FS.mknod(path, mode, 0);
          }
        }
        if (!node) {
          throw new FS.ErrnoError(ERRNO_CODES.ENOENT);
        }
        // can't truncate a device
        if (FS.isChrdev(node.mode)) {
          flags &= ~512;
        }
        // check permissions
        var err = FS.mayOpen(node, flags);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        // do truncation if necessary
        if ((flags & 512)) {
          FS.truncate(node, 0);
        }
        // we've already handled these, don't pass down to the underlying vfs
        flags &= ~(128 | 512);
        // register the stream with the filesystem
        var stream = FS.createStream({
          node: node,
          path: FS.getPath(node),  // we want the absolute path to the node
          flags: flags,
          seekable: true,
          position: 0,
          stream_ops: node.stream_ops,
          // used by the file family libc calls (fopen, fwrite, ferror, etc.)
          ungotten: [],
          error: false
        }, fd_start, fd_end);
        // call the new stream's open function
        if (stream.stream_ops.open) {
          stream.stream_ops.open(stream);
        }
        if (Module['logReadFiles'] && !(flags & 1)) {
          if (!FS.readFiles) FS.readFiles = {};
          if (!(path in FS.readFiles)) {
            FS.readFiles[path] = 1;
            Module['printErr']('read file: ' + path);
          }
        }
        return stream;
      },close:function (stream) {
        try {
          if (stream.stream_ops.close) {
            stream.stream_ops.close(stream);
          }
        } catch (e) {
          throw e;
        } finally {
          FS.closeStream(stream.fd);
        }
      },llseek:function (stream, offset, whence) {
        if (!stream.seekable || !stream.stream_ops.llseek) {
          throw new FS.ErrnoError(ERRNO_CODES.ESPIPE);
        }
        return stream.stream_ops.llseek(stream, offset, whence);
      },read:function (stream, buffer, offset, length, position) {
        if (length < 0 || position < 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        if ((stream.flags & 2097155) === 1) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        if (FS.isDir(stream.node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.EISDIR);
        }
        if (!stream.stream_ops.read) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        var seeking = true;
        if (typeof position === 'undefined') {
          position = stream.position;
          seeking = false;
        } else if (!stream.seekable) {
          throw new FS.ErrnoError(ERRNO_CODES.ESPIPE);
        }
        var bytesRead = stream.stream_ops.read(stream, buffer, offset, length, position);
        if (!seeking) stream.position += bytesRead;
        return bytesRead;
      },write:function (stream, buffer, offset, length, position, canOwn) {
        if (length < 0 || position < 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        if ((stream.flags & 2097155) === 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        if (FS.isDir(stream.node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.EISDIR);
        }
        if (!stream.stream_ops.write) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        var seeking = true;
        if (typeof position === 'undefined') {
          position = stream.position;
          seeking = false;
        } else if (!stream.seekable) {
          throw new FS.ErrnoError(ERRNO_CODES.ESPIPE);
        }
        if (stream.flags & 1024) {
          // seek to the end before writing in append mode
          FS.llseek(stream, 0, 2);
        }
        var bytesWritten = stream.stream_ops.write(stream, buffer, offset, length, position, canOwn);
        if (!seeking) stream.position += bytesWritten;
        return bytesWritten;
      },allocate:function (stream, offset, length) {
        if (offset < 0 || length <= 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        if ((stream.flags & 2097155) === 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        if (!FS.isFile(stream.node.mode) && !FS.isDir(node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.ENODEV);
        }
        if (!stream.stream_ops.allocate) {
          throw new FS.ErrnoError(ERRNO_CODES.EOPNOTSUPP);
        }
        stream.stream_ops.allocate(stream, offset, length);
      },mmap:function (stream, buffer, offset, length, position, prot, flags) {
        // TODO if PROT is PROT_WRITE, make sure we have write access
        if ((stream.flags & 2097155) === 1) {
          throw new FS.ErrnoError(ERRNO_CODES.EACCES);
        }
        if (!stream.stream_ops.mmap) {
          throw new FS.errnoError(ERRNO_CODES.ENODEV);
        }
        return stream.stream_ops.mmap(stream, buffer, offset, length, position, prot, flags);
      },ioctl:function (stream, cmd, arg) {
        if (!stream.stream_ops.ioctl) {
          throw new FS.ErrnoError(ERRNO_CODES.ENOTTY);
        }
        return stream.stream_ops.ioctl(stream, cmd, arg);
      },readFile:function (path, opts) {
        opts = opts || {};
        opts.flags = opts.flags || 'r';
        opts.encoding = opts.encoding || 'binary';
        var ret;
        var stream = FS.open(path, opts.flags);
        var stat = FS.stat(path);
        var length = stat.size;
        var buf = new Uint8Array(length);
        FS.read(stream, buf, 0, length, 0);
        if (opts.encoding === 'utf8') {
          ret = '';
          var utf8 = new Runtime.UTF8Processor();
          for (var i = 0; i < length; i++) {
            ret += utf8.processCChar(buf[i]);
          }
        } else if (opts.encoding === 'binary') {
          ret = buf;
        } else {
          throw new Error('Invalid encoding type "' + opts.encoding + '"');
        }
        FS.close(stream);
        return ret;
      },writeFile:function (path, data, opts) {
        opts = opts || {};
        opts.flags = opts.flags || 'w';
        opts.encoding = opts.encoding || 'utf8';
        var stream = FS.open(path, opts.flags, opts.mode);
        if (opts.encoding === 'utf8') {
          var utf8 = new Runtime.UTF8Processor();
          var buf = new Uint8Array(utf8.processJSString(data));
          FS.write(stream, buf, 0, buf.length, 0);
        } else if (opts.encoding === 'binary') {
          FS.write(stream, data, 0, data.length, 0);
        } else {
          throw new Error('Invalid encoding type "' + opts.encoding + '"');
        }
        FS.close(stream);
      },cwd:function () {
        return FS.currentPath;
      },chdir:function (path) {
        var lookup = FS.lookupPath(path, { follow: true });
        if (!FS.isDir(lookup.node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.ENOTDIR);
        }
        var err = FS.nodePermissions(lookup.node, 'x');
        if (err) {
          throw new FS.ErrnoError(err);
        }
        FS.currentPath = lookup.path;
      },createDefaultDirectories:function () {
        FS.mkdir('/tmp');
      },createDefaultDevices:function () {
        // create /dev
        FS.mkdir('/dev');
        // setup /dev/null
        FS.registerDevice(FS.makedev(1, 3), {
          read: function() { return 0; },
          write: function() { return 0; }
        });
        FS.mkdev('/dev/null', FS.makedev(1, 3));
        // setup /dev/tty and /dev/tty1
        // stderr needs to print output using Module['printErr']
        // so we register a second tty just for it.
        TTY.register(FS.makedev(5, 0), TTY.default_tty_ops);
        TTY.register(FS.makedev(6, 0), TTY.default_tty1_ops);
        FS.mkdev('/dev/tty', FS.makedev(5, 0));
        FS.mkdev('/dev/tty1', FS.makedev(6, 0));
        // we're not going to emulate the actual shm device,
        // just create the tmp dirs that reside in it commonly
        FS.mkdir('/dev/shm');
        FS.mkdir('/dev/shm/tmp');
      },createStandardStreams:function () {
        // TODO deprecate the old functionality of a single
        // input / output callback and that utilizes FS.createDevice
        // and instead require a unique set of stream ops
        // by default, we symlink the standard streams to the
        // default tty devices. however, if the standard streams
        // have been overwritten we create a unique device for
        // them instead.
        if (Module['stdin']) {
          FS.createDevice('/dev', 'stdin', Module['stdin']);
        } else {
          FS.symlink('/dev/tty', '/dev/stdin');
        }
        if (Module['stdout']) {
          FS.createDevice('/dev', 'stdout', null, Module['stdout']);
        } else {
          FS.symlink('/dev/tty', '/dev/stdout');
        }
        if (Module['stderr']) {
          FS.createDevice('/dev', 'stderr', null, Module['stderr']);
        } else {
          FS.symlink('/dev/tty1', '/dev/stderr');
        }
        // open default streams for the stdin, stdout and stderr devices
        var stdin = FS.open('/dev/stdin', 'r');
        HEAP32[((_stdin)>>2)]=stdin.fd;
        assert(stdin.fd === 1, 'invalid handle for stdin (' + stdin.fd + ')');
        var stdout = FS.open('/dev/stdout', 'w');
        HEAP32[((_stdout)>>2)]=stdout.fd;
        assert(stdout.fd === 2, 'invalid handle for stdout (' + stdout.fd + ')');
        var stderr = FS.open('/dev/stderr', 'w');
        HEAP32[((_stderr)>>2)]=stderr.fd;
        assert(stderr.fd === 3, 'invalid handle for stderr (' + stderr.fd + ')');
      },ensureErrnoError:function () {
        if (FS.ErrnoError) return;
        FS.ErrnoError = function ErrnoError(errno) {
          this.errno = errno;
          for (var key in ERRNO_CODES) {
            if (ERRNO_CODES[key] === errno) {
              this.code = key;
              break;
            }
          }
          this.message = ERRNO_MESSAGES[errno];
          this.stack = stackTrace();
        };
        FS.ErrnoError.prototype = new Error();
        FS.ErrnoError.prototype.constructor = FS.ErrnoError;
        // Some errors may happen quite a bit, to avoid overhead we reuse them (and suffer a lack of stack info)
        [ERRNO_CODES.ENOENT].forEach(function(code) {
          FS.genericErrors[code] = new FS.ErrnoError(code);
          FS.genericErrors[code].stack = '<generic error, no stack>';
        });
      },staticInit:function () {
        FS.ensureErrnoError();
        FS.nameTable = new Array(4096);
        FS.root = FS.createNode(null, '/', 16384 | 0777, 0);
        FS.mount(MEMFS, {}, '/');
        FS.createDefaultDirectories();
        FS.createDefaultDevices();
      },init:function (input, output, error) {
        assert(!FS.init.initialized, 'FS.init was previously called. If you want to initialize later with custom parameters, remove any earlier calls (note that one is automatically added to the generated code)');
        FS.init.initialized = true;
        FS.ensureErrnoError();
        // Allow Module.stdin etc. to provide defaults, if none explicitly passed to us here
        Module['stdin'] = input || Module['stdin'];
        Module['stdout'] = output || Module['stdout'];
        Module['stderr'] = error || Module['stderr'];
        FS.createStandardStreams();
      },quit:function () {
        FS.init.initialized = false;
        for (var i = 0; i < FS.streams.length; i++) {
          var stream = FS.streams[i];
          if (!stream) {
            continue;
          }
          FS.close(stream);
        }
      },getMode:function (canRead, canWrite) {
        var mode = 0;
        if (canRead) mode |= 292 | 73;
        if (canWrite) mode |= 146;
        return mode;
      },joinPath:function (parts, forceRelative) {
        var path = PATH.join.apply(null, parts);
        if (forceRelative && path[0] == '/') path = path.substr(1);
        return path;
      },absolutePath:function (relative, base) {
        return PATH.resolve(base, relative);
      },standardizePath:function (path) {
        return PATH.normalize(path);
      },findObject:function (path, dontResolveLastLink) {
        var ret = FS.analyzePath(path, dontResolveLastLink);
        if (ret.exists) {
          return ret.object;
        } else {
          ___setErrNo(ret.error);
          return null;
        }
      },analyzePath:function (path, dontResolveLastLink) {
        // operate from within the context of the symlink's target
        try {
          var lookup = FS.lookupPath(path, { follow: !dontResolveLastLink });
          path = lookup.path;
        } catch (e) {
        }
        var ret = {
          isRoot: false, exists: false, error: 0, name: null, path: null, object: null,
          parentExists: false, parentPath: null, parentObject: null
        };
        try {
          var lookup = FS.lookupPath(path, { parent: true });
          ret.parentExists = true;
          ret.parentPath = lookup.path;
          ret.parentObject = lookup.node;
          ret.name = PATH.basename(path);
          lookup = FS.lookupPath(path, { follow: !dontResolveLastLink });
          ret.exists = true;
          ret.path = lookup.path;
          ret.object = lookup.node;
          ret.name = lookup.node.name;
          ret.isRoot = lookup.path === '/';
        } catch (e) {
          ret.error = e.errno;
        };
        return ret;
      },createFolder:function (parent, name, canRead, canWrite) {
        var path = PATH.join2(typeof parent === 'string' ? parent : FS.getPath(parent), name);
        var mode = FS.getMode(canRead, canWrite);
        return FS.mkdir(path, mode);
      },createPath:function (parent, path, canRead, canWrite) {
        parent = typeof parent === 'string' ? parent : FS.getPath(parent);
        var parts = path.split('/').reverse();
        while (parts.length) {
          var part = parts.pop();
          if (!part) continue;
          var current = PATH.join2(parent, part);
          try {
            FS.mkdir(current);
          } catch (e) {
            // ignore EEXIST
          }
          parent = current;
        }
        return current;
      },createFile:function (parent, name, properties, canRead, canWrite) {
        var path = PATH.join2(typeof parent === 'string' ? parent : FS.getPath(parent), name);
        var mode = FS.getMode(canRead, canWrite);
        return FS.create(path, mode);
      },createDataFile:function (parent, name, data, canRead, canWrite, canOwn) {
        var path = name ? PATH.join2(typeof parent === 'string' ? parent : FS.getPath(parent), name) : parent;
        var mode = FS.getMode(canRead, canWrite);
        var node = FS.create(path, mode);
        if (data) {
          if (typeof data === 'string') {
            var arr = new Array(data.length);
            for (var i = 0, len = data.length; i < len; ++i) arr[i] = data.charCodeAt(i);
            data = arr;
          }
          // make sure we can write to the file
          FS.chmod(node, mode | 146);
          var stream = FS.open(node, 'w');
          FS.write(stream, data, 0, data.length, 0, canOwn);
          FS.close(stream);
          FS.chmod(node, mode);
        }
        return node;
      },createDevice:function (parent, name, input, output) {
        var path = PATH.join2(typeof parent === 'string' ? parent : FS.getPath(parent), name);
        var mode = FS.getMode(!!input, !!output);
        if (!FS.createDevice.major) FS.createDevice.major = 64;
        var dev = FS.makedev(FS.createDevice.major++, 0);
        // Create a fake device that a set of stream ops to emulate
        // the old behavior.
        FS.registerDevice(dev, {
          open: function(stream) {
            stream.seekable = false;
          },
          close: function(stream) {
            // flush any pending line data
            if (output && output.buffer && output.buffer.length) {
              output(10);
            }
          },
          read: function(stream, buffer, offset, length, pos /* ignored */) {
            var bytesRead = 0;
            for (var i = 0; i < length; i++) {
              var result;
              try {
                result = input();
              } catch (e) {
                throw new FS.ErrnoError(ERRNO_CODES.EIO);
              }
              if (result === undefined && bytesRead === 0) {
                throw new FS.ErrnoError(ERRNO_CODES.EAGAIN);
              }
              if (result === null || result === undefined) break;
              bytesRead++;
              buffer[offset+i] = result;
            }
            if (bytesRead) {
              stream.node.timestamp = Date.now();
            }
            return bytesRead;
          },
          write: function(stream, buffer, offset, length, pos) {
            for (var i = 0; i < length; i++) {
              try {
                output(buffer[offset+i]);
              } catch (e) {
                throw new FS.ErrnoError(ERRNO_CODES.EIO);
              }
            }
            if (length) {
              stream.node.timestamp = Date.now();
            }
            return i;
          }
        });
        return FS.mkdev(path, mode, dev);
      },createLink:function (parent, name, target, canRead, canWrite) {
        var path = PATH.join2(typeof parent === 'string' ? parent : FS.getPath(parent), name);
        return FS.symlink(target, path);
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
      },createLazyFile:function (parent, name, url, canRead, canWrite) {
        if (typeof XMLHttpRequest !== 'undefined') {
          if (!ENVIRONMENT_IS_WORKER) throw 'Cannot do synchronous binary XHRs outside webworkers in modern browsers. Use --embed-file or --preload-file in emcc';
          // Lazy chunked Uint8Array (implements get and length from Uint8Array). Actual getting is abstracted away for eventual reuse.
          function LazyUint8Array() {
            this.lengthKnown = false;
            this.chunks = []; // Loaded chunks. Index is the chunk number
          }
          LazyUint8Array.prototype.get = function LazyUint8Array_get(idx) {
            if (idx > this.length-1 || idx < 0) {
              return undefined;
            }
            var chunkOffset = idx % this.chunkSize;
            var chunkNum = Math.floor(idx / this.chunkSize);
            return this.getter(chunkNum)[chunkOffset];
          }
          LazyUint8Array.prototype.setDataGetter = function LazyUint8Array_setDataGetter(getter) {
            this.getter = getter;
          }
          LazyUint8Array.prototype.cacheLength = function LazyUint8Array_cacheLength() {
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
              var lazyArray = this;
              lazyArray.setDataGetter(function(chunkNum) {
                var start = chunkNum * chunkSize;
                var end = (chunkNum+1) * chunkSize - 1; // including this byte
                end = Math.min(end, datalength-1); // if datalength-1 is selected, this is the last block
                if (typeof(lazyArray.chunks[chunkNum]) === "undefined") {
                  lazyArray.chunks[chunkNum] = doXHR(start, end);
                }
                if (typeof(lazyArray.chunks[chunkNum]) === "undefined") throw new Error("doXHR failed!");
                return lazyArray.chunks[chunkNum];
              });
              this._length = datalength;
              this._chunkSize = chunkSize;
              this.lengthKnown = true;
          }
          var lazyArray = new LazyUint8Array();
          Object.defineProperty(lazyArray, "length", {
              get: function() {
                  if(!this.lengthKnown) {
                      this.cacheLength();
                  }
                  return this._length;
              }
          });
          Object.defineProperty(lazyArray, "chunkSize", {
              get: function() {
                  if(!this.lengthKnown) {
                      this.cacheLength();
                  }
                  return this._chunkSize;
              }
          });
          var properties = { isDevice: false, contents: lazyArray };
        } else {
          var properties = { isDevice: false, url: url };
        }
        var node = FS.createFile(parent, name, properties, canRead, canWrite);
        // This is a total hack, but I want to get this lazy file code out of the
        // core of MEMFS. If we want to keep this lazy file concept I feel it should
        // be its own thin LAZYFS proxying calls to MEMFS.
        if (properties.contents) {
          node.contents = properties.contents;
        } else if (properties.url) {
          node.contents = null;
          node.url = properties.url;
        }
        // override each stream op with one that tries to force load the lazy file first
        var stream_ops = {};
        var keys = Object.keys(node.stream_ops);
        keys.forEach(function(key) {
          var fn = node.stream_ops[key];
          stream_ops[key] = function forceLoadLazyFile() {
            if (!FS.forceLoadFile(node)) {
              throw new FS.ErrnoError(ERRNO_CODES.EIO);
            }
            return fn.apply(null, arguments);
          };
        });
        // use a custom read function
        stream_ops.read = function stream_ops_read(stream, buffer, offset, length, position) {
          if (!FS.forceLoadFile(node)) {
            throw new FS.ErrnoError(ERRNO_CODES.EIO);
          }
          var contents = stream.node.contents;
          if (position >= contents.length)
            return 0;
          var size = Math.min(contents.length - position, length);
          assert(size >= 0);
          if (contents.slice) { // normal array
            for (var i = 0; i < size; i++) {
              buffer[offset + i] = contents[position + i];
            }
          } else {
            for (var i = 0; i < size; i++) { // LazyUint8Array from sync binary XHR
              buffer[offset + i] = contents.get(position + i);
            }
          }
          return size;
        };
        node.stream_ops = stream_ops;
        return node;
      },createPreloadedFile:function (parent, name, url, canRead, canWrite, onload, onerror, dontCreateFile, canOwn) {
        Browser.init();
        // TODO we should allow people to just pass in a complete filename instead
        // of parent and name being that we just join them anyways
        var fullname = name ? PATH.resolve(PATH.join2(parent, name)) : parent;
        function processData(byteArray) {
          function finish(byteArray) {
            if (!dontCreateFile) {
              FS.createDataFile(parent, name, byteArray, canRead, canWrite, canOwn);
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
      },indexedDB:function () {
        return window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
      },DB_NAME:function () {
        return 'EM_FS_' + window.location.pathname;
      },DB_VERSION:20,DB_STORE_NAME:"FILE_DATA",saveFilesToDB:function (paths, onload, onerror) {
        onload = onload || function(){};
        onerror = onerror || function(){};
        var indexedDB = FS.indexedDB();
        try {
          var openRequest = indexedDB.open(FS.DB_NAME(), FS.DB_VERSION);
        } catch (e) {
          return onerror(e);
        }
        openRequest.onupgradeneeded = function openRequest_onupgradeneeded() {
          console.log('creating db');
          var db = openRequest.result;
          db.createObjectStore(FS.DB_STORE_NAME);
        };
        openRequest.onsuccess = function openRequest_onsuccess() {
          var db = openRequest.result;
          var transaction = db.transaction([FS.DB_STORE_NAME], 'readwrite');
          var files = transaction.objectStore(FS.DB_STORE_NAME);
          var ok = 0, fail = 0, total = paths.length;
          function finish() {
            if (fail == 0) onload(); else onerror();
          }
          paths.forEach(function(path) {
            var putRequest = files.put(FS.analyzePath(path).object.contents, path);
            putRequest.onsuccess = function putRequest_onsuccess() { ok++; if (ok + fail == total) finish() };
            putRequest.onerror = function putRequest_onerror() { fail++; if (ok + fail == total) finish() };
          });
          transaction.onerror = onerror;
        };
        openRequest.onerror = onerror;
      },loadFilesFromDB:function (paths, onload, onerror) {
        onload = onload || function(){};
        onerror = onerror || function(){};
        var indexedDB = FS.indexedDB();
        try {
          var openRequest = indexedDB.open(FS.DB_NAME(), FS.DB_VERSION);
        } catch (e) {
          return onerror(e);
        }
        openRequest.onupgradeneeded = onerror; // no database to load from
        openRequest.onsuccess = function openRequest_onsuccess() {
          var db = openRequest.result;
          try {
            var transaction = db.transaction([FS.DB_STORE_NAME], 'readonly');
          } catch(e) {
            onerror(e);
            return;
          }
          var files = transaction.objectStore(FS.DB_STORE_NAME);
          var ok = 0, fail = 0, total = paths.length;
          function finish() {
            if (fail == 0) onload(); else onerror();
          }
          paths.forEach(function(path) {
            var getRequest = files.get(path);
            getRequest.onsuccess = function getRequest_onsuccess() {
              if (FS.analyzePath(path).exists) {
                FS.unlink(path);
              }
              FS.createDataFile(PATH.dirname(path), PATH.basename(path), getRequest.result, true, true, true);
              ok++;
              if (ok + fail == total) finish();
            };
            getRequest.onerror = function getRequest_onerror() { fail++; if (ok + fail == total) finish() };
          });
          transaction.onerror = onerror;
        };
        openRequest.onerror = onerror;
      }};
  var SOCKFS={mount:function (mount) {
        return FS.createNode(null, '/', 16384 | 0777, 0);
      },createSocket:function (family, type, protocol) {
        var streaming = type == 1;
        if (protocol) {
          assert(streaming == (protocol == 6)); // if SOCK_STREAM, must be tcp
        }
        // create our internal socket structure
        var sock = {
          family: family,
          type: type,
          protocol: protocol,
          server: null,
          peers: {},
          pending: [],
          recv_queue: [],
          sock_ops: SOCKFS.websocket_sock_ops
        };
        // create the filesystem node to store the socket structure
        var name = SOCKFS.nextname();
        var node = FS.createNode(SOCKFS.root, name, 49152, 0);
        node.sock = sock;
        // and the wrapping stream that enables library functions such
        // as read and write to indirectly interact with the socket
        var stream = FS.createStream({
          path: name,
          node: node,
          flags: FS.modeStringToFlags('r+'),
          seekable: false,
          stream_ops: SOCKFS.stream_ops
        });
        // map the new stream to the socket structure (sockets have a 1:1
        // relationship with a stream)
        sock.stream = stream;
        return sock;
      },getSocket:function (fd) {
        var stream = FS.getStream(fd);
        if (!stream || !FS.isSocket(stream.node.mode)) {
          return null;
        }
        return stream.node.sock;
      },stream_ops:{poll:function (stream) {
          var sock = stream.node.sock;
          return sock.sock_ops.poll(sock);
        },ioctl:function (stream, request, varargs) {
          var sock = stream.node.sock;
          return sock.sock_ops.ioctl(sock, request, varargs);
        },read:function (stream, buffer, offset, length, position /* ignored */) {
          var sock = stream.node.sock;
          var msg = sock.sock_ops.recvmsg(sock, length);
          if (!msg) {
            // socket is closed
            return 0;
          }
          buffer.set(msg.buffer, offset);
          return msg.buffer.length;
        },write:function (stream, buffer, offset, length, position /* ignored */) {
          var sock = stream.node.sock;
          return sock.sock_ops.sendmsg(sock, buffer, offset, length);
        },close:function (stream) {
          var sock = stream.node.sock;
          sock.sock_ops.close(sock);
        }},nextname:function () {
        if (!SOCKFS.nextname.current) {
          SOCKFS.nextname.current = 0;
        }
        return 'socket[' + (SOCKFS.nextname.current++) + ']';
      },websocket_sock_ops:{createPeer:function (sock, addr, port) {
          var ws;
          if (typeof addr === 'object') {
            ws = addr;
            addr = null;
            port = null;
          }
          if (ws) {
            // for sockets that've already connected (e.g. we're the server)
            // we can inspect the _socket property for the address
            if (ws._socket) {
              addr = ws._socket.remoteAddress;
              port = ws._socket.remotePort;
            }
            // if we're just now initializing a connection to the remote,
            // inspect the url property
            else {
              var result = /ws[s]?:\/\/([^:]+):(\d+)/.exec(ws.url);
              if (!result) {
                throw new Error('WebSocket URL must be in the format ws(s)://address:port');
              }
              addr = result[1];
              port = parseInt(result[2], 10);
            }
          } else {
            // create the actual websocket object and connect
            try {
              var url = 'ws://' + addr + ':' + port;
              // the node ws library API is slightly different than the browser's
              var opts = ENVIRONMENT_IS_NODE ? {headers: {'websocket-protocol': ['binary']}} : ['binary'];
              // If node we use the ws library.
              var WebSocket = ENVIRONMENT_IS_NODE ? require('ws') : window['WebSocket'];
              ws = new WebSocket(url, opts);
              ws.binaryType = 'arraybuffer';
            } catch (e) {
              throw new FS.ErrnoError(ERRNO_CODES.EHOSTUNREACH);
            }
          }
          var peer = {
            addr: addr,
            port: port,
            socket: ws,
            dgram_send_queue: []
          };
          SOCKFS.websocket_sock_ops.addPeer(sock, peer);
          SOCKFS.websocket_sock_ops.handlePeerEvents(sock, peer);
          // if this is a bound dgram socket, send the port number first to allow
          // us to override the ephemeral port reported to us by remotePort on the
          // remote end.
          if (sock.type === 2 && typeof sock.sport !== 'undefined') {
            peer.dgram_send_queue.push(new Uint8Array([
                255, 255, 255, 255,
                'p'.charCodeAt(0), 'o'.charCodeAt(0), 'r'.charCodeAt(0), 't'.charCodeAt(0),
                ((sock.sport & 0xff00) >> 8) , (sock.sport & 0xff)
            ]));
          }
          return peer;
        },getPeer:function (sock, addr, port) {
          return sock.peers[addr + ':' + port];
        },addPeer:function (sock, peer) {
          sock.peers[peer.addr + ':' + peer.port] = peer;
        },removePeer:function (sock, peer) {
          delete sock.peers[peer.addr + ':' + peer.port];
        },handlePeerEvents:function (sock, peer) {
          var first = true;
          var handleOpen = function () {
            try {
              var queued = peer.dgram_send_queue.shift();
              while (queued) {
                peer.socket.send(queued);
                queued = peer.dgram_send_queue.shift();
              }
            } catch (e) {
              // not much we can do here in the way of proper error handling as we've already
              // lied and said this data was sent. shut it down.
              peer.socket.close();
            }
          };
          function handleMessage(data) {
            assert(typeof data !== 'string' && data.byteLength !== undefined);  // must receive an ArrayBuffer
            data = new Uint8Array(data);  // make a typed array view on the array buffer
            // if this is the port message, override the peer's port with it
            var wasfirst = first;
            first = false;
            if (wasfirst &&
                data.length === 10 &&
                data[0] === 255 && data[1] === 255 && data[2] === 255 && data[3] === 255 &&
                data[4] === 'p'.charCodeAt(0) && data[5] === 'o'.charCodeAt(0) && data[6] === 'r'.charCodeAt(0) && data[7] === 't'.charCodeAt(0)) {
              // update the peer's port and it's key in the peer map
              var newport = ((data[8] << 8) | data[9]);
              SOCKFS.websocket_sock_ops.removePeer(sock, peer);
              peer.port = newport;
              SOCKFS.websocket_sock_ops.addPeer(sock, peer);
              return;
            }
            sock.recv_queue.push({ addr: peer.addr, port: peer.port, data: data });
          };
          if (ENVIRONMENT_IS_NODE) {
            peer.socket.on('open', handleOpen);
            peer.socket.on('message', function(data, flags) {
              if (!flags.binary) {
                return;
              }
              handleMessage((new Uint8Array(data)).buffer);  // copy from node Buffer -> ArrayBuffer
            });
            peer.socket.on('error', function() {
              // don't throw
            });
          } else {
            peer.socket.onopen = handleOpen;
            peer.socket.onmessage = function peer_socket_onmessage(event) {
              handleMessage(event.data);
            };
          }
        },poll:function (sock) {
          if (sock.type === 1 && sock.server) {
            // listen sockets should only say they're available for reading
            // if there are pending clients.
            return sock.pending.length ? (64 | 1) : 0;
          }
          var mask = 0;
          var dest = sock.type === 1 ?  // we only care about the socket state for connection-based sockets
            SOCKFS.websocket_sock_ops.getPeer(sock, sock.daddr, sock.dport) :
            null;
          if (sock.recv_queue.length ||
              !dest ||  // connection-less sockets are always ready to read
              (dest && dest.socket.readyState === dest.socket.CLOSING) ||
              (dest && dest.socket.readyState === dest.socket.CLOSED)) {  // let recv return 0 once closed
            mask |= (64 | 1);
          }
          if (!dest ||  // connection-less sockets are always ready to write
              (dest && dest.socket.readyState === dest.socket.OPEN)) {
            mask |= 4;
          }
          if ((dest && dest.socket.readyState === dest.socket.CLOSING) ||
              (dest && dest.socket.readyState === dest.socket.CLOSED)) {
            mask |= 16;
          }
          return mask;
        },ioctl:function (sock, request, arg) {
          switch (request) {
            case 21531:
              var bytes = 0;
              if (sock.recv_queue.length) {
                bytes = sock.recv_queue[0].data.length;
              }
              HEAP32[((arg)>>2)]=bytes;
              return 0;
            default:
              return ERRNO_CODES.EINVAL;
          }
        },close:function (sock) {
          // if we've spawned a listen server, close it
          if (sock.server) {
            try {
              sock.server.close();
            } catch (e) {
            }
            sock.server = null;
          }
          // close any peer connections
          var peers = Object.keys(sock.peers);
          for (var i = 0; i < peers.length; i++) {
            var peer = sock.peers[peers[i]];
            try {
              peer.socket.close();
            } catch (e) {
            }
            SOCKFS.websocket_sock_ops.removePeer(sock, peer);
          }
          return 0;
        },bind:function (sock, addr, port) {
          if (typeof sock.saddr !== 'undefined' || typeof sock.sport !== 'undefined') {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL);  // already bound
          }
          sock.saddr = addr;
          sock.sport = port || _mkport();
          // in order to emulate dgram sockets, we need to launch a listen server when
          // binding on a connection-less socket
          // note: this is only required on the server side
          if (sock.type === 2) {
            // close the existing server if it exists
            if (sock.server) {
              sock.server.close();
              sock.server = null;
            }
            // swallow error operation not supported error that occurs when binding in the
            // browser where this isn't supported
            try {
              sock.sock_ops.listen(sock, 0);
            } catch (e) {
              if (!(e instanceof FS.ErrnoError)) throw e;
              if (e.errno !== ERRNO_CODES.EOPNOTSUPP) throw e;
            }
          }
        },connect:function (sock, addr, port) {
          if (sock.server) {
            throw new FS.ErrnoError(ERRNO_CODS.EOPNOTSUPP);
          }
          // TODO autobind
          // if (!sock.addr && sock.type == 2) {
          // }
          // early out if we're already connected / in the middle of connecting
          if (typeof sock.daddr !== 'undefined' && typeof sock.dport !== 'undefined') {
            var dest = SOCKFS.websocket_sock_ops.getPeer(sock, sock.daddr, sock.dport);
            if (dest) {
              if (dest.socket.readyState === dest.socket.CONNECTING) {
                throw new FS.ErrnoError(ERRNO_CODES.EALREADY);
              } else {
                throw new FS.ErrnoError(ERRNO_CODES.EISCONN);
              }
            }
          }
          // add the socket to our peer list and set our
          // destination address / port to match
          var peer = SOCKFS.websocket_sock_ops.createPeer(sock, addr, port);
          sock.daddr = peer.addr;
          sock.dport = peer.port;
          // always "fail" in non-blocking mode
          throw new FS.ErrnoError(ERRNO_CODES.EINPROGRESS);
        },listen:function (sock, backlog) {
          if (!ENVIRONMENT_IS_NODE) {
            throw new FS.ErrnoError(ERRNO_CODES.EOPNOTSUPP);
          }
          if (sock.server) {
             throw new FS.ErrnoError(ERRNO_CODES.EINVAL);  // already listening
          }
          var WebSocketServer = require('ws').Server;
          var host = sock.saddr;
          sock.server = new WebSocketServer({
            host: host,
            port: sock.sport
            // TODO support backlog
          });
          sock.server.on('connection', function(ws) {
            if (sock.type === 1) {
              var newsock = SOCKFS.createSocket(sock.family, sock.type, sock.protocol);
              // create a peer on the new socket
              var peer = SOCKFS.websocket_sock_ops.createPeer(newsock, ws);
              newsock.daddr = peer.addr;
              newsock.dport = peer.port;
              // push to queue for accept to pick up
              sock.pending.push(newsock);
            } else {
              // create a peer on the listen socket so calling sendto
              // with the listen socket and an address will resolve
              // to the correct client
              SOCKFS.websocket_sock_ops.createPeer(sock, ws);
            }
          });
          sock.server.on('closed', function() {
            sock.server = null;
          });
          sock.server.on('error', function() {
            // don't throw
          });
        },accept:function (listensock) {
          if (!listensock.server) {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
          }
          var newsock = listensock.pending.shift();
          newsock.stream.flags = listensock.stream.flags;
          return newsock;
        },getname:function (sock, peer) {
          var addr, port;
          if (peer) {
            if (sock.daddr === undefined || sock.dport === undefined) {
              throw new FS.ErrnoError(ERRNO_CODES.ENOTCONN);
            }
            addr = sock.daddr;
            port = sock.dport;
          } else {
            // TODO saddr and sport will be set for bind()'d UDP sockets, but what
            // should we be returning for TCP sockets that've been connect()'d?
            addr = sock.saddr || 0;
            port = sock.sport || 0;
          }
          return { addr: addr, port: port };
        },sendmsg:function (sock, buffer, offset, length, addr, port) {
          if (sock.type === 2) {
            // connection-less sockets will honor the message address,
            // and otherwise fall back to the bound destination address
            if (addr === undefined || port === undefined) {
              addr = sock.daddr;
              port = sock.dport;
            }
            // if there was no address to fall back to, error out
            if (addr === undefined || port === undefined) {
              throw new FS.ErrnoError(ERRNO_CODES.EDESTADDRREQ);
            }
          } else {
            // connection-based sockets will only use the bound
            addr = sock.daddr;
            port = sock.dport;
          }
          // find the peer for the destination address
          var dest = SOCKFS.websocket_sock_ops.getPeer(sock, addr, port);
          // early out if not connected with a connection-based socket
          if (sock.type === 1) {
            if (!dest || dest.socket.readyState === dest.socket.CLOSING || dest.socket.readyState === dest.socket.CLOSED) {
              throw new FS.ErrnoError(ERRNO_CODES.ENOTCONN);
            } else if (dest.socket.readyState === dest.socket.CONNECTING) {
              throw new FS.ErrnoError(ERRNO_CODES.EAGAIN);
            }
          }
          // create a copy of the incoming data to send, as the WebSocket API
          // doesn't work entirely with an ArrayBufferView, it'll just send
          // the entire underlying buffer
          var data;
          if (buffer instanceof Array || buffer instanceof ArrayBuffer) {
            data = buffer.slice(offset, offset + length);
          } else {  // ArrayBufferView
            data = buffer.buffer.slice(buffer.byteOffset + offset, buffer.byteOffset + offset + length);
          }
          // if we're emulating a connection-less dgram socket and don't have
          // a cached connection, queue the buffer to send upon connect and
          // lie, saying the data was sent now.
          if (sock.type === 2) {
            if (!dest || dest.socket.readyState !== dest.socket.OPEN) {
              // if we're not connected, open a new connection
              if (!dest || dest.socket.readyState === dest.socket.CLOSING || dest.socket.readyState === dest.socket.CLOSED) {
                dest = SOCKFS.websocket_sock_ops.createPeer(sock, addr, port);
              }
              dest.dgram_send_queue.push(data);
              return length;
            }
          }
          try {
            // send the actual data
            dest.socket.send(data);
            return length;
          } catch (e) {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
          }
        },recvmsg:function (sock, length) {
          // http://pubs.opengroup.org/onlinepubs/7908799/xns/recvmsg.html
          if (sock.type === 1 && sock.server) {
            // tcp servers should not be recv()'ing on the listen socket
            throw new FS.ErrnoError(ERRNO_CODES.ENOTCONN);
          }
          var queued = sock.recv_queue.shift();
          if (!queued) {
            if (sock.type === 1) {
              var dest = SOCKFS.websocket_sock_ops.getPeer(sock, sock.daddr, sock.dport);
              if (!dest) {
                // if we have a destination address but are not connected, error out
                throw new FS.ErrnoError(ERRNO_CODES.ENOTCONN);
              }
              else if (dest.socket.readyState === dest.socket.CLOSING || dest.socket.readyState === dest.socket.CLOSED) {
                // return null if the socket has closed
                return null;
              }
              else {
                // else, our socket is in a valid state but truly has nothing available
                throw new FS.ErrnoError(ERRNO_CODES.EAGAIN);
              }
            } else {
              throw new FS.ErrnoError(ERRNO_CODES.EAGAIN);
            }
          }
          // queued.data will be an ArrayBuffer if it's unadulterated, but if it's
          // requeued TCP data it'll be an ArrayBufferView
          var queuedLength = queued.data.byteLength || queued.data.length;
          var queuedOffset = queued.data.byteOffset || 0;
          var queuedBuffer = queued.data.buffer || queued.data;
          var bytesRead = Math.min(length, queuedLength);
          var res = {
            buffer: new Uint8Array(queuedBuffer, queuedOffset, bytesRead),
            addr: queued.addr,
            port: queued.port
          };
          // push back any unread data for TCP connections
          if (sock.type === 1 && bytesRead < queuedLength) {
            var bytesRemaining = queuedLength - bytesRead;
            queued.data = new Uint8Array(queuedBuffer, queuedOffset + bytesRead, bytesRemaining);
            sock.recv_queue.unshift(queued);
          }
          return res;
        }}};function _recv(fd, buf, len, flags) {
      var sock = SOCKFS.getSocket(fd);
      if (!sock) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      }
      // TODO honor flags
      return _read(fd, buf, len);
    }
  function _pread(fildes, buf, nbyte, offset) {
      // ssize_t pread(int fildes, void *buf, size_t nbyte, off_t offset);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/read.html
      var stream = FS.getStream(fildes);
      if (!stream) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      }
      try {
        var slab = HEAP8;
        return FS.read(stream, slab, buf, nbyte, offset);
      } catch (e) {
        FS.handleFSError(e);
        return -1;
      }
    }function _read(fildes, buf, nbyte) {
      // ssize_t read(int fildes, void *buf, size_t nbyte);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/read.html
      var stream = FS.getStream(fildes);
      if (!stream) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      }
      try {
        var slab = HEAP8;
        return FS.read(stream, slab, buf, nbyte);
      } catch (e) {
        FS.handleFSError(e);
        return -1;
      }
    }function _fread(ptr, size, nitems, stream) {
      // size_t fread(void *restrict ptr, size_t size, size_t nitems, FILE *restrict stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fread.html
      var bytesToRead = nitems * size;
      if (bytesToRead == 0) {
        return 0;
      }
      var bytesRead = 0;
      var streamObj = FS.getStream(stream);
      while (streamObj.ungotten.length && bytesToRead > 0) {
        HEAP8[((ptr++)|0)]=streamObj.ungotten.pop()
        bytesToRead--;
        bytesRead++;
      }
      var err = _read(stream, ptr, bytesToRead);
      if (err == -1) {
        if (streamObj) streamObj.error = true;
        return 0;
      }
      bytesRead += err;
      if (bytesRead < bytesToRead) streamObj.eof = true;
      return Math.floor(bytesRead / size);
    }
  function _ferror(stream) {
      // int ferror(FILE *stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/ferror.html
      stream = FS.getStream(stream);
      return Number(stream && stream.error);
    }
  function _feof(stream) {
      // int feof(FILE *stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/feof.html
      stream = FS.getStream(stream);
      return Number(stream && stream.eof);
    }
  function ___assert_fail(condition, filename, line, func) {
      ABORT = true;
      throw 'Assertion failed: ' + Pointer_stringify(condition) + ', at: ' + [filename ? Pointer_stringify(filename) : 'unknown filename', line, func ? Pointer_stringify(func) : 'unknown function'] + ' at ' + stackTrace();
    }
  function _send(fd, buf, len, flags) {
      var sock = SOCKFS.getSocket(fd);
      if (!sock) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      }
      // TODO honor flags
      return _write(fd, buf, len);
    }
  function _pwrite(fildes, buf, nbyte, offset) {
      // ssize_t pwrite(int fildes, const void *buf, size_t nbyte, off_t offset);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/write.html
      var stream = FS.getStream(fildes);
      if (!stream) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      }
      try {
        var slab = HEAP8;
        return FS.write(stream, slab, buf, nbyte, offset);
      } catch (e) {
        FS.handleFSError(e);
        return -1;
      }
    }function _write(fildes, buf, nbyte) {
      // ssize_t write(int fildes, const void *buf, size_t nbyte);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/write.html
      var stream = FS.getStream(fildes);
      if (!stream) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      }
      try {
        var slab = HEAP8;
        return FS.write(stream, slab, buf, nbyte);
      } catch (e) {
        FS.handleFSError(e);
        return -1;
      }
    }function _fwrite(ptr, size, nitems, stream) {
      // size_t fwrite(const void *restrict ptr, size_t size, size_t nitems, FILE *restrict stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fwrite.html
      var bytesToWrite = nitems * size;
      if (bytesToWrite == 0) return 0;
      var bytesWritten = _write(stream, ptr, bytesToWrite);
      if (bytesWritten == -1) {
        var streamObj = FS.getStream(stream);
        if (streamObj) streamObj.error = true;
        return 0;
      } else {
        return Math.floor(bytesWritten / size);
      }
    }
  function _open(path, oflag, varargs) {
      // int open(const char *path, int oflag, ...);
      // http://pubs.opengroup.org/onlinepubs/009695399/functions/open.html
      var mode = HEAP32[((varargs)>>2)];
      path = Pointer_stringify(path);
      try {
        var stream = FS.open(path, oflag, mode);
        return stream.fd;
      } catch (e) {
        FS.handleFSError(e);
        return -1;
      }
    }function _fopen(filename, mode) {
      // FILE *fopen(const char *restrict filename, const char *restrict mode);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fopen.html
      var flags;
      mode = Pointer_stringify(mode);
      if (mode[0] == 'r') {
        if (mode.indexOf('+') != -1) {
          flags = 2;
        } else {
          flags = 0;
        }
      } else if (mode[0] == 'w') {
        if (mode.indexOf('+') != -1) {
          flags = 2;
        } else {
          flags = 1;
        }
        flags |= 64;
        flags |= 512;
      } else if (mode[0] == 'a') {
        if (mode.indexOf('+') != -1) {
          flags = 2;
        } else {
          flags = 1;
        }
        flags |= 64;
        flags |= 1024;
      } else {
        ___setErrNo(ERRNO_CODES.EINVAL);
        return 0;
      }
      var ret = _open(filename, flags, allocate([0x1FF, 0, 0, 0], 'i32', ALLOC_STACK));  // All creation permissions.
      return (ret == -1) ? 0 : ret;
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
      Module['abort']();
    }
  function ___errno_location() {
      return ___errno_state;
    }
  function _sbrk(bytes) {
      // Implement a Linux-like 'memory area' for our 'process'.
      // Changes the size of the memory area by |bytes|; returns the
      // address of the previous top ('break') of the memory area
      // We control the "dynamic" memory - DYNAMIC_BASE to DYNAMICTOP
      var self = _sbrk;
      if (!self.called) {
        DYNAMICTOP = alignMemoryPage(DYNAMICTOP); // make sure we start out aligned
        self.called = true;
        assert(Runtime.dynamicAlloc);
        self.alloc = Runtime.dynamicAlloc;
        Runtime.dynamicAlloc = function() { abort('cannot dynamically allocate, sbrk now has control') };
      }
      var ret = DYNAMICTOP;
      if (bytes != 0) self.alloc(bytes);
      return ret;  // Previous break location.
    }
  function _sysconf(name) {
      // long sysconf(int name);
      // http://pubs.opengroup.org/onlinepubs/009695399/functions/sysconf.html
      switch(name) {
        case 30: return PAGE_SIZE;
        case 132:
        case 133:
        case 12:
        case 137:
        case 138:
        case 15:
        case 235:
        case 16:
        case 17:
        case 18:
        case 19:
        case 20:
        case 149:
        case 13:
        case 10:
        case 236:
        case 153:
        case 9:
        case 21:
        case 22:
        case 159:
        case 154:
        case 14:
        case 77:
        case 78:
        case 139:
        case 80:
        case 81:
        case 79:
        case 82:
        case 68:
        case 67:
        case 164:
        case 11:
        case 29:
        case 47:
        case 48:
        case 95:
        case 52:
        case 51:
        case 46:
          return 200809;
        case 27:
        case 246:
        case 127:
        case 128:
        case 23:
        case 24:
        case 160:
        case 161:
        case 181:
        case 182:
        case 242:
        case 183:
        case 184:
        case 243:
        case 244:
        case 245:
        case 165:
        case 178:
        case 179:
        case 49:
        case 50:
        case 168:
        case 169:
        case 175:
        case 170:
        case 171:
        case 172:
        case 97:
        case 76:
        case 32:
        case 173:
        case 35:
          return -1;
        case 176:
        case 177:
        case 7:
        case 155:
        case 8:
        case 157:
        case 125:
        case 126:
        case 92:
        case 93:
        case 129:
        case 130:
        case 131:
        case 94:
        case 91:
          return 1;
        case 74:
        case 60:
        case 69:
        case 70:
        case 4:
          return 1024;
        case 31:
        case 42:
        case 72:
          return 32;
        case 87:
        case 26:
        case 33:
          return 2147483647;
        case 34:
        case 1:
          return 47839;
        case 38:
        case 36:
          return 99;
        case 43:
        case 37:
          return 2048;
        case 0: return 2097152;
        case 3: return 65536;
        case 28: return 32768;
        case 44: return 32767;
        case 75: return 16384;
        case 39: return 1000;
        case 89: return 700;
        case 71: return 256;
        case 40: return 255;
        case 2: return 100;
        case 180: return 64;
        case 25: return 20;
        case 5: return 16;
        case 6: return 6;
        case 73: return 4;
        case 84: return 1;
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
  function _strlen(ptr) {
      ptr = ptr|0;
      var curr = 0;
      curr = ptr;
      while (HEAP8[(curr)]) {
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
        if (!Module["preloadPlugins"]) Module["preloadPlugins"] = []; // needs to exist even in workers
        if (Browser.initted || ENVIRONMENT_IS_WORKER) return;
        Browser.initted = true;
        try {
          new Blob();
          Browser.hasBlobConstructor = true;
        } catch(e) {
          Browser.hasBlobConstructor = false;
          console.log("warning: no blob constructor, cannot create blobs with mimetypes");
        }
        Browser.BlobBuilder = typeof MozBlobBuilder != "undefined" ? MozBlobBuilder : (typeof WebKitBlobBuilder != "undefined" ? WebKitBlobBuilder : (!Browser.hasBlobConstructor ? console.log("warning: no BlobBuilder") : null));
        Browser.URLObject = typeof window != "undefined" ? (window.URL ? window.URL : window.webkitURL) : undefined;
        if (!Module.noImageDecoding && typeof Browser.URLObject === 'undefined') {
          console.log("warning: Browser does not support creating object URLs. Built-in browser image decoding will not be available.");
          Module.noImageDecoding = true;
        }
        // Support for plugins that can process preloaded files. You can add more of these to
        // your app by creating and appending to Module.preloadPlugins.
        //
        // Each plugin is asked if it can handle a file based on the file's name. If it can,
        // it is given the file's raw data. When it is done, it calls a callback with the file's
        // (possibly modified) data. For example, a plugin might decompress a file, or it
        // might create some side data structure for use later (like an Image element, etc.).
        var imagePlugin = {};
        imagePlugin['canHandle'] = function imagePlugin_canHandle(name) {
          return !Module.noImageDecoding && /\.(jpg|jpeg|png|bmp)$/i.test(name);
        };
        imagePlugin['handle'] = function imagePlugin_handle(byteArray, name, onload, onerror) {
          var b = null;
          if (Browser.hasBlobConstructor) {
            try {
              b = new Blob([byteArray], { type: Browser.getMimetype(name) });
              if (b.size !== byteArray.length) { // Safari bug #118630
                // Safari's Blob can only take an ArrayBuffer
                b = new Blob([(new Uint8Array(byteArray)).buffer], { type: Browser.getMimetype(name) });
              }
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
          img.onload = function img_onload() {
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
          img.onerror = function img_onerror(event) {
            console.log('Image ' + url + ' could not be decoded');
            if (onerror) onerror();
          };
          img.src = url;
        };
        Module['preloadPlugins'].push(imagePlugin);
        var audioPlugin = {};
        audioPlugin['canHandle'] = function audioPlugin_canHandle(name) {
          return !Module.noAudioDecoding && name.substr(-4) in { '.ogg': 1, '.wav': 1, '.mp3': 1 };
        };
        audioPlugin['handle'] = function audioPlugin_handle(byteArray, name, onload, onerror) {
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
              var b = new Blob([byteArray], { type: Browser.getMimetype(name) });
            } catch(e) {
              return fail();
            }
            var url = Browser.URLObject.createObjectURL(b); // XXX we never revoke this!
            var audio = new Audio();
            audio.addEventListener('canplaythrough', function() { finish(audio) }, false); // use addEventListener due to chromium bug 124926
            audio.onerror = function audio_onerror(event) {
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
            Browser.safeSetTimeout(function() {
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
                                 document['webkitExitPointerLock'] ||
                                 function(){}; // no-op if function does not exist
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
      },createContext:function (canvas, useWebGL, setInModule, webGLContextAttributes) {
        var ctx;
        try {
          if (useWebGL) {
            var contextAttributes = {
              antialias: false,
              alpha: false
            };
            if (webGLContextAttributes) {
              for (var attribute in webGLContextAttributes) {
                contextAttributes[attribute] = webGLContextAttributes[attribute];
              }
            }
            ['experimental-webgl', 'webgl'].some(function(webglId) {
              return ctx = canvas.getContext(webglId, contextAttributes);
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
        Browser.lockPointer = lockPointer;
        Browser.resizeCanvas = resizeCanvas;
        if (typeof Browser.lockPointer === 'undefined') Browser.lockPointer = true;
        if (typeof Browser.resizeCanvas === 'undefined') Browser.resizeCanvas = false;
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
        if (!Browser.fullScreenHandlersInstalled) {
          Browser.fullScreenHandlersInstalled = true;
          document.addEventListener('fullscreenchange', fullScreenChange, false);
          document.addEventListener('mozfullscreenchange', fullScreenChange, false);
          document.addEventListener('webkitfullscreenchange', fullScreenChange, false);
        }
        canvas.requestFullScreen = canvas['requestFullScreen'] ||
                                   canvas['mozRequestFullScreen'] ||
                                   (canvas['webkitRequestFullScreen'] ? function() { canvas['webkitRequestFullScreen'](Element['ALLOW_KEYBOARD_INPUT']) } : null);
        canvas.requestFullScreen();
      },requestAnimationFrame:function requestAnimationFrame(func) {
        if (typeof window === 'undefined') { // Provide fallback to setTimeout if window is undefined (e.g. in Node.js)
          setTimeout(func, 1000/60);
        } else {
          if (!window.requestAnimationFrame) {
            window.requestAnimationFrame = window['requestAnimationFrame'] ||
                                           window['mozRequestAnimationFrame'] ||
                                           window['webkitRequestAnimationFrame'] ||
                                           window['msRequestAnimationFrame'] ||
                                           window['oRequestAnimationFrame'] ||
                                           window['setTimeout'];
          }
          window.requestAnimationFrame(func);
        }
      },safeCallback:function (func) {
        return function() {
          if (!ABORT) return func.apply(null, arguments);
        };
      },safeRequestAnimationFrame:function (func) {
        return Browser.requestAnimationFrame(function() {
          if (!ABORT) func();
        });
      },safeSetTimeout:function (func, timeout) {
        return setTimeout(function() {
          if (!ABORT) func();
        }, timeout);
      },safeSetInterval:function (func, timeout) {
        return setInterval(function() {
          if (!ABORT) func();
        }, timeout);
      },getMimetype:function (name) {
        return {
          'jpg': 'image/jpeg',
          'jpeg': 'image/jpeg',
          'png': 'image/png',
          'bmp': 'image/bmp',
          'ogg': 'audio/ogg',
          'wav': 'audio/wav',
          'mp3': 'audio/mpeg'
        }[name.substr(name.lastIndexOf('.')+1)];
      },getUserMedia:function (func) {
        if(!window.getUserMedia) {
          window.getUserMedia = navigator['getUserMedia'] ||
                                navigator['mozGetUserMedia'];
        }
        window.getUserMedia(func);
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
      },mouseX:0,mouseY:0,mouseMovementX:0,mouseMovementY:0,calculateMouseEvent:function (event) { // event should be mousemove, mousedown or mouseup
        if (Browser.pointerLock) {
          // When the pointer is locked, calculate the coordinates
          // based on the movement of the mouse.
          // Workaround for Firefox bug 764498
          if (event.type != 'mousemove' &&
              ('mozMovementX' in event)) {
            Browser.mouseMovementX = Browser.mouseMovementY = 0;
          } else {
            Browser.mouseMovementX = Browser.getMovementX(event);
            Browser.mouseMovementY = Browser.getMovementY(event);
          }
          // check if SDL is available
          if (typeof SDL != "undefined") {
          	Browser.mouseX = SDL.mouseX + Browser.mouseMovementX;
          	Browser.mouseY = SDL.mouseY + Browser.mouseMovementY;
          } else {
          	// just add the mouse delta to the current absolut mouse position
          	// FIXME: ideally this should be clamped against the canvas size and zero
          	Browser.mouseX += Browser.mouseMovementX;
          	Browser.mouseY += Browser.mouseMovementY;
          }        
        } else {
          // Otherwise, calculate the movement based on the changes
          // in the coordinates.
          var rect = Module["canvas"].getBoundingClientRect();
          var x, y;
          if (event.type == 'touchstart' ||
              event.type == 'touchend' ||
              event.type == 'touchmove') {
            var t = event.touches.item(0);
            if (t) {
              x = t.pageX - (window.scrollX + rect.left);
              y = t.pageY - (window.scrollY + rect.top);
            } else {
              return;
            }
          } else {
            x = event.pageX - (window.scrollX + rect.left);
            y = event.pageY - (window.scrollY + rect.top);
          }
          // the canvas might be CSS-scaled compared to its backbuffer;
          // SDL-using content will want mouse coordinates in terms
          // of backbuffer units.
          var cw = Module["canvas"].width;
          var ch = Module["canvas"].height;
          x = x * (cw / rect.width);
          y = y * (ch / rect.height);
          Browser.mouseMovementX = x - Browser.mouseX;
          Browser.mouseMovementY = y - Browser.mouseY;
          Browser.mouseX = x;
          Browser.mouseY = y;
        }
      },xhrLoad:function (url, onload, onerror) {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', url, true);
        xhr.responseType = 'arraybuffer';
        xhr.onload = function xhr_onload() {
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
        // check if SDL is available   
        if (typeof SDL != "undefined") {
        	var flags = HEAPU32[((SDL.screen+Runtime.QUANTUM_SIZE*0)>>2)];
        	flags = flags | 0x00800000; // set SDL_FULLSCREEN flag
        	HEAP32[((SDL.screen+Runtime.QUANTUM_SIZE*0)>>2)]=flags
        }
        Browser.updateResizeListeners();
      },setWindowedCanvasSize:function () {
        var canvas = Module['canvas'];
        canvas.width = this.windowedWidth;
        canvas.height = this.windowedHeight;
        // check if SDL is available       
        if (typeof SDL != "undefined") {
        	var flags = HEAPU32[((SDL.screen+Runtime.QUANTUM_SIZE*0)>>2)];
        	flags = flags & ~0x00800000; // clear SDL_FULLSCREEN flag
        	HEAP32[((SDL.screen+Runtime.QUANTUM_SIZE*0)>>2)]=flags
        }
        Browser.updateResizeListeners();
      }};
FS.staticInit();__ATINIT__.unshift({ func: function() { if (!Module["noFSInit"] && !FS.init.initialized) FS.init() } });__ATMAIN__.push({ func: function() { FS.ignorePermissions = false } });__ATEXIT__.push({ func: function() { FS.quit() } });Module["FS_createFolder"] = FS.createFolder;Module["FS_createPath"] = FS.createPath;Module["FS_createDataFile"] = FS.createDataFile;Module["FS_createPreloadedFile"] = FS.createPreloadedFile;Module["FS_createLazyFile"] = FS.createLazyFile;Module["FS_createLink"] = FS.createLink;Module["FS_createDevice"] = FS.createDevice;
___errno_state = Runtime.staticAlloc(4); HEAP32[((___errno_state)>>2)]=0;
__ATINIT__.unshift({ func: function() { TTY.init() } });__ATEXIT__.push({ func: function() { TTY.shutdown() } });TTY.utf8 = new Runtime.UTF8Processor();
if (ENVIRONMENT_IS_NODE) { var fs = require("fs"); NODEFS.staticInit(); }
__ATINIT__.push({ func: function() { SOCKFS.root = FS.mount(SOCKFS, {}, null); } });
Module["requestFullScreen"] = function Module_requestFullScreen(lockPointer, resizeCanvas) { Browser.requestFullScreen(lockPointer, resizeCanvas) };
  Module["requestAnimationFrame"] = function Module_requestAnimationFrame(func) { Browser.requestAnimationFrame(func) };
  Module["setCanvasSize"] = function Module_setCanvasSize(width, height, noUpdates) { Browser.setCanvasSize(width, height, noUpdates) };
  Module["pauseMainLoop"] = function Module_pauseMainLoop() { Browser.mainLoop.pause() };
  Module["resumeMainLoop"] = function Module_resumeMainLoop() { Browser.mainLoop.resume() };
  Module["getUserMedia"] = function Module_getUserMedia() { Browser.getUserMedia() }
STACK_BASE = STACKTOP = Runtime.alignMemory(STATICTOP);
staticSealed = true; // seal the static portion of memory
STACK_MAX = STACK_BASE + 5242880;
DYNAMIC_BASE = DYNAMICTOP = Runtime.alignMemory(STACK_MAX);
assert(DYNAMIC_BASE < TOTAL_MEMORY); // Stack must fit in TOTAL_MEMORY; allocations from here on may enlarge TOTAL_MEMORY
var FUNCTION_TABLE = [0,0,_deflate_fast,0,_zcalloc,0,_zcfree,0,_deflate_stored,0,_deflate_slow,0];
// EMSCRIPTEN_START_FUNCS
function _def(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16;r4=0;r5=STACKTOP;STACKTOP=STACKTOP+32824|0;r6=r5;HEAP32[r6+32>>2]=0;HEAP32[r6+36>>2]=0;HEAP32[r6+40>>2]=0;r7=_deflateInit_(r6,r3,13872,56);if((r7|0)!=0){r8=r7;STACKTOP=r5;return r8}r7=r5+56|0;r3=r6+4|0;r9=r6|0;r10=r6+16|0;r11=r5+16440|0;r12=r6+12|0;L4:while(1){HEAP32[r3>>2]=_fread(r7,1,16384,r1);if((_ferror(r1)|0)!=0){r4=4;break}r13=(_feof(r1)|0)!=0;r14=r13?4:0;HEAP32[r9>>2]=r7;while(1){HEAP32[r10>>2]=16384;HEAP32[r12>>2]=r11;r15=_deflate(r6,r14);if((r15|0)==-2){r4=7;break L4}r16=16384-HEAP32[r10>>2]|0;if((_fwrite(r11,1,r16,r2)|0)!=(r16|0)){r4=10;break L4}if((_ferror(r2)|0)!=0){r4=10;break L4}if((HEAP32[r10>>2]|0)!=0){break}}if((HEAP32[r3>>2]|0)!=0){r4=13;break}if(r13){r4=15;break}}if(r4==4){_deflateEnd(r6);r8=-1;STACKTOP=r5;return r8}else if(r4==7){___assert_fail(13848,13376,68,14656)}else if(r4==10){_deflateEnd(r6);r8=-1;STACKTOP=r5;return r8}else if(r4==13){___assert_fail(13288,13376,75,14656)}else if(r4==15){if((r15|0)!=1){___assert_fail(13224,13376,79,14656)}_deflateEnd(r6);r8=0;STACKTOP=r5;return r8}}function _inf(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17;r3=0;r4=STACKTOP;STACKTOP=STACKTOP+32824|0;r5=r4;HEAP32[r5+32>>2]=0;HEAP32[r5+36>>2]=0;HEAP32[r5+40>>2]=0;r6=r5+4|0;HEAP32[r6>>2]=0;r7=r5|0;HEAP32[r7>>2]=0;r8=_inflateInit_(r5,13872,56);if((r8|0)!=0){r9=r8;STACKTOP=r4;return r9}r8=r4+56|0;r10=r5+16|0;r11=r4+16440|0;r12=r5+12|0;r13=0;L30:while(1){r14=_fread(r8,1,16384,r1);HEAP32[r6>>2]=r14;if((_ferror(r1)|0)!=0){r3=26;break}if((r14|0)==0){r15=r13;r3=38;break}HEAP32[r7>>2]=r8;while(1){HEAP32[r10>>2]=16384;HEAP32[r12>>2]=r11;r16=_inflate(r5,0);if((r16|0)==-2){r3=30;break L30}else if((r16|0)==-3|(r16|0)==-4){r3=31;break L30}else if((r16|0)==2){r17=-3;break L30}r14=16384-HEAP32[r10>>2]|0;if((_fwrite(r11,1,r14,r2)|0)!=(r14|0)){r3=35;break L30}if((_ferror(r2)|0)!=0){r3=35;break L30}if((HEAP32[r10>>2]|0)!=0){break}}if((r16|0)==1){r15=1;r3=38;break}else{r13=r16}}if(r3==30){___assert_fail(13848,13376,126,14648)}else if(r3==31){r17=r16}else if(r3==35){_inflateEnd(r5);r9=-1;STACKTOP=r4;return r9}else if(r3==38){_inflateEnd(r5);r9=(r15|0)==1?0:-3;STACKTOP=r4;return r9}else if(r3==26){_inflateEnd(r5);r9=-1;STACKTOP=r4;return r9}_inflateEnd(r5);r9=r17;STACKTOP=r4;return r9}function _zerr(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16;r2=0;r3=HEAP32[_stderr>>2];r4=_fwrite(13168,7,1,r3);switch(r1|0){case-1:{r5=HEAP32[_stdin>>2];r6=_ferror(r5);r7=(r6|0)==0;if(!r7){r8=_fwrite(13088,20,1,r3)}r9=HEAP32[_stdout>>2];r10=_ferror(r9);r11=(r10|0)==0;if(r11){return}r12=_fwrite(13016,21,1,r3);return;break};case-4:{r13=_fwrite(13832,14,1,r3);return;break};case-6:{r14=_fwrite(13776,23,1,r3);return;break};case-2:{r15=_fwrite(12904,26,1,r3);return;break};case-3:{r16=_fwrite(12800,35,1,r3);return;break};default:{return}}}function _main(r1,r2){var r3,r4,r5,r6,r7;r3=0;r4=_fopen(13704,13664);r5=_fopen(13632,13592);do{if((r1|0)==1){r6=_def(r4,r5,-1);if((r6|0)==0){r7=0;break}_zerr(r6);r7=r6}else if((r1|0)==2){if((_strcmp(HEAP32[r2+4>>2],13560)|0)!=0){r3=68;break}r6=_inf(r4,r5);if((r6|0)==0){r7=0;break}_zerr(r6);r7=r6}else{r3=68}}while(0);if(r3==68){_fwrite(13464,40,1,HEAP32[_stderr>>2]);r7=1}return r7}function _deflateInit_(r1,r2,r3,r4){return _deflateInit2_(r1,r2,8,15,8,0,r3,r4)}function _deflateInit2_(r1,r2,r3,r4,r5,r6,r7,r8){var r9,r10,r11,r12,r13;r9=r1;r1=r2;r2=r3;r3=r4;r4=r5;r5=r6;r6=r7;r7=r8;r8=1;do{if((r6|0)!=0){if((HEAP8[r6|0]|0)!=(HEAP8[4184]|0)){break}if((r7|0)!=56){break}if((r9|0)==0){r10=-2;r11=r10;return r11}HEAP32[r9+24>>2]=0;if((HEAP32[r9+32>>2]|0)==0){HEAP32[r9+32>>2]=4;HEAP32[r9+40>>2]=0}if((HEAP32[r9+36>>2]|0)==0){HEAP32[r9+36>>2]=6}if((r1|0)==-1){r1=6}if((r3|0)<0){r8=0;r3=-r3|0}else{if((r3|0)>15){r8=2;r3=r3-16|0}}do{if((r4|0)>=1){if((r4|0)>9){break}if((r2|0)!=8){break}if((r3|0)<8){break}if((r3|0)>15){break}if((r1|0)<0){break}if((r1|0)>9){break}if((r5|0)<0){break}if((r5|0)>4){break}if((r3|0)==8){r3=9}r12=FUNCTION_TABLE[HEAP32[r9+32>>2]](HEAP32[r9+40>>2],1,5828);if((r12|0)==0){r10=-4;r11=r10;return r11}HEAP32[r9+28>>2]=r12;HEAP32[r12>>2]=r9;HEAP32[r12+24>>2]=r8;HEAP32[r12+28>>2]=0;HEAP32[r12+48>>2]=r3;HEAP32[r12+44>>2]=1<<HEAP32[r12+48>>2];HEAP32[r12+52>>2]=HEAP32[r12+44>>2]-1;HEAP32[r12+80>>2]=r4+7;HEAP32[r12+76>>2]=1<<HEAP32[r12+80>>2];HEAP32[r12+84>>2]=HEAP32[r12+76>>2]-1;HEAP32[r12+88>>2]=((HEAP32[r12+80>>2]+3-1|0)>>>0)/3&-1;HEAP32[r12+56>>2]=FUNCTION_TABLE[HEAP32[r9+32>>2]](HEAP32[r9+40>>2],HEAP32[r12+44>>2],2);HEAP32[r12+64>>2]=FUNCTION_TABLE[HEAP32[r9+32>>2]](HEAP32[r9+40>>2],HEAP32[r12+44>>2],2);HEAP32[r12+68>>2]=FUNCTION_TABLE[HEAP32[r9+32>>2]](HEAP32[r9+40>>2],HEAP32[r12+76>>2],2);HEAP32[r12+5824>>2]=0;HEAP32[r12+5788>>2]=1<<r4+6;r13=FUNCTION_TABLE[HEAP32[r9+32>>2]](HEAP32[r9+40>>2],HEAP32[r12+5788>>2],4);HEAP32[r12+8>>2]=r13;HEAP32[r12+12>>2]=HEAP32[r12+5788>>2]<<2;do{if((HEAP32[r12+56>>2]|0)!=0){if((HEAP32[r12+64>>2]|0)==0){break}if((HEAP32[r12+68>>2]|0)==0){break}if((HEAP32[r12+8>>2]|0)==0){break}HEAP32[r12+5796>>2]=r13+(((HEAP32[r12+5788>>2]>>>0)/2&-1)<<1);HEAP32[r12+5784>>2]=HEAP32[r12+8>>2]+(HEAP32[r12+5788>>2]*3&-1);HEAP32[r12+132>>2]=r1;HEAP32[r12+136>>2]=r5;HEAP8[r12+36|0]=r2&255;r10=_deflateReset(r9);r11=r10;return r11}}while(0);HEAP32[r12+4>>2]=666;HEAP32[r9+24>>2]=HEAP32[32>>2];_deflateEnd(r9);r10=-4;r11=r10;return r11}}while(0);r10=-2;r11=r10;return r11}}while(0);r10=-6;r11=r10;return r11}function _deflateEnd(r1){var r2,r3,r4;r2=r1;do{if((r2|0)!=0){if((HEAP32[r2+28>>2]|0)==0){break}r1=HEAP32[HEAP32[r2+28>>2]+4>>2];do{if((r1|0)!=42){if((r1|0)==69){break}if((r1|0)==73){break}if((r1|0)==91){break}if((r1|0)==103){break}if((r1|0)==113){break}if((r1|0)==666){break}r3=-2;r4=r3;return r4}}while(0);if((HEAP32[HEAP32[r2+28>>2]+8>>2]|0)!=0){FUNCTION_TABLE[HEAP32[r2+36>>2]](HEAP32[r2+40>>2],HEAP32[HEAP32[r2+28>>2]+8>>2])}if((HEAP32[HEAP32[r2+28>>2]+68>>2]|0)!=0){FUNCTION_TABLE[HEAP32[r2+36>>2]](HEAP32[r2+40>>2],HEAP32[HEAP32[r2+28>>2]+68>>2])}if((HEAP32[HEAP32[r2+28>>2]+64>>2]|0)!=0){FUNCTION_TABLE[HEAP32[r2+36>>2]](HEAP32[r2+40>>2],HEAP32[HEAP32[r2+28>>2]+64>>2])}if((HEAP32[HEAP32[r2+28>>2]+56>>2]|0)!=0){FUNCTION_TABLE[HEAP32[r2+36>>2]](HEAP32[r2+40>>2],HEAP32[HEAP32[r2+28>>2]+56>>2])}FUNCTION_TABLE[HEAP32[r2+36>>2]](HEAP32[r2+40>>2],HEAP32[r2+28>>2]);HEAP32[r2+28>>2]=0;r3=(r1|0)==113?-3:0;r4=r3;return r4}}while(0);r3=-2;r4=r3;return r4}function _deflateReset(r1){var r2,r3;r2=r1;r1=_deflateResetKeep(r2);if((r1|0)!=0){r3=r1;return r3}_lm_init(HEAP32[r2+28>>2]);r3=r1;return r3}function _fill_window(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13;r2=0;r3=r1;r1=HEAP32[r3+44>>2];while(1){r4=HEAP32[r3+60>>2]-HEAP32[r3+116>>2]-HEAP32[r3+108>>2]|0;if(HEAP32[r3+108>>2]>>>0>=(r1+(HEAP32[r3+44>>2]-262)|0)>>>0){r5=HEAP32[r3+56>>2];r6=HEAP32[r3+56>>2]+r1|0;r7=r1;_memcpy(r5,r6,r7)|0;r7=r3+112|0;HEAP32[r7>>2]=HEAP32[r7>>2]-r1;r7=r3+108|0;HEAP32[r7>>2]=HEAP32[r7>>2]-r1;r7=r3+92|0;HEAP32[r7>>2]=HEAP32[r7>>2]-r1;r8=HEAP32[r3+76>>2];r7=HEAP32[r3+68>>2]+(r8<<1)|0;while(1){r6=r7-2|0;r7=r6;r9=HEAPU16[r6>>1];if(r9>>>0>=r1>>>0){r10=r9-r1|0}else{r10=0}HEAP16[r7>>1]=r10&65535;r6=r8-1|0;r8=r6;if((r6|0)==0){break}}r8=r1;r7=HEAP32[r3+64>>2]+(r8<<1)|0;while(1){r6=r7-2|0;r7=r6;r9=HEAPU16[r6>>1];if(r9>>>0>=r1>>>0){r11=r9-r1|0}else{r11=0}HEAP16[r7>>1]=r11&65535;r6=r8-1|0;r8=r6;if((r6|0)==0){break}}r4=r4+r1|0}if((HEAP32[HEAP32[r3>>2]+4>>2]|0)==0){r2=160;break}r8=_read_buf(HEAP32[r3>>2],HEAP32[r3+56>>2]+HEAP32[r3+108>>2]+HEAP32[r3+116>>2]|0,r4);r7=r3+116|0;HEAP32[r7>>2]=HEAP32[r7>>2]+r8;if((HEAP32[r3+116>>2]+HEAP32[r3+5812>>2]|0)>>>0>=3){r7=HEAP32[r3+108>>2]-HEAP32[r3+5812>>2]|0;HEAP32[r3+72>>2]=HEAPU8[HEAP32[r3+56>>2]+r7|0];HEAP32[r3+72>>2]=(HEAP32[r3+72>>2]<<HEAP32[r3+88>>2]^HEAPU8[HEAP32[r3+56>>2]+(r7+1)|0])&HEAP32[r3+84>>2];while(1){if((HEAP32[r3+5812>>2]|0)==0){break}HEAP32[r3+72>>2]=(HEAP32[r3+72>>2]<<HEAP32[r3+88>>2]^HEAPU8[HEAP32[r3+56>>2]+(r7+3-1)|0])&HEAP32[r3+84>>2];HEAP16[HEAP32[r3+64>>2]+((r7&HEAP32[r3+52>>2])<<1)>>1]=HEAP16[HEAP32[r3+68>>2]+(HEAP32[r3+72>>2]<<1)>>1];HEAP16[HEAP32[r3+68>>2]+(HEAP32[r3+72>>2]<<1)>>1]=r7&65535;r7=r7+1|0;r6=r3+5812|0;HEAP32[r6>>2]=HEAP32[r6>>2]-1;if((HEAP32[r3+116>>2]+HEAP32[r3+5812>>2]|0)>>>0<3){r2=165;break}}if(r2==165){r2=0}}if(HEAP32[r3+116>>2]>>>0<262){r12=(HEAP32[HEAP32[r3>>2]+4>>2]|0)!=0}else{r12=0}if(!r12){break}}if(HEAP32[r3+5824>>2]>>>0>=HEAP32[r3+60>>2]>>>0){return}r12=HEAP32[r3+108>>2]+HEAP32[r3+116>>2]|0;if(HEAP32[r3+5824>>2]>>>0<r12>>>0){r13=HEAP32[r3+60>>2]-r12|0;if(r13>>>0>258){r13=258}_memset(HEAP32[r3+56>>2]+r12|0,0,r13);HEAP32[r3+5824>>2]=r12+r13}else{if(HEAP32[r3+5824>>2]>>>0<(r12+258|0)>>>0){r13=r12+258-HEAP32[r3+5824>>2]|0;if(r13>>>0>(HEAP32[r3+60>>2]-HEAP32[r3+5824>>2]|0)>>>0){r13=HEAP32[r3+60>>2]-HEAP32[r3+5824>>2]|0}_memset(HEAP32[r3+56>>2]+HEAP32[r3+5824>>2]|0,0,r13);r12=r3+5824|0;HEAP32[r12>>2]=HEAP32[r12>>2]+r13}}return}function _deflateResetKeep(r1){var r2,r3,r4,r5;r2=r1;do{if((r2|0)!=0){if((HEAP32[r2+28>>2]|0)==0){break}if((HEAP32[r2+32>>2]|0)==0){break}if((HEAP32[r2+36>>2]|0)==0){break}HEAP32[r2+20>>2]=0;HEAP32[r2+8>>2]=0;HEAP32[r2+24>>2]=0;HEAP32[r2+44>>2]=2;r1=HEAP32[r2+28>>2];HEAP32[r1+20>>2]=0;HEAP32[r1+16>>2]=HEAP32[r1+8>>2];if((HEAP32[r1+24>>2]|0)<0){HEAP32[r1+24>>2]=-HEAP32[r1+24>>2]}HEAP32[r1+4>>2]=(HEAP32[r1+24>>2]|0)!=0?42:113;if((HEAP32[r1+24>>2]|0)==2){r3=_crc32(0,0,0)}else{r3=_adler32(0,0,0)}HEAP32[r2+48>>2]=r3;HEAP32[r1+40>>2]=0;__tr_init(r1);r4=0;r5=r4;return r5}}while(0);r4=-2;r5=r4;return r5}function _lm_init(r1){var r2;r2=r1;HEAP32[r2+60>>2]=HEAP32[r2+44>>2]<<1;HEAP16[HEAP32[r2+68>>2]+(HEAP32[r2+76>>2]-1<<1)>>1]=0;_memset(HEAP32[r2+68>>2],0,HEAP32[r2+76>>2]-1<<1);HEAP32[r2+128>>2]=HEAPU16[12386+(HEAP32[r2+132>>2]*12&-1)>>1];HEAP32[r2+140>>2]=HEAPU16[12384+(HEAP32[r2+132>>2]*12&-1)>>1];HEAP32[r2+144>>2]=HEAPU16[12388+(HEAP32[r2+132>>2]*12&-1)>>1];HEAP32[r2+124>>2]=HEAPU16[12390+(HEAP32[r2+132>>2]*12&-1)>>1];HEAP32[r2+108>>2]=0;HEAP32[r2+92>>2]=0;HEAP32[r2+116>>2]=0;HEAP32[r2+5812>>2]=0;HEAP32[r2+120>>2]=2;HEAP32[r2+96>>2]=2;HEAP32[r2+104>>2]=0;HEAP32[r2+72>>2]=0;return}function _deflate(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21;r3=0;r4=r1;r1=r2;do{if((r4|0)!=0){if((HEAP32[r4+28>>2]|0)==0){break}if((r1|0)>5){break}if((r1|0)<0){break}r2=HEAP32[r4+28>>2];do{if((HEAP32[r4+12>>2]|0)!=0){if((HEAP32[r4>>2]|0)==0){if((HEAP32[r4+4>>2]|0)!=0){break}}if((HEAP32[r2+4>>2]|0)==666){if((r1|0)!=4){break}}if((HEAP32[r4+16>>2]|0)==0){HEAP32[r4+24>>2]=HEAP32[36>>2];r5=-5;r6=r5;return r6}HEAP32[r2>>2]=r4;r7=HEAP32[r2+40>>2];HEAP32[r2+40>>2]=r1;if((HEAP32[r2+4>>2]|0)==42){if((HEAP32[r2+24>>2]|0)==2){HEAP32[r4+48>>2]=_crc32(0,0,0);r8=r2+20|0;r9=HEAP32[r8>>2];HEAP32[r8>>2]=r9+1;HEAP8[HEAP32[r2+8>>2]+r9|0]=31;r9=r2+20|0;r8=HEAP32[r9>>2];HEAP32[r9>>2]=r8+1;HEAP8[HEAP32[r2+8>>2]+r8|0]=-117;r8=r2+20|0;r9=HEAP32[r8>>2];HEAP32[r8>>2]=r9+1;HEAP8[HEAP32[r2+8>>2]+r9|0]=8;if((HEAP32[r2+28>>2]|0)==0){r9=r2+20|0;r8=HEAP32[r9>>2];HEAP32[r9>>2]=r8+1;HEAP8[HEAP32[r2+8>>2]+r8|0]=0;r8=r2+20|0;r9=HEAP32[r8>>2];HEAP32[r8>>2]=r9+1;HEAP8[HEAP32[r2+8>>2]+r9|0]=0;r9=r2+20|0;r8=HEAP32[r9>>2];HEAP32[r9>>2]=r8+1;HEAP8[HEAP32[r2+8>>2]+r8|0]=0;r8=r2+20|0;r9=HEAP32[r8>>2];HEAP32[r8>>2]=r9+1;HEAP8[HEAP32[r2+8>>2]+r9|0]=0;r9=r2+20|0;r8=HEAP32[r9>>2];HEAP32[r9>>2]=r8+1;HEAP8[HEAP32[r2+8>>2]+r8|0]=0;if((HEAP32[r2+132>>2]|0)==9){r10=2}else{if((HEAP32[r2+136>>2]|0)>=2){r11=1}else{r11=(HEAP32[r2+132>>2]|0)<2}r10=r11?4:0}r8=r2+20|0;r9=HEAP32[r8>>2];HEAP32[r8>>2]=r9+1;HEAP8[HEAP32[r2+8>>2]+r9|0]=r10&255;r9=r2+20|0;r8=HEAP32[r9>>2];HEAP32[r9>>2]=r8+1;HEAP8[HEAP32[r2+8>>2]+r8|0]=3;HEAP32[r2+4>>2]=113}else{r8=((HEAP32[HEAP32[r2+28>>2]>>2]|0)!=0?1:0)+((HEAP32[HEAP32[r2+28>>2]+44>>2]|0)!=0?2:0)+((HEAP32[HEAP32[r2+28>>2]+16>>2]|0)==0?0:4)+((HEAP32[HEAP32[r2+28>>2]+28>>2]|0)==0?0:8)+((HEAP32[HEAP32[r2+28>>2]+36>>2]|0)==0?0:16)&255;r9=r2+20|0;r12=HEAP32[r9>>2];HEAP32[r9>>2]=r12+1;HEAP8[HEAP32[r2+8>>2]+r12|0]=r8;r8=HEAP32[HEAP32[r2+28>>2]+4>>2]&255;r12=r2+20|0;r9=HEAP32[r12>>2];HEAP32[r12>>2]=r9+1;HEAP8[HEAP32[r2+8>>2]+r9|0]=r8;r8=HEAP32[HEAP32[r2+28>>2]+4>>2]>>>8&255;r9=r2+20|0;r12=HEAP32[r9>>2];HEAP32[r9>>2]=r12+1;HEAP8[HEAP32[r2+8>>2]+r12|0]=r8;r8=HEAP32[HEAP32[r2+28>>2]+4>>2]>>>16&255;r12=r2+20|0;r9=HEAP32[r12>>2];HEAP32[r12>>2]=r9+1;HEAP8[HEAP32[r2+8>>2]+r9|0]=r8;r8=HEAP32[HEAP32[r2+28>>2]+4>>2]>>>24&255;r9=r2+20|0;r12=HEAP32[r9>>2];HEAP32[r9>>2]=r12+1;HEAP8[HEAP32[r2+8>>2]+r12|0]=r8;if((HEAP32[r2+132>>2]|0)==9){r13=2}else{if((HEAP32[r2+136>>2]|0)>=2){r14=1}else{r14=(HEAP32[r2+132>>2]|0)<2}r13=r14?4:0}r8=r2+20|0;r12=HEAP32[r8>>2];HEAP32[r8>>2]=r12+1;HEAP8[HEAP32[r2+8>>2]+r12|0]=r13&255;r12=HEAP32[HEAP32[r2+28>>2]+12>>2]&255;r8=r2+20|0;r9=HEAP32[r8>>2];HEAP32[r8>>2]=r9+1;HEAP8[HEAP32[r2+8>>2]+r9|0]=r12;if((HEAP32[HEAP32[r2+28>>2]+16>>2]|0)!=0){r12=HEAP32[HEAP32[r2+28>>2]+20>>2]&255;r9=r2+20|0;r8=HEAP32[r9>>2];HEAP32[r9>>2]=r8+1;HEAP8[HEAP32[r2+8>>2]+r8|0]=r12;r12=HEAP32[HEAP32[r2+28>>2]+20>>2]>>>8&255;r8=r2+20|0;r9=HEAP32[r8>>2];HEAP32[r8>>2]=r9+1;HEAP8[HEAP32[r2+8>>2]+r9|0]=r12}if((HEAP32[HEAP32[r2+28>>2]+44>>2]|0)!=0){HEAP32[r4+48>>2]=_crc32(HEAP32[r4+48>>2],HEAP32[r2+8>>2],HEAP32[r2+20>>2])}HEAP32[r2+32>>2]=0;HEAP32[r2+4>>2]=69}}else{r12=(HEAP32[r2+48>>2]-8<<4)+8<<8;do{if((HEAP32[r2+136>>2]|0)>=2){r3=236}else{if((HEAP32[r2+132>>2]|0)<2){r3=236;break}if((HEAP32[r2+132>>2]|0)<6){r15=1}else{if((HEAP32[r2+132>>2]|0)==6){r15=2}else{r15=3}}}}while(0);if(r3==236){r15=0}r12=r12|r15<<6;if((HEAP32[r2+108>>2]|0)!=0){r12=r12|32}r12=r12+(31-((r12>>>0)%31&-1))|0;HEAP32[r2+4>>2]=113;_putShortMSB(r2,r12);if((HEAP32[r2+108>>2]|0)!=0){_putShortMSB(r2,HEAP32[r4+48>>2]>>>16);_putShortMSB(r2,HEAP32[r4+48>>2]&65535)}HEAP32[r4+48>>2]=_adler32(0,0,0)}}if((HEAP32[r2+4>>2]|0)==69){if((HEAP32[HEAP32[r2+28>>2]+16>>2]|0)!=0){r9=HEAP32[r2+20>>2];while(1){if(HEAP32[r2+32>>2]>>>0>=(HEAP32[HEAP32[r2+28>>2]+20>>2]&65535)>>>0){break}if((HEAP32[r2+20>>2]|0)==(HEAP32[r2+12>>2]|0)){do{if((HEAP32[HEAP32[r2+28>>2]+44>>2]|0)!=0){if(HEAP32[r2+20>>2]>>>0<=r9>>>0){break}HEAP32[r4+48>>2]=_crc32(HEAP32[r4+48>>2],HEAP32[r2+8>>2]+r9|0,HEAP32[r2+20>>2]-r9|0)}}while(0);_flush_pending(r4);r9=HEAP32[r2+20>>2];if((HEAP32[r2+20>>2]|0)==(HEAP32[r2+12>>2]|0)){r3=259;break}}r8=HEAP8[HEAP32[HEAP32[r2+28>>2]+16>>2]+HEAP32[r2+32>>2]|0];r16=r2+20|0;r17=HEAP32[r16>>2];HEAP32[r16>>2]=r17+1;HEAP8[HEAP32[r2+8>>2]+r17|0]=r8;r8=r2+32|0;HEAP32[r8>>2]=HEAP32[r8>>2]+1}do{if((HEAP32[HEAP32[r2+28>>2]+44>>2]|0)!=0){if(HEAP32[r2+20>>2]>>>0<=r9>>>0){break}HEAP32[r4+48>>2]=_crc32(HEAP32[r4+48>>2],HEAP32[r2+8>>2]+r9|0,HEAP32[r2+20>>2]-r9|0)}}while(0);if((HEAP32[r2+32>>2]|0)==(HEAP32[HEAP32[r2+28>>2]+20>>2]|0)){HEAP32[r2+32>>2]=0;HEAP32[r2+4>>2]=73}}else{HEAP32[r2+4>>2]=73}}if((HEAP32[r2+4>>2]|0)==73){if((HEAP32[HEAP32[r2+28>>2]+28>>2]|0)!=0){r9=HEAP32[r2+20>>2];while(1){if((HEAP32[r2+20>>2]|0)==(HEAP32[r2+12>>2]|0)){do{if((HEAP32[HEAP32[r2+28>>2]+44>>2]|0)!=0){if(HEAP32[r2+20>>2]>>>0<=r9>>>0){break}HEAP32[r4+48>>2]=_crc32(HEAP32[r4+48>>2],HEAP32[r2+8>>2]+r9|0,HEAP32[r2+20>>2]-r9|0)}}while(0);_flush_pending(r4);r9=HEAP32[r2+20>>2];if((HEAP32[r2+20>>2]|0)==(HEAP32[r2+12>>2]|0)){r3=278;break}}r12=r2+32|0;r8=HEAP32[r12>>2];HEAP32[r12>>2]=r8+1;r18=HEAPU8[HEAP32[HEAP32[r2+28>>2]+28>>2]+r8|0];r8=r2+20|0;r12=HEAP32[r8>>2];HEAP32[r8>>2]=r12+1;HEAP8[HEAP32[r2+8>>2]+r12|0]=r18&255;if((r18|0)==0){break}}if(r3==278){r18=1}do{if((HEAP32[HEAP32[r2+28>>2]+44>>2]|0)!=0){if(HEAP32[r2+20>>2]>>>0<=r9>>>0){break}HEAP32[r4+48>>2]=_crc32(HEAP32[r4+48>>2],HEAP32[r2+8>>2]+r9|0,HEAP32[r2+20>>2]-r9|0)}}while(0);if((r18|0)==0){HEAP32[r2+32>>2]=0;HEAP32[r2+4>>2]=91}}else{HEAP32[r2+4>>2]=91}}if((HEAP32[r2+4>>2]|0)==91){if((HEAP32[HEAP32[r2+28>>2]+36>>2]|0)!=0){r9=HEAP32[r2+20>>2];while(1){if((HEAP32[r2+20>>2]|0)==(HEAP32[r2+12>>2]|0)){do{if((HEAP32[HEAP32[r2+28>>2]+44>>2]|0)!=0){if(HEAP32[r2+20>>2]>>>0<=r9>>>0){break}HEAP32[r4+48>>2]=_crc32(HEAP32[r4+48>>2],HEAP32[r2+8>>2]+r9|0,HEAP32[r2+20>>2]-r9|0)}}while(0);_flush_pending(r4);r9=HEAP32[r2+20>>2];if((HEAP32[r2+20>>2]|0)==(HEAP32[r2+12>>2]|0)){r3=298;break}}r12=r2+32|0;r8=HEAP32[r12>>2];HEAP32[r12>>2]=r8+1;r19=HEAPU8[HEAP32[HEAP32[r2+28>>2]+36>>2]+r8|0];r8=r2+20|0;r12=HEAP32[r8>>2];HEAP32[r8>>2]=r12+1;HEAP8[HEAP32[r2+8>>2]+r12|0]=r19&255;if((r19|0)==0){break}}if(r3==298){r19=1}do{if((HEAP32[HEAP32[r2+28>>2]+44>>2]|0)!=0){if(HEAP32[r2+20>>2]>>>0<=r9>>>0){break}HEAP32[r4+48>>2]=_crc32(HEAP32[r4+48>>2],HEAP32[r2+8>>2]+r9|0,HEAP32[r2+20>>2]-r9|0)}}while(0);if((r19|0)==0){HEAP32[r2+4>>2]=103}}else{HEAP32[r2+4>>2]=103}}if((HEAP32[r2+4>>2]|0)==103){if((HEAP32[HEAP32[r2+28>>2]+44>>2]|0)!=0){if((HEAP32[r2+20>>2]+2|0)>>>0>HEAP32[r2+12>>2]>>>0){_flush_pending(r4)}if((HEAP32[r2+20>>2]+2|0)>>>0<=HEAP32[r2+12>>2]>>>0){r9=HEAP32[r4+48>>2]&255;r12=r2+20|0;r8=HEAP32[r12>>2];HEAP32[r12>>2]=r8+1;HEAP8[HEAP32[r2+8>>2]+r8|0]=r9;r9=HEAP32[r4+48>>2]>>>8&255;r8=r2+20|0;r12=HEAP32[r8>>2];HEAP32[r8>>2]=r12+1;HEAP8[HEAP32[r2+8>>2]+r12|0]=r9;HEAP32[r4+48>>2]=_crc32(0,0,0);HEAP32[r2+4>>2]=113}}else{HEAP32[r2+4>>2]=113}}do{if((HEAP32[r2+20>>2]|0)!=0){_flush_pending(r4);if((HEAP32[r4+16>>2]|0)!=0){break}HEAP32[r2+40>>2]=-1;r5=0;r6=r5;return r6}else{do{if((HEAP32[r4+4>>2]|0)==0){if(((r1<<1)-((r1|0)>4?9:0)|0)>((r7<<1)-((r7|0)>4?9:0)|0)){break}if((r1|0)==4){break}HEAP32[r4+24>>2]=HEAP32[36>>2];r5=-5;r6=r5;return r6}}while(0)}}while(0);do{if((HEAP32[r2+4>>2]|0)==666){if((HEAP32[r4+4>>2]|0)==0){break}HEAP32[r4+24>>2]=HEAP32[36>>2];r5=-5;r6=r5;return r6}}while(0);do{if((HEAP32[r4+4>>2]|0)!=0){r3=335}else{if((HEAP32[r2+116>>2]|0)!=0){r3=335;break}if((r1|0)==0){break}if((HEAP32[r2+4>>2]|0)!=666){r3=335}}}while(0);L432:do{if(r3==335){if((HEAP32[r2+136>>2]|0)==2){r20=_deflate_huff(r2,r1)}else{if((HEAP32[r2+136>>2]|0)==3){r21=_deflate_rle(r2,r1)}else{r21=FUNCTION_TABLE[HEAP32[12392+(HEAP32[r2+132>>2]*12&-1)>>2]](r2,r1)}r20=r21}r7=r20;if((r7|0)==2){r3=343}else{if((r7|0)==3){r3=343}}if(r3==343){HEAP32[r2+4>>2]=666}do{if((r7|0)!=0){if((r7|0)==2){break}do{if((r7|0)==1){if((r1|0)==1){__tr_align(r2)}else{if((r1|0)!=5){__tr_stored_block(r2,0,0,0);if((r1|0)==3){HEAP16[HEAP32[r2+68>>2]+(HEAP32[r2+76>>2]-1<<1)>>1]=0;_memset(HEAP32[r2+68>>2],0,HEAP32[r2+76>>2]-1<<1);if((HEAP32[r2+116>>2]|0)==0){HEAP32[r2+108>>2]=0;HEAP32[r2+92>>2]=0;HEAP32[r2+5812>>2]=0}}}}_flush_pending(r4);if((HEAP32[r4+16>>2]|0)!=0){break}HEAP32[r2+40>>2]=-1;r5=0;r6=r5;return r6}}while(0);break L432}}while(0);if((HEAP32[r4+16>>2]|0)==0){HEAP32[r2+40>>2]=-1}r5=0;r6=r5;return r6}}while(0);if((r1|0)!=4){r5=0;r6=r5;return r6}if((HEAP32[r2+24>>2]|0)<=0){r5=1;r6=r5;return r6}if((HEAP32[r2+24>>2]|0)==2){r7=HEAP32[r4+48>>2]&255;r9=r2+20|0;r12=HEAP32[r9>>2];HEAP32[r9>>2]=r12+1;HEAP8[HEAP32[r2+8>>2]+r12|0]=r7;r7=HEAP32[r4+48>>2]>>>8&255;r12=r2+20|0;r9=HEAP32[r12>>2];HEAP32[r12>>2]=r9+1;HEAP8[HEAP32[r2+8>>2]+r9|0]=r7;r7=HEAP32[r4+48>>2]>>>16&255;r9=r2+20|0;r12=HEAP32[r9>>2];HEAP32[r9>>2]=r12+1;HEAP8[HEAP32[r2+8>>2]+r12|0]=r7;r7=HEAP32[r4+48>>2]>>>24&255;r12=r2+20|0;r9=HEAP32[r12>>2];HEAP32[r12>>2]=r9+1;HEAP8[HEAP32[r2+8>>2]+r9|0]=r7;r7=HEAP32[r4+8>>2]&255;r9=r2+20|0;r12=HEAP32[r9>>2];HEAP32[r9>>2]=r12+1;HEAP8[HEAP32[r2+8>>2]+r12|0]=r7;r7=HEAP32[r4+8>>2]>>>8&255;r12=r2+20|0;r9=HEAP32[r12>>2];HEAP32[r12>>2]=r9+1;HEAP8[HEAP32[r2+8>>2]+r9|0]=r7;r7=HEAP32[r4+8>>2]>>>16&255;r9=r2+20|0;r12=HEAP32[r9>>2];HEAP32[r9>>2]=r12+1;HEAP8[HEAP32[r2+8>>2]+r12|0]=r7;r7=HEAP32[r4+8>>2]>>>24&255;r12=r2+20|0;r9=HEAP32[r12>>2];HEAP32[r12>>2]=r9+1;HEAP8[HEAP32[r2+8>>2]+r9|0]=r7}else{_putShortMSB(r2,HEAP32[r4+48>>2]>>>16);_putShortMSB(r2,HEAP32[r4+48>>2]&65535)}_flush_pending(r4);if((HEAP32[r2+24>>2]|0)>0){HEAP32[r2+24>>2]=-HEAP32[r2+24>>2]}r5=(HEAP32[r2+20>>2]|0)!=0?0:1;r6=r5;return r6}}while(0);HEAP32[r4+24>>2]=HEAP32[24>>2];r5=-2;r6=r5;return r6}}while(0);r5=-2;r6=r5;return r6}function _putShortMSB(r1,r2){var r3,r4;r3=r1;r1=r2;r2=r3+20|0;r4=HEAP32[r2>>2];HEAP32[r2>>2]=r4+1;HEAP8[HEAP32[r3+8>>2]+r4|0]=r1>>>8&255;r4=r3+20|0;r2=HEAP32[r4>>2];HEAP32[r4>>2]=r2+1;HEAP8[HEAP32[r3+8>>2]+r2|0]=r1&255;return}function _flush_pending(r1){var r2,r3,r4,r5,r6;r2=r1;r1=HEAP32[r2+28>>2];__tr_flush_bits(r1);r3=HEAP32[r1+20>>2];if(r3>>>0>HEAP32[r2+16>>2]>>>0){r3=HEAP32[r2+16>>2]}if((r3|0)==0){return}r4=HEAP32[r2+12>>2];r5=HEAP32[r1+16>>2];r6=r3;_memcpy(r4,r5,r6)|0;r6=r2+12|0;HEAP32[r6>>2]=HEAP32[r6>>2]+r3;r6=r1+16|0;HEAP32[r6>>2]=HEAP32[r6>>2]+r3;r6=r2+20|0;HEAP32[r6>>2]=HEAP32[r6>>2]+r3;r6=r2+16|0;HEAP32[r6>>2]=HEAP32[r6>>2]-r3;r6=r1+20|0;HEAP32[r6>>2]=HEAP32[r6>>2]-r3;if((HEAP32[r1+20>>2]|0)!=0){return}HEAP32[r1+16>>2]=HEAP32[r1+8>>2];return}function _deflate_huff(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10,r11;r3=0;r4=r1;r1=r2;while(1){if((HEAP32[r4+116>>2]|0)==0){_fill_window(r4);if((HEAP32[r4+116>>2]|0)==0){break}}HEAP32[r4+96>>2]=0;r2=HEAP8[HEAP32[r4+56>>2]+HEAP32[r4+108>>2]|0];HEAP16[HEAP32[r4+5796>>2]+(HEAP32[r4+5792>>2]<<1)>>1]=0;r5=r4+5792|0;r6=HEAP32[r5>>2];HEAP32[r5>>2]=r6+1;HEAP8[HEAP32[r4+5784>>2]+r6|0]=r2;r6=r4+148+((r2&255)<<2)|0;HEAP16[r6>>1]=HEAP16[r6>>1]+1&65535;r6=(HEAP32[r4+5792>>2]|0)==(HEAP32[r4+5788>>2]-1|0)|0;r2=r4+116|0;HEAP32[r2>>2]=HEAP32[r2>>2]-1;r2=r4+108|0;HEAP32[r2>>2]=HEAP32[r2>>2]+1;if((r6|0)!=0){if((HEAP32[r4+92>>2]|0)>=0){r7=HEAP32[r4+56>>2]+HEAP32[r4+92>>2]|0}else{r7=0}__tr_flush_block(r4,r7,HEAP32[r4+108>>2]-HEAP32[r4+92>>2]|0,0);HEAP32[r4+92>>2]=HEAP32[r4+108>>2];_flush_pending(HEAP32[r4>>2]);if((HEAP32[HEAP32[r4>>2]+16>>2]|0)==0){r3=408;break}}}if(r3==408){r8=0;r9=r8;return r9}if((r1|0)==0){r8=0;r9=r8;return r9}HEAP32[r4+5812>>2]=0;if((r1|0)==4){if((HEAP32[r4+92>>2]|0)>=0){r10=HEAP32[r4+56>>2]+HEAP32[r4+92>>2]|0}else{r10=0}__tr_flush_block(r4,r10,HEAP32[r4+108>>2]-HEAP32[r4+92>>2]|0,1);HEAP32[r4+92>>2]=HEAP32[r4+108>>2];_flush_pending(HEAP32[r4>>2]);if((HEAP32[HEAP32[r4>>2]+16>>2]|0)==0){r8=2;r9=r8;return r9}else{r8=3;r9=r8;return r9}}do{if((HEAP32[r4+5792>>2]|0)!=0){if((HEAP32[r4+92>>2]|0)>=0){r11=HEAP32[r4+56>>2]+HEAP32[r4+92>>2]|0}else{r11=0}__tr_flush_block(r4,r11,HEAP32[r4+108>>2]-HEAP32[r4+92>>2]|0,0);HEAP32[r4+92>>2]=HEAP32[r4+108>>2];_flush_pending(HEAP32[r4>>2]);if((HEAP32[HEAP32[r4>>2]+16>>2]|0)!=0){break}r8=0;r9=r8;return r9}}while(0);r8=1;r9=r8;return r9}function _deflate_rle(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17;r3=0;r4=r1;r1=r2;while(1){if(HEAP32[r4+116>>2]>>>0<=258){_fill_window(r4);if(HEAP32[r4+116>>2]>>>0<=258){if((r1|0)==0){r3=437;break}}if((HEAP32[r4+116>>2]|0)==0){r3=439;break}}HEAP32[r4+96>>2]=0;do{if(HEAP32[r4+116>>2]>>>0>=3){if(HEAP32[r4+108>>2]>>>0<=0){break}r2=HEAP32[r4+56>>2]+HEAP32[r4+108>>2]-1|0;r5=HEAPU8[r2];r6=r2+1|0;r2=r6;do{if((r5|0)==(HEAPU8[r6]|0)){r7=r2+1|0;r2=r7;if((r5|0)!=(HEAPU8[r7]|0)){break}r7=r2+1|0;r2=r7;if((r5|0)!=(HEAPU8[r7]|0)){break}r7=HEAP32[r4+56>>2]+HEAP32[r4+108>>2]+258|0;while(1){r8=r2+1|0;r2=r8;do{if((r5|0)==(HEAPU8[r8]|0)){r9=r2+1|0;r2=r9;if((r5|0)!=(HEAPU8[r9]|0)){r10=0;break}r9=r2+1|0;r2=r9;if((r5|0)!=(HEAPU8[r9]|0)){r10=0;break}r9=r2+1|0;r2=r9;if((r5|0)!=(HEAPU8[r9]|0)){r10=0;break}r9=r2+1|0;r2=r9;if((r5|0)!=(HEAPU8[r9]|0)){r10=0;break}r9=r2+1|0;r2=r9;if((r5|0)!=(HEAPU8[r9]|0)){r10=0;break}r9=r2+1|0;r2=r9;if((r5|0)!=(HEAPU8[r9]|0)){r10=0;break}r9=r2+1|0;r2=r9;if((r5|0)!=(HEAPU8[r9]|0)){r10=0;break}r10=r2>>>0<r7>>>0}else{r10=0}}while(0);if(!r10){break}}HEAP32[r4+96>>2]=258-(r7-r2);if(HEAP32[r4+96>>2]>>>0>HEAP32[r4+116>>2]>>>0){HEAP32[r4+96>>2]=HEAP32[r4+116>>2]}}}while(0)}}while(0);if(HEAP32[r4+96>>2]>>>0>=3){r2=HEAP32[r4+96>>2]-3&255;r5=1;HEAP16[HEAP32[r4+5796>>2]+(HEAP32[r4+5792>>2]<<1)>>1]=r5;r6=r4+5792|0;r8=HEAP32[r6>>2];HEAP32[r6>>2]=r8+1;HEAP8[HEAP32[r4+5784>>2]+r8|0]=r2;r5=r5-1&65535;r8=r4+148+(HEAPU8[13880+(r2&255)|0]+257<<2)|0;HEAP16[r8>>1]=HEAP16[r8>>1]+1&65535;if((r5&65535|0)<256){r11=HEAPU8[14136+(r5&65535)|0]}else{r11=HEAPU8[((r5&65535)>>7)+14392|0]}r5=r4+2440+(r11<<2)|0;HEAP16[r5>>1]=HEAP16[r5>>1]+1&65535;r12=(HEAP32[r4+5792>>2]|0)==(HEAP32[r4+5788>>2]-1|0)|0;r5=r4+116|0;HEAP32[r5>>2]=HEAP32[r5>>2]-HEAP32[r4+96>>2];r5=r4+108|0;HEAP32[r5>>2]=HEAP32[r5>>2]+HEAP32[r4+96>>2];HEAP32[r4+96>>2]=0}else{r5=HEAP8[HEAP32[r4+56>>2]+HEAP32[r4+108>>2]|0];HEAP16[HEAP32[r4+5796>>2]+(HEAP32[r4+5792>>2]<<1)>>1]=0;r8=r4+5792|0;r2=HEAP32[r8>>2];HEAP32[r8>>2]=r2+1;HEAP8[HEAP32[r4+5784>>2]+r2|0]=r5;r2=r4+148+((r5&255)<<2)|0;HEAP16[r2>>1]=HEAP16[r2>>1]+1&65535;r12=(HEAP32[r4+5792>>2]|0)==(HEAP32[r4+5788>>2]-1|0)|0;r2=r4+116|0;HEAP32[r2>>2]=HEAP32[r2>>2]-1;r2=r4+108|0;HEAP32[r2>>2]=HEAP32[r2>>2]+1}if((r12|0)!=0){if((HEAP32[r4+92>>2]|0)>=0){r13=HEAP32[r4+56>>2]+HEAP32[r4+92>>2]|0}else{r13=0}__tr_flush_block(r4,r13,HEAP32[r4+108>>2]-HEAP32[r4+92>>2]|0,0);HEAP32[r4+92>>2]=HEAP32[r4+108>>2];_flush_pending(HEAP32[r4>>2]);if((HEAP32[HEAP32[r4>>2]+16>>2]|0)==0){r3=473;break}}}if(r3==473){r14=0;r15=r14;return r15}else if(r3==437){r14=0;r15=r14;return r15}else if(r3==439){HEAP32[r4+5812>>2]=0;if((r1|0)==4){if((HEAP32[r4+92>>2]|0)>=0){r16=HEAP32[r4+56>>2]+HEAP32[r4+92>>2]|0}else{r16=0}__tr_flush_block(r4,r16,HEAP32[r4+108>>2]-HEAP32[r4+92>>2]|0,1);HEAP32[r4+92>>2]=HEAP32[r4+108>>2];_flush_pending(HEAP32[r4>>2]);if((HEAP32[HEAP32[r4>>2]+16>>2]|0)==0){r14=2;r15=r14;return r15}else{r14=3;r15=r14;return r15}}do{if((HEAP32[r4+5792>>2]|0)!=0){if((HEAP32[r4+92>>2]|0)>=0){r17=HEAP32[r4+56>>2]+HEAP32[r4+92>>2]|0}else{r17=0}__tr_flush_block(r4,r17,HEAP32[r4+108>>2]-HEAP32[r4+92>>2]|0,0);HEAP32[r4+92>>2]=HEAP32[r4+108>>2];_flush_pending(HEAP32[r4>>2]);if((HEAP32[HEAP32[r4>>2]+16>>2]|0)!=0){break}r14=0;r15=r14;return r15}}while(0);r14=1;r15=r14;return r15}}function _read_buf(r1,r2,r3){var r4,r5,r6,r7,r8;r4=r1;r1=r2;r2=r3;r3=HEAP32[r4+4>>2];if(r3>>>0>r2>>>0){r3=r2}if((r3|0)==0){r5=0;r6=r5;return r6}r2=r4+4|0;HEAP32[r2>>2]=HEAP32[r2>>2]-r3;r2=r1;r7=HEAP32[r4>>2];r8=r3;_memcpy(r2,r7,r8)|0;if((HEAP32[HEAP32[r4+28>>2]+24>>2]|0)==1){HEAP32[r4+48>>2]=_adler32(HEAP32[r4+48>>2],r1,r3)}else{if((HEAP32[HEAP32[r4+28>>2]+24>>2]|0)==2){HEAP32[r4+48>>2]=_crc32(HEAP32[r4+48>>2],r1,r3)}}r1=r4|0;HEAP32[r1>>2]=HEAP32[r1>>2]+r3;r1=r4+8|0;HEAP32[r1>>2]=HEAP32[r1>>2]+r3;r5=r3;r6=r5;return r6}function _deflate_stored(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10,r11;r3=0;r4=r1;r1=r2;r2=65535;if(r2>>>0>(HEAP32[r4+12>>2]-5|0)>>>0){r2=HEAP32[r4+12>>2]-5|0}while(1){if(HEAP32[r4+116>>2]>>>0<=1){_fill_window(r4);if((HEAP32[r4+116>>2]|0)==0){if((r1|0)==0){r3=517;break}}if((HEAP32[r4+116>>2]|0)==0){r3=519;break}}r5=r4+108|0;HEAP32[r5>>2]=HEAP32[r5>>2]+HEAP32[r4+116>>2];HEAP32[r4+116>>2]=0;r5=HEAP32[r4+92>>2]+r2|0;if((HEAP32[r4+108>>2]|0)==0){r3=523}else{if(HEAP32[r4+108>>2]>>>0>=r5>>>0){r3=523}}if(r3==523){r3=0;HEAP32[r4+116>>2]=HEAP32[r4+108>>2]-r5;HEAP32[r4+108>>2]=r5;if((HEAP32[r4+92>>2]|0)>=0){r6=HEAP32[r4+56>>2]+HEAP32[r4+92>>2]|0}else{r6=0}__tr_flush_block(r4,r6,HEAP32[r4+108>>2]-HEAP32[r4+92>>2]|0,0);HEAP32[r4+92>>2]=HEAP32[r4+108>>2];_flush_pending(HEAP32[r4>>2]);if((HEAP32[HEAP32[r4>>2]+16>>2]|0)==0){r3=527;break}}if((HEAP32[r4+108>>2]-HEAP32[r4+92>>2]|0)>>>0>=(HEAP32[r4+44>>2]-262|0)>>>0){if((HEAP32[r4+92>>2]|0)>=0){r7=HEAP32[r4+56>>2]+HEAP32[r4+92>>2]|0}else{r7=0}__tr_flush_block(r4,r7,HEAP32[r4+108>>2]-HEAP32[r4+92>>2]|0,0);HEAP32[r4+92>>2]=HEAP32[r4+108>>2];_flush_pending(HEAP32[r4>>2]);if((HEAP32[HEAP32[r4>>2]+16>>2]|0)==0){r3=534;break}}}if(r3==517){r8=0;r9=r8;return r9}else if(r3==519){HEAP32[r4+5812>>2]=0;if((r1|0)==4){if((HEAP32[r4+92>>2]|0)>=0){r10=HEAP32[r4+56>>2]+HEAP32[r4+92>>2]|0}else{r10=0}__tr_flush_block(r4,r10,HEAP32[r4+108>>2]-HEAP32[r4+92>>2]|0,1);HEAP32[r4+92>>2]=HEAP32[r4+108>>2];_flush_pending(HEAP32[r4>>2]);if((HEAP32[HEAP32[r4>>2]+16>>2]|0)==0){r8=2;r9=r8;return r9}else{r8=3;r9=r8;return r9}}do{if((HEAP32[r4+108>>2]|0)>(HEAP32[r4+92>>2]|0)){if((HEAP32[r4+92>>2]|0)>=0){r11=HEAP32[r4+56>>2]+HEAP32[r4+92>>2]|0}else{r11=0}__tr_flush_block(r4,r11,HEAP32[r4+108>>2]-HEAP32[r4+92>>2]|0,0);HEAP32[r4+92>>2]=HEAP32[r4+108>>2];_flush_pending(HEAP32[r4>>2]);if((HEAP32[HEAP32[r4>>2]+16>>2]|0)!=0){break}r8=0;r9=r8;return r9}}while(0);r8=1;r9=r8;return r9}else if(r3==527){r8=0;r9=r8;return r9}else if(r3==534){r8=0;r9=r8;return r9}}function _deflate_fast(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16;r3=0;r4=r1;r1=r2;while(1){if(HEAP32[r4+116>>2]>>>0<262){_fill_window(r4);if(HEAP32[r4+116>>2]>>>0<262){if((r1|0)==0){r3=564;break}}if((HEAP32[r4+116>>2]|0)==0){r3=566;break}}r2=0;if(HEAP32[r4+116>>2]>>>0>=3){HEAP32[r4+72>>2]=(HEAP32[r4+72>>2]<<HEAP32[r4+88>>2]^HEAPU8[HEAP32[r4+56>>2]+(HEAP32[r4+108>>2]+2)|0])&HEAP32[r4+84>>2];r5=HEAP16[HEAP32[r4+68>>2]+(HEAP32[r4+72>>2]<<1)>>1];HEAP16[HEAP32[r4+64>>2]+((HEAP32[r4+108>>2]&HEAP32[r4+52>>2])<<1)>>1]=r5;r2=r5&65535;HEAP16[HEAP32[r4+68>>2]+(HEAP32[r4+72>>2]<<1)>>1]=HEAP32[r4+108>>2]&65535}do{if((r2|0)!=0){if((HEAP32[r4+108>>2]-r2|0)>>>0>(HEAP32[r4+44>>2]-262|0)>>>0){break}HEAP32[r4+96>>2]=_longest_match(r4,r2)}}while(0);if(HEAP32[r4+96>>2]>>>0>=3){r5=HEAP32[r4+96>>2]-3&255;r6=HEAP32[r4+108>>2]-HEAP32[r4+112>>2]&65535;HEAP16[HEAP32[r4+5796>>2]+(HEAP32[r4+5792>>2]<<1)>>1]=r6;r7=r4+5792|0;r8=HEAP32[r7>>2];HEAP32[r7>>2]=r8+1;HEAP8[HEAP32[r4+5784>>2]+r8|0]=r5;r6=r6-1&65535;r8=r4+148+(HEAPU8[13880+(r5&255)|0]+257<<2)|0;HEAP16[r8>>1]=HEAP16[r8>>1]+1&65535;if((r6&65535|0)<256){r9=HEAPU8[14136+(r6&65535)|0]}else{r9=HEAPU8[((r6&65535)>>7)+14392|0]}r6=r4+2440+(r9<<2)|0;HEAP16[r6>>1]=HEAP16[r6>>1]+1&65535;r10=(HEAP32[r4+5792>>2]|0)==(HEAP32[r4+5788>>2]-1|0)|0;r6=r4+116|0;HEAP32[r6>>2]=HEAP32[r6>>2]-HEAP32[r4+96>>2];do{if(HEAP32[r4+96>>2]>>>0<=HEAP32[r4+128>>2]>>>0){if(HEAP32[r4+116>>2]>>>0<3){r3=583;break}r6=r4+96|0;HEAP32[r6>>2]=HEAP32[r6>>2]-1;while(1){r6=r4+108|0;HEAP32[r6>>2]=HEAP32[r6>>2]+1;HEAP32[r4+72>>2]=(HEAP32[r4+72>>2]<<HEAP32[r4+88>>2]^HEAPU8[HEAP32[r4+56>>2]+(HEAP32[r4+108>>2]+2)|0])&HEAP32[r4+84>>2];r6=HEAP16[HEAP32[r4+68>>2]+(HEAP32[r4+72>>2]<<1)>>1];HEAP16[HEAP32[r4+64>>2]+((HEAP32[r4+108>>2]&HEAP32[r4+52>>2])<<1)>>1]=r6;r2=r6&65535;HEAP16[HEAP32[r4+68>>2]+(HEAP32[r4+72>>2]<<1)>>1]=HEAP32[r4+108>>2]&65535;r6=r4+96|0;r8=HEAP32[r6>>2]-1|0;HEAP32[r6>>2]=r8;if((r8|0)==0){break}}r8=r4+108|0;HEAP32[r8>>2]=HEAP32[r8>>2]+1}else{r3=583}}while(0);if(r3==583){r3=0;r2=r4+108|0;HEAP32[r2>>2]=HEAP32[r2>>2]+HEAP32[r4+96>>2];HEAP32[r4+96>>2]=0;HEAP32[r4+72>>2]=HEAPU8[HEAP32[r4+56>>2]+HEAP32[r4+108>>2]|0];HEAP32[r4+72>>2]=(HEAP32[r4+72>>2]<<HEAP32[r4+88>>2]^HEAPU8[HEAP32[r4+56>>2]+(HEAP32[r4+108>>2]+1)|0])&HEAP32[r4+84>>2]}}else{r2=HEAP8[HEAP32[r4+56>>2]+HEAP32[r4+108>>2]|0];HEAP16[HEAP32[r4+5796>>2]+(HEAP32[r4+5792>>2]<<1)>>1]=0;r8=r4+5792|0;r6=HEAP32[r8>>2];HEAP32[r8>>2]=r6+1;HEAP8[HEAP32[r4+5784>>2]+r6|0]=r2;r6=r4+148+((r2&255)<<2)|0;HEAP16[r6>>1]=HEAP16[r6>>1]+1&65535;r10=(HEAP32[r4+5792>>2]|0)==(HEAP32[r4+5788>>2]-1|0)|0;r6=r4+116|0;HEAP32[r6>>2]=HEAP32[r6>>2]-1;r6=r4+108|0;HEAP32[r6>>2]=HEAP32[r6>>2]+1}if((r10|0)!=0){if((HEAP32[r4+92>>2]|0)>=0){r11=HEAP32[r4+56>>2]+HEAP32[r4+92>>2]|0}else{r11=0}__tr_flush_block(r4,r11,HEAP32[r4+108>>2]-HEAP32[r4+92>>2]|0,0);HEAP32[r4+92>>2]=HEAP32[r4+108>>2];_flush_pending(HEAP32[r4>>2]);if((HEAP32[HEAP32[r4>>2]+16>>2]|0)==0){r3=591;break}}}if(r3==564){r12=0;r13=r12;return r13}else if(r3==566){if(HEAP32[r4+108>>2]>>>0<2){r14=HEAP32[r4+108>>2]}else{r14=2}HEAP32[r4+5812>>2]=r14;if((r1|0)==4){if((HEAP32[r4+92>>2]|0)>=0){r15=HEAP32[r4+56>>2]+HEAP32[r4+92>>2]|0}else{r15=0}__tr_flush_block(r4,r15,HEAP32[r4+108>>2]-HEAP32[r4+92>>2]|0,1);HEAP32[r4+92>>2]=HEAP32[r4+108>>2];_flush_pending(HEAP32[r4>>2]);if((HEAP32[HEAP32[r4>>2]+16>>2]|0)==0){r12=2;r13=r12;return r13}else{r12=3;r13=r12;return r13}}do{if((HEAP32[r4+5792>>2]|0)!=0){if((HEAP32[r4+92>>2]|0)>=0){r16=HEAP32[r4+56>>2]+HEAP32[r4+92>>2]|0}else{r16=0}__tr_flush_block(r4,r16,HEAP32[r4+108>>2]-HEAP32[r4+92>>2]|0,0);HEAP32[r4+92>>2]=HEAP32[r4+108>>2];_flush_pending(HEAP32[r4>>2]);if((HEAP32[HEAP32[r4>>2]+16>>2]|0)!=0){break}r12=0;r13=r12;return r13}}while(0);r12=1;r13=r12;return r13}else if(r3==591){r12=0;r13=r12;return r13}}function _deflate_slow(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18;r3=0;r4=r1;r1=r2;L799:while(1){if(HEAP32[r4+116>>2]>>>0<262){_fill_window(r4);if(HEAP32[r4+116>>2]>>>0<262){if((r1|0)==0){r3=623;break}}if((HEAP32[r4+116>>2]|0)==0){r3=625;break}}r2=0;if(HEAP32[r4+116>>2]>>>0>=3){HEAP32[r4+72>>2]=(HEAP32[r4+72>>2]<<HEAP32[r4+88>>2]^HEAPU8[HEAP32[r4+56>>2]+(HEAP32[r4+108>>2]+2)|0])&HEAP32[r4+84>>2];r5=HEAP16[HEAP32[r4+68>>2]+(HEAP32[r4+72>>2]<<1)>>1];HEAP16[HEAP32[r4+64>>2]+((HEAP32[r4+108>>2]&HEAP32[r4+52>>2])<<1)>>1]=r5;r2=r5&65535;HEAP16[HEAP32[r4+68>>2]+(HEAP32[r4+72>>2]<<1)>>1]=HEAP32[r4+108>>2]&65535}HEAP32[r4+120>>2]=HEAP32[r4+96>>2];HEAP32[r4+100>>2]=HEAP32[r4+112>>2];HEAP32[r4+96>>2]=2;do{if((r2|0)!=0){if(HEAP32[r4+120>>2]>>>0>=HEAP32[r4+128>>2]>>>0){break}if((HEAP32[r4+108>>2]-r2|0)>>>0>(HEAP32[r4+44>>2]-262|0)>>>0){break}HEAP32[r4+96>>2]=_longest_match(r4,r2);do{if(HEAP32[r4+96>>2]>>>0<=5){if((HEAP32[r4+136>>2]|0)!=1){if((HEAP32[r4+96>>2]|0)!=3){break}if((HEAP32[r4+108>>2]-HEAP32[r4+112>>2]|0)>>>0<=4096){break}}HEAP32[r4+96>>2]=2}}while(0)}}while(0);do{if(HEAP32[r4+120>>2]>>>0>=3){if(HEAP32[r4+96>>2]>>>0>HEAP32[r4+120>>2]>>>0){r3=656;break}r5=HEAP32[r4+108>>2]+HEAP32[r4+116>>2]-3|0;r6=HEAP32[r4+120>>2]-3&255;r7=HEAP32[r4+108>>2]-1-HEAP32[r4+100>>2]&65535;HEAP16[HEAP32[r4+5796>>2]+(HEAP32[r4+5792>>2]<<1)>>1]=r7;r8=r4+5792|0;r9=HEAP32[r8>>2];HEAP32[r8>>2]=r9+1;HEAP8[HEAP32[r4+5784>>2]+r9|0]=r6;r7=r7-1&65535;r9=r4+148+(HEAPU8[13880+(r6&255)|0]+257<<2)|0;HEAP16[r9>>1]=HEAP16[r9>>1]+1&65535;if((r7&65535|0)<256){r10=HEAPU8[14136+(r7&65535)|0]}else{r10=HEAPU8[((r7&65535)>>7)+14392|0]}r7=r4+2440+(r10<<2)|0;HEAP16[r7>>1]=HEAP16[r7>>1]+1&65535;r11=(HEAP32[r4+5792>>2]|0)==(HEAP32[r4+5788>>2]-1|0)|0;r7=r4+116|0;HEAP32[r7>>2]=HEAP32[r7>>2]-(HEAP32[r4+120>>2]-1);r7=r4+120|0;HEAP32[r7>>2]=HEAP32[r7>>2]-2;while(1){r7=r4+108|0;r9=HEAP32[r7>>2]+1|0;HEAP32[r7>>2]=r9;if(r9>>>0<=r5>>>0){HEAP32[r4+72>>2]=(HEAP32[r4+72>>2]<<HEAP32[r4+88>>2]^HEAPU8[HEAP32[r4+56>>2]+(HEAP32[r4+108>>2]+2)|0])&HEAP32[r4+84>>2];r9=HEAP16[HEAP32[r4+68>>2]+(HEAP32[r4+72>>2]<<1)>>1];HEAP16[HEAP32[r4+64>>2]+((HEAP32[r4+108>>2]&HEAP32[r4+52>>2])<<1)>>1]=r9;r2=r9&65535;HEAP16[HEAP32[r4+68>>2]+(HEAP32[r4+72>>2]<<1)>>1]=HEAP32[r4+108>>2]&65535}r9=r4+120|0;r7=HEAP32[r9>>2]-1|0;HEAP32[r9>>2]=r7;if((r7|0)==0){break}}HEAP32[r4+104>>2]=0;HEAP32[r4+96>>2]=2;r5=r4+108|0;HEAP32[r5>>2]=HEAP32[r5>>2]+1;if((r11|0)!=0){if((HEAP32[r4+92>>2]|0)>=0){r12=HEAP32[r4+56>>2]+HEAP32[r4+92>>2]|0}else{r12=0}__tr_flush_block(r4,r12,HEAP32[r4+108>>2]-HEAP32[r4+92>>2]|0,0);HEAP32[r4+92>>2]=HEAP32[r4+108>>2];_flush_pending(HEAP32[r4>>2]);if((HEAP32[HEAP32[r4>>2]+16>>2]|0)==0){r3=653;break L799}}}else{r3=656}}while(0);if(r3==656){r3=0;if((HEAP32[r4+104>>2]|0)!=0){r2=HEAP8[HEAP32[r4+56>>2]+(HEAP32[r4+108>>2]-1)|0];HEAP16[HEAP32[r4+5796>>2]+(HEAP32[r4+5792>>2]<<1)>>1]=0;r5=r4+5792|0;r7=HEAP32[r5>>2];HEAP32[r5>>2]=r7+1;HEAP8[HEAP32[r4+5784>>2]+r7|0]=r2;r7=r4+148+((r2&255)<<2)|0;HEAP16[r7>>1]=HEAP16[r7>>1]+1&65535;r11=(HEAP32[r4+5792>>2]|0)==(HEAP32[r4+5788>>2]-1|0)|0;if((r11|0)!=0){if((HEAP32[r4+92>>2]|0)>=0){r13=HEAP32[r4+56>>2]+HEAP32[r4+92>>2]|0}else{r13=0}__tr_flush_block(r4,r13,HEAP32[r4+108>>2]-HEAP32[r4+92>>2]|0,0);HEAP32[r4+92>>2]=HEAP32[r4+108>>2];_flush_pending(HEAP32[r4>>2])}r7=r4+108|0;HEAP32[r7>>2]=HEAP32[r7>>2]+1;r7=r4+116|0;HEAP32[r7>>2]=HEAP32[r7>>2]-1;if((HEAP32[HEAP32[r4>>2]+16>>2]|0)==0){r3=663;break}}else{HEAP32[r4+104>>2]=1;r7=r4+108|0;HEAP32[r7>>2]=HEAP32[r7>>2]+1;r7=r4+116|0;HEAP32[r7>>2]=HEAP32[r7>>2]-1}}}if(r3==663){r14=0;r15=r14;return r15}else if(r3==623){r14=0;r15=r14;return r15}else if(r3==625){if((HEAP32[r4+104>>2]|0)!=0){r13=HEAP8[HEAP32[r4+56>>2]+(HEAP32[r4+108>>2]-1)|0];HEAP16[HEAP32[r4+5796>>2]+(HEAP32[r4+5792>>2]<<1)>>1]=0;r12=r4+5792|0;r10=HEAP32[r12>>2];HEAP32[r12>>2]=r10+1;HEAP8[HEAP32[r4+5784>>2]+r10|0]=r13;r10=r4+148+((r13&255)<<2)|0;HEAP16[r10>>1]=HEAP16[r10>>1]+1&65535;r11=(HEAP32[r4+5792>>2]|0)==(HEAP32[r4+5788>>2]-1|0)|0;HEAP32[r4+104>>2]=0}if(HEAP32[r4+108>>2]>>>0<2){r16=HEAP32[r4+108>>2]}else{r16=2}HEAP32[r4+5812>>2]=r16;if((r1|0)==4){if((HEAP32[r4+92>>2]|0)>=0){r17=HEAP32[r4+56>>2]+HEAP32[r4+92>>2]|0}else{r17=0}__tr_flush_block(r4,r17,HEAP32[r4+108>>2]-HEAP32[r4+92>>2]|0,1);HEAP32[r4+92>>2]=HEAP32[r4+108>>2];_flush_pending(HEAP32[r4>>2]);if((HEAP32[HEAP32[r4>>2]+16>>2]|0)==0){r14=2;r15=r14;return r15}else{r14=3;r15=r14;return r15}}do{if((HEAP32[r4+5792>>2]|0)!=0){if((HEAP32[r4+92>>2]|0)>=0){r18=HEAP32[r4+56>>2]+HEAP32[r4+92>>2]|0}else{r18=0}__tr_flush_block(r4,r18,HEAP32[r4+108>>2]-HEAP32[r4+92>>2]|0,0);HEAP32[r4+92>>2]=HEAP32[r4+108>>2];_flush_pending(HEAP32[r4>>2]);if((HEAP32[HEAP32[r4>>2]+16>>2]|0)!=0){break}r14=0;r15=r14;return r15}}while(0);r14=1;r15=r14;return r15}else if(r3==653){r14=0;r15=r14;return r15}}function _longest_match(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22;r3=0;r4=r1;r1=r2;r2=HEAP32[r4+124>>2];r5=HEAP32[r4+56>>2]+HEAP32[r4+108>>2]|0;r6=HEAP32[r4+120>>2];r7=HEAP32[r4+144>>2];if(HEAP32[r4+108>>2]>>>0>(HEAP32[r4+44>>2]-262|0)>>>0){r8=HEAP32[r4+108>>2]-(HEAP32[r4+44>>2]-262)|0}else{r8=0}r9=r8;r8=HEAP32[r4+64>>2];r10=HEAP32[r4+52>>2];r11=HEAP32[r4+56>>2]+HEAP32[r4+108>>2]+258|0;r12=HEAP8[r5+(r6-1)|0];r13=HEAP8[r5+r6|0];if(HEAP32[r4+120>>2]>>>0>=HEAP32[r4+140>>2]>>>0){r2=r2>>>2}if(r7>>>0>HEAP32[r4+116>>2]>>>0){r7=HEAP32[r4+116>>2]}L911:while(1){r14=HEAP32[r4+56>>2]+r1|0;do{if((HEAPU8[r14+r6|0]|0)!=(r13&255|0)){r3=708}else{if((HEAPU8[r14+(r6-1)|0]|0)!=(r12&255|0)){r3=708;break}if((HEAPU8[r14]|0)!=(HEAPU8[r5]|0)){r3=708;break}r15=r14+1|0;r14=r15;if((HEAPU8[r15]|0)!=(HEAPU8[r5+1|0]|0)){r3=708;break}r5=r5+2|0;r14=r14+1|0;while(1){r15=r5+1|0;r5=r15;r16=r14+1|0;r14=r16;do{if((HEAPU8[r15]|0)==(HEAPU8[r16]|0)){r17=r5+1|0;r5=r17;r18=r14+1|0;r14=r18;if((HEAPU8[r17]|0)!=(HEAPU8[r18]|0)){r19=0;break}r18=r5+1|0;r5=r18;r17=r14+1|0;r14=r17;if((HEAPU8[r18]|0)!=(HEAPU8[r17]|0)){r19=0;break}r17=r5+1|0;r5=r17;r18=r14+1|0;r14=r18;if((HEAPU8[r17]|0)!=(HEAPU8[r18]|0)){r19=0;break}r18=r5+1|0;r5=r18;r17=r14+1|0;r14=r17;if((HEAPU8[r18]|0)!=(HEAPU8[r17]|0)){r19=0;break}r17=r5+1|0;r5=r17;r18=r14+1|0;r14=r18;if((HEAPU8[r17]|0)!=(HEAPU8[r18]|0)){r19=0;break}r18=r5+1|0;r5=r18;r17=r14+1|0;r14=r17;if((HEAPU8[r18]|0)!=(HEAPU8[r17]|0)){r19=0;break}r17=r5+1|0;r5=r17;r18=r14+1|0;r14=r18;if((HEAPU8[r17]|0)!=(HEAPU8[r18]|0)){r19=0;break}r19=r5>>>0<r11>>>0}else{r19=0}}while(0);if(!r19){break}}r16=258-(r11-r5)|0;r5=r11-258|0;if((r16|0)>(r6|0)){HEAP32[r4+112>>2]=r1;r6=r16;if((r16|0)>=(r7|0)){r3=723;break L911}r12=HEAP8[r5+(r6-1)|0];r13=HEAP8[r5+r6|0]}}}while(0);if(r3==708){r3=0}r14=HEAPU16[r8+((r1&r10)<<1)>>1];r1=r14;if(r14>>>0>r9>>>0){r14=r2-1|0;r2=r14;r20=(r14|0)!=0}else{r20=0}if(!r20){break}}if(r6>>>0<=HEAP32[r4+116>>2]>>>0){r21=r6;r22=r21;return r22}else{r21=HEAP32[r4+116>>2];r22=r21;return r22}}function _inflateResetKeep(r1){var r2,r3,r4,r5;r2=r1;do{if((r2|0)!=0){if((HEAP32[r2+28>>2]|0)==0){break}r1=HEAP32[r2+28>>2];HEAP32[r1+28>>2]=0;HEAP32[r2+20>>2]=0;HEAP32[r2+8>>2]=0;HEAP32[r2+24>>2]=0;if((HEAP32[r1+8>>2]|0)!=0){HEAP32[r2+48>>2]=HEAP32[r1+8>>2]&1}HEAP32[r1>>2]=0;HEAP32[r1+4>>2]=0;HEAP32[r1+12>>2]=0;HEAP32[r1+20>>2]=32768;HEAP32[r1+32>>2]=0;HEAP32[r1+56>>2]=0;HEAP32[r1+60>>2]=0;r3=r1+1328|0;HEAP32[r1+108>>2]=r3;HEAP32[r1+80>>2]=r3;HEAP32[r1+76>>2]=r3;HEAP32[r1+7104>>2]=1;HEAP32[r1+7108>>2]=-1;r4=0;r5=r4;return r5}}while(0);r4=-2;r5=r4;return r5}function _inflateReset(r1){var r2,r3,r4;r2=r1;do{if((r2|0)!=0){if((HEAP32[r2+28>>2]|0)==0){break}r1=HEAP32[r2+28>>2];HEAP32[r1+40>>2]=0;HEAP32[r1+44>>2]=0;HEAP32[r1+48>>2]=0;r3=_inflateResetKeep(r2);r4=r3;return r4}}while(0);r3=-2;r4=r3;return r4}function _inflateReset2(r1,r2){var r3,r4,r5,r6;r3=r1;r1=r2;do{if((r3|0)!=0){if((HEAP32[r3+28>>2]|0)==0){break}r2=HEAP32[r3+28>>2];if((r1|0)<0){r4=0;r1=-r1|0}else{r4=(r1>>4)+1|0;if((r1|0)<48){r1=r1&15}}do{if((r1|0)!=0){if((r1|0)>=8){if((r1|0)<=15){break}}r5=-2;r6=r5;return r6}}while(0);do{if((HEAP32[r2+52>>2]|0)!=0){if((HEAP32[r2+36>>2]|0)==(r1|0)){break}FUNCTION_TABLE[HEAP32[r3+36>>2]](HEAP32[r3+40>>2],HEAP32[r2+52>>2]);HEAP32[r2+52>>2]=0}}while(0);HEAP32[r2+8>>2]=r4;HEAP32[r2+36>>2]=r1;r5=_inflateReset(r3);r6=r5;return r6}}while(0);r5=-2;r6=r5;return r6}function _inflateInit2_(r1,r2,r3,r4){var r5,r6,r7,r8;r5=r1;r1=r2;r2=r3;r3=r4;do{if((r2|0)!=0){if((HEAP8[r2|0]|0)!=(HEAP8[13432]|0)){break}if((r3|0)!=56){break}if((r5|0)==0){r6=-2;r7=r6;return r7}HEAP32[r5+24>>2]=0;if((HEAP32[r5+32>>2]|0)==0){HEAP32[r5+32>>2]=4;HEAP32[r5+40>>2]=0}if((HEAP32[r5+36>>2]|0)==0){HEAP32[r5+36>>2]=6}r4=FUNCTION_TABLE[HEAP32[r5+32>>2]](HEAP32[r5+40>>2],1,7116);if((r4|0)==0){r6=-4;r7=r6;return r7}HEAP32[r5+28>>2]=r4;HEAP32[r4+52>>2]=0;r8=_inflateReset2(r5,r1);if((r8|0)!=0){FUNCTION_TABLE[HEAP32[r5+36>>2]](HEAP32[r5+40>>2],r4);HEAP32[r5+28>>2]=0}r6=r8;r7=r6;return r7}}while(0);r6=-6;r7=r6;return r7}function _inflateInit_(r1,r2,r3){return _inflateInit2_(r1,15,r2,r3)}function _inflate(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36,r37,r38,r39,r40,r41,r42,r43,r44,r45,r46,r47,r48,r49,r50,r51,r52,r53,r54,r55,r56,r57,r58,r59,r60,r61,r62,r63,r64,r65,r66,r67,r68,r69,r70,r71,r72,r73,r74,r75,r76,r77,r78,r79,r80,r81,r82,r83,r84,r85,r86,r87,r88,r89,r90,r91,r92,r93,r94,r95,r96,r97,r98,r99,r100,r101,r102,r103,r104,r105,r106,r107,r108,r109,r110,r111,r112,r113,r114,r115,r116,r117,r118,r119,r120,r121,r122,r123,r124,r125,r126,r127,r128,r129,r130,r131,r132,r133,r134,r135,r136,r137,r138,r139,r140,r141,r142,r143,r144,r145,r146,r147,r148,r149,r150,r151,r152,r153,r154,r155,r156,r157,r158,r159,r160,r161,r162,r163,r164,r165,r166,r167,r168,r169,r170,r171,r172,r173,r174,r175,r176,r177,r178,r179,r180,r181,r182,r183,r184,r185,r186,r187,r188,r189,r190,r191,r192,r193,r194,r195,r196,r197,r198,r199,r200,r201,r202,r203,r204,r205,r206,r207,r208,r209,r210,r211,r212,r213,r214,r215,r216,r217,r218,r219,r220,r221,r222,r223,r224,r225,r226,r227,r228,r229,r230,r231,r232,r233,r234,r235,r236,r237,r238,r239,r240,r241,r242,r243,r244,r245,r246,r247,r248,r249,r250,r251,r252,r253,r254,r255,r256,r257,r258,r259,r260,r261,r262,r263,r264,r265,r266,r267,r268,r269,r270,r271,r272,r273,r274,r275,r276,r277,r278,r279,r280,r281,r282,r283,r284,r285,r286,r287,r288,r289,r290,r291,r292,r293,r294,r295,r296,r297,r298,r299,r300,r301,r302,r303,r304,r305,r306,r307,r308,r309,r310,r311,r312,r313,r314,r315,r316,r317,r318,r319,r320,r321,r322,r323,r324,r325,r326,r327,r328,r329,r330,r331,r332,r333,r334,r335,r336,r337,r338,r339,r340,r341,r342,r343,r344,r345,r346,r347,r348,r349,r350,r351,r352,r353,r354,r355,r356,r357,r358,r359,r360,r361,r362,r363,r364,r365,r366,r367,r368,r369,r370,r371,r372,r373,r374,r375,r376,r377,r378,r379,r380,r381,r382,r383,r384,r385,r386,r387,r388,r389,r390,r391,r392,r393,r394,r395,r396,r397,r398,r399,r400,r401,r402,r403,r404,r405,r406,r407,r408,r409,r410,r411,r412,r413,r414,r415,r416,r417,r418,r419,r420,r421,r422,r423,r424,r425,r426,r427,r428,r429,r430,r431,r432,r433,r434,r435,r436,r437,r438,r439,r440,r441,r442,r443,r444,r445,r446,r447,r448,r449,r450,r451,r452,r453,r454,r455,r456,r457,r458,r459,r460,r461,r462,r463,r464,r465,r466,r467,r468,r469,r470,r471,r472,r473,r474,r475,r476,r477,r478,r479,r480,r481,r482,r483,r484,r485,r486,r487,r488,r489,r490,r491,r492,r493,r494,r495,r496,r497,r498,r499,r500,r501,r502,r503,r504,r505,r506,r507,r508,r509,r510,r511,r512,r513,r514,r515,r516,r517,r518,r519,r520,r521,r522,r523,r524,r525,r526,r527,r528,r529,r530,r531,r532,r533,r534,r535,r536,r537,r538,r539,r540,r541,r542,r543,r544,r545,r546,r547,r548,r549,r550,r551,r552,r553,r554,r555,r556,r557,r558,r559,r560,r561,r562,r563,r564,r565,r566,r567,r568,r569,r570,r571,r572,r573,r574,r575,r576,r577,r578,r579,r580,r581,r582,r583,r584,r585,r586,r587,r588,r589,r590,r591,r592,r593,r594,r595,r596,r597,r598,r599,r600,r601,r602,r603,r604,r605,r606,r607,r608,r609,r610,r611,r612,r613,r614,r615,r616,r617,r618,r619,r620,r621,r622,r623,r624,r625,r626,r627,r628,r629,r630,r631,r632,r633,r634,r635,r636,r637,r638,r639,r640,r641,r642,r643,r644,r645,r646,r647,r648,r649,r650,r651,r652,r653,r654,r655,r656,r657,r658,r659,r660,r661,r662,r663,r664,r665,r666,r667,r668,r669,r670,r671,r672,r673,r674,r675,r676,r677,r678,r679,r680,r681,r682,r683,r684,r685,r686,r687,r688,r689,r690,r691,r692,r693,r694,r695,r696,r697,r698,r699,r700,r701,r702,r703,r704,r705,r706,r707,r708,r709,r710,r711,r712,r713,r714,r715,r716,r717,r718,r719,r720,r721,r722,r723,r724,r725,r726,r727,r728,r729,r730,r731,r732,r733,r734,r735,r736,r737,r738,r739,r740,r741,r742,r743,r744,r745,r746,r747,r748,r749,r750,r751,r752,r753,r754,r755,r756,r757,r758,r759,r760,r761,r762,r763,r764,r765,r766,r767,r768,r769,r770,r771,r772,r773,r774,r775,r776,r777,r778,r779,r780,r781,r782,r783,r784,r785,r786,r787,r788,r789,r790,r791,r792,r793,r794,r795,r796,r797,r798,r799,r800,r801,r802,r803,r804,r805,r806,r807,r808,r809,r810,r811,r812,r813,r814,r815,r816,r817,r818,r819,r820,r821,r822,r823,r824,r825,r826,r827,r828,r829,r830,r831,r832,r833,r834,r835,r836,r837,r838,r839,r840,r841,r842,r843,r844,r845,r846,r847,r848,r849,r850,r851,r852,r853,r854,r855,r856,r857,r858,r859,r860,r861,r862,r863,r864,r865,r866,r867,r868,r869,r870,r871,r872,r873,r874,r875,r876,r877,r878,r879,r880,r881,r882,r883,r884,r885,r886,r887,r888,r889,r890,r891,r892,r893,r894,r895,r896,r897,r898,r899,r900,r901,r902,r903,r904,r905,r906,r907,r908,r909,r910,r911,r912,r913,r914,r915,r916,r917,r918,r919,r920,r921,r922,r923,r924,r925,r926,r927,r928,r929,r930,r931,r932,r933,r934,r935,r936,r937,r938,r939,r940,r941,r942,r943,r944,r945,r946,r947,r948,r949,r950,r951,r952,r953,r954,r955,r956,r957,r958,r959,r960,r961,r962,r963,r964,r965,r966,r967,r968,r969,r970,r971,r972,r973,r974,r975,r976,r977,r978,r979,r980,r981,r982,r983,r984,r985,r986,r987,r988,r989,r990,r991,r992,r993,r994,r995,r996,r997,r998,r999,r1000,r1001,r1002,r1003,r1004,r1005,r1006,r1007,r1008,r1009,r1010,r1011,r1012,r1013,r1014,r1015,r1016,r1017,r1018,r1019,r1020,r1021,r1022,r1023,r1024,r1025,r1026,r1027,r1028,r1029,r1030,r1031,r1032,r1033,r1034,r1035,r1036,r1037,r1038,r1039,r1040,r1041,r1042,r1043,r1044,r1045,r1046,r1047,r1048,r1049,r1050,r1051,r1052,r1053,r1054,r1055,r1056,r1057,r1058,r1059,r1060,r1061,r1062,r1063,r1064,r1065,r1066,r1067,r1068,r1069,r1070,r1071,r1072,r1073,r1074,r1075,r1076,r1077,r1078,r1079,r1080,r1081,r1082,r1083,r1084,r1085,r1086,r1087,r1088,r1089,r1090,r1091,r1092,r1093,r1094,r1095,r1096,r1097,r1098,r1099,r1100,r1101,r1102,r1103,r1104,r1105,r1106,r1107,r1108,r1109,r1110,r1111,r1112,r1113,r1114,r1115,r1116,r1117,r1118,r1119,r1120,r1121,r1122,r1123,r1124,r1125,r1126,r1127,r1128,r1129,r1130,r1131,r1132,r1133,r1134,r1135,r1136,r1137,r1138,r1139,r1140,r1141,r1142,r1143,r1144,r1145,r1146,r1147,r1148,r1149,r1150,r1151,r1152,r1153,r1154,r1155,r1156,r1157,r1158,r1159,r1160,r1161,r1162,r1163,r1164,r1165,r1166,r1167,r1168,r1169,r1170,r1171,r1172,r1173,r1174,r1175,r1176,r1177,r1178,r1179,r1180,r1181,r1182,r1183,r1184,r1185,r1186,r1187,r1188,r1189,r1190,r1191,r1192,r1193,r1194,r1195,r1196,r1197,r1198,r1199,r1200,r1201,r1202,r1203,r1204,r1205,r1206,r1207,r1208,r1209,r1210,r1211,r1212,r1213,r1214,r1215,r1216,r1217,r1218,r1219,r1220,r1221,r1222,r1223,r1224,r1225,r1226,r1227,r1228,r1229,r1230,r1231,r1232,r1233,r1234,r1235,r1236,r1237,r1238,r1239,r1240,r1241,r1242,r1243,r1244,r1245,r1246,r1247,r1248,r1249,r1250,r1251,r1252,r1253,r1254,r1255,r1256,r1257,r1258,r1259,r1260,r1261,r1262,r1263,r1264,r1265,r1266,r1267,r1268,r1269,r1270,r1271,r1272,r1273,r1274,r1275,r1276,r1277,r1278,r1279,r1280,r1281,r1282,r1283,r1284,r1285,r1286,r1287,r1288,r1289,r1290,r1291,r1292,r1293,r1294,r1295,r1296,r1297,r1298,r1299,r1300,r1301,r1302,r1303,r1304,r1305,r1306,r1307,r1308,r1309,r1310,r1311,r1312,r1313,r1314,r1315,r1316,r1317,r1318,r1319,r1320,r1321,r1322,r1323,r1324,r1325,r1326,r1327,r1328,r1329,r1330,r1331,r1332,r1333,r1334,r1335,r1336,r1337,r1338,r1339,r1340,r1341,r1342,r1343,r1344,r1345,r1346,r1347,r1348,r1349,r1350,r1351,r1352,r1353,r1354,r1355,r1356,r1357,r1358,r1359,r1360,r1361,r1362,r1363,r1364,r1365,r1366,r1367,r1368,r1369,r1370,r1371,r1372,r1373,r1374,r1375,r1376,r1377,r1378,r1379,r1380,r1381,r1382,r1383,r1384,r1385,r1386,r1387,r1388,r1389,r1390,r1391,r1392,r1393,r1394,r1395,r1396,r1397,r1398,r1399,r1400,r1401,r1402,r1403,r1404,r1405,r1406,r1407,r1408,r1409,r1410,r1411,r1412,r1413,r1414,r1415,r1416,r1417,r1418,r1419,r1420,r1421,r1422,r1423,r1424,r1425,r1426,r1427,r1428,r1429,r1430,r1431,r1432,r1433,r1434,r1435,r1436,r1437,r1438,r1439,r1440,r1441,r1442,r1443,r1444,r1445,r1446,r1447,r1448,r1449,r1450,r1451,r1452,r1453,r1454,r1455,r1456,r1457,r1458,r1459,r1460,r1461,r1462,r1463,r1464,r1465,r1466,r1467,r1468,r1469,r1470,r1471,r1472,r1473,r1474,r1475,r1476,r1477,r1478,r1479,r1480,r1481,r1482,r1483,r1484,r1485,r1486,r1487,r1488,r1489,r1490,r1491,r1492,r1493,r1494,r1495,r1496,r1497,r1498,r1499,r1500,r1501,r1502,r1503,r1504,r1505,r1506,r1507,r1508,r1509,r1510,r1511,r1512,r1513,r1514,r1515,r1516,r1517,r1518,r1519,r1520,r1521,r1522,r1523,r1524,r1525,r1526,r1527,r1528,r1529,r1530,r1531,r1532,r1533,r1534,r1535,r1536,r1537,r1538,r1539,r1540,r1541,r1542,r1543,r1544,r1545,r1546,r1547,r1548,r1549,r1550,r1551,r1552,r1553,r1554,r1555,r1556,r1557,r1558,r1559,r1560,r1561,r1562,r1563,r1564,r1565,r1566,r1567,r1568,r1569,r1570,r1571,r1572,r1573,r1574,r1575,r1576,r1577,r1578,r1579,r1580,r1581,r1582,r1583,r1584,r1585,r1586,r1587,r1588,r1589,r1590,r1591,r1592,r1593,r1594,r1595,r1596,r1597,r1598,r1599,r1600,r1601,r1602,r1603,r1604,r1605,r1606,r1607,r1608,r1609,r1610,r1611,r1612,r1613,r1614,r1615,r1616,r1617,r1618,r1619,r1620,r1621,r1622,r1623,r1624,r1625,r1626,r1627,r1628,r1629,r1630,r1631,r1632,r1633,r1634,r1635,r1636,r1637,r1638,r1639,r1640,r1641,r1642,r1643,r1644,r1645,r1646,r1647,r1648,r1649,r1650,r1651,r1652,r1653,r1654,r1655,r1656,r1657,r1658,r1659,r1660,r1661,r1662,r1663,r1664,r1665,r1666,r1667,r1668,r1669,r1670,r1671,r1672,r1673,r1674,r1675,r1676,r1677,r1678,r1679,r1680,r1681,r1682,r1683,r1684,r1685,r1686,r1687,r1688,r1689,r1690,r1691,r1692,r1693,r1694,r1695,r1696,r1697,r1698,r1699,r1700,r1701,r1702,r1703,r1704,r1705,r1706,r1707,r1708,r1709,r1710,r1711,r1712,r1713,r1714,r1715,r1716,r1717,r1718,r1719,r1720,r1721,r1722,r1723,r1724,r1725,r1726,r1727,r1728,r1729,r1730,r1731,r1732,r1733,r1734,r1735,r1736,r1737,r1738,r1739,r1740,r1741,r1742,r1743,r1744,r1745,r1746,r1747,r1748,r1749,r1750,r1751,r1752,r1753,r1754,r1755,r1756,r1757,r1758,r1759,r1760,r1761,r1762,r1763,r1764,r1765,r1766,r1767,r1768,r1769,r1770,r1771,r1772,r1773,r1774,r1775,r1776,r1777,r1778,r1779,r1780,r1781,r1782,r1783,r1784,r1785,r1786,r1787,r1788,r1789,r1790,r1791,r1792,r1793,r1794,r1795,r1796,r1797,r1798,r1799,r1800,r1801,r1802,r1803,r1804,r1805,r1806,r1807,r1808,r1809,r1810,r1811,r1812,r1813,r1814,r1815,r1816,r1817,r1818,r1819,r1820,r1821,r1822,r1823,r1824,r1825,r1826,r1827,r1828,r1829,r1830,r1831,r1832,r1833,r1834,r1835,r1836,r1837,r1838,r1839,r1840,r1841,r1842,r1843,r1844,r1845,r1846,r1847,r1848,r1849,r1850,r1851,r1852,r1853,r1854,r1855,r1856,r1857,r1858,r1859,r1860,r1861,r1862,r1863,r1864,r1865,r1866,r1867,r1868,r1869,r1870,r1871,r1872,r1873,r1874,r1875,r1876,r1877,r1878,r1879,r1880,r1881,r1882,r1883,r1884,r1885,r1886,r1887,r1888,r1889,r1890,r1891,r1892,r1893,r1894,r1895,r1896,r1897,r1898,r1899,r1900,r1901,r1902,r1903,r1904,r1905,r1906,r1907,r1908,r1909,r1910,r1911,r1912,r1913,r1914,r1915,r1916,r1917,r1918,r1919,r1920,r1921,r1922,r1923,r1924,r1925,r1926,r1927,r1928,r1929,r1930,r1931,r1932,r1933,r1934,r1935,r1936,r1937,r1938,r1939,r1940,r1941,r1942,r1943,r1944,r1945,r1946,r1947,r1948,r1949,r1950,r1951,r1952,r1953,r1954,r1955,r1956,r1957,r1958,r1959,r1960,r1961,r1962,r1963,r1964,r1965,r1966,r1967,r1968,r1969,r1970,r1971,r1972,r1973,r1974,r1975,r1976,r1977,r1978,r1979,r1980,r1981,r1982,r1983,r1984,r1985,r1986,r1987,r1988,r1989,r1990,r1991,r1992,r1993,r1994,r1995,r1996,r1997,r1998,r1999,r2000,r2001,r2002,r2003,r2004,r2005,r2006,r2007,r2008,r2009,r2010,r2011,r2012,r2013,r2014,r2015,r2016,r2017,r2018,r2019,r2020,r2021,r2022,r2023,r2024,r2025,r2026,r2027,r2028,r2029,r2030,r2031,r2032,r2033,r2034,r2035,r2036,r2037,r2038,r2039,r2040,r2041,r2042,r2043,r2044,r2045,r2046,r2047,r2048,r2049,r2050,r2051,r2052,r2053,r2054,r2055,r2056,r2057,r2058,r2059,r2060,r2061,r2062,r2063,r2064,r2065,r2066,r2067,r2068,r2069,r2070,r2071,r2072,r2073,r2074,r2075,r2076,r2077,r2078,r2079,r2080,r2081,r2082,r2083,r2084,r2085,r2086,r2087,r2088,r2089,r2090,r2091,r2092,r2093,r2094,r2095,r2096,r2097,r2098,r2099,r2100,r2101,r2102,r2103,r2104,r2105,r2106,r2107,r2108,r2109,r2110,r2111,r2112,r2113,r2114,r2115,r2116,r2117,r2118,r2119,r2120,r2121,r2122,r2123,r2124,r2125,r2126,r2127,r2128,r2129,r2130,r2131,r2132,r2133,r2134,r2135,r2136,r2137,r2138,r2139,r2140,r2141,r2142,r2143,r2144,r2145,r2146,r2147,r2148,r2149,r2150,r2151,r2152,r2153,r2154,r2155,r2156,r2157,r2158,r2159,r2160,r2161,r2162,r2163,r2164,r2165,r2166,r2167,r2168,r2169,r2170,r2171,r2172,r2173,r2174,r2175,r2176,r2177,r2178,r2179,r2180,r2181,r2182,r2183,r2184,r2185,r2186,r2187,r2188,r2189,r2190,r2191,r2192,r2193,r2194,r2195,r2196,r2197,r2198,r2199,r2200,r2201,r2202,r2203,r2204,r2205,r2206,r2207,r2208,r2209,r2210,r2211,r2212,r2213,r2214,r2215,r2216,r2217,r2218,r2219,r2220,r2221,r2222,r2223,r2224,r2225,r2226,r2227,r2228,r2229,r2230,r2231,r2232,r2233,r2234,r2235,r2236,r2237,r2238,r2239,r2240,r2241,r2242,r2243,r2244,r2245,r2246,r2247,r2248,r2249,r2250,r2251,r2252,r2253,r2254,r2255,r2256,r2257,r2258,r2259,r2260,r2261,r2262,r2263;r3=0;r4=STACKTOP;STACKTOP=STACKTOP+24|0;r5=r4;r6=r4+8;r7=r4+16;r8=r1;r9=r2;r10=r8;r11=(r10|0)==0;do{if(!r11){r12=r8;r13=r12+28|0;r14=HEAP32[r13>>2];r15=(r14|0)==0;if(r15){break}r16=r8;r17=r16+12|0;r18=HEAP32[r17>>2];r19=(r18|0)==0;if(r19){break}r20=r8;r21=r20|0;r22=HEAP32[r21>>2];r23=(r22|0)==0;if(r23){r24=r8;r25=r24+4|0;r26=HEAP32[r25>>2];r27=(r26|0)!=0;if(r27){break}}r28=r8;r29=r28+28|0;r30=HEAP32[r29>>2];r31=r30;r32=r31;r33=r32;r34=r33|0;r35=HEAP32[r34>>2];r36=(r35|0)==11;if(r36){r37=r32;r38=r37|0;HEAP32[r38>>2]=12}r39=r8;r40=r39+12|0;r41=HEAP32[r40>>2];r42=r41;r43=r8;r44=r43+16|0;r45=HEAP32[r44>>2];r46=r45;r47=r8;r48=r47|0;r49=HEAP32[r48>>2];r50=r49;r51=r8;r52=r51+4|0;r53=HEAP32[r52>>2];r54=r53;r55=r32;r56=r55+56|0;r57=HEAP32[r56>>2];r58=r57;r59=r32;r60=r59+60|0;r61=HEAP32[r60>>2];r62=r61;r63=r54;r64=r63;r65=r46;r66=r65;r67=0;L1031:while(1){r68=r32;r69=r68|0;r70=HEAP32[r69>>2];L1033:do{switch(r70|0){case 5:{r3=920;break};case 1:{while(1){r71=r62;r72=r71>>>0<16;if(!r72){break}r73=r54;r74=(r73|0)==0;if(r74){r3=844;break L1031}r75=r54;r76=r75-1|0;r54=r76;r77=r50;r78=r77+1|0;r50=r78;r79=HEAP8[r77];r80=r79&255;r81=r62;r82=r80<<r81;r83=r58;r84=r83+r82|0;r58=r84;r85=r62;r86=r85+8|0;r62=r86}r87=r58;r88=r32;r89=r88+16|0;HEAP32[r89>>2]=r87;r90=r32;r91=r90+16|0;r92=HEAP32[r91>>2];r93=r92&255;r94=(r93|0)!=8;if(r94){r95=r8;r96=r95+24|0;HEAP32[r96>>2]=13344;r97=r32;r98=r97|0;HEAP32[r98>>2]=29;break L1033}r99=r32;r100=r99+16|0;r101=HEAP32[r100>>2];r102=r101&57344;r103=(r102|0)!=0;if(r103){r104=r8;r105=r104+24|0;HEAP32[r105>>2]=13192;r106=r32;r107=r106|0;HEAP32[r107>>2]=29;break L1033}r108=r32;r109=r108+32|0;r110=HEAP32[r109>>2];r111=(r110|0)!=0;if(r111){r112=r58;r113=r112>>>8;r114=r113&1;r115=r32;r116=r115+32|0;r117=HEAP32[r116>>2];r118=r117|0;HEAP32[r118>>2]=r114}r119=r32;r120=r119+16|0;r121=HEAP32[r120>>2];r122=r121&512;r123=(r122|0)!=0;if(r123){r124=r58;r125=r124&255;r126=r7|0;HEAP8[r126]=r125;r127=r58;r128=r127>>>8;r129=r128&255;r130=r7+1|0;HEAP8[r130]=r129;r131=r32;r132=r131+24|0;r133=HEAP32[r132>>2];r134=r7|0;r135=_crc32(r133,r134,2);r136=r32;r137=r136+24|0;HEAP32[r137>>2]=r135}r58=0;r62=0;r138=r32;r139=r138|0;HEAP32[r139>>2]=2;r3=861;break};case 0:{r140=r32;r141=r140+8|0;r142=HEAP32[r141>>2];r143=(r142|0)==0;if(r143){r144=r32;r145=r144|0;HEAP32[r145>>2]=12;break L1033}while(1){r146=r62;r147=r146>>>0<16;if(!r147){break}r148=r54;r149=(r148|0)==0;if(r149){r3=811;break L1031}r150=r54;r151=r150-1|0;r54=r151;r152=r50;r153=r152+1|0;r50=r153;r154=HEAP8[r152];r155=r154&255;r156=r62;r157=r155<<r156;r158=r58;r159=r158+r157|0;r58=r159;r160=r62;r161=r160+8|0;r62=r161}r162=r32;r163=r162+8|0;r164=HEAP32[r163>>2];r165=r164&2;r166=(r165|0)!=0;do{if(r166){r167=r58;r168=(r167|0)==35615;if(!r168){break}r169=_crc32(0,0,0);r170=r32;r171=r170+24|0;HEAP32[r171>>2]=r169;r172=r58;r173=r172&255;r174=r7|0;HEAP8[r174]=r173;r175=r58;r176=r175>>>8;r177=r176&255;r178=r7+1|0;HEAP8[r178]=r177;r179=r32;r180=r179+24|0;r181=HEAP32[r180>>2];r182=r7|0;r183=_crc32(r181,r182,2);r184=r32;r185=r184+24|0;HEAP32[r185>>2]=r183;r58=0;r62=0;r186=r32;r187=r186|0;HEAP32[r187>>2]=1;break L1033}}while(0);r188=r32;r189=r188+16|0;HEAP32[r189>>2]=0;r190=r32;r191=r190+32|0;r192=HEAP32[r191>>2];r193=(r192|0)!=0;if(r193){r194=r32;r195=r194+32|0;r196=HEAP32[r195>>2];r197=r196+48|0;HEAP32[r197>>2]=-1}r198=r32;r199=r198+8|0;r200=HEAP32[r199>>2];r201=r200&1;r202=(r201|0)!=0;do{if(r202){r203=r58;r204=r203&255;r205=r204<<8;r206=r58;r207=r206>>>8;r208=r205+r207|0;r209=(r208>>>0)%31&-1;r210=(r209|0)!=0;if(r210){break}r211=r58;r212=r211&15;r213=(r212|0)!=8;if(r213){r214=r8;r215=r214+24|0;HEAP32[r215>>2]=13344;r216=r32;r217=r216|0;HEAP32[r217>>2]=29;break L1033}r218=r58;r219=r218>>>4;r58=r219;r220=r62;r221=r220-4|0;r62=r221;r222=r58;r223=r222&15;r224=r223+8|0;r225=r224;r226=r32;r227=r226+36|0;r228=HEAP32[r227>>2];r229=(r228|0)==0;do{if(r229){r230=r225;r231=r32;r232=r231+36|0;HEAP32[r232>>2]=r230}else{r233=r225;r234=r32;r235=r234+36|0;r236=HEAP32[r235>>2];r237=r233>>>0>r236>>>0;if(r237){r238=r8;r239=r238+24|0;HEAP32[r239>>2]=13264;r240=r32;r241=r240|0;HEAP32[r241>>2]=29;break L1033}else{break}}}while(0);r242=r225;r243=1<<r242;r244=r32;r245=r244+20|0;HEAP32[r245>>2]=r243;r246=_adler32(0,0,0);r247=r32;r248=r247+24|0;HEAP32[r248>>2]=r246;r249=r8;r250=r249+48|0;HEAP32[r250>>2]=r246;r251=r58;r252=r251&512;r253=(r252|0)!=0;r254=r253?9:11;r255=r32;r256=r255|0;HEAP32[r256>>2]=r254;r58=0;r62=0;break L1033}}while(0);r257=r8;r258=r257+24|0;HEAP32[r258>>2]=13712;r259=r32;r260=r259|0;HEAP32[r260>>2]=29;break};case 7:{r3=958;break};case 8:{r3=979;break};case 3:{r3=879;break};case 9:{while(1){r261=r62;r262=r261>>>0<32;if(!r262){break}r263=r54;r264=(r263|0)==0;if(r264){r3=1002;break L1031}r265=r54;r266=r265-1|0;r54=r266;r267=r50;r268=r267+1|0;r50=r268;r269=HEAP8[r267];r270=r269&255;r271=r62;r272=r270<<r271;r273=r58;r274=r273+r272|0;r58=r274;r275=r62;r276=r275+8|0;r62=r276}r277=r58;r278=r277>>>24;r279=r278&255;r280=r58;r281=r280>>>8;r282=r281&65280;r283=r279+r282|0;r284=r58;r285=r284&65280;r286=r285<<8;r287=r283+r286|0;r288=r58;r289=r288&255;r290=r289<<24;r291=r287+r290|0;r292=r32;r293=r292+24|0;HEAP32[r293>>2]=r291;r294=r8;r295=r294+48|0;HEAP32[r295>>2]=r291;r58=0;r62=0;r296=r32;r297=r296|0;HEAP32[r297>>2]=10;r3=1009;break};case 10:{r3=1009;break};case 11:{r3=1014;break};case 12:{r3=1018;break};case 6:{r3=937;break};case 4:{r3=897;break};case 13:{r298=r62;r299=r298&7;r300=r58;r301=r300>>>(r299>>>0);r58=r301;r302=r62;r303=r302&7;r304=r62;r305=r304-r303|0;r62=r305;while(1){r306=r62;r307=r306>>>0<32;if(!r307){break}r308=r54;r309=(r308|0)==0;if(r309){r3=1052;break L1031}r310=r54;r311=r310-1|0;r54=r311;r312=r50;r313=r312+1|0;r50=r313;r314=HEAP8[r312];r315=r314&255;r316=r62;r317=r315<<r316;r318=r58;r319=r318+r317|0;r58=r319;r320=r62;r321=r320+8|0;r62=r321}r322=r58;r323=r322&65535;r324=r58;r325=r324>>>16;r326=r325^65535;r327=(r323|0)!=(r326|0);if(r327){r328=r8;r329=r328+24|0;HEAP32[r329>>2]=12984;r330=r32;r331=r330|0;HEAP32[r331>>2]=29;break L1033}r332=r58;r333=r332&65535;r334=r32;r335=r334+64|0;HEAP32[r335>>2]=r333;r58=0;r62=0;r336=r32;r337=r336|0;HEAP32[r337>>2]=14;r338=r9;r339=(r338|0)==6;if(r339){r3=1061;break L1031}r3=1063;break};case 14:{r3=1063;break};case 15:{r3=1064;break};case 16:{while(1){r340=r62;r341=r340>>>0<14;if(!r341){break}r342=r54;r343=(r342|0)==0;if(r343){r3=1078;break L1031}r344=r54;r345=r344-1|0;r54=r345;r346=r50;r347=r346+1|0;r50=r347;r348=HEAP8[r346];r349=r348&255;r350=r62;r351=r349<<r350;r352=r58;r353=r352+r351|0;r58=r353;r354=r62;r355=r354+8|0;r62=r355}r356=r58;r357=r356&31;r358=r357+257|0;r359=r32;r360=r359+96|0;HEAP32[r360>>2]=r358;r361=r58;r362=r361>>>5;r58=r362;r363=r62;r364=r363-5|0;r62=r364;r365=r58;r366=r365&31;r367=r366+1|0;r368=r32;r369=r368+100|0;HEAP32[r369>>2]=r367;r370=r58;r371=r370>>>5;r58=r371;r372=r62;r373=r372-5|0;r62=r373;r374=r58;r375=r374&15;r376=r375+4|0;r377=r32;r378=r377+92|0;HEAP32[r378>>2]=r376;r379=r58;r380=r379>>>4;r58=r380;r381=r62;r382=r381-4|0;r62=r382;r383=r32;r384=r383+96|0;r385=HEAP32[r384>>2];r386=r385>>>0>286;do{if(!r386){r387=r32;r388=r387+100|0;r389=HEAP32[r388>>2];r390=r389>>>0>30;if(r390){break}r391=r32;r392=r391+104|0;HEAP32[r392>>2]=0;r393=r32;r394=r393|0;HEAP32[r394>>2]=17;r3=1092;break L1033}}while(0);r395=r8;r396=r395+24|0;HEAP32[r396>>2]=12864;r397=r32;r398=r397|0;HEAP32[r398>>2]=29;break};case 2:{r3=861;break};case 17:{r3=1092;break};case 18:{r3=1112;break};case 19:{r3=1191;break};case 20:{r3=1192;break};case 21:{r3=1231;break};case 22:{r3=1245;break};case 23:{r3=1270;break};case 24:{r3=1284;break};case 25:{r399=r46;r400=(r399|0)==0;if(r400){r3=1307;break L1031}r401=r32;r402=r401+64|0;r403=HEAP32[r402>>2];r404=r403&255;r405=r42;r406=r405+1|0;r42=r406;HEAP8[r405]=r404;r407=r46;r408=r407-1|0;r46=r408;r409=r32;r410=r409|0;HEAP32[r410>>2]=20;break};case 26:{r411=r32;r412=r411+8|0;r413=HEAP32[r412>>2];r414=(r413|0)!=0;if(r414){while(1){r415=r62;r416=r415>>>0<32;if(!r416){break}r417=r54;r418=(r417|0)==0;if(r418){r3=1315;break L1031}r419=r54;r420=r419-1|0;r54=r420;r421=r50;r422=r421+1|0;r50=r422;r423=HEAP8[r421];r424=r423&255;r425=r62;r426=r424<<r425;r427=r58;r428=r427+r426|0;r58=r428;r429=r62;r430=r429+8|0;r62=r430}r431=r46;r432=r66;r433=r432-r431|0;r66=r433;r434=r66;r435=r8;r436=r435+20|0;r437=HEAP32[r436>>2];r438=r437+r434|0;HEAP32[r436>>2]=r438;r439=r66;r440=r32;r441=r440+28|0;r442=HEAP32[r441>>2];r443=r442+r439|0;HEAP32[r441>>2]=r443;r444=r66;r445=(r444|0)!=0;if(r445){r446=r32;r447=r446+16|0;r448=HEAP32[r447>>2];r449=(r448|0)!=0;if(r449){r450=r32;r451=r450+24|0;r452=HEAP32[r451>>2];r453=r42;r454=r66;r455=-r454|0;r456=r453+r455|0;r457=r66;r458=_crc32(r452,r456,r457);r459=r458}else{r460=r32;r461=r460+24|0;r462=HEAP32[r461>>2];r463=r42;r464=r66;r465=-r464|0;r466=r463+r465|0;r467=r66;r468=_adler32(r462,r466,r467);r459=r468}r469=r32;r470=r469+24|0;HEAP32[r470>>2]=r459;r471=r8;r472=r471+48|0;HEAP32[r472>>2]=r459}r473=r46;r66=r473;r474=r32;r475=r474+16|0;r476=HEAP32[r475>>2];r477=(r476|0)!=0;if(r477){r478=r58;r479=r478}else{r480=r58;r481=r480>>>24;r482=r481&255;r483=r58;r484=r483>>>8;r485=r484&65280;r486=r482+r485|0;r487=r58;r488=r487&65280;r489=r488<<8;r490=r486+r489|0;r491=r58;r492=r491&255;r493=r492<<24;r494=r490+r493|0;r479=r494}r495=r32;r496=r495+24|0;r497=HEAP32[r496>>2];r498=(r479|0)!=(r497|0);if(r498){r499=r8;r500=r499+24|0;HEAP32[r500>>2]=13440;r501=r32;r502=r501|0;HEAP32[r502>>2]=29;break L1033}r58=0;r62=0}r503=r32;r504=r503|0;HEAP32[r504>>2]=27;r3=1333;break};case 27:{r3=1333;break};case 28:{r3=1350;break L1031;break};case 29:{r3=1351;break L1031;break};case 30:{r3=1352;break L1031;break};case 31:{r3=1353;break L1031;break};default:{r3=1354;break L1031}}}while(0);do{if(r3==1009){r3=0;r505=r32;r506=r505+12|0;r507=HEAP32[r506>>2];r508=(r507|0)==0;if(r508){r3=1010;break L1031}r509=_adler32(0,0,0);r510=r32;r511=r510+24|0;HEAP32[r511>>2]=r509;r512=r8;r513=r512+48|0;HEAP32[r513>>2]=r509;r514=r32;r515=r514|0;HEAP32[r515>>2]=11;r3=1014}else if(r3==1063){r3=0;r516=r32;r517=r516|0;HEAP32[r517>>2]=15;r3=1064}else if(r3==861){r3=0;while(1){r518=r62;r519=r518>>>0<32;if(!r519){break}r520=r54;r521=(r520|0)==0;if(r521){r3=866;break L1031}r522=r54;r523=r522-1|0;r54=r523;r524=r50;r525=r524+1|0;r50=r525;r526=HEAP8[r524];r527=r526&255;r528=r62;r529=r527<<r528;r530=r58;r531=r530+r529|0;r58=r531;r532=r62;r533=r532+8|0;r62=r533}r534=r32;r535=r534+32|0;r536=HEAP32[r535>>2];r537=(r536|0)!=0;if(r537){r538=r58;r539=r32;r540=r539+32|0;r541=HEAP32[r540>>2];r542=r541+4|0;HEAP32[r542>>2]=r538}r543=r32;r544=r543+16|0;r545=HEAP32[r544>>2];r546=r545&512;r547=(r546|0)!=0;if(r547){r548=r58;r549=r548&255;r550=r7|0;HEAP8[r550]=r549;r551=r58;r552=r551>>>8;r553=r552&255;r554=r7+1|0;HEAP8[r554]=r553;r555=r58;r556=r555>>>16;r557=r556&255;r558=r7+2|0;HEAP8[r558]=r557;r559=r58;r560=r559>>>24;r561=r560&255;r562=r7+3|0;HEAP8[r562]=r561;r563=r32;r564=r563+24|0;r565=HEAP32[r564>>2];r566=r7|0;r567=_crc32(r565,r566,4);r568=r32;r569=r568+24|0;HEAP32[r569>>2]=r567}r58=0;r62=0;r570=r32;r571=r570|0;HEAP32[r571>>2]=3;r3=879}else if(r3==1092){r3=0;while(1){r572=r32;r573=r572+104|0;r574=HEAP32[r573>>2];r575=r32;r576=r575+92|0;r577=HEAP32[r576>>2];r578=r574>>>0<r577>>>0;if(!r578){break}while(1){r579=r62;r580=r579>>>0<3;if(!r580){break}r581=r54;r582=(r581|0)==0;if(r582){r3=1099;break L1031}r583=r54;r584=r583-1|0;r54=r584;r585=r50;r586=r585+1|0;r50=r586;r587=HEAP8[r585];r588=r587&255;r589=r62;r590=r588<<r589;r591=r58;r592=r591+r590|0;r58=r592;r593=r62;r594=r593+8|0;r62=r594}r595=r58;r596=r595&7;r597=r596&65535;r598=r32;r599=r598+104|0;r600=HEAP32[r599>>2];r601=r600+1|0;HEAP32[r599>>2]=r601;r602=1648+(r600<<1)|0;r603=HEAP16[r602>>1];r604=r603&65535;r605=r32;r606=r605+112|0;r607=r606+(r604<<1)|0;HEAP16[r607>>1]=r597;r608=r58;r609=r608>>>3;r58=r609;r610=r62;r611=r610-3|0;r62=r611}while(1){r612=r32;r613=r612+104|0;r614=HEAP32[r613>>2];r615=r614>>>0<19;if(!r615){break}r616=r32;r617=r616+104|0;r618=HEAP32[r617>>2];r619=r618+1|0;HEAP32[r617>>2]=r619;r620=1648+(r618<<1)|0;r621=HEAP16[r620>>1];r622=r621&65535;r623=r32;r624=r623+112|0;r625=r624+(r622<<1)|0;HEAP16[r625>>1]=0}r626=r32;r627=r626+1328|0;r628=r627|0;r629=r32;r630=r629+108|0;HEAP32[r630>>2]=r628;r631=r32;r632=r631+108|0;r633=HEAP32[r632>>2];r634=r32;r635=r634+76|0;HEAP32[r635>>2]=r633;r636=r32;r637=r636+84|0;HEAP32[r637>>2]=7;r638=r32;r639=r638+112|0;r640=r639|0;r641=r32;r642=r641+108|0;r643=r32;r644=r643+84|0;r645=r32;r646=r645+752|0;r647=r646|0;r648=_inflate_table(0,r640,19,r642,r644,r647);r67=r648;r649=r67;r650=(r649|0)!=0;if(r650){r651=r8;r652=r651+24|0;HEAP32[r652>>2]=12768;r653=r32;r654=r653|0;HEAP32[r654>>2]=29;break}else{r655=r32;r656=r655+104|0;HEAP32[r656>>2]=0;r657=r32;r658=r657|0;HEAP32[r658>>2]=18;r3=1112;break}}else if(r3==1333){r3=0;r659=r32;r660=r659+8|0;r661=HEAP32[r660>>2];r662=(r661|0)!=0;if(!r662){r3=1349;break L1031}r663=r32;r664=r663+16|0;r665=HEAP32[r664>>2];r666=(r665|0)!=0;if(!r666){r3=1349;break L1031}while(1){r667=r62;r668=r667>>>0<32;if(!r668){break}r669=r54;r670=(r669|0)==0;if(r670){r3=1340;break L1031}r671=r54;r672=r671-1|0;r54=r672;r673=r50;r674=r673+1|0;r50=r674;r675=HEAP8[r673];r676=r675&255;r677=r62;r678=r676<<r677;r679=r58;r680=r679+r678|0;r58=r680;r681=r62;r682=r681+8|0;r62=r682}r683=r58;r684=r32;r685=r684+28|0;r686=HEAP32[r685>>2];r687=(r683|0)!=(r686|0);if(!r687){r3=1346;break L1031}r688=r8;r689=r688+24|0;HEAP32[r689>>2]=13384;r690=r32;r691=r690|0;HEAP32[r691>>2]=29}}while(0);do{if(r3==879){r3=0;while(1){r692=r62;r693=r692>>>0<16;if(!r693){break}r694=r54;r695=(r694|0)==0;if(r695){r3=884;break L1031}r696=r54;r697=r696-1|0;r54=r697;r698=r50;r699=r698+1|0;r50=r699;r700=HEAP8[r698];r701=r700&255;r702=r62;r703=r701<<r702;r704=r58;r705=r704+r703|0;r58=r705;r706=r62;r707=r706+8|0;r62=r707}r708=r32;r709=r708+32|0;r710=HEAP32[r709>>2];r711=(r710|0)!=0;if(r711){r712=r58;r713=r712&255;r714=r32;r715=r714+32|0;r716=HEAP32[r715>>2];r717=r716+8|0;HEAP32[r717>>2]=r713;r718=r58;r719=r718>>>8;r720=r32;r721=r720+32|0;r722=HEAP32[r721>>2];r723=r722+12|0;HEAP32[r723>>2]=r719}r724=r32;r725=r724+16|0;r726=HEAP32[r725>>2];r727=r726&512;r728=(r727|0)!=0;if(r728){r729=r58;r730=r729&255;r731=r7|0;HEAP8[r731]=r730;r732=r58;r733=r732>>>8;r734=r733&255;r735=r7+1|0;HEAP8[r735]=r734;r736=r32;r737=r736+24|0;r738=HEAP32[r737>>2];r739=r7|0;r740=_crc32(r738,r739,2);r741=r32;r742=r741+24|0;HEAP32[r742>>2]=r740}r58=0;r62=0;r743=r32;r744=r743|0;HEAP32[r744>>2]=4;r3=897}else if(r3==1014){r3=0;r745=r9;r746=(r745|0)==5;if(r746){r3=1016;break L1031}r747=r9;r748=(r747|0)==6;if(r748){r3=1016;break L1031}r3=1018}else if(r3==1064){r3=0;r749=r32;r750=r749+64|0;r751=HEAP32[r750>>2];r752=r751;r753=r752;r754=(r753|0)!=0;if(!r754){r755=r32;r756=r755|0;HEAP32[r756>>2]=11;break}r757=r752;r758=r54;r759=r757>>>0>r758>>>0;if(r759){r760=r54;r752=r760}r761=r752;r762=r46;r763=r761>>>0>r762>>>0;if(r763){r764=r46;r752=r764}r765=r752;r766=(r765|0)==0;if(r766){r3=1070;break L1031}r767=r42;r768=r50;r769=r752;_memcpy(r767,r768,r769)|0;r770=r752;r771=r54;r772=r771-r770|0;r54=r772;r773=r752;r774=r50;r775=r774+r773|0;r50=r775;r776=r752;r777=r46;r778=r777-r776|0;r46=r778;r779=r752;r780=r42;r781=r780+r779|0;r42=r781;r782=r752;r783=r32;r784=r783+64|0;r785=HEAP32[r784>>2];r786=r785-r782|0;HEAP32[r784>>2]=r786}else if(r3==1112){r3=0;while(1){r787=r32;r788=r787+104|0;r789=HEAP32[r788>>2];r790=r32;r791=r790+96|0;r792=HEAP32[r791>>2];r793=r32;r794=r793+100|0;r795=HEAP32[r794>>2];r796=r792+r795|0;r797=r789>>>0<r796>>>0;if(!r797){break}while(1){r798=r58;r799=r32;r800=r799+84|0;r801=HEAP32[r800>>2];r802=1<<r801;r803=r802-1|0;r804=r798&r803;r805=r32;r806=r805+76|0;r807=HEAP32[r806>>2];r808=r807+(r804<<2)|0;r809=r5;r810=r808;HEAP16[r809>>1]=HEAP16[r810>>1];HEAP16[r809+2>>1]=HEAP16[r810+2>>1];r811=r5+1|0;r812=HEAP8[r811];r813=r812&255;r814=r62;r815=r813>>>0<=r814>>>0;if(r815){break}r816=r54;r817=(r816|0)==0;if(r817){r3=1119;break L1031}r818=r54;r819=r818-1|0;r54=r819;r820=r50;r821=r820+1|0;r50=r821;r822=HEAP8[r820];r823=r822&255;r824=r62;r825=r823<<r824;r826=r58;r827=r826+r825|0;r58=r827;r828=r62;r829=r828+8|0;r62=r829}r830=r5+2|0;r831=HEAP16[r830>>1];r832=r831&65535;r833=(r832|0)<16;if(r833){r834=r5+1|0;r835=HEAP8[r834];r836=r835&255;r837=r58;r838=r837>>>(r836>>>0);r58=r838;r839=r5+1|0;r840=HEAP8[r839];r841=r840&255;r842=r62;r843=r842-r841|0;r62=r843;r844=r5+2|0;r845=HEAP16[r844>>1];r846=r32;r847=r846+104|0;r848=HEAP32[r847>>2];r849=r848+1|0;HEAP32[r847>>2]=r849;r850=r32;r851=r850+112|0;r852=r851+(r848<<1)|0;HEAP16[r852>>1]=r845}else{r853=r5+2|0;r854=HEAP16[r853>>1];r855=r854&65535;r856=(r855|0)==16;if(r856){while(1){r857=r62;r858=r5+1|0;r859=HEAP8[r858];r860=r859&255;r861=r860+2|0;r862=r857>>>0<r861>>>0;if(!r862){break}r863=r54;r864=(r863|0)==0;if(r864){r3=1132;break L1031}r865=r54;r866=r865-1|0;r54=r866;r867=r50;r868=r867+1|0;r50=r868;r869=HEAP8[r867];r870=r869&255;r871=r62;r872=r870<<r871;r873=r58;r874=r873+r872|0;r58=r874;r875=r62;r876=r875+8|0;r62=r876}r877=r5+1|0;r878=HEAP8[r877];r879=r878&255;r880=r58;r881=r880>>>(r879>>>0);r58=r881;r882=r5+1|0;r883=HEAP8[r882];r884=r883&255;r885=r62;r886=r885-r884|0;r62=r886;r887=r32;r888=r887+104|0;r889=HEAP32[r888>>2];r890=(r889|0)==0;if(r890){r3=1139;break}r891=r32;r892=r891+104|0;r893=HEAP32[r892>>2];r894=r893-1|0;r895=r32;r896=r895+112|0;r897=r896+(r894<<1)|0;r898=HEAP16[r897>>1];r899=r898&65535;r225=r899;r900=r58;r901=r900&3;r902=r901+3|0;r752=r902;r903=r58;r904=r903>>>2;r58=r904;r905=r62;r906=r905-2|0;r62=r906}else{r907=r5+2|0;r908=HEAP16[r907>>1];r909=r908&65535;r910=(r909|0)==17;if(r910){while(1){r911=r62;r912=r5+1|0;r913=HEAP8[r912];r914=r913&255;r915=r914+3|0;r916=r911>>>0<r915>>>0;if(!r916){break}r917=r54;r918=(r917|0)==0;if(r918){r3=1149;break L1031}r919=r54;r920=r919-1|0;r54=r920;r921=r50;r922=r921+1|0;r50=r922;r923=HEAP8[r921];r924=r923&255;r925=r62;r926=r924<<r925;r927=r58;r928=r927+r926|0;r58=r928;r929=r62;r930=r929+8|0;r62=r930}r931=r5+1|0;r932=HEAP8[r931];r933=r932&255;r934=r58;r935=r934>>>(r933>>>0);r58=r935;r936=r5+1|0;r937=HEAP8[r936];r938=r937&255;r939=r62;r940=r939-r938|0;r62=r940;r225=0;r941=r58;r942=r941&7;r943=r942+3|0;r752=r943;r944=r58;r945=r944>>>3;r58=r945;r946=r62;r947=r946-3|0;r62=r947}else{while(1){r948=r62;r949=r5+1|0;r950=HEAP8[r949];r951=r950&255;r952=r951+7|0;r953=r948>>>0<r952>>>0;if(!r953){break}r954=r54;r955=(r954|0)==0;if(r955){r3=1163;break L1031}r956=r54;r957=r956-1|0;r54=r957;r958=r50;r959=r958+1|0;r50=r959;r960=HEAP8[r958];r961=r960&255;r962=r62;r963=r961<<r962;r964=r58;r965=r964+r963|0;r58=r965;r966=r62;r967=r966+8|0;r62=r967}r968=r5+1|0;r969=HEAP8[r968];r970=r969&255;r971=r58;r972=r971>>>(r970>>>0);r58=r972;r973=r5+1|0;r974=HEAP8[r973];r975=r974&255;r976=r62;r977=r976-r975|0;r62=r977;r225=0;r978=r58;r979=r978&127;r980=r979+11|0;r752=r980;r981=r58;r982=r981>>>7;r58=r982;r983=r62;r984=r983-7|0;r62=r984}}r985=r32;r986=r985+104|0;r987=HEAP32[r986>>2];r988=r752;r989=r987+r988|0;r990=r32;r991=r990+96|0;r992=HEAP32[r991>>2];r993=r32;r994=r993+100|0;r995=HEAP32[r994>>2];r996=r992+r995|0;r997=r989>>>0>r996>>>0;if(r997){r3=1174;break}while(1){r998=r752;r999=r998-1|0;r752=r999;r1000=(r998|0)!=0;if(!r1000){break}r1001=r225;r1002=r1001&65535;r1003=r32;r1004=r1003+104|0;r1005=HEAP32[r1004>>2];r1006=r1005+1|0;HEAP32[r1004>>2]=r1006;r1007=r32;r1008=r1007+112|0;r1009=r1008+(r1005<<1)|0;HEAP16[r1009>>1]=r1002}}}if(r3==1139){r3=0;r1010=r8;r1011=r1010+24|0;HEAP32[r1011>>2]=13800;r1012=r32;r1013=r1012|0;HEAP32[r1013>>2]=29}else if(r3==1174){r3=0;r1014=r8;r1015=r1014+24|0;HEAP32[r1015>>2]=13800;r1016=r32;r1017=r1016|0;HEAP32[r1017>>2]=29}r1018=r32;r1019=r1018|0;r1020=HEAP32[r1019>>2];r1021=(r1020|0)==29;if(r1021){break}r1022=r32;r1023=r1022+112|0;r1024=r1023+512|0;r1025=HEAP16[r1024>>1];r1026=r1025&65535;r1027=(r1026|0)==0;if(r1027){r1028=r8;r1029=r1028+24|0;HEAP32[r1029>>2]=13736;r1030=r32;r1031=r1030|0;HEAP32[r1031>>2]=29;break}r1032=r32;r1033=r1032+1328|0;r1034=r1033|0;r1035=r32;r1036=r1035+108|0;HEAP32[r1036>>2]=r1034;r1037=r32;r1038=r1037+108|0;r1039=HEAP32[r1038>>2];r1040=r32;r1041=r1040+76|0;HEAP32[r1041>>2]=r1039;r1042=r32;r1043=r1042+84|0;HEAP32[r1043>>2]=9;r1044=r32;r1045=r1044+112|0;r1046=r1045|0;r1047=r32;r1048=r1047+96|0;r1049=HEAP32[r1048>>2];r1050=r32;r1051=r1050+108|0;r1052=r32;r1053=r1052+84|0;r1054=r32;r1055=r1054+752|0;r1056=r1055|0;r1057=_inflate_table(1,r1046,r1049,r1051,r1053,r1056);r67=r1057;r1058=r67;r1059=(r1058|0)!=0;if(r1059){r1060=r8;r1061=r1060+24|0;HEAP32[r1061>>2]=13672;r1062=r32;r1063=r1062|0;HEAP32[r1063>>2]=29;break}r1064=r32;r1065=r1064+108|0;r1066=HEAP32[r1065>>2];r1067=r32;r1068=r1067+80|0;HEAP32[r1068>>2]=r1066;r1069=r32;r1070=r1069+88|0;HEAP32[r1070>>2]=6;r1071=r32;r1072=r1071+112|0;r1073=r1072|0;r1074=r32;r1075=r1074+96|0;r1076=HEAP32[r1075>>2];r1077=r1073+(r1076<<1)|0;r1078=r32;r1079=r1078+100|0;r1080=HEAP32[r1079>>2];r1081=r32;r1082=r1081+108|0;r1083=r32;r1084=r1083+88|0;r1085=r32;r1086=r1085+752|0;r1087=r1086|0;r1088=_inflate_table(2,r1077,r1080,r1082,r1084,r1087);r67=r1088;r1089=r67;r1090=(r1089|0)!=0;if(r1090){r1091=r8;r1092=r1091+24|0;HEAP32[r1092>>2]=13640;r1093=r32;r1094=r1093|0;HEAP32[r1094>>2]=29;break}r1095=r32;r1096=r1095|0;HEAP32[r1096>>2]=19;r1097=r9;r1098=(r1097|0)==6;if(r1098){r3=1189;break L1031}r3=1191}}while(0);do{if(r3==1018){r3=0;r1099=r32;r1100=r1099+4|0;r1101=HEAP32[r1100>>2];r1102=(r1101|0)!=0;if(r1102){r1103=r62;r1104=r1103&7;r1105=r58;r1106=r1105>>>(r1104>>>0);r58=r1106;r1107=r62;r1108=r1107&7;r1109=r62;r1110=r1109-r1108|0;r62=r1110;r1111=r32;r1112=r1111|0;HEAP32[r1112>>2]=26;break}while(1){r1113=r62;r1114=r1113>>>0<3;if(!r1114){break}r1115=r54;r1116=(r1115|0)==0;if(r1116){r3=1027;break L1031}r1117=r54;r1118=r1117-1|0;r54=r1118;r1119=r50;r1120=r1119+1|0;r50=r1120;r1121=HEAP8[r1119];r1122=r1121&255;r1123=r62;r1124=r1122<<r1123;r1125=r58;r1126=r1125+r1124|0;r58=r1126;r1127=r62;r1128=r1127+8|0;r62=r1128}r1129=r58;r1130=r1129&1;r1131=r32;r1132=r1131+4|0;HEAP32[r1132>>2]=r1130;r1133=r58;r1134=r1133>>>1;r58=r1134;r1135=r62;r1136=r1135-1|0;r62=r1136;r1137=r58;r1138=r1137&3;if((r1138|0)==0){r1139=r32;r1140=r1139|0;HEAP32[r1140>>2]=13}else if((r1138|0)==1){r1141=r32;_fixedtables(r1141);r1142=r32;r1143=r1142|0;HEAP32[r1143>>2]=19;r1144=r9;r1145=(r1144|0)==6;if(r1145){r3=1036;break L1031}}else if((r1138|0)==2){r1146=r32;r1147=r1146|0;HEAP32[r1147>>2]=16}else if((r1138|0)==3){r1148=r8;r1149=r1148+24|0;HEAP32[r1149>>2]=13064;r1150=r32;r1151=r1150|0;HEAP32[r1151>>2]=29}r1152=r58;r1153=r1152>>>2;r58=r1153;r1154=r62;r1155=r1154-2|0;r62=r1155}else if(r3==897){r3=0;r1156=r32;r1157=r1156+16|0;r1158=HEAP32[r1157>>2];r1159=r1158&1024;r1160=(r1159|0)!=0;if(r1160){while(1){r1161=r62;r1162=r1161>>>0<16;if(!r1162){break}r1163=r54;r1164=(r1163|0)==0;if(r1164){r3=903;break L1031}r1165=r54;r1166=r1165-1|0;r54=r1166;r1167=r50;r1168=r1167+1|0;r50=r1168;r1169=HEAP8[r1167];r1170=r1169&255;r1171=r62;r1172=r1170<<r1171;r1173=r58;r1174=r1173+r1172|0;r58=r1174;r1175=r62;r1176=r1175+8|0;r62=r1176}r1177=r58;r1178=r32;r1179=r1178+64|0;HEAP32[r1179>>2]=r1177;r1180=r32;r1181=r1180+32|0;r1182=HEAP32[r1181>>2];r1183=(r1182|0)!=0;if(r1183){r1184=r58;r1185=r32;r1186=r1185+32|0;r1187=HEAP32[r1186>>2];r1188=r1187+20|0;HEAP32[r1188>>2]=r1184}r1189=r32;r1190=r1189+16|0;r1191=HEAP32[r1190>>2];r1192=r1191&512;r1193=(r1192|0)!=0;if(r1193){r1194=r58;r1195=r1194&255;r1196=r7|0;HEAP8[r1196]=r1195;r1197=r58;r1198=r1197>>>8;r1199=r1198&255;r1200=r7+1|0;HEAP8[r1200]=r1199;r1201=r32;r1202=r1201+24|0;r1203=HEAP32[r1202>>2];r1204=r7|0;r1205=_crc32(r1203,r1204,2);r1206=r32;r1207=r1206+24|0;HEAP32[r1207>>2]=r1205}r58=0;r62=0}else{r1208=r32;r1209=r1208+32|0;r1210=HEAP32[r1209>>2];r1211=(r1210|0)!=0;if(r1211){r1212=r32;r1213=r1212+32|0;r1214=HEAP32[r1213>>2];r1215=r1214+16|0;HEAP32[r1215>>2]=0}}r1216=r32;r1217=r1216|0;HEAP32[r1217>>2]=5;r3=920}else if(r3==1191){r3=0;r1218=r32;r1219=r1218|0;HEAP32[r1219>>2]=20;r3=1192}}while(0);L1421:do{if(r3==920){r3=0;r1220=r32;r1221=r1220+16|0;r1222=HEAP32[r1221>>2];r1223=r1222&1024;r1224=(r1223|0)!=0;if(r1224){r1225=r32;r1226=r1225+64|0;r1227=HEAP32[r1226>>2];r752=r1227;r1228=r752;r1229=r54;r1230=r1228>>>0>r1229>>>0;if(r1230){r1231=r54;r752=r1231}r1232=r752;r1233=(r1232|0)!=0;if(r1233){r1234=r32;r1235=r1234+32|0;r1236=HEAP32[r1235>>2];r1237=(r1236|0)!=0;do{if(r1237){r1238=r32;r1239=r1238+32|0;r1240=HEAP32[r1239>>2];r1241=r1240+16|0;r1242=HEAP32[r1241>>2];r1243=(r1242|0)!=0;if(!r1243){break}r1244=r32;r1245=r1244+32|0;r1246=HEAP32[r1245>>2];r1247=r1246+20|0;r1248=HEAP32[r1247>>2];r1249=r32;r1250=r1249+64|0;r1251=HEAP32[r1250>>2];r1252=r1248-r1251|0;r225=r1252;r1253=r32;r1254=r1253+32|0;r1255=HEAP32[r1254>>2];r1256=r1255+16|0;r1257=HEAP32[r1256>>2];r1258=r225;r1259=r1257+r1258|0;r1260=r50;r1261=r225;r1262=r752;r1263=r1261+r1262|0;r1264=r32;r1265=r1264+32|0;r1266=HEAP32[r1265>>2];r1267=r1266+24|0;r1268=HEAP32[r1267>>2];r1269=r1263>>>0>r1268>>>0;if(r1269){r1270=r32;r1271=r1270+32|0;r1272=HEAP32[r1271>>2];r1273=r1272+24|0;r1274=HEAP32[r1273>>2];r1275=r225;r1276=r1274-r1275|0;r1277=r1276}else{r1278=r752;r1277=r1278}_memcpy(r1259,r1260,r1277)|0}}while(0);r1279=r32;r1280=r1279+16|0;r1281=HEAP32[r1280>>2];r1282=r1281&512;r1283=(r1282|0)!=0;if(r1283){r1284=r32;r1285=r1284+24|0;r1286=HEAP32[r1285>>2];r1287=r50;r1288=r752;r1289=_crc32(r1286,r1287,r1288);r1290=r32;r1291=r1290+24|0;HEAP32[r1291>>2]=r1289}r1292=r752;r1293=r54;r1294=r1293-r1292|0;r54=r1294;r1295=r752;r1296=r50;r1297=r1296+r1295|0;r50=r1297;r1298=r752;r1299=r32;r1300=r1299+64|0;r1301=HEAP32[r1300>>2];r1302=r1301-r1298|0;HEAP32[r1300>>2]=r1302}r1303=r32;r1304=r1303+64|0;r1305=HEAP32[r1304>>2];r1306=(r1305|0)!=0;if(r1306){r3=934;break L1031}}r1307=r32;r1308=r1307+64|0;HEAP32[r1308>>2]=0;r1309=r32;r1310=r1309|0;HEAP32[r1310>>2]=6;r3=937}else if(r3==1192){r3=0;r1311=r54;r1312=r1311>>>0>=6;do{if(r1312){r1313=r46;r1314=r1313>>>0>=258;if(!r1314){break}r1315=r42;r1316=r8;r1317=r1316+12|0;HEAP32[r1317>>2]=r1315;r1318=r46;r1319=r8;r1320=r1319+16|0;HEAP32[r1320>>2]=r1318;r1321=r50;r1322=r8;r1323=r1322|0;HEAP32[r1323>>2]=r1321;r1324=r54;r1325=r8;r1326=r1325+4|0;HEAP32[r1326>>2]=r1324;r1327=r58;r1328=r32;r1329=r1328+56|0;HEAP32[r1329>>2]=r1327;r1330=r62;r1331=r32;r1332=r1331+60|0;HEAP32[r1332>>2]=r1330;r1333=r8;r1334=r66;_inflate_fast(r1333,r1334);r1335=r8;r1336=r1335+12|0;r1337=HEAP32[r1336>>2];r42=r1337;r1338=r8;r1339=r1338+16|0;r1340=HEAP32[r1339>>2];r46=r1340;r1341=r8;r1342=r1341|0;r1343=HEAP32[r1342>>2];r50=r1343;r1344=r8;r1345=r1344+4|0;r1346=HEAP32[r1345>>2];r54=r1346;r1347=r32;r1348=r1347+56|0;r1349=HEAP32[r1348>>2];r58=r1349;r1350=r32;r1351=r1350+60|0;r1352=HEAP32[r1351>>2];r62=r1352;r1353=r32;r1354=r1353|0;r1355=HEAP32[r1354>>2];r1356=(r1355|0)==11;if(r1356){r1357=r32;r1358=r1357+7108|0;HEAP32[r1358>>2]=-1}break L1421}}while(0);r1359=r32;r1360=r1359+7108|0;HEAP32[r1360>>2]=0;while(1){r1361=r58;r1362=r32;r1363=r1362+84|0;r1364=HEAP32[r1363>>2];r1365=1<<r1364;r1366=r1365-1|0;r1367=r1361&r1366;r1368=r32;r1369=r1368+76|0;r1370=HEAP32[r1369>>2];r1371=r1370+(r1367<<2)|0;r1372=r5;r1373=r1371;HEAP16[r1372>>1]=HEAP16[r1373>>1];HEAP16[r1372+2>>1]=HEAP16[r1373+2>>1];r1374=r5+1|0;r1375=HEAP8[r1374];r1376=r1375&255;r1377=r62;r1378=r1376>>>0<=r1377>>>0;if(r1378){break}r1379=r54;r1380=(r1379|0)==0;if(r1380){r3=1206;break L1031}r1381=r54;r1382=r1381-1|0;r54=r1382;r1383=r50;r1384=r1383+1|0;r50=r1384;r1385=HEAP8[r1383];r1386=r1385&255;r1387=r62;r1388=r1386<<r1387;r1389=r58;r1390=r1389+r1388|0;r58=r1390;r1391=r62;r1392=r1391+8|0;r62=r1392}r1393=r5|0;r1394=HEAP8[r1393];r1395=r1394&255;r1396=(r1395|0)!=0;do{if(r1396){r1397=r5|0;r1398=HEAP8[r1397];r1399=r1398&255;r1400=r1399&240;r1401=(r1400|0)==0;if(!r1401){break}r1402=r6;r1403=r5;HEAP16[r1402>>1]=HEAP16[r1403>>1];HEAP16[r1402+2>>1]=HEAP16[r1403+2>>1];while(1){r1404=r6+2|0;r1405=HEAP16[r1404>>1];r1406=r1405&65535;r1407=r58;r1408=r6+1|0;r1409=HEAP8[r1408];r1410=r1409&255;r1411=r6|0;r1412=HEAP8[r1411];r1413=r1412&255;r1414=r1410+r1413|0;r1415=1<<r1414;r1416=r1415-1|0;r1417=r1407&r1416;r1418=r6+1|0;r1419=HEAP8[r1418];r1420=r1419&255;r1421=r1417>>>(r1420>>>0);r1422=r1406+r1421|0;r1423=r32;r1424=r1423+76|0;r1425=HEAP32[r1424>>2];r1426=r1425+(r1422<<2)|0;r1427=r5;r1428=r1426;HEAP16[r1427>>1]=HEAP16[r1428>>1];HEAP16[r1427+2>>1]=HEAP16[r1428+2>>1];r1429=r6+1|0;r1430=HEAP8[r1429];r1431=r1430&255;r1432=r5+1|0;r1433=HEAP8[r1432];r1434=r1433&255;r1435=r1431+r1434|0;r1436=r62;r1437=r1435>>>0<=r1436>>>0;if(r1437){break}r1438=r54;r1439=(r1438|0)==0;if(r1439){r3=1216;break L1031}r1440=r54;r1441=r1440-1|0;r54=r1441;r1442=r50;r1443=r1442+1|0;r50=r1443;r1444=HEAP8[r1442];r1445=r1444&255;r1446=r62;r1447=r1445<<r1446;r1448=r58;r1449=r1448+r1447|0;r58=r1449;r1450=r62;r1451=r1450+8|0;r62=r1451}r1452=r6+1|0;r1453=HEAP8[r1452];r1454=r1453&255;r1455=r58;r1456=r1455>>>(r1454>>>0);r58=r1456;r1457=r6+1|0;r1458=HEAP8[r1457];r1459=r1458&255;r1460=r62;r1461=r1460-r1459|0;r62=r1461;r1462=r6+1|0;r1463=HEAP8[r1462];r1464=r1463&255;r1465=r32;r1466=r1465+7108|0;r1467=HEAP32[r1466>>2];r1468=r1467+r1464|0;HEAP32[r1466>>2]=r1468}}while(0);r1469=r5+1|0;r1470=HEAP8[r1469];r1471=r1470&255;r1472=r58;r1473=r1472>>>(r1471>>>0);r58=r1473;r1474=r5+1|0;r1475=HEAP8[r1474];r1476=r1475&255;r1477=r62;r1478=r1477-r1476|0;r62=r1478;r1479=r5+1|0;r1480=HEAP8[r1479];r1481=r1480&255;r1482=r32;r1483=r1482+7108|0;r1484=HEAP32[r1483>>2];r1485=r1484+r1481|0;HEAP32[r1483>>2]=r1485;r1486=r5+2|0;r1487=HEAP16[r1486>>1];r1488=r1487&65535;r1489=r32;r1490=r1489+64|0;HEAP32[r1490>>2]=r1488;r1491=r5|0;r1492=HEAP8[r1491];r1493=r1492&255;r1494=(r1493|0)==0;if(r1494){r1495=r32;r1496=r1495|0;HEAP32[r1496>>2]=25;break}r1497=r5|0;r1498=HEAP8[r1497];r1499=r1498&255;r1500=r1499&32;r1501=(r1500|0)!=0;if(r1501){r1502=r32;r1503=r1502+7108|0;HEAP32[r1503>>2]=-1;r1504=r32;r1505=r1504|0;HEAP32[r1505>>2]=11;break}r1506=r5|0;r1507=HEAP8[r1506];r1508=r1507&255;r1509=r1508&64;r1510=(r1509|0)!=0;if(r1510){r1511=r8;r1512=r1511+24|0;HEAP32[r1512>>2]=13600;r1513=r32;r1514=r1513|0;HEAP32[r1514>>2]=29;break}else{r1515=r5|0;r1516=HEAP8[r1515];r1517=r1516&255;r1518=r1517&15;r1519=r32;r1520=r1519+72|0;HEAP32[r1520>>2]=r1518;r1521=r32;r1522=r1521|0;HEAP32[r1522>>2]=21;r3=1231;break}}}while(0);if(r3==937){r3=0;r1523=r32;r1524=r1523+16|0;r1525=HEAP32[r1524>>2];r1526=r1525&2048;r1527=(r1526|0)!=0;if(r1527){r1528=r54;r1529=(r1528|0)==0;if(r1529){r3=939;break}r752=0;while(1){r1530=r752;r1531=r1530+1|0;r752=r1531;r1532=r50;r1533=r1532+r1530|0;r1534=HEAP8[r1533];r1535=r1534&255;r225=r1535;r1536=r32;r1537=r1536+32|0;r1538=HEAP32[r1537>>2];r1539=(r1538|0)!=0;do{if(r1539){r1540=r32;r1541=r1540+32|0;r1542=HEAP32[r1541>>2];r1543=r1542+28|0;r1544=HEAP32[r1543>>2];r1545=(r1544|0)!=0;if(!r1545){break}r1546=r32;r1547=r1546+64|0;r1548=HEAP32[r1547>>2];r1549=r32;r1550=r1549+32|0;r1551=HEAP32[r1550>>2];r1552=r1551+32|0;r1553=HEAP32[r1552>>2];r1554=r1548>>>0<r1553>>>0;if(!r1554){break}r1555=r225;r1556=r1555&255;r1557=r32;r1558=r1557+64|0;r1559=HEAP32[r1558>>2];r1560=r1559+1|0;HEAP32[r1558>>2]=r1560;r1561=r32;r1562=r1561+32|0;r1563=HEAP32[r1562>>2];r1564=r1563+28|0;r1565=HEAP32[r1564>>2];r1566=r1565+r1559|0;HEAP8[r1566]=r1556}}while(0);r1567=r225;r1568=(r1567|0)!=0;if(r1568){r1569=r752;r1570=r54;r1571=r1569>>>0<r1570>>>0;r1572=r1571}else{r1572=0}if(!r1572){break}}r1573=r32;r1574=r1573+16|0;r1575=HEAP32[r1574>>2];r1576=r1575&512;r1577=(r1576|0)!=0;if(r1577){r1578=r32;r1579=r1578+24|0;r1580=HEAP32[r1579>>2];r1581=r50;r1582=r752;r1583=_crc32(r1580,r1581,r1582);r1584=r32;r1585=r1584+24|0;HEAP32[r1585>>2]=r1583}r1586=r752;r1587=r54;r1588=r1587-r1586|0;r54=r1588;r1589=r752;r1590=r50;r1591=r1590+r1589|0;r50=r1591;r1592=r225;r1593=(r1592|0)!=0;if(r1593){r3=952;break}}else{r1594=r32;r1595=r1594+32|0;r1596=HEAP32[r1595>>2];r1597=(r1596|0)!=0;if(r1597){r1598=r32;r1599=r1598+32|0;r1600=HEAP32[r1599>>2];r1601=r1600+28|0;HEAP32[r1601>>2]=0}}r1602=r32;r1603=r1602+64|0;HEAP32[r1603>>2]=0;r1604=r32;r1605=r1604|0;HEAP32[r1605>>2]=7;r3=958}else if(r3==1231){r3=0;r1606=r32;r1607=r1606+72|0;r1608=HEAP32[r1607>>2];r1609=(r1608|0)!=0;if(r1609){while(1){r1610=r62;r1611=r32;r1612=r1611+72|0;r1613=HEAP32[r1612>>2];r1614=r1610>>>0<r1613>>>0;if(!r1614){break}r1615=r54;r1616=(r1615|0)==0;if(r1616){r3=1237;break L1031}r1617=r54;r1618=r1617-1|0;r54=r1618;r1619=r50;r1620=r1619+1|0;r50=r1620;r1621=HEAP8[r1619];r1622=r1621&255;r1623=r62;r1624=r1622<<r1623;r1625=r58;r1626=r1625+r1624|0;r58=r1626;r1627=r62;r1628=r1627+8|0;r62=r1628}r1629=r58;r1630=r32;r1631=r1630+72|0;r1632=HEAP32[r1631>>2];r1633=1<<r1632;r1634=r1633-1|0;r1635=r1629&r1634;r1636=r32;r1637=r1636+64|0;r1638=HEAP32[r1637>>2];r1639=r1638+r1635|0;HEAP32[r1637>>2]=r1639;r1640=r32;r1641=r1640+72|0;r1642=HEAP32[r1641>>2];r1643=r58;r1644=r1643>>>(r1642>>>0);r58=r1644;r1645=r32;r1646=r1645+72|0;r1647=HEAP32[r1646>>2];r1648=r62;r1649=r1648-r1647|0;r62=r1649;r1650=r32;r1651=r1650+72|0;r1652=HEAP32[r1651>>2];r1653=r32;r1654=r1653+7108|0;r1655=HEAP32[r1654>>2];r1656=r1655+r1652|0;HEAP32[r1654>>2]=r1656}r1657=r32;r1658=r1657+64|0;r1659=HEAP32[r1658>>2];r1660=r32;r1661=r1660+7112|0;HEAP32[r1661>>2]=r1659;r1662=r32;r1663=r1662|0;HEAP32[r1663>>2]=22;r3=1245}do{if(r3==958){r3=0;r1664=r32;r1665=r1664+16|0;r1666=HEAP32[r1665>>2];r1667=r1666&4096;r1668=(r1667|0)!=0;if(r1668){r1669=r54;r1670=(r1669|0)==0;if(r1670){r3=960;break L1031}r752=0;while(1){r1671=r752;r1672=r1671+1|0;r752=r1672;r1673=r50;r1674=r1673+r1671|0;r1675=HEAP8[r1674];r1676=r1675&255;r225=r1676;r1677=r32;r1678=r1677+32|0;r1679=HEAP32[r1678>>2];r1680=(r1679|0)!=0;do{if(r1680){r1681=r32;r1682=r1681+32|0;r1683=HEAP32[r1682>>2];r1684=r1683+36|0;r1685=HEAP32[r1684>>2];r1686=(r1685|0)!=0;if(!r1686){break}r1687=r32;r1688=r1687+64|0;r1689=HEAP32[r1688>>2];r1690=r32;r1691=r1690+32|0;r1692=HEAP32[r1691>>2];r1693=r1692+40|0;r1694=HEAP32[r1693>>2];r1695=r1689>>>0<r1694>>>0;if(!r1695){break}r1696=r225;r1697=r1696&255;r1698=r32;r1699=r1698+64|0;r1700=HEAP32[r1699>>2];r1701=r1700+1|0;HEAP32[r1699>>2]=r1701;r1702=r32;r1703=r1702+32|0;r1704=HEAP32[r1703>>2];r1705=r1704+36|0;r1706=HEAP32[r1705>>2];r1707=r1706+r1700|0;HEAP8[r1707]=r1697}}while(0);r1708=r225;r1709=(r1708|0)!=0;if(r1709){r1710=r752;r1711=r54;r1712=r1710>>>0<r1711>>>0;r1713=r1712}else{r1713=0}if(!r1713){break}}r1714=r32;r1715=r1714+16|0;r1716=HEAP32[r1715>>2];r1717=r1716&512;r1718=(r1717|0)!=0;if(r1718){r1719=r32;r1720=r1719+24|0;r1721=HEAP32[r1720>>2];r1722=r50;r1723=r752;r1724=_crc32(r1721,r1722,r1723);r1725=r32;r1726=r1725+24|0;HEAP32[r1726>>2]=r1724}r1727=r752;r1728=r54;r1729=r1728-r1727|0;r54=r1729;r1730=r752;r1731=r50;r1732=r1731+r1730|0;r50=r1732;r1733=r225;r1734=(r1733|0)!=0;if(r1734){r3=973;break L1031}}else{r1735=r32;r1736=r1735+32|0;r1737=HEAP32[r1736>>2];r1738=(r1737|0)!=0;if(r1738){r1739=r32;r1740=r1739+32|0;r1741=HEAP32[r1740>>2];r1742=r1741+36|0;HEAP32[r1742>>2]=0}}r1743=r32;r1744=r1743|0;HEAP32[r1744>>2]=8;r3=979}else if(r3==1245){r3=0;while(1){r1745=r58;r1746=r32;r1747=r1746+88|0;r1748=HEAP32[r1747>>2];r1749=1<<r1748;r1750=r1749-1|0;r1751=r1745&r1750;r1752=r32;r1753=r1752+80|0;r1754=HEAP32[r1753>>2];r1755=r1754+(r1751<<2)|0;r1756=r5;r1757=r1755;HEAP16[r1756>>1]=HEAP16[r1757>>1];HEAP16[r1756+2>>1]=HEAP16[r1757+2>>1];r1758=r5+1|0;r1759=HEAP8[r1758];r1760=r1759&255;r1761=r62;r1762=r1760>>>0<=r1761>>>0;if(r1762){break}r1763=r54;r1764=(r1763|0)==0;if(r1764){r3=1250;break L1031}r1765=r54;r1766=r1765-1|0;r54=r1766;r1767=r50;r1768=r1767+1|0;r50=r1768;r1769=HEAP8[r1767];r1770=r1769&255;r1771=r62;r1772=r1770<<r1771;r1773=r58;r1774=r1773+r1772|0;r58=r1774;r1775=r62;r1776=r1775+8|0;r62=r1776}r1777=r5|0;r1778=HEAP8[r1777];r1779=r1778&255;r1780=r1779&240;r1781=(r1780|0)==0;if(r1781){r1782=r6;r1783=r5;HEAP16[r1782>>1]=HEAP16[r1783>>1];HEAP16[r1782+2>>1]=HEAP16[r1783+2>>1];while(1){r1784=r6+2|0;r1785=HEAP16[r1784>>1];r1786=r1785&65535;r1787=r58;r1788=r6+1|0;r1789=HEAP8[r1788];r1790=r1789&255;r1791=r6|0;r1792=HEAP8[r1791];r1793=r1792&255;r1794=r1790+r1793|0;r1795=1<<r1794;r1796=r1795-1|0;r1797=r1787&r1796;r1798=r6+1|0;r1799=HEAP8[r1798];r1800=r1799&255;r1801=r1797>>>(r1800>>>0);r1802=r1786+r1801|0;r1803=r32;r1804=r1803+80|0;r1805=HEAP32[r1804>>2];r1806=r1805+(r1802<<2)|0;r1807=r5;r1808=r1806;HEAP16[r1807>>1]=HEAP16[r1808>>1];HEAP16[r1807+2>>1]=HEAP16[r1808+2>>1];r1809=r6+1|0;r1810=HEAP8[r1809];r1811=r1810&255;r1812=r5+1|0;r1813=HEAP8[r1812];r1814=r1813&255;r1815=r1811+r1814|0;r1816=r62;r1817=r1815>>>0<=r1816>>>0;if(r1817){break}r1818=r54;r1819=(r1818|0)==0;if(r1819){r3=1259;break L1031}r1820=r54;r1821=r1820-1|0;r54=r1821;r1822=r50;r1823=r1822+1|0;r50=r1823;r1824=HEAP8[r1822];r1825=r1824&255;r1826=r62;r1827=r1825<<r1826;r1828=r58;r1829=r1828+r1827|0;r58=r1829;r1830=r62;r1831=r1830+8|0;r62=r1831}r1832=r6+1|0;r1833=HEAP8[r1832];r1834=r1833&255;r1835=r58;r1836=r1835>>>(r1834>>>0);r58=r1836;r1837=r6+1|0;r1838=HEAP8[r1837];r1839=r1838&255;r1840=r62;r1841=r1840-r1839|0;r62=r1841;r1842=r6+1|0;r1843=HEAP8[r1842];r1844=r1843&255;r1845=r32;r1846=r1845+7108|0;r1847=HEAP32[r1846>>2];r1848=r1847+r1844|0;HEAP32[r1846>>2]=r1848}r1849=r5+1|0;r1850=HEAP8[r1849];r1851=r1850&255;r1852=r58;r1853=r1852>>>(r1851>>>0);r58=r1853;r1854=r5+1|0;r1855=HEAP8[r1854];r1856=r1855&255;r1857=r62;r1858=r1857-r1856|0;r62=r1858;r1859=r5+1|0;r1860=HEAP8[r1859];r1861=r1860&255;r1862=r32;r1863=r1862+7108|0;r1864=HEAP32[r1863>>2];r1865=r1864+r1861|0;HEAP32[r1863>>2]=r1865;r1866=r5|0;r1867=HEAP8[r1866];r1868=r1867&255;r1869=r1868&64;r1870=(r1869|0)!=0;if(r1870){r1871=r8;r1872=r1871+24|0;HEAP32[r1872>>2]=13568;r1873=r32;r1874=r1873|0;HEAP32[r1874>>2]=29;break}else{r1875=r5+2|0;r1876=HEAP16[r1875>>1];r1877=r1876&65535;r1878=r32;r1879=r1878+68|0;HEAP32[r1879>>2]=r1877;r1880=r5|0;r1881=HEAP8[r1880];r1882=r1881&255;r1883=r1882&15;r1884=r32;r1885=r1884+72|0;HEAP32[r1885>>2]=r1883;r1886=r32;r1887=r1886|0;HEAP32[r1887>>2]=23;r3=1270;break}}}while(0);do{if(r3==979){r3=0;r1888=r32;r1889=r1888+16|0;r1890=HEAP32[r1889>>2];r1891=r1890&512;r1892=(r1891|0)!=0;if(r1892){while(1){r1893=r62;r1894=r1893>>>0<16;if(!r1894){break}r1895=r54;r1896=(r1895|0)==0;if(r1896){r3=985;break L1031}r1897=r54;r1898=r1897-1|0;r54=r1898;r1899=r50;r1900=r1899+1|0;r50=r1900;r1901=HEAP8[r1899];r1902=r1901&255;r1903=r62;r1904=r1902<<r1903;r1905=r58;r1906=r1905+r1904|0;r58=r1906;r1907=r62;r1908=r1907+8|0;r62=r1908}r1909=r58;r1910=r32;r1911=r1910+24|0;r1912=HEAP32[r1911>>2];r1913=r1912&65535;r1914=(r1909|0)!=(r1913|0);if(r1914){r1915=r8;r1916=r1915+24|0;HEAP32[r1916>>2]=13144;r1917=r32;r1918=r1917|0;HEAP32[r1918>>2]=29;break}r58=0;r62=0}r1919=r32;r1920=r1919+32|0;r1921=HEAP32[r1920>>2];r1922=(r1921|0)!=0;if(r1922){r1923=r32;r1924=r1923+16|0;r1925=HEAP32[r1924>>2];r1926=r1925>>9;r1927=r1926&1;r1928=r32;r1929=r1928+32|0;r1930=HEAP32[r1929>>2];r1931=r1930+44|0;HEAP32[r1931>>2]=r1927;r1932=r32;r1933=r1932+32|0;r1934=HEAP32[r1933>>2];r1935=r1934+48|0;HEAP32[r1935>>2]=1}r1936=_crc32(0,0,0);r1937=r32;r1938=r1937+24|0;HEAP32[r1938>>2]=r1936;r1939=r8;r1940=r1939+48|0;HEAP32[r1940>>2]=r1936;r1941=r32;r1942=r1941|0;HEAP32[r1942>>2]=11}else if(r3==1270){r3=0;r1943=r32;r1944=r1943+72|0;r1945=HEAP32[r1944>>2];r1946=(r1945|0)!=0;if(r1946){while(1){r1947=r62;r1948=r32;r1949=r1948+72|0;r1950=HEAP32[r1949>>2];r1951=r1947>>>0<r1950>>>0;if(!r1951){break}r1952=r54;r1953=(r1952|0)==0;if(r1953){r3=1276;break L1031}r1954=r54;r1955=r1954-1|0;r54=r1955;r1956=r50;r1957=r1956+1|0;r50=r1957;r1958=HEAP8[r1956];r1959=r1958&255;r1960=r62;r1961=r1959<<r1960;r1962=r58;r1963=r1962+r1961|0;r58=r1963;r1964=r62;r1965=r1964+8|0;r62=r1965}r1966=r58;r1967=r32;r1968=r1967+72|0;r1969=HEAP32[r1968>>2];r1970=1<<r1969;r1971=r1970-1|0;r1972=r1966&r1971;r1973=r32;r1974=r1973+68|0;r1975=HEAP32[r1974>>2];r1976=r1975+r1972|0;HEAP32[r1974>>2]=r1976;r1977=r32;r1978=r1977+72|0;r1979=HEAP32[r1978>>2];r1980=r58;r1981=r1980>>>(r1979>>>0);r58=r1981;r1982=r32;r1983=r1982+72|0;r1984=HEAP32[r1983>>2];r1985=r62;r1986=r1985-r1984|0;r62=r1986;r1987=r32;r1988=r1987+72|0;r1989=HEAP32[r1988>>2];r1990=r32;r1991=r1990+7108|0;r1992=HEAP32[r1991>>2];r1993=r1992+r1989|0;HEAP32[r1991>>2]=r1993}r1994=r32;r1995=r1994|0;HEAP32[r1995>>2]=24;r3=1284}}while(0);L1620:do{if(r3==1284){r3=0;r1996=r46;r1997=(r1996|0)==0;if(r1997){r3=1285;break L1031}r1998=r66;r1999=r46;r2000=r1998-r1999|0;r752=r2000;r2001=r32;r2002=r2001+68|0;r2003=HEAP32[r2002>>2];r2004=r752;r2005=r2003>>>0>r2004>>>0;if(r2005){r2006=r32;r2007=r2006+68|0;r2008=HEAP32[r2007>>2];r2009=r752;r2010=r2008-r2009|0;r752=r2010;r2011=r752;r2012=r32;r2013=r2012+44|0;r2014=HEAP32[r2013>>2];r2015=r2011>>>0>r2014>>>0;do{if(r2015){r2016=r32;r2017=r2016+7104|0;r2018=HEAP32[r2017>>2];r2019=(r2018|0)!=0;if(r2019){r2020=r8;r2021=r2020+24|0;HEAP32[r2021>>2]=13512;r2022=r32;r2023=r2022|0;HEAP32[r2023>>2]=29;break L1620}else{break}}}while(0);r2024=r752;r2025=r32;r2026=r2025+48|0;r2027=HEAP32[r2026>>2];r2028=r2024>>>0>r2027>>>0;if(r2028){r2029=r32;r2030=r2029+48|0;r2031=HEAP32[r2030>>2];r2032=r752;r2033=r2032-r2031|0;r752=r2033;r2034=r32;r2035=r2034+52|0;r2036=HEAP32[r2035>>2];r2037=r32;r2038=r2037+40|0;r2039=HEAP32[r2038>>2];r2040=r752;r2041=r2039-r2040|0;r2042=r2036+r2041|0;r2043=r2042}else{r2044=r32;r2045=r2044+52|0;r2046=HEAP32[r2045>>2];r2047=r32;r2048=r2047+48|0;r2049=HEAP32[r2048>>2];r2050=r752;r2051=r2049-r2050|0;r2052=r2046+r2051|0;r2043=r2052}r2053=r752;r2054=r32;r2055=r2054+64|0;r2056=HEAP32[r2055>>2];r2057=r2053>>>0>r2056>>>0;if(r2057){r2058=r32;r2059=r2058+64|0;r2060=HEAP32[r2059>>2];r752=r2060}}else{r2061=r42;r2062=r32;r2063=r2062+68|0;r2064=HEAP32[r2063>>2];r2065=-r2064|0;r2066=r2061+r2065|0;r2043=r2066;r2067=r32;r2068=r2067+64|0;r2069=HEAP32[r2068>>2];r752=r2069}r2070=r752;r2071=r46;r2072=r2070>>>0>r2071>>>0;if(r2072){r2073=r46;r752=r2073}r2074=r752;r2075=r46;r2076=r2075-r2074|0;r46=r2076;r2077=r752;r2078=r32;r2079=r2078+64|0;r2080=HEAP32[r2079>>2];r2081=r2080-r2077|0;HEAP32[r2079>>2]=r2081;while(1){r2082=r2043;r2083=r2082+1|0;r2043=r2083;r2084=HEAP8[r2082];r2085=r42;r2086=r2085+1|0;r42=r2086;HEAP8[r2085]=r2084;r2087=r752;r2088=r2087-1|0;r752=r2088;r2089=(r2088|0)!=0;if(!r2089){break}}r2090=r32;r2091=r2090+64|0;r2092=HEAP32[r2091>>2];r2093=(r2092|0)==0;if(r2093){r2094=r32;r2095=r2094|0;HEAP32[r2095>>2]=20}}}while(0)}if(r3!=952)if(r3!=844)if(r3!=884)if(r3!=903)if(r3!=960)if(r3!=973)if(r3!=985)if(r3!=1002)if(r3==1010){r2096=r42;r2097=r8;r2098=r2097+12|0;HEAP32[r2098>>2]=r2096;r2099=r46;r2100=r8;r2101=r2100+16|0;HEAP32[r2101>>2]=r2099;r2102=r50;r2103=r8;r2104=r2103|0;HEAP32[r2104>>2]=r2102;r2105=r54;r2106=r8;r2107=r2106+4|0;HEAP32[r2107>>2]=r2105;r2108=r58;r2109=r32;r2110=r2109+56|0;HEAP32[r2110>>2]=r2108;r2111=r62;r2112=r32;r2113=r2112+60|0;HEAP32[r2113>>2]=r2111;r2114=2;r2115=r2114;STACKTOP=r4;return r2115}else if(r3!=1016)if(r3!=934)if(r3!=939)if(r3!=1027)if(r3==1036){r2116=r58;r2117=r2116>>>2;r58=r2117;r2118=r62;r2119=r2118-2|0;r62=r2119}else if(r3!=1052)if(r3!=1061)if(r3!=1070)if(r3!=1078)if(r3!=811)if(r3!=1099)if(r3!=1119)if(r3!=866)if(r3!=1132)if(r3!=1149)if(r3!=1163)if(r3!=1189)if(r3!=1206)if(r3!=1216)if(r3!=1237)if(r3!=1250)if(r3!=1259)if(r3!=1276)if(r3!=1285)if(r3!=1307)if(r3!=1315)if(r3!=1340)if(r3==1346){r58=0;r62=0;r3=1349}else if(r3==1351){r67=-3}else if(r3==1352){r2114=-4;r2115=r2114;STACKTOP=r4;return r2115}else if(r3==1353){r3=1354}if(r3==1349){r2120=r32;r2121=r2120|0;HEAP32[r2121>>2]=28;r3=1350}else if(r3==1354){r2114=-2;r2115=r2114;STACKTOP=r4;return r2115}if(r3==1350){r67=1}r2122=r42;r2123=r8;r2124=r2123+12|0;HEAP32[r2124>>2]=r2122;r2125=r46;r2126=r8;r2127=r2126+16|0;HEAP32[r2127>>2]=r2125;r2128=r50;r2129=r8;r2130=r2129|0;HEAP32[r2130>>2]=r2128;r2131=r54;r2132=r8;r2133=r2132+4|0;HEAP32[r2133>>2]=r2131;r2134=r58;r2135=r32;r2136=r2135+56|0;HEAP32[r2136>>2]=r2134;r2137=r62;r2138=r32;r2139=r2138+60|0;HEAP32[r2139>>2]=r2137;r2140=r32;r2141=r2140+40|0;r2142=HEAP32[r2141>>2];r2143=(r2142|0)!=0;do{if(r2143){r3=1363}else{r2144=r66;r2145=r8;r2146=r2145+16|0;r2147=HEAP32[r2146>>2];r2148=(r2144|0)!=(r2147|0);if(!r2148){break}r2149=r32;r2150=r2149|0;r2151=HEAP32[r2150>>2];r2152=r2151>>>0<29;if(!r2152){break}r2153=r32;r2154=r2153|0;r2155=HEAP32[r2154>>2];r2156=r2155>>>0<26;if(r2156){r3=1363;break}r2157=r9;r2158=(r2157|0)!=4;if(r2158){r3=1363}}}while(0);do{if(r3==1363){r2159=r8;r2160=r66;r2161=_updatewindow(r2159,r2160);r2162=(r2161|0)!=0;if(!r2162){break}r2163=r32;r2164=r2163|0;HEAP32[r2164>>2]=30;r2114=-4;r2115=r2114;STACKTOP=r4;return r2115}}while(0);r2165=r8;r2166=r2165+4|0;r2167=HEAP32[r2166>>2];r2168=r64;r2169=r2168-r2167|0;r64=r2169;r2170=r8;r2171=r2170+16|0;r2172=HEAP32[r2171>>2];r2173=r66;r2174=r2173-r2172|0;r66=r2174;r2175=r64;r2176=r8;r2177=r2176+8|0;r2178=HEAP32[r2177>>2];r2179=r2178+r2175|0;HEAP32[r2177>>2]=r2179;r2180=r66;r2181=r8;r2182=r2181+20|0;r2183=HEAP32[r2182>>2];r2184=r2183+r2180|0;HEAP32[r2182>>2]=r2184;r2185=r66;r2186=r32;r2187=r2186+28|0;r2188=HEAP32[r2187>>2];r2189=r2188+r2185|0;HEAP32[r2187>>2]=r2189;r2190=r32;r2191=r2190+8|0;r2192=HEAP32[r2191>>2];r2193=(r2192|0)!=0;do{if(r2193){r2194=r66;r2195=(r2194|0)!=0;if(!r2195){break}r2196=r32;r2197=r2196+16|0;r2198=HEAP32[r2197>>2];r2199=(r2198|0)!=0;if(r2199){r2200=r32;r2201=r2200+24|0;r2202=HEAP32[r2201>>2];r2203=r8;r2204=r2203+12|0;r2205=HEAP32[r2204>>2];r2206=r66;r2207=-r2206|0;r2208=r2205+r2207|0;r2209=r66;r2210=_crc32(r2202,r2208,r2209);r2211=r2210}else{r2212=r32;r2213=r2212+24|0;r2214=HEAP32[r2213>>2];r2215=r8;r2216=r2215+12|0;r2217=HEAP32[r2216>>2];r2218=r66;r2219=-r2218|0;r2220=r2217+r2219|0;r2221=r66;r2222=_adler32(r2214,r2220,r2221);r2211=r2222}r2223=r32;r2224=r2223+24|0;HEAP32[r2224>>2]=r2211;r2225=r8;r2226=r2225+48|0;HEAP32[r2226>>2]=r2211}}while(0);r2227=r32;r2228=r2227+60|0;r2229=HEAP32[r2228>>2];r2230=r32;r2231=r2230+4|0;r2232=HEAP32[r2231>>2];r2233=(r2232|0)!=0;r2234=r2233?64:0;r2235=r2229+r2234|0;r2236=r32;r2237=r2236|0;r2238=HEAP32[r2237>>2];r2239=(r2238|0)==11;r2240=r2239?128:0;r2241=r2235+r2240|0;r2242=r32;r2243=r2242|0;r2244=HEAP32[r2243>>2];r2245=(r2244|0)==19;if(r2245){r2246=1}else{r2247=r32;r2248=r2247|0;r2249=HEAP32[r2248>>2];r2250=(r2249|0)==14;r2246=r2250}r2251=r2246?256:0;r2252=r2241+r2251|0;r2253=r8;r2254=r2253+44|0;HEAP32[r2254>>2]=r2252;r2255=r64;r2256=(r2255|0)==0;if(r2256){r2257=r66;r2258=(r2257|0)==0;if(r2258){r3=1377}else{r3=1376}}else{r3=1376}if(r3==1376){r2259=r9;r2260=(r2259|0)==4;if(r2260){r3=1377}}do{if(r3==1377){r2261=r67;r2262=(r2261|0)==0;if(!r2262){break}r67=-5}}while(0);r2263=r67;r2114=r2263;r2115=r2114;STACKTOP=r4;return r2115}}while(0);r2114=-2;r2115=r2114;STACKTOP=r4;return r2115}function _fixedtables(r1){var r2;r2=r1;HEAP32[r2+76>>2]=1688;HEAP32[r2+84>>2]=9;HEAP32[r2+80>>2]=3736;HEAP32[r2+88>>2]=5;return}function _updatewindow(r1,r2){var r3,r4,r5,r6,r7,r8,r9;r3=r1;r1=r2;r2=HEAP32[r3+28>>2];do{if((HEAP32[r2+52>>2]|0)==0){HEAP32[r2+52>>2]=FUNCTION_TABLE[HEAP32[r3+32>>2]](HEAP32[r3+40>>2],1<<HEAP32[r2+36>>2],1);if((HEAP32[r2+52>>2]|0)!=0){break}r4=1;r5=r4;return r5}}while(0);if((HEAP32[r2+40>>2]|0)==0){HEAP32[r2+40>>2]=1<<HEAP32[r2+36>>2];HEAP32[r2+48>>2]=0;HEAP32[r2+44>>2]=0}r6=r1-HEAP32[r3+16>>2]|0;if(r6>>>0>=HEAP32[r2+40>>2]>>>0){r1=HEAP32[r2+52>>2];r7=HEAP32[r3+12>>2]+ -HEAP32[r2+40>>2]|0;r8=HEAP32[r2+40>>2];_memcpy(r1,r7,r8)|0;HEAP32[r2+48>>2]=0;HEAP32[r2+44>>2]=HEAP32[r2+40>>2]}else{r8=HEAP32[r2+40>>2]-HEAP32[r2+48>>2]|0;if(r8>>>0>r6>>>0){r8=r6}r7=HEAP32[r2+52>>2]+HEAP32[r2+48>>2]|0;r1=HEAP32[r3+12>>2]+ -r6|0;r9=r8;_memcpy(r7,r1,r9)|0;r6=r6-r8|0;if((r6|0)!=0){r9=HEAP32[r2+52>>2];r1=HEAP32[r3+12>>2]+ -r6|0;r3=r6;_memcpy(r9,r1,r3)|0;HEAP32[r2+48>>2]=r6;HEAP32[r2+44>>2]=HEAP32[r2+40>>2]}else{r6=r2+48|0;HEAP32[r6>>2]=HEAP32[r6>>2]+r8;if((HEAP32[r2+48>>2]|0)==(HEAP32[r2+40>>2]|0)){HEAP32[r2+48>>2]=0}if(HEAP32[r2+44>>2]>>>0<HEAP32[r2+40>>2]>>>0){r6=r2+44|0;HEAP32[r6>>2]=HEAP32[r6>>2]+r8}}}r4=0;r5=r4;return r5}function _inflateEnd(r1){var r2,r3,r4;r2=r1;do{if((r2|0)!=0){if((HEAP32[r2+28>>2]|0)==0){break}if((HEAP32[r2+36>>2]|0)==0){break}r1=HEAP32[r2+28>>2];if((HEAP32[r1+52>>2]|0)!=0){FUNCTION_TABLE[HEAP32[r2+36>>2]](HEAP32[r2+40>>2],HEAP32[r1+52>>2])}FUNCTION_TABLE[HEAP32[r2+36>>2]](HEAP32[r2+40>>2],HEAP32[r2+28>>2]);HEAP32[r2+28>>2]=0;r3=0;r4=r3;return r4}}while(0);r3=-2;r4=r3;return r4}function _inflate_table(r1,r2,r3,r4,r5,r6){var r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31;r7=0;r8=STACKTOP;STACKTOP=STACKTOP+72|0;r9=r8;r10=r8+8;r11=r8+40;r12=r1;r1=r2;r2=r3;r3=r4;r4=r5;r5=r6;r6=0;while(1){if(r6>>>0>15){break}HEAP16[r10+(r6<<1)>>1]=0;r6=r6+1|0}r13=0;while(1){if(r13>>>0>=r2>>>0){break}r14=r10+(HEAPU16[r1+(r13<<1)>>1]<<1)|0;HEAP16[r14>>1]=HEAP16[r14>>1]+1&65535;r13=r13+1|0}r14=HEAP32[r4>>2];r15=15;while(1){if(r15>>>0<1){break}if((HEAPU16[r10+(r15<<1)>>1]|0)!=0){r7=1431;break}r15=r15-1|0}if(r14>>>0>r15>>>0){r14=r15}if((r15|0)==0){HEAP8[r9|0]=64;HEAP8[r9+1|0]=1;HEAP16[r9+2>>1]=0;r16=r3;r17=HEAP32[r16>>2];HEAP32[r16>>2]=r17+4;r16=r17;r17=r9;HEAP16[r16>>1]=HEAP16[r17>>1];HEAP16[r16+2>>1]=HEAP16[r17+2>>1];r17=r3;r16=HEAP32[r17>>2];HEAP32[r17>>2]=r16+4;r17=r16;r16=r9;HEAP16[r17>>1]=HEAP16[r16>>1];HEAP16[r17+2>>1]=HEAP16[r16+2>>1];HEAP32[r4>>2]=1;r18=0;r19=r18;STACKTOP=r8;return r19}r16=1;while(1){if(r16>>>0>=r15>>>0){break}if((HEAPU16[r10+(r16<<1)>>1]|0)!=0){r7=1441;break}r16=r16+1|0}if(r14>>>0<r16>>>0){r14=r16}r17=1;r6=1;while(1){if(r6>>>0>15){break}r17=r17<<1;r17=r17-HEAPU16[r10+(r6<<1)>>1]|0;if((r17|0)<0){r7=1449;break}r6=r6+1|0}if(r7==1449){r18=-1;r19=r18;STACKTOP=r8;return r19}do{if((r17|0)>0){if((r12|0)!=0){if((r15|0)==1){break}}r18=-1;r19=r18;STACKTOP=r8;return r19}}while(0);HEAP16[r11+2>>1]=0;r6=1;while(1){if(r6>>>0>=15){break}HEAP16[r11+(r6+1<<1)>>1]=HEAPU16[r11+(r6<<1)>>1]+HEAPU16[r10+(r6<<1)>>1]&65535;r6=r6+1|0}r13=0;while(1){if(r13>>>0>=r2>>>0){break}if((HEAPU16[r1+(r13<<1)>>1]|0)!=0){r20=r11+(HEAPU16[r1+(r13<<1)>>1]<<1)|0;r21=HEAP16[r20>>1];HEAP16[r20>>1]=r21+1&65535;HEAP16[r5+((r21&65535)<<1)>>1]=r13&65535}r13=r13+1|0}r11=r12;if((r11|0)==0){r2=r5;r22=r2;r23=r2;r24=19}else if((r11|0)==1){r23=1456;r23=r23-514|0;r22=1392;r22=r22-514|0;r24=256}else{r23=1584;r22=1520;r24=-1}r11=0;r13=0;r6=r16;r2=HEAP32[r3>>2];r21=r14;r20=0;r25=-1;r26=1<<r14;r27=r26-1|0;if((r12|0)==1){if(r26>>>0<852){r7=1472}}else{r7=1472}do{if(r7==1472){if((r12|0)==2){if(r26>>>0>=592){break}}L1862:while(1){HEAP8[r9+1|0]=r6-r20&255;if((HEAPU16[r5+(r13<<1)>>1]|0)<(r24|0)){HEAP8[r9|0]=0;HEAP16[r9+2>>1]=HEAP16[r5+(r13<<1)>>1]}else{if((HEAPU16[r5+(r13<<1)>>1]|0)>(r24|0)){HEAP8[r9|0]=HEAP16[r22+(HEAPU16[r5+(r13<<1)>>1]<<1)>>1]&255;HEAP16[r9+2>>1]=HEAP16[r23+(HEAPU16[r5+(r13<<1)>>1]<<1)>>1]}else{HEAP8[r9|0]=96;HEAP16[r9+2>>1]=0}}r28=1<<r6-r20;r29=1<<r21;r16=r29;while(1){r29=r29-r28|0;r30=r2+((r11>>>(r20>>>0))+r29<<2)|0;r31=r9;HEAP16[r30>>1]=HEAP16[r31>>1];HEAP16[r30+2>>1]=HEAP16[r31+2>>1];if((r29|0)==0){break}}r28=1<<r6-1;while(1){if((r11&r28|0)==0){break}r28=r28>>>1}if((r28|0)!=0){r11=r11&r28-1;r11=r11+r28|0}else{r11=0}r13=r13+1|0;r29=r10+(r6<<1)|0;r31=HEAP16[r29>>1]-1&65535;HEAP16[r29>>1]=r31;if((r31&65535|0)==0){if((r6|0)==(r15|0)){break}r6=HEAPU16[r1+(HEAPU16[r5+(r13<<1)>>1]<<1)>>1]}do{if(r6>>>0>r14>>>0){if((r11&r27|0)==(r25|0)){break}if((r20|0)==0){r20=r14}r2=r2+(r16<<2)|0;r21=r6-r20|0;r17=1<<r21;while(1){if((r21+r20|0)>>>0>=r15>>>0){break}r17=r17-HEAPU16[r10+(r21+r20<<1)>>1]|0;if((r17|0)<=0){r7=1502;break}r21=r21+1|0;r17=r17<<1}if(r7==1502){r7=0}r26=r26+(1<<r21)|0;if((r12|0)==1){if(r26>>>0>=852){r7=1508;break L1862}}if((r12|0)==2){if(r26>>>0>=592){r7=1508;break L1862}}r25=r11&r27;HEAP8[HEAP32[r3>>2]+(r25<<2)|0]=r21&255;HEAP8[HEAP32[r3>>2]+(r25<<2)+1|0]=r14&255;HEAP16[HEAP32[r3>>2]+(r25<<2)+2>>1]=(r2-HEAP32[r3>>2]|0)/4&-1&65535}}while(0)}if(r7==1508){r18=1;r19=r18;STACKTOP=r8;return r19}if((r11|0)!=0){HEAP8[r9|0]=64;HEAP8[r9+1|0]=r6-r20&255;HEAP16[r9+2>>1]=0;r28=r2+(r11<<2)|0;r31=r9;HEAP16[r28>>1]=HEAP16[r31>>1];HEAP16[r28+2>>1]=HEAP16[r31+2>>1]}r31=r3;HEAP32[r31>>2]=HEAP32[r31>>2]+(r26<<2);HEAP32[r4>>2]=r14;r18=0;r19=r18;STACKTOP=r8;return r19}}while(0);r18=1;r19=r18;STACKTOP=r8;return r19}function __tr_init(r1){var r2;r2=r1;_tr_static_init();HEAP32[r2+2840>>2]=r2+148;HEAP32[r2+2848>>2]=1200;HEAP32[r2+2852>>2]=r2+2440;HEAP32[r2+2860>>2]=1344;HEAP32[r2+2864>>2]=r2+2684;HEAP32[r2+2872>>2]=1368;HEAP16[r2+5816>>1]=0;HEAP32[r2+5820>>2]=0;_init_block(r2);return}function _tr_static_init(){return}function _init_block(r1){var r2;r2=r1;r1=0;while(1){if((r1|0)>=286){break}HEAP16[r2+148+(r1<<2)>>1]=0;r1=r1+1|0}r1=0;while(1){if((r1|0)>=30){break}HEAP16[r2+2440+(r1<<2)>>1]=0;r1=r1+1|0}r1=0;while(1){if((r1|0)>=19){break}HEAP16[r2+2684+(r1<<2)>>1]=0;r1=r1+1|0}HEAP16[r2+1172>>1]=1;HEAP32[r2+5804>>2]=0;HEAP32[r2+5800>>2]=0;HEAP32[r2+5808>>2]=0;HEAP32[r2+5792>>2]=0;return}function __tr_stored_block(r1,r2,r3,r4){var r5,r6,r7,r8,r9,r10,r11,r12;r5=r1;r1=r2;r2=r3;r3=r4;r4=3;if((HEAP32[r5+5820>>2]|0)>(16-r4|0)){r6=r3|0;r7=r5+5816|0;HEAP16[r7>>1]=(HEAPU16[r7>>1]|(r6&65535)<<HEAP32[r5+5820>>2])&65535;r7=HEAPU16[r5+5816>>1]&255;r8=r5+20|0;r9=HEAP32[r8>>2];HEAP32[r8>>2]=r9+1;HEAP8[HEAP32[r5+8>>2]+r9|0]=r7;r7=HEAPU16[r5+5816>>1]>>8&255;r9=r5+20|0;r8=HEAP32[r9>>2];HEAP32[r9>>2]=r8+1;HEAP8[HEAP32[r5+8>>2]+r8|0]=r7;HEAP16[r5+5816>>1]=(r6&65535)>>16-HEAP32[r5+5820>>2]&65535;r6=r5+5820|0;HEAP32[r6>>2]=HEAP32[r6>>2]+(r4-16);r10=r5;r11=r1;r12=r2;_copy_block(r10,r11,r12,1);return}else{r6=r5+5816|0;HEAP16[r6>>1]=(HEAPU16[r6>>1]|(r3&65535)<<HEAP32[r5+5820>>2])&65535;r3=r5+5820|0;HEAP32[r3>>2]=HEAP32[r3>>2]+r4;r10=r5;r11=r1;r12=r2;_copy_block(r10,r11,r12,1);return}}function _copy_block(r1,r2,r3,r4){var r5,r6;r5=r1;r1=r2;r2=r3;_bi_windup(r5);if((r4|0)!=0){r4=r5+20|0;r3=HEAP32[r4>>2];HEAP32[r4>>2]=r3+1;HEAP8[HEAP32[r5+8>>2]+r3|0]=r2&65535&255;r3=r5+20|0;r4=HEAP32[r3>>2];HEAP32[r3>>2]=r4+1;HEAP8[HEAP32[r5+8>>2]+r4|0]=(r2&65535)>>8&255;r4=r5+20|0;r3=HEAP32[r4>>2];HEAP32[r4>>2]=r3+1;HEAP8[HEAP32[r5+8>>2]+r3|0]=~r2&65535&255;r3=r5+20|0;r4=HEAP32[r3>>2];HEAP32[r3>>2]=r4+1;HEAP8[HEAP32[r5+8>>2]+r4|0]=(~r2&65535)>>8&255}while(1){r4=r2;r2=r4-1|0;if((r4|0)==0){break}r4=r1;r1=r4+1|0;r3=HEAP8[r4];r4=r5+20|0;r6=HEAP32[r4>>2];HEAP32[r4>>2]=r6+1;HEAP8[HEAP32[r5+8>>2]+r6|0]=r3}return}function __tr_flush_bits(r1){_bi_flush(r1);return}function _bi_flush(r1){var r2,r3,r4;r2=r1;if((HEAP32[r2+5820>>2]|0)==16){r1=HEAPU16[r2+5816>>1]&255;r3=r2+20|0;r4=HEAP32[r3>>2];HEAP32[r3>>2]=r4+1;HEAP8[HEAP32[r2+8>>2]+r4|0]=r1;r1=HEAPU16[r2+5816>>1]>>8&255;r4=r2+20|0;r3=HEAP32[r4>>2];HEAP32[r4>>2]=r3+1;HEAP8[HEAP32[r2+8>>2]+r3|0]=r1;HEAP16[r2+5816>>1]=0;HEAP32[r2+5820>>2]=0;return}if((HEAP32[r2+5820>>2]|0)>=8){r1=HEAP16[r2+5816>>1]&255;r3=r2+20|0;r4=HEAP32[r3>>2];HEAP32[r3>>2]=r4+1;HEAP8[HEAP32[r2+8>>2]+r4|0]=r1;r1=r2+5816|0;HEAP16[r1>>1]=HEAPU16[r1>>1]>>8&65535;r1=r2+5820|0;HEAP32[r1>>2]=HEAP32[r1>>2]-8}return}function __tr_align(r1){var r2,r3,r4,r5,r6,r7;r2=r1;r1=3;if((HEAP32[r2+5820>>2]|0)>(16-r1|0)){r3=2;r4=r2+5816|0;HEAP16[r4>>1]=(HEAPU16[r4>>1]|(r3&65535)<<HEAP32[r2+5820>>2])&65535;r4=HEAPU16[r2+5816>>1]&255;r5=r2+20|0;r6=HEAP32[r5>>2];HEAP32[r5>>2]=r6+1;HEAP8[HEAP32[r2+8>>2]+r6|0]=r4;r4=HEAPU16[r2+5816>>1]>>8&255;r6=r2+20|0;r5=HEAP32[r6>>2];HEAP32[r6>>2]=r5+1;HEAP8[HEAP32[r2+8>>2]+r5|0]=r4;HEAP16[r2+5816>>1]=(r3&65535)>>16-HEAP32[r2+5820>>2]&65535;r3=r2+5820|0;HEAP32[r3>>2]=HEAP32[r3>>2]+(r1-16)}else{r3=r2+5816|0;HEAP16[r3>>1]=(HEAPU16[r3>>1]|2<<HEAP32[r2+5820>>2])&65535;r3=r2+5820|0;HEAP32[r3>>2]=HEAP32[r3>>2]+r1}r1=HEAPU16[1074>>1];if((HEAP32[r2+5820>>2]|0)>(16-r1|0)){r3=HEAPU16[1072>>1];r4=r2+5816|0;HEAP16[r4>>1]=(HEAPU16[r4>>1]|(r3&65535)<<HEAP32[r2+5820>>2])&65535;r4=HEAPU16[r2+5816>>1]&255;r5=r2+20|0;r6=HEAP32[r5>>2];HEAP32[r5>>2]=r6+1;HEAP8[HEAP32[r2+8>>2]+r6|0]=r4;r4=HEAPU16[r2+5816>>1]>>8&255;r6=r2+20|0;r5=HEAP32[r6>>2];HEAP32[r6>>2]=r5+1;HEAP8[HEAP32[r2+8>>2]+r5|0]=r4;HEAP16[r2+5816>>1]=(r3&65535)>>16-HEAP32[r2+5820>>2]&65535;r3=r2+5820|0;HEAP32[r3>>2]=HEAP32[r3>>2]+(r1-16);r7=r2;_bi_flush(r7);return}else{r3=r2+5816|0;HEAP16[r3>>1]=(HEAPU16[r3>>1]|HEAPU16[1072>>1]<<HEAP32[r2+5820>>2])&65535;r3=r2+5820|0;HEAP32[r3>>2]=HEAP32[r3>>2]+r1;r7=r2;_bi_flush(r7);return}}function __tr_flush_block(r1,r2,r3,r4){var r5,r6,r7,r8,r9,r10,r11;r5=0;r6=r1;r1=r2;r2=r3;r3=r4;r4=0;if((HEAP32[r6+132>>2]|0)>0){if((HEAP32[HEAP32[r6>>2]+44>>2]|0)==2){r7=_detect_data_type(r6);HEAP32[HEAP32[r6>>2]+44>>2]=r7}_build_tree(r6,r6+2840|0);_build_tree(r6,r6+2852|0);r4=_build_bl_tree(r6);r8=(HEAP32[r6+5800>>2]+10|0)>>>3;r9=(HEAP32[r6+5804>>2]+10|0)>>>3;if(r9>>>0<=r8>>>0){r8=r9}}else{r7=r2+5|0;r9=r7;r8=r7}do{if((r2+4|0)>>>0<=r8>>>0){if((r1|0)==0){r5=1576;break}__tr_stored_block(r6,r1,r2,r3)}else{r5=1576}}while(0);if(r5==1576){do{if((HEAP32[r6+136>>2]|0)==4){r5=1578}else{if((r9|0)==(r8|0)){r5=1578;break}r2=3;if((HEAP32[r6+5820>>2]|0)>(16-r2|0)){r1=r3+4|0;r7=r6+5816|0;HEAP16[r7>>1]=(HEAPU16[r7>>1]|(r1&65535)<<HEAP32[r6+5820>>2])&65535;r7=HEAPU16[r6+5816>>1]&255;r10=r6+20|0;r11=HEAP32[r10>>2];HEAP32[r10>>2]=r11+1;HEAP8[HEAP32[r6+8>>2]+r11|0]=r7;r7=HEAPU16[r6+5816>>1]>>8&255;r11=r6+20|0;r10=HEAP32[r11>>2];HEAP32[r11>>2]=r10+1;HEAP8[HEAP32[r6+8>>2]+r10|0]=r7;HEAP16[r6+5816>>1]=(r1&65535)>>16-HEAP32[r6+5820>>2]&65535;r1=r6+5820|0;HEAP32[r1>>2]=HEAP32[r1>>2]+(r2-16)}else{r1=r6+5816|0;HEAP16[r1>>1]=(HEAPU16[r1>>1]|(r3+4&65535)<<HEAP32[r6+5820>>2])&65535;r1=r6+5820|0;HEAP32[r1>>2]=HEAP32[r1>>2]+r2}_send_all_trees(r6,HEAP32[r6+2844>>2]+1|0,HEAP32[r6+2856>>2]+1|0,r4+1|0);_compress_block(r6,r6+148|0,r6+2440|0)}}while(0);if(r5==1578){r5=3;if((HEAP32[r6+5820>>2]|0)>(16-r5|0)){r4=r3+2|0;r8=r6+5816|0;HEAP16[r8>>1]=(HEAPU16[r8>>1]|(r4&65535)<<HEAP32[r6+5820>>2])&65535;r8=HEAPU16[r6+5816>>1]&255;r9=r6+20|0;r2=HEAP32[r9>>2];HEAP32[r9>>2]=r2+1;HEAP8[HEAP32[r6+8>>2]+r2|0]=r8;r8=HEAPU16[r6+5816>>1]>>8&255;r2=r6+20|0;r9=HEAP32[r2>>2];HEAP32[r2>>2]=r9+1;HEAP8[HEAP32[r6+8>>2]+r9|0]=r8;HEAP16[r6+5816>>1]=(r4&65535)>>16-HEAP32[r6+5820>>2]&65535;r4=r6+5820|0;HEAP32[r4>>2]=HEAP32[r4>>2]+(r5-16)}else{r4=r6+5816|0;HEAP16[r4>>1]=(HEAPU16[r4>>1]|(r3+2&65535)<<HEAP32[r6+5820>>2])&65535;r4=r6+5820|0;HEAP32[r4>>2]=HEAP32[r4>>2]+r5}_compress_block(r6,48,1224)}}_init_block(r6);if((r3|0)==0){return}_bi_windup(r6);return}function _detect_data_type(r1){var r2,r3,r4,r5,r6;r2=0;r3=r1;r1=-201342849;r4=0;while(1){if((r4|0)>31){break}if((r1&1|0)!=0){if((HEAPU16[r3+148+(r4<<2)>>1]|0)!=0){r2=1596;break}}r4=r4+1|0;r1=r1>>>1}if(r2==1596){r5=0;r6=r5;return r6}do{if((HEAPU16[r3+184>>1]|0)==0){if((HEAPU16[r3+188>>1]|0)!=0){break}if((HEAPU16[r3+200>>1]|0)!=0){break}r4=32;while(1){if((r4|0)>=256){r2=1609;break}if((HEAPU16[r3+148+(r4<<2)>>1]|0)!=0){r2=1606;break}r4=r4+1|0}if(r2==1609){r5=0;r6=r5;return r6}else if(r2==1606){r5=1;r6=r5;return r6}}}while(0);r5=1;r6=r5;return r6}function _build_tree(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13;r3=r1;r1=r2;r2=HEAP32[r1>>2];r4=HEAP32[HEAP32[r1+8>>2]>>2];r5=HEAP32[HEAP32[r1+8>>2]+12>>2];r6=-1;HEAP32[r3+5200>>2]=0;HEAP32[r3+5204>>2]=573;r7=0;while(1){if((r7|0)>=(r5|0)){break}if((HEAPU16[r2+(r7<<2)>>1]|0)!=0){r8=r7;r6=r8;r9=r3+5200|0;r10=HEAP32[r9>>2]+1|0;HEAP32[r9>>2]=r10;HEAP32[r3+2908+(r10<<2)>>2]=r8;HEAP8[r3+5208+r7|0]=0}else{HEAP16[r2+(r7<<2)+2>>1]=0}r7=r7+1|0}while(1){if((HEAP32[r3+5200>>2]|0)>=2){break}if((r6|0)<2){r8=r6+1|0;r6=r8;r11=r8}else{r11=0}r8=r3+5200|0;r10=HEAP32[r8>>2]+1|0;HEAP32[r8>>2]=r10;HEAP32[r3+2908+(r10<<2)>>2]=r11;r12=r11;HEAP16[r2+(r12<<2)>>1]=1;HEAP8[r3+5208+r12|0]=0;r10=r3+5800|0;HEAP32[r10>>2]=HEAP32[r10>>2]-1;if((r4|0)!=0){r10=r3+5804|0;HEAP32[r10>>2]=HEAP32[r10>>2]-HEAPU16[r4+(r12<<2)+2>>1]}}HEAP32[r1+4>>2]=r6;r7=(HEAP32[r3+5200>>2]|0)/2&-1;while(1){if((r7|0)<1){break}_pqdownheap(r3,r2,r7);r7=r7-1|0}r12=r5;while(1){r7=HEAP32[r3+2912>>2];r5=r3+5200|0;r4=HEAP32[r5>>2];HEAP32[r5>>2]=r4-1;HEAP32[r3+2912>>2]=HEAP32[r3+2908+(r4<<2)>>2];_pqdownheap(r3,r2,1);r4=HEAP32[r3+2912>>2];r5=r3+5204|0;r11=HEAP32[r5>>2]-1|0;HEAP32[r5>>2]=r11;HEAP32[r3+2908+(r11<<2)>>2]=r7;r11=r3+5204|0;r5=HEAP32[r11>>2]-1|0;HEAP32[r11>>2]=r5;HEAP32[r3+2908+(r5<<2)>>2]=r4;HEAP16[r2+(r12<<2)>>1]=HEAPU16[r2+(r7<<2)>>1]+HEAPU16[r2+(r4<<2)>>1]&65535;if((HEAPU8[r3+5208+r7|0]|0)>=(HEAPU8[r3+5208+r4|0]|0)){r13=HEAPU8[r3+5208+r7|0]}else{r13=HEAPU8[r3+5208+r4|0]}HEAP8[r3+5208+r12|0]=r13+1&255;r5=r12&65535;HEAP16[r2+(r4<<2)+2>>1]=r5;HEAP16[r2+(r7<<2)+2>>1]=r5;r5=r12;r12=r5+1|0;HEAP32[r3+2912>>2]=r5;_pqdownheap(r3,r2,1);if((HEAP32[r3+5200>>2]|0)<2){break}}r12=HEAP32[r3+2912>>2];r7=r3+5204|0;r13=HEAP32[r7>>2]-1|0;HEAP32[r7>>2]=r13;HEAP32[r3+2908+(r13<<2)>>2]=r12;_gen_bitlen(r3,r1);_gen_codes(r2,r6,r3+2876|0);return}function _build_bl_tree(r1){var r2,r3;r2=0;r3=r1;_scan_tree(r3,r3+148|0,HEAP32[r3+2844>>2]);_scan_tree(r3,r3+2440|0,HEAP32[r3+2856>>2]);_build_tree(r3,r3+2864|0);r1=18;while(1){if((r1|0)<3){break}if((HEAPU16[r3+2684+(HEAPU8[r1+12504|0]<<2)+2>>1]|0)!=0){r2=1644;break}r1=r1-1|0}r2=r3+5800|0;HEAP32[r2>>2]=HEAP32[r2>>2]+(((r1+1)*3&-1)+14);return r1}function _compress_block(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14;r4=r1;r1=r2;r2=r3;r3=0;if((HEAP32[r4+5792>>2]|0)!=0){while(1){r5=HEAPU16[HEAP32[r4+5796>>2]+(r3<<1)>>1];r6=r3;r3=r6+1|0;r7=HEAPU8[HEAP32[r4+5784>>2]+r6|0];if((r5|0)==0){r6=HEAPU16[r1+(r7<<2)+2>>1];if((HEAP32[r4+5820>>2]|0)>(16-r6|0)){r8=HEAPU16[r1+(r7<<2)>>1];r9=r4+5816|0;HEAP16[r9>>1]=(HEAPU16[r9>>1]|(r8&65535)<<HEAP32[r4+5820>>2])&65535;r9=HEAPU16[r4+5816>>1]&255;r10=r4+20|0;r11=HEAP32[r10>>2];HEAP32[r10>>2]=r11+1;HEAP8[HEAP32[r4+8>>2]+r11|0]=r9;r9=HEAPU16[r4+5816>>1]>>8&255;r11=r4+20|0;r10=HEAP32[r11>>2];HEAP32[r11>>2]=r10+1;HEAP8[HEAP32[r4+8>>2]+r10|0]=r9;HEAP16[r4+5816>>1]=(r8&65535)>>16-HEAP32[r4+5820>>2]&65535;r8=r4+5820|0;HEAP32[r8>>2]=HEAP32[r8>>2]+(r6-16)}else{r8=r4+5816|0;HEAP16[r8>>1]=(HEAPU16[r8>>1]|HEAPU16[r1+(r7<<2)>>1]<<HEAP32[r4+5820>>2])&65535;r8=r4+5820|0;HEAP32[r8>>2]=HEAP32[r8>>2]+r6}}else{r6=HEAPU8[r7+13880|0];r8=HEAPU16[r1+(r6+257<<2)+2>>1];if((HEAP32[r4+5820>>2]|0)>(16-r8|0)){r9=HEAPU16[r1+(r6+257<<2)>>1];r10=r4+5816|0;HEAP16[r10>>1]=(HEAPU16[r10>>1]|(r9&65535)<<HEAP32[r4+5820>>2])&65535;r10=HEAPU16[r4+5816>>1]&255;r11=r4+20|0;r12=HEAP32[r11>>2];HEAP32[r11>>2]=r12+1;HEAP8[HEAP32[r4+8>>2]+r12|0]=r10;r10=HEAPU16[r4+5816>>1]>>8&255;r12=r4+20|0;r11=HEAP32[r12>>2];HEAP32[r12>>2]=r11+1;HEAP8[HEAP32[r4+8>>2]+r11|0]=r10;HEAP16[r4+5816>>1]=(r9&65535)>>16-HEAP32[r4+5820>>2]&65535;r9=r4+5820|0;HEAP32[r9>>2]=HEAP32[r9>>2]+(r8-16)}else{r9=r4+5816|0;HEAP16[r9>>1]=(HEAPU16[r9>>1]|HEAPU16[r1+(r6+257<<2)>>1]<<HEAP32[r4+5820>>2])&65535;r9=r4+5820|0;HEAP32[r9>>2]=HEAP32[r9>>2]+r8}r8=HEAP32[3864+(r6<<2)>>2];if((r8|0)!=0){r7=r7-HEAP32[12528+(r6<<2)>>2]|0;r9=r8;if((HEAP32[r4+5820>>2]|0)>(16-r9|0)){r10=r7;r11=r4+5816|0;HEAP16[r11>>1]=(HEAPU16[r11>>1]|(r10&65535)<<HEAP32[r4+5820>>2])&65535;r11=HEAPU16[r4+5816>>1]&255;r12=r4+20|0;r13=HEAP32[r12>>2];HEAP32[r12>>2]=r13+1;HEAP8[HEAP32[r4+8>>2]+r13|0]=r11;r11=HEAPU16[r4+5816>>1]>>8&255;r13=r4+20|0;r12=HEAP32[r13>>2];HEAP32[r13>>2]=r12+1;HEAP8[HEAP32[r4+8>>2]+r12|0]=r11;HEAP16[r4+5816>>1]=(r10&65535)>>16-HEAP32[r4+5820>>2]&65535;r10=r4+5820|0;HEAP32[r10>>2]=HEAP32[r10>>2]+(r9-16)}else{r10=r4+5816|0;HEAP16[r10>>1]=(HEAPU16[r10>>1]|(r7&65535)<<HEAP32[r4+5820>>2])&65535;r7=r4+5820|0;HEAP32[r7>>2]=HEAP32[r7>>2]+r9}}r5=r5-1|0;if(r5>>>0<256){r14=HEAPU8[r5+14136|0]}else{r14=HEAPU8[(r5>>>7)+14392|0]}r6=r14;r9=HEAPU16[r2+(r6<<2)+2>>1];if((HEAP32[r4+5820>>2]|0)>(16-r9|0)){r7=HEAPU16[r2+(r6<<2)>>1];r10=r4+5816|0;HEAP16[r10>>1]=(HEAPU16[r10>>1]|(r7&65535)<<HEAP32[r4+5820>>2])&65535;r10=HEAPU16[r4+5816>>1]&255;r11=r4+20|0;r12=HEAP32[r11>>2];HEAP32[r11>>2]=r12+1;HEAP8[HEAP32[r4+8>>2]+r12|0]=r10;r10=HEAPU16[r4+5816>>1]>>8&255;r12=r4+20|0;r11=HEAP32[r12>>2];HEAP32[r12>>2]=r11+1;HEAP8[HEAP32[r4+8>>2]+r11|0]=r10;HEAP16[r4+5816>>1]=(r7&65535)>>16-HEAP32[r4+5820>>2]&65535;r7=r4+5820|0;HEAP32[r7>>2]=HEAP32[r7>>2]+(r9-16)}else{r7=r4+5816|0;HEAP16[r7>>1]=(HEAPU16[r7>>1]|HEAPU16[r2+(r6<<2)>>1]<<HEAP32[r4+5820>>2])&65535;r7=r4+5820|0;HEAP32[r7>>2]=HEAP32[r7>>2]+r9}r8=HEAP32[3984+(r6<<2)>>2];if((r8|0)!=0){r5=r5-HEAP32[12648+(r6<<2)>>2]|0;r6=r8;if((HEAP32[r4+5820>>2]|0)>(16-r6|0)){r8=r5;r9=r4+5816|0;HEAP16[r9>>1]=(HEAPU16[r9>>1]|(r8&65535)<<HEAP32[r4+5820>>2])&65535;r9=HEAPU16[r4+5816>>1]&255;r7=r4+20|0;r10=HEAP32[r7>>2];HEAP32[r7>>2]=r10+1;HEAP8[HEAP32[r4+8>>2]+r10|0]=r9;r9=HEAPU16[r4+5816>>1]>>8&255;r10=r4+20|0;r7=HEAP32[r10>>2];HEAP32[r10>>2]=r7+1;HEAP8[HEAP32[r4+8>>2]+r7|0]=r9;HEAP16[r4+5816>>1]=(r8&65535)>>16-HEAP32[r4+5820>>2]&65535;r8=r4+5820|0;HEAP32[r8>>2]=HEAP32[r8>>2]+(r6-16)}else{r8=r4+5816|0;HEAP16[r8>>1]=(HEAPU16[r8>>1]|(r5&65535)<<HEAP32[r4+5820>>2])&65535;r5=r4+5820|0;HEAP32[r5>>2]=HEAP32[r5>>2]+r6}}}if(r3>>>0>=HEAP32[r4+5792>>2]>>>0){break}}}r3=HEAPU16[r1+1026>>1];if((HEAP32[r4+5820>>2]|0)>(16-r3|0)){r2=HEAPU16[r1+1024>>1];r14=r4+5816|0;HEAP16[r14>>1]=(HEAPU16[r14>>1]|(r2&65535)<<HEAP32[r4+5820>>2])&65535;r14=HEAPU16[r4+5816>>1]&255;r6=r4+20|0;r5=HEAP32[r6>>2];HEAP32[r6>>2]=r5+1;HEAP8[HEAP32[r4+8>>2]+r5|0]=r14;r14=HEAPU16[r4+5816>>1]>>8&255;r5=r4+20|0;r6=HEAP32[r5>>2];HEAP32[r5>>2]=r6+1;HEAP8[HEAP32[r4+8>>2]+r6|0]=r14;HEAP16[r4+5816>>1]=(r2&65535)>>16-HEAP32[r4+5820>>2]&65535;r2=r4+5820|0;HEAP32[r2>>2]=HEAP32[r2>>2]+(r3-16);return}else{r2=r4+5816|0;HEAP16[r2>>1]=(HEAPU16[r2>>1]|HEAPU16[r1+1024>>1]<<HEAP32[r4+5820>>2])&65535;r1=r4+5820|0;HEAP32[r1>>2]=HEAP32[r1>>2]+r3;return}}function _send_all_trees(r1,r2,r3,r4){var r5,r6,r7,r8,r9,r10;r5=r1;r1=r2;r2=r3;r3=r4;r4=5;if((HEAP32[r5+5820>>2]|0)>(16-r4|0)){r6=r1-257|0;r7=r5+5816|0;HEAP16[r7>>1]=(HEAPU16[r7>>1]|(r6&65535)<<HEAP32[r5+5820>>2])&65535;r7=HEAPU16[r5+5816>>1]&255;r8=r5+20|0;r9=HEAP32[r8>>2];HEAP32[r8>>2]=r9+1;HEAP8[HEAP32[r5+8>>2]+r9|0]=r7;r7=HEAPU16[r5+5816>>1]>>8&255;r9=r5+20|0;r8=HEAP32[r9>>2];HEAP32[r9>>2]=r8+1;HEAP8[HEAP32[r5+8>>2]+r8|0]=r7;HEAP16[r5+5816>>1]=(r6&65535)>>16-HEAP32[r5+5820>>2]&65535;r6=r5+5820|0;HEAP32[r6>>2]=HEAP32[r6>>2]+(r4-16)}else{r6=r5+5816|0;HEAP16[r6>>1]=(HEAPU16[r6>>1]|(r1-257&65535)<<HEAP32[r5+5820>>2])&65535;r6=r5+5820|0;HEAP32[r6>>2]=HEAP32[r6>>2]+r4}r4=5;if((HEAP32[r5+5820>>2]|0)>(16-r4|0)){r6=r2-1|0;r7=r5+5816|0;HEAP16[r7>>1]=(HEAPU16[r7>>1]|(r6&65535)<<HEAP32[r5+5820>>2])&65535;r7=HEAPU16[r5+5816>>1]&255;r8=r5+20|0;r9=HEAP32[r8>>2];HEAP32[r8>>2]=r9+1;HEAP8[HEAP32[r5+8>>2]+r9|0]=r7;r7=HEAPU16[r5+5816>>1]>>8&255;r9=r5+20|0;r8=HEAP32[r9>>2];HEAP32[r9>>2]=r8+1;HEAP8[HEAP32[r5+8>>2]+r8|0]=r7;HEAP16[r5+5816>>1]=(r6&65535)>>16-HEAP32[r5+5820>>2]&65535;r6=r5+5820|0;HEAP32[r6>>2]=HEAP32[r6>>2]+(r4-16)}else{r6=r5+5816|0;HEAP16[r6>>1]=(HEAPU16[r6>>1]|(r2-1&65535)<<HEAP32[r5+5820>>2])&65535;r6=r5+5820|0;HEAP32[r6>>2]=HEAP32[r6>>2]+r4}r4=4;if((HEAP32[r5+5820>>2]|0)>(16-r4|0)){r6=r3-4|0;r7=r5+5816|0;HEAP16[r7>>1]=(HEAPU16[r7>>1]|(r6&65535)<<HEAP32[r5+5820>>2])&65535;r7=HEAPU16[r5+5816>>1]&255;r8=r5+20|0;r9=HEAP32[r8>>2];HEAP32[r8>>2]=r9+1;HEAP8[HEAP32[r5+8>>2]+r9|0]=r7;r7=HEAPU16[r5+5816>>1]>>8&255;r9=r5+20|0;r8=HEAP32[r9>>2];HEAP32[r9>>2]=r8+1;HEAP8[HEAP32[r5+8>>2]+r8|0]=r7;HEAP16[r5+5816>>1]=(r6&65535)>>16-HEAP32[r5+5820>>2]&65535;r6=r5+5820|0;HEAP32[r6>>2]=HEAP32[r6>>2]+(r4-16)}else{r6=r5+5816|0;HEAP16[r6>>1]=(HEAPU16[r6>>1]|(r3-4&65535)<<HEAP32[r5+5820>>2])&65535;r6=r5+5820|0;HEAP32[r6>>2]=HEAP32[r6>>2]+r4}r4=0;while(1){if((r4|0)>=(r3|0)){break}r6=3;if((HEAP32[r5+5820>>2]|0)>(16-r6|0)){r7=HEAPU16[r5+2684+(HEAPU8[r4+12504|0]<<2)+2>>1];r8=r5+5816|0;HEAP16[r8>>1]=(HEAPU16[r8>>1]|(r7&65535)<<HEAP32[r5+5820>>2])&65535;r8=HEAPU16[r5+5816>>1]&255;r9=r5+20|0;r10=HEAP32[r9>>2];HEAP32[r9>>2]=r10+1;HEAP8[HEAP32[r5+8>>2]+r10|0]=r8;r8=HEAPU16[r5+5816>>1]>>8&255;r10=r5+20|0;r9=HEAP32[r10>>2];HEAP32[r10>>2]=r9+1;HEAP8[HEAP32[r5+8>>2]+r9|0]=r8;HEAP16[r5+5816>>1]=(r7&65535)>>16-HEAP32[r5+5820>>2]&65535;r7=r5+5820|0;HEAP32[r7>>2]=HEAP32[r7>>2]+(r6-16)}else{r7=r5+5816|0;HEAP16[r7>>1]=(HEAPU16[r7>>1]|HEAPU16[r5+2684+(HEAPU8[r4+12504|0]<<2)+2>>1]<<HEAP32[r5+5820>>2])&65535;r7=r5+5820|0;HEAP32[r7>>2]=HEAP32[r7>>2]+r6}r4=r4+1|0}_send_tree(r5,r5+148|0,r1-1|0);_send_tree(r5,r5+2440|0,r2-1|0);return}function _bi_windup(r1){var r2,r3,r4,r5,r6,r7,r8;r2=r1;if((HEAP32[r2+5820>>2]|0)>8){r1=HEAPU16[r2+5816>>1]&255;r3=r2+20|0;r4=HEAP32[r3>>2];HEAP32[r3>>2]=r4+1;HEAP8[HEAP32[r2+8>>2]+r4|0]=r1;r1=HEAPU16[r2+5816>>1]>>8&255;r4=r2+20|0;r3=HEAP32[r4>>2];HEAP32[r4>>2]=r3+1;HEAP8[HEAP32[r2+8>>2]+r3|0]=r1;r5=r2;r6=r5+5816|0;HEAP16[r6>>1]=0;r7=r2;r8=r7+5820|0;HEAP32[r8>>2]=0;return}if((HEAP32[r2+5820>>2]|0)>0){r1=HEAP16[r2+5816>>1]&255;r3=r2+20|0;r4=HEAP32[r3>>2];HEAP32[r3>>2]=r4+1;HEAP8[HEAP32[r2+8>>2]+r4|0]=r1}r5=r2;r6=r5+5816|0;HEAP16[r6>>1]=0;r7=r2;r8=r7+5820|0;HEAP32[r8>>2]=0;return}function _send_tree(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16;r4=0;r5=r1;r1=r2;r2=r3;r3=-1;r6=HEAPU16[r1+2>>1];r7=0;r8=7;r9=4;if((r6|0)==0){r8=138;r9=3}r10=0;while(1){if((r10|0)>(r2|0)){break}r11=r6;r6=HEAPU16[r1+(r10+1<<2)+2>>1];r12=r7+1|0;r7=r12;do{if((r12|0)<(r8|0)){if((r11|0)!=(r6|0)){r4=1716;break}}else{r4=1716}}while(0);if(r4==1716){r4=0;if((r7|0)<(r9|0)){while(1){r12=HEAPU16[r5+2684+(r11<<2)+2>>1];if((HEAP32[r5+5820>>2]|0)>(16-r12|0)){r13=HEAPU16[r5+2684+(r11<<2)>>1];r14=r5+5816|0;HEAP16[r14>>1]=(HEAPU16[r14>>1]|(r13&65535)<<HEAP32[r5+5820>>2])&65535;r14=HEAPU16[r5+5816>>1]&255;r15=r5+20|0;r16=HEAP32[r15>>2];HEAP32[r15>>2]=r16+1;HEAP8[HEAP32[r5+8>>2]+r16|0]=r14;r14=HEAPU16[r5+5816>>1]>>8&255;r16=r5+20|0;r15=HEAP32[r16>>2];HEAP32[r16>>2]=r15+1;HEAP8[HEAP32[r5+8>>2]+r15|0]=r14;HEAP16[r5+5816>>1]=(r13&65535)>>16-HEAP32[r5+5820>>2]&65535;r13=r5+5820|0;HEAP32[r13>>2]=HEAP32[r13>>2]+(r12-16)}else{r13=r5+5816|0;HEAP16[r13>>1]=(HEAPU16[r13>>1]|HEAPU16[r5+2684+(r11<<2)>>1]<<HEAP32[r5+5820>>2])&65535;r13=r5+5820|0;HEAP32[r13>>2]=HEAP32[r13>>2]+r12}r12=r7-1|0;r7=r12;if((r12|0)==0){break}}}else{if((r11|0)!=0){if((r11|0)!=(r3|0)){r12=HEAPU16[r5+2684+(r11<<2)+2>>1];if((HEAP32[r5+5820>>2]|0)>(16-r12|0)){r13=HEAPU16[r5+2684+(r11<<2)>>1];r14=r5+5816|0;HEAP16[r14>>1]=(HEAPU16[r14>>1]|(r13&65535)<<HEAP32[r5+5820>>2])&65535;r14=HEAPU16[r5+5816>>1]&255;r15=r5+20|0;r16=HEAP32[r15>>2];HEAP32[r15>>2]=r16+1;HEAP8[HEAP32[r5+8>>2]+r16|0]=r14;r14=HEAPU16[r5+5816>>1]>>8&255;r16=r5+20|0;r15=HEAP32[r16>>2];HEAP32[r16>>2]=r15+1;HEAP8[HEAP32[r5+8>>2]+r15|0]=r14;HEAP16[r5+5816>>1]=(r13&65535)>>16-HEAP32[r5+5820>>2]&65535;r13=r5+5820|0;HEAP32[r13>>2]=HEAP32[r13>>2]+(r12-16)}else{r13=r5+5816|0;HEAP16[r13>>1]=(HEAPU16[r13>>1]|HEAPU16[r5+2684+(r11<<2)>>1]<<HEAP32[r5+5820>>2])&65535;r13=r5+5820|0;HEAP32[r13>>2]=HEAP32[r13>>2]+r12}r7=r7-1|0}r12=HEAPU16[r5+2750>>1];if((HEAP32[r5+5820>>2]|0)>(16-r12|0)){r13=HEAPU16[r5+2748>>1];r14=r5+5816|0;HEAP16[r14>>1]=(HEAPU16[r14>>1]|(r13&65535)<<HEAP32[r5+5820>>2])&65535;r14=HEAPU16[r5+5816>>1]&255;r15=r5+20|0;r16=HEAP32[r15>>2];HEAP32[r15>>2]=r16+1;HEAP8[HEAP32[r5+8>>2]+r16|0]=r14;r14=HEAPU16[r5+5816>>1]>>8&255;r16=r5+20|0;r15=HEAP32[r16>>2];HEAP32[r16>>2]=r15+1;HEAP8[HEAP32[r5+8>>2]+r15|0]=r14;HEAP16[r5+5816>>1]=(r13&65535)>>16-HEAP32[r5+5820>>2]&65535;r13=r5+5820|0;HEAP32[r13>>2]=HEAP32[r13>>2]+(r12-16)}else{r13=r5+5816|0;HEAP16[r13>>1]=(HEAPU16[r13>>1]|HEAPU16[r5+2748>>1]<<HEAP32[r5+5820>>2])&65535;r13=r5+5820|0;HEAP32[r13>>2]=HEAP32[r13>>2]+r12}r12=2;if((HEAP32[r5+5820>>2]|0)>(16-r12|0)){r13=r7-3|0;r14=r5+5816|0;HEAP16[r14>>1]=(HEAPU16[r14>>1]|(r13&65535)<<HEAP32[r5+5820>>2])&65535;r14=HEAPU16[r5+5816>>1]&255;r15=r5+20|0;r16=HEAP32[r15>>2];HEAP32[r15>>2]=r16+1;HEAP8[HEAP32[r5+8>>2]+r16|0]=r14;r14=HEAPU16[r5+5816>>1]>>8&255;r16=r5+20|0;r15=HEAP32[r16>>2];HEAP32[r16>>2]=r15+1;HEAP8[HEAP32[r5+8>>2]+r15|0]=r14;HEAP16[r5+5816>>1]=(r13&65535)>>16-HEAP32[r5+5820>>2]&65535;r13=r5+5820|0;HEAP32[r13>>2]=HEAP32[r13>>2]+(r12-16)}else{r13=r5+5816|0;HEAP16[r13>>1]=(HEAPU16[r13>>1]|(r7-3&65535)<<HEAP32[r5+5820>>2])&65535;r13=r5+5820|0;HEAP32[r13>>2]=HEAP32[r13>>2]+r12}}else{if((r7|0)<=10){r12=HEAPU16[r5+2754>>1];if((HEAP32[r5+5820>>2]|0)>(16-r12|0)){r13=HEAPU16[r5+2752>>1];r14=r5+5816|0;HEAP16[r14>>1]=(HEAPU16[r14>>1]|(r13&65535)<<HEAP32[r5+5820>>2])&65535;r14=HEAPU16[r5+5816>>1]&255;r15=r5+20|0;r16=HEAP32[r15>>2];HEAP32[r15>>2]=r16+1;HEAP8[HEAP32[r5+8>>2]+r16|0]=r14;r14=HEAPU16[r5+5816>>1]>>8&255;r16=r5+20|0;r15=HEAP32[r16>>2];HEAP32[r16>>2]=r15+1;HEAP8[HEAP32[r5+8>>2]+r15|0]=r14;HEAP16[r5+5816>>1]=(r13&65535)>>16-HEAP32[r5+5820>>2]&65535;r13=r5+5820|0;HEAP32[r13>>2]=HEAP32[r13>>2]+(r12-16)}else{r13=r5+5816|0;HEAP16[r13>>1]=(HEAPU16[r13>>1]|HEAPU16[r5+2752>>1]<<HEAP32[r5+5820>>2])&65535;r13=r5+5820|0;HEAP32[r13>>2]=HEAP32[r13>>2]+r12}r12=3;if((HEAP32[r5+5820>>2]|0)>(16-r12|0)){r13=r7-3|0;r14=r5+5816|0;HEAP16[r14>>1]=(HEAPU16[r14>>1]|(r13&65535)<<HEAP32[r5+5820>>2])&65535;r14=HEAPU16[r5+5816>>1]&255;r15=r5+20|0;r16=HEAP32[r15>>2];HEAP32[r15>>2]=r16+1;HEAP8[HEAP32[r5+8>>2]+r16|0]=r14;r14=HEAPU16[r5+5816>>1]>>8&255;r16=r5+20|0;r15=HEAP32[r16>>2];HEAP32[r16>>2]=r15+1;HEAP8[HEAP32[r5+8>>2]+r15|0]=r14;HEAP16[r5+5816>>1]=(r13&65535)>>16-HEAP32[r5+5820>>2]&65535;r13=r5+5820|0;HEAP32[r13>>2]=HEAP32[r13>>2]+(r12-16)}else{r13=r5+5816|0;HEAP16[r13>>1]=(HEAPU16[r13>>1]|(r7-3&65535)<<HEAP32[r5+5820>>2])&65535;r13=r5+5820|0;HEAP32[r13>>2]=HEAP32[r13>>2]+r12}}else{r12=HEAPU16[r5+2758>>1];if((HEAP32[r5+5820>>2]|0)>(16-r12|0)){r13=HEAPU16[r5+2756>>1];r14=r5+5816|0;HEAP16[r14>>1]=(HEAPU16[r14>>1]|(r13&65535)<<HEAP32[r5+5820>>2])&65535;r14=HEAPU16[r5+5816>>1]&255;r15=r5+20|0;r16=HEAP32[r15>>2];HEAP32[r15>>2]=r16+1;HEAP8[HEAP32[r5+8>>2]+r16|0]=r14;r14=HEAPU16[r5+5816>>1]>>8&255;r16=r5+20|0;r15=HEAP32[r16>>2];HEAP32[r16>>2]=r15+1;HEAP8[HEAP32[r5+8>>2]+r15|0]=r14;HEAP16[r5+5816>>1]=(r13&65535)>>16-HEAP32[r5+5820>>2]&65535;r13=r5+5820|0;HEAP32[r13>>2]=HEAP32[r13>>2]+(r12-16)}else{r13=r5+5816|0;HEAP16[r13>>1]=(HEAPU16[r13>>1]|HEAPU16[r5+2756>>1]<<HEAP32[r5+5820>>2])&65535;r13=r5+5820|0;HEAP32[r13>>2]=HEAP32[r13>>2]+r12}r12=7;if((HEAP32[r5+5820>>2]|0)>(16-r12|0)){r13=r7-11|0;r14=r5+5816|0;HEAP16[r14>>1]=(HEAPU16[r14>>1]|(r13&65535)<<HEAP32[r5+5820>>2])&65535;r14=HEAPU16[r5+5816>>1]&255;r15=r5+20|0;r16=HEAP32[r15>>2];HEAP32[r15>>2]=r16+1;HEAP8[HEAP32[r5+8>>2]+r16|0]=r14;r14=HEAPU16[r5+5816>>1]>>8&255;r16=r5+20|0;r15=HEAP32[r16>>2];HEAP32[r16>>2]=r15+1;HEAP8[HEAP32[r5+8>>2]+r15|0]=r14;HEAP16[r5+5816>>1]=(r13&65535)>>16-HEAP32[r5+5820>>2]&65535;r13=r5+5820|0;HEAP32[r13>>2]=HEAP32[r13>>2]+(r12-16)}else{r13=r5+5816|0;HEAP16[r13>>1]=(HEAPU16[r13>>1]|(r7-11&65535)<<HEAP32[r5+5820>>2])&65535;r13=r5+5820|0;HEAP32[r13>>2]=HEAP32[r13>>2]+r12}}}}r7=0;r3=r11;if((r6|0)==0){r8=138;r9=3}else{if((r11|0)==(r6|0)){r8=6;r9=3}else{r8=7;r9=4}}}r10=r10+1|0}return}function _scan_tree(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10,r11,r12;r4=0;r5=r1;r1=r2;r2=r3;r3=-1;r6=HEAPU16[r1+2>>1];r7=0;r8=7;r9=4;if((r6|0)==0){r8=138;r9=3}HEAP16[r1+(r2+1<<2)+2>>1]=-1;r10=0;while(1){if((r10|0)>(r2|0)){break}r11=r6;r6=HEAPU16[r1+(r10+1<<2)+2>>1];r12=r7+1|0;r7=r12;do{if((r12|0)<(r8|0)){if((r11|0)!=(r6|0)){r4=1771;break}}else{r4=1771}}while(0);if(r4==1771){r4=0;if((r7|0)<(r9|0)){r12=r5+2684+(r11<<2)|0;HEAP16[r12>>1]=HEAPU16[r12>>1]+r7&65535}else{if((r11|0)!=0){if((r11|0)!=(r3|0)){r12=r5+2684+(r11<<2)|0;HEAP16[r12>>1]=HEAP16[r12>>1]+1&65535}r12=r5+2748|0;HEAP16[r12>>1]=HEAP16[r12>>1]+1&65535}else{if((r7|0)<=10){r12=r5+2752|0;HEAP16[r12>>1]=HEAP16[r12>>1]+1&65535}else{r12=r5+2756|0;HEAP16[r12>>1]=HEAP16[r12>>1]+1&65535}}}r7=0;r3=r11;if((r6|0)==0){r8=138;r9=3}else{if((r11|0)==(r6|0)){r8=6;r9=3}else{r8=7;r9=4}}}r10=r10+1|0}return}function _pqdownheap(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10,r11;r4=0;r5=r1;r1=r2;r2=r3;r3=HEAP32[r5+2908+(r2<<2)>>2];r6=r2<<1;while(1){if((r6|0)>(HEAP32[r5+5200>>2]|0)){r4=1805;break}do{if((r6|0)<(HEAP32[r5+5200>>2]|0)){if((HEAPU16[r1+(HEAP32[r5+2908+(r6+1<<2)>>2]<<2)>>1]|0)>=(HEAPU16[r1+(HEAP32[r5+2908+(r6<<2)>>2]<<2)>>1]|0)){if((HEAPU16[r1+(HEAP32[r5+2908+(r6+1<<2)>>2]<<2)>>1]|0)!=(HEAPU16[r1+(HEAP32[r5+2908+(r6<<2)>>2]<<2)>>1]|0)){break}if((HEAPU8[r5+5208+HEAP32[r5+2908+(r6+1<<2)>>2]|0]|0)>(HEAPU8[r5+5208+HEAP32[r5+2908+(r6<<2)>>2]|0]|0)){break}}r6=r6+1|0}}while(0);if((HEAPU16[r1+(r3<<2)>>1]|0)<(HEAPU16[r1+(HEAP32[r5+2908+(r6<<2)>>2]<<2)>>1]|0)){break}if((HEAPU16[r1+(r3<<2)>>1]|0)==(HEAPU16[r1+(HEAP32[r5+2908+(r6<<2)>>2]<<2)>>1]|0)){if((HEAPU8[r5+5208+r3|0]|0)<=(HEAPU8[r5+5208+HEAP32[r5+2908+(r6<<2)>>2]|0]|0)){break}}HEAP32[r5+2908+(r2<<2)>>2]=HEAP32[r5+2908+(r6<<2)>>2];r2=r6;r6=r6<<1}if(r4==1805){r7=r3;r8=r2;r9=r5;r10=r9+2908|0;r11=r10+(r8<<2)|0;HEAP32[r11>>2]=r7;return}r7=r3;r8=r2;r9=r5;r10=r9+2908|0;r11=r10+(r8<<2)|0;HEAP32[r11>>2]=r7;return}function _gen_bitlen(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15;r3=r1;r1=r2;r2=HEAP32[r1>>2];r4=HEAP32[r1+4>>2];r5=HEAP32[HEAP32[r1+8>>2]>>2];r6=HEAP32[HEAP32[r1+8>>2]+4>>2];r7=HEAP32[HEAP32[r1+8>>2]+8>>2];r8=HEAP32[HEAP32[r1+8>>2]+16>>2];r1=0;r9=0;while(1){if((r9|0)>15){break}HEAP16[r3+2876+(r9<<1)>>1]=0;r9=r9+1|0}HEAP16[r2+(HEAP32[r3+2908+(HEAP32[r3+5204>>2]<<2)>>2]<<2)+2>>1]=0;r10=HEAP32[r3+5204>>2]+1|0;while(1){if((r10|0)>=573){break}r11=HEAP32[r3+2908+(r10<<2)>>2];r9=HEAPU16[r2+(HEAPU16[r2+(r11<<2)+2>>1]<<2)+2>>1]+1|0;if((r9|0)>(r8|0)){r9=r8;r1=r1+1|0}HEAP16[r2+(r11<<2)+2>>1]=r9&65535;if((r11|0)<=(r4|0)){r12=r3+2876+(r9<<1)|0;HEAP16[r12>>1]=HEAP16[r12>>1]+1&65535;r12=0;if((r11|0)>=(r7|0)){r12=HEAP32[r6+(r11-r7<<2)>>2]}r13=HEAP16[r2+(r11<<2)>>1];r14=Math_imul(r13&65535,r9+r12|0)|0;r15=r3+5800|0;HEAP32[r15>>2]=HEAP32[r15>>2]+r14;if((r5|0)!=0){r14=Math_imul(r13&65535,HEAPU16[r5+(r11<<2)+2>>1]+r12|0)|0;r12=r3+5804|0;HEAP32[r12>>2]=HEAP32[r12>>2]+r14}}r10=r10+1|0}if((r1|0)==0){return}while(1){r9=r8-1|0;while(1){if((HEAPU16[r3+2876+(r9<<1)>>1]|0)!=0){break}r9=r9-1|0}r5=r3+2876+(r9<<1)|0;HEAP16[r5>>1]=HEAP16[r5>>1]-1&65535;r5=r3+2876+(r9+1<<1)|0;HEAP16[r5>>1]=HEAPU16[r5>>1]+2&65535;r5=r3+2876+(r8<<1)|0;HEAP16[r5>>1]=HEAP16[r5>>1]-1&65535;r1=r1-2|0;if((r1|0)<=0){break}}r9=r8;while(1){if((r9|0)==0){break}r11=HEAPU16[r3+2876+(r9<<1)>>1];while(1){if((r11|0)==0){break}r8=r10-1|0;r10=r8;r1=HEAP32[r3+2908+(r8<<2)>>2];if((r1|0)>(r4|0)){continue}if((HEAPU16[r2+(r1<<2)+2>>1]|0)!=(r9|0)){r8=Math_imul(r9-HEAPU16[r2+(r1<<2)+2>>1]|0,HEAPU16[r2+(r1<<2)>>1])|0;r5=r3+5800|0;HEAP32[r5>>2]=HEAP32[r5>>2]+r8;HEAP16[r2+(r1<<2)+2>>1]=r9&65535}r11=r11-1|0}r9=r9-1|0}return}function _gen_codes(r1,r2,r3){var r4,r5,r6,r7,r8;r4=STACKTOP;STACKTOP=STACKTOP+32|0;r5=r4;r6=r1;r1=r2;r2=r3;r3=0;r7=1;while(1){if((r7|0)>15){break}r8=(r3&65535)+HEAPU16[r2+(r7-1<<1)>>1]<<1&65535;r3=r8;HEAP16[r5+(r7<<1)>>1]=r8;r7=r7+1|0}r7=0;while(1){if((r7|0)>(r1|0)){break}r3=HEAPU16[r6+(r7<<2)+2>>1];if((r3|0)!=0){r2=r5+(r3<<1)|0;r8=HEAP16[r2>>1];HEAP16[r2>>1]=r8+1&65535;HEAP16[r6+(r7<<2)>>1]=_bi_reverse(r8&65535,r3)&65535}r7=r7+1|0}STACKTOP=r4;return}function _bi_reverse(r1,r2){var r3,r4;r3=r1;r1=r2;r2=0;while(1){r2=r2|r3&1;r3=r3>>>1;r2=r2<<1;r4=r1-1|0;r1=r4;if((r4|0)<=0){break}}return r2>>>1}function _zcalloc(r1,r2,r3){var r4;r4=r2;r2=r3;if((r1|0)!=0){r4=r4+(r2-r2)|0}return _malloc(Math_imul(r4,r2)|0)}function _zcfree(r1,r2){_free(r2);if((r1|0)==0){return}return}function _adler32(r1,r2,r3){var r4,r5,r6,r7,r8;r4=r1;r1=r2;r2=r3;r3=r4>>>16&65535;r4=r4&65535;if((r2|0)==1){r4=r4+HEAPU8[r1|0]|0;if(r4>>>0>=65521){r4=r4-65521|0}r3=r3+r4|0;if(r3>>>0>=65521){r3=r3-65521|0}r5=r4|r3<<16;r6=r5;return r6}if((r1|0)==0){r5=1;r6=r5;return r6}if(r2>>>0<16){while(1){r7=r2;r2=r7-1|0;if((r7|0)==0){break}r7=r1;r1=r7+1|0;r4=r4+HEAPU8[r7]|0;r3=r3+r4|0}if(r4>>>0>=65521){r4=r4-65521|0}r3=(r3>>>0)%65521&-1;r5=r4|r3<<16;r6=r5;return r6}while(1){if(r2>>>0<5552){break}r2=r2-5552|0;r7=347;while(1){r4=r4+HEAPU8[r1|0]|0;r3=r3+r4|0;r4=r4+HEAPU8[r1+1|0]|0;r3=r3+r4|0;r4=r4+HEAPU8[r1+2|0]|0;r3=r3+r4|0;r4=r4+HEAPU8[r1+3|0]|0;r3=r3+r4|0;r4=r4+HEAPU8[r1+4|0]|0;r3=r3+r4|0;r4=r4+HEAPU8[r1+5|0]|0;r3=r3+r4|0;r4=r4+HEAPU8[r1+6|0]|0;r3=r3+r4|0;r4=r4+HEAPU8[r1+7|0]|0;r3=r3+r4|0;r4=r4+HEAPU8[r1+8|0]|0;r3=r3+r4|0;r4=r4+HEAPU8[r1+9|0]|0;r3=r3+r4|0;r4=r4+HEAPU8[r1+10|0]|0;r3=r3+r4|0;r4=r4+HEAPU8[r1+11|0]|0;r3=r3+r4|0;r4=r4+HEAPU8[r1+12|0]|0;r3=r3+r4|0;r4=r4+HEAPU8[r1+13|0]|0;r3=r3+r4|0;r4=r4+HEAPU8[r1+14|0]|0;r3=r3+r4|0;r4=r4+HEAPU8[r1+15|0]|0;r3=r3+r4|0;r1=r1+16|0;r8=r7-1|0;r7=r8;if((r8|0)==0){break}}r4=(r4>>>0)%65521&-1;r3=(r3>>>0)%65521&-1}if((r2|0)!=0){while(1){if(r2>>>0<16){break}r2=r2-16|0;r4=r4+HEAPU8[r1|0]|0;r3=r3+r4|0;r4=r4+HEAPU8[r1+1|0]|0;r3=r3+r4|0;r4=r4+HEAPU8[r1+2|0]|0;r3=r3+r4|0;r4=r4+HEAPU8[r1+3|0]|0;r3=r3+r4|0;r4=r4+HEAPU8[r1+4|0]|0;r3=r3+r4|0;r4=r4+HEAPU8[r1+5|0]|0;r3=r3+r4|0;r4=r4+HEAPU8[r1+6|0]|0;r3=r3+r4|0;r4=r4+HEAPU8[r1+7|0]|0;r3=r3+r4|0;r4=r4+HEAPU8[r1+8|0]|0;r3=r3+r4|0;r4=r4+HEAPU8[r1+9|0]|0;r3=r3+r4|0;r4=r4+HEAPU8[r1+10|0]|0;r3=r3+r4|0;r4=r4+HEAPU8[r1+11|0]|0;r3=r3+r4|0;r4=r4+HEAPU8[r1+12|0]|0;r3=r3+r4|0;r4=r4+HEAPU8[r1+13|0]|0;r3=r3+r4|0;r4=r4+HEAPU8[r1+14|0]|0;r3=r3+r4|0;r4=r4+HEAPU8[r1+15|0]|0;r3=r3+r4|0;r1=r1+16|0}while(1){r7=r2;r2=r7-1|0;if((r7|0)==0){break}r7=r1;r1=r7+1|0;r4=r4+HEAPU8[r7]|0;r3=r3+r4|0}r4=(r4>>>0)%65521&-1;r3=(r3>>>0)%65521&-1}r5=r4|r3<<16;r6=r5;return r6}function _crc32(r1,r2,r3){var r4,r5,r6,r7,r8;r4=STACKTOP;STACKTOP=STACKTOP+8|0;r5=r4;r6=r1;r1=r2;r2=r3;if((r1|0)==0){r7=0;r8=r7;STACKTOP=r4;return r8}HEAP32[r5>>2]=1;if((HEAP8[r5]|0)!=0){r7=_crc32_little(r6,r1,r2);r8=r7;STACKTOP=r4;return r8}else{r7=_crc32_big(r6,r1,r2);r8=r7;STACKTOP=r4;return r8}}function _crc32_little(r1,r2,r3){var r4,r5,r6,r7,r8;r4=r2;r2=r3;r3=r1;r3=~r3;while(1){if((r2|0)!=0){r5=(r4&3|0)!=0}else{r5=0}if(!r5){break}r1=r4;r4=r1+1|0;r3=HEAP32[4192+(((r3^HEAPU8[r1])&255)<<2)>>2]^r3>>>8;r2=r2-1|0}r5=r4;while(1){if(r2>>>0<32){break}r1=r5;r5=r1+4|0;r3=r3^HEAP32[r1>>2];r3=HEAP32[7264+((r3&255)<<2)>>2]^HEAP32[6240+((r3>>>8&255)<<2)>>2]^HEAP32[5216+((r3>>>16&255)<<2)>>2]^HEAP32[4192+(r3>>>24<<2)>>2];r1=r5;r5=r1+4|0;r3=r3^HEAP32[r1>>2];r3=HEAP32[7264+((r3&255)<<2)>>2]^HEAP32[6240+((r3>>>8&255)<<2)>>2]^HEAP32[5216+((r3>>>16&255)<<2)>>2]^HEAP32[4192+(r3>>>24<<2)>>2];r1=r5;r5=r1+4|0;r3=r3^HEAP32[r1>>2];r3=HEAP32[7264+((r3&255)<<2)>>2]^HEAP32[6240+((r3>>>8&255)<<2)>>2]^HEAP32[5216+((r3>>>16&255)<<2)>>2]^HEAP32[4192+(r3>>>24<<2)>>2];r1=r5;r5=r1+4|0;r3=r3^HEAP32[r1>>2];r3=HEAP32[7264+((r3&255)<<2)>>2]^HEAP32[6240+((r3>>>8&255)<<2)>>2]^HEAP32[5216+((r3>>>16&255)<<2)>>2]^HEAP32[4192+(r3>>>24<<2)>>2];r1=r5;r5=r1+4|0;r3=r3^HEAP32[r1>>2];r3=HEAP32[7264+((r3&255)<<2)>>2]^HEAP32[6240+((r3>>>8&255)<<2)>>2]^HEAP32[5216+((r3>>>16&255)<<2)>>2]^HEAP32[4192+(r3>>>24<<2)>>2];r1=r5;r5=r1+4|0;r3=r3^HEAP32[r1>>2];r3=HEAP32[7264+((r3&255)<<2)>>2]^HEAP32[6240+((r3>>>8&255)<<2)>>2]^HEAP32[5216+((r3>>>16&255)<<2)>>2]^HEAP32[4192+(r3>>>24<<2)>>2];r1=r5;r5=r1+4|0;r3=r3^HEAP32[r1>>2];r3=HEAP32[7264+((r3&255)<<2)>>2]^HEAP32[6240+((r3>>>8&255)<<2)>>2]^HEAP32[5216+((r3>>>16&255)<<2)>>2]^HEAP32[4192+(r3>>>24<<2)>>2];r1=r5;r5=r1+4|0;r3=r3^HEAP32[r1>>2];r3=HEAP32[7264+((r3&255)<<2)>>2]^HEAP32[6240+((r3>>>8&255)<<2)>>2]^HEAP32[5216+((r3>>>16&255)<<2)>>2]^HEAP32[4192+(r3>>>24<<2)>>2];r2=r2-32|0}while(1){if(r2>>>0<4){break}r1=r5;r5=r1+4|0;r3=r3^HEAP32[r1>>2];r3=HEAP32[7264+((r3&255)<<2)>>2]^HEAP32[6240+((r3>>>8&255)<<2)>>2]^HEAP32[5216+((r3>>>16&255)<<2)>>2]^HEAP32[4192+(r3>>>24<<2)>>2];r2=r2-4|0}r4=r5;if((r2|0)==0){r6=r3;r7=~r6;r3=r7;r8=r3;return r8}while(1){r5=r4;r4=r5+1|0;r3=HEAP32[4192+(((r3^HEAPU8[r5])&255)<<2)>>2]^r3>>>8;r5=r2-1|0;r2=r5;if((r5|0)==0){break}}r6=r3;r7=~r6;r3=r7;r8=r3;return r8}function _crc32_big(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22;r4=r1;r1=r2;r2=r3;r3=(r4>>>24&255)+(r4>>>8&65280)+((r4&65280)<<8)+((r4&255)<<24)|0;r3=~r3;while(1){if((r2|0)!=0){r5=(r1&3|0)!=0}else{r5=0}if(!r5){break}r4=r1;r1=r4+1|0;r3=HEAP32[8288+((r3>>>24^HEAPU8[r4])<<2)>>2]^r3<<8;r2=r2-1|0}r5=r1;r5=r5-4|0;while(1){if(r2>>>0<32){break}r4=r5+4|0;r5=r4;r3=r3^HEAP32[r4>>2];r3=HEAP32[8288+((r3&255)<<2)>>2]^HEAP32[9312+((r3>>>8&255)<<2)>>2]^HEAP32[10336+((r3>>>16&255)<<2)>>2]^HEAP32[11360+(r3>>>24<<2)>>2];r4=r5+4|0;r5=r4;r3=r3^HEAP32[r4>>2];r3=HEAP32[8288+((r3&255)<<2)>>2]^HEAP32[9312+((r3>>>8&255)<<2)>>2]^HEAP32[10336+((r3>>>16&255)<<2)>>2]^HEAP32[11360+(r3>>>24<<2)>>2];r4=r5+4|0;r5=r4;r3=r3^HEAP32[r4>>2];r3=HEAP32[8288+((r3&255)<<2)>>2]^HEAP32[9312+((r3>>>8&255)<<2)>>2]^HEAP32[10336+((r3>>>16&255)<<2)>>2]^HEAP32[11360+(r3>>>24<<2)>>2];r4=r5+4|0;r5=r4;r3=r3^HEAP32[r4>>2];r3=HEAP32[8288+((r3&255)<<2)>>2]^HEAP32[9312+((r3>>>8&255)<<2)>>2]^HEAP32[10336+((r3>>>16&255)<<2)>>2]^HEAP32[11360+(r3>>>24<<2)>>2];r4=r5+4|0;r5=r4;r3=r3^HEAP32[r4>>2];r3=HEAP32[8288+((r3&255)<<2)>>2]^HEAP32[9312+((r3>>>8&255)<<2)>>2]^HEAP32[10336+((r3>>>16&255)<<2)>>2]^HEAP32[11360+(r3>>>24<<2)>>2];r4=r5+4|0;r5=r4;r3=r3^HEAP32[r4>>2];r3=HEAP32[8288+((r3&255)<<2)>>2]^HEAP32[9312+((r3>>>8&255)<<2)>>2]^HEAP32[10336+((r3>>>16&255)<<2)>>2]^HEAP32[11360+(r3>>>24<<2)>>2];r4=r5+4|0;r5=r4;r3=r3^HEAP32[r4>>2];r3=HEAP32[8288+((r3&255)<<2)>>2]^HEAP32[9312+((r3>>>8&255)<<2)>>2]^HEAP32[10336+((r3>>>16&255)<<2)>>2]^HEAP32[11360+(r3>>>24<<2)>>2];r4=r5+4|0;r5=r4;r3=r3^HEAP32[r4>>2];r3=HEAP32[8288+((r3&255)<<2)>>2]^HEAP32[9312+((r3>>>8&255)<<2)>>2]^HEAP32[10336+((r3>>>16&255)<<2)>>2]^HEAP32[11360+(r3>>>24<<2)>>2];r2=r2-32|0}while(1){if(r2>>>0<4){break}r4=r5+4|0;r5=r4;r3=r3^HEAP32[r4>>2];r3=HEAP32[8288+((r3&255)<<2)>>2]^HEAP32[9312+((r3>>>8&255)<<2)>>2]^HEAP32[10336+((r3>>>16&255)<<2)>>2]^HEAP32[11360+(r3>>>24<<2)>>2];r2=r2-4|0}r5=r5+4|0;r1=r5;if((r2|0)==0){r6=r3;r7=~r6;r3=r7;r8=r3;r9=r8>>>24;r10=r9&255;r11=r3;r12=r11>>>8;r13=r12&65280;r14=r10+r13|0;r15=r3;r16=r15&65280;r17=r16<<8;r18=r14+r17|0;r19=r3;r20=r19&255;r21=r20<<24;r22=r18+r21|0;return r22}while(1){r5=r1;r1=r5+1|0;r3=HEAP32[8288+((r3>>>24^HEAPU8[r5])<<2)>>2]^r3<<8;r5=r2-1|0;r2=r5;if((r5|0)==0){break}}r6=r3;r7=~r6;r3=r7;r8=r3;r9=r8>>>24;r10=r9&255;r11=r3;r12=r11>>>8;r13=r12&65280;r14=r10+r13|0;r15=r3;r16=r15&65280;r17=r16<<8;r18=r14+r17|0;r19=r3;r20=r19&255;r21=r20<<24;r22=r18+r21|0;return r22}function _inflate_fast(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36,r37;r3=0;r4=STACKTOP;STACKTOP=STACKTOP+8|0;r5=r4;r6=r1;r1=HEAP32[r6+28>>2];r7=HEAP32[r6>>2]-1|0;r8=r7+(HEAP32[r6+4>>2]-5)|0;r9=HEAP32[r6+12>>2]-1|0;r10=r9+ -(r2-HEAP32[r6+16>>2]|0)|0;r2=r9+(HEAP32[r6+16>>2]-257)|0;r11=HEAP32[r1+40>>2];r12=HEAP32[r1+44>>2];r13=HEAP32[r1+48>>2];r14=HEAP32[r1+52>>2];r15=HEAP32[r1+56>>2];r16=HEAP32[r1+60>>2];r17=HEAP32[r1+76>>2];r18=HEAP32[r1+80>>2];r19=(1<<HEAP32[r1+84>>2])-1|0;r20=(1<<HEAP32[r1+88>>2])-1|0;L2469:while(1){if(r16>>>0<15){r21=r7+1|0;r7=r21;r15=r15+(HEAPU8[r21]<<r16)|0;r16=r16+8|0;r21=r7+1|0;r7=r21;r15=r15+(HEAPU8[r21]<<r16)|0;r16=r16+8|0}r21=r5;r22=r17+((r15&r19)<<2)|0;HEAP16[r21>>1]=HEAP16[r22>>1];HEAP16[r21+2>>1]=HEAP16[r22+2>>1];while(1){r23=HEAPU8[r5+1|0];r15=r15>>>(r23>>>0);r16=r16-r23|0;r23=HEAPU8[r5|0];if((r23|0)==0){r3=1955;break}if((r23&16|0)!=0){r3=1957;break}if((r23&64|0)!=0){r3=2023;break L2469}r22=r5;r21=r17+(HEAPU16[r5+2>>1]+(r15&(1<<r23)-1)<<2)|0;HEAP16[r22>>1]=HEAP16[r21>>1];HEAP16[r22+2>>1]=HEAP16[r21+2>>1]}if(r3==1955){r3=0;r21=r9+1|0;r9=r21;HEAP8[r21]=HEAP16[r5+2>>1]&255}else if(r3==1957){r3=0;r24=HEAPU16[r5+2>>1];r23=r23&15;if((r23|0)!=0){if(r16>>>0<r23>>>0){r21=r7+1|0;r7=r21;r15=r15+(HEAPU8[r21]<<r16)|0;r16=r16+8|0}r24=r24+(r15&(1<<r23)-1)|0;r15=r15>>>(r23>>>0);r16=r16-r23|0}if(r16>>>0<15){r21=r7+1|0;r7=r21;r15=r15+(HEAPU8[r21]<<r16)|0;r16=r16+8|0;r21=r7+1|0;r7=r21;r15=r15+(HEAPU8[r21]<<r16)|0;r16=r16+8|0}r21=r5;r22=r18+((r15&r20)<<2)|0;HEAP16[r21>>1]=HEAP16[r22>>1];HEAP16[r21+2>>1]=HEAP16[r22+2>>1];while(1){r23=HEAPU8[r5+1|0];r15=r15>>>(r23>>>0);r16=r16-r23|0;r23=HEAPU8[r5|0];if((r23&16|0)!=0){break}if((r23&64|0)!=0){r3=2019;break L2469}r22=r5;r21=r18+(HEAPU16[r5+2>>1]+(r15&(1<<r23)-1)<<2)|0;HEAP16[r22>>1]=HEAP16[r21>>1];HEAP16[r22+2>>1]=HEAP16[r21+2>>1]}r21=HEAPU16[r5+2>>1];r23=r23&15;if(r16>>>0<r23>>>0){r22=r7+1|0;r7=r22;r15=r15+(HEAPU8[r22]<<r16)|0;r16=r16+8|0;if(r16>>>0<r23>>>0){r22=r7+1|0;r7=r22;r15=r15+(HEAPU8[r22]<<r16)|0;r16=r16+8|0}}r21=r21+(r15&(1<<r23)-1)|0;r15=r15>>>(r23>>>0);r16=r16-r23|0;r23=r9-r10|0;if(r21>>>0>r23>>>0){r23=r21-r23|0;if(r23>>>0>r12>>>0){if((HEAP32[r1+7104>>2]|0)!=0){r3=1972;break}}r25=r14-1|0;if((r13|0)==0){r25=r25+(r11-r23)|0;if(r23>>>0<r24>>>0){r24=r24-r23|0;while(1){r22=r25+1|0;r25=r22;r26=r9+1|0;r9=r26;HEAP8[r26]=HEAP8[r22];r22=r23-1|0;r23=r22;if((r22|0)==0){break}}r25=r9+ -r21|0}}else{if(r13>>>0<r23>>>0){r25=r25+(r11+r13-r23)|0;r23=r23-r13|0;if(r23>>>0<r24>>>0){r24=r24-r23|0;while(1){r22=r25+1|0;r25=r22;r26=r9+1|0;r9=r26;HEAP8[r26]=HEAP8[r22];r22=r23-1|0;r23=r22;if((r22|0)==0){break}}r25=r14-1|0;if(r13>>>0<r24>>>0){r23=r13;r24=r24-r23|0;while(1){r22=r25+1|0;r25=r22;r26=r9+1|0;r9=r26;HEAP8[r26]=HEAP8[r22];r22=r23-1|0;r23=r22;if((r22|0)==0){break}}r25=r9+ -r21|0}}}else{r25=r25+(r13-r23)|0;if(r23>>>0<r24>>>0){r24=r24-r23|0;while(1){r22=r25+1|0;r25=r22;r26=r9+1|0;r9=r26;HEAP8[r26]=HEAP8[r22];r22=r23-1|0;r23=r22;if((r22|0)==0){break}}r25=r9+ -r21|0}}}while(1){if(r24>>>0<=2){break}r22=r25+1|0;r25=r22;r26=r9+1|0;r9=r26;HEAP8[r26]=HEAP8[r22];r22=r25+1|0;r25=r22;r26=r9+1|0;r9=r26;HEAP8[r26]=HEAP8[r22];r22=r25+1|0;r25=r22;r26=r9+1|0;r9=r26;HEAP8[r26]=HEAP8[r22];r24=r24-3|0}if((r24|0)!=0){r22=r25+1|0;r25=r22;r26=r9+1|0;r9=r26;HEAP8[r26]=HEAP8[r22];if(r24>>>0>1){r22=r25+1|0;r25=r22;r26=r9+1|0;r9=r26;HEAP8[r26]=HEAP8[r22]}}}else{r25=r9+ -r21|0;while(1){r22=r25+1|0;r25=r22;r26=r9+1|0;r9=r26;HEAP8[r26]=HEAP8[r22];r22=r25+1|0;r25=r22;r26=r9+1|0;r9=r26;HEAP8[r26]=HEAP8[r22];r22=r25+1|0;r25=r22;r26=r9+1|0;r9=r26;HEAP8[r26]=HEAP8[r22];r24=r24-3|0;if(r24>>>0<=2){break}}if((r24|0)!=0){r21=r25+1|0;r25=r21;r22=r9+1|0;r9=r22;HEAP8[r22]=HEAP8[r21];if(r24>>>0>1){r21=r25+1|0;r25=r21;r22=r9+1|0;r9=r22;HEAP8[r22]=HEAP8[r21]}}}}if(r7>>>0<r8>>>0){r27=r9>>>0<r2>>>0}else{r27=0}if(!r27){break}}do{if(r3==1972){HEAP32[r6+24>>2]=12936;HEAP32[r1>>2]=29}else if(r3==2023){if((r23&32|0)!=0){HEAP32[r1>>2]=11;break}else{HEAP32[r6+24>>2]=13312;HEAP32[r1>>2]=29;break}}else if(r3==2019){HEAP32[r6+24>>2]=13408;HEAP32[r1>>2]=29}}while(0);r24=r16>>>3;r7=r7+ -r24|0;r16=r16-(r24<<3)|0;r15=r15&(1<<r16)-1;HEAP32[r6>>2]=r7+1;HEAP32[r6+12>>2]=r9+1;if(r7>>>0<r8>>>0){r28=r8-r7+5|0}else{r28=5-(r7-r8)|0}HEAP32[r6+4>>2]=r28;if(r9>>>0<r2>>>0){r29=r2-r9+257|0;r30=r6;r31=r30+16|0;HEAP32[r31>>2]=r29;r32=r15;r33=r1;r34=r33+56|0;HEAP32[r34>>2]=r32;r35=r16;r36=r1;r37=r36+60|0;HEAP32[r37>>2]=r35;STACKTOP=r4;return}else{r29=257-(r9-r2)|0;r30=r6;r31=r30+16|0;HEAP32[r31>>2]=r29;r32=r15;r33=r1;r34=r33+56|0;HEAP32[r34>>2]=r32;r35=r16;r36=r1;r37=r36+60|0;HEAP32[r37>>2]=r35;STACKTOP=r4;return}}function _malloc(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36,r37,r38,r39,r40,r41,r42,r43,r44,r45,r46,r47,r48,r49,r50,r51,r52,r53,r54,r55,r56,r57,r58,r59,r60,r61,r62,r63,r64,r65,r66,r67,r68,r69,r70,r71,r72,r73,r74,r75,r76,r77,r78,r79,r80,r81,r82,r83,r84,r85,r86;r2=0;do{if(r1>>>0<245){if(r1>>>0<11){r3=16}else{r3=r1+11&-8}r4=r3>>>3;r5=HEAP32[14696>>2];r6=r5>>>(r4>>>0);if((r6&3|0)!=0){r7=(r6&1^1)+r4|0;r8=r7<<1;r9=14736+(r8<<2)|0;r10=14736+(r8+2<<2)|0;r8=HEAP32[r10>>2];r11=r8+8|0;r12=HEAP32[r11>>2];do{if((r9|0)==(r12|0)){HEAP32[14696>>2]=r5&~(1<<r7)}else{if(r12>>>0<HEAP32[14712>>2]>>>0){_abort()}r13=r12+12|0;if((HEAP32[r13>>2]|0)==(r8|0)){HEAP32[r13>>2]=r9;HEAP32[r10>>2]=r12;break}else{_abort()}}}while(0);r12=r7<<3;HEAP32[r8+4>>2]=r12|3;r10=r8+(r12|4)|0;HEAP32[r10>>2]=HEAP32[r10>>2]|1;r14=r11;return r14}if(r3>>>0<=HEAP32[14704>>2]>>>0){r15=r3;break}if((r6|0)!=0){r10=2<<r4;r12=r6<<r4&(r10|-r10);r10=(r12&-r12)-1|0;r12=r10>>>12&16;r9=r10>>>(r12>>>0);r10=r9>>>5&8;r13=r9>>>(r10>>>0);r9=r13>>>2&4;r16=r13>>>(r9>>>0);r13=r16>>>1&2;r17=r16>>>(r13>>>0);r16=r17>>>1&1;r18=(r10|r12|r9|r13|r16)+(r17>>>(r16>>>0))|0;r16=r18<<1;r17=14736+(r16<<2)|0;r13=14736+(r16+2<<2)|0;r16=HEAP32[r13>>2];r9=r16+8|0;r12=HEAP32[r9>>2];do{if((r17|0)==(r12|0)){HEAP32[14696>>2]=r5&~(1<<r18)}else{if(r12>>>0<HEAP32[14712>>2]>>>0){_abort()}r10=r12+12|0;if((HEAP32[r10>>2]|0)==(r16|0)){HEAP32[r10>>2]=r17;HEAP32[r13>>2]=r12;break}else{_abort()}}}while(0);r12=r18<<3;r13=r12-r3|0;HEAP32[r16+4>>2]=r3|3;r17=r16;r5=r17+r3|0;HEAP32[r17+(r3|4)>>2]=r13|1;HEAP32[r17+r12>>2]=r13;r12=HEAP32[14704>>2];if((r12|0)!=0){r17=HEAP32[14716>>2];r4=r12>>>3;r12=r4<<1;r6=14736+(r12<<2)|0;r11=HEAP32[14696>>2];r8=1<<r4;do{if((r11&r8|0)==0){HEAP32[14696>>2]=r11|r8;r19=r6;r20=14736+(r12+2<<2)|0}else{r4=14736+(r12+2<<2)|0;r7=HEAP32[r4>>2];if(r7>>>0>=HEAP32[14712>>2]>>>0){r19=r7;r20=r4;break}_abort()}}while(0);HEAP32[r20>>2]=r17;HEAP32[r19+12>>2]=r17;HEAP32[r17+8>>2]=r19;HEAP32[r17+12>>2]=r6}HEAP32[14704>>2]=r13;HEAP32[14716>>2]=r5;r14=r9;return r14}r12=HEAP32[14700>>2];if((r12|0)==0){r15=r3;break}r8=(r12&-r12)-1|0;r12=r8>>>12&16;r11=r8>>>(r12>>>0);r8=r11>>>5&8;r16=r11>>>(r8>>>0);r11=r16>>>2&4;r18=r16>>>(r11>>>0);r16=r18>>>1&2;r4=r18>>>(r16>>>0);r18=r4>>>1&1;r7=HEAP32[15e3+((r8|r12|r11|r16|r18)+(r4>>>(r18>>>0))<<2)>>2];r18=r7;r4=r7;r16=(HEAP32[r7+4>>2]&-8)-r3|0;while(1){r7=HEAP32[r18+16>>2];if((r7|0)==0){r11=HEAP32[r18+20>>2];if((r11|0)==0){break}else{r21=r11}}else{r21=r7}r7=(HEAP32[r21+4>>2]&-8)-r3|0;r11=r7>>>0<r16>>>0;r18=r21;r4=r11?r21:r4;r16=r11?r7:r16}r18=r4;r9=HEAP32[14712>>2];if(r18>>>0<r9>>>0){_abort()}r5=r18+r3|0;r13=r5;if(r18>>>0>=r5>>>0){_abort()}r5=HEAP32[r4+24>>2];r6=HEAP32[r4+12>>2];do{if((r6|0)==(r4|0)){r17=r4+20|0;r7=HEAP32[r17>>2];if((r7|0)==0){r11=r4+16|0;r12=HEAP32[r11>>2];if((r12|0)==0){r22=0;break}else{r23=r12;r24=r11}}else{r23=r7;r24=r17}while(1){r17=r23+20|0;r7=HEAP32[r17>>2];if((r7|0)!=0){r23=r7;r24=r17;continue}r17=r23+16|0;r7=HEAP32[r17>>2];if((r7|0)==0){break}else{r23=r7;r24=r17}}if(r24>>>0<r9>>>0){_abort()}else{HEAP32[r24>>2]=0;r22=r23;break}}else{r17=HEAP32[r4+8>>2];if(r17>>>0<r9>>>0){_abort()}r7=r17+12|0;if((HEAP32[r7>>2]|0)!=(r4|0)){_abort()}r11=r6+8|0;if((HEAP32[r11>>2]|0)==(r4|0)){HEAP32[r7>>2]=r6;HEAP32[r11>>2]=r17;r22=r6;break}else{_abort()}}}while(0);L2791:do{if((r5|0)!=0){r6=r4+28|0;r9=15e3+(HEAP32[r6>>2]<<2)|0;do{if((r4|0)==(HEAP32[r9>>2]|0)){HEAP32[r9>>2]=r22;if((r22|0)!=0){break}HEAP32[14700>>2]=HEAP32[14700>>2]&~(1<<HEAP32[r6>>2]);break L2791}else{if(r5>>>0<HEAP32[14712>>2]>>>0){_abort()}r17=r5+16|0;if((HEAP32[r17>>2]|0)==(r4|0)){HEAP32[r17>>2]=r22}else{HEAP32[r5+20>>2]=r22}if((r22|0)==0){break L2791}}}while(0);if(r22>>>0<HEAP32[14712>>2]>>>0){_abort()}HEAP32[r22+24>>2]=r5;r6=HEAP32[r4+16>>2];do{if((r6|0)!=0){if(r6>>>0<HEAP32[14712>>2]>>>0){_abort()}else{HEAP32[r22+16>>2]=r6;HEAP32[r6+24>>2]=r22;break}}}while(0);r6=HEAP32[r4+20>>2];if((r6|0)==0){break}if(r6>>>0<HEAP32[14712>>2]>>>0){_abort()}else{HEAP32[r22+20>>2]=r6;HEAP32[r6+24>>2]=r22;break}}}while(0);if(r16>>>0<16){r5=r16+r3|0;HEAP32[r4+4>>2]=r5|3;r6=r18+(r5+4)|0;HEAP32[r6>>2]=HEAP32[r6>>2]|1}else{HEAP32[r4+4>>2]=r3|3;HEAP32[r18+(r3|4)>>2]=r16|1;HEAP32[r18+(r16+r3)>>2]=r16;r6=HEAP32[14704>>2];if((r6|0)!=0){r5=HEAP32[14716>>2];r9=r6>>>3;r6=r9<<1;r17=14736+(r6<<2)|0;r11=HEAP32[14696>>2];r7=1<<r9;do{if((r11&r7|0)==0){HEAP32[14696>>2]=r11|r7;r25=r17;r26=14736+(r6+2<<2)|0}else{r9=14736+(r6+2<<2)|0;r12=HEAP32[r9>>2];if(r12>>>0>=HEAP32[14712>>2]>>>0){r25=r12;r26=r9;break}_abort()}}while(0);HEAP32[r26>>2]=r5;HEAP32[r25+12>>2]=r5;HEAP32[r5+8>>2]=r25;HEAP32[r5+12>>2]=r17}HEAP32[14704>>2]=r16;HEAP32[14716>>2]=r13}r6=r4+8|0;if((r6|0)==0){r15=r3;break}else{r14=r6}return r14}else{if(r1>>>0>4294967231){r15=-1;break}r6=r1+11|0;r7=r6&-8;r11=HEAP32[14700>>2];if((r11|0)==0){r15=r7;break}r18=-r7|0;r9=r6>>>8;do{if((r9|0)==0){r27=0}else{if(r7>>>0>16777215){r27=31;break}r6=(r9+1048320|0)>>>16&8;r12=r9<<r6;r8=(r12+520192|0)>>>16&4;r10=r12<<r8;r12=(r10+245760|0)>>>16&2;r28=14-(r8|r6|r12)+(r10<<r12>>>15)|0;r27=r7>>>((r28+7|0)>>>0)&1|r28<<1}}while(0);r9=HEAP32[15e3+(r27<<2)>>2];L2599:do{if((r9|0)==0){r29=0;r30=r18;r31=0}else{if((r27|0)==31){r32=0}else{r32=25-(r27>>>1)|0}r4=0;r13=r18;r16=r9;r17=r7<<r32;r5=0;while(1){r28=HEAP32[r16+4>>2]&-8;r12=r28-r7|0;if(r12>>>0<r13>>>0){if((r28|0)==(r7|0)){r29=r16;r30=r12;r31=r16;break L2599}else{r33=r16;r34=r12}}else{r33=r4;r34=r13}r12=HEAP32[r16+20>>2];r28=HEAP32[r16+16+(r17>>>31<<2)>>2];r10=(r12|0)==0|(r12|0)==(r28|0)?r5:r12;if((r28|0)==0){r29=r33;r30=r34;r31=r10;break}else{r4=r33;r13=r34;r16=r28;r17=r17<<1;r5=r10}}}}while(0);if((r31|0)==0&(r29|0)==0){r9=2<<r27;r18=r11&(r9|-r9);if((r18|0)==0){r15=r7;break}r9=(r18&-r18)-1|0;r18=r9>>>12&16;r5=r9>>>(r18>>>0);r9=r5>>>5&8;r17=r5>>>(r9>>>0);r5=r17>>>2&4;r16=r17>>>(r5>>>0);r17=r16>>>1&2;r13=r16>>>(r17>>>0);r16=r13>>>1&1;r35=HEAP32[15e3+((r9|r18|r5|r17|r16)+(r13>>>(r16>>>0))<<2)>>2]}else{r35=r31}if((r35|0)==0){r36=r30;r37=r29}else{r16=r35;r13=r30;r17=r29;while(1){r5=(HEAP32[r16+4>>2]&-8)-r7|0;r18=r5>>>0<r13>>>0;r9=r18?r5:r13;r5=r18?r16:r17;r18=HEAP32[r16+16>>2];if((r18|0)!=0){r16=r18;r13=r9;r17=r5;continue}r18=HEAP32[r16+20>>2];if((r18|0)==0){r36=r9;r37=r5;break}else{r16=r18;r13=r9;r17=r5}}}if((r37|0)==0){r15=r7;break}if(r36>>>0>=(HEAP32[14704>>2]-r7|0)>>>0){r15=r7;break}r17=r37;r13=HEAP32[14712>>2];if(r17>>>0<r13>>>0){_abort()}r16=r17+r7|0;r11=r16;if(r17>>>0>=r16>>>0){_abort()}r5=HEAP32[r37+24>>2];r9=HEAP32[r37+12>>2];do{if((r9|0)==(r37|0)){r18=r37+20|0;r4=HEAP32[r18>>2];if((r4|0)==0){r10=r37+16|0;r28=HEAP32[r10>>2];if((r28|0)==0){r38=0;break}else{r39=r28;r40=r10}}else{r39=r4;r40=r18}while(1){r18=r39+20|0;r4=HEAP32[r18>>2];if((r4|0)!=0){r39=r4;r40=r18;continue}r18=r39+16|0;r4=HEAP32[r18>>2];if((r4|0)==0){break}else{r39=r4;r40=r18}}if(r40>>>0<r13>>>0){_abort()}else{HEAP32[r40>>2]=0;r38=r39;break}}else{r18=HEAP32[r37+8>>2];if(r18>>>0<r13>>>0){_abort()}r4=r18+12|0;if((HEAP32[r4>>2]|0)!=(r37|0)){_abort()}r10=r9+8|0;if((HEAP32[r10>>2]|0)==(r37|0)){HEAP32[r4>>2]=r9;HEAP32[r10>>2]=r18;r38=r9;break}else{_abort()}}}while(0);L2649:do{if((r5|0)!=0){r9=r37+28|0;r13=15e3+(HEAP32[r9>>2]<<2)|0;do{if((r37|0)==(HEAP32[r13>>2]|0)){HEAP32[r13>>2]=r38;if((r38|0)!=0){break}HEAP32[14700>>2]=HEAP32[14700>>2]&~(1<<HEAP32[r9>>2]);break L2649}else{if(r5>>>0<HEAP32[14712>>2]>>>0){_abort()}r18=r5+16|0;if((HEAP32[r18>>2]|0)==(r37|0)){HEAP32[r18>>2]=r38}else{HEAP32[r5+20>>2]=r38}if((r38|0)==0){break L2649}}}while(0);if(r38>>>0<HEAP32[14712>>2]>>>0){_abort()}HEAP32[r38+24>>2]=r5;r9=HEAP32[r37+16>>2];do{if((r9|0)!=0){if(r9>>>0<HEAP32[14712>>2]>>>0){_abort()}else{HEAP32[r38+16>>2]=r9;HEAP32[r9+24>>2]=r38;break}}}while(0);r9=HEAP32[r37+20>>2];if((r9|0)==0){break}if(r9>>>0<HEAP32[14712>>2]>>>0){_abort()}else{HEAP32[r38+20>>2]=r9;HEAP32[r9+24>>2]=r38;break}}}while(0);do{if(r36>>>0<16){r5=r36+r7|0;HEAP32[r37+4>>2]=r5|3;r9=r17+(r5+4)|0;HEAP32[r9>>2]=HEAP32[r9>>2]|1}else{HEAP32[r37+4>>2]=r7|3;HEAP32[r17+(r7|4)>>2]=r36|1;HEAP32[r17+(r36+r7)>>2]=r36;r9=r36>>>3;if(r36>>>0<256){r5=r9<<1;r13=14736+(r5<<2)|0;r18=HEAP32[14696>>2];r10=1<<r9;do{if((r18&r10|0)==0){HEAP32[14696>>2]=r18|r10;r41=r13;r42=14736+(r5+2<<2)|0}else{r9=14736+(r5+2<<2)|0;r4=HEAP32[r9>>2];if(r4>>>0>=HEAP32[14712>>2]>>>0){r41=r4;r42=r9;break}_abort()}}while(0);HEAP32[r42>>2]=r11;HEAP32[r41+12>>2]=r11;HEAP32[r17+(r7+8)>>2]=r41;HEAP32[r17+(r7+12)>>2]=r13;break}r5=r16;r10=r36>>>8;do{if((r10|0)==0){r43=0}else{if(r36>>>0>16777215){r43=31;break}r18=(r10+1048320|0)>>>16&8;r9=r10<<r18;r4=(r9+520192|0)>>>16&4;r28=r9<<r4;r9=(r28+245760|0)>>>16&2;r12=14-(r4|r18|r9)+(r28<<r9>>>15)|0;r43=r36>>>((r12+7|0)>>>0)&1|r12<<1}}while(0);r10=15e3+(r43<<2)|0;HEAP32[r17+(r7+28)>>2]=r43;HEAP32[r17+(r7+20)>>2]=0;HEAP32[r17+(r7+16)>>2]=0;r13=HEAP32[14700>>2];r12=1<<r43;if((r13&r12|0)==0){HEAP32[14700>>2]=r13|r12;HEAP32[r10>>2]=r5;HEAP32[r17+(r7+24)>>2]=r10;HEAP32[r17+(r7+12)>>2]=r5;HEAP32[r17+(r7+8)>>2]=r5;break}if((r43|0)==31){r44=0}else{r44=25-(r43>>>1)|0}r12=r36<<r44;r13=HEAP32[r10>>2];while(1){if((HEAP32[r13+4>>2]&-8|0)==(r36|0)){break}r45=r13+16+(r12>>>31<<2)|0;r10=HEAP32[r45>>2];if((r10|0)==0){r2=2190;break}else{r12=r12<<1;r13=r10}}if(r2==2190){if(r45>>>0<HEAP32[14712>>2]>>>0){_abort()}else{HEAP32[r45>>2]=r5;HEAP32[r17+(r7+24)>>2]=r13;HEAP32[r17+(r7+12)>>2]=r5;HEAP32[r17+(r7+8)>>2]=r5;break}}r12=r13+8|0;r10=HEAP32[r12>>2];r9=HEAP32[14712>>2];if(r13>>>0<r9>>>0){_abort()}if(r10>>>0<r9>>>0){_abort()}else{HEAP32[r10+12>>2]=r5;HEAP32[r12>>2]=r5;HEAP32[r17+(r7+8)>>2]=r10;HEAP32[r17+(r7+12)>>2]=r13;HEAP32[r17+(r7+24)>>2]=0;break}}}while(0);r17=r37+8|0;if((r17|0)==0){r15=r7;break}else{r14=r17}return r14}}while(0);r37=HEAP32[14704>>2];if(r15>>>0<=r37>>>0){r45=r37-r15|0;r36=HEAP32[14716>>2];if(r45>>>0>15){r44=r36;HEAP32[14716>>2]=r44+r15;HEAP32[14704>>2]=r45;HEAP32[r44+(r15+4)>>2]=r45|1;HEAP32[r44+r37>>2]=r45;HEAP32[r36+4>>2]=r15|3}else{HEAP32[14704>>2]=0;HEAP32[14716>>2]=0;HEAP32[r36+4>>2]=r37|3;r45=r36+(r37+4)|0;HEAP32[r45>>2]=HEAP32[r45>>2]|1}r14=r36+8|0;return r14}r36=HEAP32[14708>>2];if(r15>>>0<r36>>>0){r45=r36-r15|0;HEAP32[14708>>2]=r45;r36=HEAP32[14720>>2];r37=r36;HEAP32[14720>>2]=r37+r15;HEAP32[r37+(r15+4)>>2]=r45|1;HEAP32[r36+4>>2]=r15|3;r14=r36+8|0;return r14}do{if((HEAP32[14664>>2]|0)==0){r36=_sysconf(30);if((r36-1&r36|0)==0){HEAP32[14672>>2]=r36;HEAP32[14668>>2]=r36;HEAP32[14676>>2]=-1;HEAP32[14680>>2]=-1;HEAP32[14684>>2]=0;HEAP32[15140>>2]=0;HEAP32[14664>>2]=_time(0)&-16^1431655768;break}else{_abort()}}}while(0);r36=r15+48|0;r45=HEAP32[14672>>2];r37=r15+47|0;r44=r45+r37|0;r43=-r45|0;r45=r44&r43;if(r45>>>0<=r15>>>0){r14=0;return r14}r41=HEAP32[15136>>2];do{if((r41|0)!=0){r42=HEAP32[15128>>2];r38=r42+r45|0;if(r38>>>0<=r42>>>0|r38>>>0>r41>>>0){r14=0}else{break}return r14}}while(0);L2858:do{if((HEAP32[15140>>2]&4|0)==0){r41=HEAP32[14720>>2];L2860:do{if((r41|0)==0){r2=2220}else{r38=r41;r42=15144;while(1){r46=r42|0;r39=HEAP32[r46>>2];if(r39>>>0<=r38>>>0){r47=r42+4|0;if((r39+HEAP32[r47>>2]|0)>>>0>r38>>>0){break}}r39=HEAP32[r42+8>>2];if((r39|0)==0){r2=2220;break L2860}else{r42=r39}}if((r42|0)==0){r2=2220;break}r38=r44-HEAP32[14708>>2]&r43;if(r38>>>0>=2147483647){r48=0;break}r13=_sbrk(r38);r5=(r13|0)==(HEAP32[r46>>2]+HEAP32[r47>>2]|0);r49=r5?r13:-1;r50=r5?r38:0;r51=r13;r52=r38;r2=2229}}while(0);do{if(r2==2220){r41=_sbrk(0);if((r41|0)==-1){r48=0;break}r7=r41;r38=HEAP32[14668>>2];r13=r38-1|0;if((r13&r7|0)==0){r53=r45}else{r53=r45-r7+(r13+r7&-r38)|0}r38=HEAP32[15128>>2];r7=r38+r53|0;if(!(r53>>>0>r15>>>0&r53>>>0<2147483647)){r48=0;break}r13=HEAP32[15136>>2];if((r13|0)!=0){if(r7>>>0<=r38>>>0|r7>>>0>r13>>>0){r48=0;break}}r13=_sbrk(r53);r7=(r13|0)==(r41|0);r49=r7?r41:-1;r50=r7?r53:0;r51=r13;r52=r53;r2=2229}}while(0);L2880:do{if(r2==2229){r13=-r52|0;if((r49|0)!=-1){r54=r50;r55=r49;r2=2240;break L2858}do{if((r51|0)!=-1&r52>>>0<2147483647&r52>>>0<r36>>>0){r7=HEAP32[14672>>2];r41=r37-r52+r7&-r7;if(r41>>>0>=2147483647){r56=r52;break}if((_sbrk(r41)|0)==-1){_sbrk(r13);r48=r50;break L2880}else{r56=r41+r52|0;break}}else{r56=r52}}while(0);if((r51|0)==-1){r48=r50}else{r54=r56;r55=r51;r2=2240;break L2858}}}while(0);HEAP32[15140>>2]=HEAP32[15140>>2]|4;r57=r48;r2=2237}else{r57=0;r2=2237}}while(0);do{if(r2==2237){if(r45>>>0>=2147483647){break}r48=_sbrk(r45);r51=_sbrk(0);if(!((r51|0)!=-1&(r48|0)!=-1&r48>>>0<r51>>>0)){break}r56=r51-r48|0;r51=r56>>>0>(r15+40|0)>>>0;r50=r51?r48:-1;if((r50|0)!=-1){r54=r51?r56:r57;r55=r50;r2=2240}}}while(0);do{if(r2==2240){r57=HEAP32[15128>>2]+r54|0;HEAP32[15128>>2]=r57;if(r57>>>0>HEAP32[15132>>2]>>>0){HEAP32[15132>>2]=r57}r57=HEAP32[14720>>2];L2900:do{if((r57|0)==0){r45=HEAP32[14712>>2];if((r45|0)==0|r55>>>0<r45>>>0){HEAP32[14712>>2]=r55}HEAP32[15144>>2]=r55;HEAP32[15148>>2]=r54;HEAP32[15156>>2]=0;HEAP32[14732>>2]=HEAP32[14664>>2];HEAP32[14728>>2]=-1;r45=0;while(1){r50=r45<<1;r56=14736+(r50<<2)|0;HEAP32[14736+(r50+3<<2)>>2]=r56;HEAP32[14736+(r50+2<<2)>>2]=r56;r56=r45+1|0;if(r56>>>0<32){r45=r56}else{break}}r45=r55+8|0;if((r45&7|0)==0){r58=0}else{r58=-r45&7}r45=r54-40-r58|0;HEAP32[14720>>2]=r55+r58;HEAP32[14708>>2]=r45;HEAP32[r55+(r58+4)>>2]=r45|1;HEAP32[r55+(r54-36)>>2]=40;HEAP32[14724>>2]=HEAP32[14680>>2]}else{r45=15144;while(1){r59=HEAP32[r45>>2];r60=r45+4|0;r61=HEAP32[r60>>2];if((r55|0)==(r59+r61|0)){r2=2252;break}r56=HEAP32[r45+8>>2];if((r56|0)==0){break}else{r45=r56}}do{if(r2==2252){if((HEAP32[r45+12>>2]&8|0)!=0){break}r56=r57;if(!(r56>>>0>=r59>>>0&r56>>>0<r55>>>0)){break}HEAP32[r60>>2]=r61+r54;r56=HEAP32[14720>>2];r50=HEAP32[14708>>2]+r54|0;r51=r56;r48=r56+8|0;if((r48&7|0)==0){r62=0}else{r62=-r48&7}r48=r50-r62|0;HEAP32[14720>>2]=r51+r62;HEAP32[14708>>2]=r48;HEAP32[r51+(r62+4)>>2]=r48|1;HEAP32[r51+(r50+4)>>2]=40;HEAP32[14724>>2]=HEAP32[14680>>2];break L2900}}while(0);if(r55>>>0<HEAP32[14712>>2]>>>0){HEAP32[14712>>2]=r55}r45=r55+r54|0;r50=15144;while(1){r63=r50|0;if((HEAP32[r63>>2]|0)==(r45|0)){r2=2262;break}r51=HEAP32[r50+8>>2];if((r51|0)==0){break}else{r50=r51}}do{if(r2==2262){if((HEAP32[r50+12>>2]&8|0)!=0){break}HEAP32[r63>>2]=r55;r45=r50+4|0;HEAP32[r45>>2]=HEAP32[r45>>2]+r54;r45=r55+8|0;if((r45&7|0)==0){r64=0}else{r64=-r45&7}r45=r55+(r54+8)|0;if((r45&7|0)==0){r65=0}else{r65=-r45&7}r45=r55+(r65+r54)|0;r51=r45;r48=r64+r15|0;r56=r55+r48|0;r52=r56;r37=r45-(r55+r64)-r15|0;HEAP32[r55+(r64+4)>>2]=r15|3;do{if((r51|0)==(HEAP32[14720>>2]|0)){r36=HEAP32[14708>>2]+r37|0;HEAP32[14708>>2]=r36;HEAP32[14720>>2]=r52;HEAP32[r55+(r48+4)>>2]=r36|1}else{if((r51|0)==(HEAP32[14716>>2]|0)){r36=HEAP32[14704>>2]+r37|0;HEAP32[14704>>2]=r36;HEAP32[14716>>2]=r52;HEAP32[r55+(r48+4)>>2]=r36|1;HEAP32[r55+(r36+r48)>>2]=r36;break}r36=r54+4|0;r49=HEAP32[r55+(r36+r65)>>2];if((r49&3|0)==1){r53=r49&-8;r47=r49>>>3;L2935:do{if(r49>>>0<256){r46=HEAP32[r55+((r65|8)+r54)>>2];r43=HEAP32[r55+(r54+12+r65)>>2];r44=14736+(r47<<1<<2)|0;do{if((r46|0)!=(r44|0)){if(r46>>>0<HEAP32[14712>>2]>>>0){_abort()}if((HEAP32[r46+12>>2]|0)==(r51|0)){break}_abort()}}while(0);if((r43|0)==(r46|0)){HEAP32[14696>>2]=HEAP32[14696>>2]&~(1<<r47);break}do{if((r43|0)==(r44|0)){r66=r43+8|0}else{if(r43>>>0<HEAP32[14712>>2]>>>0){_abort()}r13=r43+8|0;if((HEAP32[r13>>2]|0)==(r51|0)){r66=r13;break}_abort()}}while(0);HEAP32[r46+12>>2]=r43;HEAP32[r66>>2]=r46}else{r44=r45;r13=HEAP32[r55+((r65|24)+r54)>>2];r42=HEAP32[r55+(r54+12+r65)>>2];do{if((r42|0)==(r44|0)){r41=r65|16;r7=r55+(r36+r41)|0;r38=HEAP32[r7>>2];if((r38|0)==0){r5=r55+(r41+r54)|0;r41=HEAP32[r5>>2];if((r41|0)==0){r67=0;break}else{r68=r41;r69=r5}}else{r68=r38;r69=r7}while(1){r7=r68+20|0;r38=HEAP32[r7>>2];if((r38|0)!=0){r68=r38;r69=r7;continue}r7=r68+16|0;r38=HEAP32[r7>>2];if((r38|0)==0){break}else{r68=r38;r69=r7}}if(r69>>>0<HEAP32[14712>>2]>>>0){_abort()}else{HEAP32[r69>>2]=0;r67=r68;break}}else{r7=HEAP32[r55+((r65|8)+r54)>>2];if(r7>>>0<HEAP32[14712>>2]>>>0){_abort()}r38=r7+12|0;if((HEAP32[r38>>2]|0)!=(r44|0)){_abort()}r5=r42+8|0;if((HEAP32[r5>>2]|0)==(r44|0)){HEAP32[r38>>2]=r42;HEAP32[r5>>2]=r7;r67=r42;break}else{_abort()}}}while(0);if((r13|0)==0){break}r42=r55+(r54+28+r65)|0;r46=15e3+(HEAP32[r42>>2]<<2)|0;do{if((r44|0)==(HEAP32[r46>>2]|0)){HEAP32[r46>>2]=r67;if((r67|0)!=0){break}HEAP32[14700>>2]=HEAP32[14700>>2]&~(1<<HEAP32[r42>>2]);break L2935}else{if(r13>>>0<HEAP32[14712>>2]>>>0){_abort()}r43=r13+16|0;if((HEAP32[r43>>2]|0)==(r44|0)){HEAP32[r43>>2]=r67}else{HEAP32[r13+20>>2]=r67}if((r67|0)==0){break L2935}}}while(0);if(r67>>>0<HEAP32[14712>>2]>>>0){_abort()}HEAP32[r67+24>>2]=r13;r44=r65|16;r42=HEAP32[r55+(r44+r54)>>2];do{if((r42|0)!=0){if(r42>>>0<HEAP32[14712>>2]>>>0){_abort()}else{HEAP32[r67+16>>2]=r42;HEAP32[r42+24>>2]=r67;break}}}while(0);r42=HEAP32[r55+(r36+r44)>>2];if((r42|0)==0){break}if(r42>>>0<HEAP32[14712>>2]>>>0){_abort()}else{HEAP32[r67+20>>2]=r42;HEAP32[r42+24>>2]=r67;break}}}while(0);r70=r55+((r53|r65)+r54)|0;r71=r53+r37|0}else{r70=r51;r71=r37}r36=r70+4|0;HEAP32[r36>>2]=HEAP32[r36>>2]&-2;HEAP32[r55+(r48+4)>>2]=r71|1;HEAP32[r55+(r71+r48)>>2]=r71;r36=r71>>>3;if(r71>>>0<256){r47=r36<<1;r49=14736+(r47<<2)|0;r42=HEAP32[14696>>2];r13=1<<r36;do{if((r42&r13|0)==0){HEAP32[14696>>2]=r42|r13;r72=r49;r73=14736+(r47+2<<2)|0}else{r36=14736+(r47+2<<2)|0;r46=HEAP32[r36>>2];if(r46>>>0>=HEAP32[14712>>2]>>>0){r72=r46;r73=r36;break}_abort()}}while(0);HEAP32[r73>>2]=r52;HEAP32[r72+12>>2]=r52;HEAP32[r55+(r48+8)>>2]=r72;HEAP32[r55+(r48+12)>>2]=r49;break}r47=r56;r13=r71>>>8;do{if((r13|0)==0){r74=0}else{if(r71>>>0>16777215){r74=31;break}r42=(r13+1048320|0)>>>16&8;r53=r13<<r42;r36=(r53+520192|0)>>>16&4;r46=r53<<r36;r53=(r46+245760|0)>>>16&2;r43=14-(r36|r42|r53)+(r46<<r53>>>15)|0;r74=r71>>>((r43+7|0)>>>0)&1|r43<<1}}while(0);r13=15e3+(r74<<2)|0;HEAP32[r55+(r48+28)>>2]=r74;HEAP32[r55+(r48+20)>>2]=0;HEAP32[r55+(r48+16)>>2]=0;r49=HEAP32[14700>>2];r43=1<<r74;if((r49&r43|0)==0){HEAP32[14700>>2]=r49|r43;HEAP32[r13>>2]=r47;HEAP32[r55+(r48+24)>>2]=r13;HEAP32[r55+(r48+12)>>2]=r47;HEAP32[r55+(r48+8)>>2]=r47;break}if((r74|0)==31){r75=0}else{r75=25-(r74>>>1)|0}r43=r71<<r75;r49=HEAP32[r13>>2];while(1){if((HEAP32[r49+4>>2]&-8|0)==(r71|0)){break}r76=r49+16+(r43>>>31<<2)|0;r13=HEAP32[r76>>2];if((r13|0)==0){r2=2335;break}else{r43=r43<<1;r49=r13}}if(r2==2335){if(r76>>>0<HEAP32[14712>>2]>>>0){_abort()}else{HEAP32[r76>>2]=r47;HEAP32[r55+(r48+24)>>2]=r49;HEAP32[r55+(r48+12)>>2]=r47;HEAP32[r55+(r48+8)>>2]=r47;break}}r43=r49+8|0;r13=HEAP32[r43>>2];r53=HEAP32[14712>>2];if(r49>>>0<r53>>>0){_abort()}if(r13>>>0<r53>>>0){_abort()}else{HEAP32[r13+12>>2]=r47;HEAP32[r43>>2]=r47;HEAP32[r55+(r48+8)>>2]=r13;HEAP32[r55+(r48+12)>>2]=r49;HEAP32[r55+(r48+24)>>2]=0;break}}}while(0);r14=r55+(r64|8)|0;return r14}}while(0);r50=r57;r48=15144;while(1){r77=HEAP32[r48>>2];if(r77>>>0<=r50>>>0){r78=HEAP32[r48+4>>2];r79=r77+r78|0;if(r79>>>0>r50>>>0){break}}r48=HEAP32[r48+8>>2]}r48=r77+(r78-39)|0;if((r48&7|0)==0){r80=0}else{r80=-r48&7}r48=r77+(r78-47+r80)|0;r56=r48>>>0<(r57+16|0)>>>0?r50:r48;r48=r56+8|0;r52=r55+8|0;if((r52&7|0)==0){r81=0}else{r81=-r52&7}r52=r54-40-r81|0;HEAP32[14720>>2]=r55+r81;HEAP32[14708>>2]=r52;HEAP32[r55+(r81+4)>>2]=r52|1;HEAP32[r55+(r54-36)>>2]=40;HEAP32[14724>>2]=HEAP32[14680>>2];HEAP32[r56+4>>2]=27;HEAP32[r48>>2]=HEAP32[15144>>2];HEAP32[r48+4>>2]=HEAP32[15148>>2];HEAP32[r48+8>>2]=HEAP32[15152>>2];HEAP32[r48+12>>2]=HEAP32[15156>>2];HEAP32[15144>>2]=r55;HEAP32[15148>>2]=r54;HEAP32[15156>>2]=0;HEAP32[15152>>2]=r48;r48=r56+28|0;HEAP32[r48>>2]=7;if((r56+32|0)>>>0<r79>>>0){r52=r48;while(1){r48=r52+4|0;HEAP32[r48>>2]=7;if((r52+8|0)>>>0<r79>>>0){r52=r48}else{break}}}if((r56|0)==(r50|0)){break}r52=r56-r57|0;r48=r50+(r52+4)|0;HEAP32[r48>>2]=HEAP32[r48>>2]&-2;HEAP32[r57+4>>2]=r52|1;HEAP32[r50+r52>>2]=r52;r48=r52>>>3;if(r52>>>0<256){r37=r48<<1;r51=14736+(r37<<2)|0;r45=HEAP32[14696>>2];r13=1<<r48;do{if((r45&r13|0)==0){HEAP32[14696>>2]=r45|r13;r82=r51;r83=14736+(r37+2<<2)|0}else{r48=14736+(r37+2<<2)|0;r43=HEAP32[r48>>2];if(r43>>>0>=HEAP32[14712>>2]>>>0){r82=r43;r83=r48;break}_abort()}}while(0);HEAP32[r83>>2]=r57;HEAP32[r82+12>>2]=r57;HEAP32[r57+8>>2]=r82;HEAP32[r57+12>>2]=r51;break}r37=r57;r13=r52>>>8;do{if((r13|0)==0){r84=0}else{if(r52>>>0>16777215){r84=31;break}r45=(r13+1048320|0)>>>16&8;r50=r13<<r45;r56=(r50+520192|0)>>>16&4;r48=r50<<r56;r50=(r48+245760|0)>>>16&2;r43=14-(r56|r45|r50)+(r48<<r50>>>15)|0;r84=r52>>>((r43+7|0)>>>0)&1|r43<<1}}while(0);r13=15e3+(r84<<2)|0;HEAP32[r57+28>>2]=r84;HEAP32[r57+20>>2]=0;HEAP32[r57+16>>2]=0;r51=HEAP32[14700>>2];r43=1<<r84;if((r51&r43|0)==0){HEAP32[14700>>2]=r51|r43;HEAP32[r13>>2]=r37;HEAP32[r57+24>>2]=r13;HEAP32[r57+12>>2]=r57;HEAP32[r57+8>>2]=r57;break}if((r84|0)==31){r85=0}else{r85=25-(r84>>>1)|0}r43=r52<<r85;r51=HEAP32[r13>>2];while(1){if((HEAP32[r51+4>>2]&-8|0)==(r52|0)){break}r86=r51+16+(r43>>>31<<2)|0;r13=HEAP32[r86>>2];if((r13|0)==0){r2=2370;break}else{r43=r43<<1;r51=r13}}if(r2==2370){if(r86>>>0<HEAP32[14712>>2]>>>0){_abort()}else{HEAP32[r86>>2]=r37;HEAP32[r57+24>>2]=r51;HEAP32[r57+12>>2]=r57;HEAP32[r57+8>>2]=r57;break}}r43=r51+8|0;r52=HEAP32[r43>>2];r13=HEAP32[14712>>2];if(r51>>>0<r13>>>0){_abort()}if(r52>>>0<r13>>>0){_abort()}else{HEAP32[r52+12>>2]=r37;HEAP32[r43>>2]=r37;HEAP32[r57+8>>2]=r52;HEAP32[r57+12>>2]=r51;HEAP32[r57+24>>2]=0;break}}}while(0);r57=HEAP32[14708>>2];if(r57>>>0<=r15>>>0){break}r52=r57-r15|0;HEAP32[14708>>2]=r52;r57=HEAP32[14720>>2];r43=r57;HEAP32[14720>>2]=r43+r15;HEAP32[r43+(r15+4)>>2]=r52|1;HEAP32[r57+4>>2]=r15|3;r14=r57+8|0;return r14}}while(0);HEAP32[___errno_location()>>2]=12;r14=0;return r14}function _free(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36,r37,r38,r39,r40;r2=0;if((r1|0)==0){return}r3=r1-8|0;r4=r3;r5=HEAP32[14712>>2];if(r3>>>0<r5>>>0){_abort()}r6=HEAP32[r1-4>>2];r7=r6&3;if((r7|0)==1){_abort()}r8=r6&-8;r9=r1+(r8-8)|0;r10=r9;L3117:do{if((r6&1|0)==0){r11=HEAP32[r3>>2];if((r7|0)==0){return}r12=-8-r11|0;r13=r1+r12|0;r14=r13;r15=r11+r8|0;if(r13>>>0<r5>>>0){_abort()}if((r14|0)==(HEAP32[14716>>2]|0)){r16=r1+(r8-4)|0;if((HEAP32[r16>>2]&3|0)!=3){r17=r14;r18=r15;break}HEAP32[14704>>2]=r15;HEAP32[r16>>2]=HEAP32[r16>>2]&-2;HEAP32[r1+(r12+4)>>2]=r15|1;HEAP32[r9>>2]=r15;return}r16=r11>>>3;if(r11>>>0<256){r11=HEAP32[r1+(r12+8)>>2];r19=HEAP32[r1+(r12+12)>>2];r20=14736+(r16<<1<<2)|0;do{if((r11|0)!=(r20|0)){if(r11>>>0<r5>>>0){_abort()}if((HEAP32[r11+12>>2]|0)==(r14|0)){break}_abort()}}while(0);if((r19|0)==(r11|0)){HEAP32[14696>>2]=HEAP32[14696>>2]&~(1<<r16);r17=r14;r18=r15;break}do{if((r19|0)==(r20|0)){r21=r19+8|0}else{if(r19>>>0<r5>>>0){_abort()}r22=r19+8|0;if((HEAP32[r22>>2]|0)==(r14|0)){r21=r22;break}_abort()}}while(0);HEAP32[r11+12>>2]=r19;HEAP32[r21>>2]=r11;r17=r14;r18=r15;break}r20=r13;r16=HEAP32[r1+(r12+24)>>2];r22=HEAP32[r1+(r12+12)>>2];do{if((r22|0)==(r20|0)){r23=r1+(r12+20)|0;r24=HEAP32[r23>>2];if((r24|0)==0){r25=r1+(r12+16)|0;r26=HEAP32[r25>>2];if((r26|0)==0){r27=0;break}else{r28=r26;r29=r25}}else{r28=r24;r29=r23}while(1){r23=r28+20|0;r24=HEAP32[r23>>2];if((r24|0)!=0){r28=r24;r29=r23;continue}r23=r28+16|0;r24=HEAP32[r23>>2];if((r24|0)==0){break}else{r28=r24;r29=r23}}if(r29>>>0<r5>>>0){_abort()}else{HEAP32[r29>>2]=0;r27=r28;break}}else{r23=HEAP32[r1+(r12+8)>>2];if(r23>>>0<r5>>>0){_abort()}r24=r23+12|0;if((HEAP32[r24>>2]|0)!=(r20|0)){_abort()}r25=r22+8|0;if((HEAP32[r25>>2]|0)==(r20|0)){HEAP32[r24>>2]=r22;HEAP32[r25>>2]=r23;r27=r22;break}else{_abort()}}}while(0);if((r16|0)==0){r17=r14;r18=r15;break}r22=r1+(r12+28)|0;r13=15e3+(HEAP32[r22>>2]<<2)|0;do{if((r20|0)==(HEAP32[r13>>2]|0)){HEAP32[r13>>2]=r27;if((r27|0)!=0){break}HEAP32[14700>>2]=HEAP32[14700>>2]&~(1<<HEAP32[r22>>2]);r17=r14;r18=r15;break L3117}else{if(r16>>>0<HEAP32[14712>>2]>>>0){_abort()}r11=r16+16|0;if((HEAP32[r11>>2]|0)==(r20|0)){HEAP32[r11>>2]=r27}else{HEAP32[r16+20>>2]=r27}if((r27|0)==0){r17=r14;r18=r15;break L3117}}}while(0);if(r27>>>0<HEAP32[14712>>2]>>>0){_abort()}HEAP32[r27+24>>2]=r16;r20=HEAP32[r1+(r12+16)>>2];do{if((r20|0)!=0){if(r20>>>0<HEAP32[14712>>2]>>>0){_abort()}else{HEAP32[r27+16>>2]=r20;HEAP32[r20+24>>2]=r27;break}}}while(0);r20=HEAP32[r1+(r12+20)>>2];if((r20|0)==0){r17=r14;r18=r15;break}if(r20>>>0<HEAP32[14712>>2]>>>0){_abort()}else{HEAP32[r27+20>>2]=r20;HEAP32[r20+24>>2]=r27;r17=r14;r18=r15;break}}else{r17=r4;r18=r8}}while(0);r4=r17;if(r4>>>0>=r9>>>0){_abort()}r27=r1+(r8-4)|0;r5=HEAP32[r27>>2];if((r5&1|0)==0){_abort()}do{if((r5&2|0)==0){if((r10|0)==(HEAP32[14720>>2]|0)){r28=HEAP32[14708>>2]+r18|0;HEAP32[14708>>2]=r28;HEAP32[14720>>2]=r17;HEAP32[r17+4>>2]=r28|1;if((r17|0)!=(HEAP32[14716>>2]|0)){return}HEAP32[14716>>2]=0;HEAP32[14704>>2]=0;return}if((r10|0)==(HEAP32[14716>>2]|0)){r28=HEAP32[14704>>2]+r18|0;HEAP32[14704>>2]=r28;HEAP32[14716>>2]=r17;HEAP32[r17+4>>2]=r28|1;HEAP32[r4+r28>>2]=r28;return}r28=(r5&-8)+r18|0;r29=r5>>>3;L3219:do{if(r5>>>0<256){r21=HEAP32[r1+r8>>2];r7=HEAP32[r1+(r8|4)>>2];r3=14736+(r29<<1<<2)|0;do{if((r21|0)!=(r3|0)){if(r21>>>0<HEAP32[14712>>2]>>>0){_abort()}if((HEAP32[r21+12>>2]|0)==(r10|0)){break}_abort()}}while(0);if((r7|0)==(r21|0)){HEAP32[14696>>2]=HEAP32[14696>>2]&~(1<<r29);break}do{if((r7|0)==(r3|0)){r30=r7+8|0}else{if(r7>>>0<HEAP32[14712>>2]>>>0){_abort()}r6=r7+8|0;if((HEAP32[r6>>2]|0)==(r10|0)){r30=r6;break}_abort()}}while(0);HEAP32[r21+12>>2]=r7;HEAP32[r30>>2]=r21}else{r3=r9;r6=HEAP32[r1+(r8+16)>>2];r20=HEAP32[r1+(r8|4)>>2];do{if((r20|0)==(r3|0)){r16=r1+(r8+12)|0;r22=HEAP32[r16>>2];if((r22|0)==0){r13=r1+(r8+8)|0;r11=HEAP32[r13>>2];if((r11|0)==0){r31=0;break}else{r32=r11;r33=r13}}else{r32=r22;r33=r16}while(1){r16=r32+20|0;r22=HEAP32[r16>>2];if((r22|0)!=0){r32=r22;r33=r16;continue}r16=r32+16|0;r22=HEAP32[r16>>2];if((r22|0)==0){break}else{r32=r22;r33=r16}}if(r33>>>0<HEAP32[14712>>2]>>>0){_abort()}else{HEAP32[r33>>2]=0;r31=r32;break}}else{r16=HEAP32[r1+r8>>2];if(r16>>>0<HEAP32[14712>>2]>>>0){_abort()}r22=r16+12|0;if((HEAP32[r22>>2]|0)!=(r3|0)){_abort()}r13=r20+8|0;if((HEAP32[r13>>2]|0)==(r3|0)){HEAP32[r22>>2]=r20;HEAP32[r13>>2]=r16;r31=r20;break}else{_abort()}}}while(0);if((r6|0)==0){break}r20=r1+(r8+20)|0;r21=15e3+(HEAP32[r20>>2]<<2)|0;do{if((r3|0)==(HEAP32[r21>>2]|0)){HEAP32[r21>>2]=r31;if((r31|0)!=0){break}HEAP32[14700>>2]=HEAP32[14700>>2]&~(1<<HEAP32[r20>>2]);break L3219}else{if(r6>>>0<HEAP32[14712>>2]>>>0){_abort()}r7=r6+16|0;if((HEAP32[r7>>2]|0)==(r3|0)){HEAP32[r7>>2]=r31}else{HEAP32[r6+20>>2]=r31}if((r31|0)==0){break L3219}}}while(0);if(r31>>>0<HEAP32[14712>>2]>>>0){_abort()}HEAP32[r31+24>>2]=r6;r3=HEAP32[r1+(r8+8)>>2];do{if((r3|0)!=0){if(r3>>>0<HEAP32[14712>>2]>>>0){_abort()}else{HEAP32[r31+16>>2]=r3;HEAP32[r3+24>>2]=r31;break}}}while(0);r3=HEAP32[r1+(r8+12)>>2];if((r3|0)==0){break}if(r3>>>0<HEAP32[14712>>2]>>>0){_abort()}else{HEAP32[r31+20>>2]=r3;HEAP32[r3+24>>2]=r31;break}}}while(0);HEAP32[r17+4>>2]=r28|1;HEAP32[r4+r28>>2]=r28;if((r17|0)!=(HEAP32[14716>>2]|0)){r34=r28;break}HEAP32[14704>>2]=r28;return}else{HEAP32[r27>>2]=r5&-2;HEAP32[r17+4>>2]=r18|1;HEAP32[r4+r18>>2]=r18;r34=r18}}while(0);r18=r34>>>3;if(r34>>>0<256){r4=r18<<1;r5=14736+(r4<<2)|0;r27=HEAP32[14696>>2];r31=1<<r18;do{if((r27&r31|0)==0){HEAP32[14696>>2]=r27|r31;r35=r5;r36=14736+(r4+2<<2)|0}else{r18=14736+(r4+2<<2)|0;r8=HEAP32[r18>>2];if(r8>>>0>=HEAP32[14712>>2]>>>0){r35=r8;r36=r18;break}_abort()}}while(0);HEAP32[r36>>2]=r17;HEAP32[r35+12>>2]=r17;HEAP32[r17+8>>2]=r35;HEAP32[r17+12>>2]=r5;return}r5=r17;r35=r34>>>8;do{if((r35|0)==0){r37=0}else{if(r34>>>0>16777215){r37=31;break}r36=(r35+1048320|0)>>>16&8;r4=r35<<r36;r31=(r4+520192|0)>>>16&4;r27=r4<<r31;r4=(r27+245760|0)>>>16&2;r18=14-(r31|r36|r4)+(r27<<r4>>>15)|0;r37=r34>>>((r18+7|0)>>>0)&1|r18<<1}}while(0);r35=15e3+(r37<<2)|0;HEAP32[r17+28>>2]=r37;HEAP32[r17+20>>2]=0;HEAP32[r17+16>>2]=0;r18=HEAP32[14700>>2];r4=1<<r37;do{if((r18&r4|0)==0){HEAP32[14700>>2]=r18|r4;HEAP32[r35>>2]=r5;HEAP32[r17+24>>2]=r35;HEAP32[r17+12>>2]=r17;HEAP32[r17+8>>2]=r17}else{if((r37|0)==31){r38=0}else{r38=25-(r37>>>1)|0}r27=r34<<r38;r36=HEAP32[r35>>2];while(1){if((HEAP32[r36+4>>2]&-8|0)==(r34|0)){break}r39=r36+16+(r27>>>31<<2)|0;r31=HEAP32[r39>>2];if((r31|0)==0){r2=2547;break}else{r27=r27<<1;r36=r31}}if(r2==2547){if(r39>>>0<HEAP32[14712>>2]>>>0){_abort()}else{HEAP32[r39>>2]=r5;HEAP32[r17+24>>2]=r36;HEAP32[r17+12>>2]=r17;HEAP32[r17+8>>2]=r17;break}}r27=r36+8|0;r28=HEAP32[r27>>2];r31=HEAP32[14712>>2];if(r36>>>0<r31>>>0){_abort()}if(r28>>>0<r31>>>0){_abort()}else{HEAP32[r28+12>>2]=r5;HEAP32[r27>>2]=r5;HEAP32[r17+8>>2]=r28;HEAP32[r17+12>>2]=r36;HEAP32[r17+24>>2]=0;break}}}while(0);r17=HEAP32[14728>>2]-1|0;HEAP32[14728>>2]=r17;if((r17|0)==0){r40=15152}else{return}while(1){r17=HEAP32[r40>>2];if((r17|0)==0){break}else{r40=r17+8|0}}HEAP32[14728>>2]=-1;return}
// EMSCRIPTEN_END_FUNCS
Module["_main"] = _main;
Module["_malloc"] = _malloc;
Module["_free"] = _free;
// Warning: printing of i64 values may be slightly rounded! No deep i64 math used, so precise i64 code not included
var i64Math = null;
// === Auto-generated postamble setup entry stuff ===
if (memoryInitializer) {
  function applyData(data) {
    HEAPU8.set(data, STATIC_BASE);
  }
  if (ENVIRONMENT_IS_NODE || ENVIRONMENT_IS_SHELL) {
    applyData(Module['readBinary'](memoryInitializer));
  } else {
    addRunDependency('memory initializer');
    Browser.asyncLoad(memoryInitializer, function(data) {
      applyData(data);
      removeRunDependency('memory initializer');
    }, function(data) {
      throw 'could not load memory initializer ' + memoryInitializer;
    });
  }
}
function ExitStatus(status) {
  this.name = "ExitStatus";
  this.message = "Program terminated with exit(" + status + ")";
  this.status = status;
};
ExitStatus.prototype = new Error();
ExitStatus.prototype.constructor = ExitStatus;
var initialStackTop;
var preloadStartTime = null;
var calledMain = false;
dependenciesFulfilled = function runCaller() {
  // If run has never been called, and we should call run (INVOKE_RUN is true, and Module.noInitialRun is not false)
  if (!Module['calledRun'] && shouldRunNow) run();
  if (!Module['calledRun']) dependenciesFulfilled = runCaller; // try this again later, after new deps are fulfilled
}
Module['callMain'] = Module.callMain = function callMain(args) {
  assert(runDependencies == 0, 'cannot call main when async dependencies remain! (listen on __ATMAIN__)');
  assert(__ATPRERUN__.length == 0, 'cannot call main when preRun functions remain to be called');
  args = args || [];
  if (ENVIRONMENT_IS_WEB && preloadStartTime !== null) {
    Module.printErr('preload time: ' + (Date.now() - preloadStartTime) + ' ms');
  }
  ensureInitRuntime();
  var argc = args.length+1;
  function pad() {
    for (var i = 0; i < 4-1; i++) {
      argv.push(0);
    }
  }
  var argv = [allocate(intArrayFromString("/bin/this.program"), 'i8', ALLOC_NORMAL) ];
  pad();
  for (var i = 0; i < argc-1; i = i + 1) {
    argv.push(allocate(intArrayFromString(args[i]), 'i8', ALLOC_NORMAL));
    pad();
  }
  argv.push(0);
  argv = allocate(argv, 'i32', ALLOC_NORMAL);
  initialStackTop = STACKTOP;
  try {
    var ret = Module['_main'](argc, argv, 0);
    // if we're not running an evented main loop, it's time to exit
    if (!Module['noExitRuntime']) {
      exit(ret);
    }
  }
  catch(e) {
    if (e instanceof ExitStatus) {
      // exit() throws this once it's done to make sure execution
      // has been stopped completely
      return;
    } else if (e == 'SimulateInfiniteLoop') {
      // running an evented main loop, don't immediately exit
      Module['noExitRuntime'] = true;
      return;
    } else {
      if (e && typeof e === 'object' && e.stack) Module.printErr('exception thrown: ' + [e, e.stack]);
      throw e;
    }
  } finally {
    calledMain = true;
  }
}
function run(args) {
  args = args || Module['arguments'];
  if (preloadStartTime === null) preloadStartTime = Date.now();
  if (runDependencies > 0) {
    Module.printErr('run() called, but dependencies remain, so not running');
    return;
  }
  preRun();
  if (runDependencies > 0) {
    // a preRun added a dependency, run will be called later
    return;
  }
  function doRun() {
    ensureInitRuntime();
    preMain();
    Module['calledRun'] = true;
    if (Module['_main'] && shouldRunNow) {
      Module['callMain'](args);
    }
    postRun();
  }
  if (Module['setStatus']) {
    Module['setStatus']('Running...');
    setTimeout(function() {
      setTimeout(function() {
        Module['setStatus']('');
      }, 1);
      if (!ABORT) doRun();
    }, 1);
  } else {
    doRun();
  }
}
Module['run'] = Module.run = run;
function exit(status) {
  ABORT = true;
  EXITSTATUS = status;
  STACKTOP = initialStackTop;
  // exit the runtime
  exitRuntime();
  // TODO We should handle this differently based on environment.
  // In the browser, the best we can do is throw an exception
  // to halt execution, but in node we could process.exit and
  // I'd imagine SM shell would have something equivalent.
  // This would let us set a proper exit status (which
  // would be great for checking test exit statuses).
  // https://github.com/kripken/emscripten/issues/1371
  // throw an exception to halt the current execution
  throw new ExitStatus(status);
}
Module['exit'] = Module.exit = exit;
function abort(text) {
  if (text) {
    Module.print(text);
    Module.printErr(text);
  }
  ABORT = true;
  EXITSTATUS = 1;
  throw 'abort() at ' + stackTrace();
}
Module['abort'] = Module.abort = abort;
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

  // 必要なのだけ実装
  var MYFS = {
    // FS.mount実行時に呼ばれる  
    mount: function (parent, name, mode, rdev) {
      return MYFS.createNode(null, '/', 16384 | 0777, 0);
    },
    // 作成したノードを操作するメソッド
    node_ops: {
      // ノードの属性を書き込み(例: node.timestamp)
      setattr: function (node, attr) {
        if (attr.mode !== undefined) node.mode = attr.mode;
        if (attr.timestamp !== undefined) node.timestamp = attr.timestamp;
        if (attr.size !== undefined) {
          var contents = node.contents;
          if (contents.length > attr.size) {
            contents = contents.subarray(0, attr.size);
          } else {
            contents = MYFS.expandBuffer(contents, attr.size);
          }
          node.contents = contents;
          node.size = attr.size;
        }
      },
      // ノードを検索するんだけど、不必要なのでMEMFSから拝借
      lookup: MEMFS.node_ops.lookup,
      // 新しいノードを作る
      mknod: function (parent, name, mode, dev) {
        return MYFS.createNode(parent, name, mode, dev);
      }
    },
    // IO系の操作をするメソッド
    stream_ops: {
      // 読み
      read: function (stream, buffer, offset, length, position) {
        var node = stream.node,
            contents = node.contents,
            size = Math.min(contents.length - position, length);

        if (size > 8 && contents.subarray) { // non-trivial, and typed array
          buffer.set(contents.subarray(position, position + size), offset);
        } else {
          for (var i = 0; i < size; i++) {
            buffer[offset + i] = contents[position + i];
          }
        }
        return size;
      },
      // 書き
      write: function (stream, buffer, offset, length, position, canOwn) {
        var node = stream.node,
            contents = node.contents,
            bufferSize = contents.length,
            size = position + length;
        // expand buffer
        if (bufferSize === 0) {
          contents = new Uint8Array(size);
          bufferSize = contents.length;
        }
        contents = MYFS.expandBuffer(contents, size);
        // write
        contents.set(buffer.subarray(offset, offset + length), position);
        node.contents = contents;
        node.size = size;

        return length;
      }
    },
    // ノードの作成。node_ops, stream_ops, contentsを設定する必要がある
    createNode: function (parent, name, mode, dev) {
      var node = FS.createNode(parent, name, mode, dev);
      node.node_ops = MYFS.node_ops;
      node.stream_ops = MYFS.stream_ops;
      node.contents = [];
      node.timestamp = Date.now();
      if (parent) parent.contents[name] = node;
      return node;
    },
    // FS.createDataFileっぽく使えるやつ
    createFile: function (parent, name, data, r, w) {
      var node = FS.createFile(
        parent,
        name,
        {},
        r,
        w
      );
      node.contents = data;
      node.node_ops = MYFS.node_ops;
      node.stream_ops = MYFS.stream_ops;
      return node;
    },
    // バッファサイズの拡張。とりあえず倍々
    expandBuffer: function (buffer, size) {
      if (buffer.length >= size) return buffer;
      var bufferSize = buffer.length, _buffer;
      while (bufferSize < size) bufferSize *= 2;
      var _buffer = new Uint8Array(bufferSize);
      _buffer.set(buffer);
      return _buffer;
    }
  };

  // MYFSをマウント。絶対必要！  
  FS.mount(MYFS, {}, '/');

  function $run (args, input) {
    // ファイルが残っている場合は削除
    try {
      FS.destroyNode(FS.lookupPath('/input').node);
    } catch (e) {} 
    try {
      FS.destroyNode(FS.lookupPath('/output').node);
    } catch (e) {}
    // ファイルを作成
    MYFS.createFile(
      '/',
      'input',
      input,
      true,
      true
    );
    var outputNode = MYFS.createFile(
      '/',
      'output',
      new Uint8Array(0),
      true,
      true
    );
    // main関数呼び出し
    Module.callMain(args);
    // おしりを削って返す
    return outputNode.contents.subarray(0, outputNode.size);
  }

  return {
    run: $run,
    compress: $run.bind(null, []),
    decompress: $run.bind(null, ['-d'])
  };

})();