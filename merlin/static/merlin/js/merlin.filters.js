
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
    .filter('extractFields', extractFields)
    .filter('chunks', chunks);

  extractPanels.$inject = ['merlin.utils'];

  function extractPanels(utils) {
    var panelProto = {
      create: function(enumerator, obj, context) {
        this.$$obj = obj;
        this.$$enumerator = enumerator;
        this.removable = false;
        if (this.$$obj) {
          this.id = this.$$obj.uid();
          this.$$objParent = context.container;
          this.removable = this.$$objParent.instanceof(Barricade.Arraylike);
          if (this.$$objParent.instanceof(Barricade.MutableObject)) {
            this.title = function() {
              if ( arguments.length ) {
                this.$$obj.setID(arguments[0]);
              } else {
                return this.$$obj.getID();
              }
            };
          } else if (this.$$objParent.instanceof(Barricade.ImmutableObject)) {
            this.title = context.indexOrKey;
          }
        } else {
          var id = '';
          this.$$enumerator(function(key, item) {
            id += item.uid();
          });
          this.id = id;
        }
        return this;
      },
      each: function(callback, comparator) {
        this.$$enumerator.call(this.$$obj, callback, comparator);
      },
      remove: function() {
        var index;
        if (this.removable) {
          index = this.$$objParent.toArray().indexOf(this.$$obj);
          this.$$objParent.remove(index);
        }
      }
    };

    return _.memoize(function(container, keyExtractor) {
      var items = [];
      var _data = {};
      var panels = [];

      function rec(container) {
        container.each(function(indexOrKey, item) {
          var groupingKey = keyExtractor(item, container);
          if (angular.isNumber(groupingKey)) {
            items.push(item);
            _data[item.uid()] = {
              groupingKey: groupingKey,
              container: container,
              indexOrKey: indexOrKey
            };
          } else if (item.instanceof(Barricade.Container)) {
            rec(item);
          }
        });
      }

      rec(container);

      function extractKey(item) {
        return angular.isDefined(item) && _data[item.uid()].groupingKey;
      }

      utils.groupByExtractedKey(items, extractKey).forEach(function(items) {
        var parent, enumerator, obj, context;
        if (items.length > 1 || !items[0].instanceof(Barricade.Container)) {
          parent = _data[items[0].uid()].container;
          enumerator = function(callback) {
            items.forEach(function(item) {
              if (_data[item.uid()].container === parent) {
                callback(_data[item.uid()].indexOrKey, item);
              }
            });
          };
        } else {
          obj = items[0];
          enumerator = obj.each;
          context = _data[obj.uid()];
        }
        panels.push(Object.create(panelProto).create(enumerator, obj, context));
      });
      return utils.condense(panels);
    }, function(container, keyExtractor) {
      var hash = '';
      function rec(container) {
        container.each(function(indexOrKey, item) {
          var groupingKey = keyExtractor(item, container);
          if (angular.isNumber(groupingKey)) {
            hash += item.uid();
          } else if (item.instanceof(Barricade.Container)) {
            rec(item);
          }
        });
      }
      rec(container);
      return hash;
    });
  }

  function extractFields() {
    return _.memoize(function(container) {
      var fields = {};
      container.each(function(key, item) {
        fields[key] = item;
      });
      return fields;
    }, function(panel) {
      var hash = '';
      panel.each(function(key, item) {
        hash += item.uid();
      });
      return hash;
    });
  }

  function chunks() {
    return _.memoize(function(fields, itemsPerChunk) {
      var chunks = [];
      var keys = Object.keys(fields);
      var i, j, chunk;
      itemsPerChunk = +itemsPerChunk;
      if (!angular.isNumber(itemsPerChunk) || itemsPerChunk < 1) {
        return chunks;
      }
      for (i = 0; i < keys.length; i++) {
        chunk = {};
        for (j = 0; j < itemsPerChunk; j++) {
          chunk[keys[i]] = fields[keys[i]];
        }
        chunks.push(chunk);
      }
      return chunks;
    }, function(fields) {
      var hash = '';
      var key;
      for (key in fields) {
        if (fields.hasOwnProperty(key)) {
          hash += fields[key].uid();
        }
      }
      return hash;
    });
  }

})();
