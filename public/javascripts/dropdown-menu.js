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
                var curEventCounter = _.uniqueId();
                $(document).bind('click.menu_' + curEventCounter, function(event)
                {
                    var $item = $(event.target);
                    if ($item.parents().index($this[0]) < 0 ||
                        $item.is('a'))
                    {
                        var $line = $item.closest('li');
                        if ($line.hasClass('checkbox'))
                        {
                            $line.toggleClass('selected');
                        }
                        else if ($line.hasClass('radio'))
                        {
                            $line.siblings().removeClass('selected');
                            $line.addClass('selected');
                        }

                        $(document).unbind('click.menu_' + curEventCounter);
                        $this.removeClass('open');
                        $this.children('.submenu').slideUp('fast');
                    }
                });
            });
        });
    };
})(jQuery);

