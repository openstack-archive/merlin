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

    .directive('action', function() {
      return {
        restrict: 'E',
        scope: {}
      }
    })

    .directive('collapsiblePanel', function($parse, idGenerator, defaultSetter) {
      return {
        restrict: 'E',
        templateUrl: '/static/mistral/js/angular-templates/collapsible-panel.html',
        transclude: true,
        scope: {
          title: '@',
          removable: '@'
        },
        compile: function(element, attrs) {
          defaultSetter(attrs, 'removable', false);
          return {
            post: function(scope, element, attrs) {
              scope.id = idGenerator();
              disableClickDefaultBehaviour(element);
            }
          }
        }
      }
    })

    .directive('collapsibleGroup', function($parse, idGenerator, defaultSetter) {
      return {
        restrict: 'E',
        templateUrl: '/static/mistral/js/angular-templates/collapsible-group.html',
        transclude: true,
        scope: {
          title: '@',
          additive: '@',
          removable: '@'
        },
        compile: function(element, attrs) {
          defaultSetter(attrs, 'removable', false);
          defaultSetter(attrs, 'additive', false);
          return {
            post: function(scope, element) {
              scope.id = idGenerator();
              disableClickDefaultBehaviour(element);
            }
          }
        }
      }
    })

    .directive('typedField', function($http, $templateCache, $compile, idGenerator) {
      return {
        restrict: 'E',
        scope: true,
        link: function(scope, element, attrs) {
          scope.id = idGenerator();
          $http.get(
            '/static/mistral/js/angular-templates/fields/' + scope.spec.type + '.html',
            {cache: $templateCache}).success(function(templateContent) {
              element.replaceWith($compile(templateContent)(scope));
            });
        }
      }
    })


})();
