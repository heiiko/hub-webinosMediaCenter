_ = require 'underscore'

module.exports = (grunt) ->
  deps = ['util', 'underscore', 'baconjs', 'bacon.jquery', 'statechart']
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
    'jquery.fittext':
      path: 'vendor/jquery.fittext.js'
      exports: null
      depends:
        jquery: 'jQuery'
    iscroll:
      path: 'vendor/iscroll.js'
      exports: 'IScroll'

  grunt.initConfig
    browserify:
      options:
        debug: no # yes

      wrt:
        src: []
        dest: 'dist/wrt.js'
        options:
          shim: _.pick(shim, 'webinos')
          ignore: ['crypto', 'path', './logging.js', './registry.js', 'webinos-utilities']

      deps:
        src: []
        dest: 'dist/deps.js'
        options:
          alias: deps
          shim: _.pick(shim, ['promise', 'jquery', 'jquery.fittext', 'iscroll'])

      app:
        src: ['lib/app.js']
        dest: 'dist/app.js'
        options:
          transform: ['coffeeify']
          shim: shim
          external: deps.concat _.pluck(shim, 'path')

    clean:
      dist: ['dist', 'css']
      
    uglify:
      dist:
        files:
          'dist/wrt.js':  'dist/wrt.js'
          'dist/deps.js': 'dist/deps.js'
          'dist/app.js':  'dist/app.js'

    compass:
       dist:
         options:
           config: 'config.rb'

    watch:
      app:
        files: ['lib/**/*.coffee', 'lib/**/*.js', 'sass/*.scss']
        tasks: ['browserify:app', 'compass:dist']

  grunt.loadNpmTasks 'grunt-browserify'
  grunt.loadNpmTasks 'grunt-contrib-clean'
  grunt.loadNpmTasks 'grunt-contrib-uglify'
  grunt.loadNpmTasks 'grunt-contrib-watch'
  grunt.loadNpmTasks 'grunt-contrib-compass'

  grunt.registerTask 'dist', ['clean:dist', 'browserify:wrt', 'browserify:deps', 'browserify:app', 'compass:dist']
  grunt.registerTask 'default', ['dist']
