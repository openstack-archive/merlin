
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
      $httpBackend.whenGET('/static/merlin/templates/fields/.*').respond(
        200, '<div></div>');
    });
  });

  afterEach(function() {
    $httpBackend.verifyNoOutstandingExpectation();
    $httpBackend.verifyNoOutstandingRequest();
  });

  describe('templates basic properties', function() {
    it ('prefetch() works with many fields and single field', function() {
      function prefetch1() {
        templates.prefetch('/baseUrl/', 'someField');
      }
      function prefetch2() {
        templates.prefetch('/baseUrl/', ['someField']);
      }
      expect(prefetch1).not.toThrow();
      expect(prefetch2).not.toThrow();
    });

    it('templateReady() always returns a promise', function() {
      var prefetchedField = 'theField',
        notPrefetchedField = 'anotherField';
      templates.prefetch('/baseUrl/', prefetchedField);

      expect(templates.templateReady(prefetchedField).then).toBeDefined();
      expect(templates.templateReady(notPrefetchedField).then).toBeDefined();
    });
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

    it('templateReady() rejects on not prefetched field', function() {
      processTemplate('theField');
      $httpBackend.flush();

      expect(success).toBe(false);
      expect(failure).toBe(true);
    });

    it('templateReady() rejects on prefetched, but not existing field', function() {
      var wrongFieldName = 'theWrongField',
        properFieldName = 'theField',
        properBaseUrl = '/baseUrl/',
        wrongUrl = 'someUrl';

      templates.prefetch(properBaseUrl, wrongFieldName);
      templates.prefetch(wrongUrl, properFieldName);
      $httpBackend.flush();

      processTemplate(wrongFieldName);
      expect(success).toBe(false);
      expect(failure).toBe(true);

      processTemplate(properFieldName);
      expect(success).toBe(false);
      expect(failure).toBe(true);
    });

    it('templateReady() resolves on prefetched existing field', function() {
      var fieldName = 'theField',
        properBaseUrl = '/baseUrl/';

      templates.prefetch(properBaseUrl, fieldName);
      $httpBackend.flush();
      processTemplate(fieldName);

      expect(success).toBe(true);
      expect(failure).toBe(false);
    });

  });

});