
(function() {
  'use strict';

  angular.module('merlin')
    .factory('merlin.field.models',
    ['merlin.utils', 'merlin.panel.models', '$http', function(utils, panels, $http) {

      var wildcardMixin = Barricade.Blueprint.create(function() {
        return this;
      });

      var restrictedChoicesMixin = Barricade.Blueprint.create(function() {
        var values = this.getEnumValues(),
          labels = this.getEnumLabels(),
          items = {};

        values.forEach(function(value, index) {
          items[value] = labels[index];
        });

        this.getLabel = function(value) {
          return items[value];
        };

        this.getValues = function() {
          return values;
        };

        this.setType('choices');
        return this;
      });

      var modelMixin = Barricade.Blueprint.create(function(type) {
        this.value = function() {
          if ( !arguments.length ) {
            return this.get();
          } else {
            this.set(arguments[0]);
          }
        };
        this.id = utils.getNewId();

        this.getType = function() {
          return type;
        };

        this.setType = function(_type) {
          type = _type;
        };

        this.isAtomic = function() {
          return ['number', 'string', 'text', 'choices'].indexOf(this.getType()) > -1;
        };
        this.getTitle = function() {
          var title = utils.getMeta(this, 'title');
          if ( !title ) {
            if ( this.instanceof(Barricade.ImmutableObject) ) {
              if ( this.getKeys().indexOf('name') > -1 ) {
                return this.get('name').get();
              }
            }
            title = utils.makeTitle(this.getID()) || '';
          }
          return title;
        };
        wildcardMixin.call(this);
        if ( this.getEnumValues ) {
          restrictedChoicesMixin.call(this);
        }
        var autocompletionUrl = utils.getMeta(this, 'autocompletionUrl');
        if ( autocompletionUrl ) {
          autoCompletionMixin.call(this, autocompletionUrl);
        }
        return this;
      });

      function meldGroup() {
        if ( utils.getMeta(this, 'group') ) {
          panels.groupmixin.call(this);
        }
      }

      var stringModel = Barricade.Primitive.extend({
        create: function(json, parameters) {
          var self = Barricade.Primitive.create.call(this, json, parameters);
          return modelMixin.call(self, 'string');
        }
      }, {'@type': String});

      var autoCompletionMixin = Barricade.Blueprint.create(function(url) {
        var suggestions = [];

        $http.get(url).success(function(data) {
          suggestions = data;
        });

        this.getSuggestions = function() {
          return suggestions;
        };

        return this;
      });

      var textModel = Barricade.Primitive.extend({
        create: function(json, parameters) {
          var self = Barricade.Primitive.create.call(this, json, parameters);
          return modelMixin.call(self, 'text');
        }
      }, {'@type': String});

      var numberModel = Barricade.Primitive.extend({
        create: function(json, parameters) {
          var self = Barricade.Primitive.create.call(this, json, parameters);
          return modelMixin.call(self, 'number');
        }
      }, {'@type': Number});

      var listModel = Barricade.Array.extend({
        create: function(json, parameters) {
          var self = Barricade.Array.create.call(this, json, parameters);

          modelMixin.call(self, 'list');

          self.add = function() {
            self.push();
          };
          self.getValues = function() {
            return self.toArray();
          };
          self._getContents = function() {
            return self.toArray();
          };
          meldGroup.call(self);
          return self;
        }
      }, {'@type': Array});

      var frozendictModel = Barricade.ImmutableObject.extend({
        create: function(json, parameters) {
          var self = Barricade.ImmutableObject.create.call(this, json, parameters);
          self.getKeys().forEach(function(key) {
            utils.enhanceItemWithID(self.get(key), key);
          });

          modelMixin.call(self, 'frozendict');
          self.getValues = function() {
            return self._data;
          };
          self._getContents = function() {
            return self.getKeys().map(function(key) {
              return self.get(key);
            })
          };
          panels.rowmixin.call(self);
          meldGroup.call(self);
          return self;
        }
      }, {'@type': Object});

      var dictionaryModel = Barricade.MutableObject.extend({
        create: function(json, parameters) {
          var self = Barricade.MutableObject.create.call(this, json, parameters),
            _items = {},
            _elClass = self._elementClass,
            baseKey = utils.getMeta(_elClass, 'baseKey') || 'key',
            baseName = utils.getMeta(_elClass, 'baseName') || utils.makeTitle(baseKey);

          modelMixin.call(self, 'dictionary');

          self.add = function(newID) {
            var newValue;
            newID = newID || baseKey + utils.getNextIDSuffix(self, /(key)([0-9]+)/);
            if ( _elClass.instanceof(Barricade.ImmutableObject) ) {
              if ( 'name' in _elClass._schema ) {
                var nameNum = utils.getNextIDSuffix(self, new RegExp('(' + baseName + ')([0-9]+)'));
                newValue = {name: baseName + nameNum};
              } else {
                newValue = {};
              }
            } else { // usually, it's either frozendict inside or string
              newValue = '';
            }
            self.push(newValue, {id: newID});
            _items[newID] = self.getByID(newID);
          };
          self.getValues = function() {
            if ( !Object.keys(_items).length ) {
              self.getIDs().forEach(function(id) {
                _items[id] = self.getByID(id);
              });
            }
            return _items;
          };
          self._getContents = function() {
            return self.toArray();
          };
          self.remove = function(key) {
            delete _items[key];
            Barricade.MutableObject.remove.call(self, self.getPosByID(key));
          };
          meldGroup.call(self);
          return self;
        }
      }, {'@type': Object});

      var directedDictionaryModel = dictionaryModel.extend({
        create: function(json, parameters) {
          var self = dictionaryModel.create.call(this, json, parameters);
          self.setType('frozendict');
          return self;
        },
        setSchema: function(keys) {
          var self = this;
          self.getIDs().forEach(function(oldKey) {
            self.remove(oldKey);
          });
          keys.forEach(function(newKey) {
            self.add(newKey);
          });
        }
      }, {
        '?': {'@type': String}
      });

      return {
        string: stringModel,
        text: textModel,
        number: numberModel,
        list: listModel,
        dictionary: dictionaryModel,
        frozendict: frozendictModel,
        directeddictionary: directedDictionaryModel,
        autocompletion: autoCompletionMixin,
        wildcard: wildcardMixin // use for most general type-checks
      };
    }])

})();