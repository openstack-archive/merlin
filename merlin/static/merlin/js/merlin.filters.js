
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
    .filter('makeTitle', makeTitle)
    .filter('chunks', chunks);

  extractPanels.$inject = ['merlin.utils'];
  extractFields.$inject = ['merlin.utils'];
  makeTitle.$inject = ['merlin.utils'];

  function makeTitle(utils) {
    return function(label, field) {
      if (angular.isNumber(+label)) {
        return field.title();
      } else {
        return utils.makeTitle(label);
      }
    }
  }

  function extractPanels(utils) {
    var panelProto = {
      create: function(enumerator, obj) {
        this.obj = obj;
        this.enumerator = enumerator;
        if (this.obj) {
          this.id = this.obj.uid();
          this.removable = true;
        } else {
          var id = '';
          enumerator(function(key, item) {
            id += item.uid();
          });
          this.id = id;
        }
        return this;
      },
      title: function() {
        var newID;
        if (this.obj) {
          if ( arguments.length ) {
            newID = arguments[0];
            this.obj.setID(newID);
          } else {
            return this.obj.getID();
          }
        }
      },
      each: function(callback, comparator) {
        this.enumerator.call(this.obj, callback, comparator);
      },
      remove: function() {
        this.obj.emit('change', 'removerequest');
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
          } else {
            rec(item);
          }
        });
      }

      rec(container);

      function extractKey(item) {
        return angular.isDefined(item) && _data[item.uid()].groupingKey;
      }

      utils.groupByExtractedKey(items, extractKey).forEach(function(items) {
        var parent, enumerator, obj;
        if (items.length > 1) {
          parent = _data[items[0].uid()].container;
          enumerator = function(callback) {
            items.forEach(function(item) {
              if (_data[item.uid()].container === parent) {
                callback(_data[item.uid()].indexOrKey, item);
              }
            })
          }
        } else {
          obj = items[0];
          enumerator = obj.each;
        }
        panels.push(Object.create(panelProto).create(enumerator, obj));
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

  function extractFields(utils) {
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
        hash += fields[key].uid();
      }
      return hash;
    });
  }

})();
