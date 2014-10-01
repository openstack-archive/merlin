
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

 var types = {
     Mistral: {},
     base: {},
     OpenStack: {
         // TODO: obtain list of predefined OpenStack actions from Mistral server-side
         // for now a stubbed list of predefined actions suffices
         actions: ['createInstance', 'terminateInstance']
     },
     getOpenStackActions: function() {
         return this.OpenStack.actions.slice();
     }
 };

 types.base.AcceptsMixin = Barricade.Blueprint.create(function (acceptsList) {
     acceptsList = acceptsList || [];

     this.getLabels = function() {
         return acceptsList.map(function(item) {
             return item.label;
         })
     };

     this.getValue = function(label) {
         for ( var i = 0; i < acceptsList.length; i++ ) {
             if ( acceptsList[i].label === label ) {
                 return acceptsList[i].value;
             }
         }
         return null;
     }
 });

 types.Mistral.Action =  Barricade.create({
     '@type': Object,

     'name': {'@type': String},
     'base': {
         '@type': String,
         '@enum': function() {
             var predefinedActions = types.getOpenStackActions(),
                 actions = workbook.get('actions'),
                 currentItemIndex = actions.length() - 1;
             actions.each(function(index, actionItem) {
                 var name = actionItem.get('name');
                 if ( index < currentItemIndex && !name.isEmpty() ) {
                     predefinedActions = predefinedActions.concat(name.get())
                 }
             });
             return predefinedActions;
         },
         '@default': types.getOpenStackActions()[0]
     },
     'base-parameters': {
         '@type': Object,
         '@required': false,
         '?': {'@type': String}
     }
 });

 types.Mistral.Policy = Barricade.create({
     '@type': Object,

     'wait-before': {
         '@type': Number,
         '@required': false
     },
     'wait-after': {
         '@type': Number,
         '@required': false
     },
     'retry': {
         '@type': Object,
         '@required': false,
         'count': {'@type': Number},
         'delay': {'@type': Number},
         'break-on': {
             '@type': String,
             '@required': false
         }
     }
 });

 types.Mistral.Task = Barricade.create({
     '@type': Object,

     'name': {'@type': String},
     'parameters': {
         '@type': Array,
         '*': {
             '@class': Barricade.Primitive.extend({
                 'name': 'Parameter'
             }, {
                 '@type': String
             })
         }
     },
     'publish': {
         '@type': String,
         '@required': false
     },
     'policies': {
         '@class': types.Mistral.Policy,
         '@required': false
     }
 });

 types.Mistral.Tasks = Barricade.MutableObject.extend({
     create: function(json, parameters) {
         var self = Barricade.MutableObject.create.call(this);

         function getParentWorkflowType() {
             var container = self._container,
                 workflow;
             while ( container ) {
                 if ( container.instanceof(types.Mistral.Workflow) ) {
                     workflow = container;
                     break;
                 }
                 container = container._container;
             }
             return workflow && workflow.get('type').get();
         }

         var directSpecificData = {
                 'on-complete': {
                     '@type': String,
                     '@required': false
                 },
                 'on-success': {
                     '@type': String,
                     '@required': false
                 },
                 'on-error': {
                     '@type': String,
                     '@required': false
                 }
             },
             reverseSpecificData = {
                 'requires': {
                     '@type': Array,
                     '*': {
                         '@type': String,
                         '@meta': {'name': 'Task'},
                         '@enum': function() {
                             var container = this._container,
                                 workflow, task;
                             while ( container ) {
                                 if ( container.instanceof(types.Mistral.Task) ) {
                                     task = container;
                                 }
                                 if ( container.instanceof(types.Mistral.Workflow) ) {
                                     workflow = container;
                                     break;
                                 }
                                 container = container._container;
                             }
                             if ( workflow && task ) {
                                 return workflow.get('tasks').toArray().filter(function(taskItem) {
                                     return !(taskItem === task) && taskItem.get('name').get();
                                 }).map(function(taskItem) {
                                     return taskItem.get('name').get();
                                 });
                             } else {
                                 return [];
                             }
                         }
                     }
                 }
             };

         types.base.AcceptsMixin.call(self, [
             {
                 label: 'Action-based',
                 value: function() {
                     var workflowType = getParentWorkflowType();
                     if ( workflowType === 'direct' ) {
                         return types.Mistral.ActionTask.extend({}, directSpecificData);
                     } else if ( workflowType === 'reverse' ) {
                         return types.Mistral.ActionTask.extend({}, reverseSpecificData);
                     } else {
                         return types.Mistral.ActionTask;
                     }
                 }
             }, {
                 label: 'Workflow-based',
                 value: function() {
                     var workflowType = getParentWorkflowType();
                     if ( workflowType === 'direct' ) {
                         return types.Mistral.WorkflowTask.extend({}, directSpecificData);
                     } else if ( workflowType === 'reverse' ) {
                         return types.Mistral.WorkflowTask.extend({}, reverseSpecificData);
                     } else {
                         return types.Mistral.WorkflowTask;
                     }
                 }
             }
         ]);
         return self;
     }
 }, {
     '@type': Object,
     '?': {'@class': types.Mistral.Task}
 });

 types.Mistral.WorkflowTask = types.Mistral.Task.extend({},
     {
         'workflow': {
             '@type': String,
             '@enum': function() {
                 var workflows = workbook.get('workflows').toArray();
                 return workflows.map(function(workflowItem) {
                     return workflowItem.get('name').get();
                 }).filter(function (name) {
                     return name;
                 });
             }
         }
     });

 types.Mistral.ActionTask = types.Mistral.Task.extend({},
     {
         'action': {
             '@type': String,
             '@enum': function() {
                 var predefinedActions = types.getOpenStackActions(),
                     actions = workbook.get('actions').toArray();
                 return predefinedActions.concat(actions.map(function(actionItem) {
                     return actionItem.get('name').get();
                 }).filter(function(name) {
                     return name; }
                 ));
             }
         }
     });

 types.Mistral.Workflow = Barricade.create({
     '@type': Object,

     'name': {'@type': String},
     'type': {
         '@type': String,
         '@enum': ['reverse', 'direct'],
         '@default': 'direct'
     },
     'parameters': {
         '@type': Array,
         '@required': false,
         '*': {
             '@class': Barricade.Primitive.extend({
                 'name': 'Primitive'
             }, {
                 '@type': String
             })
         }
     },
     'output': {
         '@type': String,
         '@required': false
     },
     'tasks': {
         '@class': types.Mistral.Tasks
     }

 });

 types.Mistral.Workbook = Barricade.create({
     '@type': Object,

     'version': {
         '@type': Number,
         '@default': 2
     },
     'description': {
         '@type': String,
         '@required': false
     },
     'actions': {
         '@type': Object,
         '@required': false,
         '?': {
             '@class': types.Mistral.Action
         }
     },
     'workflows': {
         '@type': Object,
         '?': {
             '@class': types.Mistral.Workflow
         }
     }
 });
