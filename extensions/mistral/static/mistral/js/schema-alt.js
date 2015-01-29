
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

(function() {
  angular.module('hz')

    .factory('workbook', function() {
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
        },
        _id_counter = 0;

      function getNewId() {
        _id_counter++;
        return 'id-' + _id_counter;
      }

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

        'name': {
          '@type': String,
          '@meta': {
            'index': 0,
            'row': 0
          }
        },
        'base': {
          '@type': String,
          '@meta': {
            'index': 1,
            'row': 0
          }
        },
        'baseInput': {
          '@type': Object,
          '@required': false,
          '@meta': {
            'index': 2,
            'title': 'Base Input'
          },
          '?': {'@type': String}
        },
        'input': {
          '@type': Array,
          '@meta': {
            'index': 3
          },
          '*': {'@type': String}
        },
        'output': {
          '@type': Array,
          '@meta': {
            'index': 4
          },
          '*': {'@type': String}
        }
      });

      types.Mistral.Task = Barricade.create({
        '@type': Object,

        'name': {
          '@type': String,
          '@meta': {
            'index': 0,
            'row': 0
          }
        },
        'type': {
          '@type': String,
          '@enum': ['Action-based', 'Workflow-based'],
          '@meta': {
            'index': 1,
            'row': 0
          }
        },
        'action': {
          '@type': String,
          '@meta': {
            'index': 2
          }
        },
        'input': {
          '@type': Object,
          '@meta': {
            'index': 3
          },
          '?': {
            '@type': String
          }
        },
        'publish': {
          '@type': Object,
          '@meta': {
            'index': 4
          },
          '?': {
            '@type': String
          }
        },
        'onError': {
          '@type': Array,
          '@meta': {
            'title': 'On error',
            'index': 5
          },
          '*': {
            '@type': String
          }
        },
        'onSuccess': {
          '@type': Array,
          '@meta': {
            'title': 'On success',
            'index': 6
          },
          '*': {
            '@type': String
          }
        },
        'onComplete': {
          '@type': Array,
          '@meta': {
            'title': 'On complete',
            'index': 7
          },
          '*': {
            '@type': String
          }
        },
        'policies': {
          '@type': Object,
          '@meta': {
            'index': 8
          },
          '@required': false,
          'waitBefore': {
            '@type': Number,
            '@required': false,
            '@meta': {
              'index': 0,
              'row': 0,
              'title': 'Wait before'
            }
          },
          'waitAfter': {
            '@type': Number,
            '@required': false,
            '@meta': {
              'index': 1,
              'row': 0,
              'title': 'Wait after'
            }
          },
          'timeout': {
            '@type': Number,
            '@required': false,
            '@meta': {
              'index': 2,
              'row': 1
            }
          },
          'retryCount': {
            '@type': Number,
            '@required': false,
            '@meta': {
              'index': 3,
              'row': 2,
              'title': 'Retry count'
            }
          },
          'retryDelay': {
            '@type': Number,
            '@required': false,
            '@meta': {
              'index': 4,
              'row': 2,
              'title': 'Retry delay'
            }
          },
          'retryBreakOn': {
            '@type': Number,
            '@required': false,
            '@meta': {
              'index': 5,
              'row': 3,
              'title': 'Retry break on'
            }
          }
        }
      });

//types.Mistral.Task = Barricade.create({
//  '@type': Object,
//
//  'name': {'@type': String},
//  'input': {
//    '@type': Array,
//    '*': {
//      '@class': Barricade.Primitive.extend({
//        'name': 'Parameter'
//      }, {
//        '@type': String
//      })
//    }
//  },
//  'publish': {
//    '@type': String,
//    '@required': false
//  },
//  'policies': {
//    '@class': types.Mistral.Policy,
//    '@required': false
//  }
//});
//
//types.Mistral.Tasks = Barricade.MutableObject.extend({
//  create: function(json, parameters) {
//    var self = Barricade.MutableObject.create.call(this);
//
//    function getParentWorkflowType() {
//      var container = self._container,
//        workflow;
//      while ( container ) {
//        if ( container.instanceof(types.Mistral.Workflow) ) {
//          workflow = container;
//          break;
//        }
//        container = container._container;
//      }
//      return workflow && workflow.get('type').get();
//    }
//
//    var directSpecificData = {
//        'on-complete': {
//          '@type': String,
//          '@required': false
//        },
//        'on-success': {
//          '@type': String,
//          '@required': false
//        },
//        'on-error': {
//          '@type': String,
//          '@required': false
//        }
//      },
//      reverseSpecificData = {
//        'requires': {
//          '@type': Array,
//          '*': {
//            '@class': Barricade.Primitive.extend({
//              'name': 'Action'
//            }, {
//              '@type': String,
//              '@enum': function() {
//                var container = this._container,
//                  workflow, task;
//                while ( container ) {
//                  if ( container.instanceof(types.Mistral.Task) ) {
//                    task = container;
//                  }
//                  if ( container.instanceof(types.Mistral.Workflow) ) {
//                    workflow = container;
//                    break;
//                  }
//                  container = container._container;
//                }
//                if ( workflow && task ) {
//                  return workflow.get('tasks').toArray().filter(function(taskItem) {
//                    return !(taskItem === task) && taskItem.get('name').get();
//                  }).map(function(taskItem) {
//                    return taskItem.get('name').get();
//                  });
//                } else {
//                  return [];
//                }
//              }
//            })
//          }
//        }
//      };
//
//    types.base.AcceptsMixin.call(self, [
//      {
//        label: 'Action-based',
//        value: function() {
//          var workflowType = getParentWorkflowType();
//          if ( workflowType === 'direct' ) {
//            return types.Mistral.ActionTask.extend({}, directSpecificData);
//          } else if ( workflowType === 'reverse' ) {
//            return types.Mistral.ActionTask.extend({}, reverseSpecificData);
//          } else {
//            return types.Mistral.ActionTask;
//          }
//        }
//      }, {
//        label: 'Workflow-based',
//        value: function() {
//          var workflowType = getParentWorkflowType();
//          if ( workflowType === 'direct' ) {
//            return types.Mistral.WorkflowTask.extend({}, directSpecificData);
//          } else if ( workflowType === 'reverse' ) {
//            return types.Mistral.WorkflowTask.extend({}, reverseSpecificData);
//          } else {
//            return types.Mistral.WorkflowTask;
//          }
//        }
//      }
//    ]);
//    return self;
//  }
//}, {
//  '@type': Object,
//  '?': {'@class': types.Mistral.Task}
//});
//
//types.Mistral.WorkflowTask = types.Mistral.Task.extend({},
//  {
//    'workflow': {
//      '@type': String,
//      '@enum': function() {
//        var workflows = workbook.get('workflows').toArray();
//        return workflows.map(function(workflowItem) {
//          return workflowItem.get('name').get();
//        }).filter(function (name) {
//          return name;
//        });
//      }
//    }
//  });
//
//types.Mistral.ActionTask = types.Mistral.Task.extend({},
//  {
//    'action': {
//      '@type': String,
//      '@enum': function() {
//        var predefinedActions = types.getOpenStackActions(),
//          actions = workbook.get('actions').toArray();
//        return predefinedActions.concat(actions.map(function(actionItem) {
//          return actionItem.get('name').get();
//        }).filter(function(name) {
//            return name; }
//        ));
//      }
//    }
//  });

      types.Mistral.Workflow = Barricade.create({
        '@type': Object,

        'name': {
          '@type': String,
          '@meta': {
            'index': 0,
            'row': 0
          }
        },
        'type': {
          '@type': String,
          '@enum': ['reverse', 'direct'],
          '@default': 'direct',
          '@meta': {
            'index': 1,
            'row': 0
          }
        },
        'input': {
          '@type': Array,
          '@required': false,
          '@meta': {
            'index': 2
          },
          '*': {
            '@type': String
          }
        },
        'output': {
          '@type': Array,
          '@required': false,
          '@meta': {
            'index': 3
          },
          '*': {
            '@type': String
          }
        },
        'taskDefaults': {
          '@type': Object,
          '@required': false,
          '@meta': {
            'index': 4,
            'group': true
          },
          'onError': {
            '@type': Array,
            '@meta': {
              'title': 'On error',
              'index': 0
            },
            '*': {
              '@type': String
            }
          },
          'onSuccess': {
            '@type': Array,
            '@meta': {
              'title': 'On success',
              'index': 1
            },
            '*': {
              '@type': String
            }
          },
          'onComplete': {
            '@type': Array,
            '@meta': {
              'title': 'On complete',
              'index': 2
            },
            '*': {
              '@type': String
            }
          }
        },
        'tasks': {
          '@type': Object,
          '@meta': {
            'index': 5
          },
          '?': {
            'class': types.Mistral.Task
          }
        }

      });

      Array.prototype.condense = function() {
        return this.filter(function(el) {
          return el !== undefined && el != null;
        });
      };

      function groupByMetaKey(sequence, metaKey, insertAtBeginning) {
        var newSequence = [], defaultBucket = [],
          index;
        sequence.forEach(function(item) {
          index = getMeta(item, metaKey);
          if ( index !== undefined ) {
            if ( !newSequence[index] ) {
              newSequence[index] = [];
              newSequence[index][metaKey] = index;
            }
            newSequence[index].push(item);
          } else {
            defaultBucket.push(item);
          }
        });
        newSequence = newSequence.condense();
        // insert default bucket at the beginning/end of sequence
        if ( defaultBucket.length ) {
          if ( insertAtBeginning ) {
            newSequence.splice(0, 0, defaultBucket);
          } else {
            newSequence.push(defaultBucket);
          }
        }
        return newSequence;
      }

      function getMeta(item, key) {
        var meta = item._schema['@meta'];
        return meta && meta[key];
      }

      function makeTitle(str) {
        if ( !str ) {
          return '';
        }
        var firstLetter = str.substr(0, 1).toUpperCase();
        return firstLetter + str.substr(1);
      }

      function getNextIDSuffix(container, regexp) {
        var max = Math.max.apply(Math, container.getIDs().map(function(id) {
          var match = regexp.exec(id);
          return match && +match[2];
        }));
        return max > 0 ? max + 1 : 1;
      }

      var panelsMixin = Barricade.Blueprint.create(function (schema) {
        var self = this,
          itemProto = {
            create: function(item) {
              this._item = item;
              this._title = getMeta(item, 'title') || makeTitle(item.getID());
              if ( item.instanceof(Barricade.ImmutableObject) ) {
                this._type = 'frozendict';
              } else if ( item.instanceof(Barricade.MutableObject) ) {
                this._type = 'dictionary';
                this._items = {};
                this.add = function() {
                  var newID = 'key' + getNextIDSuffix(this._item, /(key)([0-9]+)/);
                  this._item.push('', {id: newID});
                  this._items[newID] = this._item.getByID(newID);
                };
                this.get = function() {
                  var self = this._item,
                    items = this._items;
                  if ( !Object.keys(items).length ) {
                    self.getIDs().forEach(function(id) {
                      items[id] = self.getByID(id);
                    });
                  }
                  return items;
                };
                this.remove = function(key) {
                  var self = this._item;
                  delete this._items[key];
                  self.remove(self.getPosByID(key));
                }
              } else if ( item.instanceof(Barricade.Array) ) {
                this._type = 'list';
                this._items = [];
                this.add = function() {
                  var self = this._item;
                  self.push();
                  this._items.push(self.get(self.length() - 1));
                };
                this.get = function() {
                  var self = this._item, items = this._items;
                  if ( !items.length ) {
                    items = self.toArray();
                  }
                  return items;
                };
                this.remove = function(index) {
                  this._item.remove(index);
                  this._items.splice(index, 1);
                }
              } else { // primitive
                if ( Barricade.getType(item.get()) === Number ) {
                  this._type = 'number';
                } else if ( getMeta(item, 'widget') == 'textarea' ) {
                  this._type = 'text';
                } else {
                  this._type = 'string';
                }
              }
              return this;
            },
            isAtomic: function() {
              return ['number', 'string', 'text'].indexOf(this._type) > -1;
            },
            getID: function() {
              return this._item.getID();
            },
            value: function() {
              if ( !arguments.length ) {
                return this._item.get();
              } else {
                this._item.set(arguments[0]);
              }
            },
            getTitle: function() {
              return this._title;
            },
            getType: function() {
              return this._type;
            }
          },
          rowProto = {
            create: function(items) {
              this.id = getNewId();
              this.index = items.row;
              items = items.slice();
              this._items = items.sort(function(item1, item2) {
                return getMeta(item1, 'index') - getMeta(item2, 'index');
              }).map(function(item) {
                return Object.create(itemProto).create(item);
              });
              return this;
            },
            getItems: function() {
              return this._items;
            }
          },
          panelProto = {
            create: function(items, barricadeContainer) {
              if ( angular.isArray(items) && !items.length ) {
                return null;
              }
              this.id = getNewId();
              if ( angular.isArray(items) ) {
                this._items = items;
              } else { // imply that `items` is Barricade.ImmutableObject
                this._items = items.getKeys().map(function(key) {
                  return enhanceWithID(items, key);
                });
                this._barricadeObj = items;
                this._barricadeObjContainer = barricadeContainer;
                this.removable = true;
              }
              return this;
            },
            getTitle: function() {
              if ( this._barricadeObj ) {
                return this._barricadeObj.get('name');
              }
            },
            getRows: function() {
              if ( this._rows === undefined ) {
                this._rows = groupByMetaKey(this._items, 'row').map(function(items) {
                  return Object.create(rowProto).create(items);
                });
              }
              return this._rows;
            },
            remove: function(id) {
              for ( var i = 0; i < panels.length; i++ ) {
                if ( panels[i].id === id ) {
                  var container = this._barricadeObjContainer;
                  container.remove.call(
                    container, container.getPosByID(this._barricadeObj.getID()));
                  panels.splice(i, 1);
                  break;
                }
              }
            }
          },
          panels;

        function enhanceWithID(container, key) {
          var item = container.get(key);
          item.setID(key);
          return item;
        }

        this.getPanels = function() {
          if ( panels === undefined ) {
            var items = self.getKeys().map(function(key) {
              return enhanceWithID(self, key);
            });
            panels = [];

            groupByMetaKey(items, 'panelIndex').forEach(function(items) {
              if ( items[0].instanceof(Barricade.MutableObject) ) {
                items[0].toArray().forEach(function(obj) {
                  panels.push(Object.create(panelProto).create(obj, items[0]));
                });
              } else {
                panels.push(Object.create(panelProto).create(items));
              }
            });
            panels = panels.condense();
          }
          return panels;
        };

        this.refreshPanels = function() {
          panels = undefined;
        }

      });

      types.Mistral.Workbook = Barricade.ImmutableObject.extend({
        create: function(json, parameters) {
          var self = Barricade.ImmutableObject.create.call(this);

          panelsMixin.call(self);

          return self;
        }
      }, {
        '@type': Object,

        'version': {
          '@type': Number,
          '@enum': [2],
          '@meta': {
            'index': 2,
            'panelIndex': 0,
            'row': 1
          },
          '@default': 2
        },
        'name': {
          '@type': String,
          '@meta': {
            'index': 0,
            'panelIndex': 0,
            'row': 0
          }
        },
        'description': {
          '@type': String,
          '@meta': {
            'widget': 'textarea',
            'index': 1,
            'panelIndex': 0,
            'row': 0
          },
          '@required': false
        },
        'actions': {
          '@type': Object,
          '@required': false,
          '@meta': {
            'index': 3,
            'panelIndex': 1
          },
          '?': {
            '@class': types.Mistral.Action
          }
        },
        'workflows': {
          '@type': Object,
          '@meta': {
            'index': 4,
            'panelIndex': 2
          },
          '?': {
            '@class': types.Mistral.Workflow
          }
        }
      });

      return types.Mistral.Workbook.create();
    })
})();

