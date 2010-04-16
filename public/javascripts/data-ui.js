/**
 *  data-ui.js - data's sad little sibling
 *    Manages UI for dialogs involving saving/loading
 *    forms.
 */

var dataNS = odkmaker.namespace.load('odkmaker.data');

;(function($)
{
    dataNS.currentForm = null;

    var openForm = function()
    {
        $.ajax({
            url: '/form/' + $('.openDialog .formList li.selected').attr('rel'),
            dataType: 'json',
            type: 'GET',
            success: function(response, status)
            {
                dataNS.currentForm = response;
                odkmaker.data.load(response);
                $('.openDialog').jqmHide();
            },
            error: function(request, status, error)
            {
                $('.openDialog .errorMessage')
                    .empty()
                    .append('<p>Could not open the form. Please try again in a moment.</p>')
                    .slideDown();
            }
        });
    };

    $(function()
    {
        // menu events
        $('.menu .saveLink').click(function(event)
        {
            event.preventDefault();

            if (odkmaker.auth.currentUser === null)
            {
                $('.signinDialog').jqmShow();
                return;
            }
            if (odkmaker.data.currentForm === null)
            {
                $('.saveAsDialog').jqmShow();
                return;
            }

            $.ajax({
                url: '/form/' + odkmaker.data.currentForm.id,
                contentType: 'application/json',
                dataType: 'json',
                type: 'PUT',
                data: JSON.stringify(odkmaker.data.extract()),
                success: function(response, status)
                {
                    dataNS.currentForm = response;
                },
                error: function(request, status, error)
                {
                    alert('oh no!');
                }
            });
        });

        // modal events
        $.live('.openDialog .formList li', 'click', function(event)
        {
            event.preventDefault();

            var $this = $(this);
            $this.siblings('li').removeClass('selected');
            $this.addClass('selected');
        });
        $('.openDialog .openLink').click(function(event)
        {
            event.preventDefault();
            openForm();
        });
        $.live('.openDialog .formList li', 'dblclick', function(event)
        {
            event.preventDefault();
            openForm();
        });

        $('.saveAsDialog .saveAsLink').click(function(event)
        {
            event.preventDefault();
            var title = $('.saveAsDialog #saveAs_name').val();
            if (title === '')
                return false;

            $('.saveAsDialog .errorMessage').slideUp();

            $.ajax({
                url: '/forms',
                contentType: 'application/json',
                dataType: 'json',
                type: 'POST',
                data: JSON.stringify({
                    title: title,
                    controls: odkmaker.data.extract().controls
                }),
                success: function(response, status)
                {
                    alert('yay');
                    dataNS.currentForm = response;
                    $('.saveAsDialog').jqmHide();
                },
                error: function(request, status, error)
                {
                    $('.saveAsDialog .errorMessage')
                        .empty()
                        .append('<p>Could not save the form. Please try again in a moment.</p>')
                        .slideDown();
                }
            });
        });
    });
})(jQuery);