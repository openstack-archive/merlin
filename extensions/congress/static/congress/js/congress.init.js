(function() {
  'use strict';

  angular.module('congress', ['merlin'])
    //.value('fieldTemplatesUrl', '/static/congress/templates/fields/')
    //.value('fieldTemplates', ['dictionary', 'frozendict', 'list',
    //  'string', 'text', 'group', 'number', 'choices'])
    .run(['merlin.templates', function(templates) {
      templates.prefetch('/static/congress/templates/fields/',
        ['varlist', 'yaqllist']);
    }])
})();