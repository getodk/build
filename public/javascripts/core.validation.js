/**
 *  validation.js - the engine that powers validations.
 *
 *  This is the core code that makes validations work. If you have found a bug
 *  in how validations are handled or wish to extend the functionality available
 *  to validation declarations, this is the place. If you wish to adjust how a
 *  particular validation works or add a new kind of validation, you are looking
 *  for impl.validation.js.
 *
 *  This file is largely grouped into three parts:
 *  * The first section is some utility code and data structures that the rest
 *    of the code depends on.
 *  * The second section is a series of subscription functions that take a context
 *    and a callback and calls the callback whenever the specified scope changes.
 *    Each subscription returns a function you can call to stop said subscription.
 *  * The final section glues the above two together along with some additional
 *    business logic to actually track and manage controls and their validations,
 *    as well as process the higher-level definition structures from impl.validation.js.
 */

;(function($)
{
    var validationNS = odkmaker.namespace.load('odkmaker.validation');

    // the evented collection tracks and notifies on changes to a collection of
    // controls. this lets controls easily subscribe to a class of its peers.
    var EventedCollection = function(initial)
    {
        this.controls = (initial == null) ? [] : initial;
        this.listeners = [];
    };
    EventedCollection.prototype = {
        add: function(control)
        {
            var self = this;
            this.controls.push(control);
            _.each(this.listeners, function(listener) { listener(self.controls, control, 'add'); });
        },
        remove: function(control)
        {
            var self = this;
            var removed = $.removeFromArray(control, this.controls);
            if (removed != null)
                _.each(this.listeners, function(listener) { listener(self.controls, removed, 'remove'); });
        },
        handle: function(f) { this.listeners.push(f); },
        unhandle: function(f) { $.removeFromArray(f, this.listeners); }
    };

    // here we provide some functions for subscribing to different classes of
    // controls.
    var allControls = new EventedCollection();
    var peerControls = {};

    // this subscription is automatic and gets you all controls.
    var subscribeAll = function(f)
    {
        allControls.handle(f);
        return function() { allControls.unhandle(f); };
    };
    $('.workspace')
      .delegate('.control', 'odkControl-added', function(event) { if (this === event.target) allControls.add(event.target); })
      .delegate('.control', 'odkControl-removing', function(event) { allControls.remove(event.target); });

    // this subscription gets you all children of a control at its hierarchy level.
    // if the given control is the workspace, it gets you all root-level controls.
    var subscribeChildren = function($parent, f)
    {
        var ec = null;
        var selector = null;
        var parentId = null;

        if ($parent.length === 0)
        {
            $parent = $('.workspace');
            selector = '> .control';
            parentId = 'root';
        }
        else
        {
            selector = '> .workspaceInnerWrapper > .workspaceInner > .control';
            parentId = $parent.data('odkControl-id');
        }

        if ((ec = peerControls[parentId]) == null)
        {
            // create the tracking collection.
            ec = peerControls[parentId] = new EventedCollection($parent.find(selector));

            // listen for changes.
            var parent = $parent.get(0);
            $parent.delegate('.control', 'odkControl-added', function(event)
            {
                var $target = $(event.target);
                if ($target.parent().closest('.control, .workspace').get(0) === parent) ec.add(event.target);
            });
            $parent.delegate('.control', 'odkControl-removing', function(event)
            {
                ec.remove(event.target);
            });
        }

        ec.handle(f);
        return function() { ec.unhandle(f); };
    };

    // this subscription gets you all siblings of a control at its hierarchy level.
    // if the control is moved, the update is handled.
    var subscribeSiblings = function($control, f)
    {
        // we mostly rely on subscribeChildren; we just have to change what parent
        // we're subscribed to based on where we end up.
        var lastUnhandler = null; // unlisten to the last parent when we get a new one.

        var gotParent = function()
        {
            if (lastUnhandler != null) lastUnhandler();
            var $parent = $control.closest('.control, .workspace');
            if ($parent.length > 0) lastUnhandler = subscribeChildren($parent, f);
        };
        gotParent();

        var id = _.uniqueId();
        $control.bind('odkControl-added', gotParent)
            .bind('odkControl-removed', gotParent);

        return function()
        {
            $control.unbind('odkControl-added', gotParent)
                .unbind('odkControl-removed', gotParent);
        };
    };

    // this subscription gets you all parents of a control.
    var subscribeParents = function($control, f)
    {
        var stopped = false;
        $control.bind('odkControl-added', function() { if (!stopped) f($control.parents('.control')); });
        $control.bind('odkControl-removed', function() { if (!stopped) f($control.parents('.control')); });
        return function() { stopped = true; };
    };

    // to save on binding/unbinding time, we bind exactly once to every single control
    // for the odkControl-propertiesUpdated event, and have an internal routing mechanism
    // to distribute the event where needed.
    // the routing information is stored in propertiesRouting; the first level of keys is
    // the name of the property itself, the second level is the id reference of the interested
    // handler, and the third level is the ids of the in-scope controls.
    allControls.handle(function(controls, delta, type)
    {
        var $delta = $(delta);
        if (type == 'add')
            $delta.bind('odkControl-propertiesUpdated.validation', propertiesUpdated($delta));
        else if (type == 'remove')
            $delta.unbind('odkControl-propertiesUpdated.validation');
    });
    var propertiesRouting = {};
    var propertiesUpdated = function($control) { return _.throttle(function(event, propertyName)
    {
        var forProperty = propertiesRouting[propertyName];
        if (forProperty == null) return;

        var cid = $control.data('odkControl-id');
        for (var hid in forProperty)
            if (forProperty[hid][cid] === true)
                forProperty[hid].f();
    }, 100); };

    // subscribe creates interests. each validation can require as many interests as
    // it needs in order to properly process its validation. each interest can
    // consist of a property, the type, or the whole control of a scoped class
    // of its peer controls.
    var globalSubscriptionCache = {};
    var subscribe = function($control, scope, type, param, f)
    {
        // before we begin we check if we are a cacheable global scope subscription.
        if ((scope === 'all') && (type === 'property'))
        {
            if (globalSubscriptionCache[param] == null)
            {
                // not yet a subscription for this param type; register the given f and
                // replace it with our own handler.
                globalSubscriptionCache[param] = [ f ];
                f = function(xs) { globalSubscriptionCache[param].forEach(function(f) { f(xs); }); };
            }
            else
            {
                globalSubscriptionCache[param].push(f);
                return;
            }
        }

        // first we figure out what to do with the controls we get back. this is
        // dependent on the type.
        var handle = null;
        if (type === 'control')
            handle = function(controls) { f($(controls)); };
        else if (type === 'property')
        {
            var go = null;
            var scheduled = false;
            var id = _.uniqueId();
            propertiesRouting[param] = propertiesRouting[param] || {};
            propertiesRouting[param][id] = {};

            handle = function(controls, delta, type) {
                if (type == 'add')
                    propertiesRouting[param][id][$(delta).data('odkControl-id')] = true;
                else if (type == 'remove')
                    delete propertiesRouting[param][id][$(delta).data('odkControl-id')];
                else
                    _.each(controls, function(control) { propertiesRouting[param][id][$(control).data('odkControl-id')] = true; });

                propertiesRouting[param][id].f = go = function()
                {
                    // if we have been reaped since our check was scheduled (eg by an open-form op), bail.
                    if ((controls.length > 0) && !document.body.contains(controls[0])) return;

                    f(_.map(controls, function(control) { return $(control).data('odkControl-properties')[param].value; }));
                    scheduled = false;
                };

                if (scheduled === false)
                {
                    _.defer(go);
                    scheduled = true;
                }
            };
        }
        else if (type === 'type')
            handle = function(controls) { f(_.map(controls, function(control) { return $(control).data('odkControl-type'); })); };
        else
          throw new Error('unknown validation subscription type.');

        // now we figure out when to call the handler.
        var stop = null;
        if (scope === 'all')
            stop = subscribeAll(handle);
        else if (scope === 'children')
            stop = subscribeChildren($control, handle);
        else if (scope === 'siblings')
            stop = subscribeSiblings($control, handle);
        else if (scope === 'parents')
            stop = subscribeParents($control, handle);
        else if (scope === 'self')
        {
            stop = function() {};
            var g = f;
            f = function(xs) { return g((xs == null) ? null : xs[0]); };
            handle($control);
        }
        else
            throw new Error('unknown validation scope type.');

        return stop;
    };

    // now we finally start getting higher-level. here we take a named or custom
    // validation and apply it to the control as appropriate.
    var validate = function($control, property, validation)
    {
        // first find our object.
        var validationObj = validationNS.validations[validation] || validation;
        if ((validationObj == null) || (validationObj.given == null) || (validationObj.check == null))
            throw new Error('unknown validation specified!');

        // now translate syntactic sugar into our more-formal expectations.
        validationObj = $.extend(true, {}, validationObj);
        _.each(validationObj.given, function(it, idx)
        {
            if (it === 'self')
                it = validationObj.given[idx] = { scope: 'self', type: 'property', param: property.id };
            else if (it.property != null)
            {
                it.type = 'property';
                it.param = (it.property === 'self') ? property.id : it.property;
                delete it.property;
            }
            else if (it.get != null)
            {
                it.type = it.get;
                delete it.get;
            }
        });

        // now for each given we want to subscribe, and whenever any subscription
        // updates we want to call the validation code.
        var params = [];
        _.each(validationObj.given, function(it, idx)
        {
            subscribe($control, it.scope, it.type, it.param, function(x)
            {
                params[idx] = x;
                apply();
            });
        });

        // if the property has a bindDisplayIf we'll automagically create subscriptions
        // to track that binding and not bother validating if the property is hidden.
        var displayed = true;
        if (property.bindDisplayIf != null)
        {
            // TODO: duplicated from property-editor.js. if this logic continues to
            // evolve we should consolidate. but js has no tuple type so it's not obvious
            // how to do so.
            var bdiKey, bdiValues;
            if (_.isString(property.bindDisplayIf))
            {
                bdiKey = property.bindDisplayIf;
                bdiValues = [ true ];
            }
            else
            {
                bdiKey = _.keys(property.bindDisplayIf)[0];
                bdiValues = property.bindDisplayIf[bdiKey];
                if (!_.isArray(bdiValues)) { bdiValues = [ bdiValues ]; }
            }

            subscribe($control, 'self', 'property', bdiKey, function(value)
            {
                displayed = _.contains(bdiValues, value);
                apply();
            });
        }

        var lastFailed = false;
        var apply = function()
        {
            if (displayed === false)
            {
                if (lastFailed === true)
                {
                    lastFailed = result.failed = false;
                    $control.trigger('odkControl-validationChanged', [ property, false ]);
                }
                return;
            }

            var passed;
            if ((validationObj.prereq != null) && (validationObj.prereq.apply(null, params) !== true))
                passed = true; // bail out if we fail the precondition.
            else
                passed = validationObj.check.apply(null, params);

            //console.log('%c' + property.id + ': ' + validation + ' -> ' + passed, 'color:' + (passed === false ? 'red;font-weight:bold' : '#444'));

            result.failed = !passed;
            result.isWarning = (validationObj.warning === true);
            if (lastFailed !== result.failed) $control.trigger('odkControl-validationChanged', [ property, (result.failed && !result.isWarning) ]);
            lastFailed = result.failed;
        };

        var result = { property: property, validation: validationObj, failed: false };
        return result;
    };

    // whenever a control is added we'll want to examine its properties and start
    // tracking the validity.
    var controlCreated = function($control, properties)
    {
        // pull up the validations attached to this control:
        var validations = [];
        _.each(properties, function(property, name)
        {
            if ((name !== 'metadata') && (property.validation != null))
                _.each(property.validation, function(validation)
                {
                    var validation = validate($control, property, validation);
                    property.validations.push(validation);
                    validations.push(validation);
                });
        });
        $control.data('odkControl-validations', validations);
    };
    validationNS.controlCreated = controlCreated;

    var controlDestroyed = function($control) { allControls.remove($control); };
    validationNS.controlDestroyed = controlDestroyed;

})(jQuery);

