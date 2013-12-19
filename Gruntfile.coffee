module.exports = (grunt) ->
  grunt.initConfig
    concat:
      dev:
        src: ['src/header.js', 'src/pre.js', 'dev/_zlib.js', 'src/post.js', 'src/footer.js']
        dest: 'dev/zlib.js'
      release:
        src: ['src/header.js', '_zlib.js', 'src/footer.js']
        dest: 'zlib.js'
      testDev:
        src: ['test/loadDev.js', 'test/zlibSpec.js']
        dest: 'test/zlibDevSpec.js'
      testRelease:
        src: ['test/loadRelease.js', 'test/zlibSpec.js']
        dest: 'test/zlibReleaseSpec.js'

    exec:
      initZlib:
        cwd: 'zlib'
        cmd: 'emconfigure ./configure && make'
      compileDev:
        cmd: '''emcc -O2 src/zpipe.c zlib/libz.a -o dev/_zlib.js -s EXPORTED_FUNCTIONS="['_deflate_file', '_inflate_file']"'''
      compileRelease:
        cmd: '''emcc -O2 --closure 1 src/zpipe.c zlib/libz.a -o _zlib.js --pre-js src/pre.js --post-js src/post.js -s EXPORTED_FUNCTIONS="['_deflate_file', '_inflate_file']"'''

    clean:
      release: '_zlib.js'
      test: ['test/zlibDevSpec.js', 'test/zlibReleaseSpec.js']

    mkdir:
      dev:
        options:
          create: ['dev']

    cafemocha:
      dev:
        src: 'test/zlibDevSpec.js'
      release:
        src: 'test/zlibReleaseSpec.js'

    watch:
      c:
        files: ['src/zpipe.c']
        tasks: ['compile:dev', 'concat:dev', 'test:dev']
      js:
        files: ['src/*.js', 'test/zlibSpec.js']
        tasks: ['concat:dev', 'test:dev']

  grunt.loadNpmTasks 'grunt-contrib-concat'
  grunt.loadNpmTasks 'grunt-exec'
  grunt.loadNpmTasks 'grunt-contrib-clean'
  grunt.loadNpmTasks 'grunt-mkdir'
  grunt.loadNpmTasks 'grunt-cafe-mocha'
  grunt.loadNpmTasks 'grunt-contrib-watch'

  grunt.registerTask 'compile:dev', ['exec:compileDev']
  grunt.registerTask 'compile:release', ['exec:compileRelease']

  grunt.registerTask 'init', [
    'mkdir:dev'
    'exec:initZlib'
  ]

  grunt.registerTask 'test:dev', [
    'concat:testDev'
    'cafemocha:dev'
    'clean:test'
  ]

  grunt.registerTask 'test:release', [
    'concat:testRelease'
    'cafemocha:release'
    'clean:test'
  ]

  grunt.registerTask 'build:release', [
    'compile:release'
    'concat:release'
  ]

  grunt.registerTask 'release', [
    'build:release'
    'test:release'
    'clean:release'
  ]