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

    function drawSelectElement(labels, values, selected) {
        var $input = $('<select>');
        values.forEach(function(value, index) {
            var $opt = $('<option></option>').val(value).text(labels[index]);
            $input.append($opt);
        });
        $input.val(selected);
        return $input;
    }

    function drawSelectNode(label, item) {
        var $item = $('<div></div>'),
            $label = $('<label></label>').text(label),
            $set = $('<button>').text('Set');
        $set.click(function() {
            item.set($input.val());
        });
        $item.append($label);
        $item.append(drawSelectElement(item.getEnumLabels(), item.getEnumValues(), item.get()));
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
            $container = $('<div></div>').attr('id', containerId).hide(),
            $typeSelector;
        counter++;
        $item.append($label);
        $item.append($keyName);
        if ( item.instanceof(types.base.AcceptsMixin) ) {
            var labels = item.getLabels();
            $typeSelector = drawSelectElement(labels, labels, labels[0]);
            $item.append($typeSelector);
        }
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
            var key = $keyName.val(), child, cls;
            if ( item.instanceof(types.base.AcceptsMixin) ) {
                cls = item.getValue($typeSelector.val());
                child = cls.create(undefined, {id: key});
            }
            item.push(child, {id: key});
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