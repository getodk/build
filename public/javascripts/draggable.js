;(function($) {

// we prefer to use the full mimetype so that dragging over textboxes in the browser
// or elsewhere do not incorrectly imply a valid drop point. but IE chokes on anything
// other than "text" and "url" so we fall back if we must.
// but also also edge forces "text" to become "text/plain" so we need to set that to
// compare against the right thing. but IE doesn't even support "text/plain", and if
// you set "text" like they recommend the browser changes it to "Text".
var mimeType = $.isMsft ? ($.isIE ? 'Text' : 'text/plain') : 'application/x-odkbuild-control';
var checkForMimeType = function(dataTransfer)
{
    // safari doesn't set types at first:
    if (dataTransfer.types == null)
        return false;

    // for most browsers, which use a plain array:
    if (dataTransfer.types.indexOf != null)
        return dataTransfer.types.indexOf(mimeType) >= 0;

    // for IE/Edge, which use a DomStringList:
    if (dataTransfer.types.contains != null)
        return dataTransfer.types.contains(mimeType);

    // for ??:
    if (dataTransfer.types.length != null)
        for (var i = 0; i < dataTransfer.types.length; i++)
            if (dataTransfer.types[i] === mimeType)
                return true;

    // we've run out of ideas:
    return false;
};

// okay, as usual mozilla has read the specification and nobody else has bothered. theoretically,
// during both the dragEnd and drop handlers, the dropEffect property on dataTransfer is supposed
// to be set to the user's final intention. this is important so we know if the user wants to move
// or copy, or if the user has cancelled the drag operation (this is the reason for the chrome
// nastiness below).
//
// the copy versus move behavior used to work throughout. but now it's broken in chrome and
// safari. thankfully, there is a weird hack workaround due to the way the browsers set the
// effectAllowed property, which we exploit here.
var isCopyEffect = function(dataTransfer) {
  return (dataTransfer.dropEffect === 'copy') ||
    ((dataTransfer.dropEffect === 'none') && (dataTransfer.effectAllowed === 'copy'));
};

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
    $artifact.find('.control')
        .trigger('odkControl-removing')
        .trigger('odkControl-deselect')
        .remove()
        .trigger('odkControl-removed');

    $artifact
        .trigger('odkControl-removing')
        .trigger('odkControl-deselect')
        .remove()
        .trigger('odkControl-removed');
};

$.fn.draggable = function(passedOptions)
{
    var options = $.extend({}, $.fn.draggable.defaults, passedOptions);

    this.each(function()
    {
        var $this = $(this);

        $this.on('dragstart', function(event)
        {
            // bail if we've already started dragging on a inner element.
            var dataTransfer = event.originalEvent.dataTransfer;
            if (checkForMimeType(dataTransfer)) return;

            // determine what it is that we are dragging:
            if (options.artifact != null)
                // if we are given an explicit artifact to drag, use that.
                var $dragging = options.artifact();
            else if ($this.hasClass('selected'))
                // we are selected; drag everything that is selected that isn't already nested in a selected container.
                var $dragging = $('.control.selected').filter(function() { return $(this).parents('.selected:first').length === 0; });
            else
                // we are being dragged but we are not selected. drag just this thing.
                var $dragging = $this;

            // expand selection in both directions to account for slave groups.
            // N.B.!! this depends on selection order. if the above logic changes, this
            // code may cease to work as expected.
            var $first = $dragging.first();
            if ($first.hasClass('slave'))
            {
                // need to add not just the previous slaves but also the parent of the
                // slaves.
                var $additional = $first.prevUntil(':not(.slave)');
                if ($additional.length > 0)
                    // prevUntil returns objects in reverse stack, so last is the topmost
                    // element in the document.
                    $dragging = $dragging.add($additional).add($additional.last().prev());
                else
                    $dragging = $dragging.add($first.prev());
            }
            var $last = $dragging.last();
            if ($last.next().hasClass('slave'))
                // in this case just select all hanging slaves.
                $dragging = $dragging.add($last.nextUntil(':not(.slave)'));

            // save off the drag cohort.
            $this.data('draggable-dragging', $dragging);

            // track dragstart millisecond time as a UUID for the sake of chrome.
            lastDragStartAt = (new Date()).getTime();

            // set up the data transfer for the drag.
            var data = {
                ids: $dragging.map(function() { return $(this).data('odkControl-id') }).get(),
                controls: $dragging.map(function() { return odkmaker.data.extractOne($(this)); }).get(),
                languages: odkmaker.i18n.activeLanguageData(),
                at: lastDragStartAt
            };
            dataTransfer.setData(mimeType, JSON.stringify(data));
            dataTransfer.effectAllowed = 'copyMove';
            dataTransfer.dropEffect = 'move';

            // if we have multiple items, set the drag image to something more appropriate.
            // ...but not in IE/Edge, which don't support setDragImage at all.
            if (($dragging.length > 1) && !$.isMsft)
            {
                var $dragIcon = $('#dragIcon');
                $dragIcon.find('.count').text($dragging.length);
                dataTransfer.setDragImage($dragIcon[0], -10, -10);
            }

            // set class.
            if (options.handleAddedClass != null)
                $dragging.addClass(options.handleAddedClass);

            // some housekeeping.
            wasDroppedHere = false;
            kor.events.fire({ subject: $dragging, verb: 'control-drag-start' });
        });
        $this.on('dragend', function(event)
        {
            var $dragging = $this.data('draggable-dragging');

            // n.b. according to spec this fires /after/ drop.
            if (options.handleAddedClass != null)
                $dragging.removeClass(options.handleAddedClass);

            // if we've been moved rather than copied into some other window, remove the original
            // source. but because chrome doesn't appropriately set the dropEffect property, we have
            // to rig up our own IPC.
            if (!wasDroppedHere && options.removeIfMoved)
            {
                if ($.isChrome)
                    scheduleReapCheck(lastDragStartAt, $dragging);
                else if (event.originalEvent.dataTransfer.dropEffect === 'move')
                    reap($dragging);
            }

            // don't bubble.
            event.stopPropagation();
        });

        $this.prop('draggable', true);
    });
};
$.fn.draggable.defaults = {
    artifact: null,
    handleAddedClass: null, // set to attach a class to the original drag source during the drag.
    removeIfMoved: true
};

$.fn.droppable = function(passedOptions)
{
    var options = $.extend({}, $.fn.droppable.defaults, passedOptions);

    this.each(function()
    {
        var $this = $(this);
        var target = null;

        $this.on('dragenter', function(event)
        {
            if ($this[0] !== event.target)
                return; // this is some subelement bubbling. just forget about it.

            if (!checkForMimeType(event.originalEvent.dataTransfer))
                return; // longer bit of logic to be consistent with dragover.

            // preventing default indicates that we can drop the object here.
            event.preventDefault();
        });

        // we track drag events on contained controls as a really cheap way of
        // determining where the mouse is at.
        var currentOverEvent = null;
        $this.on('dragover', '.control', function(event)
        {
            if (!checkForMimeType(event.originalEvent.dataTransfer))
                return;

            // have to prevent default here as well to maintain the drag.
            event.preventDefault();

            // no matter anything below, if the eventing element is currently being dragged,
            // use that element instead to prevent groups from being dragged into themselves.
            if (/dragging/i.test(this.className))
                target = this;

            // we've already handled this event at the deepest level and it's now bubbling; ignore.
            if (event.originalEvent === currentOverEvent)
                return;
            currentOverEvent = event.originalEvent;

            // if we drag into the gap between controls nested within a group (ie we drag onto the
            // workspace area of a group but the last thing we dragged onto was a control in that
            // group), we want to ignore the group itself and just go with whatever we had before.
            if (/group/i.test(this.className) && this.contains(target) && $(this).children('.workspaceInnerWrapper')[0].contains(event.target))
                return;

            target = this;
        });

        var $placeholder = $('<div id="placeholder"/>');
        var $scrollParent = $this.closest(options.scrollParent);
        $this.on('dragover', function(event)
        {
            if (!checkForMimeType(event.originalEvent.dataTransfer))
                return;

            // have to prevent default here as well to maintain the drag.
            event.preventDefault();

            // IE/Edge don't automatically set OS defaults for copy vs move so we have to do it:
            if ($.isMsft)
                event.originalEvent.dataTransfer.dropEffect = $.isDuplicate(event) ? 'copy' : 'move';

            // the above dragover handler for contained controls always fires before this one, so
            // by the time we get here we have up-to-date information on targets.
            if ((target != null) && (document.body.contains(target)))
            {
                var $target = $(target);
                var targetTop = $target.offset().top;
                var targetHeight = $target.outerHeight(true);
                var third = targetHeight / 3;
                var mouseY = event.originalEvent.clientY;

                // fall through if the group is being dragged; we don't want to allow dragging a group
                // into itself.
                if ($target.hasClass('group') && !$target.hasClass('dragging'))
                {
                    // groups require special handling.
                    var infoHeight = $target.children('.controlInfo').outerHeight(true);
                    var workspaceWrapperHeight = $target.children('.workspaceInnerWrapper').outerHeight(true);
                    if (mouseY < (targetTop + infoHeight))
                    {
                        // anywhere within the info section we'll hedge to "before".
                        $target.before($placeholder);
                    }
                    else if (mouseY > (targetTop + infoHeight + workspaceWrapperHeight))
                    {
                        // if we're past the subspace area, hedge to "after".
                        $target.after($placeholder);
                    }
                    else
                    {
                        // we're somewhere inside the subspace area, but for whatever reason we don't
                        // have a target within the group to point at. this means the drag is either
                        // off-scale low or off-scale high, or there are no controls in this group.
                        // just split the whole thing in half and use that to determine our path.
                        var $workspace = $target.find('> .workspaceInnerWrapper > .workspaceInner');
                        if (mouseY < (targetTop + infoHeight + (workspaceWrapperHeight / 2)))
                            $workspace.prepend($placeholder);
                        else
                            $workspace.append($placeholder);
                    }
                }
                else if ($target.hasClass('slave') || $target.next().hasClass('slave'))
                {
                    // if we encounter a slave block, we need to insert before or after
                    // the entire thing.
                    var $first = $target;
                    while ($first.hasClass('slave')) $first = $first.prev();
                    var $last = $target;
                    while ($last.next().hasClass('slave')) $last = $last.next();
                    var $block = $first.nextUntil($last).add($last);

                    targetTop = $first.offset().top;
                    targetHeight = _.reduce($block, function(x, elem) { return x + $(elem).outerHeight(true); }, 0);
                    third = targetHeight / 3;
                    if (mouseY < (targetTop + third))
                        // top third of block; add before.
                        $first.before($placeholder);
                    else if (mouseY < (targetTop + (2 * third)))
                    {
                        // leave placeholder where it is, unless it's nowhere, then put on closer half.
                        if ($placeholder[0].parentNode == null)
                        {
                            if (mouseY < (targetTop + (targetHeight / 2)))
                                $first.before($placeholder);
                            else
                                $last.after($placeholder);
                        }
                    }
                    else
                        // bottom third of block; add after.
                        $last.after($placeholder);
                }
                else if (mouseY < (targetTop + third))
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

            // now we may have to scroll things about depending on what browser we're in.
            // scroll behaviour adapted from: https://github.com/clint-tseng/awesomereorder
            // (tbh i think this is a nicer scrollspeed calculation than Chrome's)
            if (($.isFirefox || $.isSafari) && ($scrollParent.length !== 0))
            {
                var mouseY = event.originalEvent.clientY;
                var workspaceTop = $scrollParent.offset().top;
                var workspaceHeight = null; // gets calculated only if necessary; expensive.

                // see if we are within the upper scroll margin.
                if (mouseY < (workspaceTop + options.scrollMargin))
                {
                    setScroll();
                    var delta = workspaceTop + options.scrollMargin - mouseY; // distance from initiation point
                    scrollSpeed = -1 * options.scrollSpeed * // base speed
                        Math.min(Math.pow(delta / options.scrollMargin, options.scrollCurve), // power factor
                        1); // minimum factor
                }
                else if (mouseY > (workspaceTop + (workspaceHeight = $scrollParent.outerHeight(false)) - options.scrollMargin))
                {
                    setScroll();
                    var delta = mouseY - (workspaceTop + workspaceHeight - options.scrollMargin); // distance from initiation point
                    scrollSpeed = options.scrollSpeed * // base speed
                        Math.min(Math.pow(delta / options.scrollMargin, options.scrollCurve), // power factor
                        1); // minimum factor
                }
                else
                {
                    clearScroll();
                }
            }
        });

        // these will get lifted, so put them below drag event in their own block for organization.
        var scrollSpeed = 0;
        var scrollTimer = null;
        var setScroll = function() { if (scrollTimer == null) { scrollTimer = setInterval(scroll, 10); } };
        var scroll = function() { $scrollParent.scrollTop($scrollParent.scrollTop() + scrollSpeed); };
        var clearScroll = function()
        {
            clearInterval(scrollTimer);
            scrollTimer = null;
        };

        $this.on('dragleave', function(event)
        {
            clearScroll(); // safe to blithely call.
            $placeholder.detach();
        });

        $this.on('drop', function(event)
        {
            clearScroll(); // safe to blithely call.

            var dataTransfer = event.originalEvent.dataTransfer;
            var data = dataTransfer.getData(mimeType);
            if ($.isBlank(data)) return;

            wasDroppedHere = true;
            var parsed = JSON.parse(data);
            var controlIds = parsed.ids;
            var controlData = parsed.controls;
            var languageData = parsed.languages;

            // in only IE (but not edge) the dropEffect setting is lost between dragover
            // and drop, so we have to check and set it one last time:
            if ($.isIE)
                event.originalEvent.dataTransfer.dropEffect = $.isDuplicate(event) ? 'copy' : 'move';

            var $extant = $(_.compact(_.map(controlIds, function(id) { return document.getElementById('control' + id); })));
            // break this logic out because chrome makes it all terrible (see commit message @c1c897e).
            // don't depend on key detection when we can help it because it's less reliable.
            var isExtant = ($extant.length === controlIds.length);
            var intendsCopy = isCopyEffect(dataTransfer);

            var $added = null;
            if (isExtant && !intendsCopy)
            {
                // if our drag source is in the same document and we're supposed to move it,
                // then do so directly rather than cloning data.
                $extant.each(function()
                {
                    var $moving = $(this);
                    $moving.trigger('odkControl-removing')
                        .find('.control').trigger('odkControl-removing');
                    $moving.detach();
                    $moving.trigger('odkControl-removed')
                        .find('.control').trigger('odkControl-removed');
                    $moving.insertBefore($placeholder);
                });
                $added = $extant;
            }
            else
            {
                // if our drag source is some other document or we're supposed to copy rather
                // than move, then inflate and insert from data.
                $added = $(_.map(controlData, function(data) { return odkmaker.data.loadOne(data)[0]; }));
                $added.insertBefore($placeholder);

                // insert first so we have full control objects to work with, but now we have
                // to reconcile possible language differences across the forms.
                if (!isExtant)
                {
                    var mapping = odkmaker.i18n.reconcile(languageData);
                    var $allAdded = $added.find('.control').add($added);
                    for (var i = 0; i < $allAdded.length; i++)
                    {
                        var $control = $allAdded.eq(i);
                        var properties = $control.data('odkControl-properties');
                        var changed = false;

                        _.each(properties, function(property)
                        {
                            // find properties that would need adjustment:
                            var objs = null;
                            if (property.type === 'uiText')
                                objs = [ property.value ];
                            else if (property.type === 'optionsEditor')
                                objs = _.map(property.value, function(option) { return option.text; });
                            else
                                return; // ie continue;

                            _.each(objs, function(obj)
                            {
                                // because our keys could collide, we first save off all values to
                                // an intermediate object, and perform all deletes before all writes.
                                var oldObj = _.clone(obj);
                                var keys = _.keys(obj);
                                _.each(keys, function(fkey) { delete obj[fkey]; });
                                _.each(keys, function(fkey) { obj[mapping[fkey]] = oldObj[fkey]; });
                            });
                            changed = true;
                        });

                        if (changed === true) $control.trigger('odkControl-propertiesUpdated');
                    }
                }

                // if we're chrome, write a key to localStorage to inform the original source of the user's
                // intentions.
                if ($.isChrome && !isExtant) window.localStorage.setItem(parsed.at, intendsCopy ? 'copy' : 'move');
            }

            $added
                .bumpClass('dropped')
                .trigger('odkControl-added')
                .find('.control').trigger('odkControl-added');
            $added.eq(0).bumpClass('droppedHead');
            $added.eq($added.length - 1).bumpClass('droppedTail');

            $placeholder.detach();
            event.preventDefault();
        });

    });
};
$.fn.droppable.defaults = {
    scrollCurve: 3,
    scrollMargin: 75,
    scrollSpeed: 25,
    scrollParent: null
}

})(jQuery);

