(function() {
  'use strict';

  angular.module('congress', ['merlin'])
    .run(['merlin.templates', function(templates) {
      templates.prefetch('/static/congress/templates/fields/',
        ['varlist', 'yaqllist']);
    }])
})();
