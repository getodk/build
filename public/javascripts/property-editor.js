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
	$.fn.propertyEditor = function(property, options)
	{
		var options = $.extend({}, $.fn.propertyEditor.defaults, options);

		return this.each(function()
		{
			var $this = $(this);

			// Support the metadata plugin
            var config = $.meta ? $.extend({}, options, $this.data()) : options;

			console.log(property.name);
			console.log(property.type);
			$this.empty().append($.fn.propertyEditor.editors[property.type].render(property));
		});
	};

	$.fn.propertyEditor.defaults = {
	};

	// Configurations for different editor types
	$.fn.propertyEditor.editors = {
		text: {
			render: function(property) {
				var $result = $('<h4>' + property.name + '</h4><p>' + property.description + '</p>' +
					'<input type="text" class=".editorTextfield" value="' + (property.value || '') + '"/>');
				// TODO: validation goes here.
				return $result;
			},
			value: function($this) {
				return $this.find('.editorTextfield').val();
			}
		},
		uiText: {
			render: function(property) {
				
			},
			value: function($this) {
				
			}
		},
		bool: {
			render: function(property) {
				return $('<input id="property_' + property.name + '" type="checkbox" class=".editorCheckbox"' + 
					((property.value === true) ? ' checked="checked"' : '') + '"/>' +
					'<label for="property_' + property.name + '">' + property.name + '</label>' +
					'<p>' + property.description + '</p>');
			},
			value: function($this) {
				return $this.find('.editorCheckbox:checked').length === 1;
			}
		},
		numericRange: {
			render: function(property) {
				
			},
			value: function($this) {
				
			}
		},
		enum: {
			render: function(property) {
				
			},
			value: function($this) {
				
			}
		},
		dateRange: {
			render: function(property) {
				
			},
			value: function($this) {
				
			}
		},
		optionsEditor: {
			render: function(property) {
				
			},
			value: function($this) {
				
			}
		}
	}
})(jQuery);