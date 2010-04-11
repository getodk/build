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

    var checkElemHover = function($elem, position, config, $container)
    {
        // if element is clearly beyond our scope, clear placeholders and abort
        if (position.top > $elem.innerHeight())
        {
            $elem.find('.placeholder')
                .addClass('closing')
                .slideUp('normal', function()
                {
                    $(this).remove();
                });
           return false;
        }

        // set $container to self if not defined
        if (($container === undefined) || ($container === null))
            $container = $elem;

        // otherwise, if there are no controls in the container, add a
        // placeholder and return as found
        if ($container.children(':not(.placeholder)').length === 0)
        {
            if ($container.find('.placeholder').length === 0)
                config.dragCallback($container, 0);
            return true;
        }

        var stackHeight = $container.offset().top - $elem.offset().top;
        var found = false;

        $container.children().each(function()
        {
            var $control = $(this);

            // Skip the placeholder; special case for groups/branches
            if ($control.is('.placeholder'))
            {
                stackHeight += $control.outerHeight(true);
                return;
            }
            else if ($control.is('.group'))
            {
                var $groupContainer = $control.children('.workspaceInnerWrapper').children('.workspaceInner');
                found = checkElemHover($control, { top: position.top - stackHeight, left: position.left }, config, $groupContainer);
                if (found)
                    return false;
            }

            var threshold = $control.innerHeight() / 3;

            // Check the top of the current block
            if (position.top < (stackHeight + threshold))
            {
                if (! $control.prev().is('.placeholder'))
                    config.dragCallback($control, -1);
                found = true;
                return false;
            }

            // Add the height
            stackHeight += $control.outerHeight(true);

            // Check the bottom of the current block
            if ((position.top > (stackHeight - threshold)) &&
                (position.top < stackHeight))
            {
                if (! $control.next().is('.placeholder'))
                    config.dragCallback($control, 1);
                found = true;
                return false;
            }
        });
        return found;
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
        var stackHeight = workspaceOffset.top - $workspaceScrollArea.scrollTop() +
                          $workspaceScrollArea.spacingTop() + $workspace.spacingTop();
        position.top -= stackHeight;

        // Fallback: if we haven't matched any of the above cases
        // we're at the end of the line, so just add it after here.
        if((!checkElemHover($workspace, position, config)) && ($workspace.children(':last-child').is(':not(.placeholder)')))
            config.dragCallback($workspace.children(':last-child'), 1);
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
                distance: 5,
                helper: 'clone',
                opacity: 0.8,
                scroll: false,
                drag: function(event, ui)
                {
                    checkScroll({ left: ui.position.left, top: ui.position.top }, config);
                    checkHover($this, { left: ui.position.left, top: ui.position.top }, config);
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
