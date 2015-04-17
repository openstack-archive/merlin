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

  describe('getNewId function', function() {

  });

  describe('groupByMetaKey function', function() {

  });

  describe('getNextIDSuffix function', function() {

  });

  describe('pop function', function() {

  });

});
