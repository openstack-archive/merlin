var types = {
    Mistral: {
        actions: {}
    },
    HOT: {}
};

types.Mistral.Action =  Barricade({
    '@type': Object,

    'Version': {'@type': String},
    'name': {'@type': String},
    'base': {'@type': String},
    'base-parameters': {
        '@type': String,
        '@required': false
    },
    'parameters': {
        '@type': Array,
        '@required': false,
        '*': {'@type': String}
    }
});

types.Mistral.Task = Barricade({
    '@type': Object,

    'Version': {'@type': String},
    'name': {'@type': String},
    'action': {
        '@type': String,
        '@required': false
    },
    'workflow': { // 'action' and 'workflow' are mutually-exclusive but at least one is required
        '@type': String,
        '@required': false
    },
    'workflow-parameters': {
        '@type': String,
        '@required': false
    },
    'parameters': {
        '@type': String,
        '@required': false
    },
    'publish': {
        '@type': String,
        '@required': false
    },
    'policies': {
        '@type': String,
        '@required': false
    },
    'requires': {
        '@type': String,
        '@required': false
    },
    'on-complete': {
        '@type': String,
        '@required': false
    },
    'on-success': {
        '@type': String,
        '@required': false
    },
    'on-error': {
        '@type': String,
        '@required': false
    }

});

types.Mistral.Workflow = Barricade({
    '@type': Object,

    'Version': {'@type': String},
    'name': {'@type': String},
    'type': {
        '@type': String,
        '@constraints': [function(type) {
            var possibleTypes = ['reverse', 'direct'],
                validType = possibleTypes.indexOf(type) > -1;
            return validType || ('Expected: ' + possibleTypes + ' while ' + type + ' found');
        }]
    },
    'start-task': {
        '@type': String,
        '@required': false
    },
    'policies': {
        '@type': String,
        '@required': false
    },
    'parameters': {
        '@type': String,
        '@required': false
    },
    'output': {
        '@type': String,
        '@required': false
    },
    'tasks': {
        '@type': Array,
        '*': {'@class': types.Mistral.Task}
    }

});

types.Mistral.Workbook = Barricade({
    '@type': Object,

    'Version': {'@type': Number},
    'Description': {
        '@type': String,
        '@required': false
    },
    'Actions': {
        '@type': Array,
        '@required': false,
        '*': {
            '@class': types.Mistral.Action
        }
    },
    'Workflows': {
        '@type': Array,
        '*': {
            '@class': types.Mistral.Workflow
        }
    }
});

var workbook,
    counter = 0;
$(function() {
    function drawTextNode(label, item) {
        var $item = $('<div></div>'),
            $label = $('<label></label>').text(label),
            $input = $('<input>');
        $item.append($label);
        return $item.append($input.attr('type', 'text'));
    }

    function drawNumberNode(label, item) {
        var $item = $('<div></div>'),
            $label = $('<label></label>').text(label),
            $input = $('<input>');
        $item.append($label);
        return $item.append($input.attr('type', 'number'));
    }

    function drawBooleanNode(label, item) {
        var $item = $('<div></div>'),
            $label = $('<label></label>').text(label),
            $input = $('<input>');
        $item.append($label);
        return $item.append($input.attr('type', 'checkbox'));
    }

    function drawArrayNode(label, item) {
        var $item = $('<div class="inner-node"></div>'),
            $label = $('<label></label>').text(label).toggleClass('expandable'),
            $addAction = $('<a href="#" class="container-action">Add</a>'),
            $container = $('<div></div>').hide();

        $item.append($label);
        $label.after($addAction);
        drawArray($container, item);
        $item.append($container);
        $label.click(function() {
            $label.toggleClass('expanded');
            if ( $label.hasClass('expanded') ) {
                $container.show();
            } else {
                $container.hide();
            }
        });
        $addAction.click(function() {
            item.push();
            var length = item.length();
            drawTypedNode($container, 'Element #'+length, item.get(length-1));
        });
        return $item;
    }

    function drawContainerNode(label, item) {
        var $item = $('<div class="inner-node"></div>'),
            labelId = 'label-' + counter,
            containerId = 'container-' + counter,
            $label = $('<label></label>').attr('id', labelId).text(label).toggleClass('expandable'),
            $container = $('<div></div>').attr('id', containerId).hide();
        counter++;
        $item.append($label);
        drawContainer($container, item);
        $item.append($container);
        $label.click(function() {
            $label.toggleClass('expanded');
            if ( $label.hasClass('expanded') ) {
                $container.show();
            } else {
                $container.hide();
            }
        });
        return $item;
    }

    function isPrimitiveType(item, primitiveType) {
        return item.instanceof(Barricade.primitive) && Barricade.getType(item.get()) === primitiveType;
    }

    function drawArray($canvas, array) {
        array.each(function(index, item) {
            drawTypedNode($canvas, 'Element #'+index, item);
        });
    }

    function drawTypedNode($canvas, label, item) {
        var $node;
        if ( isPrimitiveType(item, Number) ) {
            $node = drawNumberNode(label, item);
            $canvas.append($node);
        } else if ( isPrimitiveType(item, String) ) {
            $node = drawTextNode(label, item);
            $canvas.append($node);
        } else if ( isPrimitiveType(item, Boolean) ) {
            $node = drawBooleanNode(label, item);
            $canvas.append($node);
        } else if ( item.instanceof(Barricade.array) ) {
            $node = drawArrayNode(label, item);
            $canvas.append($node);
        } else if ( item.instanceof(Barricade.container) ) {
            $node = drawContainerNode(label, item);
            $canvas.append($node);
        } else {
            $node = $('<label></label>').text('Unknown elt');
            $canvas.append($node);
        }
        return $node;
    }

    function drawContainer($canvas, container) {
        container.each(function(key, item) {
            drawTypedNode($canvas, key, item);
        });
    }

    $('button#create-workbook').click(function() {
        var $controls = $('div#controls');
        $controls.empty();
        workbook = types.Mistral.Workbook.create();

        drawTypedNode($controls, 'Mistral Workbook', workbook).find('label').click();
    })
});