/**
 * Created by tsufiev on 12/29/14.
 */

(function() {
  angular.module('hz')

    .factory('defaultSetter', function($parse) {
      return function(attrs, attrName, defaultValue) {
        if ( attrs[attrName] === undefined ) {
          attrs[attrName] = defaultValue;
        } else {
          attrs[attrName] = $parse(attrs[attrName])();
        }
      }
    })
    .factory('suggestionService', function() {
       var suggestions = ['one', 'two', 'three', 'four', 'five', 'nova.create_network', 'nova.create_network_1'];
       return {
        getSuggestions: function(){
            return suggestions;
        }
    }
    })
    //used for trackProxy and changeProxy
    .factory('proxyService', function($rootScope) {
       var suggestions = {
           'base': {'one': '',
                    'nova.create_network': {
                        NetworkId: {
                          title: 'Network Id',
                          type: 'string',
                          depends: ['base']
                        }},
                    'nova.create_network_1': {
                            NetworkId: {
                              title: 'Network Id',
                              type: 'string',
                              depends: ['base']
                            },
                            FlavorId: {
                              title: 'Flavor Id',
                              type: 'string',
                              depends: ['base']
                            }}
                    }
       };
       return {
        getSchema: function(field, value){
            return suggestions[field][value];
        },
        update: function(field, value){
            $rootScope.$broadcast(field+"Changed", {// TODO: send schema directly here
               field: field,
               value: value
           });
        }
    }
    })
    .run(function($http, $templateCache) {
      var fields = ['dictionary', 'frozendict', 'list', 'string', 'varlist'];
      fields.forEach(function(field) {
        var base = '/static/mistral/js/angular-templates/fields/';
        $http.get(base + field + '.html').success(function(templateContent) {
          $templateCache.put(field, templateContent);
        });
      })
    })

})();