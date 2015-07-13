/**
 * Created by tsufiev on 2/24/15.
 */
(function() {
  'use strict';

  angular
    .module('mistral')
    .value('baseActionID', 'action')
    .value('baseWorkflowID', 'workflow')
    .controller(WorkbookController);

  WorkbookController.$inject = ['$scope', 'mistral.workbook.models', '$http',
    '$window', 'baseActionID', 'baseWorkflowID'];

  function WorkbookController($scope, models, $http, $window,
                              baseActionId, baseWorkflowId) {
    $scope.init = function(id, yaml, commitUrl, discardUrl) {
      $scope.workbookID = id;
      $scope.commitUrl = commitUrl;
      $scope.discardUrl = discardUrl;
      if (angular.isDefined(id)) {
        $scope.workbook = models.Workbook.create(jsyaml.safeLoad(yaml));
      } else {
        $scope.workbook = models.Workbook.create({name: 'My Workbook'});
      }
      $scope.root = models.Root.create();
      $scope.root.set('workbook', $scope.workbook);

      $scope.root.set('standardActions', {
        'nova.create_server': ['image', 'flavor', 'network_id'],
        'neutron.create_network': ['name', 'create_subnet'],
        'glance.create_image': ['image_url']
      });
    };

    function getNextIDSuffix(container, regexp) {
      var max = Math.max.apply(Math, container.getIDs().map(function(id) {
        var match = regexp.exec(id);
        return match && +match[2];
      }));
      return max > 0 ? max + 1 : 1;
    }

    function getWorkbookNextIDSuffix(base) {
      var containerName = base + 's';
      var regexp = /(workflow|action)([0-9]+)/;
      var container = $scope.workbook.get(containerName);
      if ( !container ) {
        throw new Error('Base should be either "action" or "workflow"!');
      }
      return getNextIDSuffix(container, regexp);
    }

    $scope.addAction = function() {
      var nextSuffix = getWorkbookNextIDSuffix(baseActionId);
      var newID = baseActionId + nextSuffix;
      $scope.workbook.get('actions').push(
        {name: 'Action ' + nextSuffix}, {id: newID});
    };

    $scope.addWorkflow = function() {
      var nextSuffix = getWorkbookNextIDSuffix(baseWorkflowId);
      var newID = baseWorkflowId + nextSuffix;
      $scope.workbook.get('workflows').push(
        {name: 'Workflow ' + nextSuffix}, {id: newID});
    };

    $scope.commitWorkbook = function() {
      var data = {
        name: $scope.workbook.get('name').get(),
        yaml: $scope.workbook.toYAML()
      };

      $http({
        url: $scope.commitUrl,
        method: 'POST',
        data: data
      }).success(function() {
        $window.location.href = $scope.discardUrl;
      });
    };

    $scope.discardWorkbook = function() {
      $window.location.href = $scope.discardUrl;
    };

  }
})();
