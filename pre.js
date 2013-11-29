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


