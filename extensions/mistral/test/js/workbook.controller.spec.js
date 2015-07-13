
/*    Copyright (c) 2015 Mirantis, Inc.

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
describe('together workbook model and controller', function() {
  var models, utils, workbook;

  beforeEach(function () {
    module('mistral');
    inject(function ($injector) {
      models = $injector.get('mistral.workbook.models');
      utils = $injector.get('merlin.utils');
    });
    workbook = models.Workbook.create();
  });


  describe('define top-level actions available to user:', function () {
    var wbCtrl;

    beforeEach(inject(function (_$controller_) {
      wbCtrl = _$controller_('WorkbookController', {});
      wbCtrl.workbook = workbook;
    }));

    describe("'Add Action' action", function () {
      it('adds a new Action', function () {
        wbCtrl.addAction();

        expect(workbook.get('actions').get(0)).toBeDefined();
      });

      it('creates action with predefined name', function () {
        wbCtrl.addAction();

        expect(workbook.get('actions').get(0).getID()).toBeGreaterThan('');
      });

      describe('', function () {
        var actionID;
        beforeEach(inject(function (baseActionID) {
          actionID = baseActionID + '1';
        }));

        it("corresponding JSON has the right key for the Action", function () {
          wbCtrl.addAction();

          expect(workbook.toJSON({pretty: true}).actions[actionID]).toBeDefined();
        });

        it("once the Action ID is changed, it's reflected in JSON", function () {
          var newID = 'action10';

          wbCtrl.addAction();
          workbook.get('actions').getByID(actionID).setID(newID);

          expect(workbook.toJSON({pretty: true}).actions[actionID]).toBeUndefined();
          expect(workbook.toJSON({pretty: true}).actions[newID]).toBeDefined();
        });

      });

      it('creates actions with different names on 2 successive calls', function () {
        wbCtrl.addAction();
        wbCtrl.addAction();

        expect(workbook.get('actions').get(0).getID()).not.toEqual(
          workbook.get('actions').get(1).getID())
      });
    });

    describe("'Add Workflow' action", function () {
      it('adds a new Workflow', function () {
        wbCtrl.addWorkflow();

        expect(workbook.get('workflows').get(0)).toBeDefined();
      });

      describe('', function () {
        var workflowID;
        beforeEach(inject(function (baseWorkflowID) {
          workflowID = baseWorkflowID + '1';
        }));

        it("corresponding JSON has the right key for the Workflow", function () {
          wbCtrl.addWorkflow();

          expect(workbook.toJSON({pretty: true}).workflows[workflowID]).toBeDefined();
        });

        it("once the workflow ID is changed, it's reflected in JSON", function () {
          var newID = 'workflow10';

          wbCtrl.addWorkflow();
          workbook.get('workflows').getByID(workflowID).setID(newID);

          expect(workbook.toJSON({pretty: true}).workflows[workflowID]).toBeUndefined();
          expect(workbook.toJSON({pretty: true}).workflows[newID]).toBeDefined();
        });

      });

      it('creates workflow with predefined name', function () {
        wbCtrl.addWorkflow();

        expect(workbook.get('workflows').get(0).getID()).toBeGreaterThan('');
      });

      it('creates workflows with different names on 2 successive calls', function () {
        wbCtrl.addWorkflow();
        wbCtrl.addWorkflow();

        expect(workbook.get('workflows').get(0).getID()).not.toEqual(
          workbook.get('workflows').get(1).getID())
      });

    });

    describe("'Create'/'Modify'/'Cancel' actions", function () {
      it('edit causes a request to an api and a return to main page', function () {

      });

      it('cancel causes just a return to main page', function () {

      });
    });

  })
});