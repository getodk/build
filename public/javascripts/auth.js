/**
 *  auth.js - keeper of the grounds
 *    Basic bits to verify user login and present
 *    appropriate UI when necessary.
 */

var authNS = odkmaker.namespace.load('odkmaker.auth');

;(function($)
{
    authNS.currentUser = null;

    var signinSuccessful = function(response, status)
    {
        authNS.currentUser = response;
        $('.accountStatus')
            .empty()
            .append('Signed in as <a href="#accountDialog" rel="modal">' +
                     authNS.currentUser.display_name + '</a>.');
        $('.signinDialog')
            .find(':input')
                .val('')
                .end()
            .jqmHide();
    };

    authNS.init = function()
    {
        // Signin dialog events
        $('.signinDialog .signinLink').click(function(event)
        {
            event.preventDefault();

            $.ajax({
                url: '/login',
                dataType: 'json',
                type: 'POST',
                data: $('.signinDialog form').find(':input'),
                success: signinSuccessful,
                error: function(request, status, error)
                {
                    alert('ruh roh');
                }
            });
        });

        authNS.verify();
    };

    authNS.verify = function()
    {
        // Get current user status from server
        $.ajax({
            url: '/user',
            dataType: 'json',
            type: 'GET',
            success: signinSuccessful,
            error: function(request, status, error)
            {
                authNS.currentUser = null;
                $('.accountStatus')
                    .empty()
                    .append('Not signed in. <a href="#loginDialog" rel="modal">' +
                            'Sign in now</a>.');
                $('.signinDialog').jqmShow();
            }
        });
    };
})(jQuery);