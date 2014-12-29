/**
 * Created by tsufiev on 12/29/14.
 */

(function() {
  angular.module('hz')

    .controller('actionsCtrl', function($scope) {
      $scope.actions = [
        [{
          name: 'Name',
          type: 'string',
          value: 'Action1'
        }, {
          name: 'Base',
          type: 'string',
          value: 'nova.create_server'
        }, {
          name: 'Base Input',
          type: 'fixedlist'
        }, {
          name: 'Input',
          type: 'list',
          value: [{
            type: 'string',
            value: ''
          }]
        }, {
          name: 'Output',
          type: 'varlist',
          value: [{
            type: 'string',
            value: ''
          }, {
            type: 'dictionary',
            value: [{
              name: 'key1',
              type: 'string',
              value: ''
            }, {
              name: 'key2',
              type: 'string',
              value: ''
            }]
          }, {
            type: 'list',
            value: [{
              type: 'string',
              value: ''
            }, {
              type: 'string',
              value: ''
            }]
          }]
        }]];

      $scope.baseTypes = {
        'nova.create_server': [{
          name: 'Flavor Id',
          type: 'string'
        }, {
          name: 'Image Id',
          type: 'string'
        }]
      }
    })

    .controller('workflowsCtrl', function() {

    });
})();