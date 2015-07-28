(function() {
  'use strict';

  angular.module('congress')
    .factory('congress.policy.models',
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

                var json = this.get('table_1').get('value') + ' ' +
                           this.get('relation').get('value') + ' ' +
                           this.get('table_2').get('value') + ' \n';
                return json;
              }
            }, {
              'table_1': {
                '@class': fields.wildcard,
                '@factory': varlistValueFactory
              },
              'relation': {
                '@class': fields.wildcard,
                '@factory': varlistValueFactory
              },
              'table_2': {
                '@class': fields.wildcard,
                '@factory': varlistValueFactory
              }
            })
          }
        });



        models.validRuleExpression = fields.frozendict.extend({

        }, {

          '@required': false,
          '@meta': {
            //'index': 3,
            //'panelIndex': 1
          },
          'table_1': {
              '@class': fields.string.extend({}, {
              '@meta': {
                'index': 1,
                'row': 0
              },
              '@required': true
            })
          },
          'relation': {
              '@class': fields.string.extend({}, {
              '@meta': {
              },
              '@required': true
            })
          },
          'table_2': {
              '@class': fields.string.extend({}, {
              '@meta': {
              },
              '@required': true
            })
          }
        });

        function varlistFactory(json, parameters){
            var model = models.varlist.create(json, parameters);
            return model;
        }
        models.RuleAndEpressions = fields.frozendict.extend({
        }, {
          '@class': models.varlist
        });
        function ruleFactory(json, parameters) {
          return models.validRuleExpression.create(json, parameters);
        }
        models.RuleOrExpressions= fields.list.extend({}, {
          '@required': false,
          '@meta': {
            'index': 3,
            'panelIndex': 1
          },
          '*': {
            '@class': models.validRuleExpression,
            '@factory': ruleFactory
          }

        });
        models.Rule = fields.frozendict.extend({
          _getPrettyJSON: function(){
              var and_expressions = this.get('AndExpressions')._getPrettyJSON(),
                  or_expressions = this.get('OrExpressions')._getPrettyJSON();
              var data = [this.get('name').get(), ' ', ': \n'].concat(and_expressions).concat(or_expressions).join('');


              return data;
          },
          toDatalog: function() {
            //  error(vm, network) :-
            //    nova:virtual_machine(vm)
            //    nova:network(vm, network)
            //    nova:owner(vm, vm_owner)
            //    neutron:owner(network, network_owner)
            //    not neutron:public_network(network)
            //    not same_group(vm_owner, network_owner)
            //
            //  same_group(user1, user2) :-
            //    ad:group(user1, group)
            //    ad:group(user2, group)

            var output = 'name: ' + this.get('name').get('value');
            return this.toJSON({pretty: true})
          }
        }, {
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
            'AndExpressions': {
              '@class': models.varlist.extend({
                  _getPrettyJSON: function(){
                      var expressions = [];
                      var my_json = this.each(function(key, value){
                          console.log(value._getPrettyJSON());
                          expressions.push(value._getPrettyJSON());
                      });
                      console.log(expressions);
                      return expressions;
                  }
              }, {
                '@meta': {
                'index': 4
              }
            })
            },
            'OrExpressions': {
              '@class': models.varlist.extend({
                  _getPrettyJSON: function(){
                      var expressions = [];
                      var my_json = this.each(function(key, value){
                          console.log(value._getPrettyJSON());
                          expressions.push(value._getPrettyJSON());
                      });
                      console.log(expressions);
                      return expressions;
                  }
              }, {
                '@meta': {
                  'index': 4
                }
               })
            }
        });

        return models;
      }])
})();
