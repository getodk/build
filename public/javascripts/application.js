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
});