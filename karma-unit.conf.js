/*
 * Copyright (c) 2013 Hewlett-Packard Development Company, L.P.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License. You may obtain
 * a copy of the License at
 *
 * 	http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations
 * under the License.
 */

module.exports = function (config) {
  'use strict';

  config.set({

    port: 9876,

    basePath: '',

    frameworks: ['jasmine'],

    browsers: [ 'PhantomJS'],

    plugins: [
      'karma-jasmine',
      'karma-phantomjs-launcher',
      'karma-ng-html2js-preprocessor'
    ],

    files: [
      'bower_components/jquery/dist/jquery.js',
      'bower_components/angular/angular.js',
      'bower_components/angular-mocks/angular-mocks.js',
      'merlin/static/merlin/js/libs/underscore/underscore.js',
      'merlin/static/merlin/js/libs/js-yaml/dist/js-yaml.min.js',
      'merlin/static/merlin/js/custom-libs/barricade.js',
      'merlin/static/merlin/js/custom-libs/ui-bootstrap-tpls-0.12.1.js',
      // explicitly require first module definition file to avoid errors
      'merlin/static/merlin/js/merlin.init.js',
      'merlin/static/merlin/js/merlin.*.js',
      'merlin/static/merlin/templates/**/*.html',
      'merlin/test/js/*Spec.js',
      // explicitly require first module definition file to avoid errors
      'extensions/mistral/static/mistral/js/mistral.init.js',
      'extensions/mistral/static/mistral/js/mistral.*.js',
      'extensions/mistral/test/js/*Spec.js'
    ],

    preprocessors: {
      'merlin/static/merlin/templates/**/*.html': ['ng-html2js']
    },

    ngHtml2JsPreprocessor: {
      stripPrefix: 'merlin',
      moduleName: 'preprocessedTemplates'
    },

    exclude: [
    ],

    singleRun: true
});
};