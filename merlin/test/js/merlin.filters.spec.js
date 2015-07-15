
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
    });
  });

  describe('extractPanels() behavior:', function() {
    var extractPanels, simpleContainerCls, complexContainerCls;

    beforeEach(function() {
      extractPanels = $filter('extractPanels');

      simpleContainerCls = fields.frozendict.extend({}, {
        'key1': {'@class': fields.string},
        'key2': {'@class': fields.string}
      });

      complexContainerCls = fields.frozendict.extend({}, {
        'numberKey': {'@class': fields.number},
        'stringKey': {'@class': fields.string},
        'containerKey': {
          '@class': fields.dictionary.extend({}, {
            '?': {'@class': simpleContainerCls}
          })
        }
      });

    });

    describe('filter input expectations', function() {
      it('2 arguments are required: Barricade.Container subclass and a keyExtractor function', function() {
        var atomicField = fields.string.create();
        var nonAtomicField = simpleContainerCls.create();
        function extractor() {}
        function wrongCall1() {
          return extractPanels(atomicField, extractor);
        }
        function wrongCall2() {
          return extractPanels(nonAtomicField);
        }
        function properCall() {
          return extractPanels(nonAtomicField, extractor);
        }

        expect(wrongCall1).toThrow();
        expect(wrongCall2).toThrow();
        expect(properCall).not.toThrow();
      });

    });

    describe('filter output guarantees', function() {
      var panels, container;
      function extractor(field) {
        return field.instanceof(fields.string) ? 0 : null;
      }

      beforeEach(function() {
        container = simpleContainerCls.create({'key1': 'first', 'key2': 'second'});
        panels = extractPanels(container, extractor);
      });

      it('a panel in an output provides .each() method', function() {
        expect(panels[0].each).toBeDefined();
      });

      it('.each() method could be used for panel contents enumeration', function() {
        var fields = {};
        panels[0].each(function(key, field) {
          fields[key] = field;
        });

        expect(fields.key1.get()).toEqual('first');
        expect(fields.key2.get()).toEqual('second');
      });
    });

    describe('keyExtractor function expectations', function() {
      var collectedFields, container, panels;
      beforeEach(function() {
        collectedFields = {};
      });

      it('only fields for which it returns a numeric value get to the panel', function() {
        container = simpleContainerCls.create({'key1': 'first', 'key2': 'second'});
        function extractor(field) {
          return field.get() == 'first' && 1;
        }

        panels = extractPanels(container, extractor);
        panels[0].each(function(key, field) {
          collectedFields[key] = field;
        });

        expect(collectedFields.key1).toBeDefined();
        expect(collectedFields.key2).not.toBeDefined();
      });

      it('container fields yielding numeric value get to panel as is', function() {
        container = complexContainerCls.create({
          'containerKey': {'container1': {'key1': 'first', 'key2': 'second'}}
        });
        function extractor(field) {
          return field.instanceof(simpleContainerCls) && 1;
        }

        panels = extractPanels(container, extractor);
        panels[0].each(function(key, field) {
          collectedFields[key] = field;
        });

        expect(panels.length).toBe(1);
        expect(collectedFields.key1.get()).toEqual('first');
        expect(collectedFields.key2.get()).toEqual('second');

      });

      it('same numeric value puts the fields into the same panel', function() {
        container = complexContainerCls.create(
          {
            'numberKey': 10,
            'stringKey': 'some'
          });

        function extractor(field) {
          return field.instanceof(simpleContainerCls) ? null : 1;
        }

        panels = extractPanels(container, extractor);
        panels[0].each(function(key, field) {
          collectedFields[key] = field;
        });

        expect(panels.length).toBe(1);
        expect(collectedFields.numberKey.get()).toEqual(10);
        expect(collectedFields.stringKey.get()).toEqual('some');
      });

      it('panels are ordered by extracted numeric value', function() {
        collectedFields = [];
        container = complexContainerCls.create({
          'numberKey': 10,
          'stringKey': 'some'
        });
        function extractor(field) {
          if (field.instanceof(fields.number)) {
            return 1;
          } else if (field.instanceof(fields.string)) {
            return 2;
          }
        }

        panels = extractPanels(container, extractor);
        panels.forEach(function(panel, index) {
          collectedFields[index] = {};
          panel.each(function(key, field) {
            collectedFields[index][key] = field;
          });
        });

        expect(panels.length).toBe(2);
        expect(collectedFields[0].numberKey.get()).toEqual(10);
        expect(collectedFields[1].stringKey.get()).toEqual('some');
      });

      it('second argument to extractor is the parent container', function() {
        collectedFields = [];
        container = complexContainerCls.create({
          'containerKey': {
            'container1': {'key1': 'first', 'key2': 'second'},
            'container2': {'key1': 'third', 'key2': 'fourth'}
          }
        });
        function extractor(field, parent) {
          if (field.instanceof(simpleContainerCls)) {
            return 10 + parent.toArray().indexOf(field);
          } else if (field.instanceof(Barricade.Container)) {
            return null;
          }
        }

        panels = extractPanels(container, extractor);
        panels.forEach(function(panel, index) {
          collectedFields[index] = {};
          panel.each(function(key, field) {
            collectedFields[index][key] = field;
          });
        });

        expect(panels.length).toBe(2);
        expect(collectedFields[0].key1.get()).toEqual('first');
        expect(collectedFields[0].key2.get()).toEqual('second');
        expect(collectedFields[1].key1.get()).toEqual('third');
        expect(collectedFields[1].key2.get()).toEqual('fourth');
      });
    });

    describe('panels are cached,', function() {
      var container, panels1, panels2;
      beforeEach(function() {
        container = complexContainerCls.create({
          'numberKey': 10,
          'stringKey': 'some',
          'containerKey': {
            'container1': {'key1': 'first', 'key2': 'second'},
            'container2': {'key1': 'third', 'key2': 'fourth'}
          }
        });

      });

      it('and 2 consequent filter calls return the identical results', function() {
        function extractor(field, parent) {
          if (field.instanceof(simpleContainerCls)) {
            return 10 + parent.toArray().indexOf(field);
          } else if (field.instanceof(Barricade.Container)) {
            return null;
          } else {
            return 0;
          }
        }

        panels1 = extractPanels(container, extractor);
        panels2 = extractPanels(container, extractor);

        expect(panels1).toBe(panels2);
      });

      describe('yet adding/removing entity tracked by keyExtractor causes panels recalculation', function() {
        it('the change is being tracked by extractor', function() {
          function extractor(field, parent) {
            if (field.instanceof(simpleContainerCls)) {
              return 10 + parent.toArray().indexOf(field);
            } else if (field.instanceof(Barricade.Container)) {
              return null;
            } else {
              return 0;
            }
          }

          panels1 = extractPanels(container, extractor);
          container.get('containerKey').push(
            {'key1': 'fifth', 'key2': 'sixth'}, {id: 'container3'});
          panels2 = extractPanels(container, extractor);

          expect(panels1).not.toBe(panels2);
        });

        it('the same change is not being tracked by a different extractor', function() {
          function extractor(field) {
            if (field.instanceof(fields.dictionary)) {
              return 10;
            } else if (field.instanceof(Barricade.Container)) {
              return null;
            } else {
              return 0;
            }
          }

          panels1 = extractPanels(container, extractor);
          container.get('containerKey').push(
            {'key1': 'fifth', 'key2': 'sixth'}, {id: 'container3'});
          panels2 = extractPanels(container, extractor);

          expect(panels1).toBe(panels2);
        });
      });
    });
  });

  describe('extractFields() behavior:', function() {
    var extractFields, obj;
    beforeEach(function() {
      extractFields = $filter('extractFields');
      obj = {
        each: function(callback) {
          var key;
          for (key in this) {
            if (this.hasOwnProperty(key) && key !== 'each') {
              callback(key, this[key]);
            }
          }
        }
      }
    });

    describe('basic expectations', function() {
      var value1 = {value: 'some', uid: function() { return 1; }};
      var value2 = {value: 'more', uid: function() { return 2; }};
      function wrongCall() {
        var wrongObj = {
          key1: value1,
          key2: value2
        };
        return extractFields(wrongObj);
      }
      function properCall() {
        return extractFields(obj);
      }
      beforeEach(function() {
        obj.key1 = value1;
        obj.key2 = value2;
      });

      it('consumes any object implementing .each() method', function() {
        expect(wrongCall).toThrow();
        expect(properCall).not.toThrow();
      });

      it('produces plain JS object', function() {
        var collectedFields = properCall();

        expect(collectedFields).toEqual({key1: value1, 'key2': value2});
      })
    });

    // TODO: describe caching behavior as soon as fields sorting is added to extractFields

  });

  describe('chunks() behavior:', function() {
    // TODO: describe chunks behavior as soon as its responsibilities are fleshed out
    // (inline propagation? other features? naming?)
  });

});