/**
 * Created by tsufiev on 2/24/15.
 */
(function() {
  angular.module('hz')

    .run(['merlin.templates', function(templates) {
      templates.prefetch('/static/merlin/templates/fields/',
        ['dictionary', 'frozendict', 'list', 'string', 'text', 'group', 'number',
          'choices'
        ]
      );
    }])

})();