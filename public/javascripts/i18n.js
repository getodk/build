/**
 *  i18n.js - because internationalization is just too long
 *    A simple service which keeps track of the currently specified translation
 *      sets.
 */
 
var i18nNS = odkmaker.namespace.load('odkmaker.i18n');

;(function($)
{
    var languages = { aar: 'Afar', abk: 'Abkhazian', ave: 'Avestan', afr: 'Afrikaans', aka: 'Akan', amh: 'Amharic', arg: 'Aragonese', ara: 'Arabic', asm: 'Assamese', ava: 'Avaric', aym: 'Aymara', aze: 'Azerbaijani', bak: 'Bashkir', bel: 'Belarusian', bul: 'Bulgarian', bih: 'Bihari', bis: 'Bislama', bam: 'Bambara', ben: 'Bengali', bod: 'Tibetan', bre: 'Breton', bos: 'Bosnian', cat: 'Catalan, Valencian', che: 'Chechen', cha: 'Chamorro', cos: 'Corsican', cre: 'Cree', ces: 'Czech', chu: 'Church Slavic', chv: 'Chuvash', cym: 'Welsh', dan: 'Danish', deu: 'German', div: 'Divehi', dzo: 'Dzongkha', ewe: 'Ewe', ell: 'Modern Greek', eng: 'English', epo: 'Esperanto', spa: 'Spanish', est: 'Estonian', eus: 'Basque', fas: 'Persian', ful: 'Fulah', fin: 'Finnish', fij: 'Fijian', fao: 'Faroese', fra: 'French', fry: 'Western Frisian', gle: 'Irish', gla: 'Gaelic', glg: 'Galician', grn: 'Guaraní', guj: 'Gujarati', glv: 'Manx', hau: 'Hausa', heb: 'Modern Hebrew', hin: 'Hindi', hmo: 'Hiri Motu', hrv: 'Croatian', hat: 'Haitian', hun: 'Hungarian', hye: 'Armenian', her: 'Herero', ina: 'Interlingua', ind: 'Indonesian', ile: 'Interlingue', ibo: 'Igbo', iii: 'Sichuan Yi', ipk: 'Inupiaq', ido: 'Ido', isl: 'Icelandic', ita: 'Italian', iku: 'Inuktitut', jpn: 'Japanese', jav: 'Javanese', kat: 'Georgian', kon: 'Kongo', kik: 'Kikuyu', kua: 'Kwanyama', kaz: 'Kazakh', kal: 'Kalaallisut', khm: 'Central Khmer', kan: 'Kannada', kor: 'Korean', kau: 'Kanuri', kas: 'Kashmiri', kur: 'Kurdish', kom: 'Komi', cor: 'Cornish', kir: 'Kirghiz', lat: 'Latin', ltz: 'Luxembourgish', lug: 'Ganda', lim: 'Limburgish', lin: 'Lingala', lao: 'Lao', lit: 'Lithuanian', lub: 'Luba-Katanga', lav: 'Latvian', mlg: 'Malagasy', mah: 'Marshallese', mri: 'Māori', mkd: 'Macedonian', mal: 'Malayalam', mon: 'Mongolian', mar: 'Marathi', msa: 'Malay', mlt: 'Maltese', mya: 'Burmese', nau: 'Nauru', nob: 'Norwegian Bokmål', nde: 'North Ndebele', nep: 'Nepali', ndo: 'Ndonga', nld: 'Dutch, Flemish', nno: 'Norwegian Nynorsk', nor: 'Norwegian', nbl: 'South Ndebele', nav: 'Navajo', nya: 'Chichewa', oci: 'Occitan', oji: 'Ojibwa', orm: 'Oromo', ori: 'Oriya', oss: 'Ossetian', pan: 'Panjabi', pli: 'Pāli', pol: 'Polish', pus: 'Pashto', por: 'Portuguese', que: 'Quechua', roh: 'Romansh', run: 'Rundi', ron: 'Romanian, Moldavian', rus: 'Russian', kin: 'Kinyarwanda', san: 'Sanskrit', srd: 'Sardinian', snd: 'Sindhi', sme: 'Northern Sami', sag: 'Sango', sin: 'Sinhala', slk: 'Slovak', slv: 'Slovene', smo: 'Samoan', sna: 'Shona', som: 'Somali', sqi: 'Albanian', srp: 'Serbian', ssw: 'Swati', sot: 'Southern Sotho', sun: 'Sundanese', swe: 'Swedish', swa: 'Swahili', tam: 'Tamil', tel: 'Telugu', tgk: 'Tajik', tha: 'Thai', tir: 'Tigrinya', tuk: 'Turkmen', tgl: 'Tagalog', tsn: 'Tswana', ton: 'Tonga', tur: 'Turkish', tso: 'Tsonga', tat: 'Tatar', twi: 'Twi', tah: 'Tahitian', uig: 'Uighur', ukr: 'Ukrainian', urd: 'Urdu', uzb: 'Uzbek', ven: 'Venda', vie: 'Vietnamese', vol: 'Volapük', wln: 'Walloon', wol: 'Wolof', xho: 'Xhosa', yid: 'Yiddish', yor: 'Yoruba', zha: 'Zhuang', zho: 'Chinese', zul: 'Zulu' };

    var defaultLanguages = function() { return { 0: 'English', _counter: 0, _display: '0' }; };
    var active = defaultLanguages();
    i18nNS.activeLanguages = function()
    {
        return _.omit(active, function(_, code) { return /^_/.test(code); });
    };
    i18nNS.activeLanguageData = function()
    {
        return active;
    };
    i18nNS.setActiveLanguages = function(newActive)
    {
        active = newActive || defaultLanguages();
        i18nNS.displayLanguage(active._display);
        updateMenu();
    };

    var display = '0';
    i18nNS.displayLanguage = function(value)
    {
        if (value !== undefined)
            active._display = display = value;

        return display;
    };

    i18nNS.reconcile = function(foreignLanguages)
    {
        var mappings = {};
        var hasNew = false;

        foreign: for (var fkey in foreignLanguages)
        {
            if ((fkey === '_counter') || (fkey === '_display')) continue;

            for (var akey in i18nNS.activeLanguages())
                if (foreignLanguages[fkey].trim().toLowerCase() === active[akey].trim().toLowerCase())
                {
                    mappings[fkey] = akey;
                    continue foreign;
                }

            // we didn't find anything resembling the requisite language; add it.
            hasNew = true;
            var code = (++active._counter).toString();
            active[code] = foreignLanguages[fkey];
            mappings[fkey] = code;

            // update underlying data and visible property ui
            _.each(getTranslateProperties(), function(property)
            {
                property.value[code] = '';
            });
        }

        if (hasNew === true)
        {
            updateMenu();
            $('.workspace .control.selected').trigger('odkControl-reloadProperties');
        }

        return mappings;
    };

    var createTranslationRow = function(code, name)
    {
        var result = $('<li><a href="#remove" class="removeTranslation">remove</a><input type="text" class="translationName"/></li>');
        result.data('code', code);
        result.find('input').val(name);
        return result;
    };

    var getTranslateProperties = function()
    {
        var result = [];
        $('.workspace .control').each(function()
        {
            _.each($(this).data('odkControl-properties'), function(property)
            {
                if (property.type == 'uiText')
                    result.push(property);
            });
        });
        return result;
    };

    var updateDialog = function()
    {
        var $dialog = $('.translationsDialog');
        $dialog.find('.translationNone').show();

        var $list = $dialog.find('.translationList').empty();
        _.each(i18nNS.activeLanguages(), function(language, code)
        {
            $dialog.find('.translationNone').hide();
            $list.append(createTranslationRow(code, language));
        });
    };

    var updateMenu = function()
    {
        // dump and reconstruct
        var $menu = $('.menu .displayLanguages');
        $menu.empty();

        _.each(i18nNS.activeLanguages(), function(language, code)
        {
            var item = $('<li class="radio"><a href="#" rel="' + $.h(code) + '"><span class="icon"/>' +
                $.h(language) + '</span></a></li>');
            item.toggleClass('selected', display === code);
            item.data('code', code);
            $menu.append(item);
        });
    };

    // set up translation dialog
    $(function()
    {
        $('.manageTranslations').on('click', function(event)
        {
            event.preventDefault();
            updateDialog(); 
            odkmaker.data.clean = false; // a little aggressive, but the corner case isn't worth more-complex code.
        });

        $('.translationsDialog .addTranslation').click(function(event)
        {
            event.preventDefault();

            // get selected option
            var $textbox = $('.translationsDialog .translationNewName');
            var language = $textbox.val().trim();

            // bail out if we already have this language
            if (_.any(_.values(i18nNS.activeLanguages()), function(activeLang) { return language.toLowerCase() === activeLang.toLowerCase(); }))
                return;

            var code = (++active._counter).toString();
            active[code] = language;

            // update dialog ui
            $('.translationsDialog .translationList').append(createTranslationRow(code, language));
            $textbox.val('');
            $('.translationsDialog .translationNone').hide();

            // if we have no display language use this one.
            if (active[display] == null)
            {
                display = code;
                $('.workspace .control').trigger('odkControl-propertiesUpdated');
            }

            // update active translations menu
            updateMenu();

            // update underlying data and visible property ui
            _.each(getTranslateProperties(), function(property)
            {
                property.value[code] = '';
            });
            // TODO: someday make this more efficient
            $('.workspace .control.selected').trigger('odkControl-reloadProperties');
        });

        $('.translationsDialog').on('click', '.removeTranslation', function(event)
        {
            event.preventDefault();

            var $this = $(this);
            var code = $this.closest('li').data('code');

            odkmaker.application.confirm('Are you sure you want to delete the active language ' +
                active[code] + '? All existing translations for this language will be lost!',
                function() { removeTranslation(code, $this.closest('li')); });
        });

        var removeTranslation = function(code, $line)
        {
            delete active[code];
            if (display == code)
            {
                display = _.keys(i18nNS.activeLanguages())[0];
                $('.workspace .control').trigger('odkControl-propertiesUpdated');
            }

            // update dialog and menu
            $line.remove();
            updateMenu();

            // update underlying data and visible property ui
            _.each(getTranslateProperties(), function(property)
            {
                delete property.value[code];
            });
            // TODO: someday make this more efficient
            $('.workspace .control.selected').trigger('odkControl-reloadProperties');
        };

        $('.translationsDialog').on('change', '.translationName', function(event)
        {
            var $this = $(this);
            active[$this.closest('li').data('code')] = $this.val();
            updateMenu();
            // TODO: someday make this more efficient
            $('.workspace .control.selected').trigger('odkControl-reloadProperties');
        });
    });

    i18nNS.upgrade = {
        1: function(form) {
            var activeLanguages = form.metadata.activeLanguages;
            var mappedLanguages = { _counter: 0, _display: activeLanguages[0] };
            for (var i = 0; i < activeLanguages.length; i++)
                mappedLanguages[activeLanguages[i]] = languages[activeLanguages[i]];
            form.metadata.activeLanguages = mappedLanguages;
        }
    };
})(jQuery);

