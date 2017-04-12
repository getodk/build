/**
 *  control.js - representational metaphor
 *    Represents a control in the actual XForm. It only manages and stores data
 *    about its internal structure and properties - the general form structure
 *    is managed by the DOM.
 */

// <output value="xpath"/> for substitution inside question text

;(function($)
{
    var validationNS = odkmaker.namespace.load('odkmaker.validation');

    // our own incrementing counter:
    var untitledCount_ = 1;
    var untitledCount = function() { return untitledCount_++; };

    // Private methods
    var refreshFromProperties = function($this, type, options, properties)
    {
        var $info = $this.children('.controlInfo');
        var $headline = $info.children('.controlHeadline');

        $info.children('.controlName').text(properties.name.value);
        if (type == 'group')
        {
            $headline.children('.controlLabel').text($.emptyString(properties.label.value[odkmaker.i18n.displayLanguage()], '[no group caption text yet]'));
        }
        else if (type == 'metadata')
        {
            // do nothing for now
        }
        else
        {
            $headline.children('.controlLabel').text($.emptyString(properties.label.value[odkmaker.i18n.displayLanguage()], '[no caption text yet]'));
            $headline.children('.controlHint').text(properties.hint.value[odkmaker.i18n.displayLanguage()]);
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

    var selectControl = function($this, type, options, properties)
    {
        $('.workspace .control.selected').removeClass('selected');
        $this.addClass('selected');

        // clear out and reconstruct property list
        var $propertyList = $('.propertyList');
        var wasExpanded = $propertyList.find('.advanced > .toggle').hasClass('expanded');
        $propertyList.empty();

        var $advancedContainer = $.tag({
            _: 'li', 'class': 'advanced', contents: [
                { _: 'a', 'class': [ 'toggle', { i: wasExpanded, t: 'expanded' } ], href: '#advanced', contents: [
                    { _: 'div', 'class': 'icon' },
                    'Advanced'
                ] },
                { _: 'ul', 'class': 'advancedProperties toggleContainer', style: { display: { i: wasExpanded, t: 'block', e: 'none' } } }
            ]
        });
        var $advancedList = $advancedContainer.find('.advancedProperties');

        // add our hero's properties
        _.each(properties, function(property, name)
        {
            $('<li/>')
                .propertyEditor(property, name, $this)
                .appendTo((property.advanced === true) ? $advancedList : $propertyList);
        });

        // drop in advanced
        $propertyList.append($advancedContainer);
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

            $this.data('odkControl-id', _.uniqueId());
            $this.data('odkControl-type', type);

            // Deep clone the properties if relevant
            var properties = null;
            if ((type == 'group') || (type == 'branch') || (type == 'metadata'))
                properties = defaultProperties || $.extend(true, {}, $.fn.odkControl.controlProperties[type]);
            else
                properties = defaultProperties ||
                    $.extend(true, $.extend(true, {}, $.fn.odkControl.defaultProperties),
                                   $.fn.odkControl.controlProperties[type]);

            var match = null;
            if (properties.name.value == 'untitled')
                properties.name.value += (untitledCount() + 1);
            else if ((match = /^untitled(\d+)$/.exec(properties.name.value)) != null)
                untitledCount_ = parseInt(match[1]);

            _.each(properties, function(property, name)
            {
                property.id = name;
                property.validations = [];
            });
            $this.data('odkControl-properties', properties);

            $this.bind('odkControl-propertiesUpdated', function(event)
            {
                event.stopPropagation();
                kor.events.fire({ subject: $this, verb: 'properties-updated' });
                refreshFromProperties($this, type, options, properties);
            });
            $this.trigger('odkControl-propertiesUpdated');

            validationNS.controlCreated($this, properties);

            $this.bind('odkControl-reloadProperties', function(event)
            {
                selectControl($this, type, options, properties);
            });
            $this.click(function(event)
            {
                event.stopPropagation();
                selectControl($this, type, options, properties);
            });

            $this.bind('odkControl-validationChanged', function(event, property, hasError)
            {
                if (this !== event.target) return;

                if (hasError === true)
                    $this.addClass('error');
                else
                {
                    var validations = $this.data('odkControl-validations');
                    $this.toggleClass('error', _.any(validations, function(validation) { return validation.hasError === true; }));
                }
            });

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

                    var $thisAndChildren = $this.find('.control').add($this);
                    $thisAndChildren.each(function() { validationNS.controlDestroyed($(this), properties); });
                    $thisAndChildren.trigger('odkControl-removing');
                    $this.remove();
                    $thisAndChildren.trigger('odkControl-removed');
                });
            });

            var cachedHeight = 0;
            $this.one('mouseenter', function()
            {
                $this.workspaceDraggable({
                    draggableOptions: {
                        start: function(event, ui)
                        {
                            $this.trigger('odkControl-removing');
                            _.defer(function() { $this.trigger('odkControl-removed'); });
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
                            .stop()
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
                        $this.trigger('odkControl-added');
                        $this.show();
                    },
                    insertPlaceholder: false
                });
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
                        description: 'The name of the column in the exported data.',
                        validation: [ 'required', 'xmlLegalChars', 'unique', 'alphaStart' ],
                        required: true,
                        value: 'untitled',
                        summary: false },
        label:        { name: 'Data Label',
                        type: 'uiText',
                        description: 'The text that is presented to the user filling the form.',
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
                        validation: [ 'fieldListExpr' ],
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
                        summary: false },
        calculate:  { name: 'Calculate',
                        type: 'text',
                        description: 'Specify a custom expression to store a value in this field',
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
                        summary: false },
          invalidText:{ name: 'Invalid Text',
                        type: 'uiText',
                        description: 'Message to display if the value fails the length check.',
                        value: {},
                        summary: false } },
        inputNumeric: {
          range:      { name: 'Range',
                        type: 'numericRange',
                        description: 'Valid range for the user input of this control.',
                        value: false,
                        summary: false },
          invalidText:{ name: 'Invalid Text',
                        type: 'uiText',
                        description: 'Message to display if the value fails the range check.',
                        value: {},
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
                        description: 'Valid range for the user input of this control.',
                        value: false,
                        summary: false },
          invalidText:{ name: 'Invalid Text',
                        type: 'uiText',
                        description: 'Message to display if the value fails the range check.',
                        value: {},
                        summary: false },
          kind:       { name: 'Kind',
                        type: 'enum',
                        description: 'Type of value to prompt for.',
                        options: [ 'Full Date', 'Year and Month', 'Year', 'Full Date and Time' ],
                        value: 'Full Date',
                        summary: true } },
        inputTime: {},
        inputLocation: {
          kind:       { name: 'Kind',
                        type: 'enum',
                        description: 'Type of location information to collect.',
                        options: [ 'Point',
                                   'Path',
                                   'Shape' ],
                        value: 'Point',
                        summary: true },
          appearance: { name: 'Style',
                        type: 'enum',
                        description: 'How to collect the information.',
                        options: [ 'Default (GPS)', 'Show Map (GPS)', 'Manual (No GPS)' ],
                        value: 'Default (GPS)',
                        summary: true } },
        inputMedia: {
          kind:       { name: 'Kind',
                        type: 'enum',
                        description: 'Type of media to upload.',
                        options: [ 'Image',
                                   'Audio',
                                   'Video' ] } },
        inputBarcode: {},
        inputSelectOne: {
          options:    { name: 'Options',
                        type: 'optionsEditor',
                        validation: [ 'underlyingRequired', 'underlyingLegalChars', 'underlyingLength', 'hasOptions' ],
                        value: [{ text: {}, val: 'untitled' }],
                        summary: false },
          appearance: { name: 'Style',
                        type: 'enum',
                        description: 'What interface to present.',
                        options: [ 'Default', 'Minimal (spinner)', 'Table', 'Horizontal Layout' ],
                        value: 'Default',
                        summary: true } },
        inputSelectMany: {
          options:    { name: 'Options',
                        type: 'optionsEditor',
                        validation: [ 'underlyingRequired', 'underlyingLegalChars', 'underlyingLength', 'hasOptions' ],
                        value: [{ text: {}, val: 'untitled' }],
                        summary: false },
          count:      { name: 'Response Count',
                        type: 'numericRange',
                        description: 'This many options must be selected for the response to be valid.',
                        value: false,
                        summary: true },
          appearance: { name: 'Style',
                        type: 'enum',
                        description: 'What interface to present.',
                        options: [ 'Default', 'Minimal (spinner)', 'Table', 'Horizontal Layout' ],
                        value: 'Default',
                        summary: true } },
        group: {
          name:       { name: 'Data Name',
                        type: 'text',
                        description: 'The name of the column in the exported data.',
                        validation: [ 'required', 'xmlLegalChars', 'unique', 'alphaStart' ],
                        required: true,
                        value: 'untitled',
                        summary: false },
          label:      { name: 'Data Label',
                        type: 'uiText',
                        description: 'The text that is presented to the user filling the form.',
                        required: true,
                        value: {},
                        summary: false },
          loop:       { name: 'Looped',
                        type: 'bool',
                        description: 'Whether or not to allow this group to loop.',
                        value: false },
          fieldList:  { name: 'Display On One Screen',
                        type: 'bool',
                        description: 'Display all the controls in this group on one screen',
                        validation: [ 'fieldListChildren' ],
                        value: false },
        relevance:    { name: 'Relevance',
                        type: 'text',
                        description: 'Specify a custom expression to evaluate to determine if this group is shown.',
                        value: '',
                        validation: [ 'fieldListExpr' ],
                        advanced: true,
                        summary: false } },
        branch: {
          logic:      { name: 'Rules',
                        type: 'logicEditor',
                        description: 'Specify the rules that decide how the form will branch.',
                        value: [],
                        summary: false } },
        metadata: {
          name:       { name: 'Data Name',
                        type: 'text',
                        description: 'The name of the column in the exported data.',
                        validation: [ 'required', 'xmlLegalChars', 'unique' ],
                        required: true,
                        value: 'untitled',
                        summary: false },
          kind:       { name: 'Kind',
                        type: 'enum',
                        description: 'Type of metadata to add.',
                        options: [ 'Device ID', 'Start Time', 'End Time', 'Today', 'Username', 'Subscriber ID', 'SIM Serial', 'Phone Number' ],
                        value: 'Device ID',
                        summary: true } },
    };
})(jQuery);
