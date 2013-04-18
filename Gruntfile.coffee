module.exports = (grunt) ->
  grunt.initConfig
    concat:
      asm:
        src: ['zlib_asm_pre.js',' pre.js', 'dest/zlib-asm.raw.js', 'post.js']
        dest: 'dest/zlib-asm.js'

      noasm:
        src: ['zlib_noasm_pre.js', 'pre.js', 'dest/zlib-noasm.raw.js', 'post.js']
        dest: 'dest/zlib-noasm.js'

    exec:
      asm:
        command: 'emcc -o dest/zlib-asm.raw.js -O2 zpipe.c libz.a -o dest/zpipe.raw.js --closure 0 -s ASM_JS=1'

      noasm:
        command: 'emcc -o dest/zlib-noasm.raw.js -O2 zpipe.c libz.a -o dest/zpipe.raw.js --closure 0'

  grunt.loadNpmTasks 'grunt-contrib-concat'
  grunt.loadNpmTasks 'grunt-exec'

  grunt.registerTask 'default', ['exec', 'concat']