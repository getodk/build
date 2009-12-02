/**
 *  toolbutton.js - what a tool
 *    A button which can be dragged off and dropped onto the workspace to create
 *    a new instance of an ODK Control.
 */

;(function($)
{
	// Constructor
	$.fn.toolButton = function(options)
	{
		var options = $.extend({}, $.fn.toolButton.defaults, options);

		return this.each(function()
		{
			var $this = $(this);

			// Support the metadata plugin
            var config = $.meta ? $.extend({}, options, $this.data()) : options;

			// HACK: add icons.
			$this.prepend($('<div class="icon"></div>'));

			$this.workspaceDraggable();
		});
	};

	// Plugin Defaults
	$.fn.toolButton.defaults = {
	};

})(jQuery);