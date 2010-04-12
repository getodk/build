/**
 *  modals.js - magnificently moody modals
 *    Event system to ease management of modal load events.
 */

var modalsNS = odkmaker.namespace.load('odkmaker.modals');

;(function($)
{
    modalsNS.init = function()
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
                jqm.w.show();
            }
        });
        $.live('a[rel=modal]', 'click', function(event)
        {
            event.preventDefault();
            $('.' + $(this).attr('href').replace(/#/, '')).jqmShow();
        });
    };

    var handlers = {
        signinDialog: function(dialog)
        {
            dialog.find(':input').val('');
        },
        accountDialog: function(dialog)
        {
            dialog.find('#account_email').val(odkmaker.auth.currentUser.email);
        },
        exportDialog: function()
        {
            $('.exportCodeContainer pre').text(odkmaker.data.serialize());
        }
    };
})(jQuery);