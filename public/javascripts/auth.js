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
        $('.accountStatus')
            .empty()
            .append('Signed in as <a href="#accountDialog" rel="modal">' +
                     authNS.currentUser.display_name + '</a>. <a href="#signout" ' +
                     'class="signoutLink">Sign out</a>.')
            .fadeIn('slow');
        $('.signinDialog')
            .find(':input')
                .val('')
                .end()
            .jqmHide();
    };

    var noAuthMessage = function()
    {
        $('.accountStatus')
            .empty()
            .append('Not signed in. <a href="#signinDialog" rel="modal">' +
                    'Sign in now</a>.')
            .fadeIn('slow');
    };

    authNS.verify = function(callback)
    {
        // Get current user status from server
        $.ajax({
            url: '/user',
            dataType: 'json',
            type: 'GET',
            complete: function()
            {
                $('.loadingScreen')
                    .fadeOut('normal', function()
                    {
                        $(this).remove();
                    });
                $('.preloadImages').remove();
            },
            success: function(response, status)
            {
                authNS.currentUser = response;
                (callback || signinSuccessful)(response, status);
            },
            error: function(request, status, error)
            {
                authNS.currentUser = null;
                noAuthMessage();
                $('.signinDialog').jqmShow();
            }
        });
    };

    $(function()
    {
        // Signin dialog events
        $('.signinDialog .signinLink').click(function(event)
        {
            event.preventDefault();

            $('.signinDialog .errorMessage').slideUp();

            $.ajax({
                url: '/login',
                dataType: 'json',
                type: 'POST',
                data: $('.signinDialog form').find(':input'),
                success: function(response, status)
                {
                    authNS.currentUser = response;
                    signinSuccessful(response, status);
                },
                error: function(request, status, error)
                {
                    $('.signinDialog .errorMessage')
                        .empty()
                        .append('<p>Could not log you in with those credentials. Please try again.</p>')
                        .slideDown();
                }
            });
        });

        // Sign out link
        $.live('.signoutLink', 'click', function(event)
        {
            event.preventDefault();

            $.ajax({
                url: '/logout',
                dataType: 'json',
                type: 'GET',
                success: function(response, status)
                {
                    authNS.currentUser = null;
                    $('.accountStatus')
                        .fadeOut('slow', noAuthMessage);
                },
                error: function(request, status, error)
                {
                    alert('You could not be signed out at this time. Please try again in a moment.');
                }
            });
        });

        // Account modal events
        $('.accountDialog .updateAccountLink').click(function(event)
        {
            event.preventDefault();

            $('.accountDialog .errorMessage').slideUp();

            $.ajax({
                url: '/user/' + authNS.currentUser.username,
                dataType: 'json',
                type: 'PUT',
                data: $('.accountDialog form').find(':input'),
                success: function(response, status)
                {
                    $('.accountDialog').jqmHide();
                },
                error: function(request, status, error)
                {
                    $('.accountDialog .errorMessage')
                        .empty()
                        .append('<p>Could not update your account settings. Please try again.</p>')
                        .slideDown();
                }
            });
        });

        authNS.verify();
    });
})(jQuery);