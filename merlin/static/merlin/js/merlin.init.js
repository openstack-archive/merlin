/**
 * Created by tsufiev on 2/24/15.
 */
(function() {
  'use strict';

  angular.module('merlin', ['ui.bootstrap'])
    .config(function($interpolateProvider) {
      // Replacing the default angular symbol
      // allow us to mix angular with django templates
      $interpolateProvider.startSymbol('{$');
      $interpolateProvider.endSymbol('$}');
    })
    // move these 2 values out of run section to change them in unit-tests
    .value('fieldTemplatesUrl', '/static/merlin/templates/fields/')
    .value('fieldTemplates', ['dictionary', 'frozendict', 'list',
      'string', 'text', 'group', 'number', 'choices'])
    .run(['merlin.templates', 'fieldTemplatesUrl', 'fieldTemplates',
      function(templates, rootUrl, fieldList) {
        templates.prefetch(rootUrl, fieldList);
      }]);

})();