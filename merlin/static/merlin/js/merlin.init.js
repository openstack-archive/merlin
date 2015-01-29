/**
 * Created by tsufiev on 2/24/15.
 */
(function() {
  angular.module('hz')

    .run(function($http, $templateCache) {
      var fields = ['dictionary', 'frozendict', 'list', 'string',
        'text', 'group', 'number'
      ];
      fields.forEach(function(field) {
        var base = '/static/merlin/templates/fields/';
        $http.get(base + field + '.html').success(function(templateContent) {
          $templateCache.put(field, templateContent);
        });
      })
    })

})();