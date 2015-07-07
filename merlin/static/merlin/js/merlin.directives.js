/**
 * Created by tsufiev on 2/24/15.
 */
(function() {
  'use strict';

  angular.module('merlin')
    /*
    * Allows to edit field name in-place.
    * For example, you have a field named 'Input 1' and you want to replace this name with "Base input" value.
    * If you add editable directive to such field, you will get a marker icon near this field,
    * and with clicking on this icon you can type new name and save or discard changes.
    * */
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
    /*
    * this directive auto-sets the focus to an input field once it is shown.
    * */
    .directive('showFocus', function($timeout) {
      return function(scope, element, attrs) {
        scope.$watch(attrs.showFocus, function(newValue) {
          $timeout(function() {
            newValue && element.focus();
          });
        });
      };
    })
    /*
    * tells Merlin to render this element as a panel.
    * */
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
        }
      };
    })
    /*
    * tells Merlin to render this element as a group with ability to collapse.
    * */
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
          scope.isCollapsed = false;
          if ( attrs.onAdd && attrs.additive !== 'false' ) {
            scope.additive = true;
          }
          if ( attrs.onRemove && attrs.removable !== 'false' ) {
            scope.removable = true;
          }
        }
      };
    })
    /*
    * sets up the DOM nodes related to validation of model being edited in this widget (and specifies the name of this model on scope).
    * */
    .directive('validatableWith', function($parse) {
      return {
        restrict: 'A',
        require: 'ngModel',
        link: function(scope, element, attrs, ctrl) {
          var model;
          if ( attrs.validatableWith ) {
            model = $parse(attrs.validatableWith)(scope);
            scope.error = '';
            model.setValidatable && model.setValidatable(true);
            model.on && model.on('validation', function(result) {
              var isValid = (result == 'succeeded'),
                baseMessage = '';
              // (FIXME): hack until Barricade supports validation of empty required entries
              if ( !model.get() && model.isRequired() ) {
                isValid = false;
                baseMessage = 'This field is required.';
              }
              ctrl.$setValidity('barricade', isValid);
              scope.error = model.hasError() ? model.getError() : baseMessage;
            });
            ctrl.$formatters.push(function(modelValue) {
              return modelValue === undefined ?
                ( ctrl.$isEmpty(ctrl.$viewValue) ? undefined : ctrl.$viewValue ) :
                modelValue;
            });
          }
        }
      };
    })
    /*
    * retrieves a template by its name which is the same as model's type and renders it, recursive <typed-field></..>-s are possible.
    * */
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
              element.replaceWith($compile(template)(scope));
            });
          }
        };
      }]);

})();
