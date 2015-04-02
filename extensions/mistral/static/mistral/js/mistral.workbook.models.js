/**
 * Created by tsufiev on 2/24/15.
 */
(function() {
  'use strict';

  angular.module('mistral')
    .factory('mistral.workbook.models',
    ['merlin.field.models', 'merlin.panel.models', 'merlin.utils',
      function(fields, panel, utils) {
        var models = {};

        var varlistValueFactory = function(json, parameters) {
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
        };

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
              toJSON: function() {
                var json = fields.frozendict.toJSON.apply(this, arguments);
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
          toJSON: function() {
            var json = fields.frozendict.toJSON.apply(this, arguments);
            delete json.name;
            return json;
          }
        }, {
          'name': {
            '@class': fields.string.extend({}, {
              '@meta': {
                'index': 0,
                'row': 0
              }
            })
          },
          'base': {
            '@class': fields.string.extend({}, {
              '@meta': {
                'index': 1,
                'row': 0
              }
            })
          },
          'base-input': {
            '@class': fields.frozendict.extend({}, {
              '@required': false,
              '@meta': {
                'index': 2,
                'title': 'Base Input'
              },
              '?': {'@class': fields.string}
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
          toJSON: function() {
            var json = fields.frozendict.toJSON.apply(this, arguments);
            delete json.name;
            return json;
          }
        }, {
          '@meta': {
            'baseKey': 'task',
            'baseName': 'Task ',
            'group': true,
            'additive': false
          },
          'name': {
            '@class': fields.string.extend({}, {
              '@meta': {
                'index': 0,
                'row': 0
              }
            })
          },
          'type': {
            '@class': fields.string.extend({}, {
              '@enum': ['Action-based', 'Workflow-based'],
              '@meta': {
                'index': 1,
                'row': 0
              }
            })
          },
          'action': {
            '@class': fields.string.extend({}, {
              '@meta': {
                'index': 2,
                'row': 1
              }
            })
          },
          'input': {
            '@class': fields.dictionary.extend({}, {
              '@meta': {
                'index': 3
              },
              '?': {
                '@class': fields.string
              }
            })
          },
          'publish': {
            '@class': fields.dictionary.extend({}, {
              '@meta': {
                'index': 4
              },
              '?': {
                '@class': fields.string
              }
            })
          },
          'on-error': {
            '@class': fields.list.extend({}, {
              '@meta': {
                'title': 'On error',
                'index': 5
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
                'index': 6
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
                'index': 7
              },
              '*': {
                '@class': fields.string
              }
            })
          },
          'policies': {
            '@class': fields.frozendict.extend({
              toJSON: function() {
                var json = fields.frozendict.toJSON.apply(this, arguments);
                json.retry = {
                  count: utils.pop(json, 'retry-count'),
                  delay: utils.pop(json, 'retry-delay'),
                  'break-on': utils.pop(json, 'retry-break-on')
                };
                return json;
              }
            }, {
              '@meta': {
                'index': 8
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

        models.Workflow = fields.frozendict.extend({
          create: function(json, parameters) {
            var self = fields.frozendict.create.call(this, json, parameters);
            self.on('childChange', function(child, op) {
              if ( child === self.get('type') && op !== 'id' ) {
                self.emit('change', 'workflowType');
              }
            });
            return self;
          },
          toJSON: function() {
            var json = fields.frozendict.toJSON.apply(this, arguments);
            delete json.name;
            return json;
          }
        }, {
          'name': {
            '@class': fields.string.extend({}, {
              '@meta': {
                'index': 0,
                'row': 0
              }
            })
          },
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
            '@class': fields.dictionary.extend({}, {
              '@meta': {
                'index': 5,
                'group': true
              },
              '?': {
                '@class': models.Task
              }
            })
          }

        });

        models.ReverseWorkflow = models.Workflow;
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

        models.Workbook = fields.frozendict.extend({
          toYAML: function() {
            return jsyaml.dump(this.toJSON());
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
              }
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
                      workflowData = child.toJSON(),
                      newType = child.get('type').get(),
                      newWorkflow = workflowTypes[newType].create(
                        workflowData, {id: workflowId});
                    self.set(workflowPos, newWorkflow);
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
                '@class': models.Workflow
              }
            })
          }
        });

        return models;
      }])
})();
