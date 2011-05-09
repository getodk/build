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

    // keep track of the current property we're editing
    optionsNS.currentProperty = null;

    // callback for when options are updated
    optionsNS.optionsUpdated = null;

    // keep track of some elems for fast access
    var $dialog = $('.optionsEditorDialog');
    var $optionsBody = $('.optionsEditorDialog .optionsBody');
    var $optionsHeaderContainer = $('.optionsEditorDialog .optionsHeaderContainer');
    var $presetsSelect = $('.optionsEditorDialog .presetsSelect');

    // method to call on modal show
    optionsNS.modalHandler = function()
    {
        // set up presets
        updatePresets();

        // add lists
        populate(optionsNS.currentProperty);
    };

    // events for modal
    var checkNthRowBlank = function(n)
    {
        var clean = true;
        $optionsBody.children().each(function()
        {
            return (clean = ($(this).children(':nth-child(' + n + ')').val().trim() === ''));
        });
        return clean;
    };

    // grid events
    $dialog.find('.optionsContainer').scroll(function()
    {
        $optionsHeaderContainer.children(':first-child').css('margin-left', -1 * $(this).scrollLeft());
    });
    $optionsBody.delegate('input', 'focus', function()
    {
        var $input = $(this);
        if ($input.next().length === 0)
        {
            $optionsBody.children().each(function()
            {
                $(this).append('<input type="text"/>');
            });
        }
    });
    $optionsBody.delegate('input', 'blur', function()
    {
        var $input = $(this);
        if ($input.next().is(':last-child') && checkNthRowBlank($input.prevAll().length + 1))
        {
            $optionsBody.children().each(function()
            {
                $(this).children(':last-child').remove();
            });
        }
    });
    $optionsBody.delegate('input', 'keydown', function(event)
    {
        var $input = $(this);
        if (event.which == 13)
        {
            if (event.shiftKey)
                $input.prev().focus();
            else
                $input.next().focus();
        }
        else if (event.which == 9)
        {
            event.preventDefault();

            var $targetList;
            var idx = $input.prevAll().length + 1;
            if (event.shiftKey)
                $targetList = $input.closest('li').prev();
            else
                $targetList = $input.closest('li').next();

            if ($targetList.length === 0)
            {
                if (event.shiftKey)
                {
                    idx--;
                    $targetList = $optionsBody.children(':last-child');
                }
                else
                {
                    idx++;
                    $targetList = $optionsBody.children(':first-child');
                }
            }

            $targetList.children(':nth-child(' + idx + ')').focus();
        }
    });

    // presets events
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

        if (confirm('Are you sure you want to delete this preset? This cannot be undone.'))
        {
            var idx = parseInt($presetsSelect.val());
            optionsNS.presets.splice(idx, 1);
            $presetsSelect.children(':nth-child(' + (idx + 1) + ')').remove();

            updatePresets();
        }
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

    // injector
    var populate = function(source)
    {
        // get languages
        var languages = [{ id: 'value', name: 'Underlying Value'}].concat(
            _.map(odkmaker.i18n.activeLanguages(), function(lang)
            {
                return { id: lang, name: odkmaker.i18n.getFriendlyName(lang) };
            }));

        // update ui
        var width = languages.length * 150;
        $dialog.find('.optionsHeader, .optionsBody').empty();
        _.each(languages, function(lang)
        {
            $dialog.find('.optionsHeader').width(width)
                                          .append('<li>' + lang.name + '</li>');

            var langOptions;
            if (lang.id == 'value')
                langOptions = _.pluck(source, 'val');
            else
                langOptions = _.map(source, function(property) { return property.text[lang.id] || ''; });
            langOptions.push(''); // add an empty row at the end

            var $listItem = $('<li data-lang="' + lang.id + '"/>');
            _.each(langOptions, function(langOption)
            {
                $listItem.append('<input type="text" value="' + $.h(langOption) + '"/>');
            });
            $dialog.find('.optionsBody').width(width)
                                        .append($listItem);
        });
    };

    // extractor
    var extract = function()
    {
        var result = [];
        _($optionsBody.children(':first-child').children().length).times(function()
        {
            result.push({ text: {} });
        });

        $optionsBody.children().each(function()
        {
            var $listItem = $(this);
            var lang = $listItem.attr('data-lang');

            $listItem.children().each(function(i)
            {
                if (lang == 'value')
                    result[i].val = $(this).val().trim();
                else
                    result[i].text[lang] = $(this).val().trim();
            });
        });

        // filter out blank options before returning
        return _.reject(result, function(option)
        {
            return (option.val === '') && _.all(option.text, function(val) { return val === ''; });
        });
    };
})(jQuery);

