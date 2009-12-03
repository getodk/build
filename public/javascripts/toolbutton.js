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
    };

})(jQuery);