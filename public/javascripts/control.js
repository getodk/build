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
    var controlNS = odkmaker.namespace.load('odkmaker.control');

    // Globally active singleton facilities:
    var $propertyList = $('.propertyList');
    var drawPropertyList = function($this, properties)
    {
            // clear out and reconstruct property list
            $propertyList.empty();

            var $advancedContainer = $.tag({
                _: 'li', 'class': 'advanced', contents: [
                    { _: 'a', 'class': 'toggle', href: '#advanced', contents: [
                        { _: 'div', 'class': 'icon' },
                        'Advanced'
                    ] },
                    { _: 'ul', 'class': 'advancedProperties toggleContainer' }
                ]
            });
            var $advancedList = $advancedContainer.find('.advancedProperties');

            // add our hero's properties
            _.each(properties, function(property, name)
            {
                if (name === 'metadata') return;

                $('<li class="propertyItem"/>')
                    .propertyEditor(property, name, $this)
                    .appendTo((property.advanced === true) ? $advancedList : $propertyList);
            });

            // drop in advanced
            $propertyList.append($advancedContainer);
    };
    kor.events.listen({ verb: 'control-selected', callback: function(event)
    {
        var numSelected = $('.control.selected').length;
        if (numSelected === 1)
            drawPropertyList(event.subject, event.subject.data('odkControl-properties'));
        else
            $propertyList
                .empty()
                .append('<li class="emptyData">(multiple questions selected)</li>');
    } });
    kor.events.listen({ verb: 'control-deselected', callback: function(event)
    {
        var $selected = $('.control.selected');
        if ($selected.length === 0)
            odkmaker.application.clearProperties();
        else if ($selected.length === 1)
            drawPropertyList($selected.eq(0), $selected.eq(0).data('odkControl-properties'));
    } });

    // Wired events
    $(function()
    {
        $propertyList.on('click', '.toggle', function(event)
        {
            event.preventDefault();
            $propertyList.toggleClass('showAdvanced');
        });
    });

    // Private methods

    // our own incrementing counter:
    var untitledCount_ = 0;
    var untitledCount = function() { return untitledCount_++; };

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
            $headline.children('.controlLabel').text(properties.kind.value);
        }
        else
        {
            $headline.children('.controlLabel').text($.emptyString(properties.label.value[odkmaker.i18n.displayLanguage()], '[no caption text yet]'));
            $headline.children('.controlHint').text(properties.hint.value[odkmaker.i18n.displayLanguage()]);
        }

        var $propertyList = $info.children('.controlProperties');
        $propertyList.empty();
        _.each(properties, function(property, name)
        {
            if ((name === 'metadata') || (property.summary === false) || (property.value !== true))
                return;

            $propertyList.append(
                $('<li>' + property.name + '</li>')
            );
        });

        _.each(properties, function(property)
        {
            if (property.bindControlClass != null)
                $this.toggleClass(property.bindControlClass, ((property.value != null) && (property.value !== false)));
        });

        // SPECIAL CASES:
        // update the followup question text from that value.
        if ((properties.other != null) && (properties.other.value != null) && (properties.other.value !== false))
            $info.find('.controlSuccessorCondition span').text(properties.other.value.join(' or '));

        // add a cascading slave if cascade is checked.
        if ((properties.cascading != null) && (properties.cascading.value === true) && !$this.next().hasClass('slave'))
        {
            var $slaves = null;
            if (($slaves = $this.data('odkControl-cascadeBackup')) != null)
            {
                $this.after($slaves);
                $slaves.trigger('odkControl-added');
            }
            else
                $this.after($('#templates .control').clone().addClass(type).odkControl(type, { slave: true }));
        }

        // remove all subsequent cascading slaves if cascade is unchecked.
        if ((properties.cascading == null) || (properties.cascading.value === false) && $this.next().hasClass('slave'))
        {
            var $slaves = $this.nextUntil(':not(.slave)');
            $slaves.each(function()
            {
                var $slave = $(this);
                validationNS.controlDestroyed($slave, $slave.data('odkControl-properties'));
            });
            $slaves.trigger('odkControl-removing');
            $slaves.detach();
            $slaves.trigger('odkControl-removed');
            $this.data('odkControl-cascadeBackup', $slaves);
        }
    };

    // gets all controls "between" two given controls, stepping in and out of groups
    // as necessary. root and target themselves are never part of the set.
    var getStack = function($root, $target)
    {
        var $result = null;

        if ($root.is($target))
        {
            return $root;
        }
        else if ($root.siblings().is($target))
        {
            // root and target are siblings.
            $result = $root.prevAll().is($target) ? $root.prevUntil($target) : $root.nextUntil($target);
        }
        else
        {
            // not siblings; compare the hierarchies to figure out the closest common parent.
            var $rootLevels = $($root.parents('.workspace, .control').get().reverse()).add($root);
            var $targetLevels = $($target.parents('.workspace, .control').get().reverse()).add($target);

            // to figure out directionality, we have to first get pair of siblings to compare.
            var $commonContainer = null;
            for (var i = 0; i < $rootLevels.length; i++)
            {
                if ($rootLevels[i] !== $targetLevels[i]) break;
                $commonContainer = $rootLevels[i];
            }
            var divergentIdx = i;
            var $rootDiverge = $rootLevels.eq(divergentIdx);
            var $targetDiverge = $targetLevels.eq(divergentIdx);

            // first deal with everything at common-container level.
            $result = getStack($rootDiverge, $targetDiverge);

            // now select the head or tail of all intervening containers as appropriate.
            // first we determine the direction.
            if ($rootDiverge.nextAll().is($targetDiverge))
                var $before = $rootLevels, $after = $targetLevels;
            else
                var $before = $targetLevels, $after = $rootLevels;

            // we start with the container nested within the divergent one.
            for (var i = (divergentIdx + 1); i < $before.length; i++)
                $result = $result.add($before.eq(i).nextAll());

            for (var i = (divergentIdx + 1); i < $after.length; i++)
                $result = $result.add($after.eq(i).prevAll());

        }

        // find any containers within the linear selections and select their contents.
        $result = $result.add($result.find('.control'));

        return $result;
    };

    var select = function()
    {
        var $this = $(this);
        $this.addClass('selected');
        kor.events.fire({ subject: $this, verb: 'control-selected' });
    };
    var deselect = function()
    {
        var $this = $(this);
        $this.removeClass('selected');
        kor.events.fire({ subject: $this, verb: 'control-deselected' });
    };

    // perform a selection action. this might mean modifying an active multi-selection.
    var $initiator = null; // the last control the user selected singly.
    var $endStop = null;
    var performSelection = function($this, type, options, properties, selectMany, selectOne)
    {
        if (selectMany === true)
        {
            if ($initiator == null)
                // not sure what to do; just pretend shift isn't held.
                return performSelection($this, type, options, properties, false, false);

            if ($endStop == null)
            {
                // if we have no endstop, simply select from the initiator through target.
                getStack($initiator, $this).add($this).each(select);
            }
            else if ($endStop.is($this))
            {
                // nothing would happen anyway; don't bother with computing it.
                return;
            }
            else if (getStack($initiator, $endStop).is($this))
            {
                // if we are selecting somewhere inside the active range, deselect the now-excess.
                getStack($endStop, $this).add($endStop).each(deselect);
            }
            else
            {
                // we are somewhere outside the active range entirely. the easiest thing to do
                // rather than do a bunch of work determining where exactly is just to nuke it
                // and start over.
                getStack($initiator, $endStop).add($endStop).each(deselect);
                getStack($initiator, $this).add($this).each(select);
            }

            // if either endpoint is a container itself, now is the time to also select them.
            $initiator.find('.control').each(select);
            $this.find('.control').each(select);

            if ($initiator.is($this))
                $endStop = null;
            else
                $endStop = $this;
        }
        else if (selectOne === true)
        {
            if ($this.hasClass('selected'))
                $this.each(deselect);
            else
            {
                $this.each(select);
                $initiator = $this;
                $endStop = null;
            }
        }
        else
        {
            $('.workspace .control.selected').each(deselect);

            $this.addClass('selected');
            kor.events.fire({ subject: $this, verb: 'control-selected' });

            $initiator = $this;
            $endStop = null;
        }
    };

    var deleteControl = function($control)
    {
        $control.slideUp('normal', function()
        {
            var $controlAndChildren = $control.find('.control').add($control);
            $controlAndChildren.each(function()
            {
                var $this = $(this);
                // don't do anything if this control has already been processed for deletion.
                if (document.contains($this[0]))
                    validationNS.controlDestroyed($this, $this.data('odkControl-properties'));
            });
            $controlAndChildren.each(deselect);
            $controlAndChildren.trigger('odkControl-removing');
            $control.remove();
            $controlAndChildren.trigger('odkControl-removed');
        });
    };

    // Constructor
    var loadTime = (new Date()).getTime(); // get time in nanos to ~ensure universal uniqueness of id.
    $.fn.odkControl = function(type, options, defaultProperties)
    {
        // Abort for unknown types
        if ($.fn.odkControl.controlProperties[type] === undefined)
            return;

        var options = $.extend({}, $.fn.odkControl.defaults, options);

        return this.each(function()
        {
            var $this = $(this);

            var id = loadTime + '_' + _.uniqueId();
            $this.data('odkControl-id', id);
            $this.attr('id', 'control' + id);
            $this.data('odkControl-type', type);

            // Deep clone the properties if relevant
            var properties = null;

            if (defaultProperties != null)
                properties = defaultProperties;
            else if ((type == 'group') || (type == 'branch') || (type == 'metadata'))
                properties = $.extend(true, {}, $.fn.odkControl.controlProperties[type]);
            else
            {
                properties = $.extend(true, {}, $.fn.odkControl.defaultProperties);
                var controlProperties = $.fn.odkControl.controlProperties[type];
                for (var prop in controlProperties)
                    delete properties[prop];
                $.extend(true, properties, controlProperties);
            }

            // add metadata bag.
            if (properties.metadata == null) properties.metadata = {};

            // transmute slave option into permanent property, then act as appropriate.
            if (options.slave === true) properties.metadata.slave = true;
            if (properties.metadata.slave === true)
            {
                $this.addClass('slave');
                $this.data('odkControl-parent', $this.prev().data('odkControl-properties'));
            }

            var match = null;
            if (properties.name.value == 'untitled')
                properties.name.value += (untitledCount() + 1);
            else if ((match = /^untitled(\d+)$/.exec(properties.name.value)) != null)
                if ((match = parseInt(match[1])) > untitledCount_)
                    untitledCount_ = match;

            _.each(properties, function(property, name)
            {
                if (name === 'metadata') return;

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

            $this.bind('odkControl-reloadProperties odkControl-select', function(event)
            {
                performSelection($this, type, options, properties);
            });
            $this.bind('odkControl-deselect', deselect);
            $this.on('click', function(event)
            {
                event.stopPropagation();

                if ($.isMsft)
                    performSelection($this, type, options, properties, $.keys.selectMany, $.keys.selectOne);
                else
                    performSelection($this, type, options, properties, event.shiftKey, $.isSelectOne(event));
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
                event.stopPropagation();
                event.preventDefault();

                // if the control to which this delete button belongs is not selected at all,
                // always just delete this one.
                var $selected;
                if (!$this.hasClass('selected'))
                    $selected = $this;
                else
                    $selected = $('.control.selected');

                if ($selected.length > 1)
                    odkmaker.application.ask('What do you want to delete?', {
                        'Just this question': function() { deleteControl($this); },
                        'All selected questions': function() { $selected.each(function() { deleteControl($(this)); }); },
                        'Cancel': null
                    });
                else
                    deleteControl($this);
            });

            // set up dragging
            $this.one('mouseenter', function()
            {
                $this.draggable({ handleAddedClass: 'dragging' });
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
        requiredText: { name: 'Required Text',
                        type: 'uiText',
                        bindDisplayIf: 'required',
                        description: 'The error text to display if this field is not filled in.',
                        value: {},
                        summary: false },
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
                        tips: [
                            'The <a href="https://opendatakit.github.io/xforms-spec/#xpath-functions" rel="external">ODK XForms Functions Spec</a> may be useful.',
                            'If this constraint check fails, the Invalid Text is displayed.'
                        ],
                        value: '',
                        advanced: true,
                        summary: false },
        // this is automatically overridden by controls that have their own specified invalidText:
        invalidText:  { name: 'Constraint Invalid Text',
                        type: 'uiText',
                        description: 'Message to display if the value fails the custom constraint check.',
                        value: {},
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
                        tips: [ 'It is also displayed if a custom constraint check is failed.' ],
                        value: {},
                        summary: false } },
        inputNumeric: {
          range:      { name: 'Valid Range',
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
                        tips: [ 'It is also displayed if a custom constraint check is failed.' ],
                        value: {},
                        summary: false },
          appearance: { name: 'Style',
                        type: 'enum',
                        description: 'Style of collection interface to present.',
                        tips: [ 'A Picker, also known as a Spinner, is a little textbox with plus and minus buttons to change the number.' ],
                        options: [ 'Textbox',
                                   'Slider',
                                   'Vertical Slider',
                                   'Picker' ],
                        value: 'Textbox',
                        summary: true },
          kind:       { name: 'Kind',
                        type: 'enum',
                        bindDisplayIf: { appearance: 'Textbox' },
                        description: 'Type of number accepted.',
                        tips: [ 'In some data collection tools, this will affect the type of keypad shown.' ],
                        options: [ 'Integer',
                                   'Decimal' ],
                        value: 'Integer',
                        summary: true },
          selectRange:{ name: 'Selectable Range',
                        type: 'numericRange',
                        validation: [ 'rangeRequired' ],
                        bindDisplayIf: { appearance: [ 'Slider', 'Vertical Slider', 'Picker' ] },
                        optional: false,
                        inclusivity: false,
                        description: 'The lowest and highest selectable values, inclusive.',
                        tips: [ 'Integers and decimals are both valid.' ],
                        value: { min: "1", max: "10" },
                        summary: false },
          selectStep: { name: 'Selectable Range: Step Between Choices',
                        type: 'text',
                        validation: [ 'required', 'numeric', 'stepDivision' ],
                        bindDisplayIf: { appearance: [ 'Slider', 'Vertical Slider', 'Picker' ] },
                        description: 'The gap between adjacent selectable values in the range.',
                        tips: [ 'The step must cleanly end at the low and high ends of the range; in other words, it must divide the selectable range perfectly.' ],
                        value: '1',
                        summary: false },
          sliderTicks:{ name: 'Slider Ticks',
                        type: 'bool',
                        bindDisplayIf: { appearance: [ 'Slider', 'Vertical Slider' ] },
                        description: 'The lowest and highest selectable values, inclusive.',
                        tips: [ 'Integers and decimals are both valid.' ],
                        value: true,
                        summary: false } },
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
                        tips: [ 'It is also displayed if a custom constraint check is failed.' ],
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
                                   'Video' ],
                        value: 'Image' } },
        inputBarcode: {},
        inputSelectOne: {
          options:    { name: 'Options',
                        type: 'optionsEditor',
                        validation: [ 'underlyingRequired', 'underlyingLegalChars', 'underlyingLength', 'hasOptions' ],
                        description: 'The options the person filling the form may select from.',
                        tips: [
                            'If you have many options or reuse options frequently, use Bulk Edit.',
                            'The Underlying Value is the value saved to the exported data.' ],
                        value: [{ text: {}, cascade: [], val: 'untitled' }],
                        summary: false },
          cascading:  { name: 'Cascading',
                        type: 'bool',
                        description: 'Enable this to add a subsequent select question with filtered options.',
                        value: false,
                        summary: false },
          other:      { name: 'Follow-up Question',
                        type: 'otherEditor',
                        bindAllowedIf: { 'cascading': [ null, undefined, false ] },
                        validation: [ 'fieldListExpr' ],
                        description: 'Ask the following question as additional information only if a particular response is chosen.',
                        tips: [
                            'You can use this to easily prompt for more information if the user selects "Other," for example.',
                            'Whatever the following question is, it will only be asked if the user selects the value you specify here.' ],
                        bindTo: 'options',
                        bindControlClass: 'hasSuccessorBinding',
                        value: false,
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
                        value: [{ text: {}, val: 'untitled' }],
                        summary: false },
          other:      { name: 'Follow-up Question',
                        type: 'otherEditor',
                        validation: [ 'fieldListExpr' ],
                        description: 'Ask the following question as additional information only if a particular response is chosen.',
                        tips: [
                            'You can use this to easily prompt for more information if the user selects "Other," for example.',
                            'Whatever the following question is, it will only be asked if the user selects the value you specify here.' ],
                        bindTo: 'options',
                        bindControlClass: 'hasSuccessorBinding',
                        value: false,
                        summary: false },
          count:      { name: 'Response Count',
                        type: 'numericRange',
                        description: 'This many options must be selected for the response to be valid.',
                        tips: [
                            'Numbers are inclusive, so a minimum of 2 would allow 2 or more selected options.',
                            'For an open-ended range, fill in only a minimum or a maximum and leave the other blank.' ],
                        value: false,
                        summary: true },
          invalidText:{ name: 'Invalid Text',
                        type: 'uiText',
                        description: 'Message to display if the value fails the response count check.',
                        tips: [ 'It is also displayed if a custom constraint check is failed.' ],
                        value: {},
                        summary: false },
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


    controlNS.upgrade = {
        2: function(form) {
            var processControl = function(control)
            {
                if (_.isArray(control.children))
                    _.each(control.children, processControl);

                if ((control.type === 'inputNumeric') && (control.appearance == null))
                    control.appearance = 'Textbox';
            };
            _.each(form.controls, processControl);
        }
    };

})(jQuery);
