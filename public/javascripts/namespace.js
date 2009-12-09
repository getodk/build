/**
 *  namespace.js - get off my lawn!
 *    Manages namespaces. Go figure.
 */

if (!odkmaker)
    var odkmaker = {};
if (!odkmaker.namespace)
    odkmaker.namespace = {};

odkmaker.namespace.load = function(namespace)
{
    var namespaceSplit = namespace.split('.');
    var result = window;
    for (var i = 0; i < namespaceSplit.length; i++)
    {
        var n = namespaceSplit[i];
        if (!result[n])
        {
            result[n] = {};
        }
        result = result[n];
    }
    return result;
};