/**
 * Created by tsufiev on 2/24/15.
 */
(function() {
  'use strict';

  angular.module('merlin')
    .factory('merlin.panel.models', ['merlin.utils', function(utils) {

      var groupMixin = Barricade.Blueprint.create(function() {
        var self = this,
          additive = utils.getMeta(self, 'additive');

        if ( additive === undefined ) {
          additive = true;
        }
        self.isAdditive = function() {
          return additive;
        };
        self.setType('group');

        return self;
      });

      return {
        groupmixin: groupMixin
      }
    }])

})();