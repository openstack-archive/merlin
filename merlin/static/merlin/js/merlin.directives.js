/**
 * Created by tsufiev on 2/24/15.
 */
(function() {
  'use strict';

  function disableClickDefaultBehaviour(element) {
    element.find('a[ng-click]')
      .on('click', function(e) {
        e.preventDefault();
        return true;
      });
  }

  angular.module('merlin')
    .directive('editable', function() {
      return {
        restrict: 'E',
        templateUrl: '/static/merlin/templates/editable.html',
        require: 'ngModel',
        scope: true,
        link: function(scope, element, attrs, ngModelCtrl) {
          var hiddenSpan = element.find('span.width-detector'),
            input = element.find('input'),
            maxWidth = 400;

          function adjustWidth() {
            var width;
            hiddenSpan.html(scope.editableValue);
            width = hiddenSpan.width();
            input.width(width <= maxWidth ? width : maxWidth);
          }

          function accept() {
            ngModelCtrl.$setViewValue(scope.editableValue);
            scope.isEdited = false;
          }

          function reject() {
            ngModelCtrl.$rollbackViewValue();
            scope.isEdited = false;
          }

          scope.isEdited = false;
          scope.$watch('editableValue', function() {
            adjustWidth();
          });
          input.on('keyup', function(e) {
            if ( e.keyCode == 13 ) {
              accept();
              scope.$apply();
            } else if (e.keyCode == 27 ) {
              reject();
              scope.$apply();
            }
          });
          ngModelCtrl.$render = function() {
            if ( !ngModelCtrl.$viewValue ) {
              ngModelCtrl.$viewValue = ngModelCtrl.$modelValue;
            }
            scope.editableValue = ngModelCtrl.$viewValue;
            adjustWidth();
          };
          scope.accept = accept;
          scope.reject = reject;
        }
      };
    })
    .directive('showFocus', function($timeout) {
      return function(scope, element, attrs) {
        scope.$watch(attrs.showFocus, function(newValue) {
          $timeout(function() {
            newValue && element.focus();
          });
        });
      }
    })
    .directive('panel', function($parse) {
      return {
        restrict: 'E',
        templateUrl: '/static/merlin/templates/collapsible-panel.html',
        transclude: true,
        scope: {
          panel: '=content'
        },
        link: function(scope, element, attrs) {
          scope.removable = $parse(attrs.removable)();
          scope.isCollapsed = false;
          disableClickDefaultBehaviour(element);
        }
      }
    })
    .directive('collapsibleGroup', function() {
      return {
        restrict: 'E',
        templateUrl: '/static/merlin/templates/collapsible-group.html',
        transclude: true,
        scope: {
          group: '=content',
          onAdd: '&',
          onRemove: '&'
        },
        link: function(scope, element, attrs) {
          disableClickDefaultBehaviour(element);
          scope.isCollapsed = false;
          if ( attrs.onAdd && attrs.additive !== 'false' ) {
            scope.additive = true;
          }
          if ( attrs.onRemove && attrs.removable !== 'false' ) {
            scope.removable = true;
          }
        }
      }
    })
    .directive('validatable', function() {
      return {
        restrict: 'A',
        require: 'ngModel',
        link: function(scope, element, attrs, ctrl) {
          scope.error = '';
          var model = scope.value;
          model.on('validation', function(result) {
            var isValid = (result == 'succeeded');
            ctrl.$setValidity('barricade', isValid);
            scope.error = model.hasError() ? model.getError() : '';
          });
          ctrl.$formatters.push(function(modelValue) {
            return modelValue === undefined ?
              ( ctrl.$isEmpty(ctrl.$viewValue) ? undefined : ctrl.$viewValue ) :
              modelValue;
          });
        }
      }
    })
    .directive('typedField', ['$compile', 'merlin.templates',
      function($compile, templates) {
        return {
          restrict: 'E',
          scope: {
            value: '=',
            type: '@'
          },
          link: function(scope, element) {
            templates.templateReady(scope.type).then(function(template) {
              if ( scope.value.getSuggestions ) {
                template = angular.element(template);
                template.find('input').each(function(index, elem) {
                  // reset the 'autocompletable' attribute only if it's already
                  // present on the element
                  elem = angular.element(elem);
                  if ( elem.attr('autocompletable') ) {
                    elem.removeAttr('autocompletable');
                    elem.attr('typeahead-editable', true);
                    elem.attr('typeahead',
                      "option for option in value.getSuggestions() | filter:$viewValue");
                  }
                });
              }
              element.replaceWith($compile(template)(scope));
            })
          }
        }
      }])

})();