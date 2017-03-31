;(function($) {

var mimeTypeId = 'application/x-odkbuild-control-id';
var mimeTypeFull = 'application/x-odkbuild-control-data';

// our one shameful global variable. but you can really only drag+drop one thing on your entire
// machine at once anyway. we use this to track whether a successful drop happened here or in
// some other window.
var wasDroppedHere = null;

$.fn.draggable = function(options)
{
    var options = $.extend({}, $.fn.draggable.defaults, options);

    this.each(function()
    {
        var $this = $(this);

        $this.on('dragstart', function(event)
        {
            wasDroppedHere = false;

            var $artifact = options.artifact();
            var data = odkmaker.data.extractOne($artifact);

            event.originalEvent.dataTransfer.setData(mimeTypeId, $artifact.data('odkControl-id'));
            event.originalEvent.dataTransfer.setData(mimeTypeFull, JSON.stringify(data));
            event.originalEvent.dataTransfer.effectAllowed = 'copyMove';
            event.originalEvent.dataTransfer.dropEffect = 'move';

            if (options.handleAddedClass != null)
                $this.addClass(options.handleAddedClass);
        });
        $this.on('dragend', function(event)
        {
            // n.b. according to spec this fires /after/ drop.
            if (options.handleAddedClass != null)
                $this.removeClass(options.handleAddedClass);

            if (options.removeIfMoved && (event.originalEvent.dataTransfer.dropEffect === 'move') && !wasDroppedHere)
            {
                // we've been dropped into some other window; remove this artifact.
                $this.trigger('odkControl-removing');
                $this.remove();
                $this.trigger('odkControl-removed');
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
            if (event.originalEvent.dataTransfer.types.indexOf(mimeTypeFull) < 0)
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
            if (event.originalEvent.dataTransfer.types.indexOf(mimeTypeFull) < 0)
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
            if (event.originalEvent.dataTransfer.types.indexOf(mimeTypeFull) < 0)
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
            var controlId = dataTransfer.getData(mimeTypeId);
            if ($.isBlank(controlId)) return;

            wasDroppedHere = true;
            var controlData = JSON.parse(dataTransfer.getData(mimeTypeFull));

            console.log(dataTransfer.dropEffect);
            var $extant = $('#control' + controlId);
            if (($extant.length > 0) && (dataTransfer.dropEffect === 'move'))
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
            }

            $placeholder.detach();
            event.preventDefault();
        });

    });
};

})(jQuery);

