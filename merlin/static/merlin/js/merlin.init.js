/**
 * Created by tsufiev on 2/24/15.
 */
(function() {
  'use strict';

var merlinApp = angular.module('merlin', [])
    .run(['merlin.templates', function(templates) {
      templates.prefetch('/static/merlin/templates/fields/',
        ['dictionary', 'frozendict', 'list', 'string', 'text', 'group', 'number',
          'choices'
        ]
      );
    }])

})();