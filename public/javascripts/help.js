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

    var $helpProperty = $helpPane.find('.helpProperty');
    $('.propertiesPane').on('focus', 'input', function(event)
    {
        var $target = $(event.target);

        var property = $target.closest('.propertyItem').data('odkProperty');
        if (property == null) return;

        $helpPane.addClass('hasHelp');
        $helpPane.find('.helpItem').hide();
        $helpProperty.show();

        $helpPane.find('.helpPane-subtitle').text(property.name);
        $helpProperty.find('.helpProperty-description').html(property.description);

        var $tips = $helpProperty.find('.helpProperty-tips');
        $tips.empty();
        _.each(property.tips || [], function(tip) { $tips.append($('<li/>').html(tip)); });

        updateHeight();
    });

    updateHeight();
});

})(jQuery);

