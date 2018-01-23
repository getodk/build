;(function($) {

var fileNS = odkmaker.namespace.load('odkmaker.file');
var fs = require('fs');
var xlsform = require('build2xlsform');

var currentPath = null;
fileNS.currentPath = function() { return currentPath; };

var filePrompt = function(save, format, callback)
{
    var inputConf = { _: 'input', type: 'file', accept: '.' + format };
    if (save === true) inputConf.nwsaveas = $.sanitizeString($('h1').text());
    var $input = $.tag(inputConf);
    $input.change(function() { callback($input.val()); });
    $input.click();
};

fileNS.open = function()
{
    filePrompt(false, 'odkbuild', function(path)
    {
        if ((odkmaker.data.currentForm == null) && (odkmaker.data.clean === true))
            // if we are an unchanged unsaved form just throw it away and open inline.
            fileNS.openPath(path);
        else
            // otherwise load the form in a new window.
            odkmaker.application.spawn(path);
    });
};

fileNS.openPath = function(path)
{
    fs.readFile(path, { encoding: 'UTF-8' }, function(err, data)
    {
        try
        {
            var form = JSON.parse(data);
        }
        catch (ex)
        {
            $.toast('There was a problem loading that file. Please check that it is accessible and valid, and try again');
            return;
        }

        odkmaker.data.currentForm = form;
        odkmaker.data.load(form);
        currentPath = path;
        fileNS.setTitle(path);
    });
};

var saveFile = function(path, contents)
{
    fs.writeFile(path, contents, { encoding: 'UTF-8' }, function(err)
    {
        if (err)
            $.toast('There was a problem saving that file: ' + err.message);
        else
            $.toast('File saved successfully.');
    });
};

fileNS.save = function(overwrite)
{
    if (overwrite && currentPath != null)
    {
        // we are saving over the currently opened extant file.
        saveFile(currentPath, JSON.stringify(odkmaker.data.extract()));
        fileNS.setTitle(path);
        odkmaker.data.clean = true;
    }
    else
    {
        filePrompt(true, 'odkbuild', function(path)
        {
            saveFile(path, JSON.stringify(odkmaker.data.extract()));

            if (currentPath == null)
            {
                // we are saving a previously-unsaved form. prompt path but use current window.
                fileNS.setTitle(path);
                odkmaker.data.clean = true;
                currentPath = path;
            }
            else
                // we are save-asing. always use a new window.
                odkmaker.application.spawn(path);
        });
    }
};

fileNS.setTitle = function(path)
{
    window.document.title = require('path').basename(path, '.odkbuild') + ' - ODK Build';
};

fileNS.export = function()
{
    filePrompt(true, 'xml', function(path)
    {
        saveFile(path, odkmaker.data.serialize());
    });
};

fileNS.exportXLS = function()
{
    filePrompt(true, 'xlsx', function(path)
    {
        xlsform.writeForm(path, xlsform.convertForm(odkmaker.data.extract()), function(err)
        {
            if (err)
            {
                $.toast('There was a problem saving that file: ' + err.message);
            }
            else
            {
                $.toast('File saved successfully.');
            }
        });
    });
};


})(jQuery);
