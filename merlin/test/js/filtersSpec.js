
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
  describe('extractPanels() behavior:', function() {
    describe('the filter relies upon `@meta` object with `panelIndex` key', function() {
      it('and all fields without it are merged into a single panel', function() {

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

    describe('panels are cached', function() {
      it('and 2 consequent filter calls return the identical results', function() {

      });

      it("yet totally replacing the elements that go to permanent panels doesn't reset the cache", function() {

      });

      it('and totally replacing the top-level object of a non-permanent panel resets the cache', function() {

      });

      it("but totally replacing the object contained within top-level object of a non-permanent panel doesn't reset the cache", function() {

      });

    });

  });

  describe('extractRows() behavior:', function() {
    describe('the filter is meant to be chainable with and only with extractPanels() result', function() {
      it("and it doesn't work with raw Barricade objects", function() {

      });

      it('but it works perfectly with extractPanels() result', function() {

      });

    });

    describe('the filter relies upon `@meta` object with `row` key', function() {
      it('and all fields without it are merged into a single panel', function() {

      });

      it('the filter is applied only to the top-level entries of the passed object', function() {

      });

    });


  });

  describe('extractItems() behavior:', function() {

  });
});