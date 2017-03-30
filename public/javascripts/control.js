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

        // signal a selection.
        kor.events.fire({ subject: $this, verb: 'control-selected', object: { type: type } });

        // clear out and reconstruct property list
        var $propertyList = $('.propertyList');
        $propertyList.empty();

        var $advancedContainer = $.tag({
            _: 'li', 'class': 'advanced', contents: [
                { _: 'a', 'class': 'toggle', href: '#advanced', contents: [
                    { _: 'div', 'class': 'icon' },
                    'Advanced'
                ] },
                { _: 'ul', 'class': 'advancedProperties toggleContainer', style: { display: 'none' } }
            ]
        });
        var $advancedList = $advancedContainer.find('.advancedProperties');

        // add our hero's properties
        _.each(properties, function(property, name)
        {
            $('<li class="propertyItem"/>')
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
            if (properties.name.value == 'untitled')
                properties.name.value += (untitledCount() + 1);
            _.each(properties, function(property, name)
            {
                property.id = name;
                property.validations = [];
            });
            $this.data('odkControl-properties', properties);

            $this.bind('odkControl-propertiesUpdated', function(event)
            {
                event.stopPropagation();
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
                        description: 'The name of the column in the exported data. This is not shown during collection.',
                        tips: [ 'Must start with a letter, and may only include letters, numbers, hyphens, underscores, and periods.' ],
                        validation: [ 'required', 'xmlLegalChars', 'unique', 'alphaStart' ],
                        required: true,
                        value: 'untitled',
                        summary: false },
        label:        { name: 'Label',
                        type: 'uiText',
                        description: 'The title text that is presented to the person filling the form.',
                        tips: [ 'You can reference previous answers using <a href="https://opendatakit.github.io/xforms-spec/#xpath-paths" rel="external"><code>${/xform/data/path}</code> syntax</a>.' ],
                        required: true,
                        value: {},
                        summary: false },
        hint:         { name: 'Hint',
                        type: 'uiText',
                        description: 'Additional help information for this question for the person filling the form.',
                        tips: [ 'You can reference previous answers using <a href="https://opendatakit.github.io/xforms-spec/#xpath-paths" rel="external"><code>${/xform/data/path}</code> syntax</a>.' ],
                        value: {},
                        summary: false },
        defaultValue: { name: 'Default Value',
                        type: 'text',
                        description: 'The value this field is pre-filled with initially.',
                        value: '',
                        summary: false },
        readOnly:     { name: 'Read Only',
                        type: 'bool',
                        description: 'Whether or not this field can be edited by the person filling the form.',
                        tips: [ 'This is often used together with a Default Value or a Calculate.' ],
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
                        tips: [ 'The <a href="https://opendatakit.github.io/xforms-spec/#xpath-functions" rel="external">ODK XForms Functions Spec</a> may be useful.' ],
                        value: '',
                        validation: [ 'fieldListExpr' ],
                        advanced: true,
                        summary: false },
        constraint:   { name: 'Constraint',
                        type: 'text',
                        description: 'Specify a custom expression to validate the user input.',
                        tips: [ 'The <a href="https://opendatakit.github.io/xforms-spec/#xpath-functions" rel="external">ODK XForms Functions Spec</a> may be useful.' ],
                        value: '',
                        advanced: true,
                        summary: false },
        destination:  { name: 'Instance Destination',
                        type: 'text',
                        description: 'Specify a custom XPath expression at which to store the result.',
                        tips: [ 'The <a href="https://opendatakit.github.io/xforms-spec/#xpath-paths" rel="external">ODK XForms Path Spec</a> may be useful.' ],
                        value: '',
                        advanced: true,
                        summary: false },
        calculate:  { name: 'Calculate',
                        type: 'text',
                        description: 'Specify a custom expression to store a calculated value in this field.',
                        tips: [ 'The <a href="https://opendatakit.github.io/xforms-spec/#xpath-functions" rel="external">ODK XForms Functions Spec</a> may be useful.' ],
                        value: '',
                        advanced: true,
                        summary: false }
    };

    // Property fields per control type
    $.fn.odkControl.controlProperties = {
        inputText: {
          length:     { name: 'Length',
                        type: 'numericRange',
                        description: 'Valid input text length for this user input of this control.',
                        tips: [
                            'Numbers are inclusive, so a minimum of 2 would allow 2 or more characters.',
                            'For an open-ended range, fill in only a minimum or a maximum and leave the other blank.' ],
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
                        description: 'Valid numeric range for the user input of this control.',
                        tips: [
                            'Inclusive means the given number is valid; so a minimum of 3 without inclusive selected would prohibit 3 but allow 3.01 or 4.',
                            'For an open-ended range, fill in only a minimum or a maximum and leave the other blank.' ],
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
                        tips: [ 'In some data collection tools, this will affect the type of keypad shown.' ],
                        options: [ 'Integer',
                                   'Decimal' ],
                        value: 'Integer',
                        summary: true } },
        inputDate: {
          range:      { name: 'Range',
                        type: 'dateRange',
                        description: 'Valid range for the user input of this control.',
                        tips: [
                            'Inclusive means the given date is valid; so a minimum of 2015/01/01 without inclusive selected would prohibit 2015/01/01 but allow 2015/01/02 or 2015/01/01 00:00:01.',
                            'For an open-ended range, fill in only a minimum or a maximum and leave the other blank.' ],
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
                        tips: [ 'A path may be open-ended, while a shape will be closed automatically to form a polygon.' ],
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
                        description: 'The options the person filling the form may select from.',
                        tips: [
                            'If you have many options or reuse options frequently, use Bulk Edit.',
                            'The Underlying Value is the value saved to the exported data.' ],
                        value: [],
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
                        description: 'The options the person filling the form may select from.',
                        tips: [
                            'If you have many options or reuse options frequently, use Bulk Edit.',
                            'The Underlying Value is the value saved to the exported data.' ],
                        validation: [ 'underlyingRequired', 'underlyingLegalChars', 'underlyingLength', 'hasOptions' ],
                        value: [],
                        summary: false },
          count:      { name: 'Response Count',
                        type: 'numericRange',
                        description: 'This many options must be selected for the response to be valid.',
                        tips: [
                            'Numbers are inclusive, so a minimum of 2 would allow 2 or more selected options.',
                            'For an open-ended range, fill in only a minimum or a maximum and leave the other blank.' ],
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
                        description: 'The name of the column in the exported data. This is not shown during collection.',
                        tips: [ 'Must start with a letter, and may only include letters, numbers, hyphens, underscores, and periods.' ],
                        validation: [ 'required', 'xmlLegalChars', 'unique', 'alphaStart' ],
                        required: true,
                        value: 'untitled',
                        summary: false },
          label:      { name: 'Label',
                        type: 'uiText',
                        description: 'The title text that is presented to the person filling the form.',
                        tips: [ 'You can reference previous answers using <a href="https://opendatakit.github.io/xforms-spec/#xpath-paths" rel="external"><code>${/xform/data/path}</code> syntax</a>.' ],
                        required: true,
                        value: {},
                        summary: false },
          loop:       { name: 'Looped',
                        type: 'bool',
                        description: 'Whether or not to allow this group to loop.',
                        tips: [ 'If enabled, the person filling the form will be prompted after each cycle if they wish to add another entry.' ],
                        value: false },
          fieldList:  { name: 'Display On One Screen',
                        type: 'bool',
                        description: 'Display all the controls in this group on one screen',
                        validation: [ 'fieldListChildren' ],
                        value: false },
          relevance:  { name: 'Relevance',
                        type: 'text',
                        description: 'Specify a custom expression to evaluate to determine if this group is shown.',
                        tips: [ 'The <a href="https://opendatakit.github.io/xforms-spec/#xpath-functions" rel="external">ODK XForms Functions Spec</a> may be useful.' ],
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
                        tips: [ 'Must start with a letter, and may only include letters, numbers, hyphens, underscores, and periods.' ],
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

    // TODO: combine this and the above hash into one when all these declarations move out into an impl file.
    $.fn.odkControl.controlInformation = {
        inputText: {
            name: 'Text',
            description: 'Collects textual information. Use this for names, long-form responses, and other free text information.'
        },
        inputNumeric: {
            name: 'Number',
            description: 'Collects numeric information. An appropriate keyboard will be presented on mobile devices.',
            tips: [
                'You can choose between integer-only or decimal-allowed responses with the Kind property.',
                'If you wish to collect numeric codes, particularly with leading zeroes, you may wish to use Text instead.'
            ]
        },
        inputDate: {
            name: 'Date/Time',
            description: 'Collects a calendar date. You can choose the granularity from year-only through full date and time.',
            tips: [
                'An appropriate calendar/time widget will be presented on mobile devices.',
                'If you wish to collect only a time, use the Time type instead.'
            ]
        },
        inputTime: {
            name: 'Time',
            description: 'Collects just a time of day. If you wish to collect a time on a certain date, use Date/Time instead.',
            tips: [ 'An appropriate time widget will be presented on mobile devices.' ]
        },
        inputLocation: {
            name: 'Location',
            description: 'Collects a geospatial point, path, or shape on the Earth. Use the Kind property to specify which.',
            tips: [
                'You can choose whether information is gathered automatically with the GPS location of the collection device ' +
                'or selected manually on a map with the Style property.'
            ]
        },
        inputMedia: {
            name: 'Media',
            description: 'Takes a photo, or records an audio or video recording with the collection device.'
        },
        inputBarcode: {
            name: 'Barcode',
            description: 'Scans a barcode with an appropriate application on the collection device and stores the result.',
            tips: [
                'You will need a third-party application like the <a href="https://play.google.com/store/apps/details?id=com.google.zxing.client.android" rel="external">Zxing Barcode Scanner</a> installed on the collection device to use this feature.'
            ]
        },
        inputSelectOne: {
            name: 'Choose One',
            description: 'Allows the form filler to choose one from a set of predetermined choices.',
            tips: [
                // TODO: someday maybe create a feature that automatically fudges this in more easily for the form author.
                // (probably wouldn't be hard, actually.)
                'To create a freeform "Other" option, add one here, then follow it up with a Text question with the Relevance ' +
                'property set to reference this question; for example: <code>${/xpath/to/this/choose/one} = \'other\'</code>'
            ]
        },
        inputSelectMany: {
            name: 'Select Many',
            description: 'Allows the form filler to select multiple options from a set of predetermined options.',
            tips: [
                // TODO: ditto.
                'To create a freeform "Other" option, add one here, then follow it up with a Text question with the Relevance ' +
                'property set to reference this question; for example: <code>${/xpath/to/this/select/many} = \'other\'</code>',
                'You can specify how many options the form filler is allowed to choose with the Response Count property.'
            ]
        },
        group: {
            name: 'Group',
            description: 'Groups many questions together into a logical block.',
            tips: [
                'You can use groups to create looping sets of questions using the Looped option.',
                'You can also display multiple questions at a time using the Display On One Screen option, but be careful ' +
                'using Relevance declarations if you do so; they may not work as you expect.'
            ]
        },
        metadata: {
            name: 'Metadata',
            description: 'Metadata questions silently and automatically collect information about the session.',
        }
    };

})(jQuery);
