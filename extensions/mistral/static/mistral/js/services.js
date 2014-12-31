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

    .value('isAtomic', function(type) {
      return ['string'].indexOf(type) > -1;
    })

    .value('schema', {
        action: [{
          name: 'name',
          type: 'string',
          group: 'one'
        }, {
          name: 'base',
          type: 'string',
          group: 'one'
        }, {
          name: 'baseInput',
          title: 'Base Input',
          type: 'frozendict',
          group: ''
        }, {
          name: 'input',
          type: 'list',
          group: ''
        }, {
          name: 'output',
          type: 'varlist',
          group: ''
        }
        ]
      })

})();