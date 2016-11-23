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
    //if (currentPath != null) inputConf.nwworkingdir = currentPath;
    var $input = $.tag(inputConf);
    $input.change(function()
    {
        if (format == 'odkbuild') // nice hack bro
            currentPath = $input.val();
        callback($input.val());
    });
    $input.click();
};

fileNS.open = function()
{
    filePrompt(false, 'odkbuild', function(path)
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
        });
    });
};

var saveFile = function(path, contents)
{
    fs.writeFile(path, contents, { encoding: 'UTF-8'}, function(err)
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
};

fileNS.save = function(overwrite)
{
    if (overwrite && currentPath != null)
    {
        saveFile(currentPath, JSON.stringify(odkmaker.data.extract()));
    }
    else
    {
        filePrompt(true, 'odkbuild', function(path)
        {
            saveFile(currentPath, JSON.stringify(odkmaker.data.extract()));
        });
    }
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
