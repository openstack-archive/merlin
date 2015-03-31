/**
 * Created by tsufiev on 2/24/15.
 */
(function() {
  'use strict';

  var mistralApp = angular.module('mistral', ['merlin'])
    .run(function($http, $templateCache) {
      var fields = ['varlist', 'yaqllist'];
      fields.forEach(function(field) {
        var base = '/static/mistral/templates/fields/';
        $http.get(base + field + '.html').success(function(templateContent) {
          $templateCache.put(field, templateContent);
        });
      })
    })

})();