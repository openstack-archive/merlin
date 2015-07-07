/**
 * Created by tsufiev on 2/24/15.
 */
(function() {
  'use strict';

  angular
    .module('merlin')
    .factory('merlin.panel.models', merlinPanelModels);

  merlinPanelModels.$inject = ['merlin.utils'];

  function merlinPanelModels(utils) {
    var groupMixin = Barricade.Blueprint.create(function() {
      var self = this;
      var additive = utils.getMeta(self, 'additive');
      var removable = utils.getMeta(self, 'removable');

      if ( angular.isUndefined(additive) ) {
        additive = true;
      }
      self.isAdditive = function() {
        return additive;
      };

      if ( angular.isUndefined(removable) ) {
        removable = false;
      }
      self.isRemovable = function() {
        return removable;
      };

      if ( removable ) { // conditionally override common .title()
        self.title = function() {
          if ( arguments.length ) {
            self.setID(arguments[0]);
          } else {
            return self.getID();
          }
        };
      }

      self.setType('group');

      return self;
    });

    return {
      groupmixin: groupMixin
    };
  }
})();
