module.exports = (grunt) ->
  grunt.initConfig
    concat:
      asm:
        src: ['zlib-asm-pre.js', 'pre.js', 'dest/zlib-asm.raw.js', 'post.js']
        dest: 'dest/zlib-asm.js'

      noasm:
        src: ['zlib-noasm-pre.js', 'pre.js', 'dest/zlib-noasm.raw.js', 'post.js']
        dest: 'dest/zlib-noasm.js'

    exec:
      asm:
        command: 'emcc -O2 zpipe.c libz.a -o dest/zlib-asm.raw.js --closure 0 -s ASM_JS=1'

      noasm:
        command: 'emcc -O2 zpipe.c libz.a -o dest/zlib-noasm.raw.js --closure 0'

    nodeunit:
      all: ['test.js']

  grunt.loadNpmTasks 'grunt-contrib-nodeunit'
  grunt.loadNpmTasks 'grunt-contrib-concat'
  grunt.loadNpmTasks 'grunt-exec'

  grunt.registerTask 'default', ['exec', 'concat', 'nodeunit']