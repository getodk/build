/**
 *  toolbutton.js - what a tool
 *    A button which can be dragged off and dropped onto the workspace to create
 *    a new instance of an ODK Control.
 */

;(function($)
{
    var createOdkControl = function(type)
    {
        return $('#templates .control')
                   .clone()
                   .addClass(type)
                   .odkControl(type)
                   .trigger('odkControl-select');
    };

    // Constructor
    $.fn.toolButton = function(options)
    {
        return this.each(function()
        {
            var $this = $(this);

            $this.on('click', function(event)
            {
                event.preventDefault();
                var $control = createOdkControl($this.attr('rel'));
                $('.workspace').append($control);
                $control.trigger('odkControl-added').trigger('click');
            });

            $this.draggable({
                artifact: function() { return createOdkControl($this.attr('rel')); },
                removeIfMoved: false
            });
        });
    };

})(jQuery);

