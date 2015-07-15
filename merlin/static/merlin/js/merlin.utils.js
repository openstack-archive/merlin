/**
 * Created by tsufiev on 2/24/15.
 */

(function() {
  'use strict';

  angular
    .module('merlin')
    .factory('merlin.utils', merlinUtils);

  function merlinUtils() {
    function condense(array) {
      return array.filter(function(el) {
        return angular.isDefined(el) && el !== null;
      });
    }

    var idCounter = 0;

    function getNewId() {
      idCounter++;
      return 'id-' + idCounter;
    }

    function groupByExtractedKey(sequence, keyExtractor, insertAtBeginning) {
      var newSequence = [];
      var defaultBucket = [];
      var index;
      sequence.forEach(function(item) {
        index = keyExtractor(item);
        if ( angular.isDefined(index) ) {
          if ( !newSequence[index] ) {
            newSequence[index] = [];
            newSequence[index][keyExtractor()] = index;
          }
          newSequence[index].push(item);
        } else {
          defaultBucket.push(item);
        }
      });
      newSequence = condense(newSequence);
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

    function groupByMetaKey(sequence, metaKey, insertAtBeginning) {
      function keyExtractor(item) {
        if (angular.isDefined(item)) {
          return getMeta(item, metaKey);
        } else {
          return metaKey;
        }
      }
      return groupByExtractedKey(sequence, keyExtractor, insertAtBeginning);
    }

    function getMeta(item, key) {
      if ( item ) {
        var meta = item._schema['@meta'];
        return meta && meta[key];
      }
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

    function extend(proto, extension) {
      var newObj;
      proto = (angular.isDefined(proto) ? proto : null);
      newObj = Object.create(proto);
      Object.keys(extension).forEach(function(key) {
        newObj[key] = extension[key];
      });
      return newObj;
    }

    return {
      getMeta: getMeta,
      getNewId: getNewId,
      groupByMetaKey: groupByMetaKey,
      groupByExtractedKey: groupByExtractedKey,
      makeTitle: makeTitle,
      getNextIDSuffix: getNextIDSuffix,
      enhanceItemWithID: enhanceItemWithID,
      extend: extend,
      pop: pop,
      condense: condense
    };
  }

})();
