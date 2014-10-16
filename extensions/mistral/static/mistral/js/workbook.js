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

var workbook;

$(function() {
    var __counter = 0;

    function getNextCounter() {
        __counter++;
        return __counter;
    }

    function drawBaseNode($label, item, type, converter) {
        var $item = $('<div></div>'),
            $input = $('<input>');
        converter = converter || function(x) { return x;};
        $input.val(item.get());
        $input.change(function() {
            item.set(converter($input.val()))
        });
        $item.append($label);
        $item.append($input.attr('type', type));
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

    function drawSelectNode($label, item) {
        var $item = $('<div></div>'),
            $select = drawSelectElement(item.getEnumLabels(), item.getEnumValues(), item.get());
        $select.change(function() {
            item.set($select.val());
        });
        $item.append($label);
        $item.append($select);
        return $item;

    }

    function drawTextNode($label, item) {
        return drawBaseNode($label, item, 'text');
    }

    function drawNumberNode($label, item) {
        return drawBaseNode($label, item, 'number', Number);
    }

    function drawBooleanNode($label, item) {
        return drawBaseNode($label, item, 'checkbox');
    }

    function createNewLabel(text) {
        var labelId = 'label-' + getNextCounter(),
            $label = $('<label></label>').text(text);
        return $('<span></span>').append($label).attr('id', labelId);
    }

    function drawArrayNode($label, item) {
        var $item = $('<div class="inner-node"></div>'),
            $addAction = $('<button>').text('Add').toggleClass('container-action'),
            $container = $('<div></div>').hide();

        $label.toggleClass('expandable');
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
            var $removeAction = $('<button>').text('Remove').toggleClass('container-action'),
                $node;

            item.push();
            var length = item.length(),
                subItem = item.get(length-1),
                nameEntity = extractNameSubItem(subItem),
                label = extractBaseName(subItem, 'Element') + '#' + length,
                $childLabel = createNewLabel(label).append($removeAction);

            if ( nameEntity ) {
                nameEntity.set(label);
                nameEntity.on('change', function() {
                    var newName = this.get();
                    $childLabel.text(newName);
                });
            }
            $node = drawTypedNode($container, $childLabel, subItem);

            // make sure newly added item will be immediately shown
            if ( !$label.hasClass('expanded') ) {
                $label.click();
            }
            $childLabel.click();

            $removeAction.click(function() {
                $node.remove();
                item.remove(item.length()-1);
            });
        });
        return $item;
    }

    function drawContainerNode($label, item) {
        var $item = $('<div class="inner-node"></div>'),
            labelId = $label.attr('id'),
            containerId = 'container-' + labelId,
            $container = $('<div></div>').attr('id', containerId).hide();
        $label.toggleClass('expandable');
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

    function extractNameSubItem(item) {
        return item.instanceof(Barricade.Container) && item.get('name');
    }

    function extractBaseName(item, defaultBaseName) {
        defaultBaseName = defaultBaseName || 'Element';
        return item.name || defaultBaseName;
    }

    function drawFluidContainerNode($label, item) {
        var $item = $('<div class="inner-node"></div>'),
            labelId = $label.attr('id'),
            containerId = 'container-' + labelId,
            $keyName = $('<input>'),
            $addAction = $('<button>').text('Add').attr('disabled', true),
            $container = $('<div></div>').attr('id', containerId).hide(),
            $typeSelector;
        $label.toggleClass('expandable');
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
        $keyName.keyup(function() {
            var value = $(this).val();
            if ( !value ) {
                $addAction.attr('disabled', true);
            } else {
                $addAction.attr('disabled', false);
            }
        });
        $addAction.click(function() {
            var key = $keyName.val(),
                $removeAction = $('<button>').text('Remove').toggleClass('container-action'),
                $childLabel = createNewLabel(key).append($removeAction),
                child, cls, $node;

            if ( item.instanceof(types.base.AcceptsMixin) ) {
                cls = item.getValue($typeSelector.val())();
                child = cls.create(undefined, {id: key});
            } else {
                child = item._elementClass.create(undefined, {id: key});
            }
            item.push(child, {id: key});

            var nameEntity = extractNameSubItem(child);
            if ( nameEntity ) {
                nameEntity.set(key);
                nameEntity.on('change', function() {
                    var newName = this.get();
                    child.setID(newName);
                    $childLabel.text(newName);
                });
            }
            $node = drawTypedNode($container, $childLabel, child);

            // make sure newly added item will be immediately shown
            if ( !$label.hasClass('expanded') ) {
                $label.click();
            }
            $childLabel.click();

            $removeAction.click(function() {
                $node.remove();
                item.remove(item.getPosByID(key));
            });
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

    function drawTypedNode($canvas, $label, item) {
        var $node;
        if ( item.instanceof(Barricade.Enumerated) ) {
            $node = drawSelectNode($label, item);
            $canvas.append($node);
        } else if ( isPrimitiveType(item, Number) ) {
            $node = drawNumberNode($label, item);
            $canvas.append($node);
        } else if ( isPrimitiveType(item, String) ) {
            $node = drawTextNode($label, item);
            $canvas.append($node);
        } else if ( isPrimitiveType(item, Boolean) ) {
            $node = drawBooleanNode($label, item);
            $canvas.append($node);
        } else if ( item.instanceof(Barricade.Array) ) {
            $node = drawArrayNode($label, item);
            $canvas.append($node);
        } else if ( item.instanceof(Barricade.MutableObject) ) {
            $node = drawFluidContainerNode($label, item);
            $canvas.append($node);
        } else if ( item.instanceof(Barricade.Container) ) {
            $node = drawContainerNode($label, item);
            $canvas.append($node);
        } else {
            $node = $('<label></label>').text('Unknown elt');
            $canvas.append($node);
        }
        return $node;
    }

    function drawContainer($canvas, container) {
        container.each(function(key, item) {
            var $label = createNewLabel(key);
            drawTypedNode($canvas, $label, item);
        });
    }

    $('button#create-workbook').click(function(evt) {
      var $controls = $('div#controls'),
          $label = createNewLabel('Mistral Workbook');
      $controls.empty();
      workbook = types.Mistral.Workbook.create();

      drawTypedNode($controls, $label, workbook).find('label').click();
      evt.preventDefault();
    });

    $('button#save-workbook').click(function(evt) {
      $('.right pre').text(jsyaml.dump(workbook.toJSON()));
      evt.preventDefault();
    });
  // to prevent modal form submit
  $('div#controls').click(function(evt) {
    evt.preventDefault();
  });
});