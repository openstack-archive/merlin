(function() {
  'use strict';

  angular.module('congress')
    .controller('policyCtrl',
    ['$scope', 'congress.policy.models',
      function($scope, models) {
        $scope.policyID = "TEST_TEST";
        $scope.init = function(id) {
          $scope.policyID = "TEST_TEST"; //id;
          $scope.rule = models.Rule.create();
          //$scope.policy = models.Policy.create({name: 'New Policy'});
        };

      }])
})();