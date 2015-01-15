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

    .controller('workbookCtrl', function($scope, workbook) {
      $scope.workbook = workbook;
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
        }],
        workflows: [{
          id: 'workflow1',
          name: 'Workflow1',
          base: '',  // FIXME
          input: [''],
          output: [{
            id: 'varlist1',
            type: 'string',
            value: ''
          }],
          taskDefaults: {
            onError: {
              type: 'list',
              value: ['', '']
            },
            onSuccess: {
              type: 'list',
              value: ['']
            },
            onComplete: {
              type: 'list',
              value: ['', '']
            }
          }
        }]
      };

      $scope.schema = {
        name: {
          type: 'string',
          index: 0,
          panelIndex: 0,
          row: 0
        },
        description: {
          type: 'text',
          index: 1,
          panelIndex: 0,
          row: 0
        },
        actions: {
          index: 2,
          type: 'panel',
          multiple: true,
          value: {
            name: {
              type: 'string',
              row: 0,
              index: 0
            },
            base: {
              type: 'string',
              row: 0,
              index: 1
            },
            baseInput: {
              type: 'frozendict',
              title: 'Base Input',
              index: 2
            },
            input: {
              type: 'list',
              index: 3
            },
            output: {
              type: 'varlist',
              index: 4
            }
          }
        },
        workflows: {
          index: 3,
          type: 'panel',
          multiple: true,
          value: {
            name: {
              type: 'string',
              index: 0,
              row: 0
            },
            base: {
              type: 'string',
              index: 1,
              row: 0
            },
            input: {
              type: 'list',
              index: 2
            },
            output: {
              type: 'varlist',
              index: 3
            },
            taskDefaults: {
              type: 'group',
              title: 'Task defaults',
              index: 4,
              value: {
                onError: {
                  type: 'yaqllist',
                  title: 'On error',
                  index: 0
                },
                onSuccess: {
                  type: 'yaqllist',
                  title: 'On success',
                  index: 1
                },
                onComplete: {
                  type: 'yaqllist',
                  title: 'On complete',
                  index: 2
                }
              }
            },
            tasks: {
              type: 'group',
              index: 5,
              value: {
                task: {
                  type: 'group',
                  multiple: true,
                  index: 0,
                  value: {
                    name: {
                      type: 'string',
                      index: 0,
                      row: 0
                    },
                    type: {
                      type: 'string',
                      index: 1,
                      row: 0
                    },
                    action: {
                      type: 'string',
                      index: 2
                    },
                    input: {
                      type: 'dictionary',
                      index: 3
                    },
                    publish: {
                      type: 'dictionary',
                      index: 4
                    },
                    onError: {
                      type: 'yaqllist',
                      title: 'On error',
                      index: 5
                    },
                    onSuccess: {
                      type: 'yaqllist',
                      title: 'On success',
                      index: 6
                    },
                    onComplete: {
                      type: 'yaqllist',
                      title: 'On complete',
                      index: 7
                    },
                    policies: {
                      type: 'group',
                      index: 8,
                      value: {
                        waitBefore: {
                          type: 'string',
                          title: 'Wait before',
                          index: 0,
                          row: 0
                        },
                        waitAfter: {
                          type: 'string',
                          title: 'Wait after',
                          index: 1,
                          row: 0
                        },
                        timeout: {
                          type: 'string',
                          index: 2,
                          row: 1
                        },
                        retryCount: {
                          type: 'string',
                          title: 'Retry count',
                          index: 3,
                          row: 2
                        },
                        retryDelay: {
                          type: 'string',
                          title: 'Retry delay',
                          index: 4,
                          row: 2
                        },
                        retryBreakOn: {
                          type: 'string',
                          title: 'Retry break on',
                          index: 5,
                          row: 3
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
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
        return ['string', 'text'].indexOf(type) > -1;
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