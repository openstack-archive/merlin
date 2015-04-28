/**
 * Created by tsufiev on 2/24/15.
 */
(function() {
  'use strict';

  angular.module('merlin')
    .factory('merlin.panel.models', ['merlin.utils', function(utils) {

      var groupMixin = Barricade.Blueprint.create(function() {
        var self = this,
          origTitle = this.title,
          additive = utils.getMeta(self, 'additive'),
          removable = utils.getMeta(self, 'removable');

        if ( additive === undefined ) {
          additive = true;
        }
        self.isAdditive = function() {
          return additive;
        };

        if ( removable === undefined ) {
          removable = false;
        }
        self.isRemovable = function() {
          return removable;
        };

        self.title = function() {
          if ( arguments.length ) {
            self.getID() && self.setID(arguments[0]);
          } else {
            return origTitle.call(self);
          }
        };

        self.setType('group');

        return self;
      });

      return {
        groupmixin: groupMixin
      }
    }])

})();