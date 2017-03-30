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
        $helpPane.animate({ height: height });
        $propertiesPane.animate({ bottom: height });
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

        _.defer(updateHeight);
    };

    var $helpBasic = $helpPane.find('.helpBasic');
    $('.propertiesPane').on('focus', 'input, select, a, label', function(event)
    {
        var property = $(event.target).closest('.propertyItem').data('odkProperty');
        if (property == null) return;

        showBasicInformation(property);
    });

    kor.events.listen({ verb: 'control-selected', callback: function(options)
    {
        var information = $.fn.odkControl.controlInformation[options.object.type];
        if (information == null) return;

        showBasicInformation(information);
    } });

    updateHeight();
});

})(jQuery);

