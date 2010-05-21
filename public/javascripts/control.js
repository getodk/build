/**
 *  control.js - representational metaphor
 *    Represents a control in the actual XForm. It only manages and stores data
 *    about its internal structure and properties - the general form structure
 *    is managed by the DOM.
 */

// <output value="xpath"/> for substitution inside question text

;(function($)
{
    // Private methods
    var refreshFromProperties = function($this, type, config, properties)
    {
        var $info = $this.children('.controlInfo');
        $info.children('.controlName').text(properties.name.value);
        if (type == 'group')
        {
            $info.children('.controlLabel').text($.emptyString(properties.label.value[odkmaker.i18n.displayLanguage()], '[no group caption text yet]'));
        }
        else
        {
            $info.children('.controlLabel').text($.emptyString(properties.label.value[odkmaker.i18n.displayLanguage()], '[no caption text yet]'));
            $info.children('.controlHint').text(properties.hint.value[odkmaker.i18n.displayLanguage()]);
        }

        var $propertyList = $info.children('.controlProperties');
        $propertyList.empty();
        _.each(properties, function(property)
        {
            if ((property.summary === false) || (property.value !== true))
                return;

            $propertyList.append(
                $('<li>' + property.name + '</li>')
            );
        });
    };

    var selectControl = function($this, type, config, properties)
    {
        $('.workspace .control').removeClass('selected');
        $this.addClass('selected');

        var $propertyList = $('.propertyList');
        $propertyList.empty();

        var i = 0;
        // iterate through non-advanced properties
        _.each(properties, function(property)
        {
            if (property.advanced === true)
                return;

            $('<li/>')
                .toggleClass('even', (i % 2) == 0)
                .propertyEditor(property, $this)
                .appendTo($propertyList);
            i++;
        });

        // now do advanced properties
        $('<li class="advanced"><a class="toggle" href="#advanced"><div class="icon"></div>Advanced</a>' +
            '<ul class="advancedProperties toggleContainer" style="display:none"></ul></li>')
            .appendTo($propertyList);
        var $advancedList = $propertyList.find('.advancedProperties');
        _.each(properties, function(property)
        {
            if (property.advanced !== true)
                return;

            $('<li/>')
                .toggleClass('even', (i % 2) == 0)
                .propertyEditor(property, $this)
                .appendTo($advancedList);
            i++;
        });
    };

    // Constructor
    $.fn.odkControl = function(type, options, defaultProperties)
    {
        // Abort for unknown types
        if ($.fn.odkControl.controlProperties[type] === undefined)
            return;

        var options = $.extend({}, $.fn.odkControl.defaults, options);

        return this.each(function()
        {
            var $this = $(this);

            // Support the metadata plugin
            var config = $.meta ? $.extend({}, options, $this.data()) : options;
            $this.data('odkControl-config', config);

            $this.data('odkControl-type', type);

            // Deep clone the properties if relevant
            var properties = null;
            if ((type == 'group') || (type == 'branch'))
                properties = defaultProperties || $.extend(true, {}, $.fn.odkControl.controlProperties[type]);
            else
                properties = defaultProperties ||
                    $.extend(true, $.extend(true, {}, $.fn.odkControl.defaultProperties),
                                   $.fn.odkControl.controlProperties[type]);
            if (properties.name.value == 'untitled')
                properties.name.value += (_.uniqueId() + 1);
            $this.data('odkControl-properties', properties);

            $this.bind('odkControl-propertiesUpdated', function(event)
            {
                event.stopPropagation();
                refreshFromProperties($this, type, config, properties);
            });
            $this.trigger('odkControl-propertiesUpdated');

            $this.bind('odkControl-reloadProperties', function(event)
            {
                selectControl($this, type, config, properties);
            });
            $this.click(function(event)
            {
                event.stopPropagation();
                selectControl($this, type, config, properties);
            });
            selectControl($this, type, config, properties);

            // special treatment for groups and branches
            if (type == 'group')
                $('<div class="workspaceInnerWrapper"><div class="workspaceInner"></div></div><div class="groupFooter"></div>')
                    .insertAfter($this.children('.controlInfo'));

            // event wireup
            $this.find('.deleteControl').click(function(event)
            {
                event.preventDefault();
                $this.slideUp('normal', function()
                {
                    if ($this.is('.selected'))
                        $('.propertyList').empty();
                    $this.remove();
                });
            });

            var cachedHeight = 0;
            $this.workspaceDraggable({
                draggableOptions: {
                    start: function(event, ui)
                    {
                        ui.helper.width($this.width());
                        cachedHeight = $this.outerHeight(true);
                        $this
                            .after(
                                $('<div class="placeholder hidden"></div>')
                                    .css('height', cachedHeight + 'px'))
                            .hide()
                            .appendTo($('body'));
                    }
                },
                dragCallback: function($control, direction)
                {
                    $('.workspace .placeholder.hidden')
                        .addClass('closing')
                        .slideUp('fast', function()
                        {
                            $(this).remove();
                        });

                    $('.control.ui-draggable-dragging')
                        .toggleClass('last', $control.is(':last-child') && (direction > 0))

                    var $placeholder = $('<div class="placeholder hidden"></div>')
                                        .css('height', cachedHeight + 'px')
                                        .slideDown('fast');
                    if (direction < 0)
                        $control.before($placeholder);
                    else if (direction == 0)
                        $control.append($placeholder);
                    else if (direction > 0)
                        $control.after($placeholder);
                },
                dropCallback: function($helper)
                {
                    var $target = $('.workspace .placeholder:not(.closing)');
                    if ($target.length == 1)
                        $target.replaceWith($this);
                    else
                        $this.appendTo('.workspace');
                    $this.show();
                },
                insertPlaceholder: false
            });
        });
    };

    // Plugin Defaults
    $.fn.odkControl.defaults = {
    };

    // Default property fields
    $.fn.odkControl.defaultProperties = {
        name:         { name: 'Data Name',
                        type: 'text',
                        description: 'The data name of this field in the final exported XML.',
                        limit: [ 'nosymbols', 'lowercase', 'unique' ],
                        required: true,
                        value: 'untitled',
                        summary: false },
        label:        { name: 'Caption Text',
                        type: 'uiText',
                        description: 'The name of this field as it is presented to the user.',
                        required: true,
                        value: {},
                        summary: false },
        hint:         { name: 'Hint',
                        type: 'uiText',
                        description: 'Additional help for this question.',
                        value: {},
                        summary: false },
        defaultValue: { name: 'Default Value',
                        type: 'text',
                        description: 'The value this field is presented with at first.',
                        value: '',
                        summary: false },
        readOnly:     { name: 'Read Only',
                        type: 'bool',
                        description: 'Whether this field can be edited by the end user or not.',
                        value: false,
                        summary: true },
        required:     { name: 'Required',
                        type: 'bool',
                        description: 'Whether this field must be filled in before continuing.',
                        value: false,
                        summary: true },
        relevance:    { name: 'Relevance',
                        type: 'text',
                        description: 'Specify a custom expression to evaluate to determine if this field is shown.',
                        value: '',
                        advanced: true,
                        summary: false },
        constraint:   { name: 'Constraint',
                        type: 'text',
                        description: 'Specify a custom expression to validate the user input.',
                        value: '',
                        advanced: true,
                        summary: false },
        destination:  { name: 'Instance Destination',
                        type: 'text',
                        description: 'Specify a custom XPath expression at which to store the result.',
                        value: '',
                        advanced: true,
                        summary: false }
    };

    // Property fields per control type
    $.fn.odkControl.controlProperties = {
        inputText: {
          length:     { name: 'Length',
                        type: 'numericRange',
                        description: 'Valid lengths for this user input of this control.',
                        value: false,
                        summary: false } },
        inputNumeric: {
          range:      { name: 'Range',
                        type: 'numericRange',
                        description: 'Valid range for the user input of this control.',
                        value: false,
                        summary: false },
          kind:       { name: 'Kind',
                        type: 'enum',
                        description: 'Type of number accepted.',
                        options: [ 'Integer',
                                   'Decimal' ],
                        value: 'Integer',
                        summary: true } },
        inputDate: {
          range:      { name: 'Range',
                        type: 'dateRange',
                        value: false,
                        summary: false } },
        inputLocation: {},
        inputMedia: {
          kind:       { name: 'Kind',
                        type: 'enum',
                        description: 'Type of media to upload.',
                        options: [ 'Image',
                                   'Audio',
                                   'Video' ] } },
        inputSelectOne: {
          options:    { name: 'Options',
                        type: 'optionsEditor',
                        value: [],
                        summary: false } },
        inputSelectMany: {
          options:    { name: 'Options',
                        type: 'optionsEditor',
                        value: [],
                        summary: false },
          countRange: { name: 'Select count range',
                        type: 'numericRange',
                        value: false,
                        summary: false } },
        group: {
          name:       { name: 'Name',
                        type: 'text',
                        description: 'The data name of this group in the final exported XML.',
                        limit: [ 'nosymbols', 'lowercase', 'unique' ],
                        required: true,
                        value: 'untitled',
                        summary: false },
          label:      { name: 'Label',
                        type: 'uiText',
                        description: 'Give the group a label to give a visual hint to the user.',
                        required: true,
                        value: {},
                        summary: false },
          loop:       { name: 'Loop',
                        type: 'loopEditor',
                        description: 'Loop options over this group.',
                        value: false,
                        summary: true } },
        branch: {
          logic:      { name: 'Rules',
                        type: 'logicEditor',
                        description: 'Specify the rules that decide how the form will branch.',
                        value: [],
                        summary: false }
        }
    };
})(jQuery);
