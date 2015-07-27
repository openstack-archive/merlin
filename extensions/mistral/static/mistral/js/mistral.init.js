/**
 * Created by tsufiev on 2/24/15.
 */
(function() {
  'use strict';

  angular
    .module('mistral', ['merlin'])
    .run(initModule);

  initModule.$inject = ['merlin.templates', 'webroot'];

  function initModule(templates, webroot) {
    templates.prefetch(webroot + '/static/mistral/templates/fields/',
      ['yaqlfield']);
  }

})();
