/**
 *  property-editor.js - keys and values
 *    Versatile editor block for editing properties. Value can be
 *    retrieved later by calling value().
 *    Property Types: text, uiText, bool, numericRange, enum,
 *    				  dateRange, optionsEditor
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
			
		},
		enum: function(property, $editor, $parent) {
			
		},
		dateRange: function(property, $editor, $parent) {
			
		},
		optionsEditor: function(property, $editor, $parent) {
			
		}
	}
})(jQuery);