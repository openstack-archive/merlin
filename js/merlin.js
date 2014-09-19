/*    Copyright (c) 2014 Mirantis, Inc.

    Licensed under the Apache License, Version 2.0 (the "License"); you may
    not use this file except in compliance with the License. You may obtain
    a copy of the License at

         http://www.apache.org/licenses/LICENSE-2.0

    Unless required by applicable law or agreed to in writing, software
    distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
    WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
    License for the specific language governing permissions and limitations
    under the License.
*/

var types = {
    Mistral: {
        actions: {}
    },
    HOT: {}
};

types.Mistral.Version = Barricade.create({
    '@type': Number,
    '@default': 2
});

types.Mistral.Action =  Barricade.create({
    '@type': Object,

    'version': {
        '@type': Number,
        '@ref': {
            to: types.Mistral.Version,
            needs: function () {
                return types.Mistral.Workbook;
            },
            resolver: function(json, parentObj) {
                return parentObj.get('version')
            }
        }
    },

//    'version': {
//        '@type': Number,
//        '@default': 2
//    },
    'name': {'@type': String},
    'base': {
        '@type': String,
//        '@enum': function() {
//            // TODO: obtain list of predefined actions from Mistral server-side
//            var predefinedActions = ['createInstance', 'terminateInstance'],
//                name = this.get()
//            workbook.get('actions').each(function(actionItem) {
//                console.log(actionItem);
//            });
//        }
    },
    'base-parameters': {
        '@type': Object,
        '@required': false,
        '?': {'@type': String}
    }
});

types.Mistral.Policy = Barricade.create({
    '@type': Object,

    'wait-before': {
        '@type': Number,
        '@required': false
    },
    'wait-after': {
        '@type': Number,
        '@required': false
    },
    'retry': {
        '@type': Object,
        '@required': false,
        'count': {'@type': Number},
        'delay': {'@type': Number},
        'break-on': {
            '@type': String,
            '@required': false
        }
    }
});

types.Mistral.Task = Barricade.create({
    '@type': Object,

    'version': {
        '@type': Number,
        '@default': 2
    },
    'name': {'@type': String},
    'parameters': {
        '@type': Object,
        '@required': false,
        '?': {'@type': String}
    },
    'publish': {
        '@type': String,
        '@required': false
    },
    'policies': {
        '@class': types.Mistral.Policy,
        '@required': false
    },
    'requires': { // array of Task-s existing in the same workflow
        '@type': Array,
        '@required': false,
        '*': {'@type': String}
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

types.Mistral.WorkflowTask = types.Mistral.Task.extend({},
    {
        'workflow': {
            '@type': String,
            '@required': false
        }
    });

types.Mistral.ActionTask = types.Mistral.Task.extend({},
    {
        'action': {
            '@type': String,
            '@required': false
        }
    });

types.Mistral.Workflow = Barricade.create({
    '@type': Object,

    'version': {
        '@type': Number,
        '@default': 2
    },
    'name': {'@type': String},
    'type': {
        '@type': String,
        '@enum': ['reverse', 'direct'],
        '@default': 'direct'
    },
    'parameters': {
        '@type': Object,
        '@required': false,
        '?': {'@type': String}
    },
    'output': {
        '@type': String,
        '@required': false
    },
    'tasks': {
        '@type': Object,
        '?': {'@class': types.Mistral.Task}
    }

});

types.Mistral.Workbook = Barricade.create({
    '@type': Object,

    'version': {
        '@class': types.Mistral.Version
    },
    'description': {
        '@type': String,
        '@required': false
    },
    'actions': {
        '@type': Array,
        '@required': false,
        '*': {
            '@class': types.Mistral.Action
        }
    },
    'workflows': {
        '@type': Array,
        '*': {
            '@class': types.Mistral.Workflow
        }
    }
});

var workbook,
    counter = 0;
$(function() {
    function drawBaseNode(label, item, type, converter) {
        var $item = $('<div></div>'),
            $label = $('<label></label>').text(label),
            $input = $('<input>'),
            $set = $('<button>').text('Set');
        converter = converter || function(x) { return x;};
        $set.click(function() {
            item.set(converter($input.val()));
        });
        $input.val(item.get());
        $item.append($label);
        $item.append($input.attr('type', type));
        $item.append($set);
        return $item;
    }

    function drawSelectNode(label, item) {
        var $item = $('<div></div>'),
            $label = $('<label></label>').text(label),
            $input = $('<select>'),
            labels = item.getEnumLabels(),
            values = item.getEnumValues(),
            $set = $('<button>').text('Set');
        $set.click(function() {
            item.set($input.val());
        });
        values.forEach(function(value, index) {
            var $opt = $('<option></option>').val(value).text(labels[index]);
            $input.append($opt);
        });
        $input.val(item.get());
        $item.append($label);
        $item.append($input);
        $item.append($set);
        return $item;

    }

    function drawTextNode(label, item) {
        return drawBaseNode(label, item, 'text');
    }

    function drawNumberNode(label, item) {
        return drawBaseNode(label, item, 'number', Number);
    }

    function drawBooleanNode(label, item) {
        return drawBaseNode(label, item, 'checkbox');
    }

    function drawArrayNode(label, item) {
        var $item = $('<div class="inner-node"></div>'),
            $label = $('<label></label>').text(label).toggleClass('expandable'),
            $addAction = $('<button>').text('Add').toggleClass('container-action'),
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

    function drawFluidContainerNode(label, item) {
        var $item = $('<div class="inner-node"></div>'),
            labelId = 'label-' + counter,
            containerId = 'container-' + counter,
            $label = $('<label></label>').attr('id', labelId).text(label).toggleClass('expandable'),
            $keyName = $('<input>'),
            $addAction = $('<button>').text('Add').attr('disabled', true),
            $container = $('<div></div>').attr('id', containerId).hide();
        counter++;
        $item.append($label);
        $item.append($keyName);
        $item.append($addAction);
        drawContainer($container, item);
        $item.append($container);
        $keyName.change(function(value) {
            if ( !value ) {
                $addAction.attr('disabled', true);
            } else {
                $addAction.attr('disabled', false);
            }
        });
        $addAction.click(function() {
            var key = $keyName.val();
            item.push(undefined, {id: key});
            drawTypedNode($container, key, item.getByID(key));
        });
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
        return item.instanceof(Barricade.Primitive) && Barricade.getType(item.get()) === primitiveType;
    }

    function drawArray($canvas, array) {
        array.each(function(index, item) {
            drawTypedNode($canvas, 'Element #'+index, item);
        });
    }

    function drawTypedNode($canvas, label, item) {
        var $node;
        if ( item.instanceof(Barricade.Enumerated) ) {
            $node = drawSelectNode(label, item);
            $canvas.append($node);
        } else if ( isPrimitiveType(item, Number) ) {
            $node = drawNumberNode(label, item);
            $canvas.append($node);
        } else if ( isPrimitiveType(item, String) ) {
            $node = drawTextNode(label, item);
            $canvas.append($node);
        } else if ( isPrimitiveType(item, Boolean) ) {
            $node = drawBooleanNode(label, item);
            $canvas.append($node);
        } else if ( item.instanceof(Barricade.Array) ) {
            $node = drawArrayNode(label, item);
            $canvas.append($node);
        } else if ( item.instanceof(Barricade.MutableObject) ) {
            $node = drawFluidContainerNode(label, item);
            $canvas.append($node);
        } else if ( item.instanceof(Barricade.Container) ) {
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
    });

    $('button#save-workbook').click(function() {
        $('.right').text(jsyaml.dump(workbook.toJSON()));
    })
});