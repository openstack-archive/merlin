/**
 * Created by timur on 12.08.14.
 */
var Merlin = angular.module('Merlin', []);

Merlin.factory('DrawTemplate', function() {
    function validateTemplate(template) {
        // FIXME: validation always succeeds for now
        return template;
    }
    return {
        drawTemplate: function(template) {
            template = validateTemplate(jsyaml.load(template));
            var resources = [], max = 0;
            for ( var resource_id in template.resources ) {
                resources.push({
                    name: resource_id,
                    length: resource_id.length,
                    properties: Object.keys(template.resources[resource_id].properties).map(function(key) {
                        if ( key.length > max )
                            max = key.length;
                        return { name: key, length: key.length };
                    })
                })
            }
            return {
                resources: resources,
                fontSize: 20,
                max: max
            }
        }
    }
});

Merlin.controller('TemplateCtrl', function($scope, $http, DrawTemplate) {
    $http({
        method: 'GET',
        url: '/merlin/yaml/helloWorldTemplate.yaml'
    }).success(function(data) {
        $scope.template = data;
        $scope.canvas = DrawTemplate.drawTemplate(data);
    });
    $scope.$watch('template', function(newTemplate) {
        $scope.canvas = DrawTemplate.drawTemplate(newTemplate);
    });

    var svg = d3.select('.right').append('svg').attr({'width': 500, 'height': 300});
    var groups = svg.selectAll('g').data(['KeyName', 'ImageId', 'InstanceType']).enter().append('g').attr('transform',
        function(d, i) {
            var vOffset = 5 + 60*i;
            return 'translate(5, ' + vOffset + ')';
        });
    groups.append('rect').attr({
        'width': 150,
        'height': 50,
        'rx': 10,
        'fill': 'white',
        'stroke': 'black',
        'stroke-width': 2
    });
    groups.append('text').attr({
        'x': 75,
        'y': 25,
        'fill': 'black',
        'text-anchor': 'middle',
        'dominant-baseline': 'central'
    }).text(function(d) { return d; });

});