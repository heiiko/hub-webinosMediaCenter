_ = require 'underscore'

module.exports = (grunt) ->
  deps = ['underscore', 'baconjs', 'bacon-jquery-bindings', 'statechart']
  shim =
    webinos:
      path: 'vendor/webinos.js'
      exports: 'webinos'
    promise:
      path: 'vendor/promise.js'
      exports: 'Promise'
    jquery:
      path: 'vendor/jquery-2.0.3.js'
      exports: '$'
    iscroll:
      path: 'vendor/iscroll.js'
      exports: 'iScroll'

  grunt.initConfig
    browserify:
      options:
        debug: no # yes

      wrt:
        src: []
        dest: 'dist/wrt.js'
        options:
          shim: _.pick(shim, 'webinos')
          ignore: ['crypto', 'path', './registry.js', 'webinos-utilities']

      deps:
        src: []
        dest: 'dist/deps.js'
        options:
          alias: deps
          shim: _.pick(shim, ['promise', 'jquery', 'iscroll'])

      app:
        src: ['lib/app.js']
        dest: 'dist/app.js'
        options:
          transform: ['coffeeify']
          shim: shim
          external: deps.concat _.pluck(shim, 'path')

    clean:
      dist: ['dist']

    watch:
      app:
        files: ['lib/**/*.coffee', 'lib/**/*.js']
        tasks: ['browserify:app']

  grunt.loadNpmTasks 'grunt-browserify'
  grunt.loadNpmTasks 'grunt-contrib-clean'
  grunt.loadNpmTasks 'grunt-contrib-watch'

  grunt.registerTask 'dist', ['clean:dist', 'browserify:wrt', 'browserify:deps', 'browserify:app']
  grunt.registerTask 'default', ['dist']
