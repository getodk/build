/*
 * kor.events - criteria-based events microframework.
 *  clint tseng (clint@dontexplain.com) - 2011-06-30
 *   Licensed under the WTFPL (http://sam.zoy.org/wtfpl). Do what
 *   you want, but please do let me know what you think.
 */

;(function()
{
// internal data structures
    var byVerb = {},
        bySubject = {},
        byEvent = {},
        uuid = 0;

// base object and methods
    var korevents = {};

    korevents['listen'] = function(options)
    {
        // pull out everything we need multiple times up front
        var subject = options['subject'],
            verb = options['verb'],
            args = options['args'];

        // construct our own event representation, in case
        var id = uuid++,
            eventSignature = {
                's': subject,
                'v': verb,
                'p': options['priority'],
                'a': args,
                'i': id,
                'c': options['callback']
            };

        var targetRegistry;
        if (isUndefined(subject))
            // no subject; just add to the global registry
            targetRegistry = byVerb;
        else
            // add to the subject-specific registry
            targetRegistry = deepGet(true, bySubject, getSubjectKey(subject));

        var targetRegistryByVerb = targetRegistry[verb];
        if (isUndefined(targetRegistryByVerb))
            targetRegistryByVerb = targetRegistry[verb] = { 'all': {}, 'arg': {} };

        // go through args; add to global/verb args registry
        if (!isUndefined(args))
            for (var arg in args)
                deepGet(true, targetRegistryByVerb, 'arg', arg)[id] = eventSignature;

        // add to global verb events registry
        targetRegistryByVerb['all'][id] = eventSignature;

        // keep track of the event so that we can pull it up later
        byEvent[id] = eventSignature;

        // give them a ticket number
        return id;
    };

    var fire = korevents['fire'] = function(options)
    {
        if (isUndefined(options))
            throw new Error('need to provide options to fire on!');

        var subject = options['subject'],
            verb = options['verb'],
            args = options['args'];

        // basic validation
        if (verb == null) // or undef
            throw new Error('need to provide a verb at minimum!');

        // keep track of valid arg matches per registration
        var matches = {};

        // first, grab the global subscribers to this verb
        var globalRegistry = deepGet(byVerb, verb) || { 'all': {}, 'arg': {} };
        var subscribers = getValues(globalRegistry['all']);

        // next, look at subject subscribers to the verb if necessary
        if (!isUndefined(subject))
        {
            var subjectKey = getSubjectKey(subject);
            var subjectRegistry = deepGet(bySubject, subjectKey, verb);

            if (!isUndefined(subjectRegistry))
                getValues(subjectRegistry['all'], subscribers);
        }

        // make sure we have anything to talk about at all
        if (subscribers.length === 0)
            return true;

        // now filter down the possible set to the matched set if necessary
        if (!isUndefined(args))
        {
            for (var arg in args)
            {
                var argValue = args[arg],
                    argSubscribers = getValues(globalRegistry['arg'][arg]);

                if (!isUndefined(subject))
                    getValues(subjectRegistry['arg'][arg], argSubscribers);

                for (var i = 0; i < argSubscribers.length; i++)
                {
                    var subscriber = argSubscribers[i];
                    if (argValue === subscriber['a'][arg])
                        matches[subscriber['i']] = (matches[subscriber['i']] || 0) + 1;
                }
            }
        }

        // sort by priority
        subscribers.sort(function(a, b)
        {
            var aPri = a['p'] || keyCount(a['a']),
                bPri = b['p'] || keyCount(b['a']);

            var result = bPri - aPri;
            if (result !== 0)
                return result;
            return a['i'] - b['i'];
        });

        // call on those that matched the filter
        for (var i = 0; i < subscribers.length; i++)
        {
            var subscriber = subscribers[i];

            if ((matches[subscriber['i']] || 0) < keyCount(subscriber['a']))
                continue;

            if (subscriber['c'](options) === false)
                return false;
        }
        return true;
    };

    korevents['derez'] = function(subject)
    {
        var result = fire({
            'subject': subject,
            'verb': 'derez'
        });

        delete bySubject[getSubjectKey(subject)];

        return result;
    };

    korevents['unlisten'] = function(eventId)
    {
        var eventSignature = byEvent[eventId];

        if (isUndefined(eventSignature))
            throw new Error('No event found by this id!');

        var targetRegistry;
        if (isUndefined(eventSignature['s']))
            targetRegistry = byVerb[eventSignature['v']];
        else
            targetRegistry = bySubject[getSubjectKey(eventSignature['s'])][eventSignature['v']];

        delete targetRegistry['all'][eventId];

        for (var arg in eventSignature['args'])
            delete targetRegistry['arg'][arg][id];

        delete byEvent[eventId];

        return eventSignature;
    };

    korevents['unlistenAll'] = function()
    {
        byVerb = {};
        bySubject = {};
        byEvent = {};
    };

// utility
    var isUndefined = function(obj) { return obj === void 0; };

    // gets the values of a hash as an array. can take
    // an array to put the values into.
    var getValues = function(obj, arr)
    {
        var result = arr || [];

        if (obj != null) // or undef
            for (var key in obj)
                result.push(obj[key]);

        return result;
    };

    // counts the number of keys an obj has
    var keyCount = function(obj)
    {
        if (obj == null) // or undef
            return 0;

        var result = 0;
        for (var key in obj)
            result++;
        return result;
    };

    // goes to a deep location in an object. pass in true
    // as the first arg to force creation of undefined
    // objects on the way to your destination.
    var deepGet = function(/* [create], obj, keys* */)
    {
        var idx = 0;
        var create = false;

        if (arguments[0] === true)
        {
            idx++;
            create = true;
        }

        var obj = arguments[idx++];

        for (; idx < arguments.length; idx++)
        {
            var key = arguments[idx];
            if (isUndefined(obj[key]))
                if (!create)
                    return undefined;
                else
                    obj[key] = {};

            obj = obj[key];
        }

        return obj;
    };

    // creates a subject key if it does not exist; returns
    // the key whether created or not.
    var getSubjectKey = function(subject)
    {
        var result,
            keKey = korevents['key'] || '_kor_events_key';

        if (!isUndefined(subject['jquery']))
        {
            if (isUndefined(result = subject.data(keKey)))
                subject.data(keKey, result = uuid++);
        }
        else
        {
            if (isUndefined(result = subject[keKey]))
                result = subject[keKey] = uuid++;
        }
        return result;
    };

// setup!
    var root = this;

    if ((typeof module !== 'undefined') && module['exports'])
    {
        // export to commonjs/node module if we see one, for unit tests
        // (kind of silly to add an events system to nodejs, no?)
        module['exports'] = korevents;
    }
    else
    {
        // otherwise, install ourselves in kor.events in the root namespace
        var kor = root['kor'];
        if (isUndefined(kor))
            kor = root['kor'] = {};

        kor['events'] = korevents;
    }
})();

