;(function($)
{
	$.fn.spacingTop = function()
	{
		var $this = $(this);
		return parseInt($this.css('margin-top')) + parseInt($this.css('padding-top'));
	};
})(jQuery);