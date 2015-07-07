/**
 * Created by tsufiev on 2/24/15.
 */
(function() {
  'use strict';

  angular
    .module('merlin', ['ui.bootstrap'])
    .config(interpolateProvider)
    // move these 2 values out of run section to change them in unit-tests
    .value('fieldTemplatesUrl', '/static/merlin/templates/fields/')
    .value('fieldTemplates', fieldTemplates)
    .run(runTemplates);

  runTemplates.$inject = ['merlin.templates', 'fieldTemplatesUrl', 'fieldTemplates'];

  function fieldTemplatesUrl() {
    return ('/static/merlin/templates/fields/');
  }

  function fieldTemplates() {
    return [
      'dictionary', 'frozendict', 'list',
      'string', 'text', 'group', 'number', 'choices'
    ];
  }

  function runTemplates(templates, rootUrl, fieldList) {
    templates.prefetch(rootUrl, fieldList);
  }

  function interpolateProvider($interpolateProvider) {
    // Replacing the default angular symbol
    // allow us to mix angular with django templates
    $interpolateProvider.startSymbol('{$');
    $interpolateProvider.endSymbol('$}');
  }
})();
