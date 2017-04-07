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
            var $editor = $('#templates .editors .' + property.type).clone();
            $editor.attr('data-name', name).addClass('property-' + name);
            
            $this.empty().append($editor);

            $.fn.propertyEditor.editors[property.type](property, $editor, $parent, name);

            var processValidation = function()
            {
                var errors = _.filter(property.validations, function(validation) { return validation.hasError; });
                $this.toggleClass('error', errors.length > 0);
                $this.children('.errorList').remove();
                if (errors.length > 0)
                {
                    $('<ul/>')
                        .addClass('errorList')
                        .append(
                            _.map(errors, function(error)
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
        });
    };

    $.fn.propertyEditor.defaults = {
    };

    // Initializers for different editor types
    $.fn.propertyEditor.editors = {
        text: function(property, $editor, $parent) {
            $editor.find('h4').text(property.name);
            $editor.find('p').text(property.description);
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
            $editor.find('h4').text(property.name);
            $editor.find('p').text(property.description);

            var $translationsList = $editor.find('.translations');
            _.each(odkmaker.i18n.activeLanguages(), function(language)
            {
                var languageKey = language;

                var $newRow = $('#templates .editors .uiText-translation').clone();
                $newRow.find('h5').text(odkmaker.i18n.getFriendlyName(languageKey));
                $newRow.find('.editorTextfield')
                    .val((property.value == null) ? '' : (property.value[languageKey] || ''))
                    .bind('keyup input', function(event)
                    {
                        property.value[languageKey] = $(this).val();
                        $parent.trigger('odkControl-propertiesUpdated', [ property.id ]);
                    });
                $translationsList.append($newRow);
            });
        },
        bool: function(property, $editor, $parent) {
            $editor.find('.editorCheckbox')
                .attr('id', 'property_' + property.name)
                .attr('checked', property.value === true)
                .click(function(event)
                {
                    property.value = $(this).is(':checked');
                    $parent.trigger('odkControl-propertiesUpdated', [ property.id ]);
                });
            $editor.find('label')
                .attr('for', 'property_' + property.name)
                .text(property.name);
            $editor.find('p')
                .text(property.description);
        },
        numericRange: function(property, $editor, $parent) {
            $editor.find('h4').text(property.name);
            $editor.find('p').text(property.description);

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
            $editor.find('h4').text(property.name);
            $editor.find('p').text(property.description);

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
            $editor.find('h4').text(property.name);
            $editor.find('p').text(property.description);

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
                var newOption = {text: {}};
                property.value.push(newOption);
                $optionsList.append(newOptionRow(property, newOption, $optionsList.children().length, $parent));
                $parent.trigger('odkControl-propertiesUpdated', [ property.id ]);
            });

            $editor.find('.optionsEditorLink').click(function(event)
            {
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
                        .append($underlyingValueEdit));
    };
})(jQuery);
