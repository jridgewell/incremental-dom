/**
 * Copyright 2015 The Incremental DOM Authors. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS-IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

var fs = require('fs');
var babelrc = JSON.parse(fs.readFileSync('.babelrc', 'utf8'));
babelrc.whitelist.push('es6.arrowFunctions', 'es6.modules');

module.exports = function(config) {
  config.set({
    frameworks: ['browserify', 'mocha', 'sinon-expect'],

    files: [
      'test/**/*.js'
    ],

    preprocessors: {
      'index.js': ['browserify'],
      'src/**/*.js': ['browserify'],
      'test/**/*.js': ['browserify']
    },

    browserify: {
      watch: true,
      debug: true,
      transform: [['babelify', babelrc]]
    },

    reporters: ['progress'],

    port: 9876,

    colors: true,

    logLevel: config.LOG_INFO,

    autoWatch: true,

    // change Karma's debug.html to the mocha web reporter
    client: {
      mocha: {
        reporter: 'html'
      }
    }
  });
};
