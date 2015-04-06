/**
 * Created by tsufiev on 2/24/15.
 */
(function(){
  angular.module('hz')

    .factory('mistral.workbook.models',
    ['merlin.field.models', 'merlin.panel.models', 'merlin.utils', '$http', function(fields, panel, utils, $http) {
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
            if ( operation == 'set' ) {
              if ( base.get() ) {
                self.get('baseInput').setSchema(base.getSchema(base.get()));
              }
            }
          });
          return self;
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
          '@class': fields.string.extend({
            create: function(json, parameters) {
              var self = fields.string.create.call(this, json, parameters),
                schema = {},
                url = utils.getMeta(self, 'autocompletionUrl'),
                keys;
              self.on('change', function(){alert('asdasd')});
              self.getSchema = function(key) {
                if ( !key in schema ) {
                  keys = $http.get(url+'?key='+key);
                  schema[key] = keys;
                }
                return schema[key];
              };
              return self;
            }
          }, {
            '@meta': {
              'index': 1,
              'row': 0,
              autocompletionUrl: '/project/mistral/actions/types'
            }
          })
        },
        'baseInput': {
          '@class': fields.directeddictionary.extend({}, {
            '@required': false,
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

      models.Task = fields.frozendict.extend({}, {
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
        'onError': {
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
        'onSuccess': {
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
        'onComplete': {
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
          '@class': fields.frozendict.extend({}, {
            '@meta': {
              'index': 8
            },
            '@required': false,
            'waitBefore': {
              '@class': fields.number.extend({}, {
                '@required': false,
                '@meta': {
                  'index': 0,
                  'row': 0,
                  'title': 'Wait before'
                }
              })
            },
            'waitAfter': {
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
            'retryCount': {
              '@class': fields.number.extend({}, {
                '@required': false,
                '@meta': {
                  'index': 3,
                  'row': 2,
                  'title': 'Retry count'
                }
              })
            },
            'retryDelay': {
              '@class': fields.number.extend({}, {
                '@required': false,
                '@meta': {
                  'index': 4,
                  'row': 2,
                  'title': 'Retry delay'
                }
              })
            },
            'retryBreakOn': {
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

      models.Workflow = fields.frozendict.extend({}, {
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
        'taskDefaults': {
          '@class': fields.frozendict.extend({}, {
            '@required': false,
            '@meta': {
              'index': 4,
              'group': true,
              'additive': false
            },
            'onError': {
              '@class': models.yaqllist.extend({}, {
                '@meta': {
                  'title': 'On error',
                  'index': 0
                }
              })
            },
            'onSuccess': {
              '@class': models.yaqllist.extend({}, {
                '@meta': {
                  'title': 'On success',
                  'index': 1
                }
              })
            },
            'onComplete': {
              '@class': models.yaqllist.extend({}, {
                '@meta': {
                  'title': 'On complete',
                  'index': 2
                }
              })
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

      models.Workbook = fields.frozendict.extend({
        create: function(json, parameters) {
          var self = fields.frozendict.create.call(this, json, parameters);
          return panel.panelmixin.call(self);
        },
        toYAML: function() {
          return jsyaml.dump(this.toJSON());
        }
      }, {
        'version': {
          '@class': fields.number.extend({}, {
            '@enum': [2],
            '@meta': {
              'index': 2,
              'panelIndex': 0,
              'row': 1
            },
            '@default': 2
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
          '@class': fields.dictionary.extend({}, {
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