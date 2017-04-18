;(function($)
{

    // browser detection, because standards are apparently for suckers. based on:
    // http://stackoverflow.com/questions/9847580/how-to-detect-safari-chrome-ie-firefox-and-opera-browser/9851769#9851769
    // ugh; see the commit message @c1c897e for more details.
    $.isChrome = Boolean(window.chrome) && Boolean(window.chrome.webstore);

    // and these are necessary because Firefox and Safari alone do not auto-scroll
    // near margins when dragging whilst other browsers do, and neither behaviour is
    // easily detectable without causing some artifacts.
    $.isFirefox = ((typeof InstallTrigger) !== 'undefined');
    //$.isFirefox = Boolean(window.netscape) && / rv:/i.test(navigator.userAgent); // keeping this alternative in case the above stops working.
    $.isSafari = /constructor/i.test(window.HTMLElement) || (function (p) { return p.toString() === "[object SafariRemoteNotification]"; })(!window['safari'] || safari.pushNotification);

    // and these are necessary because IE/Edge do not support full mimetype specification
    // on the dataTransfer object.
    $.isIE = (function()
    {
        'use strict';
        return (new Function("return /*@cc_on!@*/false || Boolean(document.documentMode);"))() || false;
    })();
    $.isEdge = !$.isIE && Boolean(window.StyleMedia);
    $.isMsft = $.isIE || $.isEdge;

    // OS detection, because command vs option vs ctrl are different per platform.
    // if we're not sure, assume we might be either. yes, there is linux, but detecting
    // linux is really difficult as there is no standardization.
    $.isWindows = /win/i.test(navigator.platform);
    $.isMac = /mac/i.test(navigator.platform);
    if (!($.isWindows || $.isMac))
        $.isWindows = $.isMac = true;

    // use the above OS flags to create a globally available tracking of current modifiers.
    // colloquially, selectMany = shift, selectOne = ctrl (win), cmd (mac), and duplicate = ctrl (win), option (mac).
    // don't depend on this unless you must; keychanges off-browser will not be detected and
    // can result in stuck keys.
    $.keys = { selectMany: false, selectOne: false, duplicate: false };
    $(function()
    {
        $(window).on('keydown keyup', function(event)
        {
            $.keys.selectMany = event.shiftKey;
            $.keys.selectOne = $.isSelectOne(event);
            $.keys.duplicate = $.isDuplicate(event);
        });
        $(window).on('focus', function()
        {
            // assume nothing is held on window focus. if the user is already holding a
            // key on focus it's not like we'll know anyway.
            $.keys.selectMany = $.keys.selectOne = $.keys.duplicate = false;
        });
    });
    $.isSelectOne = function(event) { return ($.isWindows && event.ctrlKey) || ($.isMac && event.metaKey); };
    $.isDuplicate = function(event) { return ($.isWindows && event.ctrlKey) || ($.isMac && event.altKey); };

    $.fn.spacingTop = function()
    {
        var $this = $(this);
        return parseInt($this.css('margin-top')) + parseInt($this.css('padding-top'));
    };

    $.displayText = function(value)
    {
        if (value === true)
            return 'yes';
        else if (value === false)
            return 'no';
        else
            return value || '&nbsp;'
    };

    $.isBlank = function(str)
    {
        return (str == null) || (str === '');
    };

    $.emptyString = function(str, prompt)
    {
        if ((str === null) || (str === undefined) || (str === ''))
            return prompt;
        else
            return str;
    };

    $.h = function(str)
    {
        if ((str === null) || (str === undefined))
            return '';
        else
            return str.replace(/</g, '&lt;')
                      .replace(/>/g, '&gt;')
                      .replace(/"/g, '&quot;')
                      .replace(/&/g, '&amp;');
    };

    String.prototype.trim = function()
    {
        return this.replace(/^\s+|\s+$/g, '');
    };

    $.sanitizeString = function(str)
    {
        return str.replace(/([^a-z0-9]+)/ig, '-');
    };

    $.removeFromArray = function(elem, array)
    {
        var idx = $.inArray(elem, array);
        if (idx >= 0)
        {
            var result = array.splice(idx, 1);
            return result[0];
        }
    };

    $.toast = function(message)
    {
        var $toast = $('#toast');
        $toast
            .empty()
            .append('<span>' + message + '</span>')
            .animate(
                { bottom: '-' + ($toast.outerHeight(true) -
                                 $toast.find('span').outerHeight(true) -
                                 20) + 'px' },
                'slow',
                function()
                {
                    setTimeout(function()
                    {
                        $toast.animate({ bottom: '-15em' }, 'slow');
                    }, 3000);
                });
    };

    $.fn.debugName = function()
    {
        var $this = $(this);
        var result = $this.get(0).tagName.toLowerCase();
        if ($this.attr('id') !== '')
            result += '#' + $this.attr('id');
        else if ($this.attr('class') !== '')
            result += '.' + $this.attr('class').split(/ +/).join('.');

        if ($this.get(0).tagName !== 'BODY')
            result = $this.parent().debugName() + ' ' + result;
        return result;
    };

    $.fn.bumpClass = function(className, interval)
    {
        var self = this;
        self.addClass(className);
        setTimeout(function() { self.removeClass(className); }, (_.isNumber(interval) ? interval : 10));
        return self;
    };

})(jQuery);

