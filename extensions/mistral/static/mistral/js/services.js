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
        'varlist', 'text', 'group', 'yaqllist', 'number'
      ];
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

    .filter('getPanels', function($filter) {
      var orderBy = $filter('orderBy'),
        groupBy = $filter('groupBy'),
        toArray = $filter('toArray');
      return function(container) {
        var seq = groupBy(container, 'getMeta().panelIndex');
        console.log('seq', seq);
        var seq1 = toArray(seq, true);
        console.log('seq1', seq1);
        var seq2 = orderBy(seq1, '$key');
        console.log('seq2', seq2);
//        var seq = orderBy(
//          toArray(, true),
//          '$key');
        return seq2;
      }
    })


  function sign(x) {
    if ( x > 0 ) {
      return 1;
    } else {
      return x < 0 ? -1 : 0;
    }
  }

  function comparePanelIndices(item1, item2) {
    var index1 = item1.getMeta().panelIndex,
      index2 = item2.getMeta().panelIndex;

    if ( index1 === undefined || index2 === undefined ) {
      return -1;
    } else {
      return sign(index1-index2);
    }

  }



})();