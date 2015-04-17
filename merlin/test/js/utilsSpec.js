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

  describe('condense Array method', function() {
    it('Array prototype should have condense()', function() {
      var array = [];
      expect(array.condense).toBeDefined();
    });

    it('condense() should throw away undefined and null values', function() {
      var array = [1, 0, 15, undefined, 7, null, null, 8];
      expect(array.condense()).toEqual([1, 0, 15, 7, 8]);
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
      var newObj = extend(obj, {'key3': 30});
      expect(newObj.key1).toBe(10);
      expect(newObj.key3).toBe(30);
    });

    it('overrides keys with the same names as the ones in extension', function() {
      var newObj = extend(obj, {'key2': 40});
      expect(newObj.key2).toBe(40);
    });

    it("doesn't touch the original object, even the keys with the same names", function() {
      var newObj = extend(obj, {'key2': 40, 'key4': 50});
      expect(obj.key1).toBe(10);
      expect(obj.key2).toBe(20);
    });
  });

  describe('getNewId function', function() {

  });

  describe('groupByMetaKey function', function() {

  });

  describe('getNextIDSuffix function', function() {

  });

  describe('pop function', function() {

  });

});
