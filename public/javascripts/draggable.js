;(function($) {

var mimeType = 'application/x-odkbuild-control';

// our two shameful global variables. but you can really only drag+drop one thing on your entire
// machine at once anyway. we use these to track whether a successful drop happened here or in
// some other window, and to fix awfulness with Chrome.
var wasDroppedHere = null;
var lastDragStartAt = null;

// you're welcome, chrome:
var scheduleReapCheck = function(at, $artifact)
{
    var timer = null;
    var count = 0;
    var check = function()
    {
        count++;

        var message = window.localStorage.getItem(at);
        if (!$.isBlank(message))
        {
            window.localStorage.removeItem(at);
            window.clearInterval(timer);

            if (message === 'move')
                reap($artifact);
        }
        else if (count > 10)
        {
            // we don't know what happened; either the message is being slow to come or (more likely)
            // the user cancelled the drag operation. either way, do the safe thing, which is nothing.
            window.clearInterval(timer);
        }
    };
    window.setInterval(check, 50); // check every 50ms for up to half a second.
};

var reap = function($artifact)
{
    $artifact.trigger('odkControl-removing');
    $artifact.remove();
    $artifact.trigger('odkControl-removed');
};

$.fn.draggable = function(options)
{
    var options = $.extend({}, $.fn.draggable.defaults, options);

    this.each(function()
    {
        var $this = $(this);

        $this.on('dragstart', function(event)
        {
            var $artifact = options.artifact();
            wasDroppedHere = false;

            // track dragstart millisecond time as a UUID for the sake of chrome.
            lastDragStartAt = (new Date()).getTime();
            var data = { id: $artifact.data('odkControl-id'), control: odkmaker.data.extractOne($artifact), at: lastDragStartAt };

            event.originalEvent.dataTransfer.setData(mimeType, JSON.stringify(data));
            event.originalEvent.dataTransfer.effectAllowed = 'copyMove';
            event.originalEvent.dataTransfer.dropEffect = 'move';

            if (options.handleAddedClass != null)
                $this.addClass(options.handleAddedClass);

            kor.events.fire({ subject: $artifact, verb: 'control-drag-start' });
        });
        $this.on('dragend', function(event)
        {
            // n.b. according to spec this fires /after/ drop.
            if (options.handleAddedClass != null)
                $this.removeClass(options.handleAddedClass);

            // if we've been moved rather than copied into some other window, remove the original
            // source. but because chrome doesn't appropriately set the dropEffect property, we have
            // to rig up our own IPC.
            if (!wasDroppedHere && options.removeIfMoved)
            {
                if ($.isChrome)
                    scheduleReapCheck(lastDragStartAt, $this);
                else if (event.originalEvent.dataTransfer.dropEffect === 'move')
                    reap($this);
            }
        });

        $this.prop('draggable', true);
    });
};
$.fn.draggable.defaults = {
    artifact: function() {},
    handleAddedClass: null, // set to attach a class to the original drag source during the drag.
    removeIfMoved: true
};

$.fn.droppable = function(options)
{
    this.each(function()
    {
        var $this = $(this);

        var currentDataTransfer = null;
        $this.on('dragenter', function(event)
        {
            if (event.originalEvent.dataTransfer.types.indexOf(mimeType) < 0)
                return; // longer bit of logic to be consistent with dragover.

            // preventing default indicates that we can drop the object here.
            event.preventDefault();
            currentDataTransfer = event.originalEvent.dataTransfer;
        });

        // we track drag events on contained controls as a really cheap way of
        // determining where the mouse is at. we track current and previous to
        // help determine neutral float direction in the middle third.
        var currentEvent = null;
        var target = null;
        $this.on('dragover', '.control', function(event)
        {
            if (event.originalEvent.dataTransfer.types.indexOf(mimeType) < 0)
                return;

            // have to prevent default here as well to maintain the drag.
            event.preventDefault();

            if (event.originalEvent === currentEvent)
                return; // we've already handled this event at the deepest level and it's now bubbling; ignore.

            currentEvent = event.originalEvent;
            target = this;
        });

        var $placeholder = $('<div id="placeholder"/>');
        $this.on('dragover', function(event)
        {
            if (event.originalEvent.dataTransfer.types.indexOf(mimeType) < 0)
                return;

            // have to prevent default here as well to maintain the drag.
            event.preventDefault();

            // the above dragover handler for contained controls always fires before this one, so
            // by the time we get here we have up-to-date information on targets.
            if (target != null)
            {
                var $target = $(target);
                var targetTop = $target.offset().top;
                var targetHeight = $target.outerHeight(true);
                var third = targetHeight / 3;
                var mouseY = event.originalEvent.clientY;

                if (mouseY < (targetTop + third))
                {
                    // we're in the top third; we want to place the drop target above this control.
                    $target.before($placeholder);
                }
                else if (mouseY < (targetTop + (2 * third)))
                {
                    // we're in the middle third; leave the placeholder where it was. if it wasn't
                    // anywhere, put it on the closer half.
                    if ($placeholder[0].parentNode == null)
                    {
                        if (mouseY < (targetTop + (targetHeight / 2)))
                            $target.before($placeholder);
                        else
                            $target.after($placeholder);
                    }
                }
                else
                {
                    // we're in the bottom third. the drop target goes after our spot.
                    $target.after($placeholder);
                }
            }
            else
            {
                // if we have no target, we assume we're at the very end of the stack.
                $('.workspace').append($placeholder);
            }
        });

        $this.on('dragleave', function(event)
        {
            $placeholder.detach();
        });

        $this.on('drop', function(event)
        {
            var dataTransfer = event.originalEvent.dataTransfer;
            var data = dataTransfer.getData(mimeType);
            if ($.isBlank(data)) return;

            wasDroppedHere = true;
            var parsed = JSON.parse(data);
            var controlId = parsed.id;
            var controlData = parsed.control;

            var $extant = $('#control' + controlId);
            // break this logic out because chrome makes it all terrible (see commit message @c1c897e).
            // at this point, i'm to incensed to figure out unreliable platform detection and carefully
            // react to ctrl on Win and opt on Mac so they both work.
            var isExtant = $extant.length > 0;
            var intendsCopy = $.isChrome ? (event.ctrlKey || event.altKey) : (dataTransfer.dropEffect === 'copy');

            if (isExtant && !intendsCopy)
            {
                // if our drag source is in the same document and we're supposed to move it,
                // then do so directly rather than cloning data.
                $extant.trigger('odkControl-removing');
                $extant.detach();
                $extant.trigger('odkControl-removed');
                $extant.insertAfter($placeholder);
                $extant.trigger('odkControl-added');
            }
            else
            {
                // if our drag source is some other document or we're supposed to copy rather
                // than move, then inflate and insert from data.
                odkmaker.data.loadOne(controlData)
                    .insertAfter($placeholder)
                    .trigger('odkControl-added')
                    .trigger('odkControl-select');

                // if we're chrome, write a key to localStorage to inform the original source of the user's
                // intentions.
                if ($.isChrome && !isExtant) window.localStorage.setItem(parsed.at, intendsCopy ? 'copy' : 'move');
            }

            $placeholder.detach();
            event.preventDefault();
        });

    });
};

})(jQuery);

