
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
  angular.module('merlin')

    .filter('extractPanels', ['merlin.utils', function(utils) {
      var panelProto = {
        create: function(itemsOrContainer, id) {
          if ( angular.isArray(itemsOrContainer) && !itemsOrContainer.length ) {
            return null;
          }
          this.id = utils.getNewId();
          if ( angular.isArray(itemsOrContainer) ) {
            this.items = itemsOrContainer;
          } else {
            this._barricadeContainer = itemsOrContainer;
            this._barricadeId = id;
            var barricadeObj = itemsOrContainer.getByID(id);
            this.items = barricadeObj.getKeys().map(function(key) {
              return utils.enhanceItemWithID(barricadeObj.get(key), key);
            });
            this.removable = true;
          }
          return this;
        },
        title: function() {
          var entity;
          if ( this._barricadeContainer ) {
            entity = this._barricadeContainer.getByID(this._barricadeId).get('name');
            if ( arguments.length ) {
              entity.set(arguments[0]);
            } else {
              return entity.get();
            }
          }
        },
        remove: function() {
          var container = this._barricadeContainer;
          container.remove.call(container, this._barricadeId);
        }
      };

      function isPanelsRoot(item) {
        try {
          // check for 'actions' and 'workflows' containers
          return item.instanceof(Barricade.MutableObject);
        }
        catch(err) {
          return false;
        }
      }

      function extractPanelsRoot(items) {
        return isPanelsRoot(items[0]) ? items[0] : null;
      }

      return _.memoize(function(container) {
        var items = container._getContents(),
          panels = [];
        utils.groupByMetaKey(items, 'panelIndex').forEach(function(items) {
          var panelsRoot = extractPanelsRoot(items);
          if ( panelsRoot ) {
            panelsRoot.getIDs().forEach(function(id) {
              panels.push(Object.create(panelProto).create(panelsRoot, id));
            });
          } else {
            panels.push(Object.create(panelProto).create(items));
          }
        });
        return panels.condense();
      }, function(container) {
        var hash = '';
        container.getKeys().map(function(key) {
          var item = container.get(key);
          if ( isPanelsRoot(item) ) {
            item.getIDs().forEach(function(id) {
              hash += item.getByID(id).uid();
            });
          }
        });
        return hash;
      });
    }])

    .filter('extractRows', ['merlin.utils', function(utils) {
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
              this.id = utils.getNewId();
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
      })
    }])

    .filter('extractItems', ['merlin.utils', function(utils) {
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
      })
    }])

})();
