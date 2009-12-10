/**
 *  property-editor.js - keys and values
 *    Versatile editor block for editing properties. Value can be
 *    retrieved later by calling value().
 *    Property Types: text, uiText, bool, numericRange, enum,
 *                    dateRange, optionsEditor
 */

;(function($)
{
    // Constructor
    $.fn.propertyEditor = function(property, $parent)
    {
        return this.each(function()
        {
            var $editor = $('#templates .editors .' + property.type).clone();
            $(this).empty().append($editor);

            $.fn.propertyEditor.editors[property.type](property, $editor, $parent)
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
                .keyup(function(event)
                {
                    property.value = $(this).val();
                    $parent.trigger('odkControl-propertiesUpdated');
                });
            // TODO: validation goes here.
        },
        uiText: function(property, $editor, $parent) {
            $editor.find('h4').text(property.name);
            $editor.find('p').text(property.description);

            var $translationsList = $editor.find('.translations');
            $.each(odkmaker.i18n.activeLanguages(), function()
            {
                var languageKey = this;

                var $newRow = $('#templates .editors .uiText-translation').clone();
                $newRow.find('h5').text(odkmaker.i18n.getFriendlyName(languageKey));
                $newRow.find('.editorTextfield')
                    .val(property.value[languageKey] || '')
                    .keyup(function(event)
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

            var $textfields = $editor.find('.editorTextfield');
            if (property.value === false)
                $textfields.attr('disabled', true);
            else
                $textfields
                    .filter('.min').val(property.value.min)
                    .end()
                    .filter('.max').val(property.value.max)
            $textfields.keyup(function(event)
            {
                property.value = {
                    min: $textfields.filter('.min').val(),
                    max: $textfields.filter('.max').val()
                };
                $parent.trigger('odkControl-propertiesUpdated');
            });
            // TODO: validation goes here

            $editor.find('.editorCheckbox')
                .attr('checked', property.value !== false)
                .click(function(event)
                {
                    var $this = $(this);
                    if ($this.is(':checked'))
                    {
                        $textfields.attr('disabled', false);
                        property.value = {
                            min: $textfields.filter('.min').val(),
                            max: $textfields.filter('.max').val()
                        };
                        $parent.trigger('odkControl-propertiesUpdated');
                    }
                    else
                    {
                        $textfields.attr('disabled', true);
                        property.value = false;
                        $parent.trigger('odkControl-propertiesUpdated');
                    }
                });
        },
        enum: function(property, $editor, $parent) {
            $editor.find('h4').text(property.name);
            $editor.find('p').text(property.description);

            var $select = $editor.find('.editorSelect');
            $.each(property.options, function()
            {
                $select.append($('<option>' + this + '</option>'));
            });
            $select.change(function(event)
            {
                property.value = $(this).val();
                $parent.trigger('odkControl-propertiesUpdated');
            });
        },
        dateRange: function(property, $editor, $parent) {
            // derive from numeric range
            $.fn.propertyEditor.editors.numericRange(property, $editor, $parent);
            $editor.find('.editorTextfield').datepicker();
        },
        optionsEditor: function(property, $editor, $parent) {
            $editor.find('h4').text(property.name);
            $editor.find('p').text(property.description);

            var $optionsList = $editor.find('.optionsList');
            $.each(property.value, function(i)
            {
                if (this.text === undefined || this.text === null)
                    this.text = {};

                $optionsList.append(newOptionRow(this, i, $parent));
            });
            $editor.find('.addOption').click(function(event)
            {
                event.preventDefault();
                var newOption = {text: {}};
                property.value.push(newOption);
                $optionsList.append(newOptionRow(newOption, $optionsList.children().length, $parent));
                $parent.trigger('odkControl-propertiesUpdated');
            });
        }
    };

    var newOptionRow = function(data, index, $parent)
    {
        return $('<li></li>')
                .data('odkmaker-optionData', data)
                .toggleClass('even', (index % 2) == 0)
                .append(
                    $('#templates .editors .uiText')
                        .clone()
                        .propertyEditor({
                            name: 'option ' + (index + 1),
                            type: 'uiText',
                            value: data.text
                        }, $parent)
                        .prepend('<a href="#removeOption" class="removeOption">Remove Option</a>'));
    };
})(jQuery);
