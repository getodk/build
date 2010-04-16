/**
 *  application.js - superglue at its finest
 *    Setting up the interface, binding toolbars, loading everything else up.
 *    Everything but the kitchen sink.
 */

var applicationNS = odkmaker.namespace.load('odkmaker.application');

applicationNS.newForm = function()
{
    $('.workspace').empty();
    $('.header h1').text('Untitled Form');
    $('.propertiesPane .propertylist')
        .empty()
        .append('<li class="emptyData">First add a control, then select it to view its properties here.</li>');
    odkmaker.data.currentForm = null;
};

$(function()
{
    // Wire up menu
    $('.header .menu li').dropdownMenu();

    // Wire up menu actions
    $.live('.header .menu .displayLanguages a', 'click', function(event)
    {
        odkmaker.i18n.displayLanguage($(this).attr('rel'));
        $('.workspace .control').trigger('odkControl-propertiesUpdated');
    });
    $('#editTitleLink').click(function(event)
    {
        event.preventDefault();

        var $textField = $('.header #renameFormField');
        if ($textField.is(':visible'))
        {
            $('.header h1')
                .text($textField.hide().val())
                .fadeIn();
            $(this).text('Rename');
        }
        else
        {
            $textField
                .val($('.header h1').hide().text())
                .fadeIn();
            $(this).text('Done');
        }
    });

    // Wire up toolpane
    $('.toolPalette a').toolButton();

    // Set up qTips
    $('.menu .disabled').qtip({
        content: 'Feature coming soon.',
        show: 'mouseover',
        hide: 'mouseout',
        position: { corner: { target: 'rightTop',
                              toolTip: 'leftTop' } },
        style: {
            name: 'dark',
            background: '#000000',
            border: { radius: 3, width: 3 },
            tip: 'leftMiddle' }
    });
    $('.toolPalette .disabled').qtip({
        content: 'Feature coming soon.',
        show: 'mouseover',
        hide: 'mouseout',
        position: { corner: { target: 'topMiddle',
                              toolTip: 'bottomMiddle' } },
        style: {
            name: 'dark',
            background: '#000000',
            border: { radius: 3, width: 3 },
            tip: 'bottomMiddle' }
    });

    // Kick off a new form by default
    applicationNS.newForm();

    // Toggles
    $.live('a.toggle', 'click', function(event)
    {
        event.preventDefault();
        $(this)
            .toggleClass('expanded')
            .siblings('.toggleContainer')
                .slideToggle('normal');
    });

    // External links should open in a new window
    $("a[rel$='external']").click(function()
    {
        this.target = "_blank";
    });

    // Set workspace min height
    $(window).resize(function(event)
    {
        $('.workspace').css('min-height', ($('.workspaceScrollArea').innerHeight() - 320) + 'px');
    }).resize();

    // Update loading screen status
    setTimeout(function()
    {
        $('.loadingScreen .status').text('checking who you are...');
    }, 0);
});