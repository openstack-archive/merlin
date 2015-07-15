
/*    Copyright (c) 2015 Mirantis, Inc.

 Licensed under the Apache License, Version 2.0 (the "License"); you may
 not use this file except in compliance with the License. You may obtain
 a copy of the License at

 http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 License for the specific language governing permissions and limitations
 under the License.
 */
(function() {
  angular
    .module('merlin')
    .filter('extractPanels', extractPanels)
    .filter('extractRows', extractRows)
    .filter('extractItems', extractItems);

  extractPanels.$inject = ['merlin.utils'];
  extractRows.$inject = ['merlin.utils'];
  extractItems.$inject = ['merlin.utils'];

  function extractPanels(utils) {
    var panelProto = {
      create: function(items) {
        if ( angular.isArray(items) && !items.length ) {
          return null;
        }
        var permanentPanel = !items[0].hasID();
        var self = this;
        if (permanentPanel) {
          this.items = items;
          this.id = items.reduce(function(prevId, item) {
            return item.uid() + prevId;
          }, '');
        } else {
          this._barricadeObj = items[0];
          this.id = this._barricadeObj.uid();
          this.items = this._barricadeObj.getKeys().map(function(key) {
            //return self._barricadeObj.get(key);
            return utils.enhanceItemWithID(self._barricadeObj.get(key), key);
          });
          this.removable = true;
        }
        return this;
      },
      title: function() {
        var newID;
        if ( this._barricadeObj ) {
          if ( arguments.length ) {
            newID = arguments[0];
            this._barricadeObj.setID(newID);
          } else {
            return this._barricadeObj.getID();
          }
        }
      },
      remove: function() {
        this._barricadeObj.emit('change', 'remove');
      }
    };

    return _.memoize(function(container, keyExtractor) {
      var items = [];
      var data = {};
      var panels = [];

      function rec(container) {
        container.each(function(indexOrKey, item) {
          var groupingKey = keyExtractor(item, container);
          if (angular.isNumber(groupingKey)) {
            items.push(item);
            data[item.uid()] = {
              groupingKey: groupingKey,
              container: container,
              indexOrKey: indexOrKey
            };
          } else {
            rec(item);
          }
        });
      }

      rec(container);

      function extractKey(item) {
        return angular.isDefined(item) && data[item.uid()].groupingKey;
      }

      utils.groupByExtractedKey(items, extractKey).forEach(function(items) {
        panels.push(Object.create(panelProto).create(items));
      });
      return utils.condense(panels);
    }, function(container) {
      var hash = '';
      container.each(function(key, item) {
        if (item.instanceof(Barricade.Container)) {
          item.each(function(id, item) {
            hash += item.uid();
          })
        } else {
          hash += item.uid();
        }
      });
      return hash;
    });
  }

  function extractRows(utils) {
    function getItems(panelOrContainer) {
      if ( panelOrContainer.items ) {
        return panelOrContainer.items;
      } else if ( panelOrContainer.getKeys ) {
        return panelOrContainer.getKeys().map(function(key) {
          return panelOrContainer.get(key);
        });
      } else {
        return panelOrContainer.getIDs().map(function(id) {
          return panelOrContainer.getByID(id);
        });
      }
    }

    return _.memoize(function(panel) {
      var rowProto = {
          create: function(items) {
            this.id = items[0].uid();
            this.index = items.row;
            this.items = items.slice();
            return this;
          }
        };

      return utils.groupByMetaKey(getItems(panel), 'row').map(function(items) {
        return Object.create(rowProto).create(items);
      });
    }, function(panel) {
      var hash = '';
      getItems(panel).forEach(function(item) {
        hash += item.uid();
      });
      return hash;
    });
  }

  function extractItems(utils) {
    return _.memoize(function(row) {
      return row.items.sort(function(item1, item2) {
        return utils.getMeta(item1, 'index') - utils.getMeta(item2, 'index');
      });
    }, function(row) {
      var hash = '';
      row.items.forEach(function(item) {
        hash += item.uid();
      });
      return hash;
    });
  }
})();
