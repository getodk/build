/**
 *  options-editor.js - keeping everyone's options open
 *    You know, just in case. Editor and manager for select
 *    one/many lists and presets.
 */

var optionsNS = odkmaker.namespace.load('odkmaker.options');

;(function($)
{
    // until someone loads a form, we have no presets
    optionsNS.presets = [];

    // keep track of the current control and property we're editing
    optionsNS.$currentControl = null;
    optionsNS.currentProperty = null;

    // callback for when options are updated
    optionsNS.optionsUpdated = null;

    // keep track of some elems for fast access
    var $dialog = $('.optionsEditorDialog');
    var $gridArea = $('.optionsEditorDialog .optionsGridEditor');
    var $presetsSelect = $('.optionsEditorDialog .presetsSelect');

    $(function() { $gridArea.gridEditor() });

    // method to call on modal show
    optionsNS.modalHandler = function()
    {
        // set up presets
        updatePresets();

        // add lists
        populate(optionsNS.currentProperty);
    };

    // events for modal
    $dialog.find('.loadPreset').click(function(event)
    {
        event.preventDefault();

        if ($presetsSelect.is(':disabled'))
            return;

        populate(optionsNS.presets[parseInt($presetsSelect.val())].options);
    });
    $dialog.find('.deletePreset').click(function(event)
    {
        event.preventDefault();

        if ($presetsSelect.is(':disabled'))
            return;

        odkmaker.application.confirm('Are you sure you want to delete this preset? This cannot be undone.', function()
        {
            var idx = parseInt($presetsSelect.val());
            optionsNS.presets.splice(idx, 1);
            $presetsSelect.children(':nth-child(' + (idx + 1) + ')').remove();

            updatePresets();
        });
    });
    $dialog.find('.savePreset').click(function(event)
    {
        event.preventDefault();

        var name = prompt('Please name this options preset.').trim();
        if (name === '')
            return;

        optionsNS.presets.push({
            name: name,
            options: extract()
        });

        updatePresets();
    });

    // dialog events
    $dialog.find('.applyOptions').click(function(event)
    {
        event.preventDefault();

        if (_.isFunction(optionsNS.optionsUpdated))
            optionsNS.optionsUpdated(extract());

        $dialog.jqmHide();
    });

    // presetter
    var updatePresets = function()
    {
        $presetsSelect.empty();
        _.each(optionsNS.presets, function(preset, id)
        {
            $presetsSelect.append('<option value="' + id + '">' + $.h(preset.name) + '</option>');
        });

        if (_.isEmpty(optionsNS.presets))
            $presetsSelect.append('<option value="">(none created yet)</option>');
        $presetsSelect.attr('disabled', _.isEmpty(optionsNS.presets));
    };

    var populate = function(options)
    {
        var prefix = [];
        var $ptr = optionsNS.$currentControl;
        while ($ptr.hasClass('slave'))
        {
            $ptr = $ptr.prev();
            prefix.unshift($ptr.data('odkControl-properties').name.value + ' Value');
        }

        headers = prefix.concat([ 'Underlying Value' ]).concat(_.values(odkmaker.i18n.activeLanguages()));

        langCodes = _.keys(odkmaker.i18n.activeLanguages());
        data = _.map(options, function(option)
        {
            return (option.cascade || []).slice(0).reverse().concat([ option.val ].concat(_.map(langCodes, function(code) { return option.text[code]; })));
        });

        $gridArea.gridEditor_populate(headers, data);
    };

    var extract = function()
    {
        // assumes languages haven't changed. as long as this is a modal that is true:
        langCodes = _.keys(odkmaker.i18n.activeLanguages());

        var data = $gridArea.gridEditor_extract();
        numCascades = data[0].length - langCodes.length - 1;
        return _.map(data, function(row) // warning: mangles input. but the input is ephemeral.
        {
            var text = {};
            var cascade = row.splice(0, numCascades).reverse();
            _.each(langCodes, function(code, idx) { text[code] = row[idx + 1]; });
            return { val: row[0], cascade: cascade, text: text };
        });
    };

})(jQuery);

