
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
describe('merlin filters', function() {
  'use strict';

  var $filter, fields;

  beforeEach(function() {
    module('merlin');

    inject(function($injector) {
      $filter = $injector.get('$filter');
      fields = $injector.get('merlin.field.models');
    })
  });

  describe('extractPanels() behavior:', function() {
    var extractPanels, simpleObjClass;

    beforeEach(function() {
      extractPanels = $filter('extractPanels');

      simpleObjClass = fields.frozendict.extend({}, {
        '@type': Object,
        'key1': {
          '@type': Number
        },
        'key2': {
          '@type': String
        }
      });
    });

    describe('the filter relies upon `@meta` object with `panelIndex` key', function() {
      it('and all fields without it are merged into a single panel', function() {
        var simpleObj = simpleObjClass.create(),
          panels = extractPanels(simpleObj);

        expect(panels.length).toBe(1);
      });

      it('the filter is applied only to the top-level entries of the passed object', function() {

      });

    });

    describe('panels generated from Barricade.MutableObject (non-permanent panels)', function() {
      it('are given a separate panel for each MutableObject entry', function() {

      });

      it('have their title exposed via .getTitle() which mirrors `name` entry value', function() {

      });

      it('are removable (thus are not permanent)', function() {

      });

      it('could not be spliced into one entity by giving the same `panelIndex`', function() {

      })

    });

    describe('panels generated from objects other than Barricade.MutableObject (permanent panels)', function() {
      it('have fields marked with the same `panelIndex` in the one panel', function() {

      });

      it('number of panels is defined by number of different `panelIndex` keys', function() {

      });

      it('are ordered by the `panelIndex` ascension', function() {

      });

      it('have no title returned from .getTitle()', function() {

      });

      it('are not removable (thus are permanent)', function() {

      })

    });

    describe('panels are cached,', function() {
      it('and 2 consequent filter calls return the identical results', function() {

      });

      it("yet totally replacing the elements that go to permanent panels doesn't reset the cache", function() {

      });

      it('while totally replacing the top-level object of a non-permanent panel resets the cache', function() {

      });

      it("still totally replacing the object contained within top-level object of a non-permanent panel doesn't reset the cache", function() {

      });

    });

  });

  describe('extractRows() behavior:', function() {
    var extractRows;

    beforeEach(function() {
      extractRows = $filter('extractRows');
    });

    describe('the filter is meant to be chainable', function() {
      it('with extractPanels() results', function() {

      });

      it('with Barricade.ImmutableObject contents', function() {

      });

      it('even with Barricade.MutableObject contents', function() {

      });

    });

    it("the filter is not meant to be chainable with Barricade " +
    "objects other MutableObject or ImmutableObject", function() {

    });


    describe('the filter relies upon `@meta` object with `row` key', function() {
      it('and all fields without it are given a separate row for each field', function() {

      });

      it('the filter is applied only to the top-level entries of the passed object', function() {

      });

      it('2 fields with the same `row` key are placed in the same row', function() {

      });

      it('rows are ordered by the `row` key ascension', function() {

      });

    });

    describe('rows are cached,', function() {
      it('and 2 consequent filter calls return the identical results', function() {

      });

      describe('but totally replacing one of the elements that are contained within', function() {
        it("panel resets the cache", function() {

        });

        it("ImmutableObject resets the cache", function() {

        });

        it("MutableObject resets the cache", function() {

        });

      });

      it("yet totally replacing the Object somewhere deeper doesn't reset the cache", function() {

      });

    });

  });

  describe('extractItems() behavior:', function() {
    var extractItems;

    beforeEach(function() {
      extractItems = $filter('extractItems');
    });

    it('the filter is meant to be chainable only with extractRows() results', function() {

    });

    describe('the filter relies upon `@meta` object with `index` key', function() {
      it('and all fields without it are processed w/o errors, but with unpredictable ordering', function() {

      });

      describe('fields are ordered by the `index` key ascension, this applies', function() {
        it('to the fields with `row` key defined (ordering within a row)', function() {

        });

        it('to the fields w/o `row` key defined (ordering of anonymous rows)', function() {

        });
      });

    });

  });
});