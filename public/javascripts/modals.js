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
            $dialog.find(':input').val('');
        },
        accountDialog: function($dialog)
        {
            $dialog.find('#account_email').val(odkmaker.auth.currentUser.email);
        },
        openDialog: function($dialog)
        {
            var $list = $dialog.find('.formList');
            $list.empty();

            // TODO: do we want to update this array when
            //       this list is opened? Probably.
            _.each(odkmaker.auth.currentUser.forms, function(formObj)
            {
                $list.append('<li rel="' + formObj.id + '">' + formObj.title + '</li>');
            });
            if (odkmaker.auth.currentUser.forms.length === 0)
            {
                $list.append('<li class="noData">You do not appear to have saved any forms just yet.</li>');
            }
        },
        exportDialog: function($dialog)
        {
            $dialog.find('.exportCodeContainer pre').text(odkmaker.data.serialize());
        }
    };

    $(function()
    {
        $('.modal').jqm({
            modal: true,
            onShow: function(jqm)
            {
                _.each(handlers, function(callback, key)
                {
                    if (jqm.w.hasClass(key))
                        callback(jqm.w, jqm.t);
                });
                jqm.w.fadeIn('slow');
                jqm.o.fadeIn('slow');
            },
            onHide: function(jqm)
            {
                jqm.w.fadeOut('slow');
                jqm.o.fadeOut('slow');
            }
        });
        $.live('a[rel=modal]', 'click', function(event)
        {
            event.preventDefault();
            $('.' + $(this).attr('href').replace(/#/, '')).jqmShow();
        });
    });
})(jQuery);