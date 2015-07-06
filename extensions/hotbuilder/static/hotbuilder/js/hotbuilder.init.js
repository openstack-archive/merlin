(function() {
  'use strict';

  angular
    .module('hotbuilder', ['merlin'])
    .run(initModule);

  initModule.$inject = ['merlin.templates'];

  function initModule(templates) {
    templates.prefetch('/static/hotbuilder/templates/fields/', []);
  }

})();
