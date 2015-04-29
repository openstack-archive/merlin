/**
 * Created by tsufiev on 2/24/15.
 */
(function() {
  'use strict';

  angular.module('mistral')
    .factory('mistral.workbook.models',
    ['merlin.field.models', 'merlin.panel.models', 'merlin.utils', '$http', '$q',
      function(fields, panel, utils, $http, $q) {
        var models = {};

        function varlistValueFactory(json, parameters) {
          var type = Barricade.getType(json);
          if ( json === undefined || type === String ) {
            return fields.string.create(json, parameters);
          } else if ( type === Array ) {
            return fields.list.extend({}, {
              '*': {'@class': fields.string}
            }).create(json, parameters);
          } else if ( type === Object ) {
            return fields.dictionary.extend({}, {
              '?': {'@class': fields.string}
            }).create(json, parameters);
          }
        }

        models.varlist = fields.list.extend({
          create: function(json, parameters) {
            var self = fields.list.create.call(this, json, parameters);
            self.setType('varlist');
            self.on('childChange', function(child, op) {
              if ( op == 'empty' ) {
                self.each(function(index, item) {
                  if ( child === item ) {
                    self.remove(index);
                  }
                })
              }
            });
            return self;
          }
        }, {
          '*': {
            '@class': fields.frozendict.extend({
              create: function(json, parameters) {
                var self = fields.frozendict.create.call(this, json, parameters);
                self.on('childChange', function(child) {
                  if ( child.instanceof(Barricade.Enumerated) ) { // type change
                    var value = self.get('value');
                    switch ( child.get() ) {
                      case 'string':
                        self.set('value', varlistValueFactory(''));
                        break;
                      case 'list':
                        self.set('value', varlistValueFactory(['']));
                        break;
                      case 'dictionary':
                        self.set('value', varlistValueFactory({'key1': ''}));
                        break;
                    }
                  } else if ( child.instanceof(Barricade.Arraylike) && !child.length() ) {
                    self.emit('change', 'empty');
                  }
                });
                return self;
              },
              _getPrettyJSON: function() {
                var json = fields.frozendict._getPrettyJSON.apply(this, arguments);
                return json.value;
              }
            }, {
              'type': {
                '@class': fields.string.extend({}, {
                  '@enum': ['string', 'list', 'dictionary'],
                  '@default': 'string'
                })
              },
              'value': {
                '@class': fields.wildcard,
                '@factory': varlistValueFactory
              }
            })
          }
        });

        models.yaqllist = fields.list.extend({
          create: function(json, parameters) {
            var self = fields.list.create.call(this, json, parameters);
            self.setType('yaqllist');
            return self;
          }
        }, {
          '*': {
            '@class': fields.frozendict.extend({}, {
              'yaql': {
                '@class': fields.string
              },
              'action': {
                '@class': fields.string
              }
            })
          }
        });

        models.Action =  fields.frozendict.extend({
          create: function(json, parameters) {
            var self = fields.frozendict.create.call(this, json, parameters),
              base = self.get('base');
            base.on('change', function(operation) {
              var baseValue;
              if ( operation != 'id' ) {
                baseValue = base.get();
                if ( baseValue ) {
                  base.getSchema(baseValue).then(function(keys) {
                    self.get('base-input').setSchema(keys);
                  });
                }
              }
            });
            return self;
          }
        }, {
          'base': {
            '@class': fields.string.extend({
               create: function(json, parameters) {
                 var self = fields.string.create.call(this, json, parameters),
                   schema = {},
                   url = utils.getMeta(self, 'autocompletionUrl');

                 self.getSchema = function(key) {
                   var deferred = $q.defer();
                   if ( !(key in schema) ) {
                     $http.get(url+'?key='+key).success(function(keys) {
                       schema[key] = keys;
                       deferred.resolve(keys);
                     }).error(function() {
                       deferred.reject();
                     });
                   } else {
                     deferred.resolve(schema[key]);
                   }
                   return deferred.promise;
                 };
                 return self;
               }
             }, {
              '@meta': {
                'index': 1,
                'row': 0,
                'autocompletionUrl': '/project/mistral/actions/types'
              }
            })
          },
          'base-input': {
            '@class': fields.directeddictionary.extend({}, {
              '@required': false,
              '@meta': {
                'index': 2,
                'title': 'Base Input'
              },
              '?': {
                '@class': fields.string.extend({}, {
                  '@meta': {'row': 1}
                })
              }
            })
          },
          'input': {
            '@class': fields.list.extend({}, {
              '@meta': {
                'index': 3
              },
              '*': {'@class': fields.string}
            })
          },
          'output': {
            '@class': models.varlist.extend({}, {
              '@meta': {
                'index': 4
              }
            })
          }
        });

        models.Task = fields.frozendict.extend({
          create: function(json, parameters) {
            var self = fields.frozendict.create.call(this, json, parameters);
            self.on('childChange', function(child, op) {
              if ( child === self.get('type') && op !== 'id' ) {
                self.emit('change', 'taskType');
              }
            });
            return self;
          },
          remove: function() {
            this.emit('change', 'taskRemove', this.getID());
          },
        }, {
          '@meta': {
            'baseKey': 'task',
            'baseName': 'Task ',
            'group': true,
            'additive': false,
            'removable': true
          },
          'type': {
            '@class': fields.string.extend({}, {
              '@enum': [{
                value: 'action', label: 'Action-based'
              }, {
                value: 'workflow', label: 'Workflow-based'
              }],
              '@default': 'action',
              '@meta': {
                'index': 0,
                'row': 0
              }
            })
          },
          'description': {
            '@class': fields.text.extend({}, {
              '@meta': {
                'index': 2,
                'row': 1
              }
            })
          },
          'input': {
            '@class': fields.dictionary.extend({}, {
              '@meta': {
                'index': 4
              },
              '?': {
                '@class': fields.string
              }
            })
          },
          'publish': {
            '@class': fields.dictionary.extend({}, {
              '@meta': {
                'index': 5
              },
              '?': {
                '@class': fields.string
              }
            })
          },
          'policies': {
            '@class': fields.frozendict.extend({
              _getPrettyJSON: function() {
                var json = fields.frozendict._getPrettyJSON.apply(this, arguments);
                json.retry = {
                  count: utils.pop(json, 'retry-count'),
                  delay: utils.pop(json, 'retry-delay'),
                  'break-on': utils.pop(json, 'retry-break-on')
                };
                return json;
              }
            }, {
              '@meta': {
                'index': 9
              },
              '@required': false,
              'wait-before': {
                '@class': fields.number.extend({}, {
                  '@required': false,
                  '@meta': {
                    'index': 0,
                    'row': 0,
                    'title': 'Wait before'
                  }
                })
              },
              'wait-after': {
                '@class': fields.number.extend({}, {
                  '@required': false,
                  '@meta': {
                    'index': 1,
                    'row': 0,
                    'title': 'Wait after'
                  }
                })
              },
              'timeout': {
                '@class': fields.number.extend({}, {
                  '@required': false,
                  '@meta': {
                    'index': 2,
                    'row': 1
                  }
                })
              },
              'retry-count': {
                '@class': fields.number.extend({}, {
                  '@required': false,
                  '@meta': {
                    'index': 3,
                    'row': 2,
                    'title': 'Retry count'
                  }
                })
              },
              'retry-delay': {
                '@class': fields.number.extend({}, {
                  '@required': false,
                  '@meta': {
                    'index': 4,
                    'row': 2,
                    'title': 'Retry delay'
                  }
                })
              },
              'retry-break-on': {
                '@class': fields.number.extend({}, {
                  '@required': false,
                  '@meta': {
                    'index': 5,
                    'row': 3,
                    'title': 'Retry break on'
                  }
                })
              }
            })
          }
        });

        models.ReverseWFTask = models.Task.extend({}, {
          'requires': {
            '@class': fields.string.extend({}, {
              '@meta': {
                'row': 2,
                'index': 3
              }
            })
          }
        });

        models.DirectWFTask = models.Task.extend({}, {
          'on-error': {
            '@class': fields.list.extend({}, {
              '@meta': {
                'title': 'On error',
                'index': 6
              },
              '*': {
                '@class': fields.string
              }
            })
          },
          'on-success': {
            '@class': fields.list.extend({}, {
              '@meta': {
                'title': 'On success',
                'index': 7
              },
              '*': {
                '@class': fields.string
              }
            })
          },
          'on-complete': {
            '@class': fields.list.extend({}, {
              '@meta': {
                'title': 'On complete',
                'index': 8
              },
              '*': {
                '@class': fields.string
              }
            })
          }
        });

        models.ActionTaskMixin = Barricade.Blueprint.create(function() {
          return this.extend({}, {
            'action': {
              '@class': fields.string.extend({}, {
                '@meta': {
                  'row': 0,
                  'index': 1,
                  'autocompletionUrl': '$.actions.getIDs'
                }
              })
            }
          });
        });

        models.WorkflowTaskMixin = Barricade.Blueprint.create(function() {
          return this.extend({}, {
            'workflow': {
              '@class': fields.string.extend({}, {
                '@meta': {
                  'row': 0,
                  'index': 1,
                  'autocompletionUrl': '$.workflows.getIDs'
                }
              })
            }
          });
        });

        var taskTypes = {
          'direct': models.DirectWFTask,
          'reverse': models.ReverseWFTask,
          'action': models.ActionTaskMixin,
          'workflow': models.WorkflowTaskMixin
        };

        function TaskFactory(json, parameters) {
          var type = json.type || 'action',
            baseClass = taskTypes[parameters.wfType],
            mixinClass = taskTypes[type],
            taskClass = mixinClass.call(baseClass);
          return taskClass.create(json, parameters);
        }

        models.Workflow = fields.frozendict.extend({
          create: function(json, parameters) {
            var self = fields.frozendict.create.call(this, json, parameters);
            self.on('childChange', function(child, op) {
              if ( child === self.get('type') && op !== 'id' ) {
                self.emit('change', 'workflowType');
              }
            });
            return self;
          }
        }, {
          'type': {
            '@class': fields.string.extend({}, {
              '@enum': ['reverse', 'direct'],
              '@default': 'direct',
              '@meta': {
                'index': 1,
                'row': 0
              }
            })
          },
          'input': {
            '@class': fields.list.extend({}, {
              '@required': false,
              '@meta': {
                'index': 2
              },
              '*': {
                '@class': fields.string
              }
            })
          },
          'output': {
            '@class': fields.list.extend({}, {
              '@required': false,
              '@meta': {
                'index': 3
              },
              '*': {
                '@class': fields.string
              }
            })
          },
          'tasks': {
            '@class': fields.dictionary.extend({
              create: function(json, parameters) {
                var self = fields.dictionary.create.call(this, json, parameters);
                self.on('childChange', function(child, op, arg) {
                  if ( op === 'taskType' ) {
                    var taskId = child.getID(),
                      params = child._parameters,
                      taskPos = self.getPosByID(taskId),
                      taskData = child.toJSON();
                    params.id = taskId;
                    self.set(taskPos, TaskFactory(taskData, params));
                  } else if ( op === 'taskRemove' ) {
                    self.remove(arg);
                  }
                });
                return self;
              }
            }, {
              '@meta': {
                'index': 5,
                'group': true
              },
              '?': {
                '@class': models.Task,
                '@factory': TaskFactory
              }
            })
          }

        });

        models.ReverseWorkflow = models.Workflow.extend({});
        models.DirectWorkflow = models.Workflow.extend({}, {
          'task-defaults': {
            '@class': fields.frozendict.extend({}, {
              '@required': false,
              '@meta': {
                'index': 4,
                'group': true,
                'additive': false
              },
              'on-error': {
                '@class': models.yaqllist.extend({}, {
                  '@meta': {
                    'title': 'On error',
                    'index': 0
                  }
                })
              },
              'on-success': {
                '@class': models.yaqllist.extend({}, {
                  '@meta': {
                    'title': 'On success',
                    'index': 1
                  }
                })
              },
              'on-complete': {
                '@class': models.yaqllist.extend({}, {
                  '@meta': {
                    'title': 'On complete',
                    'index': 2
                  }
                })
              }
            })
          }
        });

        var workflowTypes = {
          'direct': models.DirectWorkflow,
          'reverse': models.ReverseWorkflow
        };

        function workflowFactory(json, parameters) {
          var type = json.type || 'direct';
          parameters.wfType = type;
          return workflowTypes[type].create(json, parameters);
        }

        models.Workbook = fields.frozendict.extend({
          toYAML: function() {
            return jsyaml.dump(this.toJSON({pretty: true}));
          }
        }, {
          'version': {
            '@class': fields.number.extend({}, {
              '@enum': [2.0],
              '@meta': {
                'index': 2,
                'panelIndex': 0,
                'row': 1
              },
              '@default': 2.0
            })
          },
          'name': {
            '@class': fields.string.extend({}, {
              '@meta': {
                'index': 0,
                'panelIndex': 0,
                'row': 0
              },
              '@constraints': [
                function(value) {
                  return value !== 'workbook1' ? true : 'The sample validation failure.';
                }
              ]
            })
          },
          'description': {
            '@class': fields.text.extend({}, {
              '@meta': {
                'index': 1,
                'panelIndex': 0,
                'row': 0
              },
              '@required': false
            })
          },
          'actions': {
            '@class': fields.dictionary.extend({}, {
              '@required': false,
              '@meta': {
                'index': 3,
                'panelIndex': 1
              },
              '?': {
                '@class': models.Action
              }
            })
          },
          'workflows': {
            '@class': fields.dictionary.extend({
              create: function(json, parameters) {
                var self = fields.dictionary.create.call(this, json, parameters);
                self.on('childChange', function(child, op) {
                  if ( op === 'workflowType' ) {
                    var workflowId = child.getID(),
                      workflowPos = self.getPosByID(workflowId),
                      params = child._parameters,
                      workflowData = child.toJSON();
                    params.wfType = child.type;
                    params.id = workflowId;
                    self.set(workflowPos, workflowFactory(workflowData, params));
                  }
                });
                return self;
              }
            }, {
              '@meta': {
                'index': 4,
                'panelIndex': 2
              },
              '?': {
                '@class': models.Workflow,
                '@factory': workflowFactory
              }
            })
          }
        });

        return models;
      }])
})();
