/*
* Copyright (c) 2013 Hewlett-Packard Development Company, L.P.
*
* Licensed under the Apache License, Version 2.0 (the 'License'); you may
* not use this file except in compliance with the License. You may obtain
* a copy of the License at
*
* 	http://www.apache.org/licenses/LICENSE-2.0
*
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an 'AS IS' BASIS, WITHOUT
* WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
* License for the specific language governing permissions and limitations
* under the License.
*/

module.exports = function(grunt){

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
             /**
         * grunt concat
         *
         * Creates a single file out of our javascript source in accordance
         * with the concatenation priority. First the application module, then
         * any dependent module declarations, and finally everything else.
         */
        concat: {
            dist: {
                src: [
                    './merlin/static/merlin/js/**/*.js'
                ],
                dest: './merlin/dist/merlin.js'
            }
        },
        uglify: {
            options: {
                mangle: false
            },
            my_target: {
                files: {
                    '/merlindist/merlin.min.js': ['dist/merlin.js']
                }
            }
        },
        karma: {
            options: {
                // point all tasks to karma config file
                configFile: 'karma-unit.conf.js'
            },
            unit: {
                // run tests once instead of continuously
                singleRun: true
            }
        }
    });
    grunt.loadNpmTasks('grunt-karma');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-uglify');
//    grunt.registerTask('default', ['concat', 'uglify', 'karma']);
    //grunt.registerTask('default', ['karma']);
    grunt.registerTask('test:unit', [
        'karma:unit'
    ]);
    grunt.registerTask('test', [
        //'clean',
        //'bower:install',
        //'compile',
        //'useminPrepare',
        //'concat',
        'karma:unit',
        //'karma:integration',
        //'package',
        //'connect:test',
        //'protractor'
    ]);

};
