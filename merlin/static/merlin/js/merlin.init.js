/**
 * Created by tsufiev on 2/24/15.
 */
(function() {
  'use strict';

  var merlinApp = angular.module('merlin', [])
    .run(function($http, $templateCache) {
      var fields = ['dictionary', 'frozendict', 'list', 'string',
        'text', 'group', 'number', 'choices'
      ];
      fields.forEach(function(field) {
        var base = '/static/merlin/templates/fields/';
        $http.get(base + field + '.html').success(function(templateContent) {
          $templateCache.put(field, templateContent);
        });
      })
    })

})();