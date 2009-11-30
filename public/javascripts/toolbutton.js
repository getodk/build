/**
 *  toolbutton.js - what a drag
 *    A button which can be dragged off and dropped onto the workspace to create
 *    a new instance of an ODK Control.
 */

;(function($)
{
	// Private methods
	var scrollTimer;
	var scrolling = false;
	var checkScroll = function(position, config)
	{
		var $workspaceScrollArea = $('.workspaceScrollArea');
		var workspaceOffset = $workspaceScrollArea.offset();

		if (position.top < (workspaceOffset.top + config.scrollMargin))
		{
			if (!scrolling)
			{
				scrolling = true;
				clearInterval(scrollTimer);

				scrollTimer = setInterval(function()
				{
					$workspaceScrollArea.scrollTop($workspaceScrollArea.scrollTop() - config.scrollSpeed);
				}, config.scrollSpeed);
			}
		}
		else if (position.top > (workspaceOffset.top + $workspaceScrollArea.outerHeight(false) - config.scrollMargin))
		{
			if (!scrolling)
			{
				scrolling = true;
				clearInterval(scrollTimer);

				scrollTimer = setInterval(function()
				{
					$workspaceScrollArea.scrollTop($workspaceScrollArea.scrollTop() + config.scrollSpeed);
				}, config.scrollSpeed);
			}
		}
		else
		{
			scrolling = false;
			clearInterval(scrollTimer);
		}
	};

	var generatePlaceholder = function(displayText)
	{
		$('.workspace .placeholder')
			.addClass('closing')
			.slideUp('normal', function()
			{
				$(this).remove();
			});
		return $('<div class="placeholder"></div>')
			    .text(displayText)
			    .slideDown('normal');
	};

	var checkHover = function($this, position, config)
	{
		// Check bounds
		var $workspaceScrollArea = $('.workspaceScrollArea');
		var workspaceOffset = $workspaceScrollArea.offset();
		if ((position.left < workspaceOffset.left) ||
			(position.left > (workspaceOffset.left + $workspaceScrollArea.outerWidth(false))) ||
			(position.top < workspaceOffset.top) ||
			(position.top > (workspaceOffset.top + $workspaceScrollArea.outerHeight(false))))
			return;

		// Append as necessary
		var $workspace = $('.workspace');
		if ($workspace.children(':not(.placeholder)').length === 0)
		{
			if ($('.workspace .placeholder').length === 0)
				$workspace.append(generatePlaceholder($this.text()));
		}
		else
		{
			var stackHeight = workspaceOffset.top - $workspaceScrollArea.scrollTop() +
							  $workspaceScrollArea.spacingTop() + $workspace.spacingTop();

			$workspace.children().each(function()
			{
				var $control = $(this);

				// Skip the placeholder
				if ($control.is('.placeholder'))
				{
					stackHeight += $control.outerHeight(true);
					return;
				}

				var threshold = $control.innerHeight() / 3;

				// Check the top of the current block
				if (position.top < (stackHeight + threshold))
				{
					if (! $control.prev().is('.placeholder'))
						$control.before(generatePlaceholder($this.text()));
					return false;
				}

				// Add the height
				stackHeight += $control.outerHeight(true);
				if ((position.top > (stackHeight - threshold)) &&
					(position.top < stackHeight))
				{
					if (! $control.next().is('.placeholder'))
						$control.after(generatePlaceholder($this.text()));
					return false;
				}
			});
		}
	};

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

			$this.draggable({
				addClass: false,
				appendTo: 'body',
				containment: 'window',
				distance: 5,
				helper: 'clone',
				opacity: 0.8,
				scroll: false,
				drag: function(event, ui)
				{
					checkScroll(ui.absolutePosition, config);
					checkHover($this, ui.absolutePosition, config);
				},
				stop: function(event, ui)
				{
					clearInterval(scrollTimer);

					var $placeholder = $('.workspace .placeholder:not(.closing)');
					if ($placeholder.length > 0)
						$placeholder.replaceWith(
							$('#templates .control')
								.clone()
								.addClass($this.attr('rel'))
								.odkControl($this.attr('rel'))
								.trigger('odkControl-select'));
				}
			});
		});
	};

	// Plugin Defaults
	$.fn.toolButton.defaults = {
		scrollInterval: 10,
		scrollMargin: 40,
		scrollSpeed: 10
	};

})(jQuery);