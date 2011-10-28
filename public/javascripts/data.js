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
    var getDataRepresentation = function($control)
    {
        var data = {};
        _.each($control.data('odkControl-properties'), function(property, name)
        {
            data[name] = property.value;
        });
        data.type = $control.data('odkControl-type');
        return data;
    };

    // gets the pure data tree for any workspace DOM node
    var extractRecurse = function($root)
    {
        var result = [];
        $root.children('.control').each(function()
        {
            var $this = $(this);

            var data = getDataRepresentation($this);

            if (data.type == 'group')
            {
                data.children = extractRecurse($this.children('.workspaceInnerWrapper').children('.workspaceInner'));
            }
            else if (data.type == 'branch')
            {
                data.branches = [];
                $this.find('.workspaceInner').each(function()
                {
                    var branch = {};
                    branch.conditions = $(this).data('odkmaker-branchConditions');
                    branch.children = extractRecurse($(this));
                    data.branches.push(branch);
                });
            }

            result.push(data);
        });
        return result;
    };
    odkmaker.data.extract = function()
    {
        return {
            title: $('h1').text(),
            controls: extractRecurse($('.workspace')),
            metadata: {
                activeLanguages: odkmaker.i18n.activeLanguages(),
                optionsPresets: odkmaker.options.presets
            }
        };
    };

    var loadRecurse = function($root, controls)
    {
        _.each(controls, function(control)
        {
            var properties = null;
            if ((control.type == 'group') || (control.type == 'branch'))
                properties = $.extend(true, {}, $.fn.odkControl.controlProperties[control.type]);
            else
                properties = $.extend(true, $.extend(true, {}, $.fn.odkControl.defaultProperties),
                                            $.fn.odkControl.controlProperties[control.type]);
            _.each(properties, function(property, key)
            {
                property.value = control[key];
            });

            var $control = $('#templates .control')
                               .clone()
                               .addClass(control.type)
                               .odkControl(control.type, null, properties)
                               .appendTo($root);

            if (control.type == 'group')
                loadRecurse($control.find('.workspaceInner'), control.children);
        });
    };
    odkmaker.data.load = function(formObj)
    {
        $('h1').text(formObj.title);
        $('.workspace').empty();
        odkmaker.i18n.setActiveLanguages(formObj.metadata.activeLanguages);
        odkmaker.options.presets = formObj.metadata.optionsPresets;
        loadRecurse($('.workspace'), formObj.controls);
        $('.workspace .control:first').trigger('odkControl-select');
    };

    // massages the output JSON into a structure representing an XForm
    var controlTypes = {
        inputText: 'input',
        inputNumeric: 'input',
        inputDate: 'input',
        inputLocation: 'input',
        inputMedia: 'upload',
        inputBarcode: 'input',
        inputSelectOne: 'select1',
        inputSelectMany: 'select'
    };
    var addTranslation = function(obj, itextPath, translations)
    {
        _.each(translations.children, function(translation)
        {
            translation.children.push({
                name: 'text',
                attrs: {
                    'id': itextPath
                },
                children: [
                    { name: 'value',
                      val: obj[translation.attrs.lang] }
                ]
            });
        })
    };
    var parseControl = function(control, xpath, instance, translations, model, body, relevance)
    {
        // groups are special
        if (control.type == 'group')
        {
            var instanceTag = {
                name: control.name,
                attrs: {},
                children: []
            };
            instance.children.push(instanceTag);
            var bodyTag = {
                name: 'group',
                attrs: {},
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
                bodyTag.attrs.appearance = 'field-list';
            }

            // deal with children
            _.each(control.children, function(child)
            { 
                parseControl(child, xpath + control.name + '/', instanceTag, translations, model, bodyTag, relevance);
            });
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
                'ref': control.destination || (xpath + control.name)
            },
            children: []
        };
        body.children.push(bodyTag);

        // binding
        var binding = {
            name: 'bind',
            attrs: {
                'nodeset': control.destination || (xpath + control.name)
            }
        }
        model.children.push(binding);

        // relevance string
        if (relevance === undefined)
            relevance = [];

        // constraint string
        var constraint = [];

        // deal with input type:
        if (control.type == 'inputText')
            binding.attrs.type = 'string';
        else if (control.type == 'inputNumeric')
        {
            if (control.kind == 'Integer')
                binding.attrs.type = 'int';
            else if (control.kind == 'Decimal')
                binding.attrs.type = 'decimal';
        }
        else if (control.type == 'inputDate')
            binding.attrs.type = 'date';
        else if (control.type == 'inputLocation')
            binding.attrs.type = 'geopoint';
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

        // text length
        if ((control.length !== undefined) && (control.length !== false))
        {
            constraint.push('regex(., "^.{' + control.length.min + ',' + control.length.max + '}$")');
            invalidText = 'Response length must be between ' + control.length.min + ' and ' + control.length.max;
        }

        // numeric/date range
        if ((control.range !== undefined) && (control.range !== false))
        {
            constraint.push('. ' +
                (control.range.minInclusive ? '&gt;=' : '&gt;') + ' ' +
                xmlValue(control.range.min) + ' and . ' +
                (control.range.maxInclusive ? '&lt;=' : '&lt;') + ' ' +
                xmlValue(control.range.max));
            invalidText = 'Value must be between ' + control.range.min + ' and ' + control.range.max;
        }

        // media kind
        if (control.type == 'inputMedia')
            bodyTag.attrs.mediatype = control.kind.toLowerCase() + '/*';

        // options
        if (control.options !== undefined)
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

        // advanced relevance
        if (control.relevance !== '')
            relevance.push(control.relevance);
        // advanced constraint
        if (control.constraint !== '')
            constraint.push(control.constraint);

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
            addTranslation(control.label, xpath + control.name + ':constraintMsg', translations);
        }
        else if (invalidText !== null)
        {
            binding.attrs['jr:constraintMsg'] = invalidText;
        }
    };
    var internalToXForm = function(internal)
    {
        // basic structure
        // TODO: user-config of instanceHead
        var instanceHead = {
            name: 'data',
            attrs: {
              'id': 'build_' + $.sanitizeString($('.header h1').text()) +
                    '_' + Math.round((new Date()).getTime() / 1000)
            },
            children: []
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
                'xmlns:ev': 'http://www.w3.org/2001/xml-events',
                'xmlns:xsd': 'http://www.w3.org/2001/XMLSchema',
                'xmlns:jr': 'http://openrosa.org/javarosa'
            },
            children: [
                {   name: 'h:head',
                    children: [
                        {   name: 'h:title',
                            val: internal.title },
                        model
                    ] },
                body
            ]
        };

        _.each(odkmaker.i18n.activeLanguages(), function(language)
        {
            translations.children.push({
                name: 'translation',
                attrs: {
                    'lang': language
                },
                children: []
            });
        });

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
            return result + obj + '\n';

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
            result += '>\n';
            _.each(obj.children, function(child)
            {
                result += JSONtoXML(child, indentLevel + 1);
            });
            result += generateIndent(indentLevel) + '</' + obj.name + '>\n';
        }
        else
        {
            result += '/>\n';
        }

        return result;
    };
    var xmlEncode = function(value)
    {
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

