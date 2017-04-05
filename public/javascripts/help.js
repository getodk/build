;(function($) {

var helpNS = odkmaker.namespace.load('odkmaker.help');

$(function()
{
    var $helpPane = $('.helpPane');
    var $contents = $helpPane.find('.helpPane-contents');

    var $propertiesPane = $('.propertiesPane');
    var updateHeight = function()
    {
        var height = $contents.outerHeight(true);
        $helpPane.stop(true).animate({ height: height });
        $propertiesPane.stop(true).animate({ bottom: height });
    };

    var showBasicInformation = function(information)
    {
        $helpPane.addClass('hasHelp');
        $helpPane.find('.helpItem').hide();
        $helpBasic.show();

        $helpPane.find('.helpPane-subtitle').text(information.name);
        $helpBasic.find('.helpBasic-description').html(information.description);

        var $tips = $helpBasic.find('.helpBasic-tips');
        $tips.empty();
        if (information.tips != null)
            _.each(information.tips, function(tip) { $tips.append($('<li/>').html(tip)); });

        updateHeight();
    };

    var showSection = function(title, $section)
    {
        $helpPane.addClass('hasHelp');
        $helpPane.find('.helpItem').hide();

        $helpPane.find('.helpPane-subtitle').text(title);
        $helpMulti.show();
        updateHeight();
    };

    var $helpBasic = $helpPane.find('.helpBasic');
    $('.propertiesPane').on('focus', 'input, select, a, label', function(event)
    {
        var property = $(event.target).closest('.propertyItem').data('odkProperty');
        if (property == null) return;

        showBasicInformation(property);
    });

    var $helpMulti = $helpPane.find('.helpMultiselect');
    kor.events.listen({ verb: 'control-selected', callback: function(options)
    {
        if ($('.control.selected').length === 1)
        {
            var information = $.fn.odkControl.controlInformation[options.subject.data('odkControl-type')];
            if (information == null) return;

            showBasicInformation(information);
        }
        else
            showSection('Multiple selection', $helpMulti);
    } });

    var $helpDrag = $helpPane.find('.helpDrag');
    kor.events.listen({ verb: 'control-drag-start', callback: function(options)
    {
        showSection('Dragging', $helpDrag);
    } });

    updateHeight();
});

})(jQuery);

