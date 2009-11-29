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
	var refreshFromProperties = function($this, type, config, properties)
	{
		$this.find('.controlName').text(
			$.grep(properties, function(property) { return property.name === 'Name'; })[0].value)

		var $propertyList = $this.find('.controlProperties');
		$propertyList.empty();

		$.each(properties, function()
		{
			// TODO: renderers
			$propertyList.append(
				$('<dt>' + this.name + '</dt><dd>' + (this.value || '') + '</dd>')
			);
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
		  value: 'Untitled' },
		{ name: 'Label',
		  type: 'uiText',
		  description: 'The name of this field as it is presented to the user.',
		  required: true },
		{ name: 'Hint',
		  type: 'uiText',
		  description: 'Additional help for this question.'},
		{ name: 'Read Only',
		  type: 'bool',
		  description: 'Whether this field can be edited by the end user on not.' },
		{ name: 'Required',
		  type: 'bool',
		  description: 'Whether this field must be filled in before continuing.' },
		{ name: 'Relevance',
		  type: 'text',
		  description: 'Specify a custom expression to evaluate to determine if this field is shown.',
		  advanced: true },
		{ name: 'Constraint',
		  type: 'text',
		  description: 'Specify a custom expression to validate the user input.',
		  advanced: true },
		{ name: 'Instance Destination',
		  type: 'text',
		  description: 'Specify a custom XPath expression at which to store the result.',
		  advanced: true }
	];

	// Property fields per control type
	$.fn.odkControl.controlProperties = {
		inputText: [
		  { name: 'Length',
		    type: 'numericRange' } ],
		inputNumeric: [
		  { name: 'Range',
			type: 'numericRange' },
		  { name: 'Type',
		    type: 'enum',
		  	options: [ 'Integer',
					   'Decimal' ] } ],
		inputDate: [
		  { name: 'Range',
		    type: 'dateRange' } ],
		inputSelectOne: [
		  { name: 'Options',
			type: 'optionsEditor'} ],
		inputSelectMany: [
		  { name: 'Options',
			type: 'optionsEditor'},
		  { name: 'Mutually Exclusive',
			type: 'exclusivityEditor' },
		  { name: 'Select count range',
			type: 'numericRange' } ]
	};

	
})(jQuery);