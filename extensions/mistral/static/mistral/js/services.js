/**
 * Created by tsufiev on 12/29/14.
 */

(function() {
  angular.module('hz')
    .factory('idGenerator', function() {
      var id = 0;
      return function() {
        id++;
        return 'elem-id-'+id;
      };
    })

    .factory('defaultSetter', function($parse) {
      return function(attrs, attrName, defaultValue) {
        if ( attrs[attrName] === undefined ) {
          attrs[attrName] = defaultValue;
        } else {
          attrs[attrName] = $parse(attrs[attrName])();
        }
      }
    });

})();