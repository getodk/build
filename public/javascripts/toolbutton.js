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

            $this.click(function(event)
            {
                event.preventDefault();
                var $control = createOdkControl($this.attr('rel'));
                $('.workspace').append($control);
                $control.trigger('odkControl-added');
            });

            $this.workspaceDraggable({
                dragCallback: function($control, direction)
                {
                    $('.workspace .placeholder')
                        .addClass('closing')
                        .slideUp('normal', function()
                        {
                            $(this).remove();
                        });

                    var $placeholder = $('<div class="placeholder"></div>')
                                        .text($this.text())
                                        .append('<div class="flowArrow"></div>')
                                        .slideDown('normal');
                    if (direction < 0)
                        $control.before($placeholder);
                    else if (direction == 0)
                        $control.append($placeholder);
                    else if (direction > 0)
                        $control.after($placeholder);
                },
                dropCallback: function()
                {
                    var $placeholder = $('.workspace .placeholder:not(.closing)');
                    if ($placeholder.length > 0)
                    {
                        var $control = createOdkControl($this.attr('rel'))
                        $placeholder.replaceWith($control);
                        $control.trigger('odkControl-added');
                    }
                },
                draggableOptions: {
                    start: function(event, ui)
                    {
                        $(ui.helper)
                            .empty()
                            .append($('<div class="typeIcon></div>"'));
                    }
                }
            });
        });
    };

})(jQuery);
