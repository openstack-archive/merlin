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
      if ( angular.isUndefined(json) || type === String ) {
        return fields.string.create(json, parameters);
      } else if ( type === Array ) {
        return fields.list.extend({
          inline: true
        }, {
          '*': {'@class': fields.string}
        }).create(json, parameters);
      } else if ( type === Object ) {
        return fields.dictionary.extend({
          inline: true
        }, {
          '?': {'@class': fields.string}
        }).create(json, parameters);
      }
    }

    models.varlist = fields.list.extend({
      create: function(json, parameters) {
        var self = fields.list.create.call(this, json, parameters);
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
      '*': {
        '@class': fields.frozendict.extend({
          create: function(json, parameters) {
            var self = fields.frozendict.create.call(this, json, parameters);
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

    models.YAQLField = fields.frozendict.extend({
      create: function(json, parameters) {
        var self = fields.frozendict.create.call(this, json, parameters);
        self.setType('yaqlfield');
        return self;
      }
    }, {
      'yaql': {
        '@class': fields.string
      },
      'action': {
        '@class': fields.string
      }
    });

    models.yaqllist = fields.list.extend({}, {
      '*': {'@class': models.YAQLField}
    });

    models.Action =  fields.frozendict.extend({
      create: function(json, parameters) {
        var self = fields.frozendict.create.call(this, json, parameters);
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
      'base': {
        '@class': fields.linkedcollection.extend({
          create: function(json, parameters) {
            parameters = Object.create(parameters);
            parameters.toCls = models.StandardActions;
            parameters.neededCls = models.Root;
            parameters.substitutedEntryID = 'standardActions';
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
          '?': {'@class': fields.string},
          '@meta': {
            'index': 2,
            'title': 'Base Input'
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
      _getPrettyJSON: function() {
        var json = fields.frozendict._getPrettyJSON.apply(this, arguments);
        delete json.type;
        return json;
      }
    }, {
      '@meta': {
        'baseKey': 'task',
        'baseName': 'Task '
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
            'index': 0
          }
        })
      },
      'description': {
        '@class': fields.text.extend({}, {
          '@meta': {
            'index': 2
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
                'title': 'Wait before'
              }
            })
          },
          'wait-after': {
            '@class': fields.number.extend({}, {
              '@required': false,
              '@meta': {
                'index': 1,
                'title': 'Wait after'
              }
            })
          },
          'timeout': {
            '@class': fields.number.extend({}, {
              '@required': false,
              '@meta': {
                'index': 2
              }
            })
          },
          'retry-count': {
            '@class': fields.number.extend({}, {
              '@required': false,
              '@meta': {
                'index': 3,
                'title': 'Retry count'
              }
            })
          },
          'retry-delay': {
            '@class': fields.number.extend({}, {
              '@required': false,
              '@meta': {
                'index': 4,
                'title': 'Retry delay'
              }
            })
          },
          'retry-break-on': {
            '@class': fields.number.extend({}, {
              '@required': false,
              '@meta': {
                'index': 5,
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
          '@class': fields.linkedcollection.extend({
            create: function(json, parameters) {
              parameters = Object.create(parameters);
              parameters.toCls = models.Actions;
              parameters.neededCls = models.Workbook;
              parameters.substitutedEntryID = 'actions';
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
            create: function(json, parameters) {
              parameters = Object.create(parameters);
              parameters.toCls = models.Workflows;
              parameters.neededCls = models.Workbook;
              parameters.substitutedEntryID = 'workflows';
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

    function TaskFactory(json, parameters) {
      var type = json.type || 'action';
      var baseClass = taskTypes[parameters.wfType];
      var mixinClass = taskTypes[type];
      var taskClass = mixinClass.call(baseClass);
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
            'index': 1
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
                var taskId = child.getID();
                var params = child._parameters;
                var taskPos = self.getPosByID(taskId);
                var taskData = child.toJSON();
                params.id = taskId;
                self.set(taskPos, TaskFactory(taskData, params));
              }
            });
            return self;
          }
        }, {
          '@meta': {
            'index': 5
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

    models.Actions = fields.dictionary.extend({}, {
      '@required': false,
      '@meta': {
        'index': 3
      },
      '?': {
        '@class': models.Action
      }
    });

    models.Workflows = fields.dictionary.extend({
      create: function(json, parameters) {
        var self = fields.dictionary.create.call(this, json, parameters);
        self.on('childChange', function(child, op) {
          if ( op === 'workflowType' ) {
            var workflowId = child.getID();
            var workflowPos = self.getPosByID(workflowId);
            var params = child._parameters;
            var workflowData = child.toJSON();
            params.wfType = child.type;
            params.id = workflowId;
            self.set(workflowPos, workflowFactory(workflowData, params));
          }
        });
        return self;
      }
    }, {
      '@meta': {
        'index': 4
      },
      '?': {
        '@class': models.Workflow,
        '@factory': workflowFactory
      }
    });

    models.Workbook = fields.frozendict.extend({
      toYAML: function() {
        return jsyaml.dump(this.toJSON({pretty: true}));
      }
    }, {
      'version': {
        '@class': fields.string.extend({}, {
          '@enum': ['2.0'],
          '@meta': {
            'index': 2
          },
          '@default': '2.0'
        })
      },
      'name': {
        '@class': fields.string.extend({}, {
          '@meta': {
            'index': 0
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
            'index': 1
          },
          '@required': false
        })
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

    models.Root = Barricade.ImmutableObject.extend({}, {
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
