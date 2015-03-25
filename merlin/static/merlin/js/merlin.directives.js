/**
 * Created by tsufiev on 2/24/15.
 */
(function() {
  function disableClickDefaultBehaviour(element) {
    element.find('a[data-toggle="collapse"]')
      .on('click', function(e) {
        e.preventDefault();
        return true;
      });
  }

  angular.module('hz')

    .directive('editable', function() {
      return {
        restrict: 'E',
        templateUrl: '/static/merlin/templates/editable-popup.html',
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

    .directive('panel', function($parse) {
      return {
        restrict: 'E',
        templateUrl: '/static/merlin/templates/collapsible-panel.html',
        transclude: true,
        scope: {
          title: '@',
          onRemove: '&'
        },
        link: function(scope, element, attrs) {
          scope.removable = $parse(attrs.removable)();
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
          title: '@',
          onAdd: '&',
          onRemove: '&'
        },
        link: function(scope, element, attrs) {
          disableClickDefaultBehaviour(element);
          if ( attrs.onAdd && attrs.additive !== 'false' ) {
            scope.additive = true;
          }
          if ( attrs.onRemove ) {
            scope.removable = true;
          }
        }
      }
    })

    .directive('typedField', [
      '$templateCache', '$compile', 'merlin.templates',
      function($templateCache, $compile, templates) {
        return {
          restrict: 'E',
          scope: {
            title: '@',
            value: '=',
            type: '@'
          },
          link: function(scope, element) {
            templates.templateReady(scope.type).then(function(template) {
              element.replaceWith($compile(template)(scope));
            })
          }
        }
      }])

})();