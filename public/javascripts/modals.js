/**
 *  modals.js - magnificently moody modals
 *    Event system to ease management of modal load events.
 */

var modalsNS = odkmaker.namespace.load('odkmaker.modals');

;(function($)
{
    var handlers = {
        signinDialog: function($dialog)
        {
            $dialog
                .find(':input').val('').end()
                .find('h3').text('Sign in').end()
                .find('.signinLink').removeClass('hide').end()
                .find('.signupLink').addClass('hide').end()
                .find('.toggleSignupLink').text('Don\'t yet have an account?').closest('p').show().end().end()
                .find('.passwordLink').addClass('hide').end()
                .find('.togglePasswordLink').text('Forgot your password?').closest('p').show().end().end()
                .find('.signin_section').show().end()
                .find('.signup_section').hide();
        },
        accountDialog: function($dialog)
        {
            $dialog.find('#account_email').val(odkmaker.auth.currentUser.email);
        },
        openDialog: function($dialog)
        {
            var $list = $dialog.find('.formList');
            $list.empty();

            $dialog.find('.errorMessage').empty();
            $dialog.find('.modalLoadingOverlay').fadeIn();

            odkmaker.auth.verify(function()
            {
                $dialog.find('.modalLoadingOverlay').stop().fadeOut();

                var sortedForms = odkmaker.auth.currentUser.forms.slice(0).sort(function(a, b) {
                    return a.title.localeCompare(b.title);
                });

                _.each(sortedForms, function(formObj)
                {
                    $list.append('<li rel="' + formObj.id + '">' + $.h(formObj.title) +
                      '<a href="#delete" class="icon deleteFormLink">delete</a></li>');
                });
                if (sortedForms === 0)
                {
                    $list.append('<li class="noData">You do not appear to have saved any forms just yet.</li>');
                }
            });
        },
        saveAsDialog: function($dialog)
        {
            $dialog.find('#saveAs_name').val($('h1').text());
        },
        loadLocallyDialog: function($dialog)
        {
            $dialog.find('.errorMessage').hide();
            $dialog.find('#loadFile_name').val('');
        },
        exportDialog: function($dialog)
        {
            if ($('.workspace .control.error:first').length > 0)
                $dialog.find('.validationWarningMessage').show();
            else
                $dialog.find('.validationWarningMessage').hide();

            $dialog.find('.exportCodeContainer pre').text(odkmaker.data.serialize());
        },
        propertiesDialog: function($dialog)
        {
            $dialog.find('#propertiesName').val($('h1').text());
        },
        aggregateDialog: function($dialog)
        {
            $dialog.removeClass('exporting');
        },
        formPropertiesDialog: function($dialog)
        {
            $dialog.find('#formProperties_title')
                .attr('placeholder', $('h1').text())
                .val(odkmaker.data.getTitle());
        },
        optionsEditorDialog: odkmaker.options.modalHandler
    };

    $(function()
    {
        var stackHeight = 2999;
        $('.modal').jqm({
            onShow: function(jqm)
            {
                _.each(handlers, function(callback, key)
                {
                    if (jqm.w.hasClass(key))
                        callback(jqm.w, jqm.t);
                });
                jqm.w.fadeIn('slow');
                jqm.o.prependTo('body');
                jqm.o.fadeIn('slow');

                jqm.o.css('z-index', stackHeight++);
                jqm.w.css('z-index', stackHeight++);
            },
            onHide: function(jqm)
            {
                jqm.w.fadeOut('slow');
                jqm.o.fadeOut('slow');
                stackHeight -= 2;
            }
        }).append('<div class="modalLoadingOverlay"><div class="spinner"><div class="spinnerInner"></div></div></div>');

        $('body').on('click', 'a[rel=modal]', function(event)
        {
            event.preventDefault();
            var $this = $(this);

            // bail if the user needs auth.
            if ($this.hasClass('authRequired') && (odkmaker.auth.currentUser === null))
            {
                $('.signinDialog').jqmShow();
                return;
            }

            var go = function() { $('.modal.' + $this.attr('href').replace(/#/, '')).jqmShow(); };

            // first ask if the operation is destructive and we have changes. otherwise just go.
            if ($this.hasClass('destructive') && (odkmaker.data.clean === false))
                odkmaker.application.confirm('Are you sure? You will lose unsaved changes to the current form.', go);
            else
                go();
        });

        $('.modal form').submit(function(event)
        {
            event.preventDefault();
            $(this).closest('.modal')
                .find('.acceptLink')
                    .click();
        });
    });
})(jQuery);
