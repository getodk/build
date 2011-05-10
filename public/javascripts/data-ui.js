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
            openForm();
        });
        $openDialog.delegate('.formList li', 'dblclick', function(event)
        {
            event.preventDefault();
            openForm();
        });
        $openDialog.delegate('.formList li a.deleteFormLink', 'click', function(event)
        {
            event.preventDefault();

            if (!confirm('Are you absolutely sure you want to delete this form? This cannot be undone.'))
                return;

            $openDialog.find('.modalLoadingOverlay').fadeIn();

            var $listItem = $(this).closest('li');
            $.ajax({
                url: '/form/' + $listItem.attr('rel'),
                dataType: 'json',
                type: 'DELETE',
                success: function(response, status)
                {
                    $openDialog.find('.modalLoadingOverlay').stop().fadeOut();

                    odkmaker.auth.currentUser.forms = _.reject(odkmaker.auth.currentUser.forms, function(form)
                    {
                        form.id = $listItem.attr('rel');
                    });
                    $listItem.remove();

                    $('.openDialog .errorMessage').empty();
                },
                error: function()
                {
                    $('.openDialog .errorMessage').empty().append('<p>Something went wrong when trying to delete ' +
                        'that form. Please try again later.');
                }
            });
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
                data: JSON.stringify($.extend({}, odkmaker.data.extract(), { title: title })),
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

        var loadFileValid = false;
        var loadFileUploader = new AjaxUpload('loadFileChooseLink', {
            action: '/binary/load',
            name: 'file',
            autoSubmit: false,
            responseType: 'json',
            onChange: function(fileName, ext)
            {
                $('#loadFile_name').val(fileName);
                loadFileValid = _.isString(ext) && !!ext.match(/^odkbuild$/i);
                $('.loadLocallyDialog .errorMessage')
                    .text('You must choose an ODK Build form (.odkbuild) file!')
                    .toggle(!loadFileValid);
            },
            onSubmit: function() { return loadFileValid; },
            onComplete: function(fileName, response)
            {
                $('#loadFile_name').val('');

                // we've loaded a file, but we don't want it to be canonical
                // they'll have to save it to get it upstream.
                dataNS.currentForm = null;
                odkmaker.data.load(response);

                $.toast($.h(fileName) + ' has been loaded, but it is unsaved. Please go to ' +
                                        'File &raquo; Save if you wish to save it.');
                $('.loadLocallyDialog').jqmHide();
            }
        });
        $('.loadLocallyDialog .loadFileLink').click(function(event)
        {
            event.preventDefault();
            loadFileUploader.submit();
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

            var $form = $('<form action="/aggregate/post" method="post" target="blank" />');
            $form
                .append($('<input type="hidden" name="payload"/>').val(dataNS.serialize()))
                .append($('<input type="hidden" name="aggregate_instance_name"/>').val($('.aggregateInstanceName').val()));
            $form.appendTo($('body'));
            $form.submit();
        });
    });
})(jQuery);
