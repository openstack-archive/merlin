
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

    function getCacheIDs() {
      return dictObj.getValues().map(function(item) {
        return item.getID();
      });
    }

    describe('getValues() method', function() {
      it('caching works from the very beginning', function() {
        expect(getCacheIDs()).toEqual(['id1', 'id2']);
      });

      it('keyValue() getter/setter can be used from the start', function() {
        var value = getValueFromCache('id1');

        expect(value.keyValue()).toBe('id1');

        value.keyValue('id3');
        expect(value.keyValue()).toBe('id3');
        expect(dictObj.getByID('id3')).toBeDefined();
      });
    });

    describe('add() method', function() {
      it('adds an empty value with given key', function() {
        dictObj.add('id3');

        expect(dictObj.getByID('id3').get()).toBe('');
        expect(getCacheIDs()).toEqual(['id1', 'id2', 'id3']);
      });

      it('keyValue() getter/setter can be used for added values', function() {
        var value;

        dictObj.add('id3');
        value = getValueFromCache('id3');

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
      it('removes all entries in model and in cache', function() {
        dictObj.empty();

        expect(dictObj.getIDs().length).toBe(0);
        expect(dictObj.getValues().length).toBe(0);
      })
    });

    describe('resetKeys() method', function() {
      it('re-sets dictionary contents to given keys, cache included', function() {
        dictObj.resetKeys(['key1', 'key2']);

        expect(dictObj.getIDs()).toEqual(['key1', 'key2']);
        expect(dictObj.getByID('key1').get()).toBe('');
        expect(dictObj.getByID('key2').get()).toBe('');
        expect(getCacheIDs()).toEqual(['key1', 'key2']);
      })
    });

    describe('removeItem() method', function() {
      it('removes dictionary entry by key from model and cache', function() {
        dictObj.removeItem('id1');

        expect(dictObj.getByID('id1')).toBeUndefined();
        expect(getCacheIDs()).toEqual(['id2']);
      })
    });

  });
});