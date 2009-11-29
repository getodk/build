;(function($)
{
	$.fn.spacingTop = function()
	{
		var $this = $(this);
		return parseInt($this.css('margin-top')) + parseInt($this.css('padding-top'));
	};

	$.displayText = function(value)
	{
		if (value === true)
			return 'yes';
		else if (value === false)
			return 'no';
		else
			return value || '&nbsp;'
	};
})(jQuery);