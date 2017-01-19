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
        event.preventDefault();
        odkmaker.i18n.displayLanguage($(this).attr('rel'));
        $('.workspace .control').trigger('odkControl-propertiesUpdated');
    });
    $('.header .menu .toggleCollapsed').click(function(event)
    {
        event.preventDefault();
        $('.workspace').toggleClass('collapsed');
        $('.controlFlowArrow').empty().triangle();
    });

    // wire up header actions
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

    // Show the survey popup if it exists and the user hasn't already dismissed it
    var $surveyToast = $('#surveyToast');
    if (($surveyToast.length > 0) && (localStorage.getItem('dismissedSurvey') == null))
    {
        var ticket = kor.events.listen({
            verb: 'form-load',
            callback: function()
            {
                kor.events.unlisten(ticket); // only ask once per session.
                $surveyToast
                    .animate({ bottom: '-' + ($surveyToast.outerHeight(true) - $surveyToast.height() - 20) + 'px' }, 'slow')
                    .delegate('a', 'click', function() { $surveyToast.animate({ bottom: '-15em' }, 'slow'); })
                    .delegate('#dismissSurvey', 'click', function()
                    {
                        localStorage.setItem('dismissedSurvey', 'true');
                        $.toast('Got it. We&rsquo;ve made a note not to ask you again on this computer.');
                    });
            }
        });
    }
});

