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
