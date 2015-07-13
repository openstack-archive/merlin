/**
 * Created by tsufiev on 2/24/15.
 */
(function() {
  'use strict';

  angular
    .module('mistral', ['merlin'])
    .run(initModule);

  initModule.$inject = ['merlin.templates'];

  function initModule(templates) {
    templates.prefetch('/static/mistral/templates/fields/',
      ['varlist', 'yaqllist']);
  }

})();
