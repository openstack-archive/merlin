(function() {
  'use strict';

  angular
    .module('hotbuilder')
    .controller('HotbuilderController', HotbuilderController);

  HotbuilderController.$inject = ['$q', '$http'];

  function HotbuilderController($q, $http) {
    var deferred = $q.defer();
    var vm = this;

    deferred.promise.then(function(url) {
      $http.get(url).success(function(data) {
        data.forEach(function(resourceType) {
          $http.get(url + '/' + resourceType).success(function(data) {
            vm.allEntries.push(data);
          });
        });
      });
    });

    vm.setUrl = setUrl;

    vm.allEntries = [];

    vm.entries = [

    ];

    vm.panel = {
      title: function() {
        return 'Add Resource';
      }
    };

    vm.tabs = [
      {title: 'Parameters', content: 'There'},
      {title: 'Outputs', content: 'Where'}
    ];

    vm.group = {
      title: function() { return 'More Resources';}
    };

    function setUrl(url) {
      deferred.resolve(url);
    }
  }

})();
