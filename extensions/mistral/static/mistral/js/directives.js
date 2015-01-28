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

    .directive('editable', function($compile) {
      return {
        restrict: 'EAC',
        templateUrl: '/static/mistral/js/angular-templates/editable-popup.html',
        scope: {
          label: '@',
          value: '=',
          key: '=',
//          closePopover: '&',
          $event: '='
        },
        link: function(scope, element, attrs) {

          scope.closePopover = function($event){
              console.log('closePopover');
              var el = $event.target;
              $($event.target).parents('div.popover').popover('hide');
              scope.$apply()
          };
          var templateData = "<label>{$ label $}</label>"+
            "<input type='text' class='form-control' ng-model='value'>"+
            "<button class='btn btn-default btn-sm cancel' ng-click='closePopover($event)'>Cancel</button>"+
            "<button class='btn btn-primary btn-sm'>Save</button>";

          var compiledData = $compile(templateData)(scope);
            console.log(compiledData);
//          angular.bind('click,function)'
          $(element).find('a[data-toggle="popover"]')
            .popover({html: true,
                      content: compiledData}) //compiledData

            .on('click', function(e) {
              console.log('clicked');
              e.preventDefault();
              return true;
            })
            .bind('click', function(e) {
              console.log('clicked');
              e.preventDefault();
              return true;
            });

        }
      };
    })
//    .directive('xngPopover', [ '$tooltip',
//        function( $tooltip) {
//          return $tooltip('xngPopover', 'popover', 'click');
//        }
//    ])
//    .directive('xngPopoverPopup', [
//        function() {
//          return {
//            replace: true,
//            scope: { title: '@', content: '@', animation: '@', isOpen: '=' },
//            templateUrl: '/static/mistral/js/angular-templates/editable-popup.html',
//            controller:function($scope){
//              $scope.Hide = function(){
//                $scope.isOpen = false;
//              };
//            }
//          };
//        }
//    ])
//    .directive('popover', function($compile, $timeout){
//      return {
//        restrict: 'A',
//        link:function(scope, el, attrs){
//          var content = attrs.content; //get the template from the attribute
//          var elm = angular.element('<div />'); //create a temporary element
//          elm.append(attrs.content); //append the content
//          $compile(elm)(scope); //compile
////          alert(elm.html())
//          //var template = $templateCache.get(scope.spec.type);
//          //element.replaceWith($compile(template)(scope));
//          $timeout(function() { //Once That is rendered
//            el.removeAttr('popover').attr('data-content',elm.html()); //Update the attribute
//            el.popover(); //set up popover
//            alert(el.html())
//           });
//        }
//      }
//    })
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

    .directive('typedField', function($http, $templateCache, $compile) {
      return {
        restrict: 'E',
        scope: true,
        link: function(scope, element) {
          var template = $templateCache.get(scope.spec.type);
          element.replaceWith($compile(template)(scope));
        }
      }
    })

})();
