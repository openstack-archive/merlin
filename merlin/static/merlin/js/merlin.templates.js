(function() {
  angular
    .module('merlin')
    .factory('merlin.templates', merlinTemplates);

  merlinTemplates.$inject = ['$http', '$q'];

  function merlinTemplates($http, $q) {
    var promises = {};

    function makeEmptyPromise() {
      var deferred = $q.defer();
      deferred.reject();
      return deferred.promise;
    }

    function prefetch(baseUrl, fields) {
      if ( !angular.isArray(fields) ) {
        fields = [fields];
      }
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
      return promises[field] || makeEmptyPromise();
    }

    return {
      prefetch: prefetch,
      templateReady: templateReady
    };
  }
})();
