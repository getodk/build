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

    $.live = function(selector, type, callback)
    {
        var obj = $([]);
        obj.selector = selector;
        if (type && callback) {
            obj.live(type, callback);
        }
        return obj;
    };

    $.removeFromArray = function(elem, array)
    {
        array.splice($.inArray(elem, array), 1);
    };
})(jQuery);