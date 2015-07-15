
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
    // once workflow is recreated with JSON, old instance is no longer
    // valid, thus we need to get it this way
    return workbook.get('workflows').getByID(workflowID);
  }

  describe('defines the standard actions getter for Action->Base field:', function() {
    var root, action1;

    beforeEach(function() {
      root = models.Root.create();
      root.set('workbook', workbook);
      root.set('standardActions', {
        'nova.create_server': ['image', 'flavor', 'network_id'],
        'neutron.create_network': ['name', 'create_subnet'],
        'glance.create_image': ['image_url']
      });
      workbook.get('actions').add('action1');
      action1 = workbook.get('actions').getByID('action1');
    });

    it('all actions are present as choices for the Base field', function() {
      var availableActions = action1.get('base').getValues();

      expect(availableActions).toEqual([
        'nova.create_server', 'neutron.create_network', 'glance.create_image']);
    });

    it("'Base Input' field is set to have keys corresponding to 'Base' field value", function() {
      action1.get('base').set('nova.create_server');
      expect(action1.get('base-input').getIDs()).toEqual(['image', 'flavor', 'network_id']);

      action1.get('base').set('neutron.create_network');
      expect(action1.get('base-input').getIDs()).toEqual(['name', 'create_subnet']);
    });
  });

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
      // once task is recreated with JSON, old instance is no longer
      // valid, thus we need to get it this way
      return getWorkflow(workflowID).get('tasks').getByID(taskID);
    }

    beforeEach(function() {
      workbook.get('workflows').add(workflowID);
    });

    describe('', function() {
      beforeEach(function() {
        var workflow = getWorkflow(workflowID),
          params = workflow._parameters;
        workflow.get('tasks').push({name: 'Task 1'}, utils.extend(params, {id: taskID}));
      });

      it("corresponding JSON has the right key for the Task", function() {
        var json = workbook.toJSON({pretty: true});

        expect(json.workflows[workflowID].tasks[taskID]).toBeDefined();
      });

      it("once the task ID is changed, it's reflected in JSON", function() {
        var newID = 'task10',
          json;

        getTask(taskID).setID(newID);
        json = workbook.toJSON({pretty: true});

        expect(json.workflows[workflowID].tasks[taskID]).toBeUndefined();
        expect(json.workflows[workflowID].tasks[newID]).toBeDefined();
      });

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
        expect(getTask(taskID).instanceof(models.DirectWFTask)).toBe(true);
      });

      it("'action'-based task offers available custom actions for its Action field", function() {
        workbook.get('actions').add('action1');
        expect(getTask(taskID).get('action').getValues()).toEqual(['action1']);

        workbook.get('actions').add('action2');
        expect(getTask(taskID).get('action').getValues()).toEqual(['action1', 'action2']);
      });

      describe("changing task type from 'action' to 'workflow' causes", function() {
        beforeEach(function() {
          getTask(taskID).get('type').set('workflow');
        });

        it('proper structure changes', function() {
          expect(getTask(taskID).instanceof(models.WorkflowTaskMixin)).toBe(true);
          expect(getTask(taskID).instanceof(models.DirectWFTask)).toBe(true);
        });

        it('and causes the Workflow field to suggest available workflows as choices', function() {
          expect(getTask(taskID).get('workflow').getValues()).toEqual(['workflow1']);

          workbook.get('workflows').add('workflow2');
          expect(getTask(taskID).get('workflow').getValues()).toEqual([workflowID, 'workflow2']);
        });
      });

      it("changing workflow type to 'reverse' causes the proper changes to its tasks", function() {
        getWorkflow(workflowID).get('type').set('reverse');

        expect(getTask(taskID).instanceof(models.ActionTaskMixin)).toBe(true);
        expect(getTask(taskID).instanceof(models.ReverseWFTask)).toBe(true);

        getTask(taskID).get('type').set('workflow');

        expect(getTask(taskID).instanceof(models.WorkflowTaskMixin)).toBe(true);
        expect(getTask(taskID).instanceof(models.ReverseWFTask)).toBe(true);
      });

      it("changing workflow type from 'reverse' to 'direct' causes the proper changes to its tasks", function() {
        getWorkflow(workflowID).get('type').set('reverse');
        getWorkflow(workflowID).get('type').set('direct');

        expect(getTask(taskID).instanceof(models.ActionTaskMixin)).toBe(true);
        expect(getTask(taskID).instanceof(models.DirectWFTask)).toBe(true);

        getTask(taskID).get('type').set('workflow');

        expect(getTask(taskID).instanceof(models.WorkflowTaskMixin)).toBe(true);
        expect(getTask(taskID).instanceof(models.DirectWFTask)).toBe(true);
      });
    });

    describe("which start with the 'reverse' workflow:", function() {
      beforeEach(function() {
        var workflow;
        getWorkflow(workflowID).get('type').set('reverse');
        workflow = getWorkflow(workflowID);
        workflow.get('tasks').push(
          {name: 'Task 1'}, utils.extend(workflow._parameters, {id: taskID}));
      });

      it("new task starts as an 'action'-based one and has proper structure", function() {
        expect(getTask(taskID).get('type').get()).toEqual('action');
        expect(getTask(taskID).instanceof(models.ActionTaskMixin)).toBe(true);
        expect(getTask(taskID).instanceof(models.ReverseWFTask)).toBe(true);
      });

      it("'action'-based task offers available custom actions for its Action field", function() {
        workbook.get('actions').add('action1');
        expect(getTask(taskID).get('action').getValues()).toEqual(['action1']);

        workbook.get('actions').add('action2');
        expect(getTask(taskID).get('action').getValues()).toEqual(['action1', 'action2']);
      });

      describe("changing task type from 'action' to 'workflow' causes", function() {
        beforeEach(function() {
          getTask(taskID).get('type').set('workflow');
        });

        it('proper structure changes', function() {
          expect(getTask(taskID).instanceof(models.WorkflowTaskMixin)).toBe(true);
          expect(getTask(taskID).instanceof(models.ReverseWFTask)).toBe(true);
        });

        it('and causes the Workflow field to suggest available workflows as choices', function() {
          expect(getTask(taskID).get('workflow').getValues()).toEqual(['workflow1']);

          workbook.get('workflows').add('workflow2');
          expect(getTask(taskID).get('workflow').getValues()).toEqual([workflowID, 'workflow2']);
        });
      });

      it("changing workflow type to 'direct' causes the proper changes to its tasks", function() {
        getWorkflow(workflowID).get('type').set('direct');

        expect(getTask(taskID).instanceof(models.ActionTaskMixin)).toBe(true);
        expect(getTask(taskID).instanceof(models.DirectWFTask)).toBe(true);

        getTask(taskID).get('type').set('workflow');

        expect(getTask(taskID).instanceof(models.WorkflowTaskMixin)).toBe(true);
        expect(getTask(taskID).instanceof(models.DirectWFTask)).toBe(true);
      });

      it("changing workflow type from 'direct' to 'reverse' causes the proper changes to its tasks", function() {
        getWorkflow(workflowID).get('type').set('direct');
        getWorkflow(workflowID).get('type').set('reverse');

        expect(getTask(taskID).instanceof(models.ActionTaskMixin)).toBe(true);
        expect(getTask(taskID).instanceof(models.ReverseWFTask)).toBe(true);

        getTask(taskID).get('type').set('workflow');

        expect(getTask(taskID).instanceof(models.WorkflowTaskMixin)).toBe(true);
        expect(getTask(taskID).instanceof(models.ReverseWFTask)).toBe(true);
      });
    });
  });

});
