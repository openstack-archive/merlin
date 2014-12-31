/**
 * Created by tsufiev on 12/29/14.
 */

(function() {
  angular.module('hz')

    .controller('workbookCtrl', function($scope) {
      $scope.data = {
        actions: [{
          name: 'Action1',
          base: 'nova.create_server',
          baseInput: {
            flavorId: {
              title: 'Flavor Id',
              type: 'string'
            },
            imageId: {
              title: 'Image Id',
              type: 'string'
            }
          },
          input: [''],
          output: [{
              type: 'string',
              value: ''
            }, {
              type: 'dictionary',
              value: {
                key1: '',
                key2: ''
              }
            }, {
              type: 'list',
              value: ['', '']
            }]
        }]
      };

      $scope.schema = {
        action: [{
          name: 'name',
          type: 'string',
          group: 'one'
        }, {
          name: 'base',
          type: 'string',
          group: 'one'
        }, {
          name: 'baseInput',
          type: 'frozendict',
          group: ''
        }, {
          name: 'input',
          type: 'list',
          group: ''
        }, {
          name: 'output',
          type: 'varlist',
          group: ''
        }
        ]
      };

      $scope.makeTitle = function(str) {
        var firstLetter = str.substr(0, 1).toUpperCase();
        return firstLetter + str.substr(1);
      };

      $scope.getKeys = function(obj) {
        return Object.keys(obj);
      };


    })

    .controller('actionCtrl', function($scope) {
      $scope.fixedFields = [['name', 'base']];
      $scope.fields = ['baseInput', 'input', 'output'];

      var actionBase = null,
        baseTypes = {
          'nova.create_server': {
            flavorId: {
              title: 'Flavor Id',
              type: 'string'
            },
            imageId: {
              title: 'Image Id',
              type: 'string'
            }
          }
        };



      //$scope.getBaseInput = function() {
      //  return baseTypes[actionBase] || [];
      //};
      //
      //$scope.updateBase = function(newBase) {
      //  actionBase = newBase;
      //  var values = [];
      //  angular.forEach($scope.getBaseInput(), function(item) {
      //    values.push(item.value || '');
      //  });
      //  $scope.item.baseInput.value = values;
      //}
    })

    .controller('dictionaryCtrl', function($scope) {
      if ( !$scope.item.value ) {
        $scope.item.value = {'Key1': ''};
      }
    })

    .controller('listCtrl', function($scope) {
      if ( !$scope.item.value ) {
        $scope.item.value = [''];
      }
    })

    .controller('workflowsCtrl', function() {

    });
})();