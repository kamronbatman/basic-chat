var fs    = require('fs'),
    path  = require('path');
            require('dotenv').load();

process.isDev = function () { return process.env.NODE_ENV === 'development'; };
process.isProd = function () { return process.env.NODE_ENV === 'production'; };

module.exports = function(grunt) {
  require('load-grunt-tasks')(grunt);

  grunt.initConfig({

    pkg: grunt.file.readJSON('package.json'),

    express: {
      options: {
        delay: 5000
      },
      dev: {
        options: {
          script: 'server/server.js'
        }
      }
    },

    jshint: {
      options: {
        reporter: require('jshint-stylish'),
      },
      dev: [ 'Gruntfile.js', './server/*.js', './server/**/*.js' ],
      production: [ 'Gruntfile.js', './server/*.js', 'server/**/*.js' ],
    },

    watch: {
      dev: {
        options: { livereload: true, spawn: false },
        files:  [ 'server/*.js', 'server/**/*.js' ],
        tasks:  [ 'build', 'express:dev' ]
      }
    },

    shell: {
      options: {
        failOnError: false
      },
      start: {
        command: 'forever start -a -o "' + __dirname + '/logs/logs.log" server/server.js'
      },
      stop: {
        command: 'forever stopall'
      },
      restart: {
        command: 'forever restart server/server.js'
      }
    },

  });

  grunt.registerTask('default', process.isDev() ? 'dev' : 'prod' );
  grunt.registerTask('build', process.isDev() ? 'dev_build' : 'prod_build' );
  grunt.registerTask('restart', [ 'shell:restart' ]);
  grunt.registerTask('start', [ 'shell:start' ]);
  grunt.registerTask('stop', [ 'shell:stop' ]);

  grunt.registerTask('dev_build', [ 'jshint:dev' ]);
  grunt.registerTask('dev', [ 'dev_build', 'express:dev', 'watch:dev' ]);

  grunt.registerTask('prod_build', [ 'jshint:production' ]);
  grunt.registerTask('prod', [ 'prod_build', 'start' ]);
  grunt.registerTask('restart:prod', [ 'prod_build', 'restart' ]);
};