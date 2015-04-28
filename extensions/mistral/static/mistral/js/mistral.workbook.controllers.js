/**
 * Created by tsufiev on 2/24/15.
 */
(function() {
  'use strict';

  angular.module('mistral')
    .value('baseActionID', 'action')
    .value('baseWorkflowID', 'workflow')
    .controller('workbookCtrl',
    ['$scope', 'mistral.workbook.models', 'baseActionID', 'baseWorkflowID',
      function($scope, models, baseActionId, baseWorkflowId) {
      $scope.workbook = models.Workbook.create({name: 'My Workbook'});

      function getNextIDSuffix(container, regexp) {
        var max = Math.max.apply(Math, container.getIDs().map(function(id) {
          var match = regexp.exec(id);
          return match && +match[2];
        }));
        return max > 0 ? max + 1 : 1;
      }

      function getWorkbookNextIDSuffix(base) {
        var containerName = base + 's',
          regexp = /(workflow|action)([0-9]+)/,
          container = $scope.workbook.get(containerName);
        if ( !container ) {
          throw 'Base should be either "action" or "workflow"!';
        }
        return getNextIDSuffix(container, regexp);
      }

      $scope.addAction = function() {
        var nextSuffix = getWorkbookNextIDSuffix(baseActionId),
          newID = baseActionId + nextSuffix;
        $scope.workbook.get('actions').push(
          {name: 'Action ' + nextSuffix}, {id: newID});
      };

      $scope.addWorkflow = function() {
        var nextSuffix = getWorkbookNextIDSuffix(baseWorkflowId),
          newID = baseWorkflowId + nextSuffix;
        $scope.workbook.get('workflows').push(
          {name: 'Workflow ' + nextSuffix}, {id: newID});
      };

    }])
})();