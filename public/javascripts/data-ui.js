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
        $('.openDialog .modalLoadingOverlay').fadeIn();
        $.ajax({
            url: '/form/' + $('.openDialog .formList li.selected').attr('rel'),
            dataType: 'json',
            type: 'GET',
            success: function(response, status)
            {
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
            if (dataNS.clean)
                odkmaker.application.newForm();
            else
                odkmaker.application.confirm('Are you sure? You will lose unsaved changes to the current form.', odkmaker.application.newForm);
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
                    dataNS.clean = true;
                    $.toast('Form saved!');
                },
                error: function(request, status, error)
                {
                    $.toast('Your form could not be successfully saved at this time. Please try again in a moment.');
                }
            });
        });
        $('.header .menu .saveLocallyLink').click(function(event)
        {
            event.preventDefault();

            var $form = $('<form action="/binary/save" method="post" target="downloadFrame" />');
            $form
                .append($('<input type="hidden" name="payload"/>').val(JSON.stringify(odkmaker.data.extract())))
                .append($('<input type="hidden" name="filename"/>').val($('h1').text() + '.odkbuild'));
            $form.appendTo($('body'));
            $form.submit();
        });
        $('.header .menu #xlsformLink').click(function(event)
        {
          event.preventDefault();

          var xhttp = new XMLHttpRequest();
          xhttp.onreadystatechange = function()
          {
            if ((xhttp.readyState === 4) && (xhttp.status >= 400))
              $.toast('Something went wrong while exporting. Please try again later.');
            if ((xhttp.readyState !== 4) || (xhttp.status !== 200)) return;

            // take the binary response, create a blob-reference link out of it, and click on it to trigger dl.
            var a = document.createElement('a');
            a.href = window.URL.createObjectURL(xhttp.response);
            a.download = $.sanitizeString($('h1').text()) + '-export.xlsx';
            a.style.display = 'none';

            document.body.appendChild(a);
            a.click();
          };

          // actually send off the form data.
          xhttp.open('POST', '/convert');
          xhttp.setRequestHeader('Content-Type', 'application/json');
          xhttp.responseType = 'blob';
          xhttp.send(JSON.stringify(odkmaker.data.extract()));
        });

        // cleanliness tracking events
        dataNS.clean = true;
        $('.workspace').on('odkControl-added odkControl-removed', function() { dataNS.clean = false; });
        kor.events.listen({ verb: 'properties-updated', callback: function() { dataNS.clean = false; } });

        // modal events
        var $openDialog = $('.openDialog');
        $openDialog.delegate('.formList li', 'click', function(event)
        {
            event.preventDefault();

            var $this = $(this);
            $this.siblings('li').removeClass('selected');
            $this.addClass('selected');
        });
        $openDialog.find('.openLink').click(function(event)
        {
            event.preventDefault();
            odkmaker.application.confirmDestruction(openForm);

        });
        $openDialog.delegate('.formList li', 'dblclick', function(event)
        {
            event.preventDefault();
            openForm();
        });
        $openDialog.delegate('.formList li a.deleteFormLink', 'click', function(event)
        {
            event.preventDefault();

            var id = $(this).closest('li').attr('rel');
            odkmaker.application.confirm('Are you absolutely sure you want to delete this form? This cannot be undone.', function() { deleteForm(id); });
        });

        var deleteForm = function(id)
        {
            $openDialog.find('.modalLoadingOverlay').fadeIn();

            $.ajax({
                url: '/form/' + id,
                dataType: 'json',
                type: 'DELETE',
                success: function(response, status)
                {
                    odkmaker.auth.currentUser.forms = _.reject(odkmaker.auth.currentUser.forms, function(form)
                    {
                        return form.id === id;
                    });
                    $openDialog.find('[rel=' + id + ']').remove();

                    $('.openDialog .errorMessage').empty();
                },
                error: function()
                {
                    $('.openDialog .errorMessage').empty().append('<p>Something went wrong when trying to delete ' +
                        'that form. Please try again later.');
                },
                complete: function()
                {
                    $openDialog.find('.modalLoadingOverlay').fadeOut();
                }
            });
        };

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
                data: JSON.stringify($.extend({}, odkmaker.data.extract(), { title: title })),
                success: function(response, status)
                {
                    $.toast('Your form has been saved as "' + title + '".');
                    dataNS.currentForm = response;
                    dataNS.clean = true;
                    $('h1').text(title);
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

        $('.aggregateDialog .aggregateExportButton').click(function(event)
        {
            event.preventDefault();

            var $loading = $('.aggregateDialog .modalLoadingOverlay');
            var protocol = $('.aggregateInstanceProtocol').val();
            var target = $('.aggregateInstanceName').val();
            $loading.show();
            $('.aggregateDialog .errorMessage').empty().hide();

            $.ajax({
                url: '/aggregate/post',
                dataType: 'json',
                type: 'POST',
                data: { protocol: protocol, target: target, credentials: { user: $('#aggregateUser').val(), password: $('#aggregatePassword').val() }, name: $('h1').text(), payload: odkmaker.data.serialize() },
                success: function(response, status)
                {
                    $.toast('Your form has been successfully uploaded to ' + $.h(target) + '.');
                    $('.aggregateDialog').jqmHide();
                },
                error: function(xhr, status, error)
                {
                    var errorBody = $.parseJSON(xhr.responseText);
                    var message;
                    if (errorBody.code == '400')
                        message = '<p>Could not upload the form. Aggregate could not validate the form contents. Please make sure your form is valid and try again.</p>';
                    else if (errorBody.code == '404')
                        message = '<p>Could not upload the form, because we could not find the Aggregate server you specified. Please check the address and try again.</p>';
                    else if (errorBody.code == 'ECONNREFUSED')
                        message = '<p>Could not upload the form. We found the server you specified, but it does not appear to be a valid, functioning Aggregate server. Please check the address and the server, and try again.</p>';
                    else
                        message = '<p>Could not upload the form. Please check your credentials and instance name, and try again.</p>';

                    $('.aggregateDialog .errorMessage')
                        .empty()
                        .append(message)
                        .slideDown();
                },
                complete: function() { $loading.hide(); }
            });
        });

        $('.formPropertiesDialog .jqmClose').on('click', function()
        {
            // this codebase is really starting to wear. we have to clear out this field
            // if it is identical to the main title so it doesn't get picked up.
            var $input = $('#formProperties_title');
            if ($input.val() === $('h1').text()) $input.val('');
        });
    });
})(jQuery);
