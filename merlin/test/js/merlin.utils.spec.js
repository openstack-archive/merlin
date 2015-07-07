describe('merlin.utils', function() {
  'use strict';

  var utils;

  beforeEach(function() {
    angular.mock.module('merlin');
    angular.mock.inject(function($injector) {
      utils = $injector.get('merlin.utils');
    });
  });

  describe('makeTitle function', function() {
    it('should capitalize the first letter of a string', function() {
      expect(utils.makeTitle('some string')).toBe('Some string');
    });
  });

  describe('condense function', function() {
    it('condense() should throw away undefined and null values', function() {
      var array = [1, 0, 15, undefined, 7, null, null, 8];
      expect(utils.condense(array)).toEqual([1, 0, 15, 7, 8]);
    });
  });

  describe('extend function', function() {
    var obj;

    beforeEach(function() {
      obj = {
        'key1': 10,
        'key2': 20
      };
    });

    it("doesn't remove existing keys from the resulting object", function() {
      var newObj = utils.extend(obj, {'key3': 30});
      expect(newObj.key1).toBe(10);
      expect(newObj.key3).toBe(30);
    });

    it('overrides keys with the same names as the ones in extension', function() {
      var newObj = utils.extend(obj, {'key2': 40});
      expect(newObj.key2).toBe(40);
    });

    it("doesn't touch the original object, even the keys with the same names", function() {
      var newObj = utils.extend(obj, {'key2': 40, 'key4': 50});
      expect(obj.key1).toBe(10);
      expect(obj.key2).toBe(20);
    });
  });

  describe('getNewId function', function() {
    it('two successive calls return different ids', function() {
      var id1 = utils.getNewId(),
        id2 = utils.getNewId();
      expect(id1).not.toEqual(id2);
    })
  });

  describe('groupByMetaKey function', function() {
    var objCls = Barricade.create({
      '@type': Object,
      'key1': {
        '@type': String,
        '@meta': {
          'index': 0
        }
      },
      'key2': {
        '@type': String,
        '@meta': {
          'index': 0
        }
      },
      'key3': {
        '@type': String,
        '@default': 'key3',
        '@meta': {
          'index': 1
        }
      },
      'key4': {
        '@type': String,
        '@default': 'key4',
        '@meta': {
          'index': 2
        }
      },
      'key5': {
        '@type': String,
        '@default': 'key5'
      }
    }),
      obj, items, groupedItems;

    beforeEach(function() {
      obj = objCls.create();
      items = obj.getKeys().map(function(key) {
        return obj.get(key);
      });
      groupedItems = utils.groupByMetaKey(items, 'index');
    });

    it('transforms an Array of Barricade objects another Array', function() {
      expect(angular.isArray(groupedItems)).toBe(true);
    });

    it('items with same key go into same bucket and are ordered', function() {
      expect(groupedItems[0].length).toBe(2);
      expect(groupedItems[1].length).toBe(1);
      expect(groupedItems[1][0].get()).toEqual('key3');
      expect(groupedItems[2].length).toBe(1);
      expect(groupedItems[2][0].get()).toEqual('key4');
    });

    it('items with same key go into same bucket and are ordered', function() {
      expect(groupedItems[0].length).toBe(2);
      expect(groupedItems[1].length).toBe(1);
      expect(groupedItems[1][0].get()).toEqual('key3');
      expect(groupedItems[2].length).toBe(1);
      expect(groupedItems[2][0].get()).toEqual('key4');
    });

    it('items without given meta key by default go last', function() {
      expect(groupedItems[3].length).toBe(1);
      expect(groupedItems[3][0].get()).toBe('key5');
    })
  });

  describe('getNextIDSuffix function', function() {
    var containerCls = Barricade.create({
      '@type': Object,
      '?': {
        '@type': String
      }
    }),
      regexp = /(object)-(\d+)/;

    it('works together with MutableObject', function() {
      function test() {
        var container = containerCls.create({'object-1': ''});
        return utils.getNextIDSuffix(container, regexp);
      }
      expect(test).not.toThrow();
    });

    it('starts with 1 as suffix if no IDs match the pattern', function() {
      var container = containerCls.create({'someid': 'foo'}),
        suffix = utils.getNextIDSuffix(container, regexp);
      expect(suffix).toBe(1);
    });

    it('starts with the next ordinal to the maximum suffix that was matched', function() {
      var container = containerCls.create({'object-1': '', 'object-10': ''}),
        suffix = utils.getNextIDSuffix(container, regexp);
      expect(suffix).toBe(11);
    });
  });

});
