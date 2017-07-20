;(function($){

var checkNthRowBlank = function($body, n)
{
    return _.all($body.children(), function(child)
    {
        return $(child).children(':nth-child(' + n + ')').val().trim() === '';
    });
};

$.fn.gridEditor = function()
{
    this.each(function()
    {
        var $this = $(this);

        $this.append($('#templates > .gridEditor').clone());
        var $header = $this.find('.gridHeader');
        var $body = $this.find('.gridBody');

        // header tracks horiz scrolling.
        $this.scroll(function() { $header.css('margin-left', -1 * $this.scrollLeft()); });

        // keyboard navigation.
        $body.delegate('input', 'keydown', function(event)
        {
            var $input = $(this);
            if (event.which == 13)
            {
                if (event.shiftKey)
                    $input.prev().focus();
                else
                    $input.next().focus();
            }
            else if (event.which == 9)
            {
                event.preventDefault();

                var $targetList;
                var idx = $input.prevAll().length + 1;
                if (event.shiftKey)
                    $targetList = $input.closest('li').prev();
                else
                    $targetList = $input.closest('li').next();

                if ($targetList.length === 0)
                {
                    if (event.shiftKey)
                    {
                        idx--;
                        $targetList = $body.children(':last-child');
                    }
                    else
                    {
                        idx++;
                        $targetList = $body.children(':first-child');
                    }
                }

                $targetList.children(':nth-child(' + idx + ')').focus();
            }
        });

        // add a new final row if the current one is focused.
        $body.delegate('input', 'focus', function()
        {
            var $input = $(this);
            if ($input.next().length === 0)
                $body.children().each(function() { $(this).append('<input type="text"/>'); });
        });
        // remove the final row if it is extraneous.
        $body.delegate('input', 'blur', function()
        {
            var $input = $(this);
            if ($input.next().is(':last-child') && checkNthRowBlank($body, $input.prevAll().length + 1))
                $body.children().each(function() { $(this).children(':last-child').remove(); });
        });
    });
};

$.fn.gridEditor_populate = function(headers, data)
{
    var $header = this.find('.gridHeader');
    var $body = this.find('.gridBody');
    $both = $header.add($body);
    $both.empty().width(data[0].length * 150);

    _.each(headers, function(header, idx)
    {
        $header.append('<li>' + $.h(header) + '</li>');

        var $column = $('<li/>');
        _.each(data, function(row) { $column.append('<input type="text" value="' + $.h(row[idx]) + '"/>'); });
        $column.append('<input type="text"/>');
        $body.append($column);
    });
};
$.fn.gridEditor_extract = function()
{
    var $body = this.find('.gridBody');
    var result = [];
    _($body.children(':first-child').children().length).times(function()
    {
        result.push([]);
    });

    $body.children().each(function()
    {
        console.log(this);
        $(this).children().each(function(idx) { result[idx].push($(this).val()); });
    });
    result.pop(); // drop blank row.

    return result;
};

})(jQuery);

