
 /*    Copyright (c) 2014 Mirantis, Inc.

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
describe('merlin.templates', function() {
  'use strict';

  var templates, $httpBackend;

  beforeEach(function() {
    angular.mock.module('merlin');
    angular.mock.inject(function($injector) {
      templates = $injector.get('merlin.templates');
      $httpBackend = $injector.get('$httpBackend');
    });
  });

  afterEach(function() {
    $httpBackend.verifyNoOutstandingExpectation();
    $httpBackend.verifyNoOutstandingRequest();
  });

  describe('template retrieval success/failure', function() {
    var success, failure;
    beforeEach(function() {
      success = failure = false;
      $httpBackend.expectGET('/baseUrl/theField.html').respond(
        200, '<div id="myTemplate"></div>');
    });

    function processTemplate(fieldName) {
      templates.templateReady(fieldName).then(function() {
        success = true;
      }, function() {
        failure = true;
      });
    }

    it('templateReady() requires initial prefetch to resolve template', function() {
      processTemplate('theField');
      $httpBackend.flush();

      expect(success).toBe(false);
      expect(failure).toBe(true);
    });

    it('templateReady() resolves with existing template', function() {
      var fieldName = 'theField';
      templates.prefetch('/baseUrl/', fieldName);
      $httpBackend.flush();
      processTemplate(fieldName);

      expect(success).toBe(true);
      expect(failure).toBe(false);
    });

    it('templateReady() rejects on non-existing template', function() {
      var fieldName = 'theWrongField';
      templates.prefetch('/baseUrl/', fieldName);
      $httpBackend.flush();
      processTemplate();

      expect(success).toBe(false);
      expect(failure).toBe(true);
    });
  });

});