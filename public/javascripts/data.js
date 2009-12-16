/**
 *  data.js - extractor extraordinaire
 *    Pulls out a properly structured, hierarchical tree
 *    of the control data of the form.
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
            else if (data.type = 'branch')
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
})(jQuery);
