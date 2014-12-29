/**
 * Created by tsufiev on 12/29/14.
 */
  angular.module('hz').directive('editable', function($document) {
    return {
      restrict: 'E',
      templateUrl: '/static/mistral/js/angular-templates/editable-popup.html',
      scope: {
        label: '@',
        value: '@'
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
  });
