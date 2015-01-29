
(function() {
  angular.module('hz')

    .factory('merlin.field.models', ['merlin.utils', function(utils) {


      var modelMixin = Barricade.Blueprint.create(function() {
        var _type, _title;
        this.value = function() {
          if ( !arguments.length ) {
            return this.get();
          } else {
            this.set(arguments[0]);
          }
        };
        this.id = utils.getNewId();
        this.getType = function() {
          if ( _type === undefined ) {
            if ( this.instanceof(textModel) ) {
              _type = 'text';
            } else if ( this.instanceof(stringModel) ) {
              _type = 'string';
            } else if ( this.instanceof(numberModel) ) {
              _type = 'number';
            } else if ( this.instanceof(listModel) ) {
              _type = 'list';
            } else if ( this.instanceof(frozendictModel) ) {
              _type = 'frozendict';
            } else if ( this.instanceof(dictionaryModel) ) {
              _type = 'dictionary';
            }
          }
          return _type;
        };
        this.isAtomic = function() {
          return ['number', 'string', 'text'].indexOf(this.getType()) > -1;
        };
        this.getTitle = function() {
          if ( _title === undefined ) {
            _title = utils.getMeta(this, 'title') || (this.hasID() ? utils.makeTitle(this.getID()) : '');
          }
          return _title;
        };

        return this;
      });

      var stringModel = Barricade.Primitive.extend({
        create: function(json, parameters) {
          var self = Barricade.Primitive.create.call(this, json, parameters);
          return modelMixin.call(self);
        }
      }, {'@type': String});

      var textModel = Barricade.Primitive.extend({
        create: function(json, parameters) {
          var self = Barricade.Primitive.create.call(this, json, parameters);
          return modelMixin.call(self);
        }
      }, {'@type': String});

      var numberModel = Barricade.Primitive.extend({
        create: function(json, parameters) {
          var self = Barricade.Primitive.create.call(this, json, parameters);
          return modelMixin.call(self);
        }
      }, {'@type': Number});

      var listModel = Barricade.Array.extend({
        create: function(json, parameters) {
          var self = Barricade.Array.create.call(this, json, parameters);

          modelMixin.call(self);

          self.add = function() {
            self.push();
          };
          self.getValues = function() {
            return self.toArray();
          };
          return self;
        }
      }, {'@type': Array});

      var frozendictModel = Barricade.ImmutableObject.extend({
        create: function(json, parameters) {
          var self = Barricade.ImmutableObject.create.call(this, json, parameters);

          modelMixin.call(self);

          self.getValues = function() {
            return self._data;
          };
          return self;
        }
      }, {'@type': Object});

      var dictionaryModel = Barricade.MutableObject.extend({
        create: function(json, parameters) {
          var self = Barricade.MutableObject.create.call(this, json, parameters),
            _items = {};

          modelMixin.call(self);

          self.add = function() {
            var newID = 'key' + utils.getNextIDSuffix(self, /(key)([0-9]+)/);
            self.push('', {id: newID});
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
          self.remove = function(key) {
            delete _items[key];
            Barricade.MutableObject.remove.call(self, self.getPosByID(key));
          };
          return self;
        }
      }, {'@type': Object});

      return {
        string: stringModel,
        text: textModel,
        number: numberModel,
        list: listModel,
        dictionary: dictionaryModel,
        frozendict: frozendictModel
      };
    }])
})();