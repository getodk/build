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

            $this.children('span').on('click', function(event)
            {
                $this.children('.submenu').slideDown('fast');
                $this.addClass('open');
                var curEventCounter = _.uniqueId();

                setTimeout(function()
                {
                    $(document).on('click.menu_' + curEventCounter, function(event)
                    {
                        var shouldClose = true;
                        var $item = $(event.target);

                        if ($item.parents().is($this))
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
                            else if ($line.length === 0)
                                shouldClose = false;
                        }

                        if (shouldClose)
                        {
                            $(document).off('click.menu_' + curEventCounter);
                            $this.removeClass('open');
                            $this.children('.submenu').slideUp('fast');
                        }
                    });
                }, 0);
            });
        });
    };
})(jQuery);

