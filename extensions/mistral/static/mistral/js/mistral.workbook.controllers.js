/**
 * Created by tsufiev on 2/24/15.
 */
(function() {
  angular.module('hz')

    .controller('workbookCtrl',
    ['$scope', 'mistral.workbook.models', function($scope, models) {
      var workbook = models.Workbook.create();
      $scope.workbook = workbook;

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
          container = workbook.get(containerName);
        if ( !container ) {
          throw 'Base should be either "action" or "workflow"!';
        }
        return getNextIDSuffix(container, regexp);
      }

      var baseActionId = 'action', baseWorkflowId = 'workflow';

      $scope.addAction = function() {
        var nextSuffix = getWorkbookNextIDSuffix(baseActionId),
          newID = baseActionId + nextSuffix;
        workbook.get('actions').push({name: 'Action ' + nextSuffix}, {id: newID});
        workbook.addPanel(workbook.get('actions'), newID, workbook.get('actions').length());
      };

      $scope.addWorkflow = function() {
        var nextSuffix = getWorkbookNextIDSuffix(baseWorkflowId),
          newID = baseWorkflowId + nextSuffix;
        workbook.get('workflows').push({name: 'Workflow ' + nextSuffix}, {id: newID});
        workbook.addPanel(workbook.get('workflows'), newID);
      };

    }])
})();