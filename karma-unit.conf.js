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
        ],

        files: [
            './bower_components/angular/angular.js',
            './bower_components/angular-mocks/angular-mocks.js',
            './merlin/static/merlin/js/merlin.init.js',
            './merlin/static/merlin/js/merlin.templates.js',
            './merlin/static/merlin/js/merlin.directives.js',
            './merlin/static/merlin/js/merlin.field.models.js',
            './merlin/static/merlin/js/merlin.panel.models.js',
            './merlin/static/merlin/js/merlin.utils.js',
            './merlin/static/merlin/js/lib/angular-filter.js',
            './merlin/static/merlin/js/lib/barricade.js',
            './merlin/static/merlin/js/lib/js-yaml.js',
            'merlin/test/js/utilsSpec.js',
            'merlin/test/js/templatesSpec.js',
            'merlin/test/js/filtersSpec.js'
        ],

        exclude: [
        ],

        singleRun: true
    });
};
