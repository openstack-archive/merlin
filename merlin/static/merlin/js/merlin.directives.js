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

    .directive('draggableEntry', draggableEntry);

  collapsibleGroup.$inject = ['$parse'];
  typedField.$inject = ['$compile', 'merlin.templates'];

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

  function panel($parse) {
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
  }

  function collapsibleGroup($parse) {
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
        if (angular.isDefined(attrs.collapsed)) {
          scope.isCollapsed = $parse(attrs.collapsed)();
        } else {
          scope.isCollapsed = false;
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

  function typedField($compile, templates) {
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
  }

  function draggableEntry() {
    return {
      restrict: 'E',
      scope: {
        entry: '='
      },
      link: link,
      templateUrl: '/static/merlin/templates/draggable-entry.html'
    };

    function link(scope, element, attrs) {
      if (angular.isDefined(attrs.entryIcon)) {
        scope.iconCls = 'fa-' + attrs.entryIcon;
      }
    }
  }
})();
