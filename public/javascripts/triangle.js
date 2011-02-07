/**
 *  triangle.js - triple threat
 *    Draws a triangle. Simple as that. Doesn't even style it; do that
 *    in CSS instead.
 */

;(function($)
{
    $.fn.triangle = function()
    {
        this.each(function()
        {
            var $this = $(this);
            var height = $this.height();
            var width = $this.width();

            _(height).times(function(i)
            {
                var $slice = $('<div class="slice"></div>');
                $this.append($slice);

                $slice.css({
                    position: 'absolute',
                    top: i,
                    left: i * 0.57735, // tan(30deg)
                    height: 1,
                    width: width - (i * 1.1547) // tan(30deg)*2
                })
            });
        });
    };
})(jQuery);

