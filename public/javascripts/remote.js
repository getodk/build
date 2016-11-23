;(function($) {

var remoteNS = odkmaker.namespace.load('odkmaker.remove');
var withCredentials = require('request-digest');

// clone the export button and drop in our own, to nullify the existing event handler.
var aggregateButton = $('.aggregateDialog .aggregateExportButton');
var ourButton = $('<a class="modalButton" href="#export">Export</a>');
aggregateButton.replaceWith(ourButton);
ourButton.click(function()
{
    event.preventDefault();
    event.stopPropagation();

    var $loading = $('.aggregateDialog .modalLoadingOverlay');
    var target = $('.aggregateInstanceName').val();
    $loading.show();

    withCredentials($('#aggregateUser').val(), $('#aggregatePassword').val()).request({
        host: 'https://' + target + '.appspot.com',
        port: 443,
        path: '/formUpload',
        method: 'POST',
        headers: {
            'X-OpenRosa-Version': '1.0',
            'Date': (new Date()).toUTCString()
        },
        formData: {
            form_name: $('h1').text(),
            form_def_file: {
                value: odkmaker.data.serialize(),
                options: {
                    filename: 'form.xml',
                    contentType: 'application/xml'
                }
            }
        }
    }, function (error, response, body)
    {
        $loading.hide();
        if (error != null)
        {
            var message = '<p>Could not upload the form. Please check your internet connection, and try again.</p>';
            if (error.statusCode == 401)
            {
                message = '<p>Could not upload the form due to an authentication problem. Please check your credentials and instance name, and try again.</p>';
            }
            else if (error.statusCode == 400)
            {
                message = '<p>Could not upload the form. Aggregate could not validate the form contents. Please make sure your form is valid and try again.</p>';
            }
            $('.aggregateDialog .errorMessage')
                .empty()
                .append(message)
                .slideDown();
        }
        else if (response.statusCode == 201)
        {
            $.toast('Your form has been successfully uploaded to ' + $.h(target) + '.');
            $('.aggregateDialog').jqmHide();
        }
    });
});

})(jQuery);

