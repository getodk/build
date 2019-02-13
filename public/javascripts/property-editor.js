/**
 *  property-editor.js - keys and values
 *    Versatile editor block for editing properties. Properties
 *    are automatically saved back to their parent control.
 *    Property Types: text, uiText, bool, numericRange, enum,
 *                    dateRange, optionsEditor
 */

;(function($)
{
    // Constructor
    $.fn.propertyEditor = function(property, name, $parent)
    {
        return this.each(function()
        {
            var $this = $(this);
            $this.data('odkProperty', property);

            var $editor = $('#templates .editors .' + property.type).clone();
            $editor.attr('data-name', name).addClass('property-' + name);

            $this.empty().append($editor);

            $.fn.propertyEditor.editors[property.type](property, $editor, $parent, name);

            var processValidation = function()
            {
                if (property.validations == null) return;
                var errors = [];
                var warnings = [];
                for (var i = 0; i < property.validations.length; i++)
                {
                    var validation = property.validations[i];
                    if (validation.failed === true)
                    {
                        if (validation.isWarning === true)
                            warnings.push(validation);
                        else
                            errors.push(validation);
                    }
                }
                $this.toggleClass('error', errors.length > 0);
                $this.toggleClass('warning', warnings.length > 0);
                $this.children('.errorList').remove();

                if ((errors.length > 0) || (warnings.length > 0))
                {
                    var issueList = (errors.length > 0) ? errors : warnings;
                    $('<ul/>')
                        .addClass('errorList')
                        .append(
                            _.map(issueList, function(error)
                            {
                                return '<li>' + error.validation.message + '</li>';
                            }).join(''))
                        .appendTo($this);
                }
            };
            $parent.bind('odkControl-validationChanged', function(event, vProperty)
            {
                if (vProperty !== property) return;
                processValidation();
            });
            processValidation();

            if (property.bindDisplayIf != null)
            {
                // normalize two formats: 'key' just checks bool on that key.
                // { 'key': [ 'value1', 'value2' ] } checks a single property against values.
                // someday if required we can check multiple properties.
                var key, values;
                if (_.isString(property.bindDisplayIf))
                {
                    key = property.bindDisplayIf;
                    values = [ true ];
                }
                else
                {
                    key = _.keys(property.bindDisplayIf)[0];
                    values = property.bindDisplayIf[key];
                    if (!_.isArray(values)) { values = [ values ]; }
                }

                var parentProperty = $parent.data('odkControl-properties')[key];
                var showHide = function() { $this.toggle(_.contains(values, parentProperty.value)); }
                $parent.on('odkControl-propertiesUpdated', function(_, propId) { if (propId === key) showHide(); });
                showHide();
            }

            if (property.bindAllowedIf != null)
            {
                var baiKey, baiValues;
                if (_.isString(property.bindAllowedIf))
                 {
                    baiKey = property.bindAllowedIf;
                    baiValues = [ true ];
                }
                else
                {
                    baiKey = _.keys(property.bindAllowedIf)[0];
                    baiValues = property.bindAllowedIf[baiKey];
                    if (!_.isArray(baiValues)) { baiValues = [ baiValues ]; }
                }

                var baiProperty = $parent.data('odkControl-properties')[baiKey];
                var allow = function()
                {
                    if (_.contains(baiValues, baiProperty.value))
                        $this.removeClass('disabled');
                    else
                    {
                        $this.addClass('disabled');
                        $this.find('label input:checked').click();
                    }
                };
                $parent.on('odkControl-propertiesUpdated', function(_, propId) { if (propId === baiKey) allow(); });
                allow();
            }
        });
    };

    $.fn.propertyEditor.defaults = {
    };

    // Initializers for different editor types
    $.fn.propertyEditor.editors = {
        text: function(property, $editor, $parent) {
            $editor.find('h4').text(property.label || property.name);
            $editor.find('.editorTextfield')
                .attr('id', 'property_' + property.name)
                .val(property.value || '')
                .bind('keyup input', function(event)
                {
                    property.value = $(this).val();
                    $parent.trigger('odkControl-propertiesUpdated', [ property.id ]);
                });
        },
        uiText: function(property, $editor, $parent) {
            $editor.find('h4').text(property.label || property.name);

            var $translationsList = $editor.find('.translations');
            _.each(odkmaker.i18n.activeLanguages(), function(language, code)
            {
                var $newRow = $('#templates .editors .uiText-translation').clone();
                $newRow.find('h5').text(language);
                $newRow.find('.editorTextfield')
                    .val((property.value == null) ? '' : (property.value[code] || ''))
                    .bind('keyup input', function(event)
                    {
                        if (property.value == null) property.value = {};
                        property.value[code] = $(this).val();
                        $parent.trigger('odkControl-propertiesUpdated', [ property.id ]);
                    });
                $translationsList.append($newRow);
            });
        },
        bool: function(property, $editor, $parent) {
            $editor.find('.editorCheckbox')
                .attr('checked', property.value === true)
                .click(function(event)
                {
                    property.value = $(this).is(':checked');
                    $parent.trigger('odkControl-propertiesUpdated', [ property.id ]);
                });
            $editor.find('label span').text(property.label || property.name);
        },
        numericRange: function(property, $editor, $parent) {
            $editor.find('label span').text(property.label || property.name);

            var $inputs = $editor.find('.editorTextfield, .inclusive');

            var getPropertyValue = function()
            {
                return {
                    min: $inputs.filter('.min').val(),
                    max: $inputs.filter('.max').val(),
                    minInclusive: $inputs.filter('.minInclusive').is(':checked'),
                    maxInclusive: $inputs.filter('.maxInclusive').is(':checked')
                };
            };

            if (property.optional === false)
                $editor.addClass('nonOptional');
            if (property.inclusivity === false)
                $editor.addClass('hideInclusivity');

            if ((property.value === false) || (property.value == null))
                $inputs.attr('disabled', true);
            else
                $inputs
                    .filter('.min').val(property.value.min).end()
                    .filter('.max').val(property.value.max).end()
                    .filter('.minInclusive').attr('checked', property.value.minInclusive).end()
                    .filter('.maxInclusive').attr('checked', property.value.maxInclusive).end();

            $inputs.bind('input change keyup', function(event)
            {
                property.value = getPropertyValue();
                $parent.trigger('odkControl-propertiesUpdated', [ property.id ]);
            });

            $editor.find('.editorEnabled')
                .attr('checked', property.value !== false)
                .click(function(event)
                {
                    if ($(this).is(':checked'))
                    {
                        $inputs.attr('disabled', false);
                        property.value = getPropertyValue();
                        $parent.trigger('odkControl-propertiesUpdated', [ property.id ]);
                    }
                    else
                    {
                        $inputs.attr('disabled', true);
                        property.value = false;
                        $parent.trigger('odkControl-propertiesUpdated', [ property.id ]);
                    }
                });
        },
        'enum': function(property, $editor, $parent) {
            $editor.find('h4').text(property.label || property.name);

            var $select = $editor.find('.editorSelect');
            _.each(property.options, function(option)
            {
                $select.append($('<option>' + option + '</option>'));
            });
            $select.val(property.value);

            $select.change(function(event)
            {
                property.value = $(this).val();
                $parent.trigger('odkControl-propertiesUpdated', [ property.id ]);
            });
            property.value = $select.val();
        },
        dateRange: function(property, $editor, $parent) {
            // "derive" from numeric range
            $.fn.propertyEditor.editors.numericRange(property, $editor, $parent);
            $editor.find('.editorTextfield').datepicker({
                dateFormat: 'yy-mm-dd',
                onSelect: function(dateText, inst)
                {
                    $(inst.input).trigger('keyup');
                }
            });
        },
        optionsEditor: function(property, $editor, $parent) {
            $editor.find('h4').text(property.label || property.name);

            var $optionsList = $editor.find('.optionsList');
            _.each(property.value, function(val, i)
            {
                if (val.text === undefined || val.text === null)
                    val.text = {};

                $optionsList.append(newOptionRow(property, val, i, $parent));
            });
            $editor.find('.addOption').click(function(event)
            {
                event.preventDefault();
                var newOption = { text: {}, cascade: [], val: 'untitled' };
                property.value.push(newOption);
                $optionsList.append(newOptionRow(property, newOption, $optionsList.children().length, $parent));
                $parent.trigger('odkControl-propertiesUpdated', [ property.id ]);
            });

            $editor.find('.optionsEditorLink').click(function(event)
            {
                odkmaker.options.$currentControl = $parent;
                odkmaker.options.currentProperty = property.value;
                odkmaker.options.optionsUpdated = function(options)
                {
                    property.value = options;
                    $parent.trigger('odkControl-propertiesUpdated', [ property.id ]);

                    // recycle the editor to update text
                    var $newEditor = $('<li/>').propertyEditor(property, $editor.attr('data-name'), $parent);
                    $editor.closest('li').replaceWith($newEditor);
                };
            });
        },
        otherEditor: function(property, $editor, $parent) {
            $editor.find('label span').text(property.label || property.name);
            var optionsProperty = $parent.data('odkControl-properties')[property.bindTo];

            // WARNING: we don't yet know how to detangle if the user has two identical
            // underlying values. right now the first instance is always used.

            // because the user might change the underlying value, we can't simply track
            // their selection here based on that. so we track the full object ref instead.
            var selectedOption = null;

            var $enable = $editor.find('input');
            var $select = $editor.find('select');
            var update = function()
            {
                var value = (property.value == null) ? false : !!property.value;
                $enable.attr('checked', value);
                $select.attr('disabled', !value);
                updateOptions();
            };

            var updateOptions = function()
            {
                var $options = $select.find('option').detach();
                var selectedValue = (property.value == null) ? undefined : property.value[0]; // default to the saved value.

                _.each(optionsProperty.value, function(option)
                {
                    // if we find a ref match, assume that option.
                    if (selectedOption === option)
                        selectedValue = option.val;

                    // on the other hand, if we have no ref yet and we match, grab the ref.
                    if ((selectedOption == null) && (selectedValue === option.val))
                        selectedOption = option;

                    var existing = _.find($options, function(dom) { return $(dom).data('option') === option; });
                    existing = (existing == null) ? $('<option/>').data('option', option) : $(existing);
                    $select.append(existing.text(option.val).attr('value', option.val));
                });

                if ((property.value !== false) && (property.value != null))
                {
                    if (selectedValue != null)
                    {
                        // select the value we found.
                        $select.val(selectedValue);
                        property.value = [ selectedValue ];
                        $parent.trigger('odkControl-propertiesUpdated', [ property.id ]);
                    }
                    else if (optionsProperty.value.length > 0)
                    {
                        // we have no value yet; select the first option.
                        selectedOption = optionsProperty.value[0];
                        selectedValue = $select.children('option:first-child').attr('value');
                        $select.val(selectedValue);
                        property.value = [ selectedValue ];
                        $parent.trigger('odkControl-propertiesUpdated', [ property.id ]);
                    }
                }
            };

            $parent.on('odkControl-propertiesUpdated', function(_, propId) { if (propId === property.bindTo) updateOptions(); });

            $select.on('change', function()
            {
                var option = $select.children(':selected')[0];
                if (option != null)
                {
                    selectedOption = $(option).data('option');
                    property.value = [ selectedOption.val ];
                    $parent.trigger('odkControl-propertiesUpdated', [ property.id ]);
                }
            });

            $enable.on('change', function()
            {
                property.value = $enable.is(':checked') ? [] : false;
                $parent.trigger('odkControl-propertiesUpdated', [ property.id ]);
                update();
            });

            update();
        }
    };

    // helper for optionsEditor
    var newOptionRow = function(property, data, index, $parent)
    {
        var $removeLink = $('<a href="#removeOption" class="icon removeOption">Remove Option</a>')
        $removeLink.click(function(event)
        {
            event.preventDefault();
            $.removeFromArray(data, property.value);

            var $optionsList = $(this).closest('.optionsList');
            $(this).closest('li').remove();
            $optionsList.children().each(function(i)
            {
                $(this)
                    .toggleClass('even', (i % 2) == 0)
                    .find('h4')
                    .text('Option ' + (i + 1));
            });

            $parent.trigger('odkControl-propertiesUpdated', [ property.id ]);
        });

        var $underlyingValueEdit = $('#templates .editors .optionsEditorValueField').clone();
        $underlyingValueEdit
            .find('.editorTextfield')
                .val(data.val || '')
                .keyup(function(event)
                {
                    data.val = $(this).val();
                    $parent.trigger('odkControl-propertiesUpdated', [ property.id ]);
                });

        var $cascadeFields = $([]);
        var idx = 0;
        var $ptr = $parent;
        while ($ptr.hasClass('slave'))
        {
            $ptr = $ptr.prev();
            (function(thisIdx) // js is weird.
            {
                var $parentValueEdit = $('#templates .editors .optionsEditorValueField').clone();
                $parentValueEdit.find('h5').text($ptr.data('odkControl-properties').name.value + ' Value');
                $parentValueEdit.find('.editorTextfield')
                    .val(data.cascade[thisIdx] || '')
                    .keyup(function()
                    {
                        data.cascade[thisIdx] = $(this).val();
                        $parent.trigger('odkControl-propertiesUpdated', [ property.id ]);
                    });
                $cascadeFields = $cascadeFields.add($parentValueEdit);
            })(idx++);
        }

        return $('<li></li>')
                .toggleClass('even', (index % 2) == 0)
                .append(
                    $('#templates .editors .uiText')
                        .clone()
                        .propertyEditor({
                            name: 'Option ' + (index + 1),
                            type: 'uiText',
                            value: data.text
                        }, null, $parent)
                        .prepend($removeLink)
                        .append($underlyingValueEdit)
                        .append($cascadeFields));
    };
})(jQuery);
