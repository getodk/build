/**
 *  application.js - superglue at its finest
 *    Setting up the interface, binding toolbars, loading everything else up.
 *    Everything but the kitchen sink.
 */

var applicationNS = odkmaker.namespace.load('odkmaker.application');
var configNS = odkmaker.namespace.load('odkmaker.config');

applicationNS.newForm = function()
{
    $('.control').trigger('odkControl-removing');
    $('.control').trigger('odkControl-removed');
    $('.workspace').empty();
    $('.header h1').text('Untitled Form');
    $('#formProperties_title').val('');
    applicationNS.clearProperties();
    odkmaker.data.currentForm = null;
    odkmaker.data.clean = true;

    window.document.title = 'New Form - ODK Build';
};

applicationNS.clearProperties = function()
{
    $('.propertiesPane .propertyList')
        .empty()
        .append('<li class="emptyData">First add a question, then select it to view its properties here.</li>');
};

var childWindows = []; // prevent gc.
applicationNS.spawn = function(path)
{
    if ($.isBlank(path)) path = '';
    require('nw.gui').Window.open('public/index.html#' + encodeURIComponent(path), {
        focus: true,
        width: window.outerWidth,
        height: window.outerHeight - 20 // subtract approximate titlebar
    }, function(spawned) { childWindows.push(spawned); });
};

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
        odkmaker.data.clean = false;
    });

    // Wire up properties dialog
    $('.propertiesDialog .propertiesCommitButton').click(function(event)
    {
        event.preventDefault();
        $('h1').text($('#propertiesName').val());
    });

    // Wire up toolpane
    $('.toolPalette a').toolButton();

    // Wire up workspace dropzone
    $('.workspace').droppable({ scrollParent: '.workspaceScrollArea' });

    var loadPath = decodeURIComponent((window.location.hash || '').replace(/^#/, ''));
    if ($.isBlank(loadPath))
        // Kick off a new form by default
        applicationNS.newForm();
    else
        // We were spawned for the purpose of opening a path:
        odkmaker.file.openPath(loadPath);

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

    // No loading screen here
    $('.loadingScreen').remove();
    $('.preloadImages').remove();

    // Trigger devtools
    var lastPress = 0;
    $('body').keydown(function(event)
    {
        if (event.which == 192)
        {
            var now = (new Date()).getTime()
            if (now - lastPress < 250) { require('nw.gui').Window.get().showDevTools(); }
            lastPress = now
        }
    });

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

    // Standard question-asking modal. Provide buttons in the form of
    // an object with label: callback pairs. Specifying callback of null
    // will make that button close the dialog.
    var $askDialog = $('.askDialog');
    $askDialog.jqm({ modal: true });
    applicationNS.ask = function(message, options)
    {
        $askDialog.find('p').text(message);

        var $buttonContainer = $askDialog.find('.modalButtonContainer');
        $buttonContainer.empty();

        for (var label in options)
        {
            var $button = $('<a class="modalButton jqmClose" href="#"/>');
            $button.text(label);
            $buttonContainer.append($button);
            if (options[label] != null)
                $button.on('click', options[label]);
        }

        $askDialog.jqmShow();
    };

    applicationNS.confirm = function(message, callback)
    {
        applicationNS.ask(message, { Yes: callback, No: null });
    };

    applicationNS.confirmDestruction = function(callback)
    {
        if (odkmaker.data.clean === false)
            odkmaker.application.confirm('Are you sure? You will lose unsaved changes to the current form.', callback);
        else
            callback();
    };

    // GA tracking, if enabled.
    if ((configNS.gaToken != null) && (localStorage.getItem('suppressAnalytics') == null))
    {
        var analytics = require('universal-analytics');
        analytics(configNS.gaToken, { https: true }).pageview('/offline').send();
    }

    // check for new releases.
    var $updateToast = $('#updateToast');
    $.ajax({ type: 'get', url: 'https://api.github.com/repos/opendatakit/build/releases/latest', success: function(response)
    {
        if (response.tag_name !== configNS.version)
            $updateToast
                .find('.version').text(response.tag_name).end()
                .animate({ bottom: '-' + ($updateToast.outerHeight(true) - $updateToast.height() - 20) + 'px' }, 'slow')
                .delegate('a', 'click', function() { $updateToast.animate({ bottom: '-15em' }, 'slow'); });
    } });

    // open external links in native browser.
    $(document).on('click', 'a[target=_blank]', function()
    {
         require('nw.gui').Shell.openExternal(this.href);
         return false;
    });
});

