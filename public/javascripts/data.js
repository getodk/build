/**
 *  data.js - extractor extraordinaire
 *    Pulls out a properly structured, hierarchical tree
 *    of the control data of the form, and then massages
 *    it through a few steps to become XML output.
 */

var dataNS = odkmaker.namespace.load('odkmaker.data');

;(function($)
{
    // gets just the pure data for any one control
    var getDataRepresentation = odkmaker.data.extractOne = function($control)
    {
        var data = {};
        var properties = $control.data('odkControl-properties');
        _.each(properties, function(property, name)
        {
            data[name] = property.value;
        });
        data.metadata = properties.metadata;

        data.type = $control.data('odkControl-type');
        if (data.type == 'group')
            data.children = extractMany($control.children('.workspaceInnerWrapper').children('.workspaceInner'));

        return data;
    };

    // gets the pure data tree for any workspace DOM node
    var extractMany = function($root)
    {
        var result = [];
        $root.children('.control').each(function() { result.push(getDataRepresentation($(this))); });
        return result;
    };
    odkmaker.data.extract = function()
    {
        var htitle = odkmaker.data.getTitle();
        if ($.isBlank(htitle) || (htitle === $('h1').text())) htitle = null;

        return {
            title: $('h1').text(),
            controls: extractMany($('.workspace')),
            metadata: {
                version: odkmaker.data.currentVersion,
                activeLanguages: odkmaker.i18n.activeLanguageData(),
                optionsPresets: odkmaker.options.presets,
                htitle: htitle,
                instance_name: $('#formProperties_instanceName').val(),
                public_key: $('#formProperties_publicKey').val(),
                submission_url: $('#formProperties_submissionUrl').val()
            }
        };
    };
    odkmaker.data.getTitle = function()
    {
        var title = $('#formProperties_title').val();
        if ($.isBlank(title) && (odkmaker.data.currentForm != null)) title = odkmaker.data.currentForm.metadata.title;
        if ($.isBlank(title)) title = $('h1').text();
        return title;
    };

    var loadOne = odkmaker.data.loadOne = function(control, $parent)
    {
        var properties = null;
        if ((control.type == 'group') || (control.type == 'branch') || (control.type == 'metadata'))
            properties = $.extend(true, {}, $.fn.odkControl.controlProperties[control.type]);
        else
            properties = $.extend(true, $.extend(true, {}, $.fn.odkControl.defaultProperties),
                                        $.fn.odkControl.controlProperties[control.type]);
        _.each(properties, function(property, key)
        {
            if (key === 'metadata') return;
            property.value = control[key];
        });
        properties.metadata = control.metadata;

        var $result = $('#templates .control')
            .clone()
            .addClass(control.type)
            .odkControl(control.type, null, properties);

        if ($parent != null)
        {
            $result.appendTo($parent);
            $result.trigger('odkControl-added');
        }

        if (control.type == 'group')
            loadMany($result.find('.workspaceInner'), control.children);

        return $result;
    };

    var loadMany = function($parent, controls)
    {
        _.each(controls, function(control) { loadOne(control, $parent); });
    };
    // forms without a version are assumed to be version 0. any form at a version less than
    // the current will be upgraded. to define an upgrade, add an upgrade object to any module
    // whose keys are the number of the version to be upgraded to and values are the functions
    // that take the form data and update it to conform with that version.
    odkmaker.data.currentVersion = 2;
    odkmaker.data.load = function(formObj)
    {
        var version = formObj.metadata.version || 0;
        while (version < odkmaker.data.currentVersion)
        {
            formObj.metadata.version = ++version;
            for (var module in odkmaker)
              if ((odkmaker[module].upgrade != null) && (odkmaker[module].upgrade[version] != null))
                  odkmaker[module].upgrade[version](formObj);
        }

        $('.control').trigger('odkControl-removing');
        $('.control').trigger('odkControl-removed');
        $('.workspace').empty();
        odkmaker.application.clearProperties();

        $('h1').text(formObj.title);
        $('#formProperties_title').val(formObj.metadata.htitle)
        $('#formProperties_instanceName').val(formObj.metadata.instance_name);
        $('#formProperties_publicKey').val(formObj.metadata.public_key);
        $('#formProperties_submissionUrl').val(formObj.metadata.submission_url);
        odkmaker.i18n.setActiveLanguages(formObj.metadata.activeLanguages);
        odkmaker.options.presets = formObj.metadata.optionsPresets;
        loadMany($('.workspace'), formObj.controls);
        $('.workspace .control:first').trigger('click');

        odkmaker.data.currentForm = formObj;
        odkmaker.data.clean = true;

        kor.events.fire({ subject: formObj, verb: 'form-load' });
    };

    // massages the output JSON into a structure representing an XForm
    var controlTypes = {
        inputText: 'input',
        inputNumeric: 'input',
        inputDate: 'input',
        inputTime: 'input',
        inputLocation: 'input',
        inputMedia: 'upload',
        inputBarcode: 'input',
        inputSelectOne: 'select1',
        inputSelectMany: 'select'
    };
    var appearanceTypes = {
        'Show Map (GPS)': 'maps',
        'Manual (No GPS)': 'placement-map',
        'Minimal (spinner)': 'minimal',
        'Table': 'label',
        'Horizontal Layout': 'horizontal',
        'Vertical Slider': 'vertical',
        'Picker': 'picker'
    };
    var mediaTypes = {
         'Image': 'image/*',
         'New Image': 'image/*',
         'Selfie': 'image/*',
         'Annotate': 'image/*',
         'Draw': 'image/*',
         'Signature': 'image/*',
         'Audio': 'audio/*',
         'Video': 'video/*',
         'Selfie Video': 'video/*'
    };
    var mediaAppearances = {
         'New Image': 'new',
         'Signature': 'signature',
         'Annotate': 'annotate',
         'Draw': 'draw',
         'Selfie': 'new-front',
         'Selfie Video': 'new-front'
    };
    var addTranslation = function(obj, itextPath, translations)
    {
        _.each(translations.children, function(translation)
        {
            var result = [];
            var itext = obj[translation._languageCode];

            if (itext)
            {
                var match;
                while (match = itext.match(/\$\{[^}]+\}/))
                {
                    if (match.index > 0)
                    {
                        result.push(itext.slice(0, match.index));
                        itext = itext.slice(match.index);
                    }

                    result.push({
                        name: 'output',
                        attrs: {
                            value: itext.slice(2, match[0].length - 1)
                        }
                    });
                    itext = itext.slice(match[0].length);
                }
                if (itext.length > 0)
                    result.push(itext);

                if (result.length === 0)
                    result = obj[translation.attrs.lang];
            }

            translation.children.push({
                name: 'text',
                attrs: {
                    'id': itextPath
                },
                children: [{
                    name: 'value',
                    _noWhitespace: true,
                    children: result
                }]
            });
        })
    };
    var parseControl = function(control, xpath, instance, translations, model, body, relevance)
    {
        // first set up some defaults we need
        // relevance string
        if (relevance === undefined)
            relevance = [];
        // constraint string
        var constraint = [];

        // deal universally with successor binding.
        if (instance.context.successorRelevance != null)
        {
            relevance.push(instance.context.successorRelevance);
            delete instance.context.successorRelevance;
        }
        if ((control.other != null) && (control.other !== false))
        {
            instance.context.successorRelevance = _.map(control.other, function(value) {
                return 'selected(' + xpath + control.name + ", '" + xmlEncode(value) + "')";
            }).join(' or ');
        }

        // groups are special
        if (control.type == 'group')
        {
            var instanceTag = {
                name: control.name,
                attrs: {},
                children: [],
                context: {}
            };
            instance.children.push(instanceTag);
            var bodyTag = {
                name: 'group',
                attrs: { ref: xpath + control.name },
                children: []
            };
            body.children.push(bodyTag);

            // deal with properties:

            // label
            if ((control.label !== undefined) && (control.label !== ''))
            {
                bodyTag.children.push({
                    name: 'label',
                    attrs: {
                        'ref': "jr:itext('" + xpath + control.name + ":label')"
                    }
                });
                addTranslation(control.label, xpath + control.name + ':label', translations);
            }

            // loop
            if (control.loop === true)
            {
                instanceTag.attrs['jr:template'] = '';
                var loopBodyTag = {
                    name: 'repeat',
                    attrs: {
                        nodeset: xpath + control.name,
                    },
                    children: []
                };
                bodyTag.children.push(loopBodyTag);
                bodyTag = loopBodyTag;
            }

            // field-list
            if (control.fieldList === true)
            {
                // per #9 from jluis859, a group with both field-list and looped
                // breaks unless nested.
                if (control.loop === true)
                {
                    var innerBodyTag = { name: 'group', attrs: {}, children: [] };
                    bodyTag.children.push(innerBodyTag);
                    bodyTag = innerBodyTag;
                }

                bodyTag.attrs.appearance = 'field-list';
            }

            // relevance
            if ((control.relevance !== undefined) && (control.relevance !== ''))
            {
                relevance.push(control.relevance);

                // we need a binding to express the constraint.
                var binding = {
                    name: 'bind',
                    attrs: {
                        'nodeset': xpath + control.name,
                        'relevant': '(' + relevance.join(') and (') + ')'
                    }
                }
                model.children.push(binding);
            }

            // deal with children
            _.each(control.children, function(child)
            {
                parseControl(child, xpath + control.name + '/', instanceTag, translations, model, bodyTag, $.extend([], relevance));
            });
            return;
        }

        // metadata is special
        if (control.type == 'metadata')
        {
            // instance
            var instanceTag = {
                name: control.name
            };
            instance.children.push(instanceTag);

            // binding
            var binding = {
                name: 'bind',
                attrs: {
                    'nodeset': xpath + control.name
                }
            }

            // actions
            // see https://getodk.github.io/xforms-spec/#actions
            var eventaction = {
                name: 'odk:setgeopoint',
                attrs: {
                    'ref': xpath + control.name;
                }
            }

            // create binding based on kind
            var kind = control.kind.toLowerCase();
            if (kind == 'device id')
            {
                binding.attrs.type = 'string';
                binding.attrs['jr:preload'] = 'property';
                binding.attrs['jr:preloadParams'] = 'deviceid';
            }
            else if (kind == 'start time')
            {
                binding.attrs.type = 'dateTime';
                binding.attrs['jr:preload'] = 'timestamp';
                binding.attrs['jr:preloadParams'] = 'start';
            }
            else if (kind == 'end time')
            {
                binding.attrs.type = 'dateTime';
                binding.attrs['jr:preload'] = 'timestamp';
                binding.attrs['jr:preloadParams'] = 'end';
            }
            else if (kind == 'today')
            {
                binding.attrs.type = 'date';
                binding.attrs['jr:preload'] = 'date';
                binding.attrs['jr:preloadParams'] = 'today';
            }
            else if (kind == 'username')
            {
                binding.attrs.type = 'string';
                binding.attrs['jr:preload'] = 'property';
                binding.attrs['jr:preloadParams'] = 'username';
            }
            else if (kind == 'subscriber id')
            {
                binding.attrs.type = 'string';
                binding.attrs['jr:preload'] = 'property';
                binding.attrs['jr:preloadParams'] = 'subscriberid';
            }
            else if (kind == 'sim serial')
            {
                binding.attrs.type = 'string';
                binding.attrs['jr:preload'] = 'property';
                binding.attrs['jr:preloadParams'] = 'simserial';
            }
            else if (kind == 'phone number')
            {
                binding.attrs.type = 'string';
                binding.attrs['jr:preload'] = 'property';
                binding.attrs['jr:preloadParams'] = 'phonenumber';
            }
            else if (kind == 'start geopoint')
            {
                binding.attrs.type = 'geopoint';
            }

            model.children.push(binding);

            // actions are only added for some kinds of metadata
            if (kind == 'start geopoint')
            {
                eventaction.attrs['event'] = 'odk-instance-first-load';
                model.children.push(eventaction);
            }

            return;
        }


        var instanceTag = {
            name: control.name
        };
        instance.children.push(instanceTag);

        // control markup
        var bodyTag = {
            name: controlTypes[control.type],
            attrs: {
                'ref': xpath + control.name
            },
            children: []
        };
        body.children.push(bodyTag);

        // binding
        var binding = {
            name: 'bind',
            attrs: {
                'nodeset': xpath + control.name
            }
        }
        model.children.push(binding);

        // deal with input type:
        if (control.type == 'inputText')
            binding.attrs.type = 'string';
        else if (control.type == 'inputNumeric')
        {
            if (control.appearance == 'Textbox')
            {
                if (control.kind == 'Integer')
                    binding.attrs.type = 'int';
                else if (control.kind == 'Decimal')
                    binding.attrs.type = 'decimal';
            }
            else
            {
                // overrides extant input tag with a range tag.
                bodyTag.name = 'range';
                if (_.isObject(control.selectRange))
                {
                    bodyTag.attrs.start = control.selectRange.min;
                    bodyTag.attrs.end = control.selectRange.max;
                }
                bodyTag.attrs.step = control.selectStep;
                var step = parseFloat(control.selectStep);
                binding.attrs.type = (Math.floor(step) === step) ? 'int' : 'decimal';
            }
        }
        else if (control.type == 'inputDate')
        {
            if (control.kind == 'Full Date and Time')
                binding.attrs.type = 'dateTime';
            else
                binding.attrs.type = 'date';
        }
        else if (control.type == 'inputTime')
            binding.attrs.type = 'time';
        else if (control.type == 'inputLocation')
        {
            if ((control.kind == null) || (control.kind == 'Point'))
                binding.attrs.type = 'geopoint';
            else if (control.kind == 'Path')
                binding.attrs.type = 'geotrace';
            else if (control.kind == 'Shape')
                binding.attrs.type = 'geoshape';
        }
        else if (control.type == 'inputMedia')
            binding.attrs.type = 'binary';
        else if (control.type == 'inputBarcode')
            binding.attrs.type = 'barcode';
        else if (control.type == 'inputSelectOne')
            binding.attrs.type = 'select1';
        else if (control.type == 'inputSelectMany')
            binding.attrs.type = 'select';

        // deal with properties:

        var invalidText;

        // label
        if ((control.label !== undefined) && !_.isEmpty(control.label))
        {
            bodyTag.children.push({
                name: 'label',
                attrs: {
                    'ref': "jr:itext('" + xpath + control.name + ":label')"
                }
            });
            addTranslation(control.label, xpath + control.name + ':label', translations);
        }

        // hint
        if ((control.hint !== undefined) && !_.isEmpty(control.hint))
        {
            bodyTag.children.push({
                name: 'hint',
                attrs: {
                    'ref': "jr:itext('" + xpath + control.name + ":hint')"
                }
            });
            addTranslation(control.hint, xpath + control.name + ':hint', translations);
        }

        // default value
        if ((control.defaultValue !== undefined) && (control.defaultValue !== ''))
            instanceTag.children = [ control.defaultValue ];

        // read only
        if (control.readOnly === true)
            binding.attrs.readonly = 'true()';

        // required
        if (control.required === true)
            binding.attrs.required = 'true()';

        // required message
        if ((control.required === true) && (control.requiredText !== undefined) && !_.isEmpty(control.requiredText))
        {
            binding.attrs['jr:requiredMsg'] = "jr:itext('" + xpath + control.name + ":requiredMsg')"
            addTranslation(control.requiredText, xpath + control.name + ':requiredMsg', translations);
        }

        // text length
        if ((control.length !== undefined) && (control.length !== false))
        {
            constraint.push('regex(., "^.{' + control.length.min + ',' + control.length.max + '}$")');
            invalidText = 'Response length must be between ' + control.length.min + ' and ' + control.length.max;
        }

        // numeric/date range
        if ((control.range !== undefined) && (control.range !== false))
        {
            if (!$.isBlank(control.range.min)) {
                var min = xmlValue(control.range.min);
                if (control.type === 'inputDate') min = 'date(' + min + ')';
                constraint.push('. &gt;' + (control.range.minInclusive ? '= ' : ' ') + min);
            }
            if (!$.isBlank(control.range.max)) {
                var max = xmlValue(control.range.max);
                if (control.type === 'inputDate') max = 'date(' + max + ')';
                constraint.push('. &lt;' + (control.range.maxInclusive ? '= ' : ' ') + max);
            }

            invalidText = 'Value must be between ' + $.emptyString(control.range.min, 'anything') + ' and ' + $.emptyString(control.range.max, 'anything');
        }

        // select multiple range
        if ((control.count !== undefined) && (control.count !== false))
        {
            if (!$.isBlank(control.count.min))
                constraint.push('count-selected(.) &gt;= ' + xmlValue(control.count.min));
            if (!$.isBlank(control.count.max))
                constraint.push('count-selected(.) &lt;= ' + xmlValue(control.count.max));

            invalidText = 'Must choose between ' + $.emptyString(control.count.min, 'anything') + ' and ' + $.emptyString(control.count.max, 'anything') + ' options';
        }

        // media kind
        if (control.type == 'inputMedia') {
            bodyTag.attrs.mediatype = mediaTypes[control.kind];
            if (mediaAppearances[control.kind] != null)
                bodyTag.attrs.appearance = mediaAppearances[control.kind];
        }

        // appearance
        if (control.appearance != null)
        {
            var finalAppearance = appearanceTypes[control.appearance];
            if (finalAppearance != null)
                bodyTag.attrs.appearance = finalAppearance;
        }
        if ((control.type === 'inputDate') && ((control.kind === 'Year and Month') || (control.kind === 'Year')))
            bodyTag.attrs.appearance = (control.kind === 'Year') ? 'year' : 'month-year';
        if (control.sliderTicks === false)
            bodyTag.attrs.appearance = ((bodyTag.attrs.appearance || '') + ' no-ticks').trim();

        // options
        if (control.options !== undefined)
        {
            if ((control.cascading === true) || (instance.context.cascade != null))
            {
                // we are somewhere in a cascading select.
                if (instance.context.cascade == null)
                    instance.context.cascade = [];

                // add an instance tag for this level of the cascade.
                var instanceId = 'choices_' + $.sanitizeString(xpath.replace(/^\/data\//, '') + control.name);
                var optionsInstance = {
                    name: 'instance',
                    attrs: { id: instanceId },
                    children: [{
                        name: 'root',
                        children: _.map(control.options, function(option, i)
                        {
                            // minor warning: side effects in a map.
                            var itextPath = xpath + control.name + ':option' + i;
                            addTranslation(option.text, itextPath, translations);

                            return {
                                name: 'item',
                                children: [
                                    { name: 'itextId', children: [ itextPath ], _noWhitespace: true },
                                    { name: 'value', children: [ option.val || '' ], _noWhitespace: true }
                                ].concat(_.map(instance.context.cascade, function(name, j)
                                {
                                    return { name: name, children: [ option.cascade[j] || '' ], _noWhitespace: true };
                                }))
                            };
                        })
                    }]
                };
                model.children.push(optionsInstance);

                // calculate our filtering condition.
                var condition = _.map(instance.context.cascade, function(dataName)
                {
                    return dataName + '=' + xpath + dataName;
                }).join(' and ');
                if (condition.length > 0) condition = '[' + condition + ']';

                // add an itemset reference to our body tag.
                bodyTag.children.push({
                    name: 'itemset',
                    attrs: { nodeset: "instance('" + instanceId + "')/root/item" + condition },
                    children: [
                        { name: 'value', attrs: { ref: 'value' } },
                        { name: 'label', attrs: { ref: 'jr:itext(itextId)' } }
                    ]
                });

                // inform downstream cascades of our data name.
                instance.context.cascade.unshift(control.name);

                // remove our context object if we are at the very tail.
                if (control.cascading === false)
                    delete instance.context.cascade;
            }
            else
            {
                // normal options; drop them inline.
                _.each(control.options, function(option, i)
                {
                    var itextPath = xpath + control.name + ':option' + i;
                    addTranslation(option.text, itextPath, translations);

                    bodyTag.children.push({
                        name: 'item',
                        children: [
                            {   name: 'label',
                                attrs: {
                                    'ref': "jr:itext('" + itextPath + "')"
                                } },
                            {   name: 'value',
                                val: option.val }
                        ]
                    });
                });
            }
        }

        // advanced relevance
        if (control.relevance !== '')
            relevance.push(control.relevance);
        // advanced constraint
        if (control.constraint !== '')
            constraint.push(control.constraint);
        // advanced calculate
        if (control.calculate !== undefined && control.calculate !== '')
            binding.attrs.calculate = control.calculate;

        if (relevance.length > 0)
            binding.attrs.relevant = '(' + relevance.join(') and (') + ')';
        if (constraint.length > 0)
            binding.attrs.constraint = '(' + constraint.join(') and (') + ')';

        // constraint message
        // it's important that this goes last so that it picks up the
        // defaults set above.
        if ((control.invalidText !== undefined) && !_.isEmpty(control.invalidText))
        {
            binding.attrs['jr:constraintMsg'] = "jr:itext('" + xpath + control.name + ":constraintMsg')"
            addTranslation(control.invalidText, xpath + control.name + ':constraintMsg', translations);
        }
        else if (invalidText != null)
        {
            binding.attrs['jr:constraintMsg'] = invalidText;
        }
    };
    var internalToXForm = function(internal)
    {
        // basic structure
        // TODO: user-config of instanceHead

        // Per OpenRosa spec, instanceID should be in /data/meta
        var meta = {
            name: 'meta',
            children: [ { name: 'instanceID' } ]
        };

        var instanceHead = {
            name: 'data',
            attrs: {
              'id': $.sanitizeString($('.header h1').text()),
              'version': '' + Math.round((new Date()).getTime() / 1000)
            },
            children: [ meta ],
            context: {}
        };

        var instance = {
            name: 'instance',
            children: [ instanceHead ]
        };

        var translations = {
            name: 'itext',
            children: []
        };
        var model = {
            name: 'model',
            children: [ instance, translations ]
        };
        var body = {
            name: 'h:body',
            children: []
        };
        var root = {
            name: 'h:html',
            attrs: {
                'xmlns': 'http://www.w3.org/2002/xforms',
                'xmlns:h': 'http://www.w3.org/1999/xhtml',
                'xmlns:xsd': 'http://www.w3.org/2001/XMLSchema',
                'xmlns:jr': 'http://openrosa.org/javarosa',
                'xmlns:ev': 'http://www.w3.org/2001/xml-events',
                'xmlns:odk': 'http://www.opendatakit.org/xforms'
            },
            children: [
                {   name: 'h:head',
                    children: [
                        {   name: 'h:title',
                            val: odkmaker.data.getTitle() },
                        model
                    ] },
                body
            ]
        };

        _.each(odkmaker.i18n.activeLanguages(), function(language, code)
        {
            translations.children.push({
                name: 'translation',
                _languageCode: code,
                attrs: {
                    'lang': language
                },
                children: []
            });
        });

        // instanceID binding. nodeset path should match instanceHead
        var instanceID = {
            name: 'bind',
            attrs: {
                'nodeset': '/data/meta/instanceID',
                'type' : 'string',
                'readonly' : 'true()',
                'jr:preload' : 'uid'
            }
        }
        model.children.push(instanceID);

        if (!$.isBlank(internal.metadata.instance_name))
        {
            meta.children.push({ name: 'instanceName', _noWhitespace: true });
            model.children.push({ name: 'bind', attrs: {
              nodeset: '/data/meta/instanceName',
              type: 'string',
              calculate: internal.metadata.instance_name
            } });
        }

        if (!$.isBlank(internal.metadata.public_key) || !$.isBlank(internal.metadata.submission_url))
        {
            var submission = {
                name: 'submission',
                attrs: {
                    method: 'form-data-post'
                }
            };
            model.children.push(submission);

            if (!$.isBlank(internal.metadata.public_key))
                submission.attrs.base64RsaPublicKey = internal.metadata.public_key;

            if (!$.isBlank(internal.metadata.submission_url))
                submission.attrs.action = internal.metadata.submission_url;
        }

        _.each(internal.controls, function(control)
        {
            parseControl(control, '/data/', instanceHead, translations, model, body);
        });

        return root;
    };

    // XML serializer
    var generateIndent = function(indentLevel)
    {
        var result = '';
        for (var i = 0; i < indentLevel; i++)
            result += '  ';
        return result;
    };
    var JSONtoXML = function(obj, indentLevel)
    {
        if (indentLevel === undefined)
            indentLevel = 0;
        var result = generateIndent(indentLevel);

        if (_.isString(obj))
            return xmlEncode(result + obj) + '\n';

        result += '<' + obj.name;

        if (obj.attrs !== undefined)
            _.each(obj.attrs, function(value, key)
            {
                result += ' ' + key + '="' + xmlEncode(value) + '"';
            });

        if (obj.val !== undefined)
        {
            result += '>' + xmlEncode(obj.val) + '</' + obj.name + '>\n';
        }
        else if (obj.children !== undefined)
        {
            if (obj._noWhitespace !== true)
            {
                result += '>\n';
                _.each(obj.children, function(child)
                {
                    result += JSONtoXML(child, indentLevel + 1);
                });
                result += generateIndent(indentLevel);
            }
            else
            {
                result += '>' + _.map(obj.children, function(child) { return JSONtoXML(child, 0).slice(0, -1); }).join('');
            }
            result += '</' + obj.name + '>\n';
        }
        else
        {
            result += '/>\n';
        }

        return result;
    };
    var xmlEncode = function(value)
    {
        if (value == null)
            return '';
        else
            return value.replace(/"/g, '&quot;')
                        .replace(/&(?!(?:[a-z0-9]{1,6}|#[a-f0-9]{4});)/ig, '&amp;')
                        .replace(/</g, '&lt;')
                        .replace(/>/g, '&gt;');
    };
    var xmlValue = function(value)
    {
        if (value == null) // or undef
            return "''";
        else if (_.isString(value))
            return "'" + value + "'";
        else
            return value;
    };

    // Kick it off
    odkmaker.data.serialize = function()
    {
        return JSONtoXML(internalToXForm(odkmaker.data.extract()));
    };
})(jQuery);

