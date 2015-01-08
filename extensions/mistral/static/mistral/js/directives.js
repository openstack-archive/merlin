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

  function makeFieldDirective(type, func) {
    return function() {
      return {
        restrict: 'A',
        scope: true,
        templateUrl: '/static/mistral/js/angular-templates/fields/' + type + '.html',
        link: function (scope, element, attrs) {
          scope.name = attrs.name;
          scope.title = attrs.title;
          if (func) {
            func(scope, element, attrs);
          }
        }
      };
    };
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

    .directive('dictionaryField', makeFieldDirective('dictionary'))
    .directive('frozendictField', makeFieldDirective('frozendict'))
    .directive('listField', makeFieldDirective('list'))
    .directive('stringField', makeFieldDirective('string'))
    .directive('varlistField', makeFieldDirective('varlist'))

    .directive('action', function($compile, $filter, $interpolate, schema, isAtomic) {
      var orderBy = $filter('orderBy'),
        toArray = $filter('toArray'),
        groupBy = $filter('groupBy');
      return {
        restrict: 'E',
        compile: function(tElement, tAttrs) {
          angular.forEach(
            orderBy(toArray(groupBy(schema.action, 'group'), true), '-$key'),
            function(specs) {
              var group = specs.$key,
                cls = group ? 'class="three-columns" ' : '',
                $groupElt = angular.element('<div ' + cls + '></div>');
              tElement.append($groupElt);
              angular.forEach(specs, function(spec, index) {
                var cls = '',
                  separator = index % 2 ? '<div class="clearfix"></div>' : '',
                  elt;
                if ( isAtomic(spec.type) ) {
                  cls = index % 2 ? 'right-column' : 'left-column';
                }
                elt = $interpolate(
                  '<div class="{$ cls $}">' +
                  '<div {$ type $}-field="{$ type $}" title="{$ title $}" name="{$ name $}" item="item">' +
                  '{$ columnsSeparator $}</div></div>'
                )({
                  cls: cls, type: spec.type, name: spec.name, title: spec.title,
                  columnsSeparator: separator
                });
                $groupElt.append(elt);
              })
            });
          var linkFns = [];
          tElement.children().each(function(tElem) {
            linkFns.push($compile(tElem));
          });
          return function(scope) {
            linkFns.forEach(function(linkFn) {
              linkFn(scope);
            })
          }
        }
      }
    })

})();
