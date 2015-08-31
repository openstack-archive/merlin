/**
 * Created by tsufiev on 2/24/15.
 */
(function() {
  'use strict';

  angular
    .module('mistral')
    .factory('mistral.workbook.models', ModelsService);

  ModelsService.$inject = ['merlin.field.models', 'merlin.utils'];

  function ModelsService(fields, utils) {
    var models = {};

    function varlistValueFactory(json, parameters) {
      var type = Barricade.getType(json);
      var value;
      if ( angular.isUndefined(json) || type === String ) {
        return fields.string.create(json, parameters);
      } else if ( type === Array ) {
        value = fields.list.extend({}, {
          '*': {'@type': String}
        }).create(json, parameters);
      } else if ( type === Object ) {
        value = fields.dictionary.extend({}, {
          '?': {'@type': String}
        }).create(json, parameters);
      }
      value.inline = true;
      return value;
    }

    models.varlist = Barricade.Base.extend({
      create: function(json, parameters) {
        var self = Barricade.Base.create.call(this, json, parameters);
        if (!self.instanceof(Barricade.Array)) {
          Barricade.Array.call(self);
        }
        self.on('childChange', function(child, op) {
          if ( op == 'empty' ) {
            self.each(function(index, item) {
              if ( child === item ) {
                self.remove(index);
              }
            });
          }
        });
        return self;
      }
    }, {
      '@type': Array,
      '*': {
        '@class': Barricade.Base.extend({
          create: function(json, parameters) {
            var self = Barricade.Base.create.call(this, json, parameters);
            fields.frozendictmixin.call(self);
            self.isAtomic = function() { return false; };
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
            var json = Barricade.Base._getPrettyJSON.apply(this, arguments);
            return json.value;
          }
        }, {
          'type': {
            '@type': String,
            '@enum': ['string', 'list', 'dictionary'],
            '@default': 'string'
          },
          'value': {
            '@class': fields.generic,
            '@factory': varlistValueFactory
          }
        })
      }
    });

    models.YAQLField = fields.frozendict.extend({
      create: function(json, parameters) {
        var self = fields.frozendict.create.call(this, json, parameters);
        self.setType('yaqlfield');
        return self;
      }
    }, {
      'yaql': {
        '@type': String
      },
      'action': {
        '@type': String
      }
    });

    models.yaqllist = Barricade.create({
      '@type': Array,
      '*': {'@class': models.YAQLField}
    });

    models.Action =  Barricade.Base.extend({
      create: function(json, parameters) {
        var self = Barricade.Base.create.call(this, json, parameters);
        if (!self.instanceof(Barricade.ImmutableObject)) {
          Barricade.ImmutableObject.call(self);
        }
        var base = self.get('base');
        base.on('change', function(operation) {
          var argsEntry, pos, entry;
          if ( operation != 'id' ) {
            pos = base._collection.getPosByID(base.get());
            if ( pos > -1 ) {
              entry = self.get('base-input');
              argsEntry = base._collection.get(pos);
              entry.resetKeys(argsEntry.toJSON());
            }
          }
        });
        return self;
      }
    }, {
      '@type': Object,
      'base': {
        '@class': fields.linkedcollection.extend({
          create: function(json) {
            var parameters = {
              toCls: models.StandardActions,
              neededCls: models.Root,
              substitutedEntryID: 'standardActions'
            };
            return fields.linkedcollection.create.call(this, json, parameters);
          }
        }, {
          '@meta': {
            'index': 1
          }
        })
      },
      'base-input': {
        '@class': fields.dictionary.extend({
          create: function(json, parameters) {
            var self = fields.dictionary.create.call(this, json, parameters);
            self.isAdditive = function() { return false; };
            self.setType('frozendict');
            return self;
          },
          // here we override `each' method inherited from fields.dictionary<-MutableObject
          // because it provides entry index as the first argument of the callback, while
          // we need to get the key/ID value as first argument (mimicking the `each' method
          // ImmutableObject)
          each: function(callback) {
            var self = this;
            this.getIDs().forEach(function(id) {
              callback.call(self, id, self.getByID(id));
            });
            return this;
          }
        }, {
          '@required': false,
          '?': {'@type': String},
          '@meta': {
            'index': 2,
            'title': 'Base Input'
          }
        })
      },
      'input': {
        '@type': Array,
        '@meta': {
          'index': 3
        },
        '*': {'@type': String}
      },
      'output': {
        '@class': models.varlist.extend({}, {
          '@meta': {
            'index': 4
          }
        })
      }
    });

    models.Task = Barricade.Base.extend({
      create: function(json, parameters) {
        var self = Barricade.Base.create.call(this, json, parameters);
        if (!self.instanceof(Barricade.ImmutableObject)) {
          Barricade.ImmutableObject.call(self);
        }
        self.on('childChange', function(child, op) {
          if ( child === self.get('type') && op !== 'id' ) {
            self.emit('change', 'taskType');
          }
        });
        return self;
      },
      _getPrettyJSON: function() {
        var json = Barricade.Base._getPrettyJSON.apply(this, arguments);
        delete json.type;
        return json;
      }
    }, {
      '@type': Object,
      '@meta': {
        'baseKey': 'task',
        'baseName': 'Task '
      },
      'type': {
        '@type': String,
        '@enum': [{
          value: 'action', label: 'Action-based'
        }, {
          value: 'workflow', label: 'Workflow-based'
        }],
        '@default': 'action',
        '@meta': {
          'index': 0
        }
      },
      'description': {
        '@type': String,
        '@meta': {
          'widget': 'text',
          'index': 2
        }
      },
      'input': {
        '@type': Object,
        '@meta': {
          'index': 4
        },
        '?': {
          '@type': String
        }
      },
      'publish': {
        '@type': Object,
        '@meta': {
          'index': 5
        },
        '?': {
          '@type': String
        }
      },
      'policies': {
        '@class': Barricade.Base.extend({
          _getPrettyJSON: function() {
            var json = Barricade.Base._getPrettyJSON.apply(this, arguments);
            if (!self.instanceof(Barricade.ImmutableObject)) {
              Barricade.ImmutableObject.call(self);
            }
            json.retry = {
              count: utils.pop(json, 'retry-count'),
              delay: utils.pop(json, 'retry-delay'),
              'break-on': utils.pop(json, 'retry-break-on')
            };
            return json;
          }
        }, {
          '@type': Object,
          '@meta': {
            'index': 9
          },
          '@required': false,
          'wait-before': {
            '@type': Number,
            '@required': false,
            '@meta': {
              'index': 0,
              'title': 'Wait before'
            }
          },
          'wait-after': {
            '@type': Number,
            '@required': false,
            '@meta': {
              'index': 1,
              'title': 'Wait after'
            }
          },
          'timeout': {
            '@type': Number,
            '@required': false,
            '@meta': {
              'index': 2
            }
          },
          'retry-count': {
            '@type': Number,
            '@required': false,
            '@meta': {
              'index': 3,
              'title': 'Retry count'
            }
          },
          'retry-delay': {
            '@type': Number,
            '@required': false,
            '@meta': {
              'index': 4,
              'title': 'Retry delay'
            }
          },
          'retry-break-on': {
            '@type': Number,
            '@required': false,
            '@meta': {
              'index': 5,
              'title': 'Retry break on'
            }
          }
        })
      }
    });

    models.ReverseWFTask = models.Task.extend({}, {
      'requires': {
        '@type': String,
        '@meta': {
          'index': 3
        }
      }
    });

    models.DirectWFTask = models.Task.extend({}, {
      'on-error': {
        '@type': Array,
        '@meta': {
          'title': 'On error',
          'index': 6
        },
        '*': {
          '@type': String
        }
      },
      'on-success': {
        '@type': Array,
        '@meta': {
          'title': 'On success',
          'index': 7
        },
        '*': {
          '@type': String
        }
      },
      'on-complete': {
        '@type': Array,
        '@meta': {
          'title': 'On complete',
          'index': 8
        },
        '*': {
          '@type': String
        }
      }
    });

    models.ActionTaskMixin = Barricade.Blueprint.create(function() {
      return this.extend({}, {
        'action': {
          '@class': fields.linkedcollection.extend({
            create: function(json) {
              var parameters = {
                toCls: models.Actions,
                neededCls: models.Workbook,
                substitutedEntryID: 'actions'
              };
              return fields.linkedcollection.create.call(this, json, parameters);
            }
          }, {
            '@meta': {
              'index': 1
            }
          })
        }
      });
    });

    models.WorkflowTaskMixin = Barricade.Blueprint.create(function() {
      return this.extend({}, {
        'workflow': {
          '@class': fields.linkedcollection.extend({
            create: function(json) {
              var parameters = {
                toCls: models.Workflows,
                neededCls: models.Workbook,
                substitutedEntryID: 'workflows'
              };
              return fields.linkedcollection.create.call(this, json, parameters);
            }
          }, {
            '@meta': {
              'index': 1
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

    function TaskFactoryFactory(baseClass) {
      return function TaskFactory(json, parameters) {
        var type = json.type || 'action';
        var mixinClass = taskTypes[type];
        var taskClass = mixinClass.call(baseClass);
        return taskClass.create(json, parameters);
      }
    }

    function createTaskFactory(baseClass) {
      return function(json, parameters) {
        var self = Barricade.Base.create.call(this, json, parameters);
        self.on('childChange', function(child, op) {
          if ( op === 'taskType' ) {
            var taskId = child.getID();
            var taskPos = self.getPosByID(taskId);
            var taskData = child.toJSON();
            self.set(taskPos, TaskFactoryFactory(baseClass)(taskData, {id: taskId}));
          }
        });
        return self;
      }
    }

    models.Workflow = Barricade.Base.extend({
      create: function(json, parameters) {
        var self = Barricade.Base.create.call(this, json, parameters);
        if (!self.instanceof(Barricade.ImmutableObject)) {
          Barricade.ImmutableObject.call(self);
        }
        self.on('childChange', function(child, op) {
          if ( child === self.get('type') && op !== 'id' ) {
            self.emit('change', 'workflowType');
          }
        });
        return self;
      }
    }, {
      '@type': Object,
      'type': {
        '@type': String,
        '@enum': ['reverse', 'direct'],
        '@default': 'direct',
        '@meta': {
          'index': 1
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
      }
    });

    models.ReverseWorkflow = models.Workflow.extend({}, {
      'tasks': {
        '@class': Barricade.Base.extend({
          create: createTaskFactory(models.ReverseWFTask)
        }, {
          '@type': Object,
          '@meta': {
            'index': 5
          },
          '?': {
            '@class': models.Task,
            '@factory': TaskFactoryFactory(models.ReverseWFTask)
          }
        })
      }
    });
    models.DirectWorkflow = models.Workflow.extend({}, {
      'task-defaults': {
        '@type': Object,
        '@required': false,
        '@meta': {
          'index': 4
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
      },
      'tasks': {
        '@class': Barricade.Base.extend({
          create: createTaskFactory(models.DirectWFTask)
        }, {
          '@type': Object,
          '@meta': {
            'index': 5
          },
          '?': {
            '@class': models.Task,
            '@factory': TaskFactoryFactory(models.DirectWFTask)
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
      return workflowTypes[type].create(json, parameters);
    }

    models.Actions = Barricade.create({
      '@type': Object,
      '@required': false,
      '@meta': {
        'index': 3
      },
      '?': {
        '@class': models.Action
      }
    });

    models.Workflows = Barricade.Base.extend({
      create: function(json, parameters) {
        var self = Barricade.Base.create.call(this, json, parameters);
        if (!self.instanceof(Barricade.MutableObject)) {
          Barricade.MutableObject.call(self);
        }
        self.on('childChange', function(child, op) {
          if ( op === 'workflowType' ) {
            var workflowId = child.getID();
            var workflowPos = self.getPosByID(workflowId);
            var workflowData = child.toJSON();
            self.set(workflowPos, workflowFactory(workflowData, {id: workflowId}));
          }
        });
        return self;
      }
    }, {
      '@type': Object,
      '@meta': {
        'index': 4
      },
      '?': {
        '@class': models.Workflow,
        '@factory': workflowFactory
      }
    });

    models.Workbook = Barricade.Base.extend({
      toYAML: function() {
        return jsyaml.dump(this.toJSON({pretty: true}));
      }
    }, {
      '@type': Object,
      'version': {
        '@type': String,
        '@enum': ['2.0'],
        '@meta': {
          'index': 2
        },
        '@default': '2.0'
      },
      'name': {
        '@type': String,
        '@meta': {
          'index': 0
        },
        '@constraints': [
          function(value) {
            return value !== 'workbook1' ? true : 'The sample validation failure.';
          }
        ]
      },
      'description': {
        '@type': String,
        '@meta': {
          'index': 1,
          'widget': 'text'
        },
        '@required': false
      },
      'actions': {
        '@class': models.Actions
      },
      'workflows': {
        '@class': models.Workflows
      }
    });

    models.StandardActions = Barricade.create({
      '@type': Object,
      '?': {
        '@type': Array,
        '*': {
          '@type': String
        }
      }
    });

    models.Root = Barricade.create({
      '@type': Object,
      'standardActions': {
        '@class': models.StandardActions
      },
      'workbook': {
        '@class': models.Workbook
      }
    });

    return models;
  }
})();
