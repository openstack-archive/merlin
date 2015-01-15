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

    .run(function($http, $templateCache) {
      var fields = ['dictionary', 'frozendict', 'list', 'string',
        'varlist', 'text', 'group', 'yaqllist'];
      fields.forEach(function(field) {
        var base = '/static/mistral/js/angular-templates/fields/';
        $http.get(base + field + '.html').success(function(templateContent) {
          $templateCache.put(field, templateContent);
        });
      })
    })

    .filter('prepareSchema', function($filter) {
      var toArray = $filter('toArray'),
        orderBy = $filter('orderBy');
      function schemaToArray(schema) {
        return angular.isArray(schema) ? schema : orderBy(
          toArray(schema, true), 'index').map(function(item) {
            item.name = item.$key;
            if ( item.type === 'panel' ) {
              item.panelIndex = item.index;
            }
            if ( item.type === 'panel' || item.type === 'group' ) {
              item.value = schemaToArray(item.value);
            }
            return item;
          });
      }
      return schemaToArray;
    })

    .filter('normalizePanels', function() {
      return function(collection) {
        return collection.map(function(panelSpec) {
          if ( panelSpec[0].type === 'panel' ) {
            var data = panelSpec[0];
            panelSpec.length = data.value.length;
            for ( var i = 0; i < panelSpec.length; i++ ) {
              panelSpec[i] = data.value[i];
            }
            panelSpec.multiple = data.multiple;
            panelSpec.name = data.name;
          }
          return panelSpec;
        });
      }
    })



})();