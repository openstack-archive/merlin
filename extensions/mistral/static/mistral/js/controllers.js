/**
 * Created by tsufiev on 12/29/14.
 */

(function() {

  function isObject(obj) {
    return Object.prototype.toString.call(obj) === '[object Object]'
  }

  function isArray(obj) {
    return Object.prototype.toString.call(obj) === '[object Array]'
  }

  angular.module('hz')

    .controller('workbookCtrl', function($scope) {
      $scope.defaults = {
        'actions': {
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
          input: [],
          output: []
        }
      };
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
        ],
        workflow: [{
          name: 'name',
          type: 'string',
          group: ''
        }, {
          name: 'base',
          type: 'string',  // FIXME
          group: ''
        }, {
          name: 'input',
          type: 'list',
          group: ''
        }, {
          name: 'output',
          type: 'varlist',
          group: ''
        }, {
          name: 'taskDefaults',  // need dict in dict ?
          type: 'varlist',
          group: ''
        }, {
          name: 'tasks',  // ditto ?
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
      };

      $scope.remove = function(parent, item) {
        if ( angular.isString(parent) ) {
          parent = $scope.data[parent];
        }
        var index = parent.indexOf(item);
        parent.splice(index, 1);
        return parent.length;
      };

      $scope.removeKey = function(parent, key) {
        if ( angular.isString(parent) ) {
          parent = $scope.data[parent];
        }
        if ( !angular.isObject(parent) ) {
          return;
        }
        delete parent[key];
        return $scope.getKeys(parent).length;
      };

      $scope.addAutoKey = function(parent) {
        if ( angular.isString(parent) ) {
          parent = $scope.data[parent];
        }
        if ( !angular.isObject(parent) ) {
          return;
        }
        var maxNumber = $scope.getKeys(parent).map(function(key) {
          var match = /[Kk]ey(\d+)/.exec(key);
          if ( match ) {
            return +match[1];
          } else {
            return null;
          }
        }).filter(function(value) {
          return value;
        }).reduce(function(prevValue, curValue) {
          return prevValue > curValue ? prevValue : curValue;
        }, 0),
          newKey = 'key' + (maxNumber+1);
        parent[newKey] = '';
      };

      $scope.add = function(parent, value) {
        var defaultValue, key;
        if ( angular.isString(parent) ) {
          key = parent;
          defaultValue = angular.copy($scope.defaults[key]);
          parent = $scope.data[key];
          defaultValue.id = key + parent.length;
        }
        parent.push(value || defaultValue);
      }

    })

    .controller('actionCtrl', function($scope) {
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
      if ( !isObject($scope.subItem.value) ) {
        $scope.subItem.value = {'Key1': ''};
      }
    })

    .controller('listCtrl', function($scope) {
      if ( !isArray($scope.subItem.value) ) {
        $scope.subItem.value = [''];
      }
    })

    .controller('workflowsCtrl', function() {

    });
})();