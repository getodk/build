;(function($)
{
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

    $.emptyString = function(str, prompt)
    {
        if ((str === null) || (str === undefined) || (str === ''))
            return prompt;
        else
            return str;
    };

    $.live = function(selector, type, callback)
    {
        var obj = $([]);
        obj.selector = selector;
        obj.context = document;
        if (type && callback) {
            obj.live(type, callback);
        }
        return obj;
    };

    $.removeFromArray = function(elem, array)
    {
        array.splice($.inArray(elem, array), 1);
    };

    $.toast = function(message)
    {
        var $toast = $('.toast');
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
})(jQuery);