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

        plugins: [
            'karma-jasmine',
            'karma-phantomjs-launcher',
//            'karma-chrome-launcher',
        ],

        files: [
            './bower_components/angular/angular.js',
            './bower_components/angular-mocks/angular-mocks.js',
            './static/merlin/js/merlin.init.js',
            './static/merlin/js/merlin.directives.js',
            './static/merlin/js/merlin.field.models.js',
            './static/merlin/js/merlin.panel.models.js',
            './static/merlin/js/merlin.utils.js',
            './static/merlin/js/lib/angular-filter.js',
            './static/merlin/js/lib/barricade.js',
            './static/merlin/js/lib/js-yaml.js',
            './static/merlin/js/lib/ui-bootstrap-tpls-0.12.1.js',
            './tests/utilsSpec.js'
        ],

        exclude: [
        ],

        singleRun: true
    });
};