/**
 *  data-ui.js - data's sad little sibling
 *    Manages UI for dialogs involving saving/loading
 *    forms.
 */

var dataNS = odkmaker.namespace.load('odkmaker.data');

;(function($)
{
    dataNS.currentForm = null;

    $(function()
    {
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
                        .append('<p>Could save the form. Please try again in a moment.</p>')
                        .slideDown();
                }
            });
        });
    });
})(jQuery);