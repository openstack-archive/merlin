/**
 * Created by tsufiev on 2/24/15.
 */
(function() {
  'use strict';

  angular
    .module('mistral')
    .value('baseActionID', 'action')
    .value('baseWorkflowID', 'workflow')
    .controller('WorkbookController', WorkbookController);

  WorkbookController.$inject = ['mistral.workbook.models', '$http',
    '$window', 'baseActionID', 'baseWorkflowID'];

  function WorkbookController(models, $http, $window,
                              baseActionId, baseWorkflowId) {
    var vm = this;
    vm.init = function(id, yaml, commitUrl, discardUrl) {
      vm.workbookID = id;
      vm.commitUrl = commitUrl;
      vm.discardUrl = discardUrl;
      if (angular.isDefined(id)) {
        vm.workbook = models.Workbook.create(jsyaml.safeLoad(yaml));
      } else {
        vm.workbook = models.Workbook.create({name: 'My Workbook'});
      }
      vm.root = models.Root.create();
      vm.root.set('workbook', vm.workbook);

      vm.root.set('standardActions', {
        'nova.create_server': ['image', 'flavor', 'network_id'],
        'neutron.create_network': ['name', 'create_subnet'],
        'glance.create_image': ['image_url']
      });
    };

    // Please see the explanation of how this determinant function works
    // in the 'extractPanels' filter documentation
    vm.keyExtractor = function(item, parent, context) {
      if (item.instanceof(models.Action)) {
        if (angular.isDefined(context)) {
          context.fieldsOrdering = [
            'base', 'base-input', 'input', 'output'];
        }
        return 500 + parent.toArray().indexOf(item);
      } else if (item.instanceof(models.Workflow)) {
        if (angular.isDefined(context)) {
          context.fieldsOrdering = [
            'type', 'input', 'output',
            ['task-defaults', 'on-error', 'on-success', 'on-complete'],
            ['tasks', 'type', 'action', 'workflow', 'description',
              'input', 'publish',
              ['policies', 'wait-before', 'wait-after', 'timeout', 'retry-count',
                'retry-delay', 'retry-break-on'],
              'on-error', 'on-success', 'on-complete']
          ];
        }
        return 1000 + parent.toArray().indexOf(item);
      } else if (item.instanceof(Barricade.Container)) {
        return null;
      } else {
        if (angular.isDefined(context)) {
          context.fieldsOrdering = ['name', 'description', 'version'];
        }
        return 0;
      }
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
      var container = vm.workbook.get(containerName);
      if ( !container ) {
        throw new Error('Base should be either "action" or "workflow"!');
      }
      return getNextIDSuffix(container, regexp);
    }

    vm.addAction = function() {
      var nextSuffix = getWorkbookNextIDSuffix(baseActionId);
      var newID = baseActionId + nextSuffix;
      vm.workbook.get('actions').push(
        {name: 'Action ' + nextSuffix}, {id: newID});
    };

    vm.addWorkflow = function() {
      var nextSuffix = getWorkbookNextIDSuffix(baseWorkflowId);
      var newID = baseWorkflowId + nextSuffix;
      vm.workbook.get('workflows').push(
        {name: 'Workflow ' + nextSuffix}, {id: newID});
    };

    vm.commitWorkbook = function() {
      var data = {
        name: vm.workbook.get('name').get(),
        yaml: vm.workbook.toYAML()
      };

      $http({
        url: vm.commitUrl,
        method: 'POST',
        data: data
      }).success(function() {
        $window.location.href = vm.discardUrl;
      });
    };

    vm.discardWorkbook = function() {
      $window.location.href = vm.discardUrl;
    };

  }
})();
