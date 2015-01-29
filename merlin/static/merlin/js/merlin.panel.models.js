/**
 * Created by tsufiev on 2/24/15.
 */
(function(){
  angular.module('hz')

    .factory('merlin.panel.models', ['merlin.utils', function(utils) {
      var rowProto = {
        create: function(items) {
          this.id = utils.getNewId();
          this.index = items.row;
          items = items.slice();
          this._items = items.sort(function(item1, item2) {
            return utils.getMeta(item1, 'index') - utils.getMeta(item2, 'index');
          });
          return this;
        },
        getItems: function() {
          return this._items;
        }
      };

      var panelMixin = Barricade.Blueprint.create(function (schema) {
        var self = this,
          panelProto = {
            create: function(itemsOrContainer, id) {
              if ( angular.isArray(itemsOrContainer) && !itemsOrContainer.length ) {
                return null;
              }
              this.id = utils.getNewId();
              if ( angular.isArray(itemsOrContainer) ) {
                this._items = itemsOrContainer;
              } else {
                this._barricadeContainer = itemsOrContainer;
                this._barricadeId = id;
                var barricadeObj = itemsOrContainer.getByID(id);
                this._items = barricadeObj.getKeys().map(function(key) {
                  return utils.enhanceItemWithID(barricadeObj.get(key), key);
                });
                this.removable = true;
              }
              return this;
            },
            getTitle: function() {
              if ( this._barricadeContainer ) {
                return this._barricadeContainer.getByID(this._barricadeId).get('name');
              }
            },
            getRows: function() {
              if ( this._rows === undefined ) {
                this._rows = utils.groupByMetaKey(this._items, 'row').map(function(items) {
                  return Object.create(rowProto).create(items);
                });
              }
              return this._rows;
            },
            remove: function(id) {
              for ( var i = 0; i < panels.length; i++ ) {
                if ( panels[i].id === id ) {
                  var container = this._barricadeContainer;
                  container.remove.call(container, this._barricadeId);
                  panels.splice(i, 1);
                  break;
                }
              }
            }
          },
          panels;

        this.getPanels = function(filterKey) {
          if ( panels === undefined ) {
            panels = [];
            var items = self._getContents();
            utils.groupByMetaKey(items, 'panelIndex').forEach(function(items) {
              // check for 'actions' and 'workflows' containers
              if ( items[0].instanceof(Barricade.MutableObject) ) {
                items[0].getIDs().forEach(function(id) {
                  panels.push(Object.create(panelProto).create(items[0], id));
                });
              } else {
                panels.push(Object.create(panelProto).create(items));
              }
            });
            panels = panels.condense();
          }
          if ( filterKey ) {
            panels.filter(function(panel) {
              return panel._barricadeId && panel._barricadeId.match(filterKey);
            })
          }
          return panels;
        };

        this.addPanel = function(barricadeContainer, itemID, panelIndex) {
          var panel = Object.create(panelProto).create(barricadeContainer, itemID);
          if ( panelIndex ) {
            panels.splice(panelIndex, 0, panel);
          }else {
            panels.push(panel);
          }
        };
        return this;
      });

      var rowMixin = Barricade.Blueprint.create(function() {
        var self = this,
          items = self._getContents(),
          rows;

        self.getRows = function() {
          if ( rows === undefined ) {
            rows = utils.groupByMetaKey(items, 'row').map(function(items) {
              return Object.create(rowProto).create(items);
            });
          }
          return rows;
        };
        self.on('change', function(op) {
          console.log(arguments);
          if ( op == 'add' ) {
            var items = self._getContents();
            utils.groupByMetaKey(items, 'row').forEach(function(items) {
              rows.push(Object.create(rowProto).create(items));
            })
          } else if ( op == 'remove' ) {
          }
        });
      });

      var groupMixin = Barricade.Blueprint.create(function() {
        var self = this,
          additive = utils.getMeta(self, 'additive');

        rowMixin.call(self);
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
        panelmixin: panelMixin,
        groupmixin: groupMixin,
        rowmixin: rowMixin
      }
    }])
})();