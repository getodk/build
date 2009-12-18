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
        $.each($control.data('odkControl-properties'), function()
        {
            data[this.name] = this.value;
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
                data.children = extractRecurse($this.children('.workspaceInner'));
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
            title: $('h2').text(),
            controls: extractRecurse($('.workspace'))
        };
    };
    
    // massages the output JSON into a structure representing an XForm
    var controlTypes = {
        inputText: 'input',
        inputNumeric: 'input',
        inputDate: 'input',
        inputSelectOne: 'select1',
        inputSelectMany: 'select'
    };
    var addTranslation = function(obj, itextPath, translations)
    {
        $.each(translations.children, function()
        {
            this.children.push({
                name: 'text',
                attrs: {
                    'id': itextPath
                },
                children: [
                    { name: 'value',
                      val: obj[this.attrs.lang] }
                ]
            });
        })
    };
    var parseControl = function(control, xpath, relpath, instance, translations, model, body, relevanceString)
    {
        // TODO: grouping
        instance.children.push({
            name: control.Name
        });

        // control markup
        var bodyTag = {
            name: controlTypes[control.type],
            attrs: {
                'ref': (control['Instance Destination'] === '') ? (relpath + control.Name) : control['Instance Destination']
            },
            children: []
        };

        // binding
        var binding = {
            name: 'bind',
            attrs: {
                'nodeset': (control['Instance Destination'] === '') ? (xpath + control.Name) : control['Instance Destination']
            }
        }

        // relevance string
        if (relevanceString === undefined)
            relevanceString = '';

        // constraint string
        var constraintString = '';

        // deal with input type:
        if (control.type == 'inputText')
            binding.attrs.type = 'string';
        else if (control.type == 'inputNumeric')
            if (control.Kind == 'Integer')
                binding.attrs.type = 'int';
            else if (control.Kind == 'Decimal')
                binding.attrs.type = 'decimal';
        else if (control.type == 'inputDate')
            binding.attrs.type = 'date';

        // deal with properties:

        // label
        bodyTag.children.push({
            name: 'label',
            attrs: {
                'ref': "jr:itext('" + xpath + control.Name + ":label')"
            }
        });
        addTranslation(control.Label, xpath + control.Name + ':label', translations);

        // hint
        if (control.Hint !== undefined)
        {
            bodyTag.children.push({
                name: 'hint'
                attrs: {
                    'ref': "jr:itext('" + xpath + control.Name + ":hint')"
                }
            });
            addTranslation(control.Hint, xpath + control.Name + ':hint', translations);
        }

        // read only
        if (control['Read Only'] === true)
            binding.attrs.readonly = 'true()';

        // required
        if (control.Required === true)
            binding.attrs.required = 'true()';

        // options
        if (control.Options !== undefined)
            $.each(control.Options, function(i)
            {
                var itextPath = xpath + control.Name + ':option' + i;
                addTranslation(this, itextPath, translations);

                bodyTag.children.push({
                    name: 'item',
                    children: [
                        {   name: 'label',
                            attrs: {
                                'ref': itextPath
                            } },
                        {   name: 'value',
                            val: this.val }
                    ]
                });
            });

        body.children.push(bodyTag);

        // advanced relevance
        if (control.Relevance !== '')
            if (relevanceString === '')
                relevanceString = control.Relevance;
            else
                relevanceString = '(' + relevanceString + ') and (' + control.Relevance + ')';
        // advanced constraint
        if (control.Constraint !== '')
            if (constraintString === '')
                constraintString = control.Constraint;
            else
                constraintString = '(' + constraintString + ') and (' + control.Constraint + ')';
    };
    var internalToXForm = function(internal)
    {
        // basic structure
        // TODO: user-config of instanceHead
        var instanceHead = {
            name: 'data',
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

        $.each(odkmaker.i18n.activeLanguages(), function()
        {
            translations.children.push({
                name: 'translation',
                attrs: {
                    'lang': this
                },
                children: []
            });
        });

        $.each(internal.controls, function() { parseControl(this, '/data/', '', instanceHead, translations, model, body); });

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

        result += '<' + obj.name;

        if (obj.attrs !== undefined)
            $.each(obj.attrs, function(key, value)
            {
                result += ' ' + key + '="' + value + '"';
            });

        if (obj.val !== undefined)
        {
            result += '>' + obj.val + '</' + obj.name + '>\n';
        }
        else if (obj.children !== undefined)
        {
            result += '>\n';
            $.each(obj.children, function()
            {
                result += JSONtoXML(this, indentLevel + 1);
            });
            result += generateIndent(indentLevel) + '</' + obj.name + '>\n';
        }
        else
        {
            result += '/>\n';
        }

        return result;
    };

    // Kick it off
    odkmaker.data.serialize = function()
    {
        return JSONtoXML(internalToXForm(odkmaker.data.extract()));
    };
})(jQuery);
