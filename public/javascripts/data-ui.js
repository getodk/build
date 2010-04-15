/**
 *  data-ui.js - data's sad little sibling
 *    Manages UI for dialogs involving saving/loading
 *    forms.
 */

var dataNS = odkmaker.namespace.load('odkmaker.data');

;(function($)
{
    dataNS.currentForm = null;

    var saveFormAs = function()
    {
        var title = $('.saveAsDialog #saveAs_name').val();
        if (title === '')
            return false;

        $('.saveAsDialog .errorMessage').slideUp();

        $.ajax({
            url: '/forms',
            dataType: 'json',
            type: 'POST',
            data: { title: title, controls: odkmaker.data.extract().controls },
            success: function(response, status)
            {
                alert('yay');
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
    };

    $(function()
    {
        // modal events
        $('.saveAsDialog .saveAsLink').click(function(event)
        {
            event.preventDefault();
            saveFormAs();
        });
        $('.saveAsDialog #saveAs_name').keydown(function(event)
        {
            if (event.which == 13)
                saveFormAs();
        });
    });
})(jQuery);