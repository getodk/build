;(function()
{

    var validationNS = odkmaker.namespace.load('odkmaker.validation');

    // some util funcs:
    var isEmpty = function(val) { return (val == null) || (val === ''); };
    var xmlLegalChars = function(val) { return _.isString(val) && /[^0-9a-z_.-]/i.test(val); };
    var alphaStart = function(val) { return _.isString(val) && /^[^a-z]/i.test(val); };

    // the actual definitions:
    validationNS.limits = {
        required: {
            given: [ 'self' ],
            then: function(self) { return isEmpty(self); },
            message: 'This property is required.'
        },
        xmlLegalChars: {
            given: [ 'self' ],
            then: function(self) { return xmlLegalChars(self); },
            message: 'Only letters, numbers, -, _, and . are allowed.'
        },
        alphaStart: {
            given: [ 'self' ],
            then: function(self) { return alphaStart(self); },
            message: 'The first character must be a letter.'
        },
        unique: {
            given: [ 'self', { scope: 'all', property: 'self' } ],
            then: function(self, all)
            {
                // we expect to see one instance of self in all, which is the
                // very instance we are validating. but if we see two we're in
                // trouble.
                return _.filter(all, function(it) { return self === it; }).length > 1;
            },
            message: 'This property must be unique; there is another control that conflicts with it.'
        },
        fieldListChildren: {
            given: [ { scope: 'self', property: 'fieldList' }, { scope: 'children', get: 'type' } ],
            then: function(fieldList, childTypes)
            {
                if (fieldList !== true) return false; // we don't care unless we're a fieldList.
                return _.any(childTypes, function(type) { return type === 'group' || type === 'loop'; });
            },
            message: 'A group may not be Display On One Screen if it has groups or loops within it.'
        },
        underlyingRequired: {
            given: [ 'self' ],
            then: function(options)
            {
                if (options == null) return false;
                return _.any(options, function(option) { return isEmpty(option.val); });
            },
            message: 'One or more Underlying Value has not been provided; they are required.'
        },
        underlyingLegal: {
            given: [ 'self' ],
            then: function(options)
            {
                if (options == null) return false;
                return _.any(options, function(option) { return xmlLegalChars(option.val); });
            },
            message: 'One or more Underlying Value contains invalid characters: only letters, numbers, -, _, and . are allowed.'
        },
        hasOptions: {
            given: [ 'self' ],
            then: function(options)
            {
                return (options != null) && (options.length === 0);
            },
            message: 'At least one option is required.',
            immediate: true
        },
        fieldListExpr: {
            given: [ 'self', { scope: 'parents', property: 'fieldList' } ],
            then: function(expr, parentFLs)
            {
                if (isEmpty(expr)) return false;
                return _.any(parentFLs, function(fl) { return fl === true; });
            },
            severity: 'warning',
            message: 'Because this control is within a single-screen group (field list), any expressions that reference other fields in the same group will not work.'
        }
    };

})();

