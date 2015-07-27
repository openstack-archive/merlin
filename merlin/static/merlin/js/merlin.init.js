/**
 * Created by tsufiev on 2/24/15.
 */
(function() {
  'use strict';

  angular
    .module('merlin', ['ui.bootstrap'])
    .config(interpolateProvider)
    // move these 2 values out of run section to change them in unit-tests
    .value('webroot', '')
    .value('fieldTemplatesUrl', '/static/merlin/templates/fields/')
    // The false posititive on array constant here we're working around is caused
    // by https://github.com/Gillespie59/eslint-plugin-angular/issues/99
    .value('fieldTemplates', fieldTemplates())
    .run(runTemplates);

  runTemplates.$inject = ['merlin.templates', 'webroot',
    'fieldTemplatesUrl', 'fieldTemplates'];

  function fieldTemplates() {
    return [
      'dictionary', 'frozendict', 'list',
      'string', 'text', 'number', 'choices'
    ];
  }

  function runTemplates(templates, webroot, rootUrl, fieldList) {
    templates.prefetch(webroot + rootUrl, fieldList);
  }

  function interpolateProvider($interpolateProvider) {
    // Replacing the default angular symbol
    // allow us to mix angular with django templates
    $interpolateProvider.startSymbol('{$');
    $interpolateProvider.endSymbol('$}');
  }
})();
