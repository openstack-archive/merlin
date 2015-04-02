/**
 * Created by tsufiev on 2/24/15.
 */
(function() {
  'use strict';

  angular.module('merlin')
    .factory('merlin.utils', function() {
      Array.prototype.condense = function() {
        return this.filter(function(el) {
          return el !== undefined && el != null;
        });
      };

      String.prototype.hashCode = function() {
        var hash = 0, i, chr, len;
        if (this.length == 0)
          return hash;
        for (i = 0, len = this.length; i < len; i++) {
          chr   = this.charCodeAt(i);
          hash  = ((hash << 5) - hash) + chr;
          hash |= 0; // Convert to 32bit integer
        }
        return hash;
      };

      var _id_counter = 0;

      function getNewId(suffix) {
        if ( suffix === undefined ) {
          _id_counter++;
          return 'id-' + _id_counter;
        } else {
          return 'id-' + suffix;
        }
      }

      function groupByMetaKey(sequence, metaKey, insertAtBeginning) {
        var newSequence = [], defaultBucket = [],
          index;
        sequence.forEach(function(item) {
          index = getMeta(item, metaKey);
          if ( index !== undefined ) {
            if ( !newSequence[index] ) {
              newSequence[index] = [];
              newSequence[index][metaKey] = index;
            }
            newSequence[index].push(item);
          } else {
            defaultBucket.push(item);
          }
        });
        newSequence = newSequence.condense();
        // insert default bucket at the beginning/end of sequence
        if ( defaultBucket.length ) {
          if ( insertAtBeginning ) {
            newSequence.splice(0, 0, defaultBucket);
          } else {
            newSequence.push(defaultBucket);
          }
        }
        return newSequence;
      }

      function getMeta(item, key) {
        var meta = item._schema['@meta'];
        return meta && meta[key];
      }

      function makeTitle(str) {
        if ( !str ) {
          return '';
        }
        var firstLetter = str.substr(0, 1).toUpperCase();
        return firstLetter + str.substr(1);
      }

      function getNextIDSuffix(container, regexp) {
        var max = Math.max.apply(Math, container.getIDs().map(function(id) {
          var match = regexp.exec(id);
          return match && +match[2];
        }));
        return max > 0 ? max + 1 : 1;
      }

      function enhanceItemWithID(item, id) {
        item.setID(id);
        return item;
      }

      function pop(obj, key) {
        if ( obj.hasOwnProperty(key) ) {
          var value = obj[key];
          delete obj[key];
          return value;
        } else {
          return undefined;
        }
      }

      return {
        getMeta: getMeta,
        getNewId: getNewId,
        groupByMetaKey: groupByMetaKey,
        makeTitle: makeTitle,
        getNextIDSuffix: getNextIDSuffix,
        enhanceItemWithID: enhanceItemWithID,
        pop: pop
      }
    })

})();
