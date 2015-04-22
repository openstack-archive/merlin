
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
    var extractPanels, simpleMerlinObjClass, simpleMerlinObjClassWithMeta;

    beforeEach(function() {
      extractPanels = $filter('extractPanels');

      simpleMerlinObjClass = fields.frozendict.extend({}, {
        '@type': Object,
        'key1': {
          '@type': Number
        },
        'key2': {
          '@type': String
        }
      });

      simpleMerlinObjClassWithMeta= fields.frozendict.extend({}, {
        '@type': Object,
        'key1': {
          '@type': Number,
          '@meta': {
                'index': 0,
                'panelIndex': 0,
                'row': 0
          }
        },
        'key2': {
          '@type': String,
          '@meta': {
                'index': 0,
                'panelIndex': 0,
                'row': 0,
            '@meta': {
                'index': 0,
                'panelIndex': 1,
                'row': 0
            }
          }
        }
      });

    });

    it('works properly only with objects created from Merlin classes', function() {
      var simpleBarricadeObjClass = Barricade.create({
        '@type': Object,
        'key1': {
          '@type': Number
        },
        'key2': {
          '@type': String
        }
      }),
        simpleBarricadeObj = simpleBarricadeObjClass.create(),
        simpleMerlinObj = simpleMerlinObjClass.create();

      expect(function() {
        return extractPanels(simpleBarricadeObj);
      }).toThrow();

      expect(function() {
        return extractPanels(simpleMerlinObj);
      }).not.toThrow();
    });

    describe('the filter relies upon `@meta` object with `panelIndex` key', function() {
      it('and all fields without it are merged into a single panel', function() {
        var simpleObj = simpleMerlinObjClass.create(),
          panels = extractPanels(simpleObj);

        expect(panels.length).toBe(1);
      });

      it('the filter is applied only to the top-level entries of the passed object', function() {
        var simpleObj = simpleMerlinObjClassWithMeta.create(),
          panels = extractPanels(simpleObj);

        expect(panels.length).toBe(1);
      });

    });

    describe('panels generated from Barricade.MutableObject (non-permanent panels)', function() {
      var immutableObjClass, immutableClassWithMutable, immutableObj;
      beforeEach(function() {
        immutableObjClass = fields.frozendict.extend({}, {
          'key1': {'@class': fields.string},
          'name': {'@class': fields.string}
        });
        immutableClassWithMutable = fields.frozendict.extend({}, {
          'key2': {
            '@class': fields.dictionary.extend({}, {
              '@meta': {
                'panelIndex': 0
              },
              '?': {'@class': immutableObjClass}
            })
          }
        });
        immutableObj = immutableClassWithMutable.create();
      });
      it('are given a separate panel for each MutableObject entry', function() {
        immutableObj.get('key2').push({key1: 'String_1'}, {id: 'id_1'});
        immutableObj.get('key2').push({key1: 'String_2'}, {id: 'id_2'});
        var panels = extractPanels(immutableObj);
        expect(panels.length).toBe(2);
      });

      it('have their title exposed via .title() which mirrors `name` entry value', function() {
        immutableObj.get('key2').push({key1: 'String_1', name: 'Name Of Panel'}, {id: 'id_1'});
        var panels = extractPanels(immutableObj);
        //expect(panels[0].title()).toBe('Name Of Panel');
      });

      it('are removable (thus are not permanent)', function() {
        immutableObj.get('key2').push({key1: 'String_1'}, {id: 'id_1'});
        var panels = extractPanels(immutableObj);
        expect(panels[0].removable).toBe(true);
      });

      it('could not be spliced into one entity by giving the same `panelIndex`', function() {
        // see 'are given a separate panel for each MutableObject entry'
        // (immutableClassWithMutable have the 'panelIndex')
      })

    });

    describe('panels generated from objects other than Barricade.MutableObject (permanent panels)', function() {
      var immutableObjClass, immutableObj;
      beforeEach(function() {

      });
      it('have fields marked with the same `panelIndex` in the one panel', function() {
        immutableObjClass = fields.frozendict.extend({}, {
          'key1': {
            '@class': fields.string.extend({}, {
              '@meta': {
                'panelIndex': 23
              }
            })
          },
          'key2': {
            '@class': fields.string.extend({}, {
              '@meta': {
                'panelIndex': 23
              }
            })
          },
          'key3': {
            '@class': fields.string.extend({}, {
              '@meta': {
                'panelIndex': 25
              }
            })
          }
        });
        immutableObj = immutableObjClass.create();
        var panels = extractPanels(immutableObj);

        expect(panels.length).toBe(2);
        expect(panels[0].items.panelIndex).toBe(23);

      });

      it('number of panels is defined by number of different `panelIndex` keys', function() {
        immutableObjClass = fields.frozendict.extend({}, {
          'key1': {
            '@class': fields.string.extend({}, {
              '@meta': {
                'panelIndex': 23
              }
            })
          },
          'key2': {
            '@class': fields.string.extend({}, {
              '@meta': {
                'panelIndex': 24
              }
            })
          },
          'key3': {
            '@class': fields.string.extend({}, {
              '@meta': {
                'panelIndex': 25
              }
            })
          }
        });
        immutableObj = immutableObjClass.create();
        var panels = extractPanels(immutableObj);

        expect(panels.length).toBe(3);

      });

      it('are ordered by the `panelIndex` ascension', function() {
        immutableObjClass = fields.frozendict.extend({}, {
          'key1': {
            '@class': fields.string.extend({}, {
              '@meta': {
                'panelIndex': 25
              }
            })
          },
          'key2': {
            '@class': fields.string.extend({}, {
              '@meta': {
                'panelIndex': 24
              }
            })
          },
          'key3': {
            '@class': fields.string.extend({}, {
              '@meta': {
                'panelIndex': 23
              }
            })
          }
        });
        immutableObj = immutableObjClass.create();
        var panels = extractPanels(immutableObj);

        expect(panels[0].items.panelIndex).toBe(23);
        expect(panels[1].items.panelIndex).toBe(24);
        expect(panels[2].items.panelIndex).toBe(25);

      });

      it('have no title returned from .getTitle()', function() {
        immutableObjClass = fields.frozendict.extend({}, {
          'key1': {
            '@class': fields.string.extend({}, {
              '@meta': {
                'panelIndex': 25
              }
            })
          }
        });
        immutableObj = immutableObjClass.create();
        var panels = extractPanels(immutableObj);
        expect(panels[0].title()).toBeUndefined();
      });

      it('are not removable (thus are permanent)', function() {
        immutableObjClass = fields.frozendict.extend({}, {
          'key1': {
            '@class': fields.string.extend({}, {
              '@meta': {
                'panelIndex': 25
              }
            })
          }
        });
        immutableObj = immutableObjClass.create();
        var panels = extractPanels(immutableObj);
        expect(panels[0].removable).toBeUndefined();
      })

    });

    describe('panels are cached,', function() {
      var immutableObjClass, immutableObj, immutableClassWithMutable;

      it('and 2 consequent filter calls return the identical results', function() {
        immutableObjClass = fields.frozendict.extend({}, {
          'key1': {
            '@class': fields.string
          }
        });
        immutableObj = immutableObjClass.create();
        immutableObj.get('key1').set('String_1');
        var panels_1 = extractPanels(immutableObj);
        var panels_2 = extractPanels(immutableObj);
        expect(panels_1).toBe(panels_2);

      });

      it("yet totally replacing the elements that go to permanent panels doesn't reset the cache", function() {
        immutableObjClass = fields.frozendict.extend({}, {
          'key1': {
            '@class': fields.string
          }
        });
        immutableObj = immutableObjClass.create();
        immutableObj.get('key1').set('String_1');
        var panels_1 = extractPanels(immutableObj);
        immutableObj.get('key1').set('String_2');
        var panels_2 = extractPanels(immutableObj);
        expect(panels_1).toBe(panels_2);
      });

      it('while totally replacing the top-level object of a non-permanent panel resets the cache', function() {
        immutableObjClass = fields.frozendict.extend({}, {
          'key1': {'@class': fields.string}
        });
        immutableClassWithMutable = fields.frozendict.extend({}, {
          'key2': {
            '@class': fields.dictionary.extend({}, {
              '@meta': {
                'panelIndex': 0
              },
              '?': {'@class': immutableObjClass}
            })
          }
        });
        immutableObj = immutableClassWithMutable.create();
        immutableObj.get('key2').push({key1: 'String_1'}, {id: 'id_1'});
        var panels_1 = extractPanels(immutableObj);
        immutableObj.get('key2').remove('id_1');
        immutableObj.get('key2').push({key1: 'String_1'}, {id: 'id_1'});
        var panels_2 = extractPanels(immutableObj);
        expect(panels_1).not.toBe(panels_2);
      });

      it("still totally replacing the object contained within top-level object of a non-permanent panel doesn't reset the cache", function() {
        immutableObjClass = fields.frozendict.extend({}, {
          'key1': {'@class': fields.string}
        });
        immutableClassWithMutable = fields.frozendict.extend({}, {
          'key2': {
            '@class': fields.dictionary.extend({}, {
              '@meta': {
                'panelIndex': 0
              },
              '?': {'@class': immutableObjClass}
            })
          }
        });
        immutableObj = immutableClassWithMutable.create();
        immutableObj.get('key2').push({key1: 'String_1'}, {id: 'id_1'});
        var panels_1 = extractPanels(immutableObj);
        immutableObj.get('key2').getValues().id_1.get('key1').set('String_2');
        var panels_2 = extractPanels(immutableObj);
        expect(panels_1).toBe(panels_2);
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