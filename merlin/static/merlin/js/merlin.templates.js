(function() {
  angular.module('merlin')
    .factory('merlin.templates', [
      '$http', '$q', function($http, $q) {
        var promises = {};

        function prefetch(baseUrl, fields) {
          fields.forEach(function(field) {
            var deferred = $q.defer();
            $http.get(baseUrl + field + '.html').success(function(templateContent) {
              deferred.resolve(templateContent);
            }).error(function(data) {
              deferred.reject(data);
            });
            promises[field] = deferred.promise;
          });
        }

        function templateReady(field) {
          return promises[field];
        }

        return {
          prefetch: prefetch,
          templateReady: templateReady
        };
      }])
})();