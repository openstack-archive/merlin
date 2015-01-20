/**
 * Created by tsufiev on 12/29/14.
 */

(function() {
  function disableClickDefaultBehaviour(element) {
    angular.element(element).find('a[data-toggle="collapse"]')
      .on('click', function(e) {
        e.preventDefault();
        return true;
      });
  }

  angular.module('hz')

    .directive('editable', function() {
      return {
        restrict: 'E',
        templateUrl: '/static/mistral/js/angular-templates/editable-popup.html',
        scope: {
          label: '@',
          value: '='
        },
        link: function(scope, element) {
          angular.element(element).find('a[data-toggle="popover"]')
            .popover({html: true})
            .on('click', function(e) {
              e.preventDefault();
              return true;
            });
        }
      };
    })

    .directive('yaqlFieldCombined', function() {
      return {
        restrict: 'E',
        templateUrl: '/static/mistral/js/angular-templates/yaql-field-combined.html',
        scope: {
          yaqlExpression: '@',
          value: '@'
        },
        link: function(scope, element) {
          angular.element(element).find('span.yaql-condition')
            .on('click', function() {
              var $elt = $(this),
                $inputColumn = $elt.closest('.three-columns').children(':first-child'),
                $input;

              $elt.hide();
              $input = $inputColumn.show().find('textarea');
              $input.focus().on('blur', function() {
                $inputColumn.hide();
                $elt.toggleClass('fa-lock', $input.val() !== '');
                $elt.toggleClass('fa-unlock', $input.val() === '');
                $elt.show();
              });
            });
        }
      }
    })

    .directive('collapsiblePanel', function($parse, defaultSetter) {
      return {
        restrict: 'E',
        templateUrl: '/static/mistral/js/angular-templates/collapsible-panel.html',
        transclude: true,
        scope: {
          title: '@',
          removable: '&'
        },
        link: function(scope, element, attrs) {
          disableClickDefaultBehaviour(element);
        }
      }
    })

    .directive('collapsibleGroup', function($parse, defaultSetter) {
      return {
        restrict: 'E',
        templateUrl: '/static/mistral/js/angular-templates/collapsible-group.html',
        transclude: true,
        scope: {
          title: '@',
          onAdd: '&',
          onRemove: '&'
        },
        link: function(scope, element, attrs) {
          disableClickDefaultBehaviour(element);
          if ( attrs.onAdd ) {
            scope.additive = true;
          }
          if ( attrs.onRemove ) {
            scope.removable = true;
          }
        }
      }
    })

    .directive('typedField', function($http, $templateCache, $compile, suggestionService) {
      return {
        restrict: 'E',
        scope: true,
        link: function(scope, element, attrs) {
          scope.suggestions = suggestionService.getSuggestions(); // TODO param:field
          var template = $templateCache.get(scope.spec.type);
          element.replaceWith($compile(template)(scope));
        }
      }
    })
})();
