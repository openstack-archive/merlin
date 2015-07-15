
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
describe('merlin models:', function() {
  'use strict';

  var fields;

  beforeEach(function() {
    module('merlin');

    inject(function($injector) {
      fields = $injector.get('merlin.field.models');
    })
  });

  describe('dictionary field', function() {
    var dictObj;

    beforeEach(function() {
      dictObj = fields.dictionary.extend({}, {
        '?': {
          '@class': fields.string
        }
      }).create({'id1': 'string1', 'id2': 'string2'});
    });

    function getValueFromCache(id) {
      var value = undefined;
      dictObj.getValues().forEach(function(item) {
        if ( item.getID() === id ) {
          value = item;
        }
      });
      return value;
    }

    describe('add() method', function() {
      it('adds an empty value with given key', function() {
        dictObj.add('id3');

        expect(dictObj.getByID('id3').get()).toBe('');
      });

      it('keyValue() getter/setter can be used for added values', function() {
        var value;

        dictObj.add('id3');
        value = dictObj.getByID('id3');

        expect(value.keyValue()).toBe('id3');

        value.keyValue('id4');
        expect(value.keyValue()).toBe('id4');
        expect(dictObj.getByID('id4')).toBeDefined();
      });

      it('updates name automatically if baseName and baseKey are provided', function() {
        var nestedDictObj = fields.dictionary.extend({}, {
          '?': {
            '@class': fields.frozendict.extend({}, {
              'name': {
                '@class': fields.string
              },
              '@meta': {
                'baseName': 'Action ',
                'baseKey': 'action'
              }
            })
          }
        }).create({'action1': {'name': "Action 1"}});

        nestedDictObj.add('action2');

        expect(nestedDictObj.getByID('action2').get('name').get()).toEqual('Action 2');
      })
    });

    describe('empty() method', function() {
      it('removes all entries in model', function() {
        dictObj.empty();

        expect(dictObj.getIDs().length).toBe(0);
      })
    });

    describe('resetKeys() method', function() {
      it('re-sets dictionary contents to given keys', function() {
        dictObj.resetKeys(['key1', 'key2']);

        expect(dictObj.getIDs()).toEqual(['key1', 'key2']);
        expect(dictObj.getByID('key1').get()).toBe('');
        expect(dictObj.getByID('key2').get()).toBe('');
      })
    });

    describe('removeItem() method', function() {
      it('removes dictionary entry by key from model', function() {
        dictObj.removeItem('id1');

        expect(dictObj.getByID('id1')).toBeUndefined();
      })
    });

  });

  describe('linkedCollection field', function() {
    var collectionCls, linkedObjCls, linkedObj, lnkField;

    beforeEach(function() {
      collectionCls = fields.dictionary.extend({}, {
        '?': {
          '@class': fields.string
        }
      });
      linkedObjCls = fields.frozendict.extend({}, {
        'realCollection': {
          '@class': collectionCls
        },
        'linkedField': {
          '@class': fields.linkedcollection.extend({
            create: function(json, parameters) {
              parameters = Object.create(parameters);
              parameters.toCls = collectionCls;
              parameters.neededCls = linkedObjCls;
              parameters.substitutedEntryID = 'realCollection';
              return fields.linkedcollection.create.call(this, json, parameters);
            },
            _dropDownLimit: 4
          })
        }
      });
      linkedObj = linkedObjCls.create({'realCollection': {'a': '', 'b': ''}});
      lnkField = linkedObj.get('linkedField');
    });

    it('provides access from @enum values of one field to IDs of another one', function() {
      expect(lnkField.getValues()).toEqual(['a', 'b']);

      linkedObj.get('realCollection').add('c');
      expect(lnkField.getValues()).toEqual(['a', 'b', 'c']);
    });

    describe('and exposes _collection attribute', function() {
      it('in case more complex things need to be done', function() {
        expect(lnkField._collection).toBeDefined();
      });

      it("which is truly initialized after first @enum's .getValues() call", function() {
        expect(lnkField._collection.isPlaceholder()).toBe(true);

        lnkField.getValues();
        expect(lnkField._collection.isPlaceholder()).toBe(false);
        expect(lnkField._collection).toBe(linkedObj.get('realCollection'));
      });
    });

    describe('exposes .isDropDown() call due to @enum presense', function() {
      it('which always returns false due to deferred nature of linkedField', function() {
        expect(lnkField.isDropDown()).toBe(false);

        lnkField.getValues();
        expect(lnkField.isDropDown()).toBe(false);
      });
    });
  });
});