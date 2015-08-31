
(function() {
  'use strict';

  angular
    .module('merlin')
    .factory('merlin.field.models', merlinFieldModels);

  merlinFieldModels.$inject = ['merlin.utils'];

  function merlinFieldModels(utils) {
    var viewChoicesMixin = Barricade.Blueprint.create(function() {
      var self = this;
      var dropDownLimit = this._dropDownLimit || 5;
      var values, labels, items, isDropDown;

      function fillItems() {
        values = self.getEnumValues();
        labels = self.getEnumLabels();
        items = {};

        if (values) {
          values.forEach(function (value, index) {
            items[value] = labels[index];
          });
        }
      }

      this.getLabel = function(value) {
        if ( angular.isUndefined(values) ) {
          fillItems();
        }
        return items[value];
      };

      this.getValues = function() {
        if ( angular.isUndefined(values) ) {
          fillItems();
        }
        return values;
      };

      this.resetValues = function() {
        values = undefined;
      };

      this.isDropDown = function() {
        // what starts its life as being dropdown / not being dropdown
        // should remain so forever
        if ( angular.isUndefined(isDropDown) ) {
          isDropDown = !this.isEmpty() && this.getValues().length < dropDownLimit;
        }
        return isDropDown;
      };

      this.setType('choices');
      return this;
    });

    /* Html renderer helper. The main idea is that fields with simple (or plain)
    structure (i.e. Atomics = string | number | text | boolean and list or
    dictionary containing just Atomics) could be rendered in one column, while
    fields with non plain structure should be rendered in two columns.
     */
    var plainStructureMixin = Barricade.Blueprint.create(function() {
      this.isPlainStructure = function() {
        if (this.getType() == 'frozendict') {
          return false;
        }
        if (!this.instanceof(Barricade.Arraylike) || !this.length()) {
          return false;
        }
        return !this.get(0).instanceof(Barricade.Container);
      };
      return this;
    });

    var modelMixin = Barricade.Blueprint.create(function(type) {
      var isValid = true;
      var isValidatable = false;
      this.value = function() {
        if ( !arguments.length ) {
          if ( isValidatable ) {
            return isValid ? this.get() : undefined;
          } else {
            return this.get();
          }
        } else {
          this.set(arguments[0]);
          isValid = !this.hasError();
        }
      };
      this.id = utils.getNewId();

      this.getType = function() {
        return type;
      };

      this.setValidatable = function(validatable) {
        isValidatable = validatable;
      };

      this.setType = function(_type) {
        type = _type;
      };

      this.isAdditive = function() {
        return this.instanceof(Barricade.Arraylike);
      };

      this.isAtomic = function() {
        return !this.instanceof(Barricade.Container);
      };
      this.title = function() {
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
      if ( this.getEnumValues ) {
        viewChoicesMixin.call(this);
      }
      return this;
    });

    var stringModel = Barricade.Base.extend({
      create: function(json, parameters) {
        var self = Barricade.Base.create.call(this, json, parameters);
        return modelMixin.call(self, 'string');
      }
    }, {'@type': String});

    var textModel = Barricade.Base.extend({
      create: function(json, parameters) {
        var self = Barricade.Base.create.call(this, json, parameters);
        return modelMixin.call(self, 'text');
      }
    }, {'@type': String});

    var numberModel = Barricade.Base.extend({
      create: function(json, parameters) {
        var self = Barricade.Base.create.call(this, json, parameters);
        return modelMixin.call(self, 'number');
      }
    }, {'@type': Number});

    var listMixin = Barricade.Blueprint.create(function() {
      var self = this;
      modelMixin.call(self, 'list');

      self.add = function() {
        self.push(undefined, self._parameters);
      };
      plainStructureMixin.call(self);
      return self;
    });

    var listModel = Barricade.Base.extend({
      create: function(json, parameters) {
        var self = Barricade.Base.create.call(this, json, parameters);
        if (!self.instanceof(Barricade.Array)) {
          Barricade.Array.call(self);
        }
        return listMixin.call(self);
      }
    }, {'@type': Array});

    var frozendictModel = Barricade.Base.extend({
      create: function(json, parameters) {
        var self = Barricade.Base.create.call(this, json, parameters);
        if (!self.instanceof(Barricade.ImmutableObject)) {
          Barricade.ImmutableObject.call(self);
        }
        return frozendictMixin.call(self);
      }
    }, {'@type': Object});

    var frozendictMixin = Barricade.Blueprint.create(function() {
      var self = this;
      modelMixin.call(self, 'frozendict');
      plainStructureMixin.call(self);
      return self;
    });

    var dictionaryMixin = Barricade.Blueprint.create(function() {
      var self = this;
      var _elClass = self.schema().keyClass(self._elSymbol);
      var baseKey = utils.getMeta(_elClass, 'baseKey') || 'key';
      var baseName = utils.getMeta(_elClass, 'baseName') || utils.makeTitle(baseKey);

      modelMixin.call(self, 'dictionary');
      plainStructureMixin.call(self);

      function initKeyAccessor(value) {
        value.keyValue = function () {
          if ( arguments.length ) {
            value.setID(arguments[0]);
          } else {
            return value.getID();
          }
        };
      }

      self.each(function(key, value) {
        initKeyAccessor(value);
      }).on('change', function(op, index) {
        if (op === 'add' || op === 'set') {
          initKeyAccessor(self.get(index));
        }
      });

      self.add = function(newID) {
        var regexp = new RegExp('(' + baseKey + ')([0-9]+)');
        var newValue;
        newID = newID || baseKey + utils.getNextIDSuffix(self, regexp);
        if ( _elClass.instanceof(Barricade.ImmutableObject) ) {
          if ( 'name' in _elClass._schema ) {
            var nameNum = utils.getNextIDSuffix(self, regexp);
            newValue = {name: baseName + nameNum};
          } else {
            newValue = {};
          }
        } else { // usually, it's either frozendict inside or string
          newValue = '';
        }
        self.push(newValue, utils.extend(self._parameters, {id: newID}));
      };
      self.empty = function() {
        for ( var i = this._data.length; i > 0; i-- ) {
          self.remove(i - 1);
        }
      };
      self.resetKeys = function(keys) {
        self.empty();
        keys.forEach(function(key) {
          self.push(undefined, {id: key});
        });
      };
      self.removeItem = function(key) {
        self.remove(self.getPosByID(key));
      };
      return self;
    });

    var dictionaryModel = Barricade.Base.extend({
      create: function(json, parameters) {
        var self = Barricade.Base.create.call(this, json, parameters);
        if (!self.instanceof(Barricade.MutableObject)) {
          Barricade.MutableObject.call(self);
        }
        return dictionaryMixin.call(self);
      }
    }, {'@type': Object});

    var linkedCollectionModel = stringModel.extend({
        create: function(json, parameters) {
          var self = stringModel.create.call(this, json, parameters);
          var collectionCls = Barricade.create({
              '@type': String,
              '@ref': {
                to: function() {
                  return parameters.toCls;
                },
                needs: function() {
                  return parameters.neededCls;
                },
                getter: function(data) {
                  return data.needed.get(parameters.substitutedEntryID);
                }
              }
            });

          self._collection = collectionCls.create().on(
            'replace', function(newValue) {
              self._collection = newValue;
              self._collection.on('change', function() {
                self._choices = self._collection.getIDs();
                self.resetValues();
              });
              self._collection.emit('change');
            });

          return self;
        },
        _choices: []
      }, {
        '@enum': function() {
          if ( this._collection.isPlaceholder() ) {
            this.emit('_resolveUp', this._collection);
          }
          return this._choices;
        }
      }
    );

    function applyMixins(field) {
      var type;
      if (!field.instanceof(modelMixin)) {
        if (field.instanceof(Barricade.ImmutableObject)) {
          frozendictMixin.call(field);
        } else if (field.instanceof(Barricade.MutableObject)) {
          dictionaryMixin.call(field);
        } else if (field.instanceof(Barricade.Array)) {
          listMixin.call(field);
        } else if (field.instanceof(Barricade.Base)) {
          type = Barricade.getType(field.get());
          if (type === String) {
            if (utils.getMeta(field, 'widget') === 'text') {
              modelMixin.call(field, 'text');
            } else {
              modelMixin.call(field, 'string');
            }
          } else if (type === Number) {
            modelMixin.call(field, 'number');
          }
        }
      }
      return field;
    }

    return {
      string: stringModel,
      text: textModel,
      number: numberModel,
      list: listModel,
      listmixin: listMixin,
      frozendictmixin: frozendictMixin,
      dictionarymixin: dictionaryMixin,
      linkedcollection: linkedCollectionModel,
      dictionary: dictionaryModel,
      frozendict: frozendictModel,
      applyMixins: applyMixins,
      generic: modelMixin // use for most general type-checks
    };
  }
})();
