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
    applicationNS.clearProperties();
    odkmaker.data.currentForm = null;
};

applicationNS.clearProperties = function()
{
    $('.propertiesPane .propertyList')
        .empty()
        .append('<li class="emptyData">First add a control, then select it to view its properties here.</li>');
};

// browser detection, because standards are apparently for suckers. based on:
// http://stackoverflow.com/questions/9847580/how-to-detect-safari-chrome-ie-firefox-and-opera-browser/9851769#9851769
// ugh; see the commit message @c1c897e for more details.
$.isChrome = Boolean(window.chrome) && Boolean(window.chrome.webstore);

// and these are necessary because Firefox and Safari alone do not auto-scroll
// near margins when dragging whilst other browsers do, and neither behaviour is
// easily detectable without causing some artifacts.
$.isFirefox = ((typeof InstallTrigger) !== 'undefined');
//$.isFirefox = Boolean(window.netscape) && / rv:/i.test(navigator.userAgent); // keeping this alternative in case the above stops working.
$.isSafari = /constructor/i.test(window.HTMLElement) || (function (p) { return p.toString() === "[object SafariRemoteNotification]"; })(!window['safari'] || safari.pushNotification);

$(function()
{
    // Wire up menu
    $('.header .menu li').dropdownMenu();

    // Wire up menu actions
    $('.header .menu .displayLanguages').on('click', 'a', function(event)
    {
        event.preventDefault();
        odkmaker.i18n.displayLanguage($(this).closest('li').data('code'));
        $('.workspace .control').trigger('odkControl-propertiesUpdated');
    });
    $('.header .menu .toggleCollapsed').click(function(event)
    {
        event.preventDefault();
        $('.workspace').toggleClass('collapsed');
    });
    $('.header .menu .toggleInformation').click(function(event)
    {
        event.preventDefault();
        $('body').toggleClass('suppressInformation');
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

    // Wire up workspace dropzone
    $('.workspace').droppable({ scrollParent: '.workspaceScrollArea' });

    // Kick off a new form by default
    applicationNS.newForm();

    // Toggles
    $('body').on('click', 'a.toggle', function(event)
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

