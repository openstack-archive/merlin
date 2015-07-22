/**
 * Created by tsufiev on 2/24/15.
 */
(function() {
  'use strict';
  angular
    .module('merlin')
    /*
    * Allows to edit field name in-place.
    * For example, you have a field named 'Input 1' and you want to replace this name with
    * "Base input" value.
    * If you add editable directive to such field, you will get a marker icon near this field,
    * and with clicking on this icon you can type new name and save or discard changes.
    * */
    .directive('editable', editable)

    /*
     * this directive auto-sets the focus to an input field once it is shown.
     * */
    .directive('showFocus', showFocus)

    /*
     * tells Merlin to render this element as a panel.
     * */
    .directive('panel', panel)

    /*
     * tells Merlin to render this element as a group with ability to collapse.
     * */
    .directive('collapsibleGroup', collapsibleGroup)

    /*
     * sets up the DOM nodes related to validation of model being edited in this widget
     * (and specifies the name of this model on scope).
     * */
    .directive('validatableWith', validatableWith)

    /*
     * retrieves a template by its name which is the same as model's type and renders it,
     * recursive <typed-field></..>-s are possible.
     * */
    .directive('typedField', typedField)

    .directive('labeled', labeled);

  function labeled() {
    return {
      restrict: 'E',
      templateUrl: '/static/merlin/templates/labeled.html',
      transclude: true,
      scope: {
        label: '=',
        for: '@'
      },
      link: function(scope) {
        if (angular.isFunction(scope.label)) {
          scope.editable = true;
        }
      }
    };
  }

  function editable() {
    return {
      restrict: 'E',
      templateUrl: '/static/merlin/templates/editable.html',
      require: 'ngModel',
      scope: true,
      link: function(scope, element, attrs, ngModelCtrl) {
        var hiddenSpan = element.find('span.width-detector');
        var input = element.find('input');
        var maxWidth = 400;

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

        // Unused variable created here due to rule 'ng_on_watch': 2
        // (see https://github.com/Gillespie59/eslint-plugin-angular)
        var editableValueWatcher = scope.$watch('editableValue', function() {
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
  }

  showFocus.$inject = ['$timeout'];
  function showFocus($timeout) {
    return function(scope, element, attrs) {
      // Unused variable created here due to rule 'ng_on_watch': 2
      // (see https://github.com/Gillespie59/eslint-plugin-angular)
      var showFocusWatcher = scope.$watch(attrs.showFocus, function(newValue) {
        $timeout(function() {
          if (newValue) {
            element.focus();
          }
        });
      });
    };
  }

  function panel() {
    return {
      restrict: 'E',
      templateUrl: '/static/merlin/templates/collapsible-panel.html',
      transclude: true,
      scope: {
        panel: '=content'
      },
      link: function(scope) {
        if (angular.isDefined(scope.panel)) {
          scope.isCollapsed = false;
          if (angular.isFunction(scope.panel.title)) {
            scope.editable = true;
          }
        }
      }
    };
  }

  function collapsibleGroup() {
    return {
      restrict: 'E',
      templateUrl: '/static/merlin/templates/collapsible-group.html',
      transclude: true,
      scope: {
        group: '=content',
        title: '=',
        onAdd: '&',
        onRemove: '&'
      },
      link: function(scope, element, attrs) {
        scope.isCollapsed = false;
        if (angular.isFunction(scope.title)) {
          scope.editable = true;
        }
        if ( attrs.onAdd && attrs.additive !== 'false' ) {
          scope.additive = true;
        }
        if ( attrs.onRemove && attrs.removable !== 'false' ) {
          scope.removable = true;
        }
      }
    };
  }

  validatableWith.$inject = ['$parse'];
  function validatableWith($parse) {
    return {
      restrict: 'A',
      require: 'ngModel',
      link: function(scope, element, attrs, ctrl) {
        var model;
        if ( attrs.validatableWith ) {
          model = $parse(attrs.validatableWith)(scope);
          scope.error = '';
          if (model.setValidatable) {
            model.setValidatable(true);
          }
          if (model.on) {
            model.on('validation', function(result) {
              var isValid = (result == 'succeeded');
              var baseMessage = '';
              // (FIXME): hack until Barricade supports validation of empty required entries
              if ( !model.get() && model.isRequired() ) {
                isValid = false;
                baseMessage = 'This field is required.';
              }
              ctrl.$setValidity('barricade', isValid);
              scope.error = model.hasError() ? model.getError() : baseMessage;
            });
          }
          ctrl.$formatters.push(function(modelValue) {
            return angular.isUndefined(modelValue) ?
              ( ctrl.$isEmpty(ctrl.$viewValue) ? undefined : ctrl.$viewValue ) :
              modelValue;
          });
        }
      }
    };
  }

  typedField.$inject = ['$compile', 'merlin.templates'];
  function typedField($compile, templates) {
    return {
      restrict: 'E',
      scope: {
        value: '=',
        type: '@'
      },
      link: function(scope, element) {
        templates.templateReady(scope.type).then(function(template) {
          element.append($compile(template)(scope));
        });
      }
    };
  }
})();
