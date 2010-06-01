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
        $('.menu .newLink').click(function(event)
        {
            event.preventDefault();
            if (confirm('Are you sure? You will lose unsaved changes to the current form.'))
                odkmaker.application.newForm();
        });
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
                    $.toast('Form saved!');
                },
                error: function(request, status, error)
                {
                    $.toast('Your form could not be successfully saved at this time. Please try again in a moment.');
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
                    $.toast('Your form has been saved as "' + title + '".');
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

        $('.exportDialog .downloadLink').click(function(event)
        {
            event.preventDefault();

            var $form = $('<form action="/download" method="post" target="downloadFrame" />');
            $form
                .append($('<input type="hidden" name="payload"/>').val(dataNS.serialize()))
                .append($('<input type="hidden" name="filename"/>').val($('h1').text() + '.xml'));
            $form.appendTo($('body'));
            $form.submit();
        });
    });
})(jQuery);
