/**
 *  dropdown-menu.js - so many choices
 *    It's a simple dropdown menu implementation.
 */

;(function($)
{
    $.fn.dropdownMenu = function(options)
    {
        return this.each(function()
        {
            var $this = $(this);

            $this.click(function(event)
            {
                $this.children('.submenu').slideDown('fast');
                $this.addClass('open');
                $(document).bind('click.menu', function(event)
                {
                    if ($(event.target).parents().index($this[0]) < 0 ||
                        $(event.target).is('a'))
                    {
                        $(document).unbind('click.menu');
                        $this.removeClass('open');
                        $this.children('.submenu').slideUp('fast');
                    }
                });
            });
        });
    };
})(jQuery);