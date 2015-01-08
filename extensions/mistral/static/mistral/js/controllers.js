/**
 * Created by tsufiev on 12/29/14.
 */

(function() {
  angular.module('hz')

    .controller('workbookCtrl', function($scope) {
      $scope.data = {
        actions: [{
          id: 'action1',
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
            id: 'varlist1',
            type: 'string',
            value: ''
          }, {
            id: 'varlist2',
            type: 'dictionary',
            value: {
              key1: '',
              key2: ''
            }
          }, {
            id: 'varlist3',
            type: 'list',
            value: ['', '']
          }]
        }
        ]
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
        if ( !str ) {
          return '';
        }
        var firstLetter = str.substr(0, 1).toUpperCase();
        return firstLetter + str.substr(1);
      };

      $scope.getKeys = function(obj) {
        return Object.keys(obj);
      };

      $scope.isAtomic = function(type) {
        return ['string'].indexOf(type) > -1;
      }

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