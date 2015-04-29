/**
 * Created by tsufiev on 4/29/15.
 */
(function() {
  'use strict';

  angular.module('merlin')
    .factory('merlin.storage', function() {
      var storage = {};

      function storeTree(id, tree) {
        storage[id] = tree;
      }

      function getTree(id) {
        return storage[id];
      }

      return {
        store: storeTree,
        get: getTree
      }
    })
})();