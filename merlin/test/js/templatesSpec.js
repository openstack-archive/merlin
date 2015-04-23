
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
describe('merlin templates', function() {
  'use strict';

  var templates, $httpBackend, $rootScope;

  beforeEach(module('merlin'));

  beforeEach(inject(function($injector) {
    var expectedRequestsStr = '/static/merlin/templates/fields/.*',
      expectedRequests = new RegExp(expectedRequestsStr);
    $httpBackend = $injector.get('$httpBackend');
    $httpBackend.whenGET(expectedRequests).respond(200, '');
    templates = $injector.get('merlin.templates');
    $rootScope = $injector.get('$rootScope');
  }));

  function verifyHttpExpectations() {
    $httpBackend.verifyNoOutstandingExpectation();
    $httpBackend.verifyNoOutstandingRequest();
  }

  describe('basic properties:', function() {
    var baseUrl = '/baseUrl/',
      fieldName = 'theField',
      fieldName1 = 'theField1';

    it('prefetch() initiates an ajax requests', function() {
      $httpBackend.expectGET(baseUrl + fieldName + '.html').respond(200, '');
      templates.prefetch(baseUrl, fieldName);

      $httpBackend.expectGET(baseUrl + fieldName + '.html').respond(200, '');
      $httpBackend.expectGET(baseUrl + fieldName1 + '.html').respond(200, '');
      templates.prefetch(baseUrl, [fieldName, fieldName1]);

      $httpBackend.flush();
      verifyHttpExpectations();
    });

    it('templateReady() always returns a promise', function() {
      var prefetchedField = 'theField',
        notPrefetchedField = 'anotherField';

      $httpBackend.whenGET(new RegExp(baseUrl + '.*')).respond(200, '');
      templates.prefetch(baseUrl, prefetchedField);

      expect(templates.templateReady(prefetchedField).then).toBeDefined();
      expect(templates.templateReady(notPrefetchedField).then).toBeDefined();
    });

  });

  describe('retrieval:', function() {
    var wrongFieldName = 'theWrongField',
      properFieldName = 'theField',
      properBaseUrl = '/theProperUrl/',
      wrongBaseUrl = '/theWrongUrl/',
      success, failure;

    function processTemplate(fieldName) {
      var promise = templates.templateReady(fieldName);

      promise.then(function() {
        success = true;
      }, function() {
        failure = true;
      });
      $rootScope.$apply();
    }

    beforeEach(function() {
      success = failure = false;
      $httpBackend.whenGET(
        properBaseUrl + properFieldName + '.html').respond(200, '');
      $httpBackend.whenGET(
        properBaseUrl + wrongFieldName + '.html').respond(404, '');
      $httpBackend.whenGET(
        wrongBaseUrl + properFieldName + '.html').respond(404, '');
    });

    it('templateReady() rejects on not prefetched field', function() {
      processTemplate('theField');
      expect(failure).toBe(true);
    });

    it('templateReady() rejects on prefetched, but not existing field', function() {
      templates.prefetch(properBaseUrl, wrongFieldName);
      templates.prefetch(wrongBaseUrl, properFieldName);
      $httpBackend.flush();

      processTemplate(wrongFieldName);
      expect(failure).toBe(true);

      processTemplate(properFieldName);
      expect(failure).toBe(true);
    });

    it('templateReady() resolves on prefetched existing field', function() {
      templates.prefetch(properBaseUrl, properFieldName);
      $httpBackend.flush();

      processTemplate(properFieldName);
      expect(success).toBe(true);
    });

  });

});