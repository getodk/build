;(function($) {

var gui = nw;
var os = require('os');


////////
// FILE
var fileMenu = new gui.Menu();

// file -> new
var fileNew = new gui.MenuItem({ label: 'New Form' });
fileNew.on('click', function() { odkmaker.application.spawn(); });
fileMenu.append(fileNew);

// file -> open
var fileOpen = new gui.MenuItem({ label: 'Open Form...' });
fileOpen.on('click', function() { odkmaker.file.open(); });
fileMenu.append(fileOpen);

// ---
fileMenu.append(new gui.MenuItem({ type: 'separator' }));

// file -> save
var fileSave = new gui.MenuItem({ label: 'Save Form' });
fileSave.on('click', function() { odkmaker.file.save(true); });
fileMenu.append(fileSave);

// file -> save as
var fileSaveAs = new gui.MenuItem({ label: 'Save Form As...' });
fileSaveAs.on('click', function() { odkmaker.file.save(false); });
fileMenu.append(fileSaveAs);

// ---
fileMenu.append(new gui.MenuItem({ type: 'separator' }));

// file -> export
var fileExport = new gui.MenuItem({ label: 'Export to XML...' });
fileExport.on('click', function() { odkmaker.file.export(); });
fileMenu.append(fileExport);

// file -> export xlsform
var xlsfileExport = new gui.MenuItem({ label: 'Export to XLSForm...' });
xlsfileExport.on('click', function() { odkmaker.file.exportXLS(); });
fileMenu.append(xlsfileExport);

// ---
fileMenu.append(new gui.MenuItem({ type: 'separator' }));

// file -> upload to aggregate
var aggregateUpload = new gui.MenuItem({ label: 'Upload to Aggregate...' });
aggregateUpload.on('click', function() { $('.menu #aggregateLink').click(); });
fileMenu.append(aggregateUpload);


/////////////////////
// VIEW -> LANGUAGES
var languageMenu = new gui.Menu();
var languageItems = {};
var updateLanguages = function()
{
    var currentLanguages = odkmaker.i18n.activeLanguages();

    _.each(currentLanguages, function(language, code)
    {
        if (!languageItems[code])
        {
            var item = new gui.MenuItem({ type: 'checkbox', label: language });
            item.on('click', function()
            {
                _.each(languageItems, function(item) { item.checked = false; });
                item.checked = true;

                odkmaker.i18n.displayLanguage(code);
                $('.workspace .control').trigger('odkControl-propertiesUpdated');
            });
            if (odkmaker.i18n.displayLanguage() === code)
                item.checked = true;

            languageItems[code] = item;
            languageMenu.append(item);
        }
    });

    _.each(languageItems, function(item, code)
    {
        if (currentLanguages[code] == null)
        {
            languageMenu.remove(languageItems[code]);
            delete languageItems[code];
        }
    });
};
updateLanguages();
$('body').bind('odk-activeLanguagesChanged', updateLanguages);



////////
// VIEW
var viewMenu = new gui.Menu();

// view -> form properties
var viewLanguage = new gui.MenuItem({ label: 'Displayed Language', submenu: languageMenu });
viewLanguage.on('click', function() { /* nothing */ });
viewMenu.append(viewLanguage);

// view -> languages
var viewCollapse = new gui.MenuItem({ type: 'checkbox', label: 'Collapse Controls' });
viewCollapse.on('click', function() { $('.header .menu .toggleCollapsed').click(); });
viewMenu.append(viewCollapse);



////////
// SETTINGS
var settingsMenu = new gui.Menu();

// edit -> form properties
/*var editProperties = new gui.MenuItem({ label: 'Form Properties...' });
editProperties.on('click', function() { $('.menu #propertiesLink').click(); });
settingsMenu.append(editProperties);*/

// edit -> languages
var editLanguages = new gui.MenuItem({ label: 'Translations...' });
editLanguages.on('click', function() { $('.manageTranslations').click(); });
settingsMenu.append(editLanguages);




var menu = new gui.Menu({ type: 'menubar' });

if (os.platform() == 'darwin')
{
    menu.createMacBuiltin('ODK Build')
    gui.Window.get().menu = menu;
    menu.insert(new gui.MenuItem({ label: 'File', submenu: fileMenu }), 1);
    menu.insert(new gui.MenuItem({ label: 'View', submenu: viewMenu }), 3);
    menu.insert(new gui.MenuItem({ label: 'Settings', submenu: settingsMenu }), 4);
}
else
{
    menu.append(new gui.MenuItem({ label: 'File', submenu: fileMenu }));
    menu.append(new gui.MenuItem({ label: 'View', submenu: viewMenu }));
    menu.append(new gui.MenuItem({ label: 'Settings', submenu: settingsMenu }));
    gui.Window.get().menu = menu;
}


})(jQuery);

