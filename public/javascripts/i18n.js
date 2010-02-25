/**
 *  i18n.js - because internationalization is just too long
 *    A simple service which keeps track of the currently specified translation
 *      sets.
 */
 
var i18nNS = odkmaker.namespace.load('odkmaker.i18n');

;(function($)
{
    var languages = {
      aar: 'Afar',
      abk: 'Abkhazian',
      ave: 'Avestan',
      afr: 'Afrikaans',
      aka: 'Akan',
      amh: 'Amharic',
      arg: 'Aragonese',
      ara: 'Arabic',
      asm: 'Assamese',
      ava: 'Avaric',
      aym: 'Aymara',
      aze: 'Azerbaijani',
      bak: 'Bashkir',
      bel: 'Belarusian',
      bul: 'Bulgarian',
      bih: 'Bihari',
      bis: 'Bislama',
      bam: 'Bambara',
      ben: 'Bengali',
      bod: 'Tibetan',
      bre: 'Breton',
      bos: 'Bosnian',
      cat: 'Catalan, Valencian',
      che: 'Chechen',
      cha: 'Chamorro',
      cos: 'Corsican',
      cre: 'Cree',
      ces: 'Czech',
      chu: 'Church Slavic',
      chv: 'Chuvash',
      cym: 'Welsh',
      dan: 'Danish',
      deu: 'German',
      div: 'Divehi',
      dzo: 'Dzongkha',
      ewe: 'Ewe',
      ell: 'Modern Greek',
      eng: 'English',
      epo: 'Esperanto',
      spa: 'Spanish',
      est: 'Estonian',
      eus: 'Basque',
      fas: 'Persian',
      ful: 'Fulah',
      fin: 'Finnish',
      fij: 'Fijian',
      fao: 'Faroese',
      fra: 'French',
      fry: 'Western Frisian',
      gle: 'Irish',
      gla: 'Gaelic',
      glg: 'Galician',
      grn: 'Guaraní',
      guj: 'Gujarati',
      glv: 'Manx',
      hau: 'Hausa',
      heb: 'Modern Hebrew',
      hin: 'Hindi',
      hmo: 'Hiri Motu',
      hrv: 'Croatian',
      hat: 'Haitian',
      hun: 'Hungarian',
      hye: 'Armenian',
      her: 'Herero',
      ina: 'Interlingua',
      ind: 'Indonesian',
      ile: 'Interlingue',
      ibo: 'Igbo',
      iii: 'Sichuan Yi',
      ipk: 'Inupiaq',
      ido: 'Ido',
      isl: 'Icelandic',
      ita: 'Italian',
      iku: 'Inuktitut',
      jpn: 'Japanese',
      jav: 'Javanese',
      kat: 'Georgian',
      kon: 'Kongo',
      kik: 'Kikuyu',
      kua: 'Kwanyama',
      kaz: 'Kazakh',
      kal: 'Kalaallisut',
      khm: 'Central Khmer',
      kan: 'Kannada',
      kor: 'Korean',
      kau: 'Kanuri',
      kas: 'Kashmiri',
      kur: 'Kurdish',
      kom: 'Komi',
      cor: 'Cornish',
      kir: 'Kirghiz',
      lat: 'Latin',
      ltz: 'Luxembourgish',
      lug: 'Ganda',
      lim: 'Limburgish',
      lin: 'Lingala',
      lao: 'Lao',
      lit: 'Lithuanian',
      lub: 'Luba-Katanga',
      lav: 'Latvian',
      mlg: 'Malagasy',
      mah: 'Marshallese',
      mri: 'Māori',
      mkd: 'Macedonian',
      mal: 'Malayalam',
      mon: 'Mongolian',
      mar: 'Marathi',
      msa: 'Malay',
      mlt: 'Maltese',
      mya: 'Burmese',
      nau: 'Nauru',
      nob: 'Norwegian Bokmål',
      nde: 'North Ndebele',
      nep: 'Nepali',
      ndo: 'Ndonga',
      nld: 'Dutch, Flemish',
      nno: 'Norwegian Nynorsk',
      nor: 'Norwegian',
      nbl: 'South Ndebele',
      nav: 'Navajo',
      nya: 'Chichewa',
      oci: 'Occitan',
      oji: 'Ojibwa',
      orm: 'Oromo',
      ori: 'Oriya',
      oss: 'Ossetian',
      pan: 'Panjabi',
      pli: 'Pāli',
      pol: 'Polish',
      pus: 'Pashto',
      por: 'Portuguese',
      que: 'Quechua',
      roh: 'Romansh',
      run: 'Rundi',
      ron: 'Romanian, Moldavian',
      rus: 'Russian',
      kin: 'Kinyarwanda',
      san: 'Sanskrit',
      srd: 'Sardinian',
      snd: 'Sindhi',
      sme: 'Northern Sami',
      sag: 'Sango',
      sin: 'Sinhala',
      slk: 'Slovak',
      slv: 'Slovene',
      smo: 'Samoan',
      sna: 'Shona',
      som: 'Somali',
      sqi: 'Albanian',
      srp: 'Serbian',
      ssw: 'Swati',
      sot: 'Southern Sotho',
      sun: 'Sundanese',
      swe: 'Swedish',
      swa: 'Swahili',
      tam: 'Tamil',
      tel: 'Telugu',
      tgk: 'Tajik',
      tha: 'Thai',
      tir: 'Tigrinya',
      tuk: 'Turkmen',
      tgl: 'Tagalog',
      tsn: 'Tswana',
      ton: 'Tonga',
      tur: 'Turkish',
      tso: 'Tsonga',
      tat: 'Tatar',
      twi: 'Twi',
      tah: 'Tahitian',
      uig: 'Uighur',
      ukr: 'Ukrainian',
      urd: 'Urdu',
      uzb: 'Uzbek',
      ven: 'Venda',
      vie: 'Vietnamese',
      vol: 'Volapük',
      wln: 'Walloon',
      wol: 'Wolof',
      xho: 'Xhosa',
      yid: 'Yiddish',
      yor: 'Yoruba',
      zha: 'Zhuang',
      zho: 'Chinese',
      zul: 'Zulu'
    };

    var active = ['eng'];
    i18nNS.activeLanguages = function()
    {
        return active;
    };

    var display = 'eng';
    i18nNS.displayLanguage = function(value)
    {
        if (value !== undefined)
            display = value;

        return display;
    };

    i18nNS.getFriendlyName = function(code)
    {
        return languages[code];
    };

    var createTranslationRow = function(code, name)
    {
        return $('<li class="' + code + '"><a href="#remove" class="removeTranslation">remove</a>' + name + '</li>');
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
        _.each(active, function(code)
        {
            $dialog.find('.translationNone').hide();
            $list.append(createTranslationRow(code, languages[code]));
        });

        var $select = $dialog.find('.translationSelect').empty();
        _.each(languages, function(name, code)
        {
            if ($.inArray(code, active) < 0)
                $select.append('<option value="' + code + '">' + name + '</option>');
        });
    };

    // set up translation dialog
    $(function()
    {
        $.live('.manageTranslations', 'click', function(event)
        {
            event.preventDefault();
            updateDialog(); 
        });

        $('.translationsDialog .addTranslation').click(function(event)
        {
            event.preventDefault();

            // get selected option
            var $selectedOption = $('.translationSelect :selected');
            var languageKey = $selectedOption.attr('value');
            active.push(languageKey);

            // update dialog ui
            $('.translationsDialog .translationList').append(createTranslationRow(languageKey, languages[languageKey]));
            $selectedOption.remove();
            $('.translationsDialog .translationNone').hide();

            // update active translations menu
            $('.displayLanguages').append('<li><a href="#" rel="' + languageKey + '">' + languages[languageKey] + '</a></li>');

            // update underlying data and visible property ui
            _.each(getTranslateProperties(), function(property)
            {
                property.value[languageKey] = '';
            });
            // TODO: someday make this more efficient
            $('.workspace .control.selected').trigger('odkControl-reloadProperties');
        });

        $.live('.translationsDialog .removeTranslation', 'click', function(event)
        {
            event.preventDefault();

            var $this = $(this);

            // get item to remove
            var languageKey = $this.closest('li').attr('class');

            if (!confirm('Are you sure you want to delete the active language ' + languages[languageKey] +
                         '? All existing translations for this language will be lost!'))
                return;

            $.removeFromArray(languageKey,active);
            display = active[0];

            // update dialog ui
            $('.translationSelect').append($('<option value="' + languageKey + '">' + languages[languageKey] + '</option>'));
            $this.closest('li').remove();

            // update underlying data and visible property ui
            _.each(getTranslateProperties(), function(property)
            {
                delete property.value[languageKey];
            });
            // TODO: someday make this more efficient
            $('.workspace .control.selected').trigger('odkControl-reloadProperties');
        });
    });
})(jQuery);