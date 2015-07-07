
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
      create: function(itemsOrContainer, id) {
        if ( angular.isArray(itemsOrContainer) && !itemsOrContainer.length ) {
          return null;
        }
        if ( angular.isArray(itemsOrContainer) ) {
          this.items = itemsOrContainer;
          this.id = itemsOrContainer.reduce(function(prevId, item) {
            return item.uid() + prevId;
          }, '');
        } else {
          this._barricadeContainer = itemsOrContainer;
          this._barricadeId = id;
          var barricadeObj = itemsOrContainer.getByID(id);
          this.id = barricadeObj.uid();
          this.items = barricadeObj.getKeys().map(function(key) {
            return utils.enhanceItemWithID(barricadeObj.get(key), key);
          });
          this.removable = true;
        }
        return this;
      },
      title: function() {
        var newID;
        if ( this._barricadeContainer ) {
          if ( arguments.length ) {
            newID = arguments[0];
            this._barricadeContainer.getByID(this._barricadeId).setID(newID);
            this._barricadeId = newID;
          } else {
            return this._barricadeId;
          }
        }
      },
      remove: function() {
        var container = this._barricadeContainer;
        var pos = container.getPosByID(this._barricadeId);
        container.remove(pos);
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
      var items = container._getContents();
      var panels = [];
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
