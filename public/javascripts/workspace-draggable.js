/**
 *  workspace-draggable.js - what a drag
 *    Applied to odkControl and toolButton; basic dragging functionality
 *      onto the workspace and interactions with existing controls.
 */

;(function($)
{
    // private methods
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
                config.dragCallback($workspace, 0);
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
                        config.dragCallback($control, -1);
                    return false;
                }

                // Add the height
                stackHeight += $control.outerHeight(true);

                // Check the bottom of the current block
                // Fallback: if we haven't matched any of the above cases
                // we're at the end of the line just add after here.
                if (((position.top > (stackHeight - threshold)) &&
                     (position.top < stackHeight)) ||
                     $control.is(':last-child'))
                {
                    if (! $control.next().is('.placeholder'))
                        config.dragCallback($control, 1);
                    return false;
                }
            });
        }
    };

    $.fn.workspaceDraggable = function(options)
    {
        var options = $.extend({}, $.fn.workspaceDraggable.defaults, options);

        return this.each(function()
        {
            var $this = $(this);

            // Support the metadata plugin
            var config = $.meta ? $.extend({}, options, $this.data()) : options;

            $(this).draggable($.extend({}, {
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

                    config.dropCallback(ui.helper);
                }
            }, options.draggableOptions));
        });
    };

    $.fn.workspaceDraggable.defaults = {
        dragCallback: function($control, direction) {},
        draggableOptions: {},
        dropCallback: function() {},
        insertCallback: function() {},
        scrollInterval: 10,
        scrollMargin: 40,
        scrollSpeed: 10
    };
})(jQuery);