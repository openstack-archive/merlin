/**
 * Created by tsufiev on 12/29/14.
 */

(function() {
  angular.module('hz')

    .directive('yaqlFieldCombined', function() {
      return {
        restrict: 'E',
        templateUrl: '/static/mistral/templates/yaql-field-combined.html',
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

})();
