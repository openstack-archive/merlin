/**
 * Created by tsufiev on 2/24/15.
 */
(function() {
  'use strict';

  angular
    .module('merlin', ['ui.bootstrap'])
    .config(interpolateProvider)
    // move these 2 values out of run section to change them in unit-tests
    // false positive for array constants
    // https://github.com/Gillespie59/eslint-plugin-angular/issues/99
    .value('fieldTemplatesUrl', '/static/merlin/templates/fields/')
    .value('fieldTemplates', [
      'dictionary', 'frozendict', 'list',
      'string', 'text', 'group', 'number', 'choices'
    ])
    .run(runTemplates);

  runTemplates.$inject = ['merlin.templates', 'fieldTemplatesUrl', 'fieldTemplates'];

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
