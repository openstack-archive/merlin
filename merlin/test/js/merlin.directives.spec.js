
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
describe('merlin directives', function() {
  'use strict';

  var $compile, $scope, $httpBackend;

  beforeEach(function() {
    module('merlin', function($provide) {
      $provide.value('fieldTemplates', ['number', 'text']);
    });
    module('preprocessedTemplates');
  });

  beforeEach(inject(function(_$compile_, _$rootScope_, _$httpBackend_, _$templateCache_) {
    $compile = _$compile_;
    $scope = _$rootScope_.$new();
    $httpBackend = _$httpBackend_;
    $httpBackend.whenGET('/static/merlin/templates/fields/text.html').respond(
      200, _$templateCache_.get('/static/merlin/templates/fields/text.html'));
    $httpBackend.whenGET('/static/merlin/templates/fields/number.html').respond(
      200, _$templateCache_.get('/static/merlin/templates/fields/number.html'));
  }));

  describe('<panel>', function() {
    function getPanelHeading(panelElem) {
      var div = panelElem.children().children().eq(0);
      return div.hasClass('panel-heading') && div;
    }

    function getPanelRemoveButton(panelElem) {
      return panelElem.find('a').eq(2);
    }

    function getCollapseBtn(panelElem) {
      return panelElem.find('a').eq(0);
    }

    function getPanelBody(panelElem) {
      var div = panelElem.children().children().eq(1);
      return div.hasClass('panel-body') && div;
    }

    function makePanelElem(content) {
      var panel = $compile('<panel content="' + content + '"></panel>')($scope);
      $scope.$digest();
      return panel;
    }

    function makePanelWithInnerTags() {
      var element = $compile('<panel><span class="inner"></span></panel>')($scope);
      $scope.$digest();
      return element;
    }

    it('shows panel heading when and only when its title is defined', function() {
      var title = 'My Panel',
        element1, element2;

      $scope.panel1 = {
        title: function() { return title; }
      };
      $scope.panel2 = {};
      element1 = makePanelElem('panel1');
      element2 = makePanelElem('');

      expect(getPanelHeading(element1).hasClass('ng-hide')).toBe(false);
      expect(element1.html()).toContain(title);
      expect(getPanelHeading(element2).hasClass('ng-hide')).toBe(true);
    });

    it('requires both `.title()` and `.removable` to be removable', function() {
      var title = 'My Panel',
        element1, element2;

      $scope.panel1 = {
        title: function() { return title; },
        removable: true
      };
      $scope.panel2 = {
        title: function() { return title; }
      };
      element1 = makePanelElem('panel1');
      element2 = makePanelElem('panel2');

      expect(getPanelRemoveButton(element1).hasClass('ng-hide')).toBe(false);
      expect(getPanelRemoveButton(element2).hasClass('ng-hide')).toBe(true);
    });

    it('contents are inserted into div.panel-body tag', function() {
      var panel = makePanelWithInnerTags();

      expect(getPanelBody(panel).find('span').hasClass('inner')).toBe(true);
    });

    it('starts as being expanded', function() {
      var panel = makePanelWithInnerTags(),
        body = getPanelBody(panel);

      expect(body.hasClass('collapse')).toBe(true);
      expect(body.hasClass('in')).toBe(true);
    });

    it('starts to collapse after pressing on triangle next to group title', function() {
      // NOTE(tsufiev): I wasn't able to test the final .collapse state (without .in)
      // most probably due to transition from .collapse.in -> .collapsing -> .collapse
      // is made with means of CSS, not
      var element = makePanelWithInnerTags(),
        body = getPanelBody(element),
        link = getCollapseBtn(element);

      link.triggerHandler('click');

      expect(body.hasClass('collapse')).toBe(false);
      expect(body.hasClass('collapsing')).toBe(true);
    });

  });

  describe('<collapsible-group>', function() {
    function getGroupBody(groupElem) {
      var div = groupElem.children().children().eq(1);
      return div.hasClass('section-body') && div;
    }

    function getGroupRemoveBtn(groupElem) {
      return groupElem.find('.remove-entry');
    }

    function getGroupAddBtn(groupElem) {
      return groupElem.find('.add-entry');
    }

    function getCollapseBtn(groupElem) {
      return groupElem.find('.collapse-entries');
    }

    function makeGroupElement(contents) {
      var group = $compile(
        '<collapsible-group ' + contents + '></collapsible-group>')($scope);
      $scope.$digest();
      return group;
    }

    function makeGroupWithInnerTags() {
      var group = $compile(
        '<collapsible-group><span class="inner"></span></collapsible-group>'
      )($scope);
      $scope.$digest();
      return group;
    }

    it('starts as being expanded', function() {
      var element = makeGroupWithInnerTags(),
        body = getGroupBody(element);

      expect(body.hasClass('collapse')).toBe(true);
      expect(body.hasClass('in')).toBe(true);
    });

    it('starts to collapse after pressing on triangle next to group title', function() {
      // NOTE(tsufiev): I wasn't able to test the final .collapse state (without .in)
      // most probably due to transition from .collapse.in -> .collapsing -> .collapse
      // is made with means of CSS, not
      var element = makeGroupWithInnerTags(),
        body = getGroupBody(element),
        link = getCollapseBtn(element);

      link.triggerHandler('click');

      expect(body.hasClass('collapse')).toBe(false);
      expect(body.hasClass('collapsing')).toBe(true);
    });

    it('requires to specify `on-remove` to make group removable', function() {
      var element1, element2;
      $scope.remove = function() {};
      element1 = makeGroupElement('');
      element2 = makeGroupElement('on-remove="remove()"');

      expect(getGroupRemoveBtn(element1).length).toBe(0);
      expect(getGroupRemoveBtn(element2).hasClass('ng-hide')).toBe(false);
    });

    it('`removable` attribute set explicitly to `false` makes group not removable', function() {
      var element;
      $scope.remove = function() {};
      element = makeGroupElement('on-remove="remove()" removable="false"');

      expect(getGroupRemoveBtn(element).length).toBe(0);
    });

    it('requires to specify `on-add` to make group additive', function() {
      var element1, element2;
      $scope.add = function() {};
      element1 = makeGroupElement('');
      element2 = makeGroupElement('on-add="add()"');

      expect(getGroupAddBtn(element1).length).toBe(0);
      expect(getGroupAddBtn(element2).hasClass('ng-hide')).toBe(false);
    });

    it('`additive` attribute set explicitly to `false` makes group not additive', function() {
      var element;
      $scope.add = function() {};
      element = makeGroupElement('on-add="add()" additive="false"');

      expect(getGroupAddBtn(element).length).toBe(0);
    });

    it('contents are inserted into div.collapse tag', function() {
      var element = makeGroupWithInnerTags();

      expect(getGroupBody(element).find('span').hasClass('inner')).toBe(true);
    });

  });

  describe('<typed-field>', function() {
    function makeFieldElem(contents) {
      return $compile(
        '<div><typed-field ' + contents + '></typed-field></div>')($scope);
    }

    it('type of resulting field is determined by `type` attribute', function() {
      var element1, element2;
      $scope.value1 = {type: 'text'};
      $scope.value2 = {type: 'number'};
      element1 = makeFieldElem('value="value1" type="{$ value1.type $}"');
      element2 = makeFieldElem('value="value2" type="{$ value2.type $}"');
      $httpBackend.flush();
      $scope.$digest();

      expect(element1.html()).toContain('<textarea');
      expect(element2).toContainElement('input[type=number]');
    });

    it('field is not rendered until the corresponding template has been served', function() {
      var element;
      $scope.value = {type: 'text'};
      element = makeFieldElem('value="value" type="{$ value.type $}"');
      expect(element.html()).not.toContain('<textarea');

      $httpBackend.flush();
      expect(element.html()).toContain('<textarea');
    });

    describe('various types', function() {
      describe('.title() of every field except group', function() {
        it("tries to extract title from '@meta' key", function() {

        });

        it("when no title found in '@meta', takes value of 'name' subfield given it's ImmutableObj", function() {

        });

        it("when no title found both in '@meta' and in 'name' subfield, uses capitalized field ID", function() {

        });
      });

      describe('.title() of group field', function() {
        it('if the field is not removable, uses the conventional .title()', function() {

        });

        it('if the field is removable, uses .title() as a wrapper around .getID()/.setID()', function() {

        });
      })
    })
  });

  xdescribe("'show-focus'", function() {
    var element;

    beforeEach(function() {
      element = $compile(
        '<div><input type="text" ng-show="show" show-focus="show"></div>')($scope);
      $scope.$digest();
    });

    it('allows to immediately set focus on element after it was shown', function() {
      expect(element.is(':focus')).toBe(false);

      $scope.show = true;
      $scope.$apply();

      expect(element.is(':focus')).toBe(true);
    })
  });

  describe('<editable>', function() {
    it('starts with the value not being edited', function() {

    });

    it("enters the editing mode once user clicks 'fa-pencil' icon", function() {

    });

    describe('during editing', function() {
      it("pressing any key except 'Enter' or 'Esc' neither exits editing state, nor changes model", function() {

      });

      it("pressing 'Enter' key changes model and exits editing state", function() {

      });

      it("clicking 'fa-check' icon changes model and exits editing state", function() {

      });

      it("pressing 'Esc' key exits editing state without changing model", function() {

      });

      it("clicking 'fa-close' icon exits editing state without changing model", function() {

      });

      describe('edit box automatically enlarges', function() {
        it('to fit the value being edited', function() {

        });

        it('up to the limit', function() {

        });
      })

    });

  });

  describe("'validatable'", function() {
    var fields;

    beforeEach(inject(function($injector) {
      fields = $injector.get('merlin.field.models');
    }));

    describe('working with the @constraints property:', function() {
      var model, elt,
        goodValue = 'allowedValue',
        badValue = 'restrictedValue',
        errorMessage = 'Wrong value provided';
      beforeEach(function() {
        var modelClass = fields.string.extend({}, {
          '@constraints': [
            function(value) {
              return value !== badValue ? true : errorMessage;
            }
          ]
        });
        $scope.model = modelClass.create();
        elt = $compile('<form name="form"><input name="model" type="text" ' +
          'ng-model="model.value" ng-model-options="{ getterSetter: true }" ' +
          'validatable-with="model"></form>')($scope);
      });

      describe('any valid value', function() {
        beforeEach(function() {
          $scope.form.model.$setViewValue(goodValue);
          $scope.$digest();
        });

        it('is allowed to be entered', function() {
          expect($scope.form.model.$viewValue).toEqual(goodValue);
        });

        it('is propagated into the model', function() {
          expect($scope.model.value()).toEqual(goodValue);
        });

        it('does not cause the input to be marked as erroneous', function() {
          expect(elt.find('input').hasClass('ng-valid')).toBe(true);
        });

        it('sets error message on scope to an empty string', function() {
          expect($scope.error).toEqual('');
        });
      });

      describe('any invalid value', function() {
        beforeEach(function() {
          $scope.form.model.$setViewValue(badValue);
          $scope.$digest();
        });

        it('is allowed to be entered', function() {
          expect($scope.form.model.$viewValue).toEqual(badValue);
        });

        it('is not propagated into the model', function() {
          expect($scope.model.value()).toBe(undefined);
        });

        it('causes the input to be marked as erroneous', function() {
          expect(elt.find('input').hasClass('ng-invalid')).toBe(true);
        });

        it('exposes error message in the parent scope', function() {
          expect($scope.error).toEqual(errorMessage);
        })
      });
    });

    describe('working with the @required property', function() {
      // TODO: fill in once validation of @required fields changes in Barricade
    });
  });

});
