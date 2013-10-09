_ = require 'underscore'

module.exports = (grunt) ->
  deps = ['util', 'underscore', 'baconjs', 'bacon.jquery', 'statechart']
  shim =
    promise:
      path: 'src/vendor/promise.js'
      exports: 'Promise'
    jquery:
      path: 'src/vendor/jquery-2.0.3.js'
      exports: '$'
    'jquery.fittext':
      path: 'src/vendor/jquery.fittext.js'
      exports: null
      depends:
        jquery: 'jQuery'
    iscroll:
      path: 'src/vendor/iscroll.js'
      exports: 'IScroll'

  grunt.initConfig
    browserify:
      options:
        debug: no # yes

      deps:
        src: []
        dest: 'dist/js/deps.js'
        options:
          alias: deps
          shim: _.pick(shim, ['promise', 'jquery'])

      app:
        src: ['src/lib/app.js']
        dest: 'dist/js/app.js'
        options:
          transform: ['coffeeify']
          shim: shim
          external: deps.concat _.pluck(shim, 'path')

    clean:
      dist: ['dist']
      
    uglify:
      dist:
        options:
          compress: true
        files:
          'dist/js/deps.js': 'dist/js/deps.js'
          'dist/js/app.js':  'dist/js/app.js'

    compass:
       dist:
         options:
           sassDir:        'src/sass'
           specify:        'src/sass/style-mobile.scss'
           cssDir:         'dist/css'
           imagesDir:      'src/images'
           javascriptsDir: 'dist/js'
           fontsDir:       'src/fonts'
           environment:    'development'
           relativeAssets:  true
       prod:
         options:
           sassDir:        'src/sass'
           specify:        'src/sass/style-mobile.scss'
           cssDir:         'dist/css'
           imagesDir:      'src/images'
           javascriptsDir: 'js'
           fontsDir:       'src/fonts'
           environment:    'production'
           outputStyle:    'compressed'
           relativeAssets:  true

    processhtml:
       dist:
         options:
           data:
             uri:
               grunt.option('wrturi') || 'http://localhost:8080'
         files:
           'dist/index.html': 'src/html/index-mobile.html'

    htmlmin:
       dist:
         files:
           'dist/index.html': 'dist/index.html'
       prod:
         options:
           removeComments: true,
           collapseWhitespace: true
         files:
           'dist/index.html': 'dist/index.html'

    copy:
      images:
        files: [
          expand: true
          cwd: 'src/'
          src: 'images/**'
          dest: 'dist/'
        ]

    watch:
      app:
        files: ['src/lib/**/*.coffee', 'src/lib/**/*.js', 'src/sass/*.scss']
        tasks: ['browserify:app', 'compass:dist']

  grunt.loadNpmTasks 'grunt-browserify'
  grunt.loadNpmTasks 'grunt-contrib-clean'
  grunt.loadNpmTasks 'grunt-contrib-uglify'
  grunt.loadNpmTasks 'grunt-contrib-watch'
  grunt.loadNpmTasks 'grunt-contrib-compass'
  grunt.loadNpmTasks 'grunt-contrib-htmlmin'
  grunt.loadNpmTasks 'grunt-contrib-copy'
  grunt.loadNpmTasks 'grunt-processhtml'
  
  grunt.registerTask 'dev', ['clean:dist', 'copy:images', 'browserify:deps', 'browserify:app', 'compass:dist', 'processhtml:dist','htmlmin:dist']
  grunt.registerTask 'prod', ['clean:dist', 'copy:images', 'browserify:deps', 'browserify:app', 'uglify:dist', 'compass:prod','processhtml:dist', 'htmlmin:prod','htmlmin:dist']

  grunt.registerTask 'default', ['dev']
