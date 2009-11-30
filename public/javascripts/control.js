/**
 *  control.js - representational metaphor
 *    Represents a control in the actual XForm. It only manages and stores data
 *    about its internal structure and properties - the general form structure
 *    is managed by the DOM.
 */

// jr:itext for translation
// <output value="xpath"/> for substitution inside question text

;(function($)
{
	// Private methods
	var getProperty = function(properties, name)
	{
		return $.grep(properties, function(property) { return property.name === name; })[0].value;
	};

	var refreshFromProperties = function($this, type, config, properties)
	{
		$this.find('.controlName .text').text(getProperty(properties, 'Name'));

		$this.find('.controlPreview')
			 .empty()
			 .append($.fn.odkControl.controlRenderers[type](properties));

		var $propertyList = $this.find('.controlProperties');
		$propertyList.empty();
		$.each(properties, function()
		{
			if (this.summary === false)
				return;

			$propertyList.append(
				$('<dt>' + this.name + '</dt><dd>' + $.displayText(this.value) + '</dd>')
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
		$.each(properties, function()
		{
			if (this.advanced === true)
				return;

			$('<li/>')
				.toggleClass('even', (i % 2) == 0)
				.propertyEditor(this)
				.appendTo($propertyList);
			i++;
		});

		// now do advanced properties
		$('<li class="advanced"><a class="toggle" href="#advanced"><div class="icon"></div>Advanced</a>' +
		    '<ul class="advancedProperties toggleContainer"></ul></li>').appendTo($propertyList);
		var $advancedList = $propertyList.find('.advancedProperties');
		$.each(properties, function()
		{
			if (this.advanced !== true)
				return;

			$('<li/>')
				.toggleClass('even', (i % 2) == 0)
				.propertyEditor(this)
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
			var properties = defaultProperties ||
				$.extend(true, [], $.fn.odkControl.defaultProperties).concat(
				$.extend(true, [], $.fn.odkControl.controlProperties[type]));
			$this.data('odkControl-properties', properties);

			$this.bind('odkControl-propertiesUpdated', function(event) {
				refreshFromProperties($this, type, config, properties);
			});
			$this.trigger('odkControl-propertiesUpdated');

			$this.click(function(event) {
				selectControl($this, type, config, properties);
			});
			selectControl($this, type, config, properties);
		});
	};

	// Plugin Defaults
	$.fn.odkControl.defaults = {
	};

	// Default property fields
	$.fn.odkControl.defaultProperties = [
		{ name: 'Name',
		  type: 'text',
		  description: 'The data name of this field in the final exported XML.',
		  limit: [ 'nosymbols', 'lowercase', 'unique' ],
		  required: true,
		  value: 'Untitled',
		  summary: false },
		{ name: 'Label',
		  type: 'uiText',
		  description: 'The name of this field as it is presented to the user.',
		  required: true,
		  value: 'Untitled',
		  summary: false },
		{ name: 'Hint',
		  type: 'uiText',
		  description: 'Additional help for this question.',
		  value: '',
		  summary: false },
		{ name: 'Read Only',
		  type: 'bool',
		  description: 'Whether this field can be edited by the end user or not.',
		  value: false,
		  summary: true },
		{ name: 'Required',
		  type: 'bool',
		  description: 'Whether this field must be filled in before continuing.',
		  value: false,
		  summary: true },
		{ name: 'Relevance',
		  type: 'text',
		  description: 'Specify a custom expression to evaluate to determine if this field is shown.',
		  value: '',
		  advanced: true,
		  summary: false },
		{ name: 'Constraint',
		  type: 'text',
		  description: 'Specify a custom expression to validate the user input.',
		  value: '',
		  advanced: true,
		  summary: false },
		{ name: 'Instance Destination',
		  type: 'text',
		  description: 'Specify a custom XPath expression at which to store the result.',
		  value: '',
		  advanced: true,
		  summary: false }
	];

	// Property fields per control type
	$.fn.odkControl.controlProperties = {
		inputText: [
		  { name: 'Length',
		    type: 'numericRange',
			value: false,
		 	summary: false } ],
		inputNumeric: [
		  { name: 'Range',
			type: 'numericRange',
			value: false,
			summary: false },
		  { name: 'Type',
		    type: 'enum',
		  	options: [ 'Integer',
					   'Decimal' ],
			value: 'Integer',
			summary: true } ],
		inputDate: [
		  { name: 'Range',
		    type: 'dateRange',
		 	value: false,
			summary: false } ],
		inputSelectOne: [
		  { name: 'Options',
			type: 'optionsEditor',
			value: [],
			summary: false } ],
		inputSelectMany: [
		  { name: 'Options',
			type: 'optionsEditor',
			value: [],
			summary: false },
		  { name: 'Select count range',
			type: 'numericRange',
			value: false,
			summary: false } ]
	};

	// Preview renderers
	var generateLabels = function(label, hint)
	{
		var result = '<label class="controlLabel">' + label + '</label>';
		if (hint !== '')
			result += '<label class="controlHint">' + hint + '</label>';
		return result;
	};
	var generateTextPreview = function(properties)
	{
		return $(generateLabels(getProperty(properties, 'Label'), getProperty(properties, 'Hint')) +
				 '<input type="text" class="controlPreview"/>');
	};
	var generateSelectPreview = function(properties, type)
	{
		var result = generateLabels(getProperty(properties, 'Label'), getProperty(properties, 'Hint'));
		var options = getProperty(properties, 'Options');
		var name = getProperty(properties, 'Name') || Math.random();

		if ((options !== undefined) && (options !== null) && (options.length > 0))
			$.each(options, function(option)
			{
				result += '<input type="' + type + '" name=' + name + '/>' +
						  '<label class="controlOptionLabel">' + option.label + '</label>';
			});
		else
			result += '<div class="controlOptionsEmpty">No options yet.</div>';

		return $(result);
	};

	$.fn.odkControl.controlRenderers = {
		inputText: generateTextPreview,
		inputNumeric: generateTextPreview,
		inputDate: generateTextPreview,
		inputSelectOne:  function(properties) { return generateSelectPreview(properties, 'radio'); },
		inputSelectMany: function(properties) { return generateSelectPreview(properties, 'checkbox'); }
	};
})(jQuery);