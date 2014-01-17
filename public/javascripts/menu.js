;(function($) {

var gui = require('nw.gui');



////////
// FILE
var fileMenu = new gui.Menu();

// file -> new
var fileNew = new gui.MenuItem({ label: 'New Form' });
fileNew.on('click', function() { $('.menu .newLink').click(); });
fileMenu.append(fileNew);

// file -> open
var fileOpen = new gui.MenuItem({ label: 'Open Form...' });
fileOpen.on('click', function() { /* TODO */ });
fileMenu.append(fileOpen);

// ---
fileMenu.append(new gui.MenuItem({ type: 'separator' }));

// file -> save
var fileSave = new gui.MenuItem({ label: 'Save Form' });
fileSave.on('click', function() { /* TODO */ });
fileMenu.append(fileSave);

// file -> save as
var fileSaveAs = new gui.MenuItem({ label: 'Save Form As...' });
fileSaveAs.on('click', function() { /* TODO */ });
fileMenu.append(fileSaveAs);

// ---
fileMenu.append(new gui.MenuItem({ type: 'separator' }));

// file -> export
var fileExport = new gui.MenuItem({ label: 'Export to XML...' });
fileExport.on('click', function() { /* TODO */ });
fileMenu.append(fileExport);



////////
// VIEW
var viewMenu = new gui.Menu();

// edit -> form properties
var viewLanguage = new gui.MenuItem({ label: 'Displayed Language' });
viewLanguage.on('click', function() { /* TODO */ });
viewMenu.append(viewLanguage);

// edit -> languages
var viewCollapse = new gui.MenuItem({ type: 'checkbox', label: 'Collapse Controls' });
viewCollapse.on('click', function() { $('.header .menu .toggleCollapsed').click(); });
viewMenu.append(viewCollapse);



////////
// SETTINGS
var settingsMenu = new gui.Menu();

// edit -> form properties
var editProperties = new gui.MenuItem({ label: 'Form Properties...' });
editProperties.on('click', function() { /* TODO */ });
settingsMenu.append(editProperties);

// edit -> languages
var editLanguages = new gui.MenuItem({ label: 'Translations...' });
editLanguages.on('click', function() { $('.manageTranslations').click(); });
settingsMenu.append(editLanguages);




var menu = new gui.Menu({ type: 'menubar' });
gui.Window.get().menu = menu;
menu.insert(new gui.MenuItem({ label: 'File', submenu: fileMenu }), 1);
menu.insert(new gui.MenuItem({ label: 'View', submenu: viewMenu }), 3);
menu.insert(new gui.MenuItem({ label: 'Settings', submenu: settingsMenu }), 4);


})(jQuery);

