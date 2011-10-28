/**
 *  property-editor.js - keys and values
 *    Versatile editor block for editing properties. Properties
 *    are automatically saved back to their parent control.
 *    Property Types: text, uiText, bool, numericRange, enum,
 *                    dateRange, optionsEditor
 */

;(function($)
{
    var validationMessages = {
        required: 'This property is required.',
        alphanumeric: 'Only letters and numbers are allowed.',
        unique: 'This property must be unique; there is another control that conflicts with it.'
    };
    // private methods
    var validateProperty = function($this, property, name, $parent)
    {
        if (_.isUndefined(property.limit))
            return;

        var validationErrors = [];

        _.each(property.limit, function(limit)
        {
            switch (limit)
            {
                case 'required':
                    if ((property.value == null) || (property.value === '')) // douglas cries, but I do mean null/undef here.
                        validationErrors.push(limit);
                    break;

                case 'alphanumeric':
                    if (!_.isString(property.value) || property.value.match(/[^0-9a-z_]/i))
                        validationErrors.push(limit);
                    break;

                case 'unique':
                    if ($parent.parent().length === 0)
                        break; // we have not been inserted yet.

                    var okay = true;
                    $parent.siblings().each(function()
                    {
                        okay = okay && ($(this).data('odkControl-properties')[name].value != property.value);
                    });
                    if (!okay)
                        validationErrors.push(limit);
                    break;
            }
        });

        $this.children('.errorList').remove();

        if (validationErrors.length > 0)
        {
            property.validationErrors = validationErrors;
            $this.addClass('error');

            $('<ul/>')
                .addClass('errorList')
                .append(
                    _.map(validationErrors, function(error)
                    {
                        return '<li>' + validationMessages[error] + '</li>';
                    }).join(''))
                .appendTo($this);
        }
        else
        {
            delete property.validationErrors;
            $this.removeClass('error');
        }
    };
    // Constructor
    $.fn.propertyEditor = function(property, name, $parent)
    {
        return this.each(function()
        {
            var $this = $(this);
            var $editor = $('#templates .editors .' + property.type).clone();
            $editor.attr('data-name', name);
            $this.empty().append($editor);

            $.fn.propertyEditor.editors[property.type](property, $editor, $parent, name);

            $this.bind('odkProperty-validate', function()
            {
                validateProperty($this, property, name, $parent);
            });
            validateProperty($this, property, name, $parent);
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
                    $parent.trigger('odkControl-propertiesUpdated');
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
                    .val(property.value[languageKey] || '')
                    .bind('keyup input', function(event)
                    {
                        property.value[languageKey] = $(this).val();
                        $parent.trigger('odkControl-propertiesUpdated');
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
                    $parent.trigger('odkControl-propertiesUpdated');
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

            if (property.value === false)
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
                $parent.trigger('odkControl-propertiesUpdated');
            });

            $editor.find('.editorEnabled')
                .attr('checked', property.value !== false)
                .click(function(event)
                {
                    if ($(this).is(':checked'))
                    {
                        $inputs.attr('disabled', false);
                        property.value = getPropertyValue();
                        $parent.trigger('odkControl-propertiesUpdated');
                    }
                    else
                    {
                        $inputs.attr('disabled', true);
                        property.value = false;
                        $parent.trigger('odkControl-propertiesUpdated');
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
                $parent.trigger('odkControl-propertiesUpdated');
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
                $parent.trigger('odkControl-propertiesUpdated');
            });

            $editor.find('.optionsEditorLink').click(function(event)
            {
                odkmaker.options.currentProperty = property.value;
                odkmaker.options.optionsUpdated = function(options)
                {
                    property.value = options;
                    $parent.trigger('odkControl-propertiesUpdated');

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
        var $removeLink = $('<a href="#removeOption" class="removeOption">Remove Option</a>')
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

            $parent.trigger('odkControl-propertiesUpdated');
        });
        var $underlyingValueEdit = $('#templates .editors .optionsEditorValueField').clone();
        $underlyingValueEdit
            .find('.editorTextfield')
                .val(data.val || '')
                .keyup(function(event)
                {
                    data.val = $(this).val();
                    $parent.trigger('odkControl-propertiesUpdated');
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
                        }, $parent)
                        .prepend($removeLink)
                        .append($underlyingValueEdit));
    };
})(jQuery);
