
 /*    Copyright (c) 2014 Mirantis, Inc.

    Licensed under the Apache License, Version 2.0 (the "License"); you may
    not use this file except in compliance with the License. You may obtain
    a copy of the License at

         http://www.apache.org/licenses/LICENSE-2.0

    Unless required by applicable law or agreed to in writing, software
    distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
    WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
    License for the specific language governing permissions and limitations
    under the License.
*/
describe('workbook model logic', function() {
  var models, utils, workbook;

  beforeEach(function() {
    module('mistral');
    inject(function($injector) {
      models = $injector.get('mistral.workbook.models');
      utils = $injector.get('merlin.utils');
    });
    workbook = models.Workbook.create();
  });

  function getWorkflow(workflowID) {
    return workbook.get('workflows').getByID(workflowID);
  }

  describe('defines workflow structure transformations:', function() {
    var workflowID = 'workflow1';

    beforeEach(function() {
      workbook.get('workflows').push({name: 'Workflow 1'}, {id: workflowID});
    });

    it("new workflow starts as a 'direct' workflow and has proper structure", function() {
      var workflow = getWorkflow(workflowID);
      expect(workflow.get('type').get()).toEqual('direct');
      expect(workflow.instanceof(models.DirectWorkflow)).toBe(true);
    });

    it("after setting type to 'reverse' the workflow structure changes to the proper one", function() {
      getWorkflow(workflowID).get('type').set('reverse');
      expect(getWorkflow(workflowID).instanceof(models.ReverseWorkflow)).toBe(true);
    });

    it("changing 'reverse' type to 'direct' again causes workflow structure to properly change", function() {
      getWorkflow(workflowID).get('type').set('reverse');
      getWorkflow(workflowID).get('type').set('direct');
      expect(getWorkflow(workflowID).instanceof(models.DirectWorkflow)).toBe(true);
    });
  });

  describe('defines task structure transformations', function() {
    var workflowID = 'workflow1',
      taskID = 'task1';

    function getTask(taskID) {
      return getWorkflow(workflowID).get('tasks').getByID(taskID);
    }

    beforeEach(function() {
      workbook.get('workflows').push({name: 'Workflow 1'}, {id: workflowID});
    });

    describe("which start with the 'direct' workflow:", function() {
      beforeEach(function() {
        var workflow = getWorkflow(workflowID),
          params = workflow._parameters;
        workflow.get('tasks').push({name: 'Task 1'}, utils.extend(params, {id: taskID}));
      });

      it("new task starts as an 'action'-based one and has proper structure", function() {
        expect(getTask(taskID).get('type').get()).toEqual('action');
        expect(getTask(taskID).instanceof(models.ActionTaskMixin)).toBe(true);
      });

      it("changing task type from 'action' to 'workflow' causes proper structure changes", function() {

      });

      it("changing workflow type to 'reverse' causes the proper changes to its tasks", function() {

      });

      it("changing workflow type from 'reverse' to 'direct' causes the proper changes to its tasks", function() {

      });
    });

    describe("which start with the 'reverse' workflow:", function() {
      it("new task starts as an 'action'-based one and has proper structure", function() {

      });

      it("changing task type from 'action' to 'workflow' causes proper structure changes", function() {

      });

      it("changing workflow type to 'direct' causes the proper changes to its tasks", function() {

      });

      it("changing workflow type from 'direct' to 'reverse' causes the proper changes to its tasks", function() {

      });
    });
  });

  describe('defines top-level actions available to user:', function() {
    describe("'Add Action' action adds a new Action", function() {

    });

    describe("'Add Workflow' action adds a new Workflow", function() {

    });
  })
});