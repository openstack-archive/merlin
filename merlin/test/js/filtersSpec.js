
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
        'key1': {
          '@class': fields.string
        },
        'key2': {
          '@class': fields.string
        }
      });

      simpleMerlinObjClassWithMeta = fields.frozendict.extend({}, {
        'key1': {
          '@class': fields.number.extend({}, {
            '@meta': {
              'panelIndex': 0
            }
          })
        },
        'key2': {
          '@class': fields.string.extend({}, {
            '@meta': {
              'panelIndex': 0
            }
          })
        },
        'key3': {
          '@class': fields.string.extend({}, {
            '@meta': {
              'panelIndex': 1
            }
          })
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

      it('each entry with the same panelIndex is placed in the same panel', function() {
        var simpleObj = simpleMerlinObjClassWithMeta.create(),
          panels = extractPanels(simpleObj);

        expect(panels.length).toBe(2);
        expect(panels[0].items.length).toBe(2);
        expect(panels[1].items.length).toBe(1);
      });

      it('the filter is applied only to the top-level entries of the passed object', function() {
        var merlinObjWithNestedPanelIndices = fields.frozendict.extend({}, {
          'key1': {
            '@class': fields.number.extend({}, {
              '@meta': {
                'panelIndex': 0
              }
            })
          },
          'key2': {
            '@class': fields.frozendict.extend({}, {
              'key3': {
                '@class': fields.string.extend({}, {
                  '@meta': {
                    'panelIndex': 1
                  }
                })
              },
              '@meta': {
                'panelIndex': 0
              }
            })
          }
        }).create(),
          panels = extractPanels(merlinObjWithNestedPanelIndices);

        expect(panels.length).toBe(1);
      });

    });

    describe('panels generated from Barricade.MutableObject (non-permanent panels)', function() {
      var topLevelObj;

      beforeEach(function() {
        topLevelObj = fields.frozendict.extend({}, {
          'key2': {
            '@class': fields.dictionary.extend({}, {
              '@meta': {
                'panelIndex': 0
              },
              '?': {
                '@class': fields.frozendict.extend({}, {
                  'name': {'@class': fields.string}
                })
              }
            })
          }
        }).create();
      });

      it('are given a separate panel for each MutableObject entry', function() {
        topLevelObj.set('key2', {
          'id1': {'name': 'String1'},
          'id2': {'name': 'String2'}
        });
        var panels = extractPanels(topLevelObj);
        expect(panels.length).toBe(2);
      });

      it('have their title exposed via .title() which mirrors their id', function() {
        var panels;
        topLevelObj.set('key2', {'id1': {'name': 'some name'}});
        panels = extractPanels(topLevelObj);
        expect(panels[0].title()).toBe('id1');
      });

      it('are removable (thus are not permanent)', function() {
        var panels;
        topLevelObj.set('key2', {'id1': {'name': 'String1'}});
        panels = extractPanels(topLevelObj);

        expect(panels[0].removable).toBe(true);
      });

    });

    describe('panels generated from objects other than Barricade.MutableObject (permanent panels)', function() {
      it('have fields marked with the same `panelIndex` in the one panel', function() {
        var immutableObj = fields.frozendict.extend({}, {
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
        }).create(),
          panels = extractPanels(immutableObj);

        expect(panels.length).toBe(2);
        expect(panels[0].items.panelIndex).toBe(23);

      });

      it('number of panels is defined by number of different `panelIndex` keys', function() {
        var immutableObj = fields.frozendict.extend({}, {
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
        }).create(),
          panels = extractPanels(immutableObj);

        expect(panels.length).toBe(3);
      });

      it('are ordered by the `panelIndex` ascension', function() {
        var immutableObj = fields.frozendict.extend({}, {
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
        }).create(),
          panels = extractPanels(immutableObj);

        expect(panels[0].items.panelIndex).toBe(23);
        expect(panels[1].items.panelIndex).toBe(24);
        expect(panels[2].items.panelIndex).toBe(25);
      });

      it('have no title returned from .getTitle()', function() {
        var immutableObj = fields.frozendict.extend({}, {
          'key1': {
            '@class': fields.string.extend({}, {
              '@meta': {
                'panelIndex': 25
              }
            })
          }
        }).create(),
          panels = extractPanels(immutableObj);

        expect(panels[0].title()).toBeUndefined();
      });

      it('are not removable (thus are permanent)', function() {
        var immutableObj = fields.frozendict.extend({}, {
          'key1': {
            '@class': fields.string.extend({}, {
              '@meta': {
                'panelIndex': 25
              }
            })
          }
        }).create(),
          panels = extractPanels(immutableObj);

        expect(panels[0].removable).toBeUndefined();
      })

    });

    describe('panels are cached,', function() {
      var immutableObj;

      beforeEach(function() {
        immutableObj = fields.frozendict.extend({}, {
          'key1': {
            '@class': fields.string
          }
        }).create();
      });

      it('and 2 consequent filter calls return the identical results', function() {
        var panels1, panels2;

        immutableObj.get('key1').set('String_1');
        panels1 = extractPanels(immutableObj);
        panels2 = extractPanels(immutableObj);

        expect(panels1).toBe(panels2);
      });

      it("still totally replacing the elements that go to permanent panels doesn't reset the cache", function() {
        var panels1, panels2;

        immutableObj.get('key1').set('String_1');
        panels1 = extractPanels(immutableObj);
        immutableObj.get('key1').set('String_2');
        panels2 = extractPanels(immutableObj);

        expect(panels1).toBe(panels2);
      });

      it('while totally replacing the top-level object of a non-permanent panel resets the cache', function() {
        var immutableObj = fields.frozendict.extend({}, {
          'key2': {
            '@class': fields.dictionary.extend({}, {
              '@meta': {
                'panelIndex': 0
              },
              '?': {
                '@class': fields.frozendict.extend({}, {
                  'key1': {'@class': fields.string}
                })
              }
            })
          }
        }).create(),
          panels1, panels2;

        immutableObj.set('key2', {'id_1': {key1: 'String_1'}});
        panels1 = extractPanels(immutableObj);

        immutableObj.get('key2').remove('id_1');
        immutableObj.set('key2', {'id_1': {key1: 'String_1'}});
        panels2 = extractPanels(immutableObj);

        expect(panels1).not.toBe(panels2);
      });

      it("but totally replacing the object contained within top-level object of a " +
        "non-permanent panel doesn't reset the cache", function() {
        var immutableObj = fields.frozendict.extend({}, {
          'key2': {
            '@class': fields.dictionary.extend({}, {
              '@meta': {
                'panelIndex': 0
              },
              '?': {
                '@class': fields.frozendict.extend({}, {
                  'key1': {'@class': fields.string}
                })
              }
            })
          }
        }).create(),
          panels1, panels2;

        immutableObj.set('key2', {'id_1': {key1: 'String_1'}});
        panels1 = extractPanels(immutableObj);

        immutableObj.get('key2').getByID('id_1').get('key1').set('String_2');
        panels2 = extractPanels(immutableObj);

        expect(panels1).toBe(panels2);
      });

    });

  });

  describe('extractRows() behavior:', function() {
    var extractRows, extractPanels;

    beforeEach(function() {
      extractPanels = $filter('extractPanels');
      extractRows = $filter('extractRows');
    });

    describe('the filter is meant to be chainable', function() {
      var immutableObj;

      beforeEach(function() {
        immutableObj = fields.frozendict.extend({}, {
          'key1': {
            '@class': fields.number.extend({}, {
              '@meta': {
                'row': 0
              }
            })
          }
        }).create();
      });

      it('with extractPanels() results', function() {
        var firstPanel = extractPanels(immutableObj)[0],
          rows = extractRows(firstPanel);

        expect(rows.length).toBe(1);
      });

      it('with Barricade.ImmutableObject contents', function() {
        var rows = extractRows(immutableObj);

        expect(rows.length).toBe(1);
      });

      it('even with Barricade.MutableObject contents', function() {
        var mutableObj = fields.dictionary.extend({}, {
            '?': {
              '@class': fields.string.extend({}, {
                '@meta': {'row': 0}
              })
            }
          }).create(),
          rows;

        mutableObj.push('string1', {id: 'id1'});
        mutableObj.push('string2', {id: 'id2'});
        rows = extractRows(mutableObj);

        expect(rows.length).toBe(1);
      });

    });

    it("the filter is not meant to be chainable with Barricade " +
    "objects other MutableObject or ImmutableObject", function() {
      function test() {
        var arrayObj = fields.list.extend({}, {
            '*': {
              '@class': fields.string.extend({}, {
                '@meta': {
                  'row': 0
                }
              })
            }
          }).create();

        arrayObj.push('string1');
        arrayObj.push('string2');
        return extractRows(arrayObj);
      }

      expect(test).toThrow();
    });


    describe('the filter relies upon `@meta` object with `row` key', function() {
      it('and all fields without it are put into the same row', function() {
        var immutableObj = fields.frozendict.extend({}, {
          'key1': {
            '@class': fields.string
          },
          'key2': {
            '@class': fields.string
          }
        }).create(),
          rows = extractRows(immutableObj);

        expect(rows.length).toBe(1);
      });

      it('the filter is applied only to the top-level entries of the passed object', function() {
        var immutableObj = fields.frozendict.extend({}, {
          'key1': {
            '@class': fields.string.extend({}, {
              '@meta': {
                'row': 1
              }
            })
          },
          'key2': {
            '@class': fields.frozendict.extend({}, {
              '@meta': {
                'row': 2
              },
              'key3': {
                '@class': fields.string.extend({}, {
                  '@meta': {
                    'row': 3
                  }
                })
              }
            })
          }
        }).create(),
          rows = extractRows(immutableObj);

        expect(rows.length).toBe(2);
      });

      it('2 fields with the same `row` key are placed in the same row', function() {
        var immutableObj = fields.frozendict.extend({}, {
          'key1': {
            '@class': fields.string.extend({}, {
              '@meta': {
                'row': 0
              }
            })
          },
          'key2': {
            '@class': fields.string.extend({}, {
              '@meta': {
                'row': 0
              }
            })
          }
        }).create(),
          rows = extractRows(immutableObj);

        expect(rows.length).toBe(1);
      });

      it('rows are ordered by the `row` key ascension', function() {
        var immutableObj = fields.frozendict.extend({}, {
          'key3': {
            '@class': fields.string.extend({}, {
              '@meta': {
                'row': 2
              }
            })
          },
          'key2': {
            '@class': fields.string.extend({}, {
              '@meta': {
                'row': 1
              }
            })
          },
          'key1': {
            '@class': fields.string.extend({}, {
              '@meta': {
                'row': 0
              }
            })
          }
        }).create({key1: 'String_1', key2: 'String_2', key3: 'String_3'}),
          rows = extractRows(immutableObj);

        expect(rows[0].items[0].get()).toBe('String_1');
        expect(rows[1].items[0].get()).toBe('String_2');
        expect(rows[2].items[0].get()).toBe('String_3');
      });

    });

    describe('rows are cached,', function() {
      var immutableObj;

      beforeEach(function() {
        immutableObj = fields.frozendict.extend({}, {
          'key1': {
            '@class': fields.frozendict.extend({}, {
              'key2': {
                '@class': fields.string.extend({}, {
                  '@meta': {
                    'row': 1
                  }
                })
              },
              'key3': {
                '@class': fields.string.extend({}, {
                  '@meta': {
                    'row': 1
                  }
                })
              }
            })
          }
        }).create({'key1': {'key2': 'string1', 'key3': 'string2'}});
      });

      it('and 2 consequent filter calls return the identical results', function() {
        var panels = extractPanels(immutableObj),
          rows1 = extractRows(panels[0]),
          rows2 = extractRows(panels[0]);

        expect(rows1).toBe(rows2);
      });

      describe('but totally replacing one of the elements that are contained within', function() {
        it("panel resets the cache", function() {
          var panels = extractPanels(immutableObj),
            rows1 = extractRows(panels[0]),
            rows2;

          immutableObj.set('key1', {'key2': 'string1', 'key3': 'string2'});
          panels = extractPanels(immutableObj);
          rows2 = extractRows(panels[0]);

          expect(rows2).not.toBe(rows1);
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