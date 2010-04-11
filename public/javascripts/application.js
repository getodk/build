/**
 *  application.js - superglue at its finest
 *    Setting up the interface, binding toolbars, loading everything else up.
 *    Everything but the kitchen sink.
 */

var applicationNS = {};

applicationNS.newForm = function()
{
    $('.workspace').empty();
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

    // Wire up toolpane
    $('.toolPalette a').toolButton();

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

    // Init modals
    $('.modal').jqm({
        modal: true
    });
    $.live('a[rel=modal]', 'click', function(event)
    {
        event.preventDefault();
        $('.' + $(this).attr('href').replace(/#/, '')).jqmShow();
    });

    // Toolbar
    $('#exportLink').click(function(event)
    {
        event.preventDefault();
        $('.exportCodeContainer pre').text(odkmaker.data.serialize());
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

    // Init Auth
});