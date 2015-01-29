/**
 * Created by tsufiev on 2/24/15.
 */
(function(){
  angular.module('hz')

    .factory('merlin.utils', function() {
      Array.prototype.condense = function() {
        return this.filter(function(el) {
          return el !== undefined && el != null;
        });
      };

      var _id_counter = 0;

      function getNewId() {
        _id_counter++;
        return 'id-' + _id_counter;
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

      return {
        getMeta: getMeta,
        getNewId: getNewId,
        groupByMetaKey: groupByMetaKey,
        makeTitle: makeTitle,
        getNextIDSuffix: getNextIDSuffix,
        enhanceItemWithID: enhanceItemWithID
      }
    })
})();