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
        var result = array.splice($.inArray(elem, array), 1);
        if (result != null && result.length > 0)
            return result[0];
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
})(jQuery);
