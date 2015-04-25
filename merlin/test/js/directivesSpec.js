
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
      var iTag = panelElem.find('i').eq(0);
      return iTag.hasClass('fa-times-circle') && iTag;
    }

    function getPanelBody(panelElem) {
      var div = panelElem.children().children().eq(1).children();
      return div.hasClass('panel-body') && div;
    }

    function makePanelElem(contents) {
      return $compile('<panel ' + contents + '></panel>')($scope);
    }

    it('shows panel heading when and only when title is passed via attr', function() {
      var title = 'My Panel',
        element1 = makePanelElem('title="' + title +'"'),
        element2 = makePanelElem('');
      $scope.$digest();

      expect(getPanelHeading(element1).hasClass('ng-hide')).toBe(false);
      expect(element1.html()).toContain(title);
      expect(getPanelHeading(element2).hasClass('ng-hide')).toBe(true);
    });

    it('requires both `title` and `removable` to be removable', function() {
      var title = 'My Panel',
        element1, element2;

      element1 = makePanelElem('title="' + title +'" removable="true"');
      element2 = makePanelElem('title="' + title +'"');
      $scope.$digest();

      expect(getPanelRemoveButton(element1).hasClass('ng-hide')).toBe(false);
      expect(getPanelRemoveButton(element2).hasClass('ng-hide')).toBe(true);
    });

    it('with `on-remove`, but without `removable` is not removable', function() {
      var title = 'My Panel',
        element1, element2;

      $scope.remove = function() {};
      element1 = makePanelElem(
        'title="' + title +'" removable="true" on-remove="remove()"');
      element2 = makePanelElem('title="' + title +'" on-remove="remove()"');
      $scope.$digest();

      expect(getPanelRemoveButton(element1).hasClass('ng-hide')).toBe(false);
      expect(getPanelRemoveButton(element2).hasClass('ng-hide')).toBe(true);
    });

    it('contents are inserted into div.panel-body tag', function() {
      var element = $compile('<panel><span class="inner"></span></panel>')($scope);
      $scope.$digest();

      expect(getPanelBody(element).find('span').hasClass('inner')).toBe(true);
    });

  });

  describe('<collapsible-group>', function() {
    function getGroupBody(groupElem) {
      var div = groupElem.children().children().eq(1);
      return div.hasClass('collapse') && div;
    }

    function getGroupRemoveBtn(groupElem) {
      var div = groupElem.children().children().eq(0).children().eq(2);
      return div.hasClass('add-btn') && div;
    }

    function getGroupAddBtn(groupElem) {
      var div = groupElem.children().children().eq(0).children().eq(1);
      return div.hasClass('add-btn') && div;
    }

    function makeGroupElement(contents) {
      return $compile(
        '<collapsible-group ' + contents + '></collapsible-group>')($scope);
    }

    it('requires to specify `on-remove` to make group removable', function() {
      var element1, element2;
      $scope.remove = function() {};
      element1 = makeGroupElement('');
      element2 = makeGroupElement('on-remove="remove()"');
      $scope.$digest();

      expect(getGroupRemoveBtn(element1).hasClass('ng-hide')).toBe(true);
      expect(getGroupRemoveBtn(element2).hasClass('ng-hide')).toBe(false);
    });

    it('requires to specify `on-add` to make group additive', function() {
      var element1, element2;
      $scope.add = function() {};
      element1 = makeGroupElement('');
      element2 = makeGroupElement('on-add="add()"');
      $scope.$digest();

      expect(getGroupAddBtn(element1).hasClass('ng-hide')).toBe(true);
      expect(getGroupAddBtn(element2).hasClass('ng-hide')).toBe(false);
    });

    it('`additive` attribute set explicitly to `false` makes group not additive', function() {
      var element;
      $scope.add = function() {};
      element = makeGroupElement('on-add="add()" additive="false"');
      $scope.$digest();

      expect(getGroupAddBtn(element).hasClass('ng-hide')).toBe(true);
    });

    it('contents are inserted into div.collapse tag', function() {
      var element = $compile(
        '<collapsible-group><span class="inner"></span></collapsible-group>')($scope);
      $scope.$digest();

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
      expect(element2.html()).toContain('<input type="number"');
    });

    it('field is not rendered until the corresponding template has been served', function() {
      var element;
      $scope.value = {type: 'text'};
      element = makeFieldElem('value="value" type="{$ value.type $}"');
      expect(element.html()).not.toContain('<textarea');

      $httpBackend.flush();
      expect(element.html()).toContain('<textarea');
    })
  });
});